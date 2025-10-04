# Agent Handbook

## Project Overview

CodeBattle Arena is a self-hostable, real-time competitive coding platform. It blends tournament-style battle flows with collaborative tooling so admins can stage battles, manage coding problems, and let players compete head-to-head. The stack uses a pnpm-managed monorepo with React + Ant Design on the frontend and Node.js services on the backend.

## Current Context

- Repository root: c:/Dev/projects/rc01
- Active Docker configuration: docker-compose.yml (multiple services planned)
- IDE open tabs:
  - package.json
  - apps/app-ui/src/App.tsx
  - apps/app-ui/src/components/Hero/HeroSection.tsx
  - apps/app-ui/src/components/Hero/HeroCopy.tsx
  - AGENTS.md
- Tracker file: TASKS.md (authoritative status list)

## Key Tasks

| ID          | Theme                 | Task                                                                                                               | Status      | Notes                                                                                    |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------- |
| BATT-001    | Battle Service        | Extend battle creation flow so admins can configure settings and associate problems before launch.                 | DONE        | Model battle config entities, expose CRUD endpoints, and persist problem associations.   |
| BATT-002    | Battle Service        | Implement lobby state that locks configuration/problem set and exposes join endpoint while allowing admin to join. | IN_PROGRESS | Add state machine transitions, enforce read-only guards, and surface lobby join API.     |
| BATT-003    | Battle Service        | Support battle start triggers (admin action or scheduled timer) and transition to active state.                    | TODO        | Wire timer scheduler, admin action handler, and broadcast state change events.           |
| INF-001     | Infrastructure        | Add dedicated file-manager service and persistent Docker volume for Markdown problem storage.                      | DONE        | Update docker-compose, declare shared volume, and document local path mappings.          |
| SV-001      | File Manager Service  | Scaffold API to upload/list/read/delete .md problems stored on shared volume.                                      | IN_PROGRESS | Implement validation, metadata (hash/slug), and auth guard for admin-only access.        |
| UI-001      | Admin UI              | Allow battle admins to manage configuration and attach problems from file manager.                                 | IN_PROGRESS | Drafting admin configuration scaffolding; awaiting SV-001 before API wiring.             |
| RUNTIME-001 | Runtime Orchestration | Provision per-user execution pods or containers to run submissions securely.                                       | TODO        | Define runtime templates, resource quotas, and isolation policies.                       |
| SV-002      | Runner Service        | Implement service that receives run requests and executes code in user pod, emitting completion status.            | TODO        | Handle language-specific runners, capture stdout/stderr, and publish completion events.  |
| SV-003      | Queue Service         | Build queue processor to dispatch submissions to runner pods and manage back-pressure.                             | TODO        | Choose message broker, implement retry/dead-letter flows, and expose monitoring metrics. |
| SV-004      | Sync Service          | Stream code execution and battle state updates to players in real time.                                            | TODO        | Provide WebSocket/SSE endpoints, manage subscriptions, and ensure delivery ordering.     |
| UI-002      | Player UI             | Integrate Monaco editor for code editing and submission workflow.                                                  | TODO        | Install Monaco, configure language support, and connect submission lifecycle to UI.      |
| SV-005      | Cross-Service         | Define shared submission and problem schemas plus delivery guarantees between services.                            | TODO        | Publish schema package, version contracts, and document message sequencing expectations. |

## Next Goals

1. Land the battle configuration flow updates (BATT-001) so admins can prepare battles ahead of lobby launch.
2. Add the file-manager infrastructure and service (INF-001, SV-001) to manage Markdown problem assets via a shared volume.
3. Implement lobby-to-start transitions (BATT-002, BATT-003) and coordinate with queue/bootstrap logic.
4. Kick off runtime orchestration work (RUNTIME-001, SV-002, SV-003) to ensure submissions can execute in isolated pods.
5. Prepare frontend integrations including Monaco editor and admin tooling (UI-001, UI-002) once backend endpoints stabilize.

## Coding Standards & Optimization

- Follow SOLID, DRY, and clean architecture principles to keep services modular and testable.
- Prefer TypeScript strict mode, typed API contracts, and comprehensive validation on all inputs/outputs.
- Add automated tests (unit/integration/e2e) when introducing new features; keep coverage meaningful for business-critical flows.
- Profile and monitor critical paths; avoid unnecessary resource consumption in Docker services and frontend bundles.
- Document configuration, environment variables, and operational runbooks as changes land.

## Tips for Future Agents

- Treat TASKS.md as the source of truth for status; update both this file and the tracker when tasks progress.
- Cross-reference docker-compose.yml when adding new services or volumes.
- Keep README.md in sync with new capabilities; the Project Tracker section links to TASKS.md.
- Respect existing code style guides (.prettierrc, lint rules) and run formatters/lints before committing.
