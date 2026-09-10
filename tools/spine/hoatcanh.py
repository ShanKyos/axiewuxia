#!/usr/bin/env python3
"""Bộ tính hoạt cảnh Spine 4.2 — đủ để NƯỚNG ra khung hình, không phải để chạy trong game.

Vì sao tự viết thay vì dùng runtime chính chủ: runtime Spine đòi giấy phép Spine, mà việc
mình cần chỉ là dựng vài chục khung hình rồi cất thành PNG. Phần khó (ma trận xương, da theo
trọng số, cắt atlas) đã có sẵn ở assemble.py; đây là bản mở rộng thêm trục THỜI GIAN.

Khác assemble.py ở chỗ nào: assemble.py chỉ dựng TƯ THẾ GỐC (setup pose). Tệp này còn tính
được khoá theo thời gian, nên ra được cả chuỗi đi/đánh/niệm.

Có: khoá xương (rotate/translate/scale/shear) với đường cong Bezier, đổi mảnh theo khe, thứ
tự vẽ, biến dạng lưới (deform), ràng buộc IK một và hai xương.
Không có: physics (gói mẫu chỉ dùng cho tóc bay — bỏ đi thì tóc đứng yên, ở cỡ 104 px không
ai thấy), path constraint (gói mẫu không dùng), transform constraint (chỉ lái vũ khí, mà vũ
khí thì nướng thành LỚP RIÊNG nên không cần).

Bốn cái bẫy đã trả giá để biết, đừng đạp lại — xem .claude/skills/spine-nuong/SKILL.md.
"""
import json, glob, math, os
from PIL import Image

# ── đọc gói ────────────────────────────────────────────────────────────────────
def doc_goi(p):
    d  = json.load(open(glob.glob(os.path.join(p, '*.json'))[0], encoding='utf-8'))
    im = Image.open(glob.glob(os.path.join(p, '*.png'))[0]).convert('RGBA')
    R, n = {}, None
    for l in open(glob.glob(os.path.join(p, '*.atlas'))[0], encoding='utf-8'):
        s = l.strip()
        if s.startswith('bounds:'): R[n] = [int(v) for v in s.split(':')[1].split(',')]
        elif s and ':' not in s and not s.endswith('.png'): n = s
    return d, im, R

# ── nội suy khoá ───────────────────────────────────────────────────────────────
def _bez(cx1, cy1, cx2, cy2, t0, v0, t1, v1, t):
    """Bezier của Spine: bốn số là (thời gian, giá trị) của HAI điểm điều khiển, ở toạ độ tuyệt đối."""
    if t1 <= t0: return v0
    # tìm tham số u sao cho x(u) = t, bằng chia đôi — đủ chính xác cho việc nướng khung
    lo, hi = 0.0, 1.0
    for _ in range(24):
        u = (lo + hi) / 2; v = 1 - u
        x = 3*v*v*u*cx1 + 3*v*u*u*cx2 + u*u*u*t1 + v*v*v*t0
        if x < t: lo = u
        else: hi = u
    u = (lo + hi) / 2; v = 1 - u
    return 3*v*v*u*cy1 + 3*v*u*u*cy2 + u*u*u*v1 + v*v*v*v0

def lay(tl, t, truong, mac_dinh=0.0):
    """Giá trị của một dòng thời gian tại thời điểm t. `truong` là 'value' | 'x' | 'y'."""
    if not tl: return mac_dinh
    if t <= tl[0].get('time', 0): return tl[0].get(truong, mac_dinh)
    if t >= tl[-1].get('time', 0): return tl[-1].get(truong, mac_dinh)
    i = 0
    while i + 1 < len(tl) and tl[i+1].get('time', 0) <= t: i += 1
    k0, k1 = tl[i], tl[i+1]
    t0, t1 = k0.get('time', 0), k1.get('time', 0)
    v0, v1 = k0.get(truong, mac_dinh), k1.get(truong, mac_dinh)
    c = k0.get('curve')
    if c == 'stepped': return v0
    if isinstance(c, list):
        # Spine gói mọi thuộc tính của khoá vào MỘT mảng: 4 số cho mỗi thuộc tính, theo thứ tự
        # khai báo (x rồi y với translate/scale/shear; chỉ value với rotate).
        j = 0 if truong in ('value', 'x') else 4
        if len(c) >= j + 4:
            return _bez(c[j], c[j+1], c[j+2], c[j+3], t0, v0, t1, v1, t)
    u = (t - t0) / (t1 - t0) if t1 > t0 else 0
    return v0 + (v1 - v0) * u

