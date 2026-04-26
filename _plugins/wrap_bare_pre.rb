# Wrap bare <pre>...</pre> blocks in a Rouge-style plaintext wrapper so the
# post-page JS (line numbers + copy toolbar) treats them uniformly.
#
# kramdown emits bare <pre><code class="language-XXX"> when XXX is not a known
# Rouge lexer (e.g. `vbnet`). It also emits bare <pre> for any raw HTML the
# author wrote directly. In both cases we wrap the <pre> in:
#
#   <div class="language-plaintext highlighter-rouge"> ... </div>
#
# which lets the existing client-side decorator pick the block up.
#
# Detection: any <pre> tag that is NOT <pre class="highlight">. Rouge-wrapped
# blocks always have that exact class, so this distinguishes them cleanly.

module ZhgChgLi
  module WrapBarePre
    BARE_PRE = /<pre(?!\s+class="highlight")([^>]*)>(.*?)<\/pre>/m.freeze

    def self.process(html)
      return html unless html.is_a?(String) && html.include?('<pre')
      html.gsub(BARE_PRE) do
        attrs = Regexp.last_match(1)
        inner = Regexp.last_match(2)
        %(<div class="language-plaintext highlighter-rouge"><div class="highlight"><pre class="highlight"#{attrs}>#{inner}</pre></div></div>)
      end
    end
  end

  Jekyll::Hooks.register(:documents, :post_render) do |doc|
    next unless doc.output_ext == '.html'
    doc.output = WrapBarePre.process(doc.output)
  end

  Jekyll::Hooks.register(:pages, :post_render) do |page|
    next unless page.output_ext == '.html'
    page.output = WrapBarePre.process(page.output)
  end
end
