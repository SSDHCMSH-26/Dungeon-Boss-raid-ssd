"""캐릭터 설정 시트(한 장짜리 그림)에서 스프라이트를 잘라 게임용 투명 PNG 로 만드는 도구.

사용법:  python3 tools/cut_sprites.py <원본 그림> <설정.json>
설정.json 예:
  {"out": "game/art/t3a", "height": 48, "ref": "archer_idle",
   "items": {"archer_idle": [405, 85, 485, 220], "fx_aim": [835, 330, 905, 440, 60]}}
- items: 이름 → [왼, 위, 오른, 아래] (원본 그림 좌표), 다섯 번째 값을 주면 그 높이로 따로 맞춤(효과 그림)
- 배경 지우기: 상자 테두리에서 시작해, 배경색(테두리 평균)과 비슷한 이어진 칸을 투명하게 → 1칸 외곽선 복원
- 캐릭터 그림(다섯 번째 값 없음)은 모두 같은 배율(ref 그림의 높이를 height 에 맞춘 배율)로 줄이고 아래 여백 5칸으로 맞춤
"""
import json, os, sys
from collections import deque
from PIL import Image, ImageFilter

PAD = 5


def cutout(im, box, tol=34):
    c = im.crop(box).convert("RGBA")
    w, h = c.size
    px = c.load()
    edge = [px[x, y] for x in range(w) for y in (0, h - 1)] + [px[x, y] for y in range(h) for x in (0, w - 1)]
    bg = tuple(sorted(p[i] for p in edge)[len(edge) // 2] for i in range(3))
    near = lambda p: sum((p[i] - bg[i]) ** 2 for i in range(3)) <= tol * tol
    gone = [[False] * h for _ in range(w)]
    q = deque((x, y) for x in range(w) for y in (0, h - 1)) + deque((x, y) for y in range(h) for x in (0, w - 1))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or gone[x][y] or not near(px[x, y]):
            continue
        gone[x][y] = True
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    keep = [[not gone[x][y] for y in range(h)] for x in range(w)]
    # 1칸 외곽선 복원(어두운 테두리가 같이 지워지지 않게)
    for x in range(w):
        for y in range(h):
            if gone[x][y] and any(0 <= x + a < w and 0 <= y + b < h and keep[x + a][y + b] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                gone[x][y] = False
    for x in range(w):
        for y in range(h):
            if gone[x][y]:
                px[x, y] = (0, 0, 0, 0)
    # 칸 테두리 선·잡티 제거: 가장 큰 덩어리 + 그 상자(여유 3칸) 안에 중심이 있는 덩어리만 남김
    seen, comps = set(), []
    for x in range(w):
        for y in range(h):
            if px[x, y][3] and (x, y) not in seen:
                pts, st = [], [(x, y)]
                seen.add((x, y))
                while st:
                    a, b = st.pop()
                    pts.append((a, b))
                    for da in (-1, 0, 1):
                        for db in (-1, 0, 1):
                            n = (a + da, b + db)
                            if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen and px[n][3]:
                                seen.add(n)
                                st.append(n)
                comps.append(pts)
    if comps:
        big = max(comps, key=len)
        x0, x1 = min(p[0] for p in big) - 3, max(p[0] for p in big) + 3
        y0, y1 = min(p[1] for p in big) - 3, max(p[1] for p in big) + 3
        for pts in comps:
            cx_ = sum(p[0] for p in pts) / len(pts)
            cy_ = sum(p[1] for p in pts) / len(pts)
            if pts is not big and not (x0 <= cx_ <= x1 and y0 <= cy_ <= y1 and len(pts) >= 4):
                for p in pts:
                    px[p] = (0, 0, 0, 0)
    bb = c.getbbox()
    return c.crop(bb) if bb else c


def main():
    src, cfg = sys.argv[1], json.load(open(sys.argv[2], encoding="utf-8"))
    im = Image.open(src).convert("RGB")
    cuts = {k: cutout(im, v[:4]) for k, v in cfg["items"].items()}
    ref = cuts[cfg["ref"]]
    scale = cfg["height"] / ref.size[1]
    os.makedirs(cfg["out"], exist_ok=True)
    for k, c in cuts.items():
        v = cfg["items"][k]
        s = v[4] / c.size[1] if len(v) > 4 else scale
        r = c.resize((max(1, round(c.size[0] * s)), max(1, round(c.size[1] * s))), Image.LANCZOS)
        a = r.split()[3].point(lambda t: 255 if t > 110 else 0)  # 가장자리 반투명 정리
        r.putalpha(a)
        out = Image.new("RGBA", (r.size[0] + PAD * 2, r.size[1] + PAD * 2), (0, 0, 0, 0))
        out.paste(r, (PAD, PAD), r)
        out.save(os.path.join(cfg["out"], k + ".png"), optimize=True)
        print(k, out.size)


if __name__ == "__main__":
    main()
