#!/usr/bin/env python3
"""Sinh hình đất + khối nhà cho THÀNH LỚN Ardhaven — 6400×3200.

## Vì sao 6400×3200 (tỉ lệ 2,0) chứ không phải một hình gần vuông

Đo từ toạ độ NPC thành Tương Dương của Võ Lâm Chi Mộng (đọc trong các bài tin phiên bản):
x trải 35→285 mà y chỉ trải 100→161. Tức nội dung nằm trong một BĂNG NGANG, và hai cụm nặng
ký nhất (sân đấu ở rìa đông, cụm lễ hội ở rìa tây) cách nhau gần 250 đơn vị — đi từ đầu này
sang đầu kia là một quãng có thật. Ardhaven lấy đúng tỉ lệ ấy.

## ⚠ THÀNH RỖNG LÀ THÀNH RỚT BÀI KIỂM — và đây là chỗ dễ làm sai nhất

`test_domap` KHÔNG miễn `matDo` cho thành (chỉ `thoang` và `soLoai` mới được miễn khi map không
có bãi quái). Mật độ tính trên số Ô ĐI ĐƯỢC, nên map càng rộng và càng TRỐNG thì càng khó đạt:

    6400×3200, sàn 80% → 28.302 ô đi được → cần ≥ 37 điểm nội dung
    6400×3200, sàn 35% → 12.382 ô đi được → cần ≥ 17 điểm nội dung

37 NPC là vô lý; 17 thì đúng bằng 4 cổng + 13 NPC. Nên lời giải KHÔNG phải nhồi thêm NPC — mà
là dựng thành cho ra thành: nhà cửa chiếm phần lớn khung, chỉ chừa PHỐ để đi. Đó cũng là thứ
làm nó nhìn ra một cái thành thay vì một bãi cỏ có tường bao.

Vậy nên tệp này sinh HAI thứ: `diTrong` (lòng thành + bốn cuống cổng) và `khoiNha` (chân các
dãy nhà, đổ vào MAP_OBSTACLES.ardhaven). Phố là phần còn lại.

Chạy:  python3 tools/iso/dung_thanh.py
"""
import json, sys

import numpy as np
from scipy import ndimage
from skimage import measure

W, H = 6400, 3200
NV_CAO = 132
B = 20               # bước lưới raster (px) — đủ mịn cho đường bao mà vẫn nhanh
TUONG = 220          # bề dày tường tính từ rìa map vào
BO = 380             # bán kính bo bốn góc lòng thành
CUONG = 560          # bề ngang cuống cổng
NHA_W, NHA_H = 460, 340   # chân một dãy nhà
NGO = 200            # bề ngang ngõ giữa hai dãy — 1,5 thân người, đủ đi lọt
QT = 850             # bán kính quảng trường giữa (theo trục x; trục y lấy 0,6 lần)

