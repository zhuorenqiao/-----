// 主容器内嵌 tab bar（由 pages/main 使用，替代原 custom-tab-bar）
const cart = require('../../utils/cart')

Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    selected: {
      type: Number,
      value: 0
    }
  },
  data: {
    cartCount: 0,
    bump: false,
    color: '#B9B1A4',
    selectedColor: '#E8590C',
    list: [
      { text: '首页', icon: '/assets/icons/tab-home.png', activeIcon: '/assets/icons/tab-home-active.png' },
      { text: '点餐', icon: '/assets/icons/tab-menu.png', activeIcon: '/assets/icons/tab-menu-active.png' },
      { text: '购物车', icon: '/assets/icons/tab-cart.png', activeIcon: '/assets/icons/tab-cart-active.png' },
      { text: '订单', icon: '/assets/icons/tab-orders.png', activeIcon: '/assets/icons/tab-orders-active.png' },
      { text: '我的', icon: '/assets/icons/tab-profile.png', activeIcon: '/assets/icons/tab-profile-active.png' }
    ]
  },
  lifetimes: {
    attached() {
      this.setData({ cartCount: cart.count() > 99 ? '99+' : String(cart.count()) })
    }
  },
  methods: {
    // 供飞入购物车动画查询落点（第三个 tab：购物车图标的位置）
    getCartIconRect() {
      return new Promise((resolve) => {
        this.createSelectorQuery()
          .selectAll('.icon-wrap')
          .boundingClientRect()
          .exec((res) => {
            const list = (res && res[0]) || []
            resolve(list[2] || null)
          })
      })
    },
    // 购物车图标弹跳（飞入动画落袋时的反馈）
    bumpCartIcon() {
      this.setData({ bump: true })
      setTimeout(() => this.setData({ bump: false }), 500)
    },
    onTap(e) {
      const { index } = e.currentTarget.dataset
      this.triggerEvent('change', { index })
    }
  }
})
