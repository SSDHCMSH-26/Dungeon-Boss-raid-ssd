# CODE_MAP — `game/index.html` 구조 (v66)

## 파일 형태
- 코드만 든 HTML(약 125KB). 그림은 `game/art/` 폴더의 파일(약 1.4MB, 134개), 그 경로 목록은 v65부터 `game/data/art.json`.
- 그림 변수 → 폴더: `T3A`→`art/t3a/`(테마3 용사·효과), `ART`→`art/art1/`, `ART2`→`art/art2/`, `ART3`→`art/art3/`(+ `Object.assign(ART3,…)` 의 상자·아이템 → `art/art3b/`), `FACE`/`FACEG`→`art/face/`, `MOBA`→`art/mob/`(미믹·고블린), `FXD`→`art/fx/`, 번개 크리스탈→`art/crystal/`. `art/art3/t_spear.png`·`t_flame.png` 는 `art3b` 것으로 덮어써져 실제로는 안 쓰임(원본과 동일하게 보존).
- 그림 추가/교체: 파일을 해당 폴더에 넣고 변수에 `"이름": "art/폴더/이름.png"` 한 줄 추가. 그림은 비동기로 열리므로 쓰는 쪽은 기존처럼 `i.complete&&i.naturalWidth` 확인 후 그리고, `onload` 에서 `draw()`.
- 코드 부분은 약 100~150KB. 함수 이름으로 검색(Grep)해서 해당 줄만 읽는 방식 권장.
- `<script>` 는 두 개 이상일 수 있으니 문법 검사는 "가장 긴 script" 를 추출해서 `node --check`.

## 핵심 상태 `S` (온라인 시 JSON 으로 동기화)
`ph`(setup/boss/hero/resolve) · `round` · `champ`(gron/vince) · `map`(문자열 N*N, "1"=벽) · `boss`{x,y,hp,max,ap,moved,bind,en…} · `gen`(빈센토전 발전기) · `heroes[]`{k,x,y,hp,max,ap,mc,guard,par,dead,stun,sup,cd{},nt,gold…} · `atks`(예고된 공격) · `rev`(공개된 함정) · `mv`(이번 턴 이동 기록) · `pits` · `chests[]`{id,x,y,k("t"/"x"),age} · `mobs[]`{id,k("mimic"/"gob"),x,y,hp,mx,hold,vi,gold,loot,items} · `walls[]`{x,y,t,lv,hp} · `mw`(맵 기본 벽의 손상 체력) · `belts`/`fac`/`rob`/`cry`(빈센토 요소) · `gold`{b,h}(보스 합산) · `bag`{b,h}{potion,scroll,gem} · `cd`(보스 쿨타임) · `hfx`/`cfx`/`rfx`(연출용) · `end`(종료 메시지) · `log`.
## 로컬 상태 `L`
`mode`(solo/local/multi) · `role`(boss/hero) · `act`(선택 중 스킬) · `picks`(찍은 칸) · `design`(old/t2/t3) · `traps`/`bombs`(보스가 숨겨 설치한 것) · `used`(턴당 사용 횟수) · `bag`(가방 열림) 등.

## 데이터 정의
- **수치 데이터는 `game/data/*.json`** (뜻: `game/data/README.md`). 시작 순서: 게임 코드는 `<script id="main" type="text/plain">` 에 들어 있고, 맨 아래 `<script src="lib/validate.js">` + 로더가 `PDRValidate.FILES` 의 파일을 모두 fetch → `dataFile()` 로 format·version·내용 검사 → `body()` 로 format/version 을 뺀 내용을 `DATA[이름표]` 에 저장 → `links()` 로 파일 간 ID 연결 검사 → 통과하면 main 실행(`window.GAME_READY=1`). 실패 시 화면 맨 위에 오류 목록. **새 데이터 파일은 `validate.js` 의 `FILES` 와 `BODY`(검사 규칙)에 추가.**
  - `DATA` 이름표: heroes, skills, monsters, champions, rules(=rulesets/standard.json), items, loot
  - 코드 쪽 별칭: `RULE`(규칙 묶음), `CST()`(지금 챔피언 stats), `GAP()`(발전기 AP), `HSK(t)`/`EXS(id)`(스킬 찾기), `GRD`/`WAL`/`PIT`/`BRUN`(자주 쓰는 스킬 fx), `ROB`/`FAC`/`BMB`(로봇·공장·폭탄), `ITEMS`(이름·아이콘·설명)·`ITEF`(아이템 effect)·`bag0()`(빈 가방), `CHR`(상자 규칙), `LOOT`/`LOOTW`/`LOOTI`(드롭표), `CRY`(크리스탈). 예전 상수 `TR`, `TMAX`, `BOMBV`, `RHP`, `CRMAX`, `CRLIFE` 는 데이터에서 만든 값으로 남아 있음.
  - 보스 체력·AP 는 `newS()` 에선 0, `pickChamp`/`start` 에서 champions.json stats 로 설정.
  - **글자**: `T(이름표)` → `DATA.text.text[이름표]` (없으면 `[이름표]`). HTML 고정 글자는 `data-t` 속성으로 시작 때 채움, `document.title` 도. 새 고정 문구를 화면에 넣을 때는 ko.json 에 이름표를 추가하고 `T(...)` 로 쓰기 (`node tools/validate_data.js` 가 빠진·안 쓰는 이름표를 알려 줌).
  - **AI**: `AI`=ai.json, `AB`/`AH`(보스/용사 설정), `cex(c,id)` 챔피언 설치 스킬을 id 로 찾기. 판단 흐름은 `aiBoss`/`aiHero` 코드.
  - **그림·디자인**: `ART_`=art.json, `IMG`(images), `DSN`(designs). `T3A`/`ART`/`ART2`/`ART3`/`MOBA`/`FXD`/`FACE`/`FACEG`/`TH` 는 art.json 에서 만든 값. `setDesign` 은 `DSN.order` 순환.
  - **맵**: 로더가 `DATA.mapIndex.maps` 의 각 맵을 `PDRValidate.mapText()` 로 검사 후 `DATA.maps[id]` 에 저장. `mapOf(챔피언)` = 기본 맵. `genMap(id)`: tiles 맵은 `PDRValidate.mapString()`("0"/"1" 900글자), generator maze 는 `mazeMap()`. `start()` 가 `spawns`(보스·발전기·용사)와 `objects`(상자·함정 상자·구덩이)를 적용. 게임 내부 `S.map` 형식은 그대로("1"=벽).
  - `CLS[k] = {...DATA.heroes[k], sk: DATA.skills.heroes[k]}` (키 순서 유지)
  - `CH` 의 이름·설명·플래그(`n,s,m,ok,bash,bn,gen`)는 코드에, 스킬(`at,gx,ex`)은 `...DATA.skills.champions[id]`
  - `MOB = DATA.monsters` — `mobSpawn`(체력), `mobAct`(이동·피해·AP·강탈 확률/금화), `chOpen`/`chAge`(미믹 확률·제압 턴), `supTick`(제압 피해), `ipH`(몬스터 정보 창 문구). `pct(v)` = 확률 → "60%" 문자열.
