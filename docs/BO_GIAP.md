# Bộ giáp 5 lớp — đặc tả trước khi vẽ

> Lấy mẫu **Hỏa Long** (Dark Knight bậc 9-10) làm gốc, dựng ngược ra toàn bộ thang đồ.
> Đọc kèm `CLAUDE.md` mục "Trang bị phải NHÌN THẤY ĐƯỢC" và "Bộ giáp RIÊNG từng lớp".

---

## 1. Hiện trạng — ba vấn đề phải sửa

Đọc từ `public/game/game.js`:

```js
const ITEM_NAMES = {
  vukhi:['Mộc Kiếm','Thanh Phong Kiếm','Liệt Dương Đao','Huyền Thiết Trọng Kiếm','Du Long Thần Kiếm'],
  non:  ['Bố Mạo','Thiết Diện','Ngân Quan','Hổ Đầu Khôi','Thiên Tôn Miện'],
  ao:   ['Bố Y','Tinh Giáp','Lân Giáp','Kim Lân Giáp','Chí Tôn Long Giáp'],
  tay:  ['Bố Uyển','Thiết Uyển','Ngân Uyển','Kim Uyển','Long Uyển'],
  quan: ['Ma Khố','Cẩm Khố','Ngọc Khố','Lân Khố','Thần Khố'],
  chan: ['Thảo Hài','Vân Hài','Truy Phong Hài','Lăng Ba Hài','Phi Thiên Hài'],
};
```

**Vấn đề 1 — đánh theo ĐỘ HIẾM chứ không theo BẬC.** Mảng có 5 phần tử, index là
`it.rarity` (0-4). Nhưng bậc đồ là `itemTier(level)` = 1-10. Hệ quả: người chơi cấp 100
mặc đồ **giai 10 độ hiếm Phàm** thì tên vẫn là **"Bố Y"** — y hệt cái áo nhặt ở cấp 1.
Toàn bộ hành trình 10 bậc không hề đổi tên món đồ.

**Vấn đề 2 — dùng chung cho cả 5 lớp.** Dark Wizard nhặt được đúng cái "Liệt Dương Đao"
mà Dark Knight nhặt. Pháp sư mặc "Kim Lân Giáp". Không có bản sắc lớp nào cả.

**Vấn đề 3 — toàn bộ là kiếm hiệp**, vi phạm QUY TẮC SỐ 1: Mộc Kiếm · Lân Giáp · Ma Khố ·
Lăng Ba Hài · Thiên Tôn Miện · Phi Thiên Hài.

---

## 2. Cấu trúc đề xuất

Giữ nguyên **hai trục đã có**, chỉ nối chúng lại cho đúng:

| Trục | Nguồn | Vai trò MỚI |
|---|---|---|
| **Bậc** `it.tier` 1-10 | `itemTier(level)`, mỗi 10 cấp 1 bậc | quyết định **BỘ** (tên + tạo hình + bảng màu) |
| **Độ hiếm** `it.rarity` 0-4 | `rollRarity()` | quyết định **TIỀN TỐ** + màu viền khảm |

⇒ 10 bậc gom thành **5 dải bộ**, mỗi dải 2 bậc:

| Dải | Bậc | Cấp yêu cầu |
|---|---|---|
| I | 1-2 | 1-20 |
| II | 3-4 | 21-40 |
| III | 5-6 | 41-60 |
| IV | 7-8 | 61-80 |
| V | 9-10 | 81-120 |

**Tên món = `{Tiền tố độ hiếm} {Tên bộ} {Từ chỉ ô}`**

Ví dụ: `Hỏa Long Khôi` (Phàm) · `Tinh Xảo Hỏa Long Khôi` (Chí Tôn).

Tiền tố theo `RARITIES`: Phàm *(không tiền tố)* · **Rèn** · **Tinh Luyện** · **Thánh** · **Tinh Xảo**.

### Từ chỉ ô, theo chất liệu của lớp

