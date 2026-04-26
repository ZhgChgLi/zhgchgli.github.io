# Image optimization for posts:
#   1. WebP swap   — replace /assets/foo.{png,jpg,jpeg,gif} with /assets/foo.webp
#                    when the .webp sibling exists on disk.
#   2. LQIP        — emit a base64 grey-rectangle SVG of the same aspect ratio
#                    as a placeholder, so the layout doesn't jump while the real
#                    image downloads. Dimensions come from optional
#                    assets/data/photos.json (mirrors zhgchgli.github.io); when
#                    missing, falls back to a generic 1200×800 box.
#   3. Lazy load   — add loading="lazy", decoding="async", and width/height to
#                    every content image so the browser can defer decoding and
#                    reserve layout (avoids CLS).
#
# Both inline images in markdown and the cover image in frontmatter are handled.
# The plugin runs in :posts, :pre_render so it sees frontmatter and the original
# markdown, and rewrites both before kramdown parses.

require 'base64'
require 'json'

module ZhgChgLi
  class PhotoOptimization
    EXTS = %w[.png .jpg .jpeg .gif].freeze

    def initialize(site)
      @site = site
      photo_info_path = File.join(site.source, 'assets', 'data', 'photos.json')
      @photo_info = if File.exist?(photo_info_path)
                      JSON.parse(File.read(photo_info_path)) rescue {}
                    else
                      {}
                    end
    end

    def process(post)
      slug = post.data['slug'] || post.basename_without_ext.sub(/^\d{4}-\d{2}-\d{2}-/, '')
      info = @photo_info.fetch(slug, {})

      post.content = rewrite_linked_images(post.content, info)
      post.content = rewrite_standalone_images(post.content, info)

      cover = post.data['image']
      if cover.is_a?(Hash) && cover['path']
        webp = webp_if_exists(cover['path'])
        cover['path'] = webp if webp
        cover['lqip'] = lqip_data_url(*dimensions_for(cover['path'], info))
      end
    end

    private

    # Wrapped form: [![alt](/assets/x.jpg "title")](https://...){:...}
    def rewrite_linked_images(content, info)
      content.gsub(/\[\s*!\[(.*?)\]\((\/assets\/[^\s)]+)(?:\s+"([^"]*)")?\)\s*\]\(([^)]+)\)(\{\:[^}]*\})?/) do
        alt, path, title, link, tail = Regexp.last_match.captures
        next $~[0] unless image_path?(path)
        path = webp_if_exists(path) || path
        ial = build_ial(path, info, tail)
        "[![#{sanitize_alt(alt)}](#{path}#{title_part(title)})#{ial}](#{link})"
      end
    end

    # Standalone form: ![alt](/assets/x.jpg "title")
    def rewrite_standalone_images(content, info)
      content.gsub(/!\[(.*?)\]\((\/assets\/[^\s)]+)(?:\s+"([^"]*)")?\)(\{\:[^}]*\})?/) do
        alt, path, title, tail = Regexp.last_match.captures
        next $~[0] unless image_path?(path)
        path = webp_if_exists(path) || path
        "![#{sanitize_alt(alt)}](#{path}#{title_part(title)})#{build_ial(path, info, tail)}"
      end
    end

    # Strip markdown link syntax + kramdown IAL out of alt text. Medium-imported
    # posts often contain `![[some link](url){:target=_blank}](image-url)` —
    # kramdown leaves the alt as-is, so the markdown leaks into the rendered
    # `alt=` attribute. We render the link as plain text and drop the IAL.
    def sanitize_alt(alt)
      return '' if alt.nil?
      # [text](url){:...}  →  text
      cleaned = alt.gsub(/\[([^\]]*)\]\([^)]*\)(\{\:[^}]*\})?/, '\1')
      # standalone {:...} attribute lists
      cleaned = cleaned.gsub(/\{\:[^}]*\}/, '')
      # kramdown emphasis markers that look weird in alt
      cleaned.gsub(/\\([_*])/, '\1').strip
    end

    def image_path?(path)
      EXTS.any? { |e| path.downcase.end_with?(e) } || path.downcase.end_with?('.webp')
    end

    def title_part(title)
      title.nil? ? '' : %( "#{title}")
    end

    # Build the kramdown inline-attribute list including any pre-existing one.
    def build_ial(path, info, existing_tail)
      width, height = dimensions_for(path, info)
      attrs = [
        %(loading="lazy"),
        %(decoding="async"),
        %(width="#{width}"),
        %(height="#{height}"),
        %(lqip="#{lqip_data_url(width, height)}")
      ]
      if existing_tail.nil? || existing_tail.empty?
        "{: #{attrs.join(' ')} }"
      else
        # Splice into existing IAL: drop the leading `{:` and trailing `}`.
        inner = existing_tail.sub(/\A\{\:\s*/, '').sub(/\s*\}\z/, '')
        "{: #{inner} #{attrs.join(' ')} }"
      end
    end

    def webp_if_exists(image_path)
      return image_path if image_path.downcase.end_with?('.webp')
      ext = File.extname(image_path)
      base = image_path.sub(/#{Regexp.escape(ext)}\z/, '')
      candidate = "#{base}.webp"
      File.exist?(File.join(@site.source, candidate.sub(/\A\//, ''))) ? candidate : nil
    end

    def dimensions_for(image_path, info)
      base = File.basename(image_path, File.extname(image_path))
      entry = info[base] || {}
      [entry['width'] || 1200, entry['height'] || 800]
    end

    def lqip_data_url(width, height)
      svg = %(<svg xmlns="http://www.w3.org/2000/svg" width="#{width}" height="#{height}"><rect width="100%" height="100%" fill="#ede2cf"/></svg>)
      "data:image/svg+xml;base64,#{Base64.strict_encode64(svg)}"
    end
  end

  Jekyll::Hooks.register :site, :pre_render do |site|
    @photo_optimizer = PhotoOptimization.new(site)
  end

  Jekyll::Hooks.register :posts, :pre_render do |post|
    @photo_optimizer ||= PhotoOptimization.new(post.site)
    @photo_optimizer.process(post)
  end
end
