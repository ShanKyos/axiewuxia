# HƯỚNG DẪN CHƠI

> Hướng dẫn thực dụng. Muốn biết game có những gì thì đọc
> [`TONG_QUAN.md`](TONG_QUAN.md) trước.
>
> Toàn bộ phím tắt dưới đây đọc thẳng từ chỗ xử lý bàn phím trong
> `public/game/game.js` — không chép lại từ tài liệu cũ.

---

## 1. Điều khiển

### Chuột

| Thao tác | Kết quả |
|---|---|
| **Chuột phải** vào bãi trống | **Đi tới đó.** Đây là cách di chuyển duy nhất. Nhân vật tự né vật cản dọc đường |
| **Chuột trái** vào bãi trống | Quay mặt về hướng con trỏ và **đánh đòn thường** |
| **Chuột trái/phải** trúng NPC | Tự đi tới NPC rồi tự mở lời thoại — không cần bấm E |
| **Chuột trái** trúng món đồ dưới đất | Nhặt món đó (phải bấm khá trúng — bán kính chỉ 26px, để mỗi cú vung kiếm gần đống đồ không biến thành thao tác nhặt) |
| **Bấm minimap** (góc phải trên) | Đi tới điểm đó trên map. Quái hiện luôn trên minimap nên đây là cách "đi tới bãi quái gần nhất" nhanh nhất |
| **Rê chuột** lên ô đồ | Hiện thẻ vật phẩm + thẻ món đang mặc để so sánh |

> **Không có WASD.** Game đã bỏ hẳn di chuyển bằng bàn phím. Cũng **không còn nút nhảy** —
> phím J nay là nhặt đồ.

### Bàn phím

| Phím | Việc |
|---|---|
| **Space** | Đòn thường. (Nếu bạn đã gán một chiêu vào Space thì nó tung chiêu đó, hết hồi chiêu/thiếu Qi thì tự quay về đòn thường) |
| **1 / 2 / 3** | Ba ô kỹ năng: chiêu chính · Trấn Phái · buff riêng của lớp. Ô còn trống thì mở bảng Kỹ Năng |
| **J** | **NHẶT ĐỒ dưới đất** (tầm với 96px, ưu tiên món gần nhất) → nếu không có món nào thì hái thảo dược gần đó |
| **giữ ALT** | Hiện **nhãn tên MỌI món** đang nằm dưới đất trên màn hình, không chỉ món gần |
| **R** | Uống Hồ Lô Thuốc (hồi 40% máu, hồi chiêu 20 giây, mang tối đa 5 lọ) |
| **E** | Bắt Tuấn Mã Hoang đang kiệt sức → nếu không có thì trò chuyện với NPC gần đó |
| **G** | Dùng cổng đang đứng gần: đi map khác / vào phó bản / xuống Tầng Sâu / **rút khỏi Tầng Sâu** |
| **T** | Thu phục Linh Thú (cần Phong Linh Phù, tinh anh dưới 40% máu, trong 230px) |
| **Z** | Bật/tắt **AUTO FARM** |
| **V** | **Cửa sổ Nhân Vật** — cấp, EXP, điểm tiềm năng, bảng chỉ số chiến đấu |
| **C** | Bảng Nhân Vật nhiều tab: Thông Tin · Rèn Luyện · Thú Chiến · Tấn Chức · Linh Thú · Tẩy Tủy |
| **I** | Trang bị (lưới 12 ô kiểu paperdoll) |
| **B** | Túi đồ |
| **K** | Kỹ năng |
| **H** | Tấn Chức (Ám Khí / Cương Khí / Cung Tiễn) |
| **F** | Lò Hỗn Độn |
| **M** | Bản đồ thế giới (dịch chuyển) |
| **Q** | Nhật ký nhiệm vụ |
| **U** | Ẩn/hiện minimap |
| **O** | Cài đặt |
| **Esc** | Đóng mọi cửa sổ |

