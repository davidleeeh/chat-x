FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN npm ci

COPY packages/shared packages/shared
RUN npm run build --workspace=packages/shared

COPY packages/server/prisma packages/server/prisma
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma

COPY packages/server packages/server
RUN npm run build --workspace=packages/server

COPY packages/client packages/client
RUN npm run build --workspace=packages/client

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

RUN npm ci --omit=dev

COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/server/dist packages/server/dist
COPY --from=build /app/packages/server/prisma packages/server/prisma
COPY --from=build /app/packages/client/dist packages/client/dist
COPY --from=build /app/node_modules/.prisma node_modules/.prisma

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/chat-x.db

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --schema=packages/server/prisma/schema.prisma --skip-generate && node packages/server/dist/index.js"]
