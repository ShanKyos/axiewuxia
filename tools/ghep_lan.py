#!/usr/bin/env python3
"""Ghép hai tấm tranh nền của map dạng LÀN thành một tấm 6400x1400, và ĐO mối nối.

Vì sao phải cắt đôi rồi ghép: một lần sinh của model không ra nổi khổ 4,57:1 — tỉ lệ rộng nhất
thường có là 21:9 (2,33:1). Cắt đôi thì mỗi tấm ~2,4:1, sinh được nguyên bản.

Vì sao phải ĐO mối nối chứ không chỉ nhìn: chỗ nối nằm giữa map, người chơi đi ngang qua nó mỗi
lượt cày. Lệch màu ở đó hiện ra thành một đường kẻ dọc chạy suốt chiều cao map — thấy ngay, mà
lại là thứ mắt dễ bỏ qua khi soi ảnh tĩnh thu nhỏ. Phép đo dưới đây so chênh lệch màu ĐI QUA mối
nối với chênh lệch màu ở hai bên (nền so sánh): nếu mối nối không tệ hơn nền thì nó vô hình.

⚠ Hoà mép KHÔNG chữa được lệch màu tổng thể. Nếu hai tấm sinh ra khác tông (một tấm ngả vàng,
một tấm ngả xanh) thì cross-fade chỉ biến đường kẻ sắc thành một vệt chuyển dài — vẫn thấy. Lúc
đó phải sinh lại tấm B với tấm A làm ảnh tham chiếu, chứ không phải hoà mạnh tay hơn.

Chạy:
    python3 tools/ghep_lan.py <tấmA> <tấmB> <ra.jpg>
"""
import sys
import numpy as np
from PIL import Image

W, H = 6400, 1400
CHONG = 300                      # phải khớp CHONG trong tools/phac_lan.py
GIUA = W // 2
KA = (0, GIUA + CHONG // 2)      # tấm A phủ thế giới x 0..3350
KB = (GIUA - CHONG // 2, W)      # tấm B phủ thế giới x 3050..6400


def _nap(p, khung):
    rong = khung[1] - khung[0]
    return np.asarray(Image.open(p).convert('RGB').resize((rong, H), Image.LANCZOS), dtype=float)


def ghep(pa, pb):
    a, b = _nap(pa, KA), _nap(pb, KB)
    out = np.zeros((H, W, 3), dtype=float)
    out[:, KA[0]:KA[1]] = a
    # dải chồng: trọng số chạy 1→0 theo cosin, mềm hơn tuyến tính ở hai đầu nên không để lại
    # hai đường gãy ở mép dải hoà
    x0, x1 = KB[0], KA[1]
    t = np.linspace(0, 1, x1 - x0)
    w = (0.5 * (1 - np.cos(np.pi * t)))[None, :, None]
    out[:, x0:x1] = a[:, x0-KA[0]:] * (1 - w) + b[:, :x1-x0] * w
    out[:, x1:] = b[:, x1-KB[0]:]
    return np.clip(out, 0, 255).astype('uint8')


def do_moi_noi(pa, pb):
    """HAI TẤM CÓ KHỚP NHAU Ở DẢI CHỒNG KHÔNG — đo trên ảnh GỐC, không đo trên ảnh đã hoà.

    ⚠ Bản đầu đo GRADIENT ngang tại đúng cột giữa rồi so với nền hai bên. Nó trượt đối chứng:
    nhuộm tấm B ngả vàng 15% mà bài vẫn báo "không nhìn ra chỗ ghép" (tỉ số 0,74×). Lý do là
    cross-fade trải chênh lệch ra suốt 300px, nên độ dốc TẠI CHỖ nhỏ tí — phép đo độ dốc mù với
    một cái dốc thoải. Nó đo "hoà có mượt không", mà câu cần hỏi là "hai tấm có cùng tông không".

    Nay đo thẳng: dải chồng là vùng HAI TẤM CÙNG VẼ MỘT KHÚC THẾ GIỚI, nên mọi khác biệt ở đó là
    lệch tông. So với mức chênh tự nhiên giữa hai khúc kề nhau trong CÙNG tấm A làm nền.
    """
    a, b = _nap(pa, KA), _nap(pb, KB)
    x0, x1 = KB[0], KA[1]                       # dải chồng, theo toạ độ thế giới
    ca = a[:, x0-KA[0]:x1-KA[0]]
    cb = b[:, :x1-x0]
    lech = float(np.abs(ca.mean(axis=(0, 1)) - cb.mean(axis=(0, 1))).mean())
    rong = x1 - x0
    m1 = a[:, x0-KA[0]-rong:x0-KA[0]].mean(axis=(0, 1))
    m2 = a[:, x0-KA[0]:x1-KA[0]].mean(axis=(0, 1))
    nen = float(np.abs(m1 - m2).mean())
    return lech, nen


def main():
    if len(sys.argv) < 4:
        print(__doc__); sys.exit(2)
    pa, pb, ra = sys.argv[1], sys.argv[2], sys.argv[3]
    arr = ghep(pa, pb)
    Image.fromarray(arr).save(ra, quality=93)
    lech, nen = do_moi_noi(pa, pb)
    print(f'  ghép xong: {ra} · {W}x{H}')
    print(f'  lệch tông ở dải chồng {lech:.2f}/255 · chênh tự nhiên trong cùng tấm {nen:.2f}')
    if lech > max(3.0, nen * 1.5):
        print('  ✗ THẤY ĐƯỢC — hai tấm lệch tông. Sinh lại tấm B với tấm A làm ảnh tham chiếu;')
        print('    hoà mạnh tay hơn KHÔNG chữa được, chỉ kéo đường kẻ thành vệt chuyển dài.')
        sys.exit(1)
    print('  ✓ mối nối không nổi hơn nền — nhìn không ra chỗ ghép')


if __name__ == '__main__':
    main()
