/* [입력] 맵 터치·버튼 → 행동 */
const spec=a=>a=="i"?{id:"item",pk:1,r:ITEF.scroll.range,n:"📜 순간이동 스크롤"}:a[0]=="a"?CH[S.champ].at[+a.slice(1)]:CH[S.champ].ex[+a.slice(1)];
const need=()=>S.ph=="boss"&&L.act!==null&&L.act!="m"?spec(L.act).pk:1;
cv.onclick=e=>{const r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/Z),y=Math.floor((e.clientY-r.top)/Z);if(x<0||y<0||x>=N||y>=N)return;if(S.ph!="setup"&&(L.act===null||!mine())){const u=unitAt(x,y);if(u){L.insp=u;L.itab="info"}}if(!mine())return ui();
if(L.act===null){if(S.ph=="hero"){const i=S.heroes.findIndex(h=>!h.dead&&h.x==x&&h.y==y);if(i>=0){L.si=i;L.menu=1}}else if(inB(x,y)){L.menu=1;L.bsel="v"}else if(inG(x,y)){L.menu=1;L.bsel="g"}return ui()}
if(S.ph=="boss"&&L.act!=="m"&&spec(L.act).id=="dig"&&!(sw(x,y)||dw(x,y))&&L.picks.findIndex(q=>q[0]==x&&q[1]==y)<0){$("lg").textContent="⛏️ 벽 칸만 고를 수 있어요";return}
if(S.ph=="boss"&&L.act!=="m"&&spec(L.act).id=="hop"&&pitAt(x,y)<0&&L.picks.findIndex(q=>q[0]==x&&q[1]==y)<0){$("lg").textContent="🌀 구덩이 칸만 고를 수 있어요";return}
const f=L.picks.findIndex(q=>q[0]==x&&q[1]==y);if(f>=0)L.picks.splice(f,1);else{if(L.picks.length>=need())L.picks.pop();L.picks.push([x,y])}ui()}
function pickA(a){if(a=="bag"){L.bag=L.bag?0:1;L.act=null;L.picks=[];ui();return}L.bag=0;if(a=="gc"){L.act=null;L.picks=[];if(genCharge())sync();else{ui();$("lg").textContent="❌ 발전은 AP 1이 필요하고 턴당 1회만 쓸 수 있어요"}return}if(S.ph=="boss"&&typeof a=="string"&&a[0]=="e"&&spec(a).pk==0){L.act=null;L.picks=[];if(bExtra(spec(a),[]))sync();else{ui();$("lg").textContent="❌ 지금은 사용할 수 없어요 (벨트 위에 유닛이 없거나 막혀 있어요)"}return}L.act=a;L.picks=[];ui()}
function pickK(k){const p=S.pick,i=p.indexOf(k);if(i>=0)p.splice(i,1);else if(p.length<3)p.push(k);ui();push()}
function okAct(){const a=L.act,p=L.picks;let r=0;
if(a=="i")r=useScroll(p[0][0],p[0][1]);else if(S.ph=="boss"){if(a=="m")r=bMove(...p[0]);else if(a[0]=="a")r=bAtk(+a.slice(1),p,L.bsel!="g");else r=bExtra(spec(a),p)}
else r=act(sel(),a,...p[0]);
if(r){const hid=S.ph=="boss"&&a!="m"&&a[0]=="e"&&["trap","bomb"].includes(spec(a).id);L.act=null;L.picks=[];if(hid){ui();$("lg").textContent="🕳️ 숨김 설치 완료 (용사에겐 보이지 않아요)"}else sync()}else $("lg").textContent="❌ 범위 밖이거나 사용할 수 없는 위치예요"}
function zoom(d){let i=ZL.indexOf(Z);if(i<0)i=1;Z=ZL[cl(i+d,0,ZL.length-1)];draw()}
function jump(w){const h=sel(),p=w&&h?[h.x,h.y]:[S.boss.x,S.boss.y];W.scrollTo({left:p[0]*Z-W.clientWidth/2,top:p[1]*Z-W.clientHeight/2})}
