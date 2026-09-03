# TỔNG QUAN GAME

> Đọc file này trước nếu bạn chưa từng chơi. Muốn biết bấm phím gì và làm gì trước
> thì sang [`HUONG_DAN_CHOI.md`](HUONG_DAN_CHOI.md).
>
> Mọi con số dưới đây lấy trực tiếp từ `public/game/game.js` (~17.300 dòng, toàn bộ
> game nằm trong một file, không có bước build).

---

## 1. Game này là gì

ARPG hành động nhìn từ trên xuống, chạy thẳng trên canvas HTML5 trong trình duyệt.
Một nhân vật, một màn hình, không có server — tiến trình lưu vào `localStorage`.

Phong cách lấy cảm hứng từ dòng MMORPG hành động cổ điển (MU Online là tựa tham chiếu
chính): giáp gothic, ngọc rèn, cường hoá +0…+11, boss thế giới theo giờ thật, PK ngoài
bãi săn. Bối cảnh thì là của riêng game: hai thế giới va vào nhau.

**Cốt truyện tóm tắt.** Phong ấn giam **Morvahn** ở lục địa **Vaeldra** vỡ. Thủ Hộ
Vaeldra không giữ nổi nên bẻ lệch vết nứt sang một thế giới bên cạnh mà hải đồ ghi là
"vô chủ" — hải đồ sai, đó là **Lunacia**. Nhân vật chính thuộc đội tiên phong vượt vết
nứt sang vá lại; cú vượt biên xoá sạch ký ức chiến đấu, nên bắt đầu game bạn là
**Unclassed** và chỉ tới cấp 10 mới nhớ ra mình thuộc lớp nào. Cú giật ngược kéo cả khu
phố **Ardhaven** sang, dân bản địa dựng lại quanh đó thành **Lunaris City** — thành phố
trung tâm của game.

Khí Morvahn chạm vào sinh vật Lunacia thì bẻ nó thành **Chimera** — đó là hầu hết quái
bạn gặp. **Năm Trụ Khoá** do Thủ Hộ Vaeldra đóng xuống để ghim miệng vết nứt đã bị
tướng quân của Morvahn chiếm cả năm. Gỡ trụ thì đi tiếp được, nhưng vết nứt toác thêm —
đó là bi kịch trung tâm và là lý do game kết mở.

**Quy mô.** Cấp tối đa **120**. 8 bản đồ ngoài trời/thành + 7 phó bản + chế độ Tầng Sâu
20 tầng. 35 nhiệm vụ chính tuyến chia 7 chương, 11 nhiệm vụ phụ. 5 lớp nhân vật.

**Ngôn ngữ.** Game mặc định chạy **tiếng Anh**; nút tròn ở giữa mép trên màn hình
(`🇻🇳 VI` / `🇬🇧 EN`) đổi ngôn ngữ và tải lại trang.

---

## 2. Vòng lặp cốt lõi

```
Nhận nhiệm vụ ở Lunaris City / bãi săn
        ↓
Đi bãi săn đúng dải cấp  →  giết quái  →  EXP · Lumen · Châu · đồ rơi xuống đất
        ↓                                             ↓
Lên cấp → cộng 5 điểm tiềm năng/cấp            Nhặt đồ → so sánh (rê chuột) → mặc
        ↓                                             ↓
Đủ cấp → mở bãi mới, phó bản mới        Đồ dư → Lò Hỗn Độn: rèn +N, khảm ngọc, kế thừa
        ↓                                             ↓
Hạ 3 Vệ Binh Trụ → mở Cổng Vực → hạ Tướng Quân vùng → Tịch Ma Thạch, Shard
        ↓
Sự kiện thế giới theo giờ thật → Box Kundun → trang bị Hoàn Hảo · Thức Tỉnh
        ↓
Cấp 120 → Tẩy Tủy (reset) → +2% Công & Sinh Lực vĩnh viễn, chơi lại từ cấp 1
```

Ba trục tiến bộ chạy song song và không thay thế nhau:

| Trục | Đo bằng | Nguồn |
|---|---|---|
| **Cấp** | 1 → 120, mỗi cấp +5 điểm tiềm năng | EXP từ quái, nhiệm vụ, phó bản |
| **Trang bị** | phẩm × giai × mức rèn (+0…+11) | đồ rơi, Box Kundun, Lò Hỗn Độn |
| **Hệ dài hạn** | Ascension, Chimera, Kỹ năng, Đại Thành | vật liệu riêng từng hệ |

---

## 3. Năm lớp nhân vật

Cấp 1–9 ai cũng là **Unclassed** (chưa mang huy hiệu). Đạt cấp 10 và hoàn thành nhiệm
vụ chính "The Calling" thì chọn lớp — chọn xong là cố định.

| Lớp | Vai trò | Hệ | Tầm đòn thường | HP | Phòng | Sát thương | Điểm quy ra Công Kích |
|---|---|---|---|---|---|---|---|
| **Dark Knight** | Chịu đòn / combo cận chiến | Steel | 90 | ×1,18 | ×1,20 | ×0,95 | Lực Lượng ×2,0 |
| **Sylvan Ranger** | Tầm xa / hỗ trợ | Frost | **380** | ×0,90 | ×0,85 | ×1,05 | Mẫn Tiệp ×2,0 |
| **Dark Wizard** | Pháp thuật / độc tố | Frost | **420** | ×0,72 | ×0,65 | **×1,30** | Linh Lực ×1,6 + Mẫn Tiệp ×0,6 |
| **Spellblade** | Lai, bộc phát Hoả | Ember | 90 | ×1,05 | ×1,00 | ×1,08 | Lực Lượng ×1,1 + Linh Lực ×1,1 |
| **Dark Lord** | Chỉ huy / triệu hồi | Stone | 90 | ×1,12 | ×1,10 | ×0,92 | Lực Lượng ×1,8 + Mẫn Tiệp ×0,3 |

Sylvan Ranger và Dark Wizard bắn đạn ở **đòn thường**, ba lớp còn lại vung cận chiến.
Dark Wizard là lớp giòn nhất và mạnh nhất — đúng mẫu glass cannon.

**Thanh kỹ năng cố định 3 ô**, không cho tự gán:

| Ô | Dark Knight | Sylvan Ranger | Dark Wizard | Spellblade | Dark Lord |
|---|---|---|---|---|---|
| **1** chiêu chính | Twisting Slash (quạt, ×1,6) | Multi-Shot (5 mũi, ×1,5) | Poison (đạn, ×1,5) | Fire Slash (quạt, ×1,6) | Force Wave (quạt, ×1,5) |
| **2** Trấn Phái | Death Stab ×3,0 | Ice Arrow ×2,8 | Meteor ×3,2 | Flame Strike ×3,2 | Fire Scream ×3,0 |
| **3** buff riêng | Cương Khí Hộ Thể (−30% ST nhận, 6s) | Greater Damage (+35% ST, 6s) | Soul Barrier (khiên 45% HP, 6s) | Battle Fury (+30% ST, 6s) | Command Aura (+25% ST, 6s) |

- Chiêu chính: hồi 4s, tốn 20 Qi (Spellblade 22).
- Trấn Phái: hồi **10s**, tốn **50 Qi**, bán kính **185**.
- Ô buff mở ở cấp 15 với bốn lớp; riêng Dark Knight cần Tấn Chức Cương Khí tầng 1 (từ cấp 10).

Năm chỉ số tiềm năng: **Lực Lượng · Mẫn Tiệp · Phòng Ngự · Sinh Lực · Linh Lực**.
Mỗi cấp được 5 điểm. Cột cuối bảng trên cho biết lớp của bạn nên dồn vào đâu — trong
cửa sổ Nhân Vật (phím V) chỉ số nào quy ra Công Kích được đánh dấu ★.

---

## 4. Bản đồ và dải cấp

| Bản đồ | Dải cấp | Loại vùng | Điều kiện vào |
|---|---|---|---|
| **Petalshade Isle** | 1 – 12 | An Toàn | — (bãi khởi đầu) |
| **Lunaris City** | hub | An Toàn tuyệt đối | xong chương I (NV 10) |
| **Petalshade Outskirts** | 14 – 24 | An Toàn | cấp 10 + xong NV 10 |
| **Thornwood Reach** | 24 – 38 | **PK** | cấp 20 + xong NV 15 |
| **Hollow Roost** | 42 – 56 | **PK** | cấp 40 + xong NV 19 |
| **Frostmire Vale** | 62 – 78 | **PK** | cấp 60 + xong NV 23 |
| **Ashen Steppe** | 84 – 100 | **PK** | cấp 80 + xong NV 27 |
| **Stormgate Pass** | 102 – 120 | **Free PK** | cấp 100 + xong NV 31 |

Ba loại vùng:

- **An Toàn** — không PK được. Giao dịch, nhận nhiệm vụ, ngồi thiền.
- **PK** — bật PK cướp bãi được, nhưng giết Axie Lang Thang thì bị **Tội Ác** (đỏ tên).
- **Free PK** — PK thoải mái, không tính Tội Ác.

**Lunaris City** là thành duy nhất: quảng trường vuông, tường bao bốn mặt, mỗi mặt một
cổng toả ra bốn hướng thế giới (Nam → Outskirts, Bắc → Frostmire, Tây → Petalshade Isle,
Đông → Thornwood). Trong sân thành có Thợ Rèn, Nhà Giả Kim, Vũ Khí Phường, Trà Quán,
Quản Gia Động Phủ, Bổ Đầu (Truy Nã Lệnh), Thương Nhân Vận May, và **giếng đá xuống Tầng Sâu**.

**Ải cấp trong lòng map.** Mỗi bản đồ có một cửa hẹp chặn bằng cấp, đứng gần là bị đẩy ra:

| Ải | Bản đồ | Cần cấp |
|---|---|---|
| Trại Gloam | Outskirts | 14 |
| Cổng Rừng Gai | Thornwood | 26 |
| Cửa Tổ Sâu | Hollow Roost | 50 |
| Cổng Đầm Sương | Frostmire | 68 |
| Vòng Vây Tro Tàn | Ashen Steppe | 88 |
| Cổng Bão Tố | Stormgate | 104 |

**Cây và đá CHẶN đường thật.** Địa hình không còn là hình trang trí: hồ, gờ đá, rễ cây,
tường thành đều có va chạm. Click-to-move tự né vòng, nhưng đường đi có thể dài hơn
đường thẳng — và đó là chủ ý.

---

## 5. Kẻ địch và boss

**Bốn hạng địch** trên bãi săn:

| Hạng | Đặc điểm | Tỉ lệ rơi trang bị |
|---|---|---|
| Quái thường | đứng thành cụm 5–7 con, đánh một con cả cụm lao vào | 7% → 12% (theo dải cấp) |
| Tinh anh | máu dày, có khiên, đơn lẻ | 28% → 40% |
| **Vệ Binh Trụ** (3 con/map) | boss vùng, moveset có báo trước | 100%, rơi 1–3 món |
| **Tướng Quân** (Cổng Vực, 1 con/map) | máu ×1,7, công ×1,15, EXP ×3 | 100%, rơi 2–3 món |

**Cổng Vực bị phong ấn** tới khi hạ đủ **3 Vệ Binh Trụ** của map đó — đứng trong 340px
quanh Tướng Quân khi chưa đủ điều kiện thì bị hất ra kèm cảnh báo.

**Moveset boss — 7 chiêu, mỗi chiêu có vùng đỏ báo trước rồi để lộ 2,5 giây cửa sổ phản công**
(đánh trong cửa sổ đó được **+15% sát thương**):

| Chiêu | Báo trước | Cách xử lý |
|---|---|---|
| Trảm Kích | 1,4s | quạt trước mặt bán kính 150 — vòng ra sau lưng |
| Bộc Phát | 1,6s | nổ vòng quanh boss bán kính 175 — chạy ra |
| Xung Phong | 1,2s | lao thẳng tới chỗ bạn đang đứng — đổi chỗ |
| Triệu Hồi | 1,0s | gọi 2 tuỳ tùng |
| Cuồng Hoá | 1,0s | chỉ khi boss dưới 50% máu — công ×1,3 trong 8s |
| **Vỡ Giáp** ("Niệm Chú Huỷ Diệt") | **5,0s** | boss thả **4 Cầu Giáp** đứng yên quanh mình. Phá hết trước khi niệm xong ⇒ chú vỡ, boss **choáng 5s** + cửa sổ phản công 6s. Phá không kịp ⇒ ăn đòn **không né được**, càng còn nhiều cầu càng đau |
| **Đảo Vùng An Toàn** ("Tử Vực") | **3,4s** | **cả sân chết**, chỉ một vòng sáng bán kính 200 là sống — và vòng đó đặt cách boss 260–460px, tức là phải rời khỏi boss |

