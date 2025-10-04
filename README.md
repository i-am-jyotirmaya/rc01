# 🚀 CodeBattle Arena

**A self-hostable, real-time competitive coding platform** built with modern tooling — React, Node.js, Ant Design, and powered by pnpm workspaces.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React-blue)
![Backend](https://img.shields.io/badge/backend-Node.js-green)
![Ant Design](https://img.shields.io/badge/ui-Ant%20Design-%23726dd6)
![PNPM](https://img.shields.io/badge/package%20manager-pnpm-%23f69220)

## Project Tracker

- [Delivery Tracker](TASKS.md)

---

## ✨ About the Project

**CodeBattle Arena** is a platform where developers can compete in real-time coding battles under timed constraints. The goal is to make coding competitions fun, interactive, and accessible — both for individuals hosting private games and communities running large-scale tournaments.

Think of it as a mix between **Codeforces**, **Kahoot**, and **VS Code**, designed for speed, fairness, and developer-friendly UX.

---

## 🎯 Use Case

This platform is built for:

- 🧑‍💻 **Developers** who want to challenge friends or self-practice under time pressure.
- 🏫 **Teachers/instructors** who want to host live classroom code-offs.
- 👩‍💼 **Organizations** looking to conduct internal coding challenges or hiring rounds.
- 🌍 **Communities** and meetup groups looking to organize remote or on-site code battles.

---

## 🛠️ Tech Stack

| Layer         | Tech Used                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Frontend      | [React](https://reactjs.org/), [Ant Design](https://ant.design/), TypeScript                                               |
| Backend       | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), PostgreSQL, Docker |
| Monorepo Mgmt | [pnpm workspaces](https://pnpm.io/workspaces)                                                                              |
| Real-time     | (Planned) WebSockets / Socket.IO                                                                                           |
| Testing       | (Planned) Jest, React Testing Library                                                                                      |

---

## 📦 Monorepo Structure

The project is organized using `pnpm` workspaces for better separation of concerns and scalability.

codebattle-arena/
│
├── apps/
│   ├── app-ui/        # React + Ant Design SPA
│   └── app-backend/   # Node.js authentication + orchestration API
│
├── packages/
│   ├── db/                    # Shared Postgres connector utilities
│   └── file-manager-service/  # Markdown problem storage microservice
│
├── package.json
└── pnpm-workspace.yaml

## 🗂️ File Manager Service

The monorepo now includes a dedicated File Manager HTTP service responsible for storing Markdown problem statements on a shared volume. Key capabilities include:

- REST endpoints to list, read, and create Markdown problems.
- Configurable storage root via the `PROBLEM_STORAGE_ROOT` environment variable.
- Enforced payload limits (`FILE_MANAGER_MAX_SIZE_MB`) to prevent oversized uploads.
- Docker Compose integration with a persistent `problem_markdown_data` volume shared with the backend.
- Routes are protected by the `FILE_MANAGER_ADMIN_TOKEN` shared secret—copy `.env.example` to `.env` and update the token before bringing services up.

> The service lives under [`packages/file-manager-service`](packages/file-manager-service) and ships with a Dockerfile so it can run alongside the rest of the stack.

## 🧩 Problem Template & Admin Workflow

Problems are captured with a validated Markdown template that combines front matter metadata with well-known sections. The file manager rejects uploads that do not satisfy the structure, ensuring every battle problem ships with consistent context.

### Front matter fields

| Field | Required | Notes |
| ------------------------- | -------- | ------------------------------------------ |
| `title` | yes | Display title shown to admins and players. |
| `slug` | optional | If omitted, derived from the title. |
| `difficulty` | yes | One of `easy`, `medium`, `hard`, `insane`. |
| `tags` | optional | Array of free-form labels. |
| `estimatedDurationMinutes` | optional | Positive integer, rounded to minutes. |
| `author` / `source` | optional | Attribution shown in the catalog. |

### Required sections

The body must contain the following headings in order:

1. `## Problem Statement`
2. `## Input Format`
3. `## Output Format`
4. `## Constraints`
5. `## Sample Tests` (with at least one sample that includes `#### Input` and `#### Output`)
6. `## Notes`

A minimal example looks like this:

```markdown
---
title: "Two Sum"
slug: "two-sum-easy"
difficulty: easy
tags:
  - arrays
  - hash-table
estimatedDurationMinutes: 20
author: "CodeBattle Arena"
source: "https://example.com/problems/two-sum"
---

# Two Sum

## Problem Statement

Find two distinct numbers that add up to the target value.

## Input Format

- Line 1: integer `n`
- Line 2: `n` space-separated integers
- Line 3: target integer

## Output Format

Print the indices (1-based) of the two numbers separated by a space.

## Constraints

- `2 <= n <= 10^5`
- `-10^9 <= value <= 10^9`

## Sample Tests

### Sample 1

#### Input

3
1 3 5
4

#### Output

1 2

#### Explanation

1 + 3 meets the target 4.

## Notes

Return the pair with the smallest indices if multiple answers exist.
```

### Admin UI workflow

The battle configuration screen now includes an **Add problem** modal. Admins can:

- Upload a prepared `.md` file; the service validates it before saving.
- Compose a new problem in a template-aware editor that highlights validation issues in real time.
- Refresh the catalog instantly after saving to attach freshly authored problems to the current battle.

## 🗄️ Backend Overview

The `apps/app-backend` service powers authentication and the foundational APIs for CodeBattle Arena. Key capabilities include:

- Secure user registration with hashed passwords and JWT-based authentication flows.
- PostgreSQL persistence managed through the shared `@codebattle/db` workspace package.
- Profile photo uploads that are resized automatically and stored locally for reuse in future battle features.
- Docker Compose configuration for spinning up the API together with a Postgres instance.

Refer to [`apps/app-backend/README.md`](apps/app-backend/README.md) for setup instructions, environment details, and roadmap placeholders.

---

## 🚧 Current Status

- ✅ Frontend bootstrapped with Vite + React + Ant Design
- ✅ Basic routing and component scaffolding in place
- ✅ Backend foundation (auth service + Postgres)
- 🔜 Sandbox environments for secure code execution
- 🔜 Real-time leaderboard + spectator mode
- 🔜 Docker support for local and self-hosted deployments

---

## 📋 Getting Started

### 1. Clone the repo

Steps to be added soon
