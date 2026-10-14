// 数据层：统一的数据访问接口
//   - 本地模式（默认）：数据保存在小程序本地存储，图片保存在本地文件；
//   - 云端模式（utils/config.js 填入 publicConfig 后启用）：
//       * 菜品 / 分类 / 订单 -> 云端数据库（RLS：分类菜品公开读，订单仅本人可见）；
//       * 菜品图片 -> 云端存储 shared 路径（所有登录用户可读），展示时签名。
const cloudMod = require('./cloud.js')
const seed = require('./seed-menu.js')

const K_CATS = 'jcc.categories'
const K_DISHES = 'jcc.dishes'
const K_ORDERS = 'jcc.orders.'
const K_SEEDED = 'jcc.seeded'

function isCloud() {
  return cloudMod.isCloudEnabled()
}

function session() {
  const app = getApp()
  if (app && app.globalData) return app.globalData.session || null
  // App 未就绪时回退到本地存储
  return wx.getStorageSync('jcc.session') || null
}

function placeholder() {
  return '/assets/icons/dish-placeholder.png'
}

function newId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ---------------- 本地存储读写 ----------------
function localCats() {
  return wx.getStorageSync(K_CATS) || []
}
function localSetCats(list) {
  wx.setStorageSync(K_CATS, list)
}
function localDishes() {
  return wx.getStorageSync(K_DISHES) || []
}
function localSetDishes(list) {
  wx.setStorageSync(K_DISHES, list)
}
function localOrders() {
  const s = session()
  return wx.getStorageSync(K_ORDERS + (s ? s.id : 'guest')) || []
}
function localSetOrders(list) {
  const s = session()
  wx.setStorageSync(K_ORDERS + (s ? s.id : 'guest'), list)
}

// ---------------- 云端行 <-> 应用结构 ----------------
function cloudDishToApp(row) {
  return {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price) || 0,
    image: row.image_path || '',
    sales: row.sales || 0,
    featured: !!row.is_featured,
    status: row.status || 'on',
    sort: row.sort || 0
  }
}

function appDishToCloud(dish) {
  return {
    category_id: dish.category_id,
    name: dish.name,
    description: dish.description || '',
    price: Number(dish.price) || 0,
    image_path: dish.image || null,
    is_featured: !!dish.featured,
    status: dish.status || 'on',
    sort: Number(dish.sort) || 0
  }
}

function cloudOrderToApp(row) {
  return {
    id: row.id,
    items: Array.isArray(row.items) ? row.items : [],
    total_price: Number(row.total_price) || 0,
    remark: row.remark || '',
    status: row.status || 'pending',
    created_at: row.created_at,
    user_name: row.owner_name || ''
  }
}

// ---------------- 初始化 ----------------
// 本地模式：首次启动装入示例菜单
async function initData() {
  if (isCloud()) return { ok: true }
  if (wx.getStorageSync(K_SEEDED)) return { ok: true }
  const cats = seed.CATEGORIES.map(c => ({ id: c.id, name: c.name, sort: c.sort }))
  const dishes = seed.DISHES.map(d => ({
    id: d.id,
    category_id: d.cat,
    name: d.name,
    description: d.desc,
    price: d.price,
    image: seed.dishImage(d.img),
    sales: d.sales,
    featured: d.featured,
    status: 'on',
    sort: d.sort,
    created_at: Date.now()
  }))
  localSetCats(cats)
  localSetDishes(dishes)
  wx.setStorageSync(K_SEEDED, '1')
  return { ok: true }
}

// ---------------- 分类 ----------------
async function getCategories() {
  if (isCloud()) {
    const cloud = cloudMod.getCloud()
    const { data, error } = await cloud.database
      .from('dish_categories')
      .select('id, name, sort')
      .order('sort', { ascending: true })
    if (error) return { ok: false, error: error.message || '分类加载失败' }
    return { ok: true, data: data || [] }
  }
  const list = localCats().slice().sort((a, b) => (a.sort || 0) - (b.sort || 0))
  return { ok: true, data: list }
}

