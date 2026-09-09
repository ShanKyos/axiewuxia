#!/usr/bin/env python3
"""Cắt một công trình isometric do Gemini gen thành sprite dùng được trong game.

Bốn việc, cái nào cũng đã phải làm bằng tay một lần rồi mới viết ra đây:

  ① TÁCH NỀN THEO SẮC TÍM, KHÔNG THEO NGƯỠNG SÁNG. Gemini vẽ bóng đổ bằng magenta SẪM, nên
     lọc kiểu `R>160 & G<110 & B>160` giữ nguyên vệt bóng và để lại một vũng tím dưới chân nhà.
     Đo sắc tím `(R+B)/2 − G` thì bắt cả nền sáng lẫn bóng sẫm.

     ⚠ NGƯỠNG PHẢI CAO, VÀ CON SỐ NÀY ĐO ĐƯỢC CHỨ KHÔNG ĐOÁN. Đo trên tấm lò rèn: nền magenta
     ra 210, mọi vật liệu công trình ra 20-24 — một khoảng trống rộng, phần ở giữa chỉ là viền
     khử răng cưa. Quét ngưỡng thì tỉ lệ nền đứng yên ở 62,6% từ mức 110 trở lên, còn ngưỡng 55
     ăn thêm 4,2% ảnh: nó nuốt luôn cái BỆ ĐÁ màu hồng nhạt, và bệ mất thì cái đe với đống than
     đứng trên bệ rơi ra thành mảnh rời rồi bị bước ② vứt nốt. Lấy 120, giữa khoảng trống.
  ② DỌN ĐỐM LẺ — THEO CỠ, KHÔNG PHẢI GIỮ MỘT MẢNH. Giữ một mảnh to nhất là sai: cái đe, đống
     than, khúc gỗ đặt RỜI trên bệ và đều là mảnh riêng. Vứt mảnh nhỏ hơn 0,02% ảnh (đủ để bay
     ngôi sao lấp lánh Gemini hay chèn) và giữ mọi mảnh còn lại.
  ③ BỎ BỆ HỒNG. Gemini hay dựng công trình trên một tấm bệ phẳng màu hồng nhạt — nó là phông
     của bản vẽ, không phải một phần công trình, và đặt lên nền cỏ thì thành một vũng hồng.
     Bệ nhận ra được: sắc tím nằm GIỮA khoảng (40-120, tức không phải nền 210 cũng không phải
     vật liệu 20-24) VÀ mảnh chiếm ≥1,5% ảnh. Điều kiện cỡ là thứ giữ lại mấy lá cờ hồng nhỏ
     trên cổng thành — chúng cùng sắc nhưng bé hơn nhiều.

     Bỏ RUỘT bệ chưa đủ: còn cái VIỀN bệ (một vòng nét sẫm bao quanh) và mấy dòng chữ ghi kích
     thước mà Gemini vẽ đè lên bệ ("768px", "384px", "150px" — nó tưởng mấy con số trong prompt
     là thứ phải VẼ RA). Hai thứ này là nét sẫm nên không lọt lưới màu. Nhận diện:
       · viền bệ — mảnh nào mà DIỆN TÍCH SAU KHI VÁ LỖ gấp hơn 4 lần số điểm của chính nó thì
         nó là một cái vòng rỗng ruột, không phải một vật đặc. Cái đe cho tỉ lệ 1,05; viền bệ
         cho hơn 5.
       · chữ ghi kích thước — mảnh nhỏ, nằm LỌT trong khung bệ vừa bỏ, không dính vào công trình.
  ④ ÉP VỀ ĐÚNG 2:1. Chân đế Gemini vẽ ra không đúng phép chiếu của game (đo cổng thành: hình
     thoi 1511×890, tỉ lệ 1,70 thay vì 2,00). Ép dẹt phần chênh là khớp.
  ⑤ THU THEO SỐ Ô CHÂN ĐẾ, KHÔNG THEO KHỔ ẢNH. Ảnh ra 1024 hay 2048 là chuyện của Gemini;
     thứ quyết định cỡ trong game là chân nhà chiếm mấy ô đất. Một ô = 256px.

⚠ CỠ LÀ VIỆC CỦA CHỖ NHẬP, KHÔNG PHẢI CỦA PROMPT. Sprite chỉ cần nhất quán bên trong nó (cửa
so với thân nhà). Đo được ở cổng thành: chân đế 3 ô ra 784×710px = 5,4 lần thân người (như nhà
thờ), 2 ô ra 523×473 = 3,6 lần (đúng cho một cái cổng), 1,4 ô ra 366×331 = 2,5 lần (ra cái lều).
Cổng thành và công trình lớn để 2 ô; tiệm quán thường để 1,4-1,8 ô.

Chạy:
  python3 tools/iso/cat_congtrinh.py <ảnh> <tên-ra> [--o 2.0]
"""
import argparse, os, sys

import numpy as np
from PIL import Image
from scipy import ndimage

RA = 'public/game/assets/iso'
O_PX = 256           # bề ngang một ô đất trong game
TI_LE_GEM = 1.71     # tỉ lệ chân đế Gemini vẽ ra — đo trên hai tấm có bệ, xem ghi chú trong cat()
NV_CAO = 132


