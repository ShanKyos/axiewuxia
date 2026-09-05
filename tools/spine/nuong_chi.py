#!/usr/bin/env python3
"""Nướng 16 Chimera từ rig Spine của kit Axie thành bảng khung hình.

    python3 tools/spine/nuong_chi.py [--kit <đường-kit>] [--cc <đường-cc-axie-gtk2d>]

Xuất ra public/game/assets/chimera/:
    <id>.webp    16 khung 'action/idle/normal', ô nhỏ  — danh sách, đồng hành, lưới 10 lượt
    <id>_q.webp  12 khung 'activity/appear' + 16 khung idle, ô lớn — chỉ màn quay Khế Ước
và ghi public/game/data/chi_anh.js — hình học ô, để game khỏi phải đoán.

BA CHỖ DỄ SAI, đã trả giá một lần cho mỗi chỗ:

① Hoạt cảnh ở đâu. 9/16 rig đóng gói .skel nhị phân mà skelbin.py chỉ đọc tới khối skin.
   Không cần viết bộ giải mã hoạt cảnh: MỌI rig Axie dùng chung một bộ 14 khe và cùng tên
   xương, nên bảng hoạt cảnh của một rig .json chạy đúng trên bộ xương của rig .skel. Đã kiểm
   cả 9 con: không con nào thiếu một cái xương nào mà idle+appear cần.

② Atlas hai đời. Gói nhân vật dùng Spine 4.x ('bounds:'), kit Axie dùng 3.8
   ('xy:'/'size:'/'rotate:') và xoay 18/26 vùng. hoatcanh.py chỉ đọc đời 4.x, nên phải dựng
   lại một tấm atlas PHẲNG: cắt từng vùng, xoay về đúng chiều, xếp thành một hàng.

③ Cỡ ô riêng từng con, nhưng hệ số thu CHUNG. Thử một cỡ ô chung cho cả 16 trước: ô phải to
   bằng con lớn nhất (bờm Inkmane, gai Thornpaw), và 14 con còn lại gánh phần rìa trong suốt
   đó suốt 24 khung — bảng quay phình từ 7 lên 11 MB. Nay mỗi con cắt sát của chính nó, còn
   tỉ lệ thật giữa con to và con nhỏ vẫn giữ được vì PHONG là một hằng số: game vẽ theo
   `thanCao` (thân cao mấy phần của ô) chứ không kéo mọi con về cùng một chiều cao.
"""
import os, sys, json, glob, time, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from skelbin import read_skel
from assemble import parse_atlas
from hoatcanh import TuThe, ve_khung
from nuong_nv import dai
from PIL import Image

# id Chimera -> tên bộ rig trong PvE/Starters. Cùng bảng với xuat_chimera.py đời trước, giữ
# nguyên để 16 con vẫn đúng con cũ — đổi rig là đổi mặt con vật trong save của người chơi.
BO = {
    'aurelion':  '21',  'netherfang': '18',  'tidewarden': '3',
    'emberjaw':  '1',   'voltcrest':  '15',  'ironshell':  '2',
    'petalkin':  '12',  'crimsonmaw': '17',  'thornpaw':   '24',
    'inkmane':   '23',  'cinderbeak': '5',   'mossback':   '16',
    'hexmite':   '11',  'ridgehorn':  '7',   'coghound':   '22',
    'sunspur':   '19',
}
# Rig cho mượn hoạt cảnh khi rig đích là .skel. Bất kỳ rig .json nào cũng được — cả bộ dùng
# chung một bộ xương — nhưng chốt một cái để 16 con cùng nhịp thở.
NGUON_HC = 'cc-axie-gtk2d/assets/axie-standard-assets/spines/starter-axies/01-buba-beast'

IDLE, APPEAR = 'action/idle/normal', 'activity/appear'
N_IDLE, N_APPEAR = 16, 12   # bảng nhỏ nướng đủ 16 khung idle; bảng quay chỉ lấy N_IDLE_Q
N_IDLE_Q = 12               # nhịp thở là dáng chậm — 12 khung cho 1,33s là 9 hình/giây, đủ mượt
                            # mà cắt được 1/7 dung lượng bảng quay, thứ đắt nhất trong đợt này
