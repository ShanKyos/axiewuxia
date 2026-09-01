# Hồi quy trình duyệt

134 bài Playwright chạy game thật trong Chromium. Không phải unit test — mỗi bài mở
`index.html`, khởi động một nhân vật, rồi kiểm hành vi qua DOM và trạng thái trong game.

```bash
bash tools/reg.sh              # kết quả ở /tmp/reg-axie
bash tools/reg.sh /tmp/abc     # hoặc chỉ định thư mục
```

Thoát 0 nếu xanh hết. Bài nào đỏ thì log riêng nằm ở `<thư-mục>/<tên-bài>.log`.

## Vì sao bộ này tồn tại

Phần lớn các bài được viết SAU khi một lỗi lọt ra ngoài, và mỗi bài gác đúng cái lỗi đó.
Vài luật quan trọng nhất đang được gác:

| Bài | Luật nó giữ |
|---|---|
| `test_linhthu` | Linh Thú **không bao giờ mất** — ép hỏng 400 lần liên tiếp vẫn phải còn nguyên mức |
| `test_lvpower` | Không ai yếu đi sau đợt gỡ hệ tu tiên — ghim bảng vàng 8 mốc cấp |
| `test_cultremoval` | Hệ cảnh giới · kinh mạch · Tán Tiên phải **biến mất hẳn** (Quy tắc 1 trong CLAUDE.md) |
| `test_kho` | Mở Box Kundun **không được mất đồ**, kể cả lúc túi đầy |
| `test_boxthrow` | Hạp văng đồ ra đất, đồ Hoàn Hảo đọc được bằng màu xanh riêng |
| `test_nopet` | Hệ Thú Thuần Hóa đã gỡ không được quay lại |
| `test_story` | Không có danh từ riêng của MU Online trong chữ hiện ra cho người chơi |

## Lưu ý khi viết bài mới

- **Chạy trên bản sao đóng băng.** `reg.sh` chụp `public/game` rồi phục vụ bản chụp, nên
  sửa mã giữa lúc chạy vẫn an toàn.
- **Cổng do hệ điều hành cấp.** Đừng viết cứng cổng rồi giả định nó rảnh — hai lượt chồng
  nhau sẽ cho kết quả sai mà trông y như lỗi sản phẩm.
- **Đo đúng thời điểm.** `test_resscale` từng đo FPS *sau* khi bộ tự chỉnh đã cứu, rồi lấy
  con số đó phủ nhận chính việc cứu. Bài kiểm sai kiểu này đỏ lúc được lúc không, rất dễ bị
  cho qua như nhiễu.
- **Luồng bất đồng bộ phải chờ.** `openBaoHap()` ném hạp ra rồi mới nổ sau chừng 0,9 giây;
  đọc kết quả ngay sau lệnh thì lúc nào cũng thấy 0.
