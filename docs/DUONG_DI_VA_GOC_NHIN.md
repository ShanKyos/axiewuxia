# Đường đi chỉ định và góc nhìn — đo trước, đề xuất sau

> Câu hỏi của chủ dự án: làm sao để người chơi **đi theo một con đường** tới cuối map, hai bên là
> cây cối, giữa đường là quái. Muốn **cảm giác thật nhất có thể**, và **không bắt buộc phải
> isometric** — thử góc nhìn khác cũng được.
>
> Tài liệu này đo engine hiện có trước khi đề xuất, vì ba lần trước trong dự án này (xem
> `cham_map.py` và §2 của `PROMPT_MAP_ISOMETRIC.md`) tôi đã cam kết theo một lý thuyết rồi hỏng.

---

## 1. Điều bất ngờ: engine ĐÃ làm được gần hết

Trước khi bàn góc nhìn, đây là những gì `game.js` đang chạy sẵn — tôi đã đọc lại và ghi số dòng:

| Thứ | Ở đâu | Trạng thái |
|---|---|---|
| **Xếp lớp theo trục y** | `game.js:11001` `ents.sort((a,b)=>a.y-b.y)` | ✅ Đã có. Gộp chung quái · người chơi · **cây** · cổng · công trình rời, rồi vẽ theo thứ tự y. |
| **Cây/đá CHẶN đường** | `game.js:2005` `decorObs` | ✅ Đã có. Decor sinh vật cản thật, không phải hình vẽ suông. |
| **Công trình rời có ảnh riêng** | `MAP_VAT_SRC` + `case 'vat'` | ✅ Đã có, xếp lớp bằng CHÂN (`y + h`) — đúng chiều sâu. Đang dùng đúng 1 lần (lò rèn). |
| **Đa giác đi được** | `md.diTrong`, `trongDaGiac()` | ✅ Đã có. Ngoài đa giác là chặn hết. Đang dùng đúng 1 map (Quảng Trường Cũ). |
| **Camera kẹp theo khổ map** | `game.js:5958` | ✅ Đã có. Map rộng bao nhiêu cũng cuộn đúng. |
| **Vẽ nền chỉ mảnh lọt khung** | `game.js:10851` | ✅ Đã có. Map dài không tốn thêm chi phí vẽ. |

**Nghĩa là: cái người chơi cần — đi sau gốc cây, bị cây chặn, đi trong một hành lang — engine
không thiếu một mảnh nào.** Việc còn lại nằm ở DỮ LIỆU và ART, không phải ở máy.

Hai chỗ đang hụt, và cả hai đều nhỏ:

1. **Cây rải NGẪU NHIÊN.** `game.js:7754`: `decor.push({ type:'tree', x:rnd(60,MAP.w-60), … })` —
   map chỉ khai `trees: 34` là một con số đếm. Không có chỗ nào đặt cây ở toạ độ chỉ định.
2. **Cây vẽ bằng VECTOR** (`drawTree`, "ink trees"). Đây đang là một khoản nợ của CLAUDE.md
   Luật 3 (*KHÔNG DÙNG VECTOR. CHẤM HẾT.*) và đúng là việc còn nợ #142.

---

## 2. Vì sao map hiện tại thấy "giả" — một nguyên nhân, ba triệu chứng

Cả ba thứ đã phải chữa bằng vá đều mọc từ MỘT gốc: **toàn bộ cảnh vật bị nướng chết vào một tấm
tranh nền phẳng, vẽ dưới mọi thứ khác.**

| Triệu chứng | Vá tạm đang dùng | Gốc thật |
|---|---|---|
| "Đi trên không trung" | Đổi tranh sang nhìn từ trên xuống | Tranh nền CHÍNH LÀ mặt đất |
| Đi đè lên cây | 54 ellipse vô hình suy từ tranh | Cây trong tranh không phải vật thể |
| Đứng "sau" gốc cổ thụ hiện ra như đứng "trên" nó | 8 chữ nhật chặn kín | Tranh nền không xếp lớp theo y được |

Vá thứ ba là chỗ đau nhất: nó **cố tình bỏ chiều sâu** để đổi lấy việc không nhìn thấy lỗi. Ghi
rõ trong `can_tu_tranh.py` rằng ngày nào có lớp tiền cảnh xếp theo y thì quay lại.

**Ngày đó là bây giờ, và không cần viết engine mới.**

