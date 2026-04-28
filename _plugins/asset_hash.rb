# Compute a content hash for the main stylesheet so cache-busting URLs only
# change when the source actually changes — not on every daily rebuild.
#
# Exposes `site.css_hash` (8-char hex of the SHA-1 of assets/css/main.scss).

require 'digest'

Jekyll::Hooks.register :site, :post_read do |site|
  path = File.join(site.source, 'assets', 'css', 'main.scss')
  next unless File.exist?(path)

  site.config['css_hash'] = Digest::SHA1.hexdigest(File.read(path))[0, 10]
end