async function saveCategory(cat) {
  const name = (cat.name || '').trim()
  if (!name) return { ok: false, error: '请输入分类名称' }
  if (isCloud()) {
    const cloud = cloudMod.getCloud()
    if (cat.id) {
      const { data, error } = await cloud.database
        .from('dish_categories')
        .update({ name: name })
        .eq('id', cat.id)
        .select()
      if (error) return { ok: false, error: error.message || '保存失败' }
      if (!data || !data.length) return { ok: false, error: '分类不存在或无权修改' }
      return { ok: true, data: data[0] }
    }
    const { data, error } = await cloud.database
      .from('dish_categories')
      .insert({ name: name, sort: Number(cat.sort) || 99 })
      .select()
    if (error) return { ok: false, error: error.message || '保存失败' }
    return { ok: true, data: data && data[0] }
  }
  const list = localCats()
  if (cat.id) {
    const idx = list.findIndex(c => String(c.id) === String(cat.id))
    if (idx < 0) return { ok: false, error: '分类不存在' }
    list[idx].name = name
    localSetCats(list)
    return { ok: true, data: list[idx] }
  }
  const item = { id: newId('c'), name: name, sort: Number(cat.sort) || 99 }
  list.push(item)
  localSetCats(list)
  return { ok: true, data: item }
}

async function removeCategory(id) {
  const d = await getDishes()
  if (!d.ok) return d
  const hasDish = d.data.some(x => String(x.category_id) === String(id))
  if (hasDish) return { ok: false, error: '该分类下还有菜品，请先处理后再删除' }
  if (isCloud()) {
    const cloud = cloudMod.getCloud()
    const { data, error } = await cloud.database
      .from('dish_categories')
      .delete()
      .eq('id', id)
      .select()
    if (error) return { ok: false, error: error.message || '删除失败' }
    if (!data || !data.length) return { ok: false, error: '分类不存在或无权删除' }
    return { ok: true }
  }
  localSetCats(localCats().filter(c => String(c.id) !== String(id)))
  return { ok: true }
}

// ---------------- 菜品 ----------------
async function getDishes(filter) {
  filter = filter || {}
  if (isCloud()) {
    const cloud = cloudMod.getCloud()
    let q = cloud.database.from('dishes').select('*')
    if (filter.category_id) q = q.eq('category_id', filter.category_id)
    if (filter.featured) q = q.eq('is_featured', true)
    if (filter.status) q = q.eq('status', filter.status)
    const { data, error } = await q
      .order('sort', { ascending: true })
      .order('id', { ascending: true })
    if (error) return { ok: false, error: error.message || '菜品加载失败' }
    return { ok: true, data: (data || []).map(cloudDishToApp) }
  }
  let list = localDishes()
  if (filter.category_id) list = list.filter(d => String(d.category_id) === String(filter.category_id))
  if (filter.featured) list = list.filter(d => d.featured)
  if (filter.status) list = list.filter(d => d.status === filter.status)
  list = list.slice().sort((a, b) => (a.sort || 0) - (b.sort || 0))
  return { ok: true, data: list }
}

async function getDish(id) {
  if (isCloud()) {
    const cloud = cloudMod.getCloud()
    const { data, error } = await cloud.database
      .from('dishes')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) return { ok: false, error: error.message || '菜品加载失败' }
    if (!data) return { ok: false, error: '菜品不存在或已下架' }
    return { ok: true, data: cloudDishToApp(data) }
  }
  const dish = localDishes().find(d => String(d.id) === String(id))
  if (!dish) return { ok: false, error: '菜品不存在或已下架' }
  return { ok: true, data: dish }
}

