class ZMedium
    def initialize()
        @_postStatusDataURL = "https://script.google.com/macros/s/AKfycbx7p5jak9qelxQOrl90ZXgJAu38_Ss4OJD-jJ2g_Dc4eCPbsvWsYrWsD3pDOc3m_J947w/exec"
        @_cachePostStatus = {}
    end

    def getFollowers()
        begin
            url = medium_host = ENV['MEDIUM_HOST'] || "https://medium.com/_/graphql"
            uri = URI.parse(url)

            payload = [
                {
                "operationName": "UserFollowers",
                "variables": {
                    "id": nil,
                    "username": "zhgchgli",
                    "paging": nil
                },
                "query": "query UserFollowers($username: ID, $id: ID, $paging: PagingOptions) {\n  userResult(username: $username, id: $id) {\n    __typename\n    ... on User {\n      id\n      followersUserConnection(paging: $paging) {\n        pagingInfo {\n          next {\n            from\n            limit\n            __typename\n          }\n          __typename\n        }\n        users {\n          ...FollowList_publisher\n          __typename\n        }\n        __typename\n      }\n      ...UserCanonicalizer_user\n      ...FollowersHeader_publisher\n      ...NoFollows_publisher\n      __typename\n    }\n  }\n}\n\nfragment collectionUrl_collection on Collection {\n  id\n  domain\n  slug\n  __typename\n}\n\nfragment CollectionAvatar_collection on Collection {\n  name\n  avatar {\n    id\n    __typename\n  }\n  ...collectionUrl_collection\n  __typename\n  id\n}\n\nfragment SignInOptions_collection on Collection {\n  id\n  name\n  __typename\n}\n\nfragment SignUpOptions_collection on Collection {\n  id\n  name\n  __typename\n}\n\nfragment SusiModal_collection on Collection {\n  name\n  ...SignInOptions_collection\n  ...SignUpOptions_collection\n  __typename\n  id\n}\n\nfragment PublicationFollowButton_collection on Collection {\n  id\n  slug\n  name\n  ...SusiModal_collection\n  __typename\n}\n\nfragment PublicationFollowRow_collection on Collection {\n  __typename\n  id\n  name\n  description\n  ...CollectionAvatar_collection\n  ...PublicationFollowButton_collection\n}\n\nfragment userUrl_user on User {\n  __typename\n  id\n  customDomainState {\n    live {\n      domain\n      __typename\n    }\n    __typename\n  }\n  hasSubdomain\n  username\n}\n\nfragment UserAvatar_user on User {\n  __typename\n  id\n  imageId\n  membership {\n    tier\n    __typename\n    id\n  }\n  name\n  username\n  ...userUrl_user\n}\n\nfragment isUserVerifiedBookAuthor_user on User {\n  verifications {\n    isBookAuthor\n    __typename\n  }\n  __typename\n  id\n}\n\nfragment SignInOptions_user on User {\n  id\n  name\n  imageId\n  __typename\n}\n\nfragment SignUpOptions_user on User {\n  id\n  name\n  imageId\n  __typename\n}\n\nfragment SusiModal_user on User {\n  ...SignInOptions_user\n  ...SignUpOptions_user\n  __typename\n  id\n}\n\nfragment useNewsletterV3Subscription_newsletterV3 on NewsletterV3 {\n  id\n  type\n  slug\n  name\n  collection {\n    slug\n    __typename\n    id\n  }\n  user {\n    id\n    name\n    username\n    newsletterV3 {\n      id\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment useNewsletterV3Subscription_user on User {\n  id\n  username\n  newsletterV3 {\n    ...useNewsletterV3Subscription_newsletterV3\n    __typename\n    id\n  }\n  __typename\n}\n\nfragment useAuthorFollowSubscribeButton_user on User {\n  id\n  name\n  ...useNewsletterV3Subscription_user\n  __typename\n}\n\nfragment useAuthorFollowSubscribeButton_newsletterV3 on NewsletterV3 {\n  id\n  name\n  ...useNewsletterV3Subscription_newsletterV3\n  __typename\n}\n\nfragment AuthorFollowSubscribeButton_user on User {\n  id\n  name\n  imageId\n  ...SusiModal_user\n  ...useAuthorFollowSubscribeButton_user\n  newsletterV3 {\n    id\n    ...useAuthorFollowSubscribeButton_newsletterV3\n    __typename\n  }\n  __typename\n}\n\nfragment UserFollowRow_user on User {\n  __typename\n  id\n  name\n  bio\n  ...UserAvatar_user\n  ...isUserVerifiedBookAuthor_user\n  ...AuthorFollowSubscribeButton_user\n}\n\nfragment FollowsHeader_publisher on Publisher {\n  __typename\n  id\n  name\n  ... on Collection {\n    ...collectionUrl_collection\n    __typename\n    id\n  }\n  ... on User {\n    ...userUrl_user\n    __typename\n    id\n  }\n}\n\nfragment FollowList_publisher on Publisher {\n  id\n  ... on Collection {\n    ...PublicationFollowRow_collection\n    __typename\n    id\n  }\n  ... on User {\n    ...UserFollowRow_user\n    __typename\n    id\n  }\n  __typename\n}\n\nfragment UserCanonicalizer_user on User {\n  id\n  username\n  hasSubdomain\n  customDomainState {\n    live {\n      domain\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment FollowersHeader_publisher on Publisher {\n  ...FollowsHeader_publisher\n  ... on Collection {\n    subscriberCount\n    __typename\n    id\n  }\n  ... on User {\n    socialStats {\n      followerCount\n      __typename\n    }\n    __typename\n    id\n  }\n  __typename\n}\n\nfragment NoFollows_publisher on Publisher {\n  id\n  name\n  __typename\n}\n"
                }
            ];

            headers = {
                "User-Agent" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0",
                "Cookie" => "sid=#{ENV['MEDIUM_COOKIE_SID']}; uid=#{ENV['MEDIUM_COOKIE_UID']}",
                "Content-Type" => "application/json"
            }

            https = Net::HTTP.new(uri.host, uri.port)
            https.read_timeout = 30
            https.open_timeout = 10
            https.use_ssl = true

            # --- TLS / Certificate verification setup ---
            # Some OpenSSL builds/configs enable CRL checking, which can fail with:
            # "certificate verify failed (unable to get certificate CRL)".
            # Net::HTTP/OpenSSL does not automatically fetch CRLs, so we use a default
            # cert store and clear CRL-related flags to avoid hard failures while still
            # verifying the peer certificate.
            https.verify_mode = OpenSSL::SSL::VERIFY_PEER

            store = OpenSSL::X509::Store.new
            store.set_default_paths
            # Ensure no CRL-check flags are enabled by default
            store.flags = 0
            https.cert_store = store

            # Allow overriding CA bundle paths via environment variables if needed.
            if ENV['SSL_CERT_FILE'] && !ENV['SSL_CERT_FILE'].empty?
            https.ca_file = ENV['SSL_CERT_FILE']
            end
            if ENV['SSL_CERT_DIR'] && !ENV['SSL_CERT_DIR'].empty?
            https.ca_path = ENV['SSL_CERT_DIR']
            end

            # (Optional) timeouts to avoid hanging on network issues
            https.open_timeout = 10
            https.read_timeout = 30
            # --- end TLS setup ---


            req = Net::HTTP::Post.new(uri.request_uri, headers)
            req.body = JSON.dump(payload)

            res = https.request(req)

            json = JSON.parse(res.body)
            count = json&.dig(0, "data", "userResult", "socialStats", "followerCount")
            count ? count.to_i : 0
            return "1K+" unless count.to_i > 0
            return "#{count.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}+"
        rescue => e
            "1K+"
        end
    end

    def getPostStatus(slug)
        if @_cachePostStatus.empty?
            @_cachePostStatus = self._getPostStatusData()
        end

        result = @_cachePostStatus.fetch(slug, {})
        return {
            medium: result.fetch("meidum", 0),
            zhgchgli: result.fetch("zhgchgli", 0),
        }
    end

    private
    def _getPostStatusData(url = @_postStatusDataURL)
        uri = URI(url);
        response = Net::HTTP.get_response(uri)

        case response
        when Net::HTTPSuccess then
            data = JSON.parse(response.body)
            return data
        when Net::HTTPFound then
            newURL = response['location']
            return self._getPostStatusData(newURL)
        else
            return {}
        end
    end
end