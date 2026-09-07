# Năm prompt THÂN KHỞI ĐẦU — bản 2, sửa TỈ LỆ và PHONG CÁCH

> Mỗi mục là MỘT prompt hoàn chỉnh. Đính kèm gói `Rough Weave` làm tham chiếu.
> Nền tài liệu: `docs/PROMPT_GIAP_DARKWIZARD.md §7`.

Bản 1 hỏng ở hai chỗ, cả hai nay thành ràng buộc có SỐ ĐO:

**① Đầu quá nhỏ.** Bộ xương là chibi bốn đầu. Đo trên gói tham chiếu: cao 1164 px, đầu 334 px
= **3,49 đầu**, và **đầu RỘNG BẰNG VAI** (342 / 334 = 1,02). Gói giao gần nhất về với đầu chỉ
bằng **79%** bề rộng vai — thành đầu nhỏ trên thân người lớn.

**② Phong cách sai hẳn.** Đo trên chính tranh anh hùng của game: **độ sáng trung bình 16-28%**,
hơn **một nửa số điểm ảnh nằm dưới 25% sáng**, màu rực chỉ phủ 10-20% và chỉ làm điểm nhấn.
Gói giao gần nhất về là **áo ngủ tím pastel + dép quai hậu** — sáng, sạch, dễ thương, ngược
hoàn toàn. Đồ khởi đầu của nhân vật cấp 1 trong thế giới này cũng phải tối, thô và đã sờn.


---

## ① Dark Knight  ·  `thieulam`  ·  thay `dk1`

