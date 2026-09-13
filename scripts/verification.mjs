import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { performance } from "node:perf_hooks";

export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

export function matchesOutcome(result, expected = {}) {
  return (
    !result.error &&
    !result.signal &&
    !result.timedOut &&
    result.code === (expected.exit ?? 0) &&
    (expected.diagnostics ?? []).every((text) => result.output.includes(text)) &&
    (expected.forbidden ?? []).every((text) => !result.output.includes(text))
  );
}

export function files(root) {
  const result = {};
  function visit(directory) {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const stat = lstatSync(path);
      assert.ok(!stat.isSymbolicLink(), `Unexpected symlink: ${path}`);
      if (stat.isDirectory()) visit(path);
      else {
        assert.ok(stat.isFile(), `Unexpected special file: ${path}`);
        result[relative(root, path).split(sep).join("/")] = hash(readFileSync(path));
      }
    }
  }
  visit(root);
  return result;
}

export function trackedFiles(source, path) {
  return execFileSync("git", ["ls-files", "-z", "--", path], {
    cwd: source,
    encoding: "utf8",
    timeout: 10000,
  })
    .split("\0")
    .filter(Boolean);
}

export function sourceFiles(source, template) {
  const prefix = `templates/${template}/`;
  const entries = trackedFiles(source, prefix);
  assert.ok(entries.length, `No tracked source for ${template}`);
  return Object.fromEntries(
    entries.map((file) => [file.slice(prefix.length), hash(readFileSync(join(source, file)))]),
  );
}

export function safePath(root, path) {
  const result = resolve(root, path);
  assert.ok(result.startsWith(`${resolve(root)}${sep}`), `Path must be inside ${root}: ${path}`);
  return result;
}

