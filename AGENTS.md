# AGENTS.md

Hướng dẫn cho agent làm việc trên repo này nằm ở **[`CLAUDE.md`](./CLAUDE.md)** — đọc file đó
trước khi làm bất cứ việc gì.

Tóm tắt những thứ dễ làm sai nhất:

1. **Phong cách là MU Online, KHÔNG phải kiếm hiệp.** Tên thư mục `axie-wuxia` chỉ là di sản.
2. **Không dùng tên riêng của MU Online** trong text người chơi thấy (Kundun, Lorencia,
   Devil Square…). Có bảng tên thay thế trong `CLAUDE.md`.
3. **Production = VPS `http://14.225.204.107/`**, tự kéo từ nhánh `main` mỗi 2 phút bằng cron.
   **Deploy = merge vào `main`.** KHÔNG phải Vercel, dù repo có `vercel.json`.
   Sandbox không SSH được vào VPS — mọi lệnh cần chạy trên VPS phải đưa người dùng tự chạy.
4. **Trước khi merge vào `main`:** chạy đủ `npm run lint`, `npm run check`, `npm test`, và bộ
   regression game trong scratchpad. Merge là live sau 2 phút, không có bước duyệt nào ở giữa.
5. Toàn bộ game nằm trong **một file**: `public/game/game.js`.
