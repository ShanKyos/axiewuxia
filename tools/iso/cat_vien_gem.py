#!/usr/bin/env python3
"""Cắt tấm viên lát do Gemini gen thành bộ viên 256×128 cho engine.

Hai đường vào, vì hai cách đặt hàng khác nhau:

  --thoi <tấm>   Tấm đã vẽ sẵn hình THOI 2:1, xếp lưới 4×4 (gem_thoi_v2.png).
                 Nền magenta #FF00FF. Cắt sâu vào mép ô để ăn nốt đường kẻ ô
                 Gemini hay vẽ thừa (đo được: 3px không đủ, 10px thì sạch).

  --vuong <tấm>  Tấm vẽ ô VUÔNG lặp liền mạch, nhìn thẳng từ trên xuống, lưới 2×2.
                 ⚠ ĐÂY LÀ ĐƯỜNG NÊN DÙNG. Vẽ hình thoi liền mạch là việc khó cho
                 model — bốn mép phải khớp với chính nó theo hai hướng chéo, và cả
                 hai lượt gen đầu đều để lại một vành sẫm quanh mép, ghép ra thành
                 lưới quả trám. Ô vuông lặp liền mạch thì dễ hơn hẳn, còn phép
                 xoay 45° + ép dẹt một nửa GIỮ NGUYÊN tính lặp, nên hình thoi cắt
                 ra liền mạch tuyệt đối. Đo được: bộ đá lát vẽ thẳng dạng thoi
                 ghép sạch, nhưng cỏ và đất thì không.

Ra: public/game/assets/iso/<tên>_<n>.png, cùng khuôn tên mà nuong_tile.py đang dùng.

Chạy:
  python3 tools/iso/cat_vien_gem.py --thoi tools/iso/nguon/gem_thoi_v2.png
  python3 tools/iso/cat_vien_gem.py --vuong tools/iso/nguon/gem_vuong.png
"""
import argparse, os, sys

import numpy as np
from PIL import Image

RA = 'public/game/assets/iso'
ISO_W, ISO_H = 256, 128
LE_O = 10            # cắt sâu vào mép ô — xem ghi chú đầu tệp
# Tên bốn hàng của tấm dạng THOI, theo đúng thứ tự đã đặt hàng
HANG_THOI = ['nen_co', 'nen_dat', 'nen_da', 'nen_vien']
# Tên bốn ô của tấm dạng VUÔNG (2×2, đọc từ trái sang phải, trên xuống dưới)
# Tên phải khớp ISO_CO/ISO_DAT trong game.js — engine nạp thẳng assets/iso/<tên>.png
O_VUONG = ['nen_co', 'nen_dat', 'nen_da', 'nen_duong']


def _bo_magenta(im):
    a = np.asarray(im.convert('RGB')).astype(int)
    nen = (a[:, :, 0] > 165) & (a[:, :, 1] < 105) & (a[:, :, 2] > 165)
    return Image.fromarray(
        np.dstack([np.asarray(im.convert('RGB')), np.where(nen, 0, 255).astype('uint8')]), 'RGBA')