export function writeFiles(root, entries) {
  assert.ok(Object.keys(entries).length, "Fixture must contain files");
  for (const [name, content] of Object.entries(entries)) {
    const path = safePath(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}

export function assertOutsideGit(path) {
  let current = realpathSync(path);
  for (;;) {
    assert.ok(
      !existsSync(join(current, ".git")),
      `Generated projects must be outside Git: ${current}`,
    );
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

// Each owned POSIX process group includes package-manager grandchildren and servers.
export class Suite {
  constructor(directory, { budgetMs = 45 * 60_000, graceMs = 5000 } = {}) {
    mkdirSync(directory, { recursive: true });
    this.directory = directory;
    this.deadline = performance.now() + budgetMs;
    this.graceMs = graceMs;
    this.active = new Set();
    this.cancelled = null;
    this.report = {
      status: "running",
      commands: [],
      cases: [],
      startedAt: new Date().toISOString(),
    };
    this.save();
  }

  remaining() {
    if (this.cancelled) throw new Error(this.cancelled);
    const remaining = this.deadline - performance.now();
    assert.ok(remaining > 0, "Suite time budget exhausted");
    return remaining;
  }

  save() {
    const path = join(this.directory, "results.json");
    writeFileSync(`${path}.tmp`, `${JSON.stringify(this.report, null, 2)}\n`);
    renameSync(`${path}.tmp`, path);
  }

  async case(record, fn, dependency = true) {
    if (!this.report.cases.includes(record)) this.report.cases.push(record);
    if (!dependency || this.cancelled || performance.now() >= this.deadline) {
      record.status = "not_run";
      record.error = !dependency
        ? "Prerequisite failed"
        : (this.cancelled ?? "Suite time budget exhausted");
      this.save();
      return false;
    }
    record.status = "running";
    this.save();
    console.log(`CHECK ${record.template ?? ""} / ${record.name}`);
    try {
      await fn();
      this.remaining();
      record.status = "passed";
      return true;
    } catch (error) {
      record.status = "failed";
      record.error = error.stack ?? String(error);
      console.error(`FAIL ${record.name}: ${error.message}`);
      return false;
    } finally {
      this.save();
    }
  }

  start(cwd, argv, { env = {}, timeout = 120_000, expected, service = false } = {}) {
    const allowance = Math.min(timeout, this.remaining());
    const record = {
      cwd,
      argv,
      expected,
      service,
      status: "running",
      log: `${String(this.report.commands.length + 1).padStart(4, "0")}.log`,
    };
    this.report.commands.push(record);
    this.save();
    const started = performance.now();
    const log = join(this.directory, record.log);
    writeFileSync(log, "");
    const environment = {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      CI: "true",
      NO_COLOR: "1",
      ...env,
    };
    for (const key of ["NODE_PATH", "GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"])
      delete environment[key];
    const child = spawn(argv[0], argv.slice(1), {
      cwd,
      env: environment,
      detached: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    let stopped = false;
    let stopPromise;
    let timer;
    let completed = false;
    let resolveClosed;
    record.pid = child.pid;
    const kill = (signal) => {
      if (!child.pid) return;
      try {
        process.kill(-child.pid, signal);
      } catch (error) {
        if (error.code !== "ESRCH") {
          record.error = `Process group cleanup failed: ${error.code}`;
          this.report.error = record.error;
          // Reap the directly owned child even when the OS refuses group signalling.
          // The failed group cleanup remains a verification failure, never a pass.
          try {
            child.kill(signal);
          } catch (cause) {
            record.error += `; ${cause.message}`;
          }
          this.save();
        }
      }
    };
    const closed = new Promise((done) => {
      resolveClosed = done;
    });
    const finalize = (code, signal) => {
      if (completed) return;
      completed = true;
      clearTimeout(timer);
      Object.assign(record, {
        code,
        signal,
        seconds: (performance.now() - started) / 1000,
        status: stopped && !record.timedOut && !record.error ? "stopped" : "exited",
      });
      this.active.delete(managed);
      this.save();
      resolveClosed({ ...record, output });
    };
    child.on("error", (error) => {
      record.error = error.message;
    });
    child.on("close", finalize);
    const waitForClose = async () => {
      let waitTimer;
      await Promise.race([
        closed,
        new Promise((done) => {
          waitTimer = setTimeout(done, this.graceMs);
        }),
      ]);
      clearTimeout(waitTimer);
      return completed;
    };
    const stop = () => {
      if (stopPromise) return stopPromise;
      stopped = true;
      stopPromise = (async () => {
        kill("SIGTERM");
        await waitForClose();
        kill("SIGKILL");
        if (!(await waitForClose())) {
          // A descendant may hold inherited pipes even after the direct child exits.
          record.cleanupIncomplete = true;
          record.error = `${record.error ?? "Process cleanup failed"}; close deadline exceeded`;
          this.report.error = record.error;
          child.stdin.destroy();
          child.stdout.destroy();
          child.stderr.destroy();
          child.unref();
          finalize(child.exitCode, child.signalCode);
        }
      })();
      return stopPromise;
    };
    const managed = {
      child,
      closed,
      stop,
      record,
      get output() {
        return output;
      },
    };
    this.active.add(managed);
    const capture = (chunk) => {
      if (completed) return;
      appendFileSync(log, chunk);
      output += chunk.toString();
      if (output.length > 8 * 1024 * 1024) {
        record.error = "Command exceeded output limit";
        void stop();
      }
    };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    timer = setTimeout(() => {
      record.timedOut = true;
      void stop();
    }, allowance);
    return managed;
  }

  async run(cwd, argv, expected = {}, options = {}) {
    const child = this.start(cwd, argv, { ...options, expected });
    child.child.stdin.end();
    const result = await child.closed;
    await child.stop();
    result.error = child.record.error;
    const passed = matchesOutcome(result, expected);
    child.record.status = passed ? "passed" : "failed";
    this.save();
    assert.ok(
      passed,
      `Unexpected command result: ${argv.join(" ")}; exit=${result.code}, signal=${result.signal}, timeout=${Boolean(result.timedOut)}\n${result.output.slice(-6000)}`,
    );
    return result;
  }

  async cancel(reason) {
    this.cancelled = reason;
    await Promise.all([...this.active].map((child) => child.stop()));
  }

  finish() {
    for (const record of this.report.cases) {
      if (record.status === "pending" || record.status === "running") record.status = "not_run";
    }
    this.report.status =
      !this.cancelled &&
      !this.report.error &&
      this.report.cases.length > 0 &&
      this.report.cases.every((record) => record.status === "passed")
        ? "passed"
        : "failed";
    this.report.finishedAt = new Date().toISOString();
    this.save();
    return this.report.status === "passed" ? 0 : 1;
  }
}
