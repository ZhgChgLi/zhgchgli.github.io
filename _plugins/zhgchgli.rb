#!/usr/bin/env ruby
require 'net/http'
require 'nokogiri'
require 'uri'
require "base64"
require 'yaml'
require 'date'
require 'json'
require_relative './ZMedium.rb'

require 'jekyll'
# ====================

zMedium = ZMedium.new
mediumFollowers = zMedium.getFollowers()

analytics = Analytics.new

# === On Post init ===
Jekyll::Hooks.register :posts, :post_init do |post|
    zPlguin = ZPlugin.new
    zPlguin.hiddenPostFilter(post)
    zPlguin.seoURLMaker(post)
end

# === On Post Pre Render ===
Jekyll::Hooks.register :posts, :pre_render do |post|
    zPlguin = ZPlugin.new
    zPlguin.removeFooterZMediumToMarkdown(post)
    # ===

    zPlguin.unpinPostFilter(post)
    zPlguin.photoOptizmiation(post)
    zPlguin.postURLRender(post)
    zPlguin.seoTitleRender(post)
    zPlguin.aioFAQRender(post)
    # ===
    zPost = ZPost.new(post.path)

    otherLangs = zPost.otherLangs()

    langsToHreflang = {
        "zh-tw" => "zh-Hant",
        "zh-cn" => "zh-Hans",
        "en" => "en",
        "jp" => "ja"
    }

    post.data['otherLangs'] = otherLangs.transform_keys { |k| langsToHreflang[k.to_s.downcase] || k.to_s }

    allLangs = otherLangs
    langsToDomainlang = {
        "zh-tw" => "zh-Hant",
        "zh-cn" => "zh-Hans",
        "en" => "en",
        "jp" => "jp"
    }
    allLangs[zPost.lang] = zPost.postURL()
    post.data['allLangs'] = allLangs.transform_keys { |k| langsToDomainlang[k.to_s.downcase] || k.to_s }

    post.data['currentURL'] = zPost.postURL()
    post.data['currentLang'] = langsToHreflang[zPost.lang.downcase] || zPost.lang
    # ===
    post.data['views'] = analytics.getPostStatus(zPost.slug)

    zPlguin.removeTravelReadMore(post, L10nStrings.makeMoreTraveloguesTitle(zPost.lang))
    zPlguin.replaceBuymeacoffeToPaypal(post)
    post.content = zPlguin.makePostContentHeader(post) + post.content +  zPlguin.makePostContentFooter(post, mediumFollowers)

    post.data["shortURL"] = zPost.slugPostURL()
end

# === On Post Pre Render ===
Jekyll::Hooks.register :posts, :post_render do |post|
    zPlguin = ZPlugin.new
    tocHTML = zPlguin.makeTOCHTML(post)
    post.output = post.output.gsub("<ZHGCHGLI_POC></ZHGCHGLI_POC>", tocHTML)

    kkday = KKday.new()
    zPost = ZPost.new(post.path)
    kkdayHeader = kkday.makeCommonFlights()
    kkdayFooter = kkday.makeCommonProducts()

    if zPost.slug == '8ace34a1a3d8'
        kkdayHeader = kkday.makeBusanFlights()
        kkdayFooter = kkday.makeBusanProducts()
    elsif zPost.slug == '31b9b3a63abc' || zPost.slug == 'aacd5f5cacd1'
        kkdayHeader = kkday.makeSainFlights()
        kkdayFooter = kkday.makeSainProducts()
    elsif zPost.slug == 'd78e0b15a08a' || zPost.slug == 'cb65fd5ab770'
        kkdayHeader = kkday.makeKyuhsuFlights()
        kkdayFooter = kkday.makeKyuhsuProducts()
    elsif zPost.slug == '958599363857' || zPost.slug == '9da2c51fa4f2'
        kkdayHeader = kkday.makeTokyoFlights()
        kkdayFooter = kkday.makeTokyoProducts()
    elsif zPost.slug == 'b7e7c0938985'
        kkdayHeader = kkday.makeBangkokFlights()
        kkdayFooter = kkday.makeBangkokProducts()
    end
    
    post.output = post.output.gsub("<ZHGCHGLI_KKDAY_HEADER></ZHGCHGLI_KKDAY_HEADER>", kkdayHeader)
    post.output = post.output.gsub("<ZHGCHGLI_KKDAY_FOOTER></ZHGCHGLI_KKDAY_FOOTER>", kkdayFooter)
