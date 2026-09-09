#!/usr/bin/env python3
"""Cắt lối đá trong tranh Tầng Sâu thành map hoang dã "Aquatic Tribe Causeway" (`caungam`).

Vì sao tấm này đáng cắt: đo độ chi tiết (chênh lệch cục bộ ở thang thân nhân vật, đo Ở ĐÚNG KHỔ
sẽ vẽ ra) thì dải gốc đạt 17,89 — ngang đúng tấm chi tiết nhất đang chạy trong game, và gấp 2,4
lần tấm Quảng Trường Cũ đã duyệt (7,57). Kéo ×2 còn 14,38, vẫn gần gấp đôi tấm đã duyệt. Đây
khác hẳn ba lần phóng to hỏng trước (xem cham_map.py): lần đó kéo tranh THƯA cho đầy map to,
còn đây là tranh mực có nét, xuất phát từ nguồn chi tiết nhất dự án.

⚠ NHƯNG "CẮT DẢI NGANG" THÌ KHÔNG. Ý ban đầu là cắt một dải ngang rồi kéo thành hành lang
6400×1400. Đo mặt nạ lối đá trên NGUYÊN tấm mới thấy con đường không chạy ngang: nó đi từ trên
xuống (x 818-1091, y 269-704), bẻ qua cầu, rồi sang phải-xuống (x 1198-1579, y 727-1090). Cắt
một dải ngang là cắt ĐÔI con đường — dải y 250-850 chỉ chứa được 60% bên phải, khúc dẫn vào mất
sạch. Nên map này cắt theo VÙNG BAO của chính con đường, không theo một khung định sẵn.

Vùng đi được suy thẳng từ tranh: lối đá SÁNG và NHẠT MÀU, nước thì tối và ngả lam. Cùng lối đo
vật liệu cục bộ đã dùng ở can_tu_tranh.py — câu hỏi "điểm này là đá hay nước" là câu màu sắc
trả lời được, và kiểm lại được bằng mắt.

Chạy:  python3 tools/iso/cat_tangsau.py
"""
import json, math, os, sys

import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure

NGUON = 'public/game/assets/maps/bg_dungeon_stone.jpg'
RA_ANH = 'public/game/assets/maps/bg_caungam.jpg'
# ⚠ HỆ SỐ KÉO KHÔNG PHẢI CHUYỆN THẨM MỸ — NÓ LÀ BỀ NGANG LÀN.
# ×2 thì chỗ thắt nhất của con đường chỉ còn 296px, mà `test_sandat` đòi làn ≥340px (≈3,5 thân
# người) mới còn đánh nhau được — và phép đo ấy còn trừ thêm 14px bán kính va chạm mỗi bên. Kéo
# ×2,8 đưa chỗ thắt lên 414px, dư biên. Đổi lại độ chi tiết tụt 14,4 → ~13,3, vẫn gần gấp đôi
# tấm Quảng Trường Cũ đã duyệt (7,57), nên đây là đổi chác đúng chiều.
KEO = 2.8
# Lề 150px cũ làm sàn chỉ còn 23,7% khổ map — DƯỚI sàn 25% mà `test_domap` đặt cho map dạng làn.
# Lề không phải nội dung: cắt sát lại còn 60px thì sàn lên 28,8% mà cổng vẫn đủ chỗ đặt sát rìa.
LE = 60


def mat_na_da(a):
    """Lối đá: sáng và nhạt màu. Nước tối và ngả lam, vách đá tối."""
    g = a.mean(2)
    mx, mn = a.max(2), a.min(2)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    m = (g > 0.46) & (s < 0.30)
    m = ndimage.binary_opening(m, np.ones((5, 5)))
    return ndimage.binary_closing(m, np.ones((15, 15)))


