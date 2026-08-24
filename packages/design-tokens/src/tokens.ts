// @body-diary/design-tokens · tokens.ts
// Source of truth for all design tokens. Handoff spec (森林晨光).
// Consumers: apps/weapp SCSS (via tokens.scss), future apps/web + apps/ios (via JSON export).

// ------------------------------------------------------------------
// Themes
// ------------------------------------------------------------------

export type Theme = 'fresh' | 'earth'

// Fresh (森林晨光) — from handoff README, canonical values
export const freshColors = {
  ink: '#33382E',                   // 主墨色（正文/标题）
  green: '#4C5D46',                 // 主强调 · 森林绿
  greenDeep: '#41503C',             // 深绿卡片背景
  greenText: '#F3EEDF',             // 深绿卡片上文字
  greenTextSub: '#B9C0A2',          // 深绿卡片上次级文字
  paperBg: '#F4EFE3',               // 纸张底色（页面背景）
  paperGrid: '#E7DFCB',             // 纸张格线（26px 网格）
  cardBg: '#FBF8EF',                // 卡片背景（暖白）
  cardBorder: '#E4DBC4',            // 卡片描边
  textSecondary: '#8A8770',         // 次级文字
  textTertiary: '#9A9578',          // 更浅文字
  textTag: '#A59A78',               // 标签灰
  chipBg: '#EFEADB',                // 胶囊底色
  segmentBg: '#E7E0CD',             // 分段控件底
  handwritten: '#9A8C6A',           // 手写体点缀色
} as const

// Earth (大地深处) — dark inversion, provisional. Refine when we care.
export const earthColors = {
  ink: '#EDE7D6',
  green: '#A9BA88',
  greenDeep: '#2F3C2A',
  greenText: '#EDE7D6',
  greenTextSub: '#9BAA80',
  paperBg: '#232420',
  paperGrid: '#2F2D28',
  cardBg: '#2F2E29',
  cardBorder: '#3D3B34',
  textSecondary: '#B4AF98',
  textTertiary: '#928D77',
  textTag: '#847E68',
  chipBg: '#333029',
  segmentBg: '#3A3830',
  handwritten: '#C7B58C',
} as const

// Structural palette type — widens `as const` literal values to plain strings so
// both freshColors and earthColors satisfy it despite having different hex literals.
export type ColorPalette = { readonly [K in keyof typeof freshColors]: string }

// ------------------------------------------------------------------
// Accent tokens (theme-agnostic — same values across themes)
// ------------------------------------------------------------------

// 感受色（身体标注 / 标签点）
export const sensationColors = {
  sour: '#CE8F82',    // 酸
  tight: '#B98A5C',   // 紧
  warm: '#D3B072',    // 温
  swell: '#93A57C',   // 涨
  loose: '#8FA07B',   // 松
  none: '#B4B0A2',    // 无感
} as const

export type SensationName = keyof typeof sensationColors

// SensationPicker 2×2 象限色
export const quadrantColors = {
  over: '#E1C6B4',    // 过载（左上：消耗 + 训练感深）
  full: '#C7D3AE',    // 饱满（右上：滋养 + 训练感深）
  un:   '#D9D3C3',    // 未启（左下：消耗 + 训练感浅）
  ease: '#DCE4CE',    // 舒展（右下：滋养 + 训练感浅）
} as const

export type QuadrantName = keyof typeof quadrantColors

// 年度色卡梯度
export const yearGradient = {
  positive: ['#EAE3D2', '#CBD4B0', '#A9BA88', '#7C935E', '#4C5D44'], // 滋养 → 充分
  negative: ['#EAE3D2', '#E4C6B4', '#D6AC97', '#C9987F', '#BE8A70'], // 过载 → 消耗
  empty: '#EAE3D2',                                                    // 无记录
} as const

// ------------------------------------------------------------------
// Typography
// ------------------------------------------------------------------

export const fontFamily = {
  serif: '"Noto Serif SC", "PingFang SC", serif',
  sans: '"Noto Sans SC", -apple-system, "PingFang SC", "Helvetica Neue", sans-serif',
  handwritten: '"Caveat", cursive',
} as const

// ------------------------------------------------------------------
// Border radii (px)
// ------------------------------------------------------------------

export const radii = {
  xl: 22,     // 大卡片
  lg: 20,     // 中大卡片
  md: 18,     // 中卡片
  chip: 16,   // 胶囊 / 中标签
  sm: 14,     // 小胶囊 / 分段控件
  xs: 8,      // 小色块
  micro: 2,   // 细节
} as const

// ------------------------------------------------------------------
// Shadows
// ------------------------------------------------------------------

export const shadows = {
  card: '0 12px 24px -20px rgba(60, 66, 45, 0.5)',
  cardDeep: '0 16px 30px -22px rgba(50, 60, 40, 0.85)',
  tabBar: '0 14px 30px -18px rgba(50, 56, 40, 0.5)',
  floatingButton: '0 12px 24px -8px rgba(50, 70, 40, 0.7)',
} as const

// ------------------------------------------------------------------
// Spacing (px)
// ------------------------------------------------------------------

export const spacing = {
  pageX: 22,             // 页面左右内边距（一般）
  pageXWide: 24,         // 页面左右（宽版）
  topSafe: 60,           // 顶部安全区起始
  tabBottom: 118,        // 底部为 Tab 留白
  cardGap: 16,           // 卡片纵向间距
  cardPadding: 20,       // 卡片内边距（大）
  cardPaddingCompact: 16,// 卡片内边距（紧）
} as const

// ------------------------------------------------------------------
// Aggregate export
// ------------------------------------------------------------------

export const tokens = {
  themes: {
    fresh: freshColors,
    earth: earthColors,
  },
  sensations: sensationColors,
  quadrants: quadrantColors,
  yearGradient,
  fontFamily,
  radii,
  shadows,
  spacing,
} as const

export type Tokens = typeof tokens

// ------------------------------------------------------------------
// Helper: theme palette lookup (for JS-side APIs, e.g. Taro.setBackgroundColor)
// ------------------------------------------------------------------

export function getPalette(theme: Theme): ColorPalette {
  return theme === 'earth' ? earthColors : freshColors
}
