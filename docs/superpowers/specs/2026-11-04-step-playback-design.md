# 단계 재생 (B)

## 목표

공략 배치를 순번대로 한 명씩 쌓아 보여준다.

## 동작

- 첫 화면은 전체 배치(N/N). JS 없이도 완성 보드가 보인다.
- 조작 줄: `◀ 이전` · `k / N` · `다음 ▶` · `처음으로`(0단계, 빈 맵). 키보드 ← / → 도 동작.
- k단계: 순번 1..k 배치만 표시, k번은 시안 테두리로 강조. 0단계는 강조 없음.
- 범위 밖에서 버튼은 비활성 (0에서 이전, N에서 다음).

## 구조

- `lib/strategy.ts`: `placementsUpTo(placements, step)` = `order <= step` 인 배치. 순수 함수, Vitest.
- `components/BoardPlayer.tsx` (`"use client"`): 상태는 현재 단계 하나. `StageBoard`에 보일 배치와 강조 순번을 넘김.
- `StageBoard`: `highlight?: number` 추가. 아바타 목록은 서버→클라이언트 직렬화를 위해 `string[]`로 받는다.
- `DeployMarker`: `active` 시 시안 테두리.
- 버튼은 디자인 토큰(`.btn-primary`, `.btn-ghost`) 사용.

## 범위 밖

철수(Retreat) 표시 (MAA 호환 작업 때), 자동 재생, URL에 단계 저장.
