#!/usr/bin/env python3
"""Đọc rig Spine NHỊ PHÂN (.skel, bản 3.8) → đúng cấu trúc mà .json cho ra.

Vì sao cần: kit Axie Origins xuất phần lớn rig ở dạng .skel — cùng dữ liệu với
.json nhưng đóng gói nhị phân. Đợt trước chỉ đọc được .json nên 26/38 con trong
PvE/Starters, toàn bộ 22 con PvE/Chimeras và 8 con Summoners đều bị bỏ lại.

Chỉ dựng lại phần cần cho TƯ THẾ GỐC: cây xương, danh sách slot, và bộ mảnh
'region' của skin mặc định. Hoạt ảnh, mesh, ràng buộc IK/transform/path đều phải
đọc qua cho đúng vị trí con trỏ, nhưng không giữ lại.

    from skelbin import read_skel
    data = read_skel('alpha-wolf.skel')   # -> {'bones': [...], 'slots': [...], 'skins': [...]}
"""
import struct, sys, json


class R:
    """Con trỏ đọc — Spine ghi số nguyên kiểu varint, số thực kiểu big-endian."""

    def __init__(self, b):
        self.b, self.i = b, 0

    def byte(self):
        v = self.b[self.i]; self.i += 1; return v

    def sbyte(self):
        v = self.byte(); return v - 256 if v > 127 else v

    def bool(self):
        return self.byte() != 0

    def float(self):
        v = struct.unpack_from('>f', self.b, self.i)[0]; self.i += 4; return v

    def int32(self):
        v = struct.unpack_from('>i', self.b, self.i)[0]; self.i += 4; return v

    def vint(self, positive=True):
        b = self.byte(); r = b & 0x7F
        if b & 0x80:
            b = self.byte(); r |= (b & 0x7F) << 7
            if b & 0x80:
                b = self.byte(); r |= (b & 0x7F) << 14
                if b & 0x80:
                    b = self.byte(); r |= (b & 0x7F) << 21
                    if b & 0x80:
                        r |= (self.byte() & 0x7F) << 28
        r &= 0xFFFFFFFF
        if positive:
            return r
        return (r >> 1) ^ -(r & 1)

    def str(self):
        n = self.vint()
        if n == 0: return None
        if n == 1: return ''
        s = self.b[self.i:self.i + n - 1].decode('utf-8', 'replace'); self.i += n - 1
        return s

    def sref(self, table):
        i = self.vint()
        return None if i == 0 else table[i - 1]

    def floats(self, n):
        v = struct.unpack_from('>%df' % n, self.b, self.i); self.i += 4 * n; return list(v)

    def shorts(self):
        n = self.vint(); self.i += 2 * n; return n


def _vertices(r, vertex_count):
    """Bỏ qua mảng đỉnh (mesh/bbox/path) — chỉ cần nhảy đúng số byte."""
    if not r.bool():                      # không gắn xương: 2 float mỗi đỉnh
        r.floats(vertex_count * 2); return
    for _ in range(vertex_count):
        for _ in range(r.vint()):         # mỗi đỉnh: n xương, mỗi xương 4 số
            r.vint(); r.floats(3)


