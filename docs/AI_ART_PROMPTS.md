# AI art prompts — everything still unsourced

~80 of ~290 asset files have no matching Axie source art anywhere found across six Drive surveys
plus two passes through the official `axieinfinity/axie-origins-asset-kit` — see
`docs/ASSET_SOURCING.md` for the full history. The asset kit is now **fully surveyed** (every
subfolder opened and either used or explicitly ruled out) — it has nothing left to give. NPCs and
mounts in particular are still mostly empty — nothing surveyed anywhere has wuxia-role portraits
(merchant, elder, gatekeeper, etc.) or side-view creature-mount designs for most of the remaining
slots. The paths forward for what's left: run these prompts through an image generator, revisit
sourcing once `2.In Game` (still unreadable via the Drive API) is fixed, or grab the oversized Drive
PSDs (>10MB, over this environment's download cap) directly in the Drive UI.

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

## NPCs — portrait icons (12 of 15 files remaining, `assets/npcs/`)

`daosi.png`, `thoren.png`, and `truonglang.png` are now sourced from the Axie Origins asset kit
(see `docs/ASSET_SOURCING.md`'s eighth source). The kit is fully exhausted — nothing else in it
matches a wuxia-role portrait — so the rest need generated art:

Template: *"[shared style guide]. A friendly [ROLE] Axie character, [PROPS], three-quarter portrait
bust, standing pose."*

| File | Role | Props |
|---|---|---|
| `binhkhi.png` | weapons dealer | holding/surrounded by simple weapons |
| `duoclao.png` | elder apothecary | mortar & pestle, herb basket |
| `duocsu.png` | apothecary | potion bottles |
| `laotuong.png` | old general/merchant | simple armor piece, ledger |
| `monkhach.png` | guest disciple | plain traveling clothes |
| `noiung.png` | inner-sect steward | formal robe |
| `quachtinh.png` | named hero NPC | simple heroic pose, no weapon drawn |
| `thumo.png` | gatekeeper | simple guard stance |
| `thuongnhan.png` | traveling merchant | pack/cart props |
| `trachu.png` | teahouse keeper | teapot, cup |
| `ttmon.png` | gate disciple | plain training clothes |
| `vachda.png` | cave hermit | rustic, simple |

## Mounts (7 of 8 files remaining, `assets/mounts/`, side-view profile pose)

`3_satlang.png` (dark wolf tier) is now sourced — a real alpha-wolf portrait from the Axie Origins
asset kit, close enough to "dark wolf-like creature" to use directly (front-facing bust, not a true
side-view running pose — the kit had no side-profile mount-style art, this was the closest real fit
available and still beats a placeholder). No horse, tiger, lion, leopard, qilin, or dragon-serpent
art exists anywhere surveyed (confirmed twice — see `docs/ASSET_SOURCING.md`'s Eleventh and Twelfth
sources, the second a widened GitHub-wide search specifically for these 7 shapes) — those 7 need
generated art. Ready-to-paste prompts below, one per file, each opening with the shared style guide
verbatim; power tier escalates visually 1→8 (plainer/smaller at tier 1, most ornate/glowing at tier
8) to match `MOUNT_TIERS`' own in-game progression order.

**`1_hacma.png`** (tier 1, entry mount):
> Cute rounded creature-blob character design in the Axie Infinity house style. Thick clean dark
> outline (~4-6px at icon scale), flat cel-shaded color fills with minimal soft gradient shading, no
> photorealism, no painterly brushwork. Simple bold shapes, large expressive eyes where a face is
> present. Bright saturated palette. Centered composition, isolated on a transparent background, no
> drop shadow, no background scenery. A rideable black horse-like Axie creature: chunky rounded body,
> short stubby legs, small flowing mane, no rider, no saddle, side-view profile, standing pose. Charcoal
> black and dark grey coloring, plain and friendly, no ornamentation — this is the cheapest/first mount
> tier.

**`2_hoangma.png`** (tier 2):
> [same shared style guide as above]. A rideable golden/yellow horse-like Axie creature: chunky
> rounded body, short stubby legs, a small mane with a couple of braided tassels, no rider, no
> saddle, side-view profile, standing pose. Warm golden-yellow and cream coloring, a little more
> decorated than a plain horse but still a modest early-game mount.

**`4_thanho.png`** (tier 4, armored tiger):
> [same shared style guide]. A rideable white tiger-like Axie creature: chunky rounded body, black
> tiger stripes, small chibi paws, wearing a couple of simple armor-plate pieces on its shoulders and
> chest, no rider, side-view profile, standing/prowling pose. White, black, and steel-grey coloring —
> reads as a sturdy mid-tier war-mount.

**`5_sutu.png`** (tier 5, golden lion):
> [same shared style guide]. A rideable lion-like Axie creature: chunky rounded body, a small fluffy
> mane framing its face, no rider, side-view profile, standing regal pose. Golden-tan body with a
> darker amber mane — reads as a proud, slightly more prestigious mount than the tiers below it.

**`6_viembao.png`** (tier 6, flame leopard):
> [same shared style guide]. A rideable leopard-like Axie creature: chunky rounded body, flame-shaped
> orange-and-red patterned spots instead of ordinary leopard spots, a few small ember/spark particles
> drifting off its back, no rider, side-view profile, running pose. Fiery orange-red palette with dark
> ember-black spot outlines — should read as faster and more elite than the tiers below it.

**`7_kylan.png`** (tier 7, qilin):
> [same shared style guide]. A rideable qilin — a mythical hybrid Axie creature combining a deer's
> antlers/horn, a lion-like mane, and hooved legs, with a single ornate horn on its forehead. Chunky
> rounded body, no rider, side-view profile, standing pose with a soft golden elite-tier glow/aura
> outline around its silhouette and a few small floating light particles. Warm gold and cream
> coloring — reads as a rare, elite near-top-tier mount.

**`8_longlan.png`** (tier 8, Azure Dragon, top tier):
> [same shared style guide]. A rideable Eastern-dragon-inspired Axie creature: a chunky, rounded,
> serpentine body coiled into a compact mountable pose (not a long snake — keep it creature-blob
> proportioned like the rest of the mount tiers), small decorative wing-fins along its back, a pair
> of short ornate horns, no rider, side-view profile. Azure-blue and gold scale coloring with a
> glowing cyan energy aura outline and a few small sparkle/light particles around it — this is the
> single most powerful, most ornate mount tier in the game, should visually read as clearly a cut
> above every tier before it.

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

## Tien — Ascension/Starflight endgame skin (12 files, `assets/tien/`)

The rename decision this section used to flag as open is now **resolved and shipped**: the
cultivation system is renamed per `docs/NAMING_MAP.md` (Đan Điền→Ascension, Phi Thăng→Starflight,
Quẻ Tiên Thiên→The Hatching — see `game.js`'s `DANTIAN_REALMS`/`TIEN_IMGS` and the commits that did
this rename this session). `tien/{gender}_{skin}.png` (`nam`/`nu` × `bach`/`thanh`/`kim`/`huyen`/
`hong`/`lam`) is the visual the player's own sprite switches to once fully ascended ("Starflight") —
currently still the old wuxia winged-immortal-in-robes painting (confirmed via live screenshot).
Two independent searches (Drive + a widened GitHub sweep, see `docs/ASSET_SOURCING.md`'s Eleventh
and Twelfth sources) found no matching Axie-universe art anywhere, human or creature — this needs
generated art.

The user explicitly said a **human** Axie-Infinity-style Trainer character is an acceptable
replacement here (doesn't have to be a round Axie creature) — framed as a Trainer who has achieved
Starflight, radiating cosmic/starlight energy rather than wuxia Taoist-immortal energy. Same
approach the game already uses elsewhere for tiered variants (one real base image + programmatic
recolor): generate 2 base images (one per gender) at full detail, then recolor each into the 6
`bach`/`thanh`/`kim`/`huyen`/`hong`/`lam` variants via a simple hue/palette shift (bach=white/silver,
thanh=teal/cyan, kim=gold, huyen=deep violet/black, hong=rose/pink, lam=deep blue) — 2 generations
instead of 12, same result the game needs (12 filenames, `nam_bach.png` … `nu_lam.png`).

**`nam_bach.png`** (base for all 6 `nam_*` recolors):
> Cute rounded creature-blob character design in the Axie Infinity house style, adapted here to a
> human Trainer character rather than a creature — but keep it in the same bold-outline, flat
> cel-shaded, no-photorealism art direction as the rest of the game. A young adult male Trainer
> figure, floating/hovering slightly above the ground in a calm meditative pose, robes and hair
> gently billowing as if caught in a soft cosmic wind, radiating a subtle starlight/aurora-like glow
> around their body and a faint trail of small glowing star-particles. Confident, serene expression.
> Full-body, centered composition, isolated on a transparent background, no drop shadow, no
> background scenery. Base coloring: soft white and silver, so it can be recolored into other
> palettes afterward — keep shading simple/flat rather than baked-in colored lighting, so a hue shift
> reads cleanly.

**`nu_bach.png`** (base for all 6 `nu_*` recolors):
> [identical prompt to `nam_bach.png` above, but a young adult female Trainer figure instead — same
> floating meditative pose, same starlight-glow treatment, same flat white/silver base coloring for
> clean recoloring later.]

Then produce the other 10 files by hue-shifting each base image's dominant color per this key (this
can be done with any image editor's hue/saturation tool, or ask an image generator for "the same
character, recolored to a [X] palette" using the base image as a reference):

| Skin | Palette |
|---|---|
| `thanh` | teal / cyan |
| `kim` | gold / amber |
| `huyen` | deep violet / near-black |
| `hong` | rose / pink |
| `lam` | deep blue / indigo |

## Dantian / Quze — cultivation-mechanic icons (34 files) — not yet requested, flagged for later

`dantian/` (17 files: meridian-track icons) and `quze/` (17 files: The Hatching's card-back +
trait-card art, currently bagua/yin-yang-trigram styled) still carry wuxia visual language even
though their underlying systems are already renamed (Instinct Channels, The Hatching). Nobody has
asked for these yet this session — noted here so the next pass doesn't have to re-discover that the
naming decision (which unblocked `tien/` above) applies to these too, whenever someone wants to
tackle them.
