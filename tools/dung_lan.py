#!/usr/bin/env python3
"""Sinh hình học một map dạng LÀN — hành lang ngang có nút thắt, hai hàng cây men theo mép.

Vì sao sinh bằng máy chứ không gõ tay: một hành lang 6400px cần ~40 đỉnh đa giác và ~90 cái cây
đặt đúng mép. Gõ tay thì lần chỉnh nào cũng phải gõ lại, và mép cây với mép đa giác sẽ lệch nhau
— cây mọc giữa đường, hoặc mép đường trống hoác. Sinh từ MỘT đường tim thì cả hai luôn khớp.

Đường tim uốn nhẹ hình sin. Bề ngang thắt lại ở các nút để chia làn thành khoảnh: nút thắt là
thứ cho người chơi CẢM được mình vừa sang một chặng mới mà không cần một dòng chữ nào.

Chạy:  python3 tools/dung_lan.py
"""
import math

W, H = 6400, 1400
TIM_Y, BIEN_DO, CHU_KY = 700, 170, 1.5      # đường tim: y = TIM_Y + BIEN_DO*sin(...)
RONG_NUA = 250                               # nửa bề ngang chỗ rộng nhất → làn rộng 500px
NUT = [0.30, 0.62]                           # nút thắt ở đâu (tỉ lệ chiều dài)
NUT_NUA = 175                                # nửa bề ngang chỗ thắt → 350px, vẫn đủ đánh nhau
NUT_ROND = 0.055                             # nút thắt loang rộng bao nhiêu

def tim(x):
    return TIM_Y + BIEN_DO * math.sin(x / W * 2 * math.pi * CHU_KY)

def nua_rong(x):
    """Nửa bề ngang tại x — hẹp dần về phía nút thắt rồi nở lại."""
    r = RONG_NUA
    for n in NUT:
        d = abs(x / W - n)
        if d < NUT_ROND:
            k = 0.5 * (1 + math.cos(math.pi * d / NUT_ROND))   # 1 ở tâm nút, 0 ở rìa
            r = min(r, RONG_NUA - (RONG_NUA - NUT_NUA) * k)
    return r

def da_giac(buoc=200):
    """Đa giác đi được: mép trên chạy xuôi, mép dưới chạy ngược — một vòng khép kín."""
    xs = list(range(60, W - 59, buoc)) + [W - 60]
    tren = [(x, round(tim(x) - nua_rong(x))) for x in xs]
    duoi = [(x, round(tim(x) + nua_rong(x))) for x in reversed(xs)]
    return tren + duoi

def hang_cay(le=95, buoc=165, lop=3):
    """Hai hàng cây men theo mép làn, lùi ra ngoài `le` px để không mọc đè lên đường.

    `lop` hàng chồng lên nhau, mỗi hàng lùi thêm — hàng trong che chân, hàng ngoài dựng khối
    rừng. Hàng DƯỚI (y lớn) là thứ vẽ ĐÈ lên người chơi và cho ra cảm giác đang ở TRONG rừng.
    """
    ra = []
    for i in range(lop):
        lech = le + i * 150
        # so le nửa bước mỗi lớp để không thành ba hàng thẳng tắp như trồng rừng công nghiệp
        for x in range(40 + (i % 2) * (buoc // 2), W - 40, buoc):
            r = nua_rong(x)
            for phia in (-1, 1):
                y = tim(x) + phia * (r + lech)
                if 40 < y < H - 40:
                    # cây xa (y nhỏ) vẽ nhỏ hơn một chút — gợi chiều sâu mà không cần phối cảnh thật
                    s = 0.85 + 0.30 * (y / H) + 0.12 * ((x // buoc) % 3) / 2
                    ra.append((round(x), round(y), round(s, 2)))
    return ra

def js_diem(ds, moi_dong=6, thut='      '):
    d = []
    for i in range(0, len(ds), moi_dong):
        d.append(thut + ' '.join('[%d,%d],' % p for p in ds[i:i + moi_dong]))
    return '\n'.join(d).rstrip(',')

def main():
    dg = da_giac()
    cay = hang_cay()
    dt = 0.0
    for i in range(len(dg)):
        a, b = dg[i], dg[(i + 1) % len(dg)]
        dt += a[0] * b[1] - b[0] * a[1]
    dt = abs(dt) / 2
    print('// đa giác %d đỉnh · sàn %.1f%% khổ map · %d cây'
          % (len(dg), 100 * dt / (W * H), len(cay)))
    print('    diTrong: [')
    print(js_diem(dg))
    print('    ],')
    print('    vatDat: [')
    for i in range(0, len(cay), 5):
        print('      ' + ' '.join('{ x:%d, y:%d, s:%s },' % c for c in cay[i:i + 5]))
    print('    ],')

if __name__ == '__main__':
    main()
