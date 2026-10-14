// 点餐页：左侧分类，右侧菜品列表，底部购物车栏
const auth = require('../../utils/auth')
const store = require('../../utils/store')
const cart = require('../../utils/cart')

Page({
  data: {
    categories: [],
    activeCategory: '',
    activeCategoryName: '',
    dishes: [],
    quantities: {},
    cartCount: 0,
    cartTotal: 0
  },

  onLoad(options) {
    if (options.category) {
      this.pendingCategory = options.category
    }
  },

  onShow() {
    if (!auth.requireLogin()) return
    cart.refreshBadge()
    this.loadData()
  },

  async loadData() {
    await store.initData()
    const cats = await store.getCategories()
    if (!cats.ok) {
      wx.showToast({ title: cats.error, icon: 'none' })
      return
    }
    let active = this.data.activeCategory
    if (this.pendingCategory) {
      active = this.pendingCategory
      this.pendingCategory = ''
    }
    const found = cats.data.find(c => String(c.id) === String(active))
    const target = found || cats.data[0]
    const activeId = target ? String(target.id) : ''
    const categories = cats.data.map(c => ({
      id: c.id,
      name: c.name,
      active: String(c.id) === activeId
    }))
    this.setData({
      categories: categories,
      activeCategory: activeId,
      activeCategoryName: target ? target.name : ''
    })
    await this.loadDishes()
  },

  async loadDishes() {
    if (!this.data.activeCategory) {
      this.setData({ dishes: [] })
      return
    }
    const r = await store.getDishes({ category_id: this.data.activeCategory, status: 'on' })
    if (!r.ok) {
      wx.showToast({ title: r.error, icon: 'none' })
      return
    }
    const dishes = await store.resolveImages(r.data)
    this.setData({ dishes: dishes })
    this.refreshQuantities()
  },

  refreshQuantities() {
    const map = {}
    cart.getCart().forEach(x => { map[x.id] = x.quantity })
    const cartList = cart.getCart()
    this.setData({
      quantities: map,
      cartCount: cart.count(),
      cartTotal: cart.total()
    })
  },

  onCatTap(e) {
    const id = String(e.currentTarget.dataset.id)
    if (id === this.data.activeCategory) return
    const categories = this.data.categories.map(c => ({
      id: c.id,
      name: c.name,
      active: String(c.id) === id
    }))
    const cat = this.data.categories.find(c => String(c.id) === id)
    this.setData({
      categories: categories,
      activeCategory: id,
      activeCategoryName: cat ? cat.name : ''
    })
    this.loadDishes()
  },

  onDishTap(e) {
    const dish = e.detail.dish
    if (dish && dish.id) {
      wx.navigateTo({ url: '/pages/dish/dish?id=' + dish.id })
    }
  },

  onDishChange(e) {
    const detail = e.detail || {}
    const dish = this.data.dishes.find(d => String(d.id) === String(detail.dishId))
    if (!dish) return
    if (detail.value <= 0) {
      cart.remove(dish.id)
    } else {
      const cur = cart.getCart().find(x => String(x.id) === String(dish.id))
      if (cur) {
        cart.setQuantity(dish.id, detail.value)
      } else {
        cart.add(dish, 1)
      }
    }
    this.refreshQuantities()
  },

  onCartTap() {
    wx.switchTab({ url: '/pages/cart/cart' })
  },

  onCheckout() {
    wx.switchTab({ url: '/pages/cart/cart' })
  }
})
