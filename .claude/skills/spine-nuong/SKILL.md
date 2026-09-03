---
name: spine-nuong
description: Đưa art nhân vật do Meowa sinh ra (gói Spine .json + .atlas + .png) vào Axie Wuxia — nướng thành bảng khung cho heroSprite, đắp vũ khí rời (pixel art) lên tay theo xương điểm cầm, tách bộ giáp thành 4 icon trang bị, và dùng ảnh vẽ tay thay hình dựng bằng đường cho Cánh. Dùng khi có gói Spine mới (giáp, vũ khí, cánh) cần ghép vào game, khi phải sửa lệch tỉ lệ hay lệch mặt đất của nhân vật, khi cần icon cho món giáp, hoặc khi cần hiểu vì sao art không hiện/hiện sai.
---

# Nướng art Spine vào Axie Wuxia

Meowa xuất ra rig Spine. Game này là canvas 2D không có runtime Spine, và sẽ không có —
runtime chính chủ đòi giấy phép Spine, còn thứ mình cần chỉ là vài chục khung hình tĩnh.
Nên đường đi là **nướng sẵn ra bảng khung**, rồi `drawImage`.

## Hai đường, chọn đúng đường

| | Cánh | Nhân vật · giáp | Vũ khí rời | Icon giáp |
|---|---|---|---|---|
| Nguồn | một tấm PNG **xám** một bên cánh | gói Spine đầy đủ | một tấm PNG phẳng (pixel art) | gói Spine đầy đủ |
| Cách vào game | `drawImage` trong `canhVeThuy` | bảng khung trong `heroSprite` | bảng khung `_vk` chồng lên thân | dải 4 ô, `slotIcon` cắt ra |
| Màu | nhuộm lúc chạy, một tấm đủ ba bậc | phải có art riêng từng giai | nguyên màu, không nhuộm | theo art |
| Công cụ | không cần | `tools/spine/nuong_nv.py` | `tools/spine/nuong_vk.py` | `tools/spine/nuong_icon.py` |

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

## Đường VŨ KHÍ RỜI — `tools/spine/nuong_vk.py`

    python3 tools/spine/nuong_vk.py <gói> '<da>' <tranh-vũ-khí.png> <tên-ra>

Đắp một bức vẽ phẳng (pixel art, icon 64×64…) lên tay nhân vật, xuất ra `<tên-ra>_vk.png`
đúng khuôn bảng khung mà `nuong_nv.py` sinh cho lớp vũ khí — game thay một tệp là xong.

Buộc vào xương **`左手持剑点`** ("điểm bàn tay cầm binh khí", phía TRƯỚC thân). Mỗi khung lấy
ma trận thế giới của xương đó ra, đặt chỗ nắm của cây vũ khí vào đúng đấy, xoay theo hướng
cẳng tay cộng một góc lệch cố định.

**BA THỨ ĐÃ THỬ VÀ HỎNG — đừng làm lại:**

1. **Buộc vào xương `武器`.** Xương này ĐỨNG YÊN TUYỆT ĐỐI ở cả bốn hoạt cảnh — góc luôn
   −27,1°, vị trí luôn (−127, 384). Vũ khí gốc động được là nhờ **biến dạng lưới**, không nhờ
   xương. Buộc vào đó thì vũ khí đứng chết trong khi người vung tay.
2. **Kê trùng khít hai đầu mút của hình vũ khí CŨ.** Bám hoạt cảnh thì đúng, nhưng vũ khí gốc
   của bản mẫu này là một cây dài cầm ở gần đầu, cán chĩa ra sau — nên cây mới cũng nằm chéo
   sau lưng, không ra dáng "đang cầm".
3. **Buộc vào tay XA (`右手持剑点`).** Tay này mới là tay vung (quay 279° trong cú chém), nhưng
   nó ở x=104 trong khi đầu ở x≈120: cây trượng dựng đứng ở đó cắt ngang mặt.

