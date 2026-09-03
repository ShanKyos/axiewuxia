# Khảo sát tiền tệ & nguyên liệu — Axie Wuxia

> **Tài liệu KHẢO SÁT. Không sửa một dòng mã nào.** Mọi con số dưới đây đếm được từ
> `public/game/game.js` trong cây làm việc, kèm lệnh để đếm lại.

---

## 0. Phạm vi, mốc đo và cách kiểm lại

| | |
|---|---|
| Tệp đo | `/home/user/axie-wuxia/public/game/game.js` |
| Ảnh chụp dùng để đếm | `md5 = 332fc623c09adae650a8fc3c29954076`, **25.099 dòng** |
| Thời điểm chụp | 2026-09-03 ~06:28 UTC |
| Nhánh | `main`, cây làm việc đang **có sửa đổi chưa commit** (`git status` → ` M public/game/game.js`) |

⚠ **Tệp đang bị sửa song song trong lúc khảo sát.** Trong 3 phút đầu phiên, `game.js` tụt từ
25.477 → 25.292 → 25.099 dòng (hệ Linh Thú biến mất giữa hai lần đọc). Mọi số dòng trong tài liệu
này là của ảnh chụp `332fc623…`; nếu đợt xoá chạy tiếp thì **số dòng sẽ trôi, nhưng tên hàm thì
không** — vì vậy mọi chỗ đều ghi kèm **tên hàm**, và mọi con số đều có lệnh đếm lại:

```bash
cd /home/user/axie-wuxia
# đếm dòng CỘNG và dòng TRỪ của một trường bất kỳ
grep -c "player\.silver *\(+=\|++\)"  public/game/game.js   # nguồn thu
grep -c "player\.silver *\(-=\|--\)"  public/game/game.js   # chỗ tiêu
grep -n  "player\.mats\.anTranAi"     public/game/game.js   # xem toàn bộ vòng đời một trường
```

**Quy ước đếm.** "Nguồn thu" / "chỗ tiêu" đếm theo **điểm ghi trong mã** (mỗi câu lệnh `+=` / `-=`
là một điểm). Với thứ đi qua một hàm trung gian (`chiVe()`, `themDatHon()`, `spendJewels()`,
`rollJewels()`) thì đếm **nơi gọi**, vì đó mới là nguồn/chỗ tiêu theo nghĩa thiết kế. Ba loại
KHÔNG tính vào cột nguồn thu vì không phải lối chơi thật, nhưng có ghi riêng khi đáng chú ý:

- **quy đổi save cũ** trong `loadGame()` (Anima, Tâm Đắc, Công Huân Lệnh, Ấn Thuần Thú);
- **`applyTestBoost()`** (chế độ `?test=1`);
- **lệnh gian lận** trong hàm `num()` (bảng console).

### Trạng thái đợt xoá sáu hệ — đọc từ mã, không suy đoán

| Hệ | Trạng thái trong ảnh chụp | Bằng chứng |
|---|---|---|
| **Thần Binh** | ✅ **đã gỡ** | `grep -c "Thần Binh"` = 2, cả 2 đều là **chú thích** trong `heroTier()` giải thích rằng bậc Thần Binh không còn được đọc nữa |
| **Tấn Phẩm** | ✅ **đã gỡ** | `grep -c "Tấn Phẩm"` = 2, cả 2 là chú thích; một trong đó ghi thẳng *"TẤN PHẨM (leo phẩm Phàm→Chí Tôn) đã GỠ"* |
| **Linh Thú** | ✅ **đã gỡ** (xong ngay trong phiên này) | `grep -c "renderPet\|petPay\|petRule"` = **0**; 11 chỗ còn chữ "Linh Thú" đều là chú thích/văn bản kể chuyện |
| **Tụ Linh Các / Gia Viên** | ✅ **đã gỡ** | `grep -c "Gia Viên"` = 0; `"Tụ Linh"` còn đúng 1 chú thích trong `updateHud()` |
| **Cổ Thần** | ❌ **CHƯA gỡ — còn chạy đầy đủ** | `ANCIENT_SETS` 25 chỗ; `doiCoThan()`; hai công thức Lò Hỗn Độn `doicothan` + `cothan`; `genAncient()` |
| **Khắc Ấn** | ⚠ **CHƯA gỡ lúc chụp — ĐÃ gỡ xong trước khi báo cáo này viết xong** (xem §0.1) | Lúc chụp: `SIGIL_DEFS` 15 chỗ, tổng 109 chỗ khớp `sigil`. Lúc viết xong: `grep -c "sigil"` = **0** |
| **Huyền Thiết** (`player.mat`) | ❌ **CHƯA gỡ — còn chạy đầy đủ** | 12 dòng cộng, 2 dòng trừ, có mặt trên HUD |

### 0.1 ĐÍNH CHÍNH GIỮA PHIÊN — Khắc Ấn đã bị gỡ xong trong lúc khảo sát

Ảnh chụp `332fc623…` (25.099 dòng) là bản dùng để đếm. Khi báo cáo viết xong, tệp thật đã là
`853a3a63…` (**24.698 dòng**) — đợt xoá đã chạy tiếp và **gỡ hết hệ Khắc Ấn**.

Tôi đã **đếm lại toàn bộ trên bản mới** để tài liệu không nói sai. Kết quả:

| | Ảnh chụp (25.099 dòng) | Bản mới (24.698 dòng) | Đổi? |
|---|---|---|---|
| `player.silver` | +34 / −30 | +34 / −30 | không |
| `player.mat` | +12 / −2 | +12 / −2 | không |
| `player.khi` | +6 / −1 | +6 / −1 | không |
| `player.tienDan` | +8 / −1 | +8 / −1 | không |
| `player.charms` | +2 / −2 | +2 / −2 | không |
| `gems.tuLa` | +4 / −3 | +4 / −3 | không |
| `gems.honNguyen` | +4 / −6 | +4 / −6 | không |
| `mats.manh` · `mats.tichMa` | +1 / −3 | +1 / −3 | không |
| `mats.manhCoThan` | +1 / −1 | +1 / −1 | không |
| `mats.datHon` | +0 / −2 | +0 / −2 | không |
| `jewels.honDon` | +1 / −1 | +1 / −1 | không |
| `anTranAi` · `maThau` · `tanthu` | 6 / 4 / 3 dòng | 6 / 4 / 3 dòng | không |
| `doKeThua` · `doDoiHe` · `useJewel` | 1 / 1 / 1 | 1 / 1 / 1 | không |
| `SIGIL_DEFS` | 15 | **0** | ✅ đã gỡ |
| `ANCIENT_SETS` (Cổ Thần) | 25 | **25** | ❌ vẫn chưa gỡ |

⇒ **Không một con số tiền tệ nào trong tài liệu này thay đổi.** Đây chính là bằng chứng thực
nghiệm cho §4.4: gỡ trọn hệ Khắc Ấn (110 chỗ nhắc tới, theo chú thích mà đợt xoá để lại) mà
**không loại tiền tệ nào bị suy chuyển một dòng**.

Ghi chú thêm: đợt xoá đã tự chọn cách quy đổi cho save cũ — chú thích còn lại tại chỗ
`ANCIENT_MIGRATE` ghi *"Món đang mang Khắc Ấn được quy ra bạc khi tải save cũ"*. Đúng khuôn
`GO_ANIMA` / `GO_CONGHUAN` / `GO_TAMDAC`, nhưng **chưa có hằng `GO_` mới nào** —
`grep -n "^const GO_"` vẫn ra đúng 4 dòng cũ.

