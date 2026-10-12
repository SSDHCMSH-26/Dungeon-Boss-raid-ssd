/* [그리기] 그림 파일 불러오기·그리기 도우미, 이펙트 그림 */
const V=()=>(T2())&&S&&S.champ=="vince",V2=()=>T2()&&S&&S.champ=="vince",Vg=()=>T2()&&S&&S.champ=="gron",RW=[1,1.25,1.6],RH=[1.4,1.6,1.75];
const IM={};
// 그림 묶음(ART/ART2/ART3)을 처음 쓸 때 그 묶음 그림을 한꺼번에 미리 불러 둠 → 이동·공격 그림을 처음 쓸 때 "아직 안 불러온 그림" 때문에 옛 임시 그림이 잠깐 나오는 문제 방지
const PRE={};
function artLoad(s,kk,k){let i=IM[kk];if(!i){i=IM[kk]=new Image();i.onload=()=>{if(L.scr=="game")draw()};i.src=s[k]}return i}
function art(k){const t2=T2(),g3=t2&&S&&S.champ=="gron",v2=t2&&!g3,s=g3?ART3:v2?ART2:ART,sk=g3?"3":v2?"2":"1",kk=sk+k;if(!PRE[sk]){PRE[sk]=1;Object.keys(s).forEach(x=>artLoad(s,sk+x,x))}if(!s[k])return(k.length>2&&k.endsWith("b")&&s[k.slice(0,-1)])?art(k.slice(0,-1)):null;const i=artLoad(s,kk,k);return i.complete&&i.naturalWidth?i:null}
// 보스 그림(테마 2·3 공용 묶음)은 페이지를 열 때 미리 불러 둠(메뉴를 보는 동안 받아짐) → 판 시작 직후 첫 이동에도 바로 보임
[["2",ART2],["3",ART3]].forEach(([sk,s])=>{PRE[sk]=1;Object.keys(s).forEach(x=>artLoad(s,sk+x,x))});
const fxR=()=>S&&S.fxT&&Date.now()-S.fxT<1500,bossKey=v=>V2()?(fxR()?"v2":S.atks.length?"v1":"v0"):(v.q.length?"v1":S.atks.length?"v2":"v0");
function spI(k,mx,yb,w,h){const i=art(k);if(!i)return 0;const r=i.naturalWidth/i.naturalHeight;let dw=w,dh=w/r;if(dh>h){dh=h;dw=h*r}cx.imageSmoothingEnabled=true;cx.drawImage(i,mx-dw/2,yb-dh,dw,dh);cx.imageSmoothingEnabled=false;return 1}
function g3(k){const kk="G"+k;let i=IM[kk];if(!i){i=IM[kk]=new Image();i.onload=()=>{if(L.scr=="game")draw()};i.src=ART3[k]}return i.complete&&i.naturalWidth?i:null}
function g3T(k,x,y,w,h){const i=g3(k);if(!i)return 0;cx.imageSmoothingEnabled=true;cx.drawImage(i,x,y,w,h);cx.imageSmoothingEnabled=false;return 1}
function spT(k,x,y,w,h){const i=art(k);if(!i)return 0;cx.imageSmoothingEnabled=true;cx.drawImage(i,x,y,w,h);cx.imageSmoothingEnabled=false;return 1}
const MOBA=IMG.MOBA;
const MOBI={};
function mobi(k){let i=MOBI[k];if(i===undefined){const d=MOBA[k];if(!d)return MOBI[k]=null;i=MOBI[k]=new Image();i.onload=()=>{if(L.scr=="game")draw()};i.src=d}return i&&i.complete&&i.naturalWidth?i:null}
const CRI={};
["y","b"].forEach(k=>{const im=new Image();im.onload=()=>{try{draw()}catch(e){}};im.src=IMG.CRYSTAL[k];CRI[k]=im});
const FXD=IMG.FXD;
const FXI={};
Object.keys(FXD).forEach(k=>{const im=new Image();im.src=FXD[k];FXI[k]=im});
const XI={};
function xImg(k){let i=XI[k];if(!i){i=XI[k]=new Image();i.src=ART2[k]}return i.complete&&i.naturalWidth?i:null}
const fxF=()=>S&&S.rfxT&&Date.now()-S.rfxT<900;
const fxE=()=>S&&S.revT&&Date.now()-S.revT<1500;
function fxS(k,x0,yb,w,al){const i=FXI[k];if(!i||!i.complete||!i.naturalWidth)return;const h=w*i.naturalHeight/i.naturalWidth;cx.globalAlpha=Math.max(0,Math.min(1,al));cx.imageSmoothingEnabled=true;cx.drawImage(i,x0-w/2,yb-h,w,h);cx.imageSmoothingEnabled=false;cx.globalAlpha=1}
function spJ(i,mx,yb,w,h){if(!i)return 0;const r=i.naturalWidth/i.naturalHeight;let dw=w,dh=w/r;if(dh>h){dh=h;dw=h*r}cx.imageSmoothingEnabled=true;cx.drawImage(i,mx-dw/2,yb-dh,dw,dh);cx.imageSmoothingEnabled=false;return 1}
