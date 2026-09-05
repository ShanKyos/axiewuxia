# Vũ khí Dark Wizard — bản mô tả cho meowa.ai

Dark Wizard (`baidasan`) có **2 dòng vũ khí × 7 giai = 14 cây**. Hiện cả 21 đang
dùng chung một tấm `tk_dwstaff.png`, nên lên giai không thấy đổi gì.

Theo QUY TẮC SỐ 3 trong CLAUDE.md: art sinh bằng meowa.ai, không vẽ vector.
Sandbox chặn egress tới meowa.ai nên phần sinh ảnh là việc của chủ dự án; tài liệu
này là bản mô tả để dán vào meowa, cộng với đường nối sẵn trong game.

---

## 1. Quy ước bắt buộc (engine dựa vào)

| Mục | Giá trị |
|---|---|
| Nền | trong suốt (PNG có alpha), không viền, không bóng đổ dưới đất |
| Bố cục | **một cây duy nhất**, không cảnh nền, không tay người cầm |
| Hướng | chéo cũng được — công cụ tự xoay về đúng trục |
| Cỡ gốc | vuông, tối thiểu 512×512 |
| Sau chuẩn hoá | dài 172px, đầu (quả cầu / tinh thể) nằm bên **phải** |
| Chỗ nắm | công cụ tự tính, ở 38% chiều dài kể từ **đuôi** |

Không cần tự canh hướng hay chỗ nắm — `tools/chuanhoavk.py` lo hết.

## 2. Ba dòng khác nhau ở HÌNH DÁNG, không ở màu

Lên giai đã đổi màu rồi (bảng màu theo giai trong game). Ba dòng phải khác nhau
ở **bóng dáng** thì người chơi mới phân biệt được từ xa:

| Dòng | Khoá | Dáng | Tỉ lệ thân : đầu |
|---|---|---|---|
| Gậy | `gay` | ngắn, thô, đầu là **khối đá/gỗ nguyên** buộc dây | 3 : 1 |
| Trượng | `quyentruong` | dài, mảnh, đầu là **vòng kim loại rỗng** ôm lấy quả cầu | 5 : 1 |

## 3. Bảy giai — vật liệu và mức "đắt tiền"

Tên trong game đã có sẵn, art phải khớp:

| Giai | Tên (Gậy / Trượng / Tinh Trượng) | Vật liệu & mô-típ |
|---|---|---|
| 1 | Gỗ | gỗ thô còn vỏ, dây gai, đá cuội xám |
| 2 | Nhân Sư | gỗ chuốt nhẵn, đai đồng, mắt đá hổ phách |
| 3 | Triệu Hồn | gỗ hun đen, xương chạm, khói tím rỉ ra |
| 4 | Thần Ma | thép tối, gân đỏ phát sáng, gai ngược |
| 5 | Quỷ Vương | hắc kim, sừng cong, lõi đỏ như than |
| 6 | Tinh Vân | bạc lạnh, mảnh đá trôi lơ lửng quanh đầu, ánh lam |
| 7 | Hư Vô | vật chất tối, viền rách như thủng không gian, ánh tím trắng |

## 4. Bản mô tả dán vào meowa.ai

Phần chung — dán trước mọi lần:

```
2D game item art, single fantasy staff weapon, side view, full object in frame,
transparent background, no ground shadow, no hands, no character, no border,
dark fantasy MMO style, painted texture, crisp silhouette, 512x512
```

Rồi nối thêm MỘT dòng dưới đây cho từng cây (21 lần):

### Dòng Gậy (`gay`) — thân ngắn thô, đầu là khối nguyên, tỉ lệ 3:1
```
g1  short stubby wooden rod, rough bark, hemp cord wrap, plain grey stone lashed to the head
g2  smooth polished wood rod, bronze bands, amber tiger-eye stone set in the head
g3  blackened charred wood rod, carved bone collar, violet smoke seeping from the stone
g4  dark steel rod, glowing red veins in the metal, backward-swept spikes at the head
g5  black-gold rod, curved demon horn at the head, ember-red core burning inside
g6  cold silver rod, small rock shards floating around the head, pale blue glow
g7  void-matter rod, torn frayed edges like a rip in space, violet-white light bleeding out
```

### Dòng Trượng (`quyentruong`) — thân dài mảnh, đầu vòng rỗng ôm quả cầu, tỉ lệ 5:1
```
t1  long slender wooden staff, open ring head of bent branches around a plain stone orb
t2  polished long staff, bronze open ring, amber orb held in the centre
t3  charred long staff, bone ring, violet smoking orb floating inside the ring
t4  dark steel long staff, red-veined ring, spiked orb suspended in the gap
t5  black-gold long staff, horned ring, ember-red orb burning in the centre
t6  cold silver long staff, ring of floating rock shards, pale blue orb
t7  void long staff, ring of torn space, violet-white orb of nothing
```


## 5. Đưa vào game

1. Lưu ảnh thô vào một thư mục bất kỳ, đặt tên đúng khoá muốn dùng:
   `dw_gay1.png` … `dw_gay7.png`, `dw_truong1..7.png`, `dw_tinh1..7.png`
