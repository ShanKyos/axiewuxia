# Khảo sát ngôn ngữ — tách tiếng Việt ra tiếng Việt, tiếng Anh ra tiếng Anh

Khảo sát trên bản làm việc ngày 2026-09-03. Chỉ ĐỌC, không sửa tệp nào trong `public/game/`.

**Cách lấy số:** tách toàn bộ chuỗi ký tự (string literal) khỏi `public/game/game.js` bằng một
bộ đọc token tự viết (bỏ hẳn `//` và `/* */`, nên **chú thích tiếng Việt không được tính** —
chú thích không phải chữ người chơi thấy), rồi lọc những chuỗi có dấu tiếng Việt. Số dòng trong
báo cáo này đã được **dò lại bằng cách tìm ngược chuỗi trong tệp**; kiểm chứng lại cho thấy
0/3269 dòng sai. Nhãn khối (`[MOBS]`, `[renderSettings]`…) lấy theo khai báo cấp cao nhất gần
nhất phía trên nên **có thể lệch vài trường hợp**; số dòng thì chính xác.

Số nền, dùng lại suốt báo cáo:

| Chỉ số | Giá trị |
|---|---|
| Chuỗi có dấu tiếng Việt trong mã `game.js` (lượt xuất hiện) | **3.269** |
| Chuỗi tiếng Việt khác nhau | **2.865** |
| Trong đó là chuỗi phẳng, không nhúng biến/HTML | **2.224** |
| Dòng `index.html` có tiếng Việt (đã trừ chú thích) | **39** (24 thuộc tính `title=`, 20 nút chữ) |
| Chuỗi tiếng Việt trong `style.css` | **0** |
| Ký tự Hán/CJK trong `game.js` | **0** — đúng như CLAUDE.md yêu cầu |

---

## 1. Hệ i18n hiện có hoạt động thế nào

### 1.1 Hai lớp chồng nhau, không phải một

`public/game/index.html:184-187` nạp theo đúng thứ tự này:

```
<script src="strings/en.js"></script>
<script src="strings/vi.js"></script>
<script src="i18n.js"></script>
<script src="lang.js"></script>
```

Có **hai** cơ chế dịch song song, làm hai việc ngược nhau:

**Lớp A — `i18n.js` (42 dòng, tra theo khoá).** Toàn bộ mã nằm trong một IIFE, xuất ra hai hàm
toàn cục:

- `window.t(key, vars)` — `public/game/i18n.js:32-40`. Tra `key` trong từ điển của locale hiện
  hành; **không thấy khoá thì trả về chính chuỗi khoá** (`i18n.js:34`), nên khoá thiếu hiện ra
  rõ mồn một lúc dev. `vars` thay chỗ theo cú pháp `{ten}` bằng `split/join`.
- `window.i18nLocale()` — `i18n.js:41`.
- Từ điển chọn ở `i18n.js:28-30`: `locale === 'vi' ? window.I18N_VI : window.I18N_EN`.

**Quy tắc đặt khoá:** khoá chấm-phân-cấp, nhóm theo vùng giao diện. Hiện chỉ có đúng một nhóm:
`hud.hint.*` (`public/game/strings/en.js:5-15`). `docs/I18N_MIGRATION_GUIDE.md` mô tả quy ước dự
kiến là `hud.*`, `panel.char.*`, `quest.*`…, nhưng chưa nhóm nào ngoài `hud.hint.*` tồn tại.

**Đổi ngôn ngữ:** không nằm ở `i18n.js`. Nó nằm ở `public/game/lang.js:991-996`
(`window.ghhaSwitchLang`): lật giá trị, ghi `localStorage['vlcm_lang']`, rồi `location.reload()`.
Hai lớp dùng **chung** khoá localStorage `'vlcm_lang'` (`i18n.js:18` và `lang.js:10`) nên một
nút bấm lật cả hai. Nút nổi chỉ hiện ở màn chờ (`lang.js:971-989`); trong game thì bảng Cài Đặt
gọi lại cùng hàm đó.

**Mặc định:** `locale = 'vi'` (`i18n.js:25`). Chú thích ngay trên đó ghi lại lý do lật ngược từ
`'en'` về `'vi'`. Lưu ý `docs/I18N_MIGRATION_GUIDE.md` vẫn viết là mặc định đã lật sang `'en'` —
**tài liệu đó đã lỗi thời ở điểm này**.

**Lớp B — `lang.js` (1.002 dòng, dịch bằng regex/từ điển).** Đây mới là thứ đang gánh phần lớn
bản tiếng Anh. Nó vá `CanvasRenderingContext2D.prototype.fillText/strokeText/measureText`
(`lang.js:912-919`), vá `window.confirm/alert` (`lang.js:920-928`), và gắn `MutationObserver`
lên `document.body` để dịch text node + thuộc tính `title`/`placeholder`
(`lang.js:929-968`). Nó chỉ chạy một chiều: **tiếng Việt cứng trong `game.js` → tiếng Anh**.
Chiều ngược lại không tồn tại.

### 1.2 Bản `en` phủ được bao nhiêu — đếm, không ước lượng

Phải tách làm hai câu hỏi, vì có hai lớp.

**Lớp A (`t()`) — gần như bằng không:**

| | Số lượng |
|---|---|
| Khoá trong `strings/en.js` | **11** |
| Khoá trong `strings/vi.js` | **11** |
| Khoá `en` thiếu so với `vi` | **0** (đối xứng 100%) |
| Chỗ thật sự gọi `t()` trong `game.js` | **6 dòng** — `game.js:24087, 24088, 24091, 24092, 24094` (10 lượt gọi trên 5 dòng) (một hàm duy nhất, `hintText()`) |
| Tỉ lệ chuỗi người chơi thấy đã đi qua `t()` | 11 / 2.865 ≈ **0,4 %** |

Nói cách khác: `en` và `vi` khớp nhau tuyệt đối, nhưng cả hai cộng lại chỉ phủ **thanh gợi ý
phím tắt ở đáy màn hình**. `docs/I18N_MIGRATION_GUIDE.md` gọi đúng đây là "proof-of-pattern
slice".

**Lớp B (`lang.js`) — 13,4 % và một nửa từ điển đã chết:**

