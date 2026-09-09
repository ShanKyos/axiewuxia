# Đặt hàng art cho Thành Lớn Ardhaven + map ngoại ô

Danh sách việc gen còn nợ, kèm prompt copy-paste thẳng vào Gemini. Cập nhật lần cuối:
sau khi đẩy Nhịp Đá (`7c2647c`).

---

## 0. Ràng buộc chung — đọc trước, vì nó là lý do mọi prompt viết như vậy

| Ràng buộc | Con số | Vì sao |
|---|---|---|
| Phép chiếu | isometric **2:1** | Một ô đất vuông vẽ ra thành hình thoi **256×128px**. Sai tỉ lệ là mọi thứ ghép vào lệch, kéo giãn không cứu được. |
| Thang người | **132px** | `NV_CAO` trong game.js. Mọi vật đặt cạnh nhân vật phải đo theo con số này. |
| Nền tách | **magenta `#FF00FF`** | Gemini gần như luôn trả PNG nền đặc. Magenta không có trong bảng màu Axie nên tách bằng máy ra sạch; nền trắng thì ăn mất chỗ sáng của mái nhà. |
| Độ chi tiết | ≥ **7,6** | Đo cục bộ ở thang thân nhân vật. Tấm `bg_quangtruong` đã duyệt đạt 7,57; dải Tầng Sâu đạt 13,3. Một tấm 2048px kéo cho vừa map 5200×3800 chỉ còn 3–4 — **mờ hơn tấm tệ nhất đang có**. Đây là lý do đi đường VIÊN LÁT chứ không gen một tấm thành khổng lồ. |

---

## 1. ĐANG NỢ · Mặt đất — gen lại theo dạng Ô VUÔNG

**Ưu tiên cao nhất. Không có mặt đất thì không dựng được thành lẫn map ngoại ô.**

Hai lượt trước đều gen hình thoi và đều hỏng ở mép:

| Lượt | Kết quả đo | Hỏng ở đâu |
|---|---|---|
| v1 (1:1) | 16 viên **500×503**, tỉ lệ 0,99 | Không phải 2:1. Viền nâu dày quanh mỗi viên → cả map thành lưới kẻ ô. |
| v2 (2:1) | 16 viên **728×360**, tỉ lệ 2,02 ✔ | Đá lát **đạt, ghép sạch**. Cỏ và đất còn vành sẫm mỏng quanh mép → lưới quả trám. Viên chuyển tiếp cắt chéo góc-tới-góc chỉ tạo nêm răng cưa, không thành đường. |

**Nên đổi sang ô vuông.** Vẽ hình thoi liền mạch là việc khó cho model — bốn mép phải khớp với
chính nó theo hai hướng chéo. Ô vuông lặp liền mạch nhìn thẳng từ trên xuống thì dễ hơn hẳn, và
`tools/iso/cat_vien_gem.py --vuong` tự xoay 45° + ép dẹt bằng **ánh xạ ngược**, giữ nguyên tính
lặp → hình thoi ra liền mạch tuyệt đối. Đã chứng minh bằng hoạ tiết thử: ghép ra không còn một
cạnh hình thoi nào.

```
Seamless tileable ground texture, top-down flat view, straight down, no
perspective, no isometric angle — just a flat square patch of ground seen from
directly above.

Output ONE image, 2048x2048, containing a 2x2 grid of 4 seamless square
textures, each cell 1024x1024:
  top-left     — short bright grass
  top-right    — packed dirt / bare earth
  bottom-left  — laid stone plaza pavement, irregular flagstones
  bottom-right — cobblestone road, rounded stones

CRITICAL — SEAMLESS TILING. Each 1024x1024 texture must repeat infinitely in
all four directions with no visible seam: the left edge must continue into the
right edge, and the top edge into the bottom edge, as if the pattern were cut
out of a much larger continuous field. Nothing may be centered, framed, or
composed — no vignette, no border, no rim, no darker edge, no lighting falloff
toward the edges. A stone or a tuft that touches the right edge must reappear,
cut in half, at the same height on the left edge.

Lighting: perfectly flat and even ambient light, identical brightness corner to
corner. No directional shadows, no highlight in the middle.

Art style: Axie Infinity. Soft hand-painted shapes, cheerful saturated candy
palette, gentle cel shading. Keep the exact palette and painting style of a
friendly storybook game. Detail scale: on the grass and dirt, individual marks
should read at about 1/20 of the texture width; the flagstones about 1/6.

Hard rules: no characters, no props, no plants standing up, no text, no
watermark, no cell borders or gridlines between the four cells, no magenta.
```

Nhận về → `python3 tools/iso/cat_vien_gem.py --vuong <tấm>` → 16 viên vào `public/game/assets/iso/`.

> **Giữ lại bộ v2:** đá lát của lượt v2 đã đạt, cất ở `tools/iso/nguon/gem_thoi_v2.png`.
> Cắt bằng `--thoi` nếu cần dùng ngay.

---

## 2. ĐANG NỢ · Tám công trình — mỗi cái một ảnh riêng

Gen 8 lần, mỗi lần chỉ đổi đúng dòng `THE BUILDING:`.

