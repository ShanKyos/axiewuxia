# Dựng lại 8 map theo lối isometric — chẩn đoán, ràng buộc, và 8 prompt

> Viết sau khi đo lại toàn bộ tranh nền hiện có và vét lại `axieinfinity/axie-origins-asset-kit`.
> Chủ dự án chốt hướng: **regenerate từng map rồi đập đi xây lại**. Tài liệu này là thứ cần có
> trước khi sinh tranh, để tranh sinh ra LẮP ĐƯỢC chứ không phải đẹp rồi bỏ.

---

## 1. Vì sao người chơi thấy mình "ở trên không trung"

Không phải cảm giác mơ hồ — đo được, và nguyên nhân chỉ có một.

`game.js` kéo nguyên tranh nền phủ kín thế giới 2600×1900 rồi cho nhân vật đi khắp mặt tranh
(`drawImage(bg, …)` quanh dòng 10829). Tức là **tranh nền CHÍNH LÀ mặt đất**. Nếu tranh vẽ theo
lối nhìn ngang — có đường chân trời, có trời, có núi xa — thì đi lên phía trên map là đi vào bầu
trời. Đúng nghĩa đen.

**Phép đo tách được hai loại tranh.** Với mỗi tấm, quét từ đáy lên, dừng ở hàng đầu tiên lệch màu
quá 45 so với màu đáy — tức chỗ đổi chất liệu:

| Map | Tên | Dải đất ở đáy | Kết luận |
|---|---|--:|---|
| `daohoa` | Plant Tribe Glade | 2,9% | ✅ nhìn từ trên xuống thật |
| `comoc` | Bug Tribe Tunnels | 0% | ✅ nhìn từ trên xuống thật |
| `tuyettinh` | Bird Tribe Heights | 4,9% | ❌ backdrop nhìn ngang |
| `chungnam` | Werebear Woods | — | ✅ **đã dựng lại** (xem §7) |
| `ngoai` | Beast Herd Camp | 7,3% | ❌ backdrop nhìn ngang |
| `nhanmon` | Dusk Marsh | 7,9% | ❌ backdrop nhìn ngang |
| `tuongduong` | Sapidae Chiefdom | 12,2% | ❌ backdrop nhìn ngang |
| `mongco` | Reptile Sunstone Flats | 21,9% | ❌ backdrop nhìn ngang |

Tranh nhìn từ trên xuống **không có dải đáy riêng** vì cả tấm đã là đất. Tranh nhìn ngang thì có
một dải sàn mỏng 5–22% ở đáy, phần còn lại là trời/núi/tường cây. Lúc đo là **6 trên 8 map sai
phép chiếu**; Werebear Woods đã dựng lại xong, còn **5 map**.

Nặng nhất là `tuongduong` — Sapidae Chiefdom là **thành an toàn**, mà nền hiện tại là trời xanh,
mây, dãy núi xa và một thị trấn nằm ở đường chân trời.

---

## 2. Đã thử cứu bằng art có sẵn — hỏng, và hỏng ở đâu

Ghi lại để không ai làm lại vòng này.

**Vét lại kho Axie.** Ba đợt khảo sát trước kết luận `PvE/Backgrounds` là "backdrop thẻ bài, không
phải art thế giới nhìn từ trên xuống" — nhưng các đợt ấy chỉ mở `class/*`. Hai thư mục `story/` và
`events/arena/` thì **tách LỚP**, và trong đó có thứ ba đợt trước bỏ sót:

- **7 lớp `*_Ground.png`** — mặt đất vẽ rời (4-entrance, 5-crossroad, 6-river, 7-deep-forest,
  8-temple, 9-rocky-mountain-1, và `13_GROUND` màu đá đỏ)
- **~12 vật thể cắt sẵn alpha** — `5_TREE1/2/3`, `10_TREE2`, `7/8/9/10_ROCK`, `8_TEMPLE`,
  `13_STATUE` (tượng xương gắn kiếm), `6_WATER`

Nghe thì đúng thứ cần. Nướng thử **ba lần**, cả ba đều hỏng, mỗi lần một lý do khác:

