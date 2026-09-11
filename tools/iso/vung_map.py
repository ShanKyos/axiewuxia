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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cham_map

BUOC = 32                 # ô lưới, px. Nhỏ hơn vung_rong.py (64) vì map 2600x1900 bé hơn nhiều
BAN_DIEM = 300            # bán kính đĩa quanh một điểm nội dung
BAN_NOI = 190             # bề rộng nửa dải nối hai điểm
SAN_TOI_THIEU = 55.0      # %, ngưỡng test_sandat cho map hoang dã

# Ngưỡng NHẬN của một map, đo bằng chính lưới tìm đường của game (xem cham_map.py) chứ không
# bằng diện tích đa giác. Ba con số này là ba bài kiểm đang gác, đã chừa lề:
MUC_O_TRONG = 58.0        # % ô lưới còn trống — test_domap đòi ≥55, chừa 3 điểm lề
TRAN_VONG = 2.0           # tỉ lệ vòng xấu nhất, đo trên lưới 5x4 như test_obstacles ③
LE_NO = 6.0               # lề nở thêm trên MUC_O_TRONG, để dành cho lùm ăn vào
TRAN_DIEN = 88.0          # % khung, trần diện tích đa giác — quá đây thì hình thành khung map
SAN_CUNG = 56.0           # sàn CỨNG khi phải hạ để đủ lùm — vẫn trên ngưỡng 55 của test_domap
LUM_TOI_THIEU = 5         # map hoang dã ít hơn chừng này lùm thì đi đâu cũng như nhau
def TRAN_KINH(W, H):      # trần đường kính giãn theo đường chéo map — khớp TRAN.duongKinhTiLe
    return (2600 / math.hypot(2600, 1900)) * math.hypot(W, H)


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


def _trong_vat_can(vatcan, x, y, r=170):
    """Điểm có nằm trong (hoặc sát) một vật cản tĩnh không — hồ, vách, nhà."""
    for o in vatcan:
        if o.get('hop'):
            cx = min(max(x, o['x']), o['x'] + o['wd']); cy = min(max(y, o['y']), o['y'] + o['ht'])
            if (x - cx) ** 2 + (y - cy) ** 2 < r * r: return True
        else:
            dx = (x - o['x']) / (o['rx'] + r); dy = (y - o['y']) / (o['ry'] + r)
            if dx * dx + dy * dy < 1: return True
    return False


# Bán kính cấm đặt tâm lùm ĐI KÈM TỪNG ĐIỂM, do lay_diem.cjs tính ngay trong game (phần tử
# thứ tư của mỗi điểm). Không có bảng hằng số ở đây — chép tay là sai, đã đo.
def _ban_cam(q):
    return q[3] if len(q) > 3 else 260


