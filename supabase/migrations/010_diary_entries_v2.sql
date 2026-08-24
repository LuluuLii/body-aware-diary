-- ============================================================
-- 010 · diary_entries v2 extension
-- 扩展 v1 diary_entries 以承载 v2 身体觉察记录：
--   - sensation_coord   坐标点 (消耗↔滋养 × 训练感浅↔深)
--   - sensation_words   精确词（候选胶囊 + 自输入）
--   - session_number    累积课时（第 N 次）
--   - activation_note   发力感 / 老师的重点
--   - pose_id           关联体式（可选，允许 custom_pose_name）
--   - custom_pose_name  用户自定义体式名
--   - photo_urls        Storage 图片 URL
--   - voice_url         Storage 语音 URL
--
-- v1 字段（title / content / activity_type / intensity / overall_feeling / tags 等）保留，
-- 不使用即可；无需数据迁移。
-- ============================================================

-- SensationPicker 坐标（{x: float, y: float}，值域 [-1, 1]）
ALTER TABLE public.diary_entries
  ADD COLUMN sensation_coord JSONB;

COMMENT ON COLUMN public.diary_entries.sensation_coord IS
  'SensationPicker 2×2 coordinate: {x: float, y: float} in [-1, 1]. NULL = user did not place a point. 象限名派生自坐标（见 @body-diary/content nearestQuadrant）。';

-- 精确感受词（候选胶囊选中的 + 自由输入的，最多 3 个）
ALTER TABLE public.diary_entries
  ADD COLUMN sensation_words TEXT[] DEFAULT '{}';

-- 累积课时（第 N 次记录，1-indexed）
ALTER TABLE public.diary_entries
  ADD COLUMN session_number INT;

COMMENT ON COLUMN public.diary_entries.session_number IS
  '1-indexed cumulative session count for the user. Used by "第 N 次" time-axis / milestone reviews.';

CREATE INDEX idx_diary_entries_user_session
  ON public.diary_entries(user_id, session_number);

-- 发力感 / 老师的重点（v2 signature 字段，多行文本，可关联到 pose）
ALTER TABLE public.diary_entries
  ADD COLUMN activation_note TEXT;

-- 体式引用（可选；用户可以不选、或用自定义名）
-- 注意: 这里存的是 @body-diary/content src/poses.ts 里的 pose id (如 'p_bridge')，
-- 不是外键 —— 因为体式字典整个存在 client bundle 里，不进 DB（架构决策见 README）。
-- 如果未来把字典迁到 DB，加 FK: REFERENCES public.poses(id) ON DELETE SET NULL
ALTER TABLE public.diary_entries
  ADD COLUMN pose_id TEXT;

CREATE INDEX idx_diary_entries_pose_id
  ON public.diary_entries(pose_id);

-- 用户自定义体式名（当用户敲了"老师说的那个扭转"这类，不选正式体式时用）
ALTER TABLE public.diary_entries
  ADD COLUMN custom_pose_name TEXT;

-- 图片附件（Supabase Storage entry-media bucket 里的 object path 数组）
ALTER TABLE public.diary_entries
  ADD COLUMN photo_urls TEXT[] DEFAULT '{}';

-- 语音留言（Supabase Storage object path）
ALTER TABLE public.diary_entries
  ADD COLUMN voice_url TEXT;

-- ─── Helper function: compute next session_number for a user ─────

CREATE OR REPLACE FUNCTION next_session_number(p_user_id UUID)
RETURNS INT AS $$
  SELECT COALESCE(MAX(session_number), 0) + 1
  FROM public.diary_entries
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION next_session_number(UUID) IS
  '返回该用户下一条记录应该使用的 session_number（累积课时序号）。客户端 create entry 时可调用取值。';
