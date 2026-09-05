# Cầm hai vũ khí — khảo sát

Câu hỏi của chủ dự án: *"Nghiên cứu sao cho class khác có thể cầm được kiếm. Nhân vật
có sẵn động tác attack / vung kiếm rồi nên mình nghĩ sẽ làm được. DK sẽ cầm 2 kiếm còn
Spellblade là song kiếm."*

Trả lời ngắn: **làm được, và animation không phải chỗ khó.** Chỗ khó là TRANH VŨ KHÍ.

---

## 1. Vì sao animation không phải vấn đề

Vũ khí trong game **không nằm trong khung hình nhân vật**. Đường nướng vũ khí vào từng
khung (`<bộ>_vk<N>.png`, 80 khung/cây) đã gỡ từ đợt Thần Khí — xem chú thích ở
`game.js` ngay trên `thanKhiTuThe()`.

Nay vũ khí là:

| | |
|---|---|
| Nguồn | `thanKhiNguon(p)` — đọc `p.equip.vukhi`, tra `VK_ANH`, trả `{ dai, ve }` |
| Tư thế | `thanKhiTuThe(p, atkK, castK, wph, now)` — trả `{ x, y, xoay, truoc }` |
| Vẽ | `veThanKhi(g, t, p)` — hào quang, vệt đuôi, rồi tấm tranh |
| Quỹ đạo | `TK_LOI[art]` — bốn lối: `weapon` · `staff` · `bow` · `crossbow` |

Khung hình nướng sẵn chỉ có THÂN NGƯỜI: bàn tay nắm đấm rồi vung theo cung, đọc thành
"ra hiệu điều khiển" chứ không phải "quên cầm đồ".

**Hệ quả: cây thứ hai = thêm một lượt vẽ với tư thế soi gương.** Không nướng lại khung
hình nào, không thêm một byte art nhân vật nào.

Đã dựng nguyên mẫu ngay trong trình duyệt (ghi đè `veThanKhi` cho nó vẽ hai lần, cây phụ
soi gương qua trục người). Cả hai cây đều lấy đà và quét theo lúc bổ. Ảnh chụp trong
báo cáo phiên làm việc.

Một chi tiết bắt được lúc dựng: ở tư thế NGHỈ cả hai cây đều vẽ SAU thân (`truoc:false`),
nên nếu chỉ soi gương đúng khoảng cách cũ thì cây phụ nấp trọn sau người. Phải đẩy ra
khoảng 1,9 lần — và khi đó nó thành dáng "hai lưỡi bắt chéo sau lưng", đúng dáng MU.

## 2. Phần đã có sẵn, không phải làm

- **Ô Vũ Khí 2** đã dựng xong: có trong `SLOTS` (`nhanTu:'vukhi'`), nhận kéo-thả qua
  `oNhanDuoc()`, và **sống sót qua nạp save** (vừa sửa ở đợt trước — trước đó vòng gộp
  trang bị gom theo `it.slot` nên nó bị đá xuống túi mỗi lần nạp).
- **Chỉ số đã cộng đủ**: `calcDerived()` duyệt `player.equip` THEO KHOÁ, nên `vukhi2`
  được tính y như mọi ô khác. Không phải sửa gì.
- **Quỹ đạo cho kiếm đã viết rồi**: `TK_LOI.weapon` — "lấy đà sau lưng, quét vòng ra
  trước mặt rồi thu về" — phủ cả kiếm, rìu, chuỳ, búa.
- **Dark Knight VỐN ĐÃ có dòng kiếm**: `WEAPON_LINES` khai `thieulam/kiem`. Spellblade
  có `songdao` · `daikiem` · `makiem`. Không lớp nào phải mở khoá gì.

## 3. Chỗ CHẶN thật: tranh vũ khí

`VK_ANH` chỉ có tranh cho **dòng trượng của Dark Wizard**. Đo trên bản hiện tại:

| lớp / dòng | có tranh |
|---|---|
| thieulam / kiem · riu · chuy | ✗ ✗ ✗ |
| baidasan / gay · quyentruong | ✓ ✓ |
| toanchan / cungngan · truongcung · no | ✗ ✗ ✗ |
| minhgiao / songdao · daikiem · makiem | ✗ ✗ ✗ |
| bug / lenhtruong · bua · kich | ✗ ✗ ✗ |

**2 trên 14 dòng.** Nghĩa là hôm nay Dark Knight cầm kiếm thì `thanKhiNguon()` trả
`null` và **không vẽ ra cây nào cả** — chưa nói tới hai cây.

