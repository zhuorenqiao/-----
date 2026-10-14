// 空状态
Component({
  properties: {
    text: { type: String, value: '这里还空空如也' },
    actionText: { type: String, value: '' }
  },
  methods: {
    onAction() {
      this.triggerEvent('action')
    }
  }
})
