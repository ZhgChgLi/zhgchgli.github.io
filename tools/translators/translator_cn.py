#!/usr/bin/env python3
"""
Convert zh-tw posts → zh-cn (Simplified Chinese) using OpenCC, a deterministic
lexical converter. No API key, no network.

Optimization vs. the original script: only processes a post when its zh-cn
target file does NOT exist yet — never re-translates already-translated posts.
To force a rebuild for a single post, just delete the target file.

Usage:
    pip install -r tools/translators/requirements.txt
    python tools/translators/translator_cn.py
"""
import concurrent.futures
import os
import sys

import frontmatter
import mistune
from mistune.renderers.markdown import MarkdownRenderer
from opencc import OpenCC

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_LANG = "zh-tw"
DST_LANG = "zh-cn"
SUBDIRS = ["zmediumtomarkdown", "ai"]
EXTRA_TAG = "simplified-chinese"


class Renderer(MarkdownRenderer):
    """Run OpenCC on every text-bearing block while preserving Markdown structure."""

    def __init__(self, client, *a, **kw):
        super().__init__(*a, **kw)
        self.client = client

    def _convert(self, text):
        return self.client.convert(text)

    def block_quote(self, token, state):
        return self._convert(super().block_quote(token, state)) + "\n\n"

    def list(self, text, ordered, **attrs):
        return self._convert(super().list(text, ordered, **attrs)) + "\n\n"

    def block_code(self, code, info=None):
        # Code blocks pass through unchanged (don't convert source code).
        return super().block_code(code, info) + "\n\n"

    def block_text(self, token, state):
        return self._convert(super().block_text(token, state)) + "\n\n"

    def paragraph(self, token, state):
        return self._convert(super().paragraph(token, state)) + "\n\n"

    def heading(self, token, state):
        return self._convert(super().heading(token, state)) + "\n\n"


def process_file(filename, src_dir, dst_dir):
    src_path = os.path.join(src_dir, filename)
    dst_path = os.path.join(dst_dir, filename)

    if os.path.exists(dst_path):
        print(f"⏭  exists, skip: {filename}")
        return

    try:
        with open(src_path, "r", encoding="utf-8") as f:
            post = frontmatter.load(f)
    except Exception as e:
        print(f"✗ read failed: {filename} — {e}")
        return

    client = OpenCC("t2s")
    md = mistune.create_markdown(renderer=Renderer(client=client))

    print(f"… converting: {filename}")
    body = md(post.content).replace("|", r"\\|")
    post.content = body

    if post.get("title"):
        post["title"] = client.convert(post["title"])
    if post.get("description"):
        post["description"] = client.convert(post["description"])

    tags = list(post.get("tags") or [])
    if EXTRA_TAG not in tags:
        tags.append(EXTRA_TAG)
    post["tags"] = tags

    os.makedirs(dst_dir, exist_ok=True)
    with open(dst_path, "w", encoding="utf-8") as f:
        f.write(frontmatter.dumps(post))
    print(f"✓ wrote {dst_path}")


def main():
    written = 0
    skipped = 0
    for sub in SUBDIRS:
        src_dir = os.path.join(ROOT, "L10n", "posts", SRC_LANG, sub)
        dst_dir = os.path.join(ROOT, "L10n", "posts", DST_LANG, sub)
        if not os.path.isdir(src_dir):
            continue
        files = [f for f in os.listdir(src_dir) if f.endswith(".md") or f.endswith(".markdown")]

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
            futures = [ex.submit(process_file, f, src_dir, dst_dir) for f in files]
            for fut in concurrent.futures.as_completed(futures):
                try:
                    fut.result()
                except Exception as e:
                    print(f"✗ task error: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
