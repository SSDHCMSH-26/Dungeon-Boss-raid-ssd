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
  // 맵: 목록(maps/index.json)에 적힌 맵 파일들
  raw.maps = {};
  for (const id of raw.mapIndex.maps || []) raw.maps[id] = JSON.parse(fs.readFileSync(path.join(GAME, V.mapPath(id)), "utf8"));
  return raw;
}

// 게임 로더와 같은 순서: 파일 검사 → 맵 검사 → ID 연결 검사
function check(raw) {
  const errs = [], D = {};
  for (const k in V.FILES) { errs.push(...V.dataFile(k, raw[k])); D[k] = V.body(raw[k]); }
  if (errs.length) return errs;
  D.maps = {};
  for (const id in raw.maps) {
    const f = V.mapPath(id), e = V.map(raw.maps[id], D, f);
    if (!e.length && raw.maps[id].id !== id) e.push(f + " › id: 파일 이름과 같은 \"" + id + "\" 이어야 해요");
    errs.push(...e);
    D.maps[id] = V.body(raw.maps[id]);
  }
  if (!errs.length) errs.push(...V.links(D));
  // 도구 전용: 코드(index.html)가 쓰는 글자 이름표가 text/ko.json 에 모두 있는지, 안 쓰는 이름표는 없는지
  if (!errs.length && D.text && D.text.text && !raw.__skipCode) {
    const html = fs.readFileSync(path.join(GAME, "index.html"), "utf8");
    const used = new Set([...html.matchAll(/\bT\("([^"]+)"\)/g)].map(m => m[1]).concat([...html.matchAll(/data-t="([^"]+)"/g)].map(m => m[1]), ["html.docTitle"]));
    used.forEach(k => { if (!(k in D.text.text)) errs.push('data/text/ko.json › text: 코드가 쓰는 "' + k + '" 가 없어요'); });
    Object.keys(D.text.text).forEach(k => { if (!used.has(k)) errs.push('data/text/ko.json › text.' + k + ": 코드에서 안 쓰는 이름표예요"); });
  }
  // 도구 전용: art.json 의 그림 파일이 실제로 있는지
  if (!errs.length && D.art && D.art.images) for (const k in D.art.images) {
    const v = D.art.images[k], list = typeof v === "string" ? [v] : Object.values(v);
    list.forEach(f => { if (!fs.existsSync(path.join(GAME, f))) errs.push("data/art.json › images." + k + ": 그림 파일이 없어요 (" + f + ")"); });
  }
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
  // 무작위로 망가뜨린 맵 수천 개: 검증기가 멈추거나(예외) 통과시키면 안 됨 (공유 맵은 아무 내용이나 올 수 있음)
  let seed = 7;
  const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
  const JUNK = [null, undefined, 0, -1, 1e9, 3.5, "", "x", "#", [], [1], {}, { x: 1 }, true, NaN];
  const mutate = o => {
    const paths = [];
    (function walk(v, p) { paths.push(p); if (v && typeof v === "object") for (const k of Object.keys(v)) walk(v[k], p.concat(k)); })(o, []);
    for (let n = 1 + rnd(3); n > 0; n--) {
      const p = paths[1 + rnd(paths.length - 1)];
      if (!p) continue;
      let t = o; for (const k of p.slice(0, -1)) { if (!t || typeof t !== "object") { t = null; break; } t = t[k]; }
      if (!t || typeof t !== "object") continue;
      const last = p[p.length - 1];
      const v = JUNK[rnd(JUNK.length)];
      if (rnd(4) === 0) delete t[last]; else t[last] = v === undefined ? undefined : clone(v);
    }
    return o;
  };
  const base = loadAll(), D = {};
  for (const k in V.FILES) D[k] = V.body(base[k]);
  let crash = 0, passed = 0;
  for (let i = 0; i < 3000; i++) {
    const id = i % 2 ? "vince_factory" : "gron_maze", m = mutate(clone(base.maps[id]));
    try { const e = V.map(m, D, id); if (!e.length && JSON.stringify(m) !== JSON.stringify(base.maps[id])) passed++; }
    catch (e) { if (crash++ < 3) console.log("FAIL 검증기 멈춤: " + e.stack.split("\n").slice(0, 3).join(" / ") + " ← " + JSON.stringify(m).slice(0, 120)); }
  }
  console.log((crash ? "FAIL" : "OK  ") + " 무작위로 망가뜨린 맵 3000개: 멈춤 " + crash + "번 (망가뜨렸는데도 통과 " + passed + "개 — 값이 우연히 유효한 경우)");
  if (crash) fail++;
  console.log(fail ? fail + "개 실패" : "검증기 자체 테스트 모두 통과 (" + (CASES.length + 2) + "개)");
  process.exit(fail ? 1 : 0);
} else {
  const e = check(loadAll());
  if (e.length) { console.log("데이터 오류 " + e.length + "개:"); e.forEach(x => console.log(" - " + x)); process.exit(1); }
  const raw = loadAll();
  console.log("데이터 검사 통과: " + Object.keys(V.FILES).map(k => V.FILES[k].path).concat(Object.keys(raw.maps).map(V.mapPath)).join(", "));
}
