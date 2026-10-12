/* [진행] 화면 쪽 명령: 규칙(core) 함수를 부르고, 이 기기의 화면 상태(L)를 정리한 뒤 sync()(저장·전송·다시 그리기) */
function pickChamp(id){if(!apply({type:"pickChamp",id})){$("lg").textContent="🔒 아직 준비 중인 챔피언이에요 (캐릭터·맵 디자인만 공개)";return}sync()}
function afterStartUI(){L.bag=0;L.si=0;L.menu=1;sync();setTimeout(()=>jump(0),50)}
function start(){if(!apply({type:"start"}))return;afterStartUI()}
function afterBossTurnUI(){L.act=null;L.picks=[];L.menu=1;L.si=Math.max(0,S.heroes.findIndex(h=>!h.dead))}
function afterHeroTurnUI(){L.act=null;L.picks=[]}
function endBoss(){apply({type:"endBoss"});afterBossTurnUI();sync()}
function endHero(){apply({type:"endHero"});afterHeroTurnUI();sync()}
function useItem(k){const side=S.ph=="boss"?"b":"h";if(!mine()||!S.bag||!S.bag[side][k])return;const bs=S.ph=="boss";let r;
if(bs){const g=S.champ=="vince"&&L.bsel=="g"&&S.gen&&S.gen.hp>0;r=apply({type:"bossItem",gen:g?1:0,k})}else{const u=sel();if(!u||u.dead)return;r=apply({type:"heroItem",h:L.si,k})}
if(r.err){$("lg").textContent=r.err;return}if(r.aim){L.act="i";L.picks=[];L.bag=0;ui();return}L.bag=0;sync()}
function useScroll(x,y){if(S.ph=="boss")return apply({type:"scrollBoss",x,y,gen:S.champ=="vince"&&L.bsel=="g"&&S.gen&&S.gen.hp>0?1:0});return apply({type:"scrollHero",h:L.si,x,y})}
