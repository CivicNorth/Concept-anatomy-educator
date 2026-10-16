// Python Bench: runs your Python in the page (Skulpt) and lets it drive the machine.

const $ = (id) => document.getElementById(id);
const STORE = "python-bench-v1";
const still = matchMedia("(prefers-reduced-motion: reduce)");

let progress = { done: {}, code: {}, at: 0 };
try {
  const saved = JSON.parse(localStorage.getItem(STORE) || "null");
  if (saved && typeof saved === "object") progress = { ...progress, ...saved };
} catch {}
const save = () => {
  try {
    localStorage.setItem(STORE, JSON.stringify(progress));
  } catch {}
};

// ---------- Python ----------
const pyReady = typeof Sk !== "undefined";
if (pyReady) {
  Sk.configure({
    output: (t) => (runOut += t),
    read: (f) => {
      if (!Sk.builtinFiles || !Sk.builtinFiles.files[f]) throw new Error("File not found: " + f);
      return Sk.builtinFiles.files[f];
    },
    __future__: Sk.python3,
    inputfun: () => "",
    inputfunTakesPrompt: true,
    yieldLimit: 50,
  });
}
let runOut = "";

async function runPython(code) {
  runOut = "";
  Sk.execLimit = 4000;
  try {
    const mod = await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, code, true));
    return { ok: true, out: runOut, mod };
  } catch (e) {
    return { ok: false, out: runOut, err: String(e && e.toString ? e.toString() : e) };
  }
}

function globalsOf(mod) {
  const g = {};
  for (const [name, value] of Object.entries(mod.$d)) {
    if (name.startsWith("__")) continue;
    if (value instanceof Sk.builtin.func) {
      g[name] = { fn: true };
      continue;
    }
    try {
      g[name] = Sk.ffi.remapToJs(value);
    } catch {}
  }
  return g;
}

async function callPython(mod, name, arg) {
  const fn = mod && mod.$d[name];
  if (!fn) throw new Error(`NameError: name '${name}' is not defined`);
  Sk.execLimit = 2000;
  Sk.execStart = Date.now();
  const result = await Sk.misceval.asyncToPromise(() => Sk.misceval.callsimOrSuspendArray(fn, [Sk.ffi.remapToPy(arg)]));
  return Sk.ffi.remapToJs(result);
}

// Plain-English versions of Python's error messages.
function explain(raw) {
  const line = (raw.match(/on line (\d+)/) || [])[1];
  const type = (raw.match(/^(\w+Error|\w+Exception)/) || [])[1] || "Error";
  const where = line ? ` on line ${line}` : "";
  const name = (raw.match(/name '([^']+)'/) || [])[1];
  const tips = {
    NameError: `Python doesn't know the name ${name ? `"${name}"` : "you used"}${where}. Check the spelling (capitals count) and make sure the line that creates it comes first.`,
    IndexError: `You asked for a position the list doesn't have${where}. Positions start at 0, so the last one is len(list) - 1.`,
    SyntaxError: `Python couldn't read line ${line || "?"}. Look for a missing colon :, a bracket or quote that isn't closed, or a typo.`,
    ParseError: `Python couldn't read line ${line || "?"}. Look for a missing colon :, a bracket or quote that isn't closed, or a typo.`,
    IndentationError: `The spaces at the start of line ${line || "?"} don't line up. Lines inside an if, for or def need 4 spaces in front.`,
    TypeError: `Two kinds of value that don't fit together met${where}, like text + a number. Check what each variable holds.`,
    ZeroDivisionError: `Something was divided by zero${where}.`,
    TimeoutError: "The code ran for too long and was stopped. A while loop that never ends is the usual cause.",
    ValueError: `A value had the right type but the wrong content${where}, like int("abc").`,
  };
  return { type, line, text: tips[type] || `Python stopped${where}. Read the message above for the reason.` };
}

