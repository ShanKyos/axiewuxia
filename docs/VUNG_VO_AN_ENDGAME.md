# Vùng Vỡ Ấn — nội dung endgame

> Trạng thái: **BẢN THIẾT KẾ, CHƯA CÀI ĐẶT.**
> Thay hẳn `BAY_QUAI_VA_PHU_AC_MONG.md` (bản đó sai trục — xem §1).
> Tham khảo: tài liệu *Diablo 4 — Nightmare Dungeon & Monster Families*. Lấy cơ chế, không lấy tên riêng (§10).

---

## 1. Bản trước sai ở đâu

Bản trước đề xuất **gắn hệ endgame lên map và quái đang có**. Chủ dự án bác, và đúng: 8 map ngoài trời hiện tại **chính là trọn vẹn hành trình 1→120**, tức toàn bộ early + mid game.

```
Petalshade Isle       1-12      Hollow Roost      42-56
Petalshade Outskirts 14-24      Frostmire Vale    62-78
Thornwood Reach      24-38      Ashen Steppe      84-100
                                Stormgate Pass   102-120   ← hết đất
```

Gắn Dị Biến Ác Mộng lên bãi Heo Rừng cấp 1 thì nó thôi là endgame. **Endgame cần đất riêng, quái riêng.**

Và điều này nối vào món nợ còn treo: chủ dự án đã chốt *"kéo đường cong level thành 400"*, tôi hoãn với lý do quái cao nhất mới cấp 120, kéo trần lên sẽ để trống 280 cấp. **Vùng mới chính là thứ lấp 280 cấp đó.** Hai việc là một.

---

## 2. Ba quyết định đã chốt

| | Chốt |
|---|---|
| Quy mô | **3 map mới** |
| Trần cấp | **MAX_LV 120 → 400** |
| Hình quái | **Dùng lại 7 bộ vẽ `skel` + phủ phần thân Axie theo lớp** |

---

## 3. Ba map mới — Vùng Vỡ Ấn

Lore đã viết sẵn, không phải bịa. `docs/LORE_BIBLE.md` (đã là canon của repo):

> *"beneath the old forests, the **Chimeras** — twisted creatures born from **Atia's discarded shells** — have begun to break the **Five Sigils** that bind them."*

Vùng endgame là **bên kia chỗ Ấn vỡ**. Ba map thành một mạch truyện, không phải ba bãi cày rời rạc:

| # | Tên | Cấp | Là gì | Họ Chimera chủ đạo |
|---|---|---|---|---|
| 1 | **Shellwaste** | 120–200 | Bãi vỏ Atia vứt lại — mảnh vỏ khổng lồ cắm nghiêng, đất nứt phát sáng | Plant · Bug · Beast |
| 2 | **Sigilfall** | 200–300 | Nơi Ngũ Ấn gãy — cột ấn đổ, tàn tích Golemry, Spirit Clay rỉ ra | Mech · Reptile · Bird |
| 3 | **Atia's Wake** | 300–400 | Hố ánh sáng lúc Atia nở — trung tâm mọi thứ | Aquatic · Dawn · Dusk |

Mỗi map: **3 họ × 4 vai trò = 12 loại quái**, 1 boss vùng, 1 phó bản riêng. Tổng **36 quái mới + 3 boss vùng + 3 boss phó bản**.

Đường vào: một cổng ở **Stormgate Pass** (map cấp 102–120 hiện tại), mở khi đạt cấp 120. Không đụng 8 map cũ — chúng vẫn nguyên vẹn là early/mid game.

---

## 4. Chimera — 9 họ = 9 lớp Axie

Đây là chỗ Axie vào thật, không phải dán nhãn.

Axie chính thống có **9 lớp**. Game đang dùng **5** làm lớp người chơi (`SECT_SFX`: mech · aquatic · reptile · beast · bug). **Bốn lớp còn lại chưa dùng vào việc gì cả.**

| Lớp Axie | Vai trò trong game |
|---|---|
| Mech · Aquatic · Reptile · Beast · Bug | 5 lớp người chơi → họ Chimera là **bản tha hoá của chính lớp mình** |
| **Plant · Bird · Dawn · Dusk** | chưa dùng → **4 họ Chimera thuần mới** |

