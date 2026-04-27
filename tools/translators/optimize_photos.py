#!/usr/bin/env python3
"""
Walk assets/, convert non-webp images to .webp (resized to max 1200px,
quality 80), overlay a play-icon triangle for *_hqdefault thumbnails,
and write assets/data/photos.json with each image's (width, height).

Skips assets/{data,img,images,lib,medium-to-jekyll-starter}/. Existing
.webp siblings are kept untouched. GIFs are skipped (kept animated).

Usage:
    pip install pillow
    python tools/translators/optimize_photos.py
"""
import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ASSETS_DIR = os.path.join(ROOT, "assets")
RESULT_PATH = os.path.join(ASSETS_DIR, "data", "photos.json")
SKIP_SUBDIRS = ["data", "img", "images", "lib", "medium-to-jekyll-starter"]
EXTS = (".jpg", ".jpeg", ".png", ".gif", ".webp")


def main():
    skip_roots = [os.path.abspath(os.path.join(ASSETS_DIR, d)) for d in SKIP_SUBDIRS]

    records = {}
    for dirpath, _, filenames in os.walk(ASSETS_DIR):
        abs_dirpath = os.path.abspath(dirpath)
        if any(abs_dirpath.startswith(p) for p in skip_roots):
            continue

        slug = os.path.basename(dirpath)
        if slug not in records:
            records[slug] = {}

        for index, filename in enumerate(filenames):
            if not filename.lower().endswith(EXTS):
                continue

            input_path = os.path.join(dirpath, filename)
            try:
                with Image.open(input_path) as img:
                    basename = os.path.splitext(filename)[0]
                    webp_path = os.path.join(dirpath, basename + ".webp")

                    if os.path.exists(webp_path):
                        print(f"✅ [{dirpath}][{index + 1}/{len(filenames)}] 已存在: {webp_path}")
                    elif filename.lower().endswith(".gif"):
                        print(f"✅ [{dirpath}][{index + 1}/{len(filenames)}] Skip GIF: {webp_path}")
                    else:
                        img.thumbnail((1200, 1200), Image.LANCZOS)
                        img.save(webp_path, format="WEBP", quality=80, method=6, optimize=True)

                        # Overlay a play-icon triangle on YouTube hqdefault thumbnails.
                        if basename.lower().endswith("_hqdefault"):
                            with Image.open(webp_path) as webp_img:
                                draw = ImageDraw.Draw(webp_img, "RGBA")
                                width, height = webp_img.size
                                side_length = int(min(width, height) * 0.2)
                                center_x = width // 2
                                center_y = height // 2
                                half_height = (side_length * (3 ** 0.5)) / 2
                                point1 = (center_x - side_length / 2, center_y - half_height / 3)
                                point2 = (center_x - side_length / 2, center_y + half_height * 2 / 3)
                                point3 = (center_x + side_length / 2, center_y)
                                draw.polygon([point1, point2, point3], fill=(255, 255, 255, 128))
                                webp_img.save(webp_path, format="WEBP", quality=80, method=6, optimize=True)

                        print(f"✅ [{dirpath}][{index + 1}/{len(filenames)}] 已轉換: {webp_path}")

                    width, height = img.size
                    records[slug][basename] = {"width": width, "height": height}

            except Exception as e:
                print(f"❌ Failed: {input_path} - {e}")

    os.makedirs(os.path.dirname(RESULT_PATH), exist_ok=True)
    with open(RESULT_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, separators=(",", ":"))

    print(f"📄 已寫入 JSON 記錄: {RESULT_PATH}")


if __name__ == "__main__":
    main()
