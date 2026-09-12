#!/usr/bin/env python3
"""Nướng BỘ VIÊN NỀN theo BIOME — tuyết · tro nung · đầm lầy.

Vì sao có tệp này. Sau đợt dựng lại bốn map nhìn ngang, kho chỉ có bốn bộ viên
(`co` · `dat` · `da` · `duong`) mà phải gánh bảy map, nên ba vùng cuối đi mượn: Bird Tribe
Heights lát đá, Reptile Sunstone Flats lát đất, Dusk Marsh lát cỏ. Bản sắc ba vùng ấy nằm ở
`ground`/`patch` và ở bộ quái, KHÔNG nằm ở chất liệu sàn — mà sàn là thứ chiếm phần lớn màn hình.

⚠ ĐÂY KHÔNG PHẢI "TÔ MÀU LẠI VIÊN CŨ". CLAUDE.md cấm đúng chuyện đó ("đừng chữa vấn đề thị giác
bằng cách kéo giãn hoặc đè màu lên tài nguyên có sẵn"). Mỗi bộ dưới đây nướng LẠI TỪ CẢNH 3D qua
`nuong_nen`, với vân riêng và bảng màu riêng — cùng một hướng nắng, cùng một phép chiếu, nên ghép
chung map với bộ cỏ/đất mà không lệch.

Chạy:  python3 tools/iso/nuong_biome.py [thư mục ra]
Cần:   pip install bpy==4.2.0   (Blender chạy trong tiến trình Python, không cần bản cài đặt)
"""
import os, sys

RA = sys.argv[1] if len(sys.argv) > 1 else 'public/game/assets/iso'

# Nạp nuong_tile mà KHÔNG chạy main() của nó — dùng lại nguyên hình học, ánh sáng và bộ tự kiểm.
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nuong_tile.py'),
            encoding='utf-8').read().replace("if __name__ == '__main__':", 'if False:')
NT = {'__name__': 'nuong_tile'}
sys.argv = [sys.argv[0], RA]
exec(compile(_src, 'nuong_tile.py', 'exec'), NT)
nuong_nen, nuong_vet, nuong_vat = NT['nuong_nen'], NT['nuong_vet'], NT['nuong_vat']
CAO_NV = NT['CAO_NV']


def _da_mau(co, meo, hat, mau):
    """Đá có MÀU khai được. `nuong_tile._da` chốt cứng (0,66 0,63 0,60) — xám đá thường, đúng cho
    rừng ôn hoà và sai cho mọi vùng khác: một hòn xám nằm giữa tuyết hay giữa đá nung đọc ra là
    một hòn đá lạc chỗ. Phần hình học chép y nguyên, chỉ mở thêm tham số màu."""
    import bpy, random as _r
    def f():
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=co, location=(0, 0, co * 0.5))
        o = bpy.context.object
        o.scale = meo
        t = bpy.data.textures.new(f'tdb{hat}', 'CLOUDS'); t.noise_scale = co * 0.55
        md = o.modifiers.new('d', 'DISPLACE'); md.texture = t
        md.texture_coords = 'GLOBAL'; md.strength = co * 0.34; md.mid_level = 0.45
        o.data.materials.append(NT['_vatlieu'](f'dab{hat}', mau, van=16, manh_van=0.30))
        bpy.ops.object.shade_flat()
        _ = _r
    return f


# ── VẬT THỂ THEO BIOME ─────────────────────────────────────────────────────────────────────
# Vì sao cần: `ISO_CAY` / `ISO_NHO` là hằng TOÀN CỤC, nên sau khi sàn đã ra đúng vùng thì Bird
# Tribe Heights vẫn tuyết phủ kín mà mọc cây lá xanh, Reptile Sunstone Flats cháy đỏ cũng cây lá
# xanh ấy. Sàn đọc đúng vùng, vật thể đứng trên sàn thì chưa — và vật thể mới là thứ mắt bắt
# trước, vì nó có đường viền.
#
# Mỗi bộ gồm CÂY (rải NGOÀI đa giác, làm bức tường vùng) và VẶT NHỎ (rải TRONG, làm nền đỡ trơ).
_T = NT['_cay_tan']; _TH = NT['_cay_thong']; _B = NT['_bui']; _C = NT['_co_bui']

