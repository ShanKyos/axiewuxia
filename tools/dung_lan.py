#!/usr/bin/env python3
"""Sinh hình học một map dạng LÀN — hành lang ngang có nút thắt, hai hàng cây men theo mép.

Vì sao sinh bằng máy chứ không gõ tay: một hành lang 6400px cần ~40 đỉnh đa giác và ~90 cái cây
đặt đúng mép. Gõ tay thì lần chỉnh nào cũng phải gõ lại, và mép cây với mép đa giác sẽ lệch nhau
— cây mọc giữa đường, hoặc mép đường trống hoác. Sinh từ MỘT đường tim thì cả hai luôn khớp.

Đường tim uốn nhẹ hình sin. Bề ngang thắt lại ở các nút để chia làn thành khoảnh: nút thắt là
thứ cho người chơi CẢM được mình vừa sang một chặng mới mà không cần một dòng chữ nào.

⚠ ĐÂY LÀ MỘT CÁI KHUÔN, KHÔNG PHẢI MỘT CÁI MAP. Lối Mòn Corran là instance `LOIMON` bên dưới;
`Lan` nhận tham số nên map làn tiếp theo là một bộ số khác, không phải một bản chép. Chuyện này
quan trọng hơn nó nghe: bệnh đã chẩn ở CLAUDE.md là "một địa hình dùng bảy lần", nên thứ được
dùng lại phải là cái KHUÔN chứ không phải cái hình nó đúc ra. `tools/iso/lan_phoban.py` đúc
tầng phó bản từ đúng khuôn này, với bộ số của riêng nó.

Chạy:  python3 tools/dung_lan.py
"""
import math


