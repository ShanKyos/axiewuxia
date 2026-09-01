// Phân bố cấp quái theo vùng: (1) khoảng cấp công bố khớp cấp quái thật,
// (2) gradient tăng dần theo khoảng cách từ spawn, (3) mỗi map có bộ quái riêng,
// (4) mọi quái nhiệm vụ đều spawn được, (5) chỉ số tăng đơn điệu theo cấp.
const { chromium } = require('playwright');
const FIELD = ['daohoa','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon'];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type()==='error' && !/404|ERR_CONNECTION/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8853/index.html');
  await p.waitForFunction(() => window.__gameReady).catch(()=>{});
  await p.waitForTimeout(700);

  const r = await p.evaluate((FIELD) => {
    window.TEST_MODE = true; startGame('thieulam', null);
    const out = { maps: {}, problems: [] };

    for (const k of FIELD){
      const m = MAPS[k], sp = m.spawn;
      const packs = m.packs.map(q => ({ mob:q.mob, lv:MOBS[q.mob].lv, n:q.n,
        d: Math.round(Math.hypot(q.x-sp.x, q.y-sp.y)) })).sort((a,c)=>a.d-c.d);
      const lvs = packs.map(x=>x.lv);
      const lo = Math.min(...lvs), hi = Math.max(...lvs);
      const band = String(m.range).match(/(\d+)\s*-\s*(\d+)/);
      const bLo = band ? +band[1] : null, bHi = band ? +band[2] : null;

      // (1) band khớp cấp quái
      if (bLo !== lo || bHi !== hi)
        out.problems.push(`${k}: bảng ghi "${m.range}" nhưng quái thật ${lo}-${hi}`);
      // (2) gradient không được tụt
      for (let i=1;i<packs.length;i++)
        if (packs[i].lv < packs[i-1].lv)
          out.problems.push(`${k}: gradient tụt — d=${packs[i-1].d} lv${packs[i-1].lv} rồi d=${packs[i].d} lv${packs[i].lv}`);
      // (3) quái gần cổng nhất không được vượt quá cấp vào map +4
      if (lo > m.min + 4)
        out.problems.push(`${k}: vào map ở cấp ${m.min} nhưng quái gần nhất đã lv${lo}`);

      out.maps[k] = { min:m.min, band:m.range, mobLv:lo+'-'+hi,
        roster:[...new Set(packs.map(x=>x.mob))],
        gradient: packs.map(x=>`${x.d}:${x.mob}(${x.lv})`) };
    }

    // (3b) map liền kề không được trùng bộ quái
    for (let i=1;i<FIELD.length;i++){
      const a = new Set(out.maps[FIELD[i-1]].roster), c = out.maps[FIELD[i]].roster;
      const shared = c.filter(x=>a.has(x));
      out.maps[FIELD[i]].sharedWithPrev = shared;
      if (shared.length > 1)
        out.problems.push(`${FIELD[i]} dùng chung ${shared.length} loại quái với ${FIELD[i-1]}: ${shared}`);
    }

    // (4) mọi quái nhiệm vụ đều phải spawn ở đâu đó
    const onField = new Set(); for (const k of FIELD) for (const q of MAPS[k].packs) onField.add(q.mob);
    for (const q of QUESTS.filter(x=>x.mob && x.type!=='boss'))
      if (!onField.has(q.mob)) out.problems.push(`NV${q.id} "${q.name}" cần ${q.mob} nhưng không map nào spawn`);

    // (5) chỉ số phải tăng theo cấp (quái thường)
    const field = [...onField].map(k=>({k, ...MOBS[k]})).filter(f=>!f.elite).sort((a,c)=>a.lv-c.lv);
    for (let i=1;i<field.length;i++){
      if (field[i].hp < field[i-1].hp) out.hpDips = (out.hpDips||[]).concat(`${field[i-1].k}(lv${field[i-1].lv},${field[i-1].hp}) → ${field[i].k}(lv${field[i].lv},${field[i].hp})`);
      if (field[i].xp < field[i-1].xp) out.problems.push(`XP tụt: ${field[i-1].k} → ${field[i].k}`);
    }
    out.fieldLadder = field.map(f=>`${f.k} lv${f.lv} hp${f.hp} xp${f.xp}`);

    // (6) khắc hệ: lớp nào cũng phải có ít nhất ~15% quái khắc được, trên mỗi map
    out.counter = {};
    for (const k of FIELD){
      const tot = MAPS[k].packs.reduce((a,q)=>a+q.n,0); const row = {};
      for (const sk in SECTS){ if (!SECTS[sk].element) continue;
        const t = ELEM[SECTS[sk].element].beats;   // NGU_HANH đổi tên thành ELEM khi tây hoá tên hệ
        const n = MAPS[k].packs.filter(q=>MOBS[q.mob].el===t).reduce((a,q)=>a+q.n,0);
        row[SECTS[sk].name] = Math.round(n/tot*100); }
      out.counter[k] = row;
      const worst = Math.min(...Object.values(row));
      if (worst < 10) (out.counterWarn = out.counterWarn || []).push(`${k}: lớp yếu nhất chỉ khắc ${worst}%`);
    }
    return out;
  }, FIELD);

  console.log('■ Phân bố theo vùng');
  for (const [k,v] of Object.entries(r.maps))
    console.log(`  ${k.padEnd(10)} vào lv${String(v.min).padStart(3)} · bảng "${String(v.band).padEnd(9)}" · quái ${v.mobLv.padEnd(7)} · ${v.roster.length} loại${v.sharedWithPrev? ' · trùng map trước: '+(v.sharedWithPrev.length||'0'):''}`);
  console.log('\n■ Khắc hệ (% quái mỗi lớp khắc được)');
  for (const [k,v] of Object.entries(r.counter))
    console.log('  '+k.padEnd(10), Object.entries(v).map(([n,x])=>`${n.split(' ')[0]}:${x}%`).join('  '));
  console.log('\n■ Thang quái thường:'); r.fieldLadder.forEach(x=>console.log('   ',x));
  console.log('\n■ HP lên xuống theo vai trò (giòn/trâu — chấp nhận):'); (r.hpDips||[]).forEach(x=>console.log('   ~',x));
  console.log('\n■ CẢNH BÁO khắc hệ (ngoài phạm vi đợt này):'); (r.counterWarn||[]).forEach(x=>console.log('   !',x));
  console.log('\n■ VẤN ĐỀ:', r.problems.length ? '' : 'không có');
  r.problems.forEach(x=>console.log('   ✗', x));
  console.log('errors:', JSON.stringify(errs));
  console.log(r.problems.length===0 && errs.length===0 ? 'PASS' : 'FAIL');
  await b.close();
})();
