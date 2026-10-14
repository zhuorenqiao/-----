// 格式化工具
function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

// 金额：38 -> "38.00"
function money(v) {
  const n = Number(v)
  if (isNaN(n)) return '0.00'
  return n.toFixed(2)
}

// 带符号金额：38 -> "¥38.00"
function yuan(v) {
  return '¥' + money(v)
}

// 时间戳 -> "2026-10-14 09:30"
function dateTime(ts) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

// 时间戳 -> "10-14 09:30"
function shortTime(ts) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

// 订单展示号：20261014-0023
function orderNo(id, ts) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return String(id)
  const compact = '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())
  const tail = String(id).slice(-4)
  return compact + '-' + tail
}

module.exports = {
  money,
  yuan,
  dateTime,
  shortTime,
  orderNo
}
