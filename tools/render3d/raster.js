// ═══════════════════════════════════════════════════════════════════════════════
// BỘ DỰNG 3D MỀM — không phụ thuộc gói ngoài, chạy thẳng bằng Node
// ─────────────────────────────────────────────────────────────────────────────
// Đây là bước "3D → 2D" mà Diablo 2 và loạt game 2D cùng thời đã làm: dựng model
// 3D rồi CHỤP nó thành sprite ở nhiều hướng, thay vì vẽ tay từng hướng.
//
// Không dùng three.js vì hai lẽ: (1) mạng ở đây chặn CDN, (2) việc cần làm chỉ
// gồm ba thứ — phép chiếu trực giao, đệm độ sâu, tô tam giác có đổ bóng — viết
// tay còn ngắn hơn là kéo cả một thư viện về.
//
// Chiếu TRỰC GIAO (orthographic) chứ không phải phối cảnh: sprite phải giữ đúng
// tỉ lệ ở mọi vị trí trên màn, phối cảnh sẽ làm nhân vật méo khi rời tâm.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Ma trận 4×4 (hàng-chính), đủ dùng cho dịch/xoay/co ──
export const M4 = {
  id: () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
  mul(a, b){
    const o = new Array(16);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++){
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[r*4+k] * b[k*4+c];
      o[r*4+c] = s;
    }
    return o;
  },
  trans(x, y, z){ return [1,0,0,x, 0,1,0,y, 0,0,1,z, 0,0,0,1]; },
  scale(x, y, z){ return [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]; },
  rotX(a){ const c = Math.cos(a), s = Math.sin(a); return [1,0,0,0, 0,c,-s,0, 0,s,c,0, 0,0,0,1]; },
  rotY(a){ const c = Math.cos(a), s = Math.sin(a); return [c,0,s,0, 0,1,0,0, -s,0,c,0, 0,0,0,1]; },
  rotZ(a){ const c = Math.cos(a), s = Math.sin(a); return [c,-s,0,0, s,c,0,0, 0,0,1,0, 0,0,0,1]; },
  apply(m, p){
    return [ m[0]*p[0] + m[1]*p[1] + m[2]*p[2]  + m[3],
             m[4]*p[0] + m[5]*p[1] + m[6]*p[2]  + m[7],
             m[8]*p[0] + m[9]*p[1] + m[10]*p[2] + m[11] ];
  },
  // Hướng (vector) thì KHÔNG cộng phần dịch — quên chỗ này là pháp tuyến sai hết.
  dir(m, p){
    return [ m[0]*p[0] + m[1]*p[1] + m[2]*p[2],
             m[4]*p[0] + m[5]*p[1] + m[6]*p[2],
             m[8]*p[0] + m[9]*p[1] + m[10]*p[2] ];
  },
};

const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; };
const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];

