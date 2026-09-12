# Làm map SỐNG — khảo sát, và thứ tự việc

> Chủ dự án: *"map hiện tại đã khá ổn so với ban đầu rồi. hãy nghiên cứu và thêm thắt các hình
> ảnh / tính năng để map sinh động hơn. Bắt đầu với Beast Herd Camp. Trong MU có 1 khái niệm gọi
> là bãi farm — hãy nghiên cứu và add vào. Ngoài ra xem github axie xem có sử dụng được gì không."*
>
> Tầng địa hình đã xong (12/12 map lát viên, xem `DUNG_LAI_BON_MAP.md`). Việc còn lại không phải
> địa hình nữa — là thứ ĐỨNG TRÊN địa hình.

## 1. Đo trước: map thiếu gì

Đếm trên `ngoai` (Beast Herd Camp) trước đợt này:

| Thứ trong map | Số lượng | Hành vi |
|---|---|---|
| Quái (16 trại, 6 miền) | 109 | tấn công người chơi |
| Trùm vùng + Tướng Quân | 4 | tấn công người chơi |
| Trại canh Rương | 16 | tấn công người chơi |
| Cây / đá / bụi | ~380 | **đứng im tuyệt đối** |
| NPC | 1 | đứng im, bấm ra bảng |
| **Thứ cựa quậy mà KHÔNG đánh nhau** | **0** | — |

Đó là con số nói lên vấn đề. Một vùng hoang trong game này đọc ra là *một cái sân có mấy bầy
địch*, không đọc ra là **một nơi chốn**. Thêm cây thứ 381 không đổi được điều đó.

Và một con số thứ hai, về sự đều đều: **43 miền dân số trên 11 map, không miền nào khác miền nào
về LÝ DO ĐỨNG.** Cụm cách nhau đều 300px, thưởng y hệt. Người chơi chọn bãi bằng cách chọn bãi
gần nhất — tức là không chọn gì cả.

## 2. Các game khác chữa hai chỗ đó bằng gì

Khảo sát theo đúng họ hàng của game này (ARPG nhìn xuống, click-to-move):

| | Cách làm | Đổi được gì |
|---|---|---|
| **MU Online** | *spot* — mấy chỗ ai cũng biết tên (Land of Trials, tầng 7 Lost Tower), quái dày, rơi đậm, tranh nhau | biến "một map" thành "mấy địa danh" |
| **Ragnarok** | quái nền vô hại (Poring, Savage Babe), NPC lang thang, quái có hoạt ảnh nhàn rỗi | thế giới có sống trước khi mình tới |
| **Diablo II** | *super-unique* + bãi có tên (Pit, Chaos Sanctuary), mật độ khác hẳn phần còn lại | người chơi có ĐÍCH để đi tới |
| **Path of Exile** | strongbox / shrine / essence — vật thể thế giới có người canh, mở ra là một trận | dọc đường có thứ đáng dừng |
| **Genshin / BOTW** | sinh vật nền bỏ chạy, vật phẩm hái được, nhóm địch có sinh hoạt riêng | phần lớn thời gian KHÔNG đánh nhau vẫn thú |
| **RDR2** | thú hoang có nhịp ngày/đêm và phản ứng lây trong đàn | đàn đọc ra là ĐÀN, không phải mấy con rải gần nhau |

Rút ra hai việc, và đúng hai việc đó làm trong đợt này.

## 3. Đã làm

### ◈ Bãi Farm (khái niệm *spot* của MU) — `bandit_vet` / *Trại Cựu Binh Gloam*

Bốn tính chất bắt buộc, thiếu một là nó tụt về một bãi thường mang tên đẹp: **dày · đáng · có
tên · tới được**. Chi tiết và hai bẫy đo nằm ở `CLAUDE.md` mục *BÃI FARM*.

Chỗ đáng ghi lại nhất: **hạ sàn giãn cách không tạo ra được cụm.** Hạ `VUNG_CUM_CACH` 300 → 190
cho miền farm rồi tưởng xong — đo ra ba trại cách nhau 266 · 826 · 638 (TB **577**) trong khi
miền thường cùng map ra 426 và 623. Bãi farm còn **thưa hơn** bãi thường. Phải thêm **trần**
(`VUNG_FARM_BAN`): mọi trại nằm trong 460px quanh trại đầu. Sau: 266 · 343 · 268, TB **292**,
bán kính trại 118 ⇒ ba trại chạm nhau.

### 🐑 Đàn Thú Hoang — sinh vật nền không tham chiến

