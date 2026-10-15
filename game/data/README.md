# game/data — 게임 수치 파일 (v63~)

여기 있는 JSON 파일의 숫자를 바꾸면 게임 코드를 건드리지 않고 수치를 바꿀 수 있습니다.

## 꼭 지킬 것
- **확인 순서**: 고친 뒤 ① `node tools/validate_data.js` (형식 검사) → ② `python3 tools/compare_versions.py <이전 game 폴더>` (바꾼 부분만 달라지는지. 바꾼 만큼 FAIL 이 나오는 게 정상).
- JSON 규칙: 마지막 항목 뒤에 쉼표 금지, 글자는 큰따옴표("…"), 주석 불가.
- 모든 파일 맨 위의 `format`(파일 종류)·`version`(형식 버전)은 **바꾸지 마세요**. 틀리거나 값이 이상하면 게임 첫 화면에 **무엇이 왜 틀렸는지 목록**이 뜨고 게임이 시작되지 않습니다(검사: `game/lib/validate.js`).
- 이름표(ID: `knight`, `gron`, `potion`, 스킬의 `t`·`id` 등)는 다른 파일·코드가 가리키므로 **바꾸지 마세요**. 확률은 0~1(0.6 = 60%).
- 설명 문구(`d`, `sm`, `pas`, 아이템 `d`)는 **글자 그대로** 표시됩니다. 수치를 바꾸면 그 설명 속 숫자도 직접 고치세요.
  (단, 정보 창·로그·힌트 등 코드가 만드는 문구는 데이터 숫자를 자동으로 씀)
- `index.html` 을 파일로 직접 열면 데이터를 못 읽습니다 → GitHub Pages 주소나 `python3 -m http.server` 로 여세요.

## 파일 목록
| 파일 | 내용 |
|---|---|
| `heroes.json` | 용사 기본 수치 |
| `skills.json` | 용사·보스 스킬 (+ 효과 수치 `fx`) |
| `monsters.json` | 미믹·보물 고블린·로봇·공장·폭탄로봇 |
| `champions.json` | 보스(챔피언) 이름·설명·특성 + `stats` |
| `items.json` | 아이템 이름·아이콘·설명 + `effect` |
| `loot.json` | 보물상자 드롭표 |
| `maps/` | 맵 파일 (형식: `maps/README.md`) |
| `ai.json` | 컴퓨터(AI) 행동 확률·기준값 |
| `art.json` | 그림 파일 경로·디자인 순서·테마 색 |
| `text/ko.json` | 화면 고정 문구(한국어) |
| `rulesets/standard.json` | **규칙 묶음** "standard"(지금 규칙): 용사 AP·이동 횟수, 상자 생성, 크리스탈, 벽 체력 등. 나중에 랭크전용 규칙 묶음을 따로 만들 자리 |

## heroes.json — 용사
| 키 | 뜻 |
|---|---|
| `n` | 이름 |
| `hp` | 최대 체력 |
| `mv` | 기본 이동 칸 수 |
| `ap` | (선택) 기본 AP — 없으면 규칙 묶음 `hero.ap`(3). 마법사 4 |
| `pas` | 패시브 설명(성직자). 실제 이월 최대치는 규칙 묶음 `hero.clericApMax` |

