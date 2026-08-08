import type { HealthResponse } from "@martylab/shared";

const placeholderHealth: HealthResponse = {
  status: "ok",
  service: "martylab-backend",
  timestamp: new Date(0).toISOString(),
};

export function App() {
  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Martylab v0.1</p>
        <h1>Martylab</h1>
        <p className="lead">
          Hub d&apos;applications personnel self-hosted. Une interface, des
          applications indépendantes.
        </p>
      </header>

      <section className="status" aria-labelledby="foundation-status">
        <h2 id="foundation-status">Fondations</h2>
        <ul>
          <li>Portal React + Vite + TypeScript initialisé</li>
          <li>
            Contrat partagé disponible via <code>@martylab/shared</code>
          </li>
          <li>
            Health contract ready: <code>{placeholderHealth.service}</code>
          </li>
        </ul>
      </section>
    </main>
  );
}
