-- 用户档案表
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wechat_openid TEXT UNIQUE,
  nickname TEXT,
  avatar_url TEXT,

  -- LLM BYOK 配置
  llm_provider TEXT CHECK (llm_provider IN ('claude', 'openai', 'zhipu', 'tongyi', 'deepseek', 'custom')),
  llm_api_key TEXT,
  llm_model TEXT,
  llm_base_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
