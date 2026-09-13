import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createServer as createSocketServer } from "node:net";
import { readFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { hash } from "./verification.mjs";

async function listen(server) {
  await new Promise((done, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", done);
  });
  return server.address().port;
}

export async function freePort() {
  const server = createSocketServer();
  const port = await listen(server);
  await new Promise((done) => server.close(done));
  return port;
}

export async function staticServer(root) {
  const absolute = resolve(root);
  const server = createServer((req, res) => {
    try {
      const path = resolve(
        absolute,
        `.${decodeURIComponent(new URL(req.url, "http://local").pathname)}`,
      );
      assert.ok(path === absolute || path.startsWith(`${absolute}${sep}`));
      const file = statSync(path).isDirectory() ? join(path, "index.html") : path;
      const body = readFileSync(file);
      res.writeHead(200, {
        "content-type": file.endsWith(".html") ? "text/html" : "application/octet-stream",
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  const port = await listen(server);
  return {
    port,
    stop: async () => {
      server.closeAllConnections();
      await new Promise((done) => server.close(done));
    },
  };
}

async function http(suite, record, url, { json, text, status = 200, headers = {}, cors } = {}) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(Math.max(1, Math.min(5000, Math.floor(suite.remaining())))),
  });
  const body = await response.text();
  (record.http ??= []).push({
    url,
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: body.slice(0, 1000),
    bodySha256: hash(body),
  });
  suite.save();
  assert.equal(response.status, status, url);
  if (json) assert.deepEqual(JSON.parse(body), json);
  if (text) assert.ok(body.includes(text), `${url}: missing ${text}`);
  if (cors) assert.equal(response.headers.get("access-control-allow-origin"), cors);
  return body;
}

async function ready(suite, child, url) {
  const deadline = Date.now() + Math.min(60_000, suite.remaining());
  while (Date.now() < deadline) {
    suite.remaining();
    assert.equal(child.child.exitCode, null, `Server exited: ${child.output}`);
    assert.equal(child.child.signalCode, null, `Server signalled: ${child.output}`);
    assert.ok(!child.record.error, child.record.error);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) });
      await response.arrayBuffer();
      if (response.ok) return;
    } catch {
      /* Wait only for readiness, never retry failed assertions. */
    }
    await delay(100);
  }
  throw new Error(`Server readiness timeout: ${url}\n${child.output}`);
}

export async function metadata(suite, api) {
  await suite.run(api, [
    process.execPath,
    "-e",
    'require("reflect-metadata"); const assert=require("node:assert/strict"); const {HealthController}=require("./dist/health.controller"); const {HealthService}=require("./dist/health.service"); assert.equal(Reflect.getMetadata("design:paramtypes",HealthController)[0],HealthService);',
  ]);
}

export async function apiHealth(suite, project, template, record) {
  const port = await freePort();
  const api = suite.start(join(project, template.api), [process.execPath, "dist/main.js"], {
    service: true,
    env: { PORT: String(port) },
  });
  api.child.stdin.end();
  try {
    await ready(suite, api, `http://127.0.0.1:${port}/health`);
    await http(suite, record, `http://127.0.0.1:${port}/health`, { json: { status: "ok" } });
  } finally {
    await api.stop();
  }
}

export async function runtime(suite, project, template, record, ports) {
  const owned = [];
  let staticHost;
  try {
    const web = join(project, template.web);
    if (template.static) {
      staticHost = await staticServer(join(web, "out"));
      ports.web = staticHost.port;
    }
    if (template.api) {
      await metadata(suite, join(project, template.api));
      const api = suite.start(join(project, template.api), [process.execPath, "dist/main.js"], {
        service: true,
        env: { PORT: String(ports.api), WEB_ORIGIN: `http://127.0.0.1:${ports.web}` },
      });
      api.child.stdin.end();
      owned.push(api);
      await ready(suite, api, `http://127.0.0.1:${ports.api}/health`);
      await http(suite, record, `http://127.0.0.1:${ports.api}/health`, {
        json: { status: "ok" },
        ...(template.static
          ? {
              headers: { Origin: `http://127.0.0.1:${ports.web}` },
              cors: `http://127.0.0.1:${ports.web}`,
            }
          : {}),
      });
    }
    const webUrl = `http://127.0.0.1:${ports.web}`;
    if (!template.static) {
      const next = suite.start(
        web,
        [
          process.execPath,
          "node_modules/next/dist/bin/next",
          "start",
          "--hostname",
          "127.0.0.1",
          "--port",
          String(ports.web),
        ],
        {
          service: true,
          env: { API_URL: `http://127.0.0.1:${ports.api}` },
        },
      );
      next.child.stdin.end();
      owned.push(next);
      await ready(suite, next, webUrl);
    }
    const html = await http(suite, record, webUrl, { text: "<h1" });
    if (template.static) {
      const asset = /(?:src|href)="([^" ]+\.(?:js|css)(?:\?[^" ]*)?)"/.exec(html)?.[1];
      assert.ok(asset, "Static page must reference an asset");
      await http(suite, record, new URL(asset, webUrl).href);
      await http(suite, record, `${webUrl}/missing-verification-route`, { status: 404 });
    } else {
      await http(suite, record, `${webUrl}/api/health`, { json: { status: "ok" } });
    }
  } finally {
    await Promise.all(owned.map((child) => child.stop()));
    await staticHost?.stop();
  }
}

export async function safeFix(suite, project, template, record) {
  const api = join(project, template.api);
  const file = join(api, "src/health.controller.ts");
  const before = readFileSync(file);
  async function check() {
    await suite.run(api, ["pnpm", "typecheck"]);
    await suite.run(api, ["pnpm", "build"], {}, { timeout: 600_000 });
    await metadata(suite, api);
    await apiHealth(suite, project, template, record);
  }
  await check();
  await suite.run(project, ["pnpm", "lint:fix"]);
  const after = readFileSync(file);
  assert.notDeepEqual(after, before, "Safe fix must actually edit imports");
  await check();
  await suite.run(project, ["pnpm", "lint:fix"]);
  assert.deepEqual(readFileSync(file), after, "Safe fix must be idempotent");
  record.fix = { before: before.toString(), after: after.toString() };
}