class Lan:
    """Một hành lang ngang: đường tim hình sin + bề ngang thắt lại ở các nút.

    Mọi số đo đều là tham số vì chúng là LỰA CHỌN THIẾT KẾ, không phải hằng số vũ trụ — trừ khi
    có lý do ghi ngay cạnh. Nút thắt là thứ đáng chú ý nhất: nó vừa chia làn thành khoảnh, vừa
    là chỗ duy nhất đặt được cửa đá cho một tầng phó bản (xem `lan_phoban.py`).
    """

    def __init__(self, w=6400, h=1400, tim_y=700, bien_do=170, chu_ky=1.5,
                 rong_nua=250, nut=(0.30, 0.62), nut_nua=175, nut_rond=0.055):
        self.w, self.h = w, h
        self.tim_y, self.bien_do, self.chu_ky = tim_y, bien_do, chu_ky
        self.rong_nua = rong_nua                  # nửa bề ngang chỗ rộng nhất
        self.nut = list(nut)                      # nút thắt ở đâu (tỉ lệ chiều dài)
        self.nut_nua = nut_nua                    # nửa bề ngang chỗ thắt
        self.nut_rond = nut_rond                  # nút thắt loang rộng bao nhiêu

    def tim(self, x):
        return self.tim_y + self.bien_do * math.sin(x / self.w * 2 * math.pi * self.chu_ky)

    def nua_rong(self, x):
        """Nửa bề ngang tại x — hẹp dần về phía nút thắt rồi nở lại."""
        r = self.rong_nua
        for n in self.nut:
            d = abs(x / self.w - n)
            if d < self.nut_rond:
                k = 0.5 * (1 + math.cos(math.pi * d / self.nut_rond))   # 1 ở tâm nút, 0 ở rìa
                r = min(r, self.rong_nua - (self.rong_nua - self.nut_nua) * k)
        return r

    def da_giac(self, buoc=200):
        """Đa giác đi được: mép trên chạy xuôi, mép dưới chạy ngược — một vòng khép kín."""
        xs = list(range(60, self.w - 59, buoc)) + [self.w - 60]
        tren = [(x, round(self.tim(x) - self.nua_rong(x))) for x in xs]
        duoi = [(x, round(self.tim(x) + self.nua_rong(x))) for x in reversed(xs)]
        return tren + duoi

    def hang_cay(self, le=80, buoc=105, lop=3):
        """Hai hàng cây men theo mép làn, lùi ra ngoài `le` px để không mọc đè lên đường.

        `lop` hàng chồng lên nhau, mỗi hàng lùi thêm — hàng trong che chân, hàng ngoài dựng khối
        rừng. Hàng DƯỚI (y lớn) là thứ vẽ ĐÈ lên người chơi và cho ra cảm giác đang ở TRONG rừng.

        ⚠ CỠ và MẬT ĐỘ quan trọng ngang art. Vòng đầu để bước 165px và cỡ 0,85-1,3 (tức cây cao
        85-130px, xấp xỉ thân người 95px): ảnh chụp ra hai hàng cây con lơ thơ, hở toang từng mảng
        nền tối giữa các gốc — không đọc ra bìa rừng, chỉ đọc ra mấy cái cây đứng rời. Cây bìa rừng
        thật phải CAO GẤP ĐÔI người và đứng KHÍT nhau thì mắt mới thấy một bức tường.
        """
        ra = []
        for i in range(lop):
            lech = le + i * 150
            # so le nửa bước mỗi lớp để không thành ba hàng thẳng tắp như trồng rừng công nghiệp
            for x in range(40 + (i % 2) * (buoc // 2), self.w - 40, buoc):
                r = self.nua_rong(x)
                for phia in (-1, 1):
                    y = self.tim(x) + phia * (r + lech)
                    if 40 < y < self.h - 40:
                        # cây xa (y nhỏ) vẽ nhỏ hơn một chút — gợi chiều sâu mà không cần phối cảnh thật
                        s = 1.75 + 0.55 * (y / self.h) + 0.22 * ((x // buoc) % 3)
                        ra.append((round(x), round(y), round(s, 2)))
        return ra

    def dien_tich(self, dg=None):
        """Diện tích đa giác sàn — dùng để in tỉ lệ sàn/khổ map."""
        dg = self.da_giac() if dg is None else dg
        s = 0.0
        for i in range(len(dg)):
            a, b = dg[i], dg[(i + 1) % len(dg)]
            s += a[0] * b[1] - b[0] * a[1]
        return abs(s) / 2


# Lối Mòn Corran — instance đang chạy trong `data/canbang.js`. `phac_lan.py` nhập `W/H/tim/
# nua_rong` từ đây để tranh nền và va chạm luôn nói cùng một chuyện; giữ nguyên bốn cái tên ấy.
LOIMON = Lan()
W, H = LOIMON.w, LOIMON.h
tim = LOIMON.tim
nua_rong = LOIMON.nua_rong
da_giac = LOIMON.da_giac
hang_cay = LOIMON.hang_cay


def js_diem(ds, moi_dong=6, thut='      '):
    d = []
    for i in range(0, len(ds), moi_dong):
        d.append(thut + ' '.join('[%d,%d],' % p for p in ds[i:i + moi_dong]))
    return '\n'.join(d).rstrip(',')


def in_khoi(lan, thut='    '):
    """In `diTrong` + `vatDat` của một làn, đúng khuôn để dán vào `data/canbang.js`."""
    dg = lan.da_giac()
    cay = lan.hang_cay()
    print('// đa giác %d đỉnh · sàn %.1f%% khổ map · %d cây'
          % (len(dg), 100 * lan.dien_tich(dg) / (lan.w * lan.h), len(cay)))
    print(thut + 'diTrong: [')
    print(js_diem(dg))
    print(thut + '],')
    print(thut + 'vatDat: [')
    for i in range(0, len(cay), 5):
        print('      ' + ' '.join('{ x:%d, y:%d, s:%s },' % c for c in cay[i:i + 5]))
    print(thut + '],')


def main():
    in_khoi(LOIMON)


if __name__ == '__main__':
    main()
