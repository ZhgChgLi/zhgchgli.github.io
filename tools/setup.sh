#!/usr/bin/env bash
#
# Build, test and then deploy the site content to 'origin/<pages_branch>'
#
# Requirement: html-proofer, jekyll
#
# Usage: See help information

set -eu

L10N="${L10N:-}"

echo "L10N: ${L10N}"
if [[ -d "./_posts" ]]; then
    rm -rf ./_posts
fi

if [[ -z "$L10N" ]]; then
    mkdir -p ./_posts/
    cp -R ./L10n/config/zh-tw/. ./
    cp -R ./L10n/posts/. ./_posts/
else
    mkdir -p ./_posts/${L10N}/
    cp -R ./L10n/config/${L10N}/. ./
    cp -R ./L10n/posts/${L10N}/. ./_posts/${L10N}/
fi