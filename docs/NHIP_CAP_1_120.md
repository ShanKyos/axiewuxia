# Nhịp cấp 1-120 — đa dạng hoá nội dung cho cả hành trình

Câu hỏi: *làm sao đa dạng được nội dung khi người chơi cày từ cấp 1 tới 120, nơi họ cần khám phá
hết tính năng, vùng đất và kỹ năng.*

Trả lời ngắn: **nội dung không thiếu — nó dồn hết vào 20 cấp đầu.** Phần còn lại của tài liệu là
số đo chứng minh điều đó, bốn cần gạt đã dựng xong đang nằm không, và một bản đồ pha để rải lại.

Đọc kèm: [CAU_TRUC_MAP.md](CAU_TRUC_MAP.md) (số đo map) · [DE_XUAT_MAP.md](DE_XUAT_MAP.md) (đề xuất map).


Bản đọc cho dễ: https://claude.ai/code/artifact/dbf4dccc-8e8c-4f61-b08f-4829f6832207 — khi hai bên lệch nhau thì **tệp này** đúng.

---

## 1. Hình dạng thật của 1-120

### Mọi hệ thống mở xong trước cấp 20

| Cấp | Mở gì |
|---|---|
| 4 | Lò rèn |
| 6 | Khế Ước Chimera |
| 8 | Linh Thú |
| 10 | Bái Sư — chọn lớp, mở bộ 4 chiêu riêng |
| 12 | Phó bản đầu tiên |
| 20 | Tầng Sâu · đất PK (Thornwood Reach) |
| **20 → 119** | **không gì cả** |
| 120 | Đại Thành (còn cần đi hết chính tuyến) |

Bảy hệ thống trong mười sáu cấp, rồi một trăm cấp trống, rồi một hệ thống ở đúng vạch cuối.

### Và trăm cấp trống ấy là phần dài nhất

`XP_TABLE` ghi rõ chủ đích trong chính chú thích: **từ cấp 60, mục tiêu trung bình một giờ treo
AUTO mỗi cấp.** Tức:

| | |
|---|---|
| Cấp 60 → 120 | **≈ 60 giờ** |
| Cấp 1 → 60 | ~10-15 giờ |
| **Tỉ lệ thời gian chơi sau khi mọi hệ thống đã mở** | **≈ 80%** |

Sáu mươi giờ đó hiện có: **3 loài quái mỗi map**, **một địa hình dùng chung cho cả 7 phó bản**,
và **một cái sảnh lặp 20 lần** ở Tầng Sâu.

Đây là cùng một hình dạng hỏng với vấn đề map, chỉ nhìn từ trục thời gian thay vì trục không gian:
mọi thứ hay ho đều nằm ở đầu.

---

## 2. Bốn cần gạt đã dựng xong, chưa nối vào

Không phải đề xuất làm mới — đây là thứ **đã trả tiền mà chưa lấy hàng**.

