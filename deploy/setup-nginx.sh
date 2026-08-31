#!/bin/bash
# Cài cấu hình hiệu năng nginx cho production, rồi tự kiểm chứng.
#
# Chạy trên VPS:   bash /var/www/axiewuxia/deploy/setup-nginx.sh
#
# Chạy lại nhiều lần vô hại. Nếu cấu hình sai thì KHÔNG nạp lại — nginx giữ nguyên bản đang chạy.

SRC="$(cd "$(dirname "$0")" && pwd)/nginx-axiewuxia.conf"
DST=/etc/nginx/conf.d/axiewuxia-perf.conf
HOST=http://14.225.204.107

[ -f "$SRC" ] || { echo "Không thấy $SRC"; exit 1; }

# Giữ lại bản cũ, phòng khi cần lùi
[ -f "$DST" ] && cp -a "$DST" "$DST.bak.$(date +%Y%m%d-%H%M%S)"

cp "$SRC" "$DST"
echo "Đã chép  →  $DST"
echo

if ! nginx -t; then
  echo
  echo ">>> CẤU HÌNH SAI. KHÔNG nạp lại — nginx vẫn chạy bản cũ."
  rm -f "$DST"
  echo ">>> Đã gỡ tệp vừa chép, hệ thống trở lại nguyên trạng."
  exit 1
fi

# reload CHỈ dùng được khi nginx đang chạy. Nếu nó đang tắt (ví dụ vì một lần khởi động lại với
# cấu hình hỏng trước đó) thì reload báo "is not active, cannot reload" và trang vẫn nằm im — đã
# vấp thật, và hậu quả là website chết mà thông báo trên màn hình chỉ nói "reload hỏng".
if systemctl is-active --quiet nginx; then
  systemctl reload nginx || { echo ">>> reload hỏng"; exit 1; }
else
  echo "nginx đang KHÔNG chạy — khởi động thay vì nạp lại."
  systemctl start nginx || {
    echo ">>> KHÔNG khởi động được nginx. Xem lý do:"
    systemctl status nginx --no-pager -l | tail -20
    exit 1
  }
fi
# reload là BẤT ĐỒNG BỘ: lệnh trả về ngay, nhưng worker cũ còn phục vụ nốt vài nhịp nữa. Đo ngay
# lập tức sẽ trúng worker cũ và báo "chưa đạt" trên một cấu hình hoàn toàn đúng — đã vấp thật.
sleep 3
echo
echo ">>> ĐÃ NẠP LẠI. Kiểm chứng:"
echo

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$HOST/game.js")
if [ "$CODE" != "200" ]; then
  echo ">>> TRANG KHÔNG PHỤC VỤ ĐƯỢC (mã $CODE). Xem: systemctl status nginx"
  exit 1
fi
echo "trang sống — HTTP $CODE"
echo

printf '%-38s' "game.js"
curl -sI -H "Accept-Encoding: gzip" "$HOST/game.js" \
  | grep -iE '^(content-encoding|cache-control)' | tr -d '\r' | paste -sd' | '
printf '%-38s' "woff2"
curl -sI "$HOST/fonts/wXKrE3kTposypRyd51jcAA.woff2" \
  | grep -i '^cache-control' | tr -d '\r'
echo
RAW=$(curl -sI "$HOST/game.js" | grep -i '^content-length' | tr -dc '0-9')
GZ=$(curl -s -H "Accept-Encoding: gzip" "$HOST/game.js" | wc -c)
echo "game.js thô   : $RAW byte"
echo "game.js khi nén: $GZ byte"
echo

if [ "$GZ" -gt 0 ] && [ "$RAW" -gt 0 ] && [ "$GZ" -lt $((RAW / 2)) ]; then
  echo ">>> ĐẠT — game.js giảm còn $((GZ * 100 / RAW))% kích thước gốc."
else
  echo ">>> CHƯA ĐẠT — nén không có tác dụng. Chạy: nginx -T | grep -n add_header"
fi
