/* [규칙] 화면 없이 한 판 돌리기·상태 지문 — 서버 판정, 밸런스 시뮬레이션, 테스트(브라우저=Node 비교·리플레이)가 같이 씀 */

// 연출 전용 칸(애니메이션 시각·이펙트 목록)과 AI 주사위(airng): 규칙 판단에 안 쓰이고 기기마다 시각이 달라서 "규칙 상태" 비교에서 뺌
const PRES_KEYS = ["airng", "aT", "aK", "hurtT", "tpT", "enT", "fxT", "fxA", "revT", "rfxT", "rfx", "cfx", "fall", "pfx", "sink", "hop", "hfx", "afx"];
function ruleState(st) { return JSON.stringify(st, (k, v) => PRES_KEYS.indexOf(k) >= 0 ? undefined : v); }
// 짧은 지문(FNV-1a 32bit) — 두 곳의 규칙 상태가 같은지 빠르게 비교
function stateHash(st) {
  const s = ruleState(st);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, "0");
}
// 컴퓨터끼리 한 판. o = {seed, champ, pick[3], maxRounds}
// 진행 순서는 혼자 하기 루프와 같음: 차례마다 AI 행동 → (안 끝냈으면) 턴 종료 → settle
function simMatch(o) {
  S = newS();
  if (o.seed !== undefined) { S.seed = S.rng = o.seed >>> 0; S.airng = (S.seed ^ 0x9E3779B9) >>> 0; }
  REC.of = null;
  apply({ type: "pickChamp", id: o.champ });
  apply({ type: "setPick", ids: o.pick });
  apply({ type: "start" });
  apply({ type: "settle" });
  const max = o.maxRounds || 40;
  let guard = 0;
  while (!S.end && S.round <= max && guard++ < 2000) {
    if (S.ph == "boss") { aiBoss(); if (S.ph == "boss") apply({ type: "endBoss" }); }
    else if (S.ph == "hero") { aiHero(); if (S.ph == "hero" && !S.end) apply({ type: "endHero" }); }
    else if (S.ph == "resolve") apply({ type: "resolve" });
    else break;
    apply({ type: "settle" });
  }
  const winner = S.end ? (S.end.indexOf("용사 진영 승리") >= 0 ? "hero" : "boss") : "none";
  return { winner, round: S.round, hash: stateHash(S), log: { seed: REC.seed, actions: REC.actions.slice() } };
}
