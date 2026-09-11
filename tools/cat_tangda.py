#!/usr/bin/env python3
"""Cắt VẬT THỂ cắt-sẵn của kho Axie thành sprite decor → public/game/assets/trees/

    python3 tools/cat_tangda.py [--kit <đường-kit>]

⚠ CHỈ lấy lớp thật sự là VẬT THỂ (alpha trong suốt ≥15%). Lớp `*_Ground.png` và mấy dải gần
đặc (`8_TEMPLE` 9%, `6_WATER` 7%) KHÔNG phải vật thể — lát nền bằng chúng đã thử ba lần và
hỏng cả ba (xem CLAUDE.md, mục map isometric).

Vì sao đáng làm: `raiTruDa()` đời trước dựng địa hình cỡ trận đánh bằng cách PHÓNG TO sprite
đá trang trí lên ~3 lần, ra khối hộp bẹt viền cứng, và đã phải gỡ. Bốn tảng dưới đây là tranh
gốc 1024px — vẽ ra 110px là THU XUỐNG, không kéo giãn.
"""
import os, sys, argparse
from PIL import Image

RONG = 220          # bề rộng sprite đích. Trong màn vẽ ra ~96-150px nên đây vẫn là thu xuống.
TOI_THIEU = 0.15    # dưới ngần này trong suốt thì không phải vật thể — bỏ, đừng đoán

# ⚠ ĐÃ LỌC THEO TỈ LỆ, không chỉ theo độ trong suốt. `7_ROCK` và `8_ROCK` trong suốt 81-82%
# nhưng hộp bao của chúng là 1024x230 (tỉ lệ 4,5:1) — đó là DẢI đá viền mép sân khấu, không
# phải một tảng. Đem rải vào map thì ra mấy vệt kẻ ngang. Bốn cái dưới đây tỉ lệ 0,87-2,32.
BO = [
    ('tang1', 'story/9-rocky-mountain-1/9_ROCK.png'),      # 1024x603 · tỉ lệ 1,70 — tảng chính
    ('tang2', 'story/10-rocky-mountain-2/10_ROCK.png'),    # 1024x441 · tỉ lệ 2,32 — tảng bè
    ('tang3', 'events/arena/layers/13_STATUE.png'),        # 1024x530 · tỉ lệ 1,93 — tượng đá
    ('tang4', 'story/10-rocky-mountain-2/10_TREE2.png'),   # 894x1024 · tỉ lệ 0,87 — cây cao
]
TRAN_TI_LE = 2.6    # rộng/cao vượt ngần này thì là DẢI, không phải vật thể


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kit', default='/home/user/axieinfinity/axie-origins-asset-kit')
    a = ap.parse_args()
    goc = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    src = os.path.join(a.kit, 'Assets/OriginsKit/PvE/Backgrounds')
    ra  = os.path.join(goc, 'public/game/assets/trees')
    os.makedirs(ra, exist_ok=True)

    for ten, duong in BO:
        f = os.path.join(src, duong)
        if not os.path.exists(f): sys.exit('thiếu ' + f)
        im = Image.open(f).convert('RGBA')
        al = im.getchannel('A')
        import numpy as np
        tr = float((np.asarray(al) < 10).mean())
        if tr < TOI_THIEU:
            print('  BỎ %-7s trong suốt %.0f%% — không phải vật thể' % (ten, tr*100)); continue
        im = im.crop(al.getbbox())
        if im.width / max(1, im.height) > TRAN_TI_LE:
            print('  BỎ %-7s tỉ lệ %.2f — là DẢI viền mép, không phải tảng'
                  % (ten, im.width / im.height)); continue
        k = RONG / im.width
        im = im.resize((RONG, max(1, round(im.height * k))), Image.LANCZOS)
        p = os.path.join(ra, ten + '.png')
        im.save(p, 'PNG', optimize=True)
        print('  %-7s ← %-34s %4dx%-4d · %.0f KB'
              % (ten, os.path.basename(duong), im.width, im.height, os.path.getsize(p)/1024))


if __name__ == '__main__': main()
