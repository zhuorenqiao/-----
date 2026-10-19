// 示例菜单种子数据（家常菜餐厅）
// 图片为包内资源 assets/seed/dishes/*.jpg：
//   - 本地模式：路径直接用于 <image> 展示；
//   - 云端模式：首次进入管理页点击「上传示例图片」后上传至云端存储并回写记录。
// VERSION 变更时会由 store.initData 把新增的分类/菜品增量并入已有本地菜单（不覆盖用户改动）。

const VERSION = 2

const CATEGORIES = [
  { id: 'c1', name: '荤菜热炒', sort: 1 },
  { id: 'c2', name: '素菜时蔬', sort: 2 },
  { id: 'c3', name: '汤羹炖品', sort: 3 },
  { id: 'c4', name: '主食米饭', sort: 4 },
  { id: 'c5', name: '饮品甜点', sort: 5 }
]

const DISHES = [
  { id: 'd101', cat: 'c1', name: '红烧肉', desc: '五花肉慢火红烧，肥而不腻，下饭首选', price: 38, img: 'hongshaorou', sales: 326, featured: true, sort: 1 },
  { id: 'd102', cat: 'c1', name: '农家小炒肉', desc: '青椒与五花肉大火快炒，鲜辣香嫩', price: 32, img: 'xiaochaorou', sales: 512, featured: true, sort: 2 },
  { id: 'd103', cat: 'c1', name: '糖醋里脊', desc: '外酥里嫩，酸甜适口', price: 36, img: 'tangculiji', sales: 268, featured: false, sort: 3 },
  { id: 'd104', cat: 'c1', name: '梅菜扣肉', desc: '梅干菜与肉片同蒸，酱香浓郁', price: 40, img: 'meicaikourou', sales: 189, featured: false, sort: 4 },
  { id: 'd105', cat: 'c1', name: '小炒黄牛肉', desc: '黄牛肉配青红椒爆炒，鲜辣滑嫩，锅气十足', price: 42, img: 'xiaochaohuangniurou', sales: 486, featured: true, sort: 5 },
  { id: 'd106', cat: 'c1', name: '辣椒炒肉', desc: '本地青椒配五花肉，香辣下饭', price: 28, img: 'lajiaochaorou', sales: 623, featured: false, sort: 6 },
  { id: 'd107', cat: 'c1', name: '清蒸鲈鱼', desc: '活鲈鱼现蒸，葱姜提鲜，肉嫩汤清', price: 48, img: 'qingzhengluyu', sales: 214, featured: true, sort: 7 },
  { id: 'd108', cat: 'c1', name: '蒜苗炒回锅肉', desc: '肉片炒至微卷，蒜苗清香解腻', price: 32, img: 'suanmiaohuiguorou', sales: 358, featured: false, sort: 8 },
  { id: 'd109', cat: 'c1', name: '香辣基围虾', desc: '鲜虾干煸，麻辣酥香，越吃越香', price: 58, img: 'xianglajixia', sales: 172, featured: false, sort: 9 },
  { id: 'd110', cat: 'c1', name: '搓菜炒肉', desc: '农家搓菜配肉末，咸香下饭', price: 26, img: 'cuocaichaorou', sales: 268, featured: false, sort: 10 },
  { id: 'd111', cat: 'c1', name: '榨菜肉丝', desc: '榨菜脆爽，肉丝滑嫩，家常下饭', price: 22, img: 'zhacairousi', sales: 195, featured: false, sort: 11 },
  { id: 'd201', cat: 'c2', name: '蒜蓉西兰花', desc: '蒜香清甜，爽脆解腻', price: 18, img: 'xilanhua', sales: 244, featured: false, sort: 1 },
  { id: 'd202', cat: 'c2', name: '地三鲜', desc: '土豆、茄子、青椒，酱香下饭', price: 22, img: 'disansan', sales: 197, featured: false, sort: 2 },
  { id: 'd203', cat: 'c2', name: '酸辣土豆丝', desc: '酸辣开胃，国民下饭菜', price: 16, img: 'tudousi', sales: 231, featured: false, sort: 3 },
  { id: 'd204', cat: 'c2', name: '酸辣藕丁', desc: '藕丁爽脆，酸辣开胃', price: 18, img: 'suanlaouiding', sales: 208, featured: false, sort: 4 },
  { id: 'd205', cat: 'c2', name: '虎皮青椒', desc: '青椒煎出虎皮纹，浇汁微辣回甜', price: 18, img: 'hupiqingjiao', sales: 176, featured: false, sort: 5 },
  { id: 'd206', cat: 'c2', name: '酸豆角肉末', desc: '酸豆角脆爽，肉末喷香，开胃下饭', price: 22, img: 'suandoujiaoroumo', sales: 246, featured: false, sort: 6 },
  { id: 'd207', cat: 'c2', name: '肉末蒸蛋', desc: '蛋羹嫩滑，肉末酱香，老少皆宜', price: 16, img: 'roumozhengdan', sales: 312, featured: false, sort: 7 },
  { id: 'd208', cat: 'c2', name: '韭菜炒鸡蛋', desc: '韭菜翠绿，鸡蛋嫩黄，家常味道', price: 16, img: 'jiucaichaojidan', sales: 289, featured: false, sort: 8 },
  { id: 'd209', cat: 'c2', name: '蒜蓉生菜', desc: '大火快炒，蒜香浓郁，清脆爽口', price: 16, img: 'suanrongshengcai', sales: 254, featured: false, sort: 9 },
  { id: 'd210', cat: 'c2', name: '清炒油麦菜', desc: '少油清炒，留住菜心清甜', price: 16, img: 'qingchaoyoumaicai', sales: 198, featured: false, sort: 10 },
  { id: 'd211', cat: 'c2', name: '红烧冬瓜', desc: '冬瓜烧至入味，酱香软糯不腻', price: 18, img: 'hongshaodonggua', sales: 163, featured: false, sort: 11 },
  { id: 'd212', cat: 'c2', name: '清炒丝瓜', desc: '丝瓜清甜多汁，清淡解腻', price: 18, img: 'qingchaosigua', sales: 147, featured: false, sort: 12 },
  { id: 'd213', cat: 'c2', name: '清炒小白菜', desc: '时令小白菜，蒜香清炒', price: 14, img: 'qingchaoxiaobaicai', sales: 231, featured: false, sort: 13 },
  { id: 'd214', cat: 'c2', name: '干煸四季豆', desc: '四季豆干煸至起皱，干香微辣', price: 20, img: 'ganbiansijidou', sales: 274, featured: false, sort: 14 },
  { id: 'd301', cat: 'c3', name: '番茄鸡蛋汤', desc: '酸甜暖胃，简单舒服', price: 14, img: 'fanqiedantang', sales: 305, featured: false, sort: 1 },
  { id: 'd302', cat: 'c3', name: '玉米排骨汤', desc: '文火慢炖，汤鲜肉嫩', price: 42, img: 'yumipaigutang', sales: 156, featured: true, sort: 2 },
  { id: 'd303', cat: 'c3', name: '香菇鸡汤', desc: '香菇提鲜，汤清味醇', price: 38, img: 'xianggujitang', sales: 98, featured: false, sort: 3 },
  { id: 'd401', cat: 'c4', name: '米饭', desc: '东北大米现蒸，粒粒分明', price: 3, img: 'mifan', sales: 1024, featured: false, sort: 1 },
  { id: 'd402', cat: 'c4', name: '蛋炒饭', desc: '颗粒分明，蛋香浓郁', price: 15, img: 'danchaofan', sales: 458, featured: true, sort: 2 },
  { id: 'd403', cat: 'c4', name: '葱油拌面', desc: '葱香扑鼻，劲道爽滑', price: 14, img: 'congyoubanmian', sales: 176, featured: false, sort: 3 },
  { id: 'd501', cat: 'c5', name: '鲜榨西瓜汁', desc: '当日鲜榨，清凉解暑', price: 12, img: 'xiguazhi', sales: 289, featured: false, sort: 1 },
  { id: 'd502', cat: 'c5', name: '红豆沙小圆子', desc: '软糯香甜，温热暖心', price: 14, img: 'hongshayuanzi', sales: 143, featured: false, sort: 2 },
  { id: 'd503', cat: 'c5', name: '鲜榨玉米汁', desc: '现榨慢煮，香浓顺滑', price: 12, img: 'yumizhi', sales: 167, featured: false, sort: 3 }
]

function dishImage(imgKey) {
  return '/assets/seed/dishes/' + imgKey + '.jpg'
}

module.exports = {
  VERSION,
  CATEGORIES,
  DISHES,
  dishImage
}