| Lần | Cách làm | Hỏng thế nào | Vì sao |
|---|---|---|---|
| 1 | Cắt dải đất → ép vuông → nối liền bằng cửa sổ tam giác | **Sọc ngang** chạy khắp map + mắt lưới lặp đều | Dải `_Ground` sáng dần từ xa về gần — đó là ÁNH SÁNG chứ không phải chất liệu; ép vuông thì thành sọc. Cửa sổ tam giác trộn hai bản ở khắp ô, đè bóng ma thành lưới. |
| 2 | Thêm bước san phẳng ánh sáng theo dọc + cửa sổ đỉnh bằng | Hết sọc, hết lưới — nhưng ra **mảng màu phẳng** | Phóng một dải cao 300px lên 1024² không sinh thêm chi tiết, chỉ kéo giãn thứ đã mờ. |
| 3 | Cắt vuông ở **cỡ gốc** (200–245px), không phóng | Vẫn gần như một mảng màu, và lặp dày | Tranh gốc vẽ mềm, ở cỡ đó không còn tần số cao nào để giữ. |

**Kết luận đo được:** dải sàn ở đáy 6 tấm nền hiện tại là **màu phẳng** (sàn sân khấu 2D), không
phải chất liệu đất — không cắt lại được. Và lớp `_Ground` của kho Axie là mặt đất vẽ theo phối
cảnh cho một sân khấu nhìn ngang, **không lát kín được một thế giới**. Hướng lát nền chết ở đây.

**Còn dùng được:** ~12 vật thể cắt sẵn alpha ở trên vẫn tốt, và lắp thẳng vào lớp `vatTo` sẵn có
(đã sắp theo CHÂN `y+h`, dùng cho Lò Rèn ở Quảng Trường Cũ). Đó là việc để dành sau khi có nền.

---

## 3. Ràng buộc cứng — tranh sinh ra phải vừa cái máy này

Đây là phần quan trọng nhất của tài liệu. Tranh đẹp mà phạm một mục dưới đây là tranh bỏ.

### 3.1 Khổ và phép chiếu

- Khổ thế giới **2600×1900** (tỉ lệ 1,368). Sinh ở tỉ lệ này, hoặc rộng hơn rồi cắt.
- **Isometric thật**, kim cương 2:1, một góc máy duy nhất cho cả tấm. Không phối cảnh một điểm tụ,
  không đường chân trời, **không trời**.
- Nhân vật đứng thẳng, thân vẽ ra cao **~95px** trong toạ độ thế giới. Mọi thứ trong tranh phải
  đúng thang đó: một cái cây cao 6 thân người thì vẽ ~570px.

### 3.2 Sàn đi được — chỗ 6 map cũ sẽ chết nếu chép y Quảng Trường Cũ

Đo đa giác `diTrong` của Quảng Trường Cũ: **23 đỉnh, 540.625px², bằng 10,9% khổ map**, hộp bao
1495×625px — vừa đúng 15×6 thân người. Đó là một cái sân. Đủ cho thành an toàn 10 NPC, không đánh
nhau.

Map hoang dã hiện đang đi được **61–91%** khổ map, mỗi map cõng 11–25 điểm nội dung (3–4 bãi quái
nhiều cụm, **4 trùm vùng**, cổng, NPC, rương, thảo dược). **Một tranh diorama chỉ chừa 11% sàn
sẽ không đủ chỗ đặt bãi quái** — cả hệ `vung` (miền dân số) sập theo.

> ⚠ **Số cũ ở đây là 60% và nó SAI VÌ THIẾU.** Bản đo đầu tiên chỉ đọc mảng `mobs`, mà trùm
> vùng thì không nằm trong đó — chúng ở bảng riêng `BOSS_DEFS`, toạ độ khai theo TỈ LỆ khổ map.
> Bỏ sót cả 29 con. Tính lại với bán kính 420px quanh mỗi trùm (tầm đuổi 260 + lề) thì sàn bắt
> buộc trống của map hoang dã là **72–89%**, không phải 58–76%.
>
> **Luật: mỗi map hoang dã phải chừa ≥ 75% khung là mặt đất trống, đi được, liền một khối.**
> Nhà cửa, vách đá, rừng rậm chỉ được đứng ở VÀNH ngoài để bịt mép map — không cắt đôi mặt sàn.
> Thành an toàn (`tuongduong`) thì ngược lại, được phép chật như Quảng Trường Cũ.

### 3.3 Nền đất phải liền tới mép, có bệ đất

Thứ khiến Quảng Trường Cũ "đứng trên đất" là **cái bệ**: khối đất-đá dày nhìn thấy được ở dưới,
lộ vân địa tầng ở rìa. Người xem đọc ra ngay đây là một khối đất có bề dày. Giữ đúng thủ pháp đó.

