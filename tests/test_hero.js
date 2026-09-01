// Nhân vật khớp xương: kiểm tra 5 lớp render được, khung hình có KHÁC nhau
// (tức là animation thật, không phải hình tĩnh), và bậc Thần Binh đổi màu giáp.
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  // 404 của assets/skills/vh_*.png là probe cố ý — probeSkillIcons() tự sinh icon MU thay thế
  p.on('console', m => { if (m.type() === 'error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const res = await p.evaluate(() => {
    window.TEST_MODE = true;
    startGame('thieulam', null);
    const out = { classes: {}, errors: [] };

    // vẽ 1 nhân vật ra canvas riêng để so sánh pixel giữa các khung hình
    function shot(sect, tier, pose){
      const cv = document.createElement('canvas'); cv.width = HERO_W; cv.height = HERO_H;
      const g = cv.getContext('2d');
      drawHeroFigure(g, sect, tier, 0, pose);
      return g.getImageData(0, 0, HERO_W, HERO_H).data;
    }
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i+3] !== b[i+3]) n++; return n; };
    const ink = a => { let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i] > 8) n++; return n; };

    for (const sect of ['thieulam','toanchan','baidasan','minhgiao','bug','vophai']){
      const idle = shot(sect, 1, heroPose(0, false, 0, 0, 0));
      const walkA = shot(sect, 1, heroPose(0.9, true, 0, 0, 0));
      const walkB = shot(sect, 1, heroPose(0.9 + Math.PI, true, 0, 0, 0));
      const atk = shot(sect, 1, heroPose(0, false, 0.55, 0, 0));
      const t10 = shot(sect, 10, heroPose(0, false, 0, 0, 0));
      out.classes[sect] = {
        pixels: ink(idle),
        walkCycleMoves: diff(walkA, walkB),   // 2 nửa sải chân phải khác nhau
        attackMoves: diff(idle, atk),          // tư thế vung phải khác đứng yên
        tierChangesArmor: diff(idle, t10),     // bậc 10 phải đổi màu giáp
      };
    }

    // chạy thật trong game: di chuyển + đánh, 40 khung, không được lỗi
    player.moving = true; player.walkPh = 0;
    for (let i = 0; i < 40; i++){ update(0.05); render(); }
    player.atkAnim = 0.2;
    for (let i = 0; i < 10; i++){ update(0.02); render(); }
    return out;
  });

  console.log(JSON.stringify(res.classes, null, 1));
  let bad = 0;
  for (const [k, v] of Object.entries(res.classes)){
    if (v.pixels < 3000) { console.log('FAIL vẽ quá ít pixel:', k, v.pixels); bad++; }
    if (v.walkCycleMoves < 200) { console.log('FAIL sải chân không đổi:', k); bad++; }
    if (v.attackMoves < 200) { console.log('FAIL tư thế đánh không đổi:', k); bad++; }
    if (v.tierChangesArmor < 100 && k !== 'vophai') { console.log('FAIL bậc Thần Binh không đổi giáp:', k); bad++; }
  }
  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'PASS' : 'FAIL(' + bad + ')');
  await b.close();
})();
