import type { StageBoard as Board } from "@/lib/board";
import type { Placement } from "@/lib/strategy";
import { DeployMarker } from "./DeployMarker";
import styles from "./StageBoard.module.css";

export function StageBoard({ board, placements, avatars }: { board: Board; placements: Placement[]; avatars: Set<string> }) {
  return (
    <div className={styles.board} style={{ gridTemplateColumns: `repeat(${board.width}, var(--cell))` }}>
      {board.tiles.flatMap((row, y) =>
        row.map((tile, x) => {
          // shortcut: 한 칸에 배치 하나만 표시(첫 번째), 철수 후 재배치는 단계 재생(B)에서 처리
          const p = placements.find((q) => q.x === x && q.y === y);
          const cls = [styles.tile, styles[tile.key], tile.height === "HIGHLAND" && styles.high].filter(Boolean).join(" ");
          return (
            <div key={`${x},${y}`} className={cls} title={`${tile.key} [${x}, ${y}]`}>
              {p && <DeployMarker placement={p} hasAvatar={avatars.has(p.charId)} />}
            </div>
          );
        }),
      )}
    </div>
  );
}