| Cần gạt | Đã có sẵn | Đang dùng tới đâu |
|---|---|---|
| `MOB_ROLE` | 6 vai trò, mỗi vai một hệ số máu/công/tốc và **màu viền riêng** | **12/30 loài** được gán · vai **Pháp Sư không loài nào dùng** |
| `el:` — Kim Mộc Thủy Hỏa Thổ | **52 con quái** đều mang một nguyên tố | ⚠ **không một dòng mã nào đọc nó** — hoàn toàn vô nghĩa |
| Dị Biến (việc #89) | tên riêng ghép từ 12×10 từ + nhóm chỉ số, quái nhỏ thừa hưởng | chỉ elite |
| `EVO_PATHS` (Tiến Hoá) | 3 nhánh × 3 mốc **cấp 40/80/120** | ✅ đang chạy — trục **duy nhất** trải đều cả hành trình |

Ba cái đầu là nội dung nằm chết. Cái thứ tư là bằng chứng cách làm này chạy được: `EVO_PATHS`
đã có sẵn nhánh **Lan Toả** đổi *hành vi* thật (+45% bán kính, −22% sát thương — chuyển chiêu từ
dồn một mục tiêu sang quét cả bầy), không chỉ đổi con số.

> ⚠ **Đính chính.** Khắc Ấn **không còn** — hệ đó đã bị gỡ khi kéo game về mô hình MU. Trục "đồ
> đổi cách chiêu chạy" hiện nay là `EVO_PATHS`, không phải Khắc Ấn. Mục cũ trong CLAUDE.md mô tả
> nó như đang chạy đã được sửa lại thành cảnh báo.

---

## 3. Bốn nguyên tắc, theo thứ tự đáng làm

### ① Đừng thêm hệ thống — cho hệ thống có hồi hai, hồi ba

Không thể "đóng lại" thứ đã mở ở cấp 6. Nhưng có thể cho nó **mở sâu thêm** về sau. Ragnarok làm
thế với chuyển nghề 1 / 2 / siêu việt; MU làm với Master Level. Cùng một màn hình, ba lần thấy mới.

| Hệ | Hồi một (đã có) | Hồi hai (~cấp 50) | Hồi ba (~cấp 90) |
|---|---|---|---|
| Chimera | cấp 6 · quay ra | Chimera có **vai trò** riêng (bám `ROLE` sẵn có) | ghép hai con |
| Lò rèn | cấp 4 · +0→+9 | ngọc / dòng phụ mở thêm ô | dòng phụ **tự chọn** thay vì bốc |
| Linh Thú | cấp 8 · nuôi +N | nhánh chỉ số phân hoá | ảnh hưởng lên chiêu |

Chi phí thấp hơn hẳn một hệ mới: giao diện, dữ liệu và cách hiểu đều đã có.

### ② Đổi LUẬT rẻ hơn thêm MÀN HÌNH — nguyên tố là món rẻ nhất còn lại

52 con quái đã mang `el:` mà không làm gì. Bật nó lên ở **khoảng cấp 45**: từ đó một loại sát
thương không còn phủ hết mọi map, người chơi phải đổi đồ theo vùng.

- **Không cần một dòng giao diện mới** — dữ liệu đã nằm sẵn trên từng con quái.
- Nó biến bảy map từ "khác màu nền" thành "khác cách đánh" — tức là làm luôn phần lớn việc mà
  mục A2 (danh tính map) đang nhắm tới.
- Và nó là thứ **AUTO không tự xử lý được**: AUTO đánh, nó không đi thay đồ.

Đặt mốc ở 45 chứ không sớm hơn có lý do: trước đó người chơi còn đang học bảy hệ thống vừa mở.

### ③ Sau cấp 60, đổi từ trục dọc sang trục ngang

Sáu mươi giờ mà phần thưởng chỉ là **số to hơn** thì không giữ nổi ai. Từ mốc đó phần thưởng phải
là **lựa chọn**:

- **Phù Ác Mộng** (việc #90) — tự chọn độ khó, dòng phụ nâng nguy hiểm *và* phần thưởng cùng lúc.
- **Tiến Hoá** đã đúng hướng nhưng mới có 3 nhánh × 3 mốc. Đây là chỗ nên dày lên, không phải
  dựng lại từ đầu.
- Đại Thành ở 120 là **đích**, không phải nội dung của quãng 60-120.

### ④ Phải có đích nhìn thấy từ xa

Đại Thành ở cấp 120 quá muộn để làm động lực ở giờ thứ hai mươi. Cần một đích **nhìn thấy được từ
cấp 40** mà tới được ở 80-100 — bảng Bản Đồ đã làm đúng việc này với vùng khoá (hiện tên và dải
cấp thay vì "??? Vùng Đất Chưa Biết"); cần thêm một đích tương tự cho **sức mạnh**, không chỉ cho
nơi chốn.

---

## 4. Bản đồ pha

| Cấp | Người chơi đang học gì | Cần gì mới | Trạng thái |
|---|---|---|---|
| 1-20 | luật cơ bản + mở hệ thống | — | ✅ đủ, thậm chí hơi dồn |
| 20-45 | dùng thành thạo thứ đã mở | **vai trò quái** — bắt đầu đổi cách đánh | cần làm (mục A1) |
| 45-70 | thế giới bắt đầu phản kháng | **nguyên tố bật lên** · hồi hai của Chimera / Lò rèn | cần làm |
| 70-100 | tự chọn hướng đi | **Phù Ác Mộng** · Tiến Hoá dày thêm | cần làm (#90) |
| 100-120 | đuổi theo đích đã thấy từ lâu | Đại Thành + hậu kỳ vô hạn | một nửa đã có |

---

## 5. Hai cái bẫy

**Bẫy 1 — đa dạng mà AUTO nuốt hết thì không tính.** Nguyên tố, vai trò, dòng phụ đều **vô hình**
với người đang để AUTO chạy. Mỗi thứ thêm vào phải trả lời được đúng một câu:

> *AUTO xử lý cái này dở ở chỗ nào?*

Nếu không có câu trả lời, thứ vừa thêm chỉ là số liệu. Ba thứ có câu trả lời rõ: **Pháp Sư** (đánh
xa, AUTO lao vào), **Kẻ Tiếp Sức** (phải chọn mục tiêu, AUTO đánh con gần nhất), **nguyên tố**
(phải đi thay đồ, AUTO không làm).

**Bẫy 2 — đừng nhét thêm hệ thống vào 1-20.** Chỗ đó đã quá tải: bảy hệ thống trong mười sáu cấp.
Thêm nữa là làm hỏng phần đang chạy tốt.

---

## 6. Cách đo

| Đo cái gì | Hiện | Đích |
|---|---|---|
| Số hệ thống có **hồi mới** sau cấp 20 | 1 (Tiến Hoá) | ≥4 |
| Hồ sơ đánh khác nhau ở map cuối (loài × vai trò) | 3 | ≥12 |
| Số cấp mà **không có gì mới** liên tiếp | 99 (20→119) | ≤25 |
| Nguyên tố có tác dụng cơ học | không | có, từ cấp ~45 |

Ba con số đầu đo được bằng bài kiểm tự động. Con số thứ ba là con số đáng nhìn nhất: **99 cấp liền
không có gì mới** chính là toàn bộ câu trả lời cho câu hỏi ban đầu.
