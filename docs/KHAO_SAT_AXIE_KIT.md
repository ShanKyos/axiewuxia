# Khảo sát `axieinfinity/axie-origins-asset-kit` — Âm thanh & VFX

**Ngày khảo sát:** 2026-09-03 · **Bản kho:** `069a59b` (2026-08-26) · **Kích thước làm việc:** 1,60 GB
(không tính `.git`) · **Cách lấy:** `git clone --depth 1 https://github.com/axieinfinity/axie-origins-asset-kit`
(kho công khai, clone thẳng được).

Tài liệu này **chỉ khảo sát**, không sửa một dòng nào trong `public/game/`.
Mọi con số đo bằng `ffprobe`, `stat`, và đọc thẳng IHDR của PNG. Đơn vị MB dưới đây là **MiB**
(1 MiB = 1.048.576 byte) trừ khi ghi khác.

---

## 1. GIẤY PHÉP — đọc trước tất cả

Nguyên văn toàn bộ `LICENSE.md` của kho:

> # License
>
> These assets come from **Axie Infinity: Origins**, a Sky Mavis game.
>
> - Axie characters, PvE chimeras, starter Axies, mixer animation data, Origins VFX, status icons, summoner spines, battle UI, and battle SFX are **Sky Mavis / Axie Infinity IP**.
> - This repository is an **organizer-owned Axie Vibeathon builder resource**.
> - Use is limited to **Axie Vibeathon** and other Sky Mavis-approved programs. Do not treat this as an open-source dump.
> - Do **not** redistribute Epic Toon FX or any other third-party Unity Asset Store package. Those files were left out on purpose.
> - Spine runtime use is covered by Esoteric Software's Spine license. Play Axie bodies with the official 2D mixer (`@axieinfinity/mixer`, `unity-axie-gtk2d`).
> - If you are not building for Axie Vibeathon or another approved program, do not ship these files.
>
> This kit lives in the **Axie Infinity GitHub org** (`axieinfinity/axie-origins-asset-kit`). It is a Vibeathon builder resource, not an open-source dump. Use is still limited to Axie Vibeathon and other Sky Mavis-approved programs.

`README.md` nhắc lại một câu duy nhất về giấy phép: *"Read `LICENSE.md` before you ship anything."*

`Third Party Notices.md` (nguyên văn phần liên quan):

> Spine Runtimes are licensed by Esoteric Software. You need a valid Spine license to ship Spine runtime code. This kit ships **data** (`.skel` / `.atlas` / `.png`), not the Spine runtime.

### Đọc ra được gì

| Câu hỏi | Trả lời theo đúng văn bản |
|---|---|
| Được dùng vào việc gì? | **Chỉ** Axie Vibeathon và "other Sky Mavis-approved programs". Không có giấy phép mở nào. |
| Có phải ghi công không? | **Văn bản KHÔNG yêu cầu ghi công.** Không có điều khoản attribution, không có mẫu credit. |
| Được phát hành lại (redistribute) không? | Cấm rõ với Epic Toon FX và các gói Unity Asset Store bên thứ ba — nhưng những tệp đó **đã bị loại khỏi kho** rồi. Với phần Sky Mavis IP thì văn bản không nói "redistribute", nó nói **"do not ship these files"** nếu không thuộc chương trình được duyệt. |
| Spine? | Dữ liệu `.skel`/`.atlas`/`.png` thì được; **runtime** Spine cần giấy phép riêng của Esoteric. Kho không kèm runtime. |

**Điều kiện tiên quyết chưa được xác nhận lại trong lần khảo sát này:** `docs/ASSET_SOURCING.md`
(mục "Sixth source") ghi rằng đã *"Confirmed with the user that Axie Wuxia is a Vibeathon project
before using anything from it."* Toàn bộ đề xuất dưới đây đứng trên đúng một câu xác nhận đó.
Nếu Axie Wuxia **không** còn là dự án Vibeathon / chương trình được Sky Mavis duyệt tại thời điểm
phát hành, thì phần còn lại của tài liệu này vô nghĩa và game phải gỡ cả những thứ đang dùng.

**Không phải rủi ro lý thuyết:** game **đang** dùng tài nguyên của kho này ngay lúc này —
90 tệp `sfx_*.mp3` và 6 clip VFX. Rủi ro giấy phép đã tồn tại rồi, khảo sát này không tạo ra nó.

---

## 2. ÂM THANH — kho **CÓ**, và đây là chỗ lấp được lỗ hổng lớn nhất

Tổng cộng **297 tệp `.wav`**, không có mp3/ogg/flac nào. Chia ba nơi:

| Thư mục | Số tệp | Nội dung |
|---|---:|---|
| `Assets/OriginsKit/PvE/Music/` | 15 | **Nhạc nền đầy đủ bài** — đây là thứ `BGM_TRACKS` đang thiếu |
| `Assets/OriginsKit/Audio/` | 152 | SFX chiến đấu: 117 tệp theo lớp + 35 tệp trạng thái |
| `web-vfx/public/sfx/` | 130 | Cùng bộ SFX, bản dành cho web |

### 2.1 Nhạc nền — 15 bài, đo đầy đủ

