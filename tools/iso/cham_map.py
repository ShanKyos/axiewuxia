"""Chấm điểm một bộ (đa giác, lùm) bằng ĐÚNG công thức lưới tìm đường của game."""
import math
import numpy as np
from collections import deque

NAV = 24
BK = 16          # bán kính hỏi vật cản, khớp navEnsure()

def _vc_mask(W, H, vatcan, cum, dg):
    gw, gh = math.ceil(W/NAV), math.ceil(H/NAV)
    xs = (np.arange(gw)*NAV + NAV/2)
    ys = (np.arange(gh)*NAV + NAV/2)
    X, Y = np.meshgrid(xs, ys)
    m = ~trong_dg_mask(dg, X, Y)                       # ngoài đa giác = chặn
    for o in vatcan:
        if o.get('hop'):
            cx = np.clip(X, o['x'], o['x']+o['wd']); cy = np.clip(Y, o['y'], o['y']+o['ht'])
            m |= ((X-cx)**2 + (Y-cy)**2) < BK*BK
        else:
            dx = (X-o['x'])/(o['rx']+BK); dy = (Y-o['y'])/(o['ry']+BK)
            m |= (dx*dx + dy*dy) < 1
    for cx0, cy0 in cum:
        dx = (X-cx0)/(150+BK); dy = (Y-cy0)/(88+BK)
        m |= (dx*dx + dy*dy) < 1
    return m

def trong_dg_mask(dg, X, Y):
    c = np.zeros(X.shape, bool)
    n = len(dg); j = n-1
    for i in range(n):
        xi, yi = dg[i]; xj, yj = dg[j]
        cond = ((yi > Y) != (yj > Y)) & (X < (xj-xi)*(Y-yi)/(yj-yi+1e-9) + xi)
        c ^= cond
        j = i
    return c

def _dich(a, dy, dx):
    """Dời cả mảng đi (dy,dx) ô, chỗ trống điền False — thay cho vòng lặp từng ô."""
    r = np.zeros_like(a)
    ys = slice(max(dy,0), a.shape[0]+min(dy,0)); yn = slice(max(-dy,0), a.shape[0]-max(dy,0))
    xs = slice(max(dx,0), a.shape[1]+min(dx,0)); xn = slice(max(-dx,0), a.shape[1]-max(dx,0))
    r[ys, xs] = a[yn, xn]
    return r


def _bfs(m, s):
    """Loang theo SÓNG trên cả mảng, không phải theo hàng đợi từng ô.

    Cùng một phép loang 8 hướng với luật "không lách chéo qua khe" của navPath (chéo chỉ đi
    được khi cả hai ô vuông kề đều trống), nhưng mỗi bước là vài phép dịch mảng của numpy
    thay vì vài vạn vòng lặp Python. Đo trên lưới 108x79: 5s một lượt chấm xuống còn 0,2s —
    đủ để vung_map.py chấm sau MỖI lần nở và MỖI lùm thử, thay vì phải đoán tham số.
    """
    free = ~m
    d = np.full(m.shape, -1, np.int32)
    front = np.zeros(m.shape, bool); front[s] = True
    d[s] = 0
    b = 0
    while front.any():
        b += 1
        moi = np.zeros(m.shape, bool)
        for dy, dx in ((1,0), (-1,0), (0,1), (0,-1)):
            moi |= _dich(front, dy, dx)
        for dy, dx in ((1,1), (1,-1), (-1,1), (-1,-1)):
            # chéo: cần cả ô ngang lẫn ô dọc của Ô NGUỒN trống, đúng như navPath
            hop = front & _dich(free, -dy, 0) & _dich(free, 0, -dx)
            moi |= _dich(hop, dy, dx)
        moi &= free & (d < 0)
        d[moi] = b
        front = moi
    return d

def _o_trong(m, x, y):
    gh, gw = m.shape
    gx = min(gw-1, max(0, int(x//NAV))); gy = min(gh-1, max(0, int(y//NAV)))
    if not m[gy,gx]: return (gy,gx)
    for rad in range(1,7):
        for dy in range(-rad, rad+1):
            for dx in range(-rad, rad+1):
                if max(abs(dx),abs(dy)) != rad: continue
                nx, ny = gx+dx, gy+dy
                if nx<0 or ny<0 or nx>=gw or ny>=gh: continue
                if not m[ny,nx]: return (ny,nx)
    return None

def cham(W, H, dg, cum, vatcan, diem):
    m = _vc_mask(W, H, vatcan, cum, dg)
    thoang = 100.0 * (~m).sum() / m.size
    o = [_o_trong(m, q[1], q[2]) for q in diem]
    o = [q for q in o if q]
    kinh = 0; hong = 0
    for a in range(len(o)):
        d = _bfs(m, o[a])
        for c in range(len(o)):
            if a == c: continue
            s = d[o[c]]
            if s < 0: hong += 1
            elif s > kinh: kinh = int(s)
    # tỉ lệ vòng trên lưới cố định 5x4 như test_obstacles ③
    g = []
    for gx in range(5):
        for gy in range(4):
            x = 300 + gx*(W-600)/4; y = 300 + gy*(H-600)/3
            q = _o_trong(m, x, y)
            # điểm mẫu phải THẬT SỰ trống (test dùng inObstacle r=30 rồi bỏ qua nếu chặn)
            gxi, gyi = int(x//NAV), int(y//NAV)
            if gyi < m.shape[0] and gxi < m.shape[1] and not m[gyi,gxi]: g.append((x,y,(gyi,gxi)))
    vong = []
    for i in range(len(g)):
        d = _bfs(m, g[i][2])
        for j in range(i+1, len(g)):
            s = d[g[j][2]]
            if s < 0: continue
            D = math.dist((g[i][0],g[i][1]), (g[j][0],g[j][1]))
            if D > 1: vong.append(s*NAV/D)
    # ép về kiểu Python thuần: numpy bool_/int32 lọt ra ngoài là json.dump chết
    return { 'thoang': round(float(thoang),1), 'duongKinh': int(kinh)*NAV, 'hong': int(hong),
             'vongMax': round(float(max(vong)),3) if vong else 0.0,
             'phaiVong': int(sum(1 for v in vong if v >= 1.08)), 'soCap': len(vong) }
