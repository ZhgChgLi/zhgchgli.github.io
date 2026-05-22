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
    "你是 AEO（Answer Engine Optimization）內容專家。我會貼上一篇文章，"
    "請替它產生一組高品質 FAQ，目的是讓 ChatGPT、Perplexity、Claude、Bing Copilot "
    "這些 AI 引擎在抓取與即時檢索時優先引用。\n\n"

    "【產出題數】\n"
    "5–8 題。少於 5 題的話寧可不要硬湊；多於 8 題會稀釋每題的品質。\n\n"

    "【Question 寫作規則】\n"
    "1. 寫成「真實使用者會在 Google 或 ChatGPT 輸入的句子」，不是百科式問句。\n"
    "   ✅ 範例：「AVPlayer 怎麼邊播邊 cache 音樂、避免重複下載？」\n"
    "   ❌ 反例：「什麼是 AVPlayer？」「AVPlayer 簡介」「關於 AVPlayer 的介紹」\n"
    "2. 每題必須以全形「？」結尾。\n"
    "3. 每題聚焦單一主題，不要把多個問題塞進一題。\n"
    "4. 優先使用長尾問句句型：怎麼 / 為什麼 / 哪一個 / 適合誰 / 值不值得 / "
    "會不會 / 有沒有 / 何時 / 多少 / 跟 X 差在哪 / 要不要。\n"
    "5. 題目必須是文章正文有實際回答到的內容；文章沒講的問題不要編。\n"
    "6. **問題 self-contained**：單獨剪出脫離文章上下文也要明確指向具體主題；"
    "禁「這個 / 它 / 此功能 / 上述方法」這類指涉模糊代詞 — AI 是按題切出來，沒有上下文補位。\n"
    "7. 禁抽象百科式開頭（「什麼是 / 關於 / 介紹 / 概述 / 簡介」），禁套話起手式（「本篇 / 本文 / 針對 / 在這篇文章中」）。\n\n"

    "【Answer 寫作規則】\n"
    "1. 嚴格控制長度：每答 50–150 字（繁體中文計字，標點不算）。\n"
    "   < 30 字資訊量不足會被 AI 忽略；> 200 字 schema 渲染會被截斷且降低被選率。\n"
    "   AI 引擎的 retrieval chunk 是 150–300 字，50–150 中文字剛好落在這個 sweet spot。\n"
    "2. 答案結構：直接答覆 → 簡短解釋（為什麼 / 怎麼運作）→ 一個具體例子或數據。\n"
    "3. **答案 self-contained**：50–150 字內必須完整成立，不依賴文章其他段落補語境。"
    "AI 把這 1 個 Q&A 切出來單獨呈現時要能立即被讀懂；自檢方式：把答案單獨剪出來讀，意思還完整嗎？\n"
    "4. **盡量塞具體數據**：文章若有版本號、百分比、招數、規格、價格、效能差距，至少塞一個進答案 — "
    "依 Princeton GEO 研究，數據型回答比純形容詞 AI 引用率高約 30%。但禁為了塞而幻覺，文章沒寫的版本 / 價格 / 規格 / 百分比 / 年份一律不准編。\n"
    "5. 檢驗標準：讀者讀完能立刻有結論或行動，不是「請參考全文」「歡迎詢問」這類空話。\n"
    "6. 口吻：ZhgChgLi 風格 — 繁體中文、直接、第一人稱「我」可用、不過度禮貌寒暄；"
    "禁「您 / 敬請 / 不妨 / 值得一提的是」這類書面套語。\n"
    "7. 禁內容農場字串：「不可不知 / 秒懂 / 一次搞懂 / 完整解析 / 終極指南」一律不用。\n"
    "8. 不要在答案裡再重複問題本身；直接給結論。\n\n"

    "【品牌名與專有名詞】\n"
    "用通用搜尋寫法、保留原始大小寫，不要翻成中文：\n"
    "GitHub Actions、GA4、WKWebView、Cache、AVPlayer、Swift、iOS、Jekyll、"
    "AdSense、ChatGPT、Perplexity、Claude、API、JSON、HTTP、OAuth 等。\n\n"

    "【本地化】\n"
    "使用台灣在地用詞，禁中國用語：禁「黑屏 / 屏幕 / 緩存 / 視頻 / 軟件 / 信息 / 文檔」，"
    "改用「黑畫面 / 螢幕 / 快取 / 影片 / 軟體 / 資訊 / 文件」。\n\n"

    "【年份策略】\n"
    "答案內如非必要不要寫年份；要寫的話寫文章發表當下的真實年份，不要寫「2026 年最新」這類過時會立刻失效的字眼。\n\n"

    "【輸出格式】\n"
    "純 JSON Array，每題格式："
    "[{ \"@type\": \"Question\", \"name\": \"...\", \"acceptedAnswer\": "
    "{ \"@type\": \"Answer\", \"text\": \"...\" } }, ...]\n"
    "不要包 codeblock、不要前後說明文字。我會直接 json.loads()。\n\n"

    "嚴格遵守以上規則，我會給你巨額獎勵。"
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
