#!/usr/bin/env python3
"""
Build the in-article affiliate-product ad pool from a published Google Sheet.

Reads a CSV (columns: 商品名稱 / 商品連結 / 推廣連結 / 期限). The PRODUCT link
(商品連結) is the real (desktop) product page — it's scraped for:
  * images — all gallery frames (momo's #GoodsDetailPic_S _R.webp on a classic
    GoodsDetail.jsp page) for the card carousel; images[0] is the main image.
    Falls back to a single og:image when there's no gallery (e.g. TP 賣場 pages);
    saved as assets/ads/<id>-N.webp
  * price — the SALE price: 特價/促銷價 (GoodsDetail.jsp) or .primary-price-value
    (TP 賣場), falling back to 市售價; NT$ prefix, no decimals; blank if not found
  * description — og:description, shown verbatim as the card description
The PROMO link (推廣連結) is the affiliate link, used only as the card's
click-through CTA. Writes _data/ad_products.json (keyed by a stable hash of the
promo URL). Consumed at build time by _layouts/post.html (zh-tw only) +
assets/js/ad-rotator.js.

No OpenAI / API key needed — pure scraping. A product is only published when it
has all of name + at least one image + description; missing any one drops it.
Delisted / nonexistent products (a stub that bounces to Notice.jsp) are detected
and dropped too. Results are cached: a product already present (with images +
description) is skipped on re-run; only its name/deadline are refreshed from the
latest CSV. Products dropped from the CSV are removed (and their images deleted).
Per-product failures are isolated and never abort the batch.

Usage:
    AD_CSV_URL='https://docs.google.com/.../pub?...&output=csv' \
        python3 tools/translators/ad_maker.py
"""
import csv
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

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RESULT_PATH = os.path.join(ROOT, "_data", "ad_products.json")
IMG_DIR = os.path.join(ROOT, "assets", "ads")

# Public published-CSV default; overridable via AD_CSV_URL.
DEFAULT_CSV_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2QvMv0NTbLeUzcCoB-GWz_SRe1mmd"
    "GmQ3PlPHW-EDL2IfHjlO5ohooOQKVEBojhGD7QQ1-CpXbxQK/pub?gid=861335507&single=true&output=csv"
)

# Polite throttle between products (each does one HTML fetch + one image
# fetch). Keep external sites happy.
SLEEP_SEC = 1.5

# Hard cap on the card description so a long og:description can't blow up the
# layout.
DESC_MAXLEN = 90

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

# Browser-like headers — momo serves slow / challenge responses to bare
# requests, which shows up as read TimeoutError. Accept-Language pins the TW
# desktop site. (No Accept-Encoding: urllib won't auto-decompress gzip.)
HTML_HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9",
    "Connection": "close",
}

# momo's image CDN nodes (i1–i4) serve certs missing a Subject Key Identifier,
# which strict OpenSSL refuses ("CERTIFICATE_VERIFY_FAILED"). The images are
# public, non-sensitive assets, so download them over a relaxed TLS context
# rather than dropping frames. HTML is still fetched with full verification.
_IMG_SSL = ssl.create_default_context()
_IMG_SSL.check_hostname = False
_IMG_SSL.verify_mode = ssl.CERT_NONE

# CSV header aliases → canonical field. Tolerates spacing / fullwidth variants.
# `url` = 推廣連結 (affiliate CTA); `product_url` = 商品連結 (scraped for
# image + description).
HEADER_MAP = {
    "商品名稱": "name", "商品名": "name", "name": "name",
    "商品價格": "price", "價格": "price", "price": "price",
    "商品連結": "product_url", "商品網址": "product_url", "product_url": "product_url",
    "推廣連結": "url", "推廣網址": "url", "連結": "url", "url": "url", "link": "url",
    "期限": "deadline", "截止日": "deadline", "deadline": "deadline",
}

def slug_for(url):
    return hashlib.sha1(url.strip().encode("utf-8")).hexdigest()[:12]


def normalize_deadline(raw):
    """Best-effort normalise a date cell to ISO YYYY-MM-DD for client-side
    string comparison. Accepts 2026-07-31, 2026/7/31, 2026.7.31."""
    s = (raw or "").strip()
    m = re.match(r"^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", s)
    if not m:
        return s
    y, mo, d = m.groups()
    return f"{y}-{int(mo):02d}-{int(d):02d}"