| Ô | Giáp tấm (DK · DL) | Lai (SB) | Da nhẹ (SR) | Vải (DW) |
|---|---|---|---|---|
| `vukhi` | Kiếm | Đao | Cung | Trượng |
| `non` | Khôi | Mũ Trận | Mũ Da | Mũ Trùm |
| `ao` | Giáp | Bán Giáp | Áo Da | Bào |
| `tay` | Thủ Giáp | Găng Sắt | Bao Tay | Găng Vải |
| `quan` | Hạ Giáp | Giáp Đùi | Quần Da | Hạ Bào |
| `chan` | Ủng Sắt | Ủng Trận | Giày Da | Hài Vải |

---

## 3. Dark Knight — giáp tấm nặng

Đường đi: **sắt thô → giáp lưới → giáp tấm đen → bắt đầu có vảy → đầu rồng**.

| Dải | Bộ | Vũ Khí | Nón | Áo | Tay | Quần | Chân |
|---|---|---|---|---|---|---|---|
| I | **Thiết Vệ** | Thiết Vệ Kiếm | Thiết Vệ Khôi | Thiết Vệ Giáp | Thiết Vệ Thủ Giáp | Thiết Vệ Hạ Giáp | Thiết Vệ Ủng Sắt |
| II | **Giáp Xích** | Giáp Xích Kiếm | Giáp Xích Khôi | Giáp Xích Giáp | … Thủ Giáp | … Hạ Giáp | … Ủng Sắt |
| III | **Hắc Giáp** | Hắc Giáp Kiếm | Hắc Giáp Khôi | Hắc Giáp Giáp → **Hắc Giáp Trọng Giáp** | … | … | … |
| IV | **Vảy Rồng** | Vảy Rồng Kiếm | Vảy Rồng Khôi | Vảy Rồng Giáp | … | … | … |
| V | **Hỏa Long** | Hỏa Long Kiếm | Hỏa Long Khôi | Hỏa Long Giáp | Hỏa Long Thủ Giáp | Hỏa Long Hạ Giáp | Hỏa Long Ủng Sắt |

**Vẽ gì**

- **I Thiết Vệ** — sắt rèn thô, không hoa văn. Vai: tấm cong trơn. Mũ: chóp tròn + khe mắt ngang.
  Ủng: ống trơn. *(đã có — `style:'plate'` nấc 1)*
- **II Giáp Xích** — thêm lớp lưới xích dưới tấm ngực (vẽ bằng chấm so le). Vai: tấm + một
  đường khảm. Ống chân: nẹp dọc.
- **III Hắc Giáp** — giáp tấm góc cạnh, vai **vuông** thay vì cong, thêm 2 gai ngắn. Mũ có
  sống dựng. Váy hông 2 tấm. *(đã có — `plate` nấc 3)*
- **IV Vảy Rồng** — vảy bắt đầu xuất hiện ở mép vai và ống chân, sừng mũ cong nhẹ, khoá đai
  hình đầu thú. **Đây là dải chuyển tiếp** — nửa hình học nửa sinh vật.
- **V Hỏa Long** — vai là **đầu rồng** (sọ, gờ mày, hàm hé, răng, mắt rực, lửa phun), mũ sừng
  rồng + vây sống, ống chân vảy xếp lớp, mũi ủng là vuốt, váy vảy 2 hàng, khoá hàm rồng.
  *(đã vẽ xong — `style:'hoalong'`)*

**Bảng màu**

| Dải | lo | hi | trim | glow |
|---|---|---|---|---|
| I | `#4e5360` | `#6d7385` | `#7d7048` | — |
| II | `#3f4654` | `#5f6a80` | `#8d8256` | — |
| III | `#23262f` | `#3d4354` | `#8fa6c8` | `#6f8ec0` |
| IV | `#3a1f22` | `#7a3a34` | `#c8a84a` | `#c8703a` |
| V | `#5a1418` | `#c0342c` | `#ffc24a` | `#ff6a2a` |

---

## 4. Dark Wizard — VẢI, tuyệt đối không giáp tấm

> Đây là lớp dễ làm sai nhất. Bản nháp trước tôi cho pháp sư đeo vai giáp tấm của hiệp sĩ —
> nhìn mắc cười. **Dark Wizard không bao giờ có vai giáp kim loại.**

Đường đi theo đúng ý bạn: **vải thô → da thú → nhân sư → ma thuật → hồn vực**.

