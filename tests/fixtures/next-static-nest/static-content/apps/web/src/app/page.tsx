import { readFileSync } from 'node:fs';
import 'server-only';
export default function Home() {
  return <main>{readFileSync('content.txt', 'utf8')}</main>;
}