VAT = {
  # Bird Tribe Heights — lá kim trĩu tuyết, đá băng. Lá sáng hơn nền tuyết một chút để không chìm.
  'tuyet': dict(cay=[(_TH, (1.5, 1.00, (0.72, 0.80, 0.88), 211), 2.9),
                     (_TH, (1.2, 0.85, (0.78, 0.85, 0.92), 223), 2.4),
                     (_TH, (1.8, 1.05, (0.66, 0.75, 0.85), 227), 3.2),
                     (_T,  (1.3, 1.10, (0.80, 0.86, 0.93), 229, 4, 0.70), 2.5)],
                # ⚠ VẬT NHỎ TRÊN TUYẾT PHẢI SẪM. Bản đầu tôi cho đá màu (0,74 0,80 0,88) — gần
                # đúng màu tuyết — nên chúng tàng hình, và mặt tuyết không còn một mốc tương
                # phản nào để mắt bám vào. Không có mốc thì một mặt phẳng sáng đều đọc ra là
                # khoảng không. Đá xám sẫm và túm cỏ khô chõi lên là thứ nói "có mặt đất ở đây".
                nho=[(_C, (0.52, (0.50, 0.44, 0.32), 231), 0.32),
                     ('da', (0.62, (1.0, 0.9, 0.72), 233, (0.34, 0.36, 0.42)), 0.58),
                     ('da', (0.44, (1.2, 0.8, 0.60), 239, (0.42, 0.44, 0.50)), 0.40)]),
  # Reptile Sunstone Flats — cây cháy sém, tán thưa, đá nung đỏ.
  'tro':   dict(cay=[(_T, (1.9, 0.85, (0.42, 0.26, 0.16), 241, 3, 0.55), 2.6),
                     (_T, (2.3, 0.70, (0.50, 0.30, 0.18), 251, 3, 0.50), 3.0),
                     (_T, (1.4, 0.95, (0.38, 0.24, 0.15), 257, 4, 0.58), 2.2),
                     (_B, (0.80, (0.46, 0.28, 0.17), 263), 0.85)],
                nho=[(_C, (0.44, (0.62, 0.46, 0.26), 269), 0.34),
                     ('da', (0.66, (1.0, 0.9, 0.72), 271, (0.70, 0.40, 0.26)), 0.60),
                     ('da', (0.46, (1.1, 0.8, 0.62), 277, (0.62, 0.34, 0.22)), 0.42)]),
  # Dusk Marsh — cây rủ, lá xanh đục ngả nâu, đá phủ rêu.
  'bun':   dict(cay=[(_T, (2.0, 1.15, (0.26, 0.34, 0.22), 281, 5, 0.86), 2.8),
                     (_T, (1.5, 1.30, (0.30, 0.38, 0.24), 283, 5, 0.90), 2.4),
                     (_T, (2.5, 0.95, (0.22, 0.30, 0.20), 293, 4, 0.82), 3.1),
                     (_B, (0.90, (0.28, 0.36, 0.23), 307), 0.95)],
                nho=[(_C, (0.52, (0.34, 0.44, 0.26), 311), 0.40),
                     ('da', (0.60, (1.0, 0.9, 0.72), 313, (0.40, 0.44, 0.30)), 0.56),
                     ('da', (0.42, (1.2, 0.8, 0.60), 317, (0.36, 0.40, 0.28)), 0.38)]),
  # Werebear Woods — rừng rậm, lá sẫm hơn hẳn Rẻo Rừng Corran để hai khoảnh rừng không lẫn nhau.
  'rung':  dict(cay=[(_T, (1.8, 1.40, (0.20, 0.36, 0.18), 331, 6, 0.84), 3.0),
                     (_T, (2.4, 1.20, (0.24, 0.42, 0.20), 337, 5, 0.80), 3.2),
                     (_TH, (1.7, 1.00, (0.18, 0.32, 0.17), 347), 3.3),
                     (_T, (1.2, 1.55, (0.28, 0.46, 0.22), 349, 5, 0.66), 2.4)],
                nho=[(_C, (0.46, (0.30, 0.48, 0.24), 353), 0.36),
                     (_B, (0.55, (0.24, 0.40, 0.20), 359), 0.55),
                     ('da', (0.58, (1.0, 0.9, 0.72), 367, (0.46, 0.44, 0.38)), 0.54)]),
  # Bug Tribe Tunnels — KHÔNG có cây. Tường vùng là cột kitin/măng đá, nên "cây" ở đây là đá kéo
  # cao. Đúng chỗ để thấy `isoCayBo` không hứa phải là cây: nó là BỘ VẬT DỰNG TƯỜNG VÙNG.
  # Plant Tribe Glade — trảng cây có hoa, giữ lại chất "đầm sen" của tấm nền cũ mà không bắt ai
  # phải đứng trên mặt nước.
  'vuon':  dict(cay=[(_T, (1.6, 1.30, (0.82, 0.52, 0.62), 419, 5, 0.80), 2.7),
                     (_T, (2.1, 1.10, (0.88, 0.62, 0.70), 421, 5, 0.76), 3.0),
                     (_T, (1.3, 1.45, (0.46, 0.66, 0.36), 431, 5, 0.70), 2.3),
                     (_B, (0.85, (0.80, 0.50, 0.60), 433), 0.90)],
                nho=[(_C, (0.48, (0.54, 0.70, 0.38), 439), 0.36),
                     (_B, (0.50, (0.84, 0.56, 0.66), 443), 0.50),
                     ('da', (0.56, (1.0, 0.9, 0.72), 449, (0.62, 0.60, 0.50)), 0.52)]),
  'to':    dict(cay=[('da', (1.5, (0.55, 0.55, 2.6), 373, (0.62, 0.52, 0.32)), 2.6),
                     ('da', (1.2, (0.50, 0.50, 3.0), 379, (0.68, 0.58, 0.36)), 2.2),
                     ('da', (1.8, (0.60, 0.60, 2.2), 383, (0.56, 0.47, 0.30)), 3.0),
                     ('da', (1.0, (0.62, 0.62, 2.8), 389, (0.66, 0.55, 0.34)), 1.9)],
                nho=[('da', (0.58, (0.9, 0.9, 1.5), 397, (0.66, 0.56, 0.34)), 0.52),
                     ('da', (0.42, (1.1, 1.1, 1.2), 401, (0.60, 0.50, 0.30)), 0.38),
                     (_C, (0.40, (0.58, 0.52, 0.30), 409), 0.30)]),
}