> Trên màn hình rộng từ 1000px, bấm **I** hoặc **B** mở **cả hai bảng cạnh nhau** để
> kéo–thả đồ từ Túi Đồ sang ô Trang Bị. Màn hình hẹp thì chỉ mở một bảng.

> ⚠ **Phím V hiện đang làm HAI việc cùng lúc**: vừa mở cửa sổ Nhân Vật, vừa
> **xuất trận / thu hồi Thú Chiến**. Nếu bạn đã có Thú Chiến thì mỗi lần bấm V để xem
> chỉ số, con thú cũng bị gọi ra hoặc thu về. Muốn chỉ mở cửa sổ Nhân Vật thì bấm nút
> 🧙 trên thanh dưới rồi chọn tab, hoặc chấp nhận bấm V hai lần để con thú về trạng
> thái cũ. (Đây là lỗi trùng phím trong code, không phải thiết kế.)

### Trên điện thoại

Không có bàn phím, nên mọi thứ đi qua thanh dưới màn hình:
ô ⚔ = đòn thường, ba ô 1/2/3 = kỹ năng, **ô ✋ cuối thanh = nhặt đồ** (đúng thứ tự ưu
tiên như phím J). Di chuyển bằng bấm minimap.

---

## 2. Đọc màn hình

- **Hai viên cầu** hai đầu thanh dưới: đỏ = Sinh Lực, xanh = Qi (tài nguyên tung chiêu).
- **Thanh EXP** mảnh chạy dọc mép dưới cùng.
- **Góc phải trên**: bạc ◈ · Huyền Thiết ✦ · nút PK · nút AUTO · minimap · bảng nhiệm vụ.
- **Chip đồng hồ ⏱** góc trái trên: giờ thật + đếm ngược sự kiện thế giới gần nhất.
  **Bấm vào để mở Bảng Sự Kiện** — đây là chỗ duy nhất xem được lịch đầy đủ.
- **Vòng đỏ / quạt đỏ** dưới chân boss = chiêu đang tụ, sắp nổ ở đúng vùng đó.
- **Banner giữa màn hình** = thứ quan trọng vừa xảy ra (đồ hiếm rơi, cửa đá mở, sự kiện bắt đầu).

---

## 3. Lộ trình cấp 1 → 120

### Chặng 1 · Cấp 1 – 10 — Petalshade Isle

Cứ bám **chính tuyến**, nó dạy đủ mọi cơ chế:

| Cấp | Việc | Mở ra |
|---|---|---|
| 1 | Gặp Trưởng Lão Rell ở Lunaris City | — |
| 2 | Hạ 5 Axie Heo Rừng | ô kỹ năng 1 (chiêu chính) |
| 3 | Hái 4 Thảo Dược | Mục Tiêu Hôm Nay |
| 4 | Hạ 6 Axie Gai Tím | ô kỹ năng 2 (Ám Khí) + Tấn Chức (H) |
| 5 | **Rèn một món lên +3** | Lò Hỗn Độn (F) |
| 6 | Hạ 8 Tay Sai Gloam | Thú Chiến (C → Thú Chiến) |
| 7 | Đứng trong suối 8 giây | ô kỹ năng 3 (Trấn Phái) |
| 8 | Hạ 1 Gloam Marauder bằng Ám Khí | — |
| 9 | Dùng Trấn Phái kết liễu 5 Tay Sai Gloam | — |
| 10 | **The Calling — hạ Thủ Lĩnh Đoàn Gloam** | **CHỌN LỚP** + mở Lunaris City |

Đừng bỏ nhiệm vụ 5. Nó thưởng sẵn vũ khí + 3 Huyền Thiết để bạn rèn ngay, và rèn tới
+6 thì **không thể thất bại** — cứ đập thẳng, không cần suy nghĩ.