2. Chuẩn hoá cả mẻ:
   ```
   python3 tools/chuanhoavk.py raw/dw_*.png --ra public/game/assets/nv
   ```
   Công cụ tự xoay về đúng trục, lật đầu về bên phải, thu về 172px, tính chỗ nắm,
   rồi in ra sẵn các dòng cần dán.
3. Dán vào bảng `VK_ANH` trong `public/game/game.js`, đổi `DONG_O_DAY` thành khoá thật:
   ```js
   'gay|1':         { tep:'dw_gay1',   x:65, y:34 },
   'quyentruong|1': { tep:'dw_truong1', x:65, y:34 },
   ```
   `vkAnh()` tra khoá `dòng|giai` TRƯỚC, không thấy mới lùi về khoá chung `dòng`.
   Nên thêm được cây nào thì cây đó tự thắng tấm chung, chưa có thì vẫn chạy như cũ
   — không phải làm đủ 21 cây mới đưa lên được.

Cùng một tấm đó dùng cho cả ba chỗ: nhân vật cầm trong màn, icon trong túi
(`veVkTranh`), và lưỡi bay của chiêu Vòng Kiếm Lửa (`thanKhiNguon`).

---

## 6. GHI CHÚ THIẾT KẾ — dòng Sức Mạnh Phép cho vũ khí DW

Chủ dự án chốt: *"Giai càng thấp thì sức mạnh phép thuật càng thấp. Nó chỉ tăng lên khi
dùng ngọc để ép lên mà thôi."*

### Hiện trạng (đo trên bản đang chạy)

| Thứ | Tình hình |
|---|---|
| `skillDmgPct` (Sát Thương Kỹ Năng) | CÓ tồn tại, đọc ở `game.js:3615` khi tính sát thương chiêu |
| Nguồn cấp nó | CHỈ có Đại Thành (`MZ.skillPct`) và Sổ Kỹ Năng — xem `game.js:6271`, `6290` |
| `WEAPON_SUBS` | **KHÔNG có dòng nào cho sát thương phép** (`game.js:602-610`) |
| Chỉ số chính của trượng | `atk` (Công Kích) — y hệt kiếm của Dark Knight |

Tức là hiện nay cây trượng của Dark Wizard và cây kiếm của Dark Knight **cộng cùng một
loại chỉ số**. Lớp phép không có trục sức mạnh riêng trên vũ khí.

### Việc cần làm

1. **Thêm dòng `skillPct` vào `WEAPON_SUBS`** — nhưng chỉ rơi trên vũ khí lớp phép
   (`sect:'baidasan'`), để trượng khác kiếm ở chỗ đáng khác.
2. **Nền theo giai**: giai 1 thấp hẳn, leo theo `GIAI_POW` như mọi chỉ số khác
   (mỗi giai ~30% — xem `GIAI_RATE`).
3. **Ép ngọc mới là đường lên chính**: giá trị nhân theo `1 + plus × PLUS_STEP` y như
   chỉ số chính (`game.js:5696`, `6093`). Trần `plus` là **11** (`game.js:6825`).
4. Ba dòng trượng nên nghiêng khác nhau, khớp `desc` đã có trong `canbang.js`:
   `gay` = sát thương phép · `quyentruong` = tốc niệm.

⚠ Đụng vào cân bằng: `sucNguoi()` neo máu quái vào công người chơi, mà `skillDmgPct`
nằm NGOÀI `player.atk`. Thêm một trục sát thương mới mà không tính vào đó thì lớp phép
sẽ vượt đường cong quái. Phải đo lại DPS 5 lớp sau khi làm.

## 7. Đã nối xong

| Dòng · giai | Tên | Tệp | Chỗ nắm |
|---|---|---|---|
| `quyentruong` · 1 | Cốt Linh Trượng · SoulBone Staff | `dw_truong1.png` 172×70 | (65, 32) |
| `quyentruong` · 2 | Thiên Linh Quyền Trượng · Celestial Spirit Scepter | `dw_truong2.png` 172×79 | (65, 39) |
| `quyentruong` · 3 | Mãng Xà Trượng · Serpent Staff | `dw_truong3.png` 172×95 | (65, 50) |
| `quyentruong` · 4 | Thiên Lôi Trượng · Thunderlord Staff | `dw_truong4.png` 172×74 | (65, 36) |
| `quyentruong` · 5 | Mỹ Xà Quyền Trượng · Gorgon Scepter | `dw_truong5.png` 172×106 | (65, 48) |
| `quyentruong` · 6 | Huyền Cổ Thần Trượng · Elder God Staff | `dw_truong6.png` 172×79 | (65, 40) |
| `quyentruong` · 7 | Cửu Thế Phục Sinh Trượng · Eternal Rebirth Staff | `dw_truong7.png` 172×66 | (65, 32) |

| `gay` · 7 | Gậy Hư Vô — cây gốc của bộ Grand Soul | `tk_dwstaff.png` 172×70 | (65, 33) |

