'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	RadioGroup,
	RadioGroupItem,
} from '../index'
import { cn } from '../utils/cn'

type Tag = {
	id: string
	fields: {
		label: string | null
		name: string
	}
}

export default function AdvancedTagSelectorWithPrimary({
	availableTags,
	selectedTags: initialSelectedTags = [],
	onTagSelect,
	onTagRemove,
	primaryTagId,
	onPrimaryTagSelect,
	className,
}: {
	availableTags: Tag[]
	selectedTags: Tag[]
	primaryTagId: Tag['id'] | null
	onTagSelect?: (tag: Tag) => void
	onTagRemove?: (tagId: string) => void
	onPrimaryTagSelect?: (tagId: Tag['id']) => void
	className?: string
}) {
	const [open, setOpen] = React.useState(false)
	const [selectedTags, setSelectedTags] =
		React.useState<Tag[]>(initialSelectedTags)
	const [inputValue, setInputValue] = React.useState('')

	const handleTagSelect = (tag: Tag) => {
		const isAlreadySelected = selectedTags.some((t) => t.id === tag.id)
		if (isAlreadySelected) {
			onTagRemove?.(tag.id)
		} else {
			onTagSelect?.(tag)
		}

		setSelectedTags((prev) => {
			if (prev.some((t) => t.id === tag.id)) {
				return prev.filter((t) => t.id !== tag.id)
			} else {
				return [...prev, tag]
			}
		})
	}

	const handleTagRemove = (tagId: string) => {
		onTagRemove?.(tagId)
		setSelectedTags((prev) => prev.filter((tag) => tag.id !== tagId))
	}

	const filteredTags = availableTags.filter(
		(tag) =>
			tag.fields.label?.toLowerCase().includes(inputValue.toLowerCase()) ??
			false,
	)

	return (
		<div className={cn('mt-1 w-full max-w-md space-y-2', className)}>
			<div className="" aria-live="polite">
				<PrimaryTagSelector
					selectedTags={selectedTags}
					handleTagRemove={handleTagRemove}
					onPrimaryTagSelect={onPrimaryTagSelect}
					primaryTagId={primaryTagId}
				/>
			</div>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
					>
						{selectedTags.length > 0
							? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
							: 'Select tags...'}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0">
					<Command>
						<CommandInput
							placeholder="Search tags..."
							value={inputValue}
							onValueChange={setInputValue}
						/>
						<CommandEmpty>No tags found.</CommandEmpty>
						<CommandGroup className="max-h-64 overflow-auto">
							{filteredTags.map((tag) => (
								<CommandItem
									key={tag.id}
									onSelect={() => handleTagSelect(tag)}
									className="flex items-center justify-between"
								>
									<div>
										<span>{tag?.fields?.label}</span>
										<span className="text-muted-foreground ml-2 text-sm">
											{tag.fields.name}
										</span>
									</div>
									<Check
										className={cn(
											'h-4 w-4',
											selectedTags.some((t) => t.id === tag.id)
												? 'opacity-100'
												: 'opacity-0',
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	)
}

function PrimaryTagSelector({
	selectedTags,
	handleTagRemove,
	onPrimaryTagSelect,
	primaryTagId,
}: {
	selectedTags: Tag[]
	handleTagRemove: (tagId: Tag['id']) => void
	onPrimaryTagSelect?: (tagId: Tag['id']) => void
	primaryTagId: Tag['id'] | null
}) {
	const [selectedPrimaryTag, setSelectedPrimaryTag] = React.useState<Tag['id']>(
		primaryTagId ?? '',
	)

	React.useEffect(() => {
		setSelectedPrimaryTag(primaryTagId ?? '')
	}, [primaryTagId])

	const handleTagSelect = (tagId: Tag['id']) => {
		onPrimaryTagSelect?.(tagId)
		setSelectedPrimaryTag(tagId)
	}

	return (
		<div className="" aria-live="polite">
			<RadioGroup
				value={selectedPrimaryTag}
				onValueChange={(value) => handleTagSelect(value)}
				className="flex flex-wrap items-center"
			>
				{selectedTags.map((tag) => (
					<div
						key={tag.id}
						className="flex items-center space-x-2 rounded-md border p-2"
					>
						<RadioGroupItem value={tag.id} id={tag.id} />
						<Label
							htmlFor={tag.id}
							className="flex cursor-pointer items-center space-x-2"
						>
							<span>{tag?.fields?.label}</span>
						</Label>
						<button
							className="focus:ring-ring outline-hidden ml-1 rounded-full focus:ring-2 focus:ring-offset-2"
							onClick={() => {
								if (tag.id === selectedPrimaryTag) {
									setSelectedPrimaryTag('')
								}
								handleTagRemove(tag.id)
							}}
							aria-label={`Remove ${tag?.fields?.label} tag`}
						>
							<X className="h-3 w-3" />
						</button>
					</div>
				))}
			</RadioGroup>
		</div>
	)
}
