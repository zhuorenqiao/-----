// 细线圆头图标生成器：输出 PNG（RGBA，抗锯齿）
// 用法: node scripts/gen-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SS = 4; // 超采样倍数

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- 几何 ----------
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const gx = x1 + t * dx - px, gy = y1 + t * dy - py;
  return Math.hypot(gx, gy);
}
function pt(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// 渲染一批图元到 size×size 的 PNG
function render(size, color, prims) {
  const W = size * SS;
  const cov = new Float32Array(W * W);
  const [R, G, B] = color;
  for (const p of prims) {
    const w = p.w || 5;
    if (p.line) {
      const [x1, y1, x2, y2] = p.line;
      for (let y = 0; y < W; y++) {
        const py = (y + 0.5) / SS;
        for (let x = 0; x < W; x++) {
          const px = (x + 0.5) / SS;
          if (segDist(px, py, x1, y1, x2, y2) <= w / 2) cov[y * W + x] = 1;
        }
      }
    } else if (p.circle) {
      const [cx, cy, r] = p.circle;
      for (let y = 0; y < W; y++) {
        const py = (y + 0.5) / SS;
        for (let x = 0; x < W; x++) {
          const px = (x + 0.5) / SS;
          if (Math.abs(Math.hypot(px - cx, py - cy) - r) <= w / 2) cov[y * W + x] = 1;
        }
      }
    } else if (p.dot) {
      const [cx, cy, r] = p.dot;
      for (let y = 0; y < W; y++) {
        const py = (y + 0.5) / SS;
        for (let x = 0; x < W; x++) {
          const px = (x + 0.5) / SS;
          if (Math.hypot(px - cx, py - cy) <= r) cov[y * W + x] = 1;
        }
      }
    } else if (p.arc) {
      const [cx, cy, r, a0, a1] = p.arc;
      const steps = Math.max(24, Math.ceil((r * Math.abs(a1 - a0)) / 4));
      const pts = [];
      for (let i = 0; i <= steps; i++) pts.push(pt(cx, cy, r, a0 + ((a1 - a0) * i) / steps));
      for (let y = 0; y < W; y++) {
        const py = (y + 0.5) / SS;
        for (let x = 0; x < W; x++) {
          const px = (x + 0.5) / SS;
          let d = Infinity;
          for (let i = 0; i < steps; i++)
            d = Math.min(d, segDist(px, py, ...pts[i], ...pts[i + 1]));
          if (d <= w / 2) cov[y * W + x] = 1;
        }
      }
    }
  }
  // 降采样
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let acc = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) acc += cov[(y * SS + sy) * W + (x * SS + sx)];
      const a = Math.round((acc / (SS * SS)) * 255);
      const o = (y * size + x) * 4;
      rgba[o] = R; rgba[o + 1] = G; rgba[o + 2] = B; rgba[o + 3] = a;
    }
  }
  return encodePNG(size, size, rgba);
}

// ---------- 图标定义（81×81 视窗，线宽 5）----------
const W5 = 5;
const home = [
  { line: [12, 41, 40.5, 19], w: W5 }, { line: [40.5, 19, 69, 41], w: W5 }, // 屋顶
  { line: [17, 37, 17, 63], w: W5 }, { line: [64, 37, 64, 63], w: W5 },     // 墙
  { line: [17, 63, 64, 63], w: W5 },                                        // 地面
  { line: [34, 63, 34, 52], w: W5 }, { line: [47, 63, 47, 52], w: W5 },     // 门
  { arc: [40.5, 52, 6.5, 180, 360], w: W5 },
];
const menu = [ // 碗 + 筷子
  { arc: [40.5, 40, 21, 0, 180], w: W5 },
  { line: [19.5, 40, 61.5, 40], w: W5 },
  { line: [33, 67, 48, 67], w: W5 },
  { line: [47, 11, 59, 33], w: W5 }, { line: [55, 9, 65, 30], w: W5 },
];
function cartDefs(s) { // 购物车（可缩放）
  const L = (x1, y1, x2, y2) => ({ line: [x1 * s, y1 * s, x2 * s, y2 * s], w: W5 * s });
  const C = (cx, cy, r) => ({ circle: [cx * s, cy * s, r * s], w: W5 * s });
  return [
    L(13, 21, 21, 21), L(21, 21, 26, 29),
    L(26, 29, 61, 29), L(61, 29, 56, 50), L(56, 50, 31, 50), L(31, 50, 26, 29),
    C(33, 60, 3.2), C(52, 60, 3.2),
  ];
}
function bagDefs(s) { // 购物袋（可缩放）
  const L = (x1, y1, x2, y2) => ({ line: [x1 * s, y1 * s, x2 * s, y2 * s], w: W5 * s });
  const A = (cx, cy, r, a0, a1) => ({ arc: [cx * s, cy * s, r * s, a0, a1], w: W5 * s });
  return [
    L(19, 30, 19, 58), L(62, 30, 62, 58),      // 袋身左右侧线
    L(19, 30, 62, 30),                          // 袋口
    A(24, 58, 5, 90, 180), A(57, 58, 5, 0, 90), // 底部圆角
    L(24, 63, 57, 63),                          // 袋底
    A(40.5, 30, 10, 180, 360),                  // 提手
  ];
}
const orders = [ // 小票
  { line: [28, 16, 53, 16], w: W5 }, { arc: [28, 20, 4, 180, 270], w: W5 },
  { line: [57, 20, 57, 61], w: W5 }, { arc: [53, 20, 4, 270, 360], w: W5 },
  { line: [53, 65, 28, 65], w: W5 }, { arc: [53, 61, 4, 0, 90], w: W5 },
  { line: [24, 61, 24, 20], w: W5 }, { arc: [28, 61, 4, 90, 180], w: W5 },
  { line: [31, 30, 50, 30], w: 4 }, { line: [31, 40, 50, 40], w: 4 },
  { line: [31, 50, 43, 50], w: 4 },
];
const profile = [ // 人像
  { circle: [40.5, 29, 10], w: W5 },
  { arc: [40.5, 63, 18, 180, 360], w: W5 },
];
const plus = [
  { line: [48, 26, 48, 70], w: 11 }, { line: [26, 48, 70, 48], w: 11 },
];
const minus = [{ line: [26, 48, 70, 48], w: 11 }];

