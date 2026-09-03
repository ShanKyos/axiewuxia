# Khảo sát: cần THÊM gì để Axie Wuxia chạy được online cho 10 người cùng lúc

**Loại tài liệu:** khảo sát. **Không sửa một dòng nào** trong `public/`, `tests/`, `tools/`.
Đây là bản đo hiện trạng và đề xuất, không phải đợt hiện thực.

**Bản mã đã đo:** `44a15b9` trên nhánh `main`, **kèm cây làm việc chưa commit**
(19 tệp, +1.615 / −233 dòng). Đo lại ở một commit sạch có thể lệch vài chục dòng.
**Ngày đo:** 2026-09-03. **Quy mô mục tiêu:** 10 người chơi cùng lúc.

### Ba nhãn dùng suốt tài liệu

| Nhãn | Nghĩa |
|---|---|
| **[ĐO]** | Chạy ra số, hoặc đọc thẳng từ mã có số dòng. Kiểm lại được — cách đo ở [Phụ lục A](#phụ-lục-a--cách-đo-lại-mọi-con-số). |
| **[SUY]** | Suy luận từ số đo. Hợp lý nhưng chưa chạy thử. |
| **[CHƯA KIỂM] | Chưa kiểm chứng được trong hộp cát này (mạng ra ngoài chặn phần lớn, không SSH được vào VPS). Đừng trích như sự thật. |

---

## Mục lục

- [0. Tóm tắt cho người vội](#0-tóm-tắt-cho-người-vội)
- [1. Hiện trạng — đo bằng số](#1-hiện-trạng--đo-bằng-số)
  - [1.1 Kích thước và cách nạp](#11-kích-thước-và-cách-nạp)
  - [1.2 Trạng thái người chơi và định dạng lưu](#12-trạng-thái-người-chơi-và-định-dạng-lưu)
  - [1.3 Vòng lặp trò chơi](#13-vòng-lặp-trò-chơi)
  - [1.4 Client đang tự quyết những gì](#14-client-đang-tự-quyết-những-gì)
  - [1.5 Cửa hậu đang ship lên production](#15-cửa-hậu-đang-ship-lên-production)
  - [1.6 Máy chủ hiện có gì](#16-máy-chủ-hiện-có-gì)
  - [1.7 Bốn chỗ mã đã sẵn sàng cho online](#17-bốn-chỗ-mã-đã-sẵn-sàng-cho-online)
- [2. Những mảng còn THIẾU](#2-những-mảng-còn-thiếu)
- [3. Lộ trình theo giai đoạn](#3-lộ-trình-theo-giai-đoạn)
- [4. Đánh đổi và rủi ro](#4-đánh-đổi-và-rủi-ro)
- [5. Quan hệ với `docs/THIET_KE_ONLINE.md`](#5-quan-hệ-với-docsthiet_ke_onlinemd)
- [Phụ lục A — cách đo lại mọi con số](#phụ-lục-a--cách-đo-lại-mọi-con-số)
- [Phụ lục B — những gì CHƯA kiểm chứng được](#phụ-lục-b--những-gì-chưa-kiểm-chứng-được)

---

## 0. Tóm tắt cho người vội

**[ĐO]** Ba con số quyết định mọi thứ dưới đây:

1. **258 trong 762 hàm ở cột 0 của `game.js` đọc thẳng biến toàn cục `player`** (3.396 tham chiếu
   trên 1.954 dòng). Game không có khái niệm "người chơi thứ hai" — nó có khái niệm
   "**người chơi**", số ít, là một biến module.
2. **`cheatExec()` chạy đầy đủ trên đúng bản phát hành.** Chạy với `RELEASE_BUILD = true`,
   `TEST_MODE = false`, không tham số URL nào: `/silver 999999999` · `/lv 120` ·
   `/item 4 10` · `/god` đều thành công. Không phải suy đoán — đã chạy và in ra kết quả.
3. **Băng thông ở 10 người là chuyện nhỏ.** Ảnh chụp 9 người chơi khác, đóng gói JSON thô,
   là **528 byte**; ở 10 Hz cho 10 client là **51,6 KB/s** tổng chiều ra của máy chủ.
   Mọi tối ưu nhị phân, nén sai phân, hay thư viện WebSocket viết bằng C++ đều **thừa**.

**Kết luận một câu:** phần khó **không** phải mạng, **không** phải hiệu năng, và **không** phải
viết lại phần mô phỏng — mà là **gỡ giả định "chỉ có một người chơi"** ra khỏi tầng vẽ, và
**dời việc sinh vật phẩm cùng cộng tiền tệ lên máy chủ**. Ngoài hai việc đó, đường đi ngắn hơn
nhiều người tưởng.

**Giai đoạn đầu tiên nên làm:** [Giai đoạn 1 — Bóng Người](#giai-đoạn-1--bóng-người-nhỏ), một máy
chủ WebSocket khoảng 150 dòng chỉ chuyển tiếp toạ độ, cộng một tham số cho `drawPlayer()`.
Không tài khoản, không cơ sở dữ liệu, không quyền quyết định. Sau nó, hai người mở hai trình
duyệt sẽ **nhìn thấy nhau chạy trong cùng một bản đồ** — và đó là thứ chứng minh cả hướng đi.

---

## 1. Hiện trạng — đo bằng số

### 1.1 Kích thước và cách nạp

**[ĐO]**

| | |
|---|---|
| `public/game/game.js` | **25.824 dòng · 1.641.782 byte** (1,64 MB thô) |
| Cùng tệp sau gzip mức 6 | **520.307 byte** (31,7% bản gốc) |
| `public/game/style.css` | 1.350 dòng · 103.384 byte |
| `public/game/lang.js` | 42.905 byte |
| Toàn bộ `public/game/` | **38,2 MB**, trong đó `assets/` là **36,2 MB** / 249 tệp |

**Cách nạp: script thường, không module, không bước dựng.**
`public/game/index.html:193-198` nạp đúng năm thẻ `<script src=...>` theo thứ tự
`strings/en.js` → `strings/vi.js` → `i18n.js` → `lang.js` → `game.js`.
Không có `type="module"`; số dòng `import`/`export` ở đầu dòng trong `game.js` là **0**.
Mọi thứ nằm chung một phạm vi toàn cục.

**Hệ quả cho online [SUY]:** không cần dựng bundler, nhưng cũng **không có ranh giới module nào**
để tách phần mô phỏng khỏi phần vẽ. Muốn dùng lại `game.js` trên máy chủ thì phải nạp cả tệp
vào một ngữ cảnh `vm` (đã chứng minh chạy được — xem [1.7](#17-bốn-chỗ-mã-đã-sẵn-sàng-cho-online)).

**Số hàm và biến toàn cục [ĐO]:**

| | |
|---|---|
| Hàm khai ở cột 0 (`function x(){`) | **762** |
| Hàm gán vào `window.` | **139** |
| Biến trạng thái đổi được ở cột 0 (`let`/`var`) | **79** |

79 biến đó gồm `player`, `mobs`, `curMap`, `camera`, `groundLoot`, `questIdx`, `sideStates`,
`hitStop`, `shakeT`, `moveTarget`, `horses`, `boxThrows`… — tức là **toàn bộ thế giới là trạng
thái đơn lẻ ở tầng module**. Một ngữ cảnh `vm` = đúng một thế giới.

### 1.2 Trạng thái người chơi và định dạng lưu

**Nơi lưu [ĐO]:** `localStorage`, khoá `vlcm_save`. `game.js` có **17 chỗ** chạm `localStorage`.

**Định dạng [ĐO]** — `public/game/game.js:5897-5904`:

```
SAVE_VERSION = 5      // bản hiện tại
SAVE_COMPAT  = 3      // dưới mốc này là XOÁ, từ mốc này là chuyển đổi được
MAX_CHARS    = 5      // năm ô nhân vật, đúng con số của MU
```

Bọc ngoài (`docTrong()`, `game.js:5904`):

```json
{ "v": 5, "slots": [ ô0, ô1, ô2, ô3, ô4 ], "active": 0, "savedAt": 0 }
```

Mỗi ô (`saveGame()`, `game.js:5958-5969`) là
`{ player, questIdx, questProg, questState, victory, curMap, sideStates, savedAt }`.

**Kích thước thật, đo bằng cách dựng nhân vật rồi `JSON.stringify` [ĐO]:**

| Trạng thái | Một ô | Cả `doc` 5 ô |
|---|---|---|
| Nhân vật mới tạo (cấp 1, túi 1 món) | **3.258 byte** | ~16 KB |
| Cấp 80, 16 món trong túi, đã tự mặc đồ | **14.334 byte** | 71.727 byte |
| Cấp 120, **túi đầy 64 ô + kho đầy 60 ô** | **42.323 byte** | **211.648 byte** |

Một món trang bị đơn lẻ: **474 byte**. Đối tượng `player` có **153 khoá ở tầng cao nhất**.
Con số 42 KB khớp với ghi chú sẵn có trong mã (`game.js:5906`: "một nhân vật đầy đủ nặng 44 KB").

**Đường đồng bộ lên cloud [ĐO]:** `game.js:23978-24012` gửi `postMessage({type:'vlcm:save'})`
lên `window.parent` — **chỉ chạy khi game nằm trong iframe**. Dòng đầu tiên của khối là
`if (!window.parent || window.parent === window) return;`. Production phục vụ
`public/game/index.html` trực tiếp qua nginx (xem [1.6](#16-máy-chủ-hiện-có-gì)), **không có
iframe**, nên toàn bộ nhánh cloud save hiện là mã chết trên production. [SUY]

**Đường ghi có 110 điểm gọi [ĐO]:** `saveGame()` được gọi từ **110 chỗ** trong `game.js`.
**[SUY]** Nếu đổi sang lưu trên máy chủ mà giữ nguyên 110 điểm gọi thì mỗi điểm thành một
lượt ghi mạng. Ở 10 người thì vẫn chịu được, nhưng phải gom lại (chống rung, ghi theo lô).

### 1.3 Vòng lặp trò chơi

**[ĐO]** `loop(now)` ở `public/game/game.js:17652-17667`:

- Chạy bằng `requestAnimationFrame` — **theo tốc độ làm tươi màn hình**, thường 60 Hz,
  có thể 120/144 Hz trên màn hình cao.
- `dt` bị chặn trần: `Math.min(0.05, (now - lastTime)/1000)` — tức là **tối đa 50 ms mỗi bước**.
- Mỗi khung: `update(dt)` → `render()` → `drawPerfHud()`, gói trong `try/catch`.
- `update(dt)` bị **bỏ hẳn** khi hoạt ảnh Khế Ước đang chạy (`_kuChay`), `render()` vẫn chạy.

**`update(dt)` ở `game.js:8580-9419` = 840 dòng.** Những gì nó làm mỗi khung [ĐO], theo tần suất
gọi hàm bên trong thân:

| Hàm | Số lần xuất hiện trong thân `update()` |
|---|---|
| `addFloat` (chữ nổi) | 31 |
| `dist` (khoảng cách) | 23 |
| `Math.random` | **21** |
| `addEffect` (hiệu ứng) | 19 |
| `AudioSys.sfx` | 7 |
| `dbOf` | 7 |
| `collideObstacles` | 6 |
| `killMob` | 5 |
| **`saveGame`** | **4** (có điều kiện) |
| `collideAiPass` | 2 |

Khối lượng thế giới mỗi khung [ĐO], đo bằng `buildWorld()` từng bản đồ:

| Bản đồ | Số quái | NPC | `JSON.stringify(mobs)` |
|---|---|---|---|
| `daohoa` | **60** | 3 | 37.964 byte |
| `ngoai` | 49 | 1 | 32.038 byte |
| `chungnam` | 43 | 2 | 30.340 byte |
| `comoc` · `tuyettinh` · `mongco` · `nhanmon` | 45 mỗi bản đồ | 1–2 | ~31 KB |
| `tuongduong` (thành) | **0** | 8 | 2 byte |
| 7 phó bản `pb_*` | 0 khi mới dựng | 0 | 2 byte |

**Chi phí CPU của một tick mô phỏng, chạy trên Node [ĐO]:**

| Phép đo | Kết quả |
|---|---|
| 600 tick @ 20 Hz, 61 quái, lần chạy nguội | 312 ms ⇒ **520 µs/tick** |
| Sau khi hâm nóng JIT, 5 vòng × 2.000 tick | **2–3 µs/tick** |

**[SUY]** 3 µs/tick cho một thế giới nghĩa là 10 thế giới riêng biệt ở 20 Hz tốn khoảng
`10 × 20 × 3 µs = 0,6 ms` mỗi giây CPU — tức **0,06% một lõi**. CPU mô phỏng tuyệt đối không
phải nút thắt ở quy mô này. Đừng đọc ngược con số này thành "máy chủ gánh được 10.000 người":
phép đo là một thế giới, một người chơi, không serialize, không ghi đĩa, không TLS.

### 1.4 Client đang tự quyết những gì

Đây là phần quan trọng nhất. **Mọi dòng dưới đây là [ĐO]** — tên hàm và số dòng đọc thẳng từ mã.

**Bức tranh tổng [ĐO]:** `Math.random` xuất hiện **149 lần trên 139 dòng**. Có **800 chỗ ghi
vào `player.*`** (`player.x = `, `player.silver += `, …). Không có một dòng `WebSocket` nào,
không có `XMLHttpRequest`, và đúng **2** lời gọi `fetch()` — cả hai đều là NPC trò chuyện bằng
AI (`game.js:22985` và `game.js:23028`), không dính gì tới trạng thái trò chơi.

| Nhóm | Hàm · số dòng | Client quyết cái gì | Gian lận được kiểu gì nếu để nguyên |
|---|---|---|---|
| **Sát thương** | `hurtMob()` — `game.js:7379` | Điểm áp sát thương **DUY NHẤT** của toàn game. Tính khắc hệ, bạo kích, hất lùi, gọi `killMob`. | Gọi thẳng `hurtMob(m, 1e9, 'hit')` từ devtools ⇒ một đòn hạ mọi thứ. |
| **Chiêu thức** | `castSkill()` — `game.js:20756` | Trừ Mana, đặt hồi chiêu, sinh đạn, áp sát thương. | Bỏ qua hồi chiêu và chi phí. |
| **Chỉ số** | `calcDerived()` — `game.js:5564` | Toàn bộ chỉ số dẫn xuất: công, máu, xuyên giáp, Khắc Ấn. | Ghi đè `player.atk` sau khi hàm chạy. |
| **EXP** | `gainXp()` — `game.js:7817` | Cộng kinh nghiệm, lên cấp, mở kỹ năng. | `gainXp(1e9)` ⇒ cấp 120 tức thì. |
| **Phần thưởng khi giết** | `computeKillRewards()` — `game.js:7551` · `applyRewards()` — `game.js:7630` | Quay EXP, Lumen, ngọc, cánh, vật liệu, đồ rơi, "vận may tích luỹ" cho boss. | Gọi trực tiếp, lặp vô hạn. |
| **Sinh vật phẩm** | `genItem()` — `game.js:5157` | Dựng một món đồ hoàn chỉnh: phẩm, giai, dòng phụ, Khắc Ấn. | `genItem(120,0,'tranai')` rồi gán tay `rarity=4, tier=10, plus=11`. |
| **Rơi ngọc** | `rollJewels()` — `game.js:197` | Tứ Châu rơi ra từ quái. | Gọi lặp. |
| **Đồ rơi xuống đất** | `dropToGround()` — `game.js:7080` | Đặt vật thể có toạ độ, nằm 45 giây. **Không lưu vào save**, bị xoá trong `buildWorld()`. | Sinh đồ tuỳ ý dưới chân. |
| **Ép ngọc** | `epNgoc()` + bảng `NGOC_EP` — `game.js:20382` | Tỉ lệ +0..+11: Chúc Phúc 100%, Linh Hồn 50%, Phá Thiên Kiếp 50/45%. | Ghi thẳng `it.plus = 11`, hoặc gọi tới khi thành công. |
| **Chế tạo / Lò Hỗn Độn** | `CHAOS_RECIPES[].run()` — quanh `game.js:14950`, `15072`, `15211`, `15286`, `15350`, `15654` | Trừ nguyên liệu và trả kết quả trong cùng một lượt. | Bỏ qua bước trừ. |
| **Tiền tệ** | **41 chỗ** ghi vào `player.silver` (Lumen). Ví dụ `game.js:7632`, `7654`, `20634`, `21138` | Cộng/trừ Lumen, Shard, Ấn Giao Kết. | Gán `player.silver = 1e9`. |
| **Túi và kho** | `bagThem()` — `game.js:20018` | Đặt món vào lưới, tính chỗ trống. | Nhét vô hạn món. |
| **Đồng hồ sự kiện** | `matonNextBoundary()` — `game.js:25258` · `goldenNextBoundary()` — `game.js:25328` · `riftNextBoundary()` — `game.js:25420` | Mốc giờ sự kiện thế giới, suy thẳng từ `Date.now()` trên máy người chơi. | Chỉnh đồng hồ máy để sự kiện luôn đang mở. |

**Chỗ đau nhất [ĐO]:** `hurtMob()` là **một cửa duy nhất** cho mọi sát thương của toàn game.
Đó vừa là điểm yếu (bịt được một chỗ là gian lận được hết) vừa là món quà — muốn ghi nhật ký,
kiểm tra hay dời lên máy chủ thì cũng chỉ có **một** chỗ phải đụng.

### 1.5 Cửa hậu đang ship lên production

Đây không phải suy đoán. **[ĐO]** — chạy `game.js` trong Node, đặt `window.RELEASE_BUILD = true`,
`window.TEST_MODE = false`, `location.search = ''`, rồi gọi thẳng `cheatExec`:

```
truoc : { silver: 30,        lv: 1,   shard: 0    }
sau   : { silver: 999999999, lv: 120, shard: 9999, god: true }
món vừa đúc : "Ủng Hắc Nguyệt r4 t10"   (phẩm cao nhất, giai cao nhất)
```

Ba chi tiết đáng ghi lại:

1. **`window.cheatExec` không có cửa chắn nào.** `game.js:17215` vào thẳng `switch(cmd)`, không
   kiểm `RELEASE_BUILD`, không kiểm `TEST_MODE`. Cờ `TEST_MODE` chỉ gác **phím tắt** dấu huyền
   (`game.js:6971`) và việc **hiện** ô console, không gác việc **gọi hàm**.
2. **Khung console vẫn nằm trong HTML phát hành.** `public/game/index.html:191` ship nguyên
   `<div id="cheat-console">` với `onkeydown` gọi thẳng `cheatExec(this.value)`.
3. **`?test=1` là tính năng cố ý.** `game.js:17097` đặt
   `window.TEST_MODE = /([?&])(test|max)=1/.test(location.search)` — không có `RELEASE_BUILD`
   trong biểu thức. `CLAUDE.md` ghi rõ đây là chủ đích ("thêm `?test=1` để mở chế độ thử").
   Lệnh `/max` gọi `applyTestBoost()` (`game.js:16295`) — cấp 120, 999.999 Lumen, đủ Chimera,
   đủ ngọc.
4. **`window.player` là `undefined` nhưng `player` thì không.** Đo được:
   `typeof window.player` → `"undefined"`, `typeof player` → `"object"`. Ai kiểm bằng
   `window.player` rồi kết luận "an toàn" là kết luận sai. `let` ở tầng cao nhất của script
   thường không gắn vào `window` nhưng vẫn ở trong phạm vi console đọc được.

**Với chế độ chơi một mình thì tất cả những cái trên là vô hại** — người chơi tự phá game của
mình, đó là quyền của họ. **Với online có kinh tế chung thì mỗi dòng ở trên là một máy in tiền.**

### 1.6 Máy chủ hiện có gì

**Production hôm nay [ĐO]** — đọc từ `deploy/nginx-server-block.conf` (bản chép nguyên văn từ VPS):

```nginx
server {
    listen 80;
    server_name 14.225.204.107;
    root /var/www/axiewuxia/public/game;   # trỏ THẲNG vào thư mục game
    location / { try_files $uri $uri/ =404; }
}
```

**Không có `proxy_pass`, không có `location /api`, không có tiến trình Node.** `grep` cả hai tệp
cấu hình nginx trong `deploy/` ra **0** kết quả cho `proxy_pass`. Production là **nginx phục vụ
tệp tĩnh**, hết. `deploy/nginx-axiewuxia.conf` chỉ thêm gzip và `Cache-Control`.

Triển khai [ĐO, đọc từ `CLAUDE.md`]: cron `*/2 * * * *` trên VPS chạy
`git fetch origin main && git reset --hard origin/main`. **Đẩy lên `main` LÀ triển khai**,
trong vòng 2 phút. Không có bước duyệt, không có nhánh phụ, không có PR.

**Vỏ máy chủ có trong kho nhưng KHÔNG được triển khai [ĐO]:**

| Thành phần | Tệp | Trạng thái |
|---|---|---|
| HTTP + tRPC | `api/boot.ts` (Hono + `@hono/node-server`, cổng 3000) | Có mã, không chạy trên production |
| Bộ định tuyến | `api/router.ts` — `ping · config · auth · save · leaderboard · wallet · google · npc` | Có mã |
| Đăng nhập ví Ronin | `api/walletRouter.ts` — Sign-In With Ethereum rút gọn, nonce trong RAM, TTL 5 phút | **Đã viết xong** |
| Đăng nhập OAuth | `api/kimi/auth.ts`, `api/googleRouter.ts` | Có mã |
| Lưu trên cloud | `api/saveRouter.ts` — `get`/`put`, chặn ghi đè bản mới hơn, giới hạn 2 MB | Có mã |
| Cơ sở dữ liệu | `db/schema.ts` — MySQL qua Drizzle, 3 bảng: `users` · `saves` (1 dòng/người, `mediumtext`) · `leaderboard` | Có lược đồ, 2 lần di trú |
| NPC nói bằng AI | `api/npcRouter.ts` — 3 NPC, provider theo chuẩn OpenAI, 20 lượt/ngày, luôn có thoại dự phòng | Có mã, là `fetch` duy nhất từ game |
| Vỏ React | `src/pages/GamePage.tsx` — nhúng game bằng `<iframe src="/game/index.html">`, cầu `postMessage` hai chiều | Có mã |

**Vỏ này đã lạc hậu so với game [ĐO].** `src/pages/GamePage.tsx:11-32` còn giữ
`REALM_NAMES` (hệ Đan Điền **đã bị gỡ**, xem `CLAUDE.md`) và `SECT_NAMES` với **10 lớp** kiểu Axie
(`Mech`, `Aquatic`, `Bug`, `Dawn`…) trong khi game hiện chỉ có **5 lớp** kiểu MU.
`api/saveRouter.ts:34` đọc `p.dantian?.realm` — trường đã bị dọn khỏi `loadGame()`.
`README.md` cũng còn tả game là "Axie adventure RPG, 9 lớp, 8 vùng", tức là mô tả một bản trước
đợt MU-hoá.

**[SUY]** Vỏ backend này là tài sản thật (đăng nhập ví Ronin viết xong là công đáng kể), nhưng
**không dùng lại nguyên trạng được** — phải dọn phần lược đồ ăn theo hệ đã gỡ trước.

### 1.7 Bốn chỗ mã đã sẵn sàng cho online

Không phải cái gì cũng phải xây lại. Bốn chỗ dưới đây **đã đúng hình dạng cần có**:

1. **`computeKillRewards()` là hàm thuần [ĐO].** `game.js:7551`. Chú thích ngay trên nó nói
   thẳng mục đích: *"máy chủ tự tính thưởng thay vì tin client"*. Hợp đồng: **không ghi một byte
   nào vào `player`**, không đụng DOM, không phát âm thanh; chỉ đọc `P` và quay `rng` truyền vào.
   `applyRewards()` (`game.js:7630`) mới là nơi ghi. Có bài kiểm `test_killrewards.js` gác điều đó.
   **Cảnh báo có sẵn trong chú thích:** `genItem`/`genPet`/`genWing` bên trong **vẫn tự gọi
   `Math.random()` riêng**, nên truyền hạt giống vào `computeKillRewards` **chưa đủ** để tái lập
   y hệt một cú giết.
2. **`hurtMob()` là cửa sát thương duy nhất [ĐO].** Một chỗ để chặn, ghi nhật ký, hoặc dời lên
   máy chủ.
3. **Sự kiện thế giới không lưu trạng thái [ĐO].** `matonMapFor()` (`game.js:25264`) và
   `goldenMapFor()` (`game.js:25333`) là **hàm thuần của `Date.now()`** — bản đồ nào bị Xâm Lăng
   Vàng ở mốc giờ nào là tính ra được, không cần ai đồng bộ với ai. Đây đúng là hình dạng của
   một sự kiện chung. ⚠ Nhưng phần **giờ** thì hỏng — xem [4.2](#42-cái-gì-trong-thiết-kế-hiện-tại-chống-lại-việc-lên-online).
4. **`game.js` chạy nguyên xi trên Node [ĐO].** `docs/online-samples/headless-sim.sample.js` nạp
   cả năm tệp vào một ngữ cảnh `vm` với khoảng 65 dòng DOM giả, rồi chạy `buildWorld()`,
   `update()`, `hurtMob()`, `killMob()` thành công. **Đã chạy lại ở bản `44a15b9` này và vẫn
   xanh.** Nghĩa là câu "lên online phải viết lại phần mô phỏng" là **sai** với dự án này.

---

## 2. Những mảng còn THIẾU

Mỗi mảng: nó là gì · vì sao cần · **mức tối thiểu chấp nhận được ở 10 người**.

### 2.1 Máy chủ và giao thức đồng bộ

**Là gì:** một tiến trình luôn chạy, giữ danh sách ai đang kết nối, ai ở bản đồ nào, và chuyển
tiếp trạng thái giữa họ.

**Hiện có:** **không có gì.** `game.js` có 0 dòng `WebSocket`, 0 `XMLHttpRequest`, 2 `fetch` —
cả hai cho NPC trò chuyện. [ĐO]

**Chọn WebSocket hay HTTP thăm dò? [SUY]** WebSocket, không phải vì hiệu năng mà vì **độ trễ và
sự đơn giản**. Thăm dò HTTP ở 10 Hz nghĩa là 100 request/giây cho 10 người, mỗi cái mang đủ
header và bắt tay lại — nhiều mã hơn, nhiều rác hơn, mà vẫn tệ hơn. WebSocket giữ một kết nối,
đẩy được cả hai chiều.

**Nhịp gửi tin — đề xuất [SUY]:**

| Loại tin | Nhịp | Vì sao |
|---|---|---|
| Vị trí người chơi (client → máy chủ) | **10 Hz** | Game là **click-to-move** — nhân vật chạy theo một đích đã biết, không phải theo phím bấm từng khung. Client gửi *đích* nhiều hơn là gửi *toạ độ*, nên 10 Hz đã dư. |
| Ảnh chụp thế giới (máy chủ → client) | **10 Hz** | Đủ mượt cho nhân vật chạy ~120 px/s; phần còn lại để client nội suy. |
| Boss thế giới lúc sự kiện | **10 Hz** | Cùng ống, cùng nhịp. |
| Trò chuyện, giao dịch, thao tác túi đồ | **theo sự kiện** | Không có lý do gì để đưa vào tick. |
| Lưu nhân vật | **chống rung 2–5 giây** + lúc thoát | Hiện `saveGame()` bị gọi từ 110 chỗ [ĐO]; không gom lại thì thành 110 lượt ghi mạng. |

**Kích thước gói tin — [ĐO], đo bằng cách dựng ảnh chụp thật:**

| Nội dung | Byte |
|---|---|
| 9 người chơi khác `{i,x,y,hp,mhp,act,face}`, JSON | **528** |
| Như trên, cộng một boss thế giới | **590** |
| Cùng dữ liệu, đóng gói nhị phân (9 byte/người + 5 byte đầu) | 86 |
| Một người chơi, chỉ toạ độ `{id,x,y}` | 26 |
| Một người chơi, đủ để vẽ | 115 |

**Băng thông ở 10 người, 10 Hz [ĐO/SUY]:**

| | |
|---|---|
| Mỗi client nhận | **5,2 KB/s** (~42 kbit/s) |
| Máy chủ gửi ra, tổng 10 client | **51,6 KB/s** (~0,42 Mbit/s) |
| Nếu đóng gói nhị phân | 8,4 KB/s |

**⇒ Kết luận [SUY]:** JSON thô là quá đủ. Chênh lệch 51,6 KB/s so với 8,4 KB/s không đáng một
dòng mã đóng gói nhị phân nào, và JSON thì đọc được bằng mắt khi gỡ lỗi. **Đừng tối ưu chỗ này.**

**Mức tối thiểu cho 10 người:** một tiến trình Node, thư viện `ws` (thư viện phổ thông, không
cần bản C++), một `Map` trong bộ nhớ ánh xạ `id kết nối → {map, x, y, hp, sect, lv, tên}`,
một `setInterval` 100 ms phát ảnh chụp cho từng bản đồ. **[CHƯA KIỂM]** Tôi không đo được số
kết nối tối đa của `ws` trên chính VPS này; nhưng ở 10 kết nối thì con số đó không liên quan.

### 2.2 Tài khoản và đăng nhập

**Là gì:** một danh tính bền vững để nhân vật thuộc về ai đó, và để người khác gọi tên.

**Hiện có [ĐO]:** không có tài khoản. `player.name` được đặt đúng **một lần**
(`game.js:16919`) bằng `genCharName()` (`game.js:23716`) hoặc tên người chơi tự gõ, rồi chỉ
được **đọc lại một chỗ duy nhất** — dựng HUD (`game.js:20950`). Không có định danh nào ngoài
khoá `localStorage`.

**Trong kho đã có [ĐO]:** `api/walletRouter.ts` hiện thực đăng nhập bằng ví Ronin
(xin nonce → ký `personal_sign` → `verifyMessage` bằng `viem` → cấp cookie phiên,
`unionId = ronin:<địa chỉ>`). `api/kimi/auth.ts` và `api/googleRouter.ts` là hai đường OAuth khác.

**Mức tối thiểu cho 10 người [SUY]:** ở alpha, cách rẻ nhất là **một mã mời + một tên**.
Máy chủ giữ bảng `tài khoản(id, tên, mã băm mật khẩu, tạo lúc)`. Không cần xác thực thư điện tử,
không cần đặt lại mật khẩu, không cần OAuth. **Nhưng** nếu định mở PvP hay giao dịch thì cần
đúng một thứ: **tên là duy nhất và không đổi được tuỳ tiện** — nếu không, không ai truy được
ai lừa ai.

Đường ví Ronin đã viết xong là lựa chọn tốt hơn nếu chấp nhận rào cản "phải có ví". [SUY]

### 2.3 Lưu trữ phía máy chủ và sao lưu

**Là gì:** nhân vật online phải nằm trên máy chủ, không nằm trên máy người chơi.

**Vì sao [ĐO + SUY]:** đây là hệ quả trực tiếp của [1.5](#15-cửa-hậu-đang-ship-lên-production).
Chừng nào nguồn sự thật còn ở `localStorage` thì mọi thứ khác — chống gian lận, giao dịch,
bảng xếp hạng — đều vô nghĩa, vì người chơi sửa được tệp lưu của mình bằng một dòng trong
devtools.

**Luật chịu lực, mượn từ `docs/THIET_KE_ONLINE.md` và giữ nguyên:** nhân vật offline **không
bao giờ** mang lên online được, và ngược lại. Đây là cách Diablo II tách "open" với "closed
realm". Bỏ luật này là bỏ toàn bộ phần chống gian lận.

**Mức tối thiểu cho 10 người [SUY]:**

- **SQLite một tệp** là đủ. Lược đồ MySQL đã có trong `db/schema.ts` nhưng ở 10 người thì
  MySQL chỉ thêm một tiến trình phải trông. Bảng cần: `tài_khoản`, `nhân_vật` (một dòng mỗi
  ô, cột `dữ_liệu` là JSON blob).
- **Giữ nguyên dạng blob.** Một nhân vật bão hoà là **42.323 byte** [ĐO]; 10 người × 5 ô là
  khoảng **2 MB tổng**. Không cần chuẩn hoá trang bị ra bảng riêng ở giai đoạn này — đó là
  công việc chỉ đáng làm khi cần **truy vấn** trang bị (chợ, truy vết dupe).
- **Sao lưu:** `cp` tệp SQLite sang thư mục có đóng dấu thời gian, mỗi giờ, giữ 48 bản.
  Đó là tất cả. Ở 2 MB thì 48 bản là 96 MB.
- **⚠ Cạm bẫy đã ghi trong `CLAUDE.md`:** script triển khai chạy `git reset --hard` trong
  `/var/www/axiewuxia`. **Tệp cơ sở dữ liệu tuyệt đối không được nằm trong cây git đó** —
  nó sẽ bị xoá ở lần kéo kế tiếp.

### 2.4 Đồng bộ trạng thái — ai nhìn thấy ai, đồng bộ những gì

**Hiện có [ĐO]:** không có gì. Và đây là chỗ đau nhất về mặt mã:

- `drawPlayer()` (`game.js:14458-14703`, **246 dòng**) **không nhận tham số nào**. Dòng đầu là
  `const sect = SECTS[player.sect]`, dòng thứ ba là `const p = player;`, rồi thân hàm đọc `p.`
  **103 lần**. Nó được gọi từ **đúng một chỗ**: `game.js:9748`.
- Trong 246 dòng đó, biến **module** `bayCao` (độ cao bay theo bậc cánh) được dùng **6 lần**.
  Đây là trạng thái vẽ **chung cho cả tiến trình** — hai người chơi đeo cánh khác bậc sẽ
  giành nhau một biến.
- `camera` (`game.js`, biến ở cột 0) bám cứng vào `player`.

**⇒ [SUY]** Việc "vẽ người chơi thứ hai" nhỏ hơn vẻ ngoài rất nhiều: đổi chữ ký thành
`drawPlayer(p)`, sửa **một** tham chiếu `player.` ở dòng đầu, và chuyển `bayCao` từ biến module
vào một trường trên đối tượng người chơi. Ước lượng: **vài chục dòng**, không phải vài trăm.

**Đồng bộ những gì — đề xuất theo thứ tự ưu tiên [SUY]:**

| Trường | Giai đoạn nào cần | Lý do |
|---|---|---|
| `map`, `x`, `y` | **1** | Không có thì không thấy nhau. |
| `sect`, `level`, `name` | **1** | Vẽ đúng lớp, hiện nhãn tên. |
| `hp`/`maxHp` | 1 | Thanh máu trên đầu — cực rẻ, làm luôn. |
| Chữ ký trang bị (`gearVisual`) | 2 | Thấy người khác lên đồ là một nửa động lực của MU. Chữ ký, **không** phải cả `player.equip`. |
| Hành động ra đòn (`atkAct`/`castAct`) | 2 | Đứng im trong lúc đánh nhau trông như lỗi. |
| Cánh (`wingBac`) | 2 | Cùng lý do với trang bị. |
| Trạng thái buff/debuff | 3 | Chỉ có nghĩa khi đánh chung boss. |
| Túi đồ, kho, tiền | **không bao giờ** | Của riêng. Không phát cho ai. |

**Nội suy / dự đoán [SUY]:** game là **click-to-move** (`moveTarget`, `movePlanMake`,
`simulateMovePath` — WASD đã bị gỡ hẳn, xem `CLAUDE.md`). Đây là **lợi thế lớn**: thay vì đồng
bộ toạ độ từng khung, client gửi *một cái đích*, máy chủ và mọi client khác **chạy cùng thuật
toán né vật cản có sẵn** tới đúng đích đó. Sai lệch chỉ tích tụ khi có va chạm. Ở 10 người trong
mạng nội địa, nội suy tuyến tính giữa hai ảnh chụp cách nhau 100 ms là đủ; **không cần** dự đoán
phía client, không cần hoà giải, không cần bù trễ.

**Mức tối thiểu cho 10 người:** máy chủ giữ một `Map` trong RAM, phát cho mọi người **cùng một
bản đồ** ảnh chụp đầy đủ 10 Hz. Không lọc theo tầm nhìn (AoI), không sai phân — xem
[4.3](#43-cái-gì-là-thừa-ở-quy-mô-10-người).

### 2.5 Máy chủ có quyền quyết định và chống gian lận

Đây là mảng đắt nhất và cũng là mảng dễ làm quá tay nhất. Câu hỏi đúng **không** phải
"làm sao chống gian lận" mà **"cái gì bị mất nếu người này gian lận"**.

**Ranh giới đề xuất [SUY]:**

| Phải lên máy chủ, không thương lượng | Để client tự tính cũng được ở 10 người |
|---|---|
| **Sinh vật phẩm** (`genItem`) — món đồ tồn tại vĩnh viễn và trao đổi được | Sát thương từng đòn (`hurtMob`) — chỉ ảnh hưởng tốc độ cày của chính mình |
| **Cộng tiền tệ** (`player.silver`, `shard`, `Ấn Giao Kết`) | Vị trí, hoạt ảnh, hiệu ứng |
| **Kết quả ép ngọc** (`epNgoc`) — quyết định giá trị món đồ | Hồi chiêu, chi phí Mana |
| **Kết quả chế tạo / Lò Hỗn Độn** | Nhặt thảo dược, mở bản đồ, hội thoại NPC |
| **Chuyển đồ giữa hai người** (nếu mở giao dịch) | Tiến độ nhiệm vụ đơn tuyến |
| **Máu boss thế giới chung** | Máu quái thường trong thế giới riêng |
| **Thời điểm sự kiện thế giới** | — |

**Lý do của ranh giới này [SUY]:** một người tự cày nhanh gấp mười chỉ phá game của chính họ.
Một người **đúc ra một món đồ hoàn hảo rồi bán vào nền kinh tế** thì phá game của tất cả, và
không có cách nào thu hồi mà không cuộn ngược cả cơ sở dữ liệu.

**Điểm may mắn [ĐO]:** `computeKillRewards()` đã là hàm thuần và chú thích của nó nói thẳng
rằng nó được tách ra **chính vì mục đích này**. Đường ngắn nhất là: client báo "tôi vừa hạ
quái `id` ở bản đồ `m`", máy chủ chạy `computeKillRewards()` bằng chính `game.js` nạp trong
`vm`, quay số bằng hạt giống của mình, ghi kết quả vào cơ sở dữ liệu, rồi trả về. Client vẫn
chạy toàn bộ phần còn lại.

**Cạm bẫy đã ghi sẵn trong mã [ĐO]:** `genItem`/`genPet`/`genWing` **vẫn tự gọi `Math.random()`
riêng** (`game.js:7548-7550`), nên truyền hạt giống vào `computeKillRewards` chưa đủ để tái lập
một cú giết. Muốn tái lập được thì phải luồn `rng` xuống cả ba hàm đó — **[SUY]** đây là việc
riêng, cỡ vừa, và chỉ cần thiết khi muốn **kiểm chứng lại** một cú giết chứ không phải khi
muốn máy chủ **quyết định** nó.

**Kiểm tra hợp lý, mức rẻ nhất mà vẫn có tác dụng [SUY]:** máy chủ không cần mô phỏng chiến đấu
để bắt phần lớn gian lận. Ba trần đơn giản là đủ ở 10 người:

- EXP mỗi phút không được vượt quá `X` lần mức cao nhất từng đo được của một người chơi thật.
- Số lần "tôi vừa giết quái" mỗi phút có trần.
- Toạ độ báo về không được nhảy quá `tốc độ tối đa × thời gian trôi` — chống dịch chuyển tức thời.

Vượt trần thì **ghi nhật ký và gắn cờ**, đừng đá ngay. Ở 10 người, việc đọc nhật ký bằng mắt
rẻ hơn mọi hệ tự động, và tránh được cảnh đá nhầm người chơi thật vì một lần mạng giật.

**Việc bắt buộc phải làm trước mọi thứ khác [ĐO]:** gỡ `cheatExec` khỏi bản online. Không phải
ẩn — **gỡ**. Chừng nào nó còn đó thì mọi hàng rào phía trên đều vô nghĩa.

**Nói thẳng để không ai tưởng nhầm [SUY]:** gỡ console **không** làm client đáng tin. Devtools
của trình duyệt luôn ở đó. Gỡ console chỉ hạ mức khó từ "gõ một dòng" lên "phải đọc hiểu mã" —
đáng làm, nhưng không thay thế được việc dời quyền quyết định lên máy chủ.

### 2.6 Quái và chiến đấu nhiều người

**Hình mẫu đề xuất [SUY], theo đúng hướng `docs/THIET_KE_ONLINE.md` đã chốt:**
**solo là mặc định, chia sẻ là khoảnh khắc.**

| | Ai làm chủ | Đồng bộ liên tục? |
|---|---|---|
| Quái thường, đồ rơi thường, nhiệm vụ, cày cuốc | **Client** — y như hôm nay | Không |
| Boss sự kiện thế giới (Hung Thần · Xâm Lăng Vàng · Chúa Tể Vực Nứt) | **Máy chủ** | Chỉ trong lúc sự kiện |
| Vị trí người chơi khác cùng bản đồ | Máy chủ | Có, 10 Hz |
| Giao dịch, kho, tiền tệ | **Máy chủ** | Theo thao tác |

**Vì sao mô hình này rẻ [ĐO]:** một bản đồ có **43–60 quái**, `JSON.stringify(mobs)` ra
**30–38 KB**. Đồng bộ ngần ấy ở 10 Hz cho 10 người là **3–3,8 MB/s** — gấp **74 lần** cái
51,6 KB/s của việc chỉ đồng bộ người chơi. Ba đến bốn megabyte mỗi giây để mọi người thấy chung
một con lợn rừng ở cùng một chỗ là cái giá không đáng trả.

**Chia công, chia đồ ở boss chung — mức tối thiểu [SUY]:**

- Máy chủ giữ `hp` của boss và một bảng `id người chơi → tổng sát thương đã gây`.
- Ai gây ≥ một ngưỡng nhỏ (ví dụ 5% máu boss) thì **được phần thưởng riêng của mình** —
  máy chủ chạy `computeKillRewards()` một lần cho mỗi người đủ điều kiện.
- **Không** dùng "ai đánh cú cuối thì lấy hết", **không** dùng cuộn xúc xắc chia đồ. Cả hai đều
  đẻ ra tranh cãi mà ở 10 người thì hoàn toàn tránh được bằng cách cho mỗi người một hộp riêng.
- Đồ rơi của người nào chỉ người đó thấy và nhặt được ⇒ **không cần** đồng bộ `groundLoot`
  giữa các client. Điều này rất hợp với hiện trạng: `groundLoot` **không nằm trong save** và
  **bị xoá trong `buildWorld()`** [ĐO, theo `CLAUDE.md` và `game.js:7080`].

**⚠ Một chỗ hiện đang cản [ĐO]:** boss phó bản (`game.js:24018-24024`) và boss thế giới
(`game.js:25298`) đều đặt `aggro: 9999` — tức là chúng lao qua nửa bản đồ để đánh bất cứ ai.
Trong thế giới chung, một con boss như vậy sẽ đuổi theo người ở xa nhất và kéo cả trận đánh ra
khỏi chỗ mọi người đang đứng. **[SUY]** Boss thế giới cần một **dây xích** quanh điểm sinh.

### 2.7 Trò chuyện, danh sách người chơi, giao dịch

**Hiện có [ĐO]:** không có trò chuyện giữa người với người. Hàm duy nhất có chữ "chat" trong
tên là `aiChatBlock()` (`game.js:22991`) — hội thoại với NPC bằng mô hình ngôn ngữ, khác hẳn.
Có `logCombat()` — một bảng nhật ký chiến đấu **đã tồn tại và đã có chỗ đứng trên màn hình**.

**Trò chuyện — mức tối thiểu cho 10 người [SUY]:** một kênh chung, một dòng nhập, ném thẳng qua
WebSocket. Không kênh riêng, không nhóm, không tin nhắn riêng. **Tái dùng khung `logCombat`**
thay vì vẽ bảng mới — nó đã đúng chỗ, đúng kiểu chữ, đã cuộn được.
⚠ Cần **giới hạn nhịp** (ví dụ 1 tin mỗi 2 giây) và **cắt độ dài** ngay từ đầu; thêm sau thì
lúc nào cũng là sau một lần bị spam.

**Danh sách người chơi — mức tối thiểu [SUY]:** một bảng hiện `tên · lớp · cấp · bản đồ`, dựng
từ chính ảnh chụp máy chủ vẫn đang gửi. Gần như miễn phí sau Giai đoạn 1.

**Giao dịch giữa người chơi [SUY]:** **đừng làm ở 10 người, trừ khi chủ dự án nói rõ là cần.**
Lý do rất cụ thể:
- Giao dịch là thứ biến "một người gian lận" thành "cả nền kinh tế hỏng".
- Nó bắt buộc kéo theo: sinh vật phẩm phải ở máy chủ (2.5), nhật ký chuyển đồ để truy vết,
  giao thức xác nhận hai chiều chống lừa, và cơ chế cuộn ngược khi có sự cố.
- **[SUY]** Ở 10 người quen biết nhau, phần lớn nhu cầu trao đổi giải quyết được bằng
  **một cái hòm chung** hoặc **thả đồ xuống đất cho người khác nhặt** — rẻ hơn nhiều lần
  và không đẻ ra nghĩa vụ truy vết.

Nếu vẫn cần: mức tối thiểu là **bảng `nhật_ký_vật_phẩm`** ghi mọi lần một món đổi chủ
(`uid món · từ ai · sang ai · lúc nào · vì sao`), viết **trước** khi mở giao dịch, không phải sau.

### 2.8 Vận hành

**Hiện có [ĐO]:**
- Triển khai: cron 2 phút, `git reset --hard origin/main`. Đẩy lên `main` là live.
- CI: `.github/workflows/ci.yml` chạy `npm run check` · `npm run lint` · `npm test` ·
  `node --check public/game/game.js` trên mọi lần đẩy vào `main`.
- Hồi quy trình duyệt: `tools/reg.sh` chạy **155 bài** Playwright trên một **bản chụp đóng băng**
  của `public/game` ở một cổng do hệ điều hành cấp (hai lý do đều ghi rõ trong tệp: sửa file
  giữa chừng làm hỏng kết quả; cổng cố định làm hai lượt chạy giẫm lên nhau).
- Nhật ký: **không có gì phía máy chủ** — vì không có máy chủ.
- Theo dõi: **không có gì.**

**Thiếu, và mức tối thiểu cho 10 người [SUY]:**

| Việc | Mức tối thiểu |
|---|---|
| **Nhật ký** | Ghi ra tệp theo ngày: kết nối/ngắt · lỗi · mọi lần sinh vật phẩm và cộng tiền tệ. Cái cuối là thứ duy nhất trả lời được câu "món đồ này từ đâu ra". |
| **Theo dõi** | Một endpoint `/health` trả `{ số người đang nối, thời gian chạy, số tick }` và một dòng `curl` trong cron. Không cần Prometheus, không cần bảng điều khiển. |
| **Khởi động lại khi sập** | `systemd` với `Restart=always`. Một tệp unit khoảng 10 dòng. |
| **Cập nhật mà không đá người chơi ra** | Xem dưới — đây là mục đáng bàn nhất. |
| **Ai trực lúc 3 giờ sáng** | **Câu này chỉ chủ dự án trả lời được.** Ở alpha 10 người thì "không ai" là câu trả lời chấp nhận được, nhưng phải chốt trước khi mở cửa. |

**Cập nhật không đá người chơi ra [SUY]:** ở 10 người, **đừng xây triển khai không gián đoạn.**
Cách rẻ hơn và trung thực hơn:

1. Máy chủ phát một tin `sắp bảo trì` kèm đếm ngược 60 giây; client hiện băng chữ.
2. Máy chủ ép lưu toàn bộ nhân vật đang nối vào cơ sở dữ liệu.
3. Khởi động lại. Client tự nối lại sau 3 giây, nạp lại nhân vật từ máy chủ.

Tổng gián đoạn vài giây. **⚠ Một cạm bẫy thật:** cron 2 phút hiện tại chạy `git reset --hard`
trên **cùng cây thư mục** mà máy chủ đang chạy từ đó. Nếu máy chủ online sống trong cây đó thì
mỗi lần đẩy `main` sẽ đổi mã dưới chân một tiến trình đang chạy, mà **không** khởi động lại nó.
Phải chốt: hoặc thêm bước `systemctl restart` vào script triển khai, hoặc để máy chủ online
ở một cây riêng có đường triển khai riêng.

---

## 3. Lộ trình theo giai đoạn

Nguyên tắc: **mỗi giai đoạn giao được và chơi được**, không phải một cú viết lại lớn.
Cột cuối là thứ **người chơi thấy được** sau giai đoạn đó — nếu cột đó trống thì giai đoạn
đó chưa được chia đúng.

| # | Tên | Công sức | Người chơi thấy gì mới |
|---|---|---|---|
| 0 | Đóng cửa hậu | **nhỏ** | (không thấy gì — nhưng là điều kiện của mọi thứ sau) |
| 1 | **Bóng Người** | **nhỏ** | **Hai người mở hai trình duyệt và nhìn thấy nhau chạy** |
| 2 | Tên, trang bị, trò chuyện | nhỏ | Biết người kia là ai, mặc gì, nói chuyện được |
| 3 | Tài khoản + nhân vật trên máy chủ | vừa | Đăng nhập từ máy khác vẫn thấy nhân vật của mình |
| 4 | Đồng hồ chung + boss thế giới chung | vừa | **Cùng nhau đánh một con boss, cùng lúc** |
| 5 | Máy chủ sinh vật phẩm và cộng tiền | **lớn** | (không thấy gì — nhưng mở đường cho mọi thứ có kinh tế) |
| 6 | Giao dịch / PvP | **lớn** | Đổi đồ, đánh nhau — **chỉ làm nếu thật sự cần** |

---

### Giai đoạn 0 — Đóng cửa hậu (nhỏ)

**Làm gì:** với bản online, gỡ `cheatExec` và khối console. Không ẩn — gỡ khỏi tệp phát hành.

**Đụng vào:** `public/game/game.js` (khối `game.js:17126-17400` và móc phím ở `game.js:6971`),
`public/game/index.html:191`. **[SUY]** Cách sạch nhất mà không đẻ ra hai phiên bản `game.js`:
để đường online nạp một tệp phủ nhỏ đặt `window.cheatExec = undefined` và gỡ nút DOM ngay sau
khi `game.js` nạp xong. Xấu, nhưng chỉ vài dòng và không rẽ nhánh nguồn.

**Cạm bẫy:** không được để việc này phá `tools/reg.sh` — **155 bài** hồi quy hiện có, một số
bài dùng `TEST_MODE` để nhảy cấp và dịch chuyển. Bản offline phải giữ nguyên đường đó.

**Người chơi thấy gì:** không gì. Đây là thuế phải trả trước.

---

### Giai đoạn 1 — Bóng Người (nhỏ)

**Đây là giai đoạn nhỏ nhất mà vẫn chứng minh được cả hướng đi.** Không tài khoản, không cơ sở
dữ liệu, không quyền quyết định, không chống gian lận. Chỉ chuyển tiếp toạ độ.

**Làm gì:**

1. **Máy chủ mới** — thư mục mới `server/` (không đụng `api/` đang có). Một tệp,
   thư viện `ws`, khoảng 150 dòng:
   - `Map<idKếtNối, {map, x, y, hp, mhp, sect, lv, name, act, face}>`
   - nhận tin `{t:'pos', ...}` từ client, ghi vào `Map`
   - `setInterval(100 ms)`: với mỗi bản đồ, gom người trong đó, phát ảnh chụp cho từng người
     (bỏ chính mình ra)
   - đóng kết nối thì xoá khỏi `Map`
2. **Client** — thêm một tệp `public/game/net.js` (khoảng 120 dòng), nạp bằng một thẻ `<script>`
   nữa trong `index.html` **sau** `game.js`. Nó giữ mảng `window.NETPLAYERS`, gửi vị trí 10 Hz,
   nhận ảnh chụp, nội suy tuyến tính giữa hai ảnh gần nhất.
3. **Vẽ** — sửa `public/game/game.js`:
   - `drawPlayer()` → `drawPlayer(p)`; sửa **một** tham chiếu `player.` ở `game.js:14459`;
     chuyển `bayCao` (6 lần dùng) thành trường trên `p`.
   - Trong `render()` quanh `game.js:9748`, vẽ thêm vòng lặp qua `NETPLAYERS` trước khi vẽ
     người chơi của mình.
4. **nginx** — thêm một `location /ws` với `proxy_pass` và hai dòng `Upgrade`/`Connection`.
   ⚠ Việc này **phải chạy trên VPS**, hộp cát không SSH vào được.

**Công sức: nhỏ.** **[SUY]** Ước lượng: 1 người-tuần, phần lớn là dựng đường triển khai cho
tiến trình Node đầu tiên chứ không phải viết mã.

**Vì sao nhỏ hơn vẻ ngoài [ĐO]:** `drawPlayer()` đã đọc qua biến cục bộ `p` (103 lần) chứ không
đọc `player` rải rác — chỉ có **1** tham chiếu `player.` phải sửa. Và băng thông cần đỡ là
**5,2 KB/s mỗi client**.

**Rủi ro:** biến `bayCao` bị bỏ sót ⇒ độ cao bay nhấp nháy giữa các người chơi. Đây là loại lỗi
chỉ lộ ra khi **chụp màn hình mà nhìn**, không lộ khi đọc mã.

**Người chơi thấy gì:** **hai người mở hai trình duyệt, chọn hai lớp, và thấy nhau chạy trong
cùng một bản đồ.** Đó là toàn bộ mục tiêu.

---

### Giai đoạn 2 — Tên, trang bị, trò chuyện (nhỏ)

**Làm gì:**
- Thêm vào ảnh chụp: chữ ký `gearVisual(p)`, bậc cánh, hành động ra đòn (`atkAct`/`castAct`).
- Nhãn tên nổi trên đầu người chơi khác + thanh máu.
- Bảng danh sách người chơi (dựng từ chính ảnh chụp).
- Kênh trò chuyện chung, **tái dùng khung `logCombat`**, kèm giới hạn nhịp và cắt độ dài.

**Đụng vào:** `server/`, `public/game/net.js`, `public/game/game.js` (nhãn tên, danh sách),
`public/game/style.css`.

**Công sức: nhỏ.**

**Cạm bẫy [ĐO]:** gửi **chữ ký** trang bị, không gửi `player.equip`. Một món đồ là **474 byte**;
11 ô trang bị là ~5 KB mỗi người mỗi ảnh chụp — gấp 45 lần cả gói tin hiện tại, và trong đó
không có một byte nào người khác cần biết.

**Người chơi thấy gì:** người kia là ai, mạnh cỡ nào, đang mặc gì, và nói chuyện được với họ.

---

### Giai đoạn 3 — Tài khoản và nhân vật trên máy chủ (vừa)

**Làm gì:**
- Bảng `tài_khoản` + `nhân_vật` trong SQLite.
- Màn đăng nhập trước màn chọn nhân vật; **tách rõ hai chế độ**: `Chơi Một Mình` (localStorage,
  y như hôm nay) và `Chơi Trực Tuyến` (máy chủ). Nhân vật hai bên **không qua lại được**.
- `saveGame()` ở chế độ online ghi lên máy chủ, chống rung 2–5 giây, ép lưu lúc thoát.
- Sao lưu theo giờ.

**Đụng vào:** `server/`, `public/game/game.js` (khối `docSave`/`ghiDoc`/`saveGame`/`loadGame`,
`game.js:5905-6010`), `public/game/index.html` (màn đăng nhập).
**[SUY]** Có thể dùng lại `api/walletRouter.ts` nếu chấp nhận đăng nhập bằng ví Ronin — đã viết
xong. Nếu không thì viết tay tài khoản mật khẩu, rẻ hơn ở giai đoạn này.

**Công sức: vừa.** Phần đắt không phải cơ sở dữ liệu mà là **110 điểm gọi `saveGame()`** [ĐO]
phải đi qua một lớp gom chung.

**Người chơi thấy gì:** đăng nhập từ máy khác vẫn thấy đúng nhân vật của mình. Đây cũng là lúc
danh tính trở nên thật — tên trong danh sách người chơi không còn tự đặt lại mỗi lần vào game.

---

### Giai đoạn 4 — Đồng hồ chung và boss thế giới chung (vừa)

**Làm gì:**
1. **Sửa lỗi múi giờ** (xem [4.2](#42-cái-gì-trong-thiết-kế-hiện-tại-chống-lại-việc-lên-online)) —
   hoặc để máy chủ phát mốc giờ, hoặc đổi ba hàm `*NextBoundary` sang dùng giờ UTC.
2. Máy chủ giữ trạng thái boss sự kiện: `hp`, toạ độ, bảng đóng góp sát thương.
3. Client báo sát thương đã gây lên boss (**chưa** kiểm chứng ở giai đoạn này — chỉ trần
   hợp lý); máy chủ trừ máu và phát `hp` mới cho mọi người.
4. Boss chết ⇒ máy chủ chạy `computeKillRewards()` **một lần cho mỗi người đủ ngưỡng**.
5. Thêm **dây xích** cho boss thế giới (hiện `aggro: 9999`).

**Đụng vào:** `server/` (nạp `game.js` vào `vm` — dùng lại đúng cách của
`docs/online-samples/headless-sim.sample.js`), `public/game/game.js`
(`updateMaTon`/`updateGolden`/`updateRift`, `game.js:25269`, `25364`, `25434`).

**Công sức: vừa.**

**Người chơi thấy gì:** **đúng 20 giờ, mọi người cùng nhận báo, cùng chạy tới một bản đồ, và
cùng đánh một con boss có chung thanh máu.** Đây là khoảnh khắc "online" thật sự đầu tiên,
và cũng là thứ toàn bộ mô hình "solo là mặc định, chia sẻ là khoảnh khắc" được dựng để phục vụ.

---

### Giai đoạn 5 — Máy chủ sinh vật phẩm và cộng tiền tệ (lớn)

**Làm gì:** dời `genItem` · `rollJewels` · `epNgoc` · các `CHAOS_RECIPES[].run()` · mọi chỗ
cộng tiền tệ lên máy chủ. Client hỏi, máy chủ quay và ghi, client hiển thị kết quả.

**Đụng vào:** rộng — **41 chỗ** ghi `player.silver` [ĐO], `game.js:5157` (`genItem`),
`game.js:197` (`rollJewels`), `game.js:20382` (`epNgoc`), sáu công thức Lò Hỗn Độn.

**Công sức: lớn.** **[SUY]** Đây là giai đoạn duy nhất trong danh sách xứng đáng gọi là "đắt".

**Vì sao lại để tận đây:** vì nó **chỉ cần thiết khi vật phẩm đổi chủ được**. Nếu không bao giờ
mở giao dịch và PvP, thì một người gian lận chỉ tự phá game của họ — và ở 10 người quen biết
nhau, việc đó xử lý được bằng một câu nhắn, không cần 8 tuần kỹ thuật.

**⇒ [SUY] Khuyến nghị: đừng làm Giai đoạn 5 cho tới khi chủ dự án xác nhận là CÓ giao dịch
hoặc CÓ PvP.** Đó là ngã ba duy nhất trong tài liệu này thật sự đắt.

**Người chơi thấy gì:** không gì mới. Đó chính là lý do phải nói rõ vì sao nó tồn tại.

---

### Giai đoạn 6 — Giao dịch và PvP (lớn)

Chỉ mở sau khi Giai đoạn 5 xong. Kèm bảng `nhật_ký_vật_phẩm` viết **trước**, không phải sau.
PvP cần thêm: máy chủ phân xử sát thương giữa người với người, xử lý độ trễ, và luật vùng.
**[SUY]** Ở 10 người, cân nhắc nghiêm túc việc **bỏ hẳn** mảng này ở alpha.

---

## 4. Đánh đổi và rủi ro

### 4.1 Chỗ sẽ phải viết lại nhiều nhất

**Xếp theo khối lượng thật, [ĐO]:**

1. **Tầng lưu và nạp** — `game.js:5905-6010`, cộng **110 điểm gọi `saveGame()`**. Không phải vì
   khó, mà vì mọi điểm gọi đều giả định lưu là **đồng bộ và không bao giờ hỏng**. Ghi mạng thì
   không thế: có độ trễ, có thất bại, có ghi đè ngược. Đây là chỗ đẻ ra loại lỗi "mất tiến trình
   của người chơi" — loại tệ nhất.

2. **Tầng vẽ nhân vật** — `drawPlayer()` 246 dòng cộng biến module `bayCao`. Bản thân việc thêm
   tham số là nhỏ; **rủi ro là những biến trạng-thái-vẽ khác cùng loại mà tôi chưa tìm hết.**
   Đã thấy `bayCao`; **[CHƯA KIỂM]** khả năng còn nữa trong `heroPose`, `_heroCardCache`,
   `tintedImg`. Cách kiểm duy nhất tin được là **vẽ hai người khác trang bị cạnh nhau rồi chụp
   ra nhìn** — `CLAUDE.md` đã ghi ba lỗi hình chỉ lộ khi chụp ra xem, không lỗi nào lộ khi đọc mã.

3. **Sinh vật phẩm và tiền tệ** (Giai đoạn 5) — 41 chỗ ghi `silver`, `genItem`, `epNgoc`,
   6 công thức Lò. Rộng chứ không sâu.

**Chỗ KHÔNG phải viết lại, ngược với trực giác [ĐO]:** phần mô phỏng chiến đấu.
`game.js` chạy nguyên xi trong `vm` của Node, `hurtMob`/`killMob`/`update` đều đúng, 3 µs/tick.
Đây là kết luận trung tâm của `docs/THIET_KE_ONLINE.md` và tôi đã **kiểm lại ở bản `44a15b9`**:
vẫn đúng.

### 4.2 Cái gì trong thiết kế hiện tại chống lại việc lên online

**a) `player` là số ít, ở tầng module [ĐO].**
**258 trong 762 hàm ở cột 0 đọc thẳng `player`** — 3.396 tham chiếu trên 1.954 dòng. 79 biến
trạng thái khác cũng ở tầng module (`mobs`, `curMap`, `camera`, `groundLoot`, `hitStop`…).
**Hệ quả:** một tiến trình = một thế giới = một người chơi. Không có cách nào chạy hai người
chơi trong cùng một ngữ cảnh mà không đụng vào con số 3.396 đó.
**[SUY]** Nhưng ở mô hình "solo là mặc định" thì **không cần chạm vào nó**: máy chủ giữ một
ngữ cảnh `vm` cho mỗi người chơi, hoặc chỉ giữ ngữ cảnh cho boss thế giới. Đây chính là lý do
mô hình đó rẻ đến vậy — nó **né** vấn đề chứ không giải nó.

**b) Sự kiện thế giới lệch theo múi giờ của máy người chơi [ĐO].** Đây là lỗi cụ thể và đo được.
`matonNextBoundary()` (`game.js:25258`) dùng `d.setHours(d.getHours() + 1)` và
`while (d.getHours() % 4 !== 0)` — `getHours()` trả **giờ địa phương**. Chạy cùng một mốc thời
gian tuyệt đối (`2026-09-03T10:30Z`) ở các múi giờ khác nhau:

| Múi giờ của máy | Mốc sự kiện kế tiếp |
|---|---|
| UTC | `2026-09-03T12:00Z` |
| `Asia/Ho_Chi_Minh` | `2026-09-03T13:00Z` — **lệch 1 giờ** |
| `America/New_York` | `2026-09-03T12:00Z` |
| `Asia/Kolkata` | `2026-09-03T14:30Z` — **lệch 2,5 giờ** |
| `Australia/Adelaide` | `2026-09-03T14:30Z` |

Trớ trêu là **bản đồ thì lại khớp**: `goldenMapFor()` (`game.js:25333`) là
`GOLDEN_FIELD[Math.floor(t / 14400000) % ...]` — số học thuần trên mốc epoch, không dính múi giờ.
⇒ Hai người ở hai múi giờ **đồng ý bản đồ nào bị xâm lăng, nhưng không đồng ý lúc nào**.
Với game chơi một mình thì không ai biết; với "chia sẻ là khoảnh khắc" thì nó phá đúng cái
tính năng đó. Phải sửa trước Giai đoạn 4.

**c) Đồ rơi và sự kiện cố ý KHÔNG được lưu [ĐO].** `groundLoot` không vào save và bị xoá trong
`buildWorld()`; trạng thái sự kiện cũng không lưu (tính lại từ đồng hồ). Đây là **quyết định
đúng cho offline** và ghi rõ trong `CLAUDE.md`, nhưng nó có nghĩa là chưa có một chỗ nào trong
mã dùng để **giữ trạng thái thế giới bền vững**. Boss chung ở Giai đoạn 4 là lần đầu tiên
cần thứ đó.

**d) Nhân vật không có định danh bền [ĐO].** `player.name` đặt một lần
(`game.js:16919`), đọc lại đúng một chỗ (`game.js:20950`). Không có khoá duy nhất, không có
chống trùng tên. Mọi thứ xã hội — danh sách, trò chuyện, giao dịch, truy vết — đều cần nó.

**e) AUTO là một con bot xây sẵn trong game [ĐO].** `player.auto` (xử lý rải khắp
`game.js:8700-8760`) tự chọn mục tiêu, tự đánh, tự nhặt, và `CLAUDE.md` ghi "nới tầm hút gấp 3
khi AUTO bật". Ở game một mình thì đây là tính năng tiện. **[SUY]** Trong nền kinh tế chung, nó
là công cụ cày tự động **được chính thức hỗ trợ** — phải quyết định thẳng: giữ cho tất cả,
hay tắt ở chế độ online. Đừng để câu này chưa trả lời tới lúc mở cửa.

**f) Cửa hậu đã ship** [1.5](#15-cửa-hậu-đang-ship-lên-production).

**g) Vỏ backend lạc hậu so với game [ĐO].** `src/pages/GamePage.tsx` còn 10 lớp kiểu Axie và
hệ Đan Điền đã gỡ; `api/saveRouter.ts:34` đọc `p.dantian?.realm`; `README.md` tả một bản game
khác hẳn `CLAUDE.md`. **[SUY]** Ai dùng lại vỏ này mà không đọc `CLAUDE.md` trước sẽ xây tiếp
lên trên một mô hình dữ liệu đã chết.

### 4.3 Cái gì là THỪA ở quy mô 10 người

Chủ dự án nói rõ là bắt đầu với 10. Danh sách dưới đây là những thứ **đừng đề xuất, đừng xây**,
kèm con số cho biết vì sao.

| Thứ thừa | Vì sao thừa |
|---|---|
| Thư viện WebSocket viết bằng C++ (`uWebSockets.js`) | Nó tồn tại để phục vụ hàng chục nghìn kết nối. Ở đây là 10. Thư viện `ws` phổ thông là đủ, và có tài liệu tốt hơn hẳn. |
| Giao thức nhị phân, nén sai phân | **[ĐO]** JSON thô là 51,6 KB/s tổng; nhị phân là 8,4 KB/s. Tiết kiệm 43 KB/s để đánh đổi lấy một tầng mã không đọc được bằng mắt. |
| Lọc theo tầm nhìn (AoI / interest management) | 10 người chia trên **15 bản đồ**. Trung bình chưa tới 1 người mỗi bản đồ. Việc "lọc" đã xong khi lọc theo `map`. |
| Sharding, channel, nhiều tiến trình thế giới | **[ĐO]** 3 µs/tick cho một thế giới đầy 61 quái. Một tiến trình dư sức. |
| Redis, hàng đợi tin, pub/sub | Cần khi có nhiều tiến trình phải nói chuyện với nhau. Ở đây có một. |
| Dự đoán phía client + hoà giải + bù trễ | **[ĐO]** Game là click-to-move, không phải điều khiển từng khung. Nội suy tuyến tính giữa hai ảnh chụp cách 100 ms là đủ. |
| Mô phỏng chiến đấu đầy đủ trên máy chủ | `docs/THIET_KE_ONLINE.md` §7 ước lượng **12–20 người-tuần**. Ở 10 người, ba trần hợp lý (EXP/phút, giết/phút, tốc độ di chuyển) bắt được phần lớn với chi phí vài ngày. |
| MySQL, di trú Drizzle, gộp kết nối | **[ĐO]** Toàn bộ dữ liệu là ~2 MB (10 người × 5 ô × 42 KB). SQLite một tệp, sao lưu bằng `cp`. |
| Cân bằng tải, nhiều máy chủ, Kubernetes | Một VPS. |
| Triển khai không gián đoạn | 60 giây báo trước + khởi động lại + tự nối lại = vài giây gián đoạn. Người chơi thứ 10 sẽ tha thứ. |
| Phát hiện gian lận bằng học máy | Ở 10 người, đọc nhật ký bằng mắt vừa rẻ hơn vừa chính xác hơn, và không đá nhầm ai. |
| Chuẩn hoá trang bị ra bảng quan hệ | Chỉ đáng làm khi cần **truy vấn** trang bị (chợ, truy vết dupe). Giữ blob JSON tới lúc đó. |
| Chợ đấu giá, bang hội, kết bạn | 10 người quen nhau. Một kênh trò chuyện chung thay được cả ba. |

**Một câu để nhớ [SUY]:** ở 10 người, cái đắt không phải máy chủ — cái đắt là **thời gian của
người viết mã**. Mỗi hệ thống thừa ở trên là vài tuần lấy đi từ Giai đoạn 1 tới 4, tức là lấy
đi từ đúng những thứ người chơi nhìn thấy.

---

## 5. Quan hệ với `docs/THIET_KE_ONLINE.md`

Kho đã có `docs/THIET_KE_ONLINE.md` (1.303 dòng, đo ngày 2026-09-01 ở bản `b060b90`). Tài liệu
này **không thay thế** nó. Khác nhau ở ba chỗ:

| | `THIET_KE_ONLINE.md` | Tài liệu này |
|---|---|---|
| Quy mô giả định | CCU **50**, có PvP, có giao dịch | **10**, chưa chốt PvP/giao dịch |
| Loại nội dung | Khảo sát **cộng** thiết kế hệ thống (lược đồ bảng, hình dạng message, mẫu mã trong `docs/online-samples/`) | Chỉ khảo sát hiện trạng và lộ trình |
| Bản mã | `b060b90` | `44a15b9` + cây làm việc |

**Ba điều đã thay đổi kể từ bản `b060b90` [ĐO]:**

1. `game.js` đã lớn hơn: bản cũ nhắc `requestAnimationFrame(loop)` ở dòng 13003 và
   `setInterval` ở 12686; ở bản này chúng ở **17668** và **813**. `CLAUDE.md` còn ghi
   "~12k dòng" — con số thật là **25.824**.
2. `computeKillRewards()` / `applyRewards()` — cặp hàm thuần / hàm ghi — hiện đã có và có bài
   kiểm gác hợp đồng. Đây là bước đi **đúng hướng máy chủ hoá** đã thực hiện xong.
3. Bộ hồi quy đã lên **155 bài** (`tools/reg.sh` ghi 134 trong chú thích — chú thích lạc hậu).

**Điều `THIET_KE_ONLINE.md` nói mà tài liệu này xác nhận lại bằng phép đo mới:**
`game.js` chạy được trên Node không sửa một ký tự (chạy lại ở `44a15b9`: xanh, 2–3 µs/tick),
và cửa hậu console vẫn còn (chạy lại ở `44a15b9`: `/silver 999999999` thành công trên
`RELEASE_BUILD = true`).

---

## Phụ lục A — cách đo lại mọi con số

Mọi con số gắn nhãn **[ĐO]** dựng lại được bằng những lệnh dưới đây.
Chạy từ `/home/user/axie-wuxia` (⚠ **không** phải `/home/user/Volamchimong1` — hai kho khác nhau).

**Đếm thô:**

```bash
wc -l -c public/game/game.js
gzip -6 -c public/game/game.js | wc -c
du -sb public/game public/game/assets
grep -n '<script' public/game/index.html
grep -c '^import \|^export ' public/game/game.js       # 0 = không phải module
grep -o '\bplayer\b'    public/game/game.js | wc -l    # 3396
grep -o 'Math.random'   public/game/game.js | wc -l    # 149
grep -c 'saveGame()'    public/game/game.js            # 110
grep -c 'localStorage'  public/game/game.js            # 17
grep -c 'WebSocket'     public/game/game.js            # 0
ls tests/test_*.js | wc -l                             # 155
```

**Đếm hàm, biến toàn cục, hàm nào chạm `player`:**

```bash
python3 - <<'PY'
import re
L=open('public/game/game.js',encoding='utf-8').read().split('\n')
print('hàm cột 0 :', len([l for l in L if l.startswith('function ')]))
print('biến let/var cột 0:', len([l for l in L if re.match(r'^(let|var) ',l)]))
cur=None; hit=set(); n=0
for l in L:
    m=re.match(r'^function (\w+)',l)
    if m: cur=m.group(1); n+=1
    if cur and re.search(r'\bplayer\b',l): hit.add(cur)
print('hàm chạm player:', len(hit), '/', n)
PY
```

**Nạp game vào Node và đo lúc chạy** — dùng bộ khung có sẵn, **không sửa gì trong `public/`**:

```bash
node docs/online-samples/headless-sim.sample.js
```

Ba phép đo riêng của tài liệu này chạy trên cùng bộ khung đó (tách phần nạp thành một mô-đun,
đặt trong thư mục tạm, không ghi vào kho):

- **Kích thước bản lưu** — `newPlayer()` → `gainXp()` → `genItem()` + `bagThem()` cho đầy
  `bagCap()` và `khoCap()` → `JSON.stringify({player, questIdx, questProg, questState, victory,
  curMap, sideStates, savedAt})`.
- **Số quái và kích thước thế giới** — lặp `Object.keys(MAPS)`, mỗi bản đồ `buildWorld()` rồi
  `mobs.length` và `JSON.stringify(mobs).length`.
- **Kích thước gói tin** — dựng ảnh chụp 9 người `{i,x,y,hp,mhp,a,f}` và đo `JSON.stringify`.

**Chứng minh cửa hậu còn sống** — nạp game, đặt `window.RELEASE_BUILD = true`,
`window.TEST_MODE = false`, `location.search = ''`, rồi:

```js
newPlayer('thieulam');
cheatExec('/silver 999999999'); cheatExec('/lv 120'); cheatExec('/item 4 10'); cheatExec('/god');
// player.silver → 999999999 · player.level → 120 · player._god → true
```

**Chứng minh lệch múi giờ** — chép nguyên `matonNextBoundary` từ `game.js:25258` ra một tệp
rồi chạy với `TZ` khác nhau:

```bash
for z in UTC Asia/Ho_Chi_Minh Asia/Kolkata; do TZ=$z node moc.cjs; done
```

---

## Phụ lục B — những gì CHƯA kiểm chứng được

Ghi ra để không ai trích nhầm thành sự thật.

| Điều | Vì sao chưa kiểm được |
|---|---|
| Bất kỳ con số **giá tiền** nào (VPS, băng thông, lưu trữ) | Tài liệu này **không nêu một con số giá nào**. Chủ ý. |
| Cấu hình thật của VPS (RAM, số lõi, băng thông) | Hộp cát không SSH được (cổng 22 chặn ở tầng mạng) và `http://14.225.204.107/` trả **403 Host not in allowlist** qua proxy. Đã thử. |
| Sức chịu tải thật của thư viện `ws` **trên chính VPS đó** | Cùng lý do. Ở 10 kết nối thì con số này không liên quan, nhưng đừng trích một con số nào tôi không đo được. |
| Độ trễ mạng thật giữa người chơi Việt Nam và VPS | Không đo được từ đây. |
| Có còn biến trạng-thái-vẽ nào khác kiểu `bayCao` không | Đã tìm được `bayCao` (6 lần dùng trong `drawPlayer`). **Cách kiểm duy nhất tin được là vẽ hai người khác trang bị cạnh nhau rồi chụp ra nhìn** — chưa làm, vì khảo sát không được sửa `public/`. |
| Bộ **155** bài hồi quy có còn xanh hết không | `tools/reg.sh` cần Playwright cài toàn cục; chưa chạy trong phiên này. Con số 155 là **đếm tệp**, không phải kết quả chạy. |
| Con số người-tuần trong [Phần 3](#3-lộ-trình-theo-giai-đoạn) | Là **[SUY]**, dựa trên khối lượng mã đo được, không dựa trên một lần thực hiện nào. |
| Bốn cổng CI (`lint` · `check` · `test` · hồi quy) có xanh ở bản `44a15b9` + cây làm việc không | Không chạy trong phiên này. Cây làm việc đang có 19 tệp sửa chưa commit. |

---

**Hết.** Tài liệu này không sửa một dòng nào trong `public/`, `tests/`, `tools/`.
