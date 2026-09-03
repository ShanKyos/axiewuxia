# Prompt sinh art nhân vật — Dark Knight

Kèm theo `docs/CAI_THIEN_ART.md`. Tài liệu này cho **một prompt dùng được ngay** cho lớp Dark
Knight, cộng bộ ràng buộc tỉ lệ mà bất kỳ prompt nào cũng phải giữ thì ảnh mới cắt rời ráp vào
bộ khung được.

Ảnh sinh ra là art **của game này**, dựng theo đúng bảng màu và tạo hình đang có trong
`HERO_GEAR.thieulam`. Không nhắm tới việc chép nhân vật của game khác: ảnh chép được cũng vô
dụng vì sai tỉ lệ với bộ khung.

---

## 1. Ràng buộc TỈ LỆ — phần quan trọng nhất

**Đo từ mã** (`HERO_JOINT`, `hHead`, `hLegs`). Nhân vật cao 159 px tính từ đỉnh đầu (y=53) tới
gót chân (y=212). Mọi mốc dưới đây tính theo phần trăm chiều cao đó:

| Mốc | Toạ độ bộ xương | % từ đỉnh đầu |
|---|---|---|
| Đỉnh đầu | y = 53 | 0% |
| Cằm | y = 95 | **26%** |
| Khớp vai | y = 100 | **30%** |
| Hông | y = 142 | **56%** |
| Gối | y = 171 | **74%** |
| Gót chân | y = 212 | 100% |
| Bề ngang vai | 52 → 108 | **35% chiều cao** |

Điều này nghĩa là: **đầu chiếm 26% chiều cao — nhân vật cao chừng 3,8 đầu.** Đây là tỉ lệ anh
hùng cách điệu, KHÔNG phải tỉ lệ thực 7–8 đầu mà công cụ sinh ảnh mặc định trả về. Không ép
được tỉ lệ này thì mọi thứ sau đó vô nghĩa: cắt xong ráp vào là tay dài quá gối, vai lệch khớp.

**Cách ép chắc ăn nhất** là đừng tả bằng lời mà đưa ảnh điều hướng. Lấy tấm khuôn bằng:

```js
heroCardUrl('thieulam', 6, gearVisual(player))   // data URL, khung 332×220
```

Tấm đó đã đúng tư thế, đúng tỉ lệ, đúng cỡ. Dùng làm img2img / ControlNet / ảnh tham chiếu tuỳ
công cụ. Có nó thì phần mô tả tỉ lệ trong prompt chỉ còn là lớp bảo hiểm.

---

## 2. Prompt chính — Dark Knight, chặng giữa

Viết bằng tiếng Anh vì phần lớn công cụ sinh ảnh ăn tiếng Anh tốt hơn.

```
Full-body game character sprite, front-facing, symmetric neutral A-pose.

CHARACTER: heavy-armoured dark knight, stocky heroic build. Closed helmet with a
narrow horizontal eye slit glowing faintly, two curved horns sweeping back and up
from the temples. Layered steel plate cuirass with a raised central band. Broad
angular pauldrons. Plated gauntlets and greaves. Dark crimson cape hanging behind
the shoulders, partly visible at both sides of the body. Holding a large
two-handed straight sword in the right hand, blade pointing straight up, blade
resting against the shoulder.

PROPORTIONS (strict): stylised heroic, 3.8 heads tall. Head occupies the top 26%
of total height. Shoulders at 30% down. Hips at 56%. Knees at 74%. Feet at 100%.
Shoulder width equals 35% of total height. Both feet flat, planted apart at
shoulder width. Arms held slightly away from the torso so the silhouette of each
limb reads separately.

PALETTE: gunmetal plate #54596e with lighter steel highlights #aebdcc and pale
trim #c9d4de, dark slate legs #3a3d4c, near-black boots #2a2c38, deep crimson
cape #7a1e28 shading to #5a1420, warm skin #d8a878.

RENDERING: clean stylised 2D game art, semi-flat cel shading with two tones per
surface plus a thin rim light. Single soft key light from the upper left. Crisp
readable silhouette. No painterly texture noise.

OUTPUT: transparent background, no ground, no cast shadow, no platform, no glow
effects, no particles, character fully inside frame with a small margin.
Resolution 640x880 or larger.
```

### Prompt phủ định

```
3/4 view, side view, dynamic action pose, running, crouching, flying,
realistic human proportions, 7 heads tall, 8 heads tall, long thin limbs,
background, scenery, ground, floor, shadow on ground, pedestal, aura, fire,
glow effects, particles, lens flare, motion blur, text, watermark, signature,
UI frame, border, multiple characters, cropped limbs, hands merged into torso,
weapon crossing the face, cape covering the legs
```

Hai dòng cuối đáng để ý: **cánh tay dính vào thân** và **áo choàng che chân** làm hỏng đúng
bước cắt rời — không tách được mảnh thì cả tấm ảnh bỏ đi.

---

## 3. Năm chặng — đổi đúng ba câu, giữ nguyên phần còn lại

`hStage()` gộp 14 giai trang bị thành 5 chặng tạo hình. Sinh cả 5 trong **cùng một lượt, cùng
một hạt giống**, chỉ thay khối `CHARACTER` và `PALETTE`; giữ nguyên `PROPORTIONS`, `RENDERING`,
`OUTPUT` và prompt phủ định. Không làm vậy thì năm chặng ra năm phong cách.

| Chặng | Giai | Tên bộ trong game | Đổi phần mô tả thành | Bảng màu |
|---|---|---|---|---|
| 1 | 1–3 | Thiết Phiến · Giáp Xích · Giáp Đồng | tấm sắt thô ghép bằng đinh tán, mũ nửa mặt hở cằm, sừng ngắn | sắt xỉn `#43474f` / `#5f6572` / `#6b6250` |
| 2 | 4–6 | Hắc Giáp · Ngân Giáp · Cốt Giáp | giáp tấm kín, viền đồng đỏ, sừng dài hơn, vai có gai | đồng đỏ `#6b3f28` / `#b4763f` / `#d9a05a` |
| 3 | 7–9 | Vảy Rồng · Huyết Long · Bạo Long | vảy rồng xếp lớp chồng lên giáp tấm, vai hình đầu rồng | thép sáng `#5d6a78` / `#aebdcc` / `#c9d4de` |
| 4 | 10–12 | Hỏa Long · Lôi Đình · Băng Nguyên | giáp khắc hoa văn chìm, mũ có mào, áo choàng dài hơn | thép ngả lam `#39557f` / `#7ea3d6` / `#cfe0f5` |
| 5 | 13–14 | Thánh Long · Long Vương | giáp lễ nghi nhiều tầng, vai vươn cao, mũ có vương miện | tím đế vương |

Ảnh nên sinh ở **thang xám hoặc màu nhạt** nếu muốn giữ khả năng tô lại theo giai — `hSetMetal()`
hiện đang tô 14 giai từ cùng một tạo hình, sinh ảnh có màu nướng sẵn là mất cơ chế đó (xem
`CAI_THIEN_ART.md` §3.5 mục 4).

---

## 4. Nhận ảnh về rồi kiểm gì

Trước khi cắt, đo ba thứ trên tấm ảnh — sai một cái là sinh lại, đừng cố sửa tay:

1. **Đỉnh đầu tới cằm có bằng 26% chiều cao không.** Đây là chỗ hỏng thường xuyên nhất.
2. **Đường vai có nằm ở 30% không**, và hai vai có cân không.
3. **Hai cánh tay có tách hẳn khỏi thân không** — nhìn được nền xuyên qua nách. Không tách thì
   không cắt được mảnh tay.

Đạt cả ba thì cắt theo bảng 12 mảnh ở `CAI_THIEN_ART.md` §3.2, mỗi mảnh chờm 4–6 px.

---

## 5. Việc nhỏ nhất nên làm trước

Sinh **một tấm duy nhất**, chặng 3, rồi cắt đúng **hai mảnh**: đầu và cánh tay phải. Ráp vào
`drawHeroFigure()` sau một nhánh `if`, giữ nguyên đường vẽ vector làm đường lùi. Chạy
`tests/test_herosprite.js` và nhìn con số lệch.

Hai mảnh là đủ để biết ba điều mà không tấm ảnh đẹp nào trả lời thay được: mép cắt có hở khi
xoay không, ánh sáng của ảnh có chửi nhau với phần vector còn lại không, và bảng màu có khớp
với quái và NPC xung quanh không.
