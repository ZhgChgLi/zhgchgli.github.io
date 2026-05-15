# Clone the rendered "middle" sponsored card into the right spots inside
# the post body at build time, so the final HTML is already correct and
# the reader never sees layout reflow from a JS-based mover.
#
# Pairs with:
#   _includes/ad-sponsored-card-middle.html — markup (user-editable)
#   _layouts/post.html                     — emits the placeholder
#                                            <div class="post-promo post-promo-middle" hidden>
#
# Placement rules (all clones share one AdSense slot — keeping the
# inventory concentrated improves fill rate vs spreading across many
# fresh, un-warmed slot IDs):
#   * Posts with ≥1 <h3>: up to 3 ads — after the FIRST <h3>, the
#     MIDDLE <h3>, and the LAST <h3>. Duplicates collapse, so a post
#     with 1 section gets 1 ad, with 2 sections gets 2 ads, etc.
#   * Posts with zero <h3>: a single ad is inserted at the top of the
#     body.

require 'nokogiri'

module ZhgChgLi
  module PostMiddleAd
    AD_SELECTOR   = 'div.post-promo.post-promo-middle'
    BODY_SELECTOR = '#post-body'

    def self.process(html)
      return html unless html.is_a?(String)
      return html unless html.include?('post-promo-middle') && html.include?('id="post-body"')

      doc = Nokogiri::HTML5(html, max_errors: -1)
      template = doc.at_css(AD_SELECTOR)
      body     = doc.at_css(BODY_SELECTOR)
      return html unless template

      template.remove
      template.remove_attribute('hidden')

      if body.nil?
        return doc.to_html
      end

      h3s = body.css('h3')
      n = h3s.length

      if n.zero?
        # No sections — one ad at the very top of the body.
        first = body.children.first
        if first
          first.before(template.dup)
        else
          body.add_child(template.dup)
        end
        return doc.to_html
      end

      compute_positions(n).each do |pos|
        h3s[pos].add_next_sibling(template.dup)
      end

      doc.to_html
    rescue StandardError => e
      Jekyll.logger.warn 'PostMiddleAd:', "skipped (#{e.class}: #{e.message})"
      html
    end

    # First, middle, last <h3> indices (0-based). Duplicates collapse:
    #   n=1 → [0]            (first == middle == last)
    #   n=2 → [0, 1]         (middle == first)
    #   n=3 → [0, 1, 2]
    #   n=10 → [0, 5, 9]
    def self.compute_positions(n)
      return [] if n.zero?
      [0, n / 2, n - 1].uniq.sort
    end
  end

  Jekyll::Hooks.register(:posts, :post_render) do |post|
    next unless post.output_ext == '.html'
    post.output = PostMiddleAd.process(post.output)
  end
end
