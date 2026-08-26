# AI art prompts — everything still unsourced

199 of ~290 asset files have no matching Axie source art anywhere found in the Drive survey
(see `docs/ASSET_SOURCING.md`) or in the follow-up dig (Project T's real asset payloads — the
1.19GB `CharacterAnimation.zip` and friends — are over this environment's 10MB download cap and
literally can't be pulled here; the `2.In Game` folder is still unreadable via the API). The paths
forward for these are: run these prompts through an image generator, or revisit sourcing once
`2.In Game` is fixed or someone can grab the zips directly in the Drive UI.

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

## Items — equipment icons (17 of 24 files remaining, `assets/items/`)

7 slots are now sourced from the real "2d land assets item" Drive library — see
`docs/ASSET_SOURCING.md` — and no longer need prompts: `ao.png`, `chan.png`, `daychuyen.png`,
`nhan.png`, `non.png`, `tay.png`, `vukhi.png`.

Template: *"[shared style guide]. A single piece of [SLOT] equipment icon for an Axie-themed RPG,
[MATERIAL/RARITY FLAVOR] craftsmanship, no character wearing it — just the item itself, icon
framing (fills ~80% of a square canvas)."*

| File | Slot | Suggested flavor |
|---|---|---|
| `aochoang.png` | cape/cloak | flowing, mid tier |
| `canh.png` | wing/back accessory | leaf or shell-textured |
| `pet.png` | companion charm | tiny chibi creature charm |
| `quan.png` | pants/lower body | matches `ao` |
| `mat_antranai.png` | mask — "Serpent Eye" | reptile-scale motif, green |
| `mat_bac.png` | mask — "Silver" | plain polished silver |
| `mat_dotpha.png` | mask — "Breakthrough" | cracked/glowing seam, gold accent |
| `mat_honnguyen.png` | mask — "Primordial" | ancient stone texture, high rarity |
| `mat_huyenthiet.png` | mask — "Dark Iron" | dark metal, angular |
| `mat_manhcothan.png` | mask — "Bone Blade" | bone-white, jagged edges |
| `mat_manhtrangbi.png` | mask — "Hidden Armor" | plated, defensive |
| `mat_phongphu.png` | mask — "Wind Talisman" | light, feathered/wind-swept |
| `mat_phu.png` | mask — "Talisman" | paper-charm motif |
| `mat_tanquyen.png` | mask — "New Fist" | martial, fist-motif engraving |
| `mat_tichma.png` | mask — "Accumulated" | layered/stacked plates, common tier |
| `mat_tiendan.png` | mask — "Immortal Cinnabar" | red/gold, high rarity glow |
| `mat_tula.png` | mask — "Asura" | fierce, horned, red |

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

## Trees & rocks (11 files, `assets/trees/`, decoration sprites)

Template: *"[shared style guide]. A single decorative [OBJECT], simple silhouette-friendly shape
for scattering across a game map as scenery, no character."*

8 region-named tree variants (`chungnam.png`, `comoc.png`, `daohoa.png`, `mongco.png`, `ngoai.png`,
`nhanmon.png`, `tuongduong.png`, `tuyettinh.png`) — vary the tree style per region's mood (e.g.
`daohoa` = flowering/petal tree for "Petalshade Isle", `tuyettinh` = frost-touched tree for
"Frostmire Vale") using the region descriptions in `game.js`'s `MAPS` object as a guide.

3 rocks (`rock1.png`, `rock2.png`, `rock3.png`) — plain rounded boulders, 3 size/shape variants.

## Skills — sect ability icons (14 files, `assets/skills/`)

These already have real names/elements from `SECTS` in `game.js` — use them directly. Template:
*"[shared style guide]. An ability icon depicting '[SKILL NAME]', a [ELEMENT]-themed martial
technique, dynamic action-burst composition, icon framing."*

| Files | Class | Element | Skill names |
|---|---|---|---|
| `tl_a.png` / `tl_tp.png` | Mech | Metal | Iron Shell Slam / Overdrive Crush |
| `tc_a.png` / `tc_tp.png` | Aquatic | Water | Tide-Cutting Wave / Seven Currents Convergence |
| `cm_a.png` / `cm_tp.png` | Dusk | Wood | Twin Ring Cut / Hollow Moon Blade |
| `bd_a.png` / `bd_tp.png` | Reptile | Water | Serpent Fang Toxin / Venomtide Breath |
| `mg_a.png` / `mg_tp.png` | Beast | Fire | Sacred Flame Chain / Heaven-and-Earth Reversal |
| `dt_a.png` / `dt_tp.png` | Bird | Earth | Sunpoint Strike / Six Pulses Barrage |
| `dh_a.png` / `dh_tp.png` | Plant | Wood | Petalfall Dance / Tideborn Bloom |

## Skills — generic weapon/tier icons (28 files, `assets/skills/`)

7 generic combat icons (`amkhi.png`, `basic.png`, `bow.png`, `slash.png`, `gangkhi.png`,
`tieuhon.png`, `danchi.png`) — simple universal icons: a thrown dart/hidden-weapon, a basic strike
burst, a bow, a slash arc, a bladed melee weapon, a soul-wisp effect, a finger-flick strike.

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
