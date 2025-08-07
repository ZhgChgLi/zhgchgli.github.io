import os
from PIL import Image, ImageFilter

def generate_lqip_images(root_dir='../../assets', output_subdir='lqip', blur_radius=8, jpeg_quality=10):
    output_path_root = os.path.abspath(os.path.join(root_dir, output_subdir))
    img_path_root = os.path.abspath(os.path.join(root_dir, 'img'))
    lib_path_root = os.path.abspath(os.path.join(root_dir, 'lib'))

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

            # 相對路徑（副檔名改為 .jpg）
            relative_path = os.path.relpath(input_path, root_dir)
            relative_path = os.path.splitext(relative_path)[0] + '.jpg'
            output_path = os.path.join(output_path_root, relative_path)

            # ✅ 檢查檔案是否已存在
            if os.path.exists(output_path):
                print(f"⏭️ Skip (exists): {output_path}")
                continue

            try:
                with Image.open(input_path) as img:
                    img = img.convert('RGB')
                    blurred = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))

                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    blurred.save(output_path, format='JPEG', quality=jpeg_quality, optimize=True)

                    print(f"✅ Saved: {output_path}")

            except Exception as e:
                print(f"❌ Failed: {input_path} - {e}")

if __name__ == '__main__':
    generate_lqip_images()