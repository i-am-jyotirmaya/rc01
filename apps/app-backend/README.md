# App Backend

Core authentication and orchestration service for CodeBattle Arena. This service manages user accounts, authentication tokens, and foundational integrations that other backend services can consume.

## Features

- User registration with secure password hashing and username uniqueness enforcement.
- Authentication endpoint that issues JSON Web Tokens (JWT) for session management.
- Profile photo processing with automatic downscaling and storage on the local filesystem.
- Postgres-backed persistence with automated boot-time migrations.
- Modular architecture that reuses shared workspace packages for database access.
- Docker-first local development workflow (backend + Postgres).

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) (see repository root for the required version).
- Docker + Docker Compose for containerized workflows.
- Node.js 18+ for local execution outside Docker.

### Environment Variables

Copy `.env.example` to `.env` and update the values as needed:

```bash
cp .env.example .env
```

Key variables:

- `PORT`: HTTP port for the service (defaults to `4000`).
- `JWT_SECRET`: Secret string used to sign JWT access tokens.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Postgres connection settings.
- `STORAGE_DIR`: Absolute path where uploads will be written when running inside Docker (defaults to `/app/storage`).
- `MAX_UPLOAD_SIZE_MB`: Maximum allowed upload size for profile photos.
- `IMAGE_MAX_WIDTH`: Maximum width (in pixels) for resized profile photos.

### Commands

| Command      | Description                                           |
| ------------ | ----------------------------------------------------- |
| `pnpm dev`   | Start the backend with hot reload via ts-node-dev.    |
| `pnpm build` | Compile TypeScript sources to JavaScript.             |
| `pnpm start` | Run the compiled server from the `dist/` folder.      |

### Running Locally

1. Install dependencies from the monorepo root:

   ```bash
   pnpm install
   ```

2. Start a Postgres instance (see Docker instructions below or use your local Postgres).
3. In one terminal, run the backend in watch mode:

   ```bash
   pnpm --filter app-backend dev
   ```

4. The server will be available at `http://localhost:4000` by default.

### Docker Usage

A dedicated `docker-compose.yml` is provided to launch the backend together with Postgres and a persistent volume for uploads. From the repository root:

```bash
pnpm --filter app-backend docker:up
```

See the [Docker](#docker) section for more details.

## API Overview

### Authentication

- `POST /api/auth/register` — Create a new user. Accepts `multipart/form-data` with fields `username`, `firstName`, `lastName`, `password`, and a `photo` file. Returns the created user and a JWT token.
- `POST /api/auth/login` — Authenticate an existing user with `username` and `password` (JSON body). Returns the user profile and a JWT token.

### Coming Soon

- 🔒 Role-based access control for administrative actions.
- 🧠 Battle orchestration endpoints for matchmaking and score tracking.
- 💬 Real-time WebSocket gateway for lobby and in-battle chat.
- 📊 Telemetry and observability dashboards.

## Docker

> **Note:** Docker support is intended for local development. Production deployment guidelines will be added later.

The backend ships with a Compose file that starts:

- `app-backend`: Node.js service running on port 4000.
- `file-manager`: Dedicated Markdown storage service exposed on port 4100 and sharing the `problem_markdown_data` volume.
- `postgres`: Postgres 15 database with a named volume for persistence.

Available scripts:

- `pnpm --filter app-backend docker:up` — Build images (if needed) and start the stack in the foreground.
- `pnpm --filter app-backend docker:down` — Stop the stack and remove containers while preserving named volumes.
- `pnpm --filter app-backend docker:logs` — Tail logs from both services.

The Compose project maps a local `storage/` directory for uploaded profile photos so that images persist between container restarts.

## Project Structure

```
apps/app-backend
├── src
│   ├── config      # Environment parsing and shared configuration
│   ├── controllers # Express handlers (request/response orchestration)
│   ├── middleware  # Express middleware (errors, uploads, etc.)
│   ├── routes      # HTTP route definitions
│   ├── services    # Domain logic and integrations
│   └── utils       # Generic helpers (logging, filesystem, tokens)
├── storage         # Default host directory for resized uploads (git-kept)
├── .env.example    # Sample environment configuration
├── Dockerfile      # Container build definition
└── docker-compose.yml # Local development stack
```

## Testing

Automated test coverage is planned. For now, manual testing via HTTP clients (cURL, Postman, Thunder Client) is recommended.

## Contributing

1. Keep business logic inside services and repositories to maintain thin controllers.
2. Prefer reusable utilities in `packages/` when functionality could benefit multiple apps.
3. Document new endpoints and environment variables in this README.

## Roadmap Placeholders

- ✅ Authentication foundation (this release).
- ⏳ Battle session orchestration.
- ⏳ Real-time challenge execution.
- ⏳ Leaderboard aggregation service.
- ⏳ Audit logging and analytics.

