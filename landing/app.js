/* Clara Landing — app.js
   Vanilla JS only. No framework, no build step.
   Handles: theme toggle + scroll reveal animations.
*/

(function () {
  'use strict';

  /* ── Theme Toggle ───────────────────────────────────────── */
  const html    = document.documentElement;
  const toggle  = document.getElementById('theme-toggle');
  const ICON_EL = toggle ? toggle.querySelector('.theme-icon') : null;

  const ICONS = { dark: '☀️', light: '🌙' };
  const LABELS = {
    dark:  'Switch to light mode',
    light: 'Switch to dark mode',
  };

  function applyTheme(theme) {
    html.dataset.theme = theme;
    if (ICON_EL)  ICON_EL.textContent = ICONS[theme];
    if (toggle)   toggle.setAttribute('aria-label', LABELS[theme]);
    try { localStorage.setItem('clara-theme', theme); } catch (_) {}
  }

  /* Restore saved preference, or use system preference */
  (function initTheme() {
    let saved;
    try { saved = localStorage.getItem('clara-theme'); } catch (_) {}

    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      applyTheme('light');
    } else {
      applyTheme('dark');
    }
  })();

  toggle && toggle.addEventListener('click', function () {
    const next = html.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });

  /* ── Scroll Reveal (Intersection Observer) ──────────────── */
  /* Mark page as JS-ready so CSS can initialise invisible state */
  html.classList.add('js-ready');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced && 'IntersectionObserver' in window) {
    const items = document.querySelectorAll('[data-animate]');

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        const delay = parseInt(entry.target.dataset.delay || '0', 10) * 80;

        setTimeout(function () {
          entry.target.classList.add('is-visible');
        }, delay);

        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.10,
      rootMargin: '0px 0px -56px 0px',
    });

    items.forEach(function (el) { observer.observe(el); });
  } else {
    /* Reduced motion or no IO support: show everything immediately */
    document.querySelectorAll('[data-animate]').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

})();
