#!/usr/bin/env python3
"""Nướng BỐN ICON TRANG BỊ từ một gói Spine — nón · áo · tay · chân.

    python3 tools/spine/nuong_icon.py <thư-mục-gói> '<tên-da>' <tên-ra>

Xuất public/game/assets/nv/<tên-ra>_icon.webp — một dải 4 ô 128x128, thứ tự:
    0 nón   1 áo   2 tay   3 chân

VÌ SAO TÁCH ĐƯỢC, dù bộ xương không có khe "món đồ" nào:
13 khe của bản mẫu đều là BỘ PHẬN CƠ THỂ (đầu, thân, hai tay, hai chân, vũ khí, hiệu ứng).
Nhưng mỗi món giáp lại được vẽ chìm vào ĐÚNG MỘT bộ phận — mũ trùm nằm trong texture của khe
'头', áo choàng trong '躯干', ống tay trong '左手/右手'. Nên dựng riêng một bộ phận ra là được
đúng một món. ve_khung() vốn đã nhận `bo_khe` để loại khe, không phải thêm gì mới.

CHỈ CÓ BỐN, KHÔNG PHẢI NĂM. Bản mẫu không có khe quần riêng: '躯干_带短裤' là "thân kèm quần
đùi", và áo choàng phủ luôn xuống chân. Ô Quần trong game vì thế chỉ tính chỉ số, không có
hình riêng — mà cũng hợp lý, vì nhóm 'chân' dưới đây đã gồm cả ống quần lẫn giày.

Đo trên hai bộ áo choàng dài: thân 37%, tay 28%, đầu 19%, chân 15% bóng dáng nhìn thấy được.
Tay nhìn thấy gần GẤP ĐÔI chân — áo choàng phủ hết chân còn ống tay thì buông hai bên, không
gì che. Lớp mặc giáp cứng nhiều khả năng đảo lại; đừng chốt cứng từ một phép đo trên áo choàng.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hoatcanh import doc_goi, TuThe, ve_khung
from nuong_nv import _do, KHE_VK, KHE_HFX, KHE_TOC, CAO_THAN, GOT_Y, O_W, O_H
from PIL import Image

# Thứ tự PHẢI trùng ICON_O trong game.js — đổi ở đây mà quên bên kia là icon lẫn lộn hết.
NHOM = [('non',  ('头', '背后头发')),
        ('ao',   ('躯干_带短裤',)),
        ('tay',  ('左手', '右手', '右手前伸')),
        ('chan', ('左腿', '右腿'))]
PX  = 128
LE  = 8      # chừa mép: cắt sát khít quá thì trong ô 40px của túi nhìn như bị tràn


def nuong(goi, skin, ra_ten):
    d, im, R = doc_goi(goi)
    tt = TuThe(d)
    moiKhe = tuple(s['name'] for s in d['slots'])
    bo_than = KHE_VK + KHE_HFX
    # Cùng hai phép đo của nuong_nv.py, để icon và hình trên người cùng một tỉ lệ.
    bb = _do(d, im, R, tt, skin, bo_than + KHE_TOC, W=1400, H=2000,
             phong=1.0, ox=.5, oy=.86).getchannel('A').getbbox()
    phong = CAO_THAN / (bb[3] - bb[1])
    bb2 = _do(d, im, R, tt, skin, bo_than, W=O_W, H=O_H,
              phong=phong, ox=120 / O_W, oy=252 / O_H).getchannel('A').getbbox()
    oy = (252 - ((bb2[3] - 40) - GOT_Y)) / O_H
    hc = d['animations']['00_Idle']

    dai = Image.new('RGBA', (PX * len(NHOM), PX), (0, 0, 0, 0))
    for i, (ten, giu) in enumerate(NHOM):
        bo = tuple(k for k in moiKhe if k not in giu)
        # Dựng ở cỡ GẤP BỐN rồi mới thu về 128: icon là thứ người chơi nhìn gần nhất trong
        # túi, dựng thẳng ở 128 thì mấy sợi tua và mép vải sờn vỡ thành răng cưa.
        o = ve_khung(d, im, R, tt, hc, 0, skin, W=O_W * 4, H=O_H * 4,
                     phong=phong * 4, ox=120 / O_W, oy=oy, bo_khe=bo)
        hb = o.getchannel('A').getbbox()
        if not hb:
            print('  %-4s TRỐNG — da này không có mảnh nào ở nhóm đó' % ten); continue
        w, h = hb[2] - hb[0], hb[3] - hb[1]
        co = min((PX - LE * 2) / w, (PX - LE * 2) / h)
        nw, nh = max(1, round(w * co)), max(1, round(h * co))
        dai.alpha_composite(o.crop(hb).resize((nw, nh), Image.LANCZOS),
                            (i * PX + (PX - nw) // 2, (PX - nh) // 2))
        print('  %-4s %3dx%-3d → %3dx%-3d' % (ten, w // 4, h // 4, nw, nh))

    duong = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                          '../../public/game/assets/nv/%s_icon.webp' % ra_ten))
    dai.save(duong, quality=92, method=6)
    print('→ %s  (%d ô %dx%d, %.0f KB)'
          % (duong, len(NHOM), PX, PX, os.path.getsize(duong) / 1024))


if __name__ == '__main__':
    if len(sys.argv) != 4:
        print(__doc__); sys.exit(1)
    nuong(sys.argv[1], sys.argv[2], sys.argv[3])
