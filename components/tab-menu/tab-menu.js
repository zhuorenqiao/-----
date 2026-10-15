// 点餐（tab 组件）：左侧分类，右侧菜品列表（全部分类连成一页，滚动联动左侧菜单）
const auth = require('../../utils/auth')
const store = require('../../utils/store')
const cart = require('../../utils/cart')
const flyUtil = require('../../utils/fly')
const nav = require('../../utils/nav')

Component({
  options: { styleIsolation: 'apply-shared' },
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
  methods: {
    // 由宿主页（pages/main）在 tab 激活/初始化时调用
    onShow() {
      if (!auth.requireLogin()) return
      cart.refreshBadge()
      this.loadData()
    },

    async loadData() {
      // 清理上一次点击定位的遗留状态，避免重复进入时错误高亮
      this.pendingTap = ''
      this.tapPollCount = 0
      clearTimeout(this.tapTimer)
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
      // 接收首页「本店分类」跳转指定的分类（切 tab 不支持带参数，走 globalData）
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
      const tops = this.sectionTops
      if (!tops || !tops.length) return
      const scrollTop = d.scrollTop || 0
      // 点击左侧分类后的程序化定位途中：高亮已在点击时同步，
      // 这里只在真正到达目标分类时解除同步锁（恢复随滚动联动）
      if (this.pendingTap) {
        const target = tops.find(t => t.id === this.pendingTap)
        const atBottom = this.scrollViewH && d.scrollHeight &&
          scrollTop + this.scrollViewH >= d.scrollHeight - 5
        if (target && (Math.abs(scrollTop - target.top) <= 4 || atBottom)) {
          this.pendingTap = ''
          clearTimeout(this.tapTimer)
        }
        return
      }
      if (this.scrollLockUntil && now < this.scrollLockUntil) return
      if (this.lastSyncT && now - this.lastSyncT < 60) return
      this.lastSyncT = now
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
      // 点击立即高亮；右侧随后定位滚动，到位前锁定“随滚动联动”，避免途中被其它分类抢先高亮
      this.pendingTap = id
      this.scrollLockUntil = Date.now() + 600
      this.syncActive(id)
      this.setData({ intoSection: '' })
      wx.nextTick(() => this.setData({ intoSection: 'sec-' + id }))
      this.watchTapArrival()
    },

    // 兜底轮询右侧滚动位置：到达目标分类（或已滚到底）后再同步左侧高亮
    watchTapArrival() {
      clearTimeout(this.tapTimer)
      this.tapTimer = setTimeout(() => {
        if (!this.pendingTap) return
        this.tapPollCount = (this.tapPollCount || 0) + 1
        // 目标区块在列表末尾无法滚到顶部对齐时，最多轮询 1.6s 后强制解除同步锁
        if (this.tapPollCount > 8) {
          const id = this.pendingTap
          this.pendingTap = ''
          this.tapPollCount = 0
          this.syncActive(id)
          return
        }
        const q = wx.createSelectorQuery().in(this)
        q.select('.dish-side').scrollOffset()
        q.exec(res => {
          if (!res || !res[0] || !this.pendingTap) return
          const scrollTop = res[0].scrollTop || 0
          const tops = this.sectionTops || []
          let arrived = false
          for (let i = 0; i < tops.length; i++) {
            if (tops[i].id === this.pendingTap) {
              arrived = Math.abs(scrollTop - tops[i].top) <= 4
              break
            }
          }
          if (arrived) {
            // 到位后仅解除同步锁（高亮在点击时已完成）
            this.pendingTap = ''
            this.tapPollCount = 0
          } else {
            this.watchTapArrival()
          }
        })
      }, 200)
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
      nav.goTab(2)
    },

    onCheckout() {
      nav.goTab(2)
    }
  }
})
