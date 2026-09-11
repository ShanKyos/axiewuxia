# Rốt cuộc làm được những gì — danh sách chốt

Đi kèm `docs/KHAO_SAT_AXIE_2.md` (khảo sát). Tài liệu này chỉ trả lời một câu: **thứ nào bắt tay
vào làm được, thứ nào phải giải một việc khác trước, thứ nào không nên làm.**

---

## ⚠ ĐÍNH CHÍNH — `read_skel()` KHÔNG PHẢI "đọc sai", nó CHƯA BAO GIỜ ĐỌC HOẠT CẢNH

Hôm trước em ghi *"`skelbin.py` nói dối về Chimera"*. Nói thế là chưa đúng, và cái sai đó **đổi
hẳn ước lượng công sức** nên phải nói lại.

Sự thật: `read_skel()` (`tools/spine/skelbin.py`, 194 dòng) kết thúc bằng

```python
return {'bones': bones, 'slots': slots, 'skins': [...]}
```

**Không có `animations` trong đó, và không có đoạn mã nào đọc phần hoạt cảnh của tệp.** Nên
`d.get('animations', {})` trả rỗng cho **mọi** `.skel` — Axie hay Chimera đều thế. Nó không hỏng
riêng với Chimera; nó chưa có tính năng đó.

⇒ **Không phải sửa một con bọ. Phải viết mới phần đọc hoạt cảnh của Spine 3.8 nhị phân.**

Bù lại, ba điều làm việc đó khả thi và kiểm chứng được:

| | |
|---|---|
| **Một định dạng duy nhất** | cả rig Axie lẫn Chimera đều là **Spine 3.8.99** — viết một lần dùng cho cả hai |
| **Có đáp án để đối chiếu** | `Catalogs/pve-chimeras.json → extractedSkeletons[].unityClips` liệt kê sẵn tên clip của cả 22 rig. Đọc ra đúng danh sách đó hay không là kiểm được ngay |
| **Có bộ đối chứng gần như tuyệt đối** | 12 rig Axie `.json` (41 hoạt cảnh · 28 xương) và 26 rig Axie `.skel` **dùng chung một bộ xương**. Chạy trình đọc mới lên `.skel` rồi so với `.json` là so được từng khung |

⚠ Không rig nào có **cả** `.json` lẫn `.skel`, nên không so được byte-đối-byte trên cùng một con.
Phải so qua bộ xương chung như trên.

---

## ✅ NHÓM 1 — Làm được NGAY, không phụ thuộc gì

Không cần trình đọc mới. Toàn ảnh PNG rời hoặc đường đã chạy sẵn.

### 1.1 · Axie GIẬT khi trúng đòn — món nợ này làm được ngay, không phải chờ
`nuong_chi.py` **mượn hoạt cảnh từ một rig `.json`** (dòng 76), mà rig đó có đủ **41 clip** —
trong đó có `defense/hit-by-normal`. Hai clip đang nướng khai ở đúng một dòng:
```python
IDLE, APPEAR = 'action/idle/normal', 'activity/appear'
```
Thêm clip thứ ba là **thêm một hằng + một bảng khung**. CLAUDE.md ghi món này là "nợ" — nó không
nợ gì cả, chỉ là chưa ai bấm nút.

### 1.2 · Icon Ý ĐỊNH trên đầu quái — 17 PNG
`PvE/Intents/` đủ bộ telegraph. Ánh xạ thẳng `MOB_ROLE` đã có:
`phap`/`xa` → `AttackRanged` · `nang` → `StrongAttack` · `can` → `AttackMelee` ·
`tiepsuc` → `DefendAndBuff` · trùm vùng lúc `bossStartTele()` → `DangerousAction`.
**Không cần dữ liệu mới** — vai đã nằm sẵn trên từng con quái.

### 1.3 · Dải icon TRẠNG THÁI — 131 PNG
Game đã chạy `player.chiTam`, `vhDmgT/vhEvaT/vhAspdT/vhCritT/vhLeechT/vhShield`, độc, choáng —
và không hiện icon nào. Kho có sẵn đúng tên (`buff_dmg_boost`, `debuff_poison`, `debuff_stunned`…).
Một dải icon dưới thanh máu.

### 1.4 · 10 vật thể cắt sẵn → lớp `vatTo`
`vatTo` **đã tồn tại** trong game (game.js dòng 1104, "công trình rời chèn vào tranh nền").
Mười tệp đã đo (trong suốt 31–82%): `5_TREE1/2/3` · `10_TREE2` · `7/8/9/10_ROCK` · `10_RIVER` ·
`13_STATUE`. Đây đúng là "tranh đúng cho việc đó" mà mục **TRỤ ĐÁ ĐÃ GỠ** đang đòi ⇒ kéo lại
được `SAN_CHE` trong `test_domap.js` từ 8 lên 18 và ngưỡng `phaiVong` từ 1 lên 2.
⚠ `8_TEMPLE` (9% trong suốt) và `6_WATER` (7%) **không phải vật thể** — đừng lấy.

