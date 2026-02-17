'use client'

import Image from 'next/image'
import { useIsMobile } from '@/hooks/use-is-mobile'

import { AsciiField } from './ascii-field'
import { AsciiHeart } from './ascii-heart'
import { BentoGrid } from './bento-grid'
import { CursorConstellation } from './effects/cursor-constellation'
import { FpsCounter } from './fps-counter'
import { Reveal } from './reveal'
import { SubscribeForm } from './subscribe-form'
import TerminalIllustration from './terminal-illustration'

export function HomePage() {
	const isMobile = useIsMobile({ breakpoint: 640 })
	return (
		<div className="min-h-screen w-full pt-16 text-white sm:pt-24">
			{/* <FpsCounter /> */}
			<div
				className={`container relative z-10 mx-auto flex flex-col items-center justify-center p-8 text-center`}
			>
				<Reveal>
					<h1 className="max-w-sm font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
						Build Beautiful <span className="text-[#C0FFBD]">Terminal</span> UIs
						{/* <div className="animate-blink w-2 h-9 ml-1 bg-white/50 inline-block" /> */}
					</h1>
				</Reveal>
				<Reveal delay={0.1}>
					<h2 className="mt-5 max-w-xl text-lg leading-tight opacity-75 sm:text-xl">
						The terminal is back. Learn how to craft stunning, interactive
						command-line interfaces that developers actually love using.
					</h2>
				</Reveal>
				<Reveal delay={0.2}>
					<div className="mt-8 flex items-center gap-2 text-lg">
						<Image
							priority
							src="/ashley.png"
							alt="Ashley"
							width={48}
							height={48}
							quality={100}
							loading="eager"
							sizes="48px"
							className="size-12 rounded-xl bg-white/10 object-cover outline-2 outline-black/20"
						/>
						<span>Ashley Hindle</span>
					</div>
				</Reveal>
				<AsciiField opacity={80} />
				{/* <AsciiTopo /> */}
				{/* <AsciiLife /> */}
			</div>
			<Reveal y={24} duration={0.6} delay={0.15}>
				<TerminalIllustration />
			</Reveal>
			{/* <TuiWireframe /> */}
			<div className="mx-auto grid w-full max-w-4xl flex-col items-center gap-5 px-5 pb-16 pt-24 text-center sm:grid-cols-2 sm:items-start sm:pt-40 sm:text-left">
				<Reveal>
					<h2 className="max-w-lg text-3xl font-semibold tracking-tight sm:mb-5 sm:text-4xl">
						What you'll learn
					</h2>
				</Reveal>
				<Reveal delay={0.1}>
					<h2 className="text-base font-normal tracking-tight opacity-75 sm:text-lg">
						A hands-on course on building modern TUIs — from layout and styling
						to interactivity and state management. Ship CLI tools that feel like
						real apps.
					</h2>
				</Reveal>
			</div>
			<Reveal y={20} duration={0.6}>
				<div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-5">
					<BentoGrid />
				</div>
			</Reveal>
			<div className="relative mx-auto mt-16 flex w-full max-w-xl flex-col px-5 sm:mt-24">
				<div className="relative flex flex-col items-center justify-center gap-3 py-10 text-center">
					<AsciiField />

					<Reveal>
						<AsciiHeart />
					</Reveal>
					<Reveal>
						<h2 className="max-w-sm text-balance text-4xl font-semibold tracking-tight">
							Join the Terminal UI Revolution
						</h2>
					</Reveal>
					<Reveal delay={0.1}>
						<h3 className="text-balance text-lg font-normal tracking-tight opacity-75">
							Get the latest news and updates delivered straight to your inbox.
						</h3>
					</Reveal>
				</div>
				<Reveal delay={0.15}>
					<SubscribeForm />
				</Reveal>
				<Reveal delay={0.2} className="mx-auto pt-5">
					<small className="mt-4 text-center font-mono text-xs opacity-50">
						No spam. Unsubscribe anytime.
					</small>
				</Reveal>
				<div className="relative w-full pb-32 pt-10">
					<CursorConstellation />
				</div>
			</div>
			<section className="container mx-auto max-w-4xl pb-32 pt-10 sm:pb-48">
				<div className="flex flex-col justify-center gap-8 sm:items-center sm:justify-start md:flex-row">
					<Reveal className="shrink-0">
						<Image
							src="/ashley.png"
							alt="Ashley"
							width={200}
							height={200}
							className="w-32 shrink-0 rounded-sm bg-gradient-to-t from-white/10 to-transparent object-cover sm:w-auto"
							sizes="200px"
							quality={100}
							loading="eager"
						/>
					</Reveal>
					<Reveal delay={0.1}>
						<div className="mb-4 text-balance text-2xl font-semibold leading-tight tracking-tight">
							Howdy, I'm Ashley. I build terminal apps for a living.
						</div>
						<div className="flex flex-col gap-3 opacity-75">
							<p>
								I created Whisp, a pure PHP SSH server for building terminal
								UIs. I lead AI at Laravel, where I built Boost and Croft. Over
								15 years of shipping production systems, former CTO, and I live
								in the terminal.
							</p>
							<p>
								This course is everything I wish existed when I started building
								TUIs — the mental models, the escape codes, the layouts, and the
								real patterns that make terminal apps feel good.
							</p>
						</div>
					</Reveal>
				</div>
			</section>
		</div>
	)
}
