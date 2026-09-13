import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readJson, safePath } from "./verification.mjs";

export const templates = {
  "next-fullstack": { flags: ["--template", "next"], web: ".", api: null },
  "next-node-nest": {
    flags: ["--template", "next-nest", "--web", "node"],
    web: "apps/web",
    api: "apps/api",
  },
  "next-static-nest": {
    flags: ["--template", "next-nest", "--web", "static"],
    web: "apps/web",
    api: "apps/api",
    static: true,
  },
};

export function loadCases(source, template) {
  const base = join(source, "tests/fixtures");
  const cases = readJson(join(base, template, "cases.json"));
  assert.ok(cases.length, `Empty case catalog: ${template}`);
  assert.equal(new Set(cases.map((c) => c.name)).size, cases.length, "Duplicate case names");
  return cases.map((spec) => {
    assert.match(spec.name, /^[a-z0-9-]+$/);
    assert.ok(spec.files.length, `Empty fixture: ${spec.name}`);
    const root = safePath(base, spec.fixture ?? `${template}/${spec.name}`);
    const entries = Object.fromEntries(
      spec.files.map((file) => [file, readFileSync(safePath(root, file), "utf8")]),
    );
    return { ...spec, entries };
  });
}

export function assertDiagnosticFiles(output, expected) {
  if (!expected || Object.keys(expected).length === 0) return;
  // pnpm prints script banners before Oxlint's JSON document.
  const begin = output.indexOf("{");
  const end = output.lastIndexOf("}");
  const parsed = JSON.parse(output.slice(begin, end + 1));
  const diagnostics = parsed.diagnostics;
  assert.ok(Array.isArray(diagnostics), "Missing Oxlint diagnostics array");
  for (const [file, rules] of Object.entries(expected)) {
    const suffix = file.replace(/^apps\/(web|api)\//, "");
    for (const expectedRule of rules) {
      const rule = typeof expectedRule === "string" ? expectedRule : expectedRule.rule;
      assert.ok(
        diagnostics.some((d) => {
          const name = d.filename ?? d.labels?.[0]?.filename;
          return (
            (name === suffix || name?.endsWith(`/${suffix}`)) &&
            d.code?.endsWith(`(${rule})`) &&
            (typeof expectedRule === "string" || d.message.includes(expectedRule.message))
          );
        }),
        `Missing ${JSON.stringify(expectedRule)} diagnostic for fixture file: ${file}`,
      );
    }
  }
}
