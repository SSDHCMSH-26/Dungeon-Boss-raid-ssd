/* 규칙 테스트 묶음 (v72): 기사 베기 부채꼴, 용사 체력·AP, 발전기 AP, 구덩이 파기 쿨타임, 가시 함정 AP 증가,
   함정 상자 설치 조건(주변 3×3 유닛 없음), 맵별 상자 생성 설정(빈센토 맵 끔), 컨베이어(벗어나면 멈춤·겹치지 않음),
   (v73) 구덩이 이동 조건, 컴퓨터 그론 가시 함정 위치, (v74) 베기 턴당 1번·스태프 후리기
   사용법: node tools/test_rules_misc.js */
const { createEngine } = require("./headless.js");
let fail = 0;
const ok = (c, m) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) fail++; };
const E = createEngine({ clock: "()=>0" });
const R = s => E.run(s);
const setup = (c, pick = '["knight","cleric","archer"]') => R(`S=newS();apply({type:"pickChamp",id:"${c}"});apply({type:"setPick",ids:${pick}});apply({type:"start"});
S.map="0".repeat(N*N);S.walls=[];S.pits=[];S.chests=[];S.mobs=[];S.belts=[];S.cry=[];S.fac=[];S.rob=[];
S.boss.x=15;S.boss.y=5;if(S.gen){S.gen.x=25;S.gen.y=5}
S.heroes[0].x=10;S.heroes[0].y=20;S.heroes[1].x=4;S.heroes[1].y=25;S.heroes[2].x=6;S.heroes[2].y=25;1`);

// 체력·AP
setup("gron", '["knight","cleric","mage"]');
ok(R("S.heroes.map(h=>h.max).join()") === "100,80,60", "체력: 기사 100 · 성직자 80 · 마법사 60");
setup("gron", '["archer","cleric","mage"]');
ok(R("S.heroes[0].max") === 70 && R("S.heroes[2].ap") === 4 && R("S.heroes[0].ap") === 3, "궁수 체력 70 · 마법사 AP 4 · 다른 용사 AP 3");
R(`apply({type:"endBoss"});apply({type:"endHero"});apply({type:"resolve"})`);
ok(R("S.heroes[2].ap") === 4, "다음 턴에도 마법사 AP 4");
setup("vince"); ok(R("S.gen.ap") === 4 && R("GAP()") === 4, "발전기 기본 AP 4");

// 기사 베기: AP 1 · 피해 20 · 부채꼴 3칸
setup("vince"); R(`S.rob=[{id:1,x:11,y:19,hp:50,mx:50,lv:1},{id:2,x:11,y:20,hp:50,mx:50,lv:1},{id:3,x:11,y:21,hp:50,mx:50,lv:1},{id:4,x:10,y:21,hp:50,mx:50,lv:1}]`);
ok(R(`apply({type:"heroAct",h:0,j:0,x:11,y:20})`) === 1 && R("S.heroes[0].ap") === 2, "베기 AP 1");
ok(R("S.rob.map(r=>r.hp).join()") === "30,30,30,50", "오른쪽 칸 + 양옆(위·아래 대각) 3칸만 피해 20 (아래 칸 로봇은 그대로)");
setup("vince"); R(`S.rob=[{id:1,x:11,y:21,hp:50,mx:50,lv:1},{id:2,x:11,y:20,hp:50,mx:50,lv:1},{id:3,x:10,y:21,hp:50,mx:50,lv:1},{id:4,x:9,y:21,hp:50,mx:50,lv:1}]`);
R(`apply({type:"heroAct",h:0,j:0,x:11,y:21})`);
ok(R("S.rob.map(r=>r.hp).join()") === "30,30,30,50", "대각선으로 베면: 그 칸 + 양옆(오른쪽·아래) 3칸");

// 구덩이 파기: AP 2 · 쿨타임 4턴
setup("gron"); R(`S.ph="boss";S.boss.ap=6`);
ok(R(`apply({type:"bossBuild",id:"pit",p:[]})`) === 1 && R("S.boss.ap") === 4, "구덩이 파기 AP 2");
R(`S.boss.x=20;S.boss.y=10`);
ok(R(`apply({type:"bossBuild",id:"pit",p:[]})`) === 0, "바로 다시 파기 불가 (쿨타임)");
let n = 0; for (let i = 0; i < 6; i++) { R(`apply({type:"endBoss"});apply({type:"endHero"});apply({type:"resolve"});S.boss.x=${4 + i * 4};S.boss.y=15`); if (R(`apply({type:"bossBuild",id:"pit",p:[]})`) === 1) { n = i + 1; break; } }
ok(n === 5, `쿨타임 4턴: 4번의 보스 턴을 기다린 뒤 5번째 보스 턴에 다시 가능 (${n}번째)`);