def cat(duong, so_o=2.0, in_ra=True):
    im = Image.open(duong).convert('RGB')
    a = np.asarray(im).astype(float)
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    nen = ((R + B) / 2 - G) > 120                     # ① xem ghi chú — 120 nằm giữa 24 và 210

    vat = ~nen                                        # ② vứt mảnh nhỏ, giữ mọi mảnh còn lại
    lab, n = ndimage.label(vat)
    dem = np.bincount(lab.ravel()); dem[0] = 0
    nho = max(1, int(0.0002 * vat.size))
    giu = np.where(dem >= nho)[0]
    vat = np.isin(lab, giu)
    n = n - len(giu) + 1
    # ── ÉP VỀ ĐÚNG PHÉP CHIẾU CỦA GAME ────────────────────────────────────────────────────
    # ⚠ ĐỪNG ĐO CHÂN ĐẾ CỦA TỪNG TẤM. Đã thử ba cách, cả ba đều sai với một kiểu tranh nào đó:
    #   · "lát cắt ngang rộng nhất ở nửa dưới" — đúng khi có BỆ, sai khi không (tiệm thuốc ra
    #     tỉ lệ 0,94, ép dẹt ×0,47, bẹp dí).
    #   · đo sau khi bỏ bệ — cái bệ CHÍNH LÀ chân đế, bỏ rồi thì đo vào chỗ khác.
    #   · "điểm trái nhất/phải nhất = hai mũi hình thoi chân đế" — đúng khi tường thẳng đứng,
    #     sai khi MÁI ĐUA ra ngoài tường. Tiệm thuốc có mái đua: hai điểm ngoài cùng nằm ở
    #     y≈755 (mép mái) trong khi chân nhà ở y≈1747. Ra tỉ lệ 0,76.
    #
    # Thứ cần sửa KHÔNG khác nhau giữa các tấm: nó là góc nhìn isometric của Gemini, và góc ấy
    # cố định. Đo trên hai tấm CÓ bệ nhìn rõ — cổng thành 1548×910 = 1,70 và lò rèn 1575×916 =
    # 1,72 — nên lấy hằng 1,71 cho mọi tấm. Còn cỡ thì neo theo BỀ NGANG sprite, vốn cũng chính
    # là thứ mắt người đọc ra khi nhìn một công trình đứng cạnh nhân vật.
    ys, xs = np.nonzero(vat)

    tim = (R + B) / 2 - G                             # ③ bỏ bệ hồng
    be = (tim > 40) & (tim < 120) & vat
    lb, _ = ndimage.label(be)
    db = np.bincount(lb.ravel()); db[0] = 0
    lon = np.where(db >= 0.015 * vat.size)[0]
    bo_be = int(db[lon].sum()) if len(lon) else 0
    if len(lon):
        vung_be = np.isin(lb, lon)
        by_, bx_ = np.nonzero(vung_be)
        vat = vat & ~vung_be
        lab2, n2 = ndimage.label(vat)
        d2 = np.bincount(lab2.ravel()); d2[0] = 0
        to_nhat = d2.argmax()
        giu2 = []
        for i in np.where(d2 >= nho)[0]:
            comp = lab2 == i
            if i != to_nhat:
                dac = ndimage.binary_fill_holes(comp).sum() / d2[i]
                if dac > 4 and d2[i] > 0.003 * vat.size:
                    continue                          # vòng rỗng ruột = viền bệ
                cy, cx = np.nonzero(comp)
                trong_be = (cx.min() >= bx_.min() and cx.max() <= bx_.max()
                            and cy.min() >= by_.min() and cy.max() <= by_.max())
                if trong_be and d2[i] < 0.003 * vat.size:
                    continue                          # chữ ghi kích thước nằm lọt trong khung bệ
            giu2.append(i)
        vat = np.isin(lab2, giu2)

    ys, xs = np.nonzero(vat)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()

    rgba = np.dstack([np.asarray(im), np.where(vat, 255, 0).astype('uint8')])[y0:y1+1, x0:x1+1]
    img = Image.fromarray(rgba, 'RGBA')
    img = img.resize((img.width, max(1, int(img.height * TI_LE_GEM / 2.0))), Image.LANCZOS)
    k = (so_o * O_PX) / img.width
    img = img.resize((max(1, int(img.width * k)), max(1, int(img.height * k))), Image.LANCZOS)

    if in_ra:
        print(f'{os.path.basename(duong)}: gốc {im.width}×{im.height} · bỏ {n-1} đốm lẻ '
              f'· bỏ bệ hồng {bo_be} px', file=sys.stderr)
        print(f'  ép dẹt ×{TI_LE_GEM/2:.3f} (góc isometric của Gemini đo được 1,71 thay vì 2,00)',
              file=sys.stderr)
        print(f'  chân {so_o} ô → sprite {img.width}×{img.height}px '
              f'= {img.height/NV_CAO:.1f} lần thân người', file=sys.stderr)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('anh'); ap.add_argument('ten')
    ap.add_argument('--o', type=float, default=2.0, help='chân đế chiếm mấy ô đất (1 ô = 256px)')
    a = ap.parse_args()
    im = cat(a.anh, a.o)
    os.makedirs(RA, exist_ok=True)
    im.save(f'{RA}/{a.ten}.png')
    print(f'  → {RA}/{a.ten}.png', file=sys.stderr)


if __name__ == '__main__':
    main()
