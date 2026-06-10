// Promo fallback — swap each .post-promo-middle from AdSense → house ad when:
//   - the AdSense script never loaded (blocked by uBlock / AdBlock / Brave)
//   - or AdSense flipped data-ad-status="unfilled" on this slot
//   - or no status appears within the timeout window AND the <ins> is 0 height
//
// Key behaviour: AdSense itself lazy-loads slots below the fold (the
// adsbygoogle.js library only fires the ad request when the slot is near
// viewport). So we ALSO defer the fallback decision until each slot is
// near viewport — otherwise we'd prematurely swap to house for slots that
// AdSense hasn't even had a chance to fill yet.
//
// Per-slot decision: when one of N identical slots unfills, only that
// one swaps to fallback.

(function () {
  var TIMEOUT_MS  = 5000;
  var ROOT_MARGIN = "300px";   // start watching ~one viewport before scroll

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
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

  // Final decision after MutationObserver gave up (or never had a chance).
  // Single source of truth = data-ad-status. AdSense sets it to "filled"
  // or "unfilled" once it has decided. Anything else after the timeout
  // (no attribute, slot collapsed, slot reserved height but iframe empty)
  // counts as a failed fill — swap to house ad.
  function settle(wrap, ins) {
    if (typeof window.adsbygoogle === "undefined") {
      swapWrapper(wrap);
      return;
    }
    if (ins.getAttribute("data-ad-status") === "filled") return;
    swapWrapper(wrap);
  }

  // Start the fill-or-fallback watch for one slot. Called when the slot
  // enters the viewport-adjacent window (or immediately on browsers
  // without IntersectionObserver).
  function startWatch(wrap) {
    if (wrap.dataset.watching === "1") return;
    // ad-rotator.js already took this slot over with an affiliate product;
    // its AdSense primary is intentionally hidden — leave it alone.
    if (wrap.classList.contains("post-promo-using-product")) return;
    wrap.dataset.watching = "1";

    var ins = wrap.querySelector("ins.adsbygoogle");
    if (!ins) return;

    if (ins.getAttribute("data-ad-status")) {
      settle(wrap, ins);
      return;
    }

    var done = false;
    var obs = new MutationObserver(function () {
      var status = ins.getAttribute("data-ad-status");
      if (!status) return;
      done = true;
      obs.disconnect();
      if (status === "unfilled") swapWrapper(wrap);
    });
    obs.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });

    setTimeout(function () {
      if (done) return;
      obs.disconnect();
      settle(wrap, ins);
    }, TIMEOUT_MS);
  }

  ready(function () {
    var wrappers = document.querySelectorAll(".post-promo-middle");
    if (!wrappers.length) return;

    if (typeof IntersectionObserver === "undefined") {
      wrappers.forEach(startWatch);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        startWatch(entry.target);
      });
    }, { rootMargin: ROOT_MARGIN });

    wrappers.forEach(function (wrap) { io.observe(wrap); });
  });
})();