### Kiến trúc đúng: tách TRANH NỀN thành ĐẤT + VẬT THỂ

- **Tranh nền** = CHỈ mặt đất: đường mòn, cỏ, sỏi, bóng đổ mềm. Không cây, không đá, không nhà.
- **Vật thể** = PNG cắt alpha rời, đặt ở toạ độ chỉ định, đi qua đúng đường `decor`/`vatTo` đã có.

Một thay đổi này trả về cùng lúc bốn thứ:

1. **Chiều sâu thật** — đi ra sau cây được, vì engine đã xếp lớp theo y sẵn.
2. **Vật cản CHÍNH XÁC** — lấy thẳng từ chân vật thể. `can_tu_tranh.py` (đoán vật liệu từ màu)
   trở nên **không cần nữa**; mọi rủi ro kiểu "cổng torii sơn đỏ bị nhận nhầm là lá" biến mất.
3. **Bố cục sửa được** — dời một cái cây là sửa một dòng số, không phải sinh lại cả tấm tranh.
4. **Tái dùng** — một tấm đất dùng cho nhiều map, đổi bộ vật thể là ra vùng khác.

Và đây chính là chỗ **bộ art Axie đã có sẵn dùng được**: `story/` và `events/arena/` có **7 lớp
`*_Ground.png`** cùng **~12 vật thể cắt sẵn alpha** (`5_TREE1/2/3`, `10_TREE2`, `7/8/9/10_ROCK`,
`8_TEMPLE`, `13_STATUE`, `6_WATER`). Ba lần nướng hỏng trước đây là vì tôi cố **lát chúng thành
nền** — phóng một dải cao 300px lên 1024² thì không sinh thêm chi tiết. **Dùng chúng làm VẬT THỂ
đứng trên nền là việc hoàn toàn khác, và là đúng việc chúng được cắt ra để làm.**

---

## 3. Đường đi chỉ định: `diTrong` đã đủ, không cần một dòng engine nào

Một hành lang chỉ là một đa giác đi được dài và hẹp. `trongDaGiac()` không quan tâm đa giác béo
hay gầy. Quảng Trường Cũ đã chứng minh đường này chạy được, và `test_sandat` **tự động bắt đầu
canh bất kỳ map nào khai `diTrong`** — viết map mới là có bài kiểm ngay.

### Nhưng hai ngưỡng bài kiểm đang đóng băng giả định "ĐỒNG TRỐNG"

| Bài | Ngưỡng | Vì sao chặn hành lang |
|---|---|---|
| `test_sandat:20` | map PK phải ≥ **55%** khung là sàn | Hành lang chỉ ~25-35% |
| `test_domap:16` | `thoang` ≥ **55%** ô lưới đi được | Y hệt |

Đây **đúng cùng một loại lỗi** với hai con số 7 tôi vừa gỡ trong `test_dinhhinh` và `test_viacot`:
một con số đo được ở ngày viết bài, rồi bị hiểu thành luật vĩnh viễn. Cách sửa không phải hạ
ngưỡng — mà là **hỏi câu đúng cho từng hình dạng map**:

```
md.hinh = 'donggo'  (mặc định)  → giữ nguyên: sàn ≥ 55%
md.hinh = 'hanhlang'            → đo thứ khác:
    · bề ngang hành lang KHÔNG chỗ nào dưới ~340px (≈3,5 thân người — đủ chỗ đánh nhau)
    · có đúng MỘT đường liền từ cổng vào tới cổng ra
    · không có ngách cụt dài quá ~600px (đi vào rồi phải quay đầu = bực)
```

Ba phép đó bắt được lỗi thật của hành lang, thứ mà "≥55% sàn" không bao giờ bắt được.

---

## 4. Khổ map dài: `MAP` đang là TOÀN CỤC — và sửa rẻ hơn tưởng

`game.js:261` — `const MAP = { w: 2600, h: 1900 }`, **không nơi nào gán lại**. Mọi map trong game
đều đúng một khổ. Có **62 chỗ đọc `MAP.w`** và **62 chỗ đọc `MAP.h`**.

Nghe như một đợt sửa lớn, nhưng không phải: `const` chỉ cấm **gán lại tên**, không cấm sửa thuộc
tính, và cả 124 chỗ đều đọc **lúc gọi**. Nên đặt một dòng trong `travelTo()`:

```js
MAP.w = md.w || 2600;  MAP.h = md.h || 1900;
```

