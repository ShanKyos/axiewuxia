# Cải thiện hình ảnh nhân vật

Tài liệu tham khảo, không phải kế hoạch đã chốt. Mọi con số ghi **đo từ mã** là đọc trực tiếp
từ `public/game/game.js`; chỗ nào là ước lượng thì ghi rõ.

---

## 1. Hiện trạng — vấn đề nằm ở đâu

**Đo từ mã.** Kiểm kê `public/game/assets/`:

| Thư mục | Số file | Loại |
|---|---|---|
| `mobs/` | 24 | tranh vẽ |
| `npcs/` | 19 | tranh vẽ |
| `skills/` | 36 | tranh vẽ |
| `items/` | 20 | tranh vẽ |
| `maps/` | 11 | tranh vẽ |
| `trees/` | 11 | tranh vẽ |
| `chimera/` · `pets/` · `vfx/` · `title/` | 26 | tranh vẽ |
| **nhân vật người chơi** | **0** | **không có file nào** |

Đây là phát hiện chính: **mọi thứ trong game đều là tranh vẽ, riêng nhân vật là hình vector.**
Nhân vật dựng hoàn toàn bằng lệnh canvas — `game.js` có **68 hàm** tên `h*` chỉ để vẽ các mảnh
cơ thể và giáp (`hTorso`, `hHead`, `hArmL/R`, `hLegs`, `hShoulderPlate`, `hCrestHood`, …).

Đó là lý do nhân vật nhìn lệch tông so với phần còn lại của màn hình, và không đợt tinh chỉnh
vector nào xoá được khoảng cách đó: nó là khác biệt về **chất liệu**, không phải về độ tỉ mỉ.

### Một quan sát dễ bỏ qua

Nhìn ảnh chụp mấy webgame cùng thể loại thì thấy: **phần lớn cái "lộng lẫy" không nằm ở nhân
vật.** Ước lượng thô trên một khung xem trước điển hình, nhân vật chiếm chừng 40% số pixel có
nghĩa; 60% còn lại là quầng lửa dưới chân, viền sáng quanh thân, hạt bay và khung chạm khắc bao
quanh. Cởi hết hiệu ứng ra thì hình nhân vật cũng chỉ là một tranh tĩnh bình thường.

Nghĩa là có hai gói việc **tách rời nhau**, và gói rẻ hơn lại cho phần lớn hiệu quả.

---

## 2. Ba đường đi

| | Việc phải làm | Dung lượng tải thêm | Đổi được gì |
|---|---|---|---|
| **A · Hiệu ứng** | thêm lệnh vẽ canvas | 0 byte | không đổi hình nhân vật, nhưng đổi hẳn cảm giác |
| **B · Cắt rời + khung xương** | vẽ/gen ảnh từng mảnh, gắn vào khớp có sẵn | vài MB | đổi hẳn chất liệu nhân vật |
| **C · Sprite sheet đầy đủ** | vẽ mọi khung hình × mọi hướng | hàng trăm MB | như game 2D thương mại |

**Đường C loại được ngay.** Đo từ mã: `HS_FRAMES = { i:16, w:32, a:16, c:16 }` = 80 khung mỗi
tư thế; 14 bộ giáp × 6 lớp = 84 diện mạo. Nếu làm đủ 8 hướng như game đẳng cự thì
84 × 80 × 8 ≈ **53 000 khung**. Ở cỡ 160×220 px thì đó là vài trăm MB — với game chạy thẳng
trên trình duyệt, không có bước dựng, thì không khả thi. *(Ước lượng dung lượng: chưa kiểm chứng.)*

---

## 3. Đường B — "gen ảnh AI rồi áp khung xương" có chạy được không?

**Có, nhưng không phải bằng cách sinh ra "một nhân vật" rồi đắp vào.** Dưới đây là chỗ nó gãy
và chỗ nó chạy.

