# Bảy Hướng Axie

Bảy cách đưa Axie sâu hơn vào lối chơi, lấy MU Online và Diablo làm gương. Mỗi ý
ghi rõ nó động vào đoạn mã nào, tốn bao nhiêu, và hỏng ở đâu — để chọn được mà
không phải đoán.

Số liệu đọc trực tiếp từ `public/game/game.js` ở commit `fc53edb`. Chỗ nào chưa
kiểm được thì ghi rõ là chưa kiểm.

Bản đọc trên web: https://claude.ai/code/artifact/3906a7be-4661-4e74-ae54-189ab06d103e

---

## Bảng chọn nhanh

| # | Ý tưởng | Nguồn | Đổi cảm giác chơi | Công sức | Rủi ro | Chốt |
|---|---------|-------|-------------------|----------|--------|------|
| 7 | Axie lên cấp cùng bạn | riêng | rất nhiều | nhỏ | thấp | **Làm trước** |
| 6 | Lồng Axie trong màn | Diablo | nhiều | vừa | thấp | **Làm thứ hai** |
| 1 | Ghép Axie ở Lò Hỗn Độn | MU | nhiều | vừa | save | Gộp với #4 |
| 4 | Axie có dòng phụ ngẫu nhiên | Diablo | nhiều | lớn | cân bằng | Gộp với #1 |
| 2 | Cánh Axie thay Wing | MU | ít | nhỏ | thấp | Rẻ, nhưng chật màn |
| 3 | Bộ phận Axie thay ngọc | MU | rất ít | vừa | thấp | Đẹp ý, ít lời |
| 5 | Hệ Axie khắc chế | Diablo | vừa | lớn | vướng | Có vật cản thật |

---

## #7 — Axie lên cấp cùng bạn, không mua bậc mới

> Một con đi cùng suốt hành trình, ăn kinh nghiệm, tiến hoá qua năm hình. *(ý riêng)*

**Cơ chế.** Hiện tại năm bậc Thú Chiến là mua đứt: đủ bạc và Huyền Thiết thì bấm
nâng, có tỉ lệ thành công. Đổi thành: bạn nhận một Axie ở cấp 10 và nó theo bạn
mãi. Nó ăn một phần kinh nghiệm bạn kiếm được, và tiến hoá khi đủ ngưỡng. Năm
hình đã có sẵn, không cần vẽ thêm: Petalkin → Tidenip → Emberpaw → Stonetusk →
Crimsonmaw.

**Vì sao hợp.** Đây là tinh thần Axie đúng nghĩa — gắn bó với một con, không phải
"đủ tiền thì đổi con khác". Cùng một tấm ảnh, nhưng cảm giác khác hẳn: con Axie
đó đi với bạn từ cấp 10 tới cấp 120. Cũng gỡ được một chỗ khó chịu: bậc 5 mở ở
cấp 85 mà giá 15.000 bạc, người chơi thường đã dư bạc từ lâu — nên nó không còn
là mục tiêu, chỉ là thủ tục.

**Đụng vào đâu.** `player.mount` hiện là `{ tier, out }`. Thêm `exp`. Không đổi
cấu trúc, chỉ thêm một trường — save cũ vẫn đọc được, mặc định 0. `MOUNT_TIERS`
giữ nguyên chỉ số; bỏ `cost` và `rate`, thay bằng ngưỡng kinh nghiệm. Bảng nâng
cấp đổi từ nút "Nâng Bậc" sang thanh tiến độ.

**Cái giá.** Mất một chỗ tiêu bạc. Hiện năm bậc hút tổng **30.300 bạc** và
**235 Huyền Thiết** khỏi nền kinh tế. Bỏ đi thì phải bù chỗ khác, hoặc giữ lại
một khoản phí nhỏ cho mỗi lần tiến hoá.

**Đáng làm.** Đổi cảm giác chơi nhiều nhất trong bảy ý, mà lại động vào ít mã
nhất và không cần thêm một tấm ảnh nào.

