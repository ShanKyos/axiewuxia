#!/usr/bin/env python3
"""Đúc một TẦNG PHÓ BẢN từ khuôn làn — hành lang dài chia đoạn, mỗi đoạn một đợt quái.

Vì sao hành lang lại là hình của một phó bản. Chủ dự án xem Lối Mòn Corran dựng xong rồi nói
"map này khá ổn để làm phó bản". Nhận xét ấy đúng, và lý do đúng thì đo được: map đồng trống cho
người chơi tản ra mọi hướng, nên nhịp do người chơi đặt; hành lang chỉ có một đường tiến, nên
nhịp do MAP đặt — đi tới, gặp đợt, dọn xong mới đi tiếp. Đó chính là nhịp một phó bản muốn có,
và ở đây nó là HÌNH DẠNG chứ không phải một luật viết thêm vào máy.

Vì sao MỘT hành lang dài chia đoạn, chứ không phải vài hành lang ngắn nối nhau:

  · Khuôn làn đã sẵn có NÚT THẮT (`Lan.nut`). Nút thắt vốn sinh ra để chia làn thành khoảnh mà
    không cần một dòng chữ nào — mà "chỗ hành lang thắt lại" cũng đúng là chỗ duy nhất đặt được
    một cánh cửa đá cho ra hồn. Hai việc ấy trùng nhau, nên cửa không phải thứ dán thêm vào map:
    nó mọc ra từ chính hình học đã có.
  · Lối Mòn Corran đã chia sẵn ba khoảnh dân số (`vung`) dọc lối — đúng dạng "ba đợt" mà máy phó
    bản đang chờ. Ba đoạn ↔ ba đợt ↔ hai cửa, một-đổi-một, không phải quy đổi gì.
  · Máy phó bản (`DGN`) chạy MỘT map cho MỘT lượt, có đồng hồ đếm ngược. Vài hành lang ngắn nối
    nhau nghĩa là đổi map giữa lượt — thứ máy không làm được, và cũng không nên làm được: đổi map
    là cắt mạch, mà mạch liền chính là thứ hành lang đang bán.

⚠ ĐÚC LẠI, KHÔNG CHÉP LẠI. Bệnh đã chẩn ở CLAUDE.md là "một địa hình dùng bảy lần". Nếu tầng phó
bản này chép nguyên đa giác của Lối Mòn Corran thì nó là cái bệnh cũ mặc áo mới. Nên nó dùng lại
cái KHUÔN (`tools/dung_lan.Lan`) với bộ số của riêng nó: ngắn hơn, uốn khác, thắt ở chỗ khác.
Phó bản tiếp theo là một bộ số nữa, không phải một lần dán nữa.

Chạy:  python3 tools/iso/lan_phoban.py            # in khối dữ liệu để dán vào canbang.js
       python3 tools/iso/lan_phoban.py --do       # chỉ in báo cáo đo, không in dữ liệu
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from dung_lan import Lan, js_diem            # MỘT nguồn hình học duy nhất với map làn ngoài trời

# ── Bộ số của Lối Mòn Sâu ────────────────────────────────────────────────────────────────────
# ⚠ KHỔ VÀ BỀ NGANG GIỮ ĐÚNG BẰNG LỐI MÒN CORRAN — 6400 dài, lối 500px, chỗ thắt 350px. Đây là
# thứ tôi đã làm sai một lần và bị bắt: bản đầu để 5600×1300 với lối 530px, nghe thì chỉ là "gọn
# lại một chút", đo ra thì tỉ lệ dài:ngang tụt từ 13,4:1 xuống 11,0:1. Cái tỉ lệ ấy CHÍNH LÀ thứ
# làm nên hành lang — nới bề ngang ra và cắt chiều dài đi thì nó trượt dần về phía đồng trống,
# tức về đúng cái hình mà việc này sinh ra để tránh. Muốn phó bản khác cha thì đổi ĐƯỜNG ĐI, đừng
# đổi tỉ lệ.
#
# Nên khác cha ở chỗ khác, và chỉ ở chỗ ấy: đường tim uốn 1,15 chu kỳ thay vì 1,5, biên độ 195
# thay vì 170, nút thắt ở 0,34 và 0,67 thay vì 0,30 và 0,62. Cùng một khuôn, cùng một tỉ lệ,
# không ai nhìn ra là cùng một con đường.
LAN = Lan(w=6400, h=1400, tim_y=700, bien_do=195, chu_ky=1.15,
          rong_nua=250, nut=(0.34, 0.67), nut_nua=175, nut_rond=0.05)

DAY_TUONG = 60      # bề dày tường đá, theo trục tiến — bằng khuôn dọc cũ (DGN_WALLS[].h)
NUA_KHE   = 75      # nửa bề rộng khe cửa → khe 150px. Khuôn dọc cũ để 140; nới nhẹ vì ở đây khe
                    # nằm trên trục dọc, mà thân nhân vật vẽ ra cao hơn là rộng.
LOI_TUONG = 120     # tường ăn lấn ra ngoài mép hành lang bấy nhiêu, để cắm vào rừng chứ không
                    # hẫng ra một đầu tường lơ lửng giữa nền.
BAN_KINH_DOT = 170  # bán kính rải quái mỗi đợt — khớp spawnMob(...{r:170}) trong nextDungeonWave
X_THA = 240         # điểm thả, sát đầu tây
X_CUA_RA = 430      # cổng Xuất Môn, ngay sau lưng điểm thả


def trong_da_giac(dg, x, y):
    """Ray-casting — CHÉP ĐÚNG `trongDaGiac()` của game.js, kể cả lối so sánh, để hai bên không
    bao giờ trả lời khác nhau về cùng một điểm."""
    trong = False
    j = len(dg) - 1
    for i in range(len(dg)):
        xi, yi = dg[i]
        xj, yj = dg[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            trong = not trong
        j = i
    return trong


def khoanh(lan):
    """Ba đoạn hành lang, cắt tại các nút thắt. Trả về [(x_dau, x_cuoi), ...]."""
    moc = [60] + [n * lan.w for n in lan.nut] + [lan.w - 60]
    return [(moc[i], moc[i + 1]) for i in range(len(moc) - 1)]


def phong(lan):
    """Tâm mỗi đoạn — chỗ đợt quái của đoạn ấy rơi xuống, và đoạn cuối là sảnh trùm."""
    return [{'cx': round((a + b) / 2), 'cy': round(lan.tim((a + b) / 2))}
            for a, b in khoanh(lan)]


def tuong(lan):
    """Một bức tường đá ở mỗi nút thắt, khe cửa nằm đúng trên đường tim.

    Khe canh theo tim tại GIỮA bề dày tường, không phải mép trước: đường tim trôi ~15px dọc 60px
    bề dày, canh ở mép thì nửa sau của khe lệch khỏi lối.
    """
    ra = []
    for n in lan.nut:
        t = n * lan.w
        giua = t + DAY_TUONG / 2
        c, r = lan.tim(giua), lan.nua_rong(giua)
        ra.append({'t': round(t), 'd': DAY_TUONG,
                   'a': max(0, round(c - r - LOI_TUONG)),
                   'b': min(lan.h, round(c + r + LOI_TUONG)),
                   'k0': round(c - NUA_KHE), 'k1': round(c + NUA_KHE)})
    return ra


def do_dac(lan):
    """Kiểm mọi ràng buộc mà `tests/test_sandat.js` sẽ soi, TRƯỚC khi dán số vào repo.

    Bài kiểm chạy trong trình duyệt và mất vài phút; mấy phép đo này chạy trong một phần giây và
    hỏi đúng những câu ấy. Chỗ nào sai thì sửa bộ số ở đầu tệp rồi chạy lại, đừng sửa số đã in ra.
    """
    dg = lan.da_giac()
    ph, tg = phong(lan), tuong(lan)
    loi, ghi = [], []

    # ① điểm thả và cổng ra phải nằm trong sàn, và không dính bức tường nào
    for ten, x in (('điểm thả', X_THA), ('cổng Xuất Môn', X_CUA_RA)):
        y = round(lan.tim(x))
        if not trong_da_giac(dg, x, y):
            loi.append('%s (%d,%d) NGOÀI đa giác sàn' % (ten, x, y))
        for w in tg:
            if w['t'] - 20 <= x <= w['t'] + w['d'] + 20:
                loi.append('%s (%d,%d) dính tường đá ở x=%d' % (ten, x, y, w['t']))
        ghi.append('%s: (%d,%d)' % (ten, x, y))

    # ② cả đĩa rải quái của mỗi đợt phải nằm trong sàn — nếu không, `test_sandat` ④ đếm được
    #    từng con quái đứng ngoài đất. Quét viền đĩa, chỗ chạm mép sớm nhất nằm trên viền.
    for i, p in enumerate(ph):
        ngoai = 0
        for k in range(72):
            g = 2 * math.pi * k / 72
            if not trong_da_giac(dg, p['cx'] + BAN_KINH_DOT * math.cos(g),
                                 p['cy'] + BAN_KINH_DOT * math.sin(g)):
                ngoai += 1
        if ngoai:
            loi.append('đĩa rải quái đoạn %d (tâm %d,%d bán kính %d) thò ra ngoài sàn %d/72 hướng'
                       % (i + 1, p['cx'], p['cy'], BAN_KINH_DOT, ngoai))
        ghi.append('đoạn %d: tâm (%d,%d)' % (i + 1, p['cx'], p['cy']))

    # ③ khe cửa phải thông thật — cả hai mép bề dày tường đều phải nằm gọn trong lối
    for i, w in enumerate(tg):
        for mep, x in (('trước', w['t']), ('sau', w['t'] + w['d'])):
            for ten, y in (('trên', w['k0'] + 6), ('dưới', w['k1'] - 6)):
                if not trong_da_giac(dg, x, y):
                    loi.append('khe cửa %d mép %s cạnh %s (%d,%d) đâm vào vách' % (i + 1, mep, ten, x, y))
        # và tường phải bịt KÍN lối: hai cánh phải trùm hết bề ngang hành lang tại đó
        c, r = lan.tim(w['t'] + w['d'] / 2), lan.nua_rong(w['t'] + w['d'] / 2)
        if w['a'] > c - r or w['b'] < c + r:
            loi.append('tường %d không bịt kín lối (tường %d..%d, lối %d..%d)'
                       % (i + 1, w['a'], w['b'], round(c - r), round(c + r)))
        ghi.append('tường %d: x=%d dày %d · phủ y %d..%d · khe y %d..%d (%dpx)'
                   % (i + 1, w['t'], w['d'], w['a'], w['b'], w['k0'], w['k1'], w['k1'] - w['k0']))

    # ④ chỗ thắt nhất vẫn phải đánh nhau được — cùng ngưỡng 340px của test_sandat ⑥.
    #    (Bài ấy bỏ qua map `type:'dungeon'`, nên phép đo này là thứ duy nhất canh. Bỏ qua không
    #    có nghĩa là được phép hẹp: cái ngưỡng suy từ cỡ THÂN NGƯỜI, mà thân người thì vào phó
    #    bản vẫn cùng cỡ ấy.)
    hep = min(2 * lan.nua_rong(x) for x in range(60, lan.w - 60, 20))
    ghi.append('chỗ thắt nhất: %dpx' % round(hep))
    if hep < 340:
        loi.append('lối thắt còn %dpx — cần ≥340px (≈3,5 thân người) để còn đánh nhau được' % round(hep))

    # ⑤ khe cửa hẹp hơn lối là CỐ Ý (nó phải đọc ra là một cái cửa), nhưng vẫn phải lọt người
    if 2 * NUA_KHE < 120:
        loi.append('khe cửa %dpx — hẹp hơn một thân người rưỡi, không lách qua được' % (2 * NUA_KHE))

    dt = lan.dien_tich(dg)
    ghi.append('đa giác %d đỉnh · sàn %.1f%% khổ map %dx%d' % (len(dg), 100 * dt / (lan.w * lan.h), lan.w, lan.h))
    return dg, ph, tg, loi, ghi


def main():
    dg, ph, tg, loi, ghi = do_dac(LAN)
    chi_do = '--do' in sys.argv

    for g in ghi:
        print(('// ' if not chi_do else '') + g)
    for l in loi:
        print(('// ⚠ SAI: ' if not chi_do else 'SAI: ') + l)
    if chi_do:
        print('ĐỎ (%d lỗi)' % len(loi) if loi else 'XANH — mọi phép đo đạt')
        return 1 if loi else 0
    if loi:
        print('// ⚠ CÓ LỖI HÌNH HỌC — sửa bộ số ở đầu tools/iso/lan_phoban.py rồi chạy lại.')
        return 1

    cay = LAN.hang_cay()
    print('    dgnKhuon: {')
    print("      truc:'x', huong:'sang phía Đông',")
    print('      phong: [ ' + ' '.join('{ cx:%d, cy:%d },' % (p['cx'], p['cy']) for p in ph).rstrip(',') + ' ],')
    print('      tuong: [')
    for w in tg:
        print('        { t:%d, d:%d, a:%d, b:%d, k0:%d, k1:%d },'
              % (w['t'], w['d'], w['a'], w['b'], w['k0'], w['k1']))
    print('      ],')
    print('    },')
    print('    diTrong: [')
    print(js_diem(dg))
    print('    ],')
    print('    vatDat: [')
    for i in range(0, len(cay), 5):
        print('      ' + ' '.join('{ x:%d, y:%d, s:%s },' % c for c in cay[i:i + 5]))
    print('    ],')
    return 0


if __name__ == '__main__':
    sys.exit(main())
