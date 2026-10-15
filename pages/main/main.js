// 主容器页：swiper 承载 5 个 tab 组件，实现左右滑动切换（相邻页实时可见）
const auth = require('../../utils/auth')
const cart = require('../../utils/cart')

const TAB_COUNT = 5

Page({
  data: {
    current: 0
  },

  onReady() {
    this._ready = true
    // 注入 tab bar 引用，供 tab 组件的飞入动画定位/弹跳使用
    const tabbar = this.selectComponent('#tabbar')
    for (let i = 0; i < TAB_COUNT; i++) {
      const c = this.getTabComp(i)
      if (c) c._hostTabbar = tabbar
    }
    this.bootstrap()
  },

  onShow() {
    if (!auth.requireLogin()) return
    cart.refreshBadge()
    if (!this._ready) return
    this.bootstrap()
  },

  // 初始化所有 tab（保证滑动时相邻页有内容），并刷新当前 tab
  bootstrap() {
    this.handlePendingTab()
    for (let i = 0; i < TAB_COUNT; i++) {
      if (i === this.data.current) continue
      this.initTab(i)
    }
    this.activate(this.data.current)
  },

  initTab(i) {
    const c = this.getTabComp(i)
    if (c && !c._inited && typeof c.onShow === 'function') {
      c._inited = true
      c.onShow()
    }
  },

  activate(i) {
    const c = this.getTabComp(i)
    if (c && typeof c.onShow === 'function') {
      c._inited = true
      c.onShow()
    }
  },

  getTabComp(i) {
    return this.selectComponent('#tab' + i)
  },

  // 消费外部页面（utils/nav.goTab）带来的目标 tab
  handlePendingTab() {
    const app = getApp()
    const pt = app.globalData.pendingTab
    if (pt === 0 || pt) {
      app.globalData.pendingTab = ''
      const idx = Number(pt)
      if (idx !== this.data.current) this.setData({ current: idx })
    }
  },

  // 供 utils/nav.goTab 直接调用（main 在页面栈中时）
  switchToTab(i) {
    const idx = Number(i)
    if (idx === this.data.current) {
      this.activate(idx)
      return
    }
    this.setData({ current: idx })
    this.activate(idx)
  },

  // 手势滑动切换完成后（swiper 动画结束回调）
  onSwiperChange(e) {
    const d = e.detail || {}
    if (d.source === 'touch' && d.current !== this.data.current) {
      this.setData({ current: d.current })
      this.activate(d.current)
    }
  },

  // 点击底部 tab bar 切换
  onTabTap(e) {
    const idx = Number(e.detail.index)
    this.switchToTab(idx)
  },

  // 各 tab 内部 scroll-view 滚动到底部时转发给对应组件
  onScrollBottom(e) {
    this.triggerReachBottom(Number(e.currentTarget.dataset.idx))
  },

  // 兜底触底检测：不依赖 scrolltolower，按滚动位置计算（部分环境 scrolltolower 不触发）
  onTabScroll(e) {
    const d = e.detail || {}
    if (!d.scrollHeight) return
    if (!this._winH) {
      try {
        const info = wx.getWindowInfo
          ? wx.getWindowInfo()
          : wx.getSystemInfoSync()
        this._winH = info.windowHeight || 600
      } catch (err) {
        this._winH = 600
      }
    }
    if (d.scrollTop + this._winH >= d.scrollHeight - 120) {
      this.triggerReachBottom(Number(e.currentTarget.dataset.idx))
    }
  },

  triggerReachBottom(idx) {
    const c = this.getTabComp(idx)
    if (c && typeof c.onReachBottom === 'function') c.onReachBottom()
  },

  // 购物车角标同步（utils/cart.refreshBadge 调用）
  updateCartBadge(text) {
    const tb = this.selectComponent('#tabbar')
    if (tb && tb.data.cartCount !== text) tb.setData({ cartCount: text })
  }
})