*Công sức: nhỏ · Rủi ro: thấp · Cần art mới: không*

---

## #6 — Lồng Axie rải trong màn

> Mở lồng ra được một Axie — đúng cái cốt truyện màn mở đầu đã hứa. *(Diablo)*

**Cơ chế.** Diablo rải rương khoá cần chìa. Ở đây là lồng Axie nằm rải trong các
vùng, cần chìa rơi từ quái tinh anh. Mở ra một Axie ngẫu nhiên — có thể là con
bạn chưa có, có thể trùng và quy đổi thành nguyên liệu.

**Vì sao hợp.** Màn mở đầu đã vẽ sẵn bốn cái lồng có sinh vật bên trong, và dòng
dẫn truyện là "Chọn lớp và đặt tên — rồi đi cứu chúng về". Hiện lời hứa đó không
được thực hiện ở bất kỳ đâu trong game. Đây là ý duy nhất trong bảy ý đóng lại
một sợi dây cốt truyện đang bỏ ngỏ.

**Đụng vào đâu.** Đã có sẵn khuôn mẫu: `HERB_SPOTS` là vật thể rải theo từng bản
đồ, tương tác được, có hồi sinh. Lồng Axie dùng lại đúng cấu trúc đó. Cần thêm:
một mục vật phẩm chìa khoá, và bảng quy đổi khi trùng con.

**Cái giá.** Chỉ có nghĩa nếu Axie là thứ sưu tầm được nhiều con — tức phải làm
sau hoặc cùng lúc với ý #1 hoặc #7. Làm một mình thì mở lồng ra chẳng để làm gì.

*Công sức: vừa · Rủi ro: thấp · Cần art mới: không — còn 7 con đã ghép sẵn chưa dùng*

---

## #1 — Ghép Axie ở Lò Hỗn Độn

> Hai con cùng bậc cộng ngọc ra một con bậc cao hơn — hoặc mất cả hai. *(MU)*

**Cơ chế.** MU cho ném đồ và ngọc vào Chaos Machine ăn may. Ở đây: đặt hai Axie
cùng bậc cộng ngọc vào khay, bấm ghép. Thành công ra một con bậc cao hơn, thất
bại mất cả hai. Đây chính là *breeding* của Axie gốc, chỉ khoác lên bộ máy cờ bạc
mà game đã có.

**Vì sao hợp.** Lò rèn đã là cỗ máy trung tâm, đã có tỉ lệ thành công, đã có bùa
giữ đồ, đã có ba nhóm tab. Thêm nhóm thứ tư là chuyện tự nhiên chứ không phải hệ
thống ghép vào.

**Đụng vào đâu.** Công thức lò là vật khai báo: mỗi cái có `match()`, `plan()`,
`run()`. Thêm một công thức là thêm một vật vào danh sách — không sửa gì trong bộ
máy. Phần nặng nằm chỗ khác: `player.mount` hiện chỉ giữ **một** bậc đang sở hữu.
Muốn ghép thì phải thành bộ sưu tập — đó là đổi cấu trúc save, cần một bước
chuyển đổi cho người chơi cũ.

**Cái giá.** Bước chuyển save là chỗ dễ làm hỏng dữ liệu người chơi nhất. Phải
viết cẩn thận và có bài kiểm riêng cho save cũ.

*Công sức: vừa · Rủi ro: save · Cần art mới: không*

---

## #4 — Axie có dòng phụ ngẫu nhiên như đồ Diablo

> Cùng một Petalkin, nhưng con của bạn khác con của người khác. *(Diablo)*

**Cơ chế.** Mỗi con roll 1–3 dòng phụ lúc nhận được: hút máu, nổ khi hạ mục tiêu,
giảm hồi chiêu, tăng đồng rơi… Con roll đẹp là thứ đáng khoe và đáng giữ.

