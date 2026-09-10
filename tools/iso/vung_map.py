#!/usr/bin/env python3
"""Sinh VÙNG ĐI ĐƯỢC (`diTrong`) + lùm chặn (`isoCum`) cho MỌI map, từ dữ liệu game thật.

Khác `vung_rong.py` ở một điểm cốt lõi, và nó là lý do tệp này tồn tại:

    vung_rong.py  sinh một hình rồi KIỂM xem điểm nội dung có lọt vào không.
                  Không lọt thì báo đỏ, người sửa tham số rồi chạy lại.
    vung_map.py   MỌC RA TỪ chính các điểm nội dung.

Cách một hợp với map dựng riêng, có người ngồi chỉnh. Cách hai hợp với việc chuyển hàng loạt
tám map: bao trùm là tính chất CẤU TẠO chứ không phải kết quả may rủi, nên chạy một lượt cho
cả tám mà không map nào rơi ra ngoài.

Dựng mặt nạ theo ba lớp, hợp lại:
  ① đĩa quanh MỖI điểm nội dung — bảo đảm mọi thứ người chơi phải tới đều nằm trong sàn
  ② dải nối giữa các điểm theo cây khung nhỏ nhất — bảo đảm sàn LIỀN MỘT KHỐI, không đứt đôi
     (kiểu hỏng mà test_sandat ⑤ gác)
  ③ một sống uốn lượn + mấy thuỳ lệch — để mép có vịnh có mũi chứ không ra hình bầu dục

Rồi đóng hình (binary closing) cho liền, lấy đường bao lớn nhất, giản lược đỉnh.

Chạy:  python3 tools/iso/vung_map.py <khoá-map> [...]      (không truyền = làm hết map chưa có)
Đọc :  /tmp/iso/diem.json  — do tools/iso/lay_diem.cjs đổ ra từ game đang chạy
"""
import json, math, os, sys

import numpy as np
from scipy import ndimage
from skimage import measure

BUOC = 32                 # ô lưới, px. Nhỏ hơn vung_rong.py (64) vì map 2600x1900 bé hơn nhiều
BAN_DIEM = 300            # bán kính đĩa quanh một điểm nội dung
BAN_NOI = 190             # bề rộng nửa dải nối hai điểm
SAN_TOI_THIEU = 55.0      # %, ngưỡng test_sandat cho map hoang dã


def _dia(m, gw, gh, cx, cy, r):
    """Tô một đĩa vào mặt nạ lưới."""
    yy, xx = np.mgrid[0:gh, 0:gw]
    m |= ((xx - cx) ** 2 + (yy - cy) ** 2) <= r * r


def _cay_khung(dm):
    """Cây khung nhỏ nhất trên tập điểm (Prim, O(n²) — n ở đây chưa tới 40)."""
    n = len(dm)
    if n < 2: return []
    trong = {0}; canh = []
    while len(trong) < n:
        tot = None
        for i in trong:
            for j in range(n):
                if j in trong: continue
                d = math.dist(dm[i], dm[j])
                if tot is None or d < tot[0]: tot = (d, i, j)
        canh.append((tot[1], tot[2])); trong.add(tot[2])
    return canh


def dung_mien(W, H, diem, hat=7):
    gw, gh = W // BUOC, H // BUOC
    m = np.zeros((gh, gw), bool)
    g = [(x / BUOC, y / BUOC) for x, y in diem]

    # ① đĩa quanh từng điểm nội dung
    for cx, cy in g:
        _dia(m, gw, gh, cx, cy, BAN_DIEM / BUOC)

    # ② dải nối theo cây khung — sàn phải LIỀN, không được đứt thành hai mảnh
    for i, j in _cay_khung(g):
        (x0, y0), (x1, y1) = g[i], g[j]
        n = max(2, int(math.dist(g[i], g[j])))
        for t in np.linspace(0, 1, n):
            _dia(m, gw, gh, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, BAN_NOI / BUOC)

    # ③ sống uốn + thuỳ lệch: cho mép có vịnh có mũi thay vì bầu dục
    rng = np.random.default_rng(hat)
    n = 22
    for i in range(n):
        t = i / (n - 1)
        x = (0.06 + 0.88 * t) * gw
        y = (0.50 + 0.17 * math.sin(t * 4.1 + 0.7) + 0.05 * math.sin(t * 9.3)) * gh
        r = (0.20 + 0.07 * math.sin(t * 5.7 + 1.9)) * min(gw, gh)
        _dia(m, gw, gh, x, y, r)
    for _ in range(7):
        _dia(m, gw, gh, rng.uniform(0.12, 0.88) * gw, rng.uniform(0.15, 0.85) * gh,
             rng.uniform(0.10, 0.19) * min(gw, gh))

    # đóng hình cho liền rồi giữ MẢNH LỚN NHẤT — phòng khi một thuỳ lệch rơi tách ra
    m = ndimage.binary_closing(m, np.ones((5, 5)))
    lab, k = ndimage.label(m)
    if k > 1:
        m = lab == (1 + np.argmax([(lab == i + 1).sum() for i in range(k)]))
    m = ndimage.binary_fill_holes(m)
    return m