| Tệp | Độ dài | Dung lượng WAV | Tần số / kênh | Tình trạng trong game |
|---|---:|---:|---|---|
| `pve_1.wav` | 114,91 s | 3,51 MB | 16 kHz mono | đã dùng → **đã bị xoá** (`bgm_daohoa_ost`) |
| `pve_2.wav` | 104,47 s | 3,19 MB | 16 kHz mono | đã dùng → **đã bị xoá** (`bgm_ngoai`) |
| `pve_3.wav` | 109,69 s | 3,35 MB | 16 kHz mono | đã dùng → **đã bị xoá** (`bgm_chungnam_ost`) |
| `pvp.wav` | 217,12 s | 6,63 MB | 16 kHz mono | đã dùng → **đã bị xoá** (`bgm_nhanmon`, `bgm_boss_nguan`) |
| `boss.wav` | 122,69 s | 3,74 MB | 16 kHz mono | **CHƯA BAO GIỜ DÙNG** |
| `home.wav` | 122,02 s | 10,26 MB | 44,1 kHz mono | đã dùng → **đã bị xoá** (`bgm_romance`) |
| `lunar_bloodmoon.wav` | 112,94 s | 9,50 MB | 44,1 kHz mono | đã dùng → **đã bị xoá** (`bgm_tuyettinh_ost`) |
| `halloween.wav` | 166,18 s | 15,21 MB | 48 kHz mono | đã dùng → **đã bị xoá** (`bgm_tomb`) |
| `halloween_battle_2023.wav` | 125,45 s | 11,48 MB | 48 kHz mono | đã dùng → **đã bị xoá** (`bgm_comoc`) |
| `summer23.wav` | 151,15 s | 13,84 MB | 48 kHz mono | **CHƯA BAO GIỜ DÙNG** |
| `lunar_battle.wav` | 119,23 s | 21,83 MB | 48 kHz **stereo** | đã dùng → **đã bị xoá** (`bgm_mongco`) |
| `halloween_2023.wav` | 135,00 s | 24,72 MB | 48 kHz **stereo** | **CHƯA BAO GIỜ DÙNG** |
| `lunar_menu.wav` | 103,27 s | 18,91 MB | 48 kHz **stereo** | **CHƯA BAO GIỜ DÙNG** |
| `xmas_battle.wav` | 132,72 s | 24,30 MB | 48 kHz **stereo** | **CHƯA BAO GIỜ DÙNG** |
| `xmas_menu.wav` | 147,26 s | 26,96 MB | 48 kHz **stereo** | **CHƯA BAO GIỜ DÙNG** |

Chất lượng nguồn **không đồng đều, và đây là số đo chứ không phải cảm nhận**: 5 bài
(`pve_1/2/3`, `boss`, `pvp`) là **16 kHz mono** — trần tần số 8 kHz, tức là đã mất hẳn dải cao.
Chuyển sang mp3 `-qscale:a 4` thì `boss.wav` chỉ ra **0,48 MB** cho 122 giây (≈33 kbps thực),
vì trong nguồn không còn gì để mã hoá. Nghe sẽ hơi đục so với `bgm_intro.mp3` hiện tại
(44,1 kHz stereo, 192 kbps). 6 bài stereo 48 kHz là bộ chất lượng cao nhất.

### 2.2 ⚠ PHÁT HIỆN CHÍNH: 9 trong 13 bản nhạc bị xoá **không phải nhạc phim kiếm hiệp Hoa ngữ**

Commit `c8ac08f` ("quét sạch kiếm hiệp") xoá 13 tệp `bgm_*.mp3` với lý do ghi trong thông điệp
commit: *"13 bản nhạc phim kiếm hiệp Hoa ngữ (21 MB)"*. Tôi lấy lại cả 13 tệp từ `c8ac08f^` và
đối chiếu **đường bao năng lượng RMS** (giải mã 4 kHz mono, khung 100 ms, hệ số tương quan
Pearson) với 15 bài trong kho. Kết quả:

| Tệp đã xoá | Khớp với | Tương quan |
|---|---|---:|
| `bgm_daohoa_ost.mp3` | `pve_1.wav` | **+1,000** |
| `bgm_ngoai.mp3` | `pve_2.wav` | **+1,000** |
| `bgm_chungnam_ost.mp3` | `pve_3.wav` | **+1,000** |
| `bgm_tuyettinh_ost.mp3` | `lunar_bloodmoon.wav` | **+1,000** |
| `bgm_comoc.mp3` | `halloween_battle_2023.wav` | **+1,000** |
| `bgm_mongco.mp3` | `lunar_battle.wav` | **+1,000** |
| `bgm_romance.mp3` | `home.wav` | **+1,000** |
| `bgm_tomb.mp3` | `halloween.wav` | **+1,000** |
| `bgm_nhanmon.mp3` | `pvp.wav` | **+0,999** |
| `bgm_boss_nguan.mp3` | `pvp.wav` | **+0,999** |
| `bgm_kiemhiep.mp3` | (không khớp bài nào) | +0,176 |
| `bgm_tuongduong_ost.mp3` | (trùng byte với `bgm_kiemhiep`) | +0,176 |
| `bgm_safe.mp3` | (không khớp bài nào) | +0,148 |

**10/13 tệp (9 bài khác nhau) là nhạc Axie Origins chính chủ từ chính kho này**, không phải nhạc
phim Hoa ngữ. Chúng bị xoá nhầm trong một đợt quét theo lô.

3 tệp còn lại (`bgm_kiemhiep` = `bgm_tuongduong_ost`, MD5 `6afa2053…`; và `bgm_safe`) đều dài đúng
**300,0 s** và cùng **4.800.724 byte**. Theo `docs/ASSET_SOURCING.md` chúng đến từ Drive
"music and sfx" (`Atia_Legacy_PVP_v21A/B_5min.mp3`) — tức **Atia's Legacy, cũng là game Sky Mavis**,
không phải nhạc phim kiếm hiệp. **Không tệp nào trong 13 tệp bị xoá có nguồn Hoa ngữ.**
Nhưng 2 bài Atia không nằm trong kho này nên **ngoài phạm vi khảo sát** — không đề xuất chúng.

Lấy lại 10 tệp Axie kit: `git show c8ac08f^:public/game/assets/music/<tên>.mp3`.
Tổng cộng **10,72 MB** ở đúng định dạng mp3 game cần, không phải chuyển đổi lại gì.

### 2.3 SFX — 152 tệp, game đã dùng 90, **còn 23 tệp trạng thái chưa dùng**

