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
  await page.waitForTimeout(300);

  const setup = await page.evaluate(() => {
    player.level = 110; player.xp = 0; player.free = 0; player.equip = {};
    player.str = 90; player.agi = 90; player.def = 90; player.vit = 90; // mức tự nhiên — tránh 1-shot boss như lần trước (str300 quá tay)
    questIdx = 35; questState = 'active';
    calcDerived(); player.hp = player.maxHp; player.qi = player.maxQi;
    player.auto = false;
    travelTo('pb_nhanmon'); // boss_amthan — hp cao nhất, đủ thời gian quan sát vòng đời chiêu
    return { curMap, maxHp: player.maxHp };
  });
  console.log('setup:', JSON.stringify(setup));

  const r1 = await page.evaluate(async () => {
    let ticks = 0;
    while (ticks < 3000 && !(DGN && DGN.huntSpawned)){
      if (player.hp < player.maxHp) player.hp = player.maxHp;
      for (const m of mobs) if (!m.dead && m.hp > 0) hurtMob(m, 999999, 'hit');
      update(0.05);
      ticks++;
      if (ticks % 40 === 0) await new Promise(res => setTimeout(res, 20));
    }
    return { ticks, huntSpawned: DGN && DGN.huntSpawned, autoAfterSpawn: player.auto };
  });
  console.log('spawn:', JSON.stringify(r1));

  // Đứng cạnh boss (melee range) suốt trận, KHÔNG tự né (không nhấn J), tự đánh tay liên tục (doBasic)
  // -> phải thấy: (a) player HP giảm khi 1 chiêu telegraph resolve trong lúc đứng cạnh, (b) boss HP
  // giảm dần do player tự đánh, (c) không crash.
  const r2 = await page.evaluate(async () => {
    const hb0 = DGN.huntRef;
    let hitCount = 0, dmgTaken = 0;
    let ticks = 0, telesSeen = [], teleHits = [];
    let wasTele = false;
    while (ticks < 6000 && !hb0.dead && player.hp > 0){ // 300 sim sec trần
      // đứng sát boss (melee) mỗi frame, không né
      player.x = hb0.x + 30; player.y = hb0.y;
      if (player.cd.basic <= 0) doBasic(); // tự đánh tay
      if (hb0.tele && !wasTele){ wasTele = true; telesSeen.push(hb0.tele.mvId); }
      const wasHp = player.hp;
      update(0.05);
      if (!hb0.tele) wasTele = false;
      if (player.hp < wasHp){ dmgTaken += (wasHp - player.hp); hitCount++; teleHits.push(Math.round(wasHp - player.hp)); }
      ticks++;
    }
    return {
      ticks, hitCount, dmgTaken, telesSeen, teleHits,
      bossHpAfter: Math.round(hb0.hp), bossMaxHp: hb0.maxHp, bossDead: hb0.dead,
      playerHpAfter: Math.round(player.hp), playerMaxHp: player.maxHp, playerDied: player.hp <= 0,
    };
  });
  console.log('melee-stand-and-tank trace:', JSON.stringify(r2, null, 1));

  console.log('errors:', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
})();
