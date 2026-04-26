# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Custom Jekyll 4.x magazine theme for **ZhgChgLi Tech & Travel** (https://zhgchg.li). No theme gem — all layouts/includes/sass live in this repo. Posts use slug-based permalinks (`/:slug/`); image assets live under `/assets/<slug>/`. Deployed via GitHub Actions to GitHub Pages (`.github/workflows/pages.yml`).

## Commands

```bash
bundle install
bundle exec jekyll serve         # http://127.0.0.1:4000
bundle exec jekyll build         # output to _site/
JEKYLL_ENV=production bundle exec jekyll build
```

## Architecture

- `_config.yml` — site metadata, plugins, pagination, archives, giscus + GA settings.
- `_data/` — `nav.yml` (top + drawer nav), `social.yml` (footer/drawer social links).
- `_layouts/` — `default.html` (shell), `home.html`, `post.html`, `page.html`, plus `archive-category.html` / `archive-tag.html` / `archive-year.html` consumed by **jekyll-archives**.
- `_includes/` — `head.html` (SEO meta, GA, GLightbox CSS, favicons), `topbar.html`, `drawer.html`, `footer.html`, `scripts.html` (drawer JS + GLightbox), `dense-row.html` (shared list-row card), `pager.html` (paginate-v2 pager), `giscus.html`.
- `_sass/`-style tokens live inline in `assets/css/main.scss` (single compiled stylesheet with all design tokens, components, RWD).
- Root pages: `index.html` (home), `posts.html` (paginated, 20/page), `categories.html`, `tags.html`, `archive.html` (year index), `search.html`, `404.html`, `search.json` (build-time JSON of all posts).

### Pagination
Uses **jekyll-paginate-v2** (paginate-v1 only paginates root). Per-page config in `posts.html` front-matter (`permalink: page/:num/` is interpreted as a suffix to the page URL).

### Archives
**jekyll-archives** generates `/categories/:name/`, `/tags/:name/`, `/archive/:year/` from post front-matter; index pages (`categories.html`, `tags.html`, `archive.html`) link into them.

### Post page
- TOC built **client-side** by JS in `_layouts/post.html` (scans `#post-body h2[id], h3[id]`). Both the top inline TOC and floating sticky TOC use the same JS. Don't try to use kramdown's `{:toc}` directive in layouts — it only runs inside Markdown.
- Images get wrapped in `<a class="glightbox">` at runtime to enable lightbox + zoom (GLightbox v3 from CDN, MIT).
- Code highlighting via Rouge with custom warm-palette token colors in `main.scss` under `.highlight .*`.
- Comments via **giscus** (config in `_config.yml` under `giscus:`).

### Search
Plain client-side substring filter against `/search.json`. Avoided lunr because Chinese tokenization is fragile and the dataset is small (~125 posts, ~250 KB JSON).

### SEO
`jekyll-seo-tag` for OpenGraph/Twitter cards + `jekyll-sitemap` + `jekyll-feed` (Atom). `head.html` adds canonical, sitemap link, favicons, and GA4 tag.

## Deployment

Pushes to `main` trigger `.github/workflows/pages.yml` which builds with Ruby 3.3 + bundler-cache and deploys to GitHub Pages via official actions. Repository must have Pages source set to "GitHub Actions" in repo settings.
