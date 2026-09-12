# Axie Rift — hướng dẫn cho Claude

## ⚠ QUY TẮC SỐ 1: PHONG CÁCH LÀ **MU ONLINE**, KHÔNG PHẢI WUXIA

Game này khởi đầu là một game kiếm hiệp (wuxia) Trung Hoa và **đã được chuyển hẳn sang tribute
MU Online**. Tên thư mục/repo `axie-wuxia` chỉ là di sản lịch sử — **đừng để nó dẫn dắt thiết kế**.

Mọi thứ làm mới từ nay trở đi phải theo MU Online. Cụ thể:

**KHÔNG dùng:**
- Chữ Hán/kanji làm hình ảnh (icon, biểu tượng, glyph trang trí trên UI).
  Toàn bộ file **hiện không còn ký tự CJK nào** — kiểm tra lại bất cứ lúc nào bằng:
  `python3 -c "import re;print(sum(1 for l in open('public/game/game.js',encoding='utf-8') if re.search(r'[　-〿一-鿿＀-￯゠-ヿ぀-ゟ]',l)))"`
  Dải kiểm nay gồm cả **dấu câu CJK** (`【】《》`) và **ký tự toàn rộng** (`＋`), không chỉ chữ Hán:
  bản cũ chỉ quét U+4E00–U+9FFF nên 9 cặp `【…】` ở nhãn danh hiệu và tên bộ đồ lọt qua suốt
  nhiều đợt, dù chúng hiện thẳng trên HUD.
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

**Cấm xuất hiện trong text người chơi thấy:** ~~Kundun~~ · Lorencia · Noria · Devias ·
Icarus · Atlans · Tarkan · Fairy Elf · Magic Gladiator · Devil Square · Blood Castle.
(Nhắc "MU Online" trong *comment* để ghi nguồn cảm hứng thì được — chỉ là đừng ship
tên riêng của họ thành nội dung game.)

### ✅ NGOẠI LỆ ĐÃ DUYỆT: "Box Kundun"

Chủ dự án yêu cầu đích danh dùng **"Box Kundun"** cho hệ hộp mở đồ (trước là "Bảo Hạp"),
lý do: người chơi MU quen tên đó, gọi khác thì lạ. Rủi ro đã được nêu — đây là tên riêng
của MU Online, còn dự án này là tribute IP riêng — và chủ dự án vẫn chốt dùng.

⇒ `BAOHAP_TIERS[].name` = `Box Kundun I…VII`. **Đây là ngoại lệ DUY NHẤT.** Mười tên còn
lại trong danh sách trên vẫn cấm tuyệt đối. Đừng "sửa ngược" chỗ này tưởng là sót — nếu
muốn đổi lại thì phải hỏi chủ dự án, không tự quyết.

Kiểm tra bất cứ lúc nào: `node <scratchpad>/test_story.js` — nó quét toàn bộ
INTRO_PAGES / QUESTS / CLUES / BOSS_LORE / SECTS / NPCS / MOBS / TB_TIER_NAMES.

**Tên đã tự đặt để thay thế:**

| Thay cho | Dùng |
|---|---|
| MU (thế giới) | **Vaeldra** — lục địa thép và tro |
| Kundun | ~~Morvahn~~ — **đã bỏ cùng mạch cũ.** Canon nay không có đại ma đầu bị chôn; kẻ thù là **DRUE**, người thứ bảy đi qua Nhát Gọi (xem mục Cốt truyện) |
| Lorencia | **Ardhaven** |
| Fairy Elf / Magic Gladiator | **Sylvan Ranger** / **Spellblade** |
| Devil Square / Blood Castle | **Đấu Trường Tế Thần** / **Pháo Đài Máu** |
| Excellent / Ancient | **Tinh Xảo** / **Cổ Vật** |

Dark Knight · Dark Wizard · Dark Lord **giữ nguyên** — là danh từ fantasy phổ thông.

## 🔄 ĐỔI VAI: AXIE LÀ AVATAR, 5 LỚP LÀ SỨC MẠNH — đang thi công

> Đặc tả đầy đủ: **`docs/DOI_VAI_AXIE.md`** · Danh mục Cổ Vật: **`docs/CO_VAT_15.md`**
> Nhìn thử: **`public/game/proto_doivai.html`** (mở bằng máy chủ tĩnh, không nạp `game.js`)

**Chủ dự án chốt (nguyên văn):** *"Chỉ số tới từ 5 class. Axie chỉ đơn thuần là avatar thôi,
khi tấn công thì ví dụ Dark Wizard sẽ xuất hiện và tung chiêu."*

| | |
|---|---|
| **Axie** | thân NHÌN THẤY. **0 chỉ số, 0 kỹ năng, 0 trang bị.** Là ô để cắm NFT. |
| **5 lớp** | nơi chứa **toàn bộ** chỉ số, trang bị, kỹ năng, Tiến Hoá, Di Sản |
| **Lúc đánh** | lớp nhân vật **vật chất hoá**, tung chiêu, rồi tan |
| **Khoá lớp** | chọn một lần lúc tạo nhân vật. **Avatar thì tự do** — mọi NFT đều cắm được. |

### ⇒ Đây KHÔNG phải đổi kiến trúc. Là đổi LỚP VẼ.

`calcDerived()` · `hurtMob()` · `castSkill()` · `SECTS` · `HERO_SETS` · `player.equip` ·
`player.sect` — **không đụng một dòng nào.** Save cũ đọc được nguyên vẹn.

### Đã thi công

| Thứ | Ở đâu |
|---|---|
| `player.avatar` · `avatarId()` · `veAvatar()` · `chiVeChay()` · `veVongTrieu()` | `game.js`, ngay trên `chiVeNho` |
| Móc vào `drawPlayer()` | 5 chỗ, **tất cả đều qua cửa `avatarId(p)`** |
| Lệnh `/avatar <id> · ds · off` | bảng lệnh gỡ rối |
| 16 bảng khung CHẠY `<id>_r.webp` | 1,29 MB, **nạp theo nhu cầu** (chỉ con đang dùng) |
| Công cụ nướng | `tools/spine/nuong_chi_chay.py` |

> ⚠ **`player.avatar` rỗng ⇒ HÀNH VI CŨ Y NGUYÊN.** Đây là chủ ý, không phải làm dở: đợt này
> phải cắm vào một trò chơi đang chạy mà không bài nào trong 177 bài đỏ. Avatar là thứ **bật
> lên**, không phải thứ thay thế. Đừng "dọn dẹp" cái cửa đó đi.

**Cờ bài kiểm đọc được:** `window.__veThan` nay có ba giá trị — `'avatar'` · `'sprite'` ·
`'vector'`. Bài cũ nào khẳng định nó phải là `'sprite'` thì vẫn đúng khi avatar tắt.

### Ba cái bẫy đã dẫm, ghi lại

1. **`atkAnim` ĐẾM NGƯỢC** — `atkK` = 1 ở khung ĐẦU. Tiến độ vật chất hoá là `1 − atkK`. Dùng
   thẳng `atkK` thì lớp nhân vật mờ dần ĐI trong lúc vung, tức ngược hẳn. (Cùng họ với bẫy
   `lungeK = hSwing(1 - atkK)` đã ghi ở mục cảm giác chiến đấu.)
2. **Avatar phải vẽ SAU `ctx.restore()`** của khối thân người. Bên trong đó là hệ toạ độ cục bộ
   của bộ xương (đã dời về `p.x/p.y`, lật theo hướng, thu theo tỉ lệ) — avatar tự lo cả ba thứ
   đó nên vẽ trong đấy là lật hai lần và thu hai lần.
3. **`AVA_TY` là số trần, `avaCao()` là HÀM.** Nhân thẳng `NV_THAN_PX` ở chỗ khai (dòng ~5110)
   là rơi vùng chết của `const` — `NV_THAN_PX` khai tận dòng 22987. Đúng cái bẫy đã ghi ở mục
   `NV_CAO`.

### Trúng đòn và chết vẫn giữ AXIE — cố ý

Chỉ `'a'` (đánh) và `'c'` (niệm chú) mới gọi lớp nhân vật ra. Nếu lớp nhân vật nháy ra mỗi lần
ăn đòn thì trong một trận đông quái người chơi gần như không còn thấy avatar của mình — mà
avatar mới là thứ họ chọn hoặc mua.

**Nợ:** rig có sẵn `defense/hit-by-normal` và chưa nướng. Nướng rồi thì Axie giật được khi trúng.

### 🔑 KIT AXIE CÓ 41 HOẠT CẢNH, GAME MỚI DÙNG 2

Khảo sát `axieinfinity/axie-origins-asset-kit` (clone về `/home/user/axieinfinity/...`, 2,2 GB).
Đây là thứ đáng nhớ nhất của đợt này:

| Nhóm | Có sẵn trong rig |
|---|---|
| Di chuyển | `action/run` · `move-forward` · `move-back` · 5 idle ngẫu nhiên |
| Đánh gần | **8 đòn** — `horn-gore` `mouth-bite` `tail-smash` `tail-roll` `tail-thrash` `multi-attack` `normal-attack` `shrimp` |
| Đánh xa | **5 đòn** — `cast-fly` `cast-high` `cast-low` `cast-multi` `cast-tail` |
| Phòng thủ | `evade` · `hit-by-normal`(+`crit`/`dramatic`) · `hit-by-ranged` · `hit-with-shield` |
| Khác | `get-buff` · `get-debuff` · `evolve` · `victory-pose-back-flip` · `sleep` · `eat` · `bath` |

- Bộ 41 này **giống hệt nhau ở cả 12 rig `.json`**; 26 rig `.skel` mượn được, y như
  `nuong_chi.py` đã mượn cho idle+appear.
- **Kit tự có rig `.json`** ⇒ `nuong_chi_chay.py` không cần repo `cc-axie-gtk2d` nữa.
- Kit còn **108 clip VFX** xếp theo **9 lớp Axie × 7 kiểu đòn** (`bite`/`cast`/`gore`/
  `projectile`/`slash`/`smash`/`throw`) — tức VFX và hoạt cảnh là MỘT BỘ KHỚP SẴN. Kèm
  `shield` · `shield_boost` · `shield_break` · `taunt` · `reflect_damage` · `heal` · `cleanse`.
- Và **8 rig Summoner** chính chủ (`clover` `mavis` `sparrow` `trunk` `mushroom` `littlerobin`
  `fruitsloth` `truefanhermitcrab`).

⚠ Nướng cần `pillow` + `numpy` (`pip install pillow numpy`) — máy sạch không có sẵn.

⚠ **Hộp cắt của bảng chạy phải GIỐNG HỆT bảng nhỏ**, nếu không con vật nhảy một cái mỗi lần
đứng ↔ chạy. `nuong_chi_chay.py` dựng lại đúng phép tính hộp của `nuong_chi.py` (bb trên
appear+idle) rồi mới đem đi cắt khung chạy — tốn 28 khung nướng thừa mỗi con, đổi lại không
phải tin vào một con số chép tay nào.

### ⚠ RAGOON ĐÃ GỠ — gacha thì KHÔNG, nó chỉ đổi thứ nó trao

Chủ dự án chốt: *"Bỏ luôn phần Ragoon. Nếu gacha là sẽ gacha nhân vật."* Cái chết là **CON THÚ**,
không phải cái máy. Đường cắt hoá ra **ba tầng** (đặc tả: `docs/DOI_VAI_AXIE.md §11b`):

| Tầng | Quyết định |
|---|---|
| Tầng vẽ — `CHIMERA` `CHI_ANH` `CHI_MAP` `_chiVe` `chiVeNho` `chiChayImg` `chiSan` `CHI_THO_FPS` | **GIỮ.** Avatar đọc đúng bộ này. Gỡ là gỡ luôn avatar. |
| Máy gacha — `chiState` `chiNhan` `gachaMotLuot` `gachaQuay` pity banner `player.chimera.co` | **GIỮ, đổi thứ nó TRAO** → thân Axie. 16 con đã có sẵn 16 bảng khung avatar; gỡ máy rồi dựng bộ chọn avatar mới là nhân bản đúng cái vừa xoá. |
| Con thú + hai vòng nuôi nó | **GỠ HẾT** (danh sách đầy đủ trong chú thích tại chỗ cũ trong `game.js`) |

**Ba nguồn chỉ số từ con Axie đã gỡ khỏi `calcDerived`**: bị động `thu` (× `chiThuMul`), bốn kỹ
năng đồng hành, buff tạm `chiTam`. ⚠ **Đừng nối lại.** `CHIMERA[].thu` / `.chieu` trong
`canbang.js` vẫn còn nhưng **không được đọc ở đâu nữa** — một cái thân thì không cộng chỉ số, và
cho quay gacha ra +25% sát thương là dựng lại đúng trục sức mạnh mua được mà đợt này đang tháo.

**`chiCoTrongMan` / `CHI_THAN` 0,45 / `CHI_TRAN` 0,55 đã gỡ** — luật *"Chimera đi theo không bao
giờ được lấn át nhân vật"* cần HAI cái thân đứng cạnh nhau mới có nghĩa. Nay chỉ còn một. ⚠ Cỡ
avatar do `AVA_TY` 0,72 / `AVA_TRAN` 0,95 quản, và hai số đó khớp theo luật **ngược lại**: avatar
và lớp nhân vật THAY CHỖ NHAU lúc ra đòn nên khối nhìn thấy phải **bằng nhau**, không nhỏ hơn.
Chép `CHI_THAN`/`CHI_TRAN` sang đấy là mỗi cú đánh một cú giật cỡ. `tests/test_cothu.js` gác.

### ◆ BỐN Ô CỐT NAY CẮM TRÊN NGƯỜI CHƠI

`player.cot` (4 ô) + `player.cotKho`, thay cho `player.chimera.co[id].cot`. Năm khoá `c*` của
Ragoon đổi sang khoá thật: `cAtk→atkPct` · `cCrit→crit` · `cCritDmg→critDmg` · `cSkill→skillPct`
· `cCd→cdCut`. Dải lấy theo **dải người chơi** (thấp hơn dải Ragoon cũ) — Cốt nay cộng thẳng vào
đòn của chính mình, không đi qua một con thú có sát thương riêng.

- `chiCotGom(id)` → **`cotGom()`**: MỘT sổ, không còn sổ `c` mất đích. Đừng dựng lại sổ thứ hai.
- ⚠ **Tám khoá `COT_PHU` phải KHÁC NHAU đôi một.** `cAtk→atkPct` trùng dòng `atkPct` có sẵn thì
  `cotThemPhu()` (lọc trùng theo khoá) chỉ còn **bảy** khoá để bốc trong khi trần là bốn dòng
  phụ — không lỗi, không báo gì, chỉ là bể hẹp đi. Dòng dôi ra đổi sang `pierce`.
- ⚠ **`skillPct` và `cdCut` KHÔNG có ngăn trong sổ P** — chúng đi đường riêng vào
  `player.skillDmgPct` / `player.vhCdMult`, đúng đường Đại Thành đã dùng.
- ⚠ **Mười một hiệu ứng "đủ 4 mảnh" đã DỜI** từ `chiCastChieu()` sang chiêu NGƯỜI CHƠI:
  `cotBoCast(id)` gọi **một lần** ở cuối `castSkill` (hơn mười nhánh, vài nhánh thoát bằng
  `return` — rắc vào từng nhánh là đảm bảo bỏ sót) · `cotBoTick(dt)` · `cotDmgMul()` ·
  `cotCdMul()`; Tro Tàn trong `killMob`, Mầm Cội trong `hurtMob`. Không dời thì bốn ô Cốt chỉ
  còn là bốn dòng chỉ số, mất đúng cái làm Cốt khác trang bị.
- ⚠ **`cotDiTru()` phải TRẢ MẢNH VỀ KHO.** Save cũ có một bộ bốn ô cho TỪNG con; nay chỉ còn một
  bộ. Giữ bộ của con đang cắm, mọi mảnh khác về kho. Bỏ bước đó là người chơi mất trắng.

**Hai lỗi CÓ SẴN, lộ ra lúc dời** — cả hai đều im lặng:
1. Băng Vụn đủ 4 mảnh ghi `m.freezeT`, mà **không chỗ nào trong game đọc `freezeT`**. Cơ chế
   đứng hình thật là `m.stunT`. Bảng Cốt hứa "đóng băng 1,2 giây" và chưa con quái nào từng đứng
   lại. Trước khi thêm một trạng thái mới lên quái, grep xem có ai ĐỌC nó không.
2. Gacha trùng con chỉ trả Nguyệt Trần **sau** khi đủ C6, vì sáu lần đầu còn nuôi Huyết Thống.
   Ba hệ số đó gỡ rồi nên sáu lần trùng đầu thành trắng tay. Nay trùng có thưởng ngay từ lần đầu.

Bài kiểm: **`tests/test_cotnguoi.js`** (thay cho `test_dinhhinh.js` đã gỡ — bài cũ gác hệ Định
Hình Chimera, tức gác một cái xác: nó xanh mãi mãi và không bảo vệ gì).

### Còn treo

