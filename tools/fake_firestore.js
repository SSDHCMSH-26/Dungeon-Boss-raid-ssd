// 가짜 Firestore(compat 모양) — 같은 브라우저의 두 탭이 localStorage 로 공유
(()=>{const P="FAKEFS:",subs={},rd=k=>{const v=localStorage.getItem(P+k);return v?JSON.parse(v):null};
const TS=t=>({__ts:t,toMillis(){return this.__ts}}),rev=o=>{if(o&&typeof o=="object"){if("__ts"in o)return TS(o.__ts);for(const k in o)o[k]=rev(o[k])}return o};
const fire=k=>{(subs[k]||[]).forEach(cb=>cb())};
window.addEventListener("storage",e=>{if(e.key&&e.key.startsWith(P))fire(e.key.slice(P.length))});
const SV={st:1},AU=v=>({au:v}),AR=v=>({ar:v});
const eq=(a,b)=>JSON.stringify(a)==JSON.stringify(b);
const wr=(k,obj)=>{localStorage.setItem(P+k,JSON.stringify(obj));setTimeout(()=>fire(k),0)};
const resolveVal=(cur,v)=>v===SV?{__ts:Date.now()}:v&&v.au?(cur||[]).concat(v.au.filter(x=>!(cur||[]).some(y=>eq(x,y)))):v&&v.ar?(cur||[]).filter(x=>!v.ar.some(y=>eq(x,y))):v;
const snap=k=>{const d=rd(k);return {exists:!!d,data:()=>rev(JSON.parse(JSON.stringify(d)))}};
const doc=k=>({set:async o=>{const d={};for(const f in o)d[f]=resolveVal(undefined,o[f]);wr(k,d)},update:async o=>{const d=rd(k);if(!d)throw Object.assign(new Error("no doc"),{code:"not-found"});for(const f in o)d[f]=resolveVal(d[f],o[f]);wr(k,d)},get:async()=>snap(k),onSnapshot:(cb,er)=>{(subs[k]=subs[k]||[]).push(()=>cb(snap(k)));setTimeout(()=>cb(snap(k)),0);return()=>{}}});
const fs={doc,batch:()=>{const ops=[];return {update:(r,o)=>ops.push(()=>r.update(o)),set:(r,o)=>ops.push(()=>r.set(o)),commit:async()=>{for(const f of ops)await f()}}}};
const uid="u"+Math.random().toString(36).slice(2,8);
const app={auth:()=>({signInAnonymously:async()=>({user:{uid}})}),firestore:()=>fs};
window.firebase={apps:[],app:()=>app,initializeApp:()=>(window.firebase.apps.push(app),app),firestore:{FieldValue:{arrayUnion:(...v)=>AU(v),arrayRemove:(...v)=>AR(v),serverTimestamp:()=>SV}}};
})();
