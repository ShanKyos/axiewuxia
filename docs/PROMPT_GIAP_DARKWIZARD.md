# Prompt sinh giáp Dark Wizard — giai 1→6 (giai 7 đã có)

> Dùng cho **Meowa → gói Spine**, rồi nướng bằng `tools/spine/nuong_nv.py`.
> Mọi con số trong tài liệu này **đọc thẳng từ mã**, không phải ước lượng.

---

## 0. Đọc cái này trước — hai điều bạn dặn, và một điều bạn cần biết

### ✔ Điều 1 — "phải hiện ra mặt, giống giai 7"

**Đúng, và nó không chỉ là chuyện đẹp xấu — che mặt là hỏng bốn hoạt cảnh.**

Đường nướng đổi **mảnh khuôn mặt** ở khe `头` theo từng khối hoạt ảnh
(`tools/spine/nuong_nv.py`, bảng `KHUNG2`):

| Khối | Đổi mảnh | Thấy khi nào |
|---|---|---|
| `03_Hurt` | `头` → `头_痛苦` | trúng đòn — **mặt đau** |
| `02_Death` | `头` → `头_闭眼` | chết — **nhắm mắt** |
| `00_Squat` | `头` → `头_闭眼` | ngồi ở Suối Ký Ức |
| `01_Dance` | `头` → `头_开心` | màn chọn lớp — **mặt vui** |

Mũ trùm mà kéo kín mặt thì cả bốn lần đổi mảnh đó **vẽ ra rồi bị che**, và game mất sạch biểu
cảm — vẫn tốn đủ khung, chỉ là không ai thấy. Nên trong prompt, câu về khuôn mặt là **ràng buộc
kỹ thuật**, không phải sở thích.

### ⚠ Điều 2 — "bỏ một món thì hiện lại nhân vật gốc": ĐANG ĐÚNG, NHƯNG SẼ ĐỔI KHI ART VỀ

Tôi phải nói thẳng chỗ này vì nó sẽ làm bạn ngạc nhiên sau khi Meowa giao hàng.

Hiện `nvBoGiap()` chọn diện mạo theo **bậc hiệu dụng** `gv.t = (bậc trung bình) × (số ô đang
mặc / 5)`, rồi tra `NV_GIAP[lớp + '|' + làm_tròn(t)]`. Bảng đó **hiện chỉ có hai dòng**:

```js
const NV_GIAP = { 'baidasan|7': 'dwsm1', 'thieulam|1': 'dkgs1' };
```

Nên hôm nay, mặc đủ 5 món giai 7 rồi **bỏ một món** → `t = 7 × 4/5 = 5,6` → làm tròn **6** →
`baidasan|6` **không tồn tại** → trả `null` → về **nhân vật gốc**. Đúng như bạn mô tả.

**Nhưng đó là do THIẾU ART, không phải do luật.** Khi giai 1–6 có art rồi, bỏ một món sẽ ra bộ
**giai 6**, không về nhân vật gốc nữa. Ba đường đi, bạn chọn:

| Cách | Luật | Đổi cái gì |
|---|---|---|
| **A** (mặc định nếu không làm gì) | như hiện tại | bỏ 1 món → tụt xuống bộ giai thấp hơn. Đây là hành vi MU cổ điển |
| **B** | đòi **đủ 5 ô** mới hiện bộ | bỏ 1 món → về nhân vật gốc ngay. Đúng nguyên văn lời bạn, nhưng thành ra cả game chỉ thấy giáp khi đủ bộ |
| **C** | đủ 5 ô → bộ đúng giai; thiếu ô → **tụt một giai**, thiếu ≥2 ô → nhân vật gốc | dung hoà; tốn đúng một dòng `if` |

Tôi nghiêng về **C**. Nhưng đây là quyết định thiết kế của bạn, và **art sinh ra giống nhau ở cả
ba cách** — nên cứ gen trước, chọn sau, không kẹt gì.

**Cái art PHẢI có, ở cả ba cách:** một **thân nhân vật hoàn chỉnh bên dưới lớp giáp**. Không được
vẽ kiểu "áo choàng rỗng ruột" — hở tay hở chân là lộ khoảng trống.

### 📐 Điều 3 — ràng buộc đã có sẵn, đừng phá

**Tranh phải TRUNG TÍNH màu.** `hSetMetal()` tô lại giáp theo giai bằng `globalCompositeOperation`.
Giáp xám/nâu nhận màu tốt; giáp đã rực sẵn thì tô kiểu gì cũng ra màu cũ. Đây là ràng buộc
"không sửa được về sau" đã ghi trong `docs/KE_HOACH_ART_SPINE.md §2.4`.

