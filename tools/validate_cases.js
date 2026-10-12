/* validate_data.js --selftest 가 쓰는 "일부러 틀린 데이터" 목록
   [설명, 데이터 망가뜨리기(raw 는 파일 이름표 → 파일 내용), 오류 문장에 들어 있어야 할 글자] */
module.exports = [
  ["format 이 틀림", r => { r.heroes.format = "pdr-hero"; }, "pdr-heroes"],
  ["version 이 게임보다 새 버전", r => { r.monsters.version = 99; }, "version 1 까지만"],
  ["version 이 정수가 아님", r => { r.skills.version = "1"; }, "version: 정수"],
  ["용사 체력이 0", r => { r.heroes.knight.hp = 0; }, "knight.hp"],
  ["용사 체력이 글자", r => { r.heroes.mage.hp = "50"; }, "mage.hp"],
  ["용사 이름 없음", r => { delete r.heroes.archer.n; }, "archer.n"],
  ["스킬 비용이 음수", r => { r.skills.heroes.knight[0].c = -1; }, "knight[0].c"],
  ["스킬 목록이 배열이 아님", r => { r.skills.heroes.cleric = {}; }, "heroes.cleric"],
  ["보스 설치 스킬 id 없음", r => { delete r.skills.champions.gron.ex[0].id; }, "gron.ex[0].id"],
  ["스킬이 없는 용사 (ID 연결)", r => { r.heroes.rogue = { n: "도적", hp: 40, mv: 3 }; }, '"rogue" 의 스킬이 없어요'],
  ["없는 용사의 스킬 (ID 연결)", r => { r.skills.heroes.rogue = []; }, '"rogue" 는 heroes.json 에 없는'],
  ["확률이 1 초과", r => { r.monsters.trapChest.mimicChance = 1.5; }, "mimicChance"],
  ["강탈 확률 합이 1 초과", r => { r.monsters.gob.goldChance = 0.9; }, "goldChance + itemChance"],
  ["금화 범위 뒤집힘", r => { r.monsters.gob.goldMin = 9; }, "goldMin 이 goldMax"],
];
