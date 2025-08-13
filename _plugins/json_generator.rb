# # _plugins/json_generator.rb

# require 'json'

# module Jekyll
#   class JSONGenerator < Generator
#     safe true
#     priority :low

#     def generate(site)
#         puts "[jekyll-json] Generating posts.json..."

#         site_url = site.config['url']
#         permalinkMap = {
#             "/posts/en/:title/" => "en",
#             "/posts/cn/:title/" => "cn",
#             "/posts/:title/" => "tw"
#         }
        

#         posts_data = site.posts.docs.reverse.each_with_object({}) do |post, grouped|
#             slug = post.slug
#             permalink = post.permalink
#             image = post.data['image']&.dig('path') || nil
#             if image
#                 image = "#{site_url}#{image}"
#             end

#             grouped[slug] ||= {}
#             grouped[slug]["id"] = slug
#             grouped[slug][permalinkMap[permalink]] = {
#                 title: post.title,
#                 image: image,
#                 url: "#{site_url}#{post.url}",
#                 date: post.date.iso8601,
#                 categories: post.categories || [],
#                 tags: post.tags || [],
#                 description: post.description,
#             }
#         end

#         dir_path = "api/json"
#         FileUtils.mkdir_p(dir_path) unless Dir.exist?(dir_path)


#         posts_group = []
#         posts_data.to_a.each_slice(50).with_index(1) do |slice, index|
#             # slice 是 [slug, {permalink => data}] 的陣列
#             partial_group = slice.to_h.values

#             filename = "posts-#{index}.json"
#             File.open(File.join("#{dir_path}/#{filename}"), 'w') do |f|
#                 f.write(JSON.pretty_generate({"posts":partial_group}))
#             end
#             posts_group << "#{filename}"
#             puts "[jekyll-json] #{filename} created."
#         end
        
#         filename = "#{dir_path}/posts.json"
#         File.open(File.join(filename), 'w') do |f|
#             f.write(JSON.pretty_generate({
#                 "files": posts_group
#             }))
#         end
#     end
#   end
# end