#!/usr/bin/env bash
# CỬA KIỂM TRƯỚC KHI COMMIT — chạy hết, không dừng ở lỗi đầu, rồi tổng kết.
#
# Vì sao có tệp này. Chủ dự án giao vai: làm xong thì phải soi lại rồi mới được commit và
# push. Một lời hứa "tôi sẽ soi kỹ" thì không kiểm chứng được — mà đúng những thứ dưới đây
# đều đã lọt qua ít nhất một lần trong lịch sử dự án, nên chúng được ghi thành phép đo.
#
#   bash tools/cua_kiem.sh            # soi thay đổi đang có so với HEAD
#   bash tools/cua_kiem.sh <mốc>      # soi so với một mốc khác
set -uo pipefail
cd "$(dirname "$0")/.."
MOC="${1:-HEAD}"
XAU=0
ok(){ printf '  \033[32m✓\033[0m %s\n' "$1"; }
xau(){ printf '  \033[31m✗\033[0m %s\n' "$1"; XAU=$((XAU+1)); }
muc(){ printf '\n\033[1m%s\033[0m\n' "$1"; }

muc "① MÁY DỊCH VÀ KIỂU"
npx eslint public/game/game.js >/dev/null 2>&1 && ok "eslint sạch" || xau "eslint có lỗi"
node --check public/game/data/canbang.js 2>/dev/null && ok "canbang.js đúng cú pháp" || xau "canbang.js sai cú pháp"
npm run check >/dev/null 2>&1 && ok "tsc qua" || xau "tsc đỏ"
npm test >/dev/null 2>&1 && ok "vitest qua" || xau "vitest đỏ"

muc "② TỪ ĐIỂN — docs/THUAT_NGU.md"
# Chỉ soi CHỮ NGƯỜI CHƠI THẤY. Hai lớp lọc, và lớp thứ hai sinh ra từ một DƯƠNG TÍNH GIẢ
# ngay lượt chạy đầu: cửa kiểm tố 4 chỗ dùng "minimap", hoá ra là `'minimap'` và `'btn-minimap'`
# — MÃ ĐỊNH DANH DOM, không phải chữ ai đọc. Cửa kiểm báo động giả thì người ta thôi tin nó,
# nên phải phân biệt được hai thứ đó.
#   · bỏ đường dẫn tài sản và URL
#   · chỉ giữ chuỗi TRÔNG NHƯ CÂU VĂN: có dấu cách, hoặc có chữ cái tiếng Việt có dấu.
#     Mã định danh (`btn-minimap`, `spawnFrom`) không có cả hai.
CHUOI=$(grep -ohE "'[^']{2,120}'" public/game/game.js public/game/data/*.js 2>/dev/null \
        | grep -vE "'(assets|https?)" \
        | grep -E "[ ]|[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁÂĂÈÉÊÌÍÒÓÔƠÙÚƯÝĐ]")
for t in 'cảnh giới' 'đan điền' 'kinh mạch' 'chân khí' 'tu vi' 'độ kiếp' 'bí kíp' 'môn phái' 'giang hồ' 'tiên hiệp' 'phi thăng'; do
  n=$(printf '%s' "$CHUOI" | grep -ci "$t" || true)
  [ "$n" = 0 ] && ok "không có \"$t\"" || xau "$n chỗ dùng \"$t\" (CLAUDE.md quy tắc 1)"
done
for t in Kundun Lorencia Noria Devias Icarus Atlans Tarkan; do
  n=$(printf '%s' "$CHUOI" | grep -c "$t" || true)
  [ "$t" = Kundun ] && { [ "$n" -le 6 ] && ok "Kundun chỉ ở \"Box Kundun\" ($n chỗ)" || xau "Kundun xuất hiện $n chỗ — chỉ 'Box Kundun' được duyệt"; continue; }
  [ "$n" = 0 ] && ok "không có tên riêng \"$t\"" || xau "$n chỗ dùng tên riêng MU \"$t\""
done
for t in ' Qi' 'AoE' 'minimap'; do
  n=$(printf '%s' "$CHUOI" | grep -c "$t" || true)
  [ "$n" = 0 ] && ok "không có \"$t\"" || xau "$n chỗ dùng \"$t\" (THUAT_NGU.md cấm)"
done

muc "③ CHỮ HÁN LỌT VÀO MÃ"
n=$(python3 -c "import re;print(sum(1 for l in open('public/game/game.js',encoding='utf-8') if re.search(r'[　-〿一-鿿＀-￯゠-ヿ぀-ゟ]',l)))")
[ "$n" = 0 ] && ok "0 dòng CJK trong game.js" || xau "$n dòng CJK trong game.js"

muc "④ VỆ SINH COMMIT"
LAC=$(git diff --name-only "$MOC" 2>/dev/null | grep -vE '^(public|tests|tools|docs|CLAUDE\.md|package)' || true)
[ -z "$LAC" ] && ok "không có tệp lạc ngoài vùng dự án" || xau "tệp lạc: $(echo "$LAC" | tr '\n' ' ')"
if git diff --name-only "$MOC" 2>/dev/null | grep -q '^docs/'; then
  printf '  \033[33m!\033[0m docs/ bị sửa — docs là NHẬT KÝ QUYẾT ĐỊNH, đừng viết lại khi đổi tên\n'
fi

muc "⑤ NHÁNH"
NH=$(git rev-parse --abbrev-ref HEAD)
if [ "$NH" = main ]; then
  git fetch -q origin main 2>/dev/null || true
  TRUOC=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
  ok "đang ở main, trước origin/main $TRUOC commit"
  printf '  \033[33m!\033[0m main là nhánh TRIỂN KHAI — VPS kéo mỗi 2 phút. Chỉ đẩy khi hồi quy XANH.\n'
else
  ok "đang ở nhánh $NH (không phải nhánh triển khai)"
fi

printf '\n'
if [ "$XAU" = 0 ]; then
  printf '\033[32mCỬA KIỂM MÁY MÓC: QUA.\033[0m Còn bốn việc PHẢI làm bằng tay, máy không thay được:\n'
else
  printf '\033[31mCỬA KIỂM: %d MỤC ĐỎ — chưa được commit.\033[0m\n' "$XAU"
fi
cat <<'TAY'
  1. Hồi quy đầy đủ: bash tools/reg.sh /tmp/reg-X  (~90 phút, phải 175/175)
  2. Bài kiểm MỚI phải THỬ NGƯỢC: phá mã, bài kiểm phải ĐỎ. Xanh cả hai chiều = xanh giả.
  3. Mọi con số trong commit phải ĐO ĐƯỢC, không phải ước lượng.
  4. Đoán sai chỗ nào thì ghi vào docs/NHAT_KY.md mục "đã đoán sai".
TAY
exit "$XAU"
