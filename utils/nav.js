// 统一的 tab 切换入口（main 页内直接切 swiper；外部页面返回/重进 main）
function goTab(index) {
  const pages = getCurrentPages()
  const top = pages[pages.length - 1]
  // 仅当 main 就在栈顶（如各 tab 组件内部跳转）时直接切换；
  // 否则（main 在栈中但被详情页覆盖，或不在栈中）记录目标 tab 后返回/重进，
  // 由 main.onShow 消费 pendingTab，避免“切了但人还停在详情页”的问题
  if (top && top.route === 'pages/main/main') {
    top.switchToTab(index)
    return
  }
  const app = getApp()
  app.globalData.pendingTab = index
  if (pages.length > 1) {
    wx.navigateBack()
  } else {
    wx.reLaunch({ url: '/pages/main/main' })
  }
}

module.exports = { goTab }
