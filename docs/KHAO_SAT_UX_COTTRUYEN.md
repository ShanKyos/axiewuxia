# Khảo sát UI/UX + cốt truyện

> Khảo sát đọc-đo, **không sửa code**. Mọi con số đếm trực tiếp trên `public/game/game.js`
> (24.353 dòng), `style.css` (1.137 dòng), `index.html` (186 dòng), bản ngày khảo sát.
> Mọi tham chiếu ghi dạng `file:dòng`.

---

> **ĐÍNH CHÍNH sau khi thi công (đợt 1+2).** Hai chỗ trong báo cáo này sai, đã kiểm lại trên code:
> - **`AI_NPCS.duoclao` KHÔNG hỏng.** `renderShop()` có gọi `aiChatBlock(n.id)` (`game.js:20265`),
>   nên ô trò chuyện tự do vẫn hiện ở NPC bán thuốc.
> - **Lỗi nhánh `type:'talk'` chỉ áp cho MỘT nhiệm vụ, không phải tám.** Tám nhiệm vụ `talk` có
>   thật, nhưng bảy trong số đó có người GIAO trùng người CẦN GẶP, nên chúng chưa bao giờ rơi vào
>   nhánh sai. Chỉ NV14 (giao ở Rell, gặp Wren) thực sự rỗng.
>
> Mọi con số khác trong báo cáo đã được bài kiểm `tests/test_cottruyen.js` xác nhận lại.

## 1. Hiện trạng hội thoại

### 1.1 Kiểm kê NPC

`NPCS` khai báo ở ba chỗ: `game.js:1797` (3 mục), `game.js:21201` (9 mục), `game.js:21224` (9 mục)
— **tổng 21 NPC**, chia theo `talk`:

| `talk` | Số | Việc |
|---|---|---|
| `quest` | 9 | Giao/trả nhiệm vụ |
| `shop` | 3 | Tiệm (`SHOPS`, `game.js:19945`) |
| `forge` | 2 | Mở Lò Hỗn Độn |
| `tenui` | 3 | Vực Thẳm (nhảy lấy thưởng) |
| `stable` · `abode` · `trunya` · `vanduyen` | 1 mỗi loại | Trại Ngựa · Nhà Riêng · Truy Nã · Sảnh Cầu May |

### 1.2 Đếm thoại

| Nguồn | Số dòng thật |
|---|---|
| `lore:` trên NPC (`game.js:1806`, `21202-21243`) | **19 dòng** — mỗi NPC đúng **1 câu**, cố định vĩnh viễn |
| NPC **không có** dòng thoại nào | **2** — `truonglang` (`game.js:1798`) và `thoren` (`game.js:1803`) |
| `npcStoryLine()` (`game.js:22153`) | **4 dòng** dùng chung cho **tất cả** NPC `quest`, đổi theo số Tướng Quân đã hạ (0 / <3 / <5 / ≥5 / kết mở) |
| `BOSS_LORE` (`game.js:22068`) | **28 boss**, **55 dòng** mở màn |
| Thoại boss riêng theo lớp (`sect:`) | **8 dòng / 28 boss**. Phân bố: Dark Knight 2 · Sylvan Ranger 2 · Dark Lord 2 · Dark Wizard **1** · Spellblade **1** |
| `CLUES` (`game.js:22041`) | **15 mẩu** văn bản đọc trong Nhật Ký, rơi từ boss (`CLUE_DROPS`, `game.js:22059`) |
| `INTRO_PAGES` (`game.js:20742`) | **4 trang** dẫn truyện, chỉ hiện **một lần** lúc tạo nhân vật |
| `REGION_UNLOCK_LORE` (`game.js:22137`) | **8 câu**, mỗi vùng 1 câu, hiện trên `zoneBanner` 4,5 giây |
| `TUT_STEPS` (`game.js:20803`) | **6 bước** hướng dẫn phím, không có nội dung truyện |
| `hintCandidates()` (`game.js:7876`) | **8 gợi ý**, toàn bộ là cơ chế (mặc đồ, cộng điểm, uống thuốc…), **0 câu truyện** |

**Tổng văn bản NPC nói trực tiếp với người chơi trong cả game: 19 + 4 = 23 dòng.**
Trong đó 4 dòng dùng chung cho 9 NPC, nên mỗi NPC thực chất chỉ có **1 câu riêng**.

### 1.3 Cơ chế hộp thoại — có gì, thiếu gì

| Tính năng | Trạng thái | Bằng chứng |
|---|---|---|
| Chân dung NPC khi nói | **Có** | `npcHead()` `game.js:20058` → `.npc-head .npc-face` 52×52 (`style.css:995`) |
| Hộp thoại nhiều bước, bấm để xem tiếp | **Không** — chỉ màn dẫn truyện đầu game có (`is-next`, `game.js:20798`) | `renderQuestNpc()` `game.js:21764` dựng **một** khối HTML rồi hiện luôn |
| Lựa chọn trả lời | **Không có ở đâu cả** | Không tồn tại cấu trúc `choices`/`options`; nút duy nhất là "Nhận Nhiệm Vụ"/"Nhận Thưởng" |
| Thoại theo trạng thái nhiệm vụ (chưa nhận / đang làm / đã xong) | **Không** — `lore` in y hệt ở cả ba trạng thái | `game.js:21767`: `if (n.lore) html += …` chạy vô điều kiện |
| Thoại nhàn rỗi (NPC tự nói khi đi ngang) | **Không** | `drawNpc()` `game.js:21965` chỉ vẽ tên + dấu `!`/`…` |
| Dấu hiệu có việc trên đầu NPC | **Có** | `npcMark()` `game.js:21894` — `!` trả NV · `…` nhận NV · rỗng |
| Trò chuyện tự do bằng LLM | **Có, nhưng chỉ 3 NPC** và **1 trong 3 không tồn tại** | `AI_NPCS = { truonglang, duoclao, quachtinh }` `game.js:21698`. `duoclao` là NPC `talk:'shop'` (`game.js:21225`) → `renderShop()` **không gọi** `aiChatBlock()`, nên ô chat không bao giờ hiện ra ở đó |
| Thoại boss | **Có**, tự chạy 3,4 s/dòng, **không bấm được để qua**, **không tạm dừng trận** | `_btRender()` `game.js:22160` — `setTimeout(…, 3400)` |
| Đọc lại thoại boss | **Có** | `replayBossTalk()` `game.js:22174`, nút 💬 trong Nhật Ký (`game.js:22220`) |

### 1.4 Ba lỗ hổng lớn nhất

1. **Trưởng Làng không có một câu nào.** Ông giao 9 trong 10 nhiệm vụ đầu (`QUESTS.forEach`
   `game.js:21248` gán `q.npc='truonglang'` cho NV2–10), dẫn truyện gọi ông là người "nhặt
   ngươi về nuôi" (`game.js:20765`), nhưng `NPCS[0]` (`game.js:1798`) **không có trường `lore`**.
   Người chơi nói chuyện với ông cả 10 nhiệm vụ đầu và không nghe ông nói gì.
2. **Dược Sư là NPC chết.** `game.js:21202`, `talk:'quest'`, nhưng **không nhiệm vụ nào** trỏ tới
   (`npc:'duocsu'` xuất hiện 0 lần). Bấm E chỉ ra 1 câu `lore` + dòng "Chính tuyến hiện tại: …
   hãy đến X gặp Y" (`game.js:21786`).
3. **Trinh Sát Wren im lặng đúng lúc quan trọng nhất.** NV14 (`game.js:21271`) bảo đi gặp Wren.
   Gặp xong `questOnTalk()` (`game.js:21680`) đánh dấu xong, nhưng vì `q.npc` là `quachtinh`
   chứ không phải `monkhach`, `renderQuestNpc()` rơi vào nhánh `else if (q)` (`game.js:21785`)
   → Wren chỉ nói **câu lore cố định** rồi bảo quay về gặp Trưởng Lão Rell. Cuộc gặp mà cốt
   truyện dựng lên cả một nhiệm vụ để dẫn tới lại **không có nội dung**.

