import * as React from 'react'
import SectionWrapper from '@/components/section-wrapper'
import { cn } from '@/utils/cn'
import { MDXProvider, useMDXComponents } from '@mdx-js/react'

const glowCommonStyles =
	'absolute left-0 top-0 -translate-y-1/2 size-60 sm:size-96 flex-shrink-0 -translate-x-1/2 rounded-full opacity-30 blur-[80px] sm:blur-[134px]'

const QuestionOrAnswerCard: React.FC<
	React.PropsWithChildren<{ className?: string; type: 'q' | 'a' }>
> = ({ children, className, type }) => {
	const mdxComponents = useMDXComponents()
	return (
		<MDXProvider components={mdxComponents}>
			<SectionWrapper
				className={cn(
					'bg-jsv-charcoal relative flex flex-col overflow-hidden rounded-[2.5rem] px-6 pb-8 pt-5 sm:flex-row sm:items-center sm:p-10 md:p-12 xl:p-14',
					className,
				)}
			>
				<div
					className="absolute right-4 top-4 flex size-10 items-center justify-center
rounded-full border border-[#7B8992] text-2xl text-[#7B8992]"
				>
					{type === 'q' ? '?' : '!'}
				</div>
				<div
					className={cn(glowCommonStyles, {
						'bg-[var(--jsv-green)]': type === 'q',
						'bg-[var(--jsv-pink)]': type === 'a',
					})}
				/>
				<div
					className={cn(
						'self-start bg-clip-text text-[80px] font-black font-extrabold uppercase leading-none text-transparent sm:self-center md:text-[100px] lg:text-[120px]',
						{
							'bg-gradient-green-to-blue': type === 'q',
							'bg-gradient-blue-to-pink': type === 'a',
						},
					)}
				>
					{type}
				</div>
				<div className="prose-p:m-0 prose-p:text-lg mt-5 leading-snug text-white sm:ml-10 sm:mt-0 sm:max-w-[304px] md:ml-16 lg:ml-12 xl:ml-16">
					{children}
				</div>
			</SectionWrapper>
		</MDXProvider>
	)
}

export default QuestionOrAnswerCard
