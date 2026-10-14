// 云端服务公共配置
// 云服务开通后，将激活返回的 publicConfig 两个字段填入下方即可切换为云端模式：
//   endpoint       - 数据平面地址（小程序为固定网关，必须原样填入）
//   publishableKey - 应用标识（仅标识应用，无独立权限）
// 留空时应用运行在本地模式：菜品 / 订单数据保存在小程序本地存储，图片保存在本地文件。
module.exports = {
  endpoint: '',
  publishableKey: ''
}