14 con, ba loài, gặm cỏ ở một bãi cố định của `ngoai`. Không máu, không bị nhắm, không rơi gì.
Cả đàn **bỏ chạy lây nhau thành sóng**. Chi tiết ở `CLAUDE.md` mục *ĐÀN THÚ HOANG*.

Vì sao chọn đúng map này: tên map là *Beast Herd Camp* và `desc` của nó đã hứa *"đàn thú của
người bản địa vẫn gặm cỏ ở đây"* từ lâu — mà trong map không có một con thú nào.

## 4. Kho art Axie — đã đối chiếu lại, và bảng cũ SAI một dòng

`github.com/axieinfinity/axie-origins-asset-kit` **không bị chặn**. Sandbox đọc được bằng
`add_repo` + `git clone` (2,2 GB). Bảng dưới là kiểm lại tận nơi, không phải nhớ lại.

| Trong kit | Số | Tình trạng |
|---|---|---|
| `PvE/Starters` — rig Spine Axie | 38 | **16 đã dùng** (Chimera) · **3 dùng đợt này** (đàn thú) · 19 còn trống |
| `Audio` + `PvE/Music` | 167 | **đã nhập rồi** — 102 tệp trong `assets/music` chính là bộ này |
| `PvE/Chimeras` — rig Spine quái | 22 | **chưa dùng** — xem cảnh báo dưới |
| `Textures/Vfx` | 90 | chưa dùng |
| `Textures/StatusIcons` | 131 | chưa dùng |
| `PvE/Backgrounds/story` | 7 cảnh, 150 lớp | **không dùng được** — tranh NHÌN NGANG, game nhìn xuống |

**⚠ 22 rig `PvE/Chimeras` KHÔNG dùng chung bộ xương với `PvE/Starters`.** Đường ống hiện tại
(`nuong_chi.py`) chạy được vì *mọi rig Starter dùng chung 14 khe và cùng tên xương*, nên bảng
hoạt cảnh của một rig `.json` chạy đúng trên bộ xương của rig `.skel`. Với `PvE/Chimeras` thì
**không**: mượn hoạt cảnh của `shilin` rồi dựng cả 22 con thì **9 con văng thành mảnh rời**
(aqua-alpha-wolf 0,11 · aqua-wolf 0,15 · aqua-slime-sup 0,22 · mommy-bear 0,29 · dryad-mage 0,25
· dryad-ranger 0,30 · dryad-fighter 0,34 · aqua-slime-atk 0,35 · werewolf 0,45 — độ đặc). Muốn
dùng đủ 22 con thì phải **viết bộ giải mã hoạt cảnh cho `.skel`** (`skelbin.py` hiện đọc tới khối
skin rồi dừng). Đó là việc rõ ràng và bọc kín được, nhưng **không phải việc nhỏ** — đừng ước
lượng nó như "thêm một bảng khai".

**⚠ 4/38 rig Starter cũng hỏng cùng kiểu** — `14 · 14-1 · 20 · 20-1`. Quét bằng
`python3 tools/spine/nuong_thu.py --quet`.

## 5. Còn nợ — xếp theo (giá trị ÷ công), cao xuống thấp

1. **Đàn thú cho sáu map còn lại.** Một dòng `thu:` mỗi map + nướng thêm loài hợp biome. Máy đã
   xong; đây thuần là dữ liệu và art.
2. **Bãi Farm thứ hai trở đi** — một chỗ mỗi map từ cấp 24 trở lên. `test_baifarm` đã chặn sẵn
   chuyện hai chỗ trên cùng một map.
3. **Cho Bãi Farm một bộ mặt.** Nó có tên trên bảng Bản Đồ nhưng trong map trông y hệt ba trại
   thường. Cần vật thể đặt tại chỗ (đống lửa, lều, cọc) sinh theo toạ độ trại — không phải
   `vatDat` vì toạ độ trại tính lúc chạy.
4. **Quái có sinh hoạt khi chưa thấy người chơi** — ngồi quanh lửa, tuần tra theo tuyến, ngủ.
   Đây là thứ Ragnarok/Genshin dùng nhiều nhất, và nó dùng lại đúng máy trạng thái của đàn thú.
5. **22 rig `PvE/Chimeras`** — sau khi có bộ giải mã hoạt cảnh `.skel`. Hiện 24 tệp quái là ảnh
   phẳng; đây là đường để chúng có hoạt ảnh thật.
6. **131 icon trạng thái + 90 texture VFX** — rẻ, nhưng đổi cảm giác ở panel chứ không ở map.