**Cổ Thần thì chưa động tới**, nên cảnh báo ở §4.1 (Mảnh Cổ Thần sẽ thành Anima thứ hai) vẫn
đang treo nguyên.

---

## 1. Danh sách đầy đủ — **26 ô đếm**

Đếm theo "một con số trên `player` mà người chơi tích trữ rồi tiêu đi". Không tính trang bị rời,
không tính chỉ số (`str/agi/…`), không tính bộ đếm nội bộ (`pity5`, `bless`, `bossPity`,
`horseDay.n`, `chinhPhat.count`, `resetCount`, `mpts`).

| # | Tên người chơi thấy | Trường trên `player` | Nguồn thu | Chỗ tiêu | Trên HUD/túi? |
|---|---|---|---|---|---|
| 1 | **Bạc** | `silver` | **29** | **30** (1 dòng chết) | HUD + Túi·Vật Liệu |
| 2 | **Huyền Thiết** | `mat` | **11** | **2** | HUD + Túi·Vật Liệu |
| 3 | **Bản Năng** (mã gọi là *Instinct*) | `khi` | **7** | **1** | ❌ chỉ bảng Kỹ Năng |
| 4 | **Đá Thăng Cấp** | `tienDan` | **8** | **1** | Túi·Vật Liệu |
| 5 | **Tu La Tinh Thạch** | `gems.tuLa` | **4** | **3** | Túi·Vật Liệu |
| 6 | **Hỗn Nguyên Thạch** | `gems.honNguyen` | **4** | **6** | Túi·Vật Liệu |
| 7 | **Chúc Phúc Châu** | `jewels.chucPhuc` | **5** | **2** | Túi·Vật Liệu (Tứ Châu) |
| 8 | **Linh Hồn Châu** | `jewels.linhHon` | **4** | **2** | Túi·Vật Liệu (Tứ Châu) |
| 9 | **Sinh Mệnh Châu** | `jewels.sinhMenh` | **4** | **1** | Túi·Vật Liệu (Tứ Châu) |
| 10 | **Hỗn Độn Châu** | `jewels.honDon` | **6** | **5** (+1 chết) | Túi·Vật Liệu (Tứ Châu) |
| 11 | **Thiên Mệnh Phù** | `charms` | **2** | **2** | Túi·Vật Liệu + Lò |
| 12 | **Mảnh Trang Bị** | `mats.manh` | **1** | **2** (+1 chết) | Túi·Vật Liệu |
| 13 | **Tịch Ma Thạch** | `mats.tichMa` | **1** | **2** (+1 chết) | Túi·Vật Liệu |
| 14 | **Mảnh Cổ Thần** | `mats.manhCoThan` | **1** | **1** | Túi·Vật Liệu |
| 15 | 🔴 **Ấn Cổng Vực** | `mats.anTranAi` | **0** | **0** | Túi·Vật Liệu (hiện số 0 vĩnh viễn) |
| 16 | **Đất Hồn** | `mats.datHon` | **1** | **2** | ❌ chỉ bảng Chimera |
| 17 | **Lõi Nguyên Tố** | `noidan` | **1** | **1** | Túi·Box Kundun |
| 18 | **Box Kundun** (I–VII) | `baohap{tier}` | **5** | **2** | Túi·Box Kundun + tiệm |
| 19 | **Sách Kỹ Năng** | `bikipVH` | **6** | **1** | ❌ chỉ bảng Kỹ Năng |
| 20 | **Mảnh Cổ Thư** (3 ô) | `bikip.pieces[0..2]` | **3** | **1** (một lần duy nhất) | Túi·Vật Liệu |
| 21 | **Ấn Giao Kết** (vé quay) | `chimera.ve.gk` | **3** | **1** | ❌ chỉ bảng Khế Ước |
| 22 | **Ấn Cổ Xưa** (vé quay) | `chimera.ve.cx` | **1** | **1** | ❌ chỉ bảng Khế Ước |
| 23 | 🔴 **Nguyệt Trần** | `chimera.nguyet` | **1** | **0** | ❌ chỉ bảng Khế Ước |
| 24 | 🔴 **Tinh Trần** | `chimera.tinh` | **1** | **0** | ❌ chỉ bảng Khế Ước |
| 25 | 🔴 **Mã Thầu** | `maThau` | **2** | **0** | ❌ chỉ bảng Trại Ngựa |
| 26 | 🔴 **(không có tên)** vé tân thủ | `chimera.tanthu` | **0** | **0** | ❌ không hiện ở đâu |

**Không có tiền tệ nạp tiền nào trong mã.** Kiểm:
`grep -in "nạp tiền\|wcoin\|kim cương\|premium\|topup\|cash shop" public/game/game.js` → **0 kết quả.**
Loại thứ ba mà chủ dự án đã chốt (cao cấp, nạp tiền) đúng là **chưa tồn tại**, phải làm mới.

---

## 2. Bảng chi tiết từng loại

### 1. Bạc — `player.silver`  ·  29 thu / 30 tiêu

Lệnh đếm: `grep -c "player\.silver *\(+=\|++\)"` → **34** ·
`grep -c "player\.silver *\(-=\|--\)"` → **30**
(34 = 29 lối chơi + 4 dòng quy đổi save cũ trong `loadGame()` + 1 dòng `applyTestBoost()`.)

**Nguồn thu (29):**

| Hệ | Hàm | Số dòng |
|---|---|---|
| Bán đồ ở tiệm | `sellItem()` | 1 |
| Dọn Rác (bán hàng loạt) | `donRac()` | 1 |
| Bán rác một chạm | `sellJunk()` | 1 |
| Bạc rơi từ quái | `applyRewards()` ← `rw.silver` | 1 |
| Tự bán đồ Phàm khi bật AUTO | `applyRewards()` ← `rw.autoSold` | 1 |
| Thưởng Túc Thù (hạ Du Hiệp truy thù) | `killMob()` | 1 |
| Suối Ký Ức — **+12/giây thụ động** | `update()` | 1 |
| Nhiệm vụ chính tuyến | `turnInQuest()` | 1 |
| Nhiệm vụ phụ tuyến | `turnInSide()` | 1 |
| Kỳ Ngộ (khám phá ngẫu nhiên) | `rollKyngo()` | 4 |
| Tầng Sâu — rút lui | `deepLeave()` | 1 |
| Phó bản — thông quan | `updateDungeon()` | 1 |
| Rương Boss Săn | `grantHuntBox()` | 2 |
| Nghỉ ngoại tuyến | `grantOfflineGains()` | 1 |
| Điểm danh / Mục Tiêu Hôm Nay | `dailyCheckReward()` | 1 |
| Quà nhập môn phái | `chooseSect()` | 2 |
| Mở Box Kundun | `burstBaoHap()` | 2 |
| Truy Nã Lệnh | `truynaClaim()` | 3 |
| Sảnh Cầu May (hoàn khi túi đầy / trúng bạc) | `rollVanDuyen()` | 2 |
| Luyện Linh Dực — hoàn khi túi đầy | `CHAOS_RECIPES` `wing1` | 1 |

**Chỗ tiêu (30 dòng, 10 hệ):**