| Dải | Bộ | Vũ Khí | Nón | Áo | Tay | Quần | Chân |
|---|---|---|---|---|---|---|---|
| I | **Vải Thô** | Vải Thô Trượng | Vải Thô Mũ Trùm | Vải Thô Bào | Vải Thô Găng Vải | Vải Thô Hạ Bào | Vải Thô Hài Vải |
| II | **Da Thú** | Da Thú Trượng | Da Thú Mũ Trùm | Da Thú Bào | … Găng Vải | … Hạ Bào | … Hài Vải |
| III | **Nhân Sư** | Nhân Sư Trượng | Nhân Sư Mũ Trùm | Nhân Sư Bào | … | … | … |
| IV | **Ma Thuật** | Ma Thuật Trượng | Ma Thuật Mũ Trùm | Ma Thuật Bào | … | … | … |
| V | **Hư Vô** | Hư Vô Trượng | Hư Vô Mũ Trùm | Hư Vô Bào | Hư Vô Găng Vải | Hư Vô Hạ Bào | Hư Vô Hài Vải |

**Vẽ gì**

- **I Vải Thô** — áo vải nâu xám, mũ trùm mềm rủ xuống che nửa mặt. **Không có vai.**
  Trượng: cành gỗ cong, đầu buộc một viên đá.
- **II Da Thú** — áo choàng viền lông thú ở cổ, thêm đai da chéo ngực, xương nhỏ treo lủng
  lẳng. Vai: **cụm lông thú**, vẫn không phải kim loại. Trượng: xương dài, đầu là sọ nhỏ.
- **III Nhân Sư** — vải lanh sáng + nẹp kim loại kiểu Ai Cập. Mũ trùm biến thành **mũ nemes**
  (hai vạt vải cứng xoè hai bên má, kẻ sọc ngang). Ngực có **tấm cổ áo tròn** (usekh) nhiều
  vòng. Vai: hai vạt vải cứng, **không phải tấm giáp**. Trượng: đầu là hình nhân sư nhỏ.
- **IV Ma Thuật** — áo choàng thêu rune phát sáng chạy dọc mép, mũ trùm cao nhọn có vành,
  **hai mảnh phép lơ lửng** cạnh vai (hình thoi, xoay chậm). Trượng: đầu là một khối tinh
  thể lơ lửng, không dính vào cán.
- **V Hư Vô** — áo choàng tan dần ở gấu (mép dưới mờ thành khói), **vòng hào quang sau
  đầu**, **4-5 mảnh phép quay quanh vai** thay hoàn toàn cho vai giáp, chân không chạm đất
  hẳn (bóng nhỏ lại). Trượng: hai khối tinh thể quay ngược chiều nhau.

**Bảng màu**

| Dải | lo | hi | trim | glow |
|---|---|---|---|---|
| I | `#4a4038` | `#6b5c4c` | `#8a7a5c` | — |
| II | `#3e3228` | `#6a5340` | `#b09068` | — |
| III | `#5a4a2c` | `#c8b070` | `#3ac8c0` | `#7ee0d8` |
| IV | `#2a1f4a` | `#5a3f9a` | `#c0a0ff` | `#a88aff` |
| V | `#160f2c` | `#3a2a6a` | `#7ecbff` | `#6ff0ff` |

---

## 5. Sylvan Ranger — da nhẹ, lá & lông vũ

Đường đi: **da rừng → lá thép → vỏ cây → lông vũ → đại bàng**.

| Dải | Bộ | Vũ Khí | Nón | Áo | Tay | Quần | Chân |
|---|---|---|---|---|---|---|---|
| I | **Da Rừng** | Da Rừng Cung | Da Rừng Mũ Da | Da Rừng Áo Da | Da Rừng Bao Tay | Da Rừng Quần Da | Da Rừng Giày Da |
| II | **Lá Thép** | Lá Thép Cung | Lá Thép Mũ Da | Lá Thép Áo Da | … | … | … |
| III | **Vỏ Sồi** | Vỏ Sồi Cung | Vỏ Sồi Mũ Da | Vỏ Sồi Áo Da | … | … | … |
| IV | **Lông Ưng** | Lông Ưng Cung | Lông Ưng Mũ Da | Lông Ưng Áo Da | … | … | … |
| V | **Đại Bàng Trắng** | Đại Bàng Trắng Cung | Đại Bàng Trắng Mũ Da | Đại Bàng Trắng Áo Da | Đại Bàng Trắng Bao Tay | Đại Bàng Trắng Quần Da | Đại Bàng Trắng Giày Da |