| | |
|---|---|
| Hai kiểu hiện | **"hiện khi đánh"** đã chốt và đã thi công. Kiểu "thường trực" (xác đứng chắn) còn trong proto để so. |
| Lớp gacha Cổ Vật | `docs/CO_VAT_15.md` mới là ĐỀ XUẤT, chưa chốt. Trần 16% chỉ quản lớp đó — **chỉ số từ 5 lớp KHÔNG có trần**. |
| Chibi 5 class Axie ở màn tạo nhân vật | chưa thiết kế. `CHIBI_CFG` hiện phân biệt bằng bóng dáng NGƯỜI. |
| Mốc thay "Giày +6 mở dáng chạy" | avatar bay/chạy thì mốc cũ mất ý nghĩa |
| Ngũ Hành → tam giác Axie | chưa làm. 40 nhãn `el:` trong `data/canbang.js` vẫn là Kim/Mộc/Thuỷ/Hoả/Thổ — **tàn dư kiếm hiệp, vi phạm Quy tắc số 1**. Đặc tả ở `docs/DOI_VAI_AXIE.md` §7; `hurtMob` không đổi công thức, chỉ đổi nhãn. ~~Lỗi lệch dấu `'Thuỷ'`~~ **đã vá** (`bb2a1bd`) — con Trấn Ải Trũng Nứt từng nằm ngoài toàn bộ hệ khắc hệ. |

---

## 📌 CHẨN ĐOÁN GỐC: NỘI DUNG ĐANG ĐƯỢC LÀM BẰNG CÁCH NHÂN BẢN

Đọc mục này TRƯỚC khi nhận bất kỳ việc nào có chữ "thêm map", "thêm phó bản",
"thêm quái", "thêm cấp". Đây là kết luận chốt của phiên thiết kế, không phải ghi chú tuỳ hứng.

**Bệnh:** game không thiếu nội dung — game có một lượng nội dung nhỏ được chép ra nhiều lần.
Đo được từ ba phía độc lập, cả ba ra cùng một chỗ:

| Đo cái gì | Con số | Nghĩa là |
|---|---|---|
| Số loài quái mỗi map | 7 → 3 khi lên cấp | càng chơi lâu, thế giới càng nghèo đi |
| Cấp có hệ thống MỚI mở ra | 20 đầu có, 99 cấp sau **không có cấp nào** | mọi thứ dồn hết vào đoạn mở đầu |
| Địa hình 7 phó bản | **1 địa hình** dùng 7 lần | bảy cửa, một căn phòng |

Bằng chứng của dòng thứ ba nằm ngay trong `data/canbang.js`: cả bảy `pb_*` đều
`spawn:{x:1300,y:1560}`, cửa ra đều `x:1300,y:1660`, đều `packs:[]`, đều `duhiep:null`.
Chỉ khác `ground`/`patch` và số `trees`/`rocks`.