là toàn bộ 124 chỗ đúng ngay. Camera đã kẹp theo `MAP` sẵn (`game.js:5958`), lưới tìm đường đã
huỷ khi đổi map sẵn. Chỉ phải soi lại bản đồ thu nhỏ và mọi chỗ **nhớ** số đo cũ.

### Khổ nào sinh được bằng AI

Trần một lần sinh của Nano Banana Pro ≈ **12,6 MP**:

| Hình dạng | Khổ | Điểm ảnh | Sinh 1 lần? |
|---|---|--:|---|
| Vuông (hiện nay) | 2600×1900 | 4,9 MP | ✅ |
| Làn ngang | 5200×1500 | 7,8 MP | ✅ |
| **Làn dài** | **6400×1400** | **9,0 MP** | ✅ |
| Chữ L | 4200×2600 | 10,9 MP | ✅ |
| Thế giới 3×3 (đã bác trước đây) | 7800×5700 | 44,5 MP | ❌ 3,5× quá trần |

**Hành lang dài DỄ sinh hơn map vuông to.** Đây là điều ngược với trực giác và là lý do đáng
làm: cùng một lần sinh, 6400×1400 cho ra **5 màn hình chiều ngang** để đi, thay vì 2.

---

## 5. Bốn góc nhìn — và vì sao góc nhìn KHÔNG phải thứ quyết định "thật"

Nói thẳng trước: thứ làm nên cảm giác thật, xếp theo sức nặng, là

1. **Xếp lớp chiều sâu** (đi ra sau vật) — engine đã có, chỉ thiếu vật thể rời.
2. **Vật thể có chiều cao thấy được** — cây phải ĐỨNG, không phải là hoa văn trên đất.
3. **Một hướng sáng thống nhất** cho cả nền lẫn vật thể.
4. Góc nhìn — **xếp thứ tư**.

Đổi góc nhìn mà vẫn nướng cây vào tranh thì vẫn thấy giả y như cũ.

| | A · Nhìn thẳng từ trên (~90°) | B · Isometric dẹt 2:1 | **C · 3/4 nghiêng (~60°)** | D · Cuộn ngang |
|---|---|---|---|---|
| Ví dụ | Zelda cổ | Diablo II, Ragnarok | **MU Online (đúng thứ MU dùng)** | Golden Axe |
| Cây có đứng lên không | ❌ nhìn xuống nóc | ✅ | ✅ rõ nhất | ✅ |
| Đi ra sau cây | ❌ vô nghĩa | ✅ | ✅ | ✅ |
| Model AI vẽ có ổn định không | ✅ dễ | ⚠️ phải giữ lưới 2:1 cứng — **đúng chỗ ba lần nướng trước hỏng** | ✅ vẽ theo lối tranh, không phải giữ lưới | ✅ |
| Vật cản hợp hình gì | tròn | ellipse dẹt 2:1 (**đã cài sẵn**) | ellipse dẹt ~2,5:1 | chữ nhật |
| Hợp với "tri ân MU Online" | ✕ | gần | **✅ đúng** | ✕ |
| Di chuyển 8 hướng | ✅ | ✅ | ✅ | ✕ |

**Chỗ hóc của góc 3/4 thật (có phối cảnh): một tấm nền phẳng không thể đúng phối cảnh trên suốt
6400px cuộn** — điểm tụ chỉ đúng ở một vị trí camera.

**Và đây là mấu chốt của cả đề xuất:** nếu hành lang chạy **NGANG** và camera nhìn **vuông góc
với hành lang**, thì phối cảnh **không đổi dọc theo trục cuộn** — cuộn sang ngang bao xa cũng
vẫn đúng. Đó chính là cách các game 2.5D cuộn ngang xưa nay vẫn làm, và nó khớp chính xác với
thứ chủ dự án mô tả: *hai bên là cây, giữa là đường và quái, đi tới cuối map*.

---

## 6. Đề xuất: **LÀN NGANG, góc 3/4, nền chỉ có đất, cây là vật thể rời**

