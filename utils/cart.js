// 购物车（本地存储，按用户隔离）
const KEY_CART = 'jcc.cart.'
const KEY_REMARK = 'jcc.remark'
const TAB_CART_INDEX = 2

function uid() {
  const app = getApp()
  return app.globalData.session ? app.globalData.session.id : 'guest'
}

function getCart() {
  return wx.getStorageSync(KEY_CART + uid()) || []
}

function setCart(list) {
  wx.setStorageSync(KEY_CART + uid(), list)
  refreshBadge()
  const app = getApp()
  app.globalData.cartVersion = (app.globalData.cartVersion || 0) + 1
}

function findItem(dishId) {
  const list = getCart()
  return {
    list,
    index: list.findIndex(x => String(x.id) === String(dishId))
  }
}

// 加入购物车（累加数量）
function add(dish, n) {
  const num = n || 1
  const found = findItem(dish.id)
  const list = found.list
  if (found.index >= 0) {
    list[found.index].quantity += num
  } else {
    list.push({
      id: dish.id,
      name: dish.name,
      price: Number(dish.price) || 0,
      image: dish.image || '',
      quantity: num
    })
  }
  setCart(list)
}

// 设置数量，<=0 移除
function setQuantity(dishId, qty) {
  const found = findItem(dishId)
  const list = found.list
  if (found.index < 0) return
  if (qty <= 0) {
    list.splice(found.index, 1)
  } else {
    list[found.index].quantity = qty
  }
  setCart(list)
}

function remove(dishId) {
  const found = findItem(dishId)
  if (found.index < 0) return
  found.list.splice(found.index, 1)
  setCart(found.list)
}

function clear() {
  setCart([])
}

function count() {
  return getCart().reduce((sum, x) => sum + x.quantity, 0)
}

function total() {
  return getCart().reduce((sum, x) => sum + x.price * x.quantity, 0)
}

function getRemark() {
  return wx.getStorageSync(KEY_REMARK + uid()) || ''
}

function setRemark(text) {
  wx.setStorageSync(KEY_REMARK + uid(), text || '')
}

// 刷新购物车 tab 角标（原生 tabBar + 自定义 tabBar 双通道）
function refreshBadge() {
  try {
    const c = count()
    if (c > 0) {
      wx.setTabBarBadge({ index: TAB_CART_INDEX, text: c > 99 ? '99+' : String(c) })
    } else {
      wx.removeTabBarBadge({ index: TAB_CART_INDEX })
    }
  } catch (e) {
    // 非 tabBar 页面或未编译环境忽略
  }
  // 自定义 tabBar：同步到页面栈中所有 tab-bar 实例
  try {
    const text = count() > 99 ? '99+' : String(count())
    getCurrentPages().forEach(p => {
      const tb = typeof p.getTabBar === 'function' && p.getTabBar()
      if (tb && tb.data.cartCount !== text) tb.setData({ cartCount: text })
    })
  } catch (e) { /* ignore */ }
}

module.exports = {
  getCart,
  add,
  setQuantity,
  remove,
  clear,
  count,
  total,
  getRemark,
  setRemark,
  refreshBadge
}
