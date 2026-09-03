# Kế hoạch chuyển art nhân vật sang Spine

Nối tiếp `docs/CAI_THIEN_ART.md`. Tài liệu kia bàn *có nên hay không*; tài liệu này giả định
đã chọn hướng Spine và trả lời *làm thế nào*. Số **đo từ mã** đọc thẳng từ `public/game/game.js`;
chỗ nào ước lượng thì ghi rõ.

Ba gói Spine thử nghiệm đã xác nhận: bộ xương (83 xương · 13 slot · 20 hoạt ảnh) **giống hệt
từng byte** qua ba lần sinh riêng biệt. Toàn bộ kế hoạch dưới đây tựa vào điều đó.

---

## 1. Phải sinh bao nhiêu

### 1.1 Giáp — 30 bộ, không phải 84

Game có 14 giai × 6 lớp = 84 diện mạo. Nhưng mã **đã gộp sẵn**:

```js
function hStage(t){ return t < 4 ? 1 : t < 7 ? 2 : t < 10 ? 3 : t < 13 ? 4 : 5; }
```

14 giai → **5 chặng tạo hình**, còn màu thì `hSetMetal(M, S, t)` tô lại theo từng giai. Nên
chỉ cần **5 chặng × 6 lớp = 30 bộ**, mỗi bộ một lượt sinh.

| Chặng | Giai | Ví dụ tên bộ Dark Knight |
|---|---|---|
| 1 | 1–3 | Thiết Phiến · Giáp Xích · Giáp Đồng |
| 2 | 4–6 | Hắc Giáp · Ngân Giáp · Cốt Giáp |
| 3 | 7–9 | Vảy Rồng · Huyết Long · Bạo Long |
| 4 | 10–12 | Hỏa Long · Lôi Đình · Băng Nguyên |
| 5 | 13–14 | Thánh Long · Long Vương |

**Bốn giai trong một chặng phân biệt bằng TÔ MÀU, không bằng hình.** Đó là cơ chế đang chạy,
không phải thoả hiệp mới. Muốn giữ được nó thì ảnh sinh ra nên thiên về **trung tính** để lớp
tô màu còn chỗ làm việc — xem §2.4.

### 1.2 Cánh — 18 đôi, và KHÔNG đi qua Spine

Bộ xương không có slot lưng. Gói thử "Angel Wing" cho thấy công cụ hiểu đó là *một nhân vật tên
Angel Wing* và vẽ cánh vào mọi slot cơ thể — vô dụng nếu coi là gói Spine, nhưng **hoàn hảo nếu
coi là nguồn ảnh**: cắt ra được 5 đôi cánh xoè hoàn chỉnh từ một lượt sinh.

Cánh đi đường riêng, và đây là lựa chọn ĐÚNG chứ không phải chữa cháy:

- `veCanh()` xoay từng thùy **cứng** quanh gốc bả vai — không skinning, nên `drawImage` là đủ.
- 18 đôi cánh × 30 bộ giáp = 540 tổ hợp nếu nướng chung; tách ra thì chỉ còn **18 ảnh**.
- Giữ được vỗ độc lập, trễ pha giữa các thùy, nghiêng theo quán tính, và nhấc người khi bay.

Ước tính **6 lượt sinh** (một kiểu cánh mỗi lớp) là đủ ra 18 đôi, vì mỗi lượt cho nhiều biến thể.

### 1.3 Vũ khí — chỗ chưa có lời giải sạch

Game có **15 dòng vũ khí** (`BAG_SIZES_LINE`), mỗi dòng lại có 14 giai. Mỗi lượt sinh giáp chỉ
kèm **một** vũ khí trong slot `武器`. 15 × 14 = 210 vũ khí thì không sinh nổi.

Ba lựa chọn, chưa chốt:

- **a.** Giữ vũ khí ở đường vector hiện tại (`hHeldWeapon`) — lệch tông với thân người vẽ tay.
- **b.** Sinh vũ khí như sinh cánh (một "nhân vật vũ khí", cắt lấy slot `武器`), rồi gộp 15 dòng
  xuống ~6 nhóm dáng × 5 chặng = **30 ảnh vũ khí**. Cùng cách gộp như giáp.
- **c.** Chỉ vẽ tay cho vũ khí giai cuối, giai thấp dùng vector.

**Đề xuất b**, cùng lý lẽ với cánh: slot `武器` tách rời nên tráo được, và 30 ảnh là chịu được.

---

## 2. Câu hỏi +1 → +11 — trả lời chi tiết

