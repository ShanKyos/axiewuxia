# Lore Axie & thiết kế lại nhiệm vụ — vì sao vùng đất này sinh ra

> **Tài liệu thiết kế. Không có dòng mã nào trong đây được cài đặt.**
> Việc của tài liệu này là trả lời đúng hai câu chủ dự án hỏi:
> *"nhiệm vụ phải ý nghĩa với người chơi"* và *"nhiệm vụ phụ giải mã tại sao lại sinh ra
> vùng đất mới này"*.
>
> **Mốc đọc dữ liệu.** Mọi trích dẫn `file:dòng` bên dưới đọc tại:
> `public/game/game.js` — md5 `78976b2f1179460bd2b71859cd539e5b` (24.209+ dòng)
> `public/game/data/canbang.js` — md5 `2adc6780f0e6a66e56a7d377478fa29e`
> Hai tệp này **đang có sửa đổi chưa commit** (`git status` báo `M`) và **đã dịch dòng ngay giữa
> lúc tôi khảo sát** (một khối ~116 dòng chèn vào `game.js` khoảng dòng 5900–9300, và
> `canbang.js` thêm ~150 dòng ở `MAP_OBSTACLES`). Tức là có người/phiên khác đang sửa song song.
> Nếu số dòng lệch khi bạn đọc lại, **nội dung trích vẫn đúng** — tra bằng tên hằng, đừng tra bằng số dòng.

---

## Mục lục

