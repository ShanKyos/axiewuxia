#!/usr/bin/env python3
"""Sinh hình đất cho BỐN map dựng lại từ tranh NHÌN NGANG sang khuôn Rẻo Rừng Corran.

Bốn tấm nền cũ (`ngoai` · `tuyettinh` · `mongco` · `nhanmon`) là tranh SÂN KHẤU nhìn ngang:
đáy tấm có một dải sàn mỏng 6-32%, phần trên là trời/núi/tường cây. Mà `game.js` kéo tranh nền
phủ kín thế giới rồi cho đi khắp mặt tranh — nên tranh nền CHÍNH LÀ mặt đất, và đi lên phía bắc
map là đi vào bầu trời. Đó là toàn bộ nguyên nhân của lỗi "nhân vật lơ lửng trên không trung".

Bộ này không vá tranh. Nó dựng lại bốn map theo đúng công thức Corran: sàn lát viên isometric
(`sanIso`) + đa giác đi được sinh bằng máy (`diTrong`) + lùm chặn trong lòng sàn (`isoCum`) +
đường mòn nối những chỗ người chơi thật sự đi (`isoDuong`).

⚠ KHÁC vung_rong.py ở một chỗ cốt lõi: THUỲ ĐẶT THEO TRÙM VÙNG, không chấm tay. `BOSS_DEFS`
khai toạ độ TỈ LỆ, nên đổi khổ map là trùm tự dời — và rất dễ rơi ra ngoài đa giác mới. Bản
Corran chữa bằng cách thêm tay hai thuỳ ở đúng y=0,884. Làm thế cho bốn map là bốn lần dò tay.
Ở đây mỗi trùm tự kéo theo một thuỳ, nên thêm/bớt trùm là hình đất tự theo.

Chạy:  python3 tools/iso/vung_bon.py > /tmp/bon.json
"""
import json, math, sys

import numpy as np
from scipy import ndimage
from skimage import measure

sys.path.insert(0, __file__.rsplit('/', 1)[0])
from vung_rong import vien, lum_cay, _rai_deu, _uon   # noqa: E402


def _sau_nhat(m, buoc, phia, ban=3):
    """Điểm sâu nhất về một phía, NHƯNG chỉ xét dải GIỮA của trục vuông góc.

    ⚠ `vung_rong._sau_nhat` lấy cực trị thuần trên cả mặt nạ, và với map có góc vươn ra thì cực
    trị ấy rơi vào ĐÚNG MỘT GÓC. Đo được ở Bird Tribe Heights: cổng 'tay' và cổng 'bac' cùng trả
    (256,256) — hai cổng chồng lên nhau, mà bán kính bắt cổng là 90px nên người chơi bước tới sẽ
    bị một trong hai nuốt. Corran không dính vì nó chỉ mở hai cổng đông/tây, không có cổng bắc
    nào để mà đụng.

    Bó vào dải giữa (25-75% cạnh kia) vừa tách hai cổng ra, vừa làm hướng ĐỌC ĐÚNG: cổng bắc ở
    giữa mép bắc thì người chơi đi lên là gặp, không phải mò ra góc.
    """
    trong = ndimage.binary_erosion(m, np.ones((ban*2+1, ban*2+1)))
    gh, gw = m.shape
    oy, ox = np.nonzero(trong)
    if phia in ('tay', 'dong'):
        ok = (oy >= gh*0.25) & (oy <= gh*0.75)
    else:
        ok = (ox >= gw*0.25) & (ox <= gw*0.75)
    if ok.sum() < 4:
        ok = np.ones(len(oy), bool)
    oy, ox = oy[ok], ox[ok]
    k = {'tay': ox.argmin, 'dong': ox.argmax, 'bac': oy.argmin, 'nam': oy.argmax}[phia]()
    return int(ox[k] * buoc), int(oy[k] * buoc)


