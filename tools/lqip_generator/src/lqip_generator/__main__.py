import os
import json
from PIL import Image

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
                    
                    webp_path = os.path.join(dirpath, os.path.splitext(filename)[0] + ".webp")
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

                    records[filename] = {
                        "width": width,
                        "height": height
                    }

            except Exception as e:
                print(f"❌ Failed: {input_path} - {e}")

    json_output_path = os.path.join(output_path_root, "lqip_images.json")
    with open(json_output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, separators=(',', ':'))

    print(f"📄 已寫入 JSON 記錄: {json_output_path}")

if __name__ == '__main__':
    generate_lqip_images()
