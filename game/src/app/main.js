/* [시작] 오류 처리·첫 화면 */
/* 오류가 나면: 기록에 알리고, 화면 위에 "메뉴로 / 저장 지우고 처음부터 / 새로고침" 비상 버튼을 띄움 (게임 화면에서 못 빠져나오는 일 방지) */
function rescueUI(msg){try{let r=document.getElementById("rescue");if(!r){document.body.insertAdjacentHTML("beforeend",'<div id="rescue"></div>');r=document.getElementById("rescue")}
r.innerHTML='<b>⚠️ 오류가 났어요</b><small>'+String(msg||"").replace(/</g,"&lt;").slice(0,120)+'</small><div><button onclick="rescueGo(0)">🏠 메뉴로</button><button onclick="rescueGo(1)">🗑 저장 지우고 처음부터</button><button onclick="location.reload()">🔄 새로고침</button><button onclick="this.closest(\'#rescue\').remove()">✖ 닫기</button></div>';}catch(x){}}
function rescueGo(clear){try{if(clear){localStorage.removeItem("pdr_save")}}catch(x){}const r=document.getElementById("rescue");if(r)r.remove();try{L.scr="menu";L.wait=0;L.act=null;L.picks=[];L.edTest=0;ui()}catch(x){location.href=location.pathname}}
window.addEventListener("error",e=>{try{console.error(e.error||e.message);const l=$("lg");if(l)l.textContent="⚠️ 오류가 났어요. 위의 비상 버튼으로 메뉴로 나가거나 처음부터 할 수 있어요.";if(L.scr!="menu")rescueUI(e.message)}catch(x){}});
/* 주소 뒤에 ?reset 을 붙여 열면 저장·설정을 모두 지우고 처음부터 */
try{if(/[?&]reset\b/.test(location.search)){localStorage.removeItem("pdr_save");localStorage.removeItem("design");history.replaceState(null,"",location.pathname)}}catch(e){}
try{ui()}catch(e){rescueUI(e.message)}
