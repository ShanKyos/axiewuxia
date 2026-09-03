// Cốt truyện mới: (1) không còn tên riêng của MU Online trong text người chơi thấy,
// (2) 35 nhiệm vụ chính tuyến vẫn đủ trường máy móc và chạy hết được,
// (3) manh mối + lời boss + kết mở render không lỗi.
const { chromium } = require('playwright');

// "Kundun" ĐÃ RA KHỎI danh sách cấm: chủ dự án chốt dùng "Box Kundun" cho hệ hộp mở đồ vì
// người chơi MU quen tên đó (xem mục NGOẠI LỆ trong CLAUDE.md). Rủi ro đã nêu, chủ dự án
// vẫn quyết. Mười tên còn lại vẫn cấm tuyệt đối — đừng gỡ thêm cái nào.
const BANNED = ['Lorencia','Noria','Devias','Icarus','Atlans','Tarkan',
                'Fairy Elf','Magic Gladiator','Devil Square','Blood Castle',
                'Hắc Phong','Vệ Thần','Trấn Ải','Ngũ Ấn','Bá Chủ','Vực Nguyên Thủy'];
// Ngoại lệ chỉ áp cho ĐÚNG cụm "Box Kundun". "Kundun" đứng một mình (vd tên boss cuối của
// MU) vẫn là vi phạm — bài này bắt luôn để ngoại lệ không nới rộng ra âm thầm.
const KUNDUN_OK = 'Box Kundun';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const r = await p.evaluate((BANNED) => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const out = {};

    // (1) gom mọi text người chơi có thể đọc
    const blob = [
      INTRO_PAGES.join(' '),
      QUESTS.map(q => q.name + ' ' + q.desc + ' ' + (q.chapter||'')).join(' '),
      Object.values(CLUES).map(c => c.name + ' ' + c.desc).join(' '),
      Object.values(BOSS_LORE).map(l => l.name + ' ' + l.intro.join(' ') +
        ' ' + Object.values(l.sect||{}).join(' ')).join(' '),
      Object.values(SECTS).map(s => s.name + ' ' + s.desc + ' ' + s.role).join(' '),
      NPCS.map(n => n.name + ' ' + (n.lore||'')).join(' '),
      Object.values(MOBS).map(m => m.name).join(' '),
    ].join(' ');
    out.banned = BANNED.filter(w => blob.includes(w));
    // "Kundun" chỉ được phép trong đúng cụm "Box Kundun". Bỏ hết cụm đó ra rồi soi phần còn
    // lại — còn sót chữ Kundun nào nữa là ngoại lệ đang nới rộng ngoài ý chủ dự án.
    if (blob.replace(/Box Kundun/g, '').includes('Kundun')) out.banned.push('Kundun (ngoài cụm "Box Kundun")');

    // (2) chuỗi nhiệm vụ: đủ trường, id liên tục, chương đúng thứ tự
    const ids = QUESTS.map(q => q.id);
    out.questCount = QUESTS.length;
    out.idsContiguous = ids.every((v, i) => v === i + 1);
    out.allHaveText = QUESTS.every(q => q.name && q.desc && q.chapter && q.type && q.need > 0);
    out.chapters = [...new Set(QUESTS.map(q => q.chapter))];
    // mọi targetNpc / npc phải tồn tại thật
    const npcIds = new Set(NPCS.map(n => n.id));
    out.badNpc = QUESTS.filter(q => (q.npc && !npcIds.has(q.npc)) ||
                                    (q.targetNpc && !npcIds.has(q.targetNpc)))
                       .map(q => q.id);
    // mọi mob phải tồn tại thật
    out.badMob = QUESTS.filter(q => q.mob && !MOBS[q.mob]).map(q => q.id);

    // (3) sect: trong BOSS_LORE phải trỏ vào lớp có thật
    out.badSect = [];
    for (const [id, l] of Object.entries(BOSS_LORE))
      for (const k of Object.keys(l.sect || {})) if (!SECTS[k]) out.badSect.push(id + ':' + k);

    // (4) tên boss khớp giữa BOSS_DEFS và BOSS_LORE
    out.nameMismatch = [];
    for (const mp of Object.values(BOSS_DEFS)){
      for (const t of [...mp.thuve, mp.tranai]){
        const l = BOSS_LORE[t.id];
        if (l && l.name !== t.name) out.nameMismatch.push(t.id + ': "' + t.name + '" vs "' + l.name + '"');
      }
    }

    // (5) chạy hết chuỗi nhiệm vụ bằng cheat, không được lỗi
    player.level = 100; calcDerived();
    for (let i = 0; i < QUESTS.length; i++){ questIdx = i; questState = 'active'; questProg = QUESTS[i].need; }
    player.clues = Object.keys(CLUES); window.qlogTab = 'main'; renderQlog();
    out.questPanel = el('panel-qlog').innerHTML.length > 200;
    window.qlogTab = 'story'; renderQlog();          // tab manh mối + nhật ký boss
    out.storyTab = el('panel-qlog').innerHTML.length > 200;
    showKetMo();
    out.ketMoShown = !document.getElementById('overlay').classList.contains('hidden');
    document.getElementById('overlay').classList.add('hidden');
    return out;
  }, BANNED);

  console.log(JSON.stringify(r, null, 1));
  const ok = r.banned.length === 0 && r.questCount === 35 && r.idsContiguous && r.allHaveText
    && r.badNpc.length === 0 && r.badMob.length === 0 && r.badSect.length === 0
    && r.nameMismatch.length === 0 && r.ketMoShown && errs.length === 0;
  console.log('errors:', JSON.stringify(errs));
  console.log(ok ? 'PASS' : 'FAIL');
  await b.close();
})();
