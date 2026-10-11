import json,sys
from playwright.sync_api import sync_playwright
JS="""([champ,pick,n,maxr])=>{const out=[];sync=()=>{};ui=()=>{};draw=()=>{};
for(let g=0;g<n;g++){try{
S=newS();S.champ=champ;S.pick=pick?pick.slice():Object.keys(CLS).sort(()=>Math.random()-.5).slice(0,3);S.map=genMap(champ);start();L.mode='solo';L.role='none';L.scr='game';L.used={};L.traps=[];L.bombs=[];L.act=null;L.picks=[];
let guard=0;while(!S.end&&S.round<=maxr&&guard++<2000){
 if(S.ph=='boss'){aiBoss();if(S.ph=='boss')endBoss()}
 else if(S.ph=='hero'){aiHero();if(S.ph=='hero')endHero()}
 else if(S.ph=='resolve'){resolve()}
 else break}
const alive=S.heroes.filter(h=>!h.dead).length;
out.push({w:S.end?(S.end.includes('용사 진영 승리')?'H':'B'):'T',r:S.round,bhp:S.boss.hp,al:alive,hp:S.heroes.reduce((a,h)=>a+(h.dead?0:h.hp),0),gen:S.gen?S.gen.hp:0,pick:S.pick.join(',')})
}catch(e){out.push({err:String(e.stack).slice(0,300)})}}
return out}"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium');pg=b.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('**/*',lambda r:r.continue_() if r.request.url.startswith('file:') else r.abort())
    pg.goto('file:///mnt/user-data/outputs/boss-raid-v58.html');pg.wait_for_timeout(600)
    res={}
    for champ in ['gron','vince']:
        for name,pick in [('random',None),('knight,cleric,archer',['knight','cleric','archer']),('knight,archer,mage',['knight','archer','mage'])]:
            r=pg.evaluate(JS,[champ,pick,60,40]);res[champ+'|'+name]=r
            ok=[x for x in r if 'err' not in x];er=[x for x in r if 'err' in x]
            H=sum(x['w']=='H' for x in ok);B=sum(x['w']=='B' for x in ok);T=sum(x['w']=='T' for x in ok)
            rs=[x['r'] for x in ok]
            print(champ,name,'heroWin',H,'bossWin',B,'timeout',T,'avgRound',round(sum(rs)/max(1,len(rs)),1),'errs',len(er),er[:1])
    json.dump(res,open('sim_result.json','w'))
    print(errs[:3]);b.close()
