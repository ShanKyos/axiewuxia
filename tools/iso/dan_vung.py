#!/usr/bin/env python3
"""Dán `diTrong` / `isoCum` từ /tmp/iso/vung.json vào data/canbang.js, đúng chỗ, giữ nguyên
mọi thứ khác của map.

Vì sao có tệp này: đợt trước dán tay và nó chỉ đúng vì làm một lần. Sinh lại lần hai (sau khi
hoán dải cấp) thì dán tay là tám cơ hội gõ nhầm một con số mà không ai đọc ra. Dán bằng máy
thì sai ở đây là sai có thể dựng lại được.

  python3 tools/iso/dan_vung.py [khoá ...]      (không truyền = dán hết những khoá có trong json)
"""
import json, re, sys

TEP = 'public/game/data/canbang.js'


def _mang(src, i):
    sau, j = 1, i + 1
    while j < len(src) and sau:
        if src[j] == '[': sau += 1
        elif src[j] == ']': sau -= 1
        j += 1
    return i, j


def _in_dg(dg, thut='      '):
    d = ['[%d,%d]' % (x, y) for x, y in dg]
    hang = [', '.join(d[i:i + 6]) + ',' for i in range(0, len(d), 6)]
    return '[\n' + '\n'.join(thut + h for h in hang) + '\n    ]'


def _in_cum(cum):
    return '[' + ''.join('[%d,%d], ' % (x, y) for x, y in cum).rstrip() + ']'


def dan(src, khoa, r):
    i = src.index('\n  %s: { name:' % khoa)
    m = re.search(r'\n  [a-z_0-9]+: \{ name:', src[i + 5:])
    het = i + 5 + m.start() if m else len(src)
    seg = src[i:het]

    for ten, vp in (('diTrong', _in_dg(r['diTrong'])), ('isoCum', _in_cum(r['isoCum']))):
        k = seg.find(ten + ':')
        if k < 0: raise SystemExit(f'{khoa}: không thấy khoá {ten}')
        a, b = _mang(seg, seg.index('[', k))
        seg = seg[:a] + vp + seg[b:]

    # dòng tóm tắt trong chú thích — số phải khớp thứ vừa dán, không thì chú thích thành lời đồn
    seg = re.sub(r'//   sàn .*', '//   ô trống %.1f%%  ·  %d đỉnh  ·  %d lùm chặn  ·  kính %d  ·  vòng %.3f'
                 % (r['oTrong'], len(r['diTrong']), len(r['isoCum']), r['kinh'], r['vong']), seg, count=1)
    seg = re.sub(r'//   ô trống .*', '//   ô trống %.1f%%  ·  %d đỉnh  ·  %d lùm chặn  ·  kính %d  ·  vòng %.3f'
                 % (r['oTrong'], len(r['diTrong']), len(r['isoCum']), r['kinh'], r['vong']), seg, count=1)
    return src[:i] + seg + src[het:]


def main():
    ra = json.load(open('/tmp/iso/vung.json'))
    khoa = sys.argv[1:] or list(ra)
    src = open(TEP, encoding='utf-8').read()
    for k in khoa:
        src = dan(src, k, ra[k])
        print('dán %-10s %d đỉnh · %d lùm · ô trống %.1f%%' % (k, len(ra[k]['diTrong']), len(ra[k]['isoCum']), ra[k]['oTrong']))
    open(TEP, 'w', encoding='utf-8').write(src)


if __name__ == '__main__':
    main()