| Hệ | Hàm / công thức | Số dòng |
|---|---|---|
| Nâng cấp kỹ năng | `upgradeSkillUI()` | 1 |
| Chimera — Hoá lên trần cấp | `chiHoa()` | 1 |
| Chimera — nâng mảnh Cốt | `cotNang()` | 1 |
| Lò Hỗn Độn — `ren`, `phathien`, `kethua`, `wing1`, `wing2`, `hopnhat` | `CHAOS_RECIPES` | 6 |
| Lò Hỗn Độn — `cloak` (Luyện Áo Choàng) | `craftCloak()` | 1 |
| Mua Thiên Mệnh Phù | `buyCharm()` | 1 |
| Tẩy điểm Đại Thành | `masteryRespec()` | 1 |
| Thuần Thục (Ám Khí / Cung / Cương Khí) | `upgradeTH()` | 1 |
| Tiệm — mua Box Kundun · mua trang bị bày · 13 mặt hàng tiêu hao | `buyBaoHap()` · `buyStockItem()` · `buyFromShop()` | 15 |
| Sảnh Cầu May — phí một lượt (`GO_CONGHUAN` = 2.000◈) | `rollVanDuyen()` | 1 |
| ~~Kế Thừa (lối vào cũ)~~ | `doKeThua()` | 1 — **mã chết** |

⚠ `window.doKeThua` **không có nơi gọi nào** (`grep -c doKeThua` = 1, chính là dòng định nghĩa).
Chức năng đã chuyển hẳn sang công thức `kethua` của Lò Hỗn Độn.

**Hiển thị:** `#hud-silver` (index.html:34, ghi bởi `updateHud()`) · Túi Đồ → Vật Liệu (ô cuối
`bagSecMat()`) · mọi bảng tiệm/Lò/Thuần Thục.

---

### 2. Huyền Thiết — `player.mat`  ·  11 thu / 2 tiêu

**Nguồn thu (11):** `applyRewards()` (30% mỗi con quái rơi 1) · `killMob()` (Túc Thù +2) ·
`salvage()` (phân giải trang bị, ×2 nếu đồ khác lớp) · `buyFromShop()` mặt hàng `r_mat5` ·
`turnInQuest()` · `turnInSide()` · `rollKyngo()` (Khoáng Mạch) · `deepLeave()` · `updateDungeon()` ·
`doTeNui()` (Vực Thẳm) · `rollVanDuyen()`.
(+1 dòng nữa trong `loadGame()`: ô Ám Khí cũ → 3 Huyền Thiết.)

**Chỗ tiêu (2), cả hai ở cùng một chỗ:** công thức `ren` và `phathien` của Lò Hỗn Độn —
tức là **nhiên liệu rèn +1…+11**, lượng lấy từ `forgeRule(target).mat`.

**Hiển thị:** `#hud-mat` (index.html:35) · Túi Đồ → Vật Liệu (dòng đầu `MAT_ROWS`).

> Lệch 11:2 là lệch lớn nhất trong nhóm "còn sống". Huyền Thiết chảy vào từ mọi hướng nhưng chỉ
> có đúng một cái vòi ra.

---

### 3. Bản Năng — `player.khi`  ·  7 thu / 1 tiêu

Chú ý tên: **chữ người chơi thấy là "Bản Năng"** (bảng Kỹ Năng), còn chú thích trong mã gọi nó là
*Instinct*. Hai tên cho một thứ.

**Nguồn thu (7):** `applyRewards()` ← `rw.khi` (200 boss thế giới / 120 boss / 35 tinh anh / 10 quái
thường) · `update()` **+3/giây thụ động, luôn bật** · `update()` **+6/giây nữa khi đứng trong Suối
Ký Ức** · `rollKyngo()` +20 · `updateDungeon()` · `grantOfflineGains()` · `dailyCheckReward()` +100.

**Chỗ tiêu (1):** `upgradeSkillUI()` — nâng cấp một chiêu, phí `skUpKhi(id)`.
Chú thích ngay trên hàm `skUpKhi` tự ghi: *"nơi tiêu DUY NHẤT của chỉ số này"*.

**Hiển thị:** ❌ không lên HUD, không có trong `MAT_ROWS`. Chỉ hiện ở một dòng phụ trong
`renderSkillPanel()`. CSS còn luật `#hud-khi` (`style.css:547`) nhưng **không có phần tử
`#hud-khi` nào tồn tại** — `grep -rn "hud-khi" public/game/` chỉ khớp đúng dòng CSS đó.

---

### 4. Đá Thăng Cấp — `player.tienDan`  ·  8 thu / 1 tiêu

**Nguồn thu (8):** `applyRewards()` (quái cấp ≥5: 22% ra 1; cộng thêm 8 cho boss Cổng Vực, 3 cho
Vệ Binh Trụ, 5 cho boss, 1 cho tinh anh) · `buyFromShop()` mục `tiendan` (+3) và `r_tiendan5` (+5) ·
`deepLeave()` · `updateDungeon()` · `grantHuntBox()` · `doTeNui()` · `rollVanDuyen()`.

**Chỗ tiêu (1):** `upgradeTH()` — nâng tầng Thuần Thục, bảng giá `TH_COST` (2/4/7/10/14/18/24 viên
cho 7 tầng, ×3 hệ Ám Khí · Cung Tiễn · Cương Khí).

**Hiển thị:** Túi Đồ → Vật Liệu · bảng Thuần Thục (`renderTuyetHoc()`).

---

### 5–6. Tu La Tinh Thạch / Hỗn Nguyên Thạch — `gems.tuLa` · `gems.honNguyen`

| | Tu La | Hỗn Nguyên |
|---|---|---|
| Thu | **4** | **4** |
| Tiêu | **3** | **6** |

**Nguồn thu (giống nhau, 4 mỗi loại):** `applyRewards()` (Tu La 15% từ quái cấp ≥3 · Hỗn Nguyên 35%
từ tinh anh) · `buyFromShop()` (`r_tula` / `r_hon`) · `updateDungeon()` · `rollVanDuyen()`.

**Chỗ tiêu Tu La (3):** `ren` · `phathien` (`forgeRule` lấy 1 viên cho +7…+9, 3 cho +10, 5 cho +11) ·
`craftCloak()`.
**Chỗ tiêu Hỗn Nguyên (6):** `ren` · `phathien` (1 viên cho +10, 2 cho +11) · `wing1` (10 viên) ·
`wing2` (20 viên) · `hopnhat` (`CHAOS_HON_COST` = 2/4/7/12) · `craftCloak()`.

**Hiển thị:** Túi Đồ → Vật Liệu (`MAT_ROWS` dòng 2–3) · bảng Lò.

---

### 7–10. Tứ Châu — `jewels.{chucPhuc, linhHon, sinhMenh, honDon}`

Mọi viên rơi ra đều **nằm dưới đất** rồi mới vào túi qua `takeLoot()`. Nguồn dưới đây đếm theo
**điểm quay số**, không theo dòng ghi.

| Loại | Nguồn thu | Chỗ tiêu |
|---|---|---|
| **Chúc Phúc Châu** ◎ | 5: `rollJewels()` (bảng `JEWEL_DROP` × 4 dải nguồn: quái thường 0,9% → boss Cổng Vực 100%) · `killMob()` boss 20% · `killMob()` tinh anh 3% · `burstBaoHap()` · `rollVanDuyen()` | 2: công thức `bless` (+1 an toàn tới +5) · công thức `phathien` (n viên) |
| **Linh Hồn Châu** ◉ | 4: `rollJewels()` · `killMob()` boss 12% · `burstBaoHap()` · `rollVanDuyen()` | 2: công thức `soul` (50% +1 / 50% −1) · `phathien` |
| **Sinh Mệnh Châu** ❤ | 4: `rollJewels()` · `killMob()` boss 6% · `burstBaoHap()` · `rollVanDuyen()` | **1**: công thức `life` (dòng Sinh Lực trên giáp) |
| **Hỗn Độn Châu** ● | 6: `rollJewels()` · `killMob()` boss 3% · `burstBaoHap()` · `rollVanDuyen()` ×2 nhánh · `riftKilled()` **+2 chắc chắn** | 5: `phathien` · `element` (Đổi Hệ) · `wing1` · `wing2` · **`doicothan`** |