```
   ┌──────────────────────────────────────────────────────────────┐
   │  hàng cây XA  (vật thể, y nhỏ — vẽ TRƯỚC người chơi)         │  y  200- 900
   ├──────────────────────────────────────────────────────────────┤
   │                                                              │
   │  ĐƯỜNG MÒN — diTrong.  Quái đứng ở đây.  Rộng 400-560px      │  y  900-1400
   │  ┌ khoảnh 1 ┐  ╳ nút thắt ┌ khoảnh 2 ┐  ╳  ┌ khoảnh 3 ┐      │
   ├──────────────────────────────────────────────────────────────┤
   │  hàng cây GẦN (vật thể, y lớn — vẽ ĐÈ LÊN người chơi)        │  y 1400-1900
   └──────────────────────────────────────────────────────────────┘
    cổng vào                                              cổng ra
      x=150                                                x=6250
```

- **Khổ 6400×1400** — 5 màn ngang, 1,8 màn dọc. Một lần sinh 4K là đủ (9,0 MP).
- **Dải đi được cao 400-560px** ≈ 4-6 thân người (thân vẽ ra 95px) — đủ chỗ né và vòng sườn,
  không phải một đường ống.
- **Hai hàng cây** đều là vật thể rời. Hàng gần vẽ ĐÈ lên người chơi — đây là thứ cho ra cảm
  giác "mình đang ở TRONG rừng" thay vì "mình đang trượt trên một tấm tranh rừng".
- **3-4 khoảnh** chia bằng nút thắt tự nhiên (thân cây đổ, vòm đá, khe suối). Mỗi khoảnh một dân
  số quái, cấp tăng dần. Thang cấp vì thế **ánh xạ vào quãng đường thật** — đi xa hơn = quái
  nặng hơn, không cần một dòng chữ nào giải thích.
- **Trùm vùng đứng cuối làn**, sau khoảnh cuối. "Đi tới cuối map" có phần thưởng.

### Vì sao đây là phương án nên chọn

- Là góc nhìn **MU Online thật sự dùng** — hợp Luật 1 hơn isometric dẹt.
- **Né đúng chỗ ba lần nướng trước đã hỏng**: không bắt model giữ một lưới 2:1 cứng trên cả khung.
- **Rẻ hơn về điểm ảnh** so với map vuông cùng thời lượng chơi.
- Dùng được **hàng thật trong bộ art Axie** (`_Ground.png` + vật thể cắt alpha) đúng theo cách
  chúng được cắt ra để dùng.
- Trả lời **nguyên văn** thứ được hỏi: đường chỉ định, cây hai bên, quái giữa đường.

### Nó đánh đổi cái gì — nói rõ

- **Đi lang thang tự do mất đi.** Map hiện tại là đồng trống, muốn đi đâu thì đi. Làn thì có
  hướng. Với map cày quái thì đây là được, không phải mất — nhưng nó là một thay đổi thật về
  chất chơi, không phải chỉ đổi art.
- **Cần bộ vật thể cắt alpha.** Đây là phần việc mới thật sự. ~12 cái có sẵn từ bộ Axie, còn lại
  phải sinh. Cũng chính là lúc trả nợ Luật 3 (cây/đá vector) và việc #142.
- **AUTO và tìm đường phải soi lại** trong hành lang hẹp — lưới 20px với đường rộng 400px là
  ổn, nhưng phải đo, không đoán.

---

## 7. Thứ tự làm — và một mẫu thử RẺ trước khi cam kết

Đừng dựng lại năm map theo một lý thuyết. Tài liệu này đã ghi ba lần làm thế và hỏng cả ba.

**Bước 0 — mẫu thử một làn (nửa ngày).** Chưa cần art mới:
1. `MAP.w/MAP.h` theo từng map (một dòng trong `travelTo` + soi bản đồ thu nhỏ).
2. Cho `decor` nhận **toạ độ chỉ định** thay vì chỉ nhận con số đếm.
3. Dựng một làn 6400×1400 dùng LẠI tranh `bg_corran.jpg` kéo dãn — xấu, nhưng đủ để đi thử.
4. `diTrong` = hành lang. Hai hàng cây bằng chính cây vector đang có.
5. **Chụp màn hình rồi nhìn.** Cảm giác đi trong làn có đúng không? Đi sau cây có đọc ra không?

Nếu bước 0 nhìn sai thì mới mất nửa ngày, và ta biết trước khi đặt một tấm art nào.

**Bước 1 — art thật.** Nền chỉ-đất 6400×1400 + bộ vật thể cắt alpha. Thay cây vector.

**Bước 2 — luật kiểm theo hình dạng map.** `md.hinh`, ba phép đo ở §3.

**Bước 3 — chuyển dần.** Mỗi map một làn, hoặc giữ vài map đồng trống cho khác nhịp. Không phải
map nào cũng buộc thành làn.

