# FinAI - 金融AI应用

一个基于 Nuxt.js 构建的金融 AI 应用，集成了股票数据、AI 分析、新闻爬取和智能分析等功能。

## 技术栈

- **全栈框架**: Nuxt.js 4.2 (Vue 3.5 + TypeScript)
- **数据库**: PostgreSQL + Drizzle ORM + pgvector (向量扩展)
- **缓存**: Redis
- **样式**: TailwindCSS v4
- **测试**: Vitest
- **定时任务**: cron
- **AI 集成**: Vercel AI SDK + 智谱 AI / Cloudflare AI
- **认证**: JWT RS256 (jose)
- **容器化**: Docker

## 项目结构

```
├── app/                          # 前端应用
│   ├── assets/                   # 静态资源
│   ├── components/               # Vue 组件
│   ├── composables/              # 组合式函数
│   ├── pages/                    # 页面路由
│   ├── plugins/                  # Nuxt 插件
│   └── utils/                    # 前端工具函数
├── server/                       # 后端服务
│   ├── api/                      # API 路由
│   ├── assets/ai/prompts/        # AI 提示词模板
│   ├── mcp/tools/                # MCP 工具
│   ├── middleware/               # 中间件
│   ├── plugins/                  # Nitro 插件
│   └── utils/                    # 服务端工具函数
├── drizzle/                      # 数据库
│   ├── schema/                   # 数据库模式定义
│   └── migrate/                  # 迁移文件
├── test/                         # 测试文件
├── docker-compose.yml            # Docker Compose 配置
└── package.json                  # 项目依赖
```

## 快速开始

### 环境要求

- Node.js 20+
- Docker

### 安装依赖

```bash
npm install
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
npm run dev
```

若开发环境缺少数据库等依赖服务，可执行以下命令快速创建：

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 数据库迁移

推送数据库变更到开发环境:

```bash
npm run db:push:dev
```

生成迁移文件:

```bash
npm run db:generate
```

## 生产构建

### Docker 部署

1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置生产环境变量
```

2. 构建生产版本

```bash
# 构建生产版本
docker compose build
# 推送生产版本到镜像仓库
docker compose push
```

3. 使用 Docker Compose 启动服务

```bash
docker compose up -d --no-build
```

## 关键功能

### 股票数据

- 股票信息展示（上交所、深交所、北交所）
- 实时价格更新
- 热门股票排行
- 股票详情页

### AI 分析

- 智谱 AI (GLM-4.5-Flash, GLM-4.7-Flash)
- Cloudflare AI
- 新闻关键词分析
- 股票关键词生成
- 新闻向量嵌入

### 新闻系统

- 财经新闻爬取（财联社）
- 新闻影响分析
- 新闻语义搜索

### 认证系统

- JWT RS256 签名验证
- 密钥自动轮换
- 邮箱验证码登录

### 定时任务

- 股票信息更新（每 6 小时）
- 股票价格更新（交易时间每小时）
- JWT 密钥轮换（每日 3:00）
- 股票 AI 关键词生成（每 10 分钟）
- 新闻爬取（每 10 分钟）

## 脚本命令

| 命令          | 描述                     |
| ------------- | ------------------------ |
| `dev`         | 启动开发服务器           |
| `build`       | 构建生产版本             |
| `typecheck`   | TypeScript 类型检查      |
| `generate`    | 静态生成网站             |
| `preview`     | 预览生产构建             |
| `db:push:dev` | 推送数据库变更到开发环境 |
| `db:generate` | 生成数据库迁移文件       |

## 测试

```bash
npx vitest                 # 运行所有测试
npx vitest run             # 单次运行所有测试
npx vitest run test/unit   # 运行单元测试
npx vitest run test/nuxt   # 运行 Nuxt 集成测试
npx vitest run test/e2e    # 运行 E2E 测试
```

## 数据库表结构

### 股票相关

- **stock**: 股票基本信息
- **stock_dynamic_data**: 股票动态数据
- **stock_keyword**: 股票关键词

### 新闻相关

- **news**: 新闻信息
- **news_effect**: 新闻影响分析
- **news_embedding\_\_\***: 新闻嵌入向量

### 用户相关

- **user**: 用户信息

### 缓存相关

- **api_cache**: API 缓存

## 开发文档

- [Nuxt.js 文档](https://nuxt.com/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)
- [TailwindCSS 文档](https://tailwindcss.com/docs)
- [Vercel AI SDK 文档](https://ai-sdk.dev/docs/introduction)
