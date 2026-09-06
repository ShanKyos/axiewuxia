# Hướng dẫn tạo art hiệu ứng chiêu bằng Meowa

Dành cho chủ dự án. Mục đích: gói art gửi về **dán thẳng vào game được**, không phải vẽ lại
bằng mã như đợt Evil Spirit.

---

## 1. Bốn chiêu của Dark Wizard

Dark Wizard có đúng **bốn ô chiêu**, không phải năm sáu. `dw_lightning` / `dw_ice` /
`dw_twister` / `dw_inferno` nghe như chiêu nhưng chúng nằm trong `LEGACY_SECT_SKILLS` — bị động
cộng %Công Kích, không bấm được, nên **không cần art**.

| ô | id hiệu ứng | tên | kiểu | tầm sát thương | màu chủ đạo |
|---|---|---|---|---|---|
| 1 | `sx_baidasan_a` | **Poison** | đạn bay + vũng độc | theo đạn | `#b8ff9a` xanh nõn |
| 2 | `sx_baidasan_c` | **Meteorite** (Trấn Phái) | thiên thạch giáng | **r = 185** | `#ffcf7a` cam lửa |
| 3 | `dw_shield` | **Soul Barrier** | khiên quanh người | bám thân, 6 giây | `#cfe8ff` xanh băng |
| 4 | `dw_evilspirit` | **Evil Spirit** (tuyệt chiêu) | quét vòng quanh thân | **r = 150** | `#853ab5` tím |

Làm xong bốn cái này là **trọn một lớp**. Bốn lớp còn lại cùng khuôn: mỗi lớp bốn ô.

---

## 2. Ba luật cứng — sai một cái là gói không dùng được

### ① KHÔNG có nhân vật trong khung

Đây là chỗ làm gói Evil Spirit hỏng. Game **đã tự vẽ Dark Wizard** bằng bảng khung Spine rồi;
dán một tấm có sẵn ông pháp sư vào là hai ông chồng lên nhau, khác kiểu vẽ, khác cỡ, khác cả
hướng nhìn.

Trong prompt phải nói rõ: **hiệu ứng đứng một mình, không người, không quái, không vũ khí,
không mặt đất, không bóng đổ.** Chỉ có lửa/băng/khói/tia sáng.

### ② Nền trong suốt hoàn toàn

Không nền đen, không nền checkerboard, không nền màu. Nếu Meowa chỉ xuất được nền đặc thì báo
tôi — tách nền tự động được nhưng khói mỏng sẽ mất một phần.

### ③ Alpha mềm

Gói trước alpha chỉ có hai giá trị 0 và 255 — không có nửa trong suốt. Khói và lửa mà như thế
thì viền răng cưa và thủng lỗ xuyên qua chính tấm tranh. Nếu Meowa có tuỳ chọn *soft alpha* /
*anti-aliased* / *8-bit alpha* thì bật. Không có thì vẫn gửi, tôi làm mềm được phần nào —
nhưng dữ liệu đã mất thì không lấy lại được.

---

## 3. Thông số kỹ thuật

| | giá trị | vì sao |
|---|---|---|
| số khung | **30–50** | 1–1,6 giây ở 30 hình/giây. Gói trước 144 khung = 6 giây, dài gấp bốn một chiêu |
| cỡ ô | **256×256** hoặc **320×320**, vuông | game vẽ hiệu ứng ở 200–400px |
| tốc độ | 30 hình/giây | khớp `fps` trong `VFX_ATLAS_DEFS` |
| định dạng | sprite sheet PNG, hoặc dãy PNG rời | dãy PNG rời **an toàn hơn** — không có lưới thì không khai sai lưới được |
| lưới | đều tăm tắp, không chừa lề | nếu xuất sheet |

**Nếu Meowa cho chọn "PNG sequence" thì chọn nó thay vì sheet Godot.** Gói trước hỏng một phần
vì `.tres` khai mỗi khung 640px trong khi thật ra mỗi ô 640 chứa 3×3 khung 213px — lỗi của bộ
xuất Godot, và dãy PNG rời thì không có lỗi đó.

