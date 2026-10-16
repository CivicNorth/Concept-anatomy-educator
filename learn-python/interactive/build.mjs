// Builds Python Bench, the interactive lesson page.
//   node learn-python/interactive/build.mjs            -> learn-python/python-bench.html (open in a browser)
//   node learn-python/interactive/build.mjs --body OUT -> page body only, for publishing as an Artifact
//   add --local-skulpt DIR to load Skulpt from a local folder (for offline testing)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ISO_CSS } from "../../kit/iso-kit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : null;
};
const read = (f) => readFileSync(join(HERE, f), "utf8");

const KIT_NAMES = ["iso", "depthOf", "fitProjection", "slabOf", "cylinder", "haloOf", "planOutline", "insetPlan", "corners", "boxCorners", "ring", "dotsSvg", "solidSvg", "lineSvg", "knurl", "radialTicks", "onTop", "lineOnTop", "faceTextSvg", "topMatrix"];
const kit = `const k = (() => {\n${kitScript()}\nreturn { ${KIT_NAMES.join(", ")} };\n})();`;

const skulptBase = arg("--local-skulpt") || "https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist";
const app = [kit, read("lessons.js"), read("figures.js"), read("app.js")].join("\n\n").replace(/<\/(script)/gi, "<\\/$1");

const body = `<title>Python Bench</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>${ISO_CSS}
${read("style.css")}</style>
<div class="wrap">
  <header class="top">
    <div class="brand"><b>Python Bench</b><span>Learn Python on the repo's dial indicator</span></div>
    <nav class="track" aria-label="Lessons">
      <div class="chips" id="chips"></div>
      <div class="meter"><span id="progress-text">0 of 7 done</span><div class="bar" id="progress-bar"><i></i></div></div>
    </nav>
  </header>

  <section class="head">
    <p class="eyebrow" id="eyebrow"></p>
    <h1 id="title"></h1>
    <p class="idea" id="idea"></p>
  </section>

  <section class="bench">
    <figure class="fig iso" id="fig">
      <div class="iso-plate">
        <div class="iso-plate-corners" aria-hidden="true">
          <span class="iso-plate-corner" data-corner="fig" id="corner-fig"></span>
          <span class="iso-plate-corner" data-corner="title" id="corner-title"></span>
          <span class="iso-plate-corner" data-corner="hint" id="corner-hint"></span>
          <span class="iso-plate-corner" data-corner="readout" id="corner-readout"></span>
        </div>
        <div class="stage" id="stage" tabindex="0"></div>
      </div>
      <div class="controls" id="controls"></div>
    </figure>

    <div class="work">
      <p class="py-status" id="py-status" hidden>Python couldn't load, so the Run button won't work. Check your connection and reload.</p>
      <div class="editor">
        <div class="bar-row"><span class="tag">Your code</span><button class="link" id="reset" type="button">Reset to the start</button></div>
        <label class="tag" for="code" hidden>Python code</label>
        <textarea id="code" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Python code"></textarea>
        <div class="run-row"><button class="primary" id="run" type="button">Run ▸</button><span class="kbd">or Ctrl + Enter · Tab adds 4 spaces</span></div>
      </div>
      <div class="console" aria-live="polite">
        <div class="bar-row"><span class="tag">What Python printed</span></div>
        <pre id="out"></pre>
        <div class="err" id="err" hidden><code id="err-type"></code><p id="err-help"></p></div>
      </div>
    </div>
  </section>

  <section class="mission" aria-label="Your mission">
    <ol class="steps">
      <li id="s-run" data-n="1"><b>Run it</b><p>Press Run and watch the machine and the output.</p></li>
      <li id="s-change" data-n="2"><b>Change one thing</b><p id="challenge"></p></li>
      <li id="s-win" data-n="3"><b>Win</b><p id="win-text" hidden></p></li>
    </ol>
    <details id="hint-box"><summary>Stuck? Show a hint</summary><p id="hint"></p><button class="ghost" id="answer" type="button">Put the answer in the editor</button></details>
    <div class="foot">
      <p class="repo">In the repo → <span id="repo"></span></p>
      <div class="nav"><button id="prev" type="button">← Back</button><button id="next" type="button">Next lesson →</button></div>
    </div>
  </section>
</div>
<script src="${skulptBase}/skulpt.min.js"></script>
<script src="${skulptBase}/skulpt-stdlib.js"></script>
<script>
${app}
</script>
`;

const bodyOut = arg("--body");
if (bodyOut) {
  writeFileSync(bodyOut, body);
  console.log("wrote " + bodyOut);
} else {
  const file = join(HERE, "..", "python-bench.html");
  writeFileSync(file, `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>\n${body}</body></html>\n`);
  console.log("wrote learn-python/python-bench.html");
}
