# Bầy Quái & Phù Ác Mộng — thiết kế

> Trạng thái: **BẢN THIẾT KẾ, CHƯA CÀI ĐẶT.** Viết để chủ dự án duyệt trước khi gõ code.
> Nguồn tham khảo: tài liệu *Diablo 4 — Nightmare Dungeon & Monster Families* (chủ dự án gửi 02/09/2026).
> Lấy **cơ chế**, không lấy tên riêng — xem §9.

---

## 1. Vì sao làm

Đo từ `public/game/game.js` (22.700 dòng, tại commit `9a4de84`):

| Đo được | Con số |
|---|---|
| `grep affix` toàn bộ mã nguồn | **0 kết quả** — không có hệ affix nào |
| `elite:true` | 20 con mang cờ. Tác dụng duy nhất: `shield: def.elite ? 1 : 0` — **một lớp khiên, hết** |
| Bãi quái | **29 bãi, mỗi bãi đúng MỘT loại quái** (`{ mob:'wolf_alpha', n:6 }`) |
| 7 phó bản (`DUNGEONS`) | 3 đợt × 3 con **viết cứng** + boss + thưởng cố định. Lượt thứ 50 giống hệt lượt đầu |
| Tầng Sâu (`DEEP`) | 20 tầng, hồ 14 con cố định, `lv = 6 + tầng×4`, máu `×(1 + tầng×0.28)` |
| Bộ vẽ quái thủ tục (`skel`) | **7 bộ đã có sẵn**: `skeleton · knight · hound · wraith · golem · cultist · fiend` |
| Buff nhặt trên đất / shrine | **0 kết quả** — chưa có |

Hai dòng đậm là hai lỗ hổng thật. Bãi quái đồng nhất nghĩa là **không có mục tiêu ưu tiên** — mọi trận đánh đều là "gõ con gần nhất cho tới khi hết". Và `elite:true` cho một lớp khiên là toàn bộ chiều sâu của quái tinh anh hiện nay.

Câu kết của chính tài liệu nguồn, và cũng là nguyên tắc số 1 của bản thiết kế này:

> *"đừng tạo độ khó bằng cách phồng số (HP, DMG); hãy tạo tương tác giữa các loại địch, hiểm hoạ môi trường và kỹ năng người chơi."*

Tầng Sâu hiện nay là ví dụ của thứ tài liệu bảo đừng làm: biến thiên duy nhất giữa tầng 3 và tầng 19 là **số to hơn**.

---

## 2. Ràng buộc riêng của game này

Tài liệu nguồn viết cho một game người chơi cầm tay điều khiển từng bước. Game mình thì không, và đây là ràng buộc quan trọng nhất mà tài liệu không lường được.

### 2.1. AUTO farm — ràng buộc lớn nhất

Game có AUTO farm (`player.auto`, khoá theo bãi, tự uống thuốc, tự tung chiêu). Rất nhiều người chơi bật AUTO rồi mở tab khác.

Tài liệu đề nghị hàng loạt affix **bắt buộc phải né**: `Volcanic` (cột lửa dưới chân), `Mortar` (4 vòng lửa rơi xuống), `Waller` (tường 3 mặt vây quanh), `Tempest` (4 khối băng hút người chơi vào), `Frozen`, `Shock Lance`. Tình huống 4.2 của tài liệu còn ghi thẳng: *"Không đứng yên quá 2 giây."*

**Thả nhóm này ra bãi quái thường là hỏng.** Người cày AUTO sẽ chết âm thầm, không thấy vì sao, và cũng không có cách nào phản ứng. Đó là cách nhanh nhất để phá một hệ hay.

→ **Luật:** hồ affix chia làm hai, và ranh giới này là bắt buộc, không phải tuỳ chọn:

- **Nhóm A — AUTO-an-toàn:** dựa trên **chỉ số** và **thứ tự giết**. AUTO xử được, người chơi tay vẫn thấy khác biệt rõ. Chạy ở **mọi nơi**.
- **Nhóm B — né-tránh:** chỉ mở **trong Phù Ác Mộng** (§5), nơi giao diện nói thẳng "chế độ này cần điều khiển tay" và AUTO bị chặn hoặc cảnh báo to.

### 2.2. Trần chỉ số