**Hai hằng số đã hiệu chỉnh, và chúng đo trên bộ CÓ MŨ TRÙM chứ không phải bản trần:**
`GOC_DUNG = -74°`, `DAI_VK = 142`. Bản trần để dựng thẳng (−88°) trông vẫn ổn, nhưng giáp giai
1 có mũ trùm vải cùng tông nâu với đầu trượng gỗ — dựng thẳng thì hai khối nâu chồng nhau và
bóng dáng nhoè hẳn. Đừng chỉnh ngược lại vì "nhìn bản trần thấy thẳng đẹp hơn".

**Lật theo từng hoạt cảnh.** Trong `05_MagicAttack` xương tay gần quay ngược ~180°, để nguyên
thì đầu vũ khí chúc xuống đất. Xét MỘT LẦN ở khung đầu mỗi hoạt cảnh rồi cộng 180° cho cả
hoạt cảnh — xét từng khung thì giữa cú chém nó lật cái bụp, ra một khung giật.

**Đầu nào là ngọn:** đếm điểm ảnh quanh mỗi đầu mút, đầu nào nhiều hơn là đầu vũ khí. Đầu
trượng / lưỡi kiếm lúc nào cũng to hơn cán. Đừng đoán theo "đầu xa bàn tay" — sai với rig này.

## Đường ICON GIÁP — `tools/spine/nuong_icon.py`

    python3 tools/spine/nuong_icon.py <gói> '<da>' <tên-ra>

Xuất `<tên-ra>_icon.webp` — dải **4 ô 128×128**: `0 nón · 1 áo · 2 tay · 3 chân`.

**Tách được là vì:** 13 khe của bản mẫu đều là bộ phận cơ thể (đầu, thân, hai tay, hai chân,
vũ khí, hiệu ứng) — nhưng **mỗi món giáp lại được vẽ chìm vào ĐÚNG MỘT bộ phận**. Mũ trùm nằm
trong texture của khe `头`, áo choàng trong `躯干`, ống tay trong `左手/右手`. Nên dựng riêng
một bộ phận ra là được đúng một món. `ve_khung()` vốn đã nhận `bo_khe` để loại khe.

**CHỈ CÓ BỐN, KHÔNG PHẢI NĂM.** Bản mẫu không có khe quần riêng: `躯干_带短裤` là "thân kèm
quần đùi", và áo choàng phủ luôn xuống chân. Ô **Quần** trong game vì thế chỉ tính chỉ số,
không có hình riêng — mà cũng hợp lý, vì nhóm `chân` đã gồm cả ống quần lẫn giày.

**Trộn chéo bộ thì khớp từng pixel** — mọi gói từ bản mẫu này dùng chung bộ lưới byte-giống-
hệt-nhau (`md5(bones) = 96d71d94`), nên đội mũ bộ A lên thân bộ B không lệch một chấm. Đây là
đường để sau này cho mặc lẫn hiện lên người; đo được giá: 4 bảng khung rời tốn **788 KB** so
với 481 KB khi gộp cả bộ (+64%, vì mỗi tấm vẫn phải chừa ô 240×300).

**Phần nào đáng làm thành món riêng — đo, đừng đoán.** Tỉ lệ bóng dáng NHÌN THẤY ĐƯỢC (phần
bị lớp trên che không tính), trung bình trên 3 khung, hai bộ áo choàng dài:

| | thân | tay | đầu | chân |
|---|---|---|---|---|
| vải thô | 37,6% | **28,4%** | 19,4% | **14,6%** |
| bản trần | 36,2% | 18,2% | 28,4% | 17,1% |

**Tay nhìn thấy gần gấp đôi chân** — áo choàng dài phủ hết chân, còn ống tay buông hai bên
không gì che. Trực giác nói ngược lại. Cảnh báo: đo trên **áo choàng dài**; lớp mặc giáp cứng
có giáp ống chân nhiều khả năng đảo lại, đừng chốt cứng cho cả 5 lớp từ phép đo này.

