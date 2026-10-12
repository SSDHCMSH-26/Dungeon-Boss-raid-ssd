/* [규칙] 게임 상태 S, 새 게임 상태, 칸·거리·막힘 판정 같은 기본 도구 */
const N=30;
let S;
const ch=(a,b,c,d)=>Math.max(Math.abs(a-c),Math.abs(b-d)),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),rn=n=>Math.floor(RAND()*n),arn=n=>Math.floor(ARAND()*n),
/* 섞기(Fisher–Yates): 주사위를 정해진 횟수·순서로만 굴림 → 어느 JS 엔진에서나 같은 결과.
   (sort 에 무작위 비교를 쓰는 섞기는 엔진마다 비교 순서가 달라 결과가 달라짐 — 쓰지 말 것) */
shuffle=(a,r)=>{r=r||rn;for(let i=a.length-1;i>0;i--){const j=r(i+1),t=a[i];a[i]=a[j];a[j]=t}return a},cr=(v,b,r)=>cl(cl(v,b-r,b+r),0,N-1);
/* 숨김 정보: S.sec = 보스만 아는 것(가시 함정·폭탄로봇), S.used = 이번 턴 스킬 사용 횟수.
   예전 저장·방 데이터(이 칸이 없던 버전)는 fixState 로 채움 */
function fixState(st,old){if(!st)return st;if(!st.sec)st.sec={traps:(old&&old.t)||[],bombs:(old&&old.b)||[],bid:(old&&old.bid)||0};if(!st.used)st.used=(old&&old.u)||{};if(st.rng===undefined)st.rng=st.seed=SEED();if(st.airng===undefined)st.airng=(st.seed^0x9E3779B9)>>>0;return st}
const newS=()=>{const sd=SEED();return {ph:"setup",pick:[],champ:"",map:"",fac:[],rob:[],walls:[],fid:1,rid:1,belts:[],round:1,boss:{x:15,y:2,hp:0,max:0,moved:0,ap:0},gen:null,heroes:[],atks:[],rev:[],mv:[],sec:{traps:[],bombs:[],bid:0},used:{},seed:sd,rng:sd,airng:(sd^0x9E3779B9)>>>0,log:"보스 진영은 챔피언을, 용사 진영은 영웅 3명을 고르세요.",end:""}};
const inB=(x,y)=>Math.abs(x-S.boss.x)<=1&&Math.abs(y-S.boss.y)<=1;
const hAt=(x,y)=>S.heroes.find(h=>!h.dead&&h.x==x&&h.y==y);
const sw=(x,y)=>S.map[y*N+x]=="1",dw=(x,y)=>S.walls.some(w=>w.x==x&&w.y==y),fa=(x,y)=>S.fac.find(f=>x>=f.x&&x<=f.x+1&&y>=f.y&&y<=f.y+1),rb=(x,y)=>S.rob.find(r=>r.x==x&&r.y==y);
const blk=(x,y)=>x<0||y<0||x>=N||y>=N||sw(x,y)||dw(x,y)||fa(x,y)||rb(x,y)||(S.mobs&&S.mobs.some(m=>m.x==x&&m.y==y));
const inG=(x,y)=>S.gen&&S.gen.hp>0&&Math.abs(x-S.gen.x)<=1&&Math.abs(y-S.gen.y)<=1;
const bad=(x,y)=>blk(x,y)||hAt(x,y)||inB(x,y)||inG(x,y);
const DX=[1,0,-1,0],DY=[0,1,0,-1],beltAt=(x,y)=>S.belts.find(b=>b.x==x&&b.y==y);
const own=()=>S.ph=="boss"||S.ph=="resolve"?"boss":"hero";
const SQ=k=>({sh:"sq",k});
function cov(a,pts){const s=new Set();pts.forEach(([px,py])=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++){const dx=Math.abs(x-px),dy=Math.abs(y-py);if(a.sh=="cross"?(dy==0&&dx<=a.k)||(dx==0&&dy<=a.k)||(a.dg&&dx==dy&&dx<=a.k):Math.max(dx,dy)<=a.k)s.add(y*N+x)}});return s}
function dangerSet(){const s=new Set();S.atks.filter(a=>!a.echo).forEach(a=>cov(CH[S.champ].at[a.i],a.p).forEach(i=>s.add(i)));return s}
const mobAt=(x,y)=>(S.mobs||[]).find(m=>m.x==x&&m.y==y);
function echoSet(){const s=new Set();(S.atks||[]).filter(a=>a.echo).forEach(a=>cov(CH[S.champ].at[a.i],a.p).forEach(i=>s.add(i)));return s}
const gDead=()=>!!(CH[S.champ]&&CH[S.champ].gen&&(!S.gen||S.gen.hp<=0));
const bMax=()=>gDead()?CST().apNoGen:CST().ap;
const bMv=()=>CST().move+(gDead()?CST().moveNoGen:0)+(S.boss.mvb||0)-slowOf(S.boss);
/* 빙결 결계: o.sl={n 이동 감소, r 이 라운드까지}, o.fz=이 라운드까지 행동불능 (마법진 발동 때 설정) */
const slowOf=o=>o&&o.sl&&o.sl.r>=S.round?o.sl.n:0,frozen=o=>!!(o&&o.fz>=S.round);
/* 마법진 범위(정사각형) 안인지 */
const inSq=(ox,oy,r,x,y)=>Math.abs(x-ox)<=r&&Math.abs(y-oy)<=r;
const crAt=(x,y)=>(S.cry||[]).findIndex(c=>c.x==x&&c.y==y);
const ecost=e=>e.c+(e.esc?(S.used[e.id]||0):0);
const pitAt=(x,y)=>(S.pits||[]).findIndex(p=>x>=p.x&&x<=p.x+1&&y>=p.y&&y<=p.y+1);
const mvOf=h=>Math.max(0,CLS[h.k].mv+(h.mvb||0)-(h.par>0?RULE.status.paralyzeMove:0));