def tu_thoi(duong):
    im = Image.open(duong).convert('RGB')
    W, H = im.size
    cw, ch = W // 4, H // 4
    if abs(cw / ch - 2) > 0.15:
        sys.exit(f'ô {cw}×{ch} — tỉ lệ {cw/ch:.2f}, cần 2,00. Tấm này không phải thoi 2:1.')
    ra = []
    for r, ten in enumerate(HANG_THOI):
        for c in range(4):
            o = im.crop((c*cw + LE_O, r*ch + LE_O//2, (c+1)*cw - LE_O, (r+1)*ch - LE_O//2))
            t = _bo_magenta(o.resize((cw, ch), Image.LANCZOS)).resize((ISO_W, ISO_H), Image.LANCZOS)
            ra.append((f'{ten}{c+1}', t))
    return ra


def tu_vuong(duong):
    """Ô vuông lặp liền mạch → hình thoi 2:1, bằng ÁNH XẠ NGƯỢC (không xoay ảnh).

    ⚠ XOAY RỒI CẮT LÀ SAI, và sai im lặng. Cách hiển nhiên — lát ô vuông 3×3, xoay 45°, ép dẹt
    một nửa, cắt 256×128 ở giữa — cho ra một hình thoi TRÔNG đúng nhưng KHÔNG lặp: khi engine
    xếp viên kề nhau nó dịch đúng một bước lưới thoi, mà bước ấy chỉ khớp nếu hình thoi là ảnh
    của ĐÚNG MỘT ô vuông nguồn. Cắt 256px giữa một tấm 1024 đã xoay thì hình thoi chỉ ứng với
    18% ô nguồn, và mọi mép đều lệch.

    Nên đi ngược: với mỗi điểm (x,y) của viên 256×128, tính thẳng toạ độ ô vuông nguồn
        u = x/W − 0,5 + y/H ,  v = y/H − x/W + 0,5
    (nghịch đảo của phép chiếu isometric x=(u−v)·W/2+W/2, y=(u+v)·H/2), rồi lấy mẫu tại
    (u mod 1, v mod 1). Nguồn lặp liền mạch nên phép mod lo nốt phần mép — hình thoi ra khớp
    tuyệt đối với chính nó theo cả bốn cạnh, không phụ thuộc khổ ảnh nguồn.
    """
    im = Image.open(duong).convert('RGB')
    W, H = im.size
    cw, ch = W // 2, H // 2
    ra = []
    yy, xx = np.mgrid[0:ISO_H, 0:ISO_W]
    u0 = (xx + 0.5) / ISO_W - 0.5 + (yy + 0.5) / ISO_H
    v0 = (yy + 0.5) / ISO_H - (xx + 0.5) / ISO_W + 0.5
    for i, ten in enumerate(O_VUONG):
        c, r = i % 2, i // 2
        o = np.asarray(im.crop((c*cw, r*ch, (c+1)*cw, (r+1)*ch))).astype('uint8')
        for k in range(4):
            du, dv = (k % 2) * 0.5, (k // 2) * 0.5      # bốn biến thể = bốn gốc lấy mẫu khác nhau
            su = np.mod(u0 + du, 1.0) * cw
            sv = np.mod(v0 + dv, 1.0) * ch
            px = o[np.clip(sv.astype(int), 0, ch-1), np.clip(su.astype(int), 0, cw-1)]
            ra.append((f'{ten}{k+1}', _khoet_thoi(Image.fromarray(px, 'RGB'))))
    return ra


def _khoet_thoi(im):
    """Khoét đúng hình thoi 2:1 khỏi ô chữ nhật, ngoài thoi thì trong suốt."""
    w, h = im.size
    yy, xx = np.mgrid[0:h, 0:w]
    trong = (np.abs(xx - w/2 + 0.5) / (w/2) + np.abs(yy - h/2 + 0.5) / (h/2)) <= 1.0
    return Image.fromarray(
        np.dstack([np.asarray(im.convert('RGB')), np.where(trong, 255, 0).astype('uint8')]), 'RGBA')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--thoi'); ap.add_argument('--vuong')
    a = ap.parse_args()
    if not (a.thoi or a.vuong):
        sys.exit('cần --thoi hoặc --vuong')
    ra = tu_thoi(a.thoi) if a.thoi else tu_vuong(a.vuong)
    os.makedirs(RA, exist_ok=True)
    for ten, im in ra:
        im.save(f'{RA}/{ten}.png')
    print(f'{len(ra)} viên → {RA}/', file=sys.stderr)
    for ten, im in ra:
        print(f'  {ten}.png {im.size[0]}×{im.size[1]}', file=sys.stderr)


if __name__ == '__main__':
    main()
