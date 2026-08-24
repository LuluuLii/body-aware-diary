# body-diary · 身体感知日记

一个为**神经-身体觉知运动**（瑜伽、普拉提、游泳、网球、芭蕾等）实践者做的**身体感知日记**。不是"瑜伽版 Strong"—— 我们做的是让每次练习变成一次和身体的对话，用**发现自己**取代**完成打卡**。

不做 AI 对话、社交、streak、徽章。

---

## 现在处在哪个阶段

**Sprint 0 完成**（T1-T10 · 骨架搭好）。

已完成：
- Monorepo 架构（pnpm workspace · 4 packages + apps/weapp）
- 4 个 shared packages：`design-tokens` / `assets` / `content` / `core`
- 数据模型 + 本地 Supabase 跑通（3 个 v2 migration + grants）
- Taro H5 骨架跑起来 · 自定义 TabBar + 5 页面 · Supabase 链路验证 · `BodyFigure` 组件
- H5 字体加载完整（Noto Serif SC / Noto Sans SC / Caveat）

尚未做（**Sprint 1 才动**）：
- 记录页真正的 handoff 视觉（BodyMap 覆盖层 · SensationPicker 坐标点 · 一句话 · 更多字段）
- 回顾页 / 图鉴页 / 日记本 / 首页——目前是占位
- 60 个体式 + 30 块专业解剖 SVG——独立"素材 Sprint"里做（AI 生成 + 人工清理）

## 快速上手

**首次准备**：
1. 装依赖：`pnpm install`
2. 装 Docker（推荐 [OrbStack](https://orbstack.dev)，比 Docker Desktop 快）
3. 装 Supabase CLI：`brew install supabase/tap/supabase`
4. 起本地 Supabase：`supabase start`（首次 3-5 分钟拉 image）
5. 应用 migration：`supabase db reset`

**日常开发**：
```bash
pnpm dev:h5              # 编译 packages + 起 H5 dev server (http://localhost:10086)
pnpm build:packages      # 单独编译 workspace packages
pnpm typecheck           # 全 workspace typecheck
```

详细命令 / 端口 / 常见坑见 [QUICKSTART.md](./QUICKSTART.md)。

## 文档索引

**产品**：
- [docs/core-idea.md](./docs/core-idea.md) — 产品核心思想
- [docs/design-principles.md](./docs/design-principles.md) — 11 条设计原则（决策优先级）
- [docs/PRD.md](./docs/PRD.md) — v2 MVP 需求文档

**研究**：
- [docs/research/product-benchmark.md](./docs/research/product-benchmark.md) — 6 款海外产品对标（Bearable / Daylio / HWF / Finch / Reflectly / Down Dog）
- [docs/research/xhs-insights.md](./docs/research/xhs-insights.md) — 小红书用户调研（4 轮关键词 + 30+ 条正文详情）
- [docs/research/ui-reference-gallery.md](./docs/research/ui-reference-gallery.md) — UI/UX 参考图鉴

**设计 handoff**：
- [design/design_handoff_mindful_movement_journal/README.md](./design/design_handoff_mindful_movement_journal/README.md) — Handoff spec（8 页面 + tokens + 交互 + 数据结构）
- [design/design_handoff_mindful_movement_journal/身心训练记录 App.dc.html](./design/design_handoff_mindful_movement_journal/) — 高保真原型（浏览器打开可交互）

**技术**：
- [QUICKSTART.md](./QUICKSTART.md) — 本地开发速查（命令 / 端口 / 常见坑 / 包 import 规则）
- [supabase/migrations/README.md](./supabase/migrations/README.md) — 数据库 migration 说明
- [packages/assets/preview.html](./packages/assets/preview.html) — 素材 preview（图标 · 体式简笔 · BodyFigure · content 全部数据可视化）

## Monorepo 布局

```
body-diary/
├── apps/
│   └── weapp/                   # Taro (WeChat MP + H5) — Phase 1
├── packages/
│   ├── core/                    # Zod schemas · Supabase client · 业务逻辑
│   ├── design-tokens/           # CSS variables / SCSS / TS tokens (fresh + earth)
│   ├── assets/                  # SVG icons · pose sketches · BodyFigure 布局数据
│   └── content/                 # 10 poses · 20 muscles · 象限词库 · 招呼语 · onboarding
├── supabase/                    # migrations + edge functions
├── docs/                        # PRD / core-idea / design-principles / research
└── design/                      # handoff (design_handoff_mindful_movement_journal/)
```

包命名：`@body-diary/<name>`，全部 workspace 内部依赖（`workspace:*`）。

## 目标端 / 长期架构

**当前 Phase 1**（这个 repo · Sprint 0-2）：
- **微信小程序 + H5**（Taro 4.1）—— 主战场，MP 是重要引流入口
- Supabase 全远端 + 本地 Docker 开发

**Phase 2**（未来）：
- **Web (Next.js)** —— 独立 `apps/web`，桌面端极致 UI（Taro 的 H5 输出主要给手机浏览器）

**Phase 3**（未来）：
- **iOS (SwiftUI)** —— 独立 `apps/ios`

三端共享 `packages/*`（数据 · 资产 · tokens · 业务逻辑）。UI 层各自最优实现。

**架构决策全记录见 [Claude memory · architecture.md](.claude/architecture-notes-see-project-memory.md)**（实际路径在 `~/.claude/projects/<encoded>/memory/`）。

## 贡献 / 内部协作

单人项目，暂无 CONTRIBUTING。改动前建议：
1. 读 [docs/core-idea.md](./docs/core-idea.md) + [docs/design-principles.md](./docs/design-principles.md) 确认方向对齐
2. 读 [docs/PRD.md](./docs/PRD.md) 确认功能范围
3. 动手前跑 `pnpm typecheck` 保证基线绿
4. 改 packages/* 后记得 `pnpm build:packages`
