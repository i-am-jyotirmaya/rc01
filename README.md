# 🚀 CodeBattle Arena

**A self-hostable, real-time competitive coding platform** built with modern tooling — React, Node.js, Ant Design, and powered by pnpm workspaces.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React-blue)
![Backend](https://img.shields.io/badge/backend-Node.js-green)
![Ant Design](https://img.shields.io/badge/ui-Ant%20Design-%23726dd6)
![PNPM](https://img.shields.io/badge/package%20manager-pnpm-%23f69220)

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
| Backend (WIP) | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), (future: Dockerized sandbox runners, PostgreSQL/SQLite) |
| Monorepo Mgmt | [pnpm workspaces](https://pnpm.io/workspaces)                                                                              |
| Real-time     | (Planned) WebSockets / Socket.IO                                                                                           |
| Testing       | (Planned) Jest, React Testing Library                                                                                      |

---

## 📦 Monorepo Structure

The project is organized using `pnpm` workspaces for better separation of concerns and scalability.

codebattle-arena/
│
├── apps/
│ └── frontend/
│ └── app-ui/ # React + Ant Design SPA
│
├── packages/
│ └── shared/ # (Optional) Shared utils/types
│ └── backend/ # Node.js backend (upcoming)
│
├── package.json
└── pnpm-workspace.yaml

---

## 🚧 Current Status

- ✅ Frontend bootstrapped with Vite + React + Ant Design
- ✅ Basic routing and component scaffolding in place
- 🔜 Backend integration (Node/Express)
- 🔜 Sandbox environments for secure code execution
- 🔜 Real-time leaderboard + spectator mode
- 🔜 Docker support for local and self-hosted deployments

---

## 📋 Getting Started

### 1. Clone the repo

Steps to be added soon
