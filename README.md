# 家常菜餐厅 · 餐饮点单微信小程序

面向「家常菜餐厅」的点单小程序：顾客微信授权登录后浏览菜单、加购、下单、查订单；店家在「菜品管理」中维护菜品与分类、上传菜品图片。

## 快速开始

1. 打开**微信开发者工具**，选择「导入项目」，目录选择本文件夹（`project.config.json` 所在目录）。
2. AppID 可选择「测试号」或你自己的小程序 AppID（`project.config.json` 中当前为 `touristappid` 占位）。
3. 编译后即可在模拟器预览；点真机预览可扫码在微信中体验。

> 说明：当前为**本地模式**（云服务开通确认未完成），所有数据保存在本机，无需后端即可完整运行。切换云端模式见下文。

## 功能与页面

| 页面 | 说明 |
| --- | --- |
| 登录页 | 微信一键登录（`wx.login` 授权），登录态本地持久化 |
| 首页 | 餐厅信息、今日推荐、分类入口、热门推荐（双列网格） |
| 点餐 | 左侧分类切换 + 右侧菜品列表，步进器加购，底部悬浮购物车栏 |
| 菜品详情 | 大图、价格、月售、介绍，加入购物车 / 立即购买 |
| 购物车 | 数量调整、移除、清空、备注，自动剔除已下架菜品 |
| 确认订单 | 清单核对、备注、合计，提交后生成订单 |
| 订单记录 | 状态筛选（全部/待完成/已完成/已取消）、下拉刷新、上拉加载更多 |
| 订单详情 | 状态、菜品明细、订单信息，支持取消 / 确认完成 / 再来一单 |
| 我的 | 用户信息、订单入口、菜品管理、联系餐厅、退出登录 |
| 菜品管理 | 菜品上下架 / 编辑 / 删除、分类增删改、云端示例菜单初始化 |
| 菜品编辑 | 表单 + 图片上传（相册/拍照） |

种子菜单：5 个分类（荤菜热炒 / 素菜时蔬 / 汤羹炖品 / 主食米饭 / 饮品甜点）、16 道家常菜，首次启动自动装入。

## 目录结构

```
├── app.js / app.json / app.wxss     # 入口、页面与 tabBar 配置、全局样式
├── project.config.json              # 开发者工具项目配置
├── pages/                           # 11 个页面（wxml + js + json + wxss）
├── components/                      # dish-card / stepper / cart-bar / empty
├── utils/
│   ├── config.js                    # 云服务 publicConfig（填空 = 本地模式）
│   ├── cloud.js                     # 云 SDK 懒加载初始化
│   ├── store.js                     # 数据层：本地 / 云端双模式
│   ├── auth.js                      # 微信登录与会话
│   ├── cart.js / format.js / seed-menu.js
│   └── workbuddy-cloud-diagnostics.js
├── assets/
│   ├── icons/                       # 统一风格线性图标（tabBar/分类/动作）
│   └── seed/dishes/                 # 16 张菜品图（压缩后约 30KB/张）
└── tests/validate.js                # 静态校验脚本：node tests/validate.js
```

## 两种运行模式

数据层 `utils/store.js` 对页面暴露同一套接口，按配置自动切换：

- **本地模式（当前）**：分类 / 菜品 / 订单保存在 `wx.storage`，上传的图片经 `wx.saveFile` 存在本地文件，重启不丢失；购物车按用户隔离。
- **云端模式**：菜品与订单走云端数据库（RLS：分类菜品公开读、订单仅本人可见），菜品图片走云端存储（`shared/<uid>/dishes/`，所有登录用户可读，展示时签名）。

### 切换到云端模式

1. 开通云服务后，将激活返回的 `publicConfig` 填入 `utils/config.js`：
   ```js
   module.exports = {
     endpoint: '<数据平面地址>',
     publishableKey: '<应用标识>'
   }
   ```
2. 在开发者工具中执行「构建 npm」（已安装 `@tencent-ai/workbuddy-cloud-sdk`）。
3. 建表并开放权限（RLS：分类菜品公开读、订单仅本人读写）：
   ```sql
   CREATE TABLE dish_categories (
     id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     name TEXT NOT NULL,
     sort INTEGER NOT NULL DEFAULT 0,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );

   CREATE TABLE dishes (
     id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     category_id BIGINT REFERENCES dish_categories(id) ON DELETE SET NULL,
     name TEXT NOT NULL,
     description TEXT,
     price NUMERIC(10,2) NOT NULL DEFAULT 0,
     image_path TEXT,
     sales INTEGER NOT NULL DEFAULT 0,
     is_featured BOOLEAN NOT NULL DEFAULT false,
     status TEXT NOT NULL DEFAULT 'on',
     sort INTEGER NOT NULL DEFAULT 0,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );

   CREATE TABLE orders (
     id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     owner_id TEXT NOT NULL DEFAULT auth.uid(),
     owner_name TEXT,
     items JSONB NOT NULL DEFAULT '[]'::jsonb,
     total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
     remark TEXT,
     status TEXT NOT NULL DEFAULT 'pending',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```
   三张表均开启 RLS：`dish_categories` / `dishes` 对 `anon, authenticated` 开放 SELECT，写权限仅 `authenticated`；`orders` 仅允许 `owner_id = auth.uid()` 的行被本人 SELECT/INSERT/UPDATE/DELETE。
4. 进入小程序「我的 → 菜品管理」，点击「初始化示例菜单」即写入分类、菜品并把包内示例图上传到云端存储。

## 设计规范

- 暖色餐饮主题：主色 `#E8590C`，页面底 `#F6F3EE`，卡片纯白圆角。
- 图标全部为统一线性风格（tabBar 5 组双态、5 枚分类图标、11 枚动作图标、空状态插画），无 Emoji。
- 固定底栏已适配 iPhone 安全区；`app.json` 已开启 `lazyCodeLoading: requiredComponents`。
- 状态色约定：待完成 = 橙、已完成 = 绿、已取消 = 灰。

## 已知限制

- 本地模式下「微信登录」在微信环境内完成授权并建立本机身份；多端数据不同步，切换云端后解决。
- 未接入在线支付，订单为「餐后到店支付」。
- 菜品管理对所有登录用户开放（无独立管理员角色），单人经营场景可直接使用。
- `.tmp-gen/` 为菜品图原始生成文件（仅存档，已在 `packOptions.ignore` 中排除，不会打进小程序包）。