Đối chiếu 18 tệp `sfx_*` phi-lớp của game với 35 tệp trạng thái trong `Assets/OriginsKit/Audio/`
(tương quan dạng sóng ở 8 kHz). 15/18 khớp ≥ 0,99 → xác nhận game lấy từ đây. 3 tệp không khớp
(`sfx_crit`, `sfx_skill`, `sfx_slash`, `sfx_ui`) là nguồn Drive cũ.

**23 tệp trạng thái chưa dùng** (tất cả 48 kHz mono, PCM 16-bit):

| Tệp | Độ dài | Byte | | Tệp | Độ dài | Byte |
|---|---:|---:|---|---|---:|---:|
| `sleep.wav` | 4,56 s | 438.044 | | `dispel.wav` | 2,69 s | 258.044 |
| `hex.wav` | 4,12 s | 396.044 | | `cleanser.wav` | 3,00 s | 288.044 |
| `taunt.wav` | 4,12 s | 396.044 | | `leaf.wav` | 3,00 s | 288.044 |
| `buff.wav` | 4,00 s | 384.044 | | `bubble_bomb.wav` | 2,88 s | 276.044 |
| `heal_block.wav` | 3,88 s | 372.044 | | `damage_boost.wav` | 2,88 s | 276.044 |
| `secret.wav` | 3,56 s | 342.044 | | `reflect_damage.wav` | 2,75 s | 264.044 |
| `debuff.wav` | 3,38 s | 324.044 | | `vunerable.wav` (sic) | 2,50 s | 240.044 |
| `fear.wav` | 3,38 s | 324.044 | | `doubt.wav` | 1,62 s | 156.044 |
| `bubble.wav` | 3,25 s | 312.044 | | `silent.wav` | 3,18 s | 305.642 |
| `cleanse.wav` | 3,25 s | 312.044 | | `summon_on.wav` | 3,12 s | 300.044 |
| `disarm.wav` | 3,25 s | 312.044 | | `summon_off.wav` | 3,12 s | 300.044 |
| `morph_aura_burst.wav` | 3,25 s | 312.044 | | | | |

Tổng 23 tệp: **6,84 MB** WAV. Chuyển mp3 `-qscale:a 4` cho ra khoảng 60–80 KB mỗi tệp
(cùng dải với 90 tệp `sfx_*` đang có: 7–97 KB).

### 2.4 Hai lỗi âm thanh phát hiện được nhân tiện (đo được, chưa sửa)

1. **`throwBaoHap()` gọi hai tệp không tồn tại.** Dòng 7424 `public/game/game.js`:
   `AudioSys.sfx('throw_' + (1 + Math.floor(Math.random() * 2)), 0.75)` → yêu cầu
   `assets/music/sfx_throw_1.mp3` / `sfx_throw_2.mp3`. Trên đĩa chỉ có `sfx_throw_<lớp>.mp3`
   (9 tệp: aquatic…reptile). **Mọi lần ném Box Kundun đều 404.** Đúng loại lỗi mà `CLAUDE.md`
   đã cảnh báo với `sfx_hit.mp3` và `sfx_bikip.mp3`.
2. **Bốn tệp, hai bản thu.** `sfx_coin.mp3` và `sfx_forge_ok.mp3` **trùng MD5 hoàn toàn**
   (`fe3c5e1a…`, đều từ `power_gain.wav`); `sfx_hurt.mp3` và `sfx_weak.mp3` cũng trùng MD5
   (`8369b914…`, đều từ `weak.wav`). Kết hợp với debounce 70 ms của `AudioSys.sfx()`,
   `killMob()` gọi `sfx('die')` rồi `sfx('coin')` — và `sfx('coin')` với `sfx('forge_ok')`
   phát ra âm giống hệt nhau ở hai ngữ cảnh hoàn toàn khác (nhặt bạc vs rèn thành công).

---

## 3. VFX — 107 clip atlas, game dùng 6, **98 clip còn dùng được**

`web-vfx/public/vfx/` — mỗi clip một thư mục `{atlas.png, clip.json}`, lưới sprite,
30 fps, siêu dữ liệu đủ (cols/rows/frameW/frameH/anchor/events). Tổng **145 MB** đĩa.
`index.json` khai `count: 107` (64 skill + 43 buff).

**Phân loại:** 6 đã dùng · **3 HỎNG** · **98 dùng được**.

### 3.1 ⚠ 3 clip HỎNG — không dùng được, đừng mất công

`taunt`, `vulnerable`, `plant_throw`. Bằng chứng đo được: `crop` trong `clip.json` là nguyên khung
960×540 (không cắt), `peakFrame: 0`, `duration: 0.0333 s` (đúng 1 khung), và **kênh alpha của cả
tấm atlas bằng 0 tuyệt đối** (kiểm bằng `ffmpeg … extractplanes=a`: max = 0 trên 37.324.800 byte
của `taunt`, 20.736.000 byte của `plant_throw`). Chúng là **ảnh trong suốt hoàn toàn** — bản
capture thất bại. `taunt/atlas.png` và `vulnerable/atlas.png` còn **trùng MD5** (`2d1c0519…`).
Đừng để bảng kích thước đánh lừa: 7680×4860 nghe như tấm to nhất kho, thực chất trống rỗng.

### 3.2 Chi phí RAM — quy tắc và ngưỡng

RAM khi giải nén = **rộng × cao × 4 byte**, không liên quan gì tới dung lượng đĩa.
Ngưỡng dự án đặt ra: **22 MB/tấm**.

Trạng thái hiện tại của 6 tấm game đang dùng (game đã tự thu nhỏ 1/2 mỗi chiều, `k:2`):

