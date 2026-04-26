# Clean up boilerplate that the Medium → Markdown export adds to every post,
# and rewrite legacy donation links to point at our current PayPal page.
#
# Runs once per post in :pre_render, before kramdown converts the markdown.

module ZhgChgLi
  module PostContentFilters
    PAYPAL_URL = 'https://paypal.me/zhgchgli'.freeze
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

      # 6) Collapse trailing whitespace (from the removals above).
      content = content.sub(/\s+\z/, "\n")

      post.content = content
    end
  end

  Jekyll::Hooks.register :posts, :pre_render do |post|
    PostContentFilters.apply(post)
  end
end
