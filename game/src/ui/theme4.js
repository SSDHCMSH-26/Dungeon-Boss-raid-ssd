/* [화면] 테마 4 — 보랏빛 다크 판타지 UI (사용자 시안 기준)
   그림·맵·유닛은 테마 3 과 같고, 패널 모양만 다름:
   보스·용사 초상 카드(HP·AP 막대) / 아이콘이 있는 스킬 카드(◆AP 배지) / 맵 위 가운데 상황 배너 / 큰 턴 종료 버튼 */
const t4On = () => L.design == "t4" || L.design == "t5" || L.design == "t6"; // 테마 5 도 카드·로고는 테마 4 것을 씀
// 스킬 아이콘: 있는 그림(assets)을 다시 씀. 없으면 글 앞의 그림 글자, 그것도 없으면 ◆
const T4IC = {
  d_knight: "fx_burst", d_mage: "mage_atk", g: "fx_shield", r: "knight_atk", h: "fx_heal", l: "fx_judge", u: "fx_purify",
  s: "fx_aim", k: "fx_hook", p: "fx_grab", v: "fx_pierce", b: "fx_tele", o: "fx_mana", w: "fx_mana",
  c_fire: "fx_fire", c_frost: "fx_tele", c_guard: "fx_shield", q: "fx_mana"
};
const T4EX = { wall: "t_wall", trap: "t_spear", dig: "t_maze", pit: "t_pit", hop: "pit2", tchest: "ch_t", fac: "f1", bomb: "bomb", belt: "r1", run: "r2" };
function t4Src(a) {
  const t3 = n => T3A[n] || ART3[n] || (typeof ART3_EXTRA != "undefined" && ART3_EXTRA[n]) || null;
  if (a === "'q'") return t3("fx_mana");
  if (a === "'x'") return S.champ == "gron" ? t3("t_wall") : (ART2.r1 || null);
  if (typeof a == "number") {
    const e = sel(); if (!e) return null; const s = CLS[e.k].sk[a]; if (!s) return null;
    if (s.t == "d") return t3(T4IC["d_" + e.k] || "fx_burst");
    if (s.t == "c") return t3(/화염/.test(s.n) ? T4IC.c_fire : /빙결/.test(s.n) ? T4IC.c_frost : T4IC.c_guard);
    return T4IC[s.t] ? t3(T4IC[s.t]) : null;
  }
  const m = /^'([ae])(\d+)'$/.exec(String(a)); if (!m) return null;
  const c = CH[S.champ];
  if (m[1] == "a" && typeof t5Bz == "function" && t5Bz() && S.champ == "gron") { const at = CH.gron.at[+m[2]]; return T5P(at && /바위/.test(at.n) ? "boulder" : "rubble"); }
  if (m[1] == "a") return S.champ == "gron" ? ART3["g" + (1 + (+m[2] % 4))] : ART2["v" + (1 + (+m[2] % 2))];
  const e = c.ex[+m[2]]; if (!e) return null; if (typeof t6Icon == "function" && t6Icon(e.id)) return t6Icon(e.id); if (typeof t5Icon == "function" && t5Icon(e.id)) return t5Icon(e.id); const k = T4EX[e.id];
  if (!k) return null;
  if (S.champ == "vince" && ART2[k]) return ART2[k];
  return t3(k);
}
// 행동 메뉴 한 칸 → 스킬 카드 (글: "이름 (nAP) ⏱2턴<br><small>설명</small>")
function t4Card([lab, a, dis], i, all) {
  const sp = String(lab).split("<br>"), head = sp[0], desc = (sp[1] || "").replace(/<\/?small>/g, "");
  const ap = /\((\d+)AP\)/.exec(head), tag = head.replace(/^.*?\(\d+AP\)/, "").trim();
  let nm = head.replace(/\s*\(\d+AP\).*$/, "").trim(), em = "";
  const me = /^(\p{Extended_Pictographic}️?)\s*/u.exec(nm); if (me) { em = me[1]; nm = nm.slice(me[0].length); }
  const src = t4Src(a), wide = all.length % 2 == 1 && i == all.length - 1;
  const ic = src ? '<img src="' + src + '" alt="">' : '<span class="t4em">' + (em || "◆") + "</span>";
  return '<button class="b s t4k' + (wide ? " t4w" : "") + '"' + (dis ? " disabled" : "") + ' onclick="pickA(' + a + ')"><span class="t4ic">' + ic + '</span><span class="t4tx"><b class="t4t">' + nm + "</b>" +
    (desc ? '<small class="t4d">' + desc + "</small>" : "") + (ap ? '<span class="t4c">◆ ' + ap[1] + "AP</span>" : "") + (tag ? '<i class="t4g">' + tag + "</i>" : "") + "</span></button>";
}
const t4Bar = (v, m, c) => '<div class="t4bar"><i style="width:' + Math.max(0, Math.min(100, v / m * 100)) + "%;background:" + c + '"></i></div>';
// 왼쪽 유닛 카드: 보스(큰 초상 + HP·AP 막대) + 용사 3명(초상 · HP · AP 배지)
function t4Units(bsd) {
  const B = S.boss, ap = bsd ? B.ap : B.ap + ((S.sec && S.sec.hap) || 0);
  let u = '<div class="u t4b" onclick="L.menu=1;ui()">' + img(S.champ, 64) + '<div class="t4i"><div class="t4n">◈ ' + CH[S.champ].n + "</div>" +
    '<div class="t4r"><span>HP</span><b>' + B.hp + " / " + B.max + "</b></div>" + t4Bar(B.hp, B.max, "linear-gradient(#ff5a5f,#b4232b)") +
    '<div class="t4r"><span>AP</span><b>' + ap + " / " + bMax() + "</b></div>" + t4Bar(ap, bMax(), "linear-gradient(#a98bff,#6a3fd6)") +
    (S.gen ? '<div class="t4r t4s"><span>⚡ 발전기</span><b>HP ' + S.gen.hp + " · AP " + S.gen.ap + "/" + GAP() + "</b></div>" : "") + "</div></div>";
  u += S.heroes.map((e, i) => '<div class="u t4h' + (i == L.si ? " s" : "") + (e.dead ? " x" : "") + '" onclick="L.si=' + i + ';L.menu=1;ui()">' + (i == L.si ? '<span class="t4cr">♛</span>' : "") + img(e.k, 40) +
    '<div class="t4i"><div class="t4n">' + CLS[e.k].n + (e.guard ? " 🛡" : "") + '</div><div class="t4r"><span>HP</span><b>' + e.hp + " / " + e.max + "</b></div>" + t4Bar(e.hp, e.max, "linear-gradient(#5fe07a,#2f9a48)") + "</div>" +
    '<div class="t4ap"><span>AP</span><b>' + e.ap + "</b></div></div>").join("");
  return u;
}
// 턴 종료 버튼: 라운드 마름모 + 큰 버튼 (글 "⏭ 턴 종료 → 누구 차례" 를 두 줄로)
function t4End(lab, fn) {
  const t = String(lab).replace(/^⏭\s*/, ""), k = t.indexOf("→"), a = k >= 0 ? t.slice(0, k).trim() : t, b = k >= 0 ? t.slice(k).trim() : "";
  return '<div class="t4end"><span class="t4rd"><b>' + S.round + "</b><small>턴</small></span>" + '<button class="b end t4e" onclick="' + fn + '"><span>▶▶ ' + a + "</span>" + (b ? "<small>" + b + "</small>" : "") + "</button></div>";
}
// 왼쪽 위 로고
function t4Logo() {
  const c = S && S.champ && CH[S.champ];
  return '<div id="t4logo"><span class="t4gear">⚙</span><span><b>' + (S && S.champ == "vince" ? "FACTORY MASTER" : "DUNGEON MAKER") + "</b><small>— " + (c ? c.n : "PIXEL DUNGEON RAID") + " —</small></span></div>";
}
