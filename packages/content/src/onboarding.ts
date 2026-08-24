// Onboarding tip content (PRD § 4.9).
// Each tip shows the first time the user reaches its trigger point; suppressed thereafter.
// Storage: `profiles.onboarding_seen` (JSON array of ids).

export type OnboardingId = 'record' | 'bodymap_annotate' | 'pose_detail'

export type OnboardingButton = { key: 'skip' | 'ok'; label: string }

export interface OnboardingTip {
  id: OnboardingId
  title: string
  /** Body lines. Rendered as separate paragraphs or a bulleted list depending on `layout`. */
  lines: readonly string[]
  buttons: readonly OnboardingButton[]
}

export const ONBOARDING_TIPS: Record<OnboardingId, OnboardingTip> = {
  record: {
    id: 'record',
    title: '你的第一次记录',
    lines: [
      '在这里，你可以留下：',
      '· 身体今天哪里被唤醒了',
      '· 老师说的发力点',
      '· 一句只属于你自己的感受',
      '最少一个字段，就是完整的一条。',
    ],
    buttons: [
      { key: 'skip', label: '跳过' },
      { key: 'ok',   label: '知道了' },
    ],
  },
  bodymap_annotate: {
    id: 'bodymap_annotate',
    title: '点选肌肉',
    lines: [
      '你可以标注这里的感受：',
      '酸 / 紧 / 温 / 涨 / 无感',
      '同一次记录可以标多块。',
    ],
    buttons: [{ key: 'ok', label: '知道了' }],
  },
  pose_detail: {
    id: 'pose_detail',
    title: '这是一份识别参考',
    lines: [
      '· 上方的人体图 = 主要激活肌群',
      '· 发力感线索 = 帮你找到觉察',
      '· 常见代偿点 = 提醒你留意',
      '这不是教程。想学怎么做，去线下课。',
    ],
    buttons: [{ key: 'ok', label: '知道了' }],
  },
}

// ─── Helpers ────────────────────────────────────────────

/**
 * Should this onboarding tip be shown to the user?
 * @param id — the tip to check
 * @param seenIds — ids the user has already seen (from profiles.onboarding_seen)
 */
export function shouldShowOnboarding(id: OnboardingId, seenIds: readonly OnboardingId[] | undefined): boolean {
  if (!seenIds) return true
  return !seenIds.includes(id)
}
