// ═══════════════════════════════════════════════════════════════════════════════
// MODEL 3D — THÂN NGƯỜI GỐC (chưa mặc đồ bộ)
// ─────────────────────────────────────────────────────────────────────────────
// Bản đầu dựng pháp sư thành một khối NÓN (áo thụng liền khối). Sai hướng: game
// gốc dựng nhân vật là NGƯỜI BÌNH THƯỜNG có đủ hai tay hai chân, còn giáp/áo là
// LỚP ĐẮP LÊN. Làm đúng thứ tự đó thì mới lắp được 220 món trang bị — mỗi bộ
// giáp là một lớp riêng chồng lên cùng một thân, không phải render lại cả người.
//
// Thân gốc gồm: áo cộc tay có viền, tay trần, bao tay từ khuỷu xuống, đai lưng,
// quần, ủng cao cổ, tóc dài hất ra sau.
//
// Khớp: hông · gối · cổ chân · vai · khuỷu · cổ. Mỗi chi dựng với gốc toạ độ
// NẰM Ở KHỚP TRÊN và kéo dài xuống -Y, nên phép xoay chỉ là nhân thêm một ma
// trận — không phải bù trừ toạ độ bằng tay.
// ═══════════════════════════════════════════════════════════════════════════════
import { M4, box, cone, sphere, sphereCap, makeScene, add } from './raster.js';

export const SKIN = {
  hair:   [0.82, 0.84, 0.89],
  skin:   [0.87, 0.73, 0.58],
  skinLo: [0.68, 0.55, 0.43],
  tunic:  [0.23, 0.36, 0.62],
  tunicHi:[0.36, 0.53, 0.80],
  trim:   [0.80, 0.86, 0.95],
  glove:  [0.20, 0.27, 0.45],
  pants:  [0.17, 0.22, 0.36],
  boot:   [0.20, 0.26, 0.42],
  bootCuff:[0.52, 0.58, 0.70],
  belt:   [0.24, 0.29, 0.42],
  buckle: [0.72, 0.76, 0.85],
};
const RIM = [0.66, 0.78, 1.0];
const mat = (col, o) => Object.assign({ col, rim: RIM, emit: 0 }, o || {});
// Chi kéo dài XUỐNG từ gốc toạ độ — dựng ngược rồi lật, để khớp nằm đúng ở y=0.
const limb = (rTop, rBot, len, seg) => ({
  v: cone(rBot, rTop, len, seg || 10, 0).v.map(p => [p[0], p[1] - len, p[2]]),
  f: cone(rBot, rTop, len, seg || 10, 0).f,
});
const TAU = Math.PI * 2;

// ── Mốc đo (đơn vị thế giới, người cao ~1,78) ──
const J = { hip: 0.92, knee: 0.50, ankle: 0.13, chest: 1.34, sh: 1.28, elbow: 0.98,
            neck: 1.44, head: 1.60, hipX: 0.115, shX: 0.168 };

function pose(action, t){
  if (action === 'w'){
    const ph = t * TAU, st = Math.sin(ph);
    return {
      bob: Math.abs(st) * 0.045, lean: 0.13,
      legL:  st * 0.55, legR: -st * 0.55,
      kneeL: Math.max(0, Math.cos(ph)) * 0.85, kneeR: Math.max(0, -Math.cos(ph)) * 0.85,
      armL: -Math.sin(ph - 0.45) * 0.55, armR: Math.sin(ph - 0.45) * 0.55,
      elbL: -0.35, elbR: -0.35,
      twist: -st * 0.10, head: -Math.sin(ph * 2) * 0.05, hair: -0.22 - st * 0.10, cast: 0,
    };
  }
  if (action === 'c'){
    const e = t < 0.28 ? -Math.sin(t / 0.28 * Math.PI) * 0.5
                       : Math.sin(Math.pow((t - 0.28) / 0.72, 0.6) * Math.PI);
    return {
      bob: e * 0.03, lean: 0.05 + 0.22 * Math.max(0, e) - 0.14 * Math.max(0, -e),
      legL: 0.16, legR: -0.20, kneeL: 0.10, kneeR: 0.26,
      armL: -0.55 - 0.35 * e, armR: -1.35 - 0.55 * e,
      elbL: -0.75 + 0.3 * e, elbR: -0.55 + 0.45 * e,
      twist: -0.12 * e, head: -0.10 * e, hair: -0.20 - e * 0.28, cast: Math.max(0, e),
    };
  }
  const br = Math.sin(t * TAU);
  return { bob: br * 0.011, lean: 0.04, legL: 0.05, legR: -0.06,
           kneeL: 0.06 + Math.max(0, br) * 0.10, kneeR: 0.06 + Math.max(0, -br) * 0.10,
           armL: 0.06 + br * 0.03, armR: -0.06 - br * 0.03, elbL: -0.22, elbR: -0.22,
           twist: br * 0.02, head: -br * 0.03, hair: -0.20 + br * 0.04, cast: 0 };
}

