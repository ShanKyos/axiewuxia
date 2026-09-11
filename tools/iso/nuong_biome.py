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
nuong_nen, nuong_vet = NT['nuong_nen'], NT['nuong_vet']

# ⚠ BIẾN THỂ CÙNG MỘT TÔNG, CHỈ KHÁC HẠT VÂN — luật của nuong_tile.py, và nó có lý do đo được:
# cho mỗi viên một màu hơi khác thì lát ra thành từng mảng phẳng, mắt bắt ngay ra ranh giới ô.
# Muốn map có mảng đậm nhạt thì dùng vệt hoặc vật thể, đừng dùng biến thể nền.
#
# Bảng màu khai bằng sRGB, theo đúng chất KẸO của tranh Axie: sáng, no màu — không phải màu
# "thật" của tuyết/tro/bùn. Bộ cỏ/đất sẵn có là (0,44 0,62 0,30) và (0,76 0,62 0,42); ba bộ dưới
# đây đặt cùng dải sáng để lát chung map không bộ nào chìm.
BO = [
    # (tiền tố, màu, vân, số biến thể) — vai NỀN của ba vùng
    ('nen_tuyet', (0.86, 0.90, 0.97),  7, 4),   # Bird Tribe Heights — tuyết, lam nhạt
    ('nen_tro',   (0.82, 0.55, 0.30), 12, 4),   # Reptile Sunstone Flats — đá nung ngả cam
    ('nen_reu',   (0.40, 0.52, 0.31), 10, 4),   # Dusk Marsh — rêu đầm, xanh đục
    # ...và vai ĐƯỜNG (chỗ giẫm nhiều) của chính ba vùng ấy
    ('nen_bang',  (0.68, 0.80, 0.92),  6, 4),   # tuyết nện thành băng
    ('nen_nung',  (0.60, 0.35, 0.22), 14, 4),   # lối cháy sém giữa đá nung
    ('nen_bun',   (0.44, 0.38, 0.26), 15, 4),   # bùn lầy bị giẫm
    ('nen_rung',  (0.32, 0.45, 0.24),  8, 4),   # Werebear Woods — nền rừng rậm, lá mục sẫm hơn cỏ
    ('nen_mon',   (0.55, 0.45, 0.30), 12, 4),   # ...và lối mòn xuyên rừng
    ('nen_to',    (0.70, 0.60, 0.36), 16, 4),   # Bug Tribe Tunnels — sàn tổ, vỏ kitin ngả vàng
    ('nen_hang',  (0.46, 0.40, 0.32), 17, 4),   # ...và lối hang bị giẫm mòn
]
# Vệt chuyển tiếp: gặm cái mép giữa hai vai viên. Phải cùng tông với vai ĐƯỜNG của vùng, nếu
# không thì ở Bird Tribe Heights hiện ra một vệt bùn nâu vắt ngang tuyết.
VET = [
    ('vet_bang', (0.68, 0.80, 0.92),  8),
    ('vet_nung', (0.60, 0.35, 0.22), 13),
    ('vet_bun',  (0.44, 0.38, 0.26), 15),
    ('vet_mon',  (0.55, 0.45, 0.30), 12),
    ('vet_hang', (0.46, 0.40, 0.32), 17),
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
    print(f'NUONG XONG {n} vien/vet → {RA}')


if __name__ == '__main__':
    main()
