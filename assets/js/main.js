/* Amber Studios — motion & interaction layer
   Reference behaviour: Stayscape (Framer). Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function q(s, r) { return (r || document).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- 1. word splitting for headings / leads ---------- */
  function splitWords(el) {
    if (el.getAttribute('data-split') === 'done') return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var text = node.nodeValue;
      if (!text.trim()) return;
      var frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var span = document.createElement('span');
        span.className = 'w';
        span.textContent = part;
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.setAttribute('data-split', 'done');
  }

  /* ---------- 2. count-up numbers ---------- */
  function animateCounter(el) {
    if (el.getAttribute('data-counted')) return;
    el.setAttribute('data-counted', '1');
    var raw = el.getAttribute('data-count');
    var target = parseFloat(raw);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = (raw.split('.')[1] || '').length;
    var dur = 1400;
    var start = performance.now();
    if (reduce) { el.textContent = prefix + target.toFixed(decimals) + suffix; return; }
    var from = target > 1000 ? target - 24 : 0; // years count up from nearby, not from zero
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (from + (target - from) * e).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- 3. intersection reveals ---------- */
  function setupReveals() {
    qa('.split-words, .split-blur').forEach(function (h) {
      splitWords(h);
      var base = h.classList.contains('split-blur') ? 0.025 : 0.06;
      qa('.w', h).forEach(function (w, i) { w.style.transitionDelay = (i * base) + 's'; });
    });

    qa('[data-stagger]').forEach(function (group) {
      var step = parseFloat(group.getAttribute('data-stagger')) || 0.08;
      qa('[data-appear]', group).forEach(function (c, i) { c.style.setProperty('--delay', (i * step) + 's'); });
    });

    var targets = qa('[data-appear], .split-words, .split-blur, .caption, .reveal-img, [data-count]');

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('is-in'); if (t.hasAttribute('data-count')) animateCounter(t); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        if (el.hasAttribute('data-count')) animateCounter(el);
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (t) {
      if (t.closest('.hero')) return; // hero runs on load
      io.observe(t);
    });

    var hero = q('.hero');
    if (hero) {
      requestAnimationFrame(function () {
        qa('[data-appear], .split-words, .split-blur, .caption, .reveal-img', hero).forEach(function (el) { el.classList.add('is-in'); });
        qa('[data-count]', hero).forEach(function (el) { setTimeout(function () { animateCounter(el); }, 900); });
      });
    }
  }

  /* ---------- 4. parallax (intro bg, offer image) ---------- */
  function setupParallax() {
    if (reduce) return;
    var items = qa('[data-parallax]').map(function (el) { return { el: el, amount: parseFloat(el.getAttribute('data-parallax')) || 0.15 }; });
    if (!items.length) return;
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var box = it.el.parentElement.getBoundingClientRect();
        if (box.bottom < -200 || box.top > vh + 200) return;
        var progress = (box.top + box.height / 2 - vh / 2) / (vh + box.height);
        it.el.style.transform = 'translate3d(0,' + (progress * -it.amount * 100).toFixed(2) + '%,0)';
      });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- 5. menu ---------- */
  function setupMenu() {
    var btn = q('.nav__burger');
    var menu = q('.menu');
    var backdrop = q('.menu-backdrop');
    if (!btn || !menu) return;
    function set(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('is-open', open);
      if (backdrop) backdrop.classList.toggle('is-open', open);
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    if (backdrop) backdrop.addEventListener('click', function () { set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    qa('a', menu).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  }

  /* ---------- 6. FAQ accordion ---------- */
  function setupFaq() {
    qa('.faq-item').forEach(function (item) {
      var btn = q('.faq-item__q', item);
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        var group = item.parentElement;
        if (group && group.hasAttribute('data-single')) {
          qa('.faq-item.is-open', group).forEach(function (o) { o.classList.remove('is-open'); q('.faq-item__q', o).setAttribute('aria-expanded', 'false'); });
        }
        item.classList.toggle('is-open', !open);
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
  }

  /* ---------- 8. marquee duplication ---------- */
  function setupMarquees() {
    qa('.marquee__track, .ticker__track').forEach(function (track) {
      var parent = track.parentElement;
      var html = track.innerHTML;
      var guard = 0;
      while (track.scrollWidth < window.innerWidth * 1.2 && guard < 6) { track.insertAdjacentHTML('beforeend', html); guard++; }
      var clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      parent.appendChild(clone);
      var px = track.scrollWidth;
      var pxPerSec = track.classList.contains('ticker__track') ? 34 : 40;
      parent.style.setProperty('--speed', (px / pxPerSec).toFixed(1) + 's');
    });
  }

  /* ---------- 9. back to top, year ---------- */
  function setupMisc() {
    qa('a[href="#top"]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    });
    var y = q('[data-year]'); if (y) y.textContent = new Date().getFullYear();
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupFaq();
    setupMarquees();
    setupMisc();
    setupReveals();
    setupParallax();
    document.documentElement.classList.add('js-ready');
  });
})();