---

## 4. Tầm với của hình phải khớp tầm sát thương

Bài học từ Evil Spirit: vẽ rộng hơn tầm đánh là **hứa suông** — người chơi thấy vuốt u linh
trùm qua con quái mà nó không mất máu.

Cứ lấy **chiều cao nhân vật ≈ 118px** làm thước:

- **Evil Spirit** r = 150 → hiệu ứng vươn xa nhất **1,3 lần chiều cao nhân vật**
- **Meteorite** r = 185 → **1,6 lần**
- **Soul Barrier** bám sát thân, không vươn ra
- **Poison** đi theo đạn bay, vũng độc loang ở chỗ đạn rơi

Trong prompt cứ mô tả theo tỉ lệ: *"the effect reaches about 1.5× the height of a character
standing at the centre"*.

---

## 5. Bốn prompt — copy dán thẳng vào Meowa

Thước chung: **nhân vật cao 118px**. Mọi mô tả cỡ dưới đây quy theo thước đó.

### ① Cột Lửa — neo ở chỗ trúng đòn

Ô đứng, vì cột lửa cao và hẹp. Chân cột ở giữa ngang, gần đáy khung.

```
2D game skill VFX sprite animation, top-down three-quarter view.
A towering pillar of fire erupting straight up out of the ground: the ground
cracks and glows first, then a dense column of orange-gold flame bursts upward,
roaring and twisting, with embers and sparks spiralling around it, and a ring of
scorched heat haze spreading at its base. The pillar rises fast, holds, then
collapses back down into drifting smoke and dying embers.
The pillar stands about 2.5 times the height of a human character; its base is
centred horizontally near the bottom of the frame.
IMPORTANT: visual effect ONLY - no character, no creature, no weapon, no ground
texture, no shadow, no background. Fully transparent background.
Soft anti-aliased alpha edges, no hard cutout.
40 frames, 30 fps, 320x448 canvas.
Painterly stylised game art, saturated colours, dark fantasy MMO.
```

### ② Mưa Sao Băng — neo ở chỗ trúng đòn

Ô nằm ngang, vì nó rải ra một vùng rộng. Tầm sát thương thật là **r = 185**, tức đường kính
370px ≈ **3,1 lần chiều cao nhân vật** — vẽ rộng hơn là hứa suông.

```
2D game skill VFX sprite animation, top-down three-quarter view.
A meteor shower slamming down into a wide area: five or six burning rocks streak
in steeply from the upper part of the frame trailing orange-gold fire, each one
bursting on impact into a flash, a shockwave ring of embers and a puff of dust,
the impacts staggered a few frames apart across the width of the frame. Cracked
glowing debris is left smouldering, then fades.
The impact zone spans about 3 times the height of a human character, centred
horizontally in the lower half of the frame.
IMPORTANT: visual effect ONLY - no character, no creature, no weapon, no ground
texture, no shadow, no background. Fully transparent background.
Soft anti-aliased alpha edges, no hard cutout.
45 frames, 30 fps, 512x384 canvas.
Painterly stylised game art, saturated colours, dark fantasy MMO.
```

### ③ Mưa Độc Tố — neo ở chỗ trúng đòn

```
2D game skill VFX sprite animation, top-down three-quarter view.
A rain of acid-green venom falling into a small area: thin toxic droplets streak
down from the top of the frame, splashing as they land, and a bubbling pool of
glowing acid-green liquid spreads outward on the ground beneath, hissing, with
wisps of green vapour curling upward and small bubbles popping on the surface.
The pool keeps seething, then thins out and evaporates.
The pool spreads to about 1.5 times the height of a human character, centred
horizontally in the lower half of the frame.
IMPORTANT: visual effect ONLY - no character, no creature, no weapon, no ground
texture, no shadow, no background. Fully transparent background.
Soft anti-aliased alpha edges, no hard cutout.
40 frames, 30 fps, 384x384 canvas.
Painterly stylised game art, saturated colours, dark fantasy MMO.
```

### ④ Lightning Ball — đòn đánh thường, KHÁC BA CÁI TRÊN

