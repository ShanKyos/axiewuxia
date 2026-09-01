# Axie Wuxia — Bảng tên hệ thống

> **Cập nhật theo build đang chạy**, không phải bản kế hoạch. Mọi con số trong đây đo bằng cách
> chạy game rồi đọc trạng thái thật (`SECTS`, `MAPS`, `SKILL_DEFS`…), không chép tay.
> Bản trước là tài liệu Phase 0 — nó vẫn ghi 9 lớp, 8 kinh mạch bấm tay, Anima, Nhân Mạch,
> Dung Hợp Thần Công. Tất cả những thứ đó đã đổi hoặc đã gỡ; xem mục 5.

## 1. Lớp nhân vật — 5 lớp + 1 trạng thái chưa chọn

Không còn ánh xạ 9 lớp Axie. Bản chơi được rút về **5 lớp**, mỗi lớp một vai rõ ràng, đúng
hình dáng MU chứ không phải bộ ba Wild/Tide/Savage.

| id | Tên trong game | Ngũ Hành | Vai | Màu |
|---|---|---|---|---|
| `thieulam` | **Dark Knight** | Kim | Tank / Combo cận chiến | `#4c8dff` |
| `toanchan` | **Sylvan Ranger** | Thủy | Tầm xa / Hỗ trợ (range 380) | `#3a9d8b` |
| `baidasan` | **Dark Wizard** | Thủy | Pháp thuật / Độc tố (range 420) | `#7ec850` |
| `minhgiao` | **Spellblade** | Hỏa | Lai / Bộc phát Hoả | `#e8552a` |
| `bug` | **Dark Lord** | Thổ | Chỉ huy / Triệu hồi | `#8a9a3a` |
| `vophai` | **Unclassed** | — | Trạng thái trước khi chọn lớp | — |

Khoá `id` giữ tên cũ (`thieulam`, `toanchan`…) vì save của người chơi tham chiếu tới chúng —
đổi khoá là hỏng save. Chỉ `name` là thứ người chơi thấy.

## 2. Từ vựng hệ thống

| Từ nguyên mẫu (kiếm hiệp) | Trong game | Nơi trong code | Tình trạng |
|---|---|---|---|
| Đan Điền — cảnh giới | **Ascension**, 10 bậc | `DANTIAN_REALMS` | còn, nhưng **tự động theo cấp** — không còn bấm tay |
| Tu Vi | ~~Anima~~ | — | **đã gỡ**, quy về bạc (`GO_ANIMA` = 2) |
| Phi Thăng | **Starflight** | `ascendToImmortal()` | còn |
| Kinh Mạch — 8 nhánh chỉ số | **Instinct Channels** | `MERIDIANS` (8) | còn về mặt chỉ số, **bảng bấm tay đã gỡ** — nay tự đầy theo cấp |
| Chân Khí | **Instinct** | `player.khi` | còn — nay còn gánh cả vai của Tâm Đắc |
| Bạc ◈ | **Bạc** | `player.silver` | còn (tài liệu cũ ghi "Starbits" — không dùng) |
| ✦ Huyền Thiết | **Huyền Thiết** | `player.mat` | còn (tài liệu cũ ghi "Essence" — không dùng) |
| Môn Phái | **Lớp** | `SECTS` | còn |
| Thần Binh | **Thần Binh**, 10 tầng | `player.thanbinh`, `TB_TIER_NAMES` | còn |
| Bí Kíp | **Sách Kỹ Năng** | `player.bikipVH` | còn |
| Dung Hợp Thần Công | — | `FUSION_DEFS` | **rỗng** — giữ định danh để code cũ không vỡ |
| Nhân Mạch | ~~Bonds~~ | — | **đã gỡ** |
| Linh Thú (thú thuần hoá) | — | `player.pet` | **đã gỡ** — giẫm chân Thú Chiến, và không cộng chỉ số |
| Thú Cưỡi | **Thú Chiến**, 5 giai | `MOUNT_TIERS` | còn |
| Cánh | **Cánh**, 2 cấp | `WING_DEFS` | còn |
| Áo Choàng | **Áo Choàng**, 2 cấp | `CLOAK_TIERS` | còn |
| Ma Tôn Giáng Thế | **Hung Thần Giáng Thế** | `MATON` | còn |
| Tội Ác / PK cờ đỏ | **Ma Đạo** | `player.toiac` | còn |

