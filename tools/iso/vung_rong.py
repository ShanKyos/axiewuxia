#!/usr/bin/env python3
"""Sinh VÙNG ĐI ĐƯỢC cho map KHÁM PHÁ rộng — và mấy lùm cây chặn nằm bên trong nó.

Vì sao có tệp này. Lối Mòn Corran dựng theo lối LÀN: hành lang dài, hai bên bịt kín, một
đường tiến. Chủ dự án xem xong nói đúng hai điều: hình ấy hợp PHÓ BẢN, còn map khám phá thì
phải DÀI VÀ RỘNG, đặt được quái, đi lại hợp lý. Đây là bộ sinh cho vế thứ hai.

⚠ RỘNG KHÔNG CÓ NGHĨA LÀ TRỐNG. Một đa giác to hình bầu dục thì đi đâu cũng như nhau, và cái
"rộng" ấy đọc ra thành nhàm chứ không thành tự do. Thứ làm map rộng có nghĩa là VẬT CẢN NẰM
TRONG LÒNG nó: lùm cây, vỉa đá, khiến người chơi phải vòng, phải chọn lối, phải kéo quái quanh
một gốc cây. Nên tệp này sinh HAI thứ, không phải một:

  · `diTrong` — vùng đi được, mép lồi lõm có vịnh có mũi, KHÔNG phải bầu dục.
  · `isoCum`  — tâm các lùm cây chặn NẰM TRONG vùng ấy. Mỗi lùm sinh một vật cản thật.

Cách dựng mép: hợp của một dãy đĩa đặt dọc một SỐNG uốn lượn quét ngang map, cộng thêm mấy
thuỳ lệch. Hợp của đĩa thì bao giờ cũng liền khối (không bao giờ cắt map làm hai — kiểu hỏng mà
test_sandat ⑤ gác), mà mép lại tự có vịnh với mũi, không cần bịa harmonic.

Chạy:  python3 tools/iso/vung_rong.py
"""
import json, math, sys

import numpy as np
from scipy import ndimage
from skimage import measure


def _diem_phai_trong(W, H):
    """Những chỗ máy BẮT BUỘC đặt được người/quái/cổng — đọc từ chính bảng game, không bịa."""
    return []


def dung_mien(W, H, hat=7, buoc=64):
    """Trả về mặt nạ bool (H/buoc, W/buoc) của vùng đi được."""
    rng = np.random.default_rng(hat)
    gh, gw = H // buoc, W // buoc
    yy, xx = np.mgrid[0:gh, 0:gw].astype(float)
    m = np.zeros((gh, gw), bool)

    # ── SỐNG chính: uốn ngang map từ tây sang đông, chạm gần hai mép để hai cổng nối ra được ──
    n = 26
    for i in range(n):
        t = i / (n - 1)
        cx = (0.035 + 0.93 * t) * gw
        cy = (0.50 + 0.20 * math.sin(t * 4.1 + 0.7) + 0.07 * math.sin(t * 9.3)) * gh
        r = (0.30 + 0.11 * math.sin(t * 3.3 + 1.9)) * gh
        m |= (xx - cx) ** 2 + (yy - cy) ** 2 < r * r

    # ── THUỲ lệch: mấy khoảnh phình ra trên/dưới, cho map có chỗ để lạc vào ──
    for cx, cy, r in [(0.22, 0.19, 0.22), (0.46, 0.82, 0.24), (0.70, 0.16, 0.21),
                      (0.86, 0.74, 0.20), (0.33, 0.62, 0.18), (0.60, 0.42, 0.19),
                      (0.10, 0.55, 0.17), (0.93, 0.38, 0.17)]:
        m |= (xx - cx * gw) ** 2 + (yy - cy * gh) ** 2 < (r * gh) ** 2

    # ── VỊNH khoét vào từ ngoài: mép mà không có chỗ lõm thì nhìn ra hình bầu dục ──
    for cx, cy, r in [(0.30, -0.02, 0.13), (0.56, 1.03, 0.15), (0.79, -0.01, 0.12), (0.12, 0.99, 0.12)]:
        m &= ~((xx - cx * gw) ** 2 + (yy - cy * gh) ** 2 < (r * gh) ** 2)

    m = ndimage.binary_closing(m, np.ones((3, 3)))
    lab, k = ndimage.label(m)
    if k > 1:                       # chỉ giữ mảnh to nhất — sàn phải LIỀN, xem test_sandat ⑤
        dem = np.bincount(lab.ravel()); dem[0] = 0
        m = lab == dem.argmax()
    _ = rng
    return m


