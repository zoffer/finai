FROM node:22-alpine AS builder

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

RUN npm init -y
RUN npm install drizzle-kit drizzle-orm pg

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app /app

COPY ./drizzle ./drizzle/
COPY ./drizzle.config.ts ./drizzle.config.ts

ENTRYPOINT npx drizzle-kit check && npx drizzle-kit migrate 
