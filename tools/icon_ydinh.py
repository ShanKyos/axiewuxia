#!/usr/bin/env python3
"""Cắt icon Ý ĐỊNH của kho Axie thành MỘT dải ngang → public/game/assets/ui/ydinh.webp

    python3 tools/icon_ydinh.py [--kit <đường-kit>]

Vì sao là một DẢI chứ không 7 tệp rời: cùng lý do `lop.webp` đã làm — bảy tệp là bảy lượt xin
mạng cho một thứ hiện ở mọi khung hình, và bảy lần "chưa tải xong" khác nhau.

Icon gốc cao thấp khác nhau (23x40 tới 132x72). Dải này chuẩn hoá về ô vuông Ô px, thu VỪA
TRONG ô theo cạnh dài rồi đặt vào giữa — giữ đúng tỉ lệ gốc, không kéo méo.
"""
import os, sys, argparse
from PIL import Image

O = 64                      # cạnh ô trong dải. Trên màn icon vẽ ra ~14px; nướng 64 để còn
                            # sắc nét khi người chơi zoom GẦN (1,75×) và trên màn HiDPI.
LE = 2                      # chừa mép cho khỏi cụt viền lúc thu

# Thứ tự này LÀ thứ tự trong dải — game.js đọc theo chỉ số, đổi ở đây phải đổi cả hai chỗ.
DAI = [
    ('nang', 'StrongAttack'),      # Trọng Giáp — đòn nặng
    ('phap', 'AttackRanged'),      # Pháp Sư — đánh xa
    ('can',  'AttackMelee'),       # Cận Chiến
    ('xa',   'AttackRanged'),      # Xạ Thủ — cùng hình với Pháp Sư, khác MÀU viền (game.js tô)
    ('bay',  'WeakAttack'),        # Bầy Đàn — lẻ thì yếu, đông thì chết
    ('tiep', 'DefendAndBuff'),     # Kẻ Tiếp Sức — thứ phải giết trước
    ('nguy', 'DangerousAction'),   # trùm đang lấy đà — cái DUY NHẤT là ý định THẬT
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kit', default='/home/user/axieinfinity/axie-origins-asset-kit')
    a = ap.parse_args()
    goc = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    src = os.path.join(a.kit, 'Assets/OriginsKit/PvE/Intents')
    ra  = os.path.join(goc, 'public/game/assets/ui/ydinh.webp')

    dai = Image.new('RGBA', (O * len(DAI), O))
    for i, (khoa, ten) in enumerate(DAI):
        f = os.path.join(src, ten + '.png')
        if not os.path.exists(f): sys.exit('thiếu ' + f)
        im = Image.open(f).convert('RGBA')
        bb = im.getchannel('A').getbbox() or (0, 0, im.width, im.height)
        im = im.crop(bb)                                  # cắt sát mực, đừng tin lề của tệp
        k = (O - LE * 2) / max(im.width, im.height)
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        dai.paste(im, (i * O + (O - im.width) // 2, (O - im.height) // 2), im)
        print('  %-5s ← %-18s %3dx%-3d → %dx%d' % (khoa, ten, bb[2]-bb[0], bb[3]-bb[1], im.width, im.height))
    os.makedirs(os.path.dirname(ra), exist_ok=True)
    dai.save(ra, 'WEBP', quality=92, method=6)
    print('%s · %d ô · %.1f KB' % (ra, len(DAI), os.path.getsize(ra) / 1024))
    print("game.js: YDINH_DAI = ['" + "','".join(k for k, _ in DAI) + "'] · YDINH_O = %d" % O)


if __name__ == '__main__': main()
