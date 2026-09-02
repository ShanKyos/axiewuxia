# Khế Ước Chimera — hệ gacha đồng hành

Bản thiết kế. **Chưa code gì cả** — chốt xong tài liệu này mới làm.

Yêu cầu: dựng lại đúng bộ máy gacha của Genshin Impact, từ A đến Z, nhưng quay ra **Chimera
đồng hành** thay vì nhân vật, và **vé chỉ cày được trong game** (không bán bằng tiền thật).

---

## 0. Cái gì lấy được, cái gì không

**Lấy được:** toàn bộ *cơ chế và con số* — tỉ lệ, đường cong pity, 50/50, bảo đảm, hệ bản trùng,
quầy đổi. Công thức toán không thuộc về ai.

**Không lấy được:** tên riêng và art của HoYoverse — Wish, Primogem, Intertwined Fate,
Starglitter, Stardust, Constellation, tên từng nhân vật. Đây đúng QUY TẮC SỐ 2 dự án đang áp cho
MU Online và Blizzard. Bảng đối chiếu tên ở §7.

---

## 1. Ba loại Khế Ước

| Khế Ước | Vai trò | Nội dung |
|---|---|---|
| **Giao Kết** | banner chính, đổi định kỳ | 1 Chimera 5★ + 3 Chimera 4★ đang lên kệ |
| **Vĩnh Cửu** | banner thường trực | toàn bộ Chimera 5★/4★ đã ra mắt, không có 50/50 |
| **Tân Thủ** | mở 1 lần cho tài khoản mới | tối đa 20 lượt, giảm 20% giá, 10 lượt đầu bảo đảm 4★ |

Mỗi lượt chỉ ra **đúng một** thứ. Có nút quay 1 và quay 10.

---

## 2. Tỉ lệ và pity — số đo được, không phải số chép

Mô hình dựng lại y hệt Genshin rồi **mô phỏng 2.000.000 lượt** để đối chiếu với tỉ lệ
Genshin công bố. Trùng khớp, tức mô hình đúng:

| Đại lượng | Mô phỏng của ta | Genshin công bố |
|---|---|---|
| 5★ gộp cả pity | **1,606%** | 1,600% |
| 4★ gộp cả pity | **13,012%** | 13,000% |

**Đường cong 5★** (banner Giao Kết & Vĩnh Cửu):
- Lượt 1–73: **0,6%** mỗi lượt.
- Lượt 74–89: **0,6% + 6 điểm phần trăm cho mỗi lượt vượt quá 73**. Tức lượt 74 là 6,6%, lượt 80
  là 42,6%, lượt 85 là 72,6%.
- Lượt 90: **bảo đảm**.

Đây là chỗ dễ hiểu sai nhất của cả hệ: **con số 0,6% không phải thứ người chơi thật sự gặp.**
Đo trên 2 triệu lượt:

| Kết quả | Tỉ lệ |
|---|---|
| 5★ ra trước lượt 74 (đoạn 0,6% phẳng) | **35,5%** |
| 5★ ra trong khoảng lượt 74–80 (đoạn dốc) | **56,3%** |
| 5★ phải chờ tới đúng lượt 90 | **~0%** |
| Trung bình số lượt cho 1 con 5★ bất kỳ | **62,3 lượt** |

Nói cách khác: soft pity nuốt gần hết trường hợp xấu. Hard pity 90 gần như không bao giờ chạm
tới — nó tồn tại như một lời hứa, không phải một con đường.

**Đường cong 4★:** 5,1% từ lượt 1–8; lượt 9 là 56,1%; lượt 10 bảo đảm. Bộ đếm 4★ **không** bị
xoá khi ra 5★.

---

## 3. 50/50 và bảo đảm

Chỉ áp cho **Khế Ước Giao Kết**.

1. Ra 5★ → tung đồng xu 50%. Trúng thì đó là Chimera đang lên kệ.
2. Trượt thì rơi vào pool Vĩnh Cửu — **và lần 5★ kế tiếp chắc chắn là con đang lên kệ**.
3. Cờ "đang được bảo đảm" **theo tài khoản, không theo banner**: đổi banner vẫn giữ.
4. 4★ cũng có 50/50 riêng với 3 con 4★ đang lên kệ.

Đo trên 2 triệu lượt:

