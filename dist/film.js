'use strict';
(() => {
  const canvas = document.querySelector('#film-scratches');
  const context = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, lastY = scrollY, lastScroll = 0;
  let frame = 0, nextPattern = 0, running = false, speed = 0;
  const random = (min, max) => min + Math.random() * (max - min);
  function resize() {
    width = innerWidth; height = innerHeight;
    // CSS-pixel rendering suits the coarse, weathered texture; avoids a
    // full-resolution canvas on high-DPI phones. No image reads or filters.
    canvas.width = width; canvas.height = height;
  }
  function pattern() {
    context.clearRect(0, 0, width, height);
    // Each scroll frame is static damage: no downward translation or drift.
    // Broad variability leaves quiet frames between more distressed flashes.
    const density = Math.random() < .25 ? random(1, 3) : random(4, 10);
    const count = Math.max(1, Math.round(density * Math.min(1, width / 800)));
    const ink = alpha => `rgba(238,237,226,${alpha})`;
    function tear(x, y, size, opacity) {
      context.fillStyle = ink(opacity);
      context.beginPath();
      const points = Math.floor(random(9, 18));
      for (let j = 0; j < points; j++) {
        const angle = j / points * Math.PI * 2;
        const radius = size * random(.25, 1);
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius * random(.25, .8);
        if (j) context.lineTo(px, py); else context.moveTo(px, py);
      }
      context.closePath(); context.fill();
    }
    for (let i = 0; i < count; i++) {
      const fine = Math.random() < .23;
      const patch = !fine && Math.random() < .20;
      const opacity = random(.45, .86);
      let x = random(10, width - 10), y = random(10, height - 10);
      if (patch) {
        const size = random(8, 25);
        tear(x, y, size, opacity);
        for (let f = 0; f < 7; f++) {
          tear(x + random(-size * 2, size * 2), y + random(-size, size), random(1, 4), opacity * random(.4, 1));
        }
        continue;
      }
      let angle = random(-Math.PI, Math.PI);
      const steps = Math.floor(random(5, fine ? 14 : 22));
      const thickness = fine ? random(.5, 1.1) : random(1.8, 6);
      context.lineCap = 'butt'; context.lineJoin = 'bevel';
      for (let j = 0; j < steps; j++) {
        angle += random(-.65, .65);
        const length = random(4, fine ? 16 : 22);
        const nx = x + Math.cos(angle) * length;
        const ny = y + Math.sin(angle) * length;
        if (Math.random() > .23) {
          context.strokeStyle = ink(opacity * random(.55, 1));
          context.lineWidth = thickness * random(.25, 1.25);
          context.beginPath(); context.moveTo(x, y);
          context.quadraticCurveTo(x + random(-8, 8), y + random(-8, 8), nx, ny);
          context.stroke();
          if (!fine && Math.random() < .35) {
            // Splintered emulsion along the tear, including short branches.
            tear(x + random(-5, 5), y + random(-5, 5), random(1, 4), opacity);
            context.lineWidth = random(.5, 1.5);
            context.beginPath(); context.moveTo(x, y);
            context.lineTo(x + random(-16, 16), y + random(-16, 16)); context.stroke();
          }
        }
        x = nx; y = ny;
      }
    }
  }
  function animate(now) {
    const idle = now - lastScroll;
    if (reduced.matches || idle > 180) {
      context.clearRect(0, 0, width, height);
      canvas.style.opacity = '0'; running = false; return;
    }
    if (now >= nextPattern && idle < 110) {
      pattern();
      nextPattern = now + random(65, 135) - Math.min(30, speed * .04);
    }
    canvas.style.opacity = String(Math.max(0, 1 - idle / 180));
    frame = requestAnimationFrame(animate);
  }
  addEventListener('scroll', () => {
    const now = performance.now();
    speed = Math.abs(scrollY - lastY) / Math.max(16, now - lastScroll) * 1000;
    lastY = scrollY;
    if (reduced.matches) return;
    lastScroll = now;
    if (!running) { running = true; nextPattern = 0; frame = requestAnimationFrame(animate); }
  }, {passive:true});
  addEventListener('resize', resize, {passive:true});
  reduced.addEventListener('change', () => {
    cancelAnimationFrame(frame); running = false;
    context.clearRect(0, 0, width, height); canvas.style.opacity = '0';
  });
  resize();
})();

