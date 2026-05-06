#!/usr/bin/env python3
"""
Translate zh-tw posts → en or jp via OpenAI.

Per-post cache at tools/translators/cache/{target}/{sub}/{filename}.json:
    {"source_hash": "...", "translations": {"<original block>": "<translated>"}}

- source_hash covers only fields that affect the translated output:
  post.content + title + description + sorted(tags) + sorted(categories).
  Cover image / author / date / last_modified_at are excluded — swapping
  them does not retrigger translation.
- If the source hash matches and the dst file exists, the post is skipped
  (zero API calls).
- Otherwise summary / SEO / taxonomy regenerate, but each Markdown block is
  looked up in `translations` first; only blocks whose original text is new
  or changed actually call OpenAI.

To force a full re-translation, delete the matching cache JSON.

Usage:
    pip install -r tools/translators/requirements.txt
    OPENAI_API_KEY=sk-...
    python3 tools/translators/translator.py en
    python3 tools/translators/translator.py jp
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
import sys

import frontmatter
import mistune
from mistune.renderers.markdown import MarkdownRenderer
from openai import OpenAI

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_LANG = "zh-tw"
SUBDIRS = ["zmediumtomarkdown", "ai"]
MODEL = "gpt-4.1-mini"
CACHE_ROOT = os.path.join(ROOT, "tools", "translators", "cache")

# --- Per-target language profile -----------------------------------------------

PROFILES = {
    "en": {
        "extra_tags": ["english", "ai-translation"],
        "category_pre":  {"Z 度旅行遊記": "Travel Journals"},
        "category_post": {
            "travel journals": "Travel Journals",
            "ZRealm Life":     "ZRealm Life.",
            "ZRealm Development": "ZRealm Dev.",
            "ZRealm Dev":      "ZRealm Dev.",
            "Robotic Process Automation": "ZRealm Robotic Process Automation",
        },
        "lang_label_zh": "英文",
        "lang_label_translate": "英文",
        "lang_role": "英語",
    },
    "jp": {
        "extra_tags": ["japanese", "ai-translation"],
        "category_pre":  {},
        "category_post": {},
        "lang_label_zh": "日文",
        "lang_label_translate": "日文",
        "lang_role": "日語",
    },
}

PROMPT_SUMMARY = (
    "你是一位科技(iOS/RPA/AI)與旅遊專家。以下是我的文章全文，請你仔細閱讀了解。"
    "最後產生一段總結文字給我，我會把你的總結帶入之後的翻譯請求。"
    "內容只需要講重點不要冗詞贅字。內容不能超過 300 個字。"
)

def prompt_seo(target_label):
    return (
        f"你是一位科技(iOS/RPA/AI)與旅遊專家。請參考我剛剛給你的文章全文，"
        f"幫我產生最佳的「{target_label}」 SEO 標題跟描述，標題控制在 40 到 60 個字以內"
        f"盡量把主關鍵詞靠前、用半形「：｜—」清楚分段。描述控制在 140 到 156 個字以內、"
        f"不要冗詞贅字、請以讀者立場產生，一句話講清楚受眾 + 痛點 + 解法 + 成果。"
        f"避免高度重複起手式。年份策略：文章不要在標題寫到年份。"
        f"品牌名與專有名詞：盡量用通用搜尋寫法並保留大小寫。"
        f'請使用 {{"title":"","description":""}} 的 JSON 格式回應，不需要 codeblock。'
    )

def prompt_taxonomy(target_role):
    return (
        f"你是一位科技(iOS/RPA/AI)旅遊與{target_role}專家。請參考我剛剛給你的文章全文，"
        f"幫我把文章 tags, categories 翻譯成符合場景的{target_role}文。"
        f'請使用 {{"tags":[],"categories":[]}} 的 JSON 格式回應，不需要 codeblock。'
        f"如果原本就是{target_role}文請務必保持原本的{target_role}文大小寫及符號。"
    )

def prompt_translate(target_label):
    return (
        f"你是一位科技(iOS/RPA/AI)與旅遊專家。請參考我剛剛給你的文章總結，了解 Context，"
        f"然後幫我把以下文章 Markdown 段落翻譯成{target_label}。"
        "請務必永遠遵守以下原則："
        "1. 務必永遠保持原有的 Markdown 格式和結構。"
        "2. 永遠不要翻譯 URL 連結。"
        f"3. 使用簡潔明瞭的{target_label}表達，避免冗長或複雜的句子。"
        f"4. 確保翻譯後的內容符合{target_label}語法和用詞習慣。"
        "5. 不要添加任何額外的解釋或評論。"
        "6. 程式碼區塊務必永遠保持原本的程式碼，只能翻譯註解。"
        "7. 永遠不要動到原本的 Markdown 符號。"
        "8. 原本不是 Quote 或 Code 的區塊，就絕對不要把結果包裝在 ```。"
        "9. 請千萬不要擅自改變任何檔案路徑字串。"
        "10. 如果原本有反斜線也請保持反斜線。"
    )


def compute_source_hash(post):
    payload = json.dumps(
        [
            post.content,
            post.get("title", "") or "",
            post.get("description", "") or "",
            sorted(post.get("tags") or []),
            sorted(post.get("categories") or []),
        ],
        ensure_ascii=False,
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def cache_path(target, sub, filename):
    return os.path.join(CACHE_ROOT, target, sub, filename + ".json")


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


class Renderer(MarkdownRenderer):
    def __init__(self, client, summary, translate_prompt, old_translations, new_translations, *a, **kw):
        super().__init__(*a, **kw)
        self.client = client
        self.summary = summary
        self.translate_prompt = translate_prompt
        self.old_translations = old_translations
        self.new_translations = new_translations

    def _translate(self, text):
        if not text or not text.strip():
            return text
        if text in self.new_translations:
            return self.new_translations[text]
        if text in self.old_translations:
            out = self.old_translations[text]
            self.new_translations[text] = out
            print(f"  ⊕ cached: {text[:40].strip()}…")
            return out
        resp = self.client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": f"本篇文章總結：{self.summary}"},
                {"role": "system", "content": self.translate_prompt},
                {"role": "user", "content": text},
            ],
            temperature=0.5,
        )
        out = resp.choices[0].message.content.strip()
        print(f"  → {text[:40].strip()}…  ⇒  {out[:40].strip()}…")
        self.new_translations[text] = out
        return out

    def block_quote(self, token, state):
        return self._translate(super().block_quote(token, state)) + "\n\n"

    def list(self, text, ordered, **attrs):
        return self._translate(super().list(text, ordered, **attrs)) + "\n\n"

    def block_code(self, code, info=None):
        return self._translate(super().block_code(code, info)) + "\n\n"

    def block_text(self, token, state):
        return self._translate(super().block_text(token, state)) + "\n\n"

    def paragraph(self, token, state):
        return self._translate(super().paragraph(token, state)) + "\n\n"

    def heading(self, token, state):
        return self._translate(super().heading(token, state)) + "\n\n"


def process_file(filename, src_dir, dst_dir, profile, api_key, target, sub):
    src_path = os.path.join(src_dir, filename)
    dst_path = os.path.join(dst_dir, filename)
    cache_p = cache_path(target, sub, filename)

    try:
        with open(src_path, "r", encoding="utf-8") as f:
            post = frontmatter.load(f)
    except Exception as e:
        print(f"✗ read failed: {filename} — {e}")
        return

    src_hash = compute_source_hash(post)
    cache = load_cache(cache_p)

    if cache.get("source_hash") == src_hash and os.path.exists(dst_path):
        print(f"⏭  unchanged, skip: {filename}")
        return

    client = OpenAI(api_key=api_key)
    old_translations = cache.get("translations") or {}
    print(f"… translating: {filename} (cached blocks: {len(old_translations)})")

    summary_resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": PROMPT_SUMMARY},
            {"role": "user", "content": "文章內容:\n" + post.content},
        ],
        temperature=0.5,
    )
    summary = summary_resp.choices[0].message.content.strip()

    new_translations = {}
    md = mistune.create_markdown(
        renderer=Renderer(
            client=client,
            summary=summary,
            translate_prompt=prompt_translate(profile["lang_label_translate"]),
            old_translations=old_translations,
            new_translations=new_translations,
        )
    )
    post.content = md(post.content).replace("|", r"\\|")

    seo_resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": prompt_seo(profile["lang_label_zh"])},
            {"role": "user", "content": f"Title: {post.get('title', '')}\nDescription:\n{post.get('description', '')}"},
        ],
        temperature=0.5,
    )
    seo = json.loads(seo_resp.choices[0].message.content.strip())
    post["title"] = seo.get("title") or post.get("title", "")
    post["description"] = seo.get("description") or post.get("description", "")

    cats = [profile["category_pre"].get(c, c) for c in (post.get("categories") or [])]

    tax_resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": prompt_taxonomy(profile["lang_role"])},
            {"role": "user", "content": f"Tags: {post.get('tags') or []}\nCategories:\n{cats}"},
        ],
        temperature=0.5,
    )
    tax = json.loads(tax_resp.choices[0].message.content.strip())
    cats = [profile["category_post"].get(c, c) for c in (tax.get("categories") or cats)]
    tags = list(tax.get("tags") or [])
    for extra in profile["extra_tags"]:
        if extra not in tags:
            tags.append(extra)

    post["categories"] = cats
    post["tags"] = tags

    os.makedirs(dst_dir, exist_ok=True)
    with open(dst_path, "w", encoding="utf-8") as f:
        f.write(frontmatter.dumps(post))

    save_cache(cache_p, {"source_hash": src_hash, "translations": new_translations})
    reused = sum(1 for k in new_translations if k in old_translations)
    print(f"✓ wrote {dst_path} (blocks: {len(new_translations)}, reused: {reused})")


def main():
    parser = argparse.ArgumentParser(description="Translate posts zh-tw → en/jp via OpenAI.")
    parser.add_argument("target", choices=["en", "jp"], help="Target language code")
    parser.add_argument("--api-key", help="OpenAI API key (or env OPENAI_API_KEY)")
    args = parser.parse_args()

    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("✗ Missing OpenAI key. Pass --api-key or set OPENAI_API_KEY.", file=sys.stderr)
        sys.exit(1)

    profile = PROFILES[args.target]

    for sub in SUBDIRS:
        src_dir = os.path.join(ROOT, "L10n", "posts", SRC_LANG, sub)
        dst_dir = os.path.join(ROOT, "L10n", "posts", args.target, sub)
        if not os.path.isdir(src_dir):
            continue
        files = [f for f in os.listdir(src_dir) if f.endswith(".md") or f.endswith(".markdown")]

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
            futures = [ex.submit(process_file, f, src_dir, dst_dir, profile, api_key, args.target, sub) for f in files]
            for fut in concurrent.futures.as_completed(futures):
                try:
                    fut.result()
                except Exception as e:
                    print(f"✗ task error: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