end


# === On Site Pre Render ===
Jekyll::Hooks.register :site, :pre_render do |site|
    gmt_plus_8 = Time.now.getlocal("+08:00")
    formatted_time = gmt_plus_8.strftime("%Y-%m-%d %H:%M:%S")
    site.data['lastUpdated'] = "#{formatted_time} +08:00"
    site.data['mediumFollowers'] = mediumFollowers
    site.data['totalViews'] = analytics.getPostStatus('total')
end

# === KKday ===
class KKday 
    def makeCommonFlights()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5318" data-amount="3" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end

    def makeSainFlights()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5317" data-amount="3" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end

    def makeBusanFlights()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5309" data-amount="3" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end
    
    def makeKyuhsuFlights()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5308" data-amount="3" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end

    def makeTokyoFlights()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5307" data-amount="3" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end

    def makeBangkokFlights()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5306" data-amount="3" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end

    def makeKansaiFlights()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5305" data-amount="3" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end



    def makeCommonProducts()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5288" data-amount="6" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end

    def makeSainProducts()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5284" data-amount="6" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end

    def makeBusanProducts()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5286" data-amount="6" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end

    def makeKyuhsuProducts()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5300" data-amount="6" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end

    def makeTokyoProducts()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5299" data-amount="6" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end

    def makeBangkokProducts()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5298" data-amount="6" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end

    def makeKansaiProducts()
        return <<~MSG
<ins class="kkday-product-media" data-oid="5301" data-amount="6" data-origin="https://kkpartners.kkday.com"></ins>
<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>
MSG
    end
end

# === Plugin ===

class ZPlugin
    def makeTOCHTML(post)
        zPost = ZPost.new(post.path)
        doc = Nokogiri::HTML::DocumentFragment.parse(post.content)

        # 建立階層結構
        headings = []
        stack = []

        doc.css("h1,h2,h3,h4,h5,h6").each do |h|
            level = h.name[1].to_i # 例如 h2 → 2
            text  = h.text.strip.gsub(/[:：]+\z/, "")
            id    = h["id"]

            node = { "level" => level, "text" => text, "id" => id, "children" => [] }

            # 往回退，找到父層
            while stack.any? && stack.last["level"] >= level
                stack.pop
            end

            if stack.empty?
                headings << node
            else
                stack.last["children"] << node
            end

            stack << node
        end

        html = _make_toc_to_html(headings)

        if html != ""
            html = '<h4 id="zhgchgli-table-of-contents">'+L10nStrings.makeTOCTitle(zPost.lang)+'</h4>'+html
        end

        return html
    end

    def makePostContentHeader(post)
        zPost = ZPost.new(post.path)
        header = ""

#         L10nStrings.makeOtherLangsMessages(zPost.otherLangs()).each do |message|
#             header += <<~MSG
# > #{message}
# {: .prompt-tip }
# MSG
#         end

        if zPost.isAIGenPost()
            header += <<-MSG
> #{L10nStrings.makePostIsAIMessage(zPost.lang)}
{: .prompt-info }
MSG
        else
            if zPost.isAITranslatedPost()
                header += <<-MSG
> #{L10nStrings.makePostIsTranslatedMessage(zPost.lang)}
{: .prompt-info }
MSG
            elsif zPost.isMediumPost()
                header += <<-MSG
> #{L10nStrings.makeSEOMessage(zPost.lang)}
{: .prompt-info }
MSG
            end
        end

        #header += "\n\n<ZHGCHGLI_POC></ZHGCHGLI_POC>\n---\n\n"
        #if zPost.isTravelPost()
        #    header += "<ZHGCHGLI_KKDAY_HEADER></ZHGCHGLI_KKDAY_HEADER>"
        #end

        return header

    end

    def makeReadMoreTravelPostsHTML(post, zPost)
        if @_travels.nil?
            travelsJSONPath = "./assets/data/travels.json"
            
            if File.exist?(travelsJSONPath)
                @_travels = JSON.parse(File.read(travelsJSONPath)) rescue []
            end
        end

        readMoreText = "## #{L10nStrings.makeMoreTraveloguesTitle(zPost.lang)}\n"
        for travel in @_travels.reverse
            absTravel = Dir.pwd+travel
            postTravel = ZPost.new(absTravel)
            if post.path != absTravel
                readMoreText += "- [#{postTravel.getPostTitle(zPost.lang)}](#{postTravel.postURL(zPost.lang)})\n"
            end
        end
        readMoreText += "\n"

        return readMoreText
    end

    def makePostContentFooter(post, mediumFollowers)
        zPost = ZPost.new(post.path)
        footer = ''

        #if zPost.isTravelPost()
        #    footer += "<ZHGCHGLI_KKDAY_FOOTER></ZHGCHGLI_KKDAY_FOOTER>"
        #end
        
        site      = post.site
        site_url  = site.config['url'] || ""

        post_url = "#{site_url}#{zPost.slugPostURL()}"
        footer += <<-MSG
