# Backend API image (WBS 6.1)
# Build:  docker build -t exam-tracker-api backend
# Run:    see "Run with Docker" in the README

# 1) Install the production packages and generate the Prisma client
FROM node:22-slim AS build
WORKDIR /app
# Prisma needs OpenSSL to find the right query engine
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

# 2) Small runtime image
FROM node:22-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    PORT=4000 \
    DATABASE_URL="file:/data/app.db"

COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

# The SQLite file lives in /data, so it can be kept in a volume.
# The app runs as the "node" user, not as root.
RUN mkdir -p /data && chown -R node:node /data
USER node
VOLUME /data

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:' + process.env.PORT + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Check the settings, apply the migrations, then start the API
CMD ["npm", "run", "start:prod"]
