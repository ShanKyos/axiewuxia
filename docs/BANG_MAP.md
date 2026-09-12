# Bảng map — hiện trạng

> Sinh bằng `tools/bang_map.js`. **ĐỪNG SỬA TAY** — chạy lại tệp đó.
> Số đọc từ GAME ĐANG CHẠY (`packsOf` · `_navGrid` · `mapBanSac`), nên đây là thứ người
> chơi thật sự gặp. Khác `docs/DO_MAP_HIEN_TRANG.md`: tệp ấy là MỐC SO đóng băng của một
> đợt đo cũ và cố ý không cập nhật.

## 1. Xếp theo DẢI CẤP

| # | Map | Dải cấp | Mở ở | Loại | Khổ | Sàn | Miền | Bãi | Loài | Quái | Thuốc | NPC | Hệ trội |
|--:|---|---|--:|---|---|--:|--:|--:|--:|--:|--:|--:|---|
| 1 | **Rẻo Rừng Corran**<br>`corran` | 1 - 12 | 1 | An Toàn | 5200×3800 | 74% | 7 | 18 | 7 | 103 | 12 | 3 | Mộc |
| 2 | **Beast Herd Camp**<br>`ngoai` | 14 - 24 | 10 | An Toàn | 4400×3300 | 72.3% | 6 | 16 | 6 | 105 | 8 | 1 | Thủy |
| 3 | **Werebear Woods**<br>`chungnam` | 24 - 38 | 20 | PK | 4600×3400 | 74.4% | 6 | 18 | 4 | 118 | 10 | 2 | Thủy |
| 4 | **Plant Tribe Glade**<br>`daohoa` | 38 - 48 | 36 | PK | 4600×3400 | 79.6% | 6 | 18 | 3 | 118 | 10 | 0 | Mộc |
| 5 | **Lối Mòn Corran**<br>`loimon` | 42 - 48 | 40 | PK | 6400×1400 | 31.9% | 3 | 6 | 3 | 54 | 8 | 0 | Mộc |
| 6 | **Bug Tribe Tunnels**<br>`comoc` | 42 - 56 | 40 | PK | 4800×3600 | 75.1% | 6 | 18 | 3 | 120 | 10 | 1 | Mộc |
| 7 | **Trũng Nứt Corran**<br>`trungnut` | 44 - 50 | 44 | Free PK | 4200×3200 | 69.3% | 4 | 9 | 3 | 67 | 10 | 0 | Thổ |
| 8 | **Aquatic Tribe Causeway**<br>`caungam` | 56 - 62 | 54 | PK | 2803×2808 | 29.5% | 3 | 9 | 3 | 64 | 9 | 0 | Thủy |
| 9 | **Bird Tribe Heights**<br>`tuyettinh` | 62 - 78 | 60 | PK | 4800×3600 | 77.5% | 6 | 18 | 3 | 119 | 10 | 2 | Thổ |
| 10 | **Reptile Sunstone Flats**<br>`mongco` | 84 - 100 | 80 | PK | 5000×3700 | 74.4% | 6 | 18 | 3 | 120 | 10 | 1 | Thổ |
| 11 | **Dusk Marsh**<br>`nhanmon` | 102 - 120 | 100 | Free PK | 5200×3800 | 78.7% | 7 | 21 | 3 | 129 | 10 | 2 | Hỏa |

*Ngoài dải cấp:* **Sapidae Chiefdom** `ardhaven` — An Toàn, 6400×3200, sàn 68.2%, 26 NPC.
*Ngoài dải cấp:* **Tầng Sâu** `deep` — Phó Bản, 2600×1900, sàn 47.5%, 0 NPC.

**Lỗ hổng dải cấp:** 13 · 79-83 · 101

## 2. Xếp theo VAI TRÒ trong chính tuyến

Năm **Trụ Khoá** là xương sống cốt truyện; **Dòng Cốt** là thứ độc quyền khiến mỗi vùng
đáng cày (xem CLAUDE.md — người chơi chọn build bằng cách chọn nơi cày).