| Đại lượng | Đo được |
|---|---|
| Tỉ lệ thắng 50/50 | 49,5% |
| Trung bình số vé cho **1 Chimera 5★ đang lên kệ** | **93,1 vé** |
| Có được con đang lên kệ trong vòng 90 vé | 58,9% |
| Có được con đang lên kệ trong vòng 180 vé | **100%** |

**Trần cứng là 180 vé.** Đây là con số cần in thẳng lên màn hình banner, vì nó là thứ duy nhất
người chơi dùng để quyết định có nên cày tiếp hay không.

**Bộ đếm pity mang theo giữa các banner Giao Kết** (đúng như Genshin), nhưng Giao Kết và Vĩnh Cửu
đếm **riêng**.

---

## 4. Bản trùng: Huyết Thống C1–C6

Quay trúng con đã có thì **không phải rác** — nó nâng Huyết Thống, mỗi bậc mở một hiệu ứng thật,
không phải chỉ cộng số:

| Bậc | Kiểu hiệu ứng |
|---|---|
| C1 | giảm hồi chiêu của Chimera |
| C2 | thêm một tầng hiệu ứng lên bị động |
| C3 | +3 cấp cho chiêu chủ động |
| C4 | thêm hiệu ứng phụ (hút máu / choáng / lan) |
| C5 | +3 cấp cho bị động |
| C6 | đổi hành vi — chiêu làm việc khác hẳn |

Đủ C6 rồi mà vẫn quay trúng → đổi thành **Nguyệt Trần** (§5).

---

## 5. Tiền tệ

| Thứ | Dùng làm gì | Nguồn |
|---|---|---|
| **Ấn Giao Kết** | 1 vé quay Khế Ước Giao Kết | cày (§6) |
| **Ấn Cổ Xưa** | 1 vé quay Khế Ước Vĩnh Cửu | cày, ít hơn |
| **Nguyệt Trần** | rơi ra từ mỗi lượt trúng 4★/5★ và từ bản trùng quá C6 | quầy đổi lấy Ấn, giới hạn theo tháng |
| **Tinh Trần** | rơi ra từ mỗi lượt trúng 3★ | đổi nguyên liệu nâng Chimera |

> ⚠ **Đề xuất bỏ bớt một lớp.** Genshin còn một lớp nữa: Primogem, 160 đổi 1 vé. Lớp đó tồn tại
> để **định giá gói nạp tiền thật** — 60 vé thì khó ra bảng giá đẹp, 9.600 primogem thì dễ. Dự án
> này đã chốt không bán bằng tiền thật, nên lớp đó không còn việc gì để làm ngoài việc bắt người
> chơi đếm hai con số thay vì một. Dự án cũng đã ba lần phải **gộp tiền tệ** vì đúng lỗi này
> (Công Huân Lệnh, 5 Lõi Nguyên Tố, Tâm Đắc — xem lịch sử commit). Tôi đề nghị **vé rơi thẳng,
> không có lớp mảnh**. Nếu anh vẫn muốn giống hệt Genshin thì thêm lại một dòng là xong, nhưng
> nên là quyết định có chủ ý.

---

## 6. Vé lấy ở đâu (không bán bằng tiền)

Nhịp mục tiêu: **~2 Ấn Giao Kết/ngày** cho người chơi đều đặn.

| Nguồn | Ấn | Ghi chú |
|---|---|---|
| Mục Tiêu Hôm Nay (xong hết) | 1/ngày | nối vào hệ đang có |
| Hạ boss vùng lần đầu mỗi ngày | 0,5/ngày | 2 con = 1 vé |
| Thông quan phó bản | 0,2/lượt | 5 lượt = 1 vé |
| Xong một chương chính tuyến | 5 | một lần |
| Hạ Vệ Binh Trụ / Cổng Vực lần đầu | 1 mỗi con | một lần, 28 con = 28 vé |
| Mốc cấp (mỗi 10 cấp) | 2 | một lần |
| Quầy đổi Nguyệt Trần | 5 Nguyệt Trần = 1 Ấn | trần 5 Ấn/tháng |

Với nhịp 2 vé/ngày: **~47 ngày cho một Chimera 5★ đang lên kệ** (93 vé), trần xấu nhất 90 ngày.
Banner nên đổi mỗi **6 tuần** để con số này có nghĩa.