| | Số lượng |
|---|---|
| Cặp `'tiếng Việt': 'tiếng Anh'` trong các từ điển của `lang.js` (dòng 50-770) | **787** |
| Trong đó **khoá tiếng Việt không còn tồn tại trong `game.js`** (mục chết) | **419 = 53,2 %** |
| Luật regex trong `RULES` (`lang.js:768-880`) | **92** |
| Chuỗi tiếng Việt phẳng khác nhau trong `game.js` | 2.224 |
| … khớp được một khoá `EXACT` | **207 = 9,3 %** |
| … khớp được một regex trong `RULES` | thêm **92** |
| **Tổng phủ được** | **299 / 2.224 = 13,4 %** |
| **Không lớp nào chạm tới** | **1.925 chuỗi** |

Ví dụ mục chết (khoá là tàn dư kiếm hiệp đã bị xoá khỏi `game.js` từ lâu):
`lang.js:55` `'Bạch Đà Sơn' → 'White Camel Mt.'`, `'Minh Giáo' → 'Ming Cult'`;
`lang.js:60` `'Đào Hoa Đảo' → 'Peach Blossom Island'`, `'Tương Dương Thành' → 'Xiangyang City'`;
`lang.js:342` `'Săn Kỳ Lân' → 'Qilin Hunt'`.

Phân bố 1.925 chuỗi chưa ai dịch, theo khối lớn nhất: `MASTERY_CLASS` 236, `WEAPON_LINES` 220,
`renderSettings` 141, `HERO_SETS` 66, `BOSS_LORE` 59, `CHI_KY` 57, `CHAOS_RECIPES` 55,
`npcName` 51, `ITEM_NAMES` 45, `VOHOC_DEFS` 36.

---

## 2. Chuỗi người chơi thấy mà KHÔNG đi qua i18n

**3.269 lượt / 2.865 chuỗi khác nhau** trong `game.js`, cộng **39 dòng** trong `index.html`.
Phân loại theo chức năng (gom theo khối dữ liệu / hàm chứa chuỗi):

| Nhóm | Lượt | Chuỗi khác nhau | Khối chính |
|---|---|---|---|
| Tên & mô tả vật phẩm, trang bị, tiêu hao, công thức chế | **756** | 662 | `WEAPON_LINES` 224, `CHAOS_RECIPES` 125, `HERO_SETS` 68, `ACC_LINES` 58, `ITEM_NAMES` 45, `CONSUM_DB` 36 |
| Nhãn giao diện & bảng (chrome) | **656** | 634 | `renderSettings` 154, `drawDungeonHUD` 36, `renderChar` 29, `renderAbode` 22, `renderForge` 21, `renderShop` 21 |
| Kỹ năng, tuyệt kỹ, bảng Thuần Thục | **439** | 404 | `MASTERY_CLASS` 252, `VOHOC_DEFS` 67, `MASTERY_LABEL` 27, `MASTERY_COMMON` 17 |
| NPC, thoại, nhiệm vụ chính/phụ, gợi ý | **354** | 313 | `npcName` 80, `rollKyngo` 40, `CLUES` 36, `renderQuestNpc` 25, `NPCS`/`QUESTS`/`SIDE_QUESTS` 20 mỗi khối |
| Cốt truyện, vùng đất, danh hiệu, Chimera, Sigil | **351** | 324 | `CHI_KY` 72, `CHIMERA` 48, `TRAITS` 29, `SIGIL_DEFS` 28, `COT_DONG` 21 |
| Quái & boss (tên, lore, dị biến) | **281** | 200 | `BOSS_LORE` 90, `MOBS` 54, `BOSS_DEFS` 51, `DIBIEN` 24 |
| Thông báo lúc chơi (rơi đồ, chiến đấu, mở khoá, sự kiện) | **245** | 240 | `killMob` 19, `unlockNotices` 16, `eventList` 14, `applyRewards` 13, `hurtMob` 9 |
| Bảng lệnh cheat / dev | **83** | 83 | `cheatHelp` 83 |
| Khác (rải rác, ≤5 chuỗi/hàm) | **104** | 100 | — |

### Ví dụ từng nhóm (số dòng đã kiểm chứng)

**Vật phẩm / trang bị**
- `game.js:232` `name:'Hạ địch hồi Qi'` — dòng Hoàn Hảo của vũ khí
- `game.js:240` `'Đồng Rơi Thêm'`
- `game.js:318` `'ST Hoàn Hảo'`
- `game.js:19067` `name:'Lọ Mana', use:'Mana là tài nguyên tung chiêu'`
- `game.js:20585` cùng chuỗi đó lặp lại trong `SHOPS`

**Kỹ năng**
- `game.js:1855` `desc:()=>'Phóng phi tiêu tẩm độc — mạnh dần theo tầng Thuần Thục Venom.'`
- `game.js:1860` `reqTxt:'Stoneform tầng 1 (Thuần Thục)'`
- `game.js:1869` `name:'Archery (bị động)'`
- `game.js:2059` `'+14% sát thương của chiêu này (dồn theo bậc)'`
- `game.js:15697` `per:'+0.5% tỉ lệ ST Hoàn Hảo (×2 sát thương)'`

**Quái / boss**
- `game.js:661` `name:'Axie Heo Rừng'`
- `game.js:665` `name:'Thủ Lĩnh Gloam'`
- `game.js:6693` `name:'Chúa Heo Rừng'`
- `game.js:570` `'Cường Thể'` (dị biến)
- `game.js:5001` `'Đầu Lĩnh Gloam'`

**NPC / nhiệm vụ**
- `game.js:1822` `name:'Trưởng Làng'`
- `game.js:5059` `'Kẻ Rơi Xuống'` (tên nhiệm vụ chương I)
- `game.js:8302` `'🧪 Máu thấp — bấm R uống Bình Thuốc (còn …)'`
- `game.js:22092` thoại dài về Chimera Cầu Gai
- `game.js:5738` `'Không có món nào ở mức "…"'`

