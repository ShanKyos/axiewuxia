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
- Số liệu/cơ chế: str/agi/vit/ene, tầm đánh & sát thương khác nhau theo lớp, reset (Tẩy Tủy)

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

## Git

Phát triển trên `main`, sau đó sync sang `demo-axie-showcase`:
```bash
git checkout demo-axie-showcase && git merge origin/main --no-edit && git push origin demo-axie-showcase
git checkout main
```
