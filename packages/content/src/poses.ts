// Pose seed data. v1 covers 10 poses across all 7 families.
// Future: grow to 60 in the post-Sprint-0 content sprint (AI + 人工挑选).
//
// `sketchKind` maps to @body-diary/assets `PoseKind` — currently only 4 sketches
// exist (fold/warrior/bridge/seated), so multiple poses share sketches. When
// production illustration is done, each pose gets a dedicated sketch id.

import type { PoseFamily } from './families'

/** Which pose sketch to render (from @body-diary/assets). Kept in sync with PoseKind. */
export type PoseSketchKind = 'fold' | 'warrior' | 'bridge' | 'seated'

/**
 * Pose 归属的品类。跟 @body-diary/core 的 ActivityType 保持同步（不 import 避免循环依赖）。
 * 记录页选品类后，pose picker 用 activityType 过滤只显示该品类下的动作。
 */
export type PoseActivityType =
  | 'yoga_mat'
  | 'ballet'
  | 'swimming'
  | 'strength'
  | 'running'
  | 'cycling'
  | 'hiking'
  | 'rehabilitation'
  | 'other'

export interface Pose {
  id: string
  /** 归属品类 — 用于记录页 pose picker 按品类过滤 */
  activityType: PoseActivityType
  nameZh: string
  nameEn: string
  /** 梵文名（瑜伽用）或原文名（芭蕾法语原文），跨品类通用字段 */
  nameSanskrit: string
  family: PoseFamily
  sketchKind: PoseSketchKind
  /** Muscle group ids from ./muscles — main activation targets */
  mainMuscleIds: readonly string[]
  /** 发力感线索: 2-3 sentences of felt-sense cueing */
  activationCue: string
  /** 常见代偿点 */
  compensation: string
  /** 常见感受词 — surfaced as chips on pose detail */
  sensationWords: readonly string[]
  /**
   * 肌肉激活数据是否为占位。芭蕾等新品类先用直觉估算占位，
   * 后续要请专业老师校准（对应 memory: ai_intervention_ideas 里的"用户+AI共建"设想）。
   */
  muscleDataPreliminary?: boolean
}

