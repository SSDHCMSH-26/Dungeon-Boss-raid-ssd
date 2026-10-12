"""두 버전의 게임을 같은 조건으로 돌려서 결과가 똑같은지 비교하는 테스트.

사용법:  python3 tools/compare_versions.py <이전 game 폴더> [이후 game 폴더] [--games N]
  - 이후 폴더 기본값: game/
  - 이전 폴더 만들기 예:  git archive origin/main game | tar -x -C /tmp/before   → /tmp/before/game
  - 각 폴더를 로컬 웹서버(http)로 띄워서 엽니다(data/*.json 은 file:// 로는 안 열림).
확인 내용 (난수·시각을 고정해서 두 버전을 똑같이 진행)
 1. 게임 데이터(용사·스킬·챔피언·아이템·몬스터 수치)가 같은지
 2. 메뉴·용사 선택 화면, 디자인 3종 × 챔피언 2명 게임 화면 픽셀이 같은지
 3. 규칙 테스트(상자·몬스터, 벽) 결과가 같은지
 4. 미믹·고블린 전용 시나리오(상자 개봉 문구·정보 창·제압·추격·강탈·처치) 결과가 같은지
 5. 화면 글자: 모든 유닛 정보 창(정보·스킬 탭)·행동 메뉴·빠른 버튼·확정 창, 상태별(발전기 파괴, 마비, 크리스탈 등)
    + 보스·용사 행동 기록(발전, 크리스탈, 빈센토 피해 감소, 공장 파괴 보상 등)이 같은지
 6. 컴퓨터끼리 대전(AI 대전) N판 결과가 한 판도 빠짐없이 같은지
"""
import functools, http.server, json, os, re, sys, tempfile, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
GAMES = int(sys.argv[sys.argv.index('--games') + 1]) if '--games' in sys.argv else 40
if '--games' in sys.argv:
    args.remove(str(GAMES))
BEFORE = os.path.abspath(args[0])
AFTER = os.path.abspath(args[1] if len(args) > 1 else os.path.join(ROOT, 'game'))
fails = []


def check(ok, msg):
    print(('OK   ' if ok else 'FAIL ') + msg, flush=True)
    if not ok:
        fails.append(msg)


def serve(d):
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    h = functools.partial(Q, directory=d)
    s = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, f'http://127.0.0.1:{s.server_address[1]}/index.html'


INIT = """(()=>{let s=12345;Math.random=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);
t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};const T=1760000000000;Date.now=()=>T;
performance.now=()=>0;try{localStorage.clear()}catch(e){}})();"""
READY = "()=>{try{return typeof ui=='function'&&typeof CLS=='object'}catch(e){return false}}"

# 데이터 비교: 전역 표(있는 것만) + 챔피언별로 게임을 시작했을 때 실제로 쓰이는 값(보스·발전기·용사 시작 상태, AP·이동)
DATA = """()=>{const g=n=>{try{const v=window.eval(n);return typeof v=='function'?'(함수)':v}catch(e){return '(없음)'}};
const o={};['CLS','CH','ITEMS','TR','TMAX','BOMBV','RHP','CRMAX','CRLIFE'].forEach(n=>o[n]=g(n));
const sy=sync;sync=()=>{};o.start={};for(const c of ['gron','vince']){S=newS();S.champ=c;S.pick=['knight','cleric','mage'];S.map=genMap(c);start();
o.start[c]={boss:S.boss,gen:S.gen,heroes:S.heroes,bMax:bMax(),bMv:bMv(),log:S.log}}sync=sy;return JSON.stringify(o)}"""

SETUP = """async who=>{sync=()=>{};S=newS();L.mode='local';L.role=who;L.scr='game';
document.getElementById('m').style.display='none';document.getElementById('g').style.display='block';
try{draw();ui()}catch(e){}await new Promise(r=>setTimeout(r,200));return 1}"""

SHOT = """async ([design,champ])=>{sync=()=>{};L.design=design;S=newS();S.champ=champ;S.pick=['knight','cleric','mage'];
S.map=genMap(champ);start();L.mode='local';L.role='hero';L.scr='game';
document.getElementById('m').style.display='none';document.getElementById('g').style.display='block';
const h=S.heroes[0];S.mobs=[{id:90,k:'mimic',x:h.x+1,y:h.y,hp:20,mx:20},{id:91,k:'gob',x:h.x,y:h.y+1,hp:30,mx:30,gold:0,loot:[],items:[]}];
S.chests=[{id:92,x:h.x+1,y:h.y+1,k:'t',age:0}];
for(let i=0;i<8;i++){try{draw();ui()}catch(e){}await new Promise(r=>setTimeout(r,60))}
try{draw();ui()}catch(e){}return 1}"""

