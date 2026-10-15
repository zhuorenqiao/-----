// 点餐页：左侧分类，右侧菜品列表（全部分类连成一页，滚动联动左侧菜单）
const auth = require('../../utils/auth')
const store = require('../../utils/store')
const cart = require('../../utils/cart')
const flyUtil = require('../../utils/fly')

Page({
  data: {
    categories: [],
    sections: [],
    activeCategory: '',
    activeCategoryName: '',
    quantities: {},
    cartCount: 0,
    cartTotal: 0,
    // 左侧/右侧 scroll-view 的定位锚点
    intoCat: '',
    intoSection: ''
  },

  onLoad(options) {
    if (options.category) {
      this.pendingCategory = options.category
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
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
    const allRes = await store.getDishes({ status: 'on' })
    if (!allRes.ok) {
      wx.showToast({ title: allRes.error, icon: 'none' })
      return
    }
    const allDishes = await store.resolveImages(allRes.data)
    let active = this.data.activeCategory
    // 接收首页「本店分类」跳转指定的分类（switchTab 不支持带参数，走 globalData）
    const app = getApp()
    if (this.pendingCategory || app.globalData.pendingCategory) {
      active = this.pendingCategory || app.globalData.pendingCategory
      this.pendingCategory = ''
      app.globalData.pendingCategory = ''
    }
    // 按分类顺序把所有在售菜品分组，右侧连成一个可滚动长列表
    const sections = cats.data.map(c => ({
      id: String(c.id),
      name: c.name,
      dishes: allDishes.filter(d => String(d.category_id) === String(c.id))
    }))
    const found = sections.find(s => s.id === String(active))
    const target = found || sections[0]
    const activeId = target ? target.id : ''
    const categories = sections.map(s => ({
      id: s.id,
      name: s.name,
      active: s.id === activeId
    }))
    this.setData({
      categories: categories,
      sections: sections,
      activeCategory: activeId,
      activeCategoryName: target ? target.name : ''
    })
    // 指定进入某分类时，右侧直接定位到该区块
    if (found) {
      this.scrollLockUntil = Date.now() + 600
      this.setData({ intoSection: '' })
      wx.nextTick(() => this.setData({ intoSection: 'sec-' + activeId }))
    }
    this.refreshQuantities()
    this.measureSections()
    // 图片等异步渲染后兜底再测一次，保证联动阈值准确
    setTimeout(() => this.measureSections(), 800)
  },

  // 缓存右侧每个分类区块相对滚动容器的顶部偏移，供滚动联动计算
  measureSections() {
    const q = wx.createSelectorQuery().in(this)
    q.select('.dish-side').boundingClientRect()
    q.selectAll('.cat-section').boundingClientRect()
    q.exec(res => {
      if (!res || !res[0] || !res[1] || !res[1].length) return
      const baseTop = res[0].top
      this.sectionTops = res[1].map(r => ({
        id: String(r.id || '').replace(/^sec-/, ''),
        top: r.top - baseTop
      }))
      this.scrollViewH = res[0].height
    })
  },

  // 右侧滚动时，同步左侧选中分类（某分类滑完后继续滑即进入下一分类）
  onDishScroll(e) {
    const d = e.detail || {}
    const now = Date.now()
    if (this.scrollLockUntil && now < this.scrollLockUntil) return
    if (this.lastSyncT && now - this.lastSyncT < 60) return
    this.lastSyncT = now
    const tops = this.sectionTops
    if (!tops || !tops.length) return
    const scrollTop = d.scrollTop || 0
    let idx = 0
    for (let i = 0; i < tops.length; i++) {
      if (tops[i].top <= scrollTop + 10) idx = i
      else break
    }
    // 滚到底部时强制定位到最后一个分类（末尾分类内容不足一屏的场景）
    if (this.scrollViewH && d.scrollHeight &&
      scrollTop + this.scrollViewH >= d.scrollHeight - 5) {
      idx = tops.length - 1
    }
    const id = tops[idx].id
    if (id && id !== this.data.activeCategory) {
      this.syncActive(id)
    }
  },

  // 同步左侧选中态，并让左侧菜单滚动到当前项可见
  syncActive(id) {
    id = String(id)
    const categories = this.data.categories.map(c => ({
      id: c.id,
      name: c.name,
      active: c.id === id
    }))
    const cat = this.data.categories.find(c => c.id === id)
    this.setData({
      categories: categories,
      activeCategory: id,
      activeCategoryName: cat ? cat.name : '',
      intoCat: 'left-' + id
    })
  },

  refreshQuantities() {
    const map = {}
    cart.getCart().forEach(x => { map[x.id] = x.quantity })
    this.setData({
      quantities: map,
      cartCount: cart.count(),
      cartTotal: cart.total()
    })
  },

  onCatTap(e) {
    const id = String(e.currentTarget.dataset.id)
    if (id === this.data.activeCategory) return
    this.syncActive(id)
    // 程序化定位期间锁定滚动联动，避免动画经过中间分类时左侧闪烁
    this.scrollLockUntil = Date.now() + 600
    this.setData({ intoSection: '' })
    wx.nextTick(() => this.setData({ intoSection: 'sec-' + id }))
  },

  findDish(id) {
    for (let i = 0; i < this.data.sections.length; i++) {
      const dish = this.data.sections[i].dishes.find(
        d => String(d.id) === String(id)
      )
      if (dish) return dish
    }
    return null
  },

  onDishTap(e) {
    const dish = e.detail.dish
    if (dish && dish.id) {
      wx.navigateTo({ url: '/pages/dish/dish?id=' + dish.id })
    }
  },

  onDishChange(e) {
    const detail = e.detail || {}
    const dish = this.findDish(detail.dishId)
    if (!dish) return
    const isNewAdd = detail.value > 0 &&
      !cart.getCart().find(x => String(x.id) === String(dish.id))
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
    // 加购时从点击位置抛物线飞入购物车（步进器的“+”按钮会带触点坐标）
    if (isNewAdd && detail.x != null && detail.y != null && !this.flying) {
      this.playFlyToCart(detail, dish)
    }
  },

  async playFlyToCart(detail, dish) {
    this.flying = true
    const flyBall = this.selectComponent('#flyBall')
    if (!flyBall) {
      this.flying = false
      return
    }
    const targetRect = await flyUtil.resolveCartTarget(this)
    await flyBall.fly({
      startX: detail.x,
      startY: detail.y,
      targetRect: targetRect,
      image: detail.image || dish.image_url
    })
    flyUtil.bumpCartIcon(this)
    this.flying = false
  },

  onCartTap() {
    wx.switchTab({ url: '/pages/cart/cart' })
  },

  onCheckout() {
    wx.switchTab({ url: '/pages/cart/cart' })
  }
})