**Vẽ gì**

- **I Da Rừng** — áo da nâu, mũ da mềm có vành nhỏ. Vai: **một miếng da tròn** khâu chỉ.
  Cung: gỗ trơn, dây đơn.
- **II Lá Thép** — tấm kim loại **hình lá** khâu lên áo da (3 lá ở ngực). Vai: 2 lá xếp chồng.
  Ống chân: nẹp lá. Cung: hai đầu uốn cong hơn, bọc kim loại.
- **III Vỏ Sồi** — vỏ cây + dây leo quấn quanh tay và ống chân, mũ có **hai chiếc lá dựng**
  hai bên như sừng nai non. Vai: cụm lá nhiều lớp. Cung: thân có nhánh nhỏ mọc ra.
- **IV Lông Ưng** — lông vũ thay lá: vai là **cụm lông xếp lớp** hất ra sau, mũ có 3 chiếc
  lông cắm nghiêng, gấu áo tua. Cung: dây phát sáng nhạt.
- **V Đại Bàng Trắng** — vai là **cánh lông vũ lớn** xoè ra sau (dài gần bằng vai giáp Hỏa Long
  nhưng nhẹ, nhiều lớp mảnh), mũ **vương miện gạc nai** trắng, ống chân lông tơ, giày có
  cựa. Cung: **không có dây nhìn thấy được**, hai đầu là hai chùm lông sáng.

**Bảng màu**

| Dải | lo | hi | trim | glow |
|---|---|---|---|---|
| I | `#4a3c2c` | `#6e5a40` | `#8a7448` | — |
| II | `#2f4436` | `#4a6b52` | `#9aa858` | — |
| III | `#24402f` | `#3e6b4a` | `#8ad86a` | `#7ad86a` |
| IV | `#2a4a4a` | `#4e8a86` | `#c8f0e8` | `#8fe8dc` |
| V | `#6a6a58` | `#e8e4d4` | `#ffd76a` | `#fff0c0` |

---

## 6. Spellblade — nửa giáp LỆCH, lửa

Đặc điểm giữ suốt 5 dải: **một vai có giáp, một vai để trần**. Đây là chữ ký của lớp.

| Dải | Bộ | Vũ Khí | Nón | Áo | Tay | Quần | Chân |
|---|---|---|---|---|---|---|---|
| I | **Bán Giáp** | Bán Giáp Đao | Bán Giáp Mũ Trận | Bán Giáp Bán Giáp → **Bán Giáp Áo** | Bán Giáp Găng Sắt | Bán Giáp Giáp Đùi | Bán Giáp Ủng Trận |
| II | **Giáp Lệch** | Giáp Lệch Đao | Giáp Lệch Mũ Trận | Giáp Lệch Bán Giáp | … | … | … |
| III | **Than Hồng** | Than Hồng Đao | Than Hồng Mũ Trận | Than Hồng Bán Giáp | … | … | … |
| IV | **Lửa Dữ** | Lửa Dữ Đao | Lửa Dữ Mũ Trận | Lửa Dữ Bán Giáp | … | … | … |
| V | **Hoả Ngục** | Hoả Ngục Đao | Hoả Ngục Mũ Trận | Hoả Ngục Bán Giáp | Hoả Ngục Găng Sắt | Hoả Ngục Giáp Đùi | Hoả Ngục Ủng Trận |

> ⚠ Dải I bị lặp chữ ("Bán Giáp Bán Giáp"). Dùng **"Bán Giáp Áo"** cho ô `ao` của riêng dải I.

**Vẽ gì**

- **I Bán Giáp** — vai TRÁI có một tấm sắt, vai PHẢI trần (chỉ dây đai chéo). Mũ: nửa mặt nạ
  che một bên. Đao: bản rộng, sắt trơn.
