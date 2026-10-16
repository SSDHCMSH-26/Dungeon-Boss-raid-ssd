/* 마법진(마법사) 규칙 테스트 — 화면 없이 규칙 엔진(core)만으로
   사용법: node tools/test_circle.js
   그리기·영창(그린 턴 포함)·이월·발동(영창 안 한 턴 끝), 위력/확산 영창, 피해로 끊기지 않음(v77), 보호막,
   빙결(이동 감소·행동불능), 불바닥, 구덩이 발각, 놓는 곳(벽 칸 중심 불가, 건물 위 가능), 그론 벽 금지,
   걸은 턴은 영창 잠김·영창으로 유지 중엔 다음 턴부터 이동 -1(v77), 여러 마법진·영창할 마법진 고르기·쿨타임(v76), 순간이동은 마법진 안으로만, AI, 리플레이 */
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
// 영창: 영창할 수 있는 첫 마법진의 중심 칸을 골라서 (없으면 0,0 → 실패)
const chant = j => { const c = JSON.parse(R("JSON.stringify(cirsOf(S.heroes[2]).find(c=>!c.ch&&c.lv<CIRC.maxLv)||{x:0,y:0})")); return act(j, c.x, c.y); };

ok(MJ > 2 && FJ > 2 && SJ > 2 && PJ > 2 && WJ > 2, `마법사 새 스킬 5개 (화염 ${MJ}, 빙결 ${FJ}, 수호 ${SJ}, 위력 ${PJ}, 확산 ${WJ})`);

// 1) 그리기 → 그 턴에 영창하면 이월, 영창 안 하면 그 턴 끝(보스 턴 전)에 발동
setup("gron");
ok(R("S.heroes[2].ap") === 4 && R("mvOf(S.heroes[2])") === 3 && R("S.heroes[2].max") === 60, "마법사 기본 AP 4 · 이동 3 · 체력 60");
ok(act(TJ, 15, 9) === 0, "마법진이 없으면 순간이동 불가");
ok(act(MJ, 15, 7) === 1 && R("S.heroes[2].ap") === 2, "화염 마법진 그리기 (AP 2 사용, 사거리 7 안)");
ok(act(MJ, 15, 8) === 0 && R(`S.heroes[2].cd[${MJ}]`) === R(`CLS.mage.sk[${MJ}].cd`) + 1, `같은 마법진은 쿨타임(${R(`CLS.mage.sk[${MJ}].cd`)}턴) 동안 다시 못 그림`);
ok(chant(PJ) === 1 && R("S.heroes[2].cirs[0].lv") === 2, "그린 턴에도 영창 가능 → Lv2");
ok(chant(WJ) === 0, "영창은 턴당 1번");
ok(R("mvOf(S.heroes[2])") === R("CLS.mage.mv"), "영창한 그 턴엔 이동 거리 그대로");
ok(act(TJ, 18, 12) === 0, "순간이동: 마법진 밖으로는 불가");
ok(act(TJ, 15, 8) === 1 && R("S.heroes[2].x") === 15 && R("S.heroes[2].y") === 8, "순간이동: 마법진 안으로는 가능 (영창한 턴에도)");
ok(R(`S.heroes[2].cd[${TJ}]`) === 3, "순간이동 쿨타임 2턴 (정산 때마다 -1 → 2턴 기다림)");
let h0 = bhp(); round();
ok(bhp() === h0 && R("S.heroes[2].cirs[0].lv") === 2, "영창한 턴 끝: 발동 안 하고 이월");
ok(act("m", 15, 10) === 1, "다음 턴: 걷기 가능 (영창 안 함)");
ok(R("mvOf(S.heroes[2])") === R("CLS.mage.mv") - R("CIRC.chantMove"), `영창으로 유지 중인 다음 턴엔 이동 -${R("CIRC.chantMove")}`);
ok(chant(WJ) === 0, "걸은 턴에는 영창 불가 (영창 탭 잠김)");
h0 = bhp(); round();
ok(h0 - bhp() === 35 + 5 && !R("cirsOf(S.heroes[2]).length"), `걸은 턴 끝에 이월 없이 발동: Lv2 35 + 위력 5 = 40 (보스 ${h0}→${bhp()})`);
ok(R("mvOf(S.heroes[2])") === R("CLS.mage.mv"), "마법진이 발동해 사라지면 이동 거리 복구");
setup("gron"); act(MJ, 15, 7); h0 = bhp(); round();
ok(h0 - bhp() === 10 && !R("cirsOf(S.heroes[2]).length"), `그리고 영창 안 하면 그 턴 끝(보스 턴 전)에 바로 발동: Lv1 10 (${h0 - bhp()})`);
setup("gron"); ok(act("m", 15, 10) === 1 && act(MJ, 15, 7) === 1 && chant(PJ) === 0, "걸은 뒤 그린 턴에도 영창 불가");

