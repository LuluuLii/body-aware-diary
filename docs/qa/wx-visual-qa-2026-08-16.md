# 小程序视觉 & 运行时 QA · 2026-08-16

**采集方式**：`node scripts/wx-inspect.mjs batch qa-2026-08-16 <pages...>` 单次 launch 6 页顺序截图。DevTools 2.01.2510290 · 基础库 3.17.1 · iPhone 12/13 模拟器。dist 是最新构建（含 polyfills 全套 + tokens `page` selector 修复 + pxtransform 修复）。

原始截图存在 `tmp/wx-shots/qa-2026-08-16-<page>.png`。

---

## 结论一句话

**视觉基本盘立住了**（米色纸底 + 纸质网格 + 深绿卡片 + tab bar 都到位）。**但 review 页 URL polyfill 没兜住**、**FAB 中央 "+" 图标全局缺失**、**practice-detail 无 ID fallback 永远转圈**——这三个是 blocking。

---

## Blocking（P0）

### B1. review 页显示 `Failed to construct 'URL': Invalid URL` 错误横幅

**截图**：`qa-2026-08-16-review.png` · 页面顶部有红边错误框，写着「加载时有问题：unknown: Failed to construct 'URL': Invalid URL」

**分析**：
- 上一轮加了 `URLShim` 覆盖 Taro 内建 URL，home 页 supabase-js 构造 realtimeUrl 现在能过
- 但 review 页仍然报同类错，说明 review 侧另有一条链路踩到了 URL 构造，且不是 supabase-js 那条（否则 home 也会报）
- "unknown:" 前缀说明是 review 自己的 error 分类逻辑吃到的 exception，不是我抛的原始错

**下一步**：
- 打开 `apps/weapp/src/pages/review/index.tsx`，找 `new URL(...)` 直接调用点
- 或者 grep 找 review 依赖里可能构造 URL 的地方（图片资源？CDN 路径？supabase storage getPublicUrl？）
- 大概率是 storage.from(...).getPublicUrl(...) 之类的方法，内部又 `new URL()`，我的 shim 边界情况没覆盖到

### B2. FAB（底部大绿圆按钮）中央 "+" 图标缺失

**截图**：所有 6 页底部都有一个大绿色实心圆——**没有内部 "+" 号**。首页最明显。

**分析**：
- Tab bar 中间应该是"记录"按钮，视觉是绿色圆 + 白色 "+" 号
- 现在只有圆，没有 "+"
- 可能原因：(a) 图标是 svg/image，路径错找不到；(b) 用 Text 渲染 "+"，字体或颜色错；(c) CSS `content:'+'` 之类的伪元素在 WXSS 里不支持

**下一步**：读 `apps/weapp/src/components/TabBar/index.tsx`，看 FAB 里的 "+" 是怎么放的。

### B3. practice-detail 页永远转圈

**截图**：`qa-2026-08-16-practice-detail.png` · 只有一个居中"加载中..."文字，纸底+网格出来了但没内容

**分析**：
- 走 batch 时我 `reLaunch('/pages/practice-detail/index')` 没带 query 参数（比如 `?id=xxx`）
- 页面 useEffect 拉数据卡在等待 ID 或返回空
- **严格说不算 bug**——正常路径是从 diary/review 点某条记录进入，带 ID
- 但没有 ID 保护 / 错误状态，UX 上还是坑（用户手动跳这个 URL 会永远转圈）

**下一步**：加"缺 ID 时显示占位/跳回首页"的兜底。

---

## High（P1）

### H1. YearColorGrid 色块方阵在 0 记录时看不到

**截图**：`qa-2026-08-16-home.png` 里"你的身体，这一年"深绿卡片，只有 3 月/4 月/5 月/6 月/7 月/8 月月份标签，方阵位置是暗色空白

**分析**：
- 深绿背景 + `--year-empty:#EAE3D2` 米色格子，理论上应有淡色方阵可见
- 现在肉眼几乎看不到，对比度太弱
- 可能是 (a) 格子完全没渲染 (b) 渲染了但颜色差不多变暗吸收了

**下一步**：`pnpm wx:eval "document.querySelector('.year-color-grid').innerHTML.length"` 之类，先确认 DOM 有没有节点（小程序里得改成 wxml query）；或者读 `YearColorGrid/index.tsx` 看渲染逻辑是否依赖了 canvas / svg（在小程序里 canvas 需要 `<canvas type="2d">` 组件，svg 完全不支持）。

### H2. review 页错误横幅之外的空状态卡片是好的

正面观察，不是问题：`还没有记录 / 点下方＋记下第一次练习，这里就会慢慢长出你的图案 / [去记录] 按钮`——虚线卡片边框、留白、按钮颜色都对。B1 修完后这就是 review 空状态的完成态。

