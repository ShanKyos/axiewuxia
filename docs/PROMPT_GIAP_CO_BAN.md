# Prompt sinh BỘ GIÁP CƠ BẢN (dải I) — năm lớp

> Chủ dự án chốt (phiên 2026-09-11): **nhân vật mặc giáp ngay từ đầu**, và nhân vật đi theo
> hỗ trợ cho Axie. Tài liệu này là bản đặt hàng Meowa cho **năm bộ giáp dải I** — bộ mà người
> chơi nhìn thấy suốt đoạn đầu game.
>
> Dùng cho **Meowa → gói Spine**, nướng bằng `tools/spine/nuong_nv.py --lop`.
> Mọi số liệu đọc thẳng từ mã hoặc đo bằng máy, không ước lượng.

---

## 0. Hiện trạng — đo được, không phải cảm giác

Cho cả năm lớp mặc **đủ bộ giáp giai 1** rồi dựng khung đứng:

| Lớp | Art giáp giai 1 | Thấy gì trên màn |
|---|---|---|
| Dark Knight | `dkgs1` — **tấm liền** | giáp tấm đen, mũ sừng, áo choàng đỏ |
| Dark Wizard | `dwvt1` — **lớp rời** ✅ | áo vải thô dài, khăn trùm đầu |
| **Spellblade** | **không có** | thân trần: áo ba lỗ đen |
| **Sylvan Ranger** | **không có** | thân trần: áo croptop + quần đùi |
| **Dark Lord** | **không có** | thân trần: áo sơ mi đen |

Ba lớp cuối **mặc đủ đồ mà trên người không đổi một điểm ảnh nào** — tức lời hứa "trang bị
phải NHÌN THẤY được" của CLAUDE.md hỏng ở 3/5 lớp ngay từ giai đầu tiên.

Đứng cạnh nhau thì còn một chuyện nữa, và nó là lý do phải gen LẠI chứ không chỉ gen thêm:
**Dark Knight là hiệp sĩ giáp nặng full plate trong khi bốn lớp kia là dân thường mặc đồ
thường.** Năm cái bóng đó không đọc ra cùng một game.

### Vì sao `dkgs1` cũng phải gen lại, dù nó đang chạy

1. **Nó là bộ DUY NHẤT còn đi đường tấm liền.** Bốn bộ mới sẽ đi đường **lớp rời**
   (`--lop`), tức đeo mỗi đôi giày thì đúng đôi giày đổi. `dkgs1` đổi cả tấm thân một lượt,
   nên Dark Knight là lớp duy nhất không tách được bốn ô. Hai đường sống chung được, nhưng
   để nó ở **bộ khởi đầu** thì lớp đầu tiên người chơi chạm vào lại là lớp cư xử khác mọi lớp
   khác.
2. **Nó quá nặng so với đặc tả dải I.** `docs/BO_GIAP.md` ghi dải I Dark Knight là *"Thiết Vệ
   — sắt rèn thô, không hoa văn. Vai: tấm cong trơn. Mũ: chóp tròn + khe mắt ngang."*
   `dkgs1` có sừng, áo choàng, khảm — đó là dáng của dải IV/V. Đặt nó ở dải I thì **bốn dải
   sau không còn chỗ để leo**.

---

## 1. Tên tệp và ba dòng khai báo

Tên bộ = **viết tắt lớp + viết tắt tên bộ**, đúng nếp đang có (`dwvt1` = Dark Wizard · Vải Thô).

| Lớp | Tên bộ dải I | Tên tệp | Tên skin trong gói Spine |
|---|---|---|---|
| Dark Knight | Thiết Vệ | `dktv1` | `Iron Guard` |
| Dark Wizard | Vải Thô | `dwvt1` *(đã có)* | `Rough Weave` |
| Sylvan Ranger | Da Rừng | `srdr1` | `Forest Hide` |
| Spellblade | Bán Giáp | `sbbg1` | `Half Plate` |
| Dark Lord | Lệnh Giáp | `dllg1` | `Warrant Plate` |

⚠ Thân trần của Sylvan Ranger mang tiền tố `elf` (`elfar1`) — di sản, **đừng bắt chước**.
Bảng `NV_GIAP` dùng tiền tố theo lớp (`dk` · `dw` · `sr` · `sb` · `dl`).

Nướng xong, mỗi bộ ba dòng, không sửa dòng máy nào:

```bash
python3 tools/spine/nuong_nv.py <gói> '<tên skin>' <tên bộ> --danh <hoạt-cảnh-đánh> --lop
```