**Pet vẫn còn — nhưng là ô trang bị, không phải thú thuần hoá.** `PET_DEFS` (3 mẫu) là món
đeo ở ô `equip.pet`, rơi từ tinh anh/boss. Thứ đã gỡ là hệ *thu phục thú đi theo* (`player.pet`,
`player.phongphu`). Hai cái tên gần nhau, đừng lẫn.

## 3. Hệ tiền tệ — sau bốn đợt gộp

Từ 26 ô đếm rút xuống, theo hình dáng MU Season 6. Bốn đợt đã làm:

| Bậc | Gộp gì | Tỉ giá | Hằng số |
|---|---|---|---|
| 1 | Anima → bạc · Công Huân Lệnh → bạc | 1:2 · 1:2000 | `GO_ANIMA`, `GO_CONGHUAN` |
| 2 | Ấn Thuần Thú → bạc (gỡ hệ thú thuần hoá) | 1:1500 | `GO_ANTHUANTHU` |
| 3 | 5 Lõi Nguyên Tố (Kim/Mộc/Thổ/Thủy/Hỏa) → 1 | 1:1, cộng dồn | — |
| 4 | Tâm Đắc → Instinct | 1:4000 | `GO_TAMDAC` |

Còn lại trên người chơi: bạc `silver` · Instinct `khi` · Huyền Thiết `mat` · Tiên Đan `tienDan` ·
Sách Kỹ Năng `bikipVH` · Lõi Nguyên Tố `noidan` · Tứ Châu `jewels` (4 loại) · ngọc `gems`
(Tử La + Hỗn Nguyên) · Bảo Hạp `baohap` (7 tầng) · 4 mảnh chế tác `mats`.

**Quy tắc cho lần gộp sau:** một loại tiền chỉ có *một nguồn* và *một chỗ tiêu* thì nó không
phải tiền tệ — nó là một cái cửa gác được viết bằng một ô đếm thừa. Gộp nó đi, và nhớ giữ lại
**sức ép thiết kế** mà nó tạo ra (xem `rw.khi` theo loại quái, chỗ Tâm Đắc chuyển vào).

## 4. Bản đồ — 8 vùng + 7 phó bản

| id | Tên | Loại |
|---|---|---|
| `tuongduong` | **Lunaris City** | thành, an toàn |
| `daohoa` | **Petalshade Isle** | 1–20, an toàn |
| `ngoai` | **Petalshade Outskirts** | 10–20, an toàn |
| `chungnam` | **Thornwood Reach** | 20–40, pk |
| `comoc` | **Hollow Roost** | 40–60, pk |
| `tuyettinh` | **Frostmire Vale** | 60–80, pk |
| `mongco` | **Ashen Steppe** | 80–100, pk |
| `nhanmon` | **Stormgate Pass** | 100+, freepk |

Bảy phó bản `pb_<id>` — **Trial Chamber: <tên vùng>** — mỗi vùng ngoài `tuongduong` một cái.
Bảng cũ không có mục này.

## 5. Những gì tài liệu cũ ghi sai

Ghi lại để lần sau đọc bản cũ ở đâu đó thì biết mà bỏ qua:

- **9 lớp Axie** (Mech/Aquatic/Dusk/Reptile/Beast/Bird/Plant/Bug/Dawn) → thực tế **5 lớp**.
  Cổ Mộ, Đoàn Thị, Đào Hoa, Dawn đều đã bỏ.
- **Anima, Nhân Mạch, Dung Hợp Thần Công, thú thuần hoá** — đã gỡ hết.
- **"Starbits" / "Essence" / "Card" / "Card Page"** — chưa bao giờ vào game; trong game vẫn là
  bạc, Huyền Thiết, chiêu thức, Sách Kỹ Năng.
- **"Steed"/Thú Cưỡi** → **Thú Chiến**.
- Thiếu hẳn: 7 phó bản, hệ Thuần Thục (Venom/Archery/Stoneform), Tứ Châu, Bảo Hạp,
  Lõi Nguyên Tố, thanh chiêu 4 ô.

## 6. Hai quy tắc đặt tên (bất di bất dịch)

1. **Phong cách là MU Online, không phải kiếm hiệp.** Cấm: cảnh giới, đan điền, chân khí,
   môn phái, giang hồ, độ kiếp, phi thăng.
2. **Không bao giờ dùng tên riêng của MU Online trong chữ người chơi thấy** — ưu tiên cao hơn
   quy tắc 1. Cấm: Kundun, Lorencia, Noria, Devias, Icarus, Atlans, Tarkan, Fairy Elf,
   Magic Gladiator, Devil Square, Blood Castle. Nhắc "MU Online" trong *comment* thì được.
