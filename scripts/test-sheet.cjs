// Sheet motion + comments-capsule parity with the mobile site
// (CommentsDrawer/CommentInputCapsule): backdrop fades 200ms while the sheet
// springs up (damping 32, stiffness 320), both reverse together on close, no
// dim-before-sheet flash; the comments capsule floats with a fade gradient
// behind it instead of a welded border-top bar.
const fs = require("fs"),
  assert = require("assert/strict"),
  path = require("path"),
  root = path.resolve(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

const sheet = read("src/components/Sheet.tsx");

// Backdrop fade duration matches the site (0.2s) and is used both directions.
assert.match(sheet, /SHEET_BACKDROP_DURATION_MS = 200/, "backdrop fade 200ms");
assert.match(sheet, /damping: 32, stiffness: 320/, "spring matches site motion");
// Both values animate together in open and close (synced, no dim flash).
assert.equal(
  (sheet.match(/Animated\.parallel\(/g) || []).length,
  2,
  "backdrop+slide animate in parallel on open and close"
);
// Modal itself is animationType none so RN does not double-animate.
assert.match(sheet, /animationType="none"/, "Modal does not apply its own slide");
// Backdrop opacity matches the site's bg-black/40.
assert.match(sheet, /SHEET_BACKDROP_OPACITY = 0\.4/, "backdrop 40% black");
// Drag-down past 120px closes, like the site.
assert.match(sheet, /SHEET_CLOSE_DRAG_PX = 120/, "drag-to-close threshold");
// Closing unmounts only after the exit animation finishes.
assert.match(sheet, /finished\) setRendered\(false\)/, "unmount after exit animation");

const comments = read("src/components/social/CommentsSheet.tsx");
assert.match(comments, /from "\.\.\/Sheet"/, "comments sheet uses shared Sheet");
assert.match(comments, /heightFraction={0\.7}/, "70vh sheet like the site");
// Floating capsule with fade, not a border-top bar.
assert.match(comments, /LinearGradient/, "capsule fade gradient");
assert.match(comments, /CAPSULE_FADE_HEIGHT = 80/, "80px fade like the site");
assert.match(comments, /maxWidth: 448/, "max-w-md capsule like the site");
assert.ok(!/borderTopWidth/.test(comments), "no welded border-top send bar");
// List leaves room for content to scroll under the capsule.
assert.match(comments, /CAPSULE_FADE_HEIGHT \+ 64/, "list padding under capsule");

console.log("test-sheet: OK");
