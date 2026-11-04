/* Count-up numbers: every .number counts 0 -> data-number each time it scrolls into view,
   and resets to 0 when it leaves, so it replays on every visit. No dependencies. */
(function () {
  var els = document.querySelectorAll('.number[data-number]');
  if (!els.length) return;
  var DURATION = 3500;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };   // easeOutCubic

  function stop(el) { if (el._raf) { cancelAnimationFrame(el._raf); el._raf = null; } }

  function run(el) {
    var target = parseFloat(el.getAttribute('data-number')) || 0;
    stop(el);
    if (reduce) { el.textContent = fmt(target); return; }
    var start = performance.now();
    (function tick(now) {
      var t = Math.min((now - start) / DURATION, 1);
      el.textContent = fmt(target * ease(t));
      if (t < 1) el._raf = requestAnimationFrame(tick); else el._raf = null;
    })(start);
  }

  function reset(el) { stop(el); el.textContent = '0'; }

  els.forEach(reset);
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.isIntersecting ? run(e.target) : reset(e.target); });
  }, { threshold: 0.6 });
  els.forEach(function (el) { io.observe(el); });
})();
