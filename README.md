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
| Art | **Blocked on the Axie asset folder** — not yet provided. All renamed systems currently render with placeholder/prototype art; asset paths for the 2 new classes are pre-wired at `assets/classes/` for a drop-in swap once art lands |
| Story / quests / NPC dialogue | Not yet rewritten — still wuxia-prototype content pending the Lunacia/Sigils narrative pass |
| Online encounters (shared world boss, arena PK) | Not started — Phase 5 in the proposal, comes after the reskin |

## Dev workflow

Same as the prototype it's built on:

```
npm install
cp .env.example .env
npm run dev        # single Vite process, /api/* proxied in-process to Hono
npm run check       # tsc -b
npm test            # vitest
```

The game engine itself (`public/game/`) has no build step — edit `game.js`/`i18n.js`, reload
the page.
