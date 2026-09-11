# Đổi Vai — Axie làm thân, Cổ Vật làm xác

> **Trạng thái: ĐẶC TẢ · đợt 1 ĐÃ THI CÔNG một phần** (lớp vẽ avatar + 16 bảng khung chạy —
> xem bảng "Đã thi công" ở mục Đổi Vai trong `CLAUDE.md`). Header cũ ghi "chưa thi công" và đã
> lỗi thời so với chính commit của nhánh này. Prototype nhìn thử: `public/game/proto_doivai.html`.
> Danh mục 15 Cổ Vật: `docs/CO_VAT_15.md`.
>
> Tài liệu này chốt **kiến trúc**. Nó không chốt con số cân bằng — mọi con số dưới đây là
> điểm xuất phát để đo, trừ **trần 16%** ở §5, cái đó là hợp đồng chứ không phải tham số.

---

## 1. Đổi cái gì, trong một câu

Hôm nay: **người cầm vũ khí, Axie chạy theo.**
Từ nay: **Axie đứng giữa màn hình, và cái đánh thì do một bộ giáp rỗng vật chất hoá ra mà làm.**

Và bộ giáp rỗng đó là thứ quay ra từ banner.

> ⚠ Câu này đã sửa. Bản đầu viết *"Axie cầm vũ khí, một bộ giáp rỗng chạy theo"* — sai hai chỗ
> sau khi §2b chốt: Axie **không** gây sát thương, và bộ giáp **không chạy theo** (nó không có
> mặt trên màn cho tới lúc đánh). Xem §3.

---

## 2. Vì sao — ba con số, không phải ba cảm giác

| Đo được | Con số | Nghĩa là |
|---|---|---|
| Cỡ Chimera trong màn | khoá cứng ở **0,45 thân người** (`CHI_THAN`) | thiết kế hiện tại **chủ động ép IP của mình nhỏ lại**, và ghi hẳn lý do là "không bao giờ được lấn át nhân vật" |
| Art giáp người chơi nhìn thấy | **1/5** của `HERO_SETS` | 25 bộ đã thiết kế, mỗi người chơi chọn một lớp nên **80% số art giáp không ai nhìn thấy bao giờ** |
| Hệ nguyên tố | Kim · Mộc · Thuỷ · Hoả · Thổ, 40 con quái | **Ngũ Hành** — tàn dư kiếm hiệp to nhất còn sót, đúng thứ Quy tắc số 1 cấm đích danh |

Ba chỗ này cùng được chữa bằng một lần đổi vai, chứ không phải ba đợt việc rời nhau.

### ⚠ Lý lẽ cốt truyện — đã VIẾT LẠI, bản cũ dựa trên canon đã bỏ

> Bản đầu của mục này lập luận: *"canon ghi Vaeldra trút tận thế lên Lunacia rồi mới cử đội tiên
> phong sang, nên vai người chơi hiện nay là kẻ gây hoạ dắt theo một nạn nhân."* **Canon đó không
> còn tồn tại** — mạch Morvahn / Năm Trụ Khoá / "trút tận thế lên nhà người khác" đã bỏ hẳn
> (chủ dự án chốt 2026-09-11, xem `docs/LORE_RUNE.md` và mục Cốt truyện trong `CLAUDE.md`).
> Giữ lại đoạn cảnh báo này thay vì xoá trắng, vì một lý lẽ đã chết mà còn nằm trong tài liệu
> thiết kế thì lần sau có người dựa vào nó mà quyết.

Canon **hiện hành** cho một lý lẽ mạnh hơn hẳn, và nó không cần thêm một chữ lore nào:

Lunacia khắc một Rune lên trời (**Nhát Gọi**) để xin một người thợ biết khắc Rune bền hơn đá.
Nhát cắt đó chở được **vật** — nguyên khu phố Ardhaven, đá lát và cái lò — nhưng **nghề thì không
có hình**, nên năm cái nghề của Vaeldra đi qua mà không có thân nào để ở. Bảy con Axie được khắc
để chứa chúng.

⇒ **Ngươi là một con Axie mang một nét khắc không thuộc về mình.**

Và đó chính là cơ chế ở §2b, phát biểu bằng lời kể:

| Cơ chế (§2b) | Cùng một câu, kể bằng truyện |
|---|---|
| Axie là thân nhìn thấy, 0 chỉ số | cái thân là của Lunacia |
| Chỉ số/kỹ năng ở 5 lớp Vaeldra | cái nghề là của Vaeldra |
| Lúc đánh, lớp nhân vật **vật chất hoá rồi tan** | **nét khắc trồi lên qua một cái thân không phải của nó** |
| Mất ký ức, võ nghệ về theo cấp | nghề khắc sâu hơn ký ức, nên nghề quay lại |

Hai đợt việc này được thiết kế **độc lập với nhau** và rơi đúng vào cùng một chỗ — nên không bên
nào phải uốn theo bên nào. Cái mà đặc tả này còn thiếu là *vì sao* lớp nhân vật nháy ra rồi tan;
canon trả lời đúng câu đó.

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

### Hai kiểu hiện — **"hiện khi đánh" ĐÃ CHỐT và đã thi công**

⚠ Mục này trước ghi "chưa chốt cái nào", trong khi `CLAUDE.md` đã ghi kiểu **hiện khi đánh** là
chốt rồi và đã cắm vào `drawPlayer()`. Hai tài liệu nói khác nhau về cùng một quyết định — nay
thống nhất theo `CLAUDE.md`. Kiểu "thường trực" còn trong proto **để so**, không phải để chọn.

⚠ Và nếu sau này có ai muốn quay lại kiểu "thường trực", nhớ hai cái giá: nó dựng lại đúng nỗi
lo AUTO ở §10 (một đơn vị luôn có mặt là một đơn vị máy điều khiển hộ), và ở zoom `xa` (1,0×) thì
hai cái thân đứng cạnh nhau suốt trận là hai bóng dáng tranh chỗ đọc.

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

### ⚠ HAI cái thân, không phải ba — pivot §2b nay làm cho xong

Bản trước của bảng này để lại **ba** cái thân cùng lúc, và đó là một cái thân thừa:

| | |
|---|---|
| Axie | avatar |
| lớp nhân vật | vật chất hoá khi đánh (§2b) |
| Cổ Vật | một thứ ĐI THEO riêng, *"✓ toàn bộ sát thương"* |

Ba thứ đó không cùng đứng được: §2b đã chốt sát thương tới từ **lớp nhân vật vật chất hoá**, nên
không còn chỗ cho một cái xác thứ ba cũng gây toàn bộ sát thương. Bảng cũ có ghi *"⚠ đã sửa theo
§2b"* nhưng thực tế chỉ sửa nửa: nó lấy sát thương khỏi Axie mà chưa gộp cái xác vào lớp nhân vật.

**Chủ dự án chốt thêm (2026-09-11):** *"Bỏ luôn phần Ragoon. Nếu gacha là sẽ gacha nhân vật."*
Câu đó gộp nốt hai cái còn lại:

> ### **"Cổ Vật" và "lớp nhân vật vật chất hoá" là CÙNG MỘT vật thể.**
>
> Thứ banner quay ra là một **nhân vật** — có tên, có burst, mặc bộ giáp người chơi cày được, và
> là thứ hiện ra khi đánh. 15 mục trong `docs/CO_VAT_15.md` là **15 nhân vật**, không phải 15 con
> thú đi theo.

⇒ **Hệ Ragoon (bạn đồng hành khác loài) BỎ.** Với hai cái thân thì không còn chỗ cho một con thú
thứ ba, và luật `CHI_THAN = 0,45` (*"Chimera đi theo không bao giờ được lấn át nhân vật"*) mất
luôn lý do tồn tại — cùng với câu hỏi "hai con Axie trên màn hình, con nào là ngươi".

### Bảng chia việc

| | **Axie** — thân nhìn thấy | **Nhân vật** — lớp vật chất hoá |
|---|---|---|
| Di chuyển | ✓ click-to-move | không có mặt |
| Thanh máu | ✓ **duy nhất** | — |
| 4 nút chiêu | người chơi bấm | ✓ **thi triển** |
| Đòn đánh thường | ✗ không gây sát thương | ✓ **toàn bộ sát thương** |
| **Burst** | — | ✓ nút riêng, người chơi bấm |
| Trang bị (chỉ số) | ✗ | ✓ **`player.equip` — bảng chỉ số duy nhất** |
| Mặc giáp (hình) | ✗ **skin thuần** — để dành NFT | ✓ `heroSet(sectKey, t)` |
| Hệ khắc chế | ✓ quyết định (thứ duy nhất Axie nắm ngoài ngoại hình) | — |
| Lên cấp | — | cấp nhân vật |