### 3.1 Vì sao không đắp thẳng ảnh vào được

Bộ khung hiện tại không vẽ "một nhân vật". Nó vẽ **từng mảnh, trong từng phép biến hình riêng**:

```js
hJoint(g, HERO_JOINT.shL[0], HERO_JOINT.shL[1], ps.armL, () => { /* vẽ cánh tay ở đây */ });
```

Mỗi mảnh xoay quanh **điểm xoay riêng** theo tư thế của khung hình đó. Một tấm ảnh nhân vật
liền khối không có khớp nào để xoay — đắp vào là được một hình nộm cứng đơ, mất sạch phần hoạt
hình đang có (32 khung đi, gối gập, thân trên trễ pha so với hông, quán tính áo choàng).

### 3.2 Quy trình đúng: cắt rời theo khớp

Đây là kỹ thuật **cut-out rigging**, đúng cách Spine và DragonBones làm. Ảnh được cắt thành các
mảnh rời, mỗi mảnh có một điểm xoay đã biết, rồi chính bộ khung hiện tại điều khiển chúng.

**Tin tốt: phần khó nhất đã có sẵn.** Khớp đã định nghĩa, toạ độ đã cố định, phép biến hình đã
chạy đúng suốt 32 khung đi. Việc còn lại chỉ là đổi *nội dung* của mỗi mảnh từ lệnh vẽ sang
`drawImage`.

**Đo từ mã** — bảng khớp trong hệ toạ độ bộ xương (khung 160×220, chân ở y=212):

```js
const HERO_JOINT = { hipL:[72,142], hipR:[90,142], shL:[52,100], shR:[108,100], neck:[80,94],
                     kneeL:[70,171], kneeR:[90,171] };
```

Danh sách mảnh tối thiểu, kèm điểm xoay:

| # | Mảnh | Điểm xoay | Ghi chú |
|---|---|---|---|
| 1 | Đầu (gồm mũ) | `neck` (80, 94) | đỉnh đầu ở y≈53 |
| 2 | Thân trên | hông (80, 146) | `hTorso` bao [58,96]–[106,146] |
| 3 | Vai trái | `shL` (52, 100) | vẽ đè lên tay |
| 4 | Vai phải | `shR` (108, 100) | |
| 5 | Tay trái | `shL` (52, 100) | |
| 6 | Tay phải | `shR` (108, 100) | vũ khí gắn theo mảnh này |
| 7 | Đùi trái | `hipL` (72, 142) | |
| 8 | Ống chân + giày trái | `kneeL` (70, 171) | bàn chân chạm y=212 |
| 9 | Đùi phải | `hipR` (90, 142) | |
| 10 | Ống chân + giày phải | `kneeR` (90, 171) | |
| 11 | Áo choàng | vai, vẽ SAU lưng | đã có quán tính riêng |
| 12 | Vũ khí | tay phải | |

**12 mảnh.** Cánh không nằm trong bảng này — nó đã tách riêng rồi (`veCanh`), và đó chính là
bằng chứng cách làm này chạy được: đôi cánh hiện tại đã là một "mảnh" độc lập có điểm gắn
riêng ở bả vai (80±14, 104), vỗ và nghiêng theo quán tính người mà không đụng gì tới bộ khung.

### 3.3 Mẹo quan trọng nhất: dùng chính bản vẽ hiện tại làm ảnh điều hướng

Vấn đề lớn nhất của ảnh sinh bằng AI là **tỉ lệ trôi**: mỗi lần sinh ra một dáng người khác,
tay dài ngắn khác nhau, vai cao thấp khác nhau. Đắp vào khung xương cố định là lệch khớp hết.

Nhưng game này có sẵn thứ giải quyết đúng chuyện đó: **`drawHeroFigure()` kết xuất ra một hình
người đúng tỉ lệ, đúng tư thế, đúng cỡ 160×220.** Dùng chính tấm đó làm ảnh gốc điều hướng
(img2img / ControlNet / tham chiếu tư thế, tuỳ công cụ) thì ảnh sinh ra bị ép về đúng bộ khung —
vai đúng y=100, hông đúng y=142, chân đúng y=212.

