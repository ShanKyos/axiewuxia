#!/usr/bin/env python3
"""Sinh TRŨNG NỨT CORRAN — map thứ hai treo trên cùng một ngã với Lối Mòn Corran.

Vì sao có map này. Đo đồ thị thế giới thì ra một điều bất ngờ: nó ĐÃ là hình cây (hai ngã rẽ),
nhưng nội dung vẫn là một đường thẳng — các nhánh nối đuôi nhau về CẤP, nên ở bất kỳ cấp nào
cũng chỉ đúng một nhánh hợp. Rẽ không phải lựa chọn, nó là đường đi tiếp khoác áo ngã ba.
Cả game chỉ có một cặp trùng dải cấp, mà một cái lại là đầu cụt của cái kia.

Ngã ba THẬT cần hai nhánh cùng dải cấp, khác nhau ở thứ chúng CHO:

    corran (38-42)
     ├─ ĐÔNG → Lối Mòn Corran   42-48 · pk     · hành lang · cụt, phải quay lại
     └─ NAM  → Trũng Nứt Corran 44-50 · freepk · rộng      · ĐI TIẾP sang comoc

Chọn theo hai trục cùng lúc: an toàn ↔ rủi ro, và đường vòng ↔ đường tắt. Đi lối nguy hiểm thì
vừa được nhiều hơn vừa tới thẳng vùng sau — đó mới là một quyết định, không phải một lối đi.

Hình: sống uốn theo trục TÂY-ĐÔNG nhưng lệch hẳn xuống dưới, hai thuỳ sâu ở bắc để cổng bắc có
đất mà đứng. Nhỏ hơn Rẻo Rừng (4200×3200 so với 5200×3800) — nó là một cái trũng, không phải
một vùng rừng.

Chạy:  python3 tools/iso/sinh_trungnut.py
"""
import json, math, sys, os

sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from vung_rong import dung_mien, vien, lum_cay, duong_mon, _sau_nhat, _rai_deu

W, H, BUOC = 4200, 3200, 64
# Trùm vùng của map mới, khai theo TỈ LỆ như BOSS_DEFS vẫn làm — vùng phải chứa chúng.
# ⚠ Và phải cách MỌI điểm tới ≥700px (test_bossplace): vào map mà trùm đứng ngay cạnh cổng thì
# người chơi cấp vừa đủ vừa hiện ra đã ăn đòn. Bộ tự kiểm dưới bắt đúng ca đó ở lượt đầu —
# (0,20 · 0,30) cách cổng bắc 466px và (0,82 · 0,36) cách cổng đông 401px. Dời xuống giữa trũng.
TRUM = [(0.22, 0.52), (0.55, 0.78), (0.78, 0.66)]


