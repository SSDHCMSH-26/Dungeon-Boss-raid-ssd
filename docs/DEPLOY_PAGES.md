# GitHub Pages 배포 안내 (폰에서 게임 열기)

## 주소
**https://ssdhcmsh-26.github.io/Dungeon-Boss-raid-ssd/**
(아래 설정을 마치고 첫 배포가 끝난 뒤부터 열립니다.)

## 어떻게 동작하나
- `.github/workflows/pages.yml` 이 **main 브랜치의 `game/` 폴더**를 그대로 웹사이트로 올립니다.
- main 에 `game/` 변경이 합쳐질 때마다(PR 머지) **자동으로 다시 배포**됩니다. 보통 1~2분 걸림.
- 직접 다시 올리고 싶으면: 저장소 → **Actions** 탭 → 왼쪽 "Deploy game to GitHub Pages" → **Run workflow**.

## 사용자가 직접 해야 하는 설정 (처음 한 번)
### 0단계: 저장소 공개 여부 정하기 (중요)
지금 저장소는 **비공개(Private)** 입니다. GitHub 무료 계정은 **공개 저장소에서만** Pages 를 쓸 수 있습니다.
- **방법 A — 저장소를 공개로 전환(무료)**: 코드·그림·문서를 누구나 볼 수 있게 됩니다.
  - 주의: 그림은 제공받은 컨셉 시트에서 잘라 쓴 것이라 **사용 권한이 확인되지 않았습니다**(LAUNCH_LEGAL_GUIDE.md). 공개하면 다른 사람이 그림을 내려받을 수 있습니다. docs 의 계획 문서도 공개됩니다.
  - 설정: 저장소 → **Settings** → 맨 아래 **Danger Zone** → **Change repository visibility** → **Change to public** → 확인 문구 입력.
- **방법 B — GitHub Pro 구독(유료, 월 약 $4)**: 저장소는 비공개로 두고 Pages 만 사용.
  - 설정: 오른쪽 위 프로필 사진 → **Settings** → **Billing and plans** → **Plans and usage** → **Upgrade to Pro**.
  - 주의: 이 경우에도 **게임 사이트 자체는 주소를 아는 누구나 열 수 있습니다**(코드 저장소만 비공개).

### 1단계: Pages 켜기
1. 저장소 페이지 위쪽 **Settings**(톱니바퀴) 클릭
2. 왼쪽 메뉴에서 **Pages** 클릭
3. **Build and deployment** → **Source** 드롭다운에서 **GitHub Actions** 선택 (저장 버튼 없음, 선택하면 끝)

### 2단계: PR 머지
- 이 설정이 들어 있는 PR 을 **Merge pull request** → **Confirm merge**.
- 머지되면 자동으로 첫 배포가 시작됩니다. **Actions** 탭에서 초록 체크(✓)가 뜨면 완료.
- 만약 1단계 전에 머지해서 빨간 X 가 떴다면: 1단계를 한 뒤 Actions → "Deploy game to GitHub Pages" → **Run workflow** 를 누르세요.

### 3단계: 폰에서 열기
- 위 주소를 폰 브라우저에 입력. 홈 화면에 추가하면 앱처럼 바로 열 수 있습니다
  (iPhone Safari: 공유 버튼 → "홈 화면에 추가" / 안드로이드 Chrome: ⋮ → "홈 화면에 추가").

## 이 주소에서 안 되는 것
- **둘이서 하기(온라인)**: Claude 아티팩트의 db 기능을 쓰기 때문에 claude.ai 링크에서만 됩니다. 이 주소에서는 안내 창이 뜹니다. (혼자 하기·한 기기 테스트는 정상)
- 저장(이어하기)은 브라우저별로 따로 저장됩니다.
