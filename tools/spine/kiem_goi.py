#!/usr/bin/env python3
"""Kiểm một gói Spine mới nhận TRƯỚC khi nướng — bắt lỗi bằng lệnh, không bằng mắt.

    python3 tools/spine/kiem_goi.py <thư-mục-gói> [tên-da]

Ba lần nhận hàng vừa rồi, ba lần lỗi khác nhau, và cả ba đều chỉ lộ ra SAU khi nướng xong:
gói 1 thiếu ống tay, gói 2 lệch năm vùng tay phải 33-48 px, gói 3 thì được. Mỗi vòng như thế
mất 25 giây nướng cộng một lượt dựng ảnh so sánh. Bài này đọc thẳng .json + .atlas + .png và
trả lời trong một giây.

KHÔNG kiểm được cái gì: đẹp hay xấu, có giống nhân vật cũ không. Đó là việc của mắt.
"""
import sys, os, glob, json

# Bộ xương mẫu của Meowa — mọi gói phải trùng, nếu không thì bảng khung không dán chung được.
XUONG, KHE, HOAT = 83, 13, 20
# Bốn mảnh MẶT. nuong_nv.py đổi mảnh khe `头` theo từng khối (KHUNG2): trúng đòn mặt đau, chết
# nhắm mắt, nhảy múa mặt vui. Thiếu một mảnh là khối đó vẽ ra mặt sai.
MAT = ('头', '头_开心', '头_痛苦', '头_闭眼')
# Hoạt cảnh mà đường nướng THẬT SỰ đọc tới. Thiếu một cái là khối đó rơi về dáng đứng.
CAN = ('00_Idle', '00_Walk', '00_Run', '05_MagicAttack', '08_SwordAttack', '08_SwordAttack2',
       '10_ArcheryAttack', '06_PunchAttack', '03_Hurt', '02_Death', '04_Jumpping',
       '00_Squat', '09_Interactive', '07_StatusEffect', '01_Dance')
# Dưới ngần này khoá thì hoạt cảnh chỉ là một tư thế giữ nguyên, nướng ra 16 khung giống hệt.
KHOA_TOI_THIEU = 20
# CANH KHỚP — CẢNH BÁO, KHÔNG PHẢI LỖI. Mốc trong moc_vung.json sinh từ MỘT nhân vật.
#
# ⚠ Phép này chỉ có thẩm quyền khi so HAI ĐỜI CỦA CÙNG MỘT NHÂN VẬT. Nhân vật khác thì đầu to
# đầu nhỏ, chân đứng rộng hẹp khác nhau, và tâm mảnh dịch theo — hoàn toàn hợp lệ. Gói thân
# trần Dark Knight đo ra lệch 25-36 px ở 8 vùng mà nướng ra SẠCH: 0/96 khung có mảnh rời. Nếu
# để nó là LỖI thì một gói tốt bị trả về oan.
#
# Cửa THẬT nằm ở nuong_nv.py: đếm mảnh alpha rời khỏi khối chính sau khi nướng. Phép đó không
# phụ thuộc nhân vật — đo được 28/96 khung ở gói hỏng và 0/96 ở cả hai gói tốt, hai nhân vật
# khác nhau.
# Đo TÂM ĐẦU MÚT (18% dưới cùng của mảnh) chứ không tâm cả mảnh: bàn tay và bàn chân là DA
# TRẦN ở mọi bộ đồ nên chúng bám xương, không đổi theo quần áo. Tâm cả mảnh thì thêm ống tay
# áo là dịch ngay, và phép đo mất hết ý nghĩa.
#
# ⚠ Bản đầu tôi đo "hai tay có cân nhau không" — TRONG CHÍNH GÓI, khỏi cần mốc ngoài. Nghe
# gọn nhưng vô dụng: gói hỏng đo ra 20 px, hai gói tốt đo ra 13 và 22 px. Không có tín hiệu,
# mà lại phát ra một dấu ✓ đáng tin. Một phép đo không tách được tốt/xấu thì tệ hơn không đo.
MOC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'moc_vung.json')
# Ngưỡng CANH TRÊN HAI CA ĐÃ BIẾT, không phải số tròn cho đẹp:
#   · gói đời 1 (chạy đúng trong game) lệch nhiều nhất 20 px  -> phải CHO QUA
#   · gói đời 2 (tay rời khỏi vai)     lệch ÍT nhất  26 px  -> phải CHẶN
# 23 nằm đúng giữa. Kéo xuống 20 là gói đời 1 bị chặn oan; kéo lên 26 là gói đời 2 lọt.
LECH_TOI_DA = 23


def _dai(hc):
    """(giây, số khoá) — Spine không ghi sẵn độ dài, phải dò khoá muộn nhất."""
    m = k = 0
    for gr in hc.values():
        if not isinstance(gr, dict): continue
        for b in gr.values():
            for tl in (b.values() if isinstance(b, dict) else [b]):
                if isinstance(tl, list):
                    k += len(tl)
                    for kf in tl:
                        if isinstance(kf, dict): m = max(m, kf.get('time', 0))
    return m, k


def _atlas(p):
    R, n = {}, None
    for s in open(p, encoding='utf-8'):
        s = s.strip()
        if s.startswith('bounds:'): R[n] = [int(v) for v in s.split(':')[1].split(',')]
        elif s and ':' not in s and not s.endswith('.png'): n = s
    return R


