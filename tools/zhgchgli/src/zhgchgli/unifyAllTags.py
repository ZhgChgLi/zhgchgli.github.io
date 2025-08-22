import os
import frontmatter
from zhgchgli.helper import slugify

root_dir = "../../_posts/"

def execute():
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if not filename.endswith(".md"):
                continue
            file_path = os.path.join(dirpath, filename)
            basename = os.path.splitext(filename)[0]

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    post = frontmatter.load(f)
                    if 'tags' in post and post['tags']:
                        tags = post['tags']
                        tags = [str(t).strip().lower() for t in tags]
                        tags = [slugify(t).lower() for t in tags]
                        tags = list(dict.fromkeys(tags))
                        post['tags'] = tags

                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(frontmatter.dumps(post))

            except Exception as e:
                print(f"❌ 發生錯誤：{filename} - {e}")

    print(f"✅ 已處理 Unify Tags.")