import { readFileSync } from "node:fs";
export function readConfiguration() {
  return readFileSync("package.json", "utf8");
}
