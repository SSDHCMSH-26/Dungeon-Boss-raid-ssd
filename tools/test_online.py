"""둘이서 하기(Firebase 모드) 테스트 — 진짜 서버 없이, 같은 브라우저의 두 탭이 가짜 Firestore(tools/fake_firestore.js, localStorage 공유)로 대전
   확인: 방 만들기/참가, 보스 기기 = 심판(용사 명령 처리), 용사 기기·공개 기록에 숨긴 함정·폭탄 없음, 보스 비공개 기록·이어하기 복구,
         차례가 아닌 명령 무시, 무응답 승리 버튼·처리, 기권
   사용법: python3 tools/test_online.py   (보안 규칙은 이 테스트로 확인 안 됨 → 실제 서버에서 확인)"""
import functools, http.server, threading, sys, time, os
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));G,FAKE=os.path.join(ROOT,"game"),os.path.join(ROOT,"tools","fake_firestore.js")
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
s=http.server.ThreadingHTTPServer(("127.0.0.1",0),functools.partial(Q,directory=G));threading.Thread(target=s.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{s.server_address[1]}/index.html";out=[]
def ok(c,m): out.append(("OK   " if c else "FAIL ")+m)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium");ctx=b.new_context()
    ctx.add_init_script(path=FAKE)
    def pg(n):
        x=ctx.new_page();x.on("pageerror",lambda e:out.append(n+" PAGEERR "+str(e)[:200]));x.on("dialog",lambda d:(out.append(n+" DIALOG "+d.message[:120]),d.accept()))
        x.goto(URL);x.wait_for_function("()=>window.GAME_READY",timeout=15000);return x
    A=pg("A");B=pg("B")
    try:
        code=A.evaluate("async()=>{L.mode='multi';L.role='boss';await create();return L.code}")
        B.evaluate(f"async()=>{{L.mode='multi';document.body.insertAdjacentHTML('beforeend','<input id=\"cd\" value=\"{code}\">');await join();}}")
        time.sleep(1)
        ok(A.evaluate("L.role")=="boss" and B.evaluate("L.role")=="hero" and not A.evaluate("L.wait") and not B.evaluate("L.wait"),"방 만들기(보스) → 참가(용사)")
        A.evaluate("()=>pickChamp('gron')");time.sleep(1.2)
        B.evaluate("()=>{pickK('knight');pickK('cleric');pickK('archer')}");time.sleep(1.5)
        B.evaluate("()=>start()");time.sleep(2)
        ok(A.evaluate("S.ph")=="boss" and B.evaluate("S.ph")=="boss","용사 기기의 시작 명령을 보스 기기가 처리 → 두 기기 모두 보스 차례 ("+A.evaluate("S.ph")+"/"+B.evaluate("S.ph")+")")
        # boss hides a trap right in front of hero 0
        hx,hy=A.evaluate("(()=>{const h=S.heroes[0];h.x=S.boss.x;h.y=S.boss.y+6;for(let y=h.y-3;y<=h.y;y++)S.map=S.map.slice(0,y*N+h.x)+'0'+S.map.slice(y*N+h.x+1);S.walls=[];return [h.x,h.y]})()")
        tx,ty=hx,hy-1
        r=A.evaluate(f"()=>{{S.boss.ap=9;return apply({{type:'bossBuild',id:'trap',p:[[{tx},{ty}]]}})}}")
        A.evaluate("()=>{sync();endBoss()}");time.sleep(2)
        ok(A.evaluate("S.sec.traps.length")>=1,"보스 기기: 숨긴 함정 있음")
        ok(B.evaluate("!S.sec||!(S.sec.traps||[]).length") and not B.evaluate("(S.tp||[]).length") ,"용사 기기: 받은 상태에 숨긴 함정 정보가 없음")
        raw=B.evaluate(f"()=>localStorage.getItem('FAKEFS:games/{code}')")
        ok(f"[{tx},{ty}]" not in raw.replace(" ","") and '"traps"' not in raw,"공개 기록(용사가 읽는 것)에 함정 좌표 없음")
        privraw=A.evaluate(f"()=>localStorage.getItem('FAKEFS:games/{code}/priv/s')") or ""
        import json as _j;_p=_j.loads(_j.loads(privraw)["s"]);ok(len(_p["sec"]["traps"])>=1,"보스 비공개 기록에는 전체 상태(숨긴 함정 "+str(_p["sec"]["traps"])+")")
        ok(B.evaluate("S.ph")=="hero","용사 차례로 넘어옴")
        hp0=A.evaluate("S.heroes[0].hp")
        B.evaluate(f"()=>{{L.si=0;apply({{type:'heroAct',h:0,j:'m',x:{hx},y:{hy-2}}});sync()}}");time.sleep(0.3)
        ok(B.evaluate("S.heroes[0].y")==hy-2,"용사 화면은 바로 반응(먼저 적용)")
        time.sleep(1.5)
        ok(A.evaluate("S.heroes[0].y")==hy-2,"보스 기기가 용사 명령을 받아 같은 이동 적용")
        B.evaluate("()=>endHero()");time.sleep(3)
        ok(A.evaluate("S.heroes[0].hp")<hp0 and B.evaluate("S.heroes[0].hp")==A.evaluate("S.heroes[0].hp"),f"숨긴 함정 피해가 보스 기기 정산으로 들어가고 용사 화면에도 반영 ({hp0}→{B.evaluate('S.heroes[0].hp')})")
        ok(B.evaluate("S.ph")==A.evaluate("S.ph"),"두 기기 차례 일치 ("+A.evaluate("S.ph")+")")
        # illegal hero command during boss turn is ignored by host
        if A.evaluate("S.ph")=="boss":
            B.evaluate("()=>sendCmd({type:'heroAct',h:0,j:'m',x:S.heroes[0].x,y:S.heroes[0].y+1})");time.sleep(1.5)
            ok(A.evaluate("S.heroes[0].y")==hy-2,"보스 차례에 보낸 용사 명령은 보스 기기가 무시")
        # timeout claim: make idle limit tiny on hero side; it's boss's turn now
        B.evaluate("()=>{RULE.online.idleSec=1}");time.sleep(2.5);B.evaluate("()=>ui()")
        ok("승리 처리" in B.evaluate("document.getElementById('pn').innerText"),"보스 차례에 보스가 아무것도 안 하면 용사에게 '승리 처리' 버튼")
        ok("승리 처리" not in A.evaluate("()=>{RULE.online.idleSec=1;ui();return document.getElementById('pn').innerText}"),"자기 차례인 보스에겐 버튼 없음")
        B.evaluate("()=>claimWin()");time.sleep(1.5)
        ok("용사 진영 승리" in (B.evaluate("S.end") or "") and "응답 없음" in (A.evaluate("S.end") or ""),"무응답 승리 → 두 기기 모두 끝남: "+str(A.evaluate("S.end")))
        # forfeit in a new room
        code2=A.evaluate("async()=>{L.mode='multi';L.role='boss';await create();return L.code}")
        B.evaluate(f"async()=>{{document.getElementById('cd').value='{code2}';await join();}}");time.sleep(1)
        B.evaluate("()=>forfeit()");time.sleep(1.5)
        ok("보스 진영 승리" in (A.evaluate("S.end") or "") and "기권" in (A.evaluate("S.end") or ""),"용사 기권 → "+str(A.evaluate("S.end")))
        # 용사가 방을 만들고 보스가 나중에 참가
        code3=B.evaluate("async()=>{L.mode='multi';L.role='hero';await create();return L.code}")
        A.evaluate(f"async()=>{{L.mode='multi';document.body.insertAdjacentHTML('beforeend','<input id=\"cd\" value=\"{code3}\">');document.getElementById('cd').value='{code3}';await join();}}");time.sleep(1)
        ok(A.evaluate("L.role")=="boss" and B.evaluate("L.role")=="hero","용사가 만든 방에 보스가 참가 → 보스 기기가 심판")
        A.evaluate("()=>pickChamp('vince')");B.evaluate("()=>{pickK('knight');pickK('cleric');pickK('mage')}");time.sleep(1.5);B.evaluate("()=>start()");time.sleep(2)
        ok(A.evaluate("S.ph")=="boss" and B.evaluate("S.ph")=="boss" and B.evaluate("S.champ")=="vince","시작 → 두 기기 보스 차례 (빈센토)")
        A.evaluate("()=>{S.boss.ap=9;const B=S.boss;for(const [x,y] of [[B.x,B.y+3],[B.x,B.y+4]]){S.map=S.map.slice(0,y*N+x)+'0'+S.map.slice(y*N+x+1)}S.rob=[];S.fac=[];return apply({type:'bossBuild',id:'bomb',p:[[B.x,B.y+3],[B.x,B.y+4]]})}");A.evaluate("()=>sync()");time.sleep(1.5)
        nb=A.evaluate("S.sec.bombs.length")
        # 보스가 게임을 껐다 켬(이어하기) → 비공개 기록에서 숨긴 폭탄까지 복구
        A.evaluate("()=>{S={};}");A.evaluate(f"async()=>{{L.code='{code3}';await rejoin()}}");time.sleep(1.5)
        ok(nb>=1 and A.evaluate("S.sec.bombs.length")==nb and A.evaluate("L.role")=="boss",f"보스 이어하기 → 숨긴 폭탄 {nb}개 그대로 복구")
        ok(not B.evaluate("(S.sec&&S.sec.bombs||[]).length"),"용사 기기엔 폭탄 정보 없음")
    except Exception as e: out.append("EXC "+str(e)[:400])
    b.close()
print("\n".join(out));bad=[o for o in out if not o.startswith(("OK","trap","B DIALOG"))];print(("온라인 테스트 모두 통과" if not bad else str(len(bad))+"개 실패"));sys.exit(1 if bad else 0)
