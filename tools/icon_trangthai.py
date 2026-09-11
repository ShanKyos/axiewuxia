#!/usr/bin/env python3
"""Cắt icon TRẠNG THÁI của kho Axie thành MỘT dải ngang → public/game/assets/ui/trangthai.webp

    python3 tools/icon_trangthai.py [--kit <đường-kit>]

Kho có 131 icon; dải này chỉ lấy đúng những trạng thái GAME THẬT SỰ ĐANG CHẠY. Thêm icon cho
một trạng thái không tồn tại là bày ra một lời hứa rỗng — cùng lỗi đã mắc ở chỗ khác.

Thứ tự dưới đây LÀ thứ tự trong dải; `TRANG_THAI` trong game.js phải trùng khít.
"""
import os, sys, argparse
from PIL import Image

O = 64
LE = 2

DAI = [
    ('cong',   'buff_dmg_boost'),         # Rượu Hổ Cốt — buffAtkT
    ('setchan','buff_bulwark'),           # Bùa Chắn Sét — loidonT
    ('doc',    'debuff_poison'),          # trúng độc — poisonT
    ('covat',  'buff_power_awaken'),      # buff của Cổ Vật đang khoác — chiTam
    ('st',     'buff_rage'),              # +% sát thương — vhDmgT
    ('ne',     'buff_stealth'),           # +% né — vhEvaT
    ('tocdanh','buff_feather'),           # +% tốc đánh — vhAspdT
    ('bao',    'buff_cunning'),           # bạo kích chắc chắn — vhCritT
    ('hut',    'buff_vengeance'),         # hút sinh lực — vhLeechT
    ('phan',   'buff_bloodspike'),        # phản đòn — vhReflT
    ('khien',  'buff_shield_boost'),      # khiên — vhShield
    ('trong',  'debuff_grievous_wound'),  # Trọng Thương — tenuiTT
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kit', default='/home/user/axieinfinity/axie-origins-asset-kit')
    a = ap.parse_args()
    goc = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    src = os.path.join(a.kit, 'Assets/OriginsKit/Textures/StatusIcons')
    ra  = os.path.join(goc, 'public/game/assets/ui/trangthai.webp')

    dai = Image.new('RGBA', (O * len(DAI), O))
    for i, (khoa, ten) in enumerate(DAI):
        f = os.path.join(src, ten + '.png')
        if not os.path.exists(f): sys.exit('thiếu ' + f)
        im = Image.open(f).convert('RGBA')
        bb = im.getchannel('A').getbbox() or (0, 0, im.width, im.height)
        im = im.crop(bb)
        k = (O - LE * 2) / max(im.width, im.height)
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        dai.paste(im, (i * O + (O - im.width) // 2, (O - im.height) // 2), im)
        print('  %-8s ← %-24s %3dx%-3d' % (khoa, ten, bb[2]-bb[0], bb[3]-bb[1]))
    os.makedirs(os.path.dirname(ra), exist_ok=True)
    dai.save(ra, 'WEBP', quality=92, method=6)
    print('%s · %d ô · %.1f KB' % (ra, len(DAI), os.path.getsize(ra) / 1024))
    print("game.js: thứ tự = " + ' '.join(k for k, _ in DAI))


if __name__ == '__main__': main()
