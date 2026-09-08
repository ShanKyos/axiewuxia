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

Hai phép chạy được offline:

  ② SÀN THOÁNG — trong vùng mặt nạ khai "bắt buộc trống", đếm phần bị khối đặc cỡ nhân vật ăn.

  ③ "mảnh đất trống liền nhau lớn nhất" — HỎNG NỐT, và hỏng theo kiểu nguy hiểm nhất: nó
     KHÔNG nổ bừa, nó cho ra một con số nghe rất thuyết phục rồi dẫn tới kết luận NGƯỢC.
     Hiệu chỉnh trên nền đã biết:
         bg_daohoa      (đang chạy tốt)  21,4%   cây 52,2%
         bg_comoc       (đang chạy tốt)  18,7%   cây 63,7%
         bg_quangtruong (đã duyệt)       15,3%   cây  5,2%
         tấm mới sinh                    24,0%   cây 47,4%
     Tấm mới CAO HƠN cả ba tấm đang chạy. Tôi đã dùng phép này để kết luận "cây ăn mất sàn,
     chỉ còn 24%" — sai hoàn toàn.

     Vì sao sai, và đây là điều đáng nhớ nhất trong cả tệp: **MÁY KHÔNG ĐỌC TRANH NỀN ĐỂ CHẶN
     ĐƯỜNG.** Chặn là việc của `diTrong` và `MAP_OBSTACLES`. Cây vẽ trong tranh chỉ là hoa văn
     trên mặt đất — người chơi đi xuyên qua, đúng như đang xảy ra ở daohoa và comoc. Nên
     "đếm cây trong tranh" đo một thứ KHÔNG liên quan tới việc map có chơi được hay không.

⚠ TÓM LẠI: BA PHÉP THỐNG KÊ TỰ CHẾ, BA LẦN HỎNG. Đừng chế phép thứ tư. Cách duy nhất đã
  chứng minh được là LẮP VÀO GAME RỒI CHỤP MÀN HÌNH — `test_sandat` kiểm hình học `diTrong`,
  còn tranh đẹp hay xấu thì mắt người quyết.

Phép còn giữ (dùng dè, chưa chứng minh được):

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


def manh_lien(tranh):
    """⚠ PHÉP NÀY HỎNG — giữ lại chỉ để ai đó khỏi viết lại nó. Xem chú thích đầu tệp:
    nó chấm tấm mới CAO HƠN cả ba tấm nền đang chạy tốt, vì nó đếm cây trong TRANH mà máy
    thì chặn đường bằng `diTrong`, không bằng tranh. Đừng dùng để quyết định gì.
    """
    from scipy import ndimage
    a = np.asarray(Image.open(tranh).convert('RGB').resize(KHO, Image.LANCZOS), dtype=float) / 255
    mx, mn = a.max(2), a.min(2)
    s_ = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    toi = mx < 0.22
    cay = (~toi) & (s_ > 0.30) & (mx < 0.62)
    dat = (~toi) & (~cay)
    lab, _ = ndimage.label(dat)
    dem = np.bincount(lab.ravel()); dem[0] = 0
    lon = lab == dem.argmax()
    return (round(100 * dem.max() / dat.size, 1),
            {'tren': bool(lon[0].any()), 'duoi': bool(lon[-1].any()),
             'trai': bool(lon[:, 0].any()), 'phai': bool(lon[:, -1].any())},
            round(100 * cay.mean(), 1))


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
    lien, mep, cay = manh_lien(tranh)     # chỉ để tham khảo, KHÔNG dùng để chấm đạt/hỏng
    loi = []
    if v < SAN_THOANG_MIN:
        loi.append(f"sàn chỉ thoáng {v}% — khối đặc ăn vào chỗ phải để trống (ngưỡng ≥{SAN_THOANG_MIN}%)")
    return {'san_thoang': v, 'manh_lien': lien, 'mep': mep, 'cay': cay, 'loi': loi, 'dat': not loi}


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(2)
    r = cham(sys.argv[1], sys.argv[2])
    print(('ĐẠT — ' if r['dat'] else 'HỎNG — ') + os.path.basename(sys.argv[1])
          + f"  · sàn thoáng {r['san_thoang']}% · mảnh liền {r['manh_lien']}% · cây {r['cay']}%"
          + f"  · chạm mép {[k for k, v in r['mep'].items() if v] or 'không mép nào'}")
    for l in r['loi']:
        print('  ✗ ' + l)
    print('\n⚠ Phép chiếu (nhìn từ trên xuống hay nhìn ngang) KHÔNG đo được ở đây — hỏi model')
    print('  thị giác bằng PROMPT_KIEM_PHEP_CHIEU. Xem đầu tệp để biết vì sao.')
    sys.exit(0 if r['dat'] else 1)
