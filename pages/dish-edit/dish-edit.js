// 菜品编辑 / 新增页
const store = require('../../utils/store')

Page({
  data: {
    isEdit: false,
    dishId: '',
    categories: [],
    categoryIndex: -1,   // 表单当前选中分类（-1 = 未选择，显示占位文案）
    pickerIndex: 0,      // 弹框打开时滚轮默认定位（始终指向第一个分类）
    form: {
      name: '',
      category_id: '',
      price: '',
      description: '',
      sort: '0',
      featured: false,
      status: 'on',
      image: ''
    },
    imagePreview: '',
    uploading: false,
    saving: false
  },

  onLoad(options) {
    if (options.id) {
      this.dishId = options.id
      this.setData({ isEdit: true })
      wx.setNavigationBarTitle({ title: '编辑菜品' })
    } else {
      wx.setNavigationBarTitle({ title: '新增菜品' })
    }
    this.loadCategories()
  },

  async loadCategories() {
    const cats = await store.getCategories()
    if (!cats.ok) {
      wx.showToast({ title: cats.error, icon: 'none' })
      return
    }
    this.setData({ categories: cats.data })
    if (this.data.isEdit) {
      await this.loadDish()
    }
  },

  async loadDish() {
    const r = await store.getDish(this.dishId)
    if (!r.ok) {
      wx.showToast({ title: r.error, icon: 'none' })
      return
    }
    const list = await store.resolveImages([r.data])
    const d = list[0]
    const idx = this.data.categories.findIndex(c => String(c.id) === String(d.category_id))
    this.setData({
      categoryIndex: idx >= 0 ? idx : 0,
      pickerIndex: idx >= 0 ? idx : 0,
      form: {
        name: d.name,
        category_id: d.category_id,
        price: String(d.price),
        description: d.description || '',
        sort: String(d.sort || 0),
        featured: d.featured,
        status: d.status || 'on',
        image: d.image || ''
      },
      imagePreview: d.image_url || ''
    })
  },

  onCategoryChange(e) {
    const index = Number(e.detail.value)
    const cat = this.data.categories[index]
    this.setData({
      pickerIndex: index,
      categoryIndex: index,
      'form.category_id': cat ? cat.id : ''
    })
  },

  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value })
  },

  onPriceInput(e) {
    this.setData({ 'form.price': e.detail.value })
  },

  onSortInput(e) {
    this.setData({ 'form.sort': e.detail.value })
  },

  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value })
  },

  onFeaturedChange(e) {
    this.setData({ 'form.featured': e.detail.value })
  },

  onStatusChange(e) {
    this.setData({ 'form.status': e.detail.value ? 'on' : 'off' })
  },

  onChooseImage() {
    const that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async res => {
        const temp = res.tempFilePaths[0]
        this.setData({ imagePreview: temp, uploading: true })
        wx.showLoading({ title: '上传中', mask: true })
        const r = await store.uploadImage(temp)
        wx.hideLoading()
        this.setData({ uploading: false })
        if (!r.ok) {
          wx.showToast({ title: r.error, icon: 'none' })
          return
        }
        this.setData({ 'form.image': r.image })
        wx.showToast({ title: '图片已上传', icon: 'success' })
      },
      fail: () => {
        this.setData({ uploading: false })
      }
    })
  },

  async onSave() {
    if (this.data.saving) return
    const form = this.data.form
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }
    if (!form.category_id) {
      wx.showToast({ title: '请选择分类', icon: 'none' })
      return
    }
    if (form.price === '' || isNaN(Number(form.price))) {
      wx.showToast({ title: '请输入正确的价格', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    wx.showLoading({ title: '保存中', mask: true })
    const r = await store.saveDish({
      id: this.data.isEdit ? this.dishId : '',
      category_id: form.category_id,
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price,
      image: form.image,
      featured: form.featured,
      status: form.status,
      sort: form.sort || '0'
    })
    wx.hideLoading()
    this.setData({ saving: false })
    if (!r.ok) {
      wx.showToast({ title: r.error, icon: 'none' })
      return
    }
    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => {
      wx.navigateBack()
    }, 400)
  },

  onDelete() {
    const that = this
    wx.showModal({
      title: '删除菜品',
      content: '删除后不可恢复，确定删除该菜品吗？',
      confirmColor: '#E8590C',
      success: async res => {
        if (!res.confirm) return
        const r = await store.removeDish(that.dishId)
        if (!r.ok) {
          wx.showToast({ title: r.error, icon: 'none' })
          return
        }
        wx.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 400)
      }
    })
  }
})
