ARG NODE_VERSION

FROM node:${NODE_VERSION}-slim AS base

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install --no-install-recommends -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY . .

RUN npx prisma generate

USER node

EXPOSE 3000

CMD ["node", "index.js"]