```
A single 2D game character rig for a Spine skeletal-animation package, using the SAME skeleton
and the SAME atlas layout as the armour package I am attaching: 83 bones, 13 slots, 20
animations, one 2048x2048 texture page, same region names and bounds.

This is the STARTING BODY, not an armour set. It is what the character looks like with every
equipment slot empty, and every armour set will be composited on top of it, one body part at
a time.

=== HARD REQUIREMENT 0 · CHIBI PROPORTIONS — MEASURED, NOT APPROXIMATE ===

The template is a FOUR-HEAD chibi rig. Hit these numbers; they are measured off the reference
package I am attaching, not estimated:

  · TOTAL HEIGHT = 3.4 to 3.6 head-heights, crown of hair to heel.
    Head including hair is 28-30% of the whole figure.
    Reference package: figure 1164 px tall, head 334 px.
  · HEAD WIDTH must be AT LEAST AS WIDE AS THE SHOULDERS — ratio 0.95 to 1.05.
    Reference package: head 342 px wide, shoulders 334 px.
  · Everything below the chin is 71% of total height; legs are short and the torso compact.
  · Hands and feet are oversized and chunky, roughly one third of a head each.
  · Eyes are large and sit low, near the vertical middle of the head.

⚠ THIS IS THE THING THE LAST DELIVERY GOT WRONG. It came back with the head only 79% of
shoulder width, and it read as a small head on a tall adult body — the wrong character
entirely. If in doubt, make the head BIGGER. A four-head chibi looks wrong the moment the
head starts looking like a realistic head.

=== HARD REQUIREMENT 1 · EACH BODY PART STAYS INSIDE ITS OWN SLOT ===

This is the requirement the whole package exists for, and it overrides every style choice.

The game replaces ONE body part at a time: helmet swaps the 头 art, armour swaps 躯干, gloves
swap 左手/右手, boots swap 左腿/右腿. So nothing painted into one region may hang over the body
part of another region.

Concretely: NO floor-length robe, skirt or coat panel painted into 躯干. Torso art ends at the
hip line. Everything below the hip belongs to 左腿 and 右腿. If the character's look needs a
long garment, draw it as an OPEN COAT — two front panels hanging down the OUTSIDE of each hip,
with the centre left clear so the legs read from knee to foot. A closed floor-length robe makes
equipped boots invisible, and that is not fixable in code afterwards.

Same rule for the head: no hood or collar that spills onto the shoulders, because the shoulders
belong to 躯干.

=== HARD REQUIREMENT 2 · HAIR AND FACE MUST BOTH READ CLEARLY ===

No headwear at all on the base body: bare head, hair only.

The HAIR is this character's main identifying feature at chibi size — it must be a distinct,
readable shape in silhouette, in the exact colour named below, not a flat dark mass. Ears must
be visible where the class calls for it.

The FACE must be fully drawn and unobstructed: both eyes, eyebrows, nose line and mouth,
clearly readable at 160 pixels tall. No hair falling across the eyes, no shadow mask.

Deliver ALL FOUR head attachments on the 头 slot, each a genuinely different expression:
  头       neutral, eyes open, mouth closed
  头_开心   happy, eyes curved, mouth smiling
  头_痛苦   pained, brows drawn together, mouth open
  头_闭眼   eyes closed, calm
The hair must be pixel-identical across all four; only the face changes. The game swaps these
during hurt, death, sitting and dancing, so a missing or duplicated one loses that expression
everywhere.

=== HARD REQUIREMENT 2b · A COMPLETE, FULLY KEYED ANIMATION SET ===

Deliver all 20 animations of the template, every one fully keyed across its whole length — not
a static pose held for the duration. The bake samples fixed frame counts out of each, so an
animation that does not move produces 16 identical frames and the character freezes on screen.

These 15 are read directly by the bake and must all move:
  00_Idle · 00_Walk · 00_Run · 05_MagicAttack · 08_SwordAttack · 08_SwordAttack2
  10_ArcheryAttack · 06_PunchAttack · 03_Hurt · 02_Death · 04_Jumpping
  00_Squat · 09_Interactive · 07_StatusEffect · 01_Dance
For reference, the reference package I am attaching carries 66-250 keys per animation and
0.33-1.60 seconds of length. Anything much thinner than that is a held pose.

=== HARD REQUIREMENT 3 · A COMPLETE BODY, MODESTLY CLOTHED ===

Plain undyed underclothes only — nothing that reads as armour, no belt hardware, no shoulder
pieces, no capes. Hands, forearms, neck, knees and feet must exist as real anatomy, not as
empty holes inside floating cloth.

=== HARD REQUIREMENT 4 · DARK GOTHIC-MEDIEVAL, NOT PASTEL AND NOT CUTE ===

This game's art direction is dark gothic medieval fantasy: worn, grim, heavy. I measured the
game's own class artwork and these are its real numbers — match them:

  · MEAN LIGHTNESS 16-28%. More than HALF of all painted pixels sit below 25% lightness.
  · MEAN SATURATION 26-33%. Strongly saturated colour covers at most 10-20% of the surface,
    and only as an accent — a glow, a gem, a lining.
  · Small metallic trim in dull gold or bronze, 1-5% of the surface, along edges and hems.
  · Cloth is coarse and worn: visible weave, frayed edges, faded dye, dirt at the hem.
    Leather is scuffed. Nothing looks new, clean or freshly laundered.

⚠ THE LAST DELIVERY GOT THIS WRONG TOO. It came back as a pale lilac sleeveless nightshirt
with a soft pastel palette and open sandals — bright, clean and cute, which is the opposite
of this direction on every axis. Even the STARTING outfit of a level-one character in this
world is dark, coarse and already worn.

The face may stay young and appealing, but the clothing, palette and mood must not.

STYLE: clean vector-like 2D game art, crisp dark outline, flat cel shading with one soft
ambient gradient. No photorealism, no painterly brushwork, no text, no watermark, no ground
shadow, no background scenery, no weapon and no props. Full body, head to feet, nothing
cropped.

=== THIS CLASS ===

CLASS: the warrior. Short spiky CRIMSON-RED hair swept back, sharp features, grey eyes.
(The class art shows this character only from behind, so the face is yours to invent — but
the red hair is fixed.)
STARTING OUTFIT: a sleeveless quilted gambeson in dirty grey-brown, laced at the chest, the
padding visibly worn thin at the shoulders. Bare arms with scuffed leather bracers at both
forearms. Dark canvas trousers ending at mid-calf, a plain iron-buckled belt, heavy scuffed
leather boots. Nothing hangs below the hip.
PALETTE measured from this class's hero art: #221d38 and #352b3b dark violet-slate ground,
#433f56 mid violet, #5a282c oxblood accent, #7c6a77 worn highlight. Dull iron on the buckle
and bracer studs; no bright metal.
```

Nướng: `--danh 08_SwordAttack`


---

## ② Dark Wizard  ·  `baidasan`  ·  thay `dw1`

