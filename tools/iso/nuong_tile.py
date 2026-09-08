#!/usr/bin/env python3
"""Nướng BỘ TILE isometric + vật thể rời từ cảnh 3D — bằng Blender chạy không màn hình.

Vì sao nướng từ 3D chứ không sinh bằng AI cả tấm (xem docs/NGHIEN_CUU_MAP_CAC_GAME.md):
mọi lần hỏng trước đều là đòi model vẽ MỘT CẢNH TO MÀ MẠCH LẠC — đúng chỗ nó yếu nhất. Nướng 3D
thì phép chiếu và ánh sáng đúng THEO CẤU TẠO: một cảnh, một camera trực giao, nên không vật nào
lệch góc được. Đó chính là lỗi gốc đã ghi ở NGHIEN_CUU_LAM_MAP.md §1.

HÌNH HỌC — vì sao đúng 2:1 và vì sao lát khít:
  camera trực giao, xoay Z 45°, nghiêng X 60°. cos(60°) = 0,5 nên trục dọc bị nén đúng một nửa
  → hình vuông đơn vị hiện ra thành hình thoi RỘNG GẤP ĐÔI CAO. Hình thoi 2:1 lát khít mặt phẳng
  không hở, nên tile ghép không bao giờ có khe — đó là tính chất hình học, không phải căn tay.
  `ortho_scale` đặt đúng bằng đường chéo hình vuông (√2) thì hình thoi chiếm trọn khung.

Chạy:  python3 tools/iso/nuong_tile.py [thư mục ra]
"""
import json, math, os, random, sys

import bpy
import mathutils

RA = sys.argv[1] if len(sys.argv) > 1 else 'public/game/assets/iso'
W_TILE, H_TILE = 256, 128          # hình thoi 2:1
MAU = 40                            # số mẫu Cycles — đủ sạch cho vật thể cỡ này

TRAN = 1.015                        # tràn mép chống lưới kẻ — xem nuong_nen()

# ⚠ LUẬT KHUNG — VÀ MỘT LẦN TÔI ĐẶT SAI LUẬT NÀY.
# Lượt đầu khung đặt tay bằng pixel; đo ra nền 183,7 px mỗi đơn vị thế giới còn cây chỉ 60,0,
# tức vật thể thô hơn mặt đất 3 lần rồi bị trình ghép phóng to — nhoè như dán giấy. Tôi sửa
# bằng cách ÉP MỌI MÓN CHUNG MỘT px/đơn-vị. Vật thể hết nhoè thật, nhưng luật ấy SAI:
# nó giữ được sự đồng nhất mà buông mất cỡ. Cây cao 4,6 đơn vị × 183,7 = 845 px, gấp 8,9 lần
# thân nhân vật 95 px — cả khoảnh rừng nuốt trọn map, đúng như ảnh lát thử.
#
# Luật đúng chỉ có một câu: **NƯỚNG RA ĐÚNG BẰNG CỠ SẼ VẼ RA.** Sprite vẽ 1:1 lên canvas, nên
# cây sẽ hiện 260 px thì nướng đúng 260 px — nét tự khắc đúng, không cần bàn tới px/đơn-vị.
# Cỡ vẽ ra lấy theo THÂN NHÂN VẬT: cây 2,5-3× thân, bụi ngang thân, đá quá đầu gối.
CAO_NV = 95                         # thân nhân vật vẽ ra — thang đo duy nhất của cả bộ

# Hướng nắng dùng CHUNG cho mọi thứ. Đổi số này là phải nướng lại CẢ BỘ, nếu không mỗi món một
# hướng bóng và cả map lộ ngay.
# Nâng từ 48° lên 58°: bóng dài bằng cao/tan(góc), tức 0,90× ở 48° nhưng chỉ 0,62× ở 58°. Bóng
# ngắn thì khung sprite nhỏ hẳn — mà khung là thứ tốn cả bộ nhớ lẫn công vẽ mỗi khung hình.
NANG_CAO, NANG_XOAY = 58, 22


def _sach():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = MAU
    sc.cycles.use_denoising = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    # ⚠ AGX LÀ THỦ PHẠM CỦA CẢ MẢNG "BỢT NHƯ MÔ HÌNH GIẤY".
    # Blender 4 trở lên mặc định phép chuyển AgX — một bộ tông phim, cố ý hạ bão hoà và nâng
    # vùng tối để ảnh RENDER trông như ảnh CHỤP. Đưa vào đây thì lá xanh đậm ra sắc xanh xám
    # bợt, và tôi đã đi chỉnh màu gốc mấy lượt mà không hiểu vì sao chỉnh mãi không xuống được.
    # Tranh sprite 2D cần đúng cái ngược lại: màu ra ĐÚNG như đặt. Nên dùng 'Standard'.
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    _vien_but(sc)
    return sc