# Bốn cổng: (tên, toạ độ trên rìa, map đi tới)
CONG = [
    ('bac',  (W//2, 150),      'tuyettinh'),
    ('nam',  (W//2, H - 150),  'ngoai'),
    ('tay',  (150, H//2),      'daohoa'),
    ('dong', (W - 150, H//2),  'chungnam'),
]

# Bốn khu nghề + quảng trường giữa. Xếp thành BĂNG NGANG theo tỉ lệ Tương Dương:
# trục chính Tây↔Đông, hai cụm nặng ký nhất (Phố Chợ và Phố Lò) đẩy ra hai đầu đối diện.
KHU = [
    ('Quảng Trường Atia', 3200, 1600),
    ('Phố Chợ',           1450, 1600),
    ('Phố Lò',            4950, 1600),
    ('Sân Chuồng',        2250, 2450),
    ('Sảnh Lệnh',         4150, 2450),
    ('Vách Gió',          2250,  750),
    ('Xóm Trọ',           4150,  750),
]

# Dãy nhà: (x, y, rộng, cao) — CHÂN nhà, toạ độ góc trên-trái. Bốn góc phần tư, mỗi góc một
# lưới, chừa hai trục cổng và quảng trường giữa để trống.
#
# ⚠ SỐ KHỐI NHÀ LÀ MỘT PHÉP ĐÁNH ĐỔI CÓ THẬT, không phải chuyện thẩm mỹ. `test_domap` tính mật
# độ trên số Ô ĐI ĐƯỢC và KHÔNG miễn cho thành, nên nhà càng thưa thì sàn càng rộng và càng cần
# nhiều điểm nội dung. Quét thử:
#     nhà 440×330, ngõ 160 → 32 khối · sàn 59,5% → cần ≥27,5 điểm
#     nhà 460×340, ngõ 200 → 16 khối · sàn 70,0% → cần ≥32,4 điểm
#     nhà 500×360, ngõ 180 → 12 khối · sàn 71,7% → cần ≥33,1 điểm
# Chọn 16: mỗi khối là chỗ đứng của MỘT công trình vẽ ra, mà bộ art chỉ có 10 cái — 32 khối thì
# mỗi cái phải lặp ba lần, lộ ngay. 16 khối × ~1,6 lần lặp thì chấp nhận được, và 4 cổng + 24
# NPC + 8 chỗ thảo dược = 36 điểm, thừa ngưỡng.
def khoi_nha():
    kh = []
    for qx0, qx1 in [(TUONG+60, W//2-CUONG//2-NGO), (W//2+CUONG//2+NGO, W-TUONG-60)]:
        for qy0, qy1 in [(TUONG+40, H//2-CUONG//2-NGO), (H//2+CUONG//2+NGO, H-TUONG-40)]:
            nx = max(1, int((qx1-qx0+NGO) // (NHA_W+NGO)))
            ny = max(1, int((qy1-qy0+NGO) // (NHA_H+NGO)))
            wq = nx*NHA_W + (nx-1)*NGO; hq = ny*NHA_H + (ny-1)*NGO
            ox = qx0 + ((qx1-qx0) - wq)//2; oy = qy0 + ((qy1-qy0) - hq)//2
            for i in range(nx):
                for j in range(ny):
                    kh.append((ox + i*(NHA_W+NGO), oy + j*(NHA_H+NGO), NHA_W, NHA_H))
    return [k for k in kh
            if not (abs(k[0]+k[2]/2 - W/2) < QT and abs(k[1]+k[3]/2 - H/2) < QT*0.6)]


def mat_na(kh):
    yy, xx = np.mgrid[0:H:B, 0:W:B]
    x, y = xx.astype(float), yy.astype(float)
    x0, y0, x1, y1 = TUONG + BO, TUONG + BO, W - TUONG - BO, H - TUONG - BO
    dx = np.maximum(0, np.maximum(x0 - x, x - x1))
    dy = np.maximum(0, np.maximum(y0 - y, y - y1))
    m = (dx*dx + dy*dy) <= BO*BO
    for ten, (gx, gy), _ in CONG:
        if ten in ('bac', 'nam'):
            m |= (np.abs(x - gx) <= CUONG/2) & (np.minimum(y, H - y) >= 60)
        else:
            m |= (np.abs(y - gy) <= CUONG/2) & (np.minimum(x, W - x) >= 60)
    lab, _ = ndimage.label(m)
    return lab == lab[int((H/2)//B), int((W/2)//B)]


def trong_da_giac(dg, x, y):
    trong = False
    j = len(dg) - 1
    for i in range(len(dg)):
        xi, yi = dg[i]; xj, yj = dg[j]
        if (yi > y) != (yj > y) and x < (xj-xi) * (y-yi) / (yj-yi) + xi:
            trong = not trong
        j = i
    return trong


def main():
    kh = khoi_nha()
    m = mat_na(kh)
    p = np.pad(m.astype(float), 1)
    c = max(measure.find_contours(p, 0.5), key=len)
    c = measure.approximate_polygon(c, tolerance=0.8)
    dg = [[int(round(float(x - 1) * B)), int(round(float(y - 1) * B))] for y, x in c][:-1]

    # sàn THẬT = trong đa giác VÀ ngoài mọi khối nhà
    yy, xx = np.mgrid[0:H:B, 0:W:B]
    trong = m.copy()
    for x, y, w, h in kh:
        trong &= ~((xx >= x) & (xx < x + w) & (yy >= y) & (yy < y + h))
    san = 100 * trong.mean()
    o_di = trong.sum() * (B/24) ** 2                 # quy về ô lưới 24px của navmesh
    print(f'{len(dg)} đỉnh · {len(kh)} khối nhà · sàn {san:.1f}% khổ map ({W}×{H})', file=sys.stderr)
    print(f'≈{o_di:.0f} ô đi được → cần ≥{1.30*o_di/1000:.1f} điểm nội dung (4 cổng + NPC)',
          file=sys.stderr)
    for ten, (gx, gy), den in CONG:
        print(f'  cổng {ten:4s} ({gx},{gy}) → {den} · đứng được: {trong_da_giac(dg, gx, gy)}',
              file=sys.stderr)

    json.dump({'w': W, 'h': H, 'diTrong': dg,
               'khoiNha': [{'x': x, 'y': y, 'wd': w, 'ht': h} for x, y, w, h in kh],
               'khu': [{'ten': t, 'x': x, 'y': y} for t, x, y in KHU]},
              open('/tmp/ardhaven.json', 'w'))
    print('    diTrong: [')
    for i in range(0, len(dg), 6):
        print('      ' + ' '.join(f'[{x},{y}],' for x, y in dg[i:i+6]))
    print('    ],')
    print('  ardhaven: [')
    for i in range(0, len(kh), 3):
        print('    ' + ' '.join(f'{{ x:{x}, y:{y}, wd:{w}, ht:{h} }},' for x, y, w, h in kh[i:i+3]))
    print('  ],')


if __name__ == '__main__':
    main()
