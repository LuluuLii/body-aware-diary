import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import { config as loadEnv } from 'dotenv'
import path from 'path'

// 加载 .env.local 环境变量（本地开发覆盖）
loadEnv({ path: path.resolve(__dirname, '..', '.env.local') })

export default defineConfig<'webpack5'>(async (merge) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'body-aware-diary',
    date: '2026-3-22',
    // Handoff 在 390×844 手机壳里设计（iPhone 12 Pro），所以 designWidth = 390。
    // 我们写的 CSS px 值直接对应 handoff 上的像素，无需换算。
    designWidth: 390,
    deviceRatio: {
      390: 1,
      375: 375 / 390,
      750: 750 / 390,
      828: 828 / 390,
    },
    sourceRoot: 'src',
    outputRoot: `dist/${process.env.TARO_ENV}`,
    plugins: [],
    defineConstants: {
      'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
    },
    copy: { patterns: [], options: {} },
    framework: 'react',
    compiler: {
      type: 'webpack5',
      prebundle: { enable: false },
    },
    cache: { enable: false },
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    // Workspace packages 走标准 precompile 模式：`pnpm -r build` 后消费编译后的 dist/。
    // 避免 Taro 编译器折腾 packages/ 的 TS 源（Taro 4 的 include/exclude 对 pnpm
    // 符号链接不友好）。改动 packages 后 → `pnpm build:packages` → `pnpm dev:h5`。
    mini: {
      postcss: {
        // px → rpx transform. handoff 设计画布 390 宽, 我们在 SCSS 里直接写 handoff px 值.
        //
        // postcss-pxtransform (build-time) 的 deviceRatio 语义 ≠ Taro 顶层 deviceRatio (runtime):
        //   rpx_out = px_in × deviceRatio[designWidth]
        // 所以 designWidth=390 时, 要 750/390 ≈ 1.923, 才能让 14px → 27rpx
        // (在 iPhone 12 之类 375 宽的屏上视觉 ≈ 13.5px, 与 handoff 1:1).
        //
        // 顶层 config 里的 deviceRatio 是给 runtime API (Taro.pxTransform 之类) 用的,
        // 不是给 postcss 用的. 必须在这里独立声明.
        pxtransform: {
          enable: true,
          config: {
            platform: 'weapp',
            designWidth: 390,
            deviceRatio: {
              390: 750 / 390,
              375: 750 / 375,
              750: 1,
              828: 750 / 828,
            },
          },
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
      webpackChain(chain) {
        chain.resolve.extensions.prepend('.miniapp.ts').prepend('.miniapp.tsx')
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      postcss: {
        autoprefixer: { enable: true, config: {} },
        // px → vw transform. designWidth = 390 匹配 handoff 设计画布。
        // 例：一个 10px 值在 390 宽度里就是 10px，在 375 屏上会缩到 ~9.6px（1:1 视觉比例）。
        pxtransform: {
          enable: true,
          config: {
            platform: 'h5',
            designWidth: 390,
            targetUnit: 'vw',
          },
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
  }
  return merge({}, baseConfig)
})
