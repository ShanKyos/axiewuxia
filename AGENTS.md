# AGENTS.md

Hướng dẫn cho agent làm việc trên repo này nằm ở **[`CLAUDE.md`](./CLAUDE.md)** — đọc file đó
trước khi làm bất cứ việc gì.

Tóm tắt những thứ dễ làm sai nhất:

1. **Phong cách là MU Online, KHÔNG phải kiếm hiệp.** Tên thư mục `axie-wuxia` chỉ là di sản.
2. **Không dùng tên riêng của MU Online** trong text người chơi thấy (Kundun, Lorencia,
   Devil Square…). Có bảng tên thay thế trong `CLAUDE.md`.
3. **Production = VPS `http://14.225.204.107/`**, tự kéo từ nhánh `main` mỗi 2 phút bằng cron.
   **Deploy = merge vào `main`.** KHÔNG phải Vercel, dù repo có `vercel.json`.
   Sandbox không SSH được vào VPS — mọi lệnh cần chạy trên VPS phải đưa người dùng tự chạy.
4. **Trước khi merge vào `main`:** chạy đủ `npm run lint`, `npm run check`, `npm test`, và bộ
   regression game trong scratchpad. Merge là live sau 2 phút, không có bước duyệt nào ở giữa.
5. Toàn bộ game nằm trong **một file**: `public/game/game.js`.

---

# Agent: Quality Control (QA)

Đúc kết từ nhiều phiên. **Đọc trước khi viết test đầu tiên** — mọi cái bẫy dưới đây đều đã
làm hỏng ít nhất một phép đo thật, và phần lớn chúng **fail im lặng**: test vẫn xanh, số vẫn
in ra, chỉ là nó đo nhầm thứ.

## 1. Nguyên tắc gốc

> **Test phải chứng minh HÀNH VI ĐỔI, không phải chứng minh code tồn tại.**

Kiểm `typeof SIGIL_DEFS.dk_lantram === 'object'` là vô dụng — nó chỉ nói bảng dữ liệu có mặt.
Cách đúng: dựng **cùng một tình huống hai lần** (tắt / bật) rồi so số đo. Giống nhau ⇒ tính
năng không làm gì, dù mô tả có hay tới đâu.

```js
function ab(setup, run, bat){
  const A = (setup(), tat(),  run());
  const B = (setup(), bat_(), run());
  return { A, B };            // A === B  ⇒  TRƯỢT
}
```

Kèm theo: **luôn có đối chứng**. Khẳng định "Spellblade lệch vai" chỉ có nghĩa khi kèm
"Dark Knight đối xứng" ra đúng 0 — nếu không, phép đo có thể đang bắt một thứ khác hoàn toàn
(và nó **đã** bắt nhầm: nó bắt thanh kiếm).

## 2. Hạ tầng

```bash
# HAI server, cả hai đều cần
cd public/game && (python3 -m http.server 8853 &)   # test đời mới
cd public/game && (python3 -m http.server 8850 &)   # test đời cũ

NODE_PATH=/opt/node22/lib/node_modules node <scratchpad>/test_x.js   # playwright cài global
# chromium: /opt/pw-browsers/chromium

# chạy toàn bộ (~85 test, ~25 phút)
for f in test_*.js; do echo "=== $f ===" >> /tmp/reg/all.log
  NODE_PATH=/opt/node22/lib/node_modules timeout 200 node "$f" >> /tmp/reg/all.log 2>&1 \
    || echo "EXIT_FAIL $f" >> /tmp/reg/all.log; done
```

⚠ **Server nền hay bị thu hồi giữa phiên.** Thấy NHIỀU test đỏ cùng lúc với
`ERR_CONNECTION_REFUSED` ⇒ **kiểm server trước**, đừng đi tìm lỗi trong code. Đã mất thời gian
vì chuyện này hai lần.

Trong test: `window.TEST_MODE = true; startGame('<lớp>', null);` rồi gọi thẳng hàm game.

## 3. Bẫy — mỗi cái đã làm hỏng một phép đo thật

