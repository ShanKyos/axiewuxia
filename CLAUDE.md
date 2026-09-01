# Axie Wuxia — hướng dẫn cho Claude

## ⚠ QUY TẮC SỐ 1: PHONG CÁCH LÀ **MU ONLINE**, KHÔNG PHẢI WUXIA

Game này khởi đầu là một game kiếm hiệp (wuxia) Trung Hoa và **đã được chuyển hẳn sang tribute
MU Online**. Tên thư mục/repo `axie-wuxia` chỉ là di sản lịch sử — **đừng để nó dẫn dắt thiết kế**.

Mọi thứ làm mới từ nay trở đi phải theo MU Online. Cụ thể:

**KHÔNG dùng:**
- Chữ Hán/kanji làm hình ảnh (icon, biểu tượng, glyph trang trí trên UI).
  Toàn bộ file **hiện không còn ký tự CJK nào** — kiểm tra lại bất cứ lúc nào bằng:
  `python3 -c "import re;print(sum(1 for l in open('public/game/game.js',encoding='utf-8') if re.search(r'[一-鿿]',l)))"`
  Trường `glyph:` nay dùng ký hiệu phương Tây: `⚔ ✚ ✦ ✧ ✹ ◆ ♣ ▲ ❄ ☼ ⚡ ☾ ☠ ⚑ ★ ◉ ♦ ✽ ● ◑`
- Thuật ngữ tu tiên: cảnh giới, đan điền, kinh mạch, chân khí, tu vi, độ kiếp, bí kíp, môn phái,
  giang hồ, "Tộc", tiên hiệp, phi thăng...
- Motif kiếm hiệp: hoa đào, sương khói, thái cực, bát quái, ngũ hành làm hệ thống trung tâm

**PHẢI dùng:**
- Từ vựng & motif dark-fantasy phương Tây kiểu MU/Diablo — nhưng dùng **tên của game này**,
  không phải tên riêng của MU Online (xem QUY TẮC SỐ 2): Dark Knight, Dark Wizard, Dark Lord,
  Sylvan Ranger, Spellblade; Tinh Xảo/Cổ Vật; Đấu Trường Tế Thần, Pháo Đài Máu, Lò Hỗn Loạn;
  zone kiểu thị trấn đá phương Tây (Ardhaven)
- Art: khung kim loại gothic vát cạnh, biểu tượng vector (kiếm/khiên/lửa/sét/băng/vương miện),
  màu tô **theo nguyên tố của chiêu**, không theo màu lớp
- Số liệu/cơ chế: str/agi/vit/ene, tầm đánh & sát thương khác nhau theo lớp, reset (Tái Sinh)

**Thứ tự ưu tiên:** QUY TẮC SỐ 2 (bản quyền) > QUY TẮC SỐ 1 (phong cách). Khi hai cái đụng nhau,
giữ phong cách MU nhưng đổi tên.

**Text tiếng Việt vẫn giữ** (đây là game Việt hoá) — nhưng phải là tiếng Việt mô tả thế giới MU,
không phải sáo ngữ kiếm hiệp.

Khi thấy tàn dư wuxia trong code/UI cũ: dọn luôn nếu nằm trong phạm vi đang làm, hoặc báo lại.

## ⚠ QUY TẮC SỐ 2: KHÔNG DÙNG TÊN RIÊNG CỦA MU ONLINE

Lấy **ý tưởng và phong cách** từ MU Online thì được, nhưng **tên riêng thì không** —
đây là game sẽ phát hành, không phải bản mod. Text người chơi nhìn thấy phải sạch.

**Cấm xuất hiện trong text người chơi thấy:** Kundun · Lorencia · Noria · Devias ·
Icarus · Atlans · Tarkan · Fairy Elf · Magic Gladiator · Devil Square · Blood Castle.
(Nhắc "MU Online" trong *comment* để ghi nguồn cảm hứng thì được — chỉ là đừng ship
tên riêng của họ thành nội dung game.)

Kiểm tra bất cứ lúc nào: `node <scratchpad>/test_story.js` — nó quét toàn bộ
INTRO_PAGES / QUESTS / CLUES / BOSS_LORE / SECTS / NPCS / MOBS / TB_TIER_NAMES.

**Tên đã tự đặt để thay thế:**

| Thay cho | Dùng |
|---|---|
| MU (thế giới) | **Vaeldra** — lục địa thép và tro |
| Kundun | **Morvahn** |
| Lorencia | **Ardhaven** |
| Fairy Elf / Magic Gladiator | **Sylvan Ranger** / **Spellblade** |
| Devil Square / Blood Castle | **Đấu Trường Tế Thần** / **Pháo Đài Máu** |
| Excellent / Ancient | **Tinh Xảo** / **Cổ Vật** |

Dark Knight · Dark Wizard · Dark Lord **giữ nguyên** — là danh từ fantasy phổ thông.

## Tên trang bị đi theo CHẤT LIỆU

`ITEM_NAMES[slot][rarity]` — 5 tên mỗi ô, leo theo chất liệu như đồ MU: **da → sắt → thép →
vảy rồng → hắc nguyệt**. Bộ tên cũ mượn thẳng binh khí kiếm hiệp (Huyền Thiết Trọng Kiếm,
Lăng Ba Hài, Chí Tôn Long Giáp, Thiên Tôn Miện…) — vi phạm Quy tắc số 1. Tên mới phải là
danh từ trang bị thuần, đừng mượn tên chiêu thức hay bảo vật tiểu thuyết.

## Cốt truyện (canon)

Hai vũ trụ giao thoa. Phong ấn giam **Morvahn** ở **Vaeldra** vỡ; Thủ Hộ Vaeldra
không giữ nổi nên **bẻ lệch vết nứt** sang một thế giới bên cạnh mà hải đồ ghi là
"vô chủ" — hải đồ sai, đó là **Lunacia**. Vaeldra tự cứu mình bằng cách trút tận
thế lên nhà người khác.

Nhân vật chính thuộc một trong **5 môn phái Vaeldra**, nằm trong đội tiên phong
vượt vết nứt sang sửa. Cú vượt biên xoá ký ức võ nghệ → khởi đầu Unclassed, tới
**cấp 10 ký ức trở về** (the Calling). Cú giật ngược kéo cả khu phố **Ardhaven**
sang, dân bản địa dựng lại quanh đó thành **Lunaris City**.

