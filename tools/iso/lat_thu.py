#!/usr/bin/env python3
"""Lát thử một map bằng BỘ TILE — bản mẫu để chép sang engine.

⚠ ĐIỀU QUAN TRỌNG NHẤT, VÀ LÀ THỨ LÀM VIỆC NÀY RẺ ĐI HẲN: **KHÔNG ĐỔI HỆ TOẠ ĐỘ CỦA GAME.**
Game vẽ thế giới 1:1 lên canvas, toạ độ thế giới CHÍNH LÀ toạ độ màn hình. "Isometric" ở đây
thuần tuý là chuyện MỸ THUẬT: viên nền là hình thoi 256×128 xếp so le trong đúng cái mặt phẳng
màn hình ấy. Nghĩa là `diTrong`, `MAP_OBSTACLES`, lưới tìm đường, va chạm, `ents.sort` — không
một dòng nào phải sửa. Nếu phải dựng hệ toạ độ ô-lưới riêng rồi đổi qua đổi lại thì việc này
đã hỏng từ trong trứng.

Xếp so le: viên (i,j) có TÂM tại  x = i·256 + (j lẻ ? 128 : 0),  y = j·64.
Bước dọc 64 = nửa chiều cao viên → hàng dưới cài đúng vào khe hàng trên, kín mặt phẳng.

Chia hai lớp, đúng như engine sẽ làm:
  · NỀN + vệt đất → nướng một lần vào canvas ngoài màn hình lúc nạp map. Không xếp lớp theo y.
  · VẬT THỂ (cây, bụi, đá, túm cỏ) → thả vào chính danh sách `ents` đang có, để `ents.sort` ở
    game.js:11098 lo phần xếp lớp. Nhờ vậy người chơi đi ra SAU gốc cây là bị cây che — thứ mà
    tranh nền một tấm không bao giờ làm được.

Chạy:  python3 tools/iso/lat_thu.py <thư mục bộ tile> <ra.png> [tên map]
"""
import json, math, os, random, sys

from PIL import Image

BO   = sys.argv[1] if len(sys.argv) > 1 else '/tmp/iso/bo2'
RA   = sys.argv[2] if len(sys.argv) > 2 else '/tmp/iso/lat.png'
TEN  = sys.argv[3] if len(sys.argv) > 3 else 'loimon'

W_T, H_T = 256, 128


def _nap(bo):
    anh = {}
    for f in sorted(os.listdir(bo)):
        if f.endswith('.png'):
            anh[f[:-4]] = Image.open(os.path.join(bo, f)).convert('RGBA')
    # CHÂN từng sprite, do bộ nướng ghi ra. KHÔNG được đoán là đáy-giữa khung: khung phải nới
    # ra cho vừa cái bóng đổ xiên, nên gốc vật lệch khỏi giữa và lệch khỏi đáy — đoán thì cả
    # rừng đứng lơ lửng hoặc lún xuống đất, mỗi cây lún một kiểu.
    neo = json.load(open(os.path.join(bo, 'neo.json'), encoding='utf-8'))
    return anh, neo


def _trong(poly, x, y):
    """Điểm nằm trong đa giác — cùng thuật toán tia ngang engine đang dùng cho `diTrong`."""
    n = len(poly); c = False
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi:
            c = not c
        j = i
    return c


def _cach_mep(poly, x, y):
    """Khoảng cách tới cạnh gần nhất — dùng để biết chỗ nào là giữa lối, chỗ nào là ven rừng."""
    d = 1e9
    n = len(poly)
    for i in range(n):
        ax, ay = poly[i]; bx, by = poly[(i + 1) % n]
        vx, vy = bx - ax, by - ay
        t = max(0.0, min(1.0, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy + 1e-9)))
        d = min(d, math.hypot(x - ax - vx * t, y - ay - vy * t))
    return d


def _cach_duong(duong, x, y):
    """Khoảng cách tới đường mòn gần nhất. Xem duong_mon() trong tools/iso/vung_rong.py."""
    d = 1e9
    for tuyen in duong:
        for a, b in zip(tuyen, tuyen[1:]):
            vx, vy = b[0]-a[0], b[1]-a[1]
            t = max(0.0, min(1.0, ((x-a[0])*vx + (y-a[1])*vy) / (vx*vx + vy*vy + 1e-9)))
            d = min(d, math.hypot(x - a[0] - vx*t, y - a[1] - vy*t))
    return d


def _hat(x, y, o=0.0):
    """Nhiễu trơn rẻ tiền — chỉ để XÔ LỆCH ranh giới, không cần chất lượng."""
    def n(i, j):
        v = math.sin(i * 127.1 + j * 311.7 + o * 74.7) * 43758.5453
        return v - math.floor(v)
    fx, fy = x - math.floor(x), y - math.floor(y)
    i, j = math.floor(x), math.floor(y)
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
    return ((n(i, j) * (1 - fx) + n(i + 1, j) * fx) * (1 - fy)
            + (n(i, j + 1) * (1 - fx) + n(i + 1, j + 1) * fx) * fy)


