# Định Hình Chimera — thiết kế vòng lặp sau khi quay

> Quay ra một con Chimera rồi làm gì tiếp? Hiện tại: không làm gì cả. Tài liệu này thiết kế
> phần còn thiếu, lấy vòng lặp hậu-gacha của Genshin làm khuôn.
>
> Trạng thái: **ĐÃ THI CÔNG.** Gác bằng `tests/test_dinhhinh.js` (36 chốt).
>
> Hai chỗ khác bản thiết kế ban đầu, do chủ dự án chốt lại:
> - **Tinh Trần và Nguyệt Trần không đụng tới** — hai loại đó dành cho cửa hàng đổi vật phẩm.
>   Nhiên liệu của hệ này là **Đất Hồn** (rơi khi thông quan phó bản) và chính những mảnh Cốt
>   thừa (nâng bậc bằng cách cho ăn mảnh khác, không tốn tiền tệ nào ngoài bạc).
> - **Dạy Chiêu gộp thẳng vào cấp** thay vì làm vòng lặp riêng: chiêu mạnh lên ×1.00 → ×1.90
>   theo cấp Chimera, không cần Sách Hình và không cần thêm một bảng nâng cấp nữa.

---

## 1. Vấn đề, đo trên code

Genshin có ba việc phải làm sau khi quay trúng một nhân vật: **đột phá** (nâng trần cấp),
**thiên phú** (nâng chiêu), **thánh di vật** (cày đồ). Ba việc đó là toàn bộ lý do người chơi
mở game hằng ngày. Khế Ước Chimera hiện có **không việc nào**.

Cụ thể, một con Chimera trong game hôm nay gồm đúng ba con số cố định:

| Thành phần | Hiện tại | Lớn lên theo cái gì |
|---|---|---|
| Sát thương chiêu (`mountDmg`, `game.js:23791`) | `(180 nếu 5★ / 90 nếu 4★) + 20% Công người chơi` | **không gì cả** — nền cố định vĩnh viễn |
| Bị động (`c.thu`, áp ở `game.js:5584`) | một dòng, ví dụ `+12% sát thương chiêu thức` | chỉ Huyết Thống: ×1.0 → ×1.2 → ×1.4 |
| Chiêu chủ động (`c.chieu`) | `cd` và `mult` viết cứng trong bảng `CHIMERA` | chỉ Huyết Thống: ×1.25 sát thương ở C3 |

Nghĩa là **một con 5★ ở ngày thứ 100 mạnh đúng bằng chính nó ở ngày đầu**, trừ phần Huyết
Thống — mà Huyết Thống lại chỉ đến từ việc quay trúng lại con đó, tức là vẫn nằm trong gacha
chứ không nằm trong việc chơi.

Còn con số nền `180` thì càng về sau càng vô nghĩa: ở Công 3.000 nó chiếm 23% sát thương của
chiêu, ở Công 12.000 nó chỉ còn 7%.

### 1.1 Hai loại tiền đang đúc ra mà không tiêu được

Đây là lỗ thật, không phải chuyện thiết kế tương lai:

| Tiền | Nguồn | Chỗ tiêu hiện tại |
|---|---|---|
| **Tinh Trần** | mỗi lượt quay ra 3★ cộng 15 (`game.js:3398`) | **không có** |
| **Nguyệt Trần** | Chimera đã C6 mà quay trúng lại: +25 (5★) / +5 (4★) (`game.js:3376`) | **không có** |

Người chơi quay 90 lượt thì tích khoảng 900 Tinh Trần và vài chục Nguyệt Trần, cả hai chỉ
nằm trong save. Bất kỳ thiết kế nào ở đây cũng phải đóng hai lỗ này trước.

---

## 2. Bốn nguyên tắc

**① Không dựng lại thứ đã có.** Game đã có hai hệ "bốc dòng phụ rồi nâng cấp":

- **Linh Thú** — một ô, chỉ số lõi + dòng phụ bốc lại được, nâng tới +11 (`PET_DEFS`, `game.js:386`)
- **Trang bị người chơi** — 12 ô, 14 giai, dòng phụ, rèn +11, Khắc Ấn, bộ Cổ Thần 5 món

