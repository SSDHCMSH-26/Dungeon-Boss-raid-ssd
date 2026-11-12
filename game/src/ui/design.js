/* [화면] 디자인(테마) 선택 */
function T2(){return L.design=="t2"||L.design=="t3"||L.design=="t4"}
/* 테마 3 그림(용사 애니메이션·스킬 효과)을 쓰는 디자인: 테마 3·4 */
function T3G(){return L.design=="t3"||L.design=="t4"}
function setDesign(d){{const o=DSN.order,i=o.indexOf(L.design);L.design=d||(i>=0?o[(i+1)%o.length]:DSN.legacy[L.design])||o[0]}try{localStorage.setItem("design",L.design)}catch(e){}ui()}
