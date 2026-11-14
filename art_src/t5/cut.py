"""테마 5(브론즈 던전) 그림 자르기 — 사용법: python3 art_src/t5/cut.py game/art/t5
사용자 그림 3장(sheet1.jpg·sheet2.jpg·sheet3.png)에서 맵 타일·함정·장식·UI 조각을 잘라 냄.
tile: 네모 그대로 / obj: 바깥 배경을 투명하게(가장자리에서 비슷한 색을 채워 나감). 유닛(그론·용사) 그림은 쓰지 않음."""
import sys, os
from PIL import Image
from collections import deque
D = os.path.dirname(os.path.abspath(__file__)); OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
IM = {1: "sheet1.jpg", 2: "sheet2.jpg", 3: "sheet3.png"}
IM = {k: Image.open(os.path.join(D, v)).convert("RGBA") for k, v in IM.items()}

def bgmask(im):
    """가장자리에서 시작해, 옆 배경 칸과 색이 거의 같고(부드러운 그라데이션) 가장자리 대표색과도 가까운 칸만 배경 → True"""
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

def clear(im):
    m = bgmask(im); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if m[y][x]: px[x, y] = (0, 0, 0, 0)
    bb = im.getbbox()
    return im.crop(bb) if bb else im

def cut(sh, box, name, mode="obj"):
    im = IM[sh].crop(box)
    if mode == "obj": im = clear(im)
    im.save(os.path.join(OUT, name + ".png"))

S = [
 # ── 맵: 바닥(어두운 판석 · 변형 · 이끼) / 벽 윗면(밝은 돌) / 벽 앞면(벽돌 · 횃불 · 깃발 · 창살) ──
 (3, (22, 51, 95, 117), "floor_a", "tile"), (3, (109, 51, 186, 117), "floor_b", "tile"),
 (3, (109, 130, 186, 200), "floor_c", "tile"), (3, (202, 51, 280, 117), "floor_m", "tile"),
 (3, (22, 216, 95, 290), "cap", "tile"),
 (3, (693, 72, 776, 108), "face", "tile"), (3, (1314, 245, 1404, 300), "face_torch", "tile"),
 (3, (950, 240, 1032, 300), "face_banner", "tile"), (3, (1196, 245, 1298, 300), "face_grate", "tile"),
 (3, (577, 215, 658, 291), "rune", "tile"),
 # ── 함정 · 구덩이 · 폭탄 ──
 (3, (20, 343, 102, 421), "spike", "obj"), (3, (116, 343, 202, 421), "pit", "obj"),
 (3, (213, 351, 289, 417), "spike_blood", "obj"), (3, (604, 351, 683, 417), "bomb", "obj"),
 # ── 바닥 장식(보기만) ──
 (3, (283, 698, 349, 750), "d_skull", "obj"), (3, (396, 686, 464, 750), "d_web", "obj"),
 (3, (161, 703, 204, 752), "d_rock", "obj"), (3, (503, 693, 564, 750), "d_plant", "obj"),
 # ── 아이콘 버튼 · 도구 ──
 (3, (18, 808, 97, 886), "ic_gear", "obj"), (3, (99, 808, 174, 886), "ic_search", "obj"),
 (3, (176, 808, 252, 886), "ic_zout", "obj"), (3, (254, 808, 337, 886), "ic_expand", "obj"),
 (3, (339, 808, 414, 886), "ic_grid", "obj"), (3, (212, 928, 294, 1002), "ic_zin", "obj"),
 (3, (674, 788, 750, 892), "w_pick", "obj"), (3, (586, 778, 664, 894), "w_hammer", "obj"),
 # ── 큰 버튼(글자 포함) ──
 (3, (974, 810, 1136, 861), "btn_ok", "obj"), (3, (974, 860, 1136, 912), "btn_cancel", "obj"),
 (2, (1154, 920, 1319, 984), "btn_end", "obj"),
 # ── 테두리(9칸 자르기용) ──
 (2, (1163, 712, 1311, 759), "btn_frame", "tile"),
]
for s in S: cut(*s)
# 패널 테두리: '타일 정보' 창의 아래쪽(모서리 장식)을 위아래로 이어 붙여 제목 없는 틀
bot = IM[2].crop((1336, 934, 1529, 1010)); fr = Image.new("RGBA", (bot.width, bot.height * 2))
fr.paste(bot.transpose(Image.FLIP_TOP_BOTTOM), (0, 0)); fr.paste(bot, (0, bot.height))
fr.save(os.path.join(OUT, "frame.png"))
print("ok", len(S) + 1)
