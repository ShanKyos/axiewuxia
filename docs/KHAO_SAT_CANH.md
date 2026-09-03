# Khảo sát hệ Cánh — tham chiếu MU Online và đề xuất cho Axie Wuxia

> **ĐÃ DỰNG.** Phần C của tài liệu này đã được thực hiện: 3 bậc × 5 lớp (+ Tán Nhân) = 18 đôi,
> khoá theo lớp qua `itemUsable()`, ba công thức `wing1`/`wing2`/`wing3` đều `royal:true`, và
> hai lỗi Phần B đã vá — `drawHeroFigure` nay VẼ cánh, và cánh nay đọc `sway`/`swayDir` thay vì
> đọc thẳng đồng hồ. Phần A/B dưới đây giữ nguyên làm bản ghi hiện trạng lúc khảo sát.
>
> Hình học điểm gắn cánh (gốc cánh phải nằm sát bả vai) và cơ chế BAY được khảo sát riêng ở
> **`docs/KHAO_SAT_CANH_BAY.md`**.

> **Phạm vi.** Đây là khảo sát **THIẾT KẾ**: luật chơi, cấu trúc chỉ số, ngôn ngữ tạo hình.
> Không tải, không giải nén, không chuyển đổi bất kỳ tài nguyên nào của MU Online (BMD/OZJ/OZT/
> texture/âm thanh), không chép mã nguồn của họ. Mọi hình vẽ đề xuất ở Phần C đều dựng bằng
> canvas 2D nguyên bản trong `public/game/game.js`.
>
> **Tên riêng.** Phần A nêu tên gốc MU Online vì đó là phần *tham chiếu*. Mọi cái tên **đề xuất
> cho game này** (Phần C) đều là tên nguyên bản, tuân thủ QUY TẮC SỐ 2 trong `CLAUDE.md`.
>
> **Độ tin cậy nguồn.** Trong phiên khảo sát này `WebFetch` bị chặn hoàn toàn ở tầng proxy
> (mọi tên miền thử đều trả `EGRESS_BLOCKED`: muonlinefanz.com, muonline.fandom.com,
> strategywiki.org, wiki.infinitymu.net, viciadosmu.com.br, muonline.net, mutop100.com,
> wiki.bless.gs, guidemuonline.com, en.wikipedia.org). Vì vậy **mọi con số ở Phần A chỉ được
> xác nhận qua trích đoạn của công cụ tìm kiếm**, không qua đọc trực tiếp bảng gốc. Chỗ nào
> trích đoạn không nói tới, tài liệu ghi thẳng **"chưa kiểm chứng"**.

---

## Phần A — Tham chiếu MU Online

### A.0. Chọn phiên bản làm mốc, và vì sao

Ba bậc cánh thay đổi nhiều theo season, nên phải chốt một mốc:

- **Mốc chính của tài liệu này: MU Online chính thức, khoảng Season 6.** Lý do: (1) đó là bản
  mà cộng đồng vẫn coi là bản chuẩn — "trên server Season 6 cổ điển, cánh cấp 3 thường là trần
  cao nhất bạn với tới được, cộng thêm Cape of Emperor cho Dark Lord và Cape of Fighter cho
  Rage Fighter" ([mutop100 — Season 6 guide](https://www.mutop100.com/guides/mu-online-season-6-guide));
  (2) đúng ba bậc mà yêu cầu khảo sát nêu — từ Season 15 trở đi MU đã có cánh cấp 4, cấp 5 và
  hệ "Wing Core", tức là một hệ khác hẳn
  ([muonline.ai — Wings guide S20/S21](https://www.muonline.ai/guide/en/muonline-wings),
  [webzen — Lv.5 Wings](https://muonline.webzen.com/en/gameinfo/guide/detail/339)).
- **Số liệu ưu tiên lấy từ cơ sở dữ liệu vật phẩm MU Online Fanz** (qua trích đoạn tìm kiếm),
  vì nó khớp với bản chính thức.
- **Số liệu của wiki server tư nhân bị loại khỏi bảng chính.** Ví dụ rõ nhất: `wiki.infinitymu.net`
  ghi Wings of Spirit yêu cầu **cấp 280**, phòng ngự **110**, tăng sát thương **45%**, giảm sát
  thương **51%** — trong khi bản chính thức là cấp 215 / phòng ngự 30 / +32% / +25%
  ([infinitymu — Wings of Spirit](https://wiki.infinitymu.net/index.php?title=Wings_of_Spirit)).
  Chênh gấp 3–4 lần. Đây là số đã bị server tư nhân thổi lên, không dùng làm mốc cân bằng được.
- Nhiều nguồn tự nói rõ điều này: *"mỗi server MU có thể chỉnh nhẹ công thức và tỉ lệ thành
  công"* ([oldsquad.ro](https://oldsquad.ro/forum/topic/653-how-to-make-condor-feather-and-3rd-level-wings/)).
  ⇒ Mọi con số dưới đây phải đọc như **hình dạng thiết kế**, không phải hằng số bất biến.

### A.1. Bậc 1 — "cánh nhỏ", cổng cấp 180

Đặc trưng chung: **+12% sát thương gây ra / +12% giảm sát thương nhận**, cổng cấp 180.

Công thức tăng theo mức rèn cánh, theo cơ sở dữ liệu vật phẩm (trích qua tìm kiếm):

| | Công thức |
|---|---|
| Cấp yêu cầu | `180 + (mức rèn × 4)` |
| Phòng ngự | `10 + (mức rèn × 3)` — riêng Wings of Satan là `20 + (mức rèn × 3)` |
| Tăng sát thương | `12 + (mức rèn × 2)` % |
| Giảm sát thương nhận | `12 + (mức rèn × 2)` % |

Nguồn: [MU Online Fanz — Wings of Elf](https://muonlinefanz.com/tools/items/data/itemdb/Wings%20of%20Elf.php)
và [Wings of Satan](https://muonlinefanz.com/tools/items/data/itemdb/Wings%20of%20Satan.php) (qua trích đoạn tìm kiếm).

| Cánh | Lớp dùng được | Cấp | Phòng ngự (+0) | Sát thương | Giảm nhận | Ghi chú nguồn |
|---|---|---|---|---|---|---|
| **Wings of Elf** | Fairy Elf / Muse Elf / High Elf | 180 | 10 | +12% | +12% | [MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Wings%20of%20Elf.php) · [InfinityMU — Elven Wings](https://wiki.infinitymu.net/index.php?title=Elven_Wings) |
| **Wings of Heaven** | Dark Wizard (các season sau mở thêm Magic Gladiator, Rage Fighter, Rune Wizard, Gun Crusher, Lemuria Mage, Alchemist) | 180 | **chưa kiểm chứng** | +12% | +12% | danh sách lớp: [MU Online Fanz — Wings & Capes](https://muonlinefanz.com/guide/items/wings/) |
| **Wings of Satan** | Dark Knight / Blade Knight / Blade Master, và Magic Gladiator / Duel Master | 180 | **20** (cao hơn hai cánh trên) | +12% | +12% | [InfinityMU — Satan Wings](https://wiki.infinitymu.net/index.php?title=Satan_Wings) · công thức phòng ngự từ [MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Wings%20of%20Satan.php) |
| **Wings of Curse** | Summoner (một nguồn ghi thêm Dark Lord và Grow Lancer) | **150 hoặc 180 — nguồn mâu thuẫn** | 10 | +12% | +12% | [MU Online Fanz — Wings & Capes](https://muonlinefanz.com/guide/items/wings/) |
| **Cape of Lord** | Dark Lord / Lord Emperor | 180 | 15 | **+20%** | **+10%** | [MU Online Fanz — Cape of the Lord](https://muonlinefanz.com/tools/items/data/itemdb/Cape%20of%20the%20Lord.php) |
| **Cape of Fighter** | Rage Fighter / Fist Master | 180 | 15 | **+20%** | **+20%** | [mu.lv — Cape of Fighter](https://mu.lv/guides/item/jbyy1mh) |

**Hai chỗ nguồn tự mâu thuẫn, ghi lại để không ai chép nhầm:**

1. **Cape of Lord thuộc bậc mấy?** Một nguồn xếp nó là *"cánh bậc 2 dành riêng cho Dark Lord và
   Lord Emperor"* ([InfinityMU — Cape Of Lord](https://wiki.infinitymu.net/index.php?title=Cape_Of_Lord)),
   nhưng chính nguồn đó ghi cấp yêu cầu **180** — trùng bậc 1, không phải 215 của bậc 2. Nhiều
   khả năng Dark Lord đơn giản là **không có cánh bậc 1 riêng**: nó đi thẳng từ không có gì lên
   Cape of Lord, rồi Cape of Emperor ở bậc 3. **Chưa kiểm chứng dứt điểm.**
2. **Cape of Fighter cũng vậy** — một nguồn xếp nó cùng nhóm với cánh bậc 3
   ([mutop100](https://www.mutop100.com/guides/mu-online-season-6-guide)) nhưng chỉ số lại là
   cấp 180 / +20% / +20%, tức là hạng bậc 1–2. Rage Fighter là lớp thêm vào muộn nên bảng cánh
   của nó vốn không đối xứng với 5 lớp gốc. **Chưa kiểm chứng.**

**Cách chế tạo bậc 1 — hai chặng ở Chaos Machine (Noria):**

| Chặng | Bỏ vào máy | Ra |
|---|---|---|
| 1 | 1 Jewel of Chaos + vũ khí **+4 kèm option +4 trở lên** | Chaos Dragon Axe / Chaos Nature Bow / Chaos Lightning Staff (ngẫu nhiên) |
| 2 | Vũ khí Chaos đó, đã rèn **+4 option +4** + 1 Jewel of Chaos | Một cánh bậc 1 (ngẫu nhiên theo lớp dùng được) |

Tỉ lệ thành công: **60% là mức nền**; bỏ thêm đồ tốt hơn (Excellent, mức rèn cao) và
Jewel of Bless / Jewel of Soul / Unicorn / Imp / Angel thì đẩy lên được, **có nguồn nói tối đa
khoảng 90%** ([guidemuonline — First Wings](https://guidemuonline.com/guides/how-to-create-wings/first-wings),
[muvoltris](https://muvoltris.com.br/en/blog/wings-in-mu-online-how-to-create-wings-level-1-2-and-3-step-by-step-49-en)).
**Điểm quan trọng:** ở bậc 1, **hỏng thì đồ bị tụt cấp chứ không mất trắng** — khác hẳn bậc 2
([Fandom — Wings](https://muonline.fandom.com/wiki/Wings)).

### A.2. Bậc 2 — cổng cấp 215

Đặc trưng chung: **+32% sát thương / +25% giảm sát thương nhận**, cổng cấp **215**.
Chỉ phòng ngự là khác nhau giữa các cánh.

| Cánh | Lớp | Cấp | Phòng ngự | Sát thương | Giảm nhận | Nguồn |
|---|---|---|---|---|---|---|
| **Wings of Spirit** | Muse Elf | 215 | 30 | +32% | +25% | [MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Wings%20of%20Spirit.php) |
| **Wings of Soul** | Soul Master | 215 | 30 | +32% | +25% | [MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Wings%20of%20Soul.php) |
| **Wings of Dragon** | Blade Knight | 215 | **45** (cao nhất bậc) | +32% | +25% | [MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Wings%20of%20Dragon.php) |
| **Darkness Wings** | Magic Gladiator | 215 | **40** | +32% | +25% | [MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Darkness%20Wings.php) |
| **Wings of Despair** | Bloody Summoner | 215 | 30 | +32% | +25% | [MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Wings%20of%20Despair.php) |
| *Cape of Lord* | Dark Lord | *180* | *15* | *+20%* | *+10%* | xem A.1 — xếp bậc còn tranh cãi |

**Quy luật đọc ra được:** phòng ngự đi theo **độ nặng của lớp** (hiệp sĩ 45 > lai 40 > pháp/xạ
30), còn hai dòng % thì **giống hệt nhau ở mọi lớp**. Đây là ý đồ thiết kế đáng chép lại: bậc
cánh là **một mốc sức mạnh chung của cả server**, bản sắc lớp nằm ở dòng phụ chứ không ở dòng chính.

**Cách chế tạo bậc 2 — một chặng, "Regular Combination" ở Chaos Goblin (Noria):**

| Bỏ vào máy | Ra |
|---|---|
| Cánh bậc 1 rèn **+4 kèm option +4** + 1 Jewel of Chaos + **1 Loch's Feather** | Cánh bậc 2 **ngẫu nhiên** (Dragon / Soul / Spirit / Darkness) |
| Cùng công thức nhưng thay Loch's Feather bằng **Crest of Monarch** | **Bảo đảm** ra Cape (Cape of Lord) |

Nguyên liệu: **Loch's Feather** rơi ở Icarus, cũng mua được từ NPC Liaman (quán rượu, Lorencia);
**Monarch Crest** rơi ở Stadium và các map cấp cao
([Fandom — Wings](https://muonline.fandom.com/wiki/Wings),
[bless.mu](https://www.bless.mu/guides/read/how-to-create-wings/7)).

Tỉ lệ thành công: **chưa kiểm chứng con số cụ thể.** Các nguồn chỉ nói tỉ lệ thay đổi theo chất
lượng đồ bỏ kèm, và muốn tăng tỉ lệ thì **phải dùng đồ Excellent đã rèn** — đồ thường không có
tác dụng. ⚠ **Hỏng ở bậc 2 là mất sạch mọi thứ trong máy** — đây là khác biệt cơ chế lớn nhất
so với bậc 1.

### A.3. Bậc 3 — cổng cấp 400

Đặc trưng chung: **+39% sát thương / +39% giảm sát thương nhận**, cổng cấp **400**, và **đòi
lớp đã lên chuyển sinh 3** (Blade Master, Grand Master, High Elf, Duel Master, Dimension Master,
Lord Emperor, Fist Master).

| Cánh | Lớp | Cấp | Phòng ngự | Sát thương | Giảm nhận | Nguồn |
|---|---|---|---|---|---|---|
| **Wings of Storm** | Blade Master (Dark Knight) | 400 | **60** (cao nhất toàn hệ) | +39% | +39% | [MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Wings%20of%20Storm.php) |
| **Wings of Eternal** | Grand Master (Dark Wizard) | 400 | 45 | +39% | +39% | [wiki.bless.gs](https://wiki.bless.gs/index.php?title=Wings_of_Eternal) |
| **Wing of Illusion** | High Elf | 400 | 45 | +39% | +39% | [Fandom — Wings list](https://muonline.fandom.com/wiki/Wings_list) |
| **Wings of Ruin** | Duel Master (Magic Gladiator) | 400 | **chưa kiểm chứng** | +39% | +39% | [MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Wings%20of%20Ruin.php) |
| **Wing of Dimension** | Dimension Master (Summoner) | 400 | 45 | +39% | +39% | [MU Online Fanz](https://muonlinefanz.com/tools/items/data/itemdb/Wing%20of%20Dimension.php) |
| **Cape of Emperor** | Lord Emperor (Dark Lord) | 400 | 45 | +39% | **+24%** ⚠ | [MU Online Fanz — Emperor's Cape](https://muonlinefanz.com/tools/items/data/itemdb/Emperor's%20Cape.php) |
| *Cape of Fighter* | Fist Master (Rage Fighter) | *180* | *15* | *+20%* | *+20%* | xếp bậc còn tranh cãi — xem A.1 |

⚠ **Cape of Emperor lệch khỏi khuôn**: giảm sát thương nhận chỉ **+24%** thay vì 39%, đổi lại
nó có dòng **tăng tốc chạy**. Đây là dòng ghi trong cơ sở dữ liệu vật phẩm, không phải suy đoán.

**Cách chế tạo bậc 3 — hai chặng, và đây là chỗ đau nhất của cả hệ:**

| Chặng | Bỏ vào máy | Ra | Tỉ lệ |
|---|---|---|---|
| 1 | Cánh **bậc 2 +9 kèm option** + 1 Jewel of Creation + 1 Jewel of Chaos + **bó 10 Jewel of Soul** + 1 **Ancient Item +7 kèm option** | **Feather of Condor** | **60%** |
| 2 | Feather of Condor + **Excellent Item +9 kèm option** + 1 Jewel of Chaos + 1 Jewel of Creation + **bó 10 Jewel of Bless** + **bó 10 Jewel of Soul** + **Condor Flame** (rơi ở Barracks) | Cánh bậc 3 | **40%** |

Nguồn: [oldsquad.ro — Condor Feather & 3rd Level Wings](https://oldsquad.ro/forum/topic/653-how-to-make-condor-feather-and-3rd-level-wings/),
[globalmuonline](https://globalmuonline.com/guides/read/12-creating-3lvl-wings).
**Hỏng là mất sạch ở cả hai chặng.** Tỉ lệ ghép lại: `0.60 × 0.40 = 24%` cho một lượt thử đầy đủ —
tức là trung bình phải nướng khoảng **4 bộ nguyên liệu** cho một đôi cánh bậc 3.

### A.4. Dòng phụ ngẫu nhiên trên cánh (mọi bậc)

Khi chế tạo, cánh/áo choàng **có xác suất nhận thêm "wing option"** ngẫu nhiên. Hồ dòng phụ
gồm (theo trích đoạn): **bỏ qua phòng ngự đối thủ +5%**, **hồi sinh lực**, **phản sát thương**,
**tăng tỉ lệ sát thương Excellent**, hồi mana, sát thương gấp đôi, tốc độ, chỉ số
([Fandom — Wings](https://muonline.fandom.com/wiki/Wings)).
**Số lượng dòng và xác suất từng dòng: chưa kiểm chứng cho Season 6.** Trích đoạn về "2 dòng
ngẫu nhiên" thuộc hệ **Wing Core của Season 20/21**, tức là hệ khác — không được dùng làm số
cho Season 6.

### A.5. Ngôn ngữ tạo hình — phần cần nhất để VẼ

⚠ **Cảnh báo nguồn, đọc trước.** Không một nguồn văn bản nào tìm được mô tả *hình dáng* cánh —
các wiki chỉ có bảng chỉ số. Toàn bộ mục A.5 là **mô tả lại từ quan sát hình ảnh phổ biến của
game**, không có nguồn trích dẫn được. **Coi như chưa kiểm chứng.** Không dùng làm căn cứ pháp
lý cho bất cứ điều gì; dùng làm **cảm hứng tạo hình**, và Phần C vẽ lại hoàn toàn bằng hình học
riêng.

**Ba nguyên tắc chung xuyên suốt ba bậc** — đây mới là thứ đáng chép, không phải chi tiết:

1. **Sải cánh nói lên bậc.** Bậc 1 cánh nhỏ, gần như chỉ nhú khỏi bả vai. Bậc 2 rộng bằng thân
   người. Bậc 3 rộng gấp rưỡi tới gấp đôi thân người và **cắt cả ra ngoài khung hình** trong
   nhiều tư thế. Nhìn từ xa, không cần đọc tên, chỉ cần đo bề ngang là biết đẳng cấp.
2. **Vật liệu leo theo bậc**: bậc 1 là **vật chất** (lông vũ, màng da, vải). Bậc 2 là **vật chất
   quý + kim loại** (vảy, khung kim loại, hoa văn khảm). Bậc 3 là **năng lượng** — phần lớn diện
   tích cánh không còn là vật thể đặc mà là ánh sáng, hạt bay, và vệt sáng kéo dài.
3. **Cánh là thứ ĐỘNG duy nhất khi nhân vật đứng yên.** Kể cả lúc không di chuyển, cánh vẫn vỗ
   chậm, hạt sáng vẫn rơi. Đây là lý do cánh "đắt" về mặt cảm giác dù chỉ là một món đồ.

**Bậc 1 — vật chất thô, nhỏ, đọc rõ hình bóng:**

| Cánh | Hình dáng | Bảng màu | Kích thước tương đối | Hiệu ứng động |
|---|---|---|---|---|
| Wings of Elf | Lông vũ thật, hai thùy, mép có răng lông | Trắng ngà pha lục nhạt | ~0,8× bề ngang thân | vỗ chậm, biên độ nhỏ |
| Wings of Heaven | Lông vũ, thẳng và dựng hơn, giống cánh thiên thần cổ điển | Trắng, viền xanh nhạt | ~0,9× thân | vỗ chậm, có ánh sáng nhạt ở gốc cánh |
| Wings of Satan | **Màng dơi** — có xương ngón, mép lõm hình vỏ sò, không một sợi lông | Đỏ tối / nâu huyết, xương sẫm hơn màng | ~1,0× thân | vỗ nhanh và giật hơn cánh lông |
| Cape of Lord | Không phải cánh — **tấm choàng** rủ sau lưng | Sẫm, viền kim loại | dài xuống ngang bắp chân | phất theo bước chân, không vỗ |

Đối lập lông-vũ ↔ màng-dơi ở bậc 1 chính là cách MU phân biệt **lớp trong sáng** (elf, pháp sư)
với **lớp bạo lực** (hiệp sĩ, lai) mà không cần đọc chữ.

**Bậc 2 — thêm khung kim loại và màu bão hoà:**

| Cánh | Hình dáng | Bảng màu |
|---|---|---|
| Wings of Dragon | Màng dơi lớn, **xương ngón rõ và dày**, mép có gai, đôi khi thêm thùy phụ phía dưới | Đỏ cam rực, xương vàng đồng |
| Wings of Darkness | Màng, mép rách/lởm chởm | Tím đen, viền tím sáng |
| Wings of Spirit | Lông vũ dài và mảnh, xoè hình quạt | Xanh lam nhạt ánh bạc |
| Wings of Soul | Lông vũ + màn năng lượng mờ xen giữa | Trắng lam, phát sáng nhẹ |
| Wings of Despair | Màng rách, dáng cụp xuống | Xám tím ảm đạm |

Chung: **sải rộng ngang thân người**, thêm **một lớp thùy phụ** dưới thùy chính (bậc 1 chỉ có
một lớp), và bắt đầu có **hào quang bám quanh mép cánh**.

**Bậc 3 — năng lượng lấn át vật chất:**

- Sải cánh lớn nhất, thường **có nhiều hơn hai thùy mỗi bên** (3–4 lớp xếp lệch nhau như lông
  đuôi công), và các thùy **không cùng nhịp vỗ** — lớp ngoài trễ pha so với lớp trong.
- Phần lớn diện tích là **màn sáng bán trong suốt** thay vì mặt đặc; đường viền phát sáng mạnh
  hơn ruột cánh.
- **Hạt bay liên tục**: tàn lửa (Storm/Ruin), bụi sáng (Eternal/Illusion), mảnh tối (Dimension).
- Có **vệt sáng kéo theo** khi nhân vật di chuyển — thứ bậc 1 và 2 không có.
- Cape of Emperor giữ dáng **áo choàng** chứ không thành cánh: tấm vải lớn, viền vàng, có hoa
  văn ở giữa lưng, và bay ngược chiều di chuyển.

---

## Phần B — Hiện trạng trong game này

Mọi số liệu dưới đây **đọc thẳng từ `public/game/game.js`** ở bản đang có trên đĩa, kèm số dòng.

### B.1. Năm lớp nhân vật (`SECTS`, dòng 434–472)

| Khoá `id` | Tên hiển thị | Hệ | Vai | Màu |
|---|---|---|---|---|
| `thieulam` | **Dark Knight** | Kim | Chịu Đòn / Liên Đòn cận chiến | `#4c8dff` |
| `toanchan` | **Sylvan Ranger** | Thủy | Tầm xa / Hỗ trợ (tầm 380) | `#3a9d8b` |
| `baidasan` | **Dark Wizard** | Thủy | Pháp thuật / Độc tố (tầm 420) | `#7ec850` |
| `minhgiao` | **Spellblade** | Hỏa | Lai / Bộc phát Hoả | `#e8552a` |
| `bug` | **Dark Lord** | Thổ | Chỉ huy / Triệu hồi | `#8a9a3a` |
| `vophai` | *Unclassed* | — | trạng thái trước cấp 10, không tính là lớp | `#b8a888` |

⚠ Khoá `id` nằm trong save người chơi — **không được đổi**, kể cả khi thêm cánh riêng cho từng lớp.

### B.2. Cánh bậc 1 — `WING_DEFS` (dòng 380–383)

```
const WING_DEFS = [
  { id:'thienthan', name:'Cánh Thiên Thần', color:'#dfe8ff', hpPct:12, evaPct:6, silverPct:20, ... },
  { id:'tieuquy',   name:'Cánh Tiểu Quỷ',   color:'#b08ae8', atkPct:12, crit:5,  aspdPct:6,    ... },
];
```

| id | Tên | Màu | Chỉ số | Ghi vào món đồ |
|---|---|---|---|---|
| `thienthan` | Cánh Thiên Thần | `#dfe8ff` | +12% Sinh Lực · +6% né · +20% đồng rơi | `it.wing = 'thienthan'` |
| `tieuquy` | Cánh Tiểu Quỷ | `#b08ae8` | +12% Sát Thương · +5% bạo · +6% tốc đánh | `it.wing = 'tieuquy'` |

**Hai đường nhận:**
1. **Rơi từ trùm — 12%** (`killMob`, dòng 7421): `if (R() < 0.12 && _sotCho > 0) rw.wings.push(Math.floor(R()*2))`.
   Chỉ trùm (`d.boss`), và chỉ khi túi còn ô. Trao ở dòng 7477 qua `genWing(wi)`.
2. **Chế tạo** ở Lò Hỗn Độn — xem B.4.

**Không khoá theo lớp.** `Math.floor(R()*2)` chọn ngẫu nhiên 1 trong 2, bất kể người chơi lớp nào.

### B.3. Cánh bậc 2 — `WING2_DEFS` (dòng 385–388)

| id | Tên | Màu | Chỉ số | Ghi vào món đồ |
|---|---|---|---|---|
| `phuongduc` | Phượng Hoàng Linh Dực | `#ff8a3a` | +20% Sát Thương · +15% Sinh Lực · +8% bạo · +10% tốc đánh | `it.wing2 = 'phuongduc'` |
| `hacma` | Hắc Ma Linh Dực | `#c07fe0` | +24% Sát Thương · +8% xuyên giáp · +5% hút sinh lực · +10% bạo | `it.wing2 = 'hacma'` |

⚠ **Bẫy đã sập một lần, có chú thích dài tại dòng 13830–13834**: cánh bậc 2 ghi id vào trường
`wing2`, **không phải** `wing`. Code vẽ trước đây chỉ tra `WING_DEFS` theo `wing` nên cánh bậc 2
luôn rơi về `WING_DEFS[0]` — người chơi tốn 1 Hỗn Độn Châu + 20 Hỗn Nguyên + 10.000 Lumen để
thăng cấp, xong cánh chuyển thành **trắng Thiên Thần**, tức nâng cấp xong nhìn còn kém hơn trước.
**Thêm bậc 3 phải giữ đúng quy ước này** (một trường riêng, và chỗ vẽ tra theo thứ tự bậc giảm dần).

### B.4. Công thức chế tạo trong `CHAOS_RECIPES`

**`wing1` — "Luyện Linh Dực" (dòng 14502–14530), `royal:true`**

| | |
|---|---|
| Khay | **1 trang bị Hoàn Hảo, rèn ≥ +4**, không `noForge` — **bị TIÊU HỦY làm vật hiến tế** |
| Ngọc rời (bỏ vào khay) | 1 **Hỗn Độn Châu** (`jewelCost('honDon', v, 1)`) |
| Trừ thẳng kho | 10 **Hỗn Nguyên** · 5.000 **Lumen** |
| Cổng cấp | **40** |
| Nơi chế | **Lò Rèn Hoàng Gia** (`royal:true` → `atRoyalForge()`, dòng 14305) |
| Tỉ lệ | **100%** (`rate: 100`) |
| Kết quả | `WING_DEFS[Math.floor(Math.random()*2)]` — **ngẫu nhiên 1 trong 2**, không theo lớp |
| Túi đầy | không mất đồ — hoàn 2.000 Lumen |

**`wing2` — "Thăng Linh Dực 2" (dòng 14532–14560), `royal:true`**

| | |
|---|---|
| Khay | **1 cánh bậc 1** (`it.slot === 'canh' && !it.wing2`) — **không bị tiêu hủy**, được thăng tại chỗ |
| Ngọc rời | 1 **Hỗn Độn Châu** |
| Trừ thẳng kho | 20 **Hỗn Nguyên** · 10.000 **Lumen** |
| Cổng cấp | **80** |
| Nơi chế | **Lò Rèn Hoàng Gia** |
| Tỉ lệ | **100%** |
| Kết quả | `WING2_DEFS[Math.floor(Math.random()*2)]` — **ngẫu nhiên**, không theo lớp |
| Thay tại chỗ | `itemLoc(uid)` → ghi đè đúng ô đang mặc hoặc đúng ô túi (dòng 14553–14555) |

**Ba khác biệt lớn so với MU** (không phải lỗi — là quyết định thiết kế cần biết trước khi mở rộng):
- **Không có rủi ro.** Cả hai công thức đều `rate: 100`, `charm:false`. MU thì 60% / 40% và hỏng là
  mất sạch.
- **Không có chuỗi nguyên liệu riêng.** MU có Chaos Weapon → Loch's Feather → Condor Feather →
  Condor Flame. Ở đây chỉ có Hỗn Độn Châu dùng lại cho cả hai bậc.
- **Không khoá lớp.** MU khoá chặt: Wings of Satan chỉ hiệp sĩ, Wings of Elf chỉ elf.

**Thông báo mở khoá** (dòng 7691): `40:['Mở khóa: Lò Bảo Chứng luyện Linh Dực Cấp 1 — Lò Rèn Hoàng Gia, Lunaris City']`.
⚠ Chuỗi này gọi nơi chế là **"Lò Bảo Chứng"** trong khi công thức và mọi chỗ khác gọi
**"Lò Hỗn Độn"** tại **"Lò Rèn Hoàng Gia"**. Ba tên cho hai thứ — nên dọn khi đụng vào hệ này.

### B.5. Ô trang bị và cách dựng món cánh

- `SLOTS` (dòng 333–348): ô cuối là `{ id:'canh', name:'Cánh', special:true }`. Ngay trên nó là
  `{ id:'aochoang', name:'Áo Choàng', special:true }` — **hai ô riêng biệt**, một người mặc được cả hai.
- `specialItem(slot, def, extra)` (dòng 5092–5103) dựng món: `rarity: 4` (Chí Tôn), `tier: 0`,
  `special: true`, `noForge: true`, `plus: 0`.
- ⚠ **Chỉ 10 khoá chỉ số được `specialItem` chuyển thành dòng phụ**, mọi khoá khác trong `def`
  bị bỏ lặng lẽ:
  `atkPct · pierce · defPct · hpPct · evaPct · silverPct · expPct · hpLeech · crit · aspdPct`.
  Mọi đề xuất ở Phần C **chỉ được dùng trong 10 khoá này**.
- `genWing(i)` (dòng 5109) — chỉ dựng được bậc 1; bậc 2 gọi thẳng `specialItem` trong công thức.

### B.6. Hàm VẼ cánh — **chỉ có MỘT chỗ, và không nằm trong `drawHeroFigure`**

**Đây là phát hiện quan trọng nhất của Phần B.**

| Bộ dựng nhân vật | Hàm | Cỡ | Có vẽ cánh không? |
|---|---|---|---|
| Trong màn (đang chạy) | `drawPlayer()` — dòng **13727** | ~104px | **CÓ** — dòng 13828–13856 |
| Thẻ nhân vật (bảng Nhân Vật / Trang Bị) | `heroCardUrl()` → `drawHeroFigure()` — dòng **12922** / **12979** | 160×220 | **KHÔNG** |
| Chibi (thẻ chọn lớp) | `chibiUrl()` — dòng **13426** | 420×420 | **KHÔNG** |

`drawHeroFigure` (dòng 12922–12969) gọi 14 lớp vẽ — `hPlusAura`, `hCape`, `hLegs`, `G.upper`,
`hArmorSheen`, `hChestMods`, `hEngrave`, `hPlusSweep`, `hBelt`, `hHelmShell`, `hGloves`,
`hPauldrons`, `hHelmCrest`, `hPlusSpark` — **không có lớp nào cho cánh**. `gearVisual(p)`
(dòng 10418–10444) cũng **không đọc `p.equip.canh`**: nó chỉ duyệt `HERO_ARMOR_SLOTS` và `vukhi`.

⇒ **Người chơi mặc cánh bậc 2 mở bảng Nhân Vật ra thì không thấy cánh đâu.** Đây là đúng cái lỗi
mà `CLAUDE.md` gọi tên: *"Nâng trang bị phải NHÌN THẤY được trên nhân vật."* Ghi lại để Phần C xử lý.

**Toàn bộ mã vẽ cánh hiện có — `drawPlayer`, dòng 13828–13856:**

- **Dòng 13835–13836 — tra định nghĩa**, ưu tiên bậc 2 rồi mới tới bậc 1, và có mặc định:
  `(wingIt.wing2 && WING2_DEFS.find(...)) || WING_DEFS.find(w => w.id === wingIt.wing) || WING_DEFS[0]`
- **Dòng 13837 — nhịp vỗ:** `const lift = Math.sin(performance.now()/280) * 0.22 * 10;`
  ⇒ biên độ **±2,2 px**, chu kỳ `2π × 280ms ≈ 1,76 giây`.
  ⚠ Đây là hàm **đọc thẳng đồng hồ**, không đọc `player.sway`/`swayDir` — nghĩa là cánh **không
  có quán tính phụ**: vừa dừng chạy là cánh vẫn vỗ y hệt lúc đứng yên. `CLAUDE.md` yêu cầu mọi
  bộ phận MỀM (áo choàng, vải rủ, **lông vũ**, mảnh phép) phải đọc hai con lò xo đó. **Cánh đang
  vi phạm luật này.**
- **Dòng 13839 — màu:** `ctx.fillStyle = wd.color;` — **một màu đặc duy nhất cho cả đôi cánh**,
  không gradient, không viền, không tách màu xương/màng.
- **Dòng 13840 — đối xứng:** `for (const side of [-1, 1])` — vẽ hai bên bằng cách nhân toạ độ x
  với `side`. Cánh **không xoay theo hướng nhìn** `p.face`; áo choàng ngay trên (dòng 13809–13826)
  thì có, qua `backAng = p.face + Math.PI`.
- **Hai thùy mỗi bên, đều là tam giác cong hai cung bậc hai:**

| | Thùy chính (alpha **0.88**) | Thùy phụ (alpha **0.60**) |
|---|---|---|
| Gốc | `(p.x + side*6, p.y - 24)` | `(p.x + side*6, p.y - 18)` |
| Cung 1 — điểm điều khiển | `(side*26, -44 - lift)` | `(side*22, -26 - 0.6·lift)` |
| Cung 1 — đích (mút cánh) | `(side*46, -32 - lift)` | `(side*38, -16 - 0.6·lift)` |
| Cung 2 — điểm điều khiển | `(side*34, -16)` | `(side*26, -8)` |
| Cung 2 — đích (khép về thân) | `(side*8, -15)` | `(side*6, -10)` |

  (Toạ độ ghi tương đối so với `p.x`/`p.y`; `p.y` là chân nhân vật.)

**Đo ra được từ bảng trên:**
- Sải cánh mỗi bên: **46 px** (thùy chính) — tổng bề ngang ~**92 px**, so với nhân vật cao **~104 px**.
- Đỉnh cánh cao nhất: `p.y - 44`, tức ngang **đầu** nhân vật.
- Thùy phụ ngắn hơn thùy chính **8 px** và vỗ với **60% biên độ**, tạo cảm giác trễ pha rất nhẹ.

**Bốn thứ KHÔNG đổi theo bậc — nghĩa là bậc 1 và bậc 2 vẽ ra hình DẠNG y hệt nhau, chỉ khác màu:**
số thùy (luôn 2), sải cánh (luôn 46 px), nhịp vỗ (luôn 280 ms), độ mờ (luôn 0.88/0.60).
Không có hào quang, không có hạt bay, không có vệt sáng khi di chuyển.

**Để đối chiếu — áo choàng (dòng 13809–13826) LÀM ĐÚNG hai thứ mà cánh không làm:** nó xoay theo
`p.face` (`backAng`), và nó có `sway = Math.sin(performance.now()/320) * 4` đưa vào cả điểm điều
khiển lẫn điểm đích nên tấm vải **biến dạng** chứ không chỉ tịnh tiến.

### B.7. Bảng màu đang có, để Phần C không phát minh màu mới

`:root` trong `public/game/style.css` (dòng 1–48):
`#10122a` `#262c58` `#14163a` `#eef2ff` `#9aa8d4` `#7a86ad` `#4c8dff` `#7ecbff` `#ffb15c`
`#ffd76a` `#7ec850` `#ff8fcf` `#b18cff` `#ff6b6b` `#e4ebff` `#dbe2ff` `#cfd8f5` `#8fd0ff`
`#5fa8e8` `#0d1220`

Màu đã dùng trong `game.js`:
- Cánh/áo choàng hiện có: `#dfe8ff` `#b08ae8` `#ff8a3a` `#c07fe0` `#5ea0e8` `#7ecbff`
- Màu lớp: `#4c8dff` `#3a9d8b` `#7ec850` `#e8552a` `#8a9a3a`; hào quang lớp: `#ffe9a0` `#a0ffe9` `#c8ffa0` `#ffb060` `#d0e07a`
- Phẩm (`RARITIES`, dòng 133–139): `#b9b9b9` `#5fc96e` `#5ea0e8` `#c07fe0` `#f39c3d`
- Hệ (`ELEM`): `#c8d4e8` `#5db86a` `#c08a4a` `#7ec8ff`
- Bộ giáp (`HERO_SETS`): `#3f444e` `#5c6270` `#8a92a4` `#6b3f28` `#b4763f` `#d9a05a`
- Khác: `#8fd18f` `#9fd0ff` `#ff7a3a` `#ff9a5a` `#9ed4ff` `#c8a86a`

---

## Phần C — Đề xuất cho Axie Wuxia

### C.0. Sáu quyết định nền, và lý do

1. **Ba bậc × năm lớp = 15 cánh, khoá theo lớp.** Đây là thứ MU làm và game này chưa làm. Nó
   biến cánh từ "một trong hai món ngẫu nhiên" thành **cột mốc bản sắc của lớp**. Cách khoá đã có
   sẵn đường: `itemUsable()` đang khoá kiếm/gậy/cung theo lớp và chặn ở **cả ba** chỗ mặc đồ
   (bấm tay, tự mặc khi nhặt, nút Mặc Đồ Tốt Nhất) — cánh đi theo đúng đường đó.
2. **Bỏ quay ngẫu nhiên trong công thức chế.** `Math.floor(Math.random()*2)` ở cả hai công thức
   thay bằng tra theo `player.sect`. Ngẫu nhiên giữa hai cánh **không phải rủi ro có ý nghĩa** —
   nó chỉ là thuế bấm lại.
3. **Giữ nguyên hai cổng cấp đang có: 40 và 80.** Bậc 3 mở ở **cấp 100** — trùng cổng vào
   **Stormgate Pass**, map cuối. `MAX_LV = 120` (dòng 59) nên còn 20 cấp để dùng.
   ⚠ Nếu sau này `MAX_LV` dời lên 400 cùng Vùng Vỡ Ấn (đã ghi ở dòng 14982), cổng bậc 3 phải
   dời theo — đừng để nó dính cứng ở 100.
4. **Bậc 3 là bậc ĐẦU TIÊN có rủi ro.** Bậc 1 và 2 giữ `rate: 100`. Bậc 3 đặt **70%**, cho phép
   **Thiên Mệnh Phù** (`charm:true`) đẩy lên chắc chắn. Đây là cách bê tinh thần 40% của MU vào
   mà không bắt người chơi mất một đôi cánh bậc 2 đã cày cả chục giờ.
5. **Bậc 3 mở dòng `defPct`.** Cánh MU luôn cho **cả hai chiều**: tăng sát thương gây ra **và**
   giảm sát thương nhận. `WING_DEFS`/`WING2_DEFS` hiện **không có một dòng `defPct` nào** — chỉ
   áo choàng có (`CLOAK_TIERS[2].defPct = 5`). Đề xuất: bậc 2 thêm 4–6, bậc 3 thêm 8–10, tức là
   **bám đúng thang của áo choàng đang có**, không dựng thang mới.
6. **Cánh phải hiện trên `drawHeroFigure`, không chỉ trong màn.** Xem C.4.

### C.1. Thang chỉ số — nội suy từ số ĐANG CÓ, không bịa thang mới

| | Dòng chính cao nhất | Số dòng phụ | Nguồn |
|---|---|---|---|
| Bậc 1 hiện có | **12** | 2 | `WING_DEFS` |
| Bậc 2 hiện có | **24** | 3 | `WING2_DEFS` |
| **Bậc 3 đề xuất** | **34** | **3** (+ dòng `defPct` mới) | nội suy |

Bước nhảy: `12 → 24` là **+12**; `24 → 34` là **+10**. Bước sau nhỏ hơn bước trước, đúng đường
cong giảm dần mà `GIAI_POW` và `HERO_METAL` đang đi. Đối chiếu MU: `12% → 32% → 39%`, bước
`+20` rồi `+7` — cũng giảm dần. Hình dạng khớp; con số thì theo thang của game này, không theo MU.

⚠ **Chỉ dùng 10 khoá mà `specialItem` đọc** (xem B.5). Mọi khoá khác bị bỏ lặng lẽ, không báo lỗi.

### C.2. Bảng 15 cánh

**Quy ước đặt tên:** bậc 1 là **"Cánh …"** (nhỏ, thô, gọi tên chất liệu) · bậc 2 là **"… Dực"**
(theo đúng nếp `Phượng Hoàng Linh Dực` / `Hắc Ma Linh Dực` đang có) · bậc 3 là **"Thần Dực …"**.
Tên bậc 2 và 3 móc vào **tên bộ giáp của chính lớp đó** trong `HERO_SETS` (Hắc Giáp, Hư Vô,
Hoả Ngục, Ngai Đen, Lông Ưng…) để người chơi thấy cả người là một bộ, không phải đồ nhặt lung tung.

#### Bậc 1 — cổng cấp **40**

| Lớp | Tên đề xuất | id đề xuất | Màu | Chỉ số |
|---|---|---|---|---|
| Dark Knight | **Cánh Thiết Vũ** | `w1_dk` | `#8a92a4` | `hpPct:12` · `defPct:4` · `evaPct:4` |
| Sylvan Ranger | **Cánh Lá Bạc** | `w1_sr` | `#dbe2ff` | `evaPct:8` · `aspdPct:6` · `silverPct:15` |
| Dark Wizard | **Cánh Lân Quang** | `w1_dw` | `#7ec850` | `atkPct:12` · `crit:4` · `expPct:10` |
| Spellblade | **Cánh Than Hồng** | `w1_sb` | `#ff9a5a` | `atkPct:12` · `aspdPct:6` · `crit:5` |
| Dark Lord | **Cánh Lệnh Kỳ** | `w1_dl` | `#8a9a3a` | `hpPct:10` · `atkPct:8` · `silverPct:20` |

Đối chiếu để thấy không lệch thang: `Cánh Thiên Thần` = `hpPct:12 evaPct:6 silverPct:20`;
`Cánh Tiểu Quỷ` = `atkPct:12 crit:5 aspdPct:6`. Dòng chính vẫn là **12**, số dòng vẫn là 3.

#### Bậc 2 — cổng cấp **80**

| Lớp | Tên đề xuất | id | Màu | Chỉ số |
|---|---|---|---|---|
| Dark Knight | **Hắc Nguyệt Dực** | `w2_dk` | `#5c6270` | `hpPct:20` · `atkPct:12` · `defPct:6` · `evaPct:6` |
| Sylvan Ranger | **Sương Lâm Dực** | `w2_sr` | `#7ec8ff` | `atkPct:20` · `aspdPct:12` · `evaPct:8` · `crit:6` |
| Dark Wizard | **Hoại Vụ Dực** | `w2_dw` | `#5db86a` | `atkPct:22` · `crit:10` · `pierce:6` · `expPct:12` |
| Spellblade | **Liệt Hỏa Dực** | `w2_sb` | `#ff7a3a` | `atkPct:24` · `aspdPct:10` · `crit:8` · `hpLeech:4` |
| Dark Lord | **Bạo Chúa Dực** | `w2_dl` | `#d0e07a` | `atkPct:18` · `hpPct:15` · `defPct:6` · `silverPct:25` |

Đối chiếu: `Phượng Hoàng Linh Dực` = `atkPct:20 hpPct:15 crit:8 aspdPct:10`;
`Hắc Ma Linh Dực` = `atkPct:24 pierce:8 hpLeech:5 crit:10`. Trần dòng chính vẫn là **24**.

#### Bậc 3 — cổng cấp **100**

| Lớp | Tên đề xuất | id | Màu | Chỉ số |
|---|---|---|---|---|
| Dark Knight | **Thần Dực Bão Thép** | `w3_dk` | `#c8d4e8` | `hpPct:30` · `atkPct:18` · `defPct:10` · `evaPct:8` |
| Sylvan Ranger | **Thần Dực Nguyệt Lâm** | `w3_sr` | `#9ed4ff` | `atkPct:30` · `aspdPct:16` · `evaPct:12` · `crit:10` |
| Dark Wizard | **Thần Dực Hư Vô** | `w3_dw` | `#c07fe0` | `atkPct:32` · `crit:14` · `pierce:10` · `defPct:8` |
| Spellblade | **Thần Dực Vực Lửa** | `w3_sb` | `#f39c3d` | `atkPct:34` · `aspdPct:14` · `crit:12` · `hpLeech:7` |
| Dark Lord | **Thần Dực Ngai Đen** | `w3_dl` | `#ffd76a` | `atkPct:28` · `hpPct:22` · `defPct:10` · `silverPct:35` |

**Bản sắc lớp đọc được qua dòng phụ, đúng như MU làm:** Dark Knight là lớp duy nhất lấy `hpPct`
làm dòng chính ở mọi bậc · Sylvan Ranger độc quyền `evaPct` cao và `aspdPct` cao nhất ·
Dark Wizard độc quyền `expPct` · Spellblade độc quyền `hpLeech` · Dark Lord độc quyền `silverPct` cao.

### C.3. Đường chế tạo

Cả ba đều `royal:true` (chỉ chạy tại **Lò Rèn Hoàng Gia**), giữ nguyên nếp của `wing1`/`wing2`.
Nguyên liệu phân loại theo đúng quy ước `CLAUDE.md`: thứ **rời rạc** phải bỏ vào khay
(`jewelCost`), thứ **số lượng lớn** trừ thẳng kho (`chaosCost`).

| | **Bậc 1** (`wing1`, sửa) | **Bậc 2** (`wing2`, sửa) | **Bậc 3** (`wing3`, mới) |
|---|---|---|---|
| Khay | 1 trang bị **Hoàn Hảo +4** (tiêu hủy) | 1 **cánh bậc 1** (thăng tại chỗ) | 1 **cánh bậc 2** (thăng tại chỗ) **+ 1 trang bị Cổ Vật hoặc Chí Tôn rèn ≥ +9** (tiêu hủy) |
| Ngọc rời (khay) | 1 **Hỗn Độn Châu** | 1 **Hỗn Độn Châu** | **2 Hỗn Độn Châu** |
| Trừ thẳng kho | 10 Hỗn Nguyên · 5.000 Lumen | 20 Hỗn Nguyên · 10.000 Lumen | **40 Hỗn Nguyên · 10 Tu La Tinh Thạch · 30.000 Lumen** |
| Cổng cấp | **40** | **80** | **100** |
| Tỉ lệ | 100% | 100% | **70%**, `charm:true` (Thiên Mệnh Phù bảo hộ) |
| Kết quả | cánh bậc 1 **của lớp đang chơi** | cánh bậc 2 **của lớp đang chơi** | cánh bậc 3 **của lớp đang chơi** |
| Hỏng thì sao | — | — | mất trang bị hiến tế và ngọc; **cánh bậc 2 trong khay GIỮ NGUYÊN** |

**Bốn ghi chú thi công:**
- **Ba trường, không phải một.** Bậc 3 ghi `it.wing3`. Chỗ vẽ ở dòng 13835 phải tra theo thứ tự
  `wing3 → wing2 → wing → WING_DEFS[0]`. Bỏ sót đúng như lỗi đã sập ở bậc 2 (B.3).
- **Thăng tại chỗ** dùng `itemLoc(uid)` để ghi đè đúng ô đang mặc hoặc đúng ô túi — đã có sẵn ở
  dòng 14553–14555, chép nguyên.
- **Hỏng KHÔNG được nuốt cánh bậc 2.** Đây là lý do bậc 3 đòi thêm một món hiến tế: nó là thứ
  bị đốt khi xịt. Nếu để cánh bậc 2 bốc hơi thì 70% cũng là một cú đánh cược không ai dám chơi.
- **Chuỗi trao thưởng khi túi đầy** phải theo đúng nếp `wing1` (dòng 14524): không được để món
  bốc hơi — hoặc hoàn Lumen, hoặc `dropToGround` với nhãn `⚠ TÚI ĐẦY`.

**Rơi từ trùm.** Giữ 12% ở dòng 7421 nhưng đổi `Math.floor(R()*2)` thành cánh bậc 1 **của lớp
đang chơi**. Bậc 2 và 3 **không rơi** — chỉ chế tạo, giống MU.

### C.4. Chỉ dẫn tạo hình — đủ chi tiết để vẽ bằng canvas 2D

**Bốn luật chung, áp cho cả 15 cánh:**

1. **Sải cánh là thứ đọc ra bậc.** Bậc 1 = **40 px** mỗi bên · bậc 2 = **52 px** · bậc 3 = **66 px**
   (hiện tại mọi bậc đều 46 px). Nhân vật trong màn cao ~**104 px**, nên bậc 3 rộng
   `132/104 ≈ 1,27×` chiều cao thân — đúng tỉ lệ "rộng hơn người" của MU mà không tràn hết màn.
2. **Số thùy mỗi bên leo theo bậc: 2 → 3 → 4.** Thùy thứ `k` (đếm từ trong ra) lấy `alpha`
   `0.88 − 0.14k` và **trễ pha** `k × 0.5 rad` so với thùy trong cùng. Trễ pha là thứ tạo cảm
   giác cánh **mềm**; cùng pha thì bốn thùy dính thành một mảng.
3. **Cánh phải đọc `player.sway` / `player.swayDir`**, không đọc thẳng `performance.now()`.
   Đây là luật đã ghi trong `CLAUDE.md` cho mọi bộ phận mềm, và cánh đang là bộ phận mềm **duy
   nhất trong game vi phạm** (B.6). Công thức đề xuất:
   `lift = Math.sin(now/280)*bienDo + sway*8` và **điểm điều khiển ngoài cùng lệch theo `swayDir`**
   để cánh **biến dạng** chứ không chỉ nhấp lên xuống — giống hệt cách áo choàng làm ở dòng 13809.
4. **Cánh phải hiện trên `drawHeroFigure` nữa, không chỉ `drawPlayer`.** Cụ thể:
   - `gearVisual(p)` (dòng 10418) trả thêm `wing: {tier, def}` đọc từ `p.equip.canh`;
   - thêm một lớp `hWings(g, gv, ps, now)` vào `drawHeroFigure`, đặt **ngay sau `hPlusAura`**
     (dòng 12941, trước `hCape`) để cánh nằm sau lưng và **trước** áo choàng;
   - khi `ps.back` (nhân vật quay lưng) thì vẽ cánh **sau** thân, phủ lên — cùng cách `hCape` xử lý;
   - ⚠ khoá `_heroCardCache` (dòng 12979–12980) **phải thêm chữ ký cánh**, nếu không thẻ nhân vật
     hiện mãi ảnh cũ sau khi thăng cánh — đúng cái bẫy `CLAUDE.md` đã cảnh báo.

**Hình học nền, tính từ `p.x`/`p.y` (chân nhân vật), `S` = sải cánh của bậc:**

```
gốc trong    ( side*6,  -24 )
cung 1 ctrl  ( side*S*0.57, -44 - lift )
cung 1 đích  ( side*S,      -32 - lift )      ← mút cánh
cung 2 ctrl  ( side*S*0.74, -16 )
cung 2 đích  ( side*8,      -15 )             ← khép về thân
```

Thùy thứ `k` co lại: nhân `S` với `1 − 0.17k`, nâng gốc lên `+6k` px, giảm `lift` còn `(1−0.3k)×`.

---

#### Bậc 1 — vật chất thô, hai thùy, không hào quang

**Cánh Thiết Vũ · Dark Knight** — `S = 40`, 2 thùy
Bốn **phiến kim loại** hình lưỡi dao, KHÔNG cong mềm: thay `quadraticCurveTo` cung 2 bằng
`lineTo` để mép dưới thành **đường gãy**, cho ra dáng cứng. Thân phiến `#8a92a4`, mép dưới vẽ
đè một dải `#5c6270` dày 3 px. Nhịp vỗ **chậm nhất trong game**: chu kỳ 360 ms, biên độ ±1,6 px
— cánh nặng thì lười.

**Cánh Lá Bạc · Sylvan Ranger** — `S = 40`, 2 thùy
Lông vũ thật: sau khi tô thùy, vẽ **5 gân lông** — 5 đoạn thẳng `#eef2ff` dày 1 px, alpha 0.35,
toả nan quạt từ gốc `(side*6, -24)` ra 5 điểm chia đều trên cung 1. Thân `#dbe2ff`. Chu kỳ
240 ms, biên độ ±3 px — cánh nhẹ, vỗ nhanh nhất bậc 1.

**Cánh Lân Quang · Dark Wizard** — `S = 40`, 2 thùy
Không phải lông cũng không phải màng: **màn sáng** — tô bằng `createLinearGradient` từ
`(p.x, p.y-24)` tới mút cánh, `#7ec850` alpha 0.75 → `#c8ffa0` alpha 0.15. Rìa ngoài để hở
(không viền). Chu kỳ 300 ms, biên độ ±2,4 px, **cộng thêm** một dao động phụ chu kỳ 90 ms biên
độ ±0,6 px cho cảm giác chập chờn của lửa lân tinh.

**Cánh Than Hồng · Spellblade** — `S = 40`, **2 thùy nhưng LỆCH HAI BÊN**
Chữ ký của lớp là **lệch vai** (`halfplate` ở cả 5 dải trong `HERO_SETS`) — cánh phải nối tiếp
chữ ký đó: bên `side = +1` dùng `S = 40`, bên `side = -1` dùng `S = 30` và chỉ **1 thùy**. Màng
`#ff9a5a`; dọc mép cung 1 vẽ **3 đốm than** `#ffd76a` bán kính 2 px, độ sáng dao động lệch pha
nhau. Chu kỳ 260 ms, biên độ ±2,6 px.

**Cánh Lệnh Kỳ · Dark Lord** — **không phải cánh**
Dark Lord là lớp chỉ huy, và MU cũng cho Dark Lord **áo choàng** chứ không cho cánh. Vẽ **hai lá
cờ đuôi nheo** treo trên một thanh ngang sau vai: thanh ngang `#c8a86a` dài 34 px ở `p.y - 30`;
mỗi lá cờ là hình thang từ đầu thanh rủ xuống `p.y + 4`, mép dưới lượn sóng bằng 3 cung bậc hai.
Vải `#8a9a3a`, viền dưới `#d0e07a` dày 1,5 px.
⚠ **Phải đọc `sway`, không đọc đồng hồ** — cờ mà vỗ đều tay là hỏng hẳn cảm giác. Cờ phất theo
`swayDir` với biên độ gấp **1,5×** áo choàng (áo choàng đang dùng `±4 px` ở dòng 13812).
⚠ Kiểm mắt: ô `aochoang` và ô `canh` **mặc được cùng lúc**. Cờ treo cao (`p.y - 30`) và ngắn
(tới `p.y + 4`) trong khi áo choàng rủ tới `p.y + 14` — đặt vậy để hai thứ không chồng thành một
mảng màu. **Phải chụp ảnh ra xem** với cả hai món cùng mặc trước khi chốt.

---

#### Bậc 2 — thêm khung kim loại, thùy thứ ba, hào quang mép

Chung cho cả 5: `S = 52`, **3 thùy**, và thêm **một lượt vẽ viền** — `ctx.stroke()` dọc cung 1
của thùy ngoài cùng, dày 1,8 px, alpha 0.55, màu sáng hơn thân một nấc.

| Cánh | Thân | Viền/khung | Nét riêng |
|---|---|---|---|
| **Hắc Nguyệt Dực** (DK) | `#5c6270` | `#4c8dff` | Phiến gãy góc như bậc 1 nhưng **3 phiến chồng lệch**; giữa mỗi phiến một khe hở 2 px lộ nền tối `#14163a`. Chu kỳ 360 ms. |
| **Sương Lâm Dực** (SR) | `#7ec8ff` | `#a0ffe9` | Gân lông tăng lên **8 gân**, và thùy ngoài cùng vẽ bằng `alpha 0.45` để trông như tan vào sương. Chu kỳ 240 ms. |
| **Hoại Vụ Dực** (DW) | `#5db86a` | `#b08ae8` | Màn sáng gradient như bậc 1 nhưng thêm **6 chấm bào tử** `#c8ffa0` bán kính 1,5 px **trôi dọc theo cung 1** (tham số `t` chạy 0→1 rồi lặp), rơi lại phía sau khi nhân vật chạy. |
| **Liệt Hỏa Dực** (SB) | `#ff7a3a` | `#ffd76a` | Giữ lệch hai bên: phải 3 thùy `S=52`, trái 2 thùy `S=38`. Đốm than lên **6 đốm**, và mép cung 1 vẽ răng cưa (chia cung thành 5 đoạn, đoạn chẵn lùi vào 3 px). |
| **Bạo Chúa Dực** (DL) | `#d0e07a` | `#c8a86a` | Thanh ngang dài **44 px**, treo **3 lá cờ** mỗi bên; lá giữa dài nhất. Thêm một **huy hiệu** ở giữa thanh: đa giác 5 cạnh `#c8a86a` bán kính 5 px. |

---

#### Bậc 3 — năng lượng lấn át vật chất

Chung cho cả 5: `S = 66`, **4 thùy**, và **ba lớp mới** mà bậc 1–2 không có:

- **E1. Hào quang sau cánh.** `createRadialGradient` tâm `(p.x, p.y - 30)`, bán kính 78 px, từ
  màu cánh alpha 0.22 ra trong suốt. Vẽ **trước** mọi thùy. Nhấp theo `0.18 + 0.06·sin(now/420)`.
  ⚠ **Không dùng `ctx.shadowBlur` và không dùng `ctx.filter`** — luật đã ghi trong `CLAUDE.md`,
  chúng buộc canvas dựng surface phụ mỗi khung.
- **E2. Hạt bay.** 8 hạt, mỗi hạt là một hình tròn bán kính 1–2 px, sinh ở **mút cánh**, trôi
  lên và **lùi lại** ngược hướng `p.face`, tắt dần trong 0,8 giây. Đây là thứ đắt nhất về hình
  ảnh mà rẻ nhất về chi phí vẽ — dùng lại đúng cơ chế `hPlusSpark` đang có (dòng gọi ở 12967).
- **E3. Vệt sáng khi di chuyển.** Chỉ khi `p.moving`: vẽ **một bản mờ của thùy ngoài cùng**, dời
  ngược hướng chạy 10 px, alpha 0.20. Một lớp, không phải chuỗi bóng — chuỗi bóng là chi phí
  tuyến tính theo số khung.

| Cánh | Thân | Sáng | Tạo hình riêng |
|---|---|---|---|
| **Thần Dực Bão Thép** (DK) | `#c8d4e8` | `#8fd0ff` | 4 phiến gãy góc, **khe hở giữa các phiến lấp bằng tia sáng** `#8fd0ff` alpha 0.5 dày 2 px. Hạt bay là **tia điện ngắn** (đoạn thẳng 4 px) chứ không phải chấm tròn. Chu kỳ 360 ms — bậc 3 mà vẫn nặng nhất. |
| **Thần Dực Nguyệt Lâm** (SR) | `#9ed4ff` | `#dfe8ff` | 4 thùy **xếp lệch như lông đuôi công**: mỗi thùy xoay thêm `k × 0.12 rad`. Gân lông 10 sợi, sợi ngoài cùng vượt khỏi mép thùy 6 px thành **tua lông**. Hạt bay là bụi sáng trắng. |
| **Thần Dực Hư Vô** (DW) | `#c07fe0` | `#c8ffa0` | **Thùy trong đặc, thùy ngoài rỗng**: thùy 3 và 4 chỉ vẽ đường viền (`stroke`, không `fill`) — cánh như đang tan ra. Hào quang E1 đổi thành gradient **hai màu**, `#c07fe0` ở tâm ra `#7ec850` ở rìa. |
| **Thần Dực Vực Lửa** (SB) | `#f39c3d` | `#ffe9a0` | Giữ lệch hai bên tới cùng: phải 4 thùy `S=66`, trái 2 thùy `S=44`. Mép cung 1 răng cưa sâu 5 px. Hạt bay là **tàn lửa `#ff7a3a` bay LÊN** (không lùi lại) — chép nguyên cơ chế của `hPlusSpark`. |
| **Thần Dực Ngai Đen** (DL) | `#ffd76a` trên nền `#10122a` | `#ffd76a` | Không thành cánh: **một tấm mantle lớn** rộng 66 px mỗi bên, vải `#10122a` (gần đen), **viền vàng `#ffd76a` dày 2,5 px** chạy hết mép ngoài. Mép dưới lượn 5 cung bậc hai đọc theo `sway`. Giữa lưng vẽ **huy hiệu đa giác 5 cạnh** `#ffd76a` bán kính 9 px, xoay chậm 1 vòng / 6 giây. Hạt bay: **vảy vàng rơi XUỐNG**. |

---

### C.5. Kiểm tra trước khi chốt

- **Chụp ảnh ra mà nhìn.** `CLAUDE.md` đã ghi ba lỗi hình *chỉ lộ khi chụp, không lỗi nào lộ khi
  đọc code* (nhẫn ra hình móng ngựa, găng ra thanh sô-cô-la, kiếm cao hơn cả người). Cánh có
  cùng rủi ro: cụ thể là **cánh che mất đầu nhân vật** khi thùy trên cùng cao quá `p.y - 44`, và
  **cánh + áo choàng cùng mặc chồng thành một mảng màu**. Cả hai chỉ thấy được trên ảnh.
- **Phép đo bắt buộc:** đo số pixel khác nhau giữa nhân vật không cánh / bậc 1 / bậc 2 / bậc 3,
  y hệt cách `test_gearlook.js` đo bậc trang bị. Yêu cầu: **phình đều theo bậc**, và **bề ngang
  đường viền thân đặc phải tăng** ở mỗi bậc (ngưỡng alpha **180**, không phải 8 — lấy ngưỡng thấp
  là đo nhầm mép hào quang).
- **Đo cánh của 5 lớp cạnh nhau ở cùng một bậc**, tô đặc một màu rồi nhìn: **năm cái bóng phải
  khác hẳn nhau**. Nếu phải đọc màu mới biết lớp nào thì chưa đạt — đúng tiêu chuẩn đang áp cho
  `CHIBI_CFG` và `HERO_SETS`.
- **Kiểm hiệu năng:** 5 lớp × 4 thùy × 2 bên = 40 đường cong mỗi khung, cộng 8 hạt và 1 vệt sáng.
  Đo `render()` trước/sau. Nếu tụt khung hình, cắt E3 (vệt sáng) trước — nó đóng góp ít nhất.
- **Kiểm chuỗi chữ:** không được để lọt tên riêng MU Online vào chữ người chơi thấy, và không
  ký tự CJK nào:
  `python3 -c "import re;print(sum(1 for l in open('public/game/game.js',encoding='utf-8') if re.search(r'[　-〿一-鿿＀-￯゠-ヿ぀-ゟ]',l)))"`

### C.6. Việc còn để ngỏ, không tự quyết

| | Chỗ chờ quyết |
|---|---|
| Tên hệ | Trong game đang gọi lẫn lộn **"Cánh"** (`SLOTS`) và **"Linh Dực"** (tên công thức, banner). Nên chốt một tên. |
| Tên nơi chế | **"Lò Bảo Chứng"** (dòng 7691) vs **"Lò Hỗn Độn"** (mọi chỗ khác) — hai tên cho một cỗ máy. |
| Cổng cấp bậc 3 | Đặt **100** theo `MAX_LV = 120` hiện tại. Nếu `MAX_LV` dời lên 400, phải dời theo. |
| Tỉ lệ 70% ở bậc 3 | Đây là con số đề xuất, chưa đo. Game hiện **không có công thức chế nào dưới 100%**, nên đây là thay đổi về triết lý — cần chủ dự án gật đầu. |
| Cánh cho `vophai` | Unclassed chỉ tồn tại tới cấp 10, còn cổng cánh bậc 1 là cấp 40 ⇒ **không cần cánh**. Nhưng `itemUsable` vẫn phải xử lý trường hợp save cũ có cánh mà lớp là `vophai`. |