⇒ Điều này *giải thích trong truyện* hai thứ vốn khập khiễng:
tường thành phương Tây giữa thế giới Axie, và NPC hai phong cách
(**NPC chức năng = người Ardhaven sống sót**, **NPC cốt truyện = người Lunacia bản địa**).

Khí Morvahn chạm vào sinh vật Lunacia thì bẻ nó thành **Chimera**.

**Năm Trụ Khóa** (thay cho Ngũ Ấn) do Thủ Hộ Vaeldra đóng xuống để ghim miệng vết
nứt. Tướng quân Morvahn chiếm cả năm. **Gỡ trụ thì đi tiếp được, nhưng vết nứt
toác thêm** — muốn tới Morvahn phải tự tay mở cánh cửa hắn cần. Đó là bi kịch
trung tâm, và là lý do của kết mở.

Thuật ngữ: Tướng Quân (boss cuối map) · Vệ Binh Trụ (3 boss phụ) · Trụ Khóa ·
Cổng Vực · Hung Thần (boss thế giới định kỳ, **không phải** Morvahn) · Đoàn Gloam
(lính Vaeldra đào ngũ).

## Kiến trúc

- Toàn bộ game nằm trong **1 file**: `public/game/game.js` (~12k dòng), kèm `index.html`, `style.css`.
- Không build step — mở thẳng file tĩnh. Kiểm tra cú pháp: `node --check public/game/game.js`.
- Các hằng số lớn: `SECTS` (5 lớp), `VOHOC_DEFS` (chiêu), `SKILL_DEFS`, `MAPS`, `MOBS`, `QUESTS`,
  `SIDE_QUESTS`. Hàm trung tâm: `calcDerived()` (mọi chỉ số), `update(dt)`, `render()`,
  `castSkill()`, `hurtMob()` (điểm áp sát thương DUY NHẤT của toàn game).

## Nhân vật chính — vẽ theo KHỚP XƯƠNG, không phải sprite sheet

Không còn thẻ Axie PNG. `drawHeroFigure()` dựng nhân vật bằng vector trong hộp
`HERO_W×HERO_H` (160×220), chia theo bộ phận, mỗi chi xoay quanh trục riêng
(`HERO_JOINT`: vai / hông / cổ). **Animation là hàm số theo thời gian** — đúng cơ
chế xương MU Online dùng, không phải chuỗi khung hình.

- `heroPose(wph, mv, atkK, castK, now, act)` → góc mọi khớp + `wrot`/`wpush` (vũ khí).
- `HERO_ACT` — 7 kiểu ra đòn: `slash · spin · thrust · shoot · point · raise · guard`.
- `SECT_ACT[lớp]` — lớp nào dùng kiểu nào cho `basic / a / tp / buff`.
  **Chọn kiểu phải KHỚP VFX của chiêu**: Meteor rơi từ trên xuống ⇒ `raise` (giơ
  trượng lên), Fire Slash quét hình quạt ⇒ `spin`, ngũ tiễn ⇒ `shoot`.
- `heroCastAct(id, d)` suy ra kiểu lúc `castSkill()`; ghi vào `player.castAct`
  (đòn thường ghi `player.atkAct`).
- `HERO_GEAR[lớp]` — `{ pal, cape, upper(g,M,ps,P) }`. Thêm lớp mới = thêm 1 entry.
- `HERO_METAL[0..9]` — bậc Thần Binh đổi bảng màu giáp, bậc 6+ toả hào quang.
  Nâng trang bị phải NHÌN THẤY được trên nhân vật.

Chỉ 2 trường hợp còn blit ảnh: Hóa Thân Tướng Quân (mượn sprite boss) và Phi Thăng.

### Trang bị phải NHÌN THẤY ĐƯỢC — 4 lớp, không lớp nào là "phát sáng"

Đo trước khi làm: full Chí Tôn giai 10 +11 Hoàn Hảo Cổ Thần chỉ khác nhân vật mới tạo
**718/62.400 px (1,15%)**, và toàn bộ 718 px đó là một đốm sáng cạnh bàn tay — thân người
**0 px**, 7/9 ô chỉ số đổi đúng 0 px. Sau khi làm: **19.104 px (54,3%)**, đường viền thân
đặc đổi 511 px và phình đều theo bậc (0 → 137 → 212 → 346 → 487).

- `gearVisual(p)` → chữ ký ngoại hình từ `p.equip` thật (`t` = bậc trung bình **nhân độ phủ**,
  `rarity`, `setColor` khi đủ 5 món một bộ). **Trả `null` khi chưa có `player`** — màn chọn
  lớp gọi `heroCardUrl()` trước khi `player` tồn tại.
- `heroTier(p)` = `max(Thần Binh, gearVisual.t)` — dùng max để không ai tụt so với trước.
- Bốn lớp, đều vẽ **generic** trong `drawHeroFigure`, **không đụng dòng nào trong 6 entry
  `HERO_GEAR`**:
  | | |
  |---|---|
  | A. Bóng dáng | `hPauldrons` · `hHelmCrest` · `hGreave` · `hBelt` — mọc dần theo bậc |
  | B. Chất liệu | `hArmorSheen` — sắt nhám → thép đánh bóng (dải phản quang hẹp dần) |
  | C. Hoa văn | `hEngrave` — số đường khảm theo bậc, **màu theo `it.rarity`** |
  | D. Hào quang | giữ, nhuốm màu bộ Cổ Thần đang mặc |
- ⚠ Vai giáp phải đủ to để vượt **ra ngoài** đường viền cánh tay (tay vẽ tới x≈122). Nằm gọn
  bên trong thì nó chỉ còn là mảng màu, mất hẳn tác dụng đổi dáng — đó là lý do bản đầu chỉ
  đổi được 6 px đường viền.
- ⚠ `hGreave` vẽ **trong khớp hông** (`hLegs` nhận thêm tham số `gv`) nên giáp ống nhấp nhô
  theo sải bước. Vẽ ngoài là thành nhãn dán.
- ⚠ `_heroCardCache` khoá **phải gồm chữ ký trang bị**, nếu không panel Nhân Vật hiện mãi ảnh
  cũ sau khi thay đồ.
