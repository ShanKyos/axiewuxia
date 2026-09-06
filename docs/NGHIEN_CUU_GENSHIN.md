# Genshin Impact — bê được gì sang thế giới ngoài trời của ta

> Nghiên cứu cho nhóm việc **A4 → B3** (`docs/DE_XUAT_MAP.md`).
> Không phải "làm giống Genshin". Genshin là 3D, có leo trèo, lượn, bơi, và một sa bàn nguyên tố
> ba chiều — phần lớn phép màu của nó **không bê được** sang 2D nhìn từ trên xuống. Tài liệu này
> tách ra đúng phần **cấu trúc**, thứ không dính gì tới chiều thứ ba.

---

## 0. Đo trước đã: thế giới ngoài trời của ta đang có gì

| Map | Cấp | Thảo dược | Cổng | **Vật thể KHÔNG phải quái** |
|---|--:|--:|--:|--:|
| Petalshade Isle | 1-12 | 8 | 0 | **8** |
| Lunaris City | — | 0 | 5 | 5 |
| Petalshade Outskirts | 14-24 | 8 | 1 | **9** |
| Thornwood Reach | 24-38 | 0 | 0 | **0** |
| Hollow Roost | 42-56 | 0 | 0 | **0** |
| Frostmire Vale | 62-78 | 0 | 0 | **0** |
| Ashen Steppe | 84-100 | 0 | 0 | **0** |
| Stormgate Pass | 102-120 | 0 | 0 | **0** |

**Từ cấp 24 trở đi, ngoài trời KHÔNG CÓ GÌ ngoài quái.** `HERB_SPOTS` chỉ khai cho hai map đầu
(daohoa và ngoai, 8 điểm mỗi map), và chỉ hai map đó bật cờ `herbs:true`. **5/7 bãi săn có đúng 0.**

> Bản đầu của bảng này ghi nhầm Outskirts là 0 thảo dược — bộ đếm của tôi bỏ sót mục cuối trong
> `HERB_SPOTS`. Số đúng là 8. Kết luận không đổi, nhưng con số thì phải đúng.

Đây là câu trả lời cho vì sao "đi bộ" trong game này chưa bao giờ đáng: **đi bộ không dẫn tới
cái gì cả**. Và nó cũng giải thích vì sao AUTO nuốt trọn được game — 100% giá trị nằm ở việc
giết, mà giết thì máy làm được.

---

## 1. Vòng lặp ngoài trời của Genshin, tháo ra

Bỏ hết phần 3D, cái còn lại là **bốn tầng nhịp khác nhau chồng lên nhau**:

| Tầng | Ví dụ trong Genshin | Nhịp | Tính chất |
|---|---|---|---|
| **Một lần** | rương, vật phẩm sưu tầm | không hồi | thưởng cho việc KHÁM PHÁ, cạn dần |
| **Chu kỳ dài** | đặc sản vùng, mạch quặng | vài ngày | thưởng cho việc THUỘC map, lặp mãi |
| **Chu kỳ ngày** | mạch địa (Ley Line), nhiệm vụ ngày | 1 ngày | ép ra ngoài HÔM NAY, đổi chỗ mỗi lần |
| **Hẹn giờ** | trùm tuần | 1 tuần | hẹn nhau |

Ba điều đáng học, không nằm ở nội dung mà ở **hình dạng**:

**① Phần thưởng nằm ở THẾ GIỚI, không nằm ở CON QUÁI.**
Trại quái canh một cái rương. Cái rương mới là mục đích, trận đánh chỉ là tiền vé. Ta thì ngược
hẳn: thưởng gắn 100% vào xác quái.

**② Vị trí CỐ ĐỊNH + hồi CHẬM = người chơi thuộc map.**
Đặc sản vùng mọc đúng chỗ, mấy ngày mới hồi. Người chơi tự vẽ ra một tuyến đi trong đầu và chạy
lại tuyến đó mỗi kỳ. Đó là "thuộc bản đồ" — thứ mà rơi ngẫu nhiên không bao giờ tạo ra được.

**③ Thứ đổi chỗ mỗi ngày là thứ ép người chơi ĐI.**
Mạch địa đổi vị trí, có hạn trong ngày, thưởng đậm. Không thể lên lịch trước, không thể tự động
hoá bằng một tuyến chạy cứng.

---

## 2. Cái gì bê được, cái gì không

| Của Genshin | Bê được? | Vì sao |
|---|:-:|---|
| Rương canh bởi trại quái | ✅ | thuần cấu trúc, không cần 3D |
| Đặc sản vùng, vị trí cố định, hồi chậm | ✅ | `HERB_SPOTS` đã là đúng khuôn này |
| Mạch địa đổi chỗ theo ngày | ✅ | **ta đã có máy rồi** — xem §3 |
| Nhiệm vụ ngày ở vị trí ngẫu nhiên | ✅ | có sẵn "Mục Tiêu Hôm Nay" |
| Nhìn từ điểm cao thấy bóng đồ vật | ⚠ một nửa | 2D không có điểm cao; thay bằng gợi ý ở mép màn |
| Nguyên tố phản ứng với **môi trường** | ⚠ đắt | ta có `el:` sẵn, nhưng cần vật thể môi trường phản ứng — việc lớn |
| Leo / lượn / bơi | ❌ | không có chiều thứ ba |
| Câu đố cơ quan | ❌ | 2D + đi bằng chuột thì câu đố thành phiền |
| Nhựa (resin) | ❌ | **cố ý không** — xem §5 |
| Hàng trăm vật phẩm sưu tầm | ❌ | **cố ý không** — xem §5 |

