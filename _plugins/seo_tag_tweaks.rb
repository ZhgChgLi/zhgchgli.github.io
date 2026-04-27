# Localised 404 title for jekyll-seo-tag.
#
# Replaces the static "Page not found" frontmatter title on /404.html with
# the active language's `strings.<lang>.notfound.error_label`, so both the
# SEO <title> and tab title render in the right language.

Jekyll::Hooks.register(:site, :post_read) do |site|
  current = site.config.dig('i18n', 'current')
  next unless current

  localised = site.data.dig('strings', current, 'notfound', 'error_label')
  next if localised.nil? || localised.empty?

  page_404 = site.pages.find { |p| p.url == '/404.html' }
  page_404.data['title'] = localised if page_404
end
