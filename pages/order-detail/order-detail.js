// 订单详情页
const store = require('../../utils/store')
const cart = require('../../utils/cart')
const fmt = require('../../utils/format')
const nav = require('../../utils/nav')

const STATUS_TEXT = {
  pending: '待完成',
  completed: '已完成',
  cancelled: '已取消'
}

const STATUS_DESC = {
  pending: '订单已提交，请到店就餐',
  completed: '订单已完成，感谢光临',
  cancelled: '订单已取消'
}

Page({
  data: {
    order: null,
    statusText: '',
    statusDesc: '',
    timeText: '',
    orderNoText: '',
    totalText: '0.00',
    loading: true
  },

  onLoad(options) {
    this.orderId = options.id
  },

  onShow() {
    this.loadOrder()
  },

  async loadOrder() {
    const r = await store.getOrder(this.orderId)
    if (!r.ok) {
      this.setData({ loading: false })
      wx.showToast({ title: r.error, icon: 'none' })
      return
    }
    const list = await store.resolveItemImages([r.data])
    const o = list[0]
    const items = (o.items || []).map(x => ({
      id: x.id,
      name: x.name,
      price: Number(x.price),
      image: x.image,
      image_url: x.image_url || '',
      quantity: x.quantity,
      subtotal: Number(x.price) * x.quantity,
      subtotalText: fmt.money(Number(x.price) * x.quantity),
      priceText: fmt.money(x.price)
    }))
    this.setData({
      loading: false,
      order: {
        id: o.id,
        items: items,
        remark: o.remark || '',
        status: o.status,
        created_at: o.created_at
      },
      statusText: STATUS_TEXT[o.status] || o.status,
      statusDesc: STATUS_DESC[o.status] || '',
      timeText: fmt.dateTime(o.created_at),
      orderNoText: fmt.orderNo(o.id, o.created_at),
      totalText: fmt.money(o.total_price)
    })
  },

  onCancel() {
    wx.showModal({
      title: '取消订单',
      content: '确定要取消该订单吗？',
      confirmColor: '#E8590C',
      success: async res => {
        if (!res.confirm) return
        const r = await store.updateOrderStatus(this.orderId, 'cancelled')
        if (!r.ok) {
          wx.showToast({ title: r.error, icon: 'none' })
          return
        }
        wx.showToast({ title: '订单已取消', icon: 'success' })
        this.loadOrder()
      }
    })
  },

  onComplete() {
    wx.showModal({
      title: '确认完成',
      content: '确认收到菜品并完成该订单吗？',
      confirmColor: '#E8590C',
      success: async res => {
        if (!res.confirm) return
        const r = await store.updateOrderStatus(this.orderId, 'completed')
        if (!r.ok) {
          wx.showToast({ title: r.error, icon: 'none' })
          return
        }
        wx.showToast({ title: '订单已完成', icon: 'success' })
        this.loadOrder()
      }
    })
  },

  // 再来一单：把订单菜品重新加入购物车
  onReorder() {
    const order = this.data.order
    if (!order || !order.items.length) return
    order.items.forEach(x => {
      cart.add({
        id: x.id,
        name: x.name,
        price: x.price,
        image: x.image
      }, x.quantity)
    })
    wx.showToast({ title: '已加入购物车', icon: 'success' })
    setTimeout(() => {
      nav.goTab(2)
    }, 400)
  }
})