### ⚠ MỘT câu còn treo, và nó là câu đắt nhất của cả tài liệu

Nếu thứ gacha quay ra **là** thứ gây sát thương, thì **trần 16% ở §5 không sống được** — một thứ
gây *toàn bộ* sát thương không thể chỉ đóng góp 16% lực chiến. Hai đường, chọn một:

| | Hậu quả |
|---|---|
| **(a)** giữ trần 16% ⇒ nhân vật gacha chỉ mang **burst + cơ chế**, còn chỉ số vẫn ở lớp đã khoá lúc tạo nhân vật | giữ được hợp đồng §5: *"3★ + đồ cày kỹ luôn thắng 5★ + đồ rác"* |
| **(b)** bỏ trần ⇒ gacha thành nguồn sức mạnh chính | chính §5 cảnh báo đích danh đây là đường trượt thành P2W trong ba đợt cân bằng |

**CHƯA CHỐT.** Đây là quyết định kinh doanh, không phải cân bằng — đừng tự chọn giúp. Mọi con số
ở §5 và `CO_VAT_15.md` đang viết theo **(a)**.

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

Dự án đã tự chẩn: *"AUTO nuốt trọn được game"*.

> ⚠ Mục này đã sửa theo §3. Bản đầu lo *"một cái xác đi theo tự đánh là thêm một đơn vị cho máy
> chơi hộ"* — nhưng với **hai** cái thân thì không có đơn vị nào đi theo cả: cái xác chỉ có mặt
> đúng lúc tung chiêu. Nỗi lo cũ hết, còn nỗi lo thật thì vẫn nguyên và nằm ở chỗ khác: bốn nút
> chiêu thì AUTO bấm được hết. Nên thứ phải giữ cho người chơi là **burst và đổi xác**, đúng như
> bảng dưới — chỉ là lý do đã đổi.

| Máy làm được | Người chơi phải BẤM |
|---|---|
| 4 nút chiêu (AUTO đã bấm được từ trước) | **burst** — để lại cửa sổ 5-6s (vỡ giáp / đóng băng / đánh dấu) |
| bị động luôn chạy | **đổi xác** — cooldown ~8s |

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
| xác **hiện ra rồi tan** lúc tung chiêu | `player.castAct` + `atkAnim` (⚠ ĐẾM NGƯỢC — xem ba cái bẫy trong `CLAUDE.md`) | đã thi công đợt 1 |
| ~~xác đi theo, tự đánh, taunt~~ | ~~`updateMount()`~~ | **ĐÃ GỠ HẲN** (`5706cb7`) cùng `mountObj` · `drawMount` · `chiCastChieu`. ⚠ Dòng này trước đây viết *"để lại cho Thú Cưỡi"* — **sai**: `updateMount`/`mountObj` CHÍNH LÀ Ragoon đồng hành, còn Thú Cưỡi chạy bằng `updateHorses`. Hai hệ khác nhau, tên gần nhau. |
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
| `chiCoTrongMan()` 0,45 / 0,55 | **GỠ** — luật đó tồn tại để con thú đi theo không lấn át nhân vật, mà nay không có con thú nào đi theo. Đừng "đảo chiều" nó như bản đầu ghi: cái xác chỉ hiện trong ~0,3s lúc tung chiêu nên nó không tranh chỗ với ai. |
| Ngũ Hành (40 nhãn) | tam giác Axie |
| `player.chimera` | đổi nghĩa: từ "con thú quay được" sang **"nhân vật quay được"** — giữ tên trường để save cũ đọc được (cùng tiền lệ `player.silver` → "Lumen") |
| Hệ **Ragoon** (con thú đi theo) | **ĐÃ GỠ** (`5706cb7`). Đường cắt hoá ra **ba tầng, không phải một** — xem §11b. ⚠ **ĐỪNG gỡ luôn Cốt**: Cốt là thứ duy nhất cho người chơi lý do **chọn vùng để cày** (11 Dòng, mỗi map một Dòng) và lý do **đi bộ tới một toạ độ** (Vỉa Cốt). Đã trỏ nó sang nhân vật, không xoá. |

