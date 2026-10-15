/* [규칙] 컴퓨터(AI) 보스·용사 */
const AI=DATA.ai,AB=AI.boss,AH=AI.hero,cex=(c,id)=>c.ex.find(e=>e.id==id);
function aiSetup(){apply({type:"setPick",ids:shuffle(Object.keys(CLS),arn).slice(0,3)});return apply({type:"start"})}
/* 마법진 피하기: 보스(3×3)가 피해를 주는 마법진(화염·빙결)에 닿는 자리인지. 마법진이 있을 때만 AI 주사위를 굴림(없으면 예전과 똑같이 진행) */
const cirHit=(x,y)=>S.heroes.some(h=>h.cir&&!h.dead&&CLS[h.k].sk[h.cir.j].fx.kind!="shield"&&Math.abs(x-h.cir.x)<=1+cirR(h)&&Math.abs(y-h.cir.y)<=1+cirR(h));
function aiDodge(t){const B=S.boss;if(!cirHit(B.x,B.y))return;let best=null,bd=1e9;const m=bMv();for(let dy=-m;dy<=m;dy++)for(let dx=-m;dx<=m;dx++){if(!(dx||dy)||(dx&&dy&&Math.abs(dx)!=Math.abs(dy)))continue;const x=B.x+dx,y=B.y+dy;if(!bOk(x,y)||cirHit(x,y))continue;const d=ch(x,y,t.x,t.y);if(d<bd){bd=d;best=[x,y]}}if(best)apply({type:"bossMove",x:best[0],y:best[1]})}
function aiBoss(){const B=S.boss,c=CH[S.champ],al=S.heroes.filter(h=>!h.dead).sort((a,b)=>ch(a.x,a.y,B.x,B.y)-ch(b.x,b.y,B.x,B.y)),t=al[0];
const cz=S.heroes.some(h=>h.cir&&!h.dead)&&ARAND()<AB.dodgeCircle.chance;if(cz)aiDodge(t);
if((!c.gen||gDead())&&ch(t.x,t.y,B.x,B.y)>AB.approachDist){let mx=cl(t.x-B.x,-bMv(),bMv()),my=cl(t.y-B.y,-bMv(),bMv());if(mx&&my){const m=Math.min(Math.abs(mx),Math.abs(my));mx=Math.sign(mx)*m;my=Math.sign(my)*m}if(!(cz&&cirHit(B.x+mx,B.y+my))&&!apply({type:"bossMove",x:B.x+mx,y:B.y+my})&&mx&&my&&!(cz&&cirHit(B.x+mx,B.y)))apply({type:"bossMove",x:B.x+mx,y:B.y})}
if(S.champ=="gron"){const AG=AB.gron;if(B.ap>=AG.trapChest.minAp&&!(S.cd&&S.cd.tchest>0)&&ARAND()<AG.trapChest.chance){const e=cex(c,"tchest");apply({type:"bossBuild",id:e.id,p:[[cr(t.x+arn(7)-3,B.x,e.r),cr(t.y-2-arn(3),B.y,e.r)]]})}if(B.ap>=AG.digPit.minAp&&pitAt(B.x,B.y)<0&&ARAND()<AG.digPit.chance)apply({type:"bossBuild",id:cex(c,"pit").id,p:[]});if(B.ap>=AG.hopPit.minAp&&pitAt(B.x,B.y)>=0&&(S.pits||[]).length>=AG.hopPit.minPits&&ARAND()<AG.hopPit.chance){const ps=(S.pits||[]).filter(z=>z!==S.pits[pitAt(B.x,B.y)]&&ch(z.x,z.y,B.x,B.y)<=AG.hopPit.range&&!hAt(z.x,z.y)).sort((a,b)=>ch(a.x,a.y,t.x,t.y)-ch(b.x,b.y,t.x,t.y));if(ps.length&&ch(ps[0].x,ps[0].y,t.x,t.y)<ch(B.x,B.y,t.x,t.y))apply({type:"bossBuild",id:cex(c,"hop").id,p:[[ps[0].x,ps[0].y]]})}if(ARAND()<AG.wall.chance){const e=cex(c,"wall"),p=[];for(let n=0;n<AG.wall.tries&&p.length<e.pk;n++){const q=[cr(t.x+arn(5)-2,B.x,e.r),cr(t.y-1-arn(2),B.y,e.r)];if(!bad(q[0],q[1])&&!p.some(z=>z[0]==q[0]&&z[1]==q[1]))p.push(q)}if(p.length==e.pk)apply({type:"bossBuild",id:e.id,p:p})}}
else{const AV=AB.vince,F=AV.factory,f=S.fac.filter(z=>ch(z.x,z.y,B.x,B.y)<=F.range&&z.lv<FAC.maxLv);
if(B.ap>=F.minAp&&ARAND()<F.chance){const e=cex(c,"fac");if(S.fac.length>=F.upgradeMinFactories&&f.length&&ARAND()<F.upgradeChance){const z=f[arn(f.length)];apply({type:"bossBuild",id:e.id,p:[[z.x,z.y]]})}else for(let m=0;m<F.tries;m++)if(apply({type:"bossBuild",id:e.id,p:[[cr(B.x+arn(11)-5,B.x,e.r),cr(B.y+2+arn(6),B.y,e.r)]]}))break}
if(B.ap>=AV.bomb.minAp&&ARAND()<AV.bomb.chance){const e=cex(c,"bomb"),sx=cr(t.x+arn(3)-1,B.x,e.r),sy=cr(t.y-4-arn(3),B.y,e.r);apply({type:"bossBuild",id:e.id,p:[[sx,sy],[sx+Math.sign(t.x-sx),sy+Math.sign(t.y-sy)]]})}
if(B.ap>=AV.belt.minAp&&ARAND()<AV.belt.chance){const o=S.rob.length?S.rob[arn(S.rob.length)]:B,ax=Math.abs(t.x-o.x)>Math.abs(t.y-o.y),dx=ax?Math.sign(t.x-o.x):0,dy=ax?0:Math.sign(t.y-o.y),len=AV.belt.lenMin+arn(AV.belt.lenMax-AV.belt.lenMin+1);if(dx||dy){apply({type:"bossBuild",id:cex(c,"belt").id,p:[[o.x,o.y],[cl(o.x+dx*len,0,N-1),cl(o.y+dy*len,0,N-1)]]});apply({type:"bossBuild",id:cex(c,"run").id,p:[]})}}}
const U=c.gen&&!gDead()?S.gen:B;if(c.gen&&!gDead()&&!B.en&&ARAND()<AB.vince.selfCharge.chance)apply({type:"bossAttack",i:0,p:[[B.x,B.y]]});if(c.gen&&!gDead()&&U&&U.hp>0&&ARAND()<AB.vince.generatorCharge.chance)apply({type:"genCharge"});const rs=S.champ=="gron"?AB.gron.spikeTrap.reserveAp:0;if(U&&U.hp>0)for(let n=0;n<AB.attackTries;n++){const o=c.at.filter(a=>a.c<=U.ap-rs);if(!o.length)break;const a=o[arn(o.length)],i=c.at.indexOf(a),e=al[arn(al.length)];apply({type:"bossAttack",i:i,p:[[cr(e.x+arn(3)-1,U.x,a.r),cr(e.y+arn(3)-1,U.y,a.r)]]})}
if(c.gen&&!gDead()&&B.en>0)for(let n=0;n<AB.vince.enhancedAttackTries;n++){const o=c.at.filter(a=>a.c<=B.ap);if(!o.length)break;const a=o[arn(o.length)],i=c.at.indexOf(a),e=al[arn(al.length)];apply({type:"bossAttack",i:i,p:[[cr(e.x+arn(3)-1,B.x,a.r),cr(e.y+arn(3)-1,B.y,a.r)]],fb:1})}
if(S.champ=="gron")aiTrap(c);
apply({type:"endBoss"})}
/* 그론의 가시 함정: 이번 턴 예고한 공격 범위(Dz)와 벽을 뺀 칸 중, 용사가 지나갈 길목에 깐다.
   용사마다 갈 수 있는 칸(직선·대각선, 이동 거리 안)까지의 경로를 보고, 경로 칸에 점수를 줌.
   - 공격 범위 안에 있는 용사: 범위 밖 안전 칸으로 빠져나가는 길 (escapeWeight, 빠져나갈 길이 적을수록 길목 점수↑, 보스 쪽으로 가는 길 가산)
   - 범위 밖 용사: 보스에게 다가오는 길 (approachWeight) */