**Nhãn giao diện**
- `game.js:1108` `'⛨ CỬA KHOÁ'`
- `game.js:1810` `'Cổng Thành'`
- `game.js:5567` `'ĐANG MẶC'`
- `game.js:2165` `'Đã tối đa 120/120 · +…% sát thương · −…% hồi chiêu …'`
- `index.html:43` `📜 Nhiệm Vụ`, `index.html:55` `title="Nhân vật (C) — Thú Chiến · Ascension · Rèn Luyện · Tấn Chức"`

**Thông báo lúc chơi**
- `game.js:5370` `'… đã theo bạn!'`
- `game.js:5578` `` `Chưa đủ cấp — cần LV${need}` ``
- `game.js:5785` `'⚡ Tự mặc … (+… LC)'`
- `game.js:5848` `'Thần Binh đã THỨC TỈNH — tối đa!'`
- `game.js:23797` `'⚔ BOSS SĂN xuất hiện: '`

### Mức độ "máy làm được" của từng nhóm

Phân theo độ dài chuỗi (chuỗi khác nhau):

| Nhóm | ≤24 ký tự (danh từ ngắn, dịch theo bảng thuật ngữ) | 25-80 (một câu) | >80 (văn xuôi, phải viết tay) |
|---|---|---|---|
| Vật phẩm | 522 | 128 | 12 |
| Kỹ năng | 252 | 141 | 11 |
| Cốt truyện | 210 | 68 | 46 |
| Giao diện | 167 | 244 | 223 |
| NPC/nhiệm vụ | 143 | 66 | **104** |
| Quái/boss | 128 | 69 | 3 |
| Thông báo | 75 | 139 | 26 |
| Cheat | 27 | 39 | 17 |
| Khác | 55 | 38 | 7 |
| **Tổng** | **1.579** | **932** | **449** |

`MASTERY_CLASS` là khối lặp nhất: 252 chuỗi rút về **190 khuôn** khi thay số bằng `#`
(ví dụ 8 lần `+#% chỉ số chính của Vũ Khí`, 6 lần `+#% Công Kích`) → trích khoá bằng script rất
gọn. Ngược lại `WEAPON_LINES` 224 chuỗi cho ra 223 khuôn — toàn tên riêng, không rút gọn được.

---

## 3. Chỗ LẪN LỘN hai ngôn ngữ trong cùng một câu

Máy quét được **217 chuỗi** vừa có dấu tiếng Việt vừa có một từ tiếng Anh thông thường
(đã loại HTML, đã loại biểu thức `${…}`, đã loại danh từ riêng trong bảng trắng).

### 3.0 Trước hết: ba giả thuyết kiểm tra ra SAI, ghi lại để khỏi ai đào lại

1. **"Danh từ riêng MU Online lọt vào chữ người chơi thấy."** SAI. `Lorencia` (3), `Devil Square`
   (2), `Blood Castle` (2) đều **chỉ nằm trong chú thích**: `game.js:927, 1640, 9837, 23482,
   23713`. Không chuỗi nào ra màn hình. `Kundun` 30 lần, tất cả là "Box Kundun" — ngoại lệ đã
   duyệt.
2. **"Còn tàn dư tu tiên trong chữ người chơi thấy."** Gần như SAI: `cảnh giới`, `đan điền`,
   `kinh mạch`, `chân khí`, `tu vi`, `độ kiếp`, `bí kíp`, `môn phái`, `giang hồ`, `phi thăng` =
   **0 lần**. `Tộc` có 8 lần nhưng **cả 8 đều trong chú thích** (`game.js:1887, 16947, 24160,
   24162, 24193, 24197`). Còn đúng một vết: xem §3.4 ("cảnh" làm lượng từ cho Ascension).
3. **"Bản `en` trong `i18n.js` còn khoá chưa dịch."** SAI — xem §4.

### 3.1 Viết tắt chỉ số tiếng Anh nằm trong câu tiếng Việt, trong khi bản tiếng Việt của chính nó cũng đang được dùng

Đây là loại lỗi nặng nhất vì nó **tự mâu thuẫn với chính nó**, đôi khi trong cùng một câu.

**HP (39 lần) ↔ "Sinh Lực" (40) ↔ "máu/Máu" (30)** — ba tên cho một chỉ số:

- `game.js:302` — `vit:{ name:'Sinh Lực', desc:'HP tối đa, hồi phục' }`
  → **cùng một dòng**: tên chỉ số là "Sinh Lực", mô tả nó lại là "HP".
- `game.js:19066` — `` `Hồi ${…}% máu (~${…} HP)` `` → "máu" và "HP" trong một câu.
- `game.js:20818` — cùng câu đó, bản trong cửa hàng.
- `game.js:20822` — `` `Hồi đầy máu và Mana — đang … HP · … Mana` `` → "máu" rồi "HP" cách nhau 4 từ.
- `game.js:15763` — `'+0.7% Sinh Lực và +0.5% Mana tối đa'` (dùng "Sinh Lực")
  vs `game.js:3316` — `'+15% HP tối đa'` (dùng "HP") — cùng loại dòng cộng chỉ số.

**ST (28) ↔ "Sát Thương" (35) / "sát thương" (58)**:

- `game.js:15697` — `'+0.5% tỉ lệ ST Hoàn Hảo (×2 sát thương)'` → **hai cách viết trong một câu**.
- `game.js:15750` — `'+0.45% tỉ lệ ST Hoàn Hảo (×2 sát thương)'` → y hệt.
- `game.js:15568` `'ST Kỹ Năng'` vs `game.js:15713` `'+1.2% Sát Thương Kỹ Năng'` → cùng một khái
  niệm, hai nhãn.

**Lv / LV (17) ↔ "cấp" (144)**:

- `game.js:2118` và `game.js:2215` — `'Kỹ năng đã đạt cấp tối đa (Lv 120)!'` → "cấp" rồi "Lv"
  trong một câu 7 chữ.
- `game.js:5578` — `` `Chưa đủ cấp — cần LV${need}` `` → y hệt.
- `game.js:20123` — `` `Cần LV${itemReqLv(it)} để mặc ${it.name}!` ``
  vs `game.js:22740` — `'"…" cần cấp … (hiện tại …) — hãy rèn luyện thêm!'` → cùng chức năng
  (chặn vì thiếu cấp), hai cách gọi.
