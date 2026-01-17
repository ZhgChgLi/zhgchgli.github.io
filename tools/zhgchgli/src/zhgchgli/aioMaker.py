from openai import OpenAI
import os
import sys
import json
import argparse
import re

result_json_file_path="../../assets/data/aio/zh-tw/results.json"

def execute():
    parser = argparse.ArgumentParser(description="AIO 優化工具")
    parser.add_argument("--api-key", help="OpenAI API key (optional, 預設讀環境變數 OPENAI_API_KEY)")
    args = parser.parse_args()

    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: 請提供 API key (--api-key) 或設 OPENAI_API_KEY 環境變數")
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    # 讀取已存在結果
    if os.path.exists(result_json_file_path):
        with open(result_json_file_path, "r", encoding="utf-8") as f:
            seo_results = json.load(f)
    else:
        seo_results = {}

    configs = [
        {
            "root_dir": "../../L10n/posts/zh-tw/zmediumtomarkdown"
        },
        {
            "root_dir": "../../L10n/posts/zh-tw/ai"
        }
    ]

    for item in configs:
        root_dir = item["root_dir"]

        for filename in os.listdir(root_dir):
            file_path = os.path.join(root_dir, filename)
            basename = os.path.splitext(filename)[0]
            slug = re.sub(r'^\d{4}-\d{2}-\d{2}-', '', basename)

            if not filename.endswith(".md"):
                continue


            if slug in seo_results:
                print(f"⏭ 已存在，跳過：{slug}")
                continue

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    response = client.chat.completions.create(
                        model="gpt-4.1-mini",
                        messages=[
                            {"role": "system", "content": "你是一位 AIO 內容專家，我會貼上我的文章內容，請幫我的文章內容產生最佳的 AIO 3-5 則FAQ。不要冗詞贅字、請已讀者的立場產生，一句話講清楚受眾 + 痛點 + 解法 + 成果，避免使用「本篇/本文/針對」等套話開頭。你的回應應專注於 AIO 策略、技術和見解。請勿在回覆中提供一般的行銷建議或解釋。請使用正體中文回應。避免高度重複起手式。 年份策略：文章不要在標題寫到年份。品牌名與專有名詞：盡量用通用搜尋寫法（如 GitHub Actions、GA4、WKWebView、Cache）並保留大小寫，不用特別翻譯成中文。請使用 JSON-LD FAQPage Array [{ \"@type\": \"Question\", \"name\": \"\", \"acceptedAnswer\": { \"@type\": \"Answer\", \"text\": \"\" } }] 的 JSON 格式回應，不需要 codeblock，我會直接用 Python 解析你的回應成 json format。請使用台灣在地化的用詞用語、不要使用中國用語(例如 黑屏、屏幕、緩存)。請避免使用常見的內容農場文字。如果你嚴格遵守這些的要求好我將給你巨額獎勵。"},
                            {"role": "user", "content": "文章內容:\n====\n" + content + "\n====\n"}
                        ],
                        temperature=0.5
                    )
                    result = response.choices[0].message.content.strip()
                    seo_results[slug] = json.loads(result)
                    print(f"✅ 已處理 {filename}")

                    with open(result_json_file_path, "w", encoding="utf-8") as f:
                        json.dump(seo_results, f, ensure_ascii=False)

                    print(f"📄 所有結果已儲存至 {result_json_file_path}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON 解析失敗：{filename} - {e}")