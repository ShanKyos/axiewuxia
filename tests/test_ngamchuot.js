// Chuột chỉ đâu, chiêu giáng đó.
//
// Lối chơi là chuột phải để đi, phím 1-4 để tung chiêu. Bài này lái bằng SỰ KIỆN THẬT
// (mousemove / contextmenu / keydown) chứ không gọi thẳng hàm, vì thứ dễ hỏng nhất không phải
// phép tính điểm ngắm mà là sợi dây nối từ con trỏ tới nó: quên cập nhật mouseWorld ở một
// nhánh là chiêu lặng lẽ quay về nhắm bầy gần nhất, mà nhìn thì vẫn "có nổ".
const { chromium } = require('playwright');
let bad = 0;
const fail = m => { console.log('FAIL ' + m); bad++; };
const pass = m => console.log('PASS ' + m);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  // Khung 1600×1000 chứ không phải 1280×900: có zoom rồi thì 600px thế giới = 870px màn hình,
  // khung cũ không đủ chỗ để ngắm ra ngoài tầm 420 mà con trỏ vẫn nằm trong khung.
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8853/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gameReady).catch(()=>{});
  await page.waitForTimeout(400);

  const dat = () => page.evaluate(() => {
    window.TEST_MODE = true;
    startGame('baidasan', null);
    player.level = 60; calcDerived(); vhAutoLearn(); calcDerived();
    player.hp = player.maxHp; player.qi = player.maxQi;
    mobs.length = 0; effects.length = 0;
    for (const k in player.cd) player.cd[k] = 0;
    // Đứng GIỮA MAP: đứng gần mép thì camera bị kẹp, nhân vật lệch hẳn sang một bên màn hình và
    // lề trái còn lại không đủ để ngắm ra ngoài tầm chiêu.
    player.x = 1300; player.y = 1250; snapCamera();
    return { x: player.x, y: player.y, cx: camera.x, cy: camera.y, chan: chanDy() };
  });

  // ĐỔI TOẠ ĐỘ THẾ GIỚI → ĐIỂM ẢNH MÀN HÌNH. Camera CÓ zoom (ZOOM_MUC), nên screen =
  // (world − camera) × zoom. Bản đầu của bài này viết thẳng `p.x - p.cx + 260`, tức ngầm giả
  // định zoom = 1; thêm zoom vào là cả bốn phép ngắm lệch đúng một hệ số và bài bắt vạ oan.
  const ZOOM = await page.evaluate(() => zoomNow());
  const mh = (wx, wy, cx, cy) => [(wx - cx) * ZOOM, (wy - cy) * ZOOM];

  // Chỗ tấm dán rơi xuống = tâm hiệu ứng atlasVfx vừa sinh ra.
  const noNo = () => page.evaluate(() => {
    const e = effects.filter(x => x.type === 'atlasVfx').pop();
    return e ? { x: Math.round(e.x), y: Math.round(e.y), id: e.id } : null;
  });

  // ── 1. không có quái: chiêu vẫn rơi đúng chỗ con trỏ ────────────────────────
  {
    const p = await dat();
    // đặt con trỏ lệch hẳn sang một bên, trong tầm 420 của Meteorite
    const [mx, my] = mh(p.x + 260, p.y - 120, p.cx, p.cy);
    await page.mouse.move(mx, my);
    await page.keyboard.press('2');
    await page.waitForTimeout(60);
    const o = await noNo();
    const muon = { x: p.x + 260, y: p.y - 120 };
    const lech = o ? Math.hypot(o.x - muon.x, o.y - muon.y) : 1e9;
    console.log('1) trống trơn:', JSON.stringify({ o, muon, lech: Math.round(lech) }));
    // CHAN_DY = 13: tấm dán neo ở bàn chân chứ không phải tâm người, nên lệch dọc 13px là đúng.
    if (!o || o.id !== 'meteor_rain') fail('bấm phím 2 không sinh ra tấm dán meteor_rain');
    else if (lech > 20) fail(`thiên thạch rơi cách chỗ con trỏ ${Math.round(lech)}px`);
    else pass(`thiên thạch rơi ngay chỗ con trỏ (lệch ${Math.round(lech)}px)`);
  }

  // ── 2. con trỏ ngoài tầm: rơi ở MÉP TẦM, không câm tiếng và không rơi quá xa ─
  {
    const p = await dat();
    const tam = await page.evaluate(() => skillInfo('tp').tam);
    // Ngắm sang TRÁI: nửa phải màn hình bị bảng Nhiệm Vụ (HTML) che, con trỏ ở trên đó thì
    // mousemove của canvas không nổ và mouseWorld đứng nguyên giá trị cũ — bài kiểm sẽ đo nhầm
    // lần ngắm trước chứ không phải lần này.
    // Khoảng cách ngắm đo TỪ LỀ MÀN HÌNH THẬT chứ không chép cứng 600: có zoom thì 600px thế
    // giới thành 870px màn hình, con trỏ rơi ra ngoài khung và trình duyệt kẹp nó về mép — bài
    // kiểm khi đó đo một điểm ngắm khác hẳn cái nó tưởng.
    const dLe = Math.floor(((p.x - p.cx) * ZOOM - 40) / ZOOM);
    const d = Math.min(dLe, 600);
    await page.mouse.move(...mh(p.x - d, p.y, p.cx, p.cy));
    await page.keyboard.press('2');
    await page.waitForTimeout(60);
    const o = await noNo();
    const xa = o ? Math.hypot(o.x - p.x, o.y - (p.y + p.chan)) : -1;
    const muon = Math.min(d, tam);
    console.log('2) ngoài tầm:', JSON.stringify({ tam, ngam: d, xa: Math.round(xa), muon }));
    if (!(d > tam + 40)) fail(`khung quá hẹp: chỉ ngắm ra được ${d}px mà tầm đã ${tam}px — bài kiểm không đo được gì`);
    else if (!o) fail('chỉ ra ngoài tầm thì chiêu câm hẳn — phải rơi ở mép tầm');
    else if (Math.abs(xa - muon) > 25) fail(`chỉ ra ${d}px, chiêu rơi cách ${Math.round(xa)}px (tầm ${tam})`);
    else pass(`chỉ ra ngoài tầm thì rơi ở mép tầm: ${Math.round(xa)}px / ${tam}px`);
  }

  // ── 3. ngắm lệch vài chục pixel vẫn hút vào con quái ────────────────────────
  {
    const p = await dat();
    const q = await page.evaluate(() => {
      const t = Object.keys(MOBS)[0];
      spawnMob(t, { x: player.x + 240, y: player.y - 60, r: 0 }, null, false);
      const m = mobs[mobs.length - 1];
      return { x: Math.round(m.x), y: Math.round(m.y) };
    });
    await page.mouse.move(...mh(q.x + 55, q.y + 40, p.cx, p.cy));   // lệch ~68px, trong BAN_HUT 90
    await page.keyboard.press('2');
    await page.waitForTimeout(60);
    const o = await noNo();
    // Lấy chanDy() TỪ GAME. Bản đầu chép cứng 13 — đúng hồi NV_CAO còn 118; nay là 132 nên
    // chanDy ≈ 19, và bài kiểm trượt ngưỡng đúng 0,06px. Một nguồn sự thật, không chép số.
    const lech = o ? Math.hypot(o.x - q.x, o.y - q.y - p.chan) : 1e9;
    console.log('3) hút vào quái:', JSON.stringify({ q, o, lech: Math.round(lech) }));
    if (lech > 8) fail(`ngắm lệch 68px thì chiêu không bám vào quái (còn cách ${Math.round(lech)}px)`);
    else pass('ngắm lệch vài chục pixel vẫn bám thẳng vào con quái');
  }

  // ── 4. Inferno (ô 3) cũng theo chuột, và vùng SÁT THƯƠNG dời theo hình ───────
  {
    const p = await dat();
    const r = await page.evaluate(() => {
      const t = Object.keys(MOBS)[0];
      // Một con NGAY CẠNH người niệm, một con ở xa về phía sẽ ngắm. Nhắm theo "bầy gần người
      // nhất" thì con cạnh chân mất máu; nhắm theo chuột thì chỉ con xa mất máu.
      spawnMob(t, { x: player.x + 40, y: player.y, r: 0 }, null, false);
      spawnMob(t, { x: player.x + 330, y: player.y, r: 0 }, null, false);
      const [gan, xa] = mobs.slice(-2);
      gan.hp = xa.hp = 1e9;
      // TẮT PHẢN ĐÒN. Con "cạnh chân" đứng cách người niệm 40px nên nó ĐÁNH ĐƯỢC người chơi, và
      // Thái Cực hộ thể phản lại `Math.max(1, ...)` — đúng 1 máu, đi thẳng vào m.hp KHÔNG qua
      // hurtMob. Bài này đo "vùng sát thương có đi theo con trỏ không", mà ngưỡng lại là
      // `ganMat > 0`, nên một điểm máu của một cơ chế khác hẳn cũng làm nó đỏ — đo được 1/3 lượt,
      // và có sẵn từ trước đợt vai trò (thử lại trên bản cũ: y hệt). Cô lập đúng thứ đang đo.
      player.reflect = 0;
      return { gan: { x: Math.round(gan.x), y: Math.round(gan.y), hp: gan.hp },
               xa:  { x: Math.round(xa.x),  y: Math.round(xa.y),  hp: xa.hp } };
    });
    await page.mouse.move(...mh(r.xa.x, r.xa.y, p.cx, p.cy));
    await page.keyboard.press('3');
    await page.waitForTimeout(120);
    const sau = await page.evaluate(() => {
      const [gan, xa] = mobs.slice(-2);
      return { ganMat: 1e9 - gan.hp, xaMat: 1e9 - xa.hp,
               no: (effects.filter(e => e.type === 'atlasVfx').pop() || {}).id };
    });
    console.log('4) Inferno:', JSON.stringify(sau));
    if (sau.no !== 'fire_pillar') fail(`bấm phím 3 sinh ra ${sau.no}, phải là fire_pillar`);
    else if (!(sau.xaMat > 0)) fail('cột lửa nổ chỗ con trỏ mà con quái ở đó không mất máu — hình một đằng, sát thương một nẻo');
    else if (sau.ganMat > 0) fail('con quái cạnh chân cũng mất máu — vùng sát thương vẫn neo ở người niệm');
    else pass(`cột lửa chỉ đốt con quái ở chỗ con trỏ (−${Math.round(sau.xaMat)}), con cạnh chân không hề hấn`);
  }

  // ── 5. chuột phải để đi cũng là một lần chỉ chỗ ─────────────────────────────
  {
    const p = await dat();
    const [mx, my] = mh(p.x - 200, p.y + 150, p.cx, p.cy);
    await page.mouse.click(mx, my, { button: 'right' });
    await page.waitForTimeout(50);
    const diTo = await page.evaluate(() => moveTarget && { x: Math.round(moveTarget.x), y: Math.round(moveTarget.y) });
    await page.keyboard.press('2');
    await page.waitForTimeout(60);
    const o = await noNo();
    const lech = o ? Math.hypot(o.x - (p.x - 200), o.y - (p.y + 150 + p.chan)) : 1e9;
    console.log('5) chuột phải:', JSON.stringify({ diTo, o, lech: Math.round(lech) }));
    if (!diTo) fail('chuột phải không đặt được đích di chuyển');
    else if (lech > 20) fail(`chiêu không rơi ở chỗ vừa chuột phải (lệch ${Math.round(lech)}px)`);
    else pass('chuột phải vừa đặt đích đi vừa là chỗ chiêu sẽ giáng');
  }

  console.log('errors:', JSON.stringify(errors.slice(0, 10)));
  if (errors.length) fail(`${errors.length} lỗi JS trong lúc chạy`);
  await browser.close();
  if (bad){ console.log(`FAIL(${bad})`); process.exit(1); }
  console.log('PASS');
})();
