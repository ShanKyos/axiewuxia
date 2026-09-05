#!/usr/bin/env python3
"""Nhập một clip hiệu ứng từ kit Axie Origins vào assets/vfx/.

    python3 tools/vfx_nhap.py <id> [<id> …] [--kit <đường-kit>] [--k 2]

Kit đã dựng sẵn 107 clip cho web (atlas.png + clip.json, đã cắt sát và ghi rõ lưới), nên việc
ở đây chỉ là THU NHỎ rồi in ra dòng khai cho VFX_ATLAS_DEFS. `k` là hệ số thu: k=2 nghĩa là
atlas về một nửa mỗi cạnh — đúng hệ số của sáu clip đang chạy, và là lý do trường `k` tồn tại.
"""
import os, sys, json, argparse
from PIL import Image

Image.MAX_IMAGE_PIXELS = None


def nhap(kit, cid, k, ra):
    thu = os.path.join(kit, 'web-vfx/public/vfx', cid)
    c = json.load(open(os.path.join(thu, 'clip.json'), encoding='utf-8'))
    a = c['atlas']
    im = Image.open(os.path.join(thu, a['file'])).convert('RGBA')
    im = im.resize((im.width // k, im.height // k), Image.LANCZOS)
    d = os.path.join(ra, cid); os.makedirs(d, exist_ok=True)
    p = os.path.join(d, 'atlas.png')
    im.save(p, optimize=True)
    return ('  %-14s{ k:%d, cols:%d, rows:%d, frameW:%d, frameH:%d, frames:%d, fps:%d,'
            ' anchorX:%.1f, anchorY:%.1f },   // %d KB'
            % (cid + ':', k, a['cols'], a['rows'], a['frameW'] // k, a['frameH'] // k,
               c['frames'], round(c['fps']), c['anchor']['x'] / k, c['anchor']['y'] / k,
               os.path.getsize(p) // 1024))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('id', nargs='+')
    ap.add_argument('--kit', default='/home/user/axieinfinity/axie-origins-asset-kit')
    ap.add_argument('--k', type=int, default=2)
    a = ap.parse_args()
    goc = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    ra = os.path.join(goc, 'public/game/assets/vfx')
    for cid in a.id: print(nhap(a.kit, cid, a.k, ra))
    return 0


if __name__ == '__main__':
    sys.exit(main())
