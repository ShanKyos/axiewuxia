# Kế hoạch phần ĐO MAP — dựng lại tầng bản đồ từ đầu

> Trạng thái: **kế hoạch, chưa cài đặt.** Viết trước khi động vào code, theo yêu cầu.
> Bối cảnh: bảy map `pb_*` đã gỡ hẳn. Máy chạy phó bản còn nguyên và chạy theo dữ liệu.
> Đọc trước: `CLAUDE.md` · CHẨN ĐOÁN GỐC · `docs/CAU_TRUC_MAP.md` · `docs/DE_XUAT_MAP.md`.

---

## 0. Vì sao phải đo trước khi dựng

Bảy phòng cũ hỏng không phải vì xấu, mà vì **không ai đo chúng**. Cả bảy cùng
`spawn:{x:1300,y:1560}`, cùng cửa ra `x:1300,y:1660`, cùng `packs:[]`, cùng `duhiep:null` —
tức là chúng được chép, không được thiết kế. Nếu lần này lại dựng bằng cảm giác thì ba tháng
nữa sẽ có đúng bài học đó lần hai.

Nên việc đầu tiên **không phải** vẽ map. Việc đầu tiên là **có con số**: một bộ thước đo chạy
được bằng máy, nói cho biết một map đang thừa gì và thiếu gì.

---

## 1. Cái đã có sẵn, không dựng lại

| Thứ | Ở đâu | Trạng thái |
|---|---|---|
| `MAP = { w:2600, h:1900 }` | `game.js:235` | mọi map dùng chung một khổ |
| Lưới tìm đường `NAV_CELL` | `game.js` ~1948 | đã có, `navInvalidate()` khi đổi địa hình |
| `MAP_OBSTACLES` | `data/canbang.js` | rect + ellipse, thủ công từng map |
| Mép vùng chặn có vật (`rimBuild`) | `game.js` ~1770 | vật cản MẮT THẤY = game THỰC THI |
| Máy chạy phó bản | `game.js` (DGN…) | nguyên vẹn, chờ dữ liệu |
| `MOB_ROLE` 6 vai | `game.js` | **12/30 loài có vai**, `phap` chưa ai dùng |
| `el:` 5 hệ trên 52 quái | `game.js` | **không dòng code nào đọc** |
| Dị Biến | `game.js` | chỉ elite |
| Bài kiểm địa hình | `tests/test_diahinh.js` | đi thử tới mọi điểm nội dung |
| Phòng bài kiểm | `tests/pbthu.js` | cắm một khoá là chạy |

---

## 2. Bốn bước, theo thứ tự

### Bước 1 — THƯỚC ĐO (`tools/do_map.py` + `tests/test_domap.js`)

Chưa vẽ gì. Viết cái cân trước.

Mỗi map ra một phiếu số:

| Chỉ số | Đo bằng gì | Vì sao đo |
|---|---|---|
| **Mật độ nội dung** | (bãi quái + NPC + thảo dược + boss) ÷ diện tích đi được | map rỗng đọc ra là map to |
| **Diện tích đi được** | đếm ô lưới nav không bị chặn ÷ tổng ô | biết vật cản đang ăn bao nhiêu |
| **Đường kính đi bộ** | quãng đường xa nhất giữa hai điểm nội dung | thời gian đi bộ giữa hai lần đánh |
| **Độ phân nhánh** | trung bình số lối ra mỗi "phòng" (cắt lưới thành vùng) | RO = nhiều nhánh · hành lang = 1 |
| **Số loài / map** | đếm loài khác nhau trong `packs` | **đang tụt 7 → 3 khi lên cấp** |
| **Vòng lặp** | có tuyến đi vòng về chỗ cũ không đi lại đường cũ? | PoE có, hành lang không |
| **Tỉ lệ điểm cụt** | vùng chỉ có 1 lối ra ÷ tổng vùng | ngõ cụt nhiều = bực |

Ra `docs/DO_MAP_HIEN_TRANG.md`: bảng 9 map × 7 chỉ số. **Đây là mốc so.** Không có nó thì
mọi câu "map mới hay hơn" chỉ là ý kiến.

