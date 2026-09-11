# Khảo sát lần 2 — kho Axie còn gì, và suy ra được TÍNH NĂNG gì

**Ngày:** 2026-09-11 · **Bản kho:** `069a59b` — `git fetch` xác nhận **không có commit mới**
kể từ lần khảo sát trước (2026-09-03), dù trang GitHub hiện "updated 2026-09-05" (đó là hoạt
động issue, không phải mã).

Lần 1 (`docs/KHAO_SAT_AXIE_KIT.md`) soi **âm thanh + VFX**. Lần này soi phần còn lại và trả lời
một câu khác: *kho có thứ gì mà game đang THIẾU một tính năng vì không có nó?*

> ⚠ **GIẤY PHÉP KHÔNG ĐỔI** — "Use is limited to Axie Vibeathon and other Sky Mavis-approved
> programs." Mọi đề xuất dưới đây đứng trên đúng một câu xác nhận rằng dự án này thuộc chương
> trình được duyệt. Không còn đúng thì cả tài liệu này vô nghĩa.

---

## 0. ⚠ `read_skel()` CHƯA BAO GIỜ ĐỌC HOẠT CẢNH — của rig nào cũng vậy

Chạy `read_skel()` của dự án lên cả 20 rig Chimera thì **cả 20 đều trả `0 hoạt cảnh`**:

```
alpha-wolf.skel      0 hoạt cảnh ·  89 xương
werewolf.skel        0 hoạt cảnh · 136 xương
aqua-alpha-wolf.skel 0 hoạt cảnh · 227 xương
```

Số xương đọc ra đúng và khác nhau, nên nhìn qua thì tin được — và kết luận sẽ là *"Chimera chỉ
là tư thế tĩnh, không nướng hoạt cảnh được"*. **Sai.** Tên clip nằm ngay trong tệp nhị phân:

```
$ strings werewolf.skel | grep -E '^(action|attack|defense)/'
attack/melee/bite-attack · attack/ranged/cast-high · action/idle/die
defense/hit-by-normal · defense/hit-die · action/move-back · action/move-forward
action/idle/normal · attack/melee/normal-attack · action/random-01..03
```

`werewolf.skel` nặng **323 KB** trong khi rig Axie `21.skel` (28 xương, cũng "0 hoạt cảnh")
chỉ **88 KB** — cỡ tệp đã tố cáo là có dữ liệu mà trình đọc không lấy ra.

**Lý do thật, và nó KHÔNG phải một con bọ:** `read_skel()` kết thúc bằng
`return {'bones', 'slots', 'skins'}` — **không có `animations`, và không có dòng nào đọc phần
hoạt cảnh của tệp.** Nên `.get('animations')` rỗng với **mọi** `.skel`, Axie hay Chimera.

⇒ Phải **viết mới** phần đọc hoạt cảnh Spine 3.8 nhị phân, không phải sửa một chỗ hỏng. Ước
lượng công sức vì thế khác hẳn — xem `docs/LAM_DUOC_GI.md`.

**Nguồn sự thật trong lúc chưa có trình đọc:** `Catalogs/pve-chimeras.json` →
`extractedSkeletons[].unityClips` — kho tự liệt kê clip của từng rig, và đó cũng là **đáp án để
đối chiếu** khi viết trình đọc.

*(Rig Axie `.skel` trả 0 hoạt cảnh là ĐÚNG — chúng thật sự bị tước hoạt cảnh, và đó là lý do
`nuong_chi.py` mượn từ một rig `.json` cùng bộ xương 28 khớp. Với Chimera thì **không mượn
được**: 89–227 xương, bộ xương khác hẳn. Chúng phải dùng clip của chính mình.)*

---

## 1. Kho có gì mà game chưa đụng

