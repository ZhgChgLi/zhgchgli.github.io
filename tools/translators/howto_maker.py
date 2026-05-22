#!/usr/bin/env python3
"""
Generate HowTo schema entries (JSON-LD HowTo step arrays) per post.

zh-tw  : call OpenAI on article body. LLM judges if the article is a step-by-
         step tutorial — if yes, returns a full HowTo schema object; if no,
         returns null. Both outcomes are cached (null is a negative cache so we
         don't re-spend tokens on the same non-tutorial post).
en / jp: translate non-null zh-tw entries via OpenAI. null entries are mirrored
         as null (no API call).
zh-cn  : OpenCC t2s of zh-tw, no API call. Emitted automatically when running
         the zh-tw target.

Writes assets/data/howto/{target}/results.json (keyed by file slug). Posts
already present (or marked null) are skipped on subsequent runs. Consumed by
_plugins/howto.rb.

Usage:
    OPENAI_API_KEY=sk-... python3 tools/translators/howto_maker.py            # zh-tw (default, also emits zh-cn)
    OPENAI_API_KEY=sk-... python3 tools/translators/howto_maker.py en
    OPENAI_API_KEY=sk-... python3 tools/translators/howto_maker.py jp
"""
import argparse
import copy
import json
import os
import re
import sys

from openai import OpenAI
from opencc import OpenCC

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SUBDIRS = ["zmediumtomarkdown", "ai"]
MODEL = "gpt-4.1-mini"

PROMPT_ZH_TW = (
    "你是 AEO（Answer Engine Optimization）內容專家，專精於 schema.org/HowTo 結構化資料。"
    "我會貼上一篇文章。請判斷它是否為「步驟式教學流程」，並依結果回應：\n\n"

    "【適用判斷標準】\n"
    "適用：文章確實是「使用者照著做、有明確先後順序的操作流程」，例如：\n"
    "  - 軟體安裝 / 環境設置教學（如「在 macOS 安裝 Node.js」）\n"
    "  - 設定 / 配置流程（如「設定 GitHub Actions 自動部署」）\n"
    "  - 操作指南（如「用 Xcode 上架 App 到 TestFlight」）\n"
    "  - 修復 / 解法步驟（如「踩雷紀錄：解決 X 問題」明確列出修復步驟）\n\n"
    "不適用：\n"
    "  - 心得 / 開箱 / 評測 / 比較類\n"
    "  - 概念解釋 / 原理探討 / 觀點文章\n"
    "  - 旅遊遊記 / 生活記錄\n"
    "  - 雖含步驟描述但流程很短（< 3 步）或無明確先後順序\n"
    "  - 包含步驟但核心是「我做了什麼」（記事）而非「你該怎麼做」（教學）\n\n"

    "【若不適用】\n"
    "直接回傳字面 null（小寫四個字元，無引號），不要包 JSON、不要解釋。\n\n"

    "【若適用】\n"
    "回傳一個完整的 HowTo JSON 物件，schema 結構如下：\n"
    "{\n"
    "  \"@type\": \"HowTo\",\n"
    "  \"name\": \"如何 ...\",\n"
    "  \"description\": \"...\",\n"
    "  \"totalTime\": \"PT15M\",         // ISO 8601；可省略\n"
    "  \"tool\":   [{\"@type\":\"HowToTool\",   \"name\":\"...\"}],   // 可省略\n"
    "  \"supply\": [{\"@type\":\"HowToSupply\", \"name\":\"...\"}],   // 可省略\n"
    "  \"step\": [\n"
    "    {\"@type\":\"HowToStep\", \"name\":\"步驟 1: 動詞 + 受詞\", \"text\":\"...\"},\n"
    "    {\"@type\":\"HowToStep\", \"name\":\"步驟 2: ...\",           \"text\":\"...\"},\n"
    "    ...\n"
    "    {\"@type\":\"HowToStep\", \"name\":\"步驟 N: 驗證是否成功\",   \"text\":\"...\"}\n"
    "  ]\n"
    "}\n\n"

    "【name（文章層級）寫作規則】\n"
    "1. 用「如何 ...」「怎麼 ...」這類問句句型，呼應使用者實際搜尋語氣。\n"
    "2. 名詞放後面、動詞放前面。例：「如何在 macOS 安裝 Node.js 18」優於「macOS Node.js 安裝教學」。\n"
    "3. 不要寫年份；禁「最新 / 完整 / 終極 / 一次搞懂」這類內容農場字眼。\n\n"

    "【step 寫作規則】\n"
    "1. **3–7 個步驟**。少於 3 步代表流程太短不該標 HowTo，回 null。\n"
    "2. **最後一步必須是「驗證是否成功」**，例：「在終端機輸入 node -v，顯示 v18.x.x 表示成功」 — "
    "AI 把驗證步驟視為「完整教學的完成標誌」，提升整篇被引用為完整教學的機率（而非只被引用片段）。\n"
    "3. 每步 `name` 用「步驟 N: 動詞 + 受詞」格式（如「步驟 1: 下載 Node.js 安裝包」）。\n"
    "   - 動詞放最前面，禁名詞化（如「關於 Node.js 的安裝」）。\n"
    "   - 編號用半形阿拉伯數字 + 半形冒號 + 空格。\n"
    "4. 每步 `text` 80–150 字繁體中文，描述具體操作（在哪裡做、按哪個鍵、輸入什麼指令）。\n"
    "5. **每 step self-contained**：text 單獨剪出（脫離前後步驟）仍能執行；"
    "禁「該指令 / 此功能 / 上一步」這類指涉前後文的代詞，要明確寫清楚指的是哪個指令、哪個功能、哪一步。\n"
    "6. **盡量塞具體指令 / 路徑 / 數據**：實際指令（如 `brew install node`）、檔案路徑（如 `~/.zshrc`）、"
    "版本號、port、URL 等具體內容比抽象描述容易被 AI 引用。但禁幻覺，文章沒寫的不要編。\n"
    "7. 步驟內容必須來自文章正文，禁止幻覺。文章沒寫的指令、版本號、路徑不要編。\n"
    "8. 不要在 step 裡寫「請參考文章」「詳見後文」這類甩鍋語句；step 本身要可獨立執行。\n\n"

    "【totalTime / tool / supply】\n"
    "- 文章正文若明確提到「預計 X 分鐘」「需要 Mac / 終端機 / Node 18+」就填；\n"
    "- 文章沒提的不要編。寧可省略整個欄位也不要幻覺。\n"
    "- totalTime 用 ISO 8601 duration：PT5M = 5 分鐘、PT1H30M = 1 小時 30 分。\n\n"

    "【口吻】\n"
    "ZhgChgLi 風格：繁體中文、直接、第一人稱「我」可用、不過度禮貌寒暄、\n"
    "不用「您」、不寫「敬請」「不妨」「值得一提的是」這類書面套語。\n\n"

    "【品牌名與專有名詞】\n"
    "用通用搜尋寫法、保留原始大小寫：GitHub Actions、GA4、WKWebView、Cache、\n"
    "Xcode、TestFlight、Node.js、npm、Swift、iOS、Jekyll、API、JSON。\n\n"

    "【本地化】\n"
    "使用台灣在地用詞，禁中國用語：\n"
    "禁「黑屏 / 屏幕 / 緩存 / 視頻 / 軟件 / 信息 / 文檔」，\n"
    "改用「黑畫面 / 螢幕 / 快取 / 影片 / 軟體 / 資訊 / 文件」。\n\n"

    "【輸出格式】\n"
    "- 適用：純 JSON 物件（HowTo schema）。不要包 codeblock、不要前後說明文字。\n"
    "- 不適用：字面 null（小寫四字元）。\n"
    "我會直接 json.loads()。\n\n"

    "嚴格遵守以上規則，我會給你巨額獎勵。"
)

