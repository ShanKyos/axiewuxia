# Asset sourcing — survey findings and pipeline

Source: Sky Mavis's internal Google Drive (Character / 2.In Game / Project T / Classic (Old
Chimera) / Minigame Assets). Everything here is real Sky Mavis production/promo material — treat
it as internal asset, not freely licensed content, when deciding what ships.

## What's actually in the Drive

Most of the library is raw 3D production data (Maya `.mb` scenes, FBX meshes, `.tga`/`.png`
texture maps, Substance Painter files) — not usable as flat 2D sprites without a 3D renderer
(none available in this environment). Surveyed folders and their verdict:

- **Character/NPCA, Character/Lunacian Creatures** — mostly raw 3D + some concept PSDs
  (goblins/orcs, dryads). Not converted yet.
- **Character/Axie 3D files/Axie Render/Source** — 14 characters' Maya scenes + textures. Raw 3D,
  not usable directly.
- **Character/Axie 3D files/Axie Render/Screenshot** — 14 pre-rendered `<Name>_WalkingCycle.mp4`
  videos (Venoki, Pomodoro, Ena, Heero, Tripp, Puffy, Machito, Bard, Hope, Rei, Fantom, Momo,
  Shilin, Buba). **This is usable** — see pipeline below.
- **2.In Game** — inaccessible via the Drive API at survey time (real folder, permissions look
  fine, but every search against it returns empty, including a search by its own owner/title).
  Possibly a stale-index glitch right after sharing. Worth re-checking directly in the Drive UI.
- **Project T (3D)** — 22 environment/prop folders, all raw 3D (confirmed via one sample texture:
  a UV-unwrapped atlas, not art). Two promising unopened leads: `_ProjectT_Trailer` (7 cinematic
  MP4s) and `CharacterAnimationRender` (3 large zips, `CharacterAnimation.zip` is 1.2GB — likely
  pre-rendered animation frames, not confirmed).
- **Classic (Old Chimera)** — the linked folder ID is empty; the actual "Chimera" folder tree
  found nearby is NFT trait/rarity planning docs, not sprite art.
- **Minigame Assets → Axie Flappy Bird** — **the best find**: a complete flat 2D minigame's assets.
  Real transparent PNG sprites for 7 base Axies + 7 "Premium" costumed variants, Spine skeletal
  rig files (2D bone animation, not opened/used here), 4 painted biome backgrounds (Ocean, Forest,
  Reptile Village, Garuda Village — good map/region art candidates, not yet integrated), crystal
  icon sprites (currency/material icon candidates), and a full flat UI screen set.

## Pipeline used for the walk-cycle videos → class portraits

For characters that only exist as pre-rendered video (no flat art):

1. Pull the `_WalkingCycle.mp4` from Drive.
2. `ffmpeg -ss 1.0 -vframes 1` — grab one representative frame.
3. Mask out the bottom-left ~34% corner before background removal — these renders have a small
   duplicate flat-icon graphic baked into that corner; masking it avoids `rembg` picking up two
   disconnected blobs.
4. `rembg` (AI background segmentation) — clean cutout with a real alpha channel; the raw renders
   have a blurred photo-style background, not a clean chroma key, so simple color-keying wouldn't
   work.
5. Crop to the alpha bounding box (+12px pad), resize so the longest side is ≤800px, save as PNG.