def vien(m, don=22):
    """Đường bao ngoài, đã giản lược đỉnh, trả về toạ độ px."""
    p = np.pad(m.astype(float), 1)
    ct = max(measure.find_contours(p, 0.5), key=len)
    ct = measure.approximate_polygon(ct, tolerance=0.9)
    dg = [(int(round((x - 1) * BUOC)), int(round((y - 1) * BUOC))) for y, x in ct]
    if dg and dg[0] == dg[-1]: dg.pop()
    while len(dg) > don:                       # bỏ dần đỉnh nông nhất
        i = min(range(len(dg)), key=lambda i: abs(
            (dg[i-1][0]-dg[i][0])*(dg[(i+1) % len(dg)][1]-dg[i][1]) -
            (dg[i-1][1]-dg[i][1])*(dg[(i+1) % len(dg)][0]-dg[i][0])))
        dg.pop(i)
    return dg


def trong_dg(dg, x, y):
    c = False; j = len(dg) - 1
    for i in range(len(dg)):
        xi, yi = dg[i]; xj, yj = dg[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi: c = not c
        j = i
    return c


def lum_cay(m, dg, tranh, n=26, cach=340, hat=11):
    """Tâm lùm chặn NẰM TRONG sàn, tránh mọi điểm nội dung — thứ làm map rộng có nghĩa."""
    rng = np.random.default_rng(hat)
    gh, gw = m.shape
    ra = []
    for _ in range(n * 260):
        if len(ra) >= n: break
        gx, gy = rng.integers(0, gw), rng.integers(0, gh)
        if not m[gy, gx]: continue
        x, y = int(gx * BUOC), int(gy * BUOC)
        if not trong_dg(dg, x, y): continue
        if any(math.dist((x, y), q) < cach for q in tranh + ra): continue
        # cách MÉP một quãng, không thì lùm dính vào rìa và không tạo được lối vòng
        if min(math.dist((x, y), d) for d in dg) < 260: continue
        ra.append((x, y))
    return ra


def dien_tich(dg, W, H):
    s = 0.0
    for i in range(len(dg)):
        a, b = dg[i], dg[(i + 1) % len(dg)]
        s += a[0] * b[1] - b[0] * a[1]
    return 100 * abs(s) / 2 / (W * H)


def lam(khoa, d):
    W, H = d['w'], d['h']
    diem = [(x, y) for _, x, y in d['diem']]
    if not diem:
        diem = [(W * 0.25, H * 0.5), (W * 0.5, H * 0.5), (W * 0.75, H * 0.5)]
    m = dung_mien(W, H, diem)
    dg = vien(m)
    pct = dien_tich(dg, W, H)
    ngoai = [(n, x, y) for n, x, y in d['diem'] if not trong_dg(dg, x, y)]
    cum = lum_cay(m, dg, diem)
    ok = not ngoai and pct >= SAN_TOI_THIEU
    print(f'{khoa:<10} {W}x{H} · {len(dg)} đỉnh · sàn {pct:5.1f}% · {len(cum)} lùm · '
          f'{len(ngoai)} điểm ngoài sàn' + ('' if ok else '   ✗ CHƯA ĐẠT'), file=sys.stderr)
    if ngoai: print('           ngoài: ' + str(ngoai[:6]), file=sys.stderr)
    return {'khoa': khoa, 'w': W, 'h': H, 'diTrong': dg, 'isoCum': cum, 'san': pct, 'ok': ok}


def main():
    d = json.load(open('/tmp/iso/diem.json'))
    khoa = sys.argv[1:] or [k for k in d if not d[k]['sanIso']]
    os.makedirs('/tmp/iso', exist_ok=True)
    ra, hong = {}, []
    for k in khoa:
        r = lam(k, d[k]); ra[k] = r
        if not r['ok']: hong.append(k)
    json.dump(ra, open('/tmp/iso/vung.json', 'w'))
    print(f'\nxong {len(ra)} map · hỏng: {hong or "không"}', file=sys.stderr)
    return 1 if hong else 0


if __name__ == '__main__':
    sys.exit(main())