Hai thứ này cộng lại cho một điều mà không hệ quái mượn-từ-Diablo nào có được: **người chơi đánh nhau với phiên bản méo mó của chính lớp mình.** Dark Knight (Mech) vào Sigilfall gặp Mech Chimera — cùng gốc, khác đường.

**Dawn và Dusk là hai lớp hiếm nhất của Axie ngoài đời** — nên đặt ở Atia's Wake, map sâu nhất, là đúng cả về lore lẫn về cảm giác hiếm.

### 4.1. Vẽ thế nào

Game đã có **7 bộ vẽ thủ tục** chưa dùng hết: `skeleton · knight · hound · wraith · golem · cultist · fiend`, mỗi bộ nhận `skelPal` (main/dark/trim/glow/bone/cloth).

Thêm **một lớp phủ phần thân Axie** — đây là phần vẽ mới duy nhất của cả đợt:

| Lớp Axie | Phần thân phủ lên |
|---|---|
| Plant | lá mọc trên lưng, rễ quấn chân |
| Bug | càng, cánh mỏng rung |
| Beast | sừng cong, đuôi xù |
| Mech | tấm giáp rời, ống xả hơi |
| Reptile | vảy sống lưng, đuôi gai |
| Bird | mỏ, cánh, chân ba ngón |
| Aquatic | mang, vây lưng, đuôi cá |
| Dawn | vầng sáng, vệt lông vũ trắng |
| Dusk | khói tối, mắt đơn phát sáng |

`skel` quyết **dáng**, phần thân Axie quyết **họ**, `skelPal` quyết **map**. Ba trục nhân nhau ⇒ 36 con khác nhau rõ mà không phải vẽ 36 bộ từ đầu. Cùng nguyên lý đã dùng cho 616 món trang bị 14 giai.

Bài kiểm sẽ so **chính ảnh đã render**, không so tên khoá — đúng bài học đợt đó.

---

## 5. Vai Trò — 6 kiểu, và Kẻ Tiếp Sức

Mỗi họ có 4 con theo 4 vai trò khác nhau. Sáu vai trò:

| `arch` | Tên | Hành vi | Chỉ số lệch |
|---|---|---|---|
| `nang` | Trọng Giáp | chậm, đánh mạnh, hất ngã | máu ×1.6 · tốc ×0.7 · ST ×1.3 |
| `phap` | Pháp Sư | đứng xa ném phép, máu giấy | máu ×0.6 · tầm 320 |
| `can` | Cận Chiến | đánh gần cơ bản | ×1 (mốc chuẩn) |
| `xa` | Xạ Thủ | bắn từ xa | máu ×0.8 · tầm 300 |
| `bay` | Bầy Đàn | đông, nhanh, yếu lẻ | máu ×0.45 · tốc ×1.35 · số ×2 |
| `tiep` | **Kẻ Tiếp Sức** | **buff cả bầy — mục tiêu ưu tiên** | máu ×0.8 · ST ×0.5 |

**Kẻ Tiếp Sức là trái tim của mục này.** Còn sống thì cả bầy **+25% Công · +20% máu**, và có **hào quang nối từ nó tới từng con** — nhìn là biết ngay ai nuôi ai. Giết nó, hào quang tắt, cả bầy sụt ngay.

Hệ số vai trò **nhân vào `def` lúc `spawnMob`**, không sửa bảng `MOBS` — giữ `mobHp()` làm nguồn duy nhất, nếu không thì đường cong máu quái vừa cân xong lại lệch.

### Có nên gắn Vai Trò cho 8 map cũ không?

**Có, nhưng chỉ từ đai 1 trở đi và chỉ ở dạng nhẹ** — cho bãi cấp 24+ trộn thêm 1 Kẻ Tiếp Sức. Lý do: người chơi cần **học từ vựng "giết Tiếp Sức trước"** ở mid game, để tới Vùng Vỡ Ấn thì đã biết luật. Nếu tới cấp 120 mới gặp lần đầu thì đó là dạy bài giữa kỳ thi.

Đai 0 (cấp 1–20) **giữ nguyên** — đó là chỗ tân thủ học đánh nhau, không phải chỗ dạy chiến thuật.