def lum_cay(m, dg, tranh, vatcan=(), n=26, cach=340, mep=260, hat=11):
    """Tâm lùm chặn NẰM TRONG sàn, tránh mọi điểm nội dung — thứ làm map rộng có nghĩa.

    `tranh` là danh sách [nhãn, x, y] của lay_diem.cjs; mỗi nhãn có bán kính cấm riêng (xem
    CAM ở trên), và `cach` chỉ là khoảng cách giữa hai lùm với nhau.

    ⚠ `vatcan` KHÔNG phải tham số trang trí. Bản đầu không có nó, và hậu quả đo được ở
    test_obstacles là 16 · 10 · 6 · 24 · 41 · 22 · 56 cây "mọc giữa hồ" trên bảy map —
    100% đến từ lùm, không một cây nào đến từ rai(). Tâm lùm rơi vào hồ thì cả mười bốn
    gốc của nó rơi theo. Bán kính đệm 170px vì tán lùm rộng 190px: tâm cách mép hồ chừng
    ấy thì phần với tay vào hồ còn lại đủ nhỏ để bộ lọc lúc chạy trong raiCum() dọn nốt.
    """
    rng = np.random.default_rng(hat)
    gh, gw = m.shape
    ra = []
    for _ in range(n * 260):
        if len(ra) >= n: break
        gx, gy = rng.integers(0, gw), rng.integers(0, gh)
        if not m[gy, gx]: continue
        x, y = int(gx * BUOC), int(gy * BUOC)
        if not trong_dg(dg, x, y): continue
        if _trong_vat_can(vatcan, x, y): continue
        if any(math.dist((x, y), (q[1], q[2])) < _ban_cam(q) for q in tranh): continue
        if any(math.dist((x, y), q) < cach for q in ra): continue
        # cách MÉP một quãng, không thì lùm dính vào rìa và không tạo được lối vòng
        if min(math.dist((x, y), d) for d in dg) < mep: continue
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
    diem = [(q[1], q[2]) for q in d['diem']]
    vatcan = d.get('vatCan', [])
    if not diem:
        diem = [(W * 0.25, H * 0.5), (W * 0.5, H * 0.5), (W * 0.75, H * 0.5)]
    m = dung_mien(W, H, diem)

    # ── ① NỞ ĐA GIÁC CHO TỚI KHI SÀN ĐI ĐƯỢC ĐẠT NGƯỠNG ───────────────────────────────────
    # Bản đầu đo "sàn" bằng DIỆN TÍCH ĐA GIÁC và dừng ở 75%. Nhưng thứ test_domap đo là % ô
    # lưới tìm đường CÒN TRỐNG, và giữa hai số ấy là toàn bộ MAP_OBSTACLES. Đo ra khoảng cách:
    # Dusk Marsh 73,9% diện tích → 50,8% ô trống, mất 23,1 điểm cho đúng sáu cái hộp; Bird Tribe
    # Heights mất 19,6; Bug Tribe Tunnels 18,6. Ba map ấy đỏ vì đa giác cắt thêm lần nữa vào chỗ
    # vật cản đã cắt rồi.
    #
    # Nên đo bằng chính công thức của lưới (cham_map.cham) và NỞ dần tới khi đạt. Nở giữ nguyên
    # vịnh và mũi của hình, chỉ làm chúng nông đi — vẫn là hình hữu cơ, không thành hình chữ nhật.
    #
    # Nở tới ngưỡng CỘNG LỀ chứ không tới đúng ngưỡng: lùm sẽ ăn tiếp vào phần này, và lùm mới
    # là thứ làm map có lối vòng. Nở vừa đủ 58% rồi thì không còn chỗ nhận lùm nào — đã thử,
    # ra Beast Herd Camp đúng MỘT lùm và Werebear Woods tỉ lệ vòng 1,008, tức map phẳng lì.
    # Dừng sớm khi mặt nạ hết nở được (đã kín khung) để khỏi quay không.
    #
    # Nở tới ngưỡng CỘNG LỀ chứ không tới đúng ngưỡng: lùm sẽ ăn tiếp vào phần này, và lùm mới
    # là thứ làm map có lối vòng. Nở vừa đủ 58% rồi thì không còn chỗ nhận lùm nào — đã thử,
    # ra Beast Herd Camp đúng MỘT lùm và Werebear Woods tỉ lệ vòng 1,008, tức map phẳng lì.
    #
    # ⚠ VÀ CÓ TRẦN DIỆN TÍCH, vì nở không giới hạn thì hình tan ra thành KHUNG MAP. Đã đo:
    # bỏ trần thì Bug Tribe Tunnels · Bird Tribe Heights · Dusk Marsh đều dừng ở 97,7% diện
    # tích với ĐÚNG BỐN ĐỈNH — tức một hình chữ nhật. Chúng là ba map có tường đá chạy dọc
    # mép khung, nên nở tới đâu cũng còn "đi được", và phép đo không hề kêu. Sàn viên mà viền
    # là khung máy thì mất sạch cái nó sinh ra để có.
    #
    # Trần là ƯU TIÊN, ba phép đo là YÊU CẦU: chừng nào còn một phép đo đỏ thì vẫn nở tiếp,
    # kể cả quá trần. Dusk Marsh đúng vào diện này — bốn khối đá giữa map ép đường vòng lên
    # 2856px, phải nở tới 92,0% (16 đỉnh) mới kéo được xuống 2424px.
    dg = vien(m)
    for _ in range(18):
        do = cham_map.cham(W, H, dg, [], vatcan, d['diem'])
        dat = (do['thoang'] >= MUC_O_TRONG and do['duongKinh'] <= TRAN_KINH(W, H)
               and do['vongMax'] <= TRAN_VONG)
        dien = dien_tich(dg, W, H)
        if dat and (do['thoang'] >= MUC_O_TRONG + LE_NO or dien >= TRAN_DIEN): break
        if dien >= 97.0: break                     # kín khung rồi, nở nữa cũng không đổi gì
        m2 = ndimage.binary_dilation(m, np.ones((3, 3)))
        if m2.sum() == m.sum(): break
        m = m2; dg = vien(m)
    do = cham_map.cham(W, H, dg, [], vatcan, d['diem'])

    # ── ② NGÂN SÁCH LÙM: nhận từng cái một, chừng nào các phép đo còn đứng ────────────────
    # Lùm là thứ làm map rộng có nghĩa, nên KHÔNG chốt cứng một con số. Nhưng mỗi lùm cũng ăn
    # mất sàn và kéo dài đường đi, mà map nào vật cản tĩnh đã dày thì nó ăn vào đúng phần mỏng
    # còn lại. Nên rải dư rồi nhận dần: giữ lùm nào vẫn để ba phép đo đứng trên ngưỡng.
    #
    # Hai lượt, vì hai điều cùng đúng mà kéo ngược nhau. Lượt một giữ sàn rộng rãi (58%). Lượt
    # hai lo cho map nào lượt một để lại quá ít lùm: một map hoang dã chỉ có MỘT lùm thì đi đâu
    # cũng như nhau — đo được Bird Tribe Heights nhận đúng 1/10 và Bug Tribe Tunnels 3/9, trong
    # khi Beast Herd Camp nhận 6. Nên hạ sàn xuống mức CỨNG 56% (vẫn trên ngưỡng 55 của
    # test_domap) cho tới khi đủ số lùm tối thiểu, thay vì để map thành bãi phẳng.
    ung = lum_cay(m, dg, d['diem'], vatcan, n=16, cach=300, mep=200)
    cum, dat = [], do
    for san in (MUC_O_TRONG, SAN_CUNG):
        if san is SAN_CUNG and len(cum) >= LUM_TOI_THIEU: break
        for c in ung:
            if c in cum: continue
            if san is SAN_CUNG and len(cum) >= LUM_TOI_THIEU: break
            thu = cham_map.cham(W, H, dg, cum + [c], vatcan, d['diem'])
            if thu['thoang'] < san: continue
            if thu['duongKinh'] > TRAN_KINH(W, H): continue
            if thu['vongMax'] > TRAN_VONG: continue
            cum.append(c); dat = thu

    pct = dien_tich(dg, W, H)
    ngoai = [(q[0], q[1], q[2]) for q in d['diem'] if not trong_dg(dg, q[1], q[2])]
    ok = bool(not ngoai and dat['thoang'] >= SAN_CUNG and dat['hong'] == 0
          and dat['duongKinh'] <= TRAN_KINH(W, H) and dat['vongMax'] <= TRAN_VONG)
    print(f'{khoa:<10} {W}x{H} · {len(dg)} đỉnh · diện tích {pct:5.1f}% · ô trống {dat["thoang"]:5.1f}% · '
          f'{len(cum)}/{len(ung)} lùm · kính {dat["duongKinh"]} · vòng {dat["vongMax"]} · '
          f'{len(ngoai)} điểm ngoài sàn' + ('' if ok else '   ✗ CHƯA ĐẠT'), file=sys.stderr)
    if ngoai: print('           ngoài: ' + str(ngoai[:6]), file=sys.stderr)
    return {'khoa': khoa, 'w': W, 'h': H, 'diTrong': dg, 'isoCum': cum,
            'san': pct, 'oTrong': dat['thoang'], 'kinh': dat['duongKinh'],
            'vong': dat['vongMax'], 'ok': ok}


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