- **II Giáp Lệch** — tấm vai trái to hơn + 1 gai; vai phải quấn băng vải. Giáp đùi chỉ có
  một bên. Đao: rãnh máu chạy dọc lưỡi.
- **III Than Hồng** — mép giáp **ửng đỏ như còn nóng** (viền gradient cam ở cạnh dưới các
  tấm). Vai trái có 2 lưỡi lửa nhỏ. Đao: lưỡi có vệt cam ở sống.
- **IV Lửa Dữ** — lửa liếm dọc vai trái (3-4 lưỡi), vai phải trần **có vết cháy đen**,
  mũ có mào lửa. Đao: lưỡi cháy suốt chiều dài.
- **V Hoả Ngục** — vai trái là **khối lửa đông cứng** (hình bất định, viền sáng, lõi tối),
  vai phải trần lộ **vân nứt phát sáng chạy trên da**, mũ mặt nạ nứt để lộ ánh lửa bên
  trong, ống chân toả khói. Đao: lưỡi là lửa thuần, cán bằng xương cháy.

**Bảng màu**

| Dải | lo | hi | trim | glow |
|---|---|---|---|---|
| I | `#4a4038` | `#7a6a58` | `#9a7a4a` | — |
| II | `#4a2f26` | `#7a4a36` | `#c08a4a` | — |
| III | `#5a2418` | `#a84a28` | `#ffb060` | `#ff8a3a` |
| IV | `#6a1e10` | `#d85a22` | `#ffd08a` | `#ff6a1a` |
| V | `#2a0d08` | `#ff5a1a` | `#fff0c0` | `#ffb020` |

---

## 7. Dark Lord — nghi lễ, chỉ huy

Đặc điểm giữ suốt: **vải rủ + răng lược trên vai**, mũ hướng về vương miện. Không gai nhọn
kiểu Dark Knight — Dark Lord là quý tộc, không phải chiến binh tuyến đầu.

| Dải | Bộ | Vũ Khí | Nón | Áo | Tay | Quần | Chân |
|---|---|---|---|---|---|---|---|
| I | **Lệnh Giáp** | Lệnh Giáp Trượng | Lệnh Giáp Khôi | Lệnh Giáp Giáp | Lệnh Giáp Thủ Giáp | Lệnh Giáp Hạ Giáp | Lệnh Giáp Ủng Sắt |
| II | **Cận Vệ** | Cận Vệ Trượng | Cận Vệ Khôi | Cận Vệ Giáp | … | … | … |
| III | **Vương Giáp** | Vương Giáp Trượng | Vương Giáp Khôi | Vương Giáp Giáp | … | … | … |
| IV | **Bạo Chúa** | Bạo Chúa Trượng | Bạo Chúa Khôi | Bạo Chúa Giáp | … | … | … |
| V | **Ngai Đen** | Ngai Đen Trượng | Ngai Đen Khôi | Ngai Đen Giáp | Ngai Đen Thủ Giáp | Ngai Đen Hạ Giáp | Ngai Đen Ủng Sắt |

**Vẽ gì**

- **I Lệnh Giáp** — giáp tấm đơn giản + **một dải vải rủ từ vai trái xuống**. Mũ: vành tròn
  thấp. Trượng: cán gỗ, đầu bịt đồng.
- **II Cận Vệ** — vai có **3 răng lược** ngắn, vải rủ cả hai bên, đai lưng bản rộng có huy
  hiệu. Trượng: đầu hình chuông.
- **III Vương Giáp** — vai thành **bệ nghi lễ** (mặt phẳng có viền), 5 răng lược, vải rủ dài
  tới hông. Mũ: **vương miện 3 chấu** gắn liền. Trượng: đầu là vòng tròn rỗng.
- **IV Bạo Chúa** — vai bệ lớn + vải rủ tới gối, có tua kim loại. Mũ: vương miện 5 chấu,
  thêm mạng che mặt bằng dây kim loại. Trượng: vòng tròn có gai hướng ra.
