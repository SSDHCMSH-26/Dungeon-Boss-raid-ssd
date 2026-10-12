/* [기기] 이 기기의 화면 상태 L (선택 중인 스킬·찍은 칸·디자인 등), 확대 단계 */
let Z=16,db,usr,uid,L={insp:null,itab:"info",design:DSN.order[0],bsel:"v",scr:"menu",mode:"solo",role:"hero",act:null,picks:[],si:0,traps:[],bombs:[],used:{},menu:1,code:"",wait:0,bu:"",hu:"",fit:0};
const ZL=[12,16,20,24,32,40];
try{const dz=localStorage.getItem("design");if(dz)L.design=DSN.legacy[dz]||dz}catch(e){}
const mine=()=>!S.end&&!L.wait&&S.ph!="resolve"&&S.ph!="setup"&&(L.mode=="local"||own()==L.role);
const sel=()=>S.heroes[L.si];
