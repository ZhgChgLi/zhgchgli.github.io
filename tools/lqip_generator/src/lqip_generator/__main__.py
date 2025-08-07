import os
from PIL import Image, ImageFilter

def generate_lqip_images(root_dir='../../assets', output_subdir='lqip', blur_radius=8, jpeg_quality=10):
    output_path_root = os.path.join(root_dir, output_subdir)
    img_path_root = os.path.join(root_dir, 'img')
    images_path_root = os.path.join(root_dir, 'images')
    lib_path_root = os.path.join(root_dir, 'lib')

    for dirpath, _, filenames in os.walk(root_dir):
        abs_dirpath = os.path.abspath(dirpath)
        if (output_path_root in abs_dirpath or
            images_path_root in abs_dirpath or
            lib_path_root in abs_dirpath):
            continue

        for filename in filenames:
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue

            input_path = os.path.join(dirpath, filename)

            try:
                with Image.open(input_path) as img:
                    # 強制轉為 RGB（避免透明問題）
                    img = img.convert('RGB')

                    # 模糊處理（保持原尺寸）
                    blurred = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))

                    # 相對路徑（副檔名換成 .jpg）
                    relative_path = os.path.relpath(input_path, root_dir)
                    relative_path = os.path.splitext(relative_path)[0] + '.jpg'
                    output_path = os.path.join(output_path_root, relative_path)

                    os.makedirs(os.path.dirname(output_path), exist_ok=True)

                    # 儲存 JPEG，極限壓縮
                    blurred.save(output_path, format='JPEG', quality=jpeg_quality, optimize=True)

                    print(f"✅ Saved: {output_path}")

            except Exception as e:
                print(f"❌ Failed: {input_path} - {e}")

if __name__ == '__main__':
    generate_lqip_images()