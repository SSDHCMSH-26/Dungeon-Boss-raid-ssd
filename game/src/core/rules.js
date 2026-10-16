/* [규칙] 행동·정산: 용사 스킬, 보스 공격·설치, 몬스터, 상자, 크리스탈, 턴 정산 */
/* 보스 비밀(S.sec)의 공개용 복사본 S.tp/S.bp (천상의 계시로 공개될 때 쓰임) */
function mirrorSec(){S.tp=S.sec.traps.map(t=>[t[0],t[1]]);S.bp=S.sec.bombs.map(b=>({id:b.id,x:b.x,y:b.y,dx:b.dx,dy:b.dy,en:b.en||0}))}
/* 챔피언 고르기 (공개 안 된 챔피언이면 0) */
function chooseChamp(id){if(!CH[id].ok)return 0;S.champ=id;S.boss.hp=S.boss.max=CST().hp;S.boss.ap=CST().ap;S.map=genMap(id);S.fac=[];S.rob=[];S.walls=[];S.log=CH[id].n+" 선택! 맵: "+CH[id].m;return 1}
function mobClean(){let m="";S.bag=S.bag||{b:bag0(),h:bag0()};(S.mobs||[]).filter(x=>x.hp<=0).forEach(x=>{if(x.k=="mimic"){const v=S.heroes[x.vi];if(v&&v.sup>0){v.sup=0;m+=" 🔓미믹 처치! "+CLS[v.k].n+" 제압 해제"}else m+=" 💀미믹 처치!"}else{m+=" 💀보물 고블린 처치!";let any=0;(x.loot||[]).forEach(([i,n])=>{const h=S.heroes[i];if(h){h.gold=(h.gold||0)+n;any=1}});(x.items||[]).forEach(k=>{S.bag.h[k]++;any=1});if(any)m+=" 훔친 물건 회수!"}});S.mobs=(S.mobs||[]).filter(x=>x.hp>0);return m}
function mobSpawn(c,k,u){S.mobs=S.mobs||[];S.mid=S.mid||1;let x=c.x,y=c.y;if(hAt(x,y)||mobAt(x,y)||inB(x,y)||inG(x,y)||rb(x,y)){const cs=[];for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)cs.push([c.x+dx,c.y+dy]);shuffle(cs).sort((a,b)=>ch(a[0],a[1],c.x,c.y)-ch(b[0],b[1],c.x,c.y));const q=cs.find(z=>!bad(z[0],z[1])&&!mobAt(z[0],z[1]));if(q){x=q[0];y=q[1]}}
const m=k=="mimic"?{id:S.mid++,k,x,y,hp:MOB.mimic.hp,mx:MOB.mimic.hp,hold:u?1:0,vi:u?S.heroes.indexOf(u):-1}:{id:S.mid++,k,x,y,hp:MOB.gob.hp,mx:MOB.gob.hp,gold:0,loot:[],items:[]};S.mobs.push(m);return m}
function mobStep(m,t,n){if(ch(t.x,t.y,m.x,m.y)<=1)return;const st=m.y*N+m.x,pv={[st]:-1},q=[[m.x,m.y]];let end=-1;while(q.length){const [x,y]=q.shift();if(ch(x,y,t.x,t.y)<=1){end=y*N+x;break}for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const nx=x+dx,ny=y+dy,i=ny*N+nx;if((dx||dy)&&pv[i]===undefined&&!bad(nx,ny)){pv[i]=y*N+x;q.push([nx,ny])}}}
if(end<0)return;const path=[];for(let i=end;i!=st;i=pv[i])path.unshift(i);const pc=path.slice(0,n).map(z=>[z%N,(z/N)|0]);if(!pc.length)return;PRES.path("m"+m.id,pc);const l=pc[pc.length-1];m.x=l[0];m.y=l[1]}
function mobAct(m,o){const al=()=>S.heroes.filter(h=>!h.dead);if(!al().length||frozen(m))return;
if(m.k=="mimic"){const v=S.heroes[m.vi];if(m.hold){if(v&&!v.dead&&v.sup>0)return;m.hold=0;o.push("👾 미믹이 깨어나 움직이기 시작!")}
const t=al().sort((a,b)=>ch(a.x,a.y,m.x,m.y)-ch(b.x,b.y,m.x,m.y))[0];mobStep(m,t,Math.max(0,MOB.mimic.move-slowOf(m)));if(ch(t.x,t.y,m.x,m.y)<=1){m.aT=NOW();o.push("👾미믹→"+CLS[t.k].n+" -"+hurt(t,MOB.mimic.bite))}return}
let ap=MOB.gob.ap,moved=0,gd=0;while(ap>0&&gd++<6){const hs=al();if(!hs.length)break;const t=hs.sort((a,b)=>(b.gold||0)-(a.gold||0)||ch(a.x,a.y,m.x,m.y)-ch(b.x,b.y,m.x,m.y))[0];
if(ch(t.x,t.y,m.x,m.y)<=1){ap--;m.aT=NOW();let msg="💰고블린→"+CLS[t.k].n+" 훔치기 -"+hurt(t,MOB.gob.steal);const r=RAND();
if(r<MOB.gob.goldChance){const n=Math.min(t.gold||0,MOB.gob.goldMin+rn(MOB.gob.goldMax-MOB.gob.goldMin+1));if(n>0){t.gold-=n;m.gold+=n;m.loot.push([S.heroes.indexOf(t),n]);msg+=" · 금화 "+n+" 강탈!"}else msg+=" · 훔칠 금화가 없다"}
else if(r<MOB.gob.goldChance+MOB.gob.itemChance){const bg=S.bag.h,ks=Object.keys(ITEMS).filter(k=>bg[k]>0);if(ks.length){const k=ks[rn(ks.length)];bg[k]--;m.items.push(k);ap++;moved=0;msg+=" · "+ITEMS[k].n+" 강탈! (AP +1 · 이동 1회 추가)"}else msg+=" · 훔칠 아이템이 없다"}
else msg+=" · 훔치기 실패";o.push(msg)}
else if(!moved){moved=1;mobStep(m,t,Math.max(0,MOB.gob.move-slowOf(m)));if(ch(t.x,t.y,m.x,m.y)>1)break}else break}}
function chAge(o){(S.chests||[]).slice().forEach(c=>{c.age=(c.age||0)+1;if(c.age<CHR.life)return;S.chests=S.chests.filter(z=>z!==c);S.cfx=(S.cfx||[]).filter(f=>NOW()-f.t<4000);if(c.k=="x"){S.cfx.push({x:c.x,y:c.y,t:NOW(),k:"trap"});const mim=RAND()<MOB.trapChest.mimicChance;mobSpawn(c,mim?"mimic":"gob",null);o.push("📦 방치된 함정 상자에서 "+(mim?"👾미믹":"💰보물 고블린")+"이(가) 튀어나왔다!")}else o.push("📦 방치된 보물상자가 사라졌다…")})}
function mobsAct(o){(S.mobs||[]).slice().forEach(m=>{if(m.hp>0)mobAct(m,o)})}
/* 칸(x,y) 반경 a 안의 적(보스·발전기·공장·로봇·몬스터) — 상태를 바꾸지 않음 */
function foes(x,y,a){const r=[],B=S.boss;if(Math.abs(x-B.x)<=1+a&&Math.abs(y-B.y)<=1+a)r.push({o:B,n:CH[S.champ].bn||"보스"});if(S.gen&&S.gen.hp>0&&Math.abs(x-S.gen.x)<=1+a&&Math.abs(y-S.gen.y)<=1+a)r.push({o:S.gen,n:"발전기"});
S.fac.forEach(f=>{if(f.x<=x+a&&f.x+1>=x-a&&f.y<=y+a&&f.y+1>=y-a)r.push({o:f,n:"공장"})});S.rob.forEach(q=>{if(Math.abs(q.x-x)<=a&&Math.abs(q.y-y)<=a)r.push({o:q,n:"로봇"})});(S.mobs||[]).forEach(m=>{if(Math.abs(m.x-x)<=a&&Math.abs(m.y-y)<=a)r.push({o:m,n:m.k=="mimic"?"미믹":"보물 고블린"})});return r}
function hits(x,y,a){const r=foes(x,y,a);S.walls.forEach(w=>{if(w.hp==null)w.hp=WAL.hpPerLv*(w.lv||1);if(Math.abs(w.x-x)<=a&&Math.abs(w.y-y)<=a)r.push({o:w,n:"벽"})});S.mw=S.mw||{};for(let yy=Math.max(1,y-a);yy<=Math.min(N-2,y+a);yy++)for(let xx=Math.max(1,x-a);xx<=Math.min(N-2,x+a);xx++)if(sw(xx,yy)){const k=yy*N+xx;r.push({o:S.mw[k]||(S.mw[k]={x:xx,y:yy,hp:RULE.mapWallHp,mw:1}),n:"벽"})}return r}
function mwClean(){let n=0;S.mw=S.mw||{};for(const k in S.mw){const o=S.mw[k];if(o.hp<=0){if(sw(o.x,o.y))S.map=S.map.slice(0,k)+"0"+S.map.slice(+k+1);delete S.mw[k];n++}else if(o.hp>=RULE.mapWallHp)delete S.mw[k]}return n}
function wDmg(x,y,v){if(dw(x,y)){const w=S.walls.find(z=>z.x==x&&z.y==y);if(w.hp==null)w.hp=WAL.hpPerLv*(w.lv||1);w.hp-=v;if(w.hp<=0){S.walls=S.walls.filter(z=>z!==w);return 1}return 0}if(sw(x,y)){S.mw=S.mw||{};const k=y*N+x,o=S.mw[k]||(S.mw[k]={x,y,hp:RULE.mapWallHp,mw:1});o.hp-=v;return mwClean()?1:0}return 0}
function qp(h,x,y,r){const dx=x-h.x,dy=y-h.y,d=Math.max(Math.abs(dx),Math.abs(dy));if(!d||d>r||(dx&&dy&&Math.abs(dx)!=Math.abs(dy)))return 0;const sx=Math.sign(dx),sy=Math.sign(dy),c=[];for(let i=1;i<=d;i++){const px=h.x+sx*i,py=h.y+sy*i;if(bad(px,py))return 0;c.push([px,py])}return c}
function ride(h){const i=S.heroes.indexOf(h),b0=beltAt(h.x,h.y);if(!b0)return;let n=b0.en?BRUN.enhancedMove:BRUN.move;const cs=[];
while(n-->0){const b=beltAt(h.x,h.y);if(!b)break;const nx=h.x+DX[b.d],ny=h.y+DY[b.d];if(bad(nx,ny))break;h.x=nx;h.y=ny;cs.push([nx,ny])}
if(cs.length){S.mv.push({i,c:cs});PRES.path("h"+i,cs);S.log+=" 🛤️ 컨베이어에 실려 이동! "+crPath("h",h,cs)}}
/* 마법진(마법사): h.cirs = [{j 스킬 번호, x, y 중심, lv 레벨, pw 위력 영창 수, sp 확산 영창 수, ch 이번 턴 영창 받음(이월), hold 영창으로 이월돼 유지 중}, ...] — 개수 제한 없음(스킬 쿨타임으로 조절).
   영창은 용사당 턴당 1번(h.wch), 영창할 마법진을 칸으로 고름. 영창 안 받은 마법진은 그 턴 끝에 발동.
   그 턴에 영창(턴당 1번, 레벨 +1, 그린 턴에도 가능)하면 다음 턴으로 이월, 안 하면 그 용사 턴이 끝날 때(보스 턴 전, 정산 시작) 발동.
   걸은 턴(h.mc>0)엔 영창 불가(→ 그 턴 끝에 발동). 영창으로 유지 중인 마법진(hold)이 있으면 이동 거리 -CIRC.chantMove
   (영창한 그 턴은 아직 아니고 다음 턴부터, 마법진이 발동해 사라지면 복구).
   순간이동 스킬은 언제나 내 마법진 안의 칸으로만. 벽 칸 중심으로는 못 그림(범위·확산은 벽·공장·발전기·유닛 위도 됨). */
