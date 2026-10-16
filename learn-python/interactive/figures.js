// The machines. Each figure turns lesson state (read from your Python) into
// an isometric drawing made with the repo's kit, and eases between states.

const VIEW_W = 640;
const VIEW_H = 400;
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clampH = (v, max = 48) => (isNum(v) ? Math.max(0, Math.min(max, v)) : 0);
const f1 = (n) => n.toFixed(1);

function fitP(points, azimuth = 28, headroom = 70) {
  return k.fitProjection(points, VIEW_W, VIEW_H, { pad: 34, azimuth, headroom });
}

function text(x, y, value, cls = "lab", anchor = "middle") {
  return `<text class="${cls}" x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}">${esc(value)}</text>`;
}
function leader(a, b, cls = "leader") {
  return `<path class="${cls}" d="M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}"/>`;
}

function plate(P, plan, h = 6) {
  const out = [`<path class="iso-halo" d="${k.haloOf(plan, -h, h, P)}"/>`];
  out.push(S(k.slabOf(plan, -h, h, P, 8, 1.2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 4), 0, P), { tone: "faint" }));
  const screws = k.corners(plan, 8);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(k.dotsSvg(screws.map(([x, y]) => k.iso([x, y, 0], P)), { size: 0.9 }));
  return out.join("");
}

function block(P, cx, cy, z, h, opts = {}) {
  if (h < 0.05) return "";
  const w = opts.w || 16;
  const plan = { x: cx - w / 2, y: cy - w / 2, w, d: w, r: 1 };
  return S(k.slabOf(plan, z, h, P, 3, 0.5), { tone: "hi", crease: "lo", lit: opts.lit }) + L(k.planOutline(k.insetPlan(plan, 2), z + h, P, 3), { tone: "faint" });
}

