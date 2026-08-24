-- ============================================================
-- 015 · practice_sessions 表 + diary_entries.practice_session_id
--
-- 核心设计：
--   - "练习 (practice)" 和 "记录 (diary_entry)" 是两个实体
--   - 一次练习可以有多条记录（当场首条 + 后续追加的感受）
--   - 用户交互仍然极简: 点 + = 新建一次练习 + 首条记录（一步完成）
--   - 详情页可以轻量追加感受 or 跳完整 record 页
--
-- 表结构：
--   practice_sessions: 一次练习本身（活动类型 · 体式 · 时间 · 第 N 次）
--   diary_entries: 归属到某个 practice_session 的一条记录
--
-- 数据兼容：v2 dev 阶段，现有 diary_entries 会因 NOT NULL 约束被 db reset 清空。
-- Sprint 2.5 后所有新写入都必须先建 practice_session。
-- ============================================================

CREATE TABLE public.practice_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- 第 N 次练习（累积课时的真正含义，1-indexed per user）
  practice_number   INT NOT NULL,
  activity_type     activity_type NOT NULL DEFAULT 'yoga',
  activity_name     TEXT,                        -- 具体名称 "热瑜伽" / "大器械课" 等
  -- 主体式（可选；从首条记录 pose_id 取值，也可用户手动改）
  pose_id           TEXT,
  custom_pose_name  TEXT,
  -- 练习本身发生的时间（可能早于首条记录的 created_at）
  practiced_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER practice_sessions_updated_at
  BEFORE UPDATE ON public.practice_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: per-user isolation
CREATE POLICY "Users can view own practices"
  ON public.practice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own practices"
  ON public.practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own practices"
  ON public.practice_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own practices"
  ON public.practice_sessions FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_sessions TO authenticated;

CREATE INDEX idx_practice_sessions_user_id     ON public.practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_practiced_at ON public.practice_sessions(user_id, practiced_at DESC);
CREATE INDEX idx_practice_sessions_activity    ON public.practice_sessions(user_id, activity_type);
CREATE INDEX idx_practice_sessions_pose_id     ON public.practice_sessions(pose_id);

-- ─── diary_entries.practice_session_id ─────────────────────

-- v2 dev 环境：清掉现有 entries（因为新的 NOT NULL 约束）
DELETE FROM public.diary_entries;

ALTER TABLE public.diary_entries
  ADD COLUMN practice_session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE;

CREATE INDEX idx_diary_entries_practice_session ON public.diary_entries(practice_session_id);

-- ─── next_practice_number RPC ─────────────────────────────

CREATE OR REPLACE FUNCTION next_practice_number(p_user_id UUID)
RETURNS INT AS $$
  SELECT COALESCE(MAX(practice_number), 0) + 1
  FROM public.practice_sessions
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION next_practice_number(UUID) IS
  '返回该用户下一次练习应该使用的 practice_number（第 N 次练习）。';

GRANT EXECUTE ON FUNCTION public.next_practice_number(UUID) TO authenticated;
