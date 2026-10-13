/* 게임 데이터 검증기 — 게임(브라우저)·테스트 도구(node)·나중의 서버가 같은 코드를 씀.
   - 데이터 파일마다 맨 위에 "format"(파일 종류)과 "version"(형식 버전)이 있어야 함.
   - 결과는 한국어 오류 문장 배열. 빈 배열이면 통과. */
(function (root) {
  "use strict";

  // 파일 이름표 → 경로·종류·지원하는 버전
  const FILES = {
    heroes: { path: "data/heroes.json", format: "pdr-heroes", version: 1 },
    skills: { path: "data/skills.json", format: "pdr-skills", version: 1 },
    monsters: { path: "data/monsters.json", format: "pdr-monsters", version: 1 },
    champions: { path: "data/champions.json", format: "pdr-champions", version: 1 },
    rules: { path: "data/rulesets/standard.json", format: "pdr-ruleset", version: 1 },
    items: { path: "data/items.json", format: "pdr-items", version: 1 },
    loot: { path: "data/loot.json", format: "pdr-loot", version: 1 },
    mapIndex: { path: "data/maps/index.json", format: "pdr-map-index", version: 1 },
    ai: { path: "data/ai.json", format: "pdr-ai", version: 1 },
    art: { path: "data/art.json", format: "pdr-art", version: 1 },
    text: { path: "data/text/ko.json", format: "pdr-text", version: 1 },
  };
  // 맵 파일(공식 맵·나중에 공유 맵) — 목록(maps/index.json)에 적힌 ID 마다 data/maps/<id>.json
  const MAP = { format: "pdr-map", version: 1, maxBytes: 65536, size: 30, tiles: { ".": "floor", "#": "wall" },
    generators: ["maze"], objects: ["chest", "trapChest", "pit"],
    keys: ["format", "version", "id", "name", "author", "champion", "ruleset", "size", "tiles", "generator", "spawns", "objects", "settings"], settings: { chestSpawn: "boolean" } };
  const mapPath = id => "data/maps/" + id + ".json";
  const ID_RE = /^[a-z0-9_-]{1,64}$/;
  const META = ["format", "version"];

  const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const isNum = v => typeof v === "number" && isFinite(v);
  const isInt = v => Number.isInteger(v);
  const isStr = v => typeof v === "string";

  // 작은 도우미: 조건이 틀리면 오류 문장을 쌓음
  function checker(file) {
    const errs = [];
    const where = p => file + (p ? " › " + p : "");
    return {
      errs,
      need(ok, path, msg) { if (!ok) errs.push(where(path) + ": " + msg); return ok; },
      obj(v, path) { return this.need(isObj(v), path, "객체({ })여야 해요"); },
      str(v, path) { return this.need(isStr(v) && v.length > 0, path, "글자여야 해요"); },
      int(v, path, min, max) {
        return this.need(isInt(v) && v >= min && (max === undefined || v <= max), path,
          "정수(" + min + (max === undefined ? " 이상" : "~" + max) + ")여야 해요 (지금: " + JSON.stringify(v) + ")");
      },
      num(v, path, min, max) {
        return this.need(isNum(v) && v >= min && (max === undefined || v <= max), path,
          "숫자(" + min + (max === undefined ? " 이상" : "~" + max) + ")여야 해요 (지금: " + JSON.stringify(v) + ")");
      },
      prob(v, path) { return this.num(v, path, 0, 1); },
    };
  }

  // ── 파일별 내용 검사 ──
  const BODY = {
    heroes(b, c) {
      for (const k in b) {
        const h = b[k];
        if (!c.obj(h, k)) continue;
        c.str(h.n, k + ".n");
        c.int(h.hp, k + ".hp", 1);
        c.int(h.mv, k + ".mv", 0);
        if (h.pas !== undefined) c.str(h.pas, k + ".pas");
        if (h.ap !== undefined) c.int(h.ap, k + ".ap", 1); // 기본 AP (없으면 규칙 묶음 hero.ap)
      }
      c.need(Object.keys(b).length >= 3, "", "용사가 3명 이상 있어야 해요");
    },
    skills(b, c) {
      const sk = (s, p) => {
        if (!c.obj(s, p)) return;
        c.str(s.n, p + ".n");
        c.int(s.c, p + ".c", 0);
        if (s.r !== undefined) c.int(s.r, p + ".r", 0);
        if (s.v !== undefined) c.num(s.v, p + ".v", 0);
        if (s.cd !== undefined) c.int(s.cd, p + ".cd", 0);
        if (s.escEvery !== undefined) c.int(s.escEvery, p + ".escEvery", 1);
      };
      // 효과 수치(fx)가 꼭 있어야 하는 스킬: 용사는 종류(t), 보스는 id 로 구분
      const FX_T = { g: ["damageTaken", "radius"], r: ["hit", "recoil"], l: ["dmg", "heal"], u: ["bindBoss", "bindOther"], o: ["radius", "near", "far"], c: ["radius"], w: ["add"] };
      const FX_ID = { wall: ["hpPerLv", "turns", "turnsLater", "stackTurns", "maxLv"], trap: ["dmg", "max"], pit: ["fallDmg", "max"], belt: ["maxLen"], run: ["move", "enhancedMove"] };
      const fx = (s, keys, p) => {
        if (!keys || !c.obj(s.fx, p + ".fx")) return;
        keys.forEach(k => c.num(s.fx[k], p + ".fx." + k, 0));
        if (keys.includes("damageTaken")) c.prob(s.fx.damageTaken, p + ".fx.damageTaken");
        // 마법진(t:c): 종류 + 레벨별 수치 val[Lv1, Lv2, ...] / 영창(t:w): 종류(power 위력 · spread 확산)
        if (s.t === "c") {
          c.need(["meteor", "frost", "shield"].includes(s.fx.kind), p + ".fx.kind", "meteor · frost · shield 중 하나여야 해요");
          if (c.need(Array.isArray(s.fx.val) && s.fx.val.length > 0, p + ".fx.val", "레벨별 수치 목록([ ])이어야 해요")) s.fx.val.forEach((v, i) => c.num(v, p + ".fx.val[" + i + "]", 0));
          if (s.fx.kind === "frost" && c.need(Array.isArray(s.fx.slow) && s.fx.slow.length === s.fx.val.length, p + ".fx.slow", "val 과 같은 길이의 목록이어야 해요")) s.fx.slow.forEach((v, i) => c.int(v, p + ".fx.slow[" + i + "]", 0));
          if (s.fx.kind === "frost") c.int(s.fx.stunLv, p + ".fx.stunLv", 1);
          if (s.fx.kind === "meteor") { c.num(s.fx.burn, p + ".fx.burn", 0); c.int(s.fx.burnLv, p + ".fx.burnLv", 1); }
        }
        if (s.t === "w") c.need(["power", "spread"].includes(s.fx.kind), p + ".fx.kind", "power · spread 중 하나여야 해요");
      };
      if (c.obj(b.heroes, "heroes"))
        for (const k in b.heroes) if (Array.isArray(b.heroes[k])) b.heroes[k].forEach((s, i) => isObj(s) && fx(s, FX_T[s.t], "heroes." + k + "[" + i + "]"));
      if (c.obj(b.champions, "champions"))
        for (const k in b.champions) if (isObj(b.champions[k])) (b.champions[k].ex || []).forEach((s, i) => isObj(s) && fx(s, FX_ID[s.id], "champions." + k + ".ex[" + i + "]"));
      if (c.obj(b.heroes, "heroes"))
        for (const k in b.heroes)
          if (c.need(Array.isArray(b.heroes[k]), "heroes." + k, "스킬 목록([ ])이어야 해요"))
            b.heroes[k].forEach((s, i) => { sk(s, "heroes." + k + "[" + i + "]"); c.str(s.t, "heroes." + k + "[" + i + "].t"); });
      if (c.obj(b.champions, "champions"))
        for (const k in b.champions) {
          const ch = b.champions[k], p = "champions." + k;
          if (!c.obj(ch, p)) continue;
          (ch.at || []).forEach((s, i) => sk(s, p + ".at[" + i + "]"));
          (ch.ex || []).forEach((s, i) => { sk(s, p + ".ex[" + i + "]"); c.str(s.id, p + ".ex[" + i + "].id"); });
          if (ch.gx) sk(ch.gx, p + ".gx");
        }
    },
    monsters(b, c) {
      if (c.obj(b.mimic, "mimic")) {
        const m = b.mimic;
        c.int(m.hp, "mimic.hp", 1); c.int(m.move, "mimic.move", 0); c.num(m.bite, "mimic.bite", 0);
        c.int(m.suppressTurns, "mimic.suppressTurns", 0); c.num(m.suppressDmg, "mimic.suppressDmg", 0);
      }
      if (c.obj(b.gob, "gob")) {
        const g = b.gob;
        c.int(g.hp, "gob.hp", 1); c.int(g.ap, "gob.ap", 0); c.int(g.move, "gob.move", 0); c.num(g.steal, "gob.steal", 0);
        if (c.prob(g.goldChance, "gob.goldChance") & c.prob(g.itemChance, "gob.itemChance"))
          c.need(g.goldChance + g.itemChance <= 1, "gob", "goldChance + itemChance 는 1 이하여야 해요");
        if (c.int(g.goldMin, "gob.goldMin", 0) & c.int(g.goldMax, "gob.goldMax", 0))
          c.need(g.goldMin <= g.goldMax, "gob", "goldMin 이 goldMax 보다 클 수 없어요");
      }
      if (c.obj(b.trapChest, "trapChest")) c.prob(b.trapChest.mimicChance, "trapChest.mimicChance");
      if (c.obj(b.robot, "robot")) {
        const r = b.robot;
        if (c.need(Array.isArray(r.hp) && r.hp.length >= 1, "robot.hp", "레벨별 체력 목록([ ])이어야 해요")) r.hp.forEach((v, i) => c.int(v, "robot.hp[" + i + "]", 1));
        ["atkBase", "atkPerLv", "move", "enhancedMove", "chase", "max", "enhanceTurns", "wreckCount"].forEach(k => c.int(r[k], "robot." + k, 0));
        c.num(r.enhanceMult, "robot.enhanceMult", 1);
        if (c.int(r.wreckLv, "robot.wreckLv", 1) && Array.isArray(r.hp)) c.need(r.wreckLv <= r.hp.length, "robot.wreckLv", "robot.hp 에 그 레벨의 체력이 없어요");
      }
      if (c.obj(b.factory, "factory")) {
        const f = b.factory;
        ["hp", "cycle"].forEach(k => c.int(f[k], "factory." + k, 1));
        ["upgradeHp", "decay", "max", "enhanceHp"].forEach(k => c.int(f[k], "factory." + k, 0));
        if (c.int(f.maxLv, "factory.maxLv", 1) && b.robot && Array.isArray(b.robot.hp)) c.need(f.maxLv <= b.robot.hp.length, "factory.maxLv", "robot.hp 레벨 수보다 클 수 없어요");
      }
      if (c.obj(b.bomb, "bomb")) ["dmg", "max", "move", "enhancedMove"].forEach(k => c.int(b.bomb[k], "bomb." + k, 0));
    },
    champions(b, c) {
      for (const k in b) {
        const ch = b[k];
        if (!c.obj(ch, k)) continue;
        c.str(ch.n, k + ".n");
        if (!ch.ok) continue; // 아직 준비 중인 챔피언은 이름·설명만
        if (!c.obj(ch.stats, k + ".stats")) continue;
        const st = ch.stats, p = k + ".stats.";
        c.int(st.hp, p + "hp", 1); c.int(st.ap, p + "ap", 0); c.int(st.move, p + "move", 0);
        if (ch.gen) {
          c.int(st.apNoGen, p + "apNoGen", 0); c.int(st.moveNoGen, p + "moveNoGen", 0);
          c.prob(st.damageTakenWithGen, p + "damageTakenWithGen"); c.int(st.factoryKillAp, p + "factoryKillAp", 0);
          if (c.obj(st.generator, p + "generator")) {
            c.int(st.generator.hp, p + "generator.hp", 1); c.int(st.generator.ap, p + "generator.ap", 0); c.int(st.generator.charge, p + "generator.charge", 0);
          }
        }
      }
    },
    rules(b, c) {
      c.str(b.id, "id");
      if (c.obj(b.hero, "hero")) {
        c.int(b.hero.ap, "hero.ap", 0); c.int(b.hero.movesPerTurn, "hero.movesPerTurn", 0);
        if (c.int(b.hero.clericApMax, "hero.clericApMax", 0)) c.need(b.hero.clericApMax >= b.hero.ap, "hero.clericApMax", "hero.ap 이상이어야 해요");
        c.int(b.hero.breakDmg, "hero.breakDmg", 0); c.int(b.hero.breakRange, "hero.breakRange", 1);
      }
      if (c.obj(b.status, "status")) c.int(b.status.paralyzeMove, "status.paralyzeMove", 0);
      if (b.circle !== undefined && c.obj(b.circle, "circle")) { c.int(b.circle.maxLv, "circle.maxLv", 1); c.int(b.circle.breakDmg, "circle.breakDmg", 1); }
      c.int(b.mapWallHp, "mapWallHp", 1);
      if (c.obj(b.crystal, "crystal")) {
        const r = b.crystal;
        c.int(r.max, "crystal.max", 0); c.int(r.life, "crystal.life", 1); c.prob(r.blueChance, "crystal.blueChance");
        c.int(r.start, "crystal.start", 0); c.int(r.blueAp, "crystal.blueAp", 0); c.int(r.yellowMove, "crystal.yellowMove", 0);
        if (c.int(r.perTurnMin, "crystal.perTurnMin", 0) & c.int(r.perTurnMax, "crystal.perTurnMax", 0))
          c.need(r.perTurnMin <= r.perTurnMax, "crystal", "perTurnMin 이 perTurnMax 보다 클 수 없어요");
      }
      if (c.obj(b.chest, "chest")) {
        const h = b.chest;
        ["max", "startMin", "startMax", "heroOpenRange", "bossOpenRange", "spacing", "heroClearance", "bossClearance", "trapChestSpacing"].forEach(k => c.int(h[k], "chest." + k, 0));
        c.int(h.life, "chest.life", 1); c.prob(h.startChance, "chest.startChance"); c.prob(h.spawnChance, "chest.spawnChance");
        if (isInt(h.startMin) && isInt(h.startMax)) c.need(h.startMin <= h.startMax, "chest", "startMin 이 startMax 보다 클 수 없어요");
      }
    },
    items(b, c) {
      c.need(Object.keys(b).length >= 1, "", "아이템이 1개 이상 있어야 해요");
      for (const k in b) {
        const it = b[k];
        if (!c.obj(it, k)) continue;
        c.str(it.n, k + ".n"); c.str(it.ic, k + ".ic"); c.str(it.d, k + ".d");
        if (c.obj(it.effect, k + ".effect")) for (const e in it.effect) c.num(it.effect[e], k + ".effect." + e, 0);
      }
      ["potion", "scroll", "gem"].forEach(k => {
        if (!isObj(b[k]) || !isObj(b[k].effect)) return;
        const need = { potion: "heal", scroll: "range", gem: "ap" }[k];
        c.need(isNum(b[k].effect[need]), k + ".effect." + need, "이 아이템 효과에 필요한 숫자예요");
      });
    },
    text(b, c) {
      c.str(b.lang, "lang");
      if (c.obj(b.text, "text")) for (const k in b.text) {
        c.need(/^[A-Za-z0-9_]+\.[A-Za-z0-9_.]+$/.test(k), "text." + k, "이름표는 영어·숫자로 '묶음.이름' 형식이어야 해요");
        c.need(isStr(b.text[k]) && b.text[k].length <= 300 && !/<|>/.test(b.text[k]), "text." + k, "300자 이하 글자, < > 는 쓸 수 없어요 (HTML 금지)");
      }
    },
    art(b, c) {
      // 그림 경로는 game/art/ 아래 png·jpg 만 (바깥 주소·상위 폴더 금지)
      const IMG_RE = /^art\/[A-Za-z0-9_\/-]+\.(png|jpg)$/;
      const img = (v, p) => c.need(isStr(v) && IMG_RE.test(v) && v.indexOf("..") < 0, p, "art/ 폴더 안의 .png/.jpg 경로여야 해요 (지금: " + JSON.stringify(v) + ")");
      if (c.obj(b.images, "images")) for (const k in b.images) {
        const v = b.images[k];
        if (isObj(v)) for (const n in v) img(v[n], "images." + k + "." + n); else img(v, "images." + k);
      }
      ["T3A", "ART", "ART2", "ART3", "ART3_EXTRA", "MOBA", "FXD", "CRYSTAL"].forEach(k => isObj(b.images) && c.obj(b.images[k], "images." + k));
      if (c.obj(b.designs, "designs")) {
        const d = b.designs;
        if (c.need(Array.isArray(d.order) && d.order.length > 0 && d.order.every(isStr), "designs.order", "디자인 ID 목록이어야 해요"))
          ["old", "t2", "t3"].forEach(id => c.need(d.order.indexOf(id) >= 0, "designs.order", '"' + id + '" 디자인은 코드가 쓰므로 빼면 안 돼요'));
        if (c.obj(d.legacy, "designs.legacy")) for (const k in d.legacy) c.need(Array.isArray(d.order) && d.order.indexOf(d.legacy[k]) >= 0, "designs.legacy." + k, "order 에 있는 디자인이어야 해요");
      }
      const COLOR = /^#[0-9a-fA-F]{6}$/;
      if (c.obj(b.themes, "themes")) for (const k in b.themes) {
        const t = b.themes[k], p = "themes." + k;
        if (!c.obj(t, p)) continue;
        c.str(t.k, p + ".k");
        ["hi", "ln"].forEach(n => c.need(COLOR.test(t[n]), p + "." + n, "#rrggbb 색이어야 해요"));
        [["f", 2], ["sp", 1], ["w", 4]].forEach(([n, min]) => c.need(Array.isArray(t[n]) && t[n].length >= min && t[n].every(x => COLOR.test(x)), p + "." + n, "#rrggbb 색 " + min + "개 이상 목록이어야 해요"));
      }
    },
    ai(b, c) {
      // 이름이 chance 면 확률(0~1), healBelow 도 비율, 나머지 숫자는 0 이상 정수
      const walk = (o, p) => {
        if (!c.obj(o, p)) return;
        for (const k in o) {
          const v = o[k], q = p ? p + "." + k : k;
          if (isObj(v)) walk(v, q);
          else if (/chance$/i.test(k) || k === "healBelow") c.prob(v, q);
          else c.int(v, q, 0);
        }
      };
      walk(b, "");
      ["boss", "hero"].forEach(k => c.obj(b[k], k));
      if (isObj(b.boss) && isObj(b.boss.vince) && isObj(b.boss.vince.belt))
        c.need(b.boss.vince.belt.lenMin <= b.boss.vince.belt.lenMax, "boss.vince.belt", "lenMin 이 lenMax 보다 클 수 없어요");
    },
    mapIndex(b, c) {
      if (c.need(Array.isArray(b.maps) && b.maps.length > 0, "maps", "맵 ID 목록이어야 해요"))
        b.maps.forEach((id, i) => c.need(isStr(id) && ID_RE.test(id), "maps[" + i + "]", "맵 ID 는 영어 소문자·숫자·_·- 여야 해요"));
      if (c.obj(b.default, "default")) for (const k in b.default) c.need(Array.isArray(b.maps) && b.maps.indexOf(b.default[k]) >= 0, "default." + k, "maps 목록에 없는 맵이에요");
    },
    loot(b, c) {
      const t = b.treasureChest;
      if (!c.obj(t, "treasureChest")) return;
      if (c.need(Array.isArray(t.gold) && t.gold.length > 0, "treasureChest.gold", "[금화 양, 가중치] 목록이어야 해요"))
        t.gold.forEach((g, i) => { const p = "treasureChest.gold[" + i + "]"; if (c.need(Array.isArray(g) && g.length == 2, p, "[금화 양, 가중치] 여야 해요")) { c.int(g[0], p + "[0]", 0); c.num(g[1], p + "[1]", 0); } });
      if (c.need(Array.isArray(t.items), "treasureChest.items", "[아이템 ID, 확률] 목록이어야 해요")) {
        let sum = 0;
        t.items.forEach((g, i) => { const p = "treasureChest.items[" + i + "]"; if (c.need(Array.isArray(g) && g.length == 2, p, "[아이템 ID, 확률] 이어야 해요") && c.str(g[0], p + "[0]") && c.prob(g[1], p + "[1]")) sum += g[1]; });
        c.need(sum <= 1 + 1e-9, "treasureChest.items", "확률 합이 1 이하여야 해요 (지금: " + Math.round(sum * 1000) / 1000 + ")");
      }
    },
  };

  // format·version 확인 (모든 파일 공통)
  function head(c, json, spec) {
    if (!c.obj(json, "")) return false;
    if (!c.need(json.format === spec.format, "format", '"' + spec.format + '" 이어야 해요 (지금: ' + JSON.stringify(json.format) + ")")) return false;
    if (!c.need(isInt(json.version), "version", "정수여야 해요")) return false;
    return c.need(json.version <= spec.version, "version",
      "이 게임은 version " + spec.version + " 까지만 읽을 수 있어요 (파일: " + json.version + "). 게임을 새로 고침하거나 최신 버전으로 업데이트하세요");
  }

  // 파일 하나 검사: format·version 확인 + 내용 검사
  function dataFile(name, json) {
    const spec = FILES[name], c = checker(spec ? spec.path : name);
    if (!c.need(!!spec, "", "알 수 없는 데이터 파일이에요")) return c.errs;
    if (!head(c, json, spec)) return c.errs;
    if (BODY[name]) BODY[name](body(json), c);
    return c.errs;
  }

  // ── 맵 검사 ── json: 맵 파일 내용, D: 이미 불러온 데이터(챔피언·규칙 묶음 확인용), file: 오류에 표시할 이름
  // 반환: 한국어 오류 배열. 남이 만든 맵(공유 맵)도 반드시 이 검사를 통과해야 사용.
  function map(json, D, file) {
    const c = checker(file || "맵"), N = MAP.size;
    if (!head(c, json, MAP)) return c.errs;
    for (const k in json) c.need(MAP.keys.indexOf(k) >= 0, k, "모르는 항목이에요 (오타인지 확인하세요)");
    // 맵별 설정(선택): chestSpawn=false 면 이 맵에서는 보물상자가 저절로 생기지 않음
    if (json.settings !== undefined && c.obj(json.settings, "settings")) for (const k in json.settings) { const ty = MAP.settings[k]; if (c.need(!!ty, "settings." + k, "모르는 설정이에요 (쓸 수 있는 것: " + Object.keys(MAP.settings).join(", ") + ")")) c.need(typeof json.settings[k] === ty, "settings." + k, ty === "boolean" ? "true 또는 false 여야 해요" : ty + " 여야 해요"); }
    c.need(isStr(json.id) && ID_RE.test(json.id), "id", "영어 소문자·숫자·_·- 로 1~64자여야 해요");
    c.need(isStr(json.name) && json.name.length >= 1 && json.name.length <= 40, "name", "1~40자 글자여야 해요");
    if (json.author !== undefined) c.need(isStr(json.author) && json.author.length <= 40, "author", "40자 이하 글자여야 해요");
    const ch = D && D.champions && D.champions[json.champion];
    c.need(!!ch && !!ch.ok, "champion", '쓸 수 있는 챔피언 ID 여야 해요 (지금: ' + JSON.stringify(json.champion) + ")");
    c.need(D && D.rules && json.ruleset === D.rules.id, "ruleset", '있는 규칙 묶음 ID 여야 해요 (지금: ' + JSON.stringify(json.ruleset) + ")");
    if (c.obj(json.size, "size")) c.need(json.size.w === N && json.size.h === N, "size", "지금은 " + N + "×" + N + " 맵만 쓸 수 있어요");
    const hasT = json.tiles !== undefined, hasG = json.generator !== undefined;
    if (!c.need(hasT !== hasG, "", "tiles(지도) 와 generator(자동 생성) 중 정확히 하나만 있어야 해요")) return c.errs;
    let grid = null; // grid[y][x] = true 면 벽
    if (hasT) {
      const t = json.tiles;
      if (c.need(Array.isArray(t) && t.length === N, "tiles", N + "줄이어야 해요" + (Array.isArray(t) ? " (지금: " + t.length + "줄)" : ""))) {
        let ok = true;
        for (let y = 0; y < N; y++) { // forEach 는 빈 칸(구멍)을 건너뛰므로 일반 반복문으로 모든 줄 확인
          const row = t[y];
          if (!c.need(isStr(row) && row.length === N, "tiles[" + y + "]", N + "글자여야 해요" + (isStr(row) ? " (지금: " + row.length + "글자)" : ""))) { ok = false; continue; }
          for (let x = 0; x < N; x++) if (!Object.prototype.hasOwnProperty.call(MAP.tiles, row[x])) { c.need(false, "tiles[" + y + "]", (x + 1) + "번째 글자 '" + row[x] + "' 는 쓸 수 없어요 (. 바닥 / # 벽)"); ok = false; break; }
        }
        if (ok) { grid = []; for (let y = 0; y < N; y++) { const r = []; for (let x = 0; x < N; x++) r.push(t[y][x] === "#"); grid.push(r); } }
      }
    } else if (c.obj(json.generator, "generator")) {
      c.need(MAP.generators.indexOf(json.generator.type) >= 0, "generator.type", "다음 중 하나여야 해요: " + MAP.generators.join(", "));
    }
    // 시작 위치
    const wall = (x, y) => grid ? grid[y][x] : false;
    const pt = (p, path) => c.obj(p, path) && (c.int(p.x, path + ".x", 0, N - 1) & c.int(p.y, path + ".y", 0, N - 1)) === 1;
    const area = (p, r) => { const a = []; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) a.push([p.x + dx, p.y + dy]); return a; };
    const big = (p, path) => { // 보스·발전기: 가운데 기준 3×3
      if (!pt(p, path)) return null;
      if (!c.need(p.x >= 1 && p.y >= 1 && p.x <= N - 2 && p.y <= N - 2, path, "3×3 크기라 맨 가장자리에서 1칸 이상 안쪽이어야 해요")) return null;
      const a = area(p, 1);
      c.need(a.every(([x, y]) => !wall(x, y)), path, "3×3 자리에 벽이 있어요");
      return a;
    };
    const used = new Map(), mark = (cells, who) => cells.forEach(([x, y]) => { const k = y * N + x; if (used.has(k)) c.need(false, "spawns", who + " 자리가 " + used.get(k) + " 와 겹쳐요 (" + x + "," + y + ")"); else used.set(k, who); });
    let bossA = null;
    if (c.obj(json.spawns, "spawns")) {
      const sp = json.spawns;
      bossA = big(sp.boss, "spawns.boss");
      if (bossA) mark(bossA, "보스");
      if (ch && ch.gen) { const g = big(sp.generator, "spawns.generator"); if (g) mark(g, "발전기"); }
      else c.need(sp.generator === undefined, "spawns.generator", "발전기가 없는 챔피언이에요");
      if (c.need(Array.isArray(sp.heroes) && sp.heroes.length === 3, "spawns.heroes", "용사 시작 위치 3개여야 해요"))
        for (let i = 0; i < 3; i++) { const h = sp.heroes[i], p = "spawns.heroes[" + i + "]"; if (pt(h, p)) { c.need(!wall(h.x, h.y), p, "벽 위예요"); mark([[h.x, h.y]], "용사" + (i + 1)); } }
    }
    // 미리 놓는 물건 (디펜스 모드·편집기용)
    if (json.objects !== undefined && c.need(Array.isArray(json.objects), "objects", "목록([ ])이어야 해요")) {
      const R = D && D.rules, cnt = {};
      if (!c.need(json.objects.length <= 200, "objects", "물건이 너무 많아요 (최대 200개)")) return c.errs;
      Array.from(json.objects).forEach((o, i) => {
        const p = "objects[" + i + "]";
        if (!c.obj(o, p)) return;
        if (!c.need(MAP.objects.indexOf(o.type) >= 0, p + ".type", "다음 중 하나여야 해요: " + MAP.objects.join(", "))) return;
        cnt[o.type] = (cnt[o.type] || 0) + 1;
        if (!pt(o, p)) return;
        const cells = o.type === "pit" ? [[o.x, o.y], [o.x + 1, o.y], [o.x, o.y + 1], [o.x + 1, o.y + 1]] : [[o.x, o.y]];
        if (!c.need(cells.every(([x, y]) => x < N && y < N), p, "맵 밖으로 나가요")) return;
        c.need(cells.every(([x, y]) => !wall(x, y)), p, "벽 위에 놓을 수 없어요");
        mark(cells, p + "(" + o.type + ")");
      });
      if (R && R.chest) c.need((cnt.chest || 0) + (cnt.trapChest || 0) <= R.chest.max, "objects", "상자는 최대 " + R.chest.max + "개예요");
      const pitMax = D && D.skills && D.skills.champions && D.skills.champions.gron && (D.skills.champions.gron.ex || []).filter(e => e.id === "pit").map(e => e.fx && e.fx.max)[0];
      if (pitMax !== undefined) c.need((cnt.pit || 0) <= pitMax, "objects", "구덩이는 최대 " + pitMax + "개예요");
    }
    // 길 확인: 용사마다 벽을 부수지 않고 보스 옆까지 걸어갈 수 있어야 함 (지도가 있는 맵만)
    if (grid && bossA && !c.errs.length) {
      const near = new Set();
      bossA.forEach(([bx, by]) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) near.add((by + dy) * N + bx + dx); });
      const blocked = (x, y) => x < 0 || y < 0 || x >= N || y >= N || grid[y][x] || bossA.some(([a, b]) => a === x && b === y);
      json.spawns.heroes.forEach((h, i) => {
        const seen = new Set([h.y * N + h.x]), q = [[h.x, h.y]];
        let ok = false;
        while (q.length && !ok) {
          const [x, y] = q.shift();
          if (near.has(y * N + x)) { ok = true; break; }
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy, k = ny * N + nx;
            if ((dx || dy) && !blocked(nx, ny) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); }
          }
        }
        c.need(ok, "spawns.heroes[" + i + "]", "이 용사가 보스까지 걸어갈 길이 없어요 (벽으로 막힘)");
      });
    }
    return c.errs;
  }

  // 맵 파일 글자(공유 맵 업로드·불러오기용): 크기 제한 → JSON 해석 → map() 검사
  function mapText(text, D, file) {
    if (typeof text !== "string") return ["맵 파일을 읽을 수 없어요"];
    const bytes = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(text).length : text.length;
    if (bytes > MAP.maxBytes) return [(file || "맵") + ": 파일이 너무 커요 (" + Math.round(bytes / 1024) + "KB, 최대 " + MAP.maxBytes / 1024 + "KB)"];
    let j;
    try { j = JSON.parse(text); } catch (e) { return [(file || "맵") + ": JSON 형식이 아니에요 (" + e.message + ")"]; }
    return map(j, D, file);
  }

  // 맵 → 게임 내부 지도 글자("0" 바닥 / "1" 벽, 한 줄로). generator 맵은 null
  const mapString = m => m.tiles ? m.tiles.join("").replace(/\./g, "0").replace(/#/g, "1") : null;

  // format·version 을 뺀 실제 내용 (옛 버전이면 여기서 새 형식으로 변환할 자리)
  function body(json) {
    const o = {};
    for (const k in json) if (META.indexOf(k) < 0) o[k] = json[k];
    return o;
  }

  // 파일끼리 ID 연결 검사 (모두 불러온 뒤)
  function links(D) {
    const c = checker("데이터 연결");
    if (D.skills && D.heroes) {
      for (const k in D.heroes) c.need(D.skills.heroes && Array.isArray(D.skills.heroes[k]), "skills.heroes", '용사 "' + k + '" 의 스킬이 없어요');
      for (const k in D.skills.heroes || {}) c.need(k in D.heroes, "skills.heroes", '"' + k + '" 는 heroes.json 에 없는 용사예요');
    }
    if (D.loot && D.items && D.loot.treasureChest && Array.isArray(D.loot.treasureChest.items))
      D.loot.treasureChest.items.forEach(g => c.need(Array.isArray(g) && g[0] in D.items, "loot.treasureChest.items", '"' + (g && g[0]) + '" 는 items.json 에 없는 아이템이에요'));
    if (D.mapIndex && D.champions)
      for (const k in D.champions) if (D.champions[k].ok) c.need(D.mapIndex.default && D.mapIndex.default[k], "maps/index.json", '챔피언 "' + k + '" 의 기본 맵이 없어요');
    if (D.maps && D.mapIndex && D.mapIndex.default)
      for (const k in D.mapIndex.default) { const m = D.maps[D.mapIndex.default[k]]; c.need(!m || m.champion === k, "maps/index.json", '기본 맵 "' + D.mapIndex.default[k] + '" 은 ' + k + " 맵이 아니에요"); }
    if (D.skills && D.champions) {
      for (const k in D.champions) if (D.champions[k].ok) c.need(D.skills.champions && D.skills.champions[k], "skills.champions", '챔피언 "' + k + '" 의 스킬이 없어요');
      for (const k in D.skills.champions || {}) c.need(k in D.champions, "skills.champions", '"' + k + '" 는 champions.json 에 없는 챔피언이에요');
    }
    return c.errs;
  }

  const API = { FILES, MAP, mapPath, dataFile, body, links, map, mapText, mapString };
  root.PDRValidate = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
