"use client";

import { useEffect, useRef } from "react";

export function FpsCounter() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      frames++;
      const delta = now - lastTime;
      if (delta >= 500) {
        const fps = Math.round((frames * 1000) / delta);
        if (ref.current) ref.current.textContent = `${fps} fps`;
        frames = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed bottom-3 right-3 font-mono text-[10px] text-white/30 select-none pointer-events-none z-50"
    />
  );
}
