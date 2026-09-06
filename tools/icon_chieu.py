#!/usr/bin/env python3
"""Cắt icon kỹ năng RA TỪ CHÍNH tấm dán hiệu ứng của chiêu đó.

    python3 tools/icon_chieu.py <id-atlas> <khung> <tệp-icon> --nen "#2a1030,#0a0512"

Icon và hiệu ứng phải là MỘT thứ: người chơi nhìn ô kỹ năng rồi nhìn màn hình, hai cái phải khớp.
Vẽ tay một biểu tượng riêng là mở đường cho hai thứ trôi dần khỏi nhau. Ở đây icon lấy đúng một
khung của tấm dán, cắt sát nội dung rồi đặt lên nền tối cùng tông — không thêm nét vẽ nào.
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image

S = 128          # cạnh icon, khớp bộ icon sẵn có trong assets/skills
LE = 3           # chừa mép


def hop_sat(im):
    a = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(a > 12)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)


def nen(c1, c2):
    """Nền toả tròn: sáng ở tâm, tối dần ra rìa — đúng kiểu bộ icon sẵn có."""
    y, x = np.mgrid[0:S, 0:S]
    d = np.sqrt((x - S / 2) ** 2 + (y - S / 2) ** 2) / (S * 0.72)
    t = np.clip(d, 0, 1)[..., None]
    a = np.array([int(c1[i:i + 2], 16) for i in (1, 3, 5)], float)
    b = np.array([int(c2[i:i + 2], 16) for i in (1, 3, 5)], float)
    rgb = a * (1 - t) + b * t
    return Image.fromarray(np.dstack([rgb, np.full((S, S), 255.)]).astype('uint8'), 'RGBA')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('atlas'); ap.add_argument('khung', type=int); ap.add_argument('ra')
    ap.add_argument('--nen', default='#2a1a3a,#0a0610')
    ap.add_argument('--defs', default='')     # "cols,frameW,frameH"
    a = ap.parse_args()

    goc = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    sh = Image.open(os.path.join(goc, 'public/game/assets/vfx', a.atlas, 'atlas.png')).convert('RGBA')
    cot, fw, fh = (int(v) for v in a.defs.split(','))
    x, y = (a.khung % cot) * fw, (a.khung // cot) * fh
    k = sh.crop((x, y, x + fw, y + fh))

    b = hop_sat(k)
    k = k.crop(b)
    r = min((S - 2 * LE) / k.width, (S - 2 * LE) / k.height)
    k = k.resize((max(1, int(k.width * r)), max(1, int(k.height * r))), Image.LANCZOS)

    c1, c2 = a.nen.split(',')
    out = nen(c1, c2)
    out.alpha_composite(k, ((S - k.width) // 2, (S - k.height) // 2))
    p = os.path.join(goc, 'public/game', a.ra)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    out.save(p, optimize=True)
    print('%s  %d KB' % (a.ra, os.path.getsize(p) // 1024))
    return 0


if __name__ == '__main__':
    sys.exit(main())