# ── tư thế: xương cục bộ → ma trận thế giới ────────────────────────────────────
class TuThe:
    def __init__(s, d):
        s.d = d
        s.bones = d['bones']
        s.ten = [b['name'] for b in s.bones]
        s.chiSo = {n: i for i, n in enumerate(s.ten)}
        s.cha = [s.chiSo[b['parent']] if b.get('parent') else -1 for b in s.bones]
        s.dai = [b.get('length', 0) for b in s.bones]
        s.con = [[] for _ in s.bones]
        for i, p in enumerate(s.cha):
            if p >= 0: s.con[p].append(i)
        s.dat_nghi()
    def dat_nghi(s):
        s.x, s.y, s.rot, s.sx, s.sy, s.shx, s.shy = ([] for _ in range(7))
        for b in s.bones:
            s.x.append(b.get('x', 0)); s.y.append(b.get('y', 0))
            s.rot.append(b.get('rotation', 0))
            s.sx.append(b.get('scaleX', 1)); s.sy.append(b.get('scaleY', 1))
            s.shx.append(b.get('shearX', 0)); s.shy.append(b.get('shearY', 0))
        s.thua = [b.get('transform', 'normal') for b in s.bones]
    def tinh(s):
        """Ma trận thế giới (a,b,c,d,wx,wy) cho từng xương, theo thứ tự khai báo (cha luôn đứng trước)."""
        s.W = [None] * len(s.bones)
        for i in range(len(s.bones)): s.tinh_mot(i)
        return s.W
    def tinh_mot(s, i):
        """Ma trận thế giới của MỘT xương, đọc ma trận cha đang có trong s.W.

        Tách ra khỏi tinh() để ràng buộc physics ghi đè ma trận thế giới của một xương rồi
        dựng lại riêng nhánh con của nó, thay vì tính lại cả bộ 83 xương sau mỗi ràng buộc."""
        r = math.radians(s.rot[i] + s.shx[i]); r2 = math.radians(s.rot[i] + 90 + s.shy[i])
        la = math.cos(r) * s.sx[i];  lc = math.sin(r) * s.sx[i]
        lb = math.cos(r2) * s.sy[i]; ld = math.sin(r2) * s.sy[i]
        p = s.cha[i]
        if p < 0:
            s.W[i] = (la, lb, lc, ld, s.x[i], s.y[i]); return
        pa, pb, pc, pd, px, py = s.W[p]
        wx = pa * s.x[i] + pb * s.y[i] + px
        wy = pc * s.x[i] + pd * s.y[i] + py
        t = s.thua[i]
        if t == 'noRotationOrReflection':
            # giữ hướng của cha nhưng bỏ phần quay: dùng cho tóc/áo không xoay theo thân
            pa, pb, pc, pd = 1, 0, 0, 1
        elif t in ('noScale', 'noScaleOrReflection'):
            n = math.hypot(pa, pc) or 1
            pa, pc = pa / n, pc / n
            n2 = math.hypot(pb, pd) or 1
            pb, pd = pb / n2, pd / n2
        s.W[i] = (pa*la + pb*lc, pa*lb + pb*ld, pc*la + pd*lc, pc*lb + pd*ld, wx, wy)
    def tinh_cay(s, i):
        """Dựng lại ma trận thế giới của TOÀN BỘ nhánh con của xương i (không tính chính nó)."""
        ngan = list(s.con[i])
        while ngan:
            j = ngan.pop()
            s.tinh_mot(j)
            ngan.extend(s.con[j])
    def theoTen(s):
        return {n: s.W[i] for i, n in enumerate(s.ten)}

# ── áp hoạt cảnh lên tư thế ────────────────────────────────────────────────────
def ap_hoat_canh(tt, hc, t):
    """Ghi đè xương cục bộ theo khoá của hoạt cảnh tại thời điểm t."""
    tt.dat_nghi()
    for ten, tl in hc.get('bones', {}).items():
        i = tt.chiSo.get(ten)
        if i is None: continue
        if 'rotate'    in tl: tt.rot[i] += lay(tl['rotate'], t, 'value')
        if 'translate' in tl:
            tt.x[i] += lay(tl['translate'], t, 'x'); tt.y[i] += lay(tl['translate'], t, 'y')
        if 'scale'     in tl:
            tt.sx[i] *= lay(tl['scale'], t, 'x', 1); tt.sy[i] *= lay(tl['scale'], t, 'y', 1)
        if 'shear'     in tl:
            tt.shx[i] += lay(tl['shear'], t, 'x'); tt.shy[i] += lay(tl['shear'], t, 'y')