// 가시 함정: 2개 쓸 때마다 AP +1
setup("gron"); R(`S.ph="boss";S.boss.ap=20;S.used={}`);
const costs = []; for (let i = 0; i < 5; i++) { const a = R("S.boss.ap"); R(`apply({type:"bossBuild",id:"trap",p:[[${10 + i},12]]})`); costs.push(a - R("S.boss.ap")); }
ok(costs.join() === "1,1,2,2,3", `가시 함정 AP: ${costs.join(", ")} (2개마다 +1)`);

// 함정 상자: 주변 3×3 에 유닛이 없어야
setup("gron"); R(`S.ph="boss";S.boss.ap=6;S.cd={}`);
ok(R(`apply({type:"bossBuild",id:"tchest",p:[[11,21]]})`) === 0, "용사 바로 옆(3×3 안)에는 함정 상자 불가");
ok(R(`apply({type:"bossBuild",id:"tchest",p:[[15,7]]})`) === 0, "보스 바로 옆에도 불가");
ok(R(`apply({type:"bossBuild",id:"tchest",p:[[12,22]]})`) === 1, "주변 3×3 이 비어 있으면 가능");

// 맵별 상자 생성: 빈센토 맵 끔, 그론 맵 켬
setup("vince"); ok(R("chSpawn(3)") === 0 && R("mapSet('chestSpawn')") === false, "빈센토 맵: 보물상자가 저절로 생기지 않음 (maps/vince_factory.json settings.chestSpawn=false)");
setup("gron"); ok(R("chSpawn(2)") > 0, "그론 맵: 보물상자 생김");
{ let c = 0; for (let s = 1; s <= 10; s++) { const E2 = createEngine({ clock: "()=>0" }); const r = E2.call("simMatch", { seed: s, champ: "vince", pick: ["knight", "cleric", "archer"] }); c += E2.run("(S.chests||[]).filter(z=>z.k=='t').length"); } ok(c === 0, "빈센토 10판 끝까지: 보물상자 0개"); }

// 컨베이어: 벗어나면 멈춤 · 막히면 멈춤 · 겹치지 않음
const run = () => R(`S.ph="boss";S.boss.ap=6;S.used={};apply({type:"bossBuild",id:"run",p:[]})`);
setup("vince"); R(`S.heroes[0].x=10;S.heroes[0].y=15;S.belts=[{x:10,y:15,d:0,en:0,t:1},{x:11,y:15,d:0,en:0,t:1}]`); run();
ok(R("S.heroes[0].x") === 12, `용사: 벨트 2칸 → 벨트를 벗어난 칸(12)에서 멈춤 (${R("S.heroes[0].x")})`);
setup("vince"); R(`S.heroes[0].x=5;S.heroes[0].y=15;S.belts=[];for(let i=0;i<8;i++)S.belts.push({x:5+i,y:15,d:0,en:0,t:1})`); run();
ok(R("S.heroes[0].x") === 9, "긴 벨트: 최대 4칸");
setup("vince"); R(`S.boss.x=10;S.boss.y=12;S.belts=[{x:10,y:13,d:0,en:0,t:1},{x:11,y:13,d:0,en:0,t:1}]`); run();
ok(R("S.boss.x") === 10, "빈센토: 가운데 칸이 벨트 위가 아니면(가장자리만 걸침) 안 움직임");
setup("vince"); R(`S.boss.x=10;S.boss.y=12;S.belts=[{x:10,y:12,d:0,en:0,t:1},{x:11,y:12,d:0,en:0,t:1}]`); run();
ok(R("S.boss.x") === 12, `빈센토: 가운데 칸 기준으로 벨트를 벗어나면 멈춤 (${R("S.boss.x")})`);
setup("vince"); R(`S.boss.x=10;S.boss.y=12;S.heroes[0].x=14;S.heroes[0].y=11;S.belts=[];for(let i=0;i<8;i++)S.belts.push({x:10+i,y:12,d:0,en:0,t:1})`); run();
ok(R("S.boss.x") === 12 && R("S.heroes[0].x") === 14, `빈센토: 앞(벨트 옆)에 용사가 있으면 겹치지 않게 그 앞에서 멈춤 (빈센토 ${R("S.boss.x")}, 용사 ${R("S.heroes[0].x")})`);
setup("vince"); R(`S.heroes[0].x=5;S.heroes[0].y=15;S.fac=[{id:1,x:8,y:15,hp:40,mx:40,lv:1,cd:3,en:0}];S.belts=[];for(let i=0;i<3;i++)S.belts.push({x:5+i,y:15,d:0,en:0,t:1})`); run();
ok(R("S.heroes[0].x") === 7, "용사: 앞에 공장이 있으면 그 앞에서 멈춤");
setup("vince"); R(`S.heroes[0].x=5;S.heroes[0].y=15;S.heroes[1].x=6;S.heroes[1].y=15;S.belts=[];for(let i=0;i<3;i++)S.belts.push({x:5+i,y:15,d:0,en:0,t:1})`); run();
ok(R("S.heroes[0].x!=S.heroes[1].x||S.heroes[0].y!=S.heroes[1].y") && R("S.heroes[1].x") === 8, `용사 둘이 줄지어 있어도 겹치지 않음 (${R("S.heroes[0].x")}, ${R("S.heroes[1].x")})`);

