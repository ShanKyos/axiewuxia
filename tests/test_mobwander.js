const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);
  await page.evaluate(() => { startGame('thieulam', null); });
  await page.waitForTimeout(800);

  // Move player far from all mobs so nothing aggros, then sample a few mob positions over time.
  const sample0 = await page.evaluate(() => {
    travelTo('daohoa');
    player.x = 2500; player.y = 50; // far corner, away from packs
    return mobs.filter(m => !m.dead).slice(0, 5).map(m => ({ id: m.type, x: Math.round(m.x), y: Math.round(m.y), homeX: Math.round(m.homeX), homeY: Math.round(m.homeY) }));
  });
  console.log('sample @ t=0:', JSON.stringify(sample0));

  await page.waitForTimeout(4000); // let a few wander cycles happen (game loop runs regardless of tab focus in this harness? check)
  const sample1 = await page.evaluate(() => mobs.filter(m => !m.dead).slice(0, 5).map(m => ({ id: m.type, x: Math.round(m.x), y: Math.round(m.y) })));
  console.log('sample @ t=4s:', JSON.stringify(sample1));

  const moved = sample0.some((m0, i) => sample1[i] && (Math.abs(m0.x - sample1[i].x) > 1 || Math.abs(m0.y - sample1[i].y) > 1));
  console.log('any mob moved while idle:', moved);

  // Now test aggro/chase still works: teleport player right next to first mob's home
  const firstHome = sample0[0];
  await page.evaluate(({x,y}) => { player.x = x; player.y = y; }, { x: firstHome.homeX, y: firstHome.homeY });
  await page.waitForTimeout(1500);
  const afterAggro = await page.evaluate(() => player.hp);
  console.log('player HP after standing next to pack (should have taken damage if aggro/attack still works):', afterAggro);

  // Test respawn VFX: kill a mob near player, wait for respawn, check effects array for 'spawnbeam'
  const killResult = await page.evaluate(() => {
    const m = mobs.find(mm => !mm.dead && dist(mm.x, mm.y, player.x, player.y) < 300);
    if (!m) return { found: false };
    m.hp = 0;
    killMob(m, 'test');
    return { found: true, type: m.type };
  });
  console.log('kill result:', JSON.stringify(killResult));
  let spawnbeamSeen = false;
  for (let i = 0; i < 20 && !spawnbeamSeen; i++){
    await page.waitForTimeout(300);
    spawnbeamSeen = await page.evaluate(() => effects.some(e => e.type === 'spawnbeam'));
    if (spawnbeamSeen) await page.screenshot({ path: '/tmp/mob_respawn.png' });
  }
  console.log('spawnbeam effect ever seen during respawn window:', spawnbeamSeen);
  if (!spawnbeamSeen) await page.screenshot({ path: '/tmp/mob_respawn.png' });

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  await browser.close();
})();