def mảnh_theo_khe(d, hc, t):
    """Khe nào đang đeo mảnh nào tại thời điểm t (hoạt cảnh có thể đổi bàn tay nắm/xoè)."""
    ra = {s['name']: s.get('attachment') for s in d['slots']}
    for ten, tl in hc.get('slots', {}).items():
        if 'attachment' not in tl: continue
        kf = tl['attachment']
        cur = ra.get(ten)
        for k in kf:
            if k.get('time', 0) <= t + 1e-6: cur = k.get('name')
            else: break
        ra[ten] = cur
    return ra

def thu_tu_ve(d, hc, t):
    """Hoán vị thứ tự khe. Trả về danh sách tên khe theo thứ tự vẽ."""
    ten = [s['name'] for s in d['slots']]
    kf = hc.get('drawOrder')
    if not kf: return ten
    cur = None
    for k in kf:
        if k.get('time', 0) <= t + 1e-6: cur = k
        else: break
    if not cur or not cur.get('offsets'): return ten
    n = len(ten); ra = [None]*n; chua = list(range(n)); dung = set()
    for o in cur['offsets']:
        i = ten.index(o['slot']); moi = i + o['offset']
        ra[moi] = ten[i]; dung.add(i)
    con = [ten[i] for i in range(n) if i not in dung]
    j = 0
    for i in range(n):
        if ra[i] is None: ra[i] = con[j]; j += 1
    return ra

def bien_dang(hc, t, skinName):
    """Độ lệch đỉnh lưới theo thời gian: {(khe, mảnh): [dx,dy,...]}"""
    ra = {}
    # Spine 4.2 dời biến dạng lưới từ khoá `deform` sang `attachments`; gói này dùng cả hai chỗ,
    # đọc thiếu một chỗ là mất vài khung tay áo giữa đòn đánh.
    nguon = {}
    nguon.update(hc.get('deform', {}))
    for sk, khe in hc.get('attachments', {}).items():
        gom = nguon.setdefault(sk, {})
        for tenKhe, mms in khe.items():
            g2 = gom.setdefault(tenKhe, {})
            for tenManh, muc in mms.items():
                if isinstance(muc, dict) and 'deform' in muc: g2[tenManh] = muc['deform']
    for sk, khe in nguon.items():
        if sk != skinName: continue
        for tenKhe, mms in khe.items():
            for tenManh, tl in mms.items():
                if not tl: continue
                if t <= tl[0].get('time', 0): v = tl[0].get('vertices')
                elif t >= tl[-1].get('time', 0): v = tl[-1].get('vertices')
                else:
                    i = 0
                    while i+1 < len(tl) and tl[i+1].get('time', 0) <= t: i += 1
                    k0, k1 = tl[i], tl[i+1]
                    t0, t1 = k0.get('time', 0), k1.get('time', 0)
                    u = (t-t0)/(t1-t0) if t1 > t0 else 0
                    a = k0.get('vertices') or []; b = k1.get('vertices') or []
                    n = max(len(a), len(b))
                    a = a + [0]*(n-len(a)); b = b + [0]*(n-len(b))
                    v = [a[q] + (b[q]-a[q])*u for q in range(n)]
                    o0, o1 = k0.get('offset', 0), k1.get('offset', 0)
                    if o0 or o1: v = [0]*min(o0, o1) + v
                if v: ra[(tenKhe, tenManh)] = (tl[0].get('offset', 0), v)
    return ra

# ── ràng buộc IK ───────────────────────────────────────────────────────────────
# Bộ xương này không có scale/shear trên chuỗi chân (đã kiểm), nên giải thẳng trong hệ THẾ GIỚI
# rồi quy ngược về góc cục bộ. Ngắn hơn hẳn công thức tổng quát của runtime mà cho cùng kết quả.
def _gocThe(W): return math.degrees(math.atan2(W[2], W[0]))
# Khi chuỗi cha có LẬT (định thức âm — hoạt cảnh soi gương nhân vật), góc thế giới của xương là
# góc_cha TRỪ góc cục bộ, không phải cộng. Không xét dấu này thì mọi phép giải IK lệch hẳn đi.
def _dauLat(W): return 1.0 if (W[0]*W[3] - W[1]*W[2]) >= 0 else -1.0

