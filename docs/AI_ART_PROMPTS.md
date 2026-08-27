# AI art prompts — everything still unsourced

~83 of ~290 asset files have no matching Axie source art anywhere found across six Drive surveys
plus a pass through the official `axieinfinity/axie-origins-asset-kit` — see `docs/ASSET_SOURCING.md`
for the full history. NPCs and mounts in particular are still mostly empty — nothing surveyed so far
has wuxia-role portraits (merchant, elder, gatekeeper, etc.) or side-view creature-mount designs.
The paths forward for what's left: run these prompts through an image generator, revisit sourcing
once `2.In Game` (still unreadable via the Drive API) is fixed, grab the oversized Drive PSDs
(>10MB, over this environment's download cap) directly in the Drive UI, or dig further into the
asset kit's unexplored `PvE/UI` folder (94 files, not fully surveyed).

Every filename below is the exact target path under `public/game/assets/<category>/` — generate,
crop/pad to a clean transparent PNG, and drop it in with the same filename to wire it in (no code
changes needed, same as the class portraits).

## Shared style guide

Base every prompt on this, drawn from the real Axie art already in the repo (the 9 class portraits
and `docs/ASSET_SOURCING.md`'s sourced sprites are the ground truth — look at those first):

> Cute rounded creature-blob character design in the Axie Infinity house style. Thick clean dark
> outline (~4-6px at icon scale), flat cel-shaded color fills with minimal soft gradient shading,
> no photorealism, no painterly brushwork. Simple bold shapes, large expressive eyes where a face
> is present. Bright saturated palette. Centered composition, isolated on a transparent background,
> no drop shadow, no background scenery unless the prompt says otherwise.

## Items — equipment icons (4 of 24 files remaining, `assets/items/`)

20 slots are now sourced (19 from the "2d land assets item" Drive library, `pet.png` from the Axie
Origins asset kit's Tools cards — see `docs/ASSET_SOURCING.md`). A whole-Drive title search
confirmed there is no cape, pants, bone-white, or fist-motif item anywhere — those 4 genuinely need
generated art:

Template: *"[shared style guide]. A single piece of [SLOT] equipment icon for an Axie-themed RPG,
[MATERIAL/RARITY FLAVOR] craftsmanship, no character wearing it — just the item itself, icon
framing (fills ~80% of a square canvas)."*

| File | Slot | Suggested flavor |
|---|---|---|
| `aochoang.png` | cape/cloak | flowing, mid tier |
| `quan.png` | pants/lower body | matches `ao` |
| `mat_manhcothan.png` | mask — "Bone Blade" | bone-white, jagged edges |
| `mat_tanquyen.png` | mask — "New Fist" | martial, fist-motif engraving |

## NPCs — portrait icons (15 files, `assets/npcs/`)

Template: *"[shared style guide]. A friendly [ROLE] Axie character, [PROPS], three-quarter portrait
bust, standing pose."*

| File | Role | Props |
|---|---|---|
| `binhkhi.png` | weapons dealer | holding/surrounded by simple weapons |
| `daosi.png` | wandering mystic | robe, staff |
| `duoclao.png` | elder apothecary | mortar & pestle, herb basket |
| `duocsu.png` | apothecary | potion bottles |
| `laotuong.png` | old general/merchant | simple armor piece, ledger |
| `monkhach.png` | guest disciple | plain traveling clothes |
| `noiung.png` | inner-sect steward | formal robe |
| `quachtinh.png` | named hero NPC | simple heroic pose, no weapon drawn |
| `thoren.png` | shopkeeper | apron, counter props |
| `thumo.png` | gatekeeper | simple guard stance |
| `thuongnhan.png` | traveling merchant | pack/cart props |
| `trachu.png` | teahouse keeper | teapot, cup |
| `truonglang.png` | sect leader | formal robe, authoritative pose |
| `ttmon.png` | gate disciple | plain training clothes |
| `vachda.png` | cave hermit | rustic, simple |

## Mounts (7 of 8 files remaining, `assets/mounts/`, side-view profile pose)

`3_satlang.png` (dark wolf tier) is now sourced — a real alpha-wolf portrait from the Axie Origins
asset kit, close enough to "dark wolf-like creature" to use directly (front-facing bust, not a true
side-view running pose — the kit had no side-profile mount-style art, this was the closest real fit
available and still beats a placeholder). No horse, tiger, lion, leopard, qilin, or dragon-serpent
art exists in anything surveyed so far — those 7 still need generated art:

Template: *"[shared style guide]. A rideable [CREATURE] mount, side-view profile, standing/running
pose, no rider."*

| File | Tier | Creature |
|---|---|---|
| `1_hacma.png` | 1 | black horse-like creature |
| `2_hoangma.png` | 2 | golden/yellow horse-like creature |
| `4_thanho.png` | 4 | armored tiger-like creature |
| `5_sutu.png` | 5 | lion-like creature, small mane |
| `6_viembao.png` | 6 | flame-patterned leopard-like creature |
| `7_kylan.png` | 7 | qilin — dragon-horned deer/lion hybrid, elite glow |
| `8_longlan.png` | 8 | dragon-serpent hybrid, top-tier, ornate |

## Rocks (3 files, `assets/trees/`, decoration sprites)

All 8 region tree sprites are now sourced (real painted Axie-style trees, see
`docs/ASSET_SOURCING.md`) — only the rocks remain unsourced.

Template: *"[shared style guide]. A single decorative rounded boulder, simple silhouette-friendly
shape for scattering across a game map as scenery, no character."*

3 rocks (`rock1.png`, `rock2.png`, `rock3.png`) — plain rounded boulders, 3 size/shape variants.

## Skills — sect ability icons (all 14 sourced)

All 7 elemental pairs (Metal/Mech, Water/Aquatic+Reptile, Wood/Dusk+Plant, Fire/Beast, Earth/Bird)
now use real Axie ability-burst art — see `docs/ASSET_SOURCING.md`. Nothing left in this category.

## Skills — generic weapon/tier icons (1 of 28 files remaining, `assets/skills/`)

`basic.png`, `slash.png`, `gangkhi.png`, `tieuhon.png`, `amkhi.png`, `danchi.png` are sourced, plus
all 14 `th_amkhi_1..7` / `th_gangkhi_1..7` tiers (procedurally tiered from the same sourced bases —
see `docs/ASSET_SOURCING.md`). Only `bow.png` and its 7 tiers (`th_bow_1..7.png`) remain — no bow
artwork found in any source surveyed so far:

Template: *"[shared style guide]. A simple bow, Axie-proportioned, icon framing."* for `bow.png`;
for the 7 tiers: *"Tier [N] of 7 — escalate visual intensity by tier: tiers 1-2 plain material, 3-4
add a colored glow/aura, 5-6 add small particle effects, 7 full elemental aura with sparks."*

## Skills — named technique icons (all 64 sourced)

`fs_*.png` (30 files) and `vh_*.png` (34 files — corrected count; earlier docs said 39+36=75, that
was wrong) are each named after a specific wuxia martial-arts technique. All 64 now use real
distinct hand-painted ability-card art from the Axie Origins asset kit's `Cards/Tools` folder (81
available icons, round-robin assigned so every technique gets a unique image) — see
`docs/ASSET_SOURCING.md`. This is honestly a **visual-variety assignment, not a semantic
translation** — nobody translated all 64 Vietnamese technique names and hand-picked a thematically
matching icon per name; every file just got a distinct real piece of Axie ability art instead of a
solid-color placeholder. Revisit with real per-name curation later if it matters.

## Dantian / Quze / Tien (46 files) — needs a design decision, not just a reskin

These three folders back the wuxia **cultivation system** — meridian/dantian progression
(`dantian/`, 17 files: the 8 primary + 9 secondary meridians of neijia cultivation), "fated
encounters" mechanics (`quze/`, 17 files), and **immortal ascension** skins (`tien/`, 12 files: 2
genders × 6 color variants for the "transcend the mortal world" endgame prestige system). None of
this has an Axie-universe equivalent — "meridians" and "Taoist immortality" are wuxia-genre
concepts, not Axie ones. Reskinning the icons without renaming the underlying mechanic would be
cosmetic-only and still read as wuxia.

Before generating art for these, decide: keep the mechanic and just restyle the *icons* (fastest,
still conceptually wuxia underneath), or rename/reframe the mechanic itself into something
Axie-native (e.g. an "Anima flow" energy system instead of meridians, a "Chimera Blessing" instead
of immortal ascension) the way Phase 2 already renamed the class roster — that's a content/design
call, not something to default into via image prompts.
