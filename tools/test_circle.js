/* 마법진(마법사) 규칙 테스트 — 화면 없이 규칙 엔진(core)만으로
   사용법: node tools/test_circle.js
   그리기·영창·이월·발동, 위력/확산 영창, 끊김(한 번에 체력 피해 20 이상, 보호막 별개), 보호막, 빙결(이동 감소·행동불능),
   불바닥, 구덩이 발각, 그론 벽·빈센토 공장/발전기 배치 제한, 걷기 금지·순간이동은 마법진 안으로만, 리플레이 */
const { createEngine } = require("./headless.js");
let fail = 0;
const ok = (c, m) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) fail++; };
const E = createEngine({ clock: "()=>0" });
const R = s => E.run(s);
// 판 준비: 챔피언 c, 용사 기사·성직자·마법사, 위치를 시험하기 좋게 정리(벽 없는 맵)
const setup = c => R(`S=newS();apply({type:"pickChamp",id:"${c}"});apply({type:"setPick",ids:["knight","cleric","mage"]});apply({type:"start"});
S.map="0".repeat(N*N);S.walls=[];S.pits=[];S.chests=[];S.mobs=[];S.belts=[];S.cry=[];S.fac=[];S.rob=[];
S.boss.x=15;S.boss.y=5;if(S.gen){S.gen.x=25;S.gen.y=25}
S.heroes[0].x=10;S.heroes[0].y=20;S.heroes[1].x=12;S.heroes[1].y=20;S.heroes[2].x=15;S.heroes[2].y=12;S.ph="hero";1`);
const MJ = R(`CLS.mage.sk.findIndex(q=>q.fx&&q.fx.kind=="meteor")`), FJ = R(`CLS.mage.sk.findIndex(q=>q.fx&&q.fx.kind=="frost")`),
  SJ = R(`CLS.mage.sk.findIndex(q=>q.fx&&q.fx.kind=="shield")`), PJ = R(`CLS.mage.sk.findIndex(q=>q.fx&&q.fx.kind=="power")`),
  WJ = R(`CLS.mage.sk.findIndex(q=>q.fx&&q.fx.kind=="spread")`), TJ = R(`CLS.mage.sk.findIndex(q=>q.t=="b")`);
const act = (j, x, y, h = 2) => R(`apply({type:"heroAct",h:${h},j:${JSON.stringify(j)},x:${x},y:${y}})`);
// 한 라운드 넘기기: 용사 턴 끝 → 정산 → (보스는 아무것도 안 함) → 보스 턴 끝 → 용사 턴
const round = () => R(`apply({type:"endHero"});apply({type:"resolve"});apply({type:"endBoss"});S.log`);
const bhp = () => R("S.boss.hp");

ok(MJ > 2 && FJ > 2 && SJ > 2 && PJ > 2 && WJ > 2, `마법사 새 스킬 5개 (화염 ${MJ}, 빙결 ${FJ}, 수호 ${SJ}, 위력 ${PJ}, 확산 ${WJ})`);

// 1) 그리기 → 그린 턴엔 발동 안 함 → 다음 턴 영창 안 하면 발동 (Lv1 피해 25)
setup("gron");
ok(act(MJ, 15, 7) === 1 && R("S.heroes[2].ap") === 1, "화염 마법진 그리기 (AP 2 사용, 사거리 7 안)");
ok(act(MJ, 15, 8) === 0, "마법진은 한 번에 하나만");
ok(act("m", 15, 13) === 0, "마법진이 있는 동안 걷기 불가");
ok(act(TJ, 18, 12) === 0, "순간이동: 마법진 밖으로는 불가");
ok(act(PJ, 0, 0) === 0, "그린 턴에는 영창 불가");
let h0 = bhp(); round();
ok(bhp() === h0 && R("!!S.heroes[2].cir"), "그린 턴 끝: 발동 안 하고 이월");
ok(act(TJ, 15, 8) === 1 && R("S.heroes[2].x") === 15 && R("S.heroes[2].y") === 8, "순간이동: 마법진 안으로는 가능");
h0 = bhp(); round();
ok(h0 - bhp() === 25 && !R("S.heroes[2].cir"), `영창 안 한 턴 끝에 발동: Lv1 피해 25 (보스 ${h0}→${bhp()})`);

