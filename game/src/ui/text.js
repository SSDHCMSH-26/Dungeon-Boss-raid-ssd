/* 화면 고정 문구 T(이름표) + HTML data-t 채우기 */
const TXT=DATA.text.text,T=k=>Object.prototype.hasOwnProperty.call(TXT,k)?TXT[k]:"["+k+"]";
document.querySelectorAll("[data-t]").forEach(e=>{e.textContent=T(e.dataset.t)});
if(TXT["html.docTitle"])document.title=TXT["html.docTitle"];
