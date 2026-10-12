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
| `rulesets/standard.json` | **규칙 묶음** "standard"(지금 규칙): 용사 AP·이동 횟수, 상자 생성, 크리스탈, 벽 체력 등. 나중에 랭크전용 규칙 묶음을 따로 만들 자리 |

## heroes.json — 용사
| 키 | 뜻 |
|---|---|
| `n` | 이름 |
| `hp` | 최대 체력 |
| `mv` | 기본 이동 칸 수 |
| `pas` | 패시브 설명(성직자). 실제 이월 최대치는 규칙 묶음 `hero.clericApMax` |

## skills.json — 스킬
`heroes` = 용사별 스킬 목록(**순서 = 스킬 버튼 순서, 바꾸면 안 됨**), `champions` = 보스별 `at`(공격 예고)·`ex`(설치·특수)·`gx`(발전기 스킬).
| 키 | 뜻 |
|---|---|
| `n` | 이름 |
| `c` | AP 비용 |
| `r` | 사거리 (방패돌진·성광은 나아가는 칸 수) |
| `a` | 범위(0=1칸, 1=3×3 …) |
| `t` | 용사 스킬 종류 — **바꾸지 말 것** (d 피해, h 치유, g 방패막기, l 성광, u 계시, r 돌진, b 순간이동, o 마력 방출) |
| `v` | 피해/회복량 |
| `cd` | 쿨타임(턴) |
| `sm` / `d` | 짧은 설명 / 자세한 설명 |
| 보스 `id` | 설치 스킬 이름표 — **바꾸지 말 것** |
| 보스 `pk`·`sh`·`k`·`lim`·`dg`·`par`·`vr`·`esc` | 찍을 칸 수, 모양(sq 사각·cross 십자), 크기, 턴당 사용 횟수, 대각선 포함, 마비, 특수 규칙 |

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
| `crystal.*` | 번개 크리스탈: 최대 개수, 수명, 파랑 확률, 시작 개수, 매 턴 생성 범위, 파랑 AP / 노랑 이동 효과 |
| `chest.*` | 상자: 최대 개수, 시작 생성 확률·개수, 매 턴 생성 확률, 방치 수명, 여는 거리(용사·보스), 생성 간격·용사/보스와 거리, 함정 상자 간격 |

## 아직 코드에 남아 있는 것 (다음 단계)
- AI 행동 확률·기준값 → PR C (`ai.json`)
- 그림 경로·디자인 목록·테마 색 → PR C (`art.json`)
- 메뉴·버튼 고정 문구 → PR D (`text/ko.json`)
- 강화(전기) 지속 턴, 공장 강화 시 생산 단축 1턴, 보스 강화 등 일부 세부 규칙