// ── Dựng hình cơ bản. Mỗi hình trả về { v: [[x,y,z]…], f: [[i,j,k]…] } ──
export function box(w, h, d){
  const x = w/2, y = h/2, z = d/2;
  const v = [[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]];
  const f = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],
             [1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
  return { v, f };
}
// Nón cụt: r0 ở đáy (y=0), r1 ở đỉnh (y=h). r1=0 là nón nhọn, r0=r1 là trụ.
// caps: 0 = không nắp · 1 = nắp đáy · 2 = nắp đỉnh · 3 = cả hai (mặc định).
// Nắp mà không thấy thì đừng sinh ra: nắp đáy của áo thụng nằm sát đất, hướng
// pháp tuyến ngược nên lọt qua bộ cull và vẽ thành một cái đĩa sáng dưới chân.
export function cone(r0, r1, h, seg, caps){
  const v = [], f = [];
  for (let i = 0; i < seg; i++){
    const a = i / seg * Math.PI * 2;
    v.push([Math.cos(a)*r0, 0, Math.sin(a)*r0]);
    v.push([Math.cos(a)*r1, h, Math.sin(a)*r1]);
  }
  for (let i = 0; i < seg; i++){
    const a = i*2, b = a+1, c = ((i+1) % seg)*2, d = c+1;
    f.push([a, c, b], [b, c, d]);
  }
  const cp = caps === undefined ? 3 : caps;
  if (cp & 1){
    const bc = v.push([0, 0, 0]) - 1;
    for (let i = 0; i < seg; i++) f.push([bc, ((i+1) % seg)*2, i*2]);
  }
  if (cp & 2){
    const tc = v.push([0, h, 0]) - 1;
    for (let i = 0; i < seg; i++) f.push([tc, i*2+1, ((i+1) % seg)*2+1]);
  }
  return { v, f };
}
// frac: chỉ sinh phần TRÊN của quả cầu (0..1). Tóc mà dùng cầu nguyên thì nó
// bọc kín cả mặt — phải là cái chỏm úp lên đỉnh đầu, chừa mặt ra.
export function sphereCap(r, seg, ring, frac){
  const v = [], f = [], R = Math.max(1, Math.round(ring * frac));
  for (let j = 0; j <= R; j++){
    const phi = j / ring * Math.PI;
    for (let i = 0; i < seg; i++){
      const th = i / seg * Math.PI * 2;
      v.push([r*Math.sin(phi)*Math.cos(th), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(th)]);
    }
  }
  for (let j = 0; j < R; j++) for (let i = 0; i < seg; i++){
    const a = j*seg + i, b = j*seg + (i+1)%seg, c = (j+1)*seg + i, d = (j+1)*seg + (i+1)%seg;
    f.push([a, c, b], [b, c, d]);
  }
  return { v, f };
}
export function sphere(r, seg, ring){
  const v = [], f = [];
  for (let j = 0; j <= ring; j++){
    const phi = j / ring * Math.PI;
    for (let i = 0; i < seg; i++){
      const th = i / seg * Math.PI * 2;
      v.push([r*Math.sin(phi)*Math.cos(th), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(th)]);
    }
  }
  for (let j = 0; j < ring; j++) for (let i = 0; i < seg; i++){
    const a = j*seg + i, b = j*seg + (i+1)%seg, c = (j+1)*seg + i, d = (j+1)*seg + (i+1)%seg;
    f.push([a, c, b], [b, c, d]);
  }
  return { v, f };
}

// ── Cảnh: danh sách { geo, mat, xf } ──────────────────────────────────────────
// mat: { col:[r,g,b] 0..1, rim:[r,g,b]|null, emit:0..1 }
export function makeScene(){ return { parts: [] }; }
export function add(scene, geo, mat, xf){ scene.parts.push({ geo, mat, xf }); return scene; }

// ── Dựng một khung hình ───────────────────────────────────────────────────────
// view: ma trận đưa từ hệ thế giới về hệ camera. Nhìn từ trên xuống một góc
// (kiểu MU/isometric), rồi chiếu trực giao: x → cột, y → hàng, z → độ sâu.
export function makeView(elevDeg, azimDeg){
  return M4.mul(M4.rotX(elevDeg * Math.PI / 180), M4.rotY(azimDeg * Math.PI / 180));
}

const LIGHT = norm([-0.55, 0.78, 0.42]);   // đèn chính: trên–trái–trước
const RIMD  = norm([0.62, 0.35, -0.7]);    // đèn viền: sau–phải, tách người khỏi nền

