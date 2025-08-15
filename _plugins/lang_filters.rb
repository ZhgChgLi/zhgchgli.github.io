Jekyll::Hooks.register :posts, :post_init do |post|
  if !post.path.include?('/zh-tw/') or post.path.include?('/redirect/')
    post.data['hidden'] = true
  end
end

Jekyll::Hooks.register :posts, :pre_render do |post|
  if post.data['hidden']
    post.data['pin'] = false
  end
end