function aiTrap(c){const B=S.boss,AT=AB.gron.spikeTrap,e=cex(c,"trap"),Dz=dangerSet(),D=bfsD(B.x,B.y),sc=new Map();
S.heroes.forEach(h=>{if(h.dead)return;const m=mvOf(h),inZ=Dz.has(h.y*N+h.x),ds=[];for(let dy=-m;dy<=m;dy++)for(let dx=-m;dx<=m;dx++){const x=h.x+dx,y=h.y+dy,p=qp(h,x,y,m);if(!p||Dz.has(y*N+x))continue;if(!inZ&&D[y*N+x]>=D[h.y*N+h.x])continue;ds.push({x,y,p})}if(!ds.length)return;
const bd=Math.min(...ds.map(d=>D[d.y*N+d.x])),w=(inZ?AT.escapeWeight:AT.approachWeight)/ds.length;ds.forEach(d=>{const v=w*(D[d.y*N+d.x]==bd?AT.towardBossBonus:1);d.p.forEach(([x,y])=>{const i=y*N+x;if(!Dz.has(i))sc.set(i,(sc.get(i)||0)+v)})})});
const cs=[...sc.entries()].filter(([i])=>{const x=i%N,y=(i-x)/N;return !bad(x,y)&&ch(x,y,B.x,B.y)<=e.r&&!S.sec.traps.some(z=>z[0]==x&&z[1]==y)}).sort((a,b)=>b[1]-a[1]||a[0]-b[0]);
for(let n=0,k=0;n<AT.tries&&k<cs.length;n++)if(ARAND()<AT.chance){const i=cs[k++][0];apply({type:"bossBuild",id:e.id,p:[[i%N,(i-i%N)/N]]})}}
function bfsD(sx,sy){const D=new Array(N*N).fill(999),q=[[sx,sy]];D[sy*N+sx]=0;while(q.length){const [x,y]=q.shift();for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;const i=ny*N+nx;if(D[i]==999&&!blk(nx,ny)){D[i]=D[y*N+x]+1;q.push([nx,ny])}}}return D}
/* 컴퓨터 마법사의 마법진: 있으면 영창(목표가 범위 안이면 위력, 범위 바로 밖이면 확산, 아니면 영창 안 함 → 이번 턴 끝 발동),
   없으면 다친 아군이 모여 있으면 수호, 아니면 확률로 보스를 덮는 화염/빙결을 그림 */
