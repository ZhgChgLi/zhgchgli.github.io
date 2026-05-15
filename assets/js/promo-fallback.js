// Promo fallback — swap each .post-promo-middle from AdSense → house ad when:
//   - the AdSense script never loaded (blocked by uBlock / AdBlock / Brave)
//   - or AdSense returned data-ad-status="unfilled"
//   - or the <ins class="adsbygoogle"> element has 0 visible height
//
// Detection runs once, ~3.5s after DOMContentLoaded — long enough for
// AdSense to either fill or mark unfilled, short enough that the page
// doesn't sit blank for ad-blocker users.

(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function shouldFallback(ins) {
    // Script never loaded at all → ad-blocker.
    if (typeof window.adsbygoogle === "undefined") return true;
    var status = ins.getAttribute("data-ad-status");
    if (status === "unfilled") return true;
    // Even with `display:block`, blockers collapse <ins> to 0 height.
    if (ins.offsetHeight < 30) return true;
    return false;
  }

  function swapWrapper(wrapper) {
    var primary  = wrapper.querySelector(".post-promo-primary");
    var fallback = wrapper.querySelector(".post-promo-fallback");
    if (!primary || !fallback) return;
    if (fallback.dataset.shown === "1") return;     // idempotent
    primary.hidden = true;
    fallback.hidden = false;
    fallback.dataset.shown = "1";
    wrapper.classList.add("post-promo-using-fallback");
  }

  ready(function () {
    var wrappers = document.querySelectorAll(".post-promo-middle");
    if (!wrappers.length) return;

    setTimeout(function () {
      wrappers.forEach(function (wrap) {
        // No <ins> at all → wrapper has no AdSense slot, nothing to fall
        // back from (e.g., user replaced the include with a static link).
        var ins = wrap.querySelector("ins.adsbygoogle");
        if (!ins) return;
        if (shouldFallback(ins)) swapWrapper(wrap);
      });
    }, 3500);
  });
})();