**Không có khe quần riêng.** `NV_ICON_O = { non:0, ao:1, tay:2, chan:3 }` — bản mẫu Spine không có
slot quần; áo choàng phủ xuống chân và nhóm `chan` gồm cả ống quần lẫn giày. Ô Quần chỉ tính chỉ
số, không có tạo hình. **Đừng thiết kế quần riêng.**

**Hợp đồng toạ độ khi nướng** (sai một dòng là nhân vật lệch):
ô `240×300` · bảng 16 cột · gốc bộ xương `(80,212)` nằm đúng `(120,252)` trong ô · cao thân
`159px` từ đỉnh đầu tới gót.

---

## 1. Thang bảy giai của Dark Wizard

Bảy giai trong game: `Tân Binh · Kỳ Binh · Chinh Phục · Hung Thần · Bất Tử · Vô Song · Khai Thiên`
(`GIAI_NAMES`, `GIAI_MAX = 7`).

Đường đi lấy từ `docs/BO_GIAP.md §4` mà bạn đã chốt — **vải thô → da thú → nhân sư → ma thuật →
hư vô** — giãn ra cho đủ bảy bậc, và **giai 7 giữ nguyên bộ tím/hồng đang có**:

| Giai | Tên bộ | Chất liệu | Vai | Trạng thái |
|---:|---|---|---|---|
| 1 | **Vải Thô** | vải bố thô, dây gai | không có vai | cần gen |
| 2 | **Da Thú** | da + lông + **xương** | cụm lông thú | cần gen |
| 3 | **Nhân Sư** | vải lanh + nẹp đồng kiểu Ai Cập | hai vạt vải cứng | cần gen |
| 4 | **Ma Thuật** | vải thêu rune | 2 mảnh phép lơ lửng | cần gen |
| 5 | **Hư Vô** | vải tan thành khói ở gấu | 4–5 mảnh phép quay | cần gen |
| 6 | **Tinh Vực** | pha lê mọc xuyên vải | 6 mảnh pha lê xếp vòng | cần gen |
| 7 | *(đã có — `dwsm1`)* | tím/hồng, vương miện gai, viền vàng | — | **giữ nguyên** |

⚠ Giai 6 (**Tinh Vực**) là bậc tôi thêm để lấp khoảng giữa "Hư Vô" và bộ tím giai 7 — `BO_GIAP.md`
viết cho thang 5 dải đời trước, còn game nay là 7 giai. Nếu bạn muốn tên khác thì đổi, phần mô tả
vẽ vẫn dùng được.

---

## 2. Khối chung — dán vào ĐẦU mọi prompt

```
A single 2D game character rig for a Spine skeletal-animation package: a slender adult
spellcaster in a floor-length robe, seen in three-quarter front view, standing in a neutral
A-pose on a fully transparent background.

HARD REQUIREMENTS — these override any style preference:

1. FACE FULLY VISIBLE. The head is a separate rig part. The hood, crown or headpiece must
   FRAME the face, never cover it — no shadow mask over the eyes, no cloth across the nose or
   mouth, no full-face mask. Both eyes, the nose line and the mouth must be clearly readable
   at 160 pixels tall. The rig needs four interchangeable face pieces on the same head slot:
   neutral, pained, eyes-closed, and happy — so the face area must stay unobstructed.

2. COMPLETE BODY UNDER THE CLOTHING. Draw a whole character first, then dress it. Hands,
   forearms, neck and feet must exist as real anatomy underneath, not as empty holes inside
   floating cloth. Nothing may read as a hollow costume.

3. DESATURATED, NEUTRAL BASE COLOURS. The engine re-tints this artwork per rank at runtime,
   so the source must stay muted: greys, taupes, bone whites, dull browns. Do NOT deliver a
   fully saturated colour scheme. Accent colours are allowed only on small trim details, and
   must stay under roughly 15% of the visible surface.

4. NO SEPARATE TROUSERS. The robe falls to the ankles; legwear and footwear read as one unit.

5. NO METAL PAULDRONS, EVER. This is a cloth caster, not a knight. Shoulders may carry cloth,
   fur, crystal or floating shards — never plate armour.

STYLE: clean vector-like 2D game art, crisp dark outline, flat cel shading with one soft
ambient gradient, no photorealism, no painterly brushwork, no text, no watermark, no ground
shadow, no background scenery. Full body, head to feet, nothing cropped.
```

---

## 3. Sáu prompt — dán khối chung ở trên, rồi nối một khối dưới đây

### Giai 1 — Vải Thô

