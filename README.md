# Axie Wuxia

An Axie Infinity adventure RPG, built by migrating **Giang Hồ Huyễn Ảnh**, a shipped,
production-tested wuxia action RPG — reskinning its engine, systems, and content into the Axie
universe rather than building an open-world RPG from scratch. See
[`docs/`](docs/) for the product proposal's execution plan.

- **Product proposal & rationale:** ask in-repo or see the original `Axie_Wuxia_Product_Proposal.docx`.
- **[`docs/NAMING_MAP.md`](docs/NAMING_MAP.md)** — the class roster (7 sects → 7 classes + 2 new)
  and full system/region rename table everything else executes against.
- **[`docs/I18N_MIGRATION_GUIDE.md`](docs/I18N_MIGRATION_GUIDE.md)** — how the English-first
  language flip works and how to continue migrating remaining content.

## Status

| Area | State |
|---|---|
| Engine (combat, progression, save, auth, cloud sync) | Unchanged from the prototype — already production-tested |
| 9-class roster (was: 7 sects) | Renamed + 2 new classes (Bug, Dawn) added, tested |
| 8 regions + 7 trial chambers (was: maps/dungeons) | Renamed, tested |
| i18n system (English-first) | New key-based `t()` engine built and proven on one real slice; bulk of game text still pending migration — see the guide above |
| Art — class portraits (9/9) | Done — real Axie art wired into `assets/classes/` for all 9 classes. See `docs/ASSET_SOURCING.md` |
| Art — mobs (1/30), maps (3/8 regions) | Started — `boar` mob + 3 region backgrounds now use real sourced Axie art. The rest have no confident source match found yet — see `docs/ASSET_SOURCING.md` |
| Art — items (7/24) | Started — weapon/ring/necklace/helmet/gloves/robe/legs now use real sourced Axie icons. Remaining slots (masks, cape, wing, pants, pet) have no source match yet — see `docs/ASSET_SOURCING.md` |
| Audio — BGM/SFX | Real Axie-branded tracks found in the Drive (4 BGM + 4 sfx) and proven to work locally, but intentionally **not committed** — `.gitignore` excludes `assets/music/` for copyright reasons and that call stands. Repro steps are documented in `docs/ASSET_SOURCING.md` |
| Art — NPCs, mounts, trees, skill icons (~199 files) | No source art found yet. `docs/AI_ART_PROMPTS.md` has ready-to-run generation prompts for everything except the cultivation-system icons (dantian/quze/tien, 46 files), which need a design decision first — see that doc |
| Story / quests / NPC dialogue | Not yet rewritten — still wuxia-prototype content pending the Lunacia/Sigils narrative pass |
| Online encounters (shared world boss, arena PK) | Not started — Phase 5 in the proposal, comes after the reskin |

## Quick start — just play the game

`public/game/` is a self-contained static app (canvas + vanilla JS, no build step, no backend
required for local play/testing). Clone the repo, then serve that folder with anything static:

```
git clone https://github.com/ShanKyos/axiewuxia.git
cd axiewuxia/public/game
python3 -m http.server 8850
# or: npx serve -l 8850
```

Open `http://localhost:8850/` in a browser. That's the whole "does the reskin actually work"
loop — no npm install, no `.env`, no database. Auth/cloud-save calls to `/api/*` will fail (there's
no backend behind this static server) but the game degrades to local-only play, which is enough to
test classes, art, combat, and the i18n flip.

## Full dev workflow

For the real app (auth, save, cloud sync — the Vite + Hono + tRPC + MySQL shell around the game):

```
npm install
cp .env.example .env
npm run dev        # single Vite process, /api/* proxied in-process to Hono
npm run check       # tsc -b
npm test            # vitest
```

The game engine itself (`public/game/`) has no build step even in this mode — edit
`game.js`/`i18n.js`, reload the page.
