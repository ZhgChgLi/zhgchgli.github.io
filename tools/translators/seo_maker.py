#!/usr/bin/env python3
"""
Generate SEO title + description per post via OpenAI for zh-tw / en / jp.

Reads L10n/posts/{target}/{zmediumtomarkdown,ai}/ and writes
assets/data/seo/{target}/results.json (keyed by file slug). For zh-tw also
emits a zh-cn variant via OpenCC t2s. Posts already present are skipped.
Consumed by _plugins/short_url_redirects.rb.

Usage:
    OPENAI_API_KEY=sk-... python3 tools/translators/seo_maker.py            # zh-tw (default)
    OPENAI_API_KEY=sk-... python3 tools/translators/seo_maker.py en
    OPENAI_API_KEY=sk-... python3 tools/translators/seo_maker.py jp
"""
import argparse
import copy
import json
import os
import re
import sys

import frontmatter
from openai import OpenAI
from opencc import OpenCC

from _env import load_dotenv

load_dotenv()  # local: pull OPENAI_API_KEY etc. from repo-root .env (no-op in CI)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SUBDIRS = ["zmediumtomarkdown", "ai"]
MODEL = "gpt-4.1-mini"

PROMPT_ZH_TW = (
    "你是一位同時擅長 SEO 與 AEO（給 ChatGPT / Perplexity / Claude / Bing Copilot 用）的內容專家，"
    "我將貼上我的文章內容，請幫我產生最佳的 meta title 與 description。"
    "標題長度以 Google 桌面 SERP 約 600 像素為上限（純中文約 30–35 字、含英數混合約 40–55 字最佳；行動端可到 70–80 字元但仍避免超過 60 字保險），把主關鍵詞靠前、用半形「：｜—」分段，"
    "每篇至多 2 個分隔符 — 禁 3 個以上連環堆疊（讀起來像 tag 雲、AI 切不出引用片段）。"
    "標題同時是文章可見 H1，禁 SERP-hacky 關鍵字堆疊，要讀起來通順、有資訊密度。"
    "標題句型優先用「為什麼 X？／如何 X？／什麼是 X？／X 跟 Y 有什麼差別？」這類使用者實際搜尋框輸入的問句，"
    "但若文章核心是心得 / 開箱 / 遊記 / 個人經驗等敘述意圖，保留敘述式、不要硬塞問句。"
    "描述控制在 140 到 156 個字以內、不要冗詞贅字、用讀者立場去寫，"
    "**第一句直接給結論**（Direct Answer Block；AI 與 Featured Snippet 命中點），且 self-contained — 剪出單獨讀仍是完整結論、不依賴後文；後段再補受眾 + 痛點 + 解法 + 成果。"
    "文章若有具體數字（版本、百分比、招數、規格、價格）至少塞一個進描述（Princeton GEO：數據描述 AI 引用率 +30%）；但禁為塞數據而幻覺，文章沒寫的不准編、寧可不放。"
    "避免使用「本篇 / 本文 / 針對 / 在這篇文章中 / 這是一篇關於」等套話開頭，也禁「關於 / 淺談 / 漫談 / 初探 / 簡介」這類抽象起手式。"
    "你的回應應專注於 SEO 策略、技術和見解。請勿在回覆中提供一般的行銷建議或解釋。請使用正體中文回應。"
    "避免高度重複起手式：把動詞換成具體成果或數字（如「載入快 35%」、「3 招」、「腳本一鍵重啟」、「省 80% Token」）。"
    "年份策略：標題與描述都不要寫年份，也禁「最新版 / 2026 年最新」這類會立刻失效的字眼。"
    "口吻：ZhgChgLi 風格、直接、第一人稱「我」可用，不過度禮貌寒暄；禁用「您」「敬請」「不妨」「值得一提的是」這類書面套語。"
    "品牌名與專有名詞：盡量用通用搜尋寫法（如 GitHub Actions、GA4、WKWebView、Cache、AVPlayer、Xcode、TestFlight、ChatGPT、Perplexity、Claude）並保留大小寫，"
    "不用特別翻譯成中文。"
    "請使用 {\"title\":\"\",\"description\":\"\"} 的 JSON 格式回應，不需要 codeblock，"
    "我會直接用 Python 解析你的回應成 json format。"
    "請使用台灣在地化的用詞用語、不要使用中國用語"
    "（禁：黑屏 / 屏幕 / 緩存 / 視頻 / 軟件 / 信息 / 文檔；改用：黑畫面 / 螢幕 / 快取 / 影片 / 軟體 / 資訊 / 文件）。"
    "請避免使用常見的內容農場文字（禁：不可不知 / 秒懂 / 一次搞懂 / 完整解析 / 終極指南）。"
    "如果你嚴格遵守這些的要求好我將給你巨額獎勵。"
)

