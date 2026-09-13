'use client';
import { useState } from 'react';
export function Rules({ enabled }: { enabled: boolean }) {
  if (enabled) useState(0);
  return <div><img src="/missing.png" /><script src="https://example.com/sync.js" /></div>;
}
