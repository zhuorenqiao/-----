// 菜品管理页：菜品上下架 / 编辑 / 删除 / 分类管理 / 云端示例菜单初始化
const auth = require('../../utils/auth')
const store = require('../../utils/store')

Page({
  data: {
    seg: 'dish',
    categories: [],
    dishes: [],
    catNameMap: {},
    stats: { total: 0, on: 0, off: 0, cats: 0 },
    cloudMode: false,
    hasSeedImages: false,
    dishCount: 0
  },

  onShow() {
    if (!auth.requireLogin()) return
    this.loadData()
  },

  async loadData() {
    const cats = await store.getCategories()
    const dishes = await store.getDishes()
    if (!cats.ok) {
      wx.showToast({ title: cats.error, icon: 'none' })
      return
    }
    if (!dishes.ok) {
      wx.showToast({ title: dishes.error, icon: 'none' })
      return
    }
    const list = await store.resolveImages(dishes.data)
    const nameMap = {}
    cats.data.forEach(c => { nameMap[String(c.id)] = c.name })
    const on = list.filter(d => d.status === 'on').length
    this.setData({
      categories: cats.data,
      dishes: list,
      catNameMap: nameMap,
      dishCount: list.length,
      stats: {
        total: list.length,
        on: on,
        off: list.length - on,
        cats: cats.data.length
      },
      cloudMode: store.isCloud(),
      hasSeedImages: list.some(d => d.image && d.image.charAt(0) === '/')
    })
  },

  onSegChange(e) {
    this.setData({ seg: e.currentTarget.dataset.seg })
  },

  onAddDish() {
    if (!this.data.categories.length) {
      wx.showToast({ title: '请先添加分类', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/dish-edit/dish-edit' })
  },

  onEditDish(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/dish-edit/dish-edit?id=' + id })
  },

  async onToggleStatus(e) {
    const id = e.currentTarget.dataset.id
    const on = e.detail.value
    const dish = this.data.dishes.find(d => String(d.id) === String(id))
    if (!dish) return
    const r = await store.saveDish({
      id: dish.id,
      category_id: dish.category_id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      image: dish.image,
      featured: dish.featured,
      status: on ? 'on' : 'off',
      sort: dish.sort
    })
    if (!r.ok) {
      wx.showToast({ title: r.error, icon: 'none' })
      // 回滚开关显示
      this.loadData()
      return
    }
    this.loadData()
  },

  onDeleteDish(e) {
    const id = e.currentTarget.dataset.id
    const that = this
    wx.showModal({
      title: '删除菜品',
      content: '删除后不可恢复，确定删除该菜品吗？',
      confirmColor: '#E8590C',
      success: async res => {
        if (!res.confirm) return
        const r = await store.removeDish(id)
        if (!r.ok) {
          wx.showToast({ title: r.error, icon: 'none' })
          return
        }
        wx.showToast({ title: '已删除', icon: 'success' })
        that.loadData()
      }
    })
  },

  // ---------- 分类管理 ----------
  onAddCategory() {
    const that = this
    wx.showModal({
      title: '新增分类',
      placeholderText: '请输入分类名称',
      editable: true,
      confirmColor: '#E8590C',
      success: async res => {
        if (!res.confirm) return
        const name = (res.content || '').trim()
        if (!name) {
          wx.showToast({ title: '请输入分类名称', icon: 'none' })
          return
        }
        const r = await store.saveCategory({ name: name })
        if (!r.ok) {
          wx.showToast({ title: r.error, icon: 'none' })
          return
        }
        wx.showToast({ title: '已添加', icon: 'success' })
        that.loadData()
      }
    })
  },

  onEditCategory(e) {
    const id = e.currentTarget.dataset.id
    const cat = this.data.categories.find(c => String(c.id) === String(id))
    if (!cat) return
    const that = this
    wx.showModal({
      title: '重命名分类',
      placeholderText: '请输入分类名称',
      editable: true,
      content: cat.name,
      confirmColor: '#E8590C',
      success: async res => {
        if (!res.confirm) return
        const name = (res.content || '').trim()
        if (!name) {
          wx.showToast({ title: '请输入分类名称', icon: 'none' })
          return
        }
        const r = await store.saveCategory({ id: cat.id, name: name })
        if (!r.ok) {
          wx.showToast({ title: r.error, icon: 'none' })
          return
        }
        wx.showToast({ title: '已保存', icon: 'success' })
        that.loadData()
      }
    })
  },

  onDeleteCategory(e) {
    const id = e.currentTarget.dataset.id
    const that = this
    wx.showModal({
      title: '删除分类',
      content: '删除后该分类下的菜品需要先处理，确定删除吗？',
      confirmColor: '#E8590C',
      success: async res => {
        if (!res.confirm) return
        const r = await store.removeCategory(id)
        if (!r.ok) {
          wx.showToast({ title: r.error, icon: 'none' })
          return
        }
        wx.showToast({ title: '已删除', icon: 'success' })
        that.loadData()
      }
    })
  },

  // ---------- 云端模式：示例菜单 ----------
  onInitMenu() {
    const that = this
    wx.showModal({
      title: '初始化示例菜单',
      content: '将写入 5 个分类和 34 道示例菜品（含图片上传到云端存储），大约需要一两分钟。',
      confirmColor: '#E8590C',
      success: async res => {
        if (!res.confirm) return
        wx.showLoading({ title: '初始化中', mask: true })
        const r = await store.bootstrapMenu((done, total) => {
          wx.showLoading({ title: '初始化中 ' + done + '/' + total, mask: true })
        })
        wx.hideLoading()
        if (!r.ok) {
          wx.showToast({ title: r.error, icon: 'none' })
          return
        }
        wx.showToast({ title: '初始化完成', icon: 'success' })
        that.loadData()
      }
    })
  },

  onUploadSeedImages() {
    const that = this
    wx.showModal({
      title: '上传示例图片',
      content: '将把包内示例菜品图上传到云端存储，上传后才能在所有登录用户的手机上显示。',
      confirmColor: '#E8590C',
      success: async res => {
        if (!res.confirm) return
        wx.showLoading({ title: '上传中', mask: true })
        const r = await store.ensureSeedImages((done, total) => {
          wx.showLoading({ title: '上传中 ' + done + '/' + total, mask: true })
        })
        wx.hideLoading()
        if (!r.ok) {
          wx.showToast({ title: r.error, icon: 'none' })
          return
        }
        wx.showToast({ title: '已上传 ' + (r.uploaded || 0) + ' 张', icon: 'success' })
        that.loadData()
      }
    })
  }
})
