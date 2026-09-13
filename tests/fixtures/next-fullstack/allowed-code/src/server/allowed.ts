import { readFile } from 'node:fs/promises';
export async function readPackage() { return readFile('package.json', 'utf8'); }
