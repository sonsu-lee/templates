import { readFileSync } from 'node:fs';
export const content = readFileSync(new URL('../content.txt', import.meta.url), 'utf8');
