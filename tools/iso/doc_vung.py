"""Đọc `diTrong` / `isoCum` của một map ra khỏi data/canbang.js.

Quét theo DẤU NGOẶC chứ không bằng regex: hai khoá nằm cạnh nhau và regex tham lam
vớt sang cả mảng kế bên — đã đo được isoCum của Beast Herd Camp ra 15 lùm trong khi
thật ra có 3.
"""
import re

def _mang(src, i):
    """Đọc mảng bắt đầu tại src[i] == '[' → danh sách cặp (x,y)."""
    sau = 1; j = i + 1
    while j < len(src) and sau:
        if src[j] == '[': sau += 1
        elif src[j] == ']': sau -= 1
        j += 1
    return [(int(a), int(b)) for a, b in re.findall(r'\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]', src[i:j])]

def doc(src, khoa, ten):
    i = src.index('\n  %s: { name:' % khoa)
    m = re.search(r'\n  [a-z_0-9]+: \{ name:', src[i + 5:])
    het = i + 5 + m.start() if m else len(src)
    k = src.find(ten + ':', i, het)
    if k < 0: return []
    return _mang(src, src.index('[', k))
