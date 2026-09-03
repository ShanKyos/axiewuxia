# Đề xuất: sắp xếp lại khối tiền tệ ở góc trên bên phải HUD

> ## ĐÃ THAY THẾ — đọc mục này trước
>
> Tài liệu này viết **trước** đợt "về mô hình MU". Số đo trong đây vẫn đúng và vẫn đáng đọc
> (chữ chồng chữ ở 50,9% vị trí đứng trong thành, 2,5% màn hình nuốt chuột oan), nhưng **kết
> luận thì không còn**: nó khuyến nghị Phương án A — ví hai dòng dọc gồm Bạc và Huyền Thiết.
>
> Cái đã dựng thật khác ở ba điểm, theo quyết định của chủ dự án:
>
> | | Đề xuất này | Đã dựng |
> |---|---|---|
> | Bố cục | A — hai dòng **dọc** | **B — ba ô nằm ngang** (`#hud-vi`, `.vi-o`) |
> | Nội dung | Bạc + Huyền Thiết | **Lumen** ◈ · **Ấn Giao Kết** ✦ · **Shard** ♦ |
> | Huyền Thiết | giữ, là loại thứ hai | **đã gỡ hẳn** — quy ra Lumen ×150 |
>
> Ba bản vá bắt buộc ở §4.2 thì **đã làm đủ**: `pointer-events` tách khỏi hộp `#hud-right`,
> luật chết `#hud-khi` đã xoá, và ký hiệu `✦` trùng nghĩa đã tách (sự kiện Xâm Lăng Vàng
> chuyển sang `✹`).


Tài liệu ĐỀ XUẤT. Không sửa mã trong `public/game/`. Mọi số đo dưới đây lấy từ Playwright chạy
thật trên bản sao của `public/game/` (Chromium, `deviceScaleFactor:1`, `?test=1`,
`startGame('thieulam') → applyTestBoost() → moHetCong()`), không phải ước lượng.

Ảnh chứng cứ và số liệu thô nằm ở
`/tmp/claude-0/-home-user-Volamchimong1/43d1818e-a7ef-5bb9-8712-4ba3f324b449/scratchpad/hud/`:

| Tệp | Nội dung |
|---|---|
| `hud-1280x720.png` · `hud-1440x900.png` · `hud-1920x1080.png` | toàn màn hình, ba độ phân giải |
| `hudcorner-1280x720.png` · `hudcorner-1440x900.png` · `hudcorner-1920x1080.png` | cắt riêng góc phải 460×300 |
| `hud-1280x720-sodu-lon.png` | số dư bạc 999.999.999 |
| `hud-1280x720-deepleave.png` | nút RÚT LUI của Tầng Sâu bật lên trong cùng góc |
| `measure.json` | toàn bộ `getBoundingClientRect` của 15 phần tử HUD ở ba độ phân giải |

---

## 1. Kiểm kê tiền tệ — đếm được **22 ô đếm**, HUD hiện **2**

Đếm theo "ô đếm số lượng mà người chơi tiêu đi được", không tính vật phẩm trong túi.

### A. Có nơi kiếm và có nơi tiêu (19 loại)

