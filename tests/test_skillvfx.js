const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(500);

  // 1) DW Meteor (Trấn Phái sx_baidasan_c) resolves to the new 'meteor' style, no atlas overlay spawned
  const r1 = await page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('baidasan', null);
    player.level = 60; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
    effects.length = 0;
    player.qi = player.maxQi; player.tpCd = 0;
    castSkill('tp');
    const vfx = effects.filter(e => e.type === 'vfx');
    const atlas = effects.filter(e => e.type === 'atlasVfx');
    return { vfxStyles: vfx.map(e => e.style), atlasCount: atlas.length };
  });
  console.log('1) DW Meteor VFX (expect style includes "meteor", 0 atlas overlays):', JSON.stringify(r1));

  // 2) Dark Lord Dark Raven (VOHOC dl_darkraven) resolves to the new 'crowswarm' style
  const r2 = await page.evaluate(() => {
    startGame('bug', null);
    player.level = 60; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
    effects.length = 0;
    castVohoc('dl_darkraven');
    const vfx = effects.filter(e => e.type === 'vfx');
    return { vfxStyles: vfx.map(e => e.style), color: VOHOC_DEFS.dl_darkraven.color };
  });
  console.log('2) Dark Lord Dark Raven VFX (expect style includes "crowswarm"):', JSON.stringify(r2));

  // 3) render() with a 'meteor' and a 'crowswarm' effect active does not throw
  const r3 = await page.evaluate(() => {
    effects.length = 0;
    addEffect({ type:'vfx', style:'meteor', x:player.x, y:player.y, face:0, r:180, c1:'#ff9a3a', c2:'#ffcf7a', glyph:'絕', dur:0.7, big:true });
    addEffect({ type:'vfx', style:'crowswarm', x:player.x, y:player.y, face:0, r:180, c1:'#2a1a3a', c2:'#ff5a3a', glyph:'鴉', dur:0.7, big:true, spin:0 });
    for (let i = 0; i < 20; i++) { update(0.05); render(); }
    return { ok: true, remainingEffects: effects.length };
  });
  console.log('3) render loop with new styles survives 20 frames:', JSON.stringify(r3));

  // 4) Sanity: other unrelated sect ultimates still render fine (no regression to shared drawVfx dispatch)
  const r4 = await page.evaluate(() => {
    startGame('thieulam', null);
    player.level = 60; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
    effects.length = 0;
    player.qi = player.maxQi; player.tpCd = 0;
    castSkill('tp');
    const vfx = effects.filter(e => e.type === 'vfx');
    for (let i = 0; i < 10; i++) { update(0.05); render(); }
    return { vfxStyles: vfx.map(e => e.style) };
  });
  console.log('4) unrelated class (Dark Knight) Trấn Phái still works:', JSON.stringify(r4));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
