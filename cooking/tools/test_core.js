// 검사: node cooking/tools/test_core.js
const { load } = require('./load.js');
const { CK, D } = load();
let fail = 0;
function ok(c, m) { if (!c) { fail++; console.log('  ✗', m); } }
// 1. 데이터 연결
for (const id of D.recIds) {
  const r = D.rec[id];
  CK.ids(r.i).forEach(x => ok(D.ing[x], id + ': 없는 재료 ' + x));
  ok(D.tech[r.te], id + ': 없는 조리법 ' + r.te);
  ok(D.cuisines[r.cu] && D.courses[r.co], id + ': 문화권/코스');
  ok(r.src === 'start' || r.src === 'lab' || D.books[r.src], id + ': 출처 ' + r.src);
  ok(r.d, id + ': 설명 없음');
}
for (const e of Object.values(D.equip)) [].concat(e.tech || []).forEach(t => ok(D.tech[t], '설비 조리법 ' + t));
for (const t of Object.values(D.tech)) ok(!t.eq || D.equip[t.eq], '조리법 설비 ' + t.eq);
for (const p of D.pairs.concat(D.clash)) p.p.forEach(x => ok(x.startsWith('cat:') ? D.cats[x.slice(4)] : D.ing[x], '짝 재료 ' + x));
for (const [k, g] of Object.entries(D.ing)) { ok(g.t.length === 7, k + ' 맛 7개'); ok(D.cats[g.c], k + ' 분류'); }
// 2. 모든 레시피: 그 재료로 조리하면 그 레시피가 나와야 함 (다른 레시피에 가려지지 않음)
for (const id of D.recIds) {
  const S = CK.newGame(D, 1); S.money = 1e9; Object.keys(D.equip).forEach(e => S.equip[e] = 1); delete S.known[id];
  const r = CK.apply(D, S, { type: 'cook', te: D.rec[id].te, i: D.rec[id].i });
  ok(r.ok && r.res.id === id, id + ' 발견 불가 → ' + (r.res && r.res.id));
}
// 3. 완성도 범위
const qs = D.recIds.map(id => [CK.recipeProfile(D, id, 0).q, id]);
qs.forEach(([q, id]) => ok(q >= 55, id + ' 완성도 너무 낮음 ' + q));
// 4. 식단 평가 상식
const ev = (f, ids, s = 2) => CK.evalMenu(D, ids.map(i => CK.recipeProfile(D, i, s)), f, s).score;
const good = ev('course', ['bruschetta', 'caprese', 'minestrone', 'meuniere', 'lemon_sorbet', 'coq_au_vin', 'tiramisu']);
const bad = ev('course', ['tonkatsu', 'bulgogi', 'jeyuk', 'kimchi_jjigae']);
const bs = ev('bansang', ['ssalbap', 'doenjang_jjigae', 'geotjeori', 'sigeumchi_namul', 'godeungeo_jorim', 'hobak_jeon', 'musaengchae']);
const bb = ev('bansang', ['jeyuk', 'dakgalbi', 'tteokbokki']);
ok(good >= 85, '좋은 코스 ' + good); ok(bad <= 70, '나쁜 코스 ' + bad); ok(bs >= 80, '좋은 반상 ' + bs); ok(bb <= 50, '나쁜 반상 ' + bb);
ok(ev('course', ['yukhoe', 'bulgogi', 'pancake']) > ev('course', ['pancake', 'bulgogi', 'yukhoe']), '순서가 바뀌면 점수가 내려가야 함');
// 5. 날것 위험
const raw = CK.profile(D, { n: 'x', co: 'app', te: 'raw', i: ['chicken', 'salt'] }, 0);
ok(raw.q < 40 && raw.notes.some(n => n.t.includes('식중독')), '생닭 경고');
// 6. 결정론: 같은 씨앗·같은 행동 = 같은 결과
function play(seed) { const S = CK.newGame(D, seed); for (let i = 0; i < 20; i++) CK.apply(D, S, { type: 'runDay' }); return JSON.stringify(S); }
ok(play(5) === play(5), '결정론');
ok(play(5) !== play(6), '씨앗이 다르면 달라야 함');
// 7. 행동 검사
{ const S = CK.newGame(D, 3);
  ok(!CK.apply(D, S, { type: 'cook', te: 'deepfry', i: ['potato'] }).ok, '설비 없이 튀김 금지');
  ok(!CK.apply(D, S, { type: 'setMenu', format: 'course', items: ['r:vongole'] }).ok || S.menu.items.length === 0, '모르는 레시피는 메뉴에 못 넣음');
  ok(!CK.apply(D, S, { type: 'buyBook', id: 'fr2' }).ok, '평판 부족 책');
  const m0 = S.money; ok(CK.apply(D, S, { type: 'buyBook', id: 'it' }).ok && S.money === m0 - D.books.it.price && S.known.carbonara, '책 구매'); }
console.log(fail ? '실패 ' + fail : '모두 통과', '| 레시피', D.recIds.length, '재료', Object.keys(D.ing).length, '| 코스', good, bad, '반상', bs, bb);
process.exit(fail ? 1 : 0);
