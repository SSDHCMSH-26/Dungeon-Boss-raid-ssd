/* [화면] 맵 만들기 (개발자 모드) — 보스 테마를 고르고, 지형·시작 위치·유닛·숨김 함정을 칸에 놓아 맵 파일(pdr-map)을 만듦
   - 놓을 수 있는 것은 보스 테마마다 다름(champions.json 의 mapObjects) — 예) 그론 맵엔 로봇·공장 없음
   - 이 기기에 자동 저장(초안 목록), 되돌리기, 자동 검사(PDRValidate.map), 바로 해 보기, 내보내기/불러오기 코드
   - 미리보기는 실제 게임 화면 그대로: 초안으로 게임 상태를 만들어 draw() 로 그림(보스 시점이라 숨김 함정도 보임) */
const EDK = "pdr_editor", ED = { list: [], cur: null, tool: "pan", lv: 1, dir: 0, bdir: [0, 1], hero: 0, undo: [], redo: [], showErr: 0, view: "home", pickCh: null, code: "", painting: 0 };
const ED_DIRS8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]], ED_AR8 = ["↖", "↑", "↗", "←", "→", "↙", "↓", "↘"], ED_AR4 = ["→", "↓", "←", "↑"];
const ED_FLOOR = { spike: 1, belt: 1, pit: 1 }, ED_SZ = t => t == "pit" || t == "factory" ? 2 : 1;
function edLoad() { try { const d = JSON.parse(localStorage.getItem(EDK) || "null"); if (d && Array.isArray(d.list)) ED.list = d.list } catch (e) { } }
function edSave() { try { localStorage.setItem(EDK, JSON.stringify({ list: ED.list })) } catch (e) { } }
const edDraft = () => ED.list.find(d => d.id == ED.cur);
const edMap = () => { const d = edDraft(); return d && d.map };
/* 새 맵: 공식 맵 복사 또는 빈 맵(테두리만 벽), 시작 위치는 공식 맵 것 */
function edNew(ch, copy) {
  const off = DATA.maps[DATA.mapIndex.default[ch]], sp = JSON.parse(JSON.stringify(off.spawns));
  const tiles = copy && off.tiles ? off.tiles.slice() : Array.from({ length: N }, (_, y) => y == 0 || y == N - 1 ? "#".repeat(N) : "#" + ".".repeat(N - 2) + "#");
  const id = "my_" + Date.now().toString(36), m = { format: "pdr-map", version: 1, id, name: (CH[ch].n || ch) + " 새 맵", author: "dev", champion: ch, ruleset: RULE.id, size: { w: N, h: N }, tiles, spawns: sp, objects: copy ? JSON.parse(JSON.stringify(off.objects || [])) : [], settings: copy && off.settings ? JSON.parse(JSON.stringify(off.settings)) : {} };
  ED.list.unshift({ id, t: Date.now(), map: m }); ED.cur = id; ED.undo = []; ED.redo = []; ED.view = "edit"; ED.tool = "wall"; edSave(); edPreview(); ui();
}
function edOpen(id) { ED.cur = id; ED.undo = []; ED.redo = []; ED.view = "edit"; ED.tool = "pan"; edPreview(); ui() }
function edDel(id) { if (!confirm(T("ed.delAsk"))) return; ED.list = ED.list.filter(d => d.id != id); edSave(); ui() }
/* 바꾸기 전 상태를 되돌리기 목록에 넣음(문지르기는 한 번만) */
function edPush() { const m = edMap(); if (!m) return; ED.undo.push(JSON.stringify(m)); if (ED.undo.length > 100) ED.undo.shift(); ED.redo = [] }
function edUndo(r) { const d = edDraft(); if (!d) return; const from = r ? ED.redo : ED.undo, to = r ? ED.undo : ED.redo; if (!from.length) return; to.push(JSON.stringify(d.map)); d.map = JSON.parse(from.pop()); edChanged() }
function edChanged() { const d = edDraft(); if (d) d.t = Date.now(); edSave(); edPreview(); ui() }
const edErrs = () => { const m = edMap(); try { return m ? PDRValidate.map(m, DATA, m.name) : [] } catch (e) { return [String(e)] } };
/* 미리보기 상태: 초안으로 게임을 시작한 모습(무작위 상자·크리스탈은 뺌) */
function edPreview() {
  const m = edMap(); if (!m) return;
  try { S = newS(); S.cmap = JSON.parse(JSON.stringify(m)); chooseChamp(m.champion); S.pick = ["knight", "cleric", "archer"]; startGame(); S.cry = []; S.chests = (S.chests || []).filter(c => !c.nw); S.ph = "boss"; S.log = "" } catch (e) { console.error(e) }
}
/* 칸 편집 */
const edTile = (m, x, y) => m.tiles[y][x];
function edSetTile(m, x, y, c) { const r = m.tiles[y]; m.tiles[y] = r.slice(0, x) + c + r.slice(x + 1) }
const edCells = o => { const n = ED_SZ(o.type), a = []; for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) a.push([o.x + dx, o.y + dy]); return a };
const edHit = (o, x, y) => edCells(o).some(c => c[0] == x && c[1] == y);
function edApply(x, y, first) {
  const m = edMap(); if (!m || x < 0 || y < 0 || x >= N || y >= N) return 0; const t = ED.tool;
  if (t == "pan") return 0;
  if (t == "wall" || t == "floor") { const c = t == "wall" ? "#" : "."; if (edTile(m, x, y) == c) return 0; if (first) edPush(); edSetTile(m, x, y, c); if (c == "#") m.objects = m.objects.filter(o => !edHit(o, x, y)); return 1 }
  if (t == "erase") { const n = m.objects.length; if (!m.objects.some(o => edHit(o, x, y))) return 0; if (first) edPush(); m.objects = m.objects.filter(o => !edHit(o, x, y)); return n != m.objects.length }
  if (!first) return 0;
  if (t == "boss" || t == "gen") { edPush(); m.spawns[t == "boss" ? "boss" : "generator"] = { x, y }; return 1 }
  if (t == "hero") { edPush(); m.spawns.heroes[ED.hero] = { x, y }; ED.hero = (ED.hero + 1) % 3; return 1 }
  // 배치물: 같은 칸에 같은 종류가 있으면 지움(토글), 아니면 같은 층의 겹치는 것을 치우고 놓음
  const same = m.objects.find(o => o.type == t && edHit(o, x, y)); edPush();
  if (same) { m.objects = m.objects.filter(o => o !== same); return 1 }
  const o = { type: t, x, y }; if (t == "robot" || t == "factory") o.lv = ED.lv; if (t == "bomb") { o.dx = ED.bdir[0]; o.dy = ED.bdir[1] } if (t == "belt") o.d = ED.dir;
  const fl = !!ED_FLOOR[t], cs = edCells(o);
  m.objects = m.objects.filter(p => !(cs.some(c => edHit(p, c[0], c[1])) && (!!ED_FLOOR[p.type] == fl || p.type == "pit" || t == "pit")));
  m.objects.push(o); return 1;
}
/* 맵 칸 터치·문지르기 (지형·지우개는 문질러 여러 칸) */
let edLast = null;
function edCell(e) { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / Z), Math.floor((e.clientY - r.top) / Z)] }
cv.addEventListener("pointerdown", e => { if (L.scr != "editor" || ED.view != "edit" || ED.tool == "pan") return; e.preventDefault(); const [x, y] = edCell(e); ED.painting = 1; edLast = x + "," + y; if (edApply(x, y, 1)) edChanged(); try { cv.setPointerCapture(e.pointerId) } catch (x_) { } });
cv.addEventListener("pointermove", e => { if (!ED.painting || L.scr != "editor") return; const [x, y] = edCell(e), k = x + "," + y; if (k == edLast) return; edLast = k; if ((ED.tool == "wall" || ED.tool == "floor" || ED.tool == "erase") && edApply(x, y, 0)) edChanged() });
const edStop = () => { ED.painting = 0; edLast = null }; cv.addEventListener("pointerup", edStop); cv.addEventListener("pointercancel", edStop);
/* 그림 위 편집 표시: 칸 줄, 용사 시작 번호 */
const draw0 = draw;
draw = function () { draw0(); if (L.scr == "editor" && ED.view == "edit") edOverlay() };
function edOverlay() {
  const m = edMap(); if (!m) return; cx.save(); cx.strokeStyle = "rgba(255,255,255,.08)"; cx.lineWidth = 1;
  for (let i = 0; i <= N; i++) { cx.beginPath(); cx.moveTo(i * Z + .5, 0); cx.lineTo(i * Z + .5, N * Z); cx.stroke(); cx.beginPath(); cx.moveTo(0, i * Z + .5); cx.lineTo(N * Z, i * Z + .5); cx.stroke() }
  m.spawns.heroes.forEach((h, i) => { cx.strokeStyle = "#7cf"; cx.lineWidth = 2; cx.strokeRect(h.x * Z + 1, h.y * Z + 1, Z - 2, Z - 2); txt(String(i + 1), h.x * Z + 2, h.y * Z + 1, "#7cf") });
  m.objects.forEach(o => { if (o.type == "robot") txt("Lv" + (o.lv || 1), o.x * Z + 1, o.y * Z + Z * .55, "#ffd34d"); if (o.type == "spike") { cx.strokeStyle = "#f66"; cx.setLineDash([3, 2]); cx.strokeRect(o.x * Z + 2, o.y * Z + 2, Z - 4, Z - 4); cx.setLineDash([]); txt("▲", o.x * Z + Z / 2, o.y * Z + Z * .2, "#f88", "center") } });
  cx.restore();
}
/* 도구 상자: 공통(지형·시작 위치) + 보스 테마의 배치물 */
function edTools(ch) {
  const allow = CH[ch].mapObjects || [], has = t => allow.indexOf(t) >= 0, G = [];
  G.push([T("ed.g.ground"), ["pan", "wall", "floor", "erase"]]);
  G.push([T("ed.g.start"), ["boss"].concat(CH[ch].gen ? ["gen"] : [], ["hero"])]);
  const unit = ["robot", "factory", "mimic", "goblin"].filter(has), hid = ["spike", "pit", "trapChest", "bomb"].filter(has), item = ["chest", "belt"].filter(has);
  if (unit.length) G.push([T("ed.g.unit"), unit]); if (hid.length) G.push([T("ed.g.hidden"), hid]); if (item.length) G.push([T("ed.g.item"), item]);
  return G;
}
const ED_TN = () => ({ pan: T("ed.t.pan"), wall: T("ed.t.wall"), floor: T("ed.t.floor"), erase: T("ed.t.erase"), boss: T("ed.t.boss"), gen: T("ed.t.gen"), hero: T("ed.t.hero"), chest: T("ed.t.chest"), trapChest: T("ed.t.trapChest"), pit: T("ed.t.pit"), spike: T("ed.t.spike"), mimic: T("ed.t.mimic"), goblin: T("ed.t.goblin"), robot: T("ed.t.robot"), factory: T("ed.t.factory"), bomb: T("ed.t.bomb"), belt: T("ed.t.belt") });
function edPick(t) { ED.tool = t; ui() }
/* 화면 */
function edUI() {
  const st = $("st"), pn = $("pn"); ["am", "qk", "cf", "ip", "un"].forEach(i => { const e = $(i); if (e) { e.style.display = "none"; e.innerHTML = "" } });
  $("lg").textContent = ""; $("mw").style.display = ED.view == "edit" ? "" : "none"; $("tb").style.display = ED.view == "edit" ? "" : "none";
  if (ED.view != "edit") { st.textContent = T("ed.title"); pn.innerHTML = edHome(); return }
  const m = edMap(); if (!m) { ED.view = "home"; return edUI() }
  const er = edErrs(); st.innerHTML = "🛠 " + CH[m.champion].n + " · " + m.name + " · " + (er.length ? '<a href="#" onclick="ED.showErr=!ED.showErr;ui();return false" style="color:#ffb347">' + T("ed.bad").replace("{n}", er.length) + "</a>" : T("ed.ok"));
  if (!L.fit) fitMap();
  cv.style.touchAction = ED.tool == "pan" ? "" : "none"; draw();
  let p = (ED.showErr && er.length ? '<div class="ht" style="color:#ffb347">' + er.map(e => "• " + e).join("<br>") + "</div>" : "");
  p += '<div class="r">' + BT(T("ed.undo"), "edUndo(0)", "s", !ED.undo.length) + BT(T("ed.redo"), "edUndo(1)", "s", !ED.redo.length) + BT(T("ed.play"), "edPlayMenu()", "go s", !!er.length) + BT(T("ed.export"), "edExport()", "s") + BT(T("ed.back"), "edHomeGo()", "s") + "</div>";
  if (ED.playMenu) p += '<div class="r">' + (er.length ? '<p>' + T("ed.playFix") + "</p>" : BT(T("ed.playHero"), "edPlay('hero')", "go") + BT(T("ed.playBoss"), "edPlay('boss')", "go") + BT(T("ed.playLocal"), "edPlay('local')", "go")) + "</div>";
  if (ED.code) p += '<p>' + T("ed.exportHint") + '</p><textarea id="edc" readonly style="width:100%;height:70px;font-size:11px;background:var(--pn);color:var(--fg);border:3px solid var(--ln)">' + ED.code + '</textarea><div class="r">' + BT(T("ed.copy"), "edCopy()", "s") + "</div>";
  let tl = '';
  edTools(m.champion).forEach(([g, ts]) => { tl += '<div class="ht">' + g + '</div><div class="r" style="margin:3px 0">' + ts.map(t => BT(ED_TN()[t] + (t == "hero" ? " " + (ED.hero + 1) : ""), "edPick('" + t + "')", "s" + (ED.tool == t ? " on" : ""))).join("") + "</div>" });
  if (ED.tool == "robot" || ED.tool == "factory") tl += '<div class="r">' + T("ed.lv") + " " + [1, 2, 3].map(v => BT("Lv" + v, "ED.lv=" + v + ";ui()", "s" + (ED.lv == v ? " on" : ""))).join("") + "</div>";
  if (ED.tool == "bomb") tl += '<div class="r">' + T("ed.dir") + " " + ED_DIRS8.map((d, i) => BT(ED_AR8[i], "ED.bdir=[" + d + "];ui()", "s" + (ED.bdir[0] == d[0] && ED.bdir[1] == d[1] ? " on" : ""))).join("") + "</div>";
  if (ED.tool == "belt") tl += '<div class="r">' + T("ed.dir") + " " + ED_AR4.map((a, i) => BT(a, "ED.dir=" + i + ";ui()", "s" + (ED.dir == i ? " on" : ""))).join("") + "</div>";
  if (ED.tool != "pan") tl += '<p>' + T("ed.tapHint") + "</p>";
  p += '<div class="r"><input id="edn" value="' + m.name.replace(/"/g, "&quot;") + '" maxlength="40" style="text-transform:none" onchange="edRename(this.value)" placeholder="' + T("ed.name") + '"></div>';
  p += '<label style="font-size:13px"><input type="checkbox" style="flex:none;min-width:0" ' + (!m.settings || m.settings.chestSpawn !== false ? "checked" : "") + ' onchange="edChest(this.checked)"> ' + T("ed.chest") + "</label>";
  pn.innerHTML = p; const qk = $("qk"); qk.innerHTML = tl; qk.style.display = "block";
}
function edHome() {
  edLoad(); let p = '<p>' + T("ed.pickTheme") + '</p><div class="r">' + Object.keys(CH).filter(k => CH[k].ok).map(k => BT(img(k, 24) + " " + CH[k].n, "ED.pickCh='" + k + "';ui()", ED.pickCh == k ? "on" : "")).join("") + "</div>";
  if (ED.pickCh) p += '<div class="r">' + BT(T("ed.new") + " · " + T("ed.blank"), "edNew('" + ED.pickCh + "',0)", "go") + BT(T("ed.fromOfficial"), "edNew('" + ED.pickCh + "',1)") + "</div>";
  p += '<p>' + T("ed.drafts") + "</p>" + (ED.list.length ? ED.list.map(d => '<div class="r" style="margin:3px 0">' + BT(img(d.map.champion, 18) + " " + d.map.name + "<br><small>" + new Date(d.t).toLocaleString() + "</small>", "edOpen('" + d.id + "')", "s") + BT(T("ed.del"), "edDel('" + d.id + "')", "s", 0) + "</div>").join("") : "<p>" + T("ed.noDrafts") + "</p>");
  p += '<p>' + T("ed.import") + " — " + T("ed.importHint") + '</p><textarea id="edi" style="width:100%;height:60px;font-size:11px;background:var(--pn);color:var(--fg);border:3px solid var(--ln)"></textarea><div class="r">' + BT(T("ed.import"), "edImport()", "s") + BT(T("ed.back"), "L.scr='menu';L.mode=L.mode0||'solo';ui()", "s") + "</div>";
  return p;
}
function edHomeGo() { ED.view = "home"; ED.code = ""; ED.playMenu = 0; ui() }
function edPlayMenu() { ED.playMenu = !ED.playMenu; ED.code = ""; ui() }
function edRename(v) { const m = edMap(); if (!m) return; edPush(); m.name = (v || "").trim().slice(0, 40) || m.name; edChanged() }
function edChest(on) { const m = edMap(); if (!m) return; edPush(); m.settings = m.settings || {}; if (on) delete m.settings.chestSpawn; else m.settings.chestSpawn = false; edChanged() }
/* 내보내기·불러오기: "PDRMAP1:" + base64(JSON) */
function edExport() { const m = edMap(); if (!m) return; ED.playMenu = 0; ED.code = "PDRMAP1:" + btoa(unescape(encodeURIComponent(JSON.stringify(m)))); ui() }
function edCopy() { const t = $("edc"); if (!t) return; t.select(); try { navigator.clipboard.writeText(t.value).then(() => alert(T("ed.copied")), () => { document.execCommand("copy"); alert(T("ed.copied")) }) } catch (e) { document.execCommand("copy"); alert(T("ed.copied")) } }
function edImport() {
  const s = (($("edi") || {}).value || "").trim(); let m = null;
  try { const b = s.startsWith("PDRMAP1:") ? s.slice(8) : s; m = JSON.parse(decodeURIComponent(escape(atob(b.replace(/\s+/g, ""))))) } catch (e) { try { m = JSON.parse(s) } catch (e2) { } }
  if (!m || m.format != "pdr-map" || !CH[m.champion] || !Array.isArray(m.tiles)) return alert(T("ed.importBad"));
  m.id = "my_" + Date.now().toString(36); m.objects = m.objects || []; m.settings = m.settings || {};
  ED.list.unshift({ id: m.id, t: Date.now(), map: m }); edSave(); edOpen(m.id);
}
/* 바로 해 보기: 초안 맵으로 새 판(혼자 하기·한 기기). 판 화면에 "맵 만들기로 돌아가기" 버튼 */
function edPlay(role) {
  const m = edMap(); if (!m || edErrs().length) return;
  L.mode = role == "local" ? "local" : "solo"; if (role != "local") L.role = role; L.edTest = 1; L.fit = 0; ED.playMenu = 0;
  startSolo(); S.cmap = JSON.parse(JSON.stringify(m)); chooseChamp(m.champion); sync();
}
function edBackFromPlay() { L.edTest = 0; L.scr = "editor"; ED.view = "edit"; L.fit = 0; L.mode = "local"; edPreview(); ui() }
function edGo() { L.mode0 = L.mode; L.mode = "local"; L.scr = "editor"; ED.view = "home"; ED.code = ""; ED.playMenu = 0; L.fit = 0; ui() }
function edMenuHTML() { return '<p>' + T("ed.menuSub") + '</p>' + BT(T("ed.menu"), "edGo()", "") }
