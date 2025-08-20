from openai import OpenAI
import os
import sys
import textwrap
import json
from PIL import Image
import time
import argparse
import mistune
from mistune.renderers.markdown import MarkdownRenderer
import frontmatter
import re
import concurrent.futures
from functools import partial
import subprocess

def generate_lqip_images(root_dir='../../assets', output_subdir='lqip', blur_radius=8, jpeg_quality=10):
    output_path_root = os.path.abspath(os.path.join(root_dir, output_subdir))
    img_path_root = os.path.abspath(os.path.join(root_dir, 'img'))
    images_path_root = os.path.abspath(os.path.join(root_dir, 'images'))
    lib_path_root = os.path.abspath(os.path.join(root_dir, 'lib'))
    medium_to_jekyll_starter_path_root = os.path.abspath(os.path.join(root_dir, 'medium-to-jekyll-starter'))


    records = {}
    for dirpath, _, filenames in os.walk(root_dir):
        abs_dirpath = os.path.abspath(dirpath)
        if (
            abs_dirpath.startswith(output_path_root) or
            abs_dirpath.startswith(img_path_root) or
            abs_dirpath.startswith(images_path_root) or
            abs_dirpath.startswith(medium_to_jekyll_starter_path_root) or
            abs_dirpath.startswith(lib_path_root)
        ):
            continue

        for index, filename in enumerate(filenames):
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                continue
            
            input_path = os.path.join(dirpath, filename)

            try:
                with Image.open(input_path) as img:
                    basename = os.path.splitext(filename)[0]
                    webp_path = os.path.join(dirpath, basename + ".webp")
                    if os.path.exists(webp_path):
                        print(f"✅ [{dirpath}][{index + 1}/{len(filenames)}] 已存在: {webp_path}")
                    elif filename.lower().endswith(('.gif')):
                        print(f"✅ [{dirpath}][{index + 1}/{len(filenames)}] Skip GIF: {webp_path}")
                    else:
                        os.remove(input_path)
                        img.thumbnail((1200, 1200), Image.LANCZOS)
                        img.save(webp_path, format="WEBP", quality=80, method=6, optimize=True)
                        print(f"✅ [{dirpath}]{index + 1}/{len(filenames)}] 已轉換: {webp_path}")

                    width, height = img.size

                    records[basename] = {
                        "width": width,
                        "height": height
                    }

            except Exception as e:
                print(f"❌ Failed: {input_path} - {e}")

    json_output_path = os.path.join(output_path_root, "lqip_images.json")
    with open(json_output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, separators=(',', ':'))

    print(f"📄 已寫入 JSON 記錄: {json_output_path}")


def split_into_chunks(text, max_tokens=3000):
    paragraphs = text.split('\n\n')
    chunks, current = [], ""

    for para in paragraphs:
        if len(current) + len(para) < max_tokens * 4:
            current += para + "\n\n"
        else:
            chunks.append(current.strip())
            current = para + "\n\n"
    if current:
        chunks.append(current.strip())
    return chunks

def generate_seo_from_chunks(chunks):
    content_summary = ""

from mistune.renderers.markdown import MarkdownRenderer

class MyRenderer(MarkdownRenderer):
    def __init__(self, client=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.client = client
        
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
                {"role": "system", "content": "你是一位科技(iOS/RPA/AI)與旅遊專家。請參考我剛剛給你的文章全文，幫我把以下文章 Markdown 段落翻譯成英文。請務必永遠遵守以下原則：1. 務必永遠保持原有的 Markdown 格式和結構。2. 永遠不要翻譯 URL連結 3. 使用簡潔明瞭的英文表達，避免冗長或複雜的句子。4. 確保翻譯後的內容符合英文語法和用詞習慣。5. 不要添加任何額外的解釋或評論。6. 程式碼區塊務必永遠保持原本的程式碼，只能翻譯註解7.永遠不要動到原本的 Markdown 符號。9.永遠遵照原本的 Markdown 格式，原本不是 Quote 或 Code 的區塊，就絕對不要把結果包裝在```給我。10.請千萬不要擅自改變任何檔案路徑字串。如果你嚴格遵守前面的要求的好我將給你巨額獎勵。規則都很清楚你不要耍白痴浪費資源。"},
                {"role": "user", "content": text}
            ],
            temperature=0.5
        )
        result = response.choices[0].message.content.strip()
        print(f"翻譯段落: {text[:50]}...")  # Log the first 50 characters for context
        print(f"翻譯結果: {result[:50]}...")  # Log the first 50 characters of the result for context
        return result