// 2) 위력 + 확산 → Lv3 · 55+5 = 60, 범위 사방 +1 (5×5) · 불바닥
setup("gron"); act(MJ, 15, 8); chant(PJ); round();
ok(chant(WJ) === 1 && R("S.heroes[2].cirs[0].lv") === 3 && R("cirR(S.heroes[2],S.heroes[2].cirs[0])") === 2, "확산 영창 → Lv3, 범위 반지름 1→2");
round(); ok(chant(PJ) === 0, "Lv3(최대)에서는 더 영창 불가");
h0 = bhp(); round();
ok(h0 - bhp() === 60, `Lv3 + 위력 1번 = 55+5 = 60 (${h0 - bhp()})`);
ok(R("(S.burn||[]).length") === 1, "Lv3 화염: 불바닥 생김");
h0 = bhp(); round();
ok(h0 - bhp() === 10 && R("(S.burn||[]).length") === 0, `다음 정산 때 불바닥 피해 10 후 사라짐 (${h0 - bhp()})`);

// 3) (v77) 피해를 받아도 마법진은 끊기지 않음
setup("gron"); act(MJ, 15, 7); chant(PJ); R(`S.heroes[2].x=20;S.heroes[2].y=20;S.atks=[{i:0,p:[[20,20]]}]`);
let v0 = R("CH.gron.at[0].v");
R(`apply({type:"endHero"});apply({type:"resolve"})`);
ok(R("cirsOf(S.heroes[2]).length") === 1 && !/끊김/.test(R("S.log")), `보스 공격 ${v0} 한 방을 맞아도 마법진 유지`);
ok(R(`""+hurt(S.heroes[2],25)`) === "25" && R("cirsOf(S.heroes[2]).length") === 1, "큰 피해(25)도 마법진 유지");

// 4) 수호 마법진: 범위 안 아군 보호막 5, 피해를 먼저 막음
setup("gron"); R(`S.heroes[0].x=14;S.heroes[0].y=14;S.heroes[1].x=16;S.heroes[1].y=15`);
act(SJ, 15, 14); round();
ok(R("S.heroes[0].sh") === 5 && R("S.heroes[1].sh") === 5 && R("S.heroes[2].sh||0") === 0, "수호 Lv1: 범위 안 기사·성직자 보호막 5 (밖의 마법사는 없음)");
let hp0 = R("S.heroes[0].hp"); R("hurt(S.heroes[0],15)");
ok(hp0 - R("S.heroes[0].hp") === 10 && R("S.heroes[0].sh") === 0, "피해 15 → 보호막 5 가 먼저 막고 체력 -10");

// 5) 빙결 결계: Lv1 이동 -1 (다음 보스 턴), Lv3 행동불능
setup("gron"); let mv0 = R("bMv()"); act(FJ, 15, 8); round();
ok(R("bMv()") === mv0 - 1, `빙결 Lv1: 다음 보스 턴 이동 ${mv0}→${R("bMv()")}`);
round(); ok(R("bMv()") === mv0, "그다음 턴엔 원래대로");
setup("gron"); act(FJ, 15, 8); chant(PJ); round(); chant(PJ);
h0 = bhp(); round(); R(`apply({type:"endHero"});apply({type:"resolve"})`);
ok(h0 - bhp() === 35 && R("S.boss.ap") === 0, `빙결 Lv3(위력 2번): 피해 25+10=35, 다음 보스 턴 AP 0 (행동불능) (${h0 - bhp()})`);
ok(R(`apply({type:"bossMove",x:15,y:3})`) === 0, "행동불능 보스는 이동 불가");

// 6) 놓는 곳: 벽 칸 중심 불가 · 공장·발전기·유닛 위 가능 · 확산은 어디로든 · 구덩이 발각 · 그론 벽 금지
setup("gron"); R(`S.map=S.map.slice(0,7*N+15)+"1"+S.map.slice(7*N+16)`);
ok(act(MJ, 15, 7) === 0, "벽 칸을 중심으로는 그릴 수 없음");
ok(act(MJ, 15, 8) === 1, "벽 바로 옆 칸 중심은 가능 (범위에 벽이 들어가도 됨)");
setup("gron"); R(`S.pits=[{x:20,y:12},{x:2,y:2}]`); act(MJ, 21, 13); chant(PJ);
R(`S.ph="boss"`);
ok(R(`apply({type:"bossBuild",id:"wall",p:[[21,14],[22,14],[23,14]]})`) === 0, "그론: 마법진 칸에 벽 쌓기 불가");
R(`S.boss.ap=6;S.used={}`);
ok(R(`apply({type:"bossBuild",id:"wall",p:[[16,16],[17,16],[18,16]]})`) === 1, "그론: 마법진 밖에는 벽 쌓기 가능");
R(`S.ph="hero"`); round(); round();
ok(R("S.pits[0].rv") === 1 && !R("S.pits[1].rv"), "발동 후 범위 안 숨은 구덩이 발각 (밖의 구덩이는 그대로)");
setup("vince"); R(`S.fac=[{id:1,x:20,y:12,hp:40,mx:40,lv:1,cd:3,en:0}];S.gen.x=8;S.gen.y=12`);
ok(act(MJ, 20, 12) === 1, "빈센토: 공장 위에도 그릴 수 있음");
R(`S.heroes[2].cirs=[];S.heroes[2].cd={};S.heroes[2].ap=4`);
ok(act(MJ, 9, 12) === 1, "빈센토: 발전기 위에도 그릴 수 있음");
R(`S.heroes[2].cirs=[];S.heroes[2].cd={};S.heroes[2].ap=4`);
ok(act(MJ, 18, 11) === 1 && chant(WJ) === 1, "확산하면 공장에 닿아도 확산 영창 가능");
R(`S.ph="boss";S.boss.ap=9`);
ok(R(`apply({type:"bossBuild",id:"fac",p:[[17,13]]})`) === 1, "빈센토: 마법진 칸에도 공장 설치 가능 (마법진은 건물과 겹쳐도 됨)");

