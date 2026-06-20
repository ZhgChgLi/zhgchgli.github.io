#!/usr/bin/env python3
"""
Build the in-article affiliate-product ad pool from the KKPartnerItems GAS
endpoint (KKday products crawled daily into a "推薦結果" sheet).

Mirrors tools/translators/ad_maker.py (the momo flow) but the source is a JSON
endpoint, not a CSV. The endpoint returns ALL products with no server-side
filtering, so this script does the filtering:

  * 售價 < 500 元 (or non-TWD / unparseable) → dropped.
  * 商品連結 → the card click-through, with the affiliate ?cid=19365 appended
    (repo convention; momory feedback_kkday_execution_rules).
  * 圖片 → the single product image, downloaded and converted to
    assets/ads/kkday/<id>-0.webp (same download flow as ad_maker).
  * 條件名稱 → kept as a `conditions` list per product so _layouts/post.html can
    show products whose condition is contained in the article title first, and
    fall back to all products otherwise. The same product can appear under
    several conditions in the feed; we de-duplicate by 商品連結 and merge the
    conditions, so each image is downloaded once.
  * promo (card description) is composed from the feed fields
    (城市/目的地・⭐評分（評論數 則評論）); the feed has no description column and
    we don't scrape the kkday page.

Writes _data/kkday_ad_products.json (keyed by a stable hash of 商品連結).
Consumed at build time by _layouts/post.html (zh-tw only) + the shared
assets/js/ad-rotator.js, exactly like the momo pool.

No OpenAI / API key needed — pure fetch + image download. A product is published
only when it has name + an image (price is filtered above). Images are cached: a
product already carrying a downloaded image is reused on re-run; CSV-like fields
(name / price / promo / conditions / deadline) are always refreshed. Products no
longer in the feed are removed (and their images deleted). Per-product failures
are isolated and never abort the batch.

Usage:
    python3 tools/translators/kkday_ad_maker.py
"""
import glob
import hashlib
import io
import json
import os
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RESULT_PATH = os.path.join(ROOT, "_data", "kkday_ad_products.json")
IMG_DIR = os.path.join(ROOT, "assets", "ads", "kkday")

# KKPartnerItems GAS web-app endpoint (hardcoded).
DEFAULT_ADS_URL = (
    "https://script.google.com/macros/s/"
    "AKfycby4J1spf2W0Ahq6RrRXGHSPiDouFTmo4q-ZCKsUK_1FcFGHLZrATa1HjR0pDUAOvhk5/exec"
)

# KKday affiliate cid — always appended to the product link (repo convention).
CID = "19365"

# Exclude products cheaper than this (TWD), per the requirement.
MIN_PRICE = 500

# Synthetic deadline window: the feed has no campaign deadline, so give each
# product (updatedAt + N days). ad-rotator.js needs a data-deadline to show a
# card; this also makes ads vanish on their own if the feed ever stops updating.
DEADLINE_DAYS = 7

# Hard cap on the card description so a long composed string can't blow up the
# layout.
DESC_MAXLEN = 90

# Gentle pause between image downloads.
SLEEP_SEC = 0.3

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

# kkday's image CDN serves valid certs, but reuse a relaxed TLS context (as
# ad_maker does for momo) so a transient cert quirk never drops a frame. The
# images are public, non-sensitive assets.
_IMG_SSL = ssl.create_default_context()
_IMG_SSL.check_hostname = False
_IMG_SSL.verify_mode = ssl.CERT_NONE


def slug_for(url):
    return hashlib.sha1(url.strip().encode("utf-8")).hexdigest()[:12]


def with_cid(product_url):
    """Append the affiliate cid to the product link. Leave it alone if a cid is
    already present; use '&' when the URL already has a query string."""
    if re.search(r"[?&]cid=", product_url):
        return product_url
    sep = "&" if "?" in product_url else "?"
    return f"{product_url}{sep}cid={CID}"


def price_num(raw):
    """Integer price for the >=500 comparison. The feed gives a number (502) but
    tolerate a formatted string ('2,680' / 'NT$2,680'). None when unparseable."""
    digits = re.sub(r"[^\d]", "", str(raw if raw is not None else "").split(".")[0])
    return int(digits) if digits else None


def normalize_price(raw):
    """Display price string. A bare number → 'NT$502'; a value already carrying a
    currency mark is kept verbatim; blank stays blank (card hides the price)."""
    s = str(raw if raw is not None else "").strip()
    if not s:
        return ""
    if re.search(r"[$＄]|NT|元|TWD", s, re.I):
        return s
    digits = re.sub(r"[^\d]", "", s.split(".")[0])
    return ("NT$" + format(int(digits), ",")) if digits else s


def build_promo(item):
    """Card description from feed fields (no description column / no page
    scraping): just 城市/目的地. Rating stars and review counts are intentionally
    omitted."""
    promo = str(item.get("城市/目的地", "") or "").strip()
    if len(promo) > DESC_MAXLEN:
        promo = promo[:DESC_MAXLEN].rstrip() + "…"
    return promo


def deadline_iso(updated_at):
    """updatedAt date (+ DEADLINE_DAYS) as ISO YYYY-MM-DD; today as fallback."""
    s = str(updated_at or "").strip()
    m = re.match(r"(\d{4})-(\d{1,2})-(\d{1,2})", s)
    base = None
    if m:
        try:
            base = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            base = None
    if base is None:
        base = datetime.now()
    return (base + timedelta(days=DEADLINE_DAYS)).strftime("%Y-%m-%d")