def loi_di(m, toi_thieu=9000):
    """Giữ những mảnh ĐỦ TO, hàn lại, rồi chọn mảnh THON DÀI nhất — không phải TO nhất.

    ⚠ CHỌN THEO DIỆN TÍCH LÀ SAI, và sai im lặng. Mặt nạ đá bắt cả mảng vách đá sáng ở góc
    trên-phải, mà mảng ấy 38.614 điểm — TO HƠN cả con đường (23.818 + 25.931 nhưng đứt làm hai
    ở chỗ cầu). Lấy mảnh lớn nhất thì ra vách đá: bộ cắt chạy trót lọt, in ra một map 700×504
    trông hợp lệ, mà vùng đi được là một mặt vách dựng đứng.

    Thứ tách chúng ra là HÌNH DẠNG: đường là dải hẹp mà trải xa, vách là khối bè. Đo bằng
    đường chéo hộp bao chia căn bậc hai diện tích — đo được vách 2,3 còn đường 5,0, cách nhau
    đủ xa để không phải căn ngưỡng.
    """
    lab, _ = ndimage.label(m)
    dem = np.bincount(lab.ravel()); dem[0] = 0
    to = np.isin(lab, np.where(dem >= toi_thieu)[0])
    # ⚠ PHÉP HÀN PHẢI RỘNG HƠN CÁI KHE NÓ CẦN HÀN. Nở 41px không nối nổi khúc trên (x 818-1091)
    # với khúc dưới (x 1198-1579) vì khe ngang ở chỗ cầu rộng ~107px — mặt cầu tối hơn hai đầu
    # nên đứt. Bộ chọn khi ấy chỉ lấy được NỬA DƯỚI con đường, và vẫn in ra một map trông hợp lệ.
    han = ndimage.binary_dilation(to, np.ones((121, 121)))
    lab2, k = ndimage.label(han)
    tot, best = None, -1
    for i in range(1, k + 1):
        ys, xs = np.nonzero(lab2 == i)
        dt = len(ys)
        if dt < toi_thieu:
            continue
        cheo = math.hypot(xs.max() - xs.min(), ys.max() - ys.min())
        thon = cheo / math.sqrt(dt)
        print(f'  mảnh {i}: {dt} điểm · chéo {cheo:.0f} · thon {thon:.2f}', file=sys.stderr)
        if thon > best:
            best, tot = thon, i
    return lab2 == tot


NV_CAO = 132                  # thân nhân vật trong game — thang đo của mọi con số dưới đây
LAN_TOI_THIEU = 360           # test_sandat đòi 340; chừa 20px biên cho phép xấp xỉ đa giác
DA_RX, DA_RY = 62, 32         # test_domap chỉ tính "vật che" khi bề ngang ≥ 0,40 × NV_CAO = 53px
# Chỗ ĐÃ CÓ NGƯỜI: điểm thả, điểm tới của hai lối rìa, hai cổng, bốn trùm vùng. Toạ độ chấm từ
# chính đa giác này (xem MAPS.caungam trong data/canbang.js) và tảng đá phải tránh chúng — bản
# đầu không tránh và nó đặt một tảng đè lên cổng đi Bird Tribe Heights: cổng nằm trong đá thì
# `test_noimap` mục 3 bắt ngay, mà nếu lọt thì người chơi không ra khỏi map được.
CAM = [(470, 620, 230), (330, 500, 230), (1850, 2600, 230),      # điểm thả + hai điểm tới
       (320, 900, 230), (1850, 2380, 230),                        # hai cổng rìa
       (1000, 1560, 200), (1620, 1800, 200), (2100, 1900, 200), (2520, 1960, 200)]   # trùm vùng


def trong_da_giac(dg, x, y):
    """Bản sao đúng phép của trongDaGiac() trong game.js — cùng luật thì cùng câu trả lời."""
    trong = False
    j = len(dg) - 1
    for i in range(len(dg)):
        xi, yi = dg[i]; xj, yj = dg[j]
        if (yi > y) != (yj > y) and x < (xj-xi) * (y-yi) / (yj-yi) + xi:
            trong = not trong
        j = i
    return trong


