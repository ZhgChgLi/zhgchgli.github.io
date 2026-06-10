// Affiliate-product ad rotator (zh-tw site AND navigator.language "zh-TW",
// case-insensitive). At DOMContentLoaded:
//   1. Read all candidate cards from <template id="ad-product-pool">.
//   2. Keep only those still within deadline (today <= data-deadline).
//   3. Pick ONE at random (per page load) and clone it into every
//      .post-promo-product slot, then take over: hide the AdSense primary
//      and tag the wrapper so promo-fallback.js leaves it alone.
//   4. If zero valid candidates, do nothing — the slot keeps AdSense + house
//      fallback exactly as before ("no advertiser → default display").
//
// Build-time (post.html) coarse-filters out already-expired products; this
// is the authoritative client-side check so an ad expiring between builds
// still vanishes without a rebuild.

(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function todayISO() {
    // Local-date YYYY-MM-DD (matches the ISO deadline strings from CSV).
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  var AUTOPLAY_MS = 4000;   // advance every 4s
  var RESUME_MS   = 7000;   // resume autoplay 7s after a manual interaction

  // Wire up one card's image carousel: autoplay + dot navigation, with native
  // horizontal scroll-snap handling manual swipe. Any manual interaction
  // (swipe or dot tap) pauses autoplay for a while. No-op for single-image cards.
  function initCarousel(card) {
    var track = card.querySelector(".ad-product-track");
    if (!track) return;
    var n = track.children.length;
    if (n < 2) return;
    var dots = card.querySelectorAll(".ad-product-dot");
    var paused = false, resumeTimer = null;

    function curIndex() {
      return track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0;
    }
    function syncDots() {
      var i = curIndex();
      for (var d = 0; d < dots.length; d++) dots[d].classList.toggle("is-active", d === i);
    }
    function pause() {
      paused = true;
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () { paused = false; }, RESUME_MS);
    }

    track.addEventListener("scroll", syncDots, { passive: true });
    track.addEventListener("pointerdown", pause, { passive: true });
    for (var d = 0; d < dots.length; d++) {
      (function (i) {
        dots[i].addEventListener("click", function (e) {
          e.preventDefault();          // dot lives inside the product <a>
          e.stopPropagation();
          track.scrollTo({ left: track.clientWidth * i, behavior: "smooth" });
          pause();
        });
      })(d);
    }
    setInterval(function () {
      if (paused || !track.clientWidth) return;
      var next = (curIndex() + 1) % n;
      track.scrollTo({ left: track.clientWidth * next, behavior: "smooth" });
    }, AUTOPLAY_MS);
  }

  ready(function () {
    // Client-side language gate: only show these ads when the browser UI
    // language is exactly Traditional-Chinese-Taiwan. The build-time gate
    // already restricts the pool to the zh-tw site; this further excludes
    // zh-TW-site visitors whose browser isn't set to zh-TW. Otherwise we do
    // nothing and the slot keeps its AdSense + house default.
    if ((navigator.language || "").toLowerCase() !== "zh-tw") return;

    var pool = document.getElementById("ad-product-pool");
    if (!pool) return;

    var slots = document.querySelectorAll(".post-promo-product");
    if (!slots.length) return;

    var content = pool.content || pool;
    var candidates = Array.prototype.slice.call(
      content.querySelectorAll(".ad-product-wrap")
    );

    var today = todayISO();
    var valid = candidates.filter(function (el) {
      var dl = el.getAttribute("data-deadline") || "";
      return dl && today <= dl;          // string compare is safe for YYYY-MM-DD
    });
    if (!valid.length) return;           // no advertiser → leave default

    // Each in-article slot (up to 3) draws its own random product independently.
    slots.forEach(function (slot) {
      var pick = valid[Math.floor(Math.random() * valid.length)];
      var card = pick.firstElementChild; // the <aside class="ad-product-card">
      if (!card) return;
      var wrap = slot.closest(".post-promo-middle");
      slot.innerHTML = "";
      var instance = card.cloneNode(true);
      slot.appendChild(instance);
      slot.hidden = false;
      initCarousel(instance);
      if (wrap) {
        var primary = wrap.querySelector(".post-promo-primary");
        if (primary) primary.hidden = true;
        wrap.classList.add("post-promo-using-product");
      }
    });
  });
})();
