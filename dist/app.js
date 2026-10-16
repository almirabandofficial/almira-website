'use strict';
(() => {
  const data = window.ALMIRA;
  const intro = document.querySelector('.intro');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  // Exact pixel chroma key: white ink has green=255; magenta has green=0.
  // This preserves the supplied geometry and distress, including antialiasing.
  // The original file remains untouched. The mask is computed once at load.
  const artwork = new Image();
  artwork.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = artwork.naturalWidth; canvas.height = artwork.naturalHeight;
    const context = canvas.getContext('2d', {willReadFrequently:true});
    context.drawImage(artwork, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const coverage = pixels.data[i + 1] / 255;
      pixels.data[i + 3] = Math.round(pixels.data[i + 3] * coverage);
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 255;
    }
    context.putImageData(pixels, 0, 0);
    root.style.setProperty('--rune-mask', `url("${canvas.toDataURL('image/png')}")`);
    document.querySelector('#rune').dataset.loaded = 'true';
  };
  artwork.onerror = () => { document.querySelector('#rune').hidden = true; };
  artwork.src = data.rune;

  let pending = false;
  function updateIntro() {
    pending = false;
    if (reduceMotion.matches) return;
    const stageHeight = document.querySelector('.intro-stage').clientHeight;
    // 154svh container - 100svh stage = 54svh travel, down from 108svh.
    // This halves physical travel while preserving the same scroll curve.
    const distance = Math.max(1, intro.offsetHeight - stageHeight);
    const traveled = -intro.getBoundingClientRect().top;
    const position = Math.max(0, Math.min(1, traveled / distance));
    // The first 8% holds the sharp rune. The transformation ends at 78%,
    // leaving 22% of the sticky distance for a quiet, centered title hold.
    // Change these two bounds or .intro height to tune cinematic pacing.
    const linear = Math.max(0, Math.min(1, (position - .08) / .70));
    // Smoothstep is a direct function of scroll, never a triggered timeline:
    // reversing the scroll restores the exact same opacity/focus values.
    const eased = linear * linear * (3 - 2 * linear);
    root.style.setProperty('--intro-progress', eased.toFixed(5));
    // Location focus trails by a small fraction of the same scroll curve.
    // Both lines finish inside the existing title hold; no time-based trigger.
    const locationFocus = Math.max(0, Math.min(1, (eased - .06) / .94));
    root.style.setProperty('--location-progress', locationFocus.toFixed(5));
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(updateIntro); } }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule, {passive:true});

  reduceMotion.addEventListener('change', schedule);
  updateIntro();

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function safeURL(value) {
    try { const url = new URL(value, location.href); return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null; } catch { return null; }
  }
  function media(items, id) {
    if (!items.length) return;
    const list = element('div', undefined, 'media-list');
    items.forEach(item => {
      const url = safeURL(item.url);
      if (!url) return;
      const link = element('a', item.title + ' ↗'); link.href = url; list.append(link);
    });
    if (list.childElementCount) document.querySelector(id).replaceChildren(list);
  }
  media(data.music, '#music-content'); media(data.videos, '#videos-content');
  if (data.youtubeChannel && safeURL(data.youtubeChannel)) {
    const channel = element('a', 'VISIT OUR YOUTUBE CHANNEL →', 'announcement video-channel');
    channel.href = safeURL(data.youtubeChannel);
    channel.target = '_blank'; channel.rel = 'noopener noreferrer';
    document.querySelector('#videos-content').replaceChildren(channel);
  }
  document.querySelector('#biography').textContent = data.biography;
  document.querySelector('.biography .eyebrow').hidden = !data.biographyIsPlaceholder;
  if (data.shows.length) {
    const list = element('ul', undefined, 'show-list');
    data.shows.forEach(show => {
      const row = element('li', undefined, 'show-row');
      const date = element('time', show.date); date.dateTime = show.date;
      row.append(date, element('span', show.venue), element('span', `${show.city} / ${show.state}`), element('span', show.time));
      list.append(row);
    });
    document.querySelector('#shows-content').replaceChildren(list);
  }
  if (data.merchandise.length) {
    const list = element('div', undefined, 'product-list');
    data.merchandise.forEach(product => {
      const url = safeURL(product.url); if (!url) return;
      const card = element('a'); card.href = url;
      const img = element('img'); img.src = product.image; img.alt = product.name; img.loading = 'lazy';
      card.append(img, element('h3', product.name), element('p', product.price)); list.append(card);
    });
    if (list.childElementCount) document.querySelector('#merch-content').replaceChildren(list);
  }
  if (data.contact) {
    const instagram = element('a', data.contact.instagram.label);
    instagram.href = safeURL(data.contact.instagram.url);
    instagram.target = '_blank'; instagram.rel = 'noopener noreferrer';
    const email = element('a', data.contact.email);
    email.href = `mailto:${data.contact.email}`;
    const socialRow = element('p', 'Instagram: ', 'contact-row');
    const emailRow = element('p', 'Email: ', 'contact-row');
    socialRow.append(instagram); emailRow.append(email);
    document.querySelector('#contact-content').replaceChildren(socialRow, emailRow);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = document.querySelector(`nav a[href="#${entry.target.id}"]`);
      if (entry.isIntersecting) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, {rootMargin:'-20% 0px -40% 0px'});
  document.querySelectorAll('.content-section').forEach(section => observer.observe(section));
})();