**Chữa bằng cách thêm map thứ 8 là làm bệnh nặng thêm.** Chữa bằng máy sinh địa hình
+ từ khoá biến đổi phòng (đã đặc tả sẵn ở `docs/DE_XUAT_MAP.md`, mục C1/C2 và issue #90).

Trạng thái hiện tại: **bảy phòng đã gỡ hẳn** (mục kế tiếp), tầng map đang chờ dựng lại.

### 🗑 BẢY PHÓ BẢN ĐÃ GỠ — và những gì đã phải gỡ theo

Chủ dự án quyết xoá hẳn bảy map `pb_*` để dựng lại tầng map từ đầu. Đã gỡ:
`window.DUNGEONS` (còn `{}`) · 7 mục `pb_*` trong `MAPS` · 14 cổng trong `GATES` ·
7 nền · 7 mục nhạc · 7 `spawnFrom`.

**MÁY chạy phó bản thì GIỮ NGUYÊN** — `DGN` · `startDungeonRun` · `updateDungeon` ·
`DGN_ROOMS` · `drawDgnWalls` · `drawDungeonHUD` · `spawnHuntBoss` · thưởng · `boxTier`.
Nó chạy hoàn toàn theo dữ liệu: thêm một khoá vào `MAPS` (có `type:'dungeon'`,
`dungeon:true`) và một khoá cùng tên vào `window.DUNGEONS` là phòng chạy lại ngay,
không phải sửa một dòng máy nào. Khuôn một mục nằm trong chú thích ở `data/canbang.js`.

Quy ước khoá vẫn còn hiệu lực: **phó bản của map X là `pb_X`**. Nút "Vào Phó Bản" trong
bảng Chọn Trận đọc đúng quy ước đó, nên đặt tên mới theo nó là nút tự hiện lại.

Ba thứ từng treo trên phó bản, đã phải rời chỗ khi gỡ — **nhớ trả về khi dựng lại**:

| Thứ | Trước | Nay |
|---|---|---|
| Địa hình Tầng Sâu | `DEEP_MAP = 'pb_daohoa'` | map riêng `deep` trong `MAPS` |
| Nguồn Cốt (nay của NGƯỜI CHƠI) | thông quan phòng | **cầu tạm**: boss vùng của 7 map cha (`cotBossVung`) |
| `COT_DONG[*].map` | `pb_*` | map cha ngoài trời |

`cotBossVung` là **cầu tạm, không phải thiết kế**. Nó tồn tại vì một hệ không còn cửa
nào là một hệ chết. Dựng lại tầng phó bản xong thì trả cửa về chỗ cũ và gỡ nó đi.

Bảy Dòng Cốt vẫn giữ nguyên quan hệ một-đổi-một với bảy vùng — đây là **cơ chế chọn
build**, không phải trang trí: người chơi chọn Dòng để nuôi bằng cách chọn nơi để cày.

| Vùng | Dòng Cốt độc quyền |
|---|---|
| `daohoa` | Cánh Hoa |
| `ngoai` | Đồng Cỏ |
| `chungnam` | Rễ Gai |
| `comoc` | Vỏ Trứng |
| `tuyettinh` | Băng Vụn |
| `mongco` | Tro Tàn |
| `nhanmon` | Sấm Vụn |

Sách Kỹ Năng · Tinh Luyện · Bản Năng · Box Kundun **không chết theo** vì còn nguồn khác
(Tầng Sâu, cửa hàng, quái, nhiệm vụ). Chỉ Cốt là độc quyền, nên chỉ Cốt cần cầu tạm.

**Bài kiểm:** 14 bài từng vào `pb_daohoa`/`pb_nhanmon` nay tự cắm phòng của mình bằng
`tests/pbthu.js` (`dungPbThu`). Việc đó vừa giữ máy phó bản có người gác, vừa **kiểm
luôn lời hứa "máy chạy theo dữ liệu"** — nếu một khoá là đủ để phòng chạy từ đầu tới
cuối thì cắm lại bảy phòng thật cũng chỉ là điền dữ liệu. `tools/reg.sh` đã sửa để chép
cả tệp phụ trợ trong `tests/`, không chỉ `test_*.js`.

### 📏 LUẬT MAP — rút từ số đo, không từ cảm giác

Số đo hiện trạng: `docs/DO_MAP_HIEN_TRANG.md` (sinh bằng `tools/do_map.js`, **đừng sửa tay**).
Bánh cóc: `tests/test_domap.js` — map chỉ được tốt lên, không được tệ đi.

**Ba cỡ, ba công cụ. Đừng lẫn.**

| Cỡ | Đơn vị | Công cụ | Chỉ số chấm |
|---|---|---|---|
| **Chiến đấu** | 40-120px | trụ đá (`raiTruDa`) | **vật che %** |
| **Một màn hình** | ~1400px | ngã rẽ có giá, khe 60-140px | (chưa có chỉ số) |
| **Bản đồ** | 2600×1900 | **zoom camera** hoặc phóng to map | số màn hình/map |

**Camera có ZOOM** (`ZOOM_MUC`: GẦN 1,75× · VỪA 1,45× · XA 1,0×; mặc định VỪA).

Trước đó không có: 1px thế giới = 1px màn hình, và trên màn 1920×1080 người chơi thấy **42%
diện tích map** trong một khung hình — cả map chỉ bằng **2,4 màn hình**. Đặt ngã rẽ ở đâu thì
cả hai nhánh cũng nằm gọn trong tầm mắt, nên nó không phải lựa chọn, chỉ là một cái hình. Ở mức
VỪA, map thành **~5 màn hình** mà không tốn một file art nào.

**Đã thử và BỎ: phủ lớp tối ngoài tầm nhìn.** Nó đạt cùng mục đích trên giấy, nhưng mảng tối
đánh nhau với art sáng của Axie — nhìn ra là một cái mặt nạ chứ không ra một thế giới. Bài học
chung: đừng chữa vấn đề *bố cục* bằng cách đè lên *màu*.

**⚠ `W`/`H` là cỡ MÀN HÌNH · `VW`/`VH` là cỡ THẾ GIỚI lọt trong khung.** Mọi phép cắt bỏ ngoài
màn, kẹp camera và đổi toạ độ chuột phải dùng `VW`/`VH` (= `W`/zoom). Dùng nhầm `W` thì quái
biến mất ở mép màn hình, hoặc chuột trỏ lệch — hai lỗi này nhìn không ra là cùng một nguyên nhân.

**⚠ `ZOOM_CHON` là `let` riêng, KHÔNG đọc thẳng `SETTINGS`.** `resize()` chạy lúc nạp tệp
(dòng ~60) còn `SETTINGS` là `const` ở dòng ~7600 — chạm vào là rơi vùng chết của const, và
`typeof` **không** cứu được (typeof trên const chưa khởi tạo vẫn ném). Đã dính đúng bẫy này, lỗi
báo ra lại là tên một hằng khác hẳn ở tận dưới.

**Vật cản phải đúng cỡ.** Trước đợt trụ đá: 84% khối trong `MAP_OBSTACLES` có cạnh ngắn >120px
(tường phải đi vòng), còn cây/đá thì 30-44px (sỏi). Ở giữa — cỡ trận đánh — trống trơn. Tệ hơn:
bộ lọc "chừa trống" ở `buildWorld()` quét sạch decor trong bán kính ≈160px quanh **mọi bãi quái**,
tức đúng chỗ đánh nhau thì đúng chỗ không có gì. Địa hình không thiếu, nó **bị dọn đi**.

**Luật đang có hiệu lực:**
1. Trụ đá đặt theo **HẠT cố định** từ tên map, không phải `Math.random` — bố cục một bãi phải
   giống nhau mọi lần vào, nếu không thì không ai học được địa hình, mà học được mới là chỗ địa
   hình có nghĩa. (Cây/đá vẫn ngẫu nhiên: chúng là trang trí, không phải bố cục.)
2. Khe giữa hai trụ ≥ `TRU_HO*0.8` ≈ 90px — lọt người, phải lách.
3. Vành ngoài quanh bãi là **CUNG ~200°**, không phải vòng tròn: bọc kín thì thành cái chuồng.
4. Lòng bãi quái phải trống (`bk*1.05`) — quái còn chỗ đứng, AUTO còn chỗ đánh.
5. Zoom nhân vào phép biến hình **ngay trước khi dời camera** (`ctx.scale` rồi `ctx.translate`)
   — mọi phép vẽ bên dưới giữ nguyên toạ độ thế giới, HUD nằm sau `ctx.restore()` nên không bị
   phóng theo. Đừng phóng bằng cách sửa `W`/`H`: HUD sẽ to theo.
6. Đổi zoom phải gọi `capNhatTamNhin()` **ngay**, không đợi khung sau — camera kẹp theo `VW/VH`,
   lệch một khung là giật một cái.
7. **Bài kiểm nào đổi toạ độ MÀN HÌNH ↔ THẾ GIỚI đều phải nhân zoom.** Đợt thêm zoom làm đỏ 4
   bài cùng một nguyên nhân, mà triệu chứng thì trông khác hẳn nhau: chuột phải lệch đích ·
   chiêu không rơi chỗ con trỏ · bấm minimap "chỉ đi được 30px" · ô đếm điểm ảnh trả về 0. Công
   thức đúng: `screen = (world − camera) × zoom`, rồi mới tới tỉ lệ bộ đệm/CSS nếu đọc pixel.
8. **Đừng chép cứng số đã có hàm.** `test_ngamchuot` chép `chanDy` = 13 (đúng hồi `NV_CAO` = 118);
   nay là 19 và bài trượt ngưỡng đúng 0,06px. Đọc thẳng từ game.
9. **Phản đòn ghi thẳng `m.hp`, KHÔNG qua `hurtMob`** (`player.reflect`, `Math.max(1, …)`).
   Bài kiểm nào đo "con này phải mất ĐÚNG 0 máu" mà để quái đứng trong tầm đánh của nó thì sẽ
   đỏ 1/3 lượt vì đúng một điểm máu của cơ chế khác. Tắt `player.reflect` trong phần dựng cảnh.
10. Ngưỡng trong `test_domap.js` phải **đo được**, không được đoán. (Bản đầu tôi đặt sàn "80% map
   đi được" theo cảm tính; số thật là 60,7% và nó bắt vạ 5/8 map.)

**Chưa làm, cố ý:** phóng to map (C2) và nối nhiều map nhỏ (C3) — xem `docs/KE_HOACH_DO_MAP.md`.
Phóng to cả 8 map là nhân bản lần nữa, chỉ khác là nhân bản chỗ trống.

### 🎭 VAI TRÒ QUÁI GÁN THEO **BÃI**, KHÔNG PHẢI THEO LOÀI

`MOB_ROLE` (loài → vai) là **lớp nền**, chỉ dùng cho quái không thuộc bãi nào. Bãi nào khai
`vai:'phap'` thì bãi đó thắng — xem `buildWorld` chỗ `pk.vai`.

Vì sao: vai theo loài là ngõ cụt. Ba map cuối chỉ có 3 loài, nên đo ra Bird Tribe Heights và
Dusk Marsh mỗi map đúng **2 vai** — `can` cộng Kẻ Tiếp Sức. Cả đoạn cấp 62-120 đánh y hệt
nhau. Vai theo bãi cho **3 loài × 6 vai = 18 hồ sơ** mà không tốn một tệp art nào.

Sau đợt gán: vai/map từ `3,3,3,4,2,4,2` lên `4,4,6,6,6,6,6` — **tăng dần**, không tụt.

- Vai đánh xa (`phap` 320 · `xa` 300) phải **đánh xa thật**: `spawnMob` bật `range`+`ranged`.
  Đổi con số mà không đổi cách đánh thì không sinh ra hồ sơ nào mới. Loài **vốn đã** đánh xa
  (Cung Thủ Tro Tàn) giữ nguyên tầm — nâng lên là âm thầm buff một con đã cân xong.
- Map cấp 1-24 **cố ý không có Pháp Sư**: đó là chỗ học cách chơi.
- Từ cấp 24 trở đi mỗi map phải có **≥1 bãi Pháp Sư và ≥1 Kẻ Tiếp Sức** — hai thứ AUTO xử lý
  dở nhất, cũng là lý do người chơi phải tự cầm chuột. `tests/test_bansac.js` gác.

### 🗺 BẢN SẮC MAP SUY RA TỪ DỮ LIỆU, KHÔNG CHÉP CỨNG

`mapBanSac(id)` tính **loài chủ đạo · hệ trội · Dòng Cốt độc quyền** từ chính `packs`, và
`banSacHtml()` hiện một dòng kiểu Ragnarok trên bảng Bản Đồ. Chép cứng thì sửa `packs` một lần
là bảng Bản Đồ nói dối — mà nói dối kiểu đó không ai phát hiện được.

**Cố ý KHÔNG làm `monRoi`** (món chỉ rơi ở map này) như đề xuất gốc: chính đề xuất đó cảnh báo
món độc quyền phải thật sự cần cho một thứ gì đó, không thì chỉ là "món rác mang tên đẹp".
Dựng bảy nền kinh tế mới cho bảy món là đúng cái bệnh nhân bản. Mỗi map **đã có sẵn** một thứ
độc quyền thật — một Dòng Cốt, có nơi tiêu thật (bốn ô Cốt của người chơi). Việc của A2 là **cho thấy**, không
phải **thêm**.

Đây cũng là chỗ chữa cho khắc hệ: `el:` chạy trong `hurtMob` (±20% / −12%) từ lâu nhưng người
chơi không có cách nào biết map nào hệ gì. Nay hệ trội nằm ngay trên bảng Bản Đồ.

### 📌 CHÍNH TUYẾN ĐÃ DỰNG LẠI · PHỤ TUYẾN CŨNG ĐÃ DỰNG XONG

> ⚠ Mục này **trước đây ghi cả hai bảng đều rỗng và chờ dựng lại**. Nửa đầu không còn đúng —
> giữ lại đúng cái tiêu đề này để cảnh báo, thay vì xoá trắng rồi để người sau đọc lịch sử git
> mà tưởng chuỗi vẫn rỗng. Cùng một kiểu bẫy đã ghi ở mục "~~Khắc Ấn~~".

| | Trạng thái |
|---|---|
| `QUESTS` | **ĐANG CHẠY** — 9 chương / 50 nhiệm vụ (thêm chương VIII · Người Thứ Bảy), canon Nhát Gọi. Xem mục "Cốt truyện (canon)" và `docs/LORE_RUNE.md` |
| `SIDE_QUESTS` | **ĐANG CHẠY** — **32 nhiệm vụ / 10 map**, phủ cấp 3→116. Trước là 9 mục chỉ trên ba map lối đi. |

**Vì sao chuỗi CŨ bị gỡ (ghi lại để đừng vá nó từ git):** lối chơi đã đổi quá nhiều so với lúc
viết — bỏ 7 phó bản, vai trò theo bãi, bản sắc map, zoom camera, cổng map bỏ `reqMain`. Rồi bản
dựng lại lần đầu (5 chương / 33 nhiệm vụ) lại **không nhắc canon một lần nào**: đếm trên toàn
khối ra 0 lần cho Trụ Khoá · Morvahn · Vaeldra · Tướng Quân. Hai mạch chạy song song không nối
vào nhau — đó là lý do có đợt gộp này.

**⚠ CHUỖI KHAI Ở MỘT NƠI, KHÔNG PHẢI HAI.** Trước đây `data/canbang.js` khai 10 mục rồi `game.js`
`QUESTS.push(...)` thêm 6 chương/25 mục nữa, nên rỗng bảng dữ liệu mà quên phần push thì
`QUESTS.length` vẫn ra 25 — đã mắc đúng lỗi đó. Nay **toàn bộ 46 mục nằm trong `data/canbang.js`**
và `game.js` không push nhiệm vụ chính nào. Giữ đúng nếp đó.

**Phụ tuyến — 32 mục / 10 map.** Bản đầu chỉ có 9 mục trên ba map LỐI ĐI (`loimon` · `trungnut`
· `caungam`), phủ đúng dải cấp 40→62. Nay phủ **cấp 3 → 116**: mỗi map đánh nhau có ba mục do NPC
của chính vùng đó giao. `Tầng Sâu` vẫn trống — nợ còn lại duy nhất.

| loại | số | | loại | số |
|---|---|---|---|---|
| `kill` | 10 | | `moc` | 6 |
| `collect` | 6 | | `tranai` | 2 |
| `talk` | 6 | | `chaos` | 2 |

- **Đánh nhau 12/32 = 38%**, và **mỗi map đúng MỘT mục `kill`**. Hai mục `tranai` không tính vào
  luật đó: hạ một con trùm là một trận một lần, không phải cày N con. `tests/test_phutuyen.js` gác.
- **Hai mục `tranai` tồn tại vì một lỗ có thật**: `loimon` và `caungam` cố ý không có chương chính
  tuyến (không phiến Rune nào cắm được ở một lối đi hay một nhịp đá không nền), nhưng Tướng Quân
  thì vẫn đứng đó — **hai con DUY NHẤT trong mười một con mà không nhiệm vụ nào trỏ tới**.
- ⚠ **`sl_cn1`/`sl_cn2` chính là `c4q4`/`c4q5` cũ**, kéo ra khỏi chính tuyến. Chương IV từng thu
  phiến gốc ở nhiệm vụ 3/5 rồi còn hai nhiệm vụ nữa trên `caungam` — tức chính tuyến ngồi trên
  đất phụ tuyến. Nay `tranai` là ô CUỐI ở cả bảy chương.
- ⚠ **`reqMain` là CHỈ SỐ (0-based), không phải số thứ tự.** Thêm/bớt một nhiệm vụ chính là mọi
  `reqMain` trượt. Để mốc thấp hơn chỗ cần một chút, đừng khoá sát.
- Trần **`SIDE_TRAN` = 5** mục cầm cùng lúc (trước là 3 chép cứng). Mỗi vùng có ba mục, nên trần 3
  nghĩa là nhận trọn một vùng rồi thì không cầm nổi mục nào của vùng khác.

#### ⚠ BA LỖI IM LẶNG CỦA BẢN 9-MỤC — đã vá, đừng dựng lại

Cả ba đều **không ném lỗi, không làm đỏ bài kiểm nào**, và cả ba đều là cùng một dạng: dữ liệu
khai một đằng, máy đọc một nẻo.

1. **Không mục nào khai `map:`** — mà bảng Nhật Ký lọc phụ tuyến bằng `SIDE_QUESTS.filter(sq =>
   sq.map === mapId)`. Tức tab Phụ Tuyến **trống trơn** suốt, dù có 9 nhiệm vụ đang chạy.
2. **`herbMap` là dữ liệu chết** — `sideOnEvent('collect')` chỉ gác map cho loại `catch`. Nhiệm vụ
   ghi "hái ở Lối Mòn" mà hái ở bãi thuốc ngoài cổng thành cũng đếm.
3. **Bốn map có sẵn `HERB_SPOTS` nhưng `herbs:false`** (`daohoa` `loimon` `trungnut` `caungam`) —
   toạ độ đã chấm từ lâu, chỉ thiếu đúng cái cờ, nên không bụi nào mọc ở chỗ nhiệm vụ chỉ tới.
   **Cờ và bảng toạ độ là HAI chỗ**: có bảng mà quên cờ thì không lỗi nào báo.

⇒ Bài kiểm mới **lái bằng hàm thật** (`acceptSide` · `tryHarvestHerb` · `sideOnKill` · `mocTick` ·
`turnInSide`) chứ không đọc bảng rồi tự kết luận: chỗ hỏng nằm ở sợi dây nối, không nằm ở bảng.

#### Máy phụ tuyến nhận thêm hai loại

- **`tranai`** — `sideOnKill` nay nhận cả ĐỐI TƯỢNG quái chứ không chỉ `m.type`, vì Trấn Ải của mọi
  vùng dựng động trong `spawnZoneBoss` nên không có khoá nào trong `MOBS` để so; phải đọc
  `def.bossKind`.
- **`moc`** — dùng CHUNG bảng `MOC_NV` với chính tuyến và đi qua ĐÚNG nhịp `mocTick(dt)`, không móc
  thêm chỗ nào. Đếm **từ trạng thái**, nên mục nào người chơi đã làm đủ từ trước là xong ngay lúc
  nhận — đó là chủ ý, xem mục `MOC_NV`.

#### 🌱 `daohoa` NAY CÓ NPC — trước đó là map đánh nhau DUY NHẤT không ai nói một câu

`uomluong` (Kẻ Coi Luống) ở `(200,200)`. Chỗ đứng **chấm bằng máy**, không đoán: đi được, trống
8 hướng, lề 108px tới mọi thứ phải tránh (bãi quái 340 · Vệ Binh 520 · Tướng Quân 760 · cổng 300 ·
điểm thả 260 · Rương Canh 260 · bụi thuốc 180), và cách điểm thả 368px nên người chơi đi ngang qua
chứ không phải đi tìm. Cả map chỉ có **41 điểm** thoả bộ ràng buộc đó — đừng dịch tay, quét lại.

### 🎁 THƯỞNG NHIỆM VỤ — MỘT cửa trao, MỘT cửa hiện

`traoThuong(rew)` (trao) và `rewMoTa(rew)` (hiện) dùng chung cho cả chính tuyến lẫn phụ tuyến.

⚠ **Hai lỗi có sẵn mà việc gộp này lộ ra:**
- `turnInSide` **không đọc `rew.item`** — mọi nhiệm vụ phụ khai thưởng vật phẩm sẽ im lặng nuốt mất
  món đó.
- Bốn chỗ in thưởng chỉ in `xp` và `silver`, nên **chín nhiệm vụ đã khai `rew.item` từ lâu vẫn hứa
  suông trên bảng**: người chơi nhận được món mà không chỗ nào nói trước là có. *Trao thưởng và
  HIỆN thưởng là hai việc — sửa một cái mà quên cái kia thì không lỗi nào báo.*

Bốn nhánh thưởng, **đều trỏ vào hệ đang chạy**, không đẻ tiền tệ mới: `item` (ô trang bị) ·
`cot` (Dòng Cốt độc quyền của vùng) · `ngoc` (ép thẳng vào đồ) · `gk` (vé quay Khế Ước). **Shard
CỐ Ý không có mặt** — nó chỉ tới từ mốc mỗi ngày và thông quan, cho nhiệm vụ nhả Shard là phá đúng
luật đó. Nay **24/50 chính tuyến + 9/32 phụ tuyến** có thưởng vật phẩm (trước: 9/50 + 0/32).

### ⏱ NHỊP CẤP — `XP_TABLE` NAY DẪN TỪ SỐ ĐO, KHÔNG TỪ CẢM GIÁC

Mốc chủ dự án chốt: **~3 giờ tới cấp 60**. Đo lại được, và **hai nửa của phép tính nằm ở hai tệp**
— bảng cấp trong `game.js`, XP nhiệm vụ trong `data/canbang.js`. ⚠ **Sửa một nửa là mốc nói dối
ngay mà không lỗi nào báo.** `tests/test_nhipcap.js` là thứ duy nhất bắt được chuyện đó.

| công cụ | việc |
|---|---|
| `tools/do_nhipcap.cjs` | ĐO XP/giờ thật trong chính vòng chơi (đặt cấp, mặc đồ đúng cấp, bật AUTO, tick `update`) |
| `tools/can_exp.cjs` | từ số đo dẫn ra `XP_TABLE` + XP của cả 82 nhiệm vụ |

```
cd public/game && python3 -m http.server 8853
NODE_PATH=/opt/node22/lib/node_modules node tools/do_nhipcap.cjs --giay 150 --lap 3 --json do.json
node tools/can_exp.cjs do.json --tile 8 --gio60 2.94 --gio120 29.5 --tile120 7 --nvDau 30 --nvCuoi 6 --ghi
```

**Trước / sau:**

| | cũ | mới |
|---|---|---|
| tới cấp 60 | 4,36 giờ | **3,00 giờ** (làm hết NV) · 3,60 (bỏ hết) |
| tới cấp 120 | 29,9 giờ | 33,4 giờ |
| dốc nhất giữa hai cấp | **×9,8 ở mốc 60** (253.269 → 2.472.993) | ×1,39 |
| nhiệm vụ gánh tới cấp 60 | 9,1% | 15,0% |
| nhiệm vụ cấp 100 thưởng | 140.000 = **2,5% một cấp** | 887.643 = 12% một cấp |

**Ba thứ quyết định hình dạng — đọc trước khi chạm vào một con số nào:**

1. **XP/giờ đo được khớp đúng luật luỹ thừa `rate(l) = 1694 · l^1,945`** — gần đúng lv², hợp với
   việc XP mỗi con ≈ 0,8-1,1 × lv² trên cả 29 loài.
2. **Ngân sách THỜI GIAN mỗi cấp** tăng theo cấp số nhân (cấp 59 tốn gấp 8 lần cấp 1).
3. **Nhiệm vụ gánh 30% một cấp ở cấp 1, nhạt dần còn 6% ở cấp 120.** Tỉ lệ PHẲNG thì hoặc cấp 1
   thưởng 1 EXP (đọc như nhiệm vụ hỏng), hoặc cấp 120 nhiệm vụ gánh hộ quá nhiều. Đây chính là
   thứ trả lời "càng về sau càng phải cày".

⚠ **`XP_TABLE` đặt theo CÀY THUẦN rồi chia cho (1 − phần nhiệm vụ)**, KHÔNG phải `= cày + nhiệm
vụ`. Đã thử cách sau: cấp nào có nhiệm vụ rơi vào thì **99% là quà** (đo ở cấp 1), và ai bỏ qua
chuỗi thì kẹt cứng.

⚠ **ĐỪNG lấy `max(đường khớp, số đo)`.** Số đo có đỉnh do bốc trúng bộ đồ ngon — cấp 45 đo 7,67
triệu/giờ còn cấp 50 chỉ 5,13 — nên `max` đẻ ra bảng **không tăng dần**. Và lấy thẳng số đo ở chỗ
HỤT thì biến hố nội dung thành "cấp rẻ bất thường", tức giấu lỗi thay vì chữa.

⚠ **Tính giờ THEO TỪNG CẤP**, đừng lấy tổng rồi nhân tỉ lệ nhiệm vụ trung bình: XP nhiệm vụ rơi
thành CỤC ở vài cấp lẻ. Phép xấp xỉ trung bình báo 3,00 giờ trong khi tính đúng ra **3,60**.

⚠ **`XP60PLUS_ANCHORS` và `xp60PlusHourlyRate` ĐÃ GỠ.** Chú thích của chúng ghi là đo "không trang
bị" — đo lại kiểu đó thì từ cấp 10 trở lên nhân vật **CHẾT trước khi giết được con nào** (atk 35 vs
quái 1.052 máu), tức mốc cũ không thể sinh ra từ phép đo mà nó tự mô tả.

#### 🕳 BỐN HỐ XP CÒN LẠI — nợ NỘI DUNG, cố ý không nướng vào bảng cấp

Số đo thấp hơn đường khớp >55% ở **cấp 5 · 35 · 55 · 70 · 119** — tất cả đều ở NÓC một dải map.
Nguyên nhân đã truy ra, và nó không nằm ở XP:

- **AUTO cắm chốt đúng MỘT bãi mỗi map và không bao giờ lên bãi cao hơn.** Đo được: cấp 55 đứng
  trên `comoc` vẫn cày `thinu` (cấp 42, 1.440 XP) trong khi `huyetbat` (cấp 56, 2.465 XP) nằm đó
  không ai đụng. Cấp 35 trên `chungnam` vẫn cày `chimera_bo` (cấp 24).
- **Chênh trang bị ngẫu nhiên bị khuếch đại bởi giáp trừ thẳng.** Cùng cấp 50, cùng map, cùng loài:
  atk 100 → **30 mạng**/2 phút, atk 120 → **96 mạng**. Chênh 18% công ra chênh 3,2 lần tốc độ.

Cả hai là việc riêng, không phải việc của bảng XP. `tools/can_exp.cjs` in danh sách hố ở cuối mỗi
lượt chạy — đó là danh sách việc, không phải nhiễu đo.

### ☀ TẦNG NGÀY THEO DẢI CẤP (`DAILY_BANDS`)

Đo được: chuỗi nhiệm vụ cho **1% tổng XP** lên cấp 120 — tức 99% hành trình là cày. Nên tầng
NGÀY là thứ **duy nhất** chạm vào mọi ngày chơi ở 70 cấp cuối. Mà bản cũ là **ba mục cố định**
(`Hạ 10 Chimera` · `Rèn 1 lần` · `Hạ 1 Trùm Vùng`) với `minLv` 1/5/12 — từ cấp 12 tới 120,
**108 cấp**, người chơi mở bảng ra thấy đúng ba dòng đó, cùng con số đó.

Nay 7 dải, **dùng lại đúng khuôn `TRUYNA_BANDS`** — đừng dựng khuôn dải thứ hai, hai bảng cùng
ý nghĩa là bảo đảm chúng lệch nhau sau vài đợt sửa. Từ 1 mục / thưởng ×1 lên 5 mục / thưởng ×13
(300 → 3.900 Lumen · 100 → 1.300 Bản Năng · 2 → 6 Shard).

- ⚠ **CHỈ THÊM MỤC TIÊU NÀO ĐÃ CÓ NHỊP NGÀY SẴN.** `via` (Vỉa Cốt) và `truyna` (Truy Nã Lệnh)
  vốn đã là nội dung ngày — đưa vào đây là **cho thấy** thứ đã có. Dựng một hệ lặp thứ tư cạnh
  Truy Nã + Vỉa + ba sự kiện theo giờ thật là đúng bệnh nhân bản ở đầu tài liệu này.
- ⚠ **MỖI khoá phải có một chỗ gọi `dailyTrack()`.** Thiếu một chỗ móc là mục đó đứng 0 vĩnh
  viễn, và vì thưởng đòi xong **HẾT** nên nó khoá luôn thưởng ngày — im lặng, không lỗi nào.
- ⚠ **`dailyReset()` dựng khuôn TỪ `DAILY_META`**, không viết tay từng khoá. Thêm mục mà quên
  thêm ngăn thì `d[g.id]` là `undefined` và `||0` che mất. Save cũ cũng được vá mà giữ tiến độ.

Bài kiểm: `tests/test_muctieu.js` — lái từng mục tới đích bằng **chính hàm của game**
(`viaKhai()` / `truynaClaim()` thật, không chỉ gọi `dailyTrack`), vì đó là thứ bắt được chỗ móc
thiếu.

### ☠ CHƯƠNG VIII · NGƯỜI THỨ BẢY — và trùm nhiệm vụ nay THEO MAP

DRUE được nhắc **2/46** nhiệm vụ, cả hai chỉ là một câu tả cảnh trong mô tả boss vùng — kẻ thù
chính của canon chưa bao giờ bị đối đầu. Chương VIII (4 nhiệm vụ, cấp 116-120) trả nốt chỗ đó.

- ⚠ **KHÔNG phải Rune thứ tám.** `RUNE_TONG` = 7 khớp cứng với số nấc `#fx-crack[data-tru="N"]`
  trong `style.css`; thêm phiến thứ tám là lớp vết nứt tụt về 0 ở nấc cuối mà không báo gì.
  DRUE cũng **không phải Trấn Ải** — mỗi map đúng một con, `TRAN_AI_TONG` suy từ `BOSS_DEFS`.
- ⚠ **Kết Mở vẫn ở `c7q6`, không dời.** Chương VIII là thứ xảy ra SAU cái kết mở đó. `showKetDrue()`
  cố ý không phải màn "ngươi đã thắng": đèn vẫn tắt, vì bảy phiến vẫn trong lò.
- Chỗ đặt **quét bằng máy**: Dusk Marsh đã bão hoà (cả map chỉ còn 3 điểm hợp lệ, lề 2-15px).
  Trũng Nứt có 2100 điểm, lấy điểm lề lớn nhất 1320px. Mép TRÊN map là đúng canon — Nhát Gọi là
  vết cắt trên **trời**, Trũng Nứt là đất ngay dưới nó.
- `MOBS.drue` vẽ bằng khung xương `fiend`, **không thêm tệp ảnh nào**.

**Trùm nhiệm vụ nay theo map**: `BOSS_ARENAS` · `bossMobKey(md)` · `questBossIdx(mid)`;
`md.boss` là `true` (tương thích, ⇒ `MOBS.boss`) hoặc một khoá trong `MOBS`.

⚠ **Guard là `questIdx === questBossIdx(map)`, KHÔNG phải `>= idx && !victory`.** `victory` là
cờ **toàn cục**: nó bật ở `c0q8` — **cấp 12** — rồi chặn vĩnh viễn con thứ hai ở cấp 120. Tức
DRUE không bao giờ hiện với người chơi đi đường tự nhiên, và không lỗi nào báo. So sánh bằng thì
tự đúng cho mọi map và tự tắt khi nhiệm vụ trôi qua.

⚠ **`showVictory()` chép cứng "Thủ Lĩnh Gloam đã bại"** — câu của trùm cấp 12. Chỉ con ở
`corran` được gọi nó.

⚠ **BÀI KIỂM PHẢI ĐI ĐƯỜNG TỰ NHIÊN.** Bài đầu của tôi nhảy thẳng `questIdx` tới chương VIII rồi
đo — xanh, và bỏ sót đúng lỗi `victory` ở trên. `test_nhiemvu §9` nay bắt buộc hạ trùm chương 0
trước. *Bài kiểm nhảy cóc qua đoạn đầu game sẽ không bao giờ thấy cờ nào bật ở đoạn đầu game.*

### 📍 LOẠI NHIỆM VỤ `moc` — cửa cơ chế phải có người GÁC, không phải một câu nhắc

Đo được: chuỗi 46 nhiệm vụ có **70% là đánh quái**, và toàn bộ phần còn lại thì `enhance` gánh 7
chỗ — cùng MỘT nhiệm vụ "đập một món lên +N", khác đúng con số (`+3 +5 +6 +7 +9 +11 +11`, hai cái
cuối trùng). Đúng bệnh nhân bản mà mục chẩn đoán ở đầu tài liệu này nói tới.

⚠ **Và luật ở `docs/LORE_RUNE.md §6` mà chính tôi viết thì viết SAI:** *"không quá 60% là `kill`"*
— đếm đúng chữ `kill` ra 41% và luật PASS, trong khi chuỗi thật 70% là đánh (`tpkill` · `boss` ·
`tranai` cũng là đi giết, mà `tranai` còn là loại thêm SAU khi viết luật). **Một luật đếm hẹp hơn
ý định của nó thì tệ hơn không có luật: nó xanh và nó bảo đảm sai.** Luật đã sửa: đếm mọi loại
đánh, ≤60% toàn chuỗi và ≤70% mỗi chương. Số đo nay: **54% · cao nhất 67%**.

`MOC_NV` + `type:'moc'` là thứ kéo tỉ lệ xuống mà không phải thêm một `enhance` thứ tám:

- **MỘT loại, không năm loại.** Năm cửa cần gác (Vỉa Cốt · Rương Canh · Box Kundun · Khế Ước ·
  Đại Thành) đều cùng một hình dạng — "đã làm việc đó mấy lần rồi". Năm `type` là năm nhánh trong
  `killMob`, năm nhánh trong `questTarget`, năm nhánh trong bảng hiện tiến độ.
- ⚠ **`dem()` đếm từ TRẠNG THÁI, không từ sự kiện.** Móc vào chỗ "vừa mở rương" thì người chơi mở
  rương TRƯỚC khi nhận nhiệm vụ là nhiệm vụ **không bao giờ xong**, và họ không có cách nào biết
  vì sao. Đếm từ trạng thái thì nhận xong là nó đã đủ luôn — đúng như một nhiệm vụ "hãy chạm vào
  hệ thống này" nên hành xử.
- ⚠ **Nhịp kiểm ở `mocTick(dt)` trong `update()`, không móc vào sáu chỗ.** Mỗi chỗ móc thiếu là
  một nhiệm vụ không bao giờ xong.
- ⚠ **`player.hapMo` đếm ở `throwBaoHap`, KHÔNG ở `openBaoHap`.** Kéo-thả hạp ra màn hình — đường
  mà chính bảng Túi Đồ khuyên dùng — đi thẳng qua `throwBaoHap`. Móc ở `openBaoHap` là người chơi
  làm đúng lời khuyên thì nhiệm vụ không đếm.
- **§6 hứa một cửa "Tinh Luyện" — hứa sai:** đó là một NÚT trong bảng Đại Thành (`sr_tinhluyen`),
  không có hành động nào đếm được. Cửa đó đổi sang **Đại Thành**.

**Đã đổi theo:**
- `reqMain` gỡ khỏi **mọi** map. Map mở khoá bằng **cấp** (`md.min`) là đủ. Nhánh đọc `md.reqMain`
  trong `mapGate()` vẫn còn — cắm lại một giá trị là khoá sống lại. *Cân nhắc kỹ: khoá map sau
  một nhiệm vụ nghĩa là nhiệm vụ hỏng thì map mất.*
- ⚠ **Vòng lọc `MAPS[id].reqMain === questIdx` trong `turnInQuest()` đã GỠ.** `reqMain` không còn
  ở map nào nên mảng đó luôn rỗng, và hệ quả là **8/9 câu `REGION_UNLOCK_LORE` là nội dung chết**
  — kể cả bốn câu giới thiệu phiến Rune. Nay `travelTo()` bắn chúng theo **lần đầu đặt chân**
  (`!player.wpUnlocked[mapId]`, đọc TRƯỚC khi đặt cờ).
- ⚠ **Mốc trùm chương suy từ dữ liệu, không chép cứng.** Ba chỗ từng viết thẳng `questIdx >= 9`
  ("nhiệm vụ thứ 10") kèm một chú thích đã lạc ("boss Đào Hoa" — con đó nay ở Rẻo Rừng Corran).
  Nay là `QUEST_BOSS_IDX = QUESTS.findIndex(q => q.type === 'boss')`, fallback `Infinity` chứ
  không phải `-1` (vì `questIdx >= -1` là luôn đúng ⇒ trùm hiện ra từ cấp 1).

### 🧭 NỐI MAP BẰNG RÌA (B1) + ĐIỂM DỊCH CHUYỂN MỞ BẰNG ĐI BỘ (B2)

**⚠ Đây trước hết là một BẢN VÁ LỖI.** Trước bản này, **Bug Tribe Tunnels (40) · Reptile Sunstone Flats (80) ·
Dusk Marsh (100) không có lối vào nào** cho một nhân vật mới:
- `GATES` chỉ có bốn cổng thành + cổng Outskirts về thành ⇒ đi bộ chỉ tới được 5/8 vùng;
- nút **Dịch Chuyển** chỉ hiện khi `player.wpUnlocked[id]`, mà cờ đó chỉ bật **khi đã tới** map
  đó. Chưa tới được thì không bao giờ mở. Ba vùng cuối là **nội dung chết**.

**⚠ BÀI HỌC VỀ CÁCH ĐO — tôi đã kết luận nhầm đúng lỗi này một lần.** Gọi `travelTo('mongco')`
từ console thì chạy ngon, vì nó là hàm, không qua cửa nào. Phải lan theo **đường người chơi**:
chỉ đi qua `GATES`, và chỉ dịch chuyển tới nơi `wpUnlocked`. `test_noimap.js` §1 đo đúng kiểu đó.

**⚠ HÌNH HỌC DO TRÙM VÙNG QUYẾT ĐỊNH, KHÔNG DO LA BÀN.** Luật có sẵn (`test_bossplace`): mọi
**điểm thả** phải cách Trùm Vùng ≥700px (260 truy đuổi + lề). Quét cả bốn rìa từng vùng theo
đúng luật đó thì **Bird Tribe Heights không còn chỗ nào trên cả bốn rìa** — bốn con trùm phủ kín.
Nên chuỗi đi **vòng qua** Bird Tribe Heights, và Bird Tribe Heights vẫn vào thẳng bằng cổng Bắc của thành:

`Werebear Woods(20) ─Bắc→ Bug Tribe Tunnels(40) ─Bắc→ Reptile Sunstone Flats(80) ─Đông→ Dusk Marsh(100)`

Tên lối ghi **hướng trên chính map đang đứng** (đi ra hướng nào), nên luôn đúng với thứ người
chơi thấy và không hứa gì về vị trí tương đối giữa hai map. Đi qua lối rìa thì hiện ra **ngay
cạnh cổng về** (`spawnFrom` trong `data/canbang.js`) — quay đầu là đi ngược lại được ngay.

⚠ Khi thêm lối rìa mới: **quét bằng máy, đừng đoán toạ độ.** Ràng buộc là cổng *và* điểm tới đều
phải đi được, cách bãi quái / Rương Canh / NPC / điểm thả, và cách Trùm Vùng ≥720px.

**Cũng vá luôn:** ba cổng thành Bắc/Tây/Đông **vốn là một chiều** — sang Plant Tribe Glade /
Werebear Woods / Bird Tribe Heights rồi không có cổng nào về. Nay đủ đường về, đặt cạnh chính điểm thả.

**B2:** cờ `wpUnlocked` đã tự bật khi tới map từ trước, nhưng **lời gợi ý nói sai** — nó bảo
"cần được nhiệm vụ dẫn tới đó", trong khi nhiệm vụ đã gỡ sạch. Nay nói đúng: **tự đi bộ tới một
lần là mở**. Bảng Bản Đồ thêm dòng `🧭 Đi bộ:` cho từng vùng, **suy thẳng từ `GATES`** qua
`langGieng()` — đừng chép cứng một bảng láng giềng thứ hai, nó sẽ nói dối ngay lần đầu ai đó
thêm cổng mà quên sửa.

### 🎥 Camera mặc định là **xa** (`zoom:'xa'`, 1,0×)

Chủ dự án chốt sau khi chơi thử: vào game phải thấy rộng. Trước đó để `'vua'` (1,45×). Đổi ở
**hai** chỗ, thiếu một là lệch nhau: `let ZOOM_CHON = 'xa'` (giá trị trước khi `SETTINGS` khai)
và `zoom:'xa'` trong `SETTINGS`. Người chơi vẫn đổi được ở Cài Đặt và lựa chọn đó được lưu.

### ⛰ TRỤ ĐÁ ĐÃ GỠ — và địa hình cỡ trận đánh đang là VIỆC CÒN NỢ

Từng có `raiTruDa()` dựng vành đá quanh mỗi bãi quái và rào ngắn giữa hai bãi, để có thứ mà kite.
**Ý định đúng, thực thi sai:** nó không có tranh riêng mà dùng lại chính sprite đá trang trí rồi
**phóng to ~3 lần** (`s ≈ 3,1` so với `0,6–1,4`). Phóng to một sprite lên ba lần thì ra khối hộp
bẹt viền cứng, chọi hẳn với nền tranh sáng của Axie. Chủ dự án nhìn ảnh chụp và yêu cầu gỡ.

**Cái giá, đo được, không giấu — nhưng cũng đừng nói quá:** vật che trung bình 44,8% → **30,0%**,
tức phần lớn map vẫn còn địa hình. Thiệt hại dồn vào **một** chỗ: Reptile Sunstone Flats (map trống nhất,
90,9% đi được) tụt còn **9%**, và Bug Tribe Tunnels từ ≥4 tuyến phải đi vòng còn **1/66**.
Vì vậy `SAN_CHE` trong `test_domap.js` hạ 18 → **8** và ngưỡng `phaiVong` trong
`test_obstacles.js` hạ 2 → **1**. Cả hai là **bánh cóc tạm**, có ghi chú tại chỗ. Khi có tranh
khối đá thật thì kéo lại và xoá ghi chú.

**⚠ ĐỪNG DỰNG LẠI BẰNG CÁCH PHÓNG TO SPRITE.** Đây là lần thứ hai cùng một bài học: trước đó đã
chữa vấn đề bố cục bằng lớp phủ tối và cũng phải gỡ. *Đừng chữa vấn đề thị giác bằng cách kéo
giãn hoặc đè màu lên tài nguyên có sẵn — phải có tranh đúng cho việc đó.*

### ▦ MIỀN DÂN SỐ (A4) — `md.packs` nay là KẾT QUẢ, không phải nguồn

Đây là một cuộc **thay móng**, đọc kỹ trước khi chạm vào bãi quái.

Dữ liệu map không còn `packs: [{x,y,n}…]`. Nó khai **`vung`**: mỗi miền là một **dải khoảng
cách** (`dai`, tỉ lệ của `voi`) × một **cung góc** (`cung`, độ) quanh điểm thả, mang một dân số.
`banRaiVung()` bung nó thành các cụm trại.

**Vì sao mô hình này chứ không phải hộp toạ độ:** đo trước khi làm thì cả bảy map ngoài trời
VỐN ĐÃ là một gradient theo khoảng cách — cấp quái tăng đơn điệu theo `d(spawn)` ở cả 7/7 map,
và góc rải rất hẹp vì điểm thả nằm ở góc/mép. Cái đó trước nay chỉ nằm trong đầu người đặt toạ
độ và trong một dòng chú thích. A4 đưa nó thành dữ liệu.

**⚠ CÁC DẢI `dai` KHÔNG ĐƯỢC CHỒNG NHAU.** Vị trí cụm = `t × voi` nên dải không chồng ⇒ thứ tự
cấp theo khoảng cách là **đảm bảo tuyệt đối**. Bản đầu tôi để chúng chồng nhau và gradient hỏng
ngay: `daohoa` sinh ra một cụm C6 đứng gần hơn một cụm C4 đúng 1px. `test_vung.js §2` khoá lại.

**⚠ Cụm phải TRÁNH Trùm Vùng.** Trùm là điểm cố định (toạ độ tỉ lệ trong `BOSS_DEFS`) và đã có
hẳn một đợt việc riêng để dời chúng ra khỏi bãi quái. Cụm sinh ra SAU nên chính cụm phải tránh —
quên một lần là 13 con trùm nằm đè lên tâm bãi trở lại (`test_bossplace` bắt được).

**⚠ Đọc bãi quái của map nào cũng phải qua `packsOf(id)` / `packsMd(md)`.** Đọc thẳng
`md.packs` của map chưa ai vào thì nó còn `undefined` và `.map(...)` ném lỗi — đã dẫm đúng bẫy
này với ba bài kiểm. Đã bịt ở gốc bằng `bungMoiVung()` gọi trong `startGame`, nhưng vẫn dùng
`packsOf` cho đúng.

**Bố cục CỐ ĐỊNH, hạt bốc từ TÊN MAP.** Thế giới này chỉ nên có **đúng một** bộ phận biết đi:
Vỉa Cốt. Rương Canh đứng yên để học thuộc được, trại quái cũng vậy — cho trại chạy mỗi ngày là
vừa phá mốc định hướng vừa làm Vỉa Cốt hết đặc biệt.

Được thêm: cụm to nhỏ khác nhau (dân số chia lệch, không đều tăm tắp), một miền mang **nhiều
vai** (cùng loài, cụm này Xạ Thủ cụm kia Pháp Sư — đúng cơ chế A1), và bảng **Chọn Trận** gom
theo miền thay vì một danh sách phẳng. QA: `window.debugVung(map)`.

### ◆ VỈA CỐT (B3.3) — thứ đầu tiên trong game buộc phải ĐI TỚI một toạ độ

`viaHomNay()` bốc **ba** trong bảy vùng có Dòng, mỗi vùng **một điểm**, hạt từ chính chuỗi
`new Date().toDateString()`. Không lưu vị trí ở đâu cả — tải lại trang, đổi máy, đổi nhân vật
đều ra đúng một tấm bản đồ; qua nửa đêm là ba nơi hoàn toàn khác.

**Ba điều là cả thiết kế, đừng "tối ưu" mất cái nào:**
1. **Cách bãi quái ≥ 320px** (`VIA_CACH_BAI`). Vỉa mọc cạnh bãi là AUTO nhặt được, và ta lại
   quay về đúng cái vòng "chốt một bãi, không bao giờ rời". Đây là lý do vỉa tồn tại.
2. **Đổi TOẠ ĐỘ, không chỉ đổi map.** Hung Thần và Xâm Lăng Vàng đã đổi map theo giờ từ lâu —
   nhưng "về đúng bãi cũ ở map khác" thì vẫn là bãi cũ. Toạ độ mới là chỗ AUTO không lên lịch
   cứng được.
3. **Một lần / ngày / vùng / nhân vật** (`player.via = { day, <map>:1 }`). Một mỏ hồi theo phút
   là một bãi cày, không phải một chuyến đi.

Điểm bốc **chỉ từ dữ liệu tĩnh** (`obstaclesOf` + packs + cổng + điểm thả), nên bảng Bản Đồ và
danh sách sự kiện nói đúng chỗ vỉa của cả bảy vùng mà không phải nạp map. Cây/đá là decor bốc
lại mỗi lần vào map nên chúng bị chừa trống ở `buildWorld` (`_keep`), không xử ở khâu bốc điểm.

Ba cửa chỉ đường, thiếu một là người chơi không biết đi đâu: chấm kim cương trên **bản đồ nhỏ**,
dòng riêng cho **từng vỉa** trong danh sách sự kiện (mỗi cái một CHỖ nên không gộp được), và một
dòng trên hàng map trong bảng **Bản Đồ**. QA: `/via` · `/via ds` · `window.debugVia(map)`.

### ▣ RƯƠNG CANH (B3.1) — hòm có người giữ, mở MỘT lần trong đời

Vỉa Cốt cho thế giới lý do đi tới **mỗi ngày**. Rương Canh cho nó lý do đi tới **một lần**. Hai
việc khác nhau, **đừng gộp** — và bài kiểm `test_ruong.js` §2 khoá đúng chỗ tách đó: rương phải
đứng yên qua nhiều ngày, vỉa phải đổi.

- Vị trí bốc từ **tên map** (`_bamChuoi('ruong:' + mid)`), không từ ngày ⇒ **không bao giờ đổi
  chỗ**. Đi qua một lần là nhớ, và cái nhớ đó là thứ biến 2600×1900 pixel thành một nơi chốn.
- 4 rương / vùng có bãi quái (7 vùng, kể cả Outskirts). ⚠ **Đừng thêm điều kiện `type:'safe'`** —
  Outskirts khai `safe` (không PK) nhưng vẫn là bãi săn 8 bãi; chặn nó là vùng đông người nhất
  mất sạch rương. Cửa duy nhất đúng là **có bãi quái**.
- Mỗi rương một **trại canh 4 con, 4 vai** (`nang·can·xa·phap`, dùng lại A1). Trại còn sống thì
  rương **khoá**. Trại **cố ý không có Kẻ Tiếp Sức**: nó phải chết được trong một lần đánh để mở
  rương, không phải một bãi cày hồi máu lẫn nhau.
- Rương **đã mở thì trại tan hẳn** và không dựng lại — nếu không, map đã vét sạch rương vẫn gánh
  16 con quái thừa mãi mãi.

**⚠ ĐỀ XUẤT CŨ GHI "hồi 20-40 phút" — KHÔNG LÀM THẾ.** Hòm hồi theo phút là bãi cày có thêm hoạt
ảnh: AUTO đứng cạnh nó là xong. Rương ở đây mở **một lần vĩnh viễn cho mỗi nhân vật**
(`player.ruong['<map>:<i>']`). Phần **lặp lại** của thế giới đã có Vỉa Cốt lo.

Đây là viên gạch mà **A4** (miền dân số canh một vật thể) và **B1** (dọc đường có thứ đáng dừng)
đều dựa vào: khái niệm *vật thể thế giới CÓ NGƯỜI CANH* được dựng ở đây.

⚠ Trại canh mang `m.pack = 'ruong:<id>'`. Bài kiểm nào gom quái theo `m.pack` để đo **bãi quái**
phải **bỏ tiền tố `ruong:`** — `test_bayquai` và `test_dibien` đã sửa; bài mới cũng phải nhớ.
QA: `/ruong` · `/ruong ds` · `window.debugRuong()`.

### Bốn tài liệu thiết kế — đọc theo thứ tự này
1. `docs/CAU_TRUC_MAP.md` — đo map hiện tại, đối chiếu Ragnarok / Path of Exile
2. `docs/DE_XUAT_MAP.md` — 10 hạng mục / 4 đợt, có C1 (từ khoá phòng) + C2 (máy sinh)
3. `docs/NHIP_CAP_1_120.md` — nhịp cấp, chỗ 99 cấp trống
4. `docs/BOSS_TO_DOI.md` — boss là nội dung TỔ ĐỘI, và boss phải mang bản sắc Axie

## Tên trang bị đi theo CHẤT LIỆU

`ITEM_NAMES[slot][rarity]` — 5 tên mỗi ô, leo theo chất liệu như đồ MU: **da → sắt → thép →
vảy rồng → hắc nguyệt**. Bộ tên cũ mượn thẳng binh khí kiếm hiệp (Huyền Thiết Trọng Kiếm,
Lăng Ba Hài, Chí Tôn Long Giáp, Thiên Tôn Miện…) — vi phạm Quy tắc số 1. Tên mới phải là
danh từ trang bị thuần, đừng mượn tên chiêu thức hay bảo vật tiểu thuyết.

## Cốt truyện (canon) — **NHÁT GỌI · BẢY RUNE CỔ**

> Canon đầy đủ, kèm hợp đồng thi công: **`docs/LORE_RUNE.md`**.
> Mạch cũ (**Morvahn · Năm Trụ Khoá · Vaeldra trút tận thế lên nhà người khác**) đã BỎ HẲN —
> chủ dự án chốt 2026-09-11. Đừng dựng lại từ git: không một danh từ riêng nào của nó còn dùng.
> Hai tài liệu nhiệm vụ cũ (`docs/LORE_AXIE_VA_NHIEM_VU.md` §5, `docs/THIET_KE_NHIEM_VU.md`)
> cũng lỗi thời ở TÊN MAP và spine — chỉ còn §2-3 của tài liệu đầu (khảo sát lore Axie có nguồn)
> là dùng được.

**Rune** là nghề của Bug axie: khắc lên **đá**. Một phiến Rune dựng ở một nơi thì **giữ một cái
luật** ở nơi đó. Giáo lý là **Nếp Khắc Vừa**: khắc vừa đúng cái phiến đá gánh nổi, và đừng bao
giờ khắc một cái luật phải giữ mãi mãi.

**Bảy Rune Cổ** cắm khắp Lunacia, mỗi vùng một phiến. Chimera áp biên không phá nổi Rune nhưng
**mài** nó; bảy trăm năm thì đá mỏng, mà người biết khắc sâu thì hết. Nên **Sylas** (NPC đã có ở
Bug Tribe Tunnels) làm đúng cái việc giáo lý cấm: khắc một Rune **lên trời** để xin một người thợ
biết làm Rune bền hơn đá. Nhát cắt đó là **NHÁT GỌI**, và thứ đi qua nó là nguyên khu phố
**Ardhaven** của **Vaeldra** — đá lát, lò rèn, và bảy người lính.

⇒ Canon này *giải thích trong truyện* ba thứ vốn khập khiễng, **bằng chính cơ chế đã có**:

| Thứ cần giải thích | Canon nói |
|---|---|
| Vì sao nhân vật là **Dark Knight / Dark Wizard** giữa thế giới Axie | **Lunacia gọi ngươi tới** — không phải ngươi sang xâm chiếm, cũng không phải sang sửa lỗi của mình |
| Vì sao **Ardhaven** là phố đá phương Tây có lò rèn | **cái lò CHÍNH LÀ thứ Lunacia cầu**; thành là câu trả lời, không phải đống đổ nát |
| Vì sao **mất ký ức** rồi võ nghệ trở lại theo cấp | **Rune đòi trả bằng thứ nó dịch chuyển**; nghề khắc sâu hơn ký ức nên nghề quay lại |
| Vì sao đập trang bị lên **+N** lại quan trọng | **Vaeldra khắc Rune vào THÉP** — mỗi lần rèn là một lần khắc |

**Chimera KHÔNG đổi định nghĩa**: lore Axie chính thức nói chimera sinh ra từ dạng tha hoá của
thần **Atia**. Đừng chạm vào đó — đúng lý do mà hệ bạn đồng hành đã phải đổi tên sang **Ragoon**
(xem chú thích đầu `CHIMERA` trong `canbang.js`). Việc của kẻ thù chỉ là làm bảy cái luật hỏng
nhanh hơn Chimera làm.

**Kẻ thù: DRUE — người thứ bảy.** Hắn qua Nhát Gọi cùng ngươi và giữ được ký ức, vì hắn trả bằng
ký ức của người khác. Hắn không khắc vào đá, không khắc vào thép: **hắn khắc vào chính mình**.
Manh mối `td_trong` (*"cái tên thứ bảy chưa bị gạch, vì chưa ai chứng minh được là nó nên bị
gạch"*) là mũi nhọn của cả chuỗi; `manh_lenh` (*"một con mắt không có tròng"*) là dấu của hắn.

**Bi kịch trung tâm — giữ nguyên HÌNH DẠNG của mạch cũ, đổi hẳn nội dung:** thu Rune về lò thì
Rune bền thêm nghìn năm, **nhưng trong lúc phiến đá nằm trong lò, cái luật nó giữ thì TRỐNG**.
Phiến thứ bảy (**Rune Giữ Đường**) là thứ thắp đường cho hồn quay về Cây Hồn — nên nhiệm vụ cuối
của chuỗi vừa đóng chính tuyến vừa bật Kết Mở. Danh hiệu: **Kẻ Gỡ Rune Cuối**.

Và **chương 0 đóng lại ở đó**: đèn dẫn hồn tắt khắp Rẻo Rừng Corran là đầu xa của phiến thứ bảy.
`c0q2` đã viết đúng câu cần thiết — *"Ba đêm liền, mà **dầu vẫn còn đầy**"*. Đèn tắt không vì hết
dầu; nét khắc bị lấy đi.

### Bảy phiến — mỗi vùng một, đếm được

| Vùng | Rune Cổ | Luật nó giữ | Dòng Cốt (đã có) |
|---|---|---|---|
| Beast Herd Camp | Rune Giữ Đàn | đàn không tan khi hoảng | Đồng Cỏ |
| Werebear Woods | Rune Giữ Bờ | rừng không lấn qua bờ | Rễ Gai |
| Plant Tribe Glade | Rune Giữ Mùa | luống ấp nở đúng mùa | Cánh Hoa |
| Bug Tribe Tunnels | Rune Giữ Tên | axie vừa nở được nhận tên (**phiến GỐC**) | Vỏ Trứng |
| Bird Tribe Heights | Rune Giữ Khúc | khúc hát không tắt theo người hát | Băng Vụn |
| Reptile Sunstone Flats | Rune Giữ Lửa | lò không nguội qua đêm | Tro Tàn |
| Dusk Marsh | Rune Giữ Đường | đường về Cây Hồn còn sáng | Sấm Vụn |

**Bốn map còn lại KHÔNG có Rune, và đó là chủ ý** — `corran` (rễ Cây Hồn chạy ngầm, không ai dám
khắc đá lên rễ) · `loimon` (một lối mòn không phải một nơi) · `trungnut` (đất trũng ngay dưới
Nhát Gọi, cắm đá là nứt ⇒ **giải thích luôn `type:'freepk'`**) · `caungam` (không có nền để cắm).

⚠ **HAI CON SỐ, HAI TỔNG, ĐỌC TỪ HAI NGUỒN.** `runeDaThu()` đếm trên `RUNE_CO` (7);
`tuongQuanDaHa()` đếm cờ `ta_*` và in kèm `TRAN_AI_TONG` suy từ `BOSS_DEFS` (11). Bản cũ in cả
hai theo mẫu `/7` chép cứng, nên vét sạch game là panel Nhật Ký in ra đúng chữ **"11/7 Tướng
Quân đã hạ"**. `test_cottruyen.js §2` gác đúng chỗ đó: vét hết rồi quét cả panel, không phân số
nào được vượt trần.

⚠ **Cờ lưu vẫn là `ta_<map>`**, không đổi tiền tố — save cũ không phải di trú. Chỉ bộ ĐẾM đổi.

⚠ **Số nấc lớp vết nứt (`#fx-crack[data-tru="N"]` trong `style.css`) phải khớp `RUNE_TONG`.**
Bộ chọn khớp chính xác, nên thiếu một nấc là `--nw` không được khai, `parseFloat` ra `NaN`, và
lớp vết nứt TỤT VỀ 0 đúng ở nấc cuối — không một lỗi nào trên console. Đã dính khi đi từ 5 lên 7.

Thuật ngữ chốt: **Rune Cổ** · **Nếp Khắc Vừa** · **Nhát Gọi** · **Cây Hồn** · Tướng Quân (Trấn Ải,
mỗi map ĐÚNG MỘT con) · **Vệ Binh Rune** (3 boss phụ, canh Cổng Vực) · Cổng Vực · **Đá Ấn Rune** ·
Hung Thần (boss thế giới định kỳ, **không** dính cốt truyện) · Đoàn Gloam (kẻ qua Nhát Gọi rồi đi
theo người thứ bảy) · **DRUE**.

### Chuỗi nhiệm vụ — 8 chương, 46 nhiệm vụ, **ĐANG CHẠY**

⚠ Mục này trước đây ghi `QUESTS` và `SIDE_QUESTS` đều rỗng "chờ dựng lại". `QUESTS` **đã dựng
lại**: 8 chương / 46 nhiệm vụ trong `data/canbang.js`. `SIDE_QUESTS` thì **vẫn rỗng** — đó là
việc còn nợ thật.

Mỗi chương = một Rune, và **đóng bằng loại nhiệm vụ `tranai`** (hạ Trấn Ải của chính vùng đó).
Loại đó là mới, và nó tồn tại để vá đúng một lỗi: trước bản này Kết Mở do `killMob` quyết định
(hạ Trấn Ải Dusk Marsh bật cờ `ketMo`) nhưng **không một nhiệm vụ nào bảo đi hạ nó** — nên người
chơi xong 100% chính tuyến mà chưa chắc thấy kết, hoặc thấy kết trước khi xong chính tuyến.

Ba luật của chuỗi, đo được bằng máy (xem script kiểm trong `docs/LORE_RUNE.md §6`):
1. khoảng cách hai nhiệm vụ liền nhau **≤ 4 cấp** (bản cũ có chỗ hở 8 cấp);
2. cấp quái lệch cấp nhiệm vụ **≤ ±4** (bản cũ có chỗ lệch +16);
3. **≤ 60%** nhiệm vụ là đánh quái (bản cũ 67%), và **không chương nào toàn đánh quái**.

Mỗi chương mở đúng một cửa cơ chế, và **cửa nào hứa thì phải có nhiệm vụ THẬT gác** — xem mục
"LOẠI NHIỆM VỤ `moc`" ở trên. Bảy cửa đang có người gác:

| Ch | Cửa | Nhiệm vụ |
|---|---|---|
| I | Khế Ước (thân Axie) | `c1q3` Kẻ Đi Trước — quay 1 |
| II | Vỉa Cốt | `c2q2` Bụi Đá Dưới Chân Phiến — khai 1 |
| III | bốn ô Cốt | `c3q3` Mảnh Cốt Đầu Tiên — cắm 4 |
| IV | Rương Canh | `c4q2` Hòm Có Người Canh — mở 2 |
| IV | Đại Thành | `c4q3` Thứ Không Ai Dạy Được — 1 điểm |
| V | Bản Năng → cấp kỹ năng | `c5q2` Bản Năng — nâng 3 |
| VI | Box Kundun | `c6q4` Mỏ Đã Tắt Lửa — mở 2 |

⚠ Cửa **Khế Ước** nặng hơn sáu cửa kia: sau đợt gỡ Ragoon đó là cửa **duy nhất** vào hệ avatar,
tức tính năng đầu bảng của cả đợt Đổi Vai. Không có nó thì người chơi xong 100% chính tuyến mà
không ai nói cho họ biết là đổi được thân.

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

### BỐN Ô TRANG BỊ VẼ RỜI NHAU — không đợi đủ bộ

Chủ dự án chốt: **không bắt mặc đủ bộ mới hiện giáp**. Đeo mỗi đôi giày thì đúng đôi giày đổi.

Đường cũ `nvBoGiap()` đổi **cả tấm thân** một lượt theo bậc hiệu dụng `gv.t`, nên thiếu một ô
là tụt bộ hoặc về thân trần — và không có cách nào thân một bộ mà tay áo một bộ khác.

Đường mới: `nuong_nv.py --lop` cắt gói Spine thành **năm lớp rời**, game chồng lại lúc vẽ.

- **NĂM lớp, không phải bốn**, và thứ tự là **THỨ TỰ VẼ CỦA BỘ XƯƠNG**, không phải thứ tự ô:
  `tóc-sau · tay-XA · hai chân · thân · tay-GẦN · đầu`. Ô `tay` nằm **hai bên** ô `ao` — gộp
  `tay` làm một lớp là tay xa nhảy ra trước ngực. `NV_LOP` trong game.js phải trùng khít bảng
  `LOP` trong `tools/spine/nuong_nv.py`; `tests/test_lopdo.js` §1 gác đúng chỗ này.
- **Mỗi lớp CẮT SÁT hộp bao của chính nó**, gốc cắt ghi trong `NV_LOP_HOP` (8 số: bảng một rồi
  bảng hai). Không cắt thì năm lớp = 5 × 27,6 MB mỗi bộ. Cắt rồi thì tổng năm lớp của **bảng
  một chỉ còn 79,5%** một tấm thân liền — tách ô ra còn **rẻ hơn** gộp, vì mỗi ô chỉ nạp đúng
  lớp của nó dù người chơi mặc bốn bộ khác nhau.
- **Hai bảng cắt hai hộp khác nhau.** Bảng hai là chết/nhảy múa/bật người, tay chân văng rất
  xa. Ép chung một hộp thì bảng một phải gánh hộp của bảng hai: đo được 79,5% phình lên 167%.
- Bộ có mặt trong `NV_LOP_HOP` đi đường lớp rời; bộ không có vẫn đổi cả tấm như cũ. **Hai đường
  sống chung là chủ ý**: 7 bộ nướng từ trước không còn gói Spine gốc, mà cắt lớp từ một tấm đã
  dẹp thì không có cách nào. `nvBoGiap()` trả `null` cho bộ có lớp rời — trả tên là 404.
- `heroGearSig()` phải mang `gv.oLop`, nếu không đổi mũ mà đầu vẫn cái mũ cũ.

⚠ **NỢ CÒN LẠI — thân nền chưa cắt lớp.** Lớp của bộ đang đắp lên **tấm thân liền** `dw1`, nên
một lớp có thể che nhầm phần thân đáng lẽ nằm TRƯỚC nó: đeo mỗi ô `chan` thì ống chân đè mất
vạt áo dài của thân. Ba ô kia không dính vì đầu/thân/tay vốn vẽ sau cùng. Sửa dứt điểm cần
**một gói Spine THÂN TRẦN cho mỗi lớp** để cắt ra năm lớp nền — xem
`docs/PROMPT_GIAP_DARKWIZARD.md §7`.

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

### ĐI hay CHẠY — cửa là ĐÔI GIÀY, không phải tốc độ

`dangChay(p)` là luật DUY NHẤT: `p.equip.chan.plus >= GIAY_CHAY_PLUS (6)` thì CHẠY (`00_Run`),
dưới đó — kể cả chưa có giày — thì ĐI (`00_Walk`).

- **Vì sao đổi.** Luật cũ đọc TỐC ĐỘ (`p.speed >= 1.271 × NV_CAO ≈ 168`), mà tốc độ nền của
  người chơi là **209** — tức mọi nhân vật chạy ngay từ cấp 1, suốt đời, và 32 khung `00_Walk`
  đã nướng nằm chết trong bảng. Chủ dự án chốt: vào game là ĐI, **Giày +6** mới mở dáng chạy.
  Đổi được cả một thứ NHÌN THẤY ĐƯỢC khi đập giày — thứ mà các ô khác không có.
- **⚠ HAI chỗ phải cùng gọi `dangChay()`**: `drawPlayer` chọn KHỐI VẼ, `update()` chọn SẢI CHÂN
  (`SAI_CHAN.w` / `SAI_CHAN.r`) để tính `walkPh`. Tách ra hai luật là bàn chân **trượt đất
  ~40% quãng đường mỗi vòng** — nhìn chỉ thấy "hình như đi hơi lạ", rất khó lần ra.
- Nhánh `_bay` phải đứng TRƯỚC nhánh đi bộ trong chuỗi chọn khối, nếu không đang bay mà mang
  Giày +6 cũng đổi khối.

Test: `tests/test_walkrun.js` (13 mục). Mục 3 đo `walkPh` chuẩn hoá **theo px đã đi**, không
theo thời gian — chia theo thời gian thì hai lượt đo không đi bằng nhau và sai số 11%.

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

## ~~Khắc Ấn~~ — ĐÃ GỠ, đừng dựng lại

Cả hệ Khắc Ấn (`SIGIL_DEFS`, `_sigilTag`, `sigilTick`, `rollSigil`…) **đã bị gỡ khỏi game**
trong đợt kéo về mô hình MU. `game.js` ghi rõ lý do ở chỗ cũ: *"Đó là cơ chế của Diablo, không
phải của MU — MU không có món đồ nào ĐỔI CÁCH một chiêu hoạt động."* Nó cũng là hệ tốn nhất
trong sáu hệ bị gỡ: 110 chỗ nhắc tới, luồn qua cả `castSkill`, đường bay của đạn và `hurtMob`.

Mục này trước đây mô tả nó như một hệ **đang chạy**, và đã kịp làm lạc hướng một phiên làm việc
(2026-09-06) — nên giữ lại đúng cái tiêu đề này để cảnh báo, thay vì xoá trắng và để người sau
đọc `SIGIL_DEFS` trong lịch sử git rồi tưởng nó còn.

**Trục "đổi cách chiêu chạy" hiện nay là `EVO_PATHS`** (Tiến Hoá, mốc cấp 40/80/120): Bá Đạo /
Tốc Chiến chỉ đổi con số, còn **Lan Toả** đổi hành vi thật — +45% bán kính, −22% sát thương, tức
chuyển chiêu từ dồn một mục tiêu sang quét cả bầy. Xem `docs/NHIP_CAP_1_120.md`.

## So sánh trang bị — nửa còn lại của Loot 2.0

Với 15 dòng phụ đều là % thuần, người chơi không tự nhìn ra món vừa nhặt hơn hay kém.
Trước đây túi đồ chỉ có mũi `▲` xanh dựa trên `itemPower()`: nói được "to hơn", không nói
được "khác chỗ nào".

- `itemCompareHtml(it)` — phán quyết + chênh lệch TỪNG DÒNG so với món đang mặc cùng ô.
  Cảnh báo khi đổi món sẽ **rời bộ Cổ Thần** (mốc 2/3/5 mà bảng chỉ số không thấy).
- `itemStatMap(it)` gom dòng chính/phụ/Thức Tỉnh về một bảng trừ được nhau (khoá có tiền tố
  `m:`/`s:`/`a:` để dòng cùng loại không đè nhau).
- ⚠ **Ba cái bẫy mà bất kỳ "thuộc tính khan hiếm" nào cũng tạo ra.** Chúng từng phát sinh với
  Khắc Ấn (nay đã gỡ), và sẽ phát sinh y hệt với hệ đồ khan hiếm tiếp theo:
  1. `tryAutoEquip` + `autoEquipBest` tháo mất thuộc tính hiếm chỉ vì món mới hơn 5% chỉ số.
  2. `autoEquipBest` phải xếp hạng theo **hai khoá** — (có thứ hiếm) rồi mới tới lực chiến.
     Nhân lực chiến với một hệ số cố định là sai: thứ khan hiếm thì chênh chỉ số bao nhiêu
     cũng không mua lại được.
  3. Auto-bán (3 chỗ) + `sellItem` một chạm phải coi món mang thuộc tính hiếm là đồ quý.

Test: `node <scratchpad>/test_itemcompare.js`.

## Hệ thống kỹ năng (đã tối giản)

Taskbar cố định **4 ô**: chiêu chính (`a`) · chiêu phụ (`tp`) · ô 3 riêng từng lớp
(`O3_SKILL_ID`) · tuyệt chiêu (`SIGNATURE_SKILL`). Không cho người chơi tự gán. Các chiêu cũ
không còn bấm được đã quy thành **% Công Kích vĩnh viễn** (`LEGACY_SECT_SKILLS` /
`legacyAtkPct` trong `calcDerived()`), hiện ở mục Di Sản trong panel K.

Ô 3 **không nhất thiết là chiêu buff**. Bộ bốn nút phải là bộ bốn chiêu mà lớp ấy thực sự nổi
tiếng vì nó. Dark Wizard là Poison · Meteorite · Inferno · Dragon Spirit, nên Soul Barrier
nhường chỗ cho Inferno và chuyển sang Di Sản — y như chiêu buff của Dark Knight đã làm.
`BUFF_SKILL_ID` nay **suy ra** từ `O3_SKILL_ID` (ô 3 nào có `type:'buff'`), không khai tay.

Một chiêu **không được vừa bấm được vừa cộng %ST vĩnh viễn**. Đưa chiêu nào lên taskbar thì
đồng thời gỡ nó khỏi `LEGACY_SECT_SKILLS`, và đẩy một chiêu khác vào thế chỗ sao cho mỗi lớp
vẫn đúng **4 chiêu Di Sản = +8,0% Công Kích** (`test_kynang5lop` bắt lỗi lệch giữa các lớp).

### ⚠ Quy ước kỹ năng: NĂM thông số bắt buộc

Mọi chiêu, không trừ chiêu nào, phải khai và **hiện ra cho người chơi đọc** đủ năm con số.
Thiếu một dòng là người chơi không so được hai chiêu với nhau, và cân bằng thì không ai kiểm
được bằng mắt:

| Thông số | Khoá | Ý nghĩa | Khi không khai |
|---|---|---|---|
| Khoảng cách sử dụng | `tam` | xa nhất tới chỗ chiêu phát ra; `0` = ngay tại chỗ đứng | lấy tầm của lớp (`SECTS[x].range`), chiêu quạt lấy 130 |
| Thời gian hồi chiêu | `cd` | giây, trước khi trừ các mốc giảm hồi | bắt buộc khai |
| Sức mạnh tấn công | `mult` | hệ số nhân Công Kích | 1.0 |
| Phạm vi ảnh hưởng | `pham` | bán kính vùng trúng; `0` = trúng đúng một mục tiêu | `fx.r`, Trấn Phái lấy `TP_RADIUS` |
| Mana tiêu hao | `qi` | trừ thẳng khi tung; gọi là **Mana**, không phải từ vựng kiếm hiệp (quy tắc số 1) | bắt buộc khai |

`skillInfo()` trả đủ năm (`tam` · `cd` · `he` · `pham` · `qi`) và `skThongSo()` in chúng thành
lưới 3 cột trong mỗi ô kỹ năng. **Dark Wizard đọc "Công Kích" thành "Sức Mạnh Phép Thuật"** — cùng
một con số, nhưng gọi đúng tên thứ mà lớp ấy dùng để đánh.

Hai luật đi kèm, vì chúng là chỗ dễ nói dối nhất:

1. **`tam` phải là tầm THẬT, và nó ngắm theo CON TRỎ.** Chiêu khai `tam` > 0 thì nổ ở chỗ
   người chơi đang chỉ chuột, không phải dưới chân người niệm. `diemGiang(tam)` kẹp điểm ngắm
   vào trong `tam` (chỉ ra ngoài tầm thì rơi ở mép tầm, không câm tiếng), rồi hút vào con quái
   gần điểm ngắm nhất trong `BAN_HUT` = 90px. Đánh dấu `neo:'quai'` trong `CHIEU_TRANH`.
   Lối chơi là chuột phải để đi + phím 1-4 để tung chiêu, nên con trỏ luôn nằm sẵn ở chỗ người
   chơi đang nhìn; nhắm theo "bầy gần người niệm nhất" là cướp mất quyền chọn ấy — đứng giữa
   hai bầy thì chiêu tự chọn sai và không có cách nào bảo nó khác đi.
   `mouseWorld` khởi tạo (0,0) = góc bản đồ, nên phải hỏi cờ `chuotDaRe` trước khi tin nó.
   Bài kiểm `test_ngamchuot.js` lái bằng sự kiện chuột/phím THẬT: chỗ dễ hỏng không phải phép
   tính điểm ngắm mà là sợi dây nối từ con trỏ tới nó.
2. **`pham` phải khớp thứ vẽ ra.** Hình được phép nhỏ hơn vòng sát thương (`co` trong
   `CHIEU_TRANH`, hiện 0,62 — vẽ đúng bán kính thật thì một con quái cao 70px lọt thỏm trong
   đám cháy 370px), nhưng **không bao giờ lớn hơn**: vẽ trùm qua con quái mà nó không mất máu
   là hứa suông.

### Chiêu đã có art thì gom hết vào `CHIEU_TRANH`

Một bảng duy nhất trong `game.js` khai mọi chiêu có tranh thật: `atlas` (tấm khung hình trong
`VFX_ATLAS_DEFS`) hoặc `ve` (đường vẽ riêng như `vongKiem` / `uLinh`), kèm `neo` và `co`.
`spawnSkillVfx()` gặp chiêu trong bảng là **dừng ngay** — không vẽ thêm hình nào nữa.
Có mặt trong bảng nghĩa là chiêu ấy **không còn khai `style` ở `VH_VFX`/`SECT_VFX`**; giữ cả
hai là chồng hai lớp lệch tâm lên nhau. Bài kiểm đọc thẳng bảng này, đừng chép danh sách sang
chỗ khác.

Đường nhập art: `tools/vfx_meowa.py` (gói Meowa → atlas) và `tools/icon_chieu.py` (cắt icon
**ra từ chính tấm dán của chiêu đó** — ô kỹ năng và thứ nổ trên màn hình phải là một).

Ba dạng hỏng đã gặp ở gói Meowa, mỗi dạng một cờ, **đừng trộn**:

| Dấu hiệu | Vì sao | Cờ |
|---|---|---|
| Ô vuông đen / thủng lỗ giữa dải nền sáng, ô ~11px | xuất KHÔNG bật "preserve translucent areas" → lưới ô caro của trình vẽ nướng thẳng vào tranh | `--caro` |
| Vùng sương mờ thành lưới rung, alpha nhảy 0 ↔ 0,3 theo ô ~25px | alpha đủ 256 mức nhưng lớp mờ bị dither | `--suong` (trung bình một chu kì, theo lối nhân sẵn, chừa nét đặc ≥150) |
| Hiệu ứng chìm nghỉm trong màn | gói vẽ trên nền trắng: bản đồ ban đêm sáng ~52 mà gói chỉ sáng ~25, tức TỐI HƠN nền | `--sang gamma,gain,sat` |

Và một luật vẽ: **art tối thì phải cộng sáng.** `cong:false` (vẽ đè) chỉ hợp với gói sáng hơn
nền — Meteorite, Inferno. Gói tối như Dragon Spirit vẽ đè thì thành vệt bóng; bỏ `cong:false`
cho nó cộng sáng là bầy long hồn phát sáng lên ngay. Đã thử cả hai và chụp lại để so.

## ⚠ QUY TẮC SỐ 3: KHÔNG DÙNG VECTOR. CHẤM HẾT.

Chủ dự án chốt hai lần (phiên 2026-09-05): **không vẽ vector, và cũng đừng nhắc tới nó
nữa.** Không đề xuất "tạm vẽ vector", không giữ lại đường vector cũ làm lối lui, không
so sánh hai lối. Vector đã bị gỡ khỏi hệ trang bị và nó không quay lại.

Mọi art — trang bị, vũ khí, giáp, nhân vật, cảnh vật — là TRANH THẬT, nối vào game qua
một BẢNG KHAI (`VK_ANH` cho vũ khí, `NV_GIAP` cho giáp, `NV_BO` cho thân…).

**Nguồn art, theo thứ tự phải thử:**

1. **GÓI SPINE ĐÃ CÓ.** Mỗi gói nhân vật kèm sẵn một bộ giáp ĐẦY ĐỦ và một cây vũ khí
   trong atlas của nó. Đây là chỗ phải nhìn TRƯỚC TIÊN, và đã có lần bỏ sót: đợt nối
   vũ khí đầu tiên em đi thẳng sang meowa trong khi năm cây kiếm/nỏ/quyền trượng nằm
   sẵn trong atlas, cùng hoạ sĩ với bộ giáp. Xem `docs/ART_VUKHI_SPINE.md` và
   `tools/spine/`.
2. **meowa.ai** — chỉ khi gói Spine không có thứ cần. Viết bản mô tả (kích thước, hướng,
   chỗ nắm, nền trong suốt) rồi đưa chủ dự án; sandbox không gọi được meowa (chặn egress).
   Nếu có khoá API thì truyền qua **biến môi trường**, không bao giờ ghi vào tệp trong repo.
3. Món chưa có tấm thì rơi về **ô chờ art** (`iaChuaArt`) — một bóng dáng phẳng, cố ý vẽ
   thô để không ai tưởng là art thật rồi để nguyên. Đó KHÔNG phải "vẽ vector", đó là chỗ
   trống có nhãn.

Và KHÔNG ngồi dựng hình bằng `ctx.beginPath()` trong mọi trường hợp.

Sandbox KHÔNG gọi được meowa.ai (chặn egress), nên bước sinh ảnh là việc của chủ dự án.
Nếu có khoá API, truyền qua **biến môi trường** — không bao giờ ghi vào tệp trong repo.

Lịch sử: hình vector của giáp, vũ khí, nhẫn và dây chuyền đã bị gỡ hết trong hai đợt
(`2ed74f6`, `f151948`). Đừng thêm lại. `test_itemdb` gác: `ITEM_ART`, `iaRing`,
`iaPendPhys`, `iaPendMagic`, `iSheenArc` sống lại là bài đỏ.

`veChimera()` — hình đệm vector năm dáng cho 16 Chimera — cũng đã gỡ (phiên 2026-09-05),
cùng đợt thay art Chimera sang bảng khung hình. Bảng chưa tải xong thì KHÔNG vẽ gì, con vật
hiện trễ một nhịp. `test_chianh` gác độ phủ bảng khung.

*Ngoại lệ còn giữ:* icon vật phẩm TIÊU HAO (bình thuốc, sách, bùa, hộp) vẫn vẽ bằng canvas
— chúng nhỏ, không thuộc hệ trang bị, và không đứng cạnh art thật để lộ chênh lệch.

### Chữ hiển thị — Baloo 2 CHỈ cho mặt Khế Ước

Quét cả 54 repo `axieinfinity`: chữ hiển thị chính chủ của Axie là **Lilita One**
(`godot-axie-starter-3d`), nhưng nó chỉ có latin + latin-ext — "Khế Ước" hiện ra thành
"Kh   c". Thay bằng **Baloo 2** (cùng chất mập-tròn, CÓ bộ dấu), tự chứa trong
`public/game/fonts/`, gắn vào token `--font-chi`.

Nó **không** đụng `--font-display`. Baloo 2 từng bị gỡ khỏi `--font-display` vì chữ bo tròn
kiểu hoạt hình trên khung thép đinh tán là hai ngôn ngữ hình ảnh chửi nhau — lý do đó vẫn
đúng. Chỉ dùng ở chỗ có con Axie đứng cạnh.

---

## Hình vật phẩm — LẮP TỪ BỘ PHẬN, không phải file PNG

> ⚠ Mục này là LỊCH SỬ. Hệ lắp-từ-bộ-phận cho GIÁP và VŨ KHÍ đã gỡ — xem Quy tắc số 3.
> Phần còn đúng: cách `ITEM_DB` khai một món bằng một dòng dữ liệu, và cách tra bảng khai art.

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

**Hiệu ứng chém theo `motif` là THUẦN HÌNH ẢNH.** Cơ chế chiến đấu là việc của chiêu thức và
Tiến Hoá — cho vũ khí làm cả hai thì hai hệ giẫm chân nhau và người chơi không biết sát thương
lan ra là do kiếm hay do chiêu.

⚠ **Ba lỗi hình chỉ lộ khi CHỤP RA XEM, không lỗi nào lộ khi đọc code**: nhẫn ra hình móng
ngựa (vẽ cung hở), găng ra thanh sô-cô-la (4 khối chữ nhật bằng nhau), kiếm cao hơn cả người
(hệ số 2.5 thay vì 1.45). Vẽ xong phải render ra ảnh mà nhìn.

## Mọi thứ trong màn đo theo `NV_CAO`, không chép cứng px

`NV_CAO` (hiện **132**) là chiều cao nhân vật trên màn. Nó là **thước đo chung**: thần khí
(`TK_PHONG`), hình học Vòng Kiếm Lửa (`VONGKIEM_TAM/RX/RY/VKX/VKY`), sải chân (`SAI_CHAN`),
ngưỡng chạy (`CHAY_TU`), chỗ bàn chân chạm đất (`chanDy()`) và cỡ avatar (`avaCo`) — **tất cả
đều dẫn xuất từ nó**. Chép cứng lại một con số đã thu sẵn là mở đường cho chúng lệch nhau, và
kiểu lệch ấy rất khó lần: phóng to nhân vật thì bàn chân trượt đất, vòng lửa quét ngang đầu,
chiêu giáng xuống nổ ngang bụng — mà nhìn thì chỉ thấy "hình như hơi lạ".

Sải chân giữ con số **đo trên bảng khung** (`SAI_CHAN_NUONG`, ở `CAO_THAN_NUONG` = 159px) rồi
mới thu theo `NV_CAO`; nhịp bước = quãng đường ÷ sải chân nên sai một chút là trượt chân ngay.

⚠ **Thứ tự khai báo**: hằng nào nhân với `NV_CAO` thì phải nằm **dưới** nó trong `game.js`.
`const` có vùng chết — đặt ở trên là cả tệp chết ngay lúc nạp, mà lỗi báo ra lại là một hằng
khác ở tận dưới ("Cannot access 'X' before initialization"). eslint và tsc **không** bắt được;
chỉ mở trang mới thấy. Đã mắc một lần với `VONGKIEM_TAM`.

## ~~Chimera đi theo KHÔNG BAO GIỜ được lấn át nhân vật~~ — luật đã GỠ

> ⚠ Giữ đúng cái tiêu đề này để cảnh báo, thay vì xoá trắng rồi để người sau đọc `CHI_THAN`
> trong lịch sử git mà tưởng nó còn. Cùng kiểu bẫy đã ghi ở mục "~~Khắc Ấn~~".

Luật cũ (`chiCoTrongMan` · `CHI_THAN` 0,45 · `CHI_TRAN` 0,55) khoá cỡ con thú đi theo theo **hộp
vẽ ra**, cả cao lẫn rộng, tương đối với `NV_CAO`. Nó tồn tại vì có **HAI cái thân** đứng cạnh
nhau trong màn, và câu hỏi "con nào là ngươi" là câu hỏi thật.

**Ragoon đã gỡ** (xem mục Đổi Vai). Nay chỉ còn MỘT thân: con Axie **LÀ** thân người chơi. Một
cái thân không lấn át được chính nó.

⚠ **Cỡ avatar đi theo luật NGƯỢC LẠI, đừng chép số cũ sang.** `AVA_TY` 0,72 / `AVA_TRAN` 0,95:
avatar và lớp nhân vật **THAY CHỖ NHAU** lúc ra đòn, nên khối nhìn thấy phải **bằng nhau**, không
phải nhỏ hơn. `CHI_THAN`/`CHI_TRAN` cố ý nhỏ hơn người — chép sang là mỗi cú đánh một cú giật cỡ.
`tests/test_cothu.js` nay gác đúng luật mới đó (và gác luôn việc Ragoon không sống lại).

## Hai lối vẽ nhân vật — ĐỪNG TRỘN VÀO NHAU

Game có **ba** bộ dựng nhân vật, mỗi bộ một việc. Nhầm chỗ là ra hình lạc quẻ.

| Bộ | Hàm | Cỡ | Dùng ở đâu |
|---|---|---|---|
| Trong màn | `drawPlayer()` | ~40–56px | nhân vật đang chạy, vẽ mỗi khung hình |
| Thẻ nhân vật | `heroCardUrl()` | 160×220 | bảng Nhân Vật, bảng Trang Bị — có thể hiện đồ đang mặc |
| **Chibi** | `chibiUrl()` | 420×420 | **thẻ chọn lớp** và ảnh phóng to bên cạnh |
| **Tranh minh hoạ** | `splashUrl()` | 620×860 | **chỉ mở bằng lệnh `/art`** |

**Chibi khác thẻ nhân vật ở LUẬT, không phải ở cỡ.** Đầu chiếm gần nửa chiều cao,
mắt to có tròng và đốm sáng, tay chân mập ngắn, nét viền dày bao ngoài. Viền dựng
bằng khuôn: in bóng đơn sắc ở 20 hướng quanh tâm rồi đặt hình gốc lên. Hai lớp —
**trắng dày ngoài, đen mỏng trong**; chỉ đen thì viền tàng hình trên nền tối. Phải
ép mép khuôn thành đặc (`drawImage` bóng lên chính nó vài lần) trước khi in vòng,
không thì 20 bản mờ chồng nhau ra viền nhoè.

**Mỗi lớp một BÓNG DÁNG riêng — đây là điều dễ làm sai nhất.** Bản đầu năm lớp
chung một khuôn, chỉ đổi màu; che màu đi thì không ai phân biệt được. MU phân biệt
lớp bằng đường viền ngoài. `CHIBI_CFG` giữ ba trục: `head` / `sh` (vai) / `body`.

    Dark Knight   helm  · spike · plate     mũ trụ kín + hai sừng cong
    Sylvan Ranger hair  · small · leather   đuôi tóc sau gáy + tai nhọn
    Dark Wizard   hood  · none  · robe      mũ chóp cao, KHÔNG giáp vai, áo loe che chân
    Spellblade    mane  · one   · half      bờm đổ một bên, CHỈ MỘT bên vai
    Dark Lord     crown · wide  · cape      vương miện năm chấu + áo choàng

**Cách kiểm:** tô đặc một màu rồi nhìn. Năm cái bóng phải khác hẳn nhau. Nếu phải
đọc màu mới biết lớp nào thì chưa đạt.

**Tranh minh hoạ KHÔNG đặt vào luồng chơi.** Đã thử làm ảnh lớn ở màn chọn lớp và
bị gỡ ra: tỉ lệ 8 đầu đứng cạnh chibi là lệch hẳn. Nó chỉ để xem, mở bằng
`/art <lớp> [mavuong]`.

## Art nướng sẵn từ Spine — có SKILL riêng, đọc trước khi đụng vào

Art nhân vật do Meowa sinh ra là rig Spine. Game này không có runtime Spine và sẽ không có
(runtime chính chủ đòi giấy phép), nên đường đi là **nướng sẵn ra bảng khung rồi `drawImage`**.

Toàn bộ hợp đồng toạ độ, các phép đo bắt buộc, và những cái bẫy của định dạng Spine 4.2 nằm ở
**`.claude/skills/spine-nuong/SKILL.md`**. Đọc trước khi sửa `nvBo`/`nvVuKhi`/`nvIconUrl`/
`canhVeAnh` hay khi có gói art mới — mấy cái bẫy kia đoán không ra được, mỗi cái làm hỏng bản
dựng theo một kiểu khác nhau.

Ba công cụ, ba việc khác nhau:

| công cụ | việc |
|---|---|
| `tools/spine/nuong_nv.py` | thân + vũ khí gốc → bảng khung 80 khung |
| `tools/spine/nuong_vk.py` | đắp một vũ khí RỜI (pixel art) lên tay theo xương điểm cầm |
| `tools/spine/nuong_icon.py` | tách bộ giáp thành dải **4 icon**: nón · áo · tay · chân |

Chỉ có **bốn** icon chứ không phải năm — bản mẫu Spine không có khe quần riêng, nên ô Quần chỉ
tính chỉ số. Đừng thêm ô thứ năm vào dải: `NV_ICON_O` và `NHOM` trong `nuong_icon.py` phải
trùng nhau, lệch một ô là mọi món sau đó hiện sai hình.

`NV_BO` (thân trần) có 5/5 lớp; `NV_GIAP` (bộ giáp) mới có 1/35 — thiếu khoá thì tự về đường
vẽ cũ, nên thêm dần từng bộ được, không phải chờ đủ. Xem thử nhanh bằng `/gen <giai> [+rèn]`.

## Đổ khối: một nguồn sáng, đặt ở TRÊN-TRÁI

`applyFormLight` + `applyEdgeLight` phủ ánh sáng lên hình ĐÃ VẼ bằng `source-atop`.
Hai cái bẫy đã mắc:

- **`_dim(h, k)` là NHÂN VỚI `(1-k)`**, không phải "còn lại k phần sáng".
  `_dim(x, 0.86)` ra gần đen. Đọc nhầm chiều này thì cả bức tranh đen kịt.
- **Rìa sáng phải là DẢI VIỀN, không phải cả bóng dời đi.** Phủ nguyên bóng trắng
  dời 2px rồi bóng đen dời ngược lại thì ruột hình bị trắng chồng đen hoá xám —
  đỏ ra nâu hồng, vàng ra khaki. Phải lấy bóng gốc TRỪ bóng dời để chỉ còn vành.
  Vành cũng phải tô bằng dải tắt dần: vành đều một sắc đọc thành nét viền dán.

Độ dày rìa đo bằng bảng đối chiếu, không đoán: 2.4px trên icon 88px. 3.2px làm
giáp và ủng bạc màu.

## Sáng theo +N: quầng NẰM NGOÀI, món đồ giữ nguyên màu

**Luật gốc: trang bị là thứ GẮN LÊN người, nên nó phải giữ được bản sắc riêng ở mọi
mức rèn.** Bộ giáp tím-đen viền đồng ở +11 vẫn phải đọc ra đúng bộ giáp đó. Tín hiệu
"+N" nằm HOÀN TOÀN ngoài đường bao, không tô đè lên một pixel nào của món đồ.

Hai lối đã thử và ĐỀU HỎNG, đừng làm lại:

- **Cộng sáng đè lên cả người** (`globalCompositeOperation = 'lighter'` rồi vẽ lại
  chính tấm sprite). Nghe hợp lý vì vùng kim loại sáng vọt còn vải tối gần như đứng
  yên — nhưng **da và tóc cũng là vùng sáng**. Lên +9 là mặt bợt hẳn, nhân vật hoá
  ma. Tách được lớp đầu+tóc ra thì đỡ, nhưng vẫn làm giáp bay mất màu.
- **Ba nguồn cộng sáng chồng nhau** (giáp + cánh + vũ khí, mỗi thứ +11). Cháy trắng
  thành một khối, không còn phân biệt được cái gì với cái gì. Cuối game ai cũng rơi
  vào trạng thái này nên không phải trường hợp hiếm.

Cách ĐÚNG — hai lớp, cả hai nằm ngoài silhouette:

1. **Quầng**: làm nhoè kênh alpha của lớp, tô một màu, thổi to 1,05×, vẽ TRƯỚC lớp đó.
2. **Viền sát bóng**: nở alpha ra rồi TRỪ đi alpha gốc → còn đúng một dải mép ngoài,
   tô cùng màu. Đây mới là thứ cho cảm giác món đồ đang phát sáng.
   *(Cùng nguyên lý với rìa sáng ở mục "Đổ khối" — lấy bóng trừ bóng dời, không phủ
   nguyên bóng lên.)*

**Bậc đọc bằng SẮC, không bằng ĐỘ CHÓI.** Đây là chỗ mấu chốt: chói thì bão hoà, sắc
thì không. Thang: `+7` vàng `#ffd76a` → `+9` lam băng `#9ef2ff` → `+10` tím `#c07fe0`
→ `+11` cam rực `#ff9a4d`. Dưới +7 không có quầng.

**Sáng theo CẢ BỘ, lấy `min(+N)` của năm món giáp** — không sáng từng món. Hai lý do,
lý do sau mạnh hơn:
- Chest +9 mà giày +2 thì thân sáng chân tối, đọc ra "đồ chắp vá" chứ không ra "đồ khủng".
- Ngưỡng cả-bộ biến năm món rời rạc thành MỘT cái đích. Ép xong chest mà chưa thấy gì
  đổi chính là động lực ép nốt bốn món kia. `min` chứ không phải trung bình, vì `min`
  mới ép nâng đều.

**Vũ khí và cánh sáng RIÊNG, và không tốn gì thêm** — vũ khí có slot riêng, cánh thì
`veCanh()` vẽ riêng ở toạ độ thế giới. Ba nguồn sáng độc lập mà chỉ trả tiền cho một lớp.

Hai chỗ dễ vấp khi hiện thực:
- **Bề dày viền phải tính theo TỈ LỆ.** Dải 5px đo trên hình 976px cao; trong màn nhân
  vật chỉ cao 104px nên nó thành dưới 1px và biến mất sạch.
- **`+10` tím dễ chìm** khi chính nhân vật cũng tím (Dark Wizard). Hoặc cho mỗi lớp một
  thang lệch đi, hoặc đổi `+10` sang sắc không lớp nào dùng.

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
tính — dùng `jewelCost()`. Thứ **số lượng lớn** (Lumen, Tu La, Mảnh…) trừ thẳng từ kho
và chỉ hiện trong bảng — dùng `chaosCost()`. Đừng trộn hai loại.

### Túi đồ là một LƯỚI, không phải mảng đếm món

`player.inv` vẫn là mảng phẳng — 70 chỗ đang `find`/`filter`/`splice` trên nó không đổi — nhưng
mỗi món nay mang `gx`,`gy` = ô trên-trái nó chiếm, và chiếm một KHỐI ô theo hình dáng:

| | ô | | ô |
|---|---|---|---|
| nhẫn | 1×1 | áo choàng | 2×3 |
| dây chuyền | 1×2 | **cánh** | **2×5 = 10** |
| giáp (5 ô mặc) | 2×2 | vũ khí | 1×2 → 2×4 theo `line` |

- **Thêm đồ phải đi qua `bagThem(it)`**, không `player.inv.push()` thẳng. Món không có `gx/gy`
  là món VÔ HÌNH: vẫn ăn sức chứa, vẫn nằm trong save, mà không hiện ô nào. `bagSecGear()` có
  bước tự vá nhưng đó là lưới an toàn, không phải chỗ dựa.
- **Hỏi còn chỗ bằng `bagConCho(it)`**, không `player.inv.length >= bagCap()`. Cây trường cung
  2×4 có thể không nhét được trong khi vẫn còn sáu ô lẻ rải rác — đó chính là điểm của cái lưới.
- Kích thước ở `BAG_SIZES` / `BAG_SIZES_LINE`; đo bằng `bagKichThuoc(it)`.
- Quầy Shard nới theo **HÀNG** (`BAG_COLS` = 8 ô), không theo ô lẻ.

### Ép ngọc thẳng vào đồ

Chúc Phúc và Linh Hồn **không cần tới lò** — bấm viên ngọc trong túi rồi bấm món đồ, ở bất cứ
đâu, đúng như MU. Luật nằm ở **`NGOC_EP` / `epNgoc()`**, và Lò Hỗn Độn chỉ là mặt tiền gọi lại
cùng hàm đó. Sửa tỉ lệ hay trần thì sửa `NGOC_EP`, đừng sửa hai nơi.

| | trần | tỉ lệ | hỏng thì |
|---|---|---|---|
| ◎ Chúc Phúc | +6 | 100% | không bao giờ hỏng |
| ◉ Linh Hồn | +9 | 50% | tụt 1 cấp |
| Phá Thiên Kiếp | +11 | 50/45% | VỠ VỤN (☂ giữ được) |

⚠ Linh Hồn từng cho tới +11 — tức là nó ăn đứt Phá Thiên Kiếp ở cả hai mức. Đừng nới lại trần
đó mà không gỡ Phá Thiên Kiếp đi cùng.

### Cánh — 3 bậc × 6 lớp, khoá theo lớp

`WING_BANG = [WING_DEFS, WING2_DEFS, WING3_DEFS]`, tra theo `player.sect`. Bậc đọc từ
`it.wingBac`; `wingSect(it)` cho biết lớp nào dùng được và **`itemUsable()` là cửa duy nhất**
gác chuyện đó (cả ba đường mặc đồ đều đi qua đó).

- Vẽ bằng **một hàm duy nhất `veCanh(g, it, px, py, sway, swayDir, co)`** — dùng cho cả nhân vật
  trong màn lẫn chân dung bảng Nhân Vật. Toạ độ CỤC BỘ (gốc = chân), `co` là tỉ lệ.
- Cánh là **bộ phận mềm**: phải đọc `sway`/`swayDir`, không đọc `performance.now()` một mình.
- Thêm cánh mới thì nhớ `heroCardUrl()` — khoá cache phải gồm chữ ký cánh, không thì chân dung
  hiện mãi đôi cũ sau khi thăng bậc.

### Ba loại tiền thường trực (ví ở góc trên bên phải)

| Tên người chơi thấy | Ký hiệu | Trường | Kiếm ở đâu | Tiêu ở đâu |
|---|---|---|---|---|
| **Lumen** | `◈` | `player.silver` | rơi từ quái, bán đồ, nhiệm vụ | tiệm · rèn · nâng kỹ năng · Lò Hỗn Độn |
| **Ấn Giao Kết** | `✦` | `player.chimera.ve.gk` | boss vùng lần đầu · điểm danh · phó bản | quay Khế Ước (ra **thân Axie**, không ra thú đồng hành) |
| **Shard** | `♦` | `player.shard` | KHÔNG rơi từ quái — chỉ mốc mỗi ngày và thông quan | Quầy Shard: vé quay · nới túi · nới kho |

- `player.silver` **giữ nguyên tên trường**; chỉ chữ người chơi thấy đổi thành "Lumen". Đừng đổi
  tên trường — mọi save đang lưu và 12 chỗ trong `loadGame()` đọc `silver`.
- Shard **không được cộng chỉ số**. Chỗ tiêu duy nhất chạm tới sức mạnh là đổi vé quay, và nó đi
  vòng qua gacha chứ không mua thẳng. Thêm hàng vào `quayShardHang()` thì giữ đúng luật đó.
- Số ô túi/kho đọc bằng `bagCap()` / `khoCap()`, **không** viết thẳng `30` / `60` nữa — hai con số
  đó nới được bằng Shard và trước đây nằm rải ở 17 chỗ.

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
Chiêu diện rộng mà đẩy địch ra thì chính nó phá tan đội hình cho đòn kế tiếp của mình — ca đã
gặp: một hiệu ứng cần "trúng ≥3 địch" ngừng kích hoạt vì con thứ ba bị đẩy ra đúng 1 pixel.
Đừng chữa bằng cách đổi `source`: `source` còn chi phối bạo kích và âm thanh.
**Bọc vòng lặp trúng-nhiều-mục-tiêu trong `aoeHit(() => { … })`.** Chiêu nào MUỐN hất lùi
thì khai báo `fx.kb` như cũ. Hiện có 6 chỗ: sectA cone/selfaoe, bảng kỹ năng cone/aoe và 2 sóng
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

### ⏱ `rc=124` TRONG HỒI QUY LÀ ĐỒNG HỒ CỦA BỘ CHẠY, KHÔNG PHẢI MỘT KHẲNG ĐỊNH ĐỎ

Log của bài dính kiểu này **cụt giữa chừng** với `Target page … has been closed` chứ không có
dòng `FAIL` nào. Đã gặp **bốn bài khác nhau qua bốn lượt** — `test_chianh` · `test_bossplace` ·
`test_sandat` · `test_hudv` — và mỗi bài chạy RIÊNG xong trong **3-28 giây** với rc=0.

**Bốn giả thuyết đã kiểm và LOẠI** (ghi lại để đừng kiểm lại từ đầu):

| nghi | đo được |
|---|---|
| chạy chung với một lượt đo dài | tiến trình đó đã chết TRƯỚC lượt hồi quy đầu |
| máy hết RAM / đĩa | còn 14 GB rỗng · đĩa 29 GB |
| trình duyệt mồ côi tích lại | `ps` sau lượt chạy: 0 tiến trình chrome |
| server tĩnh nghẽn một luồng | `python3 -m http.server` đã là `ThreadingHTTPServer` từ Python 3.7 |

Nguyên nhân cuối cùng **chưa tìm ra** — đừng giả vờ là đã. `tools/reg.sh` nay xử đúng mức đó:
gặp `rc=124` thì **chạy lại đúng một lần**, ghi tên vào `chaylai.txt` và **in ra cuối** dòng
`ĐÃ CHẠY LẠI`. Lượt hai vẫn 124 thì vẫn tính đỏ. *Một bộ kiểm im lặng nuốt lỗi thì tệ hơn một
bộ kiểm nói ra là nó đã phải chạy lại.*

⚠ **Dọn trình duyệt mồ côi bằng lọc `ppid=1`, TUYỆT ĐỐI không `pkill -f chrom`.** Mẫu đó khớp
luôn dòng lệnh của chính shell đang chạy rồi giết nó (thoát 144) — cùng vết sẹo đã ghi ở mục
git bên dưới, và nó đã bị dẫm lại một lần nữa trong phiên gần đây.

⚠ **Bài kiểm mỏng mẫu thì đỏ theo xúc xắc, không phải theo lỗi.** Hai chỗ đã phải sửa:
- `test_bayquai` đo vị trí Kẻ Tiếp Sức trên **6 bãi của một map** rồi đòi "không quá 25% lọt vào
  giữa" — một con lọt là qua, hai con là đỏ. Nay quét mọi map ⇒ **63 mẫu**.
- `test_cottruyen` chốt bằng con số đếm *"đúng 7 NPC có trang thoại"*, nên **thêm một NPC viết tử
  tế là bài đỏ**. Nay suy thẳng từ `QUESTS`: gác *"không người dẫn chương nào bị bỏ trống"*.

Cùng một bệnh với luật `≤60% là kill` ở `docs/LORE_RUNE.md §6`: **một cái chốt hẹp hơn ý định của
nó thì xanh, và nó bảo đảm sai.**

## ⚠ ĐỨNG ĐÚNG CHỖ TRƯỚC KHI CHẠY GIT

Máy này có **hai repo khác nhau** và tên nhánh trùng nhau — đã suýt push nhầm vì chuyện đó.

| Đường dẫn | Repo | Dùng để |
|---|---|---|
| `/home/user/axie-wuxia` | `ShanKyos/axierift` | **game — mọi việc ở đây** |
| `/home/user/Volamchimong1` | `ShanKyos/Volamchimong1` | repo KHÁC, không liên quan game |

Cạm bẫy: shell của agent **mặc định mở ở `/home/user/Volamchimong1`**, và cả hai repo đều
từng có nhánh tên `claude/optimistic-davinci-oi5qba`. Một lệnh `git push` quên `cd` là đẩy
nhầm repo.

**Luật: mọi lệnh git phải có đường dẫn tuyệt đối** — `cd /home/user/axie-wuxia && git …`
hoặc `git -C /home/user/axie-wuxia …`. Kiểm nhanh trước khi push:

```bash
git -C /home/user/axie-wuxia remote get-url origin   # phải ra .../axierift
```

### Còn hai vết sẹo nữa, đừng lặp lại

- **`ln -sfn <đích> node_modules` khi `node_modules` đã là symlink** thì nó **không** thay
  cái link — nó tạo link *bên trong* thư mục đích, và có lần đã biến `node_modules` của repo
  chính thành symlink trỏ vào chính nó. Hậu quả im lặng: `npx eslint` thoát **216 không in gì**
  (npx đi tải qua mạng rồi bị proxy chặn), trông hệt như "lint sạch". Muốn dùng chung
  `node_modules` cho worktree thì `rm -f node_modules` trước rồi mới `ln -s`.
- **`rc=$?` sau một pipe là mã của lệnh CUỐI pipe**, không phải của `npm`.
  `npm run test 2>&1 | tail -6; echo $?` **luôn** ra 0. Muốn lấy mã thật:
  `npm run test > /tmp/t.log 2>&1; rc=$?`.

Hai cái trên cộng lại từng cho ra "3 cổng CI đều xanh" trong khi **không cổng nào chạy**.

## 🚀 PRODUCTION — VPS tự kéo từ `main` mỗi 2 phút

**Production LÀ VPS này, không phải Vercel.** Repo có `vercel.json` + `Dockerfile.vercel`
nhưng đó là môi trường khác — đừng suy ra production từ chúng.

| | |
|---|---|
| Live | **http://14.225.204.107/** |
> ⚠ **Kho đã đổi tên `axiewuxia` → `axierift`.** Đường dẫn TRÊN VPS thì KHÔNG đổi —
> `/var/www/axiewuxia`, `deploy-axiewuxia.sh`, hostname `axiewuxia-xiiz` là thư mục và tên máy
> trên server, không phải tên kho. GitHub tự chuyển hướng tên cũ, nên `git fetch` trong bản sao
> ở VPS vẫn chạy và **cron deploy 2 phút/lần không cần đụng tới**. Đổi mấy đường dẫn đó là tự
> tay làm vỡ deploy đang chạy.

| Máy chủ | VPS Vietnix, hostname `axiewuxia-xiiz`, nginx |
| Thư mục phục vụ | `/var/www/axiewuxia/public/game` |
| Bản sao git | `/var/www/axiewuxia` (clone của `ShanKyos/axierift`) |
| Tự động | cron `*/2 * * * * /root/deploy-axiewuxia.sh` |
| Script | `git fetch origin main --quiet && git reset --hard origin/main --quiet` |

### ⇒ Deploy = ĐẨY LÊN `main`. Không có bước nào khác.

**Chủ dự án đã chốt: làm thẳng trên `main`, push thẳng, không nhánh phụ, không PR.**

```bash
git -C /home/user/axie-wuxia add -A
git -C /home/user/axie-wuxia commit -m "..."
git -C /home/user/axie-wuxia push origin main    # ≤2 phút sau là live
```

Đồng bộ nhánh demo khi cần:
```bash
git checkout demo-axie-showcase && git merge origin/main --no-edit && git push origin demo-axie-showcase
git checkout main
```

⚠ **Push thẳng lên `main` LÀ deploy.** Không còn PR làm lớp đệm, nên bốn cổng dưới đây là thứ
duy nhất đứng giữa một commit hỏng và người chơi. Chạy đủ TRƯỚC khi push, và đọc mã thoát cho
đúng (`cmd > /tmp/x.log 2>&1; rc=$?` — **không** đọc `$?` sau một pipe):

| Cổng | Lệnh |
|---|---|
| lint | `npm run lint` |
| kiểu | `npm run check` |
| unit | `npm test` |
| game | bộ hồi quy trong scratchpad (`test_*.js`, ~127 bài) |

Hỏng thì **sửa trước khi push**, đừng push rồi sửa sau — người chơi thấy bản hỏng trong 2 phút.

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

## Map tranh isometric: chặn bằng ĐA GIÁC SÀN, không bằng ellipse

> ⚠ **SÁU TRÊN TÁM TRANH NỀN ĐANG SAI PHÉP CHIẾU.** Đo được, không phải cảm giác: quét từ đáy
> tấm lên tới hàng đầu tiên đổi chất liệu, tranh **nhìn từ trên xuống** không có dải đáy riêng
> (cả tấm đã là đất — `daohoa` 2,9%, `comoc` 0%), còn tranh **nhìn ngang** có một dải sàn mỏng
> 5–22% ở đáy, phần trên là trời/núi/tường cây. Sáu tấm thuộc loại sau: `tuongduong` 12,2% ·
> `mongco` 21,9% · `nhanmon` 7,9% · `ngoai` 7,3% · `chungnam` 5,7% · `tuyettinh` 4,9%.
> Vì `game.js` kéo tranh nền phủ kín thế giới rồi cho đi khắp mặt tranh (dòng ~10829), **tranh
> nền CHÍNH LÀ mặt đất** — nên đi lên phía trên map là đi vào bầu trời. Đó là toàn bộ nguyên
> nhân của lỗi "nhân vật như đang ở trên không trung".
>
> **Hướng đã chốt: regenerate từng map rồi lắp lại.** Prompt, ràng buộc hình học và công thức
> lắp nằm ở `docs/PROMPT_MAP_ISOMETRIC.md`.
>
> **Đừng thử cứu bằng cách lát nền từ art có sẵn — đã thử ba lần, hỏng cả ba**, lý do từng lần
> ghi ở §2 tài liệu trên. Tóm tắt: dải sàn ở đáy 6 tấm hiện tại là MÀU PHẲNG (sàn sân khấu 2D),
> và lớp `*_Ground.png` của kho Axie là mặt đất vẽ theo phối cảnh cho sân khấu nhìn ngang —
> cả hai đều không lát kín được một thế giới.
>
> **Kho Axie vẫn còn thứ dùng được, ba đợt khảo sát trước bỏ sót** vì chỉ mở `PvE/Backgrounds/
> class/*` rồi kết luận cả thư mục: `story/` và `events/arena/` **tách LỚP**, cho ~12 vật thể
> cắt sẵn alpha (`5_TREE1/2/3`, `10_TREE2`, `7/8/9/10_ROCK`, `8_TEMPLE`, `13_STATUE`, `6_WATER`)
> — lắp thẳng vào lớp `vatTo` được.
>
> **`tests/test_sandat.js` gác hợp đồng này cho MỌI map.** Map nào khai `diTrong` là tự động bị
> canh (điểm thả, 8 hướng đi ra, NPC/cổng/quái đứng trên sàn, đi bộ tới được cổng, và map đánh
> nhau phải có sàn ≥55% khổ map). Dựng lại một map, chấm xong đa giác là có bảo hiểm ngay,
> không phải viết bài kiểm mới.


`bg_quangtruong.jpg` (Quảng Trường Cũ) là tranh **isometric** — nhà có chiều cao, mái là hình
thoi, còn game thì **nhìn từ trên xuống, không có trục cao**. Hai chuyện phải xử riêng:

**1. Chặn.** Lần đầu tôi chặn tám khối nhà bằng tám hình `ellipse` trong `MAP_OBSTACLES`. Sai
kiểu: mái nhà isometric là hình thoi, ellipse thì không — phình ra cho kín mái thì ăn mất mặt
sân, thu lại cho chừa sân thì hở mái, và không có kích thước nào đúng cả hai. Cách đúng là đảo
ngược bài toán: khai **`diTrong`** — đa giác MẶT SÀN ĐI ĐƯỢC (xem `trongDaGiac()` /
`epVaoDaGiac()` trong game.js). Ngoài đa giác là chặn hết, nên mọi khối nhà được chặn miễn phí.
`MAP_OBSTACLES` chỉ còn giữ thứ nằm **giữa** vùng đi được — ở đây đúng một cái giếng.

**2. Không cần lớp phủ trước mặt.** Nhân vật đi ra sau nhà sẽ vẽ ĐÈ LÊN mái — đúng, nhưng chỉ
thành lỗi nếu có đất đi được nằm SAU vật thể vẽ ở tiền cảnh. Đa giác đã ôm sát mặt sân và dừng
**trên** mép mái nhà nam, nên không có ô nào như thế ⇒ không dựng lớp `fg_*.png` nào cả. Nếu
sau này mở sân sau phía nam cho đi được thì mới cần, và lúc đó phải cắt lớp tiền cảnh thật.

**Đo đa giác thế nào cho khỏi đoán:** phủ đa giác lên chính tấm art bằng PIL rồi mở ảnh ra soi
từng mép. Đừng dò bằng phân loại màu — art này tối và đục, cobble/mái/tường/đá cùng dải sáng
55–150, tôi đã thử flood-fill lẫn ngưỡng màu và cả hai đều lem. Mắt trên ảnh có lưới 100px là
cách nhanh nhất và đúng nhất. Đặt NPC thì dùng `/diem` rồi kiểm lại bằng phép điểm-trong-đa-giác.

### Quảng Trường Cũ là thị trấn KHỞI ĐẦU
Nhân vật mới hiện ra giữa sân (`newGame()` đặt `curMap = 'quangtruong'`), 10 NPC quanh sân,
một lò rèn và một quầy thuốc — rồi đi lên **Cổng Bắc** ra Plant Tribe Glade mà đánh quái. Cổng
chọn Plant Tribe Glade chứ không phải Outskirts vì Outskirts để `min:10`.

⚠ Cổng thị trấn thì đặt tên bắt đầu bằng **"Cổng"**, đừng đặt "Lối". `test_noimap` nhận diện
"lối rìa hoang dã" bằng chính tiền tố `Lối ` rồi bắt điểm tới phải nằm cách rìa map <400px —
cổng thành nằm giữa map nên sẽ trượt bài kiểm.

### NPC cũng đo theo thân nhân vật — và đo HỘP NỘI DUNG, không đo khung ảnh
Cỡ NPC từng là `nh = 64` chép cứng. Hai chỗ sai, và chỗ thứ hai mới là chỗ đau:
1. **Chuẩn sai.** `NV_CAO = 132` là chiều cao **ô vẽ**, thân người vẽ ra chỉ **95px**
   (`CAO_THAN_NUONG × NV_CAO / HERO_H`; đo lại bằng `TEST_TO_PHANG` rồi đếm điểm ảnh hồng ra
   92×38). Lấy thẳng 132 làm cỡ NPC thì NPC cao hơn nhân vật cả một cái đầu.
2. **Đo khung thay vì đo hình.** 17 tấm tranh NPC có lề trong suốt khác nhau — nội dung chiếm
   69%…93% chiều cao khung, lề trên 5px…50px. Co cả khung về một chiều cao thì hình thật ra 17
   cỡ khác nhau và chân người kẻ lơ lửng kẻ lún. Nên `npcHop()` đo **hộp alpha** một lần rồi
   nhớ lại, và neo **đáy hộp** vào chân NPC.

Năm NPC là thú Axie có tranh rộng hơn cao (tới 1,35), nên khoá cả hai chiều rồi thu phần vượt —
đúng khuôn `avaCo()` đã dùng cho avatar (trước là `chiCoTrongMan()`, đã gỡ). Nhãn tên, dấu nhiệm vụ và câu thoại bay lên
đều đo theo `n._cao`, không chép cứng 52/64/78 nữa.
