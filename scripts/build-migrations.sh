#!/usr/bin/env bash
# scripts/build-migrations.sh
# 把 supabase/migrations/*.sql 按序号拼成 v2 精简版 all-migrations.sql
# 用于阿里云 DMS 一次执行
#
# v2.9 精简: 跳过 v1 的 knowledge 表（needs pgvector）+ pg_trgm 全文搜索 v2 没用
# 同时去掉嵌套 BEGIN/COMMIT 避免跟 DMS 外层 transaction 冲突
#
# 使用: bash scripts/build-migrations.sh
# 输出: build/all-migrations.sql

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"
OUT_DIR="$ROOT_DIR/build"
OUT_FILE="$OUT_DIR/all-migrations.sql"

mkdir -p "$OUT_DIR"

# v2 用不到的 migration:
#   004_create_knowledge.sql    → 依赖 pgvector, knowledge_cards 表 v2 未引用
#   005_create_user_materials.sql → 依赖 pgvector, user_materials 表 v2 未引用
SKIP=("004_create_knowledge" "005_create_user_materials")

is_skipped() {
  local filename=$1
  for skip in "${SKIP[@]}"; do
    if [[ "$filename" == *"$skip"* ]]; then
      return 0
    fi
  done
  return 1
}

{
  cat <<'HEADER'
-- ============================================================
-- Body Awareness Diary · v2 精简 migration (POC · 阿里云 RDS Supabase)
--
-- 跳过 v1 的 knowledge_cards / user_materials (需要 pgvector, v2 未用)
-- 跳过 pg_trgm 相关索引 (v2 未用全文搜索)
-- 去掉嵌套 BEGIN/COMMIT (跟 DMS 外层 transaction 打架)
-- 去掉 006 里对 004/005 表的 RLS policy
--
-- 执行方式:
--   1. 到阿里云 DMS 里打开你的 RDS SQL Console
--   2. 先清空 public schema (如果之前有半成品):
--        DROP SCHEMA IF EXISTS public CASCADE;
--        CREATE SCHEMA public;
--        GRANT ALL ON SCHEMA public TO postgres;
--        GRANT ALL ON SCHEMA public TO public;
--   3. 复制本文件全部内容, 一次粘贴执行
--   4. 验证: SELECT tablename FROM pg_tables WHERE schemaname='public';
-- ============================================================

HEADER

  for file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
    filename=$(basename "$file")
    if is_skipped "$filename"; then
      echo ""
      echo "-- SKIPPED: $filename (v2 未使用)"
      continue
    fi
    echo ""
    echo "-- ═════════════════════════════════════════════════"
    echo "-- $filename"
    echo "-- ═════════════════════════════════════════════════"
    # 对每个文件做处理:
    #   1. 去掉嵌套的 BEGIN; / COMMIT; (跟 DMS 外层 transaction 打架)
    #   2. 002 里的 pg_trgm CREATE EXTENSION + 全文索引跳过
    #   3. 006 里 knowledge_cards / user_materials 的整个 CREATE POLICY 块跳过
    #      (需要 collect-then-decide, 因为 CREATE POLICY 是多行 SQL)
    awk '
      # skip nested transaction boundaries
      /^BEGIN;/ { next }
      /^COMMIT;/ { next }
      # skip pg_trgm bits
      /pg_trgm/ { next }
      /gin_trgm_ops/ { next }

      # State machine for multi-line CREATE POLICY:
      # buffer 整个 statement, 结束时看含不含 knowledge_cards/user_materials 决定是否丢
      /^CREATE POLICY/ {
        buffer = $0
        in_policy = 1
        # 如果同一行就有分号 (single-line policy) 也要处理
        if (/;[[:space:]]*$/) {
          if (buffer !~ /knowledge_cards|user_materials/) print buffer
          buffer = ""
          in_policy = 0
        }
        next
      }
      in_policy == 1 {
        buffer = buffer "\n" $0
        if (/;[[:space:]]*$/) {
          if (buffer !~ /knowledge_cards|user_materials/) print buffer
          buffer = ""
          in_policy = 0
        }
        next
      }

      { print }
    ' "$file"
    echo ""
  done

  cat <<'FOOTER'

-- ============================================================
-- 迁移完成. 验证:
--   SELECT tablename FROM pg_tables WHERE schemaname='public';
-- 期望看到: profiles, diary_entries, body_annotations, practice_sessions,
--          user_poses 等 v2 核心表
-- ============================================================
FOOTER
} > "$OUT_FILE"

echo "✓ Migration 打包完成: $OUT_FILE"
wc -l "$OUT_FILE"
