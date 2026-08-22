/* Clara Landing — app.js
   Vanilla JS only. No framework, no build step.
   Handles: scroll reveal animations.
*/

(function () {
  'use strict';

  /* ── Scroll Reveal (Intersection Observer) ──────────────── */
  /* Mark page as JS-ready so CSS can initialise invisible state */
  document.documentElement.classList.add('js-ready');

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
    document.querySelectorAll('[data-animate]').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

})();
