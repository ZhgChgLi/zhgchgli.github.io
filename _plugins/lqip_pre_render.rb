require 'json'

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
    height = LQIP_IMAGE_INFO[filename]

    # 確認對應的 placeimage 存在
    lqip_path = File.expand_path("../assets/lqip/#{height}.svg", __dir__)
    if height && File.exist?(lqip_path)
      puts lqip_path
      "![#{alt_text}](#{img_path}){: lqip=\"/assets/lqip/#{height}.svg\" }"
    else
      "![#{alt_text}](#{img_path})"
    end
  end
end