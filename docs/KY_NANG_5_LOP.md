# Bộ Kỹ Năng 5 Lớp — chuẩn theo MU Online Season 2

Nguồn tham chiếu: `docs/ref/MU_Season2_Skill_Guide.html` (bản khảo sát skill 5 class cơ bản của
MU Online Season 2, do chủ dự án cung cấp).

> Quy tắc bản quyền vẫn giữ nguyên: lấy **cấu trúc và tên chiêu thức** (Twisting Slash, Evil
> Spirit, Penetration… — tên kỹ năng, không phải tên riêng của thế giới MU), **không** lấy tên
> vùng đất/lớp nhân vật của họ. Fairy Elf → **Sylvan Ranger**, Magic Gladiator → **Spellblade**.

---

## 1. Vì sao phải làm lại

Ba lỗi lớn, cả ba đều nhìn thấy được trong game:

**a. Cây kỹ năng của lớp này chứa chiêu của lớp khác.** Mở bảng K của một Sylvan Ranger thì mục
"DI SẢN NGOẠI LỚP" liệt kê Cyclone và Crescent Moon Slash (Dark Knight) cùng Lightning, Ice,
Twister, Nova (Dark Wizard) — mua bằng Sách Kỹ Năng. Một cung thủ đọc bảng chiêu của mình thấy
gần trọn bộ chiêu pháp sư. MU Online không có cơ chế đó: **vũ khí và chiêu thức chính là bản sắc
lớp**. Ngoại lệ duy nhất trong MU là Magic Gladiator — lớp lai — được *kế thừa* vài chiêu của hai
lớp gốc, và đó là đặc điểm riêng của nó chứ không phải một cửa hàng chung.

**b. Năm lớp na ná nhau ở chỗ quan trọng nhất — ô buff.** Ba trong năm lớp có buff giống hệt về
cơ chế, chỉ khác con số: Greater Damage +35% ST (Ranger), Battle Fury +30% ST (Spellblade),
Command Aura +25% ST (Dark Lord). Cả năm ô buff lại không khai hoạt ảnh riêng nên cùng rơi về một
style `vajra` — bấm buff của lớp nào cũng ra đúng một vòng ấn quay.

**c. Chiêu ghi một đằng, làm một nẻo.**
- Ice Arrow (Trấn Phái của Ranger) chạy hoạt ảnh `hexa` — trận đồ lục tinh còn sót từ bản kiếm
  hiệp: bắn mũi tên băng mà màn hình hiện một vòng sao. Hoạt ảnh băng đúng của nó nằm ở khoá
  `sx_toanchan_b`, một khoá **không ai đọc**.
- Swell Life / Greater Fortitude ghi "+15% HP, +10% giảm sát thương", Heal ghi "hồi 1% HP mỗi
  giây", Iron Will ghi "+10% HP, +8% giảm sát thương" — **không dòng nào nối vào chỉ số nào**.
  Cả ba chỉ âm thầm cộng %ST như mọi chiêu di sản khác.
- Chaotic Diseier và Dark Raven của Dark Lord dùng **chung** hoạt ảnh `crowswarm`: hai chiêu của
  cùng một lớp trông y hệt nhau.
- Ô buff của Dark Knight tên "Stone Skin" nhưng chữ nổi hô "STONE SKIN!" trong khi MU gọi chiêu
  đó là **Defense**; nhánh này còn tự vẽ hai vòng tròn thay vì gọi hệ hoạt ảnh, nên nó là ô buff
  duy nhất không thể có hình riêng.

---

## 2. Bốn ô bấm được — mỗi lớp một bộ, mỗi chiêu một hoạt ảnh