---

## 8. Điều tôi CHƯA kiểm được

Nói rõ để không ai đọc tài liệu này như một bảo đảm:

- **Chưa đo bản đồ thu nhỏ với khổ map khác.** Nó có thể đang nhớ tỉ lệ 2600×1900.
- **Chưa thử model có giữ nổi chất liệu đồng đều trên khung 4,57:1 không.** Khung dài bất thường
  là chỗ model hay đổi phong cách giữa chừng. Phải sinh thử một tấm mới biết.
- **Chưa đo AUTO trong hành lang hẹp.** Nó chọn bãi theo khoảng cách; làn dài có thể làm nó chạy
  dọc map thay vì đánh tại chỗ.
- **Con số 340px bề ngang tối thiểu là suy từ thân người 95px, chưa chơi thử.** Phải chỉnh lại
  sau bước 0.

---

## 9. Mẫu thử đã chạy — kết quả, và bốn con bọ nó lôi ra

Bước 0 ở §7 đã làm xong: map **Lối Mòn Corran** (`loimon`), 6400×1400, hình học sinh bằng
`tools/dung_lan.py`, **không có tranh nền** — cố ý.

### 9.1 Máy móc thì chạy được

| Đo được | Số |
|---|---|
| Khổ map riêng | 6400×1400 (5 màn ngang) |
| Sàn đi được | 33,9% khổ map · **liền một khối 100%** (loang nước 9556/9557 ô) |
| Bề ngang làn | 368-496px = **3,9-5,2 thân người**, thắt đúng hai chỗ đã thiết kế |
| Quái | 53 con, 6 bãi, ba loài C38 → C42 → C48 xếp theo quãng đường |
| Cây đặt tay | 193, hai hàng men mép |
| Vật che trong làn | 14 tảng đá · 39,5% ô sàn nằm trong tầm 120px của một tảng |

Băng qua nút thắt thì banner vùng nổi lên ("ĐẠI HẠT NHÂN · Quái C48-48 — mạnh nhất vùng") —
tức nhịp "sang chặng mới" đọc ra được mà không cần thêm một dòng chữ nào.

### 9.2 Nhưng NHÌN thì chưa ra con đường — và đó là câu trả lời cần có

Chụp màn hình ở giữa làn: hai hàng cây có đó, nhưng là **những chấm nhỏ rời rạc**, không đọc ra
là bức tường rừng. Mặt đất phẳng một màu nên **không phân biệt được chỗ đi được với chỗ không**.

Đây đúng là thứ mẫu thử sinh ra để biết, và nó chốt được một điều: **hành lang có đọc ra hay
không nằm ở ART, không nằm ở hình học.** Hình học đã đúng — đo được, gác được bằng bài kiểm.
Cái còn thiếu là hai thứ đã nêu ở §2: nền chỉ-đất có vẽ đường mòn, và vật thể cắt alpha đủ to.

Nói cách khác: **cây vector hiện tại quá nhỏ để làm mép đường.** Trả nợ Luật 3 không còn là việc
dọn dẹp cho gọn — nó là việc chặn đường của cả hướng đi này.

### 9.3 Bốn con bọ mẫu thử lôi ra — cả bốn đều có trước, chỉ chưa ai chạm tới

1. **`_vungDatCum` đọc `MAP` TOÀN CỤC.** Nó bung miền dân số cho một map bất kỳ, nhưng lấy khổ
   của map người chơi đang đứng. Bảng bung lại CÓ NHỚ, nên bung nhầm một lần là sai vĩnh viễn.
   Hậu quả đo được: hai trong ba miền dân số của làn ra **rỗng, im lặng**.
2. **Bộ lọc decor xoá sạch vật thể đặt tay.** `decor.filter(d => !inObstacle(...))` sinh ra để
   dọn cây rải ngẫu nhiên mọc giữa hồ. Cây viền hành lang nằm NGOÀI `diTrong` theo đúng thiết
   kế — 193 cây khai ra, **0 cây còn lại**.
3. **`rimBuild` không biết `diTrong`.** Nó chỉ lần theo `MAP_OBSTACLES`, nên map chặn bằng đa
   giác có mép **vô hình**. Với map dạng làn thì cái mép ấy CHÍNH LÀ con đường.
4. **Du hiệp bốc điểm một lần rồi phó mặc `nearestFree`.** Bán kính dò ngắn, nên trên map hẹp
   nó đứng luôn ngoài vùng đi được.

