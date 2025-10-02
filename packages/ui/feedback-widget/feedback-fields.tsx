import * as React from 'react'
import { Control, useController } from 'react-hook-form'

import { Label, RadioGroup, RadioGroupItem } from '../index'
import { FeedbackFormValues } from './feedback-schema'
import { getEmoji } from './get-emoji'

export const EmotionField = ({
	control,
}: {
	control: Control<FeedbackFormValues>
}) => {
	const { field } = useController({
		name: 'context.emotion',
		control,
	})

	const emotions = [':heart_eyes:', ':wave:', ':sob:']

	return (
		<div>
			<label className="inline-flex pb-1 font-semibold">Emotion</label>
			<RadioGroup
				onValueChange={field.onChange}
				value={field.value}
				className="flex items-center gap-0 divide-x rounded border text-lg"
			>
				{emotions.map((emotion) => (
					<div
						key={emotion}
						className="data-[state='checked']:*:bg-border hover:bg-accent hover:data-[state='unchecked']:*:bg-border/50 relative h-10 w-10 first-of-type:rounded-l-md last-of-type:rounded-r-md data-[state='checked']:*:shadow-inner [&_svg]:absolute [&_svg]:left-1 [&_svg]:top-0 [&_svg]:w-1"
					>
						<RadioGroupItem
							value={emotion}
							id={emotion}
							className="h-10 w-10 rounded-none border-none p-0"
						/>
						<Label
							htmlFor={emotion}
							className="absolute inset-0 flex h-full w-full items-center justify-center"
						>
							<span
								role="img"
								className="text-xl"
								aria-label={getEmoji(emotion).label}
							>
								{getEmoji(emotion).image}
							</span>
						</Label>
					</div>
				))}
			</RadioGroup>
		</div>
	)
}

export const CategoryField = ({
	control,
}: {
	control: Control<FeedbackFormValues>
}) => {
	const { field } = useController({
		name: 'context.category',
		control,
	})

	const categories = ['general', 'help', 'code']

	return (
		<div>
			<label className="inline-flex pb-1 font-semibold">Category</label>
			<RadioGroup
				onValueChange={field.onChange}
				value={field.value}
				className="flex items-center gap-0 divide-x rounded border text-lg"
			>
				{categories.map((category) => (
					<div
						className="data-[state='checked']:*:bg-border hover:bg-accent hover:data-[state='unchecked']:*:bg-border/50 relative h-10 first-of-type:rounded-l-md last-of-type:rounded-r-md data-[state='checked']:*:shadow-inner [&_svg]:absolute [&_svg]:left-1 [&_svg]:top-0 [&_svg]:w-1"
						key={category}
					>
						<RadioGroupItem
							value={category}
							id={category}
							className="h-10 rounded-none border-none px-10"
						/>
						<Label
							className="absolute inset-0 flex h-full w-full items-center justify-center"
							htmlFor={category}
						>
							{category}
						</Label>
					</div>
				))}
			</RadioGroup>
		</div>
	)
}
