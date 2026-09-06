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

## 5. Prompt mẫu

Khung chung, thay phần in đậm cho từng chiêu:

```
2D game skill VFX sprite animation, top-down three-quarter view.
**<MÔ TẢ HIỆU ỨNG>**
IMPORTANT: visual effect ONLY — no character, no creature, no weapon,
no ground, no shadow, no background. Fully transparent background.
Soft anti-aliased alpha edges, no hard cutout.
40 frames, 30 fps, 320x320 square canvas, effect centred.
Painterly stylised game art, saturated colours, dark fantasy MMO.
```

### Poison — `sx_baidasan_a`
> a pool of toxic acid-green liquid spreading outward on the ground, bubbling and
> hissing, wisps of green vapour rising, dripping venom highlights

### Meteorite — `sx_baidasan_c`
> a burning meteor falling from above and slamming down, orange-gold fire trail,
> shockwave ring of embers bursting outward on impact, cracked glowing debris

### Soul Barrier — `dw_shield`
> a translucent pale-blue hexagonal energy shield forming around an empty space,
> facets lighting up one by one then slowly rotating, frost-like shimmer

### Evil Spirit — `dw_evilspirit` *(làm lại cho đúng)*
> six long curved spectral claws of dark violet energy sweeping outward in a full
> circle from the centre then retracting, a violet glow pool underneath,
> white-hot embers drifting up, a purple-white flash at the peak

Dải màu tím của Evil Spirit tôi đã lấy mẫu thẳng từ ảnh anh gửi lần trước, dùng lại cho khớp:
`#1f004f` → `#340665` → `#501188` → `#853ab5` → `#c67be1` → `#f0c5f4`

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