def vien(m, buoc, don=26):
    """Mép mặt nạ → danh sách đỉnh, đã giản lược."""
    p = np.pad(m.astype(float), 1)
    cs = measure.find_contours(p, 0.5)
    c = max(cs, key=len)
    c = measure.approximate_polygon(c, tolerance=don / buoc)
    # find_contours trả (hàng, cột) = (y, x); đổi về (x, y) thế giới
    return [[int(round((x - 1) * buoc)), int(round((y - 1) * buoc))] for y, x in c][:-1]


def lum_cay(m, buoc, tranh, n=46, cach_nhau=430, cach_noi_dung=430, hat=11):
    """Tâm các LÙM CHẶN nằm trong lòng vùng. Đây là thứ làm map rộng có nghĩa — xem đầu tệp.

    Hai luật, và luật thứ hai là luật đắt hơn:
      · cách nhau ≥ `cach_nhau` → giữa hai lùm bao giờ cũng còn lối đi lọt;
      · cách MỌI ĐIỂM NỘI DUNG ≥ `cach_noi_dung` → không lùm nào mọc đè lên cổng, điểm thả,
        bãi quái hay chỗ hái thuốc. Thiếu luật này thì test_sandat ④ đỏ ngay, mà tệ hơn là
        người chơi vào map thấy mình kẹt trong một bụi cây.
    """
    rng = np.random.default_rng(hat)
    gh, gw = m.shape
    # co vào trong 2 ô: lùm sát mép thì nửa ngoài rơi ra ngoài vùng, nhìn như cây mọc lơ lửng
    trong = ndimage.binary_erosion(m, np.ones((5, 5)))
    oy, ox = np.nonzero(trong)
    ra = []
    for _ in range(n * 400):
        if len(ra) >= n:
            break
        k = rng.integers(len(oy))
        x, y = int(ox[k] * buoc), int(oy[k] * buoc)
        if any((x-a)**2 + (y-b)**2 < cach_nhau**2 for a, b in ra):
            continue
        if any((x-a)**2 + (y-b)**2 < cach_noi_dung**2 for a, b in tranh):
            continue
        ra.append((x, y))
    return ra


def _sau_nhat(m, buoc, phia, ban=3):
    """Điểm nằm SÂU trong vùng nhất về một phía — chỗ đặt cổng ra rìa map.

    Không lấy điểm cực tây/đông thuần tuý: chỗ ấy là một mũi nhọn rộng chừng một ô, cổng đặt
    vào đó thì bán kính bắt cổng 90px thò hẳn ra ngoài sàn. Lấy điểm cực trị TRONG phần đã co
    vào `ban` ô, tức chỗ vừa xa mép map vừa có đất quanh mình.
    """
    trong = ndimage.binary_erosion(m, np.ones((ban*2+1, ban*2+1)))
    oy, ox = np.nonzero(trong)
    k = ox.argmin() if phia == 'tay' else ox.argmax()
    return int(ox[k] * buoc), int(oy[k] * buoc)


def _rai_deu(m, buoc, n, cach, tranh, hat=23):
    """`n` điểm trong vùng, cách nhau ≥`cach` và tránh danh sách `tranh`. Dùng cho chỗ hái thuốc."""
    rng = np.random.default_rng(hat)
    trong = ndimage.binary_erosion(m, np.ones((5, 5)))
    oy, ox = np.nonzero(trong)
    ra = []
    for _ in range(n * 600):
        if len(ra) >= n:
            break
        k = rng.integers(len(oy))
        x, y = int(ox[k] * buoc), int(oy[k] * buoc)
        if any((x-a)**2 + (y-b)**2 < cach**2 for a, b in ra + list(tranh)):
            continue
        ra.append((x, y))
    return ra


