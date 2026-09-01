#!/usr/bin/env python3
"""Ghép một bộ Spine (.atlas + .json + .png) thành MỘT ảnh PNG liền mảnh.

Vì sao cần: kit art của Axie Origins để nhân vật dưới dạng rig Spine — ảnh .png
chỉ là tấm gom các BỘ PHẬN rời (thân, tai, mắt, đuôi… nằm rải rác), không phải
chân dung. Tám đợt khảo sát trước kết luận "không dùng được" và bỏ qua 38 con
Axie trong PvE/Starters. Nhưng file .json có đủ dữ liệu để dựng lại TƯ THẾ GỐC
(setup pose): cây xương với phép dịch/xoay/co, và vị trí từng mảnh gắn lên xương.

Ghép lại = đọc cây xương, tính phép biến hình thế giới của từng xương, rồi dán
từng mảnh theo đúng thứ tự vẽ của slot.

    python3 assemble.py <thư-mục-bộ> <tên-bộ> <file-ra.png> [--scale N]
"""
import json, math, sys, os
from PIL import Image


def parse_atlas(path):
    """Đọc .atlas → { tên vùng: {xy, size, rotate} }."""
    regions, cur, page = {}, None, None
    with open(path) as f:
        lines = [l.rstrip('\n') for l in f]
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1; continue
        if not line.startswith(' ') and not line.startswith('\t') and ':' not in line:
            if line.endswith('.png'):        # dòng tên trang ảnh
                page = line; cur = None
            else:                            # dòng tên vùng
                cur = line.strip(); regions[cur] = {'page': page}
            i += 1; continue
        if cur and ':' in line:
            k, v = line.split(':', 1)
            k, v = k.strip(), v.strip()
            if k == 'rotate':   regions[cur]['rotate'] = (v == 'true')
            elif k == 'xy':     regions[cur]['xy'] = [int(x) for x in v.split(',')]
            elif k == 'size':   regions[cur]['size'] = [int(x) for x in v.split(',')]
            elif k == 'orig':   regions[cur]['orig'] = [int(x) for x in v.split(',')]
            elif k == 'offset': regions[cur]['offset'] = [int(x) for x in v.split(',')]
        i += 1
    return regions


def bone_world(bones):
    """Tính ma trận thế giới [a,b,c,d,x,y] cho từng xương ở tư thế gốc.

    Spine dùng hệ Y-HƯỚNG-LÊN và góc tính bằng độ, ngược chiều kim đồng hồ.
    """
    by_name, order = {}, []
    for b in bones:
        by_name[b['name']] = b; order.append(b['name'])
    world = {}

    def solve(name):
        if name in world: return world[name]
        b = by_name[name]
        rot = math.radians(b.get('rotation', 0))
        sx, sy = b.get('scaleX', 1), b.get('scaleY', 1)
        x, y = b.get('x', 0), b.get('y', 0)
        la = math.cos(rot) * sx; lb = -math.sin(rot) * sy
        lc = math.sin(rot) * sx; ld = math.cos(rot) * sy
        p = b.get('parent')
        if p is None:
            world[name] = [la, lb, lc, ld, x, y]
        else:
            pa, pb, pc, pd, px, py = solve(p)
            world[name] = [pa*la + pb*lc, pa*lb + pb*ld,
                           pc*la + pd*lc, pc*lb + pd*ld,
                           pa*x + pb*y + px, pc*x + pd*y + py]
        return world[name]

    for n in order: solve(n)
    return world


def assemble(dirpath, name, out_path, scale=1.0):
    atlas = parse_atlas(os.path.join(dirpath, name + '.atlas'))
    skel = json.load(open(os.path.join(dirpath, name + '.json')))
    sheet = Image.open(os.path.join(dirpath, name + '.png')).convert('RGBA')
    world = bone_world(skel['bones'])

    skins = skel['skins']
    default = None
    if isinstance(skins, list):
        for s in skins:
            if s.get('name') == 'default': default = s['attachments']
        if default is None and skins: default = skins[0]['attachments']
    else:
        default = skins.get('default', {})

    # Vẽ trên khung rộng rồi cắt sát — không biết trước hình choán bao nhiêu.
    PAD = 1200
    canvas = Image.new('RGBA', (PAD*2, PAD*2), (0, 0, 0, 0))

    placed = 0
    for slot in skel['slots']:                     # thứ tự slot CHÍNH LÀ thứ tự vẽ
        att_name = slot.get('attachment')
        if not att_name: continue
        entry = (default.get(slot['name']) or {}).get(att_name)
        if not entry: continue
        if entry.get('type', 'region') != 'region': continue   # bỏ mesh/clip
        region_name = entry.get('name', att_name)
        reg = atlas.get(region_name)
        if not reg or 'xy' not in reg: continue

        rx, ry = reg['xy']; rw, rh = reg['size']
        # Vùng bị XOAY 90° khi đóng gói: `size` vẫn ghi kích thước GỐC, còn chỗ nó
        # chiếm trên tấm ảnh thì hoán đổi hai chiều. Cắt theo `size` là cắt lệch —
        # đó là những mảng chữ nhật cụt lủn ở bản đầu.
        if reg.get('rotate'):
            piece = sheet.crop((rx, ry, rx + rh, ry + rw)).rotate(-90, expand=True)
        else:
            piece = sheet.crop((rx, ry, rx + rw, ry + rh))
        pw, ph = piece.size

        aw = entry.get('width', pw) * entry.get('scaleX', 1)
        ah = entry.get('height', ph) * entry.get('scaleY', 1)
        arot = entry.get('rotation', 0)
        ax, ay = entry.get('x', 0), entry.get('y', 0)

        bw = world.get(slot['bone'])
        if not bw: continue
        a, b, c, d, ox, oy = bw
        wx = a*ax + b*ay + ox
        wy = c*ax + d*ay + oy
        # góc xoay tổng = góc xương + góc riêng của mảnh
        bone_rot = math.degrees(math.atan2(c, a))
        total_rot = bone_rot + arot
        # hệ số co của xương (lấy độ dài cột)
        bsx = math.hypot(a, c); bsy = math.hypot(b, d)

        fw = max(1, int(round(abs(aw) * bsx * scale)))
        fh = max(1, int(round(abs(ah) * bsy * scale)))
        piece = piece.resize((fw, fh), Image.LANCZOS)
        if abs(total_rot) > 0.01:
            piece = piece.rotate(total_rot, expand=True, resample=Image.BICUBIC)

        # Spine: Y hướng LÊN. Ảnh: Y hướng XUỐNG. Nên phải đảo dấu wy.
        cx = PAD + wx * scale
        cy = PAD - wy * scale
        canvas.alpha_composite(piece, (int(round(cx - piece.width/2)),
                                       int(round(cy - piece.height/2))))
        placed += 1

    bbox = canvas.getbbox()
    if not bbox:
        print(f'  ⚠ {name}: không dán được mảnh nào'); return None
    out = canvas.crop(bbox)
    out.save(out_path)
    print(f'  {name}: {placed} mảnh → {out.size[0]}×{out.size[1]} → {out_path}')
    return out


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print(__doc__); sys.exit(1)
    sc = 1.0
    if '--scale' in sys.argv:
        sc = float(sys.argv[sys.argv.index('--scale') + 1])
    assemble(sys.argv[1], sys.argv[2], sys.argv[3], sc)
