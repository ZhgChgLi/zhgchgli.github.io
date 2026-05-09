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
| `typo_checker.py` | `L10n/posts/zh-tw/` (in-place) | OpenAI GPT-4.1-mini | API tokens |

`typo_checker.py` runs **after fetch, before translation** in
`.github/workflows/ZMediumToMarkdown.yml`. It walks each Markdown block via
mistune, asks the model to flag only obvious typos and duplicate
characters / phrases (intentional reduplication and ambiguous variants are
skipped by the prompt), rewrites the file in place when fixes apply, and
emits `.typo-fixes.json` at repo root. The workflow's final step opens a
GitHub issue listing every change so changes can be reviewed.

Per-post cache lives at `tools/translators/cache/typo_check/{sub}/{filename}.json`
with shape `{"source_hash": "...", "blocks": {<original block>: <fixed or same>}}`.
A matching `source_hash` skips the file entirely (zero API calls).

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