| Điền vào | Nội dung |
|---|---|
| `NV_LOP_HOP['<tên bộ>']` | hộp cắt của năm lớp — công cụ **in sẵn ra cuối**, dán vào |
| `NV_GIAP['<lớp>\|1']` | `'<tên bộ>'` |
| `NV_KHUNG_R['<tên bộ>']` | `32` nếu bảng có 7 hàng |

Có mặt trong `NV_LOP_HOP` thì `nvBoGiap()` tự trả `null` và bộ đi đường lớp rời — đúng như
`dwvt1` đang chạy.

---

## 2. Khối chung — dán vào ĐẦU mọi prompt

```
A single 2D game character rig for a Spine skeletal-animation package: one adult adventurer,
three-quarter front view, neutral A-pose, fully transparent background.

=== PART A · RIG CONTRACT (non-negotiable) ===

Keep the SAME skeleton and the SAME atlas layout as the reference package I am attaching:
83 bones, 13 slots, 20 animations, one 2048x2048 texture page, and the same region names and
bounds. Only the painted pixels inside each region may change. Deliver the outfit as a skin
named exactly "<SKIN NAME>".

REGISTRATION. Inside each region box the artwork must sit at the SAME anchor position as the
reference package, because the bone attaches to the region BOX, not to the drawing. A previous
delivery painted the five right-arm regions (右手_放松, 右手_握拳, 右手_张开朝内, 右手_张开朝侧前,
右手_张开朝外) 33-48 pixels too far LEFT inside their boxes, which detached the far arm from the
shoulder in every single frame. Re-check every limb region against the reference: wrist, elbow
and shoulder must land on the same pixel coordinates as before.

SAME PERSON as the reference package for this class: same face shape, same skin tone, same
hair colour, same hair length. Only the clothing and the headwear are new. This is the
character's DEFAULT look from level 1, and the undressed body still shows in the equipment
screen — a different face between the two reads as two different characters.

=== PART B · HEADWEAR (mandatory) ===

The character MUST wear a visible piece of headwear, sitting ON the head, present in all four
head attachments: 头 (neutral), 头_开心 (happy), 头_痛苦 (pained), 头_闭眼 (eyes closed). The
headwear must be pixel-identical across all four; only the facial expression changes.

It must read as a worn object in SILHOUETTE at 128x128 pixels with the body hidden, because the
game cuts the helmet inventory icon from the head parts alone. A band so thin it reads as a
hairstyle fails this requirement.

FACE STAYS FULLY OPEN. No shadow mask over the eyes, no cloth or metal across the nose or
mouth, no full-face mask, nothing covering any part of the face. Both eyes, the nose line and
the mouth must be clearly readable at 160 pixels tall. This is a technical constraint, not a
preference: the engine swaps in the pained / eyes-closed / happy face pieces during the hurt,
death, sitting and dancing animations, and a covered face makes all four invisible.

=== PART C · THE OUTFIT ===

<PER-CLASS BLOCK GOES HERE>

=== PART D · HARD REQUIREMENTS ===

1. THIS IS THE LOWEST OF FIVE RANKS. It is starting equipment: worn, plain, cheap. Four richer
   ranks of the same class come after it, so leave headroom — no spikes, no horns, no cape, no
   engraving, no gemstones, no glow at this rank. If it already looks impressive, it is wrong.
2. COMPLETE BODY UNDER THE CLOTHING. Draw a whole character first, then dress it. Hands,
   forearms, neck and feet must exist as real anatomy underneath, not as empty holes inside
   floating cloth.
3. DESATURATED, NEUTRAL BASE COLOURS — the engine re-tints this artwork per rank at runtime,
   and a piece that is already saturated cannot be re-tinted. No glow anywhere.
4. NO SEPARATE TROUSERS. The rig has no trouser slot: the leg group covers shin, knee and
   footwear as one unit. Design accordingly.
5. THE FOUR EQUIPMENT GROUPS MUST READ SEPARATELY. The game cuts this outfit into head / torso
   / arms / legs and lets the player wear them from four different sets at once. Each group
   must look finished on its own against the bare body: no strap that only makes sense when
   another group is present, no piece that bleeds across a group boundary.
6. THE CHARACTER TRAVELS BESIDE A SMALL CREATURE COMPANION rendered in a bright, soft,
   pastel-leaning cartoon style. Keep the outfit readable next to that: clean shapes, medium
   value contrast, no heavy black masses that would turn the human into a hole in the picture.
7. STYLE: clean vector-like 2D game art, crisp dark outline, flat cel shading with one soft
   ambient gradient. No photorealism, no painterly brushwork, no text, no watermark, no ground
   shadow, no background scenery. Full body, head to feet, nothing cropped.
```

