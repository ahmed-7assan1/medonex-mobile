// Storage-growth guards: merge policy for adopting guest offline files, cache
// retention policy, and the wiring that runs them (cold-start janitor in
// app/_layout, guest-scope adoption after sign-in).
const fs = require("fs"),
  assert = require("assert/strict"),
  path = require("path"),
  root = path.resolve(__dirname, ".."),
  ts = require(root + "/node_modules/typescript");

function load(rel) {
  const value = { exports: {} };
  new Function(
    "exports",
    "module",
    ts.transpileModule(fs.readFileSync(path.join(root, rel), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText
  )(value.exports, value);
  return value.exports;
}

const { mergeOfflineRecords } = load("src/lib/offline-merge.ts");
// Incoming files keep theirs unless the id already exists locally.
let r = mergeOfflineRecords(
  [{ id: "a" }, { id: "b" }],
  [{ id: "c" }, { id: "a" }, { id: "d" }]
);
assert.deepEqual(r.merged.map((x) => x.id), ["c", "d", "a", "b"]);
assert.deepEqual(r.move.map((x) => x.id), ["c", "d"]);
assert.deepEqual(r.drop.map((x) => x.id), ["a"]);
// Empty sides are safe.
assert.deepEqual(mergeOfflineRecords([], [{ id: "x" }]).merged.length, 1);
assert.deepEqual(mergeOfflineRecords([{ id: "x" }], []).merged.length, 1);

const policy = load("src/lib/cache-policy.ts");
const NOW = 1_800_000_000_000; // fixed clock
// Lecture notes: only matching names, only older than 24h.
assert.equal(policy.isStaleLectureNote("lecture-notes-a1b2c3d4.pdf", NOW / 1000 - 90000, NOW), true);
assert.equal(policy.isStaleLectureNote("lecture-notes-a1b2c3d4.png", NOW / 1000 - 3600, NOW), false);
assert.equal(policy.isStaleLectureNote("other-file.pdf", NOW / 1000 - 90000, NOW), false);
assert.equal(policy.isStaleLectureNote("lecture-notes-a1b2c3d4.pdf", undefined, NOW), false);
// Session entries: stale after 1h, never when fresh or unknown.
assert.equal(policy.isStaleSessionEntry(NOW / 1000 - 3700, NOW), true);
assert.equal(policy.isStaleSessionEntry(NOW / 1000 - 60, NOW), false);
assert.equal(policy.isStaleSessionEntry(undefined, NOW), false);
// The janitor targets exactly the two unbounded session caches.
assert.deepEqual(policy.SESSION_DIRS, ["offline-share", "pdf-viewer"]);

// Wiring: janitor runs once at app start; offline downloads stay out of it.
const layout = fs.readFileSync(path.join(root, "app/_layout.tsx"), "utf8");
assert.ok(layout.includes("purgeStaleCaches"), "app/_layout must run the cache janitor at startup");
const janitor = fs.readFileSync(path.join(root, "src/lib/cache-janitor.ts"), "utf8");
assert.ok(!janitor.includes("documentDirectory"), "janitor must never touch user-chosen offline downloads");
assert.ok(janitor.includes("cacheDirectory"), "janitor must sweep the cache directory");

// Guest downloads are adopted on BOTH sign-in paths of the login screen.
const login = fs.readFileSync(path.join(root, "app/(auth)/login.tsx"), "utf8");
const adopts = login.split("adoptGuestFiles(user.id)").length - 1;
assert.equal(adopts, 2, "both Google and password sign-in must adopt guest offline files");
assert.ok(login.includes("migrateOfflineScope('guest', userId)"));

console.log(
  "PASS offline-merge policy, cache retention policy, janitor + guest-adoption wiring"
);