Hai chiêu cuối là hai chiêu duy nhất hỏi bạn một câu khác "đừng đứng đó". Chúng chỉ
xuất hiện ở **boss phó bản**:

| Boss phó bản | Cấp | Máu | Có Vỡ Giáp | Có Đảo Vùng |
|---|---|---|---|---|
| Thủ Lĩnh Đoàn Gloam | 16 | 3.500 | | ✔ |
| Thủ Lĩnh Sói Hoang | 22 | 6.000 | ✔ | |
| Đại Tướng Phản Loạn | 34 | 11.000 | | ✔ |
| Chúa Tể Hầm Mộ | 52 | 22.000 | ✔ | |
| Xoáy Lá Nguyền | 72 | 40.000 | ✔ | ✔ |
| Chúa Sói Thảo Nguyên | 92 | 68.000 | ✔ | |
| Thống Soái Thiên Giáp | 108 | 100.000 | ✔ | ✔ |

**Áp Bức Võ Công.** Boss cao hơn bạn nhiều cấp thì sát thương bạn gây ra bị áp chế:
hơn 1–5 cấp → ×0,85; hơn 6–10 cấp → ×0,6; hơn 10 cấp → **×0,35**. Chiều ngược lại boss
đánh bạn mạnh hơn ×1,3 / ×1,6. Nói cách khác: đừng đánh boss quá tầm.

---

## 6. Trang bị

**11 ô**: Vũ Khí · Nón · Áo · Tay · Quần · Chân · Dây Chuyền · Nhẫn 1 · Nhẫn 2 ·
Áo Choàng · Cánh.

**Túi đồ là một LƯỚI 8 cột × 8 hàng = 64 ô**, đúng kiểu MU: mỗi món chiếm một khối ô theo hình
dáng của nó, chứ không phải "một món một ô".

| Món | Ô | Món | Ô |
|---|---|---|---|
| Nhẫn | 1×1 | Áo Choàng | 2×3 |
| Dây Chuyền | 1×2 | **Cánh** | **2×5 = 10** |
| Nón · Áo · Tay · Quần · Chân | 2×2 | Vũ Khí | 1×2 → 2×4 tuỳ loại |

Kéo món để dời chỗ, bấm **🧩 Xếp Gọn** để dồn lại. Nới thêm tối đa **+4 hàng** (32 ô) ở Quầy
Shard. Hệ quả cố ý: 64 ô chỉ nhét vừa **4 đôi cánh**, không phải 6 — cánh cao 5 hàng nên ba hàng
cuối thừa ra không đủ chỗ. "Hết chỗ" nay là một bài toán xếp hình, không phải một con số đếm.

Một món đồ có bốn trục độc lập:

| Trục | Thang | Ý nghĩa |
|---|---|---|
| **Phẩm** | Phàm → Tinh → Linh → Thần → Chí Tôn | nhân chỉ số gốc ×1,0 / 1,3 / 1,65 / 2,1 / **2,7** và mở 0/1/2/3/4 dòng phụ |
| **Giai** | 1 → 10 (Tân Binh → Tối Thượng) | "thời đại" của món, theo cấp nơi nó rơi ra |
| **Rèn** | +0 → +11 | xem mục Lò Hỗn Độn |
| **Hoàn Hảo** | có / không | mở thêm 1–3 **dòng riêng** mà đồ thường không bao giờ có |

**Dòng Hoàn Hảo** là bộ dòng riêng, không phải "dòng cũ roll max". Vũ khí: hạ địch hồi
Mana · hạ địch hồi Sinh Lực · tỉ lệ ST Hoàn Hảo · thêm sát thương · ST theo cấp · tốc đánh.
Giáp: đồng rơi thêm · tỉ lệ đỡ đòn · phản sát thương · giảm sát thương · Mana tối đa ·
Sinh Lực tối đa. Hệ quả cố ý: **một món Hoàn Hảo phẩm thấp có thể đáng mặc hơn một món
Thần thường.**

**Thức Tỉnh** — món rèn tới **+10** trở lên được thêm một dòng cộng thẳng (Bạo Kích +5%,
Né +5%, Công +25, HP +200, Hồi Mana +3, hoặc Lực Lượng +8).

> **Cổ Thần Thủ Hộ và Khắc Ấn đã GỠ.** Cả hai là trục sức mạnh chạy song song với trang bị
> (bộ đồ ẩn cộng chỉ số ở mốc 2/3/5 món; 12 con dấu đổi cách chiêu chạy). Dự án kéo về đúng mô
> hình MU — sức mạnh đến từ **cấp** và **trang bị**, không phải từ năm sáu trục cày song song.
> Món đồ đang mang chúng vẫn giữ nguyên mọi chỉ số của chính nó khi nạp save cũ; xem khối
> HOÀN LẠI trong `loadGame()`.

### 6.3 Đồ rơi XUỐNG ĐẤT

Quái chết thì đồ và Châu **rơi thành vật thể dưới đất**, không rơi thẳng vào túi:

- Món nảy theo vòng cung ra khỏi xác rồi đáp xuống, có tấm nền tối bo góc + viền màu phẩm
  và nhãn tên nổi màu theo phẩm.
- **Nằm 45 giây**, nhấp nháy cảnh báo trong 10 giây cuối rồi biến mất.
- **Bốn cách nhặt**: đi ngang qua trong 46px · bấm phím **J** (tầm với 96px) ·
  **bấm chuột trúng món** · giữ **ALT** để hiện nhãn tên **mọi** món trên màn hình rồi chọn.
- Bật **AUTO** thì bán kính đi-ngang-qua nới lên gấp 3 (288px) — lớp tầm xa giết quái cách
  200px vẫn hút được đồ.
- **Túi đầy thì đồ NẰM LẠI dưới đất** và đổi nhãn `⚠ TÚI ĐẦY`, không mất trắng.
  Dọn túi rồi quay lại nhặt vẫn kịp.
