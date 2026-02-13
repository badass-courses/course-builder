'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useIsMobile } from '@/hooks/use-is-mobile'

import { AsciiField } from './ascii-field'
import { AsciiGlobe } from './ascii-globe'
import { AsciiHeart } from './ascii-heart'
// import { AsciiLife } from './ascii-life'
// import { AsciiTopo } from './ascii-topo'
import { BentoGrid } from './bento-grid'
import { CursorConstellation } from './effects/cursor-constellation'
import { FpsCounter } from './fps-counter'
import { Reveal } from './reveal'
import { SubscribeForm } from './subscribe-form'
import SubtleAsciiAnimation from './subtle-ascii-animation'
import { SubtleMenuBrowse } from './subtle/menu-browse'
import { SubtleMenuCycle } from './subtle/menu-cycle'

export function HomePage() {
	const isMobile = useIsMobile({ breakpoint: 640 })
	return (
		<div className="min-h-screen w-full pt-16 text-white sm:pt-32">
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

			<div
				style={
					isMobile
						? {
								transform: 'scale(0.6)',
								transformOrigin: 'top center',
								marginBottom: '-150px',
							}
						: undefined
				}
				className="flex items-center justify-center"
			>
				<Reveal y={24} duration={0.6} delay={0.15}>
					<div className="w-xl relative mx-auto mt-10 flex items-center justify-center">
						<div className="absolute inset-0 -mx-5 my-8 rounded-lg border border-black/30 bg-black/20" />
						<div
							style={{
								borderRadius: '15px',
								border: '3px solid #151515',
								background: '#1E1E1E',
								boxShadow: '0 5px 3px 0 rgba(255, 255, 255, 0.08) inset',
							}}
							className="relative z-10 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-white/5 font-mono"
						>
							{/* <AsciiField /> */}
							<div className="absolute inset-0 grid grid-cols-2 items-center justify-center">
								<div className="absolute left-2 top-2 flex items-center gap-1">
									<div className="h-2 w-2 rounded-full bg-white/10" />
									<div className="h-2 w-2 rounded-full bg-white/10" />
									<div className="h-2 w-2 rounded-full bg-white/10" />
								</div>
								<AsciiGlobe />
								<div className="h-full w-full p-7">
									<div className="relative flex h-full w-full flex-col items-start justify-between rounded-md border border-white/10 p-3 text-xs">
										<div className="grid w-full grid-cols-2 gap-3">
											<div className="relative col-span-2 flex h-10 w-full items-center rounded-sm border border-white/10 p-3 before:absolute before:-top-1 before:left-3 before:flex before:h-2 before:items-center before:justify-center before:bg-[#1E1E1E] before:px-1 before:text-[10px] before:uppercase before:text-white/60 before:content-['〔_0002-adr-tui.md_〕']">
												<SubtleAsciiAnimation />
											</div>
											<div className="relative col-start-2 flex h-10 w-full items-center rounded-sm border border-white/10 before:absolute before:-top-1 before:left-3 before:flex before:h-2 before:items-center before:justify-center before:bg-[#1E1E1E] before:px-1 before:text-[10px] before:uppercase before:text-white/60 before:content-['〔_docs_〕']">
												<div className="relative overflow-hidden p-3">
													{/* <SubtleSpinnerDots /> */}
													<SubtleMenuCycle />
												</div>
											</div>
											<div className="relative col-span-2 flex h-24 w-full items-center overflow-hidden rounded-sm border border-white/10">
												{/* browsing through tui menu, highlighting active item in the center */}
												<SubtleMenuBrowse />
											</div>
										</div>
										<div className="flex w-full items-center">
											<span className="mr-2">❯</span>
											<span className="animate-blink h-3 w-1 bg-white/50"></span>
											<span className="-ml-1 h-3 w-full bg-white/5"></span>
										</div>
									</div>
								</div>
							</div>
							<div className="absolute bottom-4 left-5 flex items-center gap-1 text-[#C0FFBD]">
								{'//'}
								{/* <SubtlePulseLine /> */}
							</div>
						</div>
					</div>
				</Reveal>
			</div>

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
					<div>
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
					</div>
				</div>
			</section>
		</div>
	)
}
