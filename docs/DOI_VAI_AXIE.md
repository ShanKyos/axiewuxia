# Đổi Vai — Axie làm thân, Cổ Vật làm xác

> **Trạng thái: ĐẶC TẢ, chưa thi công.** Prototype nhìn thử: `public/game/proto_doivai.html`.
> Danh mục 15 Cổ Vật: `docs/CO_VAT_15.md`.
>
> Tài liệu này chốt **kiến trúc**. Nó không chốt con số cân bằng — mọi con số dưới đây là
> điểm xuất phát để đo, trừ **trần 16%** ở §5, cái đó là hợp đồng chứ không phải tham số.

---

## 1. Đổi cái gì, trong một câu

Hôm nay: **người cầm vũ khí, Axie chạy theo.**
Từ nay: **Axie cầm vũ khí, một bộ giáp rỗng chạy theo.**

Và bộ giáp rỗng đó là thứ quay ra từ banner.

---

## 2. Vì sao — ba con số, không phải ba cảm giác

| Đo được | Con số | Nghĩa là |
|---|---|---|
| Cỡ Chimera trong màn | khoá cứng ở **0,45 thân người** (`CHI_THAN`) | thiết kế hiện tại **chủ động ép IP của mình nhỏ lại**, và ghi hẳn lý do là "không bao giờ được lấn át nhân vật" |
| Art giáp người chơi nhìn thấy | **1/5** của `HERO_SETS` | 25 bộ đã thiết kế, mỗi người chơi chọn một lớp nên **80% số art giáp không ai nhìn thấy bao giờ** |
| Hệ nguyên tố | Kim · Mộc · Thuỷ · Hoả · Thổ, 40 con quái | **Ngũ Hành** — tàn dư kiếm hiệp to nhất còn sót, đúng thứ Quy tắc số 1 cấm đích danh |

Ba chỗ này cùng được chữa bằng một lần đổi vai, chứ không phải ba đợt việc rời nhau.

Và cốt truyện thì **vốn đã** đứng sẵn ở phía này: canon ghi Vaeldra trút tận thế lên Lunacia
rồi mới cử đội tiên phong sang. Nghĩa là vai người chơi hiện nay là **kẻ gây hoạ dắt theo một
nạn nhân**. Đổi vai xong thì đúng chiều: anh là Lunacia, và những gì còn lại của đội tiên phong
Vaeldra — **bộ giáp, không phải con người** — buộc mình vào anh để chuộc.

---

## 2b. ⚠ CHỐT LẠI (bản sau) — Axie là AVATAR THUẦN, chỉ số ở 5 lớp

Chủ dự án chốt bằng chữ: *"Chỉ số của nó tới từ 5 class. Axie chỉ đơn thuần là avatar thôi,
khi tấn công thì ví dụ Dark Wizard sẽ xuất hiện và tung chiêu."*

Câu đó **đơn giản hoá cả đợt việc**, và nó đè lên vài chỗ viết trước ở §3/§5 — chỗ nào lệch thì
mục này thắng.

| | |
|---|---|
| `player` | **vẫn nguyên là nhân vật của một trong 5 lớp**, không đổi gì |
| Chỉ số · trang bị · kỹ năng · Tiến Hoá · Di Sản | **ở lớp**, không ở Axie |
| Axie | **avatar thuần** — 0 chỉ số, 0 kỹ năng, 0 trang bị. Là ô để cắm NFT. |
| Lúc đánh | lớp nhân vật **hiện ra** và tung chiêu |

### ⇒ Đây không còn là đổi kiến trúc. Là đổi LỚP VẼ.

| Không phải sửa | Phải sửa |
|---|---|
| `calcDerived()` · `hurtMob()` · `castSkill()` | `drawPlayer()` — đi thì vẽ Axie, đánh thì lớp nhân vật hiện ra |
| `player.sect` · `player.equip` · `SECTS` · `HERO_SETS` | thêm một ô `player.avatar` (id Axie) |
| Save cũ | *(đọc được nguyên vẹn — không đổi tên trường nào)* |

Luật "MỘT bộ chỉ số, HAI cái thân" ở §3 **vẫn đúng và nay còn đúng hơn**: chỉ có một bộ chỉ số
thật, và nó nằm ở lớp nhân vật. Cái phải sửa là **bảng chia việc** — xem ngay dưới.

