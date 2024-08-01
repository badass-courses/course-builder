import * as React from 'react'
import SectionWrapper from '@/components/section-wrapper'
import { cn } from '@/utils/cn'
import { MDXProvider, useMDXComponents } from '@mdx-js/react'

const glowCommonStyles =
	'absolute left-0 size-96 flex-shrink-0 -translate-x-1/2 rounded-full opacity-30 blur-[134px]'

const QuestionOrAnswerCard: React.FC<
	React.PropsWithChildren<{ className?: string; type: 'q' | 'a' }>
> = ({ children, className, type }) => {
	const mdxComponents = useMDXComponents()
	return (
		<MDXProvider components={mdxComponents}>
			<SectionWrapper className="relative flex items-center overflow-hidden p-14">
				<div
					className={cn(glowCommonStyles, {
						'bg-[#43E68B]': type === 'q',
						'bg-[#E43B7B]': type === 'a',
					})}
				/>
				<div
					className={cn(
						'bg-gradient-green-to-blue bg-clip-text text-[120px] font-black font-extrabold uppercase leading-none text-transparent',
						{
							'bg-gradient-green-to-blue': type === 'q',
							'bg-gradient-purple-to-pink': type === 'a',
						},
					)}
				>
					{type}
				</div>
				<div className="pl-16">{children}</div>
			</SectionWrapper>
		</MDXProvider>
	)
}

export default QuestionOrAnswerCard