## skills.json — 스킬
`heroes` = 용사별 스킬 목록(**순서 = 스킬 버튼 순서, 바꾸면 안 됨**), `champions` = 보스별 `at`(공격 예고)·`ex`(설치·특수)·`gx`(발전기 스킬).
| 키 | 뜻 |
|---|---|
| `n` | 이름 |
| `c` | AP 비용 |
| `r` | 사거리 (방패돌진·성광은 나아가는 칸 수) |
| `a` | 범위(0=1칸, 1=3×3 …) |
| `t` | 용사 스킬 종류 — **바꾸지 말 것** (d 피해, h 치유, g 방패막기, l 성광, u 계시, r 돌진, b 순간이동, o 마력 방출, c 마법진 그리기, w 영창) |
| `v` | 피해/회복량 |
| `cd` | 쿨타임(턴) |
| `sm` / `d` | 짧은 설명 / 자세한 설명 |
| 보스 `id` | 설치 스킬 이름표 — **바꾸지 말 것** |
| 보스 `pk`·`sh`·`k`·`lim`·`dg`·`par`·`vr`·`esc` | 찍을 칸 수, 모양(sq 사각·cross 십자), 크기, 턴당 사용 횟수, 대각선 포함, 마비, 특수 규칙 |
| 용사 스킬 `lim`, `fx.dmgMin`·`fx.dmgMax` | 턴당 사용 횟수(정산 때 초기화), 무작위 피해 범위(있으면 `v` 대신 이 사이 값) |
| 보스 `esc` + `escEvery` | 이번 턴에 `escEvery` 번 쓸 때마다 AP +1 (없으면 1번마다) |
| 보스 `cd` | 설치 스킬 쿨타임(턴) — 넣기만 하면 적용 |
| 용사 `fx.arc` | 1 이면 부채꼴 3칸(고른 칸 + 양옆) 공격 (기사 베기) |

### `fx` — 스킬 효과 안의 숫자
| 스킬 | fx 키 |
|---|---|
| 방패막기(`t:"g"`) | `damageTaken` 받는 피해 비율(0.25 = 75% 경감), `radius` 반경 |
| 방패돌진(`t:"r"`) | `hit` 충돌 피해, `recoil` 기세로 무시한 효과 1개당 반동 피해 |
| 성광(`t:"l"`) | `dmg` 적 피해, `heal` 아군 회복 |
| 천상의 계시(`t:"u"`) | `bindBoss` 보스·발전기 속박 턴, `bindOther` 로봇 속박 턴 |
| 마력 방출(`t:"o"`) | `radius` 가까운 범위, `near` 가까운 적 피해, `far` 나머지 피해 |
| 벽 쌓기(`id:"wall"`) | `hpPerLv` 레벨당 체력, `turns` 첫 벽 유지, `turnsLater` 같은 턴 두 번째부터 유지, `stackTurns` 겹칠 때 추가 유지, `maxLv` |
| 가시 함정(`id:"trap"`) | `dmg` 피해, `max` 최대 개수 |
| 구덩이 파기(`id:"pit"`) | `fallDmg` 낙하 피해, `max` 최대 개수 |
| 컨베이어 설치(`id:"belt"`) | `maxLen` 한 줄 최대 칸 |
| 컨베이어 가동(`id:"run"`) | `move` 이동 칸, `enhancedMove` 강화 시 |
| 마법진(`t:"c"`) | `kind` 종류(meteor 화염·frost 빙결·shield 수호), `radius` 기본 반지름(1=3×3), `val` 레벨별 수치 [Lv1, Lv2, Lv3] (피해 또는 보호막) · 화염: `burn` 불바닥 피해, `burnLv` 불바닥이 생기는 레벨 · 빙결: `slow` 레벨별 이동 감소, `stunLv` 행동불능이 되는 레벨 |
| 영창(`t:"w"`) | `kind` power(위력: 수치 +`add`) / spread(확산: 반지름 +`add`) |

## monsters.json — 몬스터·소환물
| 키 | 뜻 |
|---|---|
| `mimic.hp` / `move` / `bite` | 미믹 체력 / 깨어난 뒤 이동 / 공격 피해 |
| `mimic.suppressTurns` / `suppressDmg` | 상자를 연 용사 제압 턴 / 턴마다 피해 |
| `gob.hp` / `ap` / `move` / `steal` | 고블린 체력 / AP / 이동 / 훔치기 피해 |
| `gob.goldChance` / `itemChance` | 금화 / 아이템 강탈 확률 (나머지 = 실패) |
| `gob.goldMin` / `goldMax` | 금화 강탈량 범위 |
| `trapChest.mimicChance` | 함정 상자에서 미믹이 나올 확률 |
| `robot.hp` | 레벨별 체력 목록 [Lv1, Lv2, Lv3] |
| `robot.atkBase` / `atkPerLv` | 공격 피해 = atkBase + atkPerLv × (Lv-1) |
| `robot.move` / `enhancedMove` / `chase` / `max` | 이동 / 강화 이동 / 추격 반경 / 최대 대수 |
| `robot.enhanceTurns` / `enhanceMult` | 강화 지속 턴 / 체력·이동 배수 |
| `robot.wreckCount` / `wreckLv` | 발전기 파괴 시 나오는 로봇 수 / 레벨 |
| `factory.hp` / `upgradeHp` / `maxLv` | 공장 체력 / 업그레이드당 체력 / 최대 레벨 |
| `factory.cycle` / `decay` / `max` / `enhanceHp` | 생산 주기(턴) / 매 턴 체력 감소 / 최대 개수 / 강화 시 회복 |
| `bomb.dmg` / `max` / `move` / `enhancedMove` | 폭탄 피해 / 최대 개수 / 턴당 이동 / 강화 시 |

