
LOG_DATA='
* At _site/posts/en/71400d408dc8/index.html:1:

  internally linking to ../f6713ba3fee3/, which does not exist

* At _site/posts/en/71400d408dc8/index.html:1:

  internally linking to ../1e85b8df2348/, which does not exist

* At _site/posts/en/71400d408dc8/index.html:1:

  internally linking to ../4cb4437818f2/, which does not exist

* At _site/posts/en/71400d408dc8/index.html:121:

  internally linking to ../4cb4437818f2/, which does not exist
'
GITHUB_TOKEN=$1

# GITHUB_TOKEN is required
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GitHub token is required."
    exit 1
fi

SEARCH_DIR="./_posts/zh-tw/zmediumtomarkdown"
commands=()
while IFS= read -r line; do
    # Extract the missing internal link hash
    if [[ "$line" =~ internally\ linking\ to\ \.\./([a-f0-9]+)/, ]]; then
        HASH="${BASH_REMATCH[1]}"
        FOUND_FILES=$(find "$SEARCH_DIR" -type f -name "*$HASH*" 2>/dev/null)

        # Check if any file is found
        if [ -n "$FOUND_FILES" ]; then
            NEW_PATHS=$(echo "$FOUND_FILES" | sed 's|/zh-tw/|/en/|g')

            API_URL="https://api.github.com/repos/ZhgChgLi/zhgchgli.github.io/issues/53/comments"
            COMMENT="/gpt-translate $FOUND_FILES $NEW_PATHS English"

            FOUND=false
            for ITEM in "${commands[@]}"; do
                if [[ "$ITEM" == "$COMMENT" ]]; then
                    FOUND=true
                    break
                fi
            done
            if $FOUND; then
                continue
            fi
            commands+=("$COMMENT")


            RESPONSE=$(curl -s -X POST "$API_URL" \
                -H "Authorization: token $GITHUB_TOKEN" \
                -H "Accept: application/vnd.github.v3+json" \
                -d "{\"body\": \"$COMMENT\"}")
            # Check if the request was successful
            if echo "$RESPONSE" | grep -q '"id":'; then
                echo "Comment Translator for $file successfully added!"
            else
                echo "Failed to add comment. Response from GitHub:"
                echo "$RESPONSE"
            fi

        else
            echo "No files found containing hash '$HASH' in directory '$SEARCH_DIR'."
        fi
    fi
done <<< "$LOG_DATA"