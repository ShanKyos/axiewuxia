#!/usr/bin/env python3
"""Sinh hình đất cho THÀNH LỚN Ardhaven — 5200×3800, cỡ đúng một map hoang dã.

Vì sao thành phải TO BẰNG MAP: chủ dự án xem Rẻo Rừng Corran (5200×3800) rồi nói map đó
"tạo cảm giác map rất lớn và có thể đặt quái ở nhiều nơi", và muốn thành cũng vậy — có khu
phố, có nhiều NPC làm những việc khác nhau, có bốn hướng ra bốn map khác. Thành cũ 2600×1900
chỉ đủ chỗ cho hai người đứng.

Hình thành: một vòng tường bo góc, bốn CUỐNG CỔNG thò ra bốn rìa map. Cuống là chỗ `test_noimap`
đo "điểm tới sát rìa" — không có cuống thì điểm tới phải đặt trong lòng thành, và người chơi đi
qua cổng hiện ra giữa quảng trường chứ không phải ở cửa thành.

Bốn khu (lấy ý từ bố cục thành lớn trong game nhập vai cũ: quảng trường ở giữa, nghề nghiệp
chia ra bốn góc, đi từ góc này sang góc kia mất một quãng có thật):
  · giữa      — Quảng Trường Atia: đài thờ + giếng, điểm thả ngay dưới
  · đông-bắc  — Phố Lò: thợ rèn, giá binh khí
  · tây-bắc   — Phố Chợ: dược sư, trà quán, kho ngọc
  · tây-nam   — Sân Chuồng: người giữ Linh Thú, xe hàng
  · đông-nam  — Sảnh Lệnh: quan truy nã, Sảnh Cầu May

Chạy:  python3 tools/iso/dung_thanh.py
"""
import json, sys

import numpy as np
from scipy import ndimage
from skimage import measure

W, H = 5200, 3800
TUONG = 260          # bề dày tường tính từ rìa map vào — lòng thành bắt đầu sau đó
BO = 420             # bán kính bo bốn góc lòng thành
CUONG = 560          # bề ngang cuống cổng
NV_CAO = 132
B = 20               # bước lưới raster (px) — đủ mịn cho đường bao mà vẫn nhanh

# Bốn cổng: (tên, hướng, toạ độ trên rìa, map đi tới)
CONG = [
    ('bac',  (W//2, 150),      'tuyettinh'),
    ('nam',  (W//2, H - 150),  'ngoai'),
    ('tay',  (150, H//2),      'daohoa'),
    ('dong', (W - 150, H//2),  'chungnam'),
]


def mat_na():
    """Vùng đi được dựng bằng MẶT NẠ RASTER rồi mới dò đường bao.

    ⚠ Bản đầu chèn cuống cổng thẳng vào danh sách đỉnh của lòng thành. Nó tự cắt chính nó, và
    phép đo diện tích theo công thức giày buộc dây in ra "sàn 162,5% khổ map" — một con số vô
    nghĩa, tức là đa giác hỏng. Dựng bằng mặt nạ thì hợp hình là phép OR trên lưới, không có
    cách nào tự cắt; đây cũng đúng đường mà cat_caungam.py đã chạy được.
    """
    yy, xx = np.mgrid[0:H:B, 0:W:B]
    x, y = xx.astype(float), yy.astype(float)
    # lòng thành: chữ nhật bo góc = khoảng cách Chebyshev tới hình chữ nhật thu nhỏ ≤ BO
    x0, y0, x1, y1 = TUONG + BO, TUONG + BO, W - TUONG - BO, H - TUONG - BO
    dx = np.maximum(0, np.maximum(x0 - x, x - x1))
    dy = np.maximum(0, np.maximum(y0 - y, y - y1))
    m = (dx*dx + dy*dy) <= BO*BO
    # bốn cuống cổng đâm ra rìa map
    for ten, (gx, gy), _ in CONG:
        if ten in ('bac', 'nam'):
            m |= (np.abs(x - gx) <= CUONG/2) & (np.minimum(y, H - y) >= 60)
        else:
            m |= (np.abs(y - gy) <= CUONG/2) & (np.minimum(x, W - x) >= 60)
    # cuống chỉ được nối THÔNG với lòng thành, không được chạy suốt map
    lab, _ = ndimage.label(m)
    giua = lab[int((H/2)//B), int((W/2)//B)]
    return lab == giua


def main():
    m = mat_na()
    p = np.pad(m.astype(float), 1)
    c = max(measure.find_contours(p, 0.5), key=len)
    c = measure.approximate_polygon(c, tolerance=0.8)
    dg = [[int(round(float(x - 1) * B)), int(round(float(y - 1) * B))] for y, x in c][:-1]

    dt = sum(dg[i][0]*dg[(i+1) % len(dg)][1] - dg[(i+1) % len(dg)][0]*dg[i][1]
             for i in range(len(dg)))
    pct = 100 * abs(dt) / 2 / (W * H)
    print(f'{len(dg)} đỉnh · sàn {pct:.1f}% khổ map ({W}×{H})', file=sys.stderr)
    for ten, (gx, gy), den in CONG:
        print(f'  cổng {ten:4s} ({gx},{gy}) → {den} · đứng được: {trong_da_giac(dg, gx, gy)}',
              file=sys.stderr)

    json.dump({'w': W, 'h': H, 'diTrong': dg}, open('/tmp/ardhaven.json', 'w'))
    print('    diTrong: [')
    for i in range(0, len(dg), 6):
        print('      ' + ' '.join(f'[{x},{y}],' for x, y in dg[i:i+6]))
    print('    ],')


def trong_da_giac(dg, x, y):
    trong = False
    j = len(dg) - 1
    for i in range(len(dg)):
        xi, yi = dg[i]; xj, yj = dg[j]
        if (yi > y) != (yj > y) and x < (xj-xi) * (y-yi) / (yj-yi) + xi:
            trong = not trong
        j = i
    return trong


if __name__ == '__main__':
    main()
