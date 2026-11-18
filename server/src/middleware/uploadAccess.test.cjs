const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const express = require("express");
const { uploadAccess } = require("./uploadAccess");

test("uploaded videos support loading, HEAD, and seeking; unsafe files stay blocked", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "sap-upload-test-"));
  const bytes = Buffer.from("0123456789");
  await fs.writeFile(path.join(directory, "demo.mp4"), bytes);
  await fs.writeFile(path.join(directory, "unsafe.html"), "<script></script>");
  const app = express();
  app.use("/uploads", uploadAccess, express.static(directory));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/uploads`;
  try {
    const full = await fetch(`${base}/demo.mp4`);
    assert.equal(full.status, 200);
    assert.match(full.headers.get("content-type"), /video\/mp4/);
    assert.deepEqual(Buffer.from(await full.arrayBuffer()), bytes);
    const partial = await fetch(`${base}/demo.mp4`, { headers: { Range: "bytes=2-5" } });
    assert.equal(partial.status, 206);
    assert.equal(partial.headers.get("content-range"), "bytes 2-5/10");
    assert.equal(await partial.text(), "2345");
    const head = await fetch(`${base}/demo.mp4`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-length"), "10");
    assert.equal((await fetch(`${base}/unsafe.html`)).status, 403);
    assert.equal((await fetch(`${base}/unsafe%2ehtml`)).status, 403);
    assert.equal((await fetch(`${base}/missing.webm`)).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(directory, { recursive: true, force: true });
  }
});
