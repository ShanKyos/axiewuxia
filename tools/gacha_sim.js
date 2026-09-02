// Mô phỏng đối chiếu cho docs/GACHA_KHE_UOC.md — chạy: node tools/gacha_sim.js
// Mô phỏng đúng mô hình Genshin để lấy số THẬT cho tài liệu thiết kế.
// 5★: 0,6% tới lượt 73; từ 74 cộng thêm 6 điểm %/lượt → chạm 100% ở lượt 90.
// 4★: 5,1% tới lượt 8; lượt 9 cộng 51 điểm %; lượt 10 bảo đảm.
const p5 = n => n >= 90 ? 1 : n >= 74 ? Math.min(1, 0.006 + 0.06*(n-73)) : 0.006;
const p4 = n => n >= 10 ? 1 : n >= 9 ? Math.min(1, 0.051 + 0.51) : 0.051;

function chay(N){
  let c5 = 0, c4 = 0, tong5 = 0, tong4 = 0, gap5 = [], featured = 0, gapFeat = [], daBaoDam = false, tuLanFeat = 0;
  let thang5050 = 0, lan5050 = 0;
  for (let i = 1; i <= N; i++){
    c5++; c4++; tuLanFeat++;
    if (Math.random() < p5(c5)){
      tong5++; gap5.push(c5); c5 = 0;              // bộ đếm 4★ KHÔNG reset khi ra 5★
      if (daBaoDam){ featured++; gapFeat.push(tuLanFeat); tuLanFeat = 0; daBaoDam = false; }
      else { lan5050++;
        if (Math.random() < 0.5){ thang5050++; featured++; gapFeat.push(tuLanFeat); tuLanFeat = 0; }
        else daBaoDam = true; }
    } else if (Math.random() < p4(c4)){ tong4++; c4 = 0; }
  }
  const tb = a => a.reduce((x,y)=>x+y,0)/a.length;
  const pct = (a, k) => a.filter(x=>x<=k).length/a.length*100;
  return {
    luot: N,
    tiLe5: +(tong5/N*100).toFixed(3), tiLe4: +(tong4/N*100).toFixed(3),
    tbLuotMoi5: +tb(gap5).toFixed(1),
    tbLuotMoiFeatured: +tb(gapFeat).toFixed(1),
    thang5050: +(thang5050/lan5050*100).toFixed(1),
    p5truoc74: +(gap5.filter(x=>x<74).length/gap5.length*100).toFixed(1),
    p5trong74_80: +(gap5.filter(x=>x>=74&&x<=80).length/gap5.length*100).toFixed(1),
    p5cham90: +(gap5.filter(x=>x===90).length/gap5.length*100).toFixed(1),
    featTrong90: +pct(gapFeat, 90).toFixed(1),
    featTrong180: +pct(gapFeat, 180).toFixed(1),
  };
}
console.log(JSON.stringify(chay(2000000), null, 1));
// người chơi mới: cày được bao nhiêu vé thì chắc có 1 con 5★ đang lên kệ?
const r = chay(2000000);
console.log('\nCần cho 1 Chimera 5★ đang lên kệ:');
console.log('  trung bình', r.tbLuotMoiFeatured, 'vé · trần cứng 180 vé');
