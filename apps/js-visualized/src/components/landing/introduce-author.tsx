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
				<SectionWrapper className="relative flex grow items-center gap-8 overflow-hidden p-10">
					<div className="absolute left-0 size-[642px] flex-shrink-0 -translate-x-1/4 rounded-full bg-[rgba(228,59,123,0.4)] opacity-30 blur-[80px]" />
					<div className="not-prose relative shrink-0">
						<Image
							src="/images/lydia-hallie-portrait.png"
							alt={`${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME} ${process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}`}
							width={232}
							height={272}
						/>
					</div>
					<div className="prose sm:prose-lg dark:prose-invert prose-p:first-of-type:mt-0 prose-p:text-foreground prose-headings:font-bold prose-headings:text-lg relative">
						{children}
					</div>
				</SectionWrapper>
				<SectionWrapper className="not-prose relative w-[308px] shrink-0 overflow-hidden">
					<div className="absolute bottom-full left-0 size-[805px] translate-y-1/2">
						<Image
							src="/images/pattern.svg"
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
