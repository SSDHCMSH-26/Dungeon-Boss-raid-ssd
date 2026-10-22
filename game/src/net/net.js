/* [통신·저장] 둘이서 하기·이어하기 저장
   둘이서 하기 서버: claude.ai 아티팩트 안이면 claude db, 그 밖(GitHub 게임 주소 등)이면 Firebase(구글) Firestore + 익명 로그인.
   두 서버 모두 db.doc(경로).set / get(→ exists, data()) / onSnapshot 같은 모양이라 아래 코드는 그대로 씀. */
/* Firebase 설정: 원래 웹페이지에 공개되는 값(누가 무엇을 고칠 수 있는지는 Firestore 보안 규칙 docs/firestore.rules 로 막음) */
const FB_CFG={apiKey:"AIzaSyBtOzaRbtpRkzd1lfbS4MZLNCffX1GV0M8",authDomain:"dungeon-boss-raid-ssdh.firebaseapp.com",projectId:"dungeon-boss-raid-ssdh",storageBucket:"dungeon-boss-raid-ssdh.firebasestorage.app",messagingSenderId:"124653936363",appId:"1:124653936363:web:1971f413497da13b81e8ae"};
const loadJs=src=>new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>no(new Error("파일을 못 읽음: "+src));document.head.appendChild(s)});
async function fbNet(){if(typeof firebase=="undefined")for(const f of ["app","auth","firestore"])await loadJs("lib/firebase/firebase-"+f+"-compat.js");const app=firebase.apps.length?firebase.app():firebase.initializeApp(FB_CFG);const c=await app.auth().signInAnonymously();uid=c.user.uid;db=app.firestore();fbm=1;return 1}
async function net(){if(db)return 1;if(typeof claude=="undefined"){try{return await fbNet()}catch(e){console.error(e);db=null;alert((e.code=="auth/admin-restricted-operation"||e.code=="auth/operation-not-allowed"?"온라인 서버 설정이 아직 안 끝났어요 (Firebase 익명 로그인 꺼짐).":e.code=="permission-denied"?"온라인 서버 보안 규칙이 아직 안 올라갔어요.":"온라인 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.")+"\n("+(e.code||e.message)+")");return 0}}db=await claude.use("db");usr=await claude.use("user");if(!db||!usr){alert("이 기능은 claude.ai 로그인 상태에서만 가능해요.");return 0}uid=await usr.id();return 1}
const ref=()=>db.doc("games/"+L.code),pref=()=>db.doc("games/"+L.code+"/priv/s");
/* Firebase 모드(fbm)는 "보스 기기 = 심판": 보스 기기만 전체 상태(S)를 갖고 판정, 비공개 기록(priv)에 저장.
   용사 기기는 숨긴 정보가 빠진 view(S,"hero") 만 받고, 자기 행동은 명령(q)으로 보냄 → 보스 기기가 규칙대로 검증·적용 후 결과를 다시 보냄.
   (용사 화면은 바로 반응하도록 내 행동을 먼저 적용해 두고, 보스 기기 결과가 오면 그걸로 맞춤)
   claude.ai 안(claude db)은 예전처럼 두 기기가 전체 상태를 주고받음. */
