/* [규칙] 컴퓨터(AI) 보스·용사 */
const AI=DATA.ai,AB=AI.boss,AH=AI.hero,cex=(c,id)=>c.ex.find(e=>e.id==id);
function aiSetup(){S.pick=Object.keys(CLS).sort(()=>Math.random()-.5).slice(0,3);start()}
function aiBoss(){const B=S.boss,c=CH[S.champ],al=S.heroes.filter(h=>!h.dead).sort((a,b)=>ch(a.x,a.y,B.x,B.y)-ch(b.x,b.y,B.x,B.y)),t=al[0];
if((!c.gen||gDead())&&ch(t.x,t.y,B.x,B.y)>AB.approachDist){let mx=cl(t.x-B.x,-bMv(),bMv()),my=cl(t.y-B.y,-bMv(),bMv());if(mx&&my){const m=Math.min(Math.abs(mx),Math.abs(my));mx=Math.sign(mx)*m;my=Math.sign(my)*m}if(!bMove(B.x+mx,B.y+my)&&mx&&my)bMove(B.x+mx,B.y)}
if(S.champ=="gron"){const AG=AB.gron;if(B.ap>=AG.trapChest.minAp&&!(S.cd&&S.cd.tchest>0)&&Math.random()<AG.trapChest.chance){const e=cex(c,"tchest");bExtra(e,[[cr(t.x+rn(7)-3,B.x,e.r),cr(t.y-2-rn(3),B.y,e.r)]])}if(B.ap>=AG.digPit.minAp&&pitAt(B.x,B.y)<0&&Math.random()<AG.digPit.chance)bExtra(cex(c,"pit"),[]);if(B.ap>=AG.hopPit.minAp&&(S.pits||[]).length>=AG.hopPit.minPits&&Math.random()<AG.hopPit.chance){const ps=(S.pits||[]).filter(z=>(z.x!=B.x||z.y!=B.y)&&ch(z.x,z.y,B.x,B.y)<=AG.hopPit.range&&!hAt(z.x,z.y)).sort((a,b)=>ch(a.x,a.y,t.x,t.y)-ch(b.x,b.y,t.x,t.y));if(ps.length&&ch(ps[0].x,ps[0].y,t.x,t.y)<ch(B.x,B.y,t.x,t.y))bExtra(cex(c,"hop"),[[ps[0].x,ps[0].y]])}if(Math.random()<AG.wall.chance){const e=cex(c,"wall"),p=[];for(let n=0;n<AG.wall.tries&&p.length<e.pk;n++){const q=[cr(t.x+rn(5)-2,B.x,e.r),cr(t.y-1-rn(2),B.y,e.r)];if(!bad(q[0],q[1])&&!p.some(z=>z[0]==q[0]&&z[1]==q[1]))p.push(q)}if(p.length==e.pk)bExtra(e,p)}
for(let n=0;n<AG.spikeTrap.tries;n++)if(Math.random()<AG.spikeTrap.chance){const e=cex(c,"trap");bExtra(e,[[cr(t.x+rn(5)-2,B.x,e.r),cr(t.y-rn(3),B.y,e.r)]])}}
else{const AV=AB.vince,F=AV.factory,f=S.fac.filter(z=>ch(z.x,z.y,B.x,B.y)<=F.range&&z.lv<FAC.maxLv);
if(B.ap>=F.minAp&&Math.random()<F.chance){const e=cex(c,"fac");if(S.fac.length>=F.upgradeMinFactories&&f.length&&Math.random()<F.upgradeChance){const z=f[rn(f.length)];bExtra(e,[[z.x,z.y]])}else for(let m=0;m<F.tries;m++)if(bExtra(e,[[cr(B.x+rn(11)-5,B.x,e.r),cr(B.y+2+rn(6),B.y,e.r)]]))break}
if(B.ap>=AV.bomb.minAp&&Math.random()<AV.bomb.chance){const e=cex(c,"bomb"),sx=cr(t.x+rn(3)-1,B.x,e.r),sy=cr(t.y-4-rn(3),B.y,e.r);bExtra(e,[[sx,sy],[sx+Math.sign(t.x-sx),sy+Math.sign(t.y-sy)]])}
if(B.ap>=AV.belt.minAp&&Math.random()<AV.belt.chance){const o=S.rob.length?S.rob[rn(S.rob.length)]:B,ax=Math.abs(t.x-o.x)>Math.abs(t.y-o.y),dx=ax?Math.sign(t.x-o.x):0,dy=ax?0:Math.sign(t.y-o.y),len=AV.belt.lenMin+rn(AV.belt.lenMax-AV.belt.lenMin+1);if(dx||dy){bExtra(cex(c,"belt"),[[o.x,o.y],[cl(o.x+dx*len,0,N-1),cl(o.y+dy*len,0,N-1)]]);bExtra(cex(c,"run"),[])}}}
const U=c.gen&&!gDead()?S.gen:B;if(c.gen&&!gDead()&&!B.en&&Math.random()<AB.vince.selfCharge.chance)bAtk(0,[[B.x,B.y]]);if(c.gen&&!gDead()&&U&&U.hp>0&&Math.random()<AB.vince.generatorCharge.chance)genCharge();if(U&&U.hp>0)for(let n=0;n<AB.attackTries;n++){const o=c.at.filter(a=>a.c<=U.ap);if(!o.length)break;const a=o[rn(o.length)],i=c.at.indexOf(a),e=al[rn(al.length)];bAtk(i,[[cr(e.x+rn(3)-1,U.x,a.r),cr(e.y+rn(3)-1,U.y,a.r)]])}
if(c.gen&&!gDead()&&B.en>0)for(let n=0;n<AB.vince.enhancedAttackTries;n++){const o=c.at.filter(a=>a.c<=B.ap);if(!o.length)break;const a=o[rn(o.length)],i=c.at.indexOf(a),e=al[rn(al.length)];bAtk(i,[[cr(e.x+rn(3)-1,B.x,a.r),cr(e.y+rn(3)-1,B.y,a.r)]],1)}
endBoss()}
function bfsD(sx,sy){const D=new Array(N*N).fill(999),q=[[sx,sy]];D[sy*N+sx]=0;while(q.length){const [x,y]=q.shift();for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;const i=ny*N+nx;if(D[i]==999&&!blk(nx,ny)){D[i]=D[y*N+x]+1;q.push([nx,ny])}}}return D}
function aiHero(){const c=dangerSet(),B=S.boss,D=bfsD(B.x,B.y),bd=(x,y)=>D[y*N+x];
S.heroes.forEach(h=>{if(h.dead)return;const k=CLS[h.k],dg=()=>c.has(h.y*N+h.x);
const best=()=>{let b=null,d0=1e9;for(let dy=-mvOf(h);dy<=mvOf(h);dy++)for(let dx=-mvOf(h);dx<=mvOf(h);dx++){const x=h.x+dx,y=h.y+dy;if(c.has(y*N+x)||!qp(h,x,y,mvOf(h)))continue;if(bd(x,y)<d0){d0=bd(x,y);b=[x,y]}}return b};
if(dg()){const b=best();if(b)act(h,"m",b[0],b[1])}
for(let n=0;n<AH.actionsPerTurn&&h.ap>0&&!S.end;n++){let did=0;
k.sk.forEach((q,j)=>{if(did||h.ap<q.c)return;
if(q.t=="d"){const T=[[cl(h.x,B.x-1,B.x+1),cl(h.y,B.y-1,B.y+1)]].concat(S.rob.map(r=>[r.x,r.y]).concat((S.mobs||[]).map(m=>[m.x,m.y])),S.fac.map(f=>[cl(h.x,f.x,f.x+1),cl(h.y,f.y,f.y+1)]),S.gen&&S.gen.hp>0?[[cl(h.x,S.gen.x-1,S.gen.x+1),cl(h.y,S.gen.y-1,S.gen.y+1)]]:[]).filter(z=>ch(z[0],z[1],h.x,h.y)<=q.r).sort((a,b)=>ch(a[0],a[1],h.x,h.y)-ch(b[0],b[1],h.x,h.y));if(T[0])did=act(h,j,T[0][0],T[0][1])}
else if(q.t=="h"){const a=S.heroes.find(e=>!e.dead&&e.hp<e.max*AH.healBelow&&ch(e.x,e.y,h.x,h.y)<=q.r);if(a)did=act(h,j,a.x,a.y)}
else if(q.t=="l"){const dx=B.x-h.x,dy=B.y-h.y;if(Math.max(Math.abs(dx),Math.abs(dy))<=q.r&&(!dx||!dy||Math.abs(dx)==Math.abs(dy)))did=act(h,j,h.x+Math.sign(dx),h.y+Math.sign(dy))}
else if(q.t=="g"&&dg())did=act(h,j,h.x,h.y);else if(q.t=="o"&&!(h.cd&&h.cd[j]>0)){const near=[S.boss].concat(S.gen&&S.gen.hp>0?[S.gen]:[],S.rob).filter(u=>ch(u.x,u.y,h.x,h.y)<=q.fx.radius).length;if(near>=AH.manaMinTargets)did=act(h,j,h.x,h.y)}});
if(!did&&h.ap>=1&&Math.random()<AH.beltBreakChance){const bb=S.belts.find(z=>ch(z.x,z.y,h.x,h.y)<=RULE.hero.breakRange);if(bb)did=act(h,"x",bb.x,bb.y)}
if(!did){const b=best();if(b&&bd(b[0],b[1])<bd(h.x,h.y))did=act(h,"m",b[0],b[1])}
if(!did)break}});
if(S.end)return sync();endHero()}
