// 示例菜单种子数据（家常菜餐厅）
// 示例菜品图有两种来源，由 utils/config.js 的 dishImageBase 决定：
//   - 留空：使用包内资源 assets/seed/dishes/*.jpg（380px，体积小，离线可用）；
//   - 填入远程前缀（如 https://cdn.example.com/dishes）：使用 1000px 高清图，
//     文件名与菜品 img 字段一致，主包因此不需要再打包 1.6 MB 图片。
// 云端模式下图片可直接用远程 URL，无需再上传到云端存储。
// VERSION 变更时会由 store.initData 增量升级：补入新增分类/菜品，并刷新仍是
// 包内示例图的菜品主图（店家自己换过的图不动）。

const config = require('./config.js')

const VERSION = 5

const LOCAL_IMAGE_BASE = '/assets/seed/dishes/'

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
  { id: 'd112', cat: 'c1', name: '葱油鸭翅根', desc: '鸭翅根卤透，淋热葱油，咸香软嫩', price: 28, img: 'congyouyachigen', sales: 156, featured: false, baby: true, sort: 12 },
  { id: 'd113', cat: 'c1', name: '茭白炒肉', desc: '茭白清甜爽脆，肉片滑嫩', price: 26, img: 'jiaobaichaorou', sales: 142, featured: false, baby: true, sort: 13 },
  { id: 'd114', cat: 'c1', name: '蒜香罗氏虾', desc: '罗氏虾配蒜蓉爆炒，鲜甜弹牙', price: 68, img: 'suanxiangluoshixia', sales: 98, featured: false, baby: true, sort: 14 },
  { id: 'd115', cat: 'c1', name: '京酱炒肉', desc: '甜面酱裹肉丝，酱香浓郁，配葱白', price: 30, img: 'jingjiangchaorou', sales: 167, featured: false, baby: true, sort: 15 },
  { id: 'd116', cat: 'c1', name: '莲藕炒肉', desc: '藕片脆嫩，肉片香滑，清甜下饭', price: 26, img: 'lianouchaorou', sales: 134, featured: false, baby: true, sort: 16 },
  { id: 'd117', cat: 'c1', name: '焖烩小酥肉', desc: '小酥肉烩至酥软，汤汁浓香', price: 32, img: 'menhuixiaosurou', sales: 121, featured: false, baby: true, sort: 17 },
  { id: 'd118', cat: 'c1', name: '香酥猪蹄', desc: '猪蹄烧至软糯脱骨，胶质满满', price: 38, img: 'xiangsuzhuti', sales: 108, featured: false, baby: true, sort: 18 },
  { id: 'd119', cat: 'c1', name: '番茄牛腩', desc: '番茄慢炖牛腩，酸甜软烂，汤汁拌饭', price: 46, img: 'fanqieniunan', sales: 186, featured: false, baby: true, sort: 19 },
  { id: 'd120', cat: 'c1', name: '糯米笋炒肉', desc: '糯米笋脆甜，肉粒香嫩', price: 28, img: 'nuomisuncaorou', sales: 117, featured: false, baby: true, sort: 20 },
  { id: 'd121', cat: 'c1', name: '番茄肉片', desc: '番茄炒沙配嫩肉片，酸甜开胃', price: 26, img: 'fanqieroupian', sales: 159, featured: false, baby: true, sort: 21 },
  { id: 'd122', cat: 'c1', name: '全家福', desc: '虾仁、蛋饺、木耳时蔬同烩，鲜香丰富', price: 36, img: 'quanjiafu', sales: 132, featured: false, baby: true, sort: 22 },
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
  { id: 'd215', cat: 'c2', name: '红椒西蓝花', desc: '西蓝花爽脆，红椒提色，清淡少油', price: 18, img: 'hongjiaoxilanhua', sales: 164, featured: false, baby: true, sort: 15 },
  { id: 'd216', cat: 'c2', name: '糖醋茄盒', desc: '茄盒夹肉炸酥，酸甜挂汁', price: 22, img: 'tangcuqiehe', sales: 178, featured: false, baby: true, sort: 16 },
  { id: 'd217', cat: 'c2', name: '肉末甜豆', desc: '甜豆清甜，肉末喷香，颗颗饱满', price: 20, img: 'roumotandou', sales: 193, featured: false, baby: true, sort: 17 },
  { id: 'd218', cat: 'c2', name: '上汤红苋菜', desc: '上汤浸煮苋菜，软嫩清甜', price: 16, img: 'shangtanghongxiancai', sales: 145, featured: false, baby: true, sort: 18 },
  { id: 'd219', cat: 'c2', name: '五香豆腐丝', desc: '豆腐丝五香入味，爽口有嚼劲', price: 18, img: 'wuxiangdoufusi', sales: 137, featured: false, baby: true, sort: 19 },
  { id: 'd220', cat: 'c2', name: '清炒蒲瓜', desc: '蒲瓜清甜多汁，少油清爽', price: 16, img: 'qingchaopugua', sales: 129, featured: false, baby: true, sort: 20 },
  { id: 'd221', cat: 'c2', name: '炝炒茼蒿', desc: '大火炝炒，清香微辣', price: 16, img: 'qiangchaotonghao', sales: 151, featured: false, baby: true, sort: 21 },
  { id: 'd301', cat: 'c3', name: '番茄鸡蛋汤', desc: '酸甜暖胃，简单舒服', price: 14, img: 'fanqiedantang', sales: 305, featured: false, sort: 1 },
  { id: 'd302', cat: 'c3', name: '玉米排骨汤', desc: '文火慢炖，汤鲜肉嫩', price: 42, img: 'yumipaigutang', sales: 156, featured: true, sort: 2 },
  { id: 'd303', cat: 'c3', name: '香菇鸡汤', desc: '香菇提鲜，汤清味醇', price: 38, img: 'xianggujitang', sales: 98, featured: false, sort: 3 },
  { id: 'd304', cat: 'c3', name: '鳕鱼肉片汤', desc: '鳕鱼细嫩无刺，配肉片同煮，汤鲜清甜', price: 32, img: 'xueyuroupingtang', sales: 126, featured: false, baby: true, sort: 4 },
  { id: 'd305', cat: 'c3', name: '莲藕花生排骨汤', desc: '排骨莲藕慢炖，花生软糯，汤清甜', price: 38, img: 'lianouhuashengpaigutang', sales: 172, featured: false, baby: true, sort: 5 },
  { id: 'd306', cat: 'c3', name: '丝瓜鸡蛋汤', desc: '丝瓜清甜，蛋花柔嫩，清淡暖胃', price: 16, img: 'siguajidantang', sales: 205, featured: false, baby: true, sort: 6 },
  { id: 'd307', cat: 'c3', name: '菠菜猪肝汤', desc: '猪肝嫩滑，菠菜清鲜，暖胃补铁', price: 18, img: 'bocazhugantang', sales: 114, featured: false, baby: true, sort: 7 },
  { id: 'd401', cat: 'c4', name: '米饭', desc: '东北大米现蒸，粒粒分明', price: 3, img: 'mifan', sales: 1024, featured: false, sort: 1 },
  { id: 'd402', cat: 'c4', name: '蛋炒饭', desc: '颗粒分明，蛋香浓郁', price: 15, img: 'danchaofan', sales: 458, featured: true, sort: 2 },
  { id: 'd403', cat: 'c4', name: '葱油拌面', desc: '葱香扑鼻，劲道爽滑', price: 14, img: 'congyoubanmian', sales: 176, featured: false, sort: 3 },
  { id: 'd404', cat: 'c4', name: '荞麦大米饭', desc: '荞麦配大米同蒸，粗粮更饱腹', price: 5, img: 'qiaomidamifan', sales: 286, featured: false, baby: true, sort: 4 },
  { id: 'd501', cat: 'c5', name: '鲜榨西瓜汁', desc: '当日鲜榨，清凉解暑', price: 12, img: 'xiguazhi', sales: 289, featured: false, sort: 1 },
  { id: 'd502', cat: 'c5', name: '红豆沙小圆子', desc: '软糯香甜，温热暖心', price: 14, img: 'hongshayuanzi', sales: 143, featured: false, sort: 2 },
  { id: 'd503', cat: 'c5', name: '鲜榨玉米汁', desc: '现榨慢煮，香浓顺滑', price: 12, img: 'yumizhi', sales: 167, featured: false, sort: 3 }
]

function remoteBase() {
  return String(config.dishImageBase || '').replace(/\/+$/, '')
}

// 菜品图地址：优先远程高清图，未配置时回退包内示例图
function dishImage(imgKey) {
  return (remoteBase() || LOCAL_IMAGE_BASE) + imgKey + '.jpg'
}

// 是否使用远程高清图
function useRemoteImages() {
  return !!remoteBase()
}

// 是否是「包内示例图」路径（用于判断菜品主图是否被店家改过）
function isBundledSeedImage(path) {
  return typeof path === 'string' && path.indexOf(LOCAL_IMAGE_BASE) === 0
}

module.exports = {
  VERSION,
  CATEGORIES,
  DISHES,
  dishImage,
  useRemoteImages,
  isBundledSeedImage
}