---

## 11b. Đường cắt Ragoon — BA tầng, không phải một (đã thi công `5706cb7`)

Con số tôi báo lúc đầu (*"~100 chỗ"*) **sai**: kiểm kê đầy đủ ra **435 lần nhắc trên ~60 ký
hiệu** (`mountObj` 79 · `CHI_MAP` 37 · `CHI_ANH` 25 · `chiState` 22 · `CHIMERA` 19 ·
`player.chimera` 19 · `chiO` 16 · `chiCotGom` 10…). Và quan trọng hơn con số: **không cắt đôi
được**, vì avatar dùng chung tầng vẽ với Ragoon.

| Tầng | Gì | Quyết định |
|---|---|---|
| **① Tầng vẽ** | `CHIMERA` · `CHI_ANH` · `CHI_MAP` · `_chiVe` · `chiVeNho` · `chiChayImg` · `chiSan` · `CHI_THO_FPS` | **GIỮ NGUYÊN.** Avatar đọc đúng bộ này. Gỡ là gỡ luôn avatar. |
| **② Máy gacha** | `chiState` · `chiNhan` · `gachaMotLuot` · `gachaQuay` · pity · banner · `player.chimera.co` | **GIỮ, đổi thứ nó TRAO.** Chủ dự án nói *"nếu gacha là sẽ gacha nhân vật"* — 16 con đã có sẵn 16 bảng khung avatar, nên gacha nay trao **thân Axie**. Gỡ nó rồi dựng một bộ chọn avatar mới là nhân bản đúng cái máy vừa xoá. |
| **③ Con thú + hai vòng nuôi nó** | `mountObj` · `ensureMount` · `mountDmg` · `updateMount` · `drawMount` · `chiCastChieu` · `chiBatTam` · `player.chiTam` · `chiCon`/`chiThuMul`/`chiCdMul`/`chiDmgMul` · `chiCoTrongMan`/`CHI_THAN`/`CHI_TRAN` · `CHI_LV_MAX`/`CHI_HOA`/`chiXpCan`/`chiTranCap`/`chiLvNen`/`chiLvHeSo`/`chiHoaGia`/`chiAnDat`/`chiHoa`/`datHon` · `CHI_KY`/`CHI_KY_MOC`/`chiKyCua`/`chiKyMo` | **GỠ HẾT.** Cả hai vòng nuôi tồn tại để làm **một con thú** mạnh lên; không còn con thú thì cấp 80, sáu lần Hoá và bốn kỹ năng đồng hành đều không có đích. |

### Cốt: một sổ, không hai

`chiCotGom(id)` trả **hai** sổ — `c` (năm chỉ số riêng của Ragoon: `cAtk` `cCrit` `cCritDmg`
`cSkill` `cCd`) và `p` (dòng đẩy sang sổ P của người chơi). Sổ `c` mất đích cùng con thú, nên
`cotGom()` nay chỉ còn **một** sổ, và năm khoá đổi sang khoá thật:

`cAtk → atkPct` · `cCrit → crit` · `cCritDmg → critDmg` · `cSkill → skillPct` · `cCd → cdCut`

⚠ **Dải lấy theo dải NGƯỜI CHƠI, thấp hơn dải Ragoon cũ** (`cAtk` 2,4-5,2 → `atkPct` 1,6-3,4).
Cốt nay cộng thẳng vào đòn của chính mình, không đi qua một con thú có sát thương riêng.

⚠ **`cAtk → atkPct` trùng dòng `atkPct` đã có trong `COT_PHU`.** `cotThemPhu()` lọc trùng theo
khoá, nên giữ cả hai là bể chỉ còn **bảy** khoá khác nhau trong khi trần là bốn dòng phụ — không
lỗi, không báo gì, chỉ là bể hẹp đi. Dòng dôi ra đổi sang `pierce`.