// 구덩이 이동: 구덩이 위에 서 있을 때만 · 다른 구덩이로만
setup("gron"); R(`S.ph="boss";S.boss.ap=20;S.cd={};S.pits=[{x:5,y:5},{x:20,y:20}];S.boss.x=10;S.boss.y=10`);
ok(R(`apply({type:"bossBuild",id:"hop",p:[[20,20]]})`) === 0, "구덩이 이동: 구덩이 밖에 서 있으면 불가");
R(`S.boss.x=6;S.boss.y=5`);
ok(R(`apply({type:"bossBuild",id:"hop",p:[[5,6]]})`) === 0, "구덩이 이동: 같은 구덩이 안으로는 불가");
ok(R(`apply({type:"bossBuild",id:"hop",p:[[20,20]]})`) === 1 && R("S.boss.x") === 20, "구덩이 이동: 구덩이 위에서 다른 구덩이로 이동 (거리 30칸 이내)");

// 컴퓨터 그론 가시 함정: 공격 예고 범위·벽을 뺀, 용사가 빠져나갈 길목에 설치
setup("gron"); R(`S.ph="boss";S.boss.ap=20;S.used={};S.boss.x=15;S.boss.y=12;S.heroes[1].dead=1;S.heroes[2].dead=1;
const m=S.map.split("");for(let y=17;y<=23;y++)for(let x=7;x<=13;x++)if((x==7||x==13||y==17||y==23)&&!(x==13&&y==20))m[y*N+x]="1";S.map=m.join("");
S.atks=[{i:0,p:[[10,20]]}];AB.gron.spikeTrap.chance=1;aiTrap(CH.gron);AB.gron.spikeTrap.chance=DATA.ai.boss.gron.spikeTrap.chance;1`);
ok(R("S.sec.traps.some(t=>t[0]==13&&t[1]==20)"), `가시 함정 AI: 벽에 둘러싸인 곳의 유일한 출구(13,20)에 설치 (${R("JSON.stringify(S.sec.traps)")})`);
ok(R("S.sec.traps.length>0&&S.sec.traps.every(t=>!dangerSet().has(t[1]*N+t[0])&&!sw(t[0],t[1]))"), "가시 함정 AI: 공격 예고 범위·벽에는 설치 안 함");

