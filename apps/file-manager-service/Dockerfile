# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm --filter '@rc01/file-manager-service' build

FROM node:20-alpine AS runtime
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY --from=base /app/node_modules ./node_modules
COPY apps/file-manager-service/package.json ./apps/file-manager-service/package.json
COPY --from=base /app/apps/file-manager-service/dist ./apps/file-manager-service/dist
COPY --from=base /app/apps/file-manager-service/node_modules ./apps/file-manager-service/node_modules

ENV NODE_ENV=production
ENV FILE_MANAGER_PORT=4100
ENV PROBLEM_STORAGE_ROOT=/app/storage/problems
ENV FILE_MANAGER_MAX_SIZE_MB=2

EXPOSE 4100

CMD ["pnpm", "--filter", "@rc01/file-manager-service", "start"]
