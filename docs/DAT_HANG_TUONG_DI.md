# Đặt hàng art: TÁM HƯỚNG NHÌN và VÒNG ĐI/CHẠY ĐÚNG CHUẨN

> Chủ dự án chốt **đủ 8 hướng như MU Online** (phiên 2026-09-11).
>
> Tài liệu này đo hiện trạng trước, rồi mới nói phải vẽ gì. Số đo sinh bằng
> `tools/do_dang.js` — **đừng chép tay lại**, chạy lại là ra.
>
> Máy trong game **đã dựng xong và đang chạy** (xem §4). Thiếu đúng một thứ: các tấm art.

---

## 1. Hiện trạng, đo được

```
NV_CAO 132 · HERO_H 220 ⇒ quy đổi bảng khung → màn hình = 0,600
bộ                      khối  khung  sảiBọc  tảiĐất  trượt  đốiXứng  bước  nhún
dkcw1   Dark Knight      w      32      91    42,5    53%    0,586     1    10
dkcw1   Dark Knight      r      32     120    59,5    50%    0,483     1    25
dwsc1   Dark Wizard      w      32      91      42    54%    0,623     1     8
dwsc1   Dark Wizard      r      32     119      58    51%    0,501     1    24
sbhd1   Spellblade       w      32      92    43,5    53%    0,594     1    11
sbhd1   Spellblade       r      16     124      59    52%    0,501     1    29
elfar1  Sylvan Ranger    w      32      90      42    53%    0,638     1    10
elfar1  Sylvan Ranger    r      32     117      57    51%    0,516     1    24
dlcm1   Dark Lord        w      32      89      43    52%    0,604     1     9
dlcm1   Dark Lord        r      32     121      59    51%    0,492     1    25
```

Ba kết luận, và cái thứ ba là cái đắt nhất:

**① Một hướng nhìn duy nhất.** `heroSprite(..., back=true)` và `back=false` lệch **0 trên
52.000 điểm ảnh**. Game vẫn tính cờ `_ps.back` và vẫn nhét nó vào khoá đệm sprite — tức trả
gấp đôi ô nhớ để lấy về hai tấm ảnh giống hệt nhau. Đi lên phía Bắc thấy y hệt đi sang Đông.

**② Vòng nào cũng chỉ MỘT bước.** `đốiXứng` = độ chồng khít bóng dáng giữa khung `i` và khung
`i+n/2`. Vòng hai bước thì nửa sau là cùng dáng đổi chân, nhìn nghiêng phải trùng ≥0,85. Cả 10
khối đo ra **0,48–0,64** — nửa vòng sau là dáng **ĐỨNG**, không phải bước của chân kia. Lặp
vòng đó thì nhân vật bước mãi bằng một chân, xen giữa là một quãng đứng yên.

**③ Bàn chân chỉ chở được nửa quãng.** `sảiBọc` (mắt đọc ra "bước dài chừng này") 120px, mà
`tảiĐất` (bàn chân chống đất lùi được bao nhiêu) chỉ 59px. **51% quãng đường là trượt chân,
nằm sẵn trong bản vẽ.** Không con số nào trong `game.js` chữa được chỗ này — đã chỉnh
`SAI_CHAN` về đúng số đo rồi (nhịp chạy 1,18 → 2,90 bước/giây), và 51% đó vẫn còn nguyên.

**Riêng Spellblade còn thiếu một hàng bảng khung.** `sbhd1` bảng một có **96 ô (6 hàng)**
trong khi bốn bộ kia **112 ô (7 hàng)**. Mốc khối chạy là ô 80, nên Spellblade chỉ đọc được ô
80–95 — tức **đúng nửa đầu** vòng chạy. Nướng lại là xong, cần gói Spine gốc.

> ⚠ Sải chân thì **không cần đổi**. 120px bảng khung = 72px màn hình = 0,76 thân người; ở tốc
> độ nền 209 px/giây nó cho 2,90 bước/giây, đúng nhịp chạy của người thật. Đặt hàng lần này
> **giữ nguyên độ dài sải chân**, chỉ sửa CẤU TRÚC vòng (hai bước) và PHA CHỐNG ĐẤT.

