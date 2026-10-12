/* 화면 없이(Node.js) 규칙 엔진 돌리기 — 나중 서버의 시제품
   game/src/core/*.js(규칙)만 불러옵니다. 화면·브라우저 코드는 하나도 안 씀.

   사용법:
     node tools/headless.js sim [판 수=200] [시작 씨앗=1]   컴퓨터끼리 대전(챔피언·용사 조합 돌아가며) → 승률
     node tools/headless.js match <씨앗> <챔피언> <용사1,용사2,용사3>   한 판 → 결과·지문(JSON)
     node tools/headless.js selftest                        엔진 자체 테스트(같은 씨앗=같은 결과, 리플레이, 정보 숨김)
   다른 도구에서: const { createEngine } = require("./headless.js"); const E = createEngine(); E.run("simMatch({...})") */
const fs = require("fs"), path = require("path"), vm = require("vm");
const GAME = path.join(__dirname, "..", "game");
const V = require(path.join(GAME, "lib", "validate.js"));

// 데이터: 게임 로더와 같은 순서·같은 검사 (파일 → 맵 → ID 연결)
function loadData() {
  const D = {}, errs = [];
  for (const k in V.FILES) { const j = JSON.parse(fs.readFileSync(path.join(GAME, V.FILES[k].path), "utf8")); errs.push(...V.dataFile(k, j)); D[k] = V.body(j); }
  if (!errs.length) {
    D.maps = {};
    for (const id of D.mapIndex.maps) { const f = V.mapPath(id), t = fs.readFileSync(path.join(GAME, f), "utf8"), e = V.mapText(t, D, f); errs.push(...e); if (!e.length) D.maps[id] = V.body(JSON.parse(t)); }
  }
  if (!errs.length) errs.push(...V.links(D));
  if (errs.length) throw new Error("데이터 오류:\n" + errs.join("\n"));
  return D;
}
// 규칙 파일 목록: index.html 의 실행 순서에서 src/core/ 만
function coreFiles() {
  const html = fs.readFileSync(path.join(GAME, "index.html"), "utf8");
  const m = html.match(/const SRC=(\[[^\]]*\])/);
  return JSON.parse(m[1]).filter(f => f.startsWith("src/core/"));
}
// 엔진 하나 = 독립된 실행 공간 하나 (서버에선 방마다 하나씩)
function createEngine(opts = {}) {
  const ctx = vm.createContext({ console, DATA: loadData(), PDRValidate: V });
  for (const f of coreFiles()) vm.runInContext(fs.readFileSync(path.join(GAME, f), "utf8"), ctx, { filename: f });
  if (opts.clock) vm.runInContext("NOW=" + opts.clock, ctx);
  return {
    files: coreFiles(),
    run: code => vm.runInContext(code, ctx),
    call: (fn, ...args) => vm.runInContext(fn + "(" + args.map(a => JSON.stringify(a)).join(",") + ")", ctx),
  };
}
// 대전 조합: 챔피언 2 × 용사 조합 4 를 돌아가며
const PICKS = [["knight", "cleric", "archer"], ["knight", "archer", "mage"], ["cleric", "archer", "mage"], ["knight", "cleric", "mage"]];
const matchOf = i => ({ seed: i, champ: i % 2 ? "vince" : "gron", pick: PICKS[(i >> 1) % 4] });