### Hai kiểu hiện, chưa chốt cái nào

`public/game/proto_doivai.html` dựng cả hai, bấm nút để đổi:

| Kiểu | Lớp nhân vật | Đọc ra |
|---|---|---|
| **Hiện khi đánh** | chỉ vật chất hoá lúc tung chiêu rồi tan | Axie là nhân vật; lớp là **sức mạnh được gọi tới** |
| **Thường trực** | đứng chắn giữa Axie và mục tiêu, tự đánh | Axie là nhân vật; lớp là **người bảo vệ** đi cùng |

### Còn treo: NFT có khoá theo lớp không

Nếu avatar khoá 1-1 với lớp (Aquatic ⇔ Dark Wizard) thì **một NFT chỉ dùng được khi nó trùng lớp
người chơi đang chơi** — phần lớn NFT trong ví thành vô dụng. Nếu avatar tự do thì chơi Dark
Wizard mà cưỡi Axie hệ Beast được, NFT nào cũng dùng được, nhưng mất đường đọc lớp bằng mắt.
**Chưa chốt.** Nó là câu hỏi về giá trị NFT chứ không phải về cân bằng.

---

## 3. Luật nền, chốt trước mọi thứ khác

> ### MỘT bộ chỉ số. HAI cái thân.
>
> Về **cơ chế**: vẫn là một nhân vật duy nhất. Một `player`, một thanh máu, một `calcDerived()`,
> một bộ `player.equip`, một cấp. **`hurtMob` và `calcDerived` không sửa một dòng nào.**
>
> Về **hình ảnh và nút bấm**: hai cái thân chia nhau việc.

Đây là chỗ mọi thiết kế "pet mạnh" khác chết: chúng cho con pet một bảng chỉ số riêng, rồi phải
tách `calcDerived`, tách thanh máu, tách chỗ tính sát thương, và mỗi lần cân bằng là cân hai lần.

### Bảng chia việc

| | **Axie** (người chơi điều khiển) | **Cổ Vật** (cái xác, đi theo) |
|---|---|---|
| Di chuyển | ✓ click-to-move | bám theo, tự động |
| Thanh máu | ✓ **duy nhất** | **không có** — không chết, không hồi, không trông em bé |
| 4 nút chiêu | người chơi bấm, nhưng **lớp nhân vật là bên thi triển** | ✓ thi triển |
| Đòn đánh thường | ✗ — Axie không gây sát thương | ✓ **toàn bộ sát thương** |
| **Burst** | — | ✓ **nút riêng, người chơi bấm** |
| Mặc giáp (hình) | ✗ **skin thuần** — để dành NFT | ✓ mặc bộ người chơi cày được |
| Chỉ số của giáp | — | ✓ **đây là bảng chỉ số duy nhất** |
| Hệ khắc chế | ✓ quyết định (thứ duy nhất Axie còn nắm ngoài ngoại hình) | — |
| Lên cấp | — | cấp nhân vật |

⚠ **Bảng này đã sửa theo §2b.** Bản đầu chia sát thương 75-80% cho Axie và ~20% cho cái xác —
sai hẳn chiều. Nay Axie **không gây sát thương**; nó giữ đúng hai thứ: **ngoại hình** và **hệ
khắc chế**.

---

## 4. Ba lớp, ba nguồn, không lớp nào giẫm lên lớp nào

| Lớp | Là gì | Ở đâu ra | Trả lời câu hỏi |
|---|---|---|---|
| **Thân** — Axie | class, hệ khắc chế, ngoại hình | chọn / NFT | *anh là ai* |
| **Xác** — Cổ Vật | tên riêng, cơ chế riêng, burst riêng | **banner** | *anh chơi kiểu gì* |
| **Ruột** — món đồ | 5 ô, dòng phụ, +N, ngọc, Tinh Xảo | **rơi trong thế giới** | *anh đã cày bao lâu* |

Ba câu hỏi khác nhau ⇒ ba hệ không tranh nhau cái ô nào. Đây là chỗ bốn nguồn cảm hứng
(MU · Diablo 4 · HSR · Axie) xếp cạnh được thay vì chồng lên nhau:

| Nguồn | Động từ nó sở hữu | Vật thể nó sở hữu |
|---|---|---|
| MU Online | **ép & khoe** | +0→+11, ngọc, Tinh Xảo trên 5 ô giáp |
| Diablo 4 | **cày & lọc** | dòng phụ trên chính 5 ô giáp đó |
| HSR | **sưu tầm & xoay vòng** | Cổ Vật (cái xác + burst) |
| Axie | **là ai** | thân: class, hệ, skin |

### Phép thử "có phải một game không"

Có khoảnh khắc nào cả bốn cùng nằm trong một khung hình không? Có:

> Con Axie **Bird** *(Axie)* bấm phím burst → vết nứt mở, **Cổ Vật 5★ vừa quay được** *(HSR)*
> bước ra, **mặc bộ giáp người chơi tự cày** *(D4)* đang **cháy quầng cam +11** *(MU)*, nổ một
> nhát, rồi lặng xuống.

Thiết kế nào không nhét được vào một câu như thế thì nó là hệ thứ năm bị bolt vào — cắt.

---

## 5. Trần 16% — quản LỚP GACHA, không quản lớp nhân vật

> ⚠ **Đọc §2b trước.** Chỉ số cơ bản đến từ **5 lớp** và **không bị trần** — đó là tiến độ người
> chơi cày ra. Trần 16% dưới đây chỉ quản **lớp Cổ Vật quay từ banner**, nếu về sau có thêm lớp
> đó. Lẫn hai thứ là hoặc bóp chết tiến độ, hoặc mở cửa cho P2W.

### Cái xác (lớp gacha) — trần 16%, và đó là hợp đồng

Anh xác định cái xác **có chỉ số riêng và thế mạnh riêng**. Đúng, nhưng phải chốt bao nhiêu,
nếu không nó tự trôi thành nguồn sức mạnh chính trong vòng ba đợt cân bằng.

| | 3★ | 4★ | 5★ |
|---|--:|--:|--:|
| Chỉ số thô đóng góp vào tổng lực chiến | 10% | 13% | **16% ← trần cứng** |
| Cơ chế riêng | 1 dòng đơn giản | 1 dòng có điều kiện | 1 dòng **đổi cách chơi** |

> **Cổ Vật 3★ + đồ cày kỹ phải luôn thắng Cổ Vật 5★ + đồ rác.**
>
> Đây là hợp đồng với người cày. Nó in được lên trang chủ, và nó là thứ duy nhất giữ hồn MU
> sống trong một game có banner.

Khoảng cách 10 → 16% đủ để **thấy**, không đủ để **mua**.

### Cơ chế của cái xác là HÌNH, không phải LƯỢNG

Cơ chế không được là "+X% sát thương". Nó phải là một câu **đổi định nghĩa món đồ nào là đồ tốt
cho người chơi này**. Ví dụ (đầy đủ 15 cái ở `docs/CO_VAT_15.md`):

| Cổ Vật | Cơ chế | Nó đẩy người chơi đi cày cái gì |
|---|---|---|
| Giáp Khuyết · 3★ | +1 ổ ngọc trên mọi món | ngọc, càng nhiều càng tốt |
| Vỏ Thép Câm · 4★ | 30% Phòng Thủ của 5 món đổi thành Công Kích | **đồ thủ trên build sát thương** — lật ngược cả bảng đánh giá đồ |
| Hài Cốt Vệ Binh Trụ · 5★ | món từ +9 trở lên tính như hai món khi xét hiệu ứng bộ | **ép đồ** — biến +9 thành một cái đích thật |

> **Gacha phải ĐẨY người chơi vào thế giới, đừng KÉO họ ra khỏi thế giới.**
>
> Một nhân vật "+30% sát thương" giữ người ta ở lại trong bảng chỉ số. Một cái xác "ngọc Hỏa
> giờ ngon với ngươi" ném người ta ra bãi quái. Đó là lý do mô hình này **không** giết vòng
> cày của MU — nó tiếp nhiên liệu cho vòng cày.

### Ba chốt gác, thiếu cái nào là trượt thành P2W

1. **Chỉ số thô ≤ 16%** tổng lực chiến, mọi bậc sao, không ngoại lệ.
2. **Phải có ít nhất một Cổ Vật 3★ "luôn tốt"** (Giáp Khuyết). Người không nạp cần một cái nền
   vững, không phải đồ thừa.