def fetch_ads(url):
    """Fetch the GAS endpoint JSON (urllib follows Google's 302 redirect)."""
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8", "replace"))


def _download_webp(img_url, out_path, retries=3):
    """Download one image → webp (RGB, max 1200, q80). Retries with backoff."""
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(img_url, headers={
                "User-Agent": UA, "Referer": "https://www.kkday.com/"})
            with urllib.request.urlopen(req, timeout=25, context=_IMG_SSL) as resp:
                raw = resp.read()
            with Image.open(io.BytesIO(raw)) as img:
                img = img.convert("RGB")
                img.thumbnail((1200, 1200), Image.LANCZOS)
                img.save(out_path, format="WEBP", quality=80, method=6, optimize=True)
            return
        except Exception as e:  # noqa: BLE001 — retry transient network errors
            last = e
            time.sleep(0.6 * (attempt + 1))
    raise last


def cleanup_images(ad_id):
    """Remove every saved frame for a product (multi-image + legacy single)."""
    for f in glob.glob(os.path.join(IMG_DIR, f"{ad_id}-*.webp")):
        os.remove(f)
    legacy = os.path.join(IMG_DIR, f"{ad_id}.webp")
    if os.path.exists(legacy):
        os.remove(legacy)


def group_products(items):
    """De-duplicate feed rows by 商品連結 (the same product appears under several
    conditions). Returns ordered list of (ad_id, item, conditions[]) for rows
    that pass the price / currency gate."""
    products = {}
    order = []
    skipped_price = 0
    for it in items:
        name = str(it.get("商品名稱", "") or "").strip()
        product_url = str(it.get("商品連結", "") or "").strip()
        if not name or not product_url:
            continue
        currency = str(it.get("幣別", "") or "").strip().upper()
        if currency and currency != "TWD":
            print(f"⏭ 非 TWD，略過：{name}（{currency}）")
            continue
        pnum = price_num(it.get("售價"))
        if pnum is None or pnum < MIN_PRICE:
            skipped_price += 1
            continue

        ad_id = slug_for(product_url)
        cond = str(it.get("條件名稱", "") or "").strip()
        if ad_id not in products:
            products[ad_id] = {"item": it, "conditions": []}
            order.append(ad_id)
        if cond and cond not in products[ad_id]["conditions"]:
            products[ad_id]["conditions"].append(cond)

    print(f"⏭ 售價 < {MIN_PRICE} / 無法解析，略過 {skipped_price} 筆")
    return [(ad_id, products[ad_id]["item"], products[ad_id]["conditions"]) for ad_id in order]


def main():
    ads_url = DEFAULT_ADS_URL

    os.makedirs(IMG_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(RESULT_PATH), exist_ok=True)

    if os.path.exists(RESULT_PATH):
        with open(RESULT_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)
    else:
        existing = {}

    try:
        data = fetch_ads(ads_url)
    except Exception as e:  # noqa: BLE001
        print(f"❌ 無法讀取 GAS 廣告來源（{e.__class__.__name__}）：{ads_url}")
        sys.exit(1)

    items = data.get("items") or []
    deadline = deadline_iso(data.get("updatedAt"))
    print(f"📥 GAS 取得 {len(items)} 筆（updatedAt={data.get('updatedAt')}，deadline={deadline}）")

    grouped = group_products(items)
    print(f"🔁 去重後 {len(grouped)} 個商品（售價 ≥ {MIN_PRICE} TWD）")

    results = {}
    for ad_id, it, conditions in grouped:
        name = str(it.get("商品名稱", "") or "").strip()
        product_url = str(it.get("商品連結", "") or "").strip()
        url = with_cid(product_url)
        price = normalize_price(it.get("售價"))
        promo = build_promo(it)

        prev = existing.get(ad_id)
        prev_images = (prev or {}).get("images") or []
        cached_ok = prev_images and all(
            os.path.exists(os.path.join(ROOT, p.lstrip("/"))) for p in prev_images)

        if cached_ok:
            images = prev_images
            print(f"⏭ 已存在，沿用圖片：{name}")
        else:
            img_url = str(it.get("圖片", "") or "").strip()
            cleanup_images(ad_id)
            images = []
            if img_url:
                try:
                    _download_webp(img_url, os.path.join(IMG_DIR, f"{ad_id}-0.webp"))
                    images = [f"/assets/ads/kkday/{ad_id}-0.webp"]
                    print(f"✅ 已處理：{name}")
                except Exception as e:  # noqa: BLE001 — best-effort image download
                    print(f"  ⚠️  抓圖失敗（{e.__class__.__name__}）：{img_url}")
            if not images:
                print(f"⏭ 略過（缺圖片）：{name}")
                continue
            time.sleep(SLEEP_SEC)

        results[ad_id] = {
            "name": name, "price": price, "url": url,
            "deadline": deadline, "images": images, "promo": promo,
            "conditions": conditions,
        }

        # Persist after each product so an interrupt keeps progress.
        with open(RESULT_PATH, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

    # Drop frames for products no longer in the feed.
    for ad_id, item in existing.items():
        if ad_id in results:
            continue
        cleanup_images(ad_id)
        print(f"🗑  移除已下架商品圖：{item.get('name', ad_id)}")

    with open(RESULT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"📄 共 {len(results)} 筆商品，已寫入 {RESULT_PATH}")


if __name__ == "__main__":
    main()
