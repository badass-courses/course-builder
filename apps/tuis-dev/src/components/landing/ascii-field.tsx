"use client";

import { useEffect, useRef, useState } from "react";

// Fills the container with a slow-drifting interference pattern
// Very low contrast — mostly spaces with faint dots/dashes

const COLS = 100;
const ROWS = 24;
const TOTAL_FRAMES = 60;

// Only use the faintest chars — keep it whisper-quiet
const FIELD_CHARS = " .·:";

// Tailwind classes for each intensity level (must appear literally for scanner)
const fClass = ["", "text-white/15", "text-white/25", "text-white/40"];

function generateFrame(f: number): string {
  const t = (f / TOTAL_FRAMES) * Math.PI * 2;
  const lines: string[] = [];

  for (let row = 0; row < ROWS; row++) {
    const parts: string[] = [];
    for (let col = 0; col < COLS; col++) {
      const x = col / COLS;
      const y = row / ROWS;

      const v1 = Math.sin(x * 18 + t) * Math.sin(y * 12 + t * 3);
      const v2 = Math.sin((x + y) * 14 - t * 2) * 0.6;
      const v3 = Math.sin(x * 8 - y * 10 + t * 2) * 0.3;
      const v4 =
        Math.sin(Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2) * 25 - t) *
        0.4;

      let v = (v1 + v2 + v3 + v4) * 0.25;

      const dx = (col - COLS / 2) / (COLS / 2);
      const dy = (row - ROWS / 2) / (ROWS / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const fade = Math.max(0, 1 - dist * 0.6);

      v *= fade;

      const intensity = Math.max(0, (v + 0.3) * 0.7);
      const ci = Math.floor(intensity * (FIELD_CHARS.length - 1));

      if (ci <= 0) {
        parts.push(" ");
      } else {
        parts.push(`<span class="${fClass[ci]}">${FIELD_CHARS[ci]}</span>`);
      }
    }
    lines.push(parts.join(""));
  }
  return lines.join("\n");
}

export function AsciiField({ opacity = 50, className = "" }: { opacity?: number; className?: string }) {
  const preRef = useRef<HTMLPreElement>(null);
  const framesRef = useRef<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frames = framesRef.current;
    let nextFrame = 0;
    let cancelled = false;

    function generateChunk() {
      if (cancelled) return;
      const deadline = performance.now() + 8;
      while (nextFrame < TOTAL_FRAMES && performance.now() < deadline) {
        frames[nextFrame] = generateFrame(nextFrame);
        nextFrame++;
      }
      if (nextFrame < TOTAL_FRAMES) {
        setTimeout(generateChunk, 0);
      } else {
        setReady(true);
      }
    }

    generateChunk();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const frames = framesRef.current;
    if (frames.length === 0) return;

    let frameIdx = 0;
    let lastTime = 0;
    const interval = 1000 / 12;
    let rafId: number;

    function tick(time: number) {
      if (time - lastTime >= interval) {
        lastTime = time;
        const max = ready ? TOTAL_FRAMES : Math.max(1, frames.length);
        if (preRef.current && frames[frameIdx % max]) {
          preRef.current.innerHTML = frames[frameIdx % max]!;
        }
        frameIdx = (frameIdx + 1) % max;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [ready]);

  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden ${className}`} style={{ opacity: opacity / 100 }}>
      <pre
        ref={preRef}
        className="font-mono text-[11px] leading-[1.15] tracking-[0.05em] m-0 p-0 whitespace-pre select-none"
      />
    </div>
  );
}
