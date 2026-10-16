// Lesson content and the machine each lesson's code drives.
// Uses `k` (the repo's iso kit) and helpers from figures.js.

const LESSONS = [
  {
    id: "variables",
    minutes: 8,
    title: "A variable is a labelled box",
    idea: "You put a value in the box, then use the label to get it back. Each box below holds a block exactly as tall as its number.",
    code: `# A variable is a labelled box.
first_block = 18
per_turn = 20

print(first_block)
print("One turn is", per_turn, "px")
`,
    challenge: "Make the first block taller: change 18 to 30, then press Run.",
    hint: "Find the line first_block = 18 and change only the number.",
    answer: `first_block = 30
per_turn = 20

print(first_block)
print("One turn is", per_turn, "px")
`,
    win: "The block grew because the box changed. That's what a variable is.",
    repo: "examples/dial-indicator/build.mjs, line 28: const PER_TURN = 20;",
    plateTitle: "Two labelled boxes",
    hintCorner: "Edit the numbers, then Run",
    read: (g) => ({ first_block: g.first_block, per_turn: g.per_turn }),
    check: (s) => isNum(s.first_block) && s.first_block !== 18,
    readout: (s) => `first_block = ${show(s.first_block)} · per_turn = ${show(s.per_turn)}`,
    figure: () => figVariables(),
  },
  {
    id: "math",
    minutes: 8,
    title: "Python does the math",
    idea: "The block's height decides how far the needle turns. One full turn of the dial is 20 px of travel, so the needle turns by height ÷ 20.",
    code: `per_turn = 20      # one full needle turn = 20 px
block = 18         # the block under the gauge

turns = block / per_turn
degrees = turns * 360

print("turns:", turns)
print("degrees:", degrees)
`,
    challenge: "Make the needle point at exactly half a turn (180°). Change only one number.",
    hint: "Half of 20 is 10. Which variable holds the block's height?",
    answer: `per_turn = 20
block = 10

turns = block / per_turn
degrees = turns * 360

print("turns:", turns)
print("degrees:", degrees)
`,
    win: "You predicted the needle with math. The figure does the same calculation.",
    repo: "build.mjs, line 179: needleAt(BLOCKS[0] / PER_TURN), the same division.",
    plateTitle: "Height → needle",
    hintCorner: "Blue arc = how far it turned",
    read: (g) => ({ block: g.block, per_turn: g.per_turn, turns: g.turns, degrees: g.degrees }),
    check: (s) => isNum(s.turns) && Math.abs(s.turns - 0.5) < 1e-9,
    readout: (s) => (isNum(s.turns) ? `${fmt(s.turns, 2)} turn · ${fmt(s.degrees, 1)}°` : "no turns yet"),
    figure: () => figMath(),
  },
  {
    id: "lists",
    minutes: 10,
    title: "A list holds many values in order",
    idea: "Python counts positions from 0, people count from 1. So block 1 lives at blocks[0].",
    code: `blocks = [18, 14, 10]

print("how many:", len(blocks))
print("first:", blocks[0])
print("last:", blocks[2])
`,
    challenge: "Put 5 blocks on the carriage by adding two more numbers to the list.",
    hint: "Numbers in a list are separated by commas: [18, 14, 10, 8, 6]",
    answer: `blocks = [18, 14, 10, 8, 6]

print("how many:", len(blocks))
print("first:", blocks[0])
print("last:", blocks[4])
`,
    win: "Five blocks, positions 0 to 4. Try print(blocks[5]) to see what an IndexError looks like.",
    repo: "build.mjs, line 35: const BLOCKS = [18, 14, 10];",
    plateTitle: "blocks = [ … ]",
    hintCorner: "Red label = position 0",
    read: (g) => ({ blocks: g.blocks }),
    check: (s) => Array.isArray(s.blocks) && s.blocks.length === 5 && s.blocks.every(isNum),
    readout: (s) => (Array.isArray(s.blocks) ? `len(blocks) = ${s.blocks.length}` : "no list yet"),
    figure: () => figList(false),
  },
  {
    id: "loops",
    minutes: 10,
    title: "A loop repeats work for every item",
    idea: "Write the steps once. Python visits each block in turn, and the indented line runs on every pass.",
    code: `blocks = [18, 14, 10]

for height in blocks:
    print(f"reads {height:.1f} px")
`,
    challenge: "Add a 4th block to the list. Don't add any print lines; let the loop do the work.",
    hint: "Only the first line needs to change: add , 6 before the ].",
    answer: `blocks = [18, 14, 10, 6]

for height in blocks:
    print(f"reads {height:.1f} px")
`,
    win: "The output grew by itself. The loop did the copy-paste for you.",
    repo: "build.mjs, line 122: BLOCKS.forEach(...), JavaScript's version of a for loop.",
    plateTitle: "for height in blocks",
    hintCorner: "Watch each pass",
    read: (g) => ({ blocks: g.blocks }),
    check: (s, out) => Array.isArray(s.blocks) && s.blocks.length >= 4 && countLines(out, "reads") === s.blocks.length,
    readout: (s) => (Array.isArray(s.blocks) ? `${s.blocks.length} blocks → ${s.blocks.length} passes` : "no list yet"),
    figure: () => figList(true),
  },
  {
    id: "if-else",
    minutes: 10,
    title: "if / else makes decisions",
    idea: "Is there a block under the gauge? If yes, read it. If no, say so. The carriage slides to whatever choice you pick.",
    code: `blocks = [18, 14, 10]
choice = 2          # which block goes under the gauge

if 1 <= choice <= len(blocks):
    height = blocks[choice - 1]
    print(f"block {choice} · reads {height:.1f} px")
else:
    print("between blocks")
`,
    challenge: "Make Python take the else path: pick a choice that has no block.",
    hint: "There are only 3 blocks. What happens with choice = 7? Or 0?",
    answer: `blocks = [18, 14, 10]
choice = 7

if 1 <= choice <= len(blocks):
    height = blocks[choice - 1]
    print(f"block {choice} · reads {height:.1f} px")
else:
    print("between blocks")
`,
    win: "You steered the program down the other path. Every app is full of these forks.",
    repo: 'build.mjs, line 216: index < 0 ? "between blocks" : "block " + (index + 1)',
    plateTitle: "Block or no block?",
    hintCorner: "Change choice, then Run",
    read: (g) => ({ blocks: g.blocks, choice: g.choice }),
    check: (s, out) => /between blocks/.test(out),
    readout: (s) => gaugeText(s.blocks, s.choice),
    figure: () => figGauge("if"),
  },
  {
    id: "functions",
    minutes: 12,
    title: "A function is a machine you build",
    idea: "def builds the machine once. Feed it an input and it hands back an answer. Press the number buttons under the figure to feed your machine.",
    code: `BLOCKS = [18, 14, 10]

def readout(choice):
    if 1 <= choice <= len(BLOCKS):
        height = BLOCKS[choice - 1]
        return f"block {choice} · reads {height:.1f} px"
    return "between blocks"

print(readout(2))

# Your turn: make this machine return the needle angle.
def needle_degrees(choice):
    return 0
`,
    challenge: "Fix needle_degrees so it returns BLOCKS[choice - 1] / 20 * 360. The dial will follow.",
    hint: "Replace return 0 with the formula. Keep the 4 spaces in front of return.",
    answer: `BLOCKS = [18, 14, 10]

def readout(choice):
    if 1 <= choice <= len(BLOCKS):
        height = BLOCKS[choice - 1]
        return f"block {choice} · reads {height:.1f} px"
    return "between blocks"

print(readout(2))

def needle_degrees(choice):
    return BLOCKS[choice - 1] / 20 * 360
`,
    win: "You built your own function, and the figure is now calling your code.",
    repo: "The repo's rule: every number in a figure comes from one shared model. Functions make that possible.",
    plateTitle: "def readout(choice)",
    hintCorner: "Press 1, 2, 3 or 9 below",
    read: (g) => ({ BLOCKS: g.BLOCKS }),
    check: async (s, out, call) => (await call("needle_degrees", 1)) === 324 && (await call("needle_degrees", 3)) === 180,
    readout: () => "",
    figure: () => figFunction(),
  },
  {
    id: "project",
    minutes: 15,
    title: "Mini project: the dial indicator",
    idea: "Everything together. Your two functions run the gauge: readout() writes the label and needle_turns() turns the needle. Use the buttons or the arrow keys to slide the carriage.",
    code: `BLOCKS = [18, 14, 10]
PER_TURN = 20

def readout(choice):
    if 1 <= choice <= len(BLOCKS):
        height = BLOCKS[choice - 1]
        return f"block {choice} · reads {height:.1f} px"
    return "between blocks"

def needle_turns(choice):
    return BLOCKS[choice - 1] / PER_TURN
`,
    challenge: "Add a 4th block that is 6 tall, press Run, then slide block 4 under the gauge.",
    hint: "Change the first line to BLOCKS = [18, 14, 10, 6]. A 4th button appears after you run.",
    answer: `BLOCKS = [18, 14, 10, 6]
PER_TURN = 20

def readout(choice):
    if 1 <= choice <= len(BLOCKS):
        height = BLOCKS[choice - 1]
        return f"block {choice} · reads {height:.1f} px"
    return "between blocks"

def needle_turns(choice):
    return BLOCKS[choice - 1] / PER_TURN
`,
    win: "You rebuilt the repo's dial indicator, and your Python is running it. You can program.",
    repo: "Compare with the real figure: examples/dial-indicator/dial-indicator.html",
    plateTitle: "Dial indicator",
    hintCorner: "← → or the buttons",
    read: (g) => ({ BLOCKS: g.BLOCKS }),
    check: (s, out, call, view) => Array.isArray(s.BLOCKS) && s.BLOCKS.length === 4 && s.BLOCKS[3] === 6 && view.selected === 4,
    readout: () => "",
    figure: () => figGauge("project"),
  },
];

function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}
function fmt(v, d) {
  return isNum(v) ? (Math.round(v * 10 ** d) / 10 ** d).toString() : "?";
}
function show(v) {
  if (v === undefined) return "—";
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(show).join(", ") + "]";
  return String(v);
}
function countLines(out, word) {
  return out.split("\n").filter((line) => line.includes(word)).length;
}
function gaugeText(blocks, choice) {
  if (!Array.isArray(blocks) || !isNum(choice)) return "set blocks and choice";
  if (choice >= 1 && choice <= blocks.length && isNum(blocks[choice - 1])) return `block ${choice} · reads ${Number(blocks[choice - 1]).toFixed(1)} px`;
  return "between blocks";
}
