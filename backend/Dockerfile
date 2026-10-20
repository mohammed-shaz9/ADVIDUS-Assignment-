# Backend
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

EXPOSE 5050

# Build missing indexes first (autoIndex is off in production), then serve.
CMD ["sh", "-c", "node dist/syncIndexes.js && node dist/server.js"]
