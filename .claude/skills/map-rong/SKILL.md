---
name: map-rong
description: Dựng một map hoang dã RỘNG cho Axie Rift theo khuôn Rẻo Rừng Corran — nền lát viên isometric, đa giác đi được sinh bằng máy, miền dân số A4, cổng rìa hai chiều, trùm vùng và Dòng Cốt độc quyền. Dùng khi cần thêm map ngoài trời mới, mở rộng một map cũ ra khổ lớn, hoặc dựng phó bản/hành lang từ cùng bộ công cụ.
---

# Khuôn map rộng — "Rẻo Rừng Corran"

Rẻo Rừng Corran (`corran`, 5200×3800) là map chủ dự án duyệt và gọi là *"tạo cảm giác map rất
lớn và có thể đặt quái ở nhiều nơi"*. Tệp này chép lại ĐÚNG công thức đó để lần sau không phải
dò lại, kèm những chỗ đã sai một lần.

Đọc kèm: `docs/DUONG_DI_VA_GOC_NHIN.md`, `tools/iso/vung_rong.py`, `tools/iso/nuong_tile.py`.

## 0. Bốn quyết định phải chốt TRƯỚC khi gõ

| Câu hỏi | Ảnh hưởng |
|---|---|
| Khổ map (`w`/`h`) | `MAP` là PER-MAP. Map rộng ≈ 4200×3200 → 5200×3800. To hơn mà không thêm nội dung thì `test_domap` bắt "map rỗng". |
| Hình dạng (`hinh`) | Bỏ trống = `dongtrong`, phải có ≥55% sàn. `hinh:'hanhlang'` chỉ cần ≥25% sàn nhưng chỗ thắt nhất phải ≥340px. |
| Nền vẽ | `sanIso:true` = lát viên (không mờ dù map to bao nhiêu). Không có = dùng `MAP_BG_SRC[id]`, một tấm JPEG kéo cho vừa khổ — map càng to càng nhoè. |
| Dải cấp | `min` + `range` + bảng quái phải khớp nhau, và phải khớp cả hai map hàng xóm. |

## 1. Sinh hình đất — `tools/iso/vung_rong.py`

Không chấm `diTrong` bằng tay. Bộ sinh dựng vùng bằng HỢP CỦA CÁC ĐĨA rải theo một xương sống
cong, nên mép tự nhiên và không có góc nhọn nhốt quái. Nó tự kiểm:

- sàn ≥58% khổ map (đồng trống),
- mọi điểm nội dung nằm TRONG đa giác,
- điểm tới của cổng cách rìa map <400px và cách cổng >90px,
- điểm tới cách trùm vùng ≥700px.

`sinh_trungnut.py` (ngã ba) và `cat_caungam.py` (cắt từ tranh) là hai biến thể đã chạy được của
cùng bộ này — chép cái gần với việc đang làm nhất rồi sửa, đừng viết lại từ đầu.

## 2. Nền lát viên — `sanIso:true`

Bộ viên nướng bằng `tools/iso/nuong_tile.py` (Blender headless). Ba luật đã trả giá mới biết:

1. **`view_transform='Standard'`.** Blender 4+ mặc định AgX — tấm nướng ra bợt như mô hình giấy.
2. **Cỡ nướng = cỡ vẽ.** Ép một tỉ lệ px/đơn-vị cho mọi thứ thì cây ra 845px, gấp 8,9 lần thân
   nhân vật. Thang đo duy nhất là `CAO_NV`.
3. **Viền Freestyle, không phải vỏ lộn.** Vỏ lộn trôi khi có modifier displace. Nướng nền
   (`nuong_nen`/`nuong_vet`) thì TẮT Freestyle, nếu không cả map hiện lưới kẻ ô.

Chi phí đo được: bộ lát nền gần như miễn phí; tiền trả cho sprite alpha to. 900 vệt đất kéo FPS
33 → 8,5; cắt còn 170 vệt + một tầng nhiễu thứ hai thì hết.

## 3. Đặt nội dung — thứ tự BẮT BUỘC

Có phụ thuộc vòng: bãi quái tránh trùm/cổng/điểm thả, mà trùm lại phải tránh bãi quái. Cách
duy nhất không quay vòng là làm đúng thứ tự này, và ĐO LẠI sau mỗi bước:

1. **Điểm thả + điểm tới** (`spawn`, `spawnFrom`) — chấm từ đa giác. Điểm tới phải <400px từ một
   rìa map (`test_noimap`).
2. **Cổng** (`GATES`) — cách điểm tới >90px (bán kính bắt cổng là 90; đặt sát là bị hút ngược).
   Tiền tố `"Lối "` mới tính là lối rìa hoang dã. Hai đầu một lối đặt ở hai rìa ĐỐI DIỆN.
