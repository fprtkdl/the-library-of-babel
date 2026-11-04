import type { Waiting } from "@/lib/strategy";
import styles from "./WaitingBench.module.css";

export function WaitingBench({ waiting, avatars, highlight }: { waiting: Waiting[]; avatars: ReadonlySet<string>; highlight?: string }) {
  return (
    <section className={styles.bench} aria-label="대기열">
      <div className="label-en">STANDBY · {waiting.length}</div>
      <ul className={styles.list}>
        {waiting.map((w) => (
          <li
            key={w.name}
            className={[styles.item, w.state === "재배치 대기" && styles.redeploy, w.name === highlight && styles.active]
              .filter(Boolean)
              .join(" ")}
          >
            {avatars.has(w.charId) ? (
              // eslint-disable-next-line @next/next/no-img-element -- 정적 소형 아이콘, 최적화 불필요
              <img className={styles.avatar} src={`/assets/avatar/${w.charId}.png`} alt="" />
            ) : (
              <span className={styles.avatar} />
            )}
            <span className={styles.name}>{w.name}</span>
            <span className={styles.state}>{w.state === "재배치 대기" ? "↺ 재배치 대기" : "대기"}</span>
          </li>
        ))}
        {waiting.length === 0 && <li className={styles.empty}>전원 배치됨</li>}
      </ul>
    </section>
  );
}
