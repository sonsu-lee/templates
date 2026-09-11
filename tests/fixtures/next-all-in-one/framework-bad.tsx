"use client";
import { useState } from "react";
export function InvalidComponent({ enabled }: { enabled: boolean }) {
  if (enabled) useState(false);
  return (
    <div>
      <img src="/example.png" />
      <script src="/example.js" />
    </div>
  );
}
