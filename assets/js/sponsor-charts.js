// /ads/ page chart initialization. Reads window.__sponsorStats (server-rendered
// JSON of site.data.ads_stats) and renders Chart.js charts for the country
// bar, devices doughnut, age doughnut, and gender doughnut.
//
// Bar lists below each chart are SSR'd server-side, so the page is fully
// readable when JS / Chart.js is blocked. This file is a progressive
// enhancement on top.

(function () {
  if (!window.__sponsorStats) return;

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    if (typeof window.Chart === "undefined") {
      // Chart.js failed to load — leave the SSR bar lists as the fallback.
      return;
    }

    var stats  = window.__sponsorStats || {};
    var labels = window.__sponsorLabels || {};
    var css    = getComputedStyle(document.documentElement);
    var accent = (css.getPropertyValue("--accent") || "#b14e2c").trim();
    var ink900 = (css.getPropertyValue("--ink-900") || "#1d1813").trim();
    var ink500 = (css.getPropertyValue("--ink-500") || "#6b5e51").trim();
    var rule   = (css.getPropertyValue("--rule")    || "rgba(29,24,19,0.12)").trim();

    Chart.defaults.color = ink500;
    Chart.defaults.borderColor = rule;
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', 'Noto Sans CJK TC', sans-serif";

    // Generate a soft palette anchored on --accent for charts that need
    // multiple colors (doughnuts mostly).
    var palette = [
      accent,
      "#d6885f", // accent-soft
      "#1d1813", // ink-900
      "#6b5e51", // ink-500
      "#b3a999", // ink-300
      "#ddc9a8", // cream-300
      "#f6efe4", // cream-100
      "#1ab6c1"  // a teal we already use for KKday-affiliate eyebrows
    ];

    // ---------- Countries (horizontal bar) ----------
    var canvasC = document.querySelector("[data-chart=\"countries\"]");
    if (canvasC && stats.countries && stats.countries.length) {
      var rows = stats.countries.slice().reverse(); // bottom-up so top-1 is at the top
      new Chart(canvasC, {
        type: "bar",
        data: {
          labels: rows.map(function (r) { return r.country; }),
          datasets: [{
            data: rows.map(function (r) { return r.users; }),
            backgroundColor: accent,
            borderRadius: 2
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  var r = rows[ctx.dataIndex];
                  return r.users.toLocaleString() + " · " + r.pct + "%";
                }
              }
            }
          },
          scales: {
            x: { grid: { color: rule }, ticks: { color: ink500 } },
            y: { grid: { display: false }, ticks: { color: ink500 } }
          }
        }
      });
    }

    // ---------- Language sites (doughnut) ----------
    var canvasL = document.querySelector("[data-chart=\"langsites\"]");
    if (canvasL && stats.langSites && stats.langSites.length) {
      var lrows = stats.langSites;
      var lsLabels = labels.langsites || {};
      var lLabelsArr = lrows.map(function (r) {
        return lsLabels[r.code] || r.host || r.code;
      });
      new Chart(canvasL, {
        type: "doughnut",
        data: {
          labels: lLabelsArr,
          datasets: [{
            data: lrows.map(function (r) { return r.users; }),
            backgroundColor: palette,
            borderColor: "transparent",
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 10, color: ink500, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  var r = lrows[ctx.dataIndex];
                  return lLabelsArr[ctx.dataIndex] + ": " + r.users.toLocaleString() + " · " + r.pct + "%";
                }
              }
            }
          },
          cutout: "60%"
        }
      });
    }

    // ---------- Devices (doughnut) ----------
    var canvasD = document.querySelector("[data-chart=\"devices\"]");
    if (canvasD && stats.devices && stats.devices.length) {
      new Chart(canvasD, {
        type: "doughnut",
        data: {
          labels: stats.devices.map(function (r) { return r.device; }),
          datasets: [{
            data: stats.devices.map(function (r) { return r.users; }),
            backgroundColor: palette,
            borderColor: "transparent",
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 12, color: ink500 } },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  var r = stats.devices[ctx.dataIndex];
                  return r.device + ": " + r.users.toLocaleString() + " · " + r.pct + "%";
                }
              }
            }
          },
          cutout: "62%"
        }
      });
    }

    // ---------- Age (doughnut) ----------
    var canvasA = document.querySelector("[data-chart=\"age\"]");
    if (canvasA && stats.age && stats.age.available && stats.age.rows && stats.age.rows.length) {
      var arows = stats.age.rows;
      new Chart(canvasA, {
        type: "doughnut",
        data: {
          labels: arows.map(function (r) { return r.bucket; }),
          datasets: [{
            data: arows.map(function (r) { return r.users; }),
            backgroundColor: palette,
            borderColor: "transparent",
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 10, color: ink500, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  var r = arows[ctx.dataIndex];
                  return r.bucket + ": " + r.users.toLocaleString() + " · " + r.pct + "%";
                }
              }
            }
          },
          cutout: "60%"
        }
      });
    }

    // ---------- Gender (doughnut) ----------
    var canvasG = document.querySelector("[data-chart=\"gender\"]");
    if (canvasG && stats.gender && stats.gender.available && stats.gender.rows && stats.gender.rows.length) {
      var grows = stats.gender.rows;
      var glabels = grows.map(function (r) {
        if (r.gender === "male")   return labels.male   || "Male";
        if (r.gender === "female") return labels.female || "Female";
        return labels.unknown || r.gender;
      });
      new Chart(canvasG, {
        type: "doughnut",
        data: {
          labels: glabels,
          datasets: [{
            data: grows.map(function (r) { return r.users; }),
            backgroundColor: [accent, "#1ab6c1", ink500],
            borderColor: "transparent",
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 12, color: ink500 } },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  var r = grows[ctx.dataIndex];
                  return glabels[ctx.dataIndex] + ": " + r.users.toLocaleString() + " · " + r.pct + "%";
                }
              }
            }
          },
          cutout: "62%"
        }
      });
    }
  });
})();
