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

## Ninth source — other axieinfinity GitHub repos (all remaining NPC portraits)

Re-verified `axie-origins-asset-kit` was really exhausted for NPC portraits (checked `PvE/Story/`
and `PvE/UI/Chapter/` again — still only the 2 already-used character cards, everything else is
Spine sprite sheets or UI chrome, matching the eighth-source finding exactly). Widened the search to
other repos under the `axieinfinity` GitHub org instead of Drive:

- `axieinfinity/axie-starter-3d-assets` — 3D FBX rigs + UV texture maps for Buba/Puffy/Pomodoro only,
  not usable as flat portraits (same problem as raw 3D elsewhere in this doc).
- `axieinfinity/unity-axie-gtk2d` ("Axie Infinity IP - Tool Kit 2D") — mostly disassembled Spine part
  sheets again (`Spines/starter-axies/*`, `Spines/chimeras/*`), but its `README.md` embeds two
  assembled preview sheets that aren't disassembled: `images/chimera.png` (17 individual "Chimera"
  creature portraits — Sky Mavis's own term for non-Axie world creatures with chaotic, non-class-
  bound designs, a perfect narrative fit for NPCs as distinct from playable Axie classes) and
  `images/starter.png` (9 individual "land item" mascot creatures). Each sheet is a loose grid of
  fully-assembled character illustrations, not body-part fragments — extracted with a Python
  connected-components pass (alpha-channel bounding boxes via `scipy.ndimage.label`) into 26
  individual portrait crops, then hand-matched to NPC roles by personality/vibe (e.g. the lion sitting
  behind a fruit stall → the auction-house merchant; the bandaged, scroll-holding fighter → the
  "great hero" quest-giver; the bone/skull-masked creature → the tomb keeper). Composited onto padded
  transparent canvases and dropped straight into `assets/npcs/` at each NPC's existing filename (no
  code changes needed — `drawNpc()` already sizes NPC sprites by their own aspect ratio, not a fixed
  canvas, so no letterboxing).

**All 15/15 NPC portraits are now real sourced Axie/Chimera art.** Mapping used:
`duocsu`←starter_03, `quachtinh`←starter_07, `monkhach`←starter_01, `thumo`←chimera_09,
`ttmon`←chimera_08, `noiung`←starter_08, `laotuong`←chimera_15, `duoclao`←chimera_13,
`binhkhi`←starter_06, `trachu`←starter_05, `thuongnhan`←chimera_11, `vachda`←chimera_16 (the
"Vách Té Núi" cliff-jump marker — technically a landmark, not a talking NPC, but it lives in
`assets/npcs/` and rendered via the same small map-sprite path as the rest, and its old art was an
AI-generated Chinese ink-wash mountain painting, the single most obviously-wuxia image left in the
whole NPC set).

## Not done yet

Current state as of the axie-origins-asset-kit passes (see `docs/AI_ART_PROMPTS.md` for the
generation-prompt fallback on each of these):

- Items: `aochoang` (cape), `quan` (pants), `mat_manhcothan`, `mat_tanquyen` (2 masks) — 4/24.
- NPCs: **0 remaining** — all 15/15 portraits are now real sourced art (see the ninth source above).
- Player sprite (`sects/vophai.png`): **0 remaining** — fixed in a separate pass (commit `ef38860`),
  see the eleventh source below for confirmation this wasn't re-touched here.
- Mounts: 7/8 (`1_hacma`, `2_hoangma`, `4_thanho`, `5_sutu`, `6_viembao`, `7_kylan`, `8_longlan`) —
  no side-view horse/tiger/lion/leopard/qilin/dragon creature art found anywhere yet, including a
  fresh check of two more repos in the eleventh source below.
- Rocks: **0 remaining** — all 3 `rock1/2/3.png` now real sourced art, see the eleventh source below.
  All 11/11 trees-folder files are now done.
- Maps: **0 remaining** — all 8 region backgrounds are now real sourced art.
- Skills: **0 remaining** — `bow.png` + its 7 tiers (`th_bow_1..7.png`) now real sourced art, see the
  eleventh source below. This closes out the skill-icon category entirely.
