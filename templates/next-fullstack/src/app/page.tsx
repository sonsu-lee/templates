import { HealthCheck } from "@/client/health-check";

export default function Home() {
  return (
    <main>
      <h1>Next.js fullstack</h1>
      <p>The application is ready. Run a health check to verify the API.</p>
      <HealthCheck />
    </main>
  );
}