Cả bốn đã vá. Còn một con **chưa vá, ghi thành việc riêng**: đòn lao/xung của quái không gọi
`collideObstacles`, nên đuổi người chơi vài nghìn khung là quái xung ra ngoài hành lang.

### 9.4 Ba bài kiểm chốt cứng giả định "đồng trống"

Cùng một lỗi với hai con số 7 đã gỡ hôm nay: một số đo được ở MỘT hình dạng, bị hiểu thành luật
cho MỌI hình dạng.

| Bài | Chốt cứng | Nay hỏi gì |
|---|---|---|
| `test_sandat` | map PK phải ≥55% sàn | Làn thì đo **bề ngang chỗ hẹp nhất** ≥340px |
| `test_domap` | đi được ≥55% · đường kính ≤2600px | Làn có sàn riêng 25%; trần đường kính bỏ qua vì **chiều dài chính là thứ được đặt hàng** — nhịp đã có `keNhau` canh |
| `test_domap` | khổ lưới chốt một lần lúc vào bài | Dựng lại theo từng map (trước đó mọi điểm x>2400 bị đọc lệch chỉ số) |

Và một sửa nữa không phải chuyện hình dạng: `test_sandat` đo vị trí quái SAU khi đi thử, nên nó
thật ra đang hỏi "quái có đuổi ra khỏi làn không" chứ không phải "máy đặt đúng chỗ chưa". Đã dời
phép đo lên TRƯỚC các lượt đi. Nhân vật cấp 1 cũng chết giữa 53 con C38-48 và cờ `dead` khoá
`update()` vĩnh viễn — mọi lượt đi sau đó đứng im, mà bài lại báo "đa giác cắt sàn làm hai".

### 9.5 Việc kế tiếp, theo thứ tự

1. **Tranh nền chỉ-đất 6400×1400 có vẽ đường mòn.** Đây là thứ quyết định làn có đọc ra không.
2. **Vật thể cắt alpha đủ to thay cây vector** — kể cả chỉ dùng ~12 cái có sẵn của bộ Axie.
3. Chụp lại, so với ảnh hôm nay. Nếu vẫn không đọc ra thì vấn đề nằm ở GÓC NHÌN, và lúc đó mới
   đáng bàn chuyện đổi sang 3/4 thật sự — chứ không phải bàn trước khi biết.

### 9.6 Một bài kiểm chập chờn — đã chẩn, KHÔNG sửa

`test_resscale` đỏ ngẫu nhiên, và **không liên quan gì tới đợt việc này** (xanh trên HEAD sạch,
xanh 3/3 lượt riêng trên cây đã sửa, đỏ trong lượt chạy đầy đủ).

Chẩn được chính xác: nó bắt bộ tự chỉnh chất lượng phải HẠ khi FPS tụt dưới 55, và không được hạ
khi không tụt. Nhưng mẫu FPS luôn có một cú tụt xuống đúng 30,0 lúc nạp map — có mặt ở **mọi**
lượt chạy, xanh lẫn đỏ. Ai rơi bên nào của ngưỡng là chuyện tải máy đúng một giây đó.

Đã thử sửa hai vòng: (a) chỉ cho cửa sổ quan sát quyền kích, bỏ mẫu `before`; (b) bỏ 5 mẫu đầu
rồi đòi tụt LÂU (≥3/25 mẫu). Vòng (b) chạy 4 lượt ra 3 xanh 1 đỏ — và lượt đỏ đỏ ở **nhánh
ngược lại**: chỉ 2/25 mẫu dưới ngưỡng nên bài xếp là "máy khoẻ", trong khi bộ tự chỉnh vẫn hạ.

Tức là mỗi lần sửa chỉ DỜI chỗ chập chờn, không bỏ được nó: đây là một hệ ồn, phụ thuộc máy, mà
bài lại phán bằng một ngưỡng cứng hai chiều. **Đã trả bài về nguyên trạng HEAD** thay vì chỉnh
tiếp — chỉnh một bài đo hiệu năng cho tới khi nó xanh là đúng cái bẫy `cham_map.py` đã ghi.

Muốn chữa thật thì phải đổi câu hỏi, không đổi ngưỡng: cho bộ tự chỉnh ghi lại lý do nó hạ/không
hạ, rồi bài đọc CHÍNH quyết định ấy, thay vì đoán ngược từ FPS.
