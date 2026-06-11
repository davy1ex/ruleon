FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 make g++ curl unzip \
  && rm -rf /var/lib/apt/lists/*

COPY sync-server/package.json sync-server/package-lock.json ./
COPY sync-server/scripts/check-node.mjs scripts/check-node.mjs
RUN npm ci --omit=dev

COPY sync-server/ ./
COPY src/domain/db/schema.sql schemas/ruleon

EXPOSE 8080

CMD ["node", "server.mjs"]