---

## 6. Dị Biến (Elite Affix)

`elite:true` hiện chỉ cho đúng một lớp khiên. Cho mỗi elite **2–4 Dị Biến**, tên hiện trên đầu.

### 6.1. Về AUTO farm — đã sửa theo ý chủ dự án

Bản trước tôi chia hồ affix làm hai để bảo hộ AUTO. **Chủ dự án bác: "người vẫn cần kĩ năng để vượt qua."** Bỏ carve-out đó.

Cách giải quyết mới **rơi ra tự nhiên từ chính việc có vùng riêng**: Vùng Vỡ Ấn là endgame, nên Dị Biến né-tránh nằm ở đó là đúng chỗ, không cần luật riêng nào cả.

- **8 map cũ (cấp 1–120)** — chỉ Dị Biến dựa trên chỉ số. AUTO cày được. Đây là early/mid game.
- **Vùng Vỡ Ấn (120–400)** — đủ cả hai nhóm, kể cả né-tránh. **AUTO sẽ ăn đòn ở đây, và đó là chủ đích.** Tôi sẽ *không* dạy AUTO né — dạy nó né là xoá luôn phần kỹ năng.

Giữ hai thứ, và chúng không phải bảo hộ AUTO:
- HUD nói thẳng khi vào vùng: *"Vùng này có Dị Biến né-tránh — AUTO sẽ ăn trọn."* Minh bạch, không che chắn.
- Giữ lưới an toàn đã có: hết bình thuốc thì AUTO rút lui thay vì đứng chịu chết (đã sửa từ trước). Cái đó chặn *mất trắng vì lỗi hệ thống*, không chặn *chết vì chơi dở*.

### 6.2. Hồ Dị Biến

**Dựa trên chỉ số** (chạy khắp nơi): Cường Thể (máu ×2.5) · Hút Sinh · Chiêu Binh (triệu 4 con) · Loạn Tiễn (3 đạn) · Nhiễm Độc · Hoả/Băng/Lôi Phụ · Nổ Xác · Phân Thân · Dịch Ảnh.

**Né-tránh** (chỉ Vùng Vỡ Ấn): Cột Lửa · Pháo Rơi · Tường Vây · Xoáy Hút · Băng Trận · Lưỡi Xoay. Tất cả phải có telegraph rõ trên mặt đất + cửa sổ né ≥ 1s. `BOSS_MOVES` đã có 7 chiêu có telegraph — dùng lại đúng khuôn đó.

**Quái nhỏ thừa hưởng** một Dị Biến của elite ở **40% cường độ** (ý "Season 11" của tài liệu nguồn). Rẻ, và làm cả bầy có bản sắc thay vì "elite + rác".

Elite có **tên riêng** ghép từ bảng tiền tố/hậu tố + danh sách Dị Biến dưới thanh máu. Không có cái này thì người chơi chỉ thấy "con này sao trâu thế" — hệ hay mà vô hình thì bằng không.

---

## 7. Phù Ác Mộng

Vật phẩm rơi ra, có bậc, mở **phó bản Vùng Vỡ Ấn** ở phiên bản Ác Mộng. Khuôn có sẵn: Box Kundun là vật phẩm-có-bậc, `khoNgoc.hap` là kho, `DUNGEONS` đã có `boxTier`.

```
Phù Ác Mộng — <tên phó bản>
Bậc 1..14                     ← bám vào 14 giai đã có, KHÔNG đẻ thang mới
─────────────────────────────
◈ 1 phúc trạch
✖ 1–2 tai ương  (bậc ≥ 8 mới có cái thứ hai)
```

**Phúc trạch:** Truy Tâm (hạ quái giảm hồi chiêu) · Nguyên Tố Thịnh (+12% ST một hệ) · Kho Báu · Mật Thất.

**Tai ương:** Bầy Đồng Nhất (cả phó bản đổi thành 1 họ Chimera, +30% máu) · Cuồng Bạo (+50% ST, nhận +20%) · Kẻ Báo Thù · Khiên Quái (85% máu tối đa làm khiên) · Cổng Ác Mộng.

