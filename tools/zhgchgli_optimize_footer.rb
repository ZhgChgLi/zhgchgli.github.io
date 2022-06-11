

class Main
    def run()
        files = Dir['_posts/*.md']
        files.each do |file|
            lines = File.readlines(file)
            File.open(file, 'w+') do |markdownFile|
                lines.each do |line|
                    if line.include? "延伸閱讀" or line.include? "本文同步發表於" or line.include? "Like Z Realm" or line.include? "有任何問題及指教歡迎與我聯絡。" or line.include? "View original post on Medium"
                        id = file.split("-").last.split(".").first
                        markdownFile.puts "\r\n本文首次發表於 Medium [前往查看](https://medium.com/p/#{id})\r\n"
                        break
                    end
                    markdownFile.puts line
                end
            end
        end

        puts "Optimze Markdown Footer Success!"
    end
end

main = Main.new()
main.run()