# Image de production de apps/worker.
# Construire depuis la racine du dépôt : docker build -f apps/worker/Dockerfile -t hilaac-worker .

FROM node:24.14.1-alpine AS base
ENV TURBO_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@12.10.1
WORKDIR /repo

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --frozen-lockfile --filter "@hilaac/worker..."
RUN pnpm --filter @hilaac/worker build
# Dépendances de production seules : les paquets @hilaac/* sont déjà embarqués dans le bundle.
RUN pnpm --filter @hilaac/worker deploy --prod /out

FROM node:24.14.1-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out/package.json ./
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/apps/worker/dist ./dist
USER node
CMD ["node", "dist/main.mjs"]
