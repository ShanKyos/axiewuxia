# Khảo sát Cánh (đợt 2) — ĐIỂM GẮN, HÌNH BÓNG BA BẬC, và CƠ CHẾ BAY

> **Đọc trước:** `docs/KHAO_SAT_CANH.md` (đợt 1 — chỉ số, ba bậc, công thức chế tạo). Tài liệu
> này KHÔNG lặp lại phần đó; nó chỉ trả lời hai câu hỏi đợt 1 làm chưa tới.
>
> **Phạm vi.** Khảo sát **thiết kế và hình học**. Không tải, không giải nén, không chuyển đổi bất
> kỳ tài nguyên nào của MU Online (BMD/OZJ/OZT/texture/âm thanh), không chép mã nguồn của họ. Mọi
> toạ độ trong tài liệu đều đo/tính từ **hình vẽ vector của chính dự án này**.
>
> **Tên riêng.** Phần 1–2 nêu tên gốc MU Online vì đó là phần *tham chiếu*. Không đề xuất đưa tên
> riêng nào của họ vào text người chơi thấy (QUY TẮC SỐ 2, `CLAUDE.md`).

## ⚠ Hai cảnh báo phải đọc trước khi trích số

**1. `WebFetch` bị proxy chặn hoàn toàn**, y như đợt trước: `muonline.fandom.com`,
`muonline.webzen.com`, `muonline.net` đều trả `EGRESS_BLOCKED`. Mọi khẳng định về MU dưới đây chỉ
xác nhận được qua **trích đoạn công cụ tìm kiếm**. Nặng hơn: **không một wiki hay guide MU nào mô
tả HÌNH DÁNG cánh** — tất cả chỉ có bảng chỉ số. ⇒ **Toàn bộ tỉ lệ ở Phần 1 và toàn bộ dấu hiệu
hình khối ở Phần 2 là ƯỚC LƯỢNG TỪ QUAN SÁT ẢNH PHỔ BIẾN, CHƯA KIỂM CHỨNG.** Dùng làm hướng tạo
hình, đừng dùng làm căn cứ chốt. Chỗ nào có nguồn thật thì có link kèm.

**2. `public/game/game.js` đang bị một phiên khác SỬA SONG SONG trong lúc khảo sát.** `veCanh()`
đã được viết lại **hai lần** trong 30 phút (mtime 09:08 rồi 09:12 ngày 03/09/2026), và các hằng
còn đang trôi (`CANH_GOC_X` 21 → 22, `CANH_GOC_Y` −116 → −117, `canhVienThuy()` mọc thêm tham số
`cong`/`nhon`). Vì vậy tài liệu này **không** cố chụp lại từng dòng mã. Nó chia làm hai phần rạch
ròi:
- **Phần 3 — CHẨN ĐOÁN** bản gây ra lời phàn nàn ("nhìn như cái váy"), đo trên bản trên đĩa lúc
  08:45–09:07. Đây là phần có giá trị lâu dài: nó nói *vì sao* hỏng.
- **Phần 4 — CHỈ TIÊU NGHIỆM THU** bằng tỉ lệ, không bằng toạ độ tuyệt đối, nên không lỗi thời khi
  mã đổi; kèm kết quả đo bản viết lại (ảnh chụp 09:08, md5 `8873c203…`).

Theo yêu cầu, **không sửa bất kỳ file nào trong `public/game/`.**

---

## Phần 0 — Số đo giải phẫu nhân vật (căn cứ chung)

Không có bảng này thì không nói được "sát vai" là bao nhiêu pixel.

Nhân vật dựng trong hộp bộ xương `HERO_W×HERO_H = 160×220`. Khi vẽ trong màn, `drawPlayer()` thu
nhỏ bằng `s = 104/220 = 0,47273` rồi đặt tâm hộp tại `(p.x, p.y − 42)`. Điểm bộ xương `(X, Y)`
rơi vào thế giới tại `(p.x + (X−80)·0,47273 , p.y − 42 + (Y−110)·0,47273)`.

| Mốc | Bộ xương `Y` | Trong màn (so với `p.y`) | Nguồn |
|---|---|---|---|
| Chóp sừng mũ | 36 | `p.y − 77,0` | `HERO_GEAR.thieulam.upper` |
| **Đỉnh đầu** | **60** | **`p.y − 65,6`** | ô mặt `[[58,60],[102,60],…]` |
| Cằm | 88 | `p.y − 52,4` | — |
| Cổ (`HERO_JOINT.neck`) | 94 | `p.y − 49,6` | `HERO_JOINT`, dòng 12537 |
| **Góc trên giáp thân = XƯƠNG BẢ VAI** | **96** (x = 58 và 102) | `p.y − 48,6` | `hPoly([[56,96],[104,96],…])` |
| **Khớp vai (`shL`/`shR`)** | **100** (x = 52 và 108) | **`p.y − 46,7`** | `HERO_JOINT`, dòng 12537 |
| Khớp hông | 142 | `p.y − 26,9` | `HERO_JOINT` |
| **Thắt lưng** | **146** | **`p.y − 25,0`** | `hJoint(g, 80, 146, ps.lean, …)` + đai lưng |
| Đầu gối | 171 | `p.y − 13,2` | `HERO_JOINT` |
| **Bàn chân** | **212** | **`p.y + 6,2`** | bóng đổ `hEll(g, 80, 212, …)` |

