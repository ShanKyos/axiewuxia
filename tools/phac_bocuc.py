#!/usr/bin/env python3
"""Vẽ BẢN PHÁC BỐ CỤC của từng map, sinh từ chính dữ liệu game đang chạy.

Vì sao cần: prompt bằng chữ không ép được model chừa sàn trống ĐÚNG CHỖ. Bảo "≥60% là đất
trống" thì nó chừa 60% ở đâu cũng được — và nếu chừa nhầm chỗ thì bãi quái, cổng, đấu trường
boss rơi vào vách đá. Nano Banana Pro nhận ẢNH THAM CHIẾU, nên đưa thẳng cho nó tấm mặt nạ
này cùng tranh Quảng Trường Cũ làm mẫu phong cách thì chỗ nào phải trống là chuyện đã chốt,
không còn phải cầu may.

Mặt nạ dựng từ VỊ TRÍ THẬT: chạy `buildWorld()` trong game, lấy toạ độ từng con quái, từng
NPC, từng cổng, điểm thả và điểm tới, rồi trùm đĩa quanh chúng. Nghĩa là vùng sáng trong ảnh
đúng bằng chỗ người chơi thật sự đi tới — không phải một hình do tôi vẽ tay cho đẹp.

Chạy:  python3 tools/phac_bocuc.py [layout.json] [thư mục ra]
       (layout.json sinh bằng tools/dump_layout.js — xem docs/PROMPT_MAP_ISOMETRIC.md)
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# bán kính trùm quanh mỗi loại điểm nội dung, theo pixel thế giới.
# Thân nhân vật vẽ ra ~95px; boss đuổi 260px nên cần khoảng trống rộng hơn hẳn.
BK = {'quai': 210, 'boss': 420, 'npc': 170, 'cong': 260, 'spawn': 320}

MAU = {
    'ngoai':  (26, 23, 30),     # ngoài khối đất — nền gần đen, đúng như Quảng Trường Cũ
    'vanh':   (74, 62, 50),     # vành: chỗ ĐƯỢC PHÉP dựng nhà, vách đá, rừng rậm
    'san':    (208, 198, 178),  # sàn: BẮT BUỘC để trống, đi được
    'cong':   (86, 150, 220),   # miệng cổng — phải thông ra tận mép khối đất
    'boss':   (176, 92, 92),    # đấu trường boss — khoảng trống rộng nhất map
}

def to_mask(size, diem, bk):
    """Trùm đĩa bán kính `bk` quanh mỗi điểm, trả về mặt nạ bool."""
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    for x, y in diem:
        d.ellipse([x - bk, y - bk, x + bk, y + bk], fill=255)
    return np.asarray(m) > 127

def phac(md, out):
    W, H = md['w'], md['h']
    size = (W, H)

    quai  = [(q['x'], q['y']) for q in md['quai'] if not q['boss']]
    # trùm vùng lấy từ khoá `boss` riêng — xem ghi chú trong tools/dump_layout.js
    boss  = [(b['x'], b['y']) for b in md.get('boss', [])]
    npc   = [(n['x'], n['y']) for n in md['npc']]
    cong  = [(g['x'], g['y']) for g in md['cong']]
    tha   = [(md['spawn']['x'], md['spawn']['y'])] if md.get('spawn') else []
    tha  += [(v['x'], v['y']) for v in md.get('spawnFrom', {}).values()]

    # ── vùng BẮT BUỘC TRỐNG = trùm quanh mọi thứ người chơi đi tới ──
    san = np.zeros((H, W), bool)
    for diem, k in ((quai, 'quai'), (boss, 'boss'), (npc, 'npc'), (cong, 'cong'), (tha, 'spawn')):
        if diem:
            san |= to_mask(size, diem, BK[k])
    # nối các cụm rời thành một khối liền: nở ra rồi co lại (phép đóng hình thái học)
    im = Image.fromarray((san * 255).astype('uint8'))
    im = im.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MaxFilter(9))
    im = im.filter(ImageFilter.GaussianBlur(60)).point(lambda v: 255 if v > 90 else 0)
    san = np.asarray(im) > 127

    # ── khối đất = sàn nở thêm một vành, để có chỗ dựng nhà/vách chặn mép ──
    vanh_im = Image.fromarray((san * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(150))
    dat = np.asarray(vanh_im.point(lambda v: 255 if v > 26 else 0)) > 127

    a = np.zeros((H, W, 3), 'uint8')
    a[:] = MAU['ngoai']
    a[dat] = MAU['vanh']
    a[san] = MAU['san']

    img = Image.fromarray(a)
    d = ImageDraw.Draw(img)
    for x, y in boss:
        d.ellipse([x - 300, y - 300, x + 300, y + 300], outline=MAU['boss'], width=26)
    # miệng cổng: kéo một vệt từ cổng ra mép map gần nhất — lối ra phải THÔNG
    for x, y in cong:
        canh = min([(y, (x, 0)), (H - y, (x, H)), (x, (0, y)), (W - x, (W, y))])[1]
        d.line([(x, y), canh], fill=MAU['cong'], width=150)
        d.ellipse([x - 90, y - 90, x + 90, y + 90], fill=MAU['cong'])

    img.save(out, quality=92)

    # ── Bản SẠCH để đưa cho model — CHỈ BA TÔNG, KHÔNG MÀU LẠ ──
    # ⚠ Bản đầu tô lối ra bằng XANH DƯƠNG và tô vòng đấu trường bằng ĐỎ. Model đọc xanh dương
    # là NƯỚC: bốn lối ra thành bốn con sông cắt hòn đảo làm 5-6 mảnh, sàn liền khối co lại còn
    # ~1/4 khung. Mọi màu lạ trong ảnh tham chiếu đều bị model dịch thành VẬT LIỆU.
    # Bản sạch vì thế chỉ giữ ba tông: ngoài / vành / sàn. Lối ra không phải một màu riêng —
    # nó là chính vùng SÀN kéo dài chạm tới mép. Bản có chú giải ở trên chỉ để người xem.
    sach = np.zeros((H, W, 3), 'uint8')
    sach[:] = MAU['ngoai']
    sach[dat] = MAU['vanh']
    sach[san] = MAU['san']
    ims = Image.fromarray(sach)
    ds = ImageDraw.Draw(ims)
    for x, y in cong:      # lối ra: kéo chính màu SÀN ra tới mép, không thêm màu nào khác
        canh = min([(y, (x, 0)), (H - y, (x, H)), (x, (0, y)), (W - x, (W, y))])[1]
        ds.line([(x, y), canh], fill=MAU['san'], width=260)
    ims.save(out.replace('.jpg', '_sach.jpg'), quality=92)

    k43s = Image.new('RGB', (W, round(W * 3 / 4)), MAU['ngoai'])
    k43s.paste(ims, (0, (k43s.height - H) // 2))
    k43s.save(out.replace('.jpg', '_sach_43.jpg'), quality=92)

    # Bản ĐỆM 4:3 — meowa/Nano Banana chỉ nhận vài tỉ lệ cố định, gần khổ 2600×1900 (1,368)
    # nhất là 4:3 (1,333). Đưa ảnh tham chiếu 1,368 rồi đòi ra 1,333 thì bố cục bị bóp lệch,
    # nên đệm sẵn: thêm nền ở trên và dưới cho đủ 2600×1950, sinh xong cắt lại 50px là khít.
    k43 = Image.new('RGB', (W, round(W * 3 / 4)), MAU['ngoai'])
    k43.paste(img, (0, (k43.height - H) // 2))
    k43.save(out.replace('.jpg', '_43.jpg'), quality=92)

    return {
        'san_pct': round(100 * san.mean(), 1),
        'dat_pct': round(100 * dat.mean(), 1),
        'quai': len(quai), 'boss': len(boss), 'npc': len(npc), 'cong': len(cong),
    }

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/layout.json'
    ra  = sys.argv[2] if len(sys.argv) > 2 else 'docs/phac_map'
    os.makedirs(ra, exist_ok=True)
    data = json.load(open(src, encoding='utf-8'))
    print(f"{'map':12} {'tên':26} {'sàn':>6} {'đất':>6}  nội dung")
    for k, md in data.items():
        s = phac(md, os.path.join(ra, f'phac_{k}.jpg'))
        print(f"{k:12} {md['ten']:26} {s['san_pct']:>5.1f}% {s['dat_pct']:>5.1f}%  "
              f"{s['quai']} quái · {s['boss']} boss · {s['npc']} NPC · {s['cong']} cổng")

if __name__ == '__main__':
    main()
