// 项目静态校验：结构、JSON、JS 语法、WXML 引用、资源存在性、Emoji 检查
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const NODE = process.execPath

let errors = []
let warnings = []
let checks = 0

function ok(msg) {
  checks += 1
  console.log('  PASS  ' + msg)
}

function fail(msg) {
  errors.push(msg)
  console.log('  FAIL  ' + msg)
}

function warn(msg) {
  warnings.push(msg)
  console.log('  WARN  ' + msg)
}

function exists(p) {
  return fs.existsSync(path.join(ROOT, p))
}

function readJson(p) {
  const raw = fs.readFileSync(path.join(ROOT, p), 'utf8')
  return JSON.parse(raw)
}

function walk(dir, out) {
  out = out || []
  if (!fs.existsSync(path.join(ROOT, dir))) return out
  fs.readdirSync(path.join(ROOT, dir)).forEach(name => {
    if (name === 'node_modules' || name === 'miniprogram_npm' || name === '.tmp-gen') return
    const rel = path.join(dir, name).replace(/\\/g, '/')
    const stat = fs.statSync(path.join(ROOT, rel))
    if (stat.isDirectory()) walk(rel, out)
    else out.push(rel)
  })
  return out
}

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u

console.log('== 1. app.json 结构与页面注册 ==')
const appJson = readJson('app.json')

if (appJson.lazyCodeLoading === 'requiredComponents') ok('lazyCodeLoading = requiredComponents')
else fail('app.json 缺少 lazyCodeLoading: "requiredComponents"')

const pages = appJson.pages || []
if (!pages.length) fail('app.json 没有注册任何页面')
else ok('注册页面 ' + pages.length + ' 个')

pages.forEach(p => {
  if (exists(p + '.wxml') && exists(p + '.js')) ok('页面文件完整: ' + p)
  else fail('页面缺少 .wxml/.js: ' + p)
})

// tabBar 可缺省：当前架构为单页 main 容器内嵌 tab bar（swiper 切换），不再使用原生 tabBar
const tabPaths = (appJson.tabBar && appJson.tabBar.list || []).map(t => t.pagePath)
if (tabPaths.length === 0) ok('未配置原生 tabBar（使用 main 页内嵌 tab bar）')
else if (tabPaths.length >= 2 && tabPaths.length <= 5) ok('tabBar 条目 ' + tabPaths.length + ' 个')
else fail('tabBar 条目数量应为 2-5，实际 ' + tabPaths.length)
tabPaths.forEach(tp => {
  if (pages.indexOf(tp) >= 0) ok('tabBar 页面已注册: ' + tp)
  else fail('tabBar 页面未注册: ' + tp)
})
;(appJson.tabBar && appJson.tabBar.list || []).forEach(t => {
  ;[t.iconPath, t.selectedIconPath].forEach(icon => {
    if (!icon) { warn('tabBar 未设置图标: ' + t.pagePath); return }
    if (exists(icon)) ok('tabBar 图标存在: ' + icon)
    else fail('tabBar 图标缺失: ' + icon)
  })
})

console.log('== 2. JSON 合法性 ==')
const jsonFiles = walk('.').filter(f => f.endsWith('.json') && f.indexOf('node_modules') < 0)
jsonFiles.forEach(f => {
  try {
    JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'))
    ok('JSON 合法: ' + f)
  } catch (e) {
    fail('JSON 解析失败: ' + f + ' -> ' + e.message)
  }
})

console.log('== 3. JS 语法检查（node --check） ==')
const jsFiles = walk('.').filter(f => f.endsWith('.js') && f.indexOf('node_modules') < 0)
jsFiles.forEach(f => {
  try {
    execFileSync(NODE, ['--check', path.join(ROOT, f)], { stdio: 'pipe' })
    ok('JS 语法正确: ' + f)
  } catch (e) {
    fail('JS 语法错误: ' + f + ' -> ' + String(e.stderr || e.message).split('\n').slice(0, 3).join(' | '))
  }
})

