/* [규칙] 행동 입구 — 명령(Command) 패턴
   사람(입력)·컴퓨터(AI)·나중의 서버가 모두 apply({type: ...}) 하나로만 게임을 바꿉니다.
   - 행동은 JSON 으로 표현 → 네트워크로 보내기 쉽고, 서버가 같은 행동을 같은 규칙으로 검증·실행
   - 모든 행동은 REC.actions 에 기록 → 같은 씨앗(S.seed)으로 새 판을 만들고 같은 행동 목록을 다시 apply 하면
     어디서 돌려도(브라우저·서버) 똑같은 판이 나옴 (리플레이·버그 재현·부정행위 검증)
   행동 목록:
     setPick{ids} pickHero{k} pickChamp{id} start
     heroAct{h(용사 번호), j("m" 이동 / "x" 벽·벨트 부수기 / 스킬 번호), x, y, p(여러 칸을 고르는 스킬: [[x,y],...])}
     heroItem{h, k} bossItem{gen, k} scrollHero{h, x, y} scrollBoss{gen, x, y}
     bossMove{x, y} bossAttack{i(공격 번호), p(칸 목록), fb} bossBuild{id(설치 스킬 id), p} genCharge
     endBoss endHero resolve settle(행동 뒤 정리: 상자 열기 판정 등) */
const REC = { of: null, seed: 0, actions: [] };
const bossName = gen => gen ? "발전기" : (CH[S.champ].bn || CH[S.champ].n);
const ACTIONS = {
  setPick: a => { S.pick = a.ids.slice(); return 1; },
  pickHero: a => { const p = S.pick, i = p.indexOf(a.k); if (i >= 0) p.splice(i, 1); else if (p.length < 3) p.push(a.k); return 1; },
  pickChamp: a => chooseChamp(a.id),
  start: () => startGame(),
  heroAct: a => act(S.heroes[a.h], a.j, a.x, a.y, a.p),
  heroItem: a => itemUse("h", S.heroes[a.h], a.k, CLS[S.heroes[a.h].k].n),
  bossItem: a => itemUse("b", a.gen ? S.gen : S.boss, a.k, bossName(a.gen)),
  scrollHero: a => scrollHero(S.heroes[a.h], a.x, a.y),
  scrollBoss: a => scrollBoss(a.x, a.y, a.gen),
  bossMove: a => bMove(a.x, a.y),
  bossAttack: a => bAtk(a.i, a.p, a.fb),
  bossBuild: a => bExtra(CH[S.champ].ex.find(e => e.id == a.id), a.p),
  genCharge: () => genCharge(),
  endBoss: () => (endBossTurn(), 1),
  endHero: () => (endHeroTurn(), 1),
  resolve: () => (resolve(), 1),
  settle: () => { chestScanAll(); mirrorSec(); return 1; },
};
// 행동 실행 + 기록. 반환값은 각 규칙 함수의 결과 그대로(성공 1 / 실패 0, 아이템은 {ok|err|aim})
function apply(a) {
  if (REC.of !== S) { REC.of = S; REC.seed = S.seed; REC.actions = []; } // 새 판이면 기록 새로 시작
  const f = ACTIONS[a.type];
  if (!f) return 0;
  REC.actions.push(JSON.parse(JSON.stringify(a)));
  return f(a);
}
// 리플레이: 씨앗과 행동 목록으로 처음부터 다시 둠 → 최종 상태
function replay(log) {
  S = newS(); S.seed = S.rng = log.seed; S.airng = (log.seed ^ 0x9E3779B9) >>> 0; REC.of = null;
  for (const a of log.actions) apply(a);
  return S;
}
