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

---

# PHẦN HAI — các lối làm map khác, và một lối CHẠY ĐƯỢC NGAY TẠI ĐÂY

> Chủ dự án bác cả ba lối ở §5 và bảo tra rộng hơn, đồng thời chốt **GIỮ LÀN, chỉ thay art**.
> Phần này là kết quả tra tiếp — và một thứ tôi đã bỏ sót hoàn toàn.

## 9. Thứ tôi bỏ sót: DỰNG 3D RỒI NƯỚNG RA 2D

Đây là cách **Diablo II thật sự làm**: nhân vật và quái dựng 3D rồi nướng thành sprite 2D nhiều
hướng; nền là tile isometric 2D. StarCraft, Age of Empires cũng vậy. Tôi bàn cả đợt về "vẽ tay
hay lát tile" mà quên mất lối thứ ba — thứ chính các game trong thể loại này dùng.

**Và nó chạy được ngay trong máy này.** `pip install bpy` xong là có Blender 5.0.1 dạng thư viện
Python, chạy không cần màn hình. Tôi đã dựng thử và nướng thật:

* `tools/iso/thu_canh.py` → `docs/thu.png` — một khúc làn: mặt đất, lối mòn, hai hàng cây, mấy
  tảng đá. **7 giây** cho 768×560, tức khổ 6400×1400 mất khoảng **2-3 phút**.
* `tools/iso/thu_vatthe.py` → `docs/cay_prop.png` — một cái cây rời, nền trong suốt.

### Nó cho không ba thứ mà tôi đã chật vật cả tuần

| Vấn đề đã vật lộn | 3D cho không |
|---|---|
| **Hai phép chiếu chọi nhau** | Một cảnh 3D, một camera trực giao → mọi vật TỰ ĐỘNG cùng phép chiếu. Không thể sai. |
| **Không có bóng tiếp đất** | Mặt trời thật, bóng thật. Sprite vật thể nướng ra đã **mang sẵn bóng của chính nó** trong kênh alpha — đo được: 19% khung là bán trong suốt, đó chính là cái bóng. |
| **Chi tiết thưa** | Chi tiết là hình học, không phải công vẽ tay. Map dài 6400px không tốn thêm công — chỉ tốn thời gian nướng. |

**Điểm này lật ngược đề nghị bỏ làn của tôi.** Tôi khuyên bỏ làn vì "6400px không đủ ngân sách
chi tiết" — đúng với tranh vẽ tay, **sai với 3D**. Giữ làn là quyết định hợp lý.

⚠ Ghi để đừng tự bắn vào chân: `tools/go_vien.py` sẽ chấm sprite nướng từ 3D là **−132 "quầng
tối"**. Đó KHÔNG phải lỗi — đó là cái bóng đổ, và nó phải tối. Đừng "chữa" nó.

### Nó chưa cho cái gì

Ảnh thử nhìn ra hình khối trơn, vì nó **đúng là hình khối trơn** — nón với trụ, không vân, không
chất liệu. Muốn bằng Quảng Trường Cũ thì phải có mô hình và vân bề mặt tử tế. Đó là công việc
thật, không phải bấm nút.

## 10. Ba lối nữa, tra được nhưng chưa thử

**E · 3D làm NỀN, AI vẽ đè lên.** Nướng cảnh 3D (khoá đúng phép chiếu, ánh sáng, bố cục), rồi
đưa qua một lượt img2img để nó "vẽ" thành tranh. Lấy được cái chắc của 3D và cái đẹp của tranh.
Đây nhiều khả năng là câu trả lời thật, nhưng cần công cụ img2img có điều khiển — Gemini nhận
ảnh tham chiếu nên có cửa, phải thử mới biết giữ được bố cục tới đâu.

**F · Bản đồ pháp tuyến + đèn động trong engine.** Vẽ tay thêm một tấm normal map cho mỗi sprite,
engine chiếu đèn lên nó → art 2D phẳng bỗng có khối và đổ bóng theo đèn chạy. *The Siege and the
Sandfox* làm thế. Rẻ hơn 3D, nhưng phải vẽ tay normal map cho từng thứ, và engine phải viết thêm
lớp chiếu sáng.

**G · Mua/lấy bộ art isometric có sẵn (CC0).** Không làm art nữa, dùng bộ đã có của người khác.
Nhanh nhất, chắc nhất về chất lượng. Đổi lại: mất bản sắc riêng, và phải soi kỹ giấy phép.

**H · Sinh tự động (WFC / nhiễu).** Hợp với map ngẫu nhiên vô hạn, không hợp với tám map có bố
cục cố định và có nhiệm vụ neo vào. Loại.

## 11. Đề nghị: D làm xương, E làm da — và làm thử một khúc trước

1. **Dựng bộ mô hình 3D thô** cho làn: mặt đất, lối mòn, 3-4 dáng cây, 3 tảng đá. Thô thôi.
2. **Nướng một khúc 1600×1400** (một màn hình), chưa nướng cả làn.
3. **Đưa khúc ấy qua một lượt AI vẽ đè**, giữ nguyên bố cục.
4. **Lắp vào game, chụp, so với ảnh Quảng Trường Cũ.** Nếu chưa bằng thì mới biết thiếu ở đâu —
   và lần này thiếu chỗ nào sẽ nhìn ra được, vì phép chiếu và ánh sáng đã đúng sẵn.

Một khúc chứ không cả làn: nếu sai thì mất một buổi, không mất cả đợt art.

## 12. Nguồn phần hai

* [Diablo II dựng 3D rồi nướng ra sprite 2D — GameDev.net](https://www.gamedev.net/forums/topic/487300-question-about-diablo-2s-sprites/4183301/)
* [Nướng art isometric từ 3D — GameDev.net](https://gamedev.net/forums/topic/663241-isometric-assets-3d-to-2d/5195312)
* [Normal map vẽ tay cho art 2D — The Siege and the Sandfox, Game Developer](https://www.gamedeveloper.com/art/adding-depth-to-2d-with-hand-drawn-normal-maps-in-i-the-siege-and-the-sandfox-i-)
