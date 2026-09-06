# Boss là nội dung TỔ ĐỘI — và boss phải mang bản sắc Axie

Ghi lại chủ đích thiết kế do chủ dự án chốt (2026-09-06). Đây là **ghi chú định hướng**, chưa
phải bản thiết kế thi công — chưa sửa một dòng mã nào.

---

## 1. Chủ đích

**Vòng lặp thường ngày là một mình.** Người chơi tu luyện, đi farm đồ ở các map. Đó là phần
chiếm phần lớn thời gian, và nó giữ nguyên như hiện nay.

**Boss thì không.** Boss là chỗ người chơi gặp nhau, theo hai kiểu:

| Kiểu | Hình dung | Tương ứng trong tài liệu online |
|---|---|---|
| **Boss phòng** | vào một map boss riêng theo **tổ đội** | `pb_*` đã được xếp là **instance riêng, 1 tổ đội** (THIET_KE_ONLINE §5) |
| **Boss thế giới** | cả server cùng đi săn một con, chung một bản đồ | chưa có trong tài liệu online — cần thêm |

Đây là điểm khác căn bản so với bản hiện tại: **16 boss đang có đều là boss đơn**, đánh một
mình, nằm rải trong map thường.

---

## 2. Hai điều kiện chặn, phải biết trước

### ⚠ Tổ đội = phải lên online trước

Game hiện là bản chạy một máy, lưu trong trình duyệt. "Tổ đội" và "cả server cùng săn" **không
làm được** trước khi có máy chủ. Việc đó đã có bản khảo sát và thiết kế riêng:
[THIET_KE_ONLINE.md](THIET_KE_ONLINE.md) — chủ dự án đã chốt CCU 50, có PvP, có giao dịch.

Nghĩa là ghi chú này **treo sau** cột mốc online, không làm trước được. Nhưng nó **đổi thứ tự ưu
tiên của việc online**: nếu boss tổ đội là đích, thì tổ đội + instance là tính năng phải có ở
đợt đầu, không phải đợt sau.

Ở mức CCU 50, boss thế giới chung một bản đồ là **rẻ** — không cần chia kênh, không cần chia mảnh.

### ⚠ "Kundun" là tên riêng của MU Online

Quy tắc số 2 trong CLAUDE.md cấm tên riêng MU trong text người chơi thấy, và ghi rõ **ngoại lệ
duy nhất đã duyệt là "Box Kundun"** (hệ hộp mở đồ). Đặt tên một con boss là "Kundun Axie" sẽ là
lần thứ hai ship tên riêng của MU thành nội dung.

Ba lối đi, chủ dự án chọn:

1. **Giữ nguyên mẫu, đổi tên.** Con boss thế giới mà cả server cùng săn vẫn tồn tại — chỉ mang
   tên riêng của Lunacia. Nó **vẫn** là "con Kundun của game này" trong miệng người chơi, giống
   hệt cách người chơi tự đặt biệt danh. Đây là lối tôi đề xuất.
2. **Mở rộng ngoại lệ.** Chốt thêm một lần nữa rằng "Kundun" được dùng cho cả boss, chấp nhận
   rủi ro đã nêu ở quy tắc số 2. Nếu chọn lối này thì phải **sửa CLAUDE.md** cho khớp, không thì
   phiên sau sẽ "sửa ngược" tưởng là sót.
3. Bỏ luôn cả "Box Kundun". *(Chủ dự án đã bác lối này trước đây.)*

Hai cái tên còn lại trong ghi chú — **rồng đỏ**, **phù thủy đỏ** — không phải tên riêng MU, dùng
thoải mái.

---

## 3. Bản sắc Axie cho boss — và vì sao nó cần làm dù thế nào

Đây là vibeathon của Axie, nên boss phải **ra chất Axie**, không phải "một con quái fantasy
chung chung phóng to". Ghi chú của chủ dự án nêu hướng: rồng đỏ Axie, phù thủy đỏ Axie, v.v.

Đúng lúc, vì bộ boss hiện tại đang có vấn đề danh tính đo được:

| Tên | Dùng mấy lần |
|---|---|
| Cốt Tướng | lv18 · lv24 |
| Nữ Vu Bóng Tối | lv36 · lv54 |
| Tướng Quân Vàng | lv74 · lv94 |
| Thủ Lĩnh Gloam / Thủ Lĩnh Đoàn Gloam | lv10 · lv16 (gần trùng) |

**8 trong 16 boss dùng lại tên của nhau** hoặc gần trùng. Người chơi hạ Cốt Tướng ở cấp 18 rồi
gặp lại Cốt Tướng ở cấp 24 — cùng một cái tên, khác mỗi con số.

Nên đợt làm bản sắc Axie cho boss **giải quyết luôn** việc này: mỗi boss một tên riêng, một hình
riêng, một lý do tồn tại riêng.

### Nguồn art đã có

Kho `axie-origins-asset-kit` có rig Spine của Axie thật, và đường nướng đã dựng sẵn
(`tools/spine/nuong_chi.py` đã nướng 16 Chimera từ đó). Boss có thể đi cùng đường: lấy rig Axie,
phóng to, đổi bảng màu, thêm phụ kiện — **ra chất Axie mà không cần vẽ từ đầu**.

⚠ Nhắc lại quy tắc số 3: **không vector**. Boss art đi đường Spine hoặc gói art thật, như mọi
thứ khác.

---

## 4. Việc phát sinh, chưa xếp lịch

| | Việc | Chặn bởi |
|---|---|---|
| B-1 | Chốt lối đi cho cái tên (mục 2) | chủ dự án |
| B-2 | Đặt lại tên + lý do tồn tại cho 16 boss, bỏ trùng | — |
| B-3 | Nướng art boss từ rig Axie | B-2 |
| B-4 | Tổ đội + instance boss phòng | cột mốc online |
| B-5 | Boss thế giới: lịch xuất hiện, chia thưởng, chống kê công | B-4 |

**B-2 và B-3 làm được ngay bây giờ**, không cần chờ online: chúng chỉ là nội dung và art cho
những con boss đã tồn tại. B-4/B-5 mới là phần treo sau máy chủ.