Nếu Chimera cũng chỉ là "thêm mấy ô bốc dòng phụ" thì đó là hệ thứ ba làm cùng một việc, và
bảng khảo sát UI đã cảnh báo game đang phình hệ thống. Nên phần cày đồ của Chimera phải đổi
được **cách chiêu hoạt động**, không chỉ đổi con số.

**② Dùng lại chỗ đang bỏ không.** Bảy phòng Trial Chamber hiện là nội dung tĩnh, mô tả thuần
cơ học ("cày tinh chất nâng bậc lớp"), và bản khảo sát cốt truyện chấm chúng là **vùng đất
không có lý do tồn tại trong truyện**. Chúng là chỗ hoàn hảo để làm "hầm ngục" của hệ này —
một Dòng Cốt cho mỗi phòng. Một mũi tên, hai đích.

**③ Ngân sách sức mạnh phải viết ra trước, không phải sau.** Xem §7.

**④ Chỉ cày trong game.** Không có bước nạp tiền nào, đúng như đã chốt cho gacha.

---

## 3. Ba vòng lặp

Ánh xạ thẳng từ ba vòng của Genshin, nhưng đặt trong canon của game: khí Morvahn chạm vào
sinh vật Lunacia thì **bẻ** nó thành Chimera. Cả hệ này là chuyện bẻ nó lần thứ hai — lần này
có chủ đích.

| Genshin | Ở đây | Kiểu | Nhịp |
|---|---|---|---|
| Đột phá nhân vật | **Hoá** | xác định, không may rủi | theo mốc |
| Thiên phú | **Dạy Chiêu** | xác định | theo mốc |
| Thánh di vật | **Cốt** | may rủi, vô tận | hằng ngày |

### 3.1 HOÁ — Chimera có cấp

Đây là mảnh thiếu lớn nhất, và cũng là mảnh rẻ nhất: Chimera hiện **không có trường cấp nào**.

- Chimera có cấp **1 → 80**.
- Sáu lần Hoá nâng trần: **20 · 40 · 50 · 60 · 70 · 80**.
- Cấp làm hai việc, và cả hai đều nhắm vào chỗ đang mục:
  - **nền sát thương** 180 → 540 (5★) · 90 → 270 (4★), tuyến tính theo cấp
  - **hệ số ăn Công người chơi** 0.20 → 0.36, để con số nền thôi mất giá về cuối
- Kinh nghiệm: **Tinh Trần** (đã có, đang không tiêu được) + rơi thêm từ Trial Chamber.
- Mỗi lần Hoá cần thêm **Cốt Tướng** — rơi từ Tướng Quân vùng, mỗi vùng một loại. Bảy Tướng
  Quân đã có sẵn trong game, không cần dựng nội dung mới.

Vì sao đặt trần 80 chứ không phải 120 như người chơi: Chimera là *đồng hành*, không phải nhân
vật thứ hai. Trần thấp hơn giữ nó ở vai phụ, và giữ luôn ngân sách ở §7.

### 3.2 DẠY CHIÊU — chiêu của nó lớn lên

- Chiêu có **cấp 1 → 10**.
- `mult` ×1.00 → ×1.90 · `cd` giảm dần tới −18%.
- Nguyên liệu: **Sách Hình** ba bậc, rơi từ đúng Trial Chamber ứng với lớp Axie của con đó.
- Cấp 7 và cấp 10 cần thêm một vật phẩm từ **Hung Thần Giáng Thế** (boss thế giới, 4 giờ một
  lần — đã có sẵn). Đây là chỗ tương ứng "boss tuần" của Genshin, và nó dùng nội dung đang có.

### 3.3 CỐT — vòng lặp vô tận

Bốn ô, đặt theo bộ phận thân Axie — đúng cách Axie thật hoạt động, mỗi bộ phận cho một lá bài:

