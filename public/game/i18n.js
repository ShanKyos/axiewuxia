/* ═══ Axie Wuxia i18n v1 — key-based, English-first ═══
   Replaces the old regex/substring translator (lang.js) for any content migrated to use it.
   Loaded AFTER strings/en.js and strings/vi.js, BEFORE lang.js and game.js.

   Why this exists instead of extending lang.js: lang.js only ever translates hardcoded
   Vietnamese source text into English at draw time via regex/dictionary substitution — it has
   no notion of "the source of truth is this key" and can't be pointed the other direction
   without becoming a second, parallel hack. This module is real key -> string lookup; call
   t('some.key') and get the current locale's string directly, no pattern-matching involved.

   Coexistence during migration: content not yet ported to t() calls stays hardcoded Vietnamese
   in game.js, same as before — lang.js keeps translating THAT content when locale is 'en',
   exactly as it always has. t()-driven content never touches lang.js's regex path at all (its
   output is already correct for the locale). See docs/I18N_MIGRATION_GUIDE.md for the plan to
   shrink lang.js's job over time as more of game.js moves to t(). */
(function () {
  'use strict';
  const KEY = 'vlcm_lang';
  let locale = 'en'; // Axie Wuxia is English-first (the prototype defaulted to 'vi' — see lang.js)
  try { locale = localStorage.getItem(KEY) || 'en'; } catch (e) {}

  function dict() {
    return locale === 'vi' ? (window.I18N_VI || {}) : (window.I18N_EN || {});
  }

  window.t = function (key, vars) {
    const d = dict();
    let s = Object.prototype.hasOwnProperty.call(d, key) ? d[key] : key; // missing key -> show the key itself, loud and obvious in dev
    if (vars) {
      for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    }
    return s;
  };

  window.i18nLocale = function () { return locale; };
})();
