// 确认订单页
const auth = require('../../utils/auth')
const store = require('../../utils/store')
const cart = require('../../utils/cart')
const fmt = require('../../utils/format')

Page({
  data: {
    items: [],
    total: 0,
    totalText: '0.00',
    remark: '',
    submitting: false
  },

  onShow() {
    if (!auth.requireLogin()) return
    this.loadItems()
  },

  async loadItems() {
    const cartItems = cart.getCart()
    if (!cartItems.length) {
      this.setData({ items: [], total: 0, totalText: '0.00' })
      return
    }
    const r = await store.getDishes()
    const dishMap = {}
    if (r.ok) r.data.forEach(d => { dishMap[String(d.id)] = d })
    const items = cartItems
      .filter(x => {
        const d = dishMap[String(x.id)]
        return d && d.status === 'on'
      })
      .map(x => {
        const d = dishMap[String(x.id)]
        return {
          id: x.id,
          name: d.name,
          price: Number(d.price),
          image: d.image,
          image_url: '',
          quantity: x.quantity
        }
      })
    const total = items.reduce((sum, x) => sum + x.price * x.quantity, 0)
    await store.resolveImages(items)
    this.setData({
      items: items,
      total: total,
      totalText: fmt.money(total),
      remark: cart.getRemark()
    })
  },

  onRemarkInput(e) {
    const value = e.detail.value
    cart.setRemark(value)
    this.setData({ remark: value })
  },

  goMenu() {
    wx.switchTab({ url: '/pages/menu/menu' })
  },

  async onSubmit() {
    if (this.data.submitting) return
    if (!this.data.items.length) {
      wx.showToast({ title: '没有可提交的菜品', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中', mask: true })
    const r = await store.createOrder({
      items: this.data.items.map(x => ({
        id: x.id,
        name: x.name,
        price: x.price,
        image: x.image,
        quantity: x.quantity
      })),
      total_price: this.data.total,
      remark: this.data.remark
    })
    wx.hideLoading()
    this.setData({ submitting: false })
    if (!r.ok) {
      wx.showToast({ title: r.error, icon: 'none' })
      return
    }
    cart.clear()
    wx.showToast({ title: '下单成功', icon: 'success' })
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/orders/orders' })
    }, 400)
  }
})
