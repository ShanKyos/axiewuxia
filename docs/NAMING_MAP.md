# Axie Wuxia — Naming Map (Phase 0 deliverable)

This resolves the "class roster" open decision the proposal calls out, plus the full
system/vocabulary rename table Phases 1–3 execute against. Everything here is grounded either
directly in the proposal's own text (marked **canonical**) or in real Axie Infinity class lore
(the 9 official classes and their Wild/Tide/Savage groupings are Axie's actual class system, not
invented) crossed with each prototype sect's existing element/role data.

## 1. Class roster — 7 sects → 7 classes, + 2 new

The proposal requires the Wild(Plant, Reptile, Dusk) → Tide(Aquatic, Bird, Dawn) →
Savage(Beast, Bug, Mech) → Wild triangle, with 7 classes coming from the existing sects and 2
new ones (Bug, Dawn) "built on existing skill archetypes." Mapped by each sect's real
in-game element (`Ngũ Hành`) and combat role, not arbitrarily:

| Group | Class | Source sect | Element | Role | Why |
|---|---|---|---|---|---|
| Savage | **Mech** | Thiếu Lâm | Kim (Metal) | Tank/Control | Iron-body discipline, armored |
| Tide | **Aquatic** | Toàn Chân | Thủy (Water) | Sword-qi/Support | Direct element match |
| Wild | **Dusk** | Cổ Mộ | Mộc (Wood) | Assault/Agile | "Ancient Tomb" — shadowy, twilight |
| Wild | **Reptile** | Bạch Đà Sơn | Thủy (Water) | Poison/Ranged | Snake clan → literal reptile |
| Savage | **Beast** | Minh Giáo | Hỏa (Fire) | Burst/Flame | Zealot ferocity, raw power |
| Tide | **Bird** | Đoàn Thị | Thổ (Earth) | Precision/Focus | Finger-point strikes → darting precision |
| Wild | **Plant** | Đào Hoa | Mộc (Wood) | Burst/Ranged | Falling-petal sword dance → literal flower motif |
| Savage | **Bug** | *(new)* | — | Swarm/Scrappy | Skill archetype reused from Cái Bang (Beggar Clan) — mob-tactics, group-based, already in `VOHOC_DEFS` as a sect-less school |
| Tide | **Dawn** | *(new)* | — | Internal/Renewal | Skill archetype reused from Võ Đang — internal cultivation, already sect-less in `VOHOC_DEFS` |

The prototype's sect-less starter (`vophai`/Tán Nhân) stays sect-less — it's the pre-class
starting state, matching the proposal's "class chosen at the ceremony that replaces the
prototype's sect ceremony."

## 2. Core system vocabulary

| Prototype (VN) | Axie Wuxia | System (unchanged mechanically) |
|---|---|---|
| Đan Điền — cultivation realm (10 stages) | **Ascension** (10 stages) | `player.dantian.realm` |
| Đột Phá / Lôi Kiếp — breakthrough / tribulation minigame | **Ascension Trial** | `breakthrough()`, `TRIB` |
| Tu Vi — realm-progress currency | **Anima** | `player.dantian.tuvi` |
| Phi Thăng — final ascension | **Starflight** | `ascendToImmortal()` |
| Kinh Mạch — 8 meridian stat tracks | **Instinct Channels** | `MERIDIANS` |
| Chân Khí — passive currency for meridians | **Instinct** | `player.khi` |
| Bạc (◈) — main currency | **Starbits** | `player.silver` |
| ✦ Huyền Thiết / generic materials | **Essence** | `player.mat` |
| Sect (Môn Phái) | **Class** | `SECTS` |
| Bái Sư Nhập Phái — sect ceremony | **The Calling** | sect ceremony flow |
| Thần Binh — sect signature weapon (10 tiers) | **Elder's Relic** | `THANBINH` |
| Chiêu thức / Võ Học — skill | **Card** (tagged by class + body part) | `SKILL_DEFS`, `VOHOC_DEFS` |
| Bí Kíp — manual/fragment currency | **Card Page** | `player.bikipVH` |
| Dung Hợp Thần Công — fusion ultimate | **Combo Card** | `FUSION_DEFS` |
| Quẻ Tiên Thiên — trait gacha intro | **The Hatching** | trait-roll intro screen |
| Nhân Mạch — NPC relationships | **Bonds** | `player.relations` |
| "Luyện công" offline progression | **Nesting** | offline-gain grant |
| Tội Ác / PK red-name | **Notoriety** | `player.toiac` |
| Linh Thú — pet | **Companion Axie** | `PET_DEFS` |
| Thú Cưỡi — mount | **Steed** | `MOUNT_TIERS` |
| Cánh — wings | **Wing Charm** | `WING_DEFS` |
| Áo Choàng — cloak | **Elder Cloak** | `CLOAK_TIERS` |
| Ma Tôn Giáng Thế — world boss event | **Overlord's Descent** *(canonical — named in proposal)* | `MATON` |
| Ngũ Ấn / Trấn Ải bosses | **Sigils** *(canonical)* | `BOSS_DEFS` per-map guardian+gate bosses |
| Giang Hồ (the world) | **Lunacia** *(canonical)* | — |
| Bảng Xếp Hạng Võ Lâm | **Lunacia's Number One Trainer** board *(canonical — the game's own final title)* | `leaderboard` |

## 3. Regions — 8 maps

| Map id | Level | Zone type | Axie Wuxia region |
|---|---|---|---|
| `tuongduong` | hub | safe | **Lunaris City** *(canonical)* |
| `daohoa` | 1–20 | safe | **Petalshade Isle** *(canonical — starting isle)* |
| `ngoai` | 10–20 | safe | **Petalshade Outskirts** |
| `chungnam` | 20–40 | pk | **Thornwood Reach** |
| `comoc` | 40–60 | pk | **Hollow Roost** |
| `tuyettinh` | 60–80 | pk | **Frostmire Vale** |
| `mongco` | 80–100 | pk | **Ashen Steppe** |
| `nhanmon` | 100+ | freepk | **Stormgate Pass** *(canonical — endgame frontier)* |

## 4. Not decided here — genuinely open, needs your call

- **On-chain scope** (proposal flags this explicitly — cosmetics/collectibles mapping is a later decision, out of scope for Phase 1–3).
- **Final title wording** beyond "Lunacia's Number One Trainer" (already the leaderboard name — confirm it's also the end-game title, or if something else is wanted).
- **Save/account policy** for existing wuxia-build players, if any migrate — not a Phase 1–3 concern but flagged per the proposal's own open-decisions list.
- **Individual NPC names and full quest/story prose** — Section 2/3 above renames *systems and places*; the actual questline text, NPC personas, and dialogue are authored content, not mechanical rename, and are being written per-quest as part of Phase 3 (see repo `TODO` for progress).
