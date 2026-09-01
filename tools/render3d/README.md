# Nướng sprite từ model 3D

Dựng nhân vật 3D rồi **chụp** thành sprite 2D nhiều hướng — đúng cách Diablo 2
và loạt game 2D cùng thời làm ra hình. Không phụ thuộc gói ngoài, chạy bằng Node.

```
node tools/render3d/bake.js velmyr /tmp/hero3d
```

Xuất `velmyr.png` (atlas) + `velmyr.json` (chỉ mục).
Bộ có sẵn: `velmyr` · `sarkaan` · `ashvard` · `korrveth` — lấy từ `ANCIENT_SETS` trong game.

## Bốn file

| File | Việc |
|---|---|
| `png.js` | Ghi PNG bằng `zlib` có sẵn. Không cài thêm gói nào. |
| `raster.js` | Ma trận 4×4, hình cơ bản, chiếu **trực giao**, đệm độ sâu, tô tam giác có đổ bóng + đèn viền. Khử răng cưa bằng dựng bội 3× rồi thu nhỏ. |
| `hero.js` | **Thân người gốc** — chưa mặc đồ bộ. Trả ra ma trận của mọi KHỚP. |
| `gear.js` | **Lớp trang bị** đắp lên khớp của thân gốc. |

## Vì sao phải tách thân gốc và lớp giáp

Game có **220 món**. Nướng sẵn mọi tổ hợp là bất khả thi:

```
8 hướng × 18 khung × 220 món × 5 lớp  →  không có cách nào
```

Nên giáp chỉ **thêm khối vào đúng khớp** mà thân gốc đã trả ra. Nó tự nhấp nhô
theo mọi động tác mà không cần biết gì về hoạt hình. Đổi bộ giáp = đổi bảng màu
và vài khối, không phải dựng lại người.

Ngay cả vậy, MỘT bộ cho MỘT lớp đã là **144 khung, 1,3 MB**. Muốn đưa vào game
thật thì phải chọn: chỉ vài bộ mốc, hoặc nướng xám rồi nhuộm theo bộ lúc chạy.

## Chiếu trực giao, không phải phối cảnh

Sprite phải giữ đúng tỉ lệ ở mọi vị trí trên màn. Phối cảnh sẽ làm nhân vật méo
dần khi rời tâm màn hình — mà sprite thì dùng lại ở khắp nơi.

## Hai cái bẫy đã mắc

- **Đệm độ sâu ngược chiều.** Cull mặt sau giữ mặt có pháp tuyến +z ⇒ +z hướng
  về camera ⇒ z LỚN hơn là GẦN hơn. Viết ngược thì hình lồi vẫn đúng (đã cull
  hết mặt sau) nhưng tay che thân là sai ngay.
- **Lớp giáp chỉ to hơn lớp da/vải 0,002 đơn vị** → tranh chấp độ sâu, lớp dưới
  thắng loang lổ. Giáp phải rộng hơn rõ rệt, và phải **ẩn** mảnh vải mà nó trùm
  lên (`buildHero(..., { geared:true })`).
