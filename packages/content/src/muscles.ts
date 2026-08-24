// Muscle group metadata. groupId is the stable id; assetIds map to
// @body-diary/assets muscleLayout entries (may be empty if a group has no visual yet).
//
// v1 covers ~20 groups: 15 with visual layout in assets + 5 deep-layer groups
// (adductor / glute_med / diaphragm / pelvic_floor / transverse) that PRD flags as important
// but currently have no CSS-block hotzone. When we add pro anatomy SVGs (post-Sprint 0
// content sprint), those 5 get layout entries and this array can grow toward the PRD's
// aspirational 30-group target.

export interface MuscleGroup {
  /** Stable id */
  groupId: string
  nameZh: string
  nameEn: string
  /** Body region label — used in tooltips */
  bodyRegion: string
  /** One-line function summary */
  mainFunction: string
  /** Common felt sensations — surfaced as suggestions when user annotates this muscle */
  typicalFeelings: readonly string[]
  /** Common compensation pattern — surfaced in pose detail */
  commonCompensation?: string
  /**
   * Layout ids from @body-diary/assets that render this group.
   * Empty = group has metadata but no visual hotzone (deep-layer muscle).
   */
  assetIds: readonly string[]
}

export const MUSCLES: readonly MuscleGroup[] = [
  // ─── Front-visible groups ───────────────────────────────
  {
    groupId: 'delt_front',
    nameZh: '三角肌前束',
    nameEn: 'Anterior Deltoid',
    bodyRegion: '肩前',
    mainFunction: '手臂向前抬起、肩内旋。伏地类支撑体式常用。',
    typicalFeelings: ['肩前酸', '推手时紧', '发力'],
    commonCompensation: '容易替代肩胛肌群代偿——用手臂力量而不是背/核心稳定。',
    assetIds: ['delt_l', 'delt_r'],
  },
  {
    groupId: 'pec',
    nameZh: '胸大肌',
    nameEn: 'Pectoralis Major',
    bodyRegion: '胸前',
    mainFunction: '手臂向内、向前推。含胸姿势下容易变短紧。',
    typicalFeelings: ['胸前紧', '推手用力', '拉开'],
    commonCompensation: '含胸圆肩让胸肌短缩；打开胸腔时才能感受到延展。',
    assetIds: ['pec'],
  },
  {
    groupId: 'bi',
    nameZh: '肱二头肌',
    nameEn: 'Biceps Brachii',
    bodyRegion: '上臂前',
    mainFunction: '肘关节屈曲、前臂旋后。牵拉、拉起类动作参与。',
    typicalFeelings: ['上臂酸', '拉起时热'],
    assetIds: ['bi_l', 'bi_r'],
  },
  {
    groupId: 'rectus',
    nameZh: '腹直肌',
    nameEn: 'Rectus Abdominis',
    bodyRegion: '腹部前侧',
    mainFunction: '脊柱前屈、稳定骨盆。船式、卷腹类的主力。',
    typicalFeelings: ['腹部酸', '收紧', '发抖'],
    commonCompensation: '容易憋气；用颈部拉动而不是腹肌卷。',
    assetIds: ['rectus'],
  },
  {
    groupId: 'obl',
    nameZh: '腹外斜肌',
    nameEn: 'External Obliques',
    bodyRegion: '腰侧',
    mainFunction: '躯干扭转与侧屈。所有扭转体式的核心发力点。',
    typicalFeelings: ['侧腰扭开', '深处发力', '收紧'],
    commonCompensation: '用腰椎去扭而不是从胸椎发起；核心不参与。',
    assetIds: ['obl_l', 'obl_r'],
  },
  {
    groupId: 'hip',
    nameZh: '髂腰肌',
    nameEn: 'Iliopsoas / Hip Flexors',
    bodyRegion: '髋前',
    mainFunction: '髋关节屈曲、脊柱侧屈。久坐族最容易紧的一块。',
    typicalFeelings: ['髋前深', '涨', '拉开'],
    commonCompensation: '过短会导致骨盆前倾、下背疼痛。',
    assetIds: ['hip_l', 'hip_r'],
  },
  {
    groupId: 'quad',
    nameZh: '股四头肌',
    nameEn: 'Quadriceps',
    bodyRegion: '大腿前',
    mainFunction: '膝关节伸直、髋关节屈曲。站姿、平衡类的支撑力量。',
    typicalFeelings: ['大腿前酸', '有力', '稳'],
    commonCompensation: '髂腰肌无力时代偿屈髋；容易过度紧张。',
    assetIds: ['quad_l', 'quad_r'],
  },
  {
    groupId: 'shin',
    nameZh: '胫骨前肌',
    nameEn: 'Tibialis Anterior',
    bodyRegion: '小腿前',
    mainFunction: '脚踝背屈、稳定足弓。站立平衡的隐藏发力点。',
    typicalFeelings: ['小腿前酸', '足底稳'],
    assetIds: ['shin_l', 'shin_r'],
  },

  // ─── Back-visible groups ────────────────────────────────
  {
    groupId: 'trap',
    nameZh: '斜方肌',
    nameEn: 'Trapezius',
    bodyRegion: '上背',
    mainFunction: '肩胛骨的上提、下沉、收拢。含胸姿势下上束容易紧。',
    typicalFeelings: ['肩颈紧', '肩胛下沉'],
    commonCompensation: '手臂上举时容易耸肩——上束代偿而下束没参与。',
    assetIds: ['trap'],
  },
  {
    groupId: 'delt_back',
    nameZh: '三角肌后束',
    nameEn: 'Posterior Deltoid',
    bodyRegion: '肩后',
    mainFunction: '手臂向后打开、肩外旋。开肩类体式的关键。',
    typicalFeelings: ['肩后紧', '开肩发力'],
    assetIds: ['delt_bl', 'delt_br'],
  },
  {
    groupId: 'lat',
    nameZh: '背阔肌',
    nameEn: 'Latissimus Dorsi',
    bodyRegion: '中背',
    mainFunction: '手臂下拉、内收、内旋。下犬类支撑体式的重要肌群。',
    typicalFeelings: ['腋下拉开', '背有感'],
    commonCompensation: '容易被斜方肌上束代偿——耸肩而不是背发力。',
    assetIds: ['lat_l', 'lat_r'],
  },
  {
    groupId: 'erector',
    nameZh: '竖脊肌',
    nameEn: 'Erector Spinae',
    bodyRegion: '腰背',
    mainFunction: '脊柱伸直与后弯。后弯体式的主要参与者。',
    typicalFeelings: ['腰有力', '背延展'],
    commonCompensation: '腹肌无力时会代偿性紧张；导致腰部酸痛。',
    assetIds: ['erector'],
  },
  {
    groupId: 'glute',
    nameZh: '臀大肌',
    nameEn: 'Gluteus Maximus',
    bodyRegion: '臀部',
    mainFunction: '髋关节伸直、外旋。桥式、战士式的发力引擎。',
    typicalFeelings: ['臀有力', '收紧', '热'],
    commonCompensation: '腘绳肌代偿伸髋；腰椎代偿发力（腰酸而不是臀酸）。',
    assetIds: ['glute_l', 'glute_r'],
  },
  {
    groupId: 'ham',
    nameZh: '腘绳肌',
    nameEn: 'Hamstrings',
    bodyRegion: '大腿后',
    mainFunction: '膝关节屈曲、髋关节伸直。前屈体式的主要牵拉点。',
    typicalFeelings: ['大腿后侧被拉开', '涨', '紧'],
    commonCompensation: '紧的时候会拉着骨盆后倾、逼你弓背。',
    assetIds: ['ham_l', 'ham_r'],
  },
  {
    groupId: 'calf',
    nameZh: '腓肠肌',
    nameEn: 'Gastrocnemius',
    bodyRegion: '小腿后',
    mainFunction: '脚踝跖屈、膝关节屈曲。下犬式、山式常牵拉。',
    typicalFeelings: ['小腿后紧', '跟腱拉开'],
    assetIds: ['calf_l', 'calf_r'],
  },

  // ─── Deep / no-layout-yet groups (PRD 提到但 assets 尚未画) ────
  {
    groupId: 'adductor',
    nameZh: '内收肌群',
    nameEn: 'Adductors',
    bodyRegion: '大腿内侧',
    mainFunction: '大腿内收、髋关节稳定。束角式、三角式的关键。',
    typicalFeelings: ['大腿内侧拉开', '凉', '深'],
    assetIds: [],
  },
  {
    groupId: 'glute_med',
    nameZh: '臀中肌',
    nameEn: 'Gluteus Medius',
    bodyRegion: '髋外侧',
    mainFunction: '髋外展、稳定骨盆。单腿平衡与走路时的隐藏英雄。',
    typicalFeelings: ['髋外侧酸', '单腿稳'],
    commonCompensation: '弱时走路会歪髋、跑步会摇摆。',
    assetIds: [],
  },
  {
    groupId: 'diaphragm',
    nameZh: '横膈膜',
    nameEn: 'Diaphragm',
    bodyRegion: '胸腔底',
    mainFunction: '呼吸的主动肌。深呼吸训练它下降更多。',
    typicalFeelings: ['吸气深', '腹部起伏'],
    assetIds: [],
  },
  {
    groupId: 'pelvic_floor',
    nameZh: '盆底肌群',
    nameEn: 'Pelvic Floor',
    bodyRegion: '骨盆底',
    mainFunction: '支撑内脏、控制骨盆稳定、参与深层核心。',
    typicalFeelings: ['骨盆稳', '深处收紧'],
    assetIds: [],
  },
  {
    groupId: 'transverse',
    nameZh: '腹横肌',
    nameEn: 'Transverse Abdominis',
    bodyRegion: '腹深层',
    mainFunction: '深层核心。像腰带包裹腹腔，稳定脊柱。',
    typicalFeelings: ['深处稳', '腰带收紧'],
    assetIds: [],
  },
] as const

// ─── Lookup helpers ─────────────────────────────────────

export function getMuscleByGroupId(groupId: string): MuscleGroup | undefined {
  return MUSCLES.find((m) => m.groupId === groupId)
}

export function getMuscleByAssetId(assetId: string): MuscleGroup | undefined {
  return MUSCLES.find((m) => m.assetIds.includes(assetId))
}
