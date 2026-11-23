const fs = require("fs"),
  ts = require("typescript"),
  assert = require("assert/strict"),
  path = require("path");
const root = path.resolve(__dirname, "..");
function moduleAt(name, deps) {
  const m = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    ts.transpileModule(fs.readFileSync(root + "/" + name, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText
  )(
    (key) => {
      if (!(key in deps)) throw Error("Unexpected dependency " + key);
      return deps[key];
    },
    m,
    m.exports
  );
  return m.exports;
}
let platform = "web",
  readCall,
  removed = [],
  nativeDownload;
const RN = {
  Platform: {
    get OS() {
      return platform;
    },
  },
};
const FS = {
  cacheDirectory: "file:///cache/",
  EncodingType: { Base64: "base64" },
  makeDirectoryAsync: async () => {},
  deleteAsync: async (p) => {
    removed.push(p);
  },
  createDownloadResumable: (url, file, options, progress) => ({
    downloadAsync: async () =>
      nativeDownload
        ? nativeDownload(progress)
        : { status: 200, headers: { "Content-Type": "application/pdf" } },
    pauseAsync: async () => {},
  }),
  getInfoAsync: async () => ({ exists: true, size: 20 }),
  readAsStringAsync: async (file, options) => {
    readCall = options;
    return Buffer.from("%PDF-1.7\nLOCAL QA PDF").toString("base64");
  },
};
const crypto = {
  CryptoDigestAlgorithm: { SHA256: "sha256" },
  digestStringAsync: async (_, scope) => "hash-" + scope,
  randomUUID: () => "qa-run",
};
const offline = moduleAt("src/lib/offline-downloads.ts", {
  "react-native": RN,
  "expo-file-system/legacy": FS,
  "expo-crypto": crypto,
  "expo-sharing": {},
  "@tanstack/react-query": {},
  "./auth": {},
  "./atomic-json": {},
});
const pdf = moduleAt("src/lib/pdf-source.ts", {
  "react-native": RN,
  "expo-file-system/legacy": FS,
  "expo-crypto": crypto,
  "./offline-downloads": offline,
});
const checks = [];
let fetchOptions,
  fetches = 0;
const url = "https://files.example.test/current.pdf";
function response(bytes, type = "application/pdf", length = bytes.length) {
  global.fetch = async (u, options) => {
    fetches++;
    fetchOptions = options;
    return {
      ok: true,
      headers: new Headers({
        "content-type": type,
        "content-length": String(length),
      }),
      body: new ReadableStream({
        start(c) {
          c.enqueue(bytes);
          c.close();
        },
      }),
    };
  };
}
async function reject(pattern, run) {
  await assert.rejects(run, pattern);
}
(async () => {
  const bytes = Buffer.concat([
    Buffer.from("%PDF-1.7\n"),
    Buffer.alloc(pdf.PDF_CHUNK_BYTES + 31, 42),
  ]);
  response(bytes);
  const source = await pdf.loadPdfSource(
    url,
    "owner-a",
    new AbortController().signal
  );
  assert.equal(source.bytes, bytes.length);
  assert.equal(fetchOptions.credentials, "omit");
  const a = await source.read(0, pdf.PDF_CHUNK_BYTES),
    b = await source.read(pdf.PDF_CHUNK_BYTES, pdf.PDF_CHUNK_BYTES);
  assert.deepEqual(
    Buffer.concat([Buffer.from(a, "base64"), Buffer.from(b, "base64")]),
    bytes
  );
  await source.release();
  checks.push(
    "Real byte chunks reassemble exactly; unauthenticated public file fetch omits credentials"
  );
  response(Buffer.from("<html>Login</html>"), "text/html");
  await reject(/web page/, () =>
    pdf.loadPdfSource(url, "a", new AbortController().signal)
  );
  response(Buffer.from("not a pdf"));
  await reject(/valid PDF/, () =>
    pdf.loadPdfSource(url, "a", new AbortController().signal)
  );
  response(Buffer.from("%PDF-1.7"), undefined, pdf.MAX_PDF_BYTES + 1);
  await reject(/too large/, () =>
    pdf.loadPdfSource(url, "a", new AbortController().signal)
  );
  let cancelled = false;
  global.fetch = async () => ({
    ok: true,
    headers: new Headers(),
    body: {
      getReader: () => ({
        read: async () => ({
          done: false,
          value: { length: pdf.MAX_PDF_BYTES + 1 },
        }),
        cancel: async () => {
          cancelled = true;
        },
        releaseLock: () => {},
      }),
    },
  });
  await reject(/too large/, () =>
    pdf.loadPdfSource(url, "a", new AbortController().signal)
  );
  assert(cancelled);
  checks.push(
    "HTML, invalid PDF, declared oversize and streamed oversize rejected before viewer upload"
  );
  const abort = new AbortController();
  abort.abort();
  const before = fetches;
  await reject(/cancelled/, () => pdf.loadPdfSource(url, "a", abort.signal));
  assert.equal(fetches, before);
  await reject(/secure/, () =>
    pdf.loadPdfSource(
      "http://files.example.test/a.pdf",
      "a",
      new AbortController().signal
    )
  );
  checks.push("Cancelled and insecure links never fetch");
  assert(
    offline.matchesOfflineFile({ id: "id", url }, { id: "id", sourceUrl: url })
  );
  assert(!offline.matchesOfflineFile({ id: "id", url }, { id: "id" }));
  assert(
    !offline.matchesOfflineFile(
      { id: "id", url },
      { id: "id", sourceUrl: url + "?old=1" }
    )
  );
  checks.push(
    "Legacy or changed-source offline metadata is not silently treated as the current file"
  );
  platform = "android";
  const native = await pdf.loadPdfSource(
    url,
    "owner-a",
    new AbortController().signal
  );
  await native.read(192, 48);
  assert.deepEqual(readCall, { encoding: "base64", position: 192, length: 48 });
  await native.release();
  assert(removed.some((p) => p.includes("/hash-owner-a/")));
  const nativeB = await pdf.loadPdfSource(
    url,
    "owner-b",
    new AbortController().signal
  );
  await nativeB.release();
  assert(removed.some((p) => p.includes("/hash-owner-b/")));
  checks.push(
    "Native chunk reads are bounded and preview caches use distinct account directories"
  );
  nativeDownload = async (progress) => ({ status: 403, headers: {} });
  await reject(/downloaded/, () =>
    pdf.loadPdfSource(url, "a", new AbortController().signal)
  );
  assert(removed.some((p) => p.includes("/hash-a/")));
  checks.push("Failed native downloads clean temporary previews");
  console.log(JSON.stringify({ checks, passed: checks.length }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
