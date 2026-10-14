// 底部购物车栏：显示合计金额与结算按钮
Component({
  properties: {
    count: { type: Number, value: 0 },
    total: { type: Number, value: 0 },
    buttonText: { type: String, value: '去结算' },
    showCart: { type: Boolean, value: true }
  },
  data: {
    totalText: '0.00'
  },
  observers: {
    'total': function (total) {
      const n = Number(total)
      this.setData({ totalText: isNaN(n) ? '0.00' : n.toFixed(2) })
    }
  },
  methods: {
    onCartTap() {
      this.triggerEvent('cart')
    },
    onCheckout() {
      this.triggerEvent('checkout')
    }
  }
})
