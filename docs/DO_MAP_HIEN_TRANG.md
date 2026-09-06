# Đo bản đồ — hiện trạng

> Sinh bằng `tools/do_map.js`. **ĐỪNG SỬA TAY** — chạy lại tệp đó.
> Đo bằng chính lưới tìm đường của game (ô 24px trên khổ 2600×1900),
> nên số ở đây là thứ game THỰC THI, không phải một mô hình riêng.
> Đây là **mốc so** cho bước 3 của `docs/KE_HOACH_DO_MAP.md`.

## Bảng số

| Map | Cấp | Đi được | Điểm nội dung | Mật độ | Loài | Hành lang | Đường kính | Điểm kề | Có vòng |
|---|--:|--:|--:|--:|--:|--:|--:|--:|:-:|
| **Petalshade Isle**<br>`daohoa` | 1 | 85.7% | 25 | 3.34 | 7 | 2% | 1848px | 168px | ✅ |
| **Lunaris City**<br>`tuongduong` | 1 | 49.2% | 13 | 3.03 | 0 | 0.3% | 1440px | 216px | ✅ |
| **Petalshade Outskirts**<br>`ngoai` | 10 | 79.3% | 22 | 3.18 | 6 | 1.8% | 1848px | 264px | ✅ |
| **Thornwood Reach**<br>`chungnam` | 20 | 73.7% | 12 | 1.87 | 4 | 1.5% | 1848px | 288px | ✅ |
| **Hollow Roost**<br>`comoc` | 40 | 60.4% | 11 | 2.09 | 3 | 1.8% | 1728px | 384px | ✅ |
| **Frostmire Vale**<br>`tuyettinh` | 60 | 62.1% | 12 | 2.22 | 3 | 2% | 1896px | 336px | ✅ |
| **Ashen Steppe**<br>`mongco` | 80 | 90.6% | 11 | 1.39 | 3 | 1.1% | 1800px | 384px | ✅ |
| **Stormgate Pass**<br>`nhanmon` | 100 | 63.5% | 12 | 2.17 | 3 | 1% | 2352px | 336px | ✅ |

**Trung bình:** đi được 70.6% · mật độ 2.4 · loài 3.6 · hành lang 1.4% · đường kính 1845.0px · điểm kề 297.0px

## Từng cột nói gì

| Cột | Nghĩa | Đọc thế nào |
|---|---|---|
| **Đi được** | % ô lưới không bị vật cản | thấp = vật cản ăn mất map |
| **Điểm nội dung** | bãi quái + NPC + thảo dược + boss + cổng | thứ người chơi thật sự đi tới |
| **Mật độ** | điểm nội dung trên 1000 ô đi được | thấp = map rỗng, đọc ra là map to |
| **Loài** | số loài quái khác nhau trong `packs` | **đây là chỉ số đang tụt khi lên cấp** |
| **Hành lang** | % ô thoáng chỉ có ≤2 hàng xóm trực giao thoáng | cao = ống nước · thấp = cánh đồng |
| **Đường kính** | quãng đi bộ xa nhất giữa hai điểm nội dung | thời gian đi bộ tệ nhất |
| **Điểm kề** | trung vị quãng từ một điểm tới điểm gần nó nhất | nhịp giữa hai lần đánh |
| **Có vòng** | bịt đường ngắn nhất rồi vẫn tới được? | ✅ = đi về không phải lộn lại đường cũ |

## Đọc ra gì

**1. Càng lên cấp, thế giới càng nghèo đi.**

Số loài theo cấp: 1→**7** · 10→**6** · 20→**4** · 40→**3** · 60→**3** · 80→**3** · 100→**3**

Từ `daohoa` (cấp 1) tới `nhanmon` (cấp 100): loài **7 → 3**, điểm nội dung **25 → 12**, mật độ **3.34 → 2.17** (-35%).
Người chơi càng chơi lâu càng nhận được ÍT hơn — đúng chiều ngược với mọi game cày.

**2. Không map nào có HÌNH.**

Tỉ lệ hành lang cao nhất trong 8 map là **2%**. Nghĩa là gần như toàn bộ diện tích đi được là bãi trống liền một khối: không phòng, không lối hẹp, không chỗ nào bắt phải chọn đường. Cột "Có vòng" toàn ✅ nhưng **không nói lên gì** — trên một bãi trống thì đi hướng nào cũng tới. Đây mới là chỗ khác Ragnarok và Path of Exile, không phải kích thước map.

**3. Đường kính ~1845.0px trên khổ 2600×1900.**

Tức là hai điểm xa nhau nhất gần bằng cả đường chéo map — nội dung bị rải ra tận bốn mép thay vì gom thành cụm. Cộng với mục 2 (không có hình), quãng đường đó là đi bộ suông.

**4. Nhịp đánh thưa dần đúng lúc nội dung nghèo đi.**

Quãng tới điểm gần nhất: 1→**168px** · 10→**264px** · 20→**288px** · 40→**384px** · 60→**336px** · 80→**384px** · 100→**336px**

Từ `daohoa` tới `nhanmon`, quãng đi bộ giữa hai lần đánh tăng **168 → 336px** (+100%). Cộng dồn với mục 1: ít loài hơn, ít điểm hơn, mà lại phải đi xa hơn giữa hai lần đánh.


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
- Hai điểm xa nhau nhất: Sylas, Người Giữ Tổ ↔ Tướng Quân Hollow Roost — 1728px

### Frostmire Vale `tuyettinh` — cấp 60+ · pk

- Loài (3): docyeu · ttdetu · satthuhy
- Hai điểm xa nhau nhất: Sorrowfall Cliff · Vực Thẳm ↔ Tướng Quân Frostmire Vale — 1896px

### Ashen Steppe `mongco` — cấp 80+ · pk

- Loài (3): thamtu · cungthu · kybinh
- Hai điểm xa nhau nhất: thamtu ↔ Tướng Quân Ashen Steppe — 1800px

### Stormgate Pass `nhanmon` — cấp 100+ · freepk

- Loài (3): cuongbinh · kylan · daokhach
- Hai điểm xa nhau nhất: Lão Tướng Brann ↔ Tướng Quân Stormgate Pass — 2352px

