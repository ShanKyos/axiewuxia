#!/usr/bin/env python3
"""Nhập clip hiệu ứng từ kit Axie Origins vào assets/vfx/.

    python3 tools/vfx_nhap.py <id> [<id> …] [--kit <đường-kit>] [--k 2] [--giu-khung-rong]

Kit đã dựng sẵn 107 clip cho web (atlas.png + clip.json, đã cắt sát và ghi rõ lưới), nên việc ở
đây có hai bước: CẮT ĐUÔI RỖNG rồi THU NHỎ, sau đó in ra dòng khai cho VFX_ATLAS_DEFS.

Cắt đuôi rỗng — vì sao: clip trong kit chạy tới hết `clipDuration` của Unity, mà phần lớn hiệu
ứng tắt trước đó khá lâu. `shield` là 81 khung nhưng chỉ 28 khung đầu có hình; 53 khung còn lại
là ảnh trong suốt, chiếm chỗ trong atlas và ngốn bộ nhớ y như khung có hình. Cắt đi thì tổng tám
atlas hạ từ 122,7 xuống 92,2 MB — vừa lọt trần 100 MB của test_bonho mà không phải giảm độ nét.
Nó cũng sửa luôn chỗ hoạt cảnh chạy hụt: game ánh xạ tiến độ lên `frames`, nên đuôi rỗng làm
quá nửa thời gian vẽ ra khoảng không.

`k` là hệ số thu: k=2 nghĩa là mỗi cạnh còn một nửa — hệ số của cả tám clip đang chạy, và là lý
do trường `k` tồn tại trong VFX_ATLAS_DEFS.
"""
import os, sys, json, argparse
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
COT = 8            # số cột khi xếp lại, giữ đúng như kit xếp
NGUONG = 0.01      # khung có dưới 1% số pixel đặc của khung đậm nhất thì coi là rỗng


def khung_co_hinh(im, a, n):
    """Chỉ số khung CUỐI CÙNG còn nhìn thấy được."""
    W, H = a['frameW'], a['frameH']
    dem = []
    for i in range(n):
        x, y = (i % a['cols']) * W, (i // a['cols']) * H
        dem.append(int((np.asarray(im.crop((x, y, x + W, y + H)))[..., 3] > 8).sum()))
    m = max(dem)
    return max(i for i, v in enumerate(dem) if v > m * NGUONG) + 1


def nhap(kit, cid, k, ra, cat=True):
    thu = os.path.join(kit, 'web-vfx/public/vfx', cid)
    c = json.load(open(os.path.join(thu, 'clip.json'), encoding='utf-8'))
    a = c['atlas']
    im = Image.open(os.path.join(thu, a['file'])).convert('RGBA')
    W, H, n0 = a['frameW'], a['frameH'], c['frames']
    n = khung_co_hinh(im, a, n0) if cat else n0

    w, h = W // k, H // k
    hang = (n + COT - 1) // COT
    ra_im = Image.new('RGBA', (w * COT, h * hang))
    for i in range(n):
        x, y = (i % a['cols']) * W, (i // a['cols']) * H
        ra_im.paste(im.crop((x, y, x + W, y + H)).resize((w, h), Image.LANCZOS),
                    ((i % COT) * w, (i // COT) * h))
    d = os.path.join(ra, cid); os.makedirs(d, exist_ok=True)
    p = os.path.join(d, 'atlas.png')
    ra_im.save(p, optimize=True)
    return ('  %-16s{ k:%d, cols:%d, rows:%d, frameW:%d, frameH:%d, frames:%d, fps:%d,'
            ' anchorX:%.1f, anchorY:%.1f },   // %d KB, cắt %d khung đuôi rỗng'
            % (cid + ':', k, COT, hang, w, h, n, round(c['fps']),
               c['anchor']['x'] / k, c['anchor']['y'] / k,
               os.path.getsize(p) // 1024, n0 - n))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('id', nargs='+')
    ap.add_argument('--kit', default='/home/user/axieinfinity/axie-origins-asset-kit')
    ap.add_argument('--k', type=int, default=2)
    ap.add_argument('--giu-khung-rong', action='store_true')
    a = ap.parse_args()
    goc = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    ra = os.path.join(goc, 'public/game/assets/vfx')
    for cid in a.id: print(nhap(a.kit, cid, a.k, ra, not a.giu_khung_rong))
    return 0


if __name__ == '__main__':
    sys.exit(main())
