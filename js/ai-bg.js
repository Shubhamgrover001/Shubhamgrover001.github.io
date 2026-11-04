/* Neural-network background: drifting nodes, forward-propagating yellow pulses,
   falling code glyphs and cursor interaction. Canvas 2D, no dependencies. */
(function () {
  var canvas = document.querySelector('.ai-bg');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var section = canvas.parentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var YELLOW = '255,189,57', BLUE = '120,170,255';
  var GLYPHS = ['0', '1', 'AI', '{ }', '</>', 'PASS', '200', 'LLM', 'QA', 'SQL', 'ML', 'assert'];

  var W = 0, H = 0, dpr = 1, layers = [], edges = [], pulses = [], glyphs = [];
  var mouse = { x: -999, y: -999 }, running = false, visible = true, last = 0;

  function build() {
    var r = section.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var cols = W < 600 ? 4 : W < 1000 ? 6 : 8;
    var rows = H < 320 ? 4 : 6;
    layers = []; edges = []; pulses = [];
    for (var c = 0; c < cols; c++) {
      var layer = [], n = rows - (c === 0 || c === cols - 1 ? 2 : (c % 2 ? 0 : 1));
      for (var k = 0; k < n; k++) {
        var bx = (c + 0.5) / cols * W, by = (k + 0.5) / n * H;
        layer.push({ bx: bx, by: by, x: bx, y: by, ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.6,
                     amp: 8 + Math.random() * 14, glow: 0, out: [] });
      }
      layers.push(layer);
    }
    for (var l = 0; l < layers.length - 1; l++) {
      layers[l].forEach(function (a) {
        layers[l + 1].forEach(function (b) {
          if (Math.random() < 0.6) { var e = { a: a, b: b }; edges.push(e); a.out.push(e); }
        });
      });
    }
    glyphs = [];
    var gn = Math.round(W / 70);
    for (var g = 0; g < gn; g++) glyphs.push(newGlyph(true));
  }

  function newGlyph(scatter) {
    return { x: Math.random() * W, y: scatter ? Math.random() * H : -20, v: 14 + Math.random() * 30,
             t: GLYPHS[(Math.random() * GLYPHS.length) | 0], a: 0.14 + Math.random() * 0.18, s: 10 + Math.random() * 6 };
  }

  function spawnPulse() {
    if (!layers.length) return;
    var first = layers[0][(Math.random() * layers[0].length) | 0];
    if (first.out.length) pulses.push({ e: first.out[(Math.random() * first.out.length) | 0], p: 0, v: 0.55 + Math.random() * 0.5 });
  }

  function frame(ts) {
    if (!running) return;
    var dt = Math.min((ts - last) / 1000, 0.05); last = ts;
    update(dt, ts / 1000); draw();
    requestAnimationFrame(frame);
  }

  function update(dt, t) {
    layers.forEach(function (layer) { layer.forEach(function (n) {
      n.x = n.bx + Math.sin(t * n.sp + n.ph) * n.amp;
      n.y = n.by + Math.cos(t * n.sp * 0.8 + n.ph) * n.amp;
      var dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
      var near = d < 150 ? 1 - d / 150 : 0;
      n.glow = Math.max(n.glow - dt * 1.6, near * 0.9);
    }); });
    if (Math.random() < dt * 3.2 && pulses.length < 28) spawnPulse();
    for (var i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i]; p.p += dt * p.v;
      if (p.p >= 1) {
        p.e.b.glow = 1;
        var nxt = p.e.b.out;
        if (nxt.length) { p.e = nxt[(Math.random() * nxt.length) | 0]; p.p = 0; } else pulses.splice(i, 1);
      }
    }
    glyphs.forEach(function (g, i) { g.y += g.v * dt; if (g.y > H + 20) glyphs[i] = newGlyph(false); });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.font = '12px ui-monospace, Consolas, monospace'; ctx.textAlign = 'center';
    glyphs.forEach(function (g) { ctx.fillStyle = 'rgba(' + BLUE + ',' + g.a + ')'; ctx.font = g.s + 'px ui-monospace, Consolas, monospace'; ctx.fillText(g.t, g.x, g.y); });

    ctx.lineWidth = 1;
    edges.forEach(function (e) {
      var g = Math.max(e.a.glow, e.b.glow);
      ctx.strokeStyle = 'rgba(' + BLUE + ',' + (0.2 + g * 0.4) + ')';
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    });

    pulses.forEach(function (p) {
      var x = p.e.a.x + (p.e.b.x - p.e.a.x) * p.p, y = p.e.a.y + (p.e.b.y - p.e.a.y) * p.p;
      var tx = p.e.a.x + (p.e.b.x - p.e.a.x) * Math.max(p.p - 0.18, 0), ty = p.e.a.y + (p.e.b.y - p.e.a.y) * Math.max(p.p - 0.18, 0);
      var gr = ctx.createLinearGradient(tx, ty, x, y);
      gr.addColorStop(0, 'rgba(' + YELLOW + ',0)'); gr.addColorStop(1, 'rgba(' + YELLOW + ',0.95)');
      ctx.strokeStyle = gr; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = 'rgba(' + YELLOW + ',1)'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 6.283); ctx.fill();
    });

    layers.forEach(function (layer) { layer.forEach(function (n) {
      var r = 4 + n.glow * 4;
      if (n.glow > 0.02) {
        var gr = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4.5);
        gr.addColorStop(0, 'rgba(' + YELLOW + ',' + (0.55 * n.glow) + ')'); gr.addColorStop(1, 'rgba(' + YELLOW + ',0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(n.x, n.y, r * 4.5, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = n.glow > 0.3 ? 'rgb(' + YELLOW + ')' : 'rgba(' + BLUE + ',0.85)';
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(n.x, n.y, r + 3, 0, 6.283); ctx.stroke();
    }); });

    if (mouse.x > 0) {   // cursor "probe" ring
      ctx.strokeStyle = 'rgba(' + YELLOW + ',0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 22, 0, 6.283); ctx.stroke();
    }
  }

  function start() { if (running || reduce || !visible || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }

  build();
  if (reduce) { update(0, 0); draw(); }
  else {
    for (var i = 0; i < 6; i++) spawnPulse();
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0.01 }).observe(section);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    section.addEventListener('mousemove', function (e) { var r = section.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    section.addEventListener('mouseleave', function () { mouse.x = mouse.y = -999; });
    start();
  }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); if (reduce) { update(0, 0); draw(); } }, 150); });
})();
