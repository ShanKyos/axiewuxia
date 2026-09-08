# Các game cùng lối chơi dựng map thế nào — khảo sát, và đề xuất lại

> Chủ dự án bảo tra Ragnarok, Path of Exile, **và các game khác cùng lối chơi / cùng cách di
> chuyển** với Axie Rift. Đây là bản khảo sát đầy đủ, rồi mới tới đề xuất.
>
> Axie Rift hiện tại: canvas 2D, click-to-move + WASD, camera nhìn xuống, bãi quái, PK. Tức là
> đúng họ hàng của **MU Online · Ragnarok · Diablo · Path of Exile · Tibia**.

---

## 1. Bảng khảo sát

| Game | Mặt đất | Vật thể | Dữ liệu đi được | Art làm ra sao | Lắp map |
|---|---|---|---|---|---|
| **MU Online** | `.map` — lưới texture | `.obj` — danh sách mô hình + vị trí + góc xoay | `.att` — cờ từng ô: đi được / vùng an toàn / cấm | 3D thời thực | Tay, bằng MuWorld Editor |
| **Ragnarok Online** | `.gnd` — lưới **khối lập phương 10 đơn vị**, mỗi khối 2 tam giác, có texture + lightmap **nướng sẵn** | `.rsw` — mô hình 3D, nước, đèn, nguồn âm, hiệu ứng | `.gat` — **cờ từng ô**: đất / vách / nước, kèm cao độ 4 góc | Nền 3D, **nhân vật/quái là sprite 2D, 8 hướng** | Tay |
| **Diablo I** | Tile 2D, **không** ghép từ khối dựng sẵn — sinh **từng ô một bằng thuật toán** | Trong chính tileset | Suy từ loại tile | Vẽ tay | Máy sinh 100% |
| **Diablo II** | Tile isometric 2D (`.dt1`), map `.ds1` | Sprite riêng | Lớp thuộc tính riêng | **Dựng 3D rồi NƯỚNG ra sprite 2D** | Lai: phòng tay + nối máy |
| **Path of Exile** | Hình học theo **tile** | Trong tile + rải thêm | Theo tile | 3D thời thực | **Lai: "room" vẽ tay + "tile key" khớp mép, cho phép CHỒNG phòng** để bố cục đỡ vuông vức |
| **Tibia** | Ô 2D xếp **chồng thành cột** | Vật thể nằm trong cột | Cờ từng ô | Vẽ tay, pixel | Tay |
| **Project Zomboid** | Ô isometric xếp **cột nhiều tầng** | Trong cột | Lớp va chạm riêng | Vẽ tay + nướng 3D | Tay + máy |
| **Axie Rift (đang có)** | **MỘT tấm tranh khổng lồ** | `vatDat` + decor ngẫu nhiên | `diTrong` + `MAP_OBSTACLES` | Sinh AI cả tấm | Tay |

## 2. Ba điều KHÔNG game nào làm khác

**① Không game nào vẽ một tấm tranh khổng lồ làm map.** Không một game nào. Tất cả đều ghép từ
mảnh nhỏ dùng lại. Đây là chỗ Axie Rift lệch khỏi cả ngành, và là gốc của mọi bế tắc mấy đợt qua.

Vì sao mảnh nhỏ lại ĐẶC hơn tranh to: một viên tile vẽ kỹ được dùng lại hàng nghìn lần, nên
"ngân sách chi tiết" đổ hết vào một viên. Tranh to thì mỗi pixel chỉ được ngó đúng một lần —
cùng công sức, trải mỏng ra 9 triệu điểm ảnh. Đo được ngay trong game này: `bg_loimon` của tôi
có mật độ biên **6,8**, thấp nhất, đúng vì nó là một tấm to trải mỏng.

**② Cả ba đều tách làm ĐÚNG BA LỚP** — mặt đất / vật thể / thuộc tính đi được. MU gọi là
`.map/.obj/.att`, RO gọi là `.gnd/.rsw/.gat`. Axie Rift đã có đúng ba lớp ấy
(`bg_*` / `vatDat` / `diTrong`) — **cấu trúc không sai**, chỉ sai ở chỗ lớp mặt đất là một tấm
tranh thay vì một lưới tile.

**③ Ánh sáng nướng sẵn vào mặt đất.** RO nướng hẳn **lightmap** vào `.gnd`. Đó chính là thứ tôi
tự tay loại bỏ khi viết *"flat and even lighting, NO cast shadows"* trong prompt.

## 3. Hai điều đáng học riêng

**Path of Exile — "room" vẽ tay + khớp mép + CHỒNG PHÒNG.** Bố cục không phải lưới vuông cứng:
các phòng vẽ tay được phép chồng lên nhau, luật khớp "tile key" xử lý chỗ giao. Đó là cách thoát
khỏi cảm giác bàn cờ mà vẫn dùng lại được mảnh. Với Axie Rift, "room" tương đương một **khoảnh**
— và tôi đã có sẵn khái niệm ấy trong làn (ba khoảnh chia bằng nút thắt).

**Ragnarok — nền 3D, nhân vật 2D tám hướng.** RO trộn hai thứ mà vẫn không lệch, vì **cả hai
đều được nướng/dựng theo CÙNG một góc camera cố định**. Đó chính xác là điều tôi vi phạm: nền
nhìn từ trên xuống, cây nhìn ngang. Không phải "không được trộn 2D với 3D" — mà là **mọi thứ
phải cùng một góc nhìn**.

## 4. Ràng buộc của chính engine này

Đo được, không đoán:

* Vẽ hoàn toàn bằng **canvas 2D `drawImage`** (62 chỗ gọi), **không có WebGL** → tile isometric
  chạy tốt, nhưng địa hình 3D thời thực kiểu RO/PoE thì không.