- **V Ngai Đen** — vai là **bệ hai tầng** (tầng dưới rộng, tầng trên hẹp có răng lược cao), vải
  rủ phủ kín tới ống chân và **bay theo bước chân**, mũ vương miện 5 chấu **lơ lửng cách đầu
  vài pixel** (không chạm), ống chân có tua. Trượng: vòng tròn kép, giữa là một con mắt.

**Bảng màu**

| Dải | lo | hi | trim | glow |
|---|---|---|---|---|
| I | `#454a30` | `#6a7248` | `#8a8a58` | — |
| II | `#3a4028` | `#5e6a3a` | `#a8a860` | — |
| III | `#2a3020` | `#4a5a30` | `#d8c060` | `#c8d060` |
| IV | `#1e2418` | `#3a4a26` | `#ffd76a` | `#d0e07a` |
| V | `#100e14` | `#2a2a34` | `#ffd76a` | `#c8a0ff` |

---

## 8. Việc phải làm trong code

Theo thứ tự phụ thuộc:

1. **`ITEM_NAMES` → `SET_LINES`.** Thay bảng theo-độ-hiếm bằng bảng theo-**lớp × dải × ô**.
   `genItem()` đang đặt tên bằng `ITEM_NAMES[slot.id][r]` — phải đổi sang tra theo
   `(player.sect, itemBand(it.tier), slot.id)` rồi ghép tiền tố độ hiếm.
   ⚠ **Đồ trong save cũ giữ nguyên `name` đã sinh** — không cần migration, nhưng đồ cũ sẽ
   mang tên kiếm hiệp mãi mãi. Cân nhắc đổi tên lại lúc `loadGame()` dựa trên `slot`+`tier`+
   `rarity`, hoặc chấp nhận (đồ cũ sẽ bị thay hết trong vài giờ chơi).
   ⚠ Món rơi ra **không biết lớp người chơi** nếu ta muốn đồ rơi chung — quyết định: đồ rơi
   theo lớp đang chơi (smart-loot, giống Khắc Ấn) hay giữ chung? *Đề xuất: theo lớp.*

2. **`HERO_SETS` mở từ 3 → 5 dải** cho Dark Knight, và thêm 4 lớp còn lại.
   `heroSet()` và `hStage()` đã sẵn sàng, chỉ thêm dữ liệu.

3. **Bộ tạo hình mới.** Hiện có `plate` + `hoalong`. Cần thêm:

   | `style` | Dùng cho | 4 hàm cần viết |
   |---|---|---|
   | `chain` | DK II | shoulder · crest · leg · hip |
   | `drakeguard` | DK IV | ” |
   | `cloth` | DW I, II | ” (vai = cụm vải/lông, **không kim loại**) |
   | `sphinx` | DW III | ” (mũ nemes, cổ áo tròn) |
   | `arcane` | DW IV, V | ” (mảnh phép lơ lửng) |
   | `hide` | SR I, II | ” |
   | `leaf` | SR III | ” |
   | `plume` | SR IV, V | ” |
   | `halfplate` | SB I-V | ” (**lệch vai** — hàm nhận `side`, chỉ vẽ một bên) |
   | `regal` | DL I-V | ” (răng lược + vải rủ) |

   ⚠ `hPauldrons` hiện vẽ **đối xứng hai bên** (`for (const side of [-1,1])`). Spellblade cần
   phá đối xứng — phải cho hàm tạo hình biết nó đang vẽ bên nào và được quyền bỏ qua một bên.

4. **Vũ khí theo bậc.** Hiện lưỡi kiếm là hình cứng trong `HERO_GEAR[lớp].upper` — vẽ y hệt
   kể cả khi ô vũ khí **rỗng**. Cần đọc `gv.wTier` / `gv.wPlus` để đổi độ dài, bản lưỡi và màu.

5. **Kiểm tra lại `test_gearlook.js` / `test_plusglow.js`** — cả hai đang khoá cứng
   `'thieulam'`; mở rộng cho cả 5 lớp sau khi có đủ bộ tạo hình.

---

## 9. Bảng tổng — 25 bộ

