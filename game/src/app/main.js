/* [시작] 오류 처리·첫 화면 */
window.addEventListener("error",e=>{try{console.error(e.error||e.message);const l=$("lg");if(l)l.textContent="⚠️ 오류가 났지만 게임은 유지돼요. 계속 진행해 보세요."}catch(x){}});
ui();
