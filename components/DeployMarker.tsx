import type { Placement } from "@/lib/strategy";
import styles from "./DeployMarker.module.css";

const DIRECTION_KO = { Left: "왼쪽", Right: "오른쪽", Up: "위", Down: "아래" } as const;

export function DeployMarker({ placement: p, hasAvatar }: { placement: Placement; hasAvatar: boolean }) {
  return (
    <div className={styles.marker} role="img" aria-label={`${p.order}번 ${p.name}, ${DIRECTION_KO[p.direction]} 방향`}>
      {hasAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- 정적 소형 아이콘, 최적화 불필요
        <img className={styles.avatar} src={`/assets/avatar/${p.charId}.png`} alt="" />
      ) : (
        <span className={styles.name}>{p.name}</span>
      )}
      <span className={styles.order} aria-hidden>
        {p.order}
      </span>
      <span className={`${styles.dir} ${styles[p.direction]}`} aria-hidden />
    </div>
  );
}
