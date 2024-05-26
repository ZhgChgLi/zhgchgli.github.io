require 'net/http'
require 'uri'

class Main
    def run()
        files = Dir['_posts/zmediumtomarkdown/*.md']
        files.each do |file|
            id = file.split("-").last.split(".").first

            lines = File.readlines(file)
            newLines = []

            en_url = "https://en.zhgchg.li/posts/#{id}/"
            en_url_exists = url_exists(en_url)
            en_text = "[View the English version of this article here.](#{en_url}){:target=\"_blank\"}\r\n"

            lines.each do |line|
                if line.include? "延伸閱讀" or line.include? "本文同步發表於" or line.include? "Like Z Realm" or line.include? "有任何問題及指教歡迎與我聯絡。" or line.include? "converted from Medium by [ZMediumToMarkdown]"
                    
                    newLines.append("\r\n\r\n===\r\n\r\n 本文首次發表於 Medium ➡️ [**前往查看**](https://medium.com/p/#{id}){:target=\"_blank\"}\r\n")
                    if ch_url_exists
                        newLines.append(ch_text)
                    end
                    
                    break
                end
                newLines.append(line)
            end

            File.open(file, 'w') { |f| f.write(newLines.join) }

            puts "#{file} Optimze Done!"
        end

        puts "Optimze Markdown Footer Success!"
    end

    def url_exists(url)
        uri = URI.parse(url)
        request = Net::HTTP.new(uri.host, uri.port)
        request.use_ssl = (uri.scheme == 'https')
        
        path = uri.path.empty? ? '/' : uri.path
        response = request.request_head(path)
        
        response.code.to_i != 404
    end
end

main = Main.new()
main.run()
