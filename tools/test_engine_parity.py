"""브라우저 = 서버(Node.js) 같은 결과 테스트

사용법:  python3 tools/test_engine_parity.py [판 수=40]
- 같은 씨앗·같은 조합으로 컴퓨터끼리 대전을 브라우저(실제 게임 페이지, 그리기 연결된 상태)와
  Node.js(규칙 파일만, 화면 없음)에서 각각 돌려 규칙 상태 지문(stateHash)이 모두 같은지 비교
- 브라우저에서 기록한 행동 목록(리플레이)을 Node.js 에서 다시 둬도 같은 지문이 나오는지 확인
  → 서버가 같은 규칙 코드로 판정할 수 있다는 증거
"""
import functools, http.server, json, os, subprocess, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME = os.path.join(ROOT, "game")
N = int(sys.argv[1]) if len(sys.argv) > 1 else 40


def serve(d):
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    s = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Q, directory=d))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, f"http://127.0.0.1:{s.server_address[1]}/index.html"


NODE = """
const { createEngine, matchOf } = require(%s);
const n = +process.argv[1], E = createEngine();
const out = [];
for (let i = 1; i <= n; i++) { const r = E.call("simMatch", matchOf(i)); out.push({ i, hash: r.hash, round: r.round, winner: r.winner }); }
const logs = JSON.parse(require("fs").readFileSync(0, "utf8"));
const rep = logs.map(l => { const E2 = createEngine(); E2.call("replay", l.log); return { i: l.i, hash: E2.run("stateHash(S)") }; });
process.stdout.write(JSON.stringify({ out, rep }));
""" % json.dumps(os.path.join(ROOT, "tools", "headless.js"))

BROWSER = """n=>{const PICKS=[["knight","cleric","archer"],["knight","archer","mage"],["cleric","archer","mage"],["knight","cleric","mage"]];
const o=[];for(let i=1;i<=n;i++){const m={seed:i,champ:i%2?"vince":"gron",pick:PICKS[(i>>1)%4]},r=simMatch(m);o.push({i,hash:r.hash,round:r.round,winner:r.winner,log:i<=6?r.log:null})}return o}"""


def main():
    s, url = serve(GAME)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(url)
        pg.wait_for_function("()=>window.GAME_READY", polling=100, timeout=15000)
        br = pg.evaluate(BROWSER, N)
        b.close()
    s.shutdown()
    logs = [{"i": r["i"], "log": r["log"]} for r in br if r["log"]]
    nd = json.loads(subprocess.run(["node", "-e", NODE, str(N)], input=json.dumps(logs), capture_output=True, text=True, check=True).stdout)
    fails = 0
    same = sum(1 for a, c in zip(br, nd["out"]) if a["hash"] == c["hash"] and a["round"] == c["round"] and a["winner"] == c["winner"])
    ok = same == N and len(nd["out"]) == N
    print(("OK   " if ok else "FAIL ") + f"브라우저 = Node.js: {same}/{N}판 규칙 상태 지문·라운드·승패 모두 같음")
    fails += not ok
    bad = [r for r in nd["rep"] if r["hash"] != br[r["i"] - 1]["hash"]]
    print(("OK   " if not bad else "FAIL ") + f"브라우저 기록 → Node.js 리플레이: {len(nd['rep']) - len(bad)}/{len(nd['rep'])}판 같은 지문 (행동 {sum(len(l['log']['actions']) for l in logs)}개)")
    fails += bool(bad)
    print(("OK   " if not errs else "FAIL ") + "브라우저 오류 없음 " + str(errs[:2]))
    fails += bool(errs)
    hw = sum(r["winner"] == "hero" for r in br)
    print(f"참고: {N}판 중 용사 승 {hw}, 보스 승 {N - hw}")
    print("결과:", "모두 통과" if not fails else f"{fails}개 실패")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