**Vì sao quan trọng:** 3 phó bản mới × hàng trăm tổ hợp affix. Và **Phù là nguồn điểm Đại Thành ngoài lên cấp** — bảng vừa push có 640 ô mà một vòng Tái Sinh chỉ kiếm 139 điểm. Đây là vòng lặp endgame bảng đang thiếu.

---

## 8. MAX_LV 120 → 400 — những gì thực sự phải đổi

Đo từ code, không đoán:

### 8.1. Đường cong sức mạnh theo cấp **đã tự dừng ở 120**

```js
function levelPower(lv){
  const b = clamp(Math.floor(lv / 12), 0, LV_MULT_ATK.length - 1);  // 10 bậc → bão hoà ở cấp 108
  const t = clamp(Math.floor(lv / 6), 0, 20);                       // → bão hoà ở cấp 120
```

Nghĩa là **cấp 121–400 không cho thêm một chút hệ số nhân nào.** Đây là chuyện tốt, và tôi đề nghị **giữ nguyên**: nếu mở trần cho nó chạy tiếp tới 400 thì hệ số nhân compound và mọi thứ vừa cân xong đổ hết.

Cấp 121–400 vẫn cho:
- **5 điểm tiềm năng mỗi cấp** → 1.400 điểm. Qua căn bậc hai thì thành **≈ ×1,8 Công Kích** trên cả chặng — lợi tức giảm dần, đúng như đường cong A đã dựng.
- Công/máu nền tuyến tính nhỏ (`atkPerLv 0.5`, `hpPerLv 6`).

→ **Sức mạnh endgame đến từ trang bị + Đại Thành + bậc Phù, không từ cấp.** Đúng thứ tài liệu nguồn bảo: đừng phồng số.

### 8.2. Bảng EXP — chỗ khó nhất

`XP_TABLE` hiện dựng cho 120 cấp, và từ cấp 60 nó bám vào `XP60PLUS_ANCHORS` — **mốc đo tay, mục tiêu ~1 tiếng treo AUTO mỗi cấp**.

Giữ nguyên nhịp đó cho 280 cấp nữa = **280 giờ**. Không được.

Đề nghị: **cấp 120–400 nhanh hơn hẳn theo cấp, chậm hơn theo chặng.** Cụ thể ~15–25 phút/cấp ở đầu chặng, giãn dần tới ~1 tiếng ở cấp 380+. Cả chặng ≈ 120–150 giờ, và EXP của Vùng Vỡ Ấn phải dày hơn hẳn 8 map cũ để bù. **Con số cụ thể phải đo bằng bài kiểm như đã làm với `XP60PLUS_ANCHORS`, không chọn bừa.**

### 8.3. Trang bị: giữ 14 giai

`itemTier(lv) = clamp(ceil(lv/8), 1, 14)` — chạm giai 14 ở cấp 105. Với 400 cấp thì **toàn bộ endgame mặc giai 14**.

**Giữ nguyên.** Chủ dự án đã chốt đúng 14 giai với 14 bộ có tên và hình riêng; đẻ thêm giai là phá quyết định đó và phải vẽ thêm hàng trăm món. Tiến bộ trang bị ở endgame đến từ: **cấp rèn +9→+15 · dòng Hoàn Hảo · bậc Phù · Đại Thành**, không phải giai thứ 15.

### 8.4. ⚠ Va chạm phải quyết: Tái Sinh

`doTayTuy()` yêu cầu `player.level >= MAX_LV`. Đổi MAX_LV thành 400 thì **Tái Sinh nhảy từ "cấp 120" sang "cấp 400"** — và **Đại Thành mở sau Tái Sinh đầu**, nên cả bảng mastery vừa push sẽ bị đẩy ra xa hàng trăm giờ.

Ba hướng, cần chọn:

- **(a) Tái Sinh cố định ở cấp 120** *(tôi nghiêng về cái này)* — đổi điều kiện từ `MAX_LV` thành hằng số 120. Tái Sinh giữ đúng ý nghĩa "đi trọn một vòng cơ bản", Đại Thành mở đúng lúc như hiện nay, và 120–400 là chặng *sau* khi đã có mastery.
- **(b) Tái Sinh ở cấp 400** — Đại Thành thành phần thưởng rất xa. Bảng vừa làm gần như không ai chạm tới trong nhiều tháng.
- **(c) Hai mốc** — Tái Sinh Sơ ở 120 (mở Đại Thành), Tái Sinh Chân ở 400 (thưởng lớn hơn). Nhiều việc hơn nhưng có nấc rõ.

