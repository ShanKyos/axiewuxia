# Đề xuất: cấu trúc map — 10 việc, 4 đợt

Bản đề xuất chi tiết cho câu hỏi *làm sao map có cảm giác như Ragnarok Online và Path of Exile*.
Số đo hiện trạng và phần đối chiếu hai game nằm ở **[docs/CAU_TRUC_MAP.md](CAU_TRUC_MAP.md)** —
đọc cái đó trước. Tài liệu này chỉ nói **làm gì, sửa ở đâu, tốn bao nhiêu, đo bằng cách nào**.

Đây là bản gốc. Bản đọc cho dễ: https://claude.ai/code/artifact/b5c308f5-f768-4703-9236-16573307e2de
— khi hai bên lệch nhau thì **tệp này** đúng.

---

## 0. Quyết định gốc — phải chốt trước, mọi thứ khác treo vào đây

Game đang có ba thứ khiến map gần như không tồn tại: dịch chuyển tự do tới mọi map đã mở, nút
**⚔ Chọn Trận** nhảy thẳng vào một cụm quái, và **AUTO** đánh hộ. Một map đường chéo 15,4 giây,
cộng ba thứ đó, thì chỉ còn là nền phía sau ô AUTO.

| | Hướng | Được | Mất |
|---|---|---|---|
| **Đ1** | Giữ nguyên. Chỉ làm map đẹp và đa dạng hơn | Không đụng lối chơi, rủi ro ~0 | Map vẫn là nền. Làm A/C vẫn đáng, nhưng B thành vô nghĩa |
| **Đ2** | Bỏ Chọn Trận, dịch chuyển chỉ tới thành | Cảm giác Ragnarok thật nhất | Đập vào lựa chọn đã chốt cho một game trình duyệt ngồi ngắn. Rủi ro cao |
| **Đ3** ⭐ | **Giữ đường tắt để cày, nhưng đặt vào map thứ đường tắt không lấy được** | Giữ nguyên trải nghiệm cày; map có lý do tồn tại trở lại | Cần thêm nội dung (mục B3), không chỉ chỉnh số |

**Đề xuất Đ3.** Lý do: Chọn Trận + AUTO không phải lỗi, nó là câu trả lời đúng cho việc chơi
mười phút trên trình duyệt. Cái sai không phải "có đường tắt", mà là **đi đường dài không được
gì hơn**. Sửa đúng chỗ đó thì không phải gỡ gì cả.

---

## 1. Bảng việc

Cột **Chi phí** tính theo phiên làm việc; **⚠** là chỗ dễ vỡ nhất.