def duong_mon(m, buoc, tay, dong, moc_phu):
    """ĐƯỜNG MÒN cho map rộng — và đây là chỗ luật của map làn KHÔNG dùng lại được.

    Ở hành lang, "đường mòn = dải xa mép nhất" là luật đúng: chỗ xa hai bìa rừng nhất chính là
    chỗ người ta giẫm. Bê nguyên luật ấy sang map rộng thì gần như CẢ MAP đều xa mép, và cái
    nền ra một bãi đất mênh mông viền một vành cỏ mỏng — đúng thứ thấy trong ảnh lát thử đầu
    tiên của bản rộng. "Rộng" biến thành "trống", y như lời cảnh báo ở đầu tệp này, mà lần này
    tôi tự đi vào.

    Luật đúng cho map rộng: đường mòn nối những chỗ NGƯỜI CHƠI THẬT SỰ ĐI — cổng, điểm thả,
    chỗ hái thuốc. Nhờ vậy nó vừa hợp lý (mòn vì có người đi) vừa CHỈ ĐƯỜNG: nhìn vệt đất là
    biết đi đâu, không cần một dòng chữ hướng dẫn nào.
    """
    # Trục chính tây-đông, bẻ qua vài mốc để không thành một đường thẳng kẻ ngang map
    giua = sorted(moc_phu, key=lambda p: p[0])
    truc = [tay] + giua[1::2] + [dong]
    duong = [truc]
    # nhánh cụt rẽ ra mấy mốc còn lại: map khám phá cần chỗ để đi lệch khỏi trục
    for p in giua[0::2]:
        gan = min(truc, key=lambda q: (q[0]-p[0])**2 + (q[1]-p[1])**2)
        duong.append([gan, p])
    return [_uon(d) for d in duong]


