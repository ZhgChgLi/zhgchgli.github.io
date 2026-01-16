class Analytics
    def initialize()
        @_postStatusDataURL = ENV['Analytics_URL']
        @_cachePostStatus = {}
    end

    def getPostStatus(slug)
        if @_cachePostStatus.empty?
            @_cachePostStatus = self._getPostStatusData()
        end

        result = @_cachePostStatus.fetch(slug, 0)
        if result > 0
            return "#{result.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}+"
        else
            if slug == "total"
                return "1,000,000+"
            else
                return "10,000+"
            end
        end
    end

    private
    def _getPostStatusData(url = @_postStatusDataURL)
        begin
            uri = URI.parse(url)
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

            request = Net::HTTP::Get.new(uri.request_uri)
            response = https.request(request)
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
        rescue StandardError => e
            return {}
        end
    end
end