# 'back' là nền gỗ của kit. 'shadow' là bóng đổ vẽ sẵn — bỏ luôn vì cả hai chỗ dùng đều tự
# đổ bóng theo nền của mình: drawMount() vẽ elip trên mặt đất, màn quay thì lơ lửng giữa
# không trung, dán bóng gỗ vào là thấy ngay. Bóng đó còn loang rộng hơn cả con vật, giữ lại
# là ô phình thêm 40% mà toàn pixel mờ.
BO_KHE = ('back', 'shadow')
PHONG  = 0.62             # hệ số thu lúc nướng — không phải cỡ cuối, cắt xong còn thu lần nữa
W, H   = 900, 780         # khung nướng, rộng rãi để không con nào chạm mép
OX, OY = 0.5, 0.86        # gốc bộ xương (bàn chân) nằm ở đây trong khung
CAO_LON = 360             # chiều cao ô bảng quay
CAO_NHO = 132             # chiều cao ô bảng nhỏ
COT_LON, COT_NHO = 6, 8   # xếp lưới chứ không một hàng: một hàng 24 ô là quá 16383px của webp
CHAT = 80                 # chất lượng webp. Đo trên con nặng nhất: từ 86 xuống 70 chỉ bớt 20%
                          # dung lượng, nên cỡ ô mới là thứ quyết định, không phải nút này.


def goi(rig_dir, nguon_hc):
    """Đọc một rig (json hoặc skel) → (dữ liệu, atlas phẳng, bảng vùng)."""
    j = glob.glob(rig_dir + '/*.json')
    if j:
        d = json.load(open(j[0], encoding='utf-8'))
    else:
        d = read_skel(glob.glob(rig_dir + '/*.skel')[0])
        d['animations'] = nguon_hc                       # ① mượn hoạt cảnh
    src = Image.open(glob.glob(rig_dir + '/*.png')[0]).convert('RGBA')
    reg = parse_atlas(glob.glob(rig_dir + '/*.atlas')[0])
    manh = {}
    for n, r in reg.items():                             # ② dựng lại atlas phẳng
        x, y = r['xy']; w, h = r['size']
        manh[n] = (src.crop((x, y, x + h, y + w)).rotate(-90, expand=True)
                   if r.get('rotate') else src.crop((x, y, x + w, y + h)))
    tw = sum(p.width for p in manh.values()); th = max(p.height for p in manh.values())
    phang = Image.new('RGBA', (tw, th)); R = {}; cx = 0
    for n, p in manh.items():
        phang.paste(p, (cx, 0)); R[n] = [cx, 0, p.width, p.height]; cx += p.width
    return d, phang, R


def khung_con(rig_dir, nguon_hc):
    """Mọi khung của MỘT con: (appear…, idle…). Art gốc quay TRÁI nên lật sẵn sang PHẢI —
    drawMount() tự lật lại khi nhân vật đi sang trái."""
    d, im, R = goi(rig_dir, nguon_hc)
    tt = TuThe(d)
    ks = []
    for an, n in ((APPEAR, N_APPEAR), (IDLE, N_IDLE), (IDLE, N_IDLE_Q)):
        hc = d['animations'][an]; T = dai(hc)
        for i in range(n):
            ks.append(ve_khung(d, im, R, tt, hc, i * T / n, 'default',
                               W=W, H=H, phong=PHONG, ox=OX, oy=OY, bo_khe=BO_KHE)
                      .transpose(Image.FLIP_LEFT_RIGHT))
    return ks


def gop_bbox(a, b):
    if a is None: return b
    if b is None: return a
    return (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))


