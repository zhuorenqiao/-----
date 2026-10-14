const cart = require('../utils/cart')

Component({
  data: {
    selected: 0,
    cartCount: 0,
    color: '#B9B1A4',
    selectedColor: '#B4531F',
    list: [
      { path: 'pages/index/index', text: '首页', icon: '/assets/icons/tab-home.png', activeIcon: '/assets/icons/tab-home-active.png' },
      { path: 'pages/menu/menu', text: '点餐', icon: '/assets/icons/tab-menu.png', activeIcon: '/assets/icons/tab-menu-active.png' },
      { path: 'pages/cart/cart', text: '购物车', icon: '/assets/icons/tab-cart.png', activeIcon: '/assets/icons/tab-cart-active.png' },
      { path: 'pages/orders/orders', text: '订单', icon: '/assets/icons/tab-orders.png', activeIcon: '/assets/icons/tab-orders-active.png' },
      { path: 'pages/profile/profile', text: '我的', icon: '/assets/icons/tab-profile.png', activeIcon: '/assets/icons/tab-profile-active.png' }
    ]
  },
  lifetimes: {
    attached() {
      this.setData({ cartCount: cart.count() > 99 ? '99+' : String(cart.count()) })
    }
  },
  methods: {
    switchTab(e) {
      const { path } = e.currentTarget.dataset
      wx.switchTab({ url: '/' + path })
    }
  }
})
