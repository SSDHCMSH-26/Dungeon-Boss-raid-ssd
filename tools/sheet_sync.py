"""구글 시트 수치표 <-> game/data/*.json 변환기

사용법
  python3 tools/sheet_sync.py export [출력.json]
      지금 data/*.json 의 수치를 시트에 쓸 표(탭별 2차원 배열)로 만듦
  python3 tools/sheet_sync.py apply <시트값.json> [--dry]
      시트에서 읽은 값({"탭 이름": [[행], ...]})을 data/*.json 에 반영하고 바뀐 항목을 출력
      --dry 면 파일은 그대로 두고 바뀔 항목만 출력

시트 형식 (모든 탭 공통): 대상 | 항목 | 값 | 설명 | 키
  - 사람이 고치는 칸은 "값" 하나뿐. "키"(파일:경로)로 어느 JSON 의 어느 숫자인지 찾음.
  - 값: 숫자, 또는 레벨별 목록은 "25, 45, 65" 처럼 쉼표로.
  - 이름·설명 글자는 시트에서 바꾸지 않음(반영할 때 수치가 바뀐 스킬의 설명 숫자는 따로 고침).
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "game", "data")
FILES = {"heroes": "heroes.json", "skills": "skills.json", "champions": "champions.json", "monsters": "monsters.json",
         "items": "items.json", "loot": "loot.json", "rules": "rulesets/standard.json", "ai": "ai.json"}
HEAD = ["대상", "항목", "값", "설명", "키"]
SKIP = {"format", "version", "ok", "bash", "gen", "vr", "esc", "dg", "par", "arc", "kind", "pk"}

# 항목 이름(한국어)과 짧은 설명
L = {
    "hp": ("체력", ""), "mv": ("기본 이동", "칸"), "ap": ("AP", "턴마다 받는 행동력"),
    "c": ("AP 비용", ""), "r": ("사거리", "칸"), "a": ("범위", "0=1칸, 1=3×3"), "v": ("피해/회복량", ""),
    "cd": ("쿨타임", "턴"), "pk": ("고르는 칸 수", ""), "k": ("공격 크기", "칸"), "lim": ("턴당 사용 횟수", ""),
    "escEvery": ("AP +1 되는 간격", "이번 턴에 이만큼 쓸 때마다 AP +1"),
    "damageTaken": ("받는 피해 비율", "0.25 = 75% 줄임"), "radius": ("반경", "칸 (1 = 3×3)"), "hit": ("충돌 피해", ""),
    "recoil": ("반동 피해", "무시한 효과 1개당"), "dmg": ("피해", ""), "heal": ("회복", ""),
    "bindBoss": ("보스·발전기 속박", "턴"), "bindOther": ("로봇 속박", "턴"), "near": ("가까운 적 피해", ""), "far": ("먼 적 피해", ""),
    "val": ("레벨별 수치", "Lv1, Lv2, Lv3 (피해 또는 보호막)"), "burn": ("불바닥 피해", ""), "burnLv": ("불바닥 생기는 레벨", ""),
    "slow": ("레벨별 이동 감소", "Lv1, Lv2, Lv3"), "stunLv": ("행동불능 되는 레벨", ""), "add": ("영창 1번당 증가량", "위력: 수치 +, 확산: 반경 +"),
    "hpPerLv": ("레벨당 체력", ""), "turns": ("첫 벽 유지", "턴"), "turnsLater": ("같은 턴 두 번째부터 유지", "턴"),
    "stackTurns": ("겹쳐 쌓을 때 추가 유지", "턴"), "maxLv": ("최대 레벨", ""), "max": ("최대 개수", ""), "fallDmg": ("낙하 피해", ""),
    "maxLen": ("한 줄 최대 길이", "칸"), "move": ("이동", "칸"), "enhancedMove": ("강화 시 이동", "칸"),
    # 보스 능력치
    "apNoGen": ("발전기 파괴 후 AP", ""), "moveNoGen": ("발전기 파괴 후 추가 이동", "칸"),
    "damageTakenWithGen": ("발전기 가동 중 받는 피해 비율", "0.75 = 25% 줄임"), "factoryKillAp": ("공장 파괴 시 다음 턴 AP 회수", ""),
    "charge": ("발전 시 다음 턴 추가 AP", ""),
    # 몬스터
    "bite": ("공격 피해", ""), "suppressTurns": ("제압 턴", ""), "suppressDmg": ("제압 중 턴마다 피해", ""),
    "steal": ("훔치기 피해", ""), "goldChance": ("금화 강탈 확률", "0~1"), "itemChance": ("아이템 강탈 확률", "0~1"),
    "goldMin": ("금화 강탈 최소", "개"), "goldMax": ("금화 강탈 최대", "개"), "mimicChance": ("미믹이 나올 확률", "0~1 (나머지는 고블린)"),
    "atkBase": ("Lv1 공격 피해", ""), "atkPerLv": ("레벨당 공격 피해 증가", ""), "chase": ("추격 반경", "칸"),
    "enhanceTurns": ("강화 유지", "턴"), "enhanceMult": ("강화 시 체력·이동 배수", ""), "wreckCount": ("발전기 잔해 로봇 수", ""),
    "wreckLv": ("잔해 로봇 레벨", ""), "upgradeHp": ("업그레이드 시 체력 +", ""), "cycle": ("로봇 생산 주기", "턴"),
    "decay": ("턴마다 체력 감소", ""), "enhanceHp": ("강화 시 체력 +", ""),
    # 아이템
    "range": ("거리", "칸"),
    # 규칙
    "clericApMax": ("성직자 AP 이월 최대", ""), "movesPerTurn": ("턴당 이동 횟수", ""), "breakDmg": ("용사 벽 부수기 피해", ""),
    "breakRange": ("용사 벽 부수기 사거리", "칸"), "mapWallHp": ("맵 기본 벽 체력", ""), "life": ("유지", "턴"),
    "blueChance": ("파랑 크리스탈 확률", "0~1"), "start": ("시작 개수", ""), "perTurnMin": ("턴마다 생성 최소", ""),
    "perTurnMax": ("턴마다 생성 최대", ""), "blueAp": ("파랑: AP +", ""), "yellowMove": ("노랑: 이동 +", "칸"),
    "startChance": ("첫 턴 생성 확률", "0~1"), "startMin": ("첫 턴 생성 최소", ""), "startMax": ("첫 턴 생성 최대", ""),
    "spawnChance": ("매 턴 생성 확률", "0~1"), "heroOpenRange": ("용사가 여는 거리", "칸"), "bossOpenRange": ("보스가 여는 거리", "칸"),
    "spacing": ("상자끼리 최소 간격", "칸"), "heroClearance": ("용사와 떨어진 거리", "칸"), "bossClearance": ("보스와 떨어진 거리", "칸"),
    "trapChestSpacing": ("함정 상자와 다른 상자 간격", "칸"), "paralyzeMove": ("마비 시 이동 감소", "칸"),
    # AI
    "delayMs": ("행동 전 기다림", "밀리초"), "approachDist": ("이보다 멀면 다가감", "칸"), "attackTries": ("턴마다 공격 시도", "번"),
    "chance": ("확률", "0~1"), "minAp": ("필요 AP", ""), "minPits": ("필요 구덩이 수", ""), "tries": ("시도 횟수", ""),
    "upgradeChance": ("업그레이드 확률", "0~1"), "upgradeMinFactories": ("업그레이드 최소 공장 수", ""),
    "lenMin": ("벨트 길이 최소", "칸"), "lenMax": ("벨트 길이 최대", "칸"), "enhancedAttackTries": ("강화 중 추가 공격", "번"),
    "actionsPerTurn": ("용사 한 명 턴당 행동 수", ""), "healBelow": ("체력 이 비율 미만이면 치유", "0~1"),
    "manaMinTargets": ("마력 방출 최소 적 수", ""), "beltBreakChance": ("벨트 부술 확률", "0~1"),
    "frostChance": ("빙결을 고를 확률", "0~1"), "shieldMinAllies": ("수호를 쓰는 다친 아군 수", ""),
}
SEC = {  # 대상 이름에 쓰는 묶음 이름
    "mimic": "미믹", "gob": "보물 고블린", "trapChest": "함정 상자", "robot": "로봇", "factory": "공장", "bomb": "폭탄로봇",
    "crystal": "번개 크리스탈", "chest": "보물상자", "status": "상태이상", "circle": "마법진", "hero": "용사",
    "boss": "컴퓨터 보스", "trapChest_ai": "함정 상자", "digPit": "구덩이 파기", "hopPit": "구덩이 이동", "wall": "벽 쌓기",
    "spikeTrap": "가시 함정", "bomb_ai": "폭탄로봇", "belt": "컨베이어", "selfCharge": "자기 강화", "generatorCharge": "발전",
    "dodgeCircle": "마법진 피하기", "generator": "발전기", "gron": "그론", "vince": "빈센토",
}
TABS = ["용사", "용사 스킬", "보스", "몬스터", "아이템·상자", "규칙", "컴퓨터 AI"]


def load(k):
    with open(os.path.join(DATA, FILES[k]), encoding="utf-8") as f:
        return json.load(f)


def clean(n):  # 이름 앞 그림 글자 제거
    return re.sub(r"^[^\w가-힣]+", "", n or "").strip()


def lab(k):
    return L.get(k, (k, ""))


def fmt(v):
    if isinstance(v, list):
        return ", ".join(str(x) for x in v)
    return v


def rows_of(fkey, obj, path, target, out, skip=SKIP):
    """obj 아래 숫자(또는 숫자 목록)를 행으로. path 는 obj 의 경로."""
    for k, v in obj.items():
        if k in skip or isinstance(v, str):
            continue
        p = path + ("." if path else "") + k
        if isinstance(v, dict):
            rows_of(fkey, v, p, target + " · " + SEC.get(k, k) if k not in ("fx", "stats", "effect") else target, out, skip)
        elif isinstance(v, list) and all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in v):
            n, d = lab(k)
            out.append([target, n, fmt(v), d or "Lv1, Lv2, Lv3", fkey + ":" + p])
        elif isinstance(v, (int, float)) and not isinstance(v, bool):
            n, d = lab(k)
            out.append([target, n, v, d, fkey + ":" + p])


def build():
    H, S, C, M, I, LT, R, A = (load(k) for k in FILES)
    tabs = {t: [HEAD] for t in TABS}
    for hk, h in H.items():
        if isinstance(h, dict):
            rows_of("heroes", h, hk, h["n"], tabs["용사"])
    for hk, sks in S["heroes"].items():
        for i, s in enumerate(sks):
            rows_of("skills", s, f"heroes.{hk}[{i}]", H[hk]["n"] + " · " + clean(s["n"]), tabs["용사 스킬"])
    for ck, c in C.items():
        if isinstance(c, dict) and c.get("ok"):
            rows_of("champions", c["stats"], ck + ".stats", clean(c["n"]), tabs["보스"])
            sk = S["champions"].get(ck, {})
            for i, a in enumerate(sk.get("at", [])):
                rows_of("skills", a, f"champions.{ck}.at[{i}]", clean(c["n"]) + " · " + clean(a["n"]), tabs["보스"])
            if sk.get("gx"):
                rows_of("skills", sk["gx"], f"champions.{ck}.gx", clean(c["n"]) + " · " + clean(sk["gx"]["n"]), tabs["보스"])
            for i, e in enumerate(sk.get("ex", [])):
                rows_of("skills", e, f"champions.{ck}.ex[{i}]", clean(c["n"]) + " · " + clean(e["n"]), tabs["보스"])
    for mk, m in M.items():
        if isinstance(m, dict):
            rows_of("monsters", m, mk, SEC.get(mk, mk), tabs["몬스터"])
    IL = {"heal": ("체력 회복", ""), "range": ("순간이동 거리", "칸"), "ap": ("AP 추가", "")}
    for ik, it in I.items():
        if isinstance(it, dict):
            for ek, ev in (it.get("effect") or {}).items():
                tabs["아이템·상자"].append([it["n"], *IL.get(ek, (ek, ""))[:1], ev, IL.get(ek, (ek, ""))[1], f"items:{ik}.effect.{ek}"])
    t = LT["treasureChest"]
    for i, (g, w) in enumerate(t["gold"]):
        tabs["아이템·상자"].append(["보물상자 금화", f"{i + 1}번째 묶음: 금화 수", g, "개", f"loot:treasureChest.gold[{i}][0]"])
        tabs["아이템·상자"].append(["보물상자 금화", f"{i + 1}번째 묶음: 가중치", w, "클수록 자주 나옴", f"loot:treasureChest.gold[{i}][1]"])
    for i, (ik, p) in enumerate(t["items"]):
        tabs["아이템·상자"].append(["보물상자 아이템", I[ik]["n"] + " 확률", p, "0~1 (합이 1 이하, 나머지는 없음)", f"loot:treasureChest.items[{i}][1]"])
    for sk, sv in R.items():
        if isinstance(sv, dict):
            rows_of("rules", sv, sk, SEC.get(sk, sk), tabs["규칙"])
            for r in tabs["규칙"]:
                if r[4] == "rules:circle.breakDmg":
                    r[1], r[3] = "영창이 끊기는 피해", "한 번에 이만큼 이상 체력 피해를 받으면 끊김"
                if r[4] == "rules:hero.ap":
                    r[3] = "턴마다 받는 행동력 (마법사는 용사 탭의 AP)"
        elif isinstance(sv, (int, float)) and not isinstance(sv, bool) and sk not in SKIP:
            n, d = lab(sk)
            tabs["규칙"].append(["기본", n, sv, d, "rules:" + sk])
    for k, v in A.items():
        if isinstance(v, dict):
            rows_of("ai", v, k, {"boss": "컴퓨터 보스", "hero": "컴퓨터 용사"}.get(k, k), tabs["컴퓨터 AI"])
        elif isinstance(v, (int, float)) and k not in SKIP:
            n, d = lab(k)
            tabs["컴퓨터 AI"].append(["기본", n, v, d, "ai:" + k])
    return tabs


TOK = re.compile(r"\.?([A-Za-z_][A-Za-z0-9_]*)|\[(\d+)\]")


def parse_path(p):
    return [int(b) if b else a for a, b in TOK.findall(p)]


def get_at(o, ps):
    for k in ps:
        o = o[k]
    return o


def set_at(o, ps, v):
    for k in ps[:-1]:
        o = o[k]
    o[ps[-1]] = v


def num(s):
    s = str(s).strip().replace(",", "") if not isinstance(s, (int, float)) else s
    if isinstance(s, (int, float)):
        return s
    if s.endswith("%"):
        return round(float(s[:-1]) / 100, 6)
    f = float(s)
    return int(f) if f == int(f) and "." not in s else f


def parse_val(raw, old):
    if isinstance(old, list):
        parts = [x for x in re.split(r"[,\s]+", str(raw).strip()) if x]
        return [num(x) for x in parts]
    v = num(raw)
    if isinstance(old, int) and isinstance(v, float) and v == int(v):
        v = int(v)
    return v


def apply(sheet, dry):
    docs = {k: load(k) for k in FILES}
    changes, errs = [], []
    for tab, rows in sheet.items():
        if not rows:
            continue
        head = rows[0]
        try:
            ci, ck, ct, cn = head.index("값"), head.index("키"), head.index("대상"), head.index("항목")
        except ValueError:
            errs.append(f"{tab}: 머리글(대상·항목·값·키)을 찾을 수 없어요")
            continue
        for r_i, r in enumerate(rows[1:], start=2):
            if len(r) <= max(ci, ck) or not str(r[ck]).strip():
                continue
            key = str(r[ck]).strip()
            fk, _, p = key.partition(":")
            if fk not in docs:
                errs.append(f"{tab} {r_i}행: 모르는 키 {key}")
                continue
            ps = parse_path(p)
            try:
                old = get_at(docs[fk], ps)
            except (KeyError, IndexError, TypeError):
                errs.append(f"{tab} {r_i}행: 데이터에 없는 키 {key}")
                continue
            try:
                new = parse_val(r[ci], old)
            except ValueError:
                errs.append(f"{tab} {r_i}행 ({r[ct]} {r[cn]}): 숫자가 아니에요 → {r[ci]!r}")
                continue
            if new != old:
                changes.append((tab, f"{r[ct]} · {r[cn]}", old, new, key))
                set_at(docs[fk], ps, new)
    for c in changes:
        print(f"바뀜  [{c[0]}] {c[1]}: {fmt(c[2])} → {fmt(c[3])}   ({c[4]})")
    for e in errs:
        print("오류  " + e)
    print(f"바뀐 항목 {len(changes)}개, 오류 {len(errs)}개")
    if dry or errs or not changes:
        return 1 if errs else 0
    for k in {c[4].split(":")[0] for c in changes}:
        path = os.path.join(DATA, FILES[k])
        src = open(path, encoding="utf-8").read()
        ind = 1 if src.startswith('{\n "') else 2
        with open(path, "w", encoding="utf-8") as f:
            f.write(json.dumps(docs[k], ensure_ascii=False, indent=ind) + "\n")
        print("저장: game/data/" + FILES[k])
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in ("export", "apply"):
        print(__doc__)
        sys.exit(1)
    if sys.argv[1] == "export":
        t = build()
        s = json.dumps(t, ensure_ascii=False, indent=1)
        if len(sys.argv) > 2:
            open(sys.argv[2], "w", encoding="utf-8").write(s)
        else:
            print(s)
        print({k: len(v) - 1 for k, v in t.items()}, file=sys.stderr)
    else:
        sheet = json.load(open(sys.argv[2], encoding="utf-8"))
        sys.exit(apply(sheet, "--dry" in sys.argv))