def _di_duoc(dg, da, x, y, r=14):
    """Đứng được ở đây không — hỏi y như inObstacle(key, x, y, 14) của bài kiểm."""
    if not trong_da_giac(dg, x, y):
        return False
    for ox, oy, rx, ry in da:
        if ((x-ox)/(rx+r))**2 + ((y-oy)/(ry+r))**2 < 1:
            return False
    return True


def lan_hep_nhat(dg, da, W, H):
    """Chép đúng phép đo của test_sandat: mỗi lát cắt DỌC lấy ĐOẠN TRỐNG DÀI NHẤT, rồi lấy lát
    mỏng nhất trong số đó. Đo ở đây để bộ cắt tự bắt lỗi, thay vì đợi bài kiểm bắt hộ."""
    hep, hx = 10**9, 0
    for x in range(120, W-120, 80):
        dai = run = 0
        co = False
        for y in range(40, H-40, 8):
            if _di_duoc(dg, da, x, y):
                co = True; run += 8; dai = max(dai, run)
            else:
                run = 0
        if not co:
            continue
        if dai < hep:
            hep, hx = dai, x
    return (0 if hep == 10**9 else hep), hx


def ke_da(dg, W, H):
    """Rải tảng đá cỡ trận đánh vào TRONG làn — món nợ #142 giải tạm bằng vật cản, chưa phải tranh.

    Ba ràng buộc cùng lúc, nên đặt bằng tay là đặt sai:
      · `test_domap` đòi ≥8% ô đi được nằm trong tầm 120px của một khối ≥0,40 thân người —
        không có gì để nấp thì trận đánh chỉ là đứng yên bấm chiêu;
      · `test_sandat` đòi làn không thắt dưới 340px — đá đặt giữa làn là bịt làn;
      · đá phải nằm hẳn trong đa giác, không thì nó là một vệt sơn trên mặt nước.
    Cách thoả cả ba: chỉ nhận điểm LỆCH MỘT BÊN (cách mép trong khoảng vừa đủ ôm trọn tảng đá
    nhưng không quá xa), và nhận từng tảng một — nhận xong đo lại làn, thắt quá thì trả lại.
    """
    lay = []
    buoc = 90
    for y in range(60, H-60, buoc):
        for x in range(60, W-60, buoc):
            if not trong_da_giac(dg, x, y):
                continue
            # cách mép bao nhiêu: dò bằng tám hướng, đủ dùng cho hình đa giác trơn
            xa = min(_ra_mep(dg, x, y, dx, dy) for dx, dy in
                     ((1,0), (-1,0), (0,1), (0,-1), (.7,.7), (-.7,.7), (.7,-.7), (-.7,-.7)))
            if not (DA_RY + 30 <= xa <= DA_RY + 130):   # lệch hẳn về một bên làn, không ra giữa
                continue
            if any((x-a)**2 + (y-b)**2 < r*r for a, b, r in CAM):
                continue
            lay.append((x, y, xa))
    lay.sort(key=lambda t: -t[2])
    da, cho = [], []
    for x, y, _ in lay:
        if any((x-a)**2 + (y-b)**2 < 430**2 for a, b in cho):
            continue
        thu = da + [(x, y, DA_RX, DA_RY)]
        if lan_hep_nhat(dg, thu, W, H)[0] < LAN_TOI_THIEU:
            continue
        da = thu; cho.append((x, y))
    return da


def _ra_mep(dg, x, y, dx, dy, xa=260):
    b = 0
    while b < xa and trong_da_giac(dg, x + dx*b, y + dy*b):
        b += 8
    return b