// 2) 위력 영창 1번 → Lv2 · 45+5 = 50
setup("gron"); act(MJ, 15, 7); round();
ok(act(PJ, 0, 0) === 1 && R("S.heroes[2].cir.lv") === 2, "위력 영창 → Lv2");
ok(act(WJ, 0, 0) === 0, "영창은 턴당 1번");
h0 = bhp(); round();
ok(bhp() === h0 && R("S.heroes[2].cir.lv") === 2, "영창한 턴 끝: 이월(발동 안 함)");
h0 = bhp(); round();
ok(h0 - bhp() === 50, `Lv2 + 위력 1번 = 45+5 = 50 (${h0 - bhp()})`);

// 3) 위력 + 확산 → Lv3 · 65+5 = 70, 범위 사방 +1 (5×5) · 불바닥
setup("gron"); act(MJ, 15, 8); round(); act(PJ, 0, 0); round();
ok(act(WJ, 0, 0) === 1 && R("S.heroes[2].cir.lv") === 3 && R("cirR(S.heroes[2])") === 2, "확산 영창 → Lv3, 범위 반지름 1→2");
round(); ok(act(PJ, 0, 0) === 0, "Lv3(최대)에서는 더 영창 불가");
h0 = bhp(); round();
ok(h0 - bhp() === 70, `Lv3 + 위력 1번 = 65+5 = 70 (중심 15,8 · 반지름 2) (${h0 - bhp()})`);
ok(R("(S.burn||[]).length") === 1, "Lv3 화염: 불바닥 생김");
h0 = bhp(); round();
ok(h0 - bhp() === 10 && R("(S.burn||[]).length") === 0, `다음 정산 때 불바닥 피해 10 후 사라짐 (${h0 - bhp()})`);

// 4) 끊김: 한 번에 체력 피해 20 이상 (보호막으로 막힌 양은 빼고)
setup("gron"); act(MJ, 15, 7); R(`S.heroes[2].x=20;S.heroes[2].y=20;S.atks=[{i:0,p:[[20,20]]}]`);
let v0 = R("CH.gron.at[0].v");
R(`apply({type:"endHero"});apply({type:"resolve"})`);
ok(!R("S.heroes[2].cir") && /영창 끊김/.test(R("S.log")), `보스 공격 ${v0} 한 방 → 영창 끊김 (마법진 사라짐)`);
setup("gron"); act(MJ, 15, 7); R(`S.heroes[2].x=20;S.heroes[2].y=20;S.heroes[2].sh=${v0 - 19};S.atks=[{i:0,p:[[20,20]]}]`);
R(`apply({type:"endHero"});apply({type:"resolve"})`);
ok(R("!!S.heroes[2].cir") && R("S.heroes[2].sh") === 0, `보호막 ${v0 - 19} 이 막아 체력 피해 19 → 안 끊김`);
setup("gron"); act(MJ, 15, 7); R(`S.heroes[2].x=20;S.heroes[2].y=20`);
ok(/영창 끊김/.test(R(`hurt(S.heroes[2],12)+" "+hurt(S.heroes[2],12)`)) === false && R("!!S.heroes[2].cir"), "12 + 12 따로 두 번 → 안 끊김 (한 번에 20 이상만)");
ok(/영창 끊김/.test(R(`""+hurt(S.heroes[2],20)`)) && !R("S.heroes[2].cir"), "한 번에 20 → 끊김");

// 5) 수호 마법진: 범위 안 아군 보호막 10, 피해를 먼저 막음
setup("gron"); R(`S.heroes[0].x=14;S.heroes[0].y=14;S.heroes[1].x=16;S.heroes[1].y=15`);
act(SJ, 15, 14); round(); round();
ok(R("S.heroes[0].sh") === 10 && R("S.heroes[1].sh") === 10 && R("S.heroes[2].sh||0") === 0, "수호 Lv1: 범위 안 기사·성직자 보호막 10 (밖의 마법사는 없음)");
let hp0 = R("S.heroes[0].hp"); R("hurt(S.heroes[0],15)");
ok(hp0 - R("S.heroes[0].hp") === 5 && R("S.heroes[0].sh") === 0, "피해 15 → 보호막 10 이 먼저 막고 체력 -5");

