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

③ VÁ Ô CARO. Gói xuất mà không bật 'preserve translucent areas' thì lưới ô vuông trong suốt
   của trình vẽ bị nướng thẳng vào tranh — ô alpha 0 và ô đen thui giữa dải nền sáng, lưới mờ
   giữa khói tối. `--caro` vá cả ba dạng, chỉ đụng vào chỗ đúng cỡ một ô.

④ NEO THEO NỀN ĐẤT. Chiêu giáng xuống đất thì mốc neo là VẠCH NỀN, không phải tâm ô: `--cat`
   cắt khung theo hộp cho trước, `--neo` chỉ chỗ chạm đất, `--sat` chỉ bán kính vùng nổ trên
   nền — trong màn chỉ việc chia bán kính sát thương thật cho nó là ra tỉ lệ vẽ.

⑤ VÁ SƯƠNG RUNG. Dạng hỏng khác hẳn ô caro ở ③: alpha ĐỦ 256 mức, nhưng vùng sương mờ lại
   bị xuất thành LƯỚI RUNG — alpha nhảy 0 ↔ ~0,3 theo ô 25px thay vì một lớp mờ mượt. Nó sửa
   được đúng nghĩa chứ không phải xoá đi: trung bình hoá đúng một chu kì lưới là ra lại lớp
   sương tác giả định vẽ. `--suong` làm việc đó, chừa nét đặc ra để bóng ma và vành không nhoè.

⑥ NÂNG SÁNG. Gói vẽ trên nền trắng của trình sinh ảnh thì trong màn tối nó biến mất: bản đồ
   ban đêm sáng ~52, mà gói Dragon Spirit gốc chỉ sáng ~25 — nghĩa là hiệu ứng TỐI HƠN nền,
   mắt đọc thành một vệt bóng chứ không thành một chiêu. `--sang gamma,gain,sat` nâng trung
   gian và kéo màu về lại, giữ nguyên vùng tối sâu để không thành xám đục.

⑦ CHỌN ĐOẠN KHUNG. Meowa hay sinh cả đoạn "hình thành" lẫn đoạn "chạy vòng" trong một gói;
   đạn bay chỉ cần đoạn chạy vòng, `--khung a:b` cắt lấy đúng đoạn đó.