## champions.json — 보스
`n` 이름, `s` 설명, `m` 맵 이름, `ok` 공개 여부(0 = 디자인만), `bash` 벽을 부수며 이동, `bn` 짧은 이름, `gen` 발전기 보유.
`stats`(공개된 보스만):
| 키 | 뜻 |
|---|---|
| `hp` / `ap` / `move` | 체력 / 턴당 AP / 이동 칸 |
| `apNoGen` / `moveNoGen` | 발전기 파괴 후 AP / 추가 이동 |
| `damageTakenWithGen` | 발전기 가동 중 받는 피해 비율(0.75 = 25% 감소) |
| `factoryKillAp` | 공장 파괴 시 다음 턴 AP 보상 |
| `generator.hp` / `ap` / `charge` | 발전기 체력 / AP / 발전 충전량 |

## items.json — 아이템
`n` 이름, `ic` 그림 이름표, `d` 설명, `effect`: 포션 `heal`, 스크롤 `range`(순간이동 거리), 보석 `ap`.
가방 칸은 이 목록에서 자동으로 만들어짐(순서 = 가방 표시 순서).

## loot.json — 보물상자 드롭표
- `treasureChest.gold`: `[금화 양, 가중치]` 목록. 가중치가 클수록 자주 나옴.
- `treasureChest.items`: `[아이템 ID, 확률]` 목록. 합이 1 이하, 나머지는 "아이템 없음".

## rulesets/standard.json — 규칙 묶음
| 키 | 뜻 |
|---|---|
| `hero.ap` / `clericApMax` / `movesPerTurn` | 용사 턴당 AP / 성직자 이월 최대 / 턴당 기본 이동 횟수 |
| `hero.breakDmg` / `breakRange` | 용사 "벽 부수기" 피해 / 사거리 (벨트 파괴 사거리도 같음) |
| `mapWallHp` | 맵 기본 벽 체력 |
| `status.paralyzeMove` | 마비 시 이동 감소 |
| `circle.maxLv` / `circle.breakDmg` | 마법진 최대 레벨 / 한 번에 이만큼 이상 체력 피해를 받으면 영창이 끊김 |
| `crystal.*` | 번개 크리스탈: 최대 개수, 수명, 파랑 확률, 시작 개수, 매 턴 생성 범위, 파랑 AP / 노랑 이동 효과 |
| `chest.*` | 상자: 최대 개수, 시작 생성 확률·개수, 매 턴 생성 확률, 방치 수명, 여는 거리(용사·보스), 생성 간격·용사/보스와 거리, 함정 상자 간격 |

