// Navigation latency: primary tab data is prefetched right after sign-in so
// first taps render from cache. Prefetch keys/functions must match the
// screen hooks exactly (same queryKey = same cache entry).
const fs = require("fs"), assert = require("assert/strict"), path = require("path");
const read = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const pre = read("src/lib/prefetch.ts");
for (const key of ['["home"]', '["modules-catalog"]', '["forums"]'])
  assert.ok(pre.includes(key), "prefetches " + key);
assert.match(pre, /staleTime: PREFETCH_STALE_TIME/, "respects staleness, no double fetch");
assert.match(pre, /isFixtureMode\(\)/, "skips guest fixture mode");
const home = read("src/lib/home.ts"), mods = read("src/lib/modules.ts");
assert.ok(home.includes("queryKey: ['home']") && home.includes("'/home'"), "home hook matches");
assert.ok(mods.includes('queryKey: ["modules-catalog"]') && mods.includes('"/modules/catalog"'), "catalog hook matches");
const layout = read("app/_layout.tsx");
assert.ok(layout.includes("usePrefetchPrimaryTabs();"), "wired in ProtectedStack");
console.log("test-prefetch: OK");
