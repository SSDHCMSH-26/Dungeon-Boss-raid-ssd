"""테마 6 그림 자르기 — 사용 법: python3 art_src/t6/cut.py game/art/t6
사용자 그림(sheet_a.png, sheet_b.png)에서 테마 6 에 쓸 조각을 잘라 냄.
tile: 네모 그대로(배경 제거 없음, 테두리 배경만 다듬기) / obj: 바깥 배경을 투명하게(가장자리에서 채우기)"""
import sys, os
from PIL import Image, ImageDraw
from collections import deque
D = os.path.dirname(os.path.abspath(__file__)); OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
IM = {k: Image.open(os.path.join(D, "sheet_" + k.lower() + ".png")).convert("RGBA") for k in "AB"}

def bgmask(im, tol):
    """가장자리에서 시작해, 바로 옆 배경 칸과 색이 거의 같고(부드러운 그라데이션) 가장자리 평균색과도 가까운 칸만 배경으로 채움 → True 가 배경"""
    w, h = im.size; px = im.load(); seen = [[False] * w for _ in range(h)]; q = deque()
    edge = [px[x, 0] for x in range(w)] + [px[x, h - 1] for x in range(w)] + [px[0, y] for y in range(h)] + [px[w - 1, y] for y in range(h)]
    edge.sort(key=lambda c: c[0] + c[1] + c[2]); mc = edge[len(edge) // 2]
    dist = lambda a, b: abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])
    for x in range(w):
        for y in (0, h - 1):
            if dist(px[x, y], mc) < 70: q.append((x, y, px[x, y]))
    for y in range(h):
        for x in (0, w - 1):
            if dist(px[x, y], mc) < 70: q.append((x, y, px[x, y]))
    while q:
        x, y, pc = q.popleft()
        if seen[y][x]: continue
        c = px[x, y]
        if dist(c, pc) > 18 or dist(c, mc) > 75: continue
        seen[y][x] = True
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx]: q.append((nx, ny, c))
    return seen

def cut(src, box, name, mode="obj", tol=52):
    im = IM[src].crop(box)
    if mode == "obj":
        m = bgmask(im, tol); px = im.load()
        for y in range(im.height):
            for x in range(im.width):
                if m[y][x]: px[x, y] = (0, 0, 0, 0)
        bb = im.getbbox()
        if bb: im = im.crop(bb)
    im.save(os.path.join(OUT, name + ".png"))
    return im

S = [
 # 맵 타일 (네모 그대로)
 ("B", (32, 512, 126, 604), "floor_l", "tile"), ("B", (148, 512, 248, 604), "floor_c", "tile"),
 ("B", (48, 640, 118, 700), "floor_d", "tile"),
 ("B", (470, 506, 600, 608), "pit_l", "tile"), ("B", (268, 506, 348, 606), "pit_s", "tile"),
 ("B", (800, 506, 892, 606), "spike_t", "tile"), ("B", (606, 506, 692, 606), "grate", "tile"),
 ("A", (18, 618, 122, 728), "wall_a", "tile"), ("A", (384, 618, 492, 728), "wall_hole", "tile"),
 # 물건
 ("B", (1088, 496, 1212, 616), "portal", "obj"), ("B", (1225, 540, 1312, 628), "spikes", "obj"),
 ("B", (1212, 712, 1292, 798), "bomb", "obj"), ("B", (1420, 540, 1510, 630), "gear", "obj"),
 # UI
 ("B", (20, 860, 97, 947), "ib_grid", "obj"), ("B", (97, 860, 172, 947), "ib_search", "obj"),
 ("B", (172, 860, 247, 947), "ib_map", "obj"), ("B", (247, 860, 324, 947), "ib_gear", "obj"),
 ("B", (324, 860, 401, 947), "ib_help", "obj"), ("B", (401, 860, 479, 947), "ib_next", "obj"),
 ("B", (479, 860, 562, 947), "ib_ff", "obj"),
 ("B", (1240, 848, 1515, 955), "btn_end", "obj"), ("B", (1260, 450, 1515, 535), "btn_ok", "obj"),
 ("B", (938, 378, 1013, 476), "tab_skill", "obj"), ("B", (1013, 378, 1077, 476), "tab_move", "obj"),
 ("B", (1077, 378, 1143, 476), "tab_scan", "obj"), ("B", (1143, 378, 1212, 476), "tab_item", "obj"),
 ("B", (402, 28, 454, 82), "gem", "obj"), ("B", (850, 40, 914, 100), "btn_x", "obj"),
]
for s in S: cut(*s)
# 패널 테두리: 아이템 창의 아래쪽(모서리 장식 포함)을 위아래로 이어 붙여 제목 없는 틀을 만듦 → border-image 9칸 자르기용
it = IM["B"].crop((956, 40, 1198, 338)); bot = it.crop((0, it.height - 110, it.width, it.height))
fr = Image.new("RGBA", (it.width, 220)); fr.paste(bot.transpose(Image.FLIP_TOP_BOTTOM), (0, 0)); fr.paste(bot, (0, 110))
m = bgmask(fr, 52); px = fr.load()
for y in range(fr.height):
    for x in range(fr.width):
        if m[y][x]: px[x, y] = (0, 0, 0, 0)
fr.save(os.path.join(OUT, "frame.png"))
# 카드 테두리(성직자 카드 오른쪽 절반 + 왼쪽 가장자리) — 초상 그림은 빼고 테두리만
cd = IM["B"].crop((30, 178, 330, 276)); L_ = cd.crop((0, 0, 30, cd.height)); R_ = cd.crop((150, 0, cd.width, cd.height))
card = Image.new("RGBA", (30 + R_.width, cd.height)); card.paste(L_, (0, 0)); card.paste(R_, (30, 0))
# 가운데 AP 글자 부분은 border-image 의 가운데라 그리지 않음
m = bgmask(card, 52); px = card.load()
for y in range(card.height):
    for x in range(card.width):
        if m[y][x]: px[x, y] = (0, 0, 0, 0)
card.save(os.path.join(OUT, "card.png"))
print("ok", len(S) + 2)
