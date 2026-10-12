/* [규칙] 맵 만들기 (맵 파일 / 랜덤 미로) */
function mazeMap(){const m=new Array(N*N).fill(0),CW=7,CR=5,rnd=n=>Math.floor(Math.random()*n),x0=c=>1+4*c,y0=c=>5+4*c;
for(let y=4;y<=24;y++)for(let x=0;x<N;x++)if(x<1||x>=28||y%4==0||x%4==0)m[y*N+x]=1;
const oH=(c,r)=>{for(let k=0;k<3;k++)m[(y0(r)+k)*N+x0(c)+3]=0},oV=(c,r)=>{for(let k=0;k<3;k++)m[(y0(r)+3)*N+x0(c)+k]=0};
const vis=new Set(),sx=rnd(CW),sy=rnd(CR),st=[[sx,sy]];vis.add(sy*CW+sx);
while(st.length){const [c,r]=st[st.length-1],nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[c+a,r+b,a,b]).filter(([a,b])=>a>=0&&b>=0&&a<CW&&b<CR&&!vis.has(b*CW+a));
if(!nb.length){st.pop();continue}const [a,b,da,db]=nb[rnd(nb.length)];vis.add(b*CW+a);if(da==1)oH(c,r);else if(da==-1)oH(a,b);else if(db==1)oV(c,r);else oV(a,b);st.push([a,b])}
for(let n=0;n<3;n++){if(Math.random()<.5)oH(rnd(CW-1),rnd(CR));else oV(rnd(CW),rnd(CR-1))}
const ent=(y)=>{const cs=[0,1,2,3,4,5,6].sort(()=>Math.random()-.5).slice(0,2);cs.forEach(c=>{for(let k=0;k<3;k++)m[y*N+x0(c)+k]=0})};ent(4);ent(24);
return m.join("")}
const mapOf=id=>DATA.maps[DATA.mapIndex.default[id]];
function genMap(id){const m=mapOf(id);if(!m)return "0".repeat(N*N);if(m.generator&&m.generator.type=="maze")return mazeMap();return PDRValidate.mapString(m)}
