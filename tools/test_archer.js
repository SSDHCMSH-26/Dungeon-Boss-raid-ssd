/* 궁수 스킬 테스트 (v78~) — 저격·갈고리 화살·그랩 화살·관통 화살(궁극기)
   사용법: node tools/test_archer.js */
const { createEngine } = require("./headless.js");
let fail = 0;
const ok = (c, m) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) fail++; };
const E = createEngine({ clock: "()=>0" });
const R = s => E.run(s);
// 궁수(0번)를 (10,15)에, 보스는 멀리. 벽 없는 맵(가장자리만 벽)
const setup = (c = "gron") => R(`S=newS();apply({type:"pickChamp",id:"${c}"});apply({type:"setPick",ids:["archer","knight","cleric"]});apply({type:"start"});
S.map="1".repeat(N)+("1"+"0".repeat(N-2)+"1").repeat(N-2)+"1".repeat(N);S.walls=[];S.pits=[];S.chests=[];S.mobs=[];S.belts=[];S.cry=[];S.fac=[];S.rob=[];S.sec.traps=[];S.sec.bombs=[];
S.boss.x=25;S.boss.y=4;if(S.gen){S.gen.x=25;S.gen.y=25}
S.heroes[0].x=10;S.heroes[0].y=15;S.heroes[1].x=3;S.heroes[1].y=27;S.heroes[2].x=5;S.heroes[2].y=27;S.heroes[0].ap=9;S.ph="hero";1`);
const J = n => R(`CLS.archer.sk.findIndex(q=>q.n=="${n}")`);
const SN = J("저격"), HK = J("갈고리 화살"), GR = J("그랩 화살"), PR = J("관통 화살");
const act = (j, x, y, p) => R(`apply(${JSON.stringify(Object.assign({ type: "heroAct", h: 0, j, x, y }, p ? { p } : {}))})`);
const wall = (x, y) => R(`S.map=S.map.slice(0,${y}*N+${x})+"1"+S.map.slice(${y}*N+${x}+1)`);
const rob = (x, y, hp = 99) => R(`S.rob.push({id:${x * 100 + y},x:${x},y:${y},hp:${hp},mx:${hp},lv:1});1`);
const rhp = () => R("S.rob[0]?S.rob[0].hp:-1");

ok(SN === 0 && HK > 0 && GR > 0 && PR > 0 && !R(`CLS.archer.sk.some(q=>q.n=="속사")`), `궁수 스킬 4개: 저격 ${SN} · 갈고리 ${HK} · 그랩 ${GR} · 관통 ${PR} (속사 삭제)`);

// 저격: 8방향 · 사거리 7 · 처음 닿는 적 20 · 막힘 · 이동 안 했으면 2배
setup(); rob(15, 15);
ok(act(SN, 11, 15) === 1 && rhp() === 99 - 40, `저격: 이동 안 한 턴 → 20×2 = 40 (${99 - rhp()})`);
setup(); rob(15, 15); R("S.heroes[0].mc=1");
ok(act(SN, 11, 15) === 1 && rhp() === 99 - 20, "저격: 이동한 턴 → 20");
setup(); rob(15, 15); rob(17, 15); R("S.heroes[0].mc=1");
ok(act(SN, 11, 15) === 1 && R("S.rob[0].hp") === 79 && R("S.rob[1].hp") === 99, "저격: 처음 닿는 적 하나만");
setup(); wall(13, 15); rob(15, 15);
ok(act(SN, 11, 15) === 1 && rhp() === 99, "저격: 벽에 막힘");
setup(); rob(18, 15);
ok(act(SN, 11, 15) === 1 && rhp() === 99, "저격: 사거리 7 밖은 안 닿음");
setup(); rob(13, 18);
ok(act(SN, 11, 16) === 1 && rhp() === 59, "저격: 대각선도 가능");
setup(); ok(act(SN, 12, 16) === 0, "저격: 8방향이 아닌 칸은 못 고름");

// 갈고리 화살: AP 2 · 쿨 2 · 4칸 이내 · 벽 너머 · 이동한 것으로 침
setup(); for (let y = 10; y <= 20; y++) wall(12, y);
ok(act(HK, 14, 15) === 1 && R("S.heroes[0].x") === 14 && R("S.heroes[0].ap") === 7, "갈고리: 벽 너머 4칸 이내 칸으로 이동 (AP 2)");
ok(R(`S.heroes[0].cd[${HK}]`) === 3 && act(HK, 15, 15) === 0, "갈고리: 쿨타임 2턴");
rob(16, 15); ok(act(SN, 15, 15) === 1 && rhp() === 79, "갈고리로 움직인 턴의 저격은 2배 아님");
setup(); ok(act(HK, 15, 15) === 0, "갈고리: 5칸은 불가");
setup(); wall(13, 15); ok(act(HK, 13, 15) === 0, "갈고리: 벽 칸 위로는 착지 불가");

