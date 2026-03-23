CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE knowledge_category AS ENUM (
  'body_awareness', 'meditation', 'muscle_anatomy', 'movement_pattern',
  'recovery', 'breathing', 'mindfulness'
);

CREATE TYPE content_type AS ENUM (
  'text_card', 'video', 'infographic', 'guided_practice'
);

CREATE TABLE public.knowledge_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category knowledge_category NOT NULL,
  content_type content_type NOT NULL DEFAULT 'text_card',
  media_url TEXT,
  body_parts body_part[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 3),
  is_builtin BOOLEAN DEFAULT TRUE,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.knowledge_cards ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_knowledge_cards_category ON public.knowledge_cards(category);
CREATE INDEX idx_knowledge_cards_body_parts ON public.knowledge_cards USING GIN(body_parts);
CREATE INDEX idx_knowledge_cards_tags ON public.knowledge_cards USING GIN(tags);
