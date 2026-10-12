/* [규칙] data/*.json 에서 만든 게임 표(용사·챔피언·스킬·몬스터·아이템·드롭표·규칙 묶음) */
const CLS={};
for(const k in DATA.heroes)CLS[k]={...DATA.heroes[k],sk:DATA.skills.heroes[k]};
const CH={};
for(const id in DATA.champions){const {stats,...m}=DATA.champions[id];CH[id]=Object.assign(m,DATA.skills.champions[id]||{})}
const RULE=DATA.rules,CST=()=>DATA.champions[S.champ].stats;
const HSK=t=>{for(const k in CLS)for(const q of CLS[k].sk)if(q.t==t)return q},EXS=id=>{for(const c in CH)for(const e of CH[c].ex||[])if(e.id==id)return e};
const GRD=HSK("g").fx,WAL=EXS("wall").fx,PIT=EXS("pit").fx,BRUN=EXS("run").fx;
const ROB=DATA.monsters.robot,FAC=DATA.monsters.factory,BMB=DATA.monsters.bomb;
const TR={v:EXS("trap").fx.dmg},TMAX=EXS("trap").fx.max,BOMBV=BMB.dmg,RHP=ROB.hp,GAP=()=>CST().generator.ap;
const MOB=DATA.monsters,pct=v=>Math.round(v*100)+"%";
const ITEMS={},ITEF={};
for(const k in DATA.items){const {effect,...m}=DATA.items[k];ITEMS[k]=m;ITEF[k]=effect}
const bag0=()=>{const o={};for(const k in ITEMS)o[k]=0;return o},CHR=RULE.chest,LOOT=DATA.loot.treasureChest;
const LOOTW=LOOT.gold.reduce((a,g)=>a+g[1],0),LOOTI=[];
{let a=0;LOOT.items.forEach(([k,p])=>{a=Math.round((a+p)*1e9)/1e9;LOOTI.push([k,a])})}
const CIRC=RULE.circle,CRY=RULE.crystal,CRMAX=CRY.max,CRLIFE=CRY.life;
