"use client";

import { useEffect, useRef } from "react";
import { setIntervalOnVisible } from "@/utils/set-timeout-on-visible";

const ROWS = 7;
const COLS = 10;
const TOTAL_FRAMES = 60;

// Cell states: 0 = empty (·), 1 = cursor (█), 2 = visited/selected (▪)
// Visited cells decay back to empty over a few frames
const CHAR_EMPTY = "· ";
const CHAR_CURSOR = `<span class="text-[#C0FFBD]">▪ </span>`;
const CHAR_VISITED = "▪ ";

// Cursor path: snaking, jumping, selecting clusters
// [row, col] positions for each frame
const cursorPath: [number, number][] = [
  // start top-left, snake right across row 0
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  // drop down and snake left across row 1
  [1, 4],
  [1, 3],
  [1, 2],
  [1, 1],
  // jump down to cluster in center
  [3, 3],
  [3, 4],
  [3, 5],
  [4, 5],
  [4, 4],
  [4, 3],
  // jump to bottom-right corner
  [6, 9],
  [6, 8],
  [5, 8],
  [5, 9],
  // jump up to top-right
  [0, 8],
  [0, 9],
  [1, 9],
  [1, 8],
  // diagonal descent toward center-left
  [2, 7],
  [3, 6],
  [4, 6],
  [5, 5],
  // jump to bottom-left cluster
  [5, 0],
  [5, 1],
  [6, 1],
  [6, 0],
  // snake up left column
  [4, 0],
  [3, 0],
  [2, 0],
  [1, 0],
  // return home
  [0, 0],
];

// How many frames a visited cell persists before fading
const VISIT_DECAY = 5;

function buildFrames(): string[] {
  // Track when each cell was last visited (frame index, -Infinity = never)
  const lastVisited: number[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(-Infinity),
  );

  const frames: string[] = [];

  for (let f = 0; f < cursorPath.length; f++) {
    const [cursorR, cursorC] = cursorPath[f]!;

    // Mark current cursor position as visited
    lastVisited[cursorR]![cursorC] = f;

    // Build grid for this frame (HTML)
    const lines: string[] = [];
    for (let r = 0; r < ROWS; r++) {
      let line = "";
      for (let c = 0; c < COLS; c++) {
        if (r === cursorR && c === cursorC) {
          line += CHAR_CURSOR;
        } else if (f - lastVisited[r]![c]! <= VISIT_DECAY) {
          line += CHAR_VISITED;
        } else {
          line += CHAR_EMPTY;
        }
      }
      lines.push(line);
    }
    frames.push(lines.join("\n"));
  }

  return frames;
}

const precomputedFrames = buildFrames();

export function SubtleKeyPress({
  className = "",
  interval = 180,
}: {
  className?: string;
  interval?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    const animate = () => {
      if (ref.current) {
        ref.current.innerHTML = precomputedFrames[i]!;
        i = (i + 1) % precomputedFrames.length;
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
      style={{ fontSize: "11px", lineHeight: "1.5" }}
    />
  );
}
