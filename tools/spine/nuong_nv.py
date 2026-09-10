#!/usr/bin/env python3
"""Nướng một gói Spine thành bảng khung cho drawPlayer/heroSprite.

    python3 tools/spine/nuong_nv.py <thư-mục-gói> <tên-da> <tên-tệp-ra>

Ví dụ:
    python3 tools/spine/nuong_nv.py /tmp/goi3 'Violet Crystal Staff' dw_t9

Xuất ra public/game/assets/nv/<tên>.png (thân) và <tên>_vk.png (vũ khí).

Thêm `--lop` thì nướng NĂM LỚP RỜI (<tên>_h/_t1/_c/_a/_t2/_n .png) thay cho tấm thân liền,
để bốn ô trang bị mặc lẫn bộ được — xem bảng LOP ở dưới.

HỢP ĐỒNG TOẠ ĐỘ với game — sai một trong bốn dòng này là nhân vật lệch:
  · ô 240x300 = (HERO_W + HS_PAD*2) x (HERO_H + HS_PAD*2)
  · bảng xếp 16 cột
  · gốc bộ xương (80,212) nằm đúng ở (120,252) trong ô
  · thứ tự khung trùng HS_FRAMES: 16 đứng · 32 đi · 16 đánh · 16 niệm
"""
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hoatcanh import doc_goi, TuThe, ve_khung, bo_vat_ly, lang_vat_ly
from PIL import Image

KHE_VK  = ('左手武器', '左手武器2b', '左手武器2c')   # vũ khí bị cắt 4 mảnh trên 3 khe
KHE_HFX = ('爆炸特效', '爆炸特效(残影）')            # hiệu ứng nổ — game tự lo, không nướng
KHE_TOC = ('背后头发',)                              # tóc sau, chỉ dùng lúc ĐO
# BẢNG MỘT — những khối vẽ ở mọi khung hình, luôn nạp.
# Khối mới đứng CUỐI, không chen vào giữa: các khối cũ giữ nguyên vị trí nên bảng đời cũ và
# đời mới cùng đọc được bằng một bộ mốc.
# 'DANH' là chỗ trống, thay bằng hoạt cảnh đánh RIÊNG CỦA TỪNG LỚP (xem --danh).
# `00_Run` lấy 32 mẫu chứ không phải 16. Nguồn dài 0,600 giây với khoá đặt trên lưới 30
# khung/giây, tức 18 KHUNG GỐC — lấy 16 là dưới bản gốc, mất tư thế, và bàn chân dịch 13,31px
# mỗi khung (khối đi chỉ 3,96px). Bảng vì thế dài 112 ô thay vì 96; game đọc số khung theo
# TỪNG BỘ (`NV_KHUNG_R` trong game.js) nên bảng đời cũ 96 ô vẫn chạy song song được.
KHUNG   = [('00_Idle', 16), ('00_Walk', 32), ('DANH', 16), ('05_MagicAttack', 16),
           ('00_Run', 32)]

# BẢNG HAI — những khối chỉ hiện trong chốc lát hoặc ở một trạng thái riêng. Tách ra bảng
# riêng để game NẠP KHI CẦN: bảng một đã 27,6 MB sau giải nén, nhân bảy bộ là 193 MB, mà đo
# được cả 193 MB đó đang nạp sẵn lúc mở trang trong khi người chơi chỉ vẽ đúng lớp của mình.
#
# Mỗi dòng: (hoạt cảnh, số khung, đổi mảnh). Cột thứ ba đổi KHUÔN MẶT — khe đầu có sẵn bốn
# mảnh ở mọi skin mà chưa hoạt cảnh nào dùng tới ba cái sau.
#
# Số khung chia theo MẮT NHÌN TỚI BAO NHIÊU, không chia đều: đòn đánh và trúng đòn hiện suốt
# trận nên cần mượt; ngồi/tương tác/trạng thái là dáng chậm, sáu khung là đủ.
KHUNG2  = [('03_Hurt',         8,  {'头': '头_痛苦'}),   # trúng đòn — mặt đau
           ('06_PunchAttack',  12, None),                # tay không
           ('08_SwordAttack2', 16, None),                # nhát thứ hai / tay phụ song kiếm
           ('02_Death',        10, {'头': '头_闭眼'}),   # chết — nhắm mắt
           ('04_Jumpping',     10, None),                # bật người, dùng cho lúc cất cánh
           ('00_Squat',        6,  {'头': '头_闭眼'}),   # ngồi tĩnh tâm ở Suối Ký Ức
           ('09_Interactive',  6,  None),                # bắt chuyện NPC / mở rương
           ('07_StatusEffect', 6,  None),                # dáng đứng khi dính buff
           ('01_Dance',        10, {'头': '头_开心'})]   # nhảy — màn chọn lớp, mặt vui