| Lớp | 1 · Chính | 2 · Phụ | 3 · Buff | 4 · Tuyệt chiêu |
|---|---|---|---|---|
| **Dark Knight** | Twisting Slash `bladewhirl` | Death Stab `stabburst` | **Defense** `seal4` | Rageful Blow `groundburst` |
| **Sylvan Ranger** | **Triple Shot** `arrow` | Ice Arrow `icefall` | **Bless** `sunwheel` | Penetration `lance` |
| **Dark Wizard** | Poison `poisonbloom` | **Meteorite** `meteor` | Soul Barrier `hexa` | Evil Spirit `spiritdragon` |
| **Spellblade** | Fire Slash `fireslash` | Flame Strike `flamewall` | Battle Fury `phoenix` | Power Slash `lightwave` |
| **Dark Lord** | Force Wave `windslash` | Fire Scream `firepillar` | **Increase Critical Damage** `galaxy` | **Earthquake** `quakeburst` |

Không hoạt ảnh nào dùng lại ở hai lớp. `quakeburst` là hoạt ảnh **mới**: ba nhịp — giậm (vòng bụi
nén vào tâm) → nứt (đường gãy khúc chạy ra) → bật (đá vụn nảy lên rồi rơi). Nó cố tình khác
`groundburst` của Rageful Blow, vốn là một cú giáng thẳng không có nhịp nén.

### Năm ô buff, năm cơ chế khác nhau

| Lớp | Buff | Làm gì | Có trong MU |
|---|---|---|---|
| Dark Knight | Defense | −30% sát thương gánh chịu, 6s | ✓ DK Defense |
| Sylvan Ranger | Bless | hồi ngay 25% HP tối đa + 25% ST, 8s | ✓ Elf Bless / Heal |
| Dark Wizard | Soul Barrier | khiên hấp thụ bằng 45% HP tối đa | ✓ DW Soul Barrier |
| Spellblade | Battle Fury | +20% ST **và +22% tốc đánh** | lớp lai, đánh bằng nhịp |
| Dark Lord | Increase Critical Damage | **mọi đòn đều bạo kích 4s** + 15% ST | ✓ DL Increase Critical Damage |

Ranger là lớp duy nhất hồi máu bằng chiêu — đúng vai hỗ trợ trong MU. Dark Lord đổi sát thương
nền thấp lấy một cửa sổ bạo kích tuyệt đối.

---

## 3. Di sản của lớp — 4 chiêu mỗi lớp, +8,0% Công Kích

Chiêu di sản không bấm được: chúng tự ngộ theo cấp rồi quy đổi thành % Công Kích vĩnh viễn.
Bản cũ chia không đều — Dark Knight được 4,0% còn Dark Wizard 9,5%, chênh 5,5% Công Kích chỉ vì
lớp này tình cờ khai nhiều chiêu hơn lớp kia. Nay **cả năm lớp đúng bốn chiêu, bậc
sơ + trung + trung + cao = 8,0%**.

| Lớp | Sơ | Trung | Trung | Cao |
|---|---|---|---|---|
| Dark Knight | Cyclone | Lunge | Impale | Falling Slash |
| Sylvan Ranger | Poison Arrow | Greater Defense | Holy Bolt | Five Shot |
| Dark Wizard | Lightning | Ice | Twister | Inferno |
| Spellblade | Fireball ¹ | Power Wave ¹ | Twisting Slash ² | Gigantic Storm |
| Dark Lord | Force | Electric Spark | Fire Burst | Dark Horse |

¹ ² Kế Thừa — Spellblade là lớp lai, MU cho nó mượn chiêu của Dark Wizard ¹ và Dark Knight ².
Đây là **cách duy nhất** một chiêu xuất hiện ở hai lớp, và bảng ghi rõ "Kế Thừa · <lớp gốc>".

---

## 4. Bị động của lớp — mỗi lớp một cái, và nó chạy thật

Tách hẳn khỏi mục di sản, hiện ở mục riêng "BỊ ĐỘNG CỦA LỚP" trong bảng K.

| Lớp | Bị động | Hiệu ứng (đã nối vào code) |
|---|---|---|
| Dark Knight | **Swell Life** | +15% HP tối đa — `calcDerived` |
| Dark Knight | **Undying Will** | chết tự hồi sinh 50% HP, mỗi 300s |
| Sylvan Ranger | **Heal** | +1% HP tối đa mỗi giây, kể cả trong combat — `update` |
| Dark Wizard | **Arcane Insight** | 30% chiêu vừa tung không tốn hồi chiêu |
| Spellblade | **Iron Will** | hút 6% sát thương gây ra thành HP — `player.hpLeech` |
| Dark Lord | **Dark Raven** | +12% sát thương của mọi chiêu — `player.skillDmgPct` |

