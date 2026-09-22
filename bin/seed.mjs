#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const targets = new Map([
  ["darwin-arm64", "darwin-arm64/seed"],
  ["darwin-x64", "darwin-x64/seed"],
  ["linux-arm64", "linux-arm64/seed"],
  ["linux-x64", "linux-x64/seed"],
  ["win32-x64", "win32-x64/seed.exe"],
]);

const platform = `${process.platform}-${process.arch}`;
const executable = targets.get(platform);
if (executable === undefined) {
  console.error(`seed does not support ${platform}`);
  process.exitCode = 1;
} else {
  const binary = fileURLToPath(new URL(`../native/${executable}`, import.meta.url));
  const child = spawn(binary, process.argv.slice(2), { stdio: "inherit" });
  let spawnFailed = false;
  const forwardedSignals =
    process.platform === "win32"
      ? ["SIGINT", "SIGTERM", "SIGBREAK"]
      : ["SIGHUP", "SIGINT", "SIGTERM"];

  for (const signal of forwardedSignals) {
    process.on(signal, () => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill(signal);
      }
    });
  }

  child.once("error", (error) => {
    spawnFailed = true;
    console.error(`Unable to start seed for ${platform}: ${error.message}`);
    process.exitCode = 1;
  });
  child.once("exit", (code, signal) => {
    if (spawnFailed) return;
    if (signal !== null && process.platform !== "win32") {
      process.kill(process.pid, signal);
      return;
    }
    process.exitCode = code ?? 1;
  });
}
