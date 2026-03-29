import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import { config as loadEnv } from 'dotenv'
import path from 'path'

// 加载 .env.local 环境变量（本地开发覆盖）
loadEnv({ path: path.resolve(__dirname, '..', '.env.local') })

export default defineConfig<'webpack5'>(async (merge) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'body-aware-diary',
    date: '2026-3-22',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
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
    compiler: 'webpack5',
    cache: { enable: false },
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    mini: {
      postcss: {
        pxtransform: { enable: true, config: {} },
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
        // Enable px→vw transform for H5: 28px @ designWidth=750 → 3.73vw → ~14px at 375px viewport
        // Uses vw to avoid dependency on html root font-size (rem approach requires initPxTransform)
        pxtransform: {
          enable: true,
          config: {
            platform: 'h5',
            designWidth: 750,
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
