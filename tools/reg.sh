#!/bin/bash
# Hồi quy trình duyệt cho AXIE RIFT — 170 bài Playwright.
#
#   bash tools/reg.sh [thư-mục-kết-quả]
#
# Chạy trên BẢN SAO ĐÓNG BĂNG của public/game, phục vụ ở một cổng tự do.
#
# Vì sao phải chụp bản sao: bộ chạy đọc game qua HTTP từ thư mục sống, nên sửa file giữa chừng
# là kết quả hỏng — đã mắc ba lần. Chụp một bản rồi chạy trên đó thì vừa chạy vừa sửa tiếp vẫn
# an toàn, và kết quả luôn khớp với đúng commit ghi trong commit.txt.
#
# Vì sao cổng phải xin từ hệ điều hành: dùng cổng cố định thì hai lượt chạy chồng nhau — lượt sau
# không chiếm được cổng, im lặng gõ vào bản chụp của lượt TRƯỚC, ra lỗi kiểu "hàm vừa thêm không
# tồn tại", trông y như lỗi sản phẩm. Cũng đã mắc một lần.
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-/tmp/reg-axie}"
SNAP="$OUT/snap"

command -v python3 >/dev/null || { echo "cần python3"; exit 1; }
[ -d "$ROOT/tests" ] || { echo "không thấy $ROOT/tests"; exit 1; }

PORT=$(python3 -c "
import socket
s=socket.socket(); s.bind(('127.0.0.1',0)); print(s.getsockname()[1]); s.close()")

# Khoá theo thư mục kết quả. Hai lượt chạy CÙNG một $OUT thì lượt sau `rm -rf` mất trạng thái
# của lượt trước ngay giữa chừng: lượt trước kết thúc sớm và in ra một con số vô nghĩa ("27/28
# xanh", danh sách ĐỎ rỗng), còn lượt sau đếm cả những dòng lượt trước đã ghi. Nhìn y như bộ
# kiểm bị hỏng. Đã mắc một lần — chặn hẳn thay vì để nó im lặng làm hỏng kết quả.
LOCK="$OUT/.reg.pid"
if [ -f "$LOCK" ] && kill -0 "$(cat "$LOCK" 2>/dev/null)" 2>/dev/null; then
  echo "LỖI: đã có một lượt chạy (pid $(cat "$LOCK")) đang dùng $OUT."
  echo "     Chờ nó xong, hoặc chạy lượt này vào thư mục khác: bash tools/reg.sh /tmp/reg-<tên>"
  exit 2
fi
rm -rf "$OUT"; mkdir -p "$OUT/src"
echo $$ > "$LOCK"
cp -r "$ROOT/public/game" "$SNAP"
git -C "$ROOT" rev-parse --short HEAD > "$OUT/commit.txt" 2>/dev/null || echo "?" > "$OUT/commit.txt"

( cd "$SNAP" && exec python3 -m http.server "$PORT" >/dev/null 2>&1 ) &
SRV=$!
trap 'kill $SRV 2>/dev/null; rm -f "$LOCK"' EXIT
sleep 2
# Không phục vụ được thì DỪNG, đừng chạy 134 bài vào hư không.
if ! curl -sf -o /dev/null "http://localhost:$PORT/index.html"; then
  echo "LỖI: không dựng được server ở cổng $PORT" | tee -a "$OUT/all.log"; exit 1
fi
echo "cổng $PORT · commit $(cat "$OUT/commit.txt")" >> "$OUT/all.log"

export NODE_PATH="${NODE_PATH:-/opt/node22/lib/node_modules}"
# `timeout` giết node nhưng KHÔNG giết trình duyệt con — nó thành mồ côi (ppid=1) và vẫn giữ
# RAM suốt phần còn lại của lượt chạy.
# ⚠ ĐỪNG dùng `pkill -f chrom`: mẫu đó khớp luôn dòng lệnh của chính shell đang chạy và giết
# nó (thoát 144) — vết sẹo đã ghi trong CLAUDE.md, và tôi đã dẫm lại đúng nó trong phiên này.
# Lọc theo ppid=1 thì chỉ trúng con mồ côi, không bao giờ trúng trình duyệt của bài đang chạy.
dondep_chrome(){
  for cp in $(ps -eo pid=,ppid=,comm= | awk '$2==1 && $3 ~ /^chrom/ {print $1}'); do
    kill -9 "$cp" 2>/dev/null
  done
}
# Tệp phụ trợ trong tests/ (không phải test_*.js) phải đi theo: bài kiểm require chúng theo
# đường dẫn tương đối, mà bài thì chạy từ $OUT/src chứ không phải từ tests/.
for h in "$ROOT"/tests/*.js; do
  case "$(basename "$h")" in test_*) ;; *) cp "$h" "$OUT/src/" ;; esac
done
do=0
for f in "$ROOT"/tests/test_*.js; do
  n=$(basename "$f")
  # Cổng trong bài được viết cứng; đổi hết sang cổng thật của lượt này.
  sed -E "s#localhost:8[0-9]{3}#localhost:$PORT#g" "$f" > "$OUT/src/$n"
  # Vài bài lấy cổng từ argv[2] — sed không đụng tới, nên phải truyền vào.
  timeout 260 node "$OUT/src/$n" "$PORT" > "$OUT/$n.log" 2>&1
  rc=$?
  # ⚠ rc=124 là ĐỒNG HỒ CỦA CHÍNH BỘ CHẠY bắn, không phải một khẳng định nào đỏ — log lúc đó
  # cụt giữa chừng với "Target page ... has been closed". Đo được: ba bài dính kiểu này qua ba
  # lượt (test_chianh · test_bossplace · test_sandat) đều chạy RIÊNG xong trong 3-28 giây, máy
  # thì còn 14GB rỗng, đĩa 29GB, server đã đa luồng, không có tiến trình nào chạy chung.
  #
  # Nên: chạy lại ĐÚNG MỘT LẦN và ghi rõ là đã chạy lại. Đây KHÔNG phải "cho qua vì nghĩ là
  # nhiễu" — lượt hai mà vẫn 124 thì vẫn tính đỏ, và dòng ĐÃ-CHẠY-LẠI in ra cuối để không ai
  # tưởng bộ 179 bài này xanh trơn tru.
  if [ "$rc" -eq 124 ]; then
    dondep_chrome
    echo "  ↻ $n hết giờ 260s — chạy lại một lần" >&2
    timeout 260 node "$OUT/src/$n" "$PORT" > "$OUT/$n.log" 2>&1
    rc=$?
    echo "$n" >> "$OUT/chaylai.txt"
  fi
  echo "$rc $n" >> "$OUT/all.log"
  [ "$rc" -ne 0 ] && do=$((do+1))
done

dondep_chrome
echo DONE >> "$OUT/all.log"
tong=$(grep -cE '^[0-9]+ ' "$OUT/all.log")
echo
echo "commit $(cat "$OUT/commit.txt") · $((tong-do))/$tong xanh"
if [ -s "$OUT/chaylai.txt" ]; then
  echo "ĐÃ CHẠY LẠI (hết giờ 260s lượt đầu): $(tr '\n' ' ' < "$OUT/chaylai.txt")"
fi
if [ "$do" -gt 0 ]; then
  echo "ĐỎ:"; awk '$1!=0 && $1 ~ /^[0-9]+$/ {print "  " $2}' "$OUT/all.log"
  echo "log từng bài: $OUT/<tên-bài>.log"
fi
exit $((do > 0))
