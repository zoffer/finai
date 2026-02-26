# FinAI 开发指南

本指南为在此代码库工作的智能编码代理提供规范和最佳实践。

## 项目概述

- **框架**: Nuxt.js 4.2 (Vue 3.5 + TypeScript)
- **数据库**: PostgreSQL + Drizzle ORM + pgvector (向量扩展)
- **缓存**: Redis
- **样式**: TailwindCSS v4
- **测试**: Vitest
- **定时任务**: cron
- **AI 集成**: Vercel AI SDK + 智谱 AI / Cloudflare AI
- **认证**: JWT (RS256)

## 核心命令

### 开发

```bash
npm run dev                    # 启动开发服务器（使用 .env.dev）
npm run build                  # 构建生产版本
npm run typecheck              # TypeScript 类型检查
npm run generate               # 静态站点生成
npm run preview                # 预览生产构建
```

### 测试

```bash
npx vitest                     # 运行所有测试
npx vitest run                 # 单次运行所有测试
npx vitest run test/unit       # 运行单元测试
npx vitest run test/nuxt       # 运行 Nuxt 集成测试
npx vitest run test/e2e        # 运行 E2E 测试
npx vitest run <文件路径>      # 运行单个测试文件
```

### 数据库

```bash
npm run db:push:dev            # 推送 schema 变更到开发数据库
npm run db:generate            # 生成迁移文件
```

## 代码风格

### 格式化

- **缩进**: 4 空格（.editorconfig）
- **字符编码**: UTF-8
- **行长度**: 最大 128 字符
- **文件末尾**: 必须有换行符
- **行尾空格**: 必须去除

### 命名约定

**数据库表 (drizzle/schema)**

- 导出常量使用驼峰命名：`tStock`, `tNews`, `tStockDynamicData`
- 主键字段：`id` (text 或 uuid，使用 `uuidv7()` 或 `customNanoid`)
- 时间戳：`created_at`, `updated_at`（通过 `sqlTimestamps` 扩展）

**API 路由 (server/api)**

- 文件结构：`server/api/<路径>/<文件名>.<方法>.ts`
- 例如：`server/api/stock/list/hot.get.ts`
- 使用 `defineApiEventHandler` 包装处理程序
- 使用 Zod schema 验证查询参数

**组件**

- 文件名：kebab-case，如 `stock-table.vue`, `news-list.vue`
- 使用 `<script lang="ts" setup>` 语法
- Props 使用 TypeScript 接口或类型定义

**函数和变量**

- 驼峰命名：`formatLargeNumber`, `refreshStockData`
- 常量：驼峰命名，全大写表示枚举：`HTTP_STATUS`, `AUTH_TOKEN_KEY`

**类型定义**

- 使用 TypeScript 接口或类型别名
- 复杂类型使用 `type` 关键字定义

### 导入规范

**使用别名**

```typescript
// 前端组件
import { formatLargeNumber } from "@/utils/format/number";

// 服务端代码
import { tStock } from "~~/drizzle/schema/stock";
import { ApiError, HTTP_STATUS } from "~~/server/utils/api";
```

**导入顺序**

1. 第三方库
2. 内部模块（使用 `~~/` 别名）
3. 相对路径导入
4. 类型导入

### TypeScript

**严格模式**

- 所有文件必须使用 TypeScript
- 函数参数和返回值必须有明确类型
- 避免使用 `any`，使用 `unknown` 或具体类型

**类型定义示例**

```typescript
// Zod schema 用于验证
const zParameter = z.object({
    size: z.coerce.number().int().min(1).max(1000).default(10),
    search: z.string().trim().optional(),
});

// 接口用于组件 props
interface Stock {
    id: string;
    name: string;
    symbol: string;
    price: number;
}

// 处理程序类型
defineApiEventHandler(async (event: H3Event<{ query: z.input<typeof zParameter> }>) => {
```

### 错误处理

**API 错误**

- 使用 `ApiError` 类统一处理错误
- 返回 `ApiError` 实例而非抛出异常
- 使用 `defineApiEventHandler` 自动包装错误处理

```typescript
// 返回错误
return new ApiError({
    code: "invalid_parameter",
    message: z.prettifyError(result.error),
}).setHttpStatus(HTTP_STATUS.BAD_REQUEST);
```

**客户端错误**

- 401 错误自动重定向到登录页面（在 app/plugins/api.ts 中）
- 其他错误记录到控制台

### 数据库操作

**使用 Drizzle ORM**

```typescript
// 导入表定义
import { tStock, tStockDynamicData } from "~~/drizzle/schema/stock";

// 查询示例
const stocks = await db
    .select()
    .from(tStock)
    .innerJoin(tStockDynamicData, eq(tStock.id, tStockDynamicData.stock_id))
    .orderBy(desc(tStock.created_at))
    .limit(10);

// 操作符导入
import { eq, desc, ilike, and, or, sql, gt } from "drizzle-orm";
```

**向量操作**

```typescript
// 使用 pgvector 进行向量搜索
import { vector } from "drizzle-orm/pg-core";

// 向量归一化
import { L2Normalize } from "~~/server/utils/vector";
const { norm, vector: normalizedVector } = L2Normalize(rawVector);
```

### Vue 组件规范

**Composition API**

```vue
<script lang="ts" setup>
import { ref, computed } from "vue";

// 响应式状态
const searchQuery = ref("");

// 计算属性
const stocks = computed(() => props.data || []);

// 类型定义
type Stock = {
    id: string;
    name: string;
    // ...
};

const props = defineProps<{
    data?: Stock[];
}>();

const emit = defineEmits<{
    (e: "item-click", stock: Stock): void;
}>();
</script>
```

**模板样式**

