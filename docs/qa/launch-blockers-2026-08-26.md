# 上线卡点评估 · 2026-08-26

**目标**：把当前 weapp POC 版本推到"能扫码试用"。

**Bottom line**：**至少 3 个 P0 blocker 未解**（后端域名 / 微信服务器域名白名单 / 用户身份），单靠代码改动无法解决，都需要外部行动（备案 / 阿里云控制台配置 / 微信开放平台配置）。

---

## 诊断链路（今天做的）

review 页从匿名登录 → 后端 CRUD 全走通的路径，实测在 DevTools 里 **20 秒后**抛：

```
AuthRetryableFetchError: {"errMsg":"request:fail"}
```

`request:fail` 是 `wx.request` 层的错，请求根本没建立 TCP。

**根因链**：
1. `.env.local` 里 `SUPABASE_URL=https://ra-gsuvkgup6t4ipp7-pb.rds.apsaradb.com`
2. `.rds.apsaradb.com` 是阿里云 **RDS 内网域名**（VPC 内可达，公网不通）
3. host mac 上 DNS 把这个域名解析到 `198.19.147.196`（IANA 保留段）——你本机装了 Clash/ClashX Meta 之类 fake-ip 分流，但没配 aliyun 规则，直接 catch 到虚拟 IP
4. 即使没本机分流，微信小程序在真机上也是走用户网络 → 走公网 → 阿里云 RDS 内网域名依然不通

---

## Blocker 清单

### 🔴 P0-A · 阿里云 Supabase 需要用**公网访问 URL**
**现状**：`.env.local` 里的 URL 是内网访问 URL（`.rds.apsaradb.com`）。
**要做**：进阿里云控制台 → RDS 实例 → 网络信息 → 申请**外网连接**，拿到公网 URL 替换 `SUPABASE_URL`。
**风险**：公网 URL 会暴露 DB 端口，需要开阿里云安全组白名单（0.0.0.0/0 或至少微信服务器出口段）。或者开一层 API Gateway。
**Owner**：用户在阿里云控制台操作。

### 🔴 P0-B · 微信"服务器域名白名单"备案 + 配置
**现状**：小程序官方要求所有 `wx.request` 目标域名必须
1. 走 HTTPS
2. 已 ICP 备案（域名和主体一致）
3. 添加到「小程序管理台 → 开发管理 → 开发设置 → 服务器域名 request 合法域名」白名单

`.rds.apsaradb.com` 是阿里云的默认域名，**不备案在你名下**，微信真机会拒。

**要做**（三选一）：
- **A** 在阿里云绑定自定义域名到 Supabase 实例（比如 `api.body-diary.xxx`），备案在你名下（你现在小程序备案本身也在审核，可以顺便一起备案主域名）
- **B** 走 CDN/API 网关（阿里云 API Gateway or Cloudflare 到阿里云）套一层已备案域名
- **C** 换后端方案（比如 MemFire Cloud，是国内 Supabase 兼容，域名默认备案）

**Owner**：用户决策 + 备案流程。

### 🔴 P0-C · 用户身份 = 微信 openid（不能长期用匿名登录）
**现状**：weapp 端为了 POC 走 `signInAnonymously()`，用户每次冷启会拿新的 anon user，数据不能跨设备/跨启动关联。
**长期方案**：`wx.login` 拿 `code` → 后端 Edge Function 换 openid → 用 openid 建 supabase user（或 upsert）→ 返 session JWT。
**短期妥协**：POC 阶段用匿名 + 存 anonKey 复用同一 session（`persistSession:true` 已开），单设备内数据保留。跨设备就是新用户，不给「登录/迁移」入口。
**要做**：写一个 Aliyun FC / Vercel Edge Function 做 code → openid 转换，或用阿里云 Supabase 的 `signInWithWeChat` 扩展 API（需要在阿里云 Supabase 后台 Auth 配置里录入 AppID + AppSecret）。
**Owner**：先备案完拿到 AppSecret，然后我+你联调。

