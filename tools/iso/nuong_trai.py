#!/usr/bin/env python3
"""Nướng VẬT THỂ TRẠI — thứ làm một Bãi Farm nhìn ra là MỘT CHỖ, không phải ba trại quái.

    python3 tools/iso/nuong_trai.py [thư mục ra]
    Cần: pip install bpy==4.2.0   (Blender chạy trong tiến trình Python, không cần bản cài đặt)

Vì sao cần. Bãi Farm đã có tên trên bảng Bản Đồ, quái đã dày, rơi đã đậm — nhưng ĐỨNG TRONG MAP
mà nhìn thì nó giống hệt ba trại quái bình thường đứng gần nhau. Trong MU, một *spot* nhận ra
được bằng MẮT trước khi nhận ra bằng bảng: ở đó có một cái gì đó của người.

Bốn món, cùng hướng nắng và cùng phép chiếu với bộ viên nền (dùng lại nguyên `nuong_vat`):

    trai_lua    đống lửa tàn — vòng đá + hai khúc củi bắt chéo + gò tro
    trai_leu    lều vải căng trên khung chữ A
    trai_thung  hai thùng gỗ chồng
    trai_coc    cọc cắm, treo một mảnh vải rách

⚠ NGỌN LỬA KHÔNG NƯỚNG VÀO TRANH. Một ngọn lửa nướng sẵn là một vệt cam đứng chết — đặt cạnh
hiệu ứng cộng sáng của game thì nó lộ ra ngay là một nhãn dán. Tranh chỉ có ĐỐNG CỦI TÀN; phần
sáng do game vẽ đè bằng cộng sáng (xem `veTraiLua` trong game.js), nên nó nhấp nháy và hắt sáng
đúng như mọi nguồn sáng khác.

⚠ CAO_PX ĐO THEO THÂN NHÂN VẬT, không chọn bằng cảm giác. `CAO_NV = 95` là thân người vẽ ra;
lều cao ngang vai (0,95×), thùng tới hông (0,55×), đống lửa thấp (0,40×), cọc cao hơn đầu (1,3×).
Nướng một cái lều cao 2× thân người thì cả bãi biến thành làng khổng lồ mà không ai chỉ ra được
vì sao nhìn sai.
"""
import os, sys, math

RA = sys.argv[1] if len(sys.argv) > 1 else 'public/game/assets/iso'

_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nuong_tile.py'),
            encoding='utf-8').read().replace("if __name__ == '__main__':", 'if False:')
NT = {'__name__': 'nuong_tile'}
sys.argv = [sys.argv[0], RA]
exec(compile(_src, 'nuong_tile.py', 'exec'), NT)
nuong_vat, _vatlieu, CAO_NV, NEO = NT['nuong_vat'], NT['_vatlieu'], NT['CAO_NV'], NT['NEO']

# ⚠ BẢNG MÀU PHẢI NO MÀU BẰNG NỀN. Bản đầu lấy tông thực tế (vải 0,74/0,66/0,48 — nâu cát nhạt)
# và nướng ra một cái lều XÁM: đặt cạnh viên cỏ kẹo (0,44/0,62/0,30) của bộ nền Axie thì nó đọc
# thành một tảng đá, không đọc thành đồ của người. Cùng bài học đã ghi ở `nuong_tile.main()`:
# "bảng màu KẸO, lấy thẳng từ tranh Axie" — đồ trại không được là ngoại lệ.
GO    = (0.55, 0.34, 0.19)    # gỗ ngả nâu đỏ, ấm
GO_T  = (0.28, 0.18, 0.13)    # gỗ cháy
DA    = (0.64, 0.61, 0.57)
VAI   = (0.88, 0.72, 0.42)    # vải thô ngả vàng nắng
VAI_T = (0.52, 0.38, 0.22)
TRO   = (0.33, 0.31, 0.29)


def _khoi(mau, vi, co, xoay=(0, 0, 0), van=24, nham=0.94):
    import bpy
    bpy.ops.mesh.primitive_cube_add(size=1, location=vi)
    o = bpy.context.object
    o.scale = co; o.rotation_euler = xoay
    o.data.materials.append(_vatlieu('m', mau, nham=nham, van=van, manh_van=0.5))
    return o


def _tru(mau, vi, ban, cao, xoay=(0, 0, 0), van=28):
    import bpy
    bpy.ops.mesh.primitive_cylinder_add(radius=ban, depth=cao, location=vi)
    o = bpy.context.object
    o.rotation_euler = xoay
    o.data.materials.append(_vatlieu('m', mau, van=van, manh_van=0.5))
    bpy.ops.object.shade_smooth()
    return o