Kèm `tests/test_domap.js`: chốt ngưỡng cho từng chỉ số, map mới không đạt thì đỏ.

---

### Bước 2 — LUẬT MAP (ghi vào `CLAUDE.md`)

Từ số đo bước 1, rút ra luật. Dự kiến, sẽ chốt lại sau khi có số thật:

- Số loài mỗi map **không được giảm** khi cấp tăng — sàn 5 loài.
- Mỗi map phải có **ít nhất một vòng lặp** đi được.
- Tỉ lệ ngõ cụt ≤ 25%.
- Không map nào có hai bãi quái cùng loài đứng cách nhau dưới ngưỡng X.
- Mỗi map phải có **một lý do tồn tại** ngoài "bãi cấp N-M": một thứ chỉ có ở đây.

Luật vào `CLAUDE.md` chứ không vào docs — docs phải mở mới đọc, `CLAUDE.md` thì phiên nào
cũng đọc.

---

### Bước 3 — MÁY SINH ĐỊA HÌNH (C2 trong `docs/DE_XUAT_MAP.md`)

Giờ mới dựng. Thay một địa hình tĩnh bằng máy sinh:

- Sinh theo **hạt (seed)**, không phải thuần ngẫu nhiên — cùng hạt ra cùng phòng, để còn
  chụp lại lỗi mà sửa, và để bài kiểm chạy lặp được.
- Sinh xong **tự chạy thước đo bước 1**; không đạt luật bước 2 thì bỏ, sinh lại. Máy tự
  kiểm chứ không đợi người chơi phát hiện.
- Vẫn dùng lại `MAP_OBSTACLES` / `rimBuild` / lưới nav sẵn có — không viết engine mới.

---

### Bước 4 — CẮM LẠI PHÓ BẢN

Máy phó bản chưa hề đụng tới, nên bước này chỉ là điền dữ liệu:

1. Thêm khoá `pb_<map>` vào `MAPS` (`type:'dungeon'`, `dungeon:true`) — địa hình lấy từ máy
   sinh bước 3, **không phải một hình chép bảy lần**.
2. Thêm khoá cùng tên vào `window.DUNGEONS` — khuôn nằm trong chú thích ở `data/canbang.js`.
3. Thêm cặp cổng vào/ra trong `GATES`.
4. Trả ba thứ đang đi mượn về chỗ cũ:
   - gỡ `cotBossVung()` (cầu tạm), trả cửa Cốt về "thông quan phòng";
   - `COT_DONG[*].map` trỏ lại `pb_*`;
   - `DAILY_GOALS` mục `dungeon` đổi chữ về "Thông quan 1 phó bản" (**giữ nguyên khoá** —
     bản lưu cũ đang đếm theo nó).
5. Tầng Sâu **không** mượn lại — nó đã có map riêng `deep` và cổng ra riêng.

Rồi mới tới **C1 — từ khoá biến đổi phòng** (issue #90): mỗi lượt vào bốc vài từ khoá đổi
luật phòng. Đây là chỗ "bảy phòng" thành "hàng trăm phòng", nhưng chỉ có nghĩa khi bước 3
đã xong — chồng từ khoá lên một địa hình tĩnh thì vẫn là một phòng, chỉ khác màu.

---

## 3. Thứ tự này KHÔNG đảo được

Đảo bước 3 lên trước bước 1 là làm lại đúng cái sai cũ: dựng bằng cảm giác, không có cân,
rồi ba tháng sau lại ngồi đếm xem hỏng ở đâu.

## 4. Ngoài phạm vi đợt này

Ba đòn bẩy đang nằm chết trong code — `MOB_ROLE` (18/30 loài chưa có vai), `el:` (5 hệ,
không code nào đọc), Dị Biến (chỉ elite) — là **nội dung**, không phải **địa hình**. Chúng
làm map dày lên sau khi map đã đúng hình, nên để đợt sau. Ghi ở đây để không quên.