Ngoài bệ là **nền gần đen** (`#1a171e`, chiếm 44% khổ tranh Quảng Trường Cũ). Không sao — `diTrong`
chặn hết phần đó, người chơi không bao giờ bước tới.

### 3.4 Bốn mép phải có chỗ đặt cổng

Chuỗi map nối nhau bằng lối rìa. Mỗi map cần **ít nhất hai mép** có một khoảng đất trống rộng
≥ 300px chạm tới rìa sàn, để đặt cổng và điểm tới. Luật sẵn có (`test_bossplace`): điểm tới phải
cách Trùm Vùng **≥ 700px**. Đừng dồn hết chỗ trống vào giữa.

### 3.5 Đừng vẽ sẵn thứ máy tự vẽ

Cây, đá, quái, NPC, rương, hiệu ứng — **máy vẽ đè lên nền**. Vẽ sẵn vào tranh thì nhân vật sẽ đi
xuyên qua chúng. Chỉ vẽ vào tranh những thứ **không bao giờ đi qua được** và nằm ở vành ngoài.

---

## 4. Khối phong cách dùng chung — NEO VÀO AXIE, KHÔNG NEO VÀO QUẢNG TRƯỜNG CŨ

⚠ **Bản đầu tài liệu này neo phong cách vào `bg_quangtruong.jpg`. Đó là sai nếu muốn chất Axie**
— tấm ấy là diorama trung cổ châu Âu, và đo ra thì nó nằm ở đầu đối nghịch với Axie:

| tranh | bão hoà | độ sáng | 5 màu chính |
|---|--:|--:|---|
| `bg_daohoa` (Axie, nhìn từ trên xuống ✅) | **0,47** | 0,60 | `#629e88` `#446224` `#8bab67` `#bdcf98` `#62957d` |
| `bg_comoc` (Axie, nhìn từ trên xuống ✅) | **0,47** | 0,50 | `#779071` `#416328` `#668e54` `#33462b` `#abbf8f` |
| `bg_quangtruong` (trung cổ) | 0,23 | 0,27 | `#282221` `#493f37` `#3c322d` `#584d46` `#362926` |

Axie **đậm gấp đôi và sáng gấp đôi**. Đưa `bg_quangtruong` làm ảnh mẫu rồi bảo model "vẽ cho ra
chất Axie" là ra lệnh cho nó cãi chính ảnh mẫu.

**Neo đúng: dùng `bg_daohoa.jpg` và `bg_comoc.jpg` làm ảnh mẫu phong cách.** Hai tấm ấy vừa là
tranh Axie chính chủ, vừa đã đo ra ĐÚNG phép chiếu (dải đáy 2,9% và 0% — xem §1), vừa đang chạy
trong game. Không phải đi tìm đâu xa.

Còn giữ lại từ Quảng Trường Cũ đúng **một** thứ, và nó không thuộc về màu sắc: **cái bệ đất** —
khối đất-đá dày lộ vân địa tầng ở rìa (§3.3). Đó là thủ pháp khiến người xem đọc ra "mặt đất có
bề dày", và nó ghép được với bảng màu Axie.

### Bố cục kiểu Axie — rút từ hai tấm trên

- **Đường đi là dải cong mềm màu kem**, uốn qua khung, không phải đường thẳng hay lưới ô vuông.
- **Cây cối là cụm tròn**, xếp thành chùm to nhỏ khác nhau, không phải hàng lối đều.
- **Mặt nước là mảng phẳng viền mềm**, màu lam-lục nhạt, có đảo nhỏ nổi lên.
- **Vật thể mốc thì to và ít** — một cây cổ thụ, một cổng đá — chứ không rải đều chi tiết vụn.
- **Không viền đen đậm.** Khối tách nhau bằng chênh sáng và chênh sắc, không bằng nét viền.
- **Bóng đổ nhẹ, mềm, một hướng.** Không có bóng cứng, không có tương phản gắt.

### Khối dán chung

> Hand-painted top-down diorama of one self-contained landmass, seen from directly above at a
> single fixed angle. No horizon, no sky, no vanishing point. Bright saturated palette with soft
> airbrushed volume and no hard outlines — rounded organic shapes, cream winding paths, clustered
> round foliage, soft-edged water. The land sits on a thick plinth of soil and layered rock so the
> ground reads as having real depth, surrounded by flat empty space. Readable when the whole
> diorama is seen at once. An adult figure standing on the ground is about 1/20 of the image
> height. No text, no UI, no frame, no watermark, no characters, no creatures.

