# 本地开发速查（Sprint 0 后）

## 首次准备

1. 装依赖：`pnpm install`
2. 启动 Docker（推荐 [OrbStack](https://orbstack.dev)，比 Docker Desktop 快）
3. 启动本地 Supabase：`supabase start`（首次会拉 image 3-5 分钟）
   - 完成后会打印本地 API URL、anon key、Studio URL 等
   - 已在 `apps/weapp/.env.local` 里配置好本地值（`127.0.0.1:54321`）
4. 应用 migration：`supabase db reset`（幂等，重跑安全）

## 日常开发

```bash
pnpm dev:h5              # 编译 packages + 起 H5 dev server (http://localhost:10086)
pnpm build:packages      # 只编译 workspace packages（改了 packages/* 后需要）
pnpm typecheck           # 全 workspace typecheck
```

**改动响应速度**：
- 改 `apps/weapp/src/*` → dev server 热更新，秒级
- 改 `packages/*/src/*` → 需要 `pnpm build:packages` 后 dev server 才能拿到新代码
- 改 `apps/weapp/config/index.ts` 或 postcss → 需要重启 dev server（Ctrl+C 后重跑）

## Supabase 常用

```bash
supabase start                    # 起本地 Supabase
supabase stop                     # 停
supabase db reset                 # 重跑 migration（drop + recreate）
supabase gen types typescript --local > packages/core/src/database.types.ts
                                  # migration 改动后重新生成 TS 类型
```

**本地 Studio**：http://127.0.0.1:54323 — 可视化看表 / 跑 SQL / 管 Auth

## 端口速查

| 服务 | URL |
|---|---|
| Taro H5 dev server | http://localhost:10086 |
| Supabase API | http://127.0.0.1:54321 |
| Supabase DB | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Supabase Studio | http://127.0.0.1:54323 |
| Supabase Inbucket (email) | http://127.0.0.1:54324 |

## Monorepo 布局

```
body-diary/
├── apps/
│   └── weapp/               # Taro (WeChat MP + H5) — Phase 1
├── packages/
│   ├── core/                # Zod schemas + Supabase client + business logic
│   ├── design-tokens/       # CSS variables / tokens.scss / tokens.ts
│   ├── assets/              # SVG icons + pose sketches + BodyFigure layout data
│   └── content/             # Poses + muscles + sensation words + copy library
├── supabase/                # migrations + edge functions
├── docs/                    # PRD / core-idea / design-principles / research
└── design/                  # handoff (design_handoff_mindful_movement_journal/)
```

**包命名**：`@body-diary/<name>`，都是 workspace 内部依赖（`workspace:*`）。

## 常见坑

- **`getPalette` / `nearestQuadrant` 从哪个包 import？** — 用 tsc 的 auto-import 或看 `packages/*/src/index.ts` 的 export。规则：
  - 设计 tokens（`getPalette` / `Theme`）← `@body-diary/design-tokens`
  - 内容（`getPoseById` / `MUSCLES` / `QUADRANT_WORDS` / `nearestQuadrant`）← `@body-diary/content`
  - DB/业务（`createEntry` / `Profile` / `SensationCoord` schema）← `@body-diary/core`
  - SVG 组件（`PoseSketch` / `IconHome` / `FRONT_MUSCLES` 布局）← `@body-diary/assets`

- **Sass @import 弃用警告**：全项目用 `@use`。如果新写 SCSS 请用 `@use`，不要用 `@import`。

- **Taro CSS px 单位**：写数值就是 handoff 上的实际像素（`designWidth: 390`）。不要写 rpx。

- **PC 端预览很怪**：H5 输出是给手机的。开 Chrome DevTools → 切 iPhone 12 Pro（390×844）视图。真桌面端 Phase 2 做独立 Next.js 版本。

## 文档索引

- `docs/core-idea.md` — 产品核心思想
- `docs/design-principles.md` — 11 条设计原则
- `docs/PRD.md` — v2 MVP 需求文档
- `docs/research/product-benchmark.md` — 海外产品对标
- `docs/research/xhs-insights.md` — 小红书用户调研
- `docs/research/ui-reference-gallery.md` — UI/UX 参考
- `design/design_handoff_mindful_movement_journal/README.md` — 视觉 handoff spec
- `supabase/migrations/README.md` — 数据库 migration 说明
