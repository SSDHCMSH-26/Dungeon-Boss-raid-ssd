"""이미지 분리 전/후 비교 테스트.

사용법:  python3 tools/test_art_split.py <분리 전 index.html> [분리 후 index.html]
  (분리 후 기본값: game/index.html)
확인 내용
 1. 분리 후 HTML 에 base64 그림이 남아 있지 않은지, 모든 그림 경로의 파일이 실제로 있는지
 2. 분리 전 base64 와 분리 후 파일 내용이 바이트 단위로 같은지
 3. 브라우저에서 모든 그림이 열리는지(가로·세로 크기 동일)
 4. 디자인 3종 × 챔피언 2명 화면을 같은 난수로 그려 픽셀이 완전히 같은지
 5. 규칙 테스트(상자·몬스터·벽)와 컴퓨터끼리 대전 결과가 같은 난수에서 완전히 같은지
"""
import base64, os, re, subprocess, sys, tempfile
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BEFORE = os.path.abspath(sys.argv[1])
AFTER = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'game', 'index.html'))
TABLES = ['T3A', 'ART', 'ART2', 'ART3', 'MOBA', 'FXD']
fails = []


def check(ok, msg):
    print(('OK   ' if ok else 'FAIL ') + msg)
    if not ok:
        fails.append(msg)


# 같은 난수·같은 시각으로 고정해서 두 파일을 똑같이 돌리기
INIT = """(()=>{let s=12345;Math.random=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);
t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};const T=1760000000000;Date.now=()=>T;
performance.now=()=>0;try{localStorage.clear()}catch(e){}})();"""

# 모든 그림 목록: {이름: src}
LIST = """()=>{const o={};for(const t of %s){const v=window.eval(t);for(const k in v)o[t+'.'+k]=v[k]}
o.FACE=FACE;o.FACEG=FACEG;CRI&&['y','b'].forEach(k=>o['CRI.'+k]=CRI[k].src);return o}""" % TABLES

LOAD = """async src=>{const out={};for(const k in src){let s=src[k];if(!/^(data:|art\\/|file:)/.test(s))s='data:image/png;base64,'+s;
const im=new Image();im.src=s;try{await im.decode();out[k]=[im.naturalWidth,im.naturalHeight]}catch(e){out[k]='ERR'}}return out}"""

SHOT = """async ([design,champ])=>{sync=()=>{};L.design=design;S=newS();S.champ=champ;S.pick=['knight','cleric','mage'];
S.map=genMap(champ);start();L.mode='local';L.role='hero';L.scr='game';
document.getElementById('m').style.display='none';document.getElementById('g').style.display='block';
const h=S.heroes[0];S.mobs=[{id:90,k:'mimic',x:h.x+1,y:h.y,hp:20,mx:20},{id:91,k:'gob',x:h.x,y:h.y+1,hp:30,mx:30,gold:0,loot:[],items:[]}];
S.chests=[{id:92,x:h.x+1,y:h.y+1,k:'t',age:0}];
for(let i=0;i<8;i++){try{draw();ui()}catch(e){}await new Promise(r=>setTimeout(r,60))}
try{draw();ui()}catch(e){}return 1}"""

RULES_MOBS = open(os.path.join(ROOT, 'tools', 'test_mobs_example.py'), encoding='utf-8').read()
RULES_WALLS = open(os.path.join(ROOT, 'tools', 'test_walls_example.py'), encoding='utf-8').read()
SIM = open(os.path.join(ROOT, 'tools', 'sim.py'), encoding='utf-8').read()
js_of = lambda py: re.search(r'pg\.evaluate\("""(.*?)"""\)', py, re.S).group(1)
SIM_JS = re.search(r'JS="""(.*?)"""', SIM, re.S).group(1)