---

## 3. Thứ ta đã có mà chưa biết là mình có

`MATON` (Hung Thần Giáng Thế) **chính là một Mạch Địa**, chỉ khác là nó ra một con boss:

```
mỗi 4 giờ thật → chọn map theo khe thời gian → báo trước 10 phút → sống 30 phút → rơi Box Kundun
```

Cấu trúc "sự kiện có hẹn, đổi map, có hạn giờ, thưởng đậm" **đã chạy trong game**. Điều nó còn
thiếu so với Mạch Địa là hai thứ nhỏ:

- nó luôn ra ở **một toạ độ cố định** (`MAP.w*0.55, MAP.h*0.42`) — nên vẫn lên lịch cứng được;
- nó là **một trận đánh**, không phải một **điểm thu hoạch**.

Nghĩa là B3 mục 3 ("mạch quặng theo giờ") **không phải xây mới** — là mở rộng một hệ đang sống.
Rẻ hơn hẳn ước tính 3-4 phiên trong đề xuất.

---

## 4. Ánh xạ thẳng vào A4 → B3

| Việc | Genshin dạy gì | Đổi gì so với đề xuất cũ |
|---|---|---|
| **A4** dân số thay bãi | trại quái là **tiền vé** cho một cái rương | thêm: mỗi miền dân số **canh một** vật thể thế giới. Không có nó, A4 chỉ là rải quái ngẫu nhiên |
| **B3.1** rương ẩn | rương **KHÔNG hồi** — cạn là hết | đề xuất cũ ghi "hồi 20-40 phút" → **sai kiểu**. Hồi nhanh thì nó thành bãi farm và AUTO ăn được. Nên: rương một-lần-mỗi-nhân-vật, và **riêng** một loại hòm hồi chậm cho phần lặp |
| **B3.2** quái hiếm lang thang | — | giữ nguyên, ý đã đúng |
| **B3.3** mạch quặng theo giờ | mạch địa **đổi chỗ**, không chỉ đổi map | thêm: đổi **toạ độ** trong map, không chỉ đổi map. Đây là chỗ AUTO không lên lịch cứng được |
| **B1** nối map bằng rìa | đi bộ chỉ đáng khi dọc đường có thứ để nhặt | giữ **thứ tự**: B3 trước B1. Tài liệu cũ đã nói đúng, Genshin xác nhận |
| **B2** dịch chuyển tới điểm mốc | điểm dịch chuyển là **phần thưởng khám phá** | thêm: mở điểm mốc bằng **đi tới lần đầu**, không phải bằng nhiệm vụ |

**Một luật mới, rút từ ① — đề nghị đưa vào `CLAUDE.md` nếu bạn duyệt:**

> Mỗi map phải có **ít nhất một nguồn giá trị không đi qua xác quái**.
> Đây là thứ duy nhất AUTO về cấu trúc không nuốt được, và cũng là thứ duy nhất khiến "đi bộ"
> đáng làm. Hiện 5/8 map đang có **con số 0**.

---

## 5. Cố ý KHÔNG bắt chước

**Nhựa (resin).** Trần năng lượng ngày là hệ bị ghét nhất của Genshin. Game này có AUTO và cày
nhàn làm cốt lõi — cắm một cái trần cứng vào là đánh nhau với chính lối chơi của mình. Ta đã có
"cửa mềm" (ba lượt đầu rơi đủ, sau đó giảm) — đó là cách đúng cho game này.

**Hàng trăm vật phẩm sưu tầm.** Rải 240 món khắp 8 map là **khối lượng, không phải thiết kế** —
đúng cái bệnh nhân bản đã chẩn đoán ở `CLAUDE.md`. Chỉ đáng làm nếu mỗi món cắm vào một trục
tiến trình thật.

**Câu đố.** Genshin đi bằng WASD và ngắm bằng chuột nên câu đố cơ quan chơi được. Ta đi bằng cách
bấm chuột rồi nhân vật tự chạy — mọi câu đố cần đứng đúng chỗ, đúng thứ tự sẽ thành cuộc vật lộn
với bộ tìm đường, không phải với câu đố.

---

## 6. Thứ tự tôi đề nghị, sau nghiên cứu này

1. **B3.3 mạch thu hoạch đổi chỗ** — rẻ nhất, vì `MATON` đã có sẵn khung, và nó là mục duy nhất
   cho ngay một lý do "hôm nay phải ra ngoài".
2. **B3.1 rương canh bởi trại quái** — dựng khái niệm "vật thể thế giới có người canh". Đây là
   viên gạch mà A4 và B1 đều dựa vào.
3. **A4 dân số** — giờ mới làm, vì mỗi miền đã có thứ để canh.
4. **B1 + B2** — cuối cùng, khi dọc đường đã có thứ đáng dừng lại.

Đảo thứ tự này (làm B1 trước) là bắt người chơi đi bộ qua tám bãi trống.
