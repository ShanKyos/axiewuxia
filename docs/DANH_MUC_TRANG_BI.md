# Danh mục trang bị — bám quy mô MU Season 1

> Trạng thái: **bản đề xuất, chờ duyệt.** Chưa viết dòng code nào.
> Duyệt xong mới vẽ 6 mẫu, mẫu được duyệt mới vẽ nốt phần còn lại.

## 1. Nguyên tắc

**Khoá cứng theo lớp.** Kiếm chỉ Dark Knight cầm, gậy chỉ Dark Wizard, cung chỉ Sylvan Ranger.
Nhặt được đồ lớp khác thì bán hoặc ném vào Lò Hỗn Loạn — đúng MU, và đúng hướng "hard" đã chọn.
Giáp vốn đã theo lớp sẵn (25 bộ trong `HERO_SETS`), nên chỉ vũ khí là luật mới.

**Danh mục vật phẩm CHÍNH LÀ 25 bộ đang vẽ trên người.** Hiện `HERO_SETS` quyết định hình vẽ
trên nhân vật, còn món trong túi thì chỉ biết `ô + phẩm`, không biết mình thuộc bộ nào — hai bên
rời nhau. Nối lại thì món bạn mặc đúng bằng hình bạn thấy trên người.

**Tên.** Không tên riêng MU (Quy tắc số 2 — `Kundun`, `Lorencia`, `Devias`, `Icarus`, `Atlans`,
`Tarkan`, `Fairy Elf`, `Magic Gladiator`, `Devil Square`, `Blood Castle`…) và không binh khí
kiếm hiệp (Quy tắc số 1). Tên giáp ghép máy móc kiểu MU: `<tên bộ>` × 5 danh từ ô.

## 2. Nấc giáp — 25 bộ × 5 món = 125 món

5 dải mỗi lớp, khoá theo giai 1/3/5/7/9 → **cấp 1 / 21 / 41 / 61 / 81**.

| Lớp | I · Lv1 | II · Lv21 | III · Lv41 | IV · Lv61 | **V · Lv81 (nấc đỉnh)** |
|---|---|---|---|---|---|
| Dark Knight | Thiết Vệ | Giáp Xích | Hắc Giáp | Vảy Rồng | **Hỏa Long** |
| Dark Wizard | Vải Thô | Da Thú | Nhân Sư | Ma Thuật | **Hư Vô** |
| Sylvan Ranger | Da Rừng | Lá Thép | Vỏ Sồi | Lông Ưng | **Đại Bàng Trắng** |
| Spellblade | Bán Giáp | Giáp Lệch | Than Hồng | Lửa Dữ | **Hoả Ngục** |
| Dark Lord | Lệnh Giáp | Cận Vệ | Vương Giáp | Bạo Chúa | **Ngai Đen** |

Mỗi bộ 5 món, tên ghép sẵn — không phải nghĩ 125 cái tên:

| ô | mẫu tên | ví dụ (bộ Hỏa Long) |
|---|---|---|
| non | Mũ Trụ ~ | Mũ Trụ Hỏa Long |
| ao | Giáp ~ | Giáp Hỏa Long |
| tay | Găng ~ | Găng Hỏa Long |
| quan | Giáp Đùi ~ | Giáp Đùi Hỏa Long |
| chan | Ủng ~ | Ủng Hỏa Long |

**Nấc đỉnh (dải V)** là ô tương đương "đồ Kundun": chỉ rơi từ trùm cuối, không mua, không chế.
Tên phải là của mình — cấu trúc thì giữ nguyên.

## 3. Vũ khí — 5 lớp × 3 dòng × 5 nấc = 75 món

Ba **dòng** mỗi lớp để trong cùng một nấc vẫn có lựa chọn, đúng kiểu MU (cùng bracket nhưng
khác tốc/sát thương), chứ không phải leo một đường thẳng.

### Dark Knight — cận chiến nặng
| dòng | Lv1 | Lv21 | Lv41 | Lv61 | Lv81 |
|---|---|---|---|---|---|
| Kiếm · cân bằng | Kiếm Đồng | Kiếm Sắt | Trọng Kiếm Thép | Kiếm Vảy Rồng | **Kiếm Hỏa Long** |
| Rìu · sát thương cao, chậm | Rìu Thợ Rừng | Rìu Chiến | Rìu Song Nguyệt | Rìu Vảy Rồng | **Rìu Hỏa Long** |
| Chùy · phá giáp | Chùy Đinh | Chùy Gai | Chùy Thép Nặng | Chùy Vảy Rồng | **Chùy Hỏa Long** |

### Dark Wizard — gậy, đánh xa (range 420)
| dòng | Lv1 | Lv21 | Lv41 | Lv61 | Lv81 |
|---|---|---|---|---|---|
| Gậy · sát thương phép | Gậy Gỗ | Gậy Xương | Gậy Nhân Sư | Gậy Ma Thuật | **Gậy Hư Vô** |
| Quyền trượng · tốc niệm | Trượng Đồng | Trượng Bạc | Trượng Pha Lê | Trượng Ma Thuật | **Trượng Hư Vô** |
| Tinh trượng · bạo kích | Trượng Đá Lửa | Trượng Rắn | Trượng Mắt Quỷ | Trượng Tinh Vân | **Trượng Hắc Nguyệt** |