def _dat_goc(tt, i, muon, mix):
    # Vặn xương i sao cho nó trỏ theo góc thế giới `muon`.
    p = tt.cha[i]
    gocCha = _gocThe(tt.W[p]) if p >= 0 else 0.0
    s = _dauLat(tt.W[p]) if p >= 0 else 1.0
    can = s * (muon - gocCha)
    lech = (can - tt.rot[i] + 180) % 360 - 180
    tt.rot[i] += lech * mix

def ik1(tt, tenX, tenDich, mix=1.0):
    i, j = tt.chiSo[tenX], tt.chiSo[tenDich]
    ax, ay = tt.W[i][4], tt.W[i][5]
    tx, ty = tt.W[j][4], tt.W[j][5]
    _dat_goc(tt, i, math.degrees(math.atan2(ty - ay, tx - ax)), mix)

def ik2(tt, tenTren, tenDuoi, tenDich, huong=1, mix=1.0):
    a, b = tt.chiSo[tenTren], tt.chiSo[tenDuoi]
    j = tt.chiSo[tenDich]
    px, py = tt.W[a][4], tt.W[a][5]
    tx, ty = tt.W[j][4], tt.W[j][5]
    l1 = tt.bones[a].get('length', 0); l2 = tt.bones[b].get('length', 0)
    dx, dy = tx - px, ty - py
    dd = math.hypot(dx, dy)
    if dd < 1e-6 or l1 <= 0 or l2 <= 0: return
    dd = min(max(dd, abs(l1 - l2) + 1e-3), l1 + l2 - 1e-3)
    cos = (l1*l1 + dd*dd - l2*l2) / (2*l1*dd)
    cos = min(1.0, max(-1.0, cos))
    # Chiều gập cũng phải soi gương theo dấu lật, không thì đầu gối quay ngược.
    p = tt.cha[a]
    s = _dauLat(tt.W[p]) if p >= 0 else 1.0
    goc = math.atan2(dy, dx) + huong * s * math.acos(cos)
    kx, ky = px + math.cos(goc)*l1, py + math.sin(goc)*l1     # đầu gối
    g1 = math.degrees(goc)
    g2 = math.degrees(math.atan2(ty - ky, tx - kx))
    _dat_goc(tt, a, g1, mix)
    d2 = (s * (g2 - g1) - tt.rot[b] + 180) % 360 - 180
    tt.rot[b] += d2 * mix

def ap_ik(tt, d, hc, t, bo_qua=()):
    """Chạy các ràng buộc IK theo đúng `order`, mỗi lần chạy phải tính lại ma trận thế giới."""
    rb = sorted(d.get('ik', []), key=lambda c: c.get('order', 0))
    for c in rb:
        if c['name'] in bo_qua: continue
        tl = hc.get('ik', {}).get(c['name'])
        mix = c.get('mix', 1)
        huong = 1 if c.get('bendPositive', True) else -1
        if tl:
            mix = lay(tl, t, 'mix', mix)
            # bendPositive là cờ ĐÚNG/SAI, không nội suy được — lấy theo khoá gần nhất phía trước.
            kf = tl[0]
            for k in tl:
                if k.get('time', 0) <= t + 1e-6: kf = k
                else: break
            if 'bendPositive' in kf: huong = 1 if kf['bendPositive'] else -1
        if mix <= 0: continue
        tt.tinh()
        if len(c['bones']) == 2: ik2(tt, c['bones'][0], c['bones'][1], c['target'], huong, mix)
        else:                    ik1(tt, c['bones'][0], c['target'], mix)
    tt.tinh()

# ── ràng buộc VẬT LÝ (physics) ─────────────────────────────────────────────────
# VÌ SAO PHẢI CÓ. Gói Spellcaster có 28 ràng buộc physics, và chúng KHÔNG chỉ lái tóc bay:
#     6  trên chuỗi đầu   (头2..头7)
#     14 trên váy         (控制短裙的* · 控制长裙的*)
#     8  trên tóc sau     (背后头发*)
# Bỏ qua chúng thì thân và chân cử động theo khoá + IK, còn chỏm đầu và cả cái váy thì đứng
# cứng như nhựa. Mắt đọc ra ngay: nửa người dưới đang bước mà nửa trên không hưởng ứng — đúng
# cái "người không phải một thể thống nhất". Đây là hiệu ứng theo sau (follow-through), thứ
# gắn các mảnh rời thành một cơ thể.
#
# Chép đúng thuật toán của Spine 4.2 (PhysicsConstraint.update, nhánh `update`), gồm cả:
#   · quán tính: chênh lệch vị trí thế giới của xương giữa hai bước, nhân `inertia`
#   · lò xo giảm chấn chạy ở BƯỚC CỐ ĐỊNH `step` (mặc định 1/60 giây), không theo khung hình
#   · `damping` luỹ thừa 60×step, để giảm chấn không đổi khi đổi bước
#   · tx/ty giữ lại từ bước trước (l×a, l×c) — thiếu nó thì góc mục tiêu lệch
#
# ⚠ CÓ TRẠNG THÁI THEO THỜI GIAN. Không lấy mẫu ngẫu nhiên từng khung được: phải chạy tuần tự
# từ đầu. Với hoạt cảnh lặp thì quay vài vòng cho lò xo lắng rồi mới nướng vòng cuối — xem
# `nuong_vong_lap`, nếu không khung 0 sẽ đứng yên còn khung cuối đang đung đưa, và chỗ nối
# vòng lặp giật một cái.
_PI2 = math.pi * 2

