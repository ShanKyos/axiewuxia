#!/usr/bin/env python3
"""Vẽ ẢNH THAM CHIẾU cho tranh nền CHỈ-ĐẤT của map dạng LÀN, sinh từ chính hình học đang chạy.

Vì sao cần: prompt bằng chữ không ép được model đặt con đường ĐÚNG CHỖ. Bảo "một lối mòn chạy
ngang" thì nó vẽ lối mòn ở đâu cũng được — mà `diTrong` đã chốt cứng chỗ người chơi đi được, nên
lối mòn vẽ lệch là tranh và va chạm nói hai chuyện khác nhau. Đưa thẳng mặt nạ này làm ảnh tham
chiếu thì chỗ nào là đường đã là chuyện đã rồi.

⚠ CHỈ BA TÔNG, KHÔNG MÀU LẠ. Học từ đợt làm mặt nạ bố cục trước (xem tools/phac_bocuc.py): bản
đầu tô lối ra bằng XANH DƯƠNG, model đọc xanh dương là NƯỚC và biến bốn lối ra thành bốn con
sông. Mọi màu lạ trong ảnh tham chiếu đều bị dịch thành VẬT LIỆU.

Ba tông ở đây, và mỗi tông là một chất liệu thật:
  · LỐI MÒN  — đất trần bị giẫm mòn, dải hẹp chạy giữa hành lang
  · VỆ CỎ    — phần còn lại của hành lang: vẫn đi được, nhưng là cỏ chứ không phải đường
  · NGOÀI    — ngoài hành lang: nền rừng tối, sẽ bị hàng cây (vật thể rời) phủ lên

Lối mòn HẸP HƠN hành lang là cố ý. Tô cả 500px hành lang thành đường thì ra một con đường rộng
như đại lộ, nhìn không ra lối mòn trong rừng; mà thu hành lang lại cho bằng đường thì hết chỗ
đánh nhau. Vẽ đường hẹp nằm TRONG hành lang rộng là cách các game vẫn làm: mắt đọc ra con đường,
chân vẫn đi được cả vạt cỏ hai bên.

Chạy:  python3 tools/phac_lan.py [thư mục ra]
"""
import os, sys
import math
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dung_lan import W, H, tim, nua_rong          # MỘT nguồn hình học duy nhất

MON_NUA = 140          # nửa bề ngang lối mòn — 280px, hơn nửa hành lang một chút
CHONG = 300            # hai tấm chồng nhau bao nhiêu để còn chỗ hoà mối nối

MAU = {
    'ngoai': (30, 26, 22),      # ngoài hành lang — nền rừng tối
    've':    (96, 104, 62),     # vệ cỏ trong hành lang
    'mon':   (176, 158, 120),   # lối mòn đất trần
}


def ve_lan(size=(W, H)):
    im = Image.new('RGB', size, MAU['ngoai'])
    d = ImageDraw.Draw(im)
    kx, ky = size[0] / W, size[1] / H
    # hành lang: nối các lát cắt thành một dải liền
    for x in range(0, W, 8):
        c, r = tim(x), nua_rong(x)
        d.rectangle([x*kx, (c-r)*ky, (x+8)*kx, (c+r)*ky], fill=MAU['ve'])
    # lối mòn: uốn theo tim nhưng lệch nhẹ và đổi bề ngang, để không ra một dải nhựa thẳng tắp
    for x in range(0, W, 8):
        c = tim(x)
        lech = 26 * math.sin(x / W * 2 * math.pi * 5.5)          # đường đi lượn trong lòng hành lang
        rong = MON_NUA * (0.82 + 0.18 * math.sin(x / W * 2 * math.pi * 3.1))
        rong = min(rong, nua_rong(x) - 55)                        # luôn chừa vệ cỏ hai bên
        d.rectangle([x*kx, (c+lech-rong)*ky, (x+8)*kx, (c+lech+rong)*ky], fill=MAU['mon'])
    # làm mềm mép: mặt nạ cạnh dao cứng khiến model vẽ ra đường viền kẻ chỉ
    return im.filter(ImageFilter.GaussianBlur(3))


def main():
    ra = sys.argv[1] if len(sys.argv) > 1 else 'docs/phac_lan'
    os.makedirs(ra, exist_ok=True)
    day = ve_lan()
    day.save(os.path.join(ra, 'lan_toanphan.jpg'), quality=94)

    # Hai tấm chồng mép. Một lần sinh của model không ra nổi khổ 4,57:1 (tỉ lệ rộng nhất thường
    # có là 21:9 = 2,33:1), nên cắt đôi: mỗi tấm ~2,4:1, sinh được nguyên bản rồi ghép lại.
    giua = W // 2
    khung = [('A', 0, giua + CHONG // 2), ('B', giua - CHONG // 2, W)]
    for ten, x0, x1 in khung:
        t = day.crop((x0, 0, x1, H))
        t.save(os.path.join(ra, f'lan_{ten}.jpg'), quality=94)
        print(f'  tấm {ten}: thế giới x {x0}-{x1} · {t.width}x{t.height} · tỉ lệ {t.width/t.height:.2f}:1')
    print(f'  toàn phần: {W}x{H} · tỉ lệ {W/H:.2f}:1 · chồng mép {CHONG}px')
    print(f'  → {ra}/')


if __name__ == '__main__':
    main()