**Chọn lớp** ở cấp 10 là quyết định vĩnh viễn. Gợi ý:
- Mới chơi lần đầu → **Dark Knight** (dày nhất, dễ sống nhất) hoặc **Sylvan Ranger**
  (đánh xa 380, ít ăn đòn).
- Thích giết nhanh, chấp nhận chết nhiều → **Dark Wizard** (ST ×1,30 nhưng HP ×0,72).
- Muốn cân bằng và không phải chờ tới cấp cao mới mạnh → **Spellblade**.

### Chặng 2 · Cấp 10 – 24 — Lunaris City + Outskirts

- Về thành trình diện, làm chương II (NV 11–15).
- **Nhận phụ tuyến** ở Trinh Sát Wren và Trưởng Lão Rell — chúng dạy Thú Chiến (cấp 11),
  Thần Binh (12), Linh Thú (17), Lò Hỗn Loạn (19). Chỉ giữ được 3 cái cùng lúc.
- Cấp 14 mới qua được ải **Trại Gloam** trong Outskirts.
- **Cấp 15 là mốc lớn**: từ đây **Chúa Tể Vực Nứt** mới nứt ở bãi bạn đứng, và ô kỹ năng
  buff của bốn lớp mở ra.
- Cấp 20: mở được **Tầng Sâu** (giếng đá trong sân thành), và **Phó bản Petalshade**
  (cấp 12) / **Outskirts** (cấp 14) đã chạy được từ trước.

### Chặng 3 · Cấp 24 – 56 — Thornwood Reach → Hollow Roost

- Đây là lúc bãi săn bắt đầu là **vùng PK**. Cứ để nút PK **TẮT** thì không ai gây
  chuyện với bạn, và AUTO cũng không tự khơi PK.
- Cày chính tuyến chương III–IV, xen phó bản Thornwood (cấp 26) và Hollow Roost (cấp 46).
- Bắt đầu **săn Vệ Binh Trụ**: mỗi map có 3 con, hạ đủ 3 thì phong ấn quanh **Cổng Vực**
  tan và bạn đánh được Tướng Quân vùng. Tướng Quân cho **2 Mảnh Cổ Thần** + **1 Ấn Trấn Ải
  (1 lần/ngày)** + rơi 2–3 món phẩm cao — đây là nguồn đồ tốt ổn định nhất giai đoạn giữa.
- Ải cấp chặn: Cổng Rừng Gai cần **26**, Cửa Tổ Sâu cần **50**.

### Chặng 4 · Cấp 56 – 100 — Frostmire Vale → Ashen Steppe

- Quái bắt đầu có độc (Chimera Cầu Gai) và bắn xa (Cung Thủ Tro Tàn). Bật buff ô 3
  trước khi lao vào cụm.
- **Phó bản Frostmire (cấp 66) trở đi rơi Rương bậc III–IV** — đây là chỗ ăn đồ chính.
- Cấp 80 mở **Lò Bảo Chứng** luyện Linh Dực; cấp 40 đã mở Linh Dực cấp 1.
- Từ khoảng cấp 45, **Bảo Hạp IV trở lên bắt đầu ra Cổ Thần và Khắc Ấn** — từ đây sự
  kiện thế giới đáng bỏ dở việc đang làm để chạy tới.

### Chặng 5 · Cấp 100 – 120 — Stormgate Pass

- Free PK: PK thoải mái, không Tội Ác.
- Phó bản Stormgate (cấp 100) — Rương **bậc V**, bảng rơi tốt nhất game
  (60% ra phẩm Chí Tôn, 25% Hoàn Hảo).
- Chạy trọn **Tầng Sâu 20 tầng** để lấy Bảo Hạp VII.
- Hạ Chúa Tể Vực Nứt đủ 3 con mỗi lượt sự kiện.
- Cấp 120 → **Tẩy Tủy**: về cấp 1, giữ nguyên trang bị / Ascension / kỹ năng / danh hiệu,
  đổi lấy **+2% Công Kích & Sinh Lực vĩnh viễn**. Reset càng nhiều càng mạnh, và số cộng
  thêm đó **không bao giờ mất**.