| # | Tên người chơi thấy | Ký hiệu | Trường | Kiếm ở đâu (game.js) | Tiêu ở đâu (game.js) | Nhìn số dư ở đâu |
|---|---|---|---|---|---|---|
| 1 | Bạc | `◈` U+25C8 | `player.silver` | rơi từ quái `7794`, bán đồ `5756`, Tụ Linh Trận `9129`, nhiệm vụ `22228` | tiệm `20666/20680/20840+`, rèn `14697/14846`, Lò Hỗn Độn `5353`, Ascension `16119`, Hoá Chimera `3690`, nâng chiêu `2130` | **HUD** `#hud-silver`; Túi Đồ→Vật Liệu `20058`; tiệm `20708`; Lò Rèn `15395`; Ascension `16064` |
| 2 | Huyền Thiết | `✦` U+2726 | `player.mat` | rơi từ quái `7795`, phân giải đồ `20150`, nhiệm vụ `22228` | rèn +1~+6 `14846/14878`, Lò Hỗn Độn `5353`, Tấn Phẩm `14697`, Tụ Linh Trận `24026` | **HUD** `#hud-mat`; Túi Đồ→Vật Liệu `MAT_ROWS[0]` (`19769`) |
| 3 | Instinct | (không có) | `player.khi` | thụ động 3/giây `8771`, Suối Ký Ức 6/giây `9130`, rơi từ quái `7796` | **duy nhất** nâng cấp kỹ năng `2122/2131` | **CHỈ** dòng phụ tab Kỹ Năng `20227` |
| 4 | Tu La Tinh Thạch | `◆` | `player.gems.tuLa` | rơi `7802`, tiệm `20873`, Box Kundun `25352` | rèn +7~+9 `14847`, Áo Choàng `15527`, Lò Hỗn Độn `5354` | Túi Đồ→Vật Liệu `19770` |
| 5 | Hỗn Nguyên Thạch | `❖` | `player.gems.honNguyen` | rơi `7803`, tiệm `20874`, Box Kundun `25353` | rèn +10/+11 `15135`, Linh Dực `15071/15097`, Áo Choàng `15527` | Túi Đồ→Vật Liệu `19771` |
| 6 | Đá Thăng Cấp | `◈` (trùng #1) | `player.tienDan` | rơi `7804`, tiệm `20846/20871`, phó bản `23625/23736` | Thuần Thục Ám Khí/Cung/Cương Khí `16119` | Túi Đồ→Vật Liệu `19772` |
| 7 | Thiên Mệnh Phù | (không có) | `player.charms` | mua 500◈ `15540`, tiệm `20845` | bảo hiểm rèn `15136/15272` | Túi Đồ→Vật Liệu `19773`; Lò Rèn `15401` |
| 8 | Mảnh Cổ Thư (3 ô) | (không có) | `player.bikip.pieces[0..2]` | rơi | dung hợp `fuseBikip()` `8715` | Túi Đồ→Vật Liệu `19774` |
| 9 | Mảnh Trang Bị | (không có) | `player.mats.manh` | rơi từ quái/tinh anh | Tấn Phẩm & Kế Thừa `14697/14717` | Túi Đồ→Vật Liệu `19775` |
| 10 | Tịch Ma Thạch | (không có) | `player.mats.tichMa` | rơi từ Vệ Binh Trụ | Tấn Phẩm `14697`, Kế Thừa `14717` | Túi Đồ→Vật Liệu `19776` |
| 11 | Ấn Cổng Vực | (không có) | `player.mats.anTranAi` | Chinh Phạt Cổng Vực `7828` | Tấn Phẩm lên Chí Tôn `14697/14995` | Túi Đồ→Vật Liệu `19777` |
| 12 | Mảnh Cổ Thần | `◈` (trùng #1) | `player.mats.manhCoThan` | rơi `7823` | ×60 đổi Box Kundun Cổ Thần `14742` | Túi Đồ→Vật Liệu `19778` |
| 13 | Chúc Phúc Châu | `◎` | `player.jewels.chucPhuc` | rơi `205/7295`, Box Kundun `25343` | khay Lò Hỗn Độn `14809` | Túi Đồ→Vật Liệu (Tứ Châu) `20063` |
| 14 | Linh Hồn Châu | `◉` | `player.jewels.linhHon` | như trên | như trên | như trên |
| 15 | Sinh Mệnh Châu | `❤` | `player.jewels.sinhMenh` | như trên | như trên | như trên |
| 16 | Hỗn Độn Châu | `●` | `player.jewels.honDon` | như trên, `25339` | như trên + Linh Dực `14731` | như trên |
| 17 | Lõi Nguyên Tố | `●` (trùng #16) | `player.noidan` | rơi từ tinh anh/Hung Thần | hấp thụ 3 viên/ngày `23947` | **CHỈ** Túi Đồ→**Box Kundun** `20089` — không có ở tab Vật Liệu |
| 18 | Đất Hồn | `◈` (trùng #1) | `player.mats.datHon` | rơi trong màn `3662` | nuôi Chimera `3680`, Hoá Chimera `3690` | **CHỈ** bảng Chimera `16425` |
| 19 | Ấn Cổ Xưa | `✦` (trùng #2) | `player.chimera.ve.cx` | `chiVe()` `3387` | quay banner Vĩnh Cửu `3431` | **CHỈ** bảng Khế Ước `16728` |
| 20 | Ấn Giao Kết (vé quay) | `✦` (trùng #2) | `player.chimera.ve.gk` | `chiVe()` `3387`, điểm danh `24135` | quay banner Giao Kết `3431` | **CHỈ** bảng Khế Ước `16728`; nhắc việc khi ≥10 `8316`; nút ở tab Chimera `16389` |

### B. Kiếm được nhưng KHÔNG tiêu được ở đâu — 3 loại (lỗi đáng báo)

Đây là phần danh sách trong đề bài chưa nêu, và là lỗi thật chứ không phải chuyện thẩm mỹ.

| Tên | Trường | Cộng ở | Trừ ở | Nhìn số dư ở |
|---|---|---|---|---|
| **Tinh Trần** | `player.chimera.tinh` | `3423` (+15 mỗi lượt quay ra 3★ — tức là **đa số lượt quay**) | **không có dòng nào** | bảng Khế Ước `16728` |
| **Nguyệt Trần** | `player.chimera.nguyet` | `3401` (+25/+5 khi trùng con đã C6) | **không có dòng nào** | bảng Khế Ước `16728` |
| **Mã Thầu** | `player.maThau` | bắt ngựa `8628`, thưởng phụ tuyến `22229` | **không có dòng nào** | bảng Trại Ngựa `8704` |

- Tinh Trần / Nguyệt Trần: chú thích ở `game.js:3452` nói rõ *"chủ dự án giữ hai loại đó cho cửa
  hàng đổi vật phẩm"* — cửa hàng đó **chưa tồn tại trong mã**. Với `applyTestBoost()` người chơi
  đã có sẵn 500 Tinh Trần + 200 Nguyệt Trần (`16189`) mà không tiêu được đồng nào.
- Mã Thầu: bảng Trại Ngựa (`8704`) và dòng thông báo khi bắt ngựa (`8630`) đều hứa
  *"khi thăng giai thú cưỡi, dùng +7% tỉ lệ hoặc −4✦ phí"*. Hệ thú cưỡi (`player.mount`) **đã bị
  gỡ** và chuyển sang Chimera (xem `loadGame()` `6250-6258`, `delete player.mount`). Lời hứa còn,
  chỗ tiêu mất. Đây là văn bản nói dối người chơi, nên sửa hoặc gỡ trước khi ship.
- Kèm theo: `maThau` **không có trong khối khởi tạo `player = {…}`** (`6127-6194`) — nó chỉ được
  backfill trong `loadGame()` (`6331`). Nhân vật mới có `player.maThau === undefined` cho tới lần
  tải lại đầu tiên. Hiện không crash vì mọi chỗ đọc đều dùng `|| 0`, nhưng đúng là dạng lỗi mà
  chú thích `hintCd` ở `6193` đã ghi nhận một lần rồi.

### C. Ba xung đột ký hiệu — đo được, đang hiện đồng thời trên màn hình

1. **`◈` mang 4 nghĩa**: Bạc (`index.html:34`, `game.js:20511`), Đá Thăng Cấp (`7804`, `25354`),
   Đất Hồn (`3663`, `16425`), Mảnh Cổ Thần (`7823`).
2. **`✦` mang 3 nghĩa**: Huyền Thiết (`index.html:35`), Ấn Giao Kết / Ấn Cổ Xưa (`3387`), **và**
   biểu tượng sự kiện "Xâm Lăng Vàng" (`25092`).
   `#hud-time` và `#hud-mat` cùng hiện trên một khung hình. `innerText` của `#hud` đo được ở
   1280×720: `⏱ 01:35 · ✦ 23 phút · ☀ | … | ✦ 999 Huyền Thiết`. Hai chữ `✦` cạnh nhau, hai nghĩa
   khác nhau, không có gì phân biệt.
3. **`●` mang 2 nghĩa**: Hỗn Độn Châu (`4977`) và Lõi Nguyên Tố (`ND_EFFECT`).

### D. Hai luật CSS chết / lệch

- `style.css:547` — `#hud-khi { … }`. **Không có phần tử `#hud-khi` nào** trong `index.html` và
  cũng không có dòng nào trong `game.js` tạo ra nó (`grep -rn "hud-khi" public/game/` chỉ khớp
  đúng dòng CSS đó). Từng có ý định đưa Instinct lên HUD, luật CSS còn lại, phần tử thì không.
- `style.css:1047` — chú thích `#deep-leave` ghi *"#hud-right kết thúc ở 257px (đo bằng
  getBoundingClientRect)"*. **Sai ở bản hiện tại**: đo lại `#hud-right` cao tới `bottom = 566px`
  (vì có thêm quest tracker). Hệ quả đo được: bật `#deep-leave` ở 1280×720 thì nó **chồng lên
  `#quest-tracker-wrap` 213,5 × 32px** (ảnh `hud-1280x720-deepleave.png`).

---

## 2. Đo đạc chỗ hỏng hiện tại

### 2.1 Ô bao HUD góc phải, ba độ phân giải

`#hud-right` là cột flex `align-items:flex-end`, `gap:5px` (`style.css:79-80`). Nội dung xếp dọc:
bạc → Huyền Thiết → PK → AUTO → minimap → quest tracker.

| Phần tử | 1280×720 | 1440×900 | 1920×1080 |
|---|---|---|---|
| `#hud-right` | x1038 y12 **230×554** | x1198 y12 **230×554** | x1678 y12 **230×554** |
| `#hud-silver` | x1188 y12 80×16 | x1348 y12 80×16 | x1828 y12 80×16 |
| `#hud-mat` | x1145 y33 123×16 | x1305 y33 123×16 | x1785 y33 123×16 |
| `#btn-auto` | x1191 y58 77×29 | x1351 y58 77×29 | x1831 y58 77×29 |
| `#minimap-wrap` | x1066 y96 202×148 | x1226 y96 202×148 | x1706 y96 202×148 |
| `#quest-tracker-wrap` | x1038 y249 230×317 | x1198 y249 230×317 | x1678 y249 230×317 |

Kích thước **không đổi theo độ phân giải** — cột luôn 230×554px. Ở 1280×720 nó chiếm **13,8%
diện tích màn hình**.

### 2.2 Chồng lên nhãn tên NPC — đã xác nhận, có số

Nhãn NPC vẽ trên canvas ở toạ độ **thế giới** (`game.js:22902`, `12px "Be Vietnam Pro"`,
`textAlign:'center'`, đặt tại `n.y - 52`), nên vị trí trên màn hình trôi theo camera. Ô bao được
tính bằng chính `ctx.measureText()` của game.

Đứng ở điểm xuất phát Lunaris City (`player = 1300,1040`):

| Độ phân giải | Chồng lấn đo được |
|---|---|
| **1280×720** | `#hud-mat` ("✦ 999 Huyền Thiết", x1145–1268 y33–49) × nhãn **"Thợ Rèn · Lò Rèn Hoàng Gia"** (x1039,5–1200,5 y37–51) → **chồng 55,5 × 12px** |
| **1440×900** | `#minimap-wrap` × cùng nhãn đó → **chồng 54,5 × 14px** |
| **1920×1080** | không chồng ở đúng điểm này (camera bị `clamp` khác đi, nhãn rơi vào x1359–1520) |

Đây không phải một điểm đứng xui. Quét **2090 vị trí đứng** phủ kín Lunaris City (2600×1900,
bước 40px), đếm số vị trí có ít nhất một nhãn NPC rơi vào ô bao từng phần tử, ở 1280×720:

| Phần tử | Số vị trí bị chồng | Tỉ lệ |
|---|---|---|
| `#hud-silver` | 40 | 1,9% |
| `#hud-mat` | 20 | 1,0% |
| `#btn-auto` | 52 | 2,5% |
| `#minimap-wrap` | 280 | 13,4% |
| `#quest-tracker-wrap` | 628 | 30,0% |
| **`#hud-right` (cả hộp)** | **1064** | **50,9%** |

Chồng nặng nhất đo được: `#quest-tracker-wrap` × "Binh Khí Chủ · Vũ Khí Phường" → **165 × 14px**
(gần như trọn nhãn) khi đứng ở (1240, 840).

Nói cách khác: **quá nửa số chỗ đứng trong thành có ít nhất một tên NPC nằm dưới cột HUD phải.**
Hai dòng tiền tệ chỉ là hai hàng trên cùng của một cột dài 554px vốn không có nền — mọi thứ trong
cột đó đều đang đè lên tranh vẽ.

### 2.3 Vùng chết chuột — hỏng nặng hơn chuyện chữ chồng chữ

`style.css:79` đặt `pointer-events:auto` lên **cả `#hud-right`**, không phải lên từng con của nó.
Cả hộp 230×554 nuốt chuột, kể cả ở những chỗ trong suốt hoàn toàn.

Đo bằng `document.elementFromPoint` trên lưới 90 điểm trong hộp: **75/90 điểm không chạm tới
canvas**. Kiểm chứng bằng chuột thật (`click.button='right'`, click-to-move gắn trên canvas —
`game.js:7098-7106`):

```
chuột phải (1100,320)  trong hộp, chỗ trống  → moveTarget: null → null   KHÔNG ĐI
chuột phải (1100,520)  trong hộp, dưới tracker → moveTarget: null → null   KHÔNG ĐI
chuột phải (1000,320)  ĐỐI CHỨNG ngoài hộp   → moveTarget: null → {x:1660,y:1000}  ĐI ĐƯỢC
```

⇒ Ở 1280×720, **13,8% màn hình không click-to-move được và không đánh được**, phần lớn là trời
trong suốt. Đây là lỗi nghiêm trọng nhất tìm thấy trong góc này, và nó sửa bằng 2 dòng CSS.

> ### ĐÍNH CHÍNH — phiên chính, đo lại
>
> **Lỗi có thật, nhưng con số 13,8% nói quá khoảng 5,5 lần, và hai điểm dẫn chứng ở trên không
> chứng minh được điều chúng định chứng minh.**
>
> 13,8% là **diện tích cái hộp**, không phải diện tích vùng hỏng. Phần lớn hộp đó có UI thật nằm
> trong — minimap, quest tracker, nút PK/AUTO — và bấm vào những chỗ đó thì việc chặn chuột là
> **đúng**, không phải lỗi.
>
> Quét lưới 4px toàn hộp, với mỗi điểm hỏi thêm "phần tử trên cùng ở đây có NHÌN THẤY ĐƯỢC không"
> (có nền, có chữ, là ảnh/canvas):
>
> | | % màn hình 1280×720 |
> |---|---|
> | Chặn chuột mà có UI thật ở đó — **đúng** | 6,4% |
> | Chặn chuột mà chỗ đó trong suốt — **oan** | **2,5%** |
> | Cộng lại = diện tích hộp | 8,9% |
>
> (8,9% chứ không phải 13,8% vì phần dưới hộp đã lọt xuống canvas được.)
>
> Hai điểm dẫn trong bảng trên, đo lại: **(1100,320) có một `DIV` nhìn thấy được** và
> **(1100,520) có một `SPAN` nhìn thấy được**. Chuột phải ở đó không đi — đúng, nhưng nó **không
> nên đi**, vì có UI ở đó thật. Muốn chứng minh lỗi thì phải lấy điểm trong suốt, ví dụ
> **(1038,12)** — góc trên-trái hộp, `elementFromPoint` trả về chính `#hud-right`.
>
> **Kết luận không đổi: vẫn nên sửa, vẫn đúng 2 dòng CSS đó.** 2,5% màn hình nuốt chuột oan là
> lỗi thật. Chỉ là nó không phải "lỗi nghiêm trọng nhất trong góc này" — chuyện chữ chồng chữ ở
> §2.2, xảy ra ở **50,9% vị trí đứng trong thành**, mới là thứ người chơi gặp thường xuyên hơn.

### 2.4 Số dư dài — giả thuyết của tôi SAI

Tôi đoán số dư hàng triệu sẽ làm vỡ bố cục (xuống dòng hoặc tràn). **Không xảy ra.** Đo ở
1280×720, ép `player.silver` rồi gọi `updateHud()`:

| `player.silver` | Chuỗi in ra | `#hud-silver` w×h | mép trái |
|---|---|---|---|
| 30 | `◈ 30` | 31 × 16 | x1237 |
| 999.999 | `◈ 999.999` | 71 × 16 | x1197 |
| 1.999.998 (giá trị của `/max`) | `◈ 1.999.998` | 80 × 16 | x1188 |
| 999.999.999 | `◈ 999.999.999` | 102 × 16 | x1166 |
| 9.999.999.999 | `◈ 9.999.999.999` | 115 × 16 | x1153 |

Chiều cao **luôn 16px**, không xuống dòng, cột vẫn 230px. Chỉ mép trái lùi thêm 84px so với số dư
tân thủ. Tác hại thật không phải "vỡ", mà là: **hàng chữ tự động dài ra rồi thò sâu hơn vào tranh
vẽ**, và vì `text-align:right` nên nó *nhảy chỗ mỗi khi số đổi* — trong Tụ Linh Trận bạc cộng
12/giây (`game.js:9129`) nên chữ nhích liên tục.

Hai lỗi định dạng nhỏ đi kèm, cùng ở `game.js:20511-20512`:
- Bạc dùng `toLocaleString('vi-VN')`, **Huyền Thiết thì không**: `✦ ${player.mat} Huyền Thiết`.
  Đo được ở `mat = 99999` → in ra `✦ 99999 Huyền Thiết`. Hai dòng cạnh nhau, hai quy ước số.
- Không có `font-variant-numeric: tabular-nums`, nên chữ số bề rộng khác nhau và cả dòng rung khi
  số đếm lên.

### 2.5 Không có gì tràn khỏi màn hình — giả thuyết thứ hai của tôi cũng SAI

`#hud-right` kết thúc ở `bottom = 566px` ở cả ba độ phân giải, kể cả 720px chiều cao. Không tràn.
Vấn đề là **đè lên tranh vẽ**, không phải cắt mất.

---

## 3. Ba phương án bố cục

Nguyên tắc đứng trước cả ba: **không nhét cả 22 ô đếm lên HUD.** Chỉ hai loại xứng đáng chỗ
thường trực:

- **Bạc** — mọi tiệm, mọi lần rèn, mọi lần Hoá Chimera đều hỏi tới nó.
- **Huyền Thiết** — nhiên liệu rèn +1~+6, rơi liên tục, là tín hiệu "đủ để rèn chưa".

Còn lại: Instinct chỉ tiêu ở bảng Kỹ Năng (đã hiện ở đó, `20227`); vé quay chỉ tiêu ở bảng Khế Ước
(đã hiện, `16728`, và đã có nhắc việc khi dư ≥10, `8316`); mười ba loại vật liệu thuộc về
Túi Đồ → Vật Liệu. Việc cần làm không phải "đưa thêm lên HUD" mà là **gói hai loại thường trực
thành một khối có khung, và mở một cửa đi tới chỗ xem toàn bộ số dư còn lại.**

### Phương án A — "Ví" hai dòng có khung, bấm mở Túi Đồ → Vật Liệu

Gộp `#hud-silver` + `#hud-mat` thành **một nút** `#hud-purse`: nền mờ đặc, viền hairline,
`--r-sm`, hai dòng lưới `icon | số`, số căn phải theo cột cố định.

- **Được:** có nền ⇒ chữ NPC nằm dưới vẫn đọc được (hết hẳn lỗi chữ chồng chữ, không cần đụng tới
  code vẽ canvas); là nút ⇒ một cú bấm ra chỗ xem cả 20 loại còn lại; hai dòng ⇒ vẫn giữ được nhãn
  chữ "Huyền Thiết" cho người mới; sửa ít nhất, dùng lại đúng ngôn ngữ hình ảnh của `.hbtn`.
- **Mất:** vẫn cao ~46px, tức là vẫn là khối cao thứ hai trong cột sau minimap; thêm một nền mờ
  nữa vào một góc vốn đã có minimap + tracker cùng nền mờ.

### Phương án B — "Thanh ví" một dòng ngang

Một hàng duy nhất `◈ 1.999.998 · ✦ 999` cao 26px, bỏ chữ "Huyền Thiết", dựa vào `title` để giải
thích ký hiệu.

- **Được:** thấp nhất — giảm 20px chiều cao cột, kéo mọi thứ bên dưới (AUTO, minimap, tracker) lên
  theo, tức là giảm luôn diện tích chồng lấn đo ở §2.2 cho cả cột.
- **Mất:** ở số dư lớn hàng ngang rộng tới ~200px, tức là **đâm ngang xa hơn** vào tranh vẽ chứ
  không phải ít hơn — đúng chiều xấu mà §2.4 đo được. Và bỏ chữ "Huyền Thiết" thì `✦` mất nghĩa
  đúng lúc nó đang **trùng ký hiệu với sự kiện Xâm Lăng Vàng ở góc trái** (§1.C.2). Không nên.

### Phương án C — Chip nhỏ + ví bung ra (popover)

HUD chỉ còn một chip Bạc; bấm/rê chuột thì bung một bảng ví liệt kê đủ 20 loại tại chỗ.

- **Được:** HUD gọn nhất; mọi loại đều có chỗ xem mà không phải mở Túi Đồ; giải quyết luôn ba
  loại đang không có nhà (Instinct, Đất Hồn, Lõi Nguyên Tố).
- **Mất:** thêm một tầng trạng thái mới (mở/đóng, đóng khi bấm ra ngoài, z-index, cuộn) và trùng
  chức năng với tab Vật Liệu vốn đã làm đúng việc đó; Huyền Thiết tụt xuống hạng hai, mất tín hiệu
  "đủ để rèn"; là hạng mục lớn nhất trong ba phương án mà đổi lại chỉ là tiện nghi.

---

## 4. Khuyến nghị: **Phương án A**, kèm hai bản vá bắt buộc đi cùng

Lý do chọn A: nó xử lý đúng lỗi đã đo (chữ chồng chữ → có nền là hết), nó không làm cột **rộng
thêm** như B, và nó không đẻ thêm trạng thái UI như C. Cửa đi tới các loại còn lại là tab Vật Liệu
đã có sẵn — biến khối tiền tệ thành nút mở tab đó là cách rẻ nhất để trả lời câu "vé quay của tôi
đâu?" mà không đưa vé lên HUD.

Hai bản vá đi kèm không phải tuỳ chọn: **§4.2 là lỗi nặng hơn cả chuyện thẩm mỹ** (13,8% màn hình
không bấm được), và nó nằm đúng trong luật CSS mà phương án này đằng nào cũng phải sửa.

### 4.1 HTML — `public/game/index.html`, thay dòng **34-35**

```html
    <button id="hud-purse" class="hud-purse" title="Ví — bấm để mở Túi Đồ · Vật Liệu"
            onclick="window.moViTien()">
      <span class="hp-row"><i class="hp-ic hp-bac">◈</i><b id="hud-silver">0</b></span>
      <span class="hp-row"><i class="hp-ic hp-ht">✦</i><b id="hud-mat">0</b><em>Huyền Thiết</em></span>
    </button>
```

Giữ nguyên `id="hud-silver"` / `id="hud-mat"` trên hai thẻ `<b>` để `updateHud()` không phải đổi
cách tìm phần tử.

### 4.2 CSS — `public/game/style.css`

`style.css` đang được sửa song song nên số dòng có thể trôi; ở bản tôi đọc, hai luật cần đụng nằm
ở **dòng 79-82** (`#hud-right` và `#hud-silver,#hud-mat`) và luật chết ở **dòng 547** (`#hud-khi`).

**(a) Sửa vùng chết chuột — 2 dòng, ưu tiên cao nhất:**

```css
/* Trước: pointer-events:auto nằm trên CẢ hộp 230×554 → 13,8% màn hình ở 1280×720 không
   click-to-move và không đánh được, phần lớn là trời trong suốt (đo bằng elementFromPoint:
   75/90 điểm mẫu không chạm tới canvas). Chuột phải tại (1100,320) không đặt được moveTarget,
   trong khi (1000,320) — cùng độ cao, ngoài hộp — đặt được. Cho hộp trong suốt với chuột,
   chỉ các con của nó mới bắt. */
#hud-right { position:absolute; top:12px; right:12px; text-align:right; pointer-events:none;
  display:flex; flex-direction:column; align-items:flex-end; gap:5px; }
#hud-right > * { pointer-events:auto; }
```

**(b) Thay luật `#hud-silver,#hud-mat` bằng khối ví:**

```css
/* Ví — Bạc và Huyền Thiết là hai loại DUY NHẤT thường trực trên HUD (20 loại còn lại xem ở
   Túi Đồ · Vật Liệu, nút này mở thẳng tới đó). Có nền vì trước đây hai dòng chữ trần nằm trên
   canvas: ở 1280×720 dòng Huyền Thiết chồng lên nhãn "Thợ Rèn · Lò Rèn Hoàng Gia" 55,5×12px. */
#hud-purse { pointer-events:auto; display:grid; gap:2px; justify-items:end;
  background:rgba(18,20,44,.78); border:1px solid var(--border-faint); border-radius:var(--r-sm);
  padding:5px 9px 6px; cursor:pointer; text-align:right;
  box-shadow:inset 0 1px 0 rgba(226,235,255,.12), 0 2px 10px rgba(0,0,0,.45);
  transition:background .16s ease-out, border-color .16s ease-out; }
#hud-purse:hover { background:rgba(76,141,255,.24); border-color:var(--border-strong); }
#hud-purse .hp-row { display:grid; grid-template-columns:14px 1fr auto; align-items:baseline;
  gap:6px; line-height:1.25; }
#hud-purse .hp-ic { font-style:normal; font-size:var(--fs-md); text-align:center; }
#hud-purse .hp-bac { color:var(--gold); }
#hud-purse .hp-ht  { color:var(--accent-light); }
/* tabular-nums: bạc cộng 12/giây trong Tụ Linh Trận (game.js:9129) — chữ số biến thiên bề rộng
   làm cả dòng rung mỗi khung. min-width giữ mép trái đứng yên từ "30" tới "9.999.999.999". */
#hud-purse b { font-variant-numeric:tabular-nums; font-weight:600; font-size:var(--fs-lg);
  color:var(--text-bright); text-shadow:0 1px 3px #000; min-width:88px; text-align:right; }
#hud-purse .hp-row:nth-child(2) b { color:var(--accent-light); font-size:var(--fs-md); }
#hud-purse em { font-style:normal; font-size:var(--fs-xs); color:var(--text-dim);
  letter-spacing:.4px; }
@media (prefers-reduced-motion: reduce){ #hud-purse { transition:none; } }
```

**(c) Nhánh điện thoại** (`@media (max-width:720px)`, khối bắt đầu ở `style.css:782`) — thêm vào
để không làm vỡ nhánh đó; ở 390px thì bỏ chữ nhãn và thu số lại:

```css
  #hud-purse { padding:4px 7px 5px; }
  #hud-purse em { display:none; }
  #hud-purse b { min-width:70px; font-size:var(--fs-md); }
```

**(d) Xoá luật chết** `#hud-khi` (`style.css:547`) — không có phần tử `#hud-khi` nào tồn tại.
Nếu muốn Instinct lên HUD thì đó là quyết định riêng, không phải để một luật mồ côi nằm chờ.

**(e) Sửa chú thích sai ở `#deep-leave`** (`style.css:1047`): `#hud-right` nay kết thúc ở **566px**
chứ không phải 257px, và `top:268px` khiến nút RÚT LUI chồng lên quest tracker **213,5 × 32px**
(đo được). Đề xuất cho `#deep-leave` bám dưới cột: `top:auto; bottom:150px;` hoặc đưa nó vào chính
`#hud-right` để flex tự xếp — nhưng đây là quyết định riêng, nêu ra để không sửa sót.

### 4.3 `game.js` — đúng **hai dòng**, `20511` và `20512` trong `updateHud()`

Hiện tại:

```js
el('hud-silver').textContent = `◈ ${Math.floor(player.silver).toLocaleString('vi-VN')}`;
el('hud-mat').textContent = `✦ ${player.mat} Huyền Thiết`;
```

Đổi thành (ký hiệu và chữ "Huyền Thiết" đã nằm trong HTML, và Huyền Thiết cũng được nhóm chữ số
cho giống Bạc — hiện `mat = 99999` in ra `✦ 99999 Huyền Thiết`):

```js
el('hud-silver').textContent = Math.floor(player.silver).toLocaleString('vi-VN'); // Tụ Linh cộng số lẻ mỗi khung
el('hud-mat').textContent    = Math.floor(player.mat || 0).toLocaleString('vi-VN');
```

Thêm một hàm mở ví, đặt cạnh `window.setBagTab` (`game.js:19991`):

```js
// Nút Ví trên HUD: mở thẳng Túi Đồ ở tab Vật Liệu — đó là chỗ xem số dư của 20 loại tiền tệ
// không nằm trên HUD.
window.moViTien = function(){ window.bagTab = 'mat'; togglePanel('bag'); };
```

### 4.4 Ba việc dọn kèm (không thuộc bố cục, nhưng cùng chỗ)

1. **Ba loại tiền tệ không có nhà.** Thêm vào `MAT_ROWS` (`game.js:19768-19779`) để nút Ví thật
   sự dẫn tới "xem được mọi thứ":
   - `Instinct` — `get:()=>Math.floor(player.khi||0)`, hiện chỉ có ở dòng phụ tab Kỹ Năng `20227`;
   - `Đất Hồn` — `get:()=>datHon()`, hiện chỉ có ở bảng Chimera `16425`;
   - `Lõi Nguyên Tố` — `get:()=>player.noidan||0`, hiện chỉ nằm ở tab Box Kundun `20089`.
2. **Ba loại chết** (§1.B): Tinh Trần, Nguyệt Trần, Mã Thầu. Hoặc mở cửa hàng đổi vật phẩm như
   chú thích `3452` hứa, hoặc gỡ ô đếm và quy đổi trong `loadGame()` — đúng cách đã làm ba lần
   với Anima (`6306-6309`), Công Huân Lệnh (`6403`) và Tâm Đắc (`6381`). Riêng dòng chữ
   Mã Thầu ở `8630` và `8704` đang **hứa một cơ chế đã bị gỡ** — phải sửa dù chọn đường nào.
3. **Ký hiệu trùng** (§1.C). Ít nhất tách `✦` ra: Huyền Thiết và sự kiện Xâm Lăng Vàng (`25092`)
   đang dùng chung một glyph và cùng hiện trên một khung hình. Bộ ký hiệu phương Tây mà
   `CLAUDE.md` liệt kê còn `✧ ✹ ♦ ▲ ⚑` chưa dùng cho tiền tệ.

---

## 5. Bám hệ thiết kế

- Màu: chỉ dùng token `:root` đang có — `--gold` (bạc, đúng vai "currency" trong bảng token),
  `--accent-light` (Huyền Thiết, giữ đúng màu hiện tại ở `style.css:82`), `--text-bright`,
  `--text-dim`, `--border-faint`, `--border-strong`. **Không thêm mã màu mới.**
- Bo góc: `--r-sm` — đúng nấc mà SKILL.md gán cho "HUD icon buttons, small chips".
- Cỡ chữ: `--fs-lg` / `--fs-md` / `--fs-xs`, không đẻ thêm cỡ nửa pixel.
- Bộ chữ: kế thừa, tức là Be Vietnam Pro. Không khai báo `font-family` mới.
- Độ nổi: `inset 0 1px 0` cạnh trên sáng + đổ bóng xuống — ánh sáng từ trên, đúng quy ước
  "Depth & Elevation".
- Chuyển động: 160ms `ease-out` trên `background`/`border-color`, có `prefers-reduced-motion`.
- `z-index`: không đặt mới — nút nằm trong `#hud` (`z-index:10`).
- Nền tối `#10122a`, nền ví `rgba(18,20,44,.78)` cùng họ với `#quest-tracker`
  (`rgba(18,20,44,.7)`) và `.hbtn` (`rgba(30,32,64,.88)`) — không phải nền sáng.
- Không có `blur` / `backdrop-filter`.
- Chữ người chơi thấy: "Ví", "Huyền Thiết", "Vật Liệu" — không có thuật ngữ tu tiên, không có
  ký tự Hán, không có danh từ riêng MU Online.

### Ghi chú ngoài phạm vi

`#hud-name` đang in danh hiệu trong ngoặc **`【…】`** (đo được: `【Kẻ Báo Thù】 Ashgrove Winter
+500`). U+3010/U+3011 là dấu câu khối CJK. Lệnh kiểm trong `CLAUDE.md` dùng dải `[一-鿿]`
(U+4E00–U+9FFF) nên **không bắt được cặp ngoặc này**. Không thuộc nhiệm vụ tiền tệ, nêu ra để
phiên sau quyết.
