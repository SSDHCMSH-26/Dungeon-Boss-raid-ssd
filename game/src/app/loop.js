/* [진행] 혼자 하기 진행(컴퓨터 차례 돌리기) */
function tick(){setTimeout(()=>{try{tickB()}catch(e){console.error(e);try{if(L.mode=="solo"&&own()!=L.role){if(S.ph=="boss")endBoss();else if(S.ph=="hero")endHero()}}catch(e2){console.error(e2)}}},AI.delayMs)}
function tickB(){if(S.end||L.scr!="game"||L.wait)return;
if(S.ph=="resolve"){if(L.mode!="multi"||L.role=="boss"){apply({type:"resolve"});L.menu=1;L.act=null;L.picks=[];sync()}return}
if(L.mode!="solo")return;
if(S.ph=="setup"){if(L.role=="hero"&&!S.champ)pickChamp(aiPickChampId());else if(L.role=="boss"&&S.champ&&S.pick.length<3){if(aiSetup())afterStartUI()}return}
if(own()!=L.role){const ph=S.ph;ph=="boss"?aiBoss():aiHero();if(ph=="boss"&&S.ph=="hero")afterBossTurnUI();else if(ph=="hero"&&S.ph=="resolve")afterHeroTurnUI();sync()}}
