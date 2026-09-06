#!/usr/bin/env python3
"""Nhập một gói hiệu ứng Meowa (xuất kiểu Godot 4) vào assets/vfx/.

    python3 tools/vfx_meowa.py <thư-mục-gói> <id> [--khung a:b] [--ban-kinh 112]
                               [--o 96] [--fps 14] [--khong-canh]

Khác `vfx_nhap.py` ở chỗ nguồn khác hẳn: kit Axie đã cắt sát và ghi rõ lưới, còn gói Meowa là
một tấm sheet cộng một tệp `.tres` của Godot. Ba việc riêng ở đây:

① ĐỌC LƯỚI TỪ .tres, không đoán. Bộ xuất của Meowa đã một lần khai sai (mỗi ô 640px trong khi
   thật ra mỗi ô chứa 3x3 khung 213px), nên tệp này in ra lưới đọc được để đối chiếu bằng mắt.

② CẮT THEO LÕI, không theo tâm ô. Đo trên gói Energy Ball: tâm quả cầu chạy lung tung trong
   khoảng 27px giữa các khung — đứng yên trên sheet thì trong màn nó rung. Mỗi khung tìm lõi
   sáng nhất rồi cắt quanh CHÍNH NÓ, thế là quả cầu đứng im và chỉ tia điện động, đúng như
   mắt mong đợi ở một viên đạn bay.

③ CHỌN ĐOẠN KHUNG. Meowa hay sinh cả đoạn "hình thành" lẫn đoạn "chạy vòng" trong một gói;
   đạn bay chỉ cần đoạn chạy vòng, `--khung a:b` cắt lấy đúng đoạn đó.
"""
import os, re, sys, argparse, glob
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None


def doc_luoi(thu):
    """Đọc .tres → (đường sheet, danh sách ô (x,y,w,h) theo đúng thứ tự khung, không trùng)."""
    tres = glob.glob(os.path.join(thu, '*.tres'))[0]
    t = open(tres, encoding='utf-8').read()
    o, thay = [], set()
    for m in re.finditer(r'region\s*=\s*Rect2\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\s*\)', t):
        r = tuple(int(float(v)) for v in m.groups())
        if r in thay: continue          # .tres lặp lại danh sách khi loop; chỉ giữ lượt đầu
        thay.add(r); o.append(r)
    png = glob.glob(os.path.join(thu, 'textures', '*.png')) or glob.glob(os.path.join(thu, '*.png'))
    return png[0], o


def tam_loi(c):
    """Trọng tâm của 1% pixel sáng nhất — tức cái lõi nóng, chỗ mắt bám vào."""
    a = np.asarray(c)
    m = a[..., 3].astype(float) / 255
    lum = (a[..., 0] * .3 + a[..., 1] * .59 + a[..., 2] * .11) * m
    if not (lum > 0).any(): return c.width // 2, c.height // 2
    ng = np.percentile(lum[lum > 0], 99.0)
    ys, xs = np.nonzero(lum >= ng)
    return int(xs.mean()), int(ys.mean())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('goi'); ap.add_argument('id')
    ap.add_argument('--khung', default='')      # "8:16" — nửa mở, kiểu Python
    ap.add_argument('--ban-kinh', type=int, default=112)
    ap.add_argument('--o', type=int, default=96)
    ap.add_argument('--fps', type=int, default=14)
    ap.add_argument('--khong-canh', action='store_true')   # cắt theo tâm ô thay vì theo lõi
    a = ap.parse_args()

    thu = a.goi
    if not glob.glob(os.path.join(thu, '*.tres')):
        c = glob.glob(os.path.join(thu, '*', '*.tres'))
        if c: thu = os.path.dirname(c[0])
    png, o = doc_luoi(thu)
    im = Image.open(png).convert('RGBA')
    print('sheet %s · %d khung khai trong .tres · ô %dx%d'
          % (im.size, len(o), o[0][2], o[0][3]))

    i0, i1 = (0, len(o))
    if a.khung:
        i0, i1 = (int(v) for v in a.khung.split(':'))
    R = a.ban_kinh
    ks = []
    for x, y, w, h in o[i0:i1]:
        c = im.crop((x, y, x + w, y + h))
        cx, cy = (w // 2, h // 2) if a.khong_canh else tam_loi(c)
        ks.append(c.crop((cx - R, cy - R, cx + R, cy + R)).resize((a.o, a.o), Image.LANCZOS))

    goc = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    d = os.path.join(goc, 'public/game/assets/vfx', a.id); os.makedirs(d, exist_ok=True)
    sh = Image.new('RGBA', (a.o * len(ks), a.o))
    for i, k in enumerate(ks): sh.alpha_composite(k, (i * a.o, 0))
    p = os.path.join(d, 'atlas.png'); sh.save(p, optimize=True)

    print('  %-16s{ k:1, cols:%d, rows:1, frameW:%d, frameH:%d, frames:%d, fps:%d,'
          ' anchorX:%.1f, anchorY:%.1f },   // %d KB, %.1f MB giải nén'
          % (a.id + ':', len(ks), a.o, a.o, len(ks), a.fps, a.o / 2, a.o / 2,
             os.path.getsize(p) // 1024, a.o * len(ks) * a.o * 4 / 1048576))
    return 0


if __name__ == '__main__':
    sys.exit(main())
