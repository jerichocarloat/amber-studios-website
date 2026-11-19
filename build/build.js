#!/usr/bin/env node
/* Static site generator for the Amber Studios website.
   Usage: node build/build.js [--img-src <dir with <id>-<w>.webp files>]
   Pages are rendered into the repository root; images are copied into assets/img. */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./content');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const imgSrcIdx = argv.indexOf('--img-src');
const IMG_SRC = imgSrcIdx > -1 ? path.resolve(argv[imgSrcIdx + 1]) : null;

/* ------------------------------------------------------------------ icons */
const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICON = {
  arrowUpRight: I('<path d="M7 17 17 7M8 7h9v9"/>'),
  arrowDown: I('<path d="M12 5v14M5 12l7 7 7-7"/>'),
  arrowUp: I('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  arrowRight: I('<path d="M5 12h14M13 5l7 7-7 7"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  mapPin: I('<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  map: I('<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z"/><path d="M9 4v14M15 6v14"/>'),
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5Z"/></svg>',
  users: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4.5-6.2"/>'),
  bed: I('<path d="M3 18V8M3 12h18v6M3 16h18"/><path d="M6 12V9.5A1.5 1.5 0 0 1 7.5 8h3A1.5 1.5 0 0 1 12 9.5V12"/>'),
  ruler: I('<path d="M3 15.5 15.5 3 21 8.5 8.5 21 3 15.5Z"/><path d="m7 12 2 2M10 9l2 2M13 6l2 2"/>'),
  wifi: I('<path d="M2.5 9a15 15 0 0 1 19 0M5.5 12.5a10.5 10.5 0 0 1 13 0M8.5 16a6 6 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>'),
  kitchen: I('<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6Z"/><path d="M2 10h20M9 10V6M15 10V6M12 10V4"/>'),
  wind: I('<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7a2.5 2.5 0 1 1-2.5 2.5"/>'),
  tv: I('<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>'),
  lock: I('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor"/>'),
  coffee: I('<path d="M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z"/><path d="M16 11h2a2 2 0 1 1 0 4h-2M7 5.5c0-1 1-1 1-2M11 5.5c0-1 1-1 1-2"/>'),
  shower: I('<path d="M4 20V8a4 4 0 0 1 8 0"/><path d="M8 10h12a6 6 0 0 0-12 0Z"/><path d="M10 14v1M14 14v1M18 14v1M12 17v1M16 17v1"/>'),
  key: I('<circle cx="8" cy="15" r="4.5"/><path d="m11.5 11.5 8-8M17 6l2.5 2.5M14.5 8.5 17 11"/>'),
  headset: I('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19a3 3 0 0 1-3 3h-3"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
  shield: I('<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6L12 3Z"/><path d="m9 12 2 2 4-4.5"/>'),
  sparkles: I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/><circle cx="12" cy="12" r="2.5"/>'),
  piggy: I('<path d="M5 11a6 6 0 0 1 6-6h3a5 5 0 0 1 5 5v1l2 .5v3l-2 .5a5 5 0 0 1-2 2.5V20h-3v-2h-3v2H8v-3a6 6 0 0 1-3-5Z"/><path d="M2.5 11.5 5 11M9 5V3.5"/><circle cx="15" cy="10" r=".8" fill="currentColor"/>'),
  badge: I('<path d="m12 2.5 2.2 1.8 2.8-.3 1 2.6 2.5 1.4-.6 2.8 1.6 2.3-1.9 2.1.2 2.8-2.7.9-1.3 2.5-2.8-.6L12 22l-2.3-1.2-2.8.6-1.3-2.5-2.7-.9.2-2.8L1.2 13l1.6-2.3-.6-2.8 2.5-1.4 1-2.6 2.8.3L12 2.5Z"/><path d="m9 12 2 2 4-4.5"/>'),
  car: I('<path d="M5 16v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6l2.5-6h15L22 12v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2"/><path d="M2 12h20M6.5 16h.01M17.5 16h.01"/>'),
  laundry: I('<rect x="4" y="2.5" width="16" height="19" rx="2"/><circle cx="12" cy="13.5" r="4.5"/><path d="M8 6h.01M11 6h2M8.5 14.5a3.5 3.5 0 0 0 7-2"/>'),
  bike: I('<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17 9 9h6l3.5 8M9 9h5.5M12 17l3-8M14 5h2.5"/>'),
  ticket: I('<path d="M3 9V6h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4Z"/><path d="M13 6v10"/>'),
  parking: I('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4.5a3 3 0 0 1 0 6H9"/>'),
  luggage: I('<rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 20v1.5M15 20v1.5M9 11v5M15 11v5"/>'),
  baby: I('<circle cx="12" cy="8" r="4"/><path d="M6 21a6 6 0 0 1 12 0M10 8h.01M14 8h.01M10.5 10.5a2 2 0 0 0 3 0M12 2.5c1 .5 1.5 1.2 1.5 2"/>'),
  noSmoke: I('<path d="M2 20h14v-4H2zM19 16h3v4h-3zM19 11.5a3 3 0 0 0-3-3M22 11.5a6 6 0 0 0-6-6M3 3l18 18"/>'),
  tree: I('<path d="M12 3 6 12h3l-3 5h12l-3-5h3L12 3Z"/><path d="M12 17v4"/>'),
  elevator: I('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18M7 10l1.5-2 1.5 2M7 14l1.5 2 1.5-2M14.5 8h1.5M14.5 16h1.5"/>'),
  building: I('<rect x="4" y="3" width="12" height="18" rx="1.5"/><path d="M16 9h3a1 1 0 0 1 1 1v11M8 7h2M8 11h2M8 15h2M12 7h.01M12 11h.01M12 15h.01M9 21v-3h3v3"/>'),
  check: I('<path d="m5 12 4.5 4.5L19 7"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  chat: I('<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12Z"/>'),
  facebook: I('<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z"/>'),
  external: I('<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  percent: I('<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'),
  tag: I('<path d="M3 11V4h7l10 10-7 7L3 11Z"/><circle cx="7.5" cy="8.5" r="1.2" fill="currentColor"/>'),
  calendar: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  train: I('<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M9 21l1.5-3h3L15 21M8.5 15h.01M15.5 15h.01"/>'),
  plane: I('<path d="M2 16.5 21 9l-2.5 6-7.5 3-1 3-2-3.5L4 18l-2-1.5ZM21 9l-6.5-5.5"/>'),
  walk: I('<circle cx="13" cy="4" r="1.8"/><path d="m9.5 21 2-7-2.5-2 .8-4 3.2-1.2 2.5 3 3 .7M9.8 12.5 7 21M12 9l-4 2"/>'),
  utensils: I('<path d="M6 3v7a3 3 0 0 0 6 0V3M9 3v18M17 3c-1.5 1-2.5 4-2.5 7.5 0 2 .5 2.5 2.5 2.5v8"/>'),
  shop: I('<path d="M4 9 5.5 4h13L20 9M4 9h16v2.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0V9ZM5 13v8h14v-8M10 21v-5h4v5"/>'),
  camera: I('<path d="M4 8h3l2-3h6l2 3h3v12H4V8Z"/><circle cx="12" cy="13" r="3.5"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
};
const WREATH_L = `<svg viewBox="0 0 14 34" fill="currentColor" aria-hidden="true"><path d="M12.5 1.2c-1.6 2.3-2.2 4.7-1.8 7.1 1.9-1.4 2.9-3.8 1.8-7.1ZM9.4 6.1C7.8 8.6 7.6 11 8.3 13.4c1.9-1.7 2.5-4.3 1.1-7.3ZM7.1 11.4c-1.3 2.7-1 5.2 0 7.4 1.6-2 1.8-4.6 0-7.4ZM6 17.2c-.9 2.9-.2 5.3 1.2 7.4 1.2-2.3 1-4.9-1.2-7.4ZM6.3 23.3c-.3 3 .9 5.2 2.8 6.9.7-2.5 0-5-2.8-6.9ZM.8 5.5c.8 2.8 2.6 4.5 4.9 5.4-.1-2.5-1.9-4.6-4.9-5.4ZM.3 11.3c1.3 2.6 3.4 3.9 5.9 4.3-.6-2.5-2.8-4.1-5.9-4.3ZM.6 17.1c1.8 2.3 4.1 3.2 6.6 3.1-1.1-2.3-3.5-3.5-6.6-3.1ZM2 22.7c2.2 1.9 4.6 2.3 7.1 1.7-1.5-2-4.1-2.7-7.1-1.7ZM4.6 27.6c2.6 1.4 5 1.2 7.3 0-1.9-1.6-4.6-1.7-7.3 0Z"/></svg>`;
const WREATH_R = WREATH_L.replace('<svg ', '<svg class="flip" ');

/* ------------------------------------------------------------------ helpers */
const esc = (s) => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function img(name, alt, opts = {}) {
  if (!C.IMAGES[name]) throw new Error('Unknown image: ' + name);
  const sizes = opts.sizes || '(max-width: 767px) 100vw, 50vw';
  const base = `assets/img/${name}`;
  const loading = opts.eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"';
  return `<img src="${base}-1000.webp" srcset="${base}-600.webp 600w, ${base}-1000.webp 1000w, ${base}-1600.webp 1600w" sizes="${sizes}" alt="${esc(alt)}" ${loading}${opts.attrs ? ' ' + opts.attrs : ''}>`;
}
const caption = (text, dark) => `<span class="caption${dark ? ' on-dark' : ''}"><span class="dot"></span>${esc(text)}</span>`;
const btn = (label, href, { white = false, external = false, cls = '' } = {}) =>
  `<a class="btn${white ? ' btn--white' : ''}${cls ? ' ' + cls : ''}" href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}><span class="btn__icon">${ICON.arrowUpRight}</span><span class="btn__text">${esc(label)}</span></a>`;
const btnSm = (label, href, { outline = false, external = false } = {}) =>
  `<a class="btn-sm${outline ? ' btn-sm--outline' : ''}" href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${esc(label)}</a>`;
const isExternal = (href) => /^https?:/.test(href);
const sectionHead = ({ cap, title, cta, lead, left = false, dark = false, ctaLabel, ctaHref }) => `
  <div class="section-head${left ? ' section-head--left' : ''}${dark ? ' on-dark' : ''}">
    <div class="caption-h2">
      ${caption(cap, dark)}
      <h2 class="h2 split-words">${esc(title)}</h2>
      ${lead ? `<p class="lead split-blur" style="max-width:560px">${esc(lead)}</p>` : ''}
    </div>
    ${cta ? cta : (ctaLabel ? btn(ctaLabel, ctaHref || C.BOOKING, { white: dark, external: isExternal(ctaHref || C.BOOKING) }) : '')}
  </div>`;

/* ------------------------------------------------------------------ shell */
const LOGO_MARK = fs.readFileSync(path.join(ROOT, 'assets/logo/mark.svg'), 'utf8').replace(/\n\s*/g, '').replace('<svg ', '<svg class="logo-mark" ');
const LOGO_MARK_WHITE = fs.readFileSync(path.join(ROOT, 'assets/logo/mark-line.svg'), 'utf8').replace(/\n\s*/g, '');

function head({ title, description, path: p, extraHead = '' }) {
  const full = p === 'index.html' ? 'Amber Studios – Studio apartments in the heart of Budapest' : `${title} – Amber Studios Budapest`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:image" content="assets/img/hero-home-1600.webp">
<meta name="theme-color" content="#ffffff">
<link rel="icon" type="image/svg+xml" href="assets/logo/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500&display=swap">
<link rel="stylesheet" href="assets/css/style.css">
${extraHead}
</head>
<body id="top">
<a class="skip" href="#main">Skip to content</a>
`;
}

function nav() {
  const items = C.NAV.map((n) => `
        <a class="menu__item" href="${n.href}"><strong>${esc(n.title)}</strong><span>${esc(n.sub)}</span><span class="arr">${ICON.arrowUpRight}</span></a>`).join('');
  return `
      <nav class="nav" aria-label="Main">
        <a class="nav__logo" href="index.html" aria-label="Amber Studios – home">${LOGO_MARK}<span>Amber Studios</span></a>
        <div class="nav__buttons">
          <a class="icon-btn" href="${C.COMPANY.phoneHref}" aria-label="Call ${C.COMPANY.phone}">${ICON.phone}</a>
          <button class="icon-btn nav__burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><span class="lines"><span class="line"></span><span class="line"></span><span class="line"></span></span></button>
        </div>
        <div class="menu" id="menu">
          <div class="menu__items">${items}
          </div>
          <a class="menu__cta" href="${C.BOOKING}" target="_blank" rel="noopener">${img('lg-gv-2', 'Large Studio Gardenview at Amber Studios', { sizes: '640px' })}<span>Book now</span>${ICON.arrowUpRight}</a>
        </div>
      </nav>
      <div class="menu-backdrop"></div>`;
}

function offer({ title = 'Direct booking 25% cheaper than on other websites', cap = 'Direct booking', image = 'lg-gv-2', cta = 'Book now', href = C.BOOKING } = {}) {
  return `
  <section class="section offer" aria-label="${esc(cap)}">
    <div class="container">
      <div class="offer__box">
        ${img(image, 'Amber Studios Budapest', { sizes: '100vw', attrs: 'data-parallax="0.12"' })}
        <div class="caption-h2 on-dark">${caption(cap, true)}<h2 class="h2 split-words">${esc(title)}</h2></div>
        ${btn(cta, href, { white: true, external: isExternal(href) })}
      </div>
    </div>
  </section>`;
}

function footer() {
  const col = (label, links) => `
          <div class="footer__col">
            <span class="small">${label}</span>
            <ul>${links.map((l) => `<li><a href="${l.href}"${isExternal(l.href) ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a></li>`).join('')}</ul>
          </div>`;
  return `
  <footer class="section--dark footer on-dark" id="footer">
    <div class="container">
      <div class="content">
        <div class="footer__top">
          <div class="footer__cta">
            <div class="caption-h2">
              ${caption('Your stay', true)}
              <h2 class="h2 split-words">We answer guests’ questions 24/7</h2>
              <p class="lead split-blur" style="max-width:480px">Reception daily 9:00–19:00 at Veres Pálné utca 26, plus a 24/7 online reception with a well-trained AI assistant.</p>
            </div>
            ${btn('Book now', C.BOOKING, { white: true, external: true })}
          </div>
          <div class="footer__cols">
            ${col('Menu', [
              { label: 'Studios', href: 'studios.html' }, { label: 'Gardenview', href: 'gardenview.html' }, { label: 'Terrace', href: 'terrace.html' },
              { label: 'Services', href: 'services.html' }, { label: 'Restaurants', href: 'restaurants.html' }, { label: 'FAQ', href: 'faq.html' },
            ])}
            ${col('Explore', [
              { label: 'Attractions', href: 'attractions.html' }, { label: 'Budapest tips', href: 'budapest-tips.html' }, { label: 'Shopping tips', href: 'shopping-tips.html' },
              { label: 'About us', href: 'about.html' }, { label: 'Contact', href: 'contact.html' },
            ])}
            <div class="footer__col footer__col--stack">
              ${col('Contact', [
                { label: C.COMPANY.email, href: 'mailto:' + C.COMPANY.email }, { label: C.COMPANY.phone, href: C.COMPANY.phoneHref },
                { label: 'WhatsApp', href: C.WHATSAPP }, { label: 'Facebook', href: C.FACEBOOK },
              ])}
            </div>
          </div>
        </div>
        <div class="footer__bottom">
          <div class="footer__legal">
            <span>© Amber Studios Kft., <span data-year>2026</span> · Veres Pálné u. 26., 1053 Budapest</span>
            <div class="links">
              <a href="imprint.html">Imprint</a><a href="privacy-policy.html">Privacy policy</a><a href="gtc.html">GTC</a>
              <a class="to-top" href="#top">Back to Top ${ICON.arrowUp}</a>
            </div>
          </div>
        </div>
      </div>
      <div class="biglogo" aria-hidden="true">
        ${img('street-trees', '', { sizes: '100vw', attrs: 'class="bg"' })}
        <div class="wordmark"><svg viewBox="0 0 1560 230" fill="none" aria-hidden="true">
          <g transform="translate(0 15) scale(3.1)">${LOGO_MARK_WHITE.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor">', '<g fill="currentColor">').replace('</svg>', '</g>')}</g>
          <text x="230" y="178" font-family="Figtree, system-ui, sans-serif" font-size="200" font-weight="500" letter-spacing="-6" fill="currentColor">Amber <tspan font-weight="400" fill-opacity=".8">Studios</tspan></text>
        </svg></div>
      </div>
    </div>
  </footer>
  <script src="assets/js/main.js" defer></script>
  <script id="respondio__growth_tool" src="https://cdn.respond.io/widget/widget.js?wId=2b9e4c75-b8ee-40a5-9daf-ec8e8d475d11" defer></script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ shared blocks */
function pageHero({ cap, title, lead, image, imageAlt, cta, ctaHref, tag }) {
  return `
  <header class="hero hero--page">
    <div class="container">
      <div class="hero__content">
        <div class="hero__info">
          ${nav()}
          <div class="hero__offer">
            <div class="hero__pilltext">
              ${tag ? `<span class="tag" data-appear style="--delay:.1s">${ICON.mapPin}${esc(tag)}</span>` : caption(cap)}
              <h1 class="h1 split-words">${esc(title)}</h1>
            </div>
            ${lead ? `<p class="lead hero__lead split-blur">${esc(lead)}</p>` : ''}
            ${cta ? `<div data-appear style="--delay:.6s">${btn(cta, ctaHref || C.BOOKING, { external: isExternal(ctaHref || C.BOOKING) })}</div>` : ''}
          </div>
        </div>
        <div class="hero__image" data-appear="fade" style="--delay:.2s">
          <div data-appear="zoom" style="position:absolute;inset:0">${img(image, imageAlt || title, { sizes: '(max-width: 1199px) 100vw, 50vw', eager: true })}</div>
        </div>
      </div>
    </div>
  </header>
  <main id="main">`;
}

const studioCard = (s, i = 0) => `
      <article class="studio-card" data-appear="scale" style="--delay:${(i * 0.08).toFixed(2)}s">
        <a class="studio-card__img reveal-img" href="${s.slug}.html" aria-label="${esc(s.name)}">${img(s.images[0], s.name, { sizes: '(max-width: 767px) 100vw, 33vw' })}</a>
        <div class="studio-card__body">
          <div class="studio-card__row">
            <div><span class="small">${s.property === 'gardenview' ? 'Amber Gardenview · Veres Pálné utca 26' : 'Amber Terrace · Veres Pálné utca 7'}</span><h3 class="h3">${esc(s.name)}</h3></div>
            <span class="price">from <b>€${s.price}</b><br><span class="small">per night</span></span>
          </div>
          <div class="meta">
            <span class="chip">${ICON.users} ${s.guests} guests</span>
            <span class="chip">${ICON.ruler} up to ${s.size} m²</span>
            <span class="chip">${ICON.bed} ${esc(s.beds)}</span>
          </div>
          <div class="studio-card__foot">
            <a class="link-arrow" href="${s.slug}.html">Read more ${ICON.arrowUpRight}</a>
            ${btnSm('Book now', s.booking, { outline: true, external: true })}
          </div>
        </div>
      </article>`;

const studiosGrid = (list) => `<div class="grid-3" data-stagger="0.08">${list.map(studioCard).join('')}</div>`;

const overviewBlocks = () => `
    <div class="grid-3" data-stagger="0.1">
      ${[
        { n: 4, h: 'Large Studio', s: 'Up to 4 guests · up to 32 m² · queen-size bed and double sofa bed', ic: ICON.users },
        { n: 3, h: 'Medium Studio', s: 'Up to 3 guests · up to 25 m² · queen-size bed and single sofa bed', ic: ICON.users },
        { n: 2, h: 'Small Studio', s: 'Up to 2 guests · up to 18 m² · queen-size bed', ic: ICON.bed },
      ].map((o) => `
      <div class="obox" data-appear="scale">
        <div class="obox__info"><span class="num-lg">${o.n}</span><div><h3 class="h3">${esc(o.h)}</h3><p class="small">${esc(o.s)}</p></div></div>
        <span class="ico">${o.ic}</span>
      </div>`).join('')}
    </div>`;

const amenities = () => `
    <div class="features__am">
      ${caption('Amenities')}
      <div class="am-grid" data-stagger="0.07">
        <div class="am-col">
          <div class="fbox" data-appear="scale"><span class="fbox__ico">${ICON.wifi}</span><h3 class="h3">Free high-speed WiFi</h3></div>
          <div class="fbox" data-appear="scale"><span class="fbox__ico">${ICON.kitchen}</span><h3 class="h3">Kitchenette for self-catering</h3></div>
          <div class="fbox" data-appear="scale"><span class="fbox__ico">${ICON.wind}</span><h3 class="h3">Air conditioning & heating</h3></div>
        </div>
        <div class="am-col am-col--mid">
          <div class="fbox fbox--big" data-appear="scale"><span class="fbox__ico">${ICON.coffee}</span><h3 class="h3">Nespresso coffee maker, kettle, toaster & microwave</h3></div>
        </div>
        <div class="am-col">
          <div class="fbox" data-appear="scale"><span class="fbox__ico">${ICON.tv}</span><h3 class="h3">Smart flat screen TV</h3></div>
          <div class="fbox" data-appear="scale"><span class="fbox__ico">${ICON.lock}</span><h3 class="h3">Safety deposit box</h3></div>
          <div class="fbox" data-appear="scale"><span class="fbox__ico">${ICON.shower}</span><h3 class="h3">Towels, linens & hair dryer</h3></div>
        </div>
      </div>
    </div>`;

const faqItem = (f, { noimg = false } = {}) => `
      <div class="faq-item${noimg || !f.img ? ' faq-item--noimg' : ''}">
        <button class="faq-item__q" type="button" aria-expanded="false">
          ${!noimg && f.img ? `<span class="faq-item__img">${img(f.img, '', { sizes: '80px' })}</span>` : ''}
          <h3 class="h3">${esc(f.q)}</h3>
          <span class="arr">${ICON.arrowDown}</span>
        </button>
        <div class="faq-item__a"><div><div class="lead">${f.a}</div></div></div>
      </div>`;
const faqList = (items, opts) => `<div class="faq__list" data-stagger="0.06">${items.map((f) => `<div data-appear>${faqItem(f, opts)}</div>`).join('')}</div>`;

const transferSplit = () => `
  <section class="section" id="transfer">
    <div class="container"><div class="content">
      <div class="split">
        <div class="split__media reveal-img">${img('svc-transfer', 'Airport transfer and taxi service')}</div>
        <div class="split__text">
          <div class="caption-h2">${caption('Airport transfer and taxi service')}<h2 class="h2 split-words">Book your transfer with Welcome Pickups</h2></div>
          <div class="prose split-blur">
            <p>We have partnered with Welcome Pickups for safe and reliable transfers. You can arrange, modify, and pay for your ride with ease—all bookings, cancellations, and payments are managed securely with this trusted service.</p>
            <p><strong>How it works:</strong> the price for your transfer will be displayed after you enter your details. You can book transfers to and from the airport, as well as to any other destination within or outside Budapest. For your convenience, you may also use this taxi service for other trips anywhere in or outside Budapest.</p>
          </div>
          <div data-appear>${btn('Book a transfer', C.TRANSFER, { external: true })}</div>
        </div>
      </div>
    </div></div>
  </section>`;

const gcard = (name, n, title, ar, href) => `
        <${href ? 'a href="' + href + '"' : 'div'} class="gcard reveal-img${href ? ' gcard--link' : ''}" style="--ar:${ar}" data-appear="scale">
          ${img(name, title, { sizes: '(max-width: 767px) 100vw, 33vw' })}
          <span class="n">${n}</span><h3 class="h3">${esc(title)}</h3>
        </${href ? 'a' : 'div'}>`;

/* ------------------------------------------------------------------ HOME */
function homePage() {
  const heroTag = 'Veres Pálné utca 7 & 26 · Budapest';
  const proofImgs = ['courtyard-gv', 'street-shops', 'lg-gv-1'];
  let html = head({ title: 'Home', description: 'Amber Studios – self-catering studio apartments with kitchenette in the heart of Budapest (Belváros, 5th district). Two properties on Veres Pálné utca, 100 m apart. Direct booking 25% cheaper.', path: 'index.html' });
  html += `
  <header class="hero">
    <div class="container">
      <div class="hero__content">
        <div class="hero__info">
          ${nav()}
          <div class="hero__offer">
            <div class="hero__pilltext">
              <span class="tag" data-appear style="--delay:.1s">${ICON.mapPin}${esc(heroTag)}</span>
              <h1 class="h1 split-words">Comfort and Charm in Central Budapest</h1>
              <div class="proof" data-appear style="--delay:.7s">
                <span class="avatars">${proofImgs.map((p) => `<span>${img(p, '', { sizes: '44px' })}</span>`).join('')}</span>
                <span>Trusted by guests for 11 years</span>
              </div>
            </div>
            <div data-appear style="--delay:.8s">${btn('Book now', C.BOOKING, { external: true })}</div>
          </div>
          <div class="stats" data-appear style="--delay:1s">
            <div class="badge">${WREATH_L}<span>Austrian<br>management</span>${WREATH_R}</div>
            <div class="stats__info">
              <div class="stat"><span class="num-md"><span data-count="2015">2015</span></span><span class="small">In hospitality since</span></div>
              <div class="stat stat--hide-m"><span class="num-md"><span data-count="2">2</span></span><span class="small">Properties, 100 m apart</span></div>
              <div class="stat stat--hide-m"><span class="num-md">3<span style="font-size:18px;vertical-align:top">★</span></span><span class="small">Classified accommodation</span></div>
            </div>
          </div>
        </div>
        <div class="hero__image" data-appear="fade" style="--delay:.2s">
          <div data-appear="zoom" style="position:absolute;inset:0">${img('hero-home', 'Large Studio Gardenview at Amber Studios Budapest', { sizes: '(max-width: 1199px) 100vw, 50vw', eager: true })}</div>
          <a class="icon-btn icon-btn--big map-btn" href="#location" aria-label="See our location">${ICON.map}</a>
        </div>
      </div>
    </div>
  </header>
  <main id="main">

  <!-- Introduction -->
  <section class="intro" id="introduction">
    <div class="intro__bg">${img('courtyard-gv', 'Inner courtyard of Amber Gardenview Studios', { sizes: '100vw', attrs: 'data-parallax="0.18"' })}</div>
    <div class="container">
      <div class="intro__content">
        <div class="intro__info on-dark">
          ${caption('Introduction', true)}
          <h2 class="h2 split-words">Great location, best prices, happy guests</h2>
        </div>
        <div class="intro__grid">
          <div class="on-dark" style="padding:0 24px 24px;max-width:560px">
            <p class="lead split-blur">Amber Studios is situated in the vibrant heart of Budapest, on the Pest side within the renowned “Belváros”—the historic inner city and oldest district of downtown Budapest. Our studios are outfitted with state-of-the-art amenities, seamlessly blending modern comfort with the charm of this storied neighborhood.</p>
          </div>
          <div class="value-card" data-appear="scale">
            <div class="value"><div class="value__left"><span class="num-xl"><span data-count="24">24</span>/7</span><span class="body">Virtual reception, answering guests’ questions as soon as they come up</span></div><span class="ico">${ICON.headset}</span></div>
            <div class="divider"></div>
            <div class="value"><div class="value__left"><span class="num-xl">€<span data-count="36">36</span></span><span class="body">Studios with kitchenette from €36 per night</span></div><span class="ico">${ICON.tag}</span></div>
            <div class="divider"></div>
            <div class="value"><div class="value__left"><span class="num-xl"><span data-count="25" data-suffix="%">25%</span></span><span class="body">Direct booking cheaper than on other websites</span></div><span class="ico">${ICON.percent}</span></div>
            <div class="divider"></div>
            <div class="value"><div class="value__left"><span class="num-xl"><span data-count="100">100</span> m</span><span class="body">Between Amber Gardenview and Amber Terrace Studios</span></div><span class="ico">${ICON.mapPin}</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- About -->
  <section class="section about" id="about">
    <div class="container"><div class="content">
      <div class="about__content">
        <div class="host" data-appear>
          <div class="host__who">
            <span class="host__avatar" style="display:grid;place-items:center;background:var(--accent-soft)">${LOGO_MARK.replace('class="logo-mark"', 'style="width:28px;height:28px"')}<span class="host__dot"></span></span>
            <div><div class="host__name">Amber Studios team</div><div class="host__role">Austrian / Hungarian management</div></div>
          </div>
          <a class="icon-btn" href="${C.COMPANY.phoneHref}" aria-label="Call us">${ICON.phone}</a>
        </div>
        <p class="lead split-blur">“Friendliness is our highest principle and we are here to serve you and make your stay in Budapest unforgettable. Our international team with coworkers from 4 different countries is dedicated to making our guests truly feel at home with us.”</p>
      </div>
    </div></div>
    <div class="marquee"><div class="marquee__track">
      ${[['headset', '24/7 Virtual Reception'], ['piggy', 'Best Price & Flexibility'], ['key', 'Fast Check-In and ID Upload'], ['badge', 'Trusted for 11 Years'], ['sparkles', 'Highest Standards of Cleanliness'], ['building', 'Two Properties, 100 m Apart']].map(([ic, t]) => `<span class="pill"><span class="ico">${ICON[ic]}</span>${t}</span>`).join('')}
    </div></div>
    <div class="marquee marquee--reverse"><div class="marquee__track">
      ${[['wifi', 'Free High-Speed WiFi'], ['wind', 'Air Conditioning & Heating'], ['kitchen', 'Fully Equipped Kitchenette'], ['tv', 'Smart Flat Screen TV'], ['coffee', 'Nespresso Coffee Maker'], ['lock', 'Safety Deposit Box'], ['luggage', 'Free Luggage Storage']].map(([ic, t]) => `<span class="pill"><span class="ico">${ICON[ic]}</span>${t}</span>`).join('')}
    </div></div>
  </section>

  <!-- Gallery -->
  <section class="section section--tint" id="gallery">
    <div class="container"><div class="content gallery">
      ${sectionHead({ cap: 'Gallery', title: 'Inside our Budapest studios', ctaLabel: 'Book now' })}
      <div class="gallery__grid">
        <div class="gcol gcol--1" data-stagger="0.1">
          ${gcard('lg-gv-1', '01', 'Large Studio Gardenview', '3/2', 'large-studio-gardenview.html')}
          ${gcard('sm-gv-3', '02', 'Small Studio Gardenview', '2/3', 'small-studio-gardenview.html')}
          ${gcard('lg-gv-3', '03', 'Kitchenette', '3/2')}
        </div>
        <div class="gcol gcol--2" data-stagger="0.1">
          ${gcard('md-gv-1', '04', 'Medium Studio Gardenview', '1/1.1', 'medium-studio-gardenview.html')}
          ${gcard('lg-tr-1', '05', 'Large Studio Terrace', '1/1.1', 'large-studio-terrace.html')}
          ${gcard('courtyard-garden', '06', 'Gardenview courtyard', '1/0.85')}
        </div>
        <div class="gcol gcol--3" data-stagger="0.1">
          ${gcard('md-tr-1', '07', 'Medium Studio Terrace', '3/2', 'medium-studio-terrace.html')}
          ${gcard('sm-tr-1', '08', 'Small Studio Terrace', '3/2', 'small-studio-terrace.html')}
          ${gcard('staircase', '09', 'Terrace staircase', '2/3')}
        </div>
      </div>
    </div></div>
  </section>

  <!-- Studios / features -->
  <section class="section" id="studios">
    <div class="container"><div class="content features">
      <div class="features__top">
        ${sectionHead({ cap: 'Studios', title: 'Check our comfortable studios with kitchenette' })}
        ${overviewBlocks()}
        ${studiosGrid(C.STUDIOS)}
      </div>
      ${amenities()}
    </div></div>
  </section>

  ${offer()}

  <!-- Reviews -->
  <section class="section" id="reviews">
    <div class="container"><div class="content reviews">
      <div class="reviews__head">
        ${caption('Reviews')}
        <div class="rating-row">${WREATH_L}<h2 class="h2 split-words">Customer reviews</h2>${WREATH_R}</div>
        <p class="lead split-blur">Here, you'll find authentic feedback from travelers who have stayed at Amber Studios in the heart of Budapest. Discover what guests loved about their experience.</p>
      </div>
      <div class="reviews__widget" data-appear>
        <script src="https://elfsightcdn.com/platform.js" async></script>
        <div class="elfsight-app-99c8bfce-0036-4c24-94fa-ff618058ba4d" data-elfsight-app-lazy></div>
        <noscript><div class="reviews__fallback"><p class="lead">Guest reviews are loaded from Google. Enable JavaScript to see them.</p></div></noscript>
      </div>
    </div></div>
  </section>

  <!-- FAQ -->
  <section class="section section--tint" id="faq">
    <div class="container"><div class="content faq">
      <div class="faq__head">${sectionHead({ cap: 'FAQ', title: 'Frequently asked questions', left: true, cta: btn('All questions', 'faq.html') })}</div>
      ${faqList([C.FAQ[0], C.FAQ[1], C.FAQ[3], C.FAQ[7], C.FAQ[13]])}
    </div></div>
  </section>

  <!-- Pricing -->
  <section class="section--dark pricing on-dark" id="pricing">
    <div class="container"><div class="content">
      <div class="pricing__head">
        <div class="caption-h2" style="display:flex;flex-direction:column;align-items:center;gap:16px">
          ${caption('Pricing', true)}
          <p class="num-xl">from €<span data-count="36">36</span>/night</p>
        </div>
        <p class="lead split-blur">5% VAT included. A 4% city tax must be paid additionally. Flexible and non-refundable rates available.</p>
        ${btn('Book now', C.BOOKING, { white: true, external: true })}
      </div>
    </div></div>
    <div class="ticker"><div class="ticker__track">
      ${[['lg-gv-2', ''], ['sm-gv-2', 'tall'], ['md-tr-3', 'mid'], ['lg-tr-3', ''], ['room-d', 'mid'], ['md-gv-3', ''], ['sm-tr-2', 'tall'], ['lg-gv-4', 'mid'], ['courtyard-tree', ''], ['room-b', 'mid']].map(([n, c]) => img(n, 'Amber Studios', { sizes: '300px', attrs: c ? `class="${c}"` : '' })).join('')}
    </div></div>
  </section>

  <!-- Location -->
  <section class="section section--dark location on-dark" id="location">
    <div class="container"><div class="content">
      <div class="location__info">
        ${sectionHead({ cap: 'Location', title: 'In the heart of Budapest', dark: true, lead: 'In our immediate vicinity 250 m away is Budapest’s famous pedestrian street, Váci Street, which runs parallel to our street. A five-minute walk takes you to the Danube embankment, with a beautiful view of the Buda side and the Castle.' })}
        <div class="info-blocks" data-stagger="0.1">
          <div class="info-block" data-appear><span class="small">Neighbourhood:</span><span class="val">Belváros, 5th district</span></div>
          <span class="vdiv"></span>
          <div class="info-block" data-appear><span class="small">Address:</span><span class="val">Veres Pálné utca 7 & 26, 1053 Budapest</span></div>
          <span class="vdiv"></span>
          <div class="info-block" data-appear><span class="small">Reception:</span><span class="val">Veres Pálné utca 26, ground floor</span></div>
        </div>
      </div>
      <div class="map-wrap" data-appear="scale">
        <a class="map-open" href="${C.MAP_MYMAPS}" target="_blank" rel="noopener">Open in Maps ${ICON.external}</a>
        <iframe src="${C.MAP_EMBED}" title="Map of Amber Studios, Veres Pálné utca 26, Budapest" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
      </div>
    </div></div>
  </section>
  </main>`;
  html += footer();
  return html;
}

/* ------------------------------------------------------------------ SUBPAGES */
function aboutPage() {
  let h = head({ title: 'About us', description: 'Amber Studios has been in the hospitality business since 2015, operating Amber Terrace Studios and Amber Gardenview Studios, 100 m apart in Budapest’s 5th district.', path: 'about.html' });
  h += pageHero({ cap: 'About us', title: 'Comfort and Charm in Central Budapest', image: 'hall-mosaic', imageAlt: 'Entrance hall of Amber Gardenview Studios', cta: 'Book now', lead: 'Our company has been in the hospitality business since 2015, therefore, we can guarantee the highest level of professionalism.' });
  h += `
  <section class="section">
    <div class="container"><div class="content text-block">
      <div class="caption-h2" style="display:flex;flex-direction:column;gap:12px;align-items:flex-start">${caption('Who we are')}<h2 class="h2 split-words">Two properties, one friendly team</h2></div>
      <div class="prose split-blur">
        <p>We are operating two properties, Amber Terrace Studios and Amber Gardenview Studios, 100 m apart from each other, both located in Budapest downtown, in the 5th district in Veres Pálné street and classified by the Hungarian Tourism Authorities both as 3 star accommodations.</p>
        <p>Friendliness is our highest principle and we are here to serve you and make your stay in Budapest unforgettable. Amber Studios is an open and hospitable community that strives to enrich guests staying with us in the heart of Budapest with new experiences.</p>
        <p>Our international team with coworkers from 4 different countries is dedicated to making our guests truly feel at home with us, the management and ownership is Austrian/Hungarian.</p>
        <p>Breakfast is available in nearby cafes. There are several restaurants, grocery stores, bars and cafés in a radius of 100 metres from the property. Luggage storage is available in case of a late check-out or early check-in.</p>
      </div>
    </div></div>
  </section>
  <section class="section section--tint">
    <div class="container"><div class="content page-section-gap">
      <div class="split">
        <div class="split__media reveal-img">${img('street-balcony', 'Amber Terrace Studios, Veres Pálné utca 7')}</div>
        <div class="split__text">
          <div class="caption-h2">${caption('Amber Terrace Studios')}<h2 class="h2 split-words">Veres Pálné street 7 = VP7</h2></div>
          <div class="prose split-blur"><p>Our reception is 100 m away, located in Veres Pálné utca 26. We offer 3 types of studios: Large Studio VP7, Medium Studio VP7 and Small Studio VP7.</p></div>
          <div data-appear>${btn('Read more', 'terrace.html')}</div>
        </div>
      </div>
      <div class="split split--reverse">
        <div class="split__media reveal-img">${img('courtyard-gv', 'Amber Gardenview Studios, Veres Pálné utca 26')}</div>
        <div class="split__text">
          <div class="caption-h2">${caption('Amber Gardenview Studios')}<h2 class="h2 split-words">Veres Pálné street 26 = VP26</h2></div>
          <div class="prose split-blur"><p>Here is also located our reception. We offer 3 types of studios: Large Studio VP26, Medium Studio VP26 and Small Studio VP26.</p></div>
          <div data-appear>${btn('Read more', 'gardenview.html')}</div>
        </div>
      </div>
    </div></div>
  </section>
  <section class="section">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:64px">
      ${sectionHead({ cap: 'Why guests choose us', title: 'Great location, best prices, happy guests' })}
      <div class="grid-3" data-stagger="0.08">
        ${[['headset', '24/7 Virtual Reception', 'We answer to guests questions as soon as they come up 24/7'], ['piggy', 'Best Price & Flexibility', 'Free Cancellation for 4 Day Flexible policy, Best Price and Secure Online Payment'], ['key', 'Fast Check-In and ID Upload', 'Check-in and Upload your IDs through Online Application'], ['badge', 'Trusted', 'Trusted by Guests for 11 Years'], ['sparkles', 'Cleanliness', 'Highest Standards of Cleanliness is very important for us'], ['camera', 'A cinematic street', 'Veres Pálné Street and Amber Studios are highly sought-after locations for film and documentary productions by Hollywood, Netflix, and international and Hungarian filmmakers.']].map(([ic, t, d]) => `
        <div class="card" data-appear="scale"><span class="ico">${ICON[ic]}</span><h3 class="h3">${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}
      </div>
    </div></div>
  </section>
  ${offer()}
  </main>`;
  return h + footer();
}

function propertyPage(kind) {
  const gv = kind === 'gardenview';
  const name = gv ? 'Amber Gardenview Studios' : 'Amber Terrace Studios';
  const list = C.STUDIOS.filter((s) => s.property === kind);
  let h = head({ title: name, description: gv ? 'Amber Gardenview Studios – self-catering studios around a charming inner courtyard with a protected chestnut tree, Veres Pálné utca 26, Budapest.' : 'Amber Terrace Studios – stylish self-catering studios with elevator in a late 20th-century building, Veres Pálné utca 7, Budapest.', path: kind + '.html' });
  h += pageHero({
    cap: name, tag: gv ? 'Veres Pálné utca 26 · reception on site' : 'Veres Pálné utca 7 · 100 m from reception',
    title: gv ? 'Urban comfort meets garden charm' : 'Stylish stays in the heart of Budapest',
    lead: `${name} offers self-catering accommodation with complimentary WiFi and air conditioning.`,
    image: gv ? 'courtyard-gv' : 'street-balcony', cta: 'Book now', ctaHref: gv ? C.BOOKING_GV : C.BOOKING_TR,
  });
  const paras = gv ? [
    'Each studio features a flat-screen TV, a fully equipped kitchenette, and a safe deposit box for your valuables. Linen and towels are provided for your convenience. Studios are situated either on the ground floor or the first floor, and all units are easily accessible. Breakfast options are available at nearby cafés. For guests with early arrivals or late departures, luggage storage is provided.',
    'The building is centered around a charming inner courtyard, home to a protected chestnut tree, and showcases late 19th-century architectural style with its spacious, high-ceilinged interiors and garden. Despite being in the heart of Budapest, the peaceful courtyard allows guests to enjoy the sounds of birdsong. The studios combine modern amenities and comfort within a historic setting, offering a tranquil retreat in the city center.',
    'Located on Veres Pálné Street, in one of Budapest’s most atmospheric neighborhoods, the studios and their surroundings often serve as filming locations for Hollywood movies, Netflix productions, and other international and local film projects. This historic district offers the unique feel of a small town within the vibrant city of Budapest.',
  ] : [
    'Each studio features a flat-screen TV, a fully equipped kitchenette, and a safe deposit box for your valuables. Linen and towels are provided for your convenience. Studios are situated either on the first floor or the second floor, and all units are easily accessible by an elevator. Breakfast options are available at nearby cafés. For guests with early arrivals or late departures, luggage storage is provided.',
    'The building beautifully preserves the architectural traditions of the late 20th century, featuring grand interior spaces and tall, elongated windows. Its unique character shines through in the elevator, entrance hall, and staircase, which have retained their distinguished charm even after careful modernization.',
    'Our studios are designed and equipped with modern comforts, offering guests the perfect blend of contemporary amenities within a historic setting. This part of Budapest’s city center has the welcoming feel of a small town nestled within the bustling capital. Situated on Veres Pálné Street, our studios and the surrounding area are frequently chosen as filming locations for Hollywood movies, Netflix series, and other international and national film productions.',
    'Notably, our studios have hosted stars such as Aria Mia Loberti, Louis Hofmann, Lars Eidinger, and Hugh Laurie during the filming of the Netflix miniseries "All the Light We Cannot See" in 2022, which was shot right here on Veres Pálné Street and within our building.',
  ];
  const galleryImgs = gv ? [['courtyard-garden', 'Inner courtyard'], ['courtyard-tree', 'The protected chestnut tree'], ['bike-storage', 'Bicycle storage in the courtyard'], ['hall-entry', 'Entrance hall']] : [['staircase', 'Staircase'], ['facade', 'Building facade'], ['entrance', 'Entrance'], ['street-cars', 'Veres Pálné utca']];
  h += `
  <section class="section">
    <div class="container"><div class="content text-block">
      <div class="caption-h2" style="display:flex;flex-direction:column;gap:12px;align-items:flex-start">${caption('The building')}<h2 class="h2 split-words">${gv ? 'A quiet courtyard in the city centre' : 'Grand spaces, tall windows, an elevator'}</h2></div>
      <div class="prose split-blur">${paras.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    </div></div>
  </section>
  <section class="section section--tint">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:64px">
      ${sectionHead({ cap: 'Studios', title: `Discover our ${name}`, ctaLabel: 'Book now', ctaHref: gv ? C.BOOKING_GV : C.BOOKING_TR })}
      ${studiosGrid(list)}
    </div></div>
  </section>
  <section class="section">
    <div class="container"><div class="content gallery">
      ${sectionHead({ cap: 'Gallery', title: gv ? 'Courtyard, garden and entrance' : 'Staircase, facade and street' })}
      <div class="grid-2" style="gap:16px" data-stagger="0.1">
        ${galleryImgs.map(([n, t], i) => gcard(n, String(i + 1).padStart(2, '0'), t, '3/2')).join('')}
      </div>
    </div></div>
  </section>
  ${transferSplit()}
  ${offer()}
  </main>`;
  return h + footer();
}

function studiosPage() {
  let h = head({ title: 'Our studios & policies', description: 'Six self-catering studio types in two central Budapest properties: Large (4 guests), Medium (3 guests) and Small (2 guests) studios with kitchenette. Policies and house rules.', path: 'studios.html' });
  h += pageHero({ cap: 'Our studios & policies', title: 'Check our comfortable city-center studios with kitchenette', lead: 'Welcome to our studios — inviting, stylish spaces designed for comfort and relaxation in the heart of Budapest. Whether you\'re here for a short city break or a longer stay, our studios offer a peaceful retreat just steps away from the city\'s vibrant energy, historic charm, and cultural landmarks.', image: 'lg-gv-2', cta: 'Book now' });
  h += `
  <section class="section">
    <div class="container"><div class="content features">
      <div class="features__top">
        <div class="text-block">
          <div class="caption-h2" style="display:flex;flex-direction:column;gap:12px;align-items:flex-start">${caption('Two properties')}<h2 class="h2 split-words">Three studio categories at both locations</h2></div>
          <div class="prose split-blur">
            <p>At Amber Studios, we are pleased to offer two centrally located properties in Budapest: <strong>Amber Gardenview Studios</strong> – featuring our on-site reception and a charming inner courtyard, and <strong>Amber Terrace Studios</strong> – located just 100 meters away, providing the same high level of comfort and convenience.</p>
            <p>Both locations feature three categories of self-catering studios, designed to accommodate different guest needs. Each studio type combines comfort and functionality, ensuring a pleasant stay for business and leisure travelers alike.</p>
          </div>
        </div>
        ${overviewBlocks()}
        ${studiosGrid(C.STUDIOS)}
      </div>
      ${amenities()}
    </div></div>
  </section>
  <section class="section section--tint" id="policies">
    <div class="container"><div class="content faq">
      <div class="faq__head">${sectionHead({ cap: 'Policies', title: 'Policies (apply for all the studios)', left: true, lead: 'Check-in, deposits, families, smoking and cancellation — everything you agree to when you stay with us.' })}</div>
      ${faqList(C.POLICIES.map((p) => ({ q: p.title, a: p.html })), { noimg: true })}
    </div></div>
  </section>
  ${offer()}
  </main>`;
  return h + footer();
}

function studioPage(s) {
  const others = C.STUDIOS.filter((o) => o.slug !== s.slug);
  const prop = s.property === 'gardenview' ? 'Amber Gardenview Studios' : 'Amber Terrace Studios';
  let h = head({ title: s.name, description: `${s.title}: up to ${s.guests} guests, up to ${s.size} m², ${s.beds}, free WiFi and air conditioning, fully equipped kitchenette. From €${s.price}/night.`, path: s.slug + '.html' });
  h += pageHero({ cap: prop, tag: s.address, title: s.title, lead: s.text, image: s.images[0], cta: 'Book now', ctaHref: s.booking });
  h += `
  <section class="section">
    <div class="container"><div class="content detail-grid">
      <div class="grid-2" style="gap:16px" data-stagger="0.1">
        ${s.images.map((n, i) => gcard(n, String(i + 1).padStart(2, '0'), i === 0 ? s.short : (i === 1 ? 'Kitchenette & seating' : (i === 3 ? 'Bathroom' : 'Studio detail')), '1/1')).join('')}
      </div>
      <div class="stack">
        <div class="caption-h2" style="display:flex;flex-direction:column;gap:12px;align-items:flex-start">${caption('Details')}<h2 class="h2 split-words">from €${s.price}/night</h2></div>
        <div class="spec-list" data-appear>
          <div class="spec"><span class="k">Max persons</span><span class="v">${s.guests}</span></div>
          <div class="spec"><span class="k">Beds</span><span class="v">${esc(s.beds)}</span></div>
          <div class="spec"><span class="k">Size</span><span class="v">up to ${s.size} m²</span></div>
          <div class="spec"><span class="k">Floor</span><span class="v">${esc(s.floor)}</span></div>
          <div class="spec"><span class="k">Address</span><span class="v">${esc(s.address)}</span></div>
          <div class="spec"><span class="k">Included</span><span class="v">free WiFi and air conditioning, fully equipped kitchenette</span></div>
          <div class="spec"><span class="k">VAT and tax</span><span class="v">5% VAT (included) · 4% city tax (must be paid additionally)</span></div>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap" data-appear>${btn('Book now', s.booking, { external: true })}${btnSm('Read the policies', 'studios.html#policies', { outline: true })}</div>
      </div>
    </div></div>
  </section>
  <section class="section section--tint">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:48px">
      ${sectionHead({ cap: 'Features', title: 'Everything you need for self-catering', left: true })}
      <div class="feature-tags" data-appear>${s.features.replace(/\.$/, '').split(', ').map((f) => `<span class="chip">${ICON.check}${esc(f)}</span>`).join('')}</div>
      <div class="text-block">
        <div class="prose"><h3>On demand</h3><p>${esc(s.onDemand)}</p></div>
        <div class="notice">${ICON.info}<span>${esc(C.PICTURES_NOTE)}</span></div>
      </div>
    </div></div>
  </section>
  <section class="section">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:64px">
      ${sectionHead({ cap: 'Our other studios', title: 'More studios at Amber' })}
      ${studiosGrid(others)}
    </div></div>
  </section>
  ${offer()}
  </main>`;
  return h + footer();
}

function servicesPage() {
  let h = head({ title: 'Services', description: 'Guest services at Amber Studios: 24/7 virtual reception, airport transfer and taxi, laundry, bike rental, tourist info and tickets, parking nearby.', path: 'services.html' });
  h += pageHero({ cap: 'Services', title: 'Thoughtful services to enhance your stay', lead: 'Enjoy comfort and convenience during your stay in Budapest with our range of guest services: a 24/7 virtual reception and an on-site reception available daily from 9:00 to 19:00, plus easy online registration and optional self-check-in after 19:00.', image: 'svc-transfer', cta: 'Book now' });
  h += `
  <section class="section">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:64px">
      ${sectionHead({ cap: 'Overview', title: 'Our guest services' })}
      <div class="cards" data-stagger="0.08">
        ${C.SERVICES.map((s) => `<a class="card" href="#${s.id}" data-appear="scale"><span class="ico">${ICON[s.icon]}</span><h3 class="h3">${esc(s.name)}</h3><p>${esc(s.short)}</p><span class="link-arrow" style="margin-top:auto">Details ${ICON.arrowDown}</span></a>`).join('')}
      </div>
    </div></div>
  </section>
  ${C.SERVICES.map((s, i) => `
  <section class="section${i % 2 ? '' : ' section--tint'}" id="${s.id}">
    <div class="container"><div class="content">
      <div class="split${i % 2 ? ' split--reverse' : ''}">
        <div class="split__media reveal-img">${img(s.img, s.name)}</div>
        <div class="split__text">
          <div class="caption-h2">${caption(s.short)}<h2 class="h2 split-words">${esc(s.name)}</h2></div>
          <div class="prose split-blur">${s.html}</div>
          ${s.cta ? `<div data-appear>${btn(s.cta.label, s.cta.href, { external: true })}</div>` : ''}
        </div>
      </div>
    </div></div>
  </section>`).join('')}
  ${offer()}
  </main>`;
  return h + footer();
}

function restaurantsPage() {
  let h = head({ title: 'Restaurants', description: 'Cafés, brunch, lunch and dinner places near Amber Studios on Veres Pálné utca in Budapest’s historic Belváros district.', path: 'restaurants.html' });
  h += pageHero({ cap: 'Restaurants', title: 'Cafés, brunch, lunch and dinner places nearby', lead: 'Nestled in the vibrant core of Budapest’s historic Belváros district, Veres Pálné utca invites you to discover a world of culinary delights and authentic Hungarian hospitality. This charming street, lined with beautiful architecture and shaded by leafy trees, is home to an impressive array of cafés, coffee shops, and restaurants—all within easy walking distance.', image: 'dining-dish' });
  h += `
  <section class="section">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:64px">
      <div class="split">
        <div class="split__media reveal-img">${img('dining-coffee', 'Coffee on Veres Pálné utca')}</div>
        <div class="split__text">
          <div class="caption-h2">${caption('Culinary diversity at your doorstep')}<h2 class="h2 split-words">Experience the heart of Budapest: Veres Pálné utca</h2></div>
          <div class="prose split-blur">
            <p>Amber boasts a prime location, surrounded by a diverse array of cafés, brunch spots, lunch venues, and dinner restaurants. Situated just steps away from the bustling Váci Street, guests have easy access to numerous dining options catering to various tastes and dietary preferences.</p>
            <p>Exploring Veres Pálné utca means more than just dining—it’s about immersing yourself in the everyday life of Budapest, connecting with its traditions, and savoring moments of genuine hospitality. Each café, bar and restaurant along this picturesque street offers its own distinct charm, making every meal a delightful and memorable experience.</p>
          </div>
        </div>
      </div>
      <div class="grid-3" data-stagger="0.1">
        ${[['coffee', 'Artisan Cafés', 'Savor expertly brewed specialty coffees in settings that range from modern and stylish to warm and intellectual. Many cafés feature inviting interiors with bookshelves, local art, or greenery, creating the ideal backdrop for reading, conversation, or people-watching.'], ['utensils', 'Brunch and Lunch Spots', 'Enjoy creative menus featuring fresh pastries, vegan and vegetarian options, and hearty Hungarian classics. The area’s eateries are known for their commitment to quality ingredients and innovative flavors, ensuring there’s something for every palate.'], ['shop', 'Traditional Restaurants', 'Experience the rich flavors of Hungarian cuisine in welcoming, rustic settings. From goulash and stews to contemporary takes on local specialties, these restaurants offer both authenticity and value.']].map(([ic, t, d]) => `<div class="card" data-appear="scale"><span class="ico">${ICON[ic]}</span><h3 class="h3">${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}
      </div>
    </div></div>
  </section>
  <section class="section section--tint">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:64px">
      ${sectionHead({ cap: 'Nearby', title: 'Our recommendations on and around Veres Pálné utca' })}
      <div class="cards" data-stagger="0.07">
        ${C.RESTAURANTS.map((r) => `<div class="card" data-appear="scale"><span class="ico">${ICON.utensils}</span><div><h3 class="h3">${esc(r.name)}</h3><span class="meta">${esc(r.meta)}</span></div><p>${esc(r.text)}</p>${r.perk ? `<div class="notice" style="padding:14px 16px;font-size:14px">${ICON.tag}<span>${esc(r.perk)}</span></div>` : ''}${r.link ? `<div class="card__foot"><a class="link-arrow" href="${r.link}" target="_blank" rel="noopener">Read more ${ICON.arrowUpRight}</a></div>` : ''}</div>`).join('')}
      </div>
    </div></div>
  </section>
  ${offer()}
  </main>`;
  return h + footer();
}

function attractionsPage() {
  let h = head({ title: 'Attractions', description: 'Attractions in Budapest and how to reach them from Amber Studios: Parliament, Buda Castle, Chain Bridge, Great Synagogue, St. Stephen’s Basilica, Andrássy Avenue and Heroes’ Square.', path: 'attractions.html' });
  h += pageHero({ cap: 'Attractions', title: 'Attractions in Budapest', lead: 'Amber Studios is located in the heart of Budapest, on the Pest side in the so-called "Belváros" or inner city which belongs to the 5th district. This historic district is the oldest part of the Pest side, where the foundations of several churches date back as far as Roman times.', image: 'bp-parliament' });
  h += C.ATTRACTIONS.map((a, i) => `
  <section class="section${i % 2 ? ' section--tint' : ''}">
    <div class="container"><div class="content">
      <div class="split${i % 2 ? ' split--reverse' : ''}">
        <div class="split__media reveal-img">${img(a.img, a.name)}</div>
        <div class="split__text">
          <div class="caption-h2">${caption(String(i + 1).padStart(2, '0'))}<h2 class="h2 split-words">${esc(a.name)}</h2></div>
          <div class="prose split-blur"><p>${esc(a.text)}</p><h4>How to get there?</h4><p>${esc(a.how)}</p></div>
        </div>
      </div>
    </div></div>
  </section>`).join('');
  h += `
  <section class="section">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:48px">
      ${sectionHead({ cap: 'Tickets', title: 'Plan ahead and book tickets online', lead: 'Some popular sights, such as tours of the Hungarian Parliament, often sell out during the high season.' })}
      <div class="grid-3" data-stagger="0.1">
        <a class="card" href="https://www.parlament.hu/web/visitors/purchasing-tickets" target="_blank" rel="noopener" data-appear="scale"><span class="ico">${ICON.ticket}</span><h3 class="h3">Hungarian Parliament</h3><p>Official visitor tickets at parlament.hu.</p><span class="link-arrow" style="margin-top:auto">Buy tickets ${ICON.arrowUpRight}</span></a>
        <a class="card" href="https://bkk.hu/en/tickets-and-passes/budapestgo/" target="_blank" rel="noopener" data-appear="scale"><span class="ico">${ICON.train}</span><h3 class="h3">Metro, bus & tram</h3><p>Tickets and passes via the BudapestGO app, at metro stations, vending machines and newsstands.</p><span class="link-arrow" style="margin-top:auto">BudapestGO ${ICON.arrowUpRight}</span></a>
        <a class="card" href="services.html#tickets" data-appear="scale"><span class="ico">${ICON.info}</span><h3 class="h3">Tourist info</h3><p>Hop-On Hop-Off buses, Danube cruises, thermal baths, folklore concerts and more.</p><span class="link-arrow" style="margin-top:auto">Read more ${ICON.arrowUpRight}</span></a>
      </div>
    </div></div>
  </section>
  ${offer()}
  </main>`;
  return h + footer();
}

function tipsPage() {
  let h = head({ title: 'Budapest tips', description: 'Top tips for exploring Budapest from Amber Studios: Great Market Hall 400 m, Váci Street 250 m, Kálvin tér metro 550 m, airport 22 km, tram 2 along the Danube.', path: 'budapest-tips.html' });
  h += pageHero({ cap: 'Budapest tips', title: 'Top tips for exploring Budapest', lead: 'Amber Studios is located in the heart of Budapest, on the Pest side in the so-called "Belváros" or inner city, which is the oldest part of Budapest downtown. The street by itself is quiet and cosy with an intimate atmosphere.', image: 'bp-dusk' });
  h += `
  <section class="section">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:64px">
      ${sectionHead({ cap: 'Distances', title: 'Everything within reach' })}
      <div class="grid-3" data-stagger="0.08">
        ${[['400 m', 'Great Market Hall', 'A wide range of Hungarian food products', 'shop'], ['250 m', 'Váci Street', 'Budapest’s famous pedestrian street, parallel to ours', 'walk'], ['550 m', 'Kálvin tér metro', 'Lines 3 and 4, several tram and bus connections', 'train'], ['22 km', 'Liszt Ferenc Airport', 'Fast airport bus 100E departs from Kálvin tér', 'plane'], ['5 min', 'Danube embankment', 'Views of the Buda side and the Castle; tram line 2', 'camera'], ['30 min', 'Hungarian Parliament', 'On foot along the Danube, or 16 min by tram 2', 'building']].map(([n, t, s, ic]) => `
        <div class="obox" data-appear="scale"><div class="obox__info"><span class="num-md" style="min-width:72px">${n}</span><div><h3 class="h3">${esc(t)}</h3><p class="small">${esc(s)}</p></div></div><span class="ico">${ICON[ic]}</span></div>`).join('')}
      </div>
    </div></div>
  </section>
  <section class="section section--tint">
    <div class="container"><div class="content">
      <div class="split">
        <div class="split__media reveal-img">${img('bp-parliament-sunset', 'Hungarian Parliament at sunset')}</div>
        <div class="split__text">
          <div class="caption-h2">${caption('The neighbourhood')}<h2 class="h2 split-words">A small town within the city</h2></div>
          <div class="prose split-blur">
            <p>We are 400 metres away from the Great Market Hall, which offers a wide range of Hungarian food products. There are several restaurants, grocery stores, bars and cafés in a radius of 100 metres from the property. Kálvin tér metro station with metro lines 3 and 4 and several tram and bus line connections are within 550 metres from Amber Studios, providing easy and fast transportation for travellers. Liszt Ferenc Airport is 22 km away and the fast airport line 100E is also departing from Kálvin tér.</p>
            <p>This historic part of Budapest's city center feels like a small town within the city of Budapest. The Veres Pálné Street, where our studios are located and even our studios by themselves are frequently used as movie sets for films and documentaries made in Hollywood, by Netflix and other international and national producers in the movie business.</p>
          </div>
        </div>
      </div>
    </div></div>
  </section>
  <section class="section">
    <div class="container"><div class="content">
      <div class="split split--reverse">
        <div class="split__media reveal-img">${img('bp-parliament-buda', 'View of the Parliament from the Buda side')}</div>
        <div class="split__text">
          <div class="caption-h2">${caption('Veres Pálné street')}<h2 class="h2 split-words">Named after the pioneer of girls’ education</h2></div>
          <div class="prose split-blur">
            <p>We are located in the so-called Budapest "Belváros" or inner city on Veres Pálné Street, named after the pioneer of girls' education, Mrs. Veres Pál. The gymnasium named after her is located further down the street. This area of Budapest's downtown is the oldest part with foundations of some churches even tracing back to Roman times when their locations served as temples.</p>
            <p>In our immediate vicinity 250 m away is Budapest's famous pedestrian street, Váci Street, which runs parallel to our street. Three blocks away from us is the Faculty of Law of Eötvös Loránd University (ELTE), the oldest university in Hungary, founded in 1635. Another 50 m away from us is located the beautiful Serb Orthodox church embodied in a beautifully preserved garden.</p>
            <p>A five-minute walk will also take us to the Danube embankment, providing a beautiful view of the Buda side and the Castle. The world-famous tram line 2 also runs here, preserving the atmosphere of bygone times. This tram line was also featured by National Geographic and is a must to do for visitors who wish to travel alongside the Danube towards the world famous Hungarian Parliament, which can be reached by foot in 30 min.</p>
          </div>
        </div>
      </div>
    </div></div>
  </section>
  <section class="section section--tint">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:48px">
      ${sectionHead({ cap: 'More information', title: 'Click to get more information' })}
      <div class="cards" data-stagger="0.07">
        ${[['attractions.html', 'camera', 'Attractions', 'Parliament, Buda Castle, Synagogue, Basilica and more'], ['shopping-tips.html', 'shop', 'Shopping', 'Váci utca, Fashion Street, markets and local makers'], ['restaurants.html', 'utensils', 'Gastronomy', 'Cafés, brunch, lunch and dinner on our street'], ['services.html#tickets', 'ticket', 'Culture & events', 'Concerts, cruises, baths and folklore tickets'], ['https://bkk.hu/en/', 'train', 'Tram & bus tickets', 'Budapest public transport information and tickets'], ['faq.html', 'info', 'City guide & FAQ', 'Practical answers for your stay']].map(([href, ic, t, d]) => `<a class="card" href="${href}"${isExternal(href) ? ' target="_blank" rel="noopener"' : ''} data-appear="scale"><span class="ico">${ICON[ic]}</span><h3 class="h3">${esc(t)}</h3><p>${esc(d)}</p><span class="link-arrow" style="margin-top:auto">Open ${ICON.arrowUpRight}</span></a>`).join('')}
      </div>
    </div></div>
  </section>
  ${offer()}
  </main>`;
  return h + footer();
}

function shoppingPage() {
  let h = head({ title: 'Shopping tips', description: 'Shopping possibilities in downtown Budapest near Váci utca: Fashion Street, the Great Market Hall, Christmas markets, Szimpla farmers’ market and local makers.', path: 'shopping-tips.html' });
  h += pageHero({ cap: 'Shopping tips', title: 'Shopping possibilities in downtown Budapest near Váci utca', lead: 'Váci utca is a renowned pedestrian shopping street in Budapest, running from Vörösmarty Square to the Central Market Hall. It offers a vibrant mix of international fashion brands, Hungarian boutiques, souvenir shops, and cafés.', image: 'bp-fashion-street' });
  h += `
  <section class="section">
    <div class="container"><div class="content text-block">
      <div class="caption-h2" style="display:flex;flex-direction:column;gap:12px;align-items:flex-start">${caption('Overview')}<h2 class="h2 split-words">Big-brand convenience and authentic local charm</h2></div>
      <div class="prose split-blur"><p>Nearby Fashion Street features premium global labels like Hugo Boss and Tommy Hilfiger, while Hercegprímás and Petőfi Sándor streets showcase local designers and concept stores. The Central Market Hall at the southern end provides traditional goods, fresh produce, and Hungarian delicacies. Beyond the main street, visitors can discover hidden gems like Cadeau Chocolate Shop on Veres Pálné utca and Iringó flower manufactory on Károlyi utca, along with independent bookstores, antique shops, and artisanal stores—creating a perfect blend of big-brand convenience and authentic local charm.</p></div>
    </div></div>
  </section>
  ${C.SHOPPING.map((s, i) => `
  <section class="section${i % 2 ? '' : ' section--tint'}">
    <div class="container"><div class="content">
      <div class="split${i % 2 ? ' split--reverse' : ''}">
        <div class="split__media reveal-img">${img(s.img, s.name)}</div>
        <div class="split__text">
          <div class="caption-h2">${caption(s.meta || String(i + 1).padStart(2, '0'))}<h2 class="h2 split-words">${esc(s.name)}</h2></div>
          <div class="prose split-blur"><p>${esc(s.text)}</p></div>
          ${s.link ? `<div data-appear>${btn('Read more', s.link, { external: true })}</div>` : ''}
        </div>
      </div>
    </div></div>
  </section>`).join('')}
  ${offer()}
  </main>`;
  return h + footer();
}

function faqPage() {
  let h = head({ title: 'FAQ', description: 'Frequently asked questions about Amber Studios Budapest: reception hours, check-in and check-out, parking, cleaning, laundry, children, pets and more.', path: 'faq.html' });
  h += pageHero({ cap: 'FAQ', title: 'Frequently asked questions', lead: `Can’t find your answer? Call ${C.COMPANY.phone} (also on WhatsApp) or write to ${C.COMPANY.email}.`, image: 'hall-entry', cta: 'Chat on WhatsApp', ctaHref: C.WHATSAPP });
  h += `
  <section class="section section--tint">
    <div class="container"><div class="content faq" style="grid-template-columns:1fr;max-width:900px;margin:0 auto">
      ${faqList(C.FAQ)}
    </div></div>
  </section>
  ${offer()}
  </main>`;
  return h + footer();
}

function contactPage() {
  let h = head({ title: 'Contact & directions', description: 'Contact Amber Studios Budapest: Veres Pálné utca 7 and 26, 1053 Budapest. Reception at Veres Pálné utca 26. Phone +36 70 627 7796, info@amberstudios.hu.', path: 'contact.html' });
  h += pageHero({ cap: 'Contact & directions', tag: 'Reception: Veres Pálné utca 26, 1053 Budapest', title: 'Contact information', lead: 'Our reception is open daily from 9:00 AM to 7:00 PM. Outside these hours you can reach us via our AI BotChat system on WhatsApp.', image: 'street-trees', cta: 'Chat on WhatsApp', ctaHref: C.WHATSAPP });
  h += `
  <section class="section">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:48px">
      <div class="contact-grid" data-stagger="0.08">
        <div class="contact-card" data-appear="scale"><span class="caption">${ICON.mapPin}&nbsp;Amber Studios</span><h3 class="h3">${esc(C.COMPANY.address)}</h3><p class="small">Reception: ${esc(C.COMPANY.reception)}</p></div>
        <div class="contact-card" data-appear="scale"><span class="caption">${ICON.phone}&nbsp;Phone</span><h3 class="h3"><a href="${C.COMPANY.phoneHref}">${C.COMPANY.phone}</a></h3><p class="small">(and through <a href="${C.WHATSAPP}" target="_blank" rel="noopener" style="text-decoration:underline">WhatsApp</a>)</p></div>
        <div class="contact-card" data-appear="scale"><span class="caption">${ICON.mail}&nbsp;E-mail</span><h3 class="h3"><a href="mailto:${C.COMPANY.email}">${C.COMPANY.email}</a></h3><p class="small">Group and long-term inquiries: <a href="mailto:${C.COMPANY.groupEmail}" style="text-decoration:underline">${C.COMPANY.groupEmail}</a></p></div>
        <div class="contact-card" data-appear="scale"><span class="caption">${ICON.building}&nbsp;${esc(C.COMPANY.legal)}</span><h3 class="h3">${esc(C.COMPANY.seat)}</h3><p class="small">Registration number ${C.COMPANY.regNo}<br>VAT number ${C.COMPANY.vat}</p></div>
      </div>
      <div class="map-wrap map-wrap--light" data-appear="scale" style="height:520px">
        <a class="map-open" href="${C.MAP_MYMAPS}" target="_blank" rel="noopener">Both properties on the map ${ICON.external}</a>
        <iframe src="${C.MAP_EMBED}" title="Map of Amber Studios, Veres Pálné utca 26, Budapest" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
      </div>
    </div></div>
  </section>
  <section class="section section--tint">
    <div class="container"><div class="content" style="display:flex;flex-direction:column;gap:64px">
      ${sectionHead({ cap: 'Directions', title: 'Getting to Veres Pálné utca' })}
      <div class="grid-3" data-stagger="0.08">
        ${[['plane', 'From the airport', 'Liszt Ferenc Airport is 22 km away. The fast airport bus 100E departs from Kálvin tér, 550 m from Amber Studios. Or book a door-to-door transfer with Welcome Pickups.'], ['train', 'By metro', 'Kálvin tér (metro lines 3 and 4) is within 550 m; Ferenciek tere (line 3) is also close by. Tram 2 runs along the Danube embankment, a five-minute walk away.'], ['parking', 'By car', 'Street parking in the city centre is chargeable (PARKL app). Underground garages 5–8 minutes away can be booked via budapestcarpark.com with code AMBER10; Pollack Garage is the most economical option nearby.']].map(([ic, t, d]) => `<div class="card" data-appear="scale"><span class="ico">${ICON[ic]}</span><h3 class="h3">${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}
      </div>
      <div class="notice">${ICON.info}<span>Please note: we operate a single reception for both locations, at Amber Gardenview Studios, Veres Pálné utca 26. When you arrive, you’ll find our doorbell labeled "Amber Studios" to the right of the entrance. Amber Terrace Studios (Veres Pálné utca 7) is just 100 meters away.</span></div>
    </div></div>
  </section>
  ${transferSplit()}
  ${offer()}
  </main>`;
  return h + footer();
}

function legalPage({ file, title, cap, html, description }) {
  let h = head({ title, description, path: file });
  h += `
  <header class="hero hero--page" style="padding-bottom:0">
    <div class="container"><div class="hero__content" style="grid-template-columns:1fr">
      <div class="hero__info" style="padding-right:24px">${nav()}
        <div class="hero__offer" style="padding-bottom:0"><div class="hero__pilltext">${caption(cap)}<h1 class="h1 split-words">${esc(title)}</h1></div></div>
      </div>
    </div></div>
  </header>
  <main id="main">
  <section class="section" style="padding-top:64px">
    <div class="container"><div class="content"><div class="prose" data-appear="fade">${html}</div></div></div>
  </section>
  </main>`;
  return h + footer();
}

const IMPRINT_HTML = `
<h3>${C.COMPANY.legal}</h3>
<p>${C.COMPANY.address}<br>Reception: ${C.COMPANY.reception}</p>
<p>${C.COMPANY.seat}<br>Registration number ${C.COMPANY.regNo}<br>VAT number ${C.COMPANY.vat}</p>
<p><a href="${C.COMPANY.phoneHref}">${C.COMPANY.phone}</a> (and through <a href="${C.WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a>)<br><a href="mailto:${C.COMPANY.email}">${C.COMPANY.email}</a></p>`;

/* ------------------------------------------------------------------ build */
const pages = {
  'index.html': homePage,
  'about.html': aboutPage,
  'gardenview.html': () => propertyPage('gardenview'),
  'terrace.html': () => propertyPage('terrace'),
  'studios.html': studiosPage,
  'services.html': servicesPage,
  'restaurants.html': restaurantsPage,
  'attractions.html': attractionsPage,
  'budapest-tips.html': tipsPage,
  'shopping-tips.html': shoppingPage,
  'faq.html': faqPage,
  'contact.html': contactPage,
  'imprint.html': () => legalPage({ file: 'imprint.html', title: 'Imprint', cap: 'Legal', html: IMPRINT_HTML, description: 'Imprint of Amber Studios Kft., Budapest.' }),
  'privacy-policy.html': () => legalPage({ file: 'privacy-policy.html', title: 'Privacy policy', cap: 'Legal', html: C.PRIVACY_HTML, description: 'Privacy policy of amberstudios.hu.' }),
  'gtc.html': () => legalPage({ file: 'gtc.html', title: 'General terms & conditions', cap: 'Legal', html: C.GTC_HTML, description: 'General terms and cancellation options at Amber Studios Budapest.' }),
};
C.STUDIOS.forEach((s) => { pages[s.slug + '.html'] = () => studioPage(s); });

if (IMG_SRC) {
  const out = path.join(ROOT, 'assets/img');
  fs.mkdirSync(out, { recursive: true });
  let copied = 0;
  for (const [name, id] of Object.entries(C.IMAGES)) {
    for (const w of [600, 1000, 1600]) {
      const src = path.join(IMG_SRC, `${id}-${w}.webp`);
      const candidates = [src, path.join(IMG_SRC, `${id}-1000.webp`), path.join(IMG_SRC, `${id}-600.webp`)];
      const from = candidates.find((f) => fs.existsSync(f)) || null;
      if (!from) { console.warn('missing', name, w); continue; }
      fs.copyFileSync(from, path.join(out, `${name}-${w}.webp`));
      copied++;
    }
  }
  console.log('images copied:', copied);
}

for (const [file, render] of Object.entries(pages)) {
  const html = render();
  fs.writeFileSync(path.join(ROOT, file), html);
  console.log('wrote', file, (html.length / 1024).toFixed(1) + ' kB');
}