- ⚠ Chi tiết mặt trước (ngọc trán) phải kiểm `ps.back`, không thì vẽ lên gáy.

Test: `node <scratchpad>/test_gearlook.js` — đo lại đúng phép đo 1,15% ở trên, đo riêng đóng
góp từng lớp, và bắt buộc **đường viền thân đặc** phải phình đều theo bậc. Ngưỡng alpha khi
đo viền là **180**, không phải 8: hào quang là đĩa gradient bán trong suốt phủ kín khung, lấy
ngưỡng thấp thì đo nhầm mép hào quang (ra 912 px trong khi thân chỉ đổi 117).

### Bộ giáp RIÊNG từng lớp (`HERO_SETS`)

Bốn lớp trên nếu vẽ generic cho cả 6 lớp thì pháp sư mặc áo choàng lại đeo vai giáp tấm của
hiệp sĩ — cả 5 lớp trông như mặc chung một bộ. Mỗi lớp phải có **dòng giáp riêng**:
`{ min, name, style, tint }` · `heroSet(sect, t)` chọn bộ theo bậc · `hSetMetal(M, S)` đè
bảng màu. Bậc vẫn đọc được qua màu, nhưng mỗi lớp đi theo một dải màu riêng.

**Đủ 25 bộ = 5 lớp × 5 dải** (dải theo bậc: 1-2 · 3-4 · 5-6 · 7-8 · 9-10). Đặc tả đầy đủ ở
`docs/BO_GIAP.md`.

| | I | II | III | IV | V |
|---|---|---|---|---|---|
| Dark Knight | Thiết Vệ | Giáp Xích | Hắc Giáp | Vảy Rồng | **Hỏa Long** |
| Dark Wizard | Vải Thô | Da Thú | Nhân Sư | Ma Thuật | Hư Vô |
| Sylvan Ranger | Da Rừng | Lá Thép | Vỏ Sồi | Lông Ưng | Đại Bàng Trắng |
| Spellblade | Bán Giáp | Giáp Lệch | Than Hồng | Lửa Dữ | Hoả Ngục |
| Dark Lord | Lệnh Giáp | Cận Vệ | Vương Giáp | Bạo Chúa | Ngai Đen |

- 12 `style`, mỗi cái phải có đủ **4 hàm** trong `SET_SHOULDER` · `SET_CREST` · `SET_LEG` ·
  `SET_HIP` (test bắt nếu thiếu).
- ⚠ **Dark Wizard TUYỆT ĐỐI không dùng `plate`/`chain`/`drake`/`halfplate`/`regal`** — chỉ
  `cloth` · `sphinx` · `arcane`. Pháp sư mặc áo choàng mà đeo vai giáp tấm là lỗi đã mắc một
  lần rồi; test khoá lại bằng một khẳng định riêng.
- ⚠ **Spellblade phải `halfplate` ở CẢ 5 dải** — chữ ký của lớp là lệch vai (một bên giáp,
  một bên trần). Hàm vai nhận thêm tham số `side` và CỐ Ý vẽ khác nhau hai bên. Ngưỡng hiện
  của `hPauldrons` cũng hạ riêng cho `halfplate` (1.2 thay vì 2.5) để dải I — vốn tên là
  "Bán Giáp" — có vai ngay từ đầu.
- ⚠ `G.upper()` phải nhận **SM** (bảng màu BỘ) chứ không phải `M` (bảng màu BẬC), nếu không
  mũ ra một màu còn vai ra màu khác.

Test: `node <scratchpad>/test_sets.js` — bắt buộc 5 lớp khác nhau >3000 px ở bậc cuối, 5 dải
mỗi lớp khác nhau tuần tự, và Spellblade lệch vai ở mọi dải. ⚠ Khi đo lệch vai phải vẽ **riêng
lớp `hPauldrons`**: đo trên nguyên hình sẽ bắt được **thanh kiếm** (mọi lớp đều cầm một tay)
chứ không bắt được vai giáp — đối chứng Dark Knight lẽ ra 0 mà ra 215 px vì lý do đó.

### Cường hoá +0..+11 (`plusStage`)

Đúng mốc MU Online: **+7 là ngưỡng phát sáng**. Bốn mốc, mỗi mốc thêm một hiện tượng KHÁC
(không phải chỉ chói hơn): `0` (+0..3) trơ · `1` (+4..6) viền sáng quanh vai/mũ · `2` (+7..9)
hào quang nóng sau lưng + tàn lửa bay lên · `3` (+10,11) thêm dải sáng quét dọc thân.

- `hPlusAura` (sau lưng) · `hPlusSpark` (trước thân) · `hPlusSweep` (trong clip thân) ·
  `plusRim()` cho viền. Viền tạo bằng cách **vẽ lại chính hình đó to hơn 12% màu sáng ở lớp
  dưới** — rẻ hơn dựng mặt nạ silhouette mỗi khung.
- Trong mỗi mốc còn một thành phần **liên tục** theo `plus`, vì nếu chỉ chia mốc thì +7 với
  +9 đo ra **0 pixel khác biệt** — mà đó là cả một chặng rèn dài.
- ⚠ `gv.plus` phải **nhân độ phủ** y như `gv.t`. Thiếu bước này thì đeo mỗi cái mũ +11 rồi bỏ
  trống 4 ô vẫn rực như mặc đủ bộ (test bắt được lỗi này).
- ⚠ Khoá `_heroCardCache` phải gồm cả mức rèn.

Test: `node <scratchpad>/test_plusglow.js`. Lưu ý khi sửa test: hào quang theo BẬC (`M.glow`)
vốn đã đập nhẹ từ trước, nên **+0 động theo thời gian là bình thường** — đừng khẳng định
"+0 phải đứng yên"; thứ cần chứng minh là +11 động THÊM đáng kể.

### Hoạt ảnh — 3 lớp cảm giác

- **Quán tính phụ** (`player.sway` / `swayV` / `swayDir`, tính trong `update()`): hai con lò
  xo chạy TRỄ sau chuyển động thật, đi vào `ps.sway`/`ps.swayDir`. Mọi bộ phận MỀM (áo choàng,
  vải rủ, lông vũ, mảnh phép) phải đọc chúng, đừng đọc thẳng tư thế tức thời — đọc thẳng thì
  vải dính vào chân, dừng là tắt ngay. Đo được: vừa dừng chạy `sway` **vẫn còn tăng** (0.893 →
  0.897) rồi mới lắng về 0.02 sau 1,2s.
