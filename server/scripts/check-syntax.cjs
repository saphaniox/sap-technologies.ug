const fs = require("node:fs");
const path = require("node:path");
const { Script } = require("node:vm");
const { wrap } = require("node:module");

const root = path.resolve(__dirname, "..");
const sources = fs.readdirSync(path.join(root, "src"), { recursive: true })
  .filter(file => /\.(js|cjs)$/.test(file))
  .map(file => path.join(root, "src", file));
sources.push(path.join(__dirname, "copy-database-to-vps.js"));
for (const file of sources) {
  const source = fs.readFileSync(file, "utf8").replace(/^#![^\n]*(?:\n|$)/, "\n");
  // Compile CommonJS exactly inside its module wrapper without executing it.
  // One V8 process avoids expensive per-file process startup on Windows.
  new Script(wrap(source), { filename: file });
}
console.log(`Syntax checked ${sources.length} server files.`);