function dial(P, cx, cy, z, r, turn) {
  const out = [];
  const h = 6;
  out.push(S(k.cylinder(cx, cy, r, z, h, P, 64, 0.8), { tone: "hi", crease: "lo" }));
  const zt = z + h;
  out.push(L(k.knurl(cx, cy, r, zt - 2.4, zt, 84, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(cx, cy, r - 2, zt, P, 64), { tone: "lo" }));
  const ticks = k.radialTicks(cx, cy, r - 3, 40, 5, zt, [1.4, 3], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  const sweep = Math.max(0, Math.min(turn, 1));
  if (sweep > 0.002) {
    const pts = [];
    const steps = Math.max(2, Math.round(sweep * 80));
    for (let s = 0; s <= steps; s++) {
      const a = (s / steps) * sweep * Math.PI * 2;
      pts.push([cx - Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55]);
    }
    out.push(L(k.onTop(pts, zt + 0.1, P), { tone: "blue" }));
  }
  const a = turn * Math.PI * 2;
  out.push(L(k.lineOnTop([cx + Math.cos(a) * 3, cy - Math.sin(a) * 3], [cx - Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4)], zt + 0.2, P), { tone: "red" }));
  out.push(L(k.lineOnTop([cx - (r - 1.5), cy], [cx - (r - 6), cy], zt + 0.2, P), { tone: "hi" }));
  out.push(L(k.ring(cx, cy, 1.4, zt + 0.2, P, 16), { tone: "hi" }));
  return out.join("");
}

// Ease numbers and arrays of numbers toward their targets.
function easeValue(cur, tgt, a) {
  if (Array.isArray(tgt)) return tgt.map((t, i) => easeValue(Array.isArray(cur) && isNum(cur[i]) ? cur[i] : 0, t, a));
  if (!isNum(cur)) return tgt;
  const next = cur + (tgt - cur) * a;
  return Math.abs(tgt - next) < 0.01 ? tgt : next;
}
function settled(cur, tgt) {
  if (Array.isArray(tgt)) return Array.isArray(cur) && cur.length === tgt.length && tgt.every((t, i) => settled(cur[i], t));
  return cur === tgt;
}

// ---------- Lesson 1: two labelled boxes ----------
function figVariables() {
  const items = [
    { key: "first_block", c: [0, 36] },
    { key: "per_turn", c: [0, -36] },
  ];
  const P = fitP([...k.boxCorners({ x: -38, y: -70, w: 76, d: 140 }, -6, 0), [0, 36, 52], [0, -36, 52]]);
  return {
    target: (s) => ({ a: clampH(s.first_block), b: clampH(s.per_turn) }),
    render(cur, s) {
      const out = [plate(P, { x: -38, y: -70, w: 76, d: 140, r: 6 })];
      const order = [...items].sort((p, q) => k.depthOf([...p.c, 0], P) - k.depthOf([...q.c, 0], P));
      for (const it of order) {
        const tray = { x: it.c[0] - 16, y: it.c[1] - 16, w: 32, d: 32, r: 3 };
        out.push(S(k.slabOf(tray, 0, 4, P, 4, 0.6), { tone: "mid" }));
        out.push(L(k.planOutline(k.insetPlan(tray, 3), 4, P), { tone: "faint" }));
        out.push(block(P, ...it.c, 4, it.key === "first_block" ? cur.a : cur.b, { w: 14, lit: it.key === "first_block" }));
      }
      for (const it of items) {
        const h = it.key === "first_block" ? cur.a : cur.b;
        const [x, y] = k.iso([...it.c, 4 + h], P);
        const raw = s[it.key];
        out.push(leader([x, y - 6], [x, y - 34]));
        out.push(text(x, y - 66, it.key, "lab muted"));
        out.push(text(x, y - 42, raw === undefined ? "(no box yet)" : "= " + show(raw), raw === undefined || !isNum(raw) ? "lab-big warn" : "lab-big"));
      }
      return out.join("");
    },
  };
}

// ---------- Lesson 2: block → dial ----------
function figMath() {
  const B = [0, 42];
  const D = [0, -30];
  const P = fitP([...k.boxCorners({ x: -40, y: -66, w: 80, d: 136 }, -6, 0), [0, 42, 50]]);
  return {
    target: (s) => ({ h: clampH(s.block), t: isNum(s.turns) ? Math.max(0, Math.min(s.turns, 3)) : 0 }),
    render(cur, s) {
      const out = [plate(P, { x: -40, y: -66, w: 80, d: 136, r: 6 })];
      const parts = [
        { at: B, draw: () => block(P, ...B, 0, cur.h, { lit: true }) },
        { at: D, draw: () => dial(P, ...D, 0, 28, cur.t) },
      ].sort((p, q) => k.depthOf([...p.at, 0], P) - k.depthOf([...q.at, 0], P));
      parts.forEach((p) => out.push(p.draw()));
      const bt = k.iso([...B, cur.h], P);
      const dt = k.iso([...D, 6], P);
      out.push(leader([bt[0], bt[1] - 6], [bt[0], bt[1] - 30]));
      out.push(text(bt[0], bt[1] - 62, "block", "lab muted"));
      out.push(text(bt[0], bt[1] - 38, isNum(s.block) ? `${s.block} tall` : show(s.block), "lab-big"));
      out.push(text((bt[0] + dt[0]) / 2, Math.min(bt[1], dt[1]) - 104, `÷ ${isNum(s.per_turn) ? s.per_turn : "?"}`, "lab-big accent"));
      out.push(leader([dt[0], dt[1] - 30], [dt[0], dt[1] - 64]));
      out.push(text(dt[0], dt[1] - 96, "needle", "lab muted"));
      out.push(text(dt[0], dt[1] - 72, isNum(s.turns) ? `${fmt(s.turns, 3)} turn` : "?", "lab-big"));
      return out.join("");
    },
  };
}

// ---------- Lessons 3 and 4: a row of blocks ----------
function figList(loop) {
  const GAP = 26;
  const MAX = 8;
  const half = ((MAX - 1) / 2) * GAP + 20;
  const P = fitP([...k.boxCorners({ x: -26, y: -half - 6, w: 52, d: half * 2 + 12 }, -6, 0), [0, half - 20, 48]], 24, 90);
  const ys = (n) => Array.from({ length: n }, (_, i) => ((n - 1) / 2) * GAP - i * GAP);
  return {
    target(s) {
      const list = Array.isArray(s.blocks) ? s.blocks.slice(0, MAX) : [];
      return { hs: list.map((v) => clampH(v)), ys: ys(list.length), span: list.length };
    },
    render(cur, s, view) {
      const out = [plate(P, { x: -26, y: -half - 6, w: 52, d: half * 2 + 12, r: 6 })];
      const n = cur.hs.length;
      if (n) {
        const top = Math.max(...cur.ys) + 14;
        const bottom = Math.min(...cur.ys) - 14;
        const car = { x: -14, y: bottom, w: 28, d: Math.max(8, top - bottom), r: 3 };
        out.push(S(k.slabOf(car, 0, 4, P, 5, 0.6), { tone: "mid" }));
      }
      const order = cur.hs.map((_, i) => i).sort((a, b) => k.depthOf([0, cur.ys[a], 0], P) - k.depthOf([0, cur.ys[b], 0], P));
      for (const i of order) out.push(block(P, 0, cur.ys[i], 4, cur.hs[i], { lit: loop ? view.pass === i : i === 0 }));
      const list = Array.isArray(s.blocks) ? s.blocks : [];
      cur.hs.forEach((h, i) => {
        const [x, y] = k.iso([0, cur.ys[i], 4 + h], P);
        if (loop) {
          if (view.pass === i) {
            out.push(leader([x, y - 6], [x, y - 26], "leader accent-line"));
            out.push(text(x, y - 56, `pass ${i + 1}`, "lab muted"));
            out.push(text(x, y - 34, `height = ${show(list[i])}`, "lab-big accent"));
          } else if (view.pass > i) {
            out.push(text(x, y - 14, "✓", "lab good"));
          }
        } else {
          out.push(text(x, y - 56, `[${i}]`, i === 0 ? "lab-big bad" : "lab-big"));
          out.push(text(x, y - 34, show(list[i]), "lab"));
          const base = k.iso([14, cur.ys[i], 4], P);
          out.push(text(base[0] + 4, base[1] + 26, `block ${i + 1}`, "lab-small muted"));
        }
      });
      if (!n) out.push(text(VIEW_W / 2, 60, Array.isArray(s.blocks) ? "the list is empty" : "run the code to load the list", "lab muted"));
      if (Array.isArray(s.blocks) && s.blocks.length > MAX) out.push(text(VIEW_W / 2, VIEW_H - 18, `showing the first ${MAX} of ${s.blocks.length}`, "lab-small muted"));
      return out.join("");
    },
  };
}

// ---------- Lessons 5 and 7: the gauge over a sliding carriage ----------
function figGauge(mode) {
  const STEP = 30;
  const G = 50;
  const MAX = 5;
  const DZ = 60;
  const POST = [-36, G];
  const plateP = { x: -48, y: G - STEP * (MAX - 1) - 26, w: 92, d: STEP * (MAX - 1) * 2 + 52, r: 6 };
  const P = fitP([...k.boxCorners(plateP, -6, 0), [POST[0], POST[1], 82], [0, G + 26, DZ + 6]], 26, 40);
  const offsetFor = (list, choice) => (isNum(choice) && choice >= 1 && choice <= list.length ? STEP * (choice - 1) : -STEP * 0.62);
  return {
    target(s, view) {
      const list = (mode === "if" ? s.blocks : s.BLOCKS) || [];
      const hs = (Array.isArray(list) ? list : []).slice(0, MAX).map((v) => clampH(v, 40));
      const choice = mode === "if" ? s.choice : view.selected;
      const off = offsetFor(hs, choice);
      const valid = isNum(choice) && choice >= 1 && choice <= hs.length;
      const tip = valid ? hs[choice - 1] : 0;
      const turns = mode === "if" ? tip / 20 : isNum(view.turns) ? view.turns : 0;
      return { hs, off, tip, t: Math.max(0, Math.min(turns, 3)) };
    },
    render(cur, s, view) {
      const out = [plate(P, plateP)];
      for (const x of [-10, 6]) out.push(S(k.slabOf({ x, y: plateP.y + 10, w: 4, d: plateP.d - 20, r: 1 }, 0, 2, P, 3, 0.3), { tone: "mid" }));
      // post (behind the carriage)
      out.push(S(k.slabOf({ x: POST[0] - 10, y: POST[1] - 10, w: 20, d: 20, r: 2 }, 0, 10, P, 4, 0.6), { tone: "mid" }));
      out.push(S(k.cylinder(...POST, 2.8, 10, DZ + 10, P, 24), { tone: "mid", crease: "none" }));
      // carriage and blocks
      const n = cur.hs.length;
      const ys = cur.hs.map((_, i) => G - STEP * i + cur.off);
      const car = { x: -14, y: (n ? ys[n - 1] : G) - 14, w: 28, d: (n ? ys[0] - ys[n - 1] : 0) + 28, r: 3 };
      out.push(S(k.slabOf(car, 2, 4, P, 5, 0.6), { tone: "mid" }));
      const order = cur.hs.map((_, i) => i).sort((a, b) => k.depthOf([0, ys[a], 0], P) - k.depthOf([0, ys[b], 0], P));
      for (const i of order) out.push(block(P, 0, ys[i], 6, cur.hs[i], { lit: Math.abs(ys[i] - G) < 4 }));
      // plunger, arm, dial
      const tipZ = 6 + cur.tip;
      out.push(S(k.cylinder(0, G, 2.4, tipZ, 2, P, 20), { tone: "hi", lit: true }));
      out.push(S(k.cylinder(0, G, 1.3, tipZ + 2, DZ - tipZ - 2, P, 16), { tone: "hi", crease: "none", lit: true }));
      out.push(S(k.slabOf({ x: POST[0] + 3, y: G - 3, w: -POST[0] - 26 + 2, d: 6, r: 1.5 }, DZ + 1, 4, P, 3, 0.4), { tone: "mid" }));
      out.push(dial(P, 0, G, DZ, 24, cur.t));
      // labels
      const d = k.iso([0, G, DZ + 6], P);
      const textNow = mode === "if" ? gaugeText(s.blocks, s.choice) : view.readoutText || "press a button";
      const bad = /between/.test(textNow);
      out.push(leader([d[0] - 20, d[1] - 6], [150, 52]));
      out.push(text(16, 26, mode === "if" ? `choice = ${show(s.choice)}` : `readout(${view.selected ?? "?"})`, "lab muted", "start"));
      out.push(text(16, 50, textNow, bad ? "lab-big bad" : "lab-big good", "start"));
      if (bad) {
        const g = k.iso([0, G, 6], P);
        out.push(`<circle class="pin-bad" cx="${f1(g[0])}" cy="${f1(g[1])}" r="5"/>`);
      }
      cur.hs.forEach((h, i) => {
        const base = k.iso([14, ys[i], 6], P);
        out.push(text(base[0] + 6, base[1] + 24, String(i + 1), "lab-small muted"));
      });
      return out.join("");
    },
  };
}

// ---------- Lesson 6: a function is a machine ----------
function figFunction() {
  const box = { x: -24, y: -26, w: 48, d: 52, r: 4 };
  const DIAL = [0, -80];
  const P = fitP([...k.boxCorners({ x: -40, y: -112, w: 80, d: 200 }, -6, 0), [0, 0, 40]], 26, 120);
  return {
    target: (s, view) => ({ t: isNum(view.deg) ? Math.max(0, Math.min(view.deg / 360, 3)) : 0, tok: view.input === undefined ? 0 : 1 }),
    render(cur, s, view) {
      const out = [plate(P, { x: -40, y: -112, w: 80, d: 200, r: 6 })];
      out.push(dial(P, ...DIAL, 0, 22, cur.t));
      out.push(S(k.slabOf(box, 0, 30, P, 6, 1), { tone: "hi", crease: "lo" }));
      out.push(L(k.planOutline(k.insetPlan(box, 4), 30, P), { tone: "faint" }));
      out.push(k.faceTextSvg(k.topMatrix([0, 0], 30, P, "y"), "def", { size: 6, tone: "hi", anchor: "middle" }));
      out.push(S(k.slabOf({ x: -10, y: box.y + box.d - 1, w: 20, d: 4, r: 1 }, 10, 10, P, 2), { tone: "mid" }));
      if (view.input !== undefined) {
        out.push(S(k.cylinder(0, 62, 9, 0, 6, P, 40, 0.6), { tone: "hi", crease: "lo", lit: true }));
        out.push(k.faceTextSvg(k.topMatrix([0, 62], 6, P, "y"), String(view.input), { size: 9, tone: "hi", anchor: "middle" }));
      }
      const tok = k.iso([0, 62, 6], P);
      const inl = k.iso([0, 28, 20], P);
      const outl = k.iso([0, -28, 14], P);
      const dl = k.iso([...DIAL, 6], P);
      out.push(`<path class="flow" d="M${f1(tok[0] - 6)} ${f1(tok[1] - 14)}Q${f1((tok[0] + inl[0]) / 2 - 10)} ${f1(inl[1] - 40)} ${f1(inl[0] - 10)} ${f1(inl[1] - 8)}"/>`);
      out.push(`<path class="flow" d="M${f1(outl[0] + 6)} ${f1(outl[1] - 4)}Q${f1((outl[0] + dl[0]) / 2 + 10)} ${f1(dl[1] - 50)} ${f1(dl[0] + 4)} ${f1(dl[1] - 16)}"/>`);
      out.push(text(tok[0] - 30, tok[1] + 6, "input", "lab muted", "end"));
      out.push(text(tok[0] - 30, tok[1] + 28, view.input === undefined ? "press a button" : `choice = ${view.input}`, "lab-big", "end"));
      const bt = k.iso([0, 0, 30], P);
      out.push(text(bt[0], bt[1] - 64, "your function runs inside", "lab muted"));
      out.push(text(VIEW_W - 16, 26, "readout() returns", "lab muted", "end"));
      out.push(text(VIEW_W - 16, 50, view.output === undefined ? "…" : view.output, /between|Error/.test(view.output || "") ? "lab-big bad" : "lab-big good", "end"));
      out.push(text(VIEW_W - 16, 82, "needle_degrees() returns", "lab muted", "end"));
      out.push(text(VIEW_W - 16, 106, view.degText === undefined ? "…" : view.degText, isNum(view.deg) && view.deg > 0 ? "lab-big accent" : "lab-big bad", "end"));
      return out.join("");
    },
  };
}
