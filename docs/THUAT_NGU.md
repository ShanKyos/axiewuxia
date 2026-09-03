# Bảng thuật ngữ — Axie Wuxia

Một khái niệm, một cách gọi. Tệp này là nguồn duy nhất; khi hai chỗ trong game gọi khác nhau
thì chỗ nào lệch bảng này là chỗ sai.

Cơ sở: `docs/KHAO_SAT_NGON_NGU.md` §5, đếm trên chuỗi người chơi thấy trong `game.js`.

## Quy tắc nền

1. **Chữ người chơi thấy: tiếng Việt.** Ngoại lệ duy nhất là **danh từ riêng của thế giới game**
   (xem mục cuối) — chúng giữ nguyên ở mọi ngôn ngữ, đó là chủ ý.
2. **Không viết tắt tiếng Anh trong câu tiếng Việt.** `HP` · `ST` · `Lv` · `AoE` là lỗi, kể cả
   khi ngắn hơn.
3. Không dùng nhóm từ đã cấm trong `CLAUDE.md` (cảnh giới · đan điền · kinh mạch · chân khí ·
   tu vi · độ kiếp · bí kíp · môn phái · giang hồ · "Tộc" · tiên hiệp · phi thăng), **và cả
   phiên âm của chúng** — `Qi` là chân khí viết theo lối khác, cũng cấm.
4. Không dùng danh từ riêng của MU Online, Blizzard hay HoYoverse trong chữ người chơi thấy.
   Ngoại lệ đã duyệt: **Box Kundun**.

## Bảng chốt

| Khái niệm | DÙNG | CẤM DÙNG |
|---|---|---|
| Chỉ số sinh lực | **Sinh Lực** (nhãn chỉ số) · **máu** (văn nói: "hồi máu") | `HP` |
| Sát thương | **Sát Thương** (nhãn) · **sát thương** (trong câu) | `ST` |
| Sát thương diện rộng | **sát thương lan** | `AoE` |
| Tài nguyên tung chiêu | **Mana** | `Qi` · `chân khí` · `Linh Lực`¹ |
| Kinh nghiệm | **EXP** | — |
| Cấp độ | **cấp** · **Cấp** | `Lv` · `LV` |
| Quái đầu sỏ | **Trùm** · **Trùm Vùng** · **Trùm Săn** | `boss` · `Boss` · `BOSS` |
| Đánh tự động | **TỰ ĐÁNH** (nút, banner) · **chế độ tự đánh** (văn xuôi) | `AUTO` · `auto` |
| Đi đánh quái lấy đồ | **cày** | `farm` · `FARM` |
| Hiệu ứng tăng sức | **phù trợ** (danh từ) · **tăng lực** (động từ) | `buff` |
| Mốc bảo đảm gacha | **bảo đảm** | `pity` |
| Bản đồ nhỏ | **bản đồ thu nhỏ** | `minimap` · `Minimap` |
| Tiền nâng kỹ năng | **Bản Năng** | `Instinct` |
| Hệ thăng bậc | **Ascension** (tên hệ, danh từ riêng) · lượng từ là **bậc** | lượng từ `cảnh` |
| Sự kiện chọn lớp cấp 10 | **The Calling** (đủ chữ, viết hoa cả cụm) | `the Calling` · `Calling` |
| Bạn đồng hành | **Chimera** (sinh vật) · **Linh Thú** (hệ thống/ô trang bị) | `Thú Chiến` · `pet` |
| Thú cưỡi | **Thú Cưỡi** (hệ thống) · **Tuấn Mã Hoang** (con bắt được) | dùng lẫn hai thứ |
| Lớp nhân vật | **Lớp** · **lớp** | `Phái` · `phái`² |
| Vai trò trong đội | **Chịu Đòn** · **Liên Đòn** | `Tank` · `Combo` |

¹ *"Linh Lực" vẫn là tên của **chỉ số** làm tăng Mana tối đa — đó là hai thứ khác nhau, giữ nguyên.*
² *"Trấn Phái" là tên riêng của một loại tuyệt kỹ, không phải cách gọi lớp — giữ nguyên.*

## Tên kỹ năng: một ngôn ngữ cho cả bộ

`VOHOC_DEFS` có 35/35 tên tiếng Anh. Vậy **mọi tên kỹ năng đều tiếng Anh**, kể cả bị động —
`PASSIVE_SKILLS` trước đây trộn `Archery`/`Rupture` với `Phản Đòn`/`Bất Tử`/`Khát Huyết`, nay
thống nhất theo số đông. *Mô tả* kỹ năng thì vẫn tiếng Việt.

## Danh từ riêng — giữ nguyên, KHÔNG dịch

Đây không phải lỗi lẫn ngôn ngữ, và đừng ai "sửa" chúng:

- **Vùng đất:** Lunaris City · Petalshade Isle · Petalshade Outskirts · Thornwood Reach ·
  Hollow Roost · Frostmire Vale · Ashen Steppe · Stormgate Pass · Trial Chamber
- **Lớp nhân vật:** Dark Knight · Dark Wizard · Sylvan Ranger · Spellblade · Dark Lord
- **Thế giới Axie:** Chimera · Atia · Lunacia · Sigil · Vaeldra
- **Nhân vật:** Morvahn · Rell · Wren · Corran · Sylas · Liora · Dax · Brann
- **Tên kỹ năng** (xem mục trên) và **tên riêng của quái** (Thủ Lĩnh Gloam, Chúa Tể…)
- **Box Kundun** — ngoại lệ MU Online đã được duyệt

## Hai chỗ còn chờ quyết định

| | Hiện tại | Ghi chú |
|---|---|---|
| Tên hệ `Ascension` | giữ tiếng Anh | Coi như danh từ riêng, cùng nhóm với Chimera. Đổi lúc nào cũng được, chỉ là 5 chỗ. |
| `Instinct` → `Bản Năng` | **đã đổi** | Bốn loại tiền còn lại đều tiếng Việt, giữ `Instinct` là để một mình nó lạc. Khoá lưu `player.khi` giữ nguyên nên đổi lại rất rẻ. |