console.log('== 4. usingComponents 引用 ==')
const componentDirs = walk('components').filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''))
const allJson = walk('.').filter(f => f.endsWith('.json') && f.indexOf('node_modules') < 0)
allJson.forEach(f => {
  let cfg
  try { cfg = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')) } catch (e) { return }
  const using = cfg.usingComponents || {}
  Object.keys(using).forEach(key => {
    const ref = using[key]
    if (ref.indexOf('/') === 0) {
      const rel = ref.replace(/^\//, '')
      if (exists(rel + '.js') && exists(rel + '.wxml')) ok('组件引用有效: ' + f + ' -> ' + ref)
      else fail('组件引用无效: ' + f + ' -> ' + ref)
    } else {
      warn('相对路径组件引用（小程序建议绝对路径）: ' + f + ' -> ' + ref)
    }
  })
  if (cfg.component === true) {
    // 组件自身 json
  }
})

console.log('== 5. WXML 引用检查（图片 / wxs / 禁用标签 / 禁用语法） ==')
const wxmlFiles = walk('.').filter(f => f.endsWith('.wxml') && f.indexOf('node_modules') < 0)
wxmlFiles.forEach(f => {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8')
  const srcRe = /src="([^"]+)"/g
  let m
  while ((m = srcRe.exec(content)) !== null) {
    const src = m[1]
    if (src.indexOf('/') === 0) {
      if (exists(src.replace(/^\//, ''))) ok('图片资源存在: ' + f + ' -> ' + src)
      else fail('图片资源缺失: ' + f + ' -> ' + src)
    }
  }
  const wxsRe = /<wxs[^>]*src="([^"]+)"/g
  while ((m = wxsRe.exec(content)) !== null) {
    const wxsSrc = m[1].replace(/^\.\.\//, '').replace(/^\.\//, '')
    const rel = path.relative(ROOT, path.resolve(path.dirname(path.join(ROOT, f)), m[1])).replace(/\\/g, '/')
    if (exists(rel)) ok('wxs 资源存在: ' + f + ' -> ' + m[1])
    else fail('wxs 资源缺失: ' + f + ' -> ' + m[1])
  }
  if (/<div[\s>]/.test(content)) fail('WXML 使用了 HTML 标签 <div>: ' + f)
  if (/<span[\s>]/.test(content)) fail('WXML 使用了 HTML 标签 <span>: ' + f)
  if (/<img[\s>]/.test(content)) fail('WXML 使用了 HTML 标签 <img>: ' + f)
  const exprRe = /\{\{([^}]*)\}\}/g
  while ((m = exprRe.exec(content)) !== null) {
    const expr = m[1]
    if (expr.indexOf('?.') >= 0 || expr.indexOf('??') >= 0) fail('WXML 表达式含不支持的 ' + (expr.indexOf('?.') >= 0 ? '?.' : '??') + ': ' + f + ' -> ' + expr.trim())
    if (/=>/.test(expr)) fail('WXML 表达式含箭头函数: ' + f + ' -> ' + expr.trim())
    // WXML 表达式不允许裸函数调用（wxs 模块调用 fmt.xxx() 除外）
    const fnRe = /(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g
    let fm
    while ((fm = fnRe.exec(expr)) !== null) {
      fail('WXML 表达式含不支持的函数调用 ' + fm[2] + '(): ' + f + ' -> ' + expr.trim())
    }
  }
})

console.log('== 6. 种子菜单与图片完整性 ==')
const seedMenu = fs.readFileSync(path.join(ROOT, 'utils/seed-menu.js'), 'utf8')
const seedConfig = require(path.join(ROOT, 'utils/config.js'))
const remoteBase = String(seedConfig.dishImageBase || '').replace(/\/+$/, '')
const imgRe = /img: '([a-z0-9-]+)'/g
let im
let seedCount = 0
const imgKeys = []
while ((im = imgRe.exec(seedMenu)) !== null) {
  seedCount += 1
  imgKeys.push(im[1])
}
if (remoteBase) {
  // 远程高清图模式：包内不再打包示例图，改为检查待上传的图源目录
  console.log('  菜品图来源：' + remoteBase + '/<key>.jpg（远程高清图）')
  if (fs.existsSync(path.join(ROOT, 'hd-dishes'))) {
    const missing = imgKeys.filter(k => !fs.existsSync(path.join(ROOT, 'hd-dishes', k + '.jpg')))
    if (missing.length === 0) ok('远程高清图源齐全（' + imgKeys.length + ' 张）')
    else fail('远程高清图缺失: ' + missing.join(', '))
  } else {
    warn('hd-dishes/ 已清理，跳过远程图源检查')
  }
  const stillBundled = fs.existsSync(path.join(ROOT, 'assets/seed/dishes'))
  if (!stillBundled) ok('包内示例图已移除，主包已瘦身')
  else warn('assets/seed/dishes 仍存在，会白白占用约 1.6 MB 主包体积')
} else {
  imgKeys.forEach(k => {
    const p = 'assets/seed/dishes/' + k + '.jpg'
    if (exists(p)) ok('种子图片存在: ' + p)
    else fail('种子图片缺失: ' + p)
  })
}
if (seedCount === 57) ok('种子菜品 57 道')
else fail('种子菜品数量异常: ' + seedCount)

console.log('== 7. 云 SDK 依赖 ==')
const sdkPkgPath = 'node_modules/@tencent-ai/workbuddy-cloud-sdk/package.json'
if (exists(sdkPkgPath)) {
  const sdkPkg = readJson(sdkPkgPath)
  if (sdkPkg.miniprogram) ok('云 SDK 已安装（miniprogram 入口: ' + sdkPkg.miniprogram + '）')
  else fail('云 SDK 缺少 miniprogram 入口字段')
  if (exists('node_modules/@tencent-ai/workbuddy-cloud-sdk/lib/miniprogram.cjs')) ok('云 SDK /miniprogram 子路径模块存在')
  else fail('云 SDK /miniprogram 子路径模块缺失')
} else {
  warn('云 SDK 未安装（本地模式不受影响，云端模式需先 npm install）')
}
const pkg = readJson('package.json')
if (pkg.dependencies && pkg.dependencies['@tencent-ai/workbuddy-cloud-sdk']) ok('package.json 声明了云 SDK 依赖')
else fail('package.json 缺少云 SDK 依赖')

console.log('== 8. Emoji 检查 ==')
const textFiles = walk('.').filter(f => /\.(js|json|wxml|wxss)$/.test(f) && f.indexOf('node_modules') < 0)
let emojiFound = 0
textFiles.forEach(f => {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8')
  const lines = content.split('\n')
  lines.forEach((line, i) => {
    if (EMOJI_RE.test(line)) {
      emojiFound += 1
      fail('发现 Emoji: ' + f + ':' + (i + 1) + ' -> ' + line.trim().slice(0, 60))
    }
  })
})
if (!emojiFound) ok('全部源文件无 Emoji')

console.log('== 9. 主包体积守护 ==')
{
  const LIMIT = 2 * 1024 * 1024 // 小程序主包上限 2MB
  const pkgIgnore = (readJson('project.config.json').packOptions || {}).ignore || []
  const ignored = rel => pkgIgnore.some(it =>
    it.type === 'file' ? rel === it.value
      : rel === it.value || rel.indexOf(it.value + '/') === 0)

  let total = 0
  const biggest = []
  const scan = dir => {
    fs.readdirSync(path.join(ROOT, dir)).forEach(name => {
      if (name.charAt(0) === '.') return // 开发者工具默认忽略 . 开头的文件/目录
      const rel = (dir === '' ? name : dir + '/' + name).replace(/\\/g, '/')
      if (ignored(rel)) return
      const stat = fs.statSync(path.join(ROOT, rel))
      if (stat.isDirectory()) scan(rel)
      else {
        total += stat.size
        biggest.push([rel, stat.size])
      }
    })
  }
  scan('')

  const mb = n => (n / 1024 / 1024).toFixed(2) + ' MB'
  console.log('  打包体积（按 project.config.json 的 packOptions 估算）: ' + mb(total))
  if (total < LIMIT) ok('主包体积 ' + mb(total) + ' < 2 MB 上限')
  else fail('主包体积超限: ' + mb(total) + ' >= 2 MB')

  biggest.sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([f, s]) =>
    console.log('    ' + (s / 1024).toFixed(1) + ' KB  ' + f))

  // miniprogram_npm 是「构建 npm」产物，云端模式运行时依赖它，不能被 ignore
  const ignoreValues = pkgIgnore.map(i => i.value)
  if (ignoreValues.indexOf('node_modules') >= 0) ok('node_modules 已排除出打包范围')
  else fail('node_modules 未排除出打包范围（会白白占用约 5.7 MB）')
  if (ignoreValues.indexOf('miniprogram_npm') >= 0)
    fail('miniprogram_npm 被排除出打包范围，云端模式将无法 require 云 SDK')
  else ok('miniprogram_npm 未被排除（保证云端模式可用）')
}

console.log('')
console.log('==================================')
console.log('校验完成：' + checks + ' 项通过，' + errors.length + ' 项失败，' + warnings.length + ' 项警告')
if (errors.length) {
  console.log('')
  console.log('失败项：')
  errors.forEach(e => console.log(' - ' + e))
  process.exit(1)
}
