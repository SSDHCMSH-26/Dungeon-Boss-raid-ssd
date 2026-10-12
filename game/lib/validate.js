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
  };
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
      };
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
    },
  };

  // 파일 하나 검사: format·version 확인 + 내용 검사
  function dataFile(name, json) {
    const spec = FILES[name], c = checker(spec ? spec.path : name);
    if (!c.need(!!spec, "", "알 수 없는 데이터 파일이에요")) return c.errs;
    if (!c.obj(json, "")) return c.errs;
    if (!c.need(json.format === spec.format, "format", '"' + spec.format + '" 이어야 해요 (지금: ' + JSON.stringify(json.format) + ")")) return c.errs;
    if (!c.need(isInt(json.version), "version", "정수여야 해요")) return c.errs;
    if (!c.need(json.version <= spec.version, "version",
      "이 게임은 version " + spec.version + " 까지만 읽을 수 있어요 (파일: " + json.version + "). 게임을 새로 고침하거나 최신 버전으로 업데이트하세요")) return c.errs;
    if (BODY[name]) BODY[name](body(json), c);
    return c.errs;
  }

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
    return c.errs;
  }

  const API = { FILES, dataFile, body, links };
  root.PDRValidate = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