---

## 3. Năm khối riêng — nối vào chỗ `<PER-CLASS BLOCK>`

### Dark Knight — `dktv1` · skin `Iron Guard`

```
SET: "Iron Guard", rank I of five for the heavy-armour class. A city watchman's issue kit:
rough-forged iron, no decoration of any kind, visibly hammered and dented from use.

Breastplate: one plain curved iron plate over a padded gambeson, three simple rivets, a leather
strap crossing to the belt. Shoulders: ONE smooth curved iron pauldron on each side, small,
plain, no ridge and no spike. Arms: iron vambraces on the forearms, plain leather gloves.
Legs: plain iron shin tubes over dark trousers, simple laced boots.
Headwear: a plain round-domed open-faced iron helm with a single horizontal brow bar; ears and
the whole face stay exposed, hair shows at the nape.
NO cape, NO horns, NO engraving, NO trim of a second metal. The armour is the same dull grey
iron everywhere.
PALETTE: #4e5158 base, #6e727a mid, #8a8f98 highlight, #3a3228 leather.
```

> Đây là bản thay `dkgs1`. `dkgs1` giữ lại được, chỉ đổi khoá sang một giai cao hơn khi có
> chỗ — nó thừa sức làm dải IV.

### Dark Wizard — `dwvt1` · skin `Rough Weave` *(đã có)*

Bộ này **đang chạy và đúng đường lớp rời** — chỉ gen lại nếu muốn đồng bộ lại khuôn mặt với
bốn bộ mới. Prompt gốc nằm ở `docs/PROMPT_GIAP_DARKWIZARD.md §6`, dùng lại nguyên văn.

### Sylvan Ranger — `srdr1` · skin `Forest Hide`

```
SET: "Forest Hide", rank I of five for the ranged scout class. A poacher's kit: soft brown
leather, hand-stitched, nothing forged.

Torso: a sleeveless brown leather jerkin laced up the front over a coarse undershirt, a narrow
quiver strap crossing the chest. Shoulders: ONE small ROUND leather pad on each side, visibly
hand-stitched around the rim with coarse thread — leather only, no metal anywhere on this rank.
Arms: long leather bracers laced along the forearm, fingerless gloves.
Legs: leather leggings with a strip of hide wrapped around each shin, soft laced boots with a
folded-down cuff.
Headwear: a soft leather cap with a small stiff brim, a feather tucked into the band at the
side. The face stays completely open; hair shows below the cap at the nape and the temples.
NO metal plates, NO leaves, NO vines, NO hood — those belong to the later ranks.
PALETTE: #5a4632 base, #7b6347 mid, #9a8262 highlight, #46504a cloth.
```

### Spellblade — `sbbg1` · skin `Half Plate`

```
SET: "Half Plate", rank I of five for the hybrid melee-caster class. Whatever the duellist could
scavenge: half a suit of armour worn over travelling clothes.

THE SIGNATURE OF THIS CLASS IS ASYMMETRY, and it must be obvious in silhouette. The LEFT
shoulder and LEFT upper arm carry one plain iron plate; the RIGHT shoulder is BARE, wearing only
a leather strap crossing diagonally over the chest to the opposite hip. Do not balance the two
sides.
Torso: a dark sleeveless tunic with a wide sash at the waist, one iron plate strapped over the
left half of the chest only.
Arms: a plain iron vambrace on the LEFT forearm; the RIGHT forearm has cloth wraps only.
Legs: a single iron thigh plate on the LEFT leg over dark trousers, plain boots on both feet.
Headwear: an open half-helm covering the LEFT side of the head only — a plain iron plate over
the temple and cheekbone on that side, the right side of the head bare. BOTH EYES, the nose and
the mouth stay fully visible and unobstructed; the half-helm sits beside the face, not over it.
NO spikes, NO ember glow, NO second plate on the right side.
PALETTE: #4a4d54 iron, #6b6f78 iron highlight, #2e2b30 cloth, #7a3b3b sash.
```

> ⚠ Bất đối xứng này **đổi bên khi lật ngang**: quay sang Tây thì tấm giáp nhảy sang vai kia.
> Xem `docs/DAT_HANG_TUONG_DI.md` — chỗ này chờ chủ dự án chốt.