let fbm=0;const FV=()=>firebase.firestore.FieldValue,ms=t=>t&&t.toMillis?t.toMillis():0;
const host=()=>fbm&&L.mode=="multi"&&L.role=="boss",guest=()=>fbm&&L.mode=="multi"&&L.role=="hero";
const HERO_CMD={setPick:"setup",pickHero:"setup",start:"setup",heroAct:"hero",heroItem:"hero",scrollHero:"hero",endHero:"hero"};
let pend=[],cmdN=0,depth=0,replaying=0,doneQ=[];
const apply0=apply;
apply=function(a){depth++;try{const r=apply0(a);if(depth==1&&guest()&&!replaying&&HERO_CMD[a.type]&&r&&!r.err&&!r.aim)sendCmd(a);return r}finally{depth--}};
function sendCmd(a){const it={n:Date.now()*100+(cmdN++%100),a:JSON.parse(JSON.stringify(a)),u:uid};pend.push(it);ref().update({q:FV().arrayUnion(it),th:FV().serverTimestamp()}).catch(netErr)}
/* 보스 기기: 용사 명령 처리(차례가 맞는 것만, 순서대로) */
function hostQ(q){let n=0;q.slice().sort((x,y)=>x.n-y.n).forEach(it=>{doneQ.push(it);if(it.n<=(S.qa||0)||it.u!==L.hu||!it.a)return;if(HERO_CMD[it.a.type]==S.ph&&!S.end)apply(it.a);S.qa=it.n;n++});if(n||doneQ.length)sync()}
/* 서버 저장(모아서 보내기): 행동마다 바로 쓰지 않고 PUSH_MS 동안 모아 마지막 상태 한 번만 저장 → 서버 쓰기 횟수 3~5배 절약.
   차례(S.ph)가 바뀌거나 게임이 끝나면 기다리지 않고 바로 보냄(상대가 바로 이어서 할 수 있게). 화면을 떠날 때도 바로 보냄. */
const PUSH_MS=800;let pushT=0,pushPh=null;
function flush(){if(pushT){clearTimeout(pushT);pushT=0}if(L.mode!="multi"||!db||!S||guest())return;pushPh=S.ph;
if(host()){const b=db.batch(),pub={s:JSON.stringify(view(S,"hero")),tb:FV().serverTimestamp()};if(doneQ.length){pub.q=FV().arrayRemove(...doneQ);doneQ=[]}b.update(ref(),pub);b.set(pref(),{s:JSON.stringify(S)});b.commit().catch(netErr);return}
ref().set({b:L.bu,h:L.hu,s:JSON.stringify(S)}).catch(netErr)}
function push(){if(L.mode=="multi"&&db&&!guest()){S.v=(S.v||0)+1;if(S.ph!==pushPh||S.end)flush();else if(!pushT)pushT=setTimeout(flush,PUSH_MS)}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState=="hidden"&&pushT)flush()});
/* 서버 오류 안내: 무료 한도 초과(resource-exhausted)면 한도가 다시 차는 시각(미국 서부 자정 = 이 기기 시각으로 환산)과 함께 한 번 알림 */
let netWarned=0;
function resetAt(){try{const p=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"numeric",hourCycle:"h23"}).formatToParts(new Date()),g=t=>+p.find(x=>x.type==t).value,left=(24*60-(g("hour")*60+g("minute")))*60000,d=new Date(Date.now()+left),h=d.getHours();return (h<12?"오전 ":"오후 ")+(h%12||12)+"시"+(d.getMinutes()?" "+d.getMinutes()+"분":"")}catch(e){return "오후 4~5시"}}
function netErr(e){console.error(e);const c=e&&e.code;if(netWarned)return;if(c=="resource-exhausted"){netWarned=1;alert("오늘 온라인 서버 사용량(무료 한도)이 다 찼어요 😢\n"+resetAt()+" 이후에 다시 이어할 수 있어요. (방 기록은 그대로 남아 있어요)\n혼자 하기·한 기기 테스트는 지금도 할 수 있어요.")}else if(c=="permission-denied"){netWarned=1;alert("온라인 서버가 저장을 거절했어요 (권한). 방에 다시 들어가 보세요.")}else if(c=="unavailable"){netWarned=1;alert("온라인 서버에 연결이 끊겼어요. 인터넷 연결을 확인해 주세요. (다시 연결되면 자동으로 이어져요)")}}
window.addEventListener("unhandledrejection",ev=>{const c=ev.reason&&ev.reason.code;if(c=="resource-exhausted"||c=="permission-denied"||c=="unavailable")netErr(ev.reason)});
/* 기권·무응답 승리(Firebase 모드): 방 문서의 w = {k:"ff" 기권 | "to" 무응답 승리, by: 누른 사람}. 두 기기 모두 w 를 보고 게임을 끝냄.
   상대 차례에 상대가 RULE.online.idleSec 초 동안 아무 행동이 없으면(상대 마지막 저장 시각·차례가 넘어온 시각 중 늦은 쪽 기준) 승리 처리 버튼이 생김 */
