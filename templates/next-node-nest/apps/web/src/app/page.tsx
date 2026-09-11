import * as stylex from "@stylexjs/stylex";

import { HealthCheck } from "@/client/health-check";

export default function Home() {
  return (
    <main {...stylex.props(styles.main)}>
      <h1>Next.js + NestJS</h1>
      <p>The application is ready. Run a health check to verify the API.</p>
      <HealthCheck />
    </main>
  );
}

const styles = stylex.create({
  main: { maxWidth: "42rem", margin: "0 auto" },
});
