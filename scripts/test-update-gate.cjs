// Forced-update gate: static manifest, semver compare, persistence, wiring.
const fs = require("fs"), assert = require("assert/strict"), path = require("path");
const read = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");

// Pure semver compare (mirror of src/lib/update-gate.ts compareVersions).
function compareVersions(a, b) {
  const pa = a.split(".").map((x) => parseInt(x, 10) || 0);
  const pb = b.split(".").map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}
assert.equal(compareVersions("1.0.7", "1.0.8"), -1);
assert.equal(compareVersions("1.0.8", "1.0.8"), 0);
assert.equal(compareVersions("1.1.0", "1.0.9"), 1);
assert.equal(compareVersions("1.0", "1.0.0"), 0);

const gate = read("src/lib/update-gate.ts");
assert.match(gate, /raw\.githubusercontent\.com/, "static manifest, no backend");
assert.match(gate, /SecureStore\.setItemAsync/, "requirement persisted");
assert.match(gate, /isUpdateRequired\(stored, current\)/, "stored requirement gates offline");
const ui = read("src/components/UpdateGate.tsx");
assert.match(ui, /totalBytesWritten \/ p\.totalBytesExpectedToWrite/, "download progress %");
assert.match(ui, /sizeMB/, "update size shown");
assert.match(ui, /changelog/, "changelog preview");
assert.match(ui, /getContentUriAsync/, "APK install via content URI");
const layout = read("app/_layout.tsx");
assert.match(layout, /GatedApp/, "gate wraps the app tree");
const manifest = JSON.parse(read("update-manifest.json"));
const appJson = JSON.parse(read("app.json"));
assert.equal(appJson.expo.version, "1.0.8");
assert.equal(appJson.expo.android.versionCode, 8);
assert.equal(manifest.minSupportedVersion, "1.0.8", "manifest gates below 1.0.8");
assert.ok(Array.isArray(manifest.changelog.ar) && manifest.changelog.ar.length > 0, "Arabic changelog");
console.log("test-update-gate: OK");
