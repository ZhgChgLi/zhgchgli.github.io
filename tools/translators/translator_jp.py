#!/usr/bin/env python3
"""Thin wrapper that delegates to translator.py with target=jp.

translator.py covers both en and jp because the only differences are prompts
and a few category/tag mappings — kept as a profile dict in PROFILES.
"""
import sys
from translator import main as translator_main

if __name__ == "__main__":
    # Inject "jp" as the positional target argument and forward the rest.
    sys.argv = [sys.argv[0], "jp", *sys.argv[1:]]
    translator_main()