def _hon(mau, vi, co, hat):
    import bpy, random
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=co, location=vi)
    o = bpy.context.object
    r = random.Random(hat)
    o.scale = (1.0, r.uniform(0.8, 1.15), r.uniform(0.55, 0.8))
    o.rotation_euler = (0, 0, r.uniform(0, math.tau))
    o.data.materials.append(_vatlieu('m', mau, van=18, manh_van=0.3))
    import bpy as _b; _b.ops.object.shade_flat()
    return o


def lua():
    """Đống lửa TÀN — tro, củi cháy dở, vòng đá. Ngọn lửa do game vẽ đè, xem đầu tệp."""
    _hon(TRO, (0, 0, 0.05), 0.32, 1)
    _hon((0.42, 0.20, 0.12), (0, 0, 0.11), 0.19, 2)     # than còn đỏ giữa gò tro
    for a in (0.5, 2.1, 3.9, 5.2):
        _tru(GO_T, (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.18),
             0.055, 0.86, xoay=(math.radians(72), 0, a))
    for i in range(9):
        a = i * math.tau / 9
        _hon(DA, (math.cos(a) * 0.52, math.sin(a) * 0.52, 0.06), 0.15, 10 + i)


def leu():
    """Lều chữ A dựng bằng LĂNG TRỤ TAM GIÁC, không phải hai tấm phẳng nghiêng.

    ⚠ Bản đầu ghép hai khối dẹt xoay ±52° quanh trục X. Về hình học thì đúng — hai mép trên gặp
    nhau ở đúng nóc — nhưng nướng ra đọc thành một đống ván xiêu, vì hai tấm là hai vật RỜI nên
    nắng đánh hai mặt hơi khác nhau và khe giữa chúng ăn bóng thành một vệt đen chạy dọc nóc.
    Một lăng trụ liền khối thì nóc là một cạnh thật, và đó là thứ mắt đọc ra chữ "lều".
    Vân cũng phải hạ (van=34 → 10): vân mạnh trên mặt phẳng lớn ra đúng thớ gỗ, mà đây là VẢI."""
    import bpy
    bpy.ops.mesh.primitive_cylinder_add(vertices=3, radius=0.72, depth=1.44, location=(0, 0, 0))
    o = bpy.context.object
    # trụ nằm dọc X, rồi xoay quanh X cho MỘT MẶT PHẲNG nằm sát đất
    o.rotation_euler = (math.radians(90), math.radians(90), 0)
    o.location = (0, 0, 0.36)
    o.data.materials.append(_vatlieu('vai', VAI, nham=0.98, van=10, manh_van=0.5))
    bpy.ops.object.shade_flat()
    # Cửa lều: khối tối THỤT VÀO trong mặt đầu hồi. Không có nó thì lều là một khối vải kín,
    # đọc ra là một cái nêm chứ không ra một chỗ ở được.
    _khoi(VAI_T, (0.70, 0, 0.24), (0.06, 0.30, 0.46), van=12)
    # xà nóc nhô ra hai đầu — chi tiết duy nhất nói "cái này người ta dựng lên"
    _tru(GO, (0, 0, 0.98), 0.04, 1.76, xoay=(0, math.radians(90), 0))
    for s in (+1, -1):
        _tru(GO, (-0.86, s * 0.52, 0.12), 0.03, 0.24)


def thung():
    _khoi(GO, (0, 0, 0.24), (0.62, 0.62, 0.48), van=26)
    _khoi(GO_T, (0, 0, 0.24), (0.65, 0.65, 0.10), van=26)      # đai thùng
    _khoi(GO, (0.14, 0.36, 0.66), (0.52, 0.52, 0.40),
          xoay=(0, 0, math.radians(22)), van=26)


def coc():
    _tru(GO, (0, 0, 0.62), 0.055, 1.24)
    _tru(GO, (0, 0, 1.14), 0.035, 0.52, xoay=(math.radians(90), 0, 0))
    # mảnh vải rách treo lệch — cái cho biết cọc này là của người, không phải một cành cây
    _khoi(VAI_T, (0, 0.16, 0.86), (0.03, 0.40, 0.46),
          xoay=(math.radians(7), 0, 0), van=38, nham=0.99)


MON = [('trai_lua', lua, 0.40), ('trai_leu', leu, 0.95),
       ('trai_thung', thung, 0.55), ('trai_coc', coc, 1.30)]


def main():
    os.makedirs(RA, exist_ok=True)
    for ten, dung, k in MON:
        nuong_vat(ten, dung, cao_px=round(CAO_NV * k))
        print('  %-11s cao %3d px' % (ten, round(CAO_NV * k)))
    NT['ghi_neo'](RA, NEO)   # một tệp đích duy nhất — xem ghi_neo() trong nuong_tile.py
    print('NUONG XONG %d vat trai → %s' % (len(MON), RA))


if __name__ == '__main__':
    main()
