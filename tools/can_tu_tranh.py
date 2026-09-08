#!/usr/bin/env python3
"""Suy VẬT CẢN VÔ HÌNH từ chính tranh nền — để người chơi không đi đè lên cây, gốc, đá.

Vì sao phép đo ảnh lần này HỢP VIỆC, trong khi ba lần trước đều hỏng (xem `cham_map.py`):
ba lần trước tôi hỏi câu NGỮ NGHĨA — "tranh này nhìn từ trên xuống hay nhìn ngang" — và thống
kê màu không trả lời được. Lần này câu hỏi là VẬT LIỆU CỤC BỘ: "điểm này là tán lá hay mặt
đất". Đó đúng là thứ màu sắc nói được, và quan trọng hơn: **kiểm lại được bằng mắt** — phủ
ellipse lên tranh rồi soi, sai chỗ nào thấy ngay chỗ đó.

⚠ BA LUẬT ISOMETRIC, BỎ LUẬT NÀO CŨNG HỎNG CẢM GIÁC:

  ① CHẶN Ở CHÂN, KHÔNG CHẶN CẢ TÁN. Tán cây xoè rộng và nhô LÊN trên trong tranh; cái đứng
     trên mặt đất chỉ là gốc. Chặn cả tán thì người chơi bị khựng ở khoảng không phía trên cây,
     và không đi ra SAU cây được — mất hẳn chiều sâu. Nên ellipse đặt ở ĐÁY vệt lá.

  ② ELLIPSE DẸT 2:1, KHÔNG PHẢI HÌNH TRÒN. Một vòng tròn nằm trên mặt đất, nhìn theo lối
     isometric, hiện ra là ellipse rộng gấp đôi chiều cao. Dùng hình tròn thì vùng chặn "dày"
     hơn mắt thấy ở phía trên và "mỏng" hơn ở hai bên — người chơi cảm được là sai dù không
     chỉ ra được sai ở đâu.

  ③ KHÔNG BAO GIỜ MỘT KHỐI = MỘT ELLIPSE — học từ lần chạy đầu. Lần đầu tôi hàn mặt nạ bằng
     nhân 21×21 rồi vẽ một ellipse cho mỗi khối liền. Bụi rời rạc dính hết vào nhau thành một
     khối, và ra đúng một ellipse rx=662 phủ 42% khổ map — chặn nguyên giữa map. Nay cắt khối
     theo CỘT rộng ~COT_RONG, mỗi cột một ellipse đặt ở chân CỘT ĐÓ. Hàng rào dài vì thế thành
     một dãy ellipse nhỏ men theo mép dưới — đúng thứ mắt thấy.

HAI LỚP VẬT LIỆU, vì một mặt nạ không đủ:

  · TÁN LÁ  — bão hoà cao, sáng vừa. Bắt bụi, lùm, vòm cây.
  · KHỐI TỐI — tối và nhạt màu. Bắt GỐC CỔ THỤ, tảng đá, bia đá, và dải nền tối ngoài khối đất.
    Thiếu lớp này thì quái và người chơi đứng ngay trên thân cây cổ thụ — đúng lỗi thấy được
    trong ảnh chụp đợt đầu của Rẻo Rừng Corran.

    ⚠ Lớp này KHÔNG theo luật ① — nó chặn CẢ BÓNG khối, ra hình CHỮ NHẬT, không phải ellipse ở
    chân. Lý do là chuyện của máy vẽ chứ không phải chuyện thẩm mỹ: engine vẽ tranh nền TRƯỚC
    rồi vẽ nhân vật ĐÈ LÊN, không sắp lớp theo trục y. Nên đứng "sau" gốc cổ thụ hiện ra y hệt
    đứng "trên" nó. Chặn đúng cái chân gốc để chừa chỗ đi vòng ra sau, như luật ① dạy, chỉ đổi
    một lỗi nhìn thấy lấy một lỗi nhìn thấy khác. Ngày nào có lớp vật thể tiền cảnh sắp theo y
    thì quay lại luật ①; hôm nay thì chặn kín.
    Rủi ro của lớp này là BÓNG ĐỔ: bóng cũng tối. Ở nền cát sáng của Corran bóng nhạt và mềm
    nên không lọt qua ngưỡng, nhưng tranh nền tối thì phải soi lại ảnh `--soi` trước khi dán.

Chạy:
    python3 tools/can_tu_tranh.py <tranh.jpg> <tên map>          # in ra JS
    python3 tools/can_tu_tranh.py <tranh.jpg> <tên map> --soi <ra.png>
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

KHO = (2600, 1900)
THAN_NV = 95            # thân nhân vật vẽ ra — thang để quyết "khối này có đáng chặn không"

CHAN_CAO = 0.32         # lấy bao nhiêu phần ĐÁY của vệt làm gốc — phần trên là tán, bỏ
COT_RONG = 190          # bề ngang mỗi cột khi xé khối to — luật ③
DET_NGANG = 0.72        # thu bán kính ngang lại một chút: tán bao giờ cũng xoè rộng hơn gốc
TI_LE_DET = 0.5         # ry = rx × ngần này — luật ②


def _la(a):
    """Mặt nạ TÁN LÁ. Ngưỡng lấy từ bản đã kiểm mắt trong phiên làm map Werebear Woods."""
    mx, mn = a.max(2), a.min(2)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return (mx >= 0.22) & (s > 0.30) & (mx < 0.62)


def _tham(a):
    """Mặt nạ KHỐI TỐI — gốc cổ thụ, đá, bia. Tối VÀ nhạt màu.

    Điều kiện `s < 0.45` là thứ tách khối tối khỏi tán lá tối: lá dù tối vẫn còn xanh (bão hoà
    cao), còn gỗ mục và đá thì xám. Bỏ điều kiện này thì nửa vòm cây bị hút vào đây.
    """
    mx, mn = a.max(2), a.min(2)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return (mx < 0.26) & (s < 0.45)


def _xe(m, mo, han, min_rong, min_dien, dang='ellipse'):
    """Dọn mặt nạ rồi xé từng khối theo cột — luật ③.

    `dang='ellipse'` → ellipse dẹt ở CHÂN cột (luật ①②), dùng cho tán lá.
    `dang='rect'`    → chữ nhật trùm cả bóng cột, dùng cho khối tối (xem chú thích đầu tệp).
    """
    m = ndimage.binary_opening(m, np.ones((mo, mo)))    # dọn hạt lấm
    m = ndimage.binary_closing(m, np.ones((han, han)))  # hàn NHẸ — xem luật ③
    lab, _ = ndimage.label(m)
    ra = []
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        if sl is None:
            continue
        ys, xs = sl
        rong = xs.stop - xs.start
        khoi = lab[sl] == i
        if rong < min_rong or khoi.sum() < min_dien:
            continue
        nc = max(1, int(round(rong / COT_RONG)))
        for c in range(nc):
            x0 = int(c * rong / nc); x1 = int((c + 1) * rong / nc)
            cot = khoi[:, x0:x1]
            hang = np.where(cot.any(1))[0]
            if not len(hang):
                continue
            if dang == 'rect':
                cc = np.where(cot.any(0))[0]
                if not len(cc) or (cc[-1] - cc[0]) < 24:
                    continue
                ra.append({'x': round(xs.start + x0 + cc[0]), 'y': round(ys.start + hang[0]),
                           'wd': round(cc[-1] - cc[0]), 'ht': round(hang[-1] - hang[0])})
                continue
            c_cao = hang[-1] - hang[0] + 1
            h_chan = max(8, int(c_cao * CHAN_CAO))          # luật ① — chỉ lấy dải đáy
            chan = cot[hang[-1] - h_chan + 1: hang[-1] + 1, :]
            cc = np.where(chan.any(0))[0]
            if not len(cc) or (cc[-1] - cc[0]) < 24:
                continue
            cx = xs.start + x0 + (cc[0] + cc[-1]) / 2
            rx = max(14, (cc[-1] - cc[0]) / 2 * DET_NGANG)
            ra.append({'x': round(cx), 'y': round(ys.start + hang[-1] - h_chan / 2),
                       'rx': round(rx), 'ry': round(max(8, rx * TI_LE_DET))})   # luật ②
    return ra, m


def can_tu_tranh(tranh):
    a = np.asarray(Image.open(tranh).convert('RGB').resize(KHO, Image.LANCZOS), dtype=float) / 255
    # Vệt lá nhỏ hơn ngần này thì BỎ: bụi thấp ngang đầu gối, người chơi bước qua được, chặn lại
    # chỉ làm đường đi vụn ra và làm lưới tìm đường nặng thêm mà không được gì.
    la, m_la = _xe(_la(a), 7, 11, min_rong=70, min_dien=3200)
    # Khối tối đòi to hơn hẳn: ngưỡng thấp thì mọi vệt bóng và khe tối đều thành tường.
    tham, m_th = _xe(_tham(a), 9, 15, min_rong=90, min_dien=9000, dang='rect')
    ra = la + tham
    ra.sort(key=lambda o: (o['y'], o['x']))
    return ra, (m_la | m_th), len(la), len(tham)


def soi(tranh, cans, out):
    """Phủ vật cản lên tranh để KIỂM BẰNG MẮT — bước này không được bỏ."""
    im = Image.open(tranh).convert('RGB').resize(KHO, Image.LANCZOS)
    d = ImageDraw.Draw(im, 'RGBA')
    for o in cans:
        if 'wd' in o:
            d.rectangle([o['x'], o['y'], o['x'] + o['wd'], o['y'] + o['ht']],
                        fill=(40, 90, 255, 80), outline=(120, 170, 255, 230), width=4)
        else:
            d.ellipse([o['x'] - o['rx'], o['y'] - o['ry'], o['x'] + o['rx'], o['y'] + o['ry']],
                      fill=(255, 40, 40, 90), outline=(255, 90, 90, 220), width=3)
    im.save(out)


def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(2)
    tranh, ten = sys.argv[1], sys.argv[2]
    cans, m, n_la, n_th = can_tu_tranh(tranh)
    phu = 100 * sum(o['wd'] * o['ht'] if 'wd' in o else np.pi * o['rx'] * o['ry']
                    for o in cans) / (KHO[0] * KHO[1])
    print(f"// {len(cans)} vật cản suy từ {os.path.basename(tranh)} ({n_la} tán lá + {n_th} khối "
          f"tối) · phủ {phu:.1f}% khổ map", file=sys.stderr)
    if '--soi' in sys.argv:
        ra = sys.argv[sys.argv.index('--soi') + 1]
        soi(tranh, cans, ra)
        print(f"// ảnh soi: {ra}", file=sys.stderr)
    print(f"  {ten}: [")
    for i in range(0, len(cans), 4):
        print('    ' + ' '.join(
            ("{ x:%d, y:%d, wd:%d, ht:%d }," % (o['x'], o['y'], o['wd'], o['ht'])) if 'wd' in o
            else ("{ x:%d, y:%d, rx:%d, ry:%d }," % (o['x'], o['y'], o['rx'], o['ry']))
            for o in cans[i:i + 4]))
    print("  ],")


if __name__ == '__main__':
    main()
