const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");

test("API cache policy keeps admin and authenticated responses private", () => {
  const { apiCachePolicy } = require("../src/middleware/apiCachePolicy");
  const check = (request, expected) => {
    const headers = {};
    const response = { set: (name, value) => { headers[name] = value; }, vary() {} };
    apiCachePolicy({ method: "GET", headers: {}, ...request }, response, () => {});
    assert.equal(headers["Cache-Control"].startsWith("public"), expected, request.path);
  };
  check({ path: "/iot" }, true);
  check({ path: "/public/projects" }, true);
  check({ path: "/awards/admin/nominations" }, false);
  check({ path: "/products/admin/stats" }, false);
  check({ path: "/partners" }, false);
  check({ path: "/certificates/all" }, false);
  check({ path: "/iot", headers: { authorization: "Bearer test" } }, false);
  check({ path: "/iot", cookies: { accessToken: "test" } }, false);
  check({ path: "/iot", session: { userId: "test" } }, false);
  check({ path: "/iot", method: "POST" }, false);
});

test("routes delegate data access and business operations to controllers or middleware", () => {
  const directory = path.join(__dirname, "../src/routes");
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith(".js"))) {
    const source = fs.readFileSync(path.join(directory, file), "utf8");
    assert.doesNotMatch(source, /require\(["']\.\.\/(models|services)(?:\/|["'])/, `${file} must not access models or services directly`);
  }
  const app = fs.readFileSync(path.join(__dirname, "../src/app.js"), "utf8");
  assert.doesNotMatch(app, /app\.listen\(/, "app composition must not bind a server port");
});

test("route registrations and composed email methods do not silently duplicate each other", () => {
  const routes = path.join(__dirname, "../src/routes");
  for (const file of fs.readdirSync(routes).filter(file => file.endsWith(".js"))) {
    const source = fs.readFileSync(path.join(routes, file), "utf8");
    const seen = new Set();
    for (const match of source.matchAll(/router\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/g)) {
      const signature = `${match[1]} ${match[2]}`;
      assert.ok(!seen.has(signature), `${file} duplicates ${signature}`);
      seen.add(signature);
    }
  }
  const methods = new Set();
  const directory = path.join(__dirname, "../src/services/email");
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith(".js") && file !== "shared.js")) {
    for (const name of Object.keys(require(path.join(directory, file)))) {
      assert.ok(!methods.has(name), `Email method ${name} is registered twice`);
      methods.add(name);
    }
  }
});

test("extracted initial-admin middleware retains setup authorization", async t => {
  const { User } = require("../src/models");
  const { requireInitialAdminSetup } = require("../src/middleware/initialAdminSetup");
  const originalCount = User.countDocuments;
  const originalToken = process.env.ADMIN_SETUP_TOKEN;
  t.after(() => {
    User.countDocuments = originalCount;
    if (originalToken === undefined) delete process.env.ADMIN_SETUP_TOKEN;
    else process.env.ADMIN_SETUP_TOKEN = originalToken;
  });
  let admins = 0;
  User.countDocuments = async () => admins;
  const invoke = async token => {
    let status, body, continued = false;
    const res = { status(value) { status = value; return this; }, json(value) { body = value; } };
    await requireInitialAdminSetup({ get: () => token }, res, error => { if (error) throw error; continued = true; });
    return { status, body, continued };
  };
  delete process.env.ADMIN_SETUP_TOKEN;
  assert.equal((await invoke("anything")).status, 403);
  process.env.ADMIN_SETUP_TOKEN = "a-strong-initial-setup-token-for-test";
  assert.equal((await invoke("wrong-token")).status, 403);
  assert.equal((await invoke(process.env.ADMIN_SETUP_TOKEN)).continued, true);
  admins = 1;
  assert.equal((await invoke(process.env.ADMIN_SETUP_TOKEN)).status, 403);
});

test("public catalog routes preserve response contracts and category routing after controller extraction", async t => {
  const cache = require("../src/services/cacheService");
  const originalGet = cache.get;
  const keys = [];
  cache.get = key => { keys.push(key); return ["cached-result"]; };
  t.after(() => { cache.get = originalGet; });
  const app = express();
  app.use("/api/public", require("../src/routes/publicRoutes"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  for (const [url, key, cacheKey] of [
    ["services", "services", "services:public:all:all"],
    ["services/categories", "categories", "services:categories"],
    ["services/example", "service", "service:example"],
    ["projects", "projects", "projects:public:all:all"],
    ["projects/categories", "categories", "projects:categories"],
    ["projects/example", "project", "project:example"]
  ]) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/public/${url}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, data: { [key]: ["cached-result"] }, cached: true });
    assert.equal(keys.at(-1), cacheKey);
  }
});
