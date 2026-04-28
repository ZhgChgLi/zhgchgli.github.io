# Per-post view counts + week/month/all-time top-10 rankings.
#
# Reads three sibling JSON files (refreshed daily by GitHub Actions) from the
# repo root:
#   total.json   — all-time slug -> views
#   top7.json    — last 7 days
#   top30.json   — last 30 days
#
# Effects on build:
#   - Every post gets `post.data['views']` set from total.json (default 10
#     when the slug is missing — keeps the byline stable for cold posts).
#   - `site.data['rankings']` is populated with three top-10 lists keyed
#     'week' / 'month' / 'all'. Each entry is `{ 'post' => Document, 'views' => Integer }`.
#     Slugs that don't map to a published local post are dropped silently.
#
# Runs on :site, :post_read AFTER short_url_redirects.rb (alphabetical load
# order) so post titles/permalinks are already finalised.

require 'json'

module ZhgChgLi
  module ViewsData
    DEFAULT_VIEWS = 10
    SOURCES = { 'all' => 'total.json', 'week' => 'top7.json', 'month' => 'top30.json' }.freeze
    TOP_N = 10

    def self.load_json(site, filename)
      path = File.join(site.source, filename)
      return {} unless File.exist?(path)
      JSON.parse(File.read(path))
    rescue StandardError => e
      Jekyll.logger.warn 'Views:', "could not parse #{path}: #{e.class}: #{e.message}"
      {}
    end

    def self.rank(json, slug_to_post)
      json
        .filter_map { |slug, views|
          post = slug_to_post[slug]
          next nil unless post
          { 'post' => post, 'views' => views.to_i }
        }
        .sort_by { |e| -e['views'] }
        .first(TOP_N)
    end
  end

  Jekyll::Hooks.register :site, :post_read do |site|
    sources = ViewsData::SOURCES.transform_values { |f| ViewsData.load_json(site, f) }
    total = sources.fetch('all')

    visible_posts = site.posts.docs.reject { |p| p.data['hidden'] == true }

    slug_to_post = visible_posts.each_with_object({}) do |post, h|
      h[PostPermalinks.file_slug(post)] = post
    end

    site.posts.docs.each do |post|
      slug = PostPermalinks.file_slug(post)
      post.data['views'] = total[slug] || ViewsData::DEFAULT_VIEWS
    end

    site.data['rankings'] = sources.transform_values { |json| ViewsData.rank(json, slug_to_post) }
  end
end
