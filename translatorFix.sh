#!/bin/bash

# Enable recursive globbing (**)
shopt -s globstar

# Loop through all Markdown files in _posts/en/ recursively
for FILE in ./_posts/en/**/*.md; do
    # Skip if not a regular file
    [[ -f "$FILE" ]] || continue

    # Read the first line
    FIRST_LINE=$(head -n 1 "$FILE")

    # Check for exact match
    if [[ "$FIRST_LINE" == '```markdown' ]]; then
        tail -n +2 "$FILE" > "$FILE.tmp"   # Everything except the first line
        echo '---' > "$FILE"               # Overwrite with new first line
        cat "$FILE.tmp" >> "$FILE"         # Append rest of file
        rm "$FILE.tmp"                     # Cleanup
        echo "✅ $FILE starts with \`\`\`markdown"
    else
        echo "❌ $FILE does NOT start with \`\`\`markdown"
    fi
done