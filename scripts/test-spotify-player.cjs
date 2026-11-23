const fs = require("fs"),
  vm = require("vm"),
  assert = require("assert/strict"),
  ts = require("typescript"),
  path = require("path");
const moduleObject = { exports: {} };
new Function(
  "exports",
  "module",
  ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, "../src/lib/spotify-player.ts"),
      "utf8"
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }
  ).outputText
)(moduleObject.exports, moduleObject);
const { spotifyTarget, normalizeSpotifyPlayback, spotifyPlayerHtml } =
  moduleObject.exports;
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log("PASS " + name);
}
function setup(url = "https://open.spotify.com/episode/abcd1234", resume = 0) {
  const html = spotifyPlayerHtml(url, "qa-scope", resume),
    messages = [],
    elements = [],
    events = {};
  let timeout,
    listener,
    seeks = [],
    paused = 0,
    destroyed = 0;
  const host = { replaceChildren: (x) => elements.push(x) };
  const document = {
    getElementById: () => host,
    createElement: (tag) => ({ tag }),
    body: { appendChild: (el) => elements.push(el) },
  };
  const parent = { postMessage: (m) => messages.push(m) },
    window = { parent, addEventListener: (type, fn) => (events[type] = fn) };
  const controller = {
    addListener: (type, fn) => {
      if (type === "playback_update") listener = fn;
    },
    seek: (v) => seeks.push(v),
    pause: () => paused++,
    destroy: () => destroyed++,
  };
  vm.runInNewContext(html.match(/<script>([\s\S]+)<\/script>/)[1], {
    URL,
    window,
    parent,
    document,
    setTimeout: (fn) => {
      timeout = fn;
      return 1;
    },
    clearTimeout: () => {},
    Number,
    Math,
  });
  return {
    html,
    messages,
    elements,
    events,
    window,
    parent,
    controller,
    get listener() {
      return listener;
    },
    seeks,
    get paused() {
      return paused;
    },
    get destroyed() {
      return destroyed;
    },
    timeout: () => timeout(),
    ready: () =>
      window.onSpotifyIframeApiReady({
        createController: (_, opts, fn) => {
          assert.equal(opts.uri, "spotify:episode:abcd1234");
          fn(controller);
        },
      }),
  };
}
test("Spotify URL normalization stays on the exact secure provider and content ID", () => {
  assert.equal(
    spotifyTarget("https://open.spotify.com/intl-ar/episode/abc?si=123").uri,
    "spotify:episode:abc"
  );
  assert.equal(
    spotifyTarget("https://open.spotify.com/embed/track/abc").embedUrl,
    "https://open.spotify.com/embed/track/abc"
  );
  for (const raw of [
    "http://open.spotify.com/episode/a",
    "https://open.spotify.com.attacker.test/episode/a",
    "https://x:y@open.spotify.com/episode/a",
    "https://open.spotify.com/not-content/a",
    "javascript:alert(1)",
    "https://open.spotify.com/episode/a/more",
  ])
    assert.equal(spotifyTarget(raw), null);
});
test("Provider time is milliseconds, with no guessed duration or playing state", () => {
  assert.deepEqual(
    normalizeSpotifyPlayback({
      position: 6500,
      duration: 10000,
      isPaused: true,
    }),
    { time: 6.5, duration: 10, playing: false }
  );
  for (const raw of [
    { position: "6", duration: 9, isPaused: false },
    { position: NaN, duration: 9, isPaused: false },
    { position: 1, duration: -1, isPaused: false },
    { position: 1, duration: 2, isPaused: 0 },
    { position: Infinity, duration: 2, isPaused: true },
  ])
    assert.equal(normalizeSpotifyPlayback(raw), null);
});
test("Player contains no app session or account API and never starts media itself", () => {
  const v = setup();
  assert(!v.html.includes("/api/"));
  assert(!v.html.includes("localStorage"));
  assert(!v.html.includes(".play("));
  assert.equal(v.messages.length, 0);
  v.ready();
  assert.equal(v.messages.at(-1).type, "ready");
  assert.equal(v.messages.at(-1).available, true);
});
test("Resume waits for actual non-buffered playback and seeks once at integer seconds", () => {
  const v = setup(undefined, 7.8);
  v.ready();
  v.listener({ data: { position: 0, duration: 100000, isPaused: true } });
  assert.equal(v.seeks.length, 0);
  v.listener({
    data: { position: 0, duration: 100000, isPaused: false, isBuffering: true },
  });
  assert.equal(v.seeks.length, 0);
  v.listener({
    data: {
      position: 0,
      duration: 100000,
      isPaused: false,
      isBuffering: false,
    },
  });
  assert.deepEqual(v.seeks, [7]);
  v.listener({ data: { position: 0, duration: 100000, isPaused: false } });
  assert.equal(v.seeks.length, 1);
  assert.equal(v.messages.at(-1).position, 0);
});
test("Resume does not rewind a listener who already moved forward", () => {
  const v = setup(undefined, 7);
  v.ready();
  v.listener({ data: { position: 10000, duration: 100000, isPaused: false } });
  assert.equal(v.seeks.length, 0);
});
test("Foreign windows and scopes cannot pause the controller", () => {
  const v = setup();
  v.ready();
  v.events.message({ source: {}, data: { type: "pause", scope: "qa-scope" } });
  v.events.message({
    source: v.parent,
    data: { type: "pause", scope: "other" },
  });
  assert.equal(v.paused, 0);
  v.events.message({
    source: v.parent,
    data: { type: "pause", scope: "qa-scope" },
  });
  assert.equal(v.paused, 1);
});
test("Missing API falls back to official media and declares progress unavailable", () => {
  const v = setup();
  v.elements.find((e) => e.tag === "script").onerror();
  assert.equal(
    v.elements.at(-1).src,
    "https://open.spotify.com/embed/episode/abcd1234"
  );
  assert.equal(v.messages.at(-1).available, false);
  assert(!v.messages.some((m) => m.type === "playback"));
  v.ready();
  assert.equal(v.messages.length, 1);
});
test("Invalid provider values never produce a playback update", () => {
  const v = setup();
  v.ready();
  const before = v.messages.length;
  v.listener({ data: { position: Infinity, duration: 100, isPaused: false } });
  v.listener({ data: { position: -5, duration: 100, isPaused: false } });
  assert.equal(v.messages.length, before);
});
test("Selected URLs cannot inject HTML or script markup", () => {
  const v = setup(
    "https://open.spotify.com/episode/abc?x=</script><script>bad()"
  );
  assert(!v.html.includes("<script>bad()"));
  assert(!v.html.includes("bad()"));
  const bad = setup("https://attacker.test/episode/a");
  assert.equal(bad.messages.at(-1).type, "error");
  assert.equal(bad.elements.length, 0);
});
console.log(n + " Spotify player tests passed");