async function saveDish(dish) {
  const name = (dish.name || '').trim()
  if (!name) return { ok: false, error: '请输入菜品名称' }
  const price = Number(dish.price)
  if (isNaN(price) || price < 0) return { ok: false, error: '请输入正确的价格' }
  if (!dish.category_id) return { ok: false, error: '请选择菜品分类' }

  if (isCloud()) {
    const cloud = cloudMod.getCloud()
    const payload = appDishToCloud({
      category_id: dish.category_id,
      name: name,
      description: dish.description || '',
      price: price,
      image: dish.image || '',
      featured: !!dish.featured,
      status: dish.status || 'on',
      sort: Number(dish.sort) || 0
    })
    if (dish.id) {
      const { data, error } = await cloud.database
        .from('dishes')
        .update(payload)
        .eq('id', dish.id)
        .select()
      if (error) return { ok: false, error: error.message || '保存失败' }
      if (!data || !data.length) return { ok: false, error: '菜品不存在或无权修改' }
      return { ok: true, data: cloudDishToApp(data[0]) }
    }
    const { data, error } = await cloud.database.from('dishes').insert(payload).select()
    if (error) return { ok: false, error: error.message || '保存失败' }
    return { ok: true, data: data && data[0] ? cloudDishToApp(data[0]) : null }
  }

  const list = localDishes()
  if (dish.id) {
    const idx = list.findIndex(d => String(d.id) === String(dish.id))
    if (idx < 0) return { ok: false, error: '菜品不存在' }
    list[idx] = Object.assign({}, list[idx], {
      category_id: dish.category_id,
      name: name,
      description: dish.description || '',
      price: price,
      image: dish.image || '',
      featured: !!dish.featured,
      status: dish.status || 'on',
      sort: Number(dish.sort) || 0
    })
    localSetDishes(list)
    return { ok: true, data: list[idx] }
  }
  const item = {
    id: newId('d'),
    category_id: dish.category_id,
    name: name,
    description: dish.description || '',
    price: price,
    image: dish.image || '',
    sales: 0,
    featured: !!dish.featured,
    status: dish.status || 'on',
    sort: Number(dish.sort) || 0,
    created_at: Date.now()
  }
  list.push(item)
  localSetDishes(list)
  return { ok: true, data: item }
}

async function removeDish(id) {
  if (isCloud()) {
    const cloud = cloudMod.getCloud()
    const { data, error } = await cloud.database
      .from('dishes')
      .delete()
      .eq('id', id)
      .select()
    if (error) return { ok: false, error: error.message || '删除失败' }
    if (!data || !data.length) return { ok: false, error: '菜品不存在或无权删除' }
    return { ok: true }
  }
  localSetDishes(localDishes().filter(d => String(d.id) !== String(id)))
  return { ok: true }
}

// ---------------- 图片 ----------------
// 为菜品列表附加可直接用于 <image> 的 image_url
async function resolveImages(dishes) {
  const list = dishes || []
  if (!isCloud()) {
    list.forEach(d => { d.image_url = d.image ? d.image : placeholder() })
    return list
  }
  const cloud = cloudMod.getCloud()
  await Promise.all(list.map(async d => {
    d.image_url = placeholder()
    if (!d.image) return
    const first = d.image.charAt(0)
    if (first === '/' || d.image.indexOf('wxfile://') === 0 || d.image.indexOf('http') === 0) {
      d.image_url = d.image
      return
    }
    try {
      const { data, error } = await cloud.storage.createSignedUrl(d.image, 3600)
      if (!error && data) {
        const url = typeof data === 'string' ? data : (data.url || data.signedUrl || data.signed_url)
        if (url) d.image_url = url
      }
    } catch (e) {
      // 签名失败保留占位图
    }
  }))
  return list
}

// 为订单列表中的菜品快照附加 image_url
async function resolveItemImages(orders) {
  const list = orders || []
  if (!isCloud()) {
    list.forEach(o => (o.items || []).forEach(it => {
      it.image_url = it.image ? it.image : placeholder()
    }))
    return list
  }
  const cloud = cloudMod.getCloud()
  await Promise.all(list.map(async o => {
    await Promise.all((o.items || []).map(async it => {
      it.image_url = placeholder()
      if (!it.image) return
      if (it.image.charAt(0) === '/' || it.image.indexOf('wxfile://') === 0 || it.image.indexOf('http') === 0) {
        it.image_url = it.image
        return
      }
      try {
        const { data, error } = await cloud.storage.createSignedUrl(it.image, 3600)
        if (!error && data) {
          const url = typeof data === 'string' ? data : (data.url || data.signedUrl || data.signed_url)
          if (url) it.image_url = url
        }
      } catch (e) {
        // 签名失败保留占位图
      }
    }))
  }))
  return list
}

