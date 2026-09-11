"use client";
import { readFileSync } from "node:fs";
export const data = readFileSync("package.json", "utf8");
