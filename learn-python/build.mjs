// Builds one SVG lesson card per lesson, drawn with the repo's own iso kit.
// Run:  node learn-python/build.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 900;
const PAD = 28;
const ART = { x: PAD, w: W - PAD * 2, h: 360 };
const BLOCKS = [18, 14, 10];
const PER_TURN = 20;

const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);

const CARD_CSS = `
.iso{--anatomy-weight:1px}
.card{fill:var(--anatomy-page)}
.panel{fill:var(--anatomy-card);stroke:var(--anatomy-lo);stroke-width:1}
.plate-frame{fill:var(--anatomy-card);stroke:var(--anatomy-mid);stroke-width:1}
.t{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;fill:var(--anatomy-text)}
.m{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;fill:var(--anatomy-text)}
.strong{fill:var(--anatomy-strong)}
.muted{fill:var(--anatomy-muted)}
.green{fill:var(--anatomy-green)}
.red{fill:var(--anatomy-red)}
.blue{fill:var(--anatomy-blue)}
.kicker{font-size:12px;letter-spacing:.12em}
.title{font-size:30px;font-weight:650}
.sub{font-size:16px}
.corner{font-size:11px;letter-spacing:.08em}
.call{font-size:14px}
.call-big{font-size:22px;font-weight:600}
.code{font-size:15px}
.label{font-size:11px;letter-spacing:.12em}
.step-h{font-size:13px;font-weight:700;letter-spacing:.08em}
.step{font-size:14.5px}
.leader{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:2 3}
.arrow{fill:none;stroke:var(--anatomy-blue);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.arrow-head{fill:var(--anatomy-blue)}
.pin-ok{fill:var(--anatomy-green)}
.pin-no{fill:var(--anatomy-red)}
.badge{fill:var(--anatomy-strong)}
.badge-t{fill:var(--anatomy-card);font-size:13px;font-weight:700}
`;

// ---------- shared iso parts ----------

