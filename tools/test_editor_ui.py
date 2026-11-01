"""맵 만들기 화면 테스트(브라우저): 메뉴 버튼, 보스 테마별 도구, 실제 터치·문지르기, 되돌리기, 검사 경고, 내보내기→불러오기,
   새로고침 후 유지, 해 보기·돌아가기, 가로 화면 3단 배치(왼쪽 버튼 / 가운데 맵 / 오른쪽 도구)
   사용법: python3 tools/test_editor_ui.py   (스크린숏은 /tmp 에 저장)"""
import functools, http.server, threading, sys, time, os, tempfile
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));G=os.path.join(ROOT,"game");P=tempfile.gettempdir()+"/ed_"
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
s=http.server.ThreadingHTTPServer(("127.0.0.1",0),functools.partial(Q,directory=G));threading.Thread(target=s.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{s.server_address[1]}/index.html";out=[]
def ok(c,m): out.append(("OK   " if c else "FAIL ")+m)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg=b.new_page(viewport={"width":420,"height":860},has_touch=True);errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e.stack)[:300]));pg.on("dialog",lambda d:d.accept())
    pg.goto(URL);pg.wait_for_function("()=>window.GAME_READY",timeout=15000)
    ok("맵 만들기" in pg.inner_text("#m"),"메뉴에 '맵 만들기' 버튼")
    pg.evaluate("()=>edGo()");pg.evaluate("()=>{ED.pickCh='gron';ui()}")
    pg.evaluate("()=>edNew('gron',0)")
    t=pg.inner_text("#pn")
    t=pg.inner_text("#qk");ok("가시 함정" in t and "구덩이" in t and "로봇" not in t and "공장" not in t,"그론 테마 도구: 함정·구덩이 있음, 로봇·공장 없음")
    pg.screenshot(path=P+"ed_gron.png",full_page=True)
    pg.evaluate("()=>edNew('vince',0)")
    t=pg.inner_text("#qk")
    ok("로봇" in t and "공장" in t and "가시 함정" not in t and "구덩이" not in t,"빈센토 테마 도구: 로봇·공장 있음, 가시 함정·구덩이 없음")
    # 실제 터치: 로봇 Lv3 도구 → 칸 터치
    pg.evaluate("()=>{edPick('robot');ED.lv=3;ui();Z=24;draw()}")
    box=pg.locator("#c").bounding_box()
    pg.evaluate("()=>document.getElementById('w').scrollTo(0,0)");box=pg.locator("#c").bounding_box()
    pg.mouse.click(box["x"]+10*24+12,box["y"]+12*24+12)
    ok(pg.evaluate("edMap().objects.some(o=>o.type=='robot'&&o.lv==3&&o.x==10&&o.y==12)"),"화면 터치로 로봇 Lv3 놓기 (10,12)")
    ok(pg.evaluate("S.rob.some(r=>r.lv==3&&r.x==10&&r.y==12)"),"미리보기 화면에 바로 반영 (실제 게임 상태)")
    pg.mouse.click(box["x"]+10*24+12,box["y"]+12*24+12)
    ok(not pg.evaluate("edMap().objects.some(o=>o.type=='robot')"),"같은 칸 다시 터치 → 지워짐")
    # 문지르기: 벽 한 줄로 길 막기 → 검사 경고
    pg.evaluate("()=>{edPick('wall');ui();document.getElementById('w').scrollTo(0,10*24)}");box=pg.locator("#c").bounding_box()
    y=20;pg.mouse.move(box["x"]+1*24+5,box["y"]+y*24+12);pg.mouse.down()
    for x in range(1,29): pg.mouse.move(box["x"]+x*24+12,box["y"]+y*24+12)
    pg.mouse.up()
    ok(pg.evaluate("edMap().tiles[20]")=="#"*30,"문질러서 벽 한 줄 그리기")
    ok("문제" in pg.inner_text("#st") and pg.evaluate("edErrs().some(e=>/길이 없어요/.test(e))"),"길이 막히면 검사 경고 표시")
    ok(pg.evaluate("document.querySelector('#pn button.go').disabled"),"문제가 있으면 '해 보기' 잠김")
    pg.evaluate("()=>edUndo(0)")
    ok(pg.evaluate("edMap().tiles[20]")!="#"*30 and not pg.evaluate("edErrs().length"),"되돌리기 한 번으로 한 줄 전체 취소 → 검사 통과")
    pg.evaluate("()=>{edPick('robot');ED.lv=2;ui();edApply(8,15,1);edApply(9,15,1);edPick('factory');edApply(20,14,1);edPick('bomb');ED.bdir=[0,1];edApply(15,18,1);edPick('belt');ED.dir=0;edApply(5,22,1);edApply(6,22,1);edChanged()}")
    pg.evaluate("()=>edRename('테스트 공장 맵')")
    ok(pg.evaluate("edMap().objects.length")==6 and not pg.evaluate("edErrs().length"),"로봇 2·공장·폭탄로봇·컨베이어 2 → 검사 통과")
    pg.screenshot(path=P+"ed_vince.png",full_page=True)
    # 내보내기 → 불러오기
    pg.evaluate("()=>edExport()");code=pg.evaluate("ED.code")
    ok(code.startswith("PDRMAP1:") and len(code)>100,"내보내기 코드 생성 ("+str(len(code))+"자)")
    pg.evaluate("()=>edHomeGo()");pg.fill("#edi",code);pg.evaluate("()=>edImport()")
    ok(pg.evaluate("edMap().name")=="테스트 공장 맵" and pg.evaluate("edMap().objects.length")==6 and pg.evaluate("ED.list.length")==3,"코드 불러오기 → 같은 맵이 새 초안으로")
    # 자동 저장: 새로고침해도 초안 남음
    pg.reload();pg.wait_for_function("()=>window.GAME_READY",timeout=15000);pg.evaluate("()=>{edGo()}")
    ok(pg.evaluate("ED.list.length")==3 and "테스트 공장 맵" in pg.inner_text("#pn"),"새로고침해도 초안 3개 그대로 (자동 저장)")
    # 해 보기 (용사로)
    did=pg.evaluate("ED.list[0].id");pg.evaluate(f"()=>{{edOpen('{did}');edPlay('hero')}}")
    time.sleep(1.5)
    ok(pg.evaluate("L.scr")=="game" and pg.evaluate("S.champ")=="vince" and pg.evaluate("S.cmap&&S.cmap.name")=="테스트 공장 맵","해 보기: 초안 맵으로 게임 시작 (빈센토)")
    pg.evaluate("()=>{['knight','cleric','mage'].forEach(k=>pickK(k));start()}");time.sleep(1.5)
    ok(pg.evaluate("S.rob.length")>=2 and pg.evaluate("S.fac.length")>=1 and pg.evaluate("S.belts.length")==2,"게임 판에 내가 놓은 로봇·공장·컨베이어")
    ok("맵 만들기로 돌아가기" in pg.inner_text("#pn"),"게임 중 '맵 만들기로 돌아가기' 버튼")
    pg.screenshot(path=P+"ed_play.png")
    pg.evaluate("()=>edBackFromPlay()")
    ok(pg.evaluate("L.scr")=="editor" and pg.evaluate("ED.view")=="edit","돌아가기 → 편집 화면")
    # 가로 화면
    pg.set_viewport_size({"width":1280,"height":720});pg.evaluate("()=>{L.fit=0;ui()}");time.sleep(.3)
    gb=pg.locator("#qk").bounding_box();wb=pg.locator("#w").bounding_box();lb=pg.locator("#pn").bounding_box()
    ok(gb["x"]>wb["x"]+wb["width"]-5 and lb["x"]+lb["width"]<wb["x"]+5 and pg.evaluate("document.getElementById('c').height+8")==round(wb["height"]),"가로(PC) 화면: 왼쪽 버튼 / 가운데 맵(딱 맞음) / 오른쪽 도구")
    pg.screenshot(path=P+"ed_land.png")
    pg.set_viewport_size({"width":844,"height":390});pg.evaluate("()=>{L.fit=0;ui()}");time.sleep(.3)
    gb=pg.locator("#qk").bounding_box();wb=pg.locator("#w").bounding_box();lb=pg.locator("#pn").bounding_box()
    ok(gb["x"]>wb["x"]+wb["width"]-5 and lb["x"]+lb["width"]<wb["x"]+5 and wb["height"]<=390,"폰 가로 화면도 3단, 맵이 화면 높이 안에 들어옴")
    pg.screenshot(path=P+"ed_phone_land.png")
    b.close()
print("\n".join(out));bad=[o for o in out if not o.startswith("OK")]+errs[:3];print("맵 만들기 화면 테스트 모두 통과" if not bad else str(len(bad))+"개 실패");sys.exit(1 if bad else 0)