- **Vai giáp xoay theo tay**: `hPauldrons` xoay quanh `HERO_JOINT.shL/shR` với **35%** góc cánh
  tay. Không phải 100% — giáp nặng và có dây giữ nên đi sau tay.
- **`hSwing(p)`** — đường cong ra đòn: hõm NGƯỢC tới −0.30 (lấy đà) → vọt quá 1.10 (vượt đà) →
  về đúng 1. Dùng cho `slash` và `spin`. ⚠ Đừng thay lại bằng nội suy tuyến tính: `-0.7 + p*2.1`
  làm đòn đánh trôi đều, mất hết sức nặng.

⚠ `heroPose(wph, mv, atkK, castK, now, act, sway, swayDir)` — hai tham số cuối thêm SAU `act`
nên mọi lời gọi 6 tham số cũ vẫn chạy. Giữ nguyên quy ước đó khi thêm tiếp.

Test: `node <scratchpad>/test_anim.js`. ⚠ Game **đã bỏ WASD** — di chuyển là click-to-move qua
`moveTarget`; test nào đặt `keys.d = true` để bắt nhân vật chạy sẽ đo ra 0 mà không báo lỗi.

### Cảm giác chiến đấu — 6 chỗ dễ làm sai

- ⚠ **KHÔNG dùng `ctx.filter`** trong vòng vẽ. Nó buộc canvas dựng surface phụ, chi phí tuyến
  tính theo số đối tượng. Loé trắng khi trúng đòn nay vẽ đè bằng `globalCompositeOperation =
  'lighter'` (quái khung xương) hoặc bản nhuộm sẵn có cache `tintedImg()` (quái dùng ảnh —
  quái vàng đứng suốt 12 phút nên đây là chỗ tiết kiệm lớn nhất). Chỗ duy nhất còn `filter`
  là bên trong `tintedImg`, trả giá một lần cho mỗi ảnh. `ctx.shadowBlur` cùng họ, cũng tránh.
- `m.hitCol` — màu loé theo LOẠI đòn (trắng thường · vàng bạo kích · màu hệ khi khắc hệ).
- ⚠ **`sfx_hit.mp3` không tồn tại trên đĩa.** Đừng gọi lại tên đó. Âm chạm dùng `smash_<hệ>`
  (đã có sẵn 9 file). Trước khi thêm bất kỳ `AudioSys.sfx('x')` nào, kiểm `assets/music/sfx_x.mp3`
  có thật không — `sfx_bikip.mp3` cũng đang thiếu.
- **`swingFeel(crit, w, m)`** — hitstop/rung/loé bạo kích gom theo **cú đánh**, không theo mục
  tiêu, qua cửa sổ 60 ms giữ giá trị mạnh nhất. Đặt trong `hurtMob` nghĩa là AoE trúng 8 con
  kích hoạt 8 lần và đạn multishot làm hitstop nối đuôi. `w = final/m.maxHp` cho đòn nặng khựng
  lâu hơn đòn cào.
  ⚠ Test đo hitstop phải đặt `_swingT = 0` để mở cú đánh mới, nếu không đòn của phần test
  trước còn giữ `_swingBest` và mọi số đo ra 0 mà không báo lỗi.
- **`player.pendingHit`** — đòn thường nổ ở **khung tiếp xúc** (0,09 s), không phải khung đầu.
  `hSwing` đẩy khoảnh khắc lưỡi chạm ra p≈0.41 nên bắn sát thương ở p=0 lệch ~8 khung. Tìm lại
  mục tiêu lúc chạm ⇒ đòn HỤT nếu quái đã chết/chạy xa. Phải dọn trong `buildWorld()` và
  `loadGame()`.
  ⚠ `lungeK = hSwing(1 - atkK)` chứ không phải `atkK`: `atkAnim` **đếm ngược** nên `atkK` = 1 ở
  khung ĐẦU — dùng thẳng thì thân dồn tới lúc lấy đà rồi lùi khi bổ xuống, trọng tâm đi ngược
  chiều đòn.
- **`SETTINGS.shake` nay là 0/1/2** (Tắt · Nhẹ mặc định · Đầy), có di trú từ boolean cũ.
  Rung là **xung có hướng** (`shakeDir`) tắt dần, không phải random 2 trục mỗi khung. Bỏ hằng
  `0.16` cũ — `shakeT` được đặt tới 0,25 ở nhiều chỗ nên biên độ từng vượt trần 1,56×.

Test: `node <scratchpad>/test_feel.js`.

## Sự kiện thế giới — neo theo GIỜ THẬT

Lịch Tu Tiên (Can Chi/Tứ Quý/năm tháng) đã gỡ. `gameTimeInfo()` vẫn chạy ngầm cho
nhịp ngày/đêm (+10% EXP đêm) và thời tiết, nhưng KHÔNG hiển thị nữa. Chip HUD
`#hud-time` nay là **Đồng Hồ Thế Giới**: giờ thật + đếm ngược sự kiện gần nhất,
bấm mở **Bảng Sự Kiện** (`openEventBoard()`).

Nhịp chuẩn: **cứ 2 giờ thật có một sự kiện thế giới**, hai hệ lệch pha nhau:
- **Hung Thần Giáng Thế** (`MATON`) — 0h/4h/8h/12h/16h/20h, 1 boss, 30 phút
- **Xâm Lăng Vàng** (`GOLDEN`) — 2h/6h/10h/14h/18h/22h, 12 phút: 8 quái vàng + 1
  Chúa Đàn Vàng tràn vào 1 map thường (xoay vòng 7 map). Mỗi con CHẮC CHẮN rơi
  Bảo Hạp theo bậc map (`GOLDEN_BOX`: I→V), chúa đàn +1 bậc. `goldify()` CLONE
  def trước khi sửa (tuyệt đối không mutate `MOBS`), `zone=null` nên chết là hết.
  Quái khung xương nhuộm `goldenPal()`, quái ảnh nhuộm `ctx.filter` sepia.
  Debug: `debugGolden(giây)` / `debugMaTon(giây)`.