def _vien_but(sc, day=1.7, mau=(0.16, 0.10, 0.08)):
    """NÉT VIỀN — thứ nhận ra Axie từ xa hơn bất cứ chi tiết nào khác.

    Soi lại chính tranh Axie trong repo (assets/chimera/*.webp) thì ngôn ngữ hình của nó gọn
    trong ba điều: thân là MỘT KHỐI TRÒN MỀM, bảng màu kẹo sáng, và quanh mọi thứ là một NÉT
    VIỀN ĐẬM màu nâu ấm — không phải đen. Bộ prop nướng trước đó không có điều nào: khối lồi
    lõm mặt gãy, xanh rừng trầm, và không nét. Đúng phép chiếu, đúng bóng, mà vẫn không ra Axie.
    (Đáng ghi thêm: bg_quangtruong.jpg — tấm map DUY NHẤT đã duyệt — hoá ra không mang chất Axie
    chút nào, nó là diorama trung cổ tối kiểu MU. Nên nó không dùng làm chuẩn Axie được.)

    Dùng Freestyle chứ không dùng vỏ lộn ngược: vỏ lộn ngược phải nhân đôi mọi vật rồi lật pháp
    tuyến, mà bộ này có vật dựng bằng bộ đẩy DISPLACE — nhân đôi xong nét viền lệch khỏi hình.
    Freestyle vẽ nét TỪ hình học đã dựng xong nên không lệch được.
    """
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    sc.render.line_thickness = day
    vl = sc.view_layers[0]
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    for ls in list(fs.linesets):
        fs.linesets.remove(ls)
    ls = fs.linesets.new('vien')
    # CHỈ bóng ngoài và mép vật — KHÔNG lấy nếp gãy. Bật nếp gãy thì mọi mặt của khối lồi lõm
    # đều được kẻ một nét, tán lá ra một mớ lưới rối chứ không ra hình.
    ls.select_silhouette = True
    ls.select_border = True
    ls.select_crease = False
    ls.select_edge_mark = False
    ls.linestyle.color = mau
    ls.linestyle.thickness = day


def _lin(mau):
    """sRGB → tuyến tính. Blender nhận màu TUYẾN TÍNH ở Base Color, nhưng bảng màu người ta
    đọc và so được là sRGB. Trộn hai hệ là cách chắc chắn nhất để chỉnh màu mãi không tới."""
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in mau)


def _nang(sc, manh=2.9):
    d = bpy.data.lights.new('s', 'SUN'); d.energy = manh; d.angle = math.radians(4)
    o = bpy.data.objects.new('sun', d); sc.collection.objects.link(o)
    o.rotation_euler = (math.radians(NANG_CAO), 0, math.radians(NANG_XOAY))
    w = bpy.data.worlds.new('w'); w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    # ⚠ Trời vừa là ánh sáng vòng vừa là thứ quyết TÔNG BÓNG. Bản đầu để 0,55 và gần trung
    # tính: bóng ra xám nhạt, cả tấm bẹt như tranh in. Hạ xuống 0,38 và ngả lam thì nắng ăn
    # bóng rõ, bóng ngả xanh — đúng thứ Quảng Trường Cũ đang có.
    bg.inputs[0].default_value = (0.34, 0.44, 0.62, 1)   # trời lam làm ánh sáng vòng
    # ⚠ Đi từ 0,55 xuống 0,38 rồi phải quay lại 0,55. Ở 0,38 kèm nắng 4,1 thì tương phản đúng
    # là mạnh hơn, nhưng MẠNH QUÁ: bóng cây chồng nhau thành mảng đen đặc nuốt cả nền, còn mặt
    # đá bắt nắng thì cháy trắng — trong ảnh lát thử đá hiện ra như mấy quả bóng golf. Cặp số
    # sống được là nắng vừa (2,9) + trời khá (0,55): bóng vẫn đọc ra mà không thủng nền.
    bg.inputs[1].default_value = 0.55
    sc.world = w


# Hướng nhìn của camera sau khi xoay (Rz45 · Rx60) áp lên trục -Z mặc định. Tính sẵn thay vì
# đặt vị trí bằng mắt: bản đầu tôi để camera ở (10,-10,10) cho "trông có vẻ đúng", nhưng hướng
# nhìn thật là (-0,612 · +0,612 · -0,500) chứ không phải (-1 · +1 · -1) chuẩn hoá — lệch ~7°.
# Với ortho_scale nhỏ (1,41 cho một viên tile) thì 7° ở khoảng cách 17 đơn vị là trượt hẳn khỏi
# khung: năm viên nền nướng ra RỖNG TRƠN, cả năm md5 giống hệt nhau. Vật thể thì khung rộng hơn
# nên vẫn lọt, và đó là lý do lỗi này thoát được mắt ở lượt trước.
def _huong_nhin():
    rx, rz = math.radians(60), math.radians(45)
    y = math.sin(rx); z = -math.cos(rx)                     # Rx áp lên (0,0,-1)
    return (-y * math.sin(rz), y * math.cos(rz), z)          # rồi Rz


def _cam(sc, scale, ngam=(0, 0, 0), xa=14.0):
    d = bpy.data.cameras.new('c'); d.type = 'ORTHO'; d.ortho_scale = scale
    o = bpy.data.objects.new('cam', d); sc.collection.objects.link(o); sc.camera = o
    f = _huong_nhin()
    o.location = tuple(ngam[i] - f[i] * xa for i in range(3))  # lùi ngược hướng nhìn từ điểm ngắm
    o.rotation_euler = (math.radians(60), 0, math.radians(45))  # 60° → nén dọc 0,5 → hình thoi 2:1
    return o


