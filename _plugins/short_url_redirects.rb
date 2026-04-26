# Per-post URL + SEO override.
#
# For every post we:
#   1. Look up an SEO-tuned title/description from
#      `assets/data/seo/<lang>/results.json` (keyed by file slug). If present,
#      override `post.data['title']` and `post.data['description']` so layouts
#      and SEO meta use the SEO copy.
#   2. Compute a canonical permalink — slugified first category +
#      slugified (final) title + file slug. We bypass Jekyll's :categories
#      template variable because it doesn't slugify per-segment correctly and
#      gets polluted by the parent directory of nested posts.
#   3. Inject `redirect_from` entries (consumed by jekyll-redirect-from):
#        - /<file-slug>/                                       short URL
#        - /posts/<cat>/<original-title-slug>-<file-slug>/    pre-SEO URL
#      The original-title redirect is only added when the SEO title differs
#      from the original frontmatter title.

require 'json'
require 'yaml'

module ZhgChgLi
  module SeoData
    def self.load(site)
      lang = site.config.dig('i18n', 'current') || site.config['lang'] || 'zh-tw'
      path = File.join(site.source, 'assets', 'data', 'seo', lang, 'results.json')
      return {} unless File.exist?(path)
      JSON.parse(File.read(path))
    rescue StandardError => e
      Jekyll.logger.warn 'SEO:', "could not parse #{path}: #{e.class}: #{e.message}"
      {}
    end
  end

  module PostPermalinks
    def self.file_slug(post)
      post.data['slug'] || post.basename_without_ext.sub(/^\d{4}-\d{2}-\d{2}-/, '')
    end

    def self.first_category_slug(post)
      cats = Array(post.data['categories'])
               .map { |c| Jekyll::Utils.slugify(c.to_s) }
               .reject { |s| s.nil? || s.empty? }
      cats.first
    end

    def self.url(cat_slug, title_slug, file_slug)
      cat_part = cat_slug ? "#{cat_slug}/" : ''
      slug = title_slug.empty? ? file_slug : "#{title_slug}-#{file_slug}"
      "/posts/#{cat_part}#{slug}/"
    end
  end

  module Translations
    # Cache per-language SEO results.json to avoid re-reading per post.
    @seo_cache = {}

    def self.seo_for(site, lang)
      key = lang.to_s
      return @seo_cache[key] if @seo_cache.key?(key)
      path = File.join(site.source, 'assets', 'data', 'seo', key, 'results.json')
      @seo_cache[key] = File.exist?(path) ? (JSON.parse(File.read(path)) rescue {}) : {}
    end

    # Read just the YAML frontmatter from a markdown file (avoid loading the
    # whole body) and return it as a hash.
    def self.frontmatter(path)
      head = +''
      File.open(path, 'r:utf-8') do |f|
        first = f.readline
        return {} unless first.strip == '---'
        f.each_line do |line|
          break if line.strip == '---'
          head << line
        end
      end
      YAML.safe_load(head, permitted_classes: [Time, Date, DateTime]) || {}
    rescue StandardError
      {}
    end

    # For each other language, find the sibling translated source file (matching
    # by file slug) and compute its CANONICAL URL on that language's domain
    # using the same permalink rules our build applies to posts:
    #   /posts/<first-cat-slug>/<title-slug>-<file-slug>/
    # If a SEO override exists in that language's seo/<lang>/results.json,
    # the SEO title takes precedence — exactly as the build does.
    def self.for_post(site, file_slug)
      current = site.config.dig('i18n', 'current')
      langs = site.config.dig('i18n', 'languages') || []
      result = {}
      langs.each do |lng|
        code = lng['code']
        next if code.nil? || code == current
        glob = File.join(site.source, 'L10n', 'posts', code, '**', "*-#{file_slug}.md")
        match = Dir.glob(glob).first
        next unless match

        fm = frontmatter(match)
        cats = Array(fm['categories']).map { |c| Jekyll::Utils.slugify(c.to_s) }.reject(&:empty?)
        cat_slug = cats.first

        seo_entry = seo_for(site, code)[file_slug] || {}
        title = seo_entry['title'].to_s.empty? ? fm['title'].to_s : seo_entry['title'].to_s
        title_slug = Jekyll::Utils.slugify(title)

        path = PostPermalinks.url(cat_slug, title_slug, file_slug)
        result[code] = "#{lng['url']}#{path}"
      end
      result
    end
  end

  Jekyll::Hooks.register :site, :post_read do |site|
    seo_data = SeoData.load(site)

    site.posts.docs.each do |post|
      fslug = PostPermalinks.file_slug(post)
      cat_slug = PostPermalinks.first_category_slug(post)
      seo_entry = seo_data[fslug] || {}

      # Hidden posts: omitted from on-site listings (handled in layouts via
      # `where_exp: 'p', 'p.hidden != true'`) but kept in the sitemap and
      # Atom feed so search engines and feed readers can still discover them.

      original_title = post.data['title'].to_s
      final_title    = (seo_entry['title'].to_s.empty? ? original_title : seo_entry['title'].to_s)
      final_desc     = (seo_entry['description'].to_s.empty? ? post.data['description'] : seo_entry['description'])

      # Override title / description with the SEO copy
      post.data['title']            = final_title
      post.data['description']      = final_desc
      post.data['original_title']   = original_title

      original_slug = Jekyll::Utils.slugify(original_title)
      final_slug    = Jekyll::Utils.slugify(final_title)

      post.data['permalink'] = PostPermalinks.url(cat_slug, final_slug, fslug)

      # Short URL — what the share button hands out. /posts/<file-slug>/ is
      # the official short form; /<file-slug>/ at the root is kept only as a
      # backwards-compat redirect for old links from the previous scheme.
      short_url = "/posts/#{fslug}/"
      post.data['short_url'] = short_url

      # Per-post translations: { 'en' => 'https://en.zhgchg.li/posts/<slug>/', ... }
      # Used by head.html (hreflang) and lang-switcher to point at the matching
      # post on the other-language domain instead of just the language root.
      post.data['translations'] = Translations.for_post(site, fslug)

      redirects = Array(post.data['redirect_from'])
      redirects << short_url
      redirects << "/#{fslug}/"
      redirects << "/posts/#{cat_slug}/#{fslug}/" if cat_slug
      if !original_slug.empty? && original_slug != final_slug
        redirects << PostPermalinks.url(cat_slug, original_slug, fslug)
      end
      post.data['redirect_from'] = redirects.uniq
    end
  end
end