| Clip | Kích thước gốc trong kho | Đĩa | RAM gốc | Kích thước trong game | Đĩa | RAM thật |
|---|---|---:|---:|---|---:|---:|
| `bleed_apply` | 3736×3960 | 1,20 MB | 56,4 MB | 1872×1980 | 0,60 MB | 14,1 MB |
| `heal` | 3456×3933 | 2,69 MB | 51,9 MB | 1728×1962 | 1,20 MB | 12,9 MB |
| `poison_apply` | 3664×5027 | 2,84 MB | 70,3 MB | 1832×2508 | 1,33 MB | 17,5 MB |
| `shield` | 3808×4422 | 1,20 MB | 64,2 MB | 1904×2211 | 0,53 MB | 16,1 MB |
| `stunned` | 3016×4719 | 2,22 MB | 54,3 MB | 1504×2354 | 0,90 MB | 13,5 MB |
| `weak` | 3952×4473 | 2,14 MB | 67,4 MB | 1976×2232 | 1,18 MB | 16,8 MB |
| **Tổng** | | **12,28 MB** | **364,5 MB** | | **5,75 MB** | **91,0 MB** |

Đây chính là 12 MB / 365 MB đã làm sập Chrome. Sau khi thu nhỏ ×2 còn 91,0 MB, và mọi tấm
đều **dưới 22 MB** — nhưng 6 tấm nằm cùng lúc vẫn là 91 MB, nên `VFX_ATLAS_GIU = 60000`
(thả tấm không dùng sau 1 phút) là bắt buộc chứ không phải tối ưu thêm.

**Kết luận áp cho mọi clip mới:** trong 98 clip dùng được, **chỉ 7 clip** ở kích thước gốc
lọt dưới ngưỡng 22 MB. **91/98 clip BẮT BUỘC PHẢI THU NHỎ TRƯỚC KHI DÙNG.**

7 clip duy nhất dùng thẳng được ở `k:1` (bảng kèm một dòng đối chứng):

| Clip | Kích thước | Đĩa | RAM | Khung | Giây |
|---|---|---:|---:|---:|---:|
| `aquatic_slash` | 3760×1520 | 0,46 MB | 21,8 MB | 39 | 0,90 |
| `aquatic_bite` | 2936×1782 | 0,74 MB | 20,0 MB | 42 | 1,27 |
| `mech_bite` | 2640×1876 | 0,77 MB | 18,9 MB | 52 | 1,37 |
| `stealth` | 2088×2160 | 1,39 MB | 17,2 MB | 69 | 2,30 |
| `bird_bite` | 2472×1752 | 0,50 MB | 16,5 MB | 44 | 1,07 |
| `dusk_throw` | 1672×1704 | 0,25 MB | 10,9 MB | 57 | 1,88 |
| `dawn_throw` | 1568×1528 | 0,23 MB | 9,1 MB | 57 | 1,88 |
| `aquatic_cast`* | 2288×3920 | 0,68 MB | 34,2 MB | 80 | 2,23 |

\* `aquatic_cast` **vượt ngưỡng** — liệt ở đây vì nó là clip `cast` nhỏ nhất, vẫn phải `k:2`.

### 3.3 Buff / trạng thái chưa dùng — 34 clip (đã loại 3 clip hỏng)

`k*` = hệ số thu nhỏ nhỏ nhất để RAM ≤ 22 MB. `RAM k2` = RAM sau khi thu nhỏ ×2, đúng quy ước
`k:2` mà `VFX_ATLAS_DEFS` đang dùng.

| Clip | Kích thước | Đĩa | RAM gốc | RAM k2 | k* | Khung | Giây | Ô khung |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `fury_on_transfrom` | 4848×5940 | 4,37 | 109,9 | 27,5 | **3** | 81 | 2,13 | 606×540 |
| `bubble_bomb` | 4968×5544 | 5,73 | 105,1 | 26,3 | **3** | 81 | 2,53 | 621×504 |
| `rage` | 6312×4140 | 4,02 | 99,7 | 24,9 | **3** | 69 | 2,30 | 789×460 |
| `drain` | 5480×4730 | 1,50 | 98,9 | 24,7 | **3** | 81 | 2,43 | 685×430 |
| `summon_on_death` | 4816×4860 | 2,16 | 89,3 | 22,3 | **3** | 72 | 1,50 | 602×540 |
| `buff_apply` | 4096×5489 | 1,93 | 85,8 | 21,4 | 2 | 81 | 1,50 | 512×499 |
| `reflect_damage` | 5328×4023 | 2,60 | 81,8 | 20,4 | 2 | 69 | 1,53 | 666×447 |
| `power_awaken` | 4528×4608 | 2,80 | 79,6 | 19,9 | 2 | 69 | 1,77 | 566×512 |
| `sleep` | 4032×5137 | 1,59 | 79,0 | 19,7 | 2 | 81 | 2,33 | 504×467 |
| `summon_on_cast` | 4272×4818 | 2,84 | 78,5 | 19,6 | 2 | 81 | 1,63 | 534×438 |
| `shield_break-origin` | 5168×3942 | 1,20 | 77,7 | 19,4 | 2 | 69 | 1,07 | 646×438 |
| `cure` | 3864×4939 | 2,85 | 72,8 | 18,2 | 2 | 81 | 2,70 | 483×449 |
| `debuff_apply` | 4096×4428 | 1,66 | 69,2 | 17,3 | 2 | 69 | 1,50 | 512×492 |
| `secret_apply` | 3808×4356 | 1,40 | 63,3 | 15,8 | 2 | 69 | 1,83 | 476×484 |
| `fear` | 3816×4167 | 3,24 | 60,7 | 15,2 | 2 | 69 | 1,83 | 477×463 |
| `hex` | 3656×4302 | 1,94 | 60,0 | 15,0 | 2 | 69 | 1,90 | 457×478 |
| `death_mark_apply` | 3328×4653 | 2,44 | 59,1 | 14,8 | 2 | 81 | 2,30 | 416×423 |
| `dmg_boost` | 3640×4113 | 0,96 | 57,1 | 14,3 | 2 | 69 | 1,63 | 455×457 |
| `heal_block` | 3480×4279 | 1,61 | 56,8 | 14,2 | 2 | 81 | 2,07 | 435×389 |
| `silence` | 3040×4609 | 3,46 | 53,4 | 13,4 | 2 | 81 | 2,63 | 380×419 |
| `bubble` | 3584×3888 | 2,53 | 53,2 | 13,3 | 2 | 69 | 1,80 | 448×432 |
| `feather` | 2888×4752 | 1,30 | 52,4 | 13,1 | 2 | 81 | 2,40 | 361×432 |
| `shield_break` | 3424×3942 | 1,03 | 51,5 | 12,9 | 2 | 69 | 1,03 | 428×438 |
| `leaf` | 3432×3879 | 1,75 | 50,8 | 12,7 | 2 | 69 | 1,80 | 429×431 |
| `fury_form` | 3528×3744 | 3,62 | 50,4 | 12,6 | 2 | 69 | 2,30 | 441×416 |
| `fragile` | 3480×3735 | 1,79 | 49,6 | 12,4 | 2 | 69 | 1,50 | 435×415 |
| `shield_boost` | 3360×3780 | 2,34 | 48,4 | 12,1 | 2 | 69 | 2,30 | 420×420 |
| `doubt` | 3064×3735 | 0,93 | 43,7 | 10,9 | 2 | 69 | 1,67 | 383×415 |
| `healing_boost` | 3128×3546 | 1,80 | 42,3 | 10,6 | 2 | 72 | 2,03 | 391×394 |
| `cleanse` | 2936×3710 | 1,55 | 41,6 | 10,4 | 2 | 77 | 1,70 | 367×371 |
| `dispel` | 2880×3681 | 1,19 | 40,4 | 10,1 | 2 | 69 | 1,47 | 360×409 |
| `power_gain` | 2992×3384 | 0,72 | 38,6 | 9,7 | 2 | 69 | 1,77 | 374×376 |
| `disarmed` | 3552×2745 | 0,25 | 37,2 | 9,3 | 2 | 69 | 1,37 | 444×305 |
| `cleanser` | 2552×3474 | 0,94 | 33,8 | 8,5 | 2 | 69 | 1,17 | 319×386 |
| `stealth` | 2088×2160 | 1,39 | 17,2 | 4,3 | **1** | 69 | 2,30 | 261×240 |