---

## 4. Kiếm đồ tốt

Xếp theo hiệu suất, tốt nhất trước:

| Nguồn | Được gì | Chú ý |
|---|---|---|
| **Chúa Tể Vực Nứt** (0h·6h·12h·18h) | Bảo Hạp lớn + **2 Hỗn Độn Châu** + **60% món mang Khắc Ấn** | tối đa 3 con/lượt, mỗi map một con — phải chạy map |
| **Hung Thần Giáng Thế** (0h·4h·8h…) | Bảo Hạp + **45% món mang Khắc Ấn** | 1 con duy nhất, 30 phút |
| **Xâm Lăng Vàng** (2h·6h·10h…) | **9 Bảo Hạp chắc chắn** (mỗi quái vàng 1 cái) | chỉ 12 phút — đây là sự kiện gấp nhất |
| **Tướng Quân vùng** (Cổng Vực) | 2–3 món, 38% Linh · 52% Thần · 10% Chí Tôn | hồi sinh sau 60 giây |
| **Rương Boss Săn** (phó bản) | 1–3 món theo bậc Rương | phải hạ Boss Săn sau khi thông quan; AUTO bị khoá |
| **Vệ Binh Trụ** | 1–3 món: 28% Tinh · 52% Linh · 18% Thần · 2% Chí Tôn | 8 lần liên tiếp không ra phẩm Thần thì lần thứ 9 **bảo đảm ra Thần** |
| **Tinh anh** | 28–40% rơi 1 món, tối đa phẩm Thần | cũng là chỗ bắt Linh Thú |
| **Quái thường** | 7–12%, gần như chỉ phẩm Phàm/Tinh | dùng làm nguyên liệu Lò Hỗn Loạn |

**Ba mẹo cụ thể:**

1. **Đồ Hoàn Hảo CHỈ đến từ Bảo Hạp** — quái không rơi, kể cả boss. Muốn đồ Hoàn Hảo
   thì phải chờ sự kiện thế giới hoặc chạy Tầng Sâu / phó bản lấy hạp. Bảo Hạp VII cho
   **55% Hoàn Hảo**.
2. **Khắc Ấn quý hơn chỉ số.** Một món kém 10% chỉ số mà mang Khắc Ấn bạn chưa có thì
   vẫn nên mặc. Thẻ so sánh khi rê chuột nêu Khắc Ấn **trước** lực chiến vì lý do đó.
3. **Đừng vội bán.** Ba món **cùng phẩm** ném vào Lò Hỗn Loạn đổi được 1 món phẩm cao
   hơn. Đồ Phàm/Tinh dư chính là nguyên liệu, không phải rác.

---

## 5. Rèn sao cho an toàn

### Thứ tự nên đi

```
+0 → +6   : Rèn Thường. 100%, KHÔNG THỂ HỎNG. Cứ đập thẳng, đừng phí ngọc.
            (Ngọc Chúc Phúc ◎ cũng lên +1 an toàn tới +6 — để dành, đừng dùng ở đây.)
+6 → +9   : Rèn Thường 75% / 65% / 50%. Hỏng thì TỤT 1 CẤP, không vỡ.
            → Bật ☂ Thiên Mệnh Phù nếu không muốn tụt.
+9 → +11  : "Phá Thiên Kiếp", CHỈ tại Lò Rèn Hoàng Gia (Lunaris City).
            50% / 45%. Hỏng thì TRANG BỊ VỠ VỤN — mất vĩnh viễn.
            → BẮT BUỘC bật ☂ Thiên Mệnh Phù.
```

### Sáu luật thực dụng

