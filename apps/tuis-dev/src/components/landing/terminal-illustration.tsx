'use client'

import { useIsMobile } from '@/hooks/use-is-mobile'

import { cn } from '@coursebuilder/ui/utils/cn'

import { AsciiGlobe } from './ascii-globe'
import SubtleAsciiAnimation from './subtle-ascii-animation'
import { SubtleMenuBrowse } from './subtle/menu-browse'
import { SubtleMenuCycle } from './subtle/menu-cycle'

export default function TerminalIllustration({
	className,
	style,
}: {
	className?: string
	style?: React.CSSProperties
}) {
	return (
		<div
			className={cn(
				'flex origin-top items-center justify-center',
				'scale-[0.6] mb-[-150px] sm:mb-0 sm:scale-100',
				className,
			)}
		>
			<div
				className={cn(
					'w-xl relative mx-auto mt-10 flex items-center justify-center',
					className,
				)}
			>
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
		</div>
	)
}