def main():
    m = dung_mien(
        W, H, hat=19, buoc=BUOC,
        # sống lệch lên trên: cổng nam sẽ nằm trên hai thuỳ nam, không nằm trên sống
        song=dict(x0=0.05, x1=0.95, y0=0.44, bd=0.16, ck=3.2, pha=2.1, r0=0.27, rbd=0.10),
        thuy=[(0.17, 0.78, 0.21), (0.62, 0.80, 0.20),          # hai thuỳ NAM — chỗ cổng nam đứng
              (0.38, 0.18, 0.20), (0.80, 0.22, 0.19),
              (0.50, 0.50, 0.18), (0.92, 0.55, 0.17)]
             + [(fx, fy, 0.18) for fx, fy in TRUM],            # và mỗi trùm một thuỳ
        vinh=[(0.30, -0.04, 0.13), (0.72, 1.03, 0.12), (0.02, 0.14, 0.11)],
    )
    # ⚠ CỔNG VỀ CORRAN NẰM Ở MÉP NAM, không ở mép bắc — dù trũng nằm "dưới" Rẻo Rừng trên
    # bản đồ khái niệm. Game luôn đặt hai cổng của một lối ở HAI MÉP ĐỐI NHAU (Werebear "Lối
    # Đông" ↔ Corran "Lối Tây"), và người chơi đọc hướng để định vị. Corran mở lối này ở mép
    # BẮC của nó, nên đầu bên này phải là mép NAM.
    nam  = _sau_nhat(m, BUOC, 'nam')
    dong = _sau_nhat(m, BUOC, 'dong')
    # Điểm tới lùi CHÉO khỏi cổng: >90px (bán kính bắt cổng) mà vẫn <400px tính từ rìa map.
    # Xem chú thích cùng luật trong vung_rong.py — đây đúng là chỗ đã làm test_noimap đỏ một lần.
    tha        = (nam[0] + 90,  nam[1] - 240)
    tu_corran  = (nam[0] + 130, nam[1] - 35)
    tu_comoc   = (dong[0] - 35, dong[1] + 130)
    trum = [(round(fx * W), round(fy * H)) for fx, fy in TRUM]
    moc = [nam, dong, tha, tu_corran, tu_comoc] + trum
    thuoc = _rai_deu(m, BUOC, 10, 520, moc, hat=41)
    dg = vien(m, BUOC)
    duong = duong_mon(m, BUOC, nam, dong, thuoc)
    tren = [q for d in duong for a, b in zip(d, d[1:])
            for q in [(a[0] + (b[0]-a[0])*t/6, a[1] + (b[1]-a[1])*t/6) for t in range(7)]]
    cum = lum_cay(m, BUOC, moc + thuoc + tren, n=30, cach_nhau=400, cach_noi_dung=330, hat=53)

    # ── kiểm, y hệt bộ sinh gốc: đa giác đẹp mà máy không dùng được thì vô ích ──
    dt = sum(dg[i][0]*dg[(i+1) % len(dg)][1] - dg[(i+1) % len(dg)][0]*dg[i][1] for i in range(len(dg)))
    pct = 100 * abs(dt) / 2 / (W * H)

    def trong(x, y):
        c = False; j = len(dg) - 1
        for i in range(len(dg)):
            xi, yi = dg[i]; xj, yj = dg[j]
            if (yi > y) != (yj > y) and x < (xj-xi)*(y-yi)/(yj-yi+1e-9)+xi: c = not c
            j = i
        return c

    ngoai = [p for p in moc + thuoc if not trong(*p)]
    ria = lambda p: min(p[0], W-p[0], p[1], H-p[1])
    xa_ria = [(t, p, ria(p)) for t, p in (('từ corran', tu_corran), ('từ comoc', tu_comoc)) if ria(p) >= 400]
    gan_cong = [(t, p) for t, p, c in (('từ corran', tu_corran, nam), ('từ comoc', tu_comoc, dong))
                if math.dist(p, c) <= 90]
    # ⚠ ĐO TRÙM SO VỚI CẢ ĐIỂM TỚI, không chỉ so với cổng và điểm thả. Lượt trước tôi bỏ sót
    # đúng chỗ này, và test_bossplace bắt được — nhưng ở map LÁNG GIỀNG: cổng mới mở bên Rẻo
    # Rừng rơi cách trùm `co1` 216px, vì hai thuỳ nam sâu của Rẻo Rừng đều đã có trùm đứng sẵn.
    gan_trum = [(q, t, round(math.dist(q, t))) for q in (nam, dong, tha, tu_corran, tu_comoc)
                for t in trum if math.dist(q, t) < 700]
    print(f'khổ {W}×{H} · {len(dg)} đỉnh · sàn {pct:.1f}% (cần ≥58%)', file=sys.stderr)
    print(f'{len(cum)} lùm · {len(ngoai)} điểm ngoài sàn · {len(xa_ria)} điểm tới xa rìa · '
          f'{len(gan_cong)} điểm tới sát cổng · {len(gan_trum)} điểm tới sát trùm', file=sys.stderr)
    for nhan, ds in (('NGOÀI SÀN', ngoai), ('XA RÌA ≥400', xa_ria),
                     ('SÁT CỔNG ≤90', gan_cong), ('SÁT TRÙM <700', gan_trum)):
        if ds: print(f'  ✗ {nhan}: {ds}', file=sys.stderr)
    if ngoai or xa_ria or gan_cong or gan_trum or pct < 58:
        print('✗ CHƯA ĐẠT', file=sys.stderr); sys.exit(1)

    print(f'    // cổng nam {nam} · cổng đông {dong}', file=sys.stderr)
    print(f'    spawn {tha} · từ corran {tu_corran} · từ comoc {tu_comoc}', file=sys.stderr)
    print('    thuốc: ' + ' '.join('{ x:%d, y:%d },' % p for p in thuoc), file=sys.stderr)
    print('    trùm: ' + ' '.join(f'({fx},{fy})' for fx, fy in TRUM), file=sys.stderr)
    json.dump({'w': W, 'h': H, 'diTrong': dg, 'isoCum': cum, 'isoDuong': duong,
               'nam': nam, 'dong': dong, 'tha': tha, 'tuCorran': tu_corran,
               'tuComoc': tu_comoc, 'thuoc': thuoc, 'trum': TRUM},
              open('/tmp/iso/trungnut.json', 'w'))
    print('    diTrong: [')
    for i in range(0, len(dg), 6):
        print('      ' + ' '.join(f'[{x},{y}],' for x, y in dg[i:i+6]))
    print('    ],')


if __name__ == '__main__':
    main()
