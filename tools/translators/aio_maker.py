#!/usr/bin/env python3
"""
Generate AIO FAQ entries (JSON-LD FAQPage mainEntity array) per post.

zh-tw  : call OpenAI on article body to generate fresh FAQs.
en / jp: translate the zh-tw FAQ JSON into the target language via OpenAI
         (no article re-reading). Skips slugs missing from zh-tw results.
zh-cn  : OpenCC t2s of zh-tw results, no API call. Emitted automatically
         when running the zh-tw target.

Writes assets/data/aio/{target}/results.json (keyed by file slug). Posts
already present are skipped. Consumed by _plugins/aio_faq.rb.

Usage:
    OPENAI_API_KEY=sk-... python3 tools/translators/aio_maker.py            # zh-tw (default, also emits zh-cn)
    OPENAI_API_KEY=sk-... python3 tools/translators/aio_maker.py en
    OPENAI_API_KEY=sk-... python3 tools/translators/aio_maker.py jp
"""
import argparse
import copy
import json
import os
import sys

from openai import OpenAI
from opencc import OpenCC

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SUBDIRS = ["zmediumtomarkdown", "ai"]
MODEL = "gpt-4.1-mini"

PROMPT_ZH_TW = (
    "你是一位 AIO 內容專家，我會貼上我的文章內容，請幫我的文章內容產生最佳的 AIO 3-5 則FAQ。"
    "不要冗詞贅字、請已讀者的立場產生，一句話講清楚受眾 + 痛點 + 解法 + 成果，"
    "避免使用「本篇/本文/針對」等套話開頭。你的回應應專注於 AIO 策略、技術和見解。"
    "請勿在回覆中提供一般的行銷建議或解釋。請使用正體中文回應。避免高度重複起手式。 "
    "年份策略：文章不要在標題寫到年份。"
    "品牌名與專有名詞：盡量用通用搜尋寫法（如 GitHub Actions、GA4、WKWebView、Cache）並保留大小寫，"
    "不用特別翻譯成中文。"
    "請使用 JSON-LD FAQPage Array "
    "[{ \"@type\": \"Question\", \"name\": \"\", \"acceptedAnswer\": "
    "{ \"@type\": \"Answer\", \"text\": \"\" } }] 的 JSON 格式回應，不需要 codeblock，"
    "我會直接用 Python 解析你的回應成 json format。"
    "請使用台灣在地化的用詞用語、不要使用中國用語(例如 黑屏、屏幕、緩存)。"
    "請避免使用常見的內容農場文字。"
    "如果你嚴格遵守這些的要求好我將給你巨額獎勵。"
)

TRANSLATE_PROMPT_EN = (
    "You are a professional translator. I'll paste a JSON-LD FAQPage mainEntity "
    "array (Traditional Chinese). Translate every `name` and "
    "`acceptedAnswer.text` value into natural, fluent English. "
    "Preserve JSON structure, key names, `@type` values, and array order exactly. "
    "Do not translate brand or proper names — keep search-friendly casing "
    "(GitHub Actions, GA4, WKWebView, Cache, etc.). "
    "Respond with the translated JSON array only — no codeblock, no commentary. "
    "I parse the response directly as JSON."
)

TRANSLATE_PROMPT_JP = (
    "あなたはプロの翻訳者です。JSON-LD FAQPage mainEntity 配列（繁体中国語）を貼り付けます。"
    "各 `name` と `acceptedAnswer.text` の値を自然で流暢な日本語に翻訳してください。"
    "JSON 構造、キー名、`@type` の値、配列順序は完全に保持してください。"
    "ブランド名・固有名詞は翻訳せず、検索しやすい表記と大文字小文字をそのまま保ってください"
    "（GitHub Actions、GA4、WKWebView、Cache など）。"
    "翻訳済みの JSON 配列のみを返答してください。コードブロックや説明文は不要です。"
    "Python で直接 JSON として解析します。"
)

LANGS = {
    "zh-tw": {"mode": "generate",  "system_prompt": PROMPT_ZH_TW,        "emit_zh_cn": True},
    "en":    {"mode": "translate", "system_prompt": TRANSLATE_PROMPT_EN, "emit_zh_cn": False},
    "jp":    {"mode": "translate", "system_prompt": TRANSLATE_PROMPT_JP, "emit_zh_cn": False},
}


