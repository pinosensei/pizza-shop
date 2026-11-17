/* ==========================================================
   Pizza Shop – game.js   (Step 1: pizza making + oven)
   All pictures are original SVG drawings made in this file.
   Saved data uses ONLY these keys:
     pinoPizza_v1        (the pizza design)
     pinoPizza_prefs_v1  (switch settings)
   Nothing else in localStorage is ever read, changed or deleted.
   ========================================================== */
(() => {
'use strict';

const SAVE_KEY  = 'pinoPizza_v1';
const PREFS_KEY = 'pinoPizza_prefs_v1';
const TRAY_W = 680, TRAY_H = 548;
const PX = 330, PY = 286;      // pizza centre (tray coords)
const CRUST_R = 222, SAUCE_R = 194;

/* ---------------------------------------------------------
   1. ORIGINAL ILLUSTRATIONS (each drawn in a 100×100 box)
   --------------------------------------------------------- */
const O = '#5b3a29';
const st = (w = 3) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const f1 = n => n.toFixed(1);
const around = (n, fn) => { let s = ''; for (let i = 0; i < n; i++) s += fn(i, i / n * Math.PI * 2); return s; };
const pt = (r, a, cx = 50, cy = 50) => [f1(cx + Math.cos(a) * r), f1(cy + Math.sin(a) * r)];
function seeded(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function blob(cx, cy, rFn, n = 72) {          // closed wavy shape
  let d = '';
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, r = rFn(a); d += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * r) + ' ' + f1(cy + Math.sin(a) * r); }
  return d + 'Z';
}
const ring = (cx, cy, R, r) => `M${cx - R} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0ZM${cx - r} ${cy}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0Z`;

const circ = (cx, cy, r) => `M${f1(cx - r)} ${cy}a${r} ${r} 0 1 0 ${f1(2 * r)} 0a${r} ${r} 0 1 0 ${f1(-2 * r)} 0Z`;
const P = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];

/* ---------- shared gradients ---------- */
const rg = (id, stops, cx = '42%', cy = '38%', r = '65%') =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`).join('')}</radialGradient>`;
const lg = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`).join('')}</linearGradient>`;

const DEFS =
  rg('pz-tomato',  [[0, '#ff8a72'], [.6, '#f2463b'], [1, '#c8242a']], '50%', '50%', '55%') +
  rg('pz-jelly',   [[0, '#ffd2c2'], [1, '#ff9a86']], '50%', '50%', '60%') +
  lg('pz-pepper',  [[0, '#6ad95f'], [.55, '#2fa83a'], [1, '#17752a']], 1, 1) +
  lg('pz-onion',   [[0, '#fdf3fd'], [1, '#ead0ee']], 1, 1) +
  rg('pz-mush',    [[0, '#fbf3e3'], [.7, '#efdcbc'], [1, '#e2c79c']], '50%', '40%', '70%') +
  rg('pz-corn',    [[0, '#fff2a0'], [.55, '#ffd23a'], [1, '#eaa70e']], '38%', '32%', '70%') +
  rg('pz-olive',   [[0, '#6e6078'], [.6, '#3a3044'], [1, '#1d1724']], '40%', '35%', '70%') +
  rg('pz-ham',     [[0, '#ffc4cd'], [.75, '#f6a0b0'], [1, '#e9899c']], '45%', '42%', '60%') +
  lg('pz-sausage', [[0, '#e98a63'], [.45, '#cd5a3a'], [1, '#93351f']]) +
  rg('pz-salami',  [[0, '#e8545c'], [.7, '#c42f3c'], [1, '#97202c']], '45%', '42%', '60%') +
  lg('pz-shrimp',  [[0, '#ffb894'], [.5, '#ff8455'], [1, '#e85a33']]) +
  rg('pz-pine',    [[0, '#fff3b0'], [.5, '#ffe170'], [1, '#f5c33a']], '50%', '50%', '55%') +
  rg('pz-white',   [[0, '#ffffff'], [.75, '#fbf8ef'], [1, '#ece4d0']], '45%', '40%', '65%') +
  rg('pz-yolk',    [[0, '#ffe58a'], [.6, '#ffc32e'], [1, '#f19c0c']], '45%', '40%', '60%') +
  rg('pz-melt',    [[0, '#fff3b5'], [.6, '#ffdc62'], [1, '#f4bb36']], '45%', '40%', '62%') +
  rg('pz-brown',   [[0, '#b8651f', .75], [1, '#b8651f', 0]], '50%', '50%', '50%') +
  rg('pz-char',    [[0, '#7a3b14', .6], [1, '#7a3b14', 0]], '50%', '50%', '50%') +
  rg('pz-crustR',  [[0, '#fbe3a6'], [.86, '#f6d38a'], [1, '#e9bd6e']], '50%', '50%', '50%') +
  rg('pz-crustB',  [[0, '#efb663'], [.8, '#dc9442'], [.93, '#c97c32'], [1, '#a9622a']], '50%', '50%', '50%') +
  `<filter id="pz-toast"><feColorMatrix type="matrix" values="1.03 .07 0 0 .02  0 .94 0 0 .005  0 0 .8 0 0  0 0 0 1 0"/></filter>`;

const ART = {}, BAKED = {};

/* CHEESE – shredded mozzarella / cheddar */
ART.cheese = (() => {
  const r = seeded(21); let s = '';
  for (let i = 0; i < 14; i++) {
    const x = 50 + (r() - .5) * 52, y = 50 + (r() - .5) * 46, a = r() * Math.PI, L = 14 + r() * 10, bend = (r() - .5) * 14;
    const [x1, y1] = P(x, y, -L, a), [x2, y2] = P(x, y, L, a), [qx, qy] = P(x, y, bend, a + Math.PI / 2);
    const d = `M${f1(x1)} ${f1(y1)}Q${f1(qx)} ${f1(qy)} ${f1(x2)} ${f1(y2)}`;
    const c = i % 3 === 0 ? '#ffe9a0' : '#ffd84d';
    s += `<path d="${d}" fill="none" stroke="#c98d17" stroke-width="8.5" stroke-linecap="round"/>` +
         `<path d="${d}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>` +
         `<path d="${d}" fill="none" stroke="#fff6c8" stroke-width="1.6" stroke-linecap="round" transform="translate(-.8,-1.2)"/>`;
  }
  return s;
})();
BAKED.cheese = (() => {
  const r = seeded(9);
  const edge = a => 35 + 4 * Math.sin(3 * a + 1) + 3 * Math.sin(5 * a + 2) + 2.2 * Math.sin(9 * a) + 1.4 * Math.sin(14 * a + 1);
  let s = `<path d="${blob(50, 50, edge, 120)}" fill="url(#pz-melt)" stroke="#d99a2e" stroke-width="1.6" stroke-linejoin="round"/>`;
  // soft melted lobes around the edge
  [[0.3, 5.5], [1.5, 4.5], [2.6, 5], [3.8, 4], [5.0, 5]].forEach(([ang, rr]) => {
    const [x, y] = P(50, 50, edge(ang) - 1, ang);
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${rr + .9}" fill="#d99a2e"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${rr}" fill="#ffd862"/>`;
  });
  s += `<path d="${blob(50, 50, edge, 120)}" fill="url(#pz-melt)"/>`;
  s += `<path d="${blob(47, 46, a => 22 + 3 * Math.sin(4 * a + 1) + 2 * Math.sin(7 * a), 80)}" fill="#fff2b0" opacity=".7"/>`;
  // golden-brown spots
  for (let i = 0; i < 7; i++) { const ang = r() * Math.PI * 2, d = 10 + r() * 20, [x, y] = P(50, 50, d, ang);
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(4 + r() * 6)}" ry="${f1(3 + r() * 4)}" fill="url(#pz-brown)" transform="rotate(${f1(r() * 180)} ${f1(x)} ${f1(y)})"/>`; }
  // small bubbles
  for (let i = 0; i < 8; i++) { const ang = r() * Math.PI * 2, d = r() * 26, [x, y] = P(50, 50, d, ang), rr = 1.3 + r() * 2.4;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rr)}" fill="#fff7cf" stroke="#e5ad3c" stroke-width=".9"/><circle cx="${f1(x - rr * .3)}" cy="${f1(y - rr * .3)}" r="${f1(rr * .35)}" fill="#fff"/>`; }
  return s + `<path d="M26 36Q34 26 46 25" fill="none" stroke="#fffbe0" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
})();

/* TOMATO – slice with jelly chambers, seeds and skin */
ART.tomato = (() => {
  let s = `<circle cx="50" cy="50" r="41" fill="#b81d22"/><circle cx="50" cy="50" r="39" fill="url(#pz-tomato)"/>`;
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 - Math.PI / 2, [x, y] = P(50, 50, 21, a);
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="9.5" ry="13" fill="url(#pz-jelly)" transform="rotate(${f1(a * 180 / Math.PI + 90)} ${f1(x)} ${f1(y)})"/>`;
    for (const k of [-1, 0, 1]) { const [sx, sy] = P(50, 50, 21 + k * 4.5, a + k * .12);
      s += `<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="1.5" ry="2.4" fill="#fff4c4" stroke="#e8b26a" stroke-width=".6" transform="rotate(${f1(a * 180 / Math.PI + 90)} ${f1(sx)} ${f1(sy)})"/>`; }
  }
  s += `<circle cx="50" cy="50" r="7" fill="#ffa08c"/>`;
  for (let i = 0; i < 5; i++) { const a = (i + .5) / 5 * Math.PI * 2 - Math.PI / 2, [x2, y2] = P(50, 50, 36, a);
    s += `<line x1="50" y1="50" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#ff8f7c" stroke-width="3" stroke-linecap="round"/>`; }
  return s + `<path d="M20 36A32 32 0 0 1 36 18" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>`;
})();