# 미믹·고블린 전용 시나리오: 함정 상자 개봉 → 제압 틱 → 깨어남·추격·공격, 고블린 이동·강탈·처치
MOBS = """()=>{const r=[];try{sync=()=>{};
const run=(champ,pick)=>{S=newS();S.champ=champ;S.pick=pick;S.map='0'.repeat(N*N);start();S.map='0'.repeat(N*N);
L.mode='local';L.role='hero';L.scr='game';S.chests=[];S.mobs=[];S.rob=[];S.fac=[];S.walls=[];S.boss.x=27;S.boss.y=27;
S.heroes.forEach((h,i)=>{h.x=4+i*6;h.y=5;h.gold=5+i*3});S.bag={b:{potion:0,scroll:0,gem:0},h:{potion:1,scroll:1,gem:1}}};
for(let t=0;t<30;t++){run(t%2?'vince':'gron',[['knight','cleric','archer'],['mage','archer','cleric'],['knight','mage','archer']][t%3]);
const u=S.heroes[t%3];const c={x:u.x+1,y:u.y,k:'x',id:500+t};S.chests.push(c);const m0=chOpen(c,'h',u);const lg=[m0,JSON.stringify(S.mobs),u.sup,u.hp];L.act=null;S.ph='hero';L.insp={t:'m',i:S.mobs[0].id};L.itab='info';lg.push(ipH());L.itab='skill';lg.push(ipH());L.itab='info';L.insp=null;
for(let i=0;i<6;i++){S.ph='resolve';S.atks=[];resolve();lg.push(S.log,JSON.stringify(S.mobs),JSON.stringify(S.heroes.map(h=>[h.x,h.y,h.hp,h.sup,h.gold,h.dead])),JSON.stringify(S.bag.h))}
if(S.mobs[0]){dealHits([{o:S.mobs[0],n:'몹'}],99,CLS.archer,'x');lg.push(S.log,JSON.stringify(S.heroes.map(h=>h.gold)),JSON.stringify(S.bag.h))}
r.push(lg)}
// 방치된 함정 상자 → 몬스터 출현
run('gron',['knight','cleric','archer']);for(let i=0;i<8;i++)S.chests.push({x:10+i,y:20,k:i%2?'x':'t',id:900+i,age:11});const o=[];chAge(o);r.push(o,JSON.stringify(S.mobs));
}catch(e){r.push('ERR '+e.stack)}return r}"""

# 화면 글자 시나리오: 정보 창·메뉴·기록 문장을 상태별로 모아서 비교
UITEXT = """()=>{const r=[];try{sync=()=>{};
const grab=tag=>{const o={tag};L.act=null;L.menu=1;o.am=amH();o.qk=qkH();
const us=[{t:'B'},{t:'G'}].concat(S.heroes.map((h,i)=>({t:'h',i})),(S.cry||[]).map((c,i)=>({t:'c',i})),S.rob.map(q=>({t:'r',i:q.id})),S.fac.map(f=>({t:'f',i:f.id})),(S.mobs||[]).map(m=>({t:'m',i:m.id})));
o.ip=us.map(u=>{L.insp=u;L.itab='info';const a=ipH();L.itab='skill';const b=ipH();L.itab='info';return a+b});L.insp=null;r.push(o)};
for(const c of ['gron','vince']){S=newS();S.champ=c;S.pick=['knight','cleric','mage'];S.map='0'.repeat(N*N);start();S.map='0'.repeat(N*N);L.mode='local';L.role='boss';L.scr='game';
S.cry=[{x:3,y:3,t:5,k:'b'},{x:4,y:3,t:5,k:'y'}];S.mobs=[];S.chests=[];
S.ph='boss';grab(c+' 보스 차례');
if(c=='vince'){S.fac=[{id:1,x:5,y:8,hp:40,mx:40,lv:1,cd:3,en:0}];S.rob=[{id:1,fid:1,x:8,y:8,hp:8,mx:8,lv:1}];L.bsel='g';grab(c+' 발전기 탭');L.bsel='v';
r.push('발전:'+genCharge()+' '+S.log);S.boss.mvb=2;grab(c+' 노랑 크리스탈');S.boss.mvb=0;
const h=S.heroes[0];h.x=3;h.y=3;r.push('크리스탈:'+crEat('h',h,3,3)+crEat('h',h,4,3)+' ap '+h.ap+' mvb '+h.mvb);
dealHits([{o:S.boss,n:'빈센토'}],30,CLS.mage,'파이어볼');r.push(S.log,S.boss.hp);
S.fac[0].hp=1;dealHits([{o:S.fac[0],n:'공장'}],30,CLS.mage,'파이어볼');r.push(S.log);S.ph='resolve';S.atks=[];resolve();r.push(S.log,S.boss.ap,S.gen.ap);
S.gen.hp=1;dealHits([{o:S.gen,n:'발전기'}],30,CLS.mage,'파이어볼');r.push(S.log);S.ph='boss';S.boss.ap=bMax();grab(c+' 발전기 파괴');r.push('bMax '+bMax()+' bMv '+bMv())}
S.ph='hero';L.role='hero';S.heroes[0].par=1;S.heroes[1].mc=1;S.heroes[1].ap=5;S.heroes[2].sup=0;grab(c+' 용사 차례');
for(let i=0;i<3;i++){L.si=i;for(const a of ['m','x',0,1,2]){L.act=a;L.picks=[];r.push(c+' cf '+i+' '+a+' '+cfH())}}L.act=null;
S.ph='boss';L.role='boss';for(const a of ['m','a0','a1','e0','e1','e2','e3']){L.act=a;L.picks=[];try{r.push(c+' cfB '+a+' '+cfH())}catch(e){r.push('x')}}L.act=null;
S.ph='resolve';S.atks=[];resolve();r.push(c+' 다음 턴 '+S.log+' '+JSON.stringify(S.heroes.map(h=>[h.ap,h.mc])))}
}catch(e){r.push('ERR '+e.stack)}return r}"""

