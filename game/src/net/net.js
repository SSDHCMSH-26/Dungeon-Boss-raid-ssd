/* [통신·저장] 둘이서 하기·이어하기 저장
   둘이서 하기 서버: claude.ai 아티팩트 안이면 claude db, 그 밖(GitHub 게임 주소 등)이면 Firebase(구글) Firestore + 익명 로그인.
   두 서버 모두 db.doc(경로).set / get(→ exists, data()) / onSnapshot 같은 모양이라 아래 코드는 그대로 씀. */
/* Firebase 설정: 원래 웹페이지에 공개되는 값(누가 무엇을 고칠 수 있는지는 Firestore 보안 규칙 docs/firestore.rules 로 막음) */
const FB_CFG={apiKey:"AIzaSyBtOzaRbtpRkzd1lfbS4MZLNCffX1GV0M8",authDomain:"dungeon-boss-raid-ssdh.firebaseapp.com",projectId:"dungeon-boss-raid-ssdh",storageBucket:"dungeon-boss-raid-ssdh.firebasestorage.app",messagingSenderId:"124653936363",appId:"1:124653936363:web:1971f413497da13b81e8ae"};
const loadJs=src=>new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>no(new Error("파일을 못 읽음: "+src));document.head.appendChild(s)});
async function fbNet(){if(typeof firebase=="undefined")for(const f of ["app","auth","firestore"])await loadJs("lib/firebase/firebase-"+f+"-compat.js");const app=firebase.apps.length?firebase.app():firebase.initializeApp(FB_CFG);const c=await app.auth().signInAnonymously();uid=c.user.uid;db=app.firestore();return 1}
async function net(){if(db)return 1;if(typeof claude=="undefined"){try{return await fbNet()}catch(e){console.error(e);db=null;alert((e.code=="auth/admin-restricted-operation"||e.code=="auth/operation-not-allowed"?"온라인 서버 설정이 아직 안 끝났어요 (Firebase 익명 로그인 꺼짐).":e.code=="permission-denied"?"온라인 서버 보안 규칙이 아직 안 올라갔어요.":"온라인 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.")+"\n("+(e.code||e.message)+")");return 0}}db=await claude.use("db");usr=await claude.use("user");if(!db||!usr){alert("이 기능은 claude.ai 로그인 상태에서만 가능해요.");return 0}uid=await usr.id();return 1}
const ref=()=>db.doc("games/"+L.code);
function push(){if(L.mode=="multi"&&db){S.v=(S.v||0)+1;ref().set({b:L.bu,h:L.hu,s:JSON.stringify(S)}).catch(e=>console.error(e))}}
function listen(){ref().onSnapshot(s=>{if(!s.exists)return;const v=s.data(),pp=S&&S.ph,nv=fixState(JSON.parse(v.s));L.bu=v.b;L.hu=v.h;if(S&&S.v&&nv.v&&nv.v<S.v)return;S=nv;L.wait=!(L.bu&&L.hu);if(S.ph!=pp){L.menu=1;L.act=null;L.picks=[];if(S.ph=="hero")L.si=Math.max(0,S.heroes.findIndex(h=>!h.dead))}ui();tick()},e=>console.error(e))}
const reset=()=>{L.bag=0;L.insp=null;for(const k in VP)delete VP[k];L.act=null;L.picks=[];L.si=0;L.menu=1};
async function create(){if(!await net())return;L.code=Math.random().toString(36).slice(2,6).toUpperCase();L.bu=L.role=="boss"?uid:"";L.hu=L.role=="hero"?uid:"";S=newS();L.wait=1;L.scr="game";reset();await ref().set({b:L.bu,h:L.hu,s:JSON.stringify(S)});listen();ui()}
async function join(){if(!await net())return;L.code=($("cd").value||"").toUpperCase();const d=await ref().get();if(!d.exists)return alert("방을 찾을 수 없어요");const v=d.data();L.bu=v.b;L.hu=v.h;
if(!L.bu){L.bu=uid;L.role="boss"}else if(!L.hu){L.hu=uid;L.role="hero"}else return alert("이미 가득 찬 방이에요");
S=fixState(JSON.parse(v.s));L.scr="game";L.wait=0;reset();await ref().set({b:L.bu,h:L.hu,s:JSON.stringify(S)});listen();ui()}
function startSolo(){S=newS();L.scr="game";L.wait=0;reset();L.code="";ui();tick()}
const SAVEK="pdr_save";
function save(){try{if(L.scr!="game"||!S||S.end){localStorage.removeItem(SAVEK);return}localStorage.setItem(SAVEK,JSON.stringify({S,m:L.mode,r:L.role,si:L.si,c:L.code}))}catch(e){}}
function loadSave(){try{const d=JSON.parse(localStorage.getItem(SAVEK)||"null");return d&&d.S&&!d.S.end?d:null}catch(e){return null}}
async function rejoin(){if(!await net()){L.scr="menu";ui();return}const d=await ref().get();if(!d.exists){alert("방을 찾을 수 없어요");L.scr="menu";ui();return}const v=d.data();L.bu=v.b;L.hu=v.h;if(uid==L.bu)L.role="boss";else if(uid==L.hu)L.role="hero";else{alert("이 방의 참가자가 아니에요");L.scr="menu";ui();return}S=fixState(JSON.parse(v.s));L.wait=!(L.bu&&L.hu);listen();ui();tick()}
function resume(){const d=loadSave();if(!d)return;S=d.S;L.mode=d.m;L.role=d.r;fixState(S,d);L.si=d.si||0;L.code=d.c||"";L.wait=0;L.act=null;L.picks=[];L.menu=1;L.fit=0;if(L.mode=="multi"){L.scr="game";rejoin()}else{L.scr="game";ui();tick()}}
/* 행동 뒤: 규칙 정리(settle: 상자 열기 판정·숨김 정보 복사) → 화면 → 전송 → 진행 */
function sync(){try{apply({type:"settle"})}catch(e){}ui();push();tick()}
