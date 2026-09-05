#!/usr/bin/env python3
"""Chuẩn hoá tranh vũ khí thô (meowa.ai) thành tấm dùng được trong game.

Bảng VK_ANH trong game.js cần MỘT quy ước duy nhất, và cả engine dựa vào nó:
  · trục cây vũ khí nằm dọc +X, ĐẦU (quả cầu / lưỡi) ở phía phải
  · chỗ nắm tay nằm trên thân, tính bằng toạ độ pixel (x, y) trong chính tấm ảnh
  · chiều dài chuẩn hoá về DAI_CHUAN px

Nhờ vậy thanKhiTuThe() chỉ lo quỹ đạo, không cần biết đang cầm cây gì.
Tấm mẫu tk_dwstaff.png đã theo đúng quy ước này: 172x70, tay nắm (65, 33).

Cách dùng:
    python3 tools/chuanhoavk.py raw/*.png --ra public/game/assets/nv
Mỗi tệp in ra một dòng dán thẳng vào VK_ANH.
"""
import argparse, math, os, sys
from collections import deque
import numpy as np
from PIL import Image

DAI_CHUAN = 172      # chiều dài sau chuẩn hoá, bằng tấm mẫu tk_dwstaff
NAM_TU_DUOI = 0.38   # chỗ nắm cách ĐUÔI bao nhiêu phần chiều dài
NGUONG_A = 8         # alpha dưới mức này coi như nền
MANH_TOI_THIEU = 0.03  # mảnh rời nhỏ hơn 3% tổng khối lượng thì bỏ (xem bo_manh_roi)


def bo_manh_roi(im):
    """Bỏ những mảnh KHÔNG dính vào thân cây.

    meowa hay vẽ thêm lông vũ / tàn lửa / mảnh đá bay lơ lửng quanh vũ khí. Ở cỡ 172px chúng
    chỉ còn vài pixel nên đọc ra nhiễu, mà lại kéo rộng khung bao — làm cây vũ khí bị thu nhỏ
    trong khung và ĐẨY LỆCH chỗ nắm. Đo trên Thiên Linh Phất Trần: thân chiếm 95,6%, tám cái
    lông vũ mỗi cái dưới 1,3%.

    Chỉ bỏ mảnh NHỎ. Mảnh lớn thì giữ — có cây cố ý cho đá bay quanh đầu trượng.
    """
    a = np.array(im)
    m = a[:, :, 3] > NGUONG_A
    h, w = m.shape
    nhan = np.zeros((h, w), np.int32)
    dem, so = [], 0
    for sy in range(h):
        for sx in range(w):
            if m[sy, sx] and not nhan[sy, sx]:
                so += 1
                ngan = deque([(sy, sx)])
                nhan[sy, sx] = so
                n = 0
                while ngan:
                    y, x = ngan.popleft()
                    n += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not nhan[ny, nx]:
                            nhan[ny, nx] = so
                            ngan.append((ny, nx))
                dem.append(n)
    if so <= 1:
        return im, 0
    tong = sum(dem)
    giu = {i + 1 for i, n in enumerate(dem) if n >= MANH_TOI_THIEU * tong}
    bo = np.isin(nhan, list(giu), invert=True) & m
    a[bo, 3] = 0
    return Image.fromarray(a), so - len(giu)


def cat_sat(im):
    """Cắt sát vùng có alpha."""
    a = np.array(im)[:, :, 3]
    ys, xs = np.nonzero(a > NGUONG_A)
    if not len(xs):
        raise ValueError('ảnh rỗng — không có pixel nào đục')
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def goc_truc(im):
    """Góc trục chính, đo bằng PCA trên các pixel đục (có trọng số alpha)."""
    a = np.array(im)[:, :, 3].astype(float)
    ys, xs = np.nonzero(a > NGUONG_A)
    w = a[ys, xs]
    x = xs - np.average(xs, weights=w)
    y = ys - np.average(ys, weights=w)
    cov = np.cov(np.vstack([x, y]), aweights=w)
    val, vec = np.linalg.eigh(cov)
    vx, vy = vec[:, np.argmax(val)]
    return math.degrees(math.atan2(vy, vx))


