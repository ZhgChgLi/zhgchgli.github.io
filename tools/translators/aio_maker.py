#!/usr/bin/env python3
"""
Generate AIO FAQ entries (JSON-LD FAQPage mainEntity array) per post via
OpenAI, for zh-tw / en / jp.

Reads posts under L10n/posts/{target}/{zmediumtomarkdown,ai}/ and writes
assets/data/aio/{target}/results.json (keyed by file slug). Posts already
present are skipped. Consumed by _plugins/aio_faq.rb.

Usage:
    OPENAI_API_KEY=sk-... python3 tools/translators/aio_maker.py            # zh-tw (default)
    OPENAI_API_KEY=sk-... python3 tools/translators/aio_maker.py en
    OPENAI_API_KEY=sk-... python3 tools/translators/aio_maker.py jp
"""
import argparse
import json
import os
import re
import sys

from openai import OpenAI

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

PROMPT_EN = (
    "You are an AIO content expert. I'll paste an article and you generate the "
    "best 3-5 AIO FAQs for it. No filler, write from the reader's perspective: "
    "one sentence covering audience + pain point + solution + outcome. Avoid "
    "boilerplate openings like \"This article\" / \"In this post\". Focus on "
    "AIO strategy, technique, and insights — not generic marketing advice. "
    "Year strategy: do not put years in titles. "
    "Brand and proper names: keep the common search-friendly form with original "
    "casing (GitHub Actions, GA4, WKWebView, Cache, etc.); do not translate them. "
    "Respond in English. Avoid repetitive openings. Avoid content-farm phrasing. "
    "Respond as a JSON-LD FAQPage array "
    "[{ \"@type\": \"Question\", \"name\": \"\", \"acceptedAnswer\": "
    "{ \"@type\": \"Answer\", \"text\": \"\" } }] — no codeblock, I parse the "
    "response directly as JSON. Strictly follow these rules."
)

PROMPT_JP = (
    "あなたは AIO コンテンツの専門家です。記事を貼り付けるので、その記事に最適な "
    "3〜5 件の AIO FAQ を生成してください。冗長な表現は避け、読者目線で "
    "「対象読者 + 課題 + 解決策 + 成果」を 1 文で伝えてください。"
    "「本記事では」「この記事は」などの定型的な書き出しは避けてください。"
    "回答は AIO の戦略・手法・知見に絞り、一般的なマーケティング論には触れないでください。"
    "年号戦略：タイトルに年号を含めないでください。"
    "ブランド名・固有名詞：GitHub Actions、GA4、WKWebView、Cache のように検索しやすい一般的な"
    "表記と大文字小文字をそのまま保ち、無理に翻訳しないでください。"
    "回答は日本語で記述してください。冒頭の表現が単調にならないようにしてください。"
    "コンテンツファーム的な定型表現は避けてください。"
    "JSON-LD FAQPage 配列 "
    "[{ \"@type\": \"Question\", \"name\": \"\", \"acceptedAnswer\": "
    "{ \"@type\": \"Answer\", \"text\": \"\" } }] の JSON 形式で返答してください。"
    "コードブロックは不要です。Python で直接 JSON として解析します。"
    "上記の要件を厳守してください。"
)

LANGS = {
    "zh-tw": {"src_lang": "zh-tw", "system_prompt": PROMPT_ZH_TW},
    "en":    {"src_lang": "en",    "system_prompt": PROMPT_EN},
    "jp":    {"src_lang": "jp",    "system_prompt": PROMPT_JP},
}


def main():
    parser = argparse.ArgumentParser(description="AIO 優化工具 (zh-tw / en / jp)")
    parser.add_argument("target", nargs="?", default="zh-tw", choices=list(LANGS),
                        help="目標語系（預設 zh-tw）")
    parser.add_argument("--api-key", help="OpenAI API key (預設讀環境變數 OPENAI_API_KEY)")
    args = parser.parse_args()

    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: 請提供 API key (--api-key) 或設 OPENAI_API_KEY 環境變數")
        sys.exit(1)

    cfg = LANGS[args.target]
    posts_root = os.path.join(ROOT, "L10n", "posts", cfg["src_lang"])
    result_path = os.path.join(ROOT, "assets", "data", "aio", args.target, "results.json")

    client = OpenAI(api_key=api_key)
    os.makedirs(os.path.dirname(result_path), exist_ok=True)

    if os.path.exists(result_path):
        with open(result_path, "r", encoding="utf-8") as f:
            results = json.load(f)
    else:
        results = {}

    for sub in SUBDIRS:
        root_dir = os.path.join(posts_root, sub)
        if not os.path.isdir(root_dir):
            continue
        for filename in sorted(os.listdir(root_dir)):
            if not filename.endswith(".md"):
                continue
            file_path = os.path.join(root_dir, filename)
            basename = os.path.splitext(filename)[0]
            slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", basename)

            if slug in results:
                print(f"⏭ 已存在，跳過：{slug}")
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
                result = response.choices[0].message.content.strip()
                results[slug] = json.loads(result)
                print(f"✅ 已處理 [{args.target}] {filename}")

                with open(result_path, "w", encoding="utf-8") as f:
                    json.dump(results, f, ensure_ascii=False)
            except json.JSONDecodeError as e:
                print(f"❌ JSON 解析失敗：{filename} - {e}")

    print(f"📄 所有結果已儲存至 {result_path}")


if __name__ == "__main__":
    main()