function fit(points, azimuth = 30) {
  return k.fitProjection(points, ART.w, ART.h - 70, { pad: 40, azimuth });
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

const blockPlan = (cx, cy, w = 16, d = 16) => ({ x: cx - w / 2, y: cy - d / 2, w, d, r: 1 });

function gaugeBlock(P, cx, cy, z, height, opts = {}) {
  const plan = blockPlan(cx, cy, opts.w, opts.d);
  return S(k.slabOf(plan, z, height, P, 3, 0.5), { tone: "hi", crease: "lo", lit: opts.lit }) +
    L(k.planOutline(k.insetPlan(plan, 2), z + height, P, 3), { tone: "faint" });
}

// Row of blocks along y (index 0 on the left of the screen).
const ROW = (i) => [0, 36 - 36 * i];
const CARRIAGE = { x: -16, y: -58, w: 32, d: 116, r: 3 };
const CAR_Z = 0;
const CAR_TOP = 5;

function carriage(P, extra = "") {
  const out = [];
  out.push(S(k.slabOf(CARRIAGE, CAR_Z, CAR_TOP - CAR_Z, P, 5, 0.6), { tone: "mid" }));
  out.push(L(k.lineOnTop([-11, CARRIAGE.y + 3], [-11, CARRIAGE.y + CARRIAGE.d - 3], CAR_TOP, P), { tone: "faint" }));
  out.push(extra);
  return out.join("");
}

function rowBlocks(P, heights = BLOCKS, lit = -1) {
  // draw far (smaller depth) first
  const order = heights.map((h, i) => i).sort((a, b) => k.depthOf([...ROW(a), 0], P) - k.depthOf([...ROW(b), 0], P));
  return order.map((i) => gaugeBlock(P, ...ROW(i), CAR_TOP, heights[i], { lit: i === lit })).join("");
}

// ---------- 2D annotation helpers ----------

function callout(P, point, dx, dy, lines, anchor = "middle") {
  const [x, y] = k.iso(point, P);
  const tx = x + dx;
  const ty = y + dy;
  const out = [`<path class="leader" d="M${x.toFixed(1)} ${y.toFixed(1)}L${tx.toFixed(1)} ${(ty + (dy < 0 ? 8 : -18)).toFixed(1)}"/>`];
  lines.forEach((line, n) => {
    const [text, cls = "call strong"] = Array.isArray(line) ? line : [line];
    out.push(`<text class="m ${cls}" x="${tx.toFixed(1)}" y="${(ty - (lines.length - 1 - n) * 20 * (dy < 0 ? 1 : -1) * (dy < 0 ? 1 : 0) + (dy < 0 ? 0 : n * 20)).toFixed(1)}" text-anchor="${anchor}">${esc(text)}</text>`);
  });
  return out.join("");
}

// Labels stacked upward from a point (for dy<0) — simpler explicit version.
function tag(x, y, lines, anchor = "middle") {
  return lines.map((line, n) => {
    const [text, cls = "call strong"] = Array.isArray(line) ? line : [line];
    return `<text class="m ${cls}" x="${x.toFixed(1)}" y="${(y + n * 20).toFixed(1)}" text-anchor="${anchor}">${esc(text)}</text>`;
  }).join("");
}

function leader(a, b) {
  return `<path class="leader" d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}"/>`;
}

function arrow(points, curve = 0) {
  const [a, b] = [points[0], points[points.length - 1]];
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2 - curve;
  const d = `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  const ang = Math.atan2(b[1] - my, b[0] - mx);
  const s = 8;
  const p1 = [b[0] - Math.cos(ang - 0.45) * s, b[1] - Math.sin(ang - 0.45) * s];
  const p2 = [b[0] - Math.cos(ang + 0.45) * s, b[1] - Math.sin(ang + 0.45) * s];
  return `<path class="arrow" d="${d}"/><path class="arrow-head" d="M${b[0].toFixed(1)} ${b[1].toFixed(1)}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z"/>`;
}

const top = (P, i, h) => k.iso([...ROW(i), CAR_TOP + h], P);

// ---------- dial ----------

function dialSvg(P, cx, cy, z, r, turn, h = 6) {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: cx - r, y: cy - r, w: r * 2, d: r * 2, r }, z, 0.1, P)}" style="filter:blur(5px)"/>`);
  out.push(S(k.cylinder(cx, cy, r, z, h, P, 64, 0.8), { tone: "hi", crease: "lo" }));
  const zt = z + h;
  out.push(L(k.knurl(cx, cy, r, zt - 2.4, zt, 84, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(cx, cy, r - 2, zt, P, 64), { tone: "lo" }));
  const ticks = k.radialTicks(cx, cy, r - 3, 40, 5, zt, [1.4, 3], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  // swept arc for the reading
  const pts = [];
  const steps = Math.max(2, Math.round(turn * 80));
  for (let s = 0; s <= steps; s++) {
    const a = (s / steps) * turn * Math.PI * 2;
    pts.push([cx - Math.cos(a) * (r * 0.55), cy + Math.sin(a) * (r * 0.55)]);
  }
  out.push(L(k.onTop(pts, zt + 0.1, P), { tone: "blue" }));
  const a = turn * Math.PI * 2;
  out.push(L(k.lineOnTop([cx + Math.cos(a) * 3, cy - Math.sin(a) * 3], [cx - Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4)], zt + 0.2, P), { tone: "red" }));
  out.push(L(k.lineOnTop([cx - (r - 1.5), cy], [cx - (r - 6), cy], zt + 0.2, P), { tone: "hi" }));
  out.push(L(k.ring(cx, cy, 1.4, zt + 0.2, P, 16), { tone: "hi" }));
  return out.join("");
}

// ---------- lessons ----------

const LESSONS = [];

LESSONS.push({
  n: 1, slug: "01-variables", minutes: 8, file: "01_print_and_variables.py",
  title: "A variable is a labelled box",
  sub: "You put a value in the box, then use the label to get it back.",
  plateTitle: "TWO LABELLED BOXES", readout: "first_block = 18 · per_turn = 20",
  art() {
    const items = [{ c: [0, 34], name: "first_block", v: 18 }, { c: [0, -34], name: "per_turn", v: 20 }];
    const P = fit([...k.boxCorners({ x: -36, y: -66, w: 72, d: 132 }, -6, 0), [0, 34, 34], [0, -34, 36]]);
    const out = [plate(P, { x: -36, y: -66, w: 72, d: 132, r: 6 })];
    const sorted = [...items].sort((a, b) => k.depthOf([...a.c, 0], P) - k.depthOf([...b.c, 0], P));
    for (const it of sorted) {
      const tray = { x: it.c[0] - 15, y: it.c[1] - 15, w: 30, d: 30, r: 3 };
      out.push(S(k.slabOf(tray, 0, 4, P, 4, 0.6), { tone: "mid" }));
      out.push(L(k.planOutline(k.insetPlan(tray, 3), 4, P), { tone: "faint" }));
      out.push(gaugeBlock(P, ...it.c, 4, it.v, { w: 14, d: 14, lit: it.v === 18 }));
    }
    for (const it of items) {
      const [x, y] = k.iso([...it.c, 4 + it.v], P);
      out.push(leader([x, y - 4], [x, y - 40]));
      out.push(tag(x, y - 74, [[it.name, "call muted"], [`= ${it.v}`, "call-big strong"]]));
    }
    return out.join("");
  },
  code: [
    "# make two boxes and put a number in each",
    "first_block = 18",
    "per_turn = 20",
    "",
    "print(first_block)",
    'print("One turn is", per_turn, "px")',
  ],
  output: ["18", "One turn is 20 px"],
  run: "Run the practice file. Two lines appear, one for each print().",
  change: "Change 18 to 25 and run it again.",
  win: "The output changed because the box changed. You're programming.",
  repo: "examples/dial-indicator/build.mjs line 28:  const PER_TURN = 20;",
});

LESSONS.push({
  n: 2, slug: "02-math", minutes: 8, file: "02_math.py",
  title: "Python does the math for you",
  sub: "The block's height decides how far the needle turns.",
  plateTitle: "HEIGHT → NEEDLE", readout: "18 / 20 = 0.9 turn = 324°",
  art() {
    const D = [0, -30];
    const B = [0, 40];
    const P = fit([...k.boxCorners({ x: -40, y: -66, w: 80, d: 132 }, -6, 0), [0, 40, 34]]);
    const out = [plate(P, { x: -40, y: -66, w: 80, d: 132, r: 6 })];
    const parts = [
      { at: B, draw: () => gaugeBlock(P, ...B, 0, 18, { lit: true }) },
      { at: D, draw: () => dialSvg(P, ...D, 0, 28, 18 / PER_TURN) },
    ].sort((a, b) => k.depthOf([...a.at, 0], P) - k.depthOf([...b.at, 0], P));
    parts.forEach((p) => out.push(p.draw()));
    const bt = k.iso([...B, 18], P);
    const dt = k.iso([...D, 6], P);
    out.push(leader([bt[0], bt[1] - 4], [bt[0], bt[1] - 34]));
    out.push(tag(bt[0], bt[1] - 64, [["block", "call muted"], ["18 tall", "call-big strong"]]));
    out.push(arrow([[bt[0] + 70, bt[1] - 50], [dt[0] - 60, dt[1] - 90]], 40));
    out.push(tag((bt[0] + dt[0]) / 2 + 5, Math.min(bt[1], dt[1]) - 118, [["÷ 20", "call-big blue"]]));
    out.push(leader([dt[0], dt[1] - 30], [dt[0], dt[1] - 80]));
    out.push(tag(dt[0], dt[1] - 110, [["needle", "call muted"], ["0.9 turn", "call-big strong"]]));
    return out.join("");
  },
  code: [
    "per_turn = 20",
    "block = 18",
    "",
    "turns = block / per_turn      # 0.9",
    "degrees = turns * 360        # 324.0",
    'print("needle at", degrees, "degrees")',
  ],
  output: ["needle at 324.0 degrees"],
  run: "Run it. Python works out 18 ÷ 20 and then × 360.",
  change: "Set block = 10. Guess the answer BEFORE you run it.",
  win: "You guessed about half a turn (180°) and you were right.",
  repo: "build.mjs line 179:  needleAt(BLOCKS[0] / PER_TURN) — the same division.",
});

LESSONS.push({
  n: 3, slug: "03-lists", minutes: 10, file: "03_lists.py",
  title: "A list holds many values in order",
  sub: "Python counts positions from 0. People count from 1.",
  plateTitle: "BLOCKS = [18, 14, 10]", readout: "block 1 is blocks[0], not blocks[1]",
  art() {
    const P = fit([...k.boxCorners({ x: -26, y: -68, w: 52, d: 136 }, -6, 0), [0, 36, 26]], 28);
    const out = [plate(P, { x: -26, y: -68, w: 52, d: 136, r: 6 }), carriage(P), rowBlocks(P, BLOCKS, 0)];
    BLOCKS.forEach((h, i) => {
      const t = top(P, i, h);
      out.push(leader([t[0], t[1] - 4], [t[0], t[1] - 26]));
      out.push(tag(t[0], t[1] - 76, [[`block ${i + 1}`, "call muted"], [`blocks[${i}]`, i === 0 ? "call strong red" : "call strong"], [`= ${h}`, "call strong"]]));
    });
    return out.join("");
  },
  code: [
    "blocks = [18, 14, 10]",
    "",
    "print(len(blocks))   # how many? 3",
    "print(blocks[0])     # first  -> 18",
    "print(blocks[2])     # last   -> 10",
    "print(blocks[3])     # error! no 4th block",
  ],
  output: ["3", "18", "10", "IndexError: list index out of range"],
  run: "Run it. The last line crashes on purpose.",
  change: "Read only the LAST line of the red error, then delete blocks[3].",
  win: "You caused an error, read it, and fixed it. That's the real job.",
  repo: "build.mjs line 35:  const BLOCKS = [18, 14, 10];  (copied exactly)",
});

LESSONS.push({
  n: 4, slug: "04-loops", minutes: 10, file: "04_loops.py",
  title: "A loop repeats work for every item",
  sub: "Write the steps once. Python visits each block in turn.",
  plateTitle: "for height in blocks", readout: "3 blocks → 3 passes",
  art() {
    const P = fit([...k.boxCorners({ x: -26, y: -68, w: 52, d: 136 }, -6, 0), [0, 36, 26]], 28);
    const out = [plate(P, { x: -26, y: -68, w: 52, d: 136, r: 6 }), carriage(P), rowBlocks(P)];
    const tops = BLOCKS.map((h, i) => top(P, i, h));
    for (let i = 0; i < 2; i++) {
      out.push(arrow([[tops[i][0] + 10, tops[i][1] - 12], [tops[i + 1][0] - 10, tops[i + 1][1] - 12]], 50));
    }
    BLOCKS.forEach((h, i) => {
      out.push(tag(tops[i][0], tops[i][1] - 74, [[`pass ${i + 1}`, "call muted"], [`height = ${h}`, "call strong"]]));
    });
    return out.join("");
  },
  code: [
    "blocks = [18, 14, 10]",
    "",
    "for height in blocks:",
    '    print(f"reads {height:.1f} px")',
    "",
    "# the 4 spaces mean: this line is INSIDE the loop",
  ],
  output: ["reads 18.0 px", "reads 14.0 px", "reads 10.0 px"],
  run: "Run it. One print() line, three lines of output.",
  change: "Add a 4th number to the list. Don't touch anything else.",
  win: "The output grew by itself. The loop did the copy-paste for you.",
  repo: "build.mjs line 122:  BLOCKS.forEach(...) — JavaScript's version of a for loop.",
});

LESSONS.push({
  n: 5, slug: "05-if-else", minutes: 10, file: "05_if_else.py",
  title: "if / else makes decisions",
  sub: "Is there a block under the gauge? Do one thing if yes, another if no.",
  plateTitle: "BLOCK OR NO BLOCK?", readout: "choice 2 → 14.0 px · choice 7 → between blocks",
  art() {
    const P = fit([...k.boxCorners({ x: -26, y: -106, w: 52, d: 178 }, -6, 0), [0, 36, 26]], 28);
    const out = [plate(P, { x: -26, y: -106, w: 52, d: 178, r: 6 }), carriage(P), rowBlocks(P, BLOCKS, 1)];
    const empty = blockPlan(0, -86);
    out.push(L(k.planOutline(empty, 0.1, P, 3), { tone: "red", dashed: true }));
    const t1 = top(P, 1, BLOCKS[1]);
    const e = k.iso([0, -86, 0], P);
    out.push(leader([t1[0], t1[1] - 4], [t1[0], t1[1] - 36]));
    out.push(`<circle class="pin-ok" cx="${t1[0].toFixed(1)}" cy="${(t1[1] - 42).toFixed(1)}" r="6"/>`);
    out.push(tag(t1[0], t1[1] - 92, [["choice = 2", "call muted"], ["block 2 · 14.0 px", "call strong green"]]));
    out.push(leader([e[0], e[1] - 4], [e[0], e[1] - 70]));
    out.push(`<circle class="pin-no" cx="${e[0].toFixed(1)}" cy="${(e[1] - 76).toFixed(1)}" r="6"/>`);
    out.push(tag(e[0], e[1] - 126, [["choice = 7", "call muted"], ["between blocks", "call strong red"]]));
    return out.join("");
  },
  code: [
    "blocks = [18, 14, 10]",
    "choice = 2",
    "",
    "if 1 <= choice <= len(blocks):",
    "    height = blocks[choice - 1]",
    '    print(f"block {choice} · reads {height:.1f} px")',
    "else:",
    '    print("between blocks")',
  ],
  output: ["block 2 · reads 14.0 px"],
  run: "Run it with choice = 2. You get the green answer.",
  change: "Try choice = 7, then 0, then 3.",
  win: "You can say out loud why 7 printed \"between blocks\".",
  repo: "build.mjs line 216:  index < 0 ? \"between blocks\" : \"block \" + (index + 1)",
});

LESSONS.push({
  n: 6, slug: "06-functions", minutes: 12, file: "06_functions.py",
  title: "A function is your own machine",
  sub: "Build it once with def. Feed it an input, and it returns an answer.",
  plateTitle: "def readout(choice)", readout: "readout(2) → \"block 2 · reads 14.0 px\"",
  art() {
    const box = { x: -24, y: -30, w: 48, d: 60, r: 4 };
    const P = fit([...k.boxCorners({ x: -40, y: -90, w: 80, d: 180 }, -6, 0), [0, 0, 40]], 28);
    const out = [plate(P, { x: -40, y: -90, w: 80, d: 180, r: 6 })];
    // input token (left, +y) is nearer the viewer than the box at this azimuth; output slip (right, -y) is farther.
    const slip = { x: -10, y: -72, w: 20, d: 26, r: 1.5 };
    out.push(S(k.slabOf(slip, 0, 1.2, P, 2), { tone: "hi", lit: true }));
    out.push(L([0, 1, 2].map((n) => k.lineOnTop([-6 + n * 5, slip.y + 4], [-6 + n * 5, slip.y + slip.d - 4], 1.3, P)).join(""), { tone: "lo" }));
    out.push(S(k.slabOf(box, 0, 30, P, 6, 1), { tone: "hi", crease: "lo" }));
    out.push(L(k.planOutline(k.insetPlan(box, 4), 30, P), { tone: "faint" }));
    out.push(k.faceTextSvg(k.topMatrix([0, 0], 30, P, "y"), "readout()", { size: 6, tone: "hi", anchor: "middle" }));
    const slot = { x: -10, y: box.y + box.d - 1, w: 20, d: 4, r: 1 };
    out.push(S(k.slabOf(slot, 10, 10, P, 2), { tone: "mid" }));
    out.push(S(k.cylinder(0, 64, 9, 0, 6, P, 40, 0.6), { tone: "hi", crease: "lo", lit: true }));
    out.push(k.faceTextSvg(k.topMatrix([0, 64], 6, P, "y"), "2", { size: 9, tone: "hi", anchor: "middle" }));
    const tok = k.iso([0, 64, 6], P);
    const inl = k.iso([0, 32, 20], P);
    const outl = k.iso([0, -32, 12], P);
    const sl = k.iso([0, -59, 1.2], P);
    out.push(arrow([[tok[0] - 8, tok[1] - 16], [inl[0] - 12, inl[1] - 10]], 30));
    out.push(arrow([[outl[0] + 4, outl[1] - 2], [sl[0] + 4, sl[1] - 12]], 22));
    out.push(tag(tok[0] - 34, tok[1] + 8, [["input", "call muted"], ["choice = 2", "call strong"]], "end"));
    const bt = k.iso([0, 0, 30], P);
    out.push(tag(bt[0], bt[1] - 70, [["the recipe runs inside", "call muted"]]));
    out.push(tag(sl[0] + 44, sl[1] - 40, [["return", "call muted"], ['"block 2 · reads 14.0 px"', "call strong green"]], "start"));
    return out.join("");
  },
  code: [
    "BLOCKS = [18, 14, 10]",
    "",
    "def readout(choice):",
    "    if 1 <= choice <= len(BLOCKS):",
    "        height = BLOCKS[choice - 1]",
    '        return f"block {choice} · reads {height:.1f} px"',
    '    return "between blocks"',
    "",
    "print(readout(2))",
    "print(readout(9))",
  ],
  output: ["block 2 · reads 14.0 px", "between blocks"],
  run: "Run it. def builds the machine; readout(2) switches it on.",
  change: "Write needle_degrees(choice) that returns BLOCKS[choice - 1] / 20 * 360.",
  win: "You built your own function and called it by name.",
  repo: "\"Every number comes from the same model.\" (README)",
});

LESSONS.push({
  n: 7, slug: "07-mini-project", minutes: 15, file: "07_mini_project.py",
  title: "Mini project: the gauge, in Python",
  sub: "Type a block number. Your program slides it under the needle and reads it.",
  plateTitle: "DIAL INDICATOR", readout: "block 1 · reads 18.0 px",
  art() {
    const POST = [-34, 30];
    const DIAL = [0, 30];
    const DZ = 50;
    const P = fit([...k.boxCorners({ x: -48, y: -60, w: 80, d: 120 }, -6, 0), [POST[0], POST[1], 76], [0, 30 + 26, DZ + 6]], 28);
    const out = [plate(P, { x: -48, y: -60, w: 80, d: 120, r: 6 })];
    // post and arm (farthest back: x < 0)
    out.push(S(k.slabOf({ x: POST[0] - 10, y: POST[1] - 10, w: 20, d: 20, r: 2 }, 0, 10, P, 4, 0.6), { tone: "mid" }));
    out.push(S(k.cylinder(...POST, 2.6, 10, 66, P, 24), { tone: "mid", crease: "none" }));
    out.push(S(k.slabOf({ x: POST[0] - 4, y: POST[1] - 4, w: 8, d: 8, r: 1.5 }, 60, 8, P, 3, 0.4), { tone: "mid" }));
    out.push(S(k.slabOf({ x: POST[0] + 4, y: POST[1] - 3, w: DIAL[0] - POST[0] - 26 - 4 + 2, d: 6, r: 1.5 }, 62, 4, P, 3, 0.4), { tone: "mid" }));
    out.push(carriage(P), rowBlocks(P, BLOCKS, 0));
    // plunger from dial down to block 0
    out.push(S(k.cylinder(...DIAL, 1.4, CAR_TOP + BLOCKS[0], DZ - CAR_TOP - BLOCKS[0], P, 16), { tone: "hi", crease: "none", lit: true }));
    out.push(S(k.slabOf({ x: -26 - 4, y: DIAL[1] - 3, w: 6, d: 6, r: 1.2 }, DZ + 1, 13, P, 3), { tone: "mid" }));
    out.push(dialSvg(P, ...DIAL, DZ, 26, BLOCKS[0] / PER_TURN));
    const t1 = top(P, 1, BLOCKS[1]);
    const t2 = top(P, 2, BLOCKS[2]);
    out.push(tag(t2[0] + 70, t2[1] - 40, [["type 1, 2 or 3", "call muted"], ["to pick a block", "call muted"]], "start"));
    const d = k.iso([...DIAL, DZ + 6], P);
    out.push(tag(d[0] - 150, d[1] - 40, [["the needle", "call muted"], ["reads 18.0 px", "call strong"]], "end"));
    out.push(leader([d[0] - 144, d[1] - 34], [d[0] - 40, d[1] - 10]));
    void t1;
    return out.join("");
  },
  code: [
    "while True:",
    '    typed = input("> ")',
    '    if typed == "q":',
    "        break",
    "    if not typed.isdigit():",
    '        print("Please type 1, 2, 3 or q")',
    "        continue",
    "    choice = int(typed)",
    "    print(readout(choice))",
    '    print("#" * BLOCKS[choice - 1])   # a bar 18 long',
  ],
  output: ["> 1", "block 1 · reads 18.0 px", "##################", "> 3", "block 3 · reads 10.0 px", "##########", "> q"],
  run: "Run the practice file. Type 1, 2 or 3 and press Enter. Type q to quit.",
  change: "Add a 4th block to BLOCKS. Does everything still work?",
  win: "You built an interactive program. Tick every box in PROGRESS.md.",
  repo: "examples/dial-indicator/dial-indicator.html does the same job.",
});

// ---------- card layout ----------

function wrap(text, max) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      lines.push(line.trim());
      line = w;
    } else line += " " + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function highlight(line) {
  const hash = line.indexOf("#");
  const quoteBefore = (line.slice(0, Math.max(hash, 0)).match(/"/g) || []).length % 2 === 1;
  if (hash >= 0 && !quoteBefore) {
    return `${esc(line.slice(0, hash))}<tspan class="muted">${esc(line.slice(hash))}</tspan>`;
  }
  return esc(line).replace(/\b(def|return|if|else|for|in|while|break|continue|not|and)\b/g, '<tspan class="blue">$1</tspan>');
}

function card(lesson) {
  const out = [];
  let y = PAD + 14;
  out.push(`<text class="m kicker muted" x="${PAD}" y="${y}">LESSON ${lesson.n} OF 7 · ABOUT ${lesson.minutes} MIN</text>`);
  y += 40;
  out.push(`<text class="t title strong" x="${PAD}" y="${y}">${esc(lesson.title)}</text>`);
  y += 28;
  out.push(`<text class="t sub" x="${PAD}" y="${y}">${esc(lesson.sub)}</text>`);
  y += 24;

  // illustration plate
  const py = y;
  out.push(`<rect class="plate-frame" x="${ART.x}" y="${py}" width="${ART.w}" height="${ART.h}"/>`);
  out.push(`<text class="m corner" x="${ART.x + 16}" y="${py + 24}">Fig ${lesson.n}</text>`);
  out.push(`<text class="m corner muted" x="${ART.x + ART.w - 16}" y="${py + 24}" text-anchor="end">${esc(lesson.plateTitle.toUpperCase())}</text>`);
  out.push(`<text class="m corner muted" x="${ART.x + 16}" y="${py + ART.h - 16}">FROM THE REPO'S DIAL INDICATOR</text>`);
  out.push(`<text class="m corner" x="${ART.x + ART.w - 16}" y="${py + ART.h - 16}" text-anchor="end">${esc(lesson.readout)}</text>`);
  out.push(`<g transform="translate(${ART.x} ${py + 50})">${lesson.art()}</g>`);
  y = py + ART.h + 22;

  // code + output panels side by side
  const codeW = 520;
  const outW = W - PAD * 2 - codeW - 16;
  const lineH = 22;
  const rows = Math.max(lesson.code.length, lesson.output.length);
  const panelH = 44 + rows * lineH + 10;
  out.push(`<rect class="panel" x="${PAD}" y="${y}" width="${codeW}" height="${panelH}" rx="6"/>`);
  out.push(`<text class="m label muted" x="${PAD + 16}" y="${y + 24}">THE CODE</text>`);
  lesson.code.forEach((line, i) => {
    out.push(`<text class="m code strong" x="${PAD + 16}" y="${y + 50 + i * lineH}" xml:space="preserve">${highlight(line)}</text>`);
  });
  const ox = PAD + codeW + 16;
  out.push(`<rect class="panel" x="${ox}" y="${y}" width="${outW}" height="${panelH}" rx="6"/>`);
  out.push(`<text class="m label muted" x="${ox + 16}" y="${y + 24}">WHAT YOU'LL SEE</text>`);
  lesson.output.forEach((line, i) => {
    const cls = line.startsWith("IndexError") ? "red" : line.startsWith(">") ? "blue" : "green";
    out.push(`<text class="m code ${cls}" x="${ox + 16}" y="${y + 50 + i * lineH}" xml:space="preserve">${esc(line.length > 34 ? line.slice(0, 33) + "…" : line)}</text>`);
  });
  y += panelH + 16;

  // three steps
  const steps = [["1  RUN IT", lesson.run], ["2  CHANGE ONE THING", lesson.change], ["3  WIN", lesson.win]];
  const colW = (W - PAD * 2 - 32) / 3;
  const wrapped = steps.map(([, body]) => wrap(body, 30));
  const stepH = 56 + Math.max(...wrapped.map((l) => l.length)) * 21;
  steps.forEach(([head], i) => {
    const x = PAD + i * (colW + 16);
    const cls = i === 2 ? "green" : i === 1 ? "blue" : "strong";
    out.push(`<rect class="panel" x="${x}" y="${y}" width="${colW}" height="${stepH}" rx="6"/>`);
    out.push(`<text class="t step-h ${cls}" x="${x + 16}" y="${y + 28}">${esc(head)}</text>`);
    wrapped[i].forEach((line, n) => out.push(`<text class="t step" x="${x + 16}" y="${y + 54 + n * 21}">${esc(line)}</text>`));
  });
  y += stepH + 22;

  out.push(`<text class="m call muted" x="${PAD}" y="${y}">Practice file: learn-python/${esc(lesson.file)}</text>`);
  y += 20;
  out.push(`<text class="m call muted" x="${PAD}" y="${y}">In the repo → ${esc(lesson.repo)}</text>`);
  y += PAD;

  const H = Math.round(y);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="iso" data-theme="light" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Lesson ${lesson.n}: ${esc(lesson.title)}"><style>${k.ISO_CSS}${CARD_CSS}</style><rect class="card" width="${W}" height="${H}"/>${out.join("")}</svg>\n`;
}

for (const lesson of LESSONS) {
  writeFileSync(join(HERE, `${lesson.slug}.svg`), card(lesson));
  console.log(`wrote learn-python/${lesson.slug}.svg`);
}
