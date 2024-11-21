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

FROM base AS builder

RUN npm remove gulp-sharp-responsive

RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=package-lock.json,target=package-lock.json \
  --mount=type=cache,target=/root/.npm \
  npm ci --include=dev

RUN npx gulp css && npx gulp js

FROM base AS production

COPY --from=builder /usr/src/app/public/optimised/css ./public/optimised/css
COPY --from=builder /usr/src/app/public/optimised/js ./public/optimised/js

RUN npx prisma generate

USER node

EXPOSE 3000

CMD ["node", "index.js"]
