#!/bin/bash

GITHUB_TOKEN=$1

# GITHUB_TOKEN is required
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GitHub token is required."
    exit 1
fi

# get current uncommitted changes
changes=$(git status --porcelain)

# filter out untracked files in /_post/ and end with .md
changes=$(echo "$changes" | awk '/_posts\/zh\-tw\/.*\.md$/ {print $2}')

# copy changed files to /_posts/en/, overrite existing files
for file in $changes; do
    API_URL="https://api.github.com/repos/ZhgChgLi/zhgchgli.github.io/issues/53/comments"
    ENGLISH_FILE=$(echo "$file" | sed 's#_posts/zh-tw/#_posts/en/#')
    COMMENT="/gpt-translate $file $ENGLISH_FILE English"

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
done


# # if $apiKey is not empty then execute
# if [ -n "$apiKey" ]; then
#     # make sure has npm env and install chatgpt-md-translator, if not then install
#     if ! command -v chatgpt-md-translator &> /dev/null; then
#     npm install -g chatgpt-md-translator
#     fi

#     mkdir -p $HOME/.config/

#     # Create a config file in $CWD/.chatgpt-md-translator
#     cat > $HOME/.config/.chatgpt-md-translator <<EOF
#     # Copy this to one of these locations based on your usage:
#     #
#     # $CWD/.chatgpt-md-translator
#     # $CWD/.env
#     # $HOME/.config/chatgpt-md-translator/config
#     # $HOME/.chatgpt-md-translator

#     # OpenAI's API Key. You will be charged for the usage of this key.
#     OPENAI_API_KEY="$apiKey"


#     # =====================================
#     # The remaining variables are optional.
#     # =====================================

#     # Base directory of the translated content.
#     # BASE_DIR="/path/to/my/docs-project/content"

#     # HTTPS Proxy (e.g, "https://proxy.example.com:8080")
#     # We also read HTTPS_PROXY from regular environment variables.
#     # HTTPS_PROXY=""

#     # Default language model.
#     MODEL_NAME="$apiModel"

#     # Soft limit of the token size, used to split the file into fragments.
#     # FRAGMENT_TOKEN_SIZE=2048

#     # Sampling temperature, i.e., randomness of the generated text.
#     # TEMPERATURE=0.1

#     # If you hit the API rate limit, you can set this to a positive number.
#     # API is not called more frequently than the given interval (in seconds).
#     # API_CALL_INTERVAL=0

#     # The maximum number of lines for code blocks
#     # sent to the API as-is for context.
#     # CODE_BLOCK_PRESERVATION_LINES=5

#     # Transforms the input path to the output file path.
#     # OUTPUT_FILE_PATTERN=""

#     # What to do when the output file already exists. One of "overwrite", "skip" and "abort".
#     # OVERWRITE_POLICY="overwrite"

#     # Custom API address, to integrate with a third-party API service provider.
#     # API_ENDPOINT="https://api.openai.com/v1/chat/completions"
# EOF
#     cat > $HOME/.config/.chatgpt-md-translator-prompt.md <<EOF
#     You are a professional translation engine specialized in precise and structured translations. Your task is to translate text while **strictly preserving** the original Markdown format.

#     ## General Guidelines:
#     - **Language Direction:** Translate Traditional Chinese content into **natural, fluent, and professional English.** If the content is already in English, do not translate it.
#     - **Colloquial & Professional Tone:** Ensure the translation is **elegant, natural, and free of machine-translation artifacts.**
#     - **No Interpretation:** You must **only** translate the text content and **never** interpret or modify its meaning.

#     ## Markdown Structure Rules (Must be followed strictly):
#     1. **Do not alter the Markdown structure.**
#     - Never modify headers, lists, tables, links, emphasis, or formatting symbols.
#     - Do **not** add or remove Markdown elements, including `#`, `-`, `*`, `_`, or `[]()`.
#     - Keep all URLs **unchanged**.
    
#     2. **Code Blocks (` ``` `) Handling:**
#     - **Only translate comments** within code blocks.
#     - Do **not** touch the actual code syntax.
#     - Maintain indentation and formatting.

#     3. **Inline Placeholders (`[to_be_replace[x]]`):**
#     - Do **not** translate, modify, or remove `[to_be_replace[x]]` placeholders.
#     - Keep them **exactly** as they appear.

#     4. **Whitespace & Formatting:**
#     - **Preserve all line breaks, spaces, and blank lines** exactly as in the original.
#     - Do **not** insert or remove extra spaces, blank lines, or formatting elements.

#     ## Absolute Prohibitions:
#     - ❌ **Never** add or remove any Markdown elements.
#     - ❌ **Never** change URLs or link structures.
#     - ❌ **Never** translate or alter `[to_be_replace[x]]`.
#     - ❌ **Never** interpret the content; **only translate**.
#     - ❌ **Never** produce output containing Traditional Chinese.

#     You will now receive Markdown content to translate. **Follow these rules strictly.**
# EOF
# fi

# # get current uncommitted changes
# changes=$(git status --porcelain)

# # filter out untracked files in /_post/ and end with .md
# changes=$(echo "$changes" | awk '/_posts\/en\/.*\.md$/ {print $2}')

# # copy changed files to /_posts/en/, overrite existing files
# for file in $changes; do
#     chatgpt-md-translator $file

