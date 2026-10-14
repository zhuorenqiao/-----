// 登录会话（微信授权登录）
//   - 云端模式：wx.login 取 code，经 cloud.auth.signInWithWechat 换取云端会话；
//   - 本地模式：wx.login 成功后建立本地身份（数据全部留在本机，不发起网络请求）。
const cloudMod = require('./cloud.js')

function mode() {
  return cloudMod.isCloudEnabled() ? 'cloud' : 'local'
}

function session() {
  const app = getApp()
  if (app && app.globalData) return app.globalData.session || null
  // App 未就绪时回退到本地存储
  return wx.getStorageSync('jcc.session') || null
}

// 启动时恢复会话（onLaunch 阶段 getApp() 未就绪，需传入 app 实例）
function restoreSession(app) {
  app = app || getApp()
  if (!app || !app.globalData) return wx.getStorageSync('jcc.session') || null
  app.globalData.mode = mode()
  const saved = wx.getStorageSync('jcc.session')
  if (saved && saved.id) {
    app.globalData.session = saved
    app.globalData.user = saved
  }
  return app.globalData.session
}

function persist(user) {
  const app = getApp()
  app.globalData.session = user
  app.globalData.user = user
  wx.setStorageSync('jcc.session', user)
}

// 微信授权登录
function wechatLogin() {
  return new Promise(resolve => {
    wx.login({
      success: async (res) => {
        if (!res || !res.code) {
          resolve({ ok: false, error: '微信登录失败，请重试' })
          return
        }
        if (cloudMod.isCloudEnabled()) {
          const cloud = cloudMod.getCloud()
          if (!cloud) {
            resolve({ ok: false, error: '云服务初始化失败，请稍后再试' })
            return
          }
          try {
            const appid = wx.getAccountInfoSync().miniProgram.appId
            const { data: sessionData, error } = await cloud.auth.signInWithWechat(res.code, appid)
            if (error) {
              resolve({ ok: false, error: error.message || '微信登录失败' })
              return
            }
            const user = sessionData && sessionData.user ? sessionData.user : {}
            persist({
              id: user.id || ('wx_' + res.code.slice(0, 10)),
              name: user.name || '微信用户'
            })
            resolve({ ok: true, user: getApp().globalData.session })
          } catch (e) {
            console.error('[WorkBuddy Cloud] login failed', JSON.stringify({
              stage: 'wechat-login-handler',
              message: e && e.message ? e.message : '微信登录失败，请重试'
            }))
            resolve({ ok: false, error: '微信登录失败，请重试' })
          }
        } else {
          // 本地模式：wx.login 已在微信环境内完成授权，建立本机身份
          persist({
            id: 'local_' + res.code.slice(0, 12),
            name: '微信用户'
          })
          resolve({ ok: true, user: getApp().globalData.session })
        }
      },
      fail: (err) => {
        console.error('[WorkBuddy Cloud] login failed', JSON.stringify({
          stage: 'wx.login',
          message: err && err.errMsg ? err.errMsg : 'wx.login failed'
        }))
        resolve({ ok: false, error: (err && err.errMsg) || '微信登录失败，请在微信中打开' })
      }
    })
  })
}

function logout() {
  const app = getApp()
  app.globalData.session = null
  app.globalData.user = null
  wx.removeStorageSync('jcc.session')
}

// 页面级登录守卫：未登录时跳转登录页
function requireLogin() {
  if (!session()) {
    wx.reLaunch({ url: '/pages/login/login' })
    return false
  }
  return true
}

module.exports = {
  mode,
  session,
  restoreSession,
  wechatLogin,
  logout,
  requireLogin
}
