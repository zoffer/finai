# FinAI - 金融AI应用

一个基于Nuxt.js构建的金融AI应用，集成了股票数据、AI分析和定时任务等功能。

## 技术栈

- **前端框架**: Nuxt.js 4
- **后端**: Node.js (Nuxt Server API)
- **数据库**: PostgreSQL + Drizzle ORM
- **缓存**: Redis
- **定时任务**: cron
- **AI集成**: @ai-sdk/deepseek, ai
- **样式**: TailwindCSS + Sass
- **认证**: JWT (jose)
- **容器化**: Docker + Docker Compose

## 项目结构

```
├── app/                    # 前端应用目录
│   ├── pages/              # 页面组件
│   └── plugins/            # 插件
├── drizzle/                # 数据库模式和迁移
│   ├── schema/             # 数据库模式定义
│   └── migrate/            # 迁移文件
├── server/                 # 后端API
│   ├── api/                # API路由
│   ├── plugins/            # 服务器插件
│   └── utils/              # 工具函数
├── shared/                 # 共享代码
├── docker-compose.yml      # Docker Compose配置
└── package.json            # 项目依赖
```

## 快速开始

### 环境要求

- Node.js 18+
- npm/pnpm/yarn/bun
- Docker (可选，用于容器化部署)

### 安装依赖

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### 环境配置

1. 复制环境变量示例文件

```bash
cp .env.example .env.dev
```

2. 编辑 `.env.dev` 文件，配置所需的环境变量

### 开发服务器

启动开发服务器 (默认端口: 3000):

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

### 数据库迁移

推送数据库变更到开发环境:

```bash
npm run db-push:dev
```

## 生产构建

### 本地构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### Docker部署

1. 配置环境变量

```bash
cp .env.example .env
# 编辑.env文件，设置生产环境变量
```

2. 使用Docker Compose启动服务

```bash
docker-compose up -d
```

## 关键功能

- **股票数据**：股票信息展示和分析
- **AI分析**：基于AI的金融数据分析
- **定时任务**：自动更新数据和执行任务
- **API服务**：提供RESTful API接口

## 脚本命令

| 命令 | 描述 |
|------|------|
| `dev` | 启动开发服务器 |
| `build` | 构建生产版本 |
| `generate` | 静态生成网站 |
| `preview` | 预览生产构建 |
| `db-push:dev` | 推送数据库变更到开发环境 |

## 开发文档

- [Nuxt.js 文档](https://nuxt.com/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)
- [TailwindCSS 文档](https://tailwindcss.com/docs)
