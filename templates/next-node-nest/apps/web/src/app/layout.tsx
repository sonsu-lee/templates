import "./globals.css";
import * as stylex from "@stylexjs/stylex";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Application template",
  description: "A minimal application with an independent lint configuration.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body {...stylex.props(styles.body)}>{children}</body>
    </html>
  );
}

const styles = stylex.create({
  body: { fontFamily: "system-ui, sans-serif", margin: 0, padding: "3rem 1.5rem", lineHeight: 1.6 },
});
