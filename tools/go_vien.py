#!/usr/bin/env python3
"""Gỡ VIỀN TỐI ở mép sprite cắt alpha, và ĐO lại để biết có gỡ được thật không.

Triệu chứng: đặt sprite lên nền sáng (đường mòn cát) thì quanh nó có một quầng đen mỏng. Nguyên
nhân là sprite được cắt ra trên nền TỐI mà không gỡ phép nhân alpha: điểm bán trong suốt ở mép
mang sẵn màu nền cũ trộn vào, nên càng trong suốt càng đen.

Phép chữa là phép chia ngược: rgb ÷ alpha. Đúng về toán, và đo được — so độ sáng trung bình của
dải mép (alpha 8-160) với độ sáng của lõi đặc (alpha > 240). Sprite sạch thì hai số xấp xỉ nhau.

⚠ KHÔNG chữa được viền do NÉT VẼ. Ba hình đá có đường viền đen do hoạ sĩ vẽ hẳn vào trong ảnh —
chia ngược chỉ kéo −99 lên −52, phần còn lại là nét thật. Ép tiếp thì bợt cả hòn đá. Ghi lại để
đừng ai tưởng phép này hỏng rồi vặn thêm.

Chạy:
    python3 tools/go_vien.py <ảnh.png> [ảnh2.png ...]      # sửa tại chỗ, in số đo trước/sau
    python3 tools/go_vien.py --do <ảnh.png> ...            # chỉ đo, không sửa
"""
import sys
import numpy as np
from PIL import Image


def lech_vien(a):
    """Độ sáng dải mép trừ độ sáng lõi. Âm nhiều = viền tối."""
    al = a[:, :, 3]
    vien, loi = (al > 8) & (al < 160), al > 240
    if vien.sum() < 50 or loi.sum() < 50:
        return None
    return float(a[:, :, :3][vien].mean() - a[:, :, :3][loi].mean())


def go(a):
    b = a.copy()
    al = np.clip(b[:, :, 3] / 255.0, 0, 1)
    m = al > 0.02                       # dưới ngưỡng này thì chia ngược chỉ khuếch đại nhiễu
    b[:, :, :3][m] = np.clip(b[:, :, :3][m] / al[m][:, None], 0, 255)
    return b


def main():
    chi_do = '--do' in sys.argv
    ds = [x for x in sys.argv[1:] if not x.startswith('--')]
    if not ds:
        print(__doc__); sys.exit(2)
    for f in ds:
        a = np.asarray(Image.open(f).convert('RGBA'), dtype=float)
        truoc = lech_vien(a)
        if truoc is None:
            print(f'  {f}: không đủ điểm mép để đo — bỏ qua'); continue
        if chi_do:
            print(f'  {f}: viền−lõi {truoc:+.1f}'); continue
        b = go(a)
        sau = lech_vien(b)
        Image.fromarray(b.astype('uint8'), 'RGBA').save(f)
        con = ' · CÒN VIỀN NÉT VẼ' if sau is not None and sau < -20 else ''
        print(f'  {f}: viền−lõi {truoc:+.1f} → {sau:+.1f}{con}')


if __name__ == '__main__':
    main()