Nói cách khác: **bản vẽ vector hiện tại không phải là thứ bị vứt đi, nó là khuôn.**

Cách lấy tấm khuôn đó (đo từ mã — hàm đã có sẵn, dùng cho thẻ nhân vật):

```js
heroCardUrl(sectKey, tier, gv)   // trả về data URL, khung 332×220 (PAD=86 mỗi bên)
```

### 3.4 Số lượng: 84 bộ là quá nhiều, 12–30 bộ là đủ

Nếu vẽ đủ 14 bộ giáp × 6 lớp = 84 diện mạo × 12 mảnh = **1008 ảnh**. Quá nhiều.

Nhưng mã đã có sẵn cách gộp. **Đo từ mã:**

```js
function hStage(t){ return t < 4 ? 1 : t < 7 ? 2 : t < 10 ? 3 : t < 13 ? 4 : 5; }
```

14 giai trang bị đã được gộp thành **5 chặng tạo hình**. Và màu thì `hSetMetal(M, S, t)` đã tô
lại theo giai — tức là **hình dáng theo chặng, màu theo giai**, cơ chế đó đang chạy rồi.

Nên số ảnh thật sự cần:

| Phương án | Số bộ | Số ảnh | Ước lượng dung lượng |
|---|---|---|---|
| Đủ 5 chặng × 6 lớp | 30 | 360 | ~4–5 MB |
| Gọn: 3 chặng × 6 lớp | 18 | 216 | ~2,5–3 MB |
| Thử nghiệm: 1 lớp × 2 chặng | 2 | 24 | ~300 KB |

*(Dung lượng: ước lượng theo PNG có kênh trong suốt cỡ 120×200, chưa kiểm chứng.)*

Điểm mấu chốt khiến con số này nhỏ hơn đường C hàng trăm lần: **cắt rời thì không nướng khung
hoạt ảnh.** Bộ khung vẫn tự tạo ra 80 khung từ 12 mảnh tĩnh. Đường C phải lưu từng khung một.

### 3.5 Năm chỗ sẽ hỏng, và cách bắt

1. **Hướng ánh sáng lệch nhau giữa các mảnh.** Sinh riêng từng mảnh thì mỗi mảnh một hướng
   sáng, ghép lại thành người ghép từ nhiều bức ảnh. → Sinh **cả người một lần** rồi mới cắt,
   đừng sinh từng mảnh.
2. **Mép cắt lộ.** Cắt ở đúng khớp thì lúc xoay sẽ hở khe. → Cắt **chờm** vào nhau chừng 4–6 px,
   mảnh gần thân vẽ sau để che.
3. **Phong cách trôi giữa các bộ.** Bộ giáp chặng 1 và chặng 5 ra hai phong cách khác nhau thì
   người chơi thấy như hai game. → Sinh cả 5 chặng trong **một lượt, cùng một câu lệnh gốc**,
   chỉ đổi phần mô tả giáp.
4. **Mất khả năng tô lại theo giai.** Ảnh có màu nướng sẵn thì `hSetMetal()` vô dụng. → Sinh ảnh
   ở **thang xám** rồi tô màu lúc chạy bằng `globalCompositeOperation`, hoặc chấp nhận 5 chặng
   là 5 màu cố định.
5. **Vỡ mọi bài kiểm ảnh.** `test_herosprite.js` so sprite với bản vẽ thẳng và đòi lệch ≤ 2%.
   → Đổi hình là phải cập nhật ngưỡng, và **giữ nguyên phép so** đó vì nó bắt được đúng loại
   lỗi này (nó vừa bắt được lỗi vẽ cánh hai lần trong đợt cánh).