3. **Cái xác chỉ được đổi hành vi BURST CỦA CHÍNH NÓ.** Tuyệt đối không đụng 4 chiêu của Axie.
   Đây là luật giữ đúng quyết định gỡ Khắc Ấn: *"MU không có món đồ nào ĐỔI CÁCH một chiêu hoạt
   động."* Burst là chiêu **của cái xác**, nên nó tự đổi mình thì không phạm luật đó.

---

## 6. ⚠ Trục gacha phải VUÔNG GÓC với trục tiến độ

Đây là cái bẫy đã suýt sập trong lúc thiết kế, ghi lại để đừng ai sập lại.

`HERO_SETS` là một **cái thang**: Vải Thô → Da Thú → Nhân Sư → Ma Thuật → Hư Vô. Nó là *tiến độ*.
Đặt banner lên một cái thang chỉ ra hai kết cục, cả hai đều xấu:

| Banner bán | Hậu quả |
|---|---|
| Vải Thô (dải I) | quay trúng bộ **khởi đầu** — cảm giác bị lừa |
| Hư Vô (dải V) | **mua thẳng endgame** — P2W, người cày mất lý do cày |

Không có bậc nào ở giữa thoát được, vì bản chất cái thang là "cao hơn = mạnh hơn".

> **Luật: một Cổ Vật 3★ phải dùng được ở cấp 120, và một Cổ Vật 5★ phải dùng được ở cấp 1.**

### Hai trục tách hẳn nhau

| Trục | Là gì | Nguồn |
|---|---|---|
| **Thang bậc** — 25 bộ `HERO_SETS` | Vải Thô → Hư Vô, hiện theo **bậc đồ đang mặc** | cày |
| **Cổ Vật** — cái xác | giáp **có tên**, **không có bậc**, mỗi cái một cơ chế | banner |

Một người cấp 20 quay trúng Cổ Vật 5★: dùng được ngay, và nó hiện ra dưới dạng bộ **Vải Thô**
vì đồ họ còn cùi.

> **Cái xác là AI. Bộ đồ là GIÀU CỠ NÀO.** Hai thông tin khác nhau, đọc được cùng lúc trên một
> cái thân.

### Chỗ trống đã có sẵn tên

Hệ **Cổ Thần** đã bị gỡ (`game.js:6073` — món quy ra Lumen, Mảnh Cổ Thần chỉ còn đổi Box Kundun,
nằm cùng danh sách gỡ với Tấn Phẩm · Linh Thú · Khắc Ấn). Nghĩa là ô **"Cổ Vật"** — bậc danh giá
nhất của MU, đã nằm sẵn trong từ điển dự án (`Tinh Xảo / Cổ Vật`) — **hiện đang trống**.

Cái xác đứng vào đúng chỗ đó. Không phát minh thêm một hạng mục nào.

---

## 7. Ánh xạ 5 class Axie ↔ 5 lớp hiện có

Lấy từ **6 class cơ bản** của Axie, chừa Mech / Dawn / Dusk lại làm class bí mật mở sau —
đúng canon Axie.

| Lớp hiện tại | Khoá `sect` | Axie | Vì sao khớp | Nhóm khắc chế |
|---|---|---|---|:--:|
| Dark Knight | `thieulam` | **Beast** | cận chiến, STR thuần | ① |
| Dark Wizard | `baidasan` | **Aquatic** | đánh xa, bộ chiêu nước/băng | ③ |
| Sylvan Ranger | `toanchan` | **Bird** | AGI, tầm xa, né | ③ |
| Spellblade | `minhgiao` | **Reptile** | nửa cận nửa phép | ② |
| Dark Lord | `bug` | **Plant** | trâu, chỉ huy, nuôi đồng đội | ② |

**Khoá `sect` giữ nguyên toàn bộ.** Không đổi tên khoá trong save, không đổi `SECTS`, không đổi
`O3_SKILL_ID` / `SIGNATURE_SKILL` / `HERO_SETS` / `itemUsable`. Chỉ thêm một **nhãn hiển thị**
và một **trường hệ**.

### Tam giác khắc chế thay Ngũ Hành

Tam giác chính thức của Axie:

```
  ① Beast · Bug · Mech   ──khắc──▶  ② Plant · Reptile · Dusk
  ② Plant · Reptile · Dusk ──khắc──▶  ③ Aquatic · Bird · Dawn
  ③ Aquatic · Bird · Dawn ──khắc──▶  ① Beast · Bug · Mech
```

`el:` đã chạy ±20% / −12% trong `hurtMob` từ lâu; đổi bảng hệ **không đụng công thức**, chỉ đổi
40 nhãn trong `data/canbang.js`. Được ba thứ cùng lúc: dọn tàn dư Ngũ Hành, hệ khắc chế lần đầu
có mặt mũi đọc được (hệ = class Axie, mà class Axie thì hiện ngay trên con vật), và nó là IP
nhà mình.

> ⚠ **Trong lúc đổi, sửa luôn một lỗi đang nằm đó:** có **1 con khai `'Thuỷ'`** trong khi 10 con
> khác khai `'Thủy'` (khác dấu). So chuỗi thì con đó vĩnh viễn không khắc hệ với ai.

---

## 8. Giáp và đồ — không đổi gì cả

Đây là mục ngắn nhất và là mục quan trọng nhất.

**Vòng cày MU/Diablo giữ NGUYÊN VẸN:** 5 ô giáp, dòng phụ, `+0..+11`, Chúc Phúc / Linh Hồn /
Phá Thiên Kiếp, Tinh Xảo, Lò Hỗn Độn, `JEWEL_DROP` (4 nguồn, hệ số 1 / 5 / 22 / 111), Box Kundun.
Không một dòng nào trong số đó nằm sau banner.

### Giáp DÙNG CHUNG, không phải mỗi Cổ Vật một bộ

| | Hậu quả |
|---|---|
| ❌ mỗi cái xác một bộ giáp riêng | 15 xác × 5 ô = **75 ô phải cày và quản lý**. Đây đúng là chỗ bị chửi nhiều nhất ở HSR: quay trúng xong phải cày hai tuần mới dùng được, nên đa số **không build con mới** — roster nằm không. |
| ✓ **một kho, một vòng cày** | triệu con nào thì con đó mặc bộ của người chơi, đổi da theo lớp. Xác mới quay ra **dùng được ngay**. Đổi xác không tốn gì ⇒ người chơi xoay cả roster ⇒ banner có giá trị lâu dài. |

### Art đã vẽ xong sẵn cho việc này

```js
heroSet(sectKey, t)   // game.js:12344 — LỚP và BẬC vốn đã là hai tham số RỜI
```

| Tham số | Điền bằng |
|---|---|
| `sectKey` | **Cổ Vật nào đang triệu** |
| `t` | **bậc giáp người chơi cày được** (`gearVisual()` đã tính sẵn: giai trung bình × độ phủ) |

25 bộ trong lưới `HERO_SETS` phục vụ đúng 25 tổ hợp này. **Không tốn thêm một tệp art nào**, và
nó mở khoá đúng cái 80% art giáp hiện không ai nhìn thấy.

Ví dụ chạy thử, Cổ Vật hiện ra dưới lớp Dark Wizard:

| Người chơi đang | `t` | Thấy bộ |
|---|--:|---|
| vừa quay được xác | 1 | **Vải Thô** ← "bộ giáp khởi đầu", có sẵn |
| cày một lúc | 3 | **Nhân Sư** |
| full giai 7, +11 | 5 | **Hư Vô**, cháy quầng cam +11 |

---

## 9. "Lên cấp" của cái xác = chỉ burst mạnh lên

Không gear, không chỉ số, không thanh máu. Nuôi xác chỉ làm **burst của nó to ra**.

Và bộ máy này **đã có sẵn**, thừa kế nguyên si từ `Định Hình Chimera`:

| Cần | Đã có |
|---|---|
| cấp → hệ số | `chiLvNen(lv)` · `chiLvHeSo(lv)` (`game.js:4491`) |
| bản trùng → nâng | `Huyết Thống C0–C6` |
| nhiên liệu | Đất Hồn + mảnh thừa |
| bài kiểm gác | `tests/test_dinhhinh.js` (36 chốt) |

---

## 10. Chống AUTO — tách "nó tự làm" khỏi "người chơi bấm"