// 7) (v76) 마법진 여러 개: 이월된 마법진이 있어도 다른 마법진을 새로 그림 · 영창은 고른 마법진에 · 영창은 턴당 1번
setup("gron"); R("S.heroes[2].ap=9"); act(MJ, 15, 7); chant(PJ); round(); R("S.heroes[2].ap=9");
ok(R("cirsOf(S.heroes[2]).length") === 1 && act(MJ, 15, 7) === 0, "이월된 화염 마법진 1개 · 화염은 아직 쿨타임");
ok(act(FJ, 15, 9) === 1 && R("cirsOf(S.heroes[2]).length") === 2, "이월된 마법진이 있어도 다른 마법진(빙결)을 새로 그림 → 2개");
ok(act(PJ, 15, 9) === 1 && R("S.heroes[2].cirs[1].lv") === 2 && R("S.heroes[2].cirs[0].lv") === 2 && R("S.heroes[2].cirs[0].ch") === 0, "고른 칸의 마법진(빙결)에만 영창 → 빙결 Lv2, 화염은 그대로");
ok(act(WJ, 15, 7) === 0, "마법진이 여러 개여도 영창은 턴당 1번");
h0 = bhp(); round();
ok(h0 - bhp() === 35 + 5 && R("cirsOf(S.heroes[2]).length") === 1 && R("S.heroes[2].cirs[0].j") === FJ, `영창 못 받은 화염은 그 턴 끝 발동(Lv2 35+5=40, ${h0 - bhp()}), 영창 받은 빙결은 이월`);
R("S.heroes[2].ap=9"); ok(act(SJ, 15, 15) === 1 && act(TJ, 15, 14) === 1, "순간이동: 어느 내 마법진 안으로든 가능");

// 9) 같은 씨앗 + 같은 행동 = 같은 결과 (리플레이)
setup("gron"); act(MJ, 15, 7); chant(PJ); round(); round();
const log = R("JSON.parse(JSON.stringify({seed:REC.seed,actions:REC.actions}))"), h1 = R("stateHash(S)");
// setup 이 행동 밖에서 바꾼 상태가 있으므로 리플레이는 apply 만으로 다시 둔 두 엔진끼리 비교
const E2 = createEngine({ clock: "()=>0" }), E3 = createEngine({ clock: "()=>0" });
E2.call("replay", log); E3.call("replay", log);
ok(E2.run("stateHash(S)") === E3.run("stateHash(S)"), "마법진 행동이 든 기록을 두 엔진에서 리플레이 → 같은 결과");

// 10) 컴퓨터(AI): 보스는 화염 마법진을 피하고, 컴퓨터 마법사는 마법진·영창을 씀
setup("gron"); act(MJ, 15, 7); R(`S.ph="boss";S.boss.ap=6;S.boss.moved=0;AB.dodgeCircle.chance=1;AB.gron.wall.chance=0;AB.gron.spikeTrap.chance=0;AB.gron.trapChest.chance=0;AB.gron.digPit.chance=0;AB.gron.hopPit.chance=0`);
ok(R("cirHit(S.boss.x,S.boss.y)"), "보스가 화염 마법진 범위에 닿아 있음");
R("aiBoss()"); ok(!R("cirHit(S.boss.x,S.boss.y)") && R("S.boss.moved") === 1, `컴퓨터 보스가 마법진 밖으로 이동 (${R("S.boss.x")},${R("S.boss.y")})`);
{ const E4 = createEngine({ clock: "()=>0" }); let draw = 0, chant = 0, fired = 0, games = 0;
  for (let sd = 1; sd <= 30; sd++) {
    const r = E4.call("simMatch", { seed: sd, champ: sd % 2 ? "vince" : "gron", pick: ["knight", "cleric", "mage"] }); games++;
    r.log.actions.forEach(a => { if (a.type == "heroAct" && typeof a.j == "number") { const t = E4.run(`CLS[S.heroes[${a.h}].k].sk[${a.j}].t`); if (t == "c") draw++; if (t == "w") chant++; } });
  }
  ok(draw > 0 && chant > 0, `컴퓨터 마법사 ${games}판: 마법진 ${draw}번 · 영창 ${chant}번 사용 (오류 없이 끝까지 진행)`);
}
console.log(fail ? fail + "개 실패" : "마법진 테스트 모두 통과");
process.exit(fail ? 1 : 0);