```
SET: "Rough Weave", the lowest rank. A wandering apprentice with nothing but donated cloth.
Coarse undyed sackcloth robe, visibly woven texture, frayed hem, patched at one elbow.
A soft hood pushed BACK off the head so the whole face is clear, resting in folds on the
shoulders. Rope belt of twisted hemp. Bare forearms with simple cloth wraps at the wrists.
Plain cloth foot-wraps, no shoes. NO shoulder pieces of any kind.
PALETTE: #4a4038 base, #6b5c4c mid, #8a7a5c trim. No glow anywhere.
```

### Giai 2 — Da Thú

```
SET: "Beasthide". The caster has started killing to survive and wears the results.
Same cloth robe underneath, now layered with a hide cloak, a fur collar around the neck, and
a diagonal leather strap across the chest. Small carved BONES hang from the strap and from
the belt — finger bones, a small vertebra, a tooth — swaying free. Shoulders carry TUFTS OF
FUR, not armour. Leather wrist bracers. Hide boots with fur trim.
Hood down, face fully visible.
PALETTE: #3e3228 base, #6a5340 mid, #b09068 trim. No glow anywhere.
```

### Giai 3 — Nhân Sư

```
SET: "Sphinx". Scavenged from a buried tomb that does not belong to this world.
Pale linen robe with vertical pleats, bound with bronze fittings in an ancient-Egyptian
manner. The headpiece is a NEMES-style cloth crown: two stiff striped panels falling beside
the cheeks, leaving the face completely open between them. A wide multi-ring collar
(usekh style) sits flat on the chest. Shoulders are two stiff folded cloth panels — cloth,
NOT metal plate. Bronze cuffs at the wrists and ankles. Sandals with linen wraps.
PALETTE: #5a4a2c base, #c8b070 linen, #3ac8c0 accent stones, faint #7ee0d8 glow on the
stones only.
```

### Giai 4 — Ma Thuật

```
SET: "Arcane". The wearer has stopped scavenging and started writing.
Layered robe with embroidered runic script running along every hem and cuff, the stitching
faintly self-lit. A tall brimmed pointed hood, worn UP but cut high and open at the front so
the entire face stays clear and lit. TWO small diamond-shaped arcane shards float free beside
the shoulders, unattached to the body. Long open sleeves. Soft boots.
PALETTE: #2a1f4a base, #5a3f9a mid, #c0a0ff trim, #a88aff glow confined to the runes and the
two floating shards.
```

### Giai 5 — Hư Vô

```
SET: "The Hollow". The robe is losing its argument with the space around it.
Floor-length robe whose HEM DISSOLVES into drifting smoke — the bottom edge is not a line but
a fade, with a few torn ribbons trailing upward. A thin ring halo hovers behind the head,
edge-on, not touching it. FOUR OR FIVE angular shards orbit the shoulders in a loose ring,
completely replacing any shoulder garment. Hands and face remain solid and clearly drawn —
only the lower robe dissolves. Feet barely visible inside the smoke.
PALETTE: #160f2c base, #3a2a6a mid, #7ecbff trim, #6ff0ff glow on the halo and shards only.
```

### Giai 6 — Tinh Vực

```
SET: "Crystalline". The dissolving stopped, and something grew back through the gap.
The robe is intact again but CRYSTAL GROWTHS have pushed out through the fabric — angular
shards emerging from the forearms, along the spine, and across the chest, as if the cloth had
been used as soil. SIX crystal fragments hang in a slow ring around the shoulders, larger and
more geometric than the previous rank. A fractured circlet of raw crystal sits on the brow —
open at the front, face entirely visible and lit from below by the chest crystals.
Robe hem sharp and whole. Boots plated with thin crystal.
PALETTE: #1a2038 base, #46527e mid, #9ed4ff crystal, restrained #8fd0ff glow on crystal edges.
```

---

## 4. Nghiệm thu — kiểm trước khi nướng

Mỗi gói về, soi đúng sáu điều này. Sai điều 1 hoặc 2 thì **gen lại**, đừng cố vá.

| # | Kiểm | Đạt khi |
|---|---|---|
| 1 | Mặt | thấy rõ hai mắt · sống mũi · miệng, không bóng đè, không vải che |
| 2 | Khe `头` | có đủ **bốn** mảnh mặt (thường · đau · nhắm mắt · vui) |
| 3 | Thân dưới lớp áo | tay · cẳng tay · cổ · bàn chân đều có thật, không rỗng |
| 4 | Độ bão hoà | phần lớn bề mặt là màu xỉn; màu rực ≤ ~15% diện tích |
| 5 | Vai | không có tấm giáp kim loại nào ở cả sáu bộ |
| 6 | Bộ xương | 83 xương · 13 slot · 20 hoạt ảnh, băm khớp gói cũ |

