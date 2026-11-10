# 셰프의 식탁 (요리 레시피 수집 · 식단 구상 · 식당 운영 게임) — 인수인계

> 던전 게임(`game/`)과는 **별개의 새 게임**입니다. 이 폴더(`cooking/`) 안에서만 작업합니다.
> 새 대화에서 이어 할 때: 이 파일 → `docs/GAME_SPEC.md` 순서로 읽게 하세요.

## 한 줄 요약
재료·조리법을 실험해 **레시피를 수집**하고, **코스 요리 / 한식 반상**을 짜면 전문가 수준의 **식단 평가**(흐름·맛 균형·반복·질감·온도·색·오방색·첩수·계절·영양)를 받고, 손님을 받아 **식당을 키우는** 게임.

## 파일
| 경로 | 내용 |
|---|---|
| `index.html` | 개발용 화면 (data/*.json 을 읽음 → 웹서버로 열기) |
| `dist/index.html` | **배포용 한 파일** (데이터·코드 포함, 그냥 열어도 됨). `node cooking/tools/build.js` 로 만듦 |
| `src/core/flavor.js` | 한 그릇의 맛 계산 (재료+조리법 → 맛 7가지·향·질감·온도·무게감·색·원가·완성도와 이유) |
| `src/core/menu.js` | 식단 평가 (코스 / 반상) |
| `src/core/game.js` | 게임 상태·행동 `CK.apply(D, S, {type:...})` · 영업 시뮬레이션 · 연구실 |
| `src/ui/` | 화면 (app.js, style.css) |
| `data/ingredients.json` | 재료 162개: 맛 수치, 향, 감칠맛 성분, 질감, 색, 제철, 원가 |
| `data/techniques.json` | 조리법 18개: 맛 변화, 질감, 온도, 반상 분류, 필요 설비, 조리 과학 설명 |
| `data/recipes.json` | 레시피 210개 (12개 문화권) |
| `data/pairings.json` | 좋은 짝 57개 · 나쁜 짝 9개 (이유 포함) |
| `data/shop.json` | 요리책 16권 · 설비 9개 |
| `data/customers.json` | 손님 10종 (취향·지갑·메뉴를 따지는 정도) |
| `data/rules.json` | 규칙 수치 (시작 돈, 고정비, 평론가 별 기준 …) |
| `data/knowledge.json` | 게임 속 '요리 과학' 사전 17항목 |
| `tools/test_core.js` | 검사 (데이터 연결 · 모든 레시피 발견 가능 · 평가 상식 · 결정론) |

## 규칙 (core 쓰는 법)
- core 는 화면·`Math.random`·`Date.now` 를 쓰지 않음. 무작위는 상태 안 씨앗 `S.rng` (mulberry32) → 같은 씨앗 + 같은 행동 = 같은 결과.
- 게임을 바꾸는 것은 `CK.apply(D, S, 행동)` 하나뿐: `cook`, `setMenu`, `setPrice`, `runDay`, `buyBook`, `buyEquip`, `renameCustom`, `delCustom`, `rename`.
- 수치만 바꿀 때는 `data/*.json` 만 고치고 테스트.

## 수정 후 할 일
```
node cooking/tools/test_core.js     # 검사
node cooking/tools/build.js         # dist/index.html 다시 만들기
```
그 다음 `docs/CHANGELOG.md`, `docs/GAME_SPEC.md` 갱신.

## 확인이 필요한 점 / 다음 단계 후보
- 재료 맛 수치는 일반적인 조리 지식을 바탕으로 정한 값 (전문 셰프 감수 전).
- 아직 없음: 음료(와인·전통주) 페어링, 직원 고용, 재고·유통기한, 손님 개별 주문(단품 메뉴판), 이벤트(단체 예약·축제), 그림.
- 이 게임은 지금 던전 게임 저장소 안 폴더에 있음. 정식으로 키우려면 **별도 저장소**로 옮기는 것을 추천.
