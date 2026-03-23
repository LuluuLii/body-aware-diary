CREATE TYPE material_source AS ENUM (
  'text_input', 'url_import', 'file_upload', 'clipboard'
);

CREATE TABLE public.user_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source material_source NOT NULL DEFAULT 'text_input',
  source_url TEXT,
  tags TEXT[] DEFAULT '{}',
  body_parts body_part[] DEFAULT '{}',
  embedding vector(1536),
  is_embedded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_materials ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER user_materials_updated_at
  BEFORE UPDATE ON public.user_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_user_materials_user_id ON public.user_materials(user_id);

-- RAG 检索函数
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_user_id UUID,
  match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  source_type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT k.id, k.title, k.content, 'builtin'::TEXT,
         1 - (k.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_cards k
  WHERE k.embedding IS NOT NULL
  UNION ALL
  SELECT m.id, m.title, m.content, 'user_material'::TEXT,
         1 - (m.embedding <=> query_embedding) AS similarity
  FROM public.user_materials m
  WHERE m.user_id = match_user_id AND m.is_embedded = TRUE
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