| | I (bậc 1-2) | II (3-4) | III (5-6) | IV (7-8) | V (9-10) |
|---|---|---|---|---|---|
| **Dark Knight** | Thiết Vệ | Giáp Xích | Hắc Giáp | Vảy Rồng | **Hỏa Long** |
| **Dark Wizard** | Vải Thô | Da Thú | Nhân Sư | Ma Thuật | Hư Vô |
| **Sylvan Ranger** | Da Rừng | Lá Thép | Vỏ Sồi | Lông Ưng | Đại Bàng Trắng |
| **Spellblade** | Bán Giáp | Giáp Lệch | Than Hồng | Lửa Dữ | Hoả Ngục |
| **Dark Lord** | Lệnh Giáp | Cận Vệ | Vương Giáp | Bạo Chúa | Ngai Đen |

25 bộ × 6 ô = **150 tên món**. Đã kiểm: không tên nào trùng danh từ riêng MU Online
(QUY TẮC SỐ 2), không tên nào là thuật ngữ tu tiên (QUY TẮC SỐ 1).

---

## 10. Soát kiếm hiệp (QUY TẮC SỐ 1)

Bản nháp đầu có **9 tên bị loại** vì còn hơi hướng kiếm hiệp / tiên hiệp:

| Bỏ | Vì sao | Dùng thay |
|---|---|---|
| Long Vệ | lối ghép Sino-tiên hiệp | **Vảy Rồng** |
| Hồn Vực | ” | **Hư Vô** |
| Vệ Lâm | ” | **Vỏ Sồi** |
| Phong Vũ | lặp đúng khuôn "Bạch Hổ" vừa xoá khỏi bộ Cổ Thần | **Lông Ưng** |
| Bạch Vũ | ” | **Đại Bàng Trắng** |
| Viêm Giáp | Sino-văn chương, xa lối dark-fantasy | **Than Hồng** |
| Cuồng Viêm | ” | **Lửa Dữ** |
| Ngục Diễm | ” | **Hoả Ngục** |
| Hắc Đế | "xưng đế" là mô-típ tiên hiệp | **Ngai Đen** |

**Nguyên tắc rút ra khi đặt tên tiếp:** ưu tiên **danh từ CỤ THỂ, sờ được** — vật liệu
(Vảy Rồng · Vỏ Sồi · Than Hồng · Lông Ưng), con vật (Đại Bàng Trắng), đồ vật (Ngai Đen).
Tránh lối ghép hai chữ Sino trừu tượng (Phong Vũ · Cuồng Viêm · Hắc Đế) — chính lối ghép đó
tạo ra "mùi" kiếm hiệp, chứ không phải bản thân từ Hán-Việt.

Từ Hán-Việt **vẫn dùng được bình thường** khi nó là tiếng Việt thông dụng: Thiết Vệ, Giáp
Xích, Hắc Giáp, Hoả Ngục, Bạo Chúa, Vương Giáp, Nhân Sư, Ma Thuật, Bán Giáp. Game vốn đã
dùng Hung Thần · Trấn Phái · Cổ Thần · Bảo Hạp · Pháo Đài Máu — đó không phải kiếm hiệp.

Thứ **thật sự** bị cấm là từ vựng tu tiên (cảnh giới · đan điền · chân khí · môn phái ·
giang hồ · độ kiếp · phi thăng) và mô-típ vũ trụ quan Trung Hoa (Tứ Tượng · bát quái ·
thái cực · ngũ hành làm hệ thống trung tâm).

### Đã soát

- 25 tên bộ + 150 tên món: **không** chứa từ vựng tu tiên.
- **Không** trùng danh từ riêng MU Online (QUY TẮC SỐ 2) — đã đối chiếu danh sách cấm:
  Kundun · Lorencia · Noria · Devias · Icarus · Atlans · Tarkan · Fairy Elf ·
  Magic Gladiator · Devil Square · Blood Castle.
- "Nhân Sư" (Sphinx) là thần thoại Ai Cập thuộc phạm vi công cộng, không phải tên riêng của
  MU — dù MU cũng có một bộ tên tương tự cho Dark Wizard.
- "Hỏa Long" giữ theo yêu cầu; rồng là mô-típ dark-fantasy phổ thông, không riêng của ai.
