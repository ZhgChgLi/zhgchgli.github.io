#!/bin/bash

GITHUB_TOKEN=$1
TARGET_PR_NUMBER=$2
TARGET_BRANCH=$3
API_URL="https://api.github.com/repos/ZhgChgLi/zhgchgli.github.io/pulls"
# API_URL

# GITHUB_TOKEN is required
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GitHub token is required."
    exit 1
fi

PR_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "$API_URL?state=open&per_page=100")

# Extract PR numbers and base branches
PR_NUMBERS=($(echo "$PR_RESPONSE" | grep -o '"number": [0-9]\+' | awk '{print $2}'))
BASE_REFS=($(echo "$PR_RESPONSE" | sed -n 's/.*"base": {[^}]*"ref": "\([^"]*\)".*/\1/p'))

for i in "${!PR_NUMBERS[@]}"; do
    PR_NUMBER="${PR_NUMBERS[$i]}"
    if [ "$PR_NUMBER" != "$TARGET_PR_NUMBER" ]; then
        echo "Updating PR #$PR_NUMBER (to '$TARGET_BRANCH')..."
        curl -s -X PATCH -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            -d "{\"base\":\"$TARGET_BRANCH\"}" \
            "$API_URL/$PR_NUMBER"
        curl -s -X PUT -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -d '{"merge_method":"squash"}' \
        "$API_URL/$PR_NUMBER/merge"
    else
        echo "Skipping PR #$PR_NUMBER."
    fi
done

# sh ./MergeAllTo.sh xx 99 gt-25504729-98af-424a-8492-3ab2ab8b46f0