Đây là việc art, không phải việc mã. Và `VK_ANH` tra theo thứ tự `'<dòng>|<giai>'` rồi
mới tới `'<dòng>'`, nên **một tấm cho cả dòng là đủ chạy** — đúng cách dòng trượng đang
làm. Mức tối thiểu để chủ dự án nhìn thấy song kiếm:

- **1 tấm** — kiếm cho Dark Knight
- **1 tấm** — song đao (hoặc mã kiếm) cho Spellblade

Hai tấm, qua `tools/chuanhoavk.py` như bảy cây trượng vừa rồi. Phủ kín 14 dòng thì cần
14 tấm; phủ riêng từng giai thì 98.

## 4. Chỗ phải quyết trước khi làm

### a. Cân bằng — cây thứ hai cộng thẳng 56,5% Công Kích

Đo thật (Dark Knight cấp 105, đồ giai 7 +11 hoàn hảo cả hai ô):

| | Công Kích |
|---|---|
| một vũ khí | 1.282 |
| hai vũ khí | 2.006 |
| | **+56,5%** |

Cộng thẳng như vậy là quá tay: máu quái neo vào `sucNguoi()`, mà `sucNguoi()` chỉ tính
MỘT vũ khí. Ba lối:

1. **Ô phụ tính 50%** — nhân đôi phụ vào `applyLine` cho khoá `vukhi2`. Song kiếm thành
   +28%, đủ đáng để đánh đổi mà không phá đường cong.
2. **Ô phụ chỉ nhận vũ khí một tay** — cấm đại kiếm/kích/trường cung vào ô 2. Đây là luật
   của MU và của phần lớn ARPG, và nó tự cân bằng: hai thanh kiếm ngắn yếu hơn một đại kiếm.
3. **Cả hai.**

Đề xuất: **(2) trước, rồi đo lại.** Nó là luật người chơi ĐỌC RA ĐƯỢC, còn (1) là con số
giấu trong công thức.

### b. `haiTay` — mở cho lớp nào

Cổng đã có sẵn: `oNhanDuoc()` đọc `SECTS[player.sect].haiTay`. Hiện **không lớp nào bật**.
Bật là một dòng trong `data/canbang.js`.

Theo ý chủ dự án: `thieulam` (Dark Knight, hai kiếm) và `minhgiao` (Spellblade, song kiếm).

Nhưng hai lớp đó khác nhau về Ý NGHĨA, và nên khác nhau trong luật:
- **Dark Knight** trong MU là lớp một-tay-kiếm-một-tay-KHIÊN. "Hai kiếm" là lựa chọn ĐÁNH
  ĐỔI: bỏ khiên lấy sát thương. Nếu sau này có ô khiên thì ô 2 dùng chung với nó.
- **Spellblade** là lớp song kiếm THEO THIẾT KẾ. Với nó, hai lưỡi là dáng mặc định.

### c. Tư thế nghỉ khi mang hai cây

Nguyên mẫu cho thấy phải đẩy cây phụ ra xa hơn hẳn, không thì nó nấp sau thân. Còn một
thứ chưa thử: **đeo cánh**. Tư thế nghỉ hiện đã phải né đôi cánh (`TK_CANH_RONG`, đẩy
`ban` thêm 30% bề rộng cánh rồi vẽ ĐÈ). Hai cây + đôi cánh bậc 3 (±78px trên nhân vật
cao 118px) là ba thứ tranh chỗ nhau ở cùng một vùng sau vai — phải đo lại khi làm thật.

### d. Đòn đánh có tính hai lần không

Nếu song kiếm chỉ ĐỔI HÌNH mà không đổi nhịp đánh thì nó là một cái skin có chỉ số. Hai
lối đáng cân nhắc, cả hai đều đụng tới `doBasic()`:
- hai cây thay phiên vung, mỗi đòn một cây (nhịp không đổi, chỉ khác hình);
- mỗi đòn tung HAI nhát, mỗi nhát 55% (nhịp đọc ra là song kiếm thật).

Chưa đo. Lối thứ hai đụng tới `aspd` và tới `test_dps` của cả năm lớp.

---

## 5. Việc phải làm, theo thứ tự

1. Chốt luật ở mục 4a và 4b (một câu trả lời của chủ dự án).
2. Sinh 2 tấm tranh qua meowa.ai → `tools/chuanhoavk.py` → khai vào `VK_ANH`.
3. Bật `haiTay`, thêm luật "ô 2 chỉ nhận vũ khí một tay".
4. Cây phụ trong `thanKhiTuThe()`: trả thêm một tư thế soi gương, và `veThanKhi` vẽ cả hai.
5. Đo lại DPS cả năm lớp, chỉnh hệ số ô phụ.
6. Bài kiểm: ô 2 chỉ nhận đúng loại · hai cây đều vẽ ra · DPS không vượt trần.