### Dark Lord — `dllg1` · skin `Warrant Plate`

```
SET: "Warrant Plate", rank I of five for the commander class. Issued armour of a junior officer:
plain, regulation, not yet earned any honours.

Torso: a plain dark steel cuirass, flat and undecorated, worn over a high-collared coat. One
plain cloth sash hangs from the LEFT shoulder down across the chest to the right hip — this
sash is the mark of rank and is the one thing that must read at a distance.
Shoulders: small plain rectangular steel plates, flat, no teeth and no ridge.
Arms: steel vambraces, gauntlets with plain knuckle plates.
Legs: steel shin plates over dark trousers, plain officer's boots to mid-calf.
Headwear: a LOW ROUND CIRCLET of plain steel resting on the brow, a single small unadorned
medallion at the front. Hair is fully visible above and behind it, the face completely open.
NO crown points, NO fur, NO cape, NO second sash, NO emblem engraving — those are the later
ranks.
PALETTE: #3f434b steel, #5d626c steel highlight, #2a2c33 coat, #6d5f4a sash.
```

---

## 4. Nghiệm thu — làm trước khi nối vào game

```bash
python3 tools/spine/kiem_goi.py <gói> '<tên skin>'     # 1 giây, bắt 5 dạng lỗi gói
python3 tools/spine/nuong_nv.py <gói> '<da>' <tên> --danh <đánh> --lop
```

Công cụ in `gót y=212 (cần 212) · đỉnh đầu y=53 (cần 53)`. Hai số không khớp thì dừng.

| Kiểm | Cách |
|---|---|
| Đủ bốn khuôn mặt, không bị mũ che | mở atlas, soi bốn mảnh `头` / `头_开心` / `头_痛苦` / `头_闭眼` |
| Mũ đọc được ở 128px | `nuong_icon.py` rồi nhìn ô 0 của dải icon |
| Bốn ô tách rời đọc được riêng | `tests/test_lopdo.js` — nó so **ĐIỂM ẢNH**, không so tên bộ |
| Không lệch vùng atlas | `kiem_goi.py`, ngưỡng 23px (gói tốt ≤20, gói hỏng ≥26) |
| Mặc vào có đổi hình thật không | `/gen 1` trong game rồi chụp lại |

---

## 5. Hai chỗ cần chủ dự án chốt

### ❶ Luật "Chimera không bao giờ được lấn át nhân vật" nay ngược với thiết kế

`CLAUDE.md` đang ghi, bằng đúng chữ **"không bao giờ"**:

> `chiCoTrongMan(id)` khoá theo hộp vẽ ra, **tương đối với `NV_CAO`**: `CHI_THAN` = 0,45 và
> `CHI_TRAN` = 0,55.

Tức con Axie bị ép xuống **45% chiều cao thân người**. Nếu từ nay **nhân vật đi theo và hỗ trợ
cho Axie** thì thứ tự sân khấu đảo lại, và cái trần 0,45 chính là thứ chặn nó. Ba đường:

| | Axie so với người | Đổi gì |
|---|---|---|
| A | giữ 0,45 | Axie vẫn là thú cưng nhỏ. Không đổi gì, nhưng mâu thuẫn với lời anh vừa nói |
| B | ~0,75–0,85 | Axie ngang tầm mắt người — đọc ra "hai đồng đội" |
| C | ~1,0–1,2 | Axie là nhân vật chính, người là kẻ hộ tống |

Đây là **một hằng số**, đổi trong một phút, và `tests/test_cothu.js` quét cả 16 con nên không
sợ con nào lọt. Nhưng nó là quyết định thiết kế, không phải con số dò tay — em không tự đổi.

### ❷ "Mặc giáp từ đầu" cần một bộ đồ khởi đầu thật

Hiện `newPlayer()` khai `equip: {}` — nhân vật mới **cởi trần**. Muốn mặc giáp ngay thì phải
phát cho họ bốn món giáp giai 1 khoá lớp (`<lớp>_0_non/ao/tay/chan` đã có sẵn trong `ITEM_DB`).

Em đề nghị phát bộ **yếu nhất có thể**: giai 1, `+0`, không dòng phụ, không Vận — để nó là
chuyện TẠO HÌNH chứ không phải một cú buff sức mạnh lúc mở màn. Nhưng nó vẫn đổi bảng cân
bằng mười phút đầu, nên cần anh gật.