```
A single 2D game character rig for a Spine skeletal-animation package, using the SAME skeleton
and the SAME atlas layout as the armour package I am attaching: 83 bones, 13 slots, 20
animations, one 2048x2048 texture page, same region names and bounds.

This is the STARTING BODY, not an armour set. It is what the character looks like with every
equipment slot empty, and every armour set will be composited on top of it, one body part at
a time.

=== HARD REQUIREMENT 0 · CHIBI PROPORTIONS — MEASURED, NOT APPROXIMATE ===

The template is a FOUR-HEAD chibi rig. Hit these numbers; they are measured off the reference
package I am attaching, not estimated:

  · TOTAL HEIGHT = 3.4 to 3.6 head-heights, crown of hair to heel.
    Head including hair is 28-30% of the whole figure.
    Reference package: figure 1164 px tall, head 334 px.
  · HEAD WIDTH must be AT LEAST AS WIDE AS THE SHOULDERS — ratio 0.95 to 1.05.
    Reference package: head 342 px wide, shoulders 334 px.
  · Everything below the chin is 71% of total height; legs are short and the torso compact.
  · Hands and feet are oversized and chunky, roughly one third of a head each.
  · Eyes are large and sit low, near the vertical middle of the head.

⚠ THIS IS THE THING THE LAST DELIVERY GOT WRONG. It came back with the head only 79% of
shoulder width, and it read as a small head on a tall adult body — the wrong character
entirely. If in doubt, make the head BIGGER. A four-head chibi looks wrong the moment the
head starts looking like a realistic head.

=== HARD REQUIREMENT 1 · EACH BODY PART STAYS INSIDE ITS OWN SLOT ===

This is the requirement the whole package exists for, and it overrides every style choice.

The game replaces ONE body part at a time: helmet swaps the 头 art, armour swaps 躯干, gloves
swap 左手/右手, boots swap 左腿/右腿. So nothing painted into one region may hang over the body
part of another region.

Concretely: NO floor-length robe, skirt or coat panel painted into 躯干. Torso art ends at the
hip line. Everything below the hip belongs to 左腿 and 右腿. If the character's look needs a
long garment, draw it as an OPEN COAT — two front panels hanging down the OUTSIDE of each hip,
with the centre left clear so the legs read from knee to foot. A closed floor-length robe makes
equipped boots invisible, and that is not fixable in code afterwards.

Same rule for the head: no hood or collar that spills onto the shoulders, because the shoulders
belong to 躯干.

=== HARD REQUIREMENT 2 · HAIR AND FACE MUST BOTH READ CLEARLY ===

No headwear at all on the base body: bare head, hair only.

The HAIR is this character's main identifying feature at chibi size — it must be a distinct,
readable shape in silhouette, in the exact colour named below, not a flat dark mass. Ears must
be visible where the class calls for it.

The FACE must be fully drawn and unobstructed: both eyes, eyebrows, nose line and mouth,
clearly readable at 160 pixels tall. No hair falling across the eyes, no shadow mask.

Deliver ALL FOUR head attachments on the 头 slot, each a genuinely different expression:
  头       neutral, eyes open, mouth closed
  头_开心   happy, eyes curved, mouth smiling
  头_痛苦   pained, brows drawn together, mouth open
  头_闭眼   eyes closed, calm
The hair must be pixel-identical across all four; only the face changes. The game swaps these
during hurt, death, sitting and dancing, so a missing or duplicated one loses that expression
everywhere.

=== HARD REQUIREMENT 2b · A COMPLETE, FULLY KEYED ANIMATION SET ===

Deliver all 20 animations of the template, every one fully keyed across its whole length — not
a static pose held for the duration. The bake samples fixed frame counts out of each, so an
animation that does not move produces 16 identical frames and the character freezes on screen.

These 15 are read directly by the bake and must all move:
  00_Idle · 00_Walk · 00_Run · 05_MagicAttack · 08_SwordAttack · 08_SwordAttack2
  10_ArcheryAttack · 06_PunchAttack · 03_Hurt · 02_Death · 04_Jumpping
  00_Squat · 09_Interactive · 07_StatusEffect · 01_Dance
For reference, the reference package I am attaching carries 66-250 keys per animation and
0.33-1.60 seconds of length. Anything much thinner than that is a held pose.

=== HARD REQUIREMENT 3 · A COMPLETE BODY, MODESTLY CLOTHED ===

Plain undyed underclothes only — nothing that reads as armour, no belt hardware, no shoulder
pieces, no capes. Hands, forearms, neck, knees and feet must exist as real anatomy, not as
empty holes inside floating cloth.

=== HARD REQUIREMENT 4 · DARK GOTHIC-MEDIEVAL, NOT PASTEL AND NOT CUTE ===

This game's art direction is dark gothic medieval fantasy: worn, grim, heavy. I measured the
game's own class artwork and these are its real numbers — match them:

  · MEAN LIGHTNESS 16-28%. More than HALF of all painted pixels sit below 25% lightness.
  · MEAN SATURATION 26-33%. Strongly saturated colour covers at most 10-20% of the surface,
    and only as an accent — a glow, a gem, a lining.
  · Small metallic trim in dull gold or bronze, 1-5% of the surface, along edges and hems.
  · Cloth is coarse and worn: visible weave, frayed edges, faded dye, dirt at the hem.
    Leather is scuffed. Nothing looks new, clean or freshly laundered.

⚠ THE LAST DELIVERY GOT THIS WRONG TOO. It came back as a pale lilac sleeveless nightshirt
with a soft pastel palette and open sandals — bright, clean and cute, which is the opposite
of this direction on every axis. Even the STARTING outfit of a level-one character in this
world is dark, coarse and already worn.

The face may stay young and appealing, but the clothing, palette and mood must not.

STYLE: clean vector-like 2D game art, crisp dark outline, flat cel shading with one soft
ambient gradient. No photorealism, no painterly brushwork, no text, no watermark, no ground
shadow, no background scenery, no weapon and no props. Full body, head to feet, nothing
cropped.

=== THIS CLASS ===

CLASS: the spellcaster. LONG STRAIGHT WHITE hair falling past the shoulders, two thin braids
at the temples, dark eyes. SAME FACE as the "Rough Weave" armour package I am attaching —
that set already ships with this character, so face, skin tone and hair must match it exactly.
STARTING OUTFIT: a short sleeveless robe of coarse dark cloth ending ABOVE THE KNEE, deep
violet-black, faded and unevenly dyed, with a frayed hem. A knotted cord belt. Bare arms.
Dark cloth wraps spiralling from ankle to knee over hard-soled low boots.
⚠ Two things the last delivery got wrong and must NOT come back: a pale lilac pastel palette
with open sandals (this character's world is dark and worn — see HARD REQUIREMENT 4), and a
head too small for the body (see HARD REQUIREMENT 0).
⚠ The chibi currently in the game wears a floor-length closed robe and has dark blue hair.
Do not reproduce either — a closed floor-length robe makes equipped boots invisible forever.
PALETTE measured from this class's hero art: #292438 and #352e43 deep violet ground, #45354d
mid violet, #867186 grey-mauve, #baa7bb pale lilac used ONLY as a thin edge highlight, never
as the main cloth colour.
```