Đây không phải hiệu ứng nổ một lần tại chỗ — nó là **viên đạn BAY** từ tay pháp sư tới con
quái (tầm bắn 420px), nên cần **hoạt ảnh lặp liền mạch**: khung cuối phải nối được vào khung
đầu, không giật. Ô nhỏ vì viên đạn chỉ chừng 40px trên màn.

```
2D game skill VFX sprite animation, seamless perfect loop.
A crackling sphere of electric energy hovering in place: a bright white-hot core
wrapped in arcs of pale yellow-green lightning that writhe and snap around it,
with a faint electric aura and a few sparks flicking outward. The motion loops
perfectly - the last frame flows into the first with no jump.
The sphere fills most of the frame.
IMPORTANT: visual effect ONLY - no character, no creature, no weapon, no hand,
no ground, no shadow, no background. Fully transparent background.
Soft anti-aliased alpha edges, no hard cutout.
20 frames, 30 fps, 128x128 canvas.
Painterly stylised game art, saturated colours, dark fantasy MMO.
```

**Kèm một gói thứ hai cho lúc viên đạn CHẠM** (không bắt buộc, nhưng có thì đẹp hơn nhiều —
không có thì đạn biến mất đột ngột):

```
2D game skill VFX sprite animation, top-down three-quarter view.
A small electric impact burst: a sphere of lightning shattering on contact into a
white flash, a quick ring of pale yellow-green electric arcs snapping outward,
and a handful of sparks scattering and fading.
IMPORTANT: visual effect ONLY - no character, no creature, no ground, no shadow,
no background. Fully transparent background.
Soft anti-aliased alpha edges, no hard cutout.
18 frames, 30 fps, 192x192 canvas.
Painterly stylised game art, saturated colours, dark fantasy MMO.
```

### Dải màu cho khớp game

| chiêu | dải màu |
|---|---|
| Cột Lửa | `#3a1200` → `#8a2a00` → `#ff7a3a` → `#ffcf7a` → `#fff0be` |
| Mưa Sao Băng | `#2a0f00` → `#a03a00` → `#ff9a3a` → `#ffcf7a` → `#fffbe8` |
| Mưa Độc Tố | `#0d2a08` → `#2f6b1a` → `#7ec850` → `#b8ff9a` → `#e8ffd8` |
| Lightning Ball | `#1a2a00` → `#6a8a10` → `#d8e84a` → `#eaffb0` → `#ffffff` |

---

## 6. Gửi về rồi thì sao

Anh gửi **thư mục gói y nguyên Meowa xuất ra** — không phải sửa gì. Kèm một dòng:

> *"chiêu này neo ở chân người tung"* hoặc *"neo ở chỗ con quái trúng đòn"*

Tôi lo phần còn lại: dò lưới thật, cắt khung rỗng ở đuôi, thu về đúng cỡ, đóng gói vào
`assets/vfx/<id>/atlas.png`, thêm dòng khai vào `VFX_ATLAS_DEFS`, nối vào đúng ô chiêu, chụp
ảnh in-game gửi lại anh duyệt. `tools/vfx_nhap.py` đã làm y hệt cho 8 clip đang chạy.

---

## 7. Ngân sách bộ nhớ

Theo đúng thông số mục 3 (40 khung, ô 320px, thu một nửa lúc nhập):

> 40 × 160² × 4 byte = **4 MB/chiêu** khi giải nén.

Game giữ nhiều nhất `VFX_ATLAS_TOI_DA = 4` tấm cùng lúc, nên **số lượng chiêu không còn quan
trọng**: 4 chiêu hay 20 chiêu thì đỉnh vẫn đứng yên. `test_bonho` gác hai mốc — mỗi tấm dưới
22 MB, và bốn tấm nặng nhất cộng lại dưới 70 MB.

Nếu giữ nguyên khổ như gói Evil Spirit cũ (144 khung, ô 213px) thì **26 MB một chiêu** — vượt
trần một tấm ngay từ chiêu đầu tiên. Đó là lý do mục 3 tồn tại.