### 3.6 Về meowa.ai cụ thể

**Chưa kiểm chứng** — proxy của môi trường này chặn hầu hết miền ngoài, mình không mở được
trang đó nên không biết công cụ này có những gì. Thay vì đoán, đây là **yêu cầu tối thiểu** mà
bất kỳ công cụ sinh ảnh nào cũng phải đáp ứng thì quy trình trên mới chạy:

- Xuất được **nền trong suốt** (PNG có kênh alpha). Nếu chỉ xuất nền đặc thì phải tách nền thủ
  công cho 216–360 ảnh — đó là chỗ tốn công nhất, không phải chỗ sinh ảnh.
- Nhận được **ảnh điều hướng tư thế** (img2img, ControlNet, hoặc tham chiếu). Không có cái này
  thì tỉ lệ trôi, và mục 3.3 sập.
- **Lặp lại được**: cùng một câu lệnh + cùng một hạt giống cho ra cùng một kết quả. Cần cái này
  để sinh 5 chặng cùng phong cách.
- Xuất ở **độ phân giải đủ**: ít nhất 320×440 (gấp đôi khung 160×220) để thu nhỏ còn nét.

Nếu công cụ thiếu mục 1 hoặc mục 2 thì vẫn dùng được, nhưng phần việc tay tăng lên nhiều lần.

---

## 4. Gói A — hiệu ứng, làm được ngay, 0 byte tải thêm

Không đụng tới art, không đụng tới bộ khung. So với các webgame cùng thể loại, bảng Nhân Vật
hiện tại thiếu:

| Thứ | Hiện có | Cần |
|---|---|---|
| Cỡ chân dung | CSS ghim 120 px | chiếm phần lớn khung |
| Bệ đứng | không có | đĩa lửa/quầng xoay, màu theo giai trang bị |
| Viền sáng quanh thân | `applyEdgeLight` rất nhẹ | mạnh hơn, đổi màu theo giai |
| Hạt bay quanh người | chỉ cánh bậc 3 | liên tục, mật độ theo giai |
| Ô trang bị | có, nhưng không vây quanh | xếp hai bên chân dung |
| **Lực chiến** | **không có** | một con số tổng, là trung tâm của bảng |

Mục cuối đáng chú ý nhất và **không phải chuyện đồ hoạ**: hiện mọi hệ thống nâng cấp (ép ngọc,
cánh, Đại Thành, Thuần Thục, giáp) đều nằm rải rác trong `calcDerived()`, không có chỉ số nào
gộp chúng lại. Một con số "Lực chiến" biến tất cả thành **một thứ duy nhất để so với người
khác** — và nó cũng là tính năng online rẻ nhất có thể làm: không cần đồng bộ trạng thái, chỉ
cần gửi lên một con số và nhận về bảng xếp hạng.

---

## 5. Việc nhỏ nhất nên thử trước

Đừng bắt đầu bằng 360 ảnh. Bắt đầu bằng **một lớp, một chặng, 12 mảnh**:

1. Gọi `heroCardUrl('thieulam', 6, gv)` lấy tấm khuôn tư thế.
2. Sinh một hình người theo khuôn đó, nền trong suốt, độ phân giải gấp đôi.
3. Cắt thành 12 mảnh theo bảng ở mục 3.2, mỗi mảnh chờm 4–6 px, ghi lại điểm xoay.
4. Thêm một nhánh trong `drawHeroFigure()`: có ảnh thì `drawImage`, không có thì vẽ vector như
   cũ. **Giữ cả hai đường** — đây là chỗ để so sánh, và cũng là đường lùi.
5. Chạy `test_herosprite.js` và nhìn con số lệch. Chụp hai bản cạnh nhau.

Sau bước 5 mới đủ dữ kiện để quyết có làm nốt 30 bộ hay không. Trước đó thì mọi ước lượng công
sức trong tài liệu này đều là phỏng đoán.