# ── NĂM LỚP RỜI, THEO ĐÚNG THỨ TỰ VẼ CỦA BỘ XƯƠNG ──────────────────────────────────────────
# Chủ dự án chốt: bốn ô trang bị phải TÁCH RỜI — mặc mỗi đôi giày thì chỉ đôi giày đổi, chứ
# không phải đủ bộ mới hiện. Muốn thế thì không nướng một tấm THÂN LIỀN nữa, mà nướng từng
# nhóm khe ra một tấm riêng rồi game chồng lại lúc vẽ.
#
# ⚠ THỨ TỰ Ở ĐÂY LÀ THỨ TỰ VẼ CỦA SPINE, KHÔNG PHẢI THỨ TỰ Ô TRANG BỊ. Bộ xương vẽ:
#     背后头发 · 左手 · 左腿 · 右腿 · 躯干 · (vũ khí) · 右手 · 右手前伸 · 头
# tức ô `tay` NẰM HAI BÊN ô `ao` (tay xa ở sau thân, tay gần ở trước), và ô `non` thì tóc sau
# nằm dưới cùng còn đầu nằm trên cùng. Gộp `tay` làm một lớp là tay xa nhảy ra trước ngực.
# Nên năm lớp, không phải bốn — và game phải chồng ĐÚNG thứ tự này.
#
# Cột thứ ba là Ô TRANG BỊ mà lớp đó thuộc về: game tra ngược để biết lớp này lấy từ bộ nào.
LOP = [('h',  ('背后头发',),          'non'),    # tóc sau — rỗng ở bản mẫu hiện tại
       ('t1', ('左手',),              'tay'),    # tay XA, nằm sau thân
       ('c',  ('左腿', '右腿'),        'chan'),
       ('a',  ('躯干_带短裤',),        'ao'),
       ('t2', ('右手', '右手前伸'),     'tay'),   # tay GẦN, nằm trước thân
       ('n',  ('头',),                'non')]
O_W, O_H, COT = 240, 300, 16
CAO_THAN, GOT_Y = 159, 212     # đỉnh đầu y=53 → gót y=212, theo HERO_JOINT

def dai(hc):
    """Hoạt cảnh dài bao nhiêu giây — Spine không ghi sẵn, phải dò khoá muộn nhất."""
    m = 0
    for gr in hc.values():
        if not isinstance(gr, dict): continue
        for b in gr.values():
            for tl in (b.values() if isinstance(b, dict) else [b]):
                if isinstance(tl, list):
                    for kf in tl:
                        if isinstance(kf, dict): m = max(m, kf.get('time', 0))
    return m or 1.0

def _do(d, im, R, tt, skin, bo, **kw):
    return ve_khung(d, im, R, tt, d['animations']['00_Idle'], 0, skin, bo_khe=bo, **kw)

# ── nướng MỘT khối hoạt cảnh, có chạy ràng buộc vật lý ─────────────────────────────────────
# Hoạt cảnh LẶP thì lò xo phải được quay trước cho lắng, nếu không khung 0 có váy đứng cứng
# còn khung cuối váy đang bay — chỗ nối vòng lặp giật, và giật mãi. Hoạt cảnh MỘT LẦN (đánh,
# trúng đòn, chết) thì bắt đầu từ trạng thái nghỉ là đúng: trong game nó nối vào từ dáng đứng.
LAP = {'00_Idle', '00_Walk', '00_Run', '01_Dance', '01_Dance2', '07_StatusEffect'}

def _day_khung(d, im, R, tt, hc, ten, n, skin, phong, oy, bo, doi=None):
    """Trả n khung của một khối, đã áp khoá + IK + vật lý."""
    T = dai(hc)
    vl = bo_vat_ly(d, tt)
    if vl:
        for c in vl: c.dat_lai()
        if ten in LAP: lang_vat_ly(vl, tt, d, hc, T, n)
    ra = []
    for i in range(n):
        ra.append(ve_khung(d, im, R, tt, hc, i*T/n, skin, W=O_W, H=O_H,
                           phong=phong, ox=120/O_W, oy=oy, bo_khe=bo, doi_manh=doi,
                           bo_vl=vl, dt_vl=T/n))
    return ra

