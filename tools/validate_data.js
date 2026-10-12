/* 데이터 파일 검사 도구 (게임과 같은 검증기 game/lib/validate.js 사용)
   사용법:
     node tools/validate_data.js            → game/data 의 모든 파일 검사
     node tools/validate_data.js --selftest → 일부러 틀린 데이터를 넣어 검증기가 잡는지 확인 */
const fs = require("fs"), path = require("path");
const GAME = path.join(__dirname, "..", "game");
const V = require(path.join(GAME, "lib", "validate.js"));

function loadAll() {
  const raw = {};
  for (const k in V.FILES) raw[k] = JSON.parse(fs.readFileSync(path.join(GAME, V.FILES[k].path), "utf8"));
  return raw;
}

function check(raw) {
  const errs = [], D = {};
  for (const k in raw) { errs.push(...V.dataFile(k, raw[k])); D[k] = V.body(raw[k]); }
  if (!errs.length) errs.push(...V.links(D));
  return errs;
}

if (process.argv.includes("--selftest")) {
  const clone = o => JSON.parse(JSON.stringify(o));
  let fail = 0;
  // [설명, 데이터를 망가뜨리는 함수, 오류 문장에 들어 있어야 할 글자]
  const CASES = require(path.join(__dirname, "validate_cases.js"));
  const ok = check(loadAll());
  console.log((ok.length ? "FAIL" : "OK  ") + " 정상 데이터는 통과" + (ok.length ? " → " + ok.join(" | ") : ""));
  if (ok.length) fail++;
  for (const [name, breakIt, expect] of CASES) {
    const raw = clone(loadAll());
    breakIt(raw);
    const e = check(raw), hit = e.some(x => x.includes(expect));
    console.log((hit ? "OK  " : "FAIL") + " " + name + " → " + (e[0] || "(오류 없음)"));
    if (!hit) fail++;
  }
  console.log(fail ? fail + "개 실패" : "검증기 자체 테스트 모두 통과 (" + (CASES.length + 1) + "개)");
  process.exit(fail ? 1 : 0);
} else {
  const e = check(loadAll());
  if (e.length) { console.log("데이터 오류 " + e.length + "개:"); e.forEach(x => console.log(" - " + x)); process.exit(1); }
  console.log("데이터 검사 통과: " + Object.keys(V.FILES).map(k => V.FILES[k].path).join(", "));
}