// (v74) 기사 베기: 턴당 1번 · 마법사 스태프 후리기: AP 0 · 사거리 1 · 한 칸 · 피해 5~10 · 턴당 1번
setup("vince"); R(`S.rob=[{id:1,x:11,y:20,hp:50,mx:50,lv:1}]`);
ok(R(`apply({type:"heroAct",h:0,j:0,x:11,y:20})`) === 1 && R(`apply({type:"heroAct",h:0,j:0,x:11,y:20})`) === 0, "베기: 한 턴에 1번만");
R(`apply({type:"endHero"});S.ph="resolve";resolve();S.ph="hero"`);
ok(R(`apply({type:"heroAct",h:0,j:0,x:11,y:20})`) === 1, "베기: 다음 턴엔 다시 가능");
setup("vince", '["knight","cleric","mage"]'); R(`S.heroes[2].x=10;S.heroes[2].y=10;S.rob=[{id:1,x:11,y:10,hp:99,mx:99,lv:1},{id:2,x:12,y:11,hp:99,mx:99,lv:1},{id:3,x:13,y:10,hp:99,mx:99,lv:1}]`);
ok(R("CLS.mage.sk[0].n") === "스태프 후리기" && !R("CLS.mage.sk.some(q=>q.n=='파이어볼')"), "마법사 기본 스킬: 파이어볼 → 스태프 후리기");
ok(R(`apply({type:"heroAct",h:2,j:0,x:13,y:10})`) === 0, "스태프 후리기: 사거리 1 (2칸 떨어진 적 불가)");
ok(R(`apply({type:"heroAct",h:2,j:0,x:11,y:10})`) === 1 && R("S.heroes[2].ap") === 4, "스태프 후리기: AP 소모 없음");
{ const d = 99 - R("S.rob[0].hp"); ok(d >= 5 && d <= 10 && R("S.rob[1].hp") === 99, `스태프 후리기: 한 칸만 피해 5~10 (${d})`); }
ok(R(`apply({type:"heroAct",h:2,j:0,x:11,y:10})`) === 0, "스태프 후리기: 한 턴에 1번만");
{ const seen = new Set(); for (let i = 0; i < 60; i++) { R(`S.rob[0].hp=99;S.heroes[2].lu={}`); R(`apply({type:"heroAct",h:2,j:0,x:11,y:10})`); seen.add(99 - R("S.rob[0].hp")); }
  ok([...seen].every(v => v >= 5 && v <= 10) && seen.size >= 4, `스태프 후리기: 피해가 무작위로 나옴 (${[...seen].sort((a, b) => a - b).join(",")})`); }

// (v77) 영창 유지 중 이동 -1: 영창한 그 턴은 그대로, 다음 턴부터(유지 중) -1, 마법진이 사라지면 복구 · 먼저 걸으면 영창 잠김
setup("gron", '["knight","cleric","mage"]'); R(`S.heroes[2].x=10;S.heroes[2].y=10;S.heroes[2].ap=9`);
{ const MJ = R("CLS.mage.sk.findIndex(q=>q.t=='c')"), PJ = R("CLS.mage.sk.findIndex(q=>q.t=='w')");
  const next = () => R(`apply({type:"endHero"});S.ph="resolve";resolve();S.ph="hero";S.heroes[2].ap=9`);
  R(`apply({type:"heroAct",h:2,j:${MJ},x:10,y:14})`);
  ok(R(`apply({type:"heroAct",h:2,j:${PJ},x:10,y:14})`) === 1 && R("mvOf(S.heroes[2])") === 3, "영창한 그 턴엔 이동 그대로 3");
  ok(R(`apply({type:"heroAct",h:2,j:"m",x:10,y:13})`) === 1, "영창한 뒤에도 3칸 걷기 가능");
  next();
  ok(R("mvOf(S.heroes[2])") === 2, "다음 턴: 영창으로 유지 중인 마법진이 있으니 이동 3 → 2");
  ok(R(`apply({type:"heroAct",h:2,j:"m",x:13,y:13})`) === 0 && R(`apply({type:"heroAct",h:2,j:"m",x:12,y:13})`) === 1, "유지 중엔 2칸까지만");
  ok(R(`apply({type:"heroAct",h:2,j:${PJ},x:10,y:14})`) === 0, "먼저 걸으면 영창 잠김 (→ 이번 턴 끝에 발동)");
  next();
  ok(R("cirsOf(S.heroes[2]).length") === 0 && R("mvOf(S.heroes[2])") === 3, "마법진이 발동해 사라지면 이동 거리 복구 3"); }

// (v83) 새 상자는 용사 턴이 시작될 때 용사에게 보임 — 보스 턴에 둔 함정 상자가 들통나지 않게
setup("gron"); R(`S.ph="boss";S.boss.ap=9;S.cd={};S.chests=[]`);
ok(R(`apply({type:"bossBuild",id:"tchest",p:[[20,15]]})`) === 1, "함정 상자 설치");
ok(R("view(S,'hero').chests.length") === 0 && !/상자/.test(R("view(S,'hero').log")), "보스 턴 도중: 용사 화면엔 상자도, 함정 상자 글도 안 보임");
ok(R("view(S,'boss').chests.length") === 1, "보스 화면엔 바로 보임");
R(`apply({type:"endBoss"})`);
ok(R("view(S,'hero').chests.length") === 1 && R("view(S,'hero').chests[0].k") === "t" && /상자가 나타났다/.test(R("S.log")), "용사 턴 시작: 보통 상자처럼 나타나고 '상자가 나타났다' 안내");
R(`S.chests=[];S.heroes.forEach(h=>{h.x=2;h.y=27});S.boss.x=27;S.boss.y=2;apply({type:"endHero"});S.rng=1`);
{ let made = 0; for (let i = 0; i < 40 && !made; i++) { R(`S.ph="resolve";S.chests=[];chSpawn(1)`); made = R("S.chests.length"); }
  ok(made === 1 && R("view(S,'hero').chests.length") === 0, "정산 때 저절로 생긴 상자도 보스 턴 동안은 용사에게 안 보임");
  R(`S.ph="boss";apply({type:"endBoss"})`); ok(R("view(S,'hero').chests.length") === 1, "→ 용사 턴 시작에 나타남 (보통 상자·함정 상자가 똑같이)"); }

