import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const services = [
  { name: "client", directory: "sap-technologies-official" },
  { name: "server", directory: "server" },
];

const children = new Set();
let shuttingDown = false;

function stopChildren(signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

for (const service of services) {
  const child = spawn(
    npmCommand,
    ["--prefix", service.directory, "run", "dev"],
    {
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
    },
  );

  children.add(child);

  child.on("error", (error) => {
    console.error(`[sap-technologies-ug] Could not start ${service.name}:`, error.message);
    process.exitCode = 1;
    stopChildren();
  });

  child.on("exit", (code, signal) => {
    children.delete(child);

    if (!shuttingDown) {
      process.exitCode = code ?? 1;
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      console.error(`[sap-technologies-ug] ${service.name} stopped with ${reason}.`);
      stopChildren();
    }

    if (children.size === 0) process.exit(process.exitCode ?? 0);
  });
}

process.on("SIGINT", () => stopChildren("SIGINT"));
process.on("SIGTERM", () => stopChildren("SIGTERM"));