def main():
    im = Image.open(NGUON).convert('RGB')
    a = np.asarray(im, float) / 255
    duong = loi_di(mat_na_da(a))
    ys, xs = np.nonzero(duong)
    x0, x1 = max(0, xs.min() - LE), min(im.width,  xs.max() + LE)
    y0, y1 = max(0, ys.min() - LE), min(im.height, ys.max() + LE)
    print(f'vùng bao con đường: x {xs.min()}-{xs.max()} · y {ys.min()}-{ys.max()}', file=sys.stderr)
    print(f'cắt (kèm lề {LE}px): ({x0},{y0})-({x1},{y1}) = {x1-x0}×{y1-y0}', file=sys.stderr)

    cat = im.crop((x0, y0, x1, y1))
    W, H = int(round((x1 - x0) * KEO)), int(round((y1 - y0) * KEO))
    to = cat.resize((W, H), Image.LANCZOS)
    to.save(RA_ANH, quality=92)
    print(f'map: {W}×{H} (kéo ×{KEO}) → {RA_ANH} '
          f'({os.path.getsize(RA_ANH)/1024:.0f} KB · giải nén {W*H*4/1e6:.1f} MB RAM)', file=sys.stderr)

    # ── vùng đi được, đưa về toạ độ map ──
    d = duong[y0:y1, x0:x1]
    # nở thêm cho đủ bề ngang đi lại: thân nhân vật 95px ở khổ map, tức 95/KEO ở khổ gốc
    d = ndimage.binary_dilation(d, np.ones((17, 17)))
    d = ndimage.binary_closing(d, np.ones((25, 25)))
    d = ndimage.binary_fill_holes(d)
    p = np.pad(d.astype(float), 1)
    c = max(measure.find_contours(p, 0.5), key=len)
    c = measure.approximate_polygon(c, tolerance=2.2)
    dg = [[int(round(float(x - 1) * KEO)), int(round(float(y - 1) * KEO))] for y, x in c][:-1]

    dt = sum(dg[i][0]*dg[(i+1) % len(dg)][1] - dg[(i+1) % len(dg)][0]*dg[i][1] for i in range(len(dg)))
    pct = 100 * abs(dt) / 2 / (W * H)
    kc = ndimage.distance_transform_edt(d)          # khoảng cách tới mép, theo pixel GỐC
    print(f'{len(dg)} đỉnh · sàn {pct:.1f}% khổ map · chỗ rộng nhất {2*kc[d].max()*KEO:.0f}px '
          f'(thân nhân vật {NV_CAO}px)', file=sys.stderr)

    da = ke_da(dg, W, H)
    hep, hx = lan_hep_nhat(dg, da, W, H)
    print(f'{len(da)} tảng đá che · làn thắt nhất {hep}px ở x={hx} '
          f'(test_sandat đòi ≥{LAN_TOI_THIEU})', file=sys.stderr)

    # ── ảnh soi: xanh = đi được, đỏ = tảng đá ──
    v = np.asarray(to).copy()
    dd = np.asarray(Image.fromarray(d.astype('uint8') * 255).resize((W, H), Image.NEAREST)) > 127
    v[dd] = (v[dd]*0.55 + np.array([90, 255, 130])*0.45).astype('uint8')
    yy, xx = np.mgrid[0:H, 0:W]
    for o in da:
        m = ((xx-o[0])/o[2])**2 + ((yy-o[1])/o[3])**2 < 1
        v[m] = (v[m]*0.3 + np.array([255, 80, 60])*0.7).astype('uint8')
    Image.fromarray(v).resize((W//3, H//3)).save('/tmp/caungam_soi.png')
    json.dump({'w': W, 'h': H, 'diTrong': dg,
               'da': [{'x': o[0], 'y': o[1], 'rx': o[2], 'ry': o[3]} for o in da]},
              open('/tmp/caungam.json', 'w'))
    print('    diTrong: [')
    for i in range(0, len(dg), 6):
        print('      ' + ' '.join(f'[{x},{y}],' for x, y in dg[i:i+6]))
    print('    ],')
    print('  caungam: [')
    for i in range(0, len(da), 4):
        print('    ' + ' '.join(f'{{ x:{x}, y:{y}, rx:{rx}, ry:{ry} }},' for x, y, rx, ry in da[i:i+4]))
    print('  ],')


if __name__ == '__main__':
    main()