RULES_MOBS = open(os.path.join(ROOT, 'tools', 'test_mobs_example.py'), encoding='utf-8').read()
RULES_WALLS = open(os.path.join(ROOT, 'tools', 'test_walls_example.py'), encoding='utf-8').read()
SIM = open(os.path.join(ROOT, 'tools', 'sim.py'), encoding='utf-8').read()
js_of = lambda py: re.search(r'pg\.evaluate\("""(.*?)"""\)', py, re.S).group(1)
SIM_JS = re.search(r'JS="""(.*?)"""', SIM, re.S).group(1)


def page(b, url, errs, **kw):
    pg = b.new_page(viewport={'width': 520, 'height': 1000}, **kw)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('response', lambda r: errs.append(f'HTTP {r.status} {r.url}') if r.status >= 400 else None)
    pg.add_init_script(INIT)
    pg.goto(url)
    pg.wait_for_function(READY, polling=100, timeout=15000)
    pg.wait_for_timeout(500)
    return pg


def run(url, tag, b, shots):
    errs, res = [], {}
    pg = page(b, url, errs)
    res['data'] = pg.evaluate(DATA)
    res['shots'] = {}
    f = os.path.join(shots, f'{tag}_menu.png'); pg.screenshot(path=f, full_page=True); res['shots']['menu'] = f
    for who in ['hero', 'boss']:
        pg.evaluate(SETUP, who)
        f = os.path.join(shots, f'{tag}_setup_{who}.png'); pg.screenshot(path=f, full_page=True); res['shots']['setup_' + who] = f
    for design in ['old', 't2', 't3']:
        for champ in ['gron', 'vince']:
            pg.evaluate(SHOT, [design, champ])
            f = os.path.join(shots, f'{tag}_{design}_{champ}.png'); pg.screenshot(path=f, full_page=True)
            res['shots'][design + '_' + champ] = f
    pg.close()
    for name, js in [('rules_mobs', js_of(RULES_MOBS)), ('rules_walls', js_of(RULES_WALLS)), ('mob_scenarios', MOBS), ('ui_text', UITEXT)]:
        p2 = page(b, url, errs); res[name] = p2.evaluate(js); p2.close()
    p3 = page(b, url, errs)
    res['sim'] = [p3.evaluate(SIM_JS, [c, None, GAMES, 40]) for c in ['gron', 'vince']]
    p3.close()
    res['errs'] = errs
    return res


def main():
    shots = tempfile.mkdtemp(prefix='cmpshots_')
    s1, u1 = serve(BEFORE)
    s2, u2 = serve(AFTER)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        A = run(u1, 'before', b, shots)
        B = run(u2, 'after', b, shots)
        b.close()
    s1.shutdown(); s2.shutdown()

    check(A['data'] == B['data'], f"게임 데이터 동일 ({len(B['data']):,}자)")
    from PIL import Image, ImageChops
    for k in A['shots']:
        ia, ib = Image.open(A['shots'][k]).convert('RGB'), Image.open(B['shots'][k]).convert('RGB')
        check(ia.size == ib.size and ImageChops.difference(ia, ib).getbbox() is None, f'화면 픽셀 동일: {k}')
    for k in ['rules_mobs', 'rules_walls', 'mob_scenarios', 'ui_text']:
        err = any('ERR' in str(x)[:4] for x in B[k])
        check(A[k] == B[k] and not err, f'{k} 결과 동일 ({len(B[k])}항목)')
    sims = B['sim']
    games = [g for r in sims for g in r]
    ok = A['sim'] == sims and not any('err' in g for g in games)
    hw = sum(g.get('w') == 'H' for g in games); bw = sum(g.get('w') == 'B' for g in games)
    check(ok, f'AI 대전 결과 동일 ({len(games)}판 · 용사 승 {hw} / 보스 승 {bw} / 무승부 {len(games) - hw - bw})')
    check(not B['errs'], '이후 버전 페이지 오류 없음 ' + str(B['errs'][:3]))
    check(not A['errs'], '이전 버전 페이지 오류 없음 ' + str(A['errs'][:3]))
    print('스크린샷 폴더:', shots)
    print('결과:', '모두 통과' if not fails else f'{len(fails)}개 실패')
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
