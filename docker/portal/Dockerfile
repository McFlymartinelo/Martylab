# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/portal/package.json ./apps/portal/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/portal ./apps/portal

RUN npm run build -w @martylab/shared \
  && npm run build -w @martylab/portal

FROM nginx:1.27-alpine AS runner

RUN apk add --no-cache wget

COPY docker/portal/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/portal/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
