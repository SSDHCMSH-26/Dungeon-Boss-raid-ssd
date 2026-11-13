/* [화면] 테마 6 — 사용자 그림(art/t6/) 으로 꾸민 그론 던전 + UI
   배치는 테마 5(꽉 찬 맵)와 같고, 그림만 바꿈:
   - 맵(그론): 바닥 = 어두운 벽돌, 벽 = 밝은 돌 블록(가끔 금 간 블록), 구덩이 = 돌 테두리 구멍, 가시 함정 = 가시 칸, 폭탄 = 쇠공
   - UI: 패널·카드 테두리(장식 모서리), 스킬/이동/탐지/아이템 탭, 둥근 도구 버튼, 확정·턴 종료 그림 버튼, 닫기 X
   - 유닛(보스·용사 그림)과 보물상자·함정 상자는 바꾸지 않음
   그림 목록은 data/art.json 의 images.T6 */
const t6On = () => L.design == "t6";
const T6 = k => (IMG.T6 && IMG.T6[k]) || null;
// 맵 그림 바꿔 끼우기 (g3 이 그론 그림을 부를 때 먼저 물어봄)
const T6MAP = { t_spear: "spike_t", t_flame: "spikes", pit2: "pit_l", t_wall: "wall_a", t_maze: "wall_hole", t_pit: "pit_s", t6bomb: "bomb" };
function t6Art(k) { return t6On() && S && S.champ == "gron" && T6MAP[k] ? T6(T6MAP[k]) : null; }
// 행동 목록 아이콘 (그론 설치 스킬)
const T6ICON = { wall: "wall_a", trap: "spike_t", dig: "wall_hole", pit: "pit_s", hop: "portal" };
function t6Icon(id) { return t6On() && S && S.champ == "gron" && T6ICON[id] ? T6(T6ICON[id]) : null; }
// 바닥·벽 타일 (그림을 다 받은 뒤부터 사용, 그 전엔 원래 타일)
const T6I = {};
function t6Img(k) { let i = T6I[k]; if (!i) { i = T6I[k] = new Image(); i.onload = () => { if (L.scr == "game") draw(); }; i.src = T6(k); } return i.complete && i.naturalWidth ? i : null; }
function t6Tiles() {
  if (!t6On() || !S || S.champ != "gron") return null;
  const f = t6Img("floor_d"), w = t6Img("floor_l"), w2 = t6Img("floor_c");
  if (!(f && w && w2)) return null;
  if (!T6I._t) { // 바닥은 어둡게(벽과 구분), 벽은 조금 밝게 — 한 번만 만들어 둠
    const tint = (im, col, op, lit) => { const c = document.createElement("canvas"); c.width = 64; c.height = 64; const g = c.getContext("2d"); g.imageSmoothingEnabled = true; g.drawImage(im, 0, 0, 64, 64); g.globalCompositeOperation = op; g.fillStyle = col; g.fillRect(0, 0, 64, 64); if (lit) { g.globalCompositeOperation = "source-over"; g.fillStyle = "rgba(255,240,220,.10)"; g.fillRect(0, 0, 64, 4); g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, 60, 64, 4); } return c; };
    const fd = tint(f, "#5a5068", "multiply"), fd2 = tint(f, "#4c4458", "multiply");
    T6I._t = { f: [fd, fd2, fd, fd2], w: tint(w, "#d8d0e0", "multiply", 1), w2: tint(w2, "#d8d0e0", "multiply", 1), t6: 1 };
  }
  return T6I._t;
}
// 아래 탭: 스킬 · 이동 · 탐지(용사만) · 아이템
function t6Tabs(mvDis, bs) {
  const e = bs ? null : sel(), Q = RULE.search;
  const tb = (img, on, fn, dis, t) => '<button class="t6tab' + (on ? " on" : "") + '"' + (dis ? " disabled" : "") + ' onclick="' + fn + '" title="' + t + '"><img src="' + T6(img) + '" alt="' + t + '"></button>';
  let h = '<div class="t6tabs">' + tb("tab_skill", L.menu && L.act === null && !L.bag, "L.menu=1;L.act=null;L.picks=[];L.bag=0;ui()", false, "스킬") + tb("tab_move", L.act == "m", "pickA('m')", mvDis, "이동");
  if (!bs && Q) h += tb("tab_scan", L.act == "q", "pickA('q')", !e || e.ap < Q.searchAp || srchUsed() >= Q.searchUses, "탐지");
  return h + tb("tab_item", L.bag, "pickA('bag')", false, "아이템") + "</div>";
}
// 확정 버튼(그림)
const t6Ok = (dis, n) => '<button class="b go s t6ok"' + (dis ? " disabled" : "") + ' onclick="okAct()"><img src="' + T6("btn_ok") + '" alt="✔ 확정">' + (n ? '<i>' + n + "</i>" : "") + "</button>";
// 턴 종료 버튼(그림) + 누구 차례로 넘어가는지 작은 글
function t6End(lab, fn) {
  const t = String(lab), k = t.indexOf("→"), b = k >= 0 ? t.slice(k).trim() : "";
  return '<button class="b end t6e" onclick="' + fn + '"><img src="' + T6("btn_end") + '" alt="턴 종료">' + (b ? "<small>" + b + "</small>" : "") + "</button>";
}
// 도구 줄: 축소·확대·보스·용사·디자인 → 그림 버튼
const T6TB = ["ib_search", "ib_search", "ib_map", "ib_grid", "ib_gear"], T6TBB = ["−", "+", "", "", ""];
function t6Toolbar(tb, on) {
  [...tb.children].forEach((b, i) => {
    if (on) { if (!b.dataset.o) b.dataset.o = b.innerHTML; b.innerHTML = '<img src="' + T6(T6TB[i] || "ib_grid") + '" alt="">' + (T6TBB[i] ? "<i>" + T6TBB[i] + "</i>" : ""); b.classList.add("t6ib"); }
    else if (b.dataset.o) { b.innerHTML = b.dataset.o; delete b.dataset.o; b.classList.remove("t6ib"); }
  });
}
