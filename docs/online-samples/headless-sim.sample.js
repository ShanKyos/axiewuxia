/**
 * BẰNG CHỨNG CHẠY ĐƯỢC — nạp game.js vào Node và chạy vòng lặp mô phỏng, KHÔNG SỬA GAME.
 *
 * Đây là phần chứng minh cho docs/THIET_KE_ONLINE.md phần 6:
 * câu "muốn lên online thì phải viết lại phần mô phỏng" là SAI với dự án này.
 *
 * Chạy:
 *     node docs/online-samples/headless-sim.sample.js
 *     GAME_DIR=/duong/dan/toi/public/game node docs/online-samples/headless-sim.sample.js
 *
 * Kết quả đo được ngày 2026-09-01 trên axie-wuxia @ b060b90:
 *
 *     loaded OK  : strings/en.js · strings/vi.js · i18n.js · lang.js · game.js
 *     SIM PROBE OK: cấp 1 → 23, atk 27 → 90, genItem ra "Mũ Trụ Hắc Giáp r3 t5"
 *     TICK PROBE OK: 60 quái · 600 tick @20Hz trong 250 ms (≈417 µs/tick, lần chạy nguội)
 *                    hurtMob → killMob chạy đúng: +bạc, +EXP, đồ rơi xuống đất
 *     BENCH: 3–4 µs/tick ở trạng thái ổn định sau khi JIT nóng
 *
 * ⚠ ĐỌC CON SỐ CHO ĐÚNG: 3–4 µs/tick là SÀN, không phải lời hứa. Nó đo một world với MỘT
 *   người chơi. Chưa có trong đó: N người chơi cùng world, tính AoI, serialize gói tin,
 *   ghi DB, TLS. Kết luận đúng là "CPU mô phỏng không phải nút thắt", không phải
 *   "server này gánh được 10.000 người".
 *
 * ── BỐN CÁI BẪY LỘ RA TRONG LÚC VIẾT SCRIPT NÀY ──────────────────────────────────
 *  1. game.js TỰ KHỞI ĐỘNG vòng lặp lúc nạp: requestAnimationFrame(loop) ở dòng 13003,
 *     và một setInterval ở dòng 12686. Trên server thật phải có cờ chặn, không thì mỗi
 *     world để lại một timer rác.
 *  2. logCombat() (dòng 5665) ĐỤNG DOM TỪ BÊN TRONG update() — phải shim `insertBefore`.
 *     Đây chính là toàn bộ lý do cần "Đường cắt 1" (4 ống phản hồi → emitter) ở docs 6.2,
 *     thu gọn thành một dòng.
 *  3. Trạng thái toàn cục là ĐƠN LẺ (player, mobs, curMap, questIdx… đều là biến module).
 *     ⇒ một vm context = một world. Đó là lý do script này dùng vm.createContext chứ không
 *     phải require().
 *  4. Bộ nhớ đệm hình ảnh (_heroCardCache, tintedImg, MOB_IMGS, MAP_BG) vô nghĩa trên server
 *     và phải tắt, không thì mỗi world giữ vài chục MB canvas giả.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const GAME_DIR = process.env.GAME_DIR || "/home/user/axie-wuxia/public/game";

/* ── Lớp giả DOM / canvas / audio — 65 dòng, đủ để game.js nạp và chạy ────────── */

const noop = () => {};

function fakeCtx() {
  return new Proxy({}, {
    get: (_t, k) => {
      if (k === "canvas") return { width: 1280, height: 720 };
      if (k === "measureText") return () => ({ width: 10 });
      if (k === "createLinearGradient" || k === "createRadialGradient" || k === "createPattern")
        return () => ({ addColorStop: noop });
      if (k === "getImageData") return () => ({ data: new Uint8ClampedArray(4) });
      return typeof k === "string" ? noop : undefined;
    },
    set: () => true,
  });
}

function fakeEl() {
  return {
    style: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    getContext: fakeCtx, addEventListener: noop, removeEventListener: noop,
    appendChild: noop, remove: noop, querySelector: () => fakeEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    width: 1280, height: 720, innerHTML: "", textContent: "", value: "", checked: false,
    toDataURL: () => "data:image/png;base64,", getAttribute: () => null, setAttribute: noop,
    focus: noop, blur: noop, click: noop, insertAdjacentHTML: noop, closest: () => null,
    dataset: {}, children: [], parentNode: null, scrollTo: noop, scrollIntoView: noop,
    cloneNode: () => fakeEl(), play: () => Promise.resolve(), pause: noop, load: noop,
    insertBefore: noop, removeChild: noop, firstChild: null, lastChild: null, childNodes: [],
  };
}

