#!/usr/bin/env bash
#
# Build, test and then deploy the site content to 'origin/<pages_branch>'
#
# Requirement: html-proofer, jekyll
#
# Usage: See help information

set -eu

L10n="${L10n:-}"

echo "L10n: ${L10n}"
if [[ -d "./_posts" ]]; then
    rm -rf ./_posts
fi

if [[ -z "$L10n" ]]; then
    mkdir -p ./_posts/
    cp -R ./L10n/config/zh-tw/. ./
    cp -R ./L10n/posts/. ./_posts/
else
    mkdir -p ./_posts/${L10n}/
    cp -R ./L10n/config/${L10n}/. ./
    cp -R ./L10n/posts/${L10n}/. ./_posts/${L10n}/
fi