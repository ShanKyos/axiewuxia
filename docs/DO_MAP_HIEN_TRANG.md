# Đo bản đồ — hiện trạng

> Sinh bằng `tools/do_map.js`. **ĐỪNG SỬA TAY** — chạy lại tệp đó.
> Đo bằng chính lưới tìm đường của game (ô 24px trên khổ 2600×1900),
> nên số ở đây là thứ game THỰC THI, không phải một mô hình riêng.
> Đây là **mốc so** cho bước 3 của `docs/KE_HOACH_DO_MAP.md`.

## Bảng số

| Map | Cấp | Đi được | Điểm | Mật độ | Loài | **Vật che** | Đường kính | Điểm kề |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| **Petalshade Isle**<br>`daohoa` | 1 | 86.4% | 25 | 3.32 | 7 | **24.5%** | 1848px | 168px |
| **Lunaris City**<br>`tuongduong` | 1 | 49.1% | 13 | 3.04 | 0 | **29.5%** | 1440px | 216px |
| **Petalshade Outskirts**<br>`ngoai` | 10 | 79.4% | 22 | 3.18 | 6 | **29%** | 2064px | 216px |
| **Thornwood Reach**<br>`chungnam` | 20 | 74.3% | 12 | 1.85 | 4 | **27.1%** | 1776px | 312px |
| **Hollow Roost**<br>`comoc` | 40 | 61.1% | 11 | 2.06 | 3 | **48.9%** | 1920px | 384px |
| **Frostmire Vale**<br>`tuyettinh` | 60 | 62.6% | 12 | 2.2 | 3 | **38.6%** | 1896px | 288px |
| **Ashen Steppe**<br>`mongco` | 80 | 91% | 11 | 1.39 | 3 | **8.9%** | 1728px | 312px |
| **Stormgate Pass**<br>`nhanmon` | 100 | 64.1% | 12 | 2.15 | 3 | **34.2%** | 2352px | 312px |

**Trung bình:** đi được 71.0% · mật độ 2.4 · loài 3.6 · **vật che 30.1%** · đường kính 1878.0px · điểm kề 276.0px

## Từng cột nói gì

| Cột | Nghĩa | Đọc thế nào |
|---|---|---|
| **Đi được** | % ô lưới không bị vật cản | thấp = vật cản ăn mất map |
| **Điểm nội dung** | bãi quái + NPC + thảo dược + boss + cổng | thứ người chơi thật sự đi tới |
| **Mật độ** | điểm nội dung trên 1000 ô đi được | thấp = map rỗng, đọc ra là map to |
| **Loài** | số loài quái khác nhau trong `packs` | **đây là chỉ số đang tụt khi lên cấp** |
| **Vật che** | % đất đi được có khối ≥53px trong tầm 120px | **đây là chỉ số chấm "có địa hình để đánh nhau"** |
| **Trụ** | số trụ đá đặt có chủ ý quanh bãi quái & khoảng trống | 0 = map chưa có địa hình cỡ trận đánh |

> **Zoom:** camera phóng GẦN 1,75× · VỪA 1,45× · XA 1,0× (Cài Đặt · Tầm nhìn). Ở mức VỪA, một khung hình 1920×1080
> chỉ chứa 1324×745 thế giới — cả map bằng ~5.0 màn hình thay vì 2,4.
| **Đường kính** | quãng đi bộ xa nhất giữa hai điểm nội dung | thời gian đi bộ tệ nhất |
| **Điểm kề** | trung vị quãng từ một điểm tới điểm gần nó nhất | nhịp giữa hai lần đánh |
| **Có vòng** | bịt đường ngắn nhất rồi vẫn tới được? | ✅ = đi về không phải lộn lại đường cũ |

## Đọc ra gì

**1. Càng lên cấp, thế giới càng nghèo đi.**

Số loài theo cấp: 1→**7** · 10→**6** · 20→**4** · 40→**3** · 60→**3** · 80→**3** · 100→**3**

