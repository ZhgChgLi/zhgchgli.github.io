# Drop jekyll-seo-tag's stock BlogPosting / Article JSON-LD so the only
# BlogPosting that ships is _includes/schema/article.html (which has
# articleSection / keywords / inLanguage / publisher / full Person author —
# the jekyll-seo-tag version is a strict subset).
#
# Two BlogPosting blocks per page is technically legal (Google merges) but
# pollutes Rich Results Test, doubles the JSON-LD payload, and risks the
# crawler picking the less-complete one. Cleaner to ship just our own.
#
# Identification: the jekyll-seo-tag block lacks `publisher` (our schema
# always emits one). Belt + braces: also require lack of `articleSection`,
# so we never strip a hand-rolled block that just happens to omit publisher.

require 'json'

module ZhgChgLi
  module StripSeoTagSchema
    SCRIPT_RE = /<script type="application\/ld\+json">(.*?)<\/script>/m

    module_function

    def rewrite(html)
      return html unless html
      html.gsub(SCRIPT_RE) do |match|
        begin
          parsed = JSON.parse($1)
        rescue JSON::ParserError
          next match
        end
        next match unless parsed.is_a?(Hash)
        next match unless %w[BlogPosting Article].include?(parsed['@type'])
        next match if parsed.key?('publisher') || parsed.key?('articleSection')
        '' # drop
      end
    end
  end

  Jekyll::Hooks.register :posts, :post_render do |post|
    next unless post.output
    post.output = StripSeoTagSchema.rewrite(post.output)
  end

  Jekyll::Hooks.register :pages, :post_render do |page|
    next unless page.output
    page.output = StripSeoTagSchema.rewrite(page.output)
  end
end