<script src="/assets/clipboard.min.js"></script>
<div style=" display:flex; align-items:center; gap:10px; border:1px solid #e5e7eb; background:#f9fafb; padding:12px 16px; border-radius:12px; margin:18px 0; box-shadow:0 3px 8px rgba(0,0,0,0.05); width: auto;"> <input id="share-url" value="#{post_url}" readonly style=" flex:1; border:1px solid #d1d5db; border-radius:8px; padding:10px 12px; font-size:0.9rem; background:#ffffff; color:#111827; outline:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; " /> <button class="btn" data-clipboard-target="#share-url" id="copy-btn" style=" border:none; background:#3b82f6; color:white; padding:10px 16px; border-radius:10px; cursor:pointer; font-size:0.85rem; font-weight:600; display:flex; align-items:center; gap:6px; transition:all .15s ease; box-shadow:0 2px 5px rgba(59,130,246,0.35); " onmouseover="this.style.opacity='0.92';" onmouseout="this.style.opacity='1';" > <span style="font-size:1rem;">🔗</span> <span id="copy-btn-text">Copy link to share!</span> </button></div><script> new ClipboardJS('.btn'); var btn = document.getElementById("copy-btn"); var text = document.getElementById("copy-btn-text"); btn.addEventListener("click", function () { text.textContent = "Copied!"; btn.style.background = "#16a34a"; btn.style.boxShadow = "0 2px 6px rgba(22,163,74,0.35)"; setTimeout(() => { text.textContent = "Copy link to share!"; btn.style.background = "#3b82f6"; btn.style.boxShadow = "0 2px 5px rgba(59,130,246,0.35)"; }, 1500); });</script>
MSG

        if !zPost.isAIGenPost()
            footer += "\n\n---\n\n"
            footer += <<-MSG
<a href="/contact" target="_blank" rel="noopener" style="display:block;margin:12px 0;text-align:center;align-items:center;justify-content:center;padding:10px 22px;border-radius:999px;text-decoration:none;background:linear-gradient(135deg,#ffd54f,#ffb300);color:#000;font-size:16px;font-weight:700;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 10px rgba(0,0,0,.15);cursor:pointer;transition:all .15s ease;width:350px" onmouseover='this.style.background="linear-gradient(135deg,#FFE082,#FFC107)",this.style.transform="translateY(-1px)",this.style.boxShadow="0 6px 14px rgba(0,0,0,0.2)"' onmouseout='this.style.background="linear-gradient(135deg,#FFD54F,#FFB300)",this.style.transform="translateY(0)",this.style.boxShadow="0 4px 10px rgba(0,0,0,0.15)"'>🍺 Buy me a beer on PayPal</a>
MSG
            footer += <<-MSG
