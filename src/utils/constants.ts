import type { ActivityType } from '@/types/diary'
import { BodyPart } from '@/types/body'

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

// 运动类型 → 可能锻炼到的身体部位（本地规则映射表）
// 每个部位附带"如何感受到它"的提示
export interface RecommendedBodyPart {
  part: BodyPart
  hint: string  // 引导用户感受该部位的提示
}

export const ACTIVITY_BODY_MAP: Record<ActivityType, RecommendedBodyPart[]> = {
  strength: [
    { part: BodyPart.LeftChest, hint: '胸部发力时，试着感受左胸的收缩与撑起' },
    { part: BodyPart.RightChest, hint: '胸部发力时，试着感受右胸的收缩与撑起' },
    { part: BodyPart.UpperBack, hint: '划船/高位下拉时，背部有无向中间夹紧的感觉？' },
    { part: BodyPart.LeftShoulder, hint: '肩推时左肩有无酸胀或温热感？' },
    { part: BodyPart.RightShoulder, hint: '肩推时右肩有无酸胀或温热感？' },
    { part: BodyPart.LeftUpperArm, hint: '弯举时左上臂有无泵感或灼烧感？' },
    { part: BodyPart.RightUpperArm, hint: '弯举时右上臂有无泵感或灼烧感？' },
    { part: BodyPart.AbdomenUpper, hint: '核心收紧时，上腹有无被激活的感觉？' },
    { part: BodyPart.LowerBack, hint: '硬拉或深蹲后腰部有无酸胀？' },
  ],
  cardio: [
    { part: BodyPart.LeftQuadricep, hint: '持续跑跳时，大腿前侧是否感到灼热或沉重？' },
    { part: BodyPart.RightQuadricep, hint: '持续跑跳时，大腿前侧是否感到灼热或沉重？' },
    { part: BodyPart.LeftCalf, hint: '长时间有氧后，小腿是否有紧绷或酸痛感？' },
    { part: BodyPart.RightCalf, hint: '长时间有氧后，小腿是否有紧绷或酸痛感？' },
    { part: BodyPart.LeftHamstring, hint: '冲刺或上坡时，大腿后侧有无拉伸感？' },
    { part: BodyPart.RightHamstring, hint: '冲刺或上坡时，大腿后侧有无拉伸感？' },
    { part: BodyPart.AbdomenUpper, hint: '持续呼吸时，腹部核心是否持续在配合？' },
  ],
  flexibility: [
    { part: BodyPart.LeftHamstring, hint: '前屈时大腿后侧有无明显拉伸感？' },
    { part: BodyPart.RightHamstring, hint: '前屈时大腿后侧有无明显拉伸感？' },
    { part: BodyPart.LowerBack, hint: '腰部后弯或侧弯时，下背有无牵拉感？' },
    { part: BodyPart.LeftShoulder, hint: '手臂后绕时，肩关节有无拉伸感或摩擦感？' },
    { part: BodyPart.RightShoulder, hint: '手臂后绕时，肩关节有无拉伸感或摩擦感？' },
    { part: BodyPart.Neck, hint: '颈部侧伸时，是否感到颈侧肌肉轻微拉伸？' },
    { part: BodyPart.LeftHip, hint: '鸽式或蝴蝶式时，左髋深处有无明显释放感？' },
    { part: BodyPart.RightHip, hint: '鸽式或蝴蝶式时，右髋深处有无明显释放感？' },
  ],
  yoga: [
    { part: BodyPart.LeftHip, hint: '战士式时，左髋前侧有无延伸感？' },
    { part: BodyPart.RightHip, hint: '战士式时，右髋前侧有无延伸感？' },
    { part: BodyPart.LowerBack, hint: '下犬式或猫牛式时，腰部有无被打开的感觉？' },
    { part: BodyPart.UpperBack, hint: '猫式或扭转时，上背是否感到延展？' },
    { part: BodyPart.AbdomenUpper, hint: '船式时，腹部有无在持续收紧？' },
    { part: BodyPart.LeftShoulder, hint: '下犬式时，左肩有无向后延伸的感觉？' },
    { part: BodyPart.RightShoulder, hint: '下犬式时，右肩有无向后延伸的感觉？' },
  ],
  pilates: [
    { part: BodyPart.AbdomenUpper, hint: 'Pilates 全程要求核心激活，上腹有无持续收缩感？' },
    { part: BodyPart.AbdomenLower, hint: '骨盆稳定练习时，下腹有无发力感？' },
    { part: BodyPart.LeftGlute, hint: '臀桥时左臀有无明显挤压感？' },
    { part: BodyPart.RightGlute, hint: '臀桥时右臀有无明显挤压感？' },
    { part: BodyPart.LowerBack, hint: '脊柱伸展练习时，下背有无被支撑的感觉？' },
    { part: BodyPart.LeftInnerThigh, hint: '侧卧练习时，内收肌有无用力感？' },
    { part: BodyPart.RightInnerThigh, hint: '侧卧练习时，内收肌有无用力感？' },
  ],
  dance: [
    { part: BodyPart.LeftCalf, hint: '踮脚或快速步伐时，小腿是否紧绷？' },
    { part: BodyPart.RightCalf, hint: '踮脚或快速步伐时，小腿是否紧绷？' },
    { part: BodyPart.LeftHip, hint: '髋部摆动时，左髋是否感受到控制感？' },
    { part: BodyPart.RightHip, hint: '髋部摆动时，右髋是否感受到控制感？' },
    { part: BodyPart.AbdomenUpper, hint: '保持姿态时，核心是否持续参与？' },
    { part: BodyPart.Neck, hint: '头部移动时，颈部是否有紧张或疲劳感？' },
  ],
  martial_arts: [
    { part: BodyPart.LeftShoulder, hint: '出拳时，左肩关节是否有受力感？' },
    { part: BodyPart.RightShoulder, hint: '出拳时，右肩关节是否有受力感？' },
    { part: BodyPart.LeftQuadricep, hint: '踢腿时大腿前侧是否有控制感或疲劳感？' },
    { part: BodyPart.RightQuadricep, hint: '踢腿时大腿前侧是否有控制感或疲劳感？' },
    { part: BodyPart.AbdomenUpper, hint: '格挡或发力时，核心是否在稳定身体？' },
    { part: BodyPart.LowerBack, hint: '旋转出力时，腰部是否感到参与？' },
  ],
  swimming: [
    { part: BodyPart.UpperBack, hint: '划水时，背部是否感受到两侧肌肉收缩？' },
    { part: BodyPart.LeftShoulder, hint: '入水臂展时，左肩是否感受到延伸或疲劳？' },
    { part: BodyPart.RightShoulder, hint: '入水臂展时，右肩是否感受到延伸或疲劳？' },
    { part: BodyPart.LeftCalf, hint: '打水时，小腿是否持续发力？' },
    { part: BodyPart.RightCalf, hint: '打水时，小腿是否持续发力？' },
    { part: BodyPart.AbdomenUpper, hint: '维持身体水平时，腹部核心是否在工作？' },
  ],
  running: [
    { part: BodyPart.LeftQuadricep, hint: '上坡或加速时，大腿前侧是否有灼烧感？' },
    { part: BodyPart.RightQuadricep, hint: '上坡或加速时，大腿前侧是否有灼烧感？' },
    { part: BodyPart.LeftHamstring, hint: '后蹬时，大腿后侧是否参与发力？' },
    { part: BodyPart.RightHamstring, hint: '后蹬时，大腿后侧是否参与发力？' },
    { part: BodyPart.LeftCalf, hint: '落地缓冲时，小腿是否有冲击感？' },
    { part: BodyPart.RightCalf, hint: '落地缓冲时，小腿是否有冲击感？' },
    { part: BodyPart.LeftGlute, hint: '大步伐时，臀部是否有推进发力感？' },
    { part: BodyPart.RightGlute, hint: '大步伐时，臀部是否有推进发力感？' },
  ],
  cycling: [
    { part: BodyPart.LeftQuadricep, hint: '踩踏时大腿前侧是否有酸胀或泵感？' },
    { part: BodyPart.RightQuadricep, hint: '踩踏时大腿前侧是否有酸胀或泵感？' },
    { part: BodyPart.LeftGlute, hint: '坐骑时臀部是否有压迫或发力感？' },
    { part: BodyPart.RightGlute, hint: '坐骑时臀部是否有压迫或发力感？' },
    { part: BodyPart.LowerBack, hint: '长途骑行后，腰部是否有紧绷或酸痛感？' },
    { part: BodyPart.Neck, hint: '低头骑行时，颈部是否感到疲劳？' },
  ],
  hiking: [
    { part: BodyPart.LeftQuadricep, hint: '上坡时，大腿前侧是否在主导发力？' },
    { part: BodyPart.RightQuadricep, hint: '上坡时，大腿前侧是否在主导发力？' },
    { part: BodyPart.LeftKnee, hint: '下坡时，膝关节是否感受到压迫？' },
    { part: BodyPart.RightKnee, hint: '下坡时，膝关节是否感受到压迫？' },
    { part: BodyPart.LeftCalf, hint: '长距离行走后，小腿是否有紧绷感？' },
    { part: BodyPart.RightCalf, hint: '长距离行走后，小腿是否有紧绷感？' },
    { part: BodyPart.LeftGlute, hint: '爬坡时，臀部是否参与了推进？' },
    { part: BodyPart.RightGlute, hint: '爬坡时，臀部是否参与了推进？' },
  ],
  rehabilitation: [
    { part: BodyPart.LowerBack, hint: '康复练习时，目标部位是否感受到稳定感而非痛感？' },
    { part: BodyPart.LeftKnee, hint: '膝部康复时，是否感到稳定性改善？' },
    { part: BodyPart.RightKnee, hint: '膝部康复时，是否感到稳定性改善？' },
    { part: BodyPart.LeftShoulder, hint: '肩部康复时，活动度是否有所提升？' },
    { part: BodyPart.RightShoulder, hint: '肩部康复时，活动度是否有所提升？' },
  ],
  meditation: [
    { part: BodyPart.Neck, hint: '静坐时，颈部是否保持放松状态？' },
    { part: BodyPart.LowerBack, hint: '长时间端坐后，腰部是否有轻微酸感？' },
    { part: BodyPart.AbdomenUpper, hint: '腹式呼吸时，腹部的起伏是否均匀？' },
  ],
  other: [
    { part: BodyPart.AbdomenUpper, hint: '全身运动时，核心是否参与其中？' },
    { part: BodyPart.LowerBack, hint: '运动后腰部有无不适或疲劳感？' },
  ],
}

// 感受提示词（帮助用户快速描述感受）
export const SENSATION_HINTS: Record<string, string[]> = {
  positive: ['感受到发力', '有明显泵感', '肌肉在工作', '有拉伸感', '感到温热', '找到了发力点'],
  negative: ['有些酸痛', '感觉紧绷', '有点疲惫', '轻微不适', '灼热感'],
  neutral: ['还好', '没什么感觉', '有点麻木', '不确定'],
}

// TODO: Apple Health / 健康平台卡路里导入
// - 微信小程序端：暂不支持直接读取 Apple Health 数据
//   Apple Health 不开放对第三方小程序的直接访问接口
// - H5 端：可通过 Web Bluetooth / HealthKit JS Bridge 读取，但需要 Safari + 用户授权
//   计划：在 profile 页面添加"健康平台连接"入口，支持手动同步或文件导入
// - 备选：支持用户手动输入卡路里（当前实现）

