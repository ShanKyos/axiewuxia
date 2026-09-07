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
