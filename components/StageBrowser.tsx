"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { searchStages, type SearchRow, type Zone } from "@/lib/stage-index";
import styles from "./StageBrowser.module.css";

export type BrowserStage = { id: string; code: string; name: string; zone: string };
type Tab = Zone["kind"];

const TABS: { kind: Tab; label: string; en: string }[] = [
  { kind: "main", label: "메인 스토리", en: "MAIN" },
  { kind: "event", label: "이벤트", en: "EVENT" },
  { kind: "campaign", label: "섬멸전", en: "ANNIHILATION" },
];
const LIMIT = 60;

type Props = { zones: Zone[]; stages: BrowserStage[] };

// ?q= 를 읽는 쪽. useSearchParams는 정적 페이지에서 Suspense가 필요해서 분리 (페이지가 폴백으로 같은 UI를 그린다)
export function StageBrowserWithQuery(props: Props) {
  return <StageBrowser {...props} initialQuery={useSearchParams().get("q") ?? ""} />;
}

// 스테이지 찾기: 검색창 → 탭(메인/이벤트/섬멸전) → 챕터 레일 또는 이벤트 목록 → 카드 그리드.
// 검색어는 ?q= 로 URL에 유지. 서버 왕복 없음.
export function StageBrowser({ zones, stages, initialQuery = "" }: Props & { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const [tab, setTab] = useState<Tab>("main");
  const mains = useMemo(() => zones.filter((z) => z.kind === "main"), [zones]);
  const events = useMemo(() => zones.filter((z) => z.kind === "event"), [zones]);
  const [chapter, setChapter] = useState(mains[0]?.id ?? "");

  const byZone = useMemo(() => {
    const m = new Map<string, BrowserStage[]>();
    for (const s of stages) {
      const list = m.get(s.zone);
      if (list) list.push(s);
      else m.set(s.zone, [s]);
    }
    return m;
  }, [stages]);
  const zoneTitle = useMemo(() => new Map(zones.map((z) => [z.id, z.title])), [zones]);
  const rows = useMemo<SearchRow[]>(() => stages.map((s) => [s.id, s.code, s.name, ""]), [stages]);
  const hits = useMemo(() => searchStages(rows, q, LIMIT), [rows, q]);
  const count = (kind: Tab) => zones.filter((z) => z.kind === kind).reduce((n, z) => n + (byZone.get(z.id)?.length ?? 0), 0);

  const onSearch = (value: string) => {
    setQ(value);
    window.history.replaceState(null, "", value ? `?q=${encodeURIComponent(value)}` : location.pathname);
  };

  const searching = q.trim().length > 0;
  const current = mains.find((z) => z.id === chapter);

  return (
    <div className={styles.root}>
      <div className={styles.search}>
        <span className="label-en">SEARCH</span>
        <input
          type="search"
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="4-10, h64, 폭군 …"
          aria-label="스테이지 검색"
          autoComplete="off"
        />
        {searching && (
          <button type="button" className={styles.clear} onClick={() => onSearch("")} aria-label="검색어 지우기">
            ✕
          </button>
        )}
      </div>

      {searching ? (
        <section className={styles.body} aria-live="polite">
          <h2 className={styles.heading}>
            검색 결과 <small>{hits.length === LIMIT ? `${LIMIT}+` : hits.length}</small>
          </h2>
          {hits.length === 0 ? (
            <p className={styles.empty}>
              결과 없음. 코드(<code>4-10</code>, <code>H6-4</code>, <code>WR-EX-8</code>)나 이름으로 검색.
            </p>
          ) : (
            <div className={styles.grid}>
              {hits.map(([id, code, name]) => (
                <Card key={id} id={id} code={code} name={name} zone={zoneTitle.get(stages.find((s) => s.id === id)?.zone ?? "")} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <div className={styles.tabs} role="tablist" aria-label="스테이지 분류">
            {TABS.map((t) => (
              <button key={t.kind} type="button" role="tab" aria-selected={tab === t.kind} className={styles.tab} onClick={() => setTab(t.kind)}>
                <strong>{t.label}</strong>
                <small>
                  {t.en} · {count(t.kind)}
                </small>
              </button>
            ))}
          </div>

          {tab === "main" && (
            <>
              <div className={styles.rail} role="tablist" aria-label="에피소드">
                {mains.map((z) => (
                  <button key={z.id} type="button" role="tab" aria-selected={z.id === chapter} className={styles.chapter} onClick={() => setChapter(z.id)}>
                    <b>{chapterNo(z)}</b>
                    <span>{z.subtitle ?? z.title}</span>
                  </button>
                ))}
              </div>
              {current && (
                <section className={styles.body}>
                  <h2 className={styles.heading}>
                    {current.title}
                    {current.subtitle && <em> {current.subtitle}</em>}
                    <small>{byZone.get(current.id)?.length ?? 0}</small>
                  </h2>
                  <Grid stages={byZone.get(current.id) ?? []} />
                </section>
              )}
            </>
          )}

          {tab === "event" && (
            <section className={styles.body}>
              {events.map((z, i) => (
                <details key={z.id} name="event" open={i === 0} className={styles.event}>
                  <summary>
                    <time>{yearMonth(z.startTime)}</time>
                    <strong>{z.title}</strong>
                    <small>{byZone.get(z.id)?.length ?? 0}</small>
                  </summary>
                  <Grid stages={byZone.get(z.id) ?? []} />
                </details>
              ))}
            </section>
          )}

          {tab === "campaign" && (
            <section className={styles.body}>
              <Grid stages={byZone.get("campaign") ?? []} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Grid({ stages }: { stages: BrowserStage[] }) {
  return (
    <div className={styles.grid}>
      {stages.map((s) => (
        <Card key={s.id} id={s.id} code={s.code} name={s.name} />
      ))}
    </div>
  );
}

function Card({ id, code, name, zone }: { id: string; code: string; name: string; zone?: string }) {
  return (
    <Link href={`/stages/${id}`} className={styles.card} title={`${code} ${name}`}>
      {zone && <small>{zone}</small>}
      <b>{code}</b>
      <span>{name}</span>
    </Link>
  );
}

// "에피소드 4" → "04", "프롤로그" → "00"
function chapterNo(z: Zone): string {
  const n = z.title.match(/\d+/)?.[0];
  return n ? n.padStart(2, "0") : "00";
}

function yearMonth(t?: number): string {
  return t ? new Date(t * 1000).toISOString().slice(0, 7).replace("-", ".") : "";
}