Đo ở cấp 120, bộ giai 14 đập +9, không một điểm Đại Thành nào:

```
defRed  0.780 / 0.78   ← ĐÃ ĐỤNG TRẦN ở cả 5 lớp
eva     0.400 / 0.45   ← chốt sẵn ở trần thứ nhất
crit    0.590 / 0.65   ← DK/DW/SB chỉ còn 6 điểm phần trăm
```

Mọi affix cộng cho **quái** đều an toàn. Nhưng affix nào *giảm chỉ số người chơi* thì phải cẩn thận: giảm Phòng Ngự của người chơi hiện nay **không có tác dụng gì** vì họ đã ở trần. Đây là lỗi cân bằng riêng, đã ghi nhận, chưa sửa — bản thiết kế này **không dựa vào** việc giảm chỉ số người chơi.

### 2.3. Hiệu năng

`_hsCache` (LRU 420) đã tách chi phí vẽ khỏi độ phức tạp hình. Nhưng affix thêm **thực thể động** (vũng độc, quái triệu hồi, hào quang) — thứ cache không đỡ được. `test_resscale` đo FPS thật; mọi affix mới phải qua nó.

---

## 3. Mục ① — Archetype & Bầy Trộn *(làm trước)*

Rẻ nhất, đổi cảm giác chơi nhiều nhất. Không cần vẽ gì, không cần map mới.

### 3.1. Sáu vai trò

Thêm `arch` cho từng mục trong `MOBS`:

| `arch` | Tên hiển thị | Hành vi | Chỉ số lệch |
|---|---|---|---|
| `nang` | Trọng Giáp | chậm, đánh mạnh, có hất ngã | máu ×1.6 · tốc ×0.7 · ST ×1.3 |
| `phap` | Pháp Sư | đứng xa ném phép, máu giấy | máu ×0.6 · tầm 320 |
| `can` | Cận Chiến | đánh gần cơ bản | ×1 (mốc chuẩn) |
| `xa` | Xạ Thủ | bắn từ xa, phải di chuyển tránh | máu ×0.8 · tầm 300 |
| `bay` | Bầy Đàn | đông, nhanh, yếu lẻ | máu ×0.45 · tốc ×1.35 · số lượng ×2 |
| `tiep` | Tiếp Sức | **buff cả bầy — mục tiêu ưu tiên** | máu ×0.8 · ST ×0.5 |

Chỉ số lệch **nhân vào `def` lúc `spawnMob`**, không sửa bảng `MOBS`. Giữ nguyên `mobHp()` làm nguồn duy nhất, chỉ nhân thêm hệ số vai trò — nếu không thì đường cong máu quái vừa cân xong ở đợt trước lại lệch.

### 3.2. Kẻ Tiếp Sức — trái tim của mục này

Mỗi bầy có **đúng 1 con** `arch:'tiep'`. Khi nó còn sống:

- cả bầy **+25% Công · +20% máu tối đa**
- vẽ **hào quang nối từ nó tới từng con** trong bầy — nhìn là biết ngay ai đang nuôi ai
- nhãn tên nó có tiền tố **◈** và màu riêng

Giết nó → hào quang tắt ngay, cả bầy sụt buff, có banner nhỏ *"Kẻ Tiếp Sức gục — cả bầy yếu đi!"*.

Đây chính là cơ chế *"luôn giết Shaman trước Overseer"* của tài liệu, và nó biến 29 bãi quái phẳng thành 29 câu đố nhỏ.

### 3.3. Bầy trộn

`buildWorld()` hiện chạy:

```js
for (const pk of md.packs){
  const packId = packSeq++;
  for (let j = 0; j < pk.n; j++) spawnMob(pk.mob, {...}, packId);
}
```

Đổi `pk.mob` từ một chuỗi thành **công thức bầy**: giữ `pk.mob` làm loại nền, thêm `pk.mix` tuỳ chọn liệt kê 1–2 loại phụ + 1 Kẻ Tiếp Sức. Bãi nào chưa khai `mix` thì chạy y như cũ — **không đụng tới 29 bãi hiện có trong một lần**, chuyển dần từng map.

### 3.4. AUTO cũng được nâng theo

