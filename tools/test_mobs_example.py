from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium');pg=b.new_page(viewport={'width':520,'height':1000});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('**/*',lambda r:r.continue_() if r.request.url.startswith('file:') else r.abort())
    pg.goto('file:///mnt/user-data/outputs/boss-raid-v58.html');pg.wait_for_timeout(600)
    print(pg.evaluate("""()=>{const r=[];try{
    sync=()=>{};
    S=newS();S.champ='gron';S.pick=['knight','cleric','archer'];S.map='0'.repeat(N*N);start();S.map='0'.repeat(N*N);L.mode='local';L.role='hero';L.scr='game';L.design='t3';
    document.getElementById('m').style.display='none';document.getElementById('g').style.display='block';
    S.chests=[];S.mobs=[];S.rob=[];S.fac=[];S.walls=[];S.boss.x=25;S.boss.y=25;
    const [k,c,a]=S.heroes;k.x=5;k.y=5;c.x=7;c.y=5;a.x=20;a.y=20;
    // gold dist
    const cnt={};for(let i=0;i<4000;i++){const hh={gold:0};S.chests=[];const ch0={x:1,y:1,k:"t",id:1};S.chests.push(ch0);S.gold={b:0,h:0};S.bag={b:{potion:0,scroll:0,gem:0},h:{potion:0,scroll:0,gem:0}};chOpen(ch0,"h",hh);cnt[hh.gold]=(cnt[hh.gold]||0)+1}
    r.push('gold dist '+JSON.stringify(cnt)+' 4-7 pct '+((cnt[4]+cnt[5]+cnt[6]+cnt[7])/40).toFixed(1));
    // trap chest spawn ratio
    let mi=0,go=0;for(let i=0;i<2000;i++){S.mobs=[];S.chests=[];const hh={...k,sup:0,ap:3};S.heroes[0]=hh;const t={x:10,y:10,k:"x",id:2};S.chests.push(t);chOpen(t,"h",hh);if(S.mobs[0].k=="mimic")mi++;else go++}
    S.heroes[0]=k;k.sup=0;r.push('mimic '+mi+' gob '+go);
    // mimic scenario
    S.mobs=[];S.chests=[];k.sup=0;k.ap=3;k.hp=k.max;k.gold=12;c.gold=3;const t2={x:6,y:5,k:"x",id:3};S.chests.push(t2);
    const msgm=[];let tries=0;while(true){S.mobs=[];S.chests=[t2];k.sup=0;const m=chOpen(t2,"h",k);if(S.mobs[0].k=="mimic"){msgm.push(m);break}if(++tries>50)break}
    r.push('mimic: '+msgm[0]+' | sup '+k.sup+' mob '+JSON.stringify(S.mobs[0]));
    S.ph='resolve';S.atks=[];const hp0=k.hp;resolve();r.push('after resolve1 hp '+(hp0-k.hp)+' sup '+k.sup+' hold '+S.mobs[0].hold+' | '+S.log);
    // ally adjacent -> release (cleric at 7,5 is adjacent to knight? 5 vs 7 dist2) -> move cleric adjacent
    c.x=4;c.y=5;S.ph='resolve';resolve();r.push('after ally adj: sup '+k.sup+' hold '+S.mobs[0].hold+' hp '+k.hp+'/'+k.max+' c.hp '+c.hp+' | '+S.log);
    // kill mimic by archer fireball? use dealHits
    S.mobs[0].hp=20;k.sup=2;S.mobs[0].hold=1;S.mobs[0].vi=0;dealHits([{o:S.mobs[0],n:"미믹"}],20,CLS.archer,"x");r.push('mimic killed: mobs '+S.mobs.length+' sup '+k.sup+' | '+S.log);
    // goblin
    S.mobs=[];k.hp=k.max;c.hp=c.max;a.hp=a.max;k.gold=5;c.gold=12;a.gold=0;k.x=5;k.y=5;c.x=15;c.y=5;a.x=20;a.y=20;S.bag.h={potion:2,scroll:1,gem:0};
    S.mobs.push({id:50,k:"gob",x:10,y:10,hp:30,mx:30,gold:0,loot:[],items:[]});
    const logs=[];for(let i=0;i<6;i++){S.ph='resolve';S.atks=[];resolve();logs.push(S.log)}
    r.push('goblin pos '+S.mobs[0].x+','+S.mobs[0].y+' gold '+S.mobs[0].gold+' items '+JSON.stringify(S.mobs[0].items)+' hero gold '+S.heroes.map(h=>h.gold)+' bag '+JSON.stringify(S.bag.h));
    r.push(logs.join(' || ').slice(0,900));
    // kill goblin returns loot
    const g=S.mobs[0];const before=S.heroes.map(h=>h.gold);dealHits([{o:g,n:"보물 고블린"}],99,CLS.archer,"x");r.push('goblin dead: gold '+before+' -> '+S.heroes.map(h=>h.gold)+' bag '+JSON.stringify(S.bag.h)+' mobs '+S.mobs.length);
    // tchest placement
    S.champ='gron';S.chests=[{x:12,y:12,k:"t",id:9}];S.boss.x=3;S.boss.y=3;S.boss.ap=20;S.cd={};const T=CH.gron.ex.find(e=>e.id=='tchest');
    r.push('tchest adj '+bEx(T,[[13,12]])+' gap2 '+bEx(T,[[14,12]])+' far '+bEx(T,[[27,27]]));
    }catch(e){r.push('ERR '+e.stack)}return r}"""))
    print(errs);b.close()