def nuong(goi, skin, danh='08_SwordAttack'):
    d, im, R = doc_goi(goi); tt = TuThe(d)
    moiKhe  = tuple(s['name'] for s in d['slots'])
    bo_than = KHE_VK + KHE_HFX
    # ① Hệ số thu: đo ĐỈNH ĐẦU → GÓT, KHÔNG tính tóc sau. Đo cả chỏm tóc vào là nhân vật
    #    lùn đi chừng 18% so với phần còn lại của game.
    bb = _do(d, im, R, tt, skin, bo_than + KHE_TOC, W=1400, H=2000, phong=1.0, ox=.5, oy=.86
             ).getchannel('A').getbbox()
    phong = CAO_THAN / (bb[3] - bb[1])
    # ② Bù mặt đất: bàn chân trong art thò xuống dưới gốc bộ xương vài px. Đặt y=0 vào mốc 212
    #    không thôi là cả người tụt xuống dưới bóng.
    bb2 = _do(d, im, R, tt, skin, bo_than, W=O_W, H=O_H, phong=phong, ox=120/O_W, oy=252/O_H
              ).getchannel('A').getbbox()
    oy = (252 - ((bb2[3] - 40) - GOT_Y)) / O_H
    ra = {}
    for lop, bo in (('than', bo_than),
                    ('vukhi', tuple(k for k in moiKhe if k not in KHE_VK))):
        ks = []
        for ten, n in KHUNG:
            tenTh = danh if ten == 'DANH' else ten
            ks += _day_khung(d, im, R, tt, d['animations'][tenTh], tenTh, n, skin, phong, oy, bo)
        ra[lop] = ks
    # BẢNG HAI — cùng hệ toạ độ, cùng cỡ ô, chỉ khác chỗ chứa.
    ks2 = []
    for ten, n, doi in KHUNG2:
        ks2 += _day_khung(d, im, R, tt, d['animations'][ten], ten, n, skin, phong, oy, bo_than, doi)
    ra['than2'] = ks2
    # Thêm MỘT ảnh tư thế GỐC (không áp hoạt cảnh nào) cho thẻ chọn lớp: hoạt cảnh 00_Idle
    # chùng gối và dồn trọng tâm sang một bên, đứng cạnh nhau năm lớp thì nhìn ra lệch hết.
    # Tư thế gốc thì hai chân đều, tay buông, vũ khí chống xuống — dáng đứng chào của màn chọn.
    dung = Image.new('RGBA', (O_W, O_H))
    for bo in (bo_than, tuple(k for k in moiKhe if k not in KHE_VK)):
        dung.alpha_composite(ve_khung(d, im, R, tt, {}, 0, skin, W=O_W, H=O_H,
                                      phong=phong, ox=120/O_W, oy=oy, bo_khe=bo))
    ra['dung'] = dung
    return ra, phong

def _do_khung(d, im, R, tt, skin, phong, oy, bo, danh):
    """Mọi khung của CẢ HAI bảng, cùng một hệ toạ độ — trả (khung bảng một, khung bảng hai)."""
    k1 = []
    for ten, n in KHUNG:
        tenTh = danh if ten == 'DANH' else ten
        k1 += _day_khung(d, im, R, tt, d['animations'][tenTh], tenTh, n, skin, phong, oy, bo)
    k2 = []
    for ten, n, doi in KHUNG2:
        k2 += _day_khung(d, im, R, tt, d['animations'][ten], ten, n, skin, phong, oy, bo, doi)
    return k1, k2


