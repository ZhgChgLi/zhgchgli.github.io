from opencc import OpenCC
import os
import sys
import json
import argparse
import frontmatter
import concurrent.futures
import re
import mistune
from functools import partial
from mistune.renderers.markdown import MarkdownRenderer

def execute():
    def process_file(filename, root_dir, output_root_dir):
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
                client = OpenCC("t2s")
                
                format_markdown = mistune.create_markdown(renderer=MyRenderer(client=client))
                print(f"正在處理 {filename}...")
                result = format_markdown(content)
                result = result.replace("|", r"\\|")
                post.content = result

                org_title = get_orginal_cn_title(output_file_path)
                if org_title == "":
                    post['title'] = client.convert(post['title'])
                else:
                    post['title'] = org_title

                post['description'] = client.convert(post['description'])

                if "simplified-chinese" not in post['tags']:
                    post['tags'].append("simplified-chinese")

                with open(output_file_path, 'w', encoding='utf-8') as f:
                    f.write(frontmatter.dumps(post))
                    print(f"✅ 已處理 {filename}")
                print(f"📄 已儲存翻譯結果")

        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析失敗：{filename} - {e}")
        except Exception as e:
            print(f"❌ 發生錯誤：{filename} - {e}")

    configs = [
        {
            "root_dir": "../../L10n/posts/zh-tw/zmediumtomarkdown",
            "output_root_dir": "../../L10n/posts/zh-cn/zmediumtomarkdown"
        },
        {
            "root_dir": "../../L10n/posts/zh-tw/ai",
            "output_root_dir": "../../L10n/posts/zh-cn/ai"
        }
    ]

    for item in configs:
        root_dir = item["root_dir"]
        output_root_dir = item["output_root_dir"]

        filenames = os.listdir(root_dir)
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(process_file, filename, root_dir, output_root_dir)
                for filename in filenames
            ]
            for future in concurrent.futures.as_completed(futures):
                try:
                    future.result()  # 這裡會拋出子任務裡的 Exception
                except Exception as e:
                    print(f"❌ 任務失敗: {e}")

def get_orginal_cn_title(file_path):
    if not os.path.exists(file_path):
        return ""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            post = frontmatter.load(f)
            return post.get('title', '').strip()
    except Exception:
        return ""





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
        result = self.client.convert(text)
        print(f"翻譯段落: {text[:50]}...")  # Log the first 50 characters for context
        print(f"翻譯結果: {result[:50]}...")  # Log the first 50 characters of the result for context
        return result