def luoi(ks, cot, duong, chat=86):
    w, h = ks[0].size
    hang = (len(ks) + cot - 1) // cot
    sh = Image.new('RGBA', (w * cot, h * hang))
    for i, k in enumerate(ks): sh.alpha_composite(k, ((i % cot) * w, (i // cot) * h))
    os.makedirs(os.path.dirname(duong), exist_ok=True)
    sh.save(duong, quality=chat, method=6)
    return os.path.getsize(duong)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kit', default='/home/user/axieinfinity/axie-origins-asset-kit')
    ap.add_argument('--cc',  default='/home/user/axieinfinity')
    a = ap.parse_args()
    goc = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
    ra  = os.path.join(goc, 'public/game/assets/chimera')
    kit = os.path.join(a.kit, 'Assets/OriginsKit/PvE/Starters')
    nguon = json.load(open(glob.glob(os.path.join(a.cc, NGUON_HC) + '/*.json')[0],
                           encoding='utf-8'))['animations']

    t0 = time.time()
    tat = {}
    for cid, rig in BO.items():
        tat[cid] = khung_con(os.path.join(kit, rig), nguon)
        print('  nướng %-11s rig %-3s %2d khung  %.1fs'
              % (cid, rig, len(tat[cid]), time.time() - t0))

    O = {}
    tong_n = tong_l = 0
    for cid, ks in tat.items():
        bb = None
        for k in ks: bb = gop_bbox(bb, k.getchannel('A').getbbox())
        # Nới ngang cho cân quanh trục đứng của bàn chân: con vật quay phải nên thân dồn về
        # một bên, không nới thì trục vẽ lệch khỏi tâm ô và con vật lắc khi đổi hướng.
        ax  = W * OX
        nua = max(ax - bb[0], bb[2] - ax)
        bb  = (int(ax - nua), bb[1], int(ax + nua), bb[3])
        cw0, ch0 = bb[2] - bb[0], bb[3] - bb[1]
        ks  = [k.crop(bb) for k in ks]

        lon = (round(cw0 * CAO_LON / ch0), CAO_LON)
        nho = (round(cw0 * CAO_NHO / ch0), CAO_NHO)
        q   = ks[:N_APPEAR] + ks[N_APPEAR + N_IDLE:]        # hiện + idle rút gọn
        bl  = luoi([k.resize(lon, Image.LANCZOS) for k in q], COT_LON,
                   os.path.join(ra, cid + '_q.webp'), CHAT)
        bn  = luoi([k.resize(nho, Image.LANCZOS) for k in ks[N_APPEAR:N_APPEAR + N_IDLE]],
                   COT_NHO, os.path.join(ra, cid + '.webp'), CHAT)
        tong_n += bn; tong_l += bl

        # `thanCao` — thân chiếm mấy phần chiều cao ô, đo ở khung idle đầu. Game nhân ngược lại
        # để CHIỀU CAO THÂN ra đúng số pixel muốn, chứ không phải chiều cao ô: ô có rìa trong
        # suốt do các khung khác nhô ra, lấy ô làm thước là con nào cựa nhiều thì bị vẽ bé đi.
        tb = ks[N_APPEAR].getchannel('A').getbbox()
        O[cid] = {'oRong': lon[0], 'oCao': lon[1], 'nhoRong': nho[0], 'nhoCao': nho[1],
                  'neoY': round((H * OY - bb[1]) / ch0, 4),
                  'thanCao': round((tb[3] - tb[1]) / ch0, 4)}
        print('  %-11s ô %3dx%-3d thân %.2f · nhỏ %3d KB · quay %3d KB'
              % (cid, lon[0], lon[1], O[cid]['thanCao'], bn // 1024, bl // 1024))

    duong = os.path.join(goc, 'public/game/data/chi_anh.js')
    open(duong, 'w', encoding='utf-8').write(
        '/* SINH RA TỰ ĐỘNG bởi tools/spine/nuong_chi.py — đừng sửa tay.\n'
        '   Hình học bảng khung Chimera: mỗi con một cỡ ô, và trong ô thì thân cao mấy phần\n'
        '   (`thanCao`) với bàn chân nằm ở đâu (`neoY`). Nướng lại là tệp này tự viết lại. */\n'
        'window.CHI_ANH = %s;\n' % json.dumps(
            {'nKhung': N_IDLE, 'nHien': N_APPEAR, 'nQuay': N_APPEAR + N_IDLE_Q,
             'cotQuay': COT_LON, 'cotNho': COT_NHO, 'o': O}, ensure_ascii=False, indent=1))
    print('nhỏ %.2f MB · quay %.2f MB · %.0fs' % (tong_n / 1e6, tong_l / 1e6, time.time() - t0))
    return 0


if __name__ == '__main__':
    sys.exit(main())
