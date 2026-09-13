import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readJson, writeFiles } from "./verification.mjs";

export async function verifyLsp(suite, project, template, record) {
  const folderNames = template.api
    ? JSON.parse(
        readFileSync(join(project, "project.code-workspace"), "utf8").replace(/,\s*([}\]])/g, "$1"),
      ).folders
    : [{ name: "fullstack", path: "." }];
  assert.deepEqual(
    folderNames.map((f) => f.path),
    template.api ? ["apps/web", "apps/api"] : ["."],
  );
  const folders = folderNames.map((folder) => {
    const path = join(project, folder.path);
    const settings = readJson(join(path, ".vscode/settings.json"));
    const typeAware = folder.path !== template.api;
    assert.equal(settings["oxc.typeAware"], typeAware);
    writeFiles(path, {
      "src/verification-lsp.ts": "export function check() { Promise.resolve(1); }\ndebugger;\n",
    });
    return { ...folder, path, uri: pathToFileURL(path).href, typeAware };
  });
  const server = suite.start(
    folders[0].path,
    [join(folders[0].path, "node_modules/.bin/oxlint"), "--lsp"],
    { service: true, timeout: 120_000 },
  );
  let buffer = Buffer.alloc(0);
  let sequence = 0;
  const pending = new Map();
  const transcript = [];
  record.lsp = { transcript, diagnostics: [] };
  const send = (message) => {
    const body = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...message }));
    transcript.push({ direction: "send", message });
    suite.save();
    server.child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
    server.child.stdin.write(body);
  };
  const request = (method, params) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(
        () => {
          pending.delete(id);
          reject(new Error(`LSP ${method} timeout`));
        },
        Math.min(30_000, suite.remaining()),
      );
      pending.set(id, { resolve, reject, timer });
      send({ id, method, params });
    });
  const rejectAll = (error) => {
    for (const item of pending.values()) {
      clearTimeout(item.timer);
      item.reject(error);
    }
    pending.clear();
  };
  server.child.stdin.on("error", rejectAll);
  server.closed.then(() => rejectAll(new Error("LSP exited before completing a request")));
  server.child.stdout.on("data", (chunk) => {
    try {
      buffer = Buffer.concat([buffer, chunk]);
      for (;;) {
        const split = buffer.indexOf("\r\n\r\n");
        if (split < 0) return;
        const length = Number(
          /Content-Length: (\d+)/i.exec(buffer.subarray(0, split).toString())?.[1],
        );
        assert.ok(Number.isFinite(length) && length <= 8 * 1024 * 1024, "Invalid LSP frame");
        if (buffer.length < split + 4 + length) return;
        const message = JSON.parse(buffer.subarray(split + 4, split + 4 + length));
        buffer = buffer.subarray(split + 4 + length);
        transcript.push({ direction: "receive", message });
        suite.save();
        const item = pending.get(message.id);
        if (item && !message.method) {
          clearTimeout(item.timer);
          pending.delete(message.id);
          if (message.error) item.reject(new Error(JSON.stringify(message.error)));
          else item.resolve(message.result);
        } else if (message.method && message.id !== undefined) {
          // Initialization supplies folder settings; acknowledge diagnostic refresh.
          send({ id: message.id, result: null });
        }
      }
    } catch (error) {
      rejectAll(error);
    }
  });
  try {
    const initialized = await request("initialize", {
      processId: process.pid,
      rootUri: null,
      workspaceFolders: folders.map(({ uri, name }) => ({ uri, name })),
      capabilities: {
        textDocument: { diagnostic: { dynamicRegistration: false } },
        workspace: { diagnostics: { refreshSupport: true } },
      },
      initializationOptions: folders.map((f) => ({
        workspaceUri: f.uri,
        options: { typeAware: f.typeAware },
      })),
    });
    assert.ok(initialized.capabilities.diagnosticProvider, "LSP must support pull diagnostics");
    send({ method: "initialized", params: {} });
    for (const folder of folders) {
      const file = join(folder.path, "src/verification-lsp.ts");
      const uri = pathToFileURL(file).href;
      send({
        method: "textDocument/didOpen",
        params: {
          textDocument: {
            uri,
            languageId: "typescript",
            version: 1,
            text: readFileSync(file, "utf8"),
          },
        },
      });
      const result = await request("textDocument/diagnostic", { textDocument: { uri } });
      const diagnostics = JSON.stringify(result.items);
      assert.match(diagnostics, /no-debugger/, `${folder.name}: ordinary diagnostic missing`);
      if (folder.typeAware) assert.match(diagnostics, /no-floating-promises/);
      else assert.doesNotMatch(diagnostics, /no-floating-promises/);
      record.lsp.diagnostics.push({ folder: folder.name, items: result.items });
    }
    await request("shutdown", null);
    send({ method: "exit" });
  } finally {
    rejectAll(new Error("LSP verification finished"));
    await server.stop();
  }
}