Dự án đã tự chẩn: *"AUTO nuốt trọn được game"*. Một cái xác đi theo tự đánh là **thêm một đơn vị
cho máy chơi hộ**. Cách chữa không phải bỏ mô hình đi theo, mà là chia đôi nó:

| Cái xác TỰ làm | Người chơi BẤM |
|---|---|
| bám theo | **burst** — để lại cửa sổ 5-6s (vỡ giáp / đóng băng / đánh dấu) |
| đánh thường lặt vặt (~20%) | **đổi xác** — cooldown ~8s |
| bị động luôn chạy | |

**Xoay vòng chính là việc đổi xác.** Gọi xác A phá giáp → đổi sang xác B nện vào cửa sổ đó. Máy
canh được cooldown, nhưng không canh được *ba cửa sổ chồng đúng lúc bầy quái gom lại*.

Đó vừa là lý do người chơi phải cầm chuột, vừa là **động cơ giữ chân của cả cái banner**: rotation
cần nhiều xác, nên sở hữu rộng có giá trị hơn sở hữu một con mạnh nhất.

> ⚠ **Luật cứng: tối đa 1 xác hiện hình.** Ở zoom `xa` (1,0×), một con Axie + ba bộ giáp bay
> quanh là không đọc được màn. Trang bị 3, hiện 1, đổi bằng cooldown.

---

## 11. Cái gì tái dùng được — đây là lý do đợt này rẻ

| Cần | Đã có sẵn trong code | Phải làm |
|---|---|---|
| xác đi theo, tự đánh, tự tung chiêu, taunt | `updateMount()` — **và nó không có thanh máu, không chết được** | đổi nội dung, không đổi máy |
| gacha 3/4/5★, pity 90 / soft 74 / mốc 10, 50-50, 2 banner, kệ xoay 6 tuần | `KHẾ ƯỚC CHIMERA` (`game.js:4361`) | đổi bảng dữ liệu |
| nuôi xác (cấp, bản trùng, nhiên liệu) | `Định Hình Chimera` + `test_dinhhinh.js` | thừa kế |
| 25 bộ giáp × 5 lớp | `HERO_SETS` + `heroSet(sect, t)` | nối `sectKey` vào xác đang triệu |
| bậc giáp hiệu dụng | `gearVisual()` — đã nhân độ phủ | dùng thẳng |
| quầng +N ngoài đường bao | luật đã viết cho **vật thể bay**: *"quầng nằm HOÀN TOÀN ngoài đường bao"* | dùng thẳng |
| ô "Cổ Vật" trong từ điển | đã có tên, hệ cũ đã gỡ | điền vào |

**Không có hạng mục nào trong bảng này cần một cỗ máy mới.**

---

## 12. Cái gì phải gỡ hoặc đổi

| Thứ | Thành |
|---|---|
| `drawPlayer()` vẽ người | vẽ Axie; đường vẽ người chuyển sang phục vụ cái xác |
| Màn chọn lớp 5 thẻ chibi | **chọn Axie** (5 class) — chibi phải vẽ lại, đây là món art đắt nhất của đợt |
| `dangChay()` — Giày +6 mở dáng chạy | mốc tiến bộ nhìn thấy được này **chết**. Phải có mốc thay thế trên cái xác. |
| `chiCoTrongMan()` 0,45 / 0,55 | đảo chiều: nay **cái xác** là thứ không được lấn át |
| Ngũ Hành (40 nhãn) | tam giác Axie |
| `player.chimera` | đổi nghĩa: từ "con thú quay được" sang "cái xác quay được" — giữ tên trường để save cũ đọc được |

---

## 13. Đường di trú save

Nguyên tắc: **không đổi tên trường nào đang có.** `player.silver` đã có tiền lệ — giữ tên trường,
chỉ đổi chữ người chơi thấy.

| Trường | Trước | Sau |
|---|---|---|
| `player.sect` | lớp người chơi | **giữ nguyên** — nay là class Axie, cùng khoá |
| `player.chimera.co` | Chimera sở hữu | Cổ Vật sở hữu |
| `player.chimera.eq` | Chimera đang ra | Cổ Vật đang triệu |
| `player.chimera.ve.gk` | Ấn Giao Kết | **giữ nguyên** |
| `player.equip` | 5 ô + vũ khí | **giữ nguyên** |