**Dòng Trượng đã trọn 7/7 giai.** Cây trượng tím-vàng gốc (`tk_dwstaff`) nay được GHIM RÕ vào
`gay|7` thay vì chỉ rơi vào nhánh lùi — để ở giai 7 người chơi có hai cây khác hình mà chọn.

### Dòng Tinh Trượng đã dẹp

Ghim `gay|7` một mình chưa đủ: `tinhtruong|7` vẫn vẽ ra đúng tấm `tk_dwstaff` đó, nên giai 7
có BA món mà HAI món trùng hình — chỉ số khác nhau mà người chơi không có cách nào phân biệt.
Chủ dự án chốt **dẹp hẳn dòng Tinh Trượng**. Dark Wizard nay có hai dòng: Gậy và Trượng, và ở
giai 7 là hai cây khác hình để chọn.

Gỡ ở ba chỗ: khối `WEAPON_LINES` trong `canbang.js`, nhánh lùi trong `VK_ANH`, và bảng cỡ ô
túi. Kèm một bước **chuyển save**: món cũ thuộc dòng đó có `def` trỏ vào khoá ITEM_DB không
còn tồn tại ⇒ `itemDef()` trả undefined ⇒ mọi chỗ đọc `.name`/`.line`/`.art` đều ngã. Nên
ĐỔI chứ không XOÁ — chuyển sang cây Gậy CÙNG GIAI, giữ nguyên mức rèn và dòng phụ. Đo lại:
một cây Tinh Trượng Quỷ Vương +9 nạp lên thành Gậy Quỷ Vương +9, `itemDef()` trả về bình
thường. Người chơi mất cái tên, không mất món đồ.

### Vì sao KHÔNG mở giai 8

Cây Cửu Thế Phục Sinh ban đầu định làm giai 8. Đo ra thì thêm một giai không phải thêm một cây:
15 dòng vũ khí, 5 bộ giáp, 4 dòng phụ kiện đều phải có mục thứ 8, cộng `GIAI_NAMES` và
`HERO_METAL`. Nặng hơn nữa là dải cấp: `GIAI_SPAN = 16` mà cấp tối đa 120, nên giai 8 chỉ được
cấp 113-120 — 8 cấp trong khi mọi giai khác có 16. Hạ span xuống 15 thì đều, nhưng dịch mọi mốc
giai cũ, đúng cái tai nạn đã ghi trong mã: *"người chơi cấp 91-104 đăng nhập là bị CỞI MẤT đúng
bộ đồ"*. Chủ dự án chốt đưa cây này về giai 7 — vừa tránh cả đống trên, vừa làm trọn dòng Trượng.

### Cỡ nhân vật và vũ khí

Ba chỗ từng chép cứng số 104 làm chiều cao nhân vật: cỡ nhân vật (`sh`), cỡ thần khí, và cỡ lưỡi
Vòng Kiếm Lửa. Chép cứng ba lần nghĩa là phóng to nhân vật mà quên một chỗ thì vũ khí đứng
nguyên. Nay gom về `NV_CAO`, còn TỈ LỆ giữa chúng do `TK_PHONG` quyết:

* `NV_CAO` 104 → **118** (nhân vật to lên)
* `TK_PHONG` 1,35 → **1,00** (vũ khí nhỏ lại)

### Grand Soul về giai 7

Bộ giáp `dwsm1` trước đây khai ở `baidasan|1`. Grand Soul là bộ ĐỈNH của Dark Wizard trong MU
nên chủ dự án chốt đưa về **giai 7**. Kéo theo ba chỗ:

* `NV_GIAP` đổi khoá `baidasan|1` → `baidasan|7`
* thêm `giaiCoArt(sect)` — hỏi bảng xem lớp này có art ở giai nào, thay vì ghi cứng số
* `tangDoThuNghiem()` (`?test=1`) phát bộ theo `giaiCoArt()` chứ không phải giai 1 nữa;
  ghi cứng một số là một trong hai lớp sẽ vào game cởi trần, vì Dark Knight vẫn ở giai 1
* `test_giapicon` mục 6 cũng gọi `giaiCoArt('baidasan')` thay cho `/gen 1`

### Công cụ đã học thêm một việc: bỏ mảnh rời

meowa hay vẽ thêm lông vũ / tàn lửa bay lơ lửng quanh vũ khí. Ở cỡ 172px chúng chỉ còn vài
pixel nên đọc ra nhiễu, mà lại kéo rộng khung bao — cây vũ khí bị thu nhỏ trong khung và chỗ
nắm bị đẩy lệch. Thiên Linh Quyền Trượng có **8 cái lông vũ rời**, thân chỉ chiếm 95,6%.
`chuanhoavk.py` nay tự bỏ mảnh nhỏ hơn 3% tổng khối lượng, và giữ mảnh lớn (có cây cố ý cho
đá bay quanh đầu trượng). Chạy lại Cốt Linh Trượng sau khi thêm: kết quả không đổi.
