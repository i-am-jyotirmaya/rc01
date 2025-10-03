FROM node:20-alpine

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/app-backend/package.json apps/app-backend/package.json
COPY packages/db/package.json packages/db/package.json

RUN pnpm install --frozen-lockfile

COPY apps/app-backend apps/app-backend
COPY packages/db packages/db

RUN pnpm --filter @codebattle/db build \
  && pnpm --filter app-backend build

EXPOSE 4000

CMD ["pnpm", "--filter", "app-backend", "start"]
