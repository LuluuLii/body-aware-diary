-- ============================================================
-- 017 · pose 多选支持
--
-- Sprint 2.7-A：一节课通常练到多个 pose（尤其芭蕾/瑜伽），
-- 单值 pose_id 不够用。改为数组：
--   practice_sessions.pose_ids TEXT[]         (内置 pose id 或未来的 user_poses uuid)
--   practice_sessions.custom_pose_names TEXT[] (纯文字自定义，无对应实体)
--   diary_entries 同样字段
--
-- 另外：body_annotations 加 pose_id (可选)，让"这块肌肉的酸" 能关联到
-- practice.pose_ids 里的某一个具体 pose（用户在肌肉标注环节可选）。
--
-- 现有数据（一条 ballet 记录）就地迁移，不会丢：
--   原 pose_id → ARRAY[pose_id] 或 '{}'（null 情况）
-- ============================================================

BEGIN;

-- ─── practice_sessions ────────────────────────────────

DROP INDEX IF EXISTS idx_practice_sessions_pose_id;

ALTER TABLE public.practice_sessions
  ADD COLUMN pose_ids TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN custom_pose_names TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.practice_sessions
  SET pose_ids = CASE WHEN pose_id IS NULL THEN '{}'::TEXT[] ELSE ARRAY[pose_id] END,
      custom_pose_names = CASE WHEN custom_pose_name IS NULL THEN '{}'::TEXT[] ELSE ARRAY[custom_pose_name] END;

ALTER TABLE public.practice_sessions
  DROP COLUMN pose_id,
  DROP COLUMN custom_pose_name;

CREATE INDEX idx_practice_sessions_pose_ids ON public.practice_sessions USING GIN(pose_ids);

-- ─── diary_entries ────────────────────────────────────

DROP INDEX IF EXISTS idx_diary_entries_pose_id;

ALTER TABLE public.diary_entries
  ADD COLUMN pose_ids TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN custom_pose_names TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.diary_entries
  SET pose_ids = CASE WHEN pose_id IS NULL THEN '{}'::TEXT[] ELSE ARRAY[pose_id] END,
      custom_pose_names = CASE WHEN custom_pose_name IS NULL THEN '{}'::TEXT[] ELSE ARRAY[custom_pose_name] END;

ALTER TABLE public.diary_entries
  DROP COLUMN pose_id,
  DROP COLUMN custom_pose_name;

CREATE INDEX idx_diary_entries_pose_ids ON public.diary_entries USING GIN(pose_ids);

-- ─── body_annotations.pose_id ─────────────────────────

ALTER TABLE public.body_annotations
  ADD COLUMN pose_id TEXT;

COMMENT ON COLUMN public.body_annotations.pose_id IS
  '可选：该肌肉标注关联到 practice.pose_ids 里的哪个 pose（内置 pose id 或 user_pose uuid）。
   用于回答"这块酸是练哪个体式来的"。';

CREATE INDEX idx_body_annotations_pose_id ON public.body_annotations(pose_id);

COMMIT;
