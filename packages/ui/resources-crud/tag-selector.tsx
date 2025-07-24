'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import {
	Badge,
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandSeparator,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '../index'
import { cn } from '../utils/cn'

type Tag = {
	id: string
	fields: {
		label: string
		name: string
	}
}

export default function AdvancedTagSelector({
	availableTags,
	selectedTags: initialSelectedTags = [],
	onTagSelect,
	onTagRemove,
	className,
	modal = false,
}: {
	availableTags: Tag[]
	selectedTags: Tag[]
	onTagSelect?: (tag: Tag) => void
	onTagRemove?: (tagId: string) => void
	className?: string
	modal?: boolean
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

	const filteredTags = availableTags.filter((tag) =>
		tag.fields.label.toLowerCase().includes(inputValue.toLowerCase()),
	)

	return (
		<div className={cn('mt-1 w-full space-y-2', className)}>
			<div className="flex flex-wrap gap-2" aria-live="polite">
				{selectedTags.map((tag) => (
					<Badge key={tag.id} variant="secondary" className="text-sm">
						{tag?.fields?.label}
						<button
							className="focus:ring-ring outline-hidden ml-1 rounded-full focus:ring-2 focus:ring-offset-2"
							onClick={() => handleTagRemove(tag.id)}
							aria-label={`Remove ${tag?.fields?.label} tag`}
						>
							<X className="h-3 w-3" />
						</button>
					</Badge>
				))}
			</div>
			<Popover modal={modal} open={open} onOpenChange={setOpen}>
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