**Trừ ngọc đi qua đúng một hàm:** `spendJewels()` — nó rút viên khỏi **khay Lò** và khỏi
`player.jewels` cùng lúc. 8 nơi gọi.

⚠ `window.useJewel` (bảng khảm ngọc cũ, khảm thẳng 3 loại châu) và `window.doDoiHe` (Đổi Hệ cũ)
**đều không còn nơi gọi** — `grep -c useJewel` = 1, `grep -c doDoiHe` = 1. Mã chết.

**Hiển thị:** Túi Đồ → Vật Liệu, mục "TỨ CHÂU" (`bagSecMat()`) · bảng Lò.

---

### 11. Thiên Mệnh Phù — `player.charms`  ·  2 thu / 2 tiêu

**Nguồn thu (2):** `buyCharm()` (500◈, nút ngay trong bảng Lò) · `buyFromShop()` mục `phu`.
**Chỗ tiêu (2):** `chaosResolveEnhance()` — giữ nguyên +N khi rèn hỏng · công thức `hopnhat` —
ép 100% tỉ lệ Lò Hỗn Loạn.
**Hiển thị:** Túi Đồ → Vật Liệu · bảng Lò (kèm nút mua).

Đây là ô đếm **cân bằng nhất trong game**: mua bằng bạc, tiêu ngay tại chỗ mua.

---

### 12–13. Mảnh Trang Bị / Tịch Ma Thạch — `mats.manh` · `mats.tichMa`

| | Mảnh Trang Bị ❖ | Tịch Ma Thạch ◆ |
|---|---|---|
| Thu | **1**: `applyRewards()` — tinh anh 100%, quái thường 8% | **1**: `applyRewards()` — chỉ Vệ Binh Trụ, 1–2 viên |
| Tiêu | **2**: công thức `kethua` (40 mảnh) · `upgradeTH()` tầng 4–7 (12/24/40/60) | **2**: `kethua` (4 viên) · `upgradeTH()` tầng 6–7 (2/4) |
| Chết | +1 dòng trong `doKeThua()` — **không có nơi gọi** | +1 dòng trong `doKeThua()` — **không có nơi gọi** |

Chú thích ngay trên `findItemByUid()` đã ghi rõ ý định:
*"Mảnh Trang Bị và Tịch Ma Thạch KHÔNG chết theo — Kế Thừa vẫn ăn đúng hai thứ đó."*

**Hiển thị:** Túi Đồ → Vật Liệu.

---

### 14. Mảnh Cổ Thần — `mats.manhCoThan`  ·  1 thu / 1 tiêu

**Nguồn thu (1):** `applyRewards()` — **chỉ** boss Cổng Vực (`bossKind === 'tranai'`), 2 mảnh/con.
**Chỗ tiêu (1):** `doiCoThan()` — 60 mảnh đổi 1 món Cổ Thần chọn bộ; gọi từ công thức `cothan`.
**Hiển thị:** Túi Đồ → Vật Liệu.

🔻 **Cả nguồn lẫn chỗ tiêu đều nằm trong hệ Cổ Thần** → xem §4.

---

### 15. 🔴 Ấn Cổng Vực — `mats.anTranAi`  ·  **0 thu / 0 tiêu**

`grep -n "anTranAi" public/game/game.js` trả về **6 dòng, không dòng nào là `+=` hay `-=`**:

| Dòng | Việc |
|---|---|
| `newPlayer()` | khai báo `anTranAi:0` |
| `loadGame()` | backfill `anTranAi:0` |
| `computeKillRewards()` | khai báo `rw.mats.anTranAi = 0` — **và không bao giờ gán lại** |
| `applyTestBoost()` | đặt = 20 (chế độ thử) |
| `num()` | lệnh gian lận `an` |
| `MAT_ROWS` | **dòng hiển thị trong Túi Đồ → Vật Liệu** |

Nguồn cũ (Chinh Phạt Cổng Vực) vẫn còn nhưng nay **chỉ đếm số lần**: `applyRewards()` đặt
`player.chinhPhat.count++` và bắn một dòng chữ, **không cộng một Ấn nào**. Chỗ tiêu cũ (Tấn Phẩm
lên Chí Tôn) đã bị gỡ cùng hệ Tấn Phẩm.

⇒ Người chơi đang nhìn một ô đếm **vĩnh viễn bằng 0** trong túi, có tên, có mô tả
*"vé lên Chí Tôn — Chinh Phạt Cổng Vực 1 lần/ngày"*, mà cả hai vế của câu mô tả đó đều không còn.

---

### 16. Đất Hồn — `mats.datHon`  ·  1 thu / 2 tiêu

**Nguồn thu (1):** `cotRoi()` — và `cotRoi()` chỉ được gọi từ **một chỗ**: `updateDungeon()` khi
thông quan phó bản. 4–6 Đất Hồn cho 3 lượt đầu trong ngày, 1 cho các lượt sau.
**Chỗ tiêu (2):** `chiAnDat()` (cho Chimera ăn, 1 Đất Hồn = 200 XP) · `chiHoa()` (Hoá lên trần cấp,
kèm bạc).
**Hiển thị:** ❌ chỉ trong bảng nuôi Chimera (`chiBangNuoi()`); **không có trong `MAT_ROWS`**.

---

### 17. Lõi Nguyên Tố — `player.noidan`  ·  1 thu / 1 tiêu

**Nguồn thu (1):** `applyRewards()` — boss 100%, tinh anh 30%.
**Chỗ tiêu (1):** `swallowNoidan()` — hấp thụ lấy chỉ số vĩnh viễn, **trần 3 lõi/ngày**.
**Hiển thị:** Túi Đồ → **Box Kundun** (không nằm ở tab Vật Liệu).

Trần 3/ngày cộng với "boss 100% rơi" nghĩa là ô này **luôn ở trạng thái ứ**: nguồn không có trần,
chỗ tiêu thì có.

---

### 18. Box Kundun — `player.baohap{tier}`  ·  5 thu / 2 tiêu

**Nguồn thu (5):** `buyBaoHap()` (mua bằng bạc ở tiệm) · `deepLeave()` (Tầng Sâu) ·
`matonKilled()` (Hung Thần Giáng Thế) · `goldenKilled()` (Xâm Lăng Vàng — mỗi con) ·
`riftKilled()` (Chúa Tể Vực Nứt).
**Chỗ tiêu (2):** `throwBaoHap()` → `burstBaoHap()` (ném xuống đất và mở) · `ghepHap()` (3 hạp
bậc n → 1 hạp bậc n+1).
**Hiển thị:** Túi Đồ → Box Kundun · tiệm.

---

### 19. Sách Kỹ Năng — `player.bikipVH`  ·  6 thu / 1 tiêu

**Nguồn thu (6 dòng, 2 hệ):** `applyRewards()` (boss Cổng Vực 35% · Vệ Binh Trụ và boss 12% ·
tinh anh 3%) · `doTeNui()` — **5 dòng riêng** trong hệ Vực Thẳm, có nhánh cho +10 và +15 quyển
một lượt.
**Chỗ tiêu (1):** `useSkillBookUI()` — 1 quyển nâng thẳng một chiêu lên cấp nhân vật.
**Hiển thị:** ❌ chỉ bảng Kỹ Năng + tooltip `CONSUM_DB`.

---

### 20. Mảnh Cổ Thư — `player.bikip.pieces[0..2]`  ·  3 thu / 1 tiêu (một lần trong đời)

**Nguồn thu (3):** `killMob()` boss (gác `!player.bikip.hmtp`) · `rollKyngo()` Học Giả Lang Thang
20% (**KHÔNG gác `hmtp`**) · `rollVanDuyen()` (có gác `hmtp`, đã dung hợp rồi thì đổi thành
Hỗn Độn Châu).
**Chỗ tiêu (1):** `fuseBikip()` — cần đủ cả ba mảnh, **30% thành công**, và **chỉ trừ khi thành
công**. Thành công một lần là `hmtp = true` vĩnh viễn.

🔴 **Rò rỉ có điều kiện:** sau khi dung hợp xong, `rollKyngo()` vẫn tiếp tục cộng Mảnh Cổ Thư trong
khi không còn chỗ tiêu nào. Hai nguồn kia đã tự chặn, nguồn này thì không.

**Hiển thị:** Túi Đồ → Vật Liệu (in dạng `Thượng/Trung/Hạ`).

---

### 21–22. Vé quay Chimera — `chimera.ve.gk` (Ấn Giao Kết) · `chimera.ve.cx` (Ấn Cổ Xưa)

Mọi nguồn đều đi qua đúng một hàm — `chiVe(n, lý_do, banner)` — cố ý để chỉ có một chỗ đổi nhịp
phát vé.

| | Ấn Giao Kết | Ấn Cổ Xưa |
|---|---|---|
| Nguồn thu | **3**: `killMob()` hạ boss vùng lần đầu (2 Ấn với boss Cổng Vực, 1 với boss khác) · `unlockNotices()` mỗi mốc 10 cấp (+2) · `dailyCheckReward()` (+1/ngày) | **1**: `updateDungeon()` — thông quan phó bản |
| Chỗ tiêu | **1**: `gachaQuay('gk', n)` | **1**: `gachaQuay('cx', n)` |
| Hiển thị | bảng Khế Ước · nút trong tab Chimera · nhắc việc khi ≥10 (`hintCandidates`) | **chỉ** bảng Khế Ước |

Cân bằng, đúng vòng đời một loại tiền tệ.

---

### 23–24. 🔴 Nguyệt Trần / Tinh Trần — `chimera.nguyet` · `chimera.tinh`

| | Nguyệt Trần | Tinh Trần |
|---|---|---|
| Nguồn thu | **1**: `chiNhan()` — quay trúng con **đã đủ C6**, +25 (5★) hoặc +5 (4★) | **1**: `gachaMotLuot()` — **mỗi lượt ra 3★**, +15. Vì 5★ chỉ 0,6% và 4★ 5,1% nên đây là **đa số lượt quay** |
| Chỗ tiêu | **0** | **0** |
| Hiển thị | bảng Khế Ước (`renderKheUoc()`), một dòng chữ | như trên |

**Đã có chú thích trong mã** (ngay trên khối "Định Hình Chimera"):

> *"Tinh Trần và Nguyệt Trần KHÔNG dùng ở đây — chủ dự án giữ hai loại đó cho cửa hàng đổi vật
> phẩm. Nhiên liệu của hệ này là Đất Hồn (rơi trong màn) và chính những mảnh Cốt thừa."*

⇒ Theo yêu cầu, **báo cáo hiện trạng, không đề xuất xoá.** Xem §6.

---

### 25. 🔴 Mã Thầu — `player.maThau`  ·  2 thu / 0 tiêu

**Nguồn thu (2):** `tryCatchHorse()` (bắt Tuấn Mã hoang, trần 5 con/ngày) ·
`turnInSide()` (`q.rew.thau` — thưởng phụ tuyến).
**Chỗ tiêu:** **không có.** `grep -n "maThau" public/game/game.js` trả về 4 dòng: 1 backfill,
2 cộng, 1 hiển thị. Không có dòng `-=` nào.

**Nặng hơn: văn bản đang nói dối người chơi.** Hai chỗ hứa một cơ chế đã bị gỡ:

- `tryCatchHorse()`: *"Mã Thầu: +7% tỉ lệ hoặc −4✦ khi thăng giai thú"*
- `renderStable()`: *"khi thăng giai thú cưỡi, dùng **+7% tỉ lệ** hoặc **−4✦ phí** mỗi cuộn
  (tối đa 3 cuộn/lần)"*

Hệ thú cưỡi (`player.mount`) đã bị gỡ và thay bằng Chimera. Lời hứa còn nguyên, chỗ tiêu thì mất.

---

### 26. 🔴 `chimera.tanthu`  ·  **0 thu / 0 tiêu, và không ai ĐỌC nó**

`grep -n "tanthu" public/game/game.js` → **3 dòng, cả 3 đều là khởi tạo** (`newPlayer()`,
`chiState()`, backfill trong `loadGame()`), giá trị `20`. Không có chỗ nào đọc, không có chỗ nào
hiển thị, không có chỗ nào trừ. Nhiều khả năng là "20 lượt quay tân thủ" định làm rồi bỏ dở.

---

## 3. 🔴 ĐÁNH DẤU ĐỎ — nguồn thu không có chỗ tiêu (và ngược lại)

Đây là mục quan trọng nhất. Tiền lệ đã có: **Anima** từng được cộng ở mười ba chỗ và trừ ở
không chỗ nào; đã quy 1 Anima = 2 bạc (`GO_ANIMA`) rồi xoá hẳn. Sau Anima, dự án đã làm đúng
việc đó thêm hai lần nữa: **Công Huân Lệnh** (`GO_CONGHUAN` = 2.000 bạc) và **Tâm Đắc**
(`GO_TAMDAC` = 4.000 Bản Năng). Danh sách dưới đây là những ca còn lại.

### 3.1 Chết hoàn toàn — 0 thu / 0 tiêu

| Loại | Trường | Ghi chú |
|---|---|---|
| **Ấn Cổng Vực** | `mats.anTranAi` | **Vẫn hiện một ô trong Túi Đồ → Vật Liệu**, vĩnh viễn 0, với mô tả nói về hai hệ đã gỡ. Đây là ca tệ nhất trong báo cáo: nó không chỉ chết, nó còn **chiếm chỗ trên màn hình**. |
| **vé tân thủ** | `chimera.tanthu` | Không ai đọc. Chỉ phình save. |

### 3.2 Có thu, không có tiêu

| Loại | Trường | Thu | Tiêu | Mức độ |
|---|---|---|---|---|
| **Mã Thầu** | `maThau` | 2 | **0** | Nặng — kèm 2 câu văn bản hứa một cơ chế đã bị gỡ |
| **Tinh Trần** | `chimera.tinh` | 1 (nhưng nổ **mỗi lượt quay ra 3★**, tức đa số lượt) | **0** | Đã có quyết định của chủ dự án — giữ chờ cửa hàng |
| **Nguyệt Trần** | `chimera.nguyet` | 1 | **0** | như trên |
| **Mảnh Cổ Thư** | `bikip.pieces` | 3 | 1, **nhưng chỉ dùng được đúng một lần trong đời nhân vật** | Trung bình — `rollKyngo()` quên gác `hmtp`, tiếp tục cộng sau khi hết chỗ tiêu |

### 3.3 Lệch nặng nhưng chưa chết — đáng theo dõi

| Loại | Thu | Tiêu | Vấn đề |
|---|---|---|---|
| **Huyền Thiết** | 11 | **2** | Cả 2 chỗ tiêu là cùng một việc (rèn +N). Tỉ lệ 5,5 : 1. |
| **Bản Năng** | 7 | **1** | Trong đó **hai nguồn chảy liên tục theo thời gian** (+3/giây thụ động, +6/giây nữa ở Suối Ký Ức). Treo máy 1 giờ = +10.800 Bản Năng mà không đánh một con quái nào. |
| **Đá Thăng Cấp** | 8 | **1** | Chỗ tiêu duy nhất (Thuần Thục) có **trần cứng 7 tầng × 3 hệ**; hết trần là ô này chết hẳn. |
| **Sách Kỹ Năng** | 6 | 1 | Chỗ tiêu có trần theo cấp nhân vật. |
| **Lõi Nguyên Tố** | 1 | 1 | Chỗ tiêu **trần 3/ngày**, nguồn không trần. |
| **Sinh Mệnh Châu** | 4 | **1** | Chỉ khảm được lên giáp, trần 7 bậc. |

### 3.4 Mã chết đi kèm (không phải tiền tệ, nhưng cùng khu vực)

| Thứ | Bằng chứng |
|---|---|
| `window.doKeThua` | `grep -c doKeThua` = 1 → chỉ có dòng định nghĩa, không nơi gọi |
| `window.doDoiHe` | `grep -c doDoiHe` = 1 → như trên |
| `window.useJewel` | `grep -c useJewel` = 1 → như trên |
| Luật CSS `#hud-khi` | `style.css:547`; không có phần tử `#hud-khi` trong `index.html` cũng như trong `game.js` |

---

## 4. Loại nào SẼ CHẾT theo đợt xoá sáu hệ đang chạy

Xét theo tiêu chí đề bài: **mọi chỗ tiêu của nó nằm trong sáu hệ đang bị gỡ.**

### 4.1 Chết chắc — Mảnh Cổ Thần (`mats.manhCoThan`)

| | |
|---|---|
| Nguồn thu duy nhất | `applyRewards()`, boss Cổng Vực, 2 mảnh/con |
| Chỗ tiêu duy nhất | `doiCoThan()` — 60 mảnh → 1 món Cổ Thần, gọi từ công thức `cothan` |
| Sau khi gỡ Cổ Thần | **0 chỗ tiêu.** Nguồn vẫn chảy (boss Cổng Vực vẫn còn), ô đếm vẫn hiện trong `MAT_ROWS` |

⇒ Nếu gỡ Cổ Thần mà không đụng gì khác, **Mảnh Cổ Thần trở thành Anima thứ hai** ngay trong cùng
một lần commit.

### 4.2 Bị cắt bớt nhưng vẫn sống

| Loại | Chỗ tiêu mất | Còn lại sau khi gỡ Cổ Thần |
|---|---|---|
| **Hỗn Độn Châu** | công thức `doicothan` (1 viên) | vẫn còn **4**: `phathien`, `element`, `wing1`, `wing2` |

### 4.3 Không chết theo — nói rõ để khỏi gỡ nhầm

| Loại | Vì sao an toàn |
|---|---|
| **Mảnh Trang Bị**, **Tịch Ma Thạch** | Chỗ tiêu là `kethua` + `upgradeTH()`, **không** thuộc sáu hệ. Chú thích trong mã đã khẳng định điều này. |
| **Huyền Thiết**, **Tu La**, **Hỗn Nguyên**, **Thiên Mệnh Phù** | Chỗ tiêu nằm trong Lò Hỗn Độn (rèn +N), không thuộc sáu hệ. Huyền Thiết chết là do **quyết định riêng**, không phải hệ quả của đợt xoá này. |
| **Đất Hồn**, vé Chimera, **Nguyệt/Tinh Trần** | Thuộc hệ Chimera — hệ này **không** nằm trong danh sách sáu hệ bị gỡ. |
| **Box Kundun**, **Lõi Nguyên Tố**, **Bản Năng**, **Đá Thăng Cấp**, **Tứ Châu** | Không có nhánh nào chạm sáu hệ. |

### 4.4 Khắc Ấn — gỡ đi thì tiền tệ nào bị ảnh hưởng? **Không loại nào.**

Kiểm: `grep -n "sigil" public/game/game.js | grep -i "silver\|player.mat\|charms\|jewel\|gems\|tienDan\|khi"` → **0 kết quả.**
Khắc Ấn **không tiêu một loại tiền tệ nào**; nó chỉ gắn lên món đồ khi rơi. Gỡ Khắc Ấn làm
Box Kundun, Hung Thần và Xâm Lăng Vàng **kém hấp dẫn hơn**, nhưng không làm chết ô đếm nào.

---

## 5. Đối chiếu MU Online

MU (bản kinh điển) chỉ có ba nhóm: **Zen** (tiền), **các loại Ngọc** (Bless · Soul · Life ·
Chaos · Creation…), và **WCoin** (nạp).

### 5.1 Ứng đúng vai — giữ nguyên tinh thần MU

| Trong game | Vai MU | Khớp đến đâu |
|---|---|---|
| **Bạc** | **Zen** | Khớp hoàn toàn: rơi từ quái, bán đồ, trả phí rèn, mua tiêu hao |
| **Chúc Phúc Châu** | **Jewel of Bless** | Khớp hoàn toàn: +1 an toàn tới +5 |
| **Linh Hồn Châu** | **Jewel of Soul** | Khớp hoàn toàn: 50% +1 / 50% −1 |
| **Sinh Mệnh Châu** | **Jewel of Life** | Khớp hoàn toàn: dòng Sinh Lực trên giáp, hỏng thì về 0 |
| **Hỗn Độn Châu** | **Jewel of Chaos** | Khớp: nhiên liệu của Lò Hỗn Loạn / Chaos Machine |
| **Box Kundun I–VII** | **Box of Kundun** | Khớp (đây là ngoại lệ tên riêng đã được duyệt) |
| **Thiên Mệnh Phù** | **Jewel of Guardian / Bùa bảo vệ** (MU bản sau) | Khớp về vai: bảo hiểm khi rèn hỏng |

### 5.2 Mượn vai của Ngọc nhưng đẻ thêm một tầng

| Trong game | Vai MU gần nhất | Vấn đề |
|---|---|---|
| **Tu La Tinh Thạch** | Jewel of Creation | MU rèn +10…+13 bằng **chính Bless + Soul + Chaos**. Game này thêm hẳn hai loại đá riêng cho khoảng +7…+11. |
| **Hỗn Nguyên Thạch** | Jewel of Creation / Harmony | như trên, cộng thêm vai nhiên liệu cánh |
| **Mảnh Trang Bị · Tịch Ma Thạch** | *không có* | MU không có "nguyên liệu chế tạo". Nâng giai đồ trong MU đi qua Chaos Machine bằng Ngọc + Zen. |

### 5.3 Không ứng vai nào của MU

| Trong game | Ghi chú |
|---|---|
| **Huyền Thiết** | MU **không có kim loại rèn**. Rèn trong MU đốt Ngọc, không đốt kim loại. Đây thuần là di sản kiếm hiệp. |
| **Bản Năng** | Gần "Master Level point" hơn là tiền tệ — nhưng MU cho điểm đó theo cấp, không cho tích trữ tự do. |
| **Đá Thăng Cấp** | Nhiên liệu của một hệ riêng (Thuần Thục), MU không có tương đương. |
| **Lõi Nguyên Tố** | Chỉ số vĩnh viễn có trần theo ngày — gần "Ruud/Elixir" của MU đời sau, không có trong MU kinh điển. |
| **Sách Kỹ Năng** | MU học chiêu bằng sách rơi, nhưng là **vật phẩm**, không phải ô đếm. |
| **Mảnh Cổ Thư** | Vật phẩm nhiệm vụ, không phải tiền tệ. |
| **Mảnh Cổ Thần** | MU không có "shard đổi đồ Ancient" — đồ Ancient trong MU chỉ rơi. |
| **Ấn Giao Kết · Ấn Cổ Xưa** | Vé gacha kiểu Genshin. MU **không có gacha**; chỗ gần nhất là shop WCoin. |
| **Nguyệt Trần · Tinh Trần** | "Bụi" gacha (Genshin: Tinh Huy/Tinh Trần). Hoàn toàn ngoài từ vựng MU. |
| **Đất Hồn** | Thức ăn nuôi đồng hành. MU không có. |
| **Ấn Cổng Vực** | Không ứng vai nào của MU **và cũng không ứng vai nào trong chính game này**. |
| **Mã Thầu** | Như trên. |
| **WCoin (tiền nạp)** | **CHƯA TỒN TẠI.** Không có trường nào trên `player`, không có một chuỗi nào trong `game.js`. |

### 5.4 Tổng kết đối chiếu

MU sống bằng **1 + 5 + 1 = 7 ô đếm**. Game này có **26**, trong đó **5 ô hoàn toàn hoặc gần như
chết**. Bảy loại khớp đúng vai MU (§5.1) đã đủ để chạy toàn bộ vòng kinh tế của MU Season 1.

---

## 6. Đề xuất — giữ / gộp / xoá

Ba loại chính đã chốt: **Bạc** (sắp đổi tên) · **Vé quay Chimera** · **tiền nạp cao cấp mới**.
Dưới đây là kiến nghị cho phần còn lại. Tỉ giá đề xuất đều **suy ra từ chính chỗ tiêu trong mã**,
đúng cách đã làm với `GO_ANIMA` / `GO_CONGHUAN` / `GO_TAMDAC`.

### 6.1 ❌ XOÁ NGAY — không mất một cơ chế nào

| Loại | Cách xử lý | Tỉ giá đề xuất & căn cứ |
|---|---|---|
| **Ấn Cổng Vực** (`mats.anTranAi`) | Xoá trường + xoá dòng khỏi `MAT_ROWS` + xoá lệnh gian lận `an` | **Không cần tỉ giá** — không ai từng có một Ấn nào (0 nguồn thu). Save cũ có thể còn tồn dư từ thời Tấn Phẩm: quy **1 Ấn = 5.000 bạc** (giá `kethua` một giai) là hào phóng và an toàn. |
| **`chimera.tanthu`** | Xoá khỏi 3 chỗ khởi tạo | Không ai đọc → không cần quy đổi. |
| **Mã Thầu** (`maThau`) | Xoá trường + xoá `renderStable()` khỏi khối Mã Thầu + **sửa hai câu văn bản đang hứa một cơ chế đã gỡ** | Nguồn là "bắt 5 con ngựa/ngày". Quy **1 Mã Thầu = 400 bạc** (bằng phí `cotNang` một mảnh mồi) hoặc — hợp lý hơn — **1 Mã Thầu = 1 Đất Hồn**, vì bắt ngựa và nuôi Chimera cùng là hoạt động ngoài màn. |

> ⚠ Dù chọn đường nào, **hai câu văn bản của Trại Ngựa phải sửa trước khi ship**. Đó là lỗi
> nghiêm trọng nhất trong nhóm này: nó không im lặng, nó nói sai.

### 6.2 ❌ XOÁ THEO ĐỢT SÁU HỆ — bắt buộc làm trong cùng commit

| Loại | Cách xử lý | Tỉ giá đề xuất & căn cứ |
|---|---|---|
| **Mảnh Cổ Thần** (`mats.manhCoThan`) | Xoá cùng lúc với hệ Cổ Thần. Nếu để lại, nó thành Anima thứ hai ngay lập tức. | 60 mảnh = 1 món Cổ Thần. Một món Cổ Thần ngang giá một lần `hopnhat` bậc cao ≈ **5.000 bạc + 12 Hỗn Nguyên**. ⇒ **1 Mảnh Cổ Thần ≈ 85 bạc**, làm tròn **100 bạc**. Hoặc **60 mảnh = 1 Box Kundun bậc cao nhất theo cấp** — giữ được cảm giác "đổi lấy một cơ hội trúng đồ", đúng tinh thần MU hơn. |

### 6.3 🔁 GỘP — bớt ô đếm mà không bớt cơ chế

| Loại | Gộp vào | Tỉ giá đề xuất & căn cứ |
|---|---|---|
| **Huyền Thiết** (`mat`) | **Bạc** | Chỗ tiêu duy nhất là `forgeRule().mat` (1–3 đơn vị mỗi lần rèn). Cùng lúc đó `ren` đã thu `(20 + plus*15) * tier` bạc. ⇒ nhập thẳng phần Huyền Thiết vào giá bạc và quy **1 Huyền Thiết = 200 bạc** (bằng giá 5 viên ở tiệm, mục `r_mat5`, chia ra). Đây là ô đếm **thứ hai trên HUD** — bỏ nó là dọn được cả một dòng HUD lẫn một dòng `MAT_ROWS`. |
| **Tu La Tinh Thạch** | **Chúc Phúc Châu + Linh Hồn Châu** (đúng cách MU rèn +10…+13) | Tu La chỉ dùng ở +7…+11 và Áo Choàng. MU dùng chính Bless/Soul cho khoảng đó. ⇒ **1 Tu La = 1 Chúc Phúc Châu**. Bớt 1 ô. |
| **Hỗn Nguyên Thạch** | **Hỗn Độn Châu** | Hai thứ này đã trùng vai (nhiên liệu Lò Hỗn Loạn + cánh). ⇒ **1 Hỗn Nguyên = 1 Hỗn Độn Châu**; giá `hopnhat` giữ nguyên số (2/4/7/12), giá `wing1`/`wing2` giữ nguyên (10/20). Bớt 1 ô, và **trả game về đúng bộ Ngọc của MU**. |
| **Đá Thăng Cấp** (`tienDan`) | **Bạc** (nếu Thuần Thục cũng được giữ) | 1 nguồn : 8 nguồn thu là quá lệch, và chỗ tiêu có trần cứng. Căn cứ tỉ giá: `TH_COST` tầng 1 = `2 dan + 400 bạc`; tầng 7 = `24 dan + 8.000 bạc`. Nội suy ⇒ **1 Đá Thăng Cấp ≈ 330 bạc**, làm tròn **300 bạc**. |
| **Sách Kỹ Năng** (`bikipVH`) | **Bản Năng** | Cùng một chỗ tiêu (`upgradeSkillUI` và `useSkillBookUI` đều nâng cấp chiêu). 1 quyển = nâng thẳng chiêu lên cấp nhân vật. Ở cấp 60 điều đó ≈ `Σ skUpKhi` ≈ vài chục nghìn Bản Năng ⇒ **1 Sách Kỹ Năng ≈ 20.000 Bản Năng**, cần đo lại bằng `skUpKhi()` trước khi chốt con số. |
| **Mảnh Cổ Thư** (`bikip.pieces`) | Không gộp — **sửa lỗi gác** | Thêm gác `!player.bikip.hmtp` cho nhánh Học Giả Lang Thang trong `rollKyngo()`, đúng như hai nguồn kia đã làm. Một dòng. |

Nếu làm hết §6.1–6.3: **26 ô → 18 ô**, và bộ Ngọc trở lại đúng bốn viên của MU.

