"""Cắt bộ icon giao diện Gemini trả về (lưới 5×3) ra từng tệp, đặt tên THEO VAI.

Tấm gốc là 15 ô, nhưng chỉ 9 ô khác nhau thật sự — sáu ô còn lại là biến thể gần trùng
(ba ô bánh răng, bốn ô bút lông, hai ô sách). Đặt tên theo vai chứ không theo số thứ tự,
để đọc mã là biết nút nào dùng ảnh nào mà không phải mở tấm gốc ra đếm.

⚠ CẮT THEO LƯỚI CỐ ĐỊNH, KHÔNG CẮT THEO VIỀN NỘI DUNG. Vài con axie trong tranh thò tay
ra NGOÀI khung (ô "bản đồ + la bàn" lấn sang trái 22px), nên cắt theo hộp bao nội dung sẽ
ra 15 tấm lệch cỡ nhau — mà đây là icon, chúng phải khít một khuôn.

Chạy:  python3 tools/iso/cat_icon_ui.py <tấm-gốc.png>
"""
import sys
from PIL import Image

RA = 'public/game/assets/ui/'
CANH = 128                      # nướng 128 để nút 44px vẫn nét ở màn 2×-3×
XS = [113, 646, 1174, 1702, 2237]
YS = [48, 537, 1031]
W, H = 468, 455

# (cột, hàng) -> tên vai. Ô nào không có tên là biến thể gần trùng, bỏ.
VAI = {
    (0, 0): 'ic_nhanvat',   # kẻ trùm áo choàng cầm dao găm
    (1, 0): 'ic_tuido',     # túi da quai đồng
    (3, 0): 'ic_kynang',    # sách phù văn phát sáng lam
    (0, 1): 'ic_nhiemvu',   # trục giấy niêm ấn sáp đỏ
    (1, 1): 'ic_bando',     # bản đồ kho báu + la bàn
    (3, 1): 'ic_caidat',    # bánh răng đồng trơn, không kèm axie
    (0, 2): 'ic_binhmau',   # axie tu lọ đỏ, quầng đỏ
    (1, 2): 'ic_lomana',    # lọ xanh lam phát sáng
    (3, 2): 'ic_nhatky',    # bút lông + nghiên mực + trang giấy
}


def main(nguon):
    im = Image.open(nguon).convert('RGBA')
    n = 0
    for (c, r), ten in VAI.items():
        o = im.crop((XS[c], YS[r], XS[c] + W, YS[r] + H))
        o = o.resize((CANH, CANH), Image.LANCZOS)
        o.save(RA + ten + '.png')
        print(f'{ten:12s} ← cột {c} hàng {r}')
        n += 1
    print(f'{n} icon → {RA}')


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else 'tools/iso/nguon/gem_icon_ui.png'))
