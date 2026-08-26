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

## Not done yet

- Skill icons (`iconA`/`iconTP`) — still pointing at the old wuxia skill icon paths. The "In-game
  UI" Drive folder has 8 style-reference icons (Sword/Flag/Staff/Cannon/Basic/Tripp Normal/Skill
  pairs) that could inform a real pass, not wired in yet.
- Remaining item slots (`mat_*` ×12, `aochoang`, `canh`, `quan`, `pet`) — see the items table above.
- 29 of 30 mobs, 5 of 8 region maps still on placeholder/wuxia art.
- `texture_tileset.png` / `prop_rocknbush_darkforest.png` from "Overall Environment" — not yet
  cropped/wired in as decoration sprites.
- `Sapidae_F_running.png` from "1.Characters" — a real running-animation character sprite, not yet
  wired to any class/mob.
- Equipment icons — nothing matching found in any folder surveyed so far.
- `2.In Game` folder — re-check access; it may hold exactly this missing art.
- `CharacterAnimationRender` zips in Project T — worth unzipping to check for more animation
  frames (idle/attack, not just walk) for the characters already in use.
