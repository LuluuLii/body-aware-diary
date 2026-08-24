#!/usr/bin/env node
/**
 * WeChat DevTools automation bridge — screenshot / navigate / eval.
 *
 * 前置条件 (一次性, 用户手动做):
 *   1. 打开 WeChat DevTools → 设置 → 安全设置 → "服务端口" 打开
 *   2. 项目至少手动导入过一次 (AppID + 项目路径), 让 DevTools 认识 project
 *   3. 运行本脚本前 **关闭** DevTools (automator.launch 会自己冷启一个)
 *
 * 用法:
 *   pnpm wx:shot                                # 截当前页
 *   pnpm wx:shot --page pages/review/index      # 导航到指定页再截
 *   node scripts/wx-inspect.mjs navigate pages/diary/index
 *   node scripts/wx-inspect.mjs eval "wx.getSystemInfoSync().screenWidth"
 *
 * 每次都会 launch 一个新 DevTools 实例; 结束后 close 之.
 * 如需常驻 (加速), 加 --keep-open.
 */

import automator from 'miniprogram-automator'
import MiniProgramModule from 'miniprogram-automator/out/MiniProgram.js'
import { execSync } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// WeChat DevTools 2.01.2510290 的 Tool.getInfo 响应里没有 SDKVersion 字段,
// automator 0.12.1 的 checkVersion 会对 undefined 调 split(), 直接崩.
// 我们跳过这一层校验 (它只是 guard SDK < 2.7.3).
const MiniProgram = MiniProgramModule.default ?? MiniProgramModule
if (MiniProgram?.prototype?.checkVersion) {
  MiniProgram.prototype.checkVersion = async function () {}
}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WEAPP_PROJECT = resolve(REPO_ROOT, 'apps/weapp/dist/weapp')
const CLI_PATH = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
const SHOT_DIR = resolve(REPO_ROOT, 'tmp/wx-shots')

function log(msg) {
  process.stderr.write(`[wx-inspect] ${msg}\n`)
}

function takeFlag(argv, flag) {
  const idx = argv.indexOf(flag)
  if (idx === -1) return undefined
  const val = argv[idx + 1]
  argv.splice(idx, 2)
  return val
}

function takeBoolFlag(argv, flag) {
  const idx = argv.indexOf(flag)
  if (idx === -1) return false
  argv.splice(idx, 1)
  return true
}

function killLingeringDevTools() {
  try {
    const pids = execSync(
      `ps aux | grep -i wechatwebdevtools | grep -v grep | awk '{print $2}'`,
      { encoding: 'utf8' },
    )
      .split('\n')
      .filter(Boolean)
    if (pids.length === 0) return
    log(`Killing lingering DevTools processes: ${pids.join(', ')}`)
    execSync(`kill -9 ${pids.join(' ')} 2>/dev/null || true`)
  } catch {
    /* noop */
  }
}

async function launch() {
  if (!existsSync(CLI_PATH)) {
    throw new Error(`WeChat DevTools CLI not found: ${CLI_PATH}`)
  }
  if (!existsSync(WEAPP_PROJECT)) {
    throw new Error(
      `Weapp dist not found: ${WEAPP_PROJECT}\n  → run: pnpm -F @body-diary/weapp build:weapp`,
    )
  }
  killLingeringDevTools()
  // 给 macOS 一秒钟让端口和文件锁真正释放
  await new Promise((r) => setTimeout(r, 1000))
  log(`Launching DevTools + connecting automator (project: apps/weapp/dist/weapp)`)
  log(`如果卡住 30s+, 检查: 设置 → 安全设置 → 服务端口 是否 ON`)
  return automator.launch({
    cliPath: CLI_PATH,
    projectPath: WEAPP_PROJECT,
    // 关键: 免掉 "信任项目" 弹窗, 不然 DevTools 起来但项目不加载,
    // Tool.getInfo 无 SDKVersion, cmpVersion 里 split undefined 崩.
    trustProject: true,
    timeout: 60_000,
  })
}