**Cả 34 clip đều vượt 22 MB ở kích thước gốc, trừ `stealth`. Tất cả đều phải thu nhỏ trước khi dùng.**
5 clip đầu bảng (`fury_on_transfrom`, `bubble_bomb`, `rage`, `drain`, `summon_on_death`)
**vẫn vượt ngưỡng ngay cả sau khi thu nhỏ ×2** — chúng cần `k:3` (RAM còn 11–12 MB).

### 3.4 Skill VFX chưa dùng — 63 clip (đã loại `plant_throw` hỏng)

9 lớp × 7 kiểu đòn (`bite · cast · gore · projectile · slash · smash · throw`) + 1 biến thể
`beast_smash 1` (tên có dấu cách; `index.json` khai `variantOf: beast_smash`).

10 clip nặng nhất — **tất cả cần k:2 trở lên**:

| Clip | Kích thước | Đĩa | RAM gốc | RAM k2 | Khung | Giây |
|---|---|---:|---:|---:|---:|---:|
| `beast_smash 1` | 7424×2958 | 2,89 | 83,8 | 20,9 | 45 | 1,50 |
| `mech_projectile` | 6176×3519 | 1,96 | 82,9 | 20,7 | 69 | 2,23 |
| `bug_cast` | 5888×3483 | 1,28 | 78,2 | 19,6 | 70 | 1,93 |
| `bird_projectile` | 6024×3402 | 1,70 | 78,2 | 19,5 | 69 | 1,43 |
| `plant_cast` | 5512×3500 | 1,47 | 73,6 | 18,4 | 74 | 2,00 |
| `bird_cast` | 5192×3660 | 1,09 | 72,5 | 18,1 | 89 | 2,47 |
| `beast_throw` | 5544×3304 | 1,03 | 69,9 | 17,5 | 59 | 1,97 |
| `dawn_cast` | 5744×3024 | 1,40 | 66,3 | 16,6 | 63 | 1,93 |
| `dusk_cast` | 5640×2912 | 1,43 | 62,7 | 15,7 | 59 | 1,93 |
| `aquatic_projectile` | 6440×2506 | 1,03 | 61,6 | 15,4 | 52 | 1,70 |

9 clip `_smash` (mỗi lớp một cái) — bộ này **đã từng có trong game rồi bị gỡ**, số đo hiện tại:

| Clip | Kích thước | Đĩa | RAM gốc | RAM k2 | Khung |
|---|---|---:|---:|---:|---:|
| `aquatic_smash` | 5536×2568 | 2,07 | 54,2 | 13,6 | 44 |
| `mech_smash` | 4584×2366 | 1,19 | 41,4 | 10,3 | 51 |
| `reptile_smash` | 5200×1870 | 1,85 | 37,1 | 9,3 | 39 |
| `beast_smash` | 5208×1620 | 1,43 | 32,2 | 8,0 | 39 |
| `bug_smash` | 5200×1620 | 1,39 | 32,1 | 8,0 | 39 |
| `plant_smash` | 5176×1620 | 1,40 | 32,0 | 8,0 | 39 |
| `dusk_smash` | 4624×1620 | 1,29 | 28,6 | 7,1 | 39 |
| `dawn_smash` | 4624×1405 | 0,98 | 24,8 | 6,2 | 39 |
| `bird_smash` | 4576×1386 | 1,01 | 24,2 | 6,0 | 47 |

