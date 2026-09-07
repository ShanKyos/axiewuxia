# Thiết kế hệ nhiệm vụ — Axie Rift

> **Tài liệu thiết kế.** Chưa có dòng mã nào trong đây được cài đặt.
> Chốt của chủ dự án: **trục cơ chế = Chimera đi theo**, **trục truyện = Đường Khâu / nguồn gốc
> vùng đất**; hướng dẫn tính năng **chia đôi** — thứ bắt buộc phải biết nằm trong chính tuyến,
> thứ nâng cao nằm ở phụ tuyến.
>
> Nền lore lấy từ `docs/LORE_AXIE_VA_NHIEM_VU.md` (phương án **Đất Chồng Lớp**). Tài liệu này
> **không lặp lại** phần lore; nó chỉ dùng kết luận của phần đó rồi biến thành chuỗi nhiệm vụ.

---

## 1. Điểm khoá: vì sao hai trục này là MỘT

Nếu Chimera và Đường Khâu là hai thứ rời nhau thì ta có một game có pet, cộng một game có cốt
truyện. Chúng dính vào nhau ở đúng một câu, và cả thiết kế treo lên câu đó:

> **Cốt là vật chất không thuộc về thế giới nào, đông lại ở mép khâu. Chimera là con vật bị kẹt
> giữa hai lớp mà chưa bị xé. Cho Chimera ăn Cốt tức là lấy chính vật chất của vết khâu để giữ
> nó nguyên hình.**

Từ một câu đó, mọi thứ đang chạy sẵn trong game bỗng có nghĩa:

| Thứ đang chạy | Trước đây là gì | Sau khi neo vào câu trên |
|---|---|---|
| 7 Dòng Cốt, mỗi vùng một Dòng độc quyền | một bảng tiền tệ | **bảy loại vật chất mép khâu** — nền Lunacia mỗi vùng một khác nên Cốt đông lại khác nhau |
| 4 ô Cốt của Chimera (`sung·vuốt·vảy·đuôi`) | bốn ô gắn chỉ số | **bốn cái ghim** giữ con vật khỏi trượt khỏi lớp |
| Chimera càng ăn càng mạnh | đường cong sức mạnh | càng ghim chặt thì càng **thuộc về thế giới này** |
| Gỡ Trụ Khoá → quái đông thêm 8%/trụ | một hằng số cân bằng | **hậu quả**: rút đinh thì hai lớp trượt thêm, thứ chui qua đông thêm |
| Vỉa Cốt đổi chỗ mỗi ngày | một điểm thu hoạch | mép khâu **vẫn đang trượt mỗi đêm** |
| Rương Canh đứng yên vĩnh viễn | một cái hòm | **đồ Vaeldra rơi qua cùng khu phố Ardhaven** — vật thật, rơi một lần |

**Cú vặn của cả chuỗi** (đặt ở Chương VII, xem §5): người chơi nuôi Chimera suốt 100 cấp bằng
Cốt. Đến Ashen Steppe mới biết Cốt đông lại được là **vì các Trụ đang bị gỡ**. Tức là chính
mình vừa làm vết nứt rộng thêm để nuôi con vật đi cạnh mình. Không có nút hoàn tác.

---

## 2. "Nhiệm vụ có nghĩa" — định nghĩa kiểm chứng được

Chủ dự án nói nhiệm vụ *"phải ý nghĩa với người chơi"*. Câu đó dễ gật mà khó kiểm, nên đây là
định nghĩa dùng để **bác bỏ** một nhiệm vụ:

> Một nhiệm vụ có nghĩa khi hoàn thành nó **đổi ít nhất một trong ba thứ**, và nhiệm vụ nói rõ
> nó đổi cái nào:
> - **H — Hiểu biết:** người chơi biết thêm một sự thật về thế giới mà trước đó không biết.
> - **C — Cách chơi:** mở một cơ chế, hoặc buộc dùng một cơ chế theo cách mới.
> - **N — Nơi chốn:** mở một chỗ, hoặc cho lý do quay lại một chỗ cũ với mắt khác.

**"Diệt 10 con X" không tự nó có nghĩa.** Nó chỉ là *cách đo*. Mọi mục trong hai chuỗi dưới đây
đều mang mã **H / C / N**; mục nào không gắn được mã nào thì cắt, đừng viết thêm lời thoại cho nó.