**Ba hằng số dùng suốt tài liệu:**
`H = 152` (chiều cao thân, đỉnh đầu → bàn chân, đơn vị bộ xương; trong màn = **71,9 px**) ·
`V = 56` (bề ngang vai, trong màn = **26,5 px**) · gốc toạ độ quy chiếu = **bàn chân, hero (80, 212)**.

> ⚠ **Đính chính đầu bài.** Đầu bài nêu "vai ≈ `p.y − 30`" và "trên chân dung vai ở `y ≈ 146`".
> Đọc mã thì **`y = 146` là ĐƯỜNG THẮT LƯNG** (trục `hJoint` để nghiêng thân, và đúng chỗ vẽ đai
> lưng). **Khớp vai thật ở `y = 100` = `p.y − 46,7`**, cao hơn con số đầu bài **17 px**. Lấy nhầm
> `p.y − 30` làm "vai" thì bộ toạ độ mới sẽ lại ra một đôi cánh mọc ngang bụng — đúng cái lỗi đang
> phải sửa.

---

## Phần 1 — Cánh gắn vào người ở đâu

### 1.1. Nguồn nói được gì

Rất ít. Điều duy nhất tìm được có tính tạo hình nói về **vị trí của cả nhân vật**, không phải vị
trí của cánh trên lưng:

