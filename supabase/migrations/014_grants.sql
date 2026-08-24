-- ============================================================
-- 014 · GRANT 基础表权限给 authenticated / anon roles
--
-- Supabase 新的默认行为（对应 config.toml 里 auto_expose_new_tables 关闭）：
-- ENABLE RLS + 定义 policy 是不够的，还必须显式 GRANT SELECT/INSERT/UPDATE/DELETE
-- 给对应 role，RLS 才会介入过滤。
--
-- 参考错误信息：`permission denied for table profiles` (code 42501)
-- 解决：把 v2 用到的表都赋权给 authenticated；RLS policy 会在此基础上按行过滤。
-- ============================================================

-- 用户数据表（RLS 已在各表 migration 里 enable）
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diary_entries    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_annotations TO authenticated;

-- v1 遗留表（v2 不主动写，但保留读权限避免旧代码运行时崩）
GRANT SELECT ON public.knowledge_cards TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_materials TO authenticated;

-- RPC 函数
GRANT EXECUTE ON FUNCTION public.next_session_number(UUID) TO authenticated;

-- Sequence（如果表用了 SERIAL/BIGSERIAL 会用；当前 diary_entries 用 gen_random_uuid 不需要，
-- 但 profile 触发器等以后可能用，先给上）
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
