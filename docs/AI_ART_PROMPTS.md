# AI art prompts — everything still unsourced

~160 of ~290 asset files have no matching Axie source art anywhere found across two Drive surveys
(see `docs/ASSET_SOURCING.md`) — the original Character/Project T tree (Project T's real payloads,
e.g. the 1.19GB `CharacterAnimation.zip`, are over this environment's 10MB download cap; `2.In
Game` is still unreadable via the API) and a second, richer round (2D concept, animation, vfx, 2D
in-game assets, 2d land assets item, music and sfx, In-game UI). NPCs and mounts in particular came
up essentially empty — Axie's concept-art library has no wuxia-role portraits (merchant, elder,
gatekeeper, etc.) or side-view creature-mount designs, only oversized PSDs (many >10MB) of named
Axie characters and 3D-isometric environment props. The paths forward for what's left: run these
prompts through an image generator, revisit sourcing once `2.In Game` is fixed or someone can grab
the oversized files directly in the Drive UI, or (lower-fidelity fallback) extract frames from the
unused walk-cycle videos (Pomodoro/Ena/Heero/Tripp/Bard/Rei) the way the class portraits were made.

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

## Items — equipment icons (5 of 24 files remaining, `assets/items/`)

19 slots are now sourced from the real "2d land assets item" Drive library — see
`docs/ASSET_SOURCING.md`. A whole-Drive title search confirmed there is no cape, wing, pants, or
pet/companion category anywhere, and no bone-white or fist-motif item for the last 2 masks — those
5 genuinely need generated art:

Template: *"[shared style guide]. A single piece of [SLOT] equipment icon for an Axie-themed RPG,
[MATERIAL/RARITY FLAVOR] craftsmanship, no character wearing it — just the item itself, icon
framing (fills ~80% of a square canvas)."*

| File | Slot | Suggested flavor |
|---|---|---|
| `aochoang.png` | cape/cloak | flowing, mid tier |
| `pet.png` | companion charm | tiny chibi creature charm |
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

## Mounts (8 files, `assets/mounts/`, side-view profile pose)

Template: *"[shared style guide]. A rideable [CREATURE] mount, side-view profile, standing/running
pose, no rider."*

| File | Tier | Creature |
|---|---|---|
| `1_hacma.png` | 1 | black horse-like creature |
| `2_hoangma.png` | 2 | golden/yellow horse-like creature |
| `3_satlang.png` | 3 | dark wolf-like creature |
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

## Skills — sect ability icons (2 of 14 files remaining, `assets/skills/`)

12 of 14 are now sourced (real Axie ability-burst art, see `docs/ASSET_SOURCING.md`) — Wood
(Dusk/`cm_*`, Plant/`dh_*`) and Water (Aquatic/`tc_*`, Reptile/`bd_*`) pairs. Metal (Mech) and Earth
(Bird) have no source art found:

These already have real names/elements from `SECTS` in `game.js` — use them directly. Template:
*"[shared style guide]. An ability icon depicting '[SKILL NAME]', a [ELEMENT]-themed martial
technique, dynamic action-burst composition, icon framing."*

| Files | Class | Element | Skill names |
|---|---|---|---|
| `tl_a.png` / `tl_tp.png` | Mech | Metal | Iron Shell Slam / Overdrive Crush |
| `dt_a.png` / `dt_tp.png` | Bird | Earth | Sunpoint Strike / Six Pulses Barrage |

## Skills — generic weapon/tier icons (4 of 28 files remaining, `assets/skills/`)

`basic.png`, `slash.png`, `gangkhi.png`, `tieuhon.png` are sourced. Still needed: `amkhi.png`
(thrown dart/hidden-weapon), `bow.png`, `danchi.png` (finger-flick strike) — no source art found
for these three anywhere searched.

21 tiered weapon icons (`th_amkhi_1..7.png`, `th_bow_1..7.png`, `th_gangkhi_1..7.png`) — same 3
weapon types as above, 7 upgrade tiers each. Template: *"[shared style guide + base weapon shape].
Tier [N] of 7 — escalate visual intensity by tier: tiers 1-2 plain material, 3-4 add a colored
glow/aura, 5-6 add small particle effects, 7 full elemental aura with sparks."*

## Skills — named technique icons (75 files, `assets/skills/`)

`fs_*.png` (39 files) and `vh_*.png` (36 files) are each named after a specific (real or invented)
wuxia martial-arts technique — e.g. `vh_cuuamkinh` (Nine Yin Manual), `vh_hanglong` (Dragon-Subduing
Palm), `fs_thienma` (Heavenly Demon). Translating and individually art-directing all 75 is real
work I haven't done here — do this as its own focused pass, translating each filename and picking
one visual motif (a signature color, shape, or elemental effect) per technique, using this
fallback template in the meantime:

*"[shared style guide]. An ability icon for a named martial technique, dynamic energy-burst
composition in [pick a color per name — vary across the set so icons stay visually distinct],
icon framing."*

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
