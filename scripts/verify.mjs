#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { release, tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Suite,
  assertOutsideGit,
  files,
  hash,
  readJson,
  safePath,
  sourceFiles,
  writeFiles,
} from "./verification.mjs";
import { assertDiagnosticFiles, loadCases, templates } from "./cases.mjs";
import { freePort, runtime, safeFix } from "./runtime.mjs";
import { verifyLsp } from "./lsp.mjs";

const source = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function parseArgs(args) {
  const result = {
    selected: Object.keys(templates),
    binary: join(source, "target/release/sonsu"),
  };
  let selected = false;
  const options = new Set();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help") return { help: true };
    if (arg === "--binary" || arg === "--output-dir") {
      assert.ok(
        !options.has(arg) && args[i + 1] && !args[i + 1].startsWith("--"),
        `Expected one value for ${arg}`,
      );
      options.add(arg);
      result[arg === "--binary" ? "binary" : "outputDir"] = resolve(args[++i]);
    } else {
      assert.ok(
        !selected && Object.hasOwn(templates, arg),
        `Expected one of: ${Object.keys(templates).join(", ")}`,
      );
      selected = true;
      result.selected = [arg];
    }
  }
  return result;
}

export function snapshot(suite, record, spec) {
  if (!record.project || !existsSync(record.project)) return;
  const name = `${record.template}-${record.name}`;
  const stage = join(suite.directory, `${name}-snapshot`);
  mkdirSync(stage);
  cpSync(record.project, join(stage, "project"), {
    recursive: true,
    filter: (path) => {
      const parts = relative(record.project, path).split("/");
      return !parts.some(
        (p) =>
          ["node_modules", ".next", "dist", "out", "coverage", ".git"].includes(p) ||
          (p.startsWith(".env") && p !== ".env.example") ||
          p.endsWith(".tsbuildinfo"),
      );
    },
  });
  if (spec?.entries) writeFiles(join(stage, "fixture"), spec.entries);
  writeFileSync(join(stage, "case.json"), JSON.stringify(spec ?? { name: record.name }, null, 2));
  const archive = `${name}.tar.gz`;
  execFileSync("tar", ["-czf", join(suite.directory, archive), "-C", stage, "."], {
    timeout: 60_000,
  });
  rmSync(stage, { recursive: true });
  record.snapshot = archive;
  suite.save();
}

async function baseline(suite, project, template) {
  for (const cmd of ["lint", "format:check", ...(template.api ? ["typecheck"] : []), "build"]) {
    await suite.run(project, ["pnpm", cmd], {}, { timeout: cmd === "build" ? 600_000 : 120_000 });
  }
  if (template.api) {
    for (const directory of [template.web, template.api]) {
      for (const cmd of [
        "lint",
        "format:check",
        ...(directory === template.api ? ["typecheck"] : []),
        "build",
      ]) {
        await suite.run(
          join(project, directory),
          ["pnpm", cmd],
          {},
          { timeout: cmd === "build" ? 600_000 : 120_000 },
        );
      }
    }
  }
}

async function fixture(suite, project, template, spec, record) {
  writeFiles(project, spec.entries);
  record.fixtureHashes = Object.fromEntries(
    Object.entries(spec.entries).map(([path, value]) => [path, hash(value)]),
  );
  for (const argv of spec.prepare ?? []) await suite.run(project, argv, {}, { timeout: 600_000 });
  for (const step of spec.steps) {
    const argv = Object.keys(step.diagnosticFiles ?? {}).length
      ? [...step.argv, "--format", "json"]
      : step.argv;
    const result = await suite.run(project, argv, step, {
      timeout: step.argv.includes("build") ? 600_000 : 120_000,
    });
    assertDiagnosticFiles(result.output, step.diagnosticFiles);
    for (const [file, content] of Object.entries(step.outputs ?? {})) {
      assert.ok(
        readFileSync(safePath(project, file), "utf8").includes(content),
        `Output mismatch: ${file}`,
      );
    }
  }
  if (spec.hook === "safe-fix") await safeFix(suite, project, template, record);
  if (spec.hook === "excluded-output") {
    const path = join(project, template.web, "src/verification-control.ts");
    writeFileSync(path, "debugger;\n");
    await suite.run(join(project, template.web), ["pnpm", "lint"], {
      exit: 1,
      diagnostics: ["no-debugger"],
    });
  }
}

