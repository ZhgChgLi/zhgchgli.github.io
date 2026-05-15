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
#   * Up to 6 ads per post; each clone gets a distinct AdSense slot ID
#     from SLOT_IDS so AdSense's per-slot inventory bidding can fill
#     more positions (vs. all clones sharing one slot).
#   * Posts with ≥1 <h3>: ads always appear after the FIRST and LAST
#     section; remaining slots spread evenly across the middle.
#   * Posts with zero <h3>: a single ad is inserted at the top of the body.

require 'nokogiri'

module ZhgChgLi
  module PostMiddleAd
    AD_SELECTOR   = 'div.post-promo.post-promo-middle'
    BODY_SELECTOR = '#post-body'
    SLOT_IDS = %w[
      4115199933
      8599187119
      5122976533
      2238325724
      4598415660
      5719925646
    ].freeze
    MAX_ADS = SLOT_IDS.length

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

      positions = compute_positions(n, MAX_ADS)
      positions.each_with_index do |pos, i|
        h3s[pos].add_next_sibling(ad_with_slot(template, SLOT_IDS[i]))
      end

      doc.to_html
    rescue StandardError => e
      Jekyll.logger.warn 'PostMiddleAd:', "skipped (#{e.class}: #{e.message})"
      html
    end

    # Pick up to `max` 0-based <h3> indices to place ads after.
    # Always includes the first (0) and last (n-1) section; remaining
    # picks are spread evenly across the middle. Returns 1..max indices.
    def self.compute_positions(n, max)
      return [] if n.zero?
      return [0] if n == 1

      k = [n, max].min
      return [0, n - 1] if k == 2

      middle = (1..(k - 2)).map { |i| (i * (n - 1).to_f / (k - 1)).round }
      ([0] + middle + [n - 1]).uniq.sort
    end

    # Clone the placeholder and rewrite its <ins data-ad-slot> to the
    # given slot ID so each clone is its own AdSense unit.
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