Save cũ có Chimera: quy đổi 1-1 sang Cổ Vật cùng bậc sao, hoặc hoàn Ấn Giao Kết theo số lượt đã
quay. Chọn cách nào thì **phải ghi rõ trong ghi chú cập nhật** — người chơi mất con Chimera họ
nuôi mà không được báo là chuyện lớn hơn cân bằng.

---

## 14. Bài kiểm phải gác

| Bài | Gác cái gì |
|---|---|
| `test_covat.js §1` | mọi Cổ Vật đóng góp **≤16%** lực chiến ở 5 mốc cấp (1/30/60/90/120) |
| `test_covat.js §2` | tồn tại **≥1 Cổ Vật 3★** mà ở mọi mốc cấp đều nằm trong nhóm trên trung vị |
| `test_covat.js §3` | **không** Cổ Vật nào đụng tới 4 chiêu của Axie (chỉ đụng burst của chính nó) |
| `test_covat.js §4` | xác 3★ + đồ giai 7 +11 **thắng** xác 5★ + đồ giai 1 +0, ở cả 5 mốc cấp |
| `test_covat.js §5` | tối đa **1** xác hiện hình cùng lúc |
| `test_hesax.js` | 40 nhãn hệ đều thuộc tam giác Axie; **không nhãn Ngũ Hành nào còn sót**; không lệch dấu |
| `test_dinhhinh.js` | **giữ nguyên 36 chốt** — nếu nó đỏ thì việc thừa kế đã sai ở đâu đó |
| `test_gearlook.js` | giáp vẫn nhìn thấy được — nay đo **trên cái xác** thay vì trên người chơi |

---

## 15. Lộ trình

| Đợt | Làm gì | Cửa sinh tử |
|---|---|---|
| **1** | Axie thành avatar (5 class, ánh xạ 1-1, **zero chỉ số**) · một cái xác đi theo mặc đồ đang cày · **1 burst** | **Nhìn có đẹp không.** Phải chụp ảnh ra xem, không đọc code mà biết được. |
| **2** | Ngũ Hành → tam giác Axie · Cổ Vật lên banner (đổi nội dung gacha Khế Ước, **không thêm gacha**) · 3 ô xác + xoay vòng | roster có làm người chơi xoay không, hay vẫn chốt một con |
| **3** | Tầng Sâu thành thang điểm (tầng đòi hệ khác nhau) · dòng phụ kiểu D4 · NFT avatar cắm vào ô skin | endgame có giữ người quá 30 ngày không |

**Đợt 1 không cần đụng tới gacha.** Nó chỉ cần trả lời đúng một câu hỏi: con Axie đứng giữa màn
hình với một bộ giáp ma bên cạnh — có ra một game không, hay ra một cái lỗi hiển thị.

Dự án này đã có ba lần học cùng một bài (lớp phủ tối, trụ đá phóng to, nhẫn ra hình móng ngựa):
**vấn đề thị giác phải giải quyết bằng mắt trên ảnh chụp, không bằng suy luận trên code.**

---

## 16. Rủi ro đã biết, chưa giải

| Rủi ro | Vì sao khó | Trạng thái |
|---|---|---|
| Chibi 5 class Axie ở màn tạo nhân vật | `CHIBI_CFG` hiện khoá theo bóng dáng NGƯỜI (mũ trụ / mũ chóp / bờm / vương miện). Axie thì phân biệt bằng bộ phận, không bằng mũ. | **chưa thiết kế** |
| Mất mốc "Giày +6 mở dáng chạy" | đây là mốc hiếm hoi mà đập đồ đổi được thứ NHÌN THẤY ĐƯỢC ngoài màu sắc | cần mốc thay thế trên cái xác |
| Axie không mặc giáp ⇒ 4 ô icon giáp hiện ở đâu | `nuong_icon.py` cắt icon từ bộ giáp của người | icon vẫn dùng được, nhưng phải kiểm lại chỗ hiện |
| Thân nền chưa cắt lớp (nợ cũ) | ống chân đè vạt áo dài — nay lỗi này chuyển sang cái xác | nợ cũ, không nặng thêm |
| 2 xác cùng nổ burst | cửa sổ chồng nhau có thể nhân đôi ngoài ý muốn | luật 1-xác-hiện-hình che phần lớn, cần đo |