def translate():
    parser = argparse.ArgumentParser(description="Translate Markdown content using OpenAI API")
    parser.add_argument("--api-key", help="OpenAI API key (optional, 預設讀環境變數 OPENAI_API_KEY)")
    args = parser.parse_args()

    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: 請提供 API key (--api-key) 或設 OPENAI_API_KEY 環境變數")
        sys.exit(1)

    root_dir = "../../_posts/zh-tw/zmediumtomarkdown"

    def process_file(filename, root_dir, api_key):
        file_path = os.path.join(root_dir, filename)
        basename = os.path.splitext(filename)[0]
        output_file_path = os.path.join("../../_posts/en/zmediumtomarkdown", filename)

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                post = frontmatter.load(f)
                content = post.content
                client = OpenAI(api_key=api_key)

                format_markdown = mistune.create_markdown(renderer=MyRenderer(client=client))
                print(f"正在處理 {filename}...")
                response = client.chat.completions.create(
                    model="gpt-4.1-mini",
                    messages=[
                        {"role": "system", "content": "你是一位科技(iOS/RPA/AI)與旅遊專家。以下是我的文章全文，請你先仔細閱讀了解 Context。我將在稍後的請求中請你將我的文章段落翻譯成英文。"},
                        {"role": "user", "content": "文章內容:\n" + content}
                    ],
                    temperature=0.5
                )

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
                        {"role": "system", "content": "你是一位科技(iOS/RPA/AI)旅遊與英語專家。請參考我剛剛給你的文章全文，幫我把文章 tags, categories 翻譯成符合場景的英文。請使用 {\"tags\":[],\"categories\":[]} 的 JSON 格式回應，不需要 codeblock，我會直接用 Python 解析你的回應成 json format。如果原本就是英文請務必保持原本的英文及大小寫。如果你嚴格遵守這虛的要求好我將給你巨額獎勵。"},
                        {"role": "user", "content": "Title: " + str(post['tags']) + "\nCategories:\n" + str(post['categories'])}
                    ],
                    temperature=0.5
                )

                result = response.choices[0].message.content.strip()
                result = json.loads(result)
                post['tags'] = result['tags']
                post['categories'] = result['categories']

                category_mapping = {
                    "travel journals": "Travel Journals"
                }
                post['categories'] = [category_mapping.get(cat, cat) for cat in post['categories']]

                with open(output_file_path, 'w', encoding='utf-8') as f:
                    f.write(frontmatter.dumps(post))
                    print(f"✅ 已處理 {filename}")
                print(f"📄 已儲存翻譯結果")

        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析失敗：{filename} - {e}")
        except Exception as e:
            print(f"❌ 發生錯誤：{filename} - {e}")

    filenames = get_changed_markdown_files()
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(partial(process_file, root_dir=root_dir, api_key=api_key), filenames)

def get_orginal_english_title(file_path):
    if not os.path.exists(file_path):
        return ""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            post = frontmatter.load(f)
            return post.get('title', '').strip()
    except Exception:
        return ""

def get_changed_markdown_files():
    result = subprocess.run(
        ['git', 'diff', '--name-only', 'HEAD'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=True
    )

    files = result.stdout.strip().split('\n')
    md_files = [
        f for f in files
        if f.startswith('_posts/zh-tw/zmediumtomarkdown/') and f.endswith('.md')
    ]
    return [os.path.basename(f) for f in md_files]

def optimize_seo_from_file():
    parser = argparse.ArgumentParser(description="SEO 工具")
    parser.add_argument("--api-key", help="OpenAI API key (optional, 預設讀環境變數 OPENAI_API_KEY)")
    args = parser.parse_args()

    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: 請提供 API key (--api-key) 或設 OPENAI_API_KEY 環境變數")
        sys.exit(1)

    root_dir = "../../_posts/zh-tw/zmediumtomarkdown"
    client = OpenAI(api_key=api_key)
    output_path = os.path.join("../../assets", "seo_results.json")

    # 讀取已存在結果
    if os.path.exists(output_path):
        with open(output_path, "r", encoding="utf-8") as f:
            seo_results = json.load(f)
    else:
        seo_results = {}

    for filename in os.listdir(root_dir):
        file_path = os.path.join(root_dir, filename)
        basename = os.path.splitext(filename)[0]

        if not filename.endswith(".md"):
            continue

        if basename in seo_results:
            print(f"⏭ 已存在，跳過：{filename}")
            continue

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                response = client.chat.completions.create(
                    model="gpt-4.1-mini",
                    messages=[
                        {"role": "system", "content": "你是一位 SEO 內容專家，我將分段貼上我的文章內容，請幫我的文章內容產生最佳的 SEO 標題跟描述，標題控制在 40 到 60 個字以內盡量把主關鍵詞靠前、用半形「：｜—」清楚分段。、描述控制在 140 到 156 個字以內、不要冗詞贅字、請已讀者的立場產生，一句話講清楚受眾 + 痛點 + 解法 + 成果，避免使用「本篇/本文/針對」等套話開頭。你的回應應專注於 SEO 策略、技術和見解。請勿在回覆中提供一般的行銷建議或解釋。請使用正體中文回應。避免高度重複起手式：把動詞換成具體成果或數字（如「載入快 35%」、「3 招」、「腳本一鍵重啟」）。 年份策略：文章不要在標題寫到年份。品牌名與專有名詞：盡量用通用搜尋寫法（如 GitHub Actions、GA4、WKWebView、Cache）並保留大小寫，不用特別翻譯成中文。請使用 {\"title\":\"\",\"description\":\"\"} 的 JSON 格式回應，不需要 codeblock，我會直接用 Python 解析你的回應成 json format。請使用台灣在地化的用詞用語、不要使用中國用語(例如 黑屏、屏幕、緩存)。請避免使用常見的內容農場文字。如果你嚴格遵守這些的要求好我將給你巨額獎勵。"},
                        {"role": "user", "content": "文章內容:\n====\n" + content + "\n====\n"}
                    ],
                    temperature=0.5
                )
                result = response.choices[0].message.content.strip()
                seo_results[basename] = json.loads(result)
                print(f"✅ 已處理 {filename}")

                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(seo_results, f, ensure_ascii=False, indent=2)

                print(f"📄 所有結果已儲存至 {output_path}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析失敗：{filename} - {e}")
        
        #time.sleep(60)