⚠ Ba mã này nên thành **cột trong dữ liệu** (`ma:'HC'`), không phải chỉ nằm trong tài liệu — để
sau này viết một bài kiểm đếm được "bao nhiêu % nhiệm vụ chỉ có mã đo mà không có H/C/N".

---

## 3. Bản đồ hướng dẫn — tính năng nào dạy ở đâu

Hiện `TUT_STEPS` chỉ có **6 bước** và dừng ở cấp ~3 (di chuyển · nói chuyện · dịch chuyển · đánh
· nhặt · bảng phím). Toàn bộ phần còn lại của game **không được dạy ở đâu cả**.

Cột "Ai dạy" là chốt của chủ dự án: **cơ bản → chính tuyến, nâng cao → phụ tuyến.**

| Tính năng | Mở ở | Ai dạy | Móc kỹ thuật |
|---|---|---|---|
| Di chuyển · đánh · nhặt · nói chuyện | cấp 1 | `TUT_STEPS` (giữ nguyên) | có sẵn |
| Mặc đồ · so sánh đồ · túi lưới | cấp 1-3 | **Chính I** | cần `type:'equip'` |
| Bình thuốc (R) | cấp 3 | **Chính I** | cần `type:'potion'` |
| Cửa hàng · bán đồ | cấp 5 | **Chính II** | cần `type:'shop'` |
| **Lò Rèn — nâng cấp đồ** | cấp 5 | **Chính II** | `type:'enhance'` ✔ có sẵn |
| Bảng Bản Đồ · điểm dịch chuyển | cấp 10 | **Chính II** | `wpUnlocked` ✔ (B2) |
| Thảo dược | cấp 12 | **Chính III** | `type:'collect'` ✔ có sẵn |
| **Khế Ước Chimera** | cấp 15 | **Chính III** | cần `type:'chimera'` |
| **Cho Chimera ăn Cốt** | cấp 18 | **Chính III** | cần `sideOnEvent('cotFeed')` |
| Khảm ngọc (4 loại Châu) | cấp 20 | **Chính IV** | cần `sideOnEvent('jewel')` |
| Trùm Vùng · Vệ Binh Trụ · Cổng Vực | cấp 24 | **Chính IV** | `type:'boss'` ✔ có sẵn |
| Vùng PK · Ma Đạo | cấp 24 | **Chính IV** | cần `type:'pkzone'` |
| **Rương Canh** | cấp 42 | **Chính V** | cần `sideOnEvent('ruong')` |
| **Vỉa Cốt** | cấp 45 | **Chính V** | cần `sideOnEvent('via')` |
| Vai trò quái (6 vai) | cấp 45 | **Chính V** | dạy bằng lời, không cần móc |
| Khắc hệ (Kim·Mộc·Thổ·Thủy·Hỏa) | cấp 62 | **Chính VI** | cần `type:'elem'` |
| Lò Hỗn Loạn | cấp 62 | **Phụ C** | `sideOnEvent('chaos')` ✔ có sẵn |
| Quầy Shard | cấp 30 | **Phụ C** | `sideOnEvent('shard')` ✔ có sẵn |
| Tuấn Mã Hoang | cấp 20 | **Phụ C** | `sideOnEvent('catch')` ✔ có sẵn |
| Cánh | cấp 84 | **Chính VII** | cần `sideOnEvent('canh')` |
| Sự kiện thế giới (Hung Thần · Xâm Lăng Vàng · Vực Nứt) | cấp 15 | **Phụ C** | cần `sideOnEvent('sukien')` |
| Truy Nã Lệnh | cấp 20 | **Phụ C** | cần `sideOnEvent('truyna')` |
| Tầng Sâu | cấp 20 | **Phụ C** | cần `sideOnEvent('deep')` |
| Ngân Hàng Ngọc | cấp 30 | **Phụ C** | dạy bằng lời |
| Đại Thành (Mastery) | cấp 120 | **Chính VIII** | dạy bằng lời |
| Tái Sinh | sau 120 | **Chính VIII** | dạy bằng lời |

**Đếm việc code phát sinh:** 5 `type` mới cho chính tuyến (`equip · potion · shop · pkzone ·
elem · chimera`), 7 móc `sideOnEvent` mới. Mỗi móc là **một dòng** đặt trong đúng hàm của hệ đó —
đây là lý do bảng trên ghi cột "móc kỹ thuật": để lúc cài không phải đi dò lại.

