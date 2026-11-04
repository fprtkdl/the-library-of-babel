# 스킬 사용·종료 타이밍

## 배경

인게임에 전투 시간이 표시되지 않는다. 공략은 처치 수·코스트·특정 적 등장 같은 사건으로 타이밍을 적는다.
MAA는 `Skill` 액션에 `kills`, `costs`만 지원하고 종료 조건이 없다 (zoot.plus 1-7·1-4·2-5·3-8 공략 292개 액션에서 확인).

## 조건 목록 (사용자 확정)

사용 조건 (`use`, 필수)

| type | 값 | 표시 |
|---|---|---|
| `now` | | 즉시 사용 |
| `kills` | `n` | 처치 수 n 달성 시 |
| `cost` | `n` | 코스트 n 이상일 때 |
| `enemy_appear` | `enemy` | {enemy} 등장 시 |
| `operator_retreat` | `name` (아군) | {name} 퇴각 시 |
| `enemy_in_skill_range` | | 적이 스킬 범위 내 진입 시 |
| `enemy_in_attack_range` | | 적이 공격 사거리 내 진입 시 |
| `memo` | `text` | {text} |

종료 조건 (`end`, 선택. 없으면 "자동 종료")

| type | 값 | 표시 |
|---|---|---|
| `kills` | `n` | 처치 수 n 달성 후 종료 |
| `enemy_appear` | `enemy` | {enemy} 등장 시 종료 |
| `operator_retreat` | `name` (아군) | {name} 퇴각 시 종료 |
| `attacks` | `n` | n회 공격 후 종료 |
| `enemy_killed` | `enemy` | {enemy} 처치 후 종료 |
| `memo` | `text` | {text} |

## 데이터 형식

MAA `Skill` 액션에 사이트 전용 필드 `babel`을 더한다. MAA는 모르는 필드를 무시한다고 가정 (미검증).

```json
{ "type": "Skill", "name": "炎熔",
  "babel": { "use": { "type": "enemy_in_skill_range" }, "end": { "type": "attacks", "n": 3 } } }
```

- `babel.use`가 없으면 MAA 필드에서 만든다: `kills` → 처치 수, `costs` → 코스트, 둘 다 없으면 즉시.
- MAA로 내보낼 때 옮겨지는 건 처치 수·코스트뿐 (내보내기 기능은 범위 밖).
- 적 이름은 자유 텍스트 (적 데이터 연동은 범위 밖).

## 단계·검증

- `Step.kind`에 `"skill"` 추가. 스킬 단계는 `use`, `end?` 를 가진다.
- 스킬 대상이 필드에 없으면 `스킬 대상 없음: <이름>`.
- 조건 type이 목록에 없으면 `잘못된 조건: <type>`. `operator_retreat`의 이름이 모르는 오퍼레이터면 `알 수 없는 오퍼레이터: <이름>`.
- `SkillUsage`, `SkillDaemon` 등 나머지 액션은 계속 무시.

## 화면

- 조작 줄 위에 현재 단계 설명 한 줄: 배치 `1단계 · 芬 배치 [4, 3] →`, 철수 `7단계 · 芬 철수`, 스킬 `9단계 · 克洛丝 스킬 — 처치 수 5 달성 시 · 자동 종료`.
- 스킬 단계: 해당 마커 시안 강조 + `SKILL` 표시.

## 범위 밖

배치·철수 단계의 처치 수·코스트 조건 표시, 스킬 지속 중 상태 유지 표시, MAA 내보내기, 적 데이터 연동.