Không lưu state sự kiện — mốc giờ tính lại được từ đồng hồ thật.

⚠ Sự kiện mới PHẢI vào `eventList()` để hiện trên Bảng Sự Kiện + chip đồng hồ.

## Khắc Ấn — đồ đổi CÁCH CHIÊU CHẠY, không đổi con số

Bài học từ Diablo 3 (Loot 2.0 / legendary power). Trước hệ này **không một món đồ nào**
làm chiêu thức hành xử khác đi: 15 dòng phụ (`subName`) đều là `pct:true`, 6 dòng
`AWAKENED` là số cộng thẳng, bonus 4 bộ `ANCIENT_SETS` cũng chỉ %. Mọi hệ sản xuất đồ
(rèn, Bảo Hạp, Cổ Thần, gacha, sự kiện…) vì thế đổ về cùng một phần thưởng vô vị.

- `SIGIL_DEFS` — **12 Khắc Ấn**, mỗi lớp dùng được đúng 4 (2 riêng + 2 dùng chung).
  Gắn trên MỘT món đồ (`it.sigil`), mặc vào là có; `calcDerived()` gom vào `player.sigils`.
  Khắc Ấn của lớp khác vẫn nằm trên món đồ nhưng **không kích hoạt** (`sigilUsable()`).
- **4 móc**: `pre(tag)` trước khi tung · `hit(m,final,source,tag)` mỗi lần chạm ·
  `cast(tag,hits)` sau khi tung (biết đã trúng mấy con) · `kill(m)` khi địch gục.
  `tag`: `'a'` chiêu chính · `'tp'` Trấn Phái · `null` đòn thường/chiêu cũ.
- **Ngữ cảnh `tag`** đi qua 2 đường: chiêu chạm-ngay đọc cờ toàn cục `_sigilTag` (castSkill
  chạy đồng bộ); chiêu bắn đạn gắn `p.tag='a'` lên viên đạn và dựng lại cờ lúc đạn trúng.
- ⚠ `_sigilBusy` chặn đệ quy — sát thương do Khắc Ấn gây ra mang `source:'sigil'` và
  **không** kích Khắc Ấn lần nữa. Bỏ cái này thì Lan Trảm tự bật vòng đến tràn ngăn xếp.
- `sigilTimers` / `sigilZones` (đòn hẹn giờ, vũng độc) chạy trong `sigilTick(dt)`,
  **không lưu save**, và `sigilReset()` được gọi trong `buildWorld()` — nếu không, quả
  Trấn Phái tung ở map cũ sẽ nổ giữa map mới.
- **Nguồn rơi (chỉ 3)**: Bảo Hạp IV+ (18%→33% theo tầng) · Hung Thần Giáng Thế (45%) ·
  Xâm Lăng Vàng (Chúa Đàn 35%, quái vàng 8%). Đây là **bản sắc riêng** của Xâm Lăng Vàng —
  trước đó sự kiện này không có gì khác ngoài "Bảo Hạp bậc cao hơn".
- `rollSigil()` **ưu tiên Khắc Ấn người chơi chưa có**. Mỗi lớp chỉ có 4 cái hợp lệ nên
  random thuần sẽ trả trùng ngay lần thứ hai và hỏng hẳn cảm giác săn.
- ⚠ Tên "Khắc Ấn" cố ý KHÁC "**Dấu Ấn Khai Sinh**" (đặc điểm bẩm sinh, `TRAITS`) — hai hệ
  khác hẳn nhau và cùng hiện trong panel Nhân Vật, đừng đặt trùng tên lại.

Test: `node <scratchpad>/test_sigil.js` — chạy A/B từng Khắc Ấn (tắt vs bật) và bắt buộc
số đo phải khác nhau; "có mô tả nhưng không làm gì" sẽ bị đánh trượt.

## So sánh trang bị — nửa còn lại của Loot 2.0

Với 15 dòng phụ đều là % thuần, người chơi không tự nhìn ra món vừa nhặt hơn hay kém.
Trước đây túi đồ chỉ có mũi `▲` xanh dựa trên `itemPower()`: nói được "to hơn", không nói
được "khác chỗ nào", và **mù hoàn toàn với Khắc Ấn**.

- `itemCompareHtml(it)` — phán quyết + chênh lệch TỪNG DÒNG so với món đang mặc cùng ô.
  Nêu Khắc Ấn **trước** lực chiến: món kém 10% mà mang Khắc Ấn chưa có thường vẫn đáng mặc.
  Cũng cảnh báo khi đổi món sẽ **rời bộ Cổ Thần** (mốc 2/3/5 mà bảng chỉ số không thấy).
- `itemStatMap(it)` gom dòng chính/phụ/Thức Tỉnh về một bảng trừ được nhau (khoá có tiền tố
  `m:`/`s:`/`a:` để dòng cùng loại không đè nhau).
- `itemSigilNew(it)` / `itemSigilLost(slot, incoming)` — được/mất Khắc Ấn nếu đổi món.
- ⚠ **Ba cái bẫy Khắc Ấn tạo ra, đều đã chặn** (dễ tái phạm khi thêm hệ đồ mới):
  1. `tryAutoEquip` + `autoEquipBest` từng tháo mất Khắc Ấn chỉ vì món mới hơn 5% chỉ số.
  2. `autoEquipBest` xếp hạng theo **hai khoá** — (có Khắc Ấn mới) rồi mới tới lực chiến.
     Nhân lực chiến với hệ số cố định là sai: Khắc Ấn khan hiếm hơn hẳn nên chênh chỉ số
     bao nhiêu cũng không mua lại được.
  3. Auto-bán (3 chỗ) + `sellItem` một chạm: món có `sigil` luôn tính là đồ quý.

Test: `node <scratchpad>/test_itemcompare.js`.

## Hệ thống kỹ năng (đã tối giản)

Taskbar cố định **3 ô**: chiêu chính (`a`) · chiêu phụ (`tp`) · buff riêng từng lớp
(`BUFF_SKILL_ID`). Không cho người chơi tự gán. Các chiêu cũ không còn bấm được đã quy thành
**% Công Kích vĩnh viễn** (`LEGACY_SECT_SKILLS` / `legacyAtkPct` trong `calcDerived()`), hiện ở
tab "Tuyệt Học Cũ" (panel K).