class VatLy:
    """Một ràng buộc physics, giữ nguyên trạng thái lò xo giữa các bước thời gian."""
    def __init__(s, c, tt):
        s.ten  = c['name']
        s.i    = tt.chiSo.get(c['bone'], -1)
        s.thu  = c.get('order', 0)
        s.gx   = c.get('x', 0);      s.gy    = c.get('y', 0)
        s.gr   = c.get('rotate', 0); s.gsx   = c.get('scaleX', 0); s.gshx = c.get('shearX', 0)
        s.gioi = c.get('limit', 5000)
        s.buoc = 1.0 / c.get('fps', 60)
        s.qt   = c.get('inertia', 1)
        s.manh = c.get('strength', 100)
        s.tat  = c.get('damping', 1)
        s.mNgh = 1.0 / c.get('mass', 1)
        s.gio  = c.get('wind', 0);   s.trlc  = c.get('gravity', 0)
        s.tron = c.get('mix', 1)
        s.dat_lai()
    def dat_lai(s):
        s.con_lai = 0.0; s.moi = True
        s.ux = s.uy = s.cx = s.cy = s.tx = s.ty = 0.0
        s.xL = s.xV = s.yL = s.yV = 0.0
        s.rL = s.rV = s.sL = s.sV = 0.0

    def cap_nhat(s, tt, dt, quy_chieu=100.0):
        if s.i < 0 or s.tron == 0: return
        co_x  = s.gx > 0; co_y = s.gy > 0
        co_qu = s.gr > 0 or s.gshx > 0
        co_ti = s.gsx > 0
        l = tt.dai[s.i]
        a_, b_, c_, d_, wx, wy = tt.W[s.i]

        # Spine tính `delta = skeleton.time - lastTime`. Ở đây nhận thẳng `dt` thay vì mốc
        # thời gian tuyệt đối: cộng dồn `thoi += dai/n` qua vài trăm khung thì số thực trôi,
        # bộ đếm dư `con_lai` vượt ngưỡng lệch nhịp và chèn thêm một bước 1/60 giây — đo được
        # là chu kỳ giới hạn nhảy 0,9° sau khoảng 25 vòng, tức bảng khung nướng ra lệch tuỳ
        # vào việc lắng bao lâu. Nhận dt hằng số thì không có chỗ nào để trôi.
        dt = max(dt, 0.0)
        s.con_lai += dt
        if s.moi:
            s.moi = False; s.ux = wx; s.uy = wy
        else:
            a = s.con_lai; qt = s.qt; t = s.buoc; f = quy_chieu; giam = None
            q = s.gioi * dt
            if co_x or co_y:
                if co_x:
                    u = (s.ux - wx) * qt; s.xL += min(q, max(-q, u)); s.ux = wx
                if co_y:
                    u = (s.uy - wy) * qt; s.yL += min(q, max(-q, u)); s.uy = wy
                if a >= t:
                    giam = s.tat ** (60 * t)
                    m = s.mNgh * t; e = s.manh; w = s.gio * f; g = s.trlc * f
                    while a >= t:
                        if co_x:
                            s.xV += (w - s.xL * e) * m; s.xL += s.xV * t; s.xV *= giam
                        if co_y:
                            s.yV -= (g + s.yL * e) * m; s.yL += s.yV * t; s.yV *= giam
                        a -= t
                if co_x: wx += s.xL * s.tron * s.gx
                if co_y: wy += s.yL * s.tron * s.gy
            if co_qu or co_ti:
                ca = math.atan2(c_, a_)
                dx = min(q, max(-q, s.cx - wx))
                dy = min(q, max(-q, s.cy - wy))
                mr = 0.0
                if co_qu:
                    mr = (s.gr + s.gshx) * s.tron
                    r = math.atan2(dy + s.ty, dx + s.tx) - ca - s.rL * mr
                    s.rL += (r - math.ceil(r / _PI2 - 0.5) * _PI2) * qt
                    r = s.rL * mr + ca
                    co = math.cos(r); si = math.sin(r)
                    if co_ti:
                        rr = l * math.hypot(a_, c_)
                        if rr > 0: s.sL += (dx * co + dy * si) * qt / rr
                else:
                    co = math.cos(ca); si = math.sin(ca)
                    rr = l * math.hypot(a_, c_)
                    if rr > 0: s.sL += (dx * co + dy * si) * qt / rr
                a = s.con_lai
                if a >= t:
                    if giam is None: giam = s.tat ** (60 * t)
                    m = s.mNgh * t; e = s.manh; w = s.gio; g = s.trlc; h = l / f
                    while True:
                        a -= t
                        if co_ti:
                            s.sV += (w * co - g * si - s.sL * e) * m
                            s.sL += s.sV * t; s.sV *= giam
                        if co_qu:
                            s.rV -= ((w * si + g * co) * h + s.rL * e) * m
                            s.rL += s.rV * t; s.rV *= giam
                            if a < t: break
                            r = s.rL * mr + ca
                            co = math.cos(r); si = math.sin(r)
                        elif a < t:
                            break
                s.con_lai = a
        s.cx = wx; s.cy = wy

        # ── ghi kết quả vào ma trận thế giới ──
        if co_qu:
            o = s.rL * s.tron
            if s.gshx > 0:
                r = 0.0
                if s.gr > 0:
                    r = o * s.gr
                    si = math.sin(r); co = math.cos(r)
                    t0 = b_; b_ = co * t0 - si * d_; d_ = si * t0 + co * d_
                r += o * s.gshx
                si = math.sin(r); co = math.cos(r)
                t0 = a_; a_ = co * t0 - si * c_; c_ = si * t0 + co * c_
            else:
                o *= s.gr
                si = math.sin(o); co = math.cos(o)
                t0 = a_; a_ = co * t0 - si * c_; c_ = si * t0 + co * c_
                t0 = b_; b_ = co * t0 - si * d_; d_ = si * t0 + co * d_
        if co_ti:
            k = 1 + s.sL * s.tron * s.gsx
            a_ *= k; c_ *= k
        s.tx = l * a_; s.ty = l * c_
        tt.W[s.i] = (a_, b_, c_, d_, wx, wy)
        tt.tinh_cay(s.i)