1. **Trước +7, đừng bao giờ dùng Thiên Mệnh Phù.** Không có gì để hỏng.
2. **Ngọc Chúc Phúc ◎ để dành cho mức +4/+5/+6 của món ĐẮT** khi bạn hết Huyền Thiết —
   nó là +1 an toàn tuyệt đối, nhưng chỉ dùng được tới +5.
3. **Ngọc Linh Hồn ◉ chỉ 50% và hỏng thì tụt cấp.** Ngang Rèn Thường ở mức +9, nhưng
   tốn ngọc. Chỉ dùng khi cạn Huyền Thiết/Tu La.
4. **Mua Thiên Mệnh Phù trước, đừng mua giữa chừng.** 500◈/cái, mua thẳng trong màn Lò
   Hỗn Độn. Trước khi đánh +10 hãy có sẵn ít nhất 3–4 cái.
5. **Chỉ đưa lên +10/+11 món bạn sẽ dùng lâu dài** — nghĩa là món có Khắc Ấn phù hợp
   lớp, hoặc món Hoàn Hảo, hoặc món thuộc bộ Cổ Thần bạn đang gom. Rèn +11 một cái vũ
   khí phẩm Tinh là ném tiền qua cửa sổ.
6. **Rèn tới +10 mở thêm dòng Thức Tỉnh** (Bạo +5% / Né +5% / Công +25 / HP +200 /
   Hồi Qi +3 / Lực Lượng +8) — đây mới là phần thưởng thật của việc leo qua mốc +9.

### Lò Hỗn Loạn — nhớ kỹ một điều

**Cả 3 món tan biến NGAY khi bấm Kết Hợp**, thành hay bại cũng không lấy lại được.
Tỉ lệ 70% / 55% / 40% / **25%**. Bật Thiên Mệnh Phù thì lên **100%** — nên nếu bạn đang
nấu Thần → Chí Tôn (25%), **luôn luôn bật phù**, nếu không trung bình 4 lần mới ăn 1.

---

## 6. Phó bản nào, lúc nào

| Cấp bạn đang có | Nên chạy | Vì sao |
|---|---|---|
| 12 – 20 | Trial Chamber: Petalshade / Outskirts | học kết cấu 3 phòng, lấy Tiến Cấp Đan đầu tiên |
| 20+ | **Tầng Sâu** (giếng đá Lunaris City) | nguồn EXP và Bảo Hạp tốt nhất giai đoạn này |
| 26 – 45 | Trial Chamber: Thornwood | bắt đầu ra Tu La Tinh Thạch (rèn +7) |
| 46 – 65 | Trial Chamber: Hollow Roost | Rương bậc II, nhiều Huyền Thiết |
| 66 – 85 | Trial Chamber: Frostmire | **Rương bậc III** — mốc đồ tốt thật sự |
| 86 – 99 | Trial Chamber: Ashen Steppe | Rương bậc IV, ra Hỗn Nguyên Thạch (rèn +10/+11) |
| 100 – 120 | Trial Chamber: Stormgate | **Rương bậc V** — 60% Chí Tôn, 25% Hoàn Hảo |

**Cách chạy một lượt phó bản:**

1. Đi tới cổng dịch chuyển ở **rìa đông** bản đồ ngoài trời, bấm **G**.
2. Bạn vào **phòng 1**. Dọn sạch đợt quái → **cửa đá 1 mở** → tiến lên phía Bắc.
3. Phòng 2 → dọn sạch → cửa đá 2 mở → phòng 3 là **sảnh boss**.
4. Hạ boss → nhận thưởng thông quan (Tiến Cấp Đan, Huyền Thiết, Instinct, Anima, bạc).
5. Chờ 1,8 giây → **Boss Săn** xuất hiện. **AUTO tự tắt ở đây.** Hạ nó mới mở Rương.
6. Xong thì ra cổng **Xuất Môn** ở phía Nam.

**Đồng hồ chạy từ lúc vào** (8–12 phút tuỳ phó bản). Hết giờ là thất bại — mất cơ hội
Rương lần đó, nhưng thưởng đã nhận thì vẫn giữ.

