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
#   * Posts with ≥1 <h3>: an ad after the FIRST <h3>, then after every
#     4th <h3> (1st, 5th, 9th, …), and always after the LAST <h3>.
#     Duplicates collapse, so a short post may get just 1–2 ads.
#   * Posts with zero <h3>: a single ad is inserted at the top of the
#     body.
#   * Clones cycle through SLOT_IDS for their AdSense slot ID, so when a
#     post needs more ads than there are slots the IDs simply repeat.

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
        h3s[pos].add_next_sibling(ad_with_slot(template, SLOT_IDS[i % SLOT_IDS.length]))
      end

      doc.to_html
    rescue StandardError => e
      Jekyll.logger.warn 'PostMiddleAd:', "skipped (#{e.class}: #{e.message})"
      html
    end

    # Ad anchor <h3> indices (0-based): the first, then every 4th, plus the
    # last. Duplicates collapse:
    #   n=1  → [0]                 (first == last)
    #   n=3  → [0, 2]              (first, last)
    #   n=4  → [0, 3]              (first, 4th == last)
    #   n=9  → [0, 4, 8]           (1st, 5th, 9th == last)
    #   n=14 → [0, 4, 8, 12, 13]   (1st, 5th, 9th, 13th, last)
    def self.compute_positions(n)
      return [] if n.zero?
      positions = (0...n).step(4).to_a   # 0, 4, 8, … → 1st, then every 4th
      positions << (n - 1)               # always after the last
      positions.uniq.sort
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
