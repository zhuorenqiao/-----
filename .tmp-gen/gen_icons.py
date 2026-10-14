# -*- coding: utf-8 -*-
"""绘制小程序统一风格线性图标：tabBar 5x2、分类 5、动作图标、空状态插画"""
import os
import math
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'icons')
os.makedirs(OUT, exist_ok=True)

S = 4  # 超采样
PRIMARY = (232, 89, 12, 255)
GRAY = (155, 148, 136, 255)
NEUTRAL = (138, 129, 117, 255)
GREEN = (47, 168, 79, 255)
RED = (217, 48, 37, 255)
SOFT = (254, 241, 231, 255)
CREAM = (247, 231, 214, 255)


def P(n, x, y):
    return (n * x, n * y)


def make(final):
    n = final * S
    im = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im), n


def save(im, name, final):
    im = im.resize((final, final), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.png'))


def bez(p0, p1, p2, steps=48):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        pts.append((x, y))
    return pts


# ---------------- tabBar 图标（81px，线性） ----------------
def tab_home(d, n, w, c):
    d.line([P(n, .18, .52), P(n, .5, .2), P(n, .82, .52)], fill=c, width=w, joint='curve')
    d.rounded_rectangle([P(n, .28, .46), P(n, .72, .8)], radius=n * .04, outline=c, width=w)
    d.rounded_rectangle([P(n, .43, .58), P(n, .57, .8)], radius=n * .02, outline=c, width=int(w * .8))


def tab_menu(d, n, w, c):
    d.rounded_rectangle([P(n, .2, .18), P(n, .8, .82)], radius=n * .07, outline=c, width=w)
    for y in (.38, .52, .66):
        d.line([P(n, .34, y), P(n, .66, y)], fill=c, width=int(w * .75))


def tab_cart(d, n, w, c):
    d.line([P(n, .1, .24), P(n, .22, .24)], fill=c, width=w)
    d.line([P(n, .3, .4), P(n, .36, .66), P(n, .72, .66), P(n, .66, .4)], fill=c, width=w, joint='curve')
    d.line([P(n, .3, .4), P(n, .66, .4)], fill=c, width=w)
    for cx in (.4, .64):
        d.ellipse([P(n, cx - .04, .7), P(n, cx + .04, .78)], outline=c, width=int(w * .8))


def tab_orders(d, n, w, c):
    d.rounded_rectangle([P(n, .26, .14), P(n, .74, .86)], radius=n * .05, outline=c, width=w)
    d.line([P(n, .36, .34), P(n, .64, .34)], fill=c, width=int(w * .7))
    d.line([P(n, .36, .48), P(n, .64, .48)], fill=c, width=int(w * .7))
    d.line([P(n, .36, .62), P(n, .5, .62)], fill=c, width=int(w * .7))


def tab_profile(d, n, w, c):
    d.ellipse([P(n, .36, .14), P(n, .64, .42)], outline=c, width=w)
    d.arc([P(n, .22, .5), P(n, .78, .96)], start=180, end=360, fill=c, width=w)


TABS = [('tab-home', tab_home), ('tab-menu', tab_menu), ('tab-cart', tab_cart),
        ('tab-orders', tab_orders), ('tab-profile', tab_profile)]

for name, fn in TABS:
    for suffix, color in (('', GRAY), ('-active', PRIMARY)):
        im, d, n = make(81)
        fn(d, n, 5 * S, color)
        save(im, name + suffix, 81)
print('tabbar icons done')


# ---------------- 分类图标（96px，软底 + 线性主图标） ----------------
def cat_base():
    im, d, n = make(96)
    d.rounded_rectangle([0, 0, n - 1, n - 1], radius=n * .26, fill=SOFT)
    return im, d, n


def cat_meat(d, n, w, c):
    d.ellipse([P(n, .24, .24), P(n, .5, .5)], outline=c, width=w)
    d.line([P(n, .48, .48), P(n, .7, .7)], fill=c, width=w + S)
    d.ellipse([P(n, .66, .66), P(n, .8, .8)], outline=c, width=w)


def cat_veg(d, n, w, c):
    pts = bez(P(n, .22, .5), P(n, .5, .16), P(n, .78, .5))
    pts += bez(P(n, .78, .5), P(n, .5, .84), P(n, .22, .5))[1:]
    d.line(pts, fill=c, width=w, joint='curve')
    d.line([P(n, .34, .58), P(n, .66, .42)], fill=c, width=int(w * .7))


def cat_soup(d, n, w, c):
    d.arc([P(n, .24, .44), P(n, .76, .92)], start=0, end=180, fill=c, width=w)
    d.line([P(n, .24, .44), P(n, .76, .44)], fill=c, width=w)
    d.arc([P(n, .36, .2), P(n, .46, .38)], start=90, end=270, fill=c, width=int(w * .8))
    d.arc([P(n, .54, .14), P(n, .64, .32)], start=90, end=270, fill=c, width=int(w * .8))


def cat_staple(d, n, w, c):
    d.arc([P(n, .26, .5), P(n, .74, .9)], start=0, end=180, fill=c, width=w)
    d.line([P(n, .26, .5), P(n, .74, .5)], fill=c, width=w)
    d.arc([P(n, .34, .32), P(n, .66, .6)], start=180, end=360, fill=c, width=int(w * .9))
    d.line([P(n, .6, .18), P(n, .78, .52)], fill=c, width=w)
    d.line([P(n, .68, .16), P(n, .86, .5)], fill=c, width=w)


def cat_drink(d, n, w, c):
    d.line([P(n, .36, .42), P(n, .42, .78), P(n, .62, .78), P(n, .68, .42)], fill=c, width=w, joint='curve')
    d.line([P(n, .33, .4), P(n, .71, .4)], fill=c, width=w)
    d.line([P(n, .56, .18), P(n, .63, .42)], fill=c, width=w)


CATS = [('cat-meat', cat_meat), ('cat-veg', cat_veg), ('cat-soup', cat_soup),
        ('cat-staple', cat_staple), ('cat-drink', cat_drink)]
for name, fn in CATS:
    im, d, n = cat_base()
    fn(d, n, 5 * S, PRIMARY)
    save(im, name, 96)
print('category icons done')


# ---------------- 动作图标（48px） ----------------
def act(name, fn, color=NEUTRAL):
    im, d, n = make(48)
    fn(d, n, 4 * S, color)
    save(im, name, 48)


def a_plus(d, n, w, c):
    d.ellipse([P(n, .1, .1), P(n, .9, .9)], outline=c, width=w)
    d.line([P(n, .5, .26), P(n, .5, .74)], fill=c, width=w)
    d.line([P(n, .26, .5), P(n, .74, .5)], fill=c, width=w)


def a_minus(d, n, w, c):
    d.ellipse([P(n, .1, .1), P(n, .9, .9)], outline=c, width=w)
    d.line([P(n, .28, .5), P(n, .72, .5)], fill=c, width=w)


def a_close(d, n, w, c):
    d.line([P(n, .28, .28), P(n, .72, .72)], fill=c, width=w)
    d.line([P(n, .72, .28), P(n, .28, .72)], fill=c, width=w)


def a_arrow(d, n, w, c):
    d.line([P(n, .36, .22), P(n, .64, .5), P(n, .36, .78)], fill=c, width=w, joint='curve')


def a_edit(d, n, w, c):
    d.line([P(n, .26, .74), P(n, .68, .3)], fill=c, width=w + S)
    d.line([P(n, .62, .24), P(n, .76, .38)], fill=c, width=w)
    d.line([P(n, .24, .78), P(n, .3, .68)], fill=c, width=w)


def a_trash(d, n, w, c):
    d.line([P(n, .24, .3), P(n, .76, .3)], fill=c, width=w)
    d.line([P(n, .42, .22), P(n, .58, .22)], fill=c, width=w)
    d.line([P(n, .42, .22), P(n, .42, .3)], fill=c, width=int(w * .8))
    d.line([P(n, .58, .22), P(n, .58, .3)], fill=c, width=int(w * .8))
    d.line([P(n, .32, .36), P(n, .36, .78)], fill=c, width=w)
    d.line([P(n, .68, .36), P(n, .64, .78)], fill=c, width=w)
    d.line([P(n, .36, .78), P(n, .64, .78)], fill=c, width=w)
    d.line([P(n, .46, .42), P(n, .47, .7)], fill=c, width=int(w * .6))
    d.line([P(n, .54, .42), P(n, .53, .7)], fill=c, width=int(w * .6))


def a_pic(d, n, w, c):
    d.rounded_rectangle([P(n, .18, .24), P(n, .82, .76)], radius=n * .08, outline=c, width=w)
    d.ellipse([P(n, .3, .34), P(n, .42, .46)], outline=c, width=int(w * .8))
    d.line([P(n, .26, .66), P(n, .44, .5), P(n, .58, .62), P(n, .72, .48)], fill=c, width=w, joint='curve')


def a_check(d, n, w, c):
    d.line([P(n, .2, .52), P(n, .42, .74), P(n, .8, .26)], fill=c, width=w + S, joint='curve')


def a_clock(d, n, w, c):
    d.ellipse([P(n, .14, .14), P(n, .86, .86)], outline=c, width=w)
    d.line([P(n, .5, .5), P(n, .5, .28)], fill=c, width=w)
    d.line([P(n, .5, .5), P(n, .68, .58)], fill=c, width=w)


def a_location(d, n, w, c):
    d.ellipse([P(n, .28, .12), P(n, .72, .56)], outline=c, width=w)
    d.line([P(n, .28, .44), P(n, .5, .88), P(n, .72, .44)], fill=c, width=w, joint='curve')
    d.ellipse([P(n, .42, .26), P(n, .58, .42)], outline=c, width=int(w * .8))


def a_phone(d, n, w, c):
    d.arc([P(n, .16, .16), P(n, .84, .84)], start=200, end=340, fill=c, width=w)
    r = .34
    for ang in (200, 340):
        rad = math.radians(ang)
        cx, cy = .5 + r * math.cos(rad), .5 + r * math.sin(rad)
        d.ellipse([P(n, cx - .09, cy - .09), P(n, cx + .09, cy + .09)], outline=c, width=int(w * .9))


def a_cart_small(d, n, w, c):
    d.line([P(n, .14, .2), P(n, .24, .2)], fill=c, width=w)
    d.line([P(n, .3, .34), P(n, .35, .62), P(n, .72, .62), P(n, .66, .34)], fill=c, width=w, joint='curve')
    d.line([P(n, .3, .34), P(n, .66, .34)], fill=c, width=w)
    for cx in (.4, .64):
        d.ellipse([P(n, cx - .04, .68), P(n, cx + .04, .76)], outline=c, width=int(w * .8))


act('plus', a_plus, PRIMARY)
act('minus', a_minus, PRIMARY)
act('close', a_close)
act('arrow-right', a_arrow, GRAY)
act('edit', a_edit, PRIMARY)
act('trash', a_trash, RED)
act('pic', a_pic)
act('check', a_check, GREEN)
act('clock', a_clock, PRIMARY)
act('location', a_location, PRIMARY)
act('phone', a_phone, PRIMARY)
act('cart-small', a_cart_small)
print('action icons done')


# ---------------- 空状态插画（440px） ----------------
def empty_illus():
    im, d, n = make(440)
    d.ellipse([P(n, .08, .08), P(n, .92, .92)], fill=SOFT)
    # 盘子
    d.ellipse([P(n, .2, .38), P(n, .8, .82)], outline=(214, 203, 188, 255), width=6 * S)
    d.ellipse([P(n, .27, .44), P(n, .73, .76)], outline=(214, 203, 188, 255), width=3 * S)
    # 食物
    d.ellipse([P(n, .36, .5), P(n, .64, .7)], fill=CREAM)
    d.ellipse([P(n, .43, .54), P(n, .57, .64)], fill=PRIMARY)
    # 蒸汽
    d.arc([P(n, .38, .16), P(n, .48, .36)], start=90, end=270, fill=(214, 203, 188, 255), width=4 * S)
    d.arc([P(n, .54, .1), P(n, .64, .3)], start=90, end=270, fill=(214, 203, 188, 255), width=4 * S)
    save(im, 'empty', 440)


empty_illus()
print('empty illustration done')


# ---------------- 菜品占位图（240px） ----------------
def dish_placeholder():
    im, d, n = make(240)
    d.rounded_rectangle([0, 0, n - 1, n - 1], radius=n * .12, fill=(247, 243, 237, 255))
    d.ellipse([P(n, .18, .3), P(n, .82, .82)], outline=(214, 203, 188, 255), width=5 * S)
    d.arc([P(n, .4, .18), P(n, .5, .4)], start=90, end=270, fill=(214, 203, 188, 255), width=4 * S)
    d.arc([P(n, .52, .12), P(n, .62, .34)], start=90, end=270, fill=(214, 203, 188, 255), width=4 * S)
    save(im, 'dish-placeholder', 240)


dish_placeholder()
print('dish placeholder done')


# ---------------- 默认头像（200px，家 字） ----------------
def avatar_default():
    im, d, n = make(200)
    d.ellipse([0, 0, n - 1, n - 1], fill=SOFT)
    font = None
    for path in ('C:/Windows/Fonts/msyh.ttc', 'C:/Windows/Fonts/msyhbd.ttc'):
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, int(n * .5))
                break
            except Exception:
                font = None
    if font:
        text = '家'
        bbox = d.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d.text(((n - tw) / 2 - bbox[0], (n - th) / 2 - bbox[1]), text, font=font, fill=PRIMARY)
    save(im, 'avatar-default', 200)


avatar_default()
print('avatar done')
print('ALL ICONS DONE ->', OUT)
