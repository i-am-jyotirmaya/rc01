# File Manager Service

Dedicated HTTP service responsible for storing and retrieving Markdown-based coding problems for CodeBattle Arena.

## Features

- RESTful endpoints to list, fetch, create, and delete problem statements stored as `.md` files.
- Configurable storage directory so the service can share a Docker volume with other apps.
- JSON-based upload flow that enforces payload limits via environment variables.
- Hardened Express middleware stack (Helmet, CORS, logging) suitable for local development.
- SHA-256 hashes included in responses so other services can detect content changes.
- Admin-token middleware protecting all problem management endpoints.

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `FILE_MANAGER_PORT` | Port where the HTTP server listens. | `4100` |
| `PROBLEM_STORAGE_ROOT` | Absolute path where Markdown files are stored. | `<repo>/problems` when running locally, `/app/storage/problems` in Docker |
| `FILE_MANAGER_MAX_SIZE_MB` | Maximum payload size for problem creation requests (in megabytes). | `2` |
| `FILE_MANAGER_ADMIN_TOKEN` | Shared secret required in the `x-admin-token` or `Authorization: Bearer` header. | — |

Set these values in your shell or Docker Compose file before starting the service.

## Commands

| Command | Description |
| --- | --- |
| `pnpm --filter file-manager-service dev` | Start the service with hot reloading via `ts-node-dev`. |
| `pnpm --filter file-manager-service build` | Compile TypeScript sources to JavaScript. |
| `pnpm --filter file-manager-service start` | Run the compiled server from the `dist/` directory. |

## Docker

A dedicated [`Dockerfile`](./Dockerfile) is provided. The root `docker-compose.yml` wires the service up with a persistent volume named `problem_markdown_data` so Markdown files survive container restarts and can be shared with other services.