function makeWorldContext() {
  const doc = {
    getElementById: () => fakeEl(), createElement: () => fakeEl(),
    querySelector: () => fakeEl(), querySelectorAll: () => [],
    addEventListener: noop, body: fakeEl(), documentElement: fakeEl(),
    fonts: { load: () => Promise.resolve(), ready: Promise.resolve() },
  };
  const w = {
    document: doc,
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    location: { search: "", origin: "http://server", reload: noop, href: "" },
    navigator: { userAgent: "node", language: "vi" },
    requestAnimationFrame: () => 0, cancelAnimationFrame: noop,   // ⚠ bẫy #1: chặn vòng lặp tự chạy
    setInterval: () => 0, clearInterval: noop,                    // ⚠ bẫy #1
    addEventListener: noop, removeEventListener: noop, dispatchEvent: noop,
    innerWidth: 1280, innerHeight: 720, parent: null, top: null,
    screen: { width: 1280, height: 720 }, alert: noop, confirm: () => true,
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    matchMedia: () => ({ matches: false, addEventListener: noop }),
    performance: { now: () => Date.now() }, devicePixelRatio: 1,
    Image: function () { return { addEventListener: noop, set src(_v) {} }; },
    Audio: function () { return fakeEl(); },
    AudioContext: function () { return { createGain: () => ({ connect: noop, gain: {} }), destination: {} }; },
    CanvasRenderingContext2D: function () {}, Path2D: function () {},
    OffscreenCanvas: function () { return fakeEl(); },
    MutationObserver: function () { return { observe: noop, disconnect: noop }; },
    ResizeObserver: function () { return { observe: noop, disconnect: noop }; },
    IntersectionObserver: function () { return { observe: noop, disconnect: noop }; },
    setTimeout, clearTimeout, console, Math, JSON, Date,
    fetch: () => Promise.reject(new Error("server: no outbound net from world loop")),
  };
  w.window = w;
  w.globalThis = w;
  return vm.createContext(w);
}

/* ── Nạp game ────────────────────────────────────────────────────────────────── */

const FILES = ["strings/en.js", "strings/vi.js", "i18n.js", "lang.js", "game.js"];

function loadWorld() {
  const ctx = makeWorldContext();
  for (const f of FILES) {
    vm.runInContext(fs.readFileSync(path.join(GAME_DIR, f), "utf8"), ctx, { filename: f });
    console.log("loaded OK  :", f);
  }
  return ctx;
}

function run(ctx, src) {
  return JSON.parse(vm.runInContext(`JSON.stringify((function(){${src}})())`, ctx));
}

/* ── Ba phép đo ───────────────────────────────────────────────────────────────── */

const ctx = loadWorld();

// 1. Đường mô phỏng thuần: tạo nhân vật, tính chỉ số, sinh đồ, lên cấp
console.log("SIM PROBE OK:", run(ctx, `
  newPlayer('thieulam');
  calcDerived();
  const before = { atk: player.atk, hp: player.maxHp, lv: player.level };
  const it = genItem(50, 0, 'tranai');
  gainXp(100000);
  calcDerived();
  return { before, after: { atk: player.atk, hp: player.maxHp, lv: player.level },
           item: it.name + ' r' + it.rarity + ' t' + it.tier };
`));

// 2. Vòng lặp thế giới thật: dựng map, chạy 600 tick, giết một con qua ĐÚNG đường sát thương
console.log("TICK PROBE OK:", run(ctx, `
  curMap = 'daohoa'; buildWorld();
  const mobsAtBuild = mobs.length;
  const t0 = Date.now();
  for (let i = 0; i < 600; i++) update(1/20);
  const ms = Date.now() - t0;
  const m = mobs.find(x => !x.dead);
  const silverBefore = player.silver, xpBefore = player.xp;
  if (m) hurtMob(m, 999999, 'hit');       // hurtMob là điểm áp sát thương DUY NHẤT của game
  return { mobsAtBuild, ticks: 600, msFor600Ticks: ms, usPerTick: Math.round(ms*1000/600),
           killWorked: !!(m && m.dead),
           silverGained: player.silver - silverBefore, xpGained: player.xp - xpBefore,
           groundLoot: groundLoot.length };
`));

// 3. Chi phí ổn định sau khi JIT nóng — con số dùng để tính ngân sách CPU
console.log("BENCH:", run(ctx, `
  curMap = 'daohoa'; buildWorld();
  for (let i = 0; i < 400; i++) update(1/20);          // hâm nóng JIT
  const rounds = [];
  for (let r = 0; r < 5; r++) {
    const a = Date.now();
    for (let i = 0; i < 2000; i++) update(1/20);
    rounds.push(Math.round((Date.now() - a) * 1000 / 2000));
  }
  return { mobsAlive: mobs.filter(m => !m.dead).length, usPerTick: rounds };
`));

console.log([
  "",
  "⇒ Toàn bộ vòng lặp chiến đấu chạy trên Node, KHÔNG sửa một ký tự nào trong game.js.",
  "⇒ Thứ phải làm không phải 'viết lại mô phỏng', mà là ba đường cắt ở docs 6.2:",
  "     1. addFloat / addEffect / AudioSys.sfx / logCombat  →  emit()   (32 hàm, 2.286 dòng)",
  "     2. Math.random()  →  rng() có hạt giống                          (141 chỗ)",
  "     3. 25 handler window.doX()  →  tách lõi / vỏ                     (607 dòng)",
].join("\n"));
