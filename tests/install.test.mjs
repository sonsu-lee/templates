import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const installer = resolve(import.meta.dirname, "../install.sh");

function scratch(t) {
  const dir = mkdtempSync(join(tmpdir(), "sonsu-installer-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function runInstaller(env) {
  return spawnSync("sh", [installer], {
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 15000,
  });
}

test("rejects malformed version tags before downloading", (t) => {
  const dir = scratch(t);
  const commands = join(dir, "commands");
  mkdirSync(commands);
  writeFileSync(join(commands, "curl"), '#!/bin/sh\nprintf "called\\n" >> "$CURL_LOG"\nexit 22\n', { mode: 0o755 });

  const curlLog = join(dir, "curl.log");
  const result = runInstaller({
    PATH: `${commands}${delimiter}${process.env.PATH}`,
    CURL_LOG: curlLog,
    SONSU_VERSION: "v0.2.0bad",
    SONSU_INSTALL_DIR: join(dir, "bin"),
    SONSU_RELEASE_BASE_URL: "",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SONSU_VERSION must be latest or a valid version tag/);
  assert.doesNotMatch(result.stderr, /v0\.2\.0/);
  assert.equal(existsSync(curlLog), false);
});

test("a failing downloaded binary does not replace an existing installation", (t) => {
  const dir = scratch(t);
  const release = join(dir, "release");
  const staged = join(dir, "staged");
  const installDir = join(dir, "bin");
  mkdirSync(release);
  mkdirSync(staged);
  mkdirSync(installDir);

  const binary = join(staged, "sonsu");
  const checkLog = join(dir, "version-check.log");
  writeFileSync(binary, '#!/bin/sh\nprintf "checked\\n" >> "$CHECK_LOG"\nexit 1\n', { mode: 0o755 });
  const archive = `sonsu-${process.platform}-${process.arch}.tar.gz`;
  const archivePath = join(release, archive);
  execFileSync("tar", ["-czf", archivePath, "-C", staged, "sonsu"]);
  const digest = createHash("sha256").update(readFileSync(archivePath)).digest("hex");
  writeFileSync(join(release, "SHA256SUMS"), `${digest}  ${archive}\n`);

  const installed = join(installDir, "sonsu");
  writeFileSync(installed, "existing installation\n", { mode: 0o755 });
  const result = runInstaller({
    CHECK_LOG: checkLog,
    SONSU_RELEASE_BASE_URL: pathToFileURL(release).href,
    SONSU_INSTALL_DIR: installDir,
  });

  assert.notEqual(result.status, 0);
  assert.equal(readFileSync(checkLog, "utf8"), "checked\n");
  assert.equal(readFileSync(installed, "utf8"), "existing installation\n");
});

test("a termination signal stops the installer after cleanup", (t) => {
  const dir = scratch(t);
  const commands = join(dir, "commands");
  const temporaryFiles = join(dir, "temporary-files");
  mkdirSync(commands);
  mkdirSync(temporaryFiles);
  writeFileSync(join(commands, "curl"), [
    "#!/bin/sh",
    'printf "called\\n" >> "$CURL_LOG"',
    'if [ "$(wc -l < "$CURL_LOG")" -eq 1 ]; then kill -TERM "$PPID"; fi',
    "exit 0",
    "",
  ].join("\n"), { mode: 0o755 });

  const curlLog = join(dir, "curl.log");
  const result = runInstaller({
    PATH: `${commands}${delimiter}${process.env.PATH}`,
    CURL_LOG: curlLog,
    TMPDIR: temporaryFiles,
    SONSU_RELEASE_BASE_URL: "https://example.invalid/release",
    SONSU_INSTALL_DIR: join(dir, "bin"),
  });

  assert.notEqual(result.status, 0);
  assert.equal(readFileSync(curlLog, "utf8"), "called\n");
  assert.deepEqual(readdirSync(temporaryFiles), []);
});
