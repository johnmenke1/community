# ---- build stage ----
FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile
COPY packages/db ./packages/db
COPY apps/api ./apps/api
COPY apps/web ./apps/web
RUN pnpm --filter @community/web build

# ---- runtime stage ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/apps/web/build ./apps/web/build
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/build/server/index.js"]
