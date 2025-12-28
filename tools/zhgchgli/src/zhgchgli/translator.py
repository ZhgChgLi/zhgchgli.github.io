from openai import OpenAI
import os
import sys
import json
import argparse
import frontmatter
import concurrent.futures
from functools import partial
import re
import mistune
from mistune.renderers.markdown import MarkdownRenderer

root_dir = "../../L10n/posts/zh-tw/zmediumtomarkdown"
output_root_dir = "../../L10n/posts/en/zmediumtomarkdown"

def execute():
    parser = argparse.ArgumentParser(description="Translate Markdown content using OpenAI API")
    parser.add_argument("--api-key", help="OpenAI API key (optional, 預設讀環境變數 OPENAI_API_KEY)")
    args = parser.parse_args()

    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: 請提供 API key (--api-key) 或設 OPENAI_API_KEY 環境變數")
        sys.exit(1)

    def process_file(filename, root_dir, api_key):
        file_path = os.path.join(root_dir, filename)
        basename = os.path.splitext(filename)[0]
        slug = re.sub(r'^\d{4}-\d{2}-\d{2}-', '', basename)

        output_file_path = os.path.join(output_root_dir, filename)

        if os.path.exists(output_file_path):
            with open(output_file_path, "r", encoding="utf-8") as f:
                en = frontmatter.load(f)
                with open(file_path, 'r', encoding='utf-8') as zf:
                    zh = frontmatter.load(zf)
                    if en['last_modified_at'] == zh['last_modified_at']:
                        print(f"⏭ 無修改，跳過：{basename}")
                        return

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                post = frontmatter.load(f)
                content = post.content
                client = OpenAI(api_key=api_key)

                print(f"正在處理 {filename}...")
                response = client.chat.completions.create(
                    model="gpt-4.1-mini",
                    messages=[
                        {"role": "system", "content": "你是一位科技(iOS/RPA/AI)與旅遊專家。以下是我的文章全文，請你仔細閱讀了解。最後產生一段總結文字給我，我會把你的總結帶入之後的翻譯請求。總結內容會給翻譯的 API 做參考。內容只需要講重點不要冗詞贅字。內容不能超過 300 個字。"},
                        {"role": "user", "content": "文章內容:\n" + content}
                    ],
                    temperature=0.5
                )
                summary = response.choices[0].message.content.strip()
                format_markdown = mistune.create_markdown(renderer=MyRenderer(client=client,summary=summary))
                result = format_markdown(content)
                result = result.replace("|", r"\\|")
                post.content = result

                response = client.chat.completions.create(
                    model="gpt-4.1-mini",
                    messages=[
                        {"role": "system", "content": "你是一位科技(iOS/RPA/AI)與旅遊專家。請參考我剛剛給你的文章全文，幫我產生最佳的「英文」 SEO 標題跟描述，標題控制在 40 到 60 個字以內盡量把主關鍵詞靠前、用半形「：｜—」清楚分段。、描述控制在 140 到 156 個字以內、不要冗詞贅字、請已讀者的立場產生，一句話講清楚受眾 + 痛點 + 解法 + 成果。你的回應應專注於 SEO 策略、技術和見解。請勿在回覆中提供一般的行銷建議或解釋。避免高度重複起手式：把動詞換成具體成果或數字（如「載入快 35%」、「3 招」、「腳本一鍵重啟」）。 年份策略：文章不要在標題寫到年份。品牌名與專有名詞：盡量用通用搜尋寫法（如 GitHub Actions、GA4、WKWebView、Cache）並保留大小寫。請使用 {\"title\":\"\",\"description\":\"\"} 的 JSON 格式回應，不需要 codeblock，我會直接用 Python 解析你的回應成 json format。請避免使用常見的內容農場文字。如果你嚴格遵守這些要求好我將給你巨額獎勵。"},
                        {"role": "user", "content": "Title: " + post["title"] + "\nDescription:\n" + post["description"]}
                    ],
                    temperature=0.5
                )

                result = response.choices[0].message.content.strip()
                result = json.loads(result)

                org_title = get_orginal_english_title(output_file_path)
                if org_title == "":
                    post['title'] = result['title']
                else:
                    post['title'] = org_title
                post['description'] = result['description']

                category_mapping = {
                    "Z 度旅行遊記": "Travel Journals"
                }
                post['categories'] = [category_mapping.get(cat, cat) for cat in post['categories']]

                response = client.chat.completions.create(
                    model="gpt-4.1-mini",
                    messages=[
                        {"role": "system", "content": "你是一位科技(iOS/RPA/AI)旅遊與英語專家。請參考我剛剛給你的文章全文，幫我把文章 tags, categories 翻譯成符合場景的英文。請使用 {\"tags\":[],\"categories\":[]} 的 JSON 格式回應，不需要 codeblock，我會直接用 Python 解析你的回應成 json format。如果原本就是英文請務必保持原本的英文大小寫及符號。如果你嚴格遵守這虛的要求好我將給你巨額獎勵。"},
                        {"role": "user", "content": "Title: " + str(post['tags']) + "\nCategories:\n" + str(post['categories'])}
                    ],
                    temperature=0.5
                )

                result = response.choices[0].message.content.strip()
                result = json.loads(result)
                post['tags'] = result['tags']
                post['categories'] = result['categories']

                category_mapping = {
                    "travel journals": "Travel Journals",
                    "ZRealm Life": "ZRealm Life.",
                    "ZRealm Development": "ZRealm Dev.",
                    "ZRealm Dev": "ZRealm Dev.",
                    "Robotic Process Automation": "ZRealm Robotic Process Automation"
                }
                post['categories'] = [category_mapping.get(cat, cat) for cat in post['categories']]
                if "english" not in post['tags']:
                    post['tags'].append("english")
                    
                if "ai-translation" not in post['tags']:
                    post['tags'].append("ai-translation")
                

                with open(output_file_path, 'w', encoding='utf-8') as f:
                    f.write(frontmatter.dumps(post))
                    print(f"✅ 已處理 {filename}")
                print(f"📄 已儲存翻譯結果")

        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析失敗：{filename} - {e}")
        except Exception as e:
            print(f"❌ 發生錯誤：{filename} - {e}")

    filenames = os.listdir(root_dir)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(process_file, filename, root_dir, api_key)
            for filename in filenames
        ]
        for future in concurrent.futures.as_completed(futures):
            try:
                future.result()  # 這裡會拋出子任務裡的 Exception
            except Exception as e:
                print(f"❌ 任務失敗: {e}")

