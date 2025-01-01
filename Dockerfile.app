FROM node:20-alpine as builder

WORKDIR /app

ADD . .

RUN yarn && yarn build && yarn --production && yarn cache clean

FROM ghcr.io/socialgouv/docker/nginx:8.2.3

COPY --from=builder /app/app/out /usr/share/nginx/html/
