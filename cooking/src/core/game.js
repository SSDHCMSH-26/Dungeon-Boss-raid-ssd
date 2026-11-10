/* 게임 상태와 행동(apply) — 식당 운영 규칙. 무작위는 상태 안의 씨앗(S.rng)만 쓴다. */
(function (root) {
  'use strict';
  var CK = root.CK = root.CK || {};
  var clamp = CK.clamp;

  function rnd(S) { // mulberry32
    var t = (S.rng = (S.rng + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  CK.rnd = rnd;

  CK.newGame = function (D, seed) {
    var R = D.R, S = {
      v: 1, rng: (seed >>> 0) || 1, day: 1, money: R.startMoney, rep: R.startRep, stars: 0, seats: R.startSeats,
      known: {}, books: {}, equip: {}, custom: {}, nextCid: 1, found: {},
      menu: { format: 'course', items: [] }, priceRate: 1.0, skill: {},
      stats: { served: 0, revenue: 0, profit: 0, bestScore: 0, perfect: 0, critic: [] },
      last: null, rumor: null, over: false, name: '나의 작은 식당'
    };
    D.recIds.forEach(function (id) { if (D.rec[id].src === 'start') S.known[id] = 1; });
    S.menu.items = ['r:jeyuk', 'r:bulgogi', 'r:tteokbokki'];
    return S;
  };

  CK.season = function (D, S) { return Math.floor((S.day - 1) / D.R.seasonDays) % 4; };
  CK.techOpen = function (D, S, te) { var t = D.tech[te]; return !!t && (!t.eq || !!S.equip[t.eq]); };
  CK.level = function (D, S, te) { return Math.min(D.R.skillMax, Math.floor(Math.sqrt((S.skill[te] || 0) / D.R.skillXpPerLevel))); };
  CK.execRate = function (D, S, te) { return D.R.skillBase + D.R.skillPerLevel * CK.level(D, S, te); };

  CK.dish = function (D, S, ref, season) {
    if (season == null) season = CK.season(D, S);
    var k = ref.slice(0, 2), id = ref.slice(2);
    if (k === 'r:' && D.rec[id]) return CK.recipeProfile(D, id, season);
    if (k === 'c:' && S.custom[id]) { var c = S.custom[id]; var p = CK.profile(D, { id: ref, n: c.n, cu: 'fu', co: c.co, te: c.te, i: c.i }, season); p.custom = true; return p; }
    return null;
  };
  CK.menuProfiles = function (D, S, season) {
    return S.menu.items.map(function (r) { return CK.dish(D, S, r, season); }).filter(Boolean);
  };
  CK.evalCurrent = function (D, S) { var s = CK.season(D, S); return CK.evalMenu(D, CK.menuProfiles(D, S, s), S.menu.format, s); };
  CK.menuPrice = function (D, S) {
    var P = CK.menuProfiles(D, S), base = 0, cost = 0;
    P.forEach(function (p) { base += p.price; cost += p.cost; });
    return { base: base, cost: cost, price: Math.round(base * S.priceRate / 100) * 100 };
  };
  /* 연구실: 만든 요리의 코스 종류 추측 */
  CK.guessCourse = function (p) {
    if (p.pt.sweet >= 2.5 && p.pt.salty < 1.3) return p.temp === 'cold' && p.pt.sour >= 1.5 && p.t.fat < 1 ? 'cleanser' : 'dessert';
    if (p.tex.indexOf('brothy') >= 0) return 'soup';
    if (p.nut.carb && (p.cat === 'grain' || p.cat === 'noodle' || p.cat === 'bread')) return 'staple';
    if (p.cat === 'fish' || p.cat === 'shellfish') return 'fish';
    if (p.w >= 3) return 'main';
    if (p.w <= 1.6 && !p.nut.protein) return 'salad';
    return 'app';
  };
  function findRecipe(D, te, ids) {
    var best = null;
    D.recIds.forEach(function (id) {
      var r = D.rec[id];
      if (r.te !== te) return;
      var ri = CK.ids(r.i);
      if (!ri.every(function (x) { return ids.indexOf(x) >= 0; })) return;
      if (ids.length - ri.length > 1) return;
      if (!best || ri.length > CK.ids(D.rec[best].i).length) best = id;
    });
    return best;
  }
  function hint(D, S, te, ids) {
    var best = null, bs = 0;
    D.recIds.forEach(function (id) {
      if (S.known[id]) return;
      var ri = CK.ids(D.rec[id].i), hit = ri.filter(function (x) { return ids.indexOf(x) >= 0; }).length;
      var sc = hit / ri.length - (D.rec[id].te === te ? 0 : 0.2);
      if (hit >= 2 && sc > bs) { bs = sc; best = id; }
    });
    if (!best || bs < 0.45) return null;
    var r = D.rec[best], ri = CK.ids(r.i), miss = ri.filter(function (x) { return ids.indexOf(x) < 0; });
    var extra = ids.filter(function (x) { return ri.indexOf(x) < 0; });
    if (r.te !== te && !miss.length) return '이 재료라면 「' + D.tech[r.te].n + '」으로 만들어 보면 어떨까?';
    var t = '어딘가 익숙한 맛… ' + D.cuisines[r.cu] + ' 요리가 될 것 같다. ';
    if (miss.length) t += '재료가 ' + miss.length + '가지 부족하다 (예: ' + D.cats[D.ing[miss[0]].c] + ' 종류)';
    if (extra.length > 1) t += ' · 필요 없는 재료가 ' + (extra.length - 1) + '가지 섞였다';
    if (r.te !== te) t += ' · 조리법도 다른 것 같다';
    return t;
  }

  function pick(S, arr) { return arr[Math.floor(rnd(S) * arr.length)]; }

  CK.apply = function (D, S, a) {
    var R = D.R, x;
    if (S.over && a.type !== 'rename') return { ok: false, err: '파산했습니다. 새 게임을 시작하세요.' };
    switch (a.type) {
      case 'rename': S.name = String(a.name || '').slice(0, 20) || S.name; return { ok: true };
      case 'buyBook':
        x = D.books[a.id];
        if (!x) return { ok: false, err: '없는 책' };
        if (S.books[a.id]) return { ok: false, err: '이미 가진 책' };
        if (x.req && x.req.rep > S.rep) return { ok: false, err: '평판 ' + x.req.rep + ' 이상 필요' };
        if (S.money < x.price) return { ok: false, err: '돈이 부족합니다' };
        S.money -= x.price; S.books[a.id] = 1;
        var got = [];
        D.recIds.forEach(function (id) { if (D.rec[id].src === a.id && !S.known[id]) { S.known[id] = 1; got.push(id); } });
        return { ok: true, res: { got: got } };
      case 'buyEquip':
        x = D.equip[a.id];
        if (!x) return { ok: false, err: '없는 설비' };
        if (S.equip[a.id]) return { ok: false, err: '이미 있음' };
        if (x.req && x.req.rep > S.rep) return { ok: false, err: '평판 ' + x.req.rep + ' 이상 필요' };
        if (x.req && x.req.equip && !S.equip[x.req.equip]) return { ok: false, err: D.equip[x.req.equip].n + ' 먼저 필요' };
        if (S.money < x.price) return { ok: false, err: '돈이 부족합니다' };
        S.money -= x.price; S.equip[a.id] = 1;
        if (x.seats) S.seats = x.seats;
        return { ok: true };
      case 'cook': {
        var ids = CK.ids(a.i || []);
        if (!ids.length) return { ok: false, err: '재료를 고르세요' };
        if (ids.length > R.maxLabIngredients) return { ok: false, err: '재료는 ' + R.maxLabIngredients + '가지까지' };
        if (ids.some(function (i, k) { return !D.ing[i] || ids.indexOf(i) !== k; })) return { ok: false, err: '재료가 잘못됨' };
        if (!CK.techOpen(D, S, a.te)) return { ok: false, err: '이 조리법에는 설비가 필요합니다' };
        var season = CK.season(D, S);
        var probe = CK.profile(D, { n: '?', co: a.co || 'app', te: a.te, i: a.i }, season);
        var labCost = Math.round(probe.cost);
        if (S.money < labCost) return { ok: false, err: '재료비가 부족합니다' };
        S.money -= labCost;
        var rid = findRecipe(D, a.te, ids);
        if (rid) {
          var isNew = !S.known[rid];
          S.known[rid] = 1;
          if (isNew) S.found[rid] = S.day;
          return { ok: true, res: { kind: isNew ? 'found' : 'known', id: rid, p: CK.recipeProfile(D, rid, season), cost: labCost } };
        }
        var co = a.co || CK.guessCourse(probe);
        var p = CK.profile(D, { n: '?', co: co, te: a.te, i: a.i }, season);
        var main = D.ing[ids[0]];
        var name = a.n || (main.n + ' ' + D.tech[a.te].n.split(/[·(]/)[0]);
        var cid = null;
        if (Object.keys(S.custom).length < R.maxCustom && a.save !== false) {
          cid = String(S.nextCid++);
          S.custom[cid] = { n: name, co: co, te: a.te, i: a.i.slice(), day: S.day, q: p.q };
        }
        p.n = name;
        return { ok: true, res: { kind: 'custom', cid: cid, p: p, hint: hint(D, S, a.te, ids), cost: labCost } };
      }
      case 'renameCustom':
        if (!S.custom[a.cid]) return { ok: false, err: '없음' };
        S.custom[a.cid].n = String(a.n || '').slice(0, 24) || S.custom[a.cid].n; return { ok: true };
      case 'setCustomCourse':
        if (!S.custom[a.cid] || !D.courses[a.co]) return { ok: false, err: '없음' };
        S.custom[a.cid].co = a.co; return { ok: true };
      case 'delCustom':
        if (!S.custom[a.cid]) return { ok: false, err: '없음' };
        delete S.custom[a.cid];
        S.menu.items = S.menu.items.filter(function (r) { return r !== 'c:' + a.cid; });
        return { ok: true };
      case 'setMenu': {
        var f = a.format === 'bansang' ? 'bansang' : 'course';
        var max = f === 'bansang' ? R.bansangMax : R.courseMax;
        var items = (a.items || []).filter(function (r) { var k = r.slice(2); return r.indexOf('r:') === 0 ? S.known[k] : !!S.custom[k]; });
        if (items.length > max) return { ok: false, err: '최대 ' + max + '가지' };
        var techBad = items.filter(function (r) { var d = CK.dish(D, S, r); return d && !CK.techOpen(D, S, d.te); });
        if (techBad.length) return { ok: false, err: '설비가 없어 만들 수 없는 요리가 있습니다' };
        S.menu = { format: f, items: items };
        return { ok: true };
      }
      case 'setPrice': S.priceRate = clamp(Math.round(+a.rate * 100) / 100 || 1, R.priceRateMin, R.priceRateMax); return { ok: true };
      case 'runDay': return runDay(D, S);
    }
    return { ok: false, err: '알 수 없는 행동' };
  };

  function prefScore(D, cust, P, ev) {
    var n = P.length, f = {}, like = cust.like || {}, sum = 0, ws = 0;
    CK.TN.forEach(function (t) { f['taste:' + t] = P.reduce(function (s, p) { return s + p.pt[t]; }, 0) / n / 5; });
    var cu = {}, tx = {};
    P.forEach(function (p) { cu['cu:' + p.cu] = (cu['cu:' + p.cu] || 0) + 1 / n; p.tex.forEach(function (x) { tx['x:' + x] = (tx['x:' + x] || 0) + 1 / n; }); });
    var cols = {};
    P.forEach(function (p) { p.col.forEach(function (c) { cols[c] = 1; }); });
    f.light = 1 - P.reduce(function (s, p) { return s + p.w; }, 0) / n / 5;
    f.veg = P.filter(function (p) { return p.veg && p.nut.veg; }).length / n;
    f.color = Math.min(1, Object.keys(cols).length / 7);
    f.dessert = P.some(function (p) { return p.co === 'dessert'; }) ? 1 : 0;
    f.complex = Math.min(1, P.reduce(function (s, p) { return s + p.aro.length; }, 0) / n / 5);
    Object.keys(like).forEach(function (k) {
      var v = f[k] != null ? f[k] : (cu[k] || tx[k] || 0);
      var base = k.indexOf('taste:') === 0 ? 0.3 : 0.35;
      sum += like[k] * (v - base); ws += Math.abs(like[k]);
    });
    return clamp(55 + (ws ? sum / ws : 0) * 120, 0, 100);
  }

  function runDay(D, S) {
    var R = D.R, season = CK.season(D, S);
    var P = CK.menuProfiles(D, S, season);
    if (!P.length) return { ok: false, err: '메뉴가 비어 있습니다' };
    if (P.some(function (p) { return !CK.techOpen(D, S, p.te); })) return { ok: false, err: '설비가 없어 만들 수 없는 요리가 있습니다' };
    var ev = CK.evalMenu(D, P, S.menu.format, season);
    var execQ = P.map(function (p) { return clamp(p.q * CK.execRate(D, S, p.te), 0, 100); });
    var avgExec = execQ.reduce(function (a, b) { return a + b; }, 0) / P.length;
    var mp = CK.menuPrice(D, S);
    var dow = ((S.day - 1) % 7) + 1;
    var demand = (R.baseCustomers + S.rep / R.repPerCustomer + S.stars * R.starCustomers) *
      (0.6 + ev.score * 0.006) * clamp(1.3 - 0.3 * S.priceRate, 0.35, 1.2) * (0.85 + rnd(S) * 0.3) * (dow >= 6 ? 1.25 : 1);
    var cap = S.seats * 2;
    var n = Math.max(1, Math.min(cap, Math.round(demand)));
    var types = Object.keys(D.cust).filter(function (k) { return D.cust[k].rep <= S.rep; });
    var tw = types.reduce(function (s, k) { return s + D.cust[k].w; }, 0);
    var rev = 0, cost = 0, repD = 0, served = 0, left = 0, sats = [], reviews = [], byType = {};
    var W = R.satWeights;
    var vegN = P.filter(function (p) { return p.veg; }).length;
    for (var c = 0; c < n; c++) {
      var r = rnd(S) * tw, tk = types[0];
      for (var j = 0; j < types.length; j++) { r -= D.cust[types[j]].w; if (r <= 0) { tk = types[j]; break; } }
      var cu = D.cust[tk], mc = cu.mc || 0;
      if (cu.veg_only && vegN === 0) { left++; repD -= 1; if (reviews.length < 6) reviews.push({ who: cu.n, s: 10, t: '먹을 수 있는 요리가 하나도 없었어요…' }); continue; }
      var pref = prefScore(D, cu, P, ev);
      var sat = avgExec * (W.quality - 0.3 * mc) + ev.score * (W.menu + 0.3 * mc) + pref * W.pref;
      if (cu.veg_only) sat -= (1 - vegN / P.length) * 50;
      var val = mp.base * (0.55 + sat / 100 * 0.9) * cu.wealth * (1 + 0.12 * S.stars);
      var why = null;
      if (mp.price > val) { sat -= Math.min(40, (mp.price / val - 1) * 70); why = 'price'; }
      else if (mp.price < val * 0.75) sat += 4;
      sat = clamp(sat + (rnd(S) * 2 - 1) * R.noise, 0, 100);
      served++; rev += mp.price; cost += mp.cost; sats.push(sat);
      repD += (sat - 65) * R.repGainRate * (tk === 'foodie' ? 2 : 1);
      byType[tk] = (byType[tk] || 0) + 1;
      if (reviews.length < 6 && rnd(S) < 0.35) {
        var t;
        if (sat >= 78) t = pick(S, cu.say);
        else if (why === 'price') t = '맛은 괜찮은데 이 가격은 좀…';
        else if (sat < 55) { var bad = ev.notes.filter(function (x) { return x.k === 'bad'; }); t = bad.length ? '아쉬워요. ' + pick(S, bad).t : '그저 그랬어요'; }
        else t = pref < 45 ? '제 입맛엔 조금 안 맞았어요' : '무난했어요';
        reviews.push({ who: cu.n, s: Math.round(sat), t: t });
      }
    }
    P.forEach(function (p) { S.skill[p.te] = (S.skill[p.te] || 0) + served; });
    var labor = Math.round(rev * R.laborRate);
    var fixed = R.fixedCostPerDay + S.seats * 3000 + labor;
    var profit = rev - cost - fixed;
    S.money += profit;
    var critic = null;
    if (S.day % R.criticEvery === 0) {
      var cs = Math.round(0.5 * ev.score + 0.5 * avgExec);
      var st = R.criticStars.filter(function (v) { return cs >= v; }).length;
      var prev = S.stars;
      S.stars = st;
      repD += (cs - 70) * 1.5;
      var good = ev.notes.filter(function (x) { return x.k === 'good'; }), badn = ev.notes.filter(function (x) { return x.k === 'bad'; });
      critic = { score: cs, stars: st, prev: prev, good: good.slice(0, 3).map(function (x) { return x.t; }), bad: badn.slice(0, 3).map(function (x) { return x.t; }) };
      S.stats.critic.push({ day: S.day, score: cs, stars: st });
    }
    var avgSat = sats.length ? sats.reduce(function (a, b) { return a + b; }, 0) / sats.length : 0;
    S.rep = clamp(Math.round(S.rep + repD), 0, 1000);
    S.stats.served += served; S.stats.revenue += rev; S.stats.profit += profit;
    S.stats.bestScore = Math.max(S.stats.bestScore, ev.score);
    if (ev.perfect) S.stats.perfect++;
    var res = { day: S.day, season: season, n: n, served: served, left: left, cap: cap, price: mp.price, rev: rev, cost: cost, fixed: fixed, labor: labor, profit: profit,
      repD: Math.round(repD), rep: S.rep, sat: Math.round(avgSat), score: ev.score, grade: ev.grade, exec: Math.round(avgExec), reviews: reviews, critic: critic, byType: byType };
    S.last = res;
    S.day++;
    var unknown = D.recIds.filter(function (id) { return !S.known[id]; });
    S.rumor = unknown.length ? pick(S, unknown) : null;
    if (S.money < -1000000) S.over = true;
    return { ok: true, res: res };
  }
})(typeof window !== 'undefined' ? window : global);
