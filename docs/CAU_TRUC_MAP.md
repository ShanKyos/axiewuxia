# Cấu trúc map — đo hiện trạng, đối chiếu Ragnarok & Path of Exile

Nghiên cứu cho câu hỏi: *làm sao tạo được cảm giác map giống Ragnarok Online và Path of Exile.*
Phần 1 là số đo thật của game lúc này, không phải ấn tượng. Phần 2-3 tách ra thứ tạo nên cảm
giác của hai game kia. Phần 4 nói thẳng chỗ mâu thuẫn. Phần 5 là đề xuất, có thứ tự ưu tiên.


Bản đọc cho dễ: https://claude.ai/code/artifact/7f131749-3c3a-4304-a18a-2f5ad18d20ad — khi hai bên lệch nhau thì **tệp này** đúng.

---

## 1. Hiện trạng, đo được

| | |
|---|---|
| Map đồng | 7 · mỗi map một hình chữ nhật phẳng **2600×1900** |
| Thành | 1 (Lunaris City), cùng kích thước |
| Phó bản | 7 · **dùng chung một địa hình** (`DGN_ROOMS` 3 phòng + `DGN_WALLS` 2 tường) |
| Một map bằng | **4,3 màn hình** (1280×900) |
| Băng ngang map | **12,4 giây** · đường chéo **15,4 giây** (tốc chạy 209 px/giây) |
| Vật cản tĩnh | **4-10 khối/map** trên 4,94 triệu px — tức gần như đồng trống |
| Quái sống cùng lúc | **278 con** trên cả 7 map |
| Hồi sinh | tại chỗ, **3-5 giây/con** |

Mật độ và độ đa dạng theo tiến trình:

| map | bãi | quái | **loài** | mật độ (quái/triệu px) |
|---|---|---|---|---|
| Petalshade Isle (1-12) | 10 | 56 | **7** | 11,3 |
| Petalshade Outskirts (14-24) | 8 | 44 | 6 | 8,9 |
| Thornwood Reach (24-38) | 6 | 35 | 4 | 7,1 |
| Hollow Roost (42-56) | 6 | 37 | 3 | 7,5 |
| Frostmire Vale (62-78) | 6 | 36 | 3 | 7,3 |
| Ashen Steppe (84-100) | 6 | 36 | 3 | 7,3 |
| Stormgate Pass (102-120) | 6 | 34 | **3** | 6,9 |

**Đây là phát hiện đáng kể nhất:** map khởi đầu có 7 loài và 10 bãi, mọi map cuối game có 3 loài
và 6 bãi. Càng chơi sâu thì thế giới càng **nghèo đi**. Cả RO lẫn PoE làm ngược lại.

Cách đi lại giữa map:
- `GATES` có 6 cổng, tất cả nối vào Lunaris City theo hình **ngôi sao**. Ba map (Hollow Roost,
  Ashen Steppe, Stormgate Pass) **không có cổng nào** — chỉ tới được bằng dịch chuyển.
- Bảng Bản Đồ cho **dịch chuyển thẳng** tới mọi map đã mở khoá.
- Nút **⚔ Chọn Trận** dịch chuyển thẳng vào *một cụm quái cụ thể* rồi tự bật AUTO.

---

## 2. Ragnarok Online — bốn thứ tạo ra cảm giác đó

1. **Map là một NƠI CHỐN, không phải một màn.** Vẽ tay, cố định, không đổi suốt mười năm. Người
   chơi *thuộc* nó: biết góc nào có Poring, lối nào tắt sang cave. Cái đó chỉ có được khi map
   không đổi và người chơi phải tự đi qua nó nhiều lần.
2. **Nối bằng RÌA, không bằng menu.** Đi hết mép `prt_fild08` là sang `prt_fild09`. Thế giới là
   một tấm lưới liền mạch mà người chơi dựng bản đồ trong đầu bằng cách đi. Dịch chuyển (Kafra,
   Cánh Bướm) **tốn tiền và có giới hạn** — nó là tiện nghi, không phải cách đi mặc định.
3. **Map có DÂN SỐ, không có "bãi".** Khai báo kiểu "map này nuôi 60 con Poring", hồi sinh rải
   đều theo giờ. Nên map giống một hệ sinh thái đang sống, và sinh ra **tranh chấp chỗ** giữa
   người chơi — thứ tạo nên đời sống xã hội của RO.
4. **Mỗi map một LÝ DO ĐI.** Một loài chủ đạo, một món rơi mà ai cũng cần. "Xuống Payon Cave 2
   kiếm thẻ Zombie." Cái tên map trong đầu người chơi luôn dính với một món đồ.

Cái giá phải trả: đi bộ lâu. RO chấp nhận, và chính sự chậm ấy làm nơi đến có giá.

---

## 3. Path of Exile — bốn thứ tạo ra cảm giác đó

1. **Sinh ngẫu nhiên từ BỘ GẠCH VẼ TAY.** Từ vựng cố định (một "Ledge" luôn ra chất Ledge),
   nhưng cách xếp thì mỗi lượt một khác. Người chơi học được *cách chạy* một loại map mà không
   bao giờ thuộc lòng nó.
2. **Mỗi vùng có một BỘ XƯƠNG.** Tuyến chính có hình dạng đại thể — thẳng, chẻ nhánh, hay sân
   mở. Ngẫu nhiên nhưng không hỗn loạn: người chơi vẫn đoán được mình đang đi đâu.
3. **Map là VẬT PHẨM tiêu hao, có dòng phụ.** Mỗi tấm map mang các dòng làm nó nguy hiểm hơn
   *và* hậu hĩnh hơn cùng lúc. Người chơi **tự chọn độ khó của mình** — đây là động cơ chính
   của toàn bộ hậu kỳ PoE.
