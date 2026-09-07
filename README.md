# Axie Rift

A browser action-RPG set in Lunacia, in the style of classic MU Online — single-file canvas 2D,
no build step for the game itself. Original IP built on Axie Infinity lore; see
[`docs/LORE_BIBLE.md`](docs/LORE_BIBLE.md).

The engine was migrated from a shipped wuxia action RPG rather than written from scratch. That
migration is finished: the wuxia setting, vocabulary and systems have been removed. What still
reads like the old game is deliberate — directory and deploy paths (`axie-wuxia`,
`/var/www/axiewuxia`) kept because renaming them would break the live deploy, and class/NPC keys
(`thieulam`, `quachtinh`, …) kept for save compatibility. Neither ever reaches player-visible text.

- **[`CLAUDE.md`](CLAUDE.md)** — the working spec. Read it before changing anything: it carries the
  three standing rules (MU style not wuxia · no MU Online proper nouns in player text · no vector
  art) and the measured reasons behind most design decisions.
- **[`AGENTS.md`](AGENTS.md)** — the short version of those rules.
- **[`docs/`](docs/)** — decision journal. Historical by design; entries are not rewritten when
  things change, so read dates and cross-check against the code.

## What's in it

| | |
|---|---|
| Classes | 5 — Dark Knight · Sylvan Ranger · Dark Wizard · Spellblade · Dark Lord |
| Maps | starting town (Quảng Trường Cũ) · 2 safe hubs · 6 wilderness regions, levels 1–120 |
| Quests | 33-quest main chain across 5 chapters, grounded in Axie lore |
| Gear | 14 tiers, per-class sets, socketing, Chaos Machine upgrades, 3 wing tiers |
| Systems | Ragoon contracts (gacha), spirit pets, mastery, mob roles + elite mutations, wave arenas |
| Tests | 174 Playwright regression tests (`tools/reg.sh`) + 7 vitest unit tests |

⚠ Known gap: 6 of 8 region backgrounds are side-view battle backdrops used as ground, which makes
the player read as floating in mid-air. Diagnosis, geometry constraints and regeneration prompts
are in [`docs/PROMPT_MAP_ISOMETRIC.md`](docs/PROMPT_MAP_ISOMETRIC.md).

## Quick start — just play the game

`public/game/` is a self-contained static app (canvas + vanilla JS, no build step, no backend
required for local play/testing). Clone the repo, then serve that folder with anything static:

```
git clone https://github.com/ShanKyos/axiewuxia.git
cd axiewuxia/public/game
python3 -m http.server 8850
# or: npx serve -l 8850
```

Open `http://localhost:8850/` in a browser — no npm install, no `.env`, no database. Auth and
cloud-save calls to `/api/*` will fail (there's no backend behind a static server) but the game
degrades to local-only play, which is enough to test classes, art, combat, and the i18n flip.

## Full dev workflow

For the real app (auth, save, cloud sync — the Vite + Hono + tRPC + MySQL shell around the game):

```
npm install
cp .env.example .env
npm run dev                    # single Vite process, /api/* proxied in-process to Hono
npm run check                  # tsc -b
npm test                       # vitest
bash tools/reg.sh /tmp/reg-x   # full Playwright regression, ~15 min
```

The game engine itself (`public/game/`) has no build step even in this mode — edit
`game.js`/`i18n.js`, reload the page.