def _attachment(r, strings, att_name, nonessential):
    name = r.sref(strings) or att_name
    typ = r.byte()
    if typ == 0:                          # region
        path = r.sref(strings) or name
        rot, x, y, sx, sy, w, h = (r.float(), r.float(), r.float(),
                                   r.float(), r.float(), r.float(), r.float())
        r.int32()                         # màu
        return {'type': 'region', 'name': path, 'rotation': rot, 'x': x, 'y': y,
                'scaleX': sx, 'scaleY': sy, 'width': w, 'height': h}
    if typ == 1:                          # boundingbox
        vc = r.vint(); _vertices(r, vc)
        if nonessential: r.int32()
    elif typ == 2:                        # mesh
        r.sref(strings); r.int32()
        vc = r.vint(); r.floats(vc * 2); r.shorts(); _vertices(r, vc); r.vint()
        if nonessential: r.shorts(); r.float(); r.float()
    elif typ == 3:                        # linkedmesh
        r.sref(strings); r.int32(); r.sref(strings); r.sref(strings); r.bool()
        if nonessential: r.float(); r.float()
    elif typ == 4:                        # path
        r.bool(); r.bool()
        vc = r.vint(); _vertices(r, vc); r.floats(vc // 3)
        if nonessential: r.int32()
    elif typ == 5:                        # point
        r.float(); r.float(); r.float()
        if nonessential: r.int32()
    elif typ == 6:                        # clipping
        r.vint(); vc = r.vint(); _vertices(r, vc)
        if nonessential: r.int32()
    else:
        raise ValueError('kiểu mảnh lạ: %d' % typ)
    return None


def _skin(r, strings, slots, bone_names, default, nonessential, out):
    if default:
        slot_count = r.vint()
        if slot_count == 0: return
    else:
        r.sref(strings)                   # tên skin
        for _ in range(r.vint()): r.vint()          # xương riêng của skin
        for _ in range(3):                          # ik / transform / path
            for _ in range(r.vint()): r.vint()
        slot_count = r.vint()
    for _ in range(slot_count):
        si = r.vint()
        for _ in range(r.vint()):
            an = r.sref(strings)
            att = _attachment(r, strings, an, nonessential)
            if att is not None and default:
                out.setdefault(slots[si]['name'], {})[an] = att


def read_skel(path):
    r = R(open(path, 'rb').read())
    r.str(); ver = r.str()                # hash, version
    if not (ver or '').startswith('3.8'):
        raise ValueError('mới đọc được Spine 3.8, file này là %r' % ver)
    r.floats(4)                           # x, y, width, height
    nonessential = r.bool()
    if nonessential:
        r.float(); r.str(); r.str()       # fps, imagesPath, audioPath
    strings = [r.str() for _ in range(r.vint())]

    bones = []
    for i in range(r.vint()):
        name = r.str()
        parent = None if i == 0 else bones[r.vint()]['name']
        b = {'name': name, 'rotation': r.float(), 'x': r.float(), 'y': r.float(),
             'scaleX': r.float(), 'scaleY': r.float()}
        r.float(); r.float(); r.float()   # shearX, shearY, length
        r.vint(); r.bool()                # transformMode, skinRequired
        if nonessential: r.int32()        # màu
        if parent: b['parent'] = parent
        bones.append(b)

    slots = []
    for _ in range(r.vint()):
        sname = r.str(); bone = bones[r.vint()]['name']
        r.int32()                                    # màu
        if r.int32() != -1: pass                     # màu tối (đã đọc)
        att = r.sref(strings); r.vint()              # attachment, blendMode
        s = {'name': sname, 'bone': bone}
        if att: s['attachment'] = att
        slots.append(s)

    for _ in range(r.vint()):             # IK
        r.str(); r.vint(); r.bool()
        for _ in range(r.vint()): r.vint()
        r.vint(); r.float(); r.float(); r.sbyte(); r.bool(); r.bool(); r.bool()
    for _ in range(r.vint()):             # transform
        r.str(); r.vint(); r.bool()
        for _ in range(r.vint()): r.vint()
        r.vint(); r.bool(); r.bool(); r.floats(10)
    for _ in range(r.vint()):             # path
        r.str(); r.vint(); r.bool()
        for _ in range(r.vint()): r.vint()
        r.vint(); r.vint(); r.vint(); r.vint(); r.floats(5)

    atts = {}
    _skin(r, strings, slots, None, True, nonessential, atts)
    for _ in range(r.vint()):
        _skin(r, strings, slots, None, False, nonessential, atts)

    return {'bones': bones, 'slots': slots,
            'skins': [{'name': 'default', 'attachments': atts}]}


if __name__ == '__main__':
    d = read_skel(sys.argv[1])
    print(json.dumps(d, indent=1)[:2000])
    print('… %d xương, %d slot, %d slot có mảnh'
          % (len(d['bones']), len(d['slots']), len(d['skins'][0]['attachments'])))
