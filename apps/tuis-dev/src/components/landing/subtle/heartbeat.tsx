"use client";

import { useEffect, useRef } from "react";
import { setIntervalOnVisible } from "@/utils/set-timeout-on-visible";

const ROWS = 3;
const COLS = 24;
const FRAMES = 24;
const FREQ = 0.5;

const precomputed: string[] = (() => {
  const frames: string[] = [];
  for (let f = 0; f < FRAMES; f++) {
    const phase = (f / FRAMES) * Math.PI * 2;
    const grid: string[][] = Array.from({ length: ROWS }, () =>
      new Array(COLS).fill(" "),
    );

    for (let c = 0; c < COLS; c++) {
      const val = Math.sin(c * FREQ + phase);
      const row = Math.round(((1 - val) / 2) * (ROWS - 1));

      const nextVal = Math.sin((c + 1) * FREQ + phase);
      const nextRow = Math.round(((1 - nextVal) / 2) * (ROWS - 1));

      if (nextRow < row) {
        grid[row]![c] = "╱";
      } else if (nextRow > row) {
        grid[row]![c] = "╲";
      } else {
        grid[row]![c] = "─";
      }
    }

    frames.push(grid.map((row) => row.join("")).join("\n"));
  }
  return frames;
})();

export function SubtleHeartbeat({
  className = "",
  interval = 120,
}: {
  interval?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    const animate = () => {
      if (ref.current) {
        ref.current.textContent = precomputed[i]!;
        i = (i + 1) % precomputed.length;
      }
    };
    animate();
    const cleanup = setIntervalOnVisible({
      element: ref.current,
      callback: animate,
      interval,
    });
    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`font-mono text-white/20 whitespace-pre select-none ${className}`}
      style={{ fontSize: "10px", lineHeight: "1", letterSpacing: "0.05em" }}
    />
  );
}