// ---------- page state ----------
let index = Math.min(Math.max(0, progress.at | 0), LESSONS.length - 1);
let lesson, fig, mod, state, out, view, cur, tgt, frame, loopTimer, ran, won;

function setTheme() {
  const root = document.documentElement.dataset.theme;
  const dark = root ? root === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  $("fig").dataset.theme = dark ? "dark" : "light";
}
setTheme();
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", setTheme);
new MutationObserver(setTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

function buildNav() {
  $("chips").innerHTML = LESSONS.map(
    (l, i) => `<button class="chip" type="button" data-i="${i}" aria-label="Lesson ${i + 1}: ${l.title}">${progress.done[l.id] ? "✓" : i + 1}</button>`,
  ).join("");
  $("chips").querySelectorAll(".chip").forEach((b) => {
    const i = Number(b.dataset.i);
    b.classList.toggle("done", !!progress.done[LESSONS[i].id]);
    if (i === index) b.setAttribute("aria-current", "step");
    b.addEventListener("click", () => open(i));
  });
  const count = LESSONS.filter((l) => progress.done[l.id]).length;
  $("progress-text").textContent = `${count} of ${LESSONS.length} done`;
  $("progress-bar").style.setProperty("--p", count / LESSONS.length);
}

function open(i) {
  index = i;
  progress.at = i;
  save();
  lesson = LESSONS[i];
  fig = lesson.figure();
  mod = null;
  state = {};
  out = "";
  view = { pass: -1 };
  ran = false;
  won = !!progress.done[lesson.id];
  clearInterval(loopTimer);
  $("eyebrow").textContent = `Lesson ${i + 1} of ${LESSONS.length} · about ${lesson.minutes} min`;
  $("title").textContent = lesson.title;
  $("idea").textContent = lesson.idea;
  $("challenge").textContent = lesson.challenge;
  $("hint").textContent = lesson.hint;
  $("win-text").textContent = lesson.win;
  $("repo").textContent = lesson.repo;
  $("corner-fig").textContent = `Fig ${i + 1}`;
  $("corner-title").textContent = lesson.plateTitle;
  $("corner-hint").textContent = lesson.hintCorner;
  $("code").value = progress.code[lesson.id] ?? lesson.code;
  $("hint-box").open = false;
  $("prev").disabled = i === 0;
  $("next").textContent = i === LESSONS.length - 1 ? "Back to lesson 1" : "Next lesson →";
  showOutput("", null);
  buildControls();
  buildNav();
  steps();
  cur = null;
  run({ quiet: true });
  window.scrollTo({ top: 0, behavior: still.matches ? "auto" : "smooth" });
}

function steps() {
  $("s-run").classList.toggle("done", ran || won);
  $("s-change").classList.toggle("done", won);
  $("s-win").classList.toggle("done", won);
  $("win-text").hidden = !won;
  $("next").classList.toggle("ready", won);
}

function showOutput(text, error) {
  $("out").textContent = text || (error ? "" : "(nothing printed yet)");
  $("out").classList.toggle("empty", !text);
  const box = $("err");
  if (error) {
    const e = explain(error);
    box.hidden = false;
    $("err-type").textContent = error.replace(/\s+on line \d+.*$/, "");
    $("err-help").textContent = e.text;
  } else {
    box.hidden = true;
  }
}

async function run({ quiet = false } = {}) {
  if (!pyReady) {
    showOutput("", "Error: Python didn't load. Check your connection and reload the page.");
    return;
  }
  const code = $("code").value;
  $("run").disabled = true;
  const result = await runPython(code);
  $("run").disabled = false;
  out = result.out;
  if (!result.ok) {
    showOutput(out, result.err);
    draw();
    return;
  }
  mod = result.mod;
  state = lesson.read(globalsOf(mod));
  if (!quiet) ran = true;
  await afterRun();
  if (lesson.id === "loops") playLoop();
  else showOutput(out, null);
  if (!quiet) await judge();
  steps();
  draw();
}

async function judge() {
  if (won) return;
  let ok = false;
  try {
    ok = await lesson.check(state, out, (name, arg) => callPython(mod, name, arg), view);
  } catch {
    ok = false;
  }
  if (ok) {
    won = true;
    progress.done[lesson.id] = true;
    save();
    buildNav();
    steps();
    $("s-win").scrollIntoView({ block: "nearest", behavior: still.matches ? "auto" : "smooth" });
  }
}

// Lesson-specific work after each run (calling the user's functions, etc.)
async function afterRun() {
  if (lesson.id === "functions") {
    if (view.input !== undefined) await feed(view.input);
  }
  if (lesson.id === "project") {
    const n = Array.isArray(state.BLOCKS) ? Math.min(state.BLOCKS.length, 5) : 0;
    if (!view.selected || view.selected > n) view.selected = n ? 1 : undefined;
    buildControls();
    if (view.selected) await select(view.selected, false);
  }
}

function playLoop() {
  clearInterval(loopTimer);
  const lines = out.split("\n").filter((l, i, all) => l || i < all.length - 1);
  const n = Array.isArray(state.blocks) ? state.blocks.length : 0;
  if (still.matches || !n) {
    view.pass = n;
    showOutput(out, null);
    draw();
    return;
  }
  view.pass = 0;
  showOutput(lines.slice(0, 1).join("\n"), null);
  draw();
  loopTimer = setInterval(() => {
    view.pass += 1;
    showOutput(lines.slice(0, view.pass + 1).join("\n"), null);
    if (view.pass >= n) {
      clearInterval(loopTimer);
      showOutput(out, null);
    }
    draw();
  }, 750);
}

async function feed(n) {
  view.input = n;
  try {
    view.output = String(await callPython(mod, "readout", n));
  } catch (e) {
    view.output = explain(String(e)).type;
  }
  try {
    const d = await callPython(mod, "needle_degrees", n);
    view.deg = typeof d === "number" ? d : NaN;
    view.degText = typeof d === "number" ? `${Math.round(d * 10) / 10}°` : show(d);
  } catch (e) {
    view.deg = NaN;
    view.degText = explain(String(e)).type;
    showOutput(out + `\nneedle_degrees(${n}) stopped:\n`, String(e));
  }
  draw();
}

async function select(n, judgeIt = true) {
  view.selected = n;
  try {
    view.readoutText = String(await callPython(mod, "readout", n));
  } catch (e) {
    view.readoutText = explain(String(e)).type;
    showOutput(out, String(e));
  }
  try {
    view.turns = await callPython(mod, "needle_turns", n);
  } catch (e) {
    view.turns = 0;
    showOutput(out, String(e));
  }
  $("controls").querySelectorAll("button[data-sel]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.sel) === n)));
  if (judgeIt) {
    await judge();
    steps();
  }
  draw();
}

function setVar(name, value) {
  const re = new RegExp(`^(${name}\\s*=\\s*)([^#\\n]*?)(\\s*#.*)?$`, "m");
  const code = $("code").value;
  if (!re.test(code)) return false;
  $("code").value = code.replace(re, (_, a, __, c) => `${a}${value}${c || ""}`);
  progress.code[lesson.id] = $("code").value;
  save();
  return true;
}

function buildControls() {
  const c = $("controls");
  const btn = (label, attrs = "") => `<button class="ctl" type="button" ${attrs}>${label}</button>`;
  if (lesson.id === "variables") {
    c.innerHTML = `<span class="ctl-label">Try it from here:</span>${btn("first_block − 4", 'data-d="-4"')}${btn("first_block + 4", 'data-d="4"')}`;
    c.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        const now = isNum(state.first_block) ? state.first_block : 18;
        if (setVar("first_block", Math.max(0, now + Number(b.dataset.d)))) run();
      }),
    );
  } else if (lesson.id === "if-else") {
    c.innerHTML = `<span class="ctl-label">Set choice:</span>${[1, 2, 3, 0, 7].map((n) => btn(String(n), `data-n="${n}"`)).join("")}`;
    c.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => setVar("choice", b.dataset.n) && run()));
  } else if (lesson.id === "functions") {
    c.innerHTML = `<span class="ctl-label">Feed the machine:</span>${[1, 2, 3, 9].map((n) => btn(`readout(${n})`, `data-n="${n}"`)).join("")}`;
    c.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => feed(Number(b.dataset.n))));
  } else if (lesson.id === "project") {
    const n = Array.isArray(state.BLOCKS) ? Math.min(state.BLOCKS.length, 5) : 0;
    c.innerHTML = n
      ? `<span class="ctl-label">Slide block:</span>${Array.from({ length: n }, (_, i) => btn(String(i + 1), `data-sel="${i + 1}" aria-pressed="${view.selected === i + 1}"`)).join("")}`
      : `<span class="ctl-label">Run the code to load the blocks.</span>`;
    c.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.sel))));
  } else if (lesson.id === "loops") {
    c.innerHTML = `<span class="ctl-label">Watch again:</span>${btn("Replay the loop", 'id="replay"')}`;
    $("replay").addEventListener("click", playLoop);
  } else {
    c.innerHTML = `<span class="ctl-label">Change the code on the right, then press Run.</span>`;
  }
}