- Rơi đồ phẩm Linh trở lên thì có tiếng riêng + vòng sáng; phẩm Thần/Chí Tôn thì rung
  màn hình và hiện banner giữa màn hình.

Vật liệu vụn (Lumen, Tu La, Đá Thăng Cấp…) vẫn cộng thẳng và chỉ ghi vào nhật ký
chiến đấu — chữ bay giữa màn hình để dành cho đồ và Châu.

### 6.4 Thẻ vật phẩm khi rê chuột

Rê chuột lên bất kỳ ô đồ nào (túi hoặc ô đang mặc) thì sau 90ms hiện **thẻ thông tin
ngay cạnh con trỏ**, kèm **thẻ món đang mặc cùng ô đặt sát bên để so**. Chênh lệch từng
dòng in ngay sau con số (`+4`, `−2%`). Thẻ này cũng nêu rõ:

- Chênh lệch **lực chiến** và từng dòng chỉ số, kèm dấu ▲/▼ cho biết nên đổi hay không.

Trên điện thoại (không có con trỏ) thẻ này tắt; xem chi tiết bằng nút `⋯` ở góc ô.

---

## 7. Lò Hỗn Độn — một cỗ máy duy nhất

Mở bằng phím **F**. Cách dùng: **bỏ đồ và ngọc vào KHAY → máy tự liệt kê những công thức
mà khay đó thoả → chọn → bấm KẾT HỢP.** Không có màn rèn thứ hai nào khác.

**11 công thức**, chia ba nhóm:

| Nhóm | Công thức | Khay cần | Ghi chú |
|---|---|---|---|
| Rèn | Rèn Thường | 1 trang bị +0…+9 | |
| Rèn | **Phá Thiên Kiếp** | 1 trang bị +9/+10 · ngọc | chỉ tại Lò Rèn Hoàng Gia |
| Ngọc | Ngọc Chúc Phúc ◎ | 1 trang bị +0…+5 · 1 viên | **100%, không thất bại** |
| Ngọc | Ngọc Linh Hồn ◉ | 1 trang bị dưới +11 · 1 viên | 50%, hỏng thì **tụt 1 cấp** |
| Ngọc | Ngọc Sinh Mệnh ❤ | 1 giáp trụ · 1 viên | hỏng thì dòng Sinh Mệnh về 0 |
| Ngọc | Đổi Hệ ● | 1 vũ khí · 1 Hỗn Độn Châu | hệ mới ngẫu nhiên, chắc chắn khác hệ cũ |
| Chế | Kế Thừa | 1 trang bị dưới giai X | leo giai, giữ trọn mọi dòng, chỉ số gốc còn 90% |
| Chế | Luyện Áo Choàng | khay trống | 2 cấp |
| Chế | Luyện Linh Dực | 1 trang bị Hoàn Hảo +4 (hiến tế) · ● 1 | Lò Rèn Hoàng Gia |
| Chế | Thăng Linh Dực 2 | 1 Linh Dực cấp 1 · ● 1 | Lò Rèn Hoàng Gia |
| Chế | **Lò Hỗn Loạn** | 3 trang bị **cùng phẩm** | 3 món tan biến ngay khi ném vào |

### Ép ngọc thẳng vào đồ — không cần tới lò

Trong MU, Ngọc Chúc Phúc và Ngọc Linh Hồn dùng được **ở bất cứ đâu**: bấm viên ngọc trong túi
rồi bấm món đồ. Ở đây cũng vậy — mở Túi Đồ, bấm viên ngọc trên giá, món nào ép được sẽ **sáng
viền vàng**, bấm vào là xong. Kéo–thả viên ngọc lên món cũng được.

| Viên | Tới mức | Tỉ lệ | Hỏng thì sao |
|---|---|---|---|
| ◎ Chúc Phúc Châu | **+6** | 100% | không bao giờ hỏng |
| ◉ Linh Hồn Châu | **+9** | 50% | **tụt 1 cấp** |
| Phá Thiên Kiếp (Lò Rèn Hoàng Gia) | **+11** | 50% / 45% | **VỠ VỤN** — ☂ Thiên Mệnh Phù giữ được |

Đó là đúng bậc thang của MU: ngọc lo từ +1 tới +9, còn +10 và +11 là việc của cỗ máy trong thành.
Lò Hỗn Độn vẫn làm được cả hai loại ngọc (ở đó thấy rõ tỉ lệ và phí), chỉ là không bắt buộc nữa.

### Bảng tỉ lệ rèn (Rèn Thường + Phá Thiên Kiếp)

| Mức đích | Tỉ lệ | Nguyên liệu | Hỏng thì sao |
|---|---|---|---|
| +1 … +6 | **100%** | 150–300 Lumen | không thể hỏng |
| +7 | 75% | 150 Lumen + 1 Tu La | **tụt 1 cấp** |
| +8 | 65% | 150 Lumen + 1 Tu La | **tụt 1 cấp** |
| +9 | 50% | 150 Lumen + 1 Tu La | **tụt 1 cấp** |
| **+10** | **50%** | 300 Lumen + 3 Tu La + 1 Hỗn Nguyên + ngọc | **VỠ VỤN — mất vĩnh viễn** |
| **+11** | **45%** | 450 Lumen + 5 Tu La + 2 Hỗn Nguyên + ngọc | **VỠ VỤN — mất vĩnh viễn** |

**Thiên Mệnh Phù ☂** (mua 500◈ thẳng trong lò) bảo hộ: thất bại vẫn giữ nguyên mức rèn.
Chỉ dùng được cho công thức có rủi ro. Danh hiệu "Thợ Rèn Truyền Thuyết" cộng thêm +5%
tỉ lệ rèn vĩnh viễn.

### Lò Hỗn Loạn — 3 món cùng phẩm đổi 1 món phẩm cao hơn

| Phẩm gốc | Tỉ lệ | Hỗn Nguyên | Lumen |
|---|---|---|---|
| Phàm → Tinh | 70% | 2 | 300◈ |
| Tinh → Linh | 55% | 4 | 800◈ |
| Linh → Thần | 40% | 7 | 2.000◈ |
| Thần → Chí Tôn | **25%** | 12 | 5.000◈ |

