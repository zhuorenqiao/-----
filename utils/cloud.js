// 云端客户端（懒加载）
// 仅在 utils/config.js 填入 publicConfig 后初始化；
// 未开通云服务时不会 require SDK，也不会发起任何网络请求。
const config = require('./config.js')

let cloudClient = null
let initTried = false

function getCloud() {
  if (initTried) return cloudClient
  initTried = true
  if (!config.endpoint || !config.publishableKey) {
    return null
  }
  try {
    const sdk = require('@tencent-ai/workbuddy-cloud-sdk/miniprogram')
    const { createMiniProgramWorkBuddyCloud } = sdk
    let wxInstance = wx
    try {
      // 请求诊断适配器：在 vConsole 打印失败请求的方法 / URL / 状态码
      const diagnostics = require('./workbuddy-cloud-diagnostics.js')
      if (diagnostics && diagnostics.createDiagnosticWx) {
        wxInstance = diagnostics.createDiagnosticWx(wx)
      }
    } catch (e) {
      // 诊断助手缺失时使用原生 wx，不影响功能
    }
    cloudClient = createMiniProgramWorkBuddyCloud({
      endpoint: config.endpoint,
      publishableKey: config.publishableKey,
      wx: wxInstance
    })
  } catch (e) {
    console.error('[WorkBuddy Cloud] SDK 初始化失败，已回退本地模式', e && e.message ? e.message : e)
    cloudClient = null
  }
  return cloudClient
}

module.exports = {
  // 是否具备云端条件
  isCloudEnabled() {
    return !!(config.endpoint && config.publishableKey)
  },
  getCloud
}