### Sylvan Ranger — cung/nỏ, đánh xa (range 380)
| dòng | Lv1 | Lv21 | Lv41 | Lv61 | Lv81 |
|---|---|---|---|---|---|
| Cung ngắn · bắn nhanh | Cung Gỗ | Cung Sừng | Cung Vỏ Sồi | Cung Lông Ưng | **Cung Đại Bàng** |
| Trường cung · tầm xa | Trường Cung Thô | Trường Cung Thép | Trường Cung Bạc | Trường Cung Lông Ưng | **Trường Cung Bạch Vũ** |
| Nỏ · nặng, xuyên giáp | Nỏ Tay | Nỏ Chiến | Nỏ Thép | Nỏ Ưng Vương | **Nỏ Bạch Vũ** |

### Spellblade — kiếm lai phép
| dòng | Lv1 | Lv21 | Lv41 | Lv61 | Lv81 |
|---|---|---|---|---|---|
| Song đao · nhanh | Song Đao Thô | Song Đao Sắt | Song Đao Than Hồng | Song Đao Lửa Dữ | **Song Đao Hoả Ngục** |
| Đại kiếm · nặng | Đại Kiếm Sắt | Đại Kiếm Thép | Đại Kiếm Nung Đỏ | Đại Kiếm Lửa Dữ | **Đại Kiếm Hoả Ngục** |
| Ma kiếm · lai phép | Kiếm Khắc Ấn | Kiếm Bùa Chú | Kiếm Tro Tàn | Ma Kiếm Lửa Dữ | **Ma Kiếm Hoả Ngục** |

### Dark Lord — nghi lễ, chỉ huy
| dòng | Lv1 | Lv21 | Lv41 | Lv61 | Lv81 |
|---|---|---|---|---|---|
| Lệnh trượng · chỉ huy | Lệnh Trượng Gỗ | Lệnh Trượng Đồng | Lệnh Trượng Vương Giả | Lệnh Trượng Bạo Chúa | **Lệnh Trượng Ngai Đen** |
| Búa nghi lễ · nặng | Búa Nghi Lễ | Búa Cận Vệ | Búa Vương Triều | Búa Bạo Chúa | **Búa Ngai Đen** |
| Kích · tầm với | Kích Ngắn | Kích Cận Vệ | Kích Vương Triều | Kích Bạo Chúa | **Kích Ngai Đen** |

## 4. Phụ kiện — 15 món, KHÔNG khoá lớp

Dây chuyền và nhẫn trong MU ai đeo cũng được. Giữ nguyên 15 tên đã đặt, gán vào 5 nấc:

| ô | Lv1 | Lv21 | Lv41 | Lv61 | Lv81 |
|---|---|---|---|---|---|
| daychuyen | Dây Chuyền Đồng | Dây Chuyền Bạc | Dây Chuyền Ngọc Lam | Dây Chuyền Hồng Ngọc | Dây Chuyền Tinh Vân |
| nhan1 | Nhẫn Đồng | Nhẫn Bạc | Nhẫn Ngọc Lục | Nhẫn Hắc Kim | Nhẫn Tinh Vân |
| nhan2 | Nhẫn Thô Sơ | Nhẫn Chạm Khắc | Nhẫn Cổ Ngữ | Nhẫn Phong Ấn | Nhẫn Vĩnh Hằng |

## 5. Tổng số phải vẽ

| nhóm | số món |
|---|---|
| Giáp (25 bộ × 5) | 125 |
| Vũ khí (5 lớp × 3 dòng × 5 nấc) | 75 |
| Phụ kiện | 15 |
| **Tổng icon mới** | **215** |
| Cánh / Áo choàng / Pet | đã có |

## 6. Chỗ trống: "đồ ma vương"

Hiện **chưa có**. Nếu muốn thêm thì đây là một nhánh **nằm ngoài** 25 bộ theo lớp: không khoá
lớp, đánh đổi — thêm sát thương nhưng trừ máu tối đa hoặc trừ phòng ngự. Là bộ thứ 26, +5 món
+5 icon. Chưa đưa vào tổng ở trên vì chưa chốt.

## 7. Việc kỹ thuật kèm theo

1. **Mô hình dữ liệu** — món đồ thêm `def` trỏ vào danh mục. Cách tính chỉ số giữ nguyên
   `SLOTS[].base(tier, rarity)` để không vỡ cân bằng; `def` chỉ quyết định TÊN, HÌNH, và LỚP.
2. **Khoá lớp** — chặn ở `equipItem()`, `tryAutoEquip()`, `autoEquipBest()`. Ba chỗ, không phải
   một; bỏ sót chỗ nào là auto-mặc lách được luật.
3. **Hiện lý do khoá** — món không mặc được phải nói rõ "chỉ Dark Knight dùng", đừng im lặng.
4. **Save cũ** — nâng `SAVE_VERSION`, wipe (đã được cho phép từ trước).
5. **Bảng rơi** — **tách đợt sau** theo yêu cầu. Nghĩa là đợt này đồ mới hiện đúng hình ở
   Túi/Trang Bị/Lò và ở `?max=1`, nhưng tỉ lệ rơi vẫn theo bảng cũ nên chơi thường chưa gặp đủ.
