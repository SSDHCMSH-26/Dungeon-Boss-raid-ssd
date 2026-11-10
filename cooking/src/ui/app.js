/* 화면 — core(CK) 를 불러 apply 로만 게임을 바꾼다 */
(function () {
  'use strict';
  var CK = window.CK, D, S;
  var KEY = 'chef_table_save_v1';
  var AMT = [[1, '보통'], [1.6, '많이'], [0.4, '조금']];
  var COLHEX = { red: '#d33d2f', orange: '#e8862a', yellow: '#e9c440', green: '#4c9a4a', white: '#f4efe6', brown: '#8a5a3b', black: '#2a2522', purple: '#7b4b94', pink: '#ef9cb0' };
  var TCOL = { sweet: '--t-sweet', salty: '--t-salty', sour: '--t-sour', bitter: '--t-bitter', umami: '--t-umami', spicy: '--t-spicy', fat: '--t-fat' };
  var L = { tab: 'home', labTe: 'saute', labCo: 'auto', labSel: [], labCat: 'all', labQ: '', pickCo: 'all', pickQ: '', bookTab: 'rec', cuF: 'all' };
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function won(n) { return (n < 0 ? '-' : '') + Math.abs(Math.round(n)).toLocaleString('ko-KR') + '원'; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() { try { var s = localStorage.getItem(KEY); if (s) { var o = JSON.parse(s); if (o && o.v === 1) return o; } } catch (e) {} return null; }
  function toast(t) { var e = document.createElement('div'); e.className = 'toast'; e.textContent = t; document.body.appendChild(e); setTimeout(function () { e.remove(); }, 2200); }
  function act(a) { var r = CK.apply(D, S, a); if (!r.ok) toast(r.err); else save(); return r; }
  function season() { return CK.season(D, S); }

  function modal(html) {
    closeModal();
    var m = document.createElement('div'); m.className = 'modal'; m.id = 'modal';
    m.innerHTML = '<div class="sheet"><button class="x" data-a="close">×</button>' + html + '</div>';
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
    document.body.appendChild(m);
  }
  function closeModal() { var m = $('#modal'); if (m) m.remove(); }

  /* ---------- 공용 그림 조각 ---------- */
  function tasteBars(pt) {
    return CK.TN.map(function (t) {
      return '<div class="tb"><span>' + CK.TK[t] + '</span><div class="bar"><i style="width:' + (pt[t] / 5 * 100) + '%;background:var(' + TCOL[t] + ')"></i></div><span class="muted">' + pt[t].toFixed(1) + '</span></div>';
    }).join('');
  }
  function notesHtml(notes, withCat) {
    return notes.map(function (n) { return '<div class="note ' + n.k + '">' + (withCat && n.c ? '<span class="c">[' + n.c + ']</span>' : '') + esc(n.t) + '</div>'; }).join('');
  }
  function qColor(q) { return q >= 90 ? 'var(--accent2)' : q >= 75 ? 'var(--ink)' : q >= 60 ? 'var(--tip)' : 'var(--warn)'; }
  function amtName(m) { return m <= 0.5 ? '조금' : m >= 1.5 ? '많이' : ''; }
  function dishDetail(p, extra) {
    var tech = D.tech[p.te];
    var ing = p.i.map(function (id, k) { var a = amtName(p.amt ? p.amt[k] : 1); return esc(D.ing[id].n) + (a ? '(' + a + ')' : ''); }).join(', ');
    return '<h2 style="margin-top:0">' + esc(p.n) + ' <span style="color:' + qColor(p.q) + '">' + p.q + '점</span></h2>' +
      '<div><span class="tag">' + (D.cuisines[p.cu] || '창작') + '</span><span class="tag">' + D.courses[p.co] + '</span><span class="tag">' + tech.n + '</span><span class="tag">' + CK.TEMPK[p.temp] + '</span><span class="tag">무게감 ' + p.w + '/5</span>' + (p.veg ? '<span class="tag">채식 가능</span>' : '') + '</div>' +
      (p.id && D.rec[p.id] ? '<p class="muted">' + esc(D.rec[p.id].d) + '</p>' : '') +
      '<h3>재료</h3><div class="muted">' + ing + '</div>' +
      '<h3>느껴지는 맛</h3>' + tasteBars(p.pt) +
      '<h3>향 · 질감 · 색</h3><div>' + p.aro.map(function (a) { return '<span class="tag">' + CK.AK[a] + '</span>'; }).join('') + '</div><div>' +
      p.tex.map(function (x) { return '<span class="tag">' + (CK.XK[x] || x) + '</span>'; }).join('') + '</div><div>' +
      p.col.map(function (c) { return '<span class="dot" style="background:' + COLHEX[c] + '"></span>' + CK.COLK[c] + ' '; }).join('') + '</div>' +
      '<h3>평가</h3>' + notesHtml(p.notes) +
      '<h3>조리 과학 — ' + tech.n + '</h3><p class="muted">' + esc(tech.sci) + '</p>' +
      '<p class="muted">1인분 원가 ' + won(p.cost) + ' · 권장가 ' + won(p.price) + ' (원가율 30%)</p>' + (extra || '');
  }

  /* ---------- 머리·탭 ---------- */
  function header() {
    var st = '★★★'.slice(0, S.stars) + '☆☆☆'.slice(S.stars);
    $('header').innerHTML = '<h1>🍳 ' + esc(S.name) + '</h1><div class="hstat"><span><b>' + S.day + '일차</b> · ' + D.R.seasons[season()] + '</span><span>💰 <b>' + won(S.money) + '</b></span><span>평판 <b>' + S.rep + '</b></span><span style="color:#c9971a">' + st + '</span></div>';
  }
  var TABS = [['home', '🏠', '식당'], ['menu', '🍽️', '메뉴'], ['lab', '🧪', '연구실'], ['book', '📖', '도감'], ['shop', '🛒', '상점']];
  function nav() { $('nav').innerHTML = TABS.map(function (t) { return '<button data-a="tab" data-v="' + t[0] + '" class="' + (L.tab === t[0] ? 'on' : '') + '"><span class="i">' + t[1] + '</span>' + t[2] + '</button>'; }).join(''); }

  /* ---------- 식당 ---------- */
  function home() {
    var ev = CK.evalCurrent(D, S), P = CK.menuProfiles(D, S), mp = CK.menuPrice(D, S);
    var h = '';
    if (S.over) h += '<div class="card"><h2>파산했습니다 😢</h2><p>빚이 100만 원을 넘었습니다. 새로 시작해 보세요.</p><button class="btn pri big" data-a="newgame">새 게임</button></div>';
    var dow = ((S.day - 1) % 7) + 1;
    h += '<div class="card hl"><div class="row"><div class="sp"><div class="muted">오늘의 메뉴 · ' + (S.menu.format === 'bansang' ? '한식 반상' : '코스') + '</div><div style="font-weight:700">' + (P.map(function (p) { return esc(p.n); }).join(' → ') || '비어 있음') + '</div></div><div class="grade g-' + ev.grade + '" style="background:rgba(255,255,255,.25)">' + ev.grade + '</div></div>' +
      '<div class="muted" style="margin-top:6px">식단 점수 ' + ev.score + '점' + (ev.perfect ? ' · ★ 완벽한 식단' : '') + ' · ' + (dow === 7 ? '오늘 밤 미식 평론가 방문!' : '평론가 방문까지 ' + (7 - dow) + '일') + '</div></div>';
    var rate = Math.round(S.priceRate * 100);
    h += '<div class="card"><h2>가격</h2><div class="row"><div class="sp">1인 <b class="big">' + won(mp.price) + '</b></div><div class="muted">원가 ' + won(mp.cost) + '<br>원가율 ' + (mp.price ? Math.round(mp.cost / mp.price * 100) : 0) + '%</div></div>' +
      '<input type="range" min="' + D.R.priceRateMin * 100 + '" max="' + D.R.priceRateMax * 100 + '" step="5" value="' + rate + '" data-a="price"><div class="muted">권장가의 ' + rate + '% · 비싸면 손님이 줄고 만족도가 떨어지며, 별이 많을수록 비싼 값도 받아들인다</div></div>';
    h += '<button class="btn pri big" data-a="run" ' + (S.over || !P.length ? 'disabled' : '') + '>🔔 영업 시작 (' + S.day + '일차)</button><div style="height:12px"></div>';
    if (S.rumor && D.rec[S.rumor]) { var rr = D.rec[S.rumor]; h += '<div class="card"><h2>💬 오늘의 소문</h2><p style="margin:0">손님들이 「<b>' + esc(rr.n) + '</b>」 이야기를 한다. ' + D.cuisines[rr.cu] + ' 요리이고, <b>' + D.tech[rr.te].n + '</b>(으)로 만든다더라… 주재료는 <b>' + esc(D.ing[CK.ids(rr.i)[0]].n) + '</b>?</p><p class="muted">연구실에서 맞는 재료를 찾아 보세요.</p></div>'; }
    if (S.last) h += lastCard(S.last);
    var used = Object.keys(S.skill);
    h += '<div class="card"><h2>👩‍🍳 셰프 숙련도</h2>' + (used.length ? used.map(function (te) { var lv = CK.level(D, S, te); return '<div class="tb" style="grid-template-columns:110px 1fr 40px"><span>' + D.tech[te].n.split('(')[0] + '</span><div class="bar"><i style="width:' + (lv / 5 * 100) + '%"></i></div><span class="muted">Lv' + lv + '</span></div>'; }).join('') : '<p class="muted">영업할수록 그 조리법이 숙련되어 요리 완성도가 오른다 (Lv0 80% → Lv5 100%)</p>') + '</div>';
    h += '<div class="card"><h2>기록</h2><div class="muted">손님 ' + S.stats.served.toLocaleString() + '명 · 누적 매출 ' + won(S.stats.revenue) + ' · 최고 식단 점수 ' + S.stats.bestScore + ' · 완벽한 식단 ' + S.stats.perfect + '회 · 레시피 ' + Object.keys(S.known).length + '/' + D.recIds.length + '</div>' +
      '<div class="row" style="margin-top:8px"><input type="text" id="rname" value="' + esc(S.name) + '" style="flex:1"><button class="btn sm" data-a="rename">이름 바꾸기</button></div><div style="margin-top:8px"><button class="btn sm" data-a="newgame">새 게임</button> <button class="btn sm" data-a="help">게임 방법</button></div></div>';
    return h;
  }
  function lastCard(r) {
    return '<div class="card"><h2>' + r.day + '일차 영업 결과</h2><div class="cols"><div>손님 <b>' + r.served + '명</b>' + (r.left ? ' (돌아감 ' + r.left + ')' : '') + '<br>만족도 <b>' + r.sat + '</b>/100<br>평판 ' + (r.repD >= 0 ? '+' : '') + r.repD + '</div><div>매출 ' + won(r.rev) + '<br>재료비 -' + won(r.cost) + '<br>인건비·임대 -' + won(r.fixed) + '<br><b style="color:' + (r.profit >= 0 ? 'var(--accent2)' : 'var(--warn)') + '">순이익 ' + won(r.profit) + '</b></div></div>' +
      (r.critic ? '<h3>🎩 미식 평론가 ' + r.critic.score + '점 → ' + ('★★★'.slice(0, r.critic.stars) || '별 없음') + '</h3>' + r.critic.good.map(function (t) { return '<div class="note good">' + esc(t) + '</div>'; }).join('') + r.critic.bad.map(function (t) { return '<div class="note bad">' + esc(t) + '</div>'; }).join('') : '') +
      '<h3>손님 한마디</h3>' + (r.reviews.map(function (v) { return '<div class="note ' + (v.s >= 75 ? 'good' : v.s < 55 ? 'bad' : 'tip') + '"><span class="c">' + esc(v.who) + ' ' + v.s + '</span>' + esc(v.t) + '</div>'; }).join('') || '<p class="muted">—</p>') + '</div>';
  }

  /* ---------- 메뉴 ---------- */
  function menu() {
    var P = CK.menuProfiles(D, S), ev = CK.evalCurrent(D, S);
    var h = '<div class="card"><div class="seg"><button data-a="fmt" data-v="course" class="' + (S.menu.format === 'course' ? 'on' : '') + '">코스 요리</button><button data-a="fmt" data-v="bansang" class="' + (S.menu.format === 'bansang' ? 'on' : '') + '">한식 반상</button></div>' +
      '<p class="muted" style="margin-bottom:0">' + (S.menu.format === 'course' ? '내는 순서대로 놓으세요. 아뮤즈 → 전채 → 수프 → 생선 → 입가심 → 메인 → 디저트가 정석.' : '밥·국·김치 + 반찬(첩). 반찬끼리 조리법·재료가 겹치지 않게, 오방색을 고루.') + '</p></div>';
    h += '<div class="card"><h2>메뉴 (' + P.length + ')</h2><div class="list">' + P.map(function (p, k) {
      return '<div class="it"><div class="sp"><div class="nm" data-a="detail" data-v="' + S.menu.items[k] + '">' + (k + 1) + '. ' + esc(p.n) + '</div><div class="muted">' + D.courses[p.co] + ' · ' + D.tech[p.te].n.split('(')[0] + ' · 무게 ' + p.w + '</div></div><span class="q" style="color:' + qColor(p.q) + '">' + p.q + '</span>' +
        '<button class="btn sm" data-a="mv" data-v="' + k + '" data-d="-1">▲</button><button class="btn sm" data-a="mv" data-v="' + k + '" data-d="1">▼</button><button class="btn sm" data-a="rm" data-v="' + k + '">✕</button></div>';
    }).join('') + '</div><button class="btn pri big" style="margin-top:10px" data-a="pick">＋ 요리 추가</button></div>';
    h += '<div class="card"><div class="row"><div class="grade g-' + ev.grade + '">' + ev.grade + '</div><div class="sp"><div class="big">' + ev.score + '점</div><div class="muted">' + (ev.perfect ? '★ 완벽한 식단!' : 'S등급 + 지적 0개 = 완벽한 식단') + '</div></div></div>' +
      ev.sub.map(function (x) { return '<div class="tb" style="grid-template-columns:84px 1fr 30px"><span>' + x.n + '</span><div class="bar"><i style="width:' + x.s + '%;background:' + (x.s >= 80 ? 'var(--accent2)' : x.s >= 60 ? 'var(--tip)' : 'var(--warn)') + '"></i></div><span class="muted">' + x.s + '</span></div>'; }).join('') +
      '<h3>셰프 노트</h3>' + notesHtml(ev.notes.filter(function (n) { return n.k === 'bad'; }), true) + notesHtml(ev.notes.filter(function (n) { return n.k === 'tip'; }), true) + notesHtml(ev.notes.filter(function (n) { return n.k === 'good'; }), true) + '</div>';
    return h;
  }
  function pickList() {
    var se = season(), out = [];
    Object.keys(S.known).forEach(function (id) { out.push(['r:' + id, CK.recipeProfile(D, id, se)]); });
    Object.keys(S.custom).forEach(function (cid) { out.push(['c:' + cid, CK.dish(D, S, 'c:' + cid, se)]); });
    var q = L.pickQ.trim();
    return out.filter(function (x) { var p = x[1]; return (L.pickCo === 'all' || p.co === L.pickCo) && (!q || p.n.indexOf(q) >= 0); })
      .sort(function (a, b) { return b[1].q - a[1].q; });
  }
  function pickModal() {
    var cos = ['all'].concat(Object.keys(D.courses));
    var items = pickList();
    modal('<h2 style="margin-top:0">요리 추가</h2><input type="search" id="pq" placeholder="이름 검색" value="' + esc(L.pickQ) + '"><div class="scroll-x" style="margin-top:8px">' +
      cos.map(function (c) { return '<span class="chip ' + (L.pickCo === c ? 'on' : '') + '" data-a="pickco" data-v="' + c + '">' + (c === 'all' ? '전체' : D.courses[c]) + '</span>'; }).join('') + '</div><div class="list">' +
      (items.map(function (x) { var p = x[1], ok = CK.techOpen(D, S, p.te); return '<div class="it"><div class="sp"><div class="nm">' + esc(p.n) + (p.custom ? ' <span class="tag">창작</span>' : '') + '</div><div class="muted">' + (D.cuisines[p.cu] || '창작') + ' · ' + D.courses[p.co] + ' · ' + D.tech[p.te].n.split('(')[0] + (ok ? '' : ' 🔒설비 필요') + '</div></div><span class="q" style="color:' + qColor(p.q) + '">' + p.q + '</span><button class="btn sm pri" data-a="add" data-v="' + x[0] + '" ' + (ok ? '' : 'disabled') + '>추가</button></div>'; }).join('') || '<p class="muted">없음</p>') + '</div>');
    var pq = $('#pq'); pq.addEventListener('input', function () { L.pickQ = pq.value; var pos = pq.selectionStart; pickModal(); var n = $('#pq'); n.focus(); n.setSelectionRange(pos, pos); });
  }

  /* ---------- 연구실 ---------- */
  function lab() {
    var se = season();
    var h = '<div class="card"><h2>1. 조리법</h2><div>' + Object.keys(D.tech).map(function (te) {
      var ok = CK.techOpen(D, S, te);
      return '<span class="chip ' + (L.labTe === te ? 'on' : '') + (ok ? '' : ' lock') + '" data-a="labte" data-v="' + te + '">' + (ok ? '' : '🔒') + D.tech[te].n + '</span>';
    }).join('') + '</div><p class="muted" style="margin:0">' + esc(D.tech[L.labTe].sci) + '</p></div>';
    h += '<div class="card"><h2>2. 재료 (' + L.labSel.length + '/' + D.R.maxLabIngredients + ')</h2><p class="muted" style="margin-top:0">첫 번째가 주재료. 고른 재료를 누르면 양이 바뀐다 (보통 → 많이 → 조금)</p><div>' +
      (L.labSel.map(function (s, k) { return '<span class="chip on" data-a="amt" data-v="' + k + '">' + (k === 0 ? '★' : '') + esc(D.ing[s.id].n) + (amtName(s.m) ? '·' + amtName(s.m) : '') + ' <b data-a="unsel" data-v="' + k + '">✕</b></span>'; }).join('') || '<span class="muted">아래에서 재료를 고르세요</span>') + '</div>' +
      '<input type="search" id="lq" placeholder="재료 검색 (예: 토마토)" value="' + esc(L.labQ) + '" style="margin-top:6px"><div class="scroll-x" style="margin-top:8px">' +
      ['all'].concat(Object.keys(D.cats)).map(function (c) { return '<span class="chip ' + (L.labCat === c ? 'on' : '') + '" data-a="labcat" data-v="' + c + '">' + (c === 'all' ? '전체' : D.cats[c]) + '</span>'; }).join('') + '</div><div style="max-height:220px;overflow:auto">' +
      Object.keys(D.ing).filter(function (id) { var g = D.ing[id]; return (L.labCat === 'all' || g.c === L.labCat) && (!L.labQ || g.n.indexOf(L.labQ) >= 0) && !L.labSel.some(function (s) { return s.id === id; }); })
        .map(function (id) { var g = D.ing[id], ins = g.s && g.s.indexOf(se) >= 0; return '<span class="chip" data-a="sel" data-v="' + id + '">' + (ins ? '🌱' : '') + esc(g.n) + '</span>'; }).join('') + '</div></div>';
    if (L.labSel.length) {
      var spec = { n: '?', co: L.labCo === 'auto' ? 'app' : L.labCo, te: L.labTe, i: L.labSel.map(function (s) { return s.m === 1 ? s.id : s.id + '*' + s.m; }) };
      var p = CK.profile(D, spec, se);
      var co = L.labCo === 'auto' ? CK.guessCourse(p) : L.labCo;
      h += '<div class="card"><h2>3. 맛 미리보기</h2>' + tasteBars(p.pt) + '<div style="margin-top:6px">' + p.aro.map(function (a) { return '<span class="tag">' + CK.AK[a] + '</span>'; }).join('') + p.tex.map(function (x) { return '<span class="tag">' + (CK.XK[x] || x) + '</span>'; }).join('') + '<span class="tag">' + CK.TEMPK[p.temp] + '</span><span class="tag">무게감 ' + p.w + '</span></div>' +
        '<div class="row" style="margin-top:8px"><span class="muted">코스 종류</span><select id="labco" style="flex:1"><option value="auto">자동 (' + D.courses[co] + ')</option>' + Object.keys(D.courses).map(function (c) { return '<option value="' + c + '" ' + (L.labCo === c ? 'selected' : '') + '>' + D.courses[c] + '</option>'; }).join('') + '</select></div>' +
        '<p class="muted">재료비 ' + won(p.cost) + ' (실험할 때마다 듭니다)</p><button class="btn pri big" data-a="cook" ' + (CK.techOpen(D, S, L.labTe) ? '' : 'disabled') + '>🔥 ' + (CK.techOpen(D, S, L.labTe) ? '조리하기' : '설비가 필요합니다') + '</button></div>';
    }
    return h;
  }
  function cookResult(r) {
    var p = r.p, ex = '';
    if (r.kind === 'found') ex = '<div class="card hl"><h2 style="margin:0">🎉 새 레시피 발견!</h2><div class="muted">도감에 「' + esc(p.n) + '」이(가) 추가되었습니다</div></div>';
    else if (r.kind === 'known') ex = '<div class="card"><b>이미 아는 레시피: ' + esc(p.n) + '</b></div>';
    else ex = '<div class="card"><h2 style="margin:0">창작 요리</h2>' + (r.cid ? '<div class="row" style="margin-top:6px"><input type="text" id="cname" value="' + esc(p.n) + '" style="flex:1"><button class="btn sm" data-a="cname" data-v="' + r.cid + '">이름 저장</button></div>' : '<p class="muted">창작 요리 칸이 가득 찼습니다(도감에서 정리)</p>') + (r.hint ? '<div class="note tip" style="margin-top:6px">' + esc(r.hint) + '</div>' : '') + '</div>';
    var ref = r.kind === 'custom' ? (r.cid ? 'c:' + r.cid : null) : 'r:' + r.id;
    modal(ex + dishDetail(p, ref ? '<button class="btn pri big" data-a="addclose" data-v="' + ref + '">메뉴에 추가</button>' : ''));
  }

  /* ---------- 도감 ---------- */
  function book() {
    var h = '<div class="card"><div class="seg">' + [['rec', '레시피'], ['mine', '나의 요리'], ['sci', '요리 과학'], ['ing', '재료']].map(function (t) { return '<button data-a="btab" data-v="' + t[0] + '" class="' + (L.bookTab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div></div>';
    var se = season();
    if (L.bookTab === 'rec') {
      var kn = Object.keys(S.known).length;
      h += '<div class="card"><h2>레시피 도감 ' + kn + ' / ' + D.recIds.length + '</h2><div class="bar"><i style="width:' + (kn / D.recIds.length * 100) + '%"></i></div><div class="scroll-x" style="margin-top:10px">' +
        ['all'].concat(Object.keys(D.cuisines)).map(function (c) { return '<span class="chip ' + (L.cuF === c ? 'on' : '') + '" data-a="cuf" data-v="' + c + '">' + (c === 'all' ? '전체' : D.cuisines[c]) + '</span>'; }).join('') + '</div><div class="list">' +
        D.recIds.filter(function (id) { return L.cuF === 'all' || D.rec[id].cu === L.cuF; }).map(function (id) {
          var r = D.rec[id];
          if (!S.known[id]) return '<div class="it"><div class="sp"><div class="nm muted">？？？</div><div class="muted">' + D.cuisines[r.cu] + ' · ' + D.courses[r.co] + ' · ' + (r.src === 'lab' ? '연구실에서만 발견' : r.src === 'start' ? '' : '「' + D.books[r.src].n + '」') + '</div></div></div>';
          var p = CK.recipeProfile(D, id, se);
          return '<div class="it" data-a="detail" data-v="r:' + id + '"><div class="sp"><div class="nm">' + esc(r.n) + (S.found[id] ? ' <span class="tag">직접 발견</span>' : '') + '</div><div class="muted">' + D.cuisines[r.cu] + ' · ' + D.courses[r.co] + ' · ' + D.tech[r.te].n.split('(')[0] + '</div></div><span class="q" style="color:' + qColor(p.q) + '">' + p.q + '</span></div>';
        }).join('') + '</div></div>';
    } else if (L.bookTab === 'mine') {
      var cs = Object.keys(S.custom);
      h += '<div class="card"><h2>나의 창작 요리 ' + cs.length + '/' + D.R.maxCustom + '</h2><div class="list">' + (cs.map(function (cid) {
        var p = CK.dish(D, S, 'c:' + cid, se);
        return '<div class="it"><div class="sp" data-a="detail" data-v="c:' + cid + '"><div class="nm">' + esc(p.n) + '</div><div class="muted">' + D.courses[p.co] + ' · ' + D.tech[p.te].n.split('(')[0] + '</div></div><span class="q" style="color:' + qColor(p.q) + '">' + p.q + '</span><button class="btn sm" data-a="delc" data-v="' + cid + '">삭제</button></div>';
      }).join('') || '<p class="muted">연구실에서 레시피에 없는 조합을 만들면 여기에 저장됩니다.</p>') + '</div></div>';
    } else if (L.bookTab === 'sci') {
      h += '<div class="card"><h2>맛의 원리</h2>' + D.know.map(function (k) { return '<h3>' + esc(k.k) + '</h3><p class="muted" style="margin:0">' + esc(k.t) + '</p>'; }).join('') + '</div>';
      h += '<div class="card"><h2>조리법</h2>' + Object.keys(D.tech).map(function (te) { var t = D.tech[te]; return '<h3>' + t.n + ' <span class="tag">' + CK.TEMPK[t.temp] + '</span><span class="tag">반상: ' + t.g + '</span></h3><p class="muted" style="margin:0">' + esc(t.sci) + '</p>'; }).join('') + '</div>';
      h += '<div class="card"><h2>좋은 짝 · 나쁜 짝</h2>' + D.pairs.map(function (p) { return '<div class="note good">' + p.p.map(pname).join(' + ') + ': ' + esc(p.r) + '</div>'; }).join('') + D.clash.map(function (p) { return '<div class="note bad">' + p.p.map(pname).join(' + ') + ': ' + esc(p.r) + '</div>'; }).join('') + '</div>';
    } else {
      h += '<div class="card"><h2>재료 사전</h2><p class="muted">🌱 = 지금(' + D.R.seasons[se] + ') 제철: 맛이 좋고 20% 싸다. 제철이 아니면 30% 비싸다.</p><div class="list">' + Object.keys(D.ing).map(function (id) {
        var g = D.ing[id], top = CK.TN.map(function (t, j) { return [t, g.t[j]]; }).filter(function (x) { return x[1] >= 1; }).map(function (x) { return CK.TK[x[0]] + ' ' + x[1]; }).join(' · ');
        return '<div class="it"><div class="sp"><div class="nm">' + (g.s && g.s.indexOf(se) >= 0 ? '🌱' : '') + esc(g.n) + ' <span class="muted">' + D.cats[g.c] + '</span></div><div class="muted">' + (top || '맛 약함') + (g.u ? ' · ' + { glu: '글루탐산', ino: '이노신산', gua: '구아닐산' }[g.u] : '') + (g.a ? ' · ' + g.a.map(function (a) { return CK.AK[a]; }).join(',') : '') + (g.s ? ' · 제철 ' + g.s.map(function (x) { return D.R.seasons[x]; }).join('·') : '') + '</div></div><span class="muted">' + won(g.p) + '</span></div>';
      }).join('') + '</div></div>';
    }
    return h;
  }
  function pname(t) { return t.indexOf('cat:') === 0 ? D.cats[t.slice(4)] + '류' : (D.ing[t] ? D.ing[t].n : t); }

  /* ---------- 상점 ---------- */
  function shop() {
    var se = season();
    var h = '<div class="card"><h2>🌱 ' + D.R.seasons[se] + ' 제철 재료</h2><div>' + Object.keys(D.ing).filter(function (id) { return D.ing[id].s && D.ing[id].s.indexOf(se) >= 0; }).map(function (id) { return '<span class="tag">' + esc(D.ing[id].n) + '</span>'; }).join('') + '</div><p class="muted" style="margin:0">계절은 7일마다 바뀝니다.</p></div>';
    h += '<div class="card"><h2>📚 요리책</h2><p class="muted" style="margin-top:0">사면 그 책의 레시피를 모두 얻는다. 연구실에서 직접 찾아내면 공짜!</p><div class="list">' + Object.keys(D.books).map(function (b) {
      var x = D.books[b], own = S.books[b], cnt = D.recIds.filter(function (id) { return D.rec[id].src === b; }), got = cnt.filter(function (id) { return S.known[id]; }).length;
      var lock = x.req && x.req.rep > S.rep;
      return '<div class="it"><div class="sp"><div class="nm">' + esc(x.n) + '</div><div class="muted">' + esc(x.d) + ' · 레시피 ' + got + '/' + cnt.length + (lock ? ' · 평판 ' + x.req.rep + ' 필요' : '') + '</div></div>' + (own ? '<span class="tag">보유</span>' : '<button class="btn sm pri" data-a="buybook" data-v="' + b + '" ' + (lock || S.money < x.price ? 'disabled' : '') + '>' + won(x.price) + '</button>') + '</div>';
    }).join('') + '</div></div>';
    h += '<div class="card"><h2>🔧 주방 설비</h2><div class="list">' + Object.keys(D.equip).map(function (e) {
      var x = D.equip[e], own = S.equip[e], lock = (x.req && x.req.rep > S.rep) || (x.req && x.req.equip && !S.equip[x.req.equip]);
      return '<div class="it"><div class="sp"><div class="nm">' + esc(x.n) + '</div><div class="muted">' + esc(x.d) + (x.req && x.req.rep ? ' · 평판 ' + x.req.rep : '') + '</div></div>' + (own ? '<span class="tag">설치됨</span>' : '<button class="btn sm pri" data-a="buyeq" data-v="' + e + '" ' + (lock || S.money < x.price ? 'disabled' : '') + '>' + won(x.price) + '</button>') + '</div>';
    }).join('') + '</div></div>';
    return h;
  }

  function help() {
    modal('<h2 style="margin-top:0">게임 방법</h2>' +
      '<p><b>1. 메뉴 짜기</b> — 코스 요리 또는 한식 반상을 고르고 요리를 배치하세요. 셰프 노트가 흐름·맛 균형·반복·질감·온도·색·계절·영양을 전문가처럼 평가합니다. S등급에 지적이 하나도 없으면 <b>완벽한 식단</b>.</p>' +
      '<p><b>2. 영업</b> — 손님마다 취향(매운맛 마니아, 채식주의자, 미식가…)과 지갑이 다릅니다. 요리 완성도·식단 점수·취향·가격이 만족도를 정하고, 만족도가 평판을 움직입니다.</p>' +
      '<p><b>3. 평론가</b> — 7일마다 미식 평론가가 와서 별(최대 3개)을 줍니다. 별이 많을수록 손님이 늘고 비싼 값도 받아들입니다.</p>' +
      '<p><b>4. 연구실</b> — 조리법과 재료를 골라 실험하세요. 레시피와 맞으면 새 레시피 발견! 아니면 나만의 창작 요리가 됩니다. "익숙한 맛" 힌트를 따라가세요. 연구실에서만 찾을 수 있는 숨은 레시피도 있습니다.</p>' +
      '<p><b>5. 상점</b> — 요리책으로 레시피를, 설비로 새 조리법(튀김·숯불·오븐·발효·훈연·수비드·셔벗)을 얻습니다. 제철 재료는 싸고 맛있습니다.</p>' +
      '<p class="muted">📖 도감 → 요리 과학에서 맛의 원리(감칠맛 상승효과, 대비·억제효과, 산과 지방, 오방색, 반상 첩수 …)를 볼 수 있습니다.</p>');
  }

  /* ---------- 그리기·이벤트 ---------- */
  function render() {
    header(); nav();
    var y = window.scrollY;
    $('main').innerHTML = { home: home, menu: menu, lab: lab, book: book, shop: shop }[L.tab]();
    window.scrollTo(0, y);
    var lq = $('#lq'); if (lq) lq.addEventListener('input', function () { L.labQ = lq.value; var pos = lq.selectionStart; render(); var n = $('#lq'); n.focus(); n.setSelectionRange(pos, pos); });
    var lc = $('#labco'); if (lc) lc.addEventListener('change', function () { L.labCo = lc.value; render(); });
  }
  function setMenu(items, fmt) { act({ type: 'setMenu', format: fmt || S.menu.format, items: items }); }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]'); if (!el) return;
    var a = el.getAttribute('data-a'), v = el.getAttribute('data-v'), it = S.menu.items.slice();
    switch (a) {
      case 'close': closeModal(); return;
      case 'tab': L.tab = v; window.scrollTo(0, 0); break;
      case 'run': {
        var r = act({ type: 'runDay' });
        if (r.ok) { modal(lastCard(r.res) + '<button class="btn pri big" data-a="close">확인</button>'); if (r.res.critic && r.res.critic.stars > r.res.critic.prev) toast('★ 별을 받았습니다!'); }
        break;
      }
      case 'fmt': setMenu(it, v); break;
      case 'mv': { var k = +v, d = +el.getAttribute('data-d'), j = k + d; if (j < 0 || j >= it.length) return; var t = it[k]; it[k] = it[j]; it[j] = t; setMenu(it); break; }
      case 'rm': it.splice(+v, 1); setMenu(it); break;
      case 'pick': pickModal(); return;
      case 'pickco': L.pickCo = v; pickModal(); return;
      case 'add': it.push(v); setMenu(it); toast('추가했습니다'); render(); pickModal(); return;
      case 'addclose': it.push(v); setMenu(it); closeModal(); toast('메뉴에 추가했습니다'); break;
      case 'detail': { var p = CK.dish(D, S, v); if (p) modal(dishDetail(p, S.menu.items.indexOf(v) < 0 && CK.techOpen(D, S, p.te) ? '<button class="btn pri big" data-a="addclose" data-v="' + v + '">메뉴에 추가</button>' : '')); return; }
      case 'labte': L.labTe = v; break;
      case 'labcat': L.labCat = v; break;
      case 'sel': if (L.labSel.length >= D.R.maxLabIngredients) { toast('재료는 ' + D.R.maxLabIngredients + '가지까지'); return; } L.labSel.push({ id: v, m: 1 }); break;
      case 'unsel': e.stopPropagation(); L.labSel.splice(+v, 1); break;
      case 'amt': { var s = L.labSel[+v]; var idx = AMT.findIndex(function (x) { return x[0] === s.m; }); s.m = AMT[(idx + 1) % AMT.length][0]; break; }
      case 'cook': {
        var r2 = act({ type: 'cook', te: L.labTe, co: L.labCo === 'auto' ? null : L.labCo, i: L.labSel.map(function (s) { return s.m === 1 ? s.id : s.id + '*' + s.m; }) });
        if (r2.ok) { render(); cookResult(r2.res); return; }
        break;
      }
      case 'cname': act({ type: 'renameCustom', cid: v, n: $('#cname').value }); toast('저장했습니다'); break;
      case 'delc': if (confirm('삭제할까요?')) act({ type: 'delCustom', cid: v }); break;
      case 'btab': L.bookTab = v; break;
      case 'cuf': L.cuF = v; break;
      case 'buybook': { var r3 = act({ type: 'buyBook', id: v }); if (r3.ok) toast('레시피 ' + r3.res.got.length + '개를 얻었습니다'); break; }
      case 'buyeq': if (act({ type: 'buyEquip', id: v }).ok) toast('설치했습니다'); break;
      case 'rename': act({ type: 'rename', name: $('#rname').value }); break;
      case 'newgame': if (confirm('처음부터 다시 시작할까요? 지금 진행은 사라집니다.')) { S = CK.newGame(D, (Date.now() % 1e9) + 1); save(); L.tab = 'home'; closeModal(); help(); } break;
      case 'help': help(); return;
    }
    render();
  });
  document.addEventListener('change', function (e) { if (e.target.getAttribute('data-a') === 'price') { act({ type: 'setPrice', rate: e.target.value / 100 }); render(); } });
  document.addEventListener('input', function (e) {
    if (e.target.getAttribute('data-a') === 'price') { var mp = CK.menuPrice(D, S); var b = e.target.parentNode.querySelector('.big'); if (b) b.textContent = won(Math.round(mp.base * e.target.value / 100 / 100) * 100); }
    if (e.target.id === 'pq') return;
  });

  window.CK_BOOT = function (raw) {
    D = CK.makeData(raw);
    S = load();
    var first = !S;
    if (!S) { S = CK.newGame(D, (Date.now() % 1e9) + 1); save(); }
    render();
    if (first) help();
  };
})();
