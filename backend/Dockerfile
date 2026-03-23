FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# ── Dependencies ────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm install --omit=dev

# ── Production image ────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p logs

EXPOSE 5000

# Run migrations then start
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "node src/db/migrate.js && node src/server.js"]
