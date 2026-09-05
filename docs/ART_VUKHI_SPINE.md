# Vũ khí lấy từ gói Spine

Mỗi gói nhân vật Spine (DK · Spellblade · DW · ELF · DL · Gunmetal Greatsword Knight)
**kèm sẵn một cây vũ khí** trong atlas của nó. Trước nay chúng bị bỏ qua: đường vẽ cũ
nướng vũ khí vào từng khung hình rồi vứt cả bộ đi khi chuyển sang hệ Thần Khí — nhưng
TẤM TRANH thì vẫn còn nguyên trong atlas.

Đó là art thật của cùng hoạ sĩ đã vẽ bộ giáp, nên nó hợp tông hơn bất cứ thứ gì sinh
ra ngoài.

## Khe trong atlas

Tên khe là chữ Hán (bộ mẫu gốc). Bốn khe liên quan tới vũ khí:

| khe | nghĩa | dùng |
|---|---|---|
| `左手武器` | vũ khí tay trái | ✅ đây là cây vũ khí thật của gói |
| `左手武器2a` `2b` `2c` | ba biến thể phụ | ✗ giống hệt nhau ở MỌI gói — là hiệu ứng dùng chung của bộ mẫu, không phải vũ khí riêng |

`game.js` không được chứa chữ Hán (CLAUDE.md, luật 1), nên tên khe chỉ ghi ở đây.

## Đã lấy về những gì

| gói | cây vũ khí | tệp | dòng trong game |
|---|---|---|---|
| DK | trường kiếm | `vk_kiem.png` | `kiem` (Dark Knight) |
| Gunmetal Greatsword Knight | đại kiếm hai tay | `vk_daikiem.png` | `daikiem` (Spellblade) |
| Spellblade | mã kiếm lưỡi cong | `vk_makiem.png` | `makiem` (Spellblade) |
| DL | quyền trượng nạm ngọc lam | `vk_lenhtruong.png` | `lenhtruong` (Dark Lord) |
| ELF | nỏ gỗ | `vk_no.png` | `no` (Sylvan Ranger) |
| DW | trượng | `tk_dwstaff.png` | `gay` · `quyentruong` (đã có từ trước) |

Phủ **7 trên 14 dòng**. Còn thiếu: `riu` `chuy` (Dark Knight), `cungngan` `truongcung`
(Sylvan Ranger), `songdao` (Spellblade), `bua` `kich` (Dark Lord).

## Cách lấy

Gói Spine nằm NGOÀI repo (thư mục làm việc riêng, không commit — mỗi gói ~1,2 MB và
chỉ cần một lần). Các bước:

1. Đọc `<gói>/spine四头身人物模板.atlas`, tìm dòng `bounds:x,y,w,h` ngay dưới tên khe.
2. Cắt đúng khung đó khỏi tấm `skin-*.png`.
3. Chạy qua `tools/chuanhoavk.py` để về đúng quy ước của `VK_ANH`.

## Hai chỗ phải ÉP TAY, không để công cụ đoán

`chuanhoavk.py` nay có `--lat` và `--nam` đúng vì hai phép đoán dưới đây không phủ nổi
cả hai họ vũ khí:

**Hướng (`--lat`).** Phép đoán cũ là "nửa nào NẶNG hơn thì sang phải" — đúng với trượng
(đầu là một khối cầu to) nhưng SAI với kiếm: lưỡi kiếm dài mà mỏng, còn chuôi thì ngắn
mà đặc, nên tổng alpha nửa chuôi có thể lớn hơn. Không phép đoán nào phủ được cả hai:
với trượng "đầu" là đầu DÀY, với kiếm "đầu" là mũi NHỌN — hai dấu hiệu ngược nhau.
**Cả năm cây lấy từ gói Spine đều cần `--lat co`.**

**Chỗ nắm (`--nam`).** Mặc định 0,38 phần chiều dài tính từ đuôi — đo trên cây trượng,
nơi hai tay nắm giữa thân. Kiếm nắm sát chuôi hơn nhiều; để 0,38 là bàn tay rơi lên
LƯỠI kiếm.

Giá trị đã dùng:

```
vk_kiem       --lat co --nam 0.17
vk_daikiem    --lat co --nam 0.15
vk_makiem     --lat co --nam 0.17
vk_lenhtruong --lat co --nam 0.30
vk_no         --lat co --nam 0.28
```

## Một chỗ phải chỉnh sau khi nối

`TK_LOI.crossbow.nghi` để `ban: 24` — đo trên cây nỏ VECTOR đời trước, nhỏ hơn hẳn.
Tranh thật là khối 172×91, gần 2:1 và bè nhất trong các dòng, nên ở 24px nó nằm trọn
sau thân người: đo được tâm nỏ chỉ lệch 15px khỏi trục người trong khi nửa bề ngang của
nó đã 46px. Nâng lên 42.

Bài học chung: mấy con số trong `TK_LOI` đều đo trên hình vector đời cũ. Dòng nào nối
tranh thật vào thì phải nhìn lại tư thế nghỉ của dòng đó, đừng tin con số cũ.