# ── BỐN MAP ────────────────────────────────────────────────────────────────────────────────
# `ria` là những mép map phải có cổng. Tên hướng ở đây là hướng ĐI RA trên chính map này, đúng
# quy ước của GATES — và hai đầu một lối phải nằm ở hai mép ĐỐI NHAU.
#
# ⚠ HAI LỐI CŨ ĐANG NGƯỢC QUY ƯỚC, và dựng lại là dịp sửa: comoc đi ra hướng BẮC sang mongco
# thì đầu bên mongco phải ở mép NAM (cũ để 'Lối Tây'); mongco đi ra hướng ĐÔNG sang nhanmon thì
# đầu bên nhanmon phải ở mép TÂY (cũ để 'Lối Bắc'). Sai quy ước thì người chơi đọc hướng để
# định vị sẽ bị dẫn sai, mà không có bản đồ thế giới nào để đối chiếu.
MAPS = {
  'ngoai': dict(
    W=4400, H=3300, hat=7,
    ria={'bac': ('ardhaven', 'Qua Cổng Thành → Sapidae Chiefdom')},
    tha='bac',
    ntrum=4, thuoc=8,
  ),
  'tuyettinh': dict(
    W=4800, H=3600, hat=13,
    ria={'tay': ('ardhaven', 'Lối Về Thành → Sapidae Chiefdom'),
         'bac': ('caungam',  'Lối Bắc → Aquatic Tribe Causeway')},
    tha='tay',
    ntrum=4, thuoc=0,
  ),
  'mongco': dict(
    W=5000, H=3700, hat=19,
    ria={'nam':  ('comoc',   'Lối Nam → Bug Tribe Tunnels'),
         'dong': ('nhanmon', 'Lối Đông → Dusk Marsh')},
    tha='nam',
    ntrum=4, thuoc=0,
  ),
  'nhanmon': dict(
    W=5200, H=3800, hat=29,
    ria={'tay': ('mongco', 'Lối Tây → Reptile Sunstone Flats')},
    tha='tay',
    ntrum=4, thuoc=0,
  ),
}

# ⚠ ĐIỂM TỚI LÙI DỌC MÉP, VÀ LÙI VỀ PHÍA MÉP — không lùi vào trong.
# Nó phải thoả HAI điều kéo ngược nhau: cách cổng >90px (bán kính bắt cổng — gần hơn thì vừa
# vào map là bị hút ngược trở ra), NHƯNG vẫn <400px tính từ rìa map (test_noimap: cổng tên
# "Lối ..." là cổng RÌA, tới nơi mà đứng giữa map thì không đọc ra là giáp ranh).
# `_sau_nhat` đã đặt cổng lùi sẵn 192px vào trong (3 ô) để bán kính bắt cổng không thò ra ngoài
# sàn, nên lùi thêm VÀO TRONG là cộng dồn: đo được điểm tới nam của mongco ra 427px, đỏ bài.
# Phần lớn lùi DỌC mép (120px) cho đủ khoảng cách, phần nhỏ lùi RA PHÍA MÉP (45px) cho gần rìa.
LUI = {'tay': (-45, -120), 'dong': (45, 120), 'bac': (120, -45), 'nam': (-120, 45)}
THA = {'tay': (250, 70), 'dong': (-250, -70), 'bac': (70, 250), 'nam': (-70, -250)}


def dung_mien(W, H, hat, buoc=64):
    """Sàn = hợp của một SỐNG uốn quét ngang map + một thuỳ cho MỖI TRÙM VÙNG.

    Thuỳ theo trùm là chỗ khác vung_rong.py — xem đầu tệp. Nhờ nó, bốn map có bốn bộ trùm khác
    nhau mà không phải dò tay thuỳ nào cho map nào.
    """
    rng = np.random.default_rng(hat)
    gh, gw = H // buoc, W // buoc
    yy, xx = np.mgrid[0:gh, 0:gw].astype(float)
    m = np.zeros((gh, gw), bool)

    # SỐNG chính — chạm gần hai mép đông/tây để cổng rìa nào cũng nối ra được
    n = 26
    pha = rng.uniform(0, 6.283)
    for i in range(n):
        t = i / (n - 1)
        cx = (0.035 + 0.93 * t) * gw
        cy = (0.50 + 0.20 * math.sin(t * 4.1 + pha) + 0.07 * math.sin(t * 9.3)) * gh
        r = (0.30 + 0.11 * math.sin(t * 3.3 + 1.9)) * gh
        m |= (xx - cx) ** 2 + (yy - cy) ** 2 < r * r

    # SỐNG PHỤ dọc — map rộng cần đất ở cả bắc lẫn nam, nếu không sống ngang cho ra một cái đai
    for i in range(14):
        t = i / 13
        cx = (0.22 + 0.58 * math.sin(t * 2.7 + pha * 0.5)) * gw
        cy = (0.08 + 0.84 * t) * gh
        m |= (xx - cx) ** 2 + (yy - cy) ** 2 < (0.20 * gh) ** 2

    # THUỲ lệch — mấy khoảnh phình ra trên/dưới, cho map có chỗ để lạc vào
    for cx, cy, r in [(0.22, 0.19, 0.22), (0.46, 0.82, 0.24), (0.70, 0.16, 0.21),
                      (0.86, 0.74, 0.20), (0.33, 0.62, 0.18), (0.60, 0.42, 0.19),
                      (0.10, 0.55, 0.17), (0.93, 0.38, 0.17)]:
        m |= (xx - cx * gw) ** 2 + (yy - cy * gh) ** 2 < (r * gh) ** 2

    # VỊNH khoét từ ngoài vào — mép không có chỗ lõm thì nhìn ra hình bầu dục
    for cx, cy, r in [(0.30, -0.03, 0.13), (0.58, 1.04, 0.15),
                      (0.80, -0.02, 0.12), (0.04, 1.03, 0.11)]:
        m &= ~((xx - cx * gw) ** 2 + (yy - cy * gh) ** 2 < (r * gh) ** 2)

    m = ndimage.binary_closing(m, np.ones((3, 3)))
    lab, k = ndimage.label(m)
    if k > 1:
        dem = np.bincount(lab.ravel()); dem[0] = 0
        m = lab == dem.argmax()
    return m


