---
name: spine-nuong
description: Đưa art nhân vật do Meowa sinh ra (gói Spine .json + .atlas + .png) vào Axie Wuxia — nướng thành bảng khung cho heroSprite, và dùng ảnh vẽ tay thay hình dựng bằng đường cho Cánh. Dùng khi có gói Spine mới (giáp, vũ khí, cánh) cần ghép vào game, khi phải sửa lệch tỉ lệ hay lệch mặt đất của nhân vật, hoặc khi cần hiểu vì sao art không hiện/hiện sai.
---

# Nướng art Spine vào Axie Wuxia

Meowa xuất ra rig Spine. Game này là canvas 2D không có runtime Spine, và sẽ không có —
runtime chính chủ đòi giấy phép Spine, còn thứ mình cần chỉ là vài chục khung hình tĩnh.
Nên đường đi là **nướng sẵn ra bảng khung**, rồi `drawImage`.

## Hai đường, chọn đúng đường

| | Cánh | Nhân vật · vũ khí |
|---|---|---|
| Nguồn | một tấm PNG **xám** một bên cánh | gói Spine đầy đủ |
| Cách vào game | `drawImage` trong `canhVeThuy` | bảng khung trong `heroSprite` |
| Màu | nhuộm lúc chạy, một tấm đủ ba bậc | phải có art riêng từng giai |
| Công cụ | không cần | `tools/spine/nuong_nv.py` |

Cánh rẻ hơn nhiều vì nhuộm được. Nhân vật thì không: `hSetMetal()` đổi màu theo 14 giai chỉ
áp lên hình dựng bằng đường; art nướng nằm ngoài tầm với của nó, nên **mỗi giai một bộ ảnh**.
Đó là chỗ con số "30 bộ" (14 giai gom thành 5 nấc dáng × 6 lớp) đến từ đâu.

## Đường CÁNH

Tệp tranh: vẽ **một bên** cánh, gốc cắm sát mép trái, thân chìa sang phải, tô **xám** (PNG chế
độ `LA`) chứ không tô màu. Đặt ở `public/game/assets/canh/<tên>.png`, rồi thêm `anh:'<tên>'`
vào mục cánh trong `WING_DEFS` / `WING2_DEFS` / `WING3_DEFS`.

Vì sao tô xám: `canhAnhMau()` nhân (multiply) tấm xám với màu của bậc rồi cộng lại 20% ánh
sáng gốc cho khỏi bệt. Nhờ vậy **một tấm phục vụ cả ba bậc** thay vì phải vẽ ba tấm.

Tranh thay hình dựng đường ở mức **một thùy**, không thay cả đôi cánh — vòng lặp thùy giữ
nguyên nên nấc thang của `WING_TIERS` còn nguyên: bậc 1 xếp 2 lớp lông, bậc 2 xếp 3, bậc 3
xếp 4 và tách chữ X, kèm hào quang với hạt sáng.

Ba chỗ đã vấp:
- **Cặp dưới của hình chữ X nằm ngửa.** Người gọi đã quay nó quá phương ngang; tranh có mặt
  trên rõ rệt nên phải `scale(1,-1)` rồi ngửa ngược chiều. Xem cờ `duoiX`.
- **Thẻ nhân vật kẹt bản cũ.** Chữ ký thẻ phải mang cờ "tranh đã tải xong chưa"; thiếu thì thẻ
  đầu tiên nướng bằng hình dựng đường rồi nằm lì trong bộ nhớ đệm.
- **Cánh bị cắt cụt.** Sải cánh bậc 3 vẽ bằng tranh cần **108 px mỗi bên**. `PAD` trong
  `heroCardUrl` là 116, và `.char-portrait` rộng 142 px để nhân vật giữ nguyên cỡ trên màn.

## Đường NHÂN VẬT

```
python3 tools/spine/nuong_nv.py <thư-mục-gói> '<tên-da>' <tên-ra>
```

Xuất `public/game/assets/nv/<tên>.png` (thân) và `<tên>_vk.png` (vũ khí), rồi tự kiểm hai mốc.
Khai báo vào `NV_BO` (khoá `lớp|giai`) và `NV_VK` trong `game.js`.

### Hợp đồng toạ độ — sai một dòng là nhân vật lệch

- ô **240×300** = `(HERO_W + HS_PAD*2) × (HERO_H + HS_PAD*2)`
- bảng xếp **16 cột**
- gốc bộ xương **(80, 212)** nằm đúng ở **(120, 252)** trong ô
- thứ tự khung trùng `HS_FRAMES`: **16 đứng · 32 đi · 16 đánh · 16 niệm**

