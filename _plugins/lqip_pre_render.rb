Jekyll::Hooks.register :documents, :pre_render do |doc|
  next unless doc.extname == '.md'

  doc.content = doc.content.gsub(/!\[(.*?)\]\((\/assets\/.*?)\)/) do
    alt_text = Regexp.last_match(1)
    img_path = Regexp.last_match(2)

    next Regexp.last_match(0) unless img_path =~ /\.(jpg|jpeg|png|gif|webp)$/i
    next Regexp.last_match(0) if img_path.include?('/lqip/') # 排除已是 lqip 圖片

    # 將 /assets/ 替換為 /assets/lqip/
    lqip_path = img_path.sub(%r{^/assets/}, '/assets/lqip/').sub(/\.(jpg|jpeg|png|gif|webp)$/i, '.jpg')
    
    # 回傳帶有 {: lqip="..." } 的語法
    "![#{alt_text}](#{img_path}){: lqip=\"#{lqip_path}\" }"
  end

  if doc.data['image'] && doc.data['image']['path']
    doc_lqip_path = doc.data['image']['path'].sub(%r{^/assets/}, '/assets/lqip/').sub(/\.(jpg|jpeg|png|gif|webp)$/i, '.jpg')
    doc.data['image']['lqip'] = doc_lqip_path
  end
end