---

## 7. Tầng Sâu — rút lúc nào?

Luật duy nhất cần nhớ: **phần thưởng chỉ vào túi khi bạn chủ động bấm Rút Lui. Chết là
mất sạch cả lượt.**

Kho tạm mỗi tầng (tầng `t`):

| Tầng | Bạc dồn thêm | EXP dồn thêm | Bảo Hạp |
|---|---|---|---|
| 3 | ~900 | ~1.570 | — |
| 5 | ~1.760 | ~3.230 | **Bảo Hạp I** |
| 10 | ~4.840 | ~9.520 | **Bảo Hạp II** |
| 15 | ~9.240 | ~18.870 | **Bảo Hạp III** |
| 20 | ~14.960 | ~31.280 | **Bảo Hạp IV** + thưởng trọn chuyến ×1,5 + **Bảo Hạp VII** |

Ba mốc quyết định:

- **Tầng 5 · 10 · 15 · 20 là tầng boss.** Nếu bạn vừa qua tầng boss mà máu chỉ còn dưới
  nửa và hết Hồ Lô Thuốc → **rút ngay**. Tầng kế tiếp quái dày máu thêm 28% nữa.
- Quái tầng sâu **không rơi gì cả** — bạc, EXP, đồ đều chảy vào kho tạm. Đừng trông vào
  đồ rơi để đánh giá tiến độ; nhìn dòng **Kho tạm** trên HUD.
- Nếu đã tới tầng 15+ thì cố xuống nốt 20: **thưởng ×1,5 và một Bảo Hạp VII** chỉ có ở
  đáy, và xuống tới đáy thì game **tự trao** kho tạm, không cần bấm Rút Lui.

Bấm **G** ở cổng khi đang trong Tầng Sâu cũng được tính là Rút Lui — game cố ý không để
bạn mất trắng vì bấm nhầm cổng quen tay.

---

## 8. Sự kiện thế giới — canh giờ

Bấm chip **⏱** trên HUD để xem Bảng Sự Kiện. Lịch tính theo **giờ máy của bạn**:

```
0h  : ☠ Hung Thần (30')      +  ✹ Vực Nứt (45')     ← hai sự kiện chồng nhau
2h  : ✦ Xâm Lăng Vàng (12')
4h  : ☠ Hung Thần (30')
6h  : ✦ Xâm Lăng Vàng (12')  +  ✹ Vực Nứt (45')     ← chồng
8h  : ☠ Hung Thần (30')
10h : ✦ Xâm Lăng Vàng (12')
12h : ☠ Hung Thần (30')      +  ✹ Vực Nứt (45')     ← chồng
14h : ✦ Xâm Lăng Vàng (12')
16h : ☠ Hung Thần (30')
18h : ✦ Xâm Lăng Vàng (12')  +  ✹ Vực Nứt (45')     ← chồng
20h : ☠ Hung Thần (30')
22h : ✦ Xâm Lăng Vàng (12')
```

**Thứ tự ưu tiên khi hai sự kiện chồng nhau:**
Xâm Lăng Vàng chỉ mở **12 phút** và cho **9 Bảo Hạp chắc chắn** → chạy nó trước.
Vực Nứt mở tận 45 phút, làm sau vẫn kịp.

**Chuẩn bị trước khi sự kiện bắt đầu** (game báo trước 10 phút, riêng Vực Nứt báo 15 phút):
đủ 5 Hồ Lô Thuốc, sửa/mặc đồ, đứng sẵn ở map sẽ diễn ra (Bảng Sự Kiện ghi rõ map).

**Vực Nứt có ba điều khác biệt:**
- Cần **cấp 15+** thì vực mới nứt trong bãi bạn đứng.
- Boss **luôn cao hơn bạn 6 cấp** — không phải bức tường vô lý, nhưng cũng không dễ.
- **Tối đa 3 con/lượt**, mỗi map chỉ nứt một lần. Muốn ăn đủ 3 Bảo Hạp thì hạ xong phải
  chạy sang map khác (bấm M → dịch chuyển).

