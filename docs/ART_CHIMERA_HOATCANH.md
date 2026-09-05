# Chimera từ ảnh tĩnh thành bảng khung hình

Đợt này thay toàn bộ art 16 Chimera của gacha Khế Ước: từ 16 tấm PNG đứng im sang bảng khung
hình nướng từ chính rig Spine của Axie, cộng hiệu ứng và chữ hiển thị lấy từ kho chính chủ.

## Nguồn — quét cả 54 repo của `axieinfinity`

| lấy về | ở đâu | dùng làm gì |
|---|---|---|
| 16 rig Spine Chimera | `axie-origins-asset-kit` · `PvE/Starters/*` | bảng khung 16 con |
| bảng hoạt cảnh `.json` | `cc-axie-gtk2d` · `spines/starter-axies/01-buba-beast` | cho 9 rig `.skel` mượn |
| 2 clip hiệu ứng | `axie-origins-asset-kit` · `web-vfx/public/vfx` | `power_awaken`, `summon_on_cast` |
| 9 huy hiệu lớp | `unity-axie-gtk2d` · `Sprites/axie-class-icon` | `assets/ui/lop.webp` |
| sao + khung gỗ | `axie-origins-asset-kit` · `PvE/UI/Frames` | `assets/ui/sao.webp`, `khung.webp` |

### Chữ hiển thị

Cả 54 repo chỉ có **sáu** tệp khai font. Hai tệp có font thật nằm trong repo:

- `godot-axie-starter-3d` → **Lilita One**. Đây là mặt chữ hiển thị của chính Axie, nhưng nó
  chỉ có latin + latin-ext: dựng thử "Khế Ước Chimera · Huyết Thống" thì ra "Kh   c Chimera ·
  Huy t Th ng". **Không dùng được cho tiếng Việt.**
- `tma-pray-atia-example` → **CC BackBeat**, font thương mại, không mang sang được.
- `mixer-playground` dùng **Work Sans** (có bộ dấu) nhưng nhìn gần như Be Vietnam Pro đang chạy.

Nên chọn **Baloo 2 nét 700/800**: cùng chất mập-tròn với Lilita One và **có bộ dấu tiếng Việt**,
tự chứa qua `@fontsource`, tổng 79 KB cho sáu tệp con.

Nó chỉ dùng cho **mặt Khế Ước** (`--font-chi`), không đụng `--font-display`. Baloo 2 từng bị gỡ
khỏi `--font-display` vì chữ bo tròn kiểu hoạt hình đặt trên khung thép đinh tán là hai ngôn ngữ
hình ảnh chửi nhau — lý do đó vẫn đúng. Chỗ nó hợp là chỗ có con Axie đứng cạnh.

## Ba chỗ dễ sai, đã trả giá cho mỗi chỗ

**① Hoạt cảnh của rig `.skel`.** 9/16 rig đóng gói nhị phân, mà `skelbin.py` chỉ đọc tới khối
skin. Không cần viết bộ giải mã hoạt cảnh: mọi rig Axie dùng CHUNG một bộ 14 khe và cùng tên
xương — đã kiểm cả 9 con, không con nào thiếu một cái xương nào mà `idle` + `appear` cần, khe
trùng 14/14. Bảng hoạt cảnh của một rig `.json` chạy thẳng trên bộ xương của rig `.skel`.

**② Atlas hai đời.** Gói nhân vật là Spine 4.x (`bounds:`), kit Axie là 3.8
(`xy:`/`size:`/`rotate:`) và xoay 18/26 vùng. `hoatcanh.py` chỉ đọc đời 4.x, nên `nuong_chi.py`
dựng lại một tấm atlas phẳng: cắt từng vùng, xoay về đúng chiều, xếp thành một hàng.

**③ Một cỡ ô chung là sai.** Thử trước: ô phải to bằng con lớn nhất (bờm Inkmane, gai Thornpaw),
14 con còn lại gánh rìa trong suốt đó suốt 24 khung — bảng quay phình từ 8,5 lên 11 MB. Nay mỗi
con cắt sát của chính nó, tỉ lệ thật giữa con to và con nhỏ vẫn giữ vì `PHONG` là hằng số: game
vẽ theo `thanCao` (thân cao mấy phần ô) chứ không kéo mọi con về cùng chiều cao.

## Hai bảng cho mỗi con

| tệp | khung | ô | tổng 16 con | nạp lúc nào |
|---|---|---|---|---|
| `<id>.webp` | 16 nhịp thở | ~150×132 | **1,70 MB** | sẵn — danh sách, đồng hành, lưới 10 lượt |
| `<id>_q.webp` | 12 hiện hình + 12 thở | ~460×360 | 8,47 MB | theo nhu cầu, chỉ màn quay |

Bảng nhỏ **thay hẳn** 2,4 MB ảnh tĩnh cũ, nên phần luôn tải về **nhẹ đi 0,7 MB** mà 16 con biết
cử động. Bảng quay giữ nhiều nhất **ba tấm** cùng lúc (`CHI_QUAY_TOI_DA`): một tấm giải nén ra
chừng 17 MB, quay ×10 mà giữ hết là 170 MB — đúng kiểu rò bộ nhớ đã làm Chrome sập một lần.

Đo thật: nền 22,8 MB → mở danh sách 44,8 MB → đỉnh trong lúc quay ×10 là **81 MB**, xong còn giữ
đúng một bảng quay.

## Nhịp màn quay sau đợt này

| pha | trước | nay |
|---|---|---|
| `comet` | sao chổi vẽ tay | *(giữ nguyên)* |
| `no` | vòng tròn + hạt vẽ tay | thêm `power_awaken` cho 5★ |
| `hien` | ảnh tĩnh mờ dần | bóng đen → **`activity/appear`**: nhắm mắt → nảy người → mở mắt, kèm `summon_on_cast` |
| `the` | ảnh tĩnh đứng im | con vật **thở**; khung gỗ chín mảnh; sao lục giác Axie; huy hiệu lớp; chữ Baloo 2 |
| `luoi` | ảnh tĩnh + chữ ★ | 10 ô đều thở, sao lục giác |

Hai clip hiệu ứng đếm theo **giây thật** chứ không kéo giãn theo pha: chúng dài 2,3s và 2,7s
trong khi pha `no` chỉ 0,42s, mà phần đuôi atlas là khung rỗng (việc #108) — ánh xạ đều lên cả
69/81 khung thì quá nửa thời gian vẽ ra khoảng không.

## Chạy lại

```
python3 tools/spine/nuong_chi.py          # 16 con, ~7 phút, tự ghi data/chi_anh.js
python3 tools/vfx_nhap.py <id> [<id> …]   # nhập clip hiệu ứng, in sẵn dòng VFX_ATLAS_DEFS
```

Bài kiểm: `tests/test_chianh.js` (đủ bộ · khớp lưới · có cử động thật · bóng đen kín · thả bộ nhớ).
