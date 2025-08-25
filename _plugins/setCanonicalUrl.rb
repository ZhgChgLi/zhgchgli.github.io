require 'net/http'
require 'uri'
require 'json'
require 'jekyll'
require_relative './zhgchgli'

def execute()
    mds = Dir.glob("./_posts/zh-tw/zmediumtomarkdown/*.md")
    mds.each do |md|
        zPost = ZPost.new(md)
        url = "https://zhgchg.li/#{zPost.postURL()}"
        setCanonicalUrl(zPost.slug, url)
    end
end

def setCanonicalUrl(slug, url)
    uri = URI.parse("https://medium.com/_/graphql")
    headers = {
    
    }

    body = [
    {
        "operationName" => "UpdateCanonicalUrl",
        "variables" => {
        "input" => {
            "postId" => slug,
            "url" => url
        }
        },
        "query" => "mutation UpdateCanonicalUrl($input: UpdateCanonicalUrlInput!) {\n  updateCanonicalUrl(input: $input) {\n    __typename\n  }\n}\n"
    }
    ].to_json

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri.request_uri, headers)
    request.body = body

    response = http.request(request)

    if response.code.to_i == 200
        puts "✅ Set #{slug} CanonicalUrl to #{url} successfully."
    else
        puts "❌ Set #{slug} CanonicalUrl to #{url} failed. code:#{response.code}"
    end
    puts response.body
    sleep 5
end

execute()