**Vì sao hợp.** Game đã có Khắc Ấn — những dòng đổi hẳn cách chiêu chạy, chứ
không chỉ cộng số. Từ vựng và cảm giác đã sẵn, chỉ là đem sang cho Axie. Đây là
thứ giữ chân người chơi farm: không phải "đủ bạc là xong", mà là "con này chưa
đẹp, đi kiếm con khác".

**Đụng vào đâu.** Hiện `MOUNT_TIERS[i]` là một khối chỉ số cố định, dùng chung.
Mỗi con phải có dữ liệu riêng — cùng một thay đổi cấu trúc save mà ý #1 cần.

**Cái giá.** Rủi ro cân bằng thật. Một con roll ba dòng mạnh có thể vượt cả chênh
lệch giữa hai bậc — lúc đó bậc mất ý nghĩa. Phải chặn trần theo bậc.

> **Lưu ý.** #1 và #4 cùng cần một thứ: biến Axie từ "một bậc đang sở hữu" thành
> "bộ sưu tập có dữ liệu riêng từng con". Làm tách ra là làm hai lần. Nên gộp.

*Công sức: lớn · Rủi ro: cân bằng · Cần art mới: không*

---

## #2 — Cánh Axie thay cho Wing

> Không phải cánh mọc trên lưng người, mà là một Axie bám lưng. *(MU)*

**Cơ chế.** Wing là biểu tượng cấp cuối của MU — nhìn thấy cánh là biết người đó
đã đi xa. Giữ nguyên vai trò đó, đổi hình: một Axie nhỏ bám sau lưng, xoè ra khi
bay hoặc khi tung tuyệt kỹ.

**Vì sao hợp.** Rẻ nhất trong bảy ý. `WING_DEFS` đã tồn tại với đầy đủ chỉ số
(Cánh Thiên Thần, Cánh Tiểu Quỷ…), đã có ô trang bị riêng, đã vẽ trong màn. Chỉ
đổi art và tên, không đụng một dòng cân bằng nào.

**Đụng vào đâu.** `WING_DEFS` đổi tên và màu. Phần vẽ trong `drawPlayer` đổi từ
hình cánh sang ảnh Axie. Icon ô túi đã đi qua nhánh vật phẩm đặc biệt sẵn có.

**Cái giá.** Đây là điểm yếu thật của ý này: đã có một Axie đi theo bạn rồi (Thú
Chiến). Thêm một Axie nữa bám lưng thì màn hình có hai con Axie cùng lúc — dễ rối
và làm loãng chính con đồng hành.

*Công sức: nhỏ · Rủi ro: thấp · Cần art mới: không — nhưng nên là dáng khác hẳn Thú Chiến*

---

## #3 — Bộ phận Axie thay cho ngọc

> Sáu loại ngọc, sáu bộ phận Axie — trùng khít không cần ép. *(MU)*

**Cơ chế.** MU có Bless, Soul, Chaos. Axie gốc có sáu bộ phận: mắt, tai, sừng,
mõm, lưng, đuôi. Đổi hệ ngọc thành thu thập bộ phận, mỗi loại cộng chỉ số khác
nhau khi khảm.

**Vì sao hợp.** Con số trùng khít một cách hiếm thấy: game đang có đúng **sáu**
loại ngọc — Chúc Phúc, Linh Hồn, Sinh Mệnh, Hỗn Độn, Tu La, Hỗn Nguyên. Không
phải cắt bớt hay bịa thêm.

**Đụng vào đâu.** Sáu khoá trong `KHO_NGOC_KEYS`, bốn viên khảm được trong
`CHAOS_JEWELS`, ngân hàng ngọc, bảng rơi đồ, và toàn bộ chuỗi hiển thị ở cả hai
ngôn ngữ.

**Cái giá.** Đây là đổi tên thuần tuý — không thêm một cơ chế nào. Nhiều chỗ phải
sửa, mà lối chơi không đổi chút nào. Đẹp về mặt chủ đề, ít lời về mặt trò chơi.

