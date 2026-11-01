/* 맵 만들기(사용자 맵) 테스트 — 맵 형식 검사(보스 테마별 배치물 제한·개수·겹침) + 게임이 사용자 맵으로 시작해 배치물을 놓는지
   사용법: node tools/test_editor.js */
const { createEngine } = require("./headless.js");
const V = require("../game/lib/validate.js");
let fail = 0;
const ok = (c, m) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) fail++; };
const E = createEngine({ clock: "()=>0" });
const R = s => E.run(s);
const D = R("DATA");
// 바깥 테두리만 벽인 빈 맵
const blank = (ch, objects) => ({ format: "pdr-map", version: 1, id: "my_" + ch, name: "테스트 " + ch, author: "me", champion: ch, ruleset: D.rules.id,
  size: { w: 30, h: 30 }, tiles: Array.from({ length: 30 }, (_, y) => y == 0 || y == 29 ? "#".repeat(30) : "#" + ".".repeat(28) + "#"),
  spawns: Object.assign({ boss: { x: 15, y: 3 }, heroes: [{ x: 12, y: 27 }, { x: 15, y: 27 }, { x: 18, y: 27 }] }, ch == "vince" ? { generator: { x: 22, y: 3 } } : {}), objects });
const errs = m => V.map(m, D, "m");

const G = blank("gron", [{ type: "spike", x: 15, y: 20 }, { type: "pit", x: 5, y: 10 }, { type: "trapChest", x: 20, y: 15 }, { type: "chest", x: 8, y: 15 }, { type: "mimic", x: 10, y: 8 }, { type: "goblin", x: 20, y: 8 }]);
ok(errs(G).length === 0, "그론 맵: 가시 함정·구덩이·함정 상자·상자·미믹·고블린 → 검사 통과 " + JSON.stringify(errs(G)));
const VM = blank("vince", [{ type: "robot", x: 10, y: 15, lv: 1 }, { type: "robot", x: 12, y: 15, lv: 2 }, { type: "robot", x: 14, y: 15, lv: 3 }, { type: "factory", x: 20, y: 15, lv: 2 }, { type: "bomb", x: 15, y: 20, dx: 0, dy: 1 }, { type: "belt", x: 5, y: 20, d: 0 }, { type: "belt", x: 6, y: 20, d: 0 }]);
ok(errs(VM).length === 0, "빈센토 맵: 로봇 Lv1·2·3·공장·폭탄로봇·컨베이어 → 검사 통과 " + JSON.stringify(errs(VM)));
ok(errs(blank("gron", [{ type: "robot", x: 10, y: 15, lv: 1 }])).some(e => /테마/.test(e)), "그론 맵에 로봇 → 거부 (테마 제한)");
ok(errs(blank("gron", [{ type: "factory", x: 10, y: 15 }])).some(e => /테마/.test(e)), "그론 맵에 공장 → 거부");
ok(errs(blank("vince", [{ type: "spike", x: 10, y: 15 }])).some(e => /테마/.test(e)), "빈센토 맵에 가시 함정 → 거부");
ok(errs(blank("vince", [{ type: "robot", x: 10, y: 15, lv: 4 }])).length > 0, "로봇 레벨 4 → 거부 (1·2·3단계만)");
ok(errs(blank("vince", [{ type: "bomb", x: 10, y: 15, dx: 0, dy: 0 }])).length > 0, "폭탄로봇 방향 없음 → 거부");
ok(errs(blank("gron", [{ type: "spike", x: 15, y: 27 }])).length > 0, "용사 시작 칸 위 가시 함정 → 거부");
ok(errs(blank("gron", [{ type: "mimic", x: 10, y: 8 }, { type: "goblin", x: 10, y: 8 }])).length > 0, "같은 칸에 미믹·고블린 → 거부 (겹침)");
ok(errs(blank("vince", [{ type: "robot", x: 10, y: 15, lv: 1 }, { type: "belt", x: 10, y: 15, d: 1 }])).length === 0, "컨베이어 위 로봇 → 허용 (바닥층)");
ok(errs(blank("vince", Array.from({ length: 9 }, (_, i) => ({ type: "robot", x: 3 + i * 2, y: 15, lv: 1 })))).some(e => /로봇는 최대/.test(e)), "로봇 개수 한도 초과 → 거부");
{ const w = blank("gron", []); w.tiles = w.tiles.map((r, y) => y == 20 ? "#".repeat(30) : r); ok(errs(w).some(e => /길이 없어요/.test(e)), "벽으로 막혀 보스까지 길 없음 → 거부"); }

// 게임: 사용자 맵으로 시작
const start = (m, pick) => R(`S=newS();S.cmap=${JSON.stringify(m)};apply({type:"pickChamp",id:"${m.champion}"});apply({type:"setPick",ids:${JSON.stringify(pick)}});apply({type:"start"});S.cry=[];1`);
start(G, ["knight", "cleric", "archer"]);
ok(R("S.map[20*N+15]") === "0" && R("S.map[0]") === "1" && R("S.boss.x") === 15 && R("S.heroes[0].x") === 12 && R("S.heroes[0].y") === 27, "게임이 사용자 맵의 지형·시작 위치로 시작");
ok(R("S.sec.traps.some(t=>t[0]==15&&t[1]==20)") && R("S.pits.some(p=>p.x==5&&p.y==10)") && R("S.chests.filter(c=>c.k=='x').length") === 1, "숨은 것 배치: 가시 함정·구덩이·함정 상자");
ok(R("S.mobs.map(m=>m.k).sort().join()") === "gob,mimic", "미믹·보물 고블린 배치");
ok(!R("JSON.stringify(view(S,'hero'))").includes('"spike"') && !R("JSON.stringify(view(S,'hero').cmap.objects)").includes("trapChest"), "용사 화면으로 보내는 맵 정보엔 숨은 물건 위치 없음");
R(`apply({type:"endBoss"});apply({type:"endHero"});apply({type:"resolve"})`);
ok(R("S.sec.traps.some(t=>t[0]==15&&t[1]==20)"), "맵에 깐 가시 함정은 라운드가 지나도 남음 (보스가 깐 건 사라짐)");
R(`S.ph="hero";const h=S.heroes[0];h.x=15;h.y=22;h.ap=3;apply({type:"heroAct",h:0,j:"m",x:15,y:19});apply({type:"endHero"});apply({type:"resolve"})`);
ok(!R("S.sec.traps.some(t=>t[0]==15&&t[1]==20)") && R("S.heroes[0].hp") < R("S.heroes[0].max"), "용사가 밟으면 피해 후 사라짐");
start(VM, ["knight", "cleric", "mage"]);
ok(R("S.rob.map(r=>r.lv).join()") === "1,2,3" && R("S.rob[2].hp") === R("DATA.monsters.robot.hp[2]"), "로봇 1·2·3단계 배치 (단계별 체력)");
ok(R("S.fac.length") === 1 && R("S.fac[0].lv") === 2 && R("S.sec.bombs.length") === 1 && R("S.belts.length") === 2, "공장(Lv2)·폭탄로봇·컨베이어 배치");
R("S.cmap=null;apply({type:'pickChamp',id:'gron'})");
ok(R("mapOf('gron').id") === "gron_maze", "사용자 맵이 없으면 기본 맵");
console.log(fail ? fail + "개 실패" : "맵 만들기 테스트 모두 통과");
process.exit(fail ? 1 : 0);
