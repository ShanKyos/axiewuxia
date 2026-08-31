# Vùng Elderbough — rừng cổ thụ, dải cấp 38–44

Vùng đầu tiên trong đợt "thêm thị trấn". Chuẩn thiết kế lấy từ map rừng elf của MU Online
(rừng nguyên sinh + thị trấn gỗ trên thân cây). **Tên hiện ra cho người chơi là tên riêng của
game** — Luật 2 trong CLAUDE.md cấm mọi danh từ riêng của MU lọt vào text người chơi thấy.

## 1. Vì sao là vùng này

Thang cấp hiện thủng ba chỗ: **38–42**, 56–62, 78–84. Elderbough lấp chỗ đầu tiên, chen giữa
Thornwood Reach (24–38) và Hollow Roost (42–56).

Nhưng lý do chính không phải lỗ thủng cấp. Game hiện có **một hub duy nhất** (Lunaris City) và
đúng **2 NPC** trong bảng `NPCS`. Đi từ cấp 1 tới 120 mà chưa bao giờ đổi "nhà" — đó là chỗ mất
cảm giác hành trình so với MU, nơi Lorencia/Noria/Devias/Atlans mỗi cái là một quê mới.

## 2. Định danh

| | |
|---|---|
| id map | `elderbough` |
| Tên hiện ra | **Elderbough Canopy** |
| Thị trấn | **Elderbough** (khu an toàn trong lòng map, không spawn quái) |
| `min` | 36 |
| `range` | `38 - 44` |
| `type` | `safe` (không PK — vẫn là vùng tầm trung, PK bắt đầu từ Hollow Roost) |
| Vào từ | Thornwood Reach (cổng Bắc) · Lunaris City (Bản đồ M) |

Tên bám hệ danh pháp sẵn có (Thornwood, Petalshade, Frostmire, Ashen, Stormgate) và ăn khớp với
hệ **Verdant** vừa đặt cho nguyên tố Mộc.

## 3. Bố cục — thị trấn nằm GIỮA, bãi săn toả ra

Khác mọi map hiện có (spawn ở rìa, quái toả dần ra xa). Elderbough đảo lại: **thị trấn ở giữa**,
ba nhánh bãi săn toả ra ba hướng, mỗi nhánh một bậc khó. Đây là bố cục thị trấn của MU và là thứ
làm người chơi thấy mình "có nhà" chứ không phải đi ngang qua.

```
            ┌── nhánh Bắc: bậc khó nhất, dẫn tới boss vùng
            │
   nhánh Tây ── [ THỊ TRẤN ELDERBOUGH ] ── nhánh Đông
   (bậc thấp)      thợ rèn · thuốc          (bậc trung)
                   suối hồi phục
```

- **Thị trấn**: bán kính an toàn quanh tâm map. Không quái, không PK. Có suối hồi phục
  (`spring:true`) như Petalshade Isle.
- **Nhánh Tây (38–40)**: bãi thoáng, quái đơn lẻ — chỗ người mới lên 38 làm quen.
- **Nhánh Đông (40–42)**: cụm dày hơn, có 1 cụm tinh anh.
- **Nhánh Bắc (42–44)**: rễ cây khổng lồ chắn lối, dẫn tới Vệ Binh Trụ của vùng.

## 4. Môi trường

| | |
|---|---|
| `ground` | `#3f5a3a` — nền rêu sẫm |
| `patch` | `#6a8a4a` — vệt cỏ sáng hơn |
| `trees` | 90 (dày nhất trong các map — đây là rừng nguyên sinh) |
| `rocks` | 18 (ít đá, nhiều rễ) |
| `herbs` | có |
| `spring` | có (trong thị trấn) |
| Hạt môi trường | `leaf` màu `#9ad86a` — lá rơi lọt tán, n=18 |
| Thời tiết hợp | mưa phùn (`drizzle`) ăn rất hợp với rừng |

## 5. Nối vào 12 bảng khoá theo id map

Thêm một map KHÔNG chỉ là thêm một mục vào `MAPS`. Danh sách phải chạm:

| Bảng | Việc |
|---|---|
| `MAPS` | mục `elderbough` + `spawnFrom` |
| `MAPS.chungnam.spawnFrom` | đường ngược lại từ Thornwood Reach |
| `MAP_BG_SRC` | `bg_elderbough.jpg` — xem §7 |
| `MAP_AMBIENT` | lá rơi |
| `BGM_TRACKS` | tạm dùng nhạc map rừng sẵn có |
| `HERB_SPOTS` | 5–6 điểm thảo dược |
| `BOSS_DEFS` | Vệ Binh Trụ + Cổng Vực của vùng |
| `SECT_HOOK_MAP` | map "chạm nhà" của Sylvan Ranger (+5% ST) |
| `GOLDEN_FIELD` + `GOLDEN_BOX` | thêm vào vòng Xâm Lăng Vàng, bậc hạp 2 |
| `RIFT_FIELD` | thêm vào danh sách bãi săn của Chúa Tể Vực Nứt |
| `MATON_HA` | thêm vào vòng Hung Thần Giáng Thế |
| `TRUYNA_BANDS` | mục tiêu Truy Nã cho dải 38–44 |
| `NPCS` | thợ rèn phụ + tiệm thuốc của thị trấn |

## 6. Quái

Dùng lại quái sẵn có theo dải cấp (không vẽ quái mới đợt này): `phando` (lv26), `xanu` (lv31),
`bandao` (lv38, tinh anh), `thinu` (lv42). Cụm xếp theo ba nhánh ở §3.

## 7. Tranh nền — bản mô tả để đặt hàng

Ảnh cần: **2048 × 1536 (4:3), JPG**, đặt tại `public/game/assets/maps/bg_elderbough.jpg`.

Kỹ thuật bắt buộc, bám đúng 8 tranh sẵn có (xem `bg_chungnam.jpg` làm mẫu gần nhất):
- Là **phông nền phẳng** nhìn ngang, KHÔNG phải bản đồ nhìn từ trên xuống.
- Tô mảng phẳng kiểu gouache, viền mềm, **không** đổ bóng thực, **không** vân chi tiết.
- Bảng màu **trầm và đục** — tranh sẽ bị vẽ đè bởi nhân vật, quái và chữ; nền sáng rực làm
  mất hết độ đọc.
- **Đáy ảnh phải là một dải nền đất đặc màu phẳng, cao khoảng 12–15% chiều cao ảnh**, ngăn cách
  với phần trên bằng một đường ngang gãy. Đây là chỗ nhân vật đứng.
- Không có nhân vật, không có sinh vật lớn, không có chữ.

Nội dung: rừng nguyên sinh, thân cây cổ thụ khổng lồ chạy suốt chiều cao ảnh, rễ nổi cuộn ở
chân. Trên thân cây có **nhà gỗ và cầu treo** — nhỏ, ở xa, mờ dần vào tán lá, chỉ đủ để hiểu
"có người sống ở đây". Vài chùm nắng lọt qua tán. Nấm và hoa dại tím ở gốc. Tông chủ đạo xanh
rêu và xanh lục sẫm, điểm vàng ấm ở chùm nắng.

**Nếu chưa có ảnh:** map vẫn chạy được. `MAP_BG[curMap]` thiếu thì hàm vẽ tự bỏ qua, nền lấy
theo `ground`/`patch` + cây/đá/cỏ vẽ bằng code. Map nhìn phẳng hơn, không crash.

## 8. Chưa làm đợt này

- Vùng thứ hai (cao nguyên tuyết, dải 78–84) — chờ duyệt vùng này trước.
- Quái vẽ riêng cho vùng.
- Phó bản `pb_elderbough`.