def run(path, tag, b, shots_dir):
    pg = b.new_page(viewport={'width': 520, 'height': 1000})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
    pg.add_init_script(INIT)
    pg.goto('file://' + path)
    pg.wait_for_timeout(800)
    res = {'list': pg.evaluate(LIST)}
    res['size'] = pg.evaluate(LOAD, res['list'])
    res['shots'] = {}
    for design in ['old', 't2', 't3']:
        for champ in ['gron', 'vince']:
            pg.evaluate(SHOT, [design, champ])
            f = os.path.join(shots_dir, f'{tag}_{design}_{champ}.png')
            pg.screenshot(path=f, full_page=True)
            res['shots'][design + '_' + champ] = f
    pg.close()
    # 규칙 테스트는 새 페이지(같은 난수 시작점)에서
    for name, js in [('mobs', js_of(RULES_MOBS)), ('walls', js_of(RULES_WALLS))]:
        p2 = b.new_page(viewport={'width': 520, 'height': 1000})
        p2.on('pageerror', lambda e: errs.append(str(e)))
        p2.add_init_script(INIT)
        p2.goto('file://' + path); p2.wait_for_timeout(600)
        res[name] = p2.evaluate(js); p2.close()
    p3 = b.new_page(); p3.add_init_script(INIT); p3.goto('file://' + path); p3.wait_for_timeout(600)
    res['sim'] = [p3.evaluate(SIM_JS, [c, ['knight', 'archer', 'mage'], 15, 40]) for c in ['gron', 'vince']]
    p3.close()
    res['errs'] = errs
    return res


def syntax(path):
    html = open(path, encoding='utf-8').read()
    js = max(re.findall(r'<script[^>]*>(.*?)</script>', html, re.S), key=len)
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(js)
    r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True)
    os.unlink(f.name)
    return r.returncode == 0, r.stderr[:300]


def main():
    after_html = open(AFTER, encoding='utf-8').read()
    check('base64,' not in after_html and 'iVBORw0KGgo' not in after_html, '분리 후 HTML 에 base64 그림 없음')
    ok, err = syntax(AFTER)
    check(ok, '분리 후 문법 검사(node --check) ' + err)
    shots_dir = tempfile.mkdtemp(prefix='artshots_')
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        A = run(BEFORE, 'before', b, shots_dir)
        B = run(AFTER, 'after', b, shots_dir)
        b.close()

    check(sorted(A['list']) == sorted(B['list']), f"그림 이름 목록 동일 ({len(B['list'])}개)")
    base = os.path.dirname(AFTER)
    missing, diff = [], []
    for k, src in B['list'].items():
        rel = src.split(base + '/')[-1] if src.startswith('file:') else src
        fp = os.path.join(base, rel)
        if not os.path.isfile(fp):
            missing.append(k); continue
        old = A['list'].get(k, '')
        old = old.split('base64,', 1)[1] if old.startswith('data:') else old
        if open(fp, 'rb').read() != base64.b64decode(old):
            diff.append(k)
    check(not missing, '모든 그림 파일 존재 ' + str(missing[:5]))
    check(not diff, '분리 전 base64 와 파일 내용 바이트 동일 ' + str(diff[:5]))
    bad = [k for k, v in B['size'].items() if v == 'ERR']
    check(not bad, '브라우저에서 모든 그림 열림 ' + str(bad[:5]))
    check(A['size'] == B['size'], '그림 크기(가로×세로) 동일')

    from PIL import Image, ImageChops
    for k in A['shots']:
        ia, ib = Image.open(A['shots'][k]).convert('RGB'), Image.open(B['shots'][k]).convert('RGB')
        same = ia.size == ib.size and ImageChops.difference(ia, ib).getbbox() is None
        check(same, f'화면 픽셀 동일: {k}')
    for k in ['mobs', 'walls']:
        check(A[k] == B[k] and not any('ERR' in str(x) for x in B[k]), f'규칙 테스트({k}) 결과 동일')
    check(A['sim'] == B['sim'] and not any('err' in x for r in B['sim'] for x in r),
          f"컴퓨터끼리 대전 결과 동일 ({sum(len(r) for r in B['sim'])}판)")
    check(not B['errs'], '분리 후 페이지 오류 없음 ' + str(B['errs'][:3]))
    print('스크린샷 폴더:', shots_dir)
    print('결과:', '모두 통과' if not fails else f'{len(fails)}개 실패')
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
