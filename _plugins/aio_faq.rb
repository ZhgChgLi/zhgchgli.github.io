# Read FAQ schema entries from `assets/data/aio/<lang>/results.json` (keyed
# by file slug) and attach a serialized JSON-LD `FAQPage` blob to
# `post.data['aioFaqs']`. Layouts inject it into <head> as
# <script type="application/ld+json">.

require 'json'

module ZhgChgLi
  module AioData
    def self.load(site)
      lang = site.config.dig('i18n', 'current') || site.config['lang'] || 'zh-tw'
      path = File.join(site.source, 'assets', 'data', 'aio', lang, 'results.json')
      return {} unless File.exist?(path)
      JSON.parse(File.read(path))
    rescue StandardError => e
      Jekyll.logger.warn 'AIO:', "could not parse #{path}: #{e.class}: #{e.message}"
      {}
    end
  end

  # Build the FAQ payload at render time (pre_render fires per-post, after
  # permalinks finalize). Touching `post.url` inside :site, :post_read would
  # snapshot the default permalink before short_url_redirects.rb overrides
  # it, causing every post's canonical URL to collapse to `/<slug>/` and
  # collide with its own redirect_from entry — infinite redirect loop.
  Jekyll::Hooks.register :posts, :pre_render do |post|
    site = post.site
    aio_data = (Thread.current[:zcl_aio_cache] ||= AioData.load(site))
    slug = post.data['slug'] || post.basename_without_ext.sub(/^\d{4}-\d{2}-\d{2}-/, '')
    faqs = aio_data[slug]
    next if faqs.nil? || faqs.empty?

    base = (site.config['url'] || '').sub(%r{/\z}, '')
    payload = {
      '@context'   => 'https://schema.org',
      '@type'      => 'FAQPage',
      'url'        => "#{base}#{post.url}",
      'mainEntity' => faqs
    }
    post.data['aioFaqs'] = JSON.generate(payload)
  end
end
