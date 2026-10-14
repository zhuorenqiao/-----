// 抛物线飞入购物车动画组件：
// 外层线性位移（X 全程 + Y 线性分量）+ 内层对称缓动上抛（近似 -4h·t(1-t) 拱顶），叠加成抛物线轨迹
Component({
  data: {
    show: false,
    x: 0,
    y: 0,
    image: '',
    mid: '',
    inner: ''
  },
  methods: {
    // opts: { startX, startY, targetRect: {left, top, width, height}, image, duration }
    fly(opts) {
      const options = opts || {}
      const targetRect = options.targetRect
      const duration = options.duration || 550
      if (!targetRect || options.startX == null || options.startY == null) return Promise.resolve()
      if (this._flying) return Promise.resolve()
      this._flying = true

      const size = 44
      const ex = targetRect.left + targetRect.width / 2
      const ey = targetRect.top + targetRect.height / 2
      const dx = ex - options.startX
      const dy = ey - options.startY
      const arc = Math.max(80, Math.min(180, Math.abs(dx) * 0.3 + 60))

      this.setData({
        show: true,
        x: options.startX - size / 2,
        y: options.startY - size / 2,
        image: options.image || '',
        mid: 'translate(0, 0) scale(1)',
        inner: 'translateY(0)'
      }, () => {
        // 首帧渲染完成后再切到目标 transform，触发过渡动画
        setTimeout(() => {
          this.setData({
            mid: 'translate(' + dx + 'px, ' + dy + 'px) scale(0.35)',
            inner: 'translateY(' + (-arc) + 'px)'
          })
        }, 30)
      })

      return new Promise((resolve) => {
        setTimeout(() => {
          this._flying = false
          this.setData({ show: false, mid: '', inner: '' })
          resolve()
        }, duration + 80)
      })
    }
  }
})