---

## 2. Phải vẽ gì

### 2.1 Tám hướng = NĂM bản vẽ

Đông↔Tây, ĐB↔TB, ĐN↔TN lật ngang là ra nhau. Chỉ Bắc và Nam phải vẽ riêng. Đây là cách
Ragnarok và Diablo II làm, và nó cắt 8 lượt sinh xuống còn 5.

| Mã | Hướng vẽ | Dùng cho | Lật ngang |
|---|---|---|---|
| *(rỗng)* | nghiêng, mặt về bên phải | Đông · Tây | Tây |
| `bd` | chéo sau, 3/4 lưng | Đông-Bắc · Tây-Bắc | Tây-Bắc |
| `b` | thẳng lưng | Bắc | không |
| `nd` | chéo trước, 3/4 mặt | Đông-Nam · Tây-Nam | Tây-Nam |
| `n` | thẳng mặt | Nam | không |

Mã này **phải trùng khít** cột `ban` của `NV_HUONG` trong `game.js`. Bản nghiêng mang mã rỗng
để 89 tệp art đang chạy không phải đổi tên.

> ⚠ **Chi tiết BẤT ĐỐI XỨNG sẽ nhảy sang bên kia khi lật.** Spellblade lấy vai lệch làm chữ ký
> của lớp (`halfplate`, xem CLAUDE.md): một bên giáp, một bên trần. Chạy sang Đông thì giáp ở
> vai trái, quay sang Tây thì sang vai phải. Hai đường xử: chấp nhận (phần lớn game 2D làm
> vậy, và mắt gần như không bắt được lúc đang chạy), hoặc vẽ đủ 8 hướng riêng cho **mình
> Spellblade**. Cần chủ dự án chốt — máy đỡ được cả hai, chỉ là khai thêm mã hướng.

### 2.2 Vòng ĐI và CHẠY phải là vòng DI CHUYỂN, không phải động tác tại chỗ

Ba ràng buộc, cả ba đều đo được bằng `tools/do_dang.js`:

| Đòi hỏi | Ngưỡng nghiệm thu | Hiện tại |
|---|---|---|
| **Hai bước một vòng** — nửa vòng sau là chân kia bước, không phải đứng | `đốiXứng ≥ 0,85` | 0,48–0,64 |
| **Bàn chân chống đất chở đủ quãng** — trong pha chống, bàn chân lùi hết chiều dài sải | `trượt ≤ 15%` | 50–54% |
| **Sải chân giữ nguyên** | `sảiBọc` 115–125 (chạy) · 85–95 (đi), px bảng khung | 117–124 · 89–92 |
| **Vòng ĐI luôn có một chân chạm đất** | `nhún ≤ 4` px bảng khung | 8–11 |
| **Vòng CHẠY có pha bay** | `nhún` 18–30 | 24–29 ✅ |
| Số khung | đi 32 · chạy 32 (cả năm bộ) | Spellblade chạy mới 16 |

Giải thích cho hoạ sĩ / bản mô tả sinh art:

- *Hai bước một vòng*: vòng lặp phải đi hết **chạm-trái → qua-chân → chạm-phải → qua-chân →
  về chạm-trái**. Vòng hiện tại chỉ có **chạm → qua-chân → về chạm CÙNG CHÂN**.
- *Chở đủ quãng*: bàn chân nào đang chạm đất thì trong suốt pha chạm, nó phải **lùi về sau đều
  đặn** đúng bằng chiều dài sải. Hiện tại bàn chân chống đất gần như đứng yên tại chỗ trong
  16/32 khung — đó là lý do nhân vật trông như trượt trên băng.
- *Tay phải vung*: hai tay vung ngược pha với chân. Vòng hiện tại tay gần như buông thõng, và
  đó là phần lớn cảm giác "cứng" mà mắt đọc được ở cỡ 95px.

### 2.3 Thứ tự làm — đừng chờ đủ 5 bản mới lắp