`nearestMob(range)` hiện chọn **con gần nhất** (boss xếp sau). Thêm một bậc ưu tiên: **Kẻ Tiếp Sức trong tầm được chọn trước**, rồi mới tới con gần nhất.

Đây là cải tiến thật cho AUTO, không phải trang trí — AUTO hiện nay không hề "chọn" mục tiêu.

### 3.5. Bài kiểm `test_bayquai.js`

1. Mọi mục `MOBS` có mặt trong `packs` đều phải có `arch` hợp lệ.
2. Bầy có khai `mix` → spawn đúng **1** con `tiep`, không nhiều hơn.
3. Kẻ Tiếp Sức sống → đồng bọn Công/máu cao hơn mốc; giết nó → tụt về mốc. **Đo bằng chỉ số thật, không đọc cờ.**
4. `nearestMob()` trả về Kẻ Tiếp Sức khi nó ở trong tầm, kể cả khi có con khác đứng gần hơn.
5. Đối chứng: bãi **không** khai `mix` phải spawn y hệt trước (chống hồi quy 29 bãi cũ).
6. Hệ số vai trò không được đẩy máu bầy vượt quá mốc `mobHp()` cũ quá 25% — chống lạm phát số ngầm.

### 3.6. Rủi ro

- **Kẻ Tiếp Sức đứng sau lưng cả bầy** → người chơi cận chiến không tới được nó. Giảm bằng: nó **không** được ở giữa bầy lúc spawn, và hào quang chỉ vào đúng vị trí nó.
- Buff +25%/+20% cộng lên đúng đường cong máu quái vừa cân. Phải đo lại `test_autopack` và `test_bossauto` sau khi cài.

---

## 4. Mục ② — Dị Biến (Elite Affix)

`elite:true` hiện chỉ cho một lớp khiên. Cho mỗi elite **2–4 Dị Biến** rút từ hồ, tên hiện ngay trên đầu nó.

### 4.1. Nhóm A — AUTO-an-toàn (chạy khắp nơi)

| Tên | Hiệu ứng | Dùng lại cái gì đã có |
|---|---|---|
| Cường Thể | máu ×2.5 | `mobHp` |
| Hút Sinh | mỗi đòn trúng người chơi thì nó hồi 8% ST đã gây | đối xứng với `player.hpLeech` |
| Chiêu Binh | triệu 4 con nhỏ cùng loại, tối đa 1 lần / 12s | `spawnMob` |
| Loạn Tiễn | bắn 3 đạn thay vì 1 | `projectiles` đã có |
| Nhiễm Độc | đòn trúng gây độc 4s | `player.poisonT` đã có |
| Hoả/Băng/Lôi Phụ | 15% ST vật lý chuyển thành ST nguyên tố | `ELEM` đã có |
| Nổ Xác | chết thì nổ một vòng ST quanh xác | `addEffect ring` đã có |
| Phân Thân | tạo 1 bản sao 30% máu, gây 50% ST | `spawnMob` + `def` clone |
| Dịch Ảnh | mỗi 6s chớp tới cạnh người chơi | thuần toạ độ |

Tất cả đều dựa trên **chỉ số** và **thứ tự giết** — AUTO xử được, người chơi tay vẫn thấy rõ.

### 4.2. Nhóm B — né-tránh (CHỈ trong Phù Ác Mộng)

`Cột Lửa` · `Pháo Rơi` · `Tường Vây` · `Xoáy Hút` · `Băng Trận` · `Lưỡi Xoay`.

Cả 6 cái đều cần telegraph rõ trên mặt đất + cửa sổ né ≥ 1s. `BOSS_MOVES` đã có 7 chiêu có telegraph (`vach · xung · goi · cuong · vong · daovung · vogiap`) — dùng lại đúng khuôn đó, đừng phát minh khuôn mới.

### 4.3. Quái nhỏ thừa hưởng *(ý "Season 11" của tài liệu)*

Quái thường đi cùng elite mang **một** Dị Biến của elite, **cường độ 40%**. Rẻ, và làm cả bầy có bản sắc thay vì "elite + rác".

### 4.4. Hiển thị

Elite có **tên riêng** (ghép từ bảng tiền tố/hậu tố) + danh sách Dị Biến dưới thanh máu. Không có cái này thì người chơi chỉ thấy "con này sao trâu thế" mà không hiểu vì sao — hệ hay mà vô hình thì bằng không.

