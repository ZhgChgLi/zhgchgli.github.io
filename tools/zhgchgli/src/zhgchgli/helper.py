import re
import unicodedata
import logging

logging.basicConfig(level=logging.WARNING)

SLUGIFY_MODES = {"default", "latin"}

def slugify(string: str, mode: str = None, cased: bool = False) -> str | None:
    if string is None:
        return None

    mode = mode or "default"

    if mode not in SLUGIFY_MODES:
        return string if cased else string.lower()

    # Latin 模式：移除重音符號（accents）
    if mode == "latin":
        string = unicodedata.normalize("NFKD", string)
        string = string.encode("ascii", "ignore").decode("ascii")

    # 替換所有非字母數字為 hyphen
    slug = re.sub(r"[^A-Za-z0-9]+", "-", string)

    # 去除頭尾的 -
    slug = slug.strip("-")

    # 預設轉小寫
    if not cased:
        slug = slug.lower()

    if slug == "":
        logging.warning(f"Empty `slug` generated for '{string}'.")

    return slug