## ai.json — 컴퓨터(AI)
판단 **순서**와 조준 방식은 코드에 있고, 여기는 **확률·기준값**만. 이름이 `chance` 로 끝나면 확률(0~1).
| 키 | 뜻 |
|---|---|
| `delayMs` | 컴퓨터가 행동하기 전 기다리는 시간(밀리초) |
| `boss.approachDist` | 가장 가까운 용사가 이보다 멀면 보스가 다가감(발전기 없는 보스) |
| `boss.attackTries` | 턴마다 공격 예고 시도 횟수 |
| `boss.gron.*` | 함정 상자·구덩이 파기·구덩이 이동·벽 쌓기·가시 함정: `chance` 확률, `minAp` 필요 AP, `minPits`/`range`/`tries`. 가시 함정 위치: `reserveAp` 공격 후 남겨 둘 AP, `escapeWeight`(예고 범위에 갇힌 용사의 탈출 길목)·`approachWeight`(다가오는 길목) 점수, `towardBossBonus` 보스 쪽 길 배수 |
| `boss.vince.*` | 공장(확률·필요 AP·업그레이드 확률/최소 공장 수·범위·시도), 폭탄, 벨트(길이 lenMin~lenMax), 자기 강화(selfCharge), 발전(generatorCharge), 강화 중 추가 공격 횟수 |
| `hero.actionsPerTurn` | 용사 한 명이 한 턴에 행동을 고르는 최대 횟수 |
| `hero.healBelow` | 아군 체력이 이 비율 미만이면 치유 |
| `hero.manaMinTargets` | 마력 방출 범위 안 적이 이 수 이상이면 사용 |
| `hero.beltBreakChance` | 근처 벨트를 부술 확률 |
| `hero.circle.chance` / `frostChance` / `shieldMinAllies` | 컴퓨터 마법사가 보스를 덮는 마법진을 그릴 확률 / 그중 빙결을 고를 확률 / 다친 아군이 이 수 이상 모이면 수호 마법진 |
| `boss.dodgeCircle.chance` | 컴퓨터 보스가 화염·빙결 마법진을 피해 움직일 확률 (마법진이 있을 때만) |
> 나중에 스토리 난이도별로 `ai.json` 을 여러 벌(쉬움·보통·어려움) 두는 자리.

## art.json — 그림·디자인
| 키 | 뜻 |
|---|---|
| `designs.order` | 🎨 디자인 버튼 순서 (`old` 기존 · `t2` 테마 2 · `t3` 테마 3 — 세 개는 코드가 쓰므로 빼면 안 됨) |
| `designs.legacy` | 예전 저장값 → 지금 디자인 변환 |
| `themes.<이름>` | 타일 색: `f` 바닥 2색, `hi` 밝은 테두리, `ln` 어두운 테두리, `sp` 장식, `w` 벽 4색, `k` 무늬 종류(코드가 씀) |
| `images.<묶음>.<이름>` | 그림 파일 경로 (`art/` 아래 .png/.jpg 만). `ART3_EXTRA` 는 `ART3` 에 덮어씀 |
> 참고: `themes.vince2` 는 원래 코드에서도 쓰이지 않음 (빈센토는 테마 2·3 에서 `vince3` 사용).

## text/ko.json — 화면 고정 문구
- `text` 안에 `"이름표": "문구"`. 이름표는 `묶음.번호`(예: `menu.7` = 메뉴의 "모드") — 묶음은 문구가 쓰이는 화면(menu 메뉴, ui 아래 패널, ipH 정보 창, cfH 확정 창, amH 행동 메뉴, qkH 빠른 버튼, vCard/gCard 챔피언 카드, html·tb 제목·버튼 줄).
- 문구만 바꾸세요. 이름표를 바꾸거나 지우면 화면에 `[이름표]` 가 뜹니다(검사 도구가 알려 줌). `<` `>`(HTML) 금지, 300자 이하.
- 앞뒤 공백도 의미가 있어요 (예: `" (이월 가능)"`).
- 숫자가 끼워지는 문장(전투 기록 "기사 -28" 등)은 아직 코드에 있음. 나중에 다국어(영어)를 넣을 때 `en.json` 을 추가하는 자리.

## 아직 코드에 남아 있는 것 (다음 단계)
- 숫자·이름을 끼워 넣는 전투 기록 문장·일부 안내 문장 (틀 `{dmg}` 방식으로 바꿔야 함)
- 입력칸 안내(placeholder "방 코드"), 게임 종료 문구(코드가 문구로 승패를 판별하므로 먼저 판별 방식을 바꿔야 함)
- 강화(전기) 지속 턴, 공장 강화 시 생산 단축 1턴, 보스 강화 등 일부 세부 규칙
