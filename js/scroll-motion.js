/* Scroll motion layer: reveals, progress bar and light parallax. No dependencies. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  root.classList.add('sm-js');

  // selector -> reveal offsets. alt = alternate left/right by index.
  var REVEALS = [
    ['.skill-mf p',          { x: -30 }],
    ['.about-info li',       { x: -30 }],
    ['.resume-wrap',         { alt: 60 }],
    ['.proj-card',           { y: 40, s: 0.96 }],
    ['.contact-info .box',   { y: 40, s: 0.94 }]
  ];
  var STAGGER_MS = 110, STAGGER_COLS = 3;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('sm-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  REVEALS.forEach(function (r) {
    document.querySelectorAll(r[0]).forEach(function (el, i) {
      var o = r[1], x = o.alt ? (i % 2 ? o.alt : -o.alt) : (o.x || 0);
      el.classList.add('sm-reveal');
      el.style.setProperty('--sm-x', x + 'px');
      el.style.setProperty('--sm-y', (o.y || 0) + 'px');
      el.style.setProperty('--sm-s', o.s || 1);
      el.style.setProperty('--sm-d', (i % STAGGER_COLS) * STAGGER_MS + 'ms');
      io.observe(el);
    });
  });

  // progress bar + parallax, batched in one rAF
  var bar = document.createElement('div');
  bar.className = 'sm-progress';
  document.body.appendChild(bar);
  var heroText = document.querySelector('.hero .text');
  var bigHeads = document.querySelectorAll('.heading-section h1.big');
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.pageYOffset, vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (heroText && y < vh) {
      heroText.style.transform = 'translate3d(0,' + (y * 0.2) + 'px,0)';
      heroText.style.opacity = Math.max(0, 1 - y / (vh * 0.8));
    }
    bigHeads.forEach(function (h) {
      var r = h.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var d = (r.top + r.height / 2 - vh / 2) * -0.1;
      h.style.transform = 'translate3d(' + d + 'px,0,0)';
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