| Thứ | Số lượng | Game hiện có gì |
|---|---|---|
| **Rig Chimera có hoạt cảnh** | **22** | 0 — quái là ảnh tĩnh |
| Icon **ý định** quái (intent) | 17 | 0 |
| Icon **trạng thái** buff/debuff | 131 | 0 |
| Nền **tách lớp** | 20 (2–10 lớp) | 8 tấm bẹt, 6 sai phép chiếu |
| **Node chiến dịch** có sẵn | 35 | 7 phó bản vừa gỡ, chưa dựng lại |
| **Đội hình trận** có sẵn | 41 | `vung`/`packs` tự sinh |
| Chân dung Chimera | 43 | 0 |
| Tranh thẻ chiêu | 166 | 0 |
| Màn thắng / thua / hoà (Spine) | 3 | 0 |
| Nhạc `.wav` | 15 | 9 bài đã đề xuất ở lần 1, `boss.wav` vẫn chưa dùng |

---

## 2. ĐỀ XUẤT — xếp theo (giá trị ÷ công sức)

### ⭐ A. Quái Chimera CÓ HOẠT CẢNH — lỗ hổng lớn nhất, và đường nướng đã có sẵn

**Hiện trạng đo được:** `MOBS` có **27 loài**, dùng **21 tệp PNG tĩnh**, và **6 loài đi mượn
ảnh của loài khác** (`duhiep.png` ×3, `assassin.png` ×3, `xanu.png` ×2, `wolf.png` ×2,
`caodo.png` ×2, `boar.png` ×2, `bandit.png` ×2). Không con nào có một khung hình thứ hai.

**Kho có 22 rig Chimera**, và clip của chúng phủ đúng cái một con quái cần:

| Clip | Có ở mấy rig |
|---|---|
| `battle/get-buff` · `battle/get-debuff` | **22/22** |
| `action/idle/normal` · `move-forward` · `move-back` | **21/22** |
| `attack/melee/normal-attack` | **20/22** |
| `defense/hit-by-normal` | **19/22** |
| `defense/hit-die` | **17/22** |
| `attack/ranged/cast-high` | 12/22 |

Hai rig `machito` và `shilin` có **đủ 41 clip** như Axie (chúng dùng bộ xương Axie).

**Vì sao đây là việc đáng làm trước mọi thứ khác:**
1. **Cốt truyện đã gọi đúng tên rồi.** Canon: *"Khí Morvahn chạm vào sinh vật Lunacia thì bẻ nó
   thành Chimera."* Bốn loài trong `MOBS` đã tên là "Chimera Phun Độc", "Dơi Chimera",
   "Chimera Rêu Nước", "Chimera Cầu Gai" — mà vẽ bằng ảnh tĩnh mượn qua mượn lại.
2. **`hit-by-normal` + `hit-die` là thứ `swingFeel()` đang thiếu đối tác.** Game đã có hitstop,
   rung màn, loé trắng — tất cả đổ lên một tấm ảnh đứng im. Quái giật khi trúng đòn và đổ khi
   chết là nửa còn lại của cảm giác chiến đấu, và nó **không tốn một dòng cân bằng nào**.
3. **Đường nướng đã chạy rồi.** `tools/spine/nuong_chi.py` + `nuong_chi_chay.py` đã nướng 16
   rig Axie ra bảng khung. Chimera chỉ khác ở chỗ **không mượn hoạt cảnh** — dùng clip của
   chính nó, tức là *bớt* một bước.
4. Nó **trả luôn món nợ** ghi ở CLAUDE.md mục ĐỔI VAI: *"rig có sẵn `defense/hit-by-normal` và
   chưa nướng. Nướng rồi thì Axie giật được khi trúng."* Cùng một đợt công cụ.

**Chi phí:** phải sửa `skelbin.py` đọc được hoạt cảnh của rig 89–227 xương (mục 0).

---

### ⭐ B. Ý ĐỊNH QUÁI (intent) — 17 icon, và nó phục vụ đúng một mệnh đề thiết kế đã chốt

`PvE/Intents/` có đủ một bộ telegraph: `AttackMelee` · `AttackRanged` · `WeakAttack` ·
`ModerateAttack` · `StrongAttack` · `Buff` · `Debuff` · `AttackAndBuff` · `AttackAndDebuff` ·
`AttackAndDefend` · `DefendAndBuff` · `DefendAndDebuff` · `WeakDefend` · `ModerateDefend` ·
`StrongDefend` · `DangerousAction` · `SecretAction`.

