"use client";

import { useEffect, useRef } from "react";
import { setIntervalOnVisible } from "@/utils/set-timeout-on-visible";

const COLS = 30;
const FRAMES = 60;
const bars = " ▁▂▃▄▅▆▇█";
const G = `<span class="text-[#C0FFBD]/50">`;
const TAU = Math.PI * 2;

const precomputed: string[] = (() => {
  const out: string[] = [];

  for (let f = 0; f < FRAMES; f++) {
    const t = (f / FRAMES) * TAU;
    let html = "";

    for (let c = 0; c < COLS; c++) {
      const val =
        Math.sin(c * 0.3 + t * 2) * 0.35 +
        Math.sin(c * 0.7 - t * 3) * 0.25 +
        Math.sin(c * 0.15 + t) * 0.25 +
        Math.sin(c * 0.5 + t * 5) * 0.15;

      const idx = Math.floor(((val + 1) / 2) * (bars.length - 0.01));
      const ch = bars[idx]!;

      if (idx >= 7) {
        html += `${G}${ch}</span>`;
      } else {
        html += ch;
      }
    }

    out.push(html);
  }
  return out;
})();

export function SubtleSignalBars({
  className = "",
}: {
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    const animate = () => {
      if (ref.current) {
        ref.current.innerHTML = precomputed[i]!;
        i = (i + 1) % precomputed.length;
      }
    };
    animate();
    const cleanup = setIntervalOnVisible({
      element: ref.current,
      callback: animate,
      interval: 80,
    });
    return () => { cleanup?.(); };
  }, []);

  return (
    <div
      ref={ref}
      className={`font-mono text-white/20 whitespace-pre select-none ${className}`}
      style={{ fontSize: "10px", lineHeight: "1", letterSpacing: "0.05em" }}
    />
  );
}
