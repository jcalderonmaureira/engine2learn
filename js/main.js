/* engine2learn — behaviour: language switch, story engine, paper filter, nav, reveal. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ }
    }
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => matchMedia('(max-width: 900px)').matches;

  /* ------------------------------------------------------------------
     Language (English is the default and lives in the HTML)
     ------------------------------------------------------------------ */
  const textOnly = el => el instanceof SVGElement || el.tagName === 'TITLE';
  const i18nEls = $$('[data-i18n]');
  const attrEls = $$('[data-i18n-attr]');

  i18nEls.forEach(el => { el.dataset.en = textOnly(el) ? el.textContent : el.innerHTML; });
  const attrPairs = attrEls.map(el => ({
    el,
    pairs: el.dataset.i18nAttr.split(';').map(p => {
      const [attr, key] = p.split(':');
      return { attr, key, en: el.getAttribute(attr) };
    })
  }));

  function setLang(lang) {
    const es = lang === 'es' ? (window.I18N_ES || {}) : null;
    i18nEls.forEach(el => {
      const v = es && es[el.dataset.i18n] != null ? es[el.dataset.i18n] : el.dataset.en;
      if (textOnly(el)) el.textContent = v; else el.innerHTML = v;
    });
    attrPairs.forEach(({ el, pairs }) => pairs.forEach(({ attr, key, en }) => {
      el.setAttribute(attr, es && es[key] != null ? es[key] : en);
    }));
    document.documentElement.lang = lang;
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    store.set('lang', lang);
  }

  $$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  const urlLang = new URLSearchParams(location.search).get('lang');
  const startLang = urlLang === 'es' || urlLang === 'en' ? urlLang : store.get('lang');
  if (startLang === 'es') setLang('es');

  /* ------------------------------------------------------------------
     Nav
     ------------------------------------------------------------------ */
  const nav = $('#nav');
  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* ------------------------------------------------------------------
     Papers filter
     ------------------------------------------------------------------ */
  const filters = $$('.flt');
  const papers = $$('.paper');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.toggle('is-on', b === btn));
    papers.forEach(p => { p.hidden = btn.dataset.filter !== 'all' && p.dataset.pillar !== btn.dataset.filter; });
  }));

  /* ------------------------------------------------------------------
     Story engine: one persistent SVG, driven by the step in focus
     ------------------------------------------------------------------ */
  const svg = $('#stage-svg');
  const stageCol = $('#stage-col');
  const steps = $$('.step');
  const N = steps.length;
  const dotsBox = $('#dots');
  const count = $('#count');
  const playBtn = $('#play');

  const parseSet = str => {
    const set = new Set();
    str.split(',').forEach(part => {
      const [a, b] = part.trim().split('-').map(Number);
      for (let i = a; i <= (b || a); i++) set.add(i);
    });
    return set;
  };
  const shown = $$('[data-s]', svg).map(el => ({ el, set: parseSet(el.dataset.s) }));
  const active = $$('[data-a]', svg).map(el => ({ el, set: parseSet(el.dataset.a) }));

  if (reduceMotion) $$('animateMotion', svg).forEach(n => n.parentNode.remove());

  const dots = steps.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Step ${i + 1}`);
    b.addEventListener('click', () => { stopPlay(); goTo(i + 1); });
    dotsBox.appendChild(b);
    return b;
  });

  let scene = 0;
  function setScene(n) {
    if (n === scene) return;
    scene = n;
    svg.dataset.scene = String(n);
    shown.forEach(({ el, set }) => el.classList.toggle('on', set.has(n)));
    active.forEach(({ el, set }) => el.classList.toggle('act', set.has(n)));
    steps.forEach((s, i) => s.classList.toggle('is-active', i + 1 === n));
    dots.forEach((d, i) => { if (i + 1 === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
    count.textContent = `${n} / ${N}`;
  }

  // on mobile the stage is pinned under the nav, so the reading line sits just below its pinned bottom edge
  const focusLine = () => (isMobile() ? nav.offsetHeight + stageCol.offsetHeight + 56 : innerHeight * 0.5);

  function pick() {
    const f = focusLine();
    let n = 1;
    for (let i = 0; i < N; i++) {
      const r = steps[i].getBoundingClientRect();
      if (r.top <= f) n = i + 1;
    }
    setScene(n);
  }

  // pick() reads 12 rects; scroll events already arrive at frame rate, so no throttling is needed
  addEventListener('scroll', pick, { passive: true });
  addEventListener('resize', pick);

  function goTo(n) {
    n = Math.max(1, Math.min(N, n));
    const r = steps[n - 1].getBoundingClientRect();
    const delta = isMobile() ? r.top - (focusLine() - 30) : r.top + r.height / 2 - innerHeight * 0.5;
    scrollBy({ top: delta, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  $('#prev').addEventListener('click', () => { stopPlay(); goTo(scene - 1); });
  $('#next').addEventListener('click', () => { stopPlay(); goTo(scene + 1); });

  let timer = null;
  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.setAttribute('aria-pressed', 'false');
  }
  function startPlay() {
    playBtn.setAttribute('aria-pressed', 'true');
    if (scene >= N) goTo(1);
    else if (scene === 0) goTo(1);
    timer = setInterval(() => {
      if (scene >= N) { stopPlay(); return; }
      goTo(scene + 1);
    }, 5200);
  }
  playBtn.addEventListener('click', () => (timer ? stopPlay() : startPlay()));
  ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => { if (timer) stopPlay(); }, { passive: true }));

  // the three colour fields in the hero jump straight to their part of the story
  $$('[data-goto]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    goTo(Number(a.dataset.goto));
  }));

  setScene(1);
  pick();
})();
