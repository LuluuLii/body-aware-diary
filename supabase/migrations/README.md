# Supabase Migrations

## 架构决策（2026-07-22）

**Sprint 0-1 走"全远端 + 本地 Docker 开发"**：
- 开发时 `supabase start` 起本地 Postgres/Auth/Storage，零云端依赖
- 决定上云再 `supabase db push`

**关键简化**：**系统字典（muscles / poses / families / pose_muscle_map）不进 DB**，只在 `@body-diary/content` 里 bundle 到 app。
- 好处：减少 SQL seed 和 content package 的漂移风险；apps 直接 import content 就能用
- 代价：想动态更新体式库需要发版 —— MVP 阶段可接受

**Profile 元数据（theme_preference / onboarding_seen）也不进 DB**，走客户端 storage（`wx.setStorage` / `localStorage`）。

**长期方向**：v2 上线前重构为 **local-first + 后台同步**（方案 2），届时本地是 source of truth，Supabase 变成 sync 目标。

## 迁移序列

| # | 文件 | 内容 | 状态 |
|---|---|---|---|
| 001-007 | v1 | 保留不动 | ✅ |
| ~~008 muscles~~ | 已砍 | 字典存 `@body-diary/content` | ❌ |
| ~~009 poses~~ | 已砍 | 同上 | ❌ |
| **010** | `010_diary_entries_v2.sql` | `diary_entries` 扩展 v2 列（sensation_coord / activation_note / pose_id 等）+ `next_session_number()` | ✅ |
| **011** | `011_body_annotations_muscle_level.sql` | `body_annotations` 从部位级 → 肌肉级 + 新增 `swell`/`none` 感受枚举 | ✅ |
| ~~012 profiles onboarding~~ | 已砍 | 走客户端 storage | ❌ |
| **013** | `013_entry_media_storage.sql` | Storage bucket `entry-media` + RLS | ✅ |

**pose_id 特殊说明**：010 里的 `pose_id` 列**不加外键约束**，因为 poses 表不存在。它存的是 content package 里的 pose id 字符串（如 `'p_bridge'`）。客户端负责保证一致性。

## 应用方法

### 路径 A: Supabase CLI（推荐）

**一次性安装**：
```bash
brew install supabase/tap/supabase
```

**首次初始化 workspace**（如果 `supabase/config.toml` 不存在）：
```bash
cd /Users/chenlu/Developer/github.com/LuluuLii/body-aware-diary
supabase init
# 保留 migrations/ / functions/ / seed/ 目录不动，config.toml 会新建
```

**本地开发**（推荐 Sprint 0-1 只这样）：
```bash
supabase start                # 起本地 Docker
                              # 打印 API URL / anon key / studio URL / db url
                              # → 把 URL/key 写到 apps/weapp/.env.local

supabase db reset             # 重跑所有 migration (v1 001-007 + v2 010/011/013)
                              # 每次改 SQL 后跑这个刷新
```

**云端**（决定上线时再做）：
```bash
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

### 路径 B: Supabase Dashboard 手动粘贴

只在不装 CLI 时用。按顺序打开 010 → 011 → 013 每个 `.sql` 文件粘到 Dashboard SQL Editor 里 Run。

## 数据一致性

以下必须保持同步（当前手动维护，未来加 CI 校验）：

- `@body-diary/content src/poses.ts` 里的 pose id ↔ `010 diary_entries.pose_id` 存的值（无外键，客户端负责）
- `@body-diary/assets muscleLayout.ts` 里的肌肉 id ↔ `011 body_annotations.muscle_asset_id` 存的值（无外键）

## 已知 gotcha

1. **`ALTER TYPE ADD VALUE`（011）**：Postgres 12+ 支持事务内执行 + `IF NOT EXISTS` 幂等。Supabase 用 15+，OK。
2. **Storage bucket（013）**：`storage.buckets` INSERT 需要 postgres 权限，本地 / 云端都可正常执行。

## 未来重构（v2 上线前）

方向：**local-first + 后台同步**（Notion / Bearable 架构）
- 本地 IndexedDB / SQLite / wx storage 是 source of truth
- 后台异步 sync 到 Supabase 作为备份 + 跨设备
- 冲突用 last-write-wins（MVP 够）；有需要再上 CRDT
- 需要单独设计 sync 状态机、错误重试、离线队列

到那时可能需要新的 migration：
- `diary_entries` 加 `sync_status` / `client_updated_at` / `client_id` 字段
- 建 `sync_log` 表追踪同步历史