> *"Wings allow a character to hover over the ground instead of walking, and are faster than
> walking or running."*
> — trích đoạn [Wings — Mu Online Wiki (Fandom)](https://muonline.fandom.com/wiki/Wings)

Toàn bộ mục 1.2 vì thế là **quan sát lại từ ảnh phổ biến — chưa kiểm chứng**.

### 1.2. Bảy câu hỏi

| | Trả lời | Trạng thái |
|---|---|---|
| **Điểm gắn** | **Xương bả vai** — ngang hoặc ngay dưới đường khớp vai, sâu khoảng **0,03–0,06 H**. KHÔNG phải ngang gáy (cao quá, thành vòng sáng sau đầu), KHÔNG phải giữa lưng, tuyệt đối không phải ngang hông. Trên nhân vật này: bộ xương **`y ≈ 95–100`**, tức `p.y − 47` đến `p.y − 49`. | MU: chưa kiểm chứng · điểm quy chiếu: đo từ mã |
| **Gốc cánh** | **Chụm một điểm hẹp**, không loe. Mọi thùy của cùng một bên **chung một gốc**, fan ra bằng **GÓC** chứ không bằng cách hạ dần điểm gốc xuống dọc thân. Hai cánh **không chạm nhau**: khe cột sống rộng ~**0,35–0,40 V**. | MU: chưa kiểm chứng |
| **Góc mở** | **Vọt gần thẳng đứng khỏi bả vai trước, rồi mới toả ra.** Tiếp tuyến tại gốc **70–80°** so với phương ngang; dây cung gốc→mút trung bình **~30°**. Không đâm ngang (0°), không chúc xuống. | MU: chưa kiểm chứng |
| **Đỉnh cánh so với đỉnh đầu** | bậc 1 **thấp hơn** (≈ −0,02 H, chỉ vừa nhú qua vai) · bậc 2 **+0,06 H** · bậc 3 **+0,15 H** | chưa kiểm chứng |
| **Sải cánh** | ≈ **1,4 V** / **1,9 V** / **2,4 V** theo bậc — quy sang chiều cao thân là **0,55 H / 0,75 H / 0,95 H**. Bậc 3 trong nhiều tư thế còn cắt ra ngoài khung hình. | chưa kiểm chứng |
| **Chiều cao đôi cánh** | ≈ **0,40 H / 0,50 H / 0,60 H** | chưa kiểm chứng |
| **Hình bóng** | **Mút NHỌN** ở bậc 2–3 (bậc 1 tù hoặc nhọn nhẹ) — mút tròn đọc ra "cái quạt", không ra "cánh". Mép dưới **không thẳng**: gãy hai đoạn với phiến kim loại, cong lõm với lông vũ, lõm hình vỏ sò với màng. Số thùy nhìn thấy **1 → 2 → 3-4 tầng**. | chưa kiểm chứng |
| **Lúc quay lưng** | Phải thấy **mặt trong** của cánh (tối hơn ~25%) và **cụm gốc nằm ĐÈ LÊN lưng**, không khuất sau lưng. ⚠ Trong game này `veCanh()` **không nhận `p.face` cũng không nhận `ps.back`** và luôn vẽ trước thân người ⇒ **quay lưng vẽ y hệt quay mặt**. Vẫn còn nguyên ở bản 09:12. | lỗi, đọc từ mã |

### 1.3. Ba nguyên tắc để duyệt hình

1. **Gốc cánh là một CỤM, không phải một DẢI.** Thùy fan ra bằng góc. Hạ gốc xuống dọc thân là ra váy.
2. **Cánh phải CẮT QUA đường vai.** Hình nào nằm trọn dưới đường vai thì mắt đọc là "tấm gì đó đeo
   sau lưng", không đọc là cánh.
3. **Đáy cánh không được chạm thắt lưng.**

---

## Phần 2 — Phân biệt bậc 1 / 2 / 3 bằng HÌNH KHỐI

Đây là phần quan trọng nhất: ba bậc hiện nhìn gần giống nhau.

**Nguyên tắc gốc (chắc chắn, và là thứ dự án đang thiếu):** MU không phân biệt bậc bằng "sáng
hơn" hay "to hơn". Nó đổi **VẬT LIỆU** và **ĐỘ PHỨC TẠP HÌNH KHỐI**. Ba bậc là ba CHẤT khác nhau:
**vật chất thô → vật chất quý + kim loại → năng lượng**. Mỗi bậc phải thắng ở **một trục khác
nhau**, chứ không phải cùng một trục to dần.

### 2.1. Sáu trục phân biệt

| Trục | Bậc 1 | Bậc 2 | Bậc 3 |
|---|---|---|---|
| **(a) Số tầng thùy** | **1 tầng** (tối đa 2 thùy/bên) | **2 tầng** — thêm hẳn một lớp thùy phụ **dưới** thùy chính | **3–4 tầng** xếp lệch nhau, **không cùng nhịp vỗ** (lớp ngoài trễ pha lớp trong) |
| **(b) Mút cánh** | **tù / bo tròn**, hoặc nhọn nhẹ. Không móc | **nhọn**, có **MÓC/vuốt** ở đầu mút | nhọn và **kéo dài thành vệt**, có mút phụ |
| **(c) Gai & xương sống** | **không có** khung, không gai. Chỉ lông vũ hoặc màng trơn vài gân ngón | **xương/khung kim loại RÕ và DÀY** dọc mép trước; mép có **gai** hoặc **răng cưa/rách** | khung mảnh lại, phần lớn diện tích **không còn là mặt đặc** |
| **(d) Dải / đuôi rủ** | **không** | đuôi ngắn ở thùy dưới | **dải sáng dài** + **vệt sáng kéo theo khi di chuyển** (bậc 1–2 không có) |
| **(e) Phát sáng** | **KHÔNG một chút nào** — mốc để hai bậc trên có chỗ leo | **viền sáng ở MÉP**, ruột cánh vẫn đặc. Chưa có hạt bay | **viền mạnh + HẠT BAY liên tục + LÕI PHÁT SÁNG**; ruột là màn bán trong suốt, viền sáng hơn ruột |
| **(f) Màu** | **nhạt, gần đơn sắc**, bão hoà thấp | **bão hoà CỰC ĐẠI** — đỏ cam rực, tím sáng, lam bạc. Đây là bậc chói nhất | **độ sáng tăng nhưng bão hoà GIẢM** — trắng ở tâm, màu ở viền |

*(Toàn bộ bảng: chưa kiểm chứng. Đợt 1 mục A.5 cũng đã ghi cùng cảnh báo này.)*

### 2.2. Trạng thái trong game này

`WING_TIERS` (dòng 401) hiện chỉ đánh ba trục: `sai` 40→52→66, `thuy` 2→3→4, `vien` 0→1,8→2,4.

- ✔ **Trục (a)** — có, đúng hướng.
- ✔ **Trục (e)** một nửa — `vien` cho bậc 2–3, và bậc 1 đúng luật là **không** viền.
- ❌ **Trục (b)** — mút cánh dùng **chung một công thức** cho cả ba bậc.
- ❌ **Trục (c)** — gai/xương/răng cưa: không bậc nào có; `canhNetRieng()` phân biệt theo **dáng
  lớp** (`phien`/`long`/`quang`/`than`) chứ **không theo bậc**.
- ❌ **Trục (d)** — không bậc nào có đuôi rủ hay vệt kéo theo.
- ❌ **Trục (f)** — màu do `WING*_DEFS[lớp].color` quyết định, thang bão hoà giữa ba bậc **không có
  quy luật** (ví dụ Dark Knight: `#8a92a4` → `#5c6270` → `#c8d4e8`, tức xám nhạt → xám tối → xám
  sáng, không phải nhạt → bão hoà → sáng).

⇒ **Trên sáu trục thì hai trục rưỡi được đánh.** Đó là lý do ba bậc nhìn giống nhau. Trục rẻ nhất
để thêm ngay là **(c) gai/răng cưa theo BẬC** và **(d) đuôi rủ ở bậc 3** — cả hai chỉ là thêm vài
đoạn đường vào biên thùy, không cần hệ mới.

---

## Phần 3 — Chẩn đoán: **vì sao nó ra dáng "mọc từ hông"**

> Đo trên bản `public/game/game.js` trên đĩa lúc **08:45–09:07** — bản đang chạy khi chủ dự án xem
> hình và phàn nàn. Bản này đã bị viết lại lúc 09:08, nhưng phần chẩn đoán vẫn phải giữ: nó là lý
> do, và là thứ ngăn lỗi tái phát.

Hình học cũ, cho mỗi thùy `k` (toạ độ **pixel thế giới**, gốc tại `p.y`):

```
S   = S0 * (1 - 0.17*k)      // S0 = 40 / 52 / 66
goc = -24 + 6*k              // ← THỦ PHẠM
moveTo           (side*6,          goc)                              // gốc cánh
quadraticCurveTo (side*S*0.57+veo, -44-lift+goc*0.4,
                  side*S+veo,      -32-lift+goc*0.5)                 // mút cánh
quadraticCurveTo (side*S*0.74,     -16+goc*0.5,
                  side*8,          -15+goc*0.6)                      // khép về thân
```

**(1) Gốc thùy chính đặt đúng đường thắt lưng.** Gốc ở `p.y − 24`; thắt lưng ở `p.y − 25,0` —
**lệch 1 px**. Vai ở `p.y − 46,7`, tức gốc cánh **thấp hơn vai 22,7 px** trên thân người chỉ cao
**71,9 px**. Một mình nguyên nhân này đã đủ hỏng hình.

**(2) `goc = -24 + 6*k` kéo gốc các thùy còn lại TỤT DẦN XUỐNG CHÂN** — đây là chỗ đẻ ra hình váy:

| Bậc | Thùy | Gốc thùy cuối | Cao hơn bàn chân | Ngang đâu |
|---|---|---|---|---|
| 1 | 2 | `p.y − 18` | 24,2 px (34% thân) | trên hông chút ít |
| 2 | 3 | `p.y − 12` | 18,2 px (25% thân) | **giữa đùi** |
| 3 | 4 | `p.y − 6` | **12,2 px (17% thân)** | **giữa bắp chân** |

Bốn gốc trải **18 px** theo chiều đứng, trong khi thân trên (vai → hông) chỉ cao **20 px**. Một bó
rẻ quạt có gốc trải gần bằng cả thân trên, bắt đầu từ thắt lưng và kết thúc ở bắp chân — **đó
chính xác là định nghĩa của cái váy**.

**(3) Không thùy nào vươn quá vai.** Mút thùy chính luôn ở `p.y − 44`, tức **thấp hơn khớp vai
2,7 px ở CẢ BA BẬC**. Cả đôi cánh nằm gọn trong dải `p.y − 44 … p.y − 6` = hông + đùi + bắp chân.
Cánh không cắt qua đường vai, nên mắt không có lý do gì đọc nó là cánh.

**(4) Mép dưới không theo nhịp vỗ.** `lift` chỉ cộng vào hai điểm của cung trên, **không** cộng vào
cung dưới. Mỗi khung hình **diện tích** hình cánh phình rồi xẹp, thay vì cả cánh **xoay** quanh
gốc. Cánh thật vỗ bằng cách xoay quanh khớp; cái này thì co giãn như vải bị gió.

**Hai lỗi phụ đo ra luôn:** (i) ở chân dung `co = 1,9` nên mút cánh ở `x = 80 + sai·1,9` = 156 /
**179** / **205** trên khung rộng **160** ⇒ **bậc 3 bị xén 45 px mỗi bên**; (ii) `lech` của
Spellblade khoá bên cụt vào **bên trái MÀN HÌNH**, trong khi thân người lật cả khối bằng
`ctx.scale(-1,1)` **sau** lời gọi `veCanh` ⇒ chạy sang trái thì vai trần một bên, cánh cụt bên kia.

---

## Phần 4 — Chỉ tiêu nghiệm thu (viết bằng TỈ LỆ, không lỗi thời khi mã đổi)

Dùng đơn vị bộ xương (`H = 152`, `V = 56`, đỉnh đầu `y = 60`, khớp vai `y = 100`, thắt lưng
`y = 146`).

### 4.1. Năm chỉ tiêu bắt buộc

| # | Chỉ tiêu | Ngưỡng |
|---|---|---|
| **N1** | **Gốc cánh nằm trên bả vai** | `95 ≤ y_gốc ≤ 102` và khoảng cách ngang tới trục thân trong `18…24` px |
| **N2** | **Cụm gốc, không phải dải gốc** | `max(y_gốc) − min(y_gốc) ≤ 6` (= 0,04 H) qua mọi thùy |
| **N3** | **Cánh cắt qua đường vai** | đỉnh cung của thùy chính `< 100` |
| **N4** | **Đáy cánh trên thắt lưng** | điểm thấp nhất của bóng cánh `< 146` |
| **N5** | **Ba bậc đọc được từ xa** | đỉnh cánh: bậc 1 **dưới** đỉnh đầu · bậc 2 **trên** đỉnh đầu · bậc 3 **trên đỉnh đầu ≥ 0,10 H (≥ 15 px)**; sải đôi tăng ít nhất **1,7×** từ bậc 1 sang bậc 3 |

### 4.2. Kết quả đo bản viết lại (ảnh chụp **09:08**, md5 `8873c203…`)

Bản mới chuyển hẳn sang **hệ toạ độ bộ xương**, gốc `CANH_GOC_X/Y` cho hero `(80±21, 96)`, mỗi bên
`translate` **một lần** rồi các thùy chỉ khác nhau bằng `g.rotate(0.22*k + vỗ)`.

| Chỉ tiêu | Đo được | Kết quả |
|---|---|---|
| N1 gốc | hero `(80±21, 96)` — **cao hơn khớp vai 4 px**, đúng góc trên giáp thân `(58,96)/(102,96)`; cách trục thân 21 px = 0,75× nửa bề ngang vai | ✔ **ĐẠT** |
| N2 cụm gốc | trải **0 px** (mọi thùy chung một `translate`, chỉ khác góc xoay) | ✔ **ĐẠT tuyệt đối** |
| N3 cắt đường vai | đỉnh cánh `y =` **78,1 / 72,8 / 66,5** — đều trên `100` | ✔ **ĐẠT** |
| N4 đáy trên thắt lưng | đáy `y =` **106,4 / 109,5 / 113,2** — trên thắt lưng **39,6 / 36,5 / 32,8 px** | ✔ **ĐẠT** |
| N5 đọc bậc từ xa | đỉnh cánh **thấp hơn** đỉnh đầu ở **cả ba bậc** (−18,1 / −12,8 / **−6,5 px**); sải đôi 122 → 146 → **174 px** = 2,18 V → 2,61 V → 3,11 V, chỉ tăng **1,43×** | ❌ **TRƯỢT** |

**⇒ Bốn trên năm đạt. Vấn đề "mọc từ hông" đã được xử lý dứt điểm.** Hai việc còn lại:

**(A) Không bậc nào vươn quá đỉnh đầu.** Đỉnh cung mép trước bằng **0,4464 · W** (hệ số của cặp
`-0.50W / -0.44W` trong `canhVienThuy`). Bậc 3: `0,4464 × 66 = 29,5 px` trên gốc → `y = 66,5`,
vẫn thấp hơn đỉnh đầu `60` là 6,5 px. Muốn bậc 3 vượt đầu **≥ 15 px** thì cần đỉnh cung
`≥ 51 px` = **0,773 · W**. Đổi hai hệ số y của mép trước:

| Cặp hệ số `(ctrl, cổ tay)` | Hệ số đỉnh cung | Đỉnh bậc 3 (hero `y`) | So với đỉnh đầu `60` |
|---|---|---|---|
| `(−0,50 W, −0,44 W)` — hiện tại | 0,4464 | 66,5 | **−6,5** ❌ |
| `(−0,60 W, −0,52 W)` | 0,5294 | 61,1 | −1,1 ❌ |
| `(−0,70 W, −0,60 W)` | 0,6125 | 55,6 | +4,4 |
| **`(−0,85 W, −0,70 W)`** | **0,7225** | **48,3** | **+11,7** (0,077 H) |
| `(−1,00 W, −0,80 W)` | 0,8333 | 41,0 | +19,0 (0,125 H) |

Khuyến nghị **`(−0,85 W, −0,70 W)`** cho bậc 3 và giữ cặp hiện tại cho bậc 1 — tức **cho cặp hệ số
đi theo BẬC**, vì đó cũng chính là cách rẻ nhất để đánh trục phân biệt (b) ở Phần 2.

**(B) Thang sải quá phẳng.** `sai = 40/52/66` cho sải đôi 122/146/174 px, tỉ số bậc 3 / bậc 1 chỉ
**1,43×**; tham chiếu MU đọc ra khoảng **1,7×**. Hai phương án tính sẵn:

| `sai` | Sải đôi (px) | Theo bề ngang vai | Tỉ số bậc 3 / bậc 1 |
|---|---|---|---|
| 40 / 52 / 66 (hiện tại) | 122 / 146 / 174 | 2,18 V / 2,61 V / 3,11 V | 1,43× ❌ |
| **32 / 52 / 72** | 106 / 146 / 186 | 1,89 V / 2,61 V / 3,32 V | **1,75×** ✔ |
| 30 / 50 / 74 | 102 / 142 / 190 | 1,82 V / 2,54 V / 3,39 V | 1,86× ✔ |

Khuyến nghị **32 / 52 / 72**: giữ nguyên bậc 2 (không phá cân bằng đã quen), **thu bậc 1 lại** cho
đúng tinh thần "chỉ nhú khỏi bả vai", **nới bậc 3**. ⚠ Bậc 3 khi đó có mút ở `x = 80 + 93 = 173`
trên khung chân dung rộng **160** ⇒ **vẫn bị xén 13 px mỗi bên**; hoặc chấp nhận (chân dung vốn là
ảnh cắt), hoặc kẹp `co` riêng cho chân dung ở bậc 3.

### 4.3. Ba việc khác vẫn còn nguyên ở bản 09:12

1. **Quay lưng vẽ y hệt quay mặt.** `veCanh()` vẫn không nhận `p.face` / `ps.back`, vẫn luôn vẽ
   trước thân người. Đi ra xa là mất sạch điểm gắn — đúng cái đang cần khoe.
2. **Cánh lệch của Spellblade không lật theo hướng nhìn** (lỗi (ii) ở Phần 3): `lech` vẫn khoá theo
   `side < 0` là bên trái **màn hình**, còn thân người lật bằng `ctx.scale(-1,1)` **sau** lời gọi.
3. **Ba bậc chưa đánh bốn trục còn lại** ở bảng 2.1 — xem 2.2.

### 4.4. Phép thử một dòng, chạy được mà không cần render

```
(N2)  max(y_gốc) - min(y_gốc)  <= 6
(N3)  đỉnh cung thùy chính      <  100
(N4)  điểm thấp nhất bóng cánh  <  146
(N5)  đỉnh cánh bậc 3           <= 45     // vượt đỉnh đầu 60 ít nhất 15 px
```

Bản 08:45 trượt **cả bốn**. Bản 09:08 đạt N2/N3/N4, trượt N5.

---

## Phần 5 — Cơ chế BAY

### 5.1. MU Online nói gì — có nguồn

| Câu hỏi | Trả lời | Nguồn |
|---|---|---|
| Bay ngay hay bấm phím? | **Bay ngay, KHÔNG có phím.** Đeo cánh là **lơ lửng THAY CHO đi bộ**. | [Fandom — Wings](https://muonline.fandom.com/wiki/Wings): *"hover over the ground instead of walking"* |
| Tốc độ đổi bao nhiêu? | **Nhanh hơn cả đi lẫn chạy**; cánh bậc cao nhanh hơn bậc thấp; riêng **Cape of Emperor** có hẳn dòng *"Increased Movement Speed"*. **CON SỐ %: chưa kiểm chứng** — không nguồn nào cho. | *"faster than walking or running"* ([Fandom](https://muonline.fandom.com/wiki/Wings)) · [MU Online Fanz — Wings & Capes](https://muonlinefanz.com/guide/items/wings/) · [Emperor's Cape](https://muonlinefanz.com/tools/items/data/itemdb/Emperor's%20Cape.php) |
| Bay ở mọi bản đồ? | **Mọi nơi.** Ngoài ra cánh là **chìa khoá vào bản đồ Icarus** — không cánh (hoặc không thú cưỡi biết bay) thì bị chặn ngay cổng. Cấp yêu cầu: các nguồn ghi 150/160/170 lệch nhau, **chưa kiểm chứng**. | [MU Online Fanz — Icarus](https://muonlinefanz.com/tools/maps/data/mapdb/Icarus.php) · [InfinityMU — Icarus](https://wiki.infinitymu.net/index.php?title=Icarus) · [muonline.ai](https://www.muonline.ai/guide/en/icarus) |
| Bay có tác dụng địa hình? | Có — *"allows characters to fly over water, obstacles, and elevation"*. Bay là **đi qua địa hình**, không chỉ là hiệu ứng nhìn. | [ViciadosMU](https://viciadosmu.com.br/en/guias/sistema-de-asas-wings) · [mutop100](https://www.mutop100.com/guides/mu-online-wings-guide) |
| Có đường khác để bay? | **Thú cưỡi biết bay**: Dinorant vào Icarus không cần cánh; Fenrir từ cấp 110. "Bay" là **một quyền, hai nguồn cấp**. | [Dinorant](https://muonlinefanz.com/tools/items/data/itemdb/Dinorant.php) · [Mounts](https://muonlinefanz.com/guide/items/mount/) |

**Chưa kiểm chứng — không nguồn nào nhắc tới, đừng chép thành sự thật:** nhấc lên bao nhiêu; bóng
đổ xử lý ra sao; chân co hay duỗi; có pha cất/hạ cánh riêng không; nhịp vỗ đứng yên vs bay đi có
khác không; đánh nhau / nhặt đồ / nói chuyện NPC khi bay (**suy luận** gián tiếp là được hết, vì
cánh là trang bị cuối game đeo thường trực ở mọi bản đồ — nhưng đó là suy luận, không phải nguồn).

Một trích đoạn nói *"when a character walks on a safe zone, the fly effect is automatically
disabled"* nhưng đến từ **diễn đàn phát triển server tư** (RaGEZONE), **không phải bản chính thức**
— đợt 1 đã chốt luật loại nguồn server tư khỏi bảng chính. **Không dùng.**

**Ba thứ đáng chép, và không cái nào là một con số:**
1. **Bay là TRẠNG THÁI THƯỜNG TRỰC**, không phải kỹ năng bấm phím. Không thanh năng lượng, không
   hồi chiêu, không phím tắt. Giữ cánh đúng vai trò "trang bị".
2. **Bay NHÌN THẤY ĐƯỢC TỪ XA** — đó là lý do nó đáng giá.
3. **Bay mở ra ĐỊA HÌNH**, không chỉ đẹp.

### 5.2. Hiện trạng trong game này — đã có sẵn hơn một nửa

| | Giá trị | Dòng (bản 09:12) |
|---|---|---|
| Hằng độ cao | `BAY_CAO = [11, 17, 24]` px theo bậc | **453** |
| Biến trạng thái | `let bayCao = 0` — **biến module**, cố ý không nhét vào `player` để không chui vào save | **458** |
| Đích | chỉ phụ thuộc **món cánh đang mặc**, không điều kiện bản đồ | trong `drawPlayer` |
| Nội suy | `bayCao += (_bayDich − bayCao) * 0.08` mỗi **khung hình** | trong `drawPlayer` |
| Dịch cả người | `yOff = −bayCao`, bọc toàn bộ thân + cánh + danh hiệu | trong `drawPlayer` |
| Bóng đổ | `_shK = (1 − _bobK*0.20) * (1 − bayK*0.42)` — **vừa co vừa nhạt** | trong `drawPlayer` |
| Tắt nhịp bước & bụi gót | nhịp nhún × `(1 − bayK)`; bụi gót chỉ khi `bayK < 0.3` | trong `drawPlayer` |
| **Vỗ nhanh & mạnh hơn khi bay** | `chuKy = d.chuKy / (1 + B*0.4)` · `bienGoc = d.bien*0.035*(1 + B*0.9)` — **mới thêm ở bản 09:08** | trong `veCanh` |

Quy ra số thật:

| Bậc | Nhấc lên | % chiều cao thân (71,9 px) | Bàn chân từ `p.y+6,2` lên | Bóng: bán kính | Bóng: độ đậm |
|---|---|---|---|---|---|
| 1 | **11 px** | 15% | `p.y − 4,8` | 16 → **12,9** (−19%) | 0,200 → **0,162** |
| 2 | **17 px** | 24% | `p.y − 10,8` | 16 → **11,2** (−30%) | 0,200 → **0,141** |
| 3 | **24 px** | 33% | `p.y − 17,8` | 16 → **9,3** (−42%) | 0,200 → **0,116** |

**Cất cánh / hạ cánh**: có, nhưng chỉ là nội suy mũ, không phải hoạt ảnh. Hệ số `0,08`/khung ⇒ đi
95% quãng đường sau **35,9 khung**, chốt hẳn sau **65–74 khung**. Ở 60 Hz là **0,60 s** /
**1,08–1,23 s**; ở 144 Hz là **0,25 s** / **0,45–0,51 s**. ⚠ **Phụ thuộc tần số khung hình** —
chú thích trong mã thừa nhận và chấp nhận điều này.

### 5.3. Bảy câu hỏi về bay — trả lời cho game này

| Câu hỏi | Hiện trạng |
|---|---|
| Có cánh là bay ngay, hay bấm phím? | **Bay ngay, không phím.** Đúng luật MU. |
| Bay ở mọi bản đồ? | **Mọi bản đồ, kể cả trong thành.** Không có điều kiện bản đồ nào. |
| Nhấc khỏi mặt đất bao nhiêu? | **11 / 17 / 24 px** theo bậc = 15% / 24% / 33% chiều cao thân. |
| Bóng đổ có đổi không? | **Có** — co và nhạt tới 42% ở bậc 3. Đã làm đúng; đây là tín hiệu chính cho biết đang lơ lửng. |
| **Chân co lại hay duỗi?** | ❌ **KHÔNG ĐỔI GÌ — lỗi nặng nhất còn lại.** `heroPose()` (dòng 12602) chỉ nhận `mv = !!p.moving`; đang bay thì `legL/legR/kneeL/kneeR/liftL/liftR` vẫn chạy trọn chu kỳ sải chân ⇒ **nhân vật giậm chân chạy bộ giữa không trung**, trái hẳn *"hover **instead of walking**"*. |
| **Tốc độ di chuyển đổi bao nhiêu %?** | ❌ **0%.** `player.speed = 209` (dòng 5649); `calcDerived()` chỉ cộng tốc độ từ `VH.tieusi` (+12%) và `MZ.spdPct`, **không** từ cánh. |
| Có hoạt ảnh cất/hạ cánh không? | **Chỉ có nội suy độ cao.** Không tư thế riêng, không hiệu ứng, không âm thanh. |
| Đang bay đánh nhau / nhặt đồ / nói chuyện NPC được không? | **Được hết** — `bayCao` **chỉ tồn tại trong `drawPlayer()`**, không hàm luật chơi nào đọc nó. Bay hiện là **thuần hình ảnh**. |
| Nhịp vỗ đứng yên vs bay đi có khác không? | ✔ **Có, từ bản 09:08**: chu kỳ ngắn lại **1,4×** và biên độ góc lớn hơn **1,9×** ở độ cao tối đa. Nhưng nó theo **ĐỘ CAO** (`bayK`), không theo **có đang di chuyển hay không** — đứng yên lơ lửng và lao đi vẫn vỗ như nhau. |

### 5.4. Bốn việc còn thiếu, xếp theo mức đáng làm

1. **Tư thế bay** — thêm tham số `bay` (0…1) cho `heroPose()`, nội suy chu kỳ sải chân về một tư
   thế treo: chân sau **duỗi** (`legL ≈ +0,20`), chân trước **co** (`kneeR ≈ −0,45`,
   `liftR ≈ −5`), thân **ngả trước** `lean += 0,10` khi đang di chuyển. Theo đúng quy ước
   `CLAUDE.md`: tham số mới **thêm ở CUỐI** để mọi lời gọi cũ vẫn chạy. Đây là việc đáng làm nhất —
   nó sửa thứ mắt bắt ngay lập tức.
2. **Tốc độ di chuyển theo bậc cánh** — MU nói bay nhanh hơn chạy nhưng **không có con số kiểm
   chứng được**, nên phải tự chọn thang. Đề xuất **+6% / +10% / +14%** (`player.speed`
   209 → 222 / 230 / 238). Chọn nhỏ vì chú thích ngay tại dòng đó ghi *"khoảng cách map tuned theo
   số này"*. ⚠ Phải đi qua `calcDerived()` như mọi chỉ số khác, **không** sửa trong `drawPlayer`.
3. **Tách nhịp vỗ theo DI CHUYỂN, không chỉ theo độ cao** — đứng yên lơ lửng thì vỗ chậm giữ thăng
   bằng, lao đi thì vỗ gấp. Rẻ: nhân thêm `(p.moving ? 0.78 : 1)` vào `chuKy` và
   `(p.moving ? 1.3 : 1)` vào `bienGoc`.
4. **Cất/hạ cánh thành một pha có mặt mũi** — khi `bayCao` đang tăng: một vòng bụi ở chân + biên độ
   vỗ ×1,8 trong 0,25 s đầu; khi đang giảm: chân duỗi xuống trước rồi mới chạm đất. Muốn bỏ phụ
   thuộc tần số khung hình thì đổi `*0.08` thành `*(1 - Math.pow(0.92, dt*60))` — nhưng
   `drawPlayer` hiện không có `dt`.

**Việc CHƯA nên làm:** cho bay **qua địa hình** (nước, vật cản, chênh cao) như MU. Nghe hấp dẫn
nhưng nó biến bay từ hiệu ứng hình ảnh thành **luật va chạm**, đụng `unstickPlayer()` và toàn bộ
thiết kế đường đi của mọi bản đồ. Tách thành một đợt riêng.

---

## Phụ lục — Nguồn đã dùng

Toàn bộ là **trích đoạn của công cụ tìm kiếm**; `WebFetch` bị proxy chặn nên **không trang nào
được đọc trực tiếp**. Bị chặn (`EGRESS_BLOCKED`): `muonline.fandom.com`, `muonline.webzen.com`,
`muonline.net`.

- [Wings — Mu Online Wiki (Fandom)](https://muonline.fandom.com/wiki/Wings) — *"hover over the
  ground instead of walking, and are faster than walking or running"* (**nguồn quan trọng nhất của
  Phần 5**)
- [Wings & Capes — MU Online Fanz](https://muonlinefanz.com/guide/items/wings/) — tăng tốc độ di chuyển
- [Emperor's Cape — MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Emperor's%20Cape.php) — dòng "Increased Movement Speed"
- [Icarus — MU Online Fanz](https://muonlinefanz.com/tools/maps/data/mapdb/Icarus.php) · [Icarus — InfinityMU](https://wiki.infinitymu.net/index.php?title=Icarus) · [Icarus — muonline.ai](https://www.muonline.ai/guide/en/icarus) — cánh là điều kiện vào bản đồ
- [Dinorant — MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Dinorant.php) · [Mounts — MU Online Fanz](https://muonlinefanz.com/guide/items/mount/) — thú cưỡi biết bay thay cánh
- [Wings Season 6 — ViciadosMU](https://viciadosmu.com.br/en/guias/sistema-de-asas-wings) · [MU Online Wings Guide — mutop100](https://www.mutop100.com/guides/mu-online-wings-guide) — bay qua nước / vật cản / độ cao
- [2nd Level Wing — InfinityMU](https://wiki.infinitymu.net/index.php?title=2nd_Level_Wing) — bậc 2 nhanh hơn bậc 1 (⚠ wiki server tư — chỉ dùng làm chỉ dấu định tính, **không lấy số**)

**Không có nguồn nào mô tả hình dáng cánh.** Toàn bộ Phần 1.2 và Phần 2.1: **chưa kiểm chứng**.
