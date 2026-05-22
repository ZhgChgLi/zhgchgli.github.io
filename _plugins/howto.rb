# Read HowTo schema entries from `assets/data/howto/<lang>/results.json` (keyed
# by file slug) and attach a serialized JSON-LD `HowTo` blob to
# `post.data['howto']`. Layouts inject it into <head> as
# <script type="application/ld+json">.
#
# Slugs whose JSON value is `null` are non-tutorial articles (negative cache
# from howto_maker.py) and are skipped here.

require 'json'

module ZhgChgLi
  module HowToData
    def self.load(site)
      lang = site.config.dig('i18n', 'current') || site.config['lang'] || 'zh-tw'
      path = File.join(site.source, 'assets', 'data', 'howto', lang, 'results.json')
      return {} unless File.exist?(path)
      JSON.parse(File.read(path))
    rescue StandardError => e
      Jekyll.logger.warn 'HowTo:', "could not parse #{path}: #{e.class}: #{e.message}"
      {}
    end
  end

  # Same pre_render placement as aio_faq.rb — see that file's note on why we
  # avoid :site, :post_read.
  Jekyll::Hooks.register :posts, :pre_render do |post|
    site = post.site
    howto_data = (Thread.current[:zcl_howto_cache] ||= HowToData.load(site))
    slug = post.data['slug'] || post.basename_without_ext.sub(/^\d{4}-\d{2}-\d{2}-/, '')
    entry = howto_data[slug]
    next if entry.nil? || entry.empty?

    base = (site.config['url'] || '').sub(%r{/\z}, '')
    # Merge @context + mainEntityOfPage; preserve the rest of the HowTo body.
    payload = entry.dup
    payload['@context'] ||= 'https://schema.org'
    payload['@type']    ||= 'HowTo'
    payload['mainEntityOfPage'] ||= "#{base}#{post.url}"
    post.data['howto'] = JSON.generate(payload)
  end
end
