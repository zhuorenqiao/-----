// 已选菜品弹层：点购物袋从底部升起，可增减数量 / 清空
const cart = require('../../utils/cart')
const store = require('../../utils/store')

Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    show: { type: Boolean, value: false },
    // 面板底边距屏幕底部的高度（rpx），需与宿主页底部栏高度一致
    bottom: { type: Number, value: 224 }
  },
  data: {
    items: []
  },
  observers: {
    show(v) {
      if (v) this.loadItems()
    }
  },
  methods: {
    // 先用本地购物车快照即时渲染，再异步补最新价格与图片
    loadItems() {
      const list = cart.getCart()
      if (!list.length) {
        this.setData({ items: [] })
        return
      }
      this.setData({ items: list.map(x => ({
        id: x.id,
        name: x.name,
        price: Number(x.price) || 0,
        image_url: x.image && x.image.charAt(0) === '/' ? x.image : store.placeholder(),
        quantity: x.quantity
      })) })
      this.syncItems()
    },

    async syncItems() {
      const r = await store.getDishes()
      if (!r.ok) return
      const map = {}
      r.data.forEach(d => { map[String(d.id)] = d })
      const items = cart.getCart().map(x => {
        const d = map[String(x.id)]
        return {
          id: x.id,
          name: d ? d.name : x.name,
          price: d ? Number(d.price) : Number(x.price),
          image: d ? d.image : x.image,
          image_url: '',
          quantity: x.quantity
        }
      })
      await store.resolveImages(items)
      this.setData({ items: items })
    },

    onQtyChange(e) {
      const detail = e.detail || {}
      if (!detail.dishId) return
      if (detail.value <= 0) {
        cart.remove(detail.dishId)
      } else {
        cart.setQuantity(detail.dishId, detail.value)
      }
      this.loadItems()
      this.triggerEvent('change', { count: cart.count(), total: cart.total() })
      if (!cart.getCart().length) this.triggerEvent('close')
    },

    onClearTap() {
      if (!cart.getCart().length) return
      wx.showModal({
        title: '提示',
        content: '确定要清空已选菜品吗？',
        confirmColor: '#E8590C',
        success: res => {
          if (!res.confirm) return
          cart.clear()
          this.setData({ items: [] })
          this.triggerEvent('change', { count: 0, total: 0 })
          this.triggerEvent('close')
        }
      })
    },

    onMaskTap() {
      this.triggerEvent('close')
    },

    noop() {}
  }
})