Nướng: `--danh 05_MagicAttack`


---

## ③ Spellblade  ·  `minhgiao`  ·  thay `sb1`

```
A single 2D game character rig for a Spine skeletal-animation package, using the SAME skeleton
and the SAME atlas layout as the armour package I am attaching: 83 bones, 13 slots, 20
animations, one 2048x2048 texture page, same region names and bounds.

This is the STARTING BODY, not an armour set. It is what the character looks like with every
equipment slot empty, and every armour set will be composited on top of it, one body part at
a time.

=== HARD REQUIREMENT 0 · CHIBI PROPORTIONS — MEASURED, NOT APPROXIMATE ===

The template is a FOUR-HEAD chibi rig. Hit these numbers; they are measured off the reference
package I am attaching, not estimated:

  · TOTAL HEIGHT = 3.4 to 3.6 head-heights, crown of hair to heel.
    Head including hair is 28-30% of the whole figure.
    Reference package: figure 1164 px tall, head 334 px.
  · HEAD WIDTH must be AT LEAST AS WIDE AS THE SHOULDERS — ratio 0.95 to 1.05.
    Reference package: head 342 px wide, shoulders 334 px.
  · Everything below the chin is 71% of total height; legs are short and the torso compact.
  · Hands and feet are oversized and chunky, roughly one third of a head each.
  · Eyes are large and sit low, near the vertical middle of the head.

⚠ THIS IS THE THING THE LAST DELIVERY GOT WRONG. It came back with the head only 79% of
shoulder width, and it read as a small head on a tall adult body — the wrong character
entirely. If in doubt, make the head BIGGER. A four-head chibi looks wrong the moment the
head starts looking like a realistic head.

=== HARD REQUIREMENT 1 · EACH BODY PART STAYS INSIDE ITS OWN SLOT ===

This is the requirement the whole package exists for, and it overrides every style choice.

The game replaces ONE body part at a time: helmet swaps the 头 art, armour swaps 躯干, gloves
swap 左手/右手, boots swap 左腿/右腿. So nothing painted into one region may hang over the body
part of another region.

Concretely: NO floor-length robe, skirt or coat panel painted into 躯干. Torso art ends at the
hip line. Everything below the hip belongs to 左腿 and 右腿. If the character's look needs a
long garment, draw it as an OPEN COAT — two front panels hanging down the OUTSIDE of each hip,
with the centre left clear so the legs read from knee to foot. A closed floor-length robe makes
equipped boots invisible, and that is not fixable in code afterwards.

Same rule for the head: no hood or collar that spills onto the shoulders, because the shoulders
belong to 躯干.

=== HARD REQUIREMENT 2 · HAIR AND FACE MUST BOTH READ CLEARLY ===

No headwear at all on the base body: bare head, hair only.

The HAIR is this character's main identifying feature at chibi size — it must be a distinct,
readable shape in silhouette, in the exact colour named below, not a flat dark mass. Ears must
be visible where the class calls for it.

The FACE must be fully drawn and unobstructed: both eyes, eyebrows, nose line and mouth,
clearly readable at 160 pixels tall. No hair falling across the eyes, no shadow mask.

Deliver ALL FOUR head attachments on the 头 slot, each a genuinely different expression:
  头       neutral, eyes open, mouth closed
  头_开心   happy, eyes curved, mouth smiling
  头_痛苦   pained, brows drawn together, mouth open
  头_闭眼   eyes closed, calm
The hair must be pixel-identical across all four; only the face changes. The game swaps these
during hurt, death, sitting and dancing, so a missing or duplicated one loses that expression
everywhere.

=== HARD REQUIREMENT 2b · A COMPLETE, FULLY KEYED ANIMATION SET ===

Deliver all 20 animations of the template, every one fully keyed across its whole length — not
a static pose held for the duration. The bake samples fixed frame counts out of each, so an
animation that does not move produces 16 identical frames and the character freezes on screen.

These 15 are read directly by the bake and must all move:
  00_Idle · 00_Walk · 00_Run · 05_MagicAttack · 08_SwordAttack · 08_SwordAttack2
  10_ArcheryAttack · 06_PunchAttack · 03_Hurt · 02_Death · 04_Jumpping
  00_Squat · 09_Interactive · 07_StatusEffect · 01_Dance
For reference, the reference package I am attaching carries 66-250 keys per animation and
0.33-1.60 seconds of length. Anything much thinner than that is a held pose.

=== HARD REQUIREMENT 3 · A COMPLETE BODY, MODESTLY CLOTHED ===

Plain undyed underclothes only — nothing that reads as armour, no belt hardware, no shoulder
pieces, no capes. Hands, forearms, neck, knees and feet must exist as real anatomy, not as
empty holes inside floating cloth.

=== HARD REQUIREMENT 4 · DARK GOTHIC-MEDIEVAL, NOT PASTEL AND NOT CUTE ===

This game's art direction is dark gothic medieval fantasy: worn, grim, heavy. I measured the
game's own class artwork and these are its real numbers — match them:

  · MEAN LIGHTNESS 16-28%. More than HALF of all painted pixels sit below 25% lightness.
  · MEAN SATURATION 26-33%. Strongly saturated colour covers at most 10-20% of the surface,
    and only as an accent — a glow, a gem, a lining.
  · Small metallic trim in dull gold or bronze, 1-5% of the surface, along edges and hems.
  · Cloth is coarse and worn: visible weave, frayed edges, faded dye, dirt at the hem.
    Leather is scuffed. Nothing looks new, clean or freshly laundered.

⚠ THE LAST DELIVERY GOT THIS WRONG TOO. It came back as a pale lilac sleeveless nightshirt
with a soft pastel palette and open sandals — bright, clean and cute, which is the opposite
of this direction on every axis. Even the STARTING outfit of a level-one character in this
world is dark, coarse and already worn.

The face may stay young and appealing, but the clothing, palette and mood must not.

STYLE: clean vector-like 2D game art, crisp dark outline, flat cel shading with one soft
ambient gradient. No photorealism, no painterly brushwork, no text, no watermark, no ground
shadow, no background scenery, no weapon and no props. Full body, head to feet, nothing
cropped.

=== THIS CLASS ===

CLASS: the hybrid duellist. Spiky BLACK hair swept upward, sharp angular features, amber eyes.
(Black hair, not red — the red in this class's art is the ARMOUR, not the character.)
STARTING OUTFIT: a dark sleeveless wrap top crossing the chest, edges frayed, bare shoulders
and arms, a wide dark cloth sash wound at the waist with one short tail. Fitted dark trousers
ending above the ankle, low soft boots, hand wraps at both wrists.
⚠ The chibi currently in the game has RED hair and a long wrap skirt to the ankles. Both are
wrong: the hair is black, and nothing may hang below the hip.
PALETTE measured from this class's hero art: #402825 dark brown and #41141b oxblood ground,
#5c1f31 deep wine, #936673 dusty rose, #bc4951 crimson accent on small details only.
```

