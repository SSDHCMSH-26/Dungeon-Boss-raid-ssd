/* [그리기] 캔버스·스프라이트 캐시·타일 묶음 */
const $=i=>document.getElementById(i),cv=$("c"),cx=cv.getContext("2d"),W=$("w");
const mkc=g=>{const c=document.createElement("canvas");c.width=c.height=16;const x=c.getContext("2d");g.forEach((r,j)=>r.forEach((q,i)=>{if(q){x.fillStyle=q;x.fillRect(i,j,1,1)}}));return c};
const SC={},TL={},UC={};
for(const k in SPF){if(k=="robot")continue;const g=G();SPF[k](g);SC[k]=mkc(outline(g))}
["#9aa7b8","#e6b23a","#e0555a"].forEach((c,i)=>{const g=G();SPF.robot(g,c);SC["robot"+(i+1)]=mkc(outline(g))});
const BTL=[0,1,2,3].map(d=>[0,1,2,3].map(ph=>mkc(beltG(d,ph)))),BTL2=[0,1,2,3].map(d=>[0,1,2,3].map(ph=>mkc(beltG(d,ph,1)))),BTV=[0,1,2,3].map(d=>[0,1,2,3].map(ph=>mkc(beltG(d,ph,0,1)))),BTV2=[0,1,2,3].map(d=>[0,1,2,3].map(ph=>mkc(beltG(d,ph,1,1)))),BTW=[0,1,2,3].map(d=>[0,1,2,3].map(ph=>mkc(beltG(d,ph,0,2)))),BTW2=[0,1,2,3].map(d=>[0,1,2,3].map(ph=>mkc(beltG(d,ph,1,2))));
const WTC=new Map();
function wTint(src,lv){let m=WTC.get(src);if(!m){m={};WTC.set(src,m)}if(!m[lv]){const c=document.createElement("canvas");c.width=src.width;c.height=src.height;const g=c.getContext("2d");g.imageSmoothingEnabled=false;g.drawImage(src,0,0);g.globalCompositeOperation="multiply";g.fillStyle=lv>2?"#3c3c46":lv>1?"#ffe566":"#e6d2b0";g.fillRect(0,0,c.width,c.height);g.globalCompositeOperation="source-atop";g.globalAlpha=lv>2?.35:.22;g.fillStyle=lv>2?"#000":lv>1?"#ffd21a":"#f5e6c8";g.fillRect(0,0,c.width,c.height);m[lv]=c}return m[lv]}
function tiles(id,dv){if(dv===undefined)dv=V()&&id=="vince"?(T2()?"vince2":"vince"):Vg()&&id=="gron"?"gron":"";const k=id+dv;if(!TL[k]){const th=dv=="vince"?TH.vince2:dv=="vince2"?TH.vince3:dv=="gron"?TH.gron2:TH[id];TL[k]={f:[0,1,2,3].map(v=>mkc(tile(th,"f",v))),w:mkc(tile(th,"w",0)),w2:mkc(tile(th,"w",1))}}return TL[k]}
function spURL(k){if(!UC[k]){const c=document.createElement("canvas");c.width=c.height=48;const g=c.getContext("2d");g.imageSmoothingEnabled=false;g.drawImage(SC[k],0,0,48,48);UC[k]=c.toDataURL()}return UC[k]}
function tURL(id){const dv=id=="vince"&&(T2())?(T2()?"vince2":"vince"):id=="gron"&&T2()?"gron":"",k="t"+id+dv;if(!UC[k]){const t=tiles(id,dv),c=document.createElement("canvas");c.width=64;c.height=16;const g=c.getContext("2d");[t.f[0],t.f[1],t.f[2],t.w].forEach((q,i)=>g.drawImage(q,i*16,0));UC[k]=c.toDataURL()}return UC[k]}