## Hình vật phẩm — LẮP TỪ BỘ PHẬN, không phải file PNG

220 món, **0 byte**. Trước đây 11 file PNG (2,3 MB) phải gánh toàn bộ trang bị: mọi thanh
kiếm dùng chung `vukhi.png`, khác nhau đúng một bộ lọc xoay màu theo giai.

**Mỗi món là một DÒNG trong `ITEM_DB`, hình suy ra từ tổ hợp bộ phận.** Thêm món mới = thêm
một dòng, không viết hàm vẽ mới.

| dòng | bộ phận |
|---|---|
| Lưỡi | `IBLADE` 11 × `IGUARD` 7 × `IPOMMEL` 4 × `IMOTIF` 6 |
| Gậy/Trượng | `ISHAFT` 4 × `IHEAD` 7 |
| Cung / Nỏ | `iaBow` 3 cánh · `iaCrossbow` |
| Giáp | `ARMOR_TRAIT` 12 kiểu × 5 ô |

**Giáp sinh THẲNG từ `HERO_SETS`** (`ARMOR_PIECES` × 25 bộ). Nhờ vậy hình trong túi và hình
trên người dùng chung một nguồn — không có cách nào lệch nhau, kể cả khi đổi bảng màu bộ sau
này. **Vũ khí trên tay cũng vẽ bằng chính bộ phận dựng icon** (`hHeldWeapon` + `HELD_FIT`).

**Bốn luật đã trả giá mới biết:**
1. **Màu hoa văn thuộc về MÓN, không thuộc về giai.** Lấy `M.glow` thì Kiếm Điện, Kiếm Băng
   và Kiếm Lửa cùng giai sẽ cùng một màu — mất sạch bản sắc. Dùng `MOTIF_COL`.
2. **Vũ khí có `WEAPON_MAT` riêng, không dùng bảng màu giai.** Bảng đó viết cho GIÁP trên
   người: giai 10 là đỏ, nên mọi vũ khí cuối game sẽ đỏ hết.
3. **Icon cần sàn độ sáng riêng** (`itemPal` nâng khi `_lum(hi) < 0.30`). Nhân vật đứng trên
   bản đồ SÁNG, icon nằm trên nền panel TỐI — dùng chung một bảng màu cho hai chỗ là sai.
4. **Khoá cache phải gồm MỌI thứ đổi hình**, kể cả `plus` (không phải `plusStage(plus)`) —
   nếu không thì +8 và +9 dùng chung một ảnh dù có vẽ khác đi cũng vô ích.

**Khoá lớp** (`itemUsable`): kiếm chỉ Dark Knight, gậy chỉ Dark Wizard, cung chỉ Sylvan
Ranger. Chặn ở **cả ba** chỗ mặc đồ — bấm tay, tự mặc khi nhặt, nút Mặc Đồ Tốt Nhất. Bỏ sót
một chỗ là auto lách được luật. Dây chuyền và nhẫn không khoá.

**Hiệu ứng chém theo `motif` là THUẦN HÌNH ẢNH.** Cơ chế chiến đấu là việc của Khắc Ấn — cho
vũ khí làm cả hai thì hai hệ giẫm chân nhau và người chơi không biết sát thương lan ra là do
kiếm hay do dấu ấn.

⚠ **Ba lỗi hình chỉ lộ khi CHỤP RA XEM, không lỗi nào lộ khi đọc code**: nhẫn ra hình móng
ngựa (vẽ cung hở), găng ra thanh sô-cô-la (4 khối chữ nhật bằng nhau), kiếm cao hơn cả người
(hệ số 2.5 thay vì 1.45). Vẽ xong phải render ra ảnh mà nhìn.

## Lò Hỗn Độn — MỘT cỗ máy, không phải 7 khối chữ

Trước đây có **hai** màn rèn chồng nhau: bảng `Rèn Luyện` (tab) và `Lò Rèn Hoàng Gia` (NPC).
Mỗi màn là một cuộn chữ dài xếp 7 khối khác nhau, và hai bên còn trùng nội dung. Nay gộp thành
một cỗ máy kiểu Chaos Machine: **bỏ đồ + ngọc vào KHAY → máy liệt kê công thức khay đó thoả →
chọn → KẾT HỢP**.

**Luật nằm hết trong `CHAOS_RECIPES`, `renderForge()` chỉ vẽ.** Thêm công thức mới = thêm một
phần tử vào bảng, không đụng vào phần vẽ. Mỗi công thức khai báo:

| khoá | việc |
|---|---|
| `match(v)` | khay có đúng HÌNH DẠNG không (mấy món, loại gì) → trả mô tả hoặc `null` |
| `plan(v,m)` | tỉ lệ, bảng nguyên liệu, cảnh báo, có cho dùng Thiên Mệnh Phù không |
| `run(v,m,p)` | thực thi |
| `royal:true` | chỉ chạy tại Lò Rèn Hoàng Gia (`atRoyalForge()`) |

**Quy ước phân loại nguyên liệu:** thứ **rời rạc** (trang bị, ngọc Tứ Châu) phải bỏ vào khay mới
tính — dùng `jewelCost()`. Thứ **số lượng lớn** (bạc, Huyền Thiết, Tu La, Mảnh…) trừ thẳng từ kho
và chỉ hiện trong bảng — dùng `chaosCost()`. Đừng trộn hai loại.

**Ba cái bẫy đã sập một lần, đừng sập lại:**
1. `chaosSyncGroup()` phải chạy theo `chaosPick`. Nếu không, bảng DANH SÁCH công thức và bảng
   CHI TIẾT sẽ chỉ vào hai công thức KHÁC NHAU.
2. Khay trống thì **đừng** tự nhảy tab. Không có bước chặn này, mở lò ra là rơi thẳng vào Chế Tạo
   chỉ vì "khay trống khớp công thức luyện áo choàng".
3. Khay khớp công thức ở nhóm khác thì **phải** nhảy sang. Không có bước này, bỏ trang bị + viên
   Chúc Phúc vào khay lúc đang xem tab Rèn sẽ khiến máy im lặng hoàn toàn — không công thức,
   không nút bấm — dù khay hoàn toàn hợp lệ.