- 使用 TailwindCSS 类名
- 响应式设计：移动优先，使用 `sm:`, `md:`, `lg:` 前缀
- 动态类使用对象语法或条件表达式

### 注释规范

- 使用中文注释
- 复杂逻辑必须添加注释
- API 路由添加简短功能描述
- 数据库字段添加行内注释说明用途

## 项目结构

```
app/                          # 前端应用
├── assets/                   # 静态资源
│   └── global/css/          # 全局样式
├── components/              # Vue 组件
│   ├── lightweight-charts/  # 金融图表组件
│   ├── pages/              # 页面特定组件
│   └── ui/                 # 通用 UI 组件
├── composables/             # 组合式函数
│   ├── ai/                 # AI 相关
│   └── notification/       # 通知相关
├── pages/                   # 页面路由
│   ├── chat/index.vue      # 聊天页面
│   ├── login/index.vue    # 登录页面
│   ├── stock/view/[id].vue # 股票详情页
│   └── index.vue          # 首页
├── plugins/                 # Nuxt 插件
└── utils/                   # 前端工具函数

server/                       # 后端服务
├── api/                     # API 路由处理程序
│   ├── ai/gateway/         # AI 网关
│   ├── auth/email/         # 邮箱认证
│   ├── news/search/        # 新闻搜索
│   └── stock/              # 股票相关 API
├── assets/ai/prompts/       # AI 提示词模板
├── mcp/tools/               # MCP 工具
├── middleware/              # 中间件
├── plugins/                 # Nitro 插件
└── utils/                   # 服务端工具函数
    ├── ai/provider/        # AI 提供商
    ├── auth/               # 认证工具
    ├── cache/              # 缓存工具
    ├── data-source/        # 数据源爬取
    ├── jwt/                # JWT 工具
    ├── redis/              # Redis 工具
    ├── task/               # 任务系统
    └── vector/             # 向量工具

drizzle/                      # 数据库
├── schema/                  # 数据库模式定义
│   ├── cache.ts            # API 缓存表
│   ├── common.ts           # 公共字段
│   ├── news.ts             # 新闻表
│   ├── news_embedding.ts   # 新闻向量表
│   ├── stock.ts            # 股票表
│   └── user.ts             # 用户表
└── migrate/                 # 迁移文件

test/                         # 测试文件
```

## 数据库表结构

### 股票相关

- **stock**: 股票基本信息（代码、名称、交易所、行业、介绍）
- **stock_dynamic_data**: 股票动态数据（价格、涨跌、成交量、热度分数）
- **stock_keyword**: 股票关键词（关键词、权重）

### 新闻相关

- **news**: 新闻信息（标题、内容、日期）
- **news_effect**: 新闻影响分析（关键词、影响值、置信度、原因）
- **news_embedding\_\_\***: 新闻嵌入向量（支持多模型，使用 pgvector）

### 用户相关

- **user**: 用户信息（昵称、邮箱）

### 缓存相关

- **api_cache**: API 缓存（URL、数据）

## 核心功能模块

### 认证系统

- JWT RS256 签名验证
- 密钥自动轮换（每日）
- 支持 Cookie 和 Bearer Token
- 邮箱验证码登录

### AI 功能

- 智谱 AI (GLM-4.5-Flash, GLM-4.7-Flash)
- Cloudflare AI
- AI 网关代理
- 新闻关键词分析
- 股票关键词生成

### 定时任务

- 股票信息更新（每 6 小时）
- 股票价格更新（交易时间每小时）
- JWT 密钥轮换（每日 3:00）
- 股票 AI 关键词生成（每 10 分钟）
- 新闻爬取（每 10 分钟）

### 数据爬取

- 股票信息（上交所、深交所、北交所）
- 股票实时价格
- 财经新闻（财联社）

## 操作约束

- **数据库结构修改**: 任何涉及数据库 schema 变更的操作（修改 drizzle/schema、运行数据库迁移等）必须先获得用户确认，不可自行执行

## MCP 工具使用

在编码过程中，特别是涉及 Nuxt 相关功能或新建文件时，必须积极使用 nuxt mcp 工具查询官方文档，以确保代码符合 Nuxt 规范。

### 使用原则

1. **强制使用**：在新建文件、实现 Nuxt 相关功能或不确定最佳实践时，必须使用 nuxt mcp 查询官方文档
2. **主动使用**：遇到需要查询技术文档、API 参考或代码示例时，优先使用 MCP 工具获取最新、准确的信息
3. **智能选择**：根据数据源评分、代码片段数量和相关性选择最佳的资源
4. **版本匹配**：注意库和框架的版本兼容性，确保查询的文档与项目使用的版本匹配
5. **持续验证**：在实现关键功能前，通过实际测试验证 MCP 提供的信息
6. **规范遵循**：严格按照官方文档的规范编写代码，确保符合 Nuxt 最佳实践

## 最佳实践

1. **类型安全**: 始终使用 TypeScript 类型定义，避免 `any`
2. **参数验证**: API 路由必须使用 Zod 验证输入参数
3. **错误处理**: 使用统一的 `ApiError` 处理错误响应
4. **数据库查询**: 使用 Drizzle ORM 类型安全的查询构建器
5. **组件拆分**: 将大型组件拆分为更小的可复用组件
6. **性能优化**: 使用 `useAsyncData` 的 `signal` 参数支持取消请求
7. **环境隔离**: 开发使用 `.env.dev`，生产使用 `.env`
8. **导入优化**: 使用 `~~/` 别名简化导入路径
9. **向量归一化**: 存储向量前必须进行 L2 归一化
10. **任务队列**: 使用 `p-queue` 管理并发任务

## 开发流程

1. 编写代码并遵循本指南规范
2. 运行类型检查：`npm run typecheck`
3. 编写测试并验证