- `game.js:2082` — `'Tinh Thông · Lv40'`, `'Lão Luyện · Lv80'`, `'Đại Sư · Lv120'`.

**EXP (12) ↔ "Kinh Nghiệm" (2)**: `game.js:845` `'Bãi EXP khổng lồ…'`, `game.js:15812`
`'+0.9% EXP và +0.25% tỉ lệ quái rớt đồ'`, `game.js:22641/22649/22651` `'Thưởng: … EXP · …'`.
Bản tiếng Việt "Kinh Nghiệm" chỉ còn tồn tại trong bảng `TERMS` của `lang.js:21` — tức là **bản
tiếng Việt đã bị đẩy hết ra khỏi `game.js`**, chỉ còn EXP. Đây là trường hợp *đã gần như nhất
quán rồi*, chỉ cần chốt chính thức.

**Qi (4) ↔ "Mana" (43)** — nghiêm trọng gấp đôi vì "Qi" vừa lẫn ngôn ngữ vừa là từ kiếm hiệp:

- `game.js:232` — `name:'Hạ địch hồi Qi'` (dòng Hoàn Hảo trên vũ khí)
- `game.js:3083` — `buffTxt:'+5% hồi Qi'` (buff mùa Hạ)
- `game.js:2160` — `title="… hồi chiêu/thiếu Qi thì tự quay về đòn thường"`
- `game.js:7846` — `` addFloat(…, `+${player.excQi} Qi`, …) `` — chữ nổi lên đầu quái
- Trong khi ô chỉ số trên bảng Nhân Vật ghi `game.js:14589` `['Mana', …]`, và
  `game.js:20288` `'Không đủ Mana!'`, `game.js:19067` `'Lọ Mana'`.
  → **Cùng một tài nguyên, hai tên, cả hai đều tiếng Anh/Hán, không tên nào tiếng Việt.**
  `lang.js:31` còn dịch `'hút mana' → 'Qi steal'`, tức là bản tiếng Anh cũng dính "Qi".

### 3.2 Từ lóng game tiếng Anh lọt vào câu tiếng Việt

| Từ | Số chỗ | Ví dụ có số dòng | Bản tiếng Việt đang tồn tại song song |
|---|---|---|---|
| `boss` / `Boss` / `BOSS` | **28** | `game.js:781` "Phó bản 3 đợt quái + **Boss** — **farm** Đá Thăng Cấp…"; `game.js:9829` `'⚠ Lãnh Địa Boss'`; `game.js:22418` `'BOSS VÙNG — cần tự đánh tay, AUTO không tự đánh boss'`; `game.js:23797` `'⚔ BOSS SĂN xuất hiện: '`; `game.js:2217` `'Hết Sách Kỹ Năng — rơi từ tinh anh/boss'` | "Thủ Lĩnh" 10 (`game.js:665, 6696`), "Chúa …" 13 (`game.js:6693, 6694`), "Đầu Lĩnh" (`game.js:5001`), "Đầu Mục" (`game.js:6698`) |
| `AUTO` / `auto` | **19** | `game.js:1456` `'Đang AUTO — tắt AUTO (Z) để tự đi chỗ khác'`; `game.js:8870` `'Boss này phải tự tay chiến — AUTO đã khoá!'`; `game.js:14502` `'⚔ AUTO FARM: BẬT — ôm 1-2 bãi quái…'`; `game.js:14513` `'⚔ AUTO: BẬT'`; `index.html:37` `title="Auto farm — treo máy: …"` | "tự động" 3 (`game.js:19959`), "Tự Chỉnh" 3 (`game.js:21809`) — chính bảng Cài Đặt đã dùng tiếng Việt cho khái niệm y hệt |
| `farm` / `FARM` | **6** | `game.js:781`; `game.js:8979` `'⚠ Hết thuốc — auto farm không tự hồi máu được!'`; `game.js:14502`; `game.js:20019` `'Túi trống — hãy đi farm quái!'` | "Cày" 6 (`game.js:882`, `game.js:898`), "săn quái", "luyện cấp" (`game.js:863`) |
| `buff` | **5** | `game.js:508` "…đồng thời phủ **buff** lên cả đội…"; `game.js:16463` "Chimera không tự mạnh lên — nó **buff cho bạn**"; `game.js:20238` "1 chính · 1 phụ · 1 **buff** · 1 tuyệt chiêu"; `game.js:22092` "nhớ bật **buff** của lớp (phím 3)" | `game.js:1908` `'Ban phước: hồi ngay 25% HP tối đa…'` — cùng loại hiệu ứng, gọi là "Ban phước" |
| `Tank` / `Combo` | 1 chuỗi | `game.js:499` `role:'Tank / Combo cận chiến'` (nhãn vai trò của Dark Knight, hiện trên bảng chọn lớp) | Các dòng vai trò khác quanh đó đều tiếng Việt |
| `AoE` | 1 | `game.js:1866` `'Sóng xung kích bóng tối quét sạch quanh người (AoE lớn).'` | `game.js:1856` dùng `'sát thương lan'` cho đúng khái niệm đó |
| `pity` | 1 | `game.js:16746-16749` "…lượt 90 **bảo đảm** — gộp cả **pity** là 1,6%" | **cùng một đoạn** đã dùng "bảo đảm" hai lần rồi mới chèn "pity" |
| `minimap` / `Minimap` | 3 | `game.js:8080` `'…bấm minimap để tới bãi khác'`; `game.js:21442`; `game.js:23212` `'Minimap hiện cả điểm Thảo Dược'` | `index.html:39` `title="Bản đồ thu nhỏ (U)"` — nút thì tiếng Việt, chữ trong game thì tiếng Anh |
| `console` / `save` / `TEST MODE` | 5 | `game.js:15368` `'✘ Kết hợp lỗi — xem console'`; `game.js:16873` `'TEST MODE — nhấn ` … mở console, gõ /help xem lệnh'`; `game.js:17028`; `game.js:23432` `'☁ Có save cloud mới hơn — tải lại trang…'` | Chỉ `game.js:15368` và `23433` là người chơi thường thấy; phần còn lại là màn dev |

### 3.3 Danh từ riêng — HỢP LỆ, không tính là lỗi

