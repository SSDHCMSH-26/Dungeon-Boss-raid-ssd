/* 규칙 계산(core) 경계 검사: game/src/core/*.js 가 화면·기기·시계·무작위에 손대지 않는지
   사용법: node tools/check_core.js        → 위반 목록 (있으면 실패)
   서버에서 같은 규칙 코드를 그대로 돌리려면 core 는 아래 것을 쓰면 안 됩니다. */
const fs = require("fs"), path = require("path");
const CORE = path.join(__dirname, "..", "game", "src", "core");
const BANNED = {
  "화면·브라우저": ["document", "window", "$", "alert", "localStorage", "Image", "requestAnimationFrame", "setTimeout", "setInterval", "cv", "cx", "W"],
  "그리기·화면 갱신": ["vpath", "vp", "VP", "hfx", "draw", "ui", "kick", "sync", "push", "T"],
  "기기 상태": ["L", "sel", "mine", "Z", "db", "uid"],
  "시계·무작위": ["Math.random", "Date.now", "performance"],
};
// 주석·문자열을 지운 코드에서 이름(식별자)을 찾음
function strip(js) {
  let o = "", i = 0;
  while (i < js.length) {
    const c = js[i], d = js[i + 1];
    if (c === "/" && d === "*") { const j = js.indexOf("*/", i + 2); o += " ".repeat((j < 0 ? js.length : j + 2) - i); i = j < 0 ? js.length : j + 2; continue; }
    if (c === "/" && d === "/") { const j = js.indexOf("\n", i); i = j < 0 ? js.length : j; continue; }
    if (c === '"' || c === "'" || c === "`") { let j = i + 1; while (j < js.length && js[j] !== c) { if (js[j] === "\\") j++; j++; } o += c + " ".repeat(Math.max(0, j - i - 1)) + c; i = j + 1; continue; }
    o += c; i++;
  }
  return o;
}
let total = 0;
// env.js 는 바깥 세상과 만나는 유일한 통로라 검사에서 뺌 (여기서만 시계·무작위를 연결)
const files = fs.readdirSync(CORE).filter(f => f.endsWith(".js") && f !== "env.js").sort();
for (const f of files) {
  const code = strip(fs.readFileSync(path.join(CORE, f), "utf8")), lines = code.split("\n");
  for (const [kind, names] of Object.entries(BANNED)) for (const n of names) {
    const re = n.includes(".") ? new RegExp(n.replace(".", "\\.") + "\\b", "g") : new RegExp("(^|[^.\\w$])" + n.replace("$", "\\$") + "(?![\\w$])(?!\\s*:)", "g");
    let hits = 0;
    lines.forEach(l => { const m = l.match(re); if (m) hits += m.length; });
    if (hits) { total += hits; console.log(`FAIL core/${f}: ${kind} "${n}" ${hits}곳`); }
  }
}
console.log(total ? `경계 위반 ${total}곳 (core 는 화면·기기·시계·무작위를 직접 쓰면 안 됨)` : `OK core ${files.length}개 파일: 화면·기기·시계·무작위 직접 사용 없음`);
process.exit(total ? 1 : 0);