**Cả 3 món tan biến ngay khi ném vào lò** — thành hay bại cũng không lấy lại được.
Thiên Mệnh Phù ở đây kéo tỉ lệ lên **100%**.

### Bốn loại Châu

| Châu | Ký hiệu | Dùng làm gì |
|---|---|---|
| Chúc Phúc | ◎ | +1 mức rèn, an toàn tuyệt đối (chỉ tới +6) |
| Linh Hồn | ◉ | +1 mức rèn, 50%, hỏng tụt 1 cấp (tới +11) |
| Sinh Mệnh | ❤ | khảm dòng Sinh Mệnh lên giáp trụ |
| Hỗn Độn | ● | nguyên liệu công thức cao (Đổi Hệ, Linh Dực, Phá Thiên Kiếp) |

Châu rơi từ **mọi loại quái** — quái thường 0,10–0,9%/viên, tinh anh 0,8–4,5%, Vệ Binh
Trụ 3–20%, Tướng Quân 12–100%; nhân thêm ×1,0 → ×1,8 theo dải cấp map.

---

## 8. Box Kundun

Rương phần thưởng 7 bậc, chỉ đến từ sự kiện thế giới, phó bản và Tầng Sâu. Mở trong
Túi Đồ (phím I hoặc B).

| Bậc | Khoảng cấp đồ | Hoàn Hảo |
|---|---|---|
| I | 1 – 14 | — |
| II | 15 – 29 | 6% |
| III | 30 – 44 | 12% |
| IV | 45 – 59 | 20% |
| V | 60 – 74 | 30% |
| VI | 75 – 89 | 40% |
| VII | 90+ | **55%** |

Mỗi hạp cho: 1 trang bị + có thể 1 viên Châu + Lumen (150 + 120×bậc,
cộng thêm 40×bậc từ phần Anima cũ quy đổi). Bậc hạp nhận từ boss thế giới tính theo **cấp người chơi**, không theo
map — nên tạt qua bãi thấp không bị thưởng đồ vô dụng.

---

## 9. Phó bản

Mỗi bản đồ ngoài trời có một phó bản riêng, vào qua **cổng dịch chuyển ở rìa đông map**
(đứng gần, bấm **G**).

### Kết cấu: ba phòng nối bằng cửa đá

Không còn là một sảnh trống. Phó bản là **3 phòng nối tiếp theo trục Bắc–Nam**, ngăn
bằng hai bức tường đá có khe cửa ở giữa:

```
        ┌──────────── PHÒNG 3 — sảnh boss ────────────┐
        │                                             │
        ╞═════ cửa đá 2 (mở khi dọn sạch phòng 2) ═════╡
        │              PHÒNG 2 — đợt 2/3              │
        ╞═════ cửa đá 1 (mở khi dọn sạch phòng 1) ═════╡
        │        PHÒNG 1 — ngay cửa vào, đợt 1        │
        └──────────────── ▲ cửa vào ──────────────────┘
```

Cửa đóng thì **chặn thật** — không đi xuyên tường được. Dọn sạch phòng thì cửa mở kèm
banner "⛨ CỬA ĐÁ MỞ".

Sau 3 đợt quái là **Boss phó bản**. Hạ boss xong nhận thưởng thông quan, rồi **Boss Săn**
xuất hiện thêm (không bắt buộc) — hạ nó mới mở **Rương** chứa 1–3 trang bị theo bảng
riêng, cộng Lumen và Đá Thăng Cấp. **AUTO bị khoá suốt pha Boss Săn** — phải tự tay đánh.

| Phó bản | Cấp vào | Giới hạn giờ | Bậc Rương | Thưởng thông quan (Lumen) |
|---|---|---|---|---|
| Trial Chamber: Petalshade | 12 | 8:00 | I | 850 – 1.450 |
| Trial Chamber: Outskirts | 14 | 8:00 | I | 1.070 – 1.680 |
| Trial Chamber: Thornwood | 26 | 9:00 | II | 1.600 – 2.450 |
| Trial Chamber: Hollow Roost | 46 | 9:00 | II | 2.400 – 3.400 |
| Trial Chamber: Frostmire | 66 | 10:00 | III | 3.350 – 4.700 |
| Trial Chamber: Ashen Steppe | 86 | 11:00 | IV | 4.600 – 6.500 |
| Trial Chamber: Stormgate | 100 | 12:00 | V | 6.000 – 8.400 |

Hết giờ trước khi xong là **thất bại** — mất cơ hội mở Rương lần đó, nhưng không mất
phần thưởng đã nhận. Ra cổng Xuất Môn để chạy lại từ đầu.

---

## 10. Tầng Sâu — vòng lặp tham lam / rút lui

Lối vào: **giếng đá trong sân Lunaris City** (góc tây-bắc quảng trường, cách Thợ Rèn
khoảng 800px). Cần **cấp 20**.

Đây là chế độ duy nhất trong game bắt bạn **tự quyết định khi nào dừng**:

- **20 tầng**, mỗi tầng phải dọn sạch quái mới xuống được tầng kế.
- Quái mỗi tầng dày máu thêm **×(1 + tầng×0,28)** và mạnh thêm ×(1 + tầng×0,16).
  Số quái = min(14, 4 + tầng×0,7).
- **Tầng 5 · 10 · 15 · 20 là tầng boss** — một con boss máu ×(1 + tầng×0,22), không phải bầy quái.
- Mỗi tầng dọn xong, phần thưởng vào **KHO TẠM**, chưa phải của bạn:
  Lumen ≈ 220×t×(1+0,12t) + 240×t (phần Anima cũ) + 150×(1+t/2) (phần Huyền Thiết cũ) ·
  EXP ≈ 340×t×(1+0,18t) · Đá Thăng Cấp mỗi 3 tầng · **1 Box Kundun mỗi 5 tầng** (bậc = t/5).
- **Phần thưởng chỉ vào túi khi bạn CHỦ ĐỘNG bấm Rút Lui** (hoặc bấm G ở cổng — game
  hiểu đó là rút lui, không để bạn mất trắng vì bấm nhầm).
- **Chết là mất SẠCH kho tạm cả lượt.**
- Xuống hết 20 tầng thì kho tạm được nhân **×1,5** và tặng thêm một **Box Kundun VII**,
  cộng **10 ♦ Shard**, rồi tự động trao — không bắt bấm Rút Lui lần nữa.