PROMPT_EN = (
    "You are an SEO content expert. I'll paste an article and you generate the "
    "best SEO title and description for it. Title: 40-60 chars; lead with the "
    "primary keyword and segment cleanly with half-width \" : | — \". "
    "Description: 140-156 chars, no filler, write from the reader's perspective: "
    "one sentence covering audience + pain point + solution + outcome. Avoid "
    "boilerplate openings like \"This article\" / \"In this post\". Focus on SEO "
    "strategy, technique, insights — not generic marketing advice. "
    "Avoid repetitive openings: swap verbs for concrete outcomes or numbers "
    "(e.g. \"35% faster load\", \"3 tactics\", \"one-click reset\"). "
    "Year strategy: do not put years in titles. "
    "Brand and proper names: keep the common search-friendly form with original "
    "casing (GitHub Actions, GA4, WKWebView, Cache, etc.); do not translate them. "
    "Respond in English. Avoid content-farm phrasing. "
    "Respond as JSON {\"title\":\"\",\"description\":\"\"} — no codeblock, I "
    "parse the response directly as JSON. Strictly follow these rules."
)

PROMPT_JP = (
    "あなたは SEO コンテンツの専門家です。記事を貼り付けるので、最適な SEO タイトルと"
    "ディスクリプションを生成してください。"
    "タイトル：40〜60 文字。主要キーワードを先頭に置き、半角の「：｜—」で明瞭に区切ってください。"
    "ディスクリプション：140〜156 文字。冗長な表現は避け、読者目線で「対象読者 + 課題 + 解決策 + 成果」を "
    "1 文で伝えてください。"
    "「本記事では」「この記事は」などの定型的な書き出しは避けてください。"
    "回答は SEO の戦略・手法・知見に絞り、一般的なマーケティング論には触れないでください。"
    "冒頭の表現が単調にならないように、動詞を具体的な成果や数字に置き換えてください"
    "（例：「読み込み 35% 高速化」「3 つの手法」「ワンクリックで再起動」）。"
    "年号戦略：タイトルに年号を含めないでください。"
    "ブランド名・固有名詞：GitHub Actions、GA4、WKWebView、Cache のように検索しやすい一般的な"
    "表記と大文字小文字をそのまま保ち、無理に翻訳しないでください。"
    "回答は日本語で記述してください。コンテンツファーム的な定型表現は避けてください。"
    "{\"title\":\"\",\"description\":\"\"} の JSON 形式で返答してください。"
    "コードブロックは不要です。Python で直接 JSON として解析します。"
    "上記の要件を厳守してください。"
)

LANGS = {
    "zh-tw": {"src_lang": "zh-tw", "system_prompt": PROMPT_ZH_TW, "emit_zh_cn": True,  "from_frontmatter": False},
    "en":    {"src_lang": "en",    "system_prompt": PROMPT_EN,    "emit_zh_cn": False, "from_frontmatter": True},
    "jp":    {"src_lang": "jp",    "system_prompt": PROMPT_JP,    "emit_zh_cn": False, "from_frontmatter": True},
}


def main():
    parser = argparse.ArgumentParser(description="SEO 優化工具 (zh-tw / en / jp)")
    parser.add_argument("target", nargs="?", default="zh-tw", choices=list(LANGS),
                        help="目標語系（預設 zh-tw）")
    parser.add_argument("--api-key", help="OpenAI API key (預設讀環境變數 OPENAI_API_KEY)")
    args = parser.parse_args()

    cfg = LANGS[args.target]

    if cfg["from_frontmatter"]:
        api_key = None
        client = None
    else:
        api_key = args.api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("❌ Error: 請提供 API key (--api-key) 或設 OPENAI_API_KEY 環境變數")
            sys.exit(1)
        client = OpenAI(api_key=api_key)

    posts_root = os.path.join(ROOT, "L10n", "posts", cfg["src_lang"])
    result_path = os.path.join(ROOT, "assets", "data", "seo", args.target, "results.json")
    cn_result_path = os.path.join(ROOT, "assets", "data", "seo", "zh-cn", "results.json")

    cc = OpenCC("t2s") if cfg["emit_zh_cn"] else None

    os.makedirs(os.path.dirname(result_path), exist_ok=True)
    if cfg["emit_zh_cn"]:
        os.makedirs(os.path.dirname(cn_result_path), exist_ok=True)

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
                if cfg["from_frontmatter"]:
                    post = frontmatter.load(file_path)
                    title = (post.get("title") or "").strip()
                    description = (post.get("description") or "").strip()
                    if not title or not description:
                        print(f"⚠️  缺 title/description，跳過：{filename}")
                        continue
                    results[slug] = {"title": title, "description": description}
                else:
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

                if cfg["emit_zh_cn"]:
                    cn_results = copy.deepcopy(results)
                    for s, item in cn_results.items():
                        for key, value in item.items():
                            cn_results[s][key] = cc.convert(value)
                    with open(cn_result_path, "w", encoding="utf-8") as f:
                        json.dump(cn_results, f, ensure_ascii=False)
            except json.JSONDecodeError as e:
                print(f"❌ JSON 解析失敗：{filename} - {e}")

    print(f"📄 所有結果已儲存至 {result_path}")


if __name__ == "__main__":
    main()
