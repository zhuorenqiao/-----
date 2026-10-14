# -*- coding: utf-8 -*-
"""把 .tmp-gen 中生成的菜品图压缩为小程序包内种子图片 assets/seed/dishes/<key>.jpg"""
import os
import glob
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'assets', 'seed', 'dishes')
os.makedirs(OUT, exist_ok=True)

DISHES = [
    ('hongshaorou', '红烧肉'),
    ('xiaochaorou', '农家小炒肉'),
    ('tangculiji', '糖醋里脊'),
    ('meicaikourou', '梅菜扣肉'),
    ('xilanhua', '蒜蓉西兰花'),
    ('disansan', '地三鲜'),
    ('tudousi', '酸辣土豆丝'),
    ('fanqiedantang', '番茄鸡蛋汤'),
    ('yumipaigutang', '玉米排骨汤'),
    ('xianggujitang', '香菇鸡汤'),
    ('mifan', '一碗白米饭'),
    ('danchaofan', '蛋炒饭'),
    ('congyoubanmian', '葱油拌面'),
    ('xiguazhi', '鲜榨西瓜汁'),
    ('hongshayuanzi', '红豆沙小圆子'),
    ('yumizhi', '鲜榨玉米汁'),
]

SIZE = 480
QUALITY = 62
total = 0
missing = []

for key, kw in DISHES:
    matches = [p for p in glob.glob(os.path.join(HERE, '*.png')) if kw in os.path.basename(p)]
    if len(matches) != 1:
        missing.append((key, kw, len(matches)))
        continue
    im = Image.open(matches[0]).convert('RGB')
    w, h = im.size
    # 先裁掉右下角 AI 生成水印（左侧/上侧留少量余量保持构图）
    im = im.crop((int(w * 0.02), int(h * 0.02), int(w * 0.90), int(h * 0.94)))
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    im = im.crop((left, top, left + side, top + side)).resize((SIZE, SIZE), Image.LANCZOS)
    out = os.path.join(OUT, key + '.jpg')
    im.save(out, 'JPEG', quality=QUALITY, optimize=True)
    size = os.path.getsize(out)
    total += size
    print('%-16s %4d KB' % (key, size // 1024))

print('----')
print('total: %d KB' % (total // 1024))
if missing:
    print('MISSING:', missing)
else:
    print('all %d dish images ok' % len(DISHES))
