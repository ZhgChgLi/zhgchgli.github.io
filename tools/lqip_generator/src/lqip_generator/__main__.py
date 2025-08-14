import os
import json
from PIL import Image, ImageDraw

def generate_lqip_images(root_dir='../../assets', output_subdir='lqip', blur_radius=8, jpeg_quality=10):
    output_path_root = os.path.abspath(os.path.join(root_dir, output_subdir))
    img_path_root = os.path.abspath(os.path.join(root_dir, 'img'))
    lib_path_root = os.path.abspath(os.path.join(root_dir, 'lib'))


    records = {}
    for dirpath, _, filenames in os.walk(root_dir):
        abs_dirpath = os.path.abspath(dirpath)
        if (
            abs_dirpath.startswith(output_path_root) or
            abs_dirpath.startswith(img_path_root) or
            abs_dirpath.startswith(lib_path_root)
        ):
            continue

        for filename in filenames:
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                continue
            
            input_path = os.path.join(dirpath, filename)
            try:
                with Image.open(input_path) as img:
                    width, height = img.size
                    records[filename] = height
                    makeImageIfNeeded(height, output_path_root)

            except Exception as e:
                print(f"❌ Failed: {input_path} - {e}")

    json_output_path = os.path.join(output_path_root, "lqip_images.json")
    with open(json_output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"📄 已寫入 JSON 記錄: {json_output_path}")

def makeImageIfNeeded(height, output_path_root):
    width = 600  # 預設寬度
    output_path = os.path.join(output_path_root, str(height) + '.svg')

    if os.path.exists(output_path):
        print(f"✅ 已存在: {output_path}")
        return

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}"><rect width="100%" height="100%" fill="grey"/></svg>'''

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg_content)

    print(f"✅ 圖片產生成功: {output_path}")

if __name__ == '__main__':
    generate_lqip_images()
