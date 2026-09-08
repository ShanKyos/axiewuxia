# Nghiên cứu: map thật sự được làm thế nào — và tôi đã sai ở đâu

> Chủ dự án xem kết quả và nói **"không ăn thua, bắt đầu lại từ đầu"**. Tài liệu này không bào
> chữa. Nó tìm cho ra vì sao, bằng chứng cứ chứ không bằng cảm tưởng, rồi mới bàn đường đi.

---

## 1. Sai lầm gốc: TÔI GHÉP HAI PHÉP CHIẾU KHÔNG ĐỘI TRỜI CHUNG

Tất cả những gì tôi dựng mấy đợt vừa rồi đều là:

* **mặt đất** vẽ theo lối **nhìn thẳng từ trên xuống** (một dải phẳng, không có mặt bên nào), rồi
* **dán cây** vẽ theo lối **nhìn ngang** (thấy thân, thấy tán, như đứng dưới đất nhìn lên).

Hai lối nhìn ấy không thể cùng tồn tại trong một khung hình. Mắt đọc ra ngay: **hình dán lên
giấy dán tường.** Không có tấm art nào chữa được chuyện đó, vì nó không phải lỗi art — nó là lỗi
HÌNH HỌC. Tôi đã đổ ba đợt việc vào chữa triệu chứng (cỡ cây, mật độ cây, viền cây, tranh nền)
mà không đụng tới nguyên nhân.

## 2. Bằng chứng: map DUY NHẤT trong game đang đẹp, và nó khác hẳn

`bg_quangtruong.jpg` — Quảng Trường Cũ, chính là map chủ dự án chỉ vào và nói *"làm lại map theo
style isometric đúng kiểu như ở thành an toàn"*. Soi kỹ nó:

| Nó có | Tôi có |
|---|---|
| **Một phép chiếu isometric 2:1 duy nhất** — nhà, tường, thùng, hòm, hàng rào, cả viên đá lát đều nằm trên cùng một lưới | Hai phép chiếu chọi nhau |
| **Vật thể có KHỐI** — mỗi cái thùng thấy hai mặt, nên đọc ra chiều cao | Cây phẳng, dán face-on |
| **Chi tiết dày đặc** — thùng, hòm, hàng rào, biển hiệu, giá vũ khí, giếng, cây khô, đống đá | Cây, và không gì khác |
| **Ánh sáng NƯỚNG SẴN, có hướng rõ** — bóng đen dưới mái, đèn vàng ấm trong cửa sổ | Tôi tự tay yêu cầu *"flat and even, NO cast shadows"* |
| **Sàn đi được là một khoảng TRỐNG, SÁNG, ở giữa** — chỉ 10,9% khổ map | Sàn 33,9%, trải đều, không có tâm điểm |
| Mọi chi tiết nằm ở **RÌA**, chỗ người chơi không bao giờ bước vào | Chi tiết rải đều, chẳng đâu ra đâu |

**Điều đáng xấu hổ nhất là dòng ánh sáng.** Trong `PROMPT_NEN_LAN.md` tôi tự viết:
*"Lighting: flat and even across the whole image, as if overcast. NO cast shadows, NO vignette"* —
tôi ĐẶT HÀNG đúng cái làm cho tranh chết. Lý do khi đó nghe có vẻ đúng ("engine tự vẽ bóng"),
nhưng engine **không vẽ bóng cho decor**: `drawTree()` nhánh art vẽ xong `drawImage` là thoát
ngay, không có một nét bóng nào (`drawObstacleRim` thì CÓ — `game.js:1940`). Tôi bỏ ánh sáng đi
rồi không thay bằng gì cả.

## 3. Ba khiếm khuyết ĐO ĐƯỢC

**① Mật độ chi tiết — tấm của tôi thưa nhất game.** Năng lượng biên trung bình:

| tranh | biên |
|---|--:|
| `bg_corran` (Gemini vẽ) | 14,9 |
| `bg_quangtruong` (đã duyệt) | 11,9 |
| `bg_daohoa` | 7,6 |
| **`bg_loimon` (của tôi)** | **6,8** |

**② Không có bóng tiếp đất.** Nghiên cứu craft nói thẳng: bóng là công cụ CHÍNH để vật thể
"dính" xuống đất, và nó còn làm **va chạm đọc được** — người chơi nhìn ra chỗ nào đâm vào được.
Cây/đá trong game không có bóng nào.

**③ Không có tâm điểm.** Quảng Trường Cũ có một quảng trường sáng ở giữa, mọi thứ vây quanh.
Làn của tôi trải đều 6400px, không chỗ nào là "đây rồi".

## 4. Vậy nghề làm map thật ra là gì

**MU Online** — chính thứ đang tri ân — tách map làm ba tệp, và đó là ba LỚP chứ không phải ba
thư mục: `.map` = mặt đất, `.obj` = danh sách vật thể (vị trí + góc xoay của từng mô hình),
`.att` = thuộc tính ô (đi được / vùng an toàn / cấm). Tôi đã mò ra đúng ba lớp ấy
(`bg_*` + `vatDat` + `diTrong`) — **cấu trúc không sai, cái sai là ART bên trong mỗi lớp.**

