// Trúng đòn phải làm ĐỔI hình nhân vật, không chỉ nhấp viền đỏ màn hình.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);
  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', null);
    player.x = MAP.w/2; player.y = MAP.h/2; player.face = 0;
    mobs.length = 0; effects.length = 0;
    const grab = () => {
      render();
      const c = document.querySelector('canvas'), g = c.getContext('2d');
      const sx = Math.round(player.x - camera.x) - 60, sy = Math.round(player.y - camera.y) - 110;
      return g.getImageData(sx, sy, 120, 140).data;
    };
    const diff = (a, bb) => { let n = 0; for (let i = 0; i < a.length; i += 4)
      if (a[i] !== bb[i] || a[i+3] !== bb[i+3]) n++; return n; };
    player.hurtT = 0; const calm = grab();
    player.hurtT = 0.3;  const hit  = grab();
    player.hurtT = 0;
    return { changedPixels: diff(calm, hit) };
  });
  console.log(JSON.stringify(r), 'errors:', JSON.stringify(errs));
  console.log(r.changedPixels > 150 && !errs.length ? 'PASS' : 'FAIL');
  await b.close();
})();
