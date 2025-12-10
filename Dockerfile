### builder ###
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

# 安装依赖
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install

COPY . .
RUN npm run build

### app ###
FROM node:22-alpine

# 复制构建后的文件
WORKDIR /app

COPY --from=builder /app/.output /app

EXPOSE 80
ENV PORT=80

ENTRYPOINT node /app/server/index.mjs