⚠ **`skillPct` và `cdCut` KHÔNG có ngăn trong sổ P.** Chúng đi đường riêng (`player.skillDmgPct`
và `player.vhCdMult`), đúng đường Đại Thành đã dùng. Quên là hai trong tám dòng phụ thành mã chết.

### Mười một hiệu ứng "đủ 4 mảnh" phải DỜI, không được bỏ

Cả 11 hiệu ứng bộ nằm **hết** trong `chiCastChieu()` — tức trong chiêu của con thú. Gỡ con thú mà
không dời chúng thì bốn ô Cốt chỉ còn là bốn dòng chỉ số, mất đúng cái làm Cốt khác trang bị:
Cốt **đổi cách chiêu chạy**, không cộng thêm một con số nữa.

Nay chúng chạy trên chiêu của **người chơi**: `cotBoCast(id)` (gọi MỘT LẦN ở cuối `castSkill`,
không rắc vào từng nhánh — có hơn mười nhánh và vài nhánh thoát bằng `return`), `cotBoTick(dt)`
(vũng gai · khiên đứng yên · hết giờ buff tốc đánh), `cotDmgMul()` (Mảnh Nứt), `cotCdMul()`
(Băng Vụn). Tro Tàn trong `killMob`, Mầm Cội trong `hurtMob`.

**Tám trong mười một dời sang gần như nguyên văn** — chúng vốn nhắm vào người chơi hoặc vào mục
tiêu. Đó là bằng chứng hướng đi đúng.

### Hai lỗi CÓ SẴN, lộ ra lúc dời

1. **Băng Vụn đủ 4 mảnh ghi `m.freezeT`, mà không một chỗ nào trong game đọc `freezeT`.** Cơ chế
   đứng hình thật là `m.stunT` (`if (m.stunT > 0) continue` trong vòng quái). Bảng Cốt hứa
   *"đóng băng 1,2 giây"* và chưa con quái nào từng đứng lại. Bản mới dùng `stunT`.
2. **Gacha trùng con chỉ trả Nguyệt Trần SAU khi đủ C6.** Sáu lần trùng đầu tiên vốn dùng để nâng
   Huyết Thống (C1 −10% hồi chiêu, C3 +25% ST…). Ba hệ số đó gỡ rồi, nên sáu lần trùng đầu thành
   **trắng tay** — không lỗi nào báo, chỉ là người chơi thấy vô lý. Nay trùng có thưởng ngay từ
   lần đầu, `con` chỉ còn là con số sưu tầm in trên thẻ.

### Di trú save: TRẢ MẢNH VỀ KHO, đừng xoá

Save cũ có **một bộ bốn ô cho TỪNG con** (`chimera.co[<id>].cot`) và một kho dùng chung. Người
chơi có thể đang đeo bốn mảnh trên con A và bốn mảnh nữa trên con B — nay chỉ còn một bộ. Nên
`cotDiTru()` giữ bộ của con **đang cắm** (`eq`) và **trả mọi mảnh của các con khác về kho**. Bỏ
bước đó là người chơi mất trắng. Nó cũng dọn `lv`/`xp`/`hoa`/`datHon` khỏi save.

⚠ **Và nó KHÔNG tự cắm con từng xuất trận làm `player.avatar`.** Bản đầu tôi viết thế (cùng với
`/max` và `chiNhan` tự bật avatar) và nó vi phạm đúng cái luật ghi ở đầu mục này: *`player.avatar`
rỗng ⇒ hành vi cũ y nguyên; avatar là thứ **bật lên**, không phải thứ thay thế.* Hệ quả đo được:
`/max` âm thầm đổi cái thân nhìn thấy, nên mọi bài kiểm đọc `window.__veThan` thấy `'avatar'`
thay vì `'sprite'` — `test_khoihinh` bắt được. Cửa đổi thân là nút "Đổi thân" ở bảng Khế Ước,
lệnh `/avatar`, và nhiệm vụ `c1q3` (loại `moc`, cửa Khế Ước) là chỗ nói cho người chơi biết.

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
| **1** | Axie thành avatar (5 class, ánh xạ 1-1, **zero chỉ số**) · lớp nhân vật **hiện ra lúc đánh** mặc đồ đang cày · **1 burst** | **Nhìn có đẹp không.** Phải chụp ảnh ra xem, không đọc code mà biết được. |
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
