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

## 5. Đợt ba: cây/đá theo biome, snow-đọc-ra-trời, và map phẳng cuối cùng

### 5.1 ⚠ TÔI ĐÃ CHỮA LỖI "LƠ LỬNG" RỒI TẠO LẠI NÓ BẰNG MÀU

Chụp lại cả 13 map sau đợt hai thì **Bird Tribe Heights đọc ra đúng một khoảng TRỜI CÓ MÂY**:
nhân vật và cả bầy quái lơ lửng giữa nền lam nhạt, còn vệt lối mòn thì thành dải mây.

Nguyên nhân là **màu tôi tự chọn**, không phải phép chiếu: viên tuyết để `(0,86 0,90 0,97)` —
trắng ngả lam rất sáng — còn lối mòn `(0,68 0,80 0,92)` chỉ đậm hơn một chút, nên cả mặt sàn nằm
gọn trong dải màu mà mắt đọc là bầu trời. Tệ hơn: **vật nhỏ trên tuyết cũng màu lam nhạt**
(đá `(0,74 0,80 0,88)`), tức tàng hình — mặt phẳng sáng đều mà không một mốc tương phản nào thì
không có gì nói rằng đó là một BỀ MẶT.

Đây đúng bài học đã ghi ở lớp phủ tối, chỉ đổi chiều: *đừng để màu nói một đằng còn hình học nói
một nẻo.* Sửa bằng ba việc, và việc thứ ba mới là việc chính:

1. kéo nền xuống `(0,78 0,79 0,84)` — ra khỏi dải "trắng chói";
2. đẩy lối mòn xuống `(0,56 0,58 0,66)` — **mở rộng khoảng cách sáng** giữa nền và lối, vì một
   lối mòn sẫm cắt ngang chính là thứ nói "đây là mặt đất";
3. cho đá **xám sẫm** và túm cỏ khô nâu chõi lên — mốc tương phản để mắt bám vào.

### 5.2 Cây/đá theo biome — `isoCayBo` · `isoNhoBo`

`ISO_CAY`/`ISO_NHO` là hằng toàn cục, nên sàn đã ra đúng vùng mà vật thể đứng trên sàn thì chưa:
Bird Tribe Heights tuyết phủ kín vẫn mọc cây lá xanh. Mà **vật thể mới là thứ mắt bắt trước**, vì
nó có đường viền.

⚠ **Hai cặp khoá rất dễ lẫn:** `isoCay`/`isoNho` là **số lượng** (vốn đã có), `isoCayBo`/`isoNhoBo`
là **bộ sprite** (mới). Đọc theo map cùng lối `isoCo`/`isoDat`/`isoVet`.

| Map | bộ cây | bộ vật nhỏ |
|---|---|---|
| Plant Tribe Glade | `cay_vuon` tán hoa hồng | cỏ trảng + bụi hoa + đá |
| Werebear Woods | `cay_rung` lá sẫm | cỏ rừng + bụi + đá |
| Bug Tribe Tunnels | `cay_to` **cột măng đá** | đá kitin |
| Bird Tribe Heights | `cay_tuyet` lá kim trĩu tuyết | cỏ khô + **đá xám sẫm** |
| Reptile Sunstone Flats | `cay_tro` cây cháy sém | cỏ khô + đá nung đỏ |
| Dusk Marsh | `cay_bun` cây rủ | cỏ lác + đá phủ rêu |

⚠ Tên khoá nói "cây" nhưng **nó không hứa phải là cây**: tường của một cái tổ thì không làm bằng
cây, nên Bug Tribe Tunnels khai cột măng đá. `isoCayBo` là *bộ vật DỰNG TƯỜNG VÙNG*.

### 5.3 Plant Tribe Glade — map phẳng cuối cùng

Không sai phép chiếu (nhìn từ trên xuống), nhưng tấm nền là một cảnh **đầm sen**: lá súng, hoa
sen, mặt nước xanh nhạt trải kín. Kéo phủ thế giới rồi cho đi khắp mặt tranh thì cả người chơi
lẫn bầy quái **đứng trên mặt nước** — cùng triệu chứng "lơ lửng", chỉ khác là lơ lửng trên nước.

Nay 2600×1900 → **4600×3400**, sàn **79,6%**, 3 miền × 3 cụm → **6 × 3**, bộ viên trảng cây +
lối sỏi riêng. Chất "có hoa" của tấm cũ giữ lại bằng **bộ cây tán hồng**, chứ không bằng cách
bắt ai đứng trên mặt nước.

**⇒ 12/12 map ngoài trời nay lát viên. Không còn tranh nền phẳng kéo giãn nào.**

### 5.4 Bảng map sinh bằng máy

`tools/bang_map.js` → `docs/BANG_MAP.md`: thống kê từng map xếp theo dải cấp và theo vai trò
chính tuyến, đọc từ **game đang chạy** (`packsOf` · `_navGrid` · `mapBanSac`). Bảng chép tay chỉ
đúng tới lần sửa `vung` kế tiếp — cùng luật đã áp cho `mapBanSac()`.

⚠ `docs/DO_MAP_HIEN_TRANG.md` là **mốc so ĐÓNG BĂNG** của một đợt đo cũ (còn liệt `tuongduong`
và tên "Petalshade" đã bỏ). Cố ý không cập nhật — đừng nhầm nó với bảng hiện trạng.

---

## 6. NỢ CÒN LẠI — đọc trước khi làm tiếp

### 6.1 ~~Chưa có bộ viên riêng cho ba biome~~ — ĐÃ XONG ở đợt hai, xem §4.2

### 6.2 ~~Hai map còn nợ TẦNG MÁY~~ — ĐÃ XONG ở đợt hai, xem §4.3

### 6.3 ~~CÂY/ĐÁ VẪN DÙNG CHUNG MỘT BỘ~~ — ĐÃ XONG ở đợt ba, xem §5.2

### 6.4 Bảy tấm JPEG cũ còn nằm trong kho

`bg_ngoai` · `bg_tuyettinh` · `bg_mongco` · `bg_nhanmon` · `bg_chungnam` · `bg_comoc` ·
`bg_daohoa` đã gỡ khỏi `MAP_BG_SRC` nhưng chưa xoá khỏi đĩa — giữ lại một đợt để đối chiếu.
Xoá được khi đã chốt (≈4,4 MB).

### 6.5 Bốn bộ viên cũ KHÔNG có trong bộ nướng

`nen_da1-4` · `nen_duong1-4` · `nen_co4` · `nen_dat3-4` nằm trên đĩa nhưng **không script nào
trong repo sinh ra chúng** — `nuong_tile.py` chỉ nướng `nen_co1-3` và `nen_dat1-2`. Chúng là di
sản của một bản công cụ đã bị sửa đi. Nướng lại cả bộ thì bốn bộ ấy sẽ biến mất, mà Sapidae
Chiefdom và Aquatic Tribe Causeway đang dùng chúng. Bổ sung vào `main()` trước khi ai đó chạy
lại `nuong_tile.py`.
