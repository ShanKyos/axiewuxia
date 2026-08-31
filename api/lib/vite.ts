import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { compress } from "hono/compress";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

// Đo trên bản đang chạy: lượt tải đầu là 121 yêu cầu / 11,4 MB, KHÔNG một tệp nào được nén và
// KHÔNG một tệp nào có Cache-Control — nghĩa là mỗi lần người chơi mở lại game là tải lại từ đầu
// toàn bộ 11,4 MB đó. Riêng game.js là 1,06 MB thô, gzip xuống còn khoảng một phần năm.
const ONE_WEEK = 60 * 60 * 24 * 7;

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");

  // Nén trước khi tới serveStatic. Ảnh/nhạc đã nén sẵn nên hono/compress tự bỏ qua theo
  // content-type; cái được lợi là game.js, lang.js, style.css và index.html.
  app.use("*", compress());

  app.use(
    "*",
    serveStatic({
      root: "./dist/public",
      onFound: (filePath, c) => {
        // Tên tệp trong public/game KHÔNG gắn mã băm, nên không thể đặt immutable: sửa game.js
        // rồi mà trình duyệt vẫn giữ bản cũ thì người chơi mắc kẹt ở phiên bản cũ, không có cách
        // nào tự thoát. Ảnh và nhạc thì gần như không bao giờ đổi nội dung dưới cùng một tên —
        // cho chúng cache dài; mã và trang thì bắt hỏi lại mỗi lần (đổi thì 200, không đổi thì
        // 304 rỗng — vẫn tiết kiệm gần trọn băng thông mà không bao giờ phục vụ bản cũ).
        const asset = /\.(png|jpe?g|gif|webp|svg|mp3|ogg|wav|woff2?|ttf)$/i.test(filePath);
        c.header(
          "Cache-Control",
          asset ? `public, max-age=${ONE_WEEK}` : "no-cache",
        );
      },
    }),
  );

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    const content = fs.readFileSync(indexPath, "utf-8");
    return c.html(content);
  });
}