---

## 4. Khung cấp — chuỗi phải phủ kín 1→120

Dải cấp thật của bảy vùng (đọc từ `MAPS`): `daohoa 1-12 · ngoai 14-24 · chungnam 24-38 ·
comoc 42-56 · tuyettinh 62-78 · mongco 84-100 · nhanmon 102-120`.

⚠ **Có ba lỗ thật giữa các vùng: 38→42, 56→62, 78→84.** Chuỗi cũ không lấp, nên tới mấy mốc đó
người chơi hết nhiệm vụ và chỉ còn cày trơ. Ba **Gian Tấu** dưới đây sinh ra để lấp đúng ba lỗ
đó, và mỗi cái đều **bắt quay lại một vùng cũ** — vừa lấp cấp, vừa dùng đúng hệ điểm dịch chuyển
và lối rìa vừa dựng ở B1/B2.

| Chương | Cấp | Vùng | NPC dẫn | Trụ Khoá |
|---|---|---|---|---|
| **I — Kẻ Rơi Xuống** | 1-12 | Petalshade Isle | Trưởng Làng · Dược Sư | — |
| **II — Thành Của Người Khác** | 10-16 | Lunaris City | Trưởng Lão Rell | — |
| **III — Dấu Hiệu Đầu Tiên** | 14-24 | Petalshade Outskirts | Trinh Sát Wren | — |
| **IV — Cái Đinh Thứ Nhất** | 24-38 | Thornwood Reach | Người Gác Rừng Corran | ① Thornwood |
| *Gian Tấu 1* | 38-42 | quay lại Outskirts | Wren | — |
| **V — Tổ Rỗng** | 42-56 | Hollow Roost | Sylas, Người Giữ Tổ | ② Roost |
| *Gian Tấu 2* | 56-62 | quay lại Thornwood | Corran | — |
| **VI — Người Ở Lại** | 62-78 | Frostmire Vale | Liora, Ẩn Sĩ | ③ Frostmire |
| *Gian Tấu 3* | 78-84 | quay lại Hollow Roost | Sylas | — |
| **VII — Giá Của Việc Đi Tiếp** | 84-100 | Ashen Steppe | Dax, Kẻ Do Thám | ④ Ashmark |
| **VIII — Cửa Ải** | 102-120 | Stormgate Pass | Lão Tướng Brann | ⑤ Stormgate |

Chín NPC dẫn chương dùng hết, không ai bị bỏ trống việc — đây chính là điều kiện mà
`test_cottruyen.js §6` đang treo chờ (xem ghi chú "ĐÂY LÀ ĐIỀU KIỆN PHẢI KHÔI PHỤC").

---

## 5. Chính tuyến — 8 chương, 34 nhiệm vụ

Ký hiệu: **H** đổi hiểu biết · **C** đổi cách chơi · **N** đổi nơi chốn.
Cột "Dạy" là phần hướng dẫn được lồng vào — không có bảng hint rời nào cả.

### Chương I — Kẻ Rơi Xuống (cấp 1-12) · Petalshade Isle

Người chơi tỉnh dậy **Unclassed**, mất trí nhớ võ nghệ. Đây là chương duy nhất không nói gì về
Trụ Khoá — cố ý: chưa biết gì thì chưa lo được.

| # | Tên | Giao | Loại | Mã | Dạy |
|---|---|---|---|---|---|
| 1 | Còn Thở Là Còn Đứng Dậy | Trưởng Làng | `talk` | H | — |
| 2 | Cái Gì Cũng Cắn Được | Trưởng Làng | `kill` heo rừng ×6 | C | đánh, SPACE |
| 3 | Nhặt Lấy Mà Mặc | Trưởng Làng | `equip` | C | mặc đồ, so sánh |
| 4 | Vết Thương Không Tự Lành | Dược Sư | `potion` | C | bình thuốc (R) |
| 5 | Đảo Này Không Có Trụ Nào | Dược Sư | `talk` | **H** | — |
| 6 | Tiếng Gọi | — (tự động cấp 10) | `talk` | **HC** | chọn lớp |

**#5 là mục quan trọng nhất chương.** Dược Sư nói: *"Đảo này không có trụ nào. Nên nó cũng không
có gì để giữ. Ngươi thấy yên là vì ở đây chẳng có gì đáng để nứt."* — gieo khái niệm Trụ **trước
khi** người chơi thấy cái đầu tiên, để Chương IV không phải giải thích từ đầu.

