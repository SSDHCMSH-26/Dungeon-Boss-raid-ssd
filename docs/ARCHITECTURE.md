# ARCHITECTURE — 코드 구조 (v67~)

> 목표: **규칙 계산(core)을 화면과 완전히 떼어서**, 같은 코드가 브라우저와 서버(Node.js)에서 똑같이 돌게 하기.
> 그래야 온라인 랭크전에서 서버가 공정하게 판정할 수 있음.

## 1. 층(레이어)과 파일
```
game/
  index.html            로더: data 검사 → src 파일을 정해진 순서로 실행
  lib/validate.js       데이터·맵 검증기 (게임·도구·서버 공용)
  data/                 수치·맵·AI·그림·글자 (JSON)
  src/
    core/   ★ 규칙 계산 — 화면·기기·시계·무작위에 직접 손대지 않음 (서버에서 그대로 실행)
      env.js      바깥과 만나는 유일한 통로: PRES(화면 알림), NOW(연출 시각), RAND/ARAND(씨앗 고정 무작위), SEED
      data.js     data/*.json → 게임 표(CLS, CH, RULE, MOB, ITEMS …)
      state.js    게임 상태 S, newS(), 칸·거리 도구, shuffle()
      view.js     view(S, 진영) — 진영별로 보여 줄 상태(숨김 정보 제거)
      map.js      맵 만들기 (맵 파일 / 랜덤 미로)
      rules.js    행동·정산 규칙 (스킬, 보스, 몬스터, 상자, 크리스탈, 턴 정산 …)
      actions.js  apply(행동) — 게임을 바꾸는 유일한 입구 + 기록(REC) + replay()
      ai.js       컴퓨터 플레이어 (판단 후 apply 로 행동)
      sim.js      ruleState / stateHash / simMatch (화면 없이 한 판)
    render/  그리기 (캔버스·스프라이트·애니메이션) — core 의 PRES 알림을 받아 그림
    ui/      화면 HTML (메뉴·패널·정보 창), 글자 T()
    input/   터치·버튼 → apply
    net/     둘이서 하기(claude.ai db)·이어하기 저장, sync()
    app/     기기 상태 L, 진행 루프(혼자 하기), 화면 쪽 명령(commands), 시작
```
의존 방향: `app / input / ui / render / net` → `core` (core 는 위쪽을 모름)

## 2. 쓰는 방식 (게임 개발에서 흔히 쓰는 패턴)
| 패턴 | 여기서 | 효과 |
|---|---|---|
| **명령(Command) 패턴** | 모든 변경은 `apply({type:"heroAct", h, j, x, y})` 같은 JSON 행동으로 | 네트워크로 보내기 쉬움, 서버가 같은 행동을 검증·실행 |
| **결정론적 시뮬레이션** | 무작위는 씨앗 고정 의사난수(mulberry32), 진행 값은 상태 `S.rng` 안 | 같은 씨앗 + 같은 행동 = 어디서나 같은 결과 |
| **리플레이** | `REC` 에 씨앗·행동 목록 기록, `replay(log)` | 버그 재현, 부정행위 검증, 관전 |
| **포트·어댑터** | core 는 `PRES.path/fx/…` 로 "보여 달라"고만 알림, render 가 연결 | 화면 없는 서버에서도 그대로 실행 |
| **전장의 안개(view projection)** | `view(S, "hero")` 가 보스 비밀·숨은 구덩이·함정 상자 여부 등을 뺌 | 서버가 진영별로 필요한 것만 보냄 → 훔쳐보기 방지 |
| **AI = 플레이어** | AI 는 자기 주사위(`ARAND`, `S.airng`)로 판단하고 apply 로만 행동 | 판 결과가 행동 기록만으로 정해짐 |
| **엔진 무관 섞기** | `shuffle()` (Fisher–Yates). sort 에 무작위 비교 금지 | JS 엔진 버전이 달라도 같은 결과 |
| **자동 경계 검사** | `tools/check_core.js` | core 가 화면·기기·시계·Math.random 을 쓰면 실패 |

## 3. 행동(apply) 목록
`setPick{ids}` `pickHero{k}` `pickChamp{id}` `start` · `heroAct{h, j("m"|"x"|스킬 번호), x, y}` `heroItem{h, k}` `scrollHero{h, x, y}` ·
`bossMove{x, y}` `bossAttack{i, p, fb}` `bossBuild{id, p}` `genCharge` `bossItem{gen, k}` `scrollBoss{gen, x, y}` ·
`endBoss` `endHero` `resolve` `settle`(행동 뒤 정리: 상자 열기 판정·숨김 정보 복사 — 예전엔 sync() 안에 숨어 있던 규칙)

## 4. 상태 S 에서 규칙 / 연출 구분
- 규칙 상태: 위치·체력·AP·쿨타임·맵·상자·몬스터·`sec`(보스 비밀)·`used`(턴 사용 횟수)·`seed`/`rng` 등
- 연출 칸(규칙 판단에 안 씀, `ruleState` 에서 제외): `aT aK hurtT tpT enT fxT fxA revT rfxT rfx cfx fall pfx sink hop hfx`, AI 주사위 `airng`
- 기기 상태 L(화면용만): 선택 중인 스킬·찍은 칸·메뉴·디자인·보기 탭 등. 규칙은 L 을 모름

## 5. 서버로 갈 때 (다음 단계 예상)
1. Node.js 서버가 `tools/headless.js` 의 `createEngine()` 처럼 core 를 방마다 하나씩 불러 둠 (`SEED` 는 서버가 정함)
2. 기기는 행동 JSON 만 보냄 → 서버가 `apply` (지금 차례·권한 확인 추가 필요) → 결과 `view(S, 진영)` 를 각 기기에 보냄
3. 기기는 받은 상태를 그리기만 (지금의 render/ui 그대로)
4. 판이 끝나면 `REC` 저장 → 이의 제기 시 `replay` 로 검증
> 아직 남은 것: 차례·권한 검사(지금은 화면이 막아 줌), 게임 끝 판정을 글자 대신 값으로, 전투 기록 문장 틀화, 연출 칸을 상태 밖으로 완전히 분리.

## 6. 검사 도구
| 도구 | 확인 |
|---|---|
| `node tools/check_core.js` | src 문법 + core 경계(화면·기기·시계·무작위·무작위 정렬) |
| `node tools/headless.js selftest` | 화면 없이 실행, 같은 씨앗=같은 결과, 리플레이, view() 숨김 |
| `python3 tools/test_engine_parity.py [N]` | 브라우저 = Node.js (지문·라운드·승패), 브라우저 기록 → Node 리플레이 |
| `python3 tools/test_boss_art.py` | 느린 인터넷에서도 보스가 옛 임시 그림으로 안 바뀌는지 |
| `python3 tools/compare_versions.py <이전 game>` | 이전 버전과 데이터·화면·규칙·AI 대전·실제 진행 루프 비교 |
| `node tools/validate_data.js [--selftest]` | 데이터·맵 검사 |
| `node tools/headless.js sim 400` | 화면 없이 대전 → 승률·평균 라운드 (밸런스) |
