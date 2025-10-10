# @rc01/file-manager

Shared file manager package used across the CodeBattle Arena monorepo. It persists Markdown problem content on disk while storing validated metadata (slug, title, tags, difficulty, etc.) in a SQLite database.

## Features

- Validates Markdown content against the shared problem template and derives a canonical slug.
- Persists Markdown files to a configurable storage directory.
- Maintains a SQLite-backed catalog for fast metadata lookups without re-reading every Markdown file.
- Exposes a small API (`listProblems`, `getProblem`, `saveProblem`, `deleteProblem`) plus reusable Zod schemas for HTTP handlers.
- Designed to be reused either directly (embedded in services like the backend) or via the HTTP wrapper in `apps/file-manager-service`.

## Usage

```ts
import { createFileManager } from '@rc01/file-manager';

const manager = await createFileManager({
  storageRoot: '/absolute/path/to/problems',
  databaseFile: '/absolute/path/to/problems/metadata.sqlite',
});

const problem = await manager.saveProblem({ content: markdown });
const allProblems = await manager.listProblems();
```

The SQLite file is created automatically if it does not exist. Both the storage directory and the database path are configurable so you can share volumes across containers or keep everything local during development.
