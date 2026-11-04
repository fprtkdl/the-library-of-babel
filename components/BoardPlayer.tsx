"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StageBoard as Board } from "@/lib/board";
import { frameAt, type Member, type Step } from "@/lib/strategy";
import { StageBoard } from "./StageBoard";
import { WaitingBench } from "./WaitingBench";
import styles from "./BoardPlayer.module.css";

export function BoardPlayer({
  board,
  steps,
  squad,
  avatars,
}: {
  board: Board;
  steps: Step[];
  squad: Member[];
  avatars: string[];
}) {
  const total = steps.length;
  const [step, setStep] = useState(total); // 첫 화면은 완성 보드
  const avatarSet = useMemo(() => new Set(avatars), [avatars]);
  // 함수형 업데이트: 연타해도 렌더 전 옛 step을 읽지 않음
  const move = useCallback((delta: number) => setStep((s) => Math.min(total, Math.max(0, s + delta))), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  const { field, waiting, current } = frameAt(steps, squad, step);
  const retreat = current?.kind === "retreat" ? current.placement : undefined;

  return (
    <div>
      <StageBoard
        board={board}
        placements={field}
        avatars={avatarSet}
        highlight={current?.kind === "deploy" ? current.placement.order : undefined}
        vacated={retreat}
      />
      <WaitingBench waiting={waiting} avatars={avatarSet} highlight={retreat?.name} />
      <div className={styles.controls}>
        <button type="button" className="btn btn-ghost" onClick={() => move(-1)} disabled={step === 0}>
          <strong>◀ 이전</strong>
          <small>PREV</small>
        </button>
        <span className={styles.count} aria-live="polite">
          {step} / {total}
        </span>
        <button type="button" className="btn btn-primary" onClick={() => move(1)} disabled={step === total}>
          <strong>다음 ▶</strong>
          <small>NEXT</small>
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setStep(0)} disabled={step === 0}>
          <strong>처음으로</strong>
          <small>RESET</small>
        </button>
      </div>
    </div>
  );
}
