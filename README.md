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
| Skill evolution choice nodes (new, P0 from the competitive-analysis roadmap) | At skill level 40/80/120 the player now picks a permanent path per skill — Bá Đạo (+14% damage, stacks) or Tốc Chiến (−9% cooldown & −6% Qi cost, stacks) — instead of a fixed automatic bonus. Reuses the existing 1–120 skill-level system and all skill icons; no new art. See `upgradeSkillUI`/`showEvoChoice`/`skEvoMult` in `game.js` |
| Bế Quan offline seclusion gains (P0 from the roadmap) | Already shipped in the inherited GHHA engine, unchanged — verified this session. Caps at 8h offline, scales with cultivation realm, shows a "Bế Quan Xuất Thế" results screen on return. See `grantOfflineGains`/`showOfflineGains` in `game.js` |
| Boss capture → channel form (new, P0 from the roadmap) | Defeating any of the 7 region Trấn Ải (trial-lord) bosses for the first time permanently unlocks the ability to temporarily transform into it — press **P** in combat for a 14s transformation: full sprite swap (reusing the boss's own Axie art), +25% attack, an elemental-glow aura, and an opening AoE burst. 90s cooldown. Pick a default form and see unlocked forms in the new **☬ Hóa Thân** character-panel tab. See `activateChannelForm`/`channelFormsUnlocked` in `game.js` |
| Vạn Kiếm Tu La Trận — roguelike tower (new, P1 from the roadmap) | An endless-wave survival mode: clear a wave of enemies (reused Axie mob art, scaling difficulty), then draft 1 of 3 temporary buff cards — each flavored with a real name/icon pulled live from all 34 martial-arts techniques + 30 fusions — or stop and bank the run. Buffs reset on death or voluntary stop; only the best wave reached persists as a personal record. New **🌀 Tu La Trận** character-panel tab to start/stop. See `startTowerRun`/`towerNextWave`/`towerOfferDraft` in `game.js` |
| Early traversal toys (new, P1 from the roadmap) | Basic air-dash (Lăng Ba Vi Bộ) is now available from level 1 instead of Đan Điền realm 7 — WWM proved movement itself is the wuxia feeling and shouldn't be locked to end-game. The second jump charge + 10% move speed still unlocks progressively, just much earlier now, at realm 5 (Trúc Cơ) instead of 7. Pure threshold change; no new mechanic. See `calcDerived`/`doJump` in `game.js` |
| Alchemy lab — Luyện Đan (new, P1 from the roadmap) | Field herbs (previously a quest-only pickup with no inventory) now also stock a persistent Thảo Dược count, spendable at a new **🧪 Luyện Đan** character-panel tab on 5 pill recipes: instant full heal, poison cure, a temporary damage buff, and 2 permanent stat pills (capped at 2/day, sharing the same permanent-bonus pool as Nội Đan swallowing). See `ALCHEMY_RECIPES`/`craftPill` in `game.js` |
| Click-to-move (new, design discussion this session) | Right-click (or tap the minimap) walks the player to that point, auto-avoiding obstacles — a Diablo/PoE-style alternate control scheme layered on top of WASD/joystick, which still work exactly as before and cancel a pending click-target the moment they're used. A live dashed preview line (simulated ahead of time through the same obstacle-resolution math real movement uses, so it's never wrong) shows the route before and while walking, including the detour around large obstacles like the Đào Hoa lake. Left-click still only attacks — unchanged. See `setMoveTarget`/`simulateMovePath`/`resolveObstaclePoint` in `game.js` |
| 9-class roster (was: 7 sects) | Renamed + 2 new classes (Bug, Dawn) added, tested |
| 8 regions + 7 trial chambers (was: maps/dungeons) | Renamed, tested |
| i18n system (English-first) | New key-based `t()` engine built and proven on one real slice; bulk of game text still pending migration — see the guide above |
| Art — class portraits (9/9) | Done — real Axie art wired into `assets/classes/` for all 9 classes. See `docs/ASSET_SOURCING.md` |
| Art — mobs (24/30) | Real sourced Axie art, including 20 from the official `axie-origins-asset-kit` (Vibeathon-licensed). `kybinh`, `kylan`, `phando`, `thinu`, `trannhan`, `ttdetu` still unmatched — see `docs/ASSET_SOURCING.md` |
| Art — maps (8/8 regions), trees (8/8 regions) | All 8 region backgrounds and all 8 region tree sprites now use real sourced Axie/painted art. Only the 3 decoration rocks have no source match yet — see `docs/ASSET_SOURCING.md` |
| Art — items (20/24) | Weapon/ring/necklace/helmet/gloves/robe/legs/wing/pet + 11 masks now use real sourced Axie icons. Cape, pants, and 2 masks have no source match — see `docs/ASSET_SOURCING.md` |
| Art — skill icons (80/~86 files) | All 14 elemental ability pairs, all generic weapon icons except `bow`, all 14 tiered weapon icons, and all 64 named technique icons now use real sourced Axie art (the official `axie-origins-asset-kit`, Vibeathon-licensed, filled most of this). Only `bow.png` + its 7 tiers remain — see `docs/ASSET_SOURCING.md` |
| Art — mounts (1/8) | `3_satlang` (dark-wolf tier) sourced from the asset kit. The other 7 (horse/tiger/lion/leopard/qilin/dragon) have no matching creature found anywhere — see `docs/ASSET_SOURCING.md` |
| Art — NPCs (3/15), trees/rocks (8/11) | All 8 region trees are sourced; `daosi`, `thoren`, `truonglang` NPC portraits now use real sourced Axie art. The 3 rocks and the other 12 NPC portraits have no source match found anywhere — `axie-origins-asset-kit` is now fully surveyed, see `docs/ASSET_SOURCING.md` |
| Audio — BGM/SFX (8 files) | Done — real Axie-branded tracks (4 BGM + 4 sfx) committed now that the repo is private; the earlier copyright-caution `.gitignore` rule no longer applies to the company's own internal assets in a private repo |
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
