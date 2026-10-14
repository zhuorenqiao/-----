// 菜品卡片：layout = list（横排，点餐列表）| grid（双列网格，首页推荐）
const store = require('../../utils/store')

Component({
  properties: {
    dish: { type: Object, value: {} },
    quantity: { type: Number, value: 0 },
    layout: { type: String, value: 'list' },
    showDesc: { type: Boolean, value: true }
  },
  methods: {
    noop() {},
    onTap() {
      this.triggerEvent('tap', { dish: this.data.dish })
    },
    onChange(e) {
      const detail = Object.assign({}, e.detail)
      // 带触点坐标的是加购操作，附加商品图供飞入动画展示
      if (detail.x != null && detail.y != null) {
        detail.image = this.data.dish.image_url || store.placeholder()
      }
      this.triggerEvent('change', detail)
    },
    onImageError() {
      this.setData({ 'dish.image_url': store.placeholder() })
    }
  }
})