def bo_vat_ly(d, tt):
    """Dựng danh sách ràng buộc physics, đã xếp theo `order` — trả về [] nếu gói không có."""
    return [VatLy(c, tt) for c in sorted(d.get('physics', []), key=lambda c: c.get('order', 0))]

def ap_vat_ly(bo, tt, dt, quy_chieu=100.0):
    """Chạy cả bộ ràng buộc physics, `dt` là thời gian trôi qua từ lượt gọi trước (giây)."""
    for c in bo: c.cap_nhat(tt, dt, quy_chieu)

def lang_vat_ly(bo, tt, d, hc, dai, n_khung, toi_da=60, eps=1e-6):
    """Quay một hoạt cảnh LẶP tới khi lò xo physics vào trạng thái ổn định.

    Nướng vòng đầu tiên là sai: lúc t=0 mọi lò xo đứng yên, nên khung 0 có váy cứng đờ còn
    khung cuối váy đang bay — chỗ nối vòng lặp giật một cái, và cái giật đó lặp lại mãi.
    Quay trước vài vòng thì trạng thái đầu vòng và cuối vòng trùng nhau, bảng khung khép kín.

    Dừng khi trạng thái đầu vòng gần như không đổi so với vòng trước (chuẩn vô cùng < `eps`),
    chứ không quay đủ một số vòng cố định: chuỗi váy dài lắng chậm hơn chuỗi tóc nhiều.
    ⚠ `n_khung` PHẢI đúng bằng số khung lượt nướng sẽ lấy. Lò xo chạy ở bước cố định 1/60
    giây với một bộ đếm dư, nên lấy mẫu 40 khung/giây thì mỗi khung ăn 1 rồi 2 bước xen kẽ,
    còn 60 khung/giây thì đều 1 bước. Hai nhịp khác nhau ra hai chu kỳ giới hạn khác nhau:
    lắng ở nhịp này rồi nướng ở nhịp kia thì chỗ nối vòng lặp vẫn lệch (đo được 1,07°)."""
    if not bo: return
    n = max(1, int(n_khung))
    buoc = dai / n
    truoc = None
    for _ in range(toi_da):
        for k in range(n):
            u = k * buoc
            ap_hoat_canh(tt, hc, u); tt.tinh(); ap_ik(tt, d, hc, u)
            ap_vat_ly(bo, tt, buoc)
        nay = [v for c in bo for v in (c.rL, c.rV, c.xL, c.yL)]
        if truoc is not None and max(abs(a - b) for a, b in zip(nay, truoc)) < eps:
            break
        truoc = nay

