// 배포용 한 파일 만들기: cooking/dist/index.html (데이터·코드·스타일을 모두 안에 넣음)
const fs = require('fs'), path = require('path');
const { raw, ROOT } = require('./load.js');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'src/ui/style.css'), 'utf8');
html = html.replace('<link rel="stylesheet" href="src/ui/style.css">', '<style>\n' + css + '</style>');
html = html.replace(/<script src="(src\/[^"]+)"><\/script>/g, (m, f) => '<script>\n' + fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/<\/script/g, '<\\/script') + '</script>');
html = html.replace('<script>\n/* 개발용', '<script>window.CK_DATA=' + JSON.stringify(raw()).replace(/<\//g, '<\\/') + ';</script>\n<script>\n/* 개발용');
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/index.html'), html);
console.log('dist/index.html', Math.round(html.length / 1024) + 'KB');
