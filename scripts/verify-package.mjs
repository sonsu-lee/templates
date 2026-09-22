import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const reportPath = process.argv[2];
if (reportPath === undefined) {
  console.error("Usage: node scripts/verify-package.mjs <npm-pack-report.json>");
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
const reports = JSON.parse(readFileSync(resolve(reportPath), "utf8"));
assert.equal(reports.length, 1, "npm pack must produce exactly one package");
const [report] = reports;
assert.equal(report.name, "@sonsu-lee/seed");
assert.equal(report.version, manifest.version);

const files = new Map(report.files.map((file) => [file.path, file]));
const required = [
  "package.json",
  "README.md",
  "README.ja.md",
  "README.ko.md",
  "bin/seed.mjs",
  "native/darwin-arm64/seed",
  "native/darwin-x64/seed",
  "native/linux-arm64/seed",
  "native/linux-x64/seed",
  "native/win32-x64/seed.exe",
];
for (const path of required) {
  const file = files.get(path);
  assert(file !== undefined, `npm package is missing ${path}`);
  assert(file.size > 0, `npm package contains an empty ${path}`);
}
assert.deepEqual(
  [...files.keys()].sort(),
  [...required].sort(),
  "npm package file set must match the required files",
);

console.log(`verified ${report.filename} with ${required.length} required files`);
