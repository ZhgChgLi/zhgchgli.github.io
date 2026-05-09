#!/usr/bin/env python3
"""
Typo & duplicate-character checker for zh-tw posts.

Iterates L10n/posts/zh-tw/{zmediumtomarkdown,ai}/, splits each post into
Markdown blocks (via mistune), and asks OpenAI to flag only:
  1. obvious typos (homophone / shape-similar / dropped chars)
  2. obvious duplicate characters or phrases (e.g. 「首先先」「的的」)

The model is instructed to leave tone, style, ordering, intentional
reduplication (e.g. 一步一步), and ambiguous variants (度過/渡過, 計畫/計劃)
untouched. Code blocks, frontmatter, URLs, and Markdown structure are
never modified.

When a fix is applied the file is rewritten in place and the change is
recorded in `.typo-fixes.json` at repo root for the workflow to consume.

Per-post cache at tools/translators/cache/typo_check/{sub}/{filename}.json:
    {"source_hash": "...", "blocks": {"<original block>": "<fixed or same>"}}

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
import mistune
from mistune.renderers.markdown import MarkdownRenderer
from openai import OpenAI

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_LANG = "zh-tw"
SUBDIRS = ["zmediumtomarkdown", "ai"]
MODEL = "gpt-4.1-mini"
CACHE_ROOT = os.path.join(ROOT, "tools", "translators", "cache", "typo_check")
FIXES_REPORT = os.path.join(ROOT, ".typo-fixes.json")

SYSTEM_PROMPT = (
    "你是正體中文校稿員，專門抓「明顯的打字錯誤」與「重複字／詞」。"
    "我會給你一段 Markdown 文字片段。請只在 100% 確定的情況下做出修正。"
    "\n\n"
    "可以修正的範圍："
    "\n1. 重複字／詞：明顯多打了字（例：「首先先」→「首先」、「的的」→「的」、"
    "「米家米家」→「米家」、「你問我問我他」→「你問我、我問他」、「token 帶入帶入」→「token 帶入」）"
    "\n2. 同音／形近誤字：明顯打錯字（例：「頗析」→「解析」、「米加」→「米家」、"
    "「要馬」→「要嘛」（但「要馬上」是合理用法請保留）、「甚是是」→「甚至是」）"
    "\n3. 漏字：明顯漏掉常用字"
    "\n\n"
    "嚴格保留、不要動的："
    "\n- 強調用疊字：「一步一步」「一個一個」「一層一層」「很多很多」「很少很少」「好多好多」「好長好長」"
    "「考驗考驗」「研究研究」「嘗試嘗試」「意思意思」「活動活動」「熊本熊本尊」「還有還有」「啊啊啊啊」"
    "「又又又」「滾滾滾」「走著走著」"
    "\n- 作者語氣詞：「其實」「基本上」「事實上」「個人覺得」「我個人」「個人認為」「可以說是」"
    "「為了要」「然後再」「簡單來說」"
    "\n- 兩寫皆通的字：度過／渡過、計畫／計劃、啟用／啓用、做為／作為、藉由／籍由"
    "\n- Markdown 格式、URL、連結文字、檔案路徑、code block、HTML 標籤、`{:target=...}`"
    "\n- 任何不 100% 確定的情況一律保留"
    "\n\n"
    "請以 JSON 格式回應（不要加 codeblock）："
    '\n{"fixed": "<修正後的整段內容，若無修改就回傳原文>", '
    '"changes": [{"before": "<原文片段>", "after": "<修正後>", "reason": "<簡短說明>"}]}'
    "\n\n沒有任何問題時請回應 {\"fixed\": \"<原文>\", \"changes\": []}。"
)

_fixes_lock = threading.Lock()
_fixes_report = []


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


class TypoCheckRenderer(MarkdownRenderer):
    """Walks Markdown blocks; checks each via OpenAI unless cached."""

    def __init__(self, client, blocks_cache, file_changes, *a, **kw):
        super().__init__(*a, **kw)
        self.client = client
        self.blocks_cache = blocks_cache  # original -> fixed (may be unchanged)
        self.file_changes = file_changes  # list of {"before","after","reason"}

    def _check(self, text):
        if not text or not text.strip():
            return text
        # Cache hit: reuse prior verdict
        if text in self.blocks_cache:
            cached = self.blocks_cache[text]
            if cached != text:
                # already-known fix - record so the issue captures it on first
                # surfacing of the file on this run too
                self.file_changes.append({
                    "before": text,
                    "after": cached,
                    "reason": "cached",
                })
            return cached
        # Call OpenAI
        try:
            resp = self.client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": text},
                ],
                temperature=0,
            )
            raw = resp.choices[0].message.content.strip()
            parsed = json.loads(raw)
        except Exception as e:
            print(f"  ! check failed for block ({len(text)} chars): {e}")
            self.blocks_cache[text] = text
            return text

        fixed = parsed.get("fixed", text) or text
        changes = parsed.get("changes") or []
        if changes and fixed != text:
            for c in changes:
                self.file_changes.append({
                    "before": str(c.get("before", "")),
                    "after": str(c.get("after", "")),
                    "reason": str(c.get("reason", "")),
                })
            print(f"  ✎ fixed block: {len(changes)} change(s)")
            self.blocks_cache[text] = fixed
            return fixed
        # No change → cache as clean
        self.blocks_cache[text] = text
        return text

    def block_quote(self, token, state):
        return self._check(super().block_quote(token, state)) + "\n\n"

    def list(self, token, state):
        return self._check(super().list(token, state)) + "\n\n"

    def block_code(self, token, state):
        # Never check or modify code blocks
        return super().block_code(token, state) + "\n\n"

    def paragraph(self, token, state):
        return self._check(super().paragraph(token, state)) + "\n\n"

    def heading(self, token, state):
        return self._check(super().heading(token, state)) + "\n\n"


def process_file(filename, src_dir, sub, api_key):
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

    # Skip if file content hash matches cache and no fixes were stashed.
    if cache.get("source_hash") == src_hash:
        # Already checked this exact content. Nothing to do.
        return

    print(f"… checking: {sub}/{filename}")
    client = OpenAI(api_key=api_key)
    blocks_cache = dict(cache.get("blocks") or {})
    file_changes = []

    md = mistune.create_markdown(
        renderer=TypoCheckRenderer(
            client=client,
            blocks_cache=blocks_cache,
            file_changes=file_changes,
        )
    )
    new_content = md(post.content).replace("|", r"\\|")

    if file_changes and new_content != post.content:
        post.content = new_content
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(frontmatter.dumps(post))
        new_hash = compute_hash(new_content)
        with _fixes_lock:
            _fixes_report.append({
                "file": os.path.relpath(src_path, ROOT),
                "changes": file_changes,
            })
        print(f"✓ wrote fixes: {filename} ({len(file_changes)} change(s))")
    else:
        new_hash = src_hash

    save_cache(cache_p, {"source_hash": new_hash, "blocks": blocks_cache})


def main():
    parser = argparse.ArgumentParser(description="Check typos in zh-tw posts via OpenAI.")
    parser.add_argument("--api-key", help="OpenAI API key (or env OPENAI_API_KEY)")
    parser.add_argument("--max-workers", type=int, default=5)
    args = parser.parse_args()

    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("✗ Missing OpenAI key. Pass --api-key or set OPENAI_API_KEY.", file=sys.stderr)
        sys.exit(1)

    for sub in SUBDIRS:
        src_dir = os.path.join(ROOT, "L10n", "posts", SRC_LANG, sub)
        if not os.path.isdir(src_dir):
            continue
        files = sorted(f for f in os.listdir(src_dir) if f.endswith((".md", ".markdown")))
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.max_workers) as ex:
            futures = [ex.submit(process_file, f, src_dir, sub, api_key) for f in files]
            for fut in concurrent.futures.as_completed(futures):
                try:
                    fut.result()
                except Exception as e:
                    print(f"✗ task error: {e}", file=sys.stderr)

    # Always write the report (even if empty) so the workflow has a stable
    # file to read.
    with open(FIXES_REPORT, "w", encoding="utf-8") as f:
        json.dump({"files": _fixes_report}, f, ensure_ascii=False, indent=2)
    total_changes = sum(len(item["changes"]) for item in _fixes_report)
    print(f"📝 report: {len(_fixes_report)} file(s), {total_changes} change(s) → {FIXES_REPORT}")


if __name__ == "__main__":
    main()
