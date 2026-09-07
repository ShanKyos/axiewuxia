// CHUỖI NHIỆM VỤ CHÍNH — GÁC HÌNH HỌC, KHÔNG GÁC LỜI THOẠI.
//
// Bảng QUESTS là dữ liệu thuần, mà máy chạy nhiệm vụ thì có BA chỗ ghép cứng dễ vỡ khi ai đó
// chèn/xoá một mục mà không đọc code:
//   ① `questIdx === 9` gọi spawnBoss() ⇒ mục THỨ 10 phải là trận đấu trùm, không thể là mục khác.
//   ② `type:'boss'` bật victory + showVictory() ⇒ chỉ được có ĐÚNG MỘT mục loại đó.
//   ③ `q.npc` phải là NPC `talk:'quest'`, nếu không thì không có bảng nào để trả nhiệm vụ —
//      người chơi làm xong mà không nộp được, chuỗi kẹt vĩnh viễn ở đó.
// Thêm: mọi `mob`/`map`/`targetNpc`/`herbMap` phải TỒN TẠI THẬT, và cấp phải tăng dần.
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8853';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${PORT}/index.html?max=1`, { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  const r = await p.evaluate(() => {
    const npcQuest = new Set(NPCS.filter(n => n.talk === 'quest').map(n => n.id));
    const hong = [];
    let bocLui = 0, boss = 0, bossO = -1;
    QUESTS.forEach((q, i) => {
      if (!npcQuest.has(q.npc)) hong.push(`${q.id}: npc '${q.npc}' không phải talk:'quest'`);
      if (q.targetNpc && !NPCS.some(n => n.id === q.targetNpc)) hong.push(`${q.id}: targetNpc '${q.targetNpc}' không có`);
      if (q.mob && !MOBS[q.mob]) hong.push(`${q.id}: mob '${q.mob}' không có`);
      if (!MAPS[q.map]) hong.push(`${q.id}: map '${q.map}' không có`);
      if (q.type === 'collect' && !(HERB_SPOTS[q.herbMap] || []).length) hong.push(`${q.id}: herbMap '${q.herbMap}' không có bãi thảo dược`);
      if (!q.rew || !q.rew.xp) hong.push(`${q.id}: thiếu thưởng xp`);
      if (i && q.lv < QUESTS[i-1].lv) bocLui++;
      if (q.type === 'boss'){ boss++; bossO = i; }
    });
    const ids = QUESTS.map(q => q.id);
    return { so: QUESTS.length, hong, bocLui, boss, bossO,
             trungId: ids.length - new Set(ids).size,
             chuong: [...new Set(QUESTS.map(q => q.chapter))].length,
             npcThieuArt: [...new Set(QUESTS.map(q => q.npc))].filter(id => {
               const n = NPCS.find(x => x.id === id); return !n || !n.img; }) };
  });

  console.log(JSON.stringify(r, null, 1));
  let bad = 0;
  const fail = m => { console.log('FAIL ' + m); bad++; };
  const pass = m => console.log('PASS ' + m);

  if (!r.so) fail('bảng QUESTS rỗng');
  else pass(`${r.so} mục · ${r.chuong} chương`);
  if (r.hong.length) fail('tham chiếu chết: ' + r.hong.join(' · '));
  else pass('mọi npc/targetNpc/mob/map/herbMap đều tồn tại thật');
  if (r.trungId) fail(`${r.trungId} id trùng nhau`);
  else pass('id không trùng');
  if (r.bocLui) fail(`${r.bocLui} chỗ cấp yêu cầu TỤT so với mục trước — chuỗi sẽ tự khoá`);
  else pass('cấp yêu cầu tăng dần suốt chuỗi');
  if (r.boss !== 1) fail(`có ${r.boss} mục type:'boss' — phải đúng 1, vì nó bật showVictory()`);
  else if (r.bossO !== 9) fail(`mục type:'boss' nằm ở vị trí ${r.bossO + 1}, mà spawnBoss() gọi ở questIdx===9 ⇒ phải là mục thứ 10`);
  else pass("mục thứ 10 là trận trùm — khớp chỗ ghép cứng questIdx===9");
  if (r.npcThieuArt.length) fail('NPC giao việc thiếu art: ' + r.npcThieuArt.join(', '));
  else pass('mọi NPC giao việc đều có tranh');

  console.log('errors:', JSON.stringify(errs));
  console.log(bad === 0 && errs.length === 0 ? 'ALL PASS' : 'FAIL(' + bad + ')');
  await b.close();
  process.exit(bad === 0 && errs.length === 0 ? 0 : 1);
})();
