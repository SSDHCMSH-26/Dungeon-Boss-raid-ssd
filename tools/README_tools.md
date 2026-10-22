# tools/ 사용법
모두 Python + Playwright(Chromium) 기준. `file://` 로 게임 HTML 을 열어 `page.evaluate` 로 게임 함수를 직접 호출합니다.
- `sim.py` — 컴퓨터 보스 vs 컴퓨터 용사를 N판 돌려 승률/평균 라운드를 출력 (밸런스 확인용). 파일 경로는 상단의 `goto(...)` 수정.
- `test_mobs_example.py`, `test_walls_example.py` — 규칙 테스트 작성 예시 (상태를 직접 세팅하고 함수 호출 → 결과 출력).
- `extract_sprites_example.py` — 이미지 시트에서 스프라이트를 잘라 base64 로 변환하는 예시 (원본 이미지 경로는 본인 환경에 맞게 수정).
- `test_online.py` — 둘이서 하기(Firebase 모드) 두 탭 대전 테스트(가짜 서버 `fake_firestore.js`). 통신 코드(`game/src/net/net.js`)를 바꾸면 돌림.
- `cut_sprites.py` — 한 장짜리 캐릭터 설정 시트에서 스프라이트·효과를 잘라 투명 PNG 로 저장 (`python3 tools/cut_sprites.py 원본.png 설정.json`, 설정 예는 파일 맨 위 설명). 궁수 그림(v80)에 사용.
- `extract_art.py` — `game/index.html` 의 base64 그림을 `game/art/` 파일로 분리 (v59에서 1회 실행 완료. 다시 돌려도 바뀌는 것 없음).
- **코드 분리 검사 (v67~)**
  - `check_core.js` — `node tools/check_core.js`: game/src 전체 문법 + core 경계(화면·기기 상태·시계·Math.random·무작위 비교 정렬 금지).
  - `headless.js` — 화면 없이(Node.js) 규칙 엔진 실행 = 서버 시제품. `sim [판 수] [시작 씨앗]`(밸런스), `match <씨앗> <챔피언> <용사들>`, `selftest`(같은 씨앗=같은 결과·리플레이·정보 숨김).
  - `test_engine_parity.py` — `python3 tools/test_engine_parity.py [판 수]`: 같은 씨앗으로 브라우저와 Node.js 결과 비교 + 브라우저 기록을 Node 에서 리플레이.
- `validate_data.js` — `node tools/validate_data.js` 데이터·맵 파일 검사(게임과 같은 검증기). `--selftest` 는 무작위로 망가뜨린 맵 3000개로 검증기가 멈추지 않는지도 확인. `--selftest` 는 `validate_cases.js` 의 "일부러 틀린 데이터"를 모두 잡는지 확인. 검사 규칙을 추가하면 틀린 예시도 같이 추가.
- `compare_versions.py` — **이전/이후 버전 비교 테스트(v62~ 기본 테스트)**. `python3 tools/compare_versions.py <이전 game 폴더> [이후 game 폴더] [--games N]`. 이전 폴더 만들기: `git archive origin/main game | tar -x -C /tmp/before` → `/tmp/before/game`. 웹서버를 자동으로 띄우고 난수·시각을 고정해 데이터(게임 시작 후 실제 값)·화면 9종(메뉴·선택 2·디자인 3×챔피언 2)·규칙 테스트·몬스터 시나리오(보물상자 2000개 포함)·화면 글자(정보 창·메뉴·기록·아이템 사용)·스킬 시나리오(모든 스킬 직접 사용)·AI 대전 N판(챔피언별) 결과가 같은지 확인.
- 참고: v62부터 게임은 `data/*.json` 을 읽으므로 `file://` 로 여는 예전 예시(sim.py 등)는 웹서버 주소로 바꿔서 써야 함(compare_versions.py 는 그 JS 를 웹서버에서 재사용).
- `test_art_split.py` — (v59 전용, file:// 사용) — 분리 전/후 비교 테스트. `python3 tools/test_art_split.py <분리 전 html>` (예: `git show 7f69f1a:game/index.html > /tmp/before.html`).
- `patch_example.py` — 문자열 교체 방식 패치 예시 (`rep(원본, 새것)` 이 정확히 1곳에서만 일치하는지 assert).
테스트 팁: 화면 없이 규칙만 볼 때는 `sync=()=>{};` 로 동기화 함수를 비우고, 화면을 찍을 때는 `document.getElementById('g').style.display='block'` 후 `draw()`.
