const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(800);

  const result = await page.evaluate(() => {
    const points = {
      spawn:[460,460], truonglang:[400,400], duocsu:[560,430], spring:[500,620],
      boss_arena:[2300,500], herb1:[620,560], herb2:[760,700], herb3:[950,640],
      herb4:[1080,820], herb5:[900,1180], herb6:[1200,900], herb7:[1350,1050],
      herb8:[1550,950], portal:[2250,950], boar1:[800,520], boar2:[1000,1000],
      hautu:[640,860], caodo:[1250,1300], trannhan:[1500,560], wolf1:[1650,760],
      wolf2:[1400,1450], bandit1:[800,1550], bandit2:[2050,1250], assassin:[1900,420],
      spawnFrom_pb:[2250,1040],
    };
    const out = {};
    for (const k in points) {
      const [x,y] = points[k];
      out[k] = inObstacle('daohoa', x, y, 13);
    }
    return out;
  });
  console.log(JSON.stringify(result, null, 1));
  await browser.close();
})();
