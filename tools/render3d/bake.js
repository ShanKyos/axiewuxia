// ═══════════════════════════════════════════════════════════════════════════════
// NƯỚNG SPRITE — chụp model 3D thành bảng ảnh 2D
// ─────────────────────────────────────────────────────────────────────────────
//   node tools/render3d/bake.js [tên-bộ] [thư-mục-ra]
//
// Xuất hai file: <bộ>.png (atlas) và <bộ>.json (chỉ mục).
// Bố cục atlas: mỗi HÀNG là một khung hình, mỗi CỘT là một hướng (8 hướng).
// Các động tác xếp chồng theo chiều dọc, JSON ghi hàng bắt đầu của từng động tác.
//
// ⚠ CHI PHÍ NỞ THEO CẤP SỐ NHÂN. 8 hướng × 18 khung = 144 ảnh cho MỘT bộ giáp
// của MỘT lớp. Game có 220 món và 5 lớp — nướng sẵn mọi tổ hợp là bất khả thi,
// đó chính là lý do giáp phải là LỚP ĐẮP (gear.js) chứ không phải render lại.
// ═══════════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { buildHero } from './hero.js';
import { buildGear, SETS } from './gear.js';
import { makeView, render, downsample } from './raster.js';
import { encodePNG } from './png.js';

const FW = 128, FH = 176;      // hộp một khung
const SS = 3;                  // bội lấy mẫu để khử răng cưa
const DIRS = 8;
const ELEV = 26;               // góc ngẩng camera — kiểu 3/4 nhìn xuống
const SCALE = 88;              // đơn vị thế giới → điểm ảnh
const GROUND = 10;             // chừa dưới chân
const FRAMES = { i: 4, w: 8, c: 6 };

const setKey = process.argv[2] || 'velmyr';
const outDir = process.argv[3] || 'public/game/assets/hero3d';
if (!SETS[setKey]){ console.error('Không có bộ:', setKey, '— có:', Object.keys(SETS).join(', ')); process.exit(1); }

const order = Object.keys(FRAMES);
const rows = order.reduce((n, a) => n + FRAMES[a], 0);
const AW = FW * DIRS, AH = FH * rows;
const atlas = new Uint8Array(AW * AH * 4);
const index = { frameW: FW, frameH: FH, dirs: DIRS, elev: ELEV, set: setKey, actions: {} };

let row = 0, n = 0;
const t0 = Date.now();
for (const act of order){
  index.actions[act] = { row0: row, frames: FRAMES[act] };
  for (let f = 0; f < FRAMES[act]; f++){
    const t = f / FRAMES[act];
    for (let d = 0; d < DIRS; d++){
      const h = buildHero(act, t, { geared: true });
      buildGear(h.scene, h.joints, setKey);
      const px = render(h.scene, { w: FW*SS, h: FH*SS, view: makeView(ELEV, d * (360/DIRS)),
                                   scale: SCALE*SS, oy: GROUND*SS });
      const im = downsample(px, FW*SS, FH*SS, SS);
      for (let y = 0; y < FH; y++){
        const src = y * FW * 4;
        const dst = ((row + f) * FH + y) * AW * 4 + d * FW * 4;
        atlas.set(im.px.subarray(src, src + FW*4), dst);
      }
      n++;
    }
  }
  row += FRAMES[act];
}
fs.mkdirSync(outDir, { recursive: true });
const png = encodePNG(atlas, AW, AH);
fs.writeFileSync(path.join(outDir, setKey + '.png'), png);
fs.writeFileSync(path.join(outDir, setKey + '.json'), JSON.stringify(index, null, 2));
console.log(`${setKey}: ${n} khung · atlas ${AW}×${AH} · ${(png.length/1024).toFixed(0)} KB · ${((Date.now()-t0)/1000).toFixed(1)}s`);
