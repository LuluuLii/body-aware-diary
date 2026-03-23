export type LLMProvider = 'claude' | 'openai' | 'zhipu' | 'tongyi' | 'deepseek' | 'custom'

export interface LLMConfig {
  provider: LLMProvider
  api_key: string
  model: string
  base_url?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  content: string
  sources?: RetrievedSource[]
}

export interface RetrievedSource {
  id: string
  title: string
  content: string
  source_type: 'builtin' | 'user_material'
  similarity: number
}

export const LLM_PROVIDER_LABELS: Record<LLMProvider, string> = {
  claude: 'Claude (Anthropic)',
  openai: 'OpenAI',
  zhipu: '智谱 GLM',
  tongyi: '通义千问',
  deepseek: 'DeepSeek',
  custom: '自定义',
}

export const DEFAULT_MODELS: Record<LLMProvider, string[]> = {
  claude: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini'],
  zhipu: ['glm-4', 'glm-4-flash'],
  tongyi: ['qwen-plus', 'qwen-turbo'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  custom: [],
}
