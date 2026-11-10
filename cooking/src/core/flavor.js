/* 요리 맛 계산 (규칙 core) — 화면·Math.random·Date 를 쓰지 않는다.
   profile(D, spec, season) : 재료+조리법 → 맛·향·질감·온도·무게감·색·원가·완성도(q) + 평가 문구 */
(function (root) {
  'use strict';
  var CK = root.CK = root.CK || {};
  var TN = ['sweet', 'salty', 'sour', 'bitter', 'umami', 'spicy', 'fat'];
  var TK = { sweet: '단맛', salty: '짠맛', sour: '신맛', bitter: '쓴맛', umami: '감칠맛', spicy: '매운맛', fat: '기름진 맛' };
  var AK = { herb: '허브', citrus: '시트러스', roast: '고소한 구운 향', smoke: '훈연', ferment: '발효', floral: '꽃향', earthy: '흙·버섯 향', warm: '따뜻한 향신료', pungent: '알싸한 향', marine: '바다 향', fruity: '과일 향', nutty: '견과 향', dairy: '유제품 향', caramel: '캐러멜·바닐라' };
  var XK = { crispy: '바삭', crunchy: '아삭', creamy: '크리미', chewy: '쫄깃', tender: '부드러운 살', silky: '매끄러운', flaky: '결이 살아 있는', juicy: '촉촉', soft: '폭신', brothy: '국물', crumbly: '부서지는' };
  var TEMPK = { cold: '차가움', room: '상온', warm: '따뜻함', hot: '뜨거움' };
  var COLK = { red: '빨강', orange: '주황', yellow: '노랑', green: '초록', white: '흰색', brown: '갈색', black: '검정', purple: '보라', pink: '분홍' };
  var MEAT = { beef: 1.0, pork: 0.9, lamb: 1.0, poultry: 0.5, fish: 0.4, shellfish: 0.3, egg: 0.2, legume: 0.2 };
  var PROTEIN = { beef: 1, pork: 1, lamb: 1, poultry: 1, fish: 1, shellfish: 1, egg: 1, legume: 1, dairy: 0 };
  var VEG = { veg: 1, leafy: 1, root: 1, mushroom: 1, seaweed: 1 };
  var CARB = { grain: 1, noodle: 1, bread: 1 };
  var NONVEG = { beef: 1, pork: 1, lamb: 1, poultry: 1, fish: 1, shellfish: 1 };
  CK.TN = TN; CK.TK = TK; CK.AK = AK; CK.XK = XK; CK.TEMPK = TEMPK; CK.COLK = COLK;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function r1(v) { return Math.round(v * 10) / 10; }
  CK.clamp = clamp; CK.r1 = r1;

  /* 원본 JSON 묶음 → 게임 표 */
  CK.makeData = function (raw) {
    var D = {
      ing: raw.ingredients.items, cats: raw.ingredients.cats,
      tech: raw.techniques.items, rec: raw.recipes.items,
      cuisines: raw.recipes.cuisines, courses: raw.recipes.courses,
      pairs: raw.pairings.pairs, clash: raw.pairings.clash,
      books: raw.shop.books, equip: raw.shop.equip,
      cust: raw.customers.types, R: raw.rules, know: raw.knowledge.items
    };
    D.recIds = Object.keys(D.rec);
    return D;
  };

  function matchItem(D, tok, ids) {
    if (tok.indexOf('cat:') === 0) { var c = tok.slice(4); return ids.some(function (i) { return D.ing[i] && D.ing[i].c === c; }); }
    return ids.indexOf(tok) >= 0;
  }

  /* "salt*0.4" → ['salt', 0.4] (양: 조금 0.4 / 보통 1 / 많이 1.6) */
  CK.parseI = function (s) { var k = String(s).split('*'); return [k[0], k[1] ? +k[1] : 1]; };
  CK.ids = function (list) { return list.map(function (s) { return CK.parseI(s)[0]; }); };

  /* 한 그릇의 맛 프로필 */
  CK.profile = function (D, spec, season) {
    var tech = D.tech[spec.te] || D.tech.raw;
    var parts = spec.i.map(CK.parseI).filter(function (p) { return D.ing[p[0]]; });
    var ids = parts.map(function (p) { return p[0]; });
    var acc = TN.map(function () { return 1; });
    var aro = {}, tex = {}, cols = {}, us = {}, cost = 0, inSeason = 0, seasonal = 0, nonveg = false;
    var hasProtein = false, hasVeg = false, hasCarb = false, unsafe = [];
    parts.forEach(function (pa, k) {
      var id = pa[0], am = pa[1], g = D.ing[id];
      g.t.forEach(function (v, j) { if (v > 0) acc[j] *= 1 - Math.min(v * am, 5.9) / 6; });
      if (am >= 0.3) (g.a || []).forEach(function (a) { aro[a] = (aro[a] || 0) + 1; });
      (g.x || []).forEach(function (x) { tex[x] = 1; });
      if (g.col && am >= 0.5) cols[g.col] = (cols[g.col] || 0) + (k === 0 ? 2 : 1);
      if (g.u) us[g.u] = 1;
      var m = 1;
      if (g.s) {
        var ins = g.s.indexOf(season) >= 0;
        m = ins ? D.R.seasonCostIn : D.R.seasonCostOut;
        if (g.r !== 's') { seasonal++; if (ins) inSeason++; }
      }
      cost += g.p * m * am;
      if (NONVEG[g.c] || g.nv) nonveg = true;
      if (PROTEIN[g.c]) hasProtein = true;
      if (VEG[g.c] || (g.c === 'fruit' && g.r !== 's')) hasVeg = true;
      if (CARB[g.c] || (g.c === 'root' && (id === 'potato' || id === 'sweet_potato'))) hasCarb = true;
      if ((spec.te === 'raw' || spec.te === 'cure') && g.raw === 0) unsafe.push(g.n);
    });
    var t = {};
    TN.forEach(function (n, j) { t[n] = clamp(6 * (1 - acc[j]) + (tech.t[j] || 0) * (ids.length ? 1 : 0), 0, 5); });
    (tech.a || []).forEach(function (a) { aro[a] = (aro[a] || 0) + 2; });
    (tech.rm || []).forEach(function (x) { delete tex[x]; });
    (tech.x || []).forEach(function (x) { tex[x] = 1; });
    if (tex.brothy && spec.co !== 'guk' && spec.co !== 'soup') delete tex.brothy;
    (spec.x || []).forEach(function (x) { tex[x] = 1; });
    if (['panfry', 'grill', 'roast', 'deepfry', 'bake', 'smoke'].indexOf(spec.te) >= 0) cols.brown = (cols.brown || 0) + 1;
    var main = D.ing[ids[0]] || { c: 'veg', n: '?' };
    var sweetCourse = spec.co === 'dessert';
    var w = sweetCourse ? 1 + t.fat * 0.35 + t.sweet * 0.15 + tech.w * 0.5
      : 1 + t.fat * 0.4 + (MEAT[main.c] || 0) + (hasCarb ? 0.5 : 0) + tech.w + (t.umami > 3 ? 0.3 : 0);
    w = clamp(w, 1, 5);

    /* 지각되는 맛: 상승·억제·대비 효과 */
    var syn = !!(us.glu && (us.ino || us.gua));
    var pt = {};
    TN.forEach(function (n) { pt[n] = t[n]; });
    pt.bitter = Math.max(0, t.bitter - 0.25 * t.salty - 0.2 * t.sweet);
    pt.sour = Math.max(0, t.sour - 0.2 * t.sweet);
    pt.spicy = Math.max(0, t.spicy - 0.12 * t.fat - 0.1 * t.sweet);
    pt.umami = Math.min(5, t.umami * (syn ? 1.25 : 1));
    if (sweetCourse && t.salty >= 0.2 && t.salty <= 1.3) pt.sweet = Math.min(5, t.sweet * 1.1);
    var temp = spec.temp || tech.temp;
    if (sweetCourse && temp === 'cold') pt.sweet *= 0.9;
    TN.forEach(function (n) { pt[n] = r1(pt[n]); t[n] = r1(t[n]); });

    var notes = [], q = 62;
    function add(dq, k, s) { q += dq; notes.push({ k: k, t: s, v: dq }); }
    var aroN = Object.keys(aro).length, texN = Object.keys(tex).length;
    var intensity = pt.sweet + pt.salty + pt.sour + pt.bitter + pt.umami + pt.spicy;
    var cutter = pt.sour >= 1 || pt.spicy >= 1.5 || aro.pungent || aro.citrus || aro.herb || aro.ferment;

    if (unsafe.length) add(-45, 'bad', '식중독 위험! ' + unsafe.join('·') + '은(는) 날로 쓰면 안 된다 (식품 안전)');
    if (!ids.length) add(-60, 'bad', '재료가 없다');
    if (sweetCourse) {
      if (pt.sweet < 1.5) add(-15, 'bad', '디저트인데 단맛이 약하다');
      else if (pt.sweet > 4.6 && pt.sour < 0.8 && pt.bitter < 0.8) add(-6, 'bad', '단맛만 강해 물린다 — 산미나 쌉쌀함으로 받쳐 주자');
      else add(4, 'good', '디저트의 단맛이 적당하다');
      if (t.salty > 1.6) add(-14, 'bad', '디저트가 짜다');
      else if (t.salty >= 0.2) add(5, 'good', '소금 한 꼬집이 단맛을 키운다 (대비효과)');
      if (t.bitter >= 1.2 && t.sweet >= 2) add(4, 'good', '단맛이 쓴맛을 눌러 쌉싸름한 깊이가 된다 (억제효과)');
    } else if (spec.co !== 'cleanser' && spec.co !== 'rice') {
      if (pt.salty < 0.8 && pt.umami < 2) add(-10, 'bad', '간이 싱겁다 — 소금·장으로 간을 하자');
      else if (pt.salty > (spec.co === 'kimchi' ? 4.6 : 4.2)) add(-15, 'bad', '너무 짜다');
      else if (pt.salty >= 1.2 && pt.salty <= 3.5) add(4, 'good', '간이 알맞다');
      if (pt.sweet > 3.5 && pt.sour < 1 && pt.salty < 1.5) add(-6, 'bad', '식사 요리치고 너무 달다');
      if (pt.sweet >= 1.5 && pt.salty >= 1.5) add(3, 'good', '단짠의 균형');
    } else if (spec.co === 'cleanser') {
      if (pt.sour >= 1.5 || temp === 'cold') add(8, 'good', '차갑고 새콤해 입을 씻어 준다');
      else add(-10, 'bad', '입가심인데 새콤함·차가움이 부족하다');
      if (t.fat > 2) add(-8, 'bad', '입가심이 기름지다');
    }
    if (t.fat >= 3 && !cutter && !sweetCourse) add(-12, 'bad', '느끼하다 — 산미(식초·레몬·김치)나 향신 재료로 기름을 잡자');
    else if (t.fat >= 2 && pt.sour >= 1.2) add(6, 'good', '산미가 기름을 깔끔하게 정리한다 (산과 지방의 균형)');
    if (syn) add(8, 'good', '감칠맛 상승효과 (글루탐산 × ' + (us.ino ? '이노신산' : '구아닐산') + ')');
    else if (pt.umami >= 2.5 && !sweetCourse) add(3, 'good', '감칠맛이 풍부하다');
    if (intensity < 2 && spec.co !== 'rice') add(-10, 'bad', '맛이 밋밋하다');
    if (intensity > 15) add(-8, 'bad', '맛이 너무 많아 무엇을 먹는지 모르겠다');
    if (pt.bitter >= 2.5 && !sweetCourse) add(-10, 'bad', '쓴맛이 튄다 — 소금·단맛·지방으로 눌러 주자 (억제효과)');
    if (pt.spicy >= 4) add(-6, 'bad', '매운 자극이 지나치다 — 지방·유제품·단맛으로 누그러뜨리자');
    else if (t.spicy >= 2.5 && pt.spicy < t.spicy - 0.4) add(3, 'good', '지방·단맛이 매운맛을 둥글게 감싼다');
    if (aroN === 0 && spec.co !== 'rice') add(-6, 'bad', '향이 없다 — 허브·향신료·굽기로 향을 더하자');
    else if (aroN >= 2 && aroN <= 4) add(4, 'good', '향의 층이 적당하다 (' + Object.keys(aro).map(function (a) { return AK[a]; }).join(', ') + ')');
    else if (aroN >= 7) add(-6, 'bad', '향이 너무 많아 탁하다');
    if (texN >= 2) add(3, 'good', '질감이 두 가지 이상이다');
    var pairHit = 0;
    D.pairs.forEach(function (p) {
      if (pairHit < 3 && matchItem(D, p.p[0], ids) && matchItem(D, p.p[1], ids)) { pairHit++; add(5, 'good', '좋은 짝: ' + p.r); }
    });
    D.clash.forEach(function (p) {
      if (p.tech && p.tech.indexOf(spec.te) < 0) return;
      if (matchItem(D, p.p[0], ids) && matchItem(D, p.p[1], ids)) add(-9, 'bad', '충돌: ' + p.r);
    });
    var sfit = seasonal ? inSeason / seasonal : 0.5;
    if (seasonal && sfit >= 0.99) add(4, 'good', '제철 재료로 만들었다');
    else if (seasonal && sfit === 0) add(-4, 'bad', '제철이 아닌 재료라 맛이 덜 오르고 비싸다');
    if (spec.classic) add(D.R.classicBonus, 'good', '검증된 정통 레시피');
    q = Math.round(clamp(q, 0, 100));

    var colList = Object.keys(cols).sort(function (a, b) { return cols[b] - cols[a]; });
    var domAro = Object.keys(aro).sort(function (a, b) { return aro[b] - aro[a]; })[0] || null;
    return {
      id: spec.id || null, n: spec.n, cu: spec.cu || 'fu', co: spec.co, te: spec.te, i: ids.slice(),
      t: t, pt: pt, aro: Object.keys(aro), domAro: domAro, tex: Object.keys(tex), temp: temp,
      w: r1(w), col: colList.slice(0, 3), main: ids[0] || null, amt: parts.map(function (p) { return p[1]; }), cat: main.c,
      cost: Math.round(cost), price: Math.ceil(cost / D.R.foodCostRate / 1000) * 1000,
      q: q, notes: notes, syn: syn, veg: !nonveg, sfit: sfit,
      nut: { protein: hasProtein, veg: hasVeg, carb: hasCarb }
    };
  };

  /* 레시피 id → 프로필 (계절별 캐시 없이 매번 계산: 데이터가 작아 충분히 빠름) */
  CK.recipeProfile = function (D, id, season) {
    var r = D.rec[id];
    return CK.profile(D, { id: id, n: r.n, cu: r.cu, co: r.co, te: r.te, i: r.i, temp: r.temp, x: r.x, classic: true }, season);
  };
})(typeof window !== 'undefined' ? window : global);
