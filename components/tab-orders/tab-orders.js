// 订单记录（tab 组件）
const auth = require('../../utils/auth')
const store = require('../../utils/store')
const fmt = require('../../utils/format')
const nav = require('../../utils/nav')

const STATUS_TEXT = {
  pending: '待完成',
  completed: '已完成',
  cancelled: '已取消'
}

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待完成' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' }
]

Component({
  options: { styleIsolation: 'apply-shared' },
  data: {
    tabs: TABS,
    activeTab: 'all',
    orders: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: false
  },
  methods: {
    // 由宿主页（pages/main）在 tab 激活/初始化时调用
    onShow() {
      if (!auth.requireLogin()) return
      this.reload()
    },

    // 宿主页 scroll-view 滚到底部时回调（对应原页面 onReachBottom）
    onReachBottom() {
      if (this.data.hasMore && !this.data.loading) {
        this.loadMore()
      }
    },

    async reload() {
      this.setData({ page: 1, loading: true })
      await this.fetchOrders(true)
      this.setData({ loading: false })
    },

    async loadMore() {
      this.setData({ loading: true })
      await this.fetchOrders(false)
      this.setData({ loading: false })
    },

    async fetchOrders(reset) {
      // 触底加载时取下一页（reset 时回到第 1 页）
      const page = reset ? 1 : this.data.page + 1
      this.setData({ page })
      const r = await store.getOrders({
        status: this.data.activeTab,
        page: page,
        size: this.data.pageSize
      })
      if (!r.ok) {
        wx.showToast({ title: r.error, icon: 'none' })
        return
      }
      const list = await store.resolveItemImages(r.data)
      const withText = list.map(o => ({
        id: o.id,
        items: o.items,
        total_price: o.total_price,
        totalText: fmt.money(o.total_price),
        remark: o.remark,
        status: o.status,
        statusText: STATUS_TEXT[o.status] || o.status,
        created_at: o.created_at,
        timeText: fmt.shortTime(o.created_at),
        orderNoText: fmt.orderNo(o.id, o.created_at),
        dishCount: (o.items || []).reduce((s, x) => s + x.quantity, 0),
        nameText: (o.items || []).map(x => x.name).join('、')
      }))
      const orders = reset ? withText : this.data.orders.concat(withText)
      this.setData({
        orders: orders,
        total: r.total || 0,
        hasMore: orders.length < (r.total || 0)
      })
    },

    onTabTap(e) {
      const key = e.currentTarget.dataset.key
      if (key === this.data.activeTab) return
      this.setData({ activeTab: key })
      this.reload()
    },

    goDetail(e) {
      const id = e.currentTarget.dataset.id
      wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + id })
    },

    goMenu() {
      nav.goTab(1)
    }
  }
})