def nuong_lop(goi, skin, danh='08_SwordAttack'):
    """Nướng NĂM LỚP RỜI thay cho một tấm thân liền — xem bảng LOP ở đầu tệp.

    Mỗi lớp CẮT SÁT hộp bao của chính nó, tính trên CẢ HAI bảng cùng lúc để hai bảng dùng
    chung một gốc. Không cắt thì năm lớp = 5 x 27,6 MB sau giải nén cho mỗi bộ; cắt rồi thì
    tổng năm lớp chỉ còn ~95% MỘT tấm thân liền — tức tách ô ra gần như KHÔNG tốn thêm bộ nhớ,
    dù người chơi mặc bốn bộ khác nhau, vì mỗi ô chỉ nạp đúng lớp của nó.
    """
    d, im, R = doc_goi(goi); tt = TuThe(d)
    moiKhe  = tuple(s['name'] for s in d['slots'])
    bo_than = KHE_VK + KHE_HFX
    bb = _do(d, im, R, tt, skin, bo_than + KHE_TOC, W=1400, H=2000, phong=1.0, ox=.5, oy=.86
             ).getchannel('A').getbbox()
    phong = CAO_THAN / (bb[3] - bb[1])
    bb2 = _do(d, im, R, tt, skin, bo_than, W=O_W, H=O_H, phong=phong, ox=120/O_W, oy=252/O_H
              ).getchannel('A').getbbox()
    oy = (252 - ((bb2[3] - 40) - GOT_Y)) / O_H
    ra = []
    for ten, giu, o in LOP:
        bo = tuple(k for k in moiKhe if k not in giu)
        k1, k2 = _do_khung(d, im, R, tt, skin, phong, oy, bo, danh)
        # ⚠ HAI BẢNG CẮT HAI HỘP KHÁC NHAU. Bảng một là đứng/đi/chạy/đánh — dáng gọn.
        # Bảng hai là chết/nhảy múa/bật người — tay chân văng ra rất xa. Ép chung một hộp
        # thì bảng một phải gánh hộp của bảng hai: đo được tổng phình 94% → 167% một tấm
        # thân liền. Cắt riêng thì bảng một về lại gọn, mà bảng hai vốn NẠP KHI CẦN.
        def hop(ks):
            H = None
            for k in ks:
                b = k.getchannel('A').getbbox()
                if not b: continue
                H = b if H is None else (min(H[0], b[0]), min(H[1], b[1]),
                                         max(H[2], b[2]), max(H[3], b[3]))
            return H
        H1, H2 = hop(k1), hop(k2)
        if H1 is None:                      # lớp RỖNG (tóc sau ở bản mẫu này) — bỏ hẳn
            ra.append((ten, o, None, None, None, None)); continue
        if H2 is None: H2 = H1
        ra.append((ten, o, H1, H2, [k.crop(H1) for k in k1], [k.crop(H2) for k in k2]))
    return ra, phong


def dem_manh_roi(ks):
    """Bao nhiêu khung có MẢNH RỜI khỏi khối chính — cửa gác duy nhất không phụ thuộc nhân vật.

    Xương Spine cắm vào Ô atlas chứ không vào nét vẽ, nên vẽ trượt trong ô là bộ phận đó bay
    ra khỏi người ở MỌI khung hình. Nhìn bảng khung thì chỉ thấy "hình như hơi lạ" — đã một
    lần nhận nhầm một gói như thế và chỉ phát hiện khi dựng ảnh so sánh với gói đời trước.

    Đo được: 28/96 ở gói hỏng, 0/96 ở hai gói tốt của HAI nhân vật khác nhau. Ngưỡng tách rất
    rộng nên không cần canh gì.
    """
    try:
        import numpy as np
        from scipy import ndimage
    except ImportError:
        return None                                  # không có scipy thì bỏ qua, đừng chặn
    xau = 0
    for k in ks:
        m = np.array(k.getchannel('A')) > 24
        if m.sum() < 50: continue
        lab, n = ndimage.label(m)
        if n <= 1: continue
        sz = sorted(ndimage.sum(m, lab, range(1, n + 1)), reverse=True)
        # >150 px VÀ >4% khối chính: bỏ qua mấy chấm lẻ (đầu tóc, vạt áo bay) mà vẫn bắt
        # được cả một cánh tay.
        if [x for x in sz[1:] if x > 150 and x > sz[0] * 0.04]: xau += 1
    return xau