Nghề 2D nói thêm hai điều tôi bỏ qua:

* **Lát tile chứ không vẽ một tấm khổng lồ.** Tấm to thì mỗi pixel chỉ được ngó một lần, không
  có ngân sách chi tiết; tile thì một viên vẽ kỹ được dùng lại nghìn lần, và ghép ngẫu nhiên nên
  không lộ lặp. Đây là lý do map tile nhìn "đặc" hơn map vẽ tay ở cùng dung lượng.
* **Nhiều lớp chồng nhau** mới ra chiều sâu: nền → vệt đất → vật nhỏ → vật lớn → tiền cảnh.

## 5. Ba đường đi, nói thẳng giá

### A. Diorama isometric vẽ tay — GIỐNG HỆT Quảng Trường Cũ
Mỗi map là một tấm vẽ tay, isometric 2:1, dày chi tiết, ánh sáng nướng sẵn, sàn đi được là
khoảng trống ở giữa. `diTrong` ôm sát khoảng trống ấy.
*Được:* chắc chắn ra đúng thứ chủ dự án đã duyệt — vì nó CHÍNH LÀ thứ đã duyệt.
*Mất:* map nhỏ lại (sàn ~10-20% thay vì 34%), và mất kiểu "đi mãi tới cuối map". Mỗi map một
lần sinh, không tái dùng được gì.

### B. Bộ tile isometric + danh sách vật thể
Vẽ một BỘ: ~20 viên nền, ~15 vật thể, tất cả cùng lưới 2:1. Map ghép từ bộ ấy.
*Được:* làm một lần dùng cho cả tám map; sửa bố cục không cần sinh lại tranh; map to bao nhiêu
cũng được; đúng cách MU Online làm.
*Mất:* đợt việc lớn nhất, và cần một trình ghép map. Rủi ro cao nhất — ba lần nướng tile trước
đây đều hỏng (xem `PROMPT_MAP_ISOMETRIC.md` §2), tuy cả ba đều hỏng vì **phóng to** dải art có
sẵn chứ không phải vì lối tile sai.

### C. Vá tại chỗ: giữ tấm vẽ tay, thêm bóng + chi tiết
Thêm bóng tiếp đất cho mọi decor, nướng ánh sáng có hướng vào tranh nền, nhồi thêm vật nhỏ.
*Được:* rẻ nhất, một hai ngày.
*Mất:* **không chữa được lỗi gốc** — hai phép chiếu vẫn chọi nhau. Sẽ đẹp hơn hiện tại nhưng
vẫn không bằng Quảng Trường Cũ.

## 6. Tôi đề nghị A, và đề nghị bỏ cái làn

Không phải vì làn sai về lối chơi — đo đạc cho thấy nó chạy tốt (sàn liền khối, quái đặt đúng,
bề ngang đủ đánh nhau). Mà vì **art của làn đòi đúng thứ khó nhất**: 6400px chiều ngang thì
không lấy đâu ra ngân sách chi tiết để đặc như Quảng Trường Cũ, và cắt đôi ghép lại càng khó
giữ ánh sáng thống nhất.

Quảng Trường Cũ đặc được **chính vì nó nhỏ và khép**. Đó là bài học, không phải sự tình cờ.

Nếu vẫn muốn cảm giác "đi theo một con đường tới cuối map" thì làm bằng **CHUỖI map nhỏ** nối
nhau bằng cổng — mỗi map một diorama đặc, đi hết ba bốn cái là hết chặng. Đúng cách MU Online và
Diablo II vẫn làm, và mỗi tấm vẫn giữ được mật độ chi tiết.

## 7. Việc cần làm trước khi viết một dòng mã nào

1. **Chốt lối art** (A / B / C) — vì nó quyết định mọi thứ sau đó.
2. Nếu chọn A: viết prompt sinh diorama, lấy `bg_quangtruong.jpg` làm ảnh tham chiếu khoá phong
   cách, và **bỏ hẳn** câu "flat lighting, no shadows" khỏi mọi prompt.
3. Dù chọn gì cũng phải thêm **bóng tiếp đất cho decor** — rẻ, và nghiên cứu nói đó là thứ nặng
   ký nhất để vật thể dính xuống đất.

## 8. Nguồn

* [MU Online map format (.map / .obj / .att) — RaGEZONE](https://forum.ragezone.com/threads/map-editing.1049505/)
* [Tiles and tilemaps overview — MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/Tilemaps)
* [Top-down game pixel art: bóng và cảm giác khối — Sandro Maglione](https://www.sandromaglione.com/articles/pixel-art-top-down-game-sprite-design-and-animation)
* [Parallax scrolling — Wikipedia](https://en.wikipedia.org/wiki/Parallax_scrolling)
