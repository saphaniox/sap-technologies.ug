import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const sourceDist = path.join(appRoot, "dist");
const nestedDist = path.join(appRoot, "sap-technologies-official", "dist");

if (!fs.existsSync(sourceDist)) {
  throw new Error(`Vite output not found at ${sourceDist}`);
}

fs.rmSync(nestedDist, { recursive: true, force: true });
fs.mkdirSync(path.dirname(nestedDist), { recursive: true });
fs.cpSync(sourceDist, nestedDist, { recursive: true });

console.log(`Prepared Vercel output at ${path.relative(appRoot, nestedDist)}`);
