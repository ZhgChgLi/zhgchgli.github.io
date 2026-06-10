"""Tiny .env loader for local runs of the translator/maker scripts.

Reads a KEY=value file at the repo root and injects any keys that aren't
already set into os.environ — so locally you can keep OPENAI_API_KEY (etc.)
in a gitignored .env instead of exporting it every time.

Deliberately minimal (no python-dotenv dependency):
  * No-op when the file is missing (CI has no .env — it uses real secrets).
  * Never overrides an existing env var, so an explicit shell export or a
    CI secret always wins over the file.
  * Tolerates blank lines, `# comments`, surrounding quotes, and an optional
    leading `export `.

Usage (top of a script, before reading os.getenv):
    from _env import load_dotenv
    load_dotenv()
"""
import os

_DEFAULT_ENV = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", ".env")
)


def load_dotenv(path=_DEFAULT_ENV):
    if not os.path.isfile(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            if key.startswith("export "):
                key = key[len("export "):].strip()
            val = val.strip()
            if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
                val = val[1:-1]
            if key and key not in os.environ:
                os.environ[key] = val