*Công sức: vừa · Rủi ro: thấp · Cần art mới: có — sáu icon bộ phận*

---

## #5 — Hệ Axie làm tam giác khắc chế

> Đổi Axie theo bản đồ, như đổi kháng nguyên tố trong Diablo. *(Diablo)*

**Cơ chế.** Axie gốc có sáu hệ khắc chế vòng tròn. Cho Axie đồng hành cộng sát
thương khi khắc hệ quái trong vùng đang đứng. Người chơi sẽ đổi Axie theo bản đồ
thay vì luôn dùng con mạnh nhất.

**Vì sao hợp.** Game đã gán hệ cho mọi con quái — 77 con đều có trường `el`. Hạ
tầng đã sẵn, chỉ thiếu chỗ dùng.

**Đụng vào đâu.** Một hệ số nhân trong đường tính sát thương, cộng bảng khắc chế.
Bản nhỏ nhất là một hàm và một bảng tra.

**Cái giá.** Nếu muốn dùng đúng sáu hệ Axie thì phải gán lại hệ cho 77 con quái,
và sửa mọi chỗ hiển thị hệ.

> **Vật cản.** Game đang dùng **năm** hệ Kim · Mộc · Thuỷ · Hoả · Thổ. Axie có
> **sáu** lớp. Không có cách ánh xạ sạch. Hoặc chấp nhận bỏ một lớp Axie, hoặc
> gán lại toàn bộ 77 con quái. Đây là ý duy nhất có vật cản thật sự, và nó nằm ở
> chỗ khó thấy trước khi bắt tay.

*Công sức: lớn · Rủi ro: vướng · Cần art mới: có — sáu icon hệ*

---

## Khuyến nghị — làm theo thứ tự này

1. **Ý #7 trước.** Động vào ít mã nhất, không cần thêm ảnh, không đổi cấu trúc
   save, mà đổi cảm giác chơi nhiều nhất. Làm xong là biết ngay hướng Axie có
   "ăn" hay không, trước khi đầu tư sâu hơn.
2. **Ý #6 tiếp.** Đóng lại lời hứa "đi cứu Axie" mà màn mở đầu đã nêu. Dùng lại
   khuôn vật thể rải theo bản đồ đã có, và bảy con Axie đã ghép sẵn còn chưa dùng.
3. **#1 và #4 cùng một đợt.** Cả hai cùng cần biến Axie thành bộ sưu tập có dữ
   liệu riêng từng con. Tách ra là làm hai lần cùng một việc, và phải viết bước
   chuyển save hai lần.
4. **#2 và #3 để sau.** Rẻ nhưng đổi ít. Làm khi cần một đợt đánh bóng chủ đề,
   không phải bây giờ.
5. **#5 để cuối, hoặc bỏ.** Vật cản năm hệ so với sáu lớp là thật. Nếu vẫn muốn,
   làm bản nhỏ: giữ năm hệ, chỉ cộng sát thương khi khắc — đừng gán lại 77 con quái.

---

## Nguồn art hiện có

Không ý nào trong năm ý đầu cần đặt vẽ mới. Kho hiện có:

| Nguồn | Số lượng | Tình trạng |
|-------|----------|------------|
| Axie ghép từ rig Spine | 12 con | 5 đã dùng cho Thú Chiến, còn 7 |
| Chân dung trong kit | 22 cái | 19 đã dùng cho quái, còn 1 hợp |
| Axie khoá trong `.skel` | 26 con | Cần viết bộ đọc nhị phân |

---

**Một điều cần nói rõ.** Bảng công sức và rủi ro ở trên là ước lượng từ việc đọc
mã, không phải từ việc đã làm thử. Ý #1 và #4 có bước chuyển đổi save — đó là chỗ
duy nhất trong bảy ý có thể làm hỏng dữ liệu người chơi thật, nên nếu chọn hai ý
đó thì phải có bài kiểm riêng cho save cũ trước khi đẩy lên.