CLAUDE.md đã chốt: *"Từ cấp 24 trở đi mỗi map phải có ≥1 bãi Pháp Sư và ≥1 Kẻ Tiếp Sức — **hai
thứ AUTO xử lý dở nhất, cũng là lý do người chơi phải tự cầm chuột**."*

Đó là một lời hứa hiện **không có mặt hình ảnh nào**. Người chơi phải tự cầm chuột vì hai vai
này nguy hiểm — nhưng không có cách nào BIẾT con nào sắp niệm chú, con nào sắp hồi máu cho bầy.
Một icon nhỏ trên đầu con quái biến "chết bất ngờ" thành "phản ứng chậm" — và đó là khác biệt
giữa một cơ chế và một cú bực mình.

Ánh xạ thẳng vào `MOB_ROLE` đã có: `phap`→`AttackRanged`, `xa`→`AttackRanged`,
`nang`→`StrongAttack`, `tiepsuc`→`DefendAndBuff`, trùm vùng lúc `bossStartTele()`→`DangerousAction`.

---

### C. Dải icon trạng thái — 131 icon, game đang có buff mà không có mặt chữ

Game có `player.chiTam`, `vhDmgT/vhEvaT/vhAspdT/vhCritT/vhLeechT/vhShield`, độc, choáng… và
**không hiện icon nào**. Kho có sẵn đúng tên: `buff_dmg_boost` `buff_shield_boost` `buff_rage`
`buff_stealth` `buff_healing_boost` `debuff_poison` `debuff_stunned` `debuff_silence`
`debuff_bleed` `debuff_weak` `debuff_vulnerable` `debuff_fragile`…

Rẻ nhất trong cả danh sách: một dải icon + một hàng dưới thanh máu.

---

### D. Lắp lại TẦNG PHÓ BẢN từ blueprint 35 node + 41 đội hình

`Catalogs/pve-chimeras.json` là một chiến dịch PvE hoàn chỉnh đã thiết kế xong:

- **`nodes` (35)** — mỗi node khai `level` · `background` · `music` · `tags` (boss). Tám node
  một chương, lặp qua các cấp.
- **`teams` (41)** — `lv_1_easy_1 → Treant_lv_1,Treant_lv_1 @ vị trí 0,2` · `lv_1_elite_1 → ba
  con @ 0,2,4` · `lv_1_boss_1 → PapaBear + MamaBear @ 0,4`. Tức **đội hình + chỗ đứng**, chia
  sẵn bốn hạng easy/medium/elite/boss.
- **`ui.chapter`** — `map_chapter_1.png` · `map_chapter_2.png` · `icon_stage_normal/elite/boss.png`.

CLAUDE.md ghi máy phó bản **giữ nguyên và chạy theo dữ liệu**: *"thêm một khoá vào `MAPS` và một
khoá cùng tên vào `window.DUNGEONS` là phòng chạy lại ngay."* Đây là bộ dữ liệu để điền vào đó,
do chính hoạ sĩ/thiết kế của bộ art viết ra — nên nền, nhạc và đội hình vốn đã hợp nhau.

⚠ **Đừng chép cả 35 node.** Chẩn đoán gốc của dự án là *nội dung được làm bằng cách nhân bản*;
35 node mà 8 nền dùng lại 4 lần là đúng cái bệnh đó. Lấy **khuôn** (node → nền + nhạc + hạng
đội hình) chứ đừng lấy số lượng.

---

### E. Vật thể cắt sẵn cho lớp `vatTo` — ĐÃ ĐO, 10/12 dùng được

CLAUDE.md nêu ~12 vật thể; đo lại bằng tỉ lệ điểm ảnh trong suốt thì **10 cái là vật cắt thật**,
**2 cái không phải**:

| Tệp | Cỡ | Trong suốt | |
|---|---|---|---|
| `5_TREE1` | 1024×436 | 51% | ✓ |
| `5_TREE2` | 1024×482 | 69% | ✓ |
| `5_TREE3` | 516×450 | 31% | ✓ |
| `10_TREE2` | 894×1024 | 55% | ✓ |
| `7_ROCK` | 1024×230 | 81% | ✓ |
| `8_ROCK` | 1024×230 | 82% | ✓ |
| `9_ROCK` | 1024×603 | 42% | ✓ |
| `10_ROCK` | 1024×441 | 79% | ✓ |
| `10_RIVER` | 1024×194 | 70% | ✓ |
| `13_STATUE` | 1024×530 | 54% | ✓ |
| `8_TEMPLE` | 1024×462 | **9%** | ✗ dải gần đặc, không phải vật thể |
| `6_WATER` | 1024×139 | **7%** | ✗ dải gần đặc |

⚠ **Chỉ dùng làm VẬT THỂ (`vatTo`), tuyệt đối không lát nền.** CLAUDE.md: *"đã thử ba lần, hỏng
cả ba"* — lớp `*_Ground.png` là mặt đất vẽ theo phối cảnh sân khấu nhìn ngang, không lát kín
được một thế giới nhìn từ trên.

**Vì sao vẫn đáng làm:** đây đúng là thứ mục "TRỤ ĐÁ ĐÃ GỠ" đang nợ — *"ĐỪNG DỰNG LẠI BẰNG CÁCH
PHÓNG TO SPRITE… phải có tranh đúng cho việc đó."* Bốn tảng `*_ROCK` cắt sẵn ở 1024px **là**
tranh đúng cho việc đó, và địa hình cỡ trận đánh (`SAN_CHE` đang hạ tạm 18→8) kéo lại được.

---

### F. Chân dung + tranh thẻ — nhiên liệu cho hệ nhiệm vụ đang phải dựng lại

43 chân dung (`PvE/Avatars`) và 166 tranh thẻ (`PvE/Cards`, đặt tên `<chimera>-<NN>-00.png`).
`QUESTS`/`SIDE_QUESTS` đang rỗng và phải thiết kế lại cùng lore — chân dung là thứ một chuỗi
nhiệm vụ cần mà game chưa có. Tranh thẻ thì hợp với **burst của Cổ Vật** (mục còn nợ ở
`docs/CO_VAT_15.md`): mỗi xác một chiêu nổ, mỗi chiêu một tấm icon.

---

## 3. Repo khác trong org — đã rà, không có gì thêm

54 repo. Trừ `axie-origins-asset-kit`, phần còn lại là **blockchain/hạ tầng** (ronin-*, bridge-*,
rns-*, w3b, steit…) hoặc **runtime/starter** không kèm art dùng được:

| Repo | Có gì | Dùng được? |
|---|---|---|
| `cc-axie-gtk2d` | rig Axie chuẩn | **đang dùng** — `NGUON_HC` của `nuong_chi.py` |
| `unity-axie-mixer3d` · `axie-starter-3d-assets` · `godot-axie-starter-3d` | Axie **3D** | không — game là 2D nướng sẵn |
| `mixer-unity` · `unity-axie-gtk2d` · `mixer-playground` | runtime lắp Axie | không — game không chạy runtime |
| `awesome-axie-gtk` | danh sách liên kết | không |
| `tma-pray-atia-example` · `cc-axie-colyseus-demo` · `game-*-test-*` | demo game | không |

⇒ **Toàn bộ art còn khai thác được nằm trong đúng một kho đã clone sẵn trên máy này.**

---

## 4. Thứ tự đề nghị

1. **A — quái có hoạt cảnh** (kèm sửa `skelbin.py`, kèm trả nợ `hit-by-normal` cho avatar)
2. **B — ý định quái** (17 icon, ánh xạ thẳng `MOB_ROLE`)
3. **E — vật thể `vatTo`** (kéo lại `SAN_CHE` 8→18)
4. **C — icon trạng thái**
5. **D — khuôn node/đội hình** khi dựng lại tầng phó bản
6. **F — chân dung + tranh thẻ** khi dựng lại nhiệm vụ và burst Cổ Vật

A và B cộng lại đổi hẳn cảm giác một trận đánh mà **không đụng một con số cân bằng nào** —
đúng kiểu thay đổi an toàn để đẩy thẳng lên `main`.
