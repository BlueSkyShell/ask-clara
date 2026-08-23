/* Clara Landing — app.js
   Vanilla JS only. No framework, no build step.
   Handles: EN/ES language toggle + scroll reveal animations.
*/

(function () {
  'use strict';

  /* ── Translations ───────────────────────────────────────── */
  const T = {
    en: {
      'skip':             'Skip to content',
      'nav.features':     'Features',
      'nav.security':     'Security',
      'nav.how':          'How it works',
      'nav.docs':         'Docs',
      'cta.download':     'Download',
      'cta.get':          'Get Clara',
      'cta.how':          'How it works',

      'hero.headline':    'Crypto,<br>made clear.',
      'hero.desc':        'Your on-device AI guard. Clara decodes every transaction and tells you what it does, before your wallet ever signs.',

      'feat1.title':      'Understands before you sign',
      'feat1.desc':       'Clara decodes every contract call and explains it in plain language. No guessing, no blind trust.',
      'feat2.title':      'Say it. Clara builds it.',
      'feat2.desc':       'Type what you want in plain language. Clara constructs the transaction, verifies it, and shows you exactly what will happen.',
      'feat3.title':      '100% on-device',
      'feat3.desc':       'The AI model runs locally. Your prompts, your keys, your transactions. Nothing ever reaches a server.',

      'hiw.label':        'How it works',
      'hiw.title':        'Three steps. Full clarity.',
      'step1.title':      'Tell Clara what you want to do',
      'step1.example':    '"Send $20 to Daniel"',
      'step1.desc':       'Type your intent in plain language. No wallet addresses, no token symbols required.',
      'step2.title':      'Clara decodes it',
      'step2.desc':       'Before anything moves, Clara shows you: recipient, amount, asset, fee, and any risk. All in plain terms.',
      'step3.title':      'You approve. Or you don\'t.',
      'step3.desc':       'Nothing is signed until you confirm it. Full stop.',

      'sec.label':        'Security',
      'sec.title':        'Designed to protect. Never to control.',
      'sec1.title':       'Runs entirely on your device',
      'sec1.desc':        'The AI model runs entirely on your machine. No server, no cloud inference, no data leaving your device.',
      'sec2.title':       'Explains before your wallet sees it',
      'sec2.desc':        'Every transaction is explained in plain language before your wallet is ever asked to sign.',
      'sec3.title':       'Never touches your keys',
      'sec3.desc':        'Clara never has access to your private keys or seed phrase. Your wallet stays yours.',
      'sec4.title':       'Your approval. Always.',
      'sec4.desc':        'Nothing is executed automatically. Every action requires your explicit confirmation.',

      'finalcta.headline': 'Crypto shouldn\'t require blind trust.',
      'finalcta.accent':   'Ask Clara.',

      'footer.copy':      '© 2026 Clara. All rights reserved.',
      'footer.privacy':   'Privacy',
      'footer.terms':     'Terms',
      'footer.docs':      'Docs',
    },

    es: {
      'skip':             'Ir al contenido',
      'nav.features':     'Funciones',
      'nav.security':     'Seguridad',
      'nav.how':          'Cómo funciona',
      'nav.docs':         'Docs',
      'cta.download':     'Descargar',
      'cta.get':          'Obtener Clara',
      'cta.how':          'Cómo funciona',

      'hero.headline':    'Cripto,<br>hecha clara.',
      'hero.desc':        'Tu guardián de IA local. Clara decodifica cada transacción y te explica qué va a pasar, antes de que tu wallet firme nada.',

      'feat1.title':      'Entiende antes de que firmes',
      'feat1.desc':       'Clara decodifica cada llamada de contrato y te la explica en palabras simples. Sin suposiciones, sin confianza ciega.',
      'feat2.title':      'Díselo. Clara lo construye.',
      'feat2.desc':       'Escribe lo que quieres en lenguaje natural. Clara construye la transacción, la verifica y te muestra exactamente qué va a ocurrir.',
      'feat3.title':      '100% en tu dispositivo',
      'feat3.desc':       'El modelo de IA corre localmente. Tus prompts, tus llaves, tus transacciones. Nada llega a ningún servidor.',

      'hiw.label':        'Cómo funciona',
      'hiw.title':        'Tres pasos. Total claridad.',
      'step1.title':      'Dile a Clara qué quieres hacer',
      'step1.example':    '"Envía $20 a Daniel"',
      'step1.desc':       'Escribe tu intención en lenguaje natural. Sin direcciones de wallet, sin símbolos de tokens.',
      'step2.title':      'Clara lo decodifica',
      'step2.desc':       'Antes de que se mueva algo, Clara te muestra: destinatario, monto, activo, comisión y cualquier riesgo. En términos simples.',
      'step3.title':      'Tú decides. O no.',
      'step3.desc':       'Nada se firma hasta que tú lo confirmes. Punto final.',

      'sec.label':        'Seguridad',
      'sec.title':        'Diseñada para proteger. Nunca para controlar.',
      'sec1.title':       'Corre completamente en tu dispositivo',
      'sec1.desc':        'El modelo de IA corre íntegramente en tu máquina. Sin servidor, sin inferencia en la nube, sin datos que salgan de tu equipo.',
      'sec2.title':       'Explica antes de que tu wallet lo vea',
      'sec2.desc':        'Cada transacción es explicada en lenguaje simple antes de que tu wallet sea solicitada a firmar.',
      'sec3.title':       'Nunca toca tus llaves',
      'sec3.desc':        'Clara nunca tiene acceso a tus llaves privadas ni a tu frase semilla. Tu wallet sigue siendo tuya.',
      'sec4.title':       'Tu aprobación. Siempre.',
      'sec4.desc':        'Nada se ejecuta automáticamente. Cada acción requiere tu confirmación explícita.',

      'finalcta.headline': 'El cripto no debería requerir confianza ciega.',
      'finalcta.accent':   'Pregúntale a Clara.',

      'footer.copy':      '© 2026 Clara. Todos los derechos reservados.',
      'footer.privacy':   'Privacidad',
      'footer.terms':     'Términos',
      'footer.docs':      'Docs',
    },
  };

  /* ── Language Toggle ─────────────────────────────────────── */
  const html   = document.documentElement;
  const toggle = document.getElementById('lang-toggle');
  const label  = toggle ? toggle.querySelector('.lang-label') : null;

  function applyLang(lang) {
    html.lang = lang;
    const strings = T[lang] || T.en;
    const next = lang === 'en' ? 'ES' : 'EN';
    if (label) label.textContent = next;
    if (toggle) toggle.setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Switch to English');

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.dataset.i18n;
      if (strings[key] !== undefined) el.textContent = strings[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      const key = el.dataset.i18nHtml;
      if (strings[key] !== undefined) el.innerHTML = strings[key];
    });

    try { localStorage.setItem('clara-lang', lang); } catch (_) {}
  }

  (function initLang() {
    let saved;
    try { saved = localStorage.getItem('clara-lang'); } catch (_) {}
    const lang = (saved === 'en' || saved === 'es') ? saved
      : (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
    applyLang(lang);
  })();

  toggle && toggle.addEventListener('click', function () {
    applyLang(html.lang === 'en' ? 'es' : 'en');
  });

  /* ── Scroll Reveal (Intersection Observer) ──────────────── */
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
    }, { threshold: 0.10, rootMargin: '0px 0px -56px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  } else {
    document.querySelectorAll('[data-animate]').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

})();
