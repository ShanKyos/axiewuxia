# 15 Cổ Vật — danh mục cái xác

> Đi kèm `docs/DOI_VAI_AXIE.md`. Tài liệu kia chốt **kiến trúc**; tài liệu này là **nội dung** —
> phần quyết định game vui hay chán, và là phần độc lập với code nhất.
>
> **Trạng thái: ĐỀ XUẤT.** Con số là điểm xuất phát để đo, trừ trần 16% — cái đó là hợp đồng.

---

## 0. Luật viết một Cổ Vật

Bốn điều, vi phạm cái nào thì cắt cái đó chứ đừng sửa số:

1. **Cơ chế là HÌNH, không phải LƯỢNG.** Cấm dòng "+X% sát thương". Mỗi cơ chế phải **đổi định
   nghĩa món đồ nào là đồ tốt** cho người đang dùng nó.
2. **Phải trỏ vào một chỗ cày CỤ THỂ**, và chỗ đó phải khác 14 cái còn lại. Bảng §2 là bảng
   kiểm chống trùng — hai Cổ Vật trỏ cùng một chỗ là một cái thừa.
3. **Chỉ đụng burst của CHÍNH NÓ.** Không đụng 4 chiêu của Axie (luật giữ đúng quyết định gỡ
   Khắc Ấn).
4. **Burst để lại một cửa sổ.** Không có cửa sổ thì không có xoay vòng, và không có xoay vòng
   thì AUTO nuốt tiếp.

Chỉ số thô theo bậc sao: **3★ 10% · 4★ 13% · 5★ 16%** tổng lực chiến. Trần cứng.

---

## 1. Bảng tổng

| # | Tên | ★ | Cơ chế (một dòng) | Cửa sổ burst |
|--:|---|:--:|---|---|
| 1 | **Giáp Khuyết** | 3 | +1 ổ ngọc trên mọi món | gom quái 2,5s |
| 2 | **Vỏ Mòn Tân Binh** | 3 | mỗi ô trang bị đã lấp: +2% mọi chỉ số | — (đòn thẳng) |
| 3 | **Khiên Sứt** | 3 | 25% Phòng Thủ cộng thẳng vào sát thương burst | khiên chắn đạn 4s |
| 4 | **Mũ Trụ Không Mặt** | 3 | mục tiêu bị burst đánh dấu, chết thì rơi đồ như tinh anh | đánh dấu 8s |
| 5 | **Giáp Da Người Đưa Tin** | 3 | đổi xác hồi 4s thay vì 8s; burst yếu hơn 30% | tăng tốc 3s |
| 6 | **Vỏ Thép Câm** | 4 | 30% Phòng Thủ của 5 món đổi thành Công Kích | vỡ giáp 6s |
| 7 | **Giáp Tro** | 4 | Dòng Cốt Tro Tàn có hiệu lực gấp đôi | cháy lan 5s |
| 8 | **Áo Kẻ Ghi Chép** | 4 | 3 món cùng một dòng phụ ⇒ dòng đó ×2 | soi điểm yếu 6s |
| 9 | **Giáp Xích Mắt Lệch** | 4 | đánh trúng mục tiêu BỊ KHẮC HỆ ⇒ burst hồi 40% | nhiễm hệ 5s |
| 10 | **Bao Tay Thợ Rèn Chết** | 4 | ép đồ hỏng không tụt cấp, 1 lần/ngày | đe nện — choáng 1,5s |
| 11 | **Giáp Săn Đoàn Gloam** | 4 | mở Rương Canh hoặc nhặt Vỉa Cốt ⇒ burst hồi đầy | truy dấu 10s |
| 12 | **Hài Cốt Vệ Binh Trụ** | 5 | món từ **+9** trở lên tính như **hai món** khi xét hiệu ứng bộ | vỡ giáp sâu 8s |
| 13 | **Giáp Rỗng Đoàn Gloam** | 5 | burst nổ **3 lần**; cái xác cho **0 chỉ số thô** | ba nhịp, mỗi nhịp 2s |
| 14 | **Vương Giáp Không Chủ** | 5 | cả **3 xác** trang bị đều chạy bị động, không chỉ xác đang ra | triệu bóng 6s |
| 15 | **Giáp Tế Tướng Quân Thứ Năm** | 5 | burst tiêu 20% máu hiện tại, sát thương nhân theo máu đã tiêu | hiến tế 4s |

---

## 2. ⚠ Bảng kiểm chống trùng — mỗi cái trỏ một chỗ cày khác nhau

