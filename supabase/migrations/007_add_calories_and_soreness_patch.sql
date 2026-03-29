-- Migration 007: Add calories to diary_entries, soreness_recorded_at to body_annotations
-- These fields support manual calorie logging and delayed soreness (DOMS) tracking.

-- Add calories column to diary_entries
ALTER TABLE public.diary_entries
  ADD COLUMN IF NOT EXISTS calories INTEGER;

-- Add soreness_recorded_at to body_annotations
-- When non-null, this annotation was logged AFTER the original workout (e.g. DOMS 24-72h later).
ALTER TABLE public.body_annotations
  ADD COLUMN IF NOT EXISTS soreness_recorded_at TIMESTAMPTZ;

-- Index for querying delayed soreness annotations
CREATE INDEX IF NOT EXISTS idx_body_annotations_soreness_recorded_at
  ON public.body_annotations(soreness_recorded_at)
  WHERE soreness_recorded_at IS NOT NULL;
