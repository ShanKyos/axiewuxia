# Gói Spine — những gì còn chưa dùng

Bộ xương và cả 20 hoạt cảnh **giống hệt từng byte** ở mọi gói nhân vật (kiểm bằng băm
`bones` và `animations` của 5 gói). Nên bảng dưới đúng cho mọi lớp.

## Hoạt cảnh — 20 cái, đã dùng 14

| hoạt cảnh | dài (s) | dùng ở đâu |
|---|---|---|
| `00_Idle` | 1,600 | khối `i` — đứng |
| `00_Walk` | 0,800 | khối `w` — đi (khi bị làm chậm) và dáng bay |
| `00_Run` | 0,600 | khối `r` — chạy, mặc định lúc di chuyển |
| `08_SwordAttack` | 0,667 | khối `a` của Dark Knight · Spellblade |
| `08_SwordAttack2` | 0,667 | khối `s` — nhát thứ hai, luân phiên với `a` |
| `05_MagicAttack` | 0,833 | khối `a` của Dark Wizard · Dark Lord; khối `c` — tuyệt kỹ |
| `10_ArcheryAttack` | 0,667 | khối `a` của Sylvan Ranger |
| `06_PunchAttack` | 0,533 | khối `p` — tay không |
| `03_Hurt` | 0,467 | khối `h` — trúng đòn (kèm mặt đau) |
| `02_Death` | 1,167 | khối `d` — chết (kèm nhắm mắt) |
| `04_Jumpping` | 1,000 | khối `j` — cất cánh / hạ cánh |
| `00_Squat` | 1,600 | khối `q` — ngồi ở Suối Ký Ức |
| `09_Interactive` | 1,600 | khối `n` — bắt chuyện NPC |
| `07_StatusEffect` | 1,600 | khối `t` — đứng khi dính độc / buff |
| `01_Dance` | 0,800 | khối `e` — lệnh `/nhay` |

### Còn lại — CHƯA có chỗ dùng

| hoạt cảnh | dài (s) | vì sao chưa dùng |
|---|---|---|
| `11_ThrowPrepare` | 0,667 | Hệ ám khí đã gỡ khỏi game (ô Ám Khí cũ nay quy ra Lumen khi nạp |
| `11_Throw` | 0,333 | save đời trước). Dựng lại một hệ chỉ vì có sẵn hoạt cảnh là làm ngược. |
| `02_Death2` | 1,167 | Bản chết thứ hai. Để dành cho lúc muốn chết không lặp một dáng. |
| `01_Dance2` | 1,333 | Điệu nhảy thứ hai. Cùng lý do — `/nhay` mới cần một điệu. |
| `04_JumpPrepare` | 0,100 | Chỉ 0,1 s, là khung chùng gối trước cú bật. Ở cỡ 118px trên màn thì |
|  |  | không đọc ra được; `04_Jumpping` đã gồm cả pha bật. |

**Quy tắc:** thấy hoạt cảnh hay mà game chưa có hệ dùng tới nó thì **ghi vào đây**, đừng
dựng hệ mới để nuôi nó. Khi nào hệ đó ra đời vì lý do của chính nó, quay lại lấy.

## Atlas — 30 mảnh

Bốn khuôn mặt, **đã dùng cả bốn**: `thường` (mọi khối) · `đau đớn` (trúng đòn) ·
`nhắm mắt` (chết, ngồi) · `vui` (nhảy). Đổi mặt không tốn khung nào — chỉ ép khe đầu
sang mảnh khác lúc nướng, xem `doi_manh` của `ve_khung()`.

Còn chưa dùng:

- **6 dáng bàn tay** (`xoè chếch trước` · `xoè vào trong` · `xoè ra trước` · `xoè ra ngoài` ·
  `nắm đấm` · `thả lỏng`). Hoạt cảnh tự chọn dáng tay, nên chỉ cần khi muốn ép một dáng
  riêng — ví dụ tay xoè lúc cầm bình thuốc.
- **3 kiểu tóc sau lưng**. Dùng khi làm tuỳ biến ngoại hình.
- **3 kiểu thân**: trơn · kèm váy ngắn · kèm váy dài. Skin của từng gói đã chọn sẵn kiểu
  hợp với bộ đồ của nó; ba kiểu này chỉ có nghĩa nếu sau này cho người chơi đổi trang phục.
- **6 khung hiệu ứng nổ**. Đây là hiệu ứng CHẠM, không phải vệt chém. Hợp để gắn vào lúc
  trúng đòn; hiện game đã có bộ hiệu ứng riêng nên chưa cần.
