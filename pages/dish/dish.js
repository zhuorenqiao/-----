// 菜品详情页
const auth = require('../../utils/auth')
const store = require('../../utils/store')
const cart = require('../../utils/cart')
const flyUtil = require('../../utils/fly')
const nav = require('../../utils/nav')

Page({
  data: {
    dish: null,
    categoryName: '',
    quantity: 0,
    cartBump: false
  },

  onLoad(options) {
    this.dishId = options.id
  },

  onShow() {
    if (!auth.requireLogin()) return
    cart.refreshBadge()
    this.loadDish()
  },

  async loadDish() {
    const r = await store.getDish(this.dishId)
    if (!r.ok) {
      wx.showToast({ title: r.error, icon: 'none' })
      return
    }
    const list = await store.resolveImages([r.data])
    const cats = await store.getCategories()
    let categoryName = ''
    if (cats.ok) {
      const cat = cats.data.find(c => String(c.id) === String(list[0].category_id))
      categoryName = cat ? cat.name : ''
    }
    this.setData({ dish: list[0], categoryName: categoryName })
    this.refreshQuantity()
  },

  refreshQuantity() {
    const item = cart.getCart().find(x => String(x.id) === String(this.dishId))
    this.setData({ quantity: item ? item.quantity : 0 })
  },

  onStepperChange(e) {
    const detail = e.detail || {}
    if (String(detail.dishId) !== String(this.dishId)) return
    if (detail.value <= 0) {
      cart.remove(this.dishId)
    } else {
      const cur = cart.getCart().find(x => String(x.id) === String(this.dishId))
      if (cur) {
        cart.setQuantity(this.dishId, detail.value)
      } else {
        cart.add(this.data.dish, 1)
      }
    }
    this.refreshQuantity()
  },

  async onAddCart() {
    if (!this.data.dish) return
    if (this.data.dish.status !== 'on') {
      wx.showToast({ title: '该菜品已下架', icon: 'none' })
      return
    }
    if (this.flying) return
    this.flying = true
    cart.add(this.data.dish, 1)

    // 从头图中心（滚出视口时退化为按钮中心）抛物线飞入底部购物车图标
    const flyBall = this.selectComponent('#flyBall')
    const [hero, btn, entry] = await Promise.all([
      flyUtil.getRect('.hero-img'),
      flyUtil.getRect('.btn-add'),
      flyUtil.getRect('.cart-entry')
    ])
    if (flyBall && entry) {
      const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      let start = hero
      if (!start || start.top < 0 || start.bottom > win.windowHeight) start = btn
      if (start) {
        const c = flyUtil.centerOf(start)
        await flyBall.fly({
          startX: c.x,
          startY: c.y,
          targetRect: entry,
          image: this.data.dish.image_url
        })
      }
    }
    this.flyDone()
  },

  flyDone() {
    this.flying = false
    this.refreshQuantity()
    this.setData({ cartBump: true })
    wx.showToast({ title: '已加入购物车', icon: 'success' })
    setTimeout(() => this.setData({ cartBump: false }), 450)
  },

  onBuyNow() {
    if (!this.data.dish) return
    if (this.data.dish.status !== 'on') {
      wx.showToast({ title: '该菜品已下架', icon: 'none' })
      return
    }
    const cur = cart.getCart().find(x => String(x.id) === String(this.dishId))
    if (!cur) cart.add(this.data.dish, 1)
    this.refreshQuantity()
    nav.goTab(2)
  },

  onPreviewImage() {
    const url = this.data.dish && this.data.dish.image_url
    if (!url) return
    wx.previewImage({ urls: [url] })
  },

  onCartTap() {
    nav.goTab(2)
  }
})