| Ô | Dòng chính (cố định theo ô) |
|---|---|
| **Sừng** | % Công Chimera |
| **Vuốt** | Bạo Kích / Sát Thương Bạo Kích |
| **Vảy** | % HP / Giảm sát thương gánh chịu |
| **Đuôi** | Hồi Chiêu / Sát Thương Chiêu |

- Mỗi Cốt có **1 dòng chính** (cố định theo ô, giá trị bốc) + **tối đa 4 dòng phụ**.
- Nâng **+0 → +12**; mỗi **+3** mở một dòng phụ mới, hết bốn dòng thì nâng một dòng đã có.
- Ba phẩm: **Thô / Tinh / Cổ**, trần lần lượt **+8 / +10 / +12**.
- Nhiên liệu nâng: **Tinh Trần** — cùng loại tiền đang không tiêu được.

#### Dòng (bộ) — bảy Dòng, mỗi Trial Chamber một Dòng

Chỗ này là điểm khác biệt so với Linh Thú và trang bị người chơi: **4 mảnh cùng Dòng đổi cách
chiêu chạy**, không phải cộng thêm con số.

| Trial Chamber | Dòng | 2 mảnh | 4 mảnh — đổi hành vi |
|---|---|---|---|
| Petalshade | Cánh Hoa | +8% HP Chimera | chiêu hồi cho **người chơi** 8% HP tối đa |
| Outskirts | Đồng Cỏ | +6% tốc đánh | 6 giây sau khi tung chiêu, Chimera đánh nhanh gấp đôi |
| Thornwood | Rễ Gai | +8% Công Chimera | chiêu để lại vũng gai 4s, địch đi qua chậm 30% |
| Hollow Roost | Vỏ Trứng | +10% sát thương chiêu | chiêu tung **hai lần**, lần sau 40% sức |
| Frostmire | Băng Vụn | +6% Bạo Kích | chiêu đóng băng mục tiêu 1.2s — đổi lại hồi chiêu +2s |
| Ashen Steppe | Tro Tàn | +10% sát thương bạo | Chimera hạ được một mục tiêu thì hồi chiêu **−1.5s** |
| Stormgate | Sấm Vụn | −8% hồi chiêu | chiêu nổ dây chuyền sang mục tiêu kề trong 200px |

Bảy Dòng, bảy lối chơi khác nhau cho **cùng một con Chimera**. Đó mới là thứ giữ người chơi
quay lại phòng thử thách, chứ không phải thêm 3% chỉ số.

---

## 4. Cày ở đâu — bảy Trial Chamber thành bảy hầm ngục

Thông quan một phòng rơi Cốt **thuộc đúng Dòng của phòng đó**.

Đây là khác biệt cố ý so với Genshin, và nó bỏ đúng tầng may rủi chán nhất. Ở Genshin bạn cày
một hầm ngục ra hai bộ trộn lẫn, nên phân nửa số món rơi ra là rác ngay từ lúc rơi. Ở đây
**bộ do bạn chọn — bằng việc chọn phòng để vào**. Còn lại vẫn ngẫu nhiên:

- **ô** nào (1/4)
- **dòng chính** nào trong hai lựa chọn của ô
- **phẩm** Thô / Tinh / Cổ
- **bốn dòng phụ** và mọi lượt bốc khi nâng

### 4.1 Đúc Lại — chữa nốt tầng may rủi thứ hai

Ba mảnh Cốt cùng Dòng, không cần cùng ô → đổi lấy **một mảnh Cốt cùng Dòng, ô do người chơi
chọn**. Phẩm và dòng phụ vẫn ngẫu nhiên.

Giữ lại phần may rủi *thú vị* (dòng phụ), bỏ phần chỉ tổ mất thời gian (mãi không ra đúng ô).

### 4.2 Nhịp ngày — khuyến nghị: cửa mềm, không phải tường

Genshin dùng nhựa hồi để chặn cứng. Với một game ARPG chạy trên trình duyệt, chơi theo đợt dài
chứ không theo lịch, một thanh thể lực chặn cứng là thù địch với người chơi.

