# i18n Migration Guide — Phase 1 (the language flip)

## What changed

The prototype's `lang.js` only ever translated hardcoded Vietnamese source text into English at
draw time, via regex/substring matching (`TERMS`/`EXACT`/`RULES` tables) — there was no real
"source of truth" string system, just a one-directional patch bolted onto
`CanvasRenderingContext2D.prototype.fillText`/`strokeText`/`measureText` plus a DOM
`MutationObserver`. That can't simply be "inverted" for an English-first game — see the earlier
analysis in this thread for why.

Instead, `public/game/i18n.js` (new) is a real key → string lookup:

```js
t('hud.hint.move')   // → "WASD move" (en) or "WASD di chuyển" (vi), from strings/en.js / vi.js
```

Both are loaded synchronously as plain `window.I18N_EN` / `window.I18N_VI` object literals
(`<script src="strings/en.js">` etc. in `index.html`) — no `fetch()`, no async race against
`game.js` booting immediately after.

## Coexistence strategy (why nothing broke mid-migration)

- **`lang.js` is kept**, not deleted, and its default flipped from `'vi'` to `'en'` (one line).
  Any string in `game.js` **not yet** migrated to `t()` is still hardcoded Vietnamese, exactly as
  before — `lang.js` keeps translating it to English via its existing regex/dictionary system
  when the locale is `'en'` (now the default). Nothing goes untranslated during the transition.
- **`t()`-driven content bypasses `lang.js` entirely** — its output is already correct for the
  current locale, so when it flows through the same patched `fillText`, `lang.js`'s `tr()` just
  fails to match anything (English input against a Vietnamese-keyed dictionary) and returns it
  unchanged. Verified this doesn't double-translate or corrupt migrated strings.
- **Both systems read the same `localStorage['vlcm_lang']` key**, so the existing language-toggle
  button flips both consistently on one click + reload.

This means the migration can proceed incrementally, string-by-string or panel-by-panel, without
ever having a broken or half-translated build in between.

## How to migrate a string

1. Find the hardcoded Vietnamese literal in `game.js`.
2. Add a key for it to **both** `public/game/strings/en.js` (write the real English copy) and
   `public/game/strings/vi.js` (move the original Vietnamese text there, unchanged).
3. Replace the literal in `game.js` with `t('your.key')` (or `t('your.key', {name: x})` for the
   rare case with an interpolated value — `t()` does simple `{var}` substitution).
4. Verify both locales render correctly (see the test pattern below).

Keys are dotted and grouped by UI area (`hud.*`, `panel.char.*`, `quest.*`, etc.) — follow the
existing `hud.hint.*` group as the pattern. Don't add a key for something that's only ever
shown once inline nowhere-reused unless it's genuinely player-facing copy — see the design
skill's "tweaks are levers, not copy" instinct applied here too: **every key should be real,
reusable, translatable content**, not a mechanism for parameterizing internal logic.

## Status

**Migrated (proof-of-pattern slice):** `hintText()` — the bottom hint bar, 12 keys, level-gated
segments, fully tested in both locales.

**Not yet migrated** (still hardcoded Vietnamese, currently covered by `lang.js`'s regex
translator): the vast majority of the game — quest text, NPC dialogue, shop copy, panel
headers/labels, item/material flavor text, tooltips, cheat console help text, story intro. This
is genuinely the bulk of the Phase 1 work and is a large, mechanical-but-not-automatable grind
(each string needs a real authored English version, not a literal translation, to read naturally)
— budget it as ongoing content work, not a single sitting.

**Suggested migration order** (highest player-visible value first):
1. HUD chrome (partially done — finish `updateHud()`'s remaining inline strings)
2. Panel headers + static labels (character/inventory/skill/map panels — mostly short, low-risk)
3. Shop copy (`SHOPS` — bounded, ~4 NPCs)
4. NPC dialogue + quest text (`QUESTS`, `SIDE_QUESTS`, `NPCS`) — the actual writing work, do this
   alongside the Phase 3 story rewrite (Lunacia/Sigils framing) rather than as a separate pass,
   since both need the same creative attention at the same time.
5. Item/material tooltips, cheat console help — lowest visibility, do last.

A simple grep for template-literal Vietnamese (`grep -oP "'[^']*[ÀÁẢÃẠ...][^']*'" game.js` or
similar, tuned for the actual diacritic ranges used) can generate a rough worklist of remaining
un-migrated strings when someone picks this back up.