`trayView()` tự nhả món đã bán/vỡ khỏi khay, nên không có uid ma. Sau khi khảm ngọc xong, khay
**giữ lại món đồ** (để khảm tiếp) và chỉ nhả viên ngọc.

## Cảm giác chiến đấu — 3 luật dễ vi phạm lại

**1. AoE KHÔNG được hất lùi.** `hurtMob()` tự hất lùi mọi đòn `source === 'hit'|'crit'`.
Chiêu diện rộng mà đẩy địch ra thì chính nó phá tan đội hình cho đòn kế tiếp của mình —
Khắc Ấn Hiệu Triệu (trúng ≥3 địch) ngừng kích hoạt vì con thứ ba bị đẩy ra đúng 1 pixel.
Đừng chữa bằng cách đổi `source`: `source` còn chi phối bạo kích, âm thanh, móc Khắc Ấn.
**Bọc vòng lặp trúng-nhiều-mục-tiêu trong `aoeHit(() => { … })`.** Chiêu nào MUỐN hất lùi
thì khai báo `fx.kb` như cũ. Hiện có 6 chỗ: sectA cone/selfaoe, Võ Học Phổ cone/aoe và 2 sóng
dư chấn của chúng.

**2. `shakeDir` phải được đặt ở MỌI chỗ đặt `shakeT`.** Bỏ sót thì màn hình giật theo hướng
của cú đánh gần nhất — có khi ngược hẳn. Và `shakeMag` luôn dùng `Math.max`, đừng gán đè:
một cú cào nhẹ không được phép hạ biên độ của cú vừa nện.

**3. Mọi trạng thái hẹn giờ phải chết theo người chơi.** `update()` `return` sớm khi `dead`,
nên thứ gì đang hẹn sẽ ĐÓNG BĂNG rồi chạy tiếp ở toạ độ cũ sau khi hồi sinh — có khi ở tận
map khác. `onDeath()` phải dọn: `sigilReset()` (vũng độc + sóng hẹn giờ) và `player.pendingHit`.
Lưu ý `respawn()` chỉ gọi `buildWorld()` khi chết ở map KHÔNG an toàn, nên không thể trông
vào nó để dọn hộ.

## Test

Playwright + server tĩnh:
```bash
cd public/game && python3 -m http.server 8853
NODE_PATH=/opt/node22/lib/node_modules node <test>.js   # playwright cài global
```
Trong test: `window.TEST_MODE = true; startGame('<sect>', null);` rồi gọi thẳng hàm game
(`calcDerived()`, `castSkill()`, `update(0.1)`...).

⚠ Khi nhảy thẳng `player.level` trong test, phải tự gọi `vhAutoLearn()` — game thật gọi nó qua
`gainXp()` → `unlockNotices()` mỗi lần lên cấp.

## 🚀 PRODUCTION — VPS tự kéo từ `main` mỗi 2 phút

**Production LÀ VPS này, không phải Vercel.** Repo có `vercel.json` + `Dockerfile.vercel`
nhưng đó là môi trường khác — đừng suy ra production từ chúng.

| | |
|---|---|
| Live | **http://14.225.204.107/** |
| Máy chủ | VPS Vietnix, hostname `axiewuxia-xiiz`, nginx |
| Thư mục phục vụ | `/var/www/axiewuxia/public/game` |
| Bản sao git | `/var/www/axiewuxia` (clone của `ShanKyos/axiewuxia`) |
| Tự động | cron `*/2 * * * * /root/deploy-axiewuxia.sh` |
| Script | `git fetch origin main --quiet && git reset --hard origin/main --quiet` |

### ⇒ Deploy = MERGE VÀO `main`. Không có bước nào khác.

```bash
git checkout main
git merge <nhánh> --no-edit
git push origin main          # ≤2 phút sau là live
git checkout demo-axie-showcase && git merge origin/main --no-edit && git push origin demo-axie-showcase
git checkout main
```

### Những chỗ đã vấp, đừng vấp lại

- ⚠ **Sandbox KHÔNG SSH được vào VPS.** Cổng 22 bị chặn ở tầng mạng, và IP cũng không nằm
  trong allowlist HTTP của proxy (gọi thử trả `403 Host not in allowlist`). Mọi lệnh cần chạy
  **trên** VPS đều phải đưa cho người dùng tự chạy. Đừng hứa sẽ tự deploy/SSH.
- ⚠ **IP không xuất hiện ở đâu trong repo** — cấu hình nằm trên VPS. Grep repo rồi kết luận
  "không có đường deploy" là SAI; tôi đã mắc đúng lỗi này. Cần tra thì tra transcript phiên.
- ⚠ Script dùng `git reset --hard`. Sửa file tay trong `/var/www/axiewuxia` sẽ **mất sạch** ở
  lần pull kế tiếp. Mọi thay đổi phải đi qua `main`.
- ⚠ **Trước khi merge vào `main` phải chạy đủ 3 gate CI** (`npm run lint` · `npm run check` ·
  `npm test`) **và** bộ regression game trong scratchpad. Merge là live trong 2 phút, không có
  bước duyệt nào chen vào giữa.
- ⚠ **KHÔNG ghi thông tin đăng nhập vào bất kỳ file nào trong repo.** Mật khẩu root từng bị
  dán nguyên văn vào lịch sử chat — đã báo người dùng đổi và chuyển sang SSH key.

### Kiểm tra sau khi deploy

`http://14.225.204.107/` (thêm `?test=1` để mở chế độ thử: đi map tự do + tick cấp 60).
Log deploy nằm ở VPS, người dùng xem giúp — sandbox không tới được.

## Git

Phát triển trên `main`, sau đó sync sang `demo-axie-showcase`:
```bash
git checkout demo-axie-showcase && git merge origin/main --no-edit && git push origin demo-axie-showcase
git checkout main
```

## Đồ rơi phải NẰM DƯỚI ĐẤT, không nhảy thẳng vào túi

`killMob()` KHÔNG được gọi `player.inv.push(it)` nữa. Mọi thứ rơi ra đi qua
`dropToGround({k:'item'|'jewel', ...}, x, y)` — vật thể có toạ độ, nảy vòng
cung, nằm 45 giây, có nhãn tên nổi màu theo phẩm.