Nướng: `--danh 08_SwordAttack`


---

## ④ Sylvan Ranger  ·  `toanchan`  ·  thay `elf1`

```
A single 2D game character rig for a Spine skeletal-animation package, using the SAME skeleton
and the SAME atlas layout as the armour package I am attaching: 83 bones, 13 slots, 20
animations, one 2048x2048 texture page, same region names and bounds.

This is the STARTING BODY, not an armour set. It is what the character looks like with every
equipment slot empty, and every armour set will be composited on top of it, one body part at
a time.

=== HARD REQUIREMENT 0 · CHIBI PROPORTIONS — MEASURED, NOT APPROXIMATE ===

The template is a FOUR-HEAD chibi rig. Hit these numbers; they are measured off the reference
package I am attaching, not estimated:

  · TOTAL HEIGHT = 3.4 to 3.6 head-heights, crown of hair to heel.
    Head including hair is 28-30% of the whole figure.
    Reference package: figure 1164 px tall, head 334 px.
  · HEAD WIDTH must be AT LEAST AS WIDE AS THE SHOULDERS — ratio 0.95 to 1.05.
    Reference package: head 342 px wide, shoulders 334 px.
  · Everything below the chin is 71% of total height; legs are short and the torso compact.
  · Hands and feet are oversized and chunky, roughly one third of a head each.
  · Eyes are large and sit low, near the vertical middle of the head.

⚠ THIS IS THE THING THE LAST DELIVERY GOT WRONG. It came back with the head only 79% of
shoulder width, and it read as a small head on a tall adult body — the wrong character
entirely. If in doubt, make the head BIGGER. A four-head chibi looks wrong the moment the
head starts looking like a realistic head.

=== HARD REQUIREMENT 1 · EACH BODY PART STAYS INSIDE ITS OWN SLOT ===

This is the requirement the whole package exists for, and it overrides every style choice.

The game replaces ONE body part at a time: helmet swaps the 头 art, armour swaps 躯干, gloves
swap 左手/右手, boots swap 左腿/右腿. So nothing painted into one region may hang over the body
part of another region.

Concretely: NO floor-length robe, skirt or coat panel painted into 躯干. Torso art ends at the
hip line. Everything below the hip belongs to 左腿 and 右腿. If the character's look needs a
long garment, draw it as an OPEN COAT — two front panels hanging down the OUTSIDE of each hip,
with the centre left clear so the legs read from knee to foot. A closed floor-length robe makes
equipped boots invisible, and that is not fixable in code afterwards.

Same rule for the head: no hood or collar that spills onto the shoulders, because the shoulders
belong to 躯干.

=== HARD REQUIREMENT 2 · HAIR AND FACE MUST BOTH READ CLEARLY ===

No headwear at all on the base body: bare head, hair only.

The HAIR is this character's main identifying feature at chibi size — it must be a distinct,
readable shape in silhouette, in the exact colour named below, not a flat dark mass. Ears must
be visible where the class calls for it.

The FACE must be fully drawn and unobstructed: both eyes, eyebrows, nose line and mouth,
clearly readable at 160 pixels tall. No hair falling across the eyes, no shadow mask.

Deliver ALL FOUR head attachments on the 头 slot, each a genuinely different expression:
  头       neutral, eyes open, mouth closed
  头_开心   happy, eyes curved, mouth smiling
  头_痛苦   pained, brows drawn together, mouth open
  头_闭眼   eyes closed, calm
The hair must be pixel-identical across all four; only the face changes. The game swaps these
during hurt, death, sitting and dancing, so a missing or duplicated one loses that expression
everywhere.

=== HARD REQUIREMENT 2b · A COMPLETE, FULLY KEYED ANIMATION SET ===

Deliver all 20 animations of the template, every one fully keyed across its whole length — not
a static pose held for the duration. The bake samples fixed frame counts out of each, so an
animation that does not move produces 16 identical frames and the character freezes on screen.

These 15 are read directly by the bake and must all move:
  00_Idle · 00_Walk · 00_Run · 05_MagicAttack · 08_SwordAttack · 08_SwordAttack2
  10_ArcheryAttack · 06_PunchAttack · 03_Hurt · 02_Death · 04_Jumpping
  00_Squat · 09_Interactive · 07_StatusEffect · 01_Dance
For reference, the reference package I am attaching carries 66-250 keys per animation and
0.33-1.60 seconds of length. Anything much thinner than that is a held pose.

=== HARD REQUIREMENT 3 · A COMPLETE BODY, MODESTLY CLOTHED ===

Plain undyed underclothes only — nothing that reads as armour, no belt hardware, no shoulder
pieces, no capes. Hands, forearms, neck, knees and feet must exist as real anatomy, not as
empty holes inside floating cloth.

=== HARD REQUIREMENT 4 · DARK GOTHIC-MEDIEVAL, NOT PASTEL AND NOT CUTE ===

This game's art direction is dark gothic medieval fantasy: worn, grim, heavy. I measured the
game's own class artwork and these are its real numbers — match them:

  · MEAN LIGHTNESS 16-28%. More than HALF of all painted pixels sit below 25% lightness.
  · MEAN SATURATION 26-33%. Strongly saturated colour covers at most 10-20% of the surface,
    and only as an accent — a glow, a gem, a lining.
  · Small metallic trim in dull gold or bronze, 1-5% of the surface, along edges and hems.
  · Cloth is coarse and worn: visible weave, frayed edges, faded dye, dirt at the hem.
    Leather is scuffed. Nothing looks new, clean or freshly laundered.

⚠ THE LAST DELIVERY GOT THIS WRONG TOO. It came back as a pale lilac sleeveless nightshirt
with a soft pastel palette and open sandals — bright, clean and cute, which is the opposite
of this direction on every axis. Even the STARTING outfit of a level-one character in this
world is dark, coarse and already worn.

The face may stay young and appealing, but the clothing, palette and mood must not.

STYLE: clean vector-like 2D game art, crisp dark outline, flat cel shading with one soft
ambient gradient. No photorealism, no painterly brushwork, no text, no watermark, no ground
shadow, no background scenery, no weapon and no props. Full body, head to feet, nothing
cropped.

=== THIS CLASS ===

CLASS: the archer. Long BLONDE hair in a high ponytail held by a plain leather band, POINTED
EARS, blue eyes.
STARTING OUTFIT: a worn brown leather halter top, bare midriff, bare shoulders, scuffed
leather bracers on both forearms. Short fitted leather shorts at mid-thigh, tall laced boots
to just below the knee. Nothing hangs below the hip. This is the one class whose current chibi
already follows the slot rules — keep its silhouette, but darken and age the leather.
PALETTE measured from this class's hero art: #2f382e and #4a5a4d forest green ground, #67615b
warm grey leather, #717b70 pale sage, #a78195 muted rose accent. This class is the lightest of
the five but still sits well under half lightness — no bright greens.
```

