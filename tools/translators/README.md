# Translators

Localizes posts in `L10n/posts/zh-tw/` into other languages. en/jp use a
**per-post cache** at `tools/translators/cache/{target}/{sub}/{filename}.json`
with shape `{"source_hash": "...", "translations": {<original block>: <translated>}}`.

- `source_hash` covers `post.content + title + description + sorted(tags) +
  sorted(categories)` — fields that actually affect translation. Cover image
  / author / date / `last_modified_at` are excluded; swapping them does not
  retrigger translation.
- If the source hash matches and the target `.md` exists → skipped (zero API).
- If anything changed, summary / SEO / taxonomy regenerate, but each Markdown
  block is looked up in `translations` first and only re-translated when its
  original text is new or changed.

The cache is committed to git so re-runs across machines reuse translations.

| Script | Target | Mechanism | Cost |
|---|---|---|---|
| `translator.py en` | `L10n/posts/en/` | OpenAI GPT-4.1-mini | API tokens |
| `translator.py jp` | `L10n/posts/jp/` | OpenAI GPT-4.1-mini | API tokens |
| `translator_jp.py` | (alias) | Calls `translator.py jp` | — |
| `translator_cn.py` | `L10n/posts/zh-cn/` | OpenCC (Traditional → Simplified) | Free, deterministic |
| `typo_checker.py` | `L10n/posts/zh-tw/` (read-only) | OpenAI GPT-4.1-mini | API tokens |

`typo_checker.py` runs **after fetch, before translation** in
`.github/workflows/ZMediumToMarkdown.yml`. It sends each post's full body
to the model and asks it to flag obvious typos, duplicate characters /
phrases, and serious sentence problems (broken grammar, missing
subject/object, unintelligible sentences). The script **never modifies the
source files** — it emits `.typo-report.json` at repo root and the
workflow's final step opens a GitHub issue listing every finding for
manual review. The CI step also restricts itself to posts with a working-tree
diff via `--files`, so unchanged articles aren't re-reviewed.

Per-post cache lives at `tools/translators/cache/typo_check/{sub}/{filename}.json`
with shape `{"source_hash": "..."}`. A matching `source_hash` skips the
file entirely (zero API calls); editing the file invalidates the cache and
triggers a fresh review on the next run.

The repo ships with the cache **pre-seeded** for every existing zh-tw post
(via `python typo_checker.py --seed`), so on the first workflow run all
existing articles are skipped and only newly-fetched or content-updated
articles trigger OpenAI calls. To force a re-check of a single post, delete
its cache JSON and re-run.

## Setup

```bash
python3 -m venv tools/translators/.venv
source tools/translators/.venv/bin/activate
pip install -r tools/translators/requirements.txt
```

## Run

```bash
OPENAI_API_KEY=sk-... python3 tools/translators/translator.py en
OPENAI_API_KEY=sk-... python3 tools/translators/translator.py jp
python3 tools/translators/translator_cn.py
```

## Re-translate a single post

Delete the cache JSON (and optionally the target `.md`) and re-run:

```bash
rm tools/translators/cache/en/zmediumtomarkdown/2024-02-19-2724f02f6e7.md.json
rm L10n/posts/en/zmediumtomarkdown/2024-02-19-2724f02f6e7.md
python3 tools/translators/translator.py en
```

## Product ads (`ad_maker.py`)

Builds the in-article affiliate-product ad pool **for the zh-tw site only**.
Pure scraping — **no OpenAI / API key needed** (only `pillow`).

- **Source**: a published Google Sheet CSV (`AD_CSV_URL`, falls back to the
  hard-coded `DEFAULT_CSV_URL`) with columns
  `商品名稱 / 商品連結 / 推廣連結 / 期限`.
  - **商品連結** (the real momo product page) is scraped for the **main image**
    (first `#GoodsDetailPic_S` frame `_R.webp` on a classic `GoodsDetail.jsp`
    page, or `og:image` on a `TP` 賣場 page — saved as `assets/ads/<id>.webp`,
    `id = sha1(推廣連結)[:12]`), the **price** (`市售價` / TP `.primary-price-value`
    → `NT$` no decimals), and the **description** (`og:description`, shown
    verbatim, trimmed to `DESC_MAXLEN`). A short link is auto-resolved to the
    desktop page; momo's image-CDN cert quirk is handled with a relaxed TLS
    context for image downloads only.
  - **推廣連結** (affiliate link) is used only as the card's click-through CTA.
- **Output**: `_data/ad_products.json` (keyed by `id`), consumed at build time
  by `_layouts/post.html` + `assets/js/ad-rotator.js`, which picks one
  in-deadline product at random per page view and replaces the AdSense slot.
  Priority is **sponsor (`_data/active_ad.yml`) > product > AdSense/house**.
- **Dropped**: a product missing name / main image / description is skipped, as
  is a **delisted / nonexistent** product (its page bounces to `Notice.jsp`).
- **Caching**: a product already carrying an image + description is skipped on
  re-run (only its name/deadline are refreshed from the latest CSV). Products
  dropped from the CSV are removed and their image deleted. Per-product failures
  are isolated and never abort the batch.

Runs on every `pages.yml` deploy (zh-tw job only); incremental skip avoids
re-scraping unchanged products.

```bash
AD_CSV_URL='https://docs.google.com/.../pub?...&output=csv' \
  python3 tools/translators/ad_maker.py
```

To re-scrape one product, delete it from `_data/ad_products.json` (and its
`assets/ads/<id>.webp`) and re-run.