export async function verify(options) {
  const output =
    options.outputDir ?? join(source, ".cache/verification", `${Date.now()}-${process.pid}`);
  assert.ok(!existsSync(output), `Report directory already exists: ${output}`);
  const suite = new Suite(output);
  let scratch;
  const cancel = (signal) => {
    void suite.cancel(`Interrupted by ${signal}`);
  };
  const onInt = () => cancel("SIGINT");
  const onTerm = () => cancel("SIGTERM");
  process.on("SIGINT", onInt);
  process.on("SIGTERM", onTerm);
  try {
    assert.ok(
      ["darwin", "linux"].includes(process.platform),
      "Supported verification hosts: macOS and Linux",
    );
    assert.ok(Number(process.versions.node.split(".")[0]) >= 24, "Node 24 or later is required");
    const binary = realpathSync(options.binary);
    scratch = realpathSync(mkdtempSync(join(tmpdir(), "sonsu-verify-")));
    assertOutsideGit(scratch);
    Object.assign(suite.report, {
      source,
      sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: source,
        encoding: "utf8",
      }).trim(),
      platform: process.platform,
      osRelease: release(),
      arch: process.arch,
      node: process.version,
      verifierHashes: files(join(source, "scripts")),
      binary,
      binarySha256: hash(readFileSync(binary)),
      scratch,
    });
    const catalogs = Object.fromEntries(
      options.selected.map((name) => [name, loadCases(source, name)]),
    );
    for (const name of options.selected) {
      for (const id of ["baseline", ...catalogs[name].map((c) => c.name), "runtime", "lsp"]) {
        suite.report.cases.push({ template: name, name: id, status: "pending" });
      }
    }
    suite.save();
    await suite.run(scratch, [binary, "--version"]);
    for (const name of options.selected) {
      const template = templates[name];
      const expectedSource = sourceFiles(source, name);
      let baselinePassed = false;
      for (const record of suite.report.cases.filter((c) => c.template === name)) {
        const spec = catalogs[name].find((c) => c.name === record.name);
        const passed = await suite.case(
          record,
          async () => {
            const project = join(scratch, `${name}-${record.name}`);
            record.project = project;
            await suite.run(scratch, [binary, "create", project, ...template.flags]);
            assert.deepEqual(
              files(project),
              expectedSource,
              "Generated files differ from the tracked template",
            );
            record.sourceHashes = expectedSource;
            const manifest = readJson(join(project, "package.json"));
            const version = manifest.packageManager.match(/^pnpm@([^+]+)(?:\+.*)?$/)?.[1];
            assert.ok(version, "Template must pin pnpm");
            const observed = await suite.run(project, ["pnpm", "--version"]);
            const versions = observed.output.match(/^\d+\.\d+\.\d+(?:-[^\n]*)?$/gm);
            assert.equal(versions?.at(-1), version, "pnpm must match the generated manifest");
            record.pnpm = version;
            await suite.run(
              project,
              ["pnpm", "install", "--frozen-lockfile"],
              {},
              { timeout: 600_000 },
            );
            record.tools = {};
            for (const folder of [template.web, ...(template.api ? [template.api] : [])]) {
              const app = join(project, folder);
              record.tools[folder] = Object.fromEntries(
                ["typescript", "oxlint", "oxfmt", "oxlint-tsgolint", "next", "@nestjs/core"]
                  .filter((name) => existsSync(join(app, "node_modules", name, "package.json")))
                  .map((name) => [
                    name,
                    readJson(join(app, "node_modules", name, "package.json")).version,
                  ]),
              );
            }
            if (record.name === "baseline") await baseline(suite, project, template);
            else if (record.name === "runtime") {
              const ports = { api: await freePort(), web: await freePort() };
              await suite.run(
                project,
                ["pnpm", "build"],
                {},
                { timeout: 600_000, env: { NEXT_PUBLIC_API_URL: `http://127.0.0.1:${ports.api}` } },
              );
              await runtime(suite, project, template, record, ports);
            } else if (record.name === "lsp") {
              await suite.run(project, ["pnpm", "lint"]);
              await verifyLsp(suite, project, template, record);
            } else await fixture(suite, project, template, spec, record);
          },
          record.name === "baseline" || baselinePassed,
        );
        if (record.name === "baseline") baselinePassed = passed;
        if (passed && record.project) rmSync(record.project, { recursive: true, force: true });
        else if (record.status === "failed") {
          try {
            snapshot(suite, record, spec);
          } catch (error) {
            record.snapshotError = error.message;
            suite.save();
          }
        }
      }
    }
  } catch (error) {
    suite.report.error = error.stack ?? String(error);
    console.error(error.message);
  } finally {
    await Promise.all([...suite.active].map((child) => child.stop()));
    const code = suite.finish();
    if (scratch && code === 0) rmSync(scratch, { recursive: true, force: true });
    process.off("SIGINT", onInt);
    process.off("SIGTERM", onTerm);
    console.log(`RESULT ${suite.report.status}: ${join(output, "results.json")}`);
  }
  return suite.report.status === "passed" ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
  if (options?.help)
    console.log(
      "node scripts/verify.mjs [next-fullstack|next-node-nest|next-static-nest] [--binary path] [--output-dir path]",
    );
  else if (options) {
    try {
      process.exitCode = await verify(options);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
