'use client';
import { secret } from '../bridge';
export function Leak() { return <div>{secret}</div>; }
