# Clean up boilerplate that the Medium → Markdown export adds to every post,
# and rewrite legacy donation links to point at our current PayPal page.
#
# Runs once per post in :pre_render, before kramdown converts the markdown.

module ZhgChgLi
  module PostContentFilters
    PAYPAL_URL = 'https://www.paypal.com/ncp/payment/CMALMPT8UUTY2'.freeze
    BMAC_URL_RE = %r{https?://(?:www\.)?buymeacoffee\.com/zhgchgli}i

    # Author-supplied "any questions, contact me" sentence at the bottom of
    # almost every Medium-imported post. Several minor variants exist per
    # language. Each pattern strips the entire sentence (incl. surrounding
    # punctuation/blank lines).
    CONTACT_TAIL_PATTERNS = [
      # Traditional Chinese
      %r{^[ \t]*[*_]*有任何問題[^\n]*?(?:聯絡|連絡)[^\n]*\n?}u,
      %r{^[ \t]*[*_]*有任何問題[^\n]*?\.\n?}u,
      # Simplified Chinese
      %r{^[ \t]*[*_]*有任何问题[^\n]*?(?:联络|联系)[^\n]*\n?}u,
      # English
      %r{^[ \t]*[*_]*Feel free to[^\n]*?(?:contact|reach)[^\n]*\n?}i,
      %r{^[ \t]*[*_]*If you have any questions?[^\n]*?(?:contact|reach)[^\n]*\n?}i,
      # Japanese
      %r{^[ \t]*[*_]*ご質問[^\n]*?(?:連絡|お問い合わせ)[^\n]*\n?}u,
      %r{^[ \t]*[*_]*お気軽に[^\n]*?(?:連絡|お問い合わせ)[^\n]*\n?}u,
    ].freeze

    # ZMediumToMarkdown adds a footer credit on every imported post.
    ZMEDIUM_FOOTER_RE = %r{^.*converted from Medium by \[?ZMediumToMarkdown\]?[^\n]*\n?}i

    # Image embedding the BMaC button: ![[Buy me a coffee](https://...)](image-url)
    BMAC_IMAGE_RE = Regexp.new(
      '!\\[\\[Buy me a coffee\\]\\(https?://(?:www\\.)?buymeacoffee\\.com/zhgchgli\\)[^\\]]*\\]\\([^)]*\\)\\s*\\n?',
      Regexp::IGNORECASE
    )

    # Plain "[Buy me a coffee](BMAC URL)" markdown link, possibly followed by
    # a kramdown IAL like {:target="_blank"}.
    BMAC_LINK_RE = Regexp.new(
      '\\[Buy me a coffee\\]\\(https?://(?:www\\.)?buymeacoffee\\.com/zhgchgli\\)(\\{:[^}]*\\})?',
      Regexp::IGNORECASE
    )

    # ATX heading that directly follows a blockquote line with no blank line
    # in between. Medium-imported posts often look like:
    #   > https://github.com/.../foo.yml
    #   ## 2. 點擊右方編輯按鈕
    # kramdown treats the heading as a lazy continuation of the blockquote,
    # so the heading is swallowed. Insert a blank line so the heading breaks
    # out of the quote and renders as a real heading.
    HEADING_AFTER_QUOTE_RE = Regexp.new('^(>[^\n]*)\n(\#{1,6}[ \t])').freeze

    # Two adjacent markdown links pointing at the same URL — happens when an
    # exporter splits a single title at `【` `】` `[` `]`, e.g.:
    #   [KKday — 【](URL){:target="_blank"} [官方銷售】...](URL){:target="_blank"}
    # Captures: 1=text1, 2=url, 3=ial1, 4=gap, 5=text2, 6=ial2
    ADJACENT_SAME_URL_LINK_RE = /
      \[ ((?:\\.|[^\[\]\\])*) \]
      \( ([^)\s]+) \)
      (\{:[^}]*\})?
      (\s+)
      \[ ((?:\\.|[^\[\]\\])*) \]
      \( \2 \)
      (\{:[^}]*\})?
    /x.freeze

    # Any markdown link — used to escape stray markdown specials in the text
    # portion. Captures: 1=text, 2=url, 3=ial.
    MARKDOWN_LINK_RE = /\[((?:\\.|[^\[\]\\])*)\]\(([^)\s]+)\)(\{:[^}]*\})?/.freeze

    # Markdown specials that break link text if left unescaped. `[` and `]` are
    # already excluded by MARKDOWN_LINK_RE; `|` confuses GFM table parsing.
    UNESCAPED_PIPE_IN_LINK_RE = /(?<!\\)\|/.freeze

    def self.apply(post)
      content = post.content

      # 1) Strip the BMaC button image entirely.
      content = content.gsub(BMAC_IMAGE_RE, '')

      # 2) Rewrite BMaC markdown link → PayPal link (preserves any IAL).
      content = content.gsub(BMAC_LINK_RE) do
        ial = Regexp.last_match(1) || ''
        "[🍺 Buy me a beer on PayPal](#{PAYPAL_URL})#{ial}"
      end

      # 3) Catch-all for any remaining BMaC URL anywhere in the body.
      content = content.gsub(BMAC_URL_RE, PAYPAL_URL)

      # 4) Strip "...converted from Medium by ZMediumToMarkdown..." footer.
      content = content.gsub(ZMEDIUM_FOOTER_RE, '')

      # 5) Strip the "any questions, contact me" tail in every supported language.
      CONTACT_TAIL_PATTERNS.each { |re| content = content.gsub(re, '') }

      # 5b) Merge consecutive markdown links that point at the same URL.
      # Loop until stable so 3+ split fragments collapse fully.
      loop do
        new_content = content.gsub(ADJACENT_SAME_URL_LINK_RE) do
          t1, url, ial1, gap, t2, ial2 = Regexp.last_match.captures
          ial = ial2 || ial1 || ''
          "[#{t1}#{gap}#{t2}](#{url})#{ial}"
        end
        break if new_content == content
        content = new_content
      end

      # 5c) Escape unescaped `|` inside markdown link text — otherwise GFM
      # treats it as a table cell separator and the link breaks.
      content = content.gsub(MARKDOWN_LINK_RE) do
        text, url, ial = Regexp.last_match.captures
        text = text.gsub(UNESCAPED_PIPE_IN_LINK_RE, '\\|')
        "[#{text}](#{url})#{ial}"
      end

      # 5a) Force a blank line between a blockquote and an immediately following
      # ATX heading so kramdown doesn't swallow the heading into the quote.
      # Loop until stable in case of consecutive matches.
      loop do
        new_content = content.gsub(HEADING_AFTER_QUOTE_RE, "\\1\n\n\\2")
        break if new_content == content
        content = new_content
      end

      # 6) Collapse trailing whitespace (from the removals above).
      content = content.sub(/\s+\z/, "\n")

      post.content = content
    end
  end

  Jekyll::Hooks.register :posts, :pre_render do |post|
    PostContentFilters.apply(post)
  end
end