### 🟠 P1 · 微信小程序主体信息 + 备案完成
- **小程序名** 「身体觉察日记」— 备案审核中，未通过前**不能发布**（体验版可以，但要绑定测试白名单账号）
- **AppID**: `wx0e7b623f5850fc6e` ✅ 有了
- **AppSecret**: 需要在微信开放平台后台生成，用于服务端 auth
- **主体类别**: 个人主体 ✅
- **服务类目**: 待用户填（小程序发布前必填，"健康/健身"或"工具类"）

### 🟠 P2 · 隐私协议 + 用户信息授权
微信小程序 2023 年后强制：
- 每个小程序发布前必须提交「用户隐私保护指引」（在小程序管理台上传/勾选）
- 涉及用户数据（我们至少有 openid + 记录内容）都要在指引里列明
- App.tsx 首次启动前调 `wx.requirePrivacyAuthorize()` 弹隐私授权（POC 可先不加，真机预览不阻塞；上线审核可能拒）

### 🟡 P3 · 首次代码审核
- 上传代码 → 提交审核 → 微信团队 1-3 个工作日
- 审核可能因为：功能过于简陋（v1 首发常见）、隐私指引不匹配代码行为、类目不匹配实际功能
- **建议 v1 先做体验版**（不需审核），拿真实用户试用一轮反馈，正式版再审核

### 🟢 P4 · 已解或不阻塞
- ✅ DevTools 模拟器视觉基本盘（tokens / pxtransform / 米色底 + 纸质网格）
- ✅ URL polyfill patch 固化
- ✅ Icon 系统 (Image-based) 全通
- ✅ 3 个 P0 blocker（review URL / tab icon / practice-detail 兜底）修完
- 🟡 P1 遗留视觉打磨（YearColorGrid 对比度 / FAB 压提示 / pose 卡片占位 / FAB 分层）—— 不阻塞体验版
- 🟡 postcss-calc rpx 小数 warnings —— 完全不阻塞

---

## 到"能扫码试用"的最短路径（建议顺序）

1. **[你] 阿里云控制台**：开 Supabase 实例的外网访问，拿到公网 URL + 配安全组
   - 走通判据：本机 `curl https://<公网URL>/auth/v1/settings` 拿到 200
2. **[你] 域名 + 备案**：绑一个自己的域名（阿里云 CNAME 或直接 domain 备案）到 Supabase 公网 URL；把这个域名加到小程序服务器白名单
   - 走通判据：小程序管理台「服务器域名」页面加白名单能保存（微信自动校验备案）
3. **[我] 换 URL + 复测**：`.env.local` 换公网 URL + 备案域名，rebuild → wx-inspect 复测 review 页数据链路走通
4. **[你] 小程序管理台**：填服务类目 + 上传隐私协议指引 + 加体验版白名单账号（你自己的微信号）
5. **[我+你] 微信登录 Edge Function**：写 code → openid 转换，切 weapp auth 到 `ensureWxSession`
6. **[你] 手机扫体验版二维码**：走一遍首页 / 记录 / 保存一条 / diary / review 全流程

**卡在第 1-2 步**（外部审批+配置）。3-6 是我这边能做的。

---

## 建议决策

**如果目标是"这周能扫码试用"**：
- 走 **P0-B 方案 C**（换 MemFire Cloud）—— 域名默认备案，几小时能切完，跳过阿里云备案+外网+安全组三重卡点
- 缺点：换后端需重跑 migrations，anon key / URL 全换

**如果目标是"稳定生产 / 长期用阿里云"**：
- 走 **P0-B 方案 A**（自己域名备案）—— 时间成本 5-10 工作日备案，但生产环境更可控
- 顺路把 P0-A（外网访问）+ P0-C（微信登录）一起做完

**如果目标是"验证产品概念"**：
- 完全不上小程序，先跑 H5 版给身边朋友试。H5 走 Supabase Cloud（可能被墙但翻墙能用），不受备案约束。避开所有 P0 blocker。

---

## 附录：POC 卡点决策参考

| 方案 | 时间成本 | 长期成本 | 上线可行性 |
|---|---|---|---|
| MemFire Cloud | ~1 天 | 中（vendor lock-in） | 高，默认备案 |
| 阿里云自备案 | 5-10 工作日备案 | 低 | 高，自己控制 |
| 保持 H5 | 0 | 低 | 不上小程序 |
| Supabase Cloud（海外） | 0 | 低 | 低，微信小程序真机不通 |
