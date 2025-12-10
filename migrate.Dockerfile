FROM node:22-alpine

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

RUN npm i -g drizzle-kit
RUN npm init -y
RUN npm install drizzle-orm pg

COPY ./drizzle ./drizzle/
COPY ./drizzle.config.ts ./drizzle.config.ts

ENTRYPOINT npx drizzle-kit check && npx drizzle-kit migrate 