---

## 7. Bảng đối chiếu tên

| Genshin | Ta dùng | Vì sao |
|---|---|---|
| Wish | **Khế Ước** | "Wish/Ước Nguyện" là tên hệ của họ |
| Intertwined Fate | **Ấn Giao Kết** | Sigil là từ vựng Axie sẵn có |
| Acquaint Fate | **Ấn Cổ Xưa** | |
| Primogem | (đề nghị bỏ — xem §5) | |
| Masterless Starglitter | **Nguyệt Trần** | |
| Stardust | **Tinh Trần** | |
| Constellation | **Huyết Thống** | Axie vốn nói về gene/huyết thống |
| Character Event Wish | **Khế Ước Giao Kết** | |
| Standard Wish | **Khế Ước Vĩnh Cửu** | |
| Novice Wish | **Khế Ước Tân Thủ** | |

Tên từng con Chimera lấy từ 9 lớp Axie (Beast · Aquatic · Plant · Bird · Bug · Reptile · Mech ·
Dawn · Dusk) — cùng bộ đã dùng cho Vùng Vỡ Ấn, xem `docs/VUNG_VO_AN_ENDGAME.md`.

---

## 8. Roster mở màn

**5★ — 6 con** (3 vào pool Vĩnh Cửu, 3 lần lượt lên kệ Giao Kết):

| Con | Lớp Axie | Bị động | Chủ động |
|---|---|---|---|
| Aurelion | Dawn | +12% sát thương chiêu | chùm sáng dọn cả bầy, 14s |
| Netherfang | Dusk | hút 8% sát thương thành HP | vùng bóng tối làm chậm 40%, 16s |
| Tidewarden | Aquatic | +15% HP tối đa | khiên nước hấp thụ 30% HP, 18s |
| Emberjaw | Beast | +10% tốc đánh | lao húc xuyên hàng, 12s |
| Voltcrest | Bird | +8% né | sét gọi xuống 5 mục tiêu, 15s |
| Ironshell | Reptile | −10% sát thương gánh chịu | khiêu khích, kéo địch về mình 8s |

**4★ — 10 con**: Petalkin · Crimsonmaw · Thornpaw · Inkmane · Cinderbeak · Mossback · Hexmite ·
Ridgehorn · Coghound · Sunspur. Bị động một dòng, chủ động một chiêu đơn giản.

**Art**: cả 16 con là ảnh Axie thật dựng từ 16 rig Spine khác nhau trong `axie-origins-asset-kit`
(`assets/chimera/*.png`, xem `docs/ASSET_SOURCING.md` mục Mười). Không con nào là bản biến thể của
con nào — hai con chỉ khác cái mũ thì trong bảng roster nhìn như lỗi trùng ảnh. Lớp và màu của
từng con chạy theo art, chứ không bắt art chạy theo bảng.

**3★**: không phải Chimera — là **Mảnh Huyết Thống** và nguyên liệu nâng cấp. (Genshin để vũ khí
3★ ở ô này; ta không có ô vũ khí trong banner này.)

---

## 9. Chồng lấn với hệ đang có — cần anh chốt

Đây là rủi ro lớn nhất của cả bản thiết kế, và nó là chuyện thiết kế chứ không phải chuyện code.

Game **đã có hai hệ đồng hành**:
- **Thú Chiến** — 5 giai (Petalkin → Crimsonmaw), nâng bằng bạc + Huyền Thiết, cưỡi được, tự đánh.
- **Linh Thú** — 3 con (Acorntail/Hexhorn/Bloomveil), nâng tới +11, có dòng phụ roll lại được.

Thêm Chimera Khế Ước là **hệ đồng hành thứ ba**. Ba lựa chọn:

| Cách | Được | Mất |
|---|---|---|
| **(a) Chimera thay hẳn Linh Thú** | một hệ đồng hành duy nhất, rõ ràng; dòng phụ + nâng +11 chuyển thẳng sang Chimera | phải chuyển đổi save cũ |
| **(b) Chimera thay hẳn Thú Chiến** | giữ Linh Thú làm "trang bị", Chimera làm "đồng hành chiến đấu" | mất tính năng cưỡi, mất 5 art thú đã có |
| **(c) Cả ba cùng tồn tại** | không phá gì cả | ba ô đồng hành, ba đường nâng cấp, ba bảng UI — đúng thứ khiến người chơi mới bỏ game |

