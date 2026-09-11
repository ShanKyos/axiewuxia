#!/usr/bin/env python3
"""Chấm CHỖ HÁI THUỐC cho ba map dựng lại còn thiếu — đọc thẳng đa giác đã chốt trong game.

Vì sao tách khỏi vung_bon.py: hình đất của bốn map đã qua đủ bộ kiểm (test_sandat · test_noimap ·
test_bossplace). Chạy lại bộ sinh chỉ để thêm chỗ hái thuốc là dò lại hạt, mà hạt đổi thì đa giác
đổi theo — trả lại toàn bộ phần đã nghiệm thu để lấy tám cái chấm. Nên bài này ĐỌC đa giác đang
có và chỉ chấm thêm, không đụng tới hình.

Vì sao phải thêm: `test_domap` đòi mật độ ≥1,30 điểm nội dung / 1000 ô đi được. Bốn map mới rộng
gấp 3-4 lần bản cũ, nên số ô đi được tăng vọt trong khi số điểm nội dung thì không — đo được
tuyettinh 1,14 · mongco 1,05 · nhanmon 1,05. Rẻo Rừng Corran cùng khổ mà đạt 1,39 vì nó có 12
chỗ hái thuốc; ba map này có 0. Đây đúng là cái đòn bẩy mà Corran đã dùng.

Và nó không chỉ là một con số: chỗ hái thuốc là lý do RỜI ĐƯỜNG MÒN. Map rộng mà mọi thứ đáng
làm đều nằm trên trục chính thì "rộng" đọc ra thành "dài".

Chạy:  python3 tools/iso/thuoc_bon.py
"""
import json, math, re, sys, pathlib

CB = pathlib.Path(__file__).resolve().parents[2] / 'public/game/data/canbang.js'
GJ = pathlib.Path(__file__).resolve().parents[2] / 'public/game/game.js'
SO = {'tuyettinh': 10, 'mongco': 10, 'nhanmon': 10}


def doc_map(src, mid):
    """Đọc w/h · diTrong · spawn · spawnFrom · isoDuong của một map từ canbang.js."""
    i = src.index(f"\n  {mid}: {{ name:")
    j = src.index("\n  ", src.index("duhiep", i))
    kh = src[i:j]
    num = lambda k: int(re.search(rf'\b{k}:\s*(\d+)', kh).group(1))
    dg = [[int(a), int(b)] for a, b in
          re.findall(r'\[(\d+),(\d+)\]', kh[kh.index('diTrong: ['):kh.index('isoCum')])]
    sp = re.search(r'spawn:\{ x:(\d+), y:(\d+) \}', kh)
    toi = [[int(a), int(b)] for a, b in re.findall(r'x:(\d+), y:(\d+) \}', kh)]
    return dict(w=num('w'), h=num('h'), dg=dg, spawn=[int(sp.group(1)), int(sp.group(2))], toi=toi)


def trong(dg, x, y):
    c, j = False, len(dg) - 1
    for i in range(len(dg)):
        xi, yi = dg[i]; xj, yj = dg[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi:
            c = not c
        j = i
    return c


def cach_mep(dg, x, y):
    d = 1e9
    for i in range(len(dg)):
        ax, ay = dg[i]; bx, by = dg[(i + 1) % len(dg)]
        vx, vy = bx - ax, by - ay
        t = max(0, min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy or 1)))
        d = min(d, math.hypot(x - ax - vx * t, y - ay - vy * t))
    return d


def cham(mid, n, md, trum):
    rng = __import__('random').Random(hash(mid) & 0xffff)
    tranh = [md['spawn']] + md['toi'] + trum
    ra = []
    for _ in range(n * 4000):
        if len(ra) >= n:
            break
        x, y = rng.randrange(200, md['w'] - 200), rng.randrange(200, md['h'] - 200)
        if not trong(md['dg'], x, y) or cach_mep(md['dg'], x, y) < 260:
            continue                                   # sát mép thì lọt ra ngoài sàn khi vẽ
        if any(math.dist((x, y), q) < 460 for q in tranh):
            continue                                   # không mọc đè cổng/điểm thả/trùm vùng
        if any(math.dist((x, y), q) < 560 for q in ra):
            continue                                   # rải đều, không dồn một góc
        ra.append([x, y])
    return ra


def main():
    src = CB.read_text()
    gsrc = GJ.read_text()
    out = {}
    for mid, n in SO.items():
        md = doc_map(src, mid)
        kb = src[src.index(f"\n  {mid}: {{ thuve:["):]
        kb = kb[:kb.index("\n  ")] if "\n  " in kb[10:] else kb
        kb = src[src.index(f"\n  {mid}: {{ thuve:["): src.index("},", src.index(f"\n  {mid}: {{ thuve:[")) + 400]
        trum = [[float(a) * md['w'], float(b) * md['h']]
                for a, b in re.findall(r"x:([\d.]+), y:([\d.]+),", kb)]
        ds = cham(mid, n, md, trum)
        if len(ds) < n:
            print(f'✗ {mid}: chỉ chấm được {len(ds)}/{n}', file=sys.stderr); sys.exit(1)
        out[mid] = ds
        print(f'{mid:10s} {len(ds)} chỗ hái thuốc · {len(trum)} trùm vùng tránh', file=sys.stderr)
    print(json.dumps(out))


if __name__ == '__main__':
    main()