```
A single isometric building for a 2D game, true 2:1 dimetric projection
(the square ground footprint renders as a diamond exactly twice as wide as tall),
orthographic camera, no perspective convergence, viewed from the standard
front-left isometric corner.

THE BUILDING: <đổi dòng này>

Output 1024x1024, the building centered, its ground footprint a diamond about
768 wide and 384 tall, the roof rising above that. Background pure magenta
#FF00FF, completely flat, no gradient.

Scale anchor: the door opening must be 150px tall — a person is roughly the
height of one and a half door widths. Draw the door.

Art style: Axie Infinity. Soft rounded chunky shapes, thick warm-dark-brown
outline (NOT black), cheerful saturated candy palette, gentle cel shading,
storybook charm. Slightly oversized friendly proportions — stubby, welcoming,
never grim or gothic.

Lighting: single soft light from upper-left. Add a soft elliptical contact
shadow directly under the footprint only, no cast shadow reaching away.

Hard rules: no characters, no text, no signage lettering, no UI, no watermark,
no ground beyond the contact shadow.
```

| # | Dòng `THE BUILDING:` | Dùng cho | NPC sẽ đứng |
|---|---|---|---|
| 1 | `a blacksmith forge — open-fronted stone workshop, glowing orange forge mouth, anvil out front, chimney with a curl of smoke, tools on the wall` | Lò Rèn Hoàng Gia | `talk:'forge'` |
| 2 | `an apothecary shop — timber cottage, bundled herbs hanging under the eaves, round bottles on a window shelf, mossy green roof` | Tiệm Thuốc | `talk:'shop'` |
| 3 | `a weapon rack stall — open market stall with striped awning, swords and bows displayed on wooden racks` | Vũ Khí Phường | `talk:'shop'` |
| 4 | `a tea house — two storeys, warm wooden balcony, paper lanterns hanging along the rail, low tiled roof` | Trà Quán | `talk:'quest'` |
| 5 | `a stone treasury vault — squat fortified building, heavy banded metal door, small barred windows, blue-grey stone` | Ngân Hàng Ngọc | `talk:'quest'` |
| 6 | `a shrine to a moon goddess — small open pavilion on a raised stone platform, four carved pillars, a smooth pale moon-orb floating above the altar, soft blue glow` | Sảnh Cầu May | `talk:'vanduyen'` |
| 7 | `a guard post gatehouse — thick stone arch wide enough to walk through, banner draped on each side, brazier burning on top` | Bốn cổng Đ/T/N/B | — |
| 8 | `a two-storey inn — warm plaster walls, wooden beams, flower boxes under the windows, a wide welcoming doorway` | Quán Trọ | `talk:'quest'` |

**Cần thêm hai cái nữa** cho hai hệ chưa có cửa (xem §4):

| # | Dòng `THE BUILDING:` | Dùng cho | NPC |
|---|---|---|---|
| 9 | `a stable yard — open timber shelter with a low fence, straw on the ground, feed troughs along one wall, hay bales stacked at the back` | Chuồng Linh Thú | `talk:'stable'` |
| 10 | `a bounty board post — a heavy wooden notice board under a small shingle roof, torn papers pinned to it, a lantern hanging off one corner` | Truy Nã Lệnh | `talk:'trunya'` |

---

## 3. ĐANG NỢ · Vật nhỏ — một tấm, 12 món

```
Isometric game prop sheet, true 2:1 dimetric projection, orthographic camera.

Output ONE image 2048x1536 containing a 4x3 grid of 12 separate props, each
prop centered in its own 512x512 cell. Background pure magenta #FF00FF.

The 12 props: a stone well with a wooden bucket frame; a market crate stack; a
barrel; a hanging street lantern on a post; a wooden cart; a flower planter; a
low wooden fence segment; a stone bench; a signpost with blank arrow boards; a
water trough; a stack of sacks; a small round shade tree.

Scale anchor: the well is 200px tall in its cell. Everything else scaled to
match that same world — a person would be 132px tall.

Art style: Axie Infinity. Soft rounded chunky shapes, thick warm-dark-brown
outline (NOT black), candy palette, gentle cel shading, storybook charm.

Lighting: single soft light from upper-left, consistent across all 12. Soft
elliptical contact shadow under each prop only.

Hard rules: no characters, no text, no watermark, no cell borders, no ground.
```

---

## 4. Vì sao thành lớn đáng làm — bốn hệ đang KHÔNG có cửa nào

Engine có 7 loại NPC. Đếm trong `data/canbang.js`:

| `talk:` | Số NPC đang có |
|---|---|
| `quest` | 10 |
| `forge` | 3 |
| `shop` | 1 |
| **`stable`** (Linh Thú) | **0** |
| **`trunya`** (Truy Nã Lệnh) | **0** |
| **`vanduyen`** (Sảnh Cầu May) | **0** |
| **`tenui`** (Té Núi) | **0** |

Bốn hệ cuối chạy được nhưng chỉ mở bằng phím tắt — **không có một chỗ nào trong thế giới dẫn
tới chúng**. Thành lớn là nơi đặt bốn cái cửa đó, và đó là phần "thành có các tính năng khác
nhau" có giá trị thật chứ không phải trang trí.

---

## 5. Thứ tự nên gen

1. **§1 mặt đất** — chặn mọi thứ khác.
2. **§2 số 7 (cổng thành)** — bốn hướng của thành phụ thuộc nó.
3. **§2 số 1, 2, 9, 10** — bốn cái mở ra chức năng thật.
4. **§3 vật nhỏ** — làm phố có người ở.
5. **§2 số 3–6, 8** — phần còn lại.

---

## 6. Còn chờ quyết định

- **Khổ thành.** 6400×3200 (tỉ lệ 2,0 — đo từ toạ độ NPC thành Tương Dương của Võ Lâm Chi Mộng:
  x trải 35→285, y chỉ 100→161) hay 5200×3800 (bằng Rẻo Rừng Corran, map chủ dự án đã ưng).
- **Map ngoại ô cấp 20-30** dựng theo khuôn Rẻo Rừng Corran — dùng chung bộ viên lát ở §1,
  không cần đặt hàng art riêng.
