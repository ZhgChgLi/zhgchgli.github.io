#!/usr/bin/env python3
"""
Generate SEO title + description for each zh-tw post via OpenAI.

Reads posts under L10n/posts/zh-tw/{zmediumtomarkdown,ai}/, writes
assets/data/seo/zh-tw/results.json (keyed by file slug). Also emits a
zh-cn variant via OpenCC t2s. Posts already present in the result file
are skipped.

Usage:
    OPENAI_API_KEY=sk-... python tools/translators/seo_maker.py
"""
import argparse
import copy
import json
import os
import re
import sys

from openai import OpenAI
from opencc import OpenCC

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RESULT_PATH = os.path.join(ROOT, "assets/data/seo/zh-tw/results.json")
CN_RESULT_PATH = os.path.join(ROOT, "assets/data/seo/zh-cn/results.json")
SUBDIRS = [
    "L10n/posts/zh-tw/zmediumtomarkdown",
    "L10n/posts/zh-tw/ai",
]
MODEL = "gpt-4.1-mini"

SYSTEM_PROMPT = (
    "你是一位 SEO 內容專家，我將分段貼上我的文章內容，請幫我的文章內容產生最佳的 SEO 標題跟描述，"
    "標題控制在 40 到 60 個字以內盡量把主關鍵詞靠前、用半形「：｜—」清楚分段。、"
    "描述控制在 140 到 156 個字以內、不要冗詞贅字、請已讀者的立場產生，一句話講清楚受眾 + 痛點 + 解法 + 成果，"
    "避免使用「本篇/本文/針對」等套話開頭。你的回應應專注於 SEO 策略、技術和見解。"
    "請勿在回覆中提供一般的行銷建議或解釋。請使用正體中文回應。"
    "避免高度重複起手式：把動詞換成具體成果或數字（如「載入快 35%」、「3 招」、「腳本一鍵重啟」）。 "
    "年份策略：文章不要在標題寫到年份。"
    "品牌名與專有名詞：盡量用通用搜尋寫法（如 GitHub Actions、GA4、WKWebView、Cache）並保留大小寫，"
    "不用特別翻譯成中文。"
    "請使用 {\"title\":\"\",\"description\":\"\"} 的 JSON 格式回應，不需要 codeblock，"
    "我會直接用 Python 解析你的回應成 json format。"
    "請使用台灣在地化的用詞用語、不要使用中國用語(例如 黑屏、屏幕、緩存)。"
    "請避免使用常見的內容農場文字。"
    "如果你嚴格遵守這些的要求好我將給你巨額獎勵。"
)


def main():
    parser = argparse.ArgumentParser(description="SEO 優化工具")
    parser.add_argument("--api-key", help="OpenAI API key (預設讀環境變數 OPENAI_API_KEY)")
    args = parser.parse_args()

    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: 請提供 API key (--api-key) 或設 OPENAI_API_KEY 環境變數")
        sys.exit(1)

    client = OpenAI(api_key=api_key)
    cc = OpenCC("t2s")

    os.makedirs(os.path.dirname(RESULT_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(CN_RESULT_PATH), exist_ok=True)

    if os.path.exists(RESULT_PATH):
        with open(RESULT_PATH, "r", encoding="utf-8") as f:
            results = json.load(f)
    else:
        results = {}

    for sub in SUBDIRS:
        root_dir = os.path.join(ROOT, sub)
        if not os.path.isdir(root_dir):
            continue
        for filename in os.listdir(root_dir):
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
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": "文章內容:\n====\n" + content + "\n====\n"},
                    ],
                    temperature=0.5,
                )
                result = response.choices[0].message.content.strip()
                results[slug] = json.loads(result)
                print(f"✅ 已處理 {filename}")

                with open(RESULT_PATH, "w", encoding="utf-8") as f:
                    json.dump(results, f, ensure_ascii=False)

                with open(CN_RESULT_PATH, "w", encoding="utf-8") as f:
                    cn_results = copy.deepcopy(results)
                    for s, item in cn_results.items():
                        for key, value in item.items():
                            cn_results[s][key] = cc.convert(value)
                    json.dump(cn_results, f, ensure_ascii=False)

                print(f"📄 所有結果已儲存至 {RESULT_PATH}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON 解析失敗：{filename} - {e}")


if __name__ == "__main__":
    main()
