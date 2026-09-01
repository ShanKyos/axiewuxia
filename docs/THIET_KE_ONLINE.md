# Chuyển Axie Wuxia thành game ONLINE kiểu MU Online — khảo sát & thiết kế hệ thống

**Trạng thái:** tài liệu khảo sát + thiết kế. **Không sửa một dòng nào** trong `public/game/game.js`
hay bất kỳ code game nào.
**Ngày đo:** 2026-09-01. **Bản code đã đo:** `axie-wuxia` @ `b060b90`, nhánh `claude/optimistic-davinci-oi5qba`.
**Cách đọc:** mọi con số trong tài liệu này đều đo được lại — cách đo ghi ở [Phụ lục A](#phụ-lục-a--cách-đo-lại-mọi-con-số).
Chỗ nào tôi **không** kiểm chứng được thì ghi rõ `⚠ CHƯA KIỂM CHỨNG`.

---

## Quyết định đã chốt — 2026-09-01

Tài liệu gốc để bảy câu hỏi mở ở [Phần 9](#9-những-câu-hỏi-chỉ-chủ-dự-án-trả-lời-được).
Chủ dự án đã trả lời. Phần này ghi lại câu trả lời và **điều mỗi câu trả lời làm thay đổi** —
đây là phân tích thêm sau khi có đáp án, không phải nội dung của bản khảo sát gốc.

| Câu hỏi | Trả lời | Làm thay đổi điều gì |
|---|---|---|
| CCU 12 tháng tới | **50** | Một tiến trình game server là đủ. **Không cần** sharding, channel, hay tách CSDL. Mọi con số quy mô trong Phần 5 đều thừa thãi ở mức này. |
| PvP người-với-người | **Có** | Bắt buộc authoritative ít nhất cho vùng PvP. Đây là thứ đẩy chi phí lên nhiều nhất. |
| Giao dịch giữa người chơi | **Có** | `trade_sessions` + `market_listings` + `item_ledger` quay lại — khoảng 4 tuần và **phần lớn rủi ro vận hành** mà Phần 7 đã đề nghị cắt. |
| Bán vật phẩm / nạp tiền | *(chưa trả lời)* | Giả định là **không**, vì đang ở alpha. Nếu có thì ledger thành nghĩa vụ pháp lý. |
| Người chơi hiện có giữ tiến trình | **Không — bản alpha, xoá sạch khi lên online** | Gỡ toàn bộ gánh nặng di trú. Đổi lược đồ thoải mái, không nợ ai cái gì. |
| Nền tảng | **PC only** | Bỏ được đệm nội suy thích ứng cho 4G. Kéo theo một việc dọn dẹp — xem dưới. |
| Ai trực lúc 3h sáng | *(chưa trả lời)* | Ở alpha CCU 50 thì chấp nhận được là "không ai" — nhưng phải chốt trước khi mở cửa thật. |

### Tổ hợp PvP + Giao dịch đổi kết luận của tài liệu

Phần 7 đề nghị một **lựa chọn giữa** thay cho authoritative đầy đủ: giữ client mô phỏng, server
kiểm tra thống kê theo trần EXP/bạc — bắt ~95% người gian lận với ~3 tuần thay vì 12–20.

**Với PvP CỘNG giao dịch thì lựa chọn đó không còn đủ.** Lý do:

- Kiểm thống kê bắt được người farm nhanh bất thường. Nó **không** bắt được người đúc một món đồ
  hoàn hảo bằng console rồi **bán vào nền kinh tế**. Món đồ đó là thật với mọi người chơi khác.
- Một người đúc đồ trong game single-player chỉ tự phá game của mình. Cùng hành động đó trong
  game có giao dịch thì phá nền kinh tế của tất cả — và không có cách nào thu hồi mà không cuộn
  ngược cả CSDL.
- PvP làm việc này có động cơ: đồ mạnh không chỉ để khoe, nó thắng người khác.

Nghĩa là **việc sinh vật phẩm và cộng tiền tệ bắt buộc phải nằm ở server**, kể cả khi phần mô
phỏng chiến đấu vẫn để ở client trong giai đoạn đầu. Đó là ranh giới tối thiểu — thấp hơn nữa thì
giao dịch không mở được.

Tin tốt: đó đúng là thứ mà kết luận trung tâm của tài liệu (`game.js` chạy được trên Node, 3–4
µs/tick) làm cho khả thi — hàm sinh đồ và hàm cộng thưởng chạy nguyên xi trên server.

### Tách hẳn Online khỏi Offline — theo lối Diablo II / Where Winds Meet

Chủ dự án chốt: **không phải ai cũng chơi online cùng lúc**, nên game có hai chế độ tách rời.
Đây là quyết định làm đổi kiến trúc nhiều nhất trong cả nhóm — và làm nó **rẻ đi**, không đắt lên.

**Luật chịu lực, một câu:** nhân vật offline **KHÔNG BAO GIỜ** được mang lên online, và ngược lại.

Đó chính xác là cách Diablo II tách "open" với "closed" battle.net: nhân vật closed realm nằm
trên server của Blizzard, không nhập được từ máy người chơi. Bỏ luật đó là bỏ toàn bộ phần chống
gian lận — vì offline người chơi có toàn quyền trên file save của mình, và không có cách nào phân
biệt một nhân vật cày thật với một nhân vật gõ vào console.

Sẽ có người xin "cho nhập nhân vật offline lên online". Phải từ chối. Một lần nhân nhượng là nền
kinh tế chết, và không có cách nào cuộn lại mà không cuộn cả CSDL.

| | Offline | Online |
|---|---|---|
| Nhân vật lưu ở | `localStorage` trên máy người chơi | CSDL trên server |
| Ai là nguồn sự thật | Client — như hôm nay | Server |
| Sinh vật phẩm, cộng tiền tệ | Client | **Server** |
| PvP, giao dịch | Không có | Có |
| Console cheat | Không sao — chỉ tự phá game của mình | Vô nghĩa, server không tin client |
| Cần làm gì để có | **Không gì cả — đã chạy rồi** | Toàn bộ phần việc trong tài liệu này |

### "Online" ở đây nghĩa là gì — solo là mặc định, chia sẻ là khoảnh khắc

Làm rõ thêm từ chủ dự án: online **không phải** một thế giới MMO liên tục. Thế giới vẫn là của
riêng từng người — quái của bạn, đồ rơi của bạn. Cái được chia sẻ là **những khoảnh khắc**: ví dụ
một con boss vàng đi vào map, ai đang ở đó thì cùng săn. Ngoài những lúc ấy thì **coi như solo**.

Đây là mô hình rẻ nhất mà vẫn có cảm giác online, và nó thu hẹp phạm vi server xuống rất nhiều:

| | Ai làm chủ | Cần đồng bộ liên tục? |
|---|---|---|
| Quái thường, đồ rơi thường, nhiệm vụ, cày cuốc | **Client** — như hôm nay | Không |
| Boss vàng / sự kiện thế giới | **Server** | Chỉ trong lúc sự kiện diễn ra |
| Vị trí người chơi khác trong cùng map | Server | Chỉ khi đang có sự kiện, hoặc để hiện diện |
| PvP | Server | Chỉ trong trận |
| Giao dịch, kho đồ, tiền tệ | **Server** | Theo thao tác, không theo tick |

Hệ quả về con số: **không cần đồng bộ 60 quái mỗi map ở 20 tick/giây**. Toàn bộ ước lượng băng
thông ở Phần 5 được tính cho mô hình MMO đầy đủ và giờ là thừa. Ở mô hình này, gói tin lớn nhất
là một con boss cộng vài người chơi — hai chữ số byte mỗi tick, không phải bốn.

### Gỡ console cheat KHÔNG làm client đáng tin

Chủ dự án nêu: console chỉ để test, bản online sẽ không bao giờ có. **Đúng và nên làm** — nhưng nó
không giải quyết vấn đề gian lận, vì **devtools của trình duyệt luôn ở đó và không gỡ được**.

Đo thật trên đúng bản phát hành (`RELEASE_BUILD = true`, không `?test=1`, `#cheat-console` đang
`hidden`), chạy trong ngữ cảnh trang y hệt gõ vào F12:

```
window.player        →  "undefined"      ← nhìn qua tưởng an toàn
typeof player        →  "object"         ← nhưng `let player` ở tầng cao nhất vẫn đọc được
player.silver = 1e9  →  1000000000       ✓
gainXp(1e9)          →  cấp 120          ✓
genItem(120,0,'tranai') + gán r4/t10/+11 → "Giáp Hỏa Long r4 t10 +11"  ✓
saveGame()           →  ghi lại nguyên   ✓
```

Chỗ bẫy: `window.player` là `undefined`, nên ai kiểm bằng `window.player` rồi kết luận "an toàn"
là kết luận sai. Khai báo `let` ở tầng cao nhất của script thường **không** gắn vào `window`, nhưng
vẫn nằm trong phạm vi toàn cục mà console truy cập được.

**Hệ quả cho ngã ba ngay dưới đây:** lối B ("chỉ đồ từ nguồn server mới bán được") dựa vào một cái
cờ trên món đồ. Mà client đặt được cờ đó — chính bằng cách trên. Nên B chỉ đứng vững nếu server tự
xác minh nguồn gốc món đồ, tức là B **sụp vào chính A**. Khi đã có giao dịch thì A không phải là
lựa chọn được khuyến nghị, nó là lựa chọn duy nhất chạy được.

Điều này **không** đổi gì với chế độ offline: ở đó người chơi tự phá game của mình, và đó là quyền
của họ.

### Ngã ba phải chọn: đồ kiếm được lúc solo có bán được không?

Đây là chỗ mà "solo là mặc định" đụng vào "có giao dịch", và **không có cách né**:

Nếu đồ rơi lúc solo do client tự quyết (như hôm nay) **và** đồ đó bán được cho người khác, thì bất
kỳ ai mở console cũng đúc được đồ hoàn hảo rồi bơm vào nền kinh tế. Kiểm thống kê không bắt được —
món đồ ấy là thật với mọi người.

Hai lối đi, phải chọn một:

**A. Server sinh mọi vật phẩm, kể cả lúc solo.** Mỗi lần quái chết mà có đồ rơi thì client hỏi
server "cho tôi món đồ của cú giết này", server tự quay và ghi vào kho. Client vẫn chạy toàn bộ
phần còn lại.
*Được:* một hồ vật phẩm duy nhất, mọi thứ bán được, không có luật phụ nào phải giải thích.
*Mất:* mỗi món đồ tốn một vòng đi-về. Ở CCU 50 thì không đáng kể — đây là vài chục request mỗi
giây, không phải vài chục nghìn.

**B. Chỉ đồ từ nguồn server mới bán được.** Đồ solo là "của riêng", đóng dấu không giao dịch; đồ
từ boss vàng, sự kiện, PvP thì bán được.
*Được:* không đụng gì vào đường solo.
*Mất:* hai hạng vật phẩm, người chơi phải hiểu và sẽ khó chịu. Và mọi món đồ trong kho phải mang
thêm một cờ, cùng mọi chỗ hiển thị phải nói rõ nó thuộc hạng nào.

**Kết luận: A, và B không thật sự tồn tại.** Như đo ở mục ngay trên, client đặt được bất kỳ cờ nào
lên bất kỳ món đồ nào qua devtools — nên "đồ có dấu server" chỉ có nghĩa khi **server tự xác minh
nguồn gốc**, tức là đã làm A rồi. Ở quy mô 50 người đồng thời thì giá của A gần bằng không.

### Điều này đổi những gì trong tài liệu

1. **Bậc 1 và 2 không còn là "chuyển đổi", mà là "thêm vào".** Đường chơi offline hôm nay giữ
   nguyên không sửa một dòng. Không di trú, không rủi ro làm hỏng thứ đang chạy. Toàn bộ phần lo
   lắng về việc gánh save cũ sang biến mất.
2. **"Xoá data khi lên online" trở thành hệ quả tự nhiên, không phải một quyết định đau.** Online
   là một hồ nhân vật MỚI, rỗng theo định nghĩa. Chẳng có gì để xoá.
3. **CCU 50 nay là 50 người ONLINE đồng thời.** Người chơi offline không tốn của server một byte
   nào. Ước lượng quy mô ở Phần 5 vốn đã dư, giờ dư hơn nữa.
4. **Console cheat ship lên production không còn là lỗ hổng chặn đường.** Ở offline nó chỉ tự hại
   người dùng, mà đó là lựa chọn của họ. Ở online thì server không tin client nên nó vô nghĩa. Vẫn
   nên gỡ khỏi bản online, nhưng nó không còn là việc phải làm trước.
5. **Rủi ro mới: hai nhánh code trôi xa nhau.** Mỗi lần cân bằng lại sát thương hay thêm chiêu là
   phải đúng ở cả hai nơi, không thì nhân vật online và offline chơi ra hai game khác nhau.

Điểm 5 chính là chỗ mà kết luận trung tâm của tài liệu trả công: **`game.js` chạy được nguyên xi
trên Node**. Nếu cùng một file chạy cả hai phía thì không có hai nhánh nào để trôi — khác biệt duy
nhất là **ai chạy nó và ai được tin**. Đó là lý do đáng đầu tư một tuần tách `killMob` thành
`computeKillRewards()` thuần + `applyRewards()` trước mọi thứ khác: hàm thuần đó là thứ chạy chung
cho cả hai chế độ.

### Việc kéo theo từ "PC only"

Phần 1 chỉ ra `index.html` có `<div id="joystick">`, viewport khoá `user-scalable=no`, và
`CLAUDE.md` có một luật về thứ tự phím J vì điện thoại. Chủ dự án xác nhận **PC only**, nên đó là
tàn dư nên dọn — nhưng dọn ở một đợt riêng, không gộp vào việc lên online.

### Ưu tiên đổi theo

1. **Bậc 2 (chuẩn hoá CSDL) — làm ngay.** `SAVE_VERSION 3` vừa xoá sạch save, và alpha thì không
   nợ ai tiến trình nào. Đây là lúc rẻ nhất trong cả vòng đời dự án.
2. **Sinh vật phẩm + cộng tiền tệ lên server** — điều kiện tối thiểu để mở giao dịch.
3. **Rồi mới tới PvP authoritative.**
4. **Bậc 6 (Castle Siege) vẫn không đáng làm.** Nó cần ≥80 người cùng khung giờ; ở CCU 50 thì
   chạy với 6 người, tệ hơn là không có.

### Lỗ hổng phải vá trước khi mở bất cứ thứ gì online

Phần 3 ghi lại hai chỗ đã kiểm chứng bằng cách chạy thật. Cả hai đều vô hại ở game
single-player và **thành nghiêm trọng ngay khi có giao dịch**:

- Console cheat ship lên production, không cần cờ nào vẫn `player.silver = 1e9` được.
- `api/saveRouter.ts` parse chính blob save do client gửi để cập nhật bảng xếp hạng, và một lần
  gửi `savedAt` cực lớn sẽ khoá vĩnh viễn mọi save hợp lệ sau đó của tài khoản đó. *(Đính chính so
  với bản gốc: cả hai đều đi qua `authedQuery` với `ctx.user.id`, nên chỉ tự hại tài khoản của
  chính mình được, không chạm được tài khoản người khác.)*

---

## 0. Kết luận trước, lý do sau

**Nên làm, nhưng không phải bằng cách bạn đang nghĩ.**

Ba điều quan trọng nhất:

1. **Cái vỡ không phải "game này chưa online". Cái vỡ là game hoàn toàn không có tuyến phòng thủ nào.**
   Tôi mở bản production build (`RELEASE_BUILD = true`, không có `?test=1`), gõ vào console
   `player.silver = 1e9` → thành công. `gainXp(1e9)` → cấp 1 nhảy thẳng lên 120. `genItem(120,0,'tranai')`
   rồi gán `rarity=4; tier=10; plus=11` → có ngay một món đồ đỉnh. Gọi `saveGame()` → nó nằm vĩnh viễn
   trong `localStorage`. Đây không phải suy đoán, tôi chạy thật và có log.
   Tệ hơn: **console cheat được ship lên production**, chỉ khoá bằng query string — thêm `?test=1`
   vào URL là có `/silver 999999999`, `/lv 120`, `/item`, `/god`, `/fullskill`.

2. **Backend hiện KHÔNG nằm trên đường đi của người chơi — không phải "chưa dùng", mà là "không tồn tại trên production".**
   `deploy/nginx-server-block.conf` (bản chép nguyên văn từ VPS) chỉ có:
   ```nginx
   root /var/www/axiewuxia/public/game;
   location / { try_files $uri $uri/ =404; }
   ```
   Không có `location /api`, không có `proxy_pass`. Toàn bộ Hono + tRPC + Drizzle + MySQL,
   `saveRouter`, `leaderboardRouter`, `walletRouter`, `auth-router`, `googleRouter`, `npcRouter`
   **không nhận một request nào** từ người chơi thật. Và ngay cả nếu có, `game.js` chỉ gửi
   `postMessage('vlcm:save')` khi `window.parent !== window` (dòng 4609) — trên production game
   chạy ở cửa sổ gốc, không nằm trong iframe, nên móc đồng bộ cloud **chưa từng bắn một lần nào**.

3. **Nhưng phần khó nhất của việc lên online thì hoá ra đã gần xong mà không ai biết.**
   Tôi nạp thẳng `game.js` vào Node bằng `vm.runInContext` với **một lớp giả DOM/canvas/audio dài 65 dòng**.
   Nó chạy. `newPlayer()` → `buildWorld()` → 60 quái → 600 tick `update(1/20)` → `hurtMob()` → `killMob()`
   → rơi đồ xuống đất → cộng bạc, cộng EXP. **Không cần trình duyệt, không cần build step, không sửa một dòng.**
   Chi phí ổn định: **3–4 µs cho mỗi tick** của một map 60 quái.
   ⇒ Câu "muốn online thì phải viết lại phần mô phỏng" là **SAI** với dự án này. Chi tiết ở [Phần 6](#6-câu-hỏi-khó-có-giữ-được-gamejs-không).

**Khuyến nghị ngắn gọn:** đừng nhảy thẳng lên authoritative server. Đi theo bậc thang ở
[Phần 5](#5-lộ-trình-từng-bậc--được-gì-tốn-gì-rủi-ro-gì). Bậc 0 và 1 (khoảng 3–5 người-tuần) trả lại
giá trị lớn nhất trên mỗi đồng bỏ ra. Bậc 4 (server mô phỏng thật) chỉ đáng làm nếu bạn trả lời được
"có" cho ít nhất một trong ba câu ở [Phần 7](#7-những-câu-hỏi-chỉ-chủ-dự-án-trả-lời-được).

---

## 1. Đối chiếu dữ kiện khởi đầu với code thật

| Bạn nói | Thực tế | Kết luận |
|---|---|---|
| `game.js` ~18.700 dòng | **18.915 dòng**, 1.177.320 byte thô / 373.892 byte gzip | ✅ đúng |
| canvas 2D thuần, không build step | Đúng. `index.html` nạp 5 file `<script>` thường: `strings/en.js`, `strings/vi.js`, `i18n.js`, `lang.js`, `game.js` | ✅ đúng |
| "toàn bộ trạng thái nằm trong một object `player` toàn cục" | Gần đúng nhưng **thiếu**. `player` có 159 khoá lúc chạy. Nhưng còn 6 biến toàn cục nữa **cũng nằm trong save**: `questIdx`, `questProg`, `questState`, `victory`, `curMap`, `sideStates` (xem `saveGame()` dòng 4600–4606). Và một tầng nữa **không** nằm trong save nhưng vẫn là trạng thái thế giới: `mobs`, `projectiles`, `groundLoot`, `effects`, `decor` (dòng 3789, 5454) | ⚠ chỉnh lại |
| `localStorage['vlcm_save']`, `SAVE_VERSION = 3` | ✅ dòng 4598, 4607 | ✅ đúng |
| Client tự quyết mọi thứ | ✅ và còn nặng hơn mô tả — xem [Phần 3](#3-cái-gì-vỡ-khi-lên-online-danh-sách-hàm-cụ-thể) | ✅ đúng |
| Backend thật nhưng game không dùng | **Nặng hơn thế.** Không phải "game không gọi" mà là **nginx production không định tuyến `/api` đi đâu cả**. Node server không chạy trên đường đi của người chơi | ⚠ nghiêm trọng hơn mô tả |
| `db/` đã có bảng | **Đúng 3 bảng, tổng 77 dòng**: `users`, `saves`, `leaderboard`. 2 file migration | ✅ đúng, nhưng ít hơn tưởng |
| nginx phục vụ thẳng `public/game` | ✅ xác nhận từ `deploy/nginx-server-block.conf` | ✅ đúng |
| Móc `postMessage` `vlcm:save` / `vlcm:cloud-load` | ✅ tồn tại (game.js 4610, 17159, 17180; `src/pages/GamePage.tsx` 94/149/155) — **nhưng chết trên production** vì không có iframe | ⚠ chỉnh lại |
| Game PC-only | **SAI.** `index.html` có `<div id="joystick">` + `<div id="joy-knob">`, `viewport` khoá `maximum-scale=1.0, user-scalable=no`, và `CLAUDE.md` có nguyên một luật về "điện thoại không có cách nào nhặt" nếu sai thứ tự phím J. Có nghĩa là **có đường chơi trên di động** và nó ảnh hưởng trực tiếp tới thiết kế mạng (mạng 4G Việt Nam: RTT 60–150 ms, mất gói) | ❌ sai |
| Tiếng Việt là ngôn ngữ chính | ✅ nhưng có hạ tầng i18n đầy đủ (`i18n.js`, `strings/en.js`, `strings/vi.js`) | ✅ đúng |

**Hai điều nữa bạn không nhắc mà rất quan trọng:**

- **Game đã là tribute MU Online rồi.** `CLAUDE.md` Quy tắc số 1: phong cách đã chuyển hẳn sang MU
  (Dark Knight / Dark Wizard / Dark Lord / Sylvan Ranger / Spellblade, reset "Tẩy Tủy", rèn +0..+11 với
  +7 là ngưỡng phát sáng, Lò Hỗn Độn = Chaos Machine, Đấu Trường Tế Thần / Pháo Đài Máu = Devil Square /
  Blood Castle đổi tên). Nghĩa là **câu hỏi thật sự không phải "làm sao giống MU", mà là "làm sao có NGƯỜI THẬT trong đó"**.
- **Comment trong `db/schema.ts` nói sai về chính nó.** Nó ghi save là *"JSON string, LZ-compressed by
  the game client"*. Không có nén. `saveGame()` chỉ `JSON.stringify`. Ai đọc schema rồi tính dung lượng
  DB theo comment đó sẽ tính hụt ~3 lần.

---

## 2. MU Online thật sự vận hành thế nào

⚠ **Cảnh báo về nguồn.** `WebFetch` bị chặn với hầu hết wiki MU (`muonlinefanz.com`, `munique.net`,
`munique.github.io`, `kungfudev.com` — đều trả `EGRESS_BLOCKED`). Phần lớn thông tin dưới đây tôi lấy
qua **bản tóm tắt của công cụ tìm kiếm** chứ không đọc được trang gốc. Thứ duy nhất tôi đọc được
nguyên văn là `docs/GameMap.md` của OpenMU qua `raw.githubusercontent.com`. Tôi đánh dấu độ tin cậy
từng mục.

### 2.1 Năm tiến trình, và vì sao lại tách

*(Độ tin cậy: trung bình — khớp giữa nhiều nguồn thứ cấp, nhưng không đọc được tài liệu gốc của Webzen.)*

| Tiến trình | Việc | Cổng mặc định |
|---|---|---|
| **ConnectServer** | Cổng vào duy nhất. Quản lý phiên bản client + **danh sách server**. Client chỉ cần biết đúng một IP này | 44405 |
| **JoinServer** | Xác thực tài khoản (và tính cước khi vận hành thương mại) | — |
| **GameServer** | Bản mô phỏng thế giới thật: map, vị trí, quái, vật phẩm, di chuyển, chiến đấu, giao dịch, chat, kỹ năng. Giữ TCP thường trực suốt phiên chơi | 55901 |
| **DataServer** | Đọc/ghi dữ liệu nhân vật xuống DB | — |
| **ChatServer** | Kênh chat giữa người chơi | — |

**Lý do tách — đây mới là bài học đáng lấy, không phải cái bảng trên:**

1. **ConnectServer tách ra để đổi hạ tầng mà không đụng client.** Client cắm cứng IP ConnectServer.
   Thêm/bớt/di chuyển GameServer là chuyện của ConnectServer, người chơi không cần cập nhật gì.
   Sau khi chọn server, kết nối tới ConnectServer thường đóng luôn.
2. **JoinServer tách ra vì tài khoản và nhân vật có vòng đời khác nhau.** Tài khoản sống lâu hơn
   thế giới; thanh toán/khoá tài khoản phải làm được **trong khi** GameServer đang chạy.
3. **DataServer tách ra để GameServer không bao giờ chờ đĩa.** Vòng lặp thế giới là vòng lặp thời gian
   thực; một truy vấn DB chậm 200 ms mà nằm trong tick là cả map khựng.
4. **ChatServer tách ra vì chat là thứ **duy nhất** đi xuyên qua mọi map và mọi channel.**

> 💡 **Áp vào dự án này:** bạn **không cần** 5 tiến trình. Ở quy mô một VPS, gộp Connect+Join thành
> một dịch vụ "cổng vào", và tách **đúng một ranh giới**: **vòng lặp thế giới không được chạm DB trực tiếp**.
> Đó là bài học có giá trị nhất trong cả kiến trúc MU, và nó tốn gần như 0 đồng để làm đúng từ đầu.

**Nguồn:** [ajudaemmuonline.blogspot.com — Estrutura do MuServer](https://ajudaemmuonline.blogspot.com/2014/03/estrutura-do-muserver.html) ·
[kungfudev — Building a MU Online Server in Rust](https://www.kungfudev.com/blog/2026/02/18/mu) (đọc qua tóm tắt) ·
[MUnique/OpenMU](https://github.com/MUnique/OpenMU)

### 2.2 Channel / sub-server và giới hạn người mỗi map

*(Độ tin cậy: thấp cho con số cụ thể.)*

- Nhiều **sub-server (channel)** cùng chạy một bộ nội dung, phân biệt bằng `ServerCode` + `GameServerPort`
  trong file `ServerInfo`. Thêm channel = copy một dòng cấu hình, đổi code và cổng.
  ([IGCN — Adding sub server within a realm](https://www.igcn.mu/guides/server_configuration/adding-sub-server-within-a-realm-r18/),
  [RaGEZONE — Making Subservers](https://forum.ragezone.com/threads/making-subservers.594473/))
- ⚠ **CHƯA KIỂM CHỨNG:** tôi **không** tìm được con số chính thức cho `MaxUserNum` / số người tối đa
  mỗi map trong MU. Đừng trích con số nào của MU cho khoản này. Tôi sẽ tự tính giới hạn cho *game này*
  từ kích thước map thật ở [Phần 4.5](#45-số-người-tối-đa-mỗi-map--tính-từ-map-thật).

### 2.3 Cách MU quản lý "ai nhìn thấy ai" — phần đáng học nhất

*(Độ tin cậy: **cao** — đọc nguyên văn `docs/GameMap.md` của OpenMU.)*

OpenMU dùng `AreaOfInterestManager`; bản mặc định là `BucketAreaOfInterestManager`:

- Map 256 × 256 ô được chia thành các **bucket 8 × 8 ô**.
- Người chơi/observer **đăng ký sự kiện vào/ra bucket**, không so khoảng cách với từng đối tượng.
- Cập nhật tầm nhìn chỉ kích hoạt **khi băng qua biên bucket**, không phải mỗi khung hình.
- Lý do trong chính tài liệu: so khoảng cách trực tiếp là **O(n²)** khi đông đối tượng trên một map.
  Bucket đổi lấy thêm bộ nhớ và chậm hơn trên map thưa, nhưng thắng lớn trên map đông.

**Nguồn:** [OpenMU docs/GameMap.md](https://raw.githubusercontent.com/MUnique/OpenMU/master/docs/GameMap.md)

### 2.4 Giao thức gói tin

*(Độ tin cậy: trung bình — nhiều nguồn thứ cấp khớp nhau.)*

- `C1` — độ dài 1 byte, gói ≤ 255 byte. `C2` — độ dài 2 byte, gói ≤ 65.535 byte.
- `C3`/`C4` giống `C1`/`C2` về độ dài nhưng **có mã hoá** (Simple Modulus).
- Chiều client→server còn thêm XOR32.
- Header 3–5 byte, có **hai tầng định danh**: byte nhóm (group/code) rồi byte phụ (sub-code) → định tuyến sạch.

**Bài học lấy được (không phải copy giao thức):** dùng **định danh hai tầng** (nhóm + mã) cho message,
và **gói có độ dài đứng trước**. Cả hai cực rẻ và cứu bạn khi phải thêm message mới mà không phá client cũ.
**Đừng copy phần mã hoá** — nó là di sản 1999, ngày nay `wss://` (TLS) giải quyết tốt hơn và miễn phí công sức.

**Nguồn:** [darfink/muonline-packet](https://github.com/darfink/muonline-packet) ·
[RaGEZONE — C1/C2/C3/C4 Packet Enc/Dec](https://forum.ragezone.com/threads/c1-c2-c3-c4-packet-encryption-decryption-source-code-c.291106/)

### 2.5 Các hệ "thi đấu" của MU

*(Độ tin cậy: thấp–trung bình cho con số; các con số dưới đây **khác nhau giữa server chính thức và
private server**, nên coi là tham chiếu thiết kế chứ không phải chuẩn.)*

| Hệ | Cơ chế cốt lõi | Con số (⚠ khác nhau theo server) |
|---|---|---|
| **Chaos Castle** | PvP + PvM trong một đấu trường đóng. Người cuối cùng đứng vững thắng; hết giờ thì tính **điểm sự kiện** (giết người chơi/quái) | tối đa ~70 người/lượt · tối thiểu 2 người (không đủ thì hoàn phí) · 4 lượt/ngày |
| **Blood Castle** | **Đua PvM**: lấy một vật phẩm đặc biệt mang về cho NPC. Thưởng theo **tỉ lệ đóng góp** (hộp thưởng đổi bậc theo đóng góp) | 3 lượt/ngày, reset 00:00 giờ server |
| **Devil Square** | Bãi cày theo **khung cấp**, chia nhiều bậc | 10 người (bản chính thức) · 15–20 (private server) |
| **Castle Siege** | Guild chiến 2 tiếng ở Valley of Loren. 1 guild giữ thành, **3 liên minh** đánh. Đăng ký ở NPC Guard, cần **liên minh ≥ 1 guild khác + ≥ 20 thành viên**, nộp Sign of Lord (nộp nhiều nhất → được vào top 3 công thành). Chiếm thành: **hai công tắc phải được nhấn bởi người cùng liên minh**, giữ nguyên vị trí → hàng rào quanh vương miện hạ → **guild master giữ vương miện 30 giây** | 2 giờ/lượt |
| **Personal Store / Trade** | Cửa hàng cá nhân (bày bán tại chỗ) + cửa sổ trao đổi 1-1 | — |

**Ba mẫu thiết kế đáng lấy, không phải ba cái tên:**

1. **Giới hạn lượt/ngày thay cho giới hạn thời gian.** Reset 00:00 giờ server. Game này **đã có sẵn**
   mẫu đó (`player.daily = { day, kills, ... }`, `player.chinhPhat = { date, count }`).
2. **Thưởng theo tỉ lệ đóng góp, không theo "ai giết phát cuối".** Đây là thứ khiến sự kiện MU
   không biến thành cuộc đua kill-steal.
3. **Điều kiện thắng phải cần ≥ 2 người ở 2 chỗ khác nhau** (hai công tắc Castle Siege). Đây là mẹo
   thiết kế rẻ tiền nhất để ép hợp tác thật, không phải "đông người hơn thì thắng".

**Nguồn:** [Chaos Castle — muonlinefanz](https://muonlinefanz.com/guide/minigame/cc/) ·
[Devil Square — Mu Online Wiki](https://muonline.fandom.com/wiki/Devil_Square) ·
[Castle Siege — StrategyWiki](https://strategywiki.org/wiki/Mu_Online/Castle_Siege) ·
[Castle Siege — muonlinefanz](https://muonlinefanz.com/guide/minigame/cs/) ·
[Blood Castle — EpicMU](https://guides.epicmu.net/non-pvp-events/blood-castle)

### 2.6 MU đã bị dupe đồ như thế nào — và cách chặn

*(Độ tin cậy: trung bình.)*

Ba lỗ hổng có ghi nhận:

1. **Huỷ giao dịch không xoá đồ khỏi bộ nhớ.** Server không lường trước việc người chơi *vẫn giữ*
   món đồ trong lúc trade → huỷ trade là nhân đôi. Hậu quả có ghi nhận: ngọc tràn thị trường.
2. **Đăng nhập một tài khoản hai lần cùng lúc** (bản đầu, trước map Atlans) → trade cùng một món cho
   hai nhân vật.
3. **Chương trình ngoài thao túng cửa sổ trade** để nhận đồ mà không đưa đồ.

Biện pháp được nhắc: khoá nút xác nhận ~10 giây khi có thay đổi; **chỉ cho phép chức năng NPC khi
hộp thoại NPC đang mở**; **không cho mở hộp thoại NPC và trade cùng lúc**.

> 💡 **Bài học đúng, phát biểu lại cho ngôn ngữ hiện đại:** cả ba lỗi đều là **một lỗi duy nhất** —
> *món đồ tồn tại ở hai nơi cùng lúc*. Cách chặn tận gốc không phải là khoá nút hay chống chương trình
> ngoài, mà là: **món đồ là một hàng trong DB, và nó có đúng MỘT chủ sở hữu, đảm bảo bằng ràng buộc của DB,
> không phải bằng logic ứng dụng.** Xem [Phần 4.3](#43-chống-nhân-bản-đồ--ràng-buộc-db-chứ-không-phải-logic-ứng-dụng).
> Và: **một nhân vật chỉ được có một phiên sống tại một thời điểm** — đó là lời giải cho lỗ hổng #2,
> ở tầng phiên chứ không phải tầng trade.

**Nguồn:** [munique.net — On item duplication exploits](https://munique.net/item-duplication-exploits/) (đọc qua tóm tắt) ·
[Webzen — Regarding illegal activity regarding Item Trade](https://muonline.webzen.com/en/news/notices/all/32194/regarding-illegal-activity-regarding-item-trade)

### 2.7 MU chống speed-hack / teleport-hack ra sao

*(Độ tin cậy: thấp — chủ yếu là lời khuyên chung của cộng đồng, không phải tài liệu kỹ thuật.)*

Cách được nhắc nhiều nhất: server ghi lại **thời điểm + toạ độ** mỗi lần nhận move-request, và
kiểm tra quãng đường trên mỗi đơn vị thời gian ở request kế tiếp.

> ⚠ **Đây là mẫu thiết kế YẾU và tôi khuyên không copy.** Nó vẫn coi client là nguồn của toạ độ, rồi
> đi *phát hiện* gian lận sau. Game này có một lợi thế mà MU không có — xem [Phần 4.4](#44-đồng-bộ-vị-trí--game-này-có-một-lợi-thế-mu-không-có).

**Nguồn:** [smartfoxserver forum — MMO Player Movement hacking](https://www.smartfoxserver.com/forums/viewtopic.php?t=20851)

---

## 3. Cái gì VỠ khi lên online — danh sách hàm cụ thể

### 3.1 Bức tranh bằng số

Đo trên `game.js` (18.915 dòng):

| Chỉ số | Giá trị |
|---|---|
| Hàm khai báo ở cột 0 (`function x(`) | **540** |
| Hàm gắn lên `window.*` (gọi được từ console/HTML) | **114** |
| Lời gọi `Math.random()` | **141** |
| Vị trí gán/cộng/trừ vào `player.*` | **731** |
| Trường `player.*` phân biệt | **188** (object thật lúc chạy: **159 khoá**) |
| Riêng vị trí đụng `player.silver` | **107** |
| **Hàm chạm RNG hoặc trạng thái có giá trị (⇒ phải chuyển sang server)** | **84 hàm / 3.680 dòng** |

Phân rã 84 hàm đó theo mức độ dính vào phần vẽ:

| Nhóm | Hàm | Dòng | Nghĩa là gì |
|---|---|---|---|
| **A. Đã thuần Node** | 27 | 787 | Chạy được trên server **hôm nay**, không sửa gì |
| **B. Chỉ dính 4 "ống phản hồi"** | 32 | 2.286 | `addFloat` / `addEffect` / `AudioSys.sfx` / `logCombat` (+ `shakeT`/`swingFeel`). Thay 4 cái này bằng một emitter là xong |
| **C. Dính DOM thật** | 25 | 607 | Toàn bộ là handler `window.doX()` của UI (mua bán, rèn, nâng cấp) — kết thúc bằng `renderX()` |

⇒ **Chỉ 607 dòng thật sự vướng DOM, và chúng nằm ở lớp ngoài cùng, không phải trong lõi mô phỏng.**

### 3.2 Bảng "hàm nào phải lên server, và gian lận được kiểu gì nếu để nguyên"

Tất cả các cách gian lận dưới đây tôi **chạy thật** trên bản `RELEASE_BUILD = true`, **không** có
`?test=1`, trong console DevTools. Log ở [Phụ lục A](#phụ-lục-a--cách-đo-lại-mọi-con-số).

> **Ghi chú kỹ thuật quan trọng:** `player` khai báo bằng `let player = null;` ở cột 0 (dòng 3788).
> Vì đây là `let` ở top-level của một classic script, nó **không** tạo ra `window.player`
> (`typeof window.player === "undefined"`) — nhưng **console DevTools đánh giá trong global scope**,
> nên gõ trần `player` vẫn ra object. Ai kiểm tra bằng `window.player` rồi kết luận "an toàn" là sai.

#### Nhóm 1 — Tiền tệ & tài nguyên

| Hàm | Dòng | Làm gì | Gian lận kiểu gì |
|---|---|---|---|
| `killMob` | 5908–6139 | Cộng bạc, EXP, ✦Huyền Thiết, ◆Tu La, ❖Hỗn Nguyên, ◈Đá Thăng Cấp, 💠Tâm Đắc, Lõi Nguyên Tố, Mảnh Cổ Thần… trong **một hàm 232 dòng** | Mở console: `player.silver = 1e9` — xong. Hoặc tinh vi hơn: `mobs.forEach(m => killMob(m,'hit'))` để "giết" cả map và ăn trọn bảng rơi mà không đánh một cú nào. **Đã chạy thật, thành công.** |
| `buyFromShop` | 15250–15315 | 14 chỗ trừ `player.silver` | `player.silver = 1e9` rồi mua sạch. Hoặc sửa thẳng `SHOP_ROWS` trong bộ nhớ để giá về 0. |
| `sellItem` / `sellJunk` | 4174–4192 / 15316–15324 | Cộng bạc theo `rarity`/`tier` | Nhét đồ giả vào `player.inv` (tự chế object) rồi bán → in tiền. |
| `gainXp` | 6140–6155 | Cộng EXP, lên cấp, mở khoá kỹ năng | `gainXp(1e9)` → **cấp 1 lên thẳng 120 trong một lời gọi. Đã chạy thật.** |
| `grantOfflineGains` | 17615–17627 | Thưởng thời gian offline | Sửa `savedAt` trong `localStorage` lùi lại 10 năm → nhận thưởng offline 10 năm. |
| `dailyCheckReward` / `truynaClaim` / `deepLeave` | 17832 / 18726 / 17362 | Thưởng ngày, Truy Nã, Tầng Sâu | `player.daily.day = ''` → nhận lại thưởng ngày vô hạn. |

#### Nhóm 2 — RNG (rơi đồ, rèn, sinh vật phẩm)

| Hàm | Dòng | RNG | Gian lận kiểu gì |
|---|---|---|---|
| `genItem` | 3889–3917 | 6 lần `Math.random()` | `const it = genItem(120,0,'tranai'); it.rarity=4; it.tier=10; it.plus=11; rerollItemRarity(it); player.inv.push(it);` → **đúc ra món đỉnh trong 1 dòng. Đã chạy thật:** ra `Ủng Hắc Nguyệt r4 t10 +11`. |
| `rollRarity` / `rollRaritySrc` / `rollSubs` / `rollExcLines` / `genAncient` | 3874 / 139 / 181 / 171 / 3919 | mỗi cái 1–2 lần | Ghi đè `Math.random = () => 0.999` trước khi mở Bảo Hạp → mọi lần roll đều cực phẩm. |
| `chaosResolveEnhance` | 11823–11866 | `Math.random()*100 < rate` | `Math.random = () => 0` → rèn +11 **100% thành công**, không bao giờ vỡ đồ. Toàn bộ vòng lặp kinh tế cuối game sụp trong 1 dòng. |
| `forgeRule` | 11273–11279 | trả bảng tỉ lệ | Ghi đè `window.forgeRule = () => ({rate:100,mat:0,tuLa:0,hon:0,fail:'none'})` → rèn miễn phí, không rủi ro. |
| `doTanPham` | 11293–11313 | `Math.random()*100 < r.rate` | Cùng chiêu; ngoài ra bỏ qua luôn khâu trừ nguyên liệu bằng cách gán `player.mats` trước. |
| `rollJewels` / `rollSigil` / `rollTrait` / `rollVanDuyen` / `rollKyngo` / `openBaoHap` | 115 / 3643 / 16978 / 18868 / 17097 / 18274 | mỗi cái 1–6 | Khắc Ấn là thứ hiếm nhất game (12 cái, mỗi lớp dùng 4). `rollSigil` gọi trực tiếp là có ngay. |

#### Nhóm 3 — Sát thương & chiến đấu

| Hàm | Dòng | Làm gì | Gian lận kiểu gì |
|---|---|---|---|
| `hurtMob` | 5754–5907 | **Điểm áp sát thương DUY NHẤT của toàn game** (154 dòng: khắc hệ, áp bức võ công, hoàn hảo, xuyên giáp, phá khiên, giáp quái, hút máu, Khắc Ấn) | `hurtMob(mobs[0], 1e9, 'hit')` → one-shot mọi thứ kể cả boss cuối. **Đã chạy thật.** Hoặc `mobs.forEach(m => hurtMob(m, 1e9, 'crit'))`. |
| `calcDerived` | 4296–4506 | Tính **mọi chỉ số** từ trang bị/bộ/Khắc Ấn/Thú Chiến | `player.atk = 1e9; player.crit = 1;` rồi **đừng** gọi `calcDerived()` nữa. Hoặc thay hẳn: `window.calcDerived = () => { player.atk = 1e9; player.maxHp = 1e9; }`. |
| `castSkill` | 14882–15070 | Trừ mana, đặt CD, sinh đạn | `player.cd = new Proxy({}, {get:()=>0})` → mọi kỹ năng không cooldown. `player.qi = 1e9` → vô hạn mana. |
| `doBasic` | 6381–6428 | Đòn thường + bạo kích | Sửa `player.aspdPct` → tốc đánh vô hạn. |
| `usePotion` | 6366–6380 | Trừ bình, hồi máu | `player.potions = 1e9`. Hoặc `player._god = true` (biến này **có thật trong bản release**, chỉ là vòng `setInterval` hồi máu ở dòng 12686 mới bị khoá sau `TEST_MODE`). |
| `update` | 6863–7615 | Vòng lặp 753 dòng: di chuyển, va chạm, AI quái, đạn, auto-farm, hồi phục, đồng hồ thế giới | `player.speed = 99999` → dịch chuyển tức thời. `update(9999)` → chạy 9999 giây thế giới trong 1 khung. |

#### Nhóm 4 — Kho đồ & trang bị

| Hàm | Dòng | Gian lận kiểu gì |
|---|---|---|
| `equipItem` / `unequip` / `autoEquipBest` | 14729 / 14747 / 4214 | `player.equip.vukhi = {…}` gán thẳng object tự chế, bỏ qua mọi kiểm tra khoá lớp (`itemUsable`) — Dark Wizard cầm kiếm Dark Knight. |
| `destroyItem` / `salvage` | 11384 / 14753 | Không quan trọng khi gian lận, nhưng **quan trọng khi lên online**: đây là chỗ đồ biến mất, phải có log. |
| `dropToGround` / `takeLoot` | 5466 / 5510 | `groundLoot` không lưu save. Online thì nó phải là **trạng thái server có chủ sở hữu** (ai nhặt được, sau bao lâu thì mở cho mọi người). |

#### Nhóm 5 — Cửa hậu đã ship lên production

| Thứ | Dòng | Mức nguy hiểm |
|---|---|---|
| **`cheatExec` — console cheat đầy đủ** | 12711–12850 | **Nghiêm trọng.** Bật bằng `?test=1` hoặc `?max=1` trên URL production (dòng 12633). `CLAUDE.md` còn ghi đây là tính năng cố ý: *"Bản phát hành vẫn mở cho người chơi chủ động trải nghiệm full: thêm `?test=1`"*. Lệnh có: `/silver`, `/lv`, `/item`, `/god`, `/fullskill`, `/phi`, `/boss`, `/seal`, `/speed`, `/kill`, `/wipe`. **Đã chạy thật với `?test=1`: `/silver 999999999` + `/lv 120` → thành công.** |
| **`applyTestBoost`** | 12252–12333 | Cấp 120 + full trang bị + 999999 bạc trong một lời gọi. Gọi được từ console **kể cả không có `?test=1`**. |
| **Dịch chuyển tự do mọi map** | 16254–16256 | `TEST_MODE` bỏ qua điều kiện mở map/phó bản. |

#### Nhóm 6 — Đường ghi cloud (nếu Bậc 1 được bật)

`api/saveRouter.ts` `put` chỉ kiểm **hai** thứ: `data` là string ≤ 2.000.000 ký tự, và `savedAt` là
số nguyên không âm. Sau đó nó **parse chính cái blob đó** để cập nhật bảng xếp hạng:

```ts
const p = JSON.parse(input.data)?.player;
if (p && typeof p.level === "number") {
  await upsertLeaderboard(ctx.user.id, { sect: …, level: p.level, realm: p.dantian?.realm ?? 0, kills: p.kills ?? 0 });
}
```

⇒ **Bảng xếp hạng hiện là "người chơi tự khai".** Gửi `{"player":{"level":999999,"kills":999999}}` là
lên đỉnh bảng, không cần chơi một phút nào. Và vì `savedAt` cũng do client gửi, gửi `savedAt: 9e15`
sẽ **khoá vĩnh viễn** mọi save hợp lệ sau này của chính tài khoản đó (điều kiện
`existing.savedAt > input.savedAt` sẽ luôn đúng).

### 3.3 Ba lỗi cấu trúc sẽ nổ ngay ngày đầu lên online

1. **`uid` vật phẩm là bộ đếm CỤC BỘ của từng client.** `genItem` dùng `uid: itemSeq++` (dòng 3906),
   và `loadGame` khôi phục `maxUid` bằng cách quét kho của **chính người đó** (dòng 4799–4800).
   ⇒ Hai người chơi bất kỳ đều có món `uid: 1`, `uid: 2`… Ghép chung một DB là đụng khoá ngay lập tức.
   **Không có đường vá tại chỗ** — id phải do server cấp.
2. **Vật phẩm mang theo cả chuỗi hiển thị tiếng Việt.** Một món đồ mặc trên người serialize ra
   **460 byte**, trong đó **92 byte (20%) là chữ tiếng Việt** (`slotName`, `name`, `main.name`,
   `subs[].name`, `awakened.name`) — thứ suy ra được từ `def` + `k`. Dạng gọn: **116 byte** (giảm 4×).
   Nhân với 30 ô túi × N nghìn nhân vật thì đây là tiền thật.
3. **Sự kiện thế giới tính từ `Date.now()` của MÁY CLIENT.** `CLAUDE.md` ghi rõ: *"Không lưu state sự
   kiện — mốc giờ tính lại được từ đồng hồ thật"*. Online thì đổi giờ máy là mở Hung Thần Giáng Thế /
   Xâm Lăng Vàng bất cứ lúc nào. Phải chuyển sang **giờ server**, và đó là một thay đổi bắt buộc,
   không phải tuỳ chọn.

---

## 4. Thiết kế cấu trúc dữ liệu

Viết theo Drizzle (dự án đang dùng `drizzle-orm` + `mysql2`, `dialect: "mysql"`).
Bản đầy đủ chạy được: [`online-samples/schema.sample.ts`](online-samples/schema.sample.ts).

### 4.1 Nguyên tắc trước, bảng sau

1. **Vật phẩm là HÀNG trong DB, không phải object trong JSON.** Đây là ranh giới giữa "có thể chống
   dupe" và "không thể".
2. **Tiền tệ không bao giờ được `SELECT` rồi `UPDATE`.** Xem [4.4](#44-tiền-tệ-chống-race-condition).
3. **Mọi thay đổi tiền/đồ đều ghi sổ cái append-only.** Không có sổ cái thì không truy vết được
   gian lận, và bạn sẽ phát hiện ra điều đó **sau khi** đã bị dupe.
4. **Thứ nào không tra cứu được thì đừng chuẩn hoá.** `player` có 159 khoá; phần lớn là cờ tiến trình
   (`storyFlags`, `wpUnlocked`, `dhHate`, `hintCd`…). Nhét hết vào bảng riêng là tự hành. Chúng đi vào
   **một cột JSON** `progress_blob`, có phiên bản.

**Ranh giới quyết định:** *"cái này có bao giờ xuất hiện trong một truy vấn `WHERE` / `ORDER BY` / `JOIN` không?"*
Có → cột. Không → JSON.

| Thuộc về cột riêng | Thuộc về JSON |
|---|---|
| level, exp, sect, tiền tệ, item slot/rarity/tier/plus, guild, giá bán ở chợ | `storyFlags`, `clues`, `wpUnlocked`, `dhHate`, `hintCd`, `autoCfg`, `abode`, `meridians`, `noidan`, `skillEvo` |

### 4.2 Sơ đồ bảng

```
accounts ─┬─ characters ─┬─ character_currencies   (một hàng / loại tiền)
          │              ├─ character_progress     (blob JSON có version)
          │              ├─ character_skills
          │              ├─ character_quests
          │              ├─ character_equipment    (PK: character_id + slot)
          │              └─ guild_members ── guilds
          ├─ account_sessions   (một phiên sống / nhân vật — chặn double-login)
          └─ friendships

items ────┬─ item_mods            (dòng phụ, 0..4 hàng / món)
          └─ (owner_character_id, location)

currency_ledger   (append-only, có idempotency key)
item_ledger       (append-only)
trade_sessions ── trade_offers
market_listings ── market_sales
```

### 4.3 Trang bị: vừa truy vấn được, vừa không phình

**Vấn đề thật:** một món đồ hiện tại là object 460 byte có dòng chỉ số sinh ngẫu nhiên. Nhét cả object
vào một cột JSON thì không lọc được "cho tôi mọi món Chí Tôn giai 10 đang bán". Tách mỗi dòng chỉ số ra
một bảng thì 30 ô túi × 4 dòng = 120 hàng/nhân vật, join chết.

**Lời giải: tách hai tầng.**

- **Tầng khung (`items`)** — mọi thứ có thể lọc/sắp xếp, ở cột thật:
  `def_id`, `slot`, `rarity`, `tier`, `item_level`, `plus`, `perfect`, `luck`, `life`, `ancient_set`,
  `element`, `sigil`, `main_value`.
  → đủ để chạy mọi truy vấn chợ, xếp hạng, thống kê, phát hiện bất thường.
- **Tầng chi tiết (`item_mods`)** — chỉ 0–4 hàng/món, mỗi hàng là `(kind, stat_key, value)` với
  `kind ∈ {sub, exc, awakened}`.
  → 4 hàng × int nhỏ, index theo `item_id`. Nhẹ và join được.

**Tên hiển thị KHÔNG lưu.** `def_id` (`"thieulam_4_quan"`) + `stat_key` + locale → tra bảng nội dung.
Đây chính là 92/460 byte tiết kiệm được, và nó còn cho phép đổi tên/dịch mà không phải migrate dữ liệu.

```ts
export const items = mysqlTable("items", {
  id:        bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  // ── chủ sở hữu: đúng MỘT nơi tại một thời điểm ──
  ownerCharacterId: bigint("ownerCharacterId", { mode: "number", unsigned: true }),
  location:  mysqlEnum("location", ["bag","equip","ground","trade","market","forge","mail","destroyed"]).notNull(),
  slotIndex: smallint("slotIndex"),              // vị trí trong túi
  // ── khung: mọi thứ cần lọc ──
  defId:     varchar("defId", { length: 64 }).notNull(),   // "thieulam_4_quan"
  slot:      varchar("slot", { length: 16 }).notNull(),
  rarity:    tinyint("rarity").notNull(),                  // 0..4
  tier:      tinyint("tier").notNull(),                    // 1..10 (giai)
  itemLevel: smallint("itemLevel").notNull(),
  plus:      tinyint("plus").notNull().default(0),         // 0..11
  flags:     smallint("flags").notNull().default(0),       // bitmask: perfect|luck
  lifeLv:    tinyint("lifeLv").notNull().default(0),
  ancientSet:varchar("ancientSet", { length: 32 }),
  element:   varchar("element", { length: 8 }),
  sigil:     varchar("sigil", { length: 32 }),
  mainValue: int("mainValue").notNull(),
  // ── truy vết & khoá lạc quan ──
  version:   int("version").notNull().default(0),
  seed:      bigint("seed", { mode: "number", unsigned: true }).notNull(),  // để tái lập lần roll
  createdBy: mysqlEnum("createdBy", ["drop","forge","shop","event","quest","admin","migration"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  byOwner:  index("idx_owner").on(t.ownerCharacterId, t.location),
  byMarket: index("idx_market").on(t.location, t.rarity, t.tier),
}));
```

**Trường `seed` là thứ đáng tiền nhất trong bảng này.** Lưu hạt giống của lần roll ⇒ tái lập được
**y hệt** món đồ đã sinh ra. Khi có tranh chấp ("đồ của tôi biến mất", "món này không thể có thật"),
bạn phát lại được RNG. Chi phí: 8 byte/món. Không có nó thì mọi cuộc điều tra đều là lời khai đối lời khai.

### 4.4 Tiền tệ: chống race condition

**Trước hết, đây là race condition gì.** Hai request "mua bình thuốc 500◈" tới cùng lúc, số dư 600◈.
Nếu code là:

```ts
const bal = await db.select().from(wallet)…;   // cả hai đọc được 600
if (bal < 500) throw;                          // cả hai qua
await db.update(wallet).set({ amount: bal - 500 })…; // cả hai ghi 100
```
→ người chơi mua 2 bình bằng 500◈. **Đây là lỗi kinh điển và nó SẼ xảy ra**, đặc biệt khi client
tự động thử lại request lúc mạng chập chờn.

**Bốn lớp phòng thủ, dùng cả bốn:**

**Lớp 1 — Trừ tiền bằng MỘT câu lệnh có điều kiện. Không đọc trước.**

```ts
const res = await db.execute(sql`
  UPDATE character_currencies
     SET amount = amount - ${cost}, updatedAt = NOW()
   WHERE characterId = ${cid} AND currency = ${cur} AND amount >= ${cost}
`);
if (res.rowsAffected === 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Không đủ" });
```
InnoDB khoá hàng trong suốt câu lệnh; `amount >= cost` được đánh giá **dưới khoá đó**. Hai request
đồng thời thì đúng một cái ăn `rowsAffected = 1`. Không cần transaction cho một lần trừ.
Cột `amount` là `BIGINT UNSIGNED` + `CHECK (amount >= 0)` làm lưới an toàn cuối.

**Lớp 2 — Thao tác nhiều tài nguyên: transaction + khoá theo THỨ TỰ CỐ ĐỊNH.**
Rèn +11 tiêu: 3 ✦Huyền Thiết + 5 ◆Tu La + 2 ❖Hỗn Nguyên + bạc + 1 món đồ. Năm khoá.
Nếu hai request khoá theo thứ tự khác nhau → deadlock. Luật: **luôn `SELECT … FOR UPDATE` theo
`currency` sắp xếp ASC, rồi mới tới `item_id` ASC.** Một dòng quy ước, tiết kiệm hàng tuần gỡ deadlock.

**Lớp 3 — Idempotency key. Đây là lớp bị bỏ quên nhiều nhất.**
Client sinh một UUID cho mỗi hành động và gửi kèm. `currency_ledger` có `UNIQUE(request_id)`.
Request lặp lại (mạng chập, người chơi bấm hai lần, client tự retry) đâm vào unique key → trả lại
kết quả cũ thay vì trừ tiền lần hai. **Không có cái này thì Lớp 1 và 2 vô nghĩa trên mạng 4G.**

**Lớp 4 — Một nhân vật, một người ghi.**
Nhân vật thuộc về **đúng một shard game-server** tại một thời điểm (`account_sessions` có
`UNIQUE(character_id)` + `shard_id` + `heartbeat_at`). Mọi ghi đi qua actor của shard đó, tuần tự.
DB là tuyến phòng thủ **thứ hai**, không phải thứ nhất. Đây cũng là câu trả lời cho lỗ hổng dupe
"đăng nhập hai lần" của MU ([2.6](#26-mu-đã-bị-dupe-đồ-như-thế-nào--và-cách-chặn)).

```ts
export const characterCurrencies = mysqlTable("character_currencies", {
  characterId: bigint("characterId", { mode: "number", unsigned: true }).notNull(),
  currency:    varchar("currency", { length: 24 }).notNull(),  // silver|mat|tienDan|khi|tuLa|honNguyen|manh|tichMa|…
  amount:      bigint("amount", { mode: "number", unsigned: true }).notNull().default(0),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.characterId, t.currency] }) }));
```

> **Vì sao một hàng cho mỗi loại tiền, không phải một cột cho mỗi loại?**
> Game có **ít nhất 12 loại tài nguyên đếm được** (`silver`, `mat`, `tienDan`, `khi`, `tamdac`,
> `bikipVH`, `charms`, `potions`, `mats.{manh,tichMa,anTranAi,manhCoThan}`, `gems.{tuLa,honNguyen}`,
> `jewels.{chucPhuc,linhHon,sinhMenh,honDon}`, `noidan.{5 hệ}`) và **danh sách này sẽ còn dài ra**.
> Mỗi loại mới = một migration `ALTER TABLE` trên bảng nóng nếu dùng cột. Dạng hàng thì thêm loại
> mới **không cần migration nào**. Đánh đổi: đọc ví phải `GROUP BY` — không đáng kể, ví chỉ có ~20 hàng.

### 4.5 Log giao dịch — thiết kế để TRUY VẾT ĐƯỢC

Hai sổ cái, cùng một hình dạng, **chỉ ghi thêm, không bao giờ `UPDATE`/`DELETE`**:

```ts
export const currencyLedger = mysqlTable("currency_ledger", {
  id:          bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  requestId:   varchar("requestId", { length: 36 }).notNull(),          // UNIQUE → idempotency
  characterId: bigint("characterId", { mode: "number", unsigned: true }).notNull(),
  currency:    varchar("currency", { length: 24 }).notNull(),
  delta:       bigint("delta", { mode: "number" }).notNull(),           // CÓ DẤU
  balanceAfter:bigint("balanceAfter", { mode: "number", unsigned: true }).notNull(),
  reason:      mysqlEnum("reason", ["mob_kill","quest","shop_buy","shop_sell","forge","trade","market","event","daily","admin","rollback"]).notNull(),
  refType:     varchar("refType", { length: 24 }),   // "mob" | "item" | "trade" | "listing"
  refId:       varchar("refId",   { length: 64 }),
  shardId:     varchar("shardId", { length: 32 }),
  ip:          varchar("ip", { length: 45 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uniqReq: uniqueIndex("uniq_request").on(t.requestId),
  byChar:  index("idx_char_time").on(t.characterId, t.createdAt),
  byReason:index("idx_reason_time").on(t.reason, t.createdAt),
}));
```

**Bốn thứ khiến sổ cái này *dùng được* chứ không chỉ *tồn tại*:**

1. **`balanceAfter`.** Không có nó, muốn biết số dư lúc 3h sáng hôm qua phải cộng dồn từ đầu.
   Có nó, một truy vấn là ra. Và nó **tự kiểm tra chính nó**: nếu
   `ledger[n].balanceAfter + ledger[n+1].delta ≠ ledger[n+1].balanceAfter` thì **có ai đó ghi ngoài sổ**
   — đó là tín hiệu gian lận mạnh nhất bạn có thể có, và nó phát hiện được bằng một query chạy mỗi đêm.
2. **`reason` là enum, không phải text tự do.** Vì câu hỏi điều tra thật luôn là *"tiền của thằng này
   từ đâu ra?"* → `SELECT reason, SUM(delta) … GROUP BY reason`. Text tự do làm query đó thành vô nghĩa.
3. **`refId`.** Nối được +12◈ với đúng con quái nào, +5000◈ với đúng phiên trade nào.
4. **Chống phình:** ước lượng 1 người chơi hoạt động sinh ~2.000 dòng ledger/giờ (mỗi `killMob` đã là
   3–8 dòng). ⇒ **gộp**. Sự kiện nhỏ lặp lại (bạc/EXP từ quái) gom theo cửa sổ 60 giây thành một dòng
   `reason='mob_kill'` với `delta` tổng và `refId` là số lượt. Thứ **không bao giờ được gộp**:
   trade, chợ, rèn, admin, nạp. Không có bước gộp này thì bảng ledger sẽ to hơn cả game.

`item_ledger` cùng hình dạng, thay `delta` bằng `(item_id, from_owner, to_owner, from_location, to_location)`.
Mọi lần món đồ đổi chủ hoặc đổi chỗ đều ghi một dòng. **Đây là thứ chặn dupe kiểu MU tận gốc:** một món
không thể ở hai nơi vì `items.owner_character_id` là một cột đơn, và mọi lần đổi đều để lại dấu vết.

### 4.6 Các bảng còn lại (tóm tắt — chi tiết ở file mẫu)

| Bảng | Điểm cần chú ý |
|---|---|
| `accounts` | Tái dùng `users` sẵn có (`unionId` đã hỗ trợ Kimi/Google/Ronin). Thêm `banned_until`, `flags` |
| `characters` | `UNIQUE(name)` — tên nhân vật phải độc nhất toàn server, việc mà bản single-player không cần |
| `character_equipment` | **PK `(character_id, slot)` + `UNIQUE(item_id)`**. Ràng buộc này *một mình* chặn "một món mặc ở hai ô" và "một món mặc bởi hai người" |
| `character_quests` | `(character_id, quest_id)` + `state` + `progress`. Nhiệm vụ phụ hiện là `sideStates = {id:{st,prog}}` — map 1:1 |
| `character_skills` | `(character_id, skill_id)` + `level` (1..120) + `evo` (JSON nhỏ) |
| `character_progress` | **Một cột JSON + `schema_version`**. Chứa `storyFlags`, `clues`, `wpUnlocked`, `dhHate`, `meridians`, `noidan`, `abode`, `traits`, `titles`, `hintCd`… Có version thì migrate được từng bước |
| `friendships` | `(a,b)` với `a < b` chuẩn hoá — tránh lưu hai chiều rồi lệch nhau |
| `guilds` / `guild_members` | `guild_members.role` enum; `guilds.alliance_id` nullable **ngay từ đầu** — Castle Siege cần liên minh, thêm sau thì phải migrate |
| `market_listings` | `seller_character_id`, `item_id` (UNIQUE — món đang bán không thể ở túi), `price`, `expires_at`, `state`. Đăng bán = `items.location = 'market'` + `owner = NULL` trong **cùng một transaction** |
| `trade_sessions` / `trade_offers` | Máy trạng thái: `open → locked → confirmed_a → confirmed_b → committed/cancelled`. **Mọi thay đổi món đồ đều reset cả hai xác nhận** — đây là bài học Webzen phải học bằng tiền |

---

## 5. Giao thức và mô hình tick

### 5.1 WebSocket hay HTTP — chỗ nào dùng cái nào

Luật quyết định: **cái gì nằm trong vòng lặp 50 ms thì đi WS; cái gì cần một câu trả lời dứt khoát
"thành công / thất bại" thì đi HTTP.**

| Đi HTTP (tRPC, đã có sẵn) | Đi WebSocket |
|---|---|
| Đăng nhập, chọn/tạo/xoá nhân vật | Di chuyển, đánh, tung chiêu, nhặt đồ |
| Danh sách server/channel | Snapshot vị trí quái & người chơi |
| Mua bán NPC, **rèn**, tấn phẩm, kế thừa | Chat kênh/khu vực/tổ đội |
| **Trade, chợ** (cần idempotency + xác nhận) | Vào/ra map, mở/đóng cổng |
| Guild admin, bạn bè, thư | Hiệu ứng chiến đấu (số bay, âm thanh, rung) |
| Bảng xếp hạng | Trạng thái sự kiện thế giới |

> **Vì sao rèn và trade đi HTTP dù "cảm giác" là realtime?** Vì cả hai đều **tiêu tài nguyên không hoàn lại**.
> Bạn cần đúng ngữ nghĩa "gửi một lần, thực thi tối đa một lần" — thứ mà request/response + idempotency
> key cho miễn phí và WS không cho. Mất kết nối giữa chừng lúc rèn +11 mà không biết đồ còn hay vỡ là
> loại lỗi khiến người chơi bỏ game.

### 5.2 Nhịp tick server

**Chọn 20 Hz (50 ms) cho vòng mô phỏng, 10 Hz cho snapshot gửi đi.**

Lý do **không** phải "20 Hz là con số phổ biến", mà là **đo được từ chính code này**:

```js
// game.js:12993
const dt = Math.min(0.05, (now - lastTime)/1000);
```

Client **kẹp `dt` ở 0,05 s**. Nghĩa là toàn bộ hệ mô phỏng — vật lý đạn, va chạm, AI quái, hồi phục,
cooldown — **chưa bao giờ được chạy với `dt` lớn hơn 50 ms** trong suốt lịch sử dự án. Server chạy
20 Hz = `dt` đúng bằng 0,05 → **server không bao giờ đưa vào hệ một `dt` mà nó chưa từng gặp**.
Chạy 10 Hz (`dt` = 0,1) là bước vào vùng chưa test: đạn có thể xuyên qua quái (tunneling), va chạm
vật cản sai. Chạy 30–60 Hz thì tốn CPU gấp 1,5–3× mà mắt không phân biệt được ở tốc độ di chuyển 190 px/s.

**Ngân sách CPU — đo thật:**

| Phép đo | Kết quả |
|---|---|
| Nạp `game.js` vào Node + shim 65 dòng | thành công |
| 600 tick `update(1/20)` với 60 quái (lần chạy nguội, gồm JIT + `buildWorld`) | 250 ms ⇒ ~417 µs/tick |
| **Trạng thái ổn định sau khi JIT nóng, 5 vòng × 2000 tick** | **3–4 µs/tick** |

⇒ Một world 60 quái ở 20 Hz tốn ≈ **80 µs CPU mỗi giây** = **0,008 % một lõi**.

> ⚠ **Đọc con số này cho đúng.** Đây là **sàn**, không phải lời hứa. Nó đo một world với **một** người
> chơi đứng yên/tự đánh. Thứ chưa nằm trong đó: N người chơi trong cùng world, tính AoI, serialize gói
> tin, ghi DB, TLS. Kinh nghiệm chung là serialize + mạng sẽ tốn **gấp nhiều lần** phần mô phỏng.
> Kết luận đúng là: **CPU mô phỏng KHÔNG phải nút thắt của dự án này** — băng thông và tính đúng đắn mới là.

### 5.3 Client nội suy / dự đoán

Ba cơ chế, đúng theo thứ tự này:

1. **Đệm nội suy 100 ms (2 snapshot).** Client vẽ thế giới ở thời điểm `now − 100 ms`, nội suy tuyến
   tính giữa hai snapshot đã nhận. Quái và người chơi khác **luôn** đi qua cơ chế này — **không bao giờ
   ngoại suy chúng**. Ngoại suy quái đang đổi hướng liên tục (AI game này có `wanderAng`, `packAlert`,
   `lungeT`) tạo ra giật ngược, tệ hơn hẳn 100 ms trễ.
2. **Dự đoán nhân vật của chính mình.** Client chạy `update(dt)` cho nhân vật mình ngay khi bấm, không
   chờ server. Đây là thứ giữ cho game "nhạy" trên mạng 4G. Cần: đánh số thứ tự (`seq`) mỗi lệnh, giữ
   lại lệnh chưa được xác nhận.
3. **Đối chiếu (reconciliation).** Server gửi kèm `ack_seq` + vị trí xác nhận. Client tua lại từ vị trí
   đó, phát lại các lệnh có `seq > ack_seq`. Ngưỡng đề xuất, tính theo tốc độ thật 190 px/s:
   - lệch < 8 px → bỏ qua (nhiễu làm tròn)
   - 8–48 px → kéo mềm về trong 200 ms (người chơi không nhận ra)
   - \> 48 px → **snap thẳng** (đã sai quá nhiều, kéo mềm chỉ làm nó sai lâu hơn)

**Thứ KHÔNG được dự đoán ở client, không có ngoại lệ:** sát thương, chết, rơi đồ, kết quả rèn, tiền tệ.
Client được phép **đoán trước hiệu ứng hình ảnh** (vung tay, loé sáng) nhưng con số phải chờ server.
Đây chính là chỗ mà 4 "ống phản hồi" ở [3.1](#31-bức-tranh-bằng-số) trở thành thiết kế chứ không phải nợ kỹ thuật.

### 5.4 Đồng bộ vị trí — game này có một lợi thế MU không có

**`CLAUDE.md`: "Game đã bỏ WASD — di chuyển là click-to-move qua `moveTarget`."**

Đây là món quà lớn nhất mà thiết kế hiện tại tặng cho phiên bản online, và nó **hoàn toàn tình cờ**.

Trong game điều khiển bằng WASD, client buộc phải gửi *hướng đang đi* hoặc *toạ độ hiện tại* mỗi khung
→ server chỉ còn cách *phát hiện* bất thường sau khi đã nhận toạ độ (đúng cái mẫu yếu ở [2.7](#27-mu-chống-speed-hack--teleport-hack-ra-sao)).

Ở đây, client chỉ cần gửi **ý định**: *"tôi muốn tới (x, y)"* — **một gói tin cho cả quãng đường dài**.

```
C→S   move_to { x: 1842, y: 903, seq: 417 }     ← 9 byte, không phải mỗi khung
S     validate:  trong map? không nằm trong vật cản? tới được? (navPath)
S     mỗi tick:  nhích entity theo player.speed dọc movePlan
S→C   snapshot:  vị trí THẬT + ack_seq
```

⇒ **Client không bao giờ gửi toạ độ của chính nó.** Teleport-hack không phải "khó" — nó **không có
đường nào để tồn tại**, vì không có message nào mang toạ độ người chơi theo chiều C→S.
Speed-hack cũng vậy: `player.speed` là giá trị server tính từ `calcDerived()`, client sửa chỉ làm
hoạt ảnh của chính nó chạy nhanh rồi bị kéo về ngay snapshot sau.

Server tái dùng **nguyên hàm có sẵn**: `movePlanMake()`, `simulateMovePath()` (dòng 985), `navPath()`
(dòng 921), `collideObstacles()`, `inObstacle()`, `nearestFree()`. Không viết mới.

Ba thứ server **bắt buộc** phải kiểm khi nhận `move_to`:
- đích nằm trong `[0, MAP.w] × [0, MAP.h]`;
- đích không nằm trong vật cản (`inObstacle`) — nếu có, `nearestFree()`;
- đích **liên thông** với vị trí hiện tại (`navPath` trả về đường) — nếu không, từ chối.
  ⚠ `CLAUDE.md` đã ghi lại một lần vấp: kiểm bằng **flood fill**, không phải tỉ lệ vòng.

### 5.5 Kích thước gói tin và số người tối đa mỗi map — tính từ map thật

**Dữ kiện đo được:**

| | |
|---|---|
| `MAP` | **2600 × 1900 px** (game.js:60) — mọi map dùng chung kích thước |
| Số map | **15** (7 ngoài trời + 1 thành + 7 phó bản) |
| Số mẫu quái | **46** |
| Quái nhiều nhất một map | **60** (`daohoa`) · `ngoai` 48 · `chungnam` 43 · `comoc` 45 · `tuyettinh` 44 · `mongco` 44 · `nhanmon` 44 · thành 0 · phó bản 0 (sinh theo đợt) |
| NPC | **20** |
| Object quái đầy đủ | **26 khoá, 654 byte JSON** |
| Snapshot **thô** 60 quái | **43.336 byte** |
| Snapshot **gọn** `[id,x,y,hp]` × 60 | **1.017 byte** (≈17 byte/quái) |

**Tính băng thông:**

Dạng nhị phân cho mỗi quái: `id u16 + x u16 + y u16 + hp u16 + flags u8` = **9 byte**.

Area of Interest theo mẫu bucket của OpenMU, chuyển tỉ lệ sang map này:
bucket **260 × 190 px** (lưới 10 × 10 = 100 bucket/map), AoI = **5 × 5 bucket = 1300 × 950 px**
≈ đúng một khung nhìn 1440 × 900. ⇒ AoI phủ **1/4 diện tích map**.

| | Nhị phân | JSON |
|---|---|---|
| Quái trong AoI (60 × 1/4 ≈ **15**) | 135 B/tick | ~255 B/tick |
| Người chơi trong AoI (giả định 20) — 12 B/người | 240 B/tick | ~450 B/tick |
| **Tổng mỗi snapshot** | **~375 B** | ~705 B |
| **@ 10 Hz, mỗi client, chiều xuống** | **~3,7 KB/s** ⇒ **30 kbit/s** | ~7 KB/s ⇒ 56 kbit/s |
| Chiều lên mỗi client (`move_to` + `attack` + heartbeat) | **< 0,5 KB/s** | |

Với **delta encoding** (chỉ gửi thứ đổi + gửi full mỗi 2 giây) con số này còn giảm **3–5 lần** trong
thực tế, vì phần lớn quái đứng yên trong bãi.

**Đề xuất giới hạn người mỗi map (channel):**

| Ngưỡng | Giá trị | Vì sao |
|---|---|---|
| **Mục tiêu êm** | **50** | 50 người × 3,7 KB/s = 185 KB/s ≈ **1,5 Mbit/s** xuống cho cả map. Một VPS 100 Mbit gánh được ~60 map cùng lúc ở mức này |
| **Trần cứng** | **80** | Trên mức này, quảng trường Lunaris City (khu duy nhất mọi người tụ về, 0 quái nhưng 20 NPC) sẽ có ~80 entity trong một AoI ⇒ 960 B/tick ⇒ 9,6 KB/s/client. Vẫn chạy, nhưng đây là chỗ 4G bắt đầu rớt |
| **Vượt trần** | mở **channel mới** | Đúng mẫu sub-server của MU: cùng nội dung, `ServerCode` khác. Rẻ, không cần thiết kế gì mới |
| **Phó bản** | **instance riêng**, 1 tổ đội | `pb_*` sinh quái theo đợt, không có quái nền — instance hoá là hiển nhiên và rẻ |

> **Số 50 này bảo thủ có chủ ý.** Nút thắt không phải CPU (đã đo: 0,008 % lõi/world) mà là (a) băng
> thông lên client 4G và (b) **cảm giác chơi**: map 2600 × 1900 với 60 quái đứng thành 6–10 bãi;
> 50 người chơi nghĩa là ~5 người/bãi. Đông hơn thì thành cướp bãi, mà cơ chế cướp bãi thì chưa có.

### 5.6 Hình dạng message

Định danh **hai tầng** (nhóm + mã), lấy đúng bài học từ MU ([2.4](#24-giao-thức-gói-tin)) — nhóm để
định tuyến, mã phụ để mở rộng mà không phá client cũ. Chi tiết:
[`online-samples/protocol.sample.ts`](online-samples/protocol.sample.ts).

```
nhóm 0x1  session   : hello · auth · enter_map · leave_map · ping
nhóm 0x2  movement  : move_to · ack · snapshot_players
nhóm 0x3  combat    : attack · cast · snapshot_mobs · dmg_event · death
nhóm 0x4  loot      : ground_spawn · pickup_req · pickup_ok · inv_delta
nhóm 0x5  social    : chat · party · guild · friend
nhóm 0x6  world     : event_state · weather · daynight
```

**Nguyên tắc bất di bất dịch:** mọi message chiều S→C mang **kết quả**, không bao giờ mang **tỉ lệ**.
Server gửi `dmg_event { target, amount, kind }` — **không bao giờ** gửi "tỉ lệ bạo kích của anh là 23 %".
Client biết tỉ lệ là client tính lại được, và client tính lại được là bắt đầu có chỗ để nói dối.

---

## 6. Câu hỏi khó: có giữ được `game.js` không?

**Có. Và tôi có bằng chứng chạy được, không phải lập luận.**

### 6.1 Bằng chứng

Tôi nạp `game.js` (cùng `strings/en.js`, `strings/vi.js`, `i18n.js`, `lang.js`) vào Node 22 bằng
`vm.runInContext`, với một lớp giả **65 dòng** cho `window`/`document`/`canvas`/`Audio`/`MutationObserver`.
**Không sửa một ký tự nào trong game.**

```
loaded OK  : strings/en.js
loaded OK  : strings/vi.js
loaded OK  : i18n.js
loaded OK  : lang.js
loaded OK  : game.js
SIM PROBE OK: {"before":{"atk":27,"hp":291,"lv":1,"silver":30},
               "after":{"atk":90,"hp":910,"lv":23},"item":"Mũ Trụ Hắc Giáp r3 t5"}
HEADLESS TICK PROBE OK: {"mobsAtBuild":60,"ticks":600,"msFor600Ticks":250,
               "usPerTick":417,"killWorked":true,"silverBefore":30,"silverAfter":42,
               "xpBefore":4289,"xpAfter":4294,"groundLoot":1}
BENCH: {"mobsAlive":60,"usPerTick":[4,4,3,4,3]}
```

`newPlayer()` → `calcDerived()` → `buildWorld()` (60 quái) → 600 tick `update(1/20)` → `hurtMob()` →
`killMob()` → cộng bạc, cộng EXP, rơi đồ xuống đất. Toàn bộ vòng lặp chiến đấu chạy trên server, hôm nay.

Script tái lập: [`online-samples/headless-sim.sample.js`](online-samples/headless-sim.sample.js).

### 6.2 Vậy chính xác thì phải tách cái gì

Không phải "tách mô phỏng khỏi phần vẽ" theo nghĩa chia đôi file. Phải cắt đúng **ba** đường:

**Đường cắt 1 — bốn ống phản hồi. Đây là 90 % giá trị của cả việc tách.**

Tôi phải thêm shim cho `insertBefore` chỉ vì `logCombat()` (dòng 5665) đụng DOM từ bên trong `update()`.
Đó chính là toàn bộ vấn đề, thu gọn thành một dòng.

| Hàm hiện tại | Việc | Thay bằng |
|---|---|---|
| `addFloat(x,y,text,color,size)` | số bay trên đầu quái | `emit('float', {…})` |
| `addEffect(e)` | hiệu ứng hạt/vòng | `emit('fx', e)` |
| `AudioSys.sfx(name, vol)` | âm thanh | `emit('sfx', {…})` |
| `logCombat(text, color)` | nhật ký chiến đấu | `emit('log', {…})` |
| (+ `shakeT` / `swingFeel` / `motifBurst`) | rung & khựng hình | `emit('feel', {…})` |

Trên **client**, `emit()` làm y hệt hôm nay. Trên **server**, `emit()` gom vào gói tin của tick rồi
gửi cho các client trong AoI. **32 hàm / 2.286 dòng chuyển sang server chỉ nhờ thay đổi này** —
gồm `killMob` (232 dòng), `hurtMob` (154), `castSkill` (189), `castVohoc` (110), `update` (753).
Đây là refactor có đòn bẩy cao nhất trong cả codebase, và nó **cũng làm code client tốt hơn** kể cả
nếu bạn quyết định không lên online.

**Đường cắt 2 — RNG phải có hạt giống.**

141 chỗ gọi `Math.random()`. Thay bằng một hàm `rng()` (bộ sinh PRNG có hạt, ví dụ xorshift128+).
Đây là thay đổi **cơ học** (`Math.random()` → `rng()`), không phải thiết kế lại. Được ba thứ:

- Server **tái lập** được mọi lần roll từ `items.seed` ([4.3](#43-trang-bị-vừa-truy-vấn-được-vừa-không-phình)) — điều tra gian lận có bằng chứng.
- Chia được **hai luồng RNG**: `rngCosmetic` (client tự chạy: hạt bụi, tàn ảnh, hướng lắc của cỏ)
  và `rngAuthoritative` (**chỉ server**: rơi đồ, rèn, phẩm chất).
- Test hồi quy hết ngẫu nhiên → bộ test hiện có trong scratchpad ổn định hẳn.

**Đường cắt 3 — 25 handler UI.**

25 hàm / 607 dòng dạng `window.doTanPham(uid)`, `window.buyFromShop(...)`, `window.useJewel(...)`.
Tất cả đều có chung hình dạng: *kiểm điều kiện → trừ tài nguyên → sửa đồ → gọi `renderX()`*.
Tách thành:

```
doTanPham(uid)                     →  gửi HTTP { action:'tanpham', uid, requestId }
                                      server chạy tanphamCore(state, uid) → { ok, changes }
                                      client nhận changes → áp → renderForge()
```
Phần **lõi** (`…Core`) dùng chung được. Phần vỏ khác nhau hai bên. 607 dòng, ước lượng 1–2 tuần.

### 6.3 Hình dạng file sau khi tách (giữ nguyên "không build step")

```
public/game/
  content.js     ← 5.656 dòng dữ liệu: MAPS · MOBS · SECTS · SKILL_DEFS · ITEM_DB · QUESTS · SIGIL_DEFS …
  sim.js         ← ~7.000 dòng: calcDerived · update · hurtMob · killMob · castSkill · genItem · rollX …
                    KHÔNG có ctx, KHÔNG có document, chỉ emit()
  view.js        ← ~4.500 dòng: render · drawPlayer · drawXxx · renderPanel · updateHud
  net.js         ← MỚI: WebSocket, nội suy, đối chiếu
  game.js        ← chỉ còn: nạp 4 file trên, gắn sự kiện, chạy loop()
server/
  world.js       ← require('../public/game/content.js') + sim.js, chạy 20 Hz
```

**`content.js` + `sim.js` là hai file dùng CHUNG, y nguyên, hai bên.** Không transpile, không bundler.
Trên client: `<script src>` như hôm nay. Trên server: `vm.runInContext` như tôi đã chạy được, hoặc thêm
một dòng `if (typeof module !== 'undefined') module.exports = {…}` ở cuối. **Ràng buộc "không build step"
của dự án được giữ nguyên** — đây là điểm tôi muốn nhấn mạnh, vì nó là lý do phần lớn kế hoạch
"viết lại bằng TypeScript" thất bại ở dự án kiểu này.

### 6.4 Bốn cái bẫy đã lộ ra ngay trong lúc tôi thử

1. **`game.js` tự khởi động vòng lặp lúc nạp** (`requestAnimationFrame(loop)`, dòng 13003) và tự đặt
   `setInterval` (dòng 12686). Trên server phải có cờ chặn, không thì mỗi world là một timer rác.
2. **`logCombat` đụng DOM từ trong `update()`** — đúng lý do cần Đường cắt 1.
3. **Trạng thái toàn cục là ĐƠN LẺ.** `player`, `mobs`, `curMap`, `questIdx`… đều là biến module.
   Một tiến trình Node chỉ chạy được **một** world. Hai lựa chọn:
   - **`vm.createContext` mỗi world** (đúng cách tôi đã làm) — cách ly hoàn hảo, tốn RAM. Ước lượng
     thô: ~15–30 MB/world (chưa đo — cần đo trước khi cam kết).
   - **Gom trạng thái toàn cục vào một object `W`** — rẻ về RAM, nhưng phải sửa hàng nghìn chỗ. Không nên.
   ⇒ Với **CCU thấp**, `vm.createContext` mỗi map-channel là đúng, và nó tận dụng chính điểm mạnh
   "một file, không module" của dự án.
4. **Bộ nhớ đệm hình ảnh vô nghĩa trên server.** `_heroCardCache`, `tintedImg()`, `MOB_IMGS`,
   `MAP_BG` — phải tắt, không thì mỗi world giữ vài chục MB canvas giả.

### 6.5 Trả lời thẳng

> *"Chuyển sang online authoritative-server nghĩa là gần như viết lại phần mô phỏng."*

**Không đúng với dự án này.** Phần mô phỏng đã chạy được trên Node hôm nay. Thứ phải viết lại là:

| Phải viết lại | Không phải viết lại |
|---|---|
| Tầng mạng (chưa tồn tại) | `calcDerived` · `update` · `hurtMob` · `killMob` · `castSkill` |
| Tầng lưu trữ (blob → bảng) | `genItem` · toàn bộ `rollX` |
| 4 ống phản hồi → emitter | Toàn bộ 5.656 dòng dữ liệu nội dung |
| 25 handler UI → tách lõi/vỏ | Vật lý & tìm đường (`navPath`, `simulateMovePath`) |
| RNG → có hạt giống | Toàn bộ tầng vẽ (nó **ở lại** client, đó là chỗ của nó) |

**Rủi ro thật nằm ở chỗ khác, và nó lớn hơn:** `game.js` là **một file 18.915 dòng có 540 hàm và 731
điểm ghi vào `player`**, không có kiểu tĩnh, không có module. Chạy được trên server ≠ **duy trì được**
trên server. Mỗi lần thêm tính năng, người viết phải nhớ "cái này client hay server". Không có compiler
nào nhắc. **Đây mới là chi phí dài hạn thật, và không có cách nào mua nó đi bằng kiến trúc.**
Cách giảm rủi ro duy nhất tôi thấy khả thi mà không phá ràng buộc no-build: sau Đường cắt 1, thêm một
**bộ test hợp đồng** chạy `sim.js` trên Node và khẳng định nó **không bao giờ** chạm `document`/`ctx` —
một `grep` trong CI cũng đủ, và nó bắt được lỗi ngay lúc viết chứ không phải lúc deploy.

---

## 7. Lộ trình từng bậc — được gì, tốn gì, rủi ro gì

**Quy ước ước lượng:** 1 người-tuần = 1 lập trình viên full-stack đã quen codebase này, 5 ngày.
Đã tính cả test và deploy. **Chưa** tính thiết kế game, art, vận hành. Sai số ±40 % — dải càng rộng
thì tôi càng ít chắc.

### Bậc 0 — Đóng cửa hậu · **1–2 người-tuần**

**Làm:** không ship `cheatExec` trong bản release (`RELEASE_BUILD` đã có sẵn, chỉ chưa dùng để cắt
console cheat); bỏ `?test=1`/`?max=1` khỏi production; `applyTestBoost` chỉ nạp trong bản dev.

**Được:** bịt con đường gian lận **rẻ nhất** (thêm 7 ký tự vào URL). Nếu sau này có bảng xếp hạng thì
nó bớt vô nghĩa đi một bậc.

**Rủi ro:** gần như không. Nhưng mất một công cụ QA thật — nên tách thành `game.dev.js` chứ đừng xoá.

> ⚠ **Nói thẳng: bậc này KHÔNG chống được gian lận.** Nó chỉ nâng rào từ "gõ một lệnh" lên "sửa một
> object trong console" — mất thêm khoảng 30 giây với người biết việc. Đừng bán nó cho ai như một
> tính năng bảo mật. Lý do đáng làm là **vệ sinh**: người chơi bình thường không vô tình vấp phải,
> và bạn không còn quảng cáo cửa hậu trong tài liệu dự án.

### Bậc 1 — Đưa backend lên đường đi thật · **2–3 người-tuần**

**Làm:** nginx `location /api { proxy_pass … }` → tiến trình Node; phục vụ game qua React shell (để
`window.parent !== window` và móc `postMessage` thật sự bắn); bật `saveRouter`; **kiểm tra hợp lệ blob
ở server** (zod schema cho `player`: `level ≤ 120`, `silver ≤ trần`, `inv.length ≤ 30`, cấm trường lạ);
`savedAt` lấy giờ **server**, không lấy của client; systemd + log + backup DB.

**Được:** tài khoản thật, chơi được nhiều thiết bị, bảng xếp hạng có đầu vào, và — quan trọng nhất —
**bạn bắt đầu có dữ liệu**. Không có dữ liệu thì mọi quyết định ở Bậc 4 đều là đoán.

**Rủi ro:**
- Production hiện là **thư mục tĩnh + `git reset --hard` mỗi 2 phút**, không có giám sát. Thêm tiến
  trình Node là thêm một thứ có thể chết lúc 3h sáng mà **hiện không ai được báo**. Phải làm health
  check trước, không phải sau.
- `CLAUDE.md` ghi rõ **sandbox không SSH được vào VPS** ⇒ mọi thao tác trên máy phải nhờ người. Đây
  là ma sát vận hành thật, không phải chi tiết nhỏ.
- Kiểm tra hợp lệ blob **sẽ khoá một số người chơi cũ đang mang state kỳ lạ**. Cần chế độ "cảnh báo,
  ghi log, không chặn" chạy 1–2 tuần trước khi bật chặn.

### Bậc 2 — Chuẩn hoá dữ liệu · **4–6 người-tuần**

**Làm:** toàn bộ [Phần 4](#4-thiết-kế-cấu-trúc-dữ-liệu) — bảng thật, `items.id` do server cấp, ví theo
hàng, hai sổ cái. Chiến đấu **vẫn ở client**, nhưng mọi thứ chạm kho đồ/tiền đi qua HTTP có idempotency.

**Được:** đồ không nhân bản được, tiền truy vết được, đủ nền cho trade/chợ. Save từ 16.864 byte blob
xuống thành hàng có index. **Đây là bậc mở khoá mọi thứ về sau.**

**Rủi ro:**
- **Di trú `uid` là việc một chiều.** Bộ đếm cục bộ → id server. May mắn: `SAVE_VERSION` mới lên 3 và
  **đã xoá sạch save cũ** ⇒ **đây là thời điểm rẻ nhất trong cả vòng đời dự án để làm việc này.**
  Chờ thêm 6 tháng là phải viết migration cho hàng nghìn nhân vật.
- Client vẫn tự tính chiến đấu ⇒ vẫn gian lận được EXP/kill. Bậc này chống **dupe**, không chống
  **in tiền**. **Đừng nhầm hai thứ đó.**
- `character_progress` là JSON có version — nếu không kỷ luật về version, 12 tháng nữa nó lại thành
  đúng cái blob bạn vừa bỏ đi.

### Bậc 3 — "Thấy nhau" trong thành · **4–6 người-tuần**

**Làm:** WebSocket; server làm chủ **vị trí người chơi** (`move_to` → server nhích → snapshot);
chat khu vực; danh sách online; bạn bè. **Chỉ bật ở map an toàn** (`tuongduong` — 0 quái, 20 NPC,
đúng chỗ mọi người tụ về).

**Được:** **cú nhảy cảm nhận lớn nhất trên mỗi đồng bỏ ra trong toàn bộ lộ trình.** Người chơi thấy
người khác, chat được, khoe đồ được (và trang bị **nhìn thấy được trên nhân vật** — `CLAUDE.md` ghi
54,3 % pixel đổi giữa đồ đầu và cuối, tức là khoe đồ **thật sự có ý nghĩa** ở game này).
Đồng thời đây là bài kiểm tra rẻ cho toàn bộ tầng mạng.

**Rủi ro / đánh đổi — phải nói rõ:**
- Bên ngoài thành, quái vẫn do từng client tự chạy ⇒ **hai người đứng cạnh nhau nhìn thấy hai thế giới
  khác nhau**. Đó là lý do bậc này **giới hạn ở map an toàn**. Bật ở map có quái là **tự tạo lỗi bug
  không sửa được** — người chơi sẽ báo "quái nhảy lung tung" và không có cách nào chữa ngoài việc lên Bậc 4.
- Nếu sau này làm PvP, tầng này phải viết lại phần lớn (thêm đối chiếu, lag compensation).
- Tính lại: 50 người trong một thành, chỉ có avatar + chat ⇒ **< 1 KB/s/client**. Rất rẻ.

### Bậc 4 — Server mô phỏng thật · **12–20 người-tuần**

**Làm:** ba đường cắt ở [6.2](#62-vậy-chính-xác-thì-phải-tách-cái-gì); world loop 20 Hz; AoI bucket;
quái/sát thương/rơi đồ/rèn hoàn toàn ở server; client dự đoán + đối chiếu; sự kiện thế giới theo giờ server.

**Được:** gian lận thực sự bị chặn, không phải bị phát hiện. PvP, chợ, sự kiện thi đấu trở nên khả thi.

**Rủi ro:**
- **Đây là bậc dễ vỡ tiến độ nhất.** Dải 12–20 tuần rộng vì nó phụ thuộc vào việc Đường cắt 1 sạch
  đến đâu — mà điều đó chỉ biết sau khi làm 2 tuần đầu. **Nên chốt lại ước lượng sau tuần thứ 2.**
- Cảm giác chiến đấu là thứ dự án này đã đầu tư nhiều nhất (`CLAUDE.md` có nguyên một mục
  "Cảm giác chiến đấu — 6 chỗ dễ làm sai": hitstop, `pendingHit` nổ ở khung tiếp xúc 0,09 s,
  `hSwing` đẩy khoảnh khắc chạm ra p≈0,41, rung có hướng…). **Thêm 60–150 ms trễ mạng vào cái đó
  là rủi ro lớn nhất của cả dự án** — lớn hơn nhiều so với rủi ro kỹ thuật. Phải làm prototype
  **chỉ riêng phần chiến đấu** ở tuần đầu và cho người thật đánh giá, trước khi cam kết 12–20 tuần.
- Một tiến trình = một world ⇒ cần trình quản lý shard, cân bằng tải, chuyển map giữa các shard.

### Bậc 5 — Xã hội & kinh tế · **8–12 người-tuần**

Guild, tổ đội, trade 1-1, chợ, thư. Cần Bậc 2 (dữ liệu) + Bậc 4 (server tin cậy được).
Rủi ro: kinh tế người-với-người là **thiết kế game**, không phải kỹ thuật. Bơm tiền hiện có
(`killMob` cộng bạc ở 4 chỗ, chưa kể `+4` mỗi mạng) chưa từng được cân bằng cho một nền kinh tế mở.
**Đừng mở chợ trước khi có 4 tuần dữ liệu ledger để nhìn tốc độ lạm phát.**

### Bậc 6 — Sự kiện thi đấu kiểu MU · **8–12 người-tuần**

Castle Siege / Chaos Castle / Blood Castle phiên bản của game này (tên đã có sẵn: Đấu Trường Tế Thần,
Pháo Đài Máu, Lò Hỗn Loạn).

> 🔴 **Nói thẳng: ở CCU dưới ~200 đồng thời, bậc này KHÔNG đáng làm.**
> Castle Siege cần liên minh **≥ 20 thành viên mỗi guild** và **3 guild tấn công** ⇒ tối thiểu ~80 người
> hoạt động **cùng khung giờ**. Với CCU 50, sự kiện sẽ diễn ra với 6 người và cảm giác thất bại
> — tệ hơn hẳn so với không có nó. Chaos Castle (tối thiểu 2 người, tối đa ~70) là thứ **duy nhất**
> trong nhóm này chạy được ở quy mô nhỏ, và nó cũng là cái rẻ nhất. Nếu phải chọn một, chọn nó.
> Ba hệ này chỉ nên làm khi **đã đo được** số người online cùng lúc trong khung giờ tối, không phải khi hy vọng.

### Bảng tổng

| Bậc | Người-tuần | Cộng dồn | Chơi được ngay sau bậc? | Giá trị/chi phí |
|---|---|---|---|---|
| 0 · Đóng cửa hậu | 1–2 | 2 | ✅ | ⭐⭐⭐ (rẻ, nhưng đừng gọi là bảo mật) |
| 1 · Backend lên production | 2–3 | 5 | ✅ | ⭐⭐⭐⭐⭐ |
| 2 · Chuẩn hoá dữ liệu | 4–6 | 11 | ✅ | ⭐⭐⭐⭐⭐ |
| 3 · Thấy nhau trong thành | 4–6 | 17 | ✅ | ⭐⭐⭐⭐ |
| 4 · Server mô phỏng thật | 12–20 | 37 | ✅ | ⭐⭐⭐ (đắt, nhưng bắt buộc nếu muốn PvP/chợ) |
| 5 · Xã hội & kinh tế | 8–12 | 49 | ✅ | ⭐⭐⭐ |
| 6 · Sự kiện thi đấu | 8–12 | 61 | ✅ | ⭐ ở CCU thấp |

**Tổng tới "MU Online thật sự": 37–61 người-tuần ≈ 9–15 tháng cho một người, hoặc 4–6 tháng cho hai người.**

---

## 8. Ba lời khuyên trái ý

1. **Đừng làm Bậc 4 trước khi biết có bao nhiêu người chơi.**
   Bậc 0→3 tốn ~17 tuần và cho bạn: tài khoản, dữ liệu thật, người chơi thấy nhau, và **số liệu CCU**.
   Nếu CCU thật là 20, thì 12–20 tuần cho authoritative server là tiền đổ vào một vấn đề chưa tồn tại.
   Có một lựa chọn giữa mà tôi khuyên cân nhắc nghiêm túc: **giữ client mô phỏng, nhưng server kiểm
   tra thống kê** — server nhận `{EXP, bạc, kill, thời gian phiên}` và từ chối thứ vượt trần vật lý
   (game đã có sẵn mọi hằng số để tính trần: `XP_TABLE`, `MOBS[].xp`, `MOBS[].silver`, thời gian hồi
   sinh quái 3–5 s). Bắt được 95 % người gian lận với **~3 tuần** thay vì 12–20. Nó **không** chặn
   được người gian lận giỏi. Đó là đánh đổi có thật, và với một game PvE thì nó thường đáng.

2. **Sửa `killMob` trước khi làm bất cứ thứ gì khác.**
   Một hàm 232 dòng phát ra: EXP, bạc, 8 loại vật liệu, pet, cánh, Khắc Ấn, Bảo Hạp, trang bị, ngọc,
   pity đai, đếm nhiệm vụ, danh hiệu, mục tiêu ngày. **Mọi bậc từ 2 trở đi đều phải đụng vào nó.**
   Tách nó thành `computeKillRewards(mobDef, playerState) → RewardList` (thuần) + `applyRewards(list)`
   (có tác dụng phụ) là việc **1 tuần** làm **hôm nay**, và nó tiết kiệm nhiều tuần ở mọi bậc sau.
   Nó cũng có giá trị ngay cả khi bạn quyết định không lên online.

3. **PC-only là một giả định sai, và nó đổi thiết kế mạng.**
   `index.html` có joystick, viewport khoá zoom, và `CLAUDE.md` có luật về thứ tự phím J cho điện thoại.
   Nếu có người chơi 4G thì mọi con số ở [5.5](#55-kích-thước-gói-tin-và-số-người-tối-đa-mỗi-map--tính-từ-map-thật)
   phải nhân hệ số an toàn, và đệm nội suy 100 ms phải thành thích ứng 100–250 ms.
   **Hãy chốt câu này trước Bậc 3, không phải trong Bậc 3.**

---

## 9. Những câu hỏi chỉ chủ dự án trả lời được

Trả lời khác đi thì thiết kế khác đi. Xếp theo mức độ ảnh hưởng:

| # | Câu hỏi | Đổi cái gì nếu trả lời khác |
|---|---|---|
| **1** | **Bao nhiêu người chơi ĐỒNG THỜI (CCU) trong 12 tháng tới — 20, 200, hay 2.000?** | 20 → Bậc 4 không đáng, dùng lựa chọn "kiểm tra thống kê" ở [8.1](#8-ba-lời-khuyên-trái-ý). 200 → đúng lộ trình này. 2.000 → cần sharding, message queue, DB tách đọc/ghi ngay từ Bậc 2 |
| **2** | **Có PvP người-với-người không?** | Không → Bậc 4 có thể lỏng hơn nhiều, không cần lag compensation, không cần khớp thời gian. Có → phải làm chuẩn từ đầu, +4–6 tuần vào Bậc 4. Lưu ý: game **đã có** khung PvP (`player.pk`, `player.toiac`, map `freepk`, Du Hiệp) nhưng toàn bộ đối thủ là NPC giả người |
| **3** | **Có giao dịch giữa người chơi không?** | Không → bỏ được `trade_sessions`, `market_listings`, phần lớn `item_ledger` ⇒ tiết kiệm ~4 tuần và **phần lớn rủi ro vận hành**. Có → Bậc 2 thành bắt buộc chứ không phải tuỳ chọn, và cần người trực gian lận |
| **4** | **Có bán vật phẩm/nạp tiền không?** | Có → mọi thứ trên đổi hạng. Ledger thành nghĩa vụ pháp lý, cần hoàn tiền, chống chargeback, và Bậc 4 thành bắt buộc (không ai chấp nhận in đồ trong game có doanh thu) |
| **5** | **PC-only hay có di động?** | Xem [8.3](#8-ba-lời-khuyên-trái-ý) |
| **6** | **Ngân sách vận hành: một VPS, hay chấp nhận nhiều máy?** | Một VPS → trần thực tế ~500–1.000 CCU với kiến trúc này, và **phải chấp nhận rằng nginx chết là trang chết** (đã xảy ra 31.08). Nhiều máy → cần service discovery, tách DB, +2–3 tuần |
| **7** | **Người chơi hiện có được giữ tiến trình không?** | Giữ → phải viết migration blob → bảng. Không giữ → **làm Bậc 2 ngay bây giờ, lúc `SAVE_VERSION 3` vừa xoá sạch**, rẻ hơn nhiều lần |
| **8** | **Ai trực vận hành lúc 3h sáng?** | Không ai → đừng làm Bậc 4. Server mô phỏng là **dịch vụ trạng thái** — nó chết thì người chơi mất tiến trình từ lần lưu gần nhất, không phải chỉ "trang không tải được" |
| **9** | **Có chấp nhận đổi cảm giác chiến đấu để đổi lấy authoritative không?** | Không → Bậc 4 gần như không khả thi ở dạng thuần tuý; phải giữ một phần dự đoán ở client và chấp nhận cửa sổ gian lận nhỏ |

---

## Phụ lục A — Cách đo lại mọi con số

Tất cả script nằm ở `<scratchpad>/`, chạy độc lập, không sửa gì trong repo game.

```bash
# ── Đếm hàm / dòng / phân loại mô phỏng vs vẽ ─────────────────────────
node scan.js        # 540 hàm cột 0 · 13.259 dòng trong hàm · 5.656 dòng ngoài hàm
node split2.js      # pureDraw 2.245 · pureSim 5.165 · mixed 2.776 (58 hàm) · neither 3.073
node audit.js       # 96 hàm chạm RNG/trạng thái → lọc bỏ render còn 84 hàm / 3.680 dòng
node portable2.js   # A: 27 hàm/787 dòng · B: 32 hàm/2.286 dòng · C: 25 hàm/607 dòng

# ── Đếm thô ──────────────────────────────────────────────────────────
cd /home/user/axie-wuxia/public/game
grep -o 'Math.random()' game.js | wc -l                      # 141
grep -oE "player\.[A-Za-z0-9_.]+\s*(\+=|-=|\+\+|--|=[^=])" game.js | wc -l   # 731
grep -oE "player\.silver\s*(\+=|-=|=[^=])" game.js | wc -l    # 107
grep -oE "^window\.[A-Za-z0-9_$]+" game.js | sort -u | wc -l  # 114
wc -c game.js && gzip -c game.js | wc -c                      # 1.177.320 / 373.892

# ── Đo lúc chạy (Playwright, server tĩnh cổng 8853) ───────────────────
cd /home/user/axie-wuxia/public/game && python3 -m http.server 8853 &
NODE_PATH=/opt/node22/lib/node_modules node measure.js   # save 3.542 B (lv1) / 16.864 B (max)
                                                          # 15 map · 46 mẫu quái · MAP 2600×1900
                                                          # món đồ 460 B · player 159 khoá
NODE_PATH=/opt/node22/lib/node_modules node measure2.js  # 60 quái · quái 654 B · snapshot thô
                                                          # 43.336 B · snapshot gọn 1.017 B
NODE_PATH=/opt/node22/lib/node_modules node cheat.js     # chứng minh gian lận trên bản RELEASE

# ── Chứng minh chạy được trên Node ────────────────────────────────────
node docs/online-samples/headless-sim.sample.js
```

**Log gian lận (bản `RELEASE_BUILD = true`, KHÔNG có `?test=1`):**

```json
{ "testMode": false, "releaseBuild": true,
  "windowPlayer": "undefined", "bareplayer": "object",
  "silverBefore": 30,  "silverAfter": 1000000000,
  "levelBefore": 1,    "levelAfterXp": 120,
  "mintedItem": "Ủng Hắc Nguyệt rarity=4 tier=10 +11",
  "savedSilver": 1000000000, "savedLevel": 120, "saveBytes": 4341 }
```

**Log console cheat (thêm `?test=1` vào URL production):**

```json
{ "testMode": true, "hasCheatExec": "function", "before": 30, "after": 999999999, "lv": 120 }
```

---

## Phụ lục B — Nguồn

**Đọc được nguyên văn:**
- [OpenMU `docs/GameMap.md`](https://raw.githubusercontent.com/MUnique/OpenMU/master/docs/GameMap.md) — bucket AoI 8×8 trên map 256×256
- [MUnique/OpenMU](https://github.com/MUnique/OpenMU) · [OpenMU docs/](https://github.com/MUnique/OpenMU/tree/master/docs)

**Chỉ đọc được qua tóm tắt của công cụ tìm kiếm (⚠ nguồn thứ cấp):**
- [ajudaemmuonline — Estrutura do MuServer](https://ajudaemmuonline.blogspot.com/2014/03/estrutura-do-muserver.html)
- [kungfudev — Building a MU Online Server in Rust](https://www.kungfudev.com/blog/2026/02/18/mu) *(egress blocked)*
- [munique.net — On item duplication exploits](https://munique.net/item-duplication-exploits/) *(egress blocked)*
- [darfink/muonline-packet](https://github.com/darfink/muonline-packet) · [RaGEZONE — C1/C2/C3/C4](https://forum.ragezone.com/threads/c1-c2-c3-c4-packet-encryption-decryption-source-code-c.291106/)
- [Chaos Castle — muonlinefanz](https://muonlinefanz.com/guide/minigame/cc/) *(egress blocked)*
- [Castle Siege — StrategyWiki](https://strategywiki.org/wiki/Mu_Online/Castle_Siege) · [muonlinefanz](https://muonlinefanz.com/guide/minigame/cs/)
- [Devil Square — Mu Online Wiki](https://muonline.fandom.com/wiki/Devil_Square) · [Blood Castle — EpicMU](https://guides.epicmu.net/non-pvp-events/blood-castle)
- [IGCN — Adding sub server within a realm](https://www.igcn.mu/guides/server_configuration/adding-sub-server-within-a-realm-r18/) · [RaGEZONE — Making Subservers](https://forum.ragezone.com/threads/making-subservers.594473/)
- [Webzen — Item Trade notice](https://muonline.webzen.com/en/news/notices/all/32194/regarding-illegal-activity-regarding-item-trade)
- [smartfoxserver — MMO Player Movement hacking](https://www.smartfoxserver.com/forums/viewtopic.php?t=20851)

**Không tra được (ghi lại để ai đó làm tiếp):**
- `MaxUserNum` / số người tối đa mỗi map trong MU Online — không tìm thấy nguồn chính thức
- Nhịp tick chính thức của GameServer MU — không tìm thấy
- Thuật toán validate walk packet cụ thể của Webzen — không tìm thấy (chỉ có lời khuyên chung của cộng đồng)
