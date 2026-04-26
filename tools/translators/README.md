# Translators

Localizes posts in `L10n/posts/zh-tw/` into other languages. **Only writes a
target file when one doesn't already exist** — re-runs are safe and free
(skipped files cost zero API calls).

| Script | Target | Mechanism | Cost |
|---|---|---|---|
| `translator.py en` | `L10n/posts/en/` | OpenAI GPT-4.1-mini | API tokens |
| `translator.py jp` | `L10n/posts/jp/` | OpenAI GPT-4.1-mini | API tokens |
| `translator_jp.py` | (alias) | Calls `translator.py jp` | — |
| `translator_cn.py` | `L10n/posts/zh-cn/` | OpenCC (Traditional → Simplified) | Free, deterministic |

## Setup

```bash
python -m venv tools/translators/.venv
source tools/translators/.venv/bin/activate
pip install -r tools/translators/requirements.txt
```

## Run

```bash
# Only translates posts that don't yet have a target file.
OPENAI_API_KEY=sk-... python tools/translators/translator.py en
OPENAI_API_KEY=sk-... python tools/translators/translator.py jp
python tools/translators/translator_cn.py
```

## Re-translate a single post

Delete the corresponding target file and re-run:

```bash
rm L10n/posts/en/zmediumtomarkdown/2024-02-19-2724f02f6e7.md
python tools/translators/translator.py en
```
