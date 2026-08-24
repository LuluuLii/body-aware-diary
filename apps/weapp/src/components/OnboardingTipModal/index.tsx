// OnboardingTipModal · 通用 onboarding tip 模态
// 首次触达关键交互时展示，之后不再出现（seen 状态存客户端 storage）。
// tip 数据来自 @body-diary/content ONBOARDING_TIPS。

import { View, Text } from '@tarojs/components'
import type { OnboardingTip } from '@body-diary/content'
import './index.scss'

export interface OnboardingTipModalProps {
  tip: OnboardingTip
  /** 点任一按钮或点 backdrop 都触发 dismiss，mode 表示用户点了哪个按钮 */
  onDismiss: (mode: 'skip' | 'ok') => void
}

export function OnboardingTipModal({ tip, onDismiss }: OnboardingTipModalProps) {
  return (
    <View className='onboarding-modal'>
      <View className='onboarding-backdrop' onClick={() => onDismiss('skip')} />
      <View className='onboarding-card'>
        <Text className='onboarding-title'>{tip.title}</Text>
        <View className='onboarding-lines'>
          {tip.lines.map((line, i) => (
            <Text key={i} className='onboarding-line'>{line}</Text>
          ))}
        </View>
        <View className='onboarding-buttons'>
          {tip.buttons.map((b) => (
            <Text
              key={b.key}
              className={`onboarding-btn onboarding-btn-${b.key}`}
              onClick={() => onDismiss(b.key)}
            >
              {b.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  )
}