async function cmdScreenshot(argv) {
  const pageArg = takeFlag(argv, '--page')
  const outArg = takeFlag(argv, '--out') ?? `shot-${Date.now()}.png`
  const keepOpen = takeBoolFlag(argv, '--keep-open')
  mkdirSync(SHOT_DIR, { recursive: true })
  const outPath = outArg.startsWith('/') ? outArg : resolve(SHOT_DIR, outArg)

  const mp = await launch()
  try {
    if (pageArg) {
      log(`Navigating to /${pageArg}`)
      await mp.reLaunch('/' + pageArg.replace(/^\//, ''))
      await new Promise((r) => setTimeout(r, 1500))
    }
    // screenshot 挂在 MiniProgram 上, 不是 Page
    await mp.screenshot({ path: outPath, fullPage: true })
    log(`Screenshot saved: ${outPath}`)
    process.stdout.write(outPath + '\n')
  } finally {
    if (!keepOpen) await mp.close()
  }
}

async function cmdBatch(argv) {
  // 用法: wx-inspect batch <prefix> page1 page2 ...
  // 输出: SHOT_DIR/<prefix>-<pageName>.png (pageName = 最后一段路径)
  const prefix = argv.shift()
  if (!prefix || argv.length === 0) {
    throw new Error('Usage: wx-inspect batch <prefix> <page1> <page2> ...')
  }
  mkdirSync(SHOT_DIR, { recursive: true })
  const mp = await launch()
  const results = []
  try {
    // launch 后模拟器已经在首页, 等 App 完成 mount + 数据初始化
    await new Promise((r) => setTimeout(r, 2000))
    for (const page of argv) {
      const name = page.split('/').filter(Boolean).slice(-2, -1)[0] || 'unknown'
      const outPath = resolve(SHOT_DIR, `${prefix}-${name}.png`)
      log(`[${name}] navigate → /${page.replace(/^\//, '')}`)
      try {
        await mp.reLaunch('/' + page.replace(/^\//, ''))
        // 给 useEffect/数据加载留时间, 页面复杂点的多等
        await new Promise((r) => setTimeout(r, 2200))
        await mp.screenshot({ path: outPath, fullPage: true })
        log(`[${name}] saved → ${outPath}`)
        results.push({ page, name, path: outPath, ok: true })
      } catch (err) {
        log(`[${name}] FAILED: ${err.message}`)
        results.push({ page, name, ok: false, error: err.message })
      }
    }
  } finally {
    await mp.close()
  }
  process.stdout.write(JSON.stringify(results, null, 2) + '\n')
}

async function cmdNavigate(argv) {
  const page = argv[0]
  if (!page) throw new Error('Usage: wx-inspect navigate <page-path>')
  const mp = await launch()
  try {
    await mp.reLaunch('/' + page.replace(/^\//, ''))
    log(`Navigated to /${page}`)
  } finally {
    await mp.close()
  }
}

async function cmdEval(argv) {
  const expr = argv.join(' ')
  if (!expr) throw new Error('Usage: wx-inspect eval "<expression>"')
  const mp = await launch()
  try {
    const result = await mp.evaluate(function (e) {
      // eslint-disable-next-line no-eval
      return eval(e)
    }, [expr])
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  } finally {
    await mp.close()
  }
}

const [cmd, ...rest] = process.argv.slice(2)
const commands = {
  screenshot: cmdScreenshot,
  shot: cmdScreenshot,
  batch: cmdBatch,
  navigate: cmdNavigate,
  eval: cmdEval,
}
const handler = commands[cmd]
if (!handler) {
  process.stderr.write(
    `Usage: node scripts/wx-inspect.mjs <${Object.keys(commands).join('|')}> [args...]\n`,
  )
  process.exit(1)
}
handler(rest).catch((err) => {
  process.stderr.write(`[wx-inspect] ERROR: ${err.message}\n`)
  process.exit(1)
})