export function render(scene, opts){
  const W = opts.w, H = opts.h;
  const px = new Uint8Array(W * H * 4);
  const zb = new Float32Array(W * H).fill(-Infinity);
  const view = opts.view;
  const s = opts.scale;                       // đơn vị thế giới → điểm ảnh
  const ox = W / 2 + (opts.ox || 0), oy = H - (opts.oy || 0);

  for (const part of scene.parts){
    const mv = M4.mul(view, part.xf);
    const V = part.geo.v.map(p => M4.apply(mv, p));
    for (const face of part.geo.f){
      const a = V[face[0]], b = V[face[1]], c = V[face[2]];
      const n = norm(cross(sub(b, a), sub(c, a)));
      if (n[2] <= 0) continue;                // quay lưng lại camera thì bỏ
      const key = Math.max(0, dot(n, LIGHT));
      const rim = part.mat.rim ? Math.pow(Math.max(0, dot(n, RIMD)), 2.2) : 0;
      const m = part.mat, e = m.emit || 0;
      const sh = 0.42 + 0.66 * key;           // nền + khuếch tán
      let R = m.col[0] * sh, G = m.col[1] * sh, B = m.col[2] * sh;
      if (rim > 0){ R += m.rim[0] * rim * 0.9; G += m.rim[1] * rim * 0.9; B += m.rim[2] * rim * 0.9; }
      if (e > 0){ R = R * (1 - e) + m.col[0] * e * 1.6; G = G * (1 - e) + m.col[1] * e * 1.6; B = B * (1 - e) + m.col[2] * e * 1.6; }
      const cr = Math.min(255, R * 255) | 0, cg = Math.min(255, G * 255) | 0, cb = Math.min(255, B * 255) | 0;

      // toạ độ màn: y thế giới đi LÊN, y màn đi XUỐNG → đảo dấu
      const p0 = [ox + a[0]*s, oy - a[1]*s, a[2]],
            p1 = [ox + b[0]*s, oy - b[1]*s, b[2]],
            p2 = [ox + c[0]*s, oy - c[1]*s, c[2]];
      tri(px, zb, W, H, p0, p1, p2, cr, cg, cb);
    }
  }
  return px;
}

// Tô tam giác bằng toạ độ trọng tâm + đệm độ sâu.
function tri(px, zb, W, H, p0, p1, p2, cr, cg, cb){
  const minX = Math.max(0, Math.floor(Math.min(p0[0], p1[0], p2[0])));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(p0[0], p1[0], p2[0])));
  const minY = Math.max(0, Math.floor(Math.min(p0[1], p1[1], p2[1])));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(p0[1], p1[1], p2[1])));
  const d = (p1[1]-p2[1])*(p0[0]-p2[0]) + (p2[0]-p1[0])*(p0[1]-p2[1]);
  if (Math.abs(d) < 1e-9) return;
  for (let y = minY; y <= maxY; y++){
    for (let x = minX; x <= maxX; x++){
      const cx = x + 0.5, cy = y + 0.5;
      const w0 = ((p1[1]-p2[1])*(cx-p2[0]) + (p2[0]-p1[0])*(cy-p2[1])) / d;
      const w1 = ((p2[1]-p0[1])*(cx-p2[0]) + (p0[0]-p2[0])*(cy-p2[1])) / d;
      const w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const z = w0*p0[2] + w1*p1[2] + w2*p2[2];
      const i = y*W + x;
      // Cull mặt sau giữ lại mặt có pháp tuyến +z ⇒ +z HƯỚNG VỀ camera ⇒ z LỚN hơn
      // là GẦN hơn. Ban đầu viết ngược (giữ z nhỏ); hình lồi không lộ vì đã cull hết
      // mặt sau, nhưng tay che thân thì sai ngay.
      if (z <= zb[i]) continue;
      zb[i] = z;
      const o = i*4;
      px[o] = cr; px[o+1] = cg; px[o+2] = cb; px[o+3] = 255;
    }
  }
}

// Khử răng cưa bằng cách dựng ở bội SS rồi thu nhỏ có lấy trung bình.
// Rẻ hơn nhiều so với lấy mẫu nhiều điểm trong lúc tô, và vì đây là bước NƯỚNG
// ảnh (chạy một lần, không phải mỗi khung hình) nên tốn thêm không thành vấn đề.
export function downsample(px, W, H, SS){
  const w = W / SS | 0, h = H / SS | 0;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    let r = 0, g = 0, b = 0, a = 0;
    for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++){
      const o = ((y*SS + j)*W + x*SS + i) * 4;
      r += px[o] * px[o+3]; g += px[o+1] * px[o+3]; b += px[o+2] * px[o+3]; a += px[o+3];
    }
    const o = (y*w + x) * 4;
    if (a > 0){ out[o] = r/a | 0; out[o+1] = g/a | 0; out[o+2] = b/a | 0; }
    out[o+3] = a / (SS*SS) | 0;
  }
  return { px: out, w, h };
}
