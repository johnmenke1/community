# ---- build stage ----
FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile
COPY packages/db ./packages/db
COPY apps/api ./apps/api
RUN pnpm --filter @community/db generate || true
RUN pnpm --filter @community/api build

# ---- runtime stage ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/apps/api/dist ./apps/api/dist
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
