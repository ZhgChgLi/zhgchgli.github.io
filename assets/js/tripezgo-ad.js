// TripEZGo 廣告卡（_includes/tripezgo-ad-card.html）：每個版位隨機打開三則裡的一則。
// 沒有 JS 時第一則本來就沒有 hidden，照樣看得到。
(function () {
  document.querySelectorAll("[data-tripezgo-ads]").forEach(function (box) {
    var ads = box.querySelectorAll(".active-hero");
    if (ads.length < 2) return;
    var pick = Math.floor(Math.random() * ads.length);
    ads.forEach(function (a, i) { a.hidden = i !== pick; });
  });
})();