### 1.5 · ~~`BGM_BOSS` ← `boss.wav`~~ — ĐÃ XONG TỪ TRƯỚC, em ghi nhầm
Khi viết mục này em dựa vào ảnh chụp của khảo sát lần 1 (2026-09-03), lúc đó `BGM_BOSS` còn
`null`. Kiểm lại trên mã hiện tại thì **đã có người làm rồi**: `const BGM_BOSS = 'bgm_boss'`
và `assets/music/bgm_boss.mp3` (1,9 MB, ID3 hợp lệ, ghi ngày 10-09) đều nằm sẵn.
Bài học: đừng chép việc còn nợ từ một tài liệu khảo sát mà không kiểm lại mã.

---

## 🔧 NHÓM 2 — Làm được, nhưng phải viết trình đọc hoạt cảnh trước

### 2.1 · 22 quái Chimera CÓ HOẠT CẢNH
Đây là thứ đáng giá nhất trong cả danh sách, và là thứ duy nhất bị chặn.

**Chặn bởi:** phần đọc hoạt cảnh Spine 3.8 nhị phân (mục đính chính ở trên).
**Sau khi thông:** đường nướng đã có sẵn (`nuong_chi.py` / `nuong_chi_chay.py` đã ra 16 bảng
khung Axie). Chimera còn **bớt** một bước vì không phải mượn hoạt cảnh.

Thay cho hiện trạng: **27 loài quái dùng 21 ảnh PNG tĩnh, 6 loài đi mượn ảnh của loài khác.**
Clip có sẵn: `idle`·`move` 21/22 · `normal-attack` 20/22 · `hit-by-normal` 19/22 ·
`hit-die` 17/22 · `get-buff/debuff` 22/22.

**Rủi ro thật, nói trước:** định dạng nhị phân Spine rất chặt — sai một byte là mọi thứ phía sau
lệch hết. Đây là phần duy nhất trong tài liệu này em **không dám hứa xong trong một đợt**. Cách
giảm rủi ro là làm theo hai chặng, chặng một kiểm được:
1. Đọc ra **danh sách tên clip** → đối chiếu `unityClips` của cả 22 rig. Đúng hết mới đi tiếp.
2. Đọc **khung hình** → nướng một con, chụp ảnh ra nhìn, so với rig Axie cùng bộ xương.

---

## 🎨 NHÓM 3 — Không bị chặn kỹ thuật, nhưng là việc THIẾT KẾ

Kho cho **nguyên liệu**, không cho quyết định. Mấy thứ này cần anh chốt nội dung trước:

| | Kho cho | Còn thiếu |
|---|---|---|
| **Tầng phó bản** dựng lại | khuôn 35 node (nền+nhạc+hạng) và 41 đội hình có vị trí | chốt bao nhiêu phòng, theo trục nào |
| **Burst Cổ Vật** | 166 tranh thẻ làm icon chiêu | 16 burst là 16 cơ chế — phải thiết kế |
| **Nhiệm vụ** dựng lại | 43 chân dung | cả chuỗi + lore |
| **Màn thắng/thua** | 3 Spine `victory`/`defeated`/`draw` | game chưa có khái niệm "thắng một trận" |

---

## ❌ KHÔNG LÀM

| | Vì sao |
|---|---|
| Lát nền bằng `*_Ground.png` | **đã thử ba lần, hỏng cả ba** (CLAUDE.md). Đó là mặt đất vẽ cho sân khấu nhìn ngang |
| Chép cả 35 node | 8 nền dùng lại 4 lần — đúng cái bệnh nhân bản mà dự án đã chẩn đoán |
| 3 kho Axie 3D | game là 2D nướng sẵn |
| Chạy runtime Spine | cần giấy phép Esoteric; dự án đã chốt đường nướng sẵn |

---

## Đề nghị thứ tự

**Đợt 1 — ĐÃ LÀM XONG** (1.1 · 1.2 · 1.3 · 1.4; 1.5 hoá ra đã xong từ trước).
Không đụng một con số cân bằng nào. Kết quả đo được ghi ở CLAUDE.md, mục "ĐỢT 1 ĐÃ LÀM".

**Đợt 2 (một mình một đợt):** 2.1 — trình đọc hoạt cảnh, làm hai chặng, chặng một có đáp án
để đối chiếu.

**Đợt 3:** nhóm 3, sau khi anh chốt nội dung.
