"""보스 그림 테스트: 느린 인터넷에서도 보스(그론·빈센토)가 옛 임시 그림으로 바뀌지 않는지

사용법:  python3 tools/test_boss_art.py [game 폴더=game] [그림 지연 ms=600]
- 그림 파일(art/)을 일부러 늦게 보내는 웹서버로 게임을 열고(폰 인터넷 흉내), 테마 2·3 × 그론·빈센토로
  혼자 하기(용사 = 나, 보스 = 컴퓨터) 3턴을 진행하면서 매 프레임 보스를 무엇으로 그렸는지 기록
- 옛 임시 그림(코드로 그린 픽셀 그림 sp)으로 그린 프레임이 하나라도 있으면 실패
"""
import functools, http.server, os, sys, threading, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, "game")
DELAY = int(sys.argv[2]) if len(sys.argv) > 2 else 600


class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        if "/art/" in self.path:
            time.sleep(DELAY / 1000)
        try:
            super().do_GET()
        except (BrokenPipeError, ConnectionResetError):
            pass


SET = """([d,c])=>{window.LOG=[];const o=sp;sp=function(k,...a){if(k=='gron'||k=='vince')LOG.push({old:1,mv:!!(VP.B&&VP.B.q.length)});return o.call(this,k,...a)};
const oi=spI;spI=function(k,...a){const r=oi.call(this,k,...a);if(/^[gv]\\d$/.test(k)&&r)LOG.push({k});return r};
L.design=d;S=newS();L.mode='solo';L.role='hero';L.scr='game';document.getElementById('m').style.display='none';document.getElementById('g').style.display='block';
pickChamp(c);apply({type:'setPick',ids:['knight','cleric','mage']});start();return 1}"""


def main():
    s = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Q, directory=GAME))
    threading.Thread(target=s.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{s.server_address[1]}/index.html"
    fails = 0
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        for d in ["t2", "t3"]:
            for c in ["gron", "vince"]:
                pg = b.new_page()
                errs = []
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.goto(url)
                pg.wait_for_function("()=>window.GAME_READY", timeout=30000)
                pg.evaluate(SET, [d, c])
                for _ in range(3):
                    pg.wait_for_function("()=>S.ph=='hero'||S.end", timeout=60000)
                    pg.evaluate("()=>endHero()")
                    pg.wait_for_timeout(300)
                pg.wait_for_function("()=>S.ph=='hero'||S.end", timeout=60000)
                log = pg.evaluate("LOG")
                old = [x for x in log if x.get("old")]
                used = sorted({x["k"] for x in log if "k" in x})
                ok = not old and not errs and used
                fails += not ok
                print(("OK   " if ok else "FAIL ") + f"{d} {c}: 그림 프레임 {len(log) - len(old)}개({', '.join(used)}), 옛 임시 그림 {len(old)}프레임(이동 중 {sum(x['mv'] for x in old)}) {errs[:1]}")
                pg.close()
        b.close()
    s.shutdown()
    print("결과:", "모두 통과" if not fails else f"{fails}개 실패")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