// ---------- drawing ----------
function draw() {
  tgt = fig.target(state, view);
  if (!cur || still.matches) cur = structuredClone(tgt);
  paint();
  if (!frame) {
    let last = 0;
    const tick = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now;
      const a = 1 - Math.exp(-dt / 0.16);
      for (const key of Object.keys(tgt)) cur[key] = easeValue(cur[key], tgt[key], a);
      paint();
      const done = Object.keys(tgt).every((key) => settled(cur[key], tgt[key]));
      frame = done ? 0 : requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
}

function paint() {
  $("stage").innerHTML = `<svg class="iso-svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" role="img" aria-label="${esc(lesson.title)}: ${esc(lesson.readout(state) || view.readoutText || "")}">${fig.render(cur, state, view)}</svg>`;
  const r = lesson.readout(state) || view.readoutText || view.output || "";
  $("corner-readout").textContent = r;
}

// ---------- wiring ----------
$("run").addEventListener("click", () => run());
$("reset").addEventListener("click", () => {
  $("code").value = lesson.code;
  delete progress.code[lesson.id];
  save();
  run({ quiet: true });
});
$("answer").addEventListener("click", () => {
  $("code").value = lesson.answer;
  progress.code[lesson.id] = lesson.answer;
  save();
  $("code").focus();
});
$("prev").addEventListener("click", () => index > 0 && open(index - 1));
$("next").addEventListener("click", () => open(index === LESSONS.length - 1 ? 0 : index + 1));

let saveTimer = 0;
$("code").addEventListener("input", () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    progress.code[lesson.id] = $("code").value;
    save();
  }, 300);
});
$("code").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    run();
    return;
  }
  if (e.key === "Tab" && !e.shiftKey) {
    e.preventDefault();
    const t = e.target;
    const s = t.selectionStart;
    t.setRangeText("    ", s, t.selectionEnd, "end");
    t.dispatchEvent(new Event("input"));
  }
});
$("stage").addEventListener("keydown", (e) => {
  if (lesson.id !== "project" || !Array.isArray(state.BLOCKS)) return;
  const n = Math.min(state.BLOCKS.length, 5);
  let to = null;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") to = Math.min(n, (view.selected || 1) + 1);
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = Math.max(1, (view.selected || 1) - 1);
  if (to === null) return;
  e.preventDefault();
  select(to);
});

if (!pyReady) $("py-status").hidden = false;
open(index);
