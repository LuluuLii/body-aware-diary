// Pose families (瑜伽 7 大家族) — from XHS 社区分类学，见 docs/research/xhs-insights.md
// Used for reverse pose lookup (§ 4.6 in PRD) and knowledge encyclopedia.

// v2.6: family 从纯瑜伽扩展为跨品类。当前包含瑜伽 7 家族 + 芭蕾 3 家族。
// 未来加品类时（游泳泳姿、力量动作组），继续在此扩展。
// pose.family 语义："同一品类下的动作分组"。跨品类展示时要用 pose.activityType 隔离。
export const POSE_FAMILIES = [
  // 瑜伽/垫上
  '前屈',
  '后弯',
  '扭转',
  '侧弯',
  '平衡',
  '倒立',
  '中正',
  // 芭蕾
  '脚位',
  '手位',
  '动作',
] as const

export type PoseFamily = typeof POSE_FAMILIES[number]

export interface FamilyInfo {
  en: string
  description: string
}

export const FAMILY_INFO: Record<PoseFamily, FamilyInfo> = {
  '前屈': { en: 'Forward Bend',  description: '身体向前折叠，脊柱向前弯曲。舒缓神经，拉伸后侧链。' },
  '后弯': { en: 'Backbend',      description: '脊柱向后伸展，胸腔打开。改善体态，提升能量。' },
  '扭转': { en: 'Twist',         description: '脊柱水平旋转，躯干向左右扭转。按摩内脏，缓解僵硬。' },
  '侧弯': { en: 'Lateral Bend',  description: '身体向左右两侧弯曲。拉伸腰侧肌肉，改善呼吸。' },
  '平衡': { en: 'Balancing',     description: '单腿或单手支撑，身体保持稳定。提升专注力和核心。' },
  '倒立': { en: 'Inversion',     description: '头部低于心脏，身体倒置。促进循环，缓解疲劳。' },
  '中正': { en: 'Neutral',       description: '脊柱保持自然直立，身体居中。调整呼吸，稳定身心。' },
  '脚位': { en: 'Foot Position', description: '芭蕾五种基础外开脚位，是所有芭蕾动作的起点。' },
  '手位': { en: 'Arm Position',  description: '芭蕾基础手位（bras），决定上半身线条与呼吸走向。' },
  '动作': { en: 'Exercise',      description: '芭蕾基础动作（plié / tendu / relevé 等），从脚位/手位组合展开。' },
}