HUD giữa màn hình luôn hiện kho tạm đang tích để bạn thấy mình đang đặt cược bao nhiêu.

---

## 11. Sự kiện thế giới — neo theo GIỜ THẬT

Ba sự kiện, tính theo đồng hồ máy bạn. Không lưu vào save: đến trễ là lỡ chuyến.
Chip đồng hồ trên HUD hiện giờ thật + đếm ngược sự kiện gần nhất; bấm vào mở **Bảng Sự Kiện**.

| Sự kiện | Mốc giờ | Cửa mở | Báo trước | Diễn ra ở đâu |
|---|---|---|---|---|
| ☠ **Hung Thần Giáng Thế** | 0h · 4h · 8h · 12h · 16h · 20h | 30 phút | 10 phút | 1 map, xoay vòng Hạ Giới / Thượng Giới |
| ✦ **Xâm Lăng Vàng** | 2h · 6h · 10h · 14h · 18h · 22h | 12 phút | 10 phút | 1 map thường, xoay vòng 7 map |
| ✹ **Chúa Tể Vực Nứt** | 0h · 6h · 12h · 18h | **45 phút** | **15 phút** | **MỌI bãi săn cùng lúc** |

Nghĩa là **cứ 2 tiếng thật lại có ít nhất một sự kiện**, và bốn lần trong ngày có hai
sự kiện chồng nhau.

### ☠ Hung Thần Giáng Thế
Một con boss đơn (`Hung Thần · Hỗn Độn`) xuất hiện giữa map được chọn, cấp = cấp tối
thiểu của map + 12 (trần 110). Hạ nó nhận **1 Box Kundun** bậc tính theo cấp bạn.

### ✹ Xâm Lăng Vàng
Một **đàn quái dát vàng** tràn vào 1 map thường trong 12 phút: 8 quái vàng + 1
**Chúa Đàn Vàng** đứng giữa map. Quái vàng có máu ×6 (chúa đàn ×14), công ×1,4 (×1,7),
EXP ×3, Lumen ×3, và **mỗi con CHẮC CHẮN rơi 1 Box Kundun** theo bậc map:

| Map | Bậc hạp rơi ra |
|---|---|
| Petalshade Isle | I |
| Outskirts · Thornwood | II |
| Hollow Roost | III |
| Frostmire · Ashen Steppe | IV |
| Stormgate Pass | V |

Chúa Đàn Vàng rơi hạp cao hơn 1 bậc. Quét sạch cả đàn thì sự kiện kết thúc sớm; hết
12 phút thì số còn lại tẩu thoát mang theo hạp.

### ✹ Chúa Tể Vực Nứt — boss thế giới lớn nhất
Khác hẳn hai sự kiện trên ở chỗ nó **không chọn một map**: cửa vực mở thì **mọi bãi săn
đều nứt**, ai cấp nào cũng có phần.

- **Cần cấp 15 trở lên** thì vực mới nứt trong bãi bạn đang đứng.
- Boss **luôn trên tầm bạn 6 cấp** (`max(map.min + 10, cấp bạn + 6)`, trần 120),
  máu `9.000 + cấp²×11`. Không phải bức tường vô lý khi bạn tạt qua bãi thấp.
- **Tối đa 3 con mỗi lượt** — mỗi map chỉ nứt một lần, muốn hạ đủ 3 thì phải chạy map khác.
- Hạ mỗi con: **1 Box Kundun** (bậc = cấp/15 + 2) + **2 Hỗn Độn Châu**.
- Hạ đủ 3 con thì cửa vực khép sớm.

---

## 12. PK và Tội Ác

- Nút **PK** trên HUD chỉ hiện ở vùng PK / Free PK; vào vùng An Toàn là tự tắt.
- **Axie Lang Thang** là "người chơi" NPC trung lập rải ở các map PK (3 cấp: 30 · 60 · 115).
  Chúng không chủ động tấn công.
- Giết một con ở vùng **PK** → **+1 Tội Ác**, tên đỏ lên. Ở vùng **Free PK** thì không.
- Tội Ác giảm 1 điểm mỗi **300 giây**; ngồi thiền ở suối Tịnh Tâm gột sạch ngay.
- **Tội Ác ≥ 5 → hắc hoá**. Về 0 thì trở lại bình thường.
- Axie Lang Thang **ghi thù**: giết cùng loại 2 lần trở lên thì lần sau gặp nó chủ động
  truy thù bạn. Hạ được kẻ truy thù thì thưởng thêm 120◈ Lumen.
- **AUTO không bao giờ tự khơi PK**, kể cả khi bạn quên bật nút PK — nó chỉ tự vệ nếu
  bị Axie Lang Thang truy thù trước.

---

## 13. Đồng hành: Chimera · Cánh · Áo Choàng

| Hệ | Mở ở cấp | Có bằng cách nào | Cho gì |
|---|---|---|---|
| **Chimera** (Nhân Vật → Chimera) | 6 | quay Khế Ước bằng **Ấn Giao Kết** / **Ấn Cổ Xưa** | đồng hành xuất trận đánh cùng, Cốt cộng chỉ số |
| **Cánh** | 40 / 80 / 100 | luyện và thăng bậc tại **Lò Rèn Hoàng Gia** | xem bảng dưới |
| **Áo Choàng** | — | luyện tại Lò Hỗn Độn, 2 cấp | +% Công, xuyên giáp |

### Ba bậc Cánh — mỗi lớp một đôi riêng, khoá theo lớp

Đúng như MU: cánh không phải món nhặt chung, nó là **cột mốc bản sắc của lớp**. Đôi của lớp khác
mặc không được, và game nói thẳng vì sao.

Kích thước dưới đây tính bằng **pixel của bộ xương nhân vật** (bộ xương cao 220, đỉnh đầu ở
`y=53`, khớp vai `y=100`, gốc cánh cắm ở `y=104`) — không phải pixel trên màn hình.