---

## 9. Dùng AUTO cho đúng

Bấm **Z** hoặc nút ⚔ AUTO. AUTO sẽ:

- **Neo tại chỗ bạn bấm bật** và chỉ quét quái trong bán kính **430px** quanh điểm neo —
  ôm 1–2 bãi quái, không rượt khắp map.
- **Khoá vào đúng MỘT bãi**: mục tiêu đầu tiên tìm được thuộc bãi nào thì từ đó chỉ đánh
  bãi đó, bãi bên cạnh lọt vào bán kính cũng bỏ qua.
- Tự chạy tới, tự đánh thường, **tự tung cả 3 chiêu** khi hết hồi chiêu và đủ Qi.
- Với Sylvan Ranger / Dark Wizard, dừng ở **rìa tầm bắn** thay vì lao vào cận chiến.
- **Tự uống thuốc khi máu dưới 40%** (chỉnh được trong Cài Đặt).
- **Nới bán kính hút đồ lên gấp 3** (288px) — nếu không thì lớp tầm xa treo máy cả tiếng
  rồi bỏ lại nguyên bãi đồ dưới đất.
- Hết quái quanh neo thì **quay về điểm neo chờ hồi sinh**, không lang thang.

AUTO **KHÔNG** làm:

- Không tự khơi trận boss. Lại gần boss trong 300px là AUTO tạm dừng, lùi ra xa và vẫn
  tự uống thuốc — nhưng không đánh. (Bật được trong Cài Đặt nếu bạn cố ý muốn.)
- **Không bật được trong pha Boss Săn ở phó bản** — bấm Z cũng bị chặn, và nếu đang bật
  thì bị tắt liên tục suốt pha đó.
- Không tự khơi PK với Axie Lang Thang, kể cả khi nút PK đang bật.

**Hai cơ chế tự bảo vệ:**
- Hết thuốc và máu dưới 50% → cảnh báo mỗi 30 giây.
- Hết thuốc và máu dưới **20%** → **AUTO tự tắt hẳn** kèm banner to, để bạn không chết oan.

**Cách treo AUTO hiệu quả:** đứng giữa hai cụm quái đúng dải cấp, mua đủ 5 Hồ Lô Thuốc,
dọn túi cho trống ít nhất 10 ô rồi mới bấm Z. Túi đầy thì AUTO vẫn giết nhưng đồ nằm
lại dưới đất và biến mất sau 45 giây.

---

## 10. Những cái bẫy dễ mắc

