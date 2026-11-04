import type { StageBoard as Board } from "@/lib/board";
import type { Placement } from "@/lib/strategy";
import { DeployMarker } from "./DeployMarker";
import styles from "./StageBoard.module.css";

export function StageBoard({
  board,
  placements,
  avatars,
  highlight,
  skill = false,
  vacated,
}: {
  board: Board;
  placements: Placement[];
  avatars: ReadonlySet<string>;
  highlight?: number;
  skill?: boolean; // 강조된 배치가 스킬 사용 중
  vacated?: { x: number; y: number }; // 방금 철수한 칸
}) {
  return (
    <div className={styles.board} style={{ gridTemplateColumns: `repeat(${board.width}, var(--cell))` }}>
      {board.tiles.flatMap((row, y) =>
        row.map((tile, x) => {
          const p = placements.find((q) => q.x === x && q.y === y);
          const cls = [styles.tile, styles[tile.key], tile.height === "HIGHLAND" && styles.high].filter(Boolean).join(" ");
          return (
            <div key={`${x},${y}`} className={cls} title={`${tile.key} [${x}, ${y}]`}>
              {p && <DeployMarker placement={p} hasAvatar={avatars.has(p.charId)} active={p.order === highlight} skill={skill && p.order === highlight} />}
              {!p && vacated?.x === x && vacated?.y === y && <span className={styles.vacated}>철수</span>}
            </div>
          );
        }),
      )}
    </div>
  );
}