3. **Trùm vùng** (`BOSS_DEFS`) — toạ độ TỈ LỆ (tự co giãn theo khổ map). ≥700px từ MỌI điểm tới.
4. **Miền dân số** (`vung`) — `banRaiVung()` bung ra `packs` lúc chạy, hạt bốc từ tên map nên bố
   cục cố định.
5. **Đo lại** trùm ↔ tâm bãi ≥300px. Chưa đạt thì quay lại bước 3, ĐỪNG nhích tay bước 4.

### ⚠ Trên map dạng LÀN, cung góc phải RỘNG

Bó mỗi miền vào một quạt hẹp theo hướng con đường là phản tác dụng: làn đã chặt sẵn, quạt hẹp
thì gần hết 500 lần bốc mẫu rơi ra ngoài đa giác, `_vungDatCum()` phải nới giãn cách hai lần, và
cụm cuối đậu cách trùm 220px — dưới ngưỡng 300. Để quạt rộng (15-95°) cho chính đa giác lọc,
còn `dai` giữ bậc thang cấp quái. Đo được ở Nhịp Đá: quạt hẹp 220px → quạt rộng 356px.

## 4. Bảng phải điền — thiếu một cái là một bài kiểm đỏ

| Bảng | Ở đâu | Bài kiểm gác |
|---|---|---|
| `MAPS[id]` | `data/canbang.js` | `test_sandat`, `test_domap` |
| `MAP_OBSTACLES[id]` | `data/canbang.js` | `test_domap` (vật che ≥8%) |
| `BOSS_DEFS[id]` | `data/canbang.js` | `test_bossplace` |
| `GATES` (4 mục: đi + về × 2 map) | `game.js` | `test_noimap` |
| `MAP_BG_SRC[id]` *(nếu không lát viên)* | `game.js` | — |
| `HERB_SPOTS[id]` | `game.js` | `test_domap` (mật độ, nhịp) |
| `BGM_TRACKS[id]` | `game.js` | `test_nhacnen` |
| `COT_DONG` — **một Dòng ĐỘC QUYỀN** | `game.js` | `test_bansac`, `test_dinhhinh` |

Dòng Cốt là chỗ map có LÝ DO TỒN TẠI. Hai map cùng dải cấp treo trên một ngã ba thì thứ tách
chúng ra phải là thứ chúng CHO: Lối Mòn (hành lang, an toàn) cho THỦ, Trũng Nứt (`freepk`, rộng)
cho CÔNG theo mức nguy hiểm đang chịu. Đọc hai dòng ấy là biết đi lối nào.

Khoá `hai` phải là khoá CÓ THẬT trong sổ `P` của `calcDerived()` hoặc trong `COT_PHU` —
`applyLine()` lặng lẽ bỏ qua khoá lạ, nên sai một chữ là dòng hiện trên bảng mà vô tác dụng.

## 5. Bốn cửa trước khi đẩy

```
npx eslint public/game/game.js
npm run check
npm test
(setsid nohup bash tools/reg.sh /tmp/reg-<tên> > /tmp/reg-<tên>.out 2>&1 < /dev/null &)
awk 'NR>1 && $1!=0 && $1!="DONE"' /tmp/reg-<tên>/all.log     # 174 bài, phải rỗng
```

Kiểm CJK phải in ra 0:
```
python3 -c "import re;print(sum(1 for l in open('public/game/game.js',encoding='utf-8') if re.search(r'[　-〿一-鿿＀-￯゠-ヿ぀-ゟ]',l)))"
```

## 6. Ba cái bẫy đã sập, đừng sập lại

- **Vá theo chỉ số là vá mù.** `spawnFrom:{ corran:{ x:` khớp `loimon` trước; `trungnut: {` khớp
  khối `BOSS_DEFS`. Luôn khẳng định mỗi mốc khớp ĐÚNG MỘT LẦN rồi mới thay.
- **`MAP` toàn cục mang khổ map ĐANG ĐỨNG**, không phải map đang bung. Bảng bung có nhớ
  (`_vungDaBung`), nên bung nhầm một lần là sai vĩnh viễn tới khi tải lại trang.
- **Thêm một cổng vào map HÀNG XÓM là làm map đó trọc.** `decorUnblock()` dọn cây/đá quanh MỌI
  điểm nội dung, và cổng mới cùng điểm tới mới đều là điểm nội dung. Bug Tribe Tunnels có 76 cây
  đá, thêm một lối rìa thì lọc xong còn 19 — dưới sàn 20 của `test_obstacles`. Bộ lọc làm đúng
  việc; thứ thiếu là bể đầu vào, nên nâng `trees`/`rocks` của map hàng xóm, đừng hạ sàn bài kiểm.
- **Đĩa là hạn mức cố định.** `df` báo "Avail 0" mà "Used" thấp nghĩa là hết hạn mức, không phải
  hỏng máy. Chromium báo "Page crashed" khi đĩa đầy — `df -h /` trước khi đổ tội cho code.