| Bẫy | Triệu chứng | Cách đúng |
|---|---|---|
| **WASD đã bị gỡ** | đặt `keys.d = true` để bắt nhân vật chạy → mọi số đo ra **0**, không báo lỗi | dùng `moveTarget = {x,y}` (click-to-move) |
| **Reset `player.cd` mỗi khung** | nhân vật spam chiêu vô hạn → hạ boss trong 0,1s | để hệ hồi chiêu thật chạy |
| **Nhảy thẳng `player.level`** | chiêu mới không được học | phải tự gọi `vhAutoLearn()` |
| **Đo trên NGUYÊN hình nhân vật** | mọi lớp cầm vũ khí một tay ⇒ luôn "bất đối xứng"; đo được thanh kiếm chứ không phải vai giáp | vẽ RIÊNG lớp cần đo (`hPauldrons(...)`) |
| **Ngưỡng alpha thấp khi đo đường viền** | hào quang là đĩa gradient bán trong suốt phủ kín khung ⇒ đo nhầm mép hào quang (912 px trong khi thân đổi 117) | ngưỡng alpha **180** |
| **`swingFeel` gom theo cửa sổ 60 ms** | đòn của phần test TRƯỚC còn giữ `_swingBest` ⇒ hitstop đo ra **0** | đặt `_swingT = 0` trước mỗi phép đo |
| **`atkAnim` ĐẾM NGƯỢC** | `atkK` = 1 ở khung ĐẦU; duyệt 0→1 là đọc ngược thời gian | duyệt `atkK` từ 1 xuống 0 |
| **Cắt chuỗi trước khi khẳng định** | `.slice(0,220)` cắt mất đúng đoạn cần tìm ⇒ FAIL giả | so trên chuỗi nguyên |
| **`str.replace(a, b, 0)` trong Python** | `0` nghĩa là "thay 0 lần" ⇒ script im lặng không làm gì | luôn `assert s.count(a) == 1` trước khi thay |
| **Regex bỏ sót lời gọi động/ternary** | `AudioSys.sfx(x ? 'crit' : 'hit', …)` và `'slash_' + cls` không khớp `sfx\('([^']+)'` ⇒ báo sai cả hai chiều | gom cả tiền tố động, `playStatusFx()`, và ternary |
| **Dựng vật phẩm bằng `genItem()` rồi ghi đè `slot`** | `main.v` vẫn tính theo ô CŨ ⇒ món "yếu" hoá ra mạnh gấp 4 | dựng vật phẩm **tất định** từ `SLOTS[].base()` |

## 4. Ba gate CI — chạy TRƯỚC khi merge vào `main`

```bash
npm run lint     # ⚠ eslint CÓ soi public/game/game.js (override ở eslint.config.js)
npm run check    # tsc -b
npm test         # vitest
node --check public/game/game.js
```

`main` từng đỏ sẵn 6 lỗi lint. Nếu lint báo lỗi, **đối chiếu với `origin/main`** để biết lỗi
nào là của mình:

```bash
cp public/game/game.js /tmp/mine.js
git show origin/main:public/game/game.js > public/game/game.js
npx eslint public/game/game.js          # lỗi ở đây = có sẵn, không phải của mình
cp /tmp/mine.js public/game/game.js
```

## 5. Kiểm tham chiếu tài nguyên

Code trỏ tới file **không tồn tại** là loại lỗi không test nào hiện có bắt được, và nó **im
lặng**: `AudioSys.sfx('hit')` chỉ đơn giản là không phát ra tiếng gì.

- `sfx_hit.mp3` và `sfx_bikip.mp3` **không có trên đĩa** — hậu quả: suốt nhiều tháng mọi đòn
  thường im lặng lúc chạm, chỉ bạo kích có tiếng.
- Ngược lại, **26 icon `assets/skills/vh_*.png` 404 là CỐ Ý** — `probeSkillIcons()` bắt
  `onerror` rồi tự sinh icon vector. Đừng "sửa" cái này.

⇒ Nên có script quét tham chiếu ↔ file trên đĩa chạy trong CI. **Chưa làm.**