def dat_trum(m, buoc, n, tha, diemtoi, W, H, hat):
    """Đặt TRÙM VÙNG bằng máy, xếp theo KHOẢNG CÁCH TỚI ĐIỂM THẢ.

    Trùm của một map lên cấp dần (Trụ Vệ 1 → 2 → 3 → Trấn Ải), nên thứ tự theo khoảng cách
    KHÔNG phải chuyện bố cục mà là chuyện cân bằng: đi càng sâu càng gặp con mạnh hơn. Bản cũ
    chấm tay bốn tỉ lệ cho cả bốn map — và ba map dùng chung đúng hai giá trị (0,42·0,80 và
    0,86·0,80), tức là ba Trấn Ải đứng cùng một chỗ. Đó chính là bệnh nhân bản mà CLAUDE.md mô tả.

    ⚠ RÀNG BUỘC CỨNG: cách MỌI điểm tới ≥700px (test_bossplace — 260 truy đuổi + lề). Đây là lý
    do không thể giữ tỉ lệ cũ khi đổi khổ map: chúng được chấm cho khung 2600×1900.
    """
    rng = np.random.default_rng(hat)
    trong = ndimage.binary_erosion(m, np.ones((7, 7)))
    oy, ox = np.nonzero(trong)
    cand = [(int(ox[k] * buoc), int(oy[k] * buoc)) for k in range(len(oy))]
    cand = [p for p in cand if all(math.dist(p, q) >= 700 for q in diemtoi)]
    if len(cand) < n * 4:
        return None
    cand.sort(key=lambda p: math.dist(p, tha))
    ra, buoc_dai = [], len(cand) // n
    for i in range(n):
        lo = cand[i * buoc_dai:(i + 1) * buoc_dai] or cand
        rng.shuffle(lo)
        for p in lo:
            if all(math.dist(p, q) >= 900 for q in ra):
                ra.append(p); break
        else:
            return None
    return ra


