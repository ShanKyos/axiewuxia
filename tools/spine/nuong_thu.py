#!/usr/bin/env python3
"""Nướng ĐÀN THÚ HOANG — thú nền của Lunacia — từ rig Spine của kit Axie.

    python3 tools/spine/nuong_thu.py [--kit <đường-kit>]

Xuất ra public/game/assets/thu/<id>.webp và ghi public/game/data/thu_anh.js.

Khác `nuong_chi.py` ở CHỖ DÙNG, nên khác cả ở cỡ và ở số khung:
Chimera là đồng hành đứng cạnh nhân vật và hiện to trong màn quay Khế Ước; thú nền là thứ gặm
cỏ ở đằng xa, mỗi map một đàn chục con. Nên ô nhỏ hơn nhiều, và đổi lại phải có ĐỦ BA DÁNG —
gặm · đứng · chạy — vì thứ làm một đàn thú ra "đang sống" là nó ĐỔI việc đang làm, không phải
nó được vẽ kỹ.

⚠ BỐN TRONG 38 RIG HỎNG khi mượn hoạt cảnh: 14 · 14-1 · 20 · 20-1 mất hẳn phần thân, chỉ còn
mấy mảnh phụ kiện trôi lơ lửng. Quét được bằng ĐỘ ĐẶC (điểm ảnh đặc / diện tích hộp bao) ở
khung idle: 34 rig lành ra 0,52-0,78, bốn rig hỏng ra 0,25-0,31 — hai cụm tách hẳn nhau, không
có vùng xám. `--quet` in lại bảng đó. Đừng chọn rig bằng mắt trên ảnh thu nhỏ: ở cỡ 60px thì
một con mất thân trông vẫn "có gì đó".
"""
import os, sys, json, glob, time, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nuong_chi import goi, gop_bbox, luoi, W, H, OX, OY, BO_KHE
from hoatcanh import TuThe, ve_khung
from nuong_nv import dai
from PIL import Image

# id trong game -> thư mục rig trong PvE/Starters.
# Chọn theo BÓNG DÁNG chứ không theo màu: một đàn phải đọc ra ba con vật khác nhau kể cả khi
# thu về 60px và mất hết chi tiết. Cừu xù · bò đốm · sóc có đuôi.
BO = {
    'cuu_bong': '19-1',   # cừu lông xù, kem
    'bo_dom':   '23-1',   # đen trắng loang, đúng chất gia súc
    'soc_hat':  '5-1',    # nâu vàng, có đuôi cong
}
# Ba dáng. Tên khoá là thứ game đọc; giá trị là tên hoạt cảnh trong rig.
DANG = [('gam', 'activity/eat-chew'), ('dung', 'action/idle/normal'), ('chay', 'action/run')]
N_KHUNG = 8               # mỗi dáng 8 khung — thú nền cao 60px, thêm khung không ai thấy
PHONG   = 0.45
CAO     = 96              # chiều cao ô. Game vẽ theo `thanCao` nên đây chỉ là độ phân giải
COT     = 8
CHAT    = 82


def khung_con(rig_dir, nguon_hc):
    """Mọi khung của MỘT con, theo thứ tự DANG. Art gốc quay TRÁI nên lật sẵn sang PHẢI."""
    d, im, R = goi(rig_dir, nguon_hc)
    tt = TuThe(d)
    ks = []
    for _, an in DANG:
        hc = d['animations'][an]; T = dai(hc)
        for i in range(N_KHUNG):
            ks.append(ve_khung(d, im, R, tt, hc, i * T / N_KHUNG, 'default',
                               W=W, H=H, phong=PHONG, ox=OX, oy=OY, bo_khe=BO_KHE)
                      .transpose(Image.FLIP_LEFT_RIGHT))
    return ks


def quet(kit, nguon_hc):
    """In độ đặc của mọi rig — cửa duy nhất để biết rig nào mượn hoạt cảnh được."""
    import numpy as np
    for rid in sorted(os.listdir(kit)):
        try:
            d, im, R = goi(os.path.join(kit, rid), nguon_hc)
            tt = TuThe(d); hc = d['animations']['action/idle/normal']
            k = ve_khung(d, im, R, tt, hc, dai(hc) * 0.3, 'default',
                         W=W, H=H, phong=PHONG, ox=OX, oy=OY, bo_khe=BO_KHE)
            a = np.array(k.getchannel('A')) > 40
            b = k.getchannel('A').getbbox()
            print('%-6s dac=%.3f %s' % (rid, a.sum() / max(1, (b[2]-b[0]) * (b[3]-b[1])),
                                        'HỎNG' if a.sum() / max(1, (b[2]-b[0])*(b[3]-b[1])) < 0.45 else ''))
        except Exception as e:
            print('%-6s LỖI %s' % (rid, str(e)[:60]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kit', default='/home/user/axieinfinity/axie-origins-asset-kit')
    ap.add_argument('--quet', action='store_true', help='in độ đặc mọi rig rồi thoát')
    a = ap.parse_args()
    goc = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
    kit = os.path.join(a.kit, 'Assets/OriginsKit/PvE/Starters')
    # Rig cho mượn hoạt cảnh: bất kỳ rig .json nào — cả bộ dùng chung một bộ xương.
    nguon = json.load(open(os.path.join(kit, '1/1.json'), encoding='utf-8'))['animations']
    if a.quet: return quet(kit, nguon) or 0

    ra = os.path.join(goc, 'public/game/assets/thu')
    t0 = time.time(); O = {}; tong = 0
    for tid, rig in BO.items():
        ks = khung_con(os.path.join(kit, rig), nguon)
        bb = None
        for k in ks: bb = gop_bbox(bb, k.getchannel('A').getbbox())
        # Nới ngang cho cân quanh trục đứng của bàn chân — cùng lý do như nuong_chi.py: con vật
        # quay phải nên thân dồn một bên, không nới thì nó lắc khi đổi hướng.
        ax = W * OX; nua = max(ax - bb[0], bb[2] - ax)
        bb = (int(ax - nua), bb[1], int(ax + nua), bb[3])
        cw, ch = bb[2] - bb[0], bb[3] - bb[1]
        ks = [k.crop(bb) for k in ks]
        o = (round(cw * CAO / ch), CAO)
        n = luoi([k.resize(o, Image.LANCZOS) for k in ks], COT,
                 os.path.join(ra, tid + '.webp'), CHAT)
        tong += n
        tb = ks[0].getchannel('A').getbbox()
        O[tid] = {'oRong': o[0], 'oCao': o[1],
                  'neoY': round((H * OY - bb[1]) / ch, 4),
                  'thanCao': round((tb[3] - tb[1]) / ch, 4)}
        print('  %-9s rig %-5s ô %3dx%-3d thân %.2f · %3d KB' % (tid, rig, o[0], o[1], O[tid]['thanCao'], n // 1024))

    duong = os.path.join(goc, 'public/game/data/thu_anh.js')
    open(duong, 'w', encoding='utf-8').write(
        '/* SINH RA TỰ ĐỘNG bởi tools/spine/nuong_thu.py — đừng sửa tay.\n'
        '   Bảng khung thú nền: mỗi loài một cỡ ô, ba dáng nối đuôi nhau trong cùng một lưới. */\n'
        'window.THU_ANH = %s;\n' % json.dumps(
            {'nKhung': N_KHUNG, 'cot': COT, 'dang': [d[0] for d in DANG], 'o': O},
            ensure_ascii=False, indent=1))
    print('tổng %.2f MB · %.0fs' % (tong / 1e6, time.time() - t0))
    return 0


if __name__ == '__main__':
    sys.exit(main())
