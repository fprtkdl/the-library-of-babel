# 시각 디자인: 게임 UI 톤 (C안 + 시안 포인트)

## 방향

명일방주 인게임 UI의 분위기(채도 낮은 흑백 대비, 밝은 종이 타일 + 어두운 바탕, 큰 한글 + 작은 영문 모노 라벨, 모서리 깎인 버튼)를 따른다.
게임 로고·공식 폰트·게임 UI 이미지는 쓰지 않는다. 분위기만 직접 구현 (공식 사이트 오인·저작권 회피).

시안: `.superpowers/brainstorm/` 의 `tone.html`(A/B/C), `tone-c-blue.html`(파랑 3종), `tone-v2-final.html`(글자색).

## 결정

| 항목 | 결정 |
|---|---|
| 기본 톤 | C. 밝은 회백 헤더 띠 + 어두운 본문·보드 |
| 포인트색 | 시안 `#2fb6e8` (v2), 주 행동에만: 주 버튼, 도착점 칸, 켜진 태그 |
| 포인트 위 글자 | 흰색 (사용자 결정, 인게임과 동일). 대비 약 2.4:1로 WCAG 4.5:1 미달임을 알고 선택 |
| 테마 | 단일 다크 테마. 라이트/다크 전환 없음 |
| 글꼴 | 본문 Noto Sans KR, 제목 Barlow Condensed, 영문 라벨·숫자 JetBrains Mono (`next/font/google`) |

## 토큰 (`app/globals.css` `:root`)

```
--paper #e9eaec   --paper-2 #f4f5f6   --ink #111111   --ink-2 #555555
--dark  #1a1c20   --dark-2  #24262b   --line #3a3d44  --line-2 #5a626e
--text  #e6e8eb   --accent  #2fb6e8   --on-accent #ffffff   --danger #d0453a
--tile-road #6c7079  --tile-wall #9aa3ad  --tile-floor #45484f  --tile-none #24262b
--tile-start var(--danger)  --tile-end var(--accent)
```

## 요소

- **헤더 띠** (`PageHeader`): 종이색 배경, 영문 모노 라벨(예: `STAGE DATA / 01-07`) + 큰 제목 + 보조 줄.
- **버튼** (`.btn`): 큰 한글(`strong`) + 작은 영문 라벨(`small`).
  - `.btn-primary`: 시안 배경, 흰 글자, 오른쪽 아래 모서리 10px 깎음.
  - `.btn-paper`: 종이색 배경, 검정 글자, 왼쪽 4px 검정 띠.
  - `.btn-ghost`: 투명, 밝은 글자, 1px 테두리.
- **태그** (`.tag`): `.tag-on` 시안 배경 흰 글자, `.tag-off` 테두리만. 태그 판정은 4단계라 지금은 스타일만.
- **배치 마커**: 아바타 1px 흰 테두리, 순번은 왼쪽 위 흰 사각 배지(검정 모노 숫자), 방향은 칸 테두리 바깥 흰 삼각형(아바타를 가리지 않음). 아바타 없을 때 이름은 9px, 넘치면 말줄임.
- **접근성**: 마커에 `role="img"` + `aria-label`.

## 범위 밖

헤더 내비게이션, 목록 페이지, 로그인 화면 (2단계 이후 구조가 바뀜). 태그 자동 판정.
