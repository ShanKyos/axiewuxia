# Dựng lại bốn map nhìn ngang — và bản kê những chỗ lủng

> Yêu cầu của chủ dự án: *lấy Rẻo Rừng Corran và Lối Mòn Corran làm chuẩn, bỏ hết map có góc
> nhìn như đang lơ lửng trên không trung, rà soát xem gỡ thì lủng chỗ nào để fill lại.*

---

## 1. Đo trước: map nào thật sự "lơ lửng"?

Không tin bảng cũ. `CLAUDE.md` liệt sáu tấm nhìn ngang, trong đó có `chungnam` — **đo lại thì
sai**: `bg_chungnam.jpg` và `bg_corran.jpg` là **cùng một tệp** (md5 `9310c07f…`), đã thay từ
commit `26dff8d` *"Map hoang dã dựng lại theo lối isometric — Werebear Woods + Rẻo Rừng Corran"*.
Nó là tranh nhìn từ trên xuống, không phải tranh sân khấu.

Phép đo: quét từ đáy tấm lên, tìm hàng đầu tiên đổi chất liệu (dải sàn), cộng với tỉ lệ nhiễu
của 1/4 trên so với đáy — tranh sân khấu có bầu trời PHẲNG ở trên nên tỉ lệ ấy vọt lên.

| Map | dải sàn ở đáy | nhiễu 1/4-trên ÷ đáy | đọc ra |
|---|---|---|---|
| `tuyettinh` | 6,0% | 2,13 | **nhìn ngang** |
| `nhanmon` | 10,0% | 1,16 | **nhìn ngang** (trời + núi xa + nhà) |
| `ngoai` | 14,5% | **8,85** | **nhìn ngang** (thân cây dựng đứng) |
| `mongco` | 31,8% | 3,42 | **nhìn ngang** (mesa, trời ở trên) |
| `chungnam` | 12,2% | 0,46 | trên xuống — *cùng tệp với `corran`* |
| `daohoa` | 3,2% | 0,87 | trên xuống |
| `comoc` | 0,2% | 1,59 | trên xuống |

⇒ **Bốn map lơ lửng**, không phải sáu: `ngoai` · `tuyettinh` · `mongco` · `nhanmon`.

**Vì sao nó thành lỗi.** `game.js` kéo tranh nền phủ kín thế giới rồi cho người chơi đi khắp mặt
tranh — nên **tranh nền CHÍNH LÀ mặt đất**. Tấm nào vẽ trời ở nửa trên thì đi lên phía bắc map là
đi vào bầu trời. Không tấm nền phẳng nào chữa được; phải đổi cách dựng sàn.

---

## 2. Bản kê LỦNG — nếu XOÁ HẲN bốn map

Đây là câu trả lời cho phần "rà soát". Đo bằng máy, không đoán
(`tools/iso/vung_bon.py` là bản dựng lại; bản kê này đo trên đồ thị `GATES` và các bảng dữ liệu).

| Hệ | Mất gì |
|---|---|
| **Dải cấp** | thủng **13-23** và **63-120** — tức 69/120 cấp không có chỗ cày |
| **Đi bộ** | `caungam` mất cửa nam; chuỗi `comoc → mongco → nhanmon` đứt hẳn |
| **Trùm vùng** | 12 Vệ Binh Trụ + **4 Trấn Ải** |
| **Trụ Khóa** | 3/5 trụ (`tuyettinh` · `mongco` · `nhanmon`) — còn `chungnam` + `comoc`. Kết game hỏng |
| **Dòng Cốt** | 4/11 Dòng độc quyền: Đồng Cỏ · Băng Vụn · Tro Tàn · Sấm Vụn |
| **Nhiệm vụ** | 14/33 mục — trọn chương IV và V, 4/6 chương II |
| **Loài quái** | 13/29 loài không còn xuất hiện ở đâu |
| **Miền dân số** | 15/42 miền |
| **Khác** | 4 mục `GOLDEN_FIELD`/`GOLDEN_BOX` · 4 nhạc nền · 4 ải cấp · 6 NPC · 8 chỗ hái thuốc |

**Vì thế KHÔNG xoá khoá map.** Bốn khoá ấy là chỗ treo của tất cả những hệ trên. Thứ phải biến
mất là **tấm tranh nhìn ngang và tầng máy phẳng đi kèm** — và nó đã biến mất: bốn map nay dựng
theo đúng khuôn Corran. Người chơi không còn gặp map lơ lửng nào; mọi hệ ở bảng trên vẫn nguyên.

---

## 3. Đã làm gì

Bốn map dựng lại theo khuôn Rẻo Rừng Corran (`.claude/skills/map-rong/SKILL.md`):