def lat(md, anh, neo, ra):
    W, H = md['w'], md['h']
    poly = [tuple(p) for p in md['diTrong']]
    rnd = random.Random(7)
    duong = md.get('isoDuong') or []

    nen = Image.new('RGBA', (W, H), (14, 13, 16, 255))
    co  = [anh[k] for k in ('nen_co1', 'nen_co2', 'nen_co3')]
    dat = [anh[k] for k in ('nen_dat1', 'nen_dat2')]

    # ── lớp 1: nền ──
    for j in range(-1, H // (H_T // 2) + 2):
        for i in range(-1, W // W_T + 2):
            cx = i * W_T + (W_T // 2 if j % 2 else 0)
            cy = j * (H_T // 2)
            d = _cach_mep(poly, cx, cy)
            # ⚠ LÁT RỘNG HƠN `diTrong` MỘT VÀNH. Lát đúng khít đa giác thì mép ngoài là một
            # đường RĂNG CƯA hình thoi lộ trên nền đen — thấy rõ ở góc trên ảnh lát thử. Nới ra
            # 200px thì mép ấy nằm lọt dưới hàng cây, không ai còn thấy.
            if not _trong(poly, cx, cy) and d > 200:
                continue
            # ĐƯỜNG MÒN = dải giữa lối. Không cần vẽ tay đường đi: chỗ nào cách mép xa nhất thì
            # chỗ ấy là chỗ người ta giẫm nhiều nhất. Lấy thẳng từ hình học `diTrong`.
            # Ngưỡng bị nhiễu XÔ ±85px, nếu không ranh giới cỏ/đất chạy đúng theo lưới hình thoi
            # và ra một dãy bậc thang răng cưa — đúng lỗi còn lại trong ảnh lát thử.
            nguong = 190 + (_hat(cx / 460, cy / 460) - 0.5) * 170
            if duong:      # map RỘNG: đất bám theo đường mòn — xem _cach_duong()
                la_dat = _cach_duong(duong, cx, cy) < 150 + (_hat(cx/300, cy/300) - 0.5) * 130
            else:          # map LÀN: đất là dải giữa lối
                la_dat = d > nguong
            t = dat[rnd.randrange(len(dat))] if la_dat else co[rnd.randrange(len(co))]
            nen.alpha_composite(t, (cx - W_T // 2, cy - H_T // 2))

    # ── lớp 1b: vệt đất phá ranh giới cỏ/đường ──
    vet = [anh[k] for k in ('vet_dat1', 'vet_dat2') if k in anh]
    if vet:
        for _ in range(900):
            x = rnd.randrange(W); y = rnd.randrange(H)
            if not _trong(poly, x, y):
                continue
            if duong:
                dd = _cach_duong(duong, x, y)
                if not (110 < dd < 260):
                    continue
            elif not (110 < _cach_mep(poly, x, y) < 285):   # dải ranh giới, chỗ răng cưa lộ ra
                continue
            v = vet[rnd.randrange(len(vet))]
            nen.alpha_composite(v, (x - v.width // 2, y - v.height // 2))

    # ── lớp 2: vật thể, XẾP THEO CHÂN (y) — đúng thứ `ents.sort` trong engine làm ──
    cay = [k for k in sorted(anh) if k.startswith('cay')]
    nho = [k for k in sorted(anh) if k.startswith(('buicay', 'da', 'co1', 'co2'))]
    vat = []
    for v in md.get('vatDat', []):           # cây tác giả đặt tay, men hai mép lối
        vat.append((v['x'], v['y'], cay[rnd.randrange(len(cay))]))
    dt = W * H / 1e6                         # triệu điểm — mật độ rải phải theo KHỔ map
    for _ in range(int(47*dt)):              # rừng dày ngoài lối — chỗ người chơi không vào
        x = rnd.randrange(W); y = rnd.randrange(H)
        if _trong(poly, x, y) or _cach_mep(poly, x, y) > 420:
            continue
        vat.append((x, y, cay[rnd.randrange(len(cay))]))
    # ⚠ RẢI THEO CỤM, ĐỪNG RẢI ĐỀU — và tôi đã đi qua cả hai đầu sai.
    # Rải thưa thì đồng cỏ trơ như thảm; nâng thẳng mật độ lên thì cả map lấm tấm sỏi với bụi
    # đều tăm tắp, đọc ra thành NHIỄU chứ không thành địa hình. Mặt đất thật có mảng dày mảng
    # trống: bụi mọc quanh bụi, sỏi nằm cạnh sỏi, và giữa chúng là khoảng trống để đánh nhau.
    # Nên bốc TÂM CỤM trước, rồi rải quanh tâm.
    for _ in range(int(11*dt)):
        cx, cy = rnd.randrange(W), rnd.randrange(H)
        if not _trong(poly, cx, cy) or _cach_mep(poly, cx, cy) < 90:
            continue
        ban = rnd.uniform(120, 300)
        for _ in range(rnd.randint(3, 9)):
            a = rnd.uniform(0, 6.284); r = rnd.uniform(0, ban)
            x, y = cx + math.cos(a)*r, cy + math.sin(a)*r*0.6
            if not _trong(poly, x, y) or _cach_mep(poly, x, y) < 60:
                continue
            vat.append((x, y, nho[rnd.randrange(len(nho))]))

    vat.sort(key=lambda v: v[1])
    for x, y, k in vat:
        im = anh[k]; nx, ny = neo[k]
        nen.alpha_composite(im, (round(x) - nx, round(y) - ny))

    nen.convert('RGB').save(ra, quality=94)
    print(f'{ra}  {W}×{H}  ·  {len(vat)} vật thể xếp theo y')


def main():
    md = json.load(open('/tmp/iso/md.json', encoding='utf-8'))[TEN]
    anh, neo = _nap(BO)
    lat(md, anh, neo, RA)


if __name__ == '__main__':
    main()