| Mã | Việc | Sửa ở đâu | Chi phí | Phụ thuộc |
|---|---|---|---|---|
| **A1** | Đảo ngược đường cong đa dạng bằng **Vai Trò**, không phải bằng loài mới | `MOB_ROLE`, `MAPS[].packs` | 1 | — |
| **A2** | Mỗi map một loài chủ đạo + một món rơi mang tên map | `MAPS[].desc`, `ITEM_DB`, bảng Bản Đồ | 1-2 | — |
| **A3** | Địa hình nắn đường đi thành **lối và túi** | `MAP_OBSTACLES` | 2-3 | — |
| **A4** | **Dân số** thay cho bãi toạ độ cứng | `MAPS[].packs` → `vung`, `spawnPack` | 2 | A3 |
| **B1** | Nối map bằng **rìa**, bản đồ vẽ đồ thị kề | `GATES`, `renderMapPanel` | 2 | Đ3 |
| **B2** | Dịch chuyển chỉ tới **điểm mốc** | `renderMapPanel`, `player.wpUnlocked` | 1 | Đ3, B1 |
| **B3** | ⭐ Thứ **chỉ có khi tự đi**: rương ẩn · quái hiếm lang thang · mạch quặng theo giờ | hệ mới, mượn khung `HERB_SPOTS` | 3-4 | A3 |
| **C1** | **Phù Ác Mộng** — dòng phụ map kiểu Path of Exile (việc #90) | hệ mới + `MAPS` phó bản | 4-5 | C2 |
| **C2** | Bộ **sinh địa hình** phó bản từ bộ gạch | `DGN_ROOMS`/`DGN_WALLS` → bộ sinh theo hạt giống | 3-4 | — |
| **C3** | Tầng Sâu dùng bộ sinh C2, 5 tầng đổi bộ gạch | `DEEP_HALL`, `deepNextFloor` | 1-2 | C2 |

---

## 2. Chi tiết từng việc

### A1 — Đa dạng bằng Vai Trò, không phải bằng loài mới

**Vấn đề.** Map đầu 7 loài / 10 bãi; ba map cuối đều 3 loài / 6 bãi. Thế giới nghèo dần.

**Nhưng đừng vẽ thêm quái.** Đếm được: **30 loài thường, chỉ 24 tệp art** — thêm loài là thêm
art, thêm cân bằng, thêm mọi thứ. Và dải cấp cao vốn mỏng: lv 39-56 có 3 loài, lv 79-100 có 3.

**Có sẵn một núm vặn chưa ai vặn.** `ROLE` khai **6 vai trò** (Trọng Giáp · Pháp Sư · Cận Chiến ·
Xạ Thủ · Bầy Đàn · Kẻ Tiếp Sức) với hệ số máu/công/tốc riêng và **màu viền riêng**, nhưng:

- chỉ **12/30 loài** được gán vai trò trong `MOB_ROLE`, 18 loài còn lại rơi hết về `can`;
- vai **`phap` (Pháp Sư) không loài nào dùng** — cả một nguyên mẫu chiến đấu dựng xong nằm không;
- vai `tiep` chỉ bật qua cờ `tiep:true` từng bãi, không qua `MOB_ROLE`.

**Đề xuất.** 3 loài × 6 vai trò = **18 hồ sơ đánh nhau khác nhau**, không tốn một tệp art nào.

| | Trước | Sau |
|---|---|---|
| Loài/map (3 map cuối) | 3 | 3 (giữ nguyên) |
| Vai trò/map | 1-2 | **4-5** |
| Hồ sơ đánh khác nhau/map | 3 | **12-15** |
| Loài có vai trò | 12/30 | 30/30 |
| Bãi/map | 6 | 8-9 |

Mỗi map cuối game phải có ít nhất **một bãi Pháp Sư** (ép người chơi đổi cách tiếp cận) và **một
bãi có Kẻ Tiếp Sức** (ép chọn mục tiêu). Đó là hai thứ AUTO xử lý dở nhất — cũng chính là lý do
người chơi phải tự cầm.

**⚠ Rủi ro.** Vai trò nhân thẳng vào máu/công (Trọng Giáp ×1,6 máu ×1,3 công). Đổi vai trò hàng
loạt là **đổi cân bằng**. Phải chạy lại `test_bayquai` và đo lại thời gian hạ một bãi.

**Đo.** Thêm mục vào `test_kynang5lop` hoặc bài riêng: mỗi map ≥4 vai trò, mỗi map cuối có ≥1
`phap` và ≥1 `tiep`, và số hồ sơ tăng đều theo dải cấp chứ không giảm.

---

### A2 — Danh tính map

**Vấn đề.** Bảy map khác nhau ở màu nền và dải cấp. Không map nào có câu "đi đó vì cái này".

**Đề xuất.** Mỗi map khai thêm hai trường và hiện thẳng trên bảng Bản Đồ:

```js
chuDao: 'huyetbat',              // loài chủ đạo — chiếm ~40% dân số map
monRoi: { id:'canh_buc', ten:'Cánh Bức', tyLe:0.04 },   // CHỈ rơi ở map này
```

Rồi `desc` mở đầu bằng đúng một câu kiểu Ragnarok: *"Hollow Roost — đất của Huyết Bức. Nơi duy
nhất rơi Cánh Bức."* Bảy câu như thế là bảy lý do đi, và nó rẻ.

**⚠** Món rơi độc quyền phải **thật sự cần** cho một thứ gì đó (rèn, nâng chiêu, đổi ở NPC),
không thì nó chỉ là món rác mang tên đẹp.

**Đo.** Bài kiểm: mỗi map có `chuDao` và `monRoi`; không hai map nào trùng `monRoi`; mọi `monRoi`
đều có nơi tiêu.

---

### A3 — Địa hình nắn đường đi

**Vấn đề đo được.** 4-10 khối vật cản trên **4,94 triệu px**. Cây/đá rải ngẫu nhiên có chặn
đường, nhưng rải đều nên không tạo hình. Kết quả: đồng trống. Chiêu diện rộng, cú kéo quái, và
cả việc chạy trốn đều mất ý nghĩa khi không có gì để nấp sau.

**Đề xuất.** 25-40 khối/map, **xếp thành lối và túi**, không rải:

- mỗi bãi quái nằm trong một **túi** có 1-2 lối vào (bề rộng lối 200-280px — đủ một người chạy
  qua, không đủ cả bầy tràn ra cùng lúc);
- giữa các túi là **lối** rộng 300-400px;
- ít nhất một **đường vòng** cho mỗi map, để chạy trốn là một lựa chọn có kỹ năng chứ không phải
  chạy thẳng.

**⚠ Đây là chỗ dễ vỡ nhất trong cả bản đề xuất.** Đã có tiền lệ: việc #92 phải vá "NPC kẹt trong
đá, cổng vô hình". Thêm 30 khối/map là thêm 30 cơ hội nhốt người chơi, nhốt NPC, hoặc bịt cổng.

**Bắt buộc kèm theo:** một bài kiểm **liên thông** — từ điểm thả, kiểm mọi bãi quái · mọi NPC ·
mọi cổng · mọi điểm hái đều **đi tới được**, bằng chính bộ tìm đường của game. Không có bài đó
thì đừng làm A3.

---

### A4 — Dân số thay cho bãi

**Vấn đề.** `packs` là toạ độ cứng. Cày mười lần thì mười lần y hệt.

**Đề xuất.** Đổi hình dạng dữ liệu:

```js
// trước
packs: [ { mob:'huyetbat', x:1900, y:600, n:7, tiep:true }, … ]

// sau
vung: [
  { mob:'huyetbat', role:'bay',  danSo:14, mien:{ x:1700, y:500, r:420 }, tiep:true },
  { mob:'mocnhan',  role:'nang', danSo:8,  mien:{ x:600,  y:1400, r:380 } },
],
```

Map giữ **dân số**, tự rải trong miền, tự bù khi chết — thay vì hồi sinh đúng chỗ cũ. Miền bám
theo các **túi** của A3.

**Lợi ích phụ đáng kể:** AUTO neo theo bãi (`player._autoAX/_autoAY`) vẫn chạy được vì miền có
tâm và bán kính; nhưng người chơi tự đi sẽ gặp bố cục khác nhau mỗi lượt.

**⚠** `packTiepAlive` và `syncTiepHp` bám vào mã bãi (`m.pack`). Đổi sang miền thì mã bãi phải là
mã miền, không thì buff bầy đứt.

---

### B1 — Nối map bằng rìa

**Vấn đề.** 6 cổng, tất cả đổ về thành theo hình ngôi sao. **Ba map** (Hollow Roost, Ashen
Steppe, Stormgate Pass) không có cổng nào — chỉ tới bằng dịch chuyển. Thế giới không có hình.

**Đề xuất.** Mỗi map đồng có 2-4 lối ra **ở mép** dẫn sang map kề, theo một chuỗi có hình:

```
        Frostmire Vale ── Ashen Steppe ── Stormgate Pass
              │
Petalshade Isle ── Lunaris City ── Petalshade Outskirts ── Thornwood Reach ── Hollow Roost
```

Bảng Bản Đồ vẽ **đồ thị kề nhau** thay cho danh sách dọc: nhìn một cái là biết mình đang ở đâu
trong thế giới và đi tiếp về hướng nào.

---

### B2 — Dịch chuyển chỉ tới điểm mốc

Giữ dịch chuyển tới **thành** và **một điểm mốc mỗi vùng**; chặng cuối tự đi (10-15 giây). Đủ để
không hành người chơi, đủ để map có mặt trong trí nhớ. Cột mốc đã có sẵn cơ chế `player.wpUnlocked`
— chỉ cần thu hẹp danh sách.

---

### B3 — ⭐ Thứ chỉ có khi tự đi

**Đây là câu trả lời thật cho quyết định Đ3.** Ba thứ, đều nằm ngoài tầm với của Chọn Trận:

1. **Rương ẩn** — 2-3 chỗ/map, đặt trong túi cụt của A3, hồi 20-40 phút. Rơi vật liệu rèn.
2. **Quái hiếm lang thang** — 1 con/map, đi vòng quanh map theo tuyến, không thuộc bãi nào. Máu
   cao, rơi hậu. AUTO không tìm ra nó vì nó không nằm trong bãi bị khoá.
3. **Mạch quặng theo giờ thật** — mượn đúng khung `HERB_SPOTS` đã có; mở theo khung giờ, như
   sự kiện thế giới đã làm.

Không có mục này thì B1 và B2 chỉ là bắt người chơi đi bộ để chẳng được gì — tức là làm game tệ
đi. **B3 là điều kiện để B1/B2 đáng làm.**

---

### C1 — Phù Ác Mộng: dòng phụ map

Việc **#90** trong danh sách — *"7 phó bản tĩnh thành hàng trăm biến thể"* — chính là hệ dòng phụ
map của Path of Exile. Nên làm theo đúng luật của nó:

> **Mỗi dòng phụ nâng nguy hiểm VÀ phần thưởng cùng lúc. Người chơi tự chọn.**

```js
PHU_AM = {
  bayDan:   { ten:'Bầy Dày',     hieu:{ danSo:1.5 },          thuong:{ roi:1.3 } },
  giapDay:  { ten:'Giáp Dày',    hieu:{ def:1.6 },            thuong:{ xp:1.25 } },
  nhanhChan:{ ten:'Nhanh Chân',  hieu:{ spd:1.35 },           thuong:{ bac:1.4 } },
  vaiKep:   { ten:'Vai Kép',     hieu:{ role2:true },         thuong:{ roi:1.5 } },
  …
}
```

Bốc 1-3 dòng mỗi lượt, hiện trước khi vào, nhân dồn. Bảy phó bản × ~12 dòng phụ = hàng trăm biến
thể như việc #90 đặt ra, mà không cần bảy bộ nội dung mới.

**⚠** Phần thưởng phải nhân theo **nguy hiểm thật**, không theo số dòng. Ba dòng nhẹ không được
bằng một dòng nặng.

---

### C2 — Bộ sinh địa hình phó bản

**Vấn đề.** Bảy phó bản dùng **chung một** địa hình: `DGN_ROOMS` ba phòng thẳng hàng, hai tường,
một khe cửa. Đánh phó bản thứ bảy giống hệt phó bản thứ nhất.

**Đề xuất.** Bộ sinh theo hạt giống, dựng bằng chính các khối vật cản sẵn có:

- **Bộ xương cố định theo từng phó bản** — thẳng / chẻ nhánh / sân mở. Ngẫu nhiên nhưng không
  hỗn loạn: người chơi vẫn học được cách chạy một loại phó bản.
- 3-7 phòng + hành lang, kích thước và vị trí bốc theo hạt giống.
- Hạt giống ghi vào lượt chạy để lặp lại được khi cần dò lỗi.

**⚠** Bộ tìm đường (`navInvalidate`) phải dựng lại lưới sau mỗi lần sinh. Và phải có bài kiểm
**liên thông**: sinh 200 hạt giống, mọi phòng đều tới được từ cửa vào. Bộ sinh mà nhốt người chơi
thì tệ hơn hẳn một địa hình cố định.

---

### C3 — Tầng Sâu dùng bộ sinh

Hiện **20 tầng đều là một sảnh bán kính 380** trong `pb_daohoa`. Cho nó dùng bộ sinh C2, và **5
tầng đổi một bộ gạch** để đi sâu có cảm giác đổi cảnh. Rẻ, vì C2 đã làm hết phần khó.

**⚠** Có một lý do đã ghi trong mã cho việc Tầng Sâu là *một* sảnh: AUTO quét 430px, rải quái ba
phòng cách nhau 960px thì AUTO neo phòng 1 không với tới phòng 3, tầng không bao giờ sạch. Bộ
sinh phải **giữ mọi phòng trong tầm quét**, hoặc AUTO phải biết đổi neo khi phòng sạch.

---

## 3. Lộ trình

| Đợt | Gồm | Kết quả người chơi thấy |
|---|---|---|
| **1** | A1 · A2 | Map cuối game hết nghèo. Mỗi map có tên riêng trong đầu người chơi |
| **2** | A3 + bài kiểm liên thông · A4 | Map có hình. Cày hai lượt không còn giống nhau |
| **3** | C2 · C3 · C1 | Hậu kỳ có lý do chạy lại. Việc #90 xong |
| **4** | B3 · B1 · B2 | Thế giới thành thế giới — nhưng chỉ làm nếu Đ3 được chốt |

Đợt 4 để cuối **có chủ ý**: nó là đợt duy nhất đụng vào lối chơi. Ba đợt đầu đều thêm vào mà
không lấy đi gì, nên làm được ngay và không cần chốt gì cả.

---

## 4. Cách đo là đã ăn thua

Đừng đo bằng "thấy hay hơn". Ba con số:

1. **Số hồ sơ đánh khác nhau mỗi map** (loài × vai trò). Hiện 3 ở map cuối. Đích: ≥12, và **tăng
   đều theo dải cấp**.
2. **Tỉ lệ thời gian ngoài bãi quái.** Hiện gần 0 — Chọn Trận thả thẳng vào bãi. Sau đợt 4, đích
   15-25%: đủ để map có mặt, không đủ để thành đi bộ vặt.
3. **Số lượt chạy lại một phó bản trước khi chán.** Hiện 1 (bảy phó bản cùng một địa hình). Sau
   đợt 3, đo lại bằng playtest thật.

Và một điều kiện cứng cho cả A3 lẫn C2: **bài kiểm liên thông phải xanh** trước khi nói xong.