4. **Mật độ là một NÚM VẶN, không phải trang trí.** Cụm thường / phép / hiếm, cụm hiếm có dòng
   riêng. Lý do đánh nhau nằm ở chỗ cụm nào đáng đánh, không phải ở chỗ có quái hay không.

Cái giá phải trả: không nơi nào là nơi chốn. Chạy xong là vứt.

---

## 4. Mâu thuẫn phải chốt trước khi làm

Game này **đã bỏ map rồi**, bằng ba thứ cộng lại: dịch chuyển tự do tới mọi map đã mở, nút Chọn
Trận nhảy thẳng vào một cụm quái, và AUTO đánh hộ. Với ba thứ đó, một map 15 giây đường chéo chỉ
còn là cái nền phía sau ô AUTO.

Không thể vừa giữ nguyên ba thứ đó vừa có cảm giác RO. RO đắt giá **chính vì** phải đi.

Nhưng cũng không nên gỡ chúng: Chọn Trận + AUTO là lựa chọn thiết kế đã chốt cho một game chơi
trên trình duyệt, ngồi ngắn. Vậy hướng đúng không phải "bắt đi bộ lại", mà là:

> **Cho map một lý do tồn tại mà Chọn Trận không thay thế được.**

Nghĩa là: giữ đường tắt cho việc cày, nhưng đặt vào map những thứ chỉ tìm thấy khi tự đi.

---

## 5. Đề xuất — ba tầng, theo thứ tự nên làm

### Tầng A — làm map ra chất RO (rẻ, phần lớn là dữ liệu)

**A1. Đảo ngược đường cong đa dạng.** Map cuối game phải có **nhiều** loài hơn map đầu, không ít
hơn. Mục tiêu: 3 loài → 6-8 loài ở ba map cuối. Đây là sửa dữ liệu trong `MAPS[].packs`, không
đụng mã.

**A2. Mỗi map một loài chủ đạo + một món rơi mang tên map.** Viết thẳng vào `desc` và hiện trên
bảng Bản Đồ: *"Hollow Roost — Huyết Bức. Nơi duy nhất rơi Cánh Bức."* Không có câu đó thì bảy
map chỉ khác nhau ở màu nền.

**A3. Địa hình phải NẮN ĐƯỜNG ĐI.** 4-10 khối trên 4,3 màn hình là đồng trống; RO có hàng cây,
mặt nước, vách đá chia map thành lối và túi. Nâng lên ~25-40 khối, nhưng **xếp thành lối và
túi**, không rải đều — mỗi bãi quái nằm trong một túi có 1-2 lối vào. Việc này còn làm chiêu
diện rộng và cú kéo quái có ý nghĩa.

**A4. Dân số thay cho bãi.** Đổi `packs` (toạ độ cứng) thành `vung` (miền + dân số + loài): map
tự rải và tự bù. Bãi cố định thì cày mười lần y hệt nhau; dân số thì map thở.

### Tầng B — làm thế giới ra chất thế giới (vừa, đụng cả mã lẫn dữ liệu)

**B1. Nối map bằng rìa.** Mỗi map đồng có 2-4 lối ra ở mép dẫn sang map kề. Ba map hiện không có
cổng nào phải được nối vào. Bản đồ trong game vẽ **đồ thị kề nhau**, không phải một danh sách.

**B2. Dịch chuyển chỉ tới ĐIỂM MỐC.** Giữ dịch chuyển tới thành và một điểm mốc mỗi vùng; chặng
cuối phải tự đi. Đủ để không hành người chơi, đủ để map có mặt trong trí nhớ.

**B3. Đặt vào map thứ Chọn Trận không lấy được.** Điểm hái thảo dược đã có sẵn cơ chế; thêm rương
ẩn, quái hiếm lang thang, mạch quặng theo giờ thật. Đây mới là câu trả lời thật cho mục 4.

### Tầng C — hậu kỳ ra chất PoE (lớn, nhưng đã có sẵn chỗ đứng)

**C1. Phù Ác Mộng chính là mảnh PoE.** Việc #90 đang chờ trong danh sách — *"7 phó bản tĩnh thành
hàng trăm biến thể"* — đúng là hệ dòng phụ map của PoE. Nên làm nó theo đúng luật PoE: **dòng phụ
nâng nguy hiểm và phần thưởng cùng lúc**, người chơi tự chọn.

**C2. Sinh địa hình phó bản từ bộ gạch.** Bảy phó bản đang dùng **chung một** địa hình 3 phòng.
Dựng một bộ sinh: đồ thị 3-7 phòng + hành lang, sinh từ một hạt giống, vẽ bằng chính các khối
vật cản sẵn có. Bộ xương giữ cố định theo từng phó bản (thẳng / chẻ nhánh / sân mở) để mỗi cái
vẫn có chất riêng.

**C3. Tầng Sâu nâng từ một sảnh lên một tầng thật.** Hiện 20 tầng đều là **một sảnh bán kính
380** trong `pb_daohoa`. Cho nó dùng bộ sinh ở C2, và mỗi 5 tầng đổi bộ gạch.

### Nên bắt đầu từ đâu

**A1 + A2 trước** — rẻ nhất, sửa đúng chỗ đang sai rõ nhất (thế giới nghèo dần), và cảm nhận
được ngay. **A3 tiếp**, vì nó là nền cho mọi thứ sau: chưa có địa hình nắn đường thì B và C đều
chỉ là đồng trống rộng hơn. **C2 sau đó**, vì nó mở khoá cả C1 lẫn C3 cùng lúc.

Tầng B cần chốt mục 4 trước — nó là thay đổi lối chơi, không phải thay đổi nội dung.
