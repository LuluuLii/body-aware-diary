-- ============================================================
-- 018 · user_poses 表 · 用户自建 pose 支持
--
-- Sprint 2.7-B：用户在图鉴 "找不到？添加自定义" 入口 创建的私有 pose，
-- 后续可以在记录页 pose picker / body_annotations.pose_id 里被引用。
--
-- 内置 POSES (packages/content/poses.ts) 是 static seed data；
-- user_poses 是用户 runtime 添加。前端 lookup 时两者合并（内置优先），
-- practice.pose_ids / diary_entries.pose_ids 里可能出现两种 id：
--   - 内置: 短字符串 'p_bridge' / 'b_plie' 等
--   - 用户: UUID (gen_random_uuid())
--
-- 图片上传功能 Sprint 3 才做，image_url 字段先 nullable 留空。
-- ============================================================

CREATE TABLE public.user_poses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type     activity_type NOT NULL DEFAULT 'other',
  -- family 可空：用户可能不知道分到哪个族；null 时在 picker 里归到"自定义"组
  family            TEXT,
  name_zh           TEXT NOT NULL,
  name_en           TEXT,
  -- 主要激活肌群 group id 数组（从 packages/content/muscles 的 MUSCLES 选）
  main_muscle_ids   TEXT[] NOT NULL DEFAULT '{}',
  activation_cue    TEXT,
  compensation      TEXT,
  sensation_words   TEXT[] NOT NULL DEFAULT '{}',
  -- Sprint 3 会做图片上传
  image_url         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_poses ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER user_poses_updated_at
  BEFORE UPDATE ON public.user_poses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: 私有，每人只能看/改自己的
CREATE POLICY "Users can view own user_poses"
  ON public.user_poses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own user_poses"
  ON public.user_poses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_poses"
  ON public.user_poses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_poses"
  ON public.user_poses FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_poses TO authenticated;

CREATE INDEX idx_user_poses_user_id ON public.user_poses(user_id);
CREATE INDEX idx_user_poses_activity ON public.user_poses(user_id, activity_type);
