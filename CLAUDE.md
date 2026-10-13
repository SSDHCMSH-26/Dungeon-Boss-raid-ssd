# 작업 규칙 (Claude용)
- 사용자는 비개발자(한국어). 한 단계씩 쉽게 설명한다. 개발 외 런칭/법률은 상세히 안내한다.
- 먼저 docs/README_HANDOFF.md, docs/CODE_MAP.md, docs/GAME_SPEC.md, docs/ARCHITECTURE.md 를 읽는다.
- 게임 코드는 game/src/ 역할별 파일(규칙 계산은 src/core/), 수치·맵·글자는 game/data/*.json. 필요한 부분만 부분 수정(패치)한다.
- src/core/ 는 화면·기기 상태(L)·Date.now·Math.random 을 직접 쓰지 않는다(PRES/NOW/RAND 사용). 게임 변경은 apply({type:...}) 로.
- 수정 후 테스트: node tools/check_core.js · node tools/validate_data.js · node tools/headless.js selftest · python3 tools/test_engine_parity.py · node tools/test_circle.js · node tools/test_rules_misc.js · python3 tools/compare_versions.py <이전 game 폴더>
- 밸런스(승률) 비교용 AI 대전은 사용자가 요청할 때만 한다. 작동 확인용 테스트는 평소대로 한다.
- 사용자는 모바일. 머지를 부탁할 때는 항상 PR 링크(https://github.com/SSDHCMSH-26/Dungeon-Boss-raid-ssd/pull/번호)를 함께 준다.
- 변경 후 docs/CHANGELOG.md 와 GAME_SPEC.md 를 갱신한다.
- 장기 방향: docs/VISION_ROADMAP.md (1단계: 수치를 data/*.json 으로 분리).