Từ `daohoa` (cấp 1) tới `nhanmon` (cấp 100): loài **7 → 3**, điểm nội dung **25 → 12**, mật độ **3.32 → 2.15** (-35%).
Người chơi càng chơi lâu càng nhận được ÍT hơn — đúng chiều ngược với mọi game cày.

**2. Không map nào có HÌNH.**

Tỉ lệ hành lang cao nhất trong 8 map là **2.1%**. Nghĩa là gần như toàn bộ diện tích đi được là bãi trống liền một khối: không phòng, không lối hẹp, không chỗ nào bắt phải chọn đường. Cột "Có vòng" toàn ✅ nhưng **không nói lên gì** — trên một bãi trống thì đi hướng nào cũng tới. Đây mới là chỗ khác Ragnarok và Path of Exile, không phải kích thước map.

**3. Đường kính ~1878.0px trên khổ 2600×1900.**

Tức là hai điểm xa nhau nhất gần bằng cả đường chéo map — nội dung bị rải ra tận bốn mép thay vì gom thành cụm. Cộng với mục 2 (không có hình), quãng đường đó là đi bộ suông.

**4. Nhịp đánh thưa dần đúng lúc nội dung nghèo đi.**

Quãng tới điểm gần nhất: 1→**168px** · 10→**216px** · 20→**312px** · 40→**384px** · 60→**288px** · 80→**312px** · 100→**312px**

Từ `daohoa` tới `nhanmon`, quãng đi bộ giữa hai lần đánh tăng **168 → 312px** (+86%). Cộng dồn với mục 1: ít loài hơn, ít điểm hơn, mà lại phải đi xa hơn giữa hai lần đánh.


## Chi tiết từng map

### Petalshade Isle `daohoa` — cấp 1+ · safe

- Loài (7): boar · hautu · wolf · bandit · caodo · assassin · trannhan
- Hai điểm xa nhau nhất: Trưởng Làng ↔ Thủ Lĩnh Đoàn Gloam — 1848px

### Lunaris City `tuongduong` — cấp 1+ · safe

- Loài (0): _không có bãi quái_
- Hai điểm xa nhau nhất: Cổng Tây → Petalshade Isle ↔ Cổng Đông → Thornwood Reach — 1440px

### Petalshade Outskirts `ngoai` — cấp 10+ · safe

- Loài (6): boar_tusk · wolf_alpha · bandit_vet · caodo_fire · gloam_scout · chimera_bo
- Hai điểm xa nhau nhất: chimera_bo ↔ thảo dược — 2064px

### Thornwood Reach `chungnam` — cấp 20+ · pk

- Loài (4): chimera_bo · phando · xanu · bandao
- Hai điểm xa nhau nhất: Người Gác Rừng Corran ↔ Skyreach Ledge · Vực Thẳm — 1776px

### Hollow Roost `comoc` — cấp 40+ · pk

- Loài (3): thinu · mocnhan · huyetbat
- Hai điểm xa nhau nhất: mocnhan ↔ Tướng Quân Hollow Roost — 1920px

### Frostmire Vale `tuyettinh` — cấp 60+ · pk

- Loài (3): ttdetu · docyeu · satthuhy
- Hai điểm xa nhau nhất: Sorrowfall Cliff · Vực Thẳm ↔ Tướng Quân Frostmire Vale — 1896px

### Ashen Steppe `mongco` — cấp 80+ · pk

- Loài (3): thamtu · cungthu · kybinh
- Hai điểm xa nhau nhất: Dax, Kẻ Do Thám ↔ Tướng Quân Ashen Steppe — 1728px

### Stormgate Pass `nhanmon` — cấp 100+ · freepk

- Loài (3): cuongbinh · kylan · daokhach
- Hai điểm xa nhau nhất: Lão Tướng Brann ↔ Tướng Quân Stormgate Pass — 2352px