function selftest() {
  let fail = 0;
  const ok = (c, m) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) fail++; };
  const E = createEngine({ clock: "()=>0" });
  ok(E.files.length >= 5, "규칙 파일 " + E.files.length + "개를 화면 없이 불러옴: " + E.files.map(f => path.basename(f)).join(", "));
  const a = E.call("simMatch", { seed: 42, champ: "gron", pick: PICKS[0] }), b = E.call("simMatch", { seed: 42, champ: "gron", pick: PICKS[0] });
  ok(a.hash === b.hash && a.round === b.round, "같은 씨앗 → 같은 결과 (지문 " + a.hash + ", " + a.round + "라운드, " + a.winner + ")");
  const c = E.call("simMatch", { seed: 43, champ: "gron", pick: PICKS[0] });
  ok(c.hash !== a.hash, "다른 씨앗 → 다른 판 (" + c.hash + ")");
  // 리플레이: 다른 엔진(=다른 서버)에서 씨앗+행동 목록만으로 다시 두기
  for (const o of [matchOf(7), matchOf(8)]) {
    const m = E.call("simMatch", o), E2 = createEngine({ clock: "()=>123456" });
    E2.call("replay", m.log);
    const h = E2.run("stateHash(S)");
    ok(h === m.hash, `리플레이(${o.champ}): 행동 ${m.log.actions.length}개를 새 엔진에서 다시 둬도 같은 지문 ${h}`);
  }
  // 정보 숨김 view()
  E.run(`S=newS();apply({type:"pickChamp",id:"gron"});apply({type:"setPick",ids:["knight","cleric","archer"]});apply({type:"start"});
    S.sec.traps=[[5,5]];S.sec.bombs=[{id:1,x:6,y:6,dx:1,dy:0}];mirrorSec();S.pits=[{x:9,y:9},{x:12,y:9,rv:1}];
    S.chests=[{id:1,x:3,y:3,k:"x"},{id:2,x:4,y:4,k:"x",rv:1},{id:3,x:2,y:2,k:"t"}];S.atks=[{i:0,p:[[5,5]]},{i:0,p:[[7,7]],echo:1}]`);
  const hv = E.run("view(S,'hero')"), bv = E.run("view(S,'boss')");
  ok(!hv.sec && !hv.tp && !hv.bp && !hv.used, "용사 보기: 보스 비밀·복사본 없음");
  ok(hv.pits.length === 1 && hv.pits[0].rv, "용사 보기: 공개 안 된 구덩이 숨김");
  ok(hv.chests.map(c => c.k).join() === "t,x,t", "용사 보기: 공개 안 된 함정 상자는 보물상자로 보임");
  ok(hv.atks.length === 1, "용사 보기: 메아리 예고 숨김");
  ok(bv.sec && bv.sec.traps.length === 1 && bv.pits.length === 2, "보스 보기: 전부 보임");
  E.run("S.scan={r:S.round}");
  ok(E.run("!!view(S,'hero').tp"), "천상의 계시로 공개된 턴에는 용사도 tp 를 봄");
  ok(E.run("JSON.stringify(view(S,'hero'))").indexOf('"sec"') < 0, "용사 보기 JSON 에 sec 글자 자체가 없음");
  console.log(fail ? fail + "개 실패" : "엔진 자체 테스트 모두 통과");
  return fail;
}

if (require.main === module) {
  const [cmd, ...a] = process.argv.slice(2);
  if (cmd === "match") {
    const E = createEngine({ clock: "()=>0" });
    const r = E.call("simMatch", { seed: +a[0], champ: a[1], pick: a[2].split(",") });
    console.log(JSON.stringify({ winner: r.winner, round: r.round, hash: r.hash, actions: r.log.actions.length }));
  } else if (cmd === "sim") {
    const n = +(a[0] || 200), s0 = +(a[1] || 1), E = createEngine({ clock: "()=>0" }), st = {};
    const t0 = Date.now();
    for (let i = 0; i < n; i++) { const o = matchOf(s0 + i), r = E.call("simMatch", o); const k = o.champ; st[k] = st[k] || { n: 0, hero: 0, boss: 0, none: 0, rounds: 0 }; st[k].n++; st[k][r.winner]++; st[k].rounds += r.round; }
    for (const k in st) console.log(`${k}: ${st[k].n}판 · 용사 승 ${st[k].hero} (${(st[k].hero / st[k].n * 100).toFixed(1)}%) / 보스 승 ${st[k].boss} / 무승부 ${st[k].none} · 평균 ${(st[k].rounds / st[k].n).toFixed(1)}라운드`);
    console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}초)`);
  } else if (cmd === "selftest") process.exit(selftest() ? 1 : 0);
  else console.log("사용법: node tools/headless.js sim [판 수] [시작 씨앗] | match <씨앗> <챔피언> <용사들> | selftest");
}
module.exports = { createEngine, loadData, matchOf, PICKS };
