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

  const signalHandlers = new Map();
  for (const signal of forwardedSignals) {
    const handler = () => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill(signal);
      }
    };
    signalHandlers.set(signal, handler);
    process.on(signal, handler);
  }
  const removeSignalHandlers = () => {
    for (const [signal, handler] of signalHandlers) {
      process.off(signal, handler);
    }
  };

  child.once("error", (error) => {
    removeSignalHandlers();
    spawnFailed = true;
    console.error(`Unable to start seed for ${platform}: ${error.message}`);
    process.exitCode = 1;
  });
  child.once("exit", (code, signal) => {
    removeSignalHandlers();
    if (spawnFailed) return;
    if (signal !== null && process.platform !== "win32") {
      process.kill(process.pid, signal);
      return;
    }
    process.exitCode = code ?? 1;
  });
}
