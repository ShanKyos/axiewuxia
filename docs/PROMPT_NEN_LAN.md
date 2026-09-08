# Tranh nền CHỈ-ĐẤT cho Lối Mòn Corran — 6400×1400

> Đây là thứ §9.2 của `DUONG_DI_VA_GOC_NHIN.md` chốt là mảnh còn thiếu: hình học của làn đã đúng
> và đã gác được bằng bài kiểm, nhưng nhìn vào **chưa đọc ra con đường**, vì mặt đất phẳng một
> màu. Tấm tranh này là thứ làm nó đọc ra.

---

## 1. Khác mọi tranh nền cũ ở một điểm: KHÔNG VẼ VẬT THỂ

Tám tranh nền hiện có nướng chết cả cảnh vật vào một tấm phẳng — và đó là gốc của cả ba lỗi đã
phải vá (đi trên không trung · đi đè lên cây · đứng "sau" gốc cổ thụ hiện ra như đứng "trên" nó).

Tấm này **chỉ vẽ MẶT ĐẤT**. Cây, đá, bụi là vật thể RỜI, engine đã xếp lớp theo trục y sẵn, đặt
bằng `vatDat` trong `data/canbang.js`. Nhờ thế người chơi đi được ra SAU cây — thứ mà tranh nền
phẳng không bao giờ cho.

Nên trong prompt, câu **"no trees, no rocks, no props"** không phải là hạn chế cho gọn. Nó là
điều kiện để cả hướng đi này chạy được. Vẽ thêm một cái cây vào tranh là hỏng đúng chỗ cần sửa.

## 2. Vì sao hai tấm

Khổ cần là 6400×1400 = **4,57:1**. Tỉ lệ rộng nhất model thường nhận là 21:9 (2,33:1). Ép 4,57
vào 21:9 thì bố cục bị bóp, mà bóp thì lối mòn không còn nằm đúng chỗ `diTrong` đã chốt.

Nên cắt đôi, mỗi tấm ~2,4:1, **chồng mép 300px** để còn chỗ hoà:

| Tấm | Phủ thế giới x | Khổ | Ảnh tham chiếu |
|---|---|---|---|
| A | 0 – 3350 | 3350×1400 (2,39:1) | `docs/phac_lan/lan_A.jpg` |
| B | 3050 – 6400 | 3350×1400 (2,39:1) | `docs/phac_lan/lan_B.jpg` |

Sinh xong ghép bằng `python3 tools/ghep_lan.py <A> <B> public/game/assets/maps/bg_loimon.jpg`.
Bộ ghép **tự đo lệch tông ở dải chồng** và báo hỏng nếu hai tấm khác tông (đã kiểm bằng đối
chứng: nhuộm một tấm ngả vàng 15% thì nó bắt được).

## 3. Đọc ảnh tham chiếu

Ba tông, mỗi tông là một chất liệu — **không có tông nào là màu trang trí**:

| Trong ảnh | Nghĩa | Vẽ ra thành |
|---|---|---|
| Nâu đen | ngoài hành lang | nền rừng tối: lá mục, rễ nổi, đất ẩm |
| Xanh ô-liu | vệ cỏ (vẫn đi được) | cỏ thấp, rêu, sỏi lẫn |
| Nâu sáng | **lối mòn** | đất trần bị giẫm mòn, vết bánh xe, đá cuội |

⚠ Lối mòn HẸP HƠN vệ cỏ là cố ý: mắt đọc ra con đường, mà chân vẫn đi được cả vạt cỏ hai bên —
hành lang đi được rộng 368-496px, còn lối mòn chỉ ~280px.

---

## 4. PROMPT TẤM A — chép nguyên, kèm ảnh `lan_A.jpg`

```
A top-down ground plane for a 2D action RPG map. GROUND ONLY — this is a floor texture the game
paints its own trees and rocks on top of.

Follow the attached layout image EXACTLY. It is a material map, not a picture:
- the light tan band is a WORN DIRT TRAIL — bare packed earth, faint wheel ruts, scattered
  pebbles, patches where grass has been trodden away
- the olive green band flanking it is LOW GRASS VERGE — short turf, moss, small stones
- the dark brown area is SHADED FOREST FLOOR — leaf litter, exposed roots, damp soil
Keep every band in exactly the position and width shown. Do not straighten the trail.

CRITICAL — draw NO trees, NO rocks, NO bushes, NO logs, NO buildings, NO characters, NO water.
Nothing that stands up off the ground. Only the flat ground surface seen straight from above.

Lighting: flat and even across the whole image, as if overcast. NO cast shadows, NO vignette,
NO sun rays, NO darkening toward the edges — shadows are painted by the game engine.

Style: hand-painted, soft brushwork, warm saturated storybook palette, clean and readable at
small size. Same look as a cozy adventure game world map.

The image must tile seamlessly at the LEFT and RIGHT edges with a continuation of the same
ground — do not fade, frame, or vignette the edges.

Aspect ratio 21:9, highest resolution available.
```

## 5. PROMPT TẤM B — chép nguyên, kèm ảnh `lan_B.jpg` **VÀ tấm A vừa sinh**

Đính **cả hai** ảnh: `lan_B.jpg` (bố cục) và tấm A (khoá tông màu). Thiếu tấm A là hai nửa ra
khác tông, và `ghep_lan.py` sẽ bắt lỗi.

```
A top-down ground plane for a 2D action RPG map — this is the RIGHT HALF of a wider map whose
LEFT HALF is the second attached image.

Match that left-half image EXACTLY in palette, brush style, grass colour, dirt colour and
lighting. The two halves will be joined edge to edge, so any difference in tone will show as a
seam. Treat the left edge of your image as a direct continuation of the right edge of the
attached half.

Follow the first attached layout image EXACTLY for where things go:
- light tan band = WORN DIRT TRAIL (bare packed earth, faint ruts, scattered pebbles)
- olive green band = LOW GRASS VERGE (short turf, moss, small stones)
- dark brown area = SHADED FOREST FLOOR (leaf litter, exposed roots, damp soil)

CRITICAL — draw NO trees, NO rocks, NO bushes, NO logs, NO buildings, NO characters, NO water.
Only the flat ground surface seen straight from above.

Lighting: flat and even, overcast. NO cast shadows, NO vignette, NO darkening toward the edges.

Aspect ratio 21:9, highest resolution available.
```

---

## 6. Lắp vào

```bash
python3 tools/ghep_lan.py <tấmA> <tấmB> public/game/assets/maps/bg_loimon.jpg
```

rồi mở lại dòng `loimon:` trong `MAP_BG_SRC` (`game.js`, đang chú thích lại — xem ghi chú ở đó).

Sau đó **không chạy `can_tu_tranh.py`**: tấm này chỉ có đất, không có vật thể để suy vật cản.
Vật cản của làn là `diTrong` + 14 tảng đá đã khai tay trong `MAP_OBSTACLES.loimon`.

## 7. Sinh lại ảnh tham chiếu khi đổi hình học làn

`tools/phac_lan.py` đọc hình học từ `tools/dung_lan.py` — **một nguồn duy nhất** với chính đa
giác `diTrong` đang chạy. Sửa làn thì chạy lại cả hai, đừng sửa ảnh bằng tay:

```bash
python3 tools/dung_lan.py            # in ra diTrong + vatDat để dán vào canbang.js
python3 tools/phac_lan.py            # vẽ lại docs/phac_lan/
```