### 8.5. Những chỗ khác đang ghim số 120

Phải quét hết trước khi đổi hằng: cheat `/lv <1-120>` · trần cấp kỹ năng · `deepFloorLv` kẹp 120 · `lvPeak` backfill trong `loadGame` · mọi mốc mở khoá viết cứng (`level >= 48`, `>= 72`, `>= 96`…) — mấy mốc này là mốc *early game*, phải giữ nguyên chứ không nhân theo tỉ lệ.

---

## 9. Không làm

1. **Không giới hạn số lần hồi sinh** trong phó bản (tài liệu nguồn đề nghị 4–12). Game chưa có trạng thái thua; thêm nó vào một game cày AUTO nghĩa là người chơi mở tab khác rồi quay lại thấy mất trắng.
2. **Không mở `levelPower` chạy tới 400** — xem §8.1. Đó là phồng số.
3. **Không đẻ giai trang bị thứ 15** — xem §8.3.
4. **Không đụng 8 map cũ** ngoài việc trộn nhẹ Vai Trò từ đai 1 (§5).

---

## 10. Tên gọi — không bê IP

Quy tắc 2 của `CLAUDE.md` cấm tên riêng MU Online trong chữ người chơi thấy. **Áp đúng luật đó cho Diablo.**

Cấm bê nguyên: `Nightmare Sigil · Khazra · Nangari · Fallen · Drowned · Cannibals · The Hollows · Mephisto · Nahantu · Occultist · Idol of the Imp`.

| Tài liệu nguồn | Tên trong game |
|---|---|
| Nightmare Sigil | **Phù Ác Mộng** (game đã có "Thiên Mệnh Phù") |
| Elite Affix | **Dị Biến** ("Ấn" đã bị Khắc Ấn chiếm) |
| Monster Family | **Họ Chimera** |
| Archetype | **Vai Trò** |
| Summoner / Buffer | **Kẻ Tiếp Sức** |
| Horde affix | **Bầy Đồng Nhất** |

**Chimera · Atia · Lunacia · Sigil · Spirit Clay · Golemry** thì ngược lại — đó là lore Axie thật, đã là canon của repo trong `LORE_BIBLE.md` và `NAMING_MAP.md`. Dùng thoải mái, và **phải** dùng, vì đó chính là chỗ Axie vào.

Tên 3 map mới theo đúng thanh điệu của bộ tên đã có (Petalshade Isle, Thornwood Reach, Hollow Roost, Frostmire Vale, Ashen Steppe, Stormgate Pass): **Shellwaste · Sigilfall · Atia's Wake**.

---

## 11. Thứ tự & ước lượng

| | Việc | Ước lượng | Chặn bởi |
|---|---|---|---|
| 1 | **Vai Trò + Kẻ Tiếp Sức** (hệ + gắn nhẹ vào map cũ đai 1+) | ~1 ngày | — |
| 2 | **Dị Biến, nhóm chỉ số** + tên riêng elite | ~1 ngày | 1 |
| 3 | **36 quái Chimera** — 9 họ × 4 vai trò, lớp phủ phần thân Axie | ~2 ngày | 1 |
| 4 | **3 map + 3 boss vùng + 3 phó bản** | ~2 ngày | 3 |
| 5 | **MAX_LV 400** — bảng EXP, quét hằng số, chốt §8.4 | ~1,5 ngày | 4 |
| 6 | **Dị Biến né-tránh** (Vùng Vỡ Ấn) | ~1,5 ngày | 4 |
| 7 | **Phù Ác Mộng** | ~2 ngày | 4, 6 |

**Mỗi mục là một lượt hồi quy 138 bài + một push riêng.** Không gộp — đợt trước đã cho thấy một thay đổi cân bằng làm đỏ những bài chẳng liên quan gì.

Mục 1 và 2 chạy được ngay và **không phụ thuộc bất cứ quyết định nào còn treo** — trong khi §8.4 (Tái Sinh) còn đang chờ chốt.
