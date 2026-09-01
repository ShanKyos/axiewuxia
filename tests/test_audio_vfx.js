const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  const failedAudio = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', res => {
    const url = res.url();
    if ((url.includes('/assets/music/') || url.includes('/assets/vfx/')) && res.status() >= 400) {
      failedAudio.push(`${res.status()} ${url}`);
    }
  });
  await page.goto('http://localhost:8850/?max=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    newPlayer('thieulam'); // Mech
    player.level = 60; calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
    el('intro-story').classList.add('hidden');
    el('quze-screen') && el('quze-screen').classList.add('hidden');
    el('hud').classList.remove('hidden'); el('skillbar').classList.remove('hidden');
  });

  // 1) Check all 8 BGM_TRACKS map keys resolve to files that actually load (readyState/duration)
  const bgmCheck = await page.evaluate(async () => {
    const out = {};
    for (const [map, name] of Object.entries(BGM_TRACKS)) {
      const a = new Audio('assets/music/' + name + '.mp3');
      await new Promise(r => {
        a.addEventListener('loadedmetadata', r, { once: true });
        a.addEventListener('error', r, { once: true });
        setTimeout(r, 2000);
      });
      out[map] = { name, duration: a.duration || 0, error: !!a.error };
    }
    return out;
  });
  console.log('BGM_TRACKS check:', JSON.stringify(bgmCheck, null, 1));

  // 2) Cast basic attack + skillA + TP for each of the 9 classes, capture Audio src requests
  const classes = ['thieulam','toanchan','baidasan','minhgiao','bug']  // 5 lớp MU (comoc/doanthi/daohoa/dawn đã bỏ);
  const audioLog = await page.evaluate(async (classes) => {
    const seen = [];
    const OrigAudio = window.Audio;
    window.Audio = function(src) {
      seen.push(src);
      return new OrigAudio(src);
    };
    window.Audio.prototype = OrigAudio.prototype;
    for (const cls of classes) {
      player.sect = cls; calcDerived();
      player.qi = player.maxQi;
      player.cd.basic = 0; player.cd.a = 0; player.cd.tp = 0;
      doBasic();
      castSkill('a');
      player.cd.a = 0;
      castSkill('tp');
    }
    window.Audio = OrigAudio;
    return seen;
  }, classes);
  console.log('Audio() calls (basic+amkhi only pass):', JSON.stringify(audioLog));

  console.log('ERRORS', JSON.stringify(errors.filter(e => !e.includes('404'))));
  console.log('FAILED AUDIO/VFX REQUESTS', JSON.stringify(failedAudio));
  await browser.close();
})();