export function buildHero(action, t, opt){
  const P = pose(action, t), S = Object.assign({}, SKIN, (opt && opt.skin) || {});
  // Mặc giáp thì PHẢI ẩn mấy mảnh vải mà giáp trùm lên. Để nguyên thì hai lớp
  // chọi nhau: tà áo nhô ra trước giáp đùi, nẹp ngực xuyên qua tấm ức.
  const bare = !(opt && opt.geared);
  const sc = makeScene();
  const Y = P.bob;
  const root = M4.trans(0, Y, 0);

  // ── Chân: hông → gối → cổ chân ──
  const JJ = {};
  const leg = (side, hipA, kneeA) => {
    const hip = M4.mul(root, M4.mul(M4.trans(side * J.hipX, J.hip, 0), M4.rotX(hipA)));
    add(sc, limb(0.098, 0.078, J.hip - J.knee), mat(S.pants), hip);
    const kn = M4.mul(hip, M4.mul(M4.trans(0, -(J.hip - J.knee), 0), M4.rotX(kneeA)));
    add(sc, limb(0.080, 0.068, J.knee - J.ankle - 0.06), mat(S.pants), kn);
    const ank = M4.mul(kn, M4.trans(0, -(J.knee - J.ankle - 0.06), 0));
    add(sc, cone(0.086, 0.086, 0.055, 12, 0), mat(S.bootCuff), M4.mul(ank, M4.trans(0, -0.055, 0)));
    add(sc, limb(0.082, 0.078, 0.30), mat(S.boot), M4.mul(ank, M4.trans(0, -0.02, 0)));
    add(sc, box(0.115, 0.055, 0.20), mat(S.boot), M4.mul(ank, M4.trans(0, -0.30, 0.045)));
    JJ[side < 0 ? 'hipL' : 'hipR'] = hip;
    JJ[side < 0 ? 'knL' : 'knR'] = kn;
    JJ[side < 0 ? 'ankL' : 'ankR'] = ank;
  };
  leg(-1, P.legL, -P.kneeL);
  leg( 1, P.legR, -P.kneeR);

  // ── Thân ──
  const torso = M4.mul(root, M4.mul(M4.trans(0, J.hip, 0), M4.mul(M4.rotX(-P.lean * 0.4), M4.rotY(P.twist))));
  add(sc, cone(0.175, 0.215, J.chest - J.hip, 16, 0), mat(S.tunic), torso);     // áo cộc tay
  add(sc, cone(0.181, 0.181, 0.07, 16, 0), mat(S.belt), M4.mul(torso, M4.trans(0, 0.02, 0)));
  add(sc, box(0.075, 0.058, 0.02), mat(S.buckle), M4.mul(torso, M4.trans(0, 0.05, 0.178)));
  // viền trắng: nẹp ngực chữ V + hai tà áo trước
  if (bare){
    add(sc, box(0.026, 0.20, 0.02), mat(S.trim), M4.mul(torso, M4.mul(M4.trans(-0.050, 0.30, 0.185), M4.rotZ(-0.26))));
    add(sc, box(0.026, 0.20, 0.02), mat(S.trim), M4.mul(torso, M4.mul(M4.trans( 0.050, 0.30, 0.185), M4.rotZ( 0.26))));
    for (const s of [-1, 1]){
      add(sc, box(0.095, 0.24, 0.03), mat(S.tunicHi), M4.mul(torso, M4.trans(s * 0.062, -0.10, 0.165)));
      add(sc, box(0.095, 0.020, 0.032), mat(S.trim), M4.mul(torso, M4.trans(s * 0.062, -0.215, 0.167)));
    }
  }

  // ── Tay: vai trần → bao tay từ khuỷu ──
  const arm = (side, shA, elbA) => {
    const sh = M4.mul(torso, M4.mul(M4.trans(side * J.shX, J.sh - J.hip, 0),
                                    M4.mul(M4.rotZ(-side * 0.10), M4.rotX(shA))));
    add(sc, sphere(0.072, 10, 8), mat(S.tunic), sh);                              // chỏm vai áo
    add(sc, limb(0.068, 0.056, J.sh - J.elbow), mat(S.skin), sh);                 // bắp tay TRẦN
    const el = M4.mul(sh, M4.mul(M4.trans(0, -(J.sh - J.elbow), 0), M4.rotX(elbA)));
    add(sc, limb(0.055, 0.046, 0.26), mat(S.glove), el);                          // bao tay
    add(sc, cone(0.058, 0.058, 0.03, 10, 0), mat(S.trim), M4.mul(el, M4.trans(0, -0.02, 0)));
    add(sc, sphere(0.050, 10, 8), mat(S.glove), M4.mul(el, M4.trans(0, -0.28, 0)));
    JJ[side < 0 ? 'shL' : 'shR'] = sh;
    JJ[side < 0 ? 'elL' : 'elR'] = el;
    return M4.mul(el, M4.trans(0, -0.28, 0));
  };
  JJ.handL = arm(-1, P.armL, P.elbL);
  const handR = arm(1, P.armR, P.elbR);
  JJ.handR = handR;

  // ── Cổ, đầu, tóc ──
  const neck = M4.mul(torso, M4.trans(0, J.neck - J.hip, 0));
  add(sc, cone(0.052, 0.048, 0.09, 10, 0), mat(S.skinLo), M4.mul(neck, M4.trans(0, -0.08, 0)));
  const head = M4.mul(neck, M4.mul(M4.trans(0, J.head - J.neck, 0), M4.rotX(P.head)));
  add(sc, sphere(0.115, 14, 11), mat(S.skin), head);
  add(sc, box(0.055, 0.028, 0.03), mat([0.16, 0.20, 0.30]), M4.mul(head, M4.trans(-0.042, 0.012, 0.10)));
  add(sc, box(0.055, 0.028, 0.03), mat([0.16, 0.20, 0.30]), M4.mul(head, M4.trans( 0.042, 0.012, 0.10)));
  // tóc: chỏm trùm + đuôi dài hất ra sau + hai lọn trước mặt
  add(sc, sphereCap(0.128, 14, 11, 0.58), mat(S.hair), M4.mul(head, M4.trans(0, 0.006, -0.010)));  // chỏm, chừa mặt
  add(sc, sphereCap(0.122, 12, 10, 0.92), mat(S.hair), M4.mul(head, M4.trans(0, 0.004, -0.055)));  // khối sau gáy
  const tail = M4.mul(head, M4.mul(M4.trans(0, -0.02, -0.075), M4.rotX(P.hair)));
  add(sc, limb(0.105, 0.055, 0.42, 12), mat(S.hair), tail);
  for (const s of [-1, 1])
    add(sc, limb(0.026, 0.014, 0.17, 8), mat(S.hair), M4.mul(head, M4.mul(M4.trans(s * 0.104, 0.040, 0.030), M4.rotZ(s * 0.20))));

  JJ.root = root; JJ.torso = torso; JJ.head = head; JJ.neck = neck;
  return { scene: sc, handR, torso, joints: JJ, pose: P, cast: P.cast };
}

export const ACTIONS = { i: 6, w: 12, c: 10 };