// 그랩 화살: 사거리 10 · 처음 닿는 적 8 · 2칸 끌어옴 · 쿨 3
setup(); rob(18, 15);
ok(act(GR, 11, 15) === 1 && rhp() === 91 && R("S.rob[0].x") === 16, `그랩: 로봇 피해 8 + 2칸 끌어옴 (18 → ${R("S.rob[0].x")})`);
ok(R(`S.heroes[0].cd[${GR}]`) === 4, "그랩: 쿨타임 3턴");
setup(); rob(12, 15); R(`S.heroes[0].cd={}`);
ok(act(GR, 11, 15) === 1 && R("S.rob[0].x") === 11, "그랩: 2칸 앞 로봇은 바로 옆까지만(1칸) 끌려옴");
setup(); R("S.boss.x=16;S.boss.y=15");
ok(act(GR, 11, 15) === 1 && R("S.boss.x") === 14 && R("S.boss.hp") === R("S.boss.max") - 8, `그랩: 보스도 2칸 끌어옴 (16 → ${R("S.boss.x")})`);
setup(); wall(14, 15); rob(17, 15);
ok(act(GR, 11, 15) === 1 && rhp() === 99, "그랩: 벽에 막힘");

// 관통 화살: AP 3 · 쿨 8 · 2방향 · 길 위 벽·함정·폭탄·구덩이·상자·컨베이어 삭제(가장자리 벽 제외)
setup(); wall(13, 15); R(`S.walls=[{x:15,y:15,t:3,lv:1}];S.sec.traps=[[17,15],[10,12]];S.sec.bombs=[{id:1,x:19,y:15,dx:0,dy:0}];S.sec.bid=1;S.pits=[{x:20,y:15},{x:5,y:5}];S.chests=[{x:23,y:15,k:"x"}];S.belts=[{x:10,y:11,d:0,en:0,t:1}]`);
ok(act(PR, 11, 15, [[11, 15], [10, 14]]) === 1 && R("S.heroes[0].ap") === 6, "관통: 2방향 발사 (AP 3)");
ok(!R("sw(13,15)") && R("S.walls.length") === 0, "관통: 맵 벽·설치 벽 삭제");
ok(R("S.sec.traps.length") === 0 && R("S.sec.bombs.length") === 0, "관통: 숨은 함정·폭탄로봇 삭제 (두 번째 화살이 위쪽 함정도)");
ok(R("S.pits.length") === 1 && R("S.pits[0].x") === 5 && R("S.chests.length") === 0 && R("S.belts.length") === 0, "관통: 구덩이·상자·컨베이어 삭제 (길 밖 구덩이는 남음)");
ok(R("sw(N-1,15)") && R("sw(10,0)"), "관통: 맵 가장자리 벽은 남음");
ok(R("(S.afx||[]).filter(f=>f.k=='del').length") >= 8 && R("(S.afx||[]).filter(f=>f.k=='line').length") === 2, "관통: 삭제된 칸마다 화면 표시(afx) · 화살 선 2개");
ok(R(`S.heroes[0].cd[${PR}]`) === 9 && act(PR, 11, 15, [[11, 15], [12, 15]]) === 0, "관통: 쿨타임 8턴");
setup(); R("S.heroes[0].ap=2"); ok(act(PR, 11, 15, [[11, 15], [12, 15]]) === 0, "관통: AP 3 필요");

// (v79) 저격: AP 1 · 턴당 1번 (연달아 못 씀) · 다음 턴엔 다시
setup(); rob(15, 15);
ok(act(SN, 11, 15) === 1 && R("S.heroes[0].ap") === 8, "저격: AP 1");
ok(act(SN, 11, 15) === 0, "저격: 같은 턴에 연달아 못 씀 (턴당 1번)");
R(`apply({type:"endHero"});S.ph="resolve";resolve();S.ph="hero";S.heroes[0].ap=9`);
ok(act(SN, 11, 15) === 1, "저격: 다음 턴엔 다시 사용");

// 컴퓨터 궁수: 오류 없이 판 진행 + 저격 사용
{ const E2 = createEngine({ clock: "()=>0" }); let sn = 0;
  for (let sd = 1; sd <= 20; sd++) { const r = E2.call("simMatch", { seed: sd, champ: sd % 2 ? "vince" : "gron", pick: ["archer", "knight", "cleric"] });
    r.log.actions.forEach(a => { if (a.type == "heroAct" && a.j === 0 && a.h === 0) sn++; }); }
  ok(sn > 0, `컴퓨터 궁수 20판: 저격 ${sn}번 (오류 없이 끝까지)`); }

console.log(fail ? fail + "개 실패" : "궁수 테스트 모두 통과");
process.exit(fail ? 1 : 0);
