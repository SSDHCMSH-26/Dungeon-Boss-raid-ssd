import json,re
p='/mnt/user-data/outputs/boss-raid-v56.html';s=open(p).read()
SP='/tmp/claude-0/-home-claude/a63c908e-eec2-5897-953e-b9add746ca33/scratchpad/'
def rep(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80])
    s=s.replace(a,b)
art=json.load(open(SP+'mob_art.json'))
# art + helpers inserted before function hits
helpers='const MOBA='+json.dumps(art)+';const MOBI={};function mobi(k){let i=MOBI[k];if(i===undefined){const d=MOBA[k];if(!d)return MOBI[k]=null;i=MOBI[k]=new Image();i.onload=()=>{if(L.scr=="game")draw()};i.src="data:image/png;base64,"+d}return i&&i.complete&&i.naturalWidth?i:null}\n'
helpers+=r'''const mobAt=(x,y)=>(S.mobs||[]).find(m=>m.x==x&&m.y==y);
function mobClean(){let m="";S.bag=S.bag||{b:{potion:0,scroll:0,gem:0},h:{potion:0,scroll:0,gem:0}};(S.mobs||[]).filter(x=>x.hp<=0).forEach(x=>{if(x.k=="mimic"){const v=S.heroes[x.vi];if(v&&v.sup>0){v.sup=0;m+=" 🔓미믹 처치! "+CLS[v.k].n+" 제압 해제"}else m+=" 💀미믹 처치!"}else{m+=" 💀보물 고블린 처치!";let any=0;(x.loot||[]).forEach(([i,n])=>{const h=S.heroes[i];if(h){h.gold=(h.gold||0)+n;any=1}});(x.items||[]).forEach(k=>{S.bag.h[k]++;any=1});if(any)m+=" 훔친 물건 회수!"}});S.mobs=(S.mobs||[]).filter(x=>x.hp>0);return m}
function mobSpawn(c,k,u){S.mobs=S.mobs||[];S.mid=S.mid||1;let x=c.x,y=c.y;if(hAt(x,y)||mobAt(x,y)||inB(x,y)||inG(x,y)||rb(x,y)){const cs=[];for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)cs.push([c.x+dx,c.y+dy]);cs.sort((a,b)=>ch(a[0],a[1],c.x,c.y)-ch(b[0],b[1],c.x,c.y)||Math.random()-.5);const q=cs.find(z=>!bad(z[0],z[1])&&!mobAt(z[0],z[1]));if(q){x=q[0];y=q[1]}}
const m=k=="mimic"?{id:S.mid++,k,x,y,hp:20,mx:20,hold:1,vi:S.heroes.indexOf(u)}:{id:S.mid++,k,x,y,hp:30,mx:30,gold:0,loot:[],items:[]};S.mobs.push(m);return m}
function mobStep(m,t,n){if(ch(t.x,t.y,m.x,m.y)<=1)return;const st=m.y*N+m.x,pv={[st]:-1},q=[[m.x,m.y]];let end=-1;while(q.length){const [x,y]=q.shift();if(ch(x,y,t.x,t.y)<=1){end=y*N+x;break}for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const nx=x+dx,ny=y+dy,i=ny*N+nx;if((dx||dy)&&pv[i]===undefined&&!bad(nx,ny)){pv[i]=y*N+x;q.push([nx,ny])}}}
if(end<0)return;const path=[];for(let i=end;i!=st;i=pv[i])path.unshift(i);const pc=path.slice(0,n).map(z=>[z%N,(z/N)|0]);if(!pc.length)return;vpath("m"+m.id,pc);const l=pc[pc.length-1];m.x=l[0];m.y=l[1]}
function mobAct(m,o){const al=()=>S.heroes.filter(h=>!h.dead);if(!al().length)return;
if(m.k=="mimic"){const v=S.heroes[m.vi];if(m.hold){if(v&&!v.dead&&v.sup>0)return;m.hold=0;o.push("👾 미믹이 깨어나 움직이기 시작!")}
const t=al().sort((a,b)=>ch(a.x,a.y,m.x,m.y)-ch(b.x,b.y,m.x,m.y))[0];mobStep(m,t,2);if(ch(t.x,t.y,m.x,m.y)<=1){m.aT=Date.now();o.push("👾미믹→"+CLS[t.k].n+" -"+hurt(t,17))}return}
let ap=2,moved=0,gd=0;while(ap>0&&gd++<6){const hs=al();if(!hs.length)break;const t=hs.sort((a,b)=>(b.gold||0)-(a.gold||0)||ch(a.x,a.y,m.x,m.y)-ch(b.x,b.y,m.x,m.y))[0];
if(ch(t.x,t.y,m.x,m.y)<=1){ap--;m.aT=Date.now();let msg="💰고블린→"+CLS[t.k].n+" 훔치기 -"+hurt(t,15);const r=Math.random();
if(r<.6){const n=Math.min(t.gold||0,3+rn(5));if(n>0){t.gold-=n;m.gold+=n;m.loot.push([S.heroes.indexOf(t),n]);msg+=" · 금화 "+n+" 강탈!"}else msg+=" · 훔칠 금화가 없다"}
else if(r<.8){const bg=S.bag.h,ks=Object.keys(ITEMS).filter(k=>bg[k]>0);if(ks.length){const k=ks[rn(ks.length)];bg[k]--;m.items.push(k);ap++;moved=0;msg+=" · "+ITEMS[k].n+" 강탈! (AP +1 · 이동 1회 추가)"}else msg+=" · 훔칠 아이템이 없다"}
else msg+=" · 훔치기 실패";o.push(msg)}
else if(!moved){moved=1;mobStep(m,t,8);if(ch(t.x,t.y,m.x,m.y)>1)break}else break}}
function mobsAct(o){(S.mobs||[]).slice().forEach(m=>{if(m.hp>0)mobAct(m,o)})}
'''
rep('function hits(x,y,a){',helpers+'function hits(x,y,a){')
rep('S.walls.forEach(w=>{if(w.hp==null)w.hp=20*(w.lv||1);','(S.mobs||[]).forEach(m=>{if(Math.abs(m.x-x)<=a&&Math.abs(m.y-y)<=a)r.push({o:m,n:m.k=="mimic"?"미믹":"보물 고블린"})});S.walls.forEach(w=>{if(w.hp==null)w.hp=20*(w.lv||1);')
rep('const blk=(x,y)=>x<0||y<0||x>=N||y>=N||sw(x,y)||dw(x,y)||fa(x,y)||rb(x,y);','const blk=(x,y)=>x<0||y<0||x>=N||y>=N||sw(x,y)||dw(x,y)||fa(x,y)||rb(x,y)||(S.mobs&&S.mobs.some(m=>m.x==x&&m.y==y));')
rep('S.chests=[];S.cid=1;S.gold=','S.chests=[];S.cid=1;S.mobs=[];S.mid=1;S.gold=')
rep('ap:3,mc:0,guard:0,dead:0}','ap:3,mc:0,guard:0,dead:0,gold:0}')
rep('hs.forEach(e=>e.o.hp-=dv(e));','hs.forEach(e=>{e.o.hp-=dv(e);if(e.o.k=="mimic"||e.o.k=="gob")e.o.hurtT=Date.now()});')
rep('else if(mwClean())S.log+=" 🧱벽 파괴!";','else if(mwClean())S.log+=" 🧱벽 파괴!";S.log+=mobClean();')
# chOpen
a=s.index('u.sup=3;u.ap=0;u.mc=9;return "⛓ "');b=s.index('\n',a)
s=s[:a]+'const mim=Math.random()<.6;if(mim){u.sup=3;u.ap=0;u.mc=9;mobSpawn(c,"mimic",u);return "👾 미믹이었다! "+CLS[u.k].n+" 제압당했다! (최대 3턴 행동불능 · 턴마다 7 피해 · 아군이 곁에 오거나 미믹을 쓰러뜨리면 해제)"}mobSpawn(c,"gob",u);return "💰 보물 고블린이 튀어나왔다! 금화를 가장 많이 가진 용사를 노린다"}'+s[b:]
a=s.index('const r=Math.random(),it=r<.25?"gold"');b=s.index('\n',a)
new='''const gw=[[3,1],[4,3],[5,4],[6,4],[7,3],[8,2],[9,1],[10,1]];let gq=Math.random()*19,gl=3;for(const [v,w] of gw){if(gq<w){gl=v;break}gq-=w}
const r=Math.random(),it=r<.1?"scroll":r<.35?"gem":r<.65?"potion":"empty";if(side=="b")S.gold.b+=gl;else u.gold=(u.gold||0)+gl;if(it!="empty")S.bag[side][it]++;S.cfx.push({x:c.x,y:c.y,t:Date.now(),k:it=="empty"?"gold":it});'''
s=s[:a]+new+s[b:]
rep('return "🎁 "+(side=="b"?"보스":"용사 진영")+"이(가) 보물상자를 열었다! "+(it=="gold"?"💰 금화 획득":it=="empty"?"…텅 비어 있었다":ITEMS[it].n+" 획득")}','return "🎁 "+(side=="b"?"보스":"용사 진영")+"이(가) 보물상자를 열었다! 💰 금화 +"+gl+(it!="empty"?" · "+ITEMS[it].n+" 획득":"")}')
# supTick dmg
rep('h.hp-=10;h.sup--;o.push("⛓ "+CLS[h.k].n+" 제압 -10")','h.hp-=7;h.sup--;o.push("⛓ "+CLS[h.k].n+" 제압 -7")')
# resolve
rep('S.rob.forEach(r=>robAct(r,o));','S.rob.forEach(r=>robAct(r,o));mobsAct(o);')
# tchest def + placement
rep('id:"tchest",n:"📦 함정 상자",c:2,cd:4,pk:1,r:12,d:"일반 보물상자처럼 보이는 함정 상자 설치 · 쿨타임 4턴 · 용사가 다가가면 제압(최대 3턴 행동불능 · 턴마다 10 피해, 아군이 곁에 오면 해제) · 그론이 다가가면 회수 + 쿨타임 초기화"',
 'id:"tchest",n:"📦 함정 상자",c:2,cd:4,pk:1,r:60,d:"일반 보물상자처럼 보이는 함정 상자 설치 · 사거리 맵 전체 · 다른 상자 주변 3×3과는 간격을 둬야 함 · 쿨타임 4턴 · 용사가 다가가면 피해 없이 미믹(60%) 또는 보물 고블린(40%)이 나타남 · 그론이 다가가면 회수 + 쿨타임 초기화"')