Đã kiểm và **không** đưa vào danh sách lỗi: `Lunaris City` (23), `Thornwood Reach` (12+20),
`Hollow Roost` (13+16), `Frostmire Vale` (20+14), `Ashen Steppe` (14+14), `Stormgate Pass`
(19+14), `Petalshade Isle` (13+10), `Petalshade Outskirts` (9), `Ardhaven` (6);
`Dark Knight` (18 lần chữ "Dark"), `Dark Wizard`, `Sylvan Ranger` (4), `Spellblade` (4),
`Dark Lord` (6); `Chimera` (47), `Axie` (24), `Lunacia` (30), `Sigil`; `Morvahn` (27),
`Vaeldra` (24), `Gloam` (34), `Rell` (10), `Brann`, `Corran` (6), `Wren`, `Sylas`, `Liora`,
`Dax`, `Ashmark`. Cũng hợp lệ: **35/35 tên chiêu trong `VOHOC_DEFS`** đều tiếng Anh
(`game.js:1893-1947`: `Cyclone`, `Lunge`, `Impale`, `Falling Slash`, `Rageful Blow`,
`Swell Life`, `Undying Will`…) — đây là lựa chọn nhất quán kiểu MU, giữ nguyên.

### 3.4 Vùng xám: tên hệ thống bằng tiếng Anh, nhưng anh em cùng cấp lại tiếng Việt

Không phải "lẫn lộn" theo nghĩa hỏng câu, mà là **không nhất quán ở cấp danh pháp**. Cần một
quyết định thiết kế, sau đó mới sửa được.

**a) `PASSIVE_SKILLS` — 5 mục, 2 tên Anh 3 tên Việt, trong cùng một mảng** (`game.js:1868-1874`):

```
1869  { name:'Archery (bị động)',   … desc:'…theo tầng Archery.' }
1870  { name:'Rupture (bị động)',   … desc:'…— Ascension cảnh 4.' }
1871  { name:'Phản Đòn (bị động)',  … }
1872  { name:'Bất Tử (bị động)',    … }
1873  { name:'Khát Huyết',          … }
```

Đây là bằng chứng rõ nhất: **cùng một danh sách, cùng một loại nội dung, hai ngôn ngữ.**

**b) Hệ Thuần Thục — vỏ tiếng Việt, ruột tiếng Anh.** Tên hệ là "Thuần Thục" (15 lần), nhưng ba
nhánh của nó là `Venom` / `Archery` / `Stoneform`:
`game.js:19079` `'Nâng Thuần Thục (Venom / Archery / Stoneform)'`,
`game.js:20587` cùng chuỗi trong `SHOPS`, `game.js:1860` `'Stoneform tầng 1 (Thuần Thục)'`,
`game.js:1863` `'Archery tầng 1 (Thuần Thục)'`.

**c) Tiền tệ — 4 tiếng Việt, 1 tiếng Anh.** `game.js:17092`:
`'/silver /khi /mat /dan /bikip — bạc · Instinct · Huyền Thiết · Tiên Đan · Sách'`
→ **một dòng liệt kê năm loại tiền, bốn tên tiếng Việt xen một tên tiếng Anh.**
`Instinct` xuất hiện 15 lần (`game.js:2125, 2126, 2177, 5072, 14594, 17092, 20227,
20242, 23380, 23753, 23908, 23970, 23992, 24049, 24135`), trong khi `game.js:23219` lại viết `'Mở nhánh Bản Năng
nhanh hơn +25%'` và `game.js:23906` `'…bản năng vẫn âm thầm mài giũa…'` — **bản tiếng Việt của
chính từ đó đã tồn tại trong game rồi.**

**d) `Ascension` + lượng từ "cảnh" — vừa lẫn ngôn ngữ vừa chạm vùng cấm.**
`game.js:1870` `'…— Ascension cảnh 4.'`, `1871` `'…— Ascension cảnh 5 / trang bị.'`,
`1872` `'…— Ascension cảnh 8.'`, `game.js:25239` `'Cần đạt Radiant Core (cảnh 5, tự động ở cấp
60) để Thăng Linh…'`.
Nhưng `game.js:16800` viết `'Giữ nguyên trang bị, Ascension bậc, kỹ năng đã học…'` — **dùng
"bậc"**. Hai lượng từ cho một thứ, và "cảnh" là nửa còn lại của "cảnh giới" mà CLAUDE.md cấm
hẳn. Chỗ này nên đổi hết sang **"bậc"**, không tranh cãi.

**e) `The Calling` (5 lần)** — `game.js:8016` `'Mở khóa: the Calling — 5 lớp để chọn!'`
(chữ "the" thường), `game.js:20238` và `game.js:20256` `'…trả lời The Calling ở cấp 10…'`,
`game.js:20563` `'Chưa gia nhập lớp — trả lời The Calling ở cấp 10 (K)'`, `game.js:24216`
`'…muốn đáp lời Calling…'` (rụng mất "The").
Ba cách viết cho một cái tên: `the Calling`, `The Calling`, `Calling`.

**f) Tên quái — 27 tiếng Việt / 5 tiếng Anh trong cùng bảng `MOBS`** (`game.js:660-700`):
`game.js:664` `'Gloam Marauder'` nằm giữa `game.js:663` `'Tay Sai Gloam'`,
`game.js:677` `'Gloam Cựu Binh'`, `game.js:679` `'Trinh Sát Gloam'` — **cùng một phe, một con
tiếng Anh ba con tiếng Việt.** Tương tự `game.js:685` `'Axie Golem'` trong khi boss cùng loại là
`game.js:6704` `'Golem Gỗ Cổ Đại'`.
(Ghi thêm, không thuộc phạm vi ngôn ngữ: `game.js:697` và `698` **trùng tên** `'Axie Lang Thang'`
cho hai con khác cấp.)

---

## 4. Chỗ tiếng Anh bị lẫn tiếng Việt

**Trong `strings/en.js`: 0 khoá còn tiếng Việt.** Cả 11 khoá (`strings/en.js:5-15`) đều là tiếng
Anh sạch, và `strings/vi.js:5-15` đối xứng đủ 11 khoá. Giả thuyết "bản `en` làm dở dang, còn khoá
chưa dịch" **kiểm tra ra sai** — vì bản `en` mới chỉ có 11 khoá, chưa kịp dở dang.