---

## 2. Hiện trạng cốt truyện

### 2.1 Mạch truyện dựng lại

**Nền (`INTRO_PAGES`, `game.js:20742`).** Bốn trang: hai thế giới · vết nứt · kẻ được phái qua ·
năm Trụ Khoá. Đúng canon trong `CLAUDE.md:79`.

**Chính tuyến — 35 nhiệm vụ, 7 chương** (`QUESTS` `game.js:4696` + 5 lần `QUESTS.push`
`game.js:21255`–`21340`):

| Chương | NV | Cấp | Vùng | NPC | Nội dung |
|---|---|---|---|---|---|
| I · Kẻ Từ Thế Giới Khác | 1 | 1 | Lunaris City | Trưởng Lão Rell | Vừa qua vết nứt, mất ký ức võ nghệ |
| I · Petalshade Isle | 2–10 | 2–10 | Petalshade Isle | Trưởng Làng | Khí Morvahn làm thú hoá dại → Đoàn Gloam → hạ thủ lĩnh, ký ức trở về |
| II · Lunaris City | 11–15 | 10–17 | Lunaris City / Outskirts | Trưởng Lão Rell | Trình diện · hái thuốc · chặn Gloam · gặp Wren · dọn đường vào rừng |
| III · Thornwood Reach | 16–19 | 20–34 | Thornwood | Người Gác Rừng Corran | Trụ thứ nhất · kẻ đổi phe · Chimera phun độc · ba Axie hết cứu |
| IV · Hollow Roost | 20–23 | 40–52 | Hollow Roost | Sylas | Ổ ấp chết · oan hồn hatchling · Axie Golem hỏng lệnh · dơi rút trứng |
| V · Frostmire Vale | 24–27 | 60–76 | Frostmire | Liora | Đất Lunacia bị viết lại · kẻ cuồng tín · gốc rễ độc · sát thủ chặn đường |
| VI · Ashen Steppe | 28–31 | 80–97 | Ashen Steppe | Dax | Đếm quân · bịt mắt · phá hàng cung · chặn mũi nhọn |
| VII · Stormgate Pass | 32–35 | 100–116 | Stormgate | Lão Tướng Brann | Trụ cuối · giữ phòng tuyến · thú Vaeldra hoá dại · gỡ trụ thứ năm → kết mở |

**Phụ tuyến — chỉ 5 cái** (`SIDE_QUESTS` `game.js:21358`): 4 nhiệm vụ dạy hệ thống (Trại Ngựa ·
Thần Binh · Lò Hỗn Loạn · Vườn Thảo Dược) + 1 nhiệm vụ `talk` ở cấp 115. Bốn cái đầu **không có
nội dung truyện**, chỉ là hướng dẫn cơ chế. Chú thích `game.js:21364` xác nhận 5 nhiệm vụ "cầu
nối cốt truyện" đã bị xoá.

⇒ **Từ cấp 12 tới cấp 115 không có một nhiệm vụ phụ nào kể chuyện.**

### 2.2 Chỗ đứt mạch (đã kiểm chứng)

**a. Màn mở game kể một câu chuyện khác hẳn.**
`index.html:145-146` viết: *"Lunacia · Vùng đất bị xiềng — Ba con tàu cập bến trong đêm. Trên bờ,
những chiếc lồng còn sáng. Chọn lớp và đặt tên — rồi đi cứu chúng về."* Hoạt cảnh nền
(`titleStart()` `game.js:20331`, chú thích `game.js:20293`) cũng vẽ **đoàn tàu vượt biển**.
Nhưng `INTRO_PAGES` ngay trước đó nói nhân vật **rơi qua vết nứt trên trời**, không có tàu, không
có lồng. Người chơi mới xem hai màn liên tiếp và nhận hai nguồn gốc mâu thuẫn.

**b. Nơi bắt đầu mâu thuẫn với lời kể.**
`INTRO_PAGES` trang 3 (`game.js:20765`): *"Ngươi dạt vào Petalshade Isle, được một Trưởng Làng
Axie nhặt về nuôi."* Nhưng `newPlayer()` đặt `curMap = 'tuongduong'` (`game.js:5824`) — người chơi
mở mắt ra ở **Lunaris City**. NV2 (`game.js:4700`) phải viết *"Về đảo (bản đồ M → Dịch Chuyển)"*
để chữa cháy, tức là người chơi "về" một nơi mình chưa từng tới.

**c. Năm Trụ Khoá không ai đếm được.**
Bảy vùng, năm trụ. Chỉ trụ **1** (Thornwood, NV15–16 `game.js:21275`, `21285`) và trụ **5**
(Stormgate, NV35 `game.js:21338`) được gọi tên. Trụ **2, 3, 4** không nhiệm vụ nào công bố là
đã gỡ. Chương V (Frostmire, NV24–27) và chương VI (Ashen Steppe, NV28–31) **không nhắc chữ
"Trụ Khoá" một lần nào**.

**d. Tên nguyên tố của trụ đá nhau.**
`REGION_UNLOCK_LORE` (`game.js:22137`): Petalshade = *"Trụ Hỏa đầu tiên"*, Stormgate = *"Trụ Hỏa
cuối cùng"* — **cùng một nguyên tố cho trụ đầu và trụ cuối**. Outskirts và Hollow Roost đều là
*"Trụ Mộc"*. Đếm ra: Hỏa ×2, Mộc ×2, Thủy ×1, Kim ×1, Thổ ×0.

**e. Hai màn kết nói ngược nhau.**
`showKetMo()` (`game.js:22164`): *"Trụ Khoá thứ năm đổ xuống… **Morvahn đang bước qua**."*
Tab Nhật Ký (`game.js:22223`): *"☠ KẾT MỞ — Ấn đã vỡ. **Hung Thần sẽ giáng thế**…"*
Nhưng `CLAUDE.md:103` định nghĩa rõ **Hung Thần là boss thế giới định kỳ, KHÔNG phải Morvahn**.
Cùng lúc đó tab này in *"Ngũ Trụ Trấn **Hung Thần** · n/7 Tướng Quân đã hạ"* (`game.js:22208`) —
5 trụ nhưng đếm 7, và gán cho sai kẻ thù.