// (v83) 숨김 스킬은 힌트조차 없음: 글·AP·쿨타임
setup("gron"); R(`S.ph="boss";S.boss.ap=6;S.cd={};S.used={};S.log="보스 차례 시작";S.pits=[]`);
{ const ap0 = R("S.boss.ap"), x0 = R("S.boss.x"), y0 = R("S.boss.y");
  ok(R(`apply({type:"bossBuild",id:"pit",p:[]})`) === 1 && R(`apply({type:"bossBuild",id:"trap",p:[[${x0},${y0}+3]]})`) === 1, "구덩이 파기 + 가시 함정 설치");
  ok(R("S.boss.ap") < ap0 && /🔒/.test(R("S.log")), `보스 화면: AP 실제로 줄고(${ap0}→${R("S.boss.ap")}) 비밀 글 보임`);
  ok(R("view(S,'hero').log") === "보스 차례 시작" && !/구덩이|함정|만지작/.test(R("view(S,'hero').log")), `용사 화면 글: 직전 공개 글 그대로 ("${R("view(S,'hero').log")}")`);
  ok(R("view(S,'hero').boss.ap") === ap0, `용사 화면 보스 AP: 숨김 스킬에 쓴 AP 는 안 줄어든 것처럼 (${R("view(S,'hero').boss.ap")})`);
  ok(R("view(S,'hero').cd") === undefined && R("view(S,'hero').pits.length") === 0, "용사 화면: 보스 쿨타임·숨은 구덩이 없음");
  ok(R(`apply({type:"bossMove",x:${x0}+1,y:${y0}})`) === 1 && R("view(S,'hero').boss.ap") === ap0 - 1, "보이는 행동(이동)에 쓴 AP 는 그대로 줄어 보임");
  R(`apply({type:"endBoss"});apply({type:"endHero"});apply({type:"resolve"})`);
  ok(R("S.sec.hap||0") === 0 && R("view(S,'hero').boss.ap") === R("S.boss.ap"), "새 라운드: 숨김 AP 기록 초기화"); }

// (v84) 함정 컷인 기록: 가시 함정·구덩이·미믹(함정 상자)
setup("gron"); R(`S.ph="boss";S.boss.ap=9;S.used={};S.cuts=[];S.boss.x=10;S.boss.y=12;S.heroes[0].x=10;S.heroes[0].y=20`);
R(`apply({type:"bossBuild",id:"trap",p:[[10,19]]});apply({type:"endBoss"});apply({type:"heroAct",h:0,j:"m",x:10,y:18});apply({type:"endHero"});apply({type:"resolve"})`);
ok(R("(S.cuts||[]).some(c=>c.k=='spike'&&c.h==0)"), "가시 함정을 밟으면 컷인 기록 (기사)");
setup("gron"); R(`S.cuts=[];S.pits=[{x:10,y:17},{x:3,y:3}];S.heroes[0].x=10;S.heroes[0].y=20;S.ph="hero"`);
R(`apply({type:"heroAct",h:0,j:"m",x:10,y:17})`);
ok(R("(S.cuts||[]).some(c=>c.k=='pit'&&c.h==0)"), "숨은 구덩이에 빠지면 컷인 기록");
setup("gron"); R(`S.cuts=[];S.chests=[{id:1,x:10,y:19,k:"x"}];MOB.trapChest.mimicChance=1;S.heroes[0].x=10;S.heroes[0].y=20;S.ph="hero"`);
R(`apply({type:"settle"})`);
ok(R("(S.cuts||[]).some(c=>c.k=='mimic'&&c.h==0)"), "함정 상자(미믹)를 열면 컷인 기록");
R(`MOB.trapChest.mimicChance=DATA.monsters.trapChest.mimicChance`);

console.log(fail ? fail + "개 실패" : "규칙 테스트 모두 통과");
process.exit(fail ? 1 : 0);
