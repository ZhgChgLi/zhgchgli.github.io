# Clone the rendered "middle" sponsored card into the right spots inside
# the post body at build time, so the final HTML is already correct and
# the reader never sees layout reflow from a JS-based mover.
#
# Pairs with:
#   _includes/ad-sponsored-card-middle.html — markup (user-editable)
#   _layouts/post.html                     — emits the placeholder
#                                            <div class="post-ad post-ad-middle" hidden>
#
# Insertion cadence (per Ads sales sheet):
#   * After the 1st <h3> section.
#   * Then every 3 sections after that — h3[3], h3[6], h3[9], …
#   * Plus after the LAST section (deduped if it coincides with a step).
#   * If the post has zero <h3>, drop the placeholder entirely.

require 'nokogiri'

module ZhgChgLi
  module PostMiddleAd
    AD_SELECTOR  = 'div.post-ad.post-ad-middle'
    BODY_SELECTOR = '#post-body'

    def self.process(html)
      return html unless html.is_a?(String)
      return html unless html.include?('post-ad-middle') && html.include?('id="post-body"')

      doc = Nokogiri::HTML5(html, max_errors: -1)
      ad   = doc.at_css(AD_SELECTOR)
      body = doc.at_css(BODY_SELECTOR)
      return html unless ad

      if body.nil?
        ad.remove
        return doc.to_html
      end

      h3s = body.css('h3')
      n = h3s.length
      positions =
        if n.zero?
          []
        else
          steps = (0...n).step(3).to_a              # 0, 3, 6, …
          steps << (n - 1) unless steps.last == n - 1   # … plus after last
          steps
        end

      if positions.empty?
        ad.remove
      else
        ad.remove
        ad.remove_attribute('hidden')
        positions.each { |pos| h3s[pos].add_next_sibling(ad.dup) }
      end

      doc.to_html
    rescue StandardError => e
      Jekyll.logger.warn 'PostMiddleAd:', "skipped (#{e.class}: #{e.message})"
      html
    end
  end

  Jekyll::Hooks.register(:posts, :post_render) do |post|
    next unless post.output_ext == '.html'
    post.output = PostMiddleAd.process(post.output)
  end
end
