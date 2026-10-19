// 空状态
Component({
  properties: {
    text: { type: String, value: '这里还空空如也' },
    actionText: { type: String, value: '' },
    icon: { type: String, value: '/assets/icons/empty.png' }
  },
  methods: {
    onAction() {
      this.triggerEvent('action')
    }
  }
})