def get_orginal_english_title(file_path):
    if not os.path.exists(file_path):
        return ""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            post = frontmatter.load(f)
            return post.get('title', '').strip()
    except Exception:
        return ""





class MyRenderer(MarkdownRenderer):
    def __init__(self, client=None, summary="", *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.client = client
        self.summary = summary
        
    def text(self, token, state):
        result = super().text(token, state)
        return result

    def block_quote(self, token, state):
        result = super().block_quote(token, state)
        result = self.translate(result)
        return result+"\n\n"

    def list(self, text, ordered, **attrs):
        result = super().list(text, ordered, **attrs)
        result = self.translate(result)
        return result+"\n\n"

    def block_code(self, code, info=None):
        result = super().block_code(code, info)
        result = self.translate(result)
        return result+"\n\n"

    def block_text(self, token, state):
        result = super().block_text(token, state)
        result = self.translate(result)
        return result+"\n\n"

    def paragraph(self, token, state):
        result = super().paragraph(token, state)
        result = self.translate(result)
        return result+"\n\n"

    def heading(self, token, state):
        result = super().heading(token, state)
        result = self.translate(result)
        return result+"\n\n"
    
    def translate(self, text):
        response = self.client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": f"本篇文章總結：{self.summary}"},
                {"role": "system", "content": "你是一位科技(iOS/RPA/AI)與旅遊專家。請參考我剛剛給你的文章總結，了解 Context，然後幫我把以下文章 Markdown 段落翻譯成英文。請務必永遠遵守以下原則：1. 務必永遠保持原有的 Markdown 格式和結構。2. 永遠不要翻譯 URL連結 3. 使用簡潔明瞭的英文表達，避免冗長或複雜的句子。4. 確保翻譯後的內容符合英文語法和用詞習慣。5. 不要添加任何額外的解釋或評論。6. 程式碼區塊務必永遠保持原本的程式碼，只能翻譯註解7.永遠不要動到原本的 Markdown 符號。9.永遠遵照原本的 Markdown 格式，原本不是 Quote 或 Code 的區塊，就絕對不要把結果包裝在```給我。10.請千萬不要擅自改變任何檔案路徑字串。11.如果原本有反斜線也請保持反斜線。如果你嚴格遵守前面的要求的好我將給你巨額獎勵。規則都很清楚你不要耍白痴浪費資源。"},
                {"role": "user", "content": text}
            ],
            temperature=0.5
        )
        result = response.choices[0].message.content.strip()
        print(f"翻譯段落: {text[:50]}...")  # Log the first 50 characters for context
        print(f"翻譯結果: {result[:50]}...")  # Log the first 50 characters of the result for context
        return result