### 4.5. Bài kiểm `test_dibien.js`

1. Mỗi Dị Biến bật riêng lẻ đều phải **đổi được một đại lượng đo được** (đúng khuôn mục 5 của `test_mastery` — nó đã bắt được 4 nút chết ở đợt trước).
2. Không Dị Biến nào của **Nhóm B** lọt ra ngoài Phù Ác Mộng. Đây là mục gác quan trọng nhất của bài.
3. Elite mang 2–4 Dị Biến, không trùng nhau trên cùng một con.
4. Quái nhỏ thừa hưởng đúng 1, đúng 40% cường độ.
5. AUTO farm 60 giây trong bãi có elite Nhóm A → vẫn giết được, không đứng chết.
6. `test_resscale` phải xanh với 3 elite Dị Biến cùng lúc trên màn.

---

## 5. Mục ③ — Phù Ác Mộng

Một **vật phẩm rơi ra**, có bậc, dùng để mở một trong 7 phó bản ở phiên bản Ác Mộng. Khuôn đã có sẵn: Box Kundun là vật phẩm-có-bậc, `khoNgoc.hap` là kho chứa, `DUNGEONS` đã có `boxTier`.

### 5.1. Cấu trúc lá Phù

```
Phù Ác Mộng — <tên phó bản>
Bậc 1..14                     ← bám thẳng vào 14 giai đã có, KHÔNG đẻ thang mới
Cấp quái: giai × 8 + bậc phù
─────────────────────────────
◈ 1 phúc trạch  (có lợi)
✖ 1–2 tai ương  (có hại; bậc ≥ 8 mới có cái thứ hai)
```

**Bậc bám vào 14 giai** — không tạo thang riêng. Game đã có `GIAI_MAX = 14`, `BAOHAP_TIERS` 7 bậc, `TB_MAX_TIER = 10`. Thêm thang thứ tư là tự làm khó mình.

### 5.2. Phúc trạch (chọn 1)

- **Truy Tâm** — hạ quái giảm 0.4s hồi chiêu
- **Nguyên Tố Thịnh** — +12% ST một nguyên tố (roll theo lá Phù)
- **Kho Báu** — nhiều Rương Báu rải trong phó bản
- **Mật Thất** — bảo đảm 1 phòng kho ở cuối

### 5.3. Tai ương (chọn 1–2)

- **Bầy Đồng Nhất** — cả phó bản đổi thành 1 họ quái, +30% máu *(cần mục ④)*
- **Cuồng Bạo** — quái +50% ST, nhận +20% ST
- **Kẻ Báo Thù** — giết một con thì các con quanh nó nổ sau 2s
- **Khiên Quái** — quái có khiên bằng 85% máu tối đa, phải phá trước
- **Cổng Ác Mộng** — mở cổng gần người chơi, tuôn quái ra *(Nhóm B — cần điều khiển tay)*

### 5.4. Vì sao mục này quan trọng nhất

**7 phó bản tĩnh → hàng trăm biến thể.** Đây là lỗ hổng nội dung lớn nhất hiện nay.

Và nó nối thẳng vào hệ vừa làm xong: **Phù Ác Mộng là nguồn điểm Đại Thành ngoài lên cấp.** Bảng có 640 ô mà một vòng Tái Sinh chỉ kiếm 139 điểm — hiện phải 4–5 vòng mới tô kín, mà mỗi vòng là cày lại 1→120. Cho phó bản Ác Mộng rớt điểm là có luôn vòng lặp endgame mà bảng đang thiếu.

### 5.5. Điều KHÔNG làm ở mục này

- **Không** giới hạn số lần hồi sinh (tài liệu đề nghị 4–12). Game chưa có trạng thái thua trong phó bản; thêm nó vào một game cày AUTO nghĩa là người chơi mở tab khác rồi quay lại thấy mất trắng.
- **Không** làm 200 bậc. Tầng Sâu cố tình có đáy — ghi chú trong mã nguồn nói rõ: *"CÓ ĐÁY. Vô hạn thì phần thưởng không có trần và cũng chẳng có cái gì để về đích."* 200 bậc đi ngược quyết định đó, và bản thân nó là "phồng số".