> 👉👉👉 [**Follow Me On Medium!** (#{mediumFollowers} Followers)](https://medium.com/@zhgchgli){:target="_blank"} 👈👈👈
{: .prompt-tip }
MSG
        end
        
        if zPost.isMediumPost()
            footer += <<-MSG
> #{L10nStrings.makePostFromMediumMessage(zPost.slug, zPost.lang)}
{: .prompt-info }
MSG
        end

        footer += <<-MSG
> [Improve this page on Github.](https://github.com/ZhgChgLi/zhgchgli.github.io/blob/main/#{post.relative_path}){:target="_blank"}
{: .prompt-info }
MSG

        return footer
    end

    def removeTravelReadMore(post, title)
        post.content = post.content.gsub(/^\#{1,6}[ \t]*(#{title})[ \t]*\n(?>^-\s.*\n|\n)+/, '')
    end

    def removeFooterZMediumToMarkdown(post)
        post.content = post.content.gsub(/^.*(converted from Medium by \[ZMediumToMarkdown\]).*$(\n)*\z/i, '')
    end

    def replaceBuymeacoffeToPaypal(post)
        post.content = post.content.gsub(/(\!\[\[Buy me a coffee\]\(https\:\/\/www\.buymeacoffee\.com\/zhgchgli\)\{\:target\=\"_blank\"\}\])\(.*\)/i, "<a href=\"/contact\" target=\"_blank\" rel=\"noopener\" style=\"display:block;margin:12px 0;text-align:center;align-items:center;justify-content:center;padding:10px 22px;border-radius:999px;text-decoration:none;background:linear-gradient(135deg,#ffd54f,#ffb300);color:#000;font-size:16px;font-weight:700;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 10px rgba(0,0,0,.15);cursor:pointer;transition:all .15s ease;width:350px\" onmouseover='this.style.background=\"linear-gradient(135deg,#FFE082,#FFC107)\",this.style.transform=\"translateY(-1px)\",this.style.boxShadow=\"0 6px 14px rgba(0,0,0,0.2)\"' onmouseout='this.style.background=\"linear-gradient(135deg,#FFD54F,#FFB300)\",this.style.transform=\"translateY(0)\",this.style.boxShadow=\"0 4px 10px rgba(0,0,0,0.15)\"'>🍺 Buy me a beer on PayPal</a>")
        post.content = post.content.gsub(/(\[Buy me a coffee\]\(https\:\/\/www\.buymeacoffee\.com\/zhgchgli\)\{\:target\=\"_blank\"\})/i, '[🍺 Buy me a beer on PayPal](/contact){:target="_blank"}')
        post.content = post.content.gsub(/https\:\/\/www\.buymeacoffee\.com\/zhgchgli/i, '/contact')
    end

    def aioFAQRender(post)
        zPost = ZPost.new(post.path)

        if !zPost.aioFaqs().empty?
            result = {
                "@context" => "https://schema.org",
                "@type" => "FAQPage",
                "mainEntity" => zPost.aioFaqs()
            }
            post.data['aioFaqs'] = JSON.generate(result)
        end
    end

    def seoTitleRender(post)
        zPost = ZPost.new(post.path)
        post.data['title'] = zPost.getPostTitle()
        post.data['description'] = zPost.getPostDescription()
    end

    def seoURLMaker(post)
        zPost = ZPost.new(post.path)

        post.data['slug'] = zPost.postPath()

        redirect_from = post.data['redirect_from'] || []
        redirect_from.push(zPost.slugPostURL())
        redirect_from.push(zPost.shortPostURL())

        if zPost.lang == "zh-tw"
            if zPost.slug == "atami"
                redirect_from.push("/posts/z-度旅行遊記/熱海夏季花火大會攻略-觀賞地點-交通-住宿-美食與一日遊全解析-atami/")
            end
        end

        
        post.data['redirect_from'] = redirect_from
    end

    def postURLRender(post)
        fromZPost = ZPost.new(post.path)

        post.content = post.content.gsub(/\[((?>[^\[\]]+|\[[^\[\]]*\])*)\]\((\.\.\/[^)]+)\)/) do
            linkText = Regexp.last_match(1)  # 方括號內的文字
            linkPath = Regexp.last_match(2)  # 小括號內的路徑
            # 只處理 ../ 開頭
            next Regexp.last_match(0) unless linkPath.start_with?('../')
            
            postSlug = linkPath.gsub(%r{\A\.*\/|\/\z}, '')
            
            
            zPost = ZPost.initWithSlug(fromZPost.lang, postSlug)

            "[#{linkText}](#{zPost.postURL()})"
        end
    end

    def photoOptizmiation(post)
        zPost = ZPost.new(post.path)
        zPhoto = ZPhoto.new(zPost.slug)

        # Photos in post contetnt
        # 1) Images wrapped by a link: [![alt](/assets/xxx.jpg "title")] (https://...){:...}
        post.content = post.content.gsub(/\[\s*!\[(.*?)\]\((\/assets\/[^\s\)]+)(?:\s+"([^"]*)")?\)\s*\]\(([^)]+)\)(\{\:[^}]*\})?/) do
            altText   = Regexp.last_match(1)
            imagePath = Regexp.last_match(2)
            title     = Regexp.last_match(3)
            linkHref  = Regexp.last_match(4)
            linkTail  = Regexp.last_match(5) || ""

            next Regexp.last_match(0) unless imagePath =~ /\.(jpg|jpeg|png|gif|webp)$/i
            next Regexp.last_match(0) if imagePath.include?('/lqip/')

            webpImagePath = zPhoto.getWebpImagePathIfExists(imagePath)
            imagePath = webpImagePath if webpImagePath

            title_part = title.nil? ? "" : " \"#{title}\""
            inner = "![#{altText}](#{imagePath}#{title_part}){: lqip=\"#{zPhoto.lqipImage(imagePath)}\" }"
            "[#{inner}](#{linkHref})#{linkTail}"
        end

        # 2) Standalone images (optionally with title): ![alt](/assets/xxx.jpg "title")
        post.content = post.content.gsub(/!\[(.*?)\]\((\/assets\/[^\s\)]+)(?:\s+"([^"]*)")?\)/) do
            altText   = Regexp.last_match(1)
            imagePath = Regexp.last_match(2)
            title     = Regexp.last_match(3)

            next Regexp.last_match(0) unless imagePath =~ /\.(jpg|jpeg|png|gif|webp)$/i
            next Regexp.last_match(0) if imagePath.include?('/lqip/')

            webpImagePath = zPhoto.getWebpImagePathIfExists(imagePath)
            imagePath = webpImagePath if webpImagePath

            title_part = title.nil? ? "" : " \"#{title}\""
            "![#{altText}](#{imagePath}#{title_part}){: lqip=\"#{zPhoto.lqipImage(imagePath)}\" }"
        end

        # Post Conver Image
        if post.data['image'] && post.data['image']['path']
            imagePath = post.data['image']['path']
            webpImagePath = zPhoto.getWebpImagePathIfExists(imagePath)
            if webpImagePath
                imagePath = webpImagePath
            end

            post.data['image']['path'] = imagePath
            post.data['image']['lqip'] = zPhoto.lqipSizeImage(360, 100)
        end
    end

    def hiddenPostFilter(post)
        l10n = ENV["L10n"]
        if l10n.nil?
            if !post.path.include?('/zh-tw/') or post.path.include?('/redirect/')
                post.data['hidden'] = true
            end
        else
            if post.path.include?('/redirect/')
                post.data['hidden'] = true
            end
        end
    end

    def unpinPostFilter(post)
        if post.data['hidden']
            post.data['pin'] = false
        end
    end

    private
    def _make_toc_to_html(nodes, isRoot = true)
        return "" if nodes.nil? || nodes.empty?
        parts = []

        if isRoot
          parts << '<nav class="zhgchgli-toc"><ul class="zhgchgli-toc-list">'
        else
          parts << "<ul>"
        end

        nodes.each do |node|
          text = node['text']
          id   = node['id'].to_s
          children = node['children'] || []

          if children.any?
            # Use <details>/<summary> so nested lists are collapsed by default
            parts << %Q(<li class="has-children"><details><summary>#{text} <a href="##{id}">#</a></summary>)
            parts << _make_toc_to_html(children, false)
            parts << "</details></li>"
          else
            parts << %Q(<li><a href="##{id}">#{text}</a></li>)
          end
        end

        if isRoot
          parts << '</ul></nav>'
        else
          parts << "</ul>"
        end

        parts.join
    end
end


# === Helper ===

class L10nStrings
    def self.makeMoreTraveloguesTitle(lang)
        messages = {
            "zh-tw" => "更多遊記",
            "zh-cn" => "更多游记",
            "en" => "More Travelogues",
            "jp" => "もっと旅行記"
        }
        return messages[lang] || messages["en"]
    end

    def self.makeTOCTitle(lang)
        messages = {
            "zh-tw" => "文章目錄",
            "zh-cn" => "文章目录",
            "en" => "Table of Contents",
            "jp" => "記事一覧"
        }
        return messages[lang] || messages["en"]
    end

    def self.makeKKdayPromoMessage(lang)
        messages = {
            "zh-tw" => "如果這篇文章對您有幫助，歡迎使用我的 推廣連結 選購 KKday 商品、行程，我將獲得部分收益，持續更多旅遊創作，謝謝您的支持！。",
            "zh-cn" => "如果这篇文章对您有帮助，欢迎使用我的 推广链接 选购 KKday 商品、行程，我将获得部分收益，持续更多旅游创作，谢谢您的支持！。",
            "en" => "Found this guide useful? Use my KKday referral link to book your trip—I’ll earn a small commission to support more content like this. Thank you!",
            "jp" => "もしこの記事がお役に立ちましたら、私の紹介リンクから KKday の商品やツアーをご利用いただけると嬉しいです。 収益の一部は、今後の旅の記録や記事制作に活用させていただきます。 応援ありがとうございます！"
        }
        return messages[lang] || messages["en"]
    end

    def self.makeSEOMessage(lang)
        messages = {
            "zh-tw" => "基於 SEO 考量，本文標題與描述經 AI 調整，原始版本請參考內文。",
            "zh-cn" => "基于 SEO 考量，本文标题与描述经 AI 调整，原始版本请参考内文。",
            "en" => "For SEO purposes, this article’s title and description have been refined using AI. Please refer to the content below for the original wording.",
            "jp" => "SEO の観点から、本記事のタイトルおよび説明文は AI により調整されています。原文については本文をご参照ください。"
        }
        return messages[lang] || messages["en"]
    end

    def self.makePostFromMediumMessage(slug, lang)
        messages = {
            "zh-tw" => %(本文首次發表於 Medium \([**點此查看原始版本**](https://medium.com/p/#{slug}){:target="_blank"}\)，由 [ZMediumToMarkdown](/posts/tools/medium-to-jekyll/){:target="_blank"} 提供自動轉換與同步技術。),
            "zh-cn" => %(本文首次发表于 Medium \([**点击查看原始版本**](https://medium.com/p/#{slug}){:target="_blank"}\)，由 [ZMediumToMarkdown](/posts/tools/medium-to-jekyll/){:target="_blank"} 提供自动转换与同步技术。),
            "en" => %(This post was originally published on Medium \([**View original post**](https://medium.com/p/#{slug}){:target="_blank"}\), and automatically converted and synced by [ZMediumToMarkdown](/posts/tools/medium-to-jekyll/){:target="_blank"}.),
            "jp" => %(本記事は Medium にて初公開されました（[**こちらからオリジナル版を確認**](https://medium.com/p/#{slug}){:target="_blank"}）。[ZMediumToMarkdown](/posts/tools/medium-to-jekyll/){:target="_blank"} による自動変換・同期技術を使用しています。)
        }
        return messages[lang] || messages["en"]
    end

    def self.makePostIsTranslatedMessage(lang)
        messages = {
            "zh-tw" => "這篇文章是由 AI 協助翻譯的版本，若發現語意不通順的地方，歡迎留言告知！",
            "zh-cn" => "这篇文章是由 AI 协助翻译的版本，若发现语意不通顺的地方，欢迎留言告知！",
            "en" => "This post was translated with AI assistance — let me know if anything sounds off!",
            "jp" => "本記事は AI による翻訳をもとに作成されています。表現が不自然な箇所がありましたら、ぜひコメントでお知らせください。"
        }
        return messages[lang] || messages["en"]
    end

    def self.makePostIsAIMessage(lang)
        messages = {
            "zh-tw" => "這篇文章是由 AI 基於已發佈文章自動彙整產生，若發現語意不通順或內容有錯誤，敬請留言告知！",
            "zh-cn" => "这篇文章由 AI 基于已发布内容自动整理生成，如有语句不通顺或内容错误，欢迎留言告知！",
            "en" => "This article was automatically generated by AI based on previously published content. Please leave a comment if you notice anything unclear or incorrect.",
            "jp" => "本記事は、公開済みの記事をもとに AI が自動生成したものです。表現の不自然さや内容の誤りにお気づきの際は、コメントでお知らせください。"
        }
        return messages[lang] || messages["en"]
    end

    def self.makeOtherLangsMessages(langs)
        allMessages = []
        langs.each do |lang, url|
            messages = {
                "zh-tw" => "[**點擊這裡**](#{url})查看本文章正體中文版本。",
                "zh-cn" => "[**点击这里**](#{url})查看本文章简体中文版本。",
                "en" => "[**Click here**](#{url}) to view the English version of this article.",
                "jp" => "[**こちらをクリック**](#{url})して、本記事の日本語版をご覧ください。"
            }
            next if messages[lang].nil? || messages[lang].empty?
            allMessages.push(messages[lang])
        end

        return allMessages
    end
end

class ZPhoto
    attr_accessor :slug

    def initialize(slug)
        @slug = slug

        photoInfoJSONPath = "./assets/data/photos.json"
        @photoInfo = {}
        if File.exist?(photoInfoJSONPath)
            @photoInfo = JSON.parse(File.read(photoInfoJSONPath)) rescue {}
        end

        @photoInfo = @photoInfo.fetch(@slug, {})
    end

    def lqipImage(imagePath)
        baseName = self._getFileBaseName(imagePath)
        width = self._getWidth(baseName)
        height = self._getHeight(baseName)

        return self.lqipSizeImage(width, height)
    end

    def lqipSizeImage(width, height)
        svg_content = %Q(<svg xmlns="http://www.w3.org/2000/svg" width="#{width}" height="#{height}"><rect width="100%" height="100%" fill="grey"/></svg>)
        base64_string = Base64.strict_encode64(svg_content.encode("UTF-8"))
        return "data:image/svg+xml;base64,#{base64_string}"
    end

    def getWebpImagePathIfExists(imagePath)
        filename = File.basename(imagePath)
        baseName = self._getFileBaseName(imagePath)
        webpImagePath = imagePath.sub(/#{Regexp.escape(filename)}$/, "#{baseName}.webp")
        if File.exist?("."+webpImagePath)
            return webpImagePath
        else
            return nil
        end
    end

    
    private

    def _getFileBaseName(filePath)
        return File.basename(filePath, File.extname(filePath))
    end

    def _getWidth(fileBaseName)
        return @photoInfo.fetch(fileBaseName, {}).fetch('width', 500)
    end

    def _getHeight(fileBaseName)
        return @photoInfo.fetch(fileBaseName, {}).fetch('height', 500)
    end

end

class ZPost
    attr_accessor :path, :lang, :slug
    def initialize(path)
        @lang = path[%r{posts/([^/]+)/}, 1]
        path = path.sub(%r{/_posts/}, "/L10n/posts/")
        return nil unless File.exist?(path)

        @defaultLang = "zh-tw"
        @path = path
        @slug = File.basename(path, File.extname(path)).sub(/^\d{4}-\d{2}-\d{2}-/, '');

        # Private
        @_cacheSEOData = {}
        @_frontMatter = {}
        @_cacheAIOData = {}
        @_travels = nil
    end

    def self.initWithSlug(lang, slug)
        matched = Dir.glob("./L10n/posts/#{lang}/**/*-#{slug}.md").first
        if matched
            return ZPost.new(matched)
        else
            return nil
        end
    end

    def isAITranslatedPost(lang = @lang)
        if self.getPostTags(lang).include?("ai-translation")
            return true
        end
        return false
    end

    def isAIGenPost(lang = @lang)
        if self.getPostTags(lang).include?("ai-posts")
            return true
        end
        return false
    end

    def isTravelPost(lang = @lang)
        if self.getPostCategory(lang).match(/(遊記|travel|旅行記|life|生活)/i)
            return true
        end
        return false
    end

    def isMediumPost()
        !!(@path =~ %r{/zmediumtomarkdown/})
    end

    def getPostTitle(lang = @lang)
        if isAIGenPost
            return self._getFrontMatter(lang).fetch('title', '')
        else
            return self._getSEOData(lang).fetch(@slug, {}).fetch('title', self._getFrontMatter(lang).fetch('title', ''))
        end
    end

    def getPostDescription(lang = @lang)
        if isAIGenPost
            return self._getFrontMatter(lang).fetch('title', '')
        else
            return self._getSEOData(lang).fetch(@slug, {}).fetch('description', self._getFrontMatter(lang).fetch('description', ''))
        end
    end

    def getPostCategory(lang = @lang)
        return self._getFrontMatter(lang).fetch('categories', []).first || ''
    end

    def getPostTags(lang = @lang)
        return self._getFrontMatter(lang).fetch('tags', [])
    end

    def postURL(lang = @lang)
        postCategoryURLPath = ERB::Util.url_encode(Jekyll::Utils.slugify(self.getPostCategory(lang)))
        postCategoryURLPath = (postCategoryURLPath == "") ? ("") : ("/#{postCategoryURLPath}")
        posURLPath = ERB::Util.url_encode(self.postPath(lang))

        l10n = ENV["L10n"]
        if !l10n.nil?
            if lang == "en"
                return "https://en.zhgchg.li/posts#{postCategoryURLPath}/#{posURLPath}/"
            elsif lang == "zh-cn"
                return "https://zh-hans.zhgchg.li/posts#{postCategoryURLPath}/#{posURLPath}/"
            elsif lang == "zh-tw"
                return "https://zhgchg.li/posts#{postCategoryURLPath}/#{posURLPath}/"
            elsif lang == "jp"
                return "https://jp.zhgchg.li/posts#{postCategoryURLPath}/#{posURLPath}/"
            end
        end
        
        langURLPath = (lang == @defaultLang) ? ("/") : ("/#{lang}/")
        return "/posts#{postCategoryURLPath}#{langURLPath}#{posURLPath}/"
    end

    def postPath(lang = @lang)
        postTitleURLPath = Jekyll::Utils.slugify(self.getPostTitle(lang))
        if postTitleURLPath.empty?
            return @slug
        end

        return "#{postTitleURLPath}-#{Jekyll::Utils.slugify(@slug)}"
    end

    def slugPostURL(lang = @lang)
        langURLPath = (lang == @defaultLang) ? ("/") : ("/#{lang}/")

        l10n = ENV["L10n"]
        if !l10n.nil?
            langURLPath = "/"
        end
        
        return "/posts#{langURLPath}#{@slug}/"
    end

    def shortPostURL(lang = @lang)
        langURLPath = (lang == @defaultLang) ? ("/") : ("/#{lang}/")
        l10n = ENV["L10n"]
        if !l10n.nil?
            langURLPath = "/"
        end
        postCategoryURLPath = Jekyll::Utils.slugify(self.getPostCategory(lang))
        
        return "/posts/#{postCategoryURLPath}#{langURLPath}#{@slug}/"
    end

    def aioFaqs(lang = @lang)
        self._getAIOData(lang).fetch(@slug, [])
    end

    def otherLangs()
        dirLangs = Dir.glob("./L10n/posts/*/")
        allLangs = []
        for dir in dirLangs
            lang = dir[%r{\./L10n/posts/([^/]+)/}, 1]
            next if lang.nil? || lang.empty? || lang == @lang
            allLangs.push(lang)
        end

        result = {}
        for lang in allLangs
            filePath = @path.sub(%r{/posts/(#{Regexp.escape(@lang)})/}, "/posts/#{lang}/")
            if File.exist?(filePath)
                result[lang] = self.postURL(lang)
            end
        end

        return result
    end

    private

    def _getFrontMatter(lang)
        if @_frontMatter.fetch(lang, nil).nil?
            path = @path.sub(/\/posts\/#{Regexp.escape(@lang)}\//, "/posts/#{lang}/")
            raw = File.read(path, encoding: "UTF-8") rescue ""
            if raw =~ /\A---\s*\n(.*?)\n---\s*\n/m
                front = Regexp.last_match(1)
                @_frontMatter[lang] = YAML.safe_load(front, permitted_classes: [Time, Date, DateTime]) || nil
            else
                @_frontMatter[lang] = {}
            end
        end
        return @_frontMatter[lang]
    end

    def _getSEOData(lang)
        if @_cacheSEOData.fetch(lang, nil).nil?
            seoPath = "./assets/data/seo/#{lang}/results.json"
            if File.exist?(seoPath)
                @_cacheSEOData[lang] = JSON.parse(File.read(seoPath)) rescue {}
            else
                @_cacheSEOData[lang] = {}
            end
        end

        return @_cacheSEOData[lang]
    end

    def _getAIOData(lang)
        if @_cacheAIOData.fetch(lang, nil).nil?
            aioPath = "./assets/data/aio/#{lang}/results.json"
            if File.exist?(aioPath)
                @_cacheAIOData[lang] = JSON.parse(File.read(aioPath)) rescue {}
            else
                @_cacheAIOData[lang] = {}
            end
        end

        return @_cacheAIOData[lang]
    end
end