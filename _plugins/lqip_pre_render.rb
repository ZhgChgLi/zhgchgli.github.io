require 'json'
require "base64"

# 預讀 JSON 資料
LQIP_IMAGE_INFO = begin
  json_path = File.expand_path("../assets/lqip/lqip_images.json", __dir__)
  if File.exist?(json_path)
    JSON.parse(File.read(json_path))
  else
    {}
  end
end

Jekyll::Hooks.register :documents, :pre_render do |doc|
  next unless doc.extname == '.md'

  doc.content = doc.content.gsub(/!\[(.*?)\]\((\/assets\/.*?)\)/) do
    alt_text = Regexp.last_match(1)
    img_path = Regexp.last_match(2)

    next Regexp.last_match(0) unless img_path =~ /\.(jpg|jpeg|png|gif|webp)$/i
    next Regexp.last_match(0) if img_path.include?('/lqip/') # 排除已是 lqip 圖片

    filename = File.basename(img_path)
    basename = File.basename(img_path, ".*")
    dirname = File.dirname(img_path)

    webp_path = File.expand_path("..#{dirname}/#{basename}.webp", __dir__)
    if File.exist?(webp_path)
        img_path = "#{dirname}/#{basename}.webp"
    end

    height = 500
    width = 500

    info = LQIP_IMAGE_INFO[basename]
    if info
        height = info['height']
        width = info['width']
    end

    svg_content = %Q(<svg xmlns="http://www.w3.org/2000/svg" width="#{width}" height="#{height}"><rect width="100%" height="100%" fill="grey"/></svg>)
    base64_string = Base64.strict_encode64(svg_content.encode("UTF-8"))

    "![#{alt_text}](#{img_path}){: lqip=\"data:image/svg+xml;base64,#{base64_string}\" }"
  end

  if doc.data['image'] && doc.data['image']['path']
    filename = File.basename(doc.data['image']['path'])
    basename = File.basename(doc.data['image']['path'], ".*")
    dirname = File.dirname(doc.data['image']['path'])

    webp_path = File.expand_path("..#{dirname}/#{basename}.webp", __dir__)

    if File.exist?(webp_path)
        img_path = "#{dirname}/#{basename}.webp"
        doc.data['image']['path'] = img_path
    end


    height = 200
    width = 360
    info = LQIP_IMAGE_INFO[basename]
    if info
        height = info['height']
        width = info['width']
    end

    svg_content = %Q(<svg xmlns="http://www.w3.org/2000/svg" width="#{width}" height="#{height}"><rect width="100%" height="100%" fill="grey"/></svg>)
    base64_string = Base64.strict_encode64(svg_content.encode("UTF-8"))

    doc.data['image']['lqip'] = "data:image/svg+xml;base64,#{base64_string}"
    
  end
end