**Vì sao "no characters, no creatures":** quái và NPC do máy vẽ đè, vẽ sẵn vào nền là có hai lớp
nhân vật chồng nhau.

---

## 5. Tám prompt

⚠ **Tám prompt dưới đây viết theo lối XẾP MỆNH ĐỀ DÀI và neo vào bảng màu trung cổ.** Hai điều
đó đều đã sửa ở chỗ khác: §4 đổi neo sang Axie, §5b giải thích vì sao meowa cấm lối viết dài.
Giữ mục này lại vì phần **NỘI DUNG từng map** (có gì, ở đâu, vì sao) vẫn đúng và vẫn cần —
nhưng khi dùng thì rút gọn theo khuôn §5c, đừng dán nguyên.

### 5.1 `bg_tuongduong.jpg` — Sapidae Chiefdom (thành an toàn) ⚠ ưu tiên 1

Đây là map hỏng nặng nhất và là thành an toàn, làm trước.

> …A fortified frontier settlement rebuilt around a tear in the world. A broad open stone-paved
> plaza at the centre, wide enough to hold a dozen standing figures with room to walk between them.
> Around the plaza rim: a blacksmith's forge with a lit furnace mouth, a low apothecary hut, a
> guarded gatehouse of fitted stone, market stalls under patched cloth awnings, timber-and-plaster
> houses with warm lamplight in the windows. Insect-folk architecture — chitinous curved beams,
> hexagonal window frames, hive-cell storage jars stacked along the walls. In one corner the
> ground is split by a thin luminous fissure, its light cold blue against the warm lamps. Muted
> earth palette, amber lamplight, one cold blue accent.

### 5.2 `bg_ngoai.jpg` — Beast Herd Camp (cấp 14–24, an toàn)

> …Open grazing steppe on a raised landmass, at least two thirds of the image is **flat walkable
> open grassland** with no obstruction. Around the rim: a beast-herder camp of round hide tents,
> stacked feed bales, a corral of split timber, and a few wind-bent trees. Wide bare earth
> approaches reach the rim on the north and east edges. The ground is faintly cracked and dusty as
> if it has been shaking. Warm dry-grass palette, ochre and olive, low evening light.

### 5.3 `bg_chungnam.jpg` — Werebear Woods (cấp 24–38, PK)

> …A forest clearing floor on a raised landmass. **The centre is a wide open floor of moss, leaf
> litter and bare packed earth** — at least two thirds of the image, unobstructed. Only at the rim:
> a dense ring of enormous old-growth trunks with shelf fungus climbing them, their canopy cut off
> above the frame so no sky is visible. A collapsed stone marker and a few toppled statue fragments
> lie near one edge. Deep green and blue-green palette, damp shaded light, small clusters of pale
> mushrooms glowing faintly.

### 5.4 `bg_comoc.jpg` — Bug Tribe Tunnels (cấp 42–56, PK)

> ⚠ Tấm hiện tại **đã đúng phép chiếu** — chỉ sinh lại nếu muốn đồng bộ phong cách với cả bộ.

> …A broken-open underground hive chamber seen from above, the roof sheared away. **The floor is a
> wide open expanse of packed grey earth and cracked chitin plating**, at least two thirds of the
> image, unobstructed. At the rim: honeycomb tunnel mouths bored into rock walls, abandoned egg
> sacs, ribbed insect-carved pillars holding up broken ceiling slabs. Cold grey-brown palette with
> sickly yellow-green light leaking from the tunnel mouths.

### 5.5 `bg_tuyettinh.jpg` — Bird Tribe Heights (cấp 62–78, PK)

> …A high windswept plateau on a raised landmass, its plinth edge showing bare frost-shattered
> rock. **The plateau top is a wide open field of packed snow and wind-scoured stone**, at least two
> thirds of the image, unobstructed. At the rim: stacked stone roosts and nesting platforms of
> lashed driftwood, tattered prayer banners on poles, a few dead frost-blackened trees. Pale palette
> — bone white, cold grey, one band of dull rose where low light catches the snow.

### 5.6 `bg_mongco.jpg` — Reptile Sunstone Flats (cấp 84–100, PK)

> …A wide sun-baked red rock flat on a raised landmass. **Almost the entire top surface is open
> walkable ground** — cracked red clay, drifted pale sand, flat slabs of sunstone. Only at the rim:
> low mesa walls, a scatter of standing stones, and dry scrub. A shallow dry riverbed cuts across
> one corner without blocking passage. Hot palette — burnt orange, rust red, bleached bone, the
> sunstone slabs faintly glowing amber from within.

### 5.7 `bg_nhanmon.jpg` — Dusk Marsh (cấp 102–120, free PK, map cuối)

> …A drowned marsh basin on a raised landmass, its plinth edge dripping and root-tangled. **The
> centre is a wide open expanse of firm mud flat and matted reed bed**, at least two thirds of the
> image, walkable and unobstructed. Shallow standing water is only at the rim, threaded with dead
> black trees and half-sunk stone ruins. Palette: deep violet-brown, drowned green, sick pale
> yellow reflections. A wide luminous fissure tears across the far rim, its cold light the brightest
> thing in the frame.

### 5.8 `bg_daohoa.jpg` — Plant Tribe Glade (cấp 1–12, map mở đầu)

> ⚠ Tấm hiện tại **đã đúng phép chiếu** — chỉ sinh lại nếu muốn đồng bộ phong cách với cả bộ.

> …A sheltered garden glade on a raised landmass, the plinth edge hung with trailing roots and
> flowering vines. **The centre is a wide open lawn of short cropped grass and soft earth paths**,
> at least two thirds of the image, unobstructed — this is the first map a new player ever walks
> on, so keep it generous and easy to read. At the rim: a hatchery of woven seed-pods, pumpkin
> rows, a low stone well, thorn hedges. Bright but soft palette — spring green, cream, pale pink
> blossom, one warm gold path threading through.

---

## 5b. Chạy bằng meowa — lệnh thật, và một chỗ tôi viết sai ở §5

⚠ **Prompt ở §5 viết theo lối XẾP MỆNH ĐỀ DÀI. meowa cấm đúng lối đó.** `SKILL.md` của họ ghi
thẳng: *"Do not use legacy diffusion-style prompt engineering: no long keyword stacks, separate
positive and negative prompt blocks, repeated quality terms… Start with the shortest sufficient
prompt, inspect the result, and add one necessary constraint at a time only when the output proves
it is needed."* Dùng meowa thì viết NGẮN, để hai ảnh tham chiếu gánh phần bố cục và phong cách.
Prompt §5 vẫn dùng được cho đường gọi Gemini trực tiếp.

**meowa chạy cảnh lớn bằng chính Nano Banana Pro.** Tra trong `meowart_api.py`: lệnh
`nano-banana-run` phơi `--model` với ba lựa chọn, trong đó có `gemini-3-pro-image`. Nên đi qua
meowa không đổi model — đổi chỗ quản tài khoản, tín dụng và vòng chờ việc.

### Cài một lần

```bash
git clone https://github.com/Meowa-AI/meowa-skills
cd meowa-skills && python3 -m pip install requests Pillow
export MEOWART_API_KEY="ma_live_..."        # lấy ở meowa.ai → API Keys
python3 skills/game-assets/meowart_api.py credits-balance
```

⚠ Khoá chỉ để trong biến môi trường hoặc `.env` đã ignore. Đừng dán vào prompt, tham số dòng
lệnh, ảnh chụp hay repo — runner cũng không nhận khoá qua tham số.

### Sinh một map

```bash
python3 skills/game-assets/meowart_api.py nano-banana-run \
  --prompt "<xem §5c>" \
  --reference-image docs/phac_map/phac_<map>_43.jpg \
  --reference-image public/game/assets/maps/bg_quangtruong.jpg \
  --model gemini-3-pro-image \
  --resolution 4K \
  --aspect-ratio 4:3 \
  --output-dir out/map_<map>
```

Vì sao từng tham số:

| | |
|---|---|
| `--reference-image` ①| bản phác bố cục — **đưa TRƯỚC**, nó là bản đồ chỉ chỗ nào phải trống |
| `--reference-image` ②| `bg_quangtruong.jpg` — mẫu phong cách, ánh sáng, bảng màu |
| `--aspect-ratio 4:3` | gần khổ 2600×1900 (1,368) nhất trong danh sách meowa nhận. Dùng bản phác `_43` đã đệm sẵn nền lên 2600×1950 để bố cục không bị bóp lệch; sinh xong cắt 50px là khít |
| `--resolution 4K` | 4K ở 4:3 ra ~4096×3072, thu về 2600 vẫn dư nét. 1K/2K sẽ mờ khi phóng lên khổ map |
| `--model gemini-3-pro-image` | Nano Banana Pro. Hai model `flash` rẻ hơn nhưng bám ảnh tham chiếu kém hơn |

Việc rớt mạng giữa chừng thì **đừng gửi lại** (đã trừ tín dụng) — lấy lại bằng
`nano-banana-poll --job-id <id> --output-dir <dir>`.

### Nếu sau này chuyển sang hệ ô lát

meowa mạnh hơn hẳn ở đây, và đó là thứ Nano Banana thô không có: `hd-isometric-gen-run` (mặt trên
744×372, footprint `standard` 1×1 hoặc `tetraploid` 2×2), `isometric-tileset-run`,
`isometric-texture-run`. Bắt buộc bắt đầu từ `map-reference-search` → `map-reference-download` rồi
mới sinh — các bộ sinh này có hợp đồng cỡ ô và neo tâm chặt, ảnh tuỳ tiện sẽ ra ô sai lưới.
Đổi sang hướng này thì phải viết bộ vẽ ô lát trong `game.js`, xem §3.2.

⚠ `side-scrolling-map-run` / `hd-side-scrolling-map-run` là bộ sinh nền **NHÌN NGANG** — nhiều
khả năng chính là thứ đã tạo ra 6 tấm nền hỏng hiện tại. Đừng gọi nhầm.

---

## 5c. Prompt mẫu — map đầu tiên

**Làm `chungnam` (Werebear Woods) trước, không phải `tuongduong`.** Lý do đo được, không phải
sở thích: hai ảnh mẫu Axie đang có đều là **thiên nhiên**, không có kiến trúc nào. Sapidae
Chiefdom là một cái THÀNH — tức là đúng trường hợp ảnh mẫu yếu nhất. Werebear Woods là rừng, và
`bg_comoc` cũng là rừng nhìn từ trên xuống, cùng chủ đề nên chuyển phong cách có cơ hội cao nhất.
Chốt được phong cách ở tấm rừng rồi hãy làm thành.

> ⚠ **BÀI HỌC TỪ LƯỢT SINH ĐẦU TIÊN — mặt nạ có màu lạ thì model dịch màu ấy thành VẬT LIỆU.**
> Bản mặt nạ đầu tô lối ra bằng **xanh dương** (ý là "lối phải thông ra mép") và tô vòng đấu
> trường bằng **đỏ**. Model đọc xanh dương là **NƯỚC**: bốn lối ra thành bốn con sông **cắt hòn
> đảo thành 5-6 mảnh rời**, và sàn đi được liền khối co lại còn khoảng một phần tư khung.
> Tấm ra nhìn đẹp, nhưng lắp vào là map vỡ vụn.
>
> Sửa ở gốc: `phac_bocuc.py` nay xuất thêm bản **`_sach`** chỉ có **ba tông** — ngoài / vành /
> sàn. Lối ra KHÔNG phải một màu riêng nữa, nó là **chính vùng sàn kéo dài chạm tới mép**.
> Bản có chú giải (xanh, đỏ) chỉ để NGƯỜI đọc, đừng bao giờ đưa cho model.

**Hai ảnh tham chiếu, đúng thứ tự:**

| | |
|---|---|
| ① `docs/phac_map/phac_chungnam_sach_43.jpg` | bản đồ bố cục **bản sạch** — sáng là sàn phải để trống (82,1%), nâu là chỗ được dựng cây/đá, hết. |
| ② `public/game/assets/maps/bg_comoc.jpg` | mẫu phong cách Axie — rừng nhìn từ trên xuống, bão hoà 0,47 |

**Prompt** (ngắn, đúng luật meowa ở §5b):

> Top-down diorama of a forest clearing on one landmass, seen from directly above. Use the first
> reference as a layout map: the pale area is one single connected clearing of open mossy ground
> and leaf litter, unbroken, reaching the edge of the land in several places; only the dark brown
> rim holds tall things — clustered round tree canopies, a few toppled stone markers, thorn scrub.
> No river or water crosses the clearing. The land sits on a thick plinth of soil and rock,
> surrounded by flat empty space. No sky, no horizon, no characters. Match the painting style and
> palette of the second reference.

⚠ **Độ phân giải phải ≥ 2600 rộng.** Lượt đầu ra 1024×768 — đó là mức mặc định `1K`, phóng lên
khổ map 2600×1900 sẽ nhoè. Qua meowa thì `--resolution 4K`; qua giao diện Gemini thì chọn mức
lớn nhất. Đây là nửa còn lại của cảm giác "nhỏ quá": một nửa do sông cắt vụn sàn, một nửa do ảnh
bé hơn khổ map 2,5 lần.

**Nếu tấm sau vẫn chưa đạt, sửa ĐÚNG MỘT ràng buộc mỗi lần**, theo thứ tự hay hỏng nhất:

1. Cây mọc vào giữa sàn → thêm *"Keep the pale area completely free of trees."*
2. Sàn vẫn bị chia cắt → *"The clearing is one unbroken piece from edge to edge."*
3. Hiện ra trời hoặc chân trời → *"The camera looks straight down; no sky is visible anywhere."*
4. Màu tối/xám đi → **bớt** chữ trong prompt, đừng thêm; để ảnh tham chiếu ② nói.
5. Ra viền đen kiểu hoạt hình → *"No black outlines; separate shapes by value and hue only."*

### Rồi mới tới `tuongduong` — và nó cần thêm một ảnh mẫu

Thành Sapidae Chiefdom không có ảnh mẫu kiến trúc Axie nào trong repo. Khảo sát Drive từng ghi
nhận hai tấm **"Reptile Village"** và **"Garuda Village"** (xem `docs/ASSET_SOURCING.md`) nhưng
chưa lấy về. Trước khi làm thành, kéo một trong hai tấm ấy về làm ảnh tham chiếu thứ ba — nếu
không thì model phải tự bịa kiến trúc, và đó là chỗ dễ trôi khỏi chất Axie nhất.

---

## 6. Lắp một map mới vào game — công thức Quảng Trường Cũ

Khi có tranh, việc lắp là cơ học. Làm đúng thứ tự này:

1. **Đặt tranh vào khổ.** Cắt sát nội dung, phóng cho khớp thang nhân vật ~95px, dán vào canvas
   2600×1900. (Quảng Trường Cũ: cắt `(103,0)-(1593,1238)` rồi ×1,5347.) Ghi `bg_<map>.jpg` vào
   `MAP_BG_SRC` trong `game.js` — nếu tên map đã có sẵn thì không phải sửa gì.
2. **Chấm đa giác `diTrong`.** Bật chế độ chấm sẵn có trong game (`vung` — chấm theo VÒNG, cùng
   chiều), đi men theo mép sàn đi được, rồi dán mảng toạ độ vào `MAPS.<map>.diTrong` trong
   `data/canbang.js`. **Mọi điểm ngoài đa giác tự động bị chặn** — không phải khai từng khối cản.
   Đây là chỗ giết cảm giác "đi trên không trung": người chơi không bước ra khỏi mặt đất được nữa.
3. **Vật thể rời** (nếu có công trình cần nhân vật đi vòng ra sau): thêm vào `MAPS.<map>.vatTo`
   dạng `{img, x, y, w, h}` và khai đường dẫn ở `MAP_VAT_SRC`. Lớp này **sắp theo CHÂN** (`y+h`)
   trong chính danh sách `ents` — đứng dưới thì che, đứng trên thì bị che, không cần tầng vẽ mới.
4. **Kéo lại `spawn`, `vung`, cổng, NPC** cho nằm trong đa giác mới.
5. **Chạy bài kiểm.** `test_quangtruong.js` là mẫu: 8 hướng đi ra đều phải nằm trong `diTrong`,
   khối cản chặn thật, mọi NPC/cổng đứng được, điểm thả đi bộ tới được cổng. Cộng
   `test_domap` · `test_noimap` · `test_bossplace` · `test_nhacnen`.

**Bẫy đã dẫm phải, đừng dẫm lại:**
- Cổng tên bắt đầu bằng `"Lối "` bị `test_noimap` coi là lối rìa hoang dã và bắt điểm tới phải
  cách mép map < 400px. Cổng trong thành thì đặt tên `"Cổng …"`.
- `newPlayer()` từng ghim cứng toạ độ điểm thả và đẻ nhân vật **vào trong giếng**. Điểm thả phải
  đọc từ chính `MAPS[map].spawn` rồi lọc qua `nearestFree()`.
