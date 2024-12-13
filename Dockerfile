ARG NODE_VERSION=20-alpine3.19@sha256:ef3f47741e161900ddd07addcaca7e76534a9205e4cd73b2ed091ba339004a75

# Install dependencies only when needed
FROM node:$NODE_VERSION AS builder
# hadolint ignore=DL3018
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY yarn.lock package.json ./
RUN yarn  --immutable
COPY . .

ARG PRODUCTION
ENV PRODUCTION $PRODUCTION
ARG GITHUB_SHA
ENV GITHUB_SHA $GITHUB_SHA
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL $NEXT_PUBLIC_SITE_URL

ENV NODE_ENV production
ENV NEXT_PUBLIC_BASE_PATH ""

WORKDIR /app

RUN if [ -z "$PRODUCTION" ]; then \
    echo "Overriding .env for staging"; \
    cp .env.staging .env.production; \
    fi && \
    yarn build

# Disable nextjs telemetry
ENV NEXT_TELEMETRY_DISABLED 1