**f. Danh hiệu cuối trái ngược với kết truyện.**
`turnInQuest()` (`game.js:21877`) trao danh hiệu **"KẺ KHÉP VẾT NỨT"**. Nhưng toàn bộ bi kịch
trung tâm là người chơi **mở** vết nứt (`game.js:22168`: *"ngươi vừa tự tay mở toang cánh cửa
hắn cần"*). `renderQuestNpc()` `game.js:21789` cũng in *"bạn là Kẻ Khép Vết Nứt!"*.

**g. Nhân vật xuất hiện rồi biến mất.**
Bảy NPC cốt truyện (Rell · Wren · Corran · Sylas · Liora · Dax · Brann) mỗi người giữ đúng một
chương rồi không bao giờ nhắc lại. Không ai trong số họ nói về người khác. `CLUES.lenh_bai_doi`
(`game.js:22052`) nói *"bảy người vượt vết nứt cùng ngươi, năm cái tên đã bị gạch"* — **năm đồng
đội đó không có tên, không xuất hiện, không được nhắc trong bất kỳ nhiệm vụ nào**.

**h. Vùng đất không có lý do tồn tại trong truyện.**
- **Petalshade Outskirts** (`MAPS.ngoai` `game.js:804`): chỉ là bãi luyện cấp giữa NV11 và NV16.
- **7 phó bản Trial Chamber** (`game.js:872`–`899`): mô tả thuần cơ chế ("cày tinh chất nâng bậc
  lớp"), **không có một câu nào giải thích vì sao có phòng thử thách trong thế giới này**.
- **3 Vực Thẳm** (`game.js:21237`–`21241`): ba câu lore độc lập, không nối vào Morvahn hay Trụ Khoá.

**i. Mô tả Lunaris City chỉ vào thứ không tồn tại.**
`MAPS.tuongduong.desc` (`game.js:800`): *"Trung tâm mọi thứ — **Chợ Đấu Giá**, Lò Rèn Hoàng Gia,
**Dược Sư**, Quán Trà."* Chợ Đấu Giá **đã bị xoá** (chú thích `game.js:1799`), còn Dược Sư ở
**Petalshade Isle** chứ không ở đây (`game.js:21202`); NPC bán thuốc trong thành tên là "Nhà Giả
Kim · Tiệm Thuốc". Dòng này hiện trong bảng Bản Đồ (`game.js:21565`) và trên `zoneBanner` mỗi lần
vào thành (`game.js:21500`).

### 2.3 Đối chiếu với `docs/`

| Tài liệu | Nói gì | Game nói gì | Kết luận |
|---|---|---|---|
| `LORE_BIBLE.md` | Người chơi là **một Axie trẻ của Petalshade Isle**; Chimera sinh từ vỏ trứng Atia; **Five Sigils**; **Warden**; boss cuối là **the Overlord (Bá Chủ)** | Người chơi là **chiến binh Vaeldra từ thế giới khác**; Chimera do khí Morvahn; **Năm Trụ Khoá**; **Tướng Quân**; boss cuối là **Morvahn** | **Toàn bộ tài liệu đã lỗi thời.** Không một danh từ nào còn khớp. Nguy hiểm nhất trong cả thư mục `docs/` |
| `NAMING_MAP.md` §3 | Hộp mở đồ = **"Bảo Hạp"** | Trong game là **"Box Kundun"** (ngoại lệ đã duyệt, `CLAUDE.md:46`) | Bảng tên chưa cập nhật |
| `TONG_QUAN.md` §14 | **11 nhiệm vụ phụ** | `SIDE_QUESTS` có **5** (`game.js:21358`) | Sai số liệu |
| `TONG_QUAN.md` §15 | **"Động Phủ (cấp 30)"**, **"Vườn Dược"** | Trong game là **"Nhà Riêng"**, **"Vườn Thảo Dược"** (`game.js:23013`, `21363`) | Lệch tên |
| `TONG_QUAN.md` §1 | *"Game mặc định chạy tiếng Anh"* | `i18n.js:26` đặt `locale = 'vi'` | Sai |
| `VUNG_ELDERBOUGH.md` §1 | *"đúng 2 NPC trong bảng NPCS"* | 21 NPC | Lỗi thời, nhưng nhận định gốc (**một hub duy nhất suốt 1→120**) vẫn đúng |
| `VUNG_VO_AN_ENDGAME.md` | Tự ghi **"BẢN THIẾT KẾ, CHƯA CÀI ĐẶT"** | — | Trung thực, không phải lỗi |

### 2.4 Mười phút đầu — người chơi được kể những gì

Theo đúng thứ tự code chạy:

1. `showIntro()` `game.js:20777` → **4 trang chữ**, có nút "Bỏ qua ▸▸" ngay cạnh nút "Tiếp"
   (`index.html:120`). Đây là **~90%** toàn bộ lore người chơi sẽ nhận được, dồn vào trước khi
   họ kịp quan tâm.
2. `openCreate()` → màn chọn lớp, đọc *"Ba con tàu cập bến trong đêm"* — **mâu thuẫn với trang 3
   vừa đọc xong** (mục 2.2a).
3. Vào game ở **Lunaris City** — mâu thuẫn với *"Ngươi dạt vào Petalshade Isle"* (mục 2.2b).
4. `TUT_STEPS` 6 bước (`game.js:20803`) — **toàn bộ là phím bấm**: chuột phải, E, Đi ngay, SPACE,
   J, C/K/B. Không một chữ nào về thế giới.
5. NV1 "Kẻ Rơi Xuống": đi gặp Trưởng Lão Rell. Ông nói **1 câu** (`game.js:21205`), giao NV, xong.
6. NV2: dịch chuyển về Petalshade Isle, gặp Trưởng Làng — ông **không nói gì** (mục 1.4.1).
7. NV2–6: giết heo rừng, hái thuốc, giết sói, rèn +3, giết cướp. Mỗi nhiệm vụ **1 dòng `desc`**
   trong khung nhiệm vụ góc phải (`trackerHtml()` `game.js:22000`). Không hộp thoại.

**Tổng: trong 10 phút đầu người chơi đọc 4 trang lore (bỏ qua được), nghe đúng 1 câu từ 1 NPC,
và gặp 6 dòng mô tả nhiệm vụ.** Không có cuộc trò chuyện nào có hai lượt.

---

## 3. Hiện trạng UI

### 3.1 Bảng đối chiếu các bảng chính

Tất cả bảng dưới đây dùng chung class `.panel` (`style.css:143`) nên **khung ngoài giống nhau**:
nền `linear-gradient(170deg, #262c58, #14163a)`, viền kim loại 10 px `border-image` giả bằng
`background-origin:border-box`, bo góc `--r-lg` = **20 px**, padding `16px 18px`, chữ `#e4ebff`.
Khác nhau nằm ở **tiêu đề, nút đóng và tab**:

| Bảng | Hàm dựng | `<h3>` là con trực tiếp của `.panel`? | Thanh tiêu đề khắc chìm (`.panel > h3` `style.css:176`) | Nút ✕ | Kiểu tab |
|---|---|---|---|---|---|
| Nhân Vật | `renderCharPanel` `game.js:16947` | **Có** | **Có** | Có | `.char-tabs button` + `.active`, bo **999 px** (`style.css:525`) |
| ├ tab Thông Tin | `renderChar` `game.js:14131` | Không (trong `#char-content`) | **Không** | — | — |
| Trang Bị | `renderInv` `game.js:19053` | **Có** | **Có** | Có | — |
| Túi Đồ | `renderBag` `game.js:19464` | **Có** | **Có** | Có | `.chaos-tab` + `.on`, bo **14 px** (`style.css:786`) |
| Kỹ Năng | `renderSkillPanel` `game.js:19588` | **Có** | **Có** | Có | — |
| Bản Đồ | `renderMapPanel` `game.js:21514` | **Có** | **Có** | Có | — |
| Nhật Ký Nhiệm Vụ | `renderQlog` `game.js:22179` | **Có** | **Có** | Có | **`.mini-btn` + `.danger`**, bo **999 px** (`game.js:22183`) |
| Cài Đặt | `renderSettings` `game.js:21122` | **Có** | **Có** | Có | **`.mini-btn` + `.danger`** (`game.js:21125`) |
| Chọn Trận | `renderStageSelect` `game.js:21581` | **Có** | **Có** | Có | — |
| Lò Hỗn Độn | `renderForge` `game.js:14994` | **Không** (trong `#forge-content`, `game.js:20286`) | **Không** | **Không có ✕** | `.chaos-tab` + `.on` |
| Hội thoại NPC | `renderQuestNpc` `game.js:21764` | **Không** (`<h3>` nằm trong `.npc-head`) | **Không** | Có (trong `npcHead`) | — |
| Tiệm | `renderShop` `game.js:20064` | **Không** | **Không** | Có | — |
| Khế Ước Chimera | `renderKheUoc` `game.js:16197` | **Có** | **Có** | Có | — |
| Nhà Riêng | `renderAbode` `game.js:23013` | **Có** | **Có** | Có | — |
| Truy Nã / Vực Thẳm / Sảnh Cầu May | `game.js:24129`, `24214`, `24290` | **Không** (`npcHead`) | **Không** | Có | — |
| Hoạt ảnh gacha | `#gacha-wrap` `style.css:1125` | — | **Không dùng `.panel`** — nền `#04040a` phẳng, không viền, không bo góc | Không | — |
| Dẫn truyện | `.is-frame` `style.css:664` | — | **Không dùng `.panel`** — viền 1 px `rgba(126,203,255,.4)`, bo 20 px | Không (nút "Bỏ qua") | — |
| Overlay (kết mở…) | `#overlay-inner` `style.css:384` | `<h2>` | **Không** — không viền, không nền, chữ **canh giữa** | Không | — |
| Thoại boss | `#boss-talk` `style.css:433` | — | **Không dùng `.panel`** — nền hồng-đỏ `rgba(24,10,20,.88)`, viền `rgba(255,143,207,.5)`, bo 14 px | Không | — |
| Thẻ vật phẩm | `.itip` `style.css:883` | — | **Không dùng `.panel`** — nền `rgba(9,8,16,.96)`, bo **6 px** | Không | — |

### 3.2 Danh sách chỗ lệch — đích danh

**A. Tiêu đề: một khái niệm, hai hình dạng.**
`style.css:176` dùng bộ chọn **con trực tiếp** `.panel > h3` để vẽ thanh tiêu đề khắc chìm. Bảy
bảng có `<h3>` nằm sâu hơn một tầng (`npcHead()` bọc nó trong `.npc-head`; `renderForge` viết vào
`#forge-content`) nên **mất hẳn thanh khắc chìm** và chỉ còn gạch chân từ `.panel h3`
(`style.css:186`). Kết quả: nói chuyện với NPC và mở túi đồ ra hai kiểu tiêu đề khác nhau.

**B. Bảng Nhân Vật có hai tiêu đề chồng nhau.**
`renderCharPanel` in `<h3>Nhân Vật</h3>` (`game.js:16950`), rồi tab Thông Tin in tiếp
`<h3>Nhân Vật — Dark Knight Cấp 5</h3>` (`game.js:14133`) ngay dưới hàng tab. Cả 6 tab đều lặp
lỗi này (`game.js:15538`, `15669`, `15878`, `15972`, `16268`).

**C. Ba kiểu tab cho cùng một việc.**
| Kiểu | Class | Bo góc | Dùng ở |
|---|---|---|---|
| 1 | `.char-tabs button.active` (`style.css:525`) | 999 px | Nhân Vật |
| 2 | `.chaos-tab.on` (`style.css:786`) | 14 px | Túi Đồ, Lò Hỗn Độn |
| 3 | `.mini-btn.danger` (`style.css:720`) | 999 px | Nhật Ký, Cài Đặt |

Kiểu 3 sai về nghĩa: `.danger` là **viền đỏ `#ff6b6b`**, và cùng class đó đang được dùng làm nút
phá huỷ thật ở `game.js:21154` (**"XÓA SAVE"**). Trong bảng Nhật Ký, tab *chưa chọn* trông y hệt
nút xoá dữ liệu.

**D. Lò Hỗn Độn không có nút đóng.**
`openForgePanel()` (`game.js:20286`) chỉ ghi `<div id="forge-content">`, mà `renderForge`
(`game.js:14994`) không phát ra `close-x`. Mười ba bảng khác đều có ✕ ở `top:6px; right:8px`
(`style.css:188`).

**E. Bốn họ chữ trong một game.**
| Họ chữ | Nơi dùng |
|---|---|
| `Baloo 2` (`--font-display`, `style.css:23`) | 10 chỗ: tiêu đề bảng, tên boss, số trên viên đá Máu/Mana |
| `Be Vietnam Pro` | thân trang (`style.css:29`) |
| `system-ui, Segoe UI` | **`.itip`** — thẻ vật phẩm (`style.css:884`) |
| `ui-monospace, Consolas` | bảng lệnh test (`style.css:459`) |

`Baloo 2` là bộ chữ bo tròn kiểu hoạt hình — di sản của dòng chú thích *"playful Axie UI"* ở
`style.css:1`. Nó đang được dùng làm tiêu đề cho những **khung thép gothic có đinh tán**. Hai
ngôn ngữ hình ảnh đối nghịch nằm chồng lên nhau trong cùng một bảng.
Thẻ vật phẩm — thứ người chơi rê chuột lên hàng trăm lần mỗi phiên — là **bề mặt UI duy nhất
dùng bộ chữ hệ thống**, tức là đổi theo máy người chơi.

**F. Bo góc: 4 giá trị token, 7 giá trị thực tế.**
`:root` khai báo `--r-sm:10px --r-md:14px --r-lg:20px` (`style.css:23-25`). Đếm trên `style.css`:
`999px` ×20, `6px` ×7, `5px` ×3, `8px` ×2, `9px` ×1, `4px` ×1, `20px` ×1 — **7 giá trị viết thẳng
bằng số**, bỏ qua token. `.itip-card` bo 6 px trong khi mọi bảng khác bo 20 px.

**G. Cỡ chữ: 26 giá trị, 6 trong đó là số lẻ nửa điểm.**
`style.css` dùng 26 cỡ khác nhau, gồm `8.5 · 9.5 · 10.5 · 11.5 · 12.5 · 13.5 px`. `game.js` thêm
15 cỡ nữa trong thuộc tính `style=` nội tuyến. Không có thang cỡ chữ nào cả.

**H. 454 khối `style=` nội tuyến trong `game.js`, chứa 42 mã màu viết thẳng.**
`:root` có 14 token màu, nhưng trong `style=` xuất hiện các cặp gần trùng nhau mà không cái nào
là token:

| Nhóm | Các mã đang cùng tồn tại |
|---|---|
| Xanh dương | `#7ecbff` (token) · `#9fd0ff` · `#7fd4ff` · `#8ab4ff` · `#7df9ff` · `#5aa0e8` · `#7fd8e0` |
| Đỏ | `#ff6b6b` (token) · `#e84a6a` · `#ff7a6a` · `#ff9a6a` · `#ff8f6b` |
| Vàng/cam | `#ffd76a` (token) · `#ffb15c` (token) · `#f0a03a` · `#e8b060` · `#e8b04a` |
| Xanh lá | `#7ec850` (token) · `#8fd18f` · `#3ac88a` · `#a0ffe9` |
| Tím | `#b18cff` (token) · `#b08ae8` · `#c07fe0` |

**I. Cùng khái niệm, hai tên.**
| Khái niệm | Tên A | Tên B | Ghi chú |
|---|---|---|---|
| Cỗ máy rèn | **Lò Hỗn Độn** (tiêu đề bảng, `game.js:14996`) | **Lò Hỗn Loạn** (nhiệm vụ phụ `game.js:21362`, gợi ý `game.js:7949`) | Đúng ra "Lò Hỗn Loạn" là **một công thức bên trong** cỗ máy (`game.js:14725`); người chơi nhận nhiệm vụ tên "Lò Hỗn Loạn" rồi mở ra bảng tên "Lò Hỗn Độn" |
| Bậc thăng hoa | **Ascension** (`game.js:1832-1834`, `16276`, `16285`) | **Đại Thành** (`MASTERY_NAME`, `game.js:15174`) là hệ khác | Tiếng Anh nằm giữa câu tiếng Việt |
| Vết nứt vỡ ra | **Morvahn bước qua** (`game.js:22168`) | **Hung Thần giáng thế** (`game.js:22223`) | Sai canon, xem 2.2e |
| Boss cuối map | **Tướng Quân** (`BOSS_LORE`, canon) | **TRẤN ẢI** (banner `game.js:7581`) | Hai từ cho cùng một con |
| Trụ | **Trụ Khoá** (nhiệm vụ) | **Ngũ Trụ** / **Ấn** (`game.js:22208`, `22209`, `22223`) | Ba tên |
| Hộp mở đồ | **Box Kundun** (30 lần, người chơi thấy) | **Bảo Hạp** (18 lần, chỉ trong chú thích) | Chỉ lệch trong nội bộ code |

**J. Tiếng Anh lẫn tiếng Việt trong cùng một câu.**
- `game.js:22267` — *"Đả thông **Instinct Channels** +25% tỉ lệ"*
- `game.js:22263` — đặc điểm tên **"Spark Thiên Phú"**
- `game.js:1832` — *"khóa chiêu địch — **Ascension** cảnh 4"*
- `game.js:24221` — *"Cần đạt **Radiant Core** (cảnh 5, tự động ở cấp 60) để Thăng Linh"*
- Toàn bộ **tên chiêu** là tiếng Anh (`VOHOC_DEFS` `game.js:1851`: Cyclone, Lightning, Five Shot…)
  còn **mô tả chiêu** là tiếng Việt; **tên bản đồ** tiếng Anh (`MAPS` `game.js:784`) còn **mô tả
  bản đồ** tiếng Việt. Tên NPC thì nửa nọ nửa kia: *"Trưởng Lão Rell"*, *"Trinh Sát Wren"*,
  *"Người Gác Rừng Corran"*, *"Liora, Ẩn Sĩ Frostmire"*.
- `lang.js` còn **hai khoá dịch chết**: `'Unclassed lang bạt — chưa gia nhập Tộc nào'`
  (`lang.js:574`) và `'☯ Trưởng Tộc'` (`lang.js:144`) — chuỗi nguồn tiếng Việt tương ứng
  **không còn tồn tại** trong `game.js`.

**K. Đối chiếu với skill `axie-wuxia-ui-design`.**
Skill này được **trích tự động và đã trích sai** — dùng nó làm chuẩn sẽ hỏng giao diện:

| Skill nói | Thực tế trong repo | |
|---|---|---|
| *"light-themed"*, nền `#f5f7ff`, chữ `#0a0a1a` | Nền `--bg-deep: #10122a`, chữ `#eef2ff` (`style.css:3`, `12`) | **Ngược hoàn toàn** — skill lấy nhầm `#f5f7ff` từ `color:` của `#hud-name` (`style.css:39`) làm màu nền trang |
| *"Surface: `#e4ebff`"* cho nền thẻ | `#e4ebff` là **màu chữ** của `.panel` (`style.css:165`) | Nhầm vai |
| *"Card: `box-shadow: 0 0 8px rgba(232,66,95,.7)`"* | Giá trị đó là bóng của `#hp-accent-fill` (`style.css:119`) — **thanh máu**, không phải thẻ | Nhầm nguồn |
| *"Modal: `border-radius: 999px`"* | Không bảng nào bo tròn; `999px` là của `.mini-btn`/`.hbtn` | Nhầm nguồn |
| *"Font: inherit cho heading, Be Vietnam Pro cho body"* | Ngược: `--font-display: 'Baloo 2'` cho heading, `Be Vietnam Pro` cho body (`style.css:23`, `29`) | Đảo vai |
| *"Radius scale: 4/5/6/8/9/999"* | Token thật là `10/14/20` (`style.css:23-25`) | Không có giá trị nào trùng |
| *"No blur effects"* | `filter:grayscale()` có ở `.skill.locked` (`style.css:110`); không có `blur` | Đúng |
| *"4px grid"* | `style.css` dùng padding `5px`, `7px`, `9px`, `13px`… | Không đúng |

⇒ **Skill này đang mô tả một giao diện không tồn tại.** Nếu ai đó code theo nó, sẽ ra một bảng
nền trắng chữ đen giữa một game nền xanh đen.

---

## 4. Đề xuất

Xếp theo mức quan trọng. Mỗi mục ghi **sửa ở đâu · tốn công · vì sao đáng làm**.

### P0 — Sửa mâu thuẫn đang nói dối người chơi

**4.1 · Gỡ mâu thuẫn "ba con tàu" ở màn chọn lớp**
`public/game/index.html:145-146` · **nhỏ** (2 dòng chữ)
Thay `<h2>` và `<p class="ss-sub">` bằng nội dung khớp vết nứt. Ví dụ:
`<h2>Lunacia · Bên dưới vết nứt</h2>` và
*"Bầu trời nứt ra, và ngươi rơi qua. Ký ức võ nghệ ở lại phía bên kia — chọn lại con đường của
mình, rồi đi cứu thế giới mà thế giới ngươi vừa làm hỏng."*
Đồng thời sửa hoạt cảnh nền `titleStart()` (`game.js:20331`) hoặc, nếu chưa muốn vẽ lại, **để
màn chọn lớp không dùng chung nền với dẫn truyện** (`titleAlive()` `game.js:20324` đang buộc
hai màn dùng chung).
*Vì sao:* đây là màn hình thứ hai người chơi nhìn thấy, và nó phủ định trang lore vừa đọc xong.

**4.2 · Cho Trưởng Làng một giọng nói**
`public/game/game.js:1798` · **nhỏ** (thêm 1 trường `lore`)
NPC giao 9/10 nhiệm vụ đầu game đang câm. Thêm ngay:
```
lore:'"Ta vớt ngươi lên khi bầu trời còn đang nứt. Ngươi không nhớ gì — nhưng bầy nhỏ của ta thì
     nhớ mùi lửa đêm đó. Ở lại, rồi trả ơn bằng việc dập nó."'
```
*Vì sao:* rẻ nhất trong cả danh sách, và nó chạm đúng NPC người chơi gặp nhiều nhất trong giờ đầu.

**4.3 · Thống nhất tên kẻ thù cuối và danh hiệu kết**
`game.js:22208`, `22209`, `22223` (đổi *Hung Thần* → *Morvahn*, *Ấn* → *Trụ Khoá*, `n/7` → `n/5`
hoặc đổi nhãn thành *"Tướng Quân đã hạ"* cho khớp 7 vùng) · `game.js:21877` và `21789` (danh
hiệu) · **nhỏ**
Danh hiệu "Kẻ Khép Vết Nứt" nên đổi thành thứ khớp kết mở — ví dụ **"Kẻ Đứng Giữa"** hoặc
**"Kẻ Gỡ Trụ Cuối"**.
*Vì sao:* `CLAUDE.md:103` định nghĩa Hung Thần là boss thế giới định kỳ; dùng nó cho boss cốt
truyện làm hỏng cả hai khái niệm. Còn danh hiệu hiện tại nói ngược với đúng cái bi kịch mà cả
game xây lên.

**4.4 · Sửa mô tả Lunaris City**
`game.js:800` · **nhỏ** (1 dòng)
Bỏ "Chợ Đấu Giá" (đã xoá) và "Dược Sư" (ở đảo khác). Viết lại theo NPC thật đang đứng trong
thành: Lò Rèn Hoàng Gia · Tiệm Thuốc · Vũ Khí Phường · Trà Quán · Sảnh Cầu May · Truy Nã Lệnh ·
Nhà Riêng.
*Vì sao:* dòng này hiện mỗi lần vào thành và trong bảng Bản Đồ — nó đang chỉ người chơi đi tìm
hai thứ không tồn tại.

**4.5 · Đánh dấu `docs/LORE_BIBLE.md` là đã bỏ**
`docs/LORE_BIBLE.md:1` · **nhỏ** (thêm khối cảnh báo ở đầu file) hoặc **vừa** (viết lại)
Thêm ngay dòng đầu:
`> ⚠ TÀI LIỆU LỖI THỜI — mô tả cốt truyện Sigil/Warden/Overlord đã bị thay bằng canon
> Vaeldra–Morvahn–Trụ Khoá. Xem CLAUDE.md §"Cốt truyện (canon)". Đừng dùng file này.`
*Vì sao:* đây là tài liệu duy nhất trong `docs/` mang tên "Lore Bible", và **không một danh từ
nào trong đó còn đúng**. Bất kỳ ai (người hay agent) mở nó ra để viết nội dung mới sẽ viết sai
toàn bộ.

### P1 — Thêm chỗ nói chuyện (đúng yêu cầu chính của chủ dự án)

**4.6 · Thoại theo trạng thái nhiệm vụ — ba câu thay vì một**
`game.js:21767` (chỗ in `n.lore`) + `game.js:21202-21243` (dữ liệu NPC) · **vừa**
Đổi trường `lore:'…'` thành:
```js
lore: { idle:'…', offer:'…', active:'…', done:'…' }
```
rồi trong `renderQuestNpc()` chọn nhánh theo `npcMark(n)` (`game.js:21894`) — hàm này **đã tính
sẵn** ba trạng thái `!` / `…` / rỗng, chỉ cần đọc lại. Giữ tương thích ngược bằng
`typeof n.lore === 'string' ? n.lore : n.lore[key]`.
Chi phí nội dung: **9 NPC × 4 câu = 36 dòng viết mới** (hiện là 9).
*Vì sao:* đây là cách rẻ nhất để NPC thôi lặp lại một câu suốt 20 giờ chơi. Không cần cơ chế mới,
không cần UI mới — hạ tầng trạng thái đã có.

**4.7 · Hộp thoại nhiều bước, bấm để xem tiếp**
`game.js:21764` (`renderQuestNpc`) · **vừa**
Tách phần thoại ra một hàm `renderDialogPage(npc, pages, i)` dùng lại đúng khung
`.is-frame`/`.is-nav` của màn dẫn truyện (`style.css:664-676`) nhưng đặt trong `#panel-quest`.
Nút "Tiếp ▸" tăng `i`; trang cuối mới hiện khối nhiệm vụ đang có. Ba–bốn trang cho NPC mở
chương, một trang cho lần gặp lại.
*Vì sao:* hạ tầng phân trang đã tồn tại và đã chạy tốt ở `INTRO_PAGES`
(`renderIntroPage()` `game.js:20786`) — đây là việc dùng lại, không phải viết mới. Nó biến
"đọc một khối chữ" thành "một cuộc nói chuyện", đúng thứ chủ dự án nói là đang thiếu.

**4.8 · Trả nội dung cho ba cuộc gặp đang rỗng**
- **Wren** (`game.js:21206` + `game.js:21785`) · **vừa** — thêm nhánh: nếu
  `q.type === 'talk' && q.targetNpc === n.id` thì in **thoại của NV đó**, không rơi vào nhánh
  "hãy đến X gặp Y". Áp dụng cho cả 7 nhiệm vụ `type:'talk'` mở chương (NV1, 11, 14, 16, 20, 24,
  28, 32).
- **Dược Sư** (`game.js:21202`) · **nhỏ** — hoặc gán cho ông 1–2 nhiệm vụ phụ, hoặc đổi
  `talk:'quest'` → `talk:'shop'` và thêm mục vào `SHOPS` (`game.js:19945`). Hiện ông là NPC duy
  nhất bấm E vào mà **không có việc gì để làm**.
- **`AI_NPCS.duoclao`** (`game.js:21698`) · **nhỏ** — `duoclao` là NPC `shop`, mà `renderShop()`
  (`game.js:20064`) không gọi `aiChatBlock()`. Hoặc thêm `html += aiChatBlock(n.id)` vào cuối
  `renderShop`, hoặc đổi khoá thành `duocsu` (NPC `quest` cùng nghề). Hiện 1 trong 3 NPC trò
  chuyện tự do **không bao giờ hiện ô chat**.

**4.9 · Thoại nhàn rỗi khi đi ngang NPC**
`game.js:21965` (`drawNpc`) · **vừa**
Thêm mảng `barks:[…]` (3–5 câu) cho mỗi NPC; trong `drawNpc()`, nếu
`dist(player, n) < 140` và `n._barkT <= 0` thì `addFloat(n.x, n.y-76, câu, '#cfd8ff', 12)` và đặt
`n._barkT = 25`. Không cần bấm phím, không chặn thao tác.
*Vì sao:* Lunaris City hiện là một thành phố có 9 người đứng im hoàn toàn. Đây là thứ làm thành
phố "sống" mà tốn ít công nhất — `addFloat()` đã có sẵn và đã dùng khắp nơi.

**4.10 · Thoại boss: cho bấm để qua và thêm dòng theo lớp**
`game.js:22148-22162` (`showBossTalk` / `_btRender`) · **nhỏ**
Thêm `el.onclick = () => _btRender(el, name)` và `pointer-events:auto` (`style.css:434` đang đặt
`pointer-events:none`) để bấm là sang dòng kế. Đồng thời điền nốt trường `sect:` — hiện chỉ
**8/28 boss** có, và Dark Wizard cùng Spellblade mỗi lớp chỉ được **đúng 1 dòng riêng** trong cả
game.
*Vì sao:* dòng thoại chạy 3,4 giây trong lúc boss đang đánh — người chơi đang né đòn, không đọc
được, và không có cách nào tua. Còn dòng theo lớp là thứ duy nhất trong game khiến người chơi
thấy lựa chọn lớp của mình được thế giới ghi nhận.

### P2 — Vá mạch truyện

**4.11 · Đặt tên và công bố cả năm Trụ Khoá**
`game.js:21285` (chương III), `21296` (IV), `21307` (V), `21318` (VI), `21331` (VII) ·
`game.js:22137` (`REGION_UNLOCK_LORE`) · **vừa**
Mỗi chương phải có đúng một nhiệm vụ nói rõ *"Trụ Khoá thứ N ở đây, gỡ nó là vết nứt toác thêm
chừng này"*. Đồng thời sửa `REGION_UNLOCK_LORE` để năm nguyên tố **không trùng nhau**
(hiện Hỏa ×2, Mộc ×2, Thổ ×0).
⚠ Cân nhắc **bỏ hẳn cách gọi theo nguyên tố** (Trụ Kim/Mộc/Thủy/Hỏa/Thổ) — `CLAUDE.md:26` cấm
"ngũ hành làm hệ thống trung tâm". Đề xuất thay bằng tên theo địa danh: **Trụ Thornwood · Trụ
Hollow · Trụ Frostmire · Trụ Ashen · Trụ Stormgate** — vừa hết trùng, vừa dạy người chơi bản đồ.
*Vì sao:* "năm Trụ Khoá" là xương sống của cả cốt truyện mà người chơi không đếm được mình đang
ở trụ thứ mấy.

**4.12 · Trả năm đồng đội mất tích vào truyện**
`game.js:22052` (`CLUES.lenh_bai_doi`) · `game.js:21358` (`SIDE_QUESTS`) · **vừa**
Manh mối đã nói *"bảy người vượt vết nứt cùng ngươi, năm cái tên đã bị gạch"*. Thêm **5 nhiệm vụ
phụ `type:'talk'`**, mỗi chương một cái, mỗi cái tìm ra dấu vết một đồng đội (một bộ giáp, một
nhật ký, một kẻ đã đổi phe). Đây cũng vá luôn lỗ *"cấp 12 → 115 không có phụ tuyến cốt truyện"*.
*Vì sao:* năm cái tên bị gạch đang là sợi dây duy nhất nối nhân vật chính với quá khứ của chính
mình, và nó đang bỏ lửng. Nó cũng cho ba vùng giữa game (Hollow Roost, Frostmire, Ashen Steppe)
một lý do kể chuyện ngoài "giết N con".

**4.13 · Sửa nơi bắt đầu cho khớp lời kể**
`game.js:5824` **hoặc** `game.js:20765` · **nhỏ**
Chọn một trong hai: (a) đổi `curMap = 'daohoa'` và chuyển NV1 sang Trưởng Làng; hoặc (b) sửa
trang 3 của `INTRO_PAGES` thành *"Ngươi tỉnh dậy giữa Lunaris City, trong đống đá Ardhaven vừa
rơi qua cùng ngươi"* và bỏ chữ "Về đảo" ở NV2 (`game.js:4700`).
Phương án (b) rẻ hơn và không đụng vào luồng khoá bản đồ.
*Vì sao:* hiện người chơi được kể mình dạt vào một hòn đảo, rồi mở mắt ra ở một thành phố, rồi
được bảo "về" hòn đảo chưa từng tới.

**4.14 · Cho phó bản một câu lý do**
`game.js:872-899` (7 mục `pb_*`, trường `desc`) · **nhỏ**
Mỗi `desc` hiện chỉ nói "cày tinh chất nâng bậc lớp". Thêm một câu neo vào truyện, ví dụ
*"Hầm thử thách do Thủ Hộ Vaeldra đào để tôi luyện lính tiên phong — giờ khí Morvahn đã tràn
xuống tới đây."*
*Vì sao:* 7 phó bản là 7 khu vực người chơi vào hàng chục lần và không có một chữ nào giải thích
chúng là gì.

### P3 — Đồng nhất phong cách UI

**4.15 · Sửa `.panel > h3` thành `.panel h3` cho thanh tiêu đề**
`public/game/style.css:176` · **nhỏ** (đổi 1 ký tự, rồi kiểm tra 6 bảng bị ảnh hưởng)
Bỏ dấu `>` để bảy bảng NPC/Tiệm/Lò Rèn cũng có thanh tiêu đề khắc chìm. Sau khi đổi phải xử lý
bảng Nhân Vật (mục 4.16), nếu không sẽ có **hai** thanh khắc chìm chồng nhau.
*Vì sao:* đây là chỗ lệch dễ thấy nhất và rẻ nhất — cùng một game mà mở túi đồ ra một kiểu tiêu
đề, nói chuyện với NPC ra kiểu khác.

**4.16 · Bỏ tiêu đề trùng trong bảng Nhân Vật**
`game.js:14133`, `15538`, `15669`, `15878`, `15972`, `16268` · **nhỏ**
Sáu hàm tab đều in `<h3>` riêng ngay dưới `<h3>Nhân Vật</h3>` của khung ngoài. Đổi chúng thành
`.stat-sec` (`style.css:201`) — class đã có sẵn cho tiêu đề mục nhỏ.

**4.17 · Một kiểu tab duy nhất**
`game.js:22183-22185` · `game.js:21125`, `21127`, `21136`, `21140`, `21144` · **nhỏ**
Đổi hết sang `.chaos-tab` + `.on` (kiểu đang dùng ở Túi Đồ và Lò Hỗn Độn — nó đã có trạng thái
`hover`, `on` và badge số `<i>`). Trả `.mini-btn.danger` về **đúng một việc**: nút phá huỷ
(`game.js:21154` "XÓA SAVE").
*Vì sao:* hiện tab chưa chọn trong Nhật Ký trông hệt nút xoá dữ liệu — người chơi cẩn thận sẽ
không dám bấm.

**4.18 · Thêm nút ✕ cho Lò Hỗn Độn**
`game.js:20286` · **nhỏ**
`el('panel-forge').innerHTML = '<button class="close-x" onclick="closePanels()">✕</button><div id="forge-content"></div>'`
*Vì sao:* 13 bảng có ✕, riêng cái này không. Hiện chỉ đóng được bằng phím.

**4.19 · Quyết định lại bộ chữ tiêu đề**
`style.css:23` (`--font-display`) · **vừa** (đổi 1 dòng, nhưng phải nhìn lại 10 chỗ dùng)
`Baloo 2` là bộ chữ bo tròn kiểu hoạt hình, đang làm tiêu đề cho khung thép có đinh tán. Hai
lựa chọn:
- (a) Đổi `--font-display` sang `'Be Vietnam Pro'` weight 700/800 — **không tốn file mới**, xoá
  luôn 12 khối `@font-face` của Baloo 2 (`fonts.css:10-117`), giảm nặng trang.
- (b) Giữ Baloo 2 nhưng chỉ dùng cho HUD/số (viên đá Máu, Mana) và bỏ khỏi tiêu đề bảng.
Đồng thời sửa `.itip` (`style.css:884`) từ `system-ui` sang `'Be Vietnam Pro'` — thẻ vật phẩm
là bề mặt duy nhất đang đổi mặt chữ theo máy người chơi.
*Vì sao:* bốn họ chữ trong một game, và cái được dùng cho tiêu đề lại là cái mâu thuẫn nhất với
hướng nghệ thuật đã chốt.

**4.20 · Gộp tên "Lò Hỗn Loạn" / "Lò Hỗn Độn"**
`game.js:21362` (tên nhiệm vụ phụ), `game.js:7949` (gợi ý) · **nhỏ**
Đặt lại tên nhiệm vụ phụ thành **"Ném Đồ Dư Vào Lò"** hoặc **"Thử Vận Ở Lò Hỗn Độn"**, giữ
"Lò Hỗn Loạn" đúng nghĩa là **tên công thức** (`game.js:14725`). Cũng nên đổi tiêu đề chi tiết
công thức ở `game.js:23636` cho rõ đây là công thức chứ không phải cỗ máy.

**4.21 · Đưa 42 mã màu nội tuyến về token**
`game.js` — 454 khối `style=` · **lớn**
Việc dài, làm dần. Bắt đầu bằng cách bổ sung vào `:root` (`style.css:2-26`) các vai còn thiếu
(`--success:#8fd18f`, `--info:#9fd0ff`, `--rare:#b08ae8`, `--warn:#f0a03a`, `--legend:#e8b060`),
rồi thay dần các mã gần trùng. Ưu tiên nhóm **đỏ** (5 mã đang cùng tồn tại) và **xanh dương**
(7 mã) vì đó là hai nhóm mang nghĩa mạnh nhất (nguy hiểm / tương tác).

**4.22 · Sửa hoặc bỏ skill `axie-wuxia-ui-design`**
`/root/.claude/skills/axie-wuxia-ui-design/references/DESIGN.md` · **vừa**
Skill đang mô tả giao diện **nền sáng** trong khi game là **nền tối**, đảo vai hai bộ chữ, và lấy
màu chữ HUD làm màu nền trang (xem §3.2 mục K). Nên viết tay lại từ `style.css:2-26` thay vì
trích tự động. Nếu chưa làm ngay thì **đánh dấu skill là không tin được**.
*Vì sao:* skill này là thứ agent/người sẽ đọc trước khi viết UI mới. Ở trạng thái hiện tại nó
**làm cho giao diện lệch thêm**, không phải bớt.

---

## 5. Chỗ vi phạm quy tắc 1 / quy tắc 2

### 5.1 Kết quả quét tự động — phần sạch

| Kiểm tra | Kết quả |
|---|---|
| Ký tự Hán/CJK trong `game.js` | **0 dòng** ✔ |
| Ký tự Hán/CJK trong `lang.js` | **0 dòng** ✔ |
| Danh từ riêng MU Online trong **chuỗi người chơi thấy** | **0** ✔ — `Lorencia` (3 lần: `game.js:903`, `1616`, `9458`) và `Devil Square`/`Blood Castle` (`game.js:22530`, `22761`) đều nằm trong **chú thích**, đúng như `CLAUDE.md:44` cho phép |
| `Kundun` | **33 lần, tất cả đều là `Box Kundun`** ✔ — đúng ngoại lệ đã duyệt (`CLAUDE.md:46`) |
| Từ cấm quy tắc 1 trong **chuỗi người chơi thấy** | **0** ✔ — cả 43 lần xuất hiện của *cảnh giới · đan điền · kinh mạch · chân khí · tu vi · bí kíp · môn phái* đều nằm trong chú thích |
| Danh từ riêng Blizzard / HoYoverse | **0** ✔ |

### 5.2 Vi phạm còn lại — đều nằm ở text người chơi thấy

**V1 · `TRAITS` là ổ từ vựng kiếm hiệp lớn nhất còn sót** — `game.js:22252-22270`
Người chơi thấy toàn bộ danh sách này lúc tạo nhân vật và trong bảng Nhân Vật (`game.js:14150`, `game.js:21723`):

| Tên hiện tại | Vấn đề | Gợi ý thay (giữ nguyên hiệu ứng) |
|---|---|---|
| **Khai Mở Mạch Lực** (`:22267`) | *mạch* = kinh mạch — trúng thẳng từ cấm | **Dòng Máu Thức Tỉnh** |
| Mô tả của nó: *"**Đả thông** Instinct Channels"* | *đả thông* là động từ kiếm hiệp, lại lẫn tiếng Anh | *"Mở nhánh Bản Năng nhanh hơn +25%"* |
| **Long Tích Hổ Bộ** (`:22261`) | thành ngữ kiếm hiệp thuần | **Bước Chân Nhẹ** |
| **Đoạn Ngọc Thủ** (`:22262`) | tên chiêu tiểu thuyết | **Tay Xuyên Giáp** |
| **Võ Hồn** (`:22265`) | *võ* = võ học kiếm hiệp | **Hồn Chiến** |
| **Bách Bộ Thần Hành** (`:22259`) | thành ngữ kiếm hiệp | **Sải Chân Dài** |
| **Nhục Thân Cường Tráng** (`:22253`) | văn phong tu tiên | **Thân Thể Cứng Cáp** |
| **Túc Trí Đa Mưu** (`:22256`) | thành ngữ | **Đầu Óc Sắc Bén** |
| **Dược Thể** · **Sát Tâm** · **Thiên Mệnh** · **Vạn Vật Hữu Duyên** | cùng họ | **Thể Chất Kháng Độc** · **Máu Lạnh** · **Số Trời** · **Duyên May** |
| **Spark Thiên Phú** (`:22263`) | lẫn Anh–Việt trong 2 từ | **Tay Nghề Rèn** |
| `TRAIT_TIERS` **PHÀM / LINH / HUYỀN / THIÊN** (`:22246-22250`) | thang bậc tu tiên | **THƯỜNG / HIẾM / QUÝ / THẦN** — khớp thang phẩm trang bị đang có |
| `PERSONALITIES` **Chính Trực / Tà Khí / Trung Dung** (`game.js:22270`) | *tà khí*, *trung dung* là từ vựng tu tiên | **Ngay Thẳng / Tàn Nhẫn / Điềm Tĩnh** |

**Tốn công: nhỏ** (chỉ đổi trường `name` và `desc`, không đụng `id` nên save không hỏng).
**Đáng làm:** đây là màn hình **tạo nhân vật** — ấn tượng phong cách đầu tiên, và nó đang đọc như
một game kiếm hiệp.

**V2 · Cách gọi Trụ Khoá theo ngũ hành** — `game.js:22138-22145`
*Trụ Hỏa · Trụ Mộc · Trụ Thủy · Trụ Kim* — `CLAUDE.md:26` cấm "ngũ hành làm hệ thống trung tâm",
mà Năm Trụ Khoá **chính là** hệ thống trung tâm của cốt truyện. Xem đề xuất 4.11 (đổi sang tên
theo địa danh).
**Tốn công: nhỏ.**

**V3 · Banner "TRẤN ẢI" và "TRẬN NHÃN"** — `game.js:7576`, `7577`, `7581`, `22208`, `22218`
*Trấn ải · trận nhãn · phong ấn nguyên tố* là từ vựng kiếm hiệp, và **mâu thuẫn với canon** vốn
gọi là *Tướng Quân* và *Vệ Binh Trụ* (`CLAUDE.md:103`). Đề xuất:
- `"☬ TRẤN ẢI X ĐÃ BỊ ĐÁNH BẠI!"` → `"⚔ TƯỚNG QUÂN X ĐÃ NGÃ XUỐNG"`
- `"⚔ THỦ VỆ BỊ HẠ — TRẬN NHÃN 2/3"` → `"⚔ VỆ BINH TRỤ 2/3"`
- `"Phong ấn nguyên tố vùng này tạm được giữ vững"` → `"Trụ Khoá vùng này đã lung lay"`
- `"☬ Trấn Thủ Đã Gặp"` (`:22218`) → `"⚔ Tướng Quân Đã Gặp"`
**Tốn công: nhỏ.**

**V4 · Ký hiệu `☬`** — `game.js:7577`, `22208`, `22218`, `22223`
`CLAUDE.md:15` liệt kê bộ ký hiệu phương Tây được duyệt:
`⚔ ✚ ✦ ✧ ✹ ◆ ♣ ▲ ❄ ☼ ⚡ ☾ ☠ ⚑ ★ ◉ ♦ ✽ ● ◑`. `☬` **không nằm trong đó** và là ký hiệu tôn giáo
phương Đông. Thay bằng `⚑` (cờ hiệu) hoặc `◆`.
**Tốn công: nhỏ.**

**V5 · Đồ vật và NPC còn giọng kiếm hiệp** — người chơi thấy trực tiếp

| Chỗ | Hiện tại | Vấn đề |
|---|---|---|
| `game.js:19962` | **"Rượu Hổ Cốt"** | rượu xương hổ — motif kiếm hiệp thuần |
| `game.js:19946` | *"…khác nhau ở liều lượng thôi, **khách quân** ạ."* | xưng hô kiếm hiệp |
| `game.js:21834` | **"Cổ Thư Thất Truyền — Huyết Ma Thôn Phệ"** | tên công pháp tà đạo tiểu thuyết |
| `game.js:14142` | *"**Bái sư** mở khóa ở cấp 10"* | *bái sư* = nghi lễ môn phái |
| `game.js:21235` | NPC **"Thương Nhân Vận May"**, hệ **"Sảnh Cầu May"** | ổn; nhưng `game.js:4647` chú thích vẫn gọi là "Vạn Duyên Các · Thần Toán Tử" — nên dọn để lần sau không ai khôi phục nhầm |
| `game.js:21722` | lớp mặc định gọi là **"Tán Nhân"** trong ngữ cảnh AI | canon là **"Unclassed"** (`NAMING_MAP.md` §1) |
| `game.js:8013` | **"Đài Bình Cảnh"** | *bình cảnh* = ngưỡng tu luyện |

**Tốn công: nhỏ** cho từng mục; **vừa** nếu làm một lượt.

**V6 · Hai khoá dịch chết chứa từ cấm** — `lang.js:144`, `lang.js:574`
`'☯ Trưởng Tộc'` và `'Unclassed lang bạt — chưa gia nhập **Tộc** nào'` — *"Tộc"* nằm trong danh
sách cấm (`CLAUDE.md:22`), và `☯` là motif thái cực (`CLAUDE.md:27` cấm). Chuỗi nguồn tương ứng
**không còn tồn tại trong `game.js`**, nên đây là rác chưa dọn chứ không phải lỗi đang hiển thị.
**Tốn công: nhỏ** — xoá hai dòng.

---

## Phụ lục — con số một chỗ

| | |
|---|---|
| NPC | **21** (9 nhiệm vụ · 3 tiệm · 2 lò rèn · 3 vực · 4 khác) |
| Dòng thoại NPC riêng | **19** (2 NPC không có dòng nào) |
| Dòng thoại NPC dùng chung | **4** (`npcStoryLine`) |
| Nhiệm vụ chính | **35** / 7 chương |
| Nhiệm vụ phụ | **5** (4 dạy cơ chế · 1 `talk`) |
| Boss có lore | **28**, **55** dòng mở màn |
| Dòng thoại boss riêng theo lớp | **8** / 140 khả dĩ |
| Manh mối đọc được | **15** |
| Trang dẫn truyện | **4** (bỏ qua được) |
| Bước hướng dẫn | **6** (0 dòng cốt truyện) |
| Gợi ý bật lên | **8** (0 dòng cốt truyện) |
| Bảng dùng chung `.panel` | **13** / 18 bề mặt UI |
| Kiểu tab khác nhau | **3** |
| Họ chữ | **4** |
| Cỡ chữ trong `style.css` | **26** (6 cỡ nửa điểm) |
| Giá trị bo góc viết thẳng số | **7** (token chỉ có 3) |
| Khối `style=` nội tuyến trong `game.js` | **454**, chứa **42** mã màu |
| Vi phạm quy tắc 1 trong text người chơi thấy | **6 nhóm** (V1–V5) |
| Vi phạm quy tắc 2 | **0** |
| Ký tự CJK | **0** |