---

## Medium（P2）· 视觉小细节

### M1. 首页 FAB 位置压到 "身体絮语" 提示文字

**截图**：`qa-2026-08-16-home.png` 底部 · 提示文字「下面这颗 +，是今天想留下的。」被 FAB 圆遮住了下半

**建议**：提示文字往上挪 24rpx，或 FAB z-index / bottom offset 调整。

### M2. record 页首次进入弹「你的第一次记录」onboarding 遮罩

**截图**：`qa-2026-08-16-record.png` · 白色圆角卡片弹窗覆盖住底层记录表单

**观察**：设计是对的（首次引导）。onboarding modal 的两个按钮 [跳过 / 知道了] 视觉层次也对。但要注意 memory 里存着 `markOnboardingSeen` 逻辑，测试时 storage 是空的所以每次都弹——**不算 bug**，但每次 QA 都会挡视觉。

**建议**：QA 脚本里加一步 `wx:eval "wx.setStorageSync('onboarding-seen-record', true)"` 预先标记已看过；或者截图后再点"跳过"截第二张。

### M3. diary 页 FAB 大圆和 tab bar 视觉分层

**截图**：`qa-2026-08-16-diary.png` · FAB 圆的下半部分伸到 tab bar 的白底之上，但没有阴影/边框区分层次

**观察**：设计可能是"悬浮感"，但目前看起来更像 FAB 和 tab bar 粘在一起。想要"悬浮"就补 shadow，想要"嵌入"就把 FAB 的下沿藏进 tab bar 里。

### M4. poses 页 pose 卡片顶部的"分类 pill"（后弯/平衡）颜色偏灰

**截图**：`qa-2026-08-16-poses.png` · 每张卡片顶部是米色区块 + 灰色文字（后弯/平衡）

**观察**：handoff 里这块应该是 pose 缩略图（真人插图/线稿），现在是纯灰底 + 文字占位。可能是图片 asset 没接上/接错路径。

**下一步**：读 poses 页组件，看 pose 卡片是不是应该显示图片但目前是占位。

---

## Low（P3）· 可以晚一点

- L1. 各页 top 距 status bar 的安全距离都够，但 review 页比 home 页多一段空白（review `padding-top` 可能偏大）
- L2. record 页顶部日期「2026 · 08 · 16」在 modal 遮罩下不明显（onboarding 关闭后应该重新截）
- L3. diary 页"时间线 / 按训练类型" segmented control 视觉对齐 handoff 无异常

---

## 数据链路验证结论

- **home**：`ensureAnonymousSession → listEntries` 走通了（没报错，展示空状态）
- **diary**：同上，空状态
- **review**：`load failed <Failed to construct 'URL': ...>` · **未通过**
- **poses**：显示了空 pose 卡片模板（后弯/平衡等），说明系统 pose 字典是从静态 content 读的，不走 supabase → OK
- **practice-detail**：无 ID 时永远转圈（见 B3）
- **record**：单纯呈现表单 UI，无数据加载报错

---

## 建议的修复顺序

1. **B1 URL error（review）**：diagnose + 修 shim/调用点，或者提供更宽松的 URL 构造 fallback。**必须先修**，不然 review 页整个不可用。
2. **B2 FAB "+" 图标**：视觉 blocker，全 tab bar 都受影响。
3. **B3 practice-detail 兜底**：一段 `if (!id) return <ErrorState />` 就完事。
4. **H1 YearColorGrid**：需要看组件实现，可能要在小程序端换 canvas/image 表达方式。
5. **M1–M4**：视觉打磨，可以合成一次「Sprint 3 视觉收尾」PR。

---

## 修复回执 · 2026-08-24

### ✅ B1 URL error → done
根因链：Taro 4.1.11 内建的 URL polyfill (`@tarojs/runtime/dist/bom/URL.js`) 里 `VALID_URL` 正则是 `/^(https?:)\/\//i`——**只认 `http://` / `https://`**。supabase-js 的 `RealtimeClient` 里 `httpEndpointURL(wsHref)` 拿 `wss://...` 再 `new URL(x)` 就抛 `Failed to construct 'URL': Invalid URL`。
运行时 `globalThis.URL = shim` 无效，因为 Taro 是编译期 ProvidePlugin 绑定的（`URL` 引用被 inline 替换成 TaroURL）。
修法：把正则放宽到 `/^(https?|wss?|ftp):\/\//i`，通过 `pnpm patch` 固化成 `patches/@tarojs__runtime@4.1.11.patch`，`package.json` 里注册 `pnpm.patchedDependencies`，每次 install 自动应用（commit `d670149`）。
副产物：weapp 端把 `signInWithWeChat`（阿里云扩展 API，standard supabase-js 没实现）换成 `signInAnonymously()`，等 wx.login 服务器换 code 联调好再切回。

