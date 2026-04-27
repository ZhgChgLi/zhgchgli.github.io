# Localised page titles for jekyll-seo-tag.
#
# Static pages (posts.html, categories.html, tags.html, archive.html,
# search.html, 404.html, _pages/about.md, _pages/contact.md) declare a
# `nav_id` in front matter. We override their `title` to the active
# language's `strings.<lang>.nav.<nav_id>` so both <title> and any
# template-side {{ page.title }} render in the right language.
#
# 404 keeps its own override key (notfound.error_label) since "Error 404"
# reads better as a tab title than the bare nav label.

Jekyll::Hooks.register(:site, :post_read) do |site|
  current = site.config.dig('i18n', 'current')
  next unless current

  strings = site.data.dig('strings', current) || {}
  nav_strings = strings['nav'] || {}

  pages = site.pages + site.documents
  pages.each do |page|
    nav_id = page.data['nav_id']
    next if nav_id.nil? || nav_id.empty?
    next if nav_id == 'home' # homepage uses site.title

    label = nav_strings[nav_id]
    page.data['title'] = label if label && !label.empty?
  end

  localised_404 = strings.dig('notfound', 'error_label')
  if localised_404 && !localised_404.empty?
    page_404 = site.pages.find { |p| p.url == '/404.html' }
    page_404.data['title'] = localised_404 if page_404
  end
end