**Trong `lang.js` (lớp thật sự sinh ra tiếng Anh): 0/811 giá trị đích còn dấu tiếng Việt.**
(Một kết quả dương giả duy nhất là `lang.js:144` `'☯ Hậu Bối' → '☯ Protégé'` — chữ `é` trong
tiếng Pháp, không phải tiếng Việt.)

**Nhưng tiếng Anh vẫn ra lẫn tiếng Việt, qua ba đường khác:**

**(i) 1.925 chuỗi không lớp nào phủ (§1.2).** Bật `en` là chúng hiện nguyên tiếng Việt. Đây là
nguồn lẫn lộn lớn nhất, đúng như chú thích ở `i18n.js:20-25` mô tả.

**(ii) 5 luật trong `RULES` nhả thẳng đoạn tiếng Việt bắt được ra output tiếng Anh** — không gọi
`tr()` cũng không gọi `trFrag()` lên nhóm bắt được:

| Dòng | Luật | Hậu quả |
|---|---|---|
| `lang.js:787` | `` `Fragment (${a})` `` | `a` là tên tàn quyển, giữ nguyên tiếng Việt |
| `lang.js:788` | `` `Dungeon · ${a}` `` | `a` là tên phó bản, giữ nguyên tiếng Việt |
| `lang.js:797` | `` `Reward: ${a}` `` | **toàn bộ phần thưởng** ra tiếng Việt sau chữ "Reward:" |
| `lang.js:798` | `` `Progress: ${a} · Reward: ${b}` `` | cả tiến độ lẫn phần thưởng ra tiếng Việt |
| `lang.js:833` | `` ` · ${a} Qi · ${b}` `` | `b` (mô tả chiêu) ra tiếng Việt, **và** thay "mana" thành "Qi" |

**(iii) 419 luật chết (53,2 %) khiến chuỗi tưởng có bản dịch nhưng thực ra không.** Ví dụ sống:
`lang.js:574` có `'Unclassed lang bạt — chưa gia nhập Tộc nào' → 'Unclassed drifter — not yet
pledged to any sect'`, nhưng `game.js:14525` giờ viết `'Unclassed lang bạt — chưa gia nhập **Lớp**
nào'`. Chữ đổi từ "Tộc" sang "Lớp", luật không đổi theo → **khớp trượt, dòng đó ra tiếng Việt
nguyên si khi chơi bản en.**

**(iv) Bản tiếng Anh còn dính từ vựng kiếm hiệp Trung Hoa**, tức là "tiếng Anh chưa thuần tiếng
Anh của game này": `lang.js:31` `'hút mana' → 'Qi steal'`; `lang.js:136` `'⚡ Chain Strike —
free Qi!'`; `lang.js:833` và `lang.js:843` (`'tiêu hao Qi' → 'Qi cost'`); `lang.js:534`
`"another sect's art"`; `lang.js:566` `'Ma Phái' → 'Demonic Sect'`; `lang.js:574` `'…any sect'`;
cùng cụm chết ở `lang.js:55, 56, 60, 68, 256, 268, 282, 342` (`Ming Cult`, `Duan Clan`,
`Peach Blossom Island`, `Xiangyang City`, `Qilin Hunt`, `Celestial Being`…).

---

## 5. Thuật ngữ dịch không nhất quán

Đếm trên chuỗi người chơi thấy trong `game.js` (đã bỏ HTML và `${…}`).

