#!/usr/bin/env python3
"""Nướng một gói Spine thành bảng khung cho drawPlayer/heroSprite.

    python3 tools/spine/nuong_nv.py <thư-mục-gói> <tên-da> <tên-tệp-ra>

Ví dụ:
    python3 tools/spine/nuong_nv.py /tmp/goi3 'Violet Crystal Staff' dw_t9

Xuất ra public/game/assets/nv/<tên>.png (thân) và <tên>_vk.png (vũ khí).

HỢP ĐỒNG TOẠ ĐỘ với game — sai một trong bốn dòng này là nhân vật lệch:
  · ô 240x300 = (HERO_W + HS_PAD*2) x (HERO_H + HS_PAD*2)
  · bảng xếp 16 cột
  · gốc bộ xương (80,212) nằm đúng ở (120,252) trong ô
  · thứ tự khung trùng HS_FRAMES: 16 đứng · 32 đi · 16 đánh · 16 niệm
"""
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hoatcanh import doc_goi, TuThe, ve_khung
from PIL import Image

KHE_VK  = ('左手武器', '左手武器2b', '左手武器2c')   # vũ khí bị cắt 4 mảnh trên 3 khe
KHE_HFX = ('爆炸特效', '爆炸特效(残影）')            # hiệu ứng nổ — game tự lo, không nướng
KHE_TOC = ('背后头发',)                              # tóc sau, chỉ dùng lúc ĐO
# Khối CHẠY đứng CUỐI, không chen vào giữa: bốn khối đầu giữ nguyên vị trí nên bảng khung
# đời cũ và đời mới cùng đọc được bằng một bộ mốc — chỉ khối mới là phần thêm ra.
KHUNG   = [('00_Idle', 16), ('00_Walk', 32), ('08_SwordAttack', 16), ('05_MagicAttack', 16),
           ('00_Run', 16)]
O_W, O_H, COT = 240, 300, 16
CAO_THAN, GOT_Y = 159, 212     # đỉnh đầu y=53 → gót y=212, theo HERO_JOINT

def dai(hc):
    """Hoạt cảnh dài bao nhiêu giây — Spine không ghi sẵn, phải dò khoá muộn nhất."""
    m = 0
    for gr in hc.values():
        if not isinstance(gr, dict): continue
        for b in gr.values():
            for tl in (b.values() if isinstance(b, dict) else [b]):
                if isinstance(tl, list):
                    for kf in tl:
                        if isinstance(kf, dict): m = max(m, kf.get('time', 0))
    return m or 1.0

def _do(d, im, R, tt, skin, bo, **kw):
    return ve_khung(d, im, R, tt, d['animations']['00_Idle'], 0, skin, bo_khe=bo, **kw)

def nuong(goi, skin):
    d, im, R = doc_goi(goi); tt = TuThe(d)
    moiKhe  = tuple(s['name'] for s in d['slots'])
    bo_than = KHE_VK + KHE_HFX
    # ① Hệ số thu: đo ĐỈNH ĐẦU → GÓT, KHÔNG tính tóc sau. Đo cả chỏm tóc vào là nhân vật
    #    lùn đi chừng 18% so với phần còn lại của game.
    bb = _do(d, im, R, tt, skin, bo_than + KHE_TOC, W=1400, H=2000, phong=1.0, ox=.5, oy=.86
             ).getchannel('A').getbbox()
    phong = CAO_THAN / (bb[3] - bb[1])
    # ② Bù mặt đất: bàn chân trong art thò xuống dưới gốc bộ xương vài px. Đặt y=0 vào mốc 212
    #    không thôi là cả người tụt xuống dưới bóng.
    bb2 = _do(d, im, R, tt, skin, bo_than, W=O_W, H=O_H, phong=phong, ox=120/O_W, oy=252/O_H
              ).getchannel('A').getbbox()
    oy = (252 - ((bb2[3] - 40) - GOT_Y)) / O_H
    ra = {}
    for lop, bo in (('than', bo_than),
                    ('vukhi', tuple(k for k in moiKhe if k not in KHE_VK))):
        ks = []
        for ten, n in KHUNG:
            hc = d['animations'][ten]; T = dai(hc)
            for i in range(n):
                ks.append(ve_khung(d, im, R, tt, hc, i*T/n, skin, W=O_W, H=O_H,
                                   phong=phong, ox=120/O_W, oy=oy, bo_khe=bo))
        ra[lop] = ks
    # Thêm MỘT ảnh tư thế GỐC (không áp hoạt cảnh nào) cho thẻ chọn lớp: hoạt cảnh 00_Idle
    # chùng gối và dồn trọng tâm sang một bên, đứng cạnh nhau năm lớp thì nhìn ra lệch hết.
    # Tư thế gốc thì hai chân đều, tay buông, vũ khí chống xuống — dáng đứng chào của màn chọn.
    dung = Image.new('RGBA', (O_W, O_H))
    for bo in (bo_than, tuple(k for k in moiKhe if k not in KHE_VK)):
        dung.alpha_composite(ve_khung(d, im, R, tt, {}, 0, skin, W=O_W, H=O_H,
                                      phong=phong, ox=120/O_W, oy=oy, bo_khe=bo))
    ra['dung'] = dung
    return ra, phong

def bang(ks, duong):
    sh = Image.new('RGBA', (O_W*COT, O_H*((len(ks)+COT-1)//COT)))
    for i, k in enumerate(ks): sh.alpha_composite(k, ((i % COT)*O_W, (i//COT)*O_H))
    os.makedirs(os.path.dirname(duong), exist_ok=True)
    sh.save(duong, optimize=True)
    return os.path.getsize(duong)

def main():
    if len(sys.argv) < 4: print(__doc__); return 1
    goi, skin, ten = sys.argv[1], sys.argv[2], sys.argv[3]
    goc = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
    thu = os.path.normpath(os.path.join(goc, 'public/game/assets/nv'))
    t0 = time.time()
    lop, phong = nuong(goi, skin)
    for hau, k in (('', 'than'), ('_vk', 'vukhi')):
        d = os.path.join(thu, ten + hau + '.png')
        print(f'  {os.path.basename(d):20s} {bang(lop[k], d)//1024:>5d} KB  ({len(lop[k])} khung)')
    dd = os.path.join(thu, ten + '_dung.png')
    lop['dung'].save(dd, optimize=True)
    print(f'  {os.path.basename(dd):20s} {os.path.getsize(dd)//1024:>5d} KB  (tư thế đứng)')
    # kiểm hai mốc — sai là nhân vật lệch so với phần còn lại của game
    bb = Image.open(os.path.join(thu, ten + '.png')).crop((0, 0, O_W, O_H)).getchannel('A').getbbox()
    print(f'  gót y={bb[3]-40} (cần {GOT_Y}) · đỉnh đầu y={bb[1]-40} (cần 53) · thu {phong:.4f}'
          f' · {time.time()-t0:.1f}s')
    return 0

if __name__ == '__main__': sys.exit(main())