Tổng 9 tấm `_smash`: đĩa **12,61 MB**, RAM gốc **306,6 MB**, RAM sau k2 **76,5 MB**.
Con số 306,6 MB giải thích khá đủ vì sao bộ này bị gỡ.

Danh sách đầy đủ 63 clip skill kèm số đo nằm trong bảng đã sinh khi khảo sát; phần còn lại
(`bite`, `gore`, `slash`, `throw`, `projectile`, `cast` của 9 lớp) trải từ **9,1 MB** (`dawn_throw`)
tới **83,8 MB** (`beast_smash 1`) RAM gốc, trung vị khoảng 50 MB.

### 3.5 ⚠ Lối thoát cho vấn đề RAM: **107 tệp MP4, tổng 6,66 MB**

`showcase/public/previews/video/` có **107 tệp `.mp4`** — đúng một tệp cho mỗi clip trong
`web-vfx/public/vfx/`, cùng tên. Thông số: **H.264, 960×540, 30 fps, yuv420p**.
Tổng dung lượng **6,66 MB cho toàn bộ 107 clip** — nhỏ hơn 6 tấm atlas game đang mang (5,75 MB
cho 6 tấm) ở mức gần như cùng cỡ, mà là cho **107 clip**.

Điểm mấu chốt: tôi kiểm màu nền của `heal.mp4` ở góc trên trái — **RGB (18, 21, 28)**, khớp với
`clip.json` khai `"background": [19, 22, 27]`. Đây là nền gần đen, đúng thứ mà chế độ hoà trộn
cộng (`globalCompositeOperation = 'lighter'` — thứ `drawVfx` đã dùng) triệt tiêu gần hết.
Nghĩa là `ctx.drawImage(videoElement, …)` với `lighter` cho ra **cùng kết quả hình ảnh** như
atlas cộng, mà bộ giải mã video chỉ giữ vài khung 960×540×4 ≈ **2 MB** thay vì cả tấm 50–110 MB.

Vài kích thước cụ thể: `sleep.mp4` 45,8 KB · `fear.mp4` 95,8 KB · `rage.mp4` 119,4 KB ·
`summon_on_cast.mp4` 130,0 KB · `fury_on_transfrom.mp4` 202,7 KB (lớn nhất) ·
`disarmed.mp4` 16,6 KB (nhỏ nhất).

**Cảnh báo trung thực về hướng này** — chưa kiểm chứng bằng thực nghiệm, chỉ là suy luận từ số đo:
(a) `drawImage(video)` mỗi khung có chi phí sao chép GPU→canvas, chưa đo trong game này;
(b) nhiều video phát cùng lúc = nhiều bộ giải mã, và trình duyệt có giới hạn số bộ giải mã đồng thời;
(c) `video.play()` bị chặn tự phát giống hệt `AudioSys` (đã có sẵn cơ chế `tryStart()` để mượn);
(d) 960×540 là **độ phân giải capture gốc**, thấp hơn ô khung của atlas ở vài clip
(ví dụ `taunt` khai ô 960×540 — nhưng clip đó hỏng nên không tính). Cần một thử nghiệm nhỏ trước
khi cam kết, chứ đừng đổi cả hệ.

---

## 4. THỨ KHÁC DÙNG ĐƯỢC

| Hạng mục | Số lượng | Đo được | Đánh giá |
|---|---:|---|---|
| `Assets/OriginsKit/Textures/Vfx/` | 90 PNG | đĩa **11,95 MB**, RAM nếu nạp hết **219,0 MB** | Texture hạt đơn lẻ cho hệ VFX **thủ tục** sẵn có (`SECT_VFX`/`drawVfx`). 8 tấm 2048×2048 (16,0 MB RAM mỗi tấm — **quá ngưỡng, phải thu nhỏ**), 6 tấm 1024×1024 (4,0 MB), phần còn lại nhỏ. Rẻ nhất và dùng được ngay: `Feather_TX.png` 256×256 16,0 KB (0,25 MB RAM), `Glow_Buff_02_TX.png` 256×256 33,7 KB, `Spark_Stretch_TX.png` 128×256 7,5 KB, `Ghost_trail_4_TX.png` 128×256 9,0 KB, `Default-Particle.png` 64×64 4,0 KB, `Crack_TX`, `Electric_3x3_2_TX`, `Lightning_2x2_02_TX`. |
| `Textures/StatusIcons/` | 131 PNG | — | Đã khảo sát và **bác bỏ hai lần** trong `ASSET_SOURCING.md` (style phẳng viền đen vs style vẽ tay của repo; game không có ô UI biểu tượng buff). Không đổi kết luận. |
| Phông chữ | **0** | `find` toàn kho: không có `.ttf`/`.otf`/`.woff*` | **KHÔNG CÓ.** |
| Bảng màu | **0** | không có tệp palette/swatch/`.ase`/`.gpl` nào | **KHÔNG CÓ.** Màu duy nhất trích được là `background: [19,22,27]` trong mỗi `clip.json`. |
| Hình nhân vật | — | — | **Đã vét sạch** ở các lần khảo sát 6–8 trong `ASSET_SOURCING.md` (portraits, cards, backgrounds, story, UI). Không tìm thấy gì mới. |
| `Catalogs/*.json` | 273 tệp JSON | — | `sfx.json`, `skill-vfx.json` (188 dòng ability→vfx), `activation.json` (105 timeline). Là dữ liệu tra cứu cho Unity, **không phải tài nguyên**. `clip.json` của mỗi clip đã đủ để dựng atlas player. |
| `Assets/` (Unity) | 4.179 `.mat`, 252 `.prefab`, 214 `.anim`, 28 `.shadergraph` | 1,5 GB | Cần Unity 2021.3 + URP 12.1.15. **Không dùng được cho game canvas thuần.** |

---

## 5. ĐỀ XUẤT CỤ THỂ — mỗi thứ gắn với một khoảnh khắc có thật trong `game.js`