// 6) 빙결 결계: Lv1 이동 -1 (다음 보스 턴), Lv3 행동불능
setup("gron"); act(FJ, 15, 8); round();
let mv0 = R("bMv()"); round();
ok(R("bMv()") === mv0 - 1, `빙결 Lv1: 다음 보스 턴 이동 ${mv0}→${R("bMv()")}`);
R(`apply({type:"endBoss"});apply({type:"endHero"});apply({type:"resolve"})`);
ok(R("bMv()") === mv0, "그다음 턴엔 원래대로");
setup("gron"); act(FJ, 15, 8); round(); act(PJ, 0, 0); round(); act(PJ, 0, 0); round();
h0 = bhp(); R(`apply({type:"endHero"});apply({type:"resolve"})`);
ok(h0 - bhp() === 35 && R("S.boss.ap") === 0, `빙결 Lv3(위력 2번): 피해 25+10=35, 다음 보스 턴 AP 0 (행동불능) (${h0 - bhp()})`);
ok(R(`apply({type:"bossMove",x:15,y:3})`) === 0, "행동불능 보스는 이동 불가");

// 7) 구덩이 발각 · 그론 벽 설치 금지
setup("gron"); R(`S.pits=[{x:20,y:12},{x:2,y:2}]`); act(MJ, 21, 13);
R(`S.ph="boss"`);
ok(R(`apply({type:"bossBuild",id:"wall",p:[[21,14],[22,14],[23,14]]})`) === 0, "그론: 마법진 칸에 벽 쌓기 불가");
R(`S.boss.ap=6;S.used={}`);
ok(R(`apply({type:"bossBuild",id:"wall",p:[[16,16],[17,16],[18,16]]})`) === 1, "그론: 마법진 밖에는 벽 쌓기 가능");
R(`S.ph="hero"`); round(); round();
ok(R("S.pits[0].rv") === 1 && !R("S.pits[1].rv"), "발동 후 범위 안 숨은 구덩이 발각 (밖의 구덩이는 그대로)");

// 8) 빈센토: 공장·발전기 위 불가, 컨베이어 위 가능
setup("vince"); R(`S.fac=[{id:1,x:20,y:12,hp:40,mx:40,lv:1,cd:3,en:0}];S.gen.x=8;S.gen.y=12;S.belts=[{x:15,y:15,d:0,en:0}]`);
ok(act(MJ, 19, 11) === 0, "공장 칸이 범위에 들면 불가");
ok(act(MJ, 10, 12) === 0, "발전기 칸이 범위에 들면 불가");
ok(act(MJ, 15, 15) === 1, "컨베이어 위는 가능");
R(`S.heroes[2].cir=null;S.heroes[2].ap=3`);
ok(act(MJ, 18, 11) === 1, "공장 바로 옆(겹치지 않음)은 가능");
round(); ok(act(WJ, 0, 0) === 0, "확산하면 공장에 닿는 경우 확산 영창 불가");
R(`S.ph="boss";S.boss.ap=9`);
ok(R(`apply({type:"bossBuild",id:"fac",p:[[17,12]]})`) === 0, "빈센토: 마법진 칸에 공장 설치 불가");
ok(R(`apply({type:"bossBuild",id:"fac",p:[[17,14]]})`) === 1, "빈센토: 마법진 밖에는 공장 설치 가능");

// 9) 같은 씨앗 + 같은 행동 = 같은 결과 (리플레이)
setup("gron"); act(MJ, 15, 7); round(); act(PJ, 0, 0); round(); round();
const log = R("JSON.parse(JSON.stringify({seed:REC.seed,actions:REC.actions}))"), h1 = R("stateHash(S)");
// setup 이 행동 밖에서 바꾼 상태가 있으므로 리플레이는 apply 만으로 다시 둔 두 엔진끼리 비교
const E2 = createEngine({ clock: "()=>0" }), E3 = createEngine({ clock: "()=>0" });
E2.call("replay", log); E3.call("replay", log);
ok(E2.run("stateHash(S)") === E3.run("stateHash(S)"), "마법진 행동이 든 기록을 두 엔진에서 리플레이 → 같은 결과");

console.log(fail ? fail + "개 실패" : "마법진 테스트 모두 통과");
process.exit(fail ? 1 : 0);
