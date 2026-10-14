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
      this.triggerEvent('change', e.detail)
    },
    onImageError() {
      this.setData({ 'dish.image_url': store.placeholder() })
    }
  }
})
