// AutoTextarea · 跨平台 textarea 包装
//
// H5 用原生 <textarea>（避 Taro Textarea 初始 value \n 被吞的 bug，见 memory）
// Weapp 用 Taro <Textarea>（原生 <textarea> 不能编译到 WXML）
//
// 通过 process.env.TARO_ENV 分支 + React.createElement 避开 JSX 编译。
// weapp build 里 h5 分支是死代码被 Terser 剥掉，不会真的调 createElement('textarea')。

import { createElement, type CSSProperties } from 'react'
import { Textarea } from '@tarojs/components'

export interface AutoTextareaProps {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
  /** placeholder 的类名（仅 Taro Textarea 生效） */
  placeholderClass?: string
  maxLength?: number
  /** 初始/最少行数（H5 走 rows；weapp 靠 autoHeight）*/
  rows?: number
  style?: CSSProperties
  /** weapp 端自适应高度（H5 用 rows 控制） */
  autoHeight?: boolean
}

export function AutoTextarea({
  value,
  onChange,
  placeholder,
  className,
  placeholderClass,
  maxLength,
  rows,
  style,
  autoHeight = true,
}: AutoTextareaProps) {
  if (process.env.TARO_ENV === 'h5') {
    // Native textarea · React DOM 语义，value 里的 \n 就是换行
    return createElement('textarea', {
      value,
      className,
      placeholder,
      onChange: (e: any) => onChange(e.target.value ?? ''),
      maxLength,
      rows,
      style,
    })
  }
  // Weapp / 其他小程序端
  return (
    <Textarea
      value={value}
      className={className}
      placeholder={placeholder}
      placeholderClass={placeholderClass}
      onInput={(e: any) => onChange(e?.detail?.value ?? '')}
      maxlength={maxLength}
      autoHeight={autoHeight}
      style={style}
    />
  )
}
