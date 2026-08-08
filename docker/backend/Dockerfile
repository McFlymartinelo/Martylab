# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/portal/package.json ./apps/portal/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
COPY plugins ./plugins

RUN npm run build -w @martylab/shared \
  && npm run build -w @martylab/backend \
  && npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget \
  && addgroup -S martylab \
  && adduser -S martylab -G martylab

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/drizzle ./apps/backend/drizzle
COPY --from=build /app/plugins ./plugins
COPY docker/backend/docker-entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
  && chown -R martylab:martylab /app

USER martylab
WORKDIR /app/apps/backend

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health/live >/dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
