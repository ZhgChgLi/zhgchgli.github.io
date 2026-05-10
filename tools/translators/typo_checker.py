#!/usr/bin/env python3
"""
Typo & sentence-quality reporter for zh-tw posts.

Iterates L10n/posts/zh-tw/{zmediumtomarkdown,ai}/, sends each post's full
body to OpenAI and asks the model to list:
  1. obvious typos (homophone / shape-similar / dropped chars)
  2. obvious duplicate characters or phrases
  3. serious sentence problems (broken grammar, missing subject/object,
     contradictory or unintelligible sentences)

The script never modifies source files. Findings are written to
`.typo-report.json` at repo root for the workflow to surface as a GitHub
issue.

Per-post cache at tools/translators/cache/typo_check/{sub}/{filename}.json:
    {"source_hash": "..."}
A matching hash means the article was already reviewed at this version;
the script skips it without calling OpenAI. Editing the file invalidates
the cache and triggers a re-check on the next run.

Usage:
    pip install -r tools/translators/requirements.txt
    OPENAI_API_KEY=sk-... python3 tools/translators/typo_checker.py
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
import sys
import threading

import frontmatter
from openai import OpenAI

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_LANG = "zh-tw"
SUBDIRS = ["zmediumtomarkdown", "ai"]
MODEL = "gpt-4.1-mini"
CACHE_ROOT = os.path.join(ROOT, "tools", "translators", "cache", "typo_check")
REPORT_PATH = os.path.join(ROOT, ".typo-report.json")

SYSTEM_PROMPT = (
    "你是正體中文校稿員，幫我校對一整篇 Markdown 文章。"
    "請只回報「100% 確定」是問題的地方，寧可漏報也不要誤報。"
    "\n\n"
    "要回報的問題類別："
    "\n1. typo：明顯的同音／形近誤字、漏字（例：「頗析」應為「解析」、「米加」應為「米家」、"
    "「甚是是」應為「甚至是」）"
    "\n2. duplicate：明顯多打的重複字／詞（例：「首先先」、「的的」、「米家米家」、"
    "「token 帶入帶入」）"
    "\n3. sentence：嚴重的語句問題——文法明顯錯誤、缺主詞／受詞導致語意不通、自相矛盾、"
    "或讀起來完全不知所云的句子。**只回報嚴重問題**，不要回報風格、贅字、語氣偏好、"
    "標點細節或可讀性建議。"
    "\n\n"
    "嚴格保留、不要回報的："
    "\n- 強調用疊字：「一步一步」「一個一個」「很多很多」「考驗考驗」「研究研究」「啊啊啊啊」等"
    "\n- 作者語氣詞：「其實」「基本上」「事實上」「個人覺得」「可以說是」「為了要」「然後再」"
    "「簡單來說」"
    "\n- 兩寫皆通的字：度過／渡過、計畫／計劃、啟用／啓用、做為／作為、藉由／籍由"
    "\n- Markdown 格式、URL、連結文字、檔案路徑、code block、HTML 標籤、`{:target=...}`"
    "\n- 任何文體／風格／節奏／可讀性層面的「建議」"
    "\n- 任何不 100% 確定的情況"
    "\n\n"
    "請以 JSON 格式回應（不要包 codeblock）："
    '\n{"issues": ['
    '{"type": "typo|duplicate|sentence", '
    '"quote": "<原文中出現問題的片段，請逐字節錄、不要改寫>", '
    '"suggestion": "<建議改成什麼，sentence 類可給簡述>", '
    '"reason": "<10～30 字說明為何是問題>"}'
    "]}"
    "\n沒有任何問題時請回應 {\"issues\": []}。"
)

_report_lock = threading.Lock()
_report = []


def compute_hash(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def cache_path(sub, filename):
    return os.path.join(CACHE_ROOT, sub, filename + ".json")


def load_cache(path):
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_cache(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=True)


def review_post(filename, src_dir, sub, api_key):
    src_path = os.path.join(src_dir, filename)
    cache_p = cache_path(sub, filename)

    try:
        with open(src_path, "r", encoding="utf-8") as f:
            post = frontmatter.load(f)
    except Exception as e:
        print(f"✗ read failed: {filename} — {e}")
        return

    src_hash = compute_hash(post.content)
    cache = load_cache(cache_p)
    if cache.get("source_hash") == src_hash:
        return  # already reviewed at this exact content

    print(f"… reviewing: {sub}/{filename}")
    client = OpenAI(api_key=api_key)
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": post.content},
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(resp.choices[0].message.content)
    except Exception as e:
        # Don't update cache on failure — retry next run.
        print(f"  ! review failed for {filename}: {e}", file=sys.stderr)
        return

    issues = parsed.get("issues") or []
    cleaned = []
    for it in issues:
        if not isinstance(it, dict):
            continue
        cleaned.append({
            "type": str(it.get("type", "")),
            "quote": str(it.get("quote", "")),
            "suggestion": str(it.get("suggestion", "")),
            "reason": str(it.get("reason", "")),
        })

    if cleaned:
        with _report_lock:
            _report.append({
                "file": os.path.relpath(src_path, ROOT),
                "issues": cleaned,
            })
        print(f"⚠ {filename}: {len(cleaned)} issue(s)")
    else:
        print(f"✓ {filename}: clean")

    save_cache(cache_p, {"source_hash": src_hash})


def seed_file(filename, src_dir, sub):
    """Pre-populate cache so old files are treated as already-reviewed."""
    src_path = os.path.join(src_dir, filename)
    cache_p = cache_path(sub, filename)
    if os.path.exists(cache_p):
        return False
    try:
        with open(src_path, "r", encoding="utf-8") as f:
            post = frontmatter.load(f)
    except Exception as e:
        print(f"✗ seed read failed: {filename} — {e}")
        return False
    save_cache(cache_p, {
        "source_hash": compute_hash(post.content),
        "seeded": True,
    })
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Review zh-tw posts for typos and serious sentence issues via OpenAI."
    )
    parser.add_argument("--api-key", help="OpenAI API key (or env OPENAI_API_KEY)")
    parser.add_argument("--max-workers", type=int, default=5)
    parser.add_argument(
        "--seed",
        action="store_true",
        help=(
            "Seed cache for all current files without calling OpenAI. Use this "
            "once when introducing the checker so existing articles are treated "
            "as already-reviewed; only future fetches/updates trigger checks."
        ),
    )
    parser.add_argument(
        "--files",
        nargs="+",
        metavar="PATH",
        help=(
            "Only review the given post paths (relative to repo root or absolute). "
            "Paths must live under L10n/posts/zh-tw/{zmediumtomarkdown,ai}/. "
            "Used by CI to limit checking to files that actually changed."
        ),
    )
    args = parser.parse_args()

    base = os.path.join(ROOT, "L10n", "posts", SRC_LANG)

    if args.seed:
        seeded = 0
        for sub in SUBDIRS:
            src_dir = os.path.join(base, sub)
            if not os.path.isdir(src_dir):
                continue
            for f in sorted(os.listdir(src_dir)):
                if not f.endswith((".md", ".markdown")):
                    continue
                if seed_file(f, src_dir, sub):
                    seeded += 1
        print(f"🌱 seeded {seeded} file(s) into typo_check cache (no API calls)")
        return

    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("✗ Missing OpenAI key. Pass --api-key or set OPENAI_API_KEY.", file=sys.stderr)
        sys.exit(1)

    targets = []
    if args.files:
        for raw in args.files:
            p = os.path.normpath(raw if os.path.isabs(raw) else os.path.join(ROOT, raw))
            parts = os.path.relpath(p, base).split(os.sep)
            if (
                p.endswith((".md", ".markdown"))
                and os.path.isfile(p)
                and len(parts) == 2
                and parts[0] in SUBDIRS
            ):
                targets.append((parts[0], parts[1], os.path.join(base, parts[0])))
            else:
                print(f"… skip: {raw}", file=sys.stderr)
    else:
        for sub in SUBDIRS:
            src_dir = os.path.join(base, sub)
            if os.path.isdir(src_dir):
                for f in sorted(os.listdir(src_dir)):
                    if f.endswith((".md", ".markdown")):
                        targets.append((sub, f, src_dir))

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.max_workers) as ex:
        futures = [ex.submit(review_post, fn, sd, sub, api_key) for sub, fn, sd in targets]
        for fut in concurrent.futures.as_completed(futures):
            try:
                fut.result()
            except Exception as e:
                print(f"✗ task error: {e}", file=sys.stderr)

    # Always write the report (even if empty) so the workflow has a stable file to read.
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump({"files": _report}, f, ensure_ascii=False, indent=2)
    total_issues = sum(len(item["issues"]) for item in _report)
    print(f"📝 report: {len(_report)} file(s), {total_issues} issue(s) → {REPORT_PATH}")


if __name__ == "__main__":
    main()
