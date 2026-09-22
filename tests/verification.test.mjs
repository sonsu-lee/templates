import assert from "node:assert/strict";
import test from "node:test";
import { matchesOutcome } from "../scripts/verification.mjs";
import { Suite, assertOutsideGit, writeFiles } from "../scripts/verification.mjs";
import { parseArgs, snapshot } from "../scripts/verify.mjs";
import { assertDiagnosticFiles, loadCases } from "../scripts/cases.mjs";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

function scratch(t) {
  const dir = mkdtempSync(join(tmpdir(), "verify-runner-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("CLI selects all or one template and rejects unsupported or repeated arguments", () => {
  assert.equal(parseArgs([]).selected.length, 3);
  assert.deepEqual(parseArgs(["next-static-nest"]).selected, ["next-static-nest"]);
  for (const args of [
    ["bad"],
    ["--binary"],
    ["next-fullstack", "next-node-nest"],
    ["--output-dir", "a", "--output-dir", "b"],
  ]) {
    assert.throws(() => parseArgs(args));
  }
});

test("fixture catalogs have readable nonempty inputs for every selected case", () => {
  for (const template of parseArgs([]).selected) {
    const cases = loadCases(resolve(import.meta.dirname, ".."), template);
    assert.ok(cases.length >= 8);
    for (const spec of cases) assert.equal(Object.keys(spec.entries).length, spec.files.length);
  }
});

test("fixture omissions and path escapes are rejected", (t) => {
  const dir = scratch(t);
  assert.throws(() => writeFiles(dir, {}), /contain files/);
  assert.throws(() => writeFiles(dir, { "../escape": "bad" }), /inside/);
  assert.throws(() => loadCases(dir, "next-fullstack"), /ENOENT/);
});

test("another rule in a file cannot stand in for the intended boundary diagnostic", () => {
  const output = JSON.stringify({
    diagnostics: [
      { filename: "src/blocked.ts", code: "typescript(TS2307)", message: "Cannot find module" },
      { filename: "src/other.ts", code: "eslint(no-restricted-imports)" },
    ],
  });
  assert.throws(() =>
    assertDiagnosticFiles(output, { "apps/web/src/blocked.ts": ["no-restricted-imports"] }),
  );
});

test("one restricted import cannot mask another import in the same fixture file", () => {
  for (const template of parseArgs([]).selected) {
    const spec = loadCases(resolve(import.meta.dirname, ".."), template).find(
      (item) => item.name === "client-imports",
    );
    const file = `${template === "next-fullstack" ? "" : "apps/web/"}src/client/blocked.mjs`;
    const expected = { [file]: spec.steps[0].diagnosticFiles[file] };
    const diagnostics = ["server-only", "pg"].map((target) => ({
      filename: "src/client/blocked.mjs",
      code: "eslint(no-restricted-imports)",
      message: `'${target}' import is restricted from being used by a pattern.`,
    }));
    assertDiagnosticFiles(JSON.stringify({ diagnostics }), expected);
    for (const diagnostic of diagnostics) {
      assert.throws(
        () => assertDiagnosticFiles(JSON.stringify({ diagnostics: [diagnostic] }), expected),
        `A missing import diagnostic must fail for ${template}`,
      );
    }
  }
});

test("scratch directory inside a Git ancestor is rejected", (t) => {
  const dir = scratch(t);
  mkdirSync(join(dir, ".git"));
  mkdirSync(join(dir, "project"));
  assert.throws(() => assertOutsideGit(join(dir, "project")), /outside Git/);
});

test("real failed command is logged with its matching diagnostic", async (t) => {
  const dir = scratch(t);
  const suite = new Suite(join(dir, "report"));
  const passed = await suite.case({ name: "negative" }, () =>
    suite.run(
      dir,
      [process.execPath, "-e", 'console.error("expected diagnostic"); process.exitCode=1'],
      { exit: 1, diagnostics: ["expected diagnostic"] },
    ),
  );
  assert.equal(passed, true);
  assert.equal(suite.finish(), 0);
  const report = JSON.parse(readFileSync(join(dir, "report/results.json")));
  assert.equal(report.commands[0].status, "passed");
  assert.match(
    readFileSync(join(dir, "report", report.commands[0].log), "utf8"),
    /expected diagnostic/,
  );
});

test("failed prerequisite skips its dependent case while preserving other cases", async (t) => {
  const dir = scratch(t);
  const suite = new Suite(join(dir, "report"));
  const first = await suite.case({ name: "bad" }, () => {
    throw new Error("prerequisite");
  });
  let invoked = false;
  await suite.case(
    { name: "dependent" },
    () => {
      invoked = true;
    },
    first,
  );
  await suite.case({ name: "independent" }, () => {});
  assert.equal(invoked, false);
  assert.equal(suite.finish(), 1);
  assert.deepEqual(
    suite.report.cases.map((c) => c.status),
    ["failed", "not_run", "passed"],
  );
});

test("timeout kills a process that ignores TERM and preserves its report", async (t) => {
  const dir = scratch(t);
  const suite = new Suite(join(dir, "report"), { graceMs: 30 });
  const passed = await suite.case({ name: "timeout" }, () =>
    suite.run(
      dir,
      [process.execPath, "-e", 'process.on("SIGTERM",()=>{}); setInterval(()=>{},1000)'],
      { exit: 1 },
      { timeout: 150 },
    ),
  );
  assert.equal(passed, false);
  assert.equal(suite.report.commands[0].timedOut, true);
  assert.equal(suite.active.size, 0);
  assert.equal(suite.finish(), 1);
  assert.ok(existsSync(join(dir, "report/results.json")));
});

test("suite deadline clamps command lifetime and marks pending cases not_run", async (t) => {
  const dir = scratch(t);
  const suite = new Suite(join(dir, "report"), { budgetMs: 120, graceMs: 20 });
  await suite.case({ name: "long" }, () =>
    suite.run(dir, [process.execPath, "-e", "setInterval(()=>{},1000)"], {}, { timeout: 60_000 }),
  );
  await suite.case({ name: "pending" }, () => {
    assert.fail("must not run");
  });
  assert.equal(suite.report.cases[1].status, "not_run");
  assert.equal(suite.finish(), 1);
});

test("launch failure is a failed case and cannot satisfy a negative expectation", async (t) => {
  const dir = scratch(t);
  const suite = new Suite(join(dir, "report"));
  const passed = await suite.case({ name: "missing" }, () =>
    suite.run(dir, [join(dir, "no-such-command")], { exit: -2 }),
  );
  assert.equal(passed, false);
  assert.match(suite.report.commands[0].error, /ENOENT/);
});

test("cancellation reaps an owned child and records subsequent cases as not_run", async (t) => {
  const dir = scratch(t);
  const suite = new Suite(join(dir, "report"), { graceMs: 20 });
  const child = suite.start(dir, [process.execPath, "-e", "setInterval(()=>{},1000)"], {
    service: true,
  });
  await suite.cancel("Interrupted by SIGTERM");
  await child.closed;
  assert.equal(suite.active.size, 0);
  await suite.case({ name: "pending" }, () => assert.fail());
  assert.equal(suite.report.cases[0].status, "not_run");
  assert.equal(suite.finish(), 1);
});

test("normal completion never signals a closed process group", async (t) => {
  const dir = scratch(t);
  const suite = new Suite(join(dir, "report"));
  const original = process.kill.bind(process);
  const groupSignals = [];
  t.mock.method(process, "kill", (pid, signal) => {
    if (pid < 0) {
      groupSignals.push({ pid, signal });
      throw Object.assign(new Error("closed group"), { code: "EPERM" });
    }
    return original(pid, signal);
  });
  const passed = await suite.case({ name: "normal" }, () =>
    suite.run(dir, [process.execPath, "-e", ""]),
  );
  assert.equal(passed, true);
  assert.deepEqual(groupSignals, []);
  assert.equal(suite.report.error, undefined);
  assert.equal(suite.finish(), 0);
});

test("normal completion terminates an unref'd descendant in its process group", async (t) => {
  const dir = scratch(t);
  const pidFile = join(dir, "descendant.pid");
  const suite = new Suite(join(dir, "report"), { graceMs: 50 });
  let descendant;
  t.after(() => {
    if (descendant) {
      try {
        process.kill(descendant, "SIGKILL");
      } catch {}
    }
  });
  const script = `const {spawn}=require('node:child_process');const {writeFileSync}=require('node:fs');const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});child.unref();writeFileSync(${JSON.stringify(pidFile)},String(child.pid));`;
  const passed = await suite.case({ name: "descendant" }, () =>
    suite.run(dir, [process.execPath, "-e", script]),
  );
  descendant = Number(readFileSync(pidFile, "utf8"));
  assert.equal(passed, true);
  assert.equal(suite.finish(), 0);
  for (let attempt = 0; attempt < 30; attempt++) {
    let state;
    try {
      state = execFileSync("ps", ["-o", "stat=", "-p", String(descendant)], {
        encoding: "utf8",
      }).trim();
    } catch {
      return;
    }
    if (state.startsWith("Z")) return;
    await delay(20);
  }
  assert.fail("Descendant is still running after normal completion cleanup");
});

test("a denied process-group cleanup is recorded without losing the final report", async (t) => {
  const dir = scratch(t);
  const suite = new Suite(join(dir, "report"), { graceMs: 20 });
  const original = process.kill.bind(process);
  t.mock.method(process, "kill", (pid, signal) => {
    if (pid < 0) throw Object.assign(new Error("cleanup denied"), { code: "EPERM" });
    return original(pid, signal);
  });
  const passed = await suite.case({ name: "cleanup-error" }, () =>
    suite.run(dir, [process.execPath, "-e", "setInterval(()=>{},1000)"], {}, { timeout: 100 }),
  );
  assert.equal(passed, false);
  assert.equal(suite.active.size, 0);
  assert.match(suite.report.error, /cleanup/);
  assert.equal(suite.finish(), 1);
});

test("denied group signalling with inherited grandchild pipes has bounded cleanup", async (t) => {
  const dir = scratch(t);
  const suite = new Suite(join(dir, "report"), { graceMs: 30 });
  const original = process.kill.bind(process);
  let descendant;
  t.after(() => {
    if (descendant) {
      try {
        original(descendant, "SIGKILL");
      } catch {}
    }
  });
  t.mock.method(process, "kill", (pid, signal) => {
    if (pid < 0) throw Object.assign(new Error("cleanup denied"), { code: "EPERM" });
    return original(pid, signal);
  });
  const script =
    'const {spawn}=require("node:child_process");const child=spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"inherit"});console.log("DESCENDANT="+child.pid);setInterval(()=>{},1000);';
  const child = suite.start(dir, [process.execPath, "-e", script], { service: true });
  const readyDeadline = Date.now() + 5000;
  while (!child.output.includes("DESCENDANT=") && Date.now() < readyDeadline) await delay(10);
  descendant = Number(/DESCENDANT=(\d+)/.exec(child.output)?.[1]);
  assert.ok(descendant, "child must spawn its descendant before cancellation");
  const started = Date.now();
  await suite.cancel("test cancellation");
  assert.ok(Date.now() - started < 1000, "cleanup must not wait indefinitely for inherited pipes");
  assert.equal(child.record.cleanupIncomplete, true);
  assert.equal(suite.active.size, 0);
  assert.equal(suite.finish(), 1);
  assert.match(JSON.parse(readFileSync(join(dir, "report/results.json"))).error, /close deadline/);
});

test("timeout terminates package-manager grandchildren in the same process group", async (t) => {
  const dir = scratch(t);
  const pidFile = join(dir, "grandchild.pid");
  const suite = new Suite(join(dir, "report"), { graceMs: 50 });
  const script = `const {spawn}=require('node:child_process');const {writeFileSync}=require('node:fs');const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});writeFileSync(${JSON.stringify(pidFile)},String(child.pid));setInterval(()=>{},1000);`;
  await suite.case({ name: "grandchild" }, () =>
    suite.run(dir, [process.execPath, "-e", script], {}, { timeout: 300 }),
  );
  const pid = Number(readFileSync(pidFile, "utf8"));
  // POSIX init may briefly retain the terminated child as a zombie.
  for (let attempt = 0; attempt < 30; attempt++) {
    let state;
    try {
      state = execFileSync("ps", ["-o", "stat=", "-p", String(pid)], { encoding: "utf8" }).trim();
    } catch {
      return;
    }
    if (state.startsWith("Z")) return;
    await delay(20);
  }
  assert.fail("Grandchild is still running after timeout cleanup");
});

test("failure snapshot retains hidden config and exact fixture but omits caches and private env", (t) => {
  const dir = scratch(t);
  const suite = new Suite(join(dir, "report"));
  const project = join(dir, "project");
  writeFiles(project, {
    ".oxlintrc.json": "{}",
    ".env.example": "EXAMPLE=1",
    ".env.local": "secret",
    "node_modules/pkg/index.js": "cache",
    "out/a.js": "build",
  });
  const record = { template: "next-fullstack", name: "failed-case", project };
  const spec = { entries: { "out/a.js": "intentional fixture" } };
  snapshot(suite, record, spec);
  const contents = execFileSync("tar", ["-tzf", join(suite.directory, record.snapshot)], {
    encoding: "utf8",
  });
  assert.match(contents, /project\/\.oxlintrc\.json/);
  assert.match(contents, /project\/\.env\.example/);
  assert.match(contents, /fixture\/out\/a\.js/);
  assert.doesNotMatch(contents, /\.env\.local|node_modules|project\/out\//);
});

test("a negative case requires the intended diagnostic, not merely a failed command", () => {
  assert.equal(
    matchesOutcome(
      { code: 1, output: "Module not found" },
      {
        exit: 1,
        diagnostics: ["server-only", "Client Component"],
      },
    ),
    false,
  );
});

test("a forbidden diagnostic invalidates an otherwise matching failure", () => {
  assert.equal(
    matchesOutcome(
      { code: 1, output: "server-only Client Component Module not found" },
      {
        exit: 1,
        diagnostics: ["server-only"],
        forbidden: ["Module not found"],
      },
    ),
    false,
  );
});

test("timeout, signal and launch errors never satisfy expected failure", () => {
  for (const details of [{ timedOut: true }, { signal: "SIGTERM" }, { error: "ENOENT" }]) {
    assert.equal(
      matchesOutcome(
        { code: 1, output: "expected rule", ...details },
        {
          exit: 1,
          diagnostics: ["expected rule"],
        },
      ),
      false,
    );
  }
});

test("unexpected success fails and the intended diagnostic passes", () => {
  const expected = { exit: 1, diagnostics: ["no-floating-promises"] };
  assert.equal(matchesOutcome({ code: 0, output: "" }, expected), false);
  assert.equal(matchesOutcome({ code: 1, output: "no-floating-promises" }, expected), true);
});
