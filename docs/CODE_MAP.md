# CODE_MAP — `boss-raid-v58.html` 구조

## 파일 형태
- 한 줄이 매우 긴 단일 HTML. 이미지(base64)가 들어 있는 줄은 7개 정도(줄 길이 10만~26만 자)이고 전체 1.54MB 중 약 1.4MB 입니다. 줄 길이로 찾으세요: `awk '{print NR, length}' boss-raid-v58.html | sort -k2 -n -r | head`. 그 줄들은 읽지 마세요. 이미지 변수: `T3A`(테마3 용사·효과), `ART`/`ART2`/`ART3`(디자인별 스프라이트), `MOBA`(미믹·고블린).
- 코드 부분은 약 100~150KB. 함수 이름으로 검색(Grep)해서 해당 줄만 읽는 방식 권장.
- `<script>` 는 두 개 이상일 수 있으니 문법 검사는 "가장 긴 script" 를 추출해서 `node --check`.

## 핵심 상태 `S` (온라인 시 JSON 으로 동기화)
`ph`(setup/boss/hero/resolve) · `round` · `champ`(gron/vince) · `map`(문자열 N*N, "1"=벽) · `boss`{x,y,hp,max,ap,moved,bind,en…} · `gen`(빈센토전 발전기) · `heroes[]`{k,x,y,hp,max,ap,mc,guard,par,dead,stun,sup,cd{},nt,gold…} · `atks`(예고된 공격) · `rev`(공개된 함정) · `mv`(이번 턴 이동 기록) · `pits` · `chests[]`{id,x,y,k("t"/"x"),age} · `mobs[]`{id,k("mimic"/"gob"),x,y,hp,mx,hold,vi,gold,loot,items} · `walls[]`{x,y,t,lv,hp} · `mw`(맵 기본 벽의 손상 체력) · `belts`/`fac`/`rob`/`cry`(빈센토 요소) · `gold`{b,h}(보스 합산) · `bag`{b,h}{potion,scroll,gem} · `cd`(보스 쿨타임) · `hfx`/`cfx`/`rfx`(연출용) · `end`(종료 메시지) · `log`.
## 로컬 상태 `L`
`mode`(solo/local/multi) · `role`(boss/hero) · `act`(선택 중 스킬) · `picks`(찍은 칸) · `design`(old/t2/t3) · `traps`/`bombs`(보스가 숨겨 설치한 것) · `used`(턴당 사용 횟수) · `bag`(가방 열림) 등.

## 데이터 정의
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