## 6. Hiệu năng

- ⚠ **Không bao giờ thêm `ctx.filter` mới** trong vòng vẽ. Buộc canvas dựng surface phụ, chi
  phí tuyến tính theo số đối tượng. Từng đo: 20 quái thường 21,6 ms/khung → **12 quái đang
  loé 910 ms/khung**. Dùng `globalCompositeOperation` hoặc bản nhuộm sẵn có cache.
- `ctx.shadowBlur` cùng họ (18 chỗ trong file) — dùng `createRadialGradient` thay thế.
- `SETTINGS.lowFx` gần như không cứu được gì (594 ms vs 599 ms): 20 điểm dùng nó đều nhắm vào
  sương/hạt môi trường, không nhắm vào thứ đắt thật.

## 7. Bộ test hiện có (~85 file trong scratchpad)

Nhóm đáng chú ý — tất cả đều theo mẫu A/B ở §1:

| File | Chứng minh điều gì |
|---|---|
| `test_sigil.js` | 12 Khắc Ấn, mỗi cái tắt/bật phải cho số đo khác nhau |
| `test_itemcompare.js` | so sánh đồ + 3 bẫy (tự-mặc-đồ, xếp hạng, auto-bán) |
| `test_gearlook.js` | trang bị hiện lên người; đường viền phình đều theo bậc |
| `test_plusglow.js` | mốc +4/+7/+10; mỗi cấp từ +4 đều đổi hình |
| `test_sets.js` | 25 bộ; 5 lớp khác nhau >3000 px; Spellblade lệch vai |
| `test_anim.js` | quán tính · vai theo tay · lấy đà/vượt đà |
| `test_feel.js` | 6 mục cảm giác chiến đấu |
| `test_story.js` | quét tên riêng MU Online trong toàn bộ text người chơi thấy |

⚠ Test cũ dễ **ôi** khi refactor (từng có test lặp 9 lớp đã xoá, gọi hàm đã gỡ, dùng cấu trúc
dữ liệu cũ). Đỏ ở test cũ **chưa chắc là hồi quy** — đọc kỹ trước khi kết luận.

---

## Nợ kỹ thuật đã biết — QA Agent đo được, chưa sửa

Bốn mục dưới đây **đã xác minh bằng phép đo**, không phải nghi ngờ. Không chặn phát hành
nhưng đều là "game hơi sai" mà không crash, không log — nên rất dễ nằm im mãi.

1. **Nâng VŨ KHÍ không hiện lên nhân vật.** `gv.wTier` / `gv.wPlus` được ghi trong
   `gearVisual()` nhưng **không đọc ở đâu cả**. Đổi vũ khí `t1 +0` → `t10 +11` cho ra ảnh
   chân dung y hệt từng byte. Giáp thì phình theo bậc, vũ khí thì không — trái với dòng
   "Nâng trang bị phải NHÌN THẤY được" trong CLAUDE.md.
2. **Xung Phong bị `moveTarget` cũ kéo ngược.** Móc `pre` dời người chơi tới địch nhưng
   không xoá `moveTarget`, nên 1s sau người chơi đang đi xa dần con vừa lao vào. AUTO thì
   không sao (tự neo lại). Chỉ cần thêm `moveTarget = null` trong `sb_xungphong.pre`.
3. **`m.hitCol` bị bỏ qua với quái dùng ẢNH.** `tintedImg()` dùng bộ lọc CỐ ĐỊNH, nên
   "màu loé theo loại đòn" (trắng thường / vàng bạo kích / màu hệ) chỉ hiện trên quái khung
   xương. Quái vàng đang loé cũng mất luôn màu vàng trong 0,15s.
4. **Đòn thường đã hẹn có thể quay 180°.** `nearestMob(ph.reach)` không xét hướng nhìn: con
   phía trước chết trong 0,09s thì đòn ăn vào con **sau lưng** trong khi hoạt ảnh vẫn bổ về
   trước. Ngoài ra `reach = rng * 1.15` rộng hơn tầm lúc vung 15%.