### Chương II — Thành Của Người Khác (cấp 10-16) · Lunaris City

| # | Tên | Giao | Loại | Mã | Dạy |
|---|---|---|---|---|---|
| 7 | Khu Phố Bị Kéo Sang | Rell | `talk` | **H** | — |
| 8 | Sắt Vaeldra, Lò Lunacia | Rell | `enhance` +3 | C | **Lò Rèn** |
| 9 | Tiền Của Người Chết | Rell | `shop` | C | cửa hàng, bán đồ |
| 10 | Đường Về Có Tên | Rell | `talk` @Outskirts | **N** | **điểm dịch chuyển** |

**#7 giải thích tường thành phương Tây giữa thế giới Axie** — thứ người chơi đã nhìn thấy suốt
mười cấp mà chưa ai nói vì sao. Đây là mẫu cho cả chuỗi: *nhiệm vụ trả lời câu người chơi đã tự
hỏi rồi*, chứ không giới thiệu thứ họ chưa từng thấy.

### Chương III — Dấu Hiệu Đầu Tiên (cấp 14-24) · Petalshade Outskirts

Chương **Chimera vào cuộc** — trục cơ chế bắt đầu ở đây và không rời nữa.

| # | Tên | Giao | Loại | Mã | Dạy |
|---|---|---|---|---|---|
| 11 | Đất Đang Rung | Wren | `talk` | H | — |
| 12 | Thứ Mọc Ở Chỗ Nứt | Wren | `collect` thảo dược ×5 | C | hái thảo dược |
| 13 | **Con Chưa Bị Xé** | Wren | `chimera` | **HC** | **Khế Ước Chimera** |
| 14 | **Bốn Cái Ghim** | Wren | `cotFeed` ×1 | **HC** | **cho ăn Cốt** |
| 15 | Trại Gloam Chặn Đường | Wren | `kill` gloam ×10 | N | — |

**#13-14 là bản lề của cả game.** Wren nói: *"Nó không phải thú nuôi. Nó là con duy nhất kẹt
giữa hai lớp mà chưa bị xé làm đôi. Cốt ngươi nhặt được — thứ không thuộc về bên nào — là thứ
duy nhất ghim nó lại được. Bốn mảnh. Đừng để tuột."* Sau câu này, mọi mảnh Cốt nhặt trong 100
cấp còn lại đều mang nghĩa, không cần nhắc lại lần nào nữa.

### Chương IV — Cái Đinh Thứ Nhất (cấp 24-38) · Thornwood Reach

| # | Tên | Giao | Loại | Mã | Dạy |
|---|---|---|---|---|---|
| 16 | Rừng Có Chủ | Corran | `talk` | H | — |
| 17 | Máu Đổi Máu | Corran | `pkzone` | **C** | **vùng PK, Ma Đạo** |
| 18 | Đá Cũng Biết Đau | Corran | `jewel` | C | **khảm ngọc** |
| 19 | Ba Kẻ Giữ Đinh | Corran | `boss` Vệ Binh ×3 | C | **Trùm Vùng** |
| 20 | **Rút Đinh Thứ Nhất** | Corran | `boss` Cổng Vực | **HCN** | — |

**#20 là chỗ bi kịch bật ra.** Gỡ trụ xong, vết nứt trên trời rộng thêm một nấc **và mọi bãi
quái đông thêm 8%** — cái đó đã chạy sẵn trong code (`bayCo`). Corran nói thẳng: *"Ngươi vừa mở
đường cho mình. Ngươi cũng vừa mở đường cho nó. Ta không ngăn ngươi — ta chỉ muốn ngươi biết
mình đã trả bằng gì."*

### *Gian Tấu 1* (cấp 38-42) · quay lại Outskirts

| # | Tên | Giao | Loại | Mã | Dạy |
|---|---|---|---|---|---|
| 21 | Chỗ Cũ Đông Hơn | Wren | `kill` @ngoai ×12 | **H** | — |

Bắt quay lại vùng cấp 14 và **tự thấy** nó đông hơn trước. Không có lời thoại nào phải giải
thích — người chơi tự đối chiếu với trí nhớ của chính mình. Đây là cách rẻ nhất và mạnh nhất để
làm cho con số 8% thành một thứ *cảm được*.