// 铅笔（笔尖朝左下 45°，居中，可缩放）
function editDefs(s) {
  const L = (x1, y1, x2, y2, w) => ({ line: [x1 * s, y1 * s, x2 * s, y2 * s], w: w * s });
  // 81 视窗内：笔尖 (23.5,57.5) 到 笔尾 (57.5,23.5)，笔身半宽 7，全长 48
  const HW = 7, P = Math.SQRT1_2;
  const T = [23.5, 57.5], E = [57.5, 23.5];
  const o = HW * P; // 半宽在坐标轴上的投影
  const e1a = [T[0] - o, T[1] - o], e2a = [T[0] + o, T[1] + o];
  const e1b = [E[0] - o, E[1] - o], e2b = [E[0] + o, E[1] + o];
  const sep = [T[0] + 12 * P, T[1] - 12 * P];  // 笔尖分隔线中点
  const band = [T[0] + 40 * P, T[1] - 40 * P]; // 笔尾橡皮分隔线中点
  return [
    L(e1a[0], e1a[1], e1b[0], e1b[1], 5),    // 笔身上侧线
    L(e2a[0], e2a[1], e2b[0], e2b[1], 5),    // 笔身下侧线
    L(e1a[0], e1a[1], T[0], T[1], 5),        // 笔尖左斜边
    L(e2a[0], e2a[1], T[0], T[1], 5),        // 笔尖右斜边
    L(e1b[0], e1b[1], e2b[0], e2b[1], 5),    // 笔尾端线
    L(sep[0] - o, sep[1] - o, sep[0] + o, sep[1] + o, 4.5),  // 笔尖分隔
    L(band[0] - o, band[1] - o, band[0] + o, band[1] + o, 4.5), // 橡皮分隔
  ];
}
// 垃圾桶
const trash = [
  { line: [24, 26, 57, 26], w: 5.5 },
  { line: [37, 21, 44, 21], w: 5 },
  { line: [37, 21, 37, 26], w: 5 }, { line: [44, 21, 44, 26], w: 5 },
  { line: [28, 32, 53, 32], w: 5 },
  { line: [28, 32, 31, 62], w: 5 }, { line: [53, 32, 50, 62], w: 5 },
  { line: [31, 62, 50, 62], w: 5 },
  { line: [37, 38, 38, 56], w: 4 }, { line: [44, 38, 43, 56], w: 4 },
];

// ---------- 输出 ----------
const GRAY = [0xb9, 0xb1, 0xa4];   // 未选中
const VERMILION = [0xb4, 0x53, 0x1f]; // 选中（朱赭）
const NEUTRAL = [0x77, 0x72, 0x6a];   // 步进器图标（会被 CSS 滤镜重着色）

const outDir = path.join(__dirname, '..', 'assets', 'icons');
const jobs = [
  ['tab-home.png', 81, GRAY, home], ['tab-home-active.png', 81, VERMILION, home],
  ['tab-menu.png', 81, GRAY, menu], ['tab-menu-active.png', 81, VERMILION, menu],
  ['tab-cart.png', 81, GRAY, cartDefs(1)], ['tab-cart-active.png', 81, VERMILION, cartDefs(1)],
  ['tab-orders.png', 81, GRAY, orders], ['tab-orders-active.png', 81, VERMILION, orders],
  ['tab-profile.png', 81, GRAY, profile], ['tab-profile-active.png', 81, VERMILION, profile],
  ['plus.png', 96, NEUTRAL, plus],
  ['minus.png', 96, NEUTRAL, minus],
  ['cart-small.png', 96, NEUTRAL, cartDefs(96 / 81)],
  ['bag-small.png', 96, NEUTRAL, bagDefs(96 / 81)],
  ['empty-cart.png', 192, [0xc9, 0xbf, 0xb1], cartDefs(192 / 81)], // 购物车空状态占位图
  ['edit.png', 96, NEUTRAL, editDefs(96 / 81)],
  ['trash.png', 96, [0xc0, 0x43, 0x2f], trash],
];
for (const [name, size, color, prims] of jobs) {
  fs.writeFileSync(path.join(outDir, name), render(size, color, prims));
  console.log('written', name);
}