Xếp theo tỉ lệ giá trị / công sức. Số dòng theo `public/game/game.js` tại thời điểm khảo sát.

### Ưu tiên 1 — Khôi phục 9 bản nhạc bị xoá nhầm (`BGM_TRACKS`, dòng 7165)

Đây là lỗ hổng lớn nhất, và nó **không cần khảo sát thêm, không cần chuyển đổi, không cần đo lại**:
10 tệp mp3 nằm nguyên trong `c8ac08f^`, đúng định dạng, đã từng chạy trong game, tổng **10,72 MB**.
Lý do xoá (`nhạc phim kiếm hiệp Hoa ngữ`) **sai với 10/13 tệp** — xem mục 2.2.

| Điền vào | Bài | Khoảnh khắc trong game | Dài |
|---|---|---|---:|
| `BGM_TRACKS.daohoa` | `bgm_daohoa_ost` (`pve_1`) | `nhacMap('daohoa')` khi vào map 1 | 114,9 s |
| `BGM_TRACKS.ngoai` | `bgm_ngoai` (`pve_2`) | `nhacMap('ngoai')` | 104,5 s |
| `BGM_TRACKS.chungnam` | `bgm_chungnam_ost` (`pve_3`) | `nhacMap('chungnam')` | 109,7 s |
| `BGM_TRACKS.tuyettinh` | `bgm_tuyettinh_ost` (`lunar_bloodmoon`) | `nhacMap('tuyettinh')` — vùng băng | 112,9 s |
| `BGM_TRACKS.comoc` | `bgm_comoc` (`halloween_battle_2023`) | `nhacMap('comoc')` — vùng tối | 125,4 s |
| `BGM_TRACKS.mongco` | `bgm_mongco` (`lunar_battle`) | `nhacMap('mongco')` | 119,2 s |
| `BGM_TRACKS.nhanmon` | `bgm_nhanmon` (`pvp`) | `nhacMap('nhanmon')` — map cuối | 217,1 s |
| `BGM_TRACKS.tuongduong` | `bgm_romance` (`home`) | `nhacMap('tuongduong')` — Ardhaven, thị trấn | 122,0 s |
| `BGM_TRACKS.pb_*` (cả 7) | `bgm_tomb` (`halloween`) | `startDungeonRun()` dòng 24069 → `buildWorld()` → `nhacMap()` | 166,2 s |

Sau bước này `Object.keys(BGM_TRACKS).length` = 15 → `uiSyncBgmBtn()` (dòng 7221) tự hiện lại nút ♪
mà không cần sửa gì thêm, và `nhacMap()` thôi trả `stopBgm()` ở mọi map.

**Cần kiểm tra trước khi tin hoàn toàn:** 9 bài này là nhạc **Axie Origins**, không phải nhạc
dark-fantasy kiểu MU. Quy tắc số 1 của `CLAUDE.md` cấm motif kiếm hiệp — nhạc Axie không phải kiếm
hiệp, nên **không vi phạm**; nhưng nó cũng chưa chắc là *đúng* chất MU/Diablo. Đây là quyết định
thẩm mỹ, phải nghe rồi chốt, không phải thứ đo được.

### Ưu tiên 2 — `BGM_BOSS` (dòng 7167, đang `null`) ← `boss.wav`

`boss.wav` **chưa từng được dùng ở bất cứ đâu**, 122,69 s, ra **0,48 MB** mp3. Ba điểm gọi có sẵn:

- `spawnBoss()` (dòng 6857) — dòng 6860 đã có `AudioSys.playBgm(BGM_BOSS)`, hiện là `null` nên
  **không làm gì**. Điền hằng số là chạy, không sửa dòng nào khác.
- `updateMaTon()` (dòng 25197) / `spawnMaTonMob()` (dòng 25222) — Hung Thần Giáng Thế,
  30 phút mỗi 4 giờ. Hiện sự kiện thế giới lớn nhất game **không có nhạc riêng**.
- `updateGolden()` (dòng 25301) — Xâm Lăng Vàng, 12 phút.

Ba sự kiện dùng chung một bài là hợp lý ở bước đầu; nếu muốn tách thì `halloween_2023.wav`
(135,0 s, 48 kHz stereo, **2,65 MB** mp3) là bài chưa dùng có chất "dữ" nhất trong 6 bài còn lại.

### Ưu tiên 3 — Sửa `throwBaoHap()` dòng 7424 bằng chính SFX kho này

Lỗi 404 mô tả ở mục 2.4. Không cần tệp mới: game đã có 9 tệp `sfx_throw_<lớp>.mp3`.
Sửa thành `AudioSys.sfx('throw_' + player.sect, 0.75)` là hết 404 **và** tiếng ném Box Kundun
đổi theo lớp — cùng lối `SECT_SFX` mà `doBasic()` (dòng 8455) và `castSkill()` đã dùng.
*Đây là sửa code, nằm ngoài phạm vi khảo sát — chỉ báo lại.*

### Ưu tiên 4 — Bốn SFX trạng thái lấp bốn chỗ đang dùng âm đi mượn

`AudioSys.sfx('levelup')` hiện bị gọi ở **34 chỗ** trong `game.js` và `sfx('quest')` ở **38 chỗ**
(`sfx('ui')` ở 47 chỗ) — hai âm này đang gánh gần như mọi loại tin vui.
Bốn tệp trong kho tách được bốn khoảnh khắc quan trọng nhất ra:

| Tệp kho | Dài | Gắn vào | Thay cho |
|---|---:|---|---|
| `secret.wav` | 3,56 s | `sigilAnnounce()` dòng 5095 → dòng 5099 | `sfx('levelup', 1)` — rơi Khắc Ấn là sự kiện hiếm nhất game (nguồn rơi chỉ 3 chỗ), đáng có âm riêng |
| `buff.wav` | 4,00 s | `renderForge()` / `forgeRule()` dòng 14907 → dòng 5514 | `sfx('forge_ok', 0.9)` — vốn **trùng byte** với `sfx_coin` |
| `summon_on.wav` | 3,12 s | `spawnMaTonMob()` dòng 25222 · `spawnGoldenMobs()` dòng 25287 | hiện **không có âm nào** báo quái sự kiện xuất hiện |
| `damage_boost.wav` | 2,88 s | `castSkill()` dòng 20570, nhánh buff riêng lớp (`BUFF_SKILL_ID`) | `sfx('skill', 0.45)` — buff và chiêu tấn công đang cùng một tiếng |

Mỗi tệp ~60–80 KB sau khi chuyển mp3. Tổng thêm dưới 350 KB.

### Ưu tiên 5 — Ba clip VFX buff gắn vào ba hệ thống đã có sẵn điểm gọi

`playStatusFx(sfxName, vfxId, x, y, vol, scale)` (dòng 795) đã là điểm gọi chuẩn, và
`VFX_ATLAS_DEFS` chỉ cần thêm một dòng mỗi clip. **Cả ba đều phải thu nhỏ ×2 trước.**

| Clip | Sau `k:2` | Gắn vào | Vì sao đúng chỗ |
|---|---:|---|---|
| `power_awaken` | 2264×2304, RAM **19,9 MB** | `levelPower()`/lên cấp — dòng 2228 (`sfx('levelup', 0.6)`) và `masteryCheckOpen()` dòng 16074 | Lên cấp hiện chỉ có âm + chữ nổi, **không có hiệu ứng hình**. Tên clip đúng nghĩa: "thức tỉnh sức mạnh". 69 khung / 1,77 s. |
| `shield_break` | 1712×1971, RAM **12,9 MB** | `hurtMob()` dòng 7737 khi `player.vhShield` về 0; đối xứng với `shield` đã dùng ở dòng 3183 | Game **đã có** clip `shield` lúc *nhận* khiên nhưng không có gì lúc khiên *vỡ*. 69 khung / 1,03 s — ngắn, hợp với một cú vỡ. |
| `death_mark_apply` | 1664×2326, RAM **14,8 MB** | `spawnBoss()` dòng 6857 / `bossStartTele()` dòng 6956 (báo hiệu chiêu boss) | `drawBossTele()` dòng 7092 hiện vẽ thủ tục; clip này là dấu ấn tử thần đọng trên mục tiêu, 81 khung / 2,30 s — đủ dài cho một quãng báo hiệu. |

Tổng thêm: 3 tấm × trung bình 15,9 MB = **47,6 MB RAM** khi cả ba cùng hiện. Cộng với 91,0 MB
hiện tại là **138,6 MB** — `vfxAtlasDon()` (dòng 774) thả sau 60 s nên đỉnh này chỉ tồn tại
khi ba sự kiện chồng nhau trong cùng một phút. Vẫn nên **đo lại bằng `window.anhDangGiuMB()`**
(dòng 780) sau khi thêm, chứ đừng tin con số cộng trên giấy.

### KHÔNG đề xuất

- **9 clip `_smash`**: 306,6 MB RAM gốc / 76,7 MB sau k2 cho một lớp phủ *thêm* lên VFX thủ tục
  vốn đã chạy. Đây gần như chắc chắn là thứ đã gây Aw!Snap và đã bị gỡ. Đừng đưa lại
  trừ khi chuyển hẳn sang đường MP4 ở mục 3.5.
- **`taunt`, `vulnerable`, `plant_throw`**: tấm trong suốt hoàn toàn, alpha = 0. Hỏng.
- **131 `StatusIcons`**: đã bác bỏ hai lần trong `ASSET_SOURCING.md`, không có dữ kiện mới.
- **`bgm_kiemhiep` / `bgm_safe` (Atia's Legacy)**: đúng là nhạc Sky Mavis chứ không phải nhạc phim
  Hoa ngữ như commit ghi, nhưng **không nằm trong kho này** → ngoài phạm vi khảo sát.
- **Toàn bộ `Assets/` Unity (1,5 GB)**: cần Unity 2021.3 + URP 12.1.15.

---

## Phụ lục — cách tái lập số đo

```bash
git clone --depth 1 https://github.com/axieinfinity/axie-origins-asset-kit /tmp/akit

# độ dài / tần số nhạc
cd /tmp/akit/Assets/OriginsKit/PvE/Music
for f in *.wav; do ffprobe -v error -show_entries format=duration \
  -show_entries stream=sample_rate,channels -of default=nw=1 "$f"; done

# kích thước + RAM của atlas (đọc IHDR, không cần PIL)
python3 - <<'PY'
import os,struct
b='/tmp/akit/web-vfx/public/vfx'
for d in sorted(os.listdir(b)):
    p=os.path.join(b,d,'atlas.png')
    if not os.path.exists(p): continue
    w,h=struct.unpack('>II',open(p,'rb').read(24)[16:24])
    print(f'{d:24s} {w}x{h} dia={os.path.getsize(p)/1048576:6.2f}MB RAM={w*h*4/1048576:6.1f}MB')
PY

# chứng minh 3 clip hỏng (alpha toàn 0)
cd /tmp/akit/web-vfx/public/vfx
ffmpeg -v quiet -i taunt/atlas.png -vf format=rgba,extractplanes=a -f rawvideo - | \
  python3 -c "import sys;b=sys.stdin.buffer.read();print('max alpha =',max(b))"

# đối chiếu nhạc đã xoá với nhạc trong kho (đường bao RMS, tương quan Pearson)
cd /home/user/axie-wuxia
git show c8ac08f^:public/game/assets/music/bgm_daohoa_ost.mp3 > /tmp/x.mp3
# rồi so /tmp/x.mp3 với /tmp/akit/Assets/OriginsKit/PvE/Music/pve_1.wav
```
