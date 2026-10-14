// 抛物线飞入购物车动画：坐标查询与落点定位公共工具
function getWindowInfo() {
  return wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
}

function centerOf(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  }
}

// 页面级节点查询（需在 Page 上下文中调用）
function getRect(selector) {
  return new Promise((resolve) => {
    wx.createSelectorQuery()
      .select(selector)
      .boundingClientRect()
      .exec((res) => resolve((res && res[0]) || null))
  })
}

// 购物车栏尚未渲染时的兜底落点（与 cart-bar 图标位置一致：底部栏 110rpx，距底 112rpx + 安全区）
function fallbackCartTarget() {
  const win = getWindowInfo()
  const rpx = win.windowWidth / 750
  const safeBottom = win.safeArea ? Math.max(0, win.windowHeight - win.safeArea.bottom) : 0
  return {
    left: 24 * rpx,
    top: win.windowHeight - safeBottom - 205 * rpx,
    width: 76 * rpx,
    height: 76 * rpx
  }
}

// 解析落点：优先页面内 cart-bar 图标，其次底部 tabBar 购物车图标，最后兜底坐标
async function resolveCartTarget(page) {
  const bar = page.selectComponent('#cartBar')
  if (bar && typeof bar.getCartIconRect === 'function') {
    const rect = await bar.getCartIconRect()
    if (rect) return rect
  }
  const tabBar = typeof page.getTabBar === 'function' && page.getTabBar()
  if (tabBar && typeof tabBar.getCartIconRect === 'function') {
    const rect = await tabBar.getCartIconRect()
    if (rect) return rect
  }
  return fallbackCartTarget()
}

// 落袋瞬间让目标图标弹跳一下；若小球被 tabBar 等高层浮层遮挡，
// 图标自身的弹跳仍能给出“已入袋”的视觉反馈
function bumpCartIcon(page) {
  const bar = page.selectComponent('#cartBar')
  if (bar && typeof bar.bumpCartIcon === 'function') {
    bar.bumpCartIcon()
    return
  }
  const tabBar = typeof page.getTabBar === 'function' && page.getTabBar()
  if (tabBar && typeof tabBar.bumpCartIcon === 'function') {
    tabBar.bumpCartIcon()
  }
}

module.exports = { centerOf, getRect, fallbackCartTarget, resolveCartTarget, bumpCartIcon }
