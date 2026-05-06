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

  # Runs at :site, :pre_render — i.e. AFTER all :post_read hooks (notably
  # short_url_redirects.rb, which sets post.data['permalink']) AND after
  # generators have computed post.url. Reading post.url any earlier would
  # memoize @url against the global :slug permalink, defeating the
  # permalink override and turning /<file-slug>/ into a self-redirect.
  Jekyll::Hooks.register :site, :pre_render do |site|
    aio_data = AioData.load(site)
    base = (site.config['url'] || '').sub(%r{/\z}, '')
    site.posts.docs.each do |post|
      slug = post.data['slug'] || post.basename_without_ext.sub(/^\d{4}-\d{2}-\d{2}-/, '')
      faqs = aio_data[slug]
      next if faqs.nil? || faqs.empty?

      payload = {
        '@context'   => 'https://schema.org',
        '@type'      => 'FAQPage',
        'url'        => "#{base}#{post.url}",
        'mainEntity' => faqs
      }
      post.data['aioFaqs'] = JSON.generate(payload)
    end
  end
end
