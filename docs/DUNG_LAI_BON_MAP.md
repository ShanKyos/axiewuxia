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

## 4. NỢ CÒN LẠI — đọc trước khi làm tiếp

### 4.1 Chưa có bộ viên riêng cho ba biome — **nợ art, không sửa được bằng mã**

Kho chỉ có **bốn** bộ viên: `nen_co` · `nen_dat` · `nen_da` · `nen_duong`. Không có tuyết, không
có tro, không có bùn. Bốn map phải chia nhau bốn bộ ấy:

| Map | mặt NỀN (`isoCo`) | mặt ĐƯỜNG (`isoDat`) | đáng lẽ phải là |
|---|---|---|---|
| `ngoai` | cỏ | đất | ✅ đúng chất — đồng cỏ chăn thả |
| `tuyettinh` | đá | đường lát | ❄ **tuyết + băng** |
| `mongco` | đất | đường lát | 🔥 **đá nung + tro** |
| `nhanmon` | cỏ | đá | 🌫 **bùn + nước đọng** |

Bản sắc ba vùng ấy hiện nằm ở `ground`/`patch` và ở bộ quái, **chưa nằm ở chất liệu sàn**.
Nướng thêm viên cần Blender (`tools/iso/nuong_tile.py`) — **sandbox không có Blender**, nên đây
là việc của chủ dự án. Khai `isoCo`/`isoDat` trong `MAPS` là đổi được ngay, không phải sửa engine.

### 4.2 Hai map còn nợ TẦNG MÁY (không nợ phép chiếu)

`chungnam` và `comoc` nhìn từ trên xuống nên **không lơ lửng**, nhưng vẫn là JPEG phẳng
2600×1900, không có `diTrong`, không lát viên. Nâng chúng lên chuẩn Corran là đợt kế tiếp — và
`chungnam` sẵn dùng chính tranh của `corran` nên nó gần đích hơn cả.

### 4.3 Bốn tấm JPEG cũ còn nằm trong kho

`bg_ngoai.jpg` · `bg_tuyettinh.jpg` · `bg_mongco.jpg` · `bg_nhanmon.jpg` đã gỡ khỏi `MAP_BG_SRC`
nhưng chưa xoá khỏi đĩa — giữ lại một đợt để đối chiếu. Xoá được khi đã chốt.