- `CH` — 챔피언/스킬 정의(`at` 공격, `ex` 설치·특수, `gx` 발전기 스킬). `CLS` — 용사 4직업(`sk` 스킬: t=d 단일/범위 피해, h 치유, g 방패막기, l 성광, u 계시, r 방패돌진, b 순간이동, o 마력 방출). `ITEMS`, `RHP`(로봇 체력), `BAP`/`GAP`(AP), `TR`/`BOMBV`(피해), `CRMAX`/`CRLIFE`.

## 주요 함수 (검색 키워드)
- **용사 행동**: `act` → `act0`(스킬별 분기; j=="x" 벽 부수기, "m" 이동, t==…) · `dealHits`(피해 적용·몬스터/벽 정리) · `hits`(지정 칸의 피격 대상: 보스·발전기·공장·로봇·몬스터·벽) · `hurt`(용사 피해, 방패막기 경감) · `qp`(퀸 이동 경로) · `pitCheck`/`chestPath`/`ride`(이동 중 효과)
- **보스 행동**: `bAtk`(공격 예고) · `bEx`(설치/특수: wall, trap, dig, pit, hop, tchest, fac, bomb, belt, run) · `bMove`/`bMove0`/`bOk` · `bExtra` · `genCharge` · `endBoss`/`endHero`
- **정산**: `resolve`(순서: 제압 틱 → 공격/함정/폭탄 → 로봇 → 몬스터 `mobsAct` → 상자 방치 `chAge` → 공장·쿨타임 → 새 상자 `chSpawn` → 라운드+1) · `robAct` · `runBelts`
- **상자·몬스터**: `chSpawn`, `chOpen`, `chestScanAll`, `supTick`(제압 7피해), `mobSpawn`, `mobAct`, `mobStep`(BFS), `mobClean`, `chAge`
- **벽**: `wDmg`(벽 피해), `mwClean`(기본 벽 정리), `wTint`(레벨 색)
- **AI**: `aiSetup`, `aiBoss`, `aiHero`, `bfsD`, `tick`/`tickB`(혼자하기 진행)
- **온라인/저장**: `push`(db 쓰기), `listen`, `sync`, `save`/`loadSave`/`resume`
- **그리기**: `draw`(전체; `rg`/`pv`/`rs` 미리보기 집합), `sp`/`spI`/`spT`(스프라이트), `hsp`/`t3i`/`drawHfx`(테마3), `drawChests`, `vp`/`vpath`(이동 애니메이션 큐)
- **UI**: `ui`, `menu`, `qkH`(퀵 버튼·가방), `amH`(스킬 선택), `ipH`(유닛 정보), `cfH`(확정 창), `unitAt`

## 수정할 때 주의점
- 쿨타임 규칙: 스킬 사용 시 `cd+1` 을 세팅하고 정산 때마다 -1 (사용한 턴 포함해 N턴 대기). 보스는 `S.cd[id]`, 용사는 `h.cd[j]`.
- `blk(x,y)` 는 벽·공장·로봇·몬스터 칸을 포함. `bad(x,y)` 는 blk + 용사 + 빈센토·발전기 칸.
- 새 유닛을 추가하면 `hits`, `blk`, `unitAt`, `ipH`(정보 창), `draw`, AI 타겟팅을 같이 고칠 것(몬스터 추가 때 수정한 지점 참고).
- 피해 계산은 `dealHits` 한 곳(빈센토 -25% 포함). 새 피해는 가능하면 여기로 통과시킬 것.
- 온라인에선 `S` 전체가 JSON 으로 오가므로 새 필드는 JSON 직렬화 가능한 값만(함수·Map 금지).
- 이동 연출: 위치를 바꿀 때 `vpath("h"+i, 경로)` 를 쓰면 걷는 모션, 안 쓰고 `VP` 를 스냅하면 순간이동처럼 나타남(마법사 순간이동은 `tpT` 로 페이드인).
- 패치 후에는 반드시 `node --check` 와 테스트(`tools/`)로 확인.