- Cổng đã vẽ sẵn trên tranh thì bật cờ `anGiau` — bỏ sprite, bỏ lửa, bỏ chữ, giữ nguyên vùng chạm.


---

## 7. Map đầu tiên đã dựng lại — những gì học được mà 6 mục trên không đoán ra

Werebear Woods (`chungnam`) thay tranh, và bản sao của chính tranh ấy mở thêm một map mới
`corran` (Rẻo Rừng Corran, C38-42) để thử nghiệm mà không đụng vào map đang chạy.

### 7.1 Bản CẮT CẬN thắng bản TRỌN ĐẢO

Vòng đầu tôi xin model vẽ trọn một hòn đảo nằm giữa khung. Kết quả nhìn đẹp nhưng **lắp không
được**: mép đảo là vực, mà cổng nối map phải nằm sát mép khổ (§3.4) — nên bốn cổng đều rơi xuống
vực. Bản dùng được là bản **cắt cận**: khung là một khoảnh rừng, đất chạy chạm cả bốn mép khổ,
chỗ nào cũng đứng được. Prompt ở §5 vì thế phải nói rõ *"a cropped view, ground reaching all four
edges"*, không phải *"an island"*.

### 7.2 Máy KHÔNG đọc tranh để chặn đường — nên phải suy vật cản RA khỏi tranh

`cham_map.py` đã ghi lại bài học này ở dạng phủ định (ba phép thống kê tự chế, ba lần hỏng). Mặt
tích cực của nó là `tools/can_tu_tranh.py`: đọc tranh, tìm hai lớp vật liệu, sinh thẳng ra bảng
`MAP_OBSTACLES`.

    python3 tools/can_tu_tranh.py public/game/assets/maps/bg_corran.jpg corran --soi /tmp/soi.png

Vì sao phép đo này chạy được trong khi ba phép kia hỏng: ba phép kia hỏi câu **ngữ nghĩa** ("tranh
này nhìn từ trên xuống hay nhìn ngang"), còn phép này hỏi câu **vật liệu cục bộ** ("điểm này là
tán lá hay mặt đất") — và câu sau kiểm lại được bằng mắt qua ảnh `--soi`.

Ba luật hình học nằm trong đầu tệp công cụ. Luật thứ tư học từ chính map này:

**Khối tối chặn KÍN, không chặn mỗi chân.** Luật ① nói ellipse đặt ở chân vệt lá, chừa chỗ đi ra
sau cây — đúng cho bụi và vòm lá. Nhưng gốc cổ thụ thì không: engine vẽ tranh nền trước rồi vẽ
nhân vật đè lên, **không sắp lớp theo trục y**. Nên đứng "sau" gốc cổ thụ hiện ra y hệt đứng
"trên" nó. Chừa chỗ đi ra sau chỉ đổi một lỗi nhìn thấy lấy một lỗi nhìn thấy khác. Lớp khối tối
vì thế xuất ra **chữ nhật trùm kín bóng khối**. Ngày nào có lớp vật thể tiền cảnh sắp theo y thì
quay lại luật ①.

Số đo trên `corran`: 62 vật cản (54 ellipse tán lá + 8 chữ nhật khối tối), phủ 15,3% khổ map,
để lại **77,4% sàn đi được và liền một khối** (loang nước từ điểm thả tới 9556/9557 ô lưới 20px).

### 7.3 Cổng phải né dải nền tối ngoài khối đất

Dải tối chạy dọc mép trái tranh (x = 7…133) là *ngoài* khoảnh đất, và lớp khối tối chặn nó lại —
đúng như phải thế. Cổng Tây ban đầu đặt ở x = 120 nên nằm luôn trong đó, không ai với tới. Đã dời
ra x = 175. Khi dựng map sau, **đặt cổng xong thì chạy lại `can_tu_tranh.py` rồi kiểm cổng có bị
trùm không**, đừng làm ngược lại.

### 7.4 Còn một lỗi chưa chữa

Cổng torii sơn đỏ bị lớp tán lá nhận nhầm (gỗ sơn đỏ trong bóng có cùng bão hoà với lá), nên lòng
cổng bị chặn. Đây là vật trang trí, đi vòng được. Tôi **không** thêm phép đo thứ tư để chữa —
`cham_map.py` ghi rõ vì sao chế thêm phép thống kê là đường đã hỏng ba lần.
