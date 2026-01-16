---
author: ZhgChgLi
categories: []
date: 2025-03-02T12:21:31.452+0000
description: Medium Redirect...
feed: false
hidden: true
last_modified_at: 2026-01-16T00:37:00.229+0000
render_with_liquid: false
robots: noindex, nofollow
search: false
sitemap: false
tags: []
title: Medium Redirect...
---

<script>
    const target = "https://en.zhgchg.li/";

    function parseMediumPostIdFromReferrer(ref) {
      if (!ref) return null;
      let u;
      try {
        u = new URL(ref);
      } catch {
        return null;
      }

      const host = u.hostname.toLowerCase();
      if (!(host === "medium.com" || host.endsWith(".medium.com"))) return null;

      const path = u.pathname.replace(/\/+$/, "");
      const lastSeg = path.split("/").pop() || "";

      const m = lastSeg.match(/-([0-9a-f]{12})$/i) || lastSeg.match(/^([0-9a-f]{12})$/i);
      return m ? m[1].toLowerCase() : null;
    }

    const ref = document.referrer || "";
    const mediumPostId = parseMediumPostIdFromReferrer(ref);

    if (mediumPostId) {
        window.location.replace(target+"posts/"+mediumPostId);
    } else {
        window.location.replace(target);
    }
</script>