#     # get the last string after date, e.g. 2025-01-17-medium-to-jekyll.md -> medium-to-jekyll
#     # fileName=$(echo $file | awk -F'/' '{print $NF}')

#     # message="
#     #     \n\n
#     #     ---\n
#     #     **This article was automatically translated by OpenAI**, view the original [Chinese version 中文版](../).
#     #     \n\n
#     #     ---\n
#     # "
#     # echo $message >> $file
# done

# echo "Translation completed successfully."

# // ruby

# require "kramdown"
# require "openai"
# require 'yaml'
# require 'psych'
# require 'concurrent-ruby'

# inputFile = ARGV[0]
# apiKey = ARGV[1]
# $apiModel = ARGV[2]

# if inputFile.nil? || apiKey.nil? || $apiModel.nil?
#     puts "Usage: ruby translator.rb <inputFile> <apiKey> <apiModel>"
#     exit
# end

# $client = OpenAI::Client.new(
#   access_token: apiKey,
#   log_errors: false
# )

# content = File.read(inputFile)
# $tasks = []

# $global_messages = [
#     {"role": "system", "content": "You are a professional translator specializing in the tech industry."},
#     {"role": "system", "content": "Here are some additional guidelines to follow:"},
#     {"role": "system", "content": "- Must translate all Chinese content into natural, fluent, and professional English. If all the content is already in English, do not translate it."},
#     {"role": "system", "content": "- Ensure that technical terms are translated accurately."},
#     {"role": "system", "content": "- DO NOT SHOW Any fucking Chinese to me."},
#     {"role": "system", "content": "- Never translate url string."},
#     {"role": "system", "content": "- If there is nothing to translate, please return what I gave to you, dont say anything."},
#     {"role": "system", "content": "- Ensure the translation is elegant, natural, and free of machine-translation artifacts."},
#     {"role": "system", "content": "- You must only translate the text content and never interpret or modify its meaning."},
# ]

# def parse_yaml(text)
#     if text.match(/\A---\s*\n.*?\n---\s*\n/m)
#       yaml_part = text.match(/\A---\s*\n(.*?)\n---\s*\n/m)[1]
#       YAML.safe_load(yaml_part, permitted_classes: [Time])
#     else
#       {}
#     end
# end
# yaml_data = parse_yaml(content)

# if yaml_data["hidden"]
#     hidden = "\nhidden: #{yaml_data["hidden"]}"
# else
#     hidden = ""
# end

# if yaml_data["pin"]
#     pin = "\npin: #{yaml_data["pin"]}"
# else
#     pin = ""
# end

# response = $client.chat(
#     parameters: {
#         model: $apiModel,
#         messages: $global_messages + [
#             {"role": "user", "content": "Please translate the following text:\n#{yaml_data["title"]}"}
#         ],
#         temperature: 0.7,
#     }
# )

# title = response.dig("choices", 0, "message", "content").to_s.gsub(/\s+/, ' ')

# response = $client.chat(
#     parameters: {
#         model: $apiModel,
#         messages: $global_messages + [
#             {"role": "user", "content": "Please translate the following text:\n#{yaml_data["description"]}"}
#         ],
#         temperature: 0.7,
#     }
# )

# description = response.dig("choices", 0, "message", "content").to_s.gsub(/\s+/, ' ')

# header = <<-HEADER
# ---
# title: "#{title}"
# author: "#{yaml_data["author"]}"
# date: #{yaml_data["date"].strftime("%Y-%m-%dT%H:%M:%S.%L%z")}
# last_modified_at: #{yaml_data["last_modified_at"].strftime("%Y-%m-%dT%H:%M:%S.%L%z")}
# categories: [#{"\"" + yaml_data["categories"].join("\", \"") + "\""}]
# tags: [#{"\"" + yaml_data["tags"].join("\", \"") + "\""}]
# description: "#{description}"#{hidden}#{pin}
# image:
#   path: "#{yaml_data["image"]["path"]}"
# render_with_liquid: #{yaml_data["render_with_liquid"]}
# ---
# HEADER


# content = content.gsub(/---\s*\n.*?\n---\s*\n/m, "")
# content = content.gsub(/(```)/m, "~~~")
# markdown = Kramdown::Document.new(content)


# def enumerate_children(children)
#     if !children.children.empty?
#         children.children.each do |child|
#             $tasks << Concurrent::Promise.execute { enumerate_children(child) }
#         end
#     else
#         puts "Translating text: #{children.inspect} - #{children.value}"
#         if !children.value.nil? && children.value.strip != ""
#             if children.type == :text || children.type == :heading
#                 puts "Translating text: #{children.value}"
#                 # $tasks << Concurrent::Promise.execute do
#                 #     response = $client.chat(
#                 #         parameters: {
#                 #             model: $apiModel,
#                 #             messages: $global_messages + [
#                 #                 {"role": "user", "content": "Please translate the following text:\n#{children.value}"}
#                 #             ],
#                 #             temperature: 0.7,
#                 #         }
#                 #     )
#                 #     children.value = response.dig("choices", 0, "message", "content")
#                 # end
#             end
#         end
#     end
# end

# enumerate_children(markdown.root)

# $tasks.each(&:wait)

# result = header + markdown.to_kramdown

# puts markdown.to_kramdown
# #File.open(inputFile, "w") { |file| file.puts result }

# puts "Translation complete!"