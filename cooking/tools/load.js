// Node 에서 데이터+core 불러오기 (테스트·빌드 공용)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const FILES = ['ingredients', 'techniques', 'recipes', 'pairings', 'shop', 'customers', 'rules', 'knowledge'];
const CORE = ['flavor', 'menu', 'game'];
function raw() { const o = {}; FILES.forEach(f => o[f] = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f + '.json'), 'utf8'))); return o; }
function load() {
  CORE.forEach(f => { const p = path.join(ROOT, 'src/core', f + '.js'); if (fs.existsSync(p)) require(p); });
  return { CK: global.CK, D: global.CK.makeData(raw()) };
}
module.exports = { raw, load, FILES, CORE, ROOT };
