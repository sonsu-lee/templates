import { readFileSync } from 'node:fs';
export const content = readFileSync('package.json', 'utf8');