| | cũ | mới |
|---|---|---|
| Khổ | 2600×1900 cả bốn | 4400×3300 · 4800×3600 · 5000×3700 · 5200×3800 |
| Nền | JPEG phẳng kéo giãn | **lát viên isometric** (`sanIso`) |
| Chặn | 4-7 khối chữ nhật tay | **đa giác `diTrong`** + lùm `isoCum` trong lòng sàn |
| Sàn đi được | — | 78,3% · 83,3% · 81,2% · 85,1% |
| Bãi quái | 3-6 miền × 2 cụm | 6-7 miền × 3 cụm (16-21 bãi) |

Sinh bằng `tools/iso/vung_bon.py`, chỗ hái thuốc bằng `tools/iso/thuoc_bon.py`. **Đừng sửa tay
toạ độ** trong `canbang.js` — sửa tham số rồi chạy lại.

### Ba thứ sửa kèm, vì dựng lại mới lộ ra

1. **Trùm vùng nay đặt bằng máy**, xếp theo khoảng cách tới điểm thả (cấp tăng dần = đi sâu dần).
   Bộ cũ chấm tay cho khung 2600×1900, và **ba trong bốn Trấn Ải đứng đúng cùng một toạ độ**
   (`.86,.80`), hai Trụ Vệ thứ ba cùng `.42,.80` — đúng bệnh nhân bản mà `CLAUDE.md` mô tả.
2. **Hai lối rìa ngược quy ước, đã sửa.** Đi ra hướng BẮC khỏi `comoc` thì đầu bên `mongco` phải
   ở mép NAM (cũ để "Lối Tây"); đi ra hướng ĐÔNG khỏi `mongco` thì đầu bên `nhanmon` phải ở mép
   TÂY (cũ để "Lối Bắc").
3. **`MAPS.mongco` khai `spawnFrom` HAI LẦN trên cùng một dòng** — mục đầu (`tuyettinh`/`nhanmon`)
   bị mục sau đè, im lặng. Dựng lại là hết.

### Vì sao ba map cuối nay có chỗ hái thuốc

`test_domap` đòi mật độ ≥1,30 điểm nội dung / 1000 ô đi được. Map rộng gấp 3-4 lần thì số ô đi
được tăng vọt mà điểm nội dung thì không — đo được `tuyettinh` 1,14 · `mongco` 1,05 · `nhanmon`
1,05. Rẻo Rừng Corran cùng khổ mà đạt vì nó có 12 chỗ hái thuốc; ba map kia có 0. Đây đúng là
đòn bẩy Corran đã dùng — và nó không chỉ là con số: **chỗ hái thuốc là lý do RỜI ĐƯỜNG MÒN.**
Map rộng mà mọi thứ đáng làm đều nằm trên trục chính thì "rộng" đọc ra thành "dài".

---

## 4. Đợt hai: nâng nốt `chungnam` + `comoc`, và bộ viên theo biome

### 4.1 Blender — HOÁ RA CÓ, chỉ là chưa cài

Đợt một tôi ghi "sandbox không có Blender, nướng viên là việc của chủ dự án". **Sai.** Blender
phát hành trên PyPI dưới dạng **mô-đun Python** (`pip install bpy==4.2.0`, bánh xe 519 MB, khớp
Python 3.11 của máy này). Mà `tools/iso/nuong_tile.py` vốn đã viết theo lối `import bpy` rồi chạy
bằng `python3`, chứ không phải `blender --background` — tức đường ống đã sẵn sàng cho đúng cách
cài này từ đầu.

Đo được: **1,9 giây một viên**. Nướng cả 50 viên mới của đợt này hết chưa tới hai phút.

> **Bài học:** "công cụ X không có" là một khẳng định phải KIỂM, không phải suy ra từ việc gõ
> `which x` một lần. Tôi đã suy ra và báo cáo nó như một ràng buộc cứng, làm ba map phải đi mượn
> chất liệu sàn cả một đợt.

Cài lại khi mở phiên mới:
```
pip install bpy==4.2.0
python3 tools/iso/nuong_biome.py          # 50 viên + 10 vệt, ~2 phút
```

### 4.2 Bộ viên theo BIOME — hết mượn

`tools/iso/nuong_biome.py` nướng LẠI TỪ CẢNH 3D qua `nuong_nen`, không tô màu lại viên cũ
(CLAUDE.md cấm đúng chuyện đó). Cùng hướng nắng, cùng phép chiếu, nên ghép chung map không lệch.