Script: this was run ad hoc in a scratch directory, not checked into the repo (delete-and-redo if
you need to re-run it — it's about 40 lines of Python using `ffmpeg` + `PIL` + `rembg`).

## Class → source mapping (provisional — not official Axie canon)

| Class | Source | Type |
|---|---|---|
| Plant | Mit | flat (Flappy Bird) |
| Aquatic | Puffy | flat (Flappy Bird) |
| Bird | Momo | flat (Flappy Bird) |
| Beast | BING | flat (Flappy Bird) |
| Bug | Buba | flat (Flappy Bird) |
| Mech | Machito | video → converted |
| Dusk | Fantom | video → converted |
| Reptile | Shilin | video → converted |
| Dawn | Hope | video → converted |

Picks were made on visual/thematic fit (fish tail → Aquatic, leaf ears → Plant, mushroom ear →
Bug, etc.), not from any canonical Axie class chart — nothing here should be treated as "the"
answer if real class-accurate assets turn up later. Two more flat sprites (Kotaro, Venoki) and
five walk-cycle videos (Pomodoro, Ena, Heero, Tripp, Bard — Bard's download failed mid-session and
was never retried) are unused, available for NPCs/mobs/variants.

## Second survey — "2D concept" / "2d land assets item" / "music and sfx" Drive folders

A later, much richer set of Drive folders was shared directly (separate from the original
Character/2.In Game tree above): 2D concept, animation, vfx, 2D in-game assets, 2d land assets
item, and music and sfx. These are flat, game-ready 2D art (not raw 3D), so sourcing from here was
far more direct.

### Items — equipment icons

`2d land assets item` is a large library of consistent painterly 512×512 icons with verified real
alpha transparency. 7 of 24 `assets/items/` slots now use it directly (no processing needed, just
copied):

| File | Slot | Source |
|---|---|---|
| `vukhi.png` | weapon | `long-sword.png` |
| `nhan.png` | ring | `gold-ruby-ring.png` |
| `daychuyen.png` | necklace | `gold-diamond-necklace.png` |
| `non.png` | hat/helmet | `iron-helm.png` |
| `tay.png` | gloves (approximated — no glove art found) | `gold-bracelet.png` |
| `ao.png` | robe/body armor | `leather-armor.png` |
| `chan.png` | legs (approximated — no leg-specific art found) | `steel-shoes.png` |

Not converted: `aochoang` (cape), `canh` (wing/back), `quan` (pants), `pet` (companion), all 12
`mat_*` masks — no good matches found in this pass. The folder had a `nextPageToken` past the
first 100 files, so a deeper page-through may still turn up matches for these.

### Maps

3 more `assets/maps/*.jpg` region backgrounds (`bg_chungnam`, `bg_tuongduong`, `bg_nhanmon`) were
replaced with biome paintings from this second survey (Forest, Garuda village, Reptile village),
on top of the mob (`boar.png`) already covered above.

### BGM / SFX — found, but intentionally not committed

`game.js`'s `AudioSys`/`SkillVoice` have referenced `assets/music/*.mp3` and `assets/voice/*.mp3`
since before this reskin — those directories never existed in the repo at all (confirmed via
`ls public/game/assets/`), so this isn't a wuxia→Axie swap, it's filling in audio the game always
expected but never shipped.

The "music and sfx" Drive folder has real, Axie-branded audio that fits directly:

| Target file | Source (Drive) | Note |
|---|---|---|
| `bgm_kiemhiep.mp3` (intro) | `Atia_Legacy_PVP_v21A_fun_5min.mp3` | copied as-is |
| `bgm_tuongduong_ost.mp3` (hub) | `Atia_Legacy_PVP_v21A_fun_5min.mp3` | same track, hub reuses intro |
| `bgm_safe.mp3` (default fallback) | `Atia_Legacy_PVP_v21B_intense_5min.mp3` | copied as-is |
| `bgm_boss_nguan.mp3` | `combat.mp3` | copied as-is |
| `sfx_ui.mp3` | `Vibrant_Tap.ogg` | `ffmpeg -codec:a libmp3lame -qscale:a 4` (game hardcodes `.mp3`) |
| `sfx_slash.mp3` | `Dagger-Attack.ogg` | same conversion |
| `sfx_skill.mp3` | `Talisman-Skill.ogg` | same conversion |
| `sfx_crit.mp3` | `Dagger-Skill.ogg` | same conversion |

**These files are deliberately not committed to git.** `.gitignore` already excluded
`public/game/assets/music/` with an explicit "copyrighted OST — don't push to repo" note from the
original prototype, and that call stands — the source tracks are Sky Mavis/Axie internal Drive
material of unconfirmed redistribution licensing. To reproduce locally: pull the 4 files above from
the "music and sfx" Drive folder, run the `ffmpeg` command shown for the 4 `.ogg` ones, and drop all
8 into `public/game/assets/music/` with the target filenames — the game will pick them up with zero
code changes (same drop-in pattern as every other asset in this doc).

Still missing (no source found or not yet attempted): `bgm_daohoa_ost`, `bgm_ngoai`,
`bgm_chungnam_ost`, `bgm_tuyettinh_ost`, `bgm_comoc`, `bgm_mongco`, `bgm_nhanmon`, `bgm_romance`,
and sfx for `hurt, die, coin, jump, levelup, forge_ok, forge_fail, quest`.

## Third survey — items, skill icons, NPC/mount/tree (full "identify by yourself" pass)

### Items — 12 more masks/accessories sourced

Deeper page-through of "2d land assets item" (300+ files across ~15 subfolders) found real matches
for 12 more `assets/items/mat_*`/`canh` slots: `canh.png`←feather, `mat_antranai.png`←emerald,
`mat_bac.png`←silver-ring, `mat_dotpha.png`←gold-topaz-ring, `mat_honnguyen.png`←ancient-book,
`mat_huyenthiet.png`←steel-ingot, `mat_manhtrangbi.png`←steel-helm, `mat_phongphu.png`←silver-sphere,
`mat_phu.png`←paper, `mat_tichma.png`←iron-ingot, `mat_tiendan.png`←ruby, `mat_tula.png`←platinum-sphere
(a stylized creature-face orb — good "Asura" fit). 19/24 item slots now sourced. Confirmed via an
explicit title search across the whole library: no cape, wing, pants, or pet/companion category
exists anywhere, and no bone-white or fist-motif item for the last 2 masks — `aochoang`, `quan`,
`pet`, `mat_manhcothan`, `mat_tanquyen` stay on the AI-art-prompt fallback list.

### Skill icons — 8 real ability-burst icons, applied across 14 files

"In-game UI/Skill Icon" has 8 real Axie ability-icon PNGs (weapon-archetype bursts: Basic, Sword
×2, Flag ×2, Staff, Cannon, Tripp). Wired 1:1 where a direct match exists (`basic`, `slash`←Sword
Skill, `gangkhi`←Sword Normal, `tieuhon`←Tripp Skill) and reused the elemental bursts across the
7-element sect-ability pairs where only one real icon exists per element: Fire (`mg_a`/`mg_tp`) from
Cannon; Wood (`cm_a`/`cm_tp`, `dh_a`/`dh_tp`) from Staff, hue-shifted 25° between the two Wood
classes; Water (`tc_a`/`tc_tp` from the real Flag Normal/Skill pair, `bd_a`/`bd_tp` hue-shifted -30°
from the same). Each "tp" (ultimate) tier gets a +35% saturation / +12% brightness boost over its
"a" (basic) tier via PIL so the two read as different power levels despite sharing source art — this
is a real but stretched reuse, documented here rather than passed off as 14 separate finds. Metal
(`tl_*`) and Earth (`dt_*`) have no source icon at all; `amkhi`, `bow`, `danchi`, and all tiered/
named technique icons (`th_*`, `fs_*`, `vh_*`) remain unsourced — see `docs/AI_ART_PROMPTS.md`.

### NPCs, mounts, trees — searched, essentially nothing usable found

A focused survey of "2D concept" (`1.Characters`, `2.Equipments`, `3.Overall Environment`),
"2D in-game assets", and "animation" found: ~17 named original NPC characters, but none role-matched
to what the game needs (weapons dealer, apothecary, gatekeeper, etc.) and most stored as single
PSDs over the 10MB cap (Cera 17MB, Batu 26MB, Amrita 39MB, Kika 16MB); zero mount/creature designs
(no horse, wolf, tiger, qilin, dragon) anywhere in scope; and for trees/rocks, one real prop sheet
(`prop_rocknbush_darkforest.png`, 8 boulder/bush variants) but in a 3D-isometric painterly style
that doesn't match the flat sprite style used everywhere else in this repo — would need a real
redraw, not a crop. None of this was wired in — a low-confidence, wrong-style match would look worse
than the placeholder wuxia art it'd replace. The one real fallback path not yet tried: the walk-cycle
videos for Pomodoro/Ena/Heero/Tripp/Bard/Rei (unused, sitting in Character/Axie 3D files/Axie
Render/Screenshot) via the same frame-extraction pipeline used for the class portraits — imperfect
for mounts specifically (humanoid Axie body plan, not a horse/wolf/dragon one) but a real option for
NPC portraits.

## Fourth survey — user-shared "Map New" folder (2 more maps, all 8 trees)

The user shared a direct Drive link to a "Map New" folder — a different, higher-quality source
than anything found in prior surveys: 2 finished top-down overworld paintings (`Map1.png`: ancient
tree + torii gate + dark pine mountain; `Map2.png`: lily pond + stone dam bridge + river islands,
both real full paintings, ~5MB, under the 10MB cap) plus an `Element` subfolder with 10 individual
painted tree sprites in the same style (`Tree-tall-1..5`, `Tree-black-1..4`, `tree-giant` — the
exact ancient tree with hanging lantern charms visible in `Map1`).

- `bg_daohoa.jpg` <- `Map2` (lily pond) — cropped to the game's 2048x1536 background format
  (trimming the decorative parchment-edge border baked into the source), matching "Petalshade
  Isle"'s existing falling-petals ambience and pink lotus imagery.
- `bg_comoc.jpg` <- `Map1` (ancient tree + torii) — matches "Hollow Roost"'s dark/mystical mood.
- All 8 `assets/trees/<region>.png` sprites <- the `Element` subfolder's individual tree PNGs,
  picked per-region by mood (frost-bare tree for `tuyettinh`, the giant lantern-tree for `comoc`
  to match its own new map background, etc. — see the commit for the full per-region mapping).
  `game.js`'s `drawTree()` scales trees by their own image aspect ratio, so no square-canvas
  padding was needed — each sprite was just cropped to its alpha bounding box.

5/8 region maps and 8/8 region trees now use real sourced Axie/painted art. `rock1/2/3.png` still
have no source — no rock-shaped assets found in this folder. `bg_ngoai.jpg`, `bg_mongco.jpg`,
`bg_tuyettinh.jpg` still need sourcing; worth checking whether "Map New" has more files beyond what
was surveyed here (only 4 top-level images + 1 subfolder were found, but the folder may have more
siblings not yet explored).

## Fifth survey — Premium Axie Halloween reskins (3 more mobs)

A follow-up agent dig on maps/mobs came back mostly empty (all 6 remaining region maps and most of
the 29 remaining mob slots have no source art anywhere in the four Drive folders searched — see
below), but surfaced one real lead: the Axie Flappy Bird project tree has an unused "Characters"
subfolder with "Premium Axie" Halloween-costume reskins (Jiangshi, Vampire, Tengu, Witch, etc.).
The agent's own visual-verification step self-reported a base64 corruption bug and could not
confirm any artwork — those findings were independently re-downloaded and visually verified before
use (2 auto-saved to disk per the usual >~150KB threshold, 2 small enough to return inline —
extracted from the session transcript rather than retyped, per this doc's established safe-download
practice, to avoid the base64-transcription-corruption risk documented earlier in this file).

- `docyeu.png` (poison demon) <- `Jiangshii Venoki.png` — a jiangshi (Chinese hopping corpse-demon)
- `huyetbat.png` (blood-bat, fierce) <- `Vampire.png` — bat wings, blood-red palette
- `boss.png` (generic/bigger boss slot) <- `Tengu Buba.png` — elaborate winged costume, though tengu
  itself is Japanese folklore, not wuxia-specific
- `Witch Puffy.png` (jack-o-lantern/witch theme) was verified but **not** wired in — no remaining
  mob name it fits well enough to avoid force-fitting; noted here as a candidate if a slot opens up.

4/30 mobs now sourced. **Confirmed empty** after this survey: all 6 remaining region maps
(`bg_daohoa` already sourced separately — this refers to `bg_ngoai`, `bg_mongco`, `bg_tuyettinh`,
and 2 dungeon backgrounds — no petal, frost, steppe, or cave/lava landscape paintings exist
anywhere searched), and the other 26 mob slots (boss variants, archer/soldier/scout archetypes, the
qilin — no qilin/dragon-hybrid art exists in any folder searched). A found-but-unused item: `Ocean
New.png` (a higher-res redo of the already-known Ocean biome) — doesn't thematically match any
remaining region, not force-fit.

## Sixth source — axieinfinity/axie-origins-asset-kit (20 more mobs)

The user pointed at a different kind of source: [`axieinfinity/axie-origins-asset-kit`](https://github.com/axieinfinity/axie-origins-asset-kit),
the official first-party Unity asset kit for **Axie Infinity: Origins** (the card game), hosted in
the Axie Infinity GitHub org. **License note** (`LICENSE.md`): these are Sky Mavis/Axie Infinity IP,
but usage is explicitly scoped — *"Use is limited to Axie Vibeathon and other Sky Mavis-approved
programs... If you are not building for Axie Vibeathon or another approved program, do not ship
these files."* Confirmed with the user that Axie Wuxia is a Vibeathon project before using anything
from it.

Most of the kit is Unity-native (Spine skeletal rigs, shader-graph materials, animation clips) and
not directly usable as flat sprites — notably `Assets/OriginsKit/PvE/Chimeras/*.png` looks like
single creature images by folder name but is actually a disassembled sprite sheet of separate rig
parts (head, ear, teeth, tail as independent floating pieces), not a usable portrait. Two subfolders
*are* flat, single-piece, ready-to-use images:

- `Assets/OriginsKit/PvE/Avatars/portraits/*.png` — 200x200 assembled creature portraits, same
  rounded/chibi/thick-outline house style as everything else in this repo. Used for regular mobs.
- `Assets/OriginsKit/PvE/Cards/Chimeras/*-NN-00.png` — 320x320 full ability-card illustrations
  (multiple numbered variants per creature = different abilities, not power tiers — picked whichever
  variant read as most "boss-like" per creature). Used for the elite `boss_*` mobs, so bosses read as
  more detailed/dramatic than regular mobs, same intent as the earlier Premium-Axie boss pick.

20 mobs wired in this pass (`wolf`, `mocnhan`, `assassin`, `cungthu`, `cuongbinh`, `daokhach`,
`duhiep` [shared by mob defs `duhiep1/2/3`], `thamtu`, `caodo`, `bandao`, `bandit`, `hautu`, `xanu`
from portraits; `boss_dothong`, `boss_hacphong`, `boss_mochu`, `boss_phando`, `boss_sontac`,
`boss_thienbinh`, `boss_tinhhoa` from cards) — picked by loose name/vibe fit (e.g. `mocnhan` "wood
puppet" → `treant`, `cungthu` "archer" → `dryad-ranger`). `machito`/`shilin` portraits exist in this
kit too but were skipped — those names are already the sourced class portraits for Mech/Reptile, and
reusing them as enemies would put a player's own class face on a monster.

24/30 mobs now have real sourced Axie art. Still unmatched: `kybinh`, `kylan` (qilin — nothing in
this kit resembles a dragon-deer-lion hybrid, better to stay unsourced than force a generic slime
onto a very specific mythical-creature name), `phando`, `thinu`, `trannhan`, `ttdetu` — the kit's
portrait supply (23 named creatures) ran out before covering every remaining slot; ran out of
close-enough options rather than force weak fits.

Also present in the kit but not used here: `PvE/Intents/*.png` (flat monochrome glyph icons for
enemy action telegraphs — style doesn't match the painted/shaded skill icons already in the repo),
`PvE/Backgrounds/class/*` (vertical card-battle backdrops, not top-down world art), `Textures/
StatusIcons` (131 buff/debuff icons — this game doesn't have a matching buff-icon UI slot).
Unexplored: `PvE/UI` (94 files), `PvE/Cards/Tools` (91 tool-card icons — could be a good lead for the
still-unsourced generic weapon skill icons `amkhi`/`danchi`/`bow` if someone wants to keep digging).

## Seventh source — deeper into axie-origins-asset-kit (skills, items, mounts)

Follow-up pass on the same kit as the previous section, this time into `PvE/Cards/Tools/` (90
flat, single-piece ability/item card icons — a much better fit than `Cards/Chimeras` for generic
skill/item art, since these aren't tied to a specific named creature) and the leftover unused
`Avatars/portraits/` files:

- `tl_a.png`/`tl_tp.png` (Metal/Mech) <- `tool-energycoin` (base + a brightness/saturation boost for
  the tp tier, same pattern as the earlier elemental pairs)
- `dt_a.png`/`dt_tp.png` (Earth/Bird) <- `tool-deadskill1` (grey stone-cluster art)
- `amkhi.png` <- `tool-shuriken`; `danchi.png` <- `tool-featherdagger`
- `th_amkhi_1..7.png` — procedural tiering of the `amkhi` base (progressive saturation/brightness
  boost per tier, no new source art needed)
- `th_gangkhi_1..7.png` — cycles through 4 real sword/axe icons (`tool-deadattack0/1/2/3`) with the
  same per-tier boost
- **All 64 named technique icons** (`fs_*.png` x30, `vh_*.png` x34 — the doc's earlier "39+36=75"
  count was wrong) <- round-robin assigned from the remaining ~81 Tools icons (after reserving the
  ones used above), one unique icon per technique. This is honestly **not** a semantic
  translation-and-match pass — nobody translated 64 Vietnamese wuxia technique names and picked a
  thematically fitting icon per name. It's a deterministic, alphabetically-sorted pairing whose only
  goal was "every technique gets a distinct real piece of Axie art instead of a solid-color square."
  Good enough to stop looking like wuxia; not a substitute for real curation if that matters later.
- `pet.png` (item) <- `tool-pacu` (a small fish-companion icon)
- `3_satlang.png` (mount, dark-wolf tier) <- the `alpha-wolf` **portrait** (not the Cards version,
  which was already used for `boss_dothong`). Front-facing bust, not the side-view running pose the
  mount slot really wants — no side-profile mount art exists anywhere surveyed, this was the closest
  real fit. The other 7 mount tiers (horse/tiger/lion/leopard/qilin/dragon) have no matching creature
  anywhere in the kit and stay unsourced.

Also checked and explicitly **not** used: `Assets/OriginsKit/PvE/Intents/*.png` (17 flat monochrome
glyph icons for enemy-action telegraphs — flat single-color style clashes with the painted/shaded
icons everywhere else in this repo), `PvE/Backgrounds/class/*` (vertical card-battle backdrops, not
top-down world art), `Textures/StatusIcons` (131 buff/debuff icons — no matching UI slot in this
game). `PvE/UI` (94 files) was only partially surveyed — worth a closer look if still digging.

## Eighth source — exhausting axie-origins-asset-kit (3 maps, 3 NPCs)

Final sweep through every remaining folder in the kit, closing out the `PvE/UI` folder that was
only partially surveyed before, plus folders not looked at at all yet: `Summoners/`, `PvE/Starters/`,
`PvE/Story/`, `PvE/Backgrounds/` (all three subfolders: `class`, `events`, `story`), and
`Textures/FirstParty/`.

**Used:**

- `bg_ngoai.jpg` <- `PvE/Backgrounds/events/autumn24/autumn24_bg.png` — an autumn forest scene with
  a small shrine/pagoda and stone guardian statues in the background, exact 2048x1152 pixel match to
  the slot it replaces, no resize needed. Very fitting for an "outer sect grounds" region.
- `bg_mongco.jpg` <- `PvE/Backgrounds/class/bg_shop.png` — a canyon/rocky-desert landscape (3840x2160,
  same aspect ratio as the target, straight downscale). Fits a rugged frontier/steppe region better
  than the old placeholder.
- `bg_tuyettinh.jpg` <- `PvE/Backgrounds/events/winter24/winter24_bg.png` — a snow-covered forest with
  a glowing hollow tree (1920x1296, center-cropped to the target aspect ratio then downscaled). Exact
  thematic match for the ice/snow sect.
- `daosi.png` (NPC) <- `PvE/UI/Chapter/dryad_mage.png` — a bearded, robed elder forest-spirit
  character (430x483, scaled to fit + centered on transparent 256x384). Good fit for "wandering
  mystic."
- `thoren.png` (NPC) <- `PvE/Story/Bing_normal.png` — a framed portrait-card of "Bing," a white dog-like
  Axie (256x254, centered on transparent 256x384). Used for the shopkeeper NPC.
- `truonglang.png` (NPC) <- `PvE/Story/Xia_normal.png` — a framed portrait-card of "Xia," an
  ornately-decorated horned Axie with a calm/authoritative expression (256x254, resized to the
  256x256 slot almost exactly as-is). Used for the sect-leader NPC.

All 8 region map backgrounds are now real sourced art — this closes out the maps category entirely.

**Explicitly checked and NOT used, with why:**

- `Summoners/*` (clover, fruitsloth, littlerobin, mavis, mushroom, sparrow, truefanhermitcrab,
  trunk) — every file here is a disassembled Spine sprite sheet (separate floating body parts), same
  problem as the earlier `PvE/Chimeras/*` folder. Not usable without a rigging/compositing pipeline.
- `PvE/Starters/*` (34 numbered files) — same problem, also disassembled Spine parts, confirmed by
  visually inspecting several (`1`, `1-1`, `5`, `11`, `17`, `22`).
- `PvE/UI/Chapter/chimera_riddler_icon.png`, `riddler_3.png` — generic "mystery box" placeholder
  icons (a question mark on a gift box), not character art, not a fit for anything.
- `PvE/UI/Lobby/bg_pve_lobby_axie_lv_1.png`, `PvE/Story/xia-bing.png` — jagged alpha-masked scene
  panels (irregular cutout edges, clearly meant to sit inside a specific UI frame), not usable as a
  clean rectangular map background.
- `PvE/UI/Icons`, `PvE/UI/Nodes`, `PvE/UI/Frames`, `PvE/UI/HpBar(2)`, `PvE/UI/InBattle` — pure UI
  chrome (health bars, map-node icons, frame borders), nothing usable.
- `Textures/FirstParty/*` — noise/VFX textures for shaders (glow, water ripple, lightning), not art.
- `PvE/Backgrounds/story/*` (4-entrance through 10-rocky-mountain-2) — real painted environment
  layers (ground/trees/river/temple/rock/fog/cloud), but exported as small parallax strips (all
  ~1024px wide, many under 500px tall) meant to be stacked at runtime by a scrolling-camera rig, not
  flat scenes. `8-temple/8_TEMPLE.png` alone (a nice pagoda-in-forest illustration) was tempting but
  a direct swap-in of `autumn24_bg.png` for `bg_ngoai` already covered that niche better and at the
  right resolution, so this folder wasn't used. The `*_ROCK.png` layers specifically were also ruled
  out for the rocks slot — they carry a baked-in blue/teal lighting tint from the scene's shared fog
  pass and don't look like plain rocks on their own.
- `PvE/Backgrounds/events/*` other than `autumn24`/`winter24` (halloween24, xmas24, valentine, lunar,
  summer23/24-arcade/gauntlet/rank, ragnarok, arena) — reviewed sizes/thumbnails; none fit an
  unclaimed region theme better than what's already sourced or matched the wrong mood (beach, holiday
  decorations, battle-arena crowds).
- Searched the whole kit for "bow" — nothing. The bow skill slot has no matching source anywhere.

This is very likely the last usable material in `axie-origins-asset-kit` — every subfolder has now
been opened and either used or ruled out with a documented reason.

## Not done yet

Current state as of the axie-origins-asset-kit passes (see `docs/AI_ART_PROMPTS.md` for the
generation-prompt fallback on each of these):

- Items: `aochoang` (cape), `quan` (pants), `mat_manhcothan`, `mat_tanquyen` (2 masks) — 4/24.
- NPCs: 12/15 remaining (`binhkhi`, `duoclao`, `duocsu`, `laotuong`, `monkhach`, `noiung`,
  `quachtinh`, `thumo`, `trachu`, `ttmon`, `vachda`, plus reused-file slots) — no more matching
  wuxia-role portraits found anywhere after exhausting `axie-origins-asset-kit`; `daosi`, `thoren`,
  `truonglang` are now sourced (see the eighth source above).
- Mounts: 7/8 (`1_hacma`, `2_hoangma`, `4_thanho`, `5_sutu`, `6_viembao`, `7_kylan`, `8_longlan`) —
  no side-view horse/tiger/lion/leopard/qilin/dragon creature art found anywhere yet.
- Rocks: `rock1/2/3.png` — 3/11 trees-folder files (all 8 region trees are done).
- Maps: **0 remaining** — all 8 region backgrounds are now real sourced art.
- Skills: `bow.png` + its 7 tiers (`th_bow_1..7.png`) — no bow artwork found anywhere, confirmed by
  an exhaustive filename search across the whole kit.
- Mobs: `kybinh`, `kylan`, `phando`, `thinu`, `trannhan`, `ttdetu` — 6/30.
- `Dantian`/`Quze`/`Tien` (46 files) — still needs the design decision described below, not just
  more sourcing.
- `axie-origins-asset-kit` is now fully surveyed — every subfolder opened and either used or ruled
  out (see the eighth source above). Nothing left to look for there; remaining gaps need either AI-
  generated art (see `docs/AI_ART_PROMPTS.md`) or a different source. Other leads if still digging:
  Project T's `CharacterAnimationRender` zips (oversized, would need someone
  to grab them directly in the Drive UI), the still-unreadable `2.In Game` Drive folder.