# ── dựng hình ──────────────────────────────────────────────────────────────────
import numpy as np

def _mesh_the_gioi(att, tt, tenXuongKhe, lech=None):
    """Toạ độ thế giới của từng đỉnh lưới (kèm biến dạng nếu có)."""
    v = list(att['vertices']); uv = att['uvs']
    Wn = tt.theoTen()
    if lech:
        off, dv = lech
        for q in range(len(dv)):
            if off + q < len(v): v[off + q] += dv[q]
    if len(v) == len(uv):                     # lưới KHÔNG trọng số: hệ của xương gắn khe
        a, b, c, dd, tx, ty = Wn[tenXuongKhe]
        return [(v[i]*a + v[i+1]*b + tx, v[i]*c + v[i+1]*dd + ty) for i in range(0, len(v), 2)]
    ten = tt.ten; pts = []; i = 0
    while i < len(v):
        n = int(v[i]); i += 1; wx = wy = 0.0
        for _ in range(n):
            bi = int(v[i]); vx = v[i+1]; vy = v[i+2]; w = v[i+3]; i += 4
            a, b, c, dd, tx, ty = tt.W[bi]
            wx += (vx*a + vy*b + tx) * w; wy += (vx*c + vy*dd + ty) * w
        pts.append((wx, wy))
    return pts

def _tam_giac(dst, src, P, Q, tris):
    """Vẽ lưới tam giác: P = đỉnh đích (px ảnh), Q = đỉnh nguồn (px atlas)."""
    H, W = dst.shape[:2]; sh, sw = src.shape[:2]
    for k in range(0, len(tris), 3):
        i0, i1, i2 = tris[k], tris[k+1], tris[k+2]
        x0, y0 = P[i0]; x1, y1 = P[i1]; x2, y2 = P[i2]
        mnx = max(int(math.floor(min(x0, x1, x2))), 0); mxx = min(int(math.ceil(max(x0, x1, x2))) + 1, W)
        mny = max(int(math.floor(min(y0, y1, y2))), 0); mxy = min(int(math.ceil(max(y0, y1, y2))) + 1, H)
        if mnx >= mxx or mny >= mxy: continue
        det = (y1-y2)*(x0-x2) + (x2-x1)*(y0-y2)
        if abs(det) < 1e-9: continue
        yy, xx = np.mgrid[mny:mxy, mnx:mxx]
        xx = xx + 0.5; yy = yy + 0.5
        l0 = ((y1-y2)*(xx-x2) + (x2-x1)*(yy-y2)) / det
        l1 = ((y2-y0)*(xx-x2) + (x0-x2)*(yy-y2)) / det
        l2 = 1 - l0 - l1
        m = (l0 >= -1e-4) & (l1 >= -1e-4) & (l2 >= -1e-4)
        if not m.any(): continue
        u0, v0 = Q[i0]; u1, v1 = Q[i1]; u2, v2 = Q[i2]
        su = l0*u0 + l1*u1 + l2*u2
        sv = l0*v0 + l1*v1 + l2*v2
        si = np.clip(np.rint(su).astype(int), 0, sw-1)
        sj = np.clip(np.rint(sv).astype(int), 0, sh-1)
        lay_ = src[sj, si]
        a = (lay_[..., 3:4].astype(np.float32) / 255.0) * m[..., None]
        khung = dst[mny:mxy, mnx:mxx].astype(np.float32)
        dst[mny:mxy, mnx:mxx] = (khung*(1-a) + lay_[..., :4].astype(np.float32)*a).astype(np.uint8)