Đây là bảng quan trọng nhất trong tài liệu. Dự án này có một chẩn đoán gốc: *"game không thiếu
nội dung — game có một lượng nội dung nhỏ được chép ra nhiều lần."* Mười lăm Cổ Vật mà cùng bảo
người chơi đi cày một chỗ thì đó là **một** Cổ Vật được chép ra mười lăm lần.

| # | Nó đẩy người chơi đi cày | Hệ đang có mà nó hút vào |
|--:|---|---|
| 1 | **ngọc** — càng nhiều càng tốt | `JEWEL_DROP`, Tứ Châu |
| 2 | **lấp đủ 5 ô** thay vì dồn một món | độ phủ trong `gearVisual()` |
| 3 | **đồ thủ** | dòng Phòng Thủ |
| 4 | **quái tinh anh / trùm vùng** | `JEWEL_SRC_MUL` elite ×5, thuve ×22 |
| 5 | **nhịp xoay vòng** (không cày đồ — cày tay nghề) | — *(đây là Cổ Vật dạy việc)* |
| 6 | **đồ thủ trên build sát thương** — lật ngược bảng đánh giá đồ | dòng Phòng Thủ, đường thứ hai |
| 7 | **một VÙNG cụ thể** (Ashen Steppe) | 7 Dòng Cốt độc quyền theo vùng |
| 8 | **lọc dòng phụ** — nhặt 3 món cùng dòng | 15 dòng phụ, đúng vòng lặp Diablo |
| 9 | **chọn map theo hệ** | `el:` trong `hurtMob`, tam giác Axie |
| 10 | **dám ép đồ** — Linh Hồn Châu, rủi ro tụt cấp | `NGOC_EP`, Lò Hỗn Độn |
| 11 | **vật thể thế giới** — Rương Canh, Vỉa Cốt | `B3.1` + `B3.3`, hai hệ hiện ít lý do dùng |
| 12 | **ép đồ tới +9** | `+0..+11`, mốc phát sáng |
| 13 | **tay nghề** — canh 3 nhịp, không cày gì | — *(Cổ Vật trần trụi nhất)* |
| 14 | **sưu tầm rộng** — quay nhiều xác | chính cái banner |
| 15 | **đồ máu** — Sinh Mệnh Châu, dòng HP | `❤ Sinh Mệnh Châu` |

Mười lăm ô, không ô nào trùng ô nào. Và 11/15 trỏ vào một hệ **đã có sẵn trong game** đang thiếu
lý do dùng — đó là lời hứa "gacha tiếp nhiên liệu cho vòng cày" được viết ra thành bảng.

---

## 3. Chi tiết từng cái

### ── 3★ · nền cho người không nạp ──

Năm cái này phải **luôn dùng được**, kể cả ở cấp 120. Không cái nào được là "đồ thừa cho tới khi
quay được 5★".

#### 1 · Giáp Khuyết
> *Bộ giáp thủng lỗ chỗ. Mỗi lỗ là chỗ một viên đá từng nằm — người ta cạy hết ra trước khi chôn.*

| | |
|---|---|
| **Bị động** | +1 ổ ngọc trên **mọi** món đang mặc |
| **Burst** | Đập đất — gom quái trong 260px về tâm, giữ 2,5s |
| **Đi cày** | ngọc |

**Đây là cái xác "luôn tốt" mà §5.3 của tài liệu kiến trúc bắt buộc phải có.** Nó không có điều
kiện, không có mốc, không đòi build gì — đeo vào là hơn. Người chơi mới cần một chỗ đứng chắc,
và người chơi không nạp cần biết mình không bị bỏ lại.

⚠ Vì nó vô điều kiện nên nó là cái **dễ thành lựa chọn duy nhất** nhất. Nếu đo thấy >40% người
chơi dùng nó ở endgame thì 14 cái kia yếu, đừng nerf nó.

#### 2 · Vỏ Mòn Tân Binh
> *Cỡ vừa người, sờn đều khắp. Thứ mà ai cũng mặc và không ai nhớ.*

| | |
|---|---|
| **Bị động** | mỗi ô trang bị **đã lấp**: +2% mọi chỉ số (đủ 5 ô = +10%) |
| **Burst** | Một nhát thẳng, sát thương cao, không cửa sổ |
| **Đi cày** | **lấp đủ 5 ô** thay vì dồn hết vào một món |

Chữa một thói xấu có thật: người chơi dồn tài nguyên vào món mạnh nhất rồi bỏ trống ô khác. Nó
cũng ăn khớp với `gearVisual()` — độ phủ vốn đã được tính, nay nó có nghĩa với người chơi.