// 上传图片：本地模式存入本地文件；云端模式上传至 shared/<uid>/dishes/
async function uploadImage(tempFilePath) {
  if (!tempFilePath) return { ok: false, error: '图片文件无效' }
  if (!isCloud()) {
    return new Promise(resolve => {
      wx.saveFile({
        tempFilePath: tempFilePath,
        success: res => resolve({ ok: true, image: res.savedFilePath }),
        fail: err => resolve({ ok: false, error: (err && err.errMsg) || '图片保存失败' })
      })
    })
  }
  const cloud = cloudMod.getCloud()
  const s = session()
  if (!s) return { ok: false, error: '请先登录后再上传图片' }
  try {
    const buffer = wx.getFileSystemManager().readFileSync(tempFilePath)
    const path = cloud.storage.sharedPath(
      s.id,
      'dishes/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg'
    )
    const { error } = await cloud.storage.upload(path, buffer, {
      contentType: 'image/jpeg',
      upsert: false
    })
    if (error) return { ok: false, error: error.message || '图片上传失败' }
    return { ok: true, image: path }
  } catch (e) {
    return { ok: false, error: (e && e.message) || '图片上传失败' }
  }
}

// 云端模式：把仍是包内路径的示例图上传到云端存储并回写记录
async function ensureSeedImages(onProgress) {
  if (!isCloud()) return { ok: true, skipped: true }
  const d = await getDishes()
  if (!d.ok) return d
  const pending = d.data.filter(x => x.image && x.image.charAt(0) === '/')
  let done = 0
  for (const dish of pending) {
    try {
      const buffer = wx.getFileSystemManager().readFileSync(dish.image)
      const cloud = cloudMod.getCloud()
      const s = session()
      const path = cloud.storage.sharedPath(
        s.id,
        'dishes/' + dish.id + '-' + Math.random().toString(36).slice(2, 6) + '.jpg'
      )
      const up = await cloud.storage.upload(path, buffer, { contentType: 'image/jpeg', upsert: false })
      if (!up.error) {
        await cloud.database.from('dishes').update({ image_path: path }).eq('id', dish.id)
      }
    } catch (e) {
      // 单张失败不中断整体流程
    }
    done += 1
    if (onProgress) onProgress(done, pending.length)
  }
  return { ok: true, uploaded: done, total: pending.length }
}

// 云端模式：数据库为空时一键写入示例菜单（分类 + 菜品 + 示例图上传）
async function bootstrapMenu(onProgress) {
  if (!isCloud()) return { ok: false, error: '当前为本地模式，无需初始化' }
  const cloud = cloudMod.getCloud()
  const s = session()
  if (!s) return { ok: false, error: '请先登录' }

  const catCheck = await getCategories()
  if (!catCheck.ok) return catCheck
  const dishCheck = await getDishes()
  if (!dishCheck.ok) return dishCheck
  if (catCheck.data.length > 0 || dishCheck.data.length > 0) {
    return { ok: false, error: '菜单已有数据，无需重复初始化' }
  }

  const catIdMap = {}
  let step = 0
  const totalSteps = seed.CATEGORIES.length + seed.DISHES.length

  for (const c of seed.CATEGORIES) {
    const r = await cloud.database
      .from('dish_categories')
      .insert({ name: c.name, sort: c.sort })
      .select()
    if (!r.error && r.data && r.data[0]) catIdMap[c.id] = r.data[0].id
    step += 1
    if (onProgress) onProgress(step, totalSteps)
  }

  for (const d of seed.DISHES) {
    const categoryId = catIdMap[d.cat]
    let imagePath = null
    try {
      const buffer = wx.getFileSystemManager().readFileSync(seed.dishImage(d.img))
      const path = cloud.storage.sharedPath(
        s.id,
        'dishes/' + d.id + '-' + Math.random().toString(36).slice(2, 6) + '.jpg'
      )
      const up = await cloud.storage.upload(path, buffer, { contentType: 'image/jpeg', upsert: false })
      if (!up.error) imagePath = path
    } catch (e) {
      // 图片上传失败时菜品仍可建立（后续可补图）
    }
    if (categoryId) {
      await cloud.database.from('dishes').insert({
        category_id: categoryId,
        name: d.name,
        description: d.desc,
        price: d.price,
        image_path: imagePath,
        sales: d.sales,
        is_featured: d.featured,
        status: 'on',
        sort: d.sort
      })
    }
    step += 1
    if (onProgress) onProgress(step, totalSteps)
  }
  return { ok: true }
}