### Chương V — Tổ Rỗng (cấp 42-56) · Hollow Roost

| # | Tên | Giao | Loại | Mã | Dạy |
|---|---|---|---|---|---|
| 22 | Tổ Không Còn Trứng | Sylas | `talk` | H | — |
| 23 | **Kho Của Kẻ Đào Ngũ** | Sylas | `ruong` ×1 | **CN** | **Rương Canh** |
| 24 | **Mạch Chảy Mỗi Đêm** | Sylas | `via` ×1 | **CN** | **Vỉa Cốt** |
| 25 | Không Phải Con Nào Cũng Đánh Giống Nhau | Sylas | `kill` ×15 | C | **6 vai trò quái** |
| 26 | Rút Đinh Thứ Hai | Sylas | `boss` Cổng Vực | **HN** | — |

**#23-24 dạy đúng cặp đối lập của thế giới:** Rương Canh **đứng yên vĩnh viễn** (đồ Vaeldra rơi
một lần), Vỉa Cốt **đổi chỗ mỗi ngày** (mép khâu vẫn đang trượt). Dạy hai cái liền nhau để người
chơi đọc ra sự tương phản, chứ không phải học thuộc hai luật rời.

### *Gian Tấu 2* (cấp 56-62) · quay lại Thornwood

| # | Tên | Giao | Loại | Mã | Dạy |
|---|---|---|---|---|---|
| 27 | Cái Đinh Đầu Tiên Giờ Ra Sao | Corran | `talk` | **H** | — |

### Chương VI — Người Ở Lại (cấp 62-78) · Frostmire Vale

| # | Tên | Giao | Loại | Mã | Dạy |
|---|---|---|---|---|---|
| 28 | Người Không Chịu Đi | Liora | `talk` | H | — |
| 29 | **Băng Không Sợ Băng** | Liora | `elem` | **C** | **khắc hệ** |
| 30 | Rút Đinh Thứ Ba | Liora | `boss` Cổng Vực | **HN** | — |

**#29 sửa một lỗi có thật:** hệ khắc `el:` đã chạy trong `hurtMob` (±20% / −12%) từ lâu mà
**người chơi không có cách nào biết**. Nhiệm vụ này ép đánh một bãi bị khắc rồi một bãi khắc lại,
và Liora chỉ ra con số. Đây là ví dụ rõ nhất của "nhiệm vụ dạy tính năng" đúng nghĩa: không thêm
cơ chế nào, chỉ **làm cho cái đang chạy trở nên đọc được**.

### *Gian Tấu 3* (cấp 78-84) · quay lại Hollow Roost

| # | Tên | Giao | Loại | Mã | Dạy |
|---|---|---|---|---|---|
| 31 | Tổ Đã Có Kẻ Ở | Sylas | `kill` @comoc ×15 | **H** | — |

### Chương VII — Giá Của Việc Đi Tiếp (cấp 84-100) · Ashen Steppe

**Chương của cú vặn.** Đây là chỗ hai trục va vào nhau.

| # | Tên | Giao | Loại | Mã | Dạy |
|---|---|---|---|---|---|
| 32 | Tro Không Phải Của Lửa | Dax | `talk` | H | — |
| 33 | **Cốt Đông Được Là Nhờ Ai** | Dax | `talk` | **H** | — |
| 34 | Bay Qua Chỗ Không Đi Được | Dax | `canh` | C | **Cánh** |
| 35 | Rút Đinh Thứ Tư | Dax | `boss` Cổng Vực | **HN** | — |

**#33 không có gì để đánh, và đó là chủ ý.** Dax mở sổ của Đoàn Gloam ra: Cốt bắt đầu đông lại
ở mép khâu **đúng từ ngày cái đinh thứ nhất bị rút**. Con Chimera đi cạnh người chơi suốt 90 cấp
sống được là nhờ chính thứ mà người chơi đã phá ra. Không có lựa chọn nào ở đây, không có nút
hoàn tác — chỉ có một sự thật đến muộn.

### Chương VIII — Cửa Ải (cấp 102-120) · Stormgate Pass

| # | Tên | Giao | Loại | Mã | Dạy |
|---|---|---|---|---|---|
| 36 | Người Giữ Ải Sáu Mươi Năm | Brann | `talk` | **H** | — |
| 37 | Đinh Cuối | Brann | `boss` Cổng Vực | **HCN** | — |
| 38 | Sau Khi Không Còn Đinh Nào | Brann | `talk` | **HC** | **Đại Thành · Tái Sinh** |