Máy lui về bản gần nhất theo góc, nên **mỗi bản về là dùng được ngay**, không cần chờ đủ bộ:

1. **`b` (lưng)** — vá đúng thứ đang sai rõ nhất: đi lên trên mà vẫn nghiêng người. Có `b`
   thì Bắc, Đông-Bắc và Tây-Bắc đều tốt hơn hẳn (hai hướng chéo tự lui về `b`).
2. **`n` (mặt)** — đi xuống thấy mặt. Xong bước này là đủ 4 hướng, tức phần lớn giá trị.
3. **`bd` · `nd`** — hai bản chéo, làm nốt 8 hướng.
4. **Vòng đi/chạy hai bước** — làm cùng lượt sinh với bước 1 nếu được, vì cùng một gói Spine.

---

## 3. Nướng và lắp

Sandbox **không gọi được meowa.ai** (chặn egress), nên bước sinh ảnh là việc của chủ dự án.
Gói Spine nhận về thì nướng bằng công cụ có sẵn:

```bash
python3 tools/spine/nuong_nv.py --lop <gói> <tên-bộ><mã-hướng>
#   ví dụ: ... dkcw1b   (Dark Knight, thân trần, bản vẽ hướng lưng)
```

Lệnh đó in ra hộp cắt của từng lớp. Ba chỗ phải điền, đúng ba dòng dữ liệu:

| Điền vào | Nội dung |
|---|---|
| `NV_LOP_HOP['dkcw1b']` | hộp cắt do công cụ in ra (8 số × mỗi lớp) |
| `NV_BANVE['dkcw1']` | thêm mã `'b'` vào danh sách |
| `NV_KHUNG_R['dkcw1b']` | `32` nếu bảng có 7 hàng |

Không sửa một dòng máy nào. Xong ba dòng đó là chạy.

**Kiểm tra:**

```bash
cd public/game && python3 -m http.server 8853
NODE_PATH=/opt/node22/lib/node_modules node tools/do_dang.js     # số đo tướng đi
NODE_PATH=/opt/node22/lib/node_modules node tests/test_huongnhin.js
NODE_PATH=/opt/node22/lib/node_modules node tests/test_khungdoc.js
```

---

## 4. Phần máy — ĐÃ XONG, không phải làm lại

- `NV_HUONG` — 8 hướng → 5 bản vẽ + cờ lật. `NV_BANVE` — bộ nào có bản nào.
- `nvChonHuong(bộ, góc)` — chọn bản tốt nhất bộ đó **đang có**, lui về bản gần nhất theo GÓC
  THẬT khi chưa có. Bộ chưa khai gì thì trả về đúng luật cũ `Math.cos(face) < 0` ở **720/720**
  góc, nên bật tầng này lên không đổi một điểm ảnh nào.
- Hướng nằm **trong tên bộ** (`dkcw1` + `b` = `dkcw1b`), nên mỗi hướng được phép có hộp cắt
  riêng và số khung riêng, và tầng lớp rời tra đúng bộ đó mà không phải biết gì về hướng.
- `back` đã ra khỏi khoá đệm sprite khi bộ có art — hết chuyện trả gấp đôi ô nhớ cho hai tấm
  ảnh giống hệt nhau.
- `tests/test_huongnhin.js` gác cả hai lời hứa: chưa có art thì không đổi gì, và thêm một mã
  vào bảng là hướng đó sống ngay.

### Một cái bẫy đã dẫm phải, ghi lại

Bản đầu **làm tròn góc về một trong tám nấc TRƯỚC rồi mới đo khoảng cách** để chọn bản lui về.
Ở dải 90°–112,5° nó chọn Đông trong khi luật cũ chọn Tây — tức bật tầng hướng lên là nhân vật
quay ngược ở một dải góc, **dù chưa có một tệp art mới nào**. Phải đo từ góc thật.
Bài kiểm quét 720 góc chứ không quét 8 mốc, chính vì chỗ hỏng nằm **giữa** hai mốc.
