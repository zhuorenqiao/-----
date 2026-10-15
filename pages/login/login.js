// 登录页：微信授权登录
const auth = require('../../utils/auth')

Page({
  data: {
    loading: false
  },

  onLoad() {
    if (auth.session()) {
      wx.reLaunch({ url: '/pages/main/main' })
    }
  },

  onLogin() {
    if (this.data.loading) return
    this.setData({ loading: true })
    wx.showLoading({ title: '登录中', mask: true })
    auth.wechatLogin().then(res => {
      wx.hideLoading()
      this.setData({ loading: false })
      if (!res.ok) {
        wx.showToast({ title: res.error || '登录失败', icon: 'none' })
        return
      }
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/main/main' })
      }, 400)
    })
  }
})
