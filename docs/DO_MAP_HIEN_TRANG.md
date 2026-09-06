# Đo bản đồ — hiện trạng

> Sinh bằng `tools/do_map.js`. **ĐỪNG SỬA TAY** — chạy lại tệp đó.
> Đo bằng chính lưới tìm đường của game (ô 24px trên khổ 2600×1900),
> nên số ở đây là thứ game THỰC THI, không phải một mô hình riêng.
> Đây là **mốc so** cho bước 3 của `docs/KE_HOACH_DO_MAP.md`.

## Bảng số

| Map | Cấp | Đi được | Điểm | Mật độ | Loài | **Vật che** | Trụ | Đường kính | Điểm kề |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| **Petalshade Isle**<br>`daohoa` | 1 | 79.7% | 25 | 3.6 | 7 | **38.9%** | 43 | 1848px | 192px |
| **Lunaris City**<br>`tuongduong` | 1 | 49.1% | 13 | 3.03 | 0 | **29.6%** | 0 | 1440px | 216px |
| **Petalshade Outskirts**<br>`ngoai` | 10 | 73.3% | 22 | 3.44 | 6 | **47.2%** | 44 | 1848px | 264px |
| **Thornwood Reach**<br>`chungnam` | 20 | 69.3% | 12 | 1.99 | 4 | **50.8%** | 38 | 1848px | 288px |
| **Hollow Roost**<br>`comoc` | 40 | 56.6% | 11 | 2.23 | 3 | **62.8%** | 32 | 1776px | 384px |
| **Frostmire Vale**<br>`tuyettinh` | 60 | 57.5% | 12 | 2.39 | 3 | **59.1%** | 34 | 1896px | 336px |
| **Ashen Steppe**<br>`mongco` | 80 | 85% | 11 | 1.48 | 3 | **21.8%** | 44 | 1800px | 384px |
| **Stormgate Pass**<br>`nhanmon` | 100 | 59.4% | 12 | 2.32 | 3 | **49%** | 30 | 2352px | 336px |

**Trung bình:** đi được 66.2% · mật độ 2.6 · loài 3.6 · **vật che 44.9%** · đường kính 1851.0px · điểm kề 300.0px

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

Từ `daohoa` (cấp 1) tới `nhanmon` (cấp 100): loài **7 → 3**, điểm nội dung **25 → 12**, mật độ **3.6 → 2.32** (-36%).
Người chơi càng chơi lâu càng nhận được ÍT hơn — đúng chiều ngược với mọi game cày.

**2. Không map nào có HÌNH.**

Tỉ lệ hành lang cao nhất trong 8 map là **4.5%**. Nghĩa là gần như toàn bộ diện tích đi được là bãi trống liền một khối: không phòng, không lối hẹp, không chỗ nào bắt phải chọn đường. Cột "Có vòng" toàn ✅ nhưng **không nói lên gì** — trên một bãi trống thì đi hướng nào cũng tới. Đây mới là chỗ khác Ragnarok và Path of Exile, không phải kích thước map.

**3. Đường kính ~1851.0px trên khổ 2600×1900.**

Tức là hai điểm xa nhau nhất gần bằng cả đường chéo map — nội dung bị rải ra tận bốn mép thay vì gom thành cụm. Cộng với mục 2 (không có hình), quãng đường đó là đi bộ suông.

**4. Nhịp đánh thưa dần đúng lúc nội dung nghèo đi.**

Quãng tới điểm gần nhất: 1→**192px** · 10→**264px** · 20→**288px** · 40→**384px** · 60→**336px** · 80→**384px** · 100→**336px**

Từ `daohoa` tới `nhanmon`, quãng đi bộ giữa hai lần đánh tăng **192 → 336px** (+75%). Cộng dồn với mục 1: ít loài hơn, ít điểm hơn, mà lại phải đi xa hơn giữa hai lần đánh.


## Chi tiết từng map

### Petalshade Isle `daohoa` — cấp 1+ · safe

- Loài (7): boar · hautu · wolf · bandit · caodo · assassin · trannhan
- Hai điểm xa nhau nhất: Trưởng Làng ↔ Thủ Lĩnh Đoàn Gloam — 1848px

### Lunaris City `tuongduong` — cấp 1+ · safe

- Loài (0): _không có bãi quái_
- Hai điểm xa nhau nhất: Cổng Tây → Petalshade Isle ↔ Cổng Đông → Thornwood Reach — 1440px

### Petalshade Outskirts `ngoai` — cấp 10+ · safe

- Loài (6): boar_tusk · wolf_alpha · bandit_vet · caodo_fire · gloam_scout · chimera_bo
- Hai điểm xa nhau nhất: thảo dược ↔ thảo dược — 1848px

### Thornwood Reach `chungnam` — cấp 20+ · pk

- Loài (4): chimera_bo · phando · xanu · bandao
- Hai điểm xa nhau nhất: phando ↔ Skyreach Ledge · Vực Thẳm — 1848px

### Hollow Roost `comoc` — cấp 40+ · pk

- Loài (3): thinu · mocnhan · huyetbat
- Hai điểm xa nhau nhất: Sylas, Người Giữ Tổ ↔ Tướng Quân Hollow Roost — 1776px

### Frostmire Vale `tuyettinh` — cấp 60+ · pk

- Loài (3): docyeu · ttdetu · satthuhy
- Hai điểm xa nhau nhất: Sorrowfall Cliff · Vực Thẳm ↔ Tướng Quân Frostmire Vale — 1896px

### Ashen Steppe `mongco` — cấp 80+ · pk

- Loài (3): thamtu · cungthu · kybinh
- Hai điểm xa nhau nhất: thamtu ↔ Tướng Quân Ashen Steppe — 1800px

### Stormgate Pass `nhanmon` — cấp 100+ · freepk

- Loài (3): cuongbinh · kylan · daokhach
- Hai điểm xa nhau nhất: Lão Tướng Brann ↔ Tướng Quân Stormgate Pass — 2352px

