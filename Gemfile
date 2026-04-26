source "https://rubygems.org"

gem "jekyll", "~> 4.3"

group :jekyll_plugins do
  gem "jekyll-feed",     "~> 0.17"
  gem "jekyll-sitemap",  "~> 1.4"
  gem "jekyll-paginate-v2", "~> 3.0"
  gem "jekyll-archives", "~> 2.3"
  gem "jekyll-seo-tag",  "~> 2.8"
  gem "jekyll-redirect-from", "~> 0.16"
end

gem "kramdown-parser-gfm", "~> 1.1"

# Ruby 3.x stdlib gems no longer bundled by default
gem "csv"
gem "base64"
gem "bigdecimal"
gem "logger"

platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end
gem "wdm", "~> 0.1.0", :install_if => Gem.win_platform?
