/* [규칙] 간파 시스템 — 숨긴 것(함정·구덩이·폭탄로봇·함정 상자)을 둘러싼 줄다리기
   S.ins.v : 한 줄을 양쪽이 같이 씀. +면 보스 쪽, -면 용사 쪽 (끝은 ±RULE.insight.max)
   점수를 얻는 때
     보스: 용사가 숨은 가시 함정·폭탄로봇·구덩이·함정 상자에 걸렸을 때
     용사: 숨은 것을 밝혀내거나 없앴을 때 (천상의 계시·관통 화살·마법진 발동으로 구덩이 발각)
   콤보: 같은 진영이 연달아 얻으면(상대가 그 사이에 못 얻으면) 2번째부터 +comboBonus 씩, 최대 +comboMax
   단계 혜택(내 쪽으로 처음 올라설 때만, 상대에게 밀려 내려온 건 해당 없음. 받은 뒤 resetTurns 턴이 지나면 다시 받을 수 있음)
     2: 유닛 AP +(용사 t2HeroAp / 보스 t2BossAp), 스킬 쿨타임 -t2Cd
     3: 스킬 쿨타임 초기화(궁극기 제외)   5: 궁극기 쿨타임 초기화(보스는 궁극기가 생기면 연결)
     7: 상대 차례를 끊고 바로 내 차례      max(10): 승리
   수치는 data/rulesets/standard.json 의 insight (구글 시트 "규칙" 탭) */
const ULT_T = { u: 1, v: 1, o: 1 }; // 궁극기로 치는 용사 스킬 종류: 천상의 계시(u)·관통 화살(v)·마력 방출(o)
const INS_TIERS = [2, 3, 5, 7];
const insNew = () => ({ v: 0, last: "", st: 0, got: { b: {}, h: {} }, note: "" });
const insName = s => s == "b" ? "보스" : "용사";
// side: "b" 보스 / "h" 용사, n: 이번 행동으로 걸리거나 밝혀진 개수
function insGain(side, n) {
  const C = RULE.insight;
  if (!C || !(n > 0) || S.end || S.ph == "setup") return 0;
  const I = S.ins = S.ins || insNew();
  I.st = I.last == side ? I.st + 1 : 1; I.last = side;
  const amt = Math.min(C.actionCap, n) * C.insGain + Math.min(C.comboMax, (I.st - 1) * C.comboBonus), sg = side == "b" ? 1 : -1, bf = I.v * sg;
  I.v = cl(I.v + sg * amt, -C.insMax, C.insMax);
  const af = I.v * sg;
  let m = "👁 " + insName(side) + " 간파 +" + (af - bf) + (I.st > 1 ? " (" + I.st + "콤보)" : "");
  INS_TIERS.forEach(t => {
    if (bf < t && af >= t && af < C.insMax && !(I.got[side][t] && S.round - I.got[side][t] < C.resetTurns)) { I.got[side][t] = S.round; m += " · " + t + "단계: " + insPerk(side, t); }
  });
  if (af >= C.insMax) { S.end = side == "b" ? "👹 보스 진영 승리! 간파 수치 " + C.insMax + " — 용사의 움직임을 완전히 읽었습니다." : "🧙 용사 진영 승리! 간파 수치 " + C.insMax + " — 던전의 속임수를 모두 꿰뚫었습니다."; m += " · 승리!"; }
  I.note = m;
  return amt;
}
function insPerk(side, t) {
  const C = RULE.insight, I = S.ins, B = side == "b";
  // 쿨타임 줄이기: n<0 이면 0 으로, f(스킬) 가 참인 용사 스킬만 (보스 스킬은 전부)
  const cd = (n, f) => {
    if (B) { S.cd = S.cd || {}; for (const q in S.cd) S.cd[q] = n < 0 ? 0 : Math.max(0, S.cd[q] - n); }
    else S.heroes.forEach(h => { if (h.dead || !h.cd) return; for (const q in h.cd) if (f(CLS[h.k].sk[q])) h.cd[q] = n < 0 ? 0 : Math.max(0, h.cd[q] - n); });
  };
  if (t == 2) {
    // 내 차례 중이면 바로, 아니면 다음 내 차례가 시작될 때(AP 를 새로 채운 뒤) 더함
    if (B) { if (S.ph == "boss") S.boss.ap += C.t2BossAp; else I.bap = (I.bap || 0) + C.t2BossAp; }
    else { if (S.ph == "hero") S.heroes.forEach(h => { if (!h.dead) h.ap += C.t2HeroAp; }); else I.hap = (I.hap || 0) + C.t2HeroAp; }
    cd(C.t2Cd, () => 1);
    return "AP +" + (B ? C.t2BossAp : C.t2HeroAp) + " · 쿨타임 -" + C.t2Cd;
  }
  if (t == 3) { cd(-1, s => !ULT_T[s.t]); return "스킬 쿨타임 초기화"; }
  if (t == 5) { if (B) return "(보스 궁극기 준비 중)"; cd(-1, s => ULT_T[s.t]); return "궁극기 쿨타임 초기화"; }
  if (t == 7) {
    if (B) { if (S.ph == "hero") { S.ph = "resolve"; I.cutR = S.round; return "용사 차례를 끊고 바로 보스 공격 발동!"; } I.skip = "h"; return "다음 용사 차례를 건너뜀!"; }
    I.skip = "b"; return "다음 보스 차례를 건너뜀!";
  }
  return "";
}
// 정산이 끝나 새 라운드가 시작될 때: 미뤄 둔 AP 를 더하고, 용사가 7단계를 얻었으면 보스 차례를 건너뜀
function insTurn() {
  const I = S.ins; if (!I || S.end) return;
  if (I.bap) { S.boss.ap += I.bap; I.bap = 0; }
  if (I.hap) { S.heroes.forEach(h => { if (!h.dead) h.ap += I.hap; }); I.hap = 0; }
  if (I.skip == "b") { I.skip = ""; const lg = S.log, rv = S.rev; endBossTurn(); S.rev = rv; S.log = lg + " ⏩ 간파 7단계: 보스 차례를 건너뛰고 용사 차례!"; }
}
