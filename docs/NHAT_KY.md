# Nhật ký phiên

Ghi lại những gì đã làm, và quan trọng hơn: **những con số đã đo được** và **những chỗ đã đoán
sai**. Phần thứ hai mới là thứ có giá trị về sau — nó là danh sách các cái bẫy đã bước vào.

---

## 2026-09-04 — Thần khí · Soul Master · U Linh · cánh · tách bảng cân bằng

Commit: `305e573`, `3f201d6` · Nền: `7c1490b`

### Vũ khí rời tay — "thần khí"

Đường cũ nướng vũ khí vào từng khung hình và buộc vào xương bàn tay. Ba thứ bị khoá cứng: mỗi
bộ giáp phải nướng riêng, mỗi giai vũ khí một tệp, và vũ khí **không** đổi theo món đang cầm.

Giờ vẽ thẳng từ món trang bị bằng `ITEM_ART`:

| | đường mới (vector) | đường cũ (tranh nướng) |
|---|---|---|
| số cây phủ được | **210** (15 dòng × 14 giai) | 1 cây / 1 tấm bóc tay |
| dung lượng art | **0 byte** | ~9 KB/cây → 210 cây ≈ 1,9 MB |
| đổi vũ khí trong túi | đổi ngay khung sau | phải bóc tấm mới |

Bốn lối ra đòn theo loại vũ khí (`TK_LOI`): kiếm **bổ** · trượng **đâm** · cung **giương** · nỏ
**ngắm**. Cùng một quỹ đạo cho mọi cây là chỗ hỏng dễ thấy nhất — cây cung quét cung 166° như
đại kiếm thì người chơi đọc thành lỗi hiển thị.

Móc `TK_ANH` để đè bằng tranh vẽ tay cho món đáng vẽ riêng. Đang dùng cho trượng Dark Wizard:
tấm gốc là ảnh chéo 512×512, chuẩn hoá bằng cách đo trục chính (PCA, 120,1°), xoay 300,1° cho
đầu trượng nằm dọc +X, cắt sát, thu về 172px, chỗ nắm (65,33).

### Tuyệt chiêu U Linh (Evil Spirit) của Dark Wizard

Gói art gửi tới **không dùng được**, ba lỗi:
1. `.tres` khai 16 khung 640×640, nhưng bên trong mỗi khung lại xếp 9 ô con — hoạt ảnh thật là
   144 khung ~213px. Thả vào Godot cũng chạy sai.
2. Alpha bị nhị phân hoá, 21% mỗi khung là alpha = 0, và lỗ thủng **xuyên qua chính tấm tranh**.
3. Mọi khung đều có sẵn người pháp sư — game đã tự vẽ Dark Wizard rồi.

Giữ hướng nghệ thuật, dựng lại bằng mã. Bảng màu **lấy mẫu thẳng** từ 102.988 pixel vùng tím của
ảnh gốc: `#1f004f · #340665 · #501188 · #853ab5 · #c67be1 · #f0c5f4`.

Tám cánh cùng nhịp, nở bung (0 → 46%) rồi quặp vào trong (46% → hết) — độ cong chạy từ 0,26 lên
1,60. Chính cái `cong` chạy theo thời gian mới làm động tác đọc ra *nuốt*, không phải *xoè rồi tắt*.

Mũi cánh vươn **152px** để khớp `fx.r = 150` của chiêu. Vẽ rộng hơn tầm đánh là hứa suông.

### Bộ Soul Master cho Dark Wizard

Nướng từ gói Spine (`00f679b8`-kiểu, da `Soul Master`, 13 khe, 20 hoạt cảnh). 80 khung, gót
y=212, đỉnh đầu y=53 — khớp tuyệt đối hợp đồng toạ độ.

Vũ khí nướng sẵn **tắt hẳn** vì thần khí đã lo. Dark Wizard đánh thường bằng khung
`05_MagicAttack`: tách `blk` (lấy khung từ đâu) khỏi `kind` (đang làm gì) — gán thẳng
`_kind = 'c'` thì chỉ số khung rơi vào nhánh đọc `castK`, mà `castK = 0` lúc đánh thường, nên
khung đứng im ở 0.

### Cánh — dựng lại theo số đo

**Bề ngang.** Đo trên nhân vật thật (cao 104px, ngang 40px):

| lớp | trước (b1/b2/b3) | sau |
|---|---|---|
| Dark Knight | 2,1× / 3,0× / 3,6× | 1,6× / 2,2× / 2,7× |
| Dark Wizard | 2,5× / 3,5× / **4,2×** | 1,8× / 2,4× / 2,7× |
| Spellblade | 2,4× / 3,7× / **4,5×** | 1,6× / 2,2× / 2,8× |
| Sylvan Ranger | 1,9× / 2,5× / 3,0× | 1,7× / 2,1× / 2,5× |
| Dark Lord | 2,1× / 3,0× / 3,6× | 1,6× / 2,3× / 2,7× |

Chiều cao **giữ nguyên** — có mốc "đỉnh cánh vượt đỉnh đầu ở cả ba bậc", đọc từ ảnh cánh MU thật.

**Gốc cánh.** Đo thẳng từ bộ xương: hai xương cánh tay là con của thân trên nên gốc của chúng
chính là khớp vai — vai phải (75,6 · 103,4), vai trái (94,0 · 104,1) → **±9,2**.

**art khoá cả ba bậc mỗi lớp.** Bản cũ để Spellblade nhảy `lai → tia` và Dark Lord nhảy
`doi → ao` giữa chừng: lên bậc là đôi cánh hoá thành con khác.

**Màu chạy theo lớp**, bậc 2 là đúng màu lớp trong `SECTS`, bậc 1 tối đi, bậc 3 sáng lên. Cánh
Dark Wizard sang tím, lấy mẫu từ chính bộ Soul Master (`#2c1640 · #6b4183 · #b995c8`).

**Cánh côn trùng** ngả thêm 0,34 rad vì nó vẽ dọc trục thuỳ, không như cánh dơi vẽ gần ngang.

### Bay khác đi bộ

Đo chỉ số chồng khít giữa tư thế bay mong muốn với **20 hoạt cảnh × 12 khung**:

```
0,915  00_Walk  khung 8/12   ← khớp nhất
0,718  00_Run   khung 9/12
0,709  01_Dance2 khung 0/12
```

Tư thế cần **nằm sẵn trong khối đi** — khoảnh khắc hai chân chụm, mũi bàn chân chúc xuống. Nên
bay dùng khối đi, ghim quanh khung 21/32, lắc ±2 theo nhịp chậm.

### Tách bảng cân bằng

705 dòng ra `data/canbang.js`, nạp trước `game.js` — cùng khuôn mẫu `strings/vi.js`.

Tám bảng được chọn vì **không phụ thuộc gì cả** (quét mọi định danh viết hoa + mọi lời gọi hàm
bên trong từng khối): `WEAPON_LINES` 247 · `HERO_SETS` 232 · `CHIMERA` 52 · `MAT_PASS` 46 ·
`CHI_KY` 38 · `BOSS_DEFS` 37 · `DUNGEONS` 30 · `QUESTS` 23.

Chưa dời được: `VOHOC_DEFS` cần `SIGNATURE_SKILL` · `SECTS` **gọi hàm `doBasic`** · `MAPS` cần
`REGION_UNLOCK_LORE` · `SIDE_QUESTS` cần `NPC`. `SECTS` gọi hàm nên không bao giờ thành dữ liệu
thuần được.

**Là `.js` chứ không phải `.json`**: `game.js` là classic script, 490 khai báo cấp cao và 29 câu
lệnh chạy ngay lúc nạp. Đổi sang `fetch` JSON là phải chờ bất đồng bộ trước khi khởi động.

---

## Những chỗ đã đoán sai trong phiên này

Ghi lại vì mỗi cái đều tốn một vòng, và cái nào cũng có thể mắc lại.

**Tin chú thích thay vì đo.** Chú thích cạnh `CANH_GOC_X` ghi *"khớp vai y=100, hai vai cách nhau
56 px"*. Tin theo, sửa ±14 → ±23 cho "đúng bả vai". Đo từ bộ xương ra ±9,2 — tức bản sửa đẩy đôi
cánh **ra xa khớp vai thật hơn cả bản gốc**.

**Thu cả hai trục khi chỉ cần thu một.** Cánh quá rộng thì thu bề ngang. Thu luôn chiều cao làm
bậc 1 và bậc 2 tụt xuống dưới đầu, phá mốc thiết kế đọc từ ảnh MU. `test_canh3bac` bắt được.

**Chữ ký hàm lệch một tham số.** `uLinhVuot` khai 9 tham số, ba chỗ gọi đều truyền 8. `boc` nhận
chuỗi màu → `y` thành `NaN` → cả đa giác biến mất, **không một dòng lỗi nào**.

**Đồng hồ hiệu ứng chạy ngược.** `e.t` đếm *lên* (`e.t += dt`), viết `t = 1 - e.t/e.dur`. Chiêu
chạy giật lùi: vừa tung đã ở cuối nhịp, mà cuối nhịp `sin(k·π) = 0` nên vuốt dày đúng 0.

**Dẹt nhầm pháp tuyến.** Hệ số elip 0,44 thuộc về *quỹ đạo*, nhân luôn vào bề dày dải: vuốt nằm
ngang chỉ còn 44% độ dày. Đo được vuốt dài 103px mà hộp bao cao 26px.

**Chia trước/sau theo chẵn lẻ chỉ số.** Vuốt đứng ngay trước bụng nhân vật vẫn có thể bị xếp ra
sau lưng. Phải chia theo **vị trí trên vòng** (`sin(g0) < 0` là nửa xa).

**Regex ăn nhầm hai bảng.** Dùng regex thay `to:` trong `WING*_DEFS` làm hỏng `WING2_DEFS` và
`WING3_DEFS` — ăn cả `const WING2_DEFS = {` lẫn một phần chuỗi `desc`. Bảng nhiều trường tuỳ chọn
thì viết lại nguyên khối, đừng vá bằng regex.

**Nướng thừa một khối khung.** Thêm `00_Squat` làm khối bay, nướng lại cả 8 bộ (+0,7 MB). Đo xong
mới biết dáng cần nằm sẵn trong khối đi. Đo trước khi nướng.

**`pkill` trong lệnh ghép giết luôn shell** (exit 144). Chạy riêng.

---

## Việc còn treo

- `hemp1` + 8 tệp `hemp1_vk*.png` (~2,5 MB) giờ mồ côi: `NV_GIAP['baidasan|1']` đã đổi sang
  `dwsm1`, và đường vũ khí nướng sẵn đã tắt hẳn vì thần khí.
- Ảnh `<bộ>_dung.png` không còn được vẽ ở đâu — `heroPickUrl()` đã chuyển sang `pick_*.webp` cho
  cả 5 lớp. Vẫn nạp sớm 5 tệp PNG chết mỗi phiên.
- Bốn bảng còn vướng phụ thuộc, chưa tách được (xem trên).
- Bộ giáp Dark Wizard dạng ảnh phẳng (2 gói `image2godot4_8/9`) chưa mặc lên người được — cần
  Meowa xuất lại dạng gói Spine trên cùng bản mẫu `spine四头身人物模板`.
