/* [규칙] 진영별로 보여 줄 게임 상태 만들기 (전장의 안개 / fog of war)
   서버 대전에서는 서버가 전체 상태 S 로 판정하고, 각 기기에는 view(S, 진영) 결과만 보냅니다.
   → 상대 기기에서 개발자 도구로 숨긴 함정을 훔쳐볼 수 없게 됨.
   용사 진영에게 숨기는 것: 보스 비밀(S.sec: 가시 함정·폭탄로봇), 그 복사본(tp/bp, 계시로 공개된 턴 제외),
   공개 안 된 구덩이, 함정 상자 여부(공개 전엔 보물상자로 보임), 구덩이 메아리 공격 예고,
   아직 용사 턴이 안 온 새 상자(nw: 보스 턴에 둔 함정 상자가 들통나지 않게),
   숨김 스킬(함정·폭탄·구덩이·함정 상자)의 흔적: 비밀 글, 그 스킬에 쓴 AP, 보스 쿨타임 */
function view(st, side) {
  const v = JSON.parse(JSON.stringify(st));
  if (side === "boss") return v; // 보스 진영은 전부 봄 (용사 쪽 비밀 정보는 없음)
  const scanned = !!(v.scan && v.scan.r === v.round);
  delete v.sec;
  delete v.used;
  if (!scanned) { delete v.tp; delete v.bp; v.atks = (v.atks || []).filter(a => !a.echo); }
  v.pits = (v.pits || []).filter(p => p.rv);
  // 새 상자(nw)는 용사 턴이 시작될 때까지 안 보임, 함정 상자는 보통 상자로 보임
  v.chests = (v.chests || []).filter(c => !c.nw).map(c => c.k === "x" && !c.rv ? Object.assign({}, c, { k: "t" }) : c);
  // 숨김 스킬 흔적 지우기: 비밀 글(🔒) → 직전 공개 글, 숨김 스킬에 쓴 AP 는 되돌려 보임, 보스 쿨타임 안 보임
  if ((v.log || "").startsWith("🔒")) v.log = v.plog || "";
  delete v.plog;
  if (v.boss && st.sec && st.sec.hap) v.boss.ap += st.sec.hap;
  delete v.cd;
  return v;
}
