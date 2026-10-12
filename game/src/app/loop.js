/* [진행] 혼자 하기 진행(컴퓨터 차례 돌리기) */
function tick(){setTimeout(()=>{try{tickB()}catch(e){console.error(e);try{if(L.mode=="solo"&&own()!=L.role){if(S.ph=="boss")endBoss();else if(S.ph=="hero")endHero()}}catch(e2){console.error(e2)}}},AI.delayMs)}
function tickB(){if(S.end||L.scr!="game"||L.wait)return;
if(S.ph=="resolve"){if(L.mode!="multi"||L.role=="boss"){resolve();sync()}return}
if(L.mode!="solo")return;
if(S.ph=="setup"){if(L.role=="hero"&&!S.champ){const ids=Object.keys(CH).filter(id=>CH[id].ok);pickChamp(ids[rn(ids.length)])}else if(L.role=="boss"&&S.champ&&S.pick.length<3)aiSetup();return}
if(own()!=L.role)S.ph=="boss"?aiBoss():aiHero()}