def duong_mon(m, buoc, cong, tha, moc_phu):
    """Đường mòn nối những chỗ NGƯỜI CHƠI THẬT SỰ ĐI — cổng, điểm thả, chỗ hái thuốc.

    Map rộng không dùng lại được luật "đường mòn = dải xa mép nhất" của map làn: gần như cả map
    đều xa mép, nên luật ấy biến cả map thành bãi đất viền một vành cỏ. Xem sanIsoDung().
    """
    moc = list(cong) + [tha]
    giua = sorted(moc_phu, key=lambda p: p[0])
    truc = moc[:1] + giua[1::2] + moc[1:]
    if len(truc) < 2:
        truc = moc + giua
    duong = [truc]
    for p in giua[0::2] + moc[2:]:
        gan = min(truc, key=lambda q: (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2)
        if gan != p:
            duong.append([gan, p])
    return [_uon(d) for d in duong if len(d) >= 2]


def trong_dg(dg, x, y):
    c, j = False, len(dg) - 1
    for i in range(len(dg)):
        xi, yi = dg[i]; xj, yj = dg[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi:
            c = not c
        j = i
    return c


def lam(mid, C):
    W, H, BUOC = C['W'], C['H'], 64
    for hat in range(C['hat'], C['hat'] + 60):        # dò hạt tới khi mọi phép kiểm đạt
        m = dung_mien(W, H, hat, BUOC)
        cong, toi = {}, {}
        for phia in C['ria']:
            g = _sau_nhat(m, BUOC, phia)
            cong[phia] = g
            toi[phia] = (g[0] + LUI[phia][0], g[1] + LUI[phia][1])
        gtha = cong[C['tha']]
        tha = (gtha[0] + THA[C['tha']][0], gtha[1] + THA[C['tha']][1])
        diemtoi = list(toi.values()) + [tha]
        trum = dat_trum(m, BUOC, C['ntrum'], tha, diemtoi, W, H, hat)
        if trum is None:
            continue
        moc = list(cong.values()) + list(toi.values()) + [tha] + trum
        thuoc = _rai_deu(m, BUOC, C['thuoc'], 540, moc) if C['thuoc'] else []
        dg = vien(m, BUOC)

        dt = 0.0
        for i in range(len(dg)):
            a, b = dg[i], dg[(i + 1) % len(dg)]
            dt += a[0] * b[1] - b[0] * a[1]
        pct = 100 * abs(dt) / 2 / (W * H)

        ngoai = [p for p in moc + thuoc if not trong_dg(dg, *p)]
        # test_bossplace: mọi ĐIỂM TỚI phải cách MỌI trùm vùng ≥700px
        gan = [(q, t, round(math.dist(q, t))) for q in diemtoi for t in trum
               if math.dist(q, t) < 700]
        # test_noimap: điểm tới của lối rìa phải <400px tính từ một mép map
        xa_ria = [(p, min(p[0], p[1], W - p[0], H - p[1])) for p in toi.values()
                  if min(p[0], p[1], W - p[0], H - p[1]) >= 400]
        # cổng cách điểm tới >90px (bán kính bắt cổng)
        sat = [(k, round(math.dist(cong[k], toi[k]))) for k in cong
               if math.dist(cong[k], toi[k]) <= 90]
        if not (ngoai or gan or xa_ria or sat) and pct >= 58:
            break
    else:
        print(f'✗ {mid}: không dò được hạt nào đạt', file=sys.stderr)
        print(f'   sàn {pct:.1f}% · ngoài {ngoai} · gần trùm {gan} · xa rìa {xa_ria} · sát {sat}',
              file=sys.stderr)
        sys.exit(1)

    duong = duong_mon(m, BUOC, list(cong.values()), tha, thuoc or list(toi.values()) + trum[:2])
    tren_duong = [q for d in duong for a, b in zip(d, d[1:])
                  for q in [(a[0] + (b[0] - a[0]) * t / 6, a[1] + (b[1] - a[1]) * t / 6)
                            for t in range(7)]]
    cum = lum_cay(m, BUOC, moc + thuoc + tren_duong, n=42, cach_noi_dung=330, hat=hat + 5)

    print(f'{mid:10s} {W}×{H} hạt {hat} · {len(dg)} đỉnh · sàn {pct:.1f}% · {len(cum)} lùm · '
          f'điểm tới gần trùm nhất {min(round(math.dist(q, t)) for q in diemtoi for t in trum)}px',
          file=sys.stderr)
    return dict(w=W, h=H, diTrong=dg, isoCum=[list(c) for c in cum],
                trum=[[round(x / W, 4), round(y / H, 4)] for x, y in trum],
                isoDuong=[[[round(x), round(y)] for x, y in d] for d in duong],
                spawn=dict(x=tha[0], y=tha[1]),
                cong={k: dict(x=cong[k][0], y=cong[k][1], to=C['ria'][k][0], name=C['ria'][k][1])
                      for k in cong},
                toi={C['ria'][k][0]: dict(x=toi[k][0], y=toi[k][1]) for k in toi},
                thuoc=[dict(x=x, y=y) for x, y in thuoc])


if __name__ == '__main__':
    print(json.dumps({k: lam(k, C) for k, C in MAPS.items()}, ensure_ascii=False))
