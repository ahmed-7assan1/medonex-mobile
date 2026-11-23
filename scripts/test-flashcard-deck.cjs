// Regression test for the fatal v1.0.6 flashcard crash:
// "TypeError: Cannot read property 'layout' of null" in LectureFlashcardPractice.
// Root cause: the onLayout handler read e.nativeEvent INSIDE the setArea
// updater. Fabric resets synthetic events after dispatch, and React may run a
// queued updater during a later render, so the deferred read hit a null
// nativeEvent. Native events must be read synchronously in the handler.
const fs = require("fs"),
  assert = require("assert/strict"),
  path = require("path"),
  root = path.resolve(__dirname, "..");

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.tsx?$/.test(e.name)) yield p;
  }
}

// Given the index of the "(" opening a setX( call, return the index where the
// first (updater) argument ends: the comma separating a second argument, or
// the closing paren of the call.
function firstArgEnd(src, open) {
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    const c = src[j];
    if (c === "(" || c === "{" || c === "[") depth++;
    else if (c === ")" || c === "}" || c === "]") {
      depth--;
      if (depth === 0) return j;
    } else if (depth === 1 && c === ",") return j;
  }
  return src.length;
}

const offenders = [];
for (const dir of ["src", "app"]) {
  for (const file of walk(path.join(root, dir))) {
    const src = fs.readFileSync(file, "utf8");
    const re = /\bset[A-Z]\w*\(\s*\([^()]*\)\s*=>/g;
    let m;
    while ((m = re.exec(src))) {
      const open = src.indexOf("(", m.index);
      const body = src.slice(open, firstArgEnd(src, open));
      if (body.includes("nativeEvent")) {
        const line = src.slice(0, m.index).split("\n").length;
        offenders.push(path.relative(root, file) + ":" + line);
      }
    }
  }
}
assert.deepEqual(
  offenders,
  [],
  "setState updater functions must not read synthetic-event fields " +
    "(nativeEvent is reset before deferred execution); hoist the read into " +
    "the event handler. Offenders: " +
    offenders.join(", ")
);

// The fixed flashcard deck handler reads the width synchronously, then the
// updater only closes over the extracted number.
const deck = fs.readFileSync(
  path.join(root, "src/components/lecture/LectureFlashcardSection.tsx"),
  "utf8"
);
const handlerStart = deck.indexOf('testID="flashcard-practice"');
assert.notEqual(handlerStart, -1, "flashcard-practice deck view missing");
const handler = deck.slice(handlerStart, handlerStart + 1200);
const hoist = handler.indexOf("const nextWidth = e.nativeEvent.layout.width;");
const update = handler.indexOf("setArea((old) => (old === nextWidth ? old : nextWidth));");
assert.notEqual(hoist, -1, "onLayout must extract layout.width before setState");
assert.notEqual(update, -1, "setArea updater must close over the extracted width");
assert.ok(hoist < update, "width must be read before setArea is called");

console.log(
  "PASS flashcard onLayout reads layout synchronously; no setState updater in src/ or app/ touches nativeEvent"
);
