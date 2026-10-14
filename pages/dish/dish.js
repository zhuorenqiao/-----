// 菜品详情页
const auth = require('../../utils/auth')
const store = require('../../utils/store')
const cart = require('../../utils/cart')

Page({
  data: {
    dish: null,
    categoryName: '',
    quantity: 0
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

  onAddCart() {
    if (!this.data.dish) return
    if (this.data.dish.status !== 'on') {
      wx.showToast({ title: '该菜品已下架', icon: 'none' })
      return
    }
    cart.add(this.data.dish, 1)
    this.refreshQuantity()
    wx.showToast({ title: '已加入购物车', icon: 'success' })
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
    wx.navigateTo({ url: '/pages/checkout/checkout' })
  },

  onCartTap() {
    wx.switchTab({ url: '/pages/cart/cart' })
  }
})