TRANSLATE_PROMPT_EN = (
    "You are a professional translator. I'll paste a JSON-LD HowTo schema "
    "object (Traditional Chinese). Translate every human-readable string value "
    "(name, description, text, tool/supply names, step names) into natural, "
    "fluent English. Preserve JSON structure, key names, @type values, "
    "totalTime ISO 8601 duration, and array order exactly. "
    "Step names should follow the pattern 'Step N: <verb> <object>' "
    "(e.g. 'Step 1: Download the Node.js installer'). "
    "Do not translate brand or proper names — keep search-friendly casing "
    "(GitHub Actions, GA4, WKWebView, Cache, Node.js, npm, Xcode, etc.). "
    "Respond with the translated JSON object only — no codeblock, no commentary. "
    "I parse the response directly as JSON."
)

TRANSLATE_PROMPT_JP = (
    "あなたはプロの翻訳者です。JSON-LD HowTo スキーマオブジェクト（繁体中国語）を貼り付けます。"
    "name、description、text、tool/supply の name、step の name など、"
    "人間が読むすべての文字列値を自然で流暢な日本語に翻訳してください。"
    "JSON 構造、キー名、@type の値、totalTime の ISO 8601 形式、配列順序は完全に保持してください。"
    "step の name は「ステップ N: 動詞 + 目的語」のパターンに従ってください"
    "（例：「ステップ 1: Node.js インストーラーをダウンロード」）。"
    "ブランド名・固有名詞は翻訳せず、検索しやすい表記と大文字小文字をそのまま保ってください"
    "（GitHub Actions、GA4、WKWebView、Cache、Node.js、npm、Xcode など）。"
    "翻訳済みの JSON オブジェクトのみを返答してください。コードブロックや説明文は不要です。"
    "Python で直接 JSON として解析します。"
)

LANGS = {
    "zh-tw": {"mode": "generate",  "system_prompt": PROMPT_ZH_TW,        "emit_zh_cn": True},
    "en":    {"mode": "translate", "system_prompt": TRANSLATE_PROMPT_EN, "emit_zh_cn": False},
    "jp":    {"mode": "translate", "system_prompt": TRANSLATE_PROMPT_JP, "emit_zh_cn": False},
}