Nhờ hợp đồng này, `heroSprite` dán thẳng ô vào rồi để nguyên máy cắt-sát và bộ đệm LRU sẵn có
lo phần còn lại — không phải sửa `drawPlayer`.

### Hai phép đo, đừng đoán

1. **Hệ số thu**: đo **đỉnh đầu → gót**, **không tính tóc sau** (`背后头发`), quy về 159 px.
   Đo cả chỏm tóc vào là nhân vật lùn đi chừng 18%.
2. **Bù mặt đất**: bàn chân trong art thò xuống dưới gốc bộ xương vài px (gói mẫu: 8 px). Đặt
   `y=0` vào mốc 212 không thôi là cả người tụt xuống dưới bóng. Công cụ tự đo và bù.

Chạy xong công cụ in ra `gót y=212 (cần 212) · đỉnh đầu y=53 (cần 53)`. Hai số không khớp thì
đừng đi tiếp.

### Vũ khí là LỚP RIÊNG

Nướng riêng ba khe `左手武器` / `左手武器2b` / `左手武器2c` rồi đắp đè lên thân. Đổi vũ khí
không phải nướng lại người. Một cây **58 KB**, bằng 1/25 cái thân.

Chuyện này chạy được là nhờ **mọi gói Meowa sinh từ cùng một template dùng bộ xương giống nhau
từng byte** (gói mẫu: `md5(bones) = 96d71d94`), cùng tên khe và cùng cả toạ độ ô atlas. Nên
gậy nướng từ gói A rơi đúng vào tay của thân nướng từ gói B. **Đổi template là mất hết.**
Có gói mới thì kiểm trước:

```python
import json, glob, hashlib
j = json.load(open(glob.glob(f'{goi}/*.json')[0], encoding='utf-8'))
print(hashlib.md5(json.dumps(j['bones'], sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:8])
```

### Bốn cái bẫy của định dạng Spine 4.2

Bốn cái này mỗi cái đều làm hỏng bản dựng theo một kiểu khác nhau, và đoán thì không ra:

1. **`uvs` của lưới nằm trong hệ 0–1 của RIÊNG ô atlas**, không phải của cả trang 2048×2048.
   Nhân với bề rộng trang là nhân vật vỡ thành hàng trăm mảnh vụn rải khắp ảnh.
   Đúng: `(rx + u*rw, ry + v*rh)`.
2. **Hoạt cảnh có thể LẬT GƯƠNG nhân vật.** Khi định thức ma trận cha âm thì góc thế giới của
   xương là `góc_cha − góc_cục_bộ`, không phải cộng. IK cộng vào là chân văng ra ngoài khung.
   Xem `_dauLat()`.
3. **`bendPositive` là cờ đúng/sai**, không nội suy được như số — lấy theo khoá gần nhất phía
   trước, nội suy là vỡ chương trình.
4. **Spine 4.2 dời biến dạng lưới từ khoá `deform` sang `attachments`** — gói mẫu dùng **cả
   hai chỗ**. Đọc thiếu một chỗ là mất vài khung tay áo giữa đòn đánh.

## Số đo thật (gói Violet Crystal Staff, một bộ trọn vẹn)

| | |
|---|---|
| 80 khung | 8 giây |
| ô sát mép ở cỡ trong màn | 64×79 px |
| thân, PNG | 1,4 MB |
| thân, WEBP q80 | 121 KB |
| vũ khí, PNG | 58 KB |
| 30 bộ | ~3,6 MB · nướng dưới 3 phút |

PNG khá nặng vì bảng 3840×1500. Muốn nhẹ thì chuyển WEBP — trình duyệt nào cũng đọc được,
chỉ là kho hiện chưa có tệp WEBP nào nên sẽ là tệp đầu tiên.

## Việc còn dở

- Mới có **3/30** bộ giáp. Nghẽn nằm ở lượng art, không nằm ở kỹ thuật.
- Bốn gói Meowa gốc **không nằm trong kho** (5,6 MB). Muốn nướng lại phải xin lại `.zip`.
- **Sáu lớp sẽ chung tỉ lệ người và dáng đi** vì chung một bộ xương. Mặt và tóc thì đổi được
  theo từng da. Muốn Dark Knight vạm vỡ hơn Sylvan Ranger thì phải xin Meowa đổi template.
- `hStage`/`hSetMetal` không áp lên art nướng — mỗi giai cần bộ ảnh riêng.
