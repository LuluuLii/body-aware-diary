-- ============================================================
-- 011 · body_annotations muscle-level migration
-- 从 v1 "部位级"（body_part enum）迁移到 v2 "肌肉级"（muscle_asset_id）。
--
-- v1 记录保留：body_part 字段变为 nullable，旧数据不动。
-- v2 新记录：使用 muscle_asset_id，对应 @body-diary/assets muscleLayout ids
--             (如 'delt_l', 'hip_r' 等)。
--
-- sensation_type enum 新增 'swell'(涨) 和 'none'(无感) 两个 v2 需要的值；
-- 其余 v2 值（酸/紧/温）已在 v1 枚举里存在（soreness/tightness/warmth）。
-- ============================================================

-- 1) 新增 sensation_type 枚举值
--    ADD VALUE 支持 IF NOT EXISTS（PG 12+），可幂等
ALTER TYPE sensation_type ADD VALUE IF NOT EXISTS 'swell';
ALTER TYPE sensation_type ADD VALUE IF NOT EXISTS 'none';

-- 2) body_part 变 nullable（v2 记录不用它）
ALTER TABLE public.body_annotations
  ALTER COLUMN body_part DROP NOT NULL;

-- 3) intensity 变 nullable（v2 tag 无强度分级）
ALTER TABLE public.body_annotations
  ALTER COLUMN intensity DROP NOT NULL;

-- 4) 新增 muscle_asset_id 列（v2 主字段）
ALTER TABLE public.body_annotations
  ADD COLUMN muscle_asset_id TEXT;

COMMENT ON COLUMN public.body_annotations.muscle_asset_id IS
  'v2 肌肉级 asset id (matches @body-diary/assets muscleLayout entries: delt_l, hip_r, etc.). v1 records use body_part instead.';

CREATE INDEX idx_body_annotations_muscle_asset_id
  ON public.body_annotations(muscle_asset_id);

-- 5) 约束：必须至少有 body_part（v1）或 muscle_asset_id（v2），不能都空
ALTER TABLE public.body_annotations
  ADD CONSTRAINT body_annotations_target_check
  CHECK (body_part IS NOT NULL OR muscle_asset_id IS NOT NULL);

-- 6) （可选）为 v2 记录聚合查询建索引：按 entry_id + muscle_asset_id 唯一
--     用户可能在同一条 entry 上给同一块肌肉多次标注，但通常只标一次；
--     不加唯一约束以保留灵活性，只加复合索引提查询速度。
CREATE INDEX idx_body_annotations_entry_muscle
  ON public.body_annotations(entry_id, muscle_asset_id)
  WHERE muscle_asset_id IS NOT NULL;