* **Đã có sẵn xếp lớp theo trục y** (`game.js:11098`) → phần khó nhất của isometric đã xong.
* **Đã có khổ map riêng từng map** và **đa giác đi được** → tương đương `.gat`/`.att`.
* Art hiện 62 MB, riêng map 7,7 MB. Một bộ tile ~30 viên 256px chỉ tốn khoảng **2-3 MB** cho cả
  tám map — **nhẹ hơn hiện tại**, vì thôi không phải chở tám tấm tranh 1 MB.

Kết luận: **thứ duy nhất còn thiếu là bộ tile + trình ghép.** Ba lớp và xếp lớp theo y đã có.

## 5. Điều làm thay đổi mọi thứ: sinh MẢNH NHỎ dễ hơn sinh TRANH TO rất nhiều

Mọi lần hỏng của tôi đều là **đòi model vẽ một cảnh to mà mạch lạc**: hòn đảo trọn vẹn, làn
6400px, hai tấm phải cùng tông. Cái khó nằm ở chữ **mạch lạc trên diện rộng** — đúng chỗ model
sinh ảnh yếu nhất.

Nhưng bộ tile **không đòi mạch lạc diện rộng**. Nó đòi:

* một viên cỏ 256×256 **lặp liền mép** — việc nhỏ, kiểm được bằng cách lát thử 3×3
* một viên đường mòn, vài viên chuyển cỏ↔đường
* 4-6 dáng cây rời, 3-4 tảng đá rời, nền trong suốt

**Mỗi món là một lần sinh nhỏ, độc lập, hỏng thì sinh lại một món chứ không phải cả map.** Và
đây đúng là thứ các model sinh ảnh làm tốt.

Ba lần nướng tile hỏng trước đây (ghi ở `PROMPT_MAP_ISOMETRIC.md` §2) **không phải bằng chứng
chống lại tile** — cả ba đều hỏng vì tôi **phóng to một dải art có sẵn**, chưa lần nào thử
**sinh mới một viên tile**. Đó là hai việc khác hẳn.

## 6. ĐỀ XUẤT: bộ tile isometric + trình ghép, giữ nguyên cái làn

Chủ dự án đã chốt giữ làn. Với tile thì giữ được thật, vì map dài **không tốn thêm art** — chỉ
thêm dữ liệu ghép.

### Việc phải làm, theo thứ tự, mỗi bước đều kiểm được

**Bước 1 — bộ tile tối thiểu (một buổi).**
Sinh bằng AI, từng món một: 1 viên cỏ · 1 viên đất mòn · 4 viên chuyển · 4 dáng cây · 3 tảng đá.
Nghiệm thu bằng máy: lát 3×3 xem có lộ mạch không, và cây phải có nền trong suốt.

**Bước 2 — trình ghép trong engine (một buổi).**
Vẽ tile trước theo thứ tự hoạ sĩ, rồi thả vào đúng danh sách entity xếp theo y đã có. Đây là
phần rẻ nhất — engine đã làm sẵn phần khó.

**Bước 3 — lát lại Lối Mòn Corran từ chính `diTrong` đang chạy.**
Máy tự chọn viên: trong lối mòn thì đất, trong hành lang thì cỏ, ngoài thì nền rừng, mép thì
viên chuyển. Không đặt tay một viên nào.

**Bước 4 — chụp, so với Quảng Trường Cũ, rồi mới quyết nhân ra bảy map còn lại.**

### Nếu bước 1 hỏng

Còn hai đường lùi, cả hai đã kiểm được là chạy:
* **Nướng tile từ 3D** — Blender đã chạy được trong máy này (đã nướng thử, 7 giây/ảnh). Cho ra
  phép chiếu và bóng đổ đúng tuyệt đối, chỉ thiếu chất liệu bề mặt.
* **Bộ tile CC0 có sẵn** — nhanh nhất, đổi lại mất bản sắc riêng.

## 7. Việc tôi đề nghị BỎ

`bg_loimon.jpg` (tấm hàng chờ) và cả lối "sinh tranh nền cả tấm" trong `PROMPT_NEN_LAN.md`.
Không phải vì làm sai quy trình, mà vì **cả ngành không ai làm thế**, và mật độ chi tiết đo được
đã nói trước kết quả.

## 8. Nguồn

* [MU Online — .map / .obj / .att](https://forum.ragezone.com/threads/map-editing.1049505/)
* [Ragnarok — GND (mặt đất + lightmap)](https://ragnarokresearchlab.github.io/file-formats/gnd/)
* [Ragnarok — GAT (cao độ + loại ô)](https://ragnarokresearchlab.github.io/file-formats/gat/)
* [Ragnarok — RSW (vật thể, đèn, nước)](https://ragnarokresearchlab.github.io/file-formats/rsw/)
* [Ragnarok — tổng hợp định dạng tệp](https://github.com/rdw-archive/RagnarokFileFormats)
* [Path of Exile — sinh thế giới bằng room + tile key (ExileCon)](https://www.youtube.com/watch?v=EXnoHTqO7TE)
* [Diablo 1 — sinh hầm ngục từng ô, marching squares](https://www.boristhebrave.com/2019/07/14/dungeon-generation-in-diablo-1/)
* [Diablo 1 — định dạng DUN](https://github.com/savagesteel/d1-file-formats/blob/master/PC-Mac/DUN.md)
* [Diablo II — dựng 3D nướng ra sprite 2D](https://www.gamedev.net/forums/topic/487300-question-about-diablo-2s-sprites/4183301/)
* [Tilemap isometric: cột tile, xếp lớp, lớp va chạm — Unity](https://unity.com/blog/engine-platform/isometric-2d-environments-with-tilemap)
* [Tile và tilemap — MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/Tilemaps)