**#38 là cửa ra của cả chuỗi, không phải cái kết.** Kết mở đã có sẵn trong game (`ketMo`). Brann
chỉ vào hai thứ còn lại để làm: bảng **Đại Thành** và **Tái Sinh** — và nói rõ Tái Sinh nghĩa là
đi lại con đường này với một thế giới đã rộng cửa hơn.

---

## 6. Phụ tuyến A — «Bốn Cái Ghim» (Chimera)

Chuỗi phụ **bám sát trục cơ chế**, nhận ở Wren, kéo dài suốt game. Không cái nào bắt buộc, nhưng
cái nào cũng đổi cách nuôi Chimera.

| # | Tên | Mở cấp | Loại | Mã | Nội dung |
|---|---|---|---|---|---|
| A1 | Ghim Thứ Nhất | 18 | `cotFeed` ×4 | C | lấp đủ 4 ô Cốt lần đầu |
| A2 | Không Phải Dòng Nào Cũng Hợp | 30 | `cotFeed` cùng Dòng ×2 | **HC** | dạy **bộ 2 mảnh cùng Dòng** |
| A3 | Đủ Bốn Thì Đổi Luật | 55 | `cotFeed` đủ bộ 4 | **HC** | dạy **mảnh đổi luật chiêu** |
| A4 | Cổ Không Mua Được | 70 | `via` ×3 | C | Cốt phẩm **Cổ** chỉ ra nhiều ở Vỉa |
| A5 | Con Thứ Hai | 90 | `chimera` ×2 | C | đổi con xuất trận theo vùng |

**A2 và A3 là chỗ hệ Cốt hiện đang câm.** Bộ 2 mảnh cho chỉ số, bộ 4 mảnh **đổi luật chiêu**
(`bonTxt` trong `COT_DONG`) — thứ đó đã viết xong trong dữ liệu mà chưa có gì trong game nói cho
người chơi biết là nó tồn tại.

---

## 7. Phụ tuyến B — «Đọc Đường Khâu» (giải mã nguồn gốc)

Đây là phần chủ dự án gọi là *"nhiệm vụ phụ giải mã tại sao lại sinh ra vùng đất mới này"*.

**Luật của chuỗi:** mỗi mảnh là **một vật đọc được** nhặt ở một vùng, không phải một trận đánh.
Ghép đủ mới ra câu trả lời. Người chơi **không bị dẫn** — Nhật Ký tự ghép các mảnh đã có, và để
trống chỗ chưa có.

| Mảnh | Vùng | Nhặt ở | Hé lộ |
|---|---|---|---|
| B1 | Petalshade Isle | Rương Canh | sổ tiếp tế Đoàn Gloam — **lính Vaeldra đào ngũ**, không phải quái |
| B2 | Outskirts | thảo dược | cây ở đây **không có trong sách thực vật Lunacia nào** |
| B3 | Thornwood | Rương Canh | bản đồ có **năm điểm đóng đinh**, ghi tay: *"ghim hai tấm, không phải một"* |
| B4 | Hollow Roost | Vỉa Cốt | mẫu Cốt kèm ghi chú: **thành phần không khớp bên nào** |
| B5 | Frostmire | NPC Liora | Liora **nhớ mặt đất trước khi nứt** — nhân chứng sống duy nhất |
| B6 | Frostmire | Rương Canh | thư chưa gửi của một người lính Vaeldra gửi về nhà |
| B7 | Ashen Steppe | Vỉa Cốt | Vỉa mọc **đúng vệt trượt của đêm hôm trước** |
| B8 | Ashen Steppe | Rương Canh | lệnh hành quân **có con dấu 60 năm trước** |
| B9 | Stormgate | NPC Brann | vì sao Brann giữ ải **từ trước khi bầu trời nứt** |
| B10 | Stormgate | Cổng Vực | mảnh cuối — **Thủ Hộ đóng đinh vào một thế giới không phải của mình** |

**Chỗ nối rẻ nhất trong cả tài liệu:** 5/10 mảnh nằm trong **Rương Canh** và **Vỉa Cốt** — hai hệ
vừa dựng xong ở B3.1/B3.3 và hiện **chỉ rơi tiền tệ**. Cắm mảnh chứng cứ vào đó thì hai hệ đó có
thêm một lý do tồn tại mà không phải viết hệ mới nào.

