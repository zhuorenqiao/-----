// 购物车（tab 组件）
const auth = require('../../utils/auth')
const store = require('../../utils/store')
const cart = require('../../utils/cart')
const fmt = require('../../utils/format')
const nav = require('../../utils/nav')

Component({
  options: { styleIsolation: 'apply-shared' },
  data: {
    items: [],
    total: 0,
    totalText: '0.00',
    remark: '',
    invalidCount: 0,
    submitting: false
  },
  methods: {
    // 由宿主页（pages/main）在 tab 激活/初始化时调用
    onShow() {
      if (!auth.requireLogin()) return
      cart.refreshBadge()
      this.loadCart()
    },

    async loadCart() {
      const cartItems = cart.getCart()
      if (!cartItems.length) {
        this.setData({ items: [], total: 0, totalText: '0.00', remark: '', invalidCount: 0 })
        return
      }
      // 与云端/本地菜品核对：下架或已删除的标记为失效
      const r = await store.getDishes()
      let validItems = cartItems
      let invalidCount = 0
      if (r.ok) {
        const dishMap = {}
        r.data.forEach(d => { dishMap[String(d.id)] = d })
        validItems = cartItems.filter(x => {
          const d = dishMap[String(x.id)]
          return d && d.status === 'on'
        })
        invalidCount = cartItems.length - validItems.length
      }
      // 用最新价格与图片覆盖快照
      const dishMap2 = {}
      if (r.ok) r.data.forEach(d => { dishMap2[String(d.id)] = d })
      const items = validItems.map(x => {
        const d = dishMap2[String(x.id)]
        return {
          id: x.id,
          name: d ? d.name : x.name,
          price: d ? Number(d.price) : Number(x.price),
          image: d ? d.image : x.image,
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
        remark: cart.getRemark(),
        invalidCount: invalidCount
      })
    },

    onChange(e) {
      const detail = e.detail || {}
      const value = detail.value
      if (value <= 0) {
        cart.remove(detail.dishId)
        wx.showToast({ title: '已移除', icon: 'success' })
      } else {
        cart.setQuantity(detail.dishId, value)
      }
      this.loadCart()
    },

    onDelete(e) {
      const id = e.currentTarget.dataset.id
      cart.remove(id)
      this.loadCart()
      wx.showToast({ title: '已移除', icon: 'success' })
    },

    onClear() {
      if (!cart.getCart().length) return
      wx.showModal({
        title: '提示',
        content: '确定要清空购物车吗？',
        confirmColor: '#E8590C',
        success: res => {
          if (res.confirm) {
            cart.clear()
            this.loadCart()
          }
        }
      })
    },

    onRemarkInput(e) {
      const value = e.detail.value
      cart.setRemark(value)
      this.setData({ remark: value })
    },

    goMenu() {
      nav.goTab(1)
    },

    async onSubmit() {
      if (this.data.submitting) return
      if (!this.data.items.length) {
        wx.showToast({ title: '购物车是空的', icon: 'none' })
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
        nav.goTab(3)
      }, 400)
    }
  }
})
