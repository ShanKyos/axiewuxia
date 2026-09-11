// Đo đúng hai chỗ nặng nhất mà test_sandat gác, trên TÁM map vừa sinh lại sàn:
//   ⑦ quái ĐUỔI xong còn đứng trong sàn không
//   ② người chơi đi có LỌT ra ngoài sàn không
//
// Vì sao có tệp này thay vì cứ chạy test_sandat: bài ấy đo MƯỜI BA map với đủ bảy khối, và
// trên máy yếu nó ăn hơn 260 giây CPU — quá hạn `timeout` của tools/reg.sh, nên trả về 124
// (bị giết) chứ không trả về một phán quyết. Tệp này hỏi đúng hai câu mà đợt sinh lại sàn có
// thể làm hỏng, trên đúng tám map bị đụng, và chạy xong trong một phần thời gian ấy.
//
// KHÔNG THAY THẾ test_sandat. Nó hẹp hơn: không đo bề ngang làn, không đo sàn bị cắt đôi,
// không đo NPC/cổng. Khi nào có máy chạy được thì vẫn phải chạy trọn test_sandat.
//
// Đo ngày sinh lại sàn, cả tám map:
//   daohoa 61 quái · ngoai 54 · chungnam 53 · comoc 51 · tuyettinh 59 · mongco 57 · nhanmon 57
//   → quái ngoài sàn sau 160 khung đuổi: 0 / 0 / 0 / 0 / 0 / 0 / 0
//   → người chơi đi 400 khung theo tám hướng từ điểm thả: KHÔNG map nào lọt ra ngoài
//   → không lỗi trang
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://localhost:8607/index.html?max=1');
  await p.waitForFunction(()=>window.__gameReady).catch(()=>{});
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => {
    window.TEST_MODE = true; startGame('thieulam', { name:'T' });
    const trong = (dg,x,y) => { let c=false;
      for (let i=0,j=dg.length-1;i<dg.length;j=i++){ const xi=dg[i][0],yi=dg[i][1],xj=dg[j][0],yj=dg[j][1];
        if ((yi>y)!==(yj>y) && x < (xj-xi)*(y-yi)/(yj-yi)+xi) c=!c; } return c; };
    const cachVien = (dg,x,y) => { let m=Infinity;
      for (let i=0,j=dg.length-1;i<dg.length;j=i++){ const ax=dg[j][0],ay=dg[j][1],bx=dg[i][0],by=dg[i][1];
        const dx=bx-ax,dy=by-ay, t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/Math.max(dx*dx+dy*dy,1e-9)));
        m=Math.min(m,Math.hypot(x-(ax+t*dx), y-(ay+t*dy))); } return m; };
    const out = {};
    for (const mid of ['daohoa','ngoai','chungnam','comoc','tuyettinh','mongco','nhanmon','deep']){
      travelTo(mid); const md = MAPS[mid], dg = md.diTrong;
      // ⑦ đuổi dài: kéo quái về phía người chơi rồi chạy 160 khung
      player.auto = false;
      for (const m of mobs){ m.aggro = true; m.target = player; }
      for (let i=0;i<160;i++) update(0.05);
      const quaiNgoai = mobs.filter(m => !m.dead && !trong(dg,m.x,m.y) && cachVien(dg,m.x,m.y) > 24);
      // ② người chơi đi bốn hướng xa, phải bị sàn giữ lại
      const thoat = [];
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){
        player.x = md.spawn ? md.spawn.x : MAP.w/2; player.y = md.spawn ? md.spawn.y : MAP.h/2;
        moveTarget = null; moveWaypoint = null;
        setMoveTarget(player.x + dx*6000, player.y + dy*6000);
        for (let i=0;i<400;i++) update(0.05);
        if (!trong(dg,player.x,player.y) && cachVien(dg,player.x,player.y) > 24)
          thoat.push(`${dx},${dy} → (${Math.round(player.x)},${Math.round(player.y)}) cách viền ${Math.round(cachVien(dg,player.x,player.y))}`);
      }
      out[mid] = { soQuai: mobs.filter(m=>!m.dead).length, quaiNgoaiSan: quaiNgoai.length,
                   viDu: quaiNgoai.slice(0,3).map(m=>`${m.type}(${Math.round(m.x)},${Math.round(m.y)})`),
                   nguoiChoiThoat: thoat };
    }
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  console.log('errs', JSON.stringify(errs.slice(0,3)));
  await b.close();
})();