- Mobs: `kybinh`, `kylan`, `phando`, `thinu`, `trannhan`, `ttdetu` — 6/30.
- `Dantian`/`Quze`/`Tien` (46 files) — the design decision (rename the mechanic into Axie-native
  vocabulary) has since been made and executed in `game.js`/`docs/NAMING_MAP.md` (commit `3bcc110`,
  outside this doc's scope). Sourcing was attempted against the new framing in the eleventh source
  below and came up empty — still 46/46 unsourced.
- `axie-origins-asset-kit` is now fully surveyed — every subfolder opened and either used or ruled
  out (see the eighth source above). A sibling repo, `cc-axie-gtk2d`, was surveyed in the eleventh
  source below and is also now exhausted. Remaining gaps need either AI-generated art (see
  `docs/AI_ART_PROMPTS.md`) or a different source. One lead still not tried: Project T's
  `CharacterAnimationRender` zips (oversized, would need someone to grab them directly in the Drive
  UI). The `2.In Game` Drive folder became readable this session (see the eleventh source below) —
  no longer a blind spot, but its contents didn't move any of the categories above.

## Tenth source — `axie-origins-asset-kit`'s music/SFX/VFX folders (previously unsurveyed)

The prior eight passes only ever explored `Assets/OriginsKit/` inside this repo. It turns out the
same repo has two more top-level trees that were never opened: `Assets/OriginsKit/PvE/Music/` (full
background-music tracks) and `Assets/OriginsKit/Audio/` (status-effect one-shots), plus a
completely separate `web-vfx/` subproject (a Vite/PixiJS tool Sky Mavis built for browser playback
of Origins combat VFX — its own README describes it as "the web plate: additive atlases recorded
from those same [Unity] prefabs"). Between the two, this closes three real, previously-undocumented
gaps:

**BGM — 9 of the 15 `BGM_TRACKS` map keys had no matching file.** `game.js` has referenced
`bgm_daohoa_ost`, `bgm_ngoai`, `bgm_chungnam_ost`, `bgm_tuyettinh_ost`, `bgm_comoc`, `bgm_mongco`,
`bgm_nhanmon`, `bgm_romance`, and `bgm_tomb` (shared by all 7 dungeon instances) since the original
prototype — none of these files ever existed, so those regions/dungeons/the companion-bond scene
played silence (`AudioSys._startTrack()` catches the 404 rejection and does nothing). Filled from
`PvE/Music/` (`pve_1/2/3.wav`, `halloween.wav`, `halloween_battle_2023.wav`, `lunar_bloodmoon.wav`,
`lunar_battle.wav`, `pvp.wav`, `home.wav` — moods picked per region from the lore bible's chapter
table, e.g. the moodier `lunar_bloodmoon` for Frostmire Vale's "Lost Ones," `pvp.wav` — the longest,
most intense track — for the final Stormgate Pass chapter), converted with the same
`ffmpeg -codec:a libmp3lame -qscale:a 4` recipe as the original 4 tracks.

**SFX — 8 of the 12 `AudioSys.sfx()` names referenced in code had no file** (`coin`, `die`,
`forge_fail`, `forge_ok`, `hurt`, `jump`, `levelup`, `quest` — only `crit`/`skill`/`slash`/`ui`
existed). Filled from `Assets/OriginsKit/Audio/`'s generic status one-shots by closest semantic
match (`power_awaken.wav`→level-up, `death_mark.wav`→death, `feather.wav`→air-jump, etc. — see the
`SECT_SFX`-adjacent mapping in `game.js` for the full list). No literal "coin"/"forge anvil" sound
exists anywhere in the kit — these are the closest-fit substitutes, not exact matches, flagged here
per this doc's own no-force-fit convention.

**Per-class combat SFX — new, not filling an existing gap.** `web-vfx/public/sfx/` has 130 wav
files: bite/cast/gore/projectile/slash/smash/throw one-shots for exactly the 9 in-game classes
(mech/aquatic/dusk/reptile/beast/bird/plant/bug/dawn — a 1:1 id match with `SECTS`). Wired 27 of them
(`slash`/`cast`/`smash` × 9 classes) into `doBasic()` (basic attack), the class `skillA` cast, and
the `tp` ultimate cast respectively, via a new `SECT_SFX` id-mapping table — replacing the one
generic sound every class used before with a distinct one per class. See `docs/AI_ART_PROMPTS.md`-
style reasoning: the other ~100 wav files (bite/gore/projectile/throw variants, ~35 status-effect
clips) are real and available but weren't wired — no corresponding trigger point exists yet in
`game.js` for e.g. "bite" specifically, and buff/debuff SFX would need per-status wiring, a separate
pass.

**VFX — new. `web-vfx/public/vfx/` has 107 pre-rendered additive sprite-atlas animation clips** (63
skill + 42 buff/status, one `atlas.png` + `clip.json` per clip, grid-sheet format with fps/frame-size/
anchor metadata — see the folder's own README for the full format). The existing game already has a
mature, fully procedural VFX system (`SECT_VFX`/`spawnSkillVfx`/`drawVfx`, canvas-drawn shapes, no
sprite assets) — replacing it wholesale was out of scope and would have been a regression risk for
no clear gain. Instead, one `_smash` clip per class (9 total, ~13MB) was added as an **extra overlay**
layered on top of the existing procedural `sectTP` (ultimate) VFX only — a new lightweight atlas
player (`VFX_ATLAS_DEFS`/`spawnAtlasVfx`/the `atlasVfx` effect-type branch in the draw loop) reads
the grid metadata (hardcoded from each clip's `clip.json`, matching how `SECT_VFX` styles are already
hardcoded JS objects rather than fetched) and additive-blends the correct frame each tick. The other
98 clips (per-class bite/gore/projectile/throw variants, all ~35 status-effect clips) are real and
available in the same source repo but unused — no existing trigger point in `game.js` calls for them
yet; a natural next step would be wiring the status clips (`stunned`, `poison_apply`, `heal`,
`shield`, etc.) to the game's existing status-effect application code, but that's a separate,
similarly-sized pass, not done here.

## Eleventh source — `cc-axie-gtk2d` (bow + rocks closed out), Drive's newly-readable `2.In Game`, mounts/dantian re-checked

Picked up the five remaining gaps left after the tenth source: mounts (7/8), rocks (3 files), the
bow skill icon, 4 item slots, and the 46-file Dantian/Quze/Tien reskin (now unblocked — the
mechanic rename referenced in `docs/AI_ART_PROMPTS.md` shipped separately as `docs/NAMING_MAP.md`,
commit `3bcc110`). Confirmed the player-sprite fix from commit `ef38860` is already in place
(`git log -p -1 ef38860 -- public/game/assets/sects/vophai.png` shows a real portrait swap) and did
not re-touch it.

### `cc-axie-gtk2d` — a new repo, same asset pack as the Drive item library

`axieinfinity/unity-axie-gtk2d`'s NPC-portrait sheets (ninth source) had a Cocos Creator sibling
repo, `axieinfinity/cc-axie-gtk2d` ("Axie Infinity IP - Tool Kit 2D" — same README title, no
`LICENSE` file, same no-restriction posture already extended to its Unity sibling), never checked
before. It turns out `assets/axie-standard-assets/sprites/land-items/` is the **same painterly
512×512 icon pack** as the Drive "2d land assets item" folder used for `assets/items/` back in the
second/third surveys — just also committed to this git repo, which sidesteps Drive entirely for
re-checking it. Confirmed items conclusion first: paged through every subfolder (`Items/Accessory`,
`Armor`, `FoodItem`, `Potion`, `Shell`, `Weapon`, plus `Materials/*`) — still no cape, pants, or
face-mask category anywhere in this asset family, cross-verified via a second, independent access
path. Items stay 4/24 short.

**Bow — closed out.** `Items/Weapon/` has real bow and arrow icons that don't exist in
`axie-origins-asset-kit` (which an exhaustive filename search in the eighth source already ruled
empty for "bow"): `long_bow.png`, `recurve_bow.png`, `composite_bow.png`, `wooden_arrow.png`,
`stone_arrow.png`, `iron_arrow.png`, `steel_arrow.png` — 7 real weapon-icon images for the 8 target
slots (`bow.png` + `th_bow_1..7.png`). Assigned by a rough progression rather than round-robin,
since the material names line up with a real crafting tier order: `bow.png` (base skill icon) <-
`long_bow`; `th_bow_1..4` <- `wooden_arrow` → `stone_arrow` → `iron_arrow` → `steel_arrow` (arrow
material tiers, ascending); `th_bow_5..6` <- `recurve_bow` → `composite_bow` (better bow types);
`th_bow_7` <- `long_bow` again (reused base image, at the strongest tier boost, same reuse pattern
as `3_satlang`'s wolf portrait and the earlier elemental-burst pairs). Each source image was cropped
to its alpha bounding box, fit onto a transparent canvas matching the original slot size (128px for
`bow.png`, 256px for the tiers), then given the same progressive saturation/brightness ramp used for
`th_amkhi`/`th_gangkhi` (1.0×→1.4× saturation, 1.0×→1.15× brightness across tiers 1–7) so the 7 tiers
read as an ascending power sequence despite only 7 distinct source images across 8 slots. This closes
the skill-icon category entirely — every `assets/skills/*` slot now has real sourced art.

**Rocks — closed out.** `Materials/quarry/stone.png` (a plain cracked tan boulder) and
`Materials/coal_processor/coal_dust.png` (a dark grey rock pile) are clean, ore-free rock props —
exactly what the eighth source's rejected `*_ROCK.png` parallax layers weren't ("baked-in blue/teal
lighting tint... don't look like plain rocks on their own"). A third, `Materials/metal_mine/
ore_iron.png`, is a rock cluster but with visible reddish ore veins; desaturated it (PIL
`ImageEnhance.Color` to 0.15×) to strip the ore tint down to a plain grey boulder, giving a third
shape-distinct rock without reusing either of the other two outright. All 3 cropped to alpha bbox and
fit onto a 256px transparent canvas (matching `rock1/2/3.png`'s existing size and the sibling tree
sprites' convention in the same folder) and dropped in at the existing filenames — `rock1.png`
<- `stone.png`, `rock2.png` <- `coal_dust.png`, `rock3.png` <- desaturated `ore_iron.png`. All
11/11 `assets/trees/*` files are now real sourced art.

**Mounts — still nothing.** `cc-axie-gtk2d`'s `spines/chimeras/*` folder is the same disassembled
Spine-sheet problem as everywhere else, and the creature roster in it (wolf/bear/treant/slime/dryad
variants) is the same one already found in `unity-axie-gtk2d`'s README sheets — no horse, tiger,
lion, leopard, qilin, or dragon. Also went back to `unity-axie-gtk2d`'s `images/chimera.png` and
`images/starter.png` sheets (ninth source) and extracted the 13 crops that were *not* used for any
NPC (10 from `chimera.png`, 3 from `starter.png`, via the same alpha-bbox connected-components
script as before) to check whether a mount-shaped creature had been sitting unused in the leftovers
— all 13 are slime blobs, a fox-eared creature, a ram-skull creature, and a cat-eared blob, same
chibi-bust house style as everything else in that sheet, none horse/tiger/lion/leopard/qilin/dragon
shaped. Mounts stay 7/8.

### Drive's `2.In Game` folder — now readable, surveyed, doesn't move any category

The seventh/eighth-source doc entries flagged `2.In Game` as inaccessible via the Drive API at
survey time. It's readable now (folder contents load normally) — worth recording so a future pass
doesn't treat it as an open lead it isn't. Contents: `Accessory` (Good Vibes Club Accessory, Moku
Accessory, Class Axies 2024, Animated Accessory), `Icon` (dozens of UI/status-icon sub-folders), and
`Environment` (`Background`, `Map` — the `Map New` subfolder already fully used in the fourth
source).

- `Accessory/Good Vibes Club Accessory` and `Accessory/Moku Accessory` are cosmetic Axie trinkets
  (goggles, neck pins, hip charms, wing charms) from the Good Vibes Club and Moku collab lines —
  not cape/pants/mask-shaped, and both are separate licensed collab brands rather than core Axie
  IP, so skipped on licensing grounds rather than risking non-Axie-owned art in the repo.
- `Accessory/Class Axies 2024` is per-class official Axie renders (Dusk/Plant/Bug/Dawn/Mech, etc.)
  — same fixed 6-part chibi body plan documented in `unity-axie-gtk2d`'s own README, confirming
  (rather than just assuming) that "official Axie" art structurally can't produce a horse/tiger/
  dragon-shaped mount no matter which folder it's found in.
- `Icon/Battle Status Icon/PNG` (and sibling `Enemy Status Icon`, `Requiem Status Icon`, `Summer
  2024 Status Icons`, `Metamorph Icon` folders) turned out to be the **same asset library** as
  `axie-origins-asset-kit`'s `Textures/StatusIcons/` (131 files, already found-but-unused in the
  eighth source) — confirmed by filename overlap (`buff_healing_boost`/`buff_shield_boost`/
  `buff_dmg_boost`/`buff_spike` in the kit match "Healing Boost"/"Shield Boost"/"Damage Boost"/
  "Spike" in Drive). Sampled via the git-hosted copy instead of re-downloading from Drive, avoiding
  this doc's own documented base64-transcription-corruption risk for small inline files. Considered
  hard for Dantian/Quze/Tien (see below) and ruled out.
- `Environment/Map/Map Items/Map 1` and `Map 2` subfolders were not opened — maps are 8/8 done
  already, so there was no open gap to justify the dig.

### Dantian / Quze / Tien — design decision is done, but no fitting source art found

With the mechanic now renamed (Instinct Channels / Starflight, per `docs/NAMING_MAP.md` — Anima
has since been merged into silver),
went looking for energy-flow/crystal/bio-luminescent icon art to match. The one real candidate —
the ~130-file status-badge library described above — was checked seriously and rejected on two
independent grounds:

1. **Style mismatch.** The badges are flat, saturated, thick-black-outlined mobile-game icons (a
   glowing yin-yang orb, a hexagonal rune badge, a green leaf on a purple shield). Every other
   asset in this repo — items, skill cards, the dantian sketches and quze ink paintings themselves
   — is painterly/illustrated. Dropping in flat cartoon badges would read as a jarring engine swap,
   not a reskin.
2. **Shape mismatch for 2 of the 3 folders.** `dantian/` icons are small (128×128), so a badge
   swap is at least plausible there. But `quze/` (512×731, a full illustrated scene per file — the
   existing `anmay.png` is a whole koi-and-waterfall ink painting) and `tien/` (256×384, a full
   costume portrait per file) are shape-incompatible with a small square badge — stretching one to
   fill a costume-portrait canvas is exactly the low-confidence force-fit this doc's own convention
   says to skip.

Also re-checked `axie-origins-asset-kit`'s `PvE/Cards/Tools/` (already used for the 64 named
technique icons, seventh source) for any leftover crystal/orb/energy-themed icon in the same
painterly style as the rest of the kit — found nothing beyond `tool-energycoin`, already spent on
`tl_a`/`tl_tp`. No style-and-shape-compatible source turned up anywhere searched this pass. Per this
doc's own "a low-confidence match would look worse than the placeholder" rule, all 46 files stay
unsourced — this needs either bespoke AI-generated art (see `docs/AI_ART_PROMPTS.md`) or a different
source, not a force-fit from what's on hand.

### Summary

Fully closed: bow skill icon (8 files), rocks (3 files). Re-confirmed still empty, now via a second
independent source: items (cape/pants/2 masks, 4/24), mounts (7/8). Newly unblocked by the naming
rename but still unsourced after a real search: Dantian/Quze/Tien (46 files) — design decision no
longer the blocker, matching art is.

## Twelfth source — widened GitHub search (mounts, Tien): still nothing, now via 8 more repos

The user flagged that the player's own sprite and the mount trailing them at max cultivation were
still the old wuxia illustrations, and asked for a real re-check of the eleventh source's mount
conclusion — not a re-open of the same 3 repos (`axie-origins-asset-kit`, `unity-axie-gtk2d`,
`cc-axie-gtk2d`) already exhausted there, but a genuinely wider net. This pass did that: the whole
`axieinfinity` GitHub org (53 repos, re-listed fresh to check for anything new since the eleventh
source), the `skymavis`/`SkyMavis` org (10 repos), `roninchain` (1 repo), plus GitHub-wide repo and
code search for "axie" combined with "dragon"/"tiger"/"mount"/"steed"/"qilin"/"homeland"/"fanart"/
"sprite pack", to look for fan-made packs or a separate Homeland repo outside the checked orgs.

**New repos opened this pass** (none checked in the tenth/eleventh source):

- `axieinfinity/awesome-axie-gtk` — just a link-list README pointing at repos already known
  (`unity-axie-gtk2d`, `cc-axie-gtk2d`, `r3f-axie-starter`, `axie-starter-3d-assets`,
  `cc-axie-colyseus-demo`, `unity-axie-tracking`, plus `unity-axie-starter-3d-demo`). No new lead.
- `axieinfinity/cc-axie-colyseus-demo` (an example Cocos Creator artillery-game demo) —
  `assets/axie-standard-assets/spines/chimeras/*` is the **exact same 21-creature Chimera roster**
  already found in `unity-axie-gtk2d` and `cc-axie-gtk2d` (wolf ×5 variants, bear ×2, dryad ×3,
  treant ×3, slime ×5, werewolf, machito, shilin) — a third independent copy of the same closed set,
  not new material. Its `images/` folder had 3 files not seen before (`axie-part-cards.png`,
  `land-item.png`, `ntf-axie.png`); all three checked visually — `axie-part-cards.png` is a grid of
  ability-card icons showing small horn/tail/mouth/back part variants, but every one is mounted on
  the *same round chibi Axie body* regardless of class (visual proof, not just inference, of the
  fixed-body-plan finding); `land-item.png` is the same painterly material/equipment icon set already
  used for `assets/items/`; `ntf-axie.png` is a marketing diagram (gene hex, NFT trait boxes), no art.
- `axieinfinity/mixer-unity` (`com.skymavis.axiemixer.unity`, the official Axie part-mixer Unity
  package) — this was the pass's best real lead for the "compose a mount from body parts" idea in
  the task brief, since a mixer tool implies raw swappable parts. Its `Resources/accessory/*` folders
  (`ground`, `neck`, `cheek`, `hip`, `air`) are small cosmetic trinkets (anklets, neck charms, cheek
  paint, hip charms, wing/aura effects) layered on top of the body, not body-shape parts — and the
  body itself lives in `Resources/axie-2d-v3-stuff/atlas-single/*` as a single shared texture atlas
  (color/splat/line maps) painted onto one fixed mesh via material swap, not separate swappable limb
  sprites. Confirms independently, from the tool that actually does the part-mixing, that there is no
  loose "horn"/"leg"/"tail" sprite library to assemble a mount silhouette from — the mixing happens
  in a shader on one fixed body, not by swapping drawn parts.
- `axieinfinity/mixer-playground` (a Next.js demo front-end for the mixer) — only 23 tiny PNGs, all
  generic UI icons (class icons, and part-*category* icons like a plain "tail"/"horn"/"body" glyph
  used to label a picker control) — the real part art is fetched live from an API at runtime, not
  checked into the repo. No creature art here at all.
- `axieinfinity/godot-axie-starter-3d` and `axieinfinity/r3f-axie-starter` — like
  `axie-starter-3d-assets` (sixth source), these are raw 3D/FBX/GLB rigs for exactly 3 characters
  (Buba, Puffy, Pomodoro) plus generic platformer props (coins, clouds, grass) — same "no renderer
  available in this environment" blocker as everywhere else raw 3D shows up in this doc.
- `skymavis/*` (10 repos: `ronin-market-sdk`, `tanto-kit`, `waypoint-js/android/unity/iOS`,
  `katana-sdk`, `sdk-examples`, `skills`, `xrand`) — all wallet/SDK/tooling repos for the Ronin chain,
  zero game assets of any kind.
- `roninchain/ronin-smart-contracts` — smart contracts, no assets.
- No `axie-homeland` GitHub org exists, and GitHub-wide search for "axie homeland" turns up only
  unofficial third-party tools (a wallet-transaction tracker, a fan wiki-style site) — Sky Mavis has
  never published Homeland's assets or source publicly.

**Re-confirmed via a 4th independent copy:** the complete named Chimera/creature roster across every
Axie-official 2D asset repo found on GitHub (`axie-origins-asset-kit`, `unity-axie-gtk2d`,
`cc-axie-gtk2d`, `cc-axie-colyseus-demo`) is identical: wolves, bears, dryads, treants, slimes,
werewolf, machito, shilin. Two portraits not previously looked at closely — `werewolf` and
`daddy-bear` — were opened and visually checked in case a bipedal or four-legged silhouette in that
set could stand in for a horse/tiger/lion/qilin/dragon tier at a stretch (the same tolerance already
extended to the wolf-bust used for `3_satlang`); both are the same round chibi head-and-shoulders bust
as every other Chimera portrait, with only ear/face-paint variation — not a body shape a viewer would
read as horse, tiger, lion, or dragon under any framing. Per the task's own instruction not to force a
"reads as wrong genre" substitute (the same standard the user set for Azure Dragon), neither was used.
**Mounts stay 7/8** — `1_hacma`, `2_hoangma`, `4_thanho`, `5_sutu`, `6_viembao`, `7_kylan`, `8_longlan`
have no matching source anywhere found across 8 repos + 3 orgs searched, on top of the 3 repos already
exhausted in the eleventh source.

**Tien (Ascension/Starflight skin, 12 files)** — the user explicitly allowed a human-style character
here, not just a round Axie creature, so this pass also re-opened `axie-origins-asset-kit`'s
`PvE/Story/`, `PvE/UI/Chapter/`, and `Summoners/` folders specifically looking for a "person"
illustration distinct from the already-used `Xia`/`Bing` NPC portraits (which are non-human horned/
dog-headed Axie characters, not people, and are already spent as NPCs — reusing them here would also
put an NPC's face on the player). Found nothing new: `PvE/Story/` has only `Xia_normal`, `Bing_normal`
(both used), and `xia-bing.png` (a background scene, no character, already ruled out in the eighth
source); `PvE/UI/Chapter/` has one previously-unopened file, `riddle_dryadmage.png` — checked, but
it's the same dryad-mage creature already used for the `daosi` NPC, not human, and not distinct;
`Summoners/mavis/Mavis.png` (Sky Mavis's own mascot) was checked as a long shot but is a disassembled
Spine sheet of a bird/owl-like creature's parts (wing feathers, beak, round body panels) — not human,
and not reassemblable without a Spine runtime (same blocker as `PvE/Chimeras/*` and `PvE/Starters/*`
in the eighth source). A quick Google Drive check for the "17 named 2D concept characters" mentioned
in the third survey (in case one not used as an NPC could double as a human ascended-form portrait)
came back empty in this session — those folders didn't resolve via search here, unlike in whatever
context surfaced them originally; not pursued further since the user's ask was specifically to widen
the *GitHub* search. **No human-style Axie/Sky Mavis character art was found anywhere in scope.**
Forcing a non-Axie, off-license human illustration in would break this doc's own licensing
convention (everything shipped here is either Vibeathon-scoped Axie IP or confirmed-appropriate). All
12 `assets/tien/*.png` files stay unsourced — this needs bespoke AI-generated art (see
`docs/AI_ART_PROMPTS.md`) or a real leak of Homeland/promotional human-character art, neither of
which turned up here.

### Summary

No files replaced this pass — every widened search came back empty rather than force a wrong-genre
fit. Mounts stay 7/8 (only `3_satlang` sourced, from the eleventh source). Tien stays 12/12 unsourced.
8 new repos + 3 new orgs were opened and ruled out on top of the 3 repos already exhausted in the
eleventh source; this is very likely the actual end of the line for GitHub-sourced Axie mount/human
art — the fixed 6-part chibi body plan and the Chimera roster's fixed creature list (wolf/bear/dryad/
treant/slime/werewolf) are now confirmed across 4 independent repos, and no Sky Mavis game other than
mobile Origins and 2D starter kits has ever had its assets published to a public GitHub repo.

## Chín — GHÉP RIG SPINE: lật lại kết luận "không dùng được"

Tám đợt trên đều dừng ở cùng một chỗ: phần lớn art Axie trong kit nằm dưới dạng **rig Spine**
(`.atlas` + `.json`/`.skel` + `.png`), và tấm `.png` chỉ là chỗ gom các **bộ phận rời** — đầu, tai,
răng, đuôi nằm rải rác, không phải chân dung. `PvE/Chimeras/*` bị bỏ qua vì lý do đó, và cả 38 con
Axie trong `PvE/Starters/` cũng vậy.

Kết luận đó **sai**. Tấm `.png` đúng là không dùng thẳng được, nhưng file `.json` đi kèm còn nguyên
**cây xương và tư thế gốc** (setup pose): mỗi xương có phép dịch/xoay/co và cha của nó, mỗi mảnh có
vị trí gắn lên xương. Đủ để dựng lại hình hoàn chỉnh.

`tools/spine/assemble.py` làm đúng việc đó: đọc `.atlas` lấy toạ độ từng vùng, đọc `.json` dựng cây
xương, tính phép biến hình thế giới, rồi dán từng mảnh theo thứ tự vẽ của slot.

```
python3 tools/spine/assemble.py <thư-mục-bộ> <tên-bộ> <file-ra.png>
```

**Hai cái bẫy khi viết:**

- **Vùng bị xoay 90° khi đóng gói.** `rotate: true` nghĩa là vùng nằm nghiêng trên tấm ảnh, nhưng
  `size:` vẫn ghi kích thước GỐC. Cắt theo `size` là cắt lệch — ra những mảng chữ nhật cụt lủn.
  Phải cắt theo kích thước đã hoán đổi rồi xoay `-90°`.
- **Spine dùng hệ Y-HƯỚNG-LÊN**, ảnh thì Y hướng xuống. Quên đảo dấu là hình lộn ngược.

**Kết quả:** 12/38 con trong `PvE/Starters` ghép ra ảnh hoàn chỉnh, nền trong suốt, ~950px.
26 con còn lại dùng `.skel` (Spine nhị phân) — bộ này chưa đọc được, cần viết thêm bộ đọc nhị phân.

**Đã dùng:** 5 con cho Thú Chiến (`assets/mounts/`), thay hẳn bộ bò lửa / bò băng / báo / phượng /
rồng cũ — đám đó KHÔNG phải art Axie. Bậc xếp theo mức dữ tợn nhìn thấy được và lệch màu để phân
biệt trong màn: `12`→Petalkin (hồng, hoa) · `3`→Tidenip (xanh lơ, càng) · `1`→Emberpaw (cam, sừng
lá) · `2`→Stonetusk (lục, ngà + đá) · `17`→Crimsonmaw (đỏ sẫm, dữ tợn). Ảnh gốc quay TRÁI, đã lật
sẵn khi xuất vì `drawMount()` lật lại khi nhân vật quay trái.

**Còn 7 con chưa dùng** (`1-1`, `16`, `16-1`, `2-1`, `3-1`, `5-1`, `7`, `12-1`, `17-1` — các bản
`-N` là biến thể của cùng một con). Cộng với `PvE/Chimeras/*` và `Summoners/*` nay cũng ghép được,
đây là nguồn art Axie lớn nhất còn chưa khai thác trong repo.


## Mười — ĐỌC RIG NHỊ PHÂN: mở nốt 56 rig còn khoá, và 16 con Chimera có art thật

Đợt chín ghép được rig Spine từ file `.json`, nhưng dừng ở đó: 26/38 con trong `PvE/Starters`,
toàn bộ 22 con `PvE/Chimeras` và 8 con `Summoners` xuất ở dạng `.skel` — cùng dữ liệu, đóng gói
nhị phân. Kết luận khi ấy là "cần viết thêm bộ đọc nhị phân".

`tools/spine/skelbin.py` là bộ đọc đó (Spine 3.8, `SkeletonBinary`). Nó trả về đúng cấu trúc mà
`.json` cho ra, nên `assemble.py` dùng lại nguyên si — chỉ thêm một nhánh: không thấy `.json` thì
đọc `.skel`.

**Ba chỗ dễ sai khi viết bộ đọc:**

- **Số nguyên là varint 7-bit**, không phải 4 byte. Đọc nhầm một con số là lệch con trỏ và mọi
  thứ phía sau thành rác — mà rác vẫn "đọc được", không báo lỗi ở đâu cả.
- **Chuỗi đếm cả byte kết**: `0` là null, `1` là chuỗi rỗng, `n` là `n−1` byte UTF-8.
- **Phải đọc qua cả phần không dùng.** Hoạt ảnh, mesh, ràng buộc IK/transform/path đều không cần
  cho tư thế gốc, nhưng vẫn phải giải mã đúng số byte của chúng để con trỏ tới đúng chỗ khối skin.
  Riêng mảng đỉnh của mesh dài ngắn tuỳ có gắn xương hay không — nhánh này sai là hỏng cả file.

**Kết quả:** 38/38 `PvE/Starters` và 8/8 `Summoners` ghép ra ảnh hoàn chỉnh. `PvE/Chimeras` thì
chỉ vài con ra hình — thân của sói/gấu/dryad làm bằng **mesh**, mà `assemble.py` chỉ dán được mảnh
`region`; muốn ghép phải làm thêm bước biến hình theo tam giác.

### Đã dùng — 16 Chimera (`assets/chimera/*.webp`), thay hẳn `assets/mounts/`

Hệ Thú Chiến bị Chimera nuốt (xem `docs/GACHA_KHE_UOC.md`), nên 5 file `assets/mounts/` cũ bị xoá,
16 con Chimera lấy art mới theo id.

> **Cập nhật 2026-09-05** — art nay là **bảng khung hình**, không còn ảnh tĩnh: `<id>.webp` (16
> khung nhịp thở) và `<id>_q.webp` (12 khung `activity/appear` + 12 khung thở). Nướng bằng
> `tools/spine/nuong_chi.py`, không phải `xuat_chimera.py` nữa. Chi tiết và ba chỗ dễ sai:
> `docs/ART_CHIMERA_HOATCANH.md`.

| Chimera | rig | Chimera | rig |
|---|---|---|---|
| Aurelion (5★) | `Starters/21` | Petalkin | `Starters/12` |
| Netherfang (5★) | `Starters/18` | Crimsonmaw | `Starters/17` |
| Tidewarden (5★) | `Starters/3` | Thornpaw | `Starters/24` |
| Emberjaw (5★) | `Starters/1` | Inkmane | `Starters/23` |
| Voltcrest (5★) | `Starters/15` | Cinderbeak | `Starters/5` |
| Ironshell (5★) | `Starters/2` | Mossback | `Starters/16` |
| | | Hexmite | `Starters/11` |
| | | Ridgehorn | `Starters/7` |
| | | Coghound | `Starters/22` |
| | | Sunspur | `Starters/19` |

**Cố tình không lấy bản biến thể.** Kit đánh số `2` và `2-1` là hai con khác nhau, nhưng ở tư thế
gốc chúng chỉ khác nhau cái mũ; để cả hai vào cùng một bảng gacha thì người chơi tưởng game lỗi
trùng ảnh. 16 con = 16 rig gốc khác nhau, không con nào là biến thể của con nào.

**Lớp và màu chạy theo art, không ngược lại.** Con nào art không khớp lớp/màu đã đặt thì sửa
`lop`/`mau` trong `CHIMERA` cho khớp cái nhìn thấy. Một con phải đổi tên: `glimmerfin` (Aquatic,
vảy cá) rơi vào rig duy nhất còn lại là một con mèo đen trắng — đổi thành **Inkmane** (Dusk), tên
và hình mới cùng nói một chuyện.

**Ba bước xử lý sau khi ghép** — của `xuat_chimera.py`, đường xuất ảnh tĩnh đời đầu. Đã **xoá**
cùng đợt thay sang bảng khung hình; chép lại đây vì hai bài học đầu vẫn đúng cho `nuong_chi.py`:
1. *Bỏ mảnh rời* — vài rig để phụ kiện (quả cà của `22`) nằm tách hẳn khỏi thân ở tư thế gốc; trong
   màn nó trôi lơ lửng cạnh con vật. (Đường mới không cần bước này: nó bỏ thẳng hai khe `back` và
   `shadow` theo tên, chính xác hơn là dò cụm pixel.)
2. *Lật ngang* — art gốc quay TRÁI, `drawMount()` lật lại khi nhân vật quay trái. Vẫn đúng.
3. *Thu về 480px cạnh dài* — nay thay bằng hai cỡ ô: 132px cho bảng thở, 360px cho bảng quay.

**Không dùng, và vì sao:** `Summoners/*` (8 con: Clover, FruitSloth, LittleRobin, Mavis, Mushroom,
Sparrow, TrueFanHermitCrab, Trunk) nay ghép ra sạch và đúng nghĩa "thú triệu hồi", nhưng chúng vẽ
theo lối **painted** đậm bóng, khác hẳn lối phẳng của bộ Starters. Trộn vào cùng một bảng roster là
tự phá cái đồng nhất mà cả đợt này đang xây. Để dành cho một hệ khác đứng riêng.