#### 3 · Khiên Sứt
> *Nửa cái khiên. Nửa kia còn cắm ở đâu đó.*

| | |
|---|---|
| **Bị động** | 25% Phòng Thủ cộng thẳng vào sát thương burst |
| **Burst** | Dựng khiên đứng yên, chắn đạn 4s (quái cận chiến vẫn đi vòng được) |
| **Đi cày** | đồ thủ |

Cái xác đầu tiên nói với người chơi rằng **Phòng Thủ không phải dòng rác**. Nó mở đường cho #6,
cái lật hẳn bảng đánh giá đồ.

#### 4 · Mũ Trụ Không Mặt
> *Không có mặt nạ, không có lỗ mắt. Nó vẫn quay về phía có người.*

| | |
|---|---|
| **Bị động** | — |
| **Burst** | Đánh dấu mục tiêu 8s. Mục tiêu bị đánh dấu mà chết thì rơi đồ theo bảng **quái tinh anh** |
| **Đi cày** | quái tinh anh, trùm vùng |

Cái xác duy nhất trong nhóm 3★ **không có bị động** — toàn bộ giá trị nằm ở việc bấm đúng con.
Nó dạy người chơi rằng burst là để CHỌN mục tiêu, không phải để xả.

#### 5 · Giáp Da Người Đưa Tin
> *Nhẹ, không che được gì. Người mặc nó chưa bao giờ định đứng lại đánh.*

| | |
|---|---|
| **Bị động** | đổi xác hồi **4s** thay vì 8s |
| **Burst** | Tăng tốc 3s cho Axie; sát thương **thấp hơn 30%** so với chuẩn |
| **Đi cày** | nhịp xoay vòng — không cày đồ, cày tay nghề |

**Cổ Vật dạy việc.** Nó cố tình yếu ở sát thương và mạnh ở nhịp, nên ai đeo nó sẽ tự học rằng
giá trị nằm ở thứ tự gọi chứ không ở con số. Nên nằm trong gói tân thủ.

---

### ── 4★ · mỗi cái một cách chơi ──

#### 6 · Vỏ Thép Câm
> *Dày tới mức người bên trong không nghe được tiếng gọi rút lui.*

| | |
|---|---|
| **Bị động** | **30% Phòng Thủ của 5 món chuyển thành Công Kích** |
| **Burst** | Húc — vỡ giáp mục tiêu 6s (−25% Phòng Thủ) |
| **Đi cày** | đồ thủ, **trên build sát thương** |

Cái xác lật ngược cả bảng đánh giá đồ: món giáp nặng mà người chơi vẫn bán đi bỗng thành món
đáng giữ. Đây là mẫu mực của luật "cơ chế là HÌNH, không phải LƯỢNG" — nó không cho thêm sức
mạnh, nó **đổi chỗ sức mạnh đến từ đâu**.

#### 7 · Giáp Tro
> *Nung trong một cái lò không còn ai nhớ chỗ. Vẫn ấm.*

| | |
|---|---|
| **Bị động** | **Dòng Cốt Tro Tàn có hiệu lực gấp đôi** |
| **Burst** | Cháy lan 5s, nhảy sang mục tiêu trong 120px |
| **Đi cày** | **Ashen Steppe** — vùng độc quyền của Dòng Tro Tàn |

Cái xác duy nhất trỏ vào một **VÙNG** cụ thể. Bảy Dòng Cốt là cơ chế chọn build đã có (chọn Dòng
để nuôi = chọn nơi để cày), nhưng hiện chưa có gì làm người chơi thấy sự khác biệt. Cái này làm.

> **Đây là khuôn cho 6 cái nữa về sau** — mỗi Dòng một Cổ Vật. Nhưng **đừng làm cả 7 ngay**: bảy
> cái cùng một khuôn chỉ khác tên Dòng chính là nhân bản. Làm một, đo xem người chơi có dời chỗ
> cày thật không, rồi mới làm tiếp.

#### 8 · Áo Kẻ Ghi Chép
> *Không phải giáp. Là áo choàng của người đi sau trận đánh, ghi lại ai chết ở đâu.*

| | |
|---|---|
| **Bị động** | 3 món trở lên mang **cùng một dòng phụ** ⇒ dòng đó **×2** |
| **Burst** | Soi điểm yếu 6s — mọi đòn vào mục tiêu này bạo kích |
| **Đi cày** | **lọc dòng phụ** — nhặt cho đủ 3 món cùng dòng |

Đây là Diablo 4 thuần chất nhét vào một cái xác: 15 dòng phụ đang tồn tại nhưng người chơi chỉ
cộng chúng lại. Cái này biến chúng thành **mục tiêu sưu tập**, và nó tự sinh ra vô số build mà
không cần viết thêm một dòng nội dung nào.

