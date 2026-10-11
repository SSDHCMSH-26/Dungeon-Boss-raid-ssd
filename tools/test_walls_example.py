
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium');pg=b.new_page(viewport={'width':520,'height':1000});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('**/*',lambda r:r.continue_() if r.request.url.startswith('file:') else r.abort())
    pg.goto('file:///mnt/user-data/outputs/boss-raid-v58.html');pg.wait_for_timeout(600)
    print(pg.evaluate("""()=>{const r=[];try{
    S=newS();S.champ='gron';S.pick=['mage','knight','cleric'];S.map=genMap('gron');start();L.mode='local';L.role='hero';L.scr='game';L.design='t2';
    const m=S.heroes[0];S.map='1'.repeat(N)+('1'+'0'.repeat(N-2)+'1').repeat(N-2)+'1'.repeat(N);S.map=S.map.slice(0,5*N+6)+'1'+S.map.slice(5*N+7);S.walls=[];L.used={};
    m.x=5;m.y=5;m.ap=10;S.boss.x=25;S.boss.y=25;S.heroes[1].x=1;S.heroes[1].y=20;S.heroes[2].x=3;S.heroes[2].y=20;
    r.push('map wall at 6,5: '+sw(6,5));
    r.push('break map '+act(m,'x',6,5)+' sw '+sw(6,5)+' ap '+m.ap+' '+S.log);
    S.walls=[{x:7,y:5,t:9,lv:3,hp:60}];
    r.push('lv3 hit1 '+act(m,'x',7,5)+' hp '+S.walls[0]?.hp);act(m,'x',7,5);r.push('hit2 hp '+S.walls[0]?.hp);act(m,'x',7,5);r.push('hit3 gone '+(S.walls.length==0)+' '+S.log);
    // levelup hp via bEx
    S.map='0'.repeat(N*N);S.walls=[];S.boss.ap=30;S.boss.x=10;S.boss.y=10;L.used={};const W=CH.gron.ex[0];const P=[[12,10],[13,10],[14,10]];
    bEx(W,P);r.push('lv1 hp '+S.walls[0].hp);bEx(W,P);r.push('lv2 hp '+S.walls[0].hp);bEx(W,P);r.push('lv3 hp '+S.walls[0].hp);
    // fireball on map wall and ult far
    S.map='1'.repeat(N)+('1'+'0'.repeat(N-2)+'1').repeat(N-2)+'1'.repeat(N);S.map=S.map.slice(0,9*N+14)+'1'+S.map.slice(9*N+15)+'';S.map=S.map.slice(0,20*N+20)+'1'+S.map.slice(20*N+21);S.walls=[];m.x=10;m.y=9;m.ap=10;m.cd={};
    r.push('fire '+act(m,0,14,9)+' sw '+sw(14,9)+' '+S.log);
    m.ap=10;r.push('ult '+act(m,2,10,9)+' far wall 20,20 still '+sw(20,20)+' mw keys '+Object.keys(S.mw||{}).length);
    }catch(e){r.push('ERR '+e.stack)}return r}"""))
    print(errs);b.close()
