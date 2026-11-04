import type { Placement } from "@/lib/strategy";
import styles from "./DeployMarker.module.css";

const ARROW = { Left: "←", Right: "→", Up: "↑", Down: "↓" } as const;

export function DeployMarker({ placement: p, hasAvatar }: { placement: Placement; hasAvatar: boolean }) {
  return (
    <div className={styles.marker} aria-label={`${p.order}번 ${p.name}, 방향 ${p.direction}`}>
      {hasAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- 정적 소형 아이콘, 최적화 불필요
        <img className={styles.avatar} src={`/assets/avatar/${p.charId}.png`} alt={p.name} />
      ) : (
        <span className={styles.name}>{p.name}</span>
      )}
      <span className={styles.order}>{p.order}</span>
      <span className={styles.arrow} aria-hidden>
        {ARROW[p.direction]}
      </span>
    </div>
  );
}
