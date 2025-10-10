# File Manager Service

Dedicated HTTP service responsible for storing and retrieving Markdown-based coding problems for CodeBattle Arena.

## Features

- RESTful endpoints to list, fetch, create, and delete problem statements stored as `.md` files.
- SQLite-backed metadata catalog that tracks problem titles, tags, hashes, and timestamps without re-reading each Markdown file.
- Configurable storage directory so the service can share a Docker volume with other apps.
- JSON-based upload flow that enforces payload limits via environment variables.
- Hardened Express middleware stack (Helmet, CORS, logging) suitable for local development.
- SHA-256 hashes included in responses so other services can detect content changes.
- Admin-token middleware protecting all problem management endpoints.

- Reuses the shared `@rc01/file-manager` workspace package so other services can embed the same problem-management logic without running the HTTP service.

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `FILE_MANAGER_PORT` | Port where the HTTP server listens. | `4100` |
| `PROBLEM_STORAGE_ROOT` | Absolute path where Markdown files are stored. | `<repo>/problems` when running locally, `/app/storage/problems` in Docker |
| `FILE_MANAGER_MAX_SIZE_MB` | Maximum payload size for problem creation requests (in megabytes). | `2` |
| `FILE_MANAGER_DATABASE_FILE` | Absolute path to the SQLite database that stores problem metadata. | `<PROBLEM_STORAGE_ROOT>/file-manager.sqlite` |
| `FILE_MANAGER_ADMIN_TOKEN` | Shared secret required in the `x-admin-token` or `Authorization: Bearer` header. | — |

Set these values in your shell or Docker Compose file before starting the service.

For local development, copy the repository-level `.env.example` to `.env`, choose a strong value for `FILE_MANAGER_ADMIN_TOKEN`, and make sure any admin client sends that token in the `x-admin-token` header.

## Commands

| Command | Description |
| --- | --- |
| `pnpm --filter '@rc01/file-manager-service' dev` | Start the service with hot reloading via `ts-node-dev`. |
| `pnpm --filter '@rc01/file-manager-service' build` | Compile TypeScript sources to JavaScript. |
| `pnpm --filter '@rc01/file-manager-service' start` | Run the compiled server from the `dist/` directory. |

## Docker

A dedicated [`Dockerfile`](./Dockerfile) is provided. The root `docker-compose.yml` wires the service up with a persistent volume named `problem_markdown_data` so Markdown files survive container restarts and can be shared with other services.
