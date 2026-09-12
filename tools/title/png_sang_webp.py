#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Chuyển PNG trong một thư mục sang WEBP rồi xoá PNG.

Vì sao qua PNG chứ không xuất thẳng WEBP từ trình duyệt: `canvas.toDataURL('image/webp')`
của Chromium không cho chỉnh `alpha_quality`, mà nhân vật cắt sát thì mất mát rơi đúng vào
viền alpha — hiện ra thành một quầng xám quanh người.

⚠ `alpha_quality=100` là bắt buộc, `quality` thì không. Kênh màu nén mất 10% không ai thấy
trên một bóng người cao 200 điểm ảnh; kênh ALPHA nén mất thì thấy ngay ở mọi mép. Để lossless
cả hai thì 16 khung đứng gần giống hệt nhau vẫn ra 955 KB — lossless không gộp được chỗ giống.
"""
import glob, os, sys

from PIL import Image

d = sys.argv[1] if len(sys.argv) > 1 else '.'
q = int(sys.argv[2]) if len(sys.argv) > 2 else 90
tong_png = tong_webp = 0
for f in sorted(glob.glob(os.path.join(d, '*.png'))):
    im = Image.open(f).convert('RGBA')
    out = f[:-4] + '.webp'
    im.save(out, 'WEBP', quality=q, alpha_quality=100, method=6)
    a, b = os.path.getsize(f), os.path.getsize(out)
    tong_png += a; tong_webp += b
    print(f'  {os.path.basename(out):16} {a/1024:7.1f}K -> {b/1024:7.1f}K')
    os.remove(f)
print(f'tổng {tong_png/1024:.1f}K -> {tong_webp/1024:.1f}K')