/* GREEN PEPPER – ring slice */
ART.pepper = (() => {
  const outer = a => 41 + 4.5 * Math.sin(4 * a) + 1.5 * Math.sin(7 * a), inner = a => 32 + 4 * Math.sin(4 * a) + 1.2 * Math.sin(7 * a);
  return `<path d="${blob(50, 50, outer, 96)}${blob(50, 50, inner, 96)}" fill="url(#pz-pepper)" fill-rule="evenodd" stroke="#13612a" stroke-width="1.8"/>` +
    `<path d="${blob(50, 50, a => 34 + 4.2 * Math.sin(4 * a) + 1.3 * Math.sin(7 * a), 96)}" fill="none" stroke="#b6eda0" stroke-width="2.2"/>` +
    `<path d="M22 34A34 34 0 0 1 40 16" fill="none" stroke="#e6ffd8" stroke-width="3" stroke-linecap="round" opacity=".8"/>` +
    `<ellipse cx="33" cy="61" rx="2" ry="1.4" fill="#f5f8df"/><ellipse cx="64" cy="35" rx="2" ry="1.4" fill="#f5f8df"/><ellipse cx="66" cy="63" rx="1.6" ry="1.2" fill="#f5f8df"/>`;
})();

/* ONION – red onion rings */
ART.onion = (() => {
  const ringPath = (R, r) => circ(50, 50, R) + circ(50, 50, r);
  return `<path d="${ringPath(42, 34)}" fill="url(#pz-onion)" fill-rule="evenodd"/>` +
    `<circle cx="50" cy="50" r="42" fill="none" stroke="#8a3c8e" stroke-width="2.6"/><circle cx="50" cy="50" r="34" fill="none" stroke="#c99bcd" stroke-width="1.4"/>` +
    `<path d="${ringPath(27, 20)}" fill="url(#pz-onion)" fill-rule="evenodd"/>` +
    `<circle cx="50" cy="50" r="27" fill="none" stroke="#a453a8" stroke-width="2.2"/><circle cx="50" cy="50" r="20" fill="none" stroke="#d3aad6" stroke-width="1.3"/>` +
    `<path d="M16 42A35 35 0 0 1 32 20" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".9"/>` +
    `<path d="M30 46A21 21 0 0 1 40 31" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`;
})();

/* MUSHROOM – sliced button mushroom */
ART.mushroom = (() => {
  const r = seeded(13); let spots = '';
  for (let i = 0; i < 14; i++) { const x = 22 + r() * 56, y = 30 + r() * 20; if (Math.hypot((x - 50) / 38, (y - 52) / 26) > .92) continue;
    spots += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(.6 + r() * .9)}" fill="#c9a77c" opacity=".7"/>`; }
  for (let i = 0; i < 10; i++) { const x = 40 + r() * 20, y = 62 + r() * 22;
    spots += `<path d="M${f1(x)} ${f1(y)}l${f1((r() - .5) * 2)} ${f1(3 + r() * 4)}" stroke="#dcc39b" stroke-width=".9" stroke-linecap="round"/>`; }
  return `<path d="M10 54C10 22 90 22 90 54C90 60 83 62 74 59L64 58L66 86Q50 95 34 86L36 58L26 59C17 62 10 60 10 54Z" fill="url(#pz-mush)" stroke="#6e4524" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="M36 58L34 86Q50 95 66 86L64 58Q60 66 50 66Q40 66 36 58Z" fill="#e8d2ad" opacity=".55"/>` +
    `<path d="M12 52C12 24 88 24 88 52" fill="none" stroke="#8c5a2f" stroke-width="5.5" stroke-linecap="round"/>` +
    `<path d="M14 49C14 28 86 28 86 49" fill="none" stroke="#b9824e" stroke-width="2" opacity=".9"/>` +
    `<path d="M20 49C24 34 40 30 50 30" fill="none" stroke="#d9a877" stroke-width="1.6" opacity=".9"/>` +
    `<path d="M22 55Q50 49 78 55" fill="none" stroke="#c9a578" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M24 57Q36 54 44 56M56 56Q64 54 76 57" fill="none" stroke="#a98458" stroke-width="1" stroke-dasharray="1.5 2" opacity=".8"/>` +
    `<path d="M42 62Q44 76 42 86M58 62Q56 76 58 86" fill="none" stroke="#d6bc93" stroke-width="1.6" stroke-linecap="round"/>` +
    spots +
    `<path d="M28 42Q38 33 52 33" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".75"/>`;
})();

/* CORN – sweet corn kernels */
ART.corn = [[37,36,-10],[58,34,8],[26,55,-4],[47,54,4],[68,52,-8],[37,73,6],[58,72,-6]].map(([x, y, a]) =>
  `<g transform="rotate(${a} ${x} ${y})"><path d="M${x - 10} ${y - 6}Q${x - 10} ${y - 13} ${x} ${y - 13}Q${x + 10} ${y - 13} ${x + 10} ${y - 6}L${x + 9} ${y + 6}Q${x} ${y + 15} ${x - 9} ${y + 6}Z" fill="url(#pz-corn)" stroke="#c48a0a" stroke-width="1.5" stroke-linejoin="round"/>` +
  `<ellipse cx="${x - 3.5}" cy="${y - 6}" rx="3.2" ry="2" fill="#fffbe0" opacity=".9"/><path d="M${x - 5} ${y + 8}Q${x} ${y + 11} ${x + 5} ${y + 8}" fill="none" stroke="#f7e3a0" stroke-width="1.4" stroke-linecap="round"/></g>`).join('');

/* OLIVE – black olive ring */
ART.olive =
  `<path d="${circ(50, 50, 38) + blob(50, 50, a => 14 + .6 * Math.sin(3 * a))}" fill="url(#pz-olive)" fill-rule="evenodd" stroke="#120d17" stroke-width="1.8"/>` +
  `<path d="${blob(50, 50, a => 14 + .6 * Math.sin(3 * a))}" fill="none" stroke="#7c6a8c" stroke-width="2"/>` +
  `<path d="M22 40A30 30 0 0 1 40 20" fill="none" stroke="#c9bdd6" stroke-width="4" stroke-linecap="round" opacity=".75"/>` +
  `<path d="M70 66A28 28 0 0 1 60 74" fill="none" stroke="#8f80a0" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`;

