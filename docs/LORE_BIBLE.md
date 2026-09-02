> ⚠ **TÀI LIỆU ĐÃ BỎ — ĐỪNG DÙNG.**
> File này mô tả cốt truyện Sigil / Warden / Overlord, đã bị thay hẳn bằng canon
> **Vaeldra — Morvahn — Năm Trụ Khoá**. Không một danh từ riêng nào trong đây còn đúng với game.
> Canon hiện hành: `CLAUDE.md`, mục "Cốt truyện (canon)". Hiện trạng trong game và chỗ còn lệch:
> `docs/KHAO_SAT_UX_COTTRUYEN.md`.
> Giữ lại chỉ để tra lịch sử thiết kế.

# Lore Bible — Axie Wuxia narrative rewrite

This is the Phase 3 "World & story" pass the product proposal (`Axie_Wuxia_Product_Proposal.docx`)
and `NAMING_MAP.md` call for: replacing the prototype's Jin-Yong-flavored plot (Song dynasty,
Mongol invasion, Xiangyang, Peach Blossom Island, Seven Great Sects) with a genuine Lunacia story,
without touching region names, class names, English skill names, or any code identifier already
established by the earlier reskin pass.

Everything below is grounded in one of three sources, in priority order:
1. **Real Axie Infinity lore** (via web research — Atia, Lunacia, Chimeras, Sigils/Origin, the
   Codex's Golemry/Spirit-Clay-corruption arc) — cited inline.
2. **This repo's own canonical decisions** — the proposal's pitch paragraph and `NAMING_MAP.md`'s
   rename table, both already treat this exact rewrite as "Phase 3" and pre-decided several terms
   (Lunacia, Sigils, Overlord's Descent, Wandering Axies, Lunacia's Number One Trainer). Those are
   followed verbatim, not reinvented.
3. **My own invention**, only where neither source decided something (specific NPC names, the
   exact plot beats per chapter, boss identities, item flavor).

## 1. Real-world grounding (via WebSearch)

- Lunacia was once a peaceful land; its Axies and the world itself trace back to **Atia**, a
  world-egg/goddess whose hatching-light gave rise to the Axies. ([axieinfinity.com/lore](https://axieinfinity.com/lore), [The Lunacian](https://blog.axieinfinity.com/p/what-is-aoc))
- **Chimeras** are corrupted creatures whose "apparition" is the central threat of Lunacia in
  Origin's Adventure Mode — Lunacia is under attack and Axies must fight them off while rebuilding
  the kingdom. ([support.axieinfinity.com](https://support.axieinfinity.com/hc/en-us/articles/21397975338523))
- The Codex's Season 1 ("Songs of the Soil") lore explores **Golemry** (the craft of shaping
  **Spirit Clay**, discovered under the "Gentle Craft" doctrine of restraint), an old **alliance
  between the Sapidae and Axies** during a war, and **a corruption that created one of Lunacia's
  greatest threats** — a listener named Veyl broke the Gentle Craft by shaping Spirit Clay from
  intent instead of harmony. ([blog.axieinfinity.com/p/codex-season-1-is-live](https://blog.axieinfinity.com/p/codex-season-1-is-live))
- Players who raise and field Axies are **Lunacians**.

These four ideas — a founding hatching-light, Chimeras as the roaming threat, an old doctrine of
restraint broken by someone who meant well, and "Golem" as a real in-universe creature/craft word
— are the real-lore anchors this rewrite borrows and localizes. Nothing here contradicts them;
where I needed specifics real lore doesn't cover (a mentor's name, a bandit gang, a final boss),
I invented in the same register.

## 2. This repo's existing canon (do not contradict)

The product proposal's own pitch paragraph for "World & Story" is the skeleton this rewrite fills
in — quoted in full because it is binding, not a suggestion:

> *"Long ago the world-egg Atia hatched, and its first light became the Axies of Lunacia. But
> beneath the old forests, the Chimeras — twisted creatures born from Atia's discarded shells —
> have begun to break the Five Sigils that bind them. You are a young Axie of Petalshade Isle. The
> night the Gloam Marauders raid your village, the Elder sends you across the strait to Lunaris
> City with a single charge: find your class, grow strong, and stand where the Sigils fail."*

`NAMING_MAP.md` additionally freezes (marked **canonical** there): `Giang Hồ` → **Lunacia**;
`Ma Tôn Giáng Thế` → **Overlord's Descent**; `Ngũ Ấn`/`Trấn Ải` bosses → **Sigils**; the final
title → **Lunacia's Number One Trainer**; region names (Petalshade Isle, Lunaris City, Thornwood
Reach, Hollow Roost, Frostmire Vale, Ashen Steppe, Stormgate Pass) and all 9 class names are
already final and untouched by this pass. `I18N_MIGRATION_GUIDE.md` explicitly assigns quest text,
NPC dialogue, and the story intro to "the Phase 3 story rewrite (Lunacia/Sigils framing)" — i.e.
this exact document and edit.

The dungeon flavor text already seeded **"Gloam Marauder Chieftain"** as the Petalshade dungeon
boss (`pb_daohoa` desc) before I touched anything — so "Gloam Marauders" as the early-game raider
gang was already decided, not something I introduced.

## 3. The skeleton this rewrite fills in

**Threat.** Long ago, Atia's hatching scattered shell-shards across Lunacia; the worst of them
warp nearby life into **Chimeras** — most are simply feral wildlife-gone-wrong (the game's
everyday enemies, already flavored this way). But the densest, oldest concentration of that
corruption was never fully cleansed — only bound. Five ancient **Sigils** (one per element: Kim
Metal, Mộc Wood, Thủy Water, Hỏa Fire, Thổ Earth — the game's existing Ngũ Hành system, untouched)
were raised across Lunacia generations ago to contain it. Each Sigil is watched over by a
**Warden** — once a protector, now slowly twisted by the very corruption it guards against. Every
region's endgame dungeon boss ("Trấn Ải") is a Warden; the three lesser guardians before it
("Thủ Vệ") are its corrupted retinue. Killing a Warden frees the region around it immediately —
but every Sigil that falls also loosens what they're collectively holding back: an emergent
mass-corruption avatar called **the Overlord** (Bá Chủ), whose periodic manifestation is the
"Overlord's Descent" world-boss event. This preserves the original plot's central irony (the
"heroic" act of clearing each region's final boss is also what edges the world closer to a bigger
danger) without a shred of the original geopolitics.

**Antagonist faction, early game.** The **Gloam Marauders** ("Hắc Phong" — kept as their
in-fiction Vietnamese name, since it was already seeded in the Petalshade dungeon desc as the
English equivalent) are a raider gang of Chimera-touched Axies preying on Petalshade Isle and the
Outskirts. They are the early-game recurring threat in place of the original "black-clad Mongol
scouts," and every existing `Hắc Phong Sát` / `Hắc Phong Sát Thủ` mob reference in quest text now
reads as this gang — no mob `id`, `img`, or object needed to change for this, only the surrounding
prose.

**Wandering Axies.** Neutral, un-Tribed Axies traveling Lunacia alone to test themselves — the
replacement for "Giang Hồ Du Hiệp / Đại Hiệp," the game's existing neutral PK-sparring NPCs.

**Protagonist.** An Unclassed hatchling, raised on Petalshade Isle by **the Elder** (`truonglang`
— already generic enough to need no rename; "the Elder" is literally the proposal's own word for
this role) after the Gloam Marauders' raid left the isle's hatchery shaken. At level 10 the
hatchling answers **the Calling** (already an established in-code term — "Reach level 10 and
answer the Calling!") — the ceremony where the 9 Tribes (class-tribes, replacing "môn phái," see
glossary) open their doors. This beat replaces "Bái Sư Nhập Phái."

**Chapter structure.** Unchanged from the existing 7-chapter/7-region backbone (`QUESTS`' embedded
`chapter` field) — only the identity of the threat, mentors, and place-names inside each chapter
changes:

| Chapter | Region (already named) | Mentor NPC (`id`, unchanged) | Beat |
|---|---|---|---|
| I | Petalshade Isle | `truonglang` — the Elder | Gloam Marauders raid the isle; hatchling proves itself; breaks its shell at level 10 |
| II | Lunaris City | `quachtinh` → **Elder Rell** | Joins the city's defense against Gloam Marauder incursions |
| III | Thornwood Reach | `daosi` → **Corran, the Warden-Keeper** | Corrupted ex-Tribe renegades and venom-Chimeras infest the reach |
| IV | Hollow Roost | `thumo` → **Sylas, Keeper of the Roost** | Restless nest-wraiths and old Golems guard the hollow |
| V | Frostmire Vale | `ttmon` → **Liora the Hermit** | Poison-bloom Chimeras and "Lost Ones" haunt the vale |
| VI | Ashen Steppe | `noiung` → **Dax, the Outrider** | Tracking a Chimera swarm gathering on the open plains |
| VII | Stormgate Pass | `laotuong` → **Old General Brann** | The last Sigil, the Overlord's shadow, and the final title |

`monkhach` (Elder Rell's aide in Lunaris City) becomes **Wren, the Scout** — a nod to the Bird
Tribe without claiming Wren belongs to it.

## 4. Glossary — replacement terms, used consistently

| Old (wuxia) | New (Lunacia) | Notes |
|---|---|---|
| Giang hồ / Võ lâm ("the martial world") | **Lunacia** | Used as the proper noun, exactly as the game already does elsewhere ("một hatchling, alone in Lunacia") |
| Môn phái (sect) | **Tộc** (Tribe) | Generic collective noun; each specific Tribe keeps its established English name (Mech, Aquatic, Dusk, Reptile, Beast, Bird, Plant, Bug, Dawn) embedded in Vietnamese sentences, exactly like the existing "Aquatic tự hào về đệ tử của mình" pattern |
| Bái Sư Nhập Phái (become-a-disciple ceremony) | **the Calling** ("Lời Triệu Gọi" / "đáp lời Triệu Gọi") | Already an established in-code phrase |
| Sư phụ (master) | **Trưởng Tộc** (Tribe Elder) | Used for the one flagged occurrence (companion "master" relationship bond) |
| Đại hiệp / Đệ Nhất Hiệp (great hero title) | **Anh Hùng** / final title **"Lunacia's Number One Trainer"** | Per `NAMING_MAP.md`, canonical |
| Nội công (internal-cultivation flavor word) | dropped; **Chân Khí** kept as the underlying stat/flavor noun, unchanged | Only 1 real occurrence existed; stat system itself (Đan Điền, Kinh Mạch, Chân Khí, Tuyệt Học) is untouched — out of scope, see §6 |
| Hắc Phong Sát / Sát Thủ (bandit gang) | kept as-is — **Gloam Marauders** | Already the dungeon-desc's English name for this exact gang; no mob id/name field needed to change |
| Giang Hồ Du Hiệp / Đại Hiệp (neutral PK NPC) | **Axie Lang Thang** (Wandering Axie) | Per proposal's own phrase "meet Wandering Axies" |
| Ma Tôn / Ma Tôn Giáng Thế | **Bá Chủ** (the Overlord) / **Bá Chủ Giáng Thế** (Overlord's Descent) | Canonical per `NAMING_MAP.md` |
| Ngũ Ấn (Five Seals) | kept as **Ngũ Ấn / Sigils** | Canonical per `NAMING_MAP.md` — concept re-grounded (§3) but the word itself already fits |
| Tịch Ma Điện / Vạn Ma Điện (Demon Hall) | **Vực Nguyên Thủy** (the Origin Rift) | Where the Overlord is bound |
| Trấn Ải / Thủ Vệ (chapter boss / lesser guardians) | flavored as **Wardens** (Vệ Thần) of a Sigil | Mechanic names (`Trấn Ải` etc.) are internal, untouched |
| Đào Hoa Trận Nhân, Toàn Chân Phản Đồ, Xà Nữ, Cổ Mộ Thị Nữ, Cơ Quan Mộc Nhân, Huyết Biên Bức, Tuyệt Tình Đệ Tử, Tình Hoa Độc Yêu, Hắc Y Sát Thủ, Thám Tử/Cung Thủ/Kỵ Binh/Cuồng Binh Mông Cổ, Tu La Đao Khách (named wuxia mobs) | renamed per-region into "Chimera ___" / "Golem ___" / region-flavored titles, or dropped the ethnic-historical qualifier (Mông Cổ, Đột Quyết) | Stretch-goal item; see the mob table folded into `MOBS`/`BOSS_DEFS` edits |

## 5. Tone

The proposal itself calls for a tone shift: *"from the prototype's tragic wuxia war story to
cozy-but-threatened adventure: real stakes, warm voice, collectible charm."* Concretely: quest and
NPC prose drops dynastic-war framing (no armies, no imperial court, no ethnic-nation antagonist)
in favor of a frontier-community-vs-corruption framing — still has real danger and loss (Wardens
who were once someone's friend, a village raided, a final Sigil at risk of breaking), but the
enemy is an impersonal natural-magical threat (corruption/Chimeras) rather than a nation of people.

## 6. Explicitly out of scope for this pass

Flagged here rather than silently left half-done, so the remaining wuxia-flavored surface area is
visible for a future pass:

- **`VOHOC_DEFS` / `FUSION_DEFS`** (~90 entries) — the free-form skill tree named after real Jin
  Yong novels and techniques (Cửu Âm Chân Kinh, Hàng Long Thập Bát Chưởng, Độc Cô Cửu Kiếm...),
  grouped by `school`/`origin` fields the UI reads directly. This is a separate, much larger
  system from the `SECTS` class skills (which were already reskinned) and was not named anywhere
  in this task's scope. Renaming it well means redesigning ~90 skill identities, not just
  swapping strings — a dedicated pass, not a subtask of this one.
- **The "Tán Tu" wandering-companion system** (`TT_HO`/`TT_TEN_NAM`/`TT_TEN_NU` name generators,
  `TT_LINES` personality dialogue, gift/bond mechanics) — procedurally generates Chinese-style
  surnames and given names for a whole social/romance subsystem. Only the one flagged term inside
  it (`TT_BOND_NAME.suphu`, the "master" bond label) was touched; the name generator and ambient
  dialogue pools are untouched.
- **`Quẻ Tiên Thiên`** ("Innate Trigram" personality/fate gacha shown at character creation) — a
  self-contained Chinese-cosmology mechanic (16 hexagram cards, Càn Khôn framing), not narrative
  prose, not mentioned in scope.
- **Đan Điền / Kinh Mạch / Chân Khí / Tuyệt Học** cultivation-realm system naming (Kim Đan Cảnh,
  Nguyên Anh, Hóa Thần...) — per the task's own instruction, renaming this was explicitly
  discretionary ("decide whether to rename... without breaking the stat"); left as-is since it's a
  systems-naming decision already tracked separately in `NAMING_MAP.md` (Đan Điền → "Ascension")
  and not yet executed anywhere else in the codebase either.
- The game's own title (`<title>`, the `sect-select` screen's "Giang Hồ Huyễn Ảnh" h1) and the
  `Quẻ Tiên Thiên` character-creation screen copy in `index.html` — brand-level naming, not story
  prose, left for whoever owns that decision.

These are genuinely the next-largest wuxia-flavored surfaces left in the game after this pass.
