-- ============================================================
-- 016 · activity_type enum 精简 + 数据就地迁移
--
-- Sprint 2.6 决定：
--   - 合并 yoga + pilates → yoga_mat（垫上）
--   - 舞蹈范围过大，暂时只支持芭蕾： dance → ballet
--   - 去掉 cardio / flexibility / martial_arts / meditation（用户没经验做这么多类目，慢慢加）
--   - 保留 swimming / strength / running / cycling / hiking / rehabilitation / other
--
-- 因为要删 enum 值，PG 不支持直接 DROP VALUE，走"新建 enum → ALTER COLUMN TYPE
-- 转换 CASE 迁移 → 删旧 enum → 重命名"的完整方案。
-- 现有数据（那条 dance 芭蕾课笔记）就地迁移，不会丢。
-- ============================================================

BEGIN;

-- 1. 新 enum type
CREATE TYPE activity_type_new AS ENUM (
  'yoga_mat', 'ballet', 'swimming', 'strength',
  'running', 'cycling', 'hiking', 'rehabilitation', 'other'
);

-- 2. practice_sessions.activity_type 迁移
ALTER TABLE public.practice_sessions
  ALTER COLUMN activity_type DROP DEFAULT;

ALTER TABLE public.practice_sessions
  ALTER COLUMN activity_type TYPE activity_type_new
  USING (
    CASE activity_type::text
      WHEN 'dance'         THEN 'ballet'
      WHEN 'yoga'          THEN 'yoga_mat'
      WHEN 'pilates'       THEN 'yoga_mat'
      WHEN 'cardio'        THEN 'other'
      WHEN 'flexibility'   THEN 'other'
      WHEN 'martial_arts'  THEN 'other'
      WHEN 'meditation'    THEN 'other'
      ELSE activity_type::text
    END::activity_type_new
  );

ALTER TABLE public.practice_sessions
  ALTER COLUMN activity_type SET DEFAULT 'yoga_mat';

-- 3. diary_entries.activity_type 迁移（同样规则）
ALTER TABLE public.diary_entries
  ALTER COLUMN activity_type DROP DEFAULT;

ALTER TABLE public.diary_entries
  ALTER COLUMN activity_type TYPE activity_type_new
  USING (
    CASE activity_type::text
      WHEN 'dance'         THEN 'ballet'
      WHEN 'yoga'          THEN 'yoga_mat'
      WHEN 'pilates'       THEN 'yoga_mat'
      WHEN 'cardio'        THEN 'other'
      WHEN 'flexibility'   THEN 'other'
      WHEN 'martial_arts'  THEN 'other'
      WHEN 'meditation'    THEN 'other'
      ELSE activity_type::text
    END::activity_type_new
  );

ALTER TABLE public.diary_entries
  ALTER COLUMN activity_type SET DEFAULT 'other';

-- 4. 删旧 enum + 重命名新 enum → activity_type
DROP TYPE activity_type;
ALTER TYPE activity_type_new RENAME TO activity_type;

COMMIT;