def _uon(tuyen, buoc=280, lech=110, hat=31):
    """Bẻ mỗi đoạn thẳng thành nhiều khúc ngắn, xô ngang một chút.

    Đoạn thẳng nối hai mốc thì đường mòn ra một CON ĐƯỜNG KẺ: thẳng băng, bẻ góc vuông vức ở
    mỗi mốc. Thấy rõ trong ảnh lát thử — nhìn ra đường nhựa chứ không ra lối mòn. Xô ngang theo
    một hàm sin lệch pha thì nó lượn, mà vẫn đi đúng từ mốc này sang mốc kia.
    """
    rng = np.random.default_rng(hat)
    ra = []
    for a, b in zip(tuyen, tuyen[1:]):
        dx, dy = b[0]-a[0], b[1]-a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy/L, dx/L                       # pháp tuyến của đoạn
        n = max(2, int(L // buoc))
        pha = rng.uniform(0, 6.283)
        for i in range(n):
            t = i / n
            e = math.sin(t * math.pi) * math.sin(t * 5.1 + pha) * lech   # tắt về 0 ở hai đầu mốc
            ra.append((a[0] + dx*t + nx*e, a[1] + dy*t + ny*e))
    ra.append(tuyen[-1])
    return ra


def main():
    W, H = 5200, 3800                 # gấp đôi Rẻo Rừng Corran cũ (2600×1900) theo cả hai chiều
    BUOC = 64
    m = dung_mien(W, H, buoc=BUOC)
    # ⚠ SUY TOẠ ĐỘ NỘI DUNG TỪ VÙNG, ĐỪNG NHÂN ĐÔI TOẠ ĐỘ CŨ RỒI CHẠY THEO VÁ. Lượt đầu tôi
    # nhân đôi 13 toạ độ của bản 2600×1900 rồi bắt vùng phải trùm hết — bốn điểm rơi ra ngoài,
    # và chữa bằng cách bẻ vùng cho vừa từng điểm thì cái mép hết còn tự nhiên. Vùng vẽ trước,
    # nội dung đặt sau, theo đúng hình nó có.
    tay = _sau_nhat(m, BUOC, 'tay')
    dong = _sau_nhat(m, BUOC, 'dong')
    # điểm thả và hai điểm tới nằm lùi vào trong so với cổng, để vào map không bị hút ngược ra
    tha = (tay[0] + 260, tay[1] + 60)
    tu_chungnam = (tay[0] + 190, tay[1] - 40)
    tu_loimon = (dong[0] - 210, dong[1] + 40)
    moc = [tay, dong, tha, tu_chungnam, tu_loimon]
    thuoc = _rai_deu(m, BUOC, 8, 620, moc)
    TRANH = moc + thuoc
    dg = vien(m, BUOC)
    duong = duong_mon(m, BUOC, tay, dong, thuoc)
    # lùm chặn phải tránh cả ĐƯỜNG MÒN, không chỉ tránh điểm nội dung: một lùm mọc giữa đường
    # thì đường mòn dẫn thẳng vào bụi cây.
    tren_duong = [q for d in duong for a, b in zip(d, d[1:])
                  for q in [(a[0] + (b[0]-a[0])*t/6, a[1] + (b[1]-a[1])*t/6) for t in range(7)]]
    cum = lum_cay(m, BUOC, TRANH + tren_duong, cach_noi_dung=330)
    # ── kiểm, mỗi phép một dòng: bịa ra một đa giác đẹp mà máy không dùng được thì vô ích ──
    dt = 0.0
    for i in range(len(dg)):
        a, b = dg[i], dg[(i + 1) % len(dg)]
        dt += a[0]*b[1] - b[0]*a[1]
    pct = 100 * abs(dt) / 2 / (W * H)

    def trong_dg(x, y):
        c = False
        j = len(dg) - 1
        for i in range(len(dg)):
            xi, yi = dg[i]; xj, yj = dg[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi:
                c = not c
            j = i
        return c

    ngoai = [p for p in TRANH if not trong_dg(*p)]
    print(f'khổ {W}×{H} · {len(dg)} đỉnh · sàn {pct:.1f}% '
          f'(test_sandat đòi ≥55% cho map hoang dã)', file=sys.stderr)
    print(f'{len(cum)} lùm chặn · {len(ngoai)} điểm nội dung nằm NGOÀI sàn'
          + (': ' + str(ngoai) if ngoai else ''), file=sys.stderr)
    if ngoai or pct < 58:
        print('✗ CHƯA ĐẠT — chỉnh sống/thuỳ rồi chạy lại', file=sys.stderr)
        sys.exit(1)

    print('    diTrong: [')
    for i in range(0, len(dg), 6):
        print('      ' + ' '.join(f'[{x},{y}],' for x, y in dg[i:i+6]))
    print('    ],')
    print('    isoCum: [' + ' '.join(f'[{x},{y}],' for x, y in cum) + '],')
    print('    isoDuong: [')
    for d in duong:
        print('      [' + ' '.join(f'[{int(x)},{int(y)}],' for x, y in d) + '],')
    print('    ],')
    print(f'\n    // cổng tây {tay} · cổng đông {dong}', file=sys.stderr)
    print(f'    spawn {tha} · từ chungnam {tu_chungnam} · từ loimon {tu_loimon}', file=sys.stderr)
    print('    chỗ hái thuốc: ' + ' '.join(f'{{ x:{x}, y:{y} }},' for x, y in thuoc), file=sys.stderr)
    json.dump({'w': W, 'h': H, 'diTrong': dg, 'isoCum': cum, 'isoDuong': duong,
               'tay': tay, 'dong': dong,
               'tha': tha, 'tuChungnam': tu_chungnam, 'tuLoimon': tu_loimon, 'thuoc': thuoc},
              open('/tmp/iso/corran.json', 'w'))


if __name__ == '__main__':
    main()
