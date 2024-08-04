import * as React from 'react'
import Image from 'next/image'
import SectionWrapper from '@/components/section-wrapper'
import { cn } from '@/utils/cn'
import { MDXProvider, useMDXComponents } from '@mdx-js/react'

const IntroduceAuthor: React.FC<
	React.PropsWithChildren<{ className?: string }>
> = ({ children, className }) => {
	const mdxComponents = useMDXComponents()

	return (
		<MDXProvider components={mdxComponents}>
			<div className={cn('flex flex-col gap-4 md:flex-row', className)}>
				<SectionWrapper className="relative flex grow flex-col items-center gap-8 overflow-hidden px-4 pb-10 pt-4 sm:block sm:p-10 xl:flex xl:flex-row">
					<div className="bg-jsv-pink/40 absolute size-[310px] flex-shrink-0 -translate-y-1/2 rounded-full opacity-30 blur-[80px] sm:left-0 sm:size-[642px] sm:-translate-x-1/4 sm:-translate-y-0" />
					<div className="not-prose relative aspect-[326/250] w-full shrink-0 overflow-hidden rounded-3xl sm:float-left sm:mb-4 sm:mr-8 sm:max-w-[232px] md:max-w-[256px] lg:aspect-[232/272] lg:max-w-[232px] xl:float-none xl:mb-0 xl:mr-0 ">
						<Image
							src="/images/lydia-hallie-portrait.png"
							alt={`${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME} ${process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}`}
							width={232}
							height={272}
							className="hidden lg:block"
						/>
						<Image
							src="/images/lydia-hallie-landscape.png"
							alt={`${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME} ${process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}`}
							width={464}
							height={544}
							className="lg:hidden"
						/>
					</div>
					<div className="prose prose-lg dark:prose-invert prose-p:first-of-type:mt-0 prose-p:text-body-text prose-headings:font-bold prose-headings:mt-0 prose-headings:text-lg sm:prose-p:leading-[1.77] prose-p:leading-normal prose-p:mb-0 relative grow sm:text-balance">
						{children}
					</div>
				</SectionWrapper>
				<SectionWrapper className="not-prose relative hidden w-[308px] shrink-0 overflow-hidden lg:block">
					<div className="absolute bottom-full left-0 size-[805px] translate-y-1/2 opacity-40">
						<Image
							src="/images/shape-decor.svg"
							alt="pattern"
							width={805}
							height={805}
						/>
					</div>
				</SectionWrapper>
			</div>
		</MDXProvider>
	)
}

export default IntroduceAuthor