| Bẫy | Chuyện gì xảy ra | Cách tránh |
|---|---|---|
| **Túi 30 ô đầy mà vẫn cày** | Đồ rơi nằm lại dưới đất với nhãn `⚠ TÚI ĐẦY` rồi **biến mất sau 45 giây** | Dọn túi trước mỗi lần treo AUTO. Bán đồ trắng/xanh hàng loạt ở Nhà Giả Kim |
| **Rèn +10 mà quên bật Thiên Mệnh Phù** | Trang bị **vỡ vụn, mất vĩnh viễn** ở tỉ lệ 50% | Nhìn dòng cảnh báo đỏ trong màn lò trước khi bấm Kết Hợp |
| **Ném đồ vào Lò Hỗn Loạn để "thử"** | Cả 3 món tan biến **ngay lúc bấm**, kể cả khi thất bại | Chỉ nấu khi có phù, hoặc chỉ nấu bằng đồ thừa thật sự |
| **Chết trong Tầng Sâu** | Mất **sạch** kho tạm cả lượt | Rút Lui ngay sau một tầng boss nếu máu/thuốc đã cạn |
| **Bán/tự-bán món có Khắc Ấn** | Xoá vĩnh viễn thứ hiếm nhất game vì vài đồng bạc | Game đã chặn ba lớp (auto-bán bỏ qua món có Khắc Ấn; bán tay phải bấm 2 lần xác nhận) — nhưng vẫn đừng bấm bừa |
| **Auto-mặc tháo mất Khắc Ấn** | Món mới hơn 5% chỉ số mà không có Khắc Ấn | Game đã chặn: nút "Mặc Đồ Tốt Nhất" xếp hạng theo Khắc Ấn **trước**, lực chiến sau |
| **Đánh boss cao hơn mình 10 cấp** | Sát thương của bạn ×**0,35**, boss đánh bạn ×1,6 | Xem cấp boss trên thanh máu. Chênh dưới 6 cấp mới đáng đánh |
| **Farm bãi quá thấp so với cấp** | Chênh trên 5 cấp thì EXP giảm 15%/cấp, sàn 10% | Bám đúng dải cấp ghi trong bảng bản đồ |
| **Quên tắt nút PK rồi đi cày** | Đánh nhầm Axie Lang Thang → Tội Ác, đỏ tên, tới 5 điểm thì hắc hoá | Vào vùng An Toàn là PK tự tắt; ở vùng PK thì cứ để tắt trừ khi cố ý |
| **Đứng chờ hết 5 giây chiêu "Vỡ Giáp"** | Ăn đòn **không né được**, càng còn nhiều Cầu Giáp càng đau | Phá cho hết 4 Cầu Giáp → boss **choáng 5 giây** + 6 giây cửa sổ phản công |
| **Chạy lung tung khi boss dùng "Tử Vực"** | **Cả sân chết** | Chỉ có **một vòng sáng** là an toàn, và nó nằm cách boss 260–460px — chạy ra xa khỏi boss, đừng nép sát |
| **Bấm V để xem chỉ số** | Thú Chiến bị gọi ra / thu về cùng lúc | Xem mục cảnh báo ở phần Điều khiển |
| **Bấm chuột trái để nhặt đồ mà cứ vung kiếm** | Bán kính bấm trúng món chỉ 26px | Dùng **phím J** (tầm 96px), hoặc giữ **ALT** để thấy nhãn rồi bấm chính xác |
| **Đi thẳng vào cây/đá** | Cây và đá **chặn thật** — nhân vật dừng lại | Cứ bấm chuột phải tới đích, hệ tự tính đường vòng |
| **Lỡ khung giờ sự kiện** | Không lưu state — đến trễ là hết | Chip ⏱ luôn đếm ngược. Đặt chuông theo lịch ở mục 8 |

---

## 11. Bảng tra nhanh

**Ba con số cần nhớ nhất**

| | |
|---|---|
| Rèn an toàn tuyệt đối tới | **+6** |
| Rèn vỡ đồ từ | **+10** (bắt buộc dùng ☂) |
| Túi đồ | **30 ô** — đầy là đồ nằm dưới đất 45 giây rồi mất |

**Bốn mốc cấp mở hệ thống**

| Cấp | Mở |
|---|---|
| 4 | Ám Khí + Tấn Chức (H) |
| 5 | Lò Hỗn Độn (F) |
| 6 | Thú Chiến |
| 10 | **Chọn lớp** · Cương Khí · Truy Nã Lệnh · Sảnh Cầu May · Lunaris City |
| 15 | Linh Thú (T) · ô buff · **Chúa Tể Vực Nứt** |
| 20 | **Tầng Sâu** |
| 30 | Cung Tiễn · Động Phủ |
| 40 / 80 | Linh Dực cấp 1 / cấp 2 |
| 120 | **Tẩy Tủy** |

**Vòng khắc hệ vũ khí** (chỉ tính lên quái)

```
Steel ◆ → Verdant ♣ → Stone ▲ → Frost ❄ → Ember ☼ → Steel
khắc được: +20% ST     ·     bị khắc: −12% ST
```
