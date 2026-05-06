import { execFileSync } from "node:child_process";
import process from "node:process";

const ports = process.argv
  .slice(2)
  .map((port) => Number(port))
  .filter((port) => Number.isInteger(port) && port > 0);

if (ports.length === 0) {
  process.exit(0);
}

if (process.platform !== "win32") {
  console.log(`Skipping automatic port cleanup on ${process.platform}.`);
  process.exit(0);
}

const netstat = execFileSync("netstat", ["-ano"], { encoding: "utf8" });
const pids = new Set();

for (const line of netstat.split(/\r?\n/)) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 5 || parts[0] !== "TCP" || parts[3] !== "LISTENING") continue;

  const localAddress = parts[1];
  const pid = Number(parts[4]);
  const port = Number(localAddress.match(/:(\d+)$/)?.[1]);

  if (ports.includes(port) && Number.isInteger(pid) && pid > 0 && pid !== process.pid) {
    pids.add(pid);
  }
}

for (const pid of pids) {
  try {
    execFileSync("taskkill", ["/PID", String(pid), "/F"], { stdio: "ignore" });
    console.log(`Stopped process ${pid} using demo port.`);
  } catch {
    console.log(`Process ${pid} could not be stopped or was already closed.`);
  }
}

if (pids.size === 0) {
  console.log("Demo ports are free.");
}
