/* [화면] 테마 5 — 꽉 찬 맵 (테마 4 디자인 + 사용자 시안 2 배치)
   가로 화면: 맵이 화면 높이에 꽉 차고, 양옆 빈 공간에 패널이 떠 있음
   - 왼쪽: 로고 · 보스·용사 카드 · 간파 · 기록 · 둥근 도구 버튼
   - 맵 위: 상황 배너(위 가운데), 행동 메뉴는 고른 유닛 옆에 목록 팝업
   - 오른쪽: 이동·가방 · 고른 행동의 상세 창(큰 그림 · AP · 설명 · 효과 범위 · 확정) · 큰 턴 종료
   유닛 카드·로고·아이콘은 테마 4 것을 같이 씀 (t4On 은 테마 4·5 모두 참) */
const t5On = () => L.design == "t5";
// 행동 목록 한 줄: 아이콘 · 이름 · 한 줄 설명 · AP
function t5Row([lab, a, dis]) {
  const sp = String(lab).split("<br>"), head = sp[0], desc = (sp[1] || "").replace(/<\/?small>/g, "");
  const ap = /\((\d+)AP\)/.exec(head), tag = head.replace(/^.*?\(\d+AP\)/, "").trim();
  let nm = head.replace(/\s*\(\d+AP\).*$/, "").trim(), em = "";
  const me = /^(\p{Extended_Pictographic}️?)\s*/u.exec(nm); if (me) { em = me[1]; nm = nm.slice(me[0].length); }
  const src = t4Src(a), ic = src ? '<img src="' + src + '" alt="">' : '<span class="t4em">' + (em || "◆") + "</span>";
  return '<button class="b s t5r"' + (dis ? " disabled" : "") + ' onclick="pickA(' + a + ')"><span class="t5ic">' + ic + '</span><span class="t5tx"><b>' + nm + (tag ? ' <i class="t4g">' + tag + "</i>" : "") + "</b>" + (desc ? "<small>" + desc + "</small>" : "") + "</span>" + (ap ? '<span class="t5ap">AP <b>' + ap[1] + "</b></span>" : "") + "</button>";
}
// 지금 고른 행동의 정보: 이름·그림·AP·설명·효과 범위(반경 r, 모양)
function t5Info() {
  const a = L.act, bs = S.ph == "boss";
  if (a == "m") return { n: "🦶 이동", ap: 1, d: bs ? "보스를 고른 칸으로 옮깁니다." : "직선으로 " + mvOf(sel()) + "칸까지 이동합니다.", r: 0 };
  if (a == "i") return { n: "📜 순간이동 스크롤", ap: 0, d: "고른 칸으로 순간이동합니다.", r: 0, src: ART3.it_scr };
  if (a == "q") { const Q = RULE.search; return { n: "🔍 탐지 오드", ap: Q.searchAp, d: "주위 " + Q.searchArea + "×" + Q.searchArea + " 에 숨은 것의 개수를 알려 줍니다. 고른 칸에 함정이 있으면 간파 · 0개면 AP -" + Q.searchMissAp, r: (Q.searchArea - 1) >> 1, src: t4Src("'q'") }; }
  if (a == "x") return { n: S.champ == "gron" ? "🔨 벽 부수기" : "🔧 컨베이어 파괴", ap: 1, d: S.champ == "gron" ? "사거리 " + RULE.hero.breakRange + " · 벽 1칸에 피해 " + RULE.hero.breakDmg : "컨베이어 1칸을 부숩니다.", r: 0, src: t4Src("'x'") };
  if (bs) {
    if (typeof a == "string" && a[0] == "a") { const at = CH[S.champ].at[+a.slice(1)]; return { n: at.n, ap: at.c, d: at.d + " · 피해 " + at.v, r: at.k || 0, cross: at.sh == "cross", src: t4Src("'" + a + "'") }; }
    if (a == "gc") { const g = CH[S.champ].gx; return { n: g.n, ap: g.c, d: g.d, r: 0 }; }
    const e = spec(a); return { n: e.n, ap: ecost(e), d: e.d || "", r: e.id == "pit" ? 0 : 0, src: t4Src("'" + a + "'") };
  }
  const s = CLS[sel().k].sk[a]; if (!s) return null;
  return { n: s.n, ap: s.c, d: s.d || s.sm || "", r: s.t == "c" ? s.fx.radius : s.t == "u" ? ((s.fx.area || 7) - 1) >> 1 : s.t == "o" ? s.fx.radius : (s.a || 0), src: t4Src(+a) };
}
// 효과 범위 그림: 가운데 칸 기준 (2r+1)×(2r+1), 최대 7×7
function t5Grid(r, cross) {
  const R = Math.min(3, r), n = R * 2 + 1; let h = '<div class="t5gd" style="grid-template-columns:repeat(' + n + ',1fr)">';
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const on = cross ? (x == 0 || y == 0) : true; h += '<i class="' + (x == 0 && y == 0 ? "c" : on ? "on" : "") + '"></i>'; }
  return h + "</div>";
}
// 오른쪽 상세 창 (고른 행동) — 확정·취소 포함
function t5Detail(hint, ok) {
  const f = t5Info(); if (!f) return "";
  let nm = f.n, em = ""; const me = /^(\p{Extended_Pictographic}️?)\s*/u.exec(nm); if (me) { em = me[1]; nm = nm.slice(me[0].length); }
  const pic = f.src ? '<img src="' + f.src + '" alt="">' : '<span class="t4em">' + (em || "◆") + "</span>";
  return '<div class="t5dt">' + nm + '</div><div class="t5pic">' + pic + '</div><div class="t5cost">◆ AP 소모 <b>' + f.ap + '</b></div><p class="t5desc">' + f.d + '</p><div class="t5sep">→ 효과 범위 ←</div>' + t5Grid(f.r, f.cross) +
    '<div class="t5hint">' + hint + '</div><div class="r">' + BT("✔ 확정 (" + L.picks.length + "/" + need() + ")", "okAct()", "go s", !ok) + BT(T("cfH.9"), "pickA(null)", "s") + "</div>";
}
// 턴 종료: 모래시계 + 두 줄
function t5End(lab, fn) {
  const t = String(lab).replace(/^⏭\s*/, ""), k = t.indexOf("→"), a = k >= 0 ? t.slice(0, k).trim() : t, b = k >= 0 ? t.slice(k).trim() : "";
  return '<button class="b end t5e" onclick="' + fn + '"><span class="t5hg">⌛</span><span><b>' + a + "</b>" + (b ? "<small>" + b + "</small>" : "") + "</span></button>";
}
// 행동 메뉴 팝업을 고른 유닛 옆에 (가로 화면만, 맵 안에서)
function t5Pop() {
  const am = $("am"); if (!am) return;
  if (!(t5On() && isLand() && L.scr == "game") || am.style.display == "none" || am.parentElement !== $("mw")) { am.style.left = am.style.top = ""; return; }
  const u = S.ph == "boss" ? S.boss : sel(); if (!u) return;
  const c = cv.getBoundingClientRect(), m = $("mw").getBoundingClientRect(), v = $("w").getBoundingClientRect(), cs = c.width / N;
  const ux = c.left + (u.x + .5) * cs, uy = c.top + (u.y + .5) * cs, pw = am.offsetWidth, ph = am.offsetHeight;
  let x = ux + cs * 1.6; if (x + pw > v.right - 6) x = ux - cs * 1.6 - pw; x = Math.max(v.left + 6, Math.min(v.right - pw - 6, x));
  const st = $("st").getBoundingClientRect(), top0 = Math.max(v.top + 6, st.bottom + 6), y = Math.max(top0, Math.min(v.bottom - ph - 6, uy - ph / 2));
  am.style.left = (x - m.left) + "px"; am.style.top = (y - m.top) + "px";
}
