// 底部购物车栏：显示合计金额与结算按钮
Component({
  properties: {
    count: { type: Number, value: 0 },
    total: { type: Number, value: 0 },
    buttonText: { type: String, value: '去结算' },
    showCart: { type: Boolean, value: true }
  },
  data: {
    totalText: '0.00',
    bump: false
  },
  observers: {
    'total': function (total) {
      const n = Number(total)
      this.setData({ totalText: isNaN(n) ? '0.00' : n.toFixed(2) })
    }
  },
  methods: {
    // 供飞入购物车动画查询落点（购物车图标的位置）
    getCartIconRect() {
      return new Promise((resolve) => {
        this.createSelectorQuery()
          .select('.cart-icon-wrap')
          .boundingClientRect()
          .exec((res) => resolve((res && res[0]) || null))
      })
    },
    // 购物车图标弹跳（飞入动画落袋时的反馈）
    bumpCartIcon() {
      this.setData({ bump: true })
      setTimeout(() => this.setData({ bump: false }), 500)
    },
    onCartTap() {
      this.triggerEvent('cart')
    },
    onCheckout() {
      this.triggerEvent('checkout')
    }
  }
})
