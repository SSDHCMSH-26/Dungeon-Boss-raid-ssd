/* 식단(메뉴) 평가 — 코스 / 한식 반상.  evalMenu(D, profiles[], format, season) → {score, grade, sub[], notes[], perfect}
   profiles 는 CK.profile 결과(순서 = 내는 순서). */
(function (root) {
  'use strict';
  var CK = root.CK = root.CK || {};
  var clamp = CK.clamp;
  // 코스의 정석 순서 (식사(staple)는 앞뒤로 유연)
  var ORDER = { amuse: 0, app: 1, soup: 2, salad: 2.5, fish: 3, staple: 3.5, cleanser: 4, main: 5, banchan: 5, rice: 5.5, guk: 5.5, kimchi: 5.5, dessert: 7 };
  var OBANG = { green: '청', red: '적', pink: '적', orange: '황', yellow: '황', white: '백', black: '흑', brown: '흑', purple: '흑' };
  var MEATCAT = { beef: 1, pork: 1, lamb: 1, poultry: 1 }, SEACAT = { fish: 1, shellfish: 1 };
  var GROUPN = { '생채': '생채(날것·초절임)', '숙채': '숙채(나물)', '구이': '구이', '조림': '조림', '전': '전', '볶음': '볶음', '찜': '찜', '튀김': '튀김', '수육': '수육', '김치·젓갈': '젓갈·발효', '국': '국', '찌개': '찌개', '후식': '후식' };

  function grade(s) { return s >= 92 ? 'S' : s >= 82 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : 'D'; }
  CK.grade = grade;
  function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }

  function Ctx() { this.notes = []; }
  Ctx.prototype.n = function (k, cat, t) { this.notes.push({ k: k, c: cat, t: t }); };

  function common(D, P, season, ctx, sub) {
    // 맛 균형: 각 요리 완성도 + 메뉴 전체 맛 분포
    var qAvg = avg(P.map(function (p) { return p.q; }));
    var s = qAvg;
    var savory = P.filter(function (p) { return p.co !== 'dessert' && p.co !== 'cleanser'; });
    var salty = avg(savory.map(function (p) { return p.pt.salty; }));
    if (savory.length >= 3 && salty > 3.2) { s -= 10; ctx.n('bad', '맛', '메뉴 전체가 짜다 (평균 짠맛 ' + salty.toFixed(1) + ') — 담백한 요리로 쉬어 가자'); }
    var spicyN = savory.filter(function (p) { return p.pt.spicy >= 2.3; }).length;
    if (savory.length >= 3 && spicyN / savory.length > 0.5) { s -= 10; ctx.n('bad', '맛', '매운 요리가 절반이 넘는다 — 혀가 지쳐 다른 맛을 못 느낀다 (매운맛은 통증)'); }
    else if (spicyN >= 1 && spicyN < savory.length) ctx.n('good', '맛', '매운 요리와 순한 요리가 섞여 있다');
    if (!P.some(function (p) { return p.pt.sour >= 1.5; })) { s -= 8; ctx.n('bad', '맛', '메뉴에 산미가 하나도 없다 — 새콤한 요리가 전체를 밝게 만든다'); }
    if (P.some(function (p) { return p.syn; })) ctx.n('good', '맛', '감칠맛 상승효과를 쓴 요리가 있다');
    P.forEach(function (p) { if (p.q < 60) ctx.n('bad', '맛', '「' + p.n + '」 완성도가 낮다 (' + p.q + '점): ' + ((p.notes.filter(function (x) { return x.k === 'bad'; })[0] || {}).t || '')); });
    if (P.some(function (p) { return p.notes.some(function (x) { return x.t.indexOf('식중독') === 0; }); })) { s -= 40; ctx.n('bad', '맛', '식중독 위험 요리가 있다! 손님에게 낼 수 없다'); }
    sub.push({ k: 'taste', n: '맛 균형', s: clamp(s, 0, 100) });

    // 계절감
    var sf = avg(P.map(function (p) { return p.sfit; }));
    var ss = clamp(30 + sf * 80, 0, 100);
    if (sf >= 0.75) ctx.n('good', '계절', D.R.seasons[season] + ' 제철 재료가 잘 쓰였다');
    else if (sf < 0.35) ctx.n('tip', '계절', D.R.seasons[season] + '에는 제철 재료를 더 써 보자 (상점 → 제철 재료)');
    sub.push({ k: 'season', n: '계절감', s: ss });

    // 영양
    var nu = { protein: 0, veg: 0, carb: 0 };
    P.forEach(function (p) { if (p.nut.protein) nu.protein++; if (p.nut.veg) nu.veg++; if (p.nut.carb) nu.carb++; });
    var ns = 100;
    if (!nu.protein) { ns -= 35; ctx.n('bad', '영양', '단백질 요리가 없다'); }
    if (!nu.carb) { ns -= 20; ctx.n('bad', '영양', '탄수화물(밥·면·빵)이 없다 — 든든함이 부족하다'); }
    if (nu.veg < Math.max(1, Math.round(P.length / 3))) { ns -= 25; ctx.n('bad', '영양', '채소 요리가 부족하다'); }
    if (ns === 100) ctx.n('good', '영양', '단백질·탄수화물·채소가 고루 있다');
    sub.push({ k: 'nut', n: '영양', s: clamp(ns, 0, 100) });
  }

  function evalCourse(D, P, season) {
    var ctx = new Ctx(), sub = [], n = P.length, i;
    // 1. 구성
    var s = 100;
    if (n < D.R.courseMin) { s -= 40; ctx.n('bad', '구성', '코스는 최소 ' + D.R.courseMin + '접시가 필요하다'); }
    if (n > 8) { s -= 10; ctx.n('bad', '구성', '접시가 너무 많아 손님이 지친다'); }
    var centerIdx = -1;
    P.forEach(function (p, k) { if (p.co === 'main') centerIdx = k; });
    if (centerIdx < 0) P.forEach(function (p, k) { if (p.co === 'fish' || p.co === 'staple') centerIdx = k; });
    if (centerIdx < 0) { s -= 30; ctx.n('bad', '구성', '코스의 중심(메인·생선·식사)이 없다'); }
    var last = P[n - 1];
    if (last && last.co === 'dessert') ctx.n('good', '구성', '디저트로 마무리한다');
    else { s -= 30; ctx.n('bad', '구성', '마지막은 디저트(또는 단 것)로 끝내는 것이 정석'); }
    var dIdx = P.map(function (p) { return p.co; }).indexOf('dessert');
    if (dIdx >= 0 && dIdx < n - 1 && P.slice(dIdx + 1).some(function (p) { return p.co !== 'dessert' && p.co !== 'cleanser'; })) { s -= 20; ctx.n('bad', '구성', '디저트 뒤에 짠 요리가 나온다'); }
    var inv = 0;
    for (i = 1; i < n; i++) if ((ORDER[P[i].co] || 0) + 0.6 < (ORDER[P[i - 1].co] || 0)) inv++;
    if (inv) { s -= inv * 10; ctx.n('bad', '구성', '순서가 어긋난 곳이 ' + inv + '곳 (정석: 아뮤즈 → 전채 → 수프 → 생선 → 입가심 → 메인 → 디저트)'); }
    if (P[0] && (P[0].co === 'amuse' || P[0].co === 'app')) ctx.n('good', '구성', '가벼운 한 입으로 시작한다');
    var mains = P.filter(function (p) { return p.co === 'main'; }).length;
    if (mains > 2) { s -= 20; ctx.n('bad', '구성', '메인이 ' + mains + '개 — 주인공이 너무 많다'); }
    sub.push({ k: 'struct', n: '코스 구성', s: clamp(s, 0, 100) });

    // 2. 흐름(무게감)
    s = 100;
    if (P[0] && P[0].w >= 3.5) { s -= 20; ctx.n('bad', '흐름', '첫 접시(' + P[0].n + ')가 너무 묵직하다 — 식욕을 여는 가벼운 것으로'); }
    for (i = 1; i < n; i++) if (P[i].w >= 3.6 && P[i - 1].w >= 3.6) { s -= 15; ctx.n('bad', '흐름', '「' + P[i - 1].n + '」→「' + P[i].n + '」 무거운 요리가 연달아 나온다'); }
    if (centerIdx >= 0) {
      var peak = P[centerIdx].w, up = 0, upn = 0;
      for (i = 1; i <= centerIdx; i++) { if (P[i].co === 'cleanser') continue; upn++; if (P[i].w >= P[i - 1].w - 0.3) up++; }
      if (upn >= 2 && up / upn >= 0.7) ctx.n('good', '흐름', '무게감이 메인을 향해 차곡차곡 올라간다');
      else if (upn >= 2) { s -= 10; ctx.n('bad', '흐름', '무게감이 오르내린다 — 가벼운 것에서 진한 것으로'); }
      for (i = centerIdx + 1; i < n; i++) if (P[i].co !== 'dessert' && P[i].w > peak + 0.3) { s -= 12; ctx.n('bad', '흐름', '메인보다 무거운 「' + P[i].n + '」이(가) 뒤에 나온다'); }
    }
    if (last && last.co === 'dessert' && last.w >= 4) { s -= 10; ctx.n('bad', '흐름', '디저트가 너무 무겁다 — 배부른 손님에게는 가벼운 마무리'); }
    sub.push({ k: 'flow', n: '흐름', s: clamp(s, 0, 100) });

    common(D, P, season, ctx, sub);

    // 반복 피하기
    s = 100;
    var catCount = {}, techCount = {};
    for (i = 0; i < n; i++) {
      var p = P[i];
      if (p.co !== 'dessert' && p.co !== 'cleanser') catCount[p.cat] = (catCount[p.cat] || 0) + 1;
      techCount[p.te] = (techCount[p.te] || 0) + 1;
      if (i && p.co !== 'dessert' && P[i - 1].cat === p.cat && P[i - 1].co !== 'dessert') { s -= 15; ctx.n('bad', '반복', '「' + P[i - 1].n + '」→「' + p.n + '」 같은 주재료(' + (D.cats[p.cat] || p.cat) + ')가 연달아 나온다'); }
      if (i && P[i - 1].te === p.te) { s -= 10; ctx.n('bad', '반복', '같은 조리법(' + D.tech[p.te].n + ')이 연달아 나온다'); }
      if (i && p.domAro && P[i - 1].domAro === p.domAro && p.co !== 'dessert') { s -= 5; ctx.n('tip', '반복', '「' + p.n + '」 앞 접시와 같은 향(' + CK.AK[p.domAro] + ')이 주도한다'); }
    }
    Object.keys(catCount).forEach(function (c) { if (catCount[c] >= 3) { s -= 10; ctx.n('bad', '반복', D.cats[c] + ' 요리가 ' + catCount[c] + '번이나 나온다'); } });
    var techN = Object.keys(techCount).length;
    if (n >= 4 && techN >= n - 1) ctx.n('good', '반복', '조리법이 ' + techN + '가지로 다채롭다');
    sub.push({ k: 'variety', n: '다양성', s: clamp(s, 0, 100) });

    // 질감·온도
    s = 60;
    var texAll = {};
    P.forEach(function (p) { p.tex.forEach(function (x) { texAll[x] = 1; }); });
    var texN = Object.keys(texAll).length;
    s += Math.min(30, texN * 5);
    if (texAll.crispy || texAll.crunchy) ctx.n('good', '질감', '바삭·아삭한 식감이 있다'); else { s -= 12; ctx.n('bad', '질감', '바삭하거나 아삭한 것이 하나도 없다 — 입이 심심하다'); }
    var hot = P.some(function (p) { return p.temp === 'hot' || p.temp === 'warm'; }), cold = P.some(function (p) { return p.temp === 'cold' || p.temp === 'room'; });
    if (hot && cold) { s += 10; ctx.n('good', '온도', '뜨거운 것과 차가운 것이 번갈아 나온다'); } else { s -= 10; ctx.n('bad', '온도', '온도 대비가 없다 (모두 ' + (hot ? '뜨겁다' : '차갑다') + ')'); }
    sub.push({ k: 'texture', n: '질감·온도', s: clamp(s, 0, 100) });

    // 색감
    var colAll = {};
    P.forEach(function (p) { p.col.forEach(function (c) { colAll[c] = 1; }); });
    var cN = Object.keys(colAll).length;
    s = clamp(30 + cN * 12, 0, 100);
    if (cN >= 5) ctx.n('good', '색', '색이 다채롭다 (' + Object.keys(colAll).map(function (c) { return CK.COLK[c]; }).join('·') + ')');
    else if (cN <= 3) ctx.n('bad', '색', '색이 단조롭다 — 초록 채소나 붉은 재료로 생기를');
    sub.push({ k: 'color', n: '색감', s: s });

    // 조화(문화권·향 연결) + 입가심
    s = 70;
    var cuC = {};
    P.forEach(function (p) { cuC[p.cu] = (cuC[p.cu] || 0) + 1; });
    var cuTop = Object.keys(cuC).sort(function (a, b) { return cuC[b] - cuC[a]; })[0];
    var cuShare = cuC[cuTop] / n, cuN = Object.keys(cuC).length;
    if (cuShare >= 0.7) { s += 15; ctx.n('good', '조화', D.cuisines[cuTop] + ' 콘셉트가 일관된다'); }
    else if (cuN >= 4) { s -= 15; ctx.n('bad', '조화', cuN + '개 나라 요리가 섞여 콘셉트가 흐릿하다'); }
    var bridge = 0;
    for (i = 1; i < n; i++) if (P[i].aro.some(function (a) { return P[i - 1].aro.indexOf(a) >= 0 && a !== P[i - 1].domAro; })) bridge++;
    if (n > 1 && bridge / (n - 1) >= 0.5) { s += 10; ctx.n('good', '조화', '앞뒤 접시가 공통 향으로 자연스럽게 이어진다'); }
    for (i = 0; i < n - 1; i++) {
      if (P[i].t.fat >= 3 && P[i].co !== 'dessert') {
        var nx = P[i + 1];
        if (nx.co === 'cleanser' || nx.pt.sour >= 1.5) { s += 6; ctx.n('good', '입가심', '기름진 「' + P[i].n + '」 뒤에 새콤한 「' + nx.n + '」로 입을 씻는다'); }
        else if (nx.t.fat >= 3 && nx.co !== 'dessert') { s -= 8; ctx.n('tip', '입가심', '「' + P[i].n + '」 다음에 입가심(셔벗·초절임)을 넣어 보자'); }
      }
    }
    sub.push({ k: 'harmony', n: '조화·연결', s: clamp(s, 0, 100) });
    return finish(sub, ctx, { struct: 14, flow: 14, taste: 20, variety: 14, texture: 10, color: 6, harmony: 10, season: 6, nut: 6 });
  }

  function evalBansang(D, P, season) {
    var ctx = new Ctx(), sub = [];
    var role = function (p) {
      if (p.co === 'rice') return 'rice';
      if (p.co === 'guk' || p.co === 'soup') return 'guk';
      if (p.co === 'kimchi') return 'kimchi';
      if (p.co === 'dessert' || p.co === 'cleanser') return 'after';
      return 'chan';
    };
    var R = { rice: [], guk: [], kimchi: [], chan: [], after: [] };
    P.forEach(function (p) { R[role(p)].push(p); });
    var s = 100;
    if (!R.rice.length) { s -= 35; ctx.n('bad', '구성', '밥이 없다 — 반상의 중심은 밥'); }
    if (!R.guk.length) { s -= 25; ctx.n('bad', '구성', '국이나 찌개가 없다'); }
    if (!R.kimchi.length) { s -= 25; ctx.n('bad', '구성', '김치가 없다'); }
    if (R.rice.length > 1) { s -= 10; ctx.n('bad', '구성', '밥이 두 가지다'); }
    if (R.guk.length > 2) { s -= 10; ctx.n('bad', '구성', '국물 요리가 너무 많다'); }
    var cheop = R.chan.length;
    var cheopName = cheop >= 12 ? '12첩(수라상)' : cheop >= 9 ? '9첩' : cheop >= 7 ? '7첩' : cheop >= 5 ? '5첩' : cheop >= 3 ? '3첩' : (cheop + '찬');
    if (cheop < 3) { s -= 25; ctx.n('bad', '구성', '반찬이 ' + cheop + '가지 — 최소 3첩(반찬 3가지)은 차리자'); }
    else ctx.n('good', '구성', cheopName + ' 반상');
    if (R.after.length) ctx.n('good', '구성', '후식(' + R.after.map(function (p) { return p.n; }).join(', ') + ')까지 낸다');
    sub.push({ k: 'struct', n: '기본 구성', s: clamp(s, 0, 100) });

    // 첩수와 조리법
    s = 100;
    var g = {};
    R.chan.forEach(function (p) { var k = D.tech[p.te].g; (g[k] = g[k] || []).push(p.n); });
    Object.keys(g).forEach(function (k) { if (g[k].length >= 2) { s -= 12 * (g[k].length - 1); ctx.n('bad', '조리법', (GROUPN[k] || k) + '이(가) 겹친다: ' + g[k].join(', ')); } });
    var hasNamul = g['숙채'] || g['생채'], hasMainChan = g['구이'] || g['조림'] || g['찜'] || g['수육'] || g['튀김'];
    if (cheop >= 3) {
      if (!hasNamul) { s -= 15; ctx.n('bad', '조리법', '나물(생채·숙채)이 없다 — 3첩부터 기본'); }
      if (!hasMainChan) { s -= 15; ctx.n('bad', '조리법', '구이나 조림이 없다 — 반상의 주찬'); }
      if (hasNamul && hasMainChan) ctx.n('good', '조리법', '나물과 주찬(구이·조림)이 갖춰졌다');
    }
    if (cheop >= 5 && !g['전']) { s -= 8; ctx.n('tip', '조리법', '5첩 이상이면 전이 하나 있으면 좋다'); }
    if (Object.keys(g).length >= Math.min(cheop, 5) && cheop >= 3) ctx.n('good', '조리법', '반찬 조리법이 ' + Object.keys(g).length + '가지로 겹치지 않는다');
    sub.push({ k: 'variety', n: '첩수·조리법', s: clamp(s, 0, 100) });

    common(D, P, season, ctx, sub);
    var gukSpicy = R.guk.some(function (p) { return p.pt.spicy >= 2; });
    var mild = R.chan.filter(function (p) { return p.pt.spicy < 1 && p.pt.salty < 2.6; }).length;
    if (R.chan.length && !mild) ctx.n('bad', '맛', '맵거나 짜지 않은 담백한 반찬이 하나는 있어야 한다');
    if (gukSpicy && R.kimchi.length && R.chan.filter(function (p) { return p.pt.spicy >= 2; }).length >= 2) ctx.n('tip', '맛', '찌개·김치가 매우니 반찬은 순하게 맞추자');

    // 오방색
    var ob = {};
    P.forEach(function (p) { p.col.forEach(function (c) { if (OBANG[c]) ob[OBANG[c]] = 1; }); });
    var obN = Object.keys(ob).length;
    s = clamp(obN * 20, 0, 100);
    if (obN === 5) ctx.n('good', '오방색', '청·적·황·백·흑 오방색이 모두 담겼다');
    else ctx.n('tip', '오방색', '빠진 색: ' + ['청', '적', '황', '백', '흑'].filter(function (c) { return !ob[c]; }).join('·') + ' (오방색)');
    sub.push({ k: 'color', n: '오방색', s: s });

    // 재료 다양성 (육·해·채)
    s = 100;
    var cc = {};
    R.chan.concat(R.guk).forEach(function (p) { cc[p.cat] = (cc[p.cat] || 0) + 1; });
    Object.keys(cc).forEach(function (c) { if (cc[c] >= 2 && !/^(veg|leafy|root)$/.test(c)) { s -= 12 * (cc[c] - 1); ctx.n('bad', '재료', D.cats[c] + ' 주재료가 ' + cc[c] + '번 겹친다'); } });
    var meat = P.some(function (p) { return MEATCAT[p.cat]; }), sea = P.some(function (p) { return SEACAT[p.cat]; }), veg = R.chan.some(function (p) { return /^(veg|leafy|root|mushroom|seaweed|legume)$/.test(p.cat); });
    if (meat && sea && veg) { s += 0; ctx.n('good', '재료', '육(고기)·해(해산물)·채(채소)가 고루 있다'); }
    else { s -= 15; ctx.n('tip', '재료', '빠진 쪽: ' + [meat ? '' : '고기', sea ? '' : '해산물', veg ? '' : '채소'].filter(Boolean).join('·')); }
    var temps = {};
    P.forEach(function (p) { temps[p.temp] = 1; });
    if ((temps.hot || temps.warm) && (temps.cold || temps.room)) ctx.n('good', '온도', '따뜻한 국·찬 반찬의 온도 대비'); else s -= 10;
    sub.push({ k: 'harmony', n: '재료·온도', s: clamp(s, 0, 100) });
    return finish(sub, ctx, { struct: 18, variety: 18, taste: 22, color: 10, harmony: 14, season: 9, nut: 9 });
  }

  function finish(sub, ctx, W) {
    var tot = 0, ws = 0;
    sub.forEach(function (x) { x.s = Math.round(x.s); x.w = W[x.k] || 0; tot += x.s * x.w; ws += x.w; });
    var bad = ctx.notes.filter(function (x) { return x.k === 'bad'; }).length;
    var score = Math.round(clamp(tot / ws - bad * 1.5, 0, 100));
    var perfect = score >= 92 && bad === 0;
    if (perfect) ctx.notes.unshift({ k: 'good', c: '총평', t: '★ 완벽한 식단! 흠잡을 곳이 없다' });
    return { score: score, grade: grade(score), sub: sub, notes: ctx.notes, perfect: perfect };
  }

  CK.evalMenu = function (D, P, format, season) {
    if (!P.length) return { score: 0, grade: 'D', sub: [], notes: [{ k: 'tip', c: '구성', t: '요리를 추가하세요' }], perfect: false };
    return format === 'bansang' ? evalBansang(D, P, season) : evalCourse(D, P, season);
  };
})(typeof window !== 'undefined' ? window : global);