def dau_ben_phai(im, lat=None):
    """ĐẦU (quả cầu/lưỡi) phải nằm ở +X.

    Mặc định đoán: nửa nào NẶNG hơn thì nửa đó sang phải. Đúng với trượng và quyền
    trượng — đầu là một khối cầu/hoa văn to. SAI với kiếm: lưỡi kiếm dài nhưng mỏng,
    còn chuôi thì ngắn mà đặc, nên tổng alpha nửa chuôi có thể lớn hơn. Đo được trên
    hai cây lấy từ gói Spine: đại kiếm và mã kiếm đều bị lật ngược, chuôi nằm bên phải.

    Không có phép đoán nào phủ được cả hai họ — với trượng thì "đầu" là đầu DÀY, với
    kiếm thì "đầu" là mũi NHỌN, hai dấu hiệu ngược nhau. Nên `lat` cho phép ép thẳng:
    True là xoay 180°, False là giữ nguyên, None là để nó tự đoán như cũ.
    """
    if lat is not None:
        return im.transpose(Image.ROTATE_180) if lat else im
    a = np.array(im)[:, :, 3].astype(float)
    nua = a.shape[1] // 2
    if a[:, :nua].sum() > a[:, nua:].sum():
        return im.transpose(Image.ROTATE_180)
    return im


def cho_nam(im, ti=None):
    """Toạ độ tay nắm: `ti` phần chiều dài tính từ ĐUÔI, lấy giữa THÂN ở đúng cột đó.

    Mặc định NAM_TU_DUOI = 0,38 — đo trên cây trượng, nơi hai tay nắm giữa thân. Kiếm
    thì nắm sát chuôi hơn nhiều (chừng 0,15–0,20), để 0,38 là bàn tay rơi lên LƯỠI.
    """
    a = np.array(im)[:, :, 3]
    w = a.shape[1]
    x = int(round((NAM_TU_DUOI if ti is None else ti) * (w - 1)))
    for dx in range(0, w):                      # cột đó có thể rỗng — dò sang hai bên
        for c in (x - dx, x + dx):
            if 0 <= c < w:
                ys = np.nonzero(a[:, c] > NGUONG_A)[0]
                if len(ys):
                    return c, int(round((ys.min() + ys.max()) / 2))
    raise ValueError('không tìm được thân cây để đặt tay nắm')


def chuan_hoa(duong, ra_thumuc, lat=None, ti=None):
    im = Image.open(duong).convert('RGBA')
    im, da_bo = bo_manh_roi(im)
    im = cat_sat(im)
    im = im.rotate(goc_truc(im), resample=Image.BICUBIC, expand=True)
    im = dau_ben_phai(cat_sat(im), lat)
    if im.width != DAI_CHUAN:                   # thu/phóng giữ nguyên tỉ lệ
        cao = max(1, round(im.height * DAI_CHUAN / im.width))
        im = im.resize((DAI_CHUAN, cao), Image.LANCZOS)
    im = cat_sat(im)
    x, y = cho_nam(im, ti)
    ten = os.path.splitext(os.path.basename(duong))[0]
    os.makedirs(ra_thumuc, exist_ok=True)
    im.save(os.path.join(ra_thumuc, ten + '.png'))
    return ten, im.width, im.height, x, y, da_bo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('tep', nargs='+')
    ap.add_argument('--ra', default='public/game/assets/nv')
    # Hai tham số ÉP THẲNG, dùng khi phép đoán sai (xem dau_ben_phai / cho_nam).
    # Áp cho MỌI tệp trong một lượt gọi, nên cây nào cần ép thì gọi riêng cây đó.
    ap.add_argument('--lat', choices=['co', 'khong'], default=None,
                    help="'co' = xoay 180 độ, 'khong' = giữ nguyên. Bỏ trống thì tự đoán.")
    ap.add_argument('--nam', type=float, default=None,
                    help='chỗ nắm, tính bằng phần chiều dài từ ĐUÔI (mặc định 0.38)')
    n = ap.parse_args()
    print('// dán vào VK_ANH trong game.js:')
    loi = 0
    for d in n.tep:
        try:
            _lat = None if n.lat is None else (n.lat == 'co')
            ten, w, h, x, y, da_bo = chuan_hoa(d, n.ra, _lat, n.nam)
            ghi = f'   // {w}x{h}' + (f' · đã bỏ {da_bo} mảnh rời' if da_bo else '')
            print(f"  DONG_O_DAY:  {{ tep:'{ten}', x:{x}, y:{y} }},{ghi}")
        except Exception as e:                  # một tấm hỏng không được chặn cả mẻ
            print(f'  // {os.path.basename(d)}: LỖI — {e}', file=sys.stderr)
            loi += 1
    return 1 if loi else 0


if __name__ == '__main__':
    sys.exit(main())