// ---------------- 订单 ----------------
async function createOrder(payload) {
  const s = session()
  if (!s) return { ok: false, error: '请先登录' }
  const items = (payload.items || []).map(x => ({
    id: x.id,
    name: x.name,
    price: Number(x.price) || 0,
    image: x.image || '',
    quantity: x.quantity
  }))
  if (!items.length) return { ok: false, error: '订单为空' }
  const total = Number(payload.total_price) || 0
  const remark = (payload.remark || '').trim()
  const now = new Date().toISOString()

  if (isCloud()) {
    const cloud = cloudMod.getCloud()
    const { data, error } = await cloud.database
      .from('orders')
      .insert({
        items: items,
        total_price: total,
        remark: remark,
        owner_name: s.name || null
      })
      .select()
    if (error) return { ok: false, error: error.message || '下单失败，请重试' }
    if (!data || !data.length) return { ok: false, error: '下单失败，请重试' }
    return { ok: true, data: cloudOrderToApp(data[0]) }
  }

  const order = {
    id: newId('o'),
    items: items,
    total_price: total,
    remark: remark,
    status: 'pending',
    created_at: Date.now(),
    user_name: s.name || ''
  }
  const list = localOrders()
  list.unshift(order)
  localSetOrders(list)
  return { ok: true, data: order }
}

async function getOrders(opts) {
  opts = opts || {}
  const page = opts.page || 1
  const size = opts.size || 10
  if (isCloud()) {
    const cloud = cloudMod.getCloud()
    let q = cloud.database.from('orders').select('*', { count: 'exact' })
    if (opts.status && opts.status !== 'all') q = q.eq('status', opts.status)
    const from = (page - 1) * size
    const { data, error, count } = await q
      .order('created_at', { ascending: false })
      .range(from, from + size - 1)
    if (error) return { ok: false, error: error.message || '订单加载失败' }
    return { ok: true, data: (data || []).map(cloudOrderToApp), total: count || 0 }
  }
  let list = localOrders()
  if (opts.status && opts.status !== 'all') list = list.filter(o => o.status === opts.status)
  list = list.slice().sort((a, b) => b.created_at - a.created_at)
  const start = (page - 1) * size
  return { ok: true, data: list.slice(start, start + size), total: list.length }
}

async function getOrder(id) {
  if (isCloud()) {
    const cloud = cloudMod.getCloud()
    const { data, error } = await cloud.database
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) return { ok: false, error: error.message || '订单加载失败' }
    if (!data) return { ok: false, error: '订单不存在' }
    return { ok: true, data: cloudOrderToApp(data) }
  }
  const order = localOrders().find(o => String(o.id) === String(id))
  if (!order) return { ok: false, error: '订单不存在' }
  return { ok: true, data: order }
}

async function updateOrderStatus(id, status) {
  if (isCloud()) {
    const cloud = cloudMod.getCloud()
    const { data, error } = await cloud.database
      .from('orders')
      .update({ status: status })
      .eq('id', id)
      .select()
    if (error) return { ok: false, error: error.message || '更新失败，请重试' }
    if (!data || !data.length) return { ok: false, error: '订单不存在或已更新' }
    return { ok: true }
  }
  const list = localOrders()
  const order = list.find(o => String(o.id) === String(id))
  if (!order) return { ok: false, error: '订单不存在' }
  order.status = status
  localSetOrders(list)
  return { ok: true }
}

module.exports = {
  isCloud,
  session,
  placeholder,
  initData,
  getCategories,
  saveCategory,
  removeCategory,
  getDishes,
  getDish,
  saveDish,
  removeDish,
  resolveImages,
  resolveItemImages,
  uploadImage,
  ensureSeedImages,
  bootstrapMenu,
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus
}