| Map | Dải cấp | Trụ Khoá | Dòng Cốt | Trấn Ải | Vệ Binh Trụ |
|---|---|---|---|---|--:|
| `corran` | 1 - 12 | — | Mầm Cội | Người Giữ Rẻo Corran | 3 |
| `ngoai` | 14 - 24 | — | Đồng Cỏ | Ma Sói Sương Trắng | 3 |
| `chungnam` | 24 - 38 | Trụ Werebear Woods | Rễ Gai | Tướng Quân Werebear Woods | 3 |
| `daohoa` | 38 - 48 | — | Cánh Hoa | Thủ Lĩnh Đoàn Gloam | 3 |
| `loimon` | 42 - 48 | — | Vỏ Mòn | Kẻ Chặn Cuối Lối | 0 |
| `comoc` | 42 - 56 | Trụ Roost | Vỏ Trứng | Tướng Quân Bug Tribe Tunnels | 3 |
| `trungnut` | 44 - 50 | — | Mảnh Nứt | Thứ Bò Ra Từ Nứt | 2 |
| `caungam` | 56 - 62 | — | Bọt Ngầm | Thứ Ngoi Lên Từ Hồ Ngầm | 3 |
| `tuyettinh` | 62 - 78 | Trụ Bird Tribe Heights | Băng Vụn | Tướng Quân Bird Tribe Heights | 3 |
| `mongco` | 84 - 100 | Trụ Ashmark | Tro Tàn | Tướng Quân Reptile Sunstone Flats | 3 |
| `nhanmon` | 102 - 120 | Trụ Dusk Marsh | Sấm Vụn | Tướng Quân Dusk Marsh | 3 |

**5/5 Trụ Khoá** có map. **11 Dòng Cốt** đang có nơi rơi.

## 3. Nối map — đồ thị đi bộ

```
corran     → ardhaven
ngoai      → ardhaven
chungnam   → ardhaven, comoc, daohoa
daohoa     → chungnam, loimon, trungnut
loimon     → daohoa
comoc      → trungnut, caungam, chungnam, mongco
trungnut   → daohoa, comoc
caungam    → comoc, tuyettinh
tuyettinh  → ardhaven, caungam
mongco     → comoc, nhanmon
nhanmon    → mongco
ardhaven   → ngoai, tuyettinh, corran, chungnam
deep       → ardhaven
```

| Map | Lối ra |
|---|---|
| `corran` | Lối Về Thành → Sapidae Chiefdom |
| `ngoai` | Qua Cổng Thành → Sapidae Chiefdom |
| `chungnam` | Lối Về Thành → Sapidae Chiefdom<br>Lối Bắc → Bug Tribe Tunnels<br>Lối Đông → Plant Tribe Glade |
| `daohoa` | Lối Tây → Werebear Woods<br>Lối Đông → Lối Mòn Corran<br>Lối Bắc → Trũng Nứt Corran |
| `loimon` | Lối Tây → Plant Tribe Glade |
| `comoc` | Lối Tây → Trũng Nứt Corran<br>Lối Đông → Aquatic Tribe Causeway<br>Lối Nam → Werebear Woods<br>Lối Bắc → Reptile Sunstone Flats |
| `trungnut` | Lối Nam → Plant Tribe Glade<br>Lối Đông → Bug Tribe Tunnels |
| `caungam` | Lối Tây → Bug Tribe Tunnels<br>Lối Nam → Bird Tribe Heights |
| `tuyettinh` | Lối Về Thành → Sapidae Chiefdom<br>Lối Bắc → Aquatic Tribe Causeway |
| `mongco` | Lối Nam → Bug Tribe Tunnels<br>Lối Đông → Dusk Marsh |
| `nhanmon` | Lối Tây → Reptile Sunstone Flats |
| `ardhaven` | Cổng Nam → Beast Herd Camp<br>Cổng Bắc → Bird Tribe Heights<br>Cổng Tây → Rẻo Rừng Corran<br>Cổng Đông → Werebear Woods |
| `deep` | Rời Tầng Sâu → Sapidae Chiefdom |

## 4. Tổng

- **13 map**, 12 lát viên isometric, 1 chưa.
- **169 bãi quái** · 1117 con · 115 chỗ hái thuốc · 38 NPC.
- Sàn đi được: thấp nhất 29.5%, cao nhất 79.6%.
- ⚠ **Còn dùng tranh nền phẳng:** deep.