/* BACON – long, wide wavy strip with meat and fat layers */
ART.bacon = (() => {
  const w = x => 7 * Math.sin(x / 11) + 2.5 * Math.sin(x / 4.5);
  const line = (y, x0 = -2, x1 = 102) => { let d = ''; for (let x = x0; x <= x1; x += 2) d += (x === x0 ? 'M' : 'L') + x + ' ' + f1(y + w(x) + .8 * Math.sin(x * 1.3 + y)); return d; };
  const band = (y0, y1) => {
    let d = ''; for (let x = -2; x <= 102; x += 2) d += (x === -2 ? 'M' : 'L') + x + ' ' + f1(y0 + w(x) + .8 * Math.sin(x * 1.3 + y0));
    for (let x = 102; x >= -2; x -= 2) d += 'L' + x + ' ' + f1(y1 + w(x) + .8 * Math.sin(x * 1.3 + y1)); return d + 'Z';
  };
  const r = seeded(17); let streaks = '';
  for (let i = 0; i < 16; i++) { const x = 4 + r() * 90, y = [36, 52, 64][i % 3] + (r() - .5) * 3, L = 5 + r() * 8;
    streaks += `<path d="M${f1(x)} ${f1(y + w(x))}L${f1(x + L)} ${f1(y + w(x + L))}" stroke="${i % 2 ? '#e17883' : '#9c2733'}" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>`; }
  return `<path d="${band(28, 72)}" fill="#6e1a23"/>` +
    `<path d="${band(29.5, 41)}" fill="#b8323f"/>` +
    `<path d="${band(41, 47)}" fill="#fbe4d8"/>` +
    `<path d="${band(47, 58)}" fill="#cf4653"/>` +
    `<path d="${band(58, 63)}" fill="#f8d6c8"/>` +
    `<path d="${band(63, 70.5)}" fill="#a92b37"/>` +
    `<path d="${line(43.2, 6, 60)}" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>` +
    `<path d="${line(60, 20, 80)}" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>` +
    `<path d="${line(46.4)}" fill="none" stroke="#efb9b0" stroke-width=".9" opacity=".8"/>` +
    streaks +
    `<path d="${line(31.5, 0, 50)}" fill="none" stroke="#e46a76" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
})();

/* HAM – round slice with fat edge */
ART.ham =
  `<circle cx="50" cy="50" r="41" fill="#fbe6e8" stroke="#c97585" stroke-width="1.8"/>` +
  `<path d="${blob(50, 50, a => 36 + 1.5 * Math.sin(6 * a))}" fill="url(#pz-ham)"/>` +
  `<path d="M30 40Q42 33 56 40Q64 44 70 40M36 62Q48 56 62 64" fill="none" stroke="#ffd3db" stroke-width="2.4" stroke-linecap="round"/>` +
  `<path d="M24 34A32 32 0 0 1 40 20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`;

/* SAUSAGE – small grilled sausage */
ART.sausage =
  `<g transform="rotate(-18 50 50)"><rect x="8" y="33" width="84" height="34" rx="17" fill="url(#pz-sausage)" stroke="#6e2412" stroke-width="1.8"/>` +
  `<path d="M28 37L22 63M44 36L38 64M60 36L54 64M76 37L70 63" stroke="#7d2a15" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>` +
  `<path d="M18 41Q32 36 50 38Q66 39 80 41" fill="none" stroke="#ffd2bd" stroke-width="3" stroke-linecap="round" opacity=".7"/>` +
  `<ellipse cx="11" cy="50" rx="2" ry="5" fill="#a5452a"/><ellipse cx="89" cy="50" rx="2" ry="5" fill="#a5452a"/></g>`;

/* SALAMI – slice with fat and pepper specks */
ART.salami = (() => {
  const r = seeded(5); let s = `<circle cx="50" cy="50" r="40" fill="#8a1c26"/><circle cx="50" cy="50" r="38" fill="url(#pz-salami)"/>`;
  for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 31, [x, y] = P(50, 50, d, a);
    s += `<path d="${blob(x, y, t => 2.2 + r() * 1.8 + .8 * Math.sin(3 * t), 10)}" fill="#ffd9dc" opacity=".95"/>`; }
  for (let i = 0; i < 9; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 32, [x, y] = P(50, 50, d, a);
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.1" fill="#3a1414"/>`; }
  return s + `<path d="M22 36A32 32 0 0 1 38 20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>`;
})();

/* SHRIMP – cooked, curled, with segments and tail */
ART.shrimp = (() => {
  const cx = 52, cy = 54, R = 25, segs = 6, a0 = -2.7, a1 = 1.0;
  let s = '';
  // tail fan
  const ta = a1 + .05, [tx, ty] = P(cx, cy, R, ta);
  const fan = (k) => { const ang = ta + Math.PI / 2 + k * .45, [ex, ey] = P(tx, ty, 18, ang); return [ex, ey]; };
  const [e1x, e1y] = fan(-1), [e2x, e2y] = fan(0), [e3x, e3y] = fan(1);
  s += `<path d="M${f1(tx)} ${f1(ty)}L${f1(e1x)} ${f1(e1y)}Q${f1((e1x + e2x) / 2 + 2)} ${f1((e1y + e2y) / 2 + 2)} ${f1(e2x)} ${f1(e2y)}Q${f1((e2x + e3x) / 2 + 2)} ${f1((e2y + e3y) / 2 + 2)} ${f1(e3x)} ${f1(e3y)}Z" fill="#ff6a3d" stroke="#b8401f" stroke-width="1.5" stroke-linejoin="round"/>`;
  s += `<path d="M${f1(tx)} ${f1(ty)}L${f1(e2x)} ${f1(e2y)}" stroke="#ffb18f" stroke-width="1.3"/>`;
  // body segments (head end thickest)
  for (let i = 0; i < segs; i++) {
    const t0 = a0 + (a1 - a0) * i / segs, t1 = a0 + (a1 - a0) * (i + 1) / segs;
    const w0 = 13 - i * 1.3, w1 = 13 - (i + 1) * 1.3;
    const [ox0, oy0] = P(cx, cy, R + w0, t0), [ox1, oy1] = P(cx, cy, R + w1, t1), [ix1, iy1] = P(cx, cy, R - w1 * .75, t1), [ix0, iy0] = P(cx, cy, R - w0 * .75, t0);
    s += `<path d="M${f1(ox0)} ${f1(oy0)}A${f1(R + w0)} ${f1(R + w0)} 0 0 1 ${f1(ox1)} ${f1(oy1)}L${f1(ix1)} ${f1(iy1)}A${f1(R - w1 * .75)} ${f1(R - w1 * .75)} 0 0 0 ${f1(ix0)} ${f1(iy0)}Z" fill="url(#pz-shrimp)" stroke="#c4492a" stroke-width="1.4" stroke-linejoin="round"/>`;
    const [hx, hy] = P(cx, cy, R + w0 * .55, t0 + .08), [hx2, hy2] = P(cx, cy, R + w1 * .55, t1 - .08);
    s += `<path d="M${f1(hx)} ${f1(hy)}A${f1(R + w0 * .55)} ${f1(R + w0 * .55)} 0 0 1 ${f1(hx2)} ${f1(hy2)}" fill="none" stroke="#fff1e8" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>`;
    const [lx, ly] = P(cx, cy, R - w0 * .75, (t0 + t1) / 2), [lx2, ly2] = P(cx, cy, R - w0 * .75 - 5, (t0 + t1) / 2 + .1);
    s += `<path d="M${f1(lx)} ${f1(ly)}L${f1(lx2)} ${f1(ly2)}" stroke="#e8653f" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  // rounded head end
  const [hcx, hcy] = P(cx, cy, R + 1.5, a0);
  s += `<circle cx="${f1(hcx)}" cy="${f1(hcy)}" r="10.5" fill="url(#pz-shrimp)" stroke="#c4492a" stroke-width="1.4"/>`;
  s += `<ellipse cx="${f1(hcx - 3)}" cy="${f1(hcy - 3)}" rx="3.5" ry="2" fill="#ffe2d4" opacity=".9"/>`;
  return s;
})();

/* PINEAPPLE – ring slice */
ART.pineapple = (() => {
  let s = `<path d="${circ(50, 50, 42) + circ(50, 50, 12)}" fill="url(#pz-pine)" fill-rule="evenodd"/>`;
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, [x1, y1] = P(50, 50, 15, a), [x2, y2] = P(50, 50, 37, a);
    s += `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${i % 2 ? '#f0c13a' : '#fff6c6'}" stroke-width="${i % 2 ? 1.6 : 1.2}" stroke-linecap="round" opacity=".85"/>`; }
  s += `<circle cx="50" cy="50" r="40" fill="none" stroke="#e8a51c" stroke-width="4"/>`;
  s += `<circle cx="50" cy="50" r="42" fill="none" stroke="#b97a10" stroke-width="1.6"/>`;
  s += `<circle cx="50" cy="50" r="12" fill="none" stroke="#e9b42c" stroke-width="3"/><circle cx="50" cy="50" r="10.5" fill="none" stroke="#c48912" stroke-width="1.2"/>`;
  return s + `<path d="M18 40A33 33 0 0 1 34 18" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
})();

/* EGG – boiled egg slice */
ART.egg =
  `<path d="${blob(50, 50, a => 38 - 5 * Math.cos(2 * a) + 1.2 * Math.sin(5 * a))}" fill="url(#pz-white)" stroke="#d8ccae" stroke-width="1.8"/>` +
  `<circle cx="51" cy="51" r="17" fill="url(#pz-yolk)" stroke="#e08f0a" stroke-width="1.4"/>` +
  `<circle cx="51" cy="51" r="11" fill="none" stroke="#ffd463" stroke-width="2" opacity=".8"/>` +
  `<ellipse cx="45" cy="45" rx="4.5" ry="3" fill="#fff2b8" opacity=".9"/>` +
  `<path d="M18 40Q22 26 36 20" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`;

/* MAYONNAISE – squeezed zigzag */
const MAYO = 'M6 50C14 26 26 26 34 50S54 74 62 50S82 26 94 50';
ART.mayo =
  `<path d="${MAYO}" fill="none" stroke="#d8c68e" stroke-width="12" stroke-linecap="round"/>` +
  `<path d="${MAYO}" fill="none" stroke="#fffbe8" stroke-width="9" stroke-linecap="round"/>` +
  `<path d="${MAYO}" fill="none" stroke="#f3e6b8" stroke-width="3" stroke-linecap="round" transform="translate(.8,2)"/>` +
  `<path d="${MAYO}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="10 9" transform="translate(-.6,-2.2)"/>`;
BAKED.mayo =
  `<path d="${MAYO}" fill="none" stroke="#e2b763" stroke-width="17" stroke-linecap="round"/>` +
  `<path d="${MAYO}" fill="none" stroke="#fff3c9" stroke-width="13" stroke-linecap="round"/>` +
  `<ellipse cx="20" cy="38" rx="5" ry="7" fill="#fff3c9"/><ellipse cx="48" cy="64" rx="6" ry="6" fill="#fff3c9"/><ellipse cx="77" cy="36" rx="5" ry="6" fill="#fff3c9"/>` +
  `<ellipse cx="34" cy="50" rx="4" ry="3" fill="url(#pz-brown)"/><ellipse cx="62" cy="50" rx="4.5" ry="3" fill="url(#pz-brown)"/><ellipse cx="86" cy="40" rx="3.5" ry="2.5" fill="url(#pz-brown)"/>` +
  `<path d="${MAYO}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="14 12" transform="translate(-.8,-3)" opacity=".95"/>`;


/* ---------------------------------------------------------
   2. TOPPING LIST
   kind: 'count'   → will use "How many?" (1–5) in Shop Talk
         'topping' → no "How many?" (cheese, corn, mayo)
   s = starting size
   --------------------------------------------------------- */
const ING = [
  { id:'cheese',   label:'cheese',       one:'cheese',       many:'cheese',        ja:'チーズ',     kind:'topping', s:1.10, cat:'top' },
  { id:'tomato',   label:'tomato',       one:'tomato',       many:'tomatoes',      ja:'トマト',     kind:'count',   s:0.86,  cat:'veg' },
  { id:'pepper',   label:'green pepper', one:'green pepper', many:'green peppers', ja:'ピーマン',   kind:'count',   s:0.74,  cat:'veg' },
  { id:'onion',    label:'onion',        one:'onion',        many:'onions',        ja:'たまねぎ',   kind:'count',   s:0.74,  cat:'veg' },
  { id:'mushroom', label:'mushroom',     one:'mushroom',     many:'mushrooms',     ja:'きのこ',     kind:'count',   s:0.74,  cat:'veg' },
  { id:'corn',     label:'corn',         one:'corn',         many:'corn',          ja:'コーン',     kind:'topping', s:.70,  cat:'veg' },
  { id:'olive',    label:'olive',        one:'olive',        many:'olives',        ja:'オリーブ',   kind:'count',   s:0.46,  cat:'veg' },
  { id:'bacon',    label:'bacon',        one:'bacon',        many:'bacon',         ja:'ベーコン',   kind:'count',   s:1.45,  cat:'meat' },
  { id:'ham',      label:'ham',          one:'ham',          many:'ham',           ja:'ハム',       kind:'count',   s:0.79,  cat:'meat' },
  { id:'sausage',  label:'sausage',      one:'sausage',      many:'sausages',      ja:'ソーセージ', kind:'count',   s:0.74,  cat:'meat' },
  { id:'salami',   label:'salami',       one:'salami',       many:'salami',        ja:'サラミ',     kind:'count',   s:0.74,  cat:'meat' },
  { id:'shrimp',   label:'shrimp',       one:'shrimp',       many:'shrimp',        ja:'えび',       kind:'count',   s:0.72,  cat:'meat' },
  { id:'pineapple',label:'pineapple',    one:'pineapple',    many:'pineapples',    ja:'パイナップル', kind:'count', s:.62,  cat:'top' },
  { id:'egg',      label:'egg',          one:'egg',          many:'eggs',          ja:'たまご',     kind:'count',   s:0.67,  cat:'top' },
  { id:'mayo',     label:'mayo',         one:'mayonnaise',   many:'mayonnaise',    ja:'マヨネーズ', kind:'topping', s:1.50, cat:'top' },
];
const ING_BY = Object.fromEntries(ING.map(i => [i.id, i]));

/* ---------------------------------------------------------
   3. THE FIXED PIZZA BASE (board + crust + tomato sauce)
   --------------------------------------------------------- */
/* ---------- fixed base: board + crust + sauce ---------- */
function pizzaBase(PX, PY, CRUST_R, SAUCE_R, baked) {
  const r = seeded(3), O = '#5b3a29';
  let s = '';
  s += `<ellipse cx="${PX}" cy="${PY + 252}" rx="210" ry="14" fill="rgba(91,58,41,.10)"/>`;
  s += `<rect x="${PX + 225}" y="${PY - 22}" width="110" height="44" rx="22" fill="#e9b77a" stroke="${O}" stroke-width="4"/>`;
  s += `<circle cx="${PX + 312}" cy="${PY}" r="8" fill="#fdf1d8" stroke="${O}" stroke-width="3"/>`;
  s += `<circle cx="${PX}" cy="${PY}" r="248" fill="#e9b77a" stroke="${O}" stroke-width="4"/>`;
  s += `<circle cx="${PX}" cy="${PY}" r="236" fill="none" stroke="#d9a061" stroke-width="3"/>`;
  s += `<path d="${blob(PX, PY, a => CRUST_R + 3 * Math.sin(9 * a) + 2 * Math.sin(5 * a + 1), 120)}" fill="url(#${baked ? 'pz-crustB' : 'pz-crustR'})" stroke="${O}" stroke-width="4"/>`;
  if (baked) {
    for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d = CRUST_R - 11 + (r() - .5) * 16, [x, y] = P(PX, PY, d, a);
      s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(6 + r() * 12)}" ry="${f1(4 + r() * 5)}" fill="url(#pz-brown)" transform="rotate(${f1(a * 180 / Math.PI + 90 + (r() - .5) * 40)} ${f1(x)} ${f1(y)})"/>`; }
    for (let i = 0; i < 12; i++) { const a = r() * Math.PI * 2, d = CRUST_R - 8 + (r() - .5) * 8, [x, y] = P(PX, PY, d, a);
      s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(5 + r() * 7)}" ry="${f1(2.5 + r() * 2.5)}" fill="url(#pz-char)" transform="rotate(${f1(a * 180 / Math.PI + 90)} ${f1(x)} ${f1(y)})"/>`; }
    for (let i = 0; i < 9; i++) { const a = r() * Math.PI * 2, d = CRUST_R - 12, [x, y] = P(PX, PY, d, a), rr = 3 + r() * 3;
      s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rr)}" fill="#f6c97c" stroke="#b9702c" stroke-width="1"/><circle cx="${f1(x - rr * .3)}" cy="${f1(y - rr * .3)}" r="${f1(rr * .35)}" fill="#fde7b8"/>`; }
  } else {
    for (let i = 0; i < 30; i++) { const a = r() * Math.PI * 2, d = CRUST_R - 10 + (r() - .5) * 14, [x, y] = P(PX, PY, d, a);
      s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1 + r() * 1.6)}" fill="#fff" opacity=".75"/>`; }
  }
  s += `<path d="${blob(PX, PY, a => SAUCE_R + 6 * Math.sin(7 * a) + 4 * Math.sin(11 * a + 2), 140)}" fill="${baked ? '#cf3529' : '#e8483b'}" stroke="${baked ? '#a7261d' : '#cf3a2e'}" stroke-width="3"/>`;
  for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * (SAUCE_R - 30), [x, y] = P(PX, PY, d, a);
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(8 + r() * 12)}" ry="${f1(5 + r() * 6)}" fill="${baked ? '#e14e3b' : '#f26a54'}" opacity=".55"/>`; }
  for (let i = 0; i < 34; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * (SAUCE_R - 14), [x, y] = P(PX, PY, d, a);
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.5" fill="#3f7a2a" opacity=".7"/>`; }
  if (baked) for (let i = 0; i < 5; i++) { const a = r() * Math.PI * 2, d = SAUCE_R - 8, [x, y] = P(PX, PY, d, a);
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="10" ry="5" fill="url(#pz-brown)" opacity=".7"/>`; }
  return s;
}

const BASE_RAW = pizzaBase(PX, PY, CRUST_R, SAUCE_R, false), BASE_BAKED = pizzaBase(PX, PY, CRUST_R, SAUCE_R, true);

/* ---------------------------------------------------------
   4. STATE, SAVE & LOAD
   --------------------------------------------------------- */
const state = { shop: '', items: [] };
const prefs = { talk: false, ja: false, sound: true };
let selId = null;
const undoStack = [];
let pending = null;
let busy = false;                // true while the oven / finished screen is showing

function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } }
function fetchKey(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } }
function cleanItems() { return state.items.map(({ w, h, ...rest }) => rest); }

function loadAll() {
  const p = fetchKey(PREFS_KEY);
  if (p) Object.assign(prefs, p);
  const d = fetchKey(SAVE_KEY);
  if (d && d.v === 1 && Array.isArray(d.items)) {
    state.shop = String(d.shop || '');
    state.items = d.items.filter(it => it && (it.t === 'card' || ART[it.t]));
  }
}
const savePrefs = () => store(PREFS_KEY, prefs);

const snap = () => JSON.stringify(cleanItems());
function beginChange() { if (pending === null) pending = snap(); }
function endChange() {
  if (pending === null) return;
  const now = snap();
  if (now !== pending) { undoStack.push(pending); if (undoStack.length > 50) undoStack.shift(); }
  pending = null;
  $('#undoBtn').disabled = !undoStack.length;
}

/* ---------------------------------------------------------
   5. DOM HELPERS & SCALING
   --------------------------------------------------------- */
const $ = s => document.querySelector(s);
const stage = $('#stage'), tray = $('#tray'), panel = $('#panel');
const itemsLayer = $('#items'), cardsLayer = $('#cards'), fx = $('#fx');
const toolbar = $('#toolbar'), trash = $('#trash'), hint = $('#hint');
let SCALE = 1;

function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  SCALE = Math.min(w / 980, h / 640);
  stage.style.transform = `translate(${(w - 980 * SCALE) / 2}px,${(h - 640 * SCALE) / 2}px) scale(${SCALE})`;
  updateToolbar();
}
function toTray(e) {
  const r = tray.getBoundingClientRect();
  return { x: (e.clientX - r.left) / SCALE, y: (e.clientY - r.top) / SCALE };
}
const inRect = (e, el) => { const r = el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
const uid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const findItem = id => state.items.find(i => i.id === id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------------------------------------------------------
   6. SOUND EFFECTS (Web Audio – no files needed)
   --------------------------------------------------------- */
let actx = null;
function audio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (actx && actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(f0, f1, dur, type = 'sine', vol = .18, delay = 0) {
  const c = audio(); if (!c || !prefs.sound) return;
  const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
}
const sfx = {
  pop:   () => tone(520, 980, .12),
  drop:  () => tone(300, 200, .09, 'triangle', .14),
  trash: () => tone(500, 120, .22, 'triangle', .15),
  click: () => tone(700, 700, .05, 'square', .05),
  save:  () => { tone(660, 660, .12, 'sine', .15); tone(990, 990, .2, 'sine', .15, .12); },
  door:  () => tone(180, 90, .18, 'triangle', .2),
  tick:  () => tone(1200, 1200, .04, 'square', .05),
  ding:  () => { tone(1568, 1568, .9, 'sine', .2); tone(2093, 2093, .7, 'sine', .1, .02); },
  yay:   () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .18, 'triangle', .12, i * .1)); },
};

/* ---------------------------------------------------------
   7. DRAWING TOPPINGS
   --------------------------------------------------------- */
const els = new Map();

function elFor(it) {
  let el = els.get(it.id);
  if (!el) {
    el = document.createElement('div');
    el.dataset.id = it.id;
    if (it.t === 'card') { el.className = 'card'; el.textContent = it.text; cardsLayer.appendChild(el); }
    else { el.className = 'item'; el.innerHTML = `<svg viewBox="0 0 100 100">${ART[it.t]}</svg>`; itemsLayer.appendChild(el); }
    els.set(it.id, el);
  }
  return el;
}
function place(it) {
  const el = elFor(it);
  const w = it.t === 'card' ? el.offsetWidth : 100, h = it.t === 'card' ? el.offsetHeight : 100;
  it.w = w; it.h = h;
  el.style.transform = `translate(${f1(it.x - w / 2)}px,${f1(it.y - h / 2)}px) rotate(${f1(it.r)}deg) scale(${f1(it.s * it.f * 100) / 100},${f1(it.s * 100) / 100})`;
  el.classList.toggle('sel', it.id === selId);
}
function renderAll() {
  itemsLayer.innerHTML = ''; cardsLayer.innerHTML = ''; els.clear();
  state.items.forEach(place);
  updateToolbar(); updateHint();
}
function reorderDom() { state.items.forEach(it => { const el = els.get(it.id); if (el) el.parentNode.appendChild(el); }); }
function animate(it, cls, ms = 450) {
  const el = els.get(it.id); if (!el) return;
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}
function sparkle(x, y, n = 7) {
  const marks = ['✦', '★', '✧', '♥'], cols = ['#ff7aa2', '#ffd23f', '#7cc8f2', '#b388ff'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'), a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 40;
    s.className = 'spark'; s.textContent = marks[i % 4];
    s.style.cssText = `left:${x}px;top:${y}px;color:${cols[i % 4]};--dx:${f1(Math.cos(a) * d)}px;--dy:${f1(Math.sin(a) * d)}px`;
    fx.appendChild(s); setTimeout(() => s.remove(), 800);
  }
}
function select(id) {
  selId = id;
  els.forEach((el, k) => el.classList.toggle('sel', k === id));
  updateToolbar(); updateHint();
}
function newItem(type, x, y, extra = {}) {
  const ing = ING_BY[type];
  const it = { id: uid(), t: type, x, y, s: ing ? ing.s : 1, r: 0, f: 1, ...extra };
  state.items.push(it); place(it);
  return it;
}
function removeItem(it) {
  const el = els.get(it.id);
  state.items = state.items.filter(i => i !== it);
  els.delete(it.id);
  if (el) { el.classList.add('poof'); setTimeout(() => el.remove(), 270); }
  if (selId === it.id) select(null);
  sfx.trash();
}
function clampIn(it) { it.x = clamp(it.x, 10, TRAY_W - 10); it.y = clamp(it.y, 10, TRAY_H - 10); }

/* tap on a topping → it flies to a random spot on the pizza */
function autoPlace(it) {
  const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * (SAUCE_R - 40);
  it.x = PX + Math.cos(a) * d;
  it.y = PY + Math.sin(a) * d;
  it.r = it.t === 'mayo' ? Math.round(Math.random() * 60 - 30) : Math.round(Math.random() * 360);
  const el = els.get(it.id);
  el.style.transition = 'transform .5s cubic-bezier(.34,1.45,.5,1)';
  place(it);
  setTimeout(() => { el.style.transition = ''; sparkle(it.x, it.y); updateToolbar(); }, 500);
  sfx.pop();
}

/* ---------------------------------------------------------
   8. FLOATING TOOLBAR & HINT
   --------------------------------------------------------- */
function updateToolbar() {
  const it = selId && findItem(selId);
  if (!it || gesture) { toolbar.hidden = true; return; }
  toolbar.hidden = false;
  toolbar.classList.toggle('card-mode', it.t === 'card');
  const el = els.get(it.id), r = el.getBoundingClientRect(), tr = tray.getBoundingClientRect();
  const tw = toolbar.offsetWidth, th = toolbar.offsetHeight;
  const cx = ((r.left + r.right) / 2 - tr.left) / SCALE;
  let top = (r.top - tr.top) / SCALE - th - 10;
  if (top < 4) top = (r.bottom - tr.top) / SCALE + 10;
  toolbar.style.left = clamp(cx - tw / 2, 4, TRAY_W - tw - 4) + 'px';
  toolbar.style.top = clamp(top, 4, TRAY_H - th - 4) + 'px';
}
function updateHint() {
  if (selId) hint.innerHTML = 'Drag to move · Pinch with 2 fingers to resize &amp; turn<small>ドラッグでうごかす・2本ゆびで大きさと向きをかえる</small>';
  else if (!state.items.length) hint.innerHTML = 'Tap or drag a topping onto the pizza!<small>トッピングを タップ か ドラッグしてね！</small>';
  else hint.innerHTML = 'All done? Press 🔥 Bake!<small>できたら「Bake!」をおしてね</small>';
}

const ACTIONS = {
  flip:    it => { it.f *= -1; },
  bigger:  it => { it.s = clamp(it.s * 1.15, .2, 3.5); },
  smaller: it => { it.s = clamp(it.s / 1.15, .2, 3.5); },
  rotL:    it => { it.r -= 15; },
  rotR:    it => { it.r += 15; },
  front:   it => { state.items = state.items.filter(i => i !== it).concat(it); reorderDom(); },
  back:    it => { state.items = [it].concat(state.items.filter(i => i !== it)); reorderDom(); },
};
toolbar.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const it = selId && findItem(selId); if (!it) return;
  beginChange();
  if (b.dataset.act === 'delete') removeItem(it);
  else { ACTIONS[b.dataset.act](it); place(it); animate(it, 'land', 360); sfx.click(); }
  endChange(); updateToolbar(); updateHint();
});

/* ---------------------------------------------------------
   9. TOUCH & MOUSE: drag, pinch, wheel
   --------------------------------------------------------- */
const pointers = new Map();
let gesture = null;

function overDelete(e) { return inRect(e, trash) || (!document.body.classList.contains('show') && inRect(e, panel)); }
function setHot(e) {
  const t = inRect(e, trash), p = !t && !document.body.classList.contains('show') && inRect(e, panel);
  trash.classList.toggle('hot', t);
  panel.classList.toggle('drop-del', p && !(gesture && gesture.fromBtn && !gesture.left));
}
function clearHot() { trash.classList.remove('hot'); panel.classList.remove('drop-del'); tray.classList.remove('dragging-item'); }

function startPinch() {
  const ids = [...pointers.keys()].slice(0, 2), [a, b] = ids.map(i => pointers.get(i));
  const it = gesture.item;
  gesture = { type: 'pinch', item: it, ids, d0: Math.hypot(b.x - a.x, b.y - a.y) || 1,
              a0: Math.atan2(b.y - a.y, b.x - a.x), s0: it.s, r0: it.r };
  const el = els.get(it.id); if (el) el.classList.remove('dragging');
  toolbar.hidden = true;
}

stage.addEventListener('pointerdown', e => {
  audio();
  if (busy) return;
  const btn = e.target.closest('.ing-btn');
  if (!btn && e.target.closest('button, input, a, .modal')) return;
  const p = toTray(e);
  pointers.set(e.pointerId, p);

  if (gesture && gesture.item && pointers.size === 2) { e.preventDefault(); startPinch(); return; }
  if (pointers.size > 2 || gesture) return;

  const pieceEl = e.target.closest('.item, .card');
  if (btn) {
    e.preventDefault();
    beginChange();
    const it = newItem(btn.dataset.id, p.x, p.y);
    animate(it, 'pop');
    select(it.id); sfx.pop();
    gesture = { type: 'drag', item: it, pid: e.pointerId, ox: 0, oy: 0, sx: e.clientX, sy: e.clientY,
                moved: false, fromBtn: true, t0: performance.now() };
    toolbar.hidden = true;
  } else if (pieceEl) {
    e.preventDefault();
    const it = findItem(pieceEl.dataset.id); if (!it) return;
    beginChange();
    select(it.id);
    gesture = { type: 'drag', item: it, pid: e.pointerId, ox: p.x - it.x, oy: p.y - it.y,
                sx: e.clientX, sy: e.clientY, moved: false };
  } else if (e.target.closest('#tray')) {
    select(null);
  }
});

window.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  const p = toTray(e); pointers.set(e.pointerId, p);
  if (!gesture) return;
  e.preventDefault();
  if (gesture.type === 'drag' && e.pointerId === gesture.pid) {
    const it = gesture.item, el = els.get(it.id);
    if (!gesture.moved && Math.hypot(e.clientX - gesture.sx, e.clientY - gesture.sy) > 8) {
      gesture.moved = true; toolbar.hidden = true;
      tray.classList.add('dragging-item');
      if (el) el.classList.add('dragging');
      if (!gesture.fromBtn) { state.items = state.items.filter(i => i !== it).concat(it); reorderDom(); }
    }
    if (gesture.moved) {
      if (gesture.fromBtn && !inRect(e, panel)) gesture.left = true;
      it.x = p.x - gesture.ox; it.y = p.y - gesture.oy; place(it); setHot(e);
    }
  } else if (gesture.type === 'pinch') {
    const [a, b] = gesture.ids.map(i => pointers.get(i)); if (!a || !b) return;
    const it = gesture.item;
    it.s = clamp(gesture.s0 * Math.hypot(b.x - a.x, b.y - a.y) / gesture.d0, .2, 3.5);
    it.r = gesture.r0 + (Math.atan2(b.y - a.y, b.x - a.x) - gesture.a0) * 180 / Math.PI;
    place(it);
  }
}, { passive: false });

function pointerEnd(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (!gesture) return;

  if (gesture.type === 'pinch') {
    if (pointers.size >= 2) return;
    const it = gesture.item, rest = [...pointers.entries()][0];
    if (rest) { const [pid, p] = rest; gesture = { type: 'drag', item: it, pid, ox: p.x - it.x, oy: p.y - it.y, sx: 0, sy: 0, moved: true }; }
    else finishGesture();
    return;
  }
  if (e.pointerId !== gesture.pid) return;

  const g = gesture, it = g.item, el = els.get(it.id);
  if (el) el.classList.remove('dragging');
  if (g.fromBtn && !g.moved && performance.now() - g.t0 < 700) {
    autoPlace(it);
  } else if (g.moved) {
    if (e.type === 'pointerup' && overDelete(e)) removeItem(it);
    else { clampIn(it); place(it); animate(it, 'land', 360); sfx.drop(); }
  } else if (g.fromBtn) {
    removeItem(it);
  }
  finishGesture();
}
function finishGesture() { gesture = null; clearHot(); endChange(); updateToolbar(); updateHint(); }
window.addEventListener('pointerup', pointerEnd);
window.addEventListener('pointercancel', pointerEnd);

let wheelTimer = null;
stage.addEventListener('wheel', e => {
  const it = selId && findItem(selId); if (!it || busy) return;
  e.preventDefault();
  beginChange();
  it.s = clamp(it.s * (e.deltaY < 0 ? 1.07 : 1 / 1.07), .2, 3.5);
  place(it); updateToolbar();
  clearTimeout(wheelTimer); wheelTimer = setTimeout(endChange, 400);
}, { passive: false });

document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('contextmenu', e => { if (!e.target.closest('#photoImg')) e.preventDefault(); });
document.addEventListener('touchmove', e => { if (!e.target.closest('input')) e.preventDefault(); }, { passive: false });

document.addEventListener('keydown', e => {
  if (e.target.closest('input') || busy) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
  const it = selId && findItem(selId); if (!it) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { beginChange(); removeItem(it); endChange(); updateHint(); }
});

/* ---------------------------------------------------------
   10. PANEL BUTTONS
   --------------------------------------------------------- */
function undo() {
  if (!undoStack.length) return;
  state.items = JSON.parse(undoStack.pop());
  selId = null; renderAll(); sfx.click();
  $('#undoBtn').disabled = !undoStack.length;
}
$('#undoBtn').addEventListener('click', undo);

const cardModal = $('#cardModal'), cardInput = $('#cardInput');
$('#cardBtn').addEventListener('click', () => { cardInput.value = ''; cardModal.hidden = false; setTimeout(() => cardInput.focus(), 50); });
function closeCard() { cardModal.hidden = true; cardInput.blur(); }
$('#cardCancel').addEventListener('click', closeCard);
$('#cardOk').addEventListener('click', () => {
  const text = cardInput.value.trim(); closeCard();
  if (!text) return;
  beginChange();
  const it = newItem('card', 130, 470, { text, s: 1 });
  clampIn(it); place(it); animate(it, 'pop'); select(it.id); sfx.pop();
  endChange();
});
cardInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) $('#cardOk').click(); });

$('#saveBtn').addEventListener('click', () => {
  const ok = store(SAVE_KEY, { v: 1, shop: state.shop, items: cleanItems() });
  if (ok) { sfx.save(); toast('Saved! 💾', 'ほぞんしました！'); }
  else toast('Sorry, could not save.', 'ほぞんできませんでした。');
});

/* reset (also used by "Make Another Pizza") */
const resetModal = $('#resetModal');
let resetFromDone = false;
$('#resetBtn').addEventListener('click', () => { resetFromDone = false; resetModal.hidden = false; });
$('#resetNo').addEventListener('click', () => { resetModal.hidden = true; });
$('#resetYes').addEventListener('click', () => {
  resetModal.hidden = true;
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}     // removes ONLY this game's design
  state.items = [];
  if (!resetFromDone) { state.shop = ''; $('#shopName').value = ''; }   // keep the shop name for "Make Another"
  undoStack.length = 0; $('#undoBtn').disabled = true;
  selId = null; renderAll(); sfx.trash();
  if (resetFromDone) closeDone();
});

$('#panelTab').addEventListener('click', () => { document.body.classList.toggle('show'); select(null); sfx.click(); });

/* ---------------------------------------------------------
   11. PICTURES (SVG → PNG)
   --------------------------------------------------------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SVG_FONT = `'Hiragino Maru Gothic ProN','Arial Rounded MT Bold','BIZ UDPGothic','Noto Sans JP',sans-serif`;
const tf = it => `translate(${f1(it.x)},${f1(it.y)}) rotate(${f1(it.r)}) scale(${f1(it.s * it.f * 100) / 100},${f1(it.s * 100) / 100})`;

function toppingsSVG(baked) {
  let s = `<g${baked ? ' filter="url(#pz-toast)"' : ''}>`;
  state.items.filter(i => i.t !== 'card').forEach(it => {
    const art = baked && BAKED[it.t] ? BAKED[it.t] : ART[it.t];
    s += `<g transform="${tf(it)} translate(-50,-50)">${art}</g>`;
  });
  return s + '</g>';
}
function cardsSVG() {
  let s = '';
  state.items.filter(i => i.t === 'card').forEach(it => {
    const w = it.w || 160, h = it.h || 46;
    s += `<g transform="${tf(it)}"><rect x="${-w / 2 + 1.5}" y="${-h / 2 + 1.5}" width="${w - 3}" height="${h - 3}" rx="13" fill="#fff" stroke="#ff7aa2" stroke-width="3"/>` +
         `<text y="1" text-anchor="middle" dominant-baseline="central" font-family="${SVG_FONT}" font-size="24" font-weight="bold" fill="${O}">${esc(it.text)}</text></g>`;
  });
  return s;
}

/* whole tray picture with the shop name (for saving) */
function buildSVG(baked) {
  const W = TRAY_W, TOP = 78, H = TRAY_H + TOP;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += `<defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="4" fill="#fff"/></pattern>${DEFS}</defs>`;
  s += `<rect width="${W}" height="${H}" fill="#fff7e6"/>`;
  for (let i = 0; i < W / 40; i++) {
    const c = i % 2 ? '#fff' : '#ff8fb1';
    s += `<rect x="${i * 40}" width="40" height="16" fill="${c}"/><path d="M${i * 40} 16A20 12 0 0 0 ${i * 40 + 40} 16Z" fill="${c}"/>`;
  }
  s += `<g transform="translate(0,${TOP})"><rect width="${W}" height="${TRAY_H}" rx="26" fill="#fdf1d8"/><rect width="${W}" height="${TRAY_H}" rx="26" fill="url(#dots)"/>`;
  s += baked ? BASE_BAKED : BASE_RAW;
  s += toppingsSVG(baked) + cardsSVG() + `</g>`;
  const name = state.shop.trim() || 'My Pizza Shop';
  s += `<text x="20" y="62" text-anchor="start" font-family="${SVG_FONT}" font-size="28" font-weight="bold" fill="${O}" stroke="#fff7e6" stroke-width="8" stroke-linejoin="round" paint-order="stroke">🍕 ${esc(name)}</text>`;
  return { svg: s + `</svg>`, W, H };
}

/* just the pizza (for the oven and the finished screen) */
function pizzaOnlySVG(baked, withBoard) {
  const pad = withBoard ? 0 : 0, R = withBoard ? 260 : 232;
  const x0 = PX - R, y0 = PY - R, w = withBoard ? R * 2 + 86 : R * 2;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0 - pad} ${y0 - pad} ${w} ${R * 2}"><defs>${DEFS}` +
          `<clipPath id="pz"><circle cx="${PX}" cy="${PY}" r="${CRUST_R + 4}"/></clipPath></defs>`;
  let base = baked ? BASE_BAKED : BASE_RAW;
  if (!withBoard) base = `<g clip-path="url(#pz)">${base}</g>`;
  s += base + toppingsSVG(baked) + (withBoard ? cardsSVG() : '');
  return s + '</svg>';
}
const svgURL = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

let photoURL = null, photoBlob = null;
async function showPhoto(baked) {
  select(null);
  const { svg, W, H } = buildSVG(baked);
  const img = new Image(); img.src = svgURL(svg);
  try {
    await img.decode();
    const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2;
    const ctx = c.getContext('2d'); ctx.scale(2, 2); ctx.drawImage(img, 0, 0, W, H);
    photoBlob = await new Promise(res => c.toBlob(res, 'image/png'));
    if (!photoBlob) throw new Error('no blob');
    if (photoURL && photoURL.startsWith('blob:')) URL.revokeObjectURL(photoURL);
    photoURL = URL.createObjectURL(photoBlob);
  } catch (err) { photoBlob = null; photoURL = img.src; }
  const fname = (state.shop.trim() || 'my-pizza').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-') + '.png';
  $('#photoImg').src = photoURL;
  const dl = $('#photoDownload'); dl.href = photoURL; dl.download = fname;
  const share = $('#photoShare'); share.hidden = true;
  if (photoBlob && navigator.canShare) {
    const file = new File([photoBlob], fname, { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      share.hidden = false;
      share.onclick = () => navigator.share({ files: [file], title: 'My pizza' }).catch(() => {});
    }
  }
  $('#photoModal').hidden = false; sfx.save();
}
$('#photoBtn').addEventListener('click', () => showPhoto(false));
$('#photoClose').addEventListener('click', () => { $('#photoModal').hidden = true; });

/* ---------------------------------------------------------
   12. BAKE! – oven animation (about 7 seconds)
   --------------------------------------------------------- */
const bake = $('#bake'), ovenPizza = $('#ovenPizza'), door = bake.querySelector('.door');
const bakeText = $('#bakeText'), steam = $('#steam');
const P_START  = 'translate(390px,425px) scale(.95)';
const P_INSIDE = 'translate(390px,172px) scale(1.12,.5)';
const P_OUT    = 'translate(390px,415px) scale(1.05)';

function say(en, ja) {
  bakeText.innerHTML = en + (ja ? `<small>${ja}</small>` : '');
  bakeText.classList.remove('bump'); void bakeText.offsetWidth; bakeText.classList.add('bump');
}
function puffs(n = 5) {
  for (let i = 0; i < n; i++) setTimeout(() => {
    const p = document.createElement('span'); p.className = 'puff';
    p.style.left = (400 + Math.random() * 180) + 'px'; p.style.top = (40 + Math.random() * 30) + 'px';
    steam.appendChild(p); setTimeout(() => p.remove(), 1700);
  }, i * 220);
}
async function runBake() {
  if (busy) return;
  busy = true; select(null);
  ovenPizza.style.transition = 'none';
  ovenPizza.style.transform = P_START;
  ovenPizza.src = svgURL(pizzaOnlySVG(false, false));
  door.classList.remove('open'); bake.classList.remove('heating');
  bakeText.innerHTML = ''; steam.innerHTML = '';
  bake.hidden = false;
  void ovenPizza.offsetWidth; ovenPizza.style.transition = '';

  await wait(650);  door.classList.add('open'); sfx.door();                 // door opens
  say('Into the oven!', 'オーブンに入れるよ！');
  await wait(550);  ovenPizza.style.transform = P_INSIDE;                    // pizza slides in
  await wait(1000); door.classList.remove('open'); sfx.door();              // door closes
  await wait(350);  bake.classList.add('heating');                          // heat on
  for (const n of [3, 2, 1]) { say(`Baking… ${n}`, `やいているよ… ${n}`); sfx.tick(); puffs(3); await wait(1000); }
  ovenPizza.src = svgURL(pizzaOnlySVG(true, false));                        // now it is baked
  bake.classList.remove('heating');
  say('Ding! 🔔', 'チン！'); sfx.ding(); puffs(6);
  await wait(500);  door.classList.add('open'); sfx.door();                 // door opens
  await wait(450);  ovenPizza.style.transform = P_OUT;                       // pizza comes out
  await wait(950);
  showDone();
}
$('#bakeBtn').addEventListener('click', () => {
  if (!state.items.some(i => i.t !== 'card')) { toast('Add some toppings first! 🍕', 'まずトッピングをのせよう！'); return; }
  runBake();
});

/* ---------------------------------------------------------
   13. FINISHED PIZZA
   --------------------------------------------------------- */
const done = $('#done');
function confetti() {
  const box = $('#confetti'); box.innerHTML = '';
  const cols = ['#ff7aa2', '#ffd23f', '#7cc8f2', '#7bd389', '#b388ff', '#ff9f40'];
  for (let i = 0; i < 46; i++) {
    const c = document.createElement('i'); c.className = 'conf';
    c.style.cssText = `left:${Math.random() * 980}px;background:${cols[i % cols.length]};animation-duration:${(2.2 + Math.random() * 2).toFixed(2)}s;animation-delay:${(Math.random() * .8).toFixed(2)}s`;
    box.appendChild(c);
  }
}
function showDone() {
  $('#doneName').textContent = '🍕 ' + (state.shop.trim() || 'My Pizza Shop');
  $('#donePizza').src = svgURL(pizzaOnlySVG(true, true));
  bake.hidden = true; done.hidden = false;
  confetti(); sfx.yay();
}
function closeDone() { done.hidden = true; busy = false; updateHint(); }
$('#donePhoto').addEventListener('click', () => showPhoto(true));
$('#doneBack').addEventListener('click', () => { closeDone(); sfx.click(); });
$('#doneAgain').addEventListener('click', () => { resetFromDone = true; resetModal.hidden = false; });

/* ---------------------------------------------------------
   14. TOP BAR SWITCHES
   --------------------------------------------------------- */
let toastTimer = null;
function toast(en, ja) {
  const t = $('#toast');
  t.innerHTML = en + (ja ? `<small class="ja">${ja}</small>` : '');
  t.hidden = false; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}
function applyPrefs() {
  document.body.classList.toggle('ja-on', prefs.ja);
  $('#jaBtn').setAttribute('aria-pressed', prefs.ja);
  $('#talkBtn').setAttribute('aria-pressed', prefs.talk);
  $('#talkBtn .sw-state').textContent = prefs.talk ? 'ON' : 'OFF';
  $('#soundBtn').classList.toggle('off', !prefs.sound);
  $('#soundBtn').textContent = prefs.sound ? '🔊' : '🔇';
  updateToolbar();
}
$('#jaBtn').addEventListener('click', () => { prefs.ja = !prefs.ja; applyPrefs(); savePrefs(); sfx.click(); });
$('#soundBtn').addEventListener('click', () => { prefs.sound = !prefs.sound; applyPrefs(); savePrefs(); sfx.click(); });
$('#talkBtn').addEventListener('click', () => {
  prefs.talk = !prefs.talk; applyPrefs(); savePrefs(); sfx.click();
  if (prefs.talk) toast('Shop Talk will be added in Step 2 🗣️', 'おみせの会話は つぎのステップで ついかします');
});
$('#shopName').addEventListener('input', e => { state.shop = e.target.value; });
$('#shopName').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });

/* ---------------------------------------------------------
   15. START
   --------------------------------------------------------- */
$('#grid').innerHTML = ING.map(i =>
  `<button type="button" class="ing-btn cat-${i.cat}" data-id="${i.id}" aria-label="${i.label}">` +
  `<svg viewBox="0 0 100 100">${ART[i.id]}</svg><span class="en">${i.label}</span><span class="ja">${i.ja}</span></button>`
).join('');
(() => {   // shared gradients used by every topping picture on the page
  const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  d.setAttribute('width', '0'); d.setAttribute('height', '0'); d.style.position = 'absolute';
  d.innerHTML = `<defs>${DEFS}</defs>`; document.body.prepend(d);
})();
$('#pizzaBase').innerHTML = BASE_RAW;
loadAll();
$('#shopName').value = state.shop;
applyPrefs();
renderAll();
$('#undoBtn').disabled = true;
window.addEventListener('resize', fit);
fit();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => state.items.forEach(place));

})();