**Có làm được, nhưng phải đổi một chỗ trong mã, nếu không thì nổ bộ nhớ đệm.**

### 2.1 Cái bẫy nằm ở chữ ký đệm

**Đo từ mã** (`heroGearSig`):

```js
return gv ? `${Math.round(gv.t*10)}_${gv.n}_${gv.rarity}_${Math.round(gv.plus)}_${gv.setColor||''}` : '-';
```

`plus` **đang nằm trong khoá đệm sprite**. Với bản vẽ vector thì vô hại — mỗi mức + dựng lại một
tấm, vẽ lại rẻ. Nhưng nếu nướng từ art Spine thì mỗi mức + thành **một bộ khung riêng**: 12 mức
(+0…+11) × 80 khung × 30 bộ = **28 800 khung**. Không đi được.

**Phải bỏ `plus` ra khỏi khoá**, và áp độ sáng ở khâu BLIT thay vì khâu nướng.

### 2.2 Ba lớp, ba nhát vẽ

Nướng **một** bộ khung cho mỗi (lớp · chặng · khung hình), rồi lúc vẽ chồng thêm:

| Lớp | Cách vẽ | Mức + |
|---|---|---|
| ① Nền | `drawImage(spr)` như thường | mọi mức |
| ② Sáng thêm | `globalCompositeOperation = 'lighter'` rồi vẽ LẠI chính tấm đó, `globalAlpha = k` | +1 trở lên |
| ③ Quầng ngoài | vẽ **mặt nạ bóng** đã nướng sẵn, tô màu theo phẩm, thổi to 1,04× | +7 trở lên |

Lớp ② là mấu chốt và nó rẻ đến bất ngờ: vẽ đè chính tấm sprite ở chế độ cộng sáng thì **vùng kim
loại sáng lên nhiều, vùng vải tối gần như không đổi** — đúng cảm giác món đồ "ăn ngọc". Không cần
mặt nạ riêng, không cần texture thứ hai.

Thang đề xuất, nối tiếp `plusStage()` đang có:

```
+1 … +6   k = plus * 0.022        → sáng dần, không quầng. Nhìn kỹ mới thấy, đúng tinh thần.
+7 … +9   k = 0.13 + (plus-6)*0.05 + quầng ngoài mờ
+10 … +11 k = 0.28 + (plus-9)*0.06 + quầng mạnh + nhấp theo nhịp
```

### 2.3 Mặt nạ bóng lấy đâu ra

Không phải vẽ thêm. Lúc nướng khung, lấy **kênh alpha của chính tấm sprite**, tô đặc một màu,
làm nhoè nhẹ rồi lưu thành một atlas thứ hai. Một mặt nạ cho mỗi khung hình, **không nhân với 12
mức +**. Tốn thêm chừng 30% dung lượng của bộ khung, và chỉ cần cho chặng 3 trở lên (đồ giai thấp
hiếm khi lên quá +6).

### 2.4 Tô màu 14 giai từ 5 chặng

Cơ chế `hSetMetal()` hiện tô lại giáp theo giai. Với sprite nướng sẵn thì làm bằng hai nhát:

- vẽ sprite bình thường
- `globalCompositeOperation = 'overlay'` (hoặc `'color'`) rồi tô một mảng màu của giai, cắt theo
  alpha của sprite

Muốn nhát này ăn thì **ảnh sinh ra phải trung tính** — giáp xám thép nhận màu tốt, giáp đã đỏ rực
sẵn thì tô kiểu gì cũng ra đỏ. Đây là ràng buộc phải đưa vào prompt ngay từ đầu, không sửa được
về sau.

### 2.5 Hai giới hạn phải nói thẳng

**Không sáng riêng từng món được.** Sprite nướng là cả thân người một tấm, nên +N chỉ áp cho
TOÀN THÂN, lấy theo trung bình hoặc lớn nhất. Trong MU mỗi món một mức + riêng.

Ngoại lệ: **vũ khí có slot riêng** nên vẫn sáng độc lập được — và mã đã làm vậy rồi
(`wpn.plus >= 9` và `>= 11` ở `drawPlayer`). Cánh cũng vậy, vì vẽ riêng.

**`hPlusAura()` không phải sửa.** Nó vẽ quầng sau lưng bằng gradient, đọc `gv.plus` với hệ số
liên tục `k = (plus-6)/5`, hoàn toàn tách khỏi sprite. Giữ nguyên.

---

## 3. Dung lượng

**Đo từ mã**: `HS_FRAMES = { i:16, w:32, a:16, c:16 }` = 80 khung mỗi bộ.