def _vatlieu(ten, mau, nham=0.92, van=None, manh_van=0.55):
    """Vật liệu có VÂN procedural — tile phẳng trơn thì lát ra nhìn như vải nhựa."""
    m = bpy.data.materials.new(ten); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']
    mau = _lin(mau)
    bsdf.inputs['Base Color'].default_value = (*mau, 1)
    bsdf.inputs['Roughness'].default_value = nham
    if van:
        tex = nt.nodes.new('ShaderNodeTexNoise')
        # 4D + W khác nhau = VÂN khác nhau. Bản đầu tôi đổi vân bằng cách DỜI mặt phẳng đi, nhưng
        # Noise Texture mặc định đọc toạ độ Generated (chuẩn hoá theo chính vật), nên dời vật thì
        # vân không đổi một chấm — ba viên cỏ ra y hệt nhau.
        tex.noise_dimensions = '4D'
        tex.inputs['W'].default_value = manh_van * 37.0 + van * 0.13
        # ⚠ `manh_van` ở nền nay đóng vai HẠT (đổi vân), nên biên độ sáng-tối phải chốt cứng,
        # không được lấy theo `manh_van` nữa — nếu không mỗi hạt lại ra một độ tương phản khác.
        tex.inputs['Scale'].default_value = van
        tex.inputs['Detail'].default_value = 14      # nhiều tầng vân: có hạt to lẫn hạt nhỏ
        tex.inputs['Roughness'].default_value = 0.62
        ramp = nt.nodes.new('ShaderNodeValToRGB')
        BIEN = 0.34
        ramp.color_ramp.elements[0].color = (*[c * (1 - BIEN) for c in mau], 1)
        ramp.color_ramp.elements[1].color = (*[min(1, c * (1 + BIEN)) for c in mau], 1)
        nt.links.new(tex.outputs['Fac'], ramp.inputs['Fac'])
        nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
        # gồ ghề nhẹ để nắng bắt được mặt đất, nếu không thì tile chết như giấy dán
        b = nt.nodes.new('ShaderNodeBump'); b.inputs['Strength'].default_value = 0.55
        nt.links.new(tex.outputs['Fac'], b.inputs['Height'])
        nt.links.new(b.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def _truc_cam():
    """Trục NGANG và trục DỌC của khung nhìn, trong thế giới. Chiếu một điểm = tích vô hướng."""
    rz = math.radians(45); rx = math.radians(60)
    phai = (math.cos(rz), math.sin(rz), 0.0)
    tren = (-math.sin(rz) * math.cos(rx), math.cos(rz) * math.cos(rx), math.sin(rx))
    return phai, tren


def _huong_nang():
    """Hướng tia nắng đi (đèn SUN chiếu theo -Z cục bộ của chính nó)."""
    c, n = math.radians(NANG_CAO), math.radians(NANG_XOAY)
    return (-math.sin(n) * math.sin(c), math.cos(n) * math.sin(c), -math.cos(c))


def _khung_tu_canh(cao_px, le=0.06):
    """Tự tính khung, `ortho_scale` và điểm ngắm TỪ CHÍNH CẢNH — không đặt tay số nào.

    Hai thứ phải trùm hết trong khung, và lượt trước tôi chỉ nghĩ tới thứ nhất:
      · bản thân vật thể;
      · CÁI BÓNG của nó. Bóng đổ xiên nên thò ra khỏi bao của vật; khung cắt vào bóng thì để
        lại một vệt tối cụt đuôi, cạnh thẳng đứng — thấy rõ trong ảnh lát thử, mấy dải đen
        dựng đứng giữa rừng chính là chỗ ấy.

    Trả về cả TOẠ ĐỘ CHÂN trong khung: gốc vật (0,0,0) hiếm khi rơi đúng đáy-giữa khung sau khi
    khung phải nới ra cho vừa bóng, nên trình ghép phải neo theo số này chứ không đoán.
    """
    phai, tren = _truc_cam()
    nang = _huong_nang()
    goc = []
    for o in bpy.context.scene.objects:
        if o.type != 'MESH' or getattr(o, 'is_shadow_catcher', False):
            continue
        for v in o.bound_box:
            p = o.matrix_world @ mathutils.Vector(v)
            goc.append((p.x, p.y, p.z))
    if not goc:
        raise SystemExit('✗ cảnh rỗng — không có lưới nào để nướng')
    # nới bao ra cho phần bị bộ đẩy (DISPLACE) thò ra: bound_box đọc lưới GỐC, chưa qua bộ đẩy
    day = max(max(abs(g[i]) for g in goc) for i in range(3)) * 0.10
    goc = [(x + sx * day, y + sy * day, z + sz * day) for (x, y, z) in goc
           for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
    bong = [(x - z / -nang[2] * nang[0], y - z / -nang[2] * nang[1], 0.0) for (x, y, z) in goc]

    def _chieu(ds):
        u = [sum(p[i] * phai[i] for i in range(3)) for p in ds]
        v = [sum(p[i] * tren[i] for i in range(3)) for p in ds]
        return min(u), max(u), min(v), max(v)

    _, _, v0v, v1v = _chieu(goc)                      # riêng VẬT — để lấy cỡ vẽ ra
    u0, u1, v0, v1 = _chieu(goc + bong)               # vật + BÓNG — để lấy khung
    m = max(u1 - u0, v1 - v0) * le
    u0 -= m; u1 += m; v0 -= m; v1 += m
    thang = cao_px / max(v1v - v0v, 1e-6)             # px cho mỗi đơn vị, ép theo cỡ VẬT
    rx, ry = max(2, round((u1 - u0) * thang)), max(2, round((v1 - v0) * thang))
    # điểm ngắm: điểm thế giới chiếu đúng vào TÂM khung (phai/tren trực chuẩn nên dựng thẳng)
    cu, cv = (u0 + u1) / 2, (v0 + v1) / 2
    ngam = tuple(cu * phai[i] + cv * tren[i] for i in range(3))
    chan = (round((0 - u0) * thang), round((v1 - 0) * thang))   # gốc vật (0,0,0) nằm đâu trong khung
    return rx, ry, max(u1 - u0, v1 - v0), ngam, chan


def nuong_nen(ten, mau, van, hat=0.0):
    """Một viên nền hình thoi. `hat` đổi vân để hai viên cùng loại không giống hệt nhau."""
    sc = _sach(); sc.render.resolution_x, sc.render.resolution_y = W_TILE, H_TILE
    sc.render.film_transparent = True
    # ⚠ VIÊN NỀN KHÔNG ĐƯỢC CÓ NÉT VIỀN. Nét viền là thứ làm vật thể ra chất Axie, nhưng viên
    # nền thì bốn cạnh của nó là chỗ nó GHÉP với viên bên cạnh — kẻ nét quanh đó là kẻ nguyên
    # một lưới ô vuông chạy khắp map, đúng cái lỗi bàn cờ mà cả lối lát viên sinh ra để tránh.
    # Thấy ngay ở ảnh thử đầu tiên có nét.
    sc.render.use_freestyle = False
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.object
    o.data.materials.append(_vatlieu(ten, mau, van=van, manh_van=0.32 + hat))
    # ⚠ TRÀN MÉP 1,5%. Nếu hình thoi vừa khít khung thì bốn cạnh của nó là điểm ảnh BÁN TRONG
    # SUỐT (khử răng cưa). Hai viên kề nhau, mỗi viên góp một nửa alpha, chồng lên nhau vẫn
    # KHÔNG đầy — nền tối lọt qua thành một lưới kẻ mảnh chạy khắp map, thấy rõ trong ảnh lát thử.
    # Thu ortho_scale lại một chút = phóng hình thoi to hơn khung một chút: bốn mũi nhọn bị khung
    # cắt cụt, mép trở thành ĐẶC. Cắt cụt không tạo lỗ hổng vì các viên kề chồng lên nhau ở đúng
    # chỗ ấy — hợp của chúng vẫn phủ kín.
    TRAN = 1.015
    _cam(sc, math.sqrt(2) / TRAN); _nang(sc)
    sc.render.filepath = os.path.join(RA, f'{ten}.png')
    bpy.ops.render.render(write_still=True)
    # Hình thoi nội tiếp khung chữ nhật phủ ĐÚNG 50% diện tích — đó là hình học, không phải
    # thiếu sót. Ngưỡng 45% để chừa lề khử răng cưa ở bốn mũi nhọn. (Bản đầu tôi đặt 90% theo
    # phản xạ "kín khung là tốt" và bài kiểm tự đánh trượt một viên tile hoàn toàn đúng.)
    _kiem_khong_rong(os.path.join(RA, f'{ten}.png'), ten, toi_thieu=45)


NEO = {}          # tên sprite → (x, y) của CHÂN vật trong khung, px


def nuong_vat(ten, dung, cao_px):
    """Một vật thể rời, nền trong suốt, MANG SẴN bóng của chính nó trong kênh alpha.

    `cao_px` = chiều cao VẬT sẽ hiện trên màn, tính bằng pixel — xem luật khung ở đầu tệp.
    Khung, `ortho_scale` và điểm ngắm tự tính từ cảnh, kể cả phần bóng thò ra.

    Mặt đất đặt chế độ `is_shadow_catcher` nên nó không tự hiện ra, chỉ để lại cái bóng —
    tức sprite xuất ra đã dính bóng đúng hướng nắng chung, không phải vẽ tay ellipse dưới gốc.
    """
    sc = _sach()
    sc.render.film_transparent = True
    dung()
    bpy.ops.mesh.primitive_plane_add(size=60)
    bpy.context.object.is_shadow_catcher = True
    rx, ry, sca, ngam, chan = _khung_tu_canh(cao_px)
    sc.render.resolution_x, sc.render.resolution_y = rx, ry
    _cam(sc, sca, ngam=ngam, xa=40.0)
    _nang(sc)
    sc.render.filepath = os.path.join(RA, f'{ten}.png')
    bpy.ops.render.render(write_still=True)
    NEO[ten] = chan
    _kiem_khong_rong(os.path.join(RA, f'{ten}.png'), ten, toi_thieu=3)


def _kiem_khong_rong(duong, ten, toi_thieu):
    """Nướng xong PHẢI soi lại. Một khung trượt khỏi vật thể vẫn ghi ra tệp PNG hợp lệ, đúng khổ,
    và im lặng — lượt đầu năm viên nền rỗng trơn mà không có một dòng lỗi nào."""
    import struct, zlib
    with open(duong, 'rb') as f:
        d = f.read()
    # đọc alpha bằng tay để khỏi phụ thuộc PIL trong tiến trình Blender
    i, w, h = 8, 0, 0
    idat = b''
    while i < len(d):
        ln = struct.unpack('>I', d[i:i+4])[0]; typ = d[i+4:i+8]
        if typ == b'IHDR':
            w, h = struct.unpack('>II', d[i+8:i+16])
        elif typ == b'IDAT':
            idat += d[i+8:i+8+ln]
        i += 12 + ln
    raw = zlib.decompress(idat)
    dac = 0; truoc = bytearray(w * 4)
    p = 0
    for _ in range(h):
        ft = raw[p]; p += 1
        dong = bytearray(raw[p:p+w*4]); p += w*4
        for x in range(w*4):                      # bỏ lọc PNG (chỉ cần đủ đúng để đếm alpha)
            a = dong[x-4] if x >= 4 else 0
            b = truoc[x]
            c = truoc[x-4] if x >= 4 else 0
            if ft == 1: dong[x] = (dong[x] + a) & 255
            elif ft == 2: dong[x] = (dong[x] + b) & 255
            elif ft == 3: dong[x] = (dong[x] + (a + b) // 2) & 255
            elif ft == 4:
                pp = a + b - c
                pa, pb, pc = abs(pp-a), abs(pp-b), abs(pp-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                dong[x] = (dong[x] + pr) & 255
        for x in range(3, w*4, 4):
            if dong[x] > 200: dac += 1
        truoc = dong
    pct = 100.0 * dac / (w * h)
    if pct < toi_thieu:
        raise SystemExit(f'✗ {ten}: chỉ {pct:.1f}% khung có hình (cần ≥{toi_thieu}%) — '
                         f'khung trượt khỏi vật thể, KHÔNG dùng được')
    print(f'  ✓ {ten}: {pct:.0f}% khung có hình')


# ── dáng vật thể ────────────────────────────────────────────────────────────────────────────
# ⚠ VÌ SAO BỎ CHỒNG NÓN. Lượt đầu tán lá là 2-4 hình nón xếp chồng. Lát ra thì cả khoảnh rừng
# hiện nguyên hình dãy nón — bóng ngoài của nón là hai đoạn thẳng, mà mắt bắt đường thẳng lặp
# lại nhanh hơn bất cứ thứ gì. Ba "biến thể" cây chỉ khác số tầng nón nên vẫn cùng một bóng.
# Nay tán = mấy khối cầu méo bị nhiễu đẩy mép, mỗi cây một hạt ngẫu nhiên khác → bóng ngoài
# lởm chởm và KHÔNG cây nào trùng cây nào.

def _cum_la(mau, tam, ban, hat, so_khoi=5, det=0.78):
    """Tán lá: `so_khoi` khối cầu méo, mép bị nhiễu đẩy → bóng ngoài lởm chởm.

    ⚠ NHẬP LÀM MỘT LƯỚI TRƯỚC KHI RỜI KHỎI HÀM. Freestyle kẻ nét theo bóng ngoài của TỪNG VẬT,
    nên để năm khối rời thì năm khối ai cũng được một vòng nét — tán lá ra một mớ vòng tròn
    chồng nhau, thấy rõ ở ảnh thử đầu tiên có nét. Nhập lại thì chỉ còn đúng bóng ngoài của cả
    cụm, đúng thứ cần.
    """
    rnd = random.Random(hat)
    truoc = set(bpy.context.scene.objects)
    m = _vatlieu(f'la{hat}', mau, van=26, manh_van=0.45)
    for i in range(so_khoi):
        a = rnd.uniform(0, math.tau)
        r = ban * rnd.uniform(0.10, 0.46)
        bk = ban * rnd.uniform(0.52, 0.80)
        bpy.ops.mesh.primitive_ico_sphere_add(
            subdivisions=4, radius=bk,
            location=(tam[0] + math.cos(a) * r, tam[1] + math.sin(a) * r,
                      tam[2] + rnd.uniform(-ban * 0.26, ban * 0.34)))
        o = bpy.context.object
        o.scale = (1.0, 1.0, det)
        t = bpy.data.textures.new(f't{hat}_{i}', 'CLOUDS')
        t.noise_scale = ban * 0.20
        md = o.modifiers.new('d', 'DISPLACE')
        md.texture = t
        # GLOBAL chứ không LOCAL: toạ độ cục bộ chuẩn hoá theo từng vật, nên năm khối cùng bán
        # kính sẽ méo GIỐNG HỆT nhau dù đặt ở đâu — đúng cái bẫy đã dính ở vân nền.
        md.texture_coords = 'GLOBAL'
        md.strength = ban * 0.55
        md.mid_level = 0.42
        o.data.materials.append(m)
        # ⚠ MẶT MƯỢT — và tôi đã đi qua đúng một vòng ở chỗ này. Ban đầu để mượt: ra quả bóng
        # nhẵn như thú nhồi bông. Đổi sang mặt gãy: đọc ra từng chùm lá, đẹp hơn hẳn. Rồi soi
        # tranh Axie thật thì hoá ra Axie KHÔNG dùng mặt gãy — nó là khối tròn mềm, và thứ tách
        # khối ra khỏi nền không phải nếp gãy mà là NÉT VIỀN. Có nét viền rồi thì mặt mượt đọc
        # ra "vẽ minh hoạ"; còn mặt gãy cộng nét viền thì thành một mớ đa diện.
        bpy.ops.object.shade_smooth()


def _than(cao, day=0.15, nghieng=0.0, mau=(0.48, 0.34, 0.24)):
    bpy.ops.mesh.primitive_cone_add(radius1=day * 1.5, radius2=day * 0.8, depth=cao,
                                    location=(0, 0, cao / 2))
    o = bpy.context.object
    o.rotation_euler = (nghieng, 0, 0)
    o.data.materials.append(_vatlieu('than', mau, van=30, manh_van=0.5))
    bpy.ops.object.shade_smooth()


def _cay_tan(cao_than, ban, mau_la, hat, so_khoi=5, det=0.78):
    """Cây tán tròn — dáng chủ đạo của rừng ôn hoà."""
    def f():
        _than(cao_than, day=ban * 0.11, nghieng=math.radians(random.Random(hat).uniform(-4, 4)))
        _cum_la(mau_la, (0, 0, cao_than + ban * 0.42), ban, hat, so_khoi, det)
    return f


def _cay_thong(cao_than, ban, mau_la, hat):
    """Cây lá kim — vẫn dựng bằng cụm khối, chỉ thu nhỏ dần lên đỉnh, KHÔNG dùng nón."""
    def f():
        _than(cao_than * 1.45, day=ban * 0.10)
        rnd = random.Random(hat)
        z = cao_than * 0.55
        for i in range(4):
            k = 1.0 - i * 0.21
            _cum_la(mau_la, (0, 0, z), ban * k, hat * 10 + i, so_khoi=3, det=0.62)
            z += ban * 0.52 * k
        _ = rnd
    return f


def _bui(ban, mau_la, hat):
    def f():
        _cum_la(mau_la, (0, 0, ban * 0.52), ban, hat, so_khoi=4, det=0.66)
    return f


def _da(co, meo, hat):
    def f():
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=co, location=(0, 0, co * 0.5))
        o = bpy.context.object
        o.scale = meo
        t = bpy.data.textures.new(f'td{hat}', 'CLOUDS'); t.noise_scale = co * 0.55
        md = o.modifiers.new('d', 'DISPLACE'); md.texture = t
        md.texture_coords = 'GLOBAL'; md.strength = co * 0.34; md.mid_level = 0.45
        o.data.materials.append(_vatlieu('da', (0.66, 0.63, 0.60), van=16, manh_van=0.30))
        bpy.ops.object.shade_flat()      # đá là mặt gãy, KHÔNG làm mượt
    return f


def _co_bui(ban, mau, hat):
    """Túm cỏ — rải lên nền cho mặt đất khỏi trơ. Rẻ hơn hẳn so với nướng thêm biến thể nền,
    và không bị khung cắt cụt như khi dựng cỏ ngay trên viên nền."""
    def f():
        rnd = random.Random(hat)
        m = _vatlieu(f'co{hat}', mau, van=40, manh_van=0.5)
        for _ in range(14):
            a = rnd.uniform(0, math.tau); r = ban * rnd.uniform(0, 1.0)
            h = ban * rnd.uniform(0.7, 1.6)
            bpy.ops.mesh.primitive_cone_add(radius1=ban * 0.10, radius2=0.0, depth=h,
                                            location=(math.cos(a) * r, math.sin(a) * r, h / 2))
            o = bpy.context.object
            o.rotation_euler = (rnd.uniform(-0.4, 0.4), rnd.uniform(-0.4, 0.4), 0)
            o.data.materials.append(m)
    return f


def nuong_vet(ten, mau, van, hat, ban=2.2):
    """VỆT ĐẤT rời — mảng đất mép lởm chởm, alpha do nhiễu cắt.

    Dùng để phá cái cầu thang ở ranh giới cỏ/đường mòn. Rẻ hơn hẳn bộ 8 viên chuyển tiếp
    (4 cạnh + 4 góc) mà lại KHÔNG ra đường biên thẳng — rải vài vệt dọc mép đường là mất hẳn
    răng cưa. Viên chuyển tiếp còn buộc trình ghép phải biết tự-lát; vệt thì chỉ là một sprite.
    """
    sc = _sach()
    # Vệt nằm BẸP trên đất nên đo theo viên nền, không theo thân nhân vật: một vệt rộng `ban`
    # đơn vị phủ đúng `ban` viên tile, nên bề ngang = ban × W_TILE.
    sc.render.resolution_x = round(ban * W_TILE)
    sc.render.resolution_y = round(ban * H_TILE)          # dẹt 2:1 như hình thoi
    sc.render.film_transparent = True
    sc.render.use_freestyle = False        # vệt nằm bẹp trên nền, kẻ nét là ra một mảng dán
    bpy.ops.mesh.primitive_plane_add(size=ban)
    o = bpy.context.object
    m = _vatlieu(ten, mau, van=van, manh_van=0.3 + hat)
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    trong = nt.nodes.new('ShaderNodeBsdfTransparent')
    tron = nt.nodes.new('ShaderNodeMixShader')
    # ⚠ PHẢI ĐƯA TOẠ ĐỘ VÀO TAY. Bản đầu tôi để Gradient/Noise không nối gì, tưởng chúng lấy
    # toạ độ tính từ TÂM vật. Không: mặc định là Generated, chuẩn hoá 0..1 theo hộp bao, nên
    # tâm quả cầu rơi vào GÓC hộp chứ không vào giữa tấm — gần như cả tấm có bán kính > 1, dốc
    # cầu về 0, mặt nạ tắt sạch. Bài tự kiểm bắt được ngay: `vet_dat1` ra 0,0% khung có hình.
    coord = nt.nodes.new('ShaderNodeTexCoord')
    anh = nt.nodes.new('ShaderNodeMapping')
    anh.inputs['Scale'].default_value = (2.0 / ban, 2.0 / ban, 2.0 / ban)
    nt.links.new(coord.outputs['Object'], anh.inputs['Vector'])
    # mặt nạ alpha: dốc cầu theo bán kính, bị nhiễu xô lệch → mảng bầu dục MÉP RÁCH
    ntex = nt.nodes.new('ShaderNodeTexNoise')
    ntex.noise_dimensions = '4D'
    ntex.inputs['W'].default_value = hat * 19.0
    ntex.inputs['Scale'].default_value = 3.4
    ntex.inputs['Detail'].default_value = 8
    nt.links.new(anh.outputs['Vector'], ntex.inputs['Vector'])
    grad = nt.nodes.new('ShaderNodeTexGradient'); grad.gradient_type = 'SPHERICAL'
    nt.links.new(anh.outputs['Vector'], grad.inputs['Vector'])
    # xô: (nhiễu − 0,5) × 0,5 cộng vào dốc cầu, rồi cắt ở 0,35 → bán kính ~0,65 lồi lõm
    xo = nt.nodes.new('ShaderNodeMath'); xo.operation = 'MULTIPLY_ADD'
    xo.inputs[1].default_value = 0.50; xo.inputs[2].default_value = -0.25
    cong = nt.nodes.new('ShaderNodeMath'); cong.operation = 'ADD'
    nguong = nt.nodes.new('ShaderNodeMath'); nguong.operation = 'GREATER_THAN'
    nguong.inputs[1].default_value = 0.35
    nt.links.new(ntex.outputs['Fac'], xo.inputs[0])
    nt.links.new(xo.outputs[0], cong.inputs[0])
    nt.links.new(grad.outputs['Fac'], cong.inputs[1])
    nt.links.new(cong.outputs[0], nguong.inputs[0])
    nt.links.new(nguong.outputs[0], tron.inputs['Fac'])
    nt.links.new(trong.outputs[0], tron.inputs[1])
    nt.links.new(bsdf.outputs[0], tron.inputs[2])
    nt.links.new(tron.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    o.data.materials.append(m)
    _cam(sc, ban * math.sqrt(2) / TRAN); _nang(sc)
    sc.render.filepath = os.path.join(RA, f'{ten}.png')
    bpy.ops.render.render(write_still=True)
    _kiem_khong_rong(os.path.join(RA, f'{ten}.png'), ten, toi_thieu=8)


def main():
    os.makedirs(RA, exist_ok=True)
    # ── nền: cỏ (3 biến thể) + đất mòn (2 biến thể) ──
    # ⚠ BIẾN THỂ PHẢI CÙNG MÀU NỀN, chỉ khác HẠT VÂN.
    # Bản đầu tôi cho mỗi viên cỏ một màu hơi khác nhau (0,26 / 0,29 / 0,24) cho "đỡ đều".
    # Lát ra thì mỗi viên thành một mảng phẳng riêng, nhìn rõ mồn một từng ô — đúng cái lỗi bàn
    # cờ mà tile sinh ra để tránh. Đo được: sáng trung bình 137,6 / 142,4 / 133,8, lệch 9 đơn vị,
    # thừa sức để mắt bắt ra ranh giới ô.
    # Luật: biến thể đổi VÂN, KHÔNG đổi TÔNG. Muốn map có mảng đậm nhạt thì dùng vệt đất hoặc
    # vật thể, đừng dùng biến thể nền.
    # Bảng màu khai bằng sRGB (xem `_lin`) — đọc được, so được với tranh Quảng Trường Cũ.
    # Bảng màu KẸO, lấy thẳng từ tranh Axie: sáng, no màu, ngả ấm. Bản trước là xanh rừng trầm
    # (0,31/0,43/0,21) — đúng màu một khu rừng thật, và sai hẳn màu một thế giới Axie.
    CO  = (0.44, 0.62, 0.30)     # cỏ non
    DAT = (0.76, 0.62, 0.42)     # đất ấm, ngả cát
    nuong_nen('nen_co1',  CO,  van=9,  hat=0.00)
    nuong_nen('nen_co2',  CO,  van=9,  hat=0.31)
    nuong_nen('nen_co3',  CO,  van=9,  hat=0.62)
    nuong_nen('nen_dat1', DAT, van=11, hat=0.00)
    nuong_nen('nen_dat2', DAT, van=11, hat=0.44)
    # ── vệt chuyển tiếp ──
    # ⚠ CỠ VỆT LÀ NGÂN SÁCH VẼ, KHÔNG PHẢI THẨM MỸ. Bản đầu để ban=2,2 → khung 563×281. Đo A/B
    # trong game: chỉ chừng 50 vệt lọt khung mà ăn mất 12 khung/giây, trong khi 183 cây chỉ ăn
    # 27 — vì vệt to, gần như không bị che, nên tô kín từng điểm một. Mà việc của vệt chỉ là
    # GẶM cái mép giữa hai viên; bậc thang cần gặm rộng đúng một viên (256px), nên vệt to hơn
    # một viên là tô thừa. ban=1,0 → đúng 256×128, rẻ đi 4,8 lần.
    nuong_vet('vet_dat1', DAT, van=13, hat=0.11, ban=1.0)
    nuong_vet('vet_dat2', DAT, van=13, hat=0.53, ban=0.7)
    # ── cây: sáu dáng, sáu hạt ngẫu nhiên, ba tông lá ──
    # Tán lá ĐẬM HƠN cỏ: tán nằm trong bóng của chính nó. Bản đầu lá sáng ngang cỏ nên cây
    # chìm vào nền, phải nhờ bóng đổ mới tách ra được.
    # Cỡ vẽ ra lấy theo thân nhân vật 95 px: cây lớn 3,0× · cây thường 2,6× · cây con 2,0×.
    LA_A, LA_B, LA_C = (0.29, 0.52, 0.26), (0.38, 0.62, 0.30), (0.50, 0.66, 0.31)
    nuong_vat('cay1', _cay_tan(1.7, 1.35, LA_A, 11),            cao_px=round(CAO_NV * 2.9))
    nuong_vat('cay2', _cay_tan(2.3, 1.15, LA_B, 27, so_khoi=6), cao_px=round(CAO_NV * 3.1))
    nuong_vat('cay3', _cay_tan(1.3, 1.55, LA_C, 43, det=0.62),  cao_px=round(CAO_NV * 2.4))
    nuong_vat('cay4', _cay_thong(1.6, 1.05, LA_A, 59),          cao_px=round(CAO_NV * 3.3))
    nuong_vat('cay5', _cay_thong(1.2, 0.85, LA_B, 71),          cao_px=round(CAO_NV * 2.5))
    nuong_vat('cay6', _cay_tan(2.8, 1.00, LA_C, 89, so_khoi=4), cao_px=round(CAO_NV * 2.7))
    # ── bụi, đá, túm cỏ — thứ rải TRONG lối, phải thấp hơn tầm mắt để khỏi che nhau ──
    nuong_vat('buicay1', _bui(0.72, LA_B, 101), cao_px=round(CAO_NV * 0.80))
    nuong_vat('buicay2', _bui(0.50, LA_C, 113), cao_px=round(CAO_NV * 0.58))
    nuong_vat('buicay3', _bui(0.92, LA_A, 127), cao_px=round(CAO_NV * 1.00))
    nuong_vat('da1', _da(0.70, (1.0, 0.9, 0.72), 3), cao_px=round(CAO_NV * 0.62))
    nuong_vat('da2', _da(0.48, (1.2, 0.8, 0.60), 5), cao_px=round(CAO_NV * 0.42))
    nuong_vat('da3', _da(0.95, (0.9, 1.1, 0.58), 7), cao_px=round(CAO_NV * 0.86))
    nuong_vat('co1', _co_bui(0.40, (0.50, 0.68, 0.32), 131), cao_px=round(CAO_NV * 0.34))
    nuong_vat('co2', _co_bui(0.62, (0.55, 0.66, 0.34), 137), cao_px=round(CAO_NV * 0.48))
    # Toạ độ CHÂN từng sprite — trình ghép (và engine) neo theo đây, không đoán đáy-giữa khung.
    with open(os.path.join(RA, 'neo.json'), 'w', encoding='utf-8') as f:
        json.dump(NEO, f, indent=1)
    # ...và cùng bảng ấy dưới dạng TỆP DỮ LIỆU ANH EM cho game (lối `data/canbang.js`). Sinh ra
    # từ chính lượt nướng này nên KHÔNG THỂ LỆCH với bộ PNG vừa xuất — chép tay vào game.js là
    # cách chắc chắn để một ngày nào đó nướng lại rồi quên sửa, và cả rừng đứng lệch chân.
    with open(os.path.join(RA, 'iso.js'), 'w', encoding='utf-8') as f:
        f.write('// SINH TU DONG boi tools/iso/nuong_tile.py — DUNG SUA TAY.\n'
                '// Toa do CHAN cua tung sprite trong khung cua no, tinh bang pixel.\n'
                'window.ISO_NEO = {\n')
        for k in sorted(NEO):
            f.write(f'  {k}: [{NEO[k][0]}, {NEO[k][1]}],\n')
        f.write('};\n')
    print('NUONG XONG →', RA)


if __name__ == '__main__':
    main()