Bốn con số đo được ở bản cũ, để đừng bao giờ quay lại:
- 33% số kill **im lặng tuyệt đối** — 0 chữ, 0 tiếng, 0 dòng log
- tiếng rơi ngọc bị `AudioSys` debounce 70ms **nuốt 100%**: `killMob` đã gọi
  `sfx('coin')` vài phần nghìn giây trước `rollJewels`. Âm cho thứ rơi ra
  **không được trùng tên** với âm đã phát trong cùng một `killMob`.
- túi đầy → **50/50 món mất trắng**, không một lời cảnh báo. Nay đồ nằm lại
  dưới đất và đổi nhãn `⚠ TÚI ĐẦY`.
- 229 chữ bay là vật liệu vụn vs 29 chữ tên trang bị. **Vật liệu vụn về
  `logCombat`**, `addFloat` để dành cho đồ, ngọc và những thứ đáng dừng tay.

Ba luật kèm theo:
- `groundLoot` **không lưu vào save** và **phải bị xoá trong `buildWorld()`**
  — không thì đồ map cũ hiện lơ lửng ở map mới.
- **AUTO bật thì nới tầm hút gấp 3.** Lớp tầm xa giết quái cách 200px; để
  nguyên bán kính đi-ngang-qua là treo máy cả tiếng rồi bỏ lại nguyên bãi đồ.
- Nút J trên thanh kỹ năng phải theo **đúng** thứ tự ưu tiên của phím J
  (nhặt đồ → hái thuốc → nhảy). Lý do cũ là "điện thoại không có cách nào nhặt";
  game nay chỉ chạy PC nên lý do đó hết hiệu lực, nhưng LUẬT thì vẫn giữ: nút và
  phím phải làm cùng một việc, không thì người bấm nút và người gõ phím thấy hai
  hành vi khác nhau ở cùng một chỗ.

Hình vật phẩm được vẽ cho **ô túi nền tối**. Đặt thẳng lên bãi cỏ sáng là mất
hút — mỗi món dưới đất phải có tấm nền tối bo góc + viền màu phẩm.

## Sự kiện thế giới chạy theo GIỜ THẬT

Ba sự kiện, cùng một khuôn: `*NextBoundary(after)` snap về mốc giờ, cảnh báo
trước, kích hoạt, hết cửa thì dọn. State tính lại được từ `Date.now()` nên
**không lưu vào save** — đến trễ là lỡ chuyến, đúng nhịp MU.

| Sự kiện | Mốc giờ | Cửa mở | Báo trước |
|---|---|---|---|
| Hung Thần Giáng Thế | 0h·4h·8h·12h·16h·20h | 30 phút | 10 phút |
| Xâm Lăng Vàng | 2h·6h·10h·14h·18h·22h | 12 phút | 10 phút |
| Chúa Tể Vực Nứt | 0h·6h·12h·18h (4 lượt/ngày) | 45 phút | 15 phút |

Hai chốt của Vực Nứt chỉ lộ ra khi **chụp màn hình**, không phải khi đọc code:
- `aggro: 9999` + cho nứt ở cả bãi tân thủ = nhân vật cấp 1 vừa vào bãi đầu
  tiên đã bị boss băng qua nửa map đấm chết trong 2 nhịp.
- Bậc Bảo Hạp tính theo **map** thì người chơi cấp thấp mở ra toàn đồ ngoài
  khoảng cấp dùng được. `BAOHAP_TIERS` khoá khoảng cấp đồ → thưởng hạp luôn
  phải tính theo **cấp người chơi**.

## Vật cản: thứ MẮT THẤY phải là thứ GAME THỰC THI

Cây và đá từng có bán kính va chạm **bằng 0**. Đo được: xếp 8 cây to nhất thành hàng rào rồi
cho nhân vật đi qua — toạ độ x **không lệch một pixel**. Và 3/7 map ngoài trời có **0 vật cản
trong lòng**; tỉ lệ vòng giữa mọi cặp bãi quái ra đúng **1,000**, tức là suốt vòng đời người
chơi không có một đoạn đường nào phải né gì cả. Đó mới là gốc của cảm giác "trôi tuột" —
không phải chuyện map to hay nhỏ. **Phóng map to trước khi có vật cản chỉ tạo thêm đất trống.**

Bốn luật rút ra, trả giá bằng nhiều vòng đo:

- **Decor va chạm thì PHẢI lọc khỏi mọi điểm nội dung** — bãi quái, thảo dược, cổng, ải cấp,
  boss vùng, spawn. Quái và boss tự `nearestFree()` ra chỗ trống, **thảo dược thì KHÔNG**: một
  bụi thuốc nằm giữa hồ là vĩnh viễn không hái được.
- **Phải xoá `decorObs` NGAY khi dựng lại thế giới**, trước khi rải decor mới — `obstaclesOf()`
  nối decor của map đang đứng vào, nên bộ lọc sẽ soi nhầm theo địa hình map trước.
- **Đừng đặt khối chắn ngang trục nối hai bãi quái.** Né cục bộ (`simulateMovePath`) chỉ vòng
  nổi khối ngắn; khối dài 340px chắn thẳng trục làm đường đi kẹt lại cách đích 300–555px.
- **Kiểm bằng LIÊN THÔNG (flood fill), không phải tỉ lệ vòng.** Trượt qua một gốc cây gần như
  không làm đường dài thêm, nên tỉ lệ vòng trung vị là mốc vô dụng cho vật cản nhỏ. Flood fill
  bắt được cả trường hợp hai khối chạm đúng mép nhau bịt kín hành lang — lỗi đã xảy ra thật.

Một hướng đã thử và **HỎNG**: đo "kẹt" bằng mức *gần đích hơn* thay vì *quãng đường đã nhích*.
Trượt dọc mép gần như không bao giờ rút ngắn đủ → `stuck` tăng mỗi bước → độ chệch kịch trần
tức thì → đường đi xoáy ra góc map, hụt đích **1954px**. Giữ cách đo bằng quãng đường.

Và khi vật cản chặn thật, click-to-move **không được bỏ cuộc ngay lần kẹt đầu**: né cục bộ hay
chui vào túi giữa mấy gốc cây, vứt waypoint tính lại là thoát. Bỏ cuộc ngay làm 1/3 số lần bấm
đi xa bị huỷ giữa đường.
