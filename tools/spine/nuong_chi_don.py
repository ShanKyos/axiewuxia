#!/usr/bin/env python3
"""Nướng thêm KHỐI TRÚNG ĐÒN cho 16 Chimera → assets/chimera/<id>_h.webp.

    python3 tools/spine/nuong_chi_don.py [--kit <đường-kit>]

Vì sao là tệp RIÊNG chứ không thêm cờ vào nuong_chi.py: bảng nhỏ và bảng quay đang được
`test_chianh` gác, và `data/chi_anh.js` là tệp sinh tự động. Đụng vào đường sinh ra chúng để
thêm một khối mới là đặt cược cả hai thứ đang chạy tốt. Tệp này chỉ GHI THÊM.

⚠ HỘP CẮT PHẢI GIỐNG HỆT bảng nhỏ, nếu không con vật NHẢY một cái mỗi lần đứng ↔ trúng đòn.
Nên ở đây dựng lại đúng phép tính hộp của nuong_chi.py (bb tính trên appear+idle), rồi mới
đem hộp đó đi cắt khung TRÚNG ĐÒN. Tốn công nướng thừa 28 khung mỗi con, nhưng đổi lại không phải
tin vào một con số chép tay nào.

Rig Chimera có 41 hoạt cảnh; game đang dùng 3 (đứng · hiện hình · chạy). Đây là cái thứ 4.

Vì sao đáng nướng: CLAUDE.md ghi "Trúng đòn và chết vẫn giữ AXIE — cố ý", tức lớp nhân vật
KHÔNG được nháy ra mỗi lần ăn đòn. Nhưng thế thì lúc trúng đòn con Axie đứng trơ — người
chơi thấy số máu tụt mà thân hình không phản ứng gì. Khối này trám đúng chỗ đó, và nó
thuộc về AVATAR chứ không thuộc về lớp nhân vật.
"""
import os, sys, json, glob, time, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from nuong_chi import (BO, IDLE, APPEAR, N_IDLE, N_APPEAR, W, H, OX, OY, PHONG,
                       BO_KHE, CAO_NHO, CHAT, goi, gop_bbox, luoi)
from hoatcanh import TuThe, ve_khung
from nuong_nv import dai

DON   = 'defense/hit-by-normal'
N_DON = 8            # cú giật là nhịp NGẮN. Nguồn ~0,5s ⇒ 8 khung là 16 hình/giây, cùng
                     # nhịp với khối chạy; dài hơn thì cú giật kéo quá thời gian bất tử
COT   = 8


def khung(d, im, R, tt, ten, n):
    hc = d['animations'][ten]; T = dai(hc)
    return [ve_khung(d, im, R, tt, hc, i * T / n, 'default', W=W, H=H, phong=PHONG,
                     ox=OX, oy=OY, bo_khe=BO_KHE).transpose(Image.FLIP_LEFT_RIGHT)
            for i in range(n)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kit', default='/home/user/axieinfinity/axie-origins-asset-kit')
    a = ap.parse_args()
    goc = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
    ra  = os.path.join(goc, 'public/game/assets/chimera')
    kit = os.path.join(a.kit, 'Assets/OriginsKit/PvE/Starters')

    # Hoạt cảnh mượn từ một rig .json BẤT KỲ — mọi rig Axie dùng chung bộ xương. Kit tự có rig
    # .json nên không cần repo cc-axie-gtk2d như nuong_chi.py.
    nguon = None
    for f in sorted(glob.glob(kit + '/*/*.json')):
        d = json.load(open(f, encoding='utf-8'))
        if DON in d.get('animations', {}): nguon = d['animations']; break
    if not nguon: sys.exit('không rig .json nào có ' + DON)

    t0 = time.time(); tong = 0
    for cid, rig in BO.items():
        d, im, R = goi(os.path.join(kit, rig), nguon)
        tt = TuThe(d)
        # ① dựng lại ĐÚNG hộp của bảng nhỏ: bb trên appear + idle, rồi nới cân quanh trục chân
        nen = khung(d, im, R, tt, APPEAR, N_APPEAR) + khung(d, im, R, tt, IDLE, N_IDLE)
        bb = None
        for k in nen: bb = gop_bbox(bb, k.getchannel('A').getbbox())
        ax = W * OX; nua = max(ax - bb[0], bb[2] - ax)
        bb = (int(ax - nua), bb[1], int(ax + nua), bb[3])
        cw0, ch0 = bb[2] - bb[0], bb[3] - bb[1]
        nho = (round(cw0 * CAO_NHO / ch0), CAO_NHO)
        # ② cắt khung TRÚNG ĐÒN bằng chính hộp đó
        ks = [k.crop(bb).resize(nho, Image.LANCZOS)
              for k in khung(d, im, R, tt, DON, N_DON)]
        n = luoi(ks, COT, os.path.join(ra, cid + '_h.webp'), CHAT)
        tong += n
        print('  %-11s ô %3dx%-3d · %2d khung · %3d KB  (%.0fs)'
              % (cid, nho[0], nho[1], N_DON, n // 1024, time.time() - t0))
    print('tổng %d con · %.2f MB · %.0fs' % (len(BO), tong / 1048576, time.time() - t0))
    print('game.js: CHI_DON = { n: %d, cot: %d } — ô dùng chung nhoRong/nhoCao của CHI_ANH'
          % (N_DON, COT))


if __name__ == '__main__': main()
