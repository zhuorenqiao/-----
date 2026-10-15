// 我的（tab 组件）
const auth = require('../../utils/auth')
const store = require('../../utils/store')
const nav = require('../../utils/nav')

Component({
  options: { styleIsolation: 'apply-shared' },
  data: {
    user: null,
    mode: 'local',
    modeText: '本地模式',
    orderCount: 0
  },
  methods: {
    // 由宿主页（pages/main）在 tab 激活/初始化时调用
    onShow() {
      if (!auth.requireLogin()) return
      const s = auth.session()
      const cloud = auth.mode() === 'cloud'
      this.setData({
        user: s,
        mode: auth.mode(),
        modeText: cloud ? '云端模式' : '本地模式'
      })
      this.loadOrderCount()
    },

    async loadOrderCount() {
      const r = await store.getOrders({ page: 1, size: 1 })
      this.setData({ orderCount: r.ok ? (r.total || 0) : 0 })
    },

    goOrders() {
      nav.goTab(3)
    },

    goAdmin() {
      wx.navigateTo({ url: '/pages/admin/admin' })
    },

    onContact() {
      wx.showModal({
        title: '联系餐厅',
        content: '订餐热线：0755-6688 6688\n门店地址：文华路 88 号（地铁口旁）\n营业时间：09:00 - 21:00',
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#E8590C'
      })
    },

    onLogout() {
      const that = this
      wx.showModal({
        title: '退出登录',
        content: '退出后需要重新授权登录，确定退出吗？',
        confirmColor: '#E8590C',
        success(res) {
          if (!res.confirm) return
          auth.logout()
          wx.reLaunch({ url: '/pages/login/login' })
        }
      })
    }
  }
})