Nướng đủ 80 khung × 30 bộ = 2400 khung. Ở cỡ ~200×260 thì PNG ≈ 15 KB/khung → **36 MB**. Quá nặng.

Ba nhát cắt, cộng lại đủ:

**Giảm số khung.** Hoạt ảnh Spine dài 0,67–1,6 s; ở 12 hình/giây thì Idle 12 khung, Walk 10,
Đánh 8, Chiêu 10, Trúng đòn 4, Chết 12 = **56 khung**, thay vì 80.

**WebP thay PNG.** Đo thật trên gói thử: 1111 KB → **274 KB**, giảm 4 lần.

**Tải lười theo lớp.** Người chơi chơi một lớp; 5 chặng của một lớp ≈ 1,2 MB. Tải chặng kế tiếp
khi sắp tới. Năm lớp còn lại không bao giờ chạm tới.

⇒ **Ước lượng ~1,2 MB cho lượt tải đầu**, ~7 MB nếu ai đó chơi hết cả sáu lớp. *(Chưa kiểm chứng
— phải nướng thật một bộ rồi mới đo được.)*

---

## 4. Lộ trình

Mỗi giai đoạn giao được riêng, và **không giai đoạn nào đụng vào bản đang chạy** cho tới G4.

**G0 · Đường nướng** — dựng công cụ, chưa đụng game.
Chạy runtime Spine trong Chromium bằng Playwright (đã có sẵn cho bài kiểm), phát từng hoạt ảnh,
chụp từng khung, đóng gói atlas + WebP. Đầu ra: một script trong `tools/`.
⚠ Cần nạp được `spine-webgl` — proxy môi trường này chặn nhiều miền, **phải thử trước**.

**G1 · Một bộ, hai hoạt ảnh** — nướng `00_Idle` + `00_Walk` của một bộ, nhồi vào `heroSprite`
sau một nhánh `if`. Giữ nguyên đường vector làm đường lùi. Chụp hai bản cạnh nhau.

**G2 · Cánh** — gọn và độc lập nhất, có thể làm song song hoặc làm trước cả G1. Thêm
`assets/canh/`, thêm nhánh `drawImage` trong `canhVeThuy`, chỉnh `WING_TIERS` theo tỉ lệ ảnh thật.
Đây là giai đoạn **rẻ nhất mà thấy được ngay**.

**G3 · Hệ +N** — bỏ `plus` khỏi `heroGearSig`, thêm hai nhát vẽ chồng, nướng mặt nạ bóng.
Bài kiểm: +0 · +6 · +9 · +11 phải cho ra bốn ảnh khác nhau đo được.

**G4 · Đủ 30 bộ + tải lười** — sinh nốt, dựng bộ nạp theo lớp, đổi mặc định sang art mới.
Đây là giai đoạn đầu tiên người chơi thấy đổi.

**G5 · Vũ khí** — theo phương án §1.3b nếu chốt.

---

## 5. Những gì mất đi

Phải nói trước, vì tới G4 mới thấy thì muộn:

- **Áo choàng nướng chết vào thân.** Ba gói thử đều thấy vệt áo choàng trong mảnh thân và mảnh
  chân. Hệ áo choàng đổi màu hiện tại sẽ không dùng được nữa.
- **Nhịp chiến đấu lệch.** Spine đánh 0,67 s, game đang là 0,22 s. Hoặc tua nhanh lúc phát, hoặc
  chỉnh lại nhịp — mà 0,22 s là con số đã tinh chỉnh qua cả đợt làm hitstop và hất lùi.
- **68 hàm `h*`** dựng giáp vector thành mã chết ở đường trong màn. Vẫn cần cho chân dung nếu
  chân dung chưa chuyển.
- **Tên slot và vùng atlas là chữ Hán.** Luật dự án cấm CJK trong `game.js`, nên phải có bước đổi
  tên lúc nhập.
- **Phong cách lệch giữa các lớp.** Lớp đội mũ kín ra tông nghiêm, lớp hở mặt ra tông anime. Phải
  sinh cả 6 lớp trong một đợt và ghì phong cách bằng prompt.

---

## 6. Việc đầu tiên

**G2 (cánh) trước G1.** Lý do: nó không đụng `drawHeroFigure`, không cần đường nướng, không cần
runtime Spine, và đã có sẵn ảnh dùng được từ gói thử. Một buổi là xong, và nó trả lời được câu
hỏi lớn nhất — art vẽ tay ghép vào bộ khung hiện tại có ra hồn không — mà không tiêu gì cả.

Nếu G2 nhìn ổn thì mới đáng bỏ công vào G0.
