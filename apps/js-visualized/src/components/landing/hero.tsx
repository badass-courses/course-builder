import * as React from 'react'
import Image from 'next/image'
import SectionWrapper from '@/components/section-wrapper'

const Hero = () => {
	return (
		<SectionWrapper className="not-prose relative p-0 2xl:-mx-10">
			<Image
				src="/images/bg-landing-hero.png"
				alt="hero section"
				width={1360}
				height={760}
				priority
				className="hidden sm:block"
			/>
			<Image
				src="/images/bg-landing-hero-mobile.png"
				alt="hero section"
				width={716}
				height={1280}
				priority
				className="sm:hidden"
			/>
			<div className="absolute inset-0 z-10 flex flex-col items-center justify-center py-10 sm:flex-row sm:justify-start sm:pl-7 md:pl-10 lg:pl-16 xl:pl-28">
				<div className="flex max-w-[336px] flex-col items-center sm:max-w-[300px] sm:items-start md:max-w-[400px] lg:max-w-[436px] xl:max-w-[536px]">
					<h1 className="text-center text-[1.75rem] font-normal leading-[1.3] tracking-tight text-white sm:text-left sm:text-[1.6rem] md:text-[2rem] lg:text-[2.5rem] xl:text-[2.5rem]">
						Deep Comprehensive Understanding of JavaScript{' '}
						<span className="bg-gradient-green-to-blue bg-clip-text font-black text-transparent">
							Visualized
						</span>
					</h1>
					<div className="mt-7 flex items-center gap-3">
						<div className="overflow-hidden rounded-full">
							<Image
								src="/images/lydia-hallie-avatar.png"
								alt="Lydia Hallie"
								width={40}
								height={40}
							/>
						</div>
						<div className="text-sm font-medium uppercase tracking-widest">
							by Lydia Hallie
						</div>
					</div>
				</div>
			</div>
		</SectionWrapper>
	)
}

export default Hero