| Bậc | Cổng cấp | Vươn ngang | Vươn lên | Số thùy | Dòng chính | Chế ở đâu |
|---|---|---|---|---|---|---|
| 1 · **Cánh …** | 40 | 56 px | 62 px | 2 | 12 | 1 trang bị Hoàn Hảo +4 (hiến tế) + ● 1 |
| 2 · **… Dực** | 80 | 84 px | 78 px | 3 | 24 | thăng tại chỗ từ bậc 1 + ● 1 |
| 3 · **Thần Dực …** | 100 | 102 px | 92 px | 4 | 34 | bậc 2 + 1 món **Chí Tôn rèn ≥ +9** (hiến tế) + ● 2 |

**Ba bậc không phân biệt bằng kích thước** — cánh bậc 1 đã vươn quá đỉnh đầu sẵn, phóng to
thêm thì mắt không đọc ra. Chúng phân biệt bằng **sáu trục hình khối**, mỗi bậc thắng ở một
trục khác nhau (bài kiểm `test_canh3bac.js` chốt luật này):

| Trục | Bậc 1 | Bậc 2 | Bậc 3 |
|---|---|---|---|
| số tầng thùy | 2 | 3 | 4 |
| mút cánh | tù, bo tròn | nhọn có móc | nhọn kéo vệt |
| gai · khung | không có | 4 gai trên khung kim loại đặc | 5 gai, khung nhường chỗ cho ánh sáng |
| đuôi rủ | không có | 2 sợi ngắn | 3 sợi dài |
| phát sáng | **không gì cả** | viền mép | lõi trắng + quầng loe + hạt bay + hào quang |
| bố cục | một nan quạt | một nan quạt, nở ngang | **hình chữ X** — thêm một cặp đổ xuống |

Bậc 1 tuyệt đối không phát sáng: đó là mốc để hai bậc trên còn chỗ mà leo. Bậc 2 nở theo **bề
ngang** là chính (đỉnh cánh gần như đứng yên). Từ bậc 2 trở lên còn có **khối ốp sống lưng** —
tấm giáp viền vàng có viên ngọc ở giữa, hai cánh mọc ra từ đó.

**Bậc 3 là bậc duy nhất có rủi ro** — 70%, hỏng thì cánh **tụt về bậc 1** (không vỡ vụn), và
☂ Thiên Mệnh Phù giữ được. Cả ba bậc đều phải tới **Lò Rèn Hoàng Gia**.

Mỗi lớp một **chất liệu** khác hẳn, và khác ở ĐƯỜNG BAO chứ không ở lớp trang trí: mỗi chất
liệu tự dựng đường bao riêng (`veThuyDoi` · `veThuyLong` · `veThuyCon` · `veThuyTia` ·
`veThuyRach`). Chỉ đổi hoa văn trên mép thì ở cỡ 100 px mắt không đọc ra, và năm đôi cánh sẽ
chỉ khác nhau ở màu.

| Lớp | Bậc 1 | Bậc 2 | Bậc 3 | Chất liệu |
|---|---|---|---|---|
| Dark Knight | Cánh Quỷ Đen | Hắc Nguyệt Dực | Thần Dực Bão Thép | **màng dơi** — 4 nan ngón, mép sau hóp vào, mút có vuốt móc |
| Sylvan Ranger | Cánh Tiên Sương | Sương Lâm Dực | Thần Dực Nguyệt Lâm | **màng côn trùng** trong suốt — gân dọc + gân ngang, vệt sáng trôi |
| Dark Wizard | Cánh Bạch Vũ | Hoại Vụ Dực | Thần Dực Hư Vô | **lông vũ** — từng chiếc một, lợp lên nhau |
| Spellblade | Cánh Hỏa Vũ | Liệt Hỏa Dực | Thần Dực Vực Lửa | bậc 1 **lai** (trên lông vũ, dưới màng dơi); **bậc 2-3 là bó tia** — không có màng nào |
| Dark Lord | Cánh Quỷ Hoang | Bào Bạo Chúa | Bào Ngai Đen | bậc 1 màng dơi; **bậc 2-3 là áo choàng** dài chấm gót, viền kim tuyến |
| Tán Nhân | Cánh Lữ Hành | Lữ Hành Dực | Thần Dực Lữ Hành | **vải bạt** căng trên nẹp thẳng, gấu xé răng nhọn — đồ tự chế |

Dark Lord không có cánh riêng ở bậc 1 nên mượn cánh quỷ, đúng như MU; từ bậc 2 lớp này đổi hẳn
sang **tấm bào** chứ không phải đôi cánh.

Hai lớp ĐỔI CHẤT LIỆU giữa chừng (Spellblade lai → tia, Dark Lord dơi → bào) cần đo lại diện
tích phủ, không thể tin vào `sai`/`cao`: bó tia không có mặt phẳng nào nên ở cùng kích thước nó
chỉ phủ chừng hai phần ba mấy chất liệu có màng. Đó là lý do `WING_DEFS` có trường `to` —
Spellblade để 1,45 ở bậc 2, không thì đôi cánh mới lại phủ ít pixel hơn đôi cũ và người chơi đọc
ra là bị tụt hạng. Cách đo: vẽ cánh ra canvas rời rồi đếm pixel có alpha (`tests/test_canh3bac.js`).

Bản sắc lớp đọc được qua dòng phụ: Dark Knight độc quyền `hpPct` làm dòng chính · Sylvan Ranger
né và tốc đánh cao nhất · Dark Wizard độc quyền `expPct` · Spellblade độc quyền hút sinh lực ·
Dark Lord độc quyền Lumen rơi.

Khảo sát đầy đủ: `docs/KHAO_SAT_CANH.md` (bảng chỉ số) và `docs/KHAO_SAT_CANH_BAY.md`
(điểm gắn, tỉ lệ, cơ chế bay). Tỉ lệ và chất liệu hiện tại đọc từ ảnh cánh MU thật do chủ
dự án cung cấp — chúng thay thế mấy con số ước lượng trong hai tài liệu đó.

---

## 14. Nhiệm vụ

**Chính tuyến — 35 nhiệm vụ, 7 chương**, dẫn thẳng từ cấp 1 tới 120 và **là chìa khoá
mở bản đồ mới**:

| Chương | Nhiệm vụ | Vùng | Mở ra |
|---|---|---|---|
| I · Kẻ Từ Thế Giới Khác / Petalshade Isle | 1 – 10 | Petalshade Isle | cấp 10 → chọn lớp, mở Lunaris City |
| II · Lunaris City | 11 – 15 | Lunaris City + Outskirts | mở Thornwood Reach |
| III · Thornwood Reach | 16 – 19 | Thornwood | mở Hollow Roost |
| IV · Hollow Roost | 20 – 23 | Hollow Roost | mở Frostmire Vale |
| V · Frostmire Vale | 24 – 27 | Frostmire | mở Ashen Steppe |
| VI · Ashen Steppe | 28 – 31 | Ashen Steppe | mở Stormgate Pass |
| VII · Stormgate Pass | 32 – 35 | Stormgate | Trụ Khoá cuối cùng — kết mở |

**Phụ tuyến — 11 nhiệm vụ, tối đa 3 cái nhận cùng lúc.** Chia hai nhóm: 5 nhiệm vụ
"học hệ thống" (mỗi cái dạy đúng một cơ chế: Khế Ước Chimera, Lò Hỗn
Loạn, Lò Rèn) và 6 nhiệm vụ cầu nối cốt truyện dẫn bạn qua từng vùng mới.

**Mục Tiêu Hôm Nay** — checklist 4 việc mỗi ngày (hạ 10 quái · thu 1 Lõi Nguyên Tố · thông
quan 1 phó bản · rèn/tấn chức 1 lần). Xong hết nhận 300◈ Lumen + 100 Instinct + 1 ✦ Ấn Giao Kết + 2 ♦ Shard.

**Truy Nã Lệnh** — Bổ Đầu ở Lunaris City treo mỗi ngày một boss săn theo dải cấp của bạn.

---

## 15. Các hệ dài hạn khác

| Hệ | Mô tả ngắn |
|---|---|
| **Ascension** | 9 bậc thăng hoa (Spark 1–4 → Molt → Radiant Core → Resonance ×2 → Starforged). **Tự động theo cấp nhân vật** — không còn bảng bấm tay, không còn tốn Anima. Bậc cao nhất cộng +88% Công và +88% HP |
| **Kỹ năng (phím K)** | Nâng bằng **Lumen + Instinct**. Sáu cấp mốc (20/40/60/80/100/120) tốn Instinct gấp ×2…×7 — đó là chỗ Tâm Đắc cũ chuyển vào. Thanh chiêu **4 ô** (phím 1-4): chính · phụ · buff · tuyệt chiêu. Các chiêu cũ không nằm trên thanh đã quy thành **% Công Kích vĩnh viễn**, xem tab "Tuyệt Học Cũ" |
| **Thuần Thục (phím H)** | Venom (cấp 4) · Stoneform (cấp 10) · Archery (cấp 30), nâng bằng Đá Thăng Cấp |
| **Tẩy Tủy** | Đạt cấp **120** thì reset về cấp 1, **giữ nguyên** trang bị / Ascension / kỹ năng / danh hiệu, đổi lấy **+2% Công Kích & Sinh Lực vĩnh viễn** mỗi lần, cộng dồn không bao giờ mất |
| **Dấu Ấn Khai Sinh** | 3 đặc điểm bẩm sinh bốc ngẫu nhiên lúc tạo nhân vật |
| **Danh hiệu** | Tự mở khi đạt điều kiện, cộng chỉ số nhỏ và hiện trước tên |
| **Sảnh Cầu May** | Gacha: 5% sách kỹ năng hiếm · 15% Châu · 25% trang bị · 30% vật liệu · 25% Lumen — **không có pity** |
| **Quầy Shard** | Bấm ô ♦ trên ví: đổi Ấn Giao Kết / Ấn Cổ Xưa, nới ô túi, nới ô kho. Không có hàng nào cộng chỉ số |
| **Vực Thẳm** | Ba mỏm đá ở Thornwood / Frostmire / Stormgate. Bấm nút lao xuống thử vận: mất 30% HP + Trọng Thương 15 phút mỗi lần |

---

## 16. Tiền tệ và vật liệu

**Ba loại thường trực** nằm trên ví ở góc trên bên phải; mọi loại còn lại xem ở
Túi Đồ → Vật Liệu (bấm ô ◈ trên ví là mở thẳng tới đó).

| Ký hiệu | Tên | Kiếm ở đâu | Dùng cho |
|---|---|---|---|
| ◈ | **Lumen** | rơi từ quái, bán đồ, nhiệm vụ, phân giải | mua bán · mọi công thức rèn · nâng kỹ năng |
| ✦ | **Ấn Giao Kết** | boss vùng lần đầu · Mục Tiêu Hôm Nay · phó bản · Quầy Shard | quay Khế Ước Chimera |
| ♦ | **Shard** | KHÔNG rơi từ quái. Mục Tiêu Hôm Nay +2 · Truy Nã Lệnh +3 · mỗi boss vùng lần đầu +1 · trọn 20 tầng Tầng Sâu +10 | Quầy Shard: đổi vé quay · nới ô túi (+5, tối đa 45) · nới ô kho (+10, tối đa 100) |

**Vật liệu** (Túi Đồ → Vật Liệu):

| Ký hiệu | Tên | Dùng cho |
|---|---|---|
| ◆ | Tu La Tinh Thạch | rèn +7 trở lên · Áo Choàng |
| ❖ | Hỗn Nguyên Thạch | rèn +10/+11 · Áo Choàng · Lò Hỗn Loạn |
| ◈ | Đá Thăng Cấp | Thuần Thục (Ám Khí / Cương Khí / Cung Tiễn) |
| ● | Lõi Nguyên Tố | hấp thụ lấy chỉ số vĩnh viễn (tự chọn atk/hp/def/mana/chí mạng, 3 viên/ngày) |
| ❖ | Mảnh Trang Bị | Kế Thừa — rơi từ quái/tinh anh |
| ◆ | Tịch Ma Thạch | Kế Thừa leo giai — rơi từ Vệ Binh Trụ |
| 📜 | Sách Kỹ Năng | học kỹ năng |
| — | Instinct | nâng kỹ năng — rơi theo loại quái: thường 10 · tinh anh 35 · boss 120 · boss phó bản 200 |
| ☂ | Thiên Mệnh Phù | bảo hiểm rèn |
| 🧪 | Hồ Lô Thuốc | hồi 40% máu, tối đa 5 lọ |