rep('||(S.chests||[]).some(c=>c.x==q[0]&&c.y==q[1]))return 0;S.chests=S.chests||[];S.cid=S.cid||1;','||(S.chests||[]).some(c=>ch(c.x,c.y,q[0],q[1])<=1)||mobAt(q[0],q[1]))return 0;S.chests=S.chests||[];S.cid=S.cid||1;')
# AI
rep('S.rob.map(r=>[r.x,r.y]),S.fac.map','S.rob.map(r=>[r.x,r.y]).concat((S.mobs||[]).map(m=>[m.x,m.y])),S.fac.map')
# draw mobs
rep('hpb(v.x*Z,v.y*Z+Z-3,Z,r.hp,r.mx)});','hpb(v.x*Z,v.y*Z+Z-3,Z,r.hp,r.mx)});\n(S.mobs||[]).forEach(m=>{const v=vp("m"+m.id,m.x,m.y);live.add("m"+m.id);const n=Date.now(),mv=v.q.length>0;const st=m.aT&&n-m.aT<700?"atk":m.hurtT&&n-m.hurtT<450?"hit":m.k=="mimic"?"wake":mv?"move":"idle";const im=mobi(m.k+"_"+st)||mobi(m.k+"_idle");if(!im)return;const H=Z*(m.k=="mimic"?1.1:1.3),sc=H/im.naturalHeight,w=im.naturalWidth*sc;cx.fillStyle="#0006";cx.fillRect(v.x*Z+Z*.15,v.y*Z+Z*.85,Z*.7,Z*.12);cx.imageSmoothingEnabled=true;cx.drawImage(im,v.x*Z+Z/2-w/2,v.y*Z+Z-H-1-hop(v),w,H);cx.imageSmoothingEnabled=false;hpb(v.x*Z,v.y*Z+Z-3,Z,m.hp,m.mx);if(m.k=="mimic"&&m.hold)txt("⛓",v.x*Z+Z*.5,v.y*Z-Z*.7,"#fff","center");if(m.k=="gob"&&m.gold)txt("💰"+m.gold,v.x*Z+Z*.5,v.y*Z-Z*.7,"#ffd34d","center")});')
# unitAt
rep('const r=rb(x,y);if(r)return{t:"r",i:r.id};','const mb=mobAt(x,y);if(mb)return{t:"m",i:mb.id};const r=rb(x,y);if(r)return{t:"r",i:r.id};')
# inspect
rep('else if(u.t=="r"){const r=S.rob.find(z=>z.id==u.i);','else if(u.t=="m"){const m=(S.mobs||[]).find(z=>z.id==u.i);if(!m)return"";nm=m.k=="mimic"?"미믹":"보물 고블린";ic=m.k=="mimic"?"👾":"💰";hp=m.hp;mx=m.mx;side="boss";\nif(m.k=="mimic"){const v=S.heroes[m.vi];rows=[["이동","2칸/턴 (제압 중에는 움직이지 않음)"],["상태",m.hold&&v&&v.sup>0?"⛓ "+CLS[v.k].n+" 제압 중 ("+v.sup+"턴 남음)":"깨어남 · 추격 중"]];sk=[["제압","-",1,"상자를 연 용사를 최대 3턴 제압(턴마다 7 피해) · 아군이 곁에 오거나 미믹을 쓰러뜨리면 해제"],["물어뜯기","-",1,"해제 후 인접한 용사에게 피해 17"]]}\nelse{rows=[["AP","최대 2"],["최대 이동","8칸 · 턴당 기본 이동 1회"],["가진 금화","💰 "+(m.gold||0)],["상태","금화를 가장 많이 가진 용사를 추격"]];sk=[["훔치기","1",1,"피해 15 · 금화 60% / 아이템 20% / 실패 20% · 아이템 성공 시 AP +1, 이동 1회 추가"]]}}\nelse if(u.t=="r"){const r=S.rob.find(z=>z.id==u.i);')
# hero gold row
rep('(e.guard?"🛡 방어 중":(e.par>0?"":"정상"))]];','(e.guard?"🛡 방어 중":(e.par>0?"":"정상"))],["금화","💰 "+(e.gold||0)]];')
# bag UI
rep('cnt=bg.potion+bg.scroll+bg.gem;','cnt=bg.potion+bg.scroll+bg.gem,gd=bs?(S.gold&&S.gold.b||0):((sel()&&sel().gold)||0);')
rep('<br><small>모은 아이템 사용</small>','<br><small>💰 \'+gd+\' · 아이템 사용</small>')
rep("if(L.bag)h+='<div class=\"r\">'+Object.keys(ITEMS)","if(L.bag&&!bs)h+='<div class=\"ht\">💰 금화 · '+S.heroes.map(z=>CLS[z.k].n+' '+(z.gold||0)).join(' · ')+'</div>';if(L.bag&&bs)h+='<div class=\"ht\">💰 금화 '+gd+'</div>';\nif(L.bag)h+='<div class=\"r\">'+Object.keys(ITEMS)")
open(p,'w').write(s)
m=max(re.findall(r'<script[^>]*>(.*?)</script>',s,re.S),key=len);open(SP+'v56.js','w').write(m)