def kiem(goi, skin=None):
    loi, canh = [], []
    jf = glob.glob(os.path.join(goi, '*.json'))
    af = glob.glob(os.path.join(goi, '*.atlas'))
    pf = glob.glob(os.path.join(goi, '*.png'))
    if not (jf and af and pf):
        return ['gói phải có đủ ba tệp .json + .atlas + .png'], []
    d = json.load(open(jf[0], encoding='utf-8'))

    # ── ① Bộ xương ──────────────────────────────────────────────────────────────────────
    for ten, that, can in (('xương', len(d['bones']), XUONG), ('khe', len(d['slots']), KHE),
                           ('hoạt cảnh', len(d['animations']), HOAT)):
        if that != can: loi.append(f'{ten}: {that}, bộ xương mẫu là {can}')
    print(f'  bộ xương  {len(d["bones"])} xương · {len(d["slots"])} khe · {len(d["animations"])} hoạt cảnh')

    # ── ② Da và bốn mảnh mặt ────────────────────────────────────────────────────────────
    das = {s['name']: s for s in d['skins']}
    print(f'  da        {", ".join(das)}')
    if skin and skin not in das:
        loi.append(f'không có da tên "{skin}" — gói chỉ có: {", ".join(das)}')
        skin = None
    ten_da = skin or next((k for k in das if k not in ('default', '基础', '长裙')), None)
    if ten_da:
        at = das[ten_da].get('attachments', {})
        co = set(at.get('头', {}))
        thieu = [m for m in MAT if m not in co]
        if thieu: loi.append(f'da "{ten_da}" thiếu mảnh mặt: {", ".join(thieu)} — khối trúng đòn / '
                             f'chết / nhảy múa sẽ vẽ ra mặt sai')
        else: print(f'  mặt       đủ 4 mảnh trên da "{ten_da}"')

    # ── ③ Hoạt cảnh nào rỗng hoặc chỉ là một tư thế giữ nguyên ──────────────────────────
    yeu = []
    for n in CAN:
        if n not in d['animations']: loi.append(f'thiếu hẳn hoạt cảnh {n}'); continue
        t, k = _dai(d['animations'][n])
        if k < KHOA_TOI_THIEU or t <= 0.01: yeu.append(f'{n} ({k} khoá, {t:.2f}s)')
    if yeu: loi.append('hoạt cảnh chỉ là tư thế giữ nguyên, nướng ra khung nào cũng giống nhau: '
                       + ' · '.join(yeu))
    else: print(f'  hoạt cảnh {len(CAN)}/{len(CAN)} khối nướng cần đều có khoá thật')

    # ── ④ Vùng RỖNG — món đồ quên vẽ ────────────────────────────────────────────────────
    from PIL import Image
    im = Image.open(pf[0]).convert('RGBA')
    R = _atlas(af[0])
    rong = [n for n, (x, y, w, h) in R.items()
            if not im.crop((x, y, x + w, y + h)).getchannel('A').getbbox()]
    # 躯干 và 背后头发 vốn rỗng ở bản mẫu (thân vẽ ở 躯干_带长裙, tóc sau không dùng) — không kêu.
    rong = [n for n in rong if not n.startswith(('躯干', '背后头发', '左手武器'))]
    if rong: loi.append(f'vùng atlas RỖNG (quên vẽ): {", ".join(rong)}')

    # ── ⑤ CANH KHỚP từng vùng so với mốc bản mẫu ───────────────────────────────────────
    if os.path.exists(MOC):
        moc = json.load(open(MOC, encoding='utf-8'))['moc']
        import numpy as np
        def mut(box, frac=0.18):
            x, y, w, h = box
            a = np.array(im.crop((x, y, x + w, y + h)).getchannel('A'), dtype=float)
            ys, _ = np.nonzero(a > 16)
            if len(ys) < 50: return None
            y0, y1 = int(ys.min()), int(ys.max())
            m = a[int(y1 - (y1 - y0) * frac):y1 + 1, :]
            t = m.sum()
            return None if t <= 0 else (m.sum(axis=0) * np.arange(m.shape[1])).sum() / t
        xau, max_l = [], 0
        for v, (mx, _my) in moc.items():
            if v not in R: continue
            c = mut(R[v])
            if c is None: continue
            l = abs(c - mx); max_l = max(max_l, l)
            if l > LECH_TOI_DA: xau.append(f'{v} lệch {c - mx:+.0f} px')
        if xau:
            canh.append(f'{len(xau)} vùng lệch so với mốc bản mẫu: ' + ' · '.join(xau) +
                        '\n    Nếu đây là ĐỜI MỚI CỦA CÙNG NHÂN VẬT thì gần như chắc chắn là vẽ '
                        'trượt trong ô — xương cắm vào Ô chứ không vào nét vẽ, bộ phận đó sẽ rời '
                        'khỏi người ở mọi khung.\n    Nếu đây là NHÂN VẬT MỚI thì bình thường: '
                        'đầu và dáng đứng khác nhau thì tâm mảnh dịch theo.\n    Cách phân biệt: '
                        'nướng ra, xem dòng "mảnh rời" ở cuối.')
        else:
            print(f'  canh khớp {len(moc)} vùng, lệch lớn nhất {max_l:.0f} px (ngưỡng {LECH_TOI_DA})')
    return loi, canh


def main():
    if len(sys.argv) < 2: print(__doc__); return 1
    goi = sys.argv[1]; skin = sys.argv[2] if len(sys.argv) > 2 else None
    print(f'\n  {goi}')
    loi, canh = kiem(goi, skin)
    for c in canh: print(f'\n  ⚠ {c}')
    if loi:
        print()
        for l in loi: print(f'  ✗ {l}')
        print(f'\n  {len(loi)} lỗi — TRẢ LẠI GÓI.\n')
        return 1
    print(f'\n  ✓ gói dùng được{" (còn cảnh báo ở trên)" if canh else ""}.\n')
    return 0


if __name__ == '__main__': sys.exit(main())
