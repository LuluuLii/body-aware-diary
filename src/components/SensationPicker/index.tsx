import { View, Text, Slider } from '@tarojs/components'
import { SENSATION_LABELS, SENSATION_COLORS, SensationType } from '@/types/body'
import './index.scss'

interface Props {
  sensation: SensationType
  intensity: number
  onSensationChange: (s: SensationType) => void
  onIntensityChange: (i: number) => void
}

const SENSATION_LIST = Object.values(SensationType)

export default function SensationPicker({ sensation, intensity, onSensationChange, onIntensityChange }: Props) {
  return (
    <View className='sensation-picker'>
      <Text className='sensation-picker__label'>感知类型</Text>
      <View className='sensation-picker__grid'>
        {SENSATION_LIST.map((s) => (
          <View
            key={s}
            className={`sensation-picker__item ${sensation === s ? 'sensation-picker__item--active' : ''}`}
            style={sensation === s ? { borderColor: SENSATION_COLORS[s], backgroundColor: SENSATION_COLORS[s] + '15' } : {}}
            onClick={() => onSensationChange(s)}
          >
            <View
              className='sensation-picker__dot'
              style={{ backgroundColor: SENSATION_COLORS[s] }}
            />
            <Text className={`sensation-picker__item-text ${sensation === s ? 'sensation-picker__item-text--active' : ''}`}>
              {SENSATION_LABELS[s]}
            </Text>
          </View>
        ))}
      </View>

      <Text className='sensation-picker__label'>强度: {intensity}/5</Text>
      <Slider
        min={1}
        max={5}
        step={1}
        value={intensity}
        activeColor={SENSATION_COLORS[sensation]}
        onChange={(e) => onIntensityChange(e.detail.value)}
        className='sensation-picker__slider'
      />
    </View>
  )
}
