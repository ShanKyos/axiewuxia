#!/usr/bin/env python3
"""Chấm một tranh nền map trước khi lắp vào game — ĐẠT hay HỎNG.

Vì sao cần: sinh ảnh là việc cầu may. Có bộ chấm thì vòng lặp khép lại được — sinh → chấm →
hỏng thì thêm ĐÚNG MỘT ràng buộc rồi sinh lại — thay vì mỗi vòng phải chờ người nhìn.

⚠ HAI PHÉP THỐNG KÊ TỰ VIẾT ĐỀU HỎNG. Ghi lại để không ai thử lại:

  ① "dải đáy tách biệt" — quét từ đáy lên tới hàng đổi chất liệu.
     Bắt được 6 tấm backdrop, NHƯNG đánh trượt luôn `bg_quangtruong` (23,8%) — chính tấm
     diorama đã duyệt — vì diorama nằm trên nền đen nên đáy cũng là một dải tách biệt.
     Nó đo "có dải đáy", không đo "có trời".

  ② "lệch vân trên-dưới" — giả định trời thì phẳng và nằm ở trên, đất thì có vân.
     Sai 4/9. `bg_mongco` ra −0,606: nửa TRÊN nhiều vân hơn (hẻm núi rối) còn nửa DƯỚI phẳng
     (tiền cảnh đất đỏ). `bg_tuyettinh` −0,257 và `bg_ngoai` −0,290 hỏng y hệt — tuyết và nền
     rừng ở dưới đều phẳng. Vùng phẳng KHÔNG nằm cố định ở trên.

  Kết luận: "tranh này nhìn từ trên xuống hay nhìn ngang" là câu hỏi NGỮ NGHĨA, không phải câu
  hỏi thống kê. Đường đúng là hỏi thẳng một model thị giác — xem `PROMPT_KIEM_PHEP_CHIEU`.
  Đây chính là chỗ có sẵn khoá Gemini đáng giá hơn hẳn: nó biến khâu duyệt từ "chờ người nhìn"
  thành một lời gọi trong vòng lặp.

Phép còn lại chạy được offline là ② SÀN THOÁNG — thuần hình học, không đoán ngữ nghĩa.

Chạy:
    python3 tools/cham_map.py <tranh.jpg> <mặt-nạ-bố-cục.jpg>
"""
import os, sys
import numpy as np
from PIL import Image

THAN_NV = 95          # thân nhân vật vẽ ra, pixel thế giới — thang đo "khối cỡ trận đánh"
KHO = (2600, 1900)
SAN_THOANG_MIN = 78.0

# Câu hỏi cho model thị giác. Giữ NGẮN và chỉ hỏi MỘT điều — hỏi gộp thì câu trả lời nhoè.
PROMPT_KIEM_PHEP_CHIEU = (
    "Is this image a ground plane seen from above (top-down or isometric), or a side view with "
    "a horizon and sky? Answer with one word: GROUND or SIDE."
)


def _nang_luong(g, cua=THAN_NV):
    """Chênh lệch cục bộ ở thang cỡ nhân vật: |ảnh − ảnh làm mờ|, chuẩn hoá 0-1.

    Dùng hiệu với bản làm mờ chứ không dùng gradient từng điểm: gradient bắt cả vân cỏ li ti,
    còn thứ cần bắt là KHỐI to bằng người trở lên — đúng thứ chặn đường đánh nhau.
    """
    k = max(3, cua // 2 * 2 + 1)
    ker = np.ones(k) / k
    mo = np.apply_along_axis(lambda r: np.convolve(r, ker, 'same'), 1, g)
    mo = np.apply_along_axis(lambda c: np.convolve(c, ker, 'same'), 0, mo)
    e = np.abs(g - mo)
    return e / max(e.max(), 1e-6)


def cham(tranh, mat_na):
    """Đo phần sàn bắt buộc để trống có thật sự trống không.

    ⚠ CHƯA KIỂM ĐƯỢC NGƯỠNG. Cả 8 nền hiện có đều ra 84-98%, tức phép này chưa lần nào nổ trên
    dữ liệu thật — nó viết ra để bắt kiểu hỏng CHƯA XẢY RA (diorama dựng nhà giữa sân). Ngưỡng
    78% là phỏng đoán, phải chỉnh lại khi có tấm hỏng thật đầu tiên để so.
    """
    g = np.asarray(Image.open(tranh).convert('L').resize(KHO, Image.LANCZOS), dtype=float)
    dac = _nang_luong(g) > 0.18
    m = np.asarray(Image.open(mat_na).convert('RGB').resize(KHO, Image.LANCZOS), dtype=float)
    san = np.abs(m - np.array([208, 198, 178])).sum(2) < 90      # vùng sáng = phải để trống
    if not san.any():
        return {'san_thoang': None, 'loi': ['mặt nạ không có vùng sàn nào'], 'dat': False}
    v = round(100 * (1 - dac[san].mean()), 1)
    loi = [] if v >= SAN_THOANG_MIN else [
        f"sàn chỉ thoáng {v}% — khối đặc ăn vào chỗ phải để trống (ngưỡng ≥{SAN_THOANG_MIN}%)"]
    return {'san_thoang': v, 'loi': loi, 'dat': not loi}


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(2)
    r = cham(sys.argv[1], sys.argv[2])
    print(('ĐẠT — ' if r['dat'] else 'HỎNG — ') + os.path.basename(sys.argv[1])
          + f"  · sàn thoáng {r['san_thoang']}%")
    for l in r['loi']:
        print('  ✗ ' + l)
    print('\n⚠ Phép chiếu (nhìn từ trên xuống hay nhìn ngang) KHÔNG đo được ở đây — hỏi model')
    print('  thị giác bằng PROMPT_KIEM_PHEP_CHIEU. Xem đầu tệp để biết vì sao.')
    sys.exit(0 if r['dat'] else 1)
