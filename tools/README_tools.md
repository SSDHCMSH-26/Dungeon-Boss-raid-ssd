# tools/ 사용법
모두 Python + Playwright(Chromium) 기준. `file://` 로 게임 HTML 을 열어 `page.evaluate` 로 게임 함수를 직접 호출합니다.
- `sim.py` — 컴퓨터 보스 vs 컴퓨터 용사를 N판 돌려 승률/평균 라운드를 출력 (밸런스 확인용). 파일 경로는 상단의 `goto(...)` 수정.
- `test_mobs_example.py`, `test_walls_example.py` — 규칙 테스트 작성 예시 (상태를 직접 세팅하고 함수 호출 → 결과 출력).
- `extract_sprites_example.py` — 이미지 시트에서 스프라이트를 잘라 base64 로 변환하는 예시 (원본 이미지 경로는 본인 환경에 맞게 수정).
- `extract_art.py` — `game/index.html` 의 base64 그림을 `game/art/` 파일로 분리 (v59에서 1회 실행 완료. 다시 돌려도 바뀌는 것 없음).
- `test_art_split.py` — 분리 전/후 비교 테스트. `python3 tools/test_art_split.py <분리 전 html>` (예: `git show 7f69f1a:game/index.html > /tmp/before.html`).
- `patch_example.py` — 문자열 교체 방식 패치 예시 (`rep(원본, 새것)` 이 정확히 1곳에서만 일치하는지 assert).
테스트 팁: 화면 없이 규칙만 볼 때는 `sync=()=>{};` 로 동기화 함수를 비우고, 화면을 찍을 때는 `document.getElementById('g').style.display='block'` 후 `draw()`.