def ve_khung(d, im, R, tt, hc, t, skinName, W=900, H=1100, phong=1.0, ox=0.5, oy=0.94,
             bo_khe=(), doi_manh=None, bo_vl=None, dt_vl=None):
    """`doi_manh` — ép một KHE dùng mảnh khác mảnh hoạt cảnh chọn, dạng {tên khe: tên mảnh}.

    Dùng để đổi KHUÔN MẶT: khe đầu có sẵn bốn mảnh (thường · vui · đau đớn · nhắm mắt) ở
    mọi skin, mà hoạt cảnh nào cũng chỉ trỏ vào mảnh thường. Nướng khối 'trúng đòn' thì
    ép sang mặt đau, khối 'chết' và 'ngồi' thì ép sang nhắm mắt — không tốn khung nào.
    """
    ap_hoat_canh(tt, hc, t); tt.tinh(); ap_ik(tt, d, hc, t)
    # physics chạy SAU cùng, đúng thứ tự của Spine: khoá → IK → vật lý. `dt_vl` là khoảng
    # thời gian giữa hai khung nướng, KHÔNG phải `t` (vị trí trong vòng lặp hoạt cảnh).
    if bo_vl and dt_vl: ap_vat_ly(bo_vl, tt, dt_vl)
    manh   = mảnh_theo_khe(d, hc, t)
    if doi_manh:
        for _k, _v in doi_manh.items():
            if _k in manh: manh[_k] = _v
    thutu  = thu_tu_ve(d, hc, t)
    bd     = bien_dang(hc, t, skinName)
    skins  = {s['name']: s['attachments'] for s in d['skins']}
    khe2x  = {s['name']: s['bone'] for s in d['slots']}
    atlas  = np.asarray(im)
    dst    = np.zeros((H, W, 4), np.uint8)
    for tenKhe in thutu:
        if tenKhe in bo_khe: continue
        nm = manh.get(tenKhe)
        if not nm: continue
        att = None
        for s in (skinName, 'default'):
            a = skins.get(s, {}).get(tenKhe, {}).get(nm)
            if a: att = a; break
        if not att: continue
        vung = att.get('path', nm)
        if vung not in R: continue
        rx, ry, rw, rh = R[vung]
        loai = att.get('type', 'region')
        aw, ah = im.size
        if loai == 'linkedmesh':
            # Lưới NỐI: mượn đỉnh, tam giác và UV của lưới mẹ, chỉ thay vùng ảnh. UV của mẹ trỏ
            # vào ô atlas của MẸ, nên phải dời sang ô của mình — không thì lấy nhầm hình khác.
            me = None
            for s in (att.get('skin') or skinName, skinName, 'default'):
                for kh, mm in skins.get(s, {}).items():
                    if att['parent'] in mm: me = mm[att['parent']]; break
                if me: break
            if not me: continue
            pts = _mesh_the_gioi(me, tt, khe2x[tenKhe], bd.get((tenKhe, nm)))
            uv = me['uvs']
            Q = [(rx + uv[i]*rw, ry + uv[i+1]*rh) for i in range(0, len(uv), 2)]
            tris = me.get('triangles') or [0, 1, 2, 2, 3, 0]
        elif loai == 'region':
            # Mảnh chữ nhật: dựng bốn góc trong hệ xương của khe rồi đưa ra thế giới.
            ax = att.get('x', 0); ay = att.get('y', 0)
            aw_ = att.get('width', rw); ah_ = att.get('height', rh)
            ar = math.radians(att.get('rotation', 0))
            asx = att.get('scaleX', 1); asy = att.get('scaleY', 1)
            hw, hh = aw_/2*asx, ah_/2*asy
            ca, sa = math.cos(ar), math.sin(ar)
            goc = [(-hw, -hh), (-hw, hh), (hw, hh), (hw, -hh)]
            loc_ = [(ax + gx*ca - gy*sa, ay + gx*sa + gy*ca) for gx, gy in goc]
            a, b, c, dd, tx, ty = tt.theoTen()[khe2x[tenKhe]]
            pts = [(x*a + y*b + tx, x*c + y*dd + ty) for x, y in loc_]
            Q = [(rx, ry+rh), (rx, ry), (rx+rw, ry), (rx+rw, ry+rh)]
            tris = [0, 1, 2, 2, 3, 0]
        else:
            # uvs của Spine nằm trong hệ 0–1 của RIÊNG ô atlas, không phải của cả trang.
            pts = _mesh_the_gioi(att, tt, khe2x[tenKhe], bd.get((tenKhe, nm)))
            uv = att['uvs']
            Q = [(rx + uv[i]*rw, ry + uv[i+1]*rh) for i in range(0, len(uv), 2)]
            tris = att.get('triangles') or [0, 1, 2, 2, 3, 0]
        P = [(x*phong + W*ox, H*oy - y*phong) for x, y in pts]
        _tam_giac(dst, atlas, P, Q, tris)
    return Image.fromarray(dst, 'RGBA')
