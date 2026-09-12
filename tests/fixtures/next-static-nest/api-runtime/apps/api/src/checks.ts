import { readFileSync } from 'node:fs';
export function check(): void {
  readFileSync('package.json');
  process.exit(1);
}