1. [Kiểm kê lore ĐANG CÓ trong game](#1-kiểm-kê-lore-đang-có-trong-game)
2. [Lore Axie chính thức — có nguồn](#2-lore-axie-chính-thức--có-nguồn)
3. [Cái gì mượn được, cái gì không](#3-cái-gì-mượn-được-cái-gì-không)
4. [Câu trả lời trung tâm: TẠI SAO vùng đất này sinh ra?](#4-câu-trả-lời-trung-tâm-tại-sao-vùng-đất-này-sinh-ra)
5. [Chuỗi nhiệm vụ chính — 8 chương + 3 gian tấu, 52 nhiệm vụ](#5-chuỗi-nhiệm-vụ-chính--8-chương--3-gian-tấu-52-nhiệm-vụ)
6. [Chuỗi nhiệm vụ phụ giải mã nguồn gốc vùng đất](#6-chuỗi-nhiệm-vụ-phụ-giải-mã-nguồn-gốc-vùng-đất)
7. [Chỗ nối vào hệ thống đã có](#7-chỗ-nối-vào-hệ-thống-đã-có)
8. [Việc còn nợ / rủi ro / chỗ chủ dự án phải quyết](#8-việc-còn-nợ--rủi-ro--chỗ-chủ-dự-án-phải-quyết)

---

## 1. Kiểm kê lore ĐANG CÓ trong game

### 1.1 Canon nền — đã chốt, không được mâu thuẫn

Nguồn: `CLAUDE.md` mục **"Cốt truyện (canon)"** (dòng 334–359) và `INTRO_PAGES`
(`data/canbang.js:865`).

| Khẳng định | Ở đâu |
|---|---|
| Hai vũ trụ giao thoa. Phong ấn giam **Morvahn** ở **Vaeldra** vỡ | `CLAUDE.md:336-337` · `canbang.js:865` trang 1 |
| Thủ Hộ Vaeldra không giữ nổi nên **bẻ lệch vết nứt** sang thế giới bên cạnh mà hải đồ ghi là "vô chủ" — hải đồ sai, đó là **Lunacia** | `CLAUDE.md:337-339` · `canbang.js:865` trang 2 |
| "Vaeldra tự cứu mình bằng cách trút tận thế lên nhà người khác" | `CLAUDE.md:339` |
| Nhân vật chính thuộc 1 trong **5 lớp Vaeldra**, trong đội tiên phong vượt vết nứt sang sửa | `CLAUDE.md:341-342` |
| Cú vượt biên **xoá ký ức võ nghệ** → khởi đầu Unclassed, cấp 10 ký ức trở về (**The Calling**) | `CLAUDE.md:342-343` · `game.js:8958` |
| Cú giật ngược kéo cả khu phố **Ardhaven** sang; dân bản địa dựng lại quanh đó thành **Lunaris City** | `CLAUDE.md:343-344` · `canbang.js:503` (`MAPS.tuongduong.desc`) |
| Điều đó *giải thích trong truyện*: tường thành phương Tây giữa thế giới Axie, và NPC hai phong cách (**NPC chức năng = người Ardhaven sống sót** · **NPC cốt truyện = người Lunacia bản địa**) | `CLAUDE.md:346-348` |
| **Khí Morvahn chạm vào sinh vật Lunacia thì bẻ nó thành Chimera** | `CLAUDE.md:350` |
| **Năm Trụ Khoá** do Thủ Hộ Vaeldra đóng xuống để ghim miệng vết nứt. Tướng Quân Morvahn chiếm cả năm | `CLAUDE.md:352-354` |
| **Gỡ trụ thì đi tiếp được, nhưng vết nứt toác thêm** — bi kịch trung tâm, lý do của kết mở | `CLAUDE.md:354-356` |
| Thuật ngữ chốt: Tướng Quân · Vệ Binh Trụ · Trụ Khoá · Cổng Vực · Hung Thần (**không phải** Morvahn) · Đoàn Gloam (lính Vaeldra đào ngũ) | `CLAUDE.md:357-359` |

### 1.2 Bảy vùng đất — tên, dải cấp, loài quái, Dòng Cốt

Đọc từ `data/canbang.js:472` (`window.MAPS`), `game.js:1041` (`MOBS`), `game.js:4317` (`COT_DONG`).

| Khoá | Tên hiện ra | `min` | Dải cấp | Loại | Loài quái trong `packs` | Dòng Cốt độc quyền |
|---|---|---:|---|---|---|---|
| `daohoa` | **Petalshade Isle** | 1 | 1 – 12 | `safe` | Axie Heo Rừng · Axie Bí Ngô · Axie Gai Tím · Tay Sai Gloam · Axie Cỏ Dại · Cướp Đường Gloam · Tượng Đá Canh Cổng | **Cánh Hoa** |
| `tuongduong` | **Lunaris City** | 1 | — | `safe` (thành) | không có `packs` | — |
| `ngoai` | **Petalshade Outskirts** | 10 | 14 – 24 | `safe` | Heo Rừng Nhiễm Khí · Gai Tím Đầu Đàn · Gloam Cựu Binh · Cỏ Dại Bén Lửa · Trinh Sát Gloam (elite) · Tượng Đá Vỡ Lệnh | **Đồng Cỏ** |
| `chungnam` | **Thornwood Reach** | 20 | 24 – 38 | `pk` | Tượng Đá Vỡ Lệnh · Bộ Xương Phản Loạn · Chimera Phun Độc · Axie Sa Ngã | **Rễ Gai** |
| `comoc` | **Hollow Roost** | 40 | 42 – 56 | `pk` | Oan Hồn Ổ Ấp · Axie Golem · Dơi Chimera | **Vỏ Trứng** |
| `tuyettinh` | **Frostmire Vale** | 60 | 62 – 78 | `pk` | Chimera Cầu Gai · Kẻ Cuồng Tín Lạc Lối · Sát Thủ Sương Mù | **Băng Vụn** |
| `mongco` | **Ashen Steppe** | 80 | 84 – 100 | `pk` | Trinh Sát Tro Tàn · Cung Thủ Tro Tàn · Kỵ Sĩ Tro Tàn | **Tro Tàn** |
| `nhanmon` | **Stormgate Pass** | 100 | 102 – 120 | `freepk` | Cuồng Binh Tro Tàn · Chó Ngao Lửa · Axie Cuồng Bão | **Sấm Vụn** |
| `deep` | **Tầng Sâu** | 1 | — | `dungeon` | `packs:[]` — sinh theo tầng | — |

Ba lỗ thủng cấp có thật, đọc thẳng từ bảng trên: **38→42 · 56→62 · 78→84**
(cũng ghi ở `docs/VUNG_ELDERBOUGH.md` §1 và `docs/NHIP_CAP_1_120.md`).

**Bảy Dòng Cốt** (`game.js:4317-4339`) — quan hệ một-đổi-một với bảy vùng, đây là **cơ chế
chọn build**, không phải trang trí (`CLAUDE.md:124-136`):

| Dòng | Vùng | Hiệu ứng 2 mảnh | Hiệu ứng 4 mảnh |
|---|---|---|---|
| **Cánh Hoa** | Petalshade Isle | +8% Sinh Lực tối đa | Chiêu Chimera hồi 8% Sinh Lực |
| **Đồng Cỏ** | Petalshade Outskirts | +6% tốc đánh | 6s sau khi tung chiêu, Chimera đánh nhanh gấp đôi |
| **Rễ Gai** | Thornwood Reach | +8% Công Chimera | Chiêu để lại vũng gai 4s, địch chậm 30% |
| **Vỏ Trứng** | Hollow Roost | +10% sát thương chiêu | Chiêu tung hai lần, lần sau 40% sức |
| **Băng Vụn** | Frostmire Vale | +6% Bạo Kích Chimera | Chiêu đóng băng 1,2s, đổi lại hồi chiêu +2s |
| **Tro Tàn** | Ashen Steppe | +10% Sát Thương Bạo Chimera | Chimera hạ mục tiêu → giảm 1,5s hồi chiêu |
| **Sấm Vụn** | Stormgate Pass | −8% hồi chiêu | Chiêu nổ dây chuyền sang mục tiêu kề trong 200px |

### 1.3 Năm Trụ Khoá và bảy Tướng Quân

`game.js:22042` (`TRU_KHOA`) — **đặt tên theo ĐỊA DANH, không theo ngũ hành**, và chú thích
ngay trên bảng ghi rõ lý do: bộ tên ngũ hành cũ tự đá nhau (Trụ Hỏa xuất hiện ở cả trụ đầu lẫn
trụ cuối, Trụ Mộc hai lần, Trụ Thổ không lần nào).

| # | Trụ | Vùng | Cờ đánh dấu |
|---|---|---|---|
| 1 | **Trụ Thornwood** | Thornwood Reach | `storyFlags.ta_chungnam` |
| 2 | **Trụ Roost** | Hollow Roost | `ta_comoc` |
| 3 | **Trụ Frostmire** | Frostmire Vale | `ta_tuyettinh` |
| 4 | **Trụ Ashmark** | Ashen Steppe | `ta_mongco` |
| 5 | **Trụ Stormgate** | Stormgate Pass | `ta_nhanmon` |

**Bảy vùng nhưng chỉ năm trụ**: Petalshade Isle và Outskirts là đất tập, không có trụ
(`game.js:22039-22040`). Đó là cách duy nhất để "bảy Tướng Quân" và "năm Trụ Khoá" cùng đúng.

Hai bộ đếm **khác nhau** và game in riêng (`game.js:22051` `truDaGo()` · `game.js:22056`
`tuongQuanDaHa()`):
- **Tướng Quân đã hạ** → trời sập tối dần (`game.js` vòng vẽ, trần 0,10).
- **Trụ Khoá đã gỡ** → vết nứt trên trời rộng ra, năm nấc, lớp CSS `#fx-crack`
  (`capNhatVetNut()`).
- Và **mỗi trụ gỡ xuống thì bãi quái đông thêm 8%** — `game.js:1653`:
  `Math.floor(pk.n * (1 + Math.min(5, truDaGo()) * 0.08))`. **Đây là chỗ duy nhất trong game
  mà cốt truyện đổi được số liệu chiến đấu.** Nó đang chạy, và người chơi hầu như không biết.

### 1.4 Bảy Tướng Quân (`tranai`) và ba Vệ Binh Trụ mỗi vùng

`data/canbang.js:137` (`BOSS_DEFS`). Mỗi vùng: 3 **Vệ Binh Trụ** (`thuve`) + 1 **Tướng Quân**
(`tranai`). Hạ đủ 3 Vệ Binh mới mở được vòng phong ấn quanh Tướng Quân
(`tranAiSeal()`, `game.js:2344`, bán kính 342).

| Vùng | Vệ Binh Trụ (cấp) | Tướng Quân (cấp) |
|---|---|---|
| Petalshade Isle | Chúa Heo Rừng 6 · Chúa Bầy Gai Tím 9 · Chấp Sự Gloam 12 | **Thủ Lĩnh Đoàn Gloam** 14 |
| Petalshade Outskirts | Đầu Mục Gloam 13 · Gai Tím Độc Nhãn 16 · Đặc Vụ Gloam 19 | **Ma Sói Sương Trắng** 22 |
| Thornwood Reach | Kẻ Đổi Phe 23 · Golem Gỗ Cổ Đại 26 · Trưởng Lão Tha Hóa 29 | **Tướng Quân Thornwood Reach** 32 |
| Hollow Roost | Chỉ Huy Vong Binh 43 · Kẻ An Táng Bóng Tối 46 · Chúa Tể Bất Tử 49 | **Tướng Quân Hollow Roost** 52 |
| Frostmire Vale | Kẻ Lạc Lối Tuyệt Vọng 63 · Cỏ Dại Băng Giá 66 · Xoáy Sương Nguyền 69 | **Tướng Quân Frostmire Vale** 72 |
| Ashen Steppe | Kỵ Sĩ Trưởng Tro Tàn 83 · Cung Thủ Tinh Nhuệ Tro Tàn 86 · Thống Lĩnh Tro Tàn 89 | **Tướng Quân Ashen Steppe** 92 |
| Stormgate Pass | Tướng Quân Bão Tố 103 · Huyết Sát Bão Tố 106 · Tướng Quân Cửa Ải 109 | **Tướng Quân Stormgate Pass** 112 |

Hạ Tướng Quân `nhanmon` → `storyFlags.ketMo = true` → **Kết Mở** (`showKetMo()`,
`game.js:22114`): *"Trụ Khóa thứ năm đổ xuống… Ngươi vượt vết nứt để sửa lại thứ thế giới mình
đã gây ra. Và để tới được hắn, ngươi vừa tự tay mở toang cánh cửa hắn cần."*

### 1.5 Bảy NPC dẫn chương — họ là ai và họ đang nói gì

`game.js:21072` (`NPCS.push(...)`). Mỗi người có **4 câu `lore`** (idle/offer/active/done),
**3 trang `trang`** cho lần gặp đầu, và **4 câu `barks`** buông khi đi ngang.
Chú thích ở `game.js:21070-21071` ghi rõ chủ ý: *"Bảy người dẫn chương mỗi người gọi tên người
trước, và Brann ở chương cuối gọi tên cả sáu."*

| Khoá | Tên | Vùng | Dòng | Họ là ai · họ đang nói gì (rút gọn, nguyên văn ở tệp) |
|---|---|---|---:|---|
| `quachtinh` | **Trưởng Lão Rell** | Lunaris City | 21082 | Chỉ huy đội tiên phong vượt vết nứt. *"Sáu người theo ta. Ngươi là người duy nhất còn đứng."* · *"chân ta để lại bên kia vết nứt rồi."* · Hỏi thẳng người chơi: *"ngươi sang đây để sửa, hay để sống sót?"* (có `chon` a/b) |
| `monkhach` | **Trinh Sát Wren** | Lunaris City | 21096 | **Người Lunacia bản địa.** *"Ta sinh ra ở đây. Các ngươi thì rơi xuống đây."* · *"trước khi các ngươi tới, rừng ngoài kia không có thứ gì phun độc cả."* |
| `daosi` | **Người Gác Rừng Corran** | Thornwood Reach | 21109 | Giữ rừng ba đời. Người đầu tiên nói thẳng về Trụ Khoá: *"Thủ Hộ Vaeldra đóng nó xuống để ghim miệng vết nứt, rồi Tướng Quân của Morvahn tới ngồi lên nó."* · cảnh báo bi kịch trung tâm (có `chon`) |
| `thumo` | **Sylas, Người Giữ Tổ** | Hollow Roost | 21123 | Giữ **194 quả trứng** chưa nở. *"Trụ Roost đóng thẳng xuống giữa ổ ấp. Khí Morvahn ngấm qua vỏ trứng — thứ nở ra không còn là Axie nữa. Chúng ta gọi chúng là Chimera vì phải gọi bằng một cái tên nào đó."* |
| `ttmon` | **Liora, Ẩn Sĩ Frostmire** | Frostmire Vale | 21136 | Người chép sử. *"Băng ở đây không phải thời tiết. Nó là vết sẹo."* · **"đất Lunacia quanh nó đang bị viết lại thành đất Vaeldra."** ← câu quan trọng nhất trong toàn bộ lore hiện có |
| `noiung` | **Dax, Kẻ Do Thám** | Ashen Steppe | 21149 | Ba năm nằm đếm quân. *"Ta đếm được bốn nghìn hai trăm quân. Ngươi có một người."* · Tướng Quân *"dựng lều ngay trên Trụ Ashmark, ngồi lên nó như ngồi lên ghế"* (có `chon`) |
| `laotuong` | **Lão Tướng Brann** | Stormgate Pass | 21163 | Giữ ải từ trước khi trời nứt. Gọi tên cả sáu người trước. *"Gỡ nó xuống thì đường tới Morvahn thông — nhưng đường đó thông cả hai chiều."* (có `chon`) |

NPC phụ có `lore` thật (không phải dẫn chương nhưng là chất liệu tốt):
`truonglang` **Trưởng Làng** (`canbang.js:732`, *"Ta vớt ngươi lên khi bầu trời còn đang nứt"*) ·
`duocsu` **Dược Sư** (`game.js:21073`, *"nửa số bệnh ta chữa không có trong sách nào cả"*) ·
`thoren` / `thoren_dao` **Thợ Rèn** (`canbang.js:746`, `752`) ·
`traichu` **Trại Chủ Mục Đồng** (`game.js:21180`) ·
ba **Vực Thẳm** `vandai` / `doantruongnhai` / `dinhbiennhai` (`game.js:21205-21213`) —
cả ba đã được viết lại để cùng nói một điều: **đất nứt ở đây là vì cái trụ ở gần đó**.

### 1.6 Manh mối (`CLUES`) — 22 mẩu, hiện đang rơi từ boss

`data/canbang.js:916` · bảng rơi `game.js:22021` (`CLUE_DROPS`, 15 mẩu có nguồn rơi).

Nhóm **"nguồn gốc"** (7 mẩu): `ban_do_da` (hải đồ ghi "vô chủ", ai đó gạch đi viết đè
"CÓ NGƯỜI Ở") · `co_thu` (Trang Nhật Ký Thủ Hộ: *"Hôm nay ta mới biết bên đó có người ở.
Bốn vạn người."*) · `cot_nhan` (Xương Chim Khắc Chữ: *"Vết nứt không tự mở. Có kẻ bẻ nó về
phía chúng ta."*) · `tan_quyen` («Ngũ Trụ Ký») · `buc_hoa` (Bích Họa Ngũ Trụ) ·
`mat_lenh` (*"…khi đủ năm trụ gãy, Vết Nứt mở toang — Morvahn bước qua, Lunacia thành lò
luyện."*) · `co_lenh` (Quân Lệnh Cũ, **dấu triện đã sáu mươi năm — cũ hơn cuộc giao thoa rất
nhiều**).

Nhóm **"đội tiên phong"** (6 mẩu, `canbang.js:927-938`): `lenh_bai_doi` (Bảng Tên bảy người,
năm cái bị gạch, cái thứ sáu là tên ngươi) + `td_giap` **HALLA** · `td_nhatky` **MEV** ·
`td_huyhieu` **ORIN** · `td_bia` **SERR** · `td_trong` (Chỗ Trống Thứ Bảy — không có gì cả).
Chú thích tại chỗ ghi rõ chủ ý: *"Bốn kết cục đầu là bốn cách Lunacia giết người, xếp từ NHANH
NHẤT tới CHẬM NHẤT… Người thứ năm cố tình không có gì để tìm."*

Nhóm còn lại (9 mẩu): `manh_lenh` · `thiep_den` · `di_thu` · `phuc_lanh` · `thu_tinh` ·
`le_thach` · `thu_cuoi`.

### 1.7 Chimera — kẻ thù, và cũng là bạn đồng hành

`data/canbang.js:27` (`window.CHIMERA`) — **16 con, quay ra từ gacha Khế Ước**, mỗi con mang
`lop` đúng bằng tên lớp Axie chính thức:

| Bậc | Con (lớp) |
|---|---|
| 5★ | Aurelion (Dawn) · Netherfang (Dusk) · Tidewarden (Aquatic) · Emberjaw (Beast) · Voltcrest (Bird) · Ironshell (Reptile) |
| 4★ | Petalkin (Plant) · Crimsonmaw (Beast) · Thornpaw (Plant) · Inkmane (Dusk) · Cinderbeak (Bird) · Mossback (Plant) · Hexmite (Bug) · Ridgehorn (Reptile) · Coghound (Mech) · Sunspur (Dawn) |

Hai câu `moTa` đã tự nói lore: Netherfang *"Sinh ra từ khe nứt"*; Petalkin *"Con Chimera đầu
tiên chịu đi theo người lạ."*
Mỗi Chimera có **4 ô Cốt** (`COT_O`, `game.js` khu 4249–4390) — đủ bộ một Dòng thì mở hiệu ứng
4 mảnh. **Đây là cầu nối cơ chế ↔ lore mạnh nhất đang có mà chưa ai kể**: người chơi *cho
Chimera ăn vật chất của vùng đất*.

### 1.8 Trạng thái hiện tại của hệ nhiệm vụ

| Thứ | Trạng thái | Bằng chứng |
|---|---|---|
| `QUESTS` | **rỗng** | `canbang.js:135` |
| `SIDE_QUESTS` | **rỗng** | `canbang.js:913` |
| Máy chạy nhiệm vụ | **nguyên vẹn**, chạy theo dữ liệu | `game.js:9347` `currentQuest()` · `8968-8979` móc giết · `21556` `questOnTalk()` · `21259` `sideOnEvent()` |
| `reqMain` (khoá map theo nhiệm vụ) | **đã gỡ khỏi mọi map**; nhánh đọc còn sống trong `mapGate()` | `game.js:21308-21322` · `CLAUDE.md:259-262` |
| Nhật Ký nói "chưa có nhiệm vụ", không nói "hoàn tất" | đúng | `game.js` `renderQlog()` |

**Các `type` mà máy thật sự hiểu** (đây là trần kỹ thuật của mọi thiết kế bên dưới):

| `type` | Máy đếm bằng gì | Ghi chú |
|---|---|---|
| `talk` + `targetNpc` | `questOnTalk()` `game.js:21556` | ⚠ Nếu người **giao** trùng người **cần gặp** thì nhánh hiển thị rơi sai — lỗi cũ đã ghi ở `docs/KHAO_SAT_UX_COTTRUYEN.md` |
| `kill` + `mob` | `q.mob === m.type` | **`m.type` của boss vùng là `'zb_' + bossId`** (`game.js:7833`). Nên `mob:'zb_cn4'` = hạ Tướng Quân Thornwood. Đây là chìa khoá để nhiệm vụ chính bám vào bảy Tướng Quân |
| `tpkill` + `mob` | như trên, nhưng phải giết bằng Trấn Phái | dạy người chơi dùng tuyệt chiêu |
| `boss` | `m.type === 'boss'` | ⚠ **CẨN THẬN**: kiểu này đặt `victory = true` và bật `showVictory()` (`game.js:8975`). Chỉ dùng đúng một lần ở cuối game, hoặc không dùng |
| `collect` + `herbMap` | `sideOnEvent('collect')` khi hái thảo dược | ⚠ `HERB_SPOTS` **chỉ có `daohoa` và `ngoai`** (`game.js:5983`) |
| `enhance` | `it.plus >= q.need` khi rèn | |
| `meditate` | đứng ở Suối Ký Ức đủ `need` giây | chỉ có ở `daohoa` |

Phụ tuyến (`SIDE_QUESTS`) thêm: tối đa **3 cái active cùng lúc** (`sideAvail()`), gác bằng
`reqLv` + `reqMain`, và **có trường `clue`** — manh mối được trao **ngay lúc NHẬN**, không phải
lúc trả (`acceptSide()`, `game.js` ~21290, chú thích ghi rõ chủ ý: *"người chơi phải ĐỌC ĐƯỢC
thứ mình đang mang đi suốt quãng đường"*). Đây chính là bộ máy chuỗi phụ tuyến "mảnh chứng cứ"
cần, **đã có sẵn, không phải dựng mới**.

### 1.9 Chỗ MÂU THUẪN và chỗ BỎ LỬNG — nói thẳng

| # | Vấn đề | Bằng chứng | Mức |
|---|---|---|---|
| M1 | **Trụ Khoá có HAI bộ tên đang cùng chạy.** `TRU_KHOA` dùng địa danh (Trụ Thornwood/Roost/Frostmire/Ashmark/Stormgate) nhưng `BOSS_LORE` vẫn cho Tướng Quân nói **"Trụ Thủy"** (`cn4`), **"Trụ Mộc"** (`ng4`, `cm4`), **"Trụ Kim"** (`mc4`); `CLUES.phuc_lanh` cũng ghi *"Trụ Mộc đã lung lay"* | `canbang.js:945+` · `canbang.js:924` · `canbang.js:945+` vs `game.js:22042` | **Nặng** — chính chú thích ở `game.js:22037-22040` nói bộ tên ngũ hành cũ *tự đá nhau*, mà bộ cũ vẫn còn trong lời thoại boss |
| M2 | **Petalshade Isle và Outskirts có Tướng Quân nhưng không có Trụ.** Vậy hai Tướng Quân đó đang giữ cái gì? Chưa có một dòng nào trả lời | `canbang.js:138-147` vs `game.js:22042` | **Nặng** — chính là chỗ lore cần lấp |
| M3 | **`REGION_UNLOCK_LORE.chungnam` viết "trụ thứ nhất trong năm"**, nhưng NPC Corran ở cùng vùng nói *"Trụ Khoá thứ nhất nằm giữa rừng"* — hai chỗ đồng ý, nhưng `CLUES.buc_hoa` lại nói *"Chỗ vẽ trụ thứ nhất giờ chỉ còn một vệt cháy đen"*, ngụ ý trụ thứ nhất **đã gãy từ trước** | `game.js:22063` · `game.js:21112` · `canbang.js:925` | Vừa |
| M4 | **Bảng Tên Đội Tiên Phong không cộng ra số nào.** Rell nói *"Đội ta bảy người"* và *"Sáu người theo ta"*. `lenh_bai_doi` nói bảng có **bảy tên, năm bị gạch, cái thứ sáu là tên ngươi**. Nhưng chỉ có **bốn** mẩu chứng cứ có tên (HALLA·MEV·ORIN·SERR); mẩu thứ năm `td_trong` lại tự gọi mình là **"Chỗ Trống Thứ Bảy"** | `game.js:21085-21086` · `canbang.js:927-938` | **Nặng** — đây là sợi dây duy nhất nối nhân vật chính với quá khứ của chính mình, và nó đang không đếm được |
| M5 | **`CLUES.co_lenh` (`canbang.js:939`) nói dấu triện Stormgate đã 60 năm — "cũ hơn cuộc giao thoa rất nhiều"**, và Brann nói *"Ta giữ cửa ải này từ trước khi bầu trời nứt"*. Vậy Lunacia **đã có chiến tranh trước khi Vaeldra tới**. Không có một dòng nào giải thích cuộc chiến đó | `canbang.js:939` · `game.js:21164` | Vừa — **và đây là mỏ vàng**, xem §4 |
| M6 | **Hung Thần** được khai là "boss thế giới định kỳ, **không phải** Morvahn" (`CLAUDE.md:358`) nhưng `showKetMo()` lại nói *"Morvahn đang bước qua"* và hệ sự kiện thế giới gọi `MATON` là "Hung Thần Giáng Thế" 6 lần/ngày. Người chơi không có cách nào phân biệt | `CLAUDE.md:358` · `game.js:22114` · `CLAUDE.md:533` | Vừa |
| M7 | **Đài đấu boss Petalshade là nội dung chết.** `spawnBoss()` chỉ chạy khi `questIdx >= 9` (`game.js:7684`); `QUESTS` rỗng ⇒ `questIdx = 0` ⇒ **MOBS.boss "Thủ Lĩnh Gloam" và `BOSS_ARENA` không bao giờ xuất hiện**. Vòng tròn "Sát Đài" vẫn vẽ ra ở `game.js:10829` với cùng điều kiện nên cũng tắt | `game.js:7684` · `10829` · `5975` | **Nặng** — và tên **"Sát Đài"** còn là tàn dư kiếm hiệp, vi phạm Quy tắc 1 |
| M8 | **Ba vùng cuối gần như không vào được nếu không có nhiệm vụ.** `GATES` (`game.js:1667`) chỉ có cổng tới `ngoai` · `tuyettinh` · `daohoa` · `chungnam` (+ Tầng Sâu). `comoc` · `mongco` · `nhanmon` **không có cổng nào**, và nút Dịch Chuyển trong bảng Bản Đồ đòi `wpUnlocked` mà `wpUnlocked` chỉ bật khi đã từng `travelTo()` tới đó. Đường duy nhất còn lại hiện nay là **Truy Nã Lệnh hằng ngày** (`truynaBand()`, `game.js:24090` — bảng `TRUYNA_BANDS` `game.js:5873` có đủ ba map đó) | `game.js:1667` · `21430-21445` · `5873` | **Nặng** — gỡ nhiệm vụ đã vô tình biến ba vùng cuối thành nội dung ẩn sau một cái bảng truy nã |
| M9 | **Cổng Bắc của Lunaris City dẫn thẳng tới Frostmire Vale (cấp 62–78)**, đứng cạnh Cổng Nam dẫn tới Outskirts (cấp 14–24). Về địa lý truyện thì đó là một cái thành có hàng xóm chênh nhau 50 cấp | `game.js:1669` | Vừa |
| M10 | **Thảo dược chỉ có ở hai map đầu** (`HERB_SPOTS`, `game.js:5983`), nên `type:'collect'` không dùng được cho bất kỳ chương nào từ Thornwood trở đi | `game.js:5983` | Vừa |
| M11 | **`docs/LORE_BIBLE.md` đã bị bỏ** (banner ở đầu tệp: *"TÀI LIỆU ĐÃ BỎ — ĐỪNG DÙNG"*), nhưng nó vẫn là tệp duy nhất trong `docs/` có chữ "Lore" trong tên. Người sau rất dễ mở nhầm | `docs/LORE_BIBLE.md:1-6` | Nhẹ |
| M12 | **Ngũ hành vẫn là khoá dữ liệu** (`Kim/Mộc/Thủy/Hỏa/Thổ`) nhưng **tên hiện ra đã đổi hẳn** sang `Steel · Verdant · Stone · Frost · Ember` (`game.js:866-872`). Chữ người chơi thấy **sạch**; chỉ khoá nội bộ còn ngũ hành. Không phải lỗi, nhưng đừng để nó rò ra văn bản mới | `game.js:866` | Nhẹ |
| M13 | **`ANCIENT_SETS` không tồn tại trong repo** (0 chỗ khai). Hệ Cổ Thần đã gỡ và quy ra Lumen khi tải save cũ (`game.js:5838-5839`, `7227-7238`) | grep | — (ghi lại vì đề bài hỏi) |
| M14 | **`strings/vi.js` và `strings/en.js` chỉ có 12 khoá HUD**, không có một dòng cốt truyện nào. Toàn bộ lore nằm cứng trong `game.js`/`canbang.js` bằng tiếng Việt | `strings/vi.js` · `strings/en.js` | Vừa — mọi văn bản mới sẽ nằm cứng như thế |

---

## 2. Lore Axie chính thức — có nguồn

> **Cách đọc bảng này.** Cột "Hạng" phân ba mức:
> **CT** = chính thức (Sky Mavis tự phát ngôn: trang lore, blog The Lunacian, tài khoản chính
> thức, trang hỗ trợ). **PS** = phái sinh chính thức (whitepaper / trang bán Land / trang cửa
> hàng ứng dụng — vẫn của Sky Mavis nhưng là văn bản sản phẩm, không phải văn bản truyện).
> **CĐ** = cộng đồng suy đoán (wiki fan, bài blog người chơi, bình luận diễn đàn).
>
> ⚠ **Hạn chế kỹ thuật khi khảo sát:** proxy mạng của môi trường này **chặn**
> `axieinfinity.com`, `blog.axieinfinity.com` và `axie-infinity.fandom.com`. Tôi **không đọc
> được toàn văn** ba nguồn đó, chỉ đọc được phần trích trong kết quả tìm kiếm. Mọi dòng dưới
> đây đều là **trích dẫn gián tiếp**, và tôi đánh dấu rõ chỗ nào chỉ có một câu.

### 2.1 Thế giới và thần

| # | Nội dung | Hạng | Nguồn |
|---|---|---|---|
| A1 | **Lunacia** là một hành tinh cổ từng thịnh vượng, các loài sống hoà thuận với thiên nhiên | CT | [x.com/AxieInfinity 1913215941292540250](https://x.com/AxieInfinity/status/1913215941292540250) |
| A2 | **Atia** là **thần Mặt Trời**, được mọi loài bản địa Lunacia thờ; thời Atia còn đi trên đất Lunacia thì được yêu kính | CT | [axieinfinity.com/lore](https://axieinfinity.com/lore) (qua trích dẫn tìm kiếm) |
| A3 | **Chimera sinh ra từ dạng bị tha hoá của Atia** ("born from the sun god Atia's corrupted form") | CT | [x.com/AxieInfinity 1913215941292540250](https://x.com/AxieInfinity/status/1913215941292540250) |
| A4 | Có một cách kể **khác chiều**: *"the evil Chimera poisoned Atia, the Sun God"* — Chimera đầu độc Atia, chứ không phải sinh ra từ Atia | CT (nhưng **mâu thuẫn nội bộ** với A3) | trích từ kết quả tìm kiếm trỏ về [axieinfinity.com/lore](https://axieinfinity.com/lore) |
| A5 | Dù bị tha hoá, **nhịp tim của Atia vẫn kháng lại và giữ ánh sáng còn sống ở Lunacia**; hành động đó sinh ra những **Ultimate Axie** đầu tiên — tổ tiên của Axie ta chơi hôm nay | CT | trích từ kết quả tìm kiếm trỏ về axieinfinity.com/lore |
| A6 | Lunacia từng là nơi **các vị thần đi trên đất, bay trong mây, bơi dưới biển**; sau **hàng thế kỷ chiến tranh**, Lunacia "chín muồi để dựng lại" | CT | [blog.axieinfinity.com/p/introducing-atias-legacy](https://blog.axieinfinity.com/p/introducing-atias-legacy) · [x.com 1897502451043065954](https://x.com/AxieInfinity/status/1897502451043065954) |
| A7 | Người nuôi và điều khiển Axie được gọi là **Lunacian** | CT | axieinfinity.com (qua trích dẫn) |
| A8 | Ngoài Axie, Lunacia còn loài **Sapidae** — cùng Axie chống Chimera | CT | [x.com 1913215941292540250](https://x.com/AxieInfinity/status/1913215941292540250) |

### 2.2 Chimera — kẻ thù chính thức

| # | Nội dung | Hạng | Nguồn |
|---|---|---|---|
| B1 | Trong **Axie Infinity: Origins**, chế độ Adventure là: *"Lunacia đang bị tấn công, và bạn cùng đàn Axie phải đánh lui những sinh vật gọi là Chimera trong khi dựng lại và củng cố Vương Quốc"* | CT | [support.axieinfinity.com — Origins Gameplay Mechanics](https://support.axieinfinity.com/hc/en-us/articles/10614779625883-Origins-Gameplay-Mechanics) |
| B2 | Chimera **áp sát biên giới** các vùng đất, tạo ra xung đột thường trực của thế giới | CT | axieinfinity.com (qua trích dẫn) |
| B3 | Ba nhân vật khởi đầu của cốt truyện Origins: **Buba** (Beast) · **Olek** (Plant) · **Puffy** (Aquatic). Olek là chiến binh kỳ cựu, đóng vai người dạy hai con kia | PS | [bitpinas.com — Origins gameplay guide](https://bitpinas.com/learn-how-to-guides/axie-infinity-origin-gameplay-mechanics-guide/) |
| B4 | Ý "chúa tể Chimera phá huỷ mặt trăng khiến các Axie hùng mạnh teo lại thành hình bé nhỏ hôm nay" | **CĐ** | thảo luận cộng đồng, ví dụ [hive.blog — A Different Perspective: Axie Lore](https://hive.blog/hive-143402/@grenfunkel/a-different-perspective-axie-lore-oror-axie-infinity) |

### 2.3 Codex Season 1 — "Songs of the Soil" (lore mới nhất, 2026)

| # | Nội dung | Hạng | Nguồn |
|---|---|---|---|
| C1 | Codex S1 mở **ba nhánh truyện độc lập**: *"Kei and the First Golem"* · *"The Golems of War"* · *"The Black Kiln"* — kể về **nguồn gốc Golemry**, **liên minh Sapidae ↔ Axie thời chiến**, và **cuộc tha hoá sinh ra một trong những mối đe doạ lớn nhất Lunacia** | CT | [blog.axieinfinity.com/p/codex-season-1-is-live](https://blog.axieinfinity.com/p/codex-season-1-is-live) |
| C2 | **Spirit Clay** (đất sét linh) là tiền tệ mùa và là vật liệu của Golemry | CT | như trên |
| C3 | **Veyl** là một *Sapidae listener*, được giao một **Hat Golem**, được phép hành nghề Golemry theo giáo lý **Gentle Craft** (nghề dịu — cốt lõi là **tiết chế**). Veyl bắt đầu bỏ Hat Golem lại; thiếu nó thì *"tiếng nói của Lunacia dịu đi, dễ phớt lờ hơn"*; **Petrasense** trở thành tiếng ồn nền thay vì lời chỉ dẫn; Veyl bắt đầu nặn Spirit Clay **theo ý muốn thay vì theo hoà hợp**. Khi Veyl quay lại đền một mình thì Gentle Craft **đã vỡ** | CT | [x.com/AxieInfinity 2045849901767283046](https://x.com/AxieInfinity/status/2045849901767283046) |
| C4 | Codex S1 là **lore dựng nền cho Atia's Legacy** — MMO Axie đang phát triển | CT | [x.com 2036476742647554144](https://x.com/AxieInfinity/status/2036476742647554144) |

> **Đây là mảnh lore chính thức gần nhất với cốt truyện game ta đang làm.** Veyl không phải kẻ
> ác từ đầu: hắn là người **được đào tạo tử tế, có thẩm quyền, và làm hỏng mọi thứ bằng cách bỏ
> đi đúng một thói quen tiết chế**. Đó gần như *chính xác* hình dạng của "Thủ Hộ Vaeldra bẻ lệch
> vết nứt để cứu nhà mình". Xem §3.

### 2.4 Vùng đất — Land

| # | Nội dung | Hạng | Nguồn |
|---|---|---|---|
| D1 | Lunacia chia thành **90.601 ô đất**, gồm bảy loại: **Savannah · Forest · Arctic · Mystic · Genesis · Luna's Landing · Map** | PS | [whitepaper.axieinfinity.com/gameplay/land](https://whitepaper.axieinfinity.com/gameplay/land) · [medium.com/axie-infinity — Land Sale](https://medium.com/axie-infinity/everything-you-need-to-know-about-the-axie-infinity-land-sale-in-one-place-2e0a876b4512) |
| D2 | Bốn loại được đúc trong đợt bán đầu: **Savannah · Forest · Arctic · Mystic**. **Genesis** là đất có tỉ lệ sinh boss hiếm cao hơn | PS | như trên |
| D3 | **Luna's Landing** nằm ở **chính giữa Lunacia**, gồm **8 ô hiếm nhất**, dành thưởng cho nhà sưu tầm 2024, và được dự định làm **sân khấu cho các sự kiện trọng đại** của thế giới Axie | PS | [blog.axieinfinity.com/p/lunas-landing-is-live](https://blog.axieinfinity.com/p/lunas-landing-is-live) · [gam3s.gg](https://gam3s.gg/news/rarest-plots-axie-infinity-homeland/) |
| D4 | **KHÔNG có lore chính thức nào nói Lunacia bị "chia cắt"/"nứt"/"vỡ" thành các quần xã.** Tôi tìm bằng bốn truy vấn khác nhau và không ra một câu chính thức nào. Ý "Lunacia bị chia cắt" trong đề bài **không phải lore Axie** | — | tìm kiếm không có kết quả chính thức; xem D5 |
| D5 | Câu chuyện "Lunacia bị chia cắt / mặt trăng bị phá" chỉ xuất hiện trong **bài viết cộng đồng** và các cuộc thi lore fan-made | **CĐ** | [peakd.com — Lore Contest](https://peakd.com/hive-143402/@stellariche/axie-infinity-lore-contest-the-beauty-of-lunacia) · [hive.blog — Journey of Lunacia](https://hive.blog/axiebuzz/@teachaxie/axie-infinity-lore-contest-the-journey-of-lunacia-part-1) |

### 2.5 Chín lớp Axie và vòng khắc chế

| # | Nội dung | Hạng | Nguồn |
|---|---|---|---|
| E1 | **6 lớp gốc**: Beast · Aquatic · Plant · Bird · Bug · Reptile. **3 lớp bí ẩn**: Mech · Dawn · Dusk | CT/PS | [axie-infinity.fandom.com/wiki/Axie_Class](https://axie-infinity.fandom.com/wiki/Axie_Class) · [galaron.medium.com](https://galaron.medium.com/axie-infinity-101-the-different-classes-6fb3d406f11d) |
| E2 | **Vòng khắc chế là ba NHÓM, không phải chín cạnh riêng lẻ:** Reptile·Plant·Dusk **>** Beast·Bug·Mech **>** Aquatic·Bird·Dawn **>** Reptile·Plant·Dusk | CT/PS | như trên |
| E3 | Lợi thế lớp = **+15% sát thương**; bất lợi = **−15%**. Ngoài ra Axie dùng thẻ đúng lớp mình được **+15% công/khiên** | CT/PS | như trên |

> **Đối chiếu với game ta.** Game ta chạy vòng **năm** hệ (`ELEM`, `game.js:866`):
> `Steel ⚔ Verdant ⚔ Stone ⚔ Frost ⚔ Ember ⚔ Steel`, khắc chế **+20% / −12%**.
> Đây là **vòng năm, không phải vòng ba-nhóm-chín** của Axie. **Không khớp, và không nên ép cho
> khớp** — nhưng 16 Chimera trong `canbang.js:27` **đã mang đúng tên chín lớp Axie**
> (`lop:'Dawn'`, `'Dusk'`, `'Aquatic'`…). Tức là game đang dùng **hệ Axie ở tầng Chimera** và
> **hệ năm nguyên tố ở tầng chiến đấu**, hai hệ song song không nói chuyện với nhau. Xem §8.

---

## 3. Cái gì mượn được, cái gì không

Đây là game **IP gốc**, chỉ *lấy cảm hứng*. Nguyên tắc phân loại tôi dùng:
**khái niệm và motif thì mượn được; tên riêng và nhân vật đã đăng ký thì không.**

### 3.1 MƯỢN ĐƯỢC — và nên mượn

| Thứ mượn | Vì sao được | Dùng vào đâu trong game ta |
|---|---|---|
| **Chimera = sinh vật bị bẻ cong bởi một thứ tha hoá** | "chimera" là danh từ thần thoại Hy Lạp, không ai sở hữu; và game ta **đã** dùng, đã có 16 con | Giữ nguyên. `CLAUDE.md:350` đã định nghĩa nguồn tha hoá **của ta** (khí Morvahn), không phải Atia |
| **Quan hệ khắc chế nhóm-ba** (E2) | Cơ chế, không phải nội dung | **Không bê nguyên.** Nhưng có thể dùng để **gom** 16 Chimera thành ba nhóm khi làm nội dung tổ đội — xem §8 |
| **Motif "thế giới từng yên bình, một thứ thiêng bị tha hoá, sinh vật hoá quái"** (A1·A3) | Motif phổ thông của cả thể loại | Đã là xương sống của canon ta |
| **Motif "người tử tế phá hỏng mọi thứ vì bỏ đi một thói tiết chế"** (C3 — Veyl) | Motif, không phải tên | **Đây là chỗ mượn giá trị nhất.** Thủ Hộ Vaeldra bẻ vết nứt vì lý do tốt (cứu nhà mình) và làm hỏng một thế giới khác. Cùng một hình dạng bi kịch, nội dung hoàn toàn khác |
| **Motif "vùng đất là ô, có chủ, sinh tài nguyên"** (D1) | Cơ chế Land | Đã có bản đối ứng: bảy vùng × một Dòng Cốt độc quyền |
| **Motif "một điểm ở giữa thế giới là sân khấu của sự kiện lớn"** (D3 — Luna's Landing) | Motif | Lunaris City đã đóng đúng vai đó. Không cần đổi gì |
| **Chín tên lớp Axie** dùng làm **thuộc tính của Chimera** | Đây là **tên loại sinh vật của một hệ đồ chơi**, đã dùng như từ chung suốt cộng đồng, và game ta **đang dùng rồi** ở `CHIMERA[].lop` | Giữ. Nhưng **không** đưa lên chữ người chơi thấy như một hệ thống ganh đua với `ELEM` |

### 3.2 KHÔNG ĐƯỢC CHÉP

| Thứ | Vì sao | Thay bằng |
|---|---|---|
| **Atia** | Tên riêng của thần trong IP Sky Mavis, là trung tâm của cả một MMO đang phát triển ("Atia's Legacy") và một tính năng có tên ("Atia's Blessing") | Game ta **không cần một vị thần**. Canon ta không có thần — nó có **Thủ Hộ** (kỹ thuật viên) và **Morvahn** (thứ bị chôn). Đó là một thế giới quan **khác**, và khác là tốt. ⚠ `docs/THUAT_NGU.md` đang liệt "Atia" trong danh sách danh từ riêng giữ nguyên — **nên gỡ**, xem §8 |
| **Lunacia** | Tên riêng thế giới của Sky Mavis | ⚠ **Game ta đang dùng Lunacia ở khắp nơi**: `MAPS.nhanmon.desc` (`canbang.js:616`), tiêu đề bảng Bản Đồ *"Bản Đồ Lunacia"*, `INTRO_PAGES`, lời thoại bảy NPC dẫn chương, `showKetMo()`. **Đây là rủi ro bản quyền lớn nhất còn tồn tại trong game và nó chưa từng được nêu ra.** Xem §8, rủi ro R1 |
| **Sapidae · Veyl · Golemry · Spirit Clay · Gentle Craft · Petrasense · Hat Golem** | Tên riêng Codex S1, mới, có chủ rõ | Ta đã có bộ tương ứng: **Cốt** (vật chất) · **Thủ Hộ** (nghề) · **Đoàn Gloam** (kẻ bỏ nghề) |
| **Buba · Olek · Puffy** và mọi nhân vật Origins | Nhân vật có bản quyền | Ta đã có bảy NPC dẫn chương riêng |
| **Savannah · Forest · Arctic · Mystic · Genesis · Luna's Landing** | Tên loại đất trong sản phẩm Land | Ta đã có bảy tên gốc: Petalshade · Thornwood · Hollow Roost · Frostmire · Ashen Steppe · Stormgate · Lunaris |
| **"Ultimate Axie"** | Thuật ngữ IP | Không cần |
| **"the Rift" như một danh từ riêng Axie** | **Không tồn tại trong lore Axie chính thức** (D4). Nếu ta dùng "the Rift" ta đang tự đặt, không phải mượn | Ta đã có **"vết nứt"** (tiếng Việt, thường) — giữ nguyên, đừng nâng thành danh từ riêng tiếng Anh |

### 3.3 Bộ tên GỐC đề xuất thêm — hợp hệ danh pháp đã có

Hệ danh pháp hiện hành ghép **danh từ tự nhiên + hậu tố địa hình tiếng Anh**:
`Petalshade` · `Thornwood Reach` · `Hollow Roost` · `Frostmire Vale` · `Ashen Steppe` ·
`Stormgate Pass` · `Lunaris City` · `Skyreach Ledge` · `Sorrowfall Cliff` · `Frontier's Edge` ·
`Elderbough Canopy` (đề xuất ở `docs/VUNG_ELDERBOUGH.md`).

Tên mới tôi đề xuất trong tài liệu này (tất cả đều **gốc**, đã đối chiếu để không trùng
danh từ riêng của Axie, MU Online hay Diablo):

| Tên | Loại | Dùng cho |
|---|---|---|
| **Chồng Lớp** | danh từ chung tiếng Việt | Hiện tượng trung tâm — hai thế giới chồng lên nhau (xem §4) |
| **Đường Khâu** | danh từ chung tiếng Việt | Vệt đất nơi hai lớp gặp nhau; nơi Cốt trồi lên |
| **Thủ Hộ Aldrec** | tên riêng, gốc | Vị Thủ Hộ Vaeldra đã bẻ lệch vết nứt. Hiện canon chỉ có "Thủ Hộ Vaeldra" số nhiều, không ai có tên |
| **DRUE** | tên riêng, gốc | Người thứ năm bị gạch tên trên Bảng Tên Đội Tiên Phong — và là kẻ **chưa chết** |
| **Ridgehollow Wash** | tên riêng, gốc | (tuỳ chọn) tên vùng lấp lỗ 38–42, nếu không dùng Elderbough Canopy |
| **Ashmark Bell** | tên riêng, gốc | Cái chuông đo đất của Thủ Hộ ở Ashen Steppe — vật chứng chương VII |

> ⚠ Tôi **cố ý không** đề xuất tên tiếng Anh cho "Chồng Lớp". Lý do: mọi khái niệm trung tâm
> hiện có trong game đều là **tiếng Việt** (Trụ Khoá · Vệ Binh Trụ · Tướng Quân · Cổng Vực ·
> Vỉa Cốt · Rương Canh · Dòng Cốt · Tầng Sâu). Chỉ **địa danh** mới là tiếng Anh. Thêm một khái
> niệm tiếng Anh là phá quy tắc đang chạy.

---

## 4. Câu trả lời trung tâm: TẠI SAO vùng đất này sinh ra?

### 4.0 Đọc lại câu hỏi cho đúng

Chủ dự án hỏi *"tại sao lại sinh ra vùng đất mới này"*. Có hai cách hiểu và cả hai đều phải
trả lời được:

- **(a) Trong truyện:** vì sao bảy vùng đất này tồn tại, ở dạng này, ngay lúc này?
- **(b) Ngoài truyện:** vì sao người chơi đang đi qua đúng bảy bãi săn có `min` 1/10/20/40/60/80/100,
  mỗi bãi rơi đúng một Dòng Cốt, có bốn Rương Canh mở một lần, và mỗi ngày có ba vỉa quặng mọc
  ở chỗ khác?

Một lời giải **chỉ trả lời (a)** là một đoạn văn hay. Một lời giải trả lời **cả (a) lẫn (b)**
là lore. Ba phương án dưới đây đều bị chấm theo (b).

**Năm thứ mà lời giải phải nhận trách nhiệm giải thích** — cả năm đang chạy trong game:

| Cơ chế | Hành vi thật | Ở đâu |
|---|---|---|
| ① Vết nứt lan theo Trụ Khoá | gỡ 1 trụ → vết nứt trên trời rộng thêm 1 nấc **và mọi bãi quái đông thêm 8%** | `game.js:1653` · `capNhatVetNut()` |
| ② Bảy Dòng Cốt | mỗi vùng rơi **đúng một** Dòng, không đâu khác | `game.js:4317` · `CLAUDE.md:124-136` |
| ③ Chimera đi theo người chơi | kẻ thù của cả thế giới lại **đi cạnh** người chơi, ăn Cốt qua 4 ô | `canbang.js:27` · `game.js:4249+` |
| ④ Rương Canh | vị trí **bốc từ tên map**, không bao giờ đổi; **4 con canh đủ 4 vai**; mở **một lần vĩnh viễn**, trại tan hẳn | `game.js:4678-4740` · `CLAUDE.md:293-319` |
| ⑤ Vỉa Cốt | **3/7 vùng mỗi ngày**, hạt từ `new Date().toDateString()`, **cách mọi bãi quái ≥ 320px**, một lần/ngày/vùng/nhân vật | `game.js:4570-4640` · `CLAUDE.md:270-291` |

---

### 4.1 PHƯƠNG ÁN A — **"Đất Chồng Lớp"**: đây không phải đất Lunacia nữa, cũng chưa phải đất Vaeldra

**Một câu:** Trụ Khoá không chỉ *ghim vết nứt lại*, nó **ghim hai thế giới vào đúng vị trí so
với nhau**; ở quanh mỗi trụ, vật chất hai bên **chồng lên nhau** và đông lại thành một loại đất
thứ ba — đó chính là bảy vùng người chơi đang đi.

**Kể ra:** Thủ Hộ Aldrec bẻ vết nứt sang Lunacia rồi đóng năm cái trụ xuống để giữ miệng nứt.
Nhưng đóng trụ vào một thế giới khác thì không giống đóng cọc xuống đất nhà mình — nó là ghim
hai tấm vải chồng nhau bằng năm cái đinh. Chỗ nào gần đinh, hai tấm dính khít. Chỗ nào xa đinh,
hai tấm **trượt** lên nhau. Vùng trượt đó là **Đường Khâu**, và mọi thứ mọc lên trên nó không
còn thuần Lunacia, cũng chưa kịp thành Vaeldra.

**Nó giải thích được gì:**

| Cơ chế | Giải thích |
|---|---|
| ① | **Trụ là đinh ghim.** Rút một cái đinh → hai tấm trượt thêm → vết nứt há thêm **và** thứ chui qua đông thêm. Con số 8%/trụ có nghĩa đen: mỗi trụ gỡ, cửa rộng thêm chừng ấy |
| ② | **Cốt là vật chất không thuộc về bên nào**, đông lại ở mép khâu. Mỗi vùng có nền vật chất Lunacia khác nhau (cánh hoa · cỏ · rễ gai · vỏ trứng · băng · tro · sấm) nên Cốt đông lại mang bản chất khác nhau ⇒ **bảy Dòng, không thể hoán đổi**. Đây là lời giải hay nhất trong ba phương án cho ② |
| ③ | Chimera đi theo là con **bị kẹt giữa hai lớp mà không bị xé**. Khế Ước là người chơi **cho nó mượn chỗ đứng của mình**; nó ăn Cốt để giữ hình. Bốn ô Cốt **là bốn cái ghim của riêng nó** |
| ④ | Rương Canh **là đồ Vaeldra rơi qua cùng khu phố Ardhaven** — vật thật, rơi một lần, nằm một chỗ. Vì vậy vị trí bốc từ **tên map** chứ không từ ngày. Bốn con canh là **một tiểu đội Đoàn Gloam** (lính Vaeldra đào ngũ) chốt trên kho tiếp tế của chính mình — nên có đủ bốn vai `nang·can·xa·phap`, và mở xong thì **tiểu đội tan, không dựng lại** |
| ⑤ | **Đường Khâu vẫn đang trượt mỗi đêm.** Vỉa Cốt mọc ở chỗ đêm qua trượt mạnh nhất ⇒ đổi chỗ mỗi ngày, đổi theo lịch của thế giới chứ không theo lịch của người chơi. Và **luật ≥320px cách bãi quái có nghĩa đen**: chỗ nào có nhiều sự sống bám thì hai lớp dính chặt, không trượt được, nên không có vỉa |

**Nó KHÔNG giải thích được:**

- Vì sao **Petalshade Isle và Outskirts có Tướng Quân mà không có Trụ** (mâu thuẫn M2).
- Vì sao con dấu Stormgate **đã 60 năm** và Brann giữ ải *"từ trước khi bầu trời nứt"* (M5).
  Theo phương án A thì trước lúc nứt, Stormgate Pass không có lý do gì tồn tại.
- Vì sao **dải cấp thủng ở 38–42 · 56–62 · 78–84**. Lore không chữa được lỗ nhịp.
- Atia — hoàn toàn vắng mặt. Nhưng đó là **chủ ý** (xem §3.2).

---

### 4.2 PHƯƠNG ÁN B — **"Vết Sẹo Sống"**: Lunacia tự mọc ra bảy vùng này để tự vá

**Một câu:** Lunacia là một thế giới **sống**; khi khí Morvahn tràn vào, nó phản ứng như một cơ
thể — **bọc lấy vết thương** bằng mô sẹo. Bảy vùng đất là bảy mảng sẹo, và Cốt là **can xương**
của thế giới.

**Kể ra:** Vết nứt không mở ra trên đất trống. Nó mở ra trên một cơ thể. Trong vòng vài tháng,
đất quanh miệng nứt **dày lên, cứng lại, đổi hình** — rừng mọc gai để chặn, thung lũng đóng
băng để làm chậm, thảo nguyên hoá tro để không còn gì cháy được nữa. Chimera là **kháng thể
hỏng**: thế giới cố nặn sinh vật của mình thành lính gác và làm được một nửa.

**Nó giải thích được gì:**

| Cơ chế | Giải thích |
|---|---|
| ② | Rất mạnh. Cốt = **can xương**. Vùng nào bị thương kiểu nào thì mọc can kiểu ấy |
| ③ | Rất mạnh. Chimera đi theo là **kháng thể thành công** — con duy nhất thế giới nặn đúng. Điều đó biến Khế Ước từ "gacha" thành "được thế giới chọn" |
| ⑤ | Mạnh. Sẹo vẫn đang mọc mỗi đêm ⇒ vỉa mới. Nhưng **không** giải thích được luật ≥320px |
| ① | **Yếu.** Trụ Khoá là đồ Vaeldra, không phải mô sẹo. Vì sao rút một cái đinh của người ngoài lại làm sẹo há ra thì phải kể vòng |
| ④ | **Rất yếu.** Rương Canh có **bốn con canh đủ bốn vai chiến thuật** — đó là một tiểu đội có huấn luyện, không phải mô sẹo. Muốn cứu thì phải bịa thêm một tầng "thế giới nặn ra lính giữ kho", mà kho thì lại là đồ Vaeldra |

**Nó KHÔNG giải thích được:** ④ gần như hoàn toàn · ① phải đi đường vòng · và nó **mâu thuẫn
trực tiếp** với câu đã ship của Liora: *"đất Lunacia quanh nó đang bị viết lại thành đất
Vaeldra"* (`game.js:21146`) — theo B thì đất đang được **Lunacia** viết, không phải Vaeldra.
Chọn B là phải sửa lời thoại đã ship.

---

### 4.3 PHƯƠNG ÁN C — **"Bản Nháp Bị Chôn"**: bảy vùng vốn đã ở đó, chỉ bị đậy

**Một câu:** Lunacia đã có một cuộc chiến **sáu mươi năm trước**, thua, và **chôn cả một tầng
thế giới của chính mình xuống dưới** để giấu thứ trong đó. Vết nứt Vaeldra chỉ **làm bung cái
nắp**.

**Kể ra:** Con dấu trên `co_lenh` đã sáu mươi năm. Brann giữ Stormgate Pass *"từ trước khi bầu
trời nứt"*. Bích Họa Ngũ Trụ vẽ năm trụ, và chỗ trụ thứ nhất **đã là một vệt cháy đen** trước
khi người chơi đặt chân tới. Ba chi tiết này đều nói cùng một điều: **có một cuộc chiến trước
cuộc chiến này.** Bảy vùng là chiến trường cũ, bị đậy lại, và Vaeldra vô tình mở nắp.

**Nó giải thích được gì:**

| Cơ chế | Giải thích |
|---|---|
| M2 (2 Tướng Quân không trụ) | **Rất mạnh** — hai Tướng Quân ở Petalshade là hai kẻ **đã ở đây từ trước**, không canh trụ mà canh cái nắp |
| M5 (con dấu 60 năm) | **Rất mạnh** — chính là điểm khởi hành |
| ④ Rương Canh | Khá — kho tiếp tế của **cuộc chiến cũ**, có người gác từ hồi đó. Nhưng khó giải thích vì sao chúng nằm ở cả bảy vùng kể cả Petalshade Isle cấp 1 |
| ① Trụ Khoá | Trung bình — trụ trở thành cái đinh **đóng lại nắp cũ**, nên gỡ trụ = mở nắp |
| ② Bảy Dòng Cốt | **Yếu.** Cốt thành "quặng chôn dưới", mất hẳn ý nghĩa "vật chất của hai thế giới" |
| ③ Chimera đi theo | **Rất yếu.** Không có lý do nào để một Chimera đi cạnh người chơi |
| ⑤ Vỉa Cốt đổi chỗ mỗi ngày | **Rất yếu.** Quặng chôn dưới thì nằm yên; không có lý do gì để nó đổi chỗ hằng đêm |

**Nó KHÔNG giải thích được:** ②③⑤ — tức là **ba trong năm cơ chế**, gồm cả hai hệ mới nhất
vừa dựng xong (Vỉa Cốt và Khế Ước Chimera). Chọn C là bỏ phí hai hệ vừa làm.

---

### 4.4 CHỐT: chọn **Phương án A — "Đất Chồng Lớp"**, hấp thu mảnh tốt nhất của C

**Chọn A.** Bốn lý do, xếp theo sức nặng:

1. **A là phương án duy nhất giải thích được cả năm cơ chế**, và giải thích **⑤ luật ≥320px** —
   một chi tiết kỹ thuật thuần tuý mà `CLAUDE.md:277-279` nói rõ là "cả thiết kế, đừng tối ưu
   mất". Khi lore giải thích được cả những luật kỹ thuật như vậy thì nó không còn là lớp sơn.
   B giải thích được 3/5, C giải thích được 2/5.
2. **A tốn 0 đồng retcon.** Câu *"đất Lunacia quanh nó đang bị viết lại thành đất Vaeldra"* của
   Liora (`game.js:21146`) và cả bảy dòng `REGION_UNLOCK_LORE` (`game.js:22060`) **đã nói đúng
   phương án A rồi**. Chọn B là phải sửa lời thoại đã ship; chọn C là phải sửa `INTRO_PAGES`.
3. **A biến Cốt từ tiền tệ thành bằng chứng.** Người chơi cày Cốt suốt 120 cấp. Theo A, mỗi
   mảnh Cốt **là một mẩu của hai thế giới dính vào nhau** — tức người chơi đang cầm trong tay,
   suốt cả hành trình, chính câu trả lời cho câu hỏi mà chuỗi phụ tuyến đang đi tìm. Đó là kiểu
   ý nghĩa không cần thêm một hệ thống nào để tạo ra.
4. **A đặt bi kịch trung tâm vào đúng chỗ cơ học.** Bi kịch đã chốt là *"gỡ trụ thì đi tiếp
   được, nhưng vết nứt toác thêm"* (`CLAUDE.md:354`). Theo A, người chơi **rút đinh ghim của
   chính hai thế giới**. Mỗi lần gỡ trụ, người chơi không chỉ mở đường cho Morvahn — người chơi
   **làm cho vùng đất mình vừa đi qua trượt thêm một khúc**. Con số +8% quái/trụ ngừng là một
   con số cân bằng và trở thành hậu quả.

**Hấp thu từ C — hai mảnh, và chỉ hai:**

- **Sáu mươi năm trước, Lunacia đã có chiến tranh** (lấy từ `co_lenh` + Brann). Cuộc chiến đó
  **không dính gì tới Vaeldra**; nó là chuyện nội bộ Lunacia. Nó giải thích vì sao Stormgate
  Pass là một **cửa ải có tường thành** trong một thế giới "chưa từng cầm vũ khí" — và vì sao
  Brann tồn tại. Đây cũng là chỗ khớp gần nhất với lore Axie chính thức A6
  (*"sau hàng thế kỷ chiến tranh"*), nên nó vừa lấp lỗ vừa gật đầu với nguồn.
- **Hai Tướng Quân không có trụ** (M2): Petalshade Isle và Outskirts **là miệng vết nứt**, không
  phải chỗ đóng đinh. Hai Tướng Quân ở đó **giữ chính cái miệng** — nghĩa là hạ chúng cũng không
  gỡ được trụ nào, và bảng Nhật Ký in hai con số khác nhau (`truDaGo()` vs `tuongQuanDaHa()`)
  **đã đúng từ trước**, chỉ chưa ai giải thích. Nay đã có giải thích.

**KHÔNG hấp thu từ B.** Không phải vì B dở — nó là phương án giàu cảm xúc nhất — mà vì nó đòi
Lunacia phải là một thực thể có ý chí, và một khi có thực thể đó thì **người chơi sẽ hỏi vì sao
nó không tự cứu mình**, và câu trả lời duy nhất là "vì nó là thần" — mà thần thì đã có tên rồi,
tên đó là **Atia**, và Atia là tài sản của người khác (§3.2). B dẫn thẳng vào chỗ ta không được
đi.

### 4.5 Câu trả lời rút thành sáu dòng, để đưa vào game

> Vaeldra không cứu được mình nên bẻ vết nứt sang nhà người khác.
> Để miệng nứt khỏi nuốt cả Lunacia, Thủ Hộ Aldrec đóng **năm cái đinh** xuống — Năm Trụ Khoá.
> Đinh giữ được miệng nứt, nhưng nó giữ bằng cách **ghim hai thế giới vào nhau**.
> Chỗ nào xa đinh, hai thế giới **trượt** — và trên vết trượt đó mọc lên thứ đất không thuộc về
> ai: **Đất Chồng Lớp**. Bảy vùng ngươi đang đi chính là nó.
> **Cốt** là hai thế giới đông lại thành đá. **Chimera** là sinh vật bị kẹt giữa hai lớp.
> Và mỗi cái đinh ngươi rút, hai lớp lại trượt thêm một khúc.

---

## 5. Chuỗi nhiệm vụ chính — 8 chương + 3 gian tấu, 52 nhiệm vụ

### 5.0 Luật tôi tự đặt cho chuỗi này

Chủ dự án nói: *"nhiệm vụ phải ý nghĩa với người chơi"*. Tôi dịch câu đó thành một cái sàng
**cứng**: mỗi nhiệm vụ phải đạt **ít nhất một** trong ba điều, và ghi rõ là điều nào.

| Mã | Nghĩa | Thử bằng câu hỏi |
|---|---|---|
| **H** — Đổi Hiểu Biết | sau khi làm xong, người chơi **biết một điều họ không biết trước đó** về thế giới | *"Nếu bỏ nhiệm vụ này, người chơi có mất một mẩu câu trả lời nào không?"* |
| **C** — Đổi Cách Chơi | mở/dạy một hệ thống, hoặc buộc dùng một cơ chế mà tự đánh không dạy được | *"Nhiệm vụ này có bắt người chơi làm một thứ họ chưa từng làm không?"* |
| **N** — Đổi Quan Hệ | một NPC đổi thái độ, hoặc người chơi phải **chọn**, và lựa chọn đó được nhắc lại về sau | *"Có ai nhớ chuyện này ở chương sau không?"* |

**"Giết 10 con X" chỉ hợp lệ khi nó kèm H, C hoặc N.** Trong bảng dưới, cột **Vì sao người chơi
quan tâm** luôn mở đầu bằng mã H/C/N. Nếu một dòng nào chỉ ghi được "vì được EXP" thì dòng đó
sai và phải bị cắt.

**Ba ràng buộc kỹ thuật tôi phải tuân theo** (đọc từ code, §1.8):
1. Chỉ dùng `type` mà máy hiểu: `talk` · `kill` · `tpkill` · `collect` · `enhance` · `meditate`.
   **Tuyệt đối không dùng `type:'boss'`** — nó bật `victory` và màn hình thắng cuộc.
2. Boss vùng giết bằng `type:'kill'`, `mob:'zb_<bossId>'`.
3. `collect` chỉ dùng được ở `daohoa` và `ngoai` (`HERB_SPOTS`).
4. **Không cắm lại `reqMain` vào `MAPS`.** `CLAUDE.md:259-262` cảnh báo đúng: khoá map sau
   nhiệm vụ nghĩa là nhiệm vụ hỏng thì map mất. Chuỗi này **chỉ đi theo cấp**, và thứ tự chương
   trùng với thứ tự `md.min` sẵn có nên không cần khoá gì thêm.

**Bốn nhiệm vụ dưới đây cần MỞ RỘNG MÁY** (đánh dấu ⚙ trong bảng). Chi tiết ở §7.3 —
mỗi cái là **một dòng** `sideOnEvent(...)`/một nhánh `switch`, không phải một hệ thống mới.

---

### Chương I — **Vỏ Kén** · Petalshade Isle · cấp 1–12
*Giao bởi: Trưởng Làng · Dược Sư · Thợ Rèn Lưu Vong*

Người chơi tỉnh dậy không nhớ mình là ai. Chương này **cố tình không nói gì về Trụ Khoá**. Nó
chỉ dạy một điều: **đảo này trước đây không như thế này.**

| # | Cấp | Giao | `type` | Làm gì | Ở đâu | Hé lộ | Vì sao người chơi quan tâm |
|---|---:|---|---|---|---|---|---|
| **NV1** | 1 | Trưởng Làng | `talk` → `duocsu` | Đi gặp Dược Sư ở đầu làng | Petalshade Isle | Trưởng Làng vớt ngươi lên *"khi bầu trời còn đang nứt"* | **N** — câu đầu tiên ai đó nói với ngươi trong thế giới này là một câu tử tế. Đặt nợ ân tình sẽ đòi ở NV9 |
| **NV2** | 2 | Dược Sư | `collect` `herbMap:'daohoa'` ×5 | Hái 5 khóm thuốc | Petalshade Isle | *"Rễ này mọc ngược từ hôm trời nứt"* — cây cối đổi hướng mọc | **C** dạy hệ hái thảo dược · **H** dấu hiệu đầu tiên: đất đang đổi |
| **NV3** | 3 | Dược Sư | `kill` `boar` ×8 | Hạ 8 Axie Heo Rừng | Petalshade Isle | Heo rừng đảo này ăn cỏ ba đời, tháng này bắt đầu cắn người | **H** — không phải "quái xấu", mà **quái đổi tính**. Đây là lần đầu chữ *Chimera* chưa được nói ra nhưng đã có mặt |
| **NV4** | 4 | Thợ Rèn Lưu Vong | `enhance` `need:1` | Rèn bất kỳ món nào lên +1 | Petalshade Isle | *"Lò của ta rơi qua vết nứt cùng ta"* | **C** dạy rèn ngay tại chỗ, **không** bắt vào Lunaris City (bẫy cũ: lò duy nhất nằm trong thành khoá tới cấp 10) |
| **NV5** | 5 | Trưởng Làng | `kill` `hautu` ×10 | Hạ 10 Axie Bí Ngô | Petalshade Isle | Bí Ngô vốn là loài ăn đêm; giờ chúng đi giữa trưa | **H** — mẩu thứ hai của cùng một hình mẫu. Ba mẩu là một quy luật |
| **NV6** | 6 | Trưởng Làng | `kill` `zb_dh1` ×1 | Hạ **Chúa Heo Rừng** (Vệ Binh Trụ) | Petalshade Isle | Lời mở màn: *"Cái mùi trên người ngươi… không phải mùi của thế giới này!"* | **H** đây là lần đầu **một con quái nhận ra ngươi là kẻ ngoại lai** · **C** dạy đọc telegraph 1,0–1,6s của boss vùng |
| **NV7** | 7 | Trưởng Làng | `meditate` `need:20` | Ngồi ở Suối Ký Ức 20 giây | Petalshade Isle | Mảnh ký ức đầu tiên: một cái tên — **HALLA** — và không gì khác | **H** mở sợi dây "đội tiên phong" · **N** người chơi lần đầu biết mình **từng có đồng đội** |
| **NV8** | 8 | Dược Sư | `kill` `bandit` ×12 | Hạ 12 Tay Sai Gloam | Petalshade Isle | Đoàn Gloam **không phải người bản địa** — chúng nói cùng thứ tiếng với ngươi | **H** cú vặn đầu tiên: kẻ cướp ở đây là **người phe ngươi** |
| **NV9** | 9 | Trưởng Làng | `kill` `zb_dh2` ×1 | Hạ **Chúa Bầy Gai Tím** | Petalshade Isle | *"Trăng ở đây đỏ hơn trước."* Trưởng Làng nói thẳng: đảo nuôi được ngươi, nhưng ngươi phải đi | **N** trả nợ ân tình NV1 và **kết thúc tuổi thơ**. Trưởng Làng **không xuất hiện trong chương nào nữa** — và đó là chủ ý |

> ⚠ **Chương này phải bật lại Đài Bình Cảnh hoặc gỡ nó.** Hiện `spawnBoss()` chỉ chạy khi
> `questIdx >= 9` (`game.js:7684`) — trùng đúng NV9. Nhưng `MOBS.boss` "Thủ Lĩnh Gloam" **trùng
> vai** với Tướng Quân `zb_dh4` (cùng tên, cùng phe). Đề xuất: **gỡ hẳn `BOSS_ARENA` +
> `spawnBoss()` + tên "Sát Đài"** (tàn dư kiếm hiệp, vi phạm Quy tắc 1) và để `zb_dh4` gánh vai
> trùm đảo. Xem §8, việc còn nợ V3.

---

### Chương II — **Thành Của Người Rơi** · Lunaris City · cấp 10–14
*Giao bởi: Trưởng Lão Rell · Thợ Rèn · Trinh Sát Wren*

| # | Cấp | Giao | `type` | Làm gì | Ở đâu | Hé lộ | Vì sao người chơi quan tâm |
|---|---:|---|---|---|---|---|---|
| **NV10** | 10 | Trưởng Làng | `talk` → `quachtinh` | Vào thành, gặp Trưởng Lão Rell | Lunaris City | Ba trang `trang` đã viết sẵn: Vaeldra bẻ vết nứt · hải đồ sai · *"Đội ta bảy người"* | **H** canon nền được nói thẳng lần đầu · **N** Rell hỏi câu quyết định: *"ngươi sang đây để sửa, hay để sống sót?"* (`chon` a/b — **phải được nhắc lại ở NV51**) |
| **NV11** | 10 | Rell | `talk` → `quachtinh` (sau The Calling) | Đáp lời **The Calling** — chọn lớp | Lunaris City | Ký ức võ nghệ trở về. Ngươi **là** một trong năm lớp Vaeldra | **C** mở toàn bộ bộ 4 chiêu của lớp · **H** ngươi không phải dân tị nạn, ngươi là **lính** |
| **NV12** | 11 | Thợ Rèn | `enhance` `need:3` | Rèn một món lên +3 | Lunaris City | *"Lò này cháy suốt từ hôm khu phố rơi qua. Ta không dám để nó tắt."* | **C** dạy mốc rèn thật · **H** cả khu phố Ardhaven rơi qua nguyên vẹn — bằng chứng vật lý đầu tiên của Chồng Lớp |
| **NV13** | 12 | Rell | `kill` `zb_dh3` ×1 | Hạ **Chấp Sự Gloam** | Petalshade Isle | Rơi manh mối **Nửa Quân Bài Gloam**. *"Bọn ta cũng từ bên kia qua thôi — chỉ là bọn ta thôi giả vờ làm anh hùng."* | **H** Đoàn Gloam = lính Vaeldra đào ngũ, xác nhận · **N** đây là lần đầu ngươi giết một người **cùng phe** |
| **NV14** | 13 | Rell | `talk` → `monkhach` | Gặp Trinh Sát Wren ở cổng Nam | Lunaris City | Wren: *"Ta sinh ra ở đây. Các ngươi thì rơi xuống đây."* | **N** đối trọng đạo đức của cả chuỗi. Rell cho ngươi lý do, Wren cho ngươi hoá đơn |
| **NV15** | 14 | Rell | `kill` `zb_dh4` ×1 | Hạ **Thủ Lĩnh Đoàn Gloam** | Petalshade Isle | Rơi **Tàn Quyển «Ngũ Trụ Ký»**: *"…năm trụ ghim Morvahn ở bên kia."* Hắn nói: *"Ta từng mặc bộ giáp giống ngươi đấy."* | **H** — **lần đầu tiên trong game hai chữ "Trụ Khoá" xuất hiện**, và nó đến từ một mẩu giấy nhặt trên xác một kẻ từng là ngươi |

---

### Chương III — **Đất Ngoài Thành** · Petalshade Outskirts · cấp 14–24
*Giao bởi: Trinh Sát Wren · Trại Chủ Mục Đồng*

Chương của **Wren**, và đây là chương duy nhất được kể **từ phía người bản địa**.

| # | Cấp | Giao | `type` | Làm gì | Ở đâu | Hé lộ | Vì sao người chơi quan tâm |
|---|---:|---|---|---|---|---|---|
| **NV16** | 14 | Wren | `kill` `boar_tusk` ×12 | Hạ 12 Heo Rừng Nhiễm Khí | Outskirts | Cùng loài NV3, cấp 14 — *"Con này ngươi từng giết ở đảo. Nó lớn lên"* | **H** khí Morvahn **không dừng lại**, nó tiếp tục · **C** dạy đọc bậc quái cựu binh (cùng hình, khác bậc) |
| **NV17** | 16 | Wren | `collect` `herbMap:'ngoai'` ×8 | Hái 8 khóm ngoài thành | Outskirts | Wren dạy đọc đất: *"Chỗ nào giữa có thứ ta chưa đặt tên được"* | **C** dạy hệ hái ở map thứ hai · **H** Wren, người bản địa, **cũng không biết** thứ ở giữa là gì |
| **NV18** | 18 | Trại Chủ | `catch` ⚙ (hoặc `kill` `wolf_alpha` ×12) | Bắt một Tuấn Mã Hoang | Outskirts | Ngựa hoang đây **né** vùng đất giữa đồng, cả bầy đi vòng | **C** mở hệ Thú Cưỡi · **H** con vật biết chỗ nào không nên bước — người chơi thì chưa |
| **NV19** | 19 | Wren | `kill` `zb_ng3` ×1 | Hạ **Đặc Vụ Gloam** | Outskirts | *"Ta không có tên. Tên ta ở lại bên kia vết nứt rồi."* | **H** vượt vết nứt **lấy đi tên**, không chỉ ký ức. Đây là chỗ giải thích vì sao ngươi khởi đầu Unclassed |
| **NV20** | 20 | Wren | `kill` `zb_ng2` ×1 | Hạ **Gai Tím Độc Nhãn** | Outskirts | Hắn nói *"Trụ đang rung — ngươi nghe thấy không?"* ⚠ (câu gốc ghi "Trụ Mộc", **phải sửa** — xem M1) | **H** trụ **rung được**, nghĩa là nó không phải đá · **C** cấp 20 mở Tầng Sâu và đất PK; Wren chỉ đường tới Giếng Vực Sâu |
| **NV21** | 22 | Wren | `kill` `gloam_scout` ×5 | Hạ 5 Trinh Sát Gloam (tinh anh) | Outskirts | Trên xác có **bản đồ đo đất**, đánh dấu năm điểm — bốn cái ngươi chưa tới được | **H** ai đó **đang đo đất Lunacia một cách có hệ thống** · **C** dạy đánh quái tinh anh đơn lẻ |
| **NV22** | 24 | Wren | `kill` `zb_ng4` ×1 | Hạ **Ma Sói Sương Trắng** | Outskirts | Rơi **Thư Mời Không Địa Chỉ** — *"lễ mở cổng"*, chỉ có ngày giờ. Mực còn mới | **H** có kẻ **đang lên lịch** cho việc mở cổng · **N** Wren dẫn ngươi tới bìa rừng rồi dừng lại: *"Chỉ một chuyến thôi"* — cô giữ lời |

---

### Chương IV — **Trụ Thứ Nhất** · Thornwood Reach · cấp 24–38
*Giao bởi: Người Gác Rừng Corran*

Chương dài nhất, và là chương **đổi cách chơi nhiều nhất**: PK · Cốt · Vỉa Cốt · Trấn Phái.

| # | Cấp | Giao | `type` | Làm gì | Ở đâu | Hé lộ | Vì sao người chơi quan tâm |
|---|---:|---|---|---|---|---|---|
| **NV23** | 24 | Wren | `talk` → `daosi` | Gặp Corran ở bìa rừng | Thornwood Reach | Ba trang `trang` sẵn có: Trụ Khoá thứ nhất · Thủ Hộ đóng nó xuống · **gỡ trụ thì vết nứt há thêm** | **H** bi kịch trung tâm được nói thẳng vào mặt người chơi ở cấp 24, **không** để tới cuối game · **N** `chon`: *"Vậy vẫn gỡ."* / *"Có cách nào khác không?"* |
| **NV24** | 25 | Corran | `kill` `phando` ×18 | Hạ 18 Bộ Xương Phản Loạn | Thornwood Reach | Chúng **từng là dân rừng của Corran**. Ông biết tên từng con | **N** Corran nhờ ngươi làm việc ông không làm nổi · **H** Chimera **giữ lại một phần trí nhớ** |
| **NV25** | 27 | Corran | `kill` `zb_cn1` ×1 | Hạ **Kẻ Đổi Phe** | Thornwood Reach | Rơi **Trang Nhật Ký Thủ Hộ**: *"Chúng ta bẻ vết nứt sang đó để cứu Vaeldra. Hôm nay ta mới biết bên đó có người ở. Bốn vạn người."* | **H** ⭐ **mảnh lớn nhất của cả game.** Người chơi biết chắc: đây **không phải tai nạn**, và phe mình đã biết mà vẫn làm |
| **NV26** | 30 | Corran | `kill` bất kỳ (đề xuất `xanu` ×1, nhưng **thật ra là mở Cốt**) ⚙ | Nhặt mảnh **Cốt Rễ Gai** đầu tiên | Thornwood Reach | Corran: *"Thứ này không mọc từ đất rừng ta. Cũng không phải đá của các ngươi."* | **C** ⭐ mở hệ Dòng Cốt và 4 ô Cốt của Chimera · **H** ⭐ **vật chất không thuộc về bên nào** — nền của cả lời giải §4 |
| **NV27** | 31 | Corran | `tpkill` `xanu` ×10 | Hạ 10 Chimera Phun Độc **bằng Trấn Phái** | Thornwood Reach | Độc của chúng ăn mòn cả đá — kể cả đá Vaeldra | **C** ⭐ ép dùng tuyệt chiêu; đây là chỗ duy nhất trong 120 cấp mà game **bắt** người chơi bấm nút thứ tư |
| **NV28** | 34 | Corran | `kill` `zb_cn3` ×1 | Hạ **Trưởng Lão Tha Hóa** | Thornwood Reach | *"Trụ Khóa này ghim ta — hay ghim cả Morvahn?"* | **H** câu hỏi mà cả chương IV–VIII xoay quanh, đặt bởi **nạn nhân**, không phải bởi NPC hướng dẫn |
| **NV29** | 36 | Corran | `kill` `duhiep1` ×3 | Hạ 3 Axie Lang Thang | Thornwood Reach | Chúng **không tấn công trước** (`aggro:0`). Corran không bảo ngươi giết — ông bảo ngươi **quyết định** | **N** ⭐ nhiệm vụ đạo đức đầu tiên có thật: người chơi được phép **bỏ qua** và chương vẫn đi tiếp (xem §8, V6) · **C** dạy PK và Tai Tiếng |
| **NV30** | 38 | Corran | `kill` `zb_cn4` ×1 | Hạ **Tướng Quân Thornwood Reach** | Thornwood Reach | **Trụ Thornwood gãy.** Rơi **Di Thư Người Gác Rừng**. `ta_chungnam = true` | **H+C** ⭐⭐ **Đây là nhiệm vụ quan trọng nhất trong nửa đầu game.** Vết nứt trên trời rộng thêm một nấc **nhìn thấy được**, và **mọi bãi quái trong game đông thêm 8%** (`game.js:1653`). Lần đầu tiên một quyết định cốt truyện đổi thẳng số liệu chiến đấu — và Corran đã báo trước ở NV23 |

> **Chỗ này phải có một dòng chữ trên màn hình.** Hiện `truDaGo()` chỉ đổi `#fx-crack` lặng lẽ
> và đổi `pk.n` mà không nói gì. Nếu người chơi không được nói *"thế giới vừa đông thêm 8% vì
> việc ngươi vừa làm"* thì cả bi kịch trung tâm chỉ tồn tại trong văn bản. Xem §7.2.

---

### Gian tấu A — **Khúc Trượt Thứ Nhất** · cấp 38–42 · lấp lỗ nhịp
*Giao bởi: Corran (nhắn) → làm ở bất kỳ vùng nào đã mở*

Thornwood hết ở 38, Hollow Roost mở ở 40 và bắt đầu ở 42. Bốn cấp trống. **Gian tấu không có
map riêng** — nó dùng đúng ba thứ đã có mà không phụ thuộc cấp: Rương Canh · Vỉa Cốt · Tầng Sâu.

| # | Cấp | Giao | `type` | Làm gì | Ở đâu | Hé lộ | Vì sao người chơi quan tâm |
|---|---:|---|---|---|---|---|---|
| **NV31** | 39 | Corran | `ruong` ⚙ `need:3` | Mở 3 **Rương Canh** ở bất kỳ vùng nào | 4 vùng đã mở | Trong rương là **đồ tiếp tế Vaeldra** — khẩu phần, băng gạc, một quyển sổ điểm danh. Tiểu đội canh nó **mặc giáp cùng loại với ngươi** | **C** ⭐ mở hệ Rương Canh (hiện **không có nhiệm vụ nào trỏ tới**) · **H** Đoàn Gloam có **hậu cần**, tức là có tổ chức, tức là **có người chỉ huy** |
| **NV32** | 41 | Corran | `via` ⚙ `need:2` | Khai 2 **Vỉa Cốt** ở hai vùng khác nhau | 2 trong 3 vùng hôm nay | Vỉa hôm nay không ở chỗ hôm qua. Corran: *"Đất nó trượt. Mỗi đêm một khúc."* | **C** ⭐ mở hệ Vỉa Cốt và **buộc người chơi đi tới một toạ độ** — thứ đầu tiên trong game làm được điều đó (`CLAUDE.md:270`) · **H** ⭐ **đây là chỗ người chơi tự nhìn thấy Chồng Lớp đang chuyển động** |

---

### Chương V — **Ổ Ấp** · Hollow Roost · cấp 42–56
*Giao bởi: Sylas, Người Giữ Tổ*

| # | Cấp | Giao | `type` | Làm gì | Ở đâu | Hé lộ | Vì sao người chơi quan tâm |
|---|---:|---|---|---|---|---|---|
| **NV33** | 42 | Corran | `talk` → `thumo` | Gặp Sylas trong ổ ấp | Hollow Roost | Ba trang sẵn: **Trụ Roost đóng thẳng xuống giữa ổ ấp**; khí Morvahn ngấm qua vỏ trứng; *"Chúng ta gọi chúng là Chimera vì phải gọi bằng một cái tên nào đó"* | **H** ⭐ **nguồn gốc của Chimera, nói bởi người đếm từng quả trứng.** Từ đây trở đi người chơi không thể giết Chimera mà không biết chúng từ đâu ra |
| **NV34** | 44 | Sylas | `kill` `thinu` ×20 | Hạ 20 Oan Hồn Ổ Ấp | Hollow Roost | Chúng là **hatchling chưa kịp nở**. Sylas không xin ngươi cứu — ông xin ngươi **làm nhanh** | **N** ⭐ nhiệm vụ "giết 20 con" duy nhất trong chuỗi mà **giết chính là lòng thương** |
| **NV35** | 46 | Sylas | `kill` `zb_cm2` ×1 | Hạ **Kẻ An Táng Bóng Tối** | Hollow Roost | *"Ta chôn hatchling suốt ba năm nay. Chôn không kịp nữa."* — hắn từng là **người của Sylas** | **N** Sylas không nói gì khi ngươi về. Câu `done` sẵn có: *"Ta đếm lại rồi. Vẫn còn một trăm chín mươi tư quả."* |
| **NV36** | 49 | Sylas | `kill` `mocnhan` ×15 | Hạ 15 Axie Golem | Hollow Roost | Golem ở đây **vẫn đang thi hành một mệnh lệnh cũ** — chúng xếp trứng thành hàng, đúng thứ tự, mỗi ngày | **H** ⭐ nối vào lore Axie chính thức C1 (Golemry) **mà không mượn một tên riêng nào**: golem là thợ, và thợ thì làm theo lệnh kể cả khi người ra lệnh đã chết |
| **NV37** | 52 | Sylas | `kill` `zb_cm4` ×1 | Hạ **Tướng Quân Hollow Roost** | Hollow Roost | **Trụ Roost gãy** (thứ hai). Rơi **Lệnh Điều Quân**: *"dồn quân về Ashen Steppe, đêm trăng tròn"* ⚠ (câu gốc ghi "Trụ Mộc", phải sửa) | **H** ⭐ lần đầu người chơi thấy **kế hoạch của phía bên kia**, và nó trỏ tới một vùng còn cách 30 cấp · **C** vết nứt nấc 2, quái +16% so với ban đầu |

---

### Gian tấu B — **Xuống Dưới Lớp Đá** · cấp 56–62
| # | Cấp | Giao | `type` | Làm gì | Ở đâu | Hé lộ | Vì sao người chơi quan tâm |
|---|---:|---|---|---|---|---|---|
| **NV38** | 58 | Sylas | `deep` ⚙ `need:10` | Xuống **Tầng Sâu** tới tầng 10 | Giếng Vực Sâu, Lunaris City | *"Đường nứt Thủ Hộ Vaeldra không kịp bịt, ăn thẳng xuống dưới lớp đá nền"* (`MAPS.deep.desc`). Càng sâu, **đất càng không giống đất của bên nào** | **C** ⭐ mở Tầng Sâu (hiện **không nhiệm vụ nào trỏ tới**, và nó là nội dung lặp lại tốt nhất đang có) · **H** ⭐ Chồng Lớp **không chỉ trải ngang, nó còn ăn xuống** |

---

### Chương VI — **Thung Lũng Bị Viết Lại** · Frostmire Vale · cấp 62–78
*Giao bởi: Liora, Ẩn Sĩ Frostmire*

Chương **lý thuyết** của cả game: đây là nơi lời giải §4 được nói ra bằng lời.

| # | Cấp | Giao | `type` | Làm gì | Ở đâu | Hé lộ | Vì sao người chơi quan tâm |
|---|---:|---|---|---|---|---|---|
| **NV39** | 62 | Sylas | `talk` → `ttmon` | Gặp Liora bên bếp lửa | Frostmire Vale | Ba trang sẵn: *"Băng ở đây không phải thời tiết. Nó là vết sẹo."* · **"đất Lunacia quanh nó đang bị viết lại thành đất Vaeldra"** | **H** ⭐⭐ **câu trả lời trung tâm được nói thành lời lần đầu.** Mọi thứ 62 cấp trước đó là bằng chứng cho câu này |
| **NV40** | 64 | Liora | `kill` `ttdetu` ×20 | Hạ 20 Kẻ Cuồng Tín Lạc Lối | Frostmire Vale | Chúng **thờ vết nứt**. Chúng là **người Lunacia** đã chọn phía bên kia | **H** ⭐ không phải ai bị Chimera hoá cũng là nạn nhân — **có người tự nguyện** |
| **NV41** | 67 | Liora | `via` ⚙ `need:3` | Khai đủ 3 Vỉa Cốt trong **cùng một ngày** | 3 vùng hôm nay | Liora chép lại toạ độ ba vỉa của ngươi rồi so với sổ của bà: **ba điểm hôm nay nằm trên một đường thẳng** | **C** ⭐ đây là nhiệm vụ duy nhất trong game **không hoàn thành được bằng tự đánh** — phải đi ba nơi trong một ngày thật · **H** ⭐ **Đường Khâu có hình dạng**, và nó đo được |
| **NV42** | 72 | Liora | `kill` `zb_tt4` ×1 | Hạ **Tướng Quân Frostmire Vale** | Frostmire Vale | **Trụ Frostmire gãy** (thứ ba). Rơi **Lá Thư Chưa Kịp Gửi** | **C** vết nứt nấc 3 · **N** câu `done` sẵn có của Liora: *"Ta chép xong dòng hôm nay rồi. Lần đầu tiên nó không phải là một dòng buồn."* — và người chơi biết bà nhầm |
| **NV43** | 76 | Liora | `kill` `satthuhy` ×12 | Hạ 12 Sát Thủ Sương Mù | Frostmire Vale | Chúng mang **huy hiệu Đoàn Gloam đời mới** — không phải lính đào ngũ nữa, mà **lính được tuyển** | **H** ⭐ Đoàn Gloam **đang lớn lên**. Ai tuyển? |

---

### Gian tấu C — **Bảng Đếm Của Người Khác** · cấp 78–84
| # | Cấp | Giao | `type` | Làm gì | Ở đâu | Hé lộ | Vì sao người chơi quan tâm |
|---|---:|---|---|---|---|---|---|
| **NV44** | 80 | Liora | `ruong` ⚙ `need:4` | Mở 4 Rương Canh ở **bốn vùng khác nhau** | 4 vùng | Bốn quyển sổ điểm danh, bốn nét chữ **giống hệt nhau**. Người viết ký tắt: **D.** | **H** ⭐⭐ mảnh bản lề: **một người duy nhất viết cả bốn**, và người đó biết vị trí kho ở cả bốn vùng · **C** đưa người chơi quay lại các vùng cũ có mục đích thật |

---

### Chương VII — **Bốn Nghìn Hai Trăm** · Ashen Steppe · cấp 84–100
*Giao bởi: Dax, Kẻ Do Thám*

| # | Cấp | Giao | `type` | Làm gì | Ở đâu | Hé lộ | Vì sao người chơi quan tâm |
|---|---:|---|---|---|---|---|---|
| **NV45** | 84 | Liora | `talk` → `noiung` | Bò tới chỗ Dax | Ashen Steppe | Ba trang sẵn: *"Ta đếm được bốn nghìn hai trăm quân. Ngươi có một người."* · Tướng Quân **ngồi trên Trụ Ashmark như ngồi ghế** | **H** quy mô thật của phía bên kia · **N** `chon`: *"Vậy thì đánh đúng một chỗ."* / *"Đưa ta bảng đếm."* |
| **NV46** | 86 | Dax | `kill` `cungthu` ×20 | Phá 20 Cung Thủ Tro Tàn | Ashen Steppe | Cung thủ ở đây **bắn thật** (`ranged:true`, tầm 230) — bãi đầu tiên phạt người đứng yên | **C** ⭐ ép rời chế độ tự đánh; đây là loài duy nhất trong game vốn đã đánh xa từ trước (`CLAUDE.md:222-224`) |
| **NV47** | 89 | Dax | `kill` `zb_mc3` ×1 | Hạ **Thống Lĩnh Tro Tàn** | Ashen Steppe | Trên xác: **lệnh điều quân có chữ ký**. Nét chữ **giống hệt bốn quyển sổ ở NV44** | **H** ⭐⭐ chuỗi chính và chuỗi phụ **chạm nhau lần đầu**: người viết sổ kho Gloam và người ký lệnh cho quân Morvahn **là một** |
| **NV48** | 94 | Dax | `kill` `kybinh` ×15 | Hạ 15 Kỵ Sĩ Tro Tàn | Ashen Steppe | Ngựa của chúng là **Tuấn Mã Hoang Outskirts** — bị bắt và mang đi cả nghìn dặm | **H** phía bên kia **lấy tài nguyên của Lunacia để đánh Lunacia** · **N** gọi lại NV18 (con ngựa ngươi từng bắt) |
| **NV49** | 100 | Dax | `kill` `zb_mc4` ×1 | Hạ **Tướng Quân Ashen Steppe** | Ashen Steppe | **Trụ Ashmark gãy** (thứ tư). Rơi **Bảng Tên Đội Tiên Phong**: bảy tên, **năm bị gạch**, cái thứ sáu là tên ngươi | **H** ⭐⭐⭐ **cú đấm của chương VII.** Ngươi đi 100 cấp để rồi biết tên mình đang nằm trên một danh sách người chết mà **có kẻ đã cầm nó trước ngươi** · **C** vết nứt nấc 4, quái +32% |

---

### Chương VIII — **Cửa Ải** · Stormgate Pass · cấp 102–120
*Giao bởi: Lão Tướng Brann*

| # | Cấp | Giao | `type` | Làm gì | Ở đâu | Hé lộ | Vì sao người chơi quan tâm |
|---|---:|---|---|---|---|---|---|
| **NV50** | 102 | Dax | `talk` → `laotuong` | Trình diện Brann | Stormgate Pass | Ba trang sẵn: **Brann gọi tên cả sáu người trước** · *"đường đó thông cả hai chiều"* | **N** ⭐ sáu chương được buộc lại thành một sợi. Đây là lý do bảy NPC được viết để **gọi tên nhau** (`game.js:21070`) |
| **NV51** | 104 | Brann | `talk` → `quachtinh` | Quay về hỏi Rell **một câu** | Lunaris City | Rell trả lời câu ngươi đã chọn ở **NV10**, sau 94 cấp | **N** ⭐⭐ nhiệm vụ **không có chiến đấu, không có thưởng vật phẩm**, chỉ có một câu trả lời. Đây là chỗ chứng minh chuỗi này có trí nhớ |
| **NV52** | 106 | Brann | `kill` `cuongbinh` ×25 | Giữ phòng tuyến — hạ 25 Cuồng Binh | Stormgate Pass | Brann: *"Ta không cần ngươi thắng, ta cần ngươi còn đứng khi trời sáng"* (câu `active` sẵn có) | **C** trận thủ dài nhất game · **N** Brann **đánh cùng ngươi**, không đứng nhìn |
| **NV53** | 109 | Brann | `kill` `zb_nm3` ×1 | Hạ **Tướng Quân Cửa Ải** | Stormgate Pass | Rơi **Mật Lệnh Rách**: *"…khi đủ năm trụ gãy, Vết Nứt mở toang — Morvahn bước qua, Lunacia thành lò luyện."* | **H** ⭐ người chơi biết **chính xác** hậu quả của việc mình sắp làm, **trước khi làm** |
| **NV54** | 114 | Brann | `kill` `daokhach` ×20 | Hạ 20 Axie Cuồng Bão | Stormgate Pass | **Chúng là Axie.** Không phải Chimera, không phải Gloam. Axie Lunacia, chiến đấu vì Morvahn vì hắn hứa **đóng vết nứt lại** | **H** ⭐⭐ cú vặn cuối: phía bên kia **cũng đang cứu Lunacia**, chỉ bằng cách khác. Đây là chỗ biến kết mở từ "chọn ở lại hay chạy" thành một câu hỏi thật |
| **NV55** | 118 | Brann | `talk` → `laotuong` | Trả lời câu hỏi cuối của Brann | Stormgate Pass | `chon` sẵn có: *"Tôi tỉnh táo."* / *"Sáu người kia sẽ nói gì?"* | **N** ⭐ lựa chọn cuối, và Brann **không cản** — ông chỉ muốn ngươi gỡ trụ **trong lúc còn tỉnh táo, chứ không phải trong lúc đang giận** |
| **NV56** | 120 | Brann | `kill` `zb_nm4` ×1 | Hạ **Tướng Quân Stormgate Pass** | Stormgate Pass | **Trụ Stormgate gãy** — trụ thứ năm. `ketMo = true` → **Kết Mở** | **H+C+N** ⭐⭐⭐ vết nứt nấc 5, quái +40%, trời tối nhất, `showKetMo()` chạy. Người chơi **tự tay mở cánh cửa Morvahn cần** — và đã được cảnh báo bởi Corran ở cấp 24, bởi Brann ở cấp 118, và bởi một mẩu giấy ở cấp 109 |

> **Đếm lại cho khớp:** 56 mục đánh số nhưng NV11 là nhánh nối tiếp NV10 tại cùng NPC ⇒
> **52 mục dữ liệu** trong `QUESTS` nếu gộp NV10+NV11, hoặc 56 nếu tách. Tôi khuyến nghị
> **tách** — The Calling xứng đáng một mục riêng trong Nhật Ký.

### 5.1 Bảng kiểm — chuỗi này có "ý nghĩa" thật không?

| Chỉ số | Số | Ghi chú |
|---|---:|---|
| Tổng nhiệm vụ chính | **52–56** | so với 35 của chuỗi cũ |
| Mang mã **H** (đổi hiểu biết) | 41 | |
| Mang mã **C** (đổi cách chơi) | 22 | |
| Mang mã **N** (đổi quan hệ) | 17 | |
| Nhiệm vụ **chỉ** là "giết N con" không kèm H/C/N | **0** | luật ở §5.0 |
| Nhiệm vụ có **lựa chọn** được nhắc lại về sau | 4 | NV10→NV51 · NV23 · NV45 · NV55 |
| Hệ thống được một nhiệm vụ chính **mở lần đầu** | 8 | thảo dược · rèn · The Calling · Thú Cưỡi · Cốt · Trấn Phái · Rương Canh · Vỉa Cốt · Tầng Sâu |
| Cấp có nhiệm vụ, trong 120 cấp | 1–120 **liên tục**, không lỗ > 6 cấp | ba lỗ nhịp 38–42 · 56–62 · 78–84 được ba gian tấu lấp |
| Vùng có nhiệm vụ | **7/7 vùng ngoài trời** + Lunaris City + Tầng Sâu | |
| NPC dẫn chương được dùng | **7/7** | không ai tắt sau chương của mình: Corran giao NV31–32, Sylas giao NV38, Liora giao NV44 |

---

## 6. Chuỗi nhiệm vụ phụ giải mã nguồn gốc vùng đất

### 6.0 Vì sao đây phải là chuỗi PHỤ, không phải chính

Chính tuyến trả lời câu *"ta phải làm gì"*. Chuỗi này trả lời câu *"chuyện gì đã xảy ra ở đây"* —
và câu thứ hai **chỉ có nghĩa nếu người chơi tự đi tìm**. Nếu chính tuyến ném thẳng lời giải vào
mặt thì nó thành một đoạn phim; nếu người chơi ghép được từ mười mảnh rải trên bảy vùng thì nó
thành **cái họ tự hiểu ra**.

**Máy đã có sẵn**, không phải dựng: `SIDE_QUESTS[].clue` trao manh mối **ngay lúc NHẬN**
(`acceptSide()`), Nhật Ký có tab **🔍 Manh Mối** in `name` + `desc` từng mẩu (`renderQlog()`,
nhánh `story`), và trần **3 phụ tuyến active** ép người chơi chọn.

**Ba luật của chuỗi này:**
1. **Một mảnh = một vật cầm được**, không phải một đoạn văn. Người chơi phải *mang nó đi* suốt
   nhiệm vụ (đó chính là lý do máy trao clue lúc nhận).
2. **Không mảnh nào tự nó nói ra lời giải.** Mảnh thứ mười cũng không. Lời giải chỉ hiện khi
   **đủ chín mảnh** — và nó hiện trong Nhật Ký, không phải trong lời NPC.
3. **Mỗi mảnh nằm ở một vùng khác nhau**, và ít nhất bốn mảnh **không giết được** (mở rương ·
   khai vỉa · xuống Tầng Sâu · hái thuốc). Đây là chỗ chuỗi phụ dạy người chơi rằng thế giới có
   thứ để làm ngoài việc giết.

---

### 6.1 Chuỗi **«Đọc Đường Khâu»** — 10 mảnh, 7 vùng

| # | Mã đề xuất | Cấp | Nhận ở | `type` | Việc | **Mảnh chứng cứ** (tên + nó hé lộ gì) |
|---|---|---:|---|---|---|---|
| **P1** | `dk_vo_trung` | 6 | Dược Sư · Petalshade Isle | `collect` `herbMap:'daohoa'` ×6 | Hái 6 khóm ở **rìa đảo** | **Mảnh Vỏ Hai Màu** — một mảnh vỏ trứng Axie, **một nửa trắng ngà, một nửa xám thép**. Đường ranh giữa hai màu **thẳng như kẻ**. Dược Sư: *"Không có con vật nào nở ra làm hai màu như thế cả."* |
| **P2** | `dk_cot_moc` | 16 | Trại Chủ Mục Đồng · Outskirts | `catch` ⚙ ×1 | Bắt một Tuấn Mã Hoang ở **góc đông nam** | **Cột Mốc Đo Đất** — cọc thép đóng xuống đồng, khắc `II / 4.2` và một mũi tên. Ngựa hoang đi vòng qua nó từ ba tháng nay. *Nó không phải cột mốc của Lunacia — chữ số là chữ Vaeldra.* |
| **P3** | `dk_nhat_ky` | 27 | Corran · Thornwood Reach | `kill` `bandao` ×10 | Hạ 10 Axie Sa Ngã canh khu rừng cháy | **Nhật Ký Thủ Hộ — Trang Đầu** *(tái dùng `co_thu`)*: *"Chúng ta bẻ vết nứt sang đó để cứu Vaeldra. Hôm nay ta mới biết bên đó có người ở. Bốn vạn người."* Chữ ký ở cuối trang: **ALDREC** |
| **P4** | `dk_o_ap` | 45 | Sylas · Hollow Roost | `kill` `huyetbat` ×15 | Hạ 15 Dơi Chimera đang rút trứng | **Quả Trứng Nhớ Hai Bầu Trời** — quả trứng chưa nở duy nhất Sylas dám đưa cho ngươi. Áp tai vào thì nghe **hai nhịp**, lệch nhau nửa nhịp. Sylas: *"Nó không hỏng. Nó chỉ có hai."* |
| **P5** | `dk_so_ke` | 47 | Corran (nhắn) · bất kỳ vùng nào | `ruong` ⚙ ×2 | Mở 2 Rương Canh | **Sổ Điểm Danh Tiểu Đội** — danh sách 4 tên lính Gloam, gạch dần. Cuối sổ, cùng một nét chữ khác hẳn, ghi: *"Kho 2/4. Toạ độ đã báo. — D."* |
| **P6** | `dk_ban_chep` | 66 | Liora · Frostmire Vale | `via` ⚙ ×2 | Khai 2 Vỉa Cốt | **Bản Chép Ba Mươi Ngày** — sổ của Liora, ba mươi trang, mỗi trang một tấm bản đồ nhỏ chấm ba điểm. Xếp chồng ba mươi tấm lên nhau thì **ba mươi bộ ba điểm ấy vẽ ra năm đường**, và **năm đường đó chụm vào năm chỗ** |
| **P7** | `dk_loi_khau` | 80 | Liora (nhắn) · Tầng Sâu | `deep` ⚙ `need:15` | Xuống Tầng Sâu tới tầng 15 | **Lõi Khâu** — một khối Cốt to bằng nắm tay, **không thuộc Dòng nào trong bảy Dòng**. Nó ấm. Nó ấm hơn khi ngươi đứng gần một Trụ Khoá |
| **P8** | `dk_chuong` | 90 | Dax · Ashen Steppe | `kill` `thamtu` ×20 | Hạ 20 Trinh Sát Tro Tàn quanh đại bản doanh | **Ashmark Bell** — cái chuông đồng Thủ Hộ dùng để **đo đất**: gõ một tiếng, đếm bao lâu tiếng vọng về. Ở đây tiếng vọng về **hai lần**. Dax: *"Ta nằm đây ba năm. Tưởng đó là tiếng vách đá."* |
| **P9** | `dk_quan_lenh` | 105 | Brann · Stormgate Pass | `kill` `kylan` ×15 | Hạ 15 Chó Ngao Lửa ở chân ải | **Quân Lệnh Cũ** *(tái dùng `co_lenh`)* — *"Stormgate Pass thất thủ thì cả Lunacia mở toang."* Dấu triện **sáu mươi năm tuổi**, cũ hơn cuộc giao thoa rất nhiều. Brann: *"Ta nhận lệnh này lúc mười chín tuổi."* |
| **P10** | `dk_ket` | 112 | Liora (nhắn) · bất kỳ đâu | `talk` → `ttmon` | Mang **đủ chín mảnh** về cho Liora | **Không có mảnh thứ mười.** Liora xếp chín mảnh lên bàn và **im lặng**. Nhật Ký mở khoá mục **«ĐƯỜNG KHÂU — kết luận»** |

#### Chín mảnh ghép ra cái gì

Bản kết luận ghi vào Nhật Ký khi đủ chín mảnh — đây là **văn bản người chơi đọc**, không phải
ghi chú thiết kế:

> **P1 + P4** — có những sinh vật ở đây **có hai bản**, chồng lên nhau, không hỏng.
> **P2 + P8** — có người **đo đất Lunacia** bằng dụng cụ Vaeldra, và ở chỗ được đo, tiếng vọng
> về **hai lần**. Đất ở đây **dày gấp đôi**.
> **P3** — Thủ Hộ **Aldrec** bẻ vết nứt sang đây, biết bốn vạn người sống ở đây, và vẫn làm.
> **P6 + P7** — Vỉa Cốt đổi chỗ mỗi đêm không phải ngẫu nhiên: ba mươi ngày chấm điểm vẽ ra
> **năm đường chụm vào năm chỗ**, và năm chỗ đó là **Năm Trụ Khoá**. Cái **Lõi Khâu** ấm lên
> khi tới gần trụ. ⇒ **Trụ không giữ vết nứt. Trụ giữ hai thế giới khỏi trượt khỏi nhau.**
> **P9** — Lunacia **đã có chiến tranh trước khi Vaeldra tới**, sáu mươi năm trước, và Stormgate
> Pass được dựng cho cuộc chiến đó. ⇒ vết nứt không tạo ra bảy vùng này từ hư không: nó **đè lên
> một thế giới vốn đã có sẵn lịch sử của nó**.
> **P5** — và một người tên tắt **D.** biết vị trí mọi kho, mọi trụ, ở cả bốn vùng.
>
> **Kết luận:** đất ngươi đang đi **không phải đất mới**. Nó là **hai mảnh đất cũ chồng lên
> nhau**, ghim bằng năm cái đinh. Mỗi đinh ngươi rút, hai mảnh trượt thêm một khúc — và **Cốt
> trong túi ngươi là chỗ hai mảnh dính vào nhau, vỡ ra**.

### 6.2 Chuỗi **«Năm Cái Tên Bị Gạch»** — 6 mảnh, trả lời câu "ai là D."

Chuỗi thứ hai, ngắn hơn, chạy song song và **kết sau** chuỗi P. Nó dùng **nguyên vẹn** năm mẩu
`td_*` đã có trong `canbang.js:927-938` — không viết mới một chữ nào cho bốn mẩu đầu.

| # | Mã | Cấp | Nhận ở | Mảnh | Nó nói gì |
|---|---|---:|---|---|---|
| **T0** | `td_bang` | 100 | rơi từ NV49 (chính tuyến) | `lenh_bai_doi` **Bảng Tên Đội Tiên Phong** | Bảy tên. Năm bị gạch. Cái thứ sáu là tên ngươi |
| **T1** | `td_1` | 101 | Corran · Thornwood | `td_giap` **Bộ Giáp Đứng Nguyên** | **HALLA** — giáp dựng đứng, khoá đai còn cài, không một vết chém, bên trong trống không |
| **T2** | `td_2` | 103 | Sylas · Hollow Roost | `td_nhatky` **Nhật Ký Viết Dở** | **MEV** — sáu trang nhạt dần, trang cuối *"không còn là chữ người"* |
| **T3** | `td_3` | 106 | Liora · Frostmire | `td_huyhieu` **Huy Hiệu Gỡ Từ Xác** | **ORIN** — hắn nhận ra ngươi trước khi ngã, **và vẫn không dừng tay** |
| **T4** | `td_4` | 109 | Dax · Ashen Steppe | `td_bia` **Bia Tự Khắc** | **SERR** — *"TA DỪNG Ở ĐÂY TRONG LÚC CÒN LÀ TA"* |
| **T5** | `td_5` | 116 | Brann · Stormgate | `td_trong` **Chỗ Trống** | Không có gì cả. Không giáp, không xác, không bia |

**Kết luận chuỗi T** (mở khoá khi đủ 6 mảnh, đọc trong Nhật Ký):

> Năm cái tên bị gạch. Bốn cái có chỗ nằm: HALLA · MEV · ORIN · SERR.
> Cái thứ năm là **DRUE**, và ở chỗ tên hắn, **không có gì cả**.
> Hắn là người vẽ bản đồ của đội. Hắn mang theo **tấm bản đồ ghi vị trí năm Trụ Khoá**.
> Không ai gạch tên hắn. **Hắn tự gạch.**
>
> Đó là câu trả lời cho một câu hỏi mà không ai trong bảy người kia hỏi thành lời:
> **làm sao Tướng Quân của Morvahn tìm ra cả năm cái trụ, khi chính người Lunacia còn không
> biết chúng ở đâu?**
>
> Và chữ ký tắt trên bốn quyển sổ kho Gloam — **D.** — không phải trùng hợp.

**Vì sao chuỗi này quan trọng với người chơi:** nó là sợi dây **duy nhất** nối nhân vật chính
với quá khứ của chính mình (chú thích trong `canbang.js:929-933` đã nói đúng điều đó và đã bỏ
lửng nó suốt 100 cấp). Và nó biến **Đoàn Gloam** từ "bọn cướp ở map 1" thành **hậu quả trực
tiếp của một người trong đội ngươi**.

### 6.3 Ba chuỗi phụ nhỏ khác — dạy hệ thống, không dạy lore

Trần 3 phụ tuyến active nghĩa là hai chuỗi trên đã ăn gần hết. Ba chuỗi dưới là **nội dung nền**,
mỗi cái đúng một nhiệm vụ, dùng đúng `sideOnEvent` đã có sẵn:

| Mã | Cấp | `type` (đã có) | Dạy gì | Câu lore một dòng |
|---|---:|---|---|---|
| `hs_chaos` | 12 | `chaos` | Lò Hỗn Độn | Thợ Rèn: *"Ba món cùng giai ném vào lửa thì ra một món giai trên. Ta không giải thích được. Lò rơi qua vết nứt, nó về đây khác đi rồi."* |
| `hs_shard` | 20 | `shard` | Quầy Shard / nới túi | Thương Nhân Vận May: *"Shard không mua được sức mạnh. Nó chỉ mua được chỗ để mang."* |
| `hs_catch` | 16 | `catch` | Thú Cưỡi | (gộp với P2 — xem §6.1) |

---

## 7. Chỗ nối vào hệ thống đã có

### 7.1 Bảng nối — nhiệm vụ nào treo vào hệ nào

| Hệ đang chạy | Ở đâu | Nhiệm vụ treo vào | Nó được cái gì |
|---|---|---|---|
| **Năm Trụ Khoá** (`TRU_KHOA`, `truDaGo()`) | `game.js:22042-22054` | NV30 · NV37 · NV42 · NV49 · NV56 | Năm mốc chương = năm trụ. **Không cần thêm cờ nào** — `ta_<map>` đã tự bật khi hạ Tướng Quân (`game.js:9023`) |
| **Bảy Dòng Cốt** (`COT_DONG`) | `game.js:4317` | NV26 (mở hệ) · P6 · NV32 · NV41 | Cốt ngừng là "vật liệu nâng Chimera" và thành **bằng chứng vật lý của lời giải §4** |
| **Vỉa Cốt** (`viaHomNay()`) | `game.js:4570-4640` | NV32 (2 vỉa) · NV41 (3 vỉa **cùng ngày**) · P6 | Hệ này hiện **không có một nhiệm vụ nào trỏ tới**. NV41 là nhiệm vụ duy nhất trong game không tự đánh được — đúng mục đích thiết kế của Vỉa Cốt |
| **Rương Canh** (`ruongCuaMap()`) | `game.js:4678-4740` | NV31 (3 rương) · NV44 (4 vùng) · P5 | Cũng **chưa có nhiệm vụ nào trỏ tới**. Bốn con canh đủ 4 vai trở thành **bằng chứng có tổ chức**, và bốn quyển sổ là bản lề của chuỗi T |
| **Tầng Sâu** (`deepStart()`, `MAPS.deep`) | `game.js` khu DEEP | NV38 (tầng 10) · P7 (tầng 15) | Chồng Lớp **ăn xuống**, không chỉ trải ngang. Lore đã viết sẵn ở `MAPS.deep.desc` |
| **Vệ Binh Trụ / Cổng Vực** (`BOSS_DEFS`, `tranAiSeal()`) | `canbang.js:137` · `game.js:2344` | 14 nhiệm vụ `kill zb_*` | Vòng phong ấn 342px đòi hạ đủ 3 Vệ Binh — **luật gác tự nhiên** cho tiến độ chương, **không cần `reqMain`** |
| **Manh mối** (`CLUES` · `CLUE_DROPS`) | `canbang.js:916` · `game.js:22021` | 15 mẩu rơi từ boss + 10 mẩu trao khi nhận phụ tuyến | 22 mẩu đang rơi rời rạc, không mẩu nào thuộc về một chuỗi. §6 gom chúng thành **hai chuỗi có kết luận** |
| **The Calling** (cấp 10) | `game.js:8958` · `23017` | NV11 | Hiện chỉ là một dòng toast lúc lên cấp 10. Thành một nhiệm vụ có tên |
| **Truy Nã Lệnh** (`TRUYNA_BANDS`) | `game.js:5873` · `24090` | **không treo nhiệm vụ nào** | Cố ý: nó là nội dung ngày, không phải cốt truyện. **Nhưng nó đang là đường duy nhất vào 3 vùng cuối** — xem M8 |
| **Vực Thẳm** (`talk:'tenui'`) | `game.js:21205-21213` | **không treo** | Ba câu lore đã đúng hướng ("đất nứt vì cái trụ ở gần đó") — để nguyên, đừng bắt người chơi nhảy vì nhiệm vụ |

### 7.2 Ba chỗ phải HIỆN RA cho người chơi thấy, nếu không thì lore chỉ là văn bản

| Chỗ | Hiện đang | Phải thành |
|---|---|---|
| **+8% quái mỗi trụ** (`game.js:1653`) | im lặng tuyệt đối | Sau NV30/37/42/49/56: một dòng banner *"Vết nứt há thêm một khúc — mọi bãi săn trên thế giới vừa đông thêm 8%."* Đây là **cả bi kịch trung tâm gói trong một dòng chữ** |
| **Vết nứt 5 nấc** (`#fx-crack`) | đổi lặng lẽ | Kèm một nhịp rung màn hình + âm thanh ở đúng khoảnh khắc trụ gãy |
| **Nhật Ký tab 🔍 Manh Mối** | in danh sách phẳng | Chia **hai nhóm có tiêu đề** («Đường Khâu» 9/9 · «Năm Cái Tên» 6/6) + **mục kết luận** mở khoá khi đủ. Bộ đếm `clues.length/Object.keys(CLUES).length` đã có sẵn |

### 7.3 Máy cần mở rộng — bốn `type` mới, mỗi cái vài dòng

Đây là **toàn bộ** phần mã phải viết thêm. Không có hệ thống mới nào.

| `type` mới | Móc vào đâu | Ước lượng | Ghi chú |
|---|---|---:|---|
| `ruong` | thêm `sideOnEvent('ruong')` + nhánh đếm trong hàm mở rương (`game.js` khu 4720–4780) | ~4 dòng | Cả chính tuyến lẫn phụ tuyến dùng chung |
| `via` | thêm `sideOnEvent('via')` trong nhánh Khai Vỉa Cốt (`game.js` khu 4545–4560) | ~4 dòng | NV41 cần biến thể "3 vỉa **cùng một ngày**" ⇒ đếm theo `player.via.day` |
| `deep` | thêm `sideOnEvent('deep')` khi vào một tầng mới trong `updateDeep`/`deepNext` | ~4 dòng | `need` = số tầng |
| `catch` | **đã có** (`game.js:9685`) | 0 | Chỉ chính tuyến chưa dùng — `questTarget()` đã hỗ trợ `sq.type === 'catch'` |

Ngoài ra, **hai nhánh cần thêm trong `questOnKill`/`questTarget`** để chính tuyến (không chỉ phụ
tuyến) đọc được `ruong`/`via`/`deep` — hiện `questProg` chỉ tăng ở `kill`/`tpkill`/`boss`
(`game.js:8968-8979`). Ước lượng ~10 dòng.

### 7.4 Bốn thứ tôi CỐ Ý không đề xuất

| Không làm | Vì sao |
|---|---|
| **Cắm lại `reqMain` vào `MAPS`** | `CLAUDE.md:259-262` — nhiệm vụ hỏng thì map mất. Thứ tự chương đã trùng thứ tự `md.min`, không cần khoá kép |
| **Hệ "danh vọng" / "phe phái" mới** | Bốn `chon` a/b đã đủ làm lựa chọn có nghĩa mà không cần một thanh chỉ số. Thêm thanh là thêm bảng, thêm lưu, thêm cân bằng |
| **Vùng đất thứ tám cho lore** | `CLAUDE.md:75-96` — thêm map là làm nặng đúng cái bệnh nhân bản. Ba gian tấu dùng **đất đã có** |
| **Một hệ "mảnh ký ức" riêng** | `CLUES` đã là đúng hệ đó, đã có bảng, đã có tab Nhật Ký, đã có 22 mẩu viết sẵn. Dựng cái thứ hai là chia đôi nội dung |

---

## 8. Việc còn nợ / rủi ro / chỗ chủ dự án phải quyết

### 8.1 ⚠ Rủi ro cần chủ dự án quyết, xếp theo mức

| Mã | Rủi ro | Vì sao nghiêm trọng | Đề xuất |
|---|---|---|---|
| **R1** | **"Lunacia" là tên riêng của Sky Mavis và đang nằm khắp text người chơi thấy** — bảng Bản Đồ (*"Bản Đồ Lunacia"*), `INTRO_PAGES`, `MAPS.nhanmon.desc`, lời bảy NPC, `showKetMo()`, `docs/THUAT_NGU.md` liệt nó là "danh từ riêng giữ nguyên". "Atia" cũng nằm trong danh sách đó | Quy tắc số 2 cấm tên riêng MU Online vì lý do phát hành. **Cùng lý do đó áp cho tên riêng Axie còn mạnh hơn**, vì đây là IP của chính công ty. Nếu game dự định phát hành như IP gốc thì đây là rủi ro lớn nhất còn tồn tại — và **chưa từng được nêu trong `CLAUDE.md`** | **Chủ dự án phải quyết.** Ba đường: (a) giữ, vì dự án là tribute nội bộ Sky Mavis và có quyền; (b) đổi hết sang một tên gốc; (c) giữ "Lunacia" như ngoại lệ đã duyệt kiểu "Box Kundun" và **gỡ "Atia"** khỏi `THUAT_NGU.md` (Atia hoàn toàn không xuất hiện trong game — bỏ nó không tốn gì) |
| **R2** | **Ba vùng cuối chỉ vào được bằng Truy Nã Lệnh** (M8) | Người chơi cấp 45 mở bảng Bản Đồ thấy Hollow Roost "đã đủ điều kiện" nhưng **không có nút Dịch Chuyển** và không có cổng nào trên bản đồ. Đây là ngõ cụt im lặng | Chuỗi ở §5 chữa được (NV33/NV45/NV50 là `talk` → `goQuest()` gọi `travelTo()` ⇒ mở `wpUnlocked`). **Nhưng phải chữa cả trường hợp người chơi bỏ chính tuyến**: thêm 3 cổng vật lý, hoặc cho `wpUnlocked` mở theo cấp |
| **R3** | **Trụ Khoá có hai bộ tên đang cùng chạy** (M1) | Lời thoại Tướng Quân nói "Trụ Thủy / Trụ Mộc / Trụ Kim" trong khi Nhật Ký in "Trụ Thornwood / Roost / Frostmire / Ashmark / Stormgate". Người chơi không đếm nổi mình đang ở trụ thứ mấy — **đúng cái lỗi mà chú thích ở `game.js:22037` nói là lý do đổi tên** | Sửa 4 chuỗi trong `BOSS_LORE` (`ng4`, `cn3`, `cn4`, `cm4`, `mc4`) và 1 trong `CLUES.phuc_lanh`. Đây là **việc nhỏ nhất trong bảng này và cũng cấp bách nhất** |
| **R4** | **Bảng Tên Đội Tiên Phong không cộng ra số nào** (M4) | Rell nói "bảy người" và "sáu người theo ta"; `lenh_bai_doi` nói bảy tên, năm gạch, cái thứ sáu là ngươi; nhưng chỉ có bốn mẩu có tên và mẩu thứ năm tự gọi mình là "thứ bảy" | **Tôi đã chọn một cách đọc ở §6.2 và nó là PHỎNG ĐOÁN:** bảy tên = Rell(1) + năm người chết (HALLA·MEV·ORIN·SERR·**DRUE**) + ngươi(6)… vẫn dư một chỗ. **Cách duy nhất khớp trọn:** đổi `td_trong` từ *"Chỗ Trống Thứ Bảy"* thành *"Chỗ Trống Thứ Năm"*, tên thứ bảy là **RELL** (chưa bị gạch vì còn sống). Cần chủ dự án gật |
| **R5** | **Kết mở kết thúc ở cấp 120 và không có gì sau đó** | `docs/VUNG_VO_AN_ENDGAME.md` đã chốt MAX_LV 120→400 + 3 map mới. Chuỗi ở §5 dừng đúng ở 120 | Chuỗi này **cố ý dừng ở Kết Mở**. Khi vùng endgame vào, cần **Chương IX+** với một câu hỏi khác: *"Morvahn đã bước qua. Giờ thì sao?"* Không nên thiết kế trước khi map đó có hình |
| **R6** | **Hung Thần vs Morvahn** (M6) | `CLAUDE.md:358` nói Hung Thần **không phải** Morvahn, nhưng "Hung Thần Giáng Thế" xuất hiện 6 lần/ngày còn Morvahn được mô tả là thứ sắp bước qua. Người chơi sẽ nhầm | Đề xuất: đổi tên sự kiện `MATON` thành một tên **không có chữ "Thần"** để tách hẳn — nhưng đây là chữ người chơi đã quen. **Cần quyết** |

### 8.2 Chỗ tài liệu này ĐANG ĐOÁN — nói thẳng

| # | Chỗ đoán | Mức chắc chắn |
|---|---|---|
| **Đ1** | **Toàn bộ §4 là sáng tác của tôi.** Canon hiện có nói "vết nứt", "Trụ Khoá ghim miệng nứt", "đất bị viết lại". Nó **chưa bao giờ** nói hai thế giới chồng lên nhau, chưa bao giờ giải thích Cốt là gì, chưa bao giờ giải thích Vỉa Cốt hay Rương Canh. "Đất Chồng Lớp" · "Đường Khâu" · "Lõi Khâu" **là do tôi đặt** | Suy luận từ dữ liệu, **không phải canon** |
| **Đ2** | **Thủ Hộ Aldrec** và **DRUE** là tên tôi bịa. Canon chỉ có "Thủ Hộ Vaeldra" (số nhiều, vô danh) và bốn tên trong `td_*` | Bịa hoàn toàn |
| **Đ3** | **"Sáu mươi năm trước Lunacia đã có chiến tranh"** — tôi suy ra từ đúng hai chi tiết: dấu triện 60 năm trên `co_lenh` và câu của Brann. Không có nguồn thứ ba | Suy luận từ 2 điểm dữ liệu |
| **Đ4** | **Rương Canh = kho tiếp tế Đoàn Gloam.** Code chỉ nói "4 con canh, 4 vai, mở một lần". Việc gán chúng cho Gloam là tôi chọn — nó khớp đẹp ở 2 vùng đầu nhưng **Petalshade Isle cấp 1 cũng có 4 rương**, mà Gloam ở đó mới chỉ là "tay sai" | Khớp 5/7 vùng, gượng ở 2 |
| **Đ5** | **NV54 "Axie Cuồng Bão chiến đấu vì Morvahn hứa đóng vết nứt lại"** — cú vặn cuối này hoàn toàn mới, không có mẩu lore nào đang có hé ra nó | Bịa hoàn toàn, **nhưng là thứ tôi tin đáng giá nhất trong cả tài liệu** |
| **Đ6** | **Số liệu Axie chính thức ở §2 là trích dẫn GIÁN TIẾP.** Proxy chặn `axieinfinity.com`, `blog.axieinfinity.com`, `axie-infinity.fandom.com`. Tôi không đọc được toàn văn nguồn nào trong ba nguồn đó | Cần kiểm lại bằng máy không bị chặn trước khi trích vào tài liệu đối ngoại |
| **Đ7** | **Mâu thuẫn A3 vs A4 trong lore Axie chính thức** (Chimera sinh **ra từ** Atia bị tha hoá vs Chimera **đầu độc** Atia) — tôi không giải quyết được, hai câu cùng trỏ về `axieinfinity.com/lore`. **Nếu chính lore gốc còn tự đá nhau ở điểm này thì ta càng không nên bám vào Atia** | Mâu thuẫn có thật ở nguồn |
| **Đ8** | **Số cấp trong bảng §5 là ước lượng.** Tôi bám `md.min` và `range` thật, nhưng không mô phỏng đường cong EXP. `docs/NHIP_CAP_1_120.md` nói từ cấp 60 mục tiêu là **≈1 giờ/cấp** ⇒ chương VI–VIII trải trên ~60 giờ chơi. Mật độ nhiệm vụ ở đó có thể quá thưa | Cần kiểm bằng chơi thử |

### 8.3 Việc còn nợ — xếp theo thứ tự nên làm

| # | Việc | Vì sao trước | Chi phí |
|---|---|---|---|
| **V1** | **Chốt R1 (Lunacia/Atia)** | Nếu phải đổi tên thế giới thì mọi văn bản trong tài liệu này phải viết lại. Đây là câu hỏi chặn | 1 quyết định |
| **V2** | **Sửa R3 (hai bộ tên Trụ Khoá)** | 6 chuỗi, không đụng cơ chế nào. Làm ngay được | ~15 phút |
| **V3** | **Gỡ `BOSS_ARENA` + `spawnBoss()` + tên "Sát Đài"** (M7) | Nội dung chết + tàn dư kiếm hiệp vi phạm Quy tắc 1. `zb_dh4` đã gánh vai trùm đảo | ~30 phút |
| **V4** | **Chốt R4 (Bảng Tên)** | Chuỗi §6.2 treo vào nó | 1 quyết định |
| **V5** | **Viết 4 `type` mới** (§7.3) | Không có chúng thì 8 nhiệm vụ trong §5 và 4 mảnh trong §6 không cắm được | ~1 phiên |
| **V6** | **Quyết NV29 có thật sự bỏ qua được không** | Tôi thiết kế nó là "nhiệm vụ đạo đức bỏ qua được", nhưng máy hiện tại **không có khái niệm nhiệm vụ bỏ qua được** — `questIdx` chỉ tiến khi trả xong. Hoặc thêm nút "Từ chối", hoặc bỏ tính chất đó và ghi lại cho trung thực | 1 quyết định + ~1 phiên |
| **V7** | **Thêm 3 cổng vật lý hoặc mở `wpUnlocked` theo cấp** (R2) | Chữa ngõ cụt im lặng cho người chơi bỏ chính tuyến | ~1 phiên |
| **V8** | **Bổ sung `HERB_SPOTS` cho 5 vùng còn lại** (M10) | Mở `type:'collect'` cho cả chuỗi thay vì chỉ 2 map đầu; cũng lấp đúng chỗ `docs/NGHIEN_CUU_GENSHIN.md` §0 chỉ ra: *"từ cấp 24 trở đi, ngoài trời KHÔNG CÓ GÌ ngoài quái"* | ~1 phiên |
| **V9** | **Gỡ "Atia" khỏi `docs/THUAT_NGU.md`** danh sách danh từ riêng giữ nguyên | Atia **không xuất hiện ở đâu trong game**. Để nó trong bảng thuật ngữ là mời người sau dùng nó | ~2 phút |
| **V10** | **Đổi tên `docs/LORE_BIBLE.md`** thành `LORE_BIBLE_DA_BO.md` (M11) | Nó là tệp duy nhất có chữ "Lore" trong tên và nội dung đã sai hoàn toàn | ~2 phút |
| **V11** | **Đối chiếu lại §2 bằng máy không bị chặn proxy** (Đ6) | Trước khi bất kỳ câu nào ở §2 được trích vào tài liệu đối ngoại | ~1 giờ |
| **V12** | **Quyết chuyện chín lớp Axie vs năm hệ nguyên tố** (§2.5) | Hai hệ khắc chế song song không nói chuyện với nhau. Hoặc gom 16 Chimera thành **ba nhóm** theo lối Axie và cho nhóm đó có nghĩa trong chiến đấu, hoặc **bỏ hẳn trường `lop`** khỏi chữ người chơi thấy. Đang lửng lơ | 1 quyết định |

### 8.4 Một điều tài liệu này KHÔNG làm được

Chuỗi nhiệm vụ ở §5 rải đều 1→120 và không có lỗ nào lớn hơn 6 cấp. **Nhưng nó không chữa được
chuyện từ cấp 60 trở đi mỗi cấp tốn khoảng một giờ** (`docs/NHIP_CAP_1_120.md`). Nghĩa là giữa
NV45 (cấp 84) và NV46 (cấp 86) có **hai giờ** không có gì xảy ra về mặt truyện.

Cốt truyện không chữa được nhịp cấp. Thứ chữa được nó là nội dung lặp lại có nghĩa — và ba hệ
đúng cho việc đó (**Vỉa Cốt** đổi chỗ mỗi ngày · **Rương Canh** mở một lần · **Tầng Sâu** không
tầng nào giống tầng nào) **đã dựng xong và đang không ai dùng**. Đó là lý do tôi treo bảy nhiệm
vụ vào ba hệ đó thay vì viết thêm bảy trận đánh.

Nếu chỉ được chọn **một** việc trong cả tài liệu này để làm trước, tôi chọn **§7.2 dòng đầu**:
cho người chơi nhìn thấy con số **+8% quái mỗi Trụ Khoá gãy**. Nó tốn một dòng chữ, và nó biến
bi kịch trung tâm từ một đoạn văn trong `CLAUDE.md` thành thứ người chơi **cảm thấy trên tay**.