**Tôi đề nghị (a).** Linh Thú đang là *một ô đồ có dòng phụ* chứ không phải một người bạn đồng
hành; biến nó thành roster Chimera quay ra được vừa cứu được toàn bộ cơ chế roll dòng phụ + nâng
+11 đã viết, vừa cho hệ gacha một chỗ đứng có sẵn thay vì mọc thêm một cái mới.

Ngoài ra **Vạn Duyên Các** (gacha 5 nhánh, không pity, ở Sảnh Cầu May) nên gộp luôn vào đây hoặc
gỡ — để hai hệ quay số cạnh nhau, một cái có pity một cái không, là dạy người chơi hai luật khác
nhau cho cùng một hành động.

---

## 10. Giao diện

1. **Màn Khế Ước**: 3 thẻ banner, đếm ngược ngày đổi banner, số vé đang có.
2. **Thẻ banner**: art con 5★ đang lên kệ, danh sách 3 con 4★, **bộ đếm pity hiện số thật**
   ("còn 27 lượt tới bảo đảm"), cờ "Lần 5★ tới CHẮC CHẮN là con đang lên kệ".
3. **Nút quay ×1 / ×10**, có nút bỏ qua hoạt cảnh.
4. **Hoạt cảnh**: một tia sáng theo màu phẩm (3★ lam · 4★ tím · 5★ vàng). Người chơi Genshin đọc
   màu tia trước khi thấy nhân vật — đó là cả cái cảm giác. Bỏ qua được bằng một phím.
5. **Trang tỉ lệ**: in đủ bảng §2 và §3, kể cả đường cong soft pity. Genshin công bố đầy đủ vì
   nhiều thị trường bắt buộc; ta không bán bằng tiền nên không bị bắt, nhưng vẫn nên in — giấu
   tỉ lệ là thứ làm người chơi mất lòng tin nhanh nhất.
6. **Lịch sử quay**: 6 tháng gần nhất, lọc theo phẩm.

---

## 11. Dữ liệu lưu

```
player.gacha = {
  pity5: 0,          // đếm từ 5★ gần nhất, banner Giao Kết
  pity4: 0,
  guaranteed: false, // lần 5★ tới có bảo đảm là con lên kệ không
  pity5Std: 0,       // bộ đếm riêng của Vĩnh Cửu
  pity4Std: 0,
  tickets: { giaoket: 0, coxua: 0 },
  dust: { nguyet: 0, tinh: 0 },
  owned: { aurelion: { con: 0, plus: 0, subs: [...] }, ... },  // con = bậc Huyết Thống 0-6
  history: [ { t, banner, id, star }, ... ],   // cắt còn 6 tháng
  noviceLeft: 20,
  monthlyShop: { thang: '2026-09', daDoi: 0 },
}
```

Bộ đếm pity **phải nằm trong save và phải chịu được reload giữa chừng** — mất pity là lỗi không
bao giờ được phép xảy ra.

---

## 12. Thứ tự làm

1. Bộ sinh số + pity + 50/50, kèm bài kiểm mô phỏng 1 triệu lượt đối chiếu §2/§3 *(không UI)*
2. Roster 6 con 5★ + 10 con 4★, bị động/chủ động, nối vào hệ đồng hành đã chốt ở §9
3. Nguồn vé §6, quầy đổi
4. Giao diện §10 + hoạt cảnh
5. Huyết Thống C1–C6
6. Banner Tân Thủ, lịch đổi banner

Mục 1 phải xanh trước khi làm mục 2 — sai số ở đây thì mọi thứ phía sau đều sai theo.

---

## 13. Chốt lại những gì cần anh quyết

1. **§9** — Chimera thay Linh Thú (đề nghị), thay Thú Chiến, hay cả ba cùng tồn tại?
2. **§5** — bỏ lớp mảnh 160:1 (đề nghị) hay giữ cho giống hệt Genshin?
3. **§6** — nhịp 2 vé/ngày → 47 ngày một con 5★. Nhanh hơn hay chậm hơn?
4. **§9** — Vạn Duyên Các: gộp vào đây, hay gỡ?
