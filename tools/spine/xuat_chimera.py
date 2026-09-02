#!/usr/bin/env python3
"""Xuất art Chimera từ rig Spine của axie-origins-asset-kit sang thư mục assets.

Ba việc sau khi ghép rig (xem assemble.py):
  1. Bỏ mảnh rời — vài rig để phụ kiện (quả cà, chuông…) nằm tách hẳn khỏi thân ở
     tư thế gốc; trong màn chúng trôi lơ lửng cạnh con vật. Giữ lại cụm lớn nhất
     và những cụm dính/gần nó.
  2. Lật ngang — art gốc quay TRÁI, drawMount() lật lại khi nhân vật quay trái,
     nên phải xuất sẵn ở tư thế quay PHẢI.
  3. Cắt sát viền và thu về ~640px cạnh dài, đủ nét cho màn quay Khế Ước (150px)
     mà không nặng repo.

    python3 xuat_chimera.py <thư-mục-kit> <thư-mục-ra>
"""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from assemble import assemble

# id Chimera trong game  ->  tên bộ rig trong PvE/Starters
BO = {
    # 16 con = 16 rig KHÁC NHAU. Cố tình không lấy bản biến thể (`2` và `2-1`…):
    # hai con chỉ khác cái mũ thì trong màn nhìn như lỗi trùng ảnh.
    # ── 5★ ──
    'aurelion':  '21',  'netherfang': '18',  'tidewarden': '3',
    'emberjaw':  '1',   'voltcrest':  '15',  'ironshell':  '2',
    # ── 4★ ──
    'petalkin':  '12',  'crimsonmaw': '17',  'thornpaw':   '24',
    'inkmane':   '23',  'cinderbeak': '5',   'mossback':   '16',
    'hexmite':   '11',  'ridgehorn':  '7',   'coghound':   '22',
    'sunspur':   '19',
}
GAN = 26          # cụm cách thân dưới ngần này pixel thì vẫn coi là dính vào con vật
CANH = 480        # cạnh dài sau khi thu


def bo_manh_roi(im):
    a = np.array(im.getchannel('A')) > 8
    lab, n = ndimage.label(a)
    if n <= 1: return im
    dt = ndimage.distance_transform_edt(~a)      # khoảng cách tới pixel đặc gần nhất
    kich = ndimage.sum(a, lab, range(1, n + 1))
    than = int(np.argmax(kich)) + 1
    # nở thân ra GAN pixel; cụm nào chạm vùng nở đó thì giữ
    gan_than = dt if False else ndimage.distance_transform_edt(lab != than)
    giu = np.zeros_like(a)
    for i in range(1, n + 1):
        if i == than or (gan_than[lab == i].min() <= GAN):
            giu |= (lab == i)
    out = np.array(im)
    out[..., 3] = np.where(giu, out[..., 3], 0)
    return Image.fromarray(out, 'RGBA')


def main(kit, ra):
    os.makedirs(ra, exist_ok=True)
    tmp = os.path.join(ra, '_tmp.png')
    for cid, bo in BO.items():
        d = os.path.join(kit, 'Assets/OriginsKit/PvE/Starters', bo)
        if assemble(d, bo, tmp) is None: continue
        im = bo_manh_roi(Image.open(tmp).convert('RGBA'))
        im = im.crop(im.getbbox()).transpose(Image.FLIP_LEFT_RIGHT)
        k = CANH / max(im.size)
        if k < 1: im = im.resize((max(1, round(im.width*k)), max(1, round(im.height*k))), Image.LANCZOS)
        p = os.path.join(ra, cid + '.png')
        im.save(p, optimize=True)
        print(f'  {cid:11s} <- Starters/{bo:4s}  {im.size[0]}x{im.size[1]}  {os.path.getsize(p)//1024}KB')
    if os.path.exists(tmp): os.remove(tmp)


if __name__ == '__main__':
    if len(sys.argv) < 3: print(__doc__); sys.exit(1)
    main(sys.argv[1], sys.argv[2])
