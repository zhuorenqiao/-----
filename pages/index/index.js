// 首页：餐厅信息 + 今日推荐 + 分类入口 + 热门推荐
const auth = require('../../utils/auth')
const store = require('../../utils/store')
const cart = require('../../utils/cart')

const CAT_ICONS = {
  '荤菜热炒': '/assets/icons/cat-meat.png',
  '素菜时蔬': '/assets/icons/cat-veg.png',
  '汤羹炖品': '/assets/icons/cat-soup.png',
  '主食米饭': '/assets/icons/cat-staple.png',
  '饮品甜点': '/assets/icons/cat-drink.png'
}

Page({
  data: {
    categories: [],
    topDish: null,
    featured: [],
    quantities: {},
    mode: 'local'
  },

  onShow() {
    if (!auth.requireLogin()) return
    cart.refreshBadge()
    this.refreshQuantities()
    this.loadData()
  },

  async loadData() {
    await store.initData()
    const cats = await store.getCategories()
    if (!cats.ok) {
      wx.showToast({ title: cats.error, icon: 'none' })
      return
    }
    const categories = cats.data.map(c => ({
      id: c.id,
      name: c.name,
      icon: CAT_ICONS[c.name] || '/assets/icons/cat-staple.png'
    }))

    const feats = await store.getDishes({ featured: true, status: 'on' })
    if (!feats.ok) {
      wx.showToast({ title: feats.error, icon: 'none' })
      return
    }
    const dishes = await store.resolveImages(feats.data)
    const topDish = dishes.length > 0 ? dishes[0] : null
    const featured = dishes.length > 1 ? dishes.slice(1, 5) : []

    this.setData({
      categories: categories,
      topDish: topDish,
      featured: featured,
      mode: auth.mode()
    })
  },

  refreshQuantities() {
    const map = {}
    cart.getCart().forEach(x => { map[x.id] = x.quantity })
    this.setData({ quantities: map })
  },

  // 购物车数量变更（来自菜品卡片步进器）
  onDishChange(e) {
    const detail = e.detail || {}
    this.applyCartChange(detail.dishId, detail.value)
  },

  applyCartChange(dishId, value) {
    const all = []
    if (this.data.topDish) all.push(this.data.topDish)
    all.push.apply(all, this.data.featured)
    const dish = all.find(d => String(d.id) === String(dishId))
    if (!dish) return
    if (value <= 0) {
      cart.remove(dish.id)
    } else {
      const cur = cart.getCart().find(x => String(x.id) === String(dish.id))
      if (cur) {
        cart.setQuantity(dish.id, value)
      } else {
        cart.add(dish, 1)
      }
    }
    this.refreshQuantities()
  },

  goDish(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/dish/dish?id=' + id })
  },

  onDishTap(e) {
    const dish = e.detail.dish
    if (dish && dish.id) {
      wx.navigateTo({ url: '/pages/dish/dish?id=' + dish.id })
    }
  },

  goMenu() {
    wx.switchTab({ url: '/pages/menu/menu' })
  },

  goMenuCat(e) {
    const id = e.currentTarget.dataset.id
    wx.switchTab({ url: '/pages/menu/menu?category=' + (id || '') })
  }
})