**Khuyến nghị:** không có thanh thể lực. Mỗi phòng **ba lượt đầu trong ngày rơi đủ**, từ lượt
thứ tư trở đi rơi giảm (1 Cốt, không có thưởng kèm). Người chơi cày cả buổi vẫn tiến được, chỉ
là chậm hơn — và ai đăng nhập mỗi ngày vẫn hơn hẳn.

Mục tiêu ngày đã có sẵn dòng *"Thông quan 1 phó bản"* (`DAILY_GOALS`, `game.js:23491`), nên
phần nhịp ngày cắm thẳng vào chỗ đang chạy.

---

## 5. Tiền tệ — mọi thứ đã đúc đều có chỗ tiêu

| Tiền | Nguồn | Chỗ tiêu sau thiết kế này |
|---|---|---|
| **Tinh Trần** | 3★ khi quay · Trial Chamber | kinh nghiệm nâng Cốt · kinh nghiệm Hoá |
| **Nguyệt Trần** | Chimera đã C6 mà quay trúng lại | **cửa hàng**: đổi Cốt chỉ định ô, Sách Hình, Cốt Tướng |
| **Ấn Giao Kết / Cổ Xưa** | mục tiêu ngày, nhiệm vụ | giữ nguyên — chỉ dùng để quay |

Cửa hàng Nguyệt Trần là van an toàn: người chơi xui cả tháng vẫn mua thẳng được thứ mình
thiếu, thay vì cày mù.

---

## 6. Một con Chimera dựng đầy đủ trông thế nào

| | Ngày đầu | Dựng đầy đủ |
|---|---|---|
| Cấp | — (không có) | 80 |
| Nền sát thương | 180 | 540 |
| Hệ số ăn Công | 0.20 | 0.36 |
| Chiêu | mult gốc | ×1.90, hồi chiêu −18% |
| Cốt | không có | 4 mảnh Cổ +12, đủ bộ 4 |
| Hiệu ứng bộ | không có | một luật mới cho chiêu |

---

## 7. Ngân sách sức mạnh

Viết ra trước khi code, để lúc cân bằng còn có cái mà đối chiếu.

- Chimera **hôm nay** đóng góp khoảng **+12%** tổng sát thương đầu ra của người chơi.
- Chimera **dựng đầy đủ** được phép đóng góp tối đa **+35%**.
- Thời gian để tới đó: khoảng **40 giờ chơi**, không tính phần tối ưu dòng phụ (phần đó cố ý
  không bao giờ xong).

Nếu con số mô phỏng vượt trần này thì **hạ hệ số Cốt trước**, đừng hạ cấp hay chiêu — hai thứ
đó là phần thưởng xác định, người chơi cày là phải nhận đủ.

---

## 8. Thi công theo đợt

| Đợt | Việc | Vì sao trước/sau |
|---|---|---|
| **1** | Chimera có cấp + Hoá + tiêu Tinh Trần | Lỗ lớn nhất, và tự nó đứng được: không cần UI mới ngoài một thanh cấp. Đóng luôn một trong hai lỗ tiền tệ. |
| **2** | Cốt · 4 ô · 7 Dòng · rơi từ 7 Trial Chamber | Vòng lặp chính. Phải sau đợt 1 vì hệ số Cốt neo theo cấp Chimera. |
| **3** | Dạy Chiêu · Đúc Lại · cửa hàng Nguyệt Trần | Phần đánh bóng và van an toàn. Làm sớm quá thì chưa biết cân bằng ở đâu mà đặt giá. |

---

## 9. Ba chỗ cần chủ dự án chốt

1. **Nhịp ngày**: cửa mềm (khuyến nghị) hay chặn cứng kiểu nhựa hồi?
2. **Bốn ô hay năm ô?** Bốn khớp với cách thân Axie chia bộ phận. Năm bám sát Genshin hơn nhưng
   kéo dài thời gian dựng thêm khoảng 30%.
3. **Hiệu ứng 4 mảnh có được mạnh tới mức đổi lối chơi không?** Khuyến nghị: **có**. Nếu nó chỉ
   là thêm con số thì cả hệ này thành Linh Thú thứ hai, và nguyên tắc ① sụp.