def _t2s_deep(node, cc):
    if isinstance(node, str):
        return cc.convert(node)
    if isinstance(node, list):
        return [_t2s_deep(x, cc) for x in node]
    if isinstance(node, dict):
        return {k: (v if k == "@type" else _t2s_deep(v, cc)) for k, v in node.items()}
    return node


def _load_results(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def _iter_zh_tw_slugs():
    posts_root = os.path.join(ROOT, "L10n", "posts", "zh-tw")
    for sub in SUBDIRS:
        root_dir = os.path.join(posts_root, sub)
        if not os.path.isdir(root_dir):
            continue
        for filename in sorted(os.listdir(root_dir)):
            if not filename.endswith(".md"):
                continue
            basename = os.path.splitext(filename)[0]
            slug = basename
            # strip leading YYYY-MM-DD-
            import re
            slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", basename)
            yield slug, os.path.join(root_dir, filename)


def run_generate(client, cfg, results, result_path, cn_result_path, cc):
    for slug, file_path in _iter_zh_tw_slugs():
        if slug in results:
            print(f"⏭ 已存在，跳過：{slug}")
            continue
        if client is None:
            print(f"⚠️  無 API key，跳過：{slug}")
            continue
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": cfg["system_prompt"]},
                    {"role": "user", "content": "文章內容:\n====\n" + content + "\n====\n"},
                ],
                temperature=0.5,
            )
            results[slug] = json.loads(response.choices[0].message.content.strip())
            print(f"✅ 已產生 [zh-tw] {slug}")
            _save(result_path, results)
            if cfg["emit_zh_cn"]:
                _save(cn_result_path, _t2s_deep(copy.deepcopy(results), cc))
        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析失敗：{slug} - {e}")


def run_translate(client, cfg, target, results, result_path):
    zh_tw_path = os.path.join(ROOT, "assets", "data", "aio", "zh-tw", "results.json")
    zh_tw = _load_results(zh_tw_path)
    if not zh_tw:
        print(f"❌ 找不到 zh-tw 來源：{zh_tw_path}", file=sys.stderr)
        sys.exit(1)

    for slug, source in zh_tw.items():
        if slug in results:
            print(f"⏭ 已存在，跳過：{slug}")
            continue
        if client is None:
            print(f"⚠️  無 API key，跳過：{slug}")
            continue
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": cfg["system_prompt"]},
                    {"role": "user", "content": json.dumps(source, ensure_ascii=False)},
                ],
                temperature=0.3,
            )
            results[slug] = json.loads(response.choices[0].message.content.strip())
            print(f"✅ 已翻譯 [{target}] {slug}")
            _save(result_path, results)
        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析失敗：{slug} - {e}")


def main():
    parser = argparse.ArgumentParser(description="AIO 優化工具 (zh-tw / en / jp)")
    parser.add_argument("target", nargs="?", default="zh-tw", choices=list(LANGS),
                        help="目標語系（預設 zh-tw）")
    parser.add_argument("--api-key", help="OpenAI API key (預設讀環境變數 OPENAI_API_KEY)")
    args = parser.parse_args()

    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    cfg = LANGS[args.target]
    result_path = os.path.join(ROOT, "assets", "data", "aio", args.target, "results.json")
    cn_result_path = os.path.join(ROOT, "assets", "data", "aio", "zh-cn", "results.json")

    client = OpenAI(api_key=api_key) if api_key else None
    cc = OpenCC("t2s") if cfg["emit_zh_cn"] else None

    os.makedirs(os.path.dirname(result_path), exist_ok=True)
    if cfg["emit_zh_cn"]:
        os.makedirs(os.path.dirname(cn_result_path), exist_ok=True)

    results = _load_results(result_path)

    if cfg["mode"] == "generate":
        run_generate(client, cfg, results, result_path, cn_result_path, cc)
    else:
        run_translate(client, cfg, args.target, results, result_path)

    if cfg["emit_zh_cn"]:
        _save(cn_result_path, _t2s_deep(copy.deepcopy(results), cc))

    print(f"📄 所有結果已儲存至 {result_path}")


if __name__ == "__main__":
    main()