#### 9 · Giáp Xích Mắt Lệch
> *Mắt xích nối lệch một nhịp. Ai đó sửa vội giữa trận.*

| | |
|---|---|
| **Bị động** | đánh trúng mục tiêu **bị khắc hệ** ⇒ burst hồi 40% |
| **Burst** | Nhiễm hệ 5s — mục tiêu tạm mang hệ **khắc chế bởi hệ của Axie** |
| **Đi cày** | chọn map theo hệ |

Cái xác làm cho hệ khắc chế **có tay cầm**. Burst của nó tự tạo ra điều kiện mà bị động của nó
cần — một vòng khép kín, và là cái xác có trần kỹ năng cao nhất trong nhóm 4★.

#### 10 · Bao Tay Thợ Rèn Chết
> *Vẫn còn vết chai. Không ai biết ông ta rèn hỏng bao nhiêu món trước khi thôi đếm.*

| | |
|---|---|
| **Bị động** | ép đồ **hỏng thì không tụt cấp**, 1 lần mỗi ngày |
| **Burst** | Nện đe — choáng 1,5s trong 160px |
| **Đi cày** | dám ép đồ — Linh Hồn Châu, Phá Thiên Kiếp |

Cái xác duy nhất có bị động chạy **ngoài trận đánh**. Nó đáng giá vì Linh Hồn Châu xịt là tụt 1
cấp, và nỗi sợ đó làm nhiều người dừng ở +6 mãi mãi. Một lần bảo hiểm mỗi ngày đủ để người ta
dám bấm.

⚠ Nó tương tác với #12 (Hài Cốt Vệ Binh Trụ, mốc +9). **Đó là chủ ý** — hai cái xác nói chuyện
với nhau qua vòng ép đồ, và người chơi phải chọn: bảo hiểm để leo, hay phần thưởng khi đã leo tới.

#### 11 · Giáp Săn Đoàn Gloam
> *Lính đào ngũ không mang giáp nặng. Chúng mang thứ chạy được.*

| | |
|---|---|
| **Bị động** | mở một **Rương Canh** hoặc nhặt một **Vỉa Cốt** ⇒ burst hồi đầy ngay |
| **Burst** | Truy dấu 10s — hiện vị trí Rương Canh và Vỉa Cốt gần nhất trên bản đồ nhỏ |
| **Đi cày** | vật thể thế giới |

Rương Canh (mở một lần vĩnh viễn) và Vỉa Cốt (đổi chỗ mỗi ngày) là hai hệ đã dựng xong mà hiện
ít lý do dùng. Cái xác này biến chúng thành một phần của vòng chiến đấu thay vì một việc vặt
bên lề.

---

### ── 5★ · đổi cách chơi, không đổi con số ──

Bốn cái này chỉ hơn 4★ đúng **3 điểm phần trăm chỉ số thô**. Toàn bộ giá trị còn lại nằm ở cơ chế.

#### 12 · Hài Cốt Vệ Binh Trụ
> *Không phải giáp của hắn. Là hắn — phần còn cứng lại sau khi Trụ Khoá rút hết phần mềm.*

| | |
|---|---|
| **Bị động** | món từ **+9** trở lên được tính như **hai món** khi xét hiệu ứng bộ |
| **Burst** | Vỡ giáp sâu 8s (−40% Phòng Thủ), lan 3 mục tiêu |
| **Đi cày** | **ép đồ tới +9** |

Cái xác của người cày nặng. Nó lấy mốc +9 — vốn chỉ là một nấc trên thang phát sáng — và biến
thành một **cái đích cơ chế**. Ai đeo nó thì mọi viên Linh Hồn Châu đều có địa chỉ.

Đây cũng là bằng chứng rõ nhất cho hợp đồng "3★ + đồ kỹ thắng 5★ + đồ rác": cái xác 5★ này với
đồ +0 thì **bị động của nó không chạy một dòng nào**.

#### 13 · Giáp Rỗng Đoàn Gloam
> *Không có gì bên trong. Chưa bao giờ có.*

| | |
|---|---|
| **Bị động** | **KHÔNG** — cái xác này cho **0 chỉ số thô** |
| **Burst** | Nổ **ba lần**, mỗi nhịp cách 2s. Nhịp sau mạnh hơn nhịp trước nếu nhịp trước trúng. |
| **Đi cày** | tay nghề |