Nướng: `--danh 10_ArcheryAttack`


---

## ⑤ Dark Lord  ·  `bug`  ·  thay `dl1`

```
A single 2D game character rig for a Spine skeletal-animation package, using the SAME skeleton
and the SAME atlas layout as the armour package I am attaching: 83 bones, 13 slots, 20
animations, one 2048x2048 texture page, same region names and bounds.

This is the STARTING BODY, not an armour set. It is what the character looks like with every
equipment slot empty, and every armour set will be composited on top of it, one body part at
a time.

=== HARD REQUIREMENT 0 · CHIBI PROPORTIONS — MEASURED, NOT APPROXIMATE ===

The template is a FOUR-HEAD chibi rig. Hit these numbers; they are measured off the reference
package I am attaching, not estimated:

  · TOTAL HEIGHT = 3.4 to 3.6 head-heights, crown of hair to heel.
    Head including hair is 28-30% of the whole figure.
    Reference package: figure 1164 px tall, head 334 px.
  · HEAD WIDTH must be AT LEAST AS WIDE AS THE SHOULDERS — ratio 0.95 to 1.05.
    Reference package: head 342 px wide, shoulders 334 px.
  · Everything below the chin is 71% of total height; legs are short and the torso compact.
  · Hands and feet are oversized and chunky, roughly one third of a head each.
  · Eyes are large and sit low, near the vertical middle of the head.

⚠ THIS IS THE THING THE LAST DELIVERY GOT WRONG. It came back with the head only 79% of
shoulder width, and it read as a small head on a tall adult body — the wrong character
entirely. If in doubt, make the head BIGGER. A four-head chibi looks wrong the moment the
head starts looking like a realistic head.

=== HARD REQUIREMENT 1 · EACH BODY PART STAYS INSIDE ITS OWN SLOT ===

This is the requirement the whole package exists for, and it overrides every style choice.

The game replaces ONE body part at a time: helmet swaps the 头 art, armour swaps 躯干, gloves
swap 左手/右手, boots swap 左腿/右腿. So nothing painted into one region may hang over the body
part of another region.

Concretely: NO floor-length robe, skirt or coat panel painted into 躯干. Torso art ends at the
hip line. Everything below the hip belongs to 左腿 and 右腿. If the character's look needs a
long garment, draw it as an OPEN COAT — two front panels hanging down the OUTSIDE of each hip,
with the centre left clear so the legs read from knee to foot. A closed floor-length robe makes
equipped boots invisible, and that is not fixable in code afterwards.

Same rule for the head: no hood or collar that spills onto the shoulders, because the shoulders
belong to 躯干.

=== HARD REQUIREMENT 2 · HAIR AND FACE MUST BOTH READ CLEARLY ===

No headwear at all on the base body: bare head, hair only.

The HAIR is this character's main identifying feature at chibi size — it must be a distinct,
readable shape in silhouette, in the exact colour named below, not a flat dark mass. Ears must
be visible where the class calls for it.

The FACE must be fully drawn and unobstructed: both eyes, eyebrows, nose line and mouth,
clearly readable at 160 pixels tall. No hair falling across the eyes, no shadow mask.

Deliver ALL FOUR head attachments on the 头 slot, each a genuinely different expression:
  头       neutral, eyes open, mouth closed
  头_开心   happy, eyes curved, mouth smiling
  头_痛苦   pained, brows drawn together, mouth open
  头_闭眼   eyes closed, calm
The hair must be pixel-identical across all four; only the face changes. The game swaps these
during hurt, death, sitting and dancing, so a missing or duplicated one loses that expression
everywhere.

=== HARD REQUIREMENT 2b · A COMPLETE, FULLY KEYED ANIMATION SET ===

Deliver all 20 animations of the template, every one fully keyed across its whole length — not
a static pose held for the duration. The bake samples fixed frame counts out of each, so an
animation that does not move produces 16 identical frames and the character freezes on screen.

These 15 are read directly by the bake and must all move:
  00_Idle · 00_Walk · 00_Run · 05_MagicAttack · 08_SwordAttack · 08_SwordAttack2
  10_ArcheryAttack · 06_PunchAttack · 03_Hurt · 02_Death · 04_Jumpping
  00_Squat · 09_Interactive · 07_StatusEffect · 01_Dance
For reference, the reference package I am attaching carries 66-250 keys per animation and
0.33-1.60 seconds of length. Anything much thinner than that is a held pose.

=== HARD REQUIREMENT 3 · A COMPLETE BODY, MODESTLY CLOTHED ===

Plain undyed underclothes only — nothing that reads as armour, no belt hardware, no shoulder
pieces, no capes. Hands, forearms, neck, knees and feet must exist as real anatomy, not as
empty holes inside floating cloth.

=== HARD REQUIREMENT 4 · DARK GOTHIC-MEDIEVAL, NOT PASTEL AND NOT CUTE ===

This game's art direction is dark gothic medieval fantasy: worn, grim, heavy. I measured the
game's own class artwork and these are its real numbers — match them:

  · MEAN LIGHTNESS 16-28%. More than HALF of all painted pixels sit below 25% lightness.
  · MEAN SATURATION 26-33%. Strongly saturated colour covers at most 10-20% of the surface,
    and only as an accent — a glow, a gem, a lining.
  · Small metallic trim in dull gold or bronze, 1-5% of the surface, along edges and hems.
  · Cloth is coarse and worn: visible weave, frayed edges, faded dye, dirt at the hem.
    Leather is scuffed. Nothing looks new, clean or freshly laundered.

⚠ THE LAST DELIVERY GOT THIS WRONG TOO. It came back as a pale lilac sleeveless nightshirt
with a soft pastel palette and open sandals — bright, clean and cute, which is the opposite
of this direction on every axis. Even the STARTING outfit of a level-one character in this
world is dark, coarse and already worn.

The face may stay young and appealing, but the clothing, palette and mood must not.

STYLE: clean vector-like 2D game art, crisp dark outline, flat cel shading with one soft
ambient gradient. No photorealism, no painterly brushwork, no text, no watermark, no ground
shadow, no background scenery, no weapon and no props. Full body, head to feet, nothing
cropped.

=== THIS CLASS ===

CLASS: the commander. Dark hair to the shoulders, severe composed features, pale eyes. Keep
this the oldest-looking face of the five. (The class art keeps the head under a crowned helm,
so the face is yours to invent.)
STARTING OUTFIT: a high-collared sleeveless tunic of heavy dark cloth ending AT THE HIP,
fitted dark trousers, plain dark boots. Over it a long OPEN coat: two narrow panels hanging
down the OUTSIDE of each hip to the ankle, centre completely clear from the waist down so both
legs read fully from knee to foot. A thin bronze clasp at the collar is the only metal.
⚠ The chibi currently in the game wears a coat that closes across the front and hides the
legs. The panels must be separated, each staying outside the leg line.
PALETTE measured from this class's hero art: #292525 and #3d221a near-black ground — this is
the DARKEST of the five, 82% of its hero art sits below quarter lightness. #4e443f warm grey,
#84715f and #b1a593 bronze-tan on trim only.
```

Nướng: `--danh 05_MagicAttack`


---

## Kiểm khi nhận hàng

```bash
python3 tools/spine/kiem_goi.py <gói> '<tên-da>'                    # 1 giây, chưa cần nướng
python3 tools/spine/nuong_nv.py <gói> '<tên-da>' <ra> --danh <trên> --lop
```

Ba con số phải nhìn:

| Đo | Đúng | Sai nghĩa là |
|---|---|---|
| `mảnh rời` cuối lệnh nướng | `0/96` | bộ phận vẽ trượt trong ô atlas, bay khỏi người |
| hộp bao lớp `c` (chân) | `~135x114` | áo choàng vẫn vẽ vào khe thân → giày sẽ vô hình |
| tỉ lệ đầu | 3,4-3,6 đầu · đầu rộng ≥ vai | đầu nhỏ trên thân người lớn |
