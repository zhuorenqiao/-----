// 数量步进器：value 为 0 时只显示“加入”圆钮，大于 0 时显示 减-数量-加
Component({
  properties: {
    value: { type: Number, value: 0 },
    dishId: { type: String, value: '' },
    compact: { type: Boolean, value: false }
  },
  methods: {
    onMinus() {
      const next = this.data.value - 1
      this.triggerEvent('change', { dishId: this.data.dishId, value: next })
    },
    onPlus(e) {
      const next = this.data.value + 1
      // 附加触点坐标（视口坐标），供页面做抛物线飞入购物车动画
      const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]) || {}
      this.triggerEvent('change', {
        dishId: this.data.dishId,
        value: next,
        x: typeof touch.clientX === 'number' ? touch.clientX : null,
        y: typeof touch.clientY === 'number' ? touch.clientY : null
      })
    }
  }
})