Cái xác chứng minh **5★ không có nghĩa là nhiều số hơn**. Nó bỏ trọn 16% chỉ số để đổi lấy một
burst có trần kỹ năng thật. Ai canh được ba nhịp vào đúng lúc bầy quái gom thì nó là cái mạnh
nhất bảng; ai xả bừa thì nó tệ hơn cả 3★.

⚠ Phải có **ít nhất một** cái như thế này trong mọi bộ 5★, nếu không người chơi sẽ đọc ra thông
điệp "bậc sao = con số" và cả thiết kế trượt về P2W trong nhận thức, kể cả khi bảng số vẫn đúng.

#### 14 · Vương Giáp Không Chủ
> *Vừa người, bất kể ai mặc. Đó là chỗ đáng sợ của nó.*

| | |
|---|---|
| **Bị động** | **cả 3 xác đang trang bị đều chạy bị động**, không chỉ xác đang hiện hình |
| **Burst** | Triệu bóng 6s — bóng của hai xác kia hiện mờ, đánh thường theo |
| **Đi cày** | **sưu tầm rộng** |

Cái xác duy nhất mà giá trị **tỉ lệ thuận với số Cổ Vật đã sở hữu**. Nó là động cơ giữ chân dài
hạn của cả banner, và nó phải là 5★ vì nếu rẻ thì mọi người dùng nó và ba ô xác thành một ô.

⚠ Nó **không** phá luật "tối đa 1 xác hiện hình" — bóng trong burst là hiệu ứng 6s, mờ, không có
va chạm, không nhận đòn. Nếu lúc dựng thấy màn hình rối thì giảm xuống 1 bóng, đừng bỏ luật.

#### 15 · Giáp Tế Tướng Quân Thứ Năm
> *Cái duy nhất trong năm bộ còn nguyên. Tướng quân thứ năm không chết trong trận.*

| | |
|---|---|
| **Bị động** | — |
| **Burst** | Tiêu **20% máu hiện tại**; sát thương nhân theo **lượng máu đã tiêu** |
| **Đi cày** | **đồ máu** — Sinh Mệnh Châu, dòng HP |

Máu từ chỗ là chỉ số phòng thủ trở thành **đạn dược**. Nó tự cân: càng nhiều máu càng mạnh,
nhưng bắn xong thì mỏng. Và nó mở ra một build mà hiện nay không tồn tại — dồn HP trên một
nhân vật đánh.

⚠ Tiêu **máu hiện tại** chứ không phải máu tối đa. Tiêu theo máu tối đa thì bấm lúc sắp chết là
tự sát, và người chơi sẽ học cách không bao giờ bấm nó khi đang nguy — tức là xoá mất đúng
khoảnh khắc nó đáng tồn tại.

---

## 4. Phân bổ và tỉ lệ

| Bậc | Số cái | Chỉ số thô | Lên kệ |
|---|--:|--:|---|
| 3★ | 5 | 10% | luôn có trong pool |
| 4★ | 6 | 13% | 3 cái lên kệ mỗi đợt (như `gachaKe4()`) |
| 5★ | 4 | 16% | 1 cái lên kệ, xoay 6 tuần (như `gachaKe()`) |

Bộ máy tỉ lệ **thừa kế nguyên si**: pity cứng 90, soft pity 74, 4★ mốc 10, 50-50. Không đụng
`gachaP5` / `gachaP4`.

⚠ Hiện `CHI_VINHCUU5` có 3 con và `CHI_KE5` có 3 con. Bộ này có **4** cái 5★ — phải chốt lại
chia bao nhiêu vào pool Vĩnh Cửu, bao nhiêu lên kệ. Em đề xuất **2/2**, và **Giáp Rỗng Đoàn
Gloam** vào Vĩnh Cửu: cái xác 0-chỉ-số không nên là cái đầu tiên người mới quay trúng.

---

## 5. Ba thứ CỐ Ý không làm

| Không làm | Vì |
|---|---|
| **Cổ Vật cho cả 7 Dòng Cốt** | bảy cái cùng một khuôn chỉ khác tên Dòng = nhân bản. Làm một (#7), đo, rồi tính. |
| **Cổ Vật khoá theo lớp** | 5 lớp × 15 cái thì mỗi banner 4/5 vô dụng với người quay. Xác **dùng chung mọi lớp**, chỉ đổi da theo `heroSet(sectKey, t)`. Với lượng người chơi hiện tại, khoá lớp là tự bóp. |
| **Cổ Vật cộng % sát thương thẳng** | có đúng một dòng như thế là 14 cái kia phải cạnh tranh với nó bằng con số, và cả thiết kế "hình chứ không lượng" sụp trong một đợt cân bằng. |