### ✅ B2 FAB "+" 图标 → done
根因：**微信小程序 WXML 不认识 `<svg>` 元素**——渲染成空白。整个 tab bar 4 个 icon + FAB 中央的 "+" 都空了。
修法：加 `svgDataUrl()` helper（`packages/assets/src/icons/shared.tsx`）把 SVG 编码成 data URL；在 `apps/weapp/src/lib/icons.tsx` 建 weapp 专用 icon shim 用 `<Image>` 组件加载 data URL。TabBar / pose-detail / pose-add / record / practice-detail 5 个文件切到 `../../lib/icons` 导入。
遗留：weapp 端 icon color 只能吃具体 hex（SVG data URL 拿不到 CSS variable 或 currentColor），目前硬编码 fresh 主题的 hex。切 dark 主题时 tab bar 图标会颜色不对——TODO 加 theme-aware wrapper。
`packages/assets/src/icons/index.tsx` 保留原 SVG 版本供 H5 用。

### ✅ B3 practice-detail 兜底 → done
根因：无 ID 时 `load()` 直接 return，`setLoading(false)` 从没调过 → 页面永远转圈。
修法：`if (!practiceId) { setLoading(false); return }`，让 `!practice` 分支渲染。同时改进 not-found 展示：区分「没找到这次练习」和「缺少练习 ID」两种文案 + 加「回首页」CTA 按钮。

### 未完成但相关的技术债

**优先级 P1**（阻塞真机 QA）
- **H1 · YearColorGrid 空数据可见度**：森林晨光深绿卡片上 `--year-empty:#EAE3D2` 米色格子对比度过弱，在 0 记录状态下几乎看不到方阵。要么改暗（比如 `#2F3C2A` 附近），要么加一层浅色 stroke。修完顺便在 dark 主题也扫一眼。

**优先级 P2**（视觉打磨，POC 上线前值得做）
- **M1 · FAB 压提示文字**：首页底部「下面这颗 +，是今天想留下的。」被 FAB 圆遮下半。提示上移 24rpx 或 FAB `bottom` offset 调整。
- **M2 · pose 卡片顶部灰色占位**：`poses` 页每张卡片顶部是米色方块 + 灰色分类文字（后弯 / 平衡），handoff 里这块应该是 pose 缩略图（真人插图 / 线稿）。asset 缺失 or 路径错。
- **M3 · FAB 与 tab bar 分层不清**：FAB 圆的下沿伸到 tab bar 白底之上但没 shadow/边框，视觉像粘在一起。要么补 shadow 做「悬浮感」，要么把下沿藏进 tab bar 里做「嵌入感」。
- **weapp icon 主题联动**：`apps/weapp/src/lib/icons.tsx` 里 tab bar 的 `ACTIVE / INACTIVE / PLUS_COLOR` 是硬编码的 fresh 主题 hex。切 `theme-earth` 后 tab icon 颜色不跟。要么让 TabBar 从 `useAppStore().theme` 读，要么把 icon 换成 CSS mask (`background-image` + `mask`) 让 currentColor 可用（weapp 支持 mask-image）。

**优先级 P3**（不阻塞，可以晚一点）
- **`postcss-calc` warnings**：`pose-add:203 / record:1019,1614` 里的 calc() 拿到 `23.07692rpx` 这种小数被 postcss-calc 拒（parser 不认 `rpx` 单位）。功能不受影响（原样输出），但 log 里长期红字体验差。修法：要么在 SCSS 里把 calc 表达式改成 sass 编译期计算，要么用整数 rpx 值避开 calc。
- **B3 subthread：practice-detail 手动 URL 无法测试完整流程**：目前无 ID 时正确显示「缺少练习 ID」+回首页 CTA，但要测**有 ID** 的完整渲染，需要真实数据。等 anonymous sign-in 联调后走完记录流程再回测。

### 已完成的技术债 ✅
- ~~Taro URL polyfill patch 直接改 node_modules 会被 pnpm install 覆盖~~ → 已固化为 `pnpm patch` (`d670149`)

---

## 附录：QA 复现命令

```bash
# 前置：DevTools 已开服务端口，并且关掉 DevTools 窗口
pnpm build:weapp
node scripts/wx-inspect.mjs batch qa-<date> \
  pages/home/index \
  pages/record/index \
  pages/diary/index \
  pages/review/index \
  pages/poses/index \
  pages/practice-detail/index
# 截图落在 tmp/wx-shots/qa-<date>-<page>.png
```
