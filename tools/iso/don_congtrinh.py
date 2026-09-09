"""Dọn hai thứ CÒN SÓT trên sprite công trình sau cat_congtrinh.py.

cat_congtrinh.py cắt nền theo màu và bỏ bệ hồng, nhưng hai tấm lọt lưới:

  · ct_cong  — BỆ ĐÁ BẸT màu be ấm còn nguyên. Nó lọt vì ngưỡng "tím 40-120" của bản cũ
    chỉ bắt bệ HỒNG; bệ này Gemini vẽ màu be (240,193,166), không tím. Trong game nó ra
    một tấm ván be nằm đè lên mặt lát đá — thấy rõ ở ảnh chụp Cổng Tây.
  · ct_loren — KHUNG VIỀN đỏ sẫm mảnh 1-3px chạy quanh mép ảnh, cộng một vạch trắng đo
    kích thước bên trái. Cả hai là ghi chú Gemini vẽ kèm, không phải công trình.

Cách dọn KHÔNG dùng ngưỡng màu suông (bệ be và đá tường chênh nhau ít), mà dùng
LIÊN THÔNG + hình học:
  ① mặt bệ = vùng be ấm (R-B > 55) LIÊN THÔNG với ba đỉnh hình thoi — ba chỗ chắc chắn
     không thể là công trình.
  ② viền bệ = nét đỏ sẫm nằm sát vùng ①, lấy bằng cách nở ① ra 5px rồi giao với nét đỏ.
  ③ mảnh rời cỡ nhỏ (vạch đo, chữ) = thành phần liên thông < 0,05% ảnh, hoặc thành phần
     có bbox rộng hơn nửa ảnh mà đặc chưa tới 6% bbox (đúng định nghĩa một cái KHUNG).

Chạy:  python3 tools/iso/don_congtrinh.py
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

# ⚠ ĐỌC TỪ `nguon/`, GHI RA `assets/` — KHÔNG sửa tại chỗ.
# Hàm don_be() nhận diện bệ bằng ba đỉnh hình thoi ở rìa ảnh. Chạy lần thứ hai lên tấm ĐÃ SẠCH
# thì ba chỗ ấy là chân công trình, và nó sẽ gặm vào chính công trình. Tách nguồn/đích làm bài
# này chạy lại bao nhiêu lần cũng ra cùng một kết quả.
NGUON = 'tools/iso/nguon/'
RA = 'public/game/assets/iso/'


def _thanh_phan(mask):
    lab, n = ndimage.label(mask, np.ones((3, 3), bool))
    return lab, n


def don_be(im):
    """Bỏ bệ đá bẹt: mặt be + viền đỏ của nó."""
    a = im[..., 3] > 10
    r, g, b = im[..., 0].astype(int), im[..., 1].astype(int), im[..., 2].astype(int)
    be = a & (r - b > 55) & (r > 195)
    lab, _ = _thanh_phan(be)
    H, W = a.shape
    # ba đỉnh hình thoi: trái, phải, đáy — lấy ô có alpha gần nhất với ba góc ấy
    hat = set()
    for yy, xx in ((H // 2, 2), (H // 2, W - 3), (H - 3, W // 2)):
        vung = lab[max(0, yy - 30):yy + 30, max(0, xx - 30):xx + 30]
        for v in np.unique(vung):
            if v:
                hat.add(int(v))
    if not hat:
        return im, 0
    be_that = np.isin(lab, list(hat))
    do = a & (r < 150) & (g < 80) & (b < 80)
    vien = ndimage.binary_dilation(be_that, np.ones((11, 11), bool)) & do
    bo = be_that | vien
    # ③ MẶT BÊN + BÓNG ĐỔ của bệ. Hai thứ này màu xám-tím, không lọt lưới "be ấm", mà lại
    #    DÍNH LIỀN vào chân công trình nên tách theo liên thông cũng không ra. Tách theo hình
    #    học: bệ nằm DƯỚI công trình, nên trong mỗi cột, điểm be THẤP NHẤT chính là mép trước
    #    của mặt bệ — mọi thứ dưới điểm ấy chỉ có thể là mặt bên bệ hoặc viền của nó.
    moc = be_that | vien
    for x in range(a.shape[1]):
        cot = np.where(moc[:, x])[0]
        if cot.size:
            bo[cot.max() + 1:, x] = True
    im = im.copy()
    im[bo, 3] = 0
    return im, int(bo.sum())


def don_manh(im):
    """Bỏ khung viền mảnh và mảnh vụn ghi chú."""
    a = im[..., 3] > 10
    lab, n = _thanh_phan(a)
    H, W = a.shape
    tong = H * W
    bo = np.zeros_like(a)
    for i in range(1, n + 1):
        m = lab == i
        s = int(m.sum())
        ys, xs = np.where(m)
        bw, bh = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
        dac = s / (bw * bh)
        if s < tong * 0.0005:                       # mảnh vụn: vạch đo, chữ ghi cỡ
            bo |= m
        elif bw * bh > tong * 0.01 and dac < 0.10:   # KHUNG / VỆT MẢNH: bbox to mà rỗng ruột
            bo |= m
    im = im.copy()
    im[bo, 3] = 0
    return im, int(bo.sum())


def don_vien_hinhthoi(im, dinh):
    """Bỏ nét viền BỆ HÌNH THOI mà cat_congtrinh.py đã xoá ruột nhưng bỏ sót nét.

    Không tách được bằng liên thông: nét bệ cùng màu đỏ sẫm với nét viền của chính công
    trình, và hai thứ chạm nhau nên cả ảnh chỉ ra MỘT mảnh đỏ 51k điểm. Nên tách bằng
    HÌNH HỌC: bệ là hình thoi 2:1, ba đỉnh trái/phải/đáy đọc thẳng từ ảnh, và nét cần bỏ
    là nét đỏ nằm sát ĐƯỜNG BIÊN hình thoi ấy.

    `dinh` = (trai, phai, day) — mỗi cái là (x, y).
    """
    (tx, ty), (px, py), (dx_, dy_) = dinh
    cx, cy = (tx + px) / 2, (ty + py) / 2
    nx, ny = (px - tx) / 2, dy_ - cy            # nửa rộng, nửa cao
    H, W = im.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    # |x-cx|/nx + |y-cy|/ny = 1 là biên hình thoi; lấy dải quanh biên
    d = np.abs(xx - cx) / nx + np.abs(yy - cy) / abs(ny)
    r, g, b = im[..., 0].astype(int), im[..., 1].astype(int), im[..., 2].astype(int)
    do = (im[..., 3] > 10) & (r < 165) & (g < 95) & (b < 95)
    # CHỈ NỬA DƯỚI. Hai cạnh trên của hình thoi chạy KHUẤT SAU công trình, nên xoá theo
    # chúng là gạch một đường chéo xuyên qua mái và tường — đã thấy đúng vệt đó ở lần chạy
    # đầu. Hai cạnh dưới mới là phần bệ thò ra ngoài, và đó là tất cả những gì cần bỏ.
    bo = do & (np.abs(d - 1) < 0.028) & (yy >= cy - 2)
    im = im.copy()
    im[bo, 3] = 0
    return im, int(bo.sum())


def don_vun_bien(im):
    """Quét nốt hai thứ vụn còn lại sau ba bước trên.

    · VẠCH ĐO của Gemini: nét dọc màu trắng-ngả-tím (r,b cao mà g thấp hơn hẳn). Màu ấy
      là màu KHOÁ NỀN của tấm gốc, không có trong nét vẽ công trình, nên bắt theo màu là
      an toàn tuyệt đối.
    · ĐUÔI NÉT BỆ: mấy điểm đỏ còn sót ở hai đầu cạnh hình thoi, nằm trong dải 8% ngoài
      cùng hai bên và cột nào cũng chỉ vài điểm — công trình không bao giờ mỏng như thế.
    """
    a = im[..., 3] > 10
    r, g, b = im[..., 0].astype(int), im[..., 1].astype(int), im[..., 2].astype(int)
    bo = a & (r > 235) & (b > 235) & (r - g > 25)
    H, W = a.shape
    le = max(4, int(W * 0.08))
    for x in list(range(le)) + list(range(W - le, W)):
        if 0 < a[:, x].sum() < 10:
            bo[:, x] = a[:, x]
    im = im.copy()
    im[bo, 3] = 0
    return im, int(bo.sum())


def cat_lai(im):
    """Cắt sát nội dung. Trả thêm (x0, y0) — GỐC CỦA KHUNG MỚI TRONG KHUNG CŨ.

    Con số đó bắt buộc phải in ra: `vatTo` trong data/canbang.js đặt sprite bằng toạ độ
    góc trên-trái, nên bỏ bệ xong mà giữ nguyên x/y là công trình TỰ DỜI CHỖ. Toạ độ mới
    giữ đúng vị trí cũ của công trình là (x + x0, y + y0).
    """
    a = im[..., 3] > 10
    ys, xs = np.where(a)
    return im[ys.min():ys.max() + 1, xs.min():xs.max() + 1], int(xs.min()), int(ys.min())


def main():
    # Ba đỉnh hình thoi bệ của ct_loren, đọc thẳng từ ảnh gốc: hàng/cột ngoài cùng còn
    # đúng mấy điểm đỏ ở (0,363) · (511,363) · (256,491).
    DINH_LOREN = ((0, 363), (511, 363), (256, 491))
    for ten, viec in (('ct_cong', ('be', 'manh')), ('ct_loren', ('thoi', 'manh'))):
        im = np.array(Image.open(NGUON + ten + '_tho.png').convert('RGBA'))
        cu = im.shape
        if 'be' in viec:
            im, n = don_be(im)
            print(f'{ten}: bỏ bệ {n} điểm')
        if 'thoi' in viec:
            im, n = don_vien_hinhthoi(im, DINH_LOREN)
            print(f'{ten}: bỏ nét bệ hình thoi {n} điểm')
        if 'manh' in viec:
            im, n = don_manh(im)
            print(f'{ten}: bỏ mảnh rời {n} điểm')
        im, n = don_vun_bien(im)
        print(f'{ten}: bỏ vụn mép {n} điểm')
        im, x0, y0 = cat_lai(im)
        Image.fromarray(im).save(RA + ten + '.png')
        print(f'{ten}: {cu[1]}×{cu[0]} → {im.shape[1]}×{im.shape[0]}'
              f'   · dời gốc +{x0},+{y0}  (cộng vào x/y của vatTo để công trình đứng yên)')


if __name__ == '__main__':
    sys.exit(main())
