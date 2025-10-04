# Delivery Tracker

## Status Legend

- TODO
- IN_PROGRESS
- BLOCKED
- DONE

## Tasks

| ID          | Theme                 | Task                                                                                                               | Status      | Notes                                                                                    |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------- |
| BATT-001    | Battle Service        | Extend battle creation flow so admins can configure settings and associate problems before launch.                 | DONE        | Depends on problem manager API.                                                          |
| BATT-002    | Battle Service        | Implement lobby state that locks configuration/problem set and exposes join endpoint while allowing admin to join. | TODO        | Requires state machine update and event triggers.                                        |
| BATT-003    | Battle Service        | Support battle start triggers (admin action or scheduled timer) and transition to active state.                    | TODO        | Requires integration with queue bootstrap.                                               |
| INF-001     | Infrastructure        | Add dedicated file-manager service and persistent Docker volume for Markdown problem storage.                      | DONE        | Update docker-compose and environment docs.                                              |
| SV-001      | File Manager Service  | Scaffold API to upload/list/read/delete .md problems stored on shared volume.                                      | TODO        | Provide metadata (hash, slug) for battle service.                                        |
| UI-001      | Admin UI              | Allow battle admins to manage configuration and attach problems from file manager.                                 | IN_PROGRESS | Host battle admin view now wired through Redux; file manager integrations still pending. |
| RUNTIME-001 | Runtime Orchestration | Provision per-user execution pods or containers to run submissions securely.                                       | TODO        | Decide on container runtime strategy.                                                    |
| SV-002      | Runner Service        | Implement service that receives run requests and executes code in user pod, emitting completion status.            | TODO        | Needs messaging contract with queue and sync services.                                   |
| SV-003      | Queue Service         | Build queue processor to dispatch submissions to runner pods and manage back-pressure.                             | TODO        | Define queue storage (Redis, NATS, etc.).                                                |
| SV-004      | Sync Service          | Stream code execution and battle state updates to players in real time.                                            | TODO        | Likely WebSocket or SSE gateway.                                                         |
| UI-002      | Player UI             | Integrate Monaco editor for code editing and submission workflow.                                                  | TODO        | Replace current editor components.                                                       |
| SV-005      | Cross-Service         | Define shared submission and problem schemas plus delivery guarantees between services.                            | TODO        | Needed for queue, runner, sync alignment.                                                |
