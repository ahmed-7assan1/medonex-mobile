// apiFetch/apiV1Fetch contract tests (stub loader, no RN runtime needed).
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
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
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
let session=null;
const api = moduleAt("src/lib/api.ts", {
  "react-native": { Platform: { OS: "android" } },
  "expo-secure-store": { getItemAsync: async key => key==='authSessionV2'?session:null },
  "expo-constants": { default: { expoConfig: null } },
  "./fixtures": { isGuestMode: () => false },
});
const { apiFetch, ApiError } = api;

function fakeResponse(status, contentType, body) {
  global.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": contentType }),
    json: async () => JSON.parse(body),
    text: async () => body,
  });
}

(async () => {
  session=JSON.stringify({token:'key',user:{id:'A'}});
  assert.equal((await api.authHeaders(undefined,'A')).get('Authorization'),'Bearer key');
  await assert.rejects(api.authHeaders(undefined,'B'),/Account changed/);
  session=null;
  // Normal JSON payloads pass through.
  fakeResponse(200, "application/json", '{"modules":[]}');
  assert.deepEqual(await apiFetch("/study-plan"), { modules: [] });

  // A missing route answers with the website HTML page and HTTP 200; this
  // must surface as an ApiError, never as HTML posing as data.
  fakeResponse(200, "text/html; charset=utf-8", "<!DOCTYPE html><html></html>");
  await assert.rejects(apiFetch("/study-plan"), (err) => {
    assert.ok(err instanceof ApiError);
    assert.equal(err.status, 404);
    assert.equal(err.body.error, "endpoint-missing");
    return true;
  });

  // Real API errors keep their status and body.
  fakeResponse(401, "application/json", '{"error":"Unauthorized"}');
  await assert.rejects(apiFetch("/profile"), (err) => {
    assert.equal(err.status, 401);
    assert.equal(err.body.error, "Unauthorized");
    return true;
  });

  console.log("PASS api client: JSON contract, HTML 200 -> endpoint-missing 404, error passthrough");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