def nuong_vat_biome():
    n = 0
    for bio, bo in VAT.items():
        for nhom, ds in (('cay', bo['cay']), ('nho', bo['nho'])):
            for i, (ham, args, co) in enumerate(ds):
                dung = _da_mau(args[0], args[1], args[2], args[3]) if ham == 'da' else ham(*args)
                nuong_vat(f'{nhom}_{bio}{i+1}', dung, cao_px=round(CAO_NV * co))
                n += 1
    return n

# ⚠ BIẾN THỂ CÙNG MỘT TÔNG, CHỈ KHÁC HẠT VÂN — luật của nuong_tile.py, và nó có lý do đo được:
# cho mỗi viên một màu hơi khác thì lát ra thành từng mảng phẳng, mắt bắt ngay ra ranh giới ô.
# Muốn map có mảng đậm nhạt thì dùng vệt hoặc vật thể, đừng dùng biến thể nền.
#
# Bảng màu khai bằng sRGB, theo đúng chất KẸO của tranh Axie: sáng, no màu — không phải màu
# "thật" của tuyết/tro/bùn. Bộ cỏ/đất sẵn có là (0,44 0,62 0,30) và (0,76 0,62 0,42); ba bộ dưới
# đây đặt cùng dải sáng để lát chung map không bộ nào chìm.
BO = [
    # (tiền tố, màu, vân, số biến thể) — vai NỀN của ba vùng
    # ⚠ TUYẾT PHẢI ĐỌC RA MẶT ĐẤT, KHÔNG RA BẦU TRỜI. Bản đầu tôi để (0,86 0,90 0,97) — trắng
    # ngả lam rất sáng — và lối đi (0,68 0,80 0,92) chỉ đậm hơn một chút. Chụp trong game ra
    # đúng một khoảng TRỜI CÓ MÂY: nhân vật với cả bầy quái lơ lửng giữa nền lam nhạt, còn vệt
    # lối mòn thì đọc thành dải mây. Tức là tôi vừa chữa xong lỗi "lơ lửng" do PHÉP CHIẾU thì
    # lại tạo ra đúng lỗi ấy bằng MÀU — cùng bài học đã ghi ở lớp phủ tối: đừng để màu nói một
    # đằng còn hình học nói một nẻo.
    # Chữa bằng hai việc: kéo giá trị xuống khỏi dải "trắng chói", và mở RỘNG khoảng cách sáng
    # giữa mặt nền và lối mòn — một lối mòn sẫm cắt ngang là thứ nói "đây là mặt đất".
    ('nen_tuyet', (0.78, 0.79, 0.84),  7, 4),   # Bird Tribe Heights — tuyết, trắng xám hơi lạnh
    ('nen_tro',   (0.82, 0.55, 0.30), 12, 4),   # Reptile Sunstone Flats — đá nung ngả cam
    ('nen_reu',   (0.40, 0.52, 0.31), 10, 4),   # Dusk Marsh — rêu đầm, xanh đục
    # ...và vai ĐƯỜNG (chỗ giẫm nhiều) của chính ba vùng ấy
    ('nen_bang',  (0.56, 0.58, 0.66),  6, 4),   # tuyết nện — SẪM hẳn so với nền, xem ghi chú trên
    ('nen_nung',  (0.60, 0.35, 0.22), 14, 4),   # lối cháy sém giữa đá nung
    ('nen_bun',   (0.44, 0.38, 0.26), 15, 4),   # bùn lầy bị giẫm
    ('nen_rung',  (0.32, 0.45, 0.24),  8, 4),   # Werebear Woods — nền rừng rậm, lá mục sẫm hơn cỏ
    ('nen_mon',   (0.55, 0.45, 0.30), 12, 4),   # ...và lối mòn xuyên rừng
    ('nen_to',    (0.70, 0.60, 0.36), 16, 4),   # Bug Tribe Tunnels — sàn tổ, vỏ kitin ngả vàng
    ('nen_hang',  (0.46, 0.40, 0.32), 17, 4),   # ...và lối hang bị giẫm mòn
    ('nen_vuon',  (0.50, 0.66, 0.40), 18, 4),   # Plant Tribe Glade — cỏ trảng, xanh non ngả vàng
    ('nen_soi',   (0.72, 0.68, 0.52), 19, 4),   # ...và lối sỏi xuyên trảng
]
# Vệt chuyển tiếp: gặm cái mép giữa hai vai viên. Phải cùng tông với vai ĐƯỜNG của vùng, nếu
# không thì ở Bird Tribe Heights hiện ra một vệt bùn nâu vắt ngang tuyết.
VET = [
    ('vet_bang', (0.56, 0.58, 0.66),  8),
    ('vet_nung', (0.60, 0.35, 0.22), 13),
    ('vet_bun',  (0.44, 0.38, 0.26), 15),
    ('vet_mon',  (0.55, 0.45, 0.30), 12),
    ('vet_hang', (0.46, 0.40, 0.32), 17),
    ('vet_soi',  (0.72, 0.68, 0.52), 19),
]


def main():
    os.makedirs(RA, exist_ok=True)
    n = 0
    for ten, mau, van, so in BO:
        for i in range(so):
            nuong_nen(f'{ten}{i+1}', mau, van=van, hat=round(i * 0.29, 2))
            n += 1
    for ten, mau, van in VET:
        # ban=1,0 → đúng một viên (256×128). Vệt to hơn một viên là tô thừa — xem ghi chú
        # "CỠ VỆT LÀ NGÂN SÁCH VẼ" trong nuong_tile.py.
        nuong_vet(f'{ten}1', mau, van=van, hat=0.11, ban=1.0)
        nuong_vet(f'{ten}2', mau, van=van, hat=0.53, ban=0.7)
        n += 2
    n += nuong_vat_biome()
    NT['ghi_neo'](RA, NT['NEO'])   # một tệp đích duy nhất — xem ghi_neo() trong nuong_tile.py
    print(f'NUONG XONG {n} vien/vet/vat → {RA}')


if __name__ == '__main__':
    main()
