# Prompt sinh art nhân vật cho toàn bộ NPC

Khảo sát đọc thẳng từ `public/game/game.js` (bảng `NPCS`, `MAPS`, `SHOPS`, `drawNpc()`,
`npcHead()`) và thư mục `public/game/assets/npcs/`. Ràng buộc lấy từ `CLAUDE.md`
(Quy tắc số 1 & số 2) và `.claude/skills/spine-nuong/SKILL.md`.

**Tổng số NPC: 20.**

---

## 1. Bảng tóm tắt

| # | id | Tên hiển thị | Vai trò | Map (tên trong game) | Tệp art đang dùng |
|---|---|---|---|---|---|
| 1 | `truonglang` | Trưởng Làng | Giao nhiệm vụ — 9/10 nhiệm vụ mở đầu | `daohoa` · Petalshade Isle | `truonglang.png` |
| 2 | `duocsu` | Dược Sư | Giao nhiệm vụ (phụ tuyến hái thảo dược) | `daohoa` · Petalshade Isle | `duocsu.png` |
| 3 | `quachtinh` | Trưởng Lão Rell | Cốt truyện — dẫn Chương II | `tuongduong` · Lunaris City | `quachtinh.png` |
| 4 | `monkhach` | Trinh Sát Wren | Cốt truyện — dẫn đường bản địa | `tuongduong` · Lunaris City | `monkhach.png` |
| 5 | `daosi` | Người Gác Rừng Corran | Cốt truyện — dẫn Chương III | `chungnam` · Thornwood Reach | `daosi.png` |
| 6 | `thumo` | Sylas, Người Giữ Tổ | Cốt truyện — dẫn Chương IV | `comoc` · Hollow Roost | `thumo.png` |
| 7 | `ttmon` | Liora, Ẩn Sĩ Frostmire | Cốt truyện — dẫn Chương V | `tuyettinh` · Frostmire Vale | `ttmon.png` |
| 8 | `noiung` | Dax, Kẻ Do Thám | Cốt truyện — dẫn Chương VI | `mongco` · Ashen Steppe | `noiung.png` |
| 9 | `laotuong` | Lão Tướng Brann | Cốt truyện — dẫn Chương VII | `nhanmon` · Stormgate Pass | `laotuong.png` |
| 10 | `thoren` | Thợ Rèn · Lò Rèn Hoàng Gia | Rèn / nâng cấp trang bị | `tuongduong` · Lunaris City | `thoren.png` |
| 11 | `thoren_dao` | Thợ Rèn Lưu Vong | Rèn / nâng cấp (lò dự phòng cấp 5) | `daohoa` · Petalshade Isle | `thoren.png` *(dùng chung)* |
| 12 | `duoclao` | Nhà Giả Kim · Tiệm Thuốc | Bán đồ — bình thuốc, mana, đá thăng cấp | `tuongduong` · Lunaris City | `duoclao.png` |
| 13 | `binhkhi` | Binh Khí Chủ · Vũ Khí Phường | Bán đồ — tiệm duy nhất bày hàng thật | `tuongduong` · Lunaris City | `binhkhi.png` |
| 14 | `trachu` | Trà Quán Chủ | Bán đồ — nghỉ trọ, hồi phục | `tuongduong` · Lunaris City | `trachu.png` |
| 15 | `bodau` | Bổ Đầu · Truy Nã Lệnh | Dịch vụ — phát lệnh truy nã mỗi ngày | `tuongduong` · Lunaris City | `bodau.png` |
| 16 | `thantoan` | Thương Nhân Vận May · Sảnh Cầu May | Dịch vụ — quay thưởng, tỉ lệ dán công khai | `tuongduong` · Lunaris City | `thantoan.png` |
| 17 | `traichu` | Trại Chủ Mục Đồng | Dịch vụ — bắt & thăng giai thú cưỡi | `ngoai` · Petalshade Outskirts | `traichu.png` |
| 18 | `vandai` | Skyreach Ledge · Vực Thẳm | Mốc thử vận — nhảy vực đổi kỹ năng | `chungnam` · Thornwood Reach | `vachda.png` *(dùng chung)* |
| 19 | `doantruongnhai` | Sorrowfall Cliff · Vực Thẳm | Mốc thử vận — nhảy vực đổi kỹ năng | `tuyettinh` · Frostmire Vale | `vachda.png` *(dùng chung)* |
| 20 | `dinhbiennhai` | Frontier's Edge · Vực Thẳm | Mốc thử vận — nhảy vực đổi kỹ năng | `nhanmon` · Stormgate Pass | `vachda.png` *(dùng chung)* |

### Hiện trạng art

- `drawNpc()` (game.js ~23670) vẽ mỗi NPC bằng **một tấm PNG cao đúng 64 px**, giữ nguyên tỉ lệ
  ngang, cộng một bóng ellipse và biên độ nhấp nhô ±2,2 px lệch pha theo toạ độ. Không có khung
  hình, không có hướng nhìn — NPC là ảnh tĩnh.
- `npcHead()` (game.js ~21625) dùng lại **chính tệp đó** làm chân dung trong mọi panel hội thoại.
  Nghĩa là một tấm ảnh phải đọc được ở cả 64 px trên bản đồ lẫn cỡ chân dung trong bảng.
- Thư mục có **19 tệp**, phục vụ 20 NPC (`thoren.png` dùng cho 2 thợ rèn, `vachda.png` dùng cho
  cả 3 Vực Thẳm). Hai tệp **không nơi nào tham chiếu**: `chaosgoblin.png`, `quangia.png`.
- Art đang lẫn **hai thế hệ**: nhóm ảnh lớn (`truonglang`, `quachtinh`, `daosi`, `monkhach`,
  `thumo`, `ttmon`, `noiung`, `laotuong`, `duocsu`, `vachda`) là sinh vật tròn kiểu thẻ Axie;
  nhóm ảnh nhỏ 6–9 KB (`thoren`, `duoclao`, `binhkhi`, `trachu`, `bodau`, `thantoan`, `traichu`)
  là hình người bé tí, gần như bóng đổ, không có mặt. Đây chính là chỗ "thiếu sống động".
- Canon trong `CLAUDE.md` giải thích được sự lệch đó và ta giữ nguyên nó làm định hướng art:
  **NPC chức năng = người Ardhaven sống sót** (người Vaeldra rơi qua vết nứt cùng khu phố),
  **NPC cốt truyện = dân Lunacia bản địa**.

---

## 2. Ràng buộc bắt buộc — đọc trước khi dán bất kỳ prompt nào

### 2.1 Dư địa bóng dáng — vì sao cấm mũ vành, sừng, chỏm, vai xoè

Art nhân vật do Meowa sinh theo **một bản mẫu Spine chung**. Mọi gói xuất ra dùng **bộ lưới
giống hệt nhau từng byte** (`md5(bones) = 96d71d94`, xem `spine-nuong/SKILL.md`) — tức là Meowa
không dựng hình mới, nó chỉ **tô lại BÊN TRONG một bóng dáng cố định**. Đo dư địa thực tế trên
bóng dáng đó:

| Vùng | Dư địa còn lại |
|---|---|
| Đầu | **gần như 0%** |
| Thân | **~16%** |
| Chân | **~5–8%** |

⇒ Hệ quả không thương lượng được, và **phải viết thẳng vào từng prompt**, không để Meowa tự hiểu:

- **Đầu: không mũ vành rộng, không sừng, không chỏm cao, không mào, không tóc dựng, không búi cao,
  không mũ trùm dựng đứng.** Mọi thứ nhô ra khỏi hộp sọ sẽ bị cắt cụt hoặc bóp méo.
- **Thân: không vai giáp xoè ra ngoài, không áo choàng bay, không cánh, không ba lô cồng kềnh.**
  16% dư địa đủ cho lớp vải dày, đai, túi dẹt — không đủ cho khối lồi.
- **Chân: hai chân đứng gần nhau, không váy xoè, không ủng loe miệng, không đuôi quét đất.**
- Muốn loại thứ gì thì **nói thẳng trong câu** ("hair sits flat to the skull, no brim, no horns"),
  vì mục 2.2 cấm viết khối negative prompt riêng.

### 2.2 Lối viết cho Meowa

- **Câu văn tự nhiên, mạch lạc.** Mỗi prompt 3–6 câu, đọc như đang tả một người cho hoạ sĩ nghe.
- **KHÔNG xếp chồng từ khoá** kiểu `masterpiece, 4k, ultra detailed, best quality`.
- **KHÔNG viết khối negative prompt riêng.** Điều muốn tránh phải nằm trong câu khẳng định.

### 2.3 Phong cách & bản quyền (CLAUDE.md — Quy tắc số 1 & số 2)

- Phong cách **MU Online / dark-fantasy phương Tây**, không phải kiếm hiệp / tiên hiệp.
- Cấm hẳn trong prompt: cảnh giới, đan điền, kinh mạch, chân khí, tu vi, độ kiếp, bí kíp,
  môn phái, giang hồ, "Tộc", phi thăng — và cả dạng phiên âm như "Qi", "chi", "dao", "wuxia",
  "cultivator", "sect".
- Cấm mọi tên riêng của MU Online (Lorencia, Noria, Devias, Icarus, Atlans, Tarkan, Kundun, Zen,
  WCoin, Fairy Elf, Magic Gladiator, Devil Square, Blood Castle) và của Blizzard / HoYoverse.
- **Không ký tự Hán / Nhật / Hàn** trong bất kỳ prompt nào dưới đây.
- Tên riêng được dùng là tên của chính dự án: Vaeldra, Lunacia, Ardhaven, Lunaris City, Morvahn,
  Chimera, Petalshade, Thornwood, Hollow Roost, Frostmire, Ashen Steppe, Stormgate.

---

## 3. NHÓM CỐT TRUYỆN & NHIỆM VỤ — 9 NPC

Chín người này là dân **Lunacia bản địa**, trừ Rell. Toàn nhóm phải khác nhau rõ rệt về tuổi và
chất liệu quần áo: vải lanh phơi nắng · vải gai vá · dạ quân phục · da thuộc dầu · vải sáp ·
vải chần bông · nỉ dày · vải cuốn bám bụi · giáp sắt cũ.

---

### 1. Trưởng Làng — giao 9/10 nhiệm vụ mở đầu — Petalshade Isle

```
A stout, thickset village elder of Lunacia in his late sixties, standing calmly with
both hands resting on a coil of fishing rope at his belt. He wears a sun-bleached
linen work shirt gone cream-yellow at the shoulders, a net-mender's leather apron
salted white along the hem, and rope-wrapped sandals; his forearms are heavy and
scarred from decades of hauling nets. His face is broad, sun-creased and kind, with
tired eyes and a short grey beard cropped close to the jaw. Ground the palette in the
pale sand and drifting petals of a warm coastal island. Keep every part of him inside
a plain front-facing standing pose: hair lies flat against the skull with no brim, no
hood, no horns, no crest and no tall spikes, the shoulders stay level and unflared,
and the feet stand close together with nothing jutting past them. Render it as clean
stylised 2D game art with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* dây thừng, tạp dề vá lưới và vai áo bạc muối đến từ câu ông "vớt ngươi lên
khi bầu trời còn đang nứt" và bốn đời sống bằng biển trên đảo; nét mặt hiền và mệt đến từ lời
"ta nấu sẵn nồi cháo — ngồi xuống ăn trước đã".

---

### 2. Dược Sư — giao nhiệm vụ phụ hái thảo dược — Petalshade Isle

```
A wiry Lunacian herbalist woman in her early forties, standing straight-backed with
one hand steadying a shallow drying tray held against her hip. She wears a coarse
undyed hemp smock stained green and brown at the front, sleeves pushed above the
elbow, and a wide belt of small stitched cloth pouches with cut root ends showing at
the openings; her fingers and nails are permanently darkened by sap. Her expression is
sharp and unsentimental, mouth set, hair pulled back into a low flat knot at the nape.
The palette leans to garden greens, root browns and washed island cream. Keep the
whole figure inside a plain front-facing standing pose: the hair stays tight to the
skull with no brim, no horns, no crest and no raised bun, the shoulders remain narrow
and unflared, and the feet stay close together. Draw it as clean stylised 2D game art
with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* đai túi thuốc và ngón tay nhuộm nhựa đến từ vai bào chế cho cả đảo; ánh mắt
sắc, không mềm mỏng đến từ câu "Còn thiếu bao nhiêu? Đừng gật bừa — ta hỏi con số" và "Đừng giẫm
lên luống kia".

---

### 3. Trưởng Lão Rell — chỉ huy đội tiên phong, dẫn Chương II — Lunaris City

```
An old Vaeldra officer in his seventies, once broad-shouldered and now gone thin
inside his coat, standing braced with his weight on a short wooden crutch tucked under
one arm. His left leg below the knee is a plain strapped iron peg; he wears a faded
dark blue campaign coat with tarnished brass buttons and a worn mail collar, the
sleeves rolled once, no helmet and no insignia left on the chest. His hair is
grey and cropped to the scalp, his jaw set, his eyes level and unhurried like a man
who has already buried everyone he came with. Set him against the grey quarried stone
of a transplanted western city quarter. Keep him inside a plain front-facing standing
pose: nothing rises above the skull, no brim, no horns, no crest and no tall collar,
the shoulders stay level and unflared, and the crutch stays tight against the body.
Render it as clean stylised 2D game art with soft cel shading, on a transparent
background.
```

*Chi tiết bám lore:* chân sắt và cái nạng đến thẳng từ "chân ta để lại bên kia vết nứt rồi"; áo
quân phục bạc, tháo hết phù hiệu đến từ "Đừng gọi ta là chỉ huy nữa"; ánh mắt bình thản đến từ
"Ta đã quen với việc người ta không về".

---

### 4. Trinh Sát Wren — dẫn đường bản địa, mở phụ tuyến — Lunaris City

```
A young Lunacian scout in her mid twenties, short and lightly built, standing with her
weight on one hip and both thumbs hooked into a narrow chest strap. She wears close
oiled leather over a dark green tunic, forearms and shins bound in strips of soft
wrap so nothing rattles, a slim tally-cord of knotted twine at the belt and a single
short knife lying flat along the thigh. Her face is guarded rather than hostile, chin
slightly raised, dark hair cut short and pushed back off the forehead. Keep the colours
in mossy green, wet-bark brown and the dust of a walled city gate. Hold the figure to
a plain front-facing standing pose: the hair sits flat with no brim, no raised hood, no
horns and no crest, the shoulders stay narrow and unflared, and the feet stay close
together with no trailing cloak. Draw it as clean stylised 2D game art with soft cel
shading, on a transparent background.
```

*Chi tiết bám lore:* dây đếm nút thắt đến từ "Ta đếm được mười bảy con hôm nay. Hôm qua mười
hai"; đồ bó sát, không kêu và mặt thủ thế đến từ "Ta sinh ra ở đây. Các ngươi thì rơi xuống đây.
Nhớ cho kỹ sự khác nhau đó".

---

### 5. Người Gác Rừng Corran — dẫn Chương III, Trụ Khoá thứ nhất — Thornwood Reach

```
A tall, gaunt Lunacian forest warden in his late fifties, standing very still with a
long-handled pruning hook resting upright against his shoulder. He wears a waxed
canvas forest coat dyed moss and bark, patched at the elbows with darker cloth,
a coil of thin snare wire looped at the belt and heavy laced boots caked with wet
leaf mould. His face is weathered to the colour of old bark, deeply lined, with a
short untidy grey beard and eyes that watch rather than greet. Set the palette in the
damp greens, black soil and burnt-edge browns of a dense PK forest. Keep the whole
figure in a plain front-facing standing pose: hair stays flat to the skull with no
brim, no hood raised, no horns and no crest, the shoulders stay level and unflared,
and the pruning hook stays vertical and close to the body. Render it as clean stylised
2D game art with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* áo sáp vá và dây bẫy đến từ ba đời giữ rừng; mép cháy trong bảng màu đến từ
"Người Vaeldra các ngươi tới được một tháng đã đốt mất nửa"; đứng rất yên đến từ "Đi nhẹ thôi.
Rừng đang nghe".

---

### 6. Sylas, Người Giữ Tổ — dẫn Chương IV, canh 194 quả trứng — Hollow Roost

```
An exhausted Lunacian nest-keeper of about forty, thin and slightly stooped, standing
with both arms curled loosely in front of him as if still cradling something. He wears
a padded quilted brooder's smock in dull oatmeal wool, flecked with straw and shell
grit, sleeves buttoned to the wrist, and soft cloth wraps bound over both hands and
over his boots so his steps make no sound; a small hooded lantern hangs shuttered at
his hip. His eyes are hollow and ringed dark from sleeping three hours a night, his
hair flat and unwashed against the scalp. Keep the palette in the close, lightless
browns and greys of a narrow winding cave hollow. Hold him to a plain front-facing
standing pose: nothing rises above the head, no brim, no hood, no horns and no crest,
the shoulders stay rounded and unflared, and the feet stay close together. Draw it as
clean stylised 2D game art with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* vải quấn tay chân cho êm và cái đèn có chụp che đến thẳng từ "Đừng soi đèn
vào tổ"; mắt trũng đến từ "Ta ngủ ba tiếng một ngày, đủ rồi"; tay khum trước ngực đến từ
"Còn hai trăm quả trứng chưa nở. Ta ở lại vì thế".

---

### 7. Liora, Ẩn Sĩ Frostmire — dẫn Chương V, chép lại thung lũng — Frostmire Vale

```
A small, stooped Lunacian hermit woman well past seventy, standing with a flat writing
board strapped across her forearm and a stub of charcoal held ready in the other hand.
She is wrapped in layers of heavy grey felt and matted fleece with a short shoulder
cape buckled flat to the chest, fingerless mittens, and a corked ink bottle hung on a
cord and tucked inside her collar to keep it from freezing. Rime has settled into the
wool at her shoulders; her face is small, seamed and calm, hair thin and pressed close
to the head. Keep the colours in bone white, pale blue-grey ice and the sickly mauve of
poisoned blooms. Hold her to a plain front-facing standing pose: nothing sits above the
skull, no brim, no raised hood, no horns and no crest, the shoulder cape stays flat and
unflared, and the feet stay close together under the layers. Render it as clean
stylised 2D game art with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* bảng viết và lọ mực giấu trong cổ áo đến thẳng từ "Chữ ta viết đông cứng
trước khi ráo mực"; băng bám trên len đến từ "Hôm nay thêm bốn tấc băng"; sắc tím bệnh trong bảng
màu đến từ bãi độc hoa của vùng.

---

### 8. Dax, Kẻ Do Thám — dẫn Chương VI, ba năm nằm đếm quân — Ashen Steppe

```
A lean Lunacian spy in his mid thirties, permanently hunched from three years spent
lying flat, standing in a low half-crouch with his weight forward and his head slightly
lowered. He wears close-wound wrappings of ash-grey and dead-grass cloth over a dark
undershirt, with padded cloth bound over both knees and elbows, a roll of charcoal
sticks tucked into a hip band and a strip of scratched slate hanging from a thong.
Fine pale dust is worked into every fold and into the stubble on his jaw; his eyes flick
sideways rather than meeting the viewer. Keep the palette in ash grey, dry ochre grass
and the smoke-brown of a plain full of army fires. Hold him to a plain front-facing
pose that stays inside the standing silhouette: the hair lies flat with no brim, no
hood, no horns and no crest, the shoulders stay narrow and unflared, and the wrappings
stay tight to the body with nothing trailing. Draw it as clean stylised 2D game art
with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* than và mảnh đá phiến đến từ "Liora viết bằng mực, ta thì viết bằng than lên
đá"; lưng không thẳng lại được đến từ "Ba năm rồi ta chưa đứng thẳng lưng"; mắt liếc ngang đến từ
"Bò, đừng đi. Bên kia gò có mắt".

---

### 9. Lão Tướng Brann — dẫn Chương VII, giữ cửa ải cuối — Stormgate Pass

```
A very old Lunacian gate general in his eighties, still heavy through the chest and
shoulders, standing squarely with a long sword point-down in front of him and both
hands folded over the pommel. He wears a battered dark iron breastplate over a
rust-red gambeson, plain unadorned arm guards, and a short soldier's cloak pinned
close and cut above the knee so it hangs straight; a whetstone swings on a cord at his
belt. His head is bare, grey stubble over an old scar that crosses one brow, and his
expression is flat and patient rather than heroic. Set the palette in dark iron, dried
blood red and the red-brown earth of a wind-scoured border pass under a storm sky.
Hold him to a plain front-facing standing pose: nothing rises above the bare head, no
helmet, no brim, no horns and no crest, the shoulder plates stay flat against the arms
and do not flare outward, and the cloak hangs straight without spreading. Render it as
clean stylised 2D game art with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* đá mài treo ở thắt lưng đến thẳng từ "Mài kiếm đi, đừng mài lời"; đầu trần
không mũ và vẻ mặt bình thản đến từ "Đứng gác đủ lâu thì quên mất mình gác cái gì"; trời đỏ trong
bảng màu đến từ "Trời bên kia đỏ hơn hôm qua".

---

## 4. NHÓM RÈN ĐÚC — 2 NPC

Hai người này hiện **dùng chung một tệp art** (`thoren.png`), nên đây là chỗ dễ thấy nhất trong
game hai NPC y hệt nhau. Bắt buộc phải tách rõ: một người **to lớn, trẻ hơn, lò cố định**; một
người **nhỏ, già hơn, lò lưu động**.

---

### 10. Thợ Rèn · Lò Rèn Hoàng Gia — rèn & nâng cấp trang bị — Lunaris City

```
A massive Ardhaven blacksmith in his early forties, thick through the neck and
shoulders, standing with a long-handled forging hammer resting head-down on the
ground beside his boot. He wears a heavy soot-blackened leather apron riveted with
iron studs over a bare chest and shoulders, a folded cloth tied around his brow to
catch sweat, and one forearm wrapped in scorched linen bandage; his skin is flushed
and shining with heat and his hands are enormous. His expression is impatient but not
unfriendly, jaw clenched, short hair cropped almost to the scalp. Keep the palette in
ember orange, forge-black and the grey stone of a western city workshop. Hold him to a
plain front-facing standing pose: the brow cloth lies flat with no brim, no horns and
no crest above the head, the bare shoulders stay level and unflared, the hammer stays
vertical and close to the leg, and the feet stay close together. Render it as clean
stylised 2D game art with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* da đỏ bừng và tạp dề ám khói đến từ "Lò này cháy suốt từ hôm khu phố rơi qua.
Ta không dám để nó tắt"; vẻ sốt ruột đến từ "Đợi lò đỏ đã, đừng giục".

---

### 11. Thợ Rèn Lưu Vong — rèn & nâng cấp, lò dự phòng cạnh làng — Petalshade Isle

```
A small, sinewy exile smith in his sixties, barely two thirds the bulk of a city
blacksmith, standing barefoot on sand with a pair of long iron tongs held loosely at
his side. His apron is stitched together from salvaged scabbard leather in mismatched
browns, worn over a sleeveless grey undershirt, and a single battered gauntlet covers
only his tong hand; a small collapsible field forge sits low beside his ankle. He is
bald on top with a wiry grey beard, his arms are stringy rather than bulky, and his eyes
are narrowed in permanent appraisal. Keep the palette in dull salvaged iron, sun-bleached
leather and pale island sand. Hold him to a plain front-facing standing pose: the bald
head stays clean with no brim, no horns and no crest, the shoulders stay narrow and
unflared, the tongs stay tight against the leg, and the bare feet stay close together.
Draw it as clean stylised 2D game art with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* tạp dề chắp từ vỏ kiếm cũ và cái lò gấp đến thẳng từ "Đảo này không có quặng,
ta nấu lại đồ cũ" và "Lò của ta rơi qua vết nứt cùng ta"; ánh mắt săm soi đến từ "Ngươi cầm kiếm
sai tay rồi đấy".

---

## 5. NHÓM BUÔN BÁN — 3 NPC

Ba tiệm trong Lunaris City, cả ba đều là **người Ardhaven sống sót**. Cố ý tách thành ba dáng
người khác hẳn nhau: **cao gầy** (giả kim) · **thấp đậm** (binh khí) · **tròn trịa** (trà quán),
và ba chất liệu khác nhau: vải dầu · vải chần độn · len mềm.

---

### 12. Nhà Giả Kim · Tiệm Thuốc — bán bình thuốc, mana, đá thăng cấp — Lunaris City

```
A very tall and very thin Ardhaven alchemist in his early fifties, standing straight
with one long-fingered hand raised to steady a stoppered vial at chest height. He wears
a floor-skimming coat of dark green oiled linen buttoned to the throat and cut narrow so
it never spreads, a leather bandolier of small corked glass vials across the chest, and
thin gloves cut away at the fingertips; a plain round lens hangs on a cord against his
sternum. His face is long and bloodless with a thin mouth, hollow cheeks and hair combed
flat and severe against the skull; faint acid scarring marks the backs of his hands.
Keep the palette in bottle green, dull brass, glass grey and city lamplight. Hold him
to a plain front-facing standing pose: the flat hair rises nowhere above the skull, no
brim, no hood, no horns and no crest, the shoulders stay narrow and unflared, and the
long coat hangs straight and close with the feet together. Render it as clean stylised
2D game art with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* lọ nút bần đeo chéo ngực và tay sẹo axit đến từ vai bán "Bình Thuốc Đỏ, Lọ
Mana, Trị Thương Toàn Phần" tự tay bào chế; nét mặt lạnh, tính tiền trước đến từ "không trả tiền
thì thuốc cũng hóa độc đấy" và "Trả tiền rồi hẵng mở nút".

---

### 13. Binh Khí Chủ · Vũ Khí Phường — tiệm duy nhất bày hàng thật — Lunaris City

```
A short, solidly built Ardhaven weapon dealer in her forties, a former army
quartermaster, standing with arms folded and feet planted apart. She wears a sleeveless
padded gambeson in faded oxblood over a thick undershirt, a broad belt carrying a
wooden tally board and a stub of chalk, one fingerless glove on the counting hand, and
a plain arming sword worn flat at the hip. Her forearms are muscular and nicked with
small scars, her hair is scraped into a tight low knot, and she looks straight at the
viewer with the blunt patience of someone waiting to be paid. Keep the palette in
oxblood, oiled steel, worn oak and the sand-grey stone of a city market row. Hold her
to a plain front-facing standing pose: the tight knot of hair sits low and flat with no
brim, no horns and no crest above the head, the padded shoulders stay level and do not
flare, and the sword stays flat against the hip. Draw it as clean stylised 2D game art
with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* bảng ghi hàng và phấn ở thắt lưng đến từ việc tiệm này là tiệm duy nhất có
kho bày 8 món thật và tự nhập hàng theo chu kỳ; thái độ thẳng thừng đến từ "Lô này là lô cuối, ta
nói thật đấy" và "Cầm thử đi, đừng ngắm".

---

### 14. Trà Quán Chủ — nghỉ trọ, hồi phục — Lunaris City

```
A round, genial Ardhaven tea-house keeper in his sixties, comfortably heavy through the
middle, standing with a small copper kettle held in both hands at waist height. He wears
a soft undyed wool tunic with the sleeves pushed up, a long clean apron tied twice
around the waist so it lies perfectly flat, a folded white cloth over one forearm and
worn felt house slippers. His cheeks are ruddy, his eyes nearly disappear when he
smiles, and his thinning hair is combed straight back close to the head. Keep the
palette warm and domestic: honey brown, cream linen, copper and low candlelight, in
deliberate contrast to the grey street outside. Hold him to a plain front-facing
standing pose: the combed hair stays flat with no brim, no horns and no crest, the
shoulders stay soft, level and unflared, the apron hangs straight without spreading,
and the feet stay close together. Render it as clean stylised 2D game art with soft
cel shading, on a transparent background.
```

*Chi tiết bám lore:* ấm đồng còn nguyên vẹn đến thẳng từ "Cả cái quán rơi qua mà không vỡ một
chén"; bảng màu ấm tương phản với ngoài đường đến từ "Ngoài kia ồn quá, trong này yên"; khăn vắt
tay đến từ dịch vụ Nghỉ Trọ.

---

## 6. NHÓM DỊCH VỤ — 3 NPC

---

### 15. Bổ Đầu · Truy Nã Lệnh — phát lệnh truy nã Chimera mỗi ngày — Lunaris City

```
A rigid young city watch officer of about twenty-eight, of average height and drilled
upright posture, standing with one hand on a short baton at his belt and a roll of
bounty notices tucked under the opposite arm. He wears a dark slate surcoat over a
short mail shirt, a plain brass council badge pinned flat at the chest, and stiff
laced boots polished at the toes; a small iron seal-stamp hangs on a chain. His face is
young, clean-shaven and humourless, hair clipped short at the sides, chin level. Keep
the palette in slate blue, dull mail grey, brass and the pale stone of a city wall
notice board. Hold him to a plain front-facing standing pose: he is bare-headed with no
helmet, no brim, no horns and no crest above the skull, the surcoat shoulders stay flat
and unflared, the notice roll stays tucked tight against the ribs, and the feet stay
close together. Draw it as clean stylised 2D game art with soft cel shading, on a
transparent background.
```

*Chi tiết bám lore:* cuộn giấy truy nã và con dấu đến thẳng từ "Lệnh hôm nay dán rồi đấy" và
"Một ngày một tên, không hơn"; huy hiệu hội đồng đến từ "Hội Đồng Lunaris treo thưởng lũ Chimera";
mặt lạnh, không đùa đến từ "Mang đầu về, đừng mang chuyện về".

---

### 16. Thương Nhân Vận May · Sảnh Cầu May — quay thưởng, tỉ lệ dán công khai — Lunaris City

```
A lean, quick-handed games merchant of indeterminate age, somewhere in his thirties,
standing with both palms turned openly outward at waist height and a single coin
balanced between two fingers. He wears a cheap but loud patched waistcoat in
mismatched scarlet, mustard and teal over a thin shirt with the sleeves rolled high
above the elbow, a slim wooden odds-tally strapped flat along one forearm, and several
plain brass rings. His grin is wide and entirely honest about being a salesman, his
eyebrows are raised, and his oiled hair is combed flat and low against the skull. Keep
the palette bright and cheap against the drab grey of the surrounding stone city.
Hold him to a plain front-facing standing pose: the flat oiled hair rises nowhere, no
brim, no hat, no horns and no crest, the waistcoat shoulders stay narrow and unflared,
and the feet stay close together. Render it as clean stylised 2D game art with soft cel
shading, on a transparent background.
```

*Chi tiết bám lore:* hai lòng bàn tay ngửa ra trống không và bảng tỉ lệ buộc ở cẳng tay đến thẳng
từ "Tỉ lệ ta dán ngay trên vách — không giấu, cũng không hứa thêm gì" và "Ta không hứa gì cả, ta
chỉ quay"; màu sặc sỡ rẻ tiền để tách hẳn khỏi ba tiệm nghiêm túc cùng thành.

---

### 17. Trại Chủ Mục Đồng — bắt và thăng giai thú cưỡi — Petalshade Outskirts

```
A sun-darkened Lunacian stable master in her fifties, bow-legged from a lifetime in
the saddle, standing with a coiled rope lasso hanging from one hand and the other
hooked in her belt. She wears thick riding leathers worn shiny at the thighs, a short
quilted riding coat cut off at the hip so it never billows, heavy spurred boots, and a
neckerchief pulled down loose around her throat; a dry grass stem is clamped in the
corner of her mouth. Her face is deeply tanned and squint-lined from open glare, and
her hair is braided into a single flat plait laid forward over one shoulder. Keep the
palette in tack leather, dry scrub gold and the dust of open grazing land outside a
city wall. Hold her to a plain front-facing standing pose: the plait lies flat on the
shoulder and nothing rises above the head, no brim, no hat, no horns and no crest, the
coat shoulders stay level and unflared, and the lasso coil stays close against the
thigh. Draw it as clean stylised 2D game art with soft cel shading, on a transparent
background.
```

*Chi tiết bám lore:* dây thòng lọng và chân vòng kiềng đến thẳng từ "Tuấn mã hoang ngoài đồng kia
đấy — rượt cho nó kiệt sức rồi bấm E mà bắt"; mắt nheo vì nắng và cọng cỏ trong miệng đến từ "Cỏ
ngoài này ngọt hơn cỏ trong thành".

---

## 7. NHÓM MỐC VỰC THẲM — 3 NPC

⚠ **Đây là nhóm lore mỏng nhất và prompt phải suy diễn nhiều nhất.** Trong `NPCS`, ba mục này
mang **tên địa danh chứ không phải tên người** (Skyreach Ledge · Sorrowfall Cliff · Frontier's
Edge), `lore` chỉ tả cái vách đá chứ không tả một nhân vật nào, và cả ba dùng chung
`vachda.png` — một sinh vật lá cây nhỏ bám trên cành. Tôi diễn giải chúng thành **ba người canh
mép vực**, mỗi người là một biến thể khí hậu của cùng một vai: kẻ đứng ở mép, biết tỉ lệ, và
không ngăn ai nhảy. Nếu chủ dự án muốn giữ chúng là **vật thể trang trí** thay vì nhân vật thì
bỏ hẳn ba prompt này, đừng sinh.

Điểm chung buộc phải giữ để ba mốc đọc ra là một hệ thống: cùng dáng thấp, gọn, cùng tư thế một
tay chỉ xuống mép vực.

---

### 18. Skyreach Ledge · Vực Thẳm — mốc nhảy vực gần Trụ Thornwood — Thornwood Reach

```
A small, squat Lunacian ledge-keeper of no clear age, barely chest-high on a grown
adult, standing at the very lip of a drop with one short arm extended flat to point
downward. Thick moss-green hide shows between wrappings of woven bark fibre and
lichen-grey cloth bound close around the body; a hand-cut slate board of posted odds
hangs on a cord at the chest, and a knotted rope is looped twice around one wrist. The
broad flat face has heavy-lidded eyes and a small closed mouth that gives away nothing
about which way the fall will go. Keep the palette in wet moss, dark bark and the black
earth of a fractured forest floor. Hold the figure to a plain front-facing standing
pose: the head is rounded and bare with no brim, no horns, no crest and no leaf spikes
rising above it, the wrappings stay flat against the shoulders, and the stubby feet stay
close together. Render it as clean stylised 2D game art with soft cel shading, on a
transparent background.
```

*Chi tiết bám lore:* tấm đá phiến ghi tỉ lệ đến từ cơ chế "TỈ LỆ CÔNG KHAI — KHÔNG CỘNG DỒN MAY
MẮN" dán ngay tại vách; rêu và vỏ cây đến từ vùng Thornwood Reach; đất nứt trong bảng màu đến từ
"Đất nứt ra từ cái đêm Trụ Thornwood bị ngồi lên". *(Bản thân nhân vật là suy diễn — lore gốc chỉ
tả cái vách.)*

---

### 19. Sorrowfall Cliff · Vực Thẳm — mốc nhảy vực gần Trụ Frostmire — Frostmire Vale

```
A small, squat Lunacian ledge-keeper standing at the edge of a frozen drop, the same
stubby build as its counterparts, one short arm held out flat to point down into the
gorge. Its wrappings are crusted stiff with rime and layered in pale blue-grey felt
over bleached hide, with a slate board of posted odds frosted white at the chest and a
frayed rope stiff with ice around one wrist. The flat face is pale and impassive, eyes
narrowed against updraught, breath fogging in front of a closed mouth. Keep the palette
in rime white, glacial blue-grey and the sickly mauve of poisoned bloom that stains the
snow in this valley. Hold the figure to a plain front-facing standing pose: the head is
rounded and bare with no brim, no hood, no horns, no crest and no icicle spikes rising
above it, the frozen wrappings stay flat on the shoulders, and the stubby feet stay
close together. Draw it as clean stylised 2D game art with soft cel shading, on a
transparent background.
```

*Chi tiết bám lore:* hơi thở bốc khói và gió thốc ngược đến từ "Gió dưới đáy thổi ngược lên"; sắc
tím bệnh đến từ độc hoa Frostmire Vale; băng bám cứng đến từ canon "Băng ở đây không phải thời
tiết. Nó là vết sẹo". *(Nhân vật là suy diễn — lore gốc chỉ tả cái vách.)*

---

### 20. Frontier's Edge · Vực Thẳm — mốc nhảy vực gần Trụ Stormgate — Stormgate Pass

```
A small, squat Lunacian ledge-keeper standing at a wind-scoured border drop, the same
stubby build as its counterparts, one short arm extended flat to point over the edge.
Every wrapping is strapped down hard with leather cord against the wind, in dust-ochre
and dried-blood red over cracked hide; a scratched slate board of posted odds is lashed
tight to the chest so it cannot flap, and a wind-frayed rope is knotted at one wrist.
The flat face is scoured raw on one side, eyes squeezed to slits, mouth pressed shut
against blown grit. Keep the palette in red-brown border earth, dust ochre and the
bruised grey of a storm sky over the last pass. Hold the figure to a plain front-facing
standing pose: the head is rounded and bare with no brim, no horns, no crest and no
spikes rising above it, the strapped wrappings stay flat on the shoulders with nothing
streaming out to the sides, and the stubby feet stay close together. Render it as clean
stylised 2D game art with soft cel shading, on a transparent background.
```

*Chi tiết bám lore:* mọi thứ bị buộc chặt xuống và mặt bị gió mài đến thẳng từ "Gió biên thùy cắt
thịt" và "Gió ở đây cắt được da"; mép vực lở trong bảng màu đến từ "Trụ Stormgate lung lay tới
đâu, mép vực lở tới đó". *(Nhân vật là suy diễn — lore gốc chỉ tả cái vách.)*

---

## 8. Ghi chú khi sinh & nhận ảnh về

1. **Sinh cả nhóm trong một lượt, cùng một hạt giống.** Ba tiệm sinh rời từng cái sẽ ra ba phong
   cách — lỗi này đã ghi lại trong `docs/PROMPT_ART_NHANVAT.md` §3 khi sinh 5 chặng giáp.
2. **Kiểm bóng dáng trước khi kiểm mặt.** Nếu bất kỳ ảnh nào có thứ nhô lên trên đỉnh đầu, hoặc
   vai vượt ra ngoài đường viền cánh tay, thì sinh lại — đừng cố sửa tay, vì bản mẫu Spine không
   có chỗ chứa.
3. **`thoren` và `thoren_dao` phải khác nhau ở cấp bóng dáng, không chỉ ở màu.** Nếu để cạnh nhau
   mà chỉ khác bảng màu thì vẫn đúng lỗi hiện tại (hai NPC dùng chung một tệp).
4. Hai tệp `chaosgoblin.png` và `quangia.png` hiện **không NPC nào tham chiếu**. Không sinh lại
   cho chúng trừ khi có NPC mới dùng đến.
5. Ảnh về phải đọc được ở **64 px chiều cao** (cỡ trên bản đồ, xem `drawNpc()`) — chi tiết nhỏ hơn
   vài pixel sẽ biến mất hoàn toàn ở cỡ đó, nên bóng dáng và mảng màu lớn quan trọng hơn hoa văn.