Điều 6 quan trọng hơn vẻ ngoài: cả đường nướng tựa vào việc bộ xương **giống hệt từng byte** giữa
các lần sinh (`docs/KE_HOACH_ART_SPINE.md`). Lệch bộ xương thì `nuong_nv.py` ra khung lệch chỗ.

**Nướng:**
```
python3 tools/spine/nuong_nv.py <thư-mục-gói> '<tên da>' dw_g<N>
```
rồi thêm vào `NV_GIAP`: `'baidasan|<N>': 'dw_g<N>'`. **Không phải sửa gì khác** — `giaiCoArt()`
tự dò bảng, không chỗ nào ghi cứng số giai.

---

## 5. Chỗ tôi chưa chắc

1. **Tên "Tinh Vực" cho giai 6 là tôi đặt** — `BO_GIAP.md` viết cho thang 5 dải đời trước, thiếu
   một bậc so với 7 giai hiện tại.
2. **Tôi chưa gen thử prompt nào** — hộp cát này không ra được meowa.ai. Sáu prompt trên là suy
   từ đặc tả và từ chính tấm giai 7 đang có, chưa qua một vòng thử nào.
3. **Điều 2 ở §0 cần bạn chọn A/B/C** trước khi art về, vì nó đổi cảm giác mặc đồ của cả game.

---

## 6. Bản v2 của giai 1 (Vải Thô) — gen LẠI, sau khi nướng thử gói ngày 07/09

Gói `Rough Weave` bản 2 đã sửa được **ống tay áo** (bản 1 tay trần), nhưng nướng thử ở đúng cỡ
trong game thì lộ hai chuyện, cả hai đều phải gen lại chứ không vá tay được:

### ❶ Năm vùng tay phải bị vẽ LỆCH trong khung region

`.json` và `.atlas` của bản 2 **giống bản 1 từng byte** — chỉ `.png` được vẽ lại. Nhưng nét vẽ
trong năm ô `右手_*` bị đẩy sang trái, trong khi `左手_*` thì không. Kết quả: **cánh tay xa rời
hẳn khỏi vai** ở mọi khung hình.

Đo bằng trọng tâm bàn tay (18% dưới cùng của mảnh), so bản 1 với bản 2, cùng một khung region:

| Region (bounds) | Bàn tay dịch |
|---|---:|
| `右手_放松` (1623,779,259,374) | **−45 px** |
| `右手_张开朝内` (834,1473,259,374) | **−48 px** |
| `右手_张开朝侧前` (834,1095,259,374) | **−43 px** |
| `右手_张开朝外` (1097,779,259,374) | **−41 px** |
| `右手_握拳` (1360,779,259,374) | **−33 px** |
| `左手_放松` (1360,1157,259,374) | +6 px *(bình thường)* |
| `左手_握拳` (1097,1535,259,374) | +9 px *(bình thường)* |

Dời năm vùng đó sang phải 33–48 px thì tay dính lại vai — đã dựng thử để xác nhận đúng nguyên
nhân, **không đưa vào repo** vì dịch pixel bằng máy thì viền vẽ vẫn sai một chút.

### ❷ Đầu vẫn KHÔNG CÓ MŨ

Bản 2 chỉ đổi **kiểu tóc** (dựng đứng, sẫm hơn). Ô `non` trong túi đồ vì thế vẫn là **đầu trần** —
`nuong_icon.py` cắt icon nón từ đúng hai khe `头` + `背后头发`, không có mũ thì không có icon.

⚠ Đây là **lỗi của prompt bản 1, không phải của Meowa.** Bản 1 tôi viết *"a soft hood pushed BACK
off the head... resting in folds on the shoulders"* để giữ mặt sáng — và bộ gen giải bài toán đó
bằng cách **bỏ luôn mũ trùm**. Bản v2 dưới đây bắt buộc phải có một khối HEADWEAR nói rõ: mũ nằm
**TRÊN đầu**, ôm quanh mặt, và phải vẽ **y hệt lên cả bốn mảnh mặt**.

### Prompt v2 — dán nguyên khối

