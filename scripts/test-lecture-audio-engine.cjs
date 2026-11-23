const fs = require("fs"),
  path = require("path"),
  vm = require("vm"),
  assert = require("node:assert/strict"),
  ts = require("typescript");
const filename = path.resolve(
    __dirname,
    "../src/components/lecture/LectureAudioEngine.tsx"
  ),
  context = { exports: {}, require: () => ({}) };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText,
  context
);
const { lectureAudioHtml } = context.exports;
let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log("PASS", name);
};
function decoder(url = "https://audio.example.test/lecture.wav") {
  let audio, listener;
  const messages = [],
    parent = { postMessage: (message) => messages.push(message) };
  class Audio {
    constructor() {
      audio = this;
      this.currentTime = 0;
      this.duration = 100;
      this.paused = true;
      this.seeks = 0;
      this.events = {};
    }
    set currentTime(value) {
      this.value = value;
      this.seeks++;
    }
    get currentTime() {
      return this.value;
    }
    addEventListener(name, cb) {
      this.events[name] = cb;
    }
    play() {
      this.paused = false;
      this.events.play?.();
      return Promise.resolve();
    }
    pause() {
      this.paused = true;
      this.events.pause?.();
    }
  }
  const window = { parent, addEventListener: (_, fn) => (listener = fn) };
  const html = lectureAudioHtml(url, "qa-scope");
  vm.runInNewContext(html.match(/<script>([\s\S]*)<\/script>/)[1], {
    window,
    Audio,
    URL,
  });
  return {
    audio,
    messages,
    html,
    send: (data, source = parent) =>
      listener({
        data: {
          scope: "qa-scope",
          playing: false,
          volume: 1,
          rate: 1,
          ...data,
        },
        source,
      }),
  };
}
test("decoder defaults to no prefetch and contains no account capability", () => {
  const d = decoder();
  assert.equal(d.audio.preload, "none");
  assert(d.html.includes("media-src https:"));
  assert(!/authorization|authSession|localStorage|cookie/.test(d.html));
});
test("non-HTTPS media is rejected without assigning a source", () => {
  const d = decoder("javascript:alert(1)");
  assert.equal(d.audio.src, undefined);
  assert(d.messages.some((message) => message.failed));
});
test("script markup in a selected URL cannot close the script element", () => {
  const html = lectureAudioHtml(
    "https://audio.example.test/</script><script>alert(1)</script>",
    "qa"
  );
  assert.equal((html.match(/<script>/g) || []).length, 1);
  assert(html.includes("\\u003c"));
});
test("unrelated frame and scope commands do nothing", () => {
  const d = decoder();
  d.send({ playing: true }, {});
  assert.equal(d.audio.paused, true);
  d.send({ scope: "different", playing: true });
  assert.equal(d.audio.paused, true);
});
test("play pause volume and speed affect the real decoder", () => {
  const d = decoder();
  d.send({ playing: true, volume: 0.4, rate: 1.5 });
  assert.equal(d.audio.paused, false);
  assert.equal(d.audio.volume, 0.4);
  assert.equal(d.audio.playbackRate, 1.5);
  d.send({ playing: false });
  assert.equal(d.audio.paused, true);
});
test("a seek applies once and does not restart on a later speed change", () => {
  const d = decoder();
  d.send({ seek: { time: 30, nonce: 1 } });
  const seeks = d.audio.seeks;
  d.audio.currentTime = 35;
  d.send({ seek: { time: 30, nonce: 1 }, rate: 2 });
  assert.equal(d.audio.currentTime, 35);
  assert.equal(d.audio.seeks, seeks + 1);
  d.send({ seek: { time: 500, nonce: 2 } });
  assert.equal(d.audio.currentTime, 100);
});
test("volume speed and negative seeks are clamped", () => {
  const d = decoder();
  d.send({ volume: 50, rate: 99, seek: { time: -20, nonce: 1 } });
  assert.equal(d.audio.volume, 1);
  assert.equal(d.audio.playbackRate, 2);
  assert.equal(d.audio.currentTime, 0);
});
console.log(passed + " lecture audio engine tests passed");