Dark Knight giữ hai bị động: đó là lớp chống chịu, và Undying Will đã có sẵn từ trước.

---

## 5. Sách Kỹ Năng đổi chỗ tiêu

Bỏ "di sản ngoại lớp" là bỏ **đường tiêu duy nhất** của Sách Kỹ Năng, nên nó phải có chỗ khác,
nếu không lại thành tiền tệ chết (đúng cái bẫy đã mắc một lần trước đây).

Nay: **1 quyển = nâng thẳng 1 cấp cho một chiêu của chính lớp mình**, bỏ qua cả bạc lẫn Instinct.
Nút 📜 nằm ngay cạnh nút ⬆ ở từng dòng chiêu. Vẫn tôn trọng hai chốt cũ: cấp chiêu ≤ cấp nhân
vật, và tối đa Lv 120.

Hai kết quả jackpot của Vực Thẳm ("hang động giấu cổ thư", "hiền giả chỉ điểm") trước đây tặng
một chiêu ngoại lớp; nay chúng cho **ngộ sớm** một chiêu của chính lớp mình — có nó trước khi tới
cấp tự ngộ, tức là +%ST sớm hơn hàng chục cấp.

---

## 6. Đổi tên cho khớp MU

| Cũ | Mới | Lý do |
|---|---|---|
| Multi-Shot | **Triple Shot** | MU: Triple Shot bắn 3 mũi, Five Shot mới là 5. Đổi `count` 5→3 và `mult` 1,5→2,5 nên **tổng sát thương không đổi**; mỗi bậc Tiến Hóa vẫn +1 mũi |
| Meteor | **Meteorite** | tên đúng trong MU |
| Stone Skin | **Defense** | tên đúng trong MU (hệ Thuần Thục vẫn giữ tên Stoneform) |
| Greater Damage | **Bless** | đổi luôn cơ chế: buff +ST đơn thuần trùng với 2 lớp khác |
| Command Aura | **Increase Critical Damage** | tên đúng trong MU |
| Chaotic Diseier | **Earthquake** | chiêu cũ dùng chung hoạt ảnh bầy quạ với Dark Raven |
| Crescent Moon Slash | **Falling Slash** | tên đúng trong MU |
| Greater Fortitude | **Swell Life** | tên đúng trong MU |
| Nova | **Inferno** | Nova không thuộc Season 2 |
| Frost Nova (Spellblade) | **Fireball** (kế thừa) | Spellblade không có chiêu băng; ba lớp cùng có chiêu băng là thừa |
| Dark Spirit (Dark Lord) | **Fire Burst** | trùng tên với Evil Spirit của Dark Wizard |
| Swift Wind | **Poison Arrow** | Swift Wind không thuộc bộ Fairy Elf |

Hai id giữ nguyên dù đổi tên hiển thị — `dl_chaoticdiseier` (nay là Earthquake) và
`elf_greaterdmg` (nay là Bless) — vì chúng nằm ở ô bấm được và có cấp chiêu đã nâng; đổi id là
người chơi mất sạch số bạc/Instinct đã đổ vào.

---

## 7. Chưa làm

- **Triệu hồi của Sylvan Ranger** (Summon Goblin / Stone Golem / Elite Yeti…): MU cho Elf gọi
  lính đánh thuê. Game đã có hệ Linh Thú/Thú Chiến làm đúng vai đó, nên chưa thêm — nếu muốn thì
  nên nối vào Linh Thú thay vì dựng hệ triệu hồi thứ hai.
- **Combo của Dark Knight** (3 chiêu liên tiếp): game đã có Liên Trảm (cửa sổ 2,5s miễn Mana cho
  chiêu kế tiếp) — cùng ý tưởng, chỉ chưa gọi tên là Combo.
- **Teleport của Dark Wizard**: đụng vào hệ di chuyển và cân bằng PK, để riêng.