```
A single 2D game character rig for a Spine skeletal-animation package: a slender adult
spellcaster in a floor-length robe, three-quarter front view, neutral A-pose, fully
transparent background.

=== PART A · RIG CONTRACT (identical to the previous delivery) ===

Keep the SAME skeleton and the SAME atlas layout as the package I am attaching:
83 bones, 13 slots, 20 animations, one 2048x2048 texture page, and the same region names
and bounds. Only the painted pixels inside each region may change. Deliver the outfit as a
skin named exactly "Rough Weave".

REGISTRATION — this is the part the last delivery got wrong. Inside each region box, the
artwork must sit at the SAME anchor position as the reference package, because the bone
attaches to the region box, not to the drawing. In the last delivery the five right-arm
regions (右手_放松, 右手_握拳, 右手_张开朝内, 右手_张开朝侧前, 右手_张开朝外) were painted
33-48 pixels too far LEFT inside their boxes, which detached the far arm from the shoulder
in every frame. The left-arm regions were correct. Re-check every limb region against the
reference: wrist, elbow and shoulder must land on the same pixel coordinates as before.

=== PART B · HEADWEAR (mandatory — the last delivery omitted this entirely) ===

The character MUST wear a visible piece of headwear, sitting ON the head, in every one of the
four head attachments: 头 (neutral), 头_开心 (happy), 头_痛苦 (pained), 头_闭眼 (eyes closed).
The headwear must be pixel-identical across all four; only the facial expression changes.

Design for this rank: a strip of the same coarse sackcloth WRAPPED around the crown and
knotted at the back of the head — a poor traveller's head-wrap. A second frayed strip crosses
over the top. Hair escapes from under it at the temples and the nape. Optionally a small
loose cowl of the same cloth folded around the base of the neck, sitting on the shoulders.

The head-wrap must be obvious in SILHOUETTE from three-quarter front: it has to read as a
worn object at 128x128 pixels with the body hidden, because the game cuts the helmet
inventory icon from the head parts alone. A headband so thin it reads as a hairstyle fails
this requirement.

FACE STAYS FULLY OPEN. The wrap sits above the eyebrows and behind the cheekbones. No shadow
mask over the eyes, no cloth across the nose or mouth, no full-face mask, nothing covering
any part of the face. Both eyes, the nose line and the mouth must be clearly readable at
160 pixels tall. This is a technical constraint, not a preference: the engine swaps in the
pained / eyes-closed / happy face pieces during hurt, death, sitting and dancing animations,
and a covered face makes all four invisible.

=== PART C · THE OUTFIT (keep what the last delivery got right) ===

SET: "Rough Weave", the lowest rank. A wandering apprentice with nothing but donated cloth.
Coarse undyed sackcloth robe to the ankles, visibly woven texture, ragged saw-tooth hem,
one square patch stitched on the skirt. Twisted hemp rope belt with a long hanging tail.
SHORT SLEEVES of the same sackcloth, frayed at the cuff, ending above the elbow so the bare
forearm shows; cloth wraps at both wrists. Cloth foot-wraps spiralling up the shin into
simple soft shoes, no hard boots.
NO shoulder pieces of any kind. NO metal anywhere. NO separate trousers — the robe and the
leg wraps read as one unit.

=== PART D · HARD REQUIREMENTS ===

1. COMPLETE BODY UNDER THE CLOTHING. Draw a whole character first, then dress it. Hands,
   forearms, neck and feet must exist as real anatomy underneath, not as empty holes inside
   floating cloth.
2. DESATURATED, NEUTRAL BASE COLOURS — the engine re-tints this artwork per rank at runtime.
   PALETTE: #4a4038 base, #6b5c4c mid, #8a7a5c trim. No glow anywhere, no saturated colour.
3. SAME PERSON as the reference package: same face shape, same skin tone, same hair colour
   and length. Only the clothing and the head-wrap are new. This character appears beside six
   other ranks of the same person; a different face per rank reads as a different character.
4. STYLE: clean vector-like 2D game art, crisp dark outline, flat cel shading with one soft
   ambient gradient. No photorealism, no painterly brushwork, no text, no watermark, no
   ground shadow, no background scenery. Full body, head to feet, nothing cropped.
```

### Kiểm khi nhận hàng — ba việc, làm trước khi wire vào game

```bash
# 1. skeleton còn nguyên chưa (phải ra 83 · 13 · 20, và có skin "Rough Weave")
python3 -c "
import json,glob;d=json.load(open(glob.glob('<gói>/*.json')[0],encoding='utf-8'))
print(len(d['bones']),len(d['slots']),len(d['animations']),[s['name'] for s in d['skins']])"

# 2. tay phải đã về đúng chỗ chưa — nướng rồi nhìn khung 0/16/80
python3 tools/spine/nuong_nv.py <gói> 'Rough Weave' _thu --danh 05_MagicAttack

# 3. icon ô nón đã ra HÌNH MŨ chưa, hay vẫn là đầu trần
python3 tools/spine/nuong_icon.py <gói> 'Rough Weave' _thu
```
