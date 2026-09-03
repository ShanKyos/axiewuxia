#!/usr/bin/env python3
"""Đắp một VŨ KHÍ RỜI (tranh phẳng, ví dụ pixel art) lên bộ xương Spine, nướng ra bảng khung.

    python3 tools/spine/nuong_vk.py <thư-mục-gói> '<tên-da>' <tranh-vũ-khí.png> <tên-ra>

Xuất public/game/assets/nv/<tên-ra>_vk.png — đúng khuôn bảng khung mà nuong_nv.py sinh ra cho
lớp vũ khí, nên game thay một tệp là xong, không phải sửa một dòng mã nào.

VÌ SAO KHÔNG DÁN TĨNH: tay nhân vật động suốt 80 khung (đứng, đi, chém, niệm). Dán một cây
trượng đứng yên vào giữa ô thì nó rời khỏi tay ngay khung thứ hai.

CÁCH LÀM — buộc vào XƯƠNG ĐIỂM CẦM:
  · Bộ xương có sẵn hai xương '左手持剑点' / '右手持剑点' — đúng nghĩa "điểm bàn tay cầm binh
    khí". Mỗi khung lấy ma trận thế giới của xương đó ra: được vị trí bàn tay và hướng cẳng tay.
  · Đặt chỗ NẮM của cây trượng (mặc định 40% từ chuôi lên) vào đúng vị trí ấy, xoay theo hướng
    cẳng tay cộng một góc lệch cố định, phóng về một chiều dài cố định.
  · Góc lệch tính ngược từ tư thế đứng: muốn khung đứng cây trượng dựng ở −88° thì lệch bằng
    bấy nhiêu trừ đi góc xương lúc đứng. Đo một lần, không đặt tay.

BA THỨ ĐÃ THỬ VÀ HỎNG, ghi lại để đừng ai làm lại:
  ① Buộc vào xương '武器'. Xương này ĐỨNG YÊN TUYỆT ĐỐI ở cả bốn hoạt cảnh (góc luôn −27,1°,
     vị trí luôn (−127, 384)) — vũ khí gốc động được là nhờ BIẾN DẠNG LƯỚI chứ không nhờ xương.
     Buộc vào đó thì cây trượng đứng chết một chỗ trong khi người vung tay.
  ② Kê cây trượng mới trùng khít hai đầu mút của HÌNH VŨ KHÍ CŨ. Bám hoạt cảnh thì đúng, nhưng
     vũ khí gốc của gói này là một cây dài cầm ở gần đầu, cán chĩa ra sau — nên cây trượng mới
     cũng nằm chéo sau lưng, không ra dáng "đang cầm".
  ③ Buộc vào tay XA ('右手持剑点'). Tay này mới là tay vung (quay 279° trong cú chém), nhưng nó
     nằm ở x=104 trong khi đầu là x≈120: cây trượng dựng đứng ở đó cắt ngang mặt.
Tay GẦN ('左手持剑点') ở x=149, nằm hẳn về phía trước thân — dựng đứng là sạch, và nó vẫn dời
211px/165px trong cú chém nên cây trượng vẫn đưa theo tay.

LẬT THEO TỪNG HOẠT CẢNH: trong '05_MagicAttack' xương tay gần quay ngược chừng 180°, để nguyên
thì quả cầu chúc xuống đất. Nên mỗi hoạt cảnh xét MỘT LẦN ở khung đầu: nếu đầu trượng nằm dưới
chỗ nắm thì cộng 180° cho cả hoạt cảnh. Xét một lần chứ không xét từng khung — xét từng khung
thì giữa cú chém nó lật cái bụp, thành một khung giật.
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from hoatcanh import doc_goi, TuThe, ap_hoat_canh, ap_ik
from PIL import Image

KHE_VK  = ('左手武器', '左手武器2b', '左手武器2c')
KHE_HFX = ('爆炸特效', '爆炸特效(残影）')
KHE_TOC = ('背后头发',)
KHUNG   = [('00_Idle', 16), ('00_Walk', 32), ('08_SwordAttack', 16), ('05_MagicAttack', 16)]
O_W, O_H, COT = 240, 300, 16
CAO_THAN, GOT_Y = 159, 212

# Hai con số dưới đây đo trên bộ giáp CÓ MŨ TRÙM, không phải trên bản trần. Bản trần để dựng
# thẳng (−88°) trông vẫn ổn, nhưng giáp giai 1 có mũ trùm bằng vải thô cùng tông nâu với đầu
# trượng gỗ — dựng thẳng thì hai khối nâu chồng lên nhau và bóng dáng nhoè hẳn. Ngả thêm 14°
# là đầu trượng ra khỏi mũ, khoảng tối trong mũ đọc được trọn vẹn.
XUONG_NAM = '左手持剑点'   # điểm bàn tay cầm binh khí, phía TRƯỚC thân
GOC_DUNG  = -74.0          # khung đứng: trượng chống đất, ngả về trước cho đầu trượng RA KHỎI mũ
DAI_VK    = 142.0          # chiều dài trượng trong ô 240x300 (thân cao 159)
CHO_NAM   = 0.40           # tay nắm ở 40% từ chuôi lên ⇒ chuôi chạm đất, đầu ngang tầm mắt


def truc_chinh(P):
    """Trục chính của đám điểm + hai đầu mút dọc trục. P: mảng (n,2)."""
    P = np.asarray(P, float)
    tam = P.mean(0)
    Q = P - tam
    cxx = (Q[:, 0] ** 2).mean(); cyy = (Q[:, 1] ** 2).mean(); cxy = (Q[:, 0] * Q[:, 1]).mean()
    goc = 0.5 * math.atan2(2 * cxy, cxx - cyy)
    u = np.array([math.cos(goc), math.sin(goc)])
    t = Q @ u
    return tam, u, P[int(t.argmin())], P[int(t.argmax())]


def dau_mut_anh(img):
    """Chuôi và ngọn của bức vẽ vũ khí, trong hệ toạ độ ảnh (y xuống).

    Đầu nào NẶNG hơn là ngọn: đếm điểm ảnh trong 22% chiều dài quanh mỗi mút. Đầu trượng /
    lưỡi kiếm lúc nào cũng to hơn cán, nên phép đếm này không cần biết bức vẽ quay hướng nào.
    """
    A = np.asarray(img)[:, :, 3]
    ys, xs = np.nonzero(A > 8)
    P = np.stack([xs, ys], 1).astype(float)
    _, _, m0, m1 = truc_chinh(P)
    dai = np.linalg.norm(m1 - m0)
    n0 = int((np.linalg.norm(P - m0, axis=1) < dai * 0.22).sum())
    n1 = int((np.linalg.norm(P - m1, axis=1) < dai * 0.22).sum())
    return (m0, m1) if n1 >= n0 else (m1, m0)


def dai_hc(hc):
    return max((kf.get('time', 0) for gr in hc.values() if isinstance(gr, dict)
                for b in gr.values() for tl in (b.values() if isinstance(b, dict) else [b])
                if isinstance(tl, list) for kf in tl if isinstance(kf, dict)), default=1.0) or 1.0


def nuong(goi, skin, anhVK, ra_ten):
    from nuong_nv import _do
    d, im, R = doc_goi(goi)
    tt = TuThe(d)

    vk = Image.open(anhVK).convert('RGBA')
    vk = vk.crop(vk.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    aChuoi, aNgon = dau_mut_anh(vk)
    aDai = float(np.linalg.norm(aNgon - aChuoi))
    aGoc = math.atan2(*(aNgon - aChuoi)[::-1])
    nam = aChuoi + (aNgon - aChuoi) * CHO_NAM

    # Hệ số thu + bù mặt đất: đo y nguyên xi cách nuong_nv.py đo, để hai bảng khung chồng khít.
    bo_than = KHE_VK + KHE_HFX
    bb = _do(d, im, R, tt, skin, bo_than + KHE_TOC, W=1400, H=2000,
             phong=1.0, ox=.5, oy=.86).getchannel('A').getbbox()
    phong = CAO_THAN / (bb[3] - bb[1])
    bb2 = _do(d, im, R, tt, skin, bo_than, W=O_W, H=O_H,
              phong=phong, ox=120 / O_W, oy=252 / O_H).getchannel('A').getbbox()
    oy = (252 - ((bb2[3] - 40) - GOT_Y)) / O_H

    def gocXuong(W):
        return -math.atan2(W[2], W[0])          # ra hệ MÀN HÌNH: y lật nên góc đổi dấu

    # góc lệch cố định, đo từ khung đứng
    hcD = d['animations']['00_Idle']
    ap_hoat_canh(tt, hcD, 0); tt.tinh(); ap_ik(tt, d, hcD, 0)
    LECH = math.radians(GOC_DUNG) - (gocXuong(tt.theoTen()[XUONG_NAM]) + aGoc)

    ks = []
    for ten, n in KHUNG:
        hc = d['animations'][ten]
        T = dai_hc(hc)
        # lật MỘT LẦN cho cả hoạt cảnh, quyết ở khung đầu
        ap_hoat_canh(tt, hc, 0); tt.tinh(); ap_ik(tt, d, hc, 0)
        g0 = gocXuong(tt.theoTen()[XUONG_NAM]) + aGoc + LECH
        lat = math.pi if math.sin(g0) > 0 else 0.0      # sin>0 ⇒ đầu trượng chúc xuống
        for i in range(n):
            t = T * i / n
            ap_hoat_canh(tt, hc, t); tt.tinh(); ap_ik(tt, d, hc, t)
            W = tt.theoTen()[XUONG_NAM]
            gx = W[4] * phong + 120
            gy = O_H * oy - W[5] * phong
            goc = gocXuong(W) + LECH + lat
            k = DAI_VK / aDai
            ca, sa = math.cos(goc) * k, math.sin(goc) * k
            M = np.array([[ca, -sa], [sa, ca]])
            tv = np.array([gx, gy]) - M @ nam
            Mi = np.linalg.inv(M); ti = -Mi @ tv
            ks.append(vk.transform((O_W, O_H), Image.AFFINE,
                                   (Mi[0, 0], Mi[0, 1], ti[0], Mi[1, 0], Mi[1, 1], ti[1]),
                                   resample=Image.NEAREST))

    hang = (len(ks) + COT - 1) // COT
    bang = Image.new('RGBA', (COT * O_W, hang * O_H), (0, 0, 0, 0))
    for i, o in enumerate(ks):
        bang.paste(o, ((i % COT) * O_W, (i // COT) * O_H))
    duong = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                          '../../public/game/assets/nv/%s_vk.png' % ra_ten))
    bang.save(duong, optimize=True)
    print('→ %s  (%d khung, %dx%d)' % (duong, len(ks), bang.width, bang.height))
    print('   trượng dài %.1f px trong ảnh gốc, lệch %.1f°' % (aDai, math.degrees(LECH)))


if __name__ == '__main__':
    if len(sys.argv) != 5:
        print(__doc__); sys.exit(1)
    nuong(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
