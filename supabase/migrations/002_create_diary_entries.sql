CREATE TYPE activity_type AS ENUM (
  'strength', 'cardio', 'flexibility', 'yoga', 'pilates', 'dance',
  'martial_arts', 'swimming', 'running', 'cycling', 'hiking',
  'rehabilitation', 'meditation', 'other'
);

CREATE TABLE public.diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  activity_type activity_type NOT NULL DEFAULT 'other',
  activity_name TEXT,
  duration_minutes INTEGER,
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 10),
  overall_feeling INTEGER CHECK (overall_feeling BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_diary_entries_user_id ON public.diary_entries(user_id);
CREATE INDEX idx_diary_entries_created_at ON public.diary_entries(created_at DESC);
CREATE INDEX idx_diary_entries_activity_type ON public.diary_entries(activity_type);
CREATE INDEX idx_diary_entries_tags ON public.diary_entries USING GIN(tags);

-- 全文搜索（中文支持）
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_diary_entries_title_trgm ON public.diary_entries USING GIN(title gin_trgm_ops);
CREATE INDEX idx_diary_entries_content_trgm ON public.diary_entries USING GIN(content gin_trgm_ops);
