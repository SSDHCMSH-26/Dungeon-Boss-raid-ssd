/* [기기] 이 기기의 화면 상태 L (선택 중인 스킬·찍은 칸·디자인 등), 확대 단계 */
let Z=16,db,usr,uid,L={insp:null,itab:"info",design:DSN.order[0],bsel:"v",scr:"menu",mode:"solo",role:"hero",act:null,picks:[],si:0,traps:[],bombs:[],used:{},menu:1,code:"",wait:0,bu:"",hu:"",fit:0};
const ZL=[12,16,20,24,32,40];
try{const dz=localStorage.getItem("design");if(dz)L.design=DSN.legacy[dz]||dz}catch(e){}
const mine=()=>!S.end&&!L.wait&&S.ph!="resolve"&&S.ph!="setup"&&(L.mode=="local"||own()==L.role);
const sel=()=>S.heroes[L.si];
/* 화면 맞춤: 가로 화면이면 body 에 land, 맵 상자를 정사각형으로 맞추고 "맵 전체가 딱 맞는" 칸 크기(L.zfit)를 계산.
   확대·축소(➖➕)는 L.zfit 부터 시작. 화면 크기·방향이 바뀌면 다시 맞춤 */
const isLand=()=>{try{return matchMedia("(orientation: landscape) and (min-width: 600px)").matches}catch(e){return false}};
function fitMap(){const land=isLand(),w=document.getElementById("w");if(!w)return;let side;
if(land)side=Math.min(window.innerHeight-14,window.innerWidth-16-380-20);else{const g=document.getElementById("g"),cw=(g&&g.clientWidth)||w.clientWidth||window.innerWidth;side=Math.min(cw,Math.round(window.innerHeight*.64))}
side=Math.max(N*8+8,side);L.zfit=Math.max(8,Math.floor((side-8)/N));Z=L.zfit;const px=N*Z+8;w.style.height=px+"px";w.style.width=land?px+"px":"";L.fit=1}
function layoutFix(){const land=isLand(),am=document.getElementById("am"),gr=document.getElementById("gr"),mw=document.getElementById("mw");if(document.body)document.body.classList.toggle("land",land);if(!am||!gr||!mw)return;if(land&&am.parentElement!==gr)gr.insertBefore(am,gr.firstChild);else if(!land&&am.parentElement!==mw)mw.appendChild(am)}
/* 폭이 크게 바뀌거나 가로↔세로가 바뀔 때만 다시 맞춤(주소창이 숨거나 스크롤바가 생기는 정도로는 확대 상태 유지) */
let fitT=0,fitW=window.innerWidth,fitL=isLand();window.addEventListener("resize",()=>{clearTimeout(fitT);fitT=setTimeout(()=>{const w=window.innerWidth,l=isLand();if(Math.abs(w-fitW)<60&&l==fitL)return;fitW=w;fitL=l;L.fit=0;try{if(L.scr!="menu")ui()}catch(e){}},150)});