const sideN=r=>r=="boss"?"보스 진영":"용사 진영";
function endMsg(w){const loser=w.k=="ff"?(w.by==L.bu?"boss":"hero"):(w.by==L.bu?"hero":"boss"),win=loser=="boss"?"hero":"boss";return "🏆 "+sideN(win)+" 승리! ("+sideN(loser)+(w.k=="ff"?" 기권":" 응답 없음")+")"}
let turnT=0,turnPh=null;
function idleLeft(){if(!fbm||L.mode!="multi"||!S||S.end||L.wait||S.ph=="setup")return null;const opp=L.role=="boss"?"hero":"boss",oppTurn=own()==opp||(S.ph=="resolve"&&opp=="boss")||(guest()&&pend.length);if(!oppTurn)return null;const last=Math.max(L.role=="boss"?L.th||0:L.tb||0,turnT,pend.length?pend[0].n/100:0);return RULE.online.idleSec*1000-(Date.now()-last)}
function onlineBar(){if(!fbm||L.mode!="multi"||!S||S.end||L.wait)return"";const t=idleLeft();return '<div class="r">'+(t!==null&&t<=0?BT("⏱ 상대 응답 없음 → 승리 처리","claimWin()","go s"):"")+BT("🏳️ 기권","forfeit()","s")+'</div>'}
function setW(w){if(S.end)return;S.end=endMsg(w);ui();ref().update({w,[L.role=="boss"?"tb":"th"]:FV().serverTimestamp()}).catch(netErr)}
function forfeit(){if(confirm("정말 기권할까요? 상대 진영의 승리로 끝나요."))setW({k:"ff",by:uid})}
function claimWin(){const t=idleLeft();if(t===null||t>0)return;setW({k:"to",by:uid})}
setInterval(()=>{if(fbm&&L.mode=="multi"&&L.scr=="game"&&S&&!S.end){const t=idleLeft();if(t!==null&&t<=0&&!L.idleShown){L.idleShown=1;ui()}if(t===null||t>0)L.idleShown=0}},5000);
function onPh(){if(S&&S.ph!==turnPh){turnPh=S.ph;turnT=Date.now()}}
function listen(){if(fbm)return listenFb();ref().onSnapshot(s=>{if(!s.exists)return;const v=s.data(),pp=S&&S.ph,nv=fixState(JSON.parse(v.s));L.bu=v.b;L.hu=v.h;if(S&&S.v&&nv.v&&nv.v<S.v)return;S=nv;L.wait=!(L.bu&&L.hu);if(S.ph!=pp){L.menu=1;L.act=null;L.picks=[];if(S.ph=="hero")L.si=Math.max(0,S.heroes.findIndex(h=>!h.dead))}pushPh=S.ph;netWarned=0;ui();tick()},netErr)}
function listenFb(){ref().onSnapshot(s=>{if(!s.exists)return;const v=s.data(),pp=S&&S.ph;L.bu=v.b;L.hu=v.h;L.tb=ms(v.tb)||L.tb;L.th=ms(v.th)||L.th;L.wait=!(L.bu&&L.hu);
if(host()){if(!S.end)hostQ(v.q||[])}else{const nv=fixState(JSON.parse(v.s));S=nv;pend=pend.filter(c=>c.n>(S.qa||0));replaying=1;try{pend.forEach(c=>{try{apply0(c.a)}catch(e){}})}finally{replaying=0}}
if(v.w)S.end=endMsg(v.w);if(S.ph!=pp){L.menu=1;L.act=null;L.picks=[];if(S.ph=="hero")L.si=Math.max(0,S.heroes.findIndex(h=>!h.dead))}onPh();pushPh=S.ph;netWarned=0;ui();tick()},netErr)}
const reset=()=>{L.bag=0;L.insp=null;for(const k in VP)delete VP[k];L.act=null;L.picks=[];L.si=0;L.menu=1};
async function create(){if(!await net())return;L.code=Math.random().toString(36).slice(2,6).toUpperCase();L.bu=L.role=="boss"?uid:"";L.hu=L.role=="hero"?uid:"";S=newS();L.wait=1;L.scr="game";reset();pend=[];doneQ=[];
if(fbm){const ts=FV().serverTimestamp();await ref().set(Object.assign({b:L.bu,h:L.hu,s:JSON.stringify(L.role=="boss"?view(S,"hero"):S),q:[]},L.role=="boss"?{tb:ts}:{th:ts}));if(L.role=="boss")await pref().set({s:JSON.stringify(S)})}
else await ref().set({b:L.bu,h:L.hu,s:JSON.stringify(S)});onPh();listen();ui()}
async function join(){if(!await net())return;L.code=($("cd").value||"").toUpperCase();const d=await ref().get();if(!d.exists)return alert("방을 찾을 수 없어요");const v=d.data();L.bu=v.b;L.hu=v.h;
if(!L.bu){L.bu=uid;L.role="boss"}else if(!L.hu){L.hu=uid;L.role="hero"}else return alert("이미 가득 찬 방이에요");
S=fixState(JSON.parse(v.s));L.scr="game";L.wait=0;reset();pend=[];doneQ=[];
if(fbm){if(L.role=="boss"){await ref().update({b:uid,tb:FV().serverTimestamp()});await pref().set({s:JSON.stringify(S)});await ref().update({s:JSON.stringify(view(S,"hero")),tb:FV().serverTimestamp()})}else await ref().update({h:uid,th:FV().serverTimestamp()})}
else await ref().set({b:L.bu,h:L.hu,s:JSON.stringify(S)});onPh();listen();ui()}
function startSolo(){S=newS();L.scr="game";L.wait=0;reset();L.code="";ui();tick()}
const SAVEK="pdr_save";
function save(){try{if(L.scr!="game"||!S||S.end){localStorage.removeItem(SAVEK);return}localStorage.setItem(SAVEK,JSON.stringify({S,m:L.mode,r:L.role,si:L.si,c:L.code}))}catch(e){}}
function loadSave(){try{const d=JSON.parse(localStorage.getItem(SAVEK)||"null");return d&&d.S&&!d.S.end?d:null}catch(e){return null}}
async function rejoin(){if(!await net()){L.scr="menu";ui();return}const d=await ref().get();if(!d.exists){alert("방을 찾을 수 없어요");L.scr="menu";ui();return}const v=d.data();L.bu=v.b;L.hu=v.h;if(uid==L.bu)L.role="boss";else if(uid==L.hu)L.role="hero";else{alert("이 방의 참가자가 아니에요");L.scr="menu";ui();return}pend=[];doneQ=[];
if(fbm&&L.role=="boss"){const pv=await pref().get();S=fixState(JSON.parse(pv.exists?pv.data().s:v.s))}else S=fixState(JSON.parse(v.s));if(v.w)S.end=endMsg(v.w);onPh();L.wait=!(L.bu&&L.hu);listen();ui();tick()}
function resume(){const d=loadSave();if(!d)return;S=d.S;L.mode=d.m;L.role=d.r;fixState(S,d);L.si=d.si||0;L.code=d.c||"";L.wait=0;L.act=null;L.picks=[];L.menu=1;L.fit=0;if(L.mode=="multi"){L.scr="game";rejoin()}else{L.scr="game";ui();tick()}}
/* 행동 뒤: 규칙 정리(settle: 상자 열기 판정·숨김 정보 복사) → 화면 → 전송 → 진행 */
function sync(){try{apply({type:"settle"})}catch(e){}ui();push();tick()}
