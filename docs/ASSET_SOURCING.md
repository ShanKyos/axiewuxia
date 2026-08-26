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

## Not done yet

- Skill icons (`iconA`/`iconTP`) — still pointing at the old wuxia skill icon paths, no source
  material found for these.
- Map/region background art — the 4 Flappy Bird biome backgrounds are a strong candidate
  (Ocean/Forest/Reptile Village/Garuda Village) but not wired in; the game's overworld is drawn
  procedurally on canvas rather than from raster tiles, so this is optional polish, not a blocker.
- Equipment icons — nothing matching found in any folder surveyed so far.
- `2.In Game` folder — re-check access; it may hold exactly this missing art.
- `CharacterAnimationRender` zips in Project T — worth unzipping to check for more animation
  frames (idle/attack, not just walk) for the characters already in use.