export const POSES: readonly Pose[] = [
  {
    id: 'p_bridge',
    nameZh: '桥式',
    nameEn: 'Bridge Pose',
    nameSanskrit: 'Setu Bandhasana',
    activityType: 'yoga_mat',
    family: '后弯',
    sketchKind: 'bridge',
    mainMuscleIds: ['glute', 'ham', 'erector'],
    activationCue: '脚跟压实地面，先卷尾骨再一节一节抬起。臀主动夹，别让腰塌下去。',
    compensation: '下背部代偿；用腰去发力而不是臀。膝盖太开或太合。',
    sensationWords: ['臀有感', '腰放松', '通透'],
  },
  {
    id: 'p_warrior2',
    nameZh: '战士二式',
    nameEn: 'Warrior II',
    nameSanskrit: 'Virabhadrasana II',
    activityType: 'yoga_mat',
    family: '平衡',
    sketchKind: 'warrior',
    mainMuscleIds: ['quad', 'glute', 'delt_front', 'obl'],
    activationCue: '前腿膝盖对齐脚踝，后腿脚外侧压地。前后手臂延展向两端，胸腔打开。',
    compensation: '前膝内扣或超过脚尖；肩耸起；后腿松塌。',
    sensationWords: ['大腿有力', '肩紧', '稳'],
  },
  {
    id: 'p_pigeon',
    nameZh: '鸽子式',
    nameEn: 'Pigeon Pose',
    nameSanskrit: 'Eka Pada Rajakapotasana',
    activityType: 'yoga_mat',
    family: '扭转',
    sketchKind: 'seated',
    mainMuscleIds: ['glute', 'glute_med', 'hip', 'pec'],
    activationCue: '前腿髋部沉向地面，后腿脚背压实。骨盆保持中正，别向前腿倾斜。',
    compensation: '骨盆向前倾；后腿髋没沉下去；前腿膝盖受挤压。',
    sensationWords: ['臀外侧被拉开', '髋前侧涨', '深'],
  },
  {
    id: 'p_bound_angle',
    nameZh: '束角式',
    nameEn: 'Bound Angle Pose',
    nameSanskrit: 'Baddha Konasana',
    activityType: 'yoga_mat',
    family: '前屈',
    sketchKind: 'seated',
    mainMuscleIds: ['hip', 'adductor'],
    activationCue: '坐骨压地，脊柱延展向上。膝盖朝地面沉，不用手按压。',
    compensation: '弓背前趴；坐骨没坐实；肩膀耸起。',
    sensationWords: ['内侧腿被拉开', '髋沉下去', '骨盆稳'],
  },
  {
    id: 'p_lizard',
    nameZh: '蜥蜴式',
    nameEn: 'Lizard Pose',
    nameSanskrit: 'Utthan Pristhasana',
    activityType: 'yoga_mat',
    family: '前屈',
    sketchKind: 'seated',
    mainMuscleIds: ['hip', 'adductor', 'quad'],
    activationCue: '前脚外侧踩实，后腿脚背绷直向后延展。骨盆下沉但不撇。',
    compensation: '后腿松塌；前膝内扣；肩耸起。',
    sensationWords: ['髋前侧深', '大腿内侧凉', '拉开'],
  },
  {
    id: 'p_twist_lunge',
    nameZh: '低弓步扭转',
    nameEn: 'Twisted Low Lunge',
    nameSanskrit: 'Parivrtta Anjaneyasana',
    activityType: 'yoga_mat',
    family: '扭转',
    sketchKind: 'warrior',
    mainMuscleIds: ['obl', 'erector', 'hip'],
    activationCue: '骨盆先中正，从胸椎往上开始旋转，肩打开。呼气时旋转更深。',
    compensation: '用腰去转（腰椎受压）；骨盆随之扭；后腿松。',
    sensationWords: ['侧腰扭开', '核心稳', '深呼吸'],
  },
  {
    id: 'p_triangle',
    nameZh: '三角式',
    nameEn: 'Triangle Pose',
    nameSanskrit: 'Trikonasana',
    activityType: 'yoga_mat',
    family: '侧弯',
    sketchKind: 'warrior',
    mainMuscleIds: ['adductor', 'obl', 'delt_front', 'ham'],
    activationCue: '双腿伸直，前脚外侧压地。躯干延展向侧方而不是折向下，胸腔转向上。',
    compensation: '弯曲下腰；胸腔塌下去；后腿松。',
    sensationWords: ['侧腰拉开', '腿后紧', '延展'],
  },
  {
    id: 'p_downdog',
    nameZh: '下犬式',
    nameEn: 'Downward-Facing Dog',
    nameSanskrit: 'Adho Mukha Svanasana',
    activityType: 'yoga_mat',
    family: '倒立',
    sketchKind: 'fold',
    mainMuscleIds: ['ham', 'calf', 'lat', 'delt_front'],
    activationCue: '想象坐骨往天花板顶，脊柱被拉长。重量从手腕匀到整个手掌，指根压实。',
    compensation: '腘绳肌紧的人容易弓背、耸肩；下背代偿发力。膝盖可以微弯，先把背拉直。',
    sensationWords: ['大腿后侧被拉开', '肩紧', '通透'],
  },
  {
    id: 'p_mountain',
    nameZh: '山式',
    nameEn: 'Mountain Pose',
    nameSanskrit: 'Tadasana',
    activityType: 'yoga_mat',
    family: '中正',
    sketchKind: 'warrior',
    mainMuscleIds: ['quad', 'glute', 'erector'],
    activationCue: '双脚平行分开与髋同宽。四个脚角均匀压地，膝盖微软，尾骨微收。头顶向上延展。',
    compensation: '锁死膝盖；骨盆前倾；肩耸起。',
    sensationWords: ['扎根', '稳', '中正'],
  },
  {
    id: 'p_tree',
    nameZh: '树式',
    nameEn: 'Tree Pose',
    nameSanskrit: 'Vrksasana',
    activityType: 'yoga_mat',
    family: '平衡',
    sketchKind: 'warrior',
    mainMuscleIds: ['quad', 'glute', 'hip', 'obl'],
    activationCue: '支撑腿压地扎根，脚趾放松。抬起的膝盖朝外打开，脚放在小腿或大腿内侧（避免膝盖关节）。',
    compensation: '支撑腿膝盖锁死；骨盆歪；抬腿的脚放在膝盖上。',
    sensationWords: ['扎根', '髋开', '稳'],
  },

  // ─── 芭蕾 · 脚位（Vaganova 体系五位）──────────────────────
  // 肌肉数据为占位（muscleDataPreliminary: true），后续请老师校准
  {
    id: 'b_pos_1',
    nameZh: '一位',
    nameEn: 'First Position',
    nameSanskrit: 'Première Position',
    activityType: 'ballet',
    family: '脚位',
    sketchKind: 'warrior',
    mainMuscleIds: ['glute_med', 'hip', 'quad', 'calf'],
    activationCue: '双脚脚跟并拢，脚尖向两侧完全外开（理想 180°）。外开来自髋而非膝，站直感受身体中轴。',
    compensation: '硬掰脚尖导致膝盖内旋；重心偏前脚掌；膝盖锁死。',
    sensationWords: ['髋外旋', '内侧腿收紧', '扎根'],
    muscleDataPreliminary: true,
  },
  {
    id: 'b_pos_2',
    nameZh: '二位',
    nameEn: 'Second Position',
    nameSanskrit: 'Deuxième Position',
    activityType: 'ballet',
    family: '脚位',
    sketchKind: 'warrior',
    mainMuscleIds: ['glute_med', 'hip', 'quad', 'adductor', 'calf'],
    activationCue: '一位基础上双脚横向分开约一脚长，保持完全外开。重量均匀分给两脚，尾骨向下沉。',
    compensation: '两脚外开不对称；一侧塌陷；骨盆前倾。',
    sensationWords: ['稳', '髋展开', '大腿内侧'],
    muscleDataPreliminary: true,
  },
  {
    id: 'b_pos_3',
    nameZh: '三位',
    nameEn: 'Third Position',
    nameSanskrit: 'Troisième Position',
    activityType: 'ballet',
    family: '脚位',
    sketchKind: 'warrior',
    mainMuscleIds: ['glute_med', 'hip', 'quad', 'adductor'],
    activationCue: '一只脚跟贴在另一脚足弓中央，两脚都保持外开。三位是四位五位的过渡准备。',
    compensation: '前脚脚跟没贴到足弓；重心偏后。',
    sensationWords: ['髋收紧', '两腿并'],
    muscleDataPreliminary: true,
  },
  {
    id: 'b_pos_4',
    nameZh: '四位',
    nameEn: 'Fourth Position',
    nameSanskrit: 'Quatrième Position',
    activityType: 'ballet',
    family: '脚位',
    sketchKind: 'warrior',
    mainMuscleIds: ['glute_med', 'hip', 'quad', 'glute', 'adductor'],
    activationCue: '一脚在前一脚在后，前后交叉平行外开。两脚间距约一脚长，重量均匀。',
    compensation: '骨盆随前脚扭；后腿膝盖弯；重心塌向前脚。',
    sensationWords: ['前后拉开', '髋稳', '中段收'],
    muscleDataPreliminary: true,
  },
  {
    id: 'b_pos_5',
    nameZh: '五位',
    nameEn: 'Fifth Position',
    nameSanskrit: 'Cinquième Position',
    activityType: 'ballet',
    family: '脚位',
    sketchKind: 'warrior',
    mainMuscleIds: ['glute_med', 'hip', 'quad', 'adductor', 'calf'],
    activationCue: '前脚脚跟贴到后脚脚尖，完全交叉。是最难维持外开的脚位，两大腿主动内夹。',
    compensation: '两脚没完全贴；髋外旋不足导致膝盖打架；重心偏前。',
    sensationWords: ['髋外旋极限', '大腿收', '紧凑'],
    muscleDataPreliminary: true,
  },

  // ─── 芭蕾 · 手位（Vaganova 五个基础 bras）─────────────────
  {
    id: 'b_bras_bas',
    nameZh: '预备位',
    nameEn: 'Preparatory Position',
    nameSanskrit: 'Bras Bas',
    activityType: 'ballet',
    family: '手位',
    sketchKind: 'warrior',
    mainMuscleIds: ['delt_front', 'delt_mid', 'pec', 'lat'],
    activationCue: '双臂在腹前弯成柔和椭圆，肘微屈朝外，指尖不触碰。肩下沉远离耳朵。',
    compensation: '肩耸起；肘塌下去；手掌僵直翻转。',
    sensationWords: ['肩下沉', '胸打开'],
    muscleDataPreliminary: true,
  },
  {
    id: 'b_bras_1',
    nameZh: '一位手',
    nameEn: 'First Position Arms',
    nameSanskrit: 'Première',
    activityType: 'ballet',
    family: '手位',
    sketchKind: 'warrior',
    mainMuscleIds: ['delt_front', 'pec', 'biceps'],
    activationCue: '双臂从预备位抬到胸前，弯成完整圆形，指尖相对不触碰。眼视双手之间。',
    compensation: '手位太高压到下巴；手位太低塌胸；肘尖朝下。',
    sensationWords: ['环抱', '肩打开'],
    muscleDataPreliminary: true,
  },
  {
    id: 'b_bras_2',
    nameZh: '二位手',
    nameEn: 'Second Position Arms',
    nameSanskrit: 'Deuxième',
    activityType: 'ballet',
    family: '手位',
    sketchKind: 'warrior',
    mainMuscleIds: ['delt_mid', 'delt_rear', 'trap', 'lat'],
    activationCue: '双臂向两侧打开略低于肩，肘保持柔和弧度朝下，掌心朝前下方。',
    compensation: '手位过高耸肩；肘尖朝上塌陷；手腕僵。',
    sensationWords: ['肩胛下沉', '胸开', '延展'],
    muscleDataPreliminary: true,
  },
  {
    id: 'b_bras_3',
    nameZh: '三位手',
    nameEn: 'Third Position Arms',
    nameSanskrit: 'Troisième',
    activityType: 'ballet',
    family: '手位',
    sketchKind: 'warrior',
    mainMuscleIds: ['delt_front', 'delt_mid', 'trap', 'obl'],
    activationCue: '一臂在二位（旁开），一臂在五位（上举）。头随上举手略偏。',
    compensation: '两臂高度失衡；躯干代偿倾斜。',
    sensationWords: ['不对称', '侧腰长'],
    muscleDataPreliminary: true,
  },
  {
    id: 'b_bras_5',
    nameZh: '五位手',
    nameEn: 'Fifth Position Arms',
    nameSanskrit: 'Cinquième',
    activityType: 'ballet',
    family: '手位',
    sketchKind: 'warrior',
    mainMuscleIds: ['delt_front', 'delt_mid', 'trap', 'lat', 'erector'],
    activationCue: '双臂高举过头，仍保持柔和弧度，指尖略相对。肩胛下沉，脊柱延展向上。',
    compensation: '肩耸起夹脖子；下背反弓；手臂僵直。',
    sensationWords: ['向上延展', '肩胛下沉'],
    muscleDataPreliminary: true,
  },

  // ─── 芭蕾 · 基础动作 ───────────────────────────────────
  {
    id: 'b_plie',
    nameZh: '下蹲',
    nameEn: 'Plié',
    nameSanskrit: 'Plié',
    activityType: 'ballet',
    family: '动作',
    sketchKind: 'warrior',
    mainMuscleIds: ['quad', 'glute', 'glute_med', 'calf', 'adductor'],
    activationCue: '保持外开脚位，双膝顺脚尖方向弯曲（demi 半蹲/grand 深蹲）。脚跟压地，脊柱延展。',
    compensation: '膝盖内扣不对齐脚尖；骨盆前倾撅屁股；上身塌。',
    sensationWords: ['大腿有力', '髋沉', '扎根'],
    muscleDataPreliminary: true,
  },
  {
    id: 'b_releve',
    nameZh: '提踵',
    nameEn: 'Relevé',
    nameSanskrit: 'Relevé',
    activityType: 'ballet',
    family: '动作',
    sketchKind: 'warrior',
    mainMuscleIds: ['calf', 'tibialis', 'quad', 'obl'],
    activationCue: '双脚脚跟同时抬起立到半脚尖（demi-pointe），重心正对脚掌前部。核心收，头顶向上。',
    compensation: '脚踝外翻；重心偏前扑倒；耸肩找平衡。',
    sensationWords: ['小腿紧', '足弓提', '稳'],
    muscleDataPreliminary: true,
  },
  {
    id: 'b_tendu',
    nameZh: '伸展',
    nameEn: 'Tendu',
    nameSanskrit: 'Battement Tendu',
    activityType: 'ballet',
    family: '动作',
    sketchKind: 'warrior',
    mainMuscleIds: ['quad', 'hip', 'tibialis', 'glute_med'],
    activationCue: '一脚沿地面向前/侧/后延展出去，脚尖始终外开，脚掌到脚尖依次离地。收回时反向。',
    compensation: '延展腿膝盖弯；支撑腿倒；髋随脚扭。',
    sensationWords: ['脚背绷', '腿长', '髋稳'],
    muscleDataPreliminary: true,
  },
  {
    id: 'b_arabesque',
    nameZh: '迎风展翅',
    nameEn: 'Arabesque',
    nameSanskrit: 'Arabesque',
    activityType: 'ballet',
    family: '动作',
    sketchKind: 'warrior',
    mainMuscleIds: ['erector', 'glute', 'ham', 'delt_front', 'obl'],
    activationCue: '单腿支撑，另一腿向后抬起并伸直，同侧手臂前伸对侧手臂旁开。脊柱延长，胸开。',
    compensation: '骨盆向支撑腿一侧倾；后腿膝弯；肩耸；下背塌。',
    sensationWords: ['后侧链发力', '延展', '平衡'],
    muscleDataPreliminary: true,
  },
] as const

// ─── Lookup helpers ────────────────────────────────────

export function getPoseById(id: string): Pose | undefined {
  return POSES.find((p) => p.id === id)
}

export function getPosesByFamily(family: PoseFamily): readonly Pose[] {
  return POSES.filter((p) => p.family === family)
}

/** For reverse lookup: "I trained X muscle → which poses target it?" */
export function getPosesByMuscleId(muscleGroupId: string): readonly Pose[] {
  return POSES.filter((p) => p.mainMuscleIds.includes(muscleGroupId))
}

/** 记录页 pose picker: 按品类过滤（芭蕾只显示脚位/手位/动作，垫上只显示瑜伽体式）。 */
export function getPosesByActivityType(activityType: PoseActivityType): readonly Pose[] {
  return POSES.filter((p) => p.activityType === activityType)
}
