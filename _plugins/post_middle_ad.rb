# Clone the rendered "middle" sponsored card into the right spots inside
# the post body at build time, so the final HTML is already correct and
# the reader never sees layout reflow from a JS-based mover.
#
# Pairs with:
#   _includes/ad-sponsored-card-middle.html — markup (user-editable)
#   _layouts/post.html                     — emits the placeholder
#                                            <div class="post-promo post-promo-middle" hidden>
#
# Placement rules:
#   * Posts with ≥1 <h3>: up to 3 ads — after the FIRST <h3>, the
#     MIDDLE <h3>, and the LAST <h3>. Duplicates collapse, so a post
#     with 1 section gets 1 ad, with 2 sections gets 2 ads, etc.
#   * Posts with zero <h3>: a single ad is inserted at the top of the
#     body.
#   * Each clone gets its own AdSense slot ID from SLOT_IDS so AdSense
#     bids per slot independently (one slot's unfilled doesn't poison
#     the others).

require 'nokogiri'

module ZhgChgLi
  module PostMiddleAd
    AD_SELECTOR   = 'div.post-promo.post-promo-middle'
    BODY_SELECTOR = '#post-body'
    SLOT_IDS = %w[
      4115199933
      8599187119
      5122976533
    ].freeze

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
          first.before(ad_with_slot(template, SLOT_IDS[0]))
        else
          body.add_child(ad_with_slot(template, SLOT_IDS[0]))
        end
        return doc.to_html
      end

      compute_positions(n).each_with_index do |pos, i|
        h3s[pos].add_next_sibling(ad_with_slot(template, SLOT_IDS[i]))
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

    # Clone the placeholder and rewrite its <ins data-ad-slot> so each
    # clone is its own AdSense unit.
    def self.ad_with_slot(template, slot_id)
      clone = template.dup
      ins = clone.at_css('ins.adsbygoogle')
      ins['data-ad-slot'] = slot_id if ins
      clone
    end
  end

  Jekyll::Hooks.register(:posts, :post_render) do |post|
    next unless post.output_ext == '.html'
    post.output = PostMiddleAd.process(post.output)
  end
end
