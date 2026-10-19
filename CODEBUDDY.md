# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## 项目概述

「家常菜餐厅」微信小程序（原生开发，非 Taro/uni-app）：顾客浏览菜单、加购、下单、查订单；店家在「菜品管理」维护菜品与分类。核心特点是**数据层双模式**：本地模式（wx.storage，默认）与云端模式（WorkBuddy Cloud SDK），由同一套 `utils/store.js` 接口透明切换。

## 常用命令

- 校验（唯一自动化检查）：`node tests/validate.js` — 静态校验 app.json 结构、JSON/JS 语法、WXML 引用、资源存在性、代码/文案中**不允许出现 Emoji**、**主包体积 < 2 MB**。改完代码必跑。
- 安装依赖（仅云端模式需要）：`npm install`（依赖 `@tencent-ai/workbuddy-cloud-sdk`），随后在微信开发者工具中执行「构建 npm」（生成 `miniprogram_npm/`，运行时 SDK 实际从这里加载）。
- 编译/预览/调试：微信开发者工具导入本目录（`project.config.json` 所在目录，AppID 当前为 `touristappid` 占位）。无 CLI 构建流程，真机调试用开发者工具的预览二维码。

## 架构

### 双模式数据层（最重要）

- `utils/config.js`：`endpoint` / `publishableKey` 填空 = 本地模式；填入后自动启用云端模式。
- `utils/cloud.js`：懒加载 SDK 客户端。未配置时**不 require SDK、不发网络请求**；初始化失败自动回退本地模式。
- `utils/store.js`：对页面暴露统一接口（分类/菜品/订单 CRUD + 图片存储）。内部维护两套实现：本地模式用 `wx.getStorageSync`（键 `jcc.categories` / `jcc.dishes` / `jcc.orders.<uid>`），云端模式读写数据库表 `dish_categories` / `dishes` / `orders`（云行结构与本地结构在 `cloudDishToApp` / `appDishToCloud` 等函数间转换）。**修改数据逻辑时两条路径都要改**。
- 云端 RLS 约定：分类/菜品公开读（写需 authenticated）；订单仅 `owner_id = auth.uid()` 本人可见。图片走云端存储 `shared/<uid>/dishes/`。建表 SQL 见 README.md。
- 首次启动由 `utils/seed-menu.js` 注入种子数据（5 分类 57 道菜），云端模式在「我的 → 菜品管理」手动点「初始化示例菜单」。`VERSION` 升级时 `store.initData` 只增补缺失 id 的分类/菜品，不覆盖已有记录。
- 菜品字段 `baby`（云端 `is_baby`）=「宝宝营养餐」，列表卡片图片左下角与详情页名称旁显示粉色 tag；`pages/dish-edit` 可开关。

### 会话与全局状态

- `app.js` 的 `globalData`：`session`（`{ id, name, mode }`，持久化在 `jcc.session`）、`mode`、`cartVersion`。
- `utils/auth.js`：登录。云端模式 `wx.login` 换 code 走 `cloud.auth.signInWithWechat`；本地模式仅建立本机身份。注意 `onLaunch` 阶段 `getApp()` 未就绪，需传 app 实例（各 util 中 `session()` 均有 `getApp()` 失败回退 storage 的兜底）。
- `utils/cart.js`：购物车本地存储，**按用户隔离**（键 `jcc.cart.<uid>`）。每次 `setCart` 递增 `globalData.cartVersion`，各页面在 `onShow` 中对比 cartVersion 决定是否刷新（tabBar 跨页共享购物车状态的机制）。改数量会自动 `refreshBadge()` 更新 tabBar 角标。

### 页面与组件

- 11 个页面均在 `app.json` 注册，5 个 tabBar 页使用**自定义 tab bar**（`custom-tab-bar/`）。
- `components/`：dish-card / stepper / cart-bar / empty / fly-ball（加购抛物线动画）。页面通过 `usingComponents` 引用，开启 `lazyCodeLoading: requiredComponents`。
- 管理端无独立角色：菜品管理（`pages/admin`）对所有登录用户开放。

### 设计规范（改动 UI 时必须遵守）

- 主色 `#E8590C`，页面底 `#F6F3EE`，卡片纯白圆角；状态色：待完成橙、已完成绿、已取消灰。
- **所有图标必须是 `assets/icons/` 下的统一线性 PNG，禁止 Emoji**（validate.js 会拦截）。
- 固定底栏需适配 iPhone 安全区。
- 价格格式化用 `utils/money.wxs` / `utils/format.js`。

## 注意事项

- `utils/workbuddy-cloud-diagnostics.js`：vConsole 诊断适配器，包装 wx 请求对象用于排查云端请求，缺失不影响功能。
- `r_*.txt` / `before.txt` / `resp.txt` / `.tmp-gen/` 为历史存档文件，不属于运行时代码（已在 `packOptions.ignore` 排除）。
- **打包范围（`project.config.json` 的 `packOptions.ignore`）**：`node_modules/`、`tests/`、`scripts/`、`.tmp-gen/`、根目录 `*.md` / `*.txt` / `package*.json` 等本地开发文件全部排除。**绝不能把 `miniprogram_npm/` 加入 ignore** —— 云端模式运行时的 SDK 实际从那里加载（`utils/cloud.js` 里 `require('@tencent-ai/workbuddy-cloud-sdk/miniprogram')` 由构建 npm 后解析到 `miniprogram_npm/`）。新增静态资源时先评估体积：单文件 > 500 KB 优先用远端 URL。
- `assets/seed/dishes/*.jpg` 已是 480×480 的优化 JPEG，重复压缩反而变大（实测 quality=80 重编码会 +16%）；不要对它跑批量图片压缩工具。
