"use client";
import { secret } from "@/shared/verification-helper";
export function Boundary() { return <p>{secret}</p>; }