function aiCircle(h){const k=CLS[h.k],i=S.heroes.indexOf(h),B=S.boss,c=h.cir,J=q=>k.sk.indexOf(q);if(!k.sk.some(q=>q.t=="c"))return 0;
if(c){if(c.ch||h.mc>0||c.lv>=CIRC.maxLv)return 0;const f=k.sk[c.j].fx,R=cirR(h),inn=r=>f.kind=="shield"?S.heroes.some(a=>!a.dead&&inSq(c.x,c.y,r,a.x,a.y)):Math.abs(B.x-c.x)<=1+r&&Math.abs(B.y-c.y)<=1+r;
const pw=cirW(h,"power"),sp=cirW(h,"spread");if(inn(R)&&pw&&h.ap>=pw.c)return apply({type:"heroAct",h:i,j:J(pw),x:h.x,y:h.y});if(!inn(R)&&sp&&h.ap>=sp.c&&inn(R+sp.fx.add))return apply({type:"heroAct",h:i,j:J(sp),x:h.x,y:h.y});return 0}
const cs=k.sk.filter(q=>q.t=="c"&&h.ap>=q.c);if(!cs.length)return 0;
const sh=cs.find(q=>q.fx.kind=="shield"),hu=S.heroes.filter(a=>!a.dead&&a.hp<a.max*AH.healBelow);
if(sh&&hu.length>=AH.circle.shieldMinAllies){const x=cr(hu[0].x,h.x,sh.r),y=cr(hu[0].y,h.y,sh.r);if(hu.filter(a=>inSq(x,y,sh.fx.radius,a.x,a.y)).length>=AH.circle.shieldMinAllies&&apply({type:"heroAct",h:i,j:J(sh),x,y}))return 1}
if(ARAND()>=AH.circle.chance)return 0;const mt=cs.find(q=>q.fx.kind=="meteor"),fr=cs.find(q=>q.fx.kind=="frost"),q=fr&&(!mt||ARAND()<AH.circle.frostChance)?fr:mt;if(!q)return 0;
const x=cr(B.x,h.x,q.r),y=cr(B.y,h.y,q.r);if(Math.abs(B.x-x)>1+q.fx.radius||Math.abs(B.y-y)>1+q.fx.radius)return 0;return apply({type:"heroAct",h:i,j:J(q),x,y})}
function aiHero(){const c=dangerSet(),B=S.boss,D=bfsD(B.x,B.y),bd=(x,y)=>D[y*N+x];
S.heroes.forEach(h=>{if(h.dead)return;const k=CLS[h.k],dg=()=>c.has(h.y*N+h.x);
const best=()=>{let b=null,d0=1e9;for(let dy=-mvOf(h);dy<=mvOf(h);dy++)for(let dx=-mvOf(h);dx<=mvOf(h);dx++){const x=h.x+dx,y=h.y+dy;if(c.has(y*N+x)||!qp(h,x,y,mvOf(h)))continue;if(bd(x,y)<d0){d0=bd(x,y);b=[x,y]}}return b};
if(dg()){const b=best();if(b)apply({type:"heroAct",h:S.heroes.indexOf(h),j:"m",x:b[0],y:b[1]})}
for(let n=0;n<AH.actionsPerTurn&&h.ap>0&&!S.end;n++){let did=0;if(aiCircle(h))continue;
k.sk.forEach((q,j)=>{if(did||h.ap<q.c)return;
if(q.t=="d"){const TG=[[cl(h.x,B.x-1,B.x+1),cl(h.y,B.y-1,B.y+1)]].concat(S.rob.map(r=>[r.x,r.y]).concat((S.mobs||[]).map(m=>[m.x,m.y])),S.fac.map(f=>[cl(h.x,f.x,f.x+1),cl(h.y,f.y,f.y+1)]),S.gen&&S.gen.hp>0?[[cl(h.x,S.gen.x-1,S.gen.x+1),cl(h.y,S.gen.y-1,S.gen.y+1)]]:[]).filter(z=>ch(z[0],z[1],h.x,h.y)<=q.r).sort((a,b)=>ch(a[0],a[1],h.x,h.y)-ch(b[0],b[1],h.x,h.y));if(TG[0])did=apply({type:"heroAct",h:S.heroes.indexOf(h),j:j,x:TG[0][0],y:TG[0][1]})}
else if(q.t=="h"){const a=S.heroes.find(e=>!e.dead&&e.hp<e.max*AH.healBelow&&ch(e.x,e.y,h.x,h.y)<=q.r);if(a)did=apply({type:"heroAct",h:S.heroes.indexOf(h),j:j,x:a.x,y:a.y})}
else if(q.t=="l"){const dx=B.x-h.x,dy=B.y-h.y;if(Math.max(Math.abs(dx),Math.abs(dy))<=q.r&&(!dx||!dy||Math.abs(dx)==Math.abs(dy)))did=apply({type:"heroAct",h:S.heroes.indexOf(h),j:j,x:h.x+Math.sign(dx),y:h.y+Math.sign(dy)})}
else if(q.t=="g"&&dg())did=apply({type:"heroAct",h:S.heroes.indexOf(h),j:j,x:h.x,y:h.y});else if(q.t=="o"&&!(h.cd&&h.cd[j]>0)){const near=[S.boss].concat(S.gen&&S.gen.hp>0?[S.gen]:[],S.rob).filter(u=>ch(u.x,u.y,h.x,h.y)<=q.fx.radius).length;if(near>=AH.manaMinTargets)did=apply({type:"heroAct",h:S.heroes.indexOf(h),j:j,x:h.x,y:h.y})}});
if(!did&&h.ap>=1&&ARAND()<AH.beltBreakChance){const bb=S.belts.find(z=>ch(z.x,z.y,h.x,h.y)<=RULE.hero.breakRange);if(bb)did=apply({type:"heroAct",h:S.heroes.indexOf(h),j:"x",x:bb.x,y:bb.y})}
if(!did){const b=best();if(b&&bd(b[0],b[1])<bd(h.x,h.y))did=apply({type:"heroAct",h:S.heroes.indexOf(h),j:"m",x:b[0],y:b[1]})}
if(!did)break}});
if(!S.end)apply({type:"endHero"})}
/* 혼자 하기에서 컴퓨터 보스가 챔피언 고르기 (공개된 챔피언 중 무작위) */
function aiPickChampId(){const ids=Object.keys(CH).filter(id=>CH[id].ok);return ids[arn(ids.length)]}