---

## 6. Mục ④ — Họ Quái

Gom 77 con có nguyên tố thành **7 họ**, bám thẳng vào 7 bộ vẽ `skel` đã có sẵn:
`skeleton · knight · hound · wraith · golem · cultist · fiend`.

Mỗi họ 4 vai trò của §3.1. Xong mục này thì tai ương **Bầy Đồng Nhất** ở §5.3 mới có cái để đổi.

Chi phí thấp bất ngờ vì phần vẽ đã xong từ trước — chỉ là gán nhãn và điền chỗ trống.

---

## 7. Mục ⑤ — Linh Đài

Game chưa có bất kỳ buff nhặt trên đất nào (`grep shrine` = 0). Bộ đếm buff thì đã có sẵn (`buffAtkT`, `vhDmgT`, `vhEvaT`, `vhAspdT`…) — chỉ thiếu cái bệ và vòng sáng.

4 loại: **Cuồng Nộ** (+ST) · **Kiên Thành** (+giáp) · **Tật Phong** (+tốc) · **Bộc Phát** (chiêu không tốn Mana). Để sau cùng.

---

## 8. Thứ tự & ước lượng

| | Mục | Ước lượng | Chặn bởi |
|---|---|---|---|
| 1 | ① Archetype + Bầy Trộn + Kẻ Tiếp Sức | ~1 ngày | — |
| 2 | ② Dị Biến, **chỉ Nhóm A** | ~1 ngày | ① |
| 3 | ③ Phù Ác Mộng | ~2 ngày | ② |
| 4 | ④ Họ Quái | ~1 ngày | ① |
| 5 | ② Dị Biến, Nhóm B (né-tránh) | ~1,5 ngày | ③ |
| 6 | ⑤ Linh Đài | ~0,5 ngày | — |

① và ② đã đủ làm chiến đấu khác hẳn mà chưa cần map hay art mới, và cả hai đều là nền cho ③.

**Mỗi mục là một lượt hồi quy 138 bài + push riêng.** Không gộp — đợt trước đã cho thấy một thay đổi cân bằng có thể làm đỏ những bài chẳng liên quan gì.

---

## 9. Tên gọi — không bê IP

Quy tắc 2 của `CLAUDE.md` cấm tên riêng của MU Online trong chữ người chơi thấy. **Áp đúng luật đó cho Diablo.**

Cấm bê nguyên: `Nightmare Sigil · Khazra · Nangari · Fallen · Drowned · Cannibals · The Hollows · Mephisto · Nahantu · Occultist · Corik Trost · Idol of the Imp · Bone Prison`.

Lấy **cơ chế**, đặt **tên mình**:

| Tài liệu nguồn | Tên dùng trong game |
|---|---|
| Nightmare Sigil | **Phù Ác Mộng** (game đã có "Thiên Mệnh Phù" — cùng hệ từ vựng) |
| Elite Affix | **Dị Biến** ("Ấn" đã bị Khắc Ấn chiếm, tránh trùng) |
| Monster Family | **Họ Quái** |
| Archetype | **Vai Trò** |
| Summoner / Buffer | **Kẻ Tiếp Sức** |
| Horde affix | **Bầy Đồng Nhất** |
| Shrine | **Linh Đài** |

Archetype và affix là ngôn ngữ thiết kế chung của cả thể loại ARPG, không phải tài sản riêng của ai — phần đó học thoải mái. Tên riêng thì không.

---

## 10. Ghi chú về tài liệu nguồn

Tài liệu **không có một công thức nào** — mọi con số đều là giá trị phẳng (`+30% HP`, `+50% dmg`, `85% Max Life`, `6 quái nhỏ`, `tường 3 mặt`). Nó cũng tự mâu thuẫn vài chỗ: Bảng 1 ghi Phù có "1 Positive + 1 Negative", caption ảnh ghi "3 Affixes", ảnh chụp thật lại có lá 4 affix; danh sách "đầy đủ" 21 Elite Affix thiếu mất mấy cái xuất hiện trong chính ảnh chụp của nó.

→ Dùng nó làm **nguồn ý tưởng và danh mục cơ chế**, không dùng làm bảng số. Mọi con số trong tài liệu này là số của mình, phải đo lại bằng bài kiểm.