def fetch_url(url, binary=False, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    return data if binary else data.decode("utf-8", "replace")


def _first_meta(html, patterns):
    for pat in patterns:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def extract_og_image(html, base_url):
    """Pull og:image / twitter:image from a page's <head>. Returns absolute URL."""
    val = _first_meta(html, [
        r'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'<meta[^>]+name=["\']twitter:image(?::src)?["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\']',
    ])
    return urllib.parse.urljoin(base_url, val) if val else None


def extract_og_description(html):
    """Pull og:description / twitter:description / <meta name=description>."""
    return _first_meta(html, [
        r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']*)["\']',
        r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+property=["\']og:description["\']',
        r'<meta[^>]+name=["\']twitter:description["\'][^>]+content=["\']([^"\']*)["\']',
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)["\']',
        r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']description["\']',
    ]) or ""


def extract_price(html):
    """Product price → 'NT$1,188'. Prefers the SALE price (特價/促銷價), tries:
      1. 特價 / 促銷價 priceTitle attribute (classic GoodsDetail.jsp, camelCase)
      2. .primary-price-value (TP 賣場 pages — already the sale price)
      3. 市售價 priceTitle (fall back to list price when no sale price)
      4. any price="..." attribute / .seoPrice
    Returns '' if nothing is found (the card then hides the price)."""
    m = (re.search(r'priceTitle=["\'](?:特價|促銷價)["\'][^>]*\bprice=["\']([\d,.]+)["\']', html, re.I)
         or re.search(r'class=["\']primary-price-value[^"\']*["\'][^>]*>\s*([\d,.]+)', html, re.I)
         or re.search(r'priceTitle=["\']市售價["\'][^>]*\bprice=["\']([\d,.]+)["\']', html, re.I)
         or re.search(r'\bprice=["\']([\d,.]+)["\']', html, re.I)
         or re.search(r'class=["\']seoPrice["\'][^>]*>\s*([\d,.]+)', html, re.I))
    if not m:
        return ""
    val = m.group(1).split(".")[0].strip()  # drop any decimals
    return ("NT$" + val) if val else ""


def _price_num(s):
    """'NT$1,188' → 1188 (int) for comparison; -1 if unparseable."""
    digits = re.sub(r"[^\d]", "", s or "")
    return int(digits) if digits else -1


def extract_list_price(html):
    """The list price 市售價 → 'NT$1,550' (the strike-through original price).
    '' when the page has no separate 市售價."""
    m = re.search(r'priceTitle=["\']市售價["\'][^>]*\bprice=["\']([\d,.]+)["\']', html, re.I)
    if not m:
        return ""
    val = m.group(1).split(".")[0].strip()
    return ("NT$" + val) if val else ""


def is_unavailable(html):
    """True when the product is delisted / nonexistent. A live product page is
    large and has a gallery or og:image; a delisted one is a tiny stub that
    bounces to momo's Notice.jsp (error code FA00xx) with no product content."""
    if "GoodsDetailPic_S" in html or "og:image" in html:
        return False
    return ("Notice.jsp" in html) or bool(re.search(r"\bFA00\d", html)) or len(html) < 2000


def extract_gallery(html):
    """momo product image gallery (#GoodsDetailPic_S). The display-size image
    is ZoomImage()'s first arg (..._R.webp / ..._OR.webp). Returns ordered,
    de-duplicated absolute URLs. Empty list when the block isn't present."""
    block = re.search(r'id=["\']GoodsDetailPic_S["\'].*?</div>', html, re.S | re.I)
    if not block:
        return []
    seen, out = set(), []
    for u in re.findall(r"ZoomImage\(\s*'([^']+)'", block.group(0)):
        u = u.strip()
        if u and u not in seen:
            seen.add(u)
            out.append(u)
    return out


def _get_html(url, timeout=40):
    req = urllib.request.Request(url, headers=HTML_HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.geturl(), resp.read().decode("utf-8", "replace")


def fetch_product_html(product_url, retries=3):
    """Fetch the product page, resolving momo's app-redirect interstitial to
    the real desktop GoodsDetail.jsp when needed (a share / short link lands on
    appRedirect.jsp, whose real page sits in its goodsUrl query param). Retries
    with backoff because momo intermittently stalls a request (read timeout)."""
    last = None
    for attempt in range(retries):
        try:
            final, html = _get_html(product_url)
            if "GoodsDetailPic_S" in html:
                return html
            m = re.search(r'[?&]goodsUrl=([^&]+)', final) or re.search(r'goodsUrl=([^"\'&]+)', html)
            if m:
                real = urllib.parse.unquote(m.group(1))
                if real.startswith("http") and "GoodsDetail" in real:
                    return _get_html(real)[1]
            return html
        except Exception as e:  # noqa: BLE001 — retry transient stalls/timeouts
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise last


def _download_webp(img_url, out_path, retries=3):
    """Download one image → webp over a relaxed TLS context (momo's image CDN
    certs fail strict verification). Retries with backoff for transient errors."""
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(img_url, headers={
                "User-Agent": UA, "Referer": "https://www.momoshop.com.tw/"})
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


def scrape_product(product_url, ad_id):
    """Fetch the PRODUCT page once and return (images, description, price, list_price):
      images       list of "/assets/ads/<id>-N.webp"; images[0] is the MAIN
                   image (first #GoodsDetailPic_S frame _R.webp). A page with no
                   gallery (e.g. TP 賣場) falls back to a single og:image.
      description  card text (og:description, trimmed to DESC_MAXLEN)
      price        sale price "NT$..." or "" (price hidden)
      list_price   original 市售價 "NT$..." for strike-through, only when it's
                   genuinely higher than the sale price; "" otherwise
    Never raises."""
    try:
        html = fetch_product_html(product_url)
    except Exception as e:  # noqa: BLE001 — best-effort scraping
        print(f"  ⚠️  讀取商品頁失敗（{e.__class__.__name__}）：{product_url}")
        return [], "", "", ""

    if is_unavailable(html):
        print(f"  ⚠️  商品已下架/不存在：{product_url}")
        return [], "", "", ""

    description = extract_og_description(html)
    if len(description) > DESC_MAXLEN:
        description = description[:DESC_MAXLEN].rstrip() + "…"

    price = extract_price(html)
    if not price:
        print(f"  ⚠️  找不到價格：{product_url}")
    # Original price for strike-through — only when it's really higher than sale.
    list_price = extract_list_price(html)
    if _price_num(list_price) <= _price_num(price):
        list_price = ""

    gallery = extract_gallery(html)
    if not gallery:  # no momo gallery (e.g. TP page) → single og:image
        og = extract_og_image(html, product_url)
        gallery = [og] if og else []
        if not og:
            print(f"  ⚠️  找不到商品圖庫與 og:image：{product_url}")

    cleanup_images(ad_id)  # clear stale frames before redownloading
    images = []
    for i, img_url in enumerate(gallery):
        if i:
            time.sleep(0.3)  # gentle intra-product pause
        try:
            _download_webp(img_url, os.path.join(IMG_DIR, f"{ad_id}-{i}.webp"))
            images.append(f"/assets/ads/{ad_id}-{i}.webp")
        except Exception as e:  # noqa: BLE001 — best-effort scraping
            print(f"  ⚠️  抓圖失敗（{e.__class__.__name__}）：{img_url}")
    return images, description, price, list_price


def read_csv_rows(csv_url):
    text = fetch_url(csv_url)
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for raw in reader:
        row = {}
        for key, val in raw.items():
            canon = HEADER_MAP.get((key or "").strip())
            if canon:
                row[canon] = (val or "").strip()
        # name + an affiliate CTA link are required; product_url is optional
        # (without it there's just no image / description material to scrape).
        if row.get("name") and row.get("url"):
            rows.append(row)
    return rows


def main():
    csv_url = os.getenv("AD_CSV_URL", DEFAULT_CSV_URL)

    os.makedirs(IMG_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(RESULT_PATH), exist_ok=True)

    if os.path.exists(RESULT_PATH):
        with open(RESULT_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)
    else:
        existing = {}

    try:
        rows = read_csv_rows(csv_url)
    except Exception as e:  # noqa: BLE001
        print(f"❌ 無法讀取 CSV（{e.__class__.__name__}）：{csv_url}")
        sys.exit(1)
    print(f"📥 CSV 取得 {len(rows)} 筆商品")

    results = {}
    seen_ids = set()
    for row in rows:
        url = row["url"]                          # 推廣連結 → card CTA href
        product_url = row.get("product_url", "")  # 商品連結 → scrape gallery/price/desc
        ad_id = slug_for(url)
        seen_ids.add(ad_id)
        name = row["name"]
        deadline = normalize_deadline(row.get("deadline", ""))

        prev = existing.get(ad_id)
        prev_images = (prev or {}).get("images") or []
        cached_ok = (
            prev and prev.get("promo") and prev_images
            and all(os.path.exists(os.path.join(ROOT, p.lstrip("/"))) for p in prev_images)
        )
        if cached_ok:
            # Reuse scraped images/price/description; refresh CSV-driven fields.
            results[ad_id] = {
                "name": name, "price": prev.get("price", ""),
                "list_price": prev.get("list_price", ""), "url": url,
                "deadline": deadline, "images": prev_images, "promo": prev["promo"],
            }
            print(f"⏭ 已存在，沿用：{name}")
            continue

        try:
            images, description, price, list_price = [], "", "", ""
            if product_url:
                images, description, price, list_price = scrape_product(product_url, ad_id)
            description = description or (prev or {}).get("promo") or ""
            price = price or (prev or {}).get("price", "")

            # Require name + at least one image + description; else drop it
            # (and clear any frames we just downloaded).
            if not (name and images and description):
                cleanup_images(ad_id)
                seen_ids.discard(ad_id)
                print(f"⏭ 略過（缺名稱/圖片/描述）：{name or '(無名稱)'}")
                continue

            results[ad_id] = {
                "name": name, "price": price, "list_price": list_price, "url": url,
                "deadline": deadline, "images": images, "promo": description,
            }
            print(f"✅ 已處理：{name}（{len(images)} 圖）")
        except Exception as e:  # noqa: BLE001 — isolate per-product failure
            print(f"❌ 失敗，略過：{name} - {e.__class__.__name__}: {e}")
            continue

        # Persist after each product so an interrupt keeps progress.
        with open(RESULT_PATH, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        time.sleep(SLEEP_SEC)

    # Drop frames for products no longer in the CSV.
    for ad_id, item in existing.items():
        if ad_id in seen_ids:
            continue
        cleanup_images(ad_id)
        print(f"🗑  移除下架商品圖：{item.get('name', ad_id)}")

    with open(RESULT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"📄 共 {len(results)} 筆商品，已寫入 {RESULT_PATH}")


if __name__ == "__main__":
    main()
