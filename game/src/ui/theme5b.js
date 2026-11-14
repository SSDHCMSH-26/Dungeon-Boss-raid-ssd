/* [화면] 테마 5 — 브론즈 던전 (사용자 그림 3장, game/art/t5/) + 꽉 찬 맵
   - 가로 화면: 맵이 화면 전체를 덮고(칸을 크게, 끌어서 이동), UI 는 그 위에 떠 있음 (body.fs)
     왼쪽 = 로고·보스/용사 카드·간파·기록·도구 / 위 가운데 = 상황 배너 / 오른쪽 = 전체 지도·탭·상세 창·턴 종료
   - 맵 그림(그론만): 바닥 판석(가끔 이끼·금), 벽 = 밝은 돌 윗면 + 아래가 바닥이면 벽돌 앞면(가끔 횃불·깃발·창살),
     구덩이 = 돌 우물, 가시 함정, 밟힌 함정 = 피 묻은 가시, 폭탄 = 쇠공, 바닥 장식(해골·거미줄·돌·풀 — 보기만)
   - 빈센토 맵 그림은 그대로, UI 는 이 테마를 씀. 유닛(보스·용사) 그림·상자는 바꾸지 않음
   그림 목록은 data/art.json 의 images.T5 */
const t5Bz = () => L.design == "t5";
const T5P = k => (IMG.T5 && IMG.T5[k]) || null;
const T5MAP = { t_spear: "spike", t_flame: "spike_blood", pit2: "pit", t6bomb: "bomb" };
function t5Art(k) { return t5Bz() && S && S.champ == "gron" && T5MAP[k] ? T5P(T5MAP[k]) : null; }
const T5ICON = { wall: "face", trap: "spike", dig: "w_pick", pit: "pit", hop: "rune" };
function t5Icon(id) { return t5Bz() && S && S.champ == "gron" && T5ICON[id] ? T5P(T5ICON[id]) : null; }
const T5I = {};
function t5Img(k) { let i = T5I[k]; if (!i) { i = T5I[k] = new Image(); i.onload = () => { if (L.scr == "game") draw(); }; i.src = T5P(k); } return i.complete && i.naturalWidth ? i : null; }
// 바닥·벽 타일 (그론만, 그림을 다 받은 뒤부터)
function t5Tiles() {
  if (!t5Bz() || !S || S.champ != "gron") return null;
  const ks = ["floor_a", "floor_b", "floor_c", "floor_m", "cap", "face", "face_torch", "face_banner", "face_grate"], im = ks.map(t5Img);
  if (im.some(x => !x)) return null;
  if (!T5I._t) {
    const sq = (i, col) => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); g.imageSmoothingEnabled = true; g.drawImage(i, 0, 0, 64, 64); if (col) { g.globalCompositeOperation = "multiply"; g.fillStyle = col; g.fillRect(0, 0, 64, 64); } return c; };
    T5I._t = { f: [sq(im[0], "#c8c0c8"), sq(im[1], "#c0b8c0"), sq(im[2], "#c8c0c8"), sq(im[3], "#c8c0c8")], w: sq(im[4]), w2: sq(im[4]), face: [im[5], im[6], im[7], im[8]], bz: 1 };
  }
  return T5I._t;
}
// 벽 칸 위에 덧그리기: 아래가 바닥이면 앞면(벽돌, 가끔 횃불·깃발·창살) + 횃불 불빛 / 바닥 칸엔 가끔 장식
const T5D = ["d_skull", "d_web", "d_rock", "d_plant"];
function t5Cell(T, x, y) {
  const X = x * Z, Y = y * Z, h = (x * 73 + y * 179 + x * y * 7) % 97;
  if (S.map && sw(x, y)) {
    if (y < N - 1 && !sw(x, y + 1)) {
      const v = h % 13 == 0 ? 1 : h % 17 == 0 ? 2 : h % 23 == 0 ? 3 : 0, f = T.face[v], fy = Y + Z * .52;
      cx.imageSmoothingEnabled = true; cx.drawImage(f, X, fy, Z, Z * .48); cx.imageSmoothingEnabled = false;
      cx.fillStyle = "rgba(0,0,0,.25)"; cx.fillRect(X, fy, Z, Math.max(1, Z * .05));
      if (v == 1) { const g = cx.createRadialGradient(X + Z / 2, Y + Z * 1.1, 1, X + Z / 2, Y + Z * 1.1, Z * 1.6); g.addColorStop(0, "rgba(255,170,70,.28)"); g.addColorStop(1, "rgba(255,170,70,0)"); cx.save(); cx.globalCompositeOperation = "lighter"; cx.fillStyle = g; cx.fillRect(X - Z * 1.2, Y, Z * 3.4, Z * 2.8); cx.restore(); }
    }
    return;
  }
  if (y > 0 && S.map && sw(x, y - 1)) { cx.fillStyle = "rgba(0,0,0,.42)"; cx.fillRect(X, Y, Z, Z * .28); }
  if (h == 5 || h == 41 || h == 77) { const i = t5Img(T5D[(x + y) % 4]); if (i) { const s = Z * .62, r = i.naturalWidth / i.naturalHeight; cx.globalAlpha = .9; cx.imageSmoothingEnabled = true; cx.drawImage(i, X + (Z - s * Math.min(1, r)) / 2, Y + Z - s / Math.max(1, r) - Z * .08, s * Math.min(1, r), s / Math.max(1, r)); cx.imageSmoothingEnabled = false; cx.globalAlpha = 1; } }
}
// 확정 · 취소 · 턴 종료 그림 버튼
const t5Ok = (dis, n) => '<button class="b go s t5ok"' + (dis ? " disabled" : "") + ' onclick="okAct()"><img src="' + T5P("btn_ok") + '" alt="✔ 확정">' + (n ? "<i>" + n + "</i>" : "") + "</button>";
const t5No = () => '<button class="b s t5no" onclick="pickA(null)"><img src="' + T5P("btn_cancel") + '" alt="✖ 취소"></button>';
function t5EndB(lab, fn) { const t = String(lab), k = t.indexOf("→"), b = k >= 0 ? t.slice(k).trim() : ""; return '<button class="b end t5be" onclick="' + fn + '"><img src="' + T5P("btn_end") + '" alt="턴 종료">' + (b ? "<small>" + b + "</small>" : "") + "</button>"; }
// 아래 탭(글자 버튼): 스킬 · 이동 · 탐지(용사) · 아이템
function t5Tabs(mvDis, bs) {
  const e = bs ? null : sel(), Q = RULE.search;
  const sh = fsOn() || (isLand() && innerHeight <= 520), tb = (lb, on, fn, dis) => '<button class="b s t5tab' + (on ? " on" : "") + '"' + (dis ? " disabled" : "") + ' onclick="' + fn + '">' + lb + "</button>";
  let h = '<div class="t5tabs">' + tb(sh ? "✦ 스킬" : "✦ 스킬", fsOn() ? !!L.skl : (L.menu && L.act === null && !L.bag), "L.menu=1;L.skl=" + (fsOn() && L.skl ? 0 : 1) + ";L.act=null;L.picks=[];L.bag=0;ui()", false) + tb(sh ? "🦶 이동" : "🦶 이동", L.act == "m", "pickA('m')", mvDis);
  if (!bs && Q) h += tb(sh ? "🔍 탐지" : "🔍 탐지", L.act == "q", "pickA('q')", !e || e.ap < Q.searchAp || srchUsed() >= Q.searchUses);
  return h + tb(sh ? "🎒 가방" : "🎒 아이템", L.bag, "pickA('bag')", false) + "</div>";
}
// 도구 줄 그림: 축소·확대·보스 찾기·용사 찾기·디자인
const T5TB = ["ic_zout", "ic_zin", "ic_search", "ic_grid", "ic_gear"];
function t5Toolbar(tb, on) {
  [...tb.children].forEach((b, i) => {
    if (on) { if (!b.dataset.o) b.dataset.o = b.innerHTML; b.innerHTML = '<img src="' + T5P(T5TB[i] || "ic_grid") + '" alt="">'; b.classList.add("t5ib"); }
    else if (b.dataset.o && b.classList.contains("t5ib")) { b.innerHTML = b.dataset.o; delete b.dataset.o; b.classList.remove("t5ib"); }
  });
}
// 꽉 찬 맵(가로 화면, 테마 5)
const fsOn = () => t5Bz() && isLand() && L.scr == "game";
// 전체 지도: 지금 보는 곳(노란 네모) · 보스(빨강) · 용사(초록), 누르면 그곳으로
function t5Mini() {
  let m = $("mini"); const on = fsOn() && S && S.ph != "setup";
  if (!on) { if (m) m.style.display = "none"; return; }
  if (!m) { $("gr").insertAdjacentHTML("afterbegin", '<div id="mini"><canvas width="160" height="160"></canvas><small>전체 지도 · 눌러서 이동</small></div>'); m = $("mini");
    m.querySelector("canvas").onclick = e => { const r = e.target.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height; W.scrollTo({ left: fx * N * Z - W.clientWidth / 2, top: fy * N * Z - W.clientHeight / 2 }); }; }
  m.style.display = "block"; const c = m.querySelector("canvas"), g = c.getContext("2d"), s = c.width, k = s / (N * Z);
  g.imageSmoothingEnabled = true; g.fillStyle = "#000"; g.fillRect(0, 0, s, s); g.drawImage(cv, 0, 0, s, s);
  g.fillStyle = "#ff5a5f"; g.fillRect((S.boss.x - 1) * s / N, (S.boss.y - 1) * s / N, 3 * s / N, 3 * s / N);
  S.heroes.forEach(h => { if (h.dead) return; g.fillStyle = "#5fe07a"; g.fillRect(h.x * s / N - 1, h.y * s / N - 1, s / N + 2, s / N + 2); });
  g.strokeStyle = "#ffd27a"; g.lineWidth = 2; g.strokeRect(W.scrollLeft * k + 1, W.scrollTop * k + 1, Math.min(s - 2, W.clientWidth * k - 2), Math.min(s - 2, W.clientHeight * k - 2));
}
// 마우스로 끌어서 맵 이동(PC). 끈 뒤의 클릭은 칸 선택으로 치지 않음
(function () {
  let d = null;
  W.addEventListener("pointerdown", e => { if (!fsOn() || e.pointerType != "mouse" || e.button != 0) return; d = { x: e.clientX, y: e.clientY, l: W.scrollLeft, t: W.scrollTop, m: 0 }; });
  window.addEventListener("pointermove", e => { if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (!d.m && Math.abs(dx) + Math.abs(dy) > 6) d.m = 1; if (d.m) { W.scrollLeft = d.l - dx; W.scrollTop = d.t - dy; } });
  window.addEventListener("pointerup", () => { if (d && d.m) L.dragged = Date.now(); d = null; });
  W.addEventListener("scroll", () => { try { t5Mini(); } catch (e) {} try { t5Ring(); } catch (e) {} }, { passive: true });
})();