"""
import os, re, sys, argparse, glob
import numpy as np
from scipy import ndimage
from PIL import Image

Image.MAX_IMAGE_PIXELS = None


def doc_day_png(thu):
    """Thư mục PNG rời → danh sách khung theo thứ tự tên tệp. Meowa xuất kiểu này khi chọn
    'PNG sequence', và nó AN TOÀN HƠN sheet Godot: không có lưới để khai sai, và không có
    hàng xóm để nội dung khung này lấn sang khung kia."""
    ps = sorted(p for p in glob.glob(os.path.join(thu, '*'))
                if p.lower().endswith(('.png', '.webp')))
    return [Image.open(p).convert('RGBA') for p in ps], [os.path.basename(p) for p in ps]


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


P_CARO = 11          # cạnh ô caro đo trên gói mưa thiên thạch
O_CARO = 2 * P_CARO + 4   # rộng hơn hai ô thì không còn là ô caro


def _va_o(rgb, al):
    """Trả lại phần bị ô caro đục mất: ô alpha 0 và ô đục-nhưng-đen giữa vùng sáng. Chỉ vá mảng
    đúng cỡ một ô — khoảng trống thật (lòng vòng sét) rộng hơn nhiều, đụng vào là bôi trắng."""
    duc = al > 127
    lum = rgb[..., 0] * .3 + rgb[..., 1] * .59 + rgb[..., 2] * .11
    lo = ndimage.binary_fill_holes(duc) & ~duc
    phu = ndimage.uniform_filter(duc.astype(float), 2 * P_CARO + 1)
    quanh = ndimage.uniform_filter(np.where(duc, lum, 0.), 2 * P_CARO + 1) / np.maximum(phu, 1e-6)
    xau = lo | (duc & (phu > .5) & (quanh - lum > 45))
    lab, n = ndimage.label(xau)
    if not n:
        return rgb, al
    giu = np.zeros(n + 1, bool)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        giu[i] = (sl[0].stop - sl[0].start) <= O_CARO and (sl[1].stop - sl[1].start) <= O_CARO
    xau = giu[lab]
    if not xau.any():
        return rgb, al
    _, idx = ndimage.distance_transform_edt(~(duc & ~xau), return_indices=True)
    r2 = rgb.copy()
    for c in range(3):
        r2[..., c] = np.where(xau, rgb[..., c][idx[0], idx[1]], rgb[..., c])
    mem = np.stack([ndimage.uniform_filter(r2[..., c], P_CARO) for c in range(3)], -1)
    return np.where(xau[..., None], mem, r2), np.where(xau, 255., al)


def bo_o_caro(im):
    """Dạng thứ ba: lưới ô caro đục hẳn giữa khói tối, chỉ chênh ~15/255. Làm mượt bằng hai lượt
    hộp một chu kì (≈ tam giác hai chu kì), chỉ ở pixel TỐI mà phần dư quanh nó đúng tầm biên độ
    ấy — bóng đổ thật có phần dư lớn hơn nhiều nên giữ nguyên."""
    a = np.asarray(im).astype(float)
    rgb, al = _va_o(a[..., :3], a[..., 3])
    op = (al > 127).astype(float)
    lum = rgb[..., 0] * .3 + rgb[..., 1] * .59 + rgb[..., 2] * .11
    du = ndimage.uniform_filter(np.abs(lum - ndimage.uniform_filter(lum, 2 * P_CARO + 1)), P_CARO)
    m = ((lum < 78) & (op > 0) & (du > 2.5) & (du < 11)
         & (ndimage.uniform_filter(op, 2 * P_CARO + 1) > 0.995))
    m = ndimage.binary_dilation(ndimage.binary_erosion(m, np.ones((5, 5))), np.ones((7, 7)))
    out = rgb.copy()
    for c in range(3):
        v = ndimage.uniform_filter(ndimage.uniform_filter(rgb[..., c], P_CARO), P_CARO)
        out[..., c] = np.where(m, v, rgb[..., c])
    return Image.fromarray(np.clip(np.dstack([out, al]), 0, 255).astype('uint8'))


P_SUONG = 25       # chu kì lưới rung, đo bằng FFT trên gói Evil Spirit
DAC = 150          # alpha từ đây trở lên là NÉT ĐẶC — giữ nguyên, không đụng vào


def va_suong(im):
    """Trả lại lớp sương mượt từ lưới alpha bị rung.

    Trung bình theo lối NHÂN SẴN (premultiplied): làm mượt cả `rgb*alpha` lẫn `alpha` bằng cùng
    một nhân, rồi mới chia ngược. Làm mượt riêng alpha thì màu của ô rỗng (thường là xám hoặc
    đen) lẫn vào, ra một lớp bẩn xám; nhân sẵn thì ô rỗng có trọng số 0 nên không góp gì.
    Nét đặc bị loại khỏi cả tử lẫn mẫu, nếu không thì bóng ma trắng loang ra thành quầng."""
    a = np.asarray(im).astype(float)
    rgb, al = a[..., :3], a[..., 3]
    dac = al >= DAC
    mo = (~dac).astype(float)
    mau = ndimage.uniform_filter(mo, P_SUONG)
    alv = ndimage.uniform_filter(al * mo, P_SUONG) / np.maximum(mau, 1e-6)
    out = rgb.copy()
    for c in range(3):
        tu = ndimage.uniform_filter(rgb[..., c] * al * mo, P_SUONG) / np.maximum(mau, 1e-6)
        out[..., c] = np.where(dac, rgb[..., c], tu / np.maximum(alv, 1e-3))
    return Image.fromarray(np.clip(np.dstack([out, np.where(dac, al, alv)]), 0, 255).astype('uint8'))


def nang_sang(im, g, gain, sat):
    """Nâng sáng theo gamma rồi kéo lại độ đậm màu. Cộng thẳng một hằng số thì vùng trong suốt
    cũng sáng lên thành màng xám; gamma chỉ nâng trung gian nên đen vẫn đen."""
    a = np.asarray(im).astype(float)
    r = np.clip(255 * (a[..., :3] / 255) ** g * gain, 0, 255)
    lum = (r[..., 0] * .3 + r[..., 1] * .59 + r[..., 2] * .11)[..., None]
    r = np.clip(lum + (r - lum) * sat, 0, 255)
    return Image.fromarray(np.dstack([r, a[..., 3]]).astype('uint8'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('goi'); ap.add_argument('id')
    ap.add_argument('--khung', default='')      # "8:16" — nửa mở, kiểu Python
    ap.add_argument('--ban-kinh', type=int, default=112)
    ap.add_argument('--o', type=int, default=96)
    ap.add_argument('--fps', type=int, default=14)
    ap.add_argument('--khong-canh', action='store_true')   # cắt theo tâm ô thay vì theo lõi
    ap.add_argument('--caro', action='store_true')
    ap.add_argument('--suong', action='store_true')
    ap.add_argument('--sang', default='')                 # "gamma,gain,sat" — nâng sáng cho đọc được trên nền tối       # vá lưới rung trong vùng sương mờ         # vá lưới ô caro trong suốt bị nướng vào tranh
    ap.add_argument('--cat', default='')                   # "x0,y0,x1,y1" — cắt theo hộp, bỏ qua --ban-kinh
    ap.add_argument('--neo', default='')                   # "x,y" trên khung gốc — chỗ chiêu chạm đất
    ap.add_argument('--sat', type=int, default=0)          # bán kính vùng nổ trên nền, tính bằng pixel gốc
    ap.add_argument('--cot', type=int, default=0)          # số cột trên tấm dán; 0 = một hàng
    a = ap.parse_args()

    thu = a.goi
    if not glob.glob(os.path.join(thu, '*.tres')):
        c = glob.glob(os.path.join(thu, '*', '*.tres'))
        if c: thu = os.path.dirname(c[0])
    if glob.glob(os.path.join(thu, '*.tres')):
        png, o = doc_luoi(thu)
        im = Image.open(png).convert('RGBA')
        print('sheet %s · %d khung khai trong .tres · ô %dx%d'
              % (im.size, len(o), o[0][2], o[0][3]))
        khung = [im.crop((x, y, x + w, y + h)) for x, y, w, h in o]
    else:
        khung, ten = doc_day_png(thu)
        print('%d tệp PNG rời · ô %dx%d · %s … %s'
              % (len(khung), khung[0].width, khung[0].height, ten[0], ten[-1]))

    i0, i1 = (0, len(khung))
    if a.khung:
        i0, i1 = (int(v) for v in a.khung.split(':'))
    khung = khung[i0:i1]
    if a.caro:
        khung = [bo_o_caro(c) for c in khung]
    if a.suong:
        khung = [va_suong(c) for c in khung]
    if a.sang:
        _g, _k, _s = (float(v) for v in a.sang.split(','))
        khung = [nang_sang(c, _g, _k, _s) for c in khung]

    R = a.ban_kinh
    ks = []
    if a.cat:
        x0, y0, x1, y1 = (int(v) for v in a.cat.split(','))
        if x1 - x0 != y1 - y0:
            print('  ! hộp cắt %dx%d không vuông — ô atlas vuông sẽ bóp méo tranh'
                  % (x1 - x0, y1 - y0))
        ks = [c.crop((x0, y0, x1, y1)).resize((a.o, a.o), Image.LANCZOS) for c in khung]
        ti = a.o / (x1 - x0)
        nx, ny = (int(v) for v in a.neo.split(',')) if a.neo else ((x0 + x1) // 2, (y0 + y1) // 2)
        neo = ((nx - x0) * ti, (ny - y0) * ti)
        sat = a.sat * ti
    else:
        for c in khung:
            cx, cy = (c.width // 2, c.height // 2) if a.khong_canh else tam_loi(c)
            ks.append(c.crop((cx - R, cy - R, cx + R, cy + R)).resize((a.o, a.o), Image.LANCZOS))
        neo, sat = (a.o / 2, a.o / 2), 0

    goc = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    d = os.path.join(goc, 'public/game/assets/vfx', a.id); os.makedirs(d, exist_ok=True)
    cot = a.cot or len(ks)
    hang = -(-len(ks) // cot)
    sh = Image.new('RGBA', (a.o * cot, a.o * hang))
    for i, k in enumerate(ks): sh.alpha_composite(k, ((i % cot) * a.o, (i // cot) * a.o))
    p = os.path.join(d, 'atlas.png'); sh.save(p, optimize=True)

    print('  %-16s{ k:1, cols:%d, rows:%d, frameW:%d, frameH:%d, frames:%d, fps:%d,'
          ' anchorX:%.1f, anchorY:%.1f%s },   // %d KB, %.1f MB giải nén'
          % (a.id + ':', cot, hang, a.o, a.o, len(ks), a.fps, neo[0], neo[1],
             ', neoR:%.1f' % sat if sat else '',
             os.path.getsize(p) // 1024, a.o * len(ks) * a.o * 4 / 1048576))
    return 0


if __name__ == '__main__':
    sys.exit(main())