### 6.4 ✅ GIỮ NGUYÊN — không nên đụng tới

| Loại | Vì sao |
|---|---|
| **Bạc** | Là Zen. Trục chính của mọi thứ. Chỉ đổi tên như đã chốt. |
| **Chúc Phúc · Linh Hồn · Sinh Mệnh · Hỗn Độn Châu** | Bốn viên Ngọc của MU, khớp vai 1:1, cơ chế đã đúng. Đụng vào là phá đúng thứ đang đúng. |
| **Thiên Mệnh Phù** | Ô đếm cân bằng nhất game: mua bằng bạc ngay tại chỗ tiêu. Không tích trữ được, không rò rỉ. |
| **Box Kundun** | 5 nguồn / 2 chỗ tiêu, `ghepHap()` cho phép dồn bậc — vòng kinh tế đẹp và là tên đã được chủ dự án chốt. |
| **Ấn Giao Kết · Ấn Cổ Xưa** | Vé quay Chimera — một trong ba loại chính đã chốt. Vòng đời sạch (3 thu / 1 tiêu và 1 thu / 1 tiêu), mọi nguồn đã đi qua một hàm duy nhất `chiVe()`. |
| **Đất Hồn** | 1 thu / 2 tiêu, khép kín trong hệ Chimera. **Nhưng nên cho nó một dòng trong `MAT_ROWS`** — hiện nó chỉ hiện trong bảng nuôi Chimera. |
| **Mảnh Trang Bị · Tịch Ma Thạch** | Chỗ tiêu nằm ngoài sáu hệ (Kế Thừa + Thuần Thục) và chú thích trong mã đã khẳng định chúng được giữ. Nếu §6.3 xoá Đá Thăng Cấp thì cân nhắc lại, còn không thì để yên. |
| **Lõi Nguyên Tố** | Vòng đời sạch. Chỉ nên xét lại cái trần 3/ngày vì nguồn không có trần. |
| **Bản Năng** | Chỗ tiêu duy nhất là trục nâng chiêu — đó là một trục thật. Vấn đề của nó là **nguồn**, không phải chỗ tiêu: hai dòng cộng theo thời gian (`+3/giây` thụ động và `+6/giây` ở Suối Ký Ức) thưởng cho việc **đứng yên**. Sửa nguồn, đừng xoá ô đếm. Và nên thống nhất tên: mã gọi *Instinct*, người chơi thấy *Bản Năng*. |

### 6.5 ⏸ GIỮ CHỜ — theo chỉ đạo của chủ dự án

| Loại | Hiện trạng | Ghi chú |
|---|---|---|
| **Nguyệt Trần** (`chimera.nguyet`) | 1 thu / **0 tiêu** | **KHÔNG đề xuất xoá.** Đã dành cho cửa hàng đổi vật phẩm tương lai (chú thích trong mã ghi rõ). |
| **Tinh Trần** (`chimera.tinh`) | 1 thu / **0 tiêu** | như trên |

Hai điều nên biết trước khi mở cửa hàng đó:

1. **Tinh Trần tích rất nhanh.** `gachaMotLuot()` cộng 15 cho **mỗi lượt ra 3★** — với tỉ lệ
   5★ 0,6% và 4★ 5,1%, đó là khoảng **94% số lượt**. Một người quay 100 lượt sẽ có ≈ **1.410
   Tinh Trần**. Cửa hàng phải định giá theo con số đó, không theo cảm tính.
2. **Nguyệt Trần thì rất chậm.** Chỉ cộng khi trúng một con **đã đủ C6** (+25 với 5★, +5 với 4★).
   Người chơi trung bình sẽ có **0 Nguyệt Trần trong nhiều tháng đầu**. Hai thứ này không cùng
   một thang giá và không nên bày chung một quầy.
3. **Chưa có gì hiển thị số dư ngoài một dòng chữ** trong `renderKheUoc()`, và
   `applyTestBoost()` phát sẵn 500 Tinh Trần + 200 Nguyệt Trần cho chế độ thử.

---

## 7. Ba việc dọn nhỏ đi kèm (nằm ngoài phạm vi tiền tệ nhưng cùng khu vực)

1. **Ba hàm chết**: `window.doKeThua`, `window.doDoiHe`, `window.useJewel` — cả ba đều còn nguyên
   thân hàm, đều **không có nơi gọi**, và cả ba đều **trừ tiền tệ**. Để lại thì bất kỳ ai
   grep "chỗ nào tiêu Mảnh Trang Bị" cũng sẽ đếm nhầm.
2. **Luật CSS mồ côi** `#hud-khi` (`style.css:547`) — không có phần tử tương ứng.
3. **Ba ô đếm không có nhà**: **Bản Năng**, **Đất Hồn**, **Lõi Nguyên Tố** đều không có dòng trong
   `MAT_ROWS`, nên tab "Vật Liệu" không phải là chỗ xem được mọi số dư. (Lõi Nguyên Tố có mặt ở
   tab Box Kundun, hai loại kia thì phải mở đúng bảng riêng mới thấy.)

---

## 8. Phụ lục — bảng lệnh kiểm lại toàn bộ

```bash
cd /home/user/axie-wuxia
G=public/game/game.js

# §1 — số dòng cộng/trừ của từng trường
for f in silver mat khi tienDan charms; do
  echo "$f  +$(grep -c "player\.$f *\(+=\|++\)" $G)  -$(grep -c "player\.$f *\(-=\|--\)" $G)"
done
for f in "gems\.tuLa" "gems\.honNguyen" "mats\.manh\b" "mats\.tichMa" \
         "mats\.manhCoThan" "mats\.datHon" "jewels\.honDon"; do
  echo "$f  +$(grep -c "$f *\(+=\|++\)" $G)  -$(grep -c "$f *\(-=\|--\)" $G)"
done

# §3.1 — Ấn Cổng Vực: 6 dòng, không dòng nào +=/-=
grep -n "anTranAi" $G

# §3.2 — Mã Thầu, Nguyệt Trần, Tinh Trần, vé tân thủ
grep -n "maThau" $G          # 4 dòng: 1 backfill, 2 cộng, 1 hiển thị
grep -n "C\.nguyet\|C\.tinh" $G
grep -n "tanthu" $G          # 3 dòng, cả 3 là khởi tạo

# §4 — trạng thái sáu hệ
for k in "Thần Binh" "Tấn Phẩm" "Linh Thú" "Gia Viên" "Cổ Thần" "Khắc Ấn"; do
  echo "$k: $(grep -c "$k" $G)"
done
grep -c "renderPet\|petPay\|petRule" $G     # 0 = Linh Thú đã gỡ
grep -c "ANCIENT_SETS" $G                   # >0 = Cổ Thần CHƯA gỡ
grep -c "SIGIL_DEFS" $G                     # >0 = Khắc Ấn CHƯA gỡ

# §4.4 — Khắc Ấn không tiêu tiền tệ nào (kỳ vọng: 0 dòng)
grep -n "sigil" $G | grep -i "silver\|player.mat\|charms\|jewel\|gems\|tienDan\|khi"

# §5.3 — không có tiền nạp (kỳ vọng: 0 dòng)
grep -in "nạp tiền\|wcoin\|kim cương\|premium\|topup\|cash shop" $G

# §7.1 — ba hàm chết (kỳ vọng: mỗi cái đúng 1 dòng = chỉ định nghĩa)
for f in doKeThua doDoiHe useJewel; do echo "$f: $(grep -c "$f" $G)"; done

# §7.2 — luật CSS mồ côi
grep -rn "hud-khi" public/game/
```