| Khái niệm | Các cách đang gọi · số lần | Đề xuất chốt | Vì sao |
|---|---|---|---|
| Chỉ số sinh lực | `Sinh Lực` 40 · `HP` 39 · `máu`/`Máu` 30 | **Sinh Lực** (nhãn chỉ số) + **máu** (văn nói: "hồi máu") | "Sinh Lực" đã là `name` chính thức ở `game.js:302`; bỏ hẳn `HP` khỏi chữ tiếng Việt |
| Sát thương | `sát thương` 58 · `Sát Thương` 35 · `ST` 28 | **Sát Thương** | `ST` chỉ tiết kiệm 8 ký tự nhưng đẻ ra câu lai ở `game.js:15697, 15750` |
| Tài nguyên tung chiêu | `Mana` 43 · `Qi` 4 | **Mana** | MU dùng Mana; `Qi` vừa lẻ loi vừa là từ kiếm hiệp (vi phạm QUY TẮC SỐ 1) |
| Kinh nghiệm | `EXP` 12 · `Kinh Nghiệm` 0 trong `game.js` | **EXP** (thanh HUD + dòng thưởng) | Bản tiếng Việt đã tuyệt chủng khỏi `game.js`; chốt EXP là ít việc nhất, chỉ cần ghi vào bảng thuật ngữ |
| Cấp độ | `cấp`/`Cấp` 144 · `Lv`/`LV` 17 | **cấp / Cấp** | 144 : 17, và `game.js:2118` tự mâu thuẫn ngay trong một câu |
| Quái đầu sỏ | `boss`/`Boss`/`BOSS` 28 · `Thủ Lĩnh` 10 · `Chúa …` 13 · `Đầu Lĩnh` 1 · `Đầu Mục` 1 | **Trùm** (chung), **Trùm Vùng** / **Trùm Săn** (cụ thể). Giữ `Thủ Lĩnh`, `Chúa`, `Đầu Lĩnh`, `Đầu Mục` **chỉ như một phần tên riêng của quái**, không dùng làm tên loại | "Thủ Lĩnh Gloam" là tên một con cụ thể (`game.js:665`), không thể kiêm luôn nghĩa "boss nói chung"; "Trùm" là tiếng Việt phổ thông, không rơi vào nhóm cấm |
| Treo máy đánh tự động | `AUTO`/`auto` 19 · `tự động` 3 · `Tự Chỉnh` 3 | **TỰ ĐÁNH** (nút + banner), **chế độ tự đánh** (văn xuôi) | Vừa đủ ngắn cho nút HUD; bảng Cài Đặt đã dùng tiếng Việt cho khái niệm cùng loại |
| Đi đánh quái lấy đồ | `farm`/`FARM` 6 · `Cày` 6 · `săn quái` 1 · `luyện cấp` 1 | **cày** | Đã có sẵn 6 lần trong lore vùng (`game.js:882, 898`), tiếng Việt phổ thông |
| Hiệu ứng tăng sức | `buff` 5 · `Ban phước` 1 | **phù trợ** (danh từ: "chiêu phù trợ") / **tăng lực** (động từ) | `Ban phước` chỉ hợp cho chiêu hồi máu cụ thể ở `game.js:1908`, không bao được nghĩa chung |
| Mốc bảo đảm gacha | `pity` 1 · `bảo đảm` 4 | **bảo đảm** | Cùng đoạn `game.js:16746-16749` đã dùng "bảo đảm" trước rồi |
| Bản đồ nhỏ | `minimap`/`Minimap` 3 · `bản đồ thu nhỏ` 1 | **bản đồ thu nhỏ** | `index.html:39` đã đặt như vậy trên nút |
| Sát thương diện rộng | `AoE` 1 · `sát thương lan` 1 | **sát thương lan** | `game.js:1856` đã dùng |
| Tiền nâng kỹ năng | `Instinct` 15 · `Bản Năng` 2 · (khoá lưu là `player.khi`) | **Bản Năng** | Bốn loại tiền còn lại đều tiếng Việt (`game.js:17092`); giữ `Instinct` là để một mình nó lạc |
| Hệ thăng bậc | `Ascension` 5, lượng từ `cảnh` 4 vs `bậc` 1 | Lượng từ: **bậc** (bắt buộc, "cảnh" chạm vùng cấm). Tên hệ: chốt một trong hai, `Ascension` hoặc bản Việt, rồi dùng đều | `game.js:16800` đã dùng "bậc"; `game.js:1870-1872` dùng "cảnh" |
| Sự kiện chọn lớp cấp 10 | `The Calling` 4 · `the Calling` 1 · `Calling` 1 | **The Calling** (viết hoa cả cụm, luôn đủ "The") | Ba cách viết ở `game.js:8016, 20238, 24217` |
| Bạn đồng hành | `Chimera` 47 · `Linh Thú` 12 · `Thú Chiến` 3 · `pet` 1 | **Chimera** cho sinh vật; **Linh Thú** cho *hệ thống/ô trang bị* nếu vẫn muốn giữ hai lớp khái niệm; **bỏ hẳn `Thú Chiến`** | `Chimera` vừa là tên quái (`game.js:682, 686, 688`) vừa là bạn đồng hành (`game.js:16463`) → cần tách bằng ngữ cảnh, không bằng tên. `Thú Chiến` chỉ còn 3 lần lẻ (`game.js:836`, `index.html:55`) |
| Thú cưỡi | `thú cưỡi` 3 · `Tuấn Mã` 7 · `ngựa` 3 | **Thú Cưỡi** (hệ thống) + **Tuấn Mã Hoang** (con vật bắt được) | Hai thứ khác nhau, đang bị dùng lẫn ở `game.js:22141` |
| Lớp nhân vật | `lớp` 33 · `Lớp` 9 · `Phái` 10 (trong "Trấn Phái") · `phái` 1 | **Lớp** | `game.js:299` viết `'…(tùy lớp)'` còn `game.js:300` ngay dưới viết `'…(tùy phái)'` — **hai dòng liền nhau, hai từ khác nhau, cùng nghĩa**. "Trấn Phái" là tên riêng của loại tuyệt kỹ, giữ nguyên |
| Vai trò trong đội | `Tank / Combo` 1 (tiếng Anh) vs các dòng vai trò khác (tiếng Việt) | Dịch hết sang tiếng Việt: **Chịu Đòn / Liên Đòn** | `game.js:499`; "Liên Trảm"/"Liên Đòn" đã là từ vựng sẵn có của game |

*(Không đề xuất từ nào rơi vào nhóm cấm: cảnh giới, đan điền, kinh mạch, chân khí, tu vi, độ
kiếp, bí kíp, môn phái, giang hồ, "Tộc", phi thăng. Không dùng danh từ riêng MU Online,
Blizzard hay HoYoverse.)*

---

## 6. Đề xuất thứ tự làm

### Đợt 0 — Chốt bảng thuật ngữ (nửa ngày, không đụng mã)
Viết `docs/THUAT_NGU.md` từ bảng §5: mỗi khái niệm một dòng, cột "dùng", cột "cấm dùng". Mọi đợt
sau tham chiếu tệp này. **Không làm bước này thì bốn đợt sau sẽ đẻ ra bất nhất mới.**
Rủi ro: 0. Công sức: nhỏ. Phải người quyết định, không phải script.

### Đợt 1 — Thay viết tắt tiếng Anh 1-1 trong chuỗi tiếng Việt (script + soát tay)
Phạm vi: `HP`→`Sinh Lực`/`máu` (39), `ST`→`Sát Thương` (28), `Lv`/`LV`→`cấp` (17),
`Qi`→`Mana` (4). Khoảng **88 lần thay**, tập trung dày ở `MASTERY_CLASS` (`game.js:15617` trở đi)
và `CHI_KY` (`game.js:3589` trở đi).

Làm được bằng script **nhưng script phải chỉ chạm string literal**, vì `player.qi`, `maxQi`,
`excQi`, `player.level` là định danh mã — đổi nhầm là hỏng game. Dùng lại đúng bộ đọc token của
khảo sát này (đọc literal + số dòng), sinh patch, rồi mắt người duyệt.
Chỗ phải đọc tay: `game.js:19066, 20818, 20822` (câu có cả "máu" lẫn "HP" — phải viết lại câu,
không thay từ), và `game.js:302` (mô tả của chính chỉ số "Sinh Lực").
Rủi ro: thấp-trung bình. Đây là đợt đổi được nhiều nhất trên mỗi giờ công.

