#!/usr/bin/env ruby
#
require 'yaml'
require 'date'

Jekyll::Hooks.register :posts, :post_init do |post|
  raw = File.read(post.path, encoding: "UTF-8")
  data = {}
  if raw =~ /\A---\s*\n(.*?)\n---\s*\n/m
    data = YAML.safe_load(
    $1,
    permitted_classes: [Time, Date, DateTime],
    permitted_symbols: [],
    aliases: true
  ) || {}
  end
  post_id = post.basename_without_ext.sub(/^\d{4}-\d{2}-\d{2}-/, '')
  post_title = Jekyll::Utils.slugify(data['title'])
  post_category = Jekyll::Utils.slugify(data['categories'][0])

  pre_url = "/posts"
  if post.path =~ %r{/_posts/en/}
    pre_url = "/posts/en"
  elsif post.path =~ %r{/_posts/zh-cn/}
    pre_url = "/posts/cn"
  end

  post.data['slug'] = "#{post_title}-#{post_id}"
  post.data['redirect_from'] = [
    "#{pre_url}/#{post_id}/",
    "#{pre_url}/#{post_category}/#{post_id}/"
  ]
end

Jekyll::Hooks.register :documents, :pre_render do |doc|
    next unless doc.extname == '.md'
    doc.content = doc.content.gsub(/\[([^\]]+)\]\((\.\.\/[^\)]+)\)/) do
    link_text = Regexp.last_match(1)  # 方括號內的文字
    link_path = Regexp.last_match(2)  # 小括號內的路徑


    pre_url = "/posts"
    if doc.path =~ %r{/_posts/en/}
        pre_url = "/posts/en"
    elsif doc.path =~ %r{/_posts/zh-cn/}
        pre_url = "/posts/cn"
    end

    # 只處理 ../ 開頭
    next Regexp.last_match(0) unless link_path.start_with?('../')

    new_path = link_path.sub(%r{^\.\./}, "#{pre_url}/")

    "[#{link_text}](#{new_path})"
    end
end
