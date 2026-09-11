#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Nướng nền màn hình chờ từ art CHÍNH CHỦ Axie.

Nguồn: axieinfinity/axie-origins-asset-kit —
  Assets/OriginsKit/PvE/Backgrounds/story/9-rocky-mountain-1/
Đó là một cảnh Lunacia ĐÃ TÁCH LỚP (trời · núi · ba tầng mây · sương · cây thế giới ·
mặt đất · hai tầng tiền cảnh). Tách lớp là lý do chọn cảnh này thay vì mấy tấm
`Backgrounds/class/*.jpg` 1920px: một tấm phẳng thì không có xa gần, mà xa gần mới là
thứ làm màn hình chờ sống.

Kết quả ghi vào public/game/assets/title/lunacia/.  Bảng `LOP` dưới đây phải TRÙNG KHÍT
với NEN_LOP trong game.js — `y` là toạ độ lớp trong khung gốc 1024x661, đo bằng mắt trên
ảnh dựng lại (bộ kit không kèm prefab nào cho mấy cảnh này, nên không có số nào để tra).

⚠ BẢN QUYỀN: art trong kit là IP của Sky Mavis / Axie Infinity. LICENSE.md của kit ghi rõ
"use is limited to Axie Vibeathon and other Sky Mavis-approved programs" — tức muốn SHIP mấy
tệp nướng ra thì dự án phải nằm trong diện được duyệt. Kho này vốn đã ship art cùng nguồn
(16 bảng khung Ragoon, tranh NPC), nên đây không phải tiền lệ mới; nhưng đừng lấy công cụ này
đem sang một dự án khác mà không kiểm lại điều kiện đó.

⚠ KHÔNG tô màu/chỉnh sáng ở đây. Bản nướng giữ nguyên art gốc; phần hạ tông về đêm nằm
trong titleNen() ở game.js — sửa tông không phải nướng lại 10 tệp, và art gốc còn nguyên
thì đợt sau muốn đổi hướng vẫn còn chỗ lui.

Dùng:  python3 tools/title/nuong_nen_axie.py [--kit <đường dẫn kit>] [--rong 1280]
"""
import argparse, os, sys

try:
    from PIL import Image
except ImportError:
    sys.exit('Cần pillow:  pip install pillow')

# tên tệp (không đuôi) -> y trong khung gốc 1024x661; 'b' = kê đáy khung
LOP = [
    ('9_BG',       0),
    ('9_MOUNTAIN', 'b'),
    ('9_CLOUD-3',  40),
    ('9_CLOUD-2',  120),
    ('9_CLOUD-1',  100),
    ('9_ROCK',     'b'),
    ('9_FOG',      250),
    ('9_Ground',   'b'),
    ('9_FRONT-2',  'b'),
    ('9_FRONT-1',  'b'),
]
KHUNG = (1024, 661)          # khổ khung gốc của bộ lớp
KIT = '/home/user/axieinfinity/axie-origins-asset-kit'
NGUON = 'Assets/OriginsKit/PvE/Backgrounds/story/9-rocky-mountain-1'
DICH = 'public/game/assets/title/lunacia'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kit', default=KIT)
    ap.add_argument('--rong', type=int, default=1280, help='bề rộng khung sau khi nướng')
    ap.add_argument('--chatluong', type=int, default=80)
    a = ap.parse_args()

    src = os.path.join(a.kit, NGUON)
    if not os.path.isdir(src):
        sys.exit(f'Không thấy nguồn: {src}\nClone kit trước: git clone --depth 1 '
                 'https://github.com/axieinfinity/axie-origins-asset-kit')
    goc = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    out = os.path.join(goc, DICH)
    os.makedirs(out, exist_ok=True)

    k = a.rong / KHUNG[0]
    tong = 0
    print(f'khung {KHUNG[0]}x{KHUNG[1]} -> {a.rong}x{round(KHUNG[1]*k)}  (x{k:.3f})')
    for ten, y in LOP:
        im = Image.open(os.path.join(src, ten + '.png')).convert('RGBA')
        yy = KHUNG[1] - im.size[1] if y == 'b' else y
        w2, h2 = max(1, round(im.size[0] * k)), max(1, round(im.size[1] * k))
        im = im.resize((w2, h2), Image.LANCZOS)
        # tên tệp đích: bỏ tiền tố "9_", hạ chữ thường — game đọc theo tên ngắn
        tep = ten.split('_', 1)[1].lower().replace('-', '') + '.webp'
        p = os.path.join(out, tep)
        im.save(p, 'WEBP', quality=a.chatluong, method=6)
        n = os.path.getsize(p); tong += n
        print(f'  {tep:12} {w2:5}x{h2:<5} y={yy:<4} {n/1024:7.1f}K')
    # ── Bệ đứng cho màn TẠO NHÂN VẬT ───────────────────────────────────────────────────
    # Năm thẻ lớp phải đứng trên một cái gì đó. Bản cũ dùng `title/san_da.webp` — một dải
    # đá cuội xám ấm vẽ cho cảnh núi đêm; đặt lên nền Lunacia xanh ngọc là hai bức tranh
    # khác hệ màu dán cạnh nhau. Cắt thẳng dải cỏ + vách đá của CHÍNH lớp `9_Ground` thì bệ
    # và nền là một bức, không có cách nào lệch tông.
    # Hàng 58..218 của khổ 351: mép trên là đường cỏ (chỗ gót chân đứng), dưới là vách đá.
    im = Image.open(os.path.join(src, '9_Ground.png')).convert('RGBA').crop((0, 58, 1024, 218))
    im = im.resize((1400, round(160 * 1400 / 1024)), Image.LANCZOS)
    p2 = os.path.join(out, 'san.webp')
    im.save(p2, 'WEBP', quality=a.chatluong, method=6)
    n = os.path.getsize(p2); tong += n
    print(f'  {"san.webp":12} {im.size[0]:5}x{im.size[1]:<5}       {n/1024:7.1f}K')
    print(f'tổng {tong/1024:.1f}K  ->  {out}')
    print('\nBảng cho game.js (NEN_LOP) — y tính theo KHUNG GỐC 1024x661:')
    for ten, y in LOP:
        im = Image.open(os.path.join(src, ten + '.png'))
        yy = KHUNG[1] - im.size[1] if y == 'b' else y
        tep = ten.split('_', 1)[1].lower().replace('-', '')
        print(f"  {{ t:'{tep}', y:{yy}, h:{im.size[1]} }},")


if __name__ == '__main__':
    main()
