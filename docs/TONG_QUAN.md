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
Đi bãi săn đúng dải cấp  →  giết quái  →  EXP · bạc · Huyền Thiết · Châu · đồ rơi xuống đất
        ↓                                             ↓
Lên cấp → cộng 5 điểm tiềm năng/cấp            Nhặt đồ → so sánh (rê chuột) → mặc
        ↓                                             ↓
Đủ cấp → mở bãi mới, phó bản mới        Đồ dư → Lò Hỗn Độn: rèn +N, khảm ngọc, tấn phẩm
        ↓                                             ↓
Hạ 3 Vệ Binh Trụ → mở Cổng Vực → hạ Tướng Quân vùng → Mảnh Cổ Thần, Ấn Trấn Ải
        ↓
Sự kiện thế giới theo giờ thật → Bảo Hạp → trang bị Hoàn Hảo · Cổ Thần · Khắc Ấn
        ↓
Cấp 120 → Tẩy Tủy (reset) → +2% Công & Sinh Lực vĩnh viễn, chơi lại từ cấp 1
```

Ba trục tiến bộ chạy song song và không thay thế nhau:

| Trục | Đo bằng | Nguồn |
|---|---|---|
| **Cấp** | 1 → 120, mỗi cấp +5 điểm tiềm năng | EXP từ quái, nhiệm vụ, phó bản |
| **Trang bị** | phẩm × giai × mức rèn (+0…+11) | đồ rơi, Bảo Hạp, Lò Hỗn Độn |
| **Hệ dài hạn** | Ascension, Thần Binh, Thú Chiến, Linh Thú, Kỹ năng | vật liệu riêng từng hệ |

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

**12 ô**: Vũ Khí · Nón · Áo · Tay · Quần · Chân · Dây Chuyền · Nhẫn 1 · Nhẫn 2 ·
Áo Choàng · Pet · Cánh. Túi chứa tối đa **30 món**.

Một món đồ có bốn trục độc lập:

| Trục | Thang | Ý nghĩa |
|---|---|---|
| **Phẩm** | Phàm → Tinh → Linh → Thần → Chí Tôn | nhân chỉ số gốc ×1,0 / 1,3 / 1,65 / 2,1 / **2,7** và mở 0/1/2/3/4 dòng phụ |
| **Giai** | 1 → 10 (Tân Binh → Tối Thượng) | "thời đại" của món, theo cấp nơi nó rơi ra |
| **Rèn** | +0 → +11 | xem mục Lò Hỗn Độn |
| **Hoàn Hảo** | có / không | mở thêm 1–3 **dòng riêng** mà đồ thường không bao giờ có |

**Dòng Hoàn Hảo** là bộ dòng riêng, không phải "dòng cũ roll max". Vũ khí: hạ địch hồi
Qi · hạ địch hồi Sinh Lực · tỉ lệ ST Hoàn Hảo · thêm sát thương · ST theo cấp · tốc đánh.
Giáp: đồng rơi thêm · tỉ lệ đỡ đòn · phản sát thương · giảm sát thương · Qi tối đa ·
Sinh Lực tối đa. Hệ quả cố ý: **một món Hoàn Hảo phẩm thấp có thể đáng mặc hơn một món
Thần thường.**

**Thức Tỉnh** — món rèn tới **+10** trở lên được thêm một dòng cộng thẳng (Bạo Kích +5%,
Né +5%, Công +25, HP +200, Hồi Qi +3, hoặc Lực Lượng +8).

**Cổ Thần Thủ Hộ** — 4 bộ giáp 5 món (Sarkaan · Velmyr · Ashvard · Korrveth), chỉ ra từ
Bảo Hạp bậc IV trở lên (5–8%) hoặc đúc tại Lò Hỗn Độn. Hiệu ứng bộ ẩn, mở ở mốc **2/3/5 món**.

### 6.1 Hệ vũ khí — CHỈ có tác dụng lên quái

Năm hệ, khắc nhau thành vòng kín:

```
Steel ◆ ⟶ Verdant ♣ ⟶ Stone ▲ ⟶ Frost ❄ ⟶ Ember ☼ ⟶ Steel
(thép đốn cây · rễ nứt đá · đất vùi băng · băng dập lửa · lửa nung thép)
```

| Tình huống | Hiệu quả |
|---|---|
| Hệ **vũ khí đang cầm** khắc hệ quái | **+20%** sát thương |
| Hệ quái khắc hệ vũ khí của bạn | **−12%** sát thương |

Quan trọng: hệ chỉ nằm trên **vũ khí**, và chỉ tính **chiều bạn đánh quái**. Chiều quái
đánh bạn luôn tính theo hệ của **lớp**, nên đổi vũ khí không bao giờ làm bạn ăn đòn nặng
hơn. Đổi hệ vũ khí được — công thức "Đổi Hệ" ở Lò Hỗn Độn, tốn 1 Hỗn Độn Châu, hệ mới
ngẫu nhiên nhưng chắc chắn khác hệ cũ.

### 6.2 Khắc Ấn — đồ đổi CÁCH chiêu chạy, không đổi con số

12 Khắc Ấn, gắn trên **một món đồ**, mặc vào là có hiệu lực. Mỗi lớp dùng được đúng 4
(2 dùng chung + 2 riêng của lớp); Khắc Ấn của lớp khác vẫn nằm trên món đồ nhưng nằm im.

| Khắc Ấn | Dùng cho | Làm gì |
|---|---|---|
| **Hồi Quang** | mọi lớp | hạ một địch rút ngắn 10% hồi chiêu còn lại của mọi chiêu |
| **Vọng Khí** | mọi lớp | đòn bạo kích nổ vòng khí, 45% sát thương lên địch bên cạnh |
| **Lan Trảm** | Dark Knight | chiêu chính bật sang địch khác trong 160px với 55% sát thương |
| **Thành Luỹ** | Dark Knight | mỗi địch trúng chiêu chính cộng khiên 3% HP tối đa (trần 25%) |
| **Tách Tiễn** | Sylvan Ranger | mũi tên chiêu chính tách đôi, hai mũi tạt ngang 40% sát thương |
| **Mưa Tiễn** | Sylvan Ranger | 1,1s sau khi tung Trấn Phái, một loạt tên rơi lại chính chỗ đó |
| **Vũng Tà Độc** | Dark Wizard | Trấn Phái để lại vũng độc 5s |
| **Vọng Âm** | Dark Wizard | 35% chiêu chính nổ thêm lần hai, 70% sát thương diện rộng |
| **Bùng Cháy** | Spellblade | địch trúng chiêu chính cháy 3s; gục lúc còn cháy thì nổ tung |
| **Xung Phong** | Spellblade | tung chiêu chính khi địch ngoài tầm sẽ lướt tới rồi mới chém |
| **Trùng Sóng** | Dark Lord | chiêu chính phóng thêm sóng thứ hai rộng hơn sau 0,35s, 60% sát thương |
| **Hiệu Triệu** | Dark Lord | chiêu chính quét trúng ≥3 địch thì Trấn Phái hồi ngay một nửa thời gian chờ |

**Chỉ có 3 nguồn Khắc Ấn**, tất cả đều là nội dung cuối game:

| Nguồn | Tỉ lệ |
|---|---|
| Bảo Hạp IV → VII | 18% → 23% → 28% → **33%** |
| Chúa Tể Vực Nứt | **60%** |
| Hung Thần Giáng Thế | **45%** |
| Xâm Lăng Vàng — Chúa Đàn Vàng | 35% |
| Xâm Lăng Vàng — quái vàng thường | 8% |

Hệ bốc ưu tiên Khắc Ấn bạn **chưa có**, nên lần đầu gần như không bị trùng.

### 6.3 Đồ rơi XUỐNG ĐẤT

Quái chết thì đồ và Châu **rơi thành vật thể dưới đất**, không rơi thẳng vào túi:

- Món nảy theo vòng cung ra khỏi xác rồi đáp xuống, có tấm nền tối bo góc + viền màu phẩm
  và nhãn tên nổi màu theo phẩm.
- **Nằm 45 giây**, nhấp nháy cảnh báo trong 10 giây cuối rồi biến mất.
- **Bốn cách nhặt**: đi ngang qua trong 46px · bấm phím **J** (tầm với 96px) ·
  **bấm chuột trúng món** · giữ **ALT** để hiện nhãn tên **mọi** món trên màn hình rồi chọn.
- Bật **AUTO** thì bán kính đi-ngang-qua nới lên gấp 3 (288px) — lớp tầm xa giết quái cách
  200px vẫn hút được đồ.
- **Túi đầy (30 món) thì đồ NẰM LẠI dưới đất** và đổi nhãn `⚠ TÚI ĐẦY`, không mất trắng.
  Dọn túi rồi quay lại nhặt vẫn kịp.
- Rơi đồ phẩm Linh trở lên thì có tiếng riêng + vòng sáng; phẩm Thần/Chí Tôn thì rung
  màn hình và hiện banner giữa màn hình.

Vật liệu vụn (Huyền Thiết, Tu La, Tiến Cấp Đan…) vẫn cộng thẳng và chỉ ghi vào nhật ký
chiến đấu — chữ bay giữa màn hình để dành cho đồ và Châu.

### 6.4 Thẻ vật phẩm khi rê chuột

Rê chuột lên bất kỳ ô đồ nào (túi hoặc ô đang mặc) thì sau 90ms hiện **thẻ thông tin
ngay cạnh con trỏ**, kèm **thẻ món đang mặc cùng ô đặt sát bên để so**. Chênh lệch từng
dòng in ngay sau con số (`+4`, `−2%`). Thẻ này cũng nêu rõ:

- **Được / mất Khắc Ấn** nếu đổi món — nêu **trước** lực chiến, vì món kém 10% chỉ số mà
  mang Khắc Ấn chưa có thường vẫn đáng mặc.
- Cảnh báo khi đổi món sẽ **rời bộ Cổ Thần** (mốc 2/3/5 mà bảng chỉ số không thấy).

Trên điện thoại (không có con trỏ) thẻ này tắt; xem chi tiết bằng nút `⋯` ở góc ô.

---

## 7. Lò Hỗn Độn — một cỗ máy duy nhất

Mở bằng phím **F**. Cách dùng: **bỏ đồ và ngọc vào KHAY → máy tự liệt kê những công thức
mà khay đó thoả → chọn → bấm KẾT HỢP.** Không có màn rèn thứ hai nào khác.

**14 công thức**, chia ba nhóm:

| Nhóm | Công thức | Khay cần | Ghi chú |
|---|---|---|---|
| Rèn | Rèn Thường | 1 trang bị +0…+9 | |
| Rèn | **Phá Thiên Kiếp** | 1 trang bị +9/+10 · ngọc | chỉ tại Lò Rèn Hoàng Gia |
| Ngọc | Ngọc Chúc Phúc ◎ | 1 trang bị +0…+5 · 1 viên | **100%, không thất bại** |
| Ngọc | Ngọc Linh Hồn ◉ | 1 trang bị dưới +11 · 1 viên | 50%, hỏng thì **tụt 1 cấp** |
| Ngọc | Ngọc Sinh Mệnh ❤ | 1 giáp trụ · 1 viên | hỏng thì dòng Sinh Mệnh về 0 |
| Ngọc | Đổi Hệ ● | 1 vũ khí · 1 Hỗn Độn Châu | hệ mới ngẫu nhiên, chắc chắn khác hệ cũ |
| Chế | Tấn Phẩm | 1 trang bị dưới Chí Tôn | leo phẩm |
| Chế | Kế Thừa | 1 trang bị dưới giai X | leo giai, giữ trọn mọi dòng, chỉ số gốc còn 90% |
| Chế | Luyện Áo Choàng | khay trống | 2 cấp |
| Chế | Luyện Linh Dực | 1 trang bị Hoàn Hảo +4 (hiến tế) · ● 1 | Lò Rèn Hoàng Gia |
| Chế | Thăng Linh Dực 2 | 1 Linh Dực cấp 1 · ● 1 | Lò Rèn Hoàng Gia |
| Chế | **Lò Hỗn Loạn** | 3 trang bị **cùng phẩm** | 3 món tan biến ngay khi ném vào |
| Chế | Đổi Cổ Thần | 3 món Cổ Thần · ● 1 | chọn cả bộ lẫn ô |
| Chế | Triệu Cổ Thần | khay trống | 60 Mảnh Cổ Thần |

### Bảng tỉ lệ rèn (Rèn Thường + Phá Thiên Kiếp)

| Mức đích | Tỉ lệ | Nguyên liệu | Hỏng thì sao |
|---|---|---|---|
| +1 … +6 | **100%** | 1–2 Huyền Thiết | không thể hỏng |
| +7 | 75% | 1 Huyền Thiết + 1 Tu La | **tụt 1 cấp** |
| +8 | 65% | 1 Huyền Thiết + 1 Tu La | **tụt 1 cấp** |
| +9 | 50% | 1 Huyền Thiết + 1 Tu La | **tụt 1 cấp** |
| **+10** | **50%** | 2 Huyền Thiết + 3 Tu La + 1 Hỗn Nguyên + ngọc | **VỠ VỤN — mất vĩnh viễn** |
| **+11** | **45%** | 3 Huyền Thiết + 5 Tu La + 2 Hỗn Nguyên + ngọc | **VỠ VỤN — mất vĩnh viễn** |

**Thiên Mệnh Phù ☂** (mua 500◈ thẳng trong lò) bảo hộ: thất bại vẫn giữ nguyên mức rèn.
Chỉ dùng được cho công thức có rủi ro. Danh hiệu "Thợ Rèn Truyền Thuyết" cộng thêm +5%
tỉ lệ rèn vĩnh viễn.

### Lò Hỗn Loạn — 3 món cùng phẩm đổi 1 món phẩm cao hơn

| Phẩm gốc | Tỉ lệ | Hỗn Nguyên | Bạc |
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
| Hỗn Độn | ● | nguyên liệu công thức cao (Đổi Hệ, Linh Dực, Cổ Thần, Phá Thiên Kiếp) |

Châu rơi từ **mọi loại quái** — quái thường 0,10–0,9%/viên, tinh anh 0,8–4,5%, Vệ Binh
Trụ 3–20%, Tướng Quân 12–100%; nhân thêm ×1,0 → ×1,8 theo dải cấp map.

---

## 8. Bảo Hạp

Rương phần thưởng 7 bậc, chỉ đến từ sự kiện thế giới, phó bản và Tầng Sâu. Mở trong
Túi Đồ (phím I hoặc B).

| Bậc | Khoảng cấp đồ | Cổ Thần | Hoàn Hảo | Khắc Ấn |
|---|---|---|---|---|
| I | 1 – 14 | — | — | — |
| II | 15 – 29 | — | 6% | — |
| III | 30 – 44 | — | 12% | — |
| IV | 45 – 59 | 5% | 20% | 18% |
| V | 60 – 74 | 6% | 30% | 23% |
| VI | 75 – 89 | 7% | 40% | 28% |
| VII | 90+ | 8% | **55%** | **33%** |

Mỗi hạp cho: 1 trang bị (hoặc 1 món Cổ Thần) + có thể 1 viên Châu + bạc (150 + 120×bậc)
+ Anima (20×bậc). Bậc hạp nhận từ boss thế giới tính theo **cấp người chơi**, không theo
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
riêng, cộng bạc và Tiến Cấp Đan. **AUTO bị khoá suốt pha Boss Săn** — phải tự tay đánh.

| Phó bản | Cấp vào | Giới hạn giờ | Bậc Rương | Thưởng thông quan (bạc) |
|---|---|---|---|---|
| Trial Chamber: Petalshade | 12 | 8:00 | I | 250 – 400 |
| Trial Chamber: Outskirts | 14 | 8:00 | I | 320 – 480 |
| Trial Chamber: Thornwood | 26 | 9:00 | II | 550 – 800 |
| Trial Chamber: Hollow Roost | 46 | 9:00 | II | 900 – 1.300 |
| Trial Chamber: Frostmire | 66 | 10:00 | III | 1.400 – 2.000 |
| Trial Chamber: Ashen Steppe | 86 | 11:00 | IV | 2.200 – 3.200 |
| Trial Chamber: Stormgate | 100 | 12:00 | V | 3.000 – 4.500 |

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
  bạc ≈ 220×t×(1+0,12t) · EXP ≈ 340×t×(1+0,18t) · Anima 120×t · Huyền Thiết 1+t/2 ·
  Tiến Cấp Đan mỗi 3 tầng · **1 Bảo Hạp mỗi 5 tầng** (bậc = t/5).
- **Phần thưởng chỉ vào túi khi bạn CHỦ ĐỘNG bấm Rút Lui** (hoặc bấm G ở cổng — game
  hiểu đó là rút lui, không để bạn mất trắng vì bấm nhầm).
- **Chết là mất SẠCH kho tạm cả lượt.**
- Xuống hết 20 tầng thì kho tạm được nhân **×1,5** và tặng thêm một **Bảo Hạp VII**,
  rồi tự động trao — không bắt bấm Rút Lui lần nữa.

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
thiểu của map + 12 (trần 110). Hạ nó nhận **1 Bảo Hạp** bậc tính theo cấp bạn, và **45%
rơi thẳng một món mang Khắc Ấn**.

### ✦ Xâm Lăng Vàng
Một **đàn quái dát vàng** tràn vào 1 map thường trong 12 phút: 8 quái vàng + 1
**Chúa Đàn Vàng** đứng giữa map. Quái vàng có máu ×6 (chúa đàn ×14), công ×1,4 (×1,7),
EXP ×3, bạc ×3, và **mỗi con CHẮC CHẮN rơi 1 Bảo Hạp** theo bậc map:

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
- Hạ mỗi con: **1 Bảo Hạp** (bậc = cấp/15 + 2) + **2 Hỗn Độn Châu** + **60% một món
  mang Khắc Ấn** — tỉ lệ Khắc Ấn cao nhất game.
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
  truy thù bạn. Hạ được kẻ truy thù thì thưởng thêm 120◈ và 2 Huyền Thiết.
- **AUTO không bao giờ tự khơi PK**, kể cả khi bạn quên bật nút PK — nó chỉ tự vệ nếu
  bị Axie Lang Thang truy thù trước.

---

## 13. Đồng hành: Thú Chiến · Linh Thú · Thần Binh · Cánh · Áo Choàng

| Hệ | Mở ở cấp | Có bằng cách nào | Cho gì |
|---|---|---|---|
| **Thú Chiến** (Nhân Vật → Thú Chiến) | 6 | mua/thăng giai bằng bạc + Huyền Thiết | 5 bậc, cộng thẳng ST/chỉ số, xuất trận đánh cùng |
| **Linh Thú** (Nhân Vật → Linh Thú) | 15 | mua Phong Linh Phù 1.500◈, đánh tinh anh xuống dưới 40% máu, bấm **T** — **65% thành công** | tự săn quái quanh bạn |
| **Thần Binh** | 1 | mỗi lớp một cái, nâng bằng Nội Đan + Huyền Thiết | 10 tầng, đổi bảng màu giáp trên người, tầng 6+ toả hào quang |
| **Cánh** | — | boss rơi 12%; Linh Dực cấp 2 luyện ở Lò Rèn Hoàng Gia (cấp 80+) | +HP/né/đồng rơi hoặc +ST/bạo/tốc đánh |
| **Áo Choàng** | — | luyện tại Lò Hỗn Độn, 2 cấp | +% Công, xuyên giáp |
| **Pet trang bị** | — | tinh anh 12% / boss 40% | +EXP, +đồng rơi, hút sinh lực |

Năm bậc Thú Chiến: Emberhide Bull (cấp 10) → Frosthorn Bull (25) → Voltclaw Panther (45)
→ Sunfeather Phoenix (65) → Azure Wyrm (85). Tỉ lệ thăng giai tụt dần 100% → 80% → 60%
→ 42% → 30%; bắt **Tuấn Mã Hoang** ngoài Outskirts (tối đa 5 con/ngày) đổi **Mã Thầu** để
cộng +7% tỉ lệ hoặc bớt 4 Huyền Thiết mỗi lần thăng.

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
"học hệ thống" (mỗi cái dạy đúng một cơ chế: Thú Chiến, Thần Binh, Linh Thú, Lò Hỗn
Loạn, Vườn Dược) và 6 nhiệm vụ cầu nối cốt truyện dẫn bạn qua từng vùng mới.

**Mục Tiêu Hôm Nay** — checklist 4 việc mỗi ngày (hạ 10 quái · thu 1 Nội Đan · thông
quan 1 phó bản · rèn/tấn chức 1 lần). Xong hết nhận 200◈ + 100 Instinct + 50 Anima.

**Truy Nã Lệnh** — Bổ Đầu ở Lunaris City treo mỗi ngày một boss săn theo dải cấp của bạn.

---

## 15. Các hệ dài hạn khác

| Hệ | Mô tả ngắn |
|---|---|
| **Ascension** | 9 bậc thăng hoa (Spark 1–4 → Molt → Radiant Core → Resonance ×2 → Starforged). Nâng bằng **Anima** + bạc + Huyền Thiết. Bậc cao nhất cộng +88% Công và +88% HP. Bậc 5 trở lên phải qua Thử Thách Ascension nhiều đợt |
| **Kỹ năng (phím K)** | Nâng bằng **Instinct**. Các chiêu cũ không còn nằm trên thanh 3 ô đã quy thành **% Công Kích vĩnh viễn**, xem tab "Tuyệt Học Cũ" |
| **Tấn Chức (phím H)** | Ám Khí (cấp 4) · Cương Khí (cấp 10) · Cung Tiễn (cấp 30), nâng bằng Tiến Cấp Đan |
| **Tẩy Tủy** | Đạt cấp **120** thì reset về cấp 1, **giữ nguyên** trang bị / Ascension / kỹ năng / danh hiệu, đổi lấy **+2% Công Kích & Sinh Lực vĩnh viễn** mỗi lần, cộng dồn không bao giờ mất |
| **Dấu Ấn Khai Sinh** | 3 đặc điểm bẩm sinh bốc ngẫu nhiên lúc tạo nhân vật (khác hẳn Khắc Ấn) |
| **Danh hiệu** | Tự mở khi đạt điều kiện, cộng chỉ số nhỏ và hiện trước tên |
| **Động Phủ** (cấp 30) | Tụ Linh Trận (+% tốc độ tích luỹ) và Vườn Dược (gieo → thu Hồ Lô Thuốc / Instinct / Anima) |
| **Sảnh Cầu May** | Gacha: 5% sách kỹ năng hiếm · 15% Châu · 25% trang bị · 30% vật liệu · 25% bạc — **không có pity** |
| **Vực Thẳm** | Ba mỏm đá ở Thornwood / Frostmire / Stormgate. Bấm nút lao xuống thử vận: mất 30% HP + Trọng Thương 15 phút mỗi lần |

---

## 16. Tiền tệ và vật liệu

| Ký hiệu | Tên | Dùng cho |
|---|---|---|
| ◈ | Bạc | mua bán, mọi công thức rèn |
| ✦ | Huyền Thiết | rèn +1 → +11, thăng giai Thú Chiến, Ascension |
| ◆ | Tu La Tinh Thạch | rèn +7 trở lên |
| ❖ | Hỗn Nguyên Thạch | rèn +10/+11, Lò Hỗn Loạn |
| ◈ | Tiến Cấp Đan | Tấn Chức (Ám Khí / Cương Khí / Cung Tiễn) |
| ● | Nội Đan (5 hệ) | nâng Thần Binh |
| 💠 | Tâm Đắc | đột phá chiêu thức |
| 📜 | Sách Kỹ Năng | học kỹ năng |
| ◈ | Mảnh Cổ Thần | 60 mảnh đổi 1 món Cổ Thần |
| ☬ | Ấn Trấn Ải | Tấn Phẩm bậc cao — 1/ngày từ Tướng Quân vùng |
| — | Anima | Ascension |
| — | Instinct | nâng kỹ năng |
| ☂ | Thiên Mệnh Phù | bảo hiểm rèn |
| 🧪 | Hồ Lô Thuốc | hồi 40% máu, tối đa 5 lọ |