## Nối vào game

| việc | chỗ sửa trong `game.js` |
|---|---|
| thân TRẦN từng lớp | `NV_BO` — `lớp\|giai` → tên bộ |
| bộ GIÁP (thân + icon + vũ khí) | `NV_GIAP` — `lớp\|giai` → tên bộ |
| số cây vũ khí của một bộ | `NV_VK_SO` — tên bộ → N, tệp là `<bộ>_vk1..N.png` |
| thứ tự 4 ô icon | `NV_ICON_O` — phải trùng `NHOM` trong `nuong_icon.py` |

Một tên bộ kéo theo cả chùm tệp, và chúng phải nướng từ **CÙNG một gói Spine**:

    <bộ>.webp        thân, 80 khung
    <bộ>_dung.png    tư thế đứng (thẻ chọn lớp)
    <bộ>_icon.webp   dải 4 icon
    <bộ>_vk1..N.png  vũ khí theo giai vũ khí

Lấy chéo gói là lệch: `nuong_nv.py` đo hệ số thu và bù mặt đất trên chính gói đó — bộ vải thô
ra 0,1336 còn bản trần ra 0,1358, đủ để vũ khí rời khỏi tay.

**Phân biệt "cởi trần" với "mặc đủ bộ giai 1" bằng `gv.n`, không bằng giai.** `heroTier()` kẹp
sàn ở 1 nên hai trường hợp đó cùng báo về "giai 1". Và **đừng `clamp(...,1,..)` trước khi xét**:
`gv.t` đã nhân độ phủ, đeo mỗi cái nón giai 1 ra 0,2 → làm tròn 0 → phải về thân trần; clamp
trước thì 0 bị kéo lên 1 và một cái nón cũng đủ hiện nguyên bộ giáp. Tôi viết sai đúng chỗ này,
`test_giapicon` mục 6 bắt được.

**`heroGearSig()` phải có VŨ KHÍ trong chữ ký.** Bản đầu chỉ có giáp — lỗi này ẩn suốt vì cả 14
giai vũ khí dùng chung một hình vẽ; nay art nướng chọn cây trượng theo giai vũ khí nên đổi vũ
khí mà bộ đệm trả lại ảnh cũ là thấy ngay.

**`nvTai()` chỉ xin đuôi `.webp` cho bảng khung thân và dải icon.** Đặt tệp `.png` vào đó thì
ảnh 404 vĩnh viễn, `nvBo()` trả `null`, và cả đường vẽ lặng lẽ rơi về hình dựng bằng đường —
không có lỗi nào hiện ra. Mất 20 phút mới lần ra lần đầu.

**Hào quang +N phải gọi lại bằng tay ở đường nướng.** `drawHeroFigure()` tự gọi ba lớp hào
quang bên trong nó; đường nướng đi vòng qua hàm đó nên nếu quên thì rèn tới +11 vẫn trông y
hệt +0 (đo được: đúng 0 điểm ảnh khác nhau). Xem `nvHaoQuangSau/nvHaoQuangTruoc`. Hai lớp phải
**viết lại** chứ không gọi lại được: `hArmorSheen`/`hEngrave` bám toạ độ từng mảnh giáp mà hàm
vector tự dựng, còn `hPlusSweep` cắt theo hình chữ nhật đo trên thân người vector — đặt lên art
nướng thì tràn ra ngoài người thành một hộp xám bẹt. Bản mới dựng cả hai từ **bóng dáng của
chính khung hình** (`nvVienSang`, `nvDaiQuet`).

## Xem thử nhanh trong game

`/gen <giai 1-14> [+rèn 0-11] [phẩm 0-4] [cánh 0-3]` — mặc thẳng cả bộ. Ví dụ `/gen 1 +11`.
Khác `/item` (chỉ ném một món vào túi) và `/max` (nhảy thẳng giai đỉnh, không xem được giai
giữa). Bài kiểm: `tests/test_giapicon.js`.
