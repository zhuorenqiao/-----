// 家常菜餐厅点餐小程序 - 应用入口
const auth = require('./utils/auth.js')

App({
  onLaunch() {
    // 恢复本地会话（本地模式或云端模式通用）
    auth.restoreSession()
  },
  globalData: {
    session: null,   // 当前会话 { id, name, mode }
    mode: 'local',   // local = 本地存储模式；cloud = 云端模式
    cartVersion: 0   // 购物车变更版本号，页面 onShow 时据此刷新
  }
})
