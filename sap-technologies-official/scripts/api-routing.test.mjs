import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { mapBackendUrls, publicBackendUrl } from "../src/utils/publicBackendUrl.js";

test("API domain modules have unique method registrations", async () => {
  const directory = new URL("../src/services/api/", import.meta.url);
  const seen = new Set();
  for (const file of (await readdir(directory)).filter(file => file.endsWith(".js"))) {
    const { default: methods } = await import(new URL(file, directory));
    for (const name of Object.keys(methods)) {
      assert.ok(!seen.has(name), `API method ${name} is registered twice`);
      seen.add(name);
    }
  }
});

test("public media and certificate URLs retain paths and query strings on the website origin", () => {
  assert.equal(publicBackendUrl("https://api.saptechug.com/uploads/iot/demo.mp4?download=1#video"), "/uploads/iot/demo.mp4?download=1#video");
  assert.equal(publicBackendUrl("https://sap-technologies-ug.onrender.com/api/certificates/download/test.pdf"), "/api/certificates/download/test.pdf");
  assert.equal(publicBackendUrl("https://github.com/team/project"), "https://github.com/team/project");
  assert.equal(publicBackendUrl("https://api.saptechug.com.example.org/uploads/demo.mp4"), "https://api.saptechug.com.example.org/uploads/demo.mp4");
  assert.equal(publicBackendUrl("https://cdn.example.org/video.mp4"), "https://cdn.example.org/video.mp4");
  assert.equal(publicBackendUrl("/uploads/iot/demo.mp4", "http://localhost:5000"), "http://localhost:5000/uploads/iot/demo.mp4");
  assert.deepEqual(mapBackendUrls({ videos: [{ url: "https://api.saptechug.com/uploads/iot/demo.mp4" }], count: 1 }), { videos: [{ url: "/uploads/iot/demo.mp4" }], count: 1 });
});

test("both deployment roots proxy API and uploads before the SPA fallback", async () => {
  for (const file of ["../vercel.json", "../../vercel.json"]) {
    const config = JSON.parse(await readFile(new URL(file, import.meta.url), "utf8"));
    assert.deepEqual(config.rewrites.slice(0, 2), [
      { source: "/api/:path*", destination: "https://api.saptechug.com/api/:path*" },
      { source: "/uploads/:path*", destination: "https://api.saptechug.com/uploads/:path*" }
    ]);
  }
});

test("production requests, media and authentication stay same-origin despite old direct API environment settings", async () => {
  const result = await build({
    entryPoints: [fileURLToPath(new URL("../src/services/api.js", import.meta.url))],
    bundle: true, write: false, platform: "node", format: "esm",
    define: { "import.meta.env": JSON.stringify({ PROD: true, DEV: false, VITE_API_URL: "https://api.saptechug.com", VITE_ENABLE_API_FALLBACK: "true" }) }
  });
  const originalFetch = globalThis.fetch;
  const originalSession = globalThis.sessionStorage;
  const originalLocal = globalThis.localStorage;
  const requests = [];
  try {
    globalThis.sessionStorage = { getItem: () => null };
    globalThis.localStorage = { getItem: () => null, removeItem() {}, setItem() {} };
    globalThis.fetch = async (url, options) => {
      requests.push({ url, options });
      return new Response(JSON.stringify({ video: "https://api.saptechug.com/uploads/iot/demo.mp4" }), { headers: { "Content-Type": "application/json" } });
    };
    const { default: api } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
    api.setAuthToken("test-access-token");
    assert.deepEqual(await api.request("/iot"), { video: "/uploads/iot/demo.mp4" });
    await api.request("/contact", { method: "POST", body: "{}" });
    assert.deepEqual(requests.map(request => request.url), ["/api/iot", "/api/contact"]);
    assert.equal(requests[0].options.credentials, "include");
    assert.equal(requests[0].options.headers.Authorization, "Bearer test-access-token");
    // Domain modules must retain their receiver and delegate through the shared client.
    await api.getPublicJobs();
    await api.getAwardsCategories();
    await api.getPublicGallery();
    await api.getProducts();
    await api.getAdminDashboardStats();
    assert.deepEqual(requests.slice(2).map(request => request.url), [
      "/api/jobs/public", "/api/awards/categories", "/api/gallery/public",
      "/api/products", "/api/admin/dashboard/stats"
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.sessionStorage = originalSession;
    globalThis.localStorage = originalLocal;
  }
});