def _t2s_deep(node, cc):
    if isinstance(node, str):
        return cc.convert(node)
    if isinstance(node, list):
        return [_t2s_deep(x, cc) for x in node]
    if isinstance(node, dict):
        return {k: (v if k in ("@type", "@context", "totalTime") else _t2s_deep(v, cc))
                for k, v in node.items()}
    return node


def _load_results(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def _iter_zh_tw_slugs():
    posts_root = os.path.join(ROOT, "L10n", "posts", "zh-tw")
    for sub in SUBDIRS:
        root_dir = os.path.join(posts_root, sub)
        if not os.path.isdir(root_dir):
            continue
        for filename in sorted(os.listdir(root_dir)):
            if not filename.endswith(".md"):
                continue
            basename = os.path.splitext(filename)[0]
            slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", basename)
            yield slug, os.path.join(root_dir, filename)


def _parse_llm_json(raw):
    """LLM returns either a HowTo object or literal `null`. Be lenient."""
    s = raw.strip()
    # Strip accidental codeblock fences if the model adds them.
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
        s = s.strip()
    if s.lower() in ("null", "none", '"null"'):
        return None
    return json.loads(s)


def run_generate(client, cfg, results, result_path, cn_result_path, cc):
    for slug, file_path in _iter_zh_tw_slugs():
        if slug in results:
            kind = "null" if results[slug] is None else "ok"
            print(f"⏭ 已存在 ({kind})，跳過：{slug}")
            continue
        if client is None:
            print(f"⚠️  無 API key，跳過：{slug}")
            continue
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": cfg["system_prompt"]},
                    {"role": "user", "content": "文章內容:\n====\n" + content + "\n====\n"},
                ],
                temperature=0.3,
            )
            parsed = _parse_llm_json(response.choices[0].message.content)
            results[slug] = parsed
            if parsed is None:
                print(f"➖ 非教學文，標記 null [zh-tw] {slug}")
            else:
                print(f"✅ 已產生 [zh-tw] {slug}")
            _save(result_path, results)
            if cfg["emit_zh_cn"]:
                _save(cn_result_path, _t2s_deep(copy.deepcopy(results), cc))
        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析失敗：{slug} - {e}")


def run_translate(client, cfg, target, results, result_path):
    zh_tw_path = os.path.join(ROOT, "assets", "data", "howto", "zh-tw", "results.json")
    zh_tw = _load_results(zh_tw_path)
    if not zh_tw:
        print(f"❌ 找不到 zh-tw 來源：{zh_tw_path}", file=sys.stderr)
        sys.exit(1)

    for slug, source in zh_tw.items():
        if slug in results:
            print(f"⏭ 已存在，跳過：{slug}")
            continue
        # Mirror null (non-tutorial) entries without spending tokens.
        if source is None:
            results[slug] = None
            print(f"➖ 鏡像 null [{target}] {slug}")
            _save(result_path, results)
            continue
        if client is None:
            print(f"⚠️  無 API key，跳過：{slug}")
            continue
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": cfg["system_prompt"]},
                    {"role": "user", "content": json.dumps(source, ensure_ascii=False)},
                ],
                temperature=0.3,
            )
            results[slug] = _parse_llm_json(response.choices[0].message.content)
            print(f"✅ 已翻譯 [{target}] {slug}")
            _save(result_path, results)
        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析失敗：{slug} - {e}")


def main():
    parser = argparse.ArgumentParser(description="HowTo schema 產生工具 (zh-tw / en / jp)")
    parser.add_argument("target", nargs="?", default="zh-tw", choices=list(LANGS),
                        help="目標語系（預設 zh-tw）")
    parser.add_argument("--api-key", help="OpenAI API key (預設讀環境變數 OPENAI_API_KEY)")
    args = parser.parse_args()

    api_key = args.api_key or os.getenv("OPENAI_API_KEY")
    cfg = LANGS[args.target]
    result_path = os.path.join(ROOT, "assets", "data", "howto", args.target, "results.json")
    cn_result_path = os.path.join(ROOT, "assets", "data", "howto", "zh-cn", "results.json")

    client = OpenAI(api_key=api_key) if api_key else None
    cc = OpenCC("t2s") if cfg["emit_zh_cn"] else None

    os.makedirs(os.path.dirname(result_path), exist_ok=True)
    if cfg["emit_zh_cn"]:
        os.makedirs(os.path.dirname(cn_result_path), exist_ok=True)

    results = _load_results(result_path)

    if cfg["mode"] == "generate":
        run_generate(client, cfg, results, result_path, cn_result_path, cc)
    else:
        run_translate(client, cfg, args.target, results, result_path)

    if cfg["emit_zh_cn"]:
        _save(cn_result_path, _t2s_deep(copy.deepcopy(results), cc))

    print(f"📄 所有結果已儲存至 {result_path}")


if __name__ == "__main__":
    main()