/* 왼쪽 유닛 목록(꽉 찬 맵): 기본은 고른 유닛 하나만, 버튼으로 전체 목록을 열고 닫음. 목록에서 누르면 그 유닛만 남기고 닫힘 */
function t5Units(bsd) {
  const box = document.createElement("div"); box.innerHTML = t4Units(bsd); const cs = [...box.children];
  cs.forEach((c, i) => c.setAttribute("onclick", "L.ulOpen=0;L.skl=0;" + c.getAttribute("onclick")));
  if (!L.uc) return ""; // 유닛을 눌렀을 때만 그 유닛 카드 하나
  const cur = S.ph == "boss" ? 0 : (L.si || 0) + 1;
  return (cs[cur] || cs[0]).outerHTML;
}

/* 꽉 찬 맵: 유닛을 누르면 그 유닛 왼쪽 위에 행동 선택(스킬·이동·탐지·아이템)이 확정 말풍선처럼 뜸.
   스킬을 누르면 오른쪽 칸에 스킬 목록, 이동·탐지는 바로 칸 고르기, 아이템은 가방 */
function t5Ring() {
  let r = $("uq"); const on = fsOn() && S && mine() && S.ph != "setup" && !S.end && L.uc && L.menu && L.act === null && (S.ph == "boss" || (sel() && !sel().dead));
  if (!on) { if (r) r.style.display = "none"; return; }
  if (!r) { $("mw").insertAdjacentHTML("beforeend", '<div id="uq"></div>'); r = $("uq"); }
  const bs = S.ph == "boss"; let dis;
  if (bs) { const c = CH[S.champ], u = c.gen ? (L.bsel || "v") : "v"; dis = u != "v" || S.boss.moved || S.boss.ap < 1; }
  else { const e = sel(); dis = e.dead || e.ap < 1 || e.mc >= RULE.hero.movesPerTurn || mvOf(e) < 1; }
  r.innerHTML = t5Tabs(dis, bs); r.style.display = "block";
  const u = bs ? (L.bsel == "g" && S.gen ? S.gen : S.boss) : sel(), c = cv.getBoundingClientRect(), m = $("mw").getBoundingClientRect(), v = $("w").getBoundingClientRect(), cs = c.width / N;
  const ux = c.left + u.x * cs, uy = c.top + u.y * cs, big = bs ? 1 : 0, w = r.offsetWidth, h = r.offsetHeight;
  let x = ux - w - cs * (big ? 1.2 : .25), y = uy - h - cs * (big ? 1.2 : .25);
  if (x < v.left + 6) x = ux + cs * (big ? 2.2 : 1.25); if (y < v.top + 44) y = uy + cs * (big ? 2.2 : 1.25);
  x = Math.max(v.left + 6, Math.min(v.right - w - 6, x)); y = Math.max(v.top + 6, Math.min(v.bottom - h - 6, y));
  r.style.left = (x - m.left) + "px"; r.style.top = (y - m.top) + "px";
  // 스킬 목록: 링 바로 옆(오른쪽, 자리가 없으면 왼쪽), 위는 링과 맞춤
  const am = $("am");
  if (am && am.parentElement === $("mw") && am.style.display != "none") {
    const aw = am.offsetWidth, ah = am.offsetHeight; let ax = x + w + 4; if (ax + aw > v.right - 6) ax = x - aw - 4;
    ax = Math.max(v.left + 6, Math.min(v.right - aw - 6, ax)); const ay = Math.max(v.top + 6, Math.min(v.bottom - ah - 6, y));
    am.style.left = (ax - m.left) + "px"; am.style.top = (ay - m.top) + "px";
  }
}
