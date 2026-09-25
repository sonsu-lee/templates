import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("a failing downloaded binary does not replace an existing installation", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "sonsu-installer-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const release = join(dir, "release");
  const staged = join(dir, "staged");
  const installDir = join(dir, "bin");
  mkdirSync(release);
  mkdirSync(staged);
  mkdirSync(installDir);

  const checkLog = join(dir, "version-check.log");
  writeFileSync(
    join(staged, "sonsu"),
    '#!/bin/sh\nprintf "checked\\n" >> "$CHECK_LOG"\nexit 1\n',
    { mode: 0o755 },
  );
  const archive = `sonsu-${process.platform}-${process.arch}.tar.gz`;
  const archivePath = join(release, archive);
  execFileSync("tar", ["-czf", archivePath, "-C", staged, "sonsu"]);
  const digest = createHash("sha256").update(readFileSync(archivePath)).digest("hex");
  writeFileSync(join(release, "SHA256SUMS"), `${digest}  ${archive}\n`);

  const installed = join(installDir, "sonsu");
  writeFileSync(installed, "existing installation\n", { mode: 0o755 });
  const result = spawnSync("sh", [resolve(import.meta.dirname, "../install.sh")], {
    env: {
      ...process.env,
      CHECK_LOG: checkLog,
      SONSU_RELEASE_BASE_URL: pathToFileURL(release).href,
      SONSU_INSTALL_DIR: installDir,
    },
    encoding: "utf8",
    timeout: 15000,
  });

  assert.equal(result.status, 1);
  assert.equal(readFileSync(checkLog, "utf8"), "checked\n");
  assert.equal(readFileSync(installed, "utf8"), "existing installation\n");
});