const cirW=(h,kd)=>CLS[h.k].sk.find(q=>q.t=="w"&&q.fx.kind==kd);
const cirsOf=h=>h.cirs||[],cirClear=h=>{if(h.cirs&&h.cirs.length){h.cirs=[];return 1}return 0};
function cirR(h,c){const w=cirW(h,"spread");return CLS[h.k].sk[c.j].fx.radius+c.sp*(w?w.fx.add:0)}
function cirV(h,c){const f=CLS[h.k].sk[c.j].fx,w=cirW(h,"power");return f.val[Math.min(c.lv,f.val.length)-1]+c.pw*(w?w.fx.add:0)}
const inMyCir=(h,x,y)=>cirsOf(h).some(c=>inSq(c.x,c.y,cirR(h,c),x,y));
function cirAt(x,y){return S.heroes.some(h=>!h.dead&&inMyCir(h,x,y))}
/* 영창할 수 있는 마법진 중 (x,y) 를 덮는 것(가까운 중심 우선) */
function cirPick(h,x,y){return cirsOf(h).filter(c=>!c.ch&&c.lv<CIRC.maxLv&&inSq(c.x,c.y,cirR(h,c),x,y)).sort((a,b)=>ch(a.x,a.y,x,y)-ch(b.x,b.y,x,y))[0]||null}
/* 정산 시작: 마법진 발동·이월 */
function cirFire(o){S.heroes.forEach(h=>{if(!cirsOf(h).length)return;if(h.dead){h.cirs=[];return}const keep=[];h.cirs.forEach(c=>{if(c.ch){c.ch=0;c.hold=1;keep.push(c);return}if(S.end){keep.push(c);return}
const K=CLS[h.k],s=K.sk[c.j],f=s.fx,R=cirR(h,c),v=cirV(h,c),nm=s.n+" Lv"+c.lv;let m="";
if(f.kind=="shield"){const al=S.heroes.filter(a=>!a.dead&&inSq(c.x,c.y,R,a.x,a.y));al.forEach(a=>a.sh=Math.max(a.sh||0,v));PRES.fx("shield",c.x,c.y,0);m="✨ "+K.n+" "+nm+" 발동! "+(al.length?al.map(a=>CLS[a.k].n).join("·")+" 보호막 "+v:"범위 안에 아군이 없다")}
else{const hs=hits(c.x,c.y,R),en=hs.filter(e=>e.o===S.boss||e.o===S.gen||S.rob.includes(e.o)||(S.mobs||[]).includes(e.o));PRES.fx(f.kind=="meteor"?"fire":"purify",c.x,c.y,0);
if(f.kind=="frost"){const sl=f.slow[c.lv-1]||0,st=c.lv>=f.stunLv;en.forEach(e=>{const r=e.o===S.boss||e.o===S.gen?S.round+1:S.round;if(st)e.o.fz=r;else if(sl)e.o.sl={n:sl,r}})}
if(v>0&&hs.length){dealHits(hs,v,K,nm);m=(f.kind=="meteor"?"🔥 ":"❄️ ")+S.log}else m=(f.kind=="meteor"?"🔥 ":"❄️ ")+K.n+" "+nm+" 발동!"+(hs.length?"":" 맞은 적이 없다");
if(f.kind=="frost"&&en.length){const sl=f.slow[c.lv-1]||0;m+=c.lv>=f.stunLv?" · "+en.map(e=>e.n).join("·")+" 1턴 행동불능":sl?" · "+en.map(e=>e.n).join("·")+" 이동 -"+sl:""}
if(f.kind=="meteor"&&c.lv>=f.burnLv){S.burn=(S.burn||[]).concat({x:c.x,y:c.y,r:R,v:f.burn,until:S.round+1});m+=" · 🔥불바닥 1턴"}}
let np=0;(S.pits||[]).forEach(p=>{if(!p.rv&&[[0,0],[1,0],[0,1],[1,1]].some(([a,b])=>inSq(c.x,c.y,R,p.x+a,p.y+b))){p.rv=1;np++}});if(np)m+=" · 🕳️숨은 구덩이 "+np+"개 발각!";o.push(m)});h.cirs=keep})}
/* 정산 시작: 불바닥(화염 마법진 Lv3) — 다음 정산 때 그 자리에 있는 적에게 피해 */
function burnTick(o){if(!S.burn||!S.burn.length)return;const due=S.burn.filter(b=>b.until==S.round);S.burn=S.burn.filter(b=>b.until>S.round);due.forEach(b=>{if(S.end)return;const hs=hits(b.x,b.y,b.r).filter(e=>e.n!="벽");if(hs.length){dealHits(hs,b.v,{n:"🔥불바닥"},"화염");o.push(S.log)}})}
/* 궁수 화살 공통: 고른 칸 → 8방향, 직선으로 날아가 처음 닿는 적(벽·아군에 막힘). 화면 효과는 S.afx(선·삭제 표시) */
const dirOf=(h,x,y)=>{const dx=x-h.x,dy=y-h.y;if(!(dx||dy)||(dx&&dy&&Math.abs(dx)!=Math.abs(dy)))return null;return [Math.sign(dx),Math.sign(dy)]};
function arrowFirst(h,sx,sy,r){const cs=[];for(let i=1;i<=r;i++){const X=h.x+sx*i,Y=h.y+sy*i;if(X<0||Y<0||X>=N||Y>=N||sw(X,Y)||dw(X,Y)||hAt(X,Y))break;cs.push([X,Y]);const hs=foes(X,Y,0);if(hs.length)return {cs,hs}}return {cs,hs:null}}
function afxAdd(fs){S.afx=(S.afx||[]).filter(f=>NOW()-f.t<3000).concat(fs.map(f=>Object.assign({t:NOW()},f)))}
const arrEnd=(h,d,cs)=>cs.length?cs[cs.length-1]:[h.x+d[0],h.y+d[1]];
/* 그랩: 보스(3×3)를 한 칸 당길 수 있는지 */
function bPullOk(px,py){if(px<1||py<1||px>N-2||py>N-2)return 0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const X=px+a,Y=py+b;if(blk(X,Y)||hAt(X,Y)||inG(X,Y))return 0}return 1}
/* 관통 화살: 한 방향으로 날아가며 벽·함정·폭탄·구덩이·상자·컨베이어를 삭제(맵 가장자리 벽은 남김), 지나간 적에게 fx.dmg */
function pierce(h,s,d,k){const del={},add=n=>del[n]=(del[n]||0)+1,fx=[],hs=[];let end=[h.x,h.y];
for(let i=1;i<=s.r;i++){const X=h.x+d[0]*i,Y=h.y+d[1]*i;if(X<1||Y<1||X>=N-1||Y>=N-1)break;end=[X,Y];const mk=ic=>fx.push({k:"del",x:X,y:Y,ic});
if(sw(X,Y)){S.map=S.map.slice(0,Y*N+X)+"0"+S.map.slice(Y*N+X+1);if(S.mw)delete S.mw[Y*N+X];add("벽");mk("🧱")}
if(dw(X,Y)){S.walls=S.walls.filter(w=>!(w.x==X&&w.y==Y));add("벽");mk("🧱")}
if(S.sec.traps.some(t=>t[0]==X&&t[1]==Y)){S.sec.traps=S.sec.traps.filter(t=>!(t[0]==X&&t[1]==Y));if(S.tp)S.tp=S.tp.filter(t=>!(t[0]==X&&t[1]==Y));add("함정");mk("📍")}
if(S.sec.bombs.some(b=>b.x==X&&b.y==Y)){S.sec.bombs=S.sec.bombs.filter(b=>!(b.x==X&&b.y==Y));if(S.bp)S.bp=S.bp.filter(b=>!(b.x==X&&b.y==Y));add("폭탄");mk("💣")}
const pi=pitAt(X,Y);if(pi>=0){S.pits.splice(pi,1);add("구덩이");mk("🕳️")}
if((S.chests||[]).some(c=>c.x==X&&c.y==Y)){S.chests=S.chests.filter(c=>!(c.x==X&&c.y==Y));add("상자");mk("📦")}
if(beltAt(X,Y)){S.belts=S.belts.filter(b=>!(b.x==X&&b.y==Y));add("컨베이어");mk("🛤️")}
if(s.fx.dmg>0)hits(X,Y,0).filter(e=>e.n!="벽").forEach(e=>{if(!hs.some(z=>z.o===e.o))hs.push(e)})}
afxAdd([{k:"line",a:[h.x,h.y],b:end,c:"#ff9a3c"}].concat(fx));let m=Object.keys(del).map(n=>n+" "+del[n]).join("·");if(hs.length&&!S.end){dealHits(hs,s.fx.dmg,k,s.n);m=S.log+(m?" · 삭제: "+m:"")}else m="🏹 "+k.n+" "+s.n+"! "+(m?"삭제: "+m:"아무것도 없었다");return m}
function act(h,j,x,y,p){const n=S.mv.length,r=act0(h,j,x,y,p);if(r){try{pitCheck(h,n)}catch(e){}try{chestPath(h,n)}catch(e){}}return r}
function pitCheck(h,n){if(h.dead||!S.pits||!S.pits.length||(h.nt&&h.nt[0]==h.x&&h.nt[1]==h.y))return;const i=S.heroes.indexOf(h),ents=S.mv.slice(n).filter(r=>r.i==i),path=[];ents.forEach(r=>r.c.forEach(c=>path.push(c)));const armed=(x,y)=>{const i=pitAt(x,y);return i>=0&&!S.pits[i].rv};let k=path.findIndex(c=>armed(c[0],c[1]));if(k<0){if(!armed(h.x,h.y))return;path.push([h.x,h.y]);k=path.length-1}
const cell=path[k],P=S.pits[pitAt(cell[0],cell[1])];let cnt=0;ents.forEach(r=>{const len=r.c.length;r.c=r.c.slice(0,Math.max(0,k+1-cnt));cnt+=len});
PRES.trim("h"+i,path.length-1-k);const tt=PRES.fallDelay("h"+i);
const cs=S.pits.filter(z=>z!==P).sort((a,b)=>Math.hypot(b.x-P.x,b.y-P.y)-Math.hypot(a.x-P.x,a.y-P.y));let Q=null,ex=null;h.x=cell[0];h.y=cell[1];
for(const q of cs){const c=[[0,0],[1,0],[0,1],[1,1]].map(([a,b])=>[q.x+a,q.y+b]).filter(z=>!bad(z[0],z[1]));if(c.length){Q=q;ex=c[rn(c.length)];break}}
h.hp-=PIT.fallDmg;h.stun=1;if(h.hp<=0){h.hp=0;h.dead=1;cirClear(h)}
S.pits=S.pits.filter(z=>z!==P&&z!==Q);if(ex){h.x=ex[0];h.y=ex[1]}
S.fall=(S.fall||[]).filter(f=>NOW()<f.t+2500).concat({i,t:NOW()+tt,a:[cell[0],cell[1]],b:ex||[cell[0],cell[1]],pa:{x:P.x,y:P.y},pb:Q?{x:Q.x,y:Q.y}:{x:P.x,y:P.y}});
S.log=(S.log?S.log+" ":"")+"🕳️ 숨은 구덩이! "+CLS[h.k].n+" 낙하 -"+PIT.fallDmg+(ex?" · 가장 먼 구덩이로 튕겨 나갔다!":"")+" 💫다음 턴 행동불능"+(h.dead?" 💀":"");
if(S.heroes.every(z=>z.dead))S.end="👹 보스 진영 승리! 용사가 전멸했습니다."}
function dealHits(hs,v,k,nm){const B=S.boss;const dv=e=>e.o===B&&S.champ=="vince"&&S.gen&&S.gen.hp>0?Math.round(v*CST().damageTakenWithGen):v;hs.forEach(e=>{e.o.hp-=dv(e);if(e.o.k=="mimic"||e.o.k=="gob")e.o.hurtT=NOW()});S.log=k.n+" "+nm+" 명중! "+hs.map(e=>e.n+" -"+dv(e)).join(" · ")+(hs.some(e=>e.o===B&&dv(e)<v)?" (🛡발전기 가동 중: 빈센토 피해 -"+pct(1-CST().damageTakenWithGen)+")":"");if(S.fac.some(f=>f.hp<=0)){S.facRef=1;S.log+=" 🏭공장 파괴! 다음 턴 빈센토·발전기 AP +"+CST().factoryKillAp+" 회수"}S.fac=S.fac.filter(f=>f.hp>0);S.rob=S.rob.filter(q=>q.hp>0);if(S.walls.some(w=>w.hp<=0)){S.walls=S.walls.filter(w=>w.hp>0);mwClean();S.log+=" 🧱벽 파괴!"}else if(mwClean())S.log+=" 🧱벽 파괴!";S.log+=mobClean();if(S.gen&&S.gen.hp<=0){S.gen.hp=0;S.log+=" ⚡발전기 파괴!";if(!S.genDead){S.genDead=1;let nn=0;const cs=[];for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++)cs.push([S.gen.x+dx,S.gen.y+dy]);shuffle(cs).sort((a,b)=>ch(a[0],a[1],S.gen.x,S.gen.y)-ch(b[0],b[1],S.gen.x,S.gen.y));for(const [x,y] of cs){if(nn>=ROB.wreckCount)break;if(x<1||y<1||x>=N-1||y>=N-1||bad(x,y)||hAt(x,y)||rb(x,y)||inB(x,y))continue;S.rob.push({id:S.rid++,fid:0,x,y,hp:RHP[ROB.wreckLv-1],mx:RHP[ROB.wreckLv-1],lv:ROB.wreckLv,en:0});nn++}if(nn)S.log+=" 🤖발전기 잔해에서 Lv"+ROB.wreckLv+" 로봇 "+nn+"기 가동!"}}if(B.hp<=0){B.hp=0;S.end="🎉 용사 진영 승리! "+CH[S.champ].n+" 격파!"}}
function act0(h,j,x,y,p){const k=CLS[h.k],B=S.boss;
if(j=="x"&&S.champ=="gron"){if(h.ap<1||ch(x,y,h.x,h.y)>RULE.hero.breakRange||x<1||y<1||x>=N-1||y>=N-1||!(sw(x,y)||dw(x,y)))return 0;const gone=wDmg(x,y,RULE.hero.breakDmg);h.ap--;h.aT=NOW();h.aK="atk";S.log="🔨 "+k.n+"의 벽 부수기! 벽 -"+RULE.hero.breakDmg+(gone?" 🧱벽 파괴!":"");return 1}
if(j=="x"){const b=beltAt(x,y);if(!b||h.ap<1||ch(x,y,h.x,h.y)>RULE.hero.breakRange)return 0;S.belts=S.belts.filter(z=>z!==b);h.ap--;S.log="🔨 "+k.n+"이(가) 컨베이어를 파괴!";return 1}
if(j=="m"){const c=qp(h,x,y,mvOf(h));if(h.ap<1||h.mc>=RULE.hero.movesPerTurn||!c)return 0;h.x=x;h.y=y;h.ap--;h.mc++;S.mv.push({i:S.heroes.indexOf(h),c});PRES.path("h"+S.heroes.indexOf(h),c);{const m=crPath("h",h,c);ride(h);if(m)S.log=m}return 1}
const s=k.sk[j];if(s.t=="g"||s.t=="o"){x=h.x;y=h.y}if(h.ap<s.c||(s.t!="w"&&ch(x,y,h.x,h.y)>s.r))return 0;
if(s.cd&&h.cd&&h.cd[j]>0)return 0;if(s.lim&&h.lu&&(h.lu[j]||0)>=s.lim)return 0;
const sv=()=>s.fx&&s.fx.dmgMax!==undefined?s.fx.dmgMin+Math.floor(RAND()*(s.fx.dmgMax-s.fx.dmgMin+1)):s.v;
if(s.t=="l"){const dx=x-h.x,dy=y-h.y;if(!(dx||dy)||(dx&&dy&&Math.abs(dx)!=Math.abs(dy)))return 0;const sx=Math.sign(dx),sy=Math.sign(dy),fo=[],fr=[];for(let i=1;i<=s.r;i++){const X=h.x+sx*i,Y=h.y+sy*i;if(X<0||Y<0||X>=N||Y>=N)break;if(sw(X,Y)||dw(X,Y)){PRES.fx("burst",X,Y,(i-1)*70);hits(X,Y,0).forEach(e=>{if(!fo.some(z=>z.o===e.o))fo.push(e)});break}PRES.fx("burst",X,Y,(i-1)*70);hits(X,Y,0).forEach(e=>{if(!fo.some(z=>z.o===e.o))fo.push(e)});const a=hAt(X,Y);if(a&&a!==h&&!fr.includes(a))fr.push(a)}
fr.forEach(a=>{a.hp=Math.min(a.max,a.hp+s.fx.heal)});S.log=k.n+" 성광! "+(fr.length?"아군 "+fr.map(a=>CLS[a.k].n).join("·")+" +"+s.fx.heal+" ":"")+(fo.length?"":(fr.length?"":"허공을 비췄다"));if(fo.length)dealHits(fo,s.fx.dmg,k,"성광");
if(!S.end){const nx=h.x-sx,ny=h.y-sy;if(!bad(nx,ny)&&!hAt(nx,ny)){h.x=nx;h.y=ny;S.mv.push({i:S.heroes.indexOf(h),c:[[nx,ny]]});PRES.path("h"+S.heroes.indexOf(h),[[nx,ny]]);S.log+=" ↩반동 1칸"}}}
else if(s.t=="u"){const U=hits(x,y,0).find(e=>e.o===B||e.o===S.gen||S.rob.includes(e.o));if(!U)return 0;mirrorSec();
U.o.bind=U.o===B||U.o===S.gen?s.fx.bindBoss:s.fx.bindOther;S.scan={r:S.round};S.scanB=(S.scanB||[]).concat((S.bp||[]).map(b=>b.id));let np=0,nc=0;(S.pits||[]).forEach(z=>{if(!z.rv){z.rv=1;np++}});(S.chests||[]).forEach(c=>{if(c.k=="x"&&!c.rv){c.rv=1;nc++}});
S.log="✨ "+k.n+" 천상의 계시! 숨은 함정 "+((S.tp||[]).length)+"·폭탄 "+((S.bp||[]).length)+"·구덩이 "+np+"·함정 상자 "+nc+" 공개, "+U.n+" 속박!";PRES.fx("judge",U.o.x,U.o.y,0);(S.tp||[]).forEach(t=>PRES.fx("purify",t[0],t[1],150));(S.bp||[]).forEach(b=>PRES.fx("purify",b.x,b.y,150));(S.pits||[]).forEach(z=>PRES.fx("purify",z.x+.5,z.y+.5,150));(S.chests||[]).filter(c=>c.k=="x").forEach(c=>PRES.fx("purify",c.x,c.y,150))}
else if(s.t=="r"){const dx=x-h.x,dy=y-h.y;if(!(dx||dy)||(dx&&dy&&Math.abs(dx)!=Math.abs(dy)))return 0;const sx=Math.sign(dx),sy=Math.sign(dy),cells=[];let hz=0,msg="",hit=null;const tp=S.tp||[],bp=S.bp||[],cp=new Set();
for(let i=1;i<=s.r;i++){const X=h.x+sx*i,Y=h.y+sy*i;if(X<0||Y<0||X>=N||Y>=N)break;
if(sw(X,Y)||dw(X,Y)){if(sw(X,Y))S.map=S.map.slice(0,Y*N+X)+"0"+S.map.slice(Y*N+X+1);S.walls=S.walls.filter(w=>!(w.x==X&&w.y==Y));msg+=" 🧱벽 파괴!";break}
if(hAt(X,Y)&&hAt(X,Y)!==h)break;
const eh=hits(X,Y,0);if(eh.length){hit=eh;break}
cells.push([X,Y]);
if(tp.some(t=>t[0]==X&&t[1]==Y))hz++;
if(bp.some(b=>b.x==X&&b.y==Y))hz++;
const pi=pitAt(X,Y);if(pi>=0&&!S.pits[pi].rv&&!cp.has(pi)){cp.add(pi);hz++}
if(beltAt(X,Y))hz++;
const tc=(S.chests||[]).find(c=>c.k=="x"&&c.x==X&&c.y==Y);if(tc){S.chests=S.chests.filter(c=>c!==tc);hz++;msg+=" 📦함정 상자 제거!";S.cfx=(S.cfx||[]).filter(f=>NOW()-f.t<4000);S.cfx.push({x:X,y:Y,t:NOW(),k:"trap"})}}
if(cells.length){const L2=cells[cells.length-1];h.x=L2[0];h.y=L2[1];h.nt=[h.x,h.y];PRES.path("h"+S.heroes.indexOf(h),cells);try{crPath("h",h,cells)}catch(e){}}
S.log="🛡️ "+k.n+" 방패돌진! "+cells.length+"칸 돌진 (기세)"+msg;if(hit)dealHits(hit,s.fx.hit,k,"방패돌진");
if(hz>0&&!S.end){const dm=s.fx.recoil*hz;h.hp-=dm;h.hurtT=NOW();S.log+=" · 기세로 무시한 효과 "+hz+"개 → 반동 -"+dm+" · 다음 턴 행동불능";if(h.hp<=0){h.hp=0;h.dead=1;S.log+=" 💀"}else h.stun=1}}
else if(s.t=="s"){const d=dirOf(h,x,y);if(!d)return 0;const r=arrowFirst(h,d[0],d[1],s.r),st=!(h.mc>0||h.mvd),v=s.fx.dmg*(st?s.fx.stillMult:1);afxAdd([{k:"line",a:[h.x,h.y],b:arrEnd(h,d,r.cs),c:"#ffe58a"}]);if(r.hs)dealHits(r.hs,v,k,s.n+(st?" (이동 안 함 ×"+s.fx.stillMult+")":""));else S.log="🏹 "+k.n+" "+s.n+" — 막혔거나 빗나감"}
else if(s.t=="k"){if(bad(x,y)||x==h.x&&y==h.y)return 0;h.x=x;h.y=y;h.mvd=1;h.tpT=NOW();S.mv.push({i:S.heroes.indexOf(h),c:[[x,y]]});PRES.fx("tele",x,y,0);S.log="🪝 "+k.n+" "+s.n+"! 벽을 넘어 이동";const m=crPath("h",h,[[x,y]]);ride(h);if(m)S.log=m}
else if(s.t=="p"){const d=dirOf(h,x,y);if(!d)return 0;const r=arrowFirst(h,d[0],d[1],s.r);afxAdd([{k:"line",a:[h.x,h.y],b:arrEnd(h,d,r.cs),c:"#9fe0ff"}]);if(!r.hs)S.log="🪝 "+k.n+" "+s.n+" — 막혔거나 빗나감";else{const e=r.hs[0],o=e.o;dealHits([e],s.fx.dmg,k,s.n);let n=0;const pc=[];
if(!S.end&&o.hp>0){const mob=(S.mobs||[]).includes(o),rob=S.rob.includes(o);if(o===S.boss){for(let i=0;i<s.fx.pull&&bPullOk(o.x-d[0],o.y-d[1]);i++){o.x-=d[0];o.y-=d[1];pc.push([o.x,o.y]);n++}if(n)PRES.path("B",pc)}
else if(mob||rob){for(let i=0;i<s.fx.pull;i++){const nx=o.x-d[0],ny=o.y-d[1];if(bad(nx,ny))break;o.x=nx;o.y=ny;pc.push([nx,ny]);n++}if(n)PRES.path((rob?"r":"m")+o.id,pc)}}
if(n)S.log+=" · "+e.n+" "+n+"칸 끌려옴"}}
else if(s.t=="v"){const ps=(p&&p.length?p:[[x,y]]).slice(0,s.fx.shots||1),ds=ps.map(q=>dirOf(h,q[0],q[1]));if(ds.some(d=>!d))return 0;S.log=ds.map(d=>pierce(h,s,d,k)).join(" / ")}
else if(s.t=="b"){if(bad(x,y)||!inMyCir(h,x,y))return 0;h.x=x;h.y=y;h.tpT=NOW();S.mv.push({i:S.heroes.indexOf(h),c:[[x,y]]});PRES.fx("tele",x,y,0);S.log=k.n+" 순간이동!";const m=crPath("h",h,[[x,y]]);ride(h);if(m)S.log=m}
else if(s.t=="o"){const R=new Map();for(let Y=0;Y<N;Y++)for(let X=0;X<N;X++){const d=ch(X,Y,h.x,h.y),v=d<=s.fx.radius?s.fx.near:s.fx.far;hits(X,Y,0).forEach(e=>{if(e.o.mw&&v<s.fx.near)return;const q=R.get(e.o);if(!q||q.v<v)R.set(e.o,{e,v})})}const g50=[],g10=[];R.forEach(q=>(q.v>=s.fx.near?g50:g10).push(q.e));PRES.fx("mana",h.x,h.y,0);if(g50.length)dealHits(g50,s.fx.near,k,"마력 방출");if(g10.length&&!S.end){const lg=S.log;dealHits(g10,s.fx.far,k,"마력 방출");if(g50.length)S.log=lg+" · "+S.log}if(!g50.length&&!g10.length)S.log=k.n+" 마력 방출! 맞은 적이 없다";else S.log="🔮 "+S.log}
else if(s.t=="h"||s.t=="g"){const t=hAt(x,y);if(!t)return 0;if(s.t=="h"){t.hp=Math.min(t.max,t.hp+s.v);S.log=k.n+"의 치유! +"+s.v;PRES.fx("heal",t.x,t.y)}else{t.guard=1;S.log=k.n+" 방패막기! 반경 "+GRD.radius+"칸 아군 받는 피해 -"+pct(1-GRD.damageTaken)+" (턴 종료까지)"}}
else if(s.t=="c"){if(x<0||y<0||x>=N||y>=N||sw(x,y)||dw(x,y))return 0;h.cirs=cirsOf(h).concat({j:+j,x,y,lv:1,pw:0,sp:0,ch:0});S.log="🔯 "+k.n+" "+s.n+"! 이번 턴 끝에 발동 (영창하면 이월·강화)"}
else if(s.t=="w"){const c=cirPick(h,x,y);if(!c||h.wch||h.mc>0)return 0;c.ch=1;h.wch=1;c.lv++;if(s.fx.kind=="power")c.pw++;else c.sp++;S.log="🔯 "+k.n+" "+s.n+"! "+CLS[h.k].sk[c.j].n+" Lv"+c.lv+(s.fx.kind=="power"?" (수치 +"+s.fx.add*c.pw+")":" (범위 사방 +"+c.sp*s.fx.add+"칸)")+" · 다음 턴으로 이월"}
else if(s.t=="d"&&s.fx&&s.fx.arc){const cs=arcCells(h,x,y);if(!cs.length)return 0;const hs=[];cs.forEach(([cx_,cy_])=>{PRES.fx("burst",cx_,cy_,0);hits(cx_,cy_,0).forEach(e=>{if(!hs.some(z=>z.o===e.o))hs.push(e)})});if(hs.length)dealHits(hs,sv(),k,s.n);else S.log=k.n+" "+s.n+" 빗나감!"}
else{const hs=hits(x,y,s.a||0);if(h.k=="mage"&&s.t=="d")PRES.fx(s.a?"fire":"burst",x,y,0);if(hs.length)dealHits(hs,sv(),k,s.n);else S.log=k.n+" "+s.n+" 빗나감!"}
h.ap-=s.c;h.aT=NOW();h.aK=(s.t=="d"||s.t=="l"||s.t=="r"||s.t=="o"||s.t=="s"||s.t=="p"||s.t=="v")?"atk":"cast";if(s.cd){h.cd=h.cd||{};h.cd[j]=s.cd+1}if(s.lim){h.lu=h.lu||{};h.lu[j]=(h.lu[j]||0)+1}return 1}
function bOk(x,y){if(CH[S.champ].nomv||S.boss.bind>0)return 0;const B=S.boss,dx=x-B.x,dy=y-B.y,d=Math.max(Math.abs(dx),Math.abs(dy));if(B.moved||B.ap<1||!d||d>bMv()||(dx&&dy&&Math.abs(dx)!=Math.abs(dy)))return 0;const sx=Math.sign(dx),sy=Math.sign(dy);
for(let i=1;i<=d;i++){const px=B.x+sx*i,py=B.y+sy*i;if(px<1||py<1||px>N-2||py>N-2)return 0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const X=px+a,Y=py+b;if(CH[S.champ].bash?(fa(X,Y)||rb(X,Y)):blk(X,Y))return 0;if(hAt(X,Y)||inG(X,Y))return 0}}return 1}
function bMove(x,y){const B0=S.boss,sx0=B0.x,sy0=B0.y,r=bMove0(x,y);if(r)try{const d=Math.max(Math.abs(x-sx0),Math.abs(y-sy0)),st=Math.sign(x-sx0),sy_=Math.sign(y-sy0),m=[];for(let q=1;q<=d;q++)(S.chests||[]).slice().forEach(c=>{if(S.chests.includes(c)&&ch(sx0+st*q,sy0+sy_*q,c.x,c.y)<=CHR.bossOpenRange)m.push(chOpen(c,"b",B0))});if(m.length)S.log=(S.log?S.log+" ":"")+m.join(" ")}catch(e){}return r}
function bMove0(x,y){if(!bOk(x,y))return 0;const B=S.boss,sx=Math.sign(x-B.x),sy=Math.sign(y-B.y),d=ch(x,y,B.x,B.y),c=[];for(let i=1;i<=d;i++)c.push([B.x+sx*i,B.y+sy*i]);let nw=0;if(CH[S.champ].bash)c.forEach(([qx,qy])=>{for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const X=qx+a,Y=qy+b;if(sw(X,Y)){S.map=S.map.slice(0,Y*N+X)+"0"+S.map.slice(Y*N+X+1);nw++}if(dw(X,Y)){S.walls=S.walls.filter(w=>!(w.x==X&&w.y==Y));nw++}}});if(nw)S.log="🦡 그론이 벽 "+nw+"칸을 부수며 돌진!";B.x=x;B.y=y;B.moved=1;B.ap--;PRES.path("B",c);{const m=crPath("B",B,c);if(m)S.log=m}return 1}
function enhanceCells(c){let n=0;S.rob.forEach(r=>{if(c.has(r.y*N+r.x)){if(!r.en){r.mx*=ROB.enhanceMult;r.hp*=ROB.enhanceMult}r.en=ROB.enhanceTurns;n++}});S.fac.forEach(f=>{if([[0,0],[1,0],[0,1],[1,1]].some(([a,b])=>c.has((f.y+b)*N+f.x+a))){if(!f.en){f.hp=Math.min(f.mx,f.hp+FAC.enhanceHp);f.cd=Math.max(1,f.cd-1);f.en=1}n++}});S.belts.forEach(b=>{if(c.has(b.y*N+b.x)){b.en=3;n++}});if(S.champ=="vince"&&S.boss){const B=S.boss;let hit=0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)if(c.has((B.y+b)*N+B.x+a))hit=1;if(hit){B.en=1;B.enT=NOW();n++}}S.sec.bombs.forEach(b=>{if(c.has(b.y*N+b.x)){b.en=3;n++}});return n}
function bAtk(i,p,fb){const c=CH[S.champ],a=c.at[i],U=c.gen&&!gDead()&&!(fb&&S.boss.en>0)?S.gen:S.boss;if(!U||U.hp<=0||U.ap<a.c||p.length!=a.pk||p.some(q=>ch(q[0],q[1],U.x,U.y)>a.r))return 0;S.atks.push({i,p});U.ap-=a.c;let n=enhanceCells(cov(a,p));const ph_=pitHit(i,p);S.log="⚠️ "+a.n+" 예고! (예고 "+S.atks.filter(z=>!z.echo).length+"개)"+(ph_&&ph_.g?" 🕳️숨어 있던 구덩이가 드러나 무너졌다!":"")+(n?" 🔷아군 "+n+"곳 강화!":"");return 1}
function chSpawn(n){S.chests=S.chests||[];if(mapSet("chestSpawn")===false)return 0;S.cid=S.cid||1;let made=0;for(let k=0;k<n&&S.chests.length<CHR.max;k++){for(let a=0;a<80;a++){const x=1+rn(N-2),y=4+rn(N-8);if(bad(x,y)||beltAt(x,y)||pitAt(x,y)>=0||S.chests.some(c=>ch(c.x,c.y,x,y)<CHR.spacing)||(S.cry||[]).some(c=>c.x==x&&c.y==y)||S.heroes.some(h=>ch(h.x,h.y,x,y)<=CHR.heroClearance)||ch(S.boss.x,S.boss.y,x,y)<=CHR.bossClearance||(S.gen&&ch(S.gen.x,S.gen.y,x,y)<=CHR.bossClearance))continue;S.chests.push({id:S.cid++,x,y,k:"t"});made++;break}}return made}
function chOpen(c,side,u){S.chests=S.chests.filter(z=>z!==c);S.cfx=(S.cfx||[]).filter(f=>NOW()-f.t<4000);S.gold=S.gold||{b:0,h:0};S.bag=S.bag||{b:bag0(),h:bag0()};
if(c.k=="x"){S.cfx.push({x:c.x,y:c.y,t:NOW(),k:"trap"});if(side=="b"){S.cd=S.cd||{};S.cd.tchest=0;return "📦 그론이 상자를 회수! 함정 상자였다 (설치 쿨타임 초기화)"}const mim=RAND()<MOB.trapChest.mimicChance;if(mim){u.sup=MOB.mimic.suppressTurns;u.ap=0;u.mc=9;mobSpawn(c,"mimic",u);return "👾 미믹이었다! "+CLS[u.k].n+" 제압당했다! (최대 "+MOB.mimic.suppressTurns+"턴 행동불능 · 턴마다 "+MOB.mimic.suppressDmg+" 피해 · 아군이 곁에 오거나 미믹을 쓰러뜨리면 해제)"}mobSpawn(c,"gob",u);return "💰 보물 고블린이 튀어나왔다! 금화를 가장 많이 가진 용사를 노린다"}
let gq=RAND()*LOOTW,gl=LOOT.gold[0][0];for(const [v,w] of LOOT.gold){if(gq<w){gl=v;break}gq-=w}
const r=RAND(),it=(LOOTI.find(z=>r<z[1])||["empty"])[0];if(side=="b")S.gold.b+=gl;else u.gold=(u.gold||0)+gl;if(it!="empty")S.bag[side][it]++;S.cfx.push({x:c.x,y:c.y,t:NOW(),k:it=="empty"?"gold":it});
return "🎁 "+(side=="b"?"보스":"용사 진영")+"이(가) 보물상자를 열었다! 💰 금화 +"+gl+(it!="empty"?" · "+ITEMS[it].n+" 획득":"")}
function cutPath(h,n,k){const i=S.heroes.indexOf(h),ents=S.mv.slice(n).filter(r=>r.i==i);let cnt=0;ents.forEach(r=>{const len=r.c.length;r.c=r.c.slice(0,Math.max(0,k+1-cnt));cnt+=len});PRES.trim("h"+i,cnt-1-k)}
function chestPath(h,n){if(h.dead||!S.chests||!S.chests.length)return;const i=S.heroes.indexOf(h),path=[];S.mv.slice(n).forEach(r=>{if(r.i==i)r.c.forEach(c=>path.push(c))});if(!path.length)return;const m=[];
for(let k=0;k<path.length;k++){const q=path[k];for(const c of S.chests.slice()){if(!S.chests.includes(c)||ch(q[0],q[1],c.x,c.y)>CHR.heroOpenRange)continue;if(c.k=="x"){cutPath(h,n,k);h.x=q[0];h.y=q[1];m.push(chOpen(c,"h",h));k=path.length}else m.push(chOpen(c,"h",h))}}
if(m.length)S.log=(S.log?S.log+" ":"")+m.join(" ")}
function chestScanAll(){if(!S||S.ph=="setup"||S.end||!S.chests||!S.chests.length)return;const m=[];
S.heroes.forEach(h=>{if(h.dead)return;S.chests.slice().forEach(c=>{if(S.chests.includes(c)&&ch(h.x,h.y,c.x,c.y)<=CHR.heroOpenRange)m.push(chOpen(c,"h",h))})});
[S.boss,S.gen&&S.gen.hp>0?S.gen:null].forEach(u=>{if(!u)return;S.chests.slice().forEach(c=>{if(S.chests.includes(c)&&ch(u.x,u.y,c.x,c.y)<=CHR.bossOpenRange)m.push(chOpen(c,"b",u))})});
S.heroes.forEach(h=>{if(!h.dead&&h.sup>0&&S.heroes.some(z=>z!==h&&!z.dead&&ch(z.x,z.y,h.x,h.y)<=1)){h.sup=0;m.push("🤝 "+CLS[h.k].n+" 제압 해제!")}});
if(m.length)S.log=(S.log?S.log+" ":"")+m.join(" ")}
function supTick(o){S.heroes.forEach(h=>{if(h.dead||!(h.sup>0))return;if(S.heroes.some(z=>z!==h&&!z.dead&&ch(z.x,z.y,h.x,h.y)<=1)){h.sup=0;o.push("🤝 "+CLS[h.k].n+" 제압 해제");return}h.hp-=MOB.mimic.suppressDmg;h.sup--;o.push("⛓ "+CLS[h.k].n+" 제압 -"+MOB.mimic.suppressDmg);if(h.hp<=0){h.hp=0;h.dead=1}})}
/* 아이템 사용: side "b"/"h", u 사용하는 유닛, nm 기록용 이름 → {ok} / {err: 안내 문구} / {aim: 1}(스크롤: 칸 고르기 필요) */
function itemUse(side,u,k,nm){if(!S.bag||!S.bag[side][k])return {err:""};if(side=="b"&&frozen(u))return {err:"❄️ 얼어붙어 이번 턴엔 아무것도 할 수 없어요"};
if(k=="potion"){const mx=u.max||u.mx;if(u.hp>=mx)return {err:"이미 체력이 가득 차 있어요"};u.hp=Math.min(mx,u.hp+ITEF.potion.heal)}
else if(k=="gem")u.ap+=ITEF.gem.ap;
else if(k=="scroll"){if(u.sup>0)return {err:"⛓ 제압 중에는 스크롤을 쓸 수 없어요"};return {aim:1}}
S.bag[side][k]--;S.log="🎒 "+nm+" "+ITEMS[k].n+" 사용! ("+ITEMS[k].d+")";return {ok:1}}
/* 순간이동 스크롤: 보스 진영(g=발전기를 옮길지) / 용사 h */
function scrollBoss(x,y,g){if(!S.bag||!S.bag.b.scroll)return 0;const u=g?S.gen:S.boss,O=g?S.boss:S.gen;if(ch(x,y,u.x,u.y)>ITEF.scroll.range)return 0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const X=x+a,Y=y+b;if(X<0||Y<0||X>=N||Y>=N||blk(X,Y)||hAt(X,Y)||(O&&O.hp>0&&Math.abs(X-O.x)<=1&&Math.abs(Y-O.y)<=1))return 0}
u.x=x;u.y=y;PRES.snap(g?"G":"B",x,y);S.bag.b.scroll--;S.log="📜 "+(g?"발전기":(CH[S.champ].bn||CH[S.champ].n))+" 순간이동!";return 1}
function scrollHero(h,x,y){if(!S.bag||!S.bag.h.scroll)return 0;if(!h||h.dead||h.sup>0||ch(x,y,h.x,h.y)>ITEF.scroll.range||bad(x,y)||(h.wch&&!inMyCir(h,x,y)))return 0;const n=S.mv.length;h.x=x;h.y=y;S.mv.push({i:S.heroes.indexOf(h),c:[[x,y]]});PRES.snap("h"+S.heroes.indexOf(h),x,y);S.bag.h.scroll--;S.log="📜 "+CLS[h.k].n+" 순간이동!";try{pitCheck(h,n)}catch(e){}return 1}
function pitHit(i,p){if(S.champ!="gron"||!S.pits||!S.pits.length)return 0;const a=CH.gron.at[i],c=cov(a,p),inC=z=>[[0,0],[1,0],[0,1],[1,1]].some(([x,y])=>c.has((z.y+y)*N+z.x+x)),hit=S.pits.filter(inC);if(!hit.length)return 0;
S.gh=S.gh||[];const hid=hit.filter(z=>!z.rv),rev=hit.filter(z=>z.rv);hid.forEach(z=>S.gh.push({x:z.x,y:z.y}));S.pits=S.pits.filter(z=>!hid.includes(z));
const P=rev[0];if(P){const cs=S.pits.filter(z=>z!==P).sort((u,v)=>Math.hypot(v.x-P.x,v.y-P.y)-Math.hypot(u.x-P.x,u.y-P.y));if(cs.length){const Q=cs[0],dx=Q.x-P.x,dy=Q.y-P.y,p2=p.map(([x,y])=>[cl(x+dx,0,N-1),cl(y+dy,0,N-1)]);S.atks.push({i,p:p2,echo:1});S.pfx=(S.pfx||[]).filter(f=>NOW()-f.t<3000).concat({t:NOW(),a:{x:P.x,y:P.y,rv:1},b:{x:Q.x,y:Q.y,rv:Q.rv?1:0}});S.pits=S.pits.filter(z=>z!==P&&z!==Q)}}
return {g:hid.length}}
function bEx(e,p){const B=S.boss;if((e.vr?(p.length<1||p.length>e.pk):p.length!=e.pk)||p.slice(0,e.id=="bomb"?1:99).some(q=>ch(q[0],q[1],B.x,B.y)>e.r))return 0;if(e.lim&&(S.used[e.id]||0)>=e.lim)return 0;
if(p.some((q,i)=>p.findIndex(z=>z[0]==q[0]&&z[1]==q[1])!=i))return 0;
if(e.id=="tchest"){const q=p[0];for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const X=q[0]+a,Y=q[1]+b;if(hAt(X,Y)||inB(X,Y)||inG(X,Y)||rb(X,Y)||mobAt(X,Y))return 0}if((S.chests||[]).length>=CHR.max||blk(q[0],q[1])||hAt(q[0],q[1])||inB(q[0],q[1])||pitAt(q[0],q[1])>=0||(S.chests||[]).some(c=>ch(c.x,c.y,q[0],q[1])<=CHR.trapChestSpacing)||mobAt(q[0],q[1]))return 0;S.chests=S.chests||[];S.cid=S.cid||1;S.chests.push({id:S.cid++,x:q[0],y:q[1],k:"x"});S.cd=S.cd||{};S.cd.tchest=5;S.log="📦 던전 어딘가에 상자가 나타났다…";return 1}
if(e.id=="trap"){const q=p[0];if(S.sec.traps.length>=TMAX||blk(q[0],q[1])||S.sec.traps.some(z=>z[0]==q[0]&&z[1]==q[1]))return 0;S.sec.traps.push(q);S.used.trap=(S.used.trap||0)+1;return 1}
if(e.id=="bomb"){const a=p[0],b=p[1],dx=Math.sign(b[0]-a[0]),dy=Math.sign(b[1]-a[1]);if(!(dx||dy)||bad(a[0],a[1])||S.sec.bombs.length>=BMB.max)return 0;S.sec.bombs.push({id:S.sec.bid=(S.sec.bid||0)+1,x:a[0],y:a[1],dx,dy});S.used.bomb=(S.used.bomb||0)+1;return 1}
if(e.id=="fac"){const q=p[0],ov=S.fac.find(f=>f.x<=q[0]+1&&f.x+1>=q[0]&&f.y<=q[1]+1&&f.y+1>=q[1]);
if(ov){const f=ov;if(f.lv>=FAC.maxLv)return 0;f.lv++;f.mx+=FAC.upgradeHp;f.hp=Math.min(f.mx,f.hp+FAC.upgradeHp);f.cd=FAC.cycle;S.rob=S.rob.filter(r=>r.fid!=f.id);S.used.fac=1;S.log="🏭 공장 Lv"+f.lv+" 업그레이드! 로봇·생산 타이머 초기화";return 1}
if(S.fac.length>=FAC.max||q[0]<0||q[1]<0||q[0]+1>=N||q[1]+1>=N)return 0;for(let a=0;a<2;a++)for(let b=0;b<2;b++)if(bad(q[0]+a,q[1]+b))return 0;
S.fac.push({id:S.fid++,x:q[0],y:q[1],hp:FAC.hp,mx:FAC.hp,lv:1,cd:FAC.cycle,en:0});crClear(q[0],q[1],2,2);S.used.fac=1;S.log="🏭 2×2 공장 설치! "+FAC.cycle+"턴마다 로봇을 생산해요.";return 1}
if(e.id=="belt"){const a=p[0],b=p[1],dx=b[0]-a[0],dy=b[1]-a[1];if((dx&&dy)||!(dx||dy))return 0;const n=Math.max(Math.abs(dx),Math.abs(dy))+1;if(n>e.fx.maxLen)return 0;const d=dx>0?0:dy>0?1:dx<0?2:3,cs=[];
for(let i=0;i<n;i++){const x=a[0]+Math.sign(dx)*i,y=a[1]+Math.sign(dy)*i;if(x<0||y<0||x>=N||y>=N||sw(x,y)||dw(x,y)||hAt(x,y))return 0;cs.push([x,y])}
S.bq=(S.bq||0)+1;cs.forEach(([x,y])=>{const o=beltAt(x,y);if(o){o.d=d;o.en=0;o.t=S.bq}else S.belts.push({x,y,d,en:0,t:S.bq});crClear(x,y,1,1)});S.used.belt=(S.used.belt||0)+1;S.log="🛤️ 컨베이어 설치! ("+n+"칸)";return 1}
if(e.id=="pit"){S.pits=S.pits||[];if(pitAt(B.x,B.y)>=0)return 0;let a=null;for(const [ox,oy] of [[0,0],[-1,0],[0,-1],[-1,-1]]){const X=B.x+ox,Y=B.y+oy;if(X<0||Y<0||X+1>=N||Y+1>=N)continue;let ok=1;for(let i=0;i<2;i++)for(let j=0;j<2;j++)if(sw(X+i,Y+j)||pitAt(X+i,Y+j)>=0)ok=0;if(ok){a={x:X,y:Y};break}}if(!a)return 0;S.pits.push(a);if(S.pits.length>PIT.max)S.pits.shift();S.log="🕳️ 그론이 땅바닥을 만지작거렸다… 뭔가 꾸미는 눈치!";return 1}
if(e.id=="hop"){const q=p[0];if(B.bind>0)return 0;const pi=pitAt(B.x,B.y);if(pi<0||pitAt(q[0],q[1])<0||pitAt(q[0],q[1])==pi||(q[0]==B.x&&q[1]==B.y)||hAt(q[0],q[1]))return 0;const pb=S.pits[pitAt(q[0],q[1])],pe=S.pits[pitAt(B.x,B.y)];pb.rv=1;if(pe)pe.rv=1;S.cd=S.cd||{};S.cd.hop=e.cd+1;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const X=q[0]+a,Y=q[1]+b;if(sw(X,Y))S.map=S.map.slice(0,Y*N+X)+"0"+S.map.slice(Y*N+X+1);if(dw(X,Y))S.walls=S.walls.filter(w=>!(w.x==X&&w.y==Y))}S.hop={t:NOW(),a:[B.x,B.y],b:[q[0],q[1]],pb:{x:pb.x,y:pb.y}};B.x=q[0];B.y=q[1];PRES.snap("B",q[0],q[1]);S.log="🌀 그론이 땅속으로 사라졌다가 튀어나왔다! 드나든 구덩이 위치가 공개됐다";PRES.kick();return 1}
if(e.id=="run")return runBelts();
if(e.id=="dig"){if(p.some(q=>!(sw(q[0],q[1])||dw(q[0],q[1]))))return 0;p.forEach(([X,Y])=>{if(sw(X,Y))S.map=S.map.slice(0,Y*N+X)+"0"+S.map.slice(Y*N+X+1);S.walls=S.walls.filter(w=>!(w.x==X&&w.y==Y))});S.used.dig=(S.used.dig||0)+1;S.log="⛏️ 그론이 벽 "+p.length+"칸을 부쉈다!";return 1}
if(e.id=="wall"){if(p.some(q=>cirAt(q[0],q[1])))return 0;const up=q=>{const w=S.walls.find(z=>z.x==q[0]&&z.y==q[1]);return w&&!sw(q[0],q[1])&&!hAt(q[0],q[1])&&!inB(q[0],q[1])&&!inG(q[0],q[1])&&!fa(q[0],q[1])&&!rb(q[0],q[1])&&(w.lv||1)<WAL.maxLv?w:null};if(p.some(q=>!up(q)&&bad(q[0],q[1])))return 0;
const wt=(S.used.wall||0)>=1?WAL.turnsLater:WAL.turns;let nu=0,nn=0;p.forEach(q=>{const w=S.walls.find(z=>z.x==q[0]&&z.y==q[1]);if(w){w.lv=(w.lv||1)+1;w.t+=WAL.stackTurns;w.hp=WAL.hpPerLv*w.lv;nu++}else{S.walls.push({x:q[0],y:q[1],t:wt,lv:1,hp:WAL.hpPerLv});nn++}});S.used.wall=(S.used.wall||0)+1;S.log="🧱 그론이 벽을 쌓았다!"+(nu?" ("+nu+"칸 강화 ↑ Lv"+Math.max(...p.map(q=>(S.walls.find(z=>z.x==q[0]&&z.y==q[1])||{}).lv||1))+", 유지 +"+WAL.stackTurns+"턴)":"")+(nn?" (새 벽 "+nn+"칸 · "+wt+"턴 유지)":"");return 1}
if(p.some(q=>bad(q[0],q[1])))return 0;return 0}
function runBelts(){let any=0,cm="";const bF=o=>beltAt(o.x,o.y);/* 큰 유닛(빈센토·발전기)도 가운데 칸이 벨트 위일 때만 실려 감 → 벨트를 벗어나면 멈춤 */const mv=(k,o,big)=>{if(o.bind>0)return;const b0=bF(o,big);if(!b0)return;let n=(b0.en?BRUN.enhancedMove:BRUN.move)+(o.mvb||0);while(n-->0){const bl=bF(o,big);if(!bl)break;const nx=o.x+DX[bl.d],ny=o.y+DY[bl.d];let ok;
if(big){ok=nx>=1&&ny>=1&&nx<=N-2&&ny<=N-2;for(let a=-1;a<=1&&ok;a++)for(let b=-1;b<=1;b++){const X=nx+a,Y=ny+b;if(sw(X,Y)||dw(X,Y)||fa(X,Y)||hAt(X,Y)||rb(X,Y)||mobAt(X,Y)||(o===S.boss?inG(X,Y):Math.abs(X-S.boss.x)<=1&&Math.abs(Y-S.boss.y)<=1)){ok=0;break}}}else ok=!bad(nx,ny);
if(!ok)break;o.x=nx;o.y=ny;any=1;PRES.path(k,[[nx,ny]]);if(k=="G")cm+=crEat("G",o,nx,ny);else if(k=="B")cm+=crEat("B",o,nx,ny);else if(k[0]=="r")cm+=crEat("r",o,nx,ny);else if(k[0]=="h")cm+=crEat("h",o,nx,ny)}};
S.heroes.forEach((h,i)=>{if(!h.dead)mv("h"+i,h)});if(S.gen&&S.gen.hp>0)mv("G",S.gen,1);mv("B",S.boss,1);S.rob.forEach(r=>mv("r"+r.id,r));S.sec.bombs.forEach(b=>mv("b"+b.id,b));
S.fac.forEach(f=>{const cs=[[0,0],[1,0],[0,1],[1,1]],fb=()=>{let r=null;for(const [a,b] of cs){const t=beltAt(f.x+a,f.y+b);if(t&&(!r||(t.t||0)>=(r.t||0)))r=t}return r},b0=fb();if(!b0)return;let n=b0.en?BRUN.enhancedMove:BRUN.move;while(n-->0){const bl=fb();if(!bl)break;const nx=f.x+DX[bl.d],ny=f.y+DY[bl.d];let ok=nx>=1&&ny>=1&&nx+1<=N-2&&ny+1<=N-2;for(const [a,b] of cs){const X=nx+a,Y=ny+b;if(!ok)break;if(sw(X,Y)||dw(X,Y)||hAt(X,Y)||rb(X,Y)||inB(X,Y)||inG(X,Y)||S.fac.some(z=>z!==f&&X>=z.x&&X<=z.x+1&&Y>=z.y&&Y<=z.y+1))ok=0}if(!ok)break;f.x=nx;f.y=ny;any=1;PRES.path("f"+f.id,[[nx,ny]]);crClear(nx,ny,2,2)}});
if(any)S.log="⚙️ 컨베이어 가동! 벨트 위 유닛이 이동했어요. "+cm;return any}
function crSpawn(n){if(S.champ!="vince")return;S.cry=S.cry||[];for(let t=0;t<n&&S.cry.length<CRMAX;t++)for(let k=0;k<80;k++){const x=1+rn(N-2),y=1+rn(N-2);if(bad(x,y)||beltAt(x,y)||crAt(x,y)>=0)continue;S.cry.push({x,y,t:CRLIFE,k:RAND()<CRY.blueChance?"b":"y"});break}}
function crClear(x,y,w,h){if(S.cry)S.cry=S.cry.filter(c=>!(c.x>=x&&c.x<x+w&&c.y>=y&&c.y<y+h))}
function crEat(who,o,x,y){const a=S.cry;if(!a||!a.length)return"";const big=who=="B"||who=="G";let m="";
for(let i=a.length-1;i>=0;i--){const c=a[i];if(!(big?Math.abs(c.x-x)<=1&&Math.abs(c.y-y)<=1:c.x==x&&c.y==y))continue;a.splice(i,1);const bl=c.k=="b";
if(who=="r"){if(bl){const g=S.gen&&S.gen.hp>0?S.gen:S.boss;g.ap+=CRY.blueAp;m+="🔷 로봇이 파랑 크리스탈 흡수! "+(g===S.boss?"빈센토":"발전기")+" AP +"+CRY.blueAp+" "}else{o.mvb=CRY.yellowMove;m+="⚡ 로봇이 노랑 크리스탈 흡수! 이동 +"+CRY.yellowMove+" "}}
else{if(bl){o.ap+=CRY.blueAp;m+="🔷 파랑 크리스탈! AP +"+CRY.blueAp+" "}else{o.mvb=CRY.yellowMove;m+="⚡ 노랑 크리스탈! 이동 +"+CRY.yellowMove+" (이번 턴) "}}}
return m}
const crPath=(who,o,cs)=>cs.map(([x,y])=>crEat(who,o,x,y)).join("");
function genCharge(){const g=S.gen,x=CH[S.champ].gx;if(!g||g.hp<=0||!x||g.ap<x.c||g.ch)return 0;g.ap-=x.c;g.ch=1;g.bonus=(g.bonus||0)+CST().generator.charge;S.log="⚡ 발전! 다음 턴 발전기 AP +"+CST().generator.charge+" (다음 턴 "+(GAP()+g.bonus)+"AP)";return 1}
function bExtra(e,p){if(e.cd&&S.cd&&S.cd[e.id]>0)return 0;const cost=ecost(e);if(S.boss.ap<cost||(gDead()&&(e.id=="fac"||e.id=="belt")))return 0;const r=bEx(e,p);if(r){S.boss.ap-=cost;if(e.cd){S.cd=S.cd||{};if(!(S.cd[e.id]>0))S.cd[e.id]=e.cd+1}}return r}
function endBossTurn(){S.rev=[];S.mv=[];S.ph="hero";S.log=S.atks.filter(a=>!a.echo).length?"⚠️ 공격 예고 "+S.atks.filter(a=>!a.echo).length+"개(빨간 칸)! 용사 진영: 피하거나 공격하세요.":"보스가 공격을 예고하지 않았어요. 용사 진영 차례!";S.used={}}
function endHeroTurn(){S.ph="resolve"}
/* 용사 피해: 방패막기 경감 → 보호막(h.sh)이 먼저 막음 → 체력 */
function hurt(h,d,nb){if(S.heroes.some(k=>!k.dead&&k.guard&&ch(k.x,k.y,h.x,h.y)<=GRD.radius))d=Math.ceil(d*GRD.damageTaken);let a=0;if(h.sh>0){a=Math.min(h.sh,d);h.sh-=a;d-=a}h.hp-=d;h.hurtT=NOW();if(h.hp<=0){h.hp=0;h.dead=1;cirClear(h)}return a?d+" (🛡"+a+" 막음)":d}
function robAct(r,o){const bon=(r.mvb||0)-slowOf(r);r.mvb=0;if(frozen(r))return;const hs=()=>S.heroes.filter(h=>!h.dead&&ch(h.x,h.y,r.x,r.y)<=ROB.chase).sort((a,b)=>ch(a.x,a.y,r.x,r.y)-ch(b.x,b.y,r.x,r.y));let t=hs()[0];if(!t)return;
if(r.bind>0&&ch(t.x,t.y,r.x,r.y)>1)return;if(ch(t.x,t.y,r.x,r.y)>1){const st=r.y*N+r.x,pv={[st]:-1},q=[[r.x,r.y]];let end=-1;
while(q.length){const [x,y]=q.shift();if(ch(x,y,t.x,t.y)<=1){end=y*N+x;break}for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const nx=x+dx,ny=y+dy,i=ny*N+nx;if((dx||dy)&&pv[i]===undefined&&!bad(nx,ny)){pv[i]=y*N+x;q.push([nx,ny])}}}
if(end>=0){const path=[];for(let i=end;i!=st;i=pv[i])path.unshift(i);const bg=Math.max(0,(r.en?ROB.enhancedMove:ROB.move)+bon),i=path.slice(0,bg).pop();if(i!==undefined){const pc=path.slice(0,bg).map(z=>[z%N,(z/N)|0]);PRES.path("r"+r.id,pc);r.x=i%N;r.y=(i/N)|0;const m=crPath("r",r,pc);if(m)o.push(m)}}}
t=hs()[0];if(t&&ch(t.x,t.y,r.x,r.y)<=1){o.push("🤖Lv"+r.lv+"→"+CLS[t.k].n+" -"+hurt(t,ROB.atkBase+ROB.atkPerLv*(r.lv-1)));(S.rfx=S.rfx||[]).push({x:t.x,y:t.y,en:r.en?1:0});S.rfxT=NOW()}}
function resolve(){if(S.atks.length){S.fxT=NOW();S.fxA=S.atks.map(a=>({i:a.i,p:a.p}))}const td={},tc={},o=[],add=(hi,v)=>{td[hi]=(td[hi]||0)+v;(tc[hi]=tc[hi]||[]).push(v)},passes=(x,y)=>{for(const r of S.mv)if(r.c.some(q=>q[0]==x&&q[1]==y))return r.i;return S.heroes.findIndex(h=>!h.dead&&h.x==x&&h.y==y&&!(h.nt&&h.nt[0]==x&&h.nt[1]==y))};S.rev=[];S.rfx=[];S.gh=[];cirFire(o);burnTick(o);if(S.end){S.log=o.join(", ");return}supTick(o);
S.heroes.forEach(h=>{if(h.par>0)h.par--});S.atks.forEach(a0=>{const a=CH[S.champ].at[a0.i],c=cov(a,a0.p);S.heroes.forEach((h,hi)=>{if(!h.dead&&c.has(h.y*N+h.x)){add(hi,a.v);if(a.par){h.par=1;o.push("⚡ "+CLS[h.k].n+" 마비!")}}})});
S.sec.traps.forEach(t=>{const hi=passes(t[0],t[1]);if(hi>=0)add(hi,TR.v);S.rev.push([t[0],t[1],hi>=0?1:0])});S.sec.traps=[];
S.sec.bombs=S.sec.bombs.filter(b=>{let hit=passes(b.x,b.y)>=0;if(!hit){for(let st=0;st<(b.en?BMB.enhancedMove:BMB.move)&&!hit;st++){const nx=b.x+b.dx,ny=b.y+b.dy;if(blk(nx,ny)){if(st==0)return false;break}b.x=nx;b.y=ny;hit=!!hAt(nx,ny)}}
if(hit){S.rev.push([b.x,b.y,1,b.en?1:0]);S.heroes.forEach((h,hi)=>{if(!h.dead&&ch(h.x,h.y,b.x,b.y)<=1)add(hi,BOMBV)});return false}return true});
S.heroes.forEach((h,hi)=>{if(h.dead||!td[hi])return;o.push(CLS[h.k].n+" -"+hurt(h,td[hi],1))});
S.rob.forEach(r=>robAct(r,o));mobsAct(o);chAge(o);
S.fac.forEach(f=>{if(--f.cd<=0){f.cd=FAC.cycle;if(S.rob.length<ROB.max){const rg=[];for(let dx=-1;dx<=2;dx++)for(let dy=-1;dy<=2;dy++)if(dx<0||dx>1||dy<0||dy>1)rg.push([f.x+dx,f.y+dy]);shuffle(rg);const q=rg.find(z=>!bad(z[0],z[1]));if(q){const m=RHP[f.lv-1];S.rob.push({id:S.rid++,fid:f.id,x:q[0],y:q[1],hp:m,mx:m,lv:f.lv});o.push("🏭 Lv"+f.lv+" 로봇 생산!")}}}f.hp-=FAC.decay});S.sink=(S.sink||[]).filter(k=>NOW()-k.t<2000);S.fac.filter(f=>f.hp<=0).forEach(f=>{S.sink.push({x:f.x,y:f.y,lv:f.lv,en:f.en,t:NOW()});o.push("🏭 Lv"+f.lv+" 공장이 가라앉았다…")});S.fac=S.fac.filter(f=>f.hp>0);
S.rob.forEach(r=>{if(r.bind>0)r.bind--});if(S.boss.bind>0)S.boss.bind--;if(S.gen&&S.gen.bind>0)S.gen.bind--;S.walls=S.walls.filter(w=>--w.t>0);S.rob.forEach(r=>{if(r.en&&--r.en==0){r.mx/=ROB.enhanceMult;r.hp=Math.min(r.hp,r.mx)}});S.fac.forEach(f=>{if(f.en)f.en--});if(S.boss.en)S.boss.en--;S.sec.bombs.forEach(b=>{if(b.en)b.en--});S.belts.forEach(b=>{if(b.en)b.en--});S.heroes.forEach(h=>{h.ap=h.k=="cleric"?cl((h.ap||0)+hAP(h),hAP(h),RULE.hero.clericApMax):hAP(h);if(h.cd)for(const q in h.cd)if(h.cd[q]>0)h.cd[q]--;if(h.lu)h.lu={};h.guard=0;h.nt=null;h.mc=0;if(h.wch)h.wch=0;if(h.mvd)h.mvd=0;h.mvb=0;if(h.stun>0){h.stun--;h.ap=0;h.mc=9;h.st2=1}else h.st2=0;if(h.sup>0){h.ap=0;h.mc=9}});if(S.cd)for(const q in S.cd)if(S.cd[q]>0)S.cd[q]--;if(S.gen){S.gen.ap=GAP()+(S.gen.bonus||0);S.gen.bonus=0;S.gen.ch=0;S.gen.mvb=0}S.boss.mvb=0;if(S.champ=="vince"){S.cry=(S.cry||[]).filter(c=>--c.t>0);crSpawn(CRY.perTurnMin+rn(CRY.perTurnMax-CRY.perTurnMin+1))}
if(S.champ=="vince"&&S.rev.length)S.revT=NOW();
S.log="공격 "+S.atks.length+"발 발동! "+(S.rev.length?"🗡️가시 함정 공개"+(S.rev.some(t=>t[2])?"(명중!) ":" "):"")+(o.length?o.join(", "):"피해 없음!");
S.atks=[];S.mv=[];try{if(RAND()<CHR.spawnChance&&chSpawn(1))S.log+=" 📦 던전 어딘가에 상자가 나타났다…"}catch(e){}S.round++;S.boss.moved=0;S.boss.ap=bMax();if(S.facRef){S.facRef=0;S.boss.ap+=CST().factoryKillAp;if(S.gen&&S.gen.hp>0)S.gen.ap+=CST().factoryKillAp;S.log+=" 🏭공장 파괴 보상: 빈센토"+(S.gen&&S.gen.hp>0?"·발전기":"")+" AP +"+CST().factoryKillAp+"!"}if(frozen(S.boss))S.boss.ap=0;if(S.gen&&frozen(S.gen))S.gen.ap=0;S.ph="boss";
if(S.heroes.every(h=>h.dead))S.end="👹 보스 진영 승리! 용사가 전멸했습니다."}
function startGame(){if(!S.champ||S.pick.length!=3)return 0;const MP=mapOf(S.champ).spawns;S.heroes=S.pick.map((k,i)=>({k,x:MP.heroes[i].x,y:MP.heroes[i].y,hp:CLS[k].hp,max:CLS[k].hp,ap:CLS[k].ap||RULE.hero.ap,mc:0,guard:0,dead:0,gold:0}));S.boss.x=MP.boss.x;S.boss.y=MP.boss.y;S.boss.hp=S.boss.max=CST().hp;S.boss.ap=CST().ap;S.gen=CH[S.champ].gen?{x:MP.generator.x,y:MP.generator.y,hp:CST().generator.hp,mx:CST().generator.hp,ap:GAP()}:null;S.cry=[];S.pits=[];S.chests=[];S.cid=1;(mapOf(S.champ).objects||[]).forEach(o=>{if(o.type=="pit")S.pits.push({x:o.x,y:o.y});else S.chests.push({id:S.cid++,x:o.x,y:o.y,k:o.type=="trapChest"?"x":"t"})});S.mobs=[];S.mid=1;S.gold={b:0,h:0};S.bag={b:bag0(),h:bag0()};S.scan=null;S.scanB=[];S.facRef=0;S.genDead=0;S.sink=[];S.cfx=[];S.gh=[];if(RAND()<CHR.startChance)chSpawn(CHR.startMin+rn(CHR.startMax-CHR.startMin+1));crSpawn(CRY.start);S.ph="boss";S.log="👹 "+CH[S.champ].n+": AP "+CST().ap+"으로 이동·설치·공격 예고를 하고 턴을 종료하세요.";S.used={};return 1}
