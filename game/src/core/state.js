/* [규칙] 게임 상태 S, 새 게임 상태, 칸·거리·막힘 판정 같은 기본 도구 */
const N=30;
let S;
const ch=(a,b,c,d)=>Math.max(Math.abs(a-c),Math.abs(b-d)),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),rn=n=>Math.floor(RAND()*n),cr=(v,b,r)=>cl(cl(v,b-r,b+r),0,N-1);
/* 숨김 정보: S.sec = 보스만 아는 것(가시 함정·폭탄로봇), S.used = 이번 턴 스킬 사용 횟수.
   예전 저장·방 데이터(이 칸이 없던 버전)는 fixState 로 채움 */
function fixState(st,old){if(!st)return st;if(!st.sec)st.sec={traps:(old&&old.t)||[],bombs:(old&&old.b)||[],bid:(old&&old.bid)||0};if(!st.used)st.used=(old&&old.u)||{};return st}
const newS=()=>({ph:"setup",pick:[],champ:"",map:"",fac:[],rob:[],walls:[],fid:1,rid:1,belts:[],round:1,boss:{x:15,y:2,hp:0,max:0,moved:0,ap:0},gen:null,heroes:[],atks:[],rev:[],mv:[],sec:{traps:[],bombs:[],bid:0},used:{},log:"보스 진영은 챔피언을, 용사 진영은 영웅 3명을 고르세요.",end:""});
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
const bMv=()=>CST().move+(gDead()?CST().moveNoGen:0)+(S.boss.mvb||0);
const crAt=(x,y)=>(S.cry||[]).findIndex(c=>c.x==x&&c.y==y);
const ecost=e=>e.c+(e.esc?(S.used[e.id]||0):0);
const pitAt=(x,y)=>(S.pits||[]).findIndex(p=>x>=p.x&&x<=p.x+1&&y>=p.y&&y<=p.y+1);
const mvOf=h=>Math.max(0,CLS[h.k].mv+(h.mvb||0)-(h.par>0?RULE.status.paralyzeMove:0));