| Map | vai NỀN (`isoCo`) | vai ĐƯỜNG (`isoDat`) | vệt (`isoVet`) |
|---|---|---|---|
| Beast Herd Camp | cỏ *(mặc định)* | đất *(mặc định)* | `vet_dat` |
| Werebear Woods | `nen_rung` lá mục | `nen_mon` lối mòn | `vet_mon` |
| Bug Tribe Tunnels | `nen_to` vỏ kitin | `nen_hang` lối hang | `vet_hang` |
| Bird Tribe Heights | `nen_tuyet` | `nen_bang` tuyết nện | `vet_bang` |
| Reptile Sunstone Flats | `nen_tro` đá nung | `nen_nung` lối cháy sém | `vet_nung` |
| Dusk Marsh | `nen_reu` rêu đầm | `nen_bun` bùn giẫm | `vet_bun` |

`isoVet` là khoá MỚI thêm vào engine (trước đó `ISO_VET` là hằng toàn cục). Thiếu nó thì Bird
Tribe Heights hiện ra một vệt bùn nâu vắt ngang tuyết.

### 4.3 Hai map cuối lên chuẩn

| | `chungnam` | `comoc` |
|---|---|---|
| Khổ | 2600×1900 → **4600×3400** | 2600×1900 → **4800×3600** |
| Sàn đi được | — → **78,5%** | — → **79,3%** |
| Bãi quái | 4 miền × 1-2 cụm → **6 × 3** | 3 miền × 2 cụm → **6 × 3** |
| Cổng | 3 | 4 (đủ bốn mép) |

`comoc` từng có **hai lối chen nhau trên mép TÂY** (Trũng Nứt ở y=1700, Werebear Woods ở y=1366,
cách nhau 334px). Quy ước là hai đầu một lối nằm ở hai mép ĐỐI NHAU — Werebear Woods đi ra hướng
BẮC thì đầu bên `comoc` phải ở mép NAM. Nay mỗi mép đúng một lối.

**Trạng thái: 11/12 map lát viên.** Còn đúng `daohoa` (Plant Tribe Glade) là JPEG phẳng
2600×1900 — nó nhìn từ trên xuống nên không lơ lửng, và nay là map phẳng duy nhất còn lại.

---

## 5. NỢ CÒN LẠI — đọc trước khi làm tiếp

### 5.1 ~~Chưa có bộ viên riêng cho ba biome~~ — ĐÃ XONG ở đợt hai, xem §4.2

### 5.2 ~~Hai map còn nợ TẦNG MÁY~~ — ĐÃ XONG ở đợt hai, xem §4.3

### 5.3 CÂY/ĐÁ VẪN DÙNG CHUNG MỘT BỘ — nợ còn lại lớn nhất

`ISO_CAY` (6 dáng cây), `ISO_BUI`, `ISO_DA`, `ISO_NHO` là hằng **toàn cục**, không đổi theo map.
Nên Bird Tribe Heights có tuyết phủ kín sàn mà vẫn mọc cây lá xanh, Reptile Sunstone Flats cháy
đỏ mà cũng cây lá xanh ấy. Sàn đã ra đúng vùng, vật thể đứng trên sàn thì chưa.

Chữa giống hệt cách đã chữa cho sàn: thêm khoá `isoCay` / `isoNho` đọc theo map (ba dòng, cùng
lối `isoCo`/`isoDat`/`isoVet`), rồi nướng thêm bộ cây theo biome bằng `nuong_biome.py` —
`nuong_vat` + `_cay_thong`/`_cay_tan`/`_da` đã nhận màu lá và hạt làm tham số, nên thêm một bộ
là thêm vài dòng. Nay có Blender rồi thì đây là việc làm được ngay.

### 5.4 Sáu tấm JPEG cũ còn nằm trong kho

`bg_ngoai.jpg` · `bg_tuyettinh.jpg` · `bg_mongco.jpg` · `bg_nhanmon.jpg` · `bg_chungnam.jpg` ·
`bg_comoc.jpg` đã gỡ khỏi `MAP_BG_SRC` nhưng chưa xoá khỏi đĩa — giữ lại một đợt để đối chiếu.
Xoá được khi đã chốt (≈4,0 MB).

### 5.5 Bốn bộ viên cũ KHÔNG có trong bộ nướng

`nen_da1-4` · `nen_duong1-4` · `nen_co4` · `nen_dat3-4` nằm trên đĩa nhưng **không script nào
trong repo sinh ra chúng** — `nuong_tile.py` chỉ nướng `nen_co1-3` và `nen_dat1-2`. Chúng là di
sản của một bản công cụ đã bị sửa đi. Nướng lại cả bộ thì bốn bộ ấy sẽ biến mất, mà Sapidae
Chiefdom và Aquatic Tribe Causeway đang dùng chúng. Bổ sung vào `main()` trước khi ai đó chạy
lại `nuong_tile.py`.