⚠ Rương Canh mở **một lần mỗi nhân vật**, nên mảnh phải rơi ở **cái đầu tiên** mở trong vùng đó —
không thì người chơi vét sạch bốn rương rồi vẫn thiếu mảnh, không có đường lấy lại.

---

## 8. Phụ tuyến C — «Học Việc» (tính năng nâng cao)

Nhận ở NPC trong thành. Mỗi cái dạy đúng **một** hệ, không gộp.

| # | Tên | Mở cấp | Móc | Dạy |
|---|---|---|---|---|
| C1 | Ngựa Không Của Ai | 20 | `catch` ✔ | Tuấn Mã Hoang |
| C2 | Xuống Giếng | 20 | `deep` | Tầng Sâu |
| C3 | Đầu Có Giá | 20 | `truyna` | Truy Nã Lệnh |
| C4 | Đổi Vụn Lấy Việc | 30 | `shard` ✔ | Quầy Shard |
| C5 | Trời Đổi Giờ | 15 | `sukien` | 3 sự kiện thế giới |
| C6 | Ném Vào Lò | 62 | `chaos` ✔ | Lò Hỗn Loạn |

---

## 9. Khớp vào máy chạy — việc code thật sự phát sinh

Máy chạy **giữ nguyên**, chỉ cần nới. Liệt kê để lúc cài không phải dò lại:

**a. `type` mới cho chính tuyến** (mỗi cái một nhánh trong `questTarget` + một chỗ tăng tiến độ):
`equip · potion · shop · pkzone · elem · chimera`

**b. Móc `sideOnEvent` mới** — mỗi cái **một dòng** trong hàm sẵn có của hệ đó:

| Móc | Đặt vào hàm | Ghi chú |
|---|---|---|
| `cotFeed` | `chiAnCot` | trục Chimera treo hết vào móc này |
| `ruong` | `ruongMo()` | đặt **sau** khi ghi `player.ruong[id]` |
| `via` | `viaKhai()` | đặt sau khi ghi `player.via[map]` |
| `jewel` | hàm khảm ngọc | |
| `canh` | hàm trang bị Cánh | |
| `deep` · `truyna` · `sukien` | `deepStart` · `truyNaNhan` · `matonKilled` v.v. | |

**c. Cột `ma:'HCN'` trong dữ liệu** — để bài kiểm đếm được, xem §2.

**d. `reqMain` — ĐỪNG cắm lại.** Nhánh đọc `md.reqMain` trong `mapGate()` vẫn còn nguyên, cắm
một giá trị vào là khoá map sống lại. **Không nên.** Map nay mở bằng **cấp** là đủ, và bài học
vừa rồi rất đắt: khoá map sau một nhiệm vụ nghĩa là nhiệm vụ đó hỏng thì cả map biến mất —
đúng cái đã làm ba vùng cuối thành nội dung chết suốt một thời gian dài.

---

## 10. Việc còn nợ / chỗ chủ dự án phải quyết

1. **Số lượng.** 38 nhiệm vụ chính là con số tôi chọn để phủ 1→120 mà không có đoạn nào trống
   quá 6 cấp. Muốn ngắn hơn thì cắt Gian Tấu (còn 35) — nhưng cắt Gian Tấu 1 là mất chỗ duy
   nhất người chơi **tự cảm** được hậu quả của việc gỡ trụ.
2. **Lời thoại chưa viết.** Tài liệu này có tên + ý cho từng mục; phần thoại đầy đủ (mỗi NPC
   4 trạng thái `idle/offer/active/done`) là một đợt việc riêng, ước chừng bằng đợt này.
3. **Chưa quyết: nhiệm vụ có nên thưởng Cốt không.** Nếu có thì nó cạnh tranh với Vỉa Cốt và
   Trùm Vùng — hai nguồn Cốt đang có. Tôi nghiêng về **không**, trừ 3 mốc rút đinh.
4. **Tôi chưa kiểm** liệu 16 con Chimera có đủ khác nhau để A5 ("đổi con theo vùng") có nghĩa
   hay không. Cần đo trước khi viết A5.
5. §5-§8 là **thiết kế của tôi**, không phải canon. Tên chương, tên nhiệm vụ, lời thoại trích
   trong tài liệu này đều do tôi đặt.
