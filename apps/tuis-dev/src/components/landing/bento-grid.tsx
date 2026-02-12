"use client";

import { SubtleGridLines } from "./subtle/grid-lines";
import { SubtleKeyPress } from "./subtle/key-press";
import { Reveal } from "./reveal";
import { AsciiField } from "./ascii-field";
import { SubtleHeartbeat } from "./subtle/heartbeat";
import { SubtleDataStream } from "./subtle/data-stream";
import { SubtleSignalBars } from "./subtle/signal-bars";

function Card({
  title,
  description,
  children,
  className = "",
  delay = 0,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} y={12} className={className}>
      <div className="group relative rounded-xl border border-white/10 bg-[#1E1E1E] flex flex-col justify-between gap-4 overflow-hidden h-full">
        <div className="relative z-10">
          <div className="relative z-10 bg-white/5 flex items-center h-40 justify-center overflow-hidden transition-colors duration-300 group-hover:[&_*]:!text-[#C0FFBD] [&_*]:transition [&_*]:duration-300">
            {children}
          </div>
          <h3 className="font-sans font-semibold text-base tracking-tight px-5 pt-5 pb-1">
            {title}
          </h3>
          <p className="text-sm text-white/50 leading-snug pb-5 px-5">
            {description}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

export function BentoGrid() {
  return (
    <div className="grid grid-cols-2 p-2 bg-black/20 rounded-2xl sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
      <Card
        title="The Basics"
        description="How terminals actually render, escape codes, the building blocks."
        className="sm:col-span-2"
        delay={0}
      >
        {/* <SubtleEscapeCodes /> */}
        <AsciiField opacity={100} />
      </Card>

      <Card
        title="Layout"
        description="Grids, positioning, responsive design — in monospace."
        delay={0.05}
      >
        <SubtleGridLines />
      </Card>

      <Card
        title="Interactivity"
        description="Keyboard nav, focus, mouse, inputs."
        delay={0.1}
      >
        <SubtleKeyPress interval={300} />
      </Card>

      <Card
        title="Styling"
        description="Colors, themes, borders, box-drawing chars."
        delay={0.15}
        // className="sm:col-span-2"
      >
        <SubtleHeartbeat />
        {/* <SubtleColorBlocks /> */}
      </Card>

      <Card
        title="State"
        description="Managing complexity without it falling apart."
        delay={0.2}
        // className="sm:col-span-2"
      >
        {/* <SubtleStateMachine /> */}
        <SubtleDataStream interval={100} />
      </Card>

      <Card
        title="Real Tools"
        description="Build stuff people actually use."
        className="sm:col-span-2 lg:col-span-3"
        delay={0.25}
      >
        {/* <SubtleToolOutput /> */}
        <SubtleSignalBars />
        <AsciiField opacity={100} />
      </Card>
    </div>
  );
}
