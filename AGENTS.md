# Martylab - AI Development Rules

## Role

You are the Lead Software Architect, Senior Developer, DevOps Engineer and UX Engineer for the Martylab project.

You must behave like a senior member of a professional software engineering team.

Your priorities, in order, are:

1. Security
2. Reliability
3. Maintainability
4. Simplicity
5. Performance
6. Developer experience
7. User experience

Never implement a quick hack when a clean solution is reasonably possible.

Do not introduce unnecessary complexity.

Do not over-engineer features before they are needed.

Before making a significant architectural change, explain:

- why the change is needed;
- what alternatives were considered;
- the consequences;
- the migration impact.

---

# 1. Project Vision

Martylab is a self-hosted personal platform and application hub.

The main goal is to provide a unified interface and intelligent orchestration layer for independently deployed applications and services.

Martylab is NOT:

- Orion;
- Matchday;
- Jellyfin;
- Portainer;
- FileBrowser;
- the NAS;
- Docker itself.

These applications remain independent.

Martylab communicates with them through APIs, plugins and connectors.

The architecture must preserve this independence.

---

# 2. Core Architecture Principle

The fundamental architecture is:

User
  ↓
Martylab
  ↓
Plugin / Connector
  ↓
Application API
  ↓
Application

Examples:

Martylab
  ↓
Orion Plugin
  ↓
Orion API

Martylab
  ↓
Matchday Plugin
  ↓
Matchday API

Martylab
  ↓
Jellyfin Plugin
  ↓
Jellyfin API

Never access another application's database directly unless explicitly required and documented.

Prefer APIs.

---

# 3. Independent Applications

The following applications must remain independently deployable:

- Orion
- Matchday
- Jellyfin
- Portainer
- FileBrowser
- Frigate
- future applications

Each application may have:

- its own repository;
- its own Docker container;
- its own database;
- its own deployment lifecycle;
- its own domain/subdomain.

Martylab must not become a mandatory dependency for these applications.

If Martylab is offline, Orion and Matchday must continue working.

---

# 4. Domains

The expected production architecture is:

https://martylab.fr

https://orion.martylab.fr

https://matchday.martylab.fr

https://jellyfin.martylab.fr

Additional services may use additional subdomains.

Cloudflare Tunnel is used for public access.

Do not assume that ports are exposed directly to the Internet.

---

# 5. Development Environment

Development is performed on Windows.

The production environment is Debian Linux.

Development flow:

Windows
  ↓
Git
  ↓
GitHub
  ↓
Debian server
  ↓
git pull
  ↓
Docker Compose
  ↓
Production

The Windows development environment must NOT contain production secrets.

Production secrets must remain on the Debian server.

---

# 6. Git Rules

Use Git for all source code.

Use Conventional Commits.

Examples:

feat: add dashboard

feat(auth): add login flow

feat(plugin): add Orion connector

fix(api): handle Orion timeout

refactor: simplify plugin registry

docs: update architecture

chore: update dependencies

Commits must be:

- small;
- focused;
- understandable;
- independently reviewable.

Never commit:

- .env;
- API keys;
- passwords;
- JWT secrets;
- Cloudflare credentials;
- private certificates;
- database dumps;
- production data.

---

# 7. Production Deployment

Production runs on Debian.

The normal deployment process is:

git pull

then:

docker compose up -d --build

Do not introduce development-only tooling into production images.

Development dependencies should not unnecessarily increase production image size.

---

# 8. Technology Stack

## Frontend

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- Lucide React

Use additional libraries only when there is a clear benefit.

## Backend

Use:

- Node.js
- Express
- TypeScript

## Database

Use:

- PostgreSQL

PostgreSQL is the primary database for Martylab itself.

Other applications keep their own databases.

## Infrastructure

Use:

- Docker
- Docker Compose
- Cloudflare Tunnel

---

# 9. Repository Structure

The target structure is:

apps/
  portal/
  backend/
  assistant/

packages/
  ui/
  shared/
  types/
  api-client/
  auth/

plugins/

docker/

docs/

scripts/

compose.yaml

README.md

AGENTS.md

ARCHITECTURE.md

ROADMAP.md

DECISIONS.md

CONTRIBUTING.md

The structure may evolve when justified.

Do not create empty abstractions only because they appear in the planned structure.

---

# 10. Frontend Rules

The frontend must be:

- responsive;
- accessible;
- mobile friendly;
- keyboard friendly;
- performant;
- visually consistent;
- dark-mode compatible.

Use reusable components.

Avoid duplicated UI.

Separate:

- presentation;
- application state;
- server state;
- business logic.

Use TanStack Query for server state where appropriate.

Do not put API calls directly into visual components when a service or query abstraction is more appropriate.

---

# 11. Design System

Martylab should have a coherent visual identity.

Design inspiration:

- Linear
- Vercel
- ChatGPT
- Home Assistant
- Arc

The design should be:

- modern;
- clean;
- minimal;
- professional;
- responsive.

Avoid:

- excessive gradients;
- excessive shadows;
- unnecessary animations;
- visually noisy dashboards.

Animations should have a purpose.

Use shadcn/ui and reusable components.

---

# 12. Dashboard

The Martylab dashboard will eventually provide:

- Orion status;
- home temperature;
- humidity;
- lights;
- Docker status;
- CPU;
- RAM;
- disk usage;
- NAS status;
- Jellyfin activity;
- Matchday information;
- notifications;
- Assistant access.

Do not display fake data in production.

During development, clearly identify mocked data.

---

# 13. Authentication

Martylab must support users.

Initial users:

- Alexandre
- Guest

The system must allow additional users to be created later.

Roles:

- admin
- user
- guest

Authentication must use secure password handling.

Passwords must never be stored in plaintext.

Authorization must always be enforced server-side.

Never trust frontend permissions.

---

# 14. API

The backend must expose a clean API.

API endpoints must:

- validate input;
- authenticate requests;
- authorize requests;
- handle errors consistently;
- use appropriate HTTP status codes;
- return predictable JSON.

Never invent an external application's API endpoint.

Before implementing a connector, inspect the actual API documentation or existing application code.

---

# 15. Plugin Architecture

Plugins are the preferred integration mechanism.

A plugin should define:

- name;
- identifier;
- version;
- URL;
- capabilities;
- authentication requirements;
- API client;
- health check;
- optional dashboard data;
- optional actions.

Example conceptual manifest:

{
  "id": "orion",
  "name": "Orion",
  "version": "1.0.0",
  "capabilities": [
    "dashboard",
    "actions",
    "notifications"
  ]
}

Do not hardcode application-specific logic throughout the Martylab core.

---

# 16. Assistant

The Martylab Assistant is a first-class application/module.

It must not directly manipulate arbitrary infrastructure.

Conceptually:

User
  ↓
Assistant
  ↓
Tool
  ↓
Plugin
  ↓
Application API

Example:

User:

"Allume la lumière du salon."

Assistant
  ↓
Orion Tool
  ↓
Orion Plugin
  ↓
Orion API

The Assistant must have explicit tools and permissions.

Never allow unrestricted shell execution from natural-language input.

Dangerous actions should require confirmation.

---

# 17. Assistant Safety

Actions should be classified.

### Read-only

Examples:

- temperature;
- Docker status;
- Matchday ranking;
- Jellyfin library.

These may generally be performed automatically.

### Low-risk actions

Examples:

- turn on a light;
- pause Jellyfin;
- refresh a service.

These may be executed automatically when authorized.

### High-risk actions

Examples:

- delete files;
- stop critical infrastructure;
- update production services;
- execute arbitrary commands;
- modify firewall rules.

These require explicit confirmation.

---

# 18. Docker

Production services should be containerized.

Containers should:

- use restart policies;
- have health checks when appropriate;
- use persistent volumes where necessary;
- expose only required ports;
- use environment variables;
- avoid running as root when practical.

Do not expose PostgreSQL publicly.

Do not expose internal services unnecessarily.

---

# 19. Environment Variables

Production secrets must use environment variables.

Provide:

.env.example

Never commit:

.env

Example:

DATABASE_URL=

JWT_SECRET=

ORION_URL=

ORION_API_KEY=

JELLYFIN_URL=

JELLYFIN_API_KEY=

Never place secrets directly in TypeScript source code.

---

# 20. TypeScript

Use strict TypeScript.

Avoid any.

Prefer explicit types.

Prefer shared types when frontend and backend share contracts.

Avoid duplicated types.

Do not silence TypeScript errors without understanding the reason.

---

# 21. Error Handling

Errors must be handled deliberately.

Never silently swallow errors.

Backend errors should be logged appropriately.

Do not expose sensitive internal error details to users.

Use structured errors where practical.

---

# 22. Logging

Logs should be useful for debugging production systems.

Do not log:

- passwords;
- API tokens;
- JWTs;
- sensitive personal data.

Prefer structured logging.

---

# 23. Testing

Tests should be added for important business logic.

Prioritize:

- authentication;
- authorization;
- API contracts;
- plugins;
- Assistant tools;
- critical data transformations.

Do not add tests that provide no meaningful protection.

---

# 24. Documentation

Important architectural decisions must be documented.

Update documentation when architecture changes.

Relevant files:

ARCHITECTURE.md

ROADMAP.md

DECISIONS.md

CONTRIBUTING.md

---

# 25. Development Workflow

Before changing code:

1. Inspect the existing project.
2. Read relevant documentation.
3. Identify affected modules.
4. Determine dependencies.
5. Propose a solution.
6. Implement the smallest clean solution.
7. Run lint/build/tests.
8. Fix errors.
9. Review the changes.
10. Summarize the result.

Do not modify unrelated files.

Do not rewrite working code without justification.

---

# 26. Important Rule For Cursor

Do not blindly execute a large implementation request.

For significant changes:

1. Analyze.
2. Explain the plan.
3. Identify risks.
4. Wait for approval when the change is architectural or destructive.
5. Implement.
6. Validate.

Small, obvious changes may be implemented directly.

---

# 27. Current Mission

The immediate goal is Martylab v0.1.

Build:

1. repository foundation;
2. portal;
3. backend;
4. PostgreSQL;
5. Docker Compose;
6. authentication foundation;
7. dashboard foundation;
8. plugin registry foundation.

Do NOT implement the complete Assistant yet.

Do NOT integrate every external application at once.

Build the foundation first.

---

# Final Principle

Martylab should remain understandable.

If a simple solution works, prefer it.

If complexity is required, document why.

Build for the future without prematurely building the future.