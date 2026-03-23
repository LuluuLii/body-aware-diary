import type { ActivityType } from '@/types/diary'

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  strength: '力量训练',
  cardio: '有氧运动',
  flexibility: '柔韧训练',
  yoga: '瑜伽',
  pilates: '普拉提',
  dance: '舞蹈',
  martial_arts: '武术',
  swimming: '游泳',
  running: '跑步',
  cycling: '骑行',
  hiking: '徒步',
  rehabilitation: '康复训练',
  meditation: '冥想',
  other: '其他',
}

export const FEELING_LABELS = ['', '很差', '一般', '还好', '不错', '很棒']
export const FEELING_EMOJIS = ['', '😞', '😐', '🙂', '😊', '🤩']

export const INTENSITY_LABELS: Record<number, string> = {
  1: '非常轻松',
  2: '轻松',
  3: '中等偏轻',
  4: '中等',
  5: '中等偏重',
  6: '较重',
  7: '重',
  8: '很重',
  9: '极重',
  10: '极限',
}

export const PAGE_SIZE = 20