### Đợt 2 — Dịch từ lóng game (đọc từng chỗ, ~65 chỗ)
`boss` 28 · `AUTO` 19 · `farm` 6 · `buff` 5 · `minimap` 3 · `console`/`save` 3 · `pity` 1 ·
`AoE` 1 · `Tank/Combo` 1.
**Bắt buộc đọc từng chỗ** — hầu hết là câu ngắn phải viết lại, không phải thay từ:
`game.js:14502` (`'⚔ AUTO FARM: BẬT — ôm 1-2 bãi quái…'`) và `game.js:22418`
(`'BOSS VÙNG — cần tự đánh tay, AUTO không tự đánh boss'`) mỗi câu dính hai từ cùng lúc.
Nhớ kèm `index.html:37` (`title="Auto farm — treo máy…"`).
Rủi ro: thấp (chuỗi ngắn, dễ thử). Công sức: một buổi.

### Đợt 3 — Chốt danh pháp hệ thống (cần quyết định trước, rồi rename máy móc)
Bốn quyết định, mỗi cái một dòng trong `docs/THUAT_NGU.md`:
1. `Instinct` → `Bản Năng`? (15 chỗ + khoá lưu `player.khi` giữ nguyên)
2. `Ascension`: giữ tiếng Anh hay dịch? — **nhưng lượng từ `cảnh` → `bậc` thì làm ngay không cần
   họp**, 4 chỗ: `game.js:1870, 1871, 1872, 25239`. Đây là vi phạm QUY TẮC SỐ 1 còn sót.
3. `PASSIVE_SKILLS` (`game.js:1868-1874`): 5 mục phải cùng một ngôn ngữ. Đề xuất theo
   `VOHOC_DEFS` (35/35 tiếng Anh) → đổi `Phản Đòn`/`Bất Tử`/`Khát Huyết` sang tiếng Anh, **hoặc**
   đổi `Archery`/`Rupture` sang tiếng Việt. Chọn một.
4. `MOBS` (`game.js:660-700`): 27 Việt / 5 Anh → đề xuất Việt hoá `'Gloam Marauder'`
   (`game.js:664`); xử lý luôn trùng tên `'Axie Lang Thang'` ở `game.js:697` và `698`.
5. `The Calling`: chuẩn hoá 6 chỗ.
Rủi ro: trung bình (đụng tên hiển thị, ảnh hưởng ảnh chụp/tài liệu). Sau khi chốt thì rename
bằng script được.

### Đợt 4 — Dọn `lang.js` (script làm được phần lớn)
1. Xoá **419 mục chết** (53,2 % từ điển) — script tự phát hiện: khoá không tồn tại trong
   `game.js`. Kèm theo là dọn sạch tàn dư kiếm hiệp ở bản tiếng Anh (`Ming Cult`, `Xiangyang
   City`, `Qilin`, `sect`, `Qi` — `lang.js:55, 56, 60, 68, 256, 268, 282, 342, 534, 566, 574`).
2. Sửa **5 luật rò tiếng Việt** ra output tiếng Anh: `lang.js:787, 788, 797, 798, 833` — thêm
   `tr()`/`trFrag()` cho nhóm bắt được. Phải đọc tay, 5 dòng.
3. Sửa luật khớp trượt vì `game.js` đã đổi chữ, ví dụ `lang.js:574` (`Tộc` → `Lớp`).
Rủi ro: thấp (chỉ ảnh hưởng bản `en`, mà bản `en` hiện chỉ phủ 13,4 %). Nên làm **sau** Đợt 1-3
để khỏi phải sửa từ điển hai lần.

### Đợt 5 — Chuyển thật sang `t()` (dài hạn, chạy song song với nội dung)
2.865 chuỗi. Theo thứ tự dễ→khó, đúng như `docs/I18N_MIGRATION_GUIDE.md` gợi ý nhưng gắn số:
1. **Nhãn giao diện ngắn** — nhóm "Giao diện" 167 chuỗi ≤24 ký tự. Script trích được khoá + chuỗi,
   người chỉ viết bản tiếng Anh.
2. **Tên vật phẩm & kỹ năng** — 522 + 252 = **774 chuỗi ≤24 ký tự**. Đây là phần lớn nhất và cũng
   máy móc nhất: gần như toàn danh từ, dịch theo bảng thuật ngữ. `MASTERY_CLASS` rút 252 chuỗi về
   190 khuôn nên có thể sinh khoá theo khuôn.
3. **Tên quái/boss + cốt truyện ngắn** — 128 + 210 chuỗi ≤24 ký tự.
4. **Câu một dòng** — 932 chuỗi 25-80 ký tự. Nửa máy nửa người.
5. **Văn xuôi** — **449 chuỗi >80 ký tự**, trong đó `renderSettings`/giao diện 223 và
   NPC/nhiệm vụ 104. **Bắt buộc viết tay**, và theo hướng dẫn migration thì nên làm cùng lúc với
   đợt viết lại cốt truyện, không tách rời.
6. **Cuối cùng**: `cheatHelp` 83 chuỗi (chỉ dev thấy) và `index.html` 39 dòng.

**Tóm tắt "máy làm được / phải đọc tay":**

| Đợt | Script làm được | Phải đọc từng chỗ |
|---|---|---|
| 0 | — | toàn bộ (quyết định) |
| 1 | ~73/88 lần thay | ~15 câu lai |
| 2 | — | toàn bộ ~65 chỗ |
| 3 | rename sau khi chốt | 5 quyết định |
| 4 | 419 mục chết | 5 luật rò + vài luật trượt |
| 5 | trích khoá, sinh khung `vi.js`/`en.js` cho ~1.579 chuỗi ngắn | 449 chuỗi văn xuôi + duyệt bản dịch |

**Nên bắt đầu từ Đợt 0 rồi Đợt 1.** Lý do: Đợt 1 gỡ đúng loại lỗi chủ dự án khó chịu nhất (câu
tiếng Việt bị chèn `HP`, `ST`, `Lv`, `Qi`), rẻ nhất trên mỗi lỗi gỡ được, và không đụng gì tới
kiến trúc — nên chạy song song an toàn với phiên đang sửa `game.js`. Đợt 5 tuy là đích cuối
nhưng nếu làm trước Đợt 0-3 thì sẽ đóng băng luôn cả đống thuật ngữ bất nhất vào từ điển khoá,
và lúc đó sửa đắt gấp đôi.