def bang(ks, duong):
    # Cỡ ô lấy từ CHÍNH khung, không từ O_W/O_H: lớp rời đã cắt sát nên ô nhỏ hơn 240x300.
    w, h = ks[0].size
    sh = Image.new('RGBA', (w*COT, h*((len(ks)+COT-1)//COT)))
    for i, k in enumerate(ks): sh.alpha_composite(k, ((i % COT)*w, (i//COT)*h))
    os.makedirs(os.path.dirname(duong), exist_ok=True)
    sh.save(duong, optimize=True)
    return os.path.getsize(duong)

def main_lop(goi, skin, ten, danh, thu):
    """--lop: năm tấm LỚP RỜI thay cho một tấm thân liền."""
    t0 = time.time()
    lop, phong = nuong_lop(goi, skin, danh)
    js = []
    tong = 0
    tong2 = 0
    for ml, o, H1, H2, k1, k2 in lop:
        if H1 is None:
            print(f'  {ml:3s} ({o:4s}) LỚP RỖNG — bỏ qua'); continue
        w1, h1 = H1[2] - H1[0], H1[3] - H1[1]
        w2, h2 = H2[2] - H2[0], H2[3] - H2[1]
        # WEBP như tấm thân liền — cùng lý do: khoảng trong suốt nhiều, nén tốt hơn PNG.
        n1 = bang(k1, os.path.join(thu, f'{ten}_{ml}.webp'))
        n2 = bang(k2, os.path.join(thu, f'{ten}_{ml}2.webp'))
        tong += w1 * h1; tong2 += w2 * h2
        print(f'  {ml:3s} ({o:4s}) bảng1 {w1:3d}x{h1:3d}@({H1[0]:3d},{H1[1]:3d}) {n1//1024:>4d} KB'
              f'  · bảng2 {w2:3d}x{h2:3d}@({H2[0]:3d},{H2[1]:3d}) {n2//1024:>4d} KB'
              f'  = {w1*h1/(O_W*O_H)*100:4.1f}% / {w2*h2/(O_W*O_H)*100:4.1f}%')
        # ⚠ Gốc cắt phải sang được game, nếu không nó dán lớp sai chỗ. In sẵn dòng JS để dán.
        js.append(f'{ml}:[{H1[0]},{H1[1]},{w1},{h1},{H2[0]},{H2[1]},{w2},{h2}]')
    print(f'\n  TỔNG: bảng một {tong/(O_W*O_H)*100:.1f}% · bảng hai {tong2/(O_W*O_H)*100:.1f}%'
          f' một tấm thân liền  · thu {phong:.4f} · {time.time()-t0:.1f}s')
    print(f'\n  Dán vào NV_LOP_HOP trong game.js:\n    \'{ten}\': {{ ' + ', '.join(js) + ' },')
    return 0


def main():
    if len(sys.argv) < 4: print(__doc__); return 1
    goi, skin, ten = sys.argv[1], sys.argv[2], sys.argv[3]
    # --danh <hoạt cảnh>: khối ĐÁNH của lớp này. Sylvan Ranger bắn nỏ chứ không vung kiếm,
    # Dark Wizard và Dark Lord niệm chú — mỗi lớp một dáng, chốt ngay lúc nướng.
    danh = '08_SwordAttack'
    if '--danh' in sys.argv: danh = sys.argv[sys.argv.index('--danh') + 1]
    goc = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
    thu = os.path.normpath(os.path.join(goc, 'public/game/assets/nv'))
    os.makedirs(thu, exist_ok=True)
    if '--lop' in sys.argv: return main_lop(goi, skin, ten, danh, thu)
    t0 = time.time()
    lop, phong = nuong(goi, skin, danh)
    for hau, k in (('', 'than'), ('2', 'than2'), ('_vk', 'vukhi')):
        d = os.path.join(thu, ten + hau + '.png')
        print(f'  {os.path.basename(d):20s} {bang(lop[k], d)//1024:>5d} KB  ({len(lop[k])} khung)')
    dd = os.path.join(thu, ten + '_dung.png')
    lop['dung'].save(dd, optimize=True)
    print(f'  {os.path.basename(dd):20s} {os.path.getsize(dd)//1024:>5d} KB  (tư thế đứng)')
    # kiểm hai mốc — sai là nhân vật lệch so với phần còn lại của game
    bb = Image.open(os.path.join(thu, ten + '.png')).crop((0, 0, O_W, O_H)).getchannel('A').getbbox()
    print(f'  gót y={bb[3]-40} (cần {GOT_Y}) · đỉnh đầu y={bb[1]-40} (cần 53) · thu {phong:.4f}'
          f' · {time.time()-t0:.1f}s')
    roi = dem_manh_roi(lop['than']) 
    if roi is None: print('  mảnh rời  không đo được (thiếu scipy)')
    elif roi:       print(f'  ⚠ MẢNH RỜI {roi}/{len(lop["than"])} khung — có bộ phận vẽ trượt '
                          f'trong ô atlas, nó bay ra khỏi người. TRẢ LẠI GÓI.')
    else:           print(f'  mảnh rời  0/{len(lop["than"])} khung ✓')
    return 0 if not roi else 1

if __name__ == '__main__': sys.exit(main())
