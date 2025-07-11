'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { List } from '@/lib/lists'
import { addPostToList, removePostFromList } from '@/lib/lists-query'
import type { Post } from '@/lib/posts'
import { cn } from '@/utils/cn'
import { Check, ChevronsUpDown, ExternalLinkIcon, Pencil } from 'lucide-react'

import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	FormLabel,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@coursebuilder/ui'

export function AddToList({ lists, post }: { lists: List[]; post: Post }) {
	const [isLoading, setIsLoading] = useState(false)
	const [open, setOpen] = useState(false)
	const currentLists = lists.filter((list) => {
		return list?.resources?.find((resource) => {
			return resource.resourceId === post.id
		})
	})

	const [values, setValues] = useState<string[]>(
		currentLists.map((list) => list.id),
	)
	const router = useRouter()

	const handleAddToList = async (listId: string) => {
		try {
			setIsLoading(true)
			await addPostToList({ postId: post.id, listId })
			router.refresh()
		} finally {
			setIsLoading(false)
		}
	}

	const handleSelect = (value: string) => {
		if (values.includes(value)) {
			setValues(values.filter((v) => v !== value))
			removePostFromList({ postId: post.id, listId: value })
		} else {
			setValues([...values, value])
			handleAddToList(value)
		}
		setOpen(false)
	}

	return (
		<div className="px-5">
			<div className="mb-2 flex w-full items-baseline justify-between">
				<FormLabel className="text-lg font-bold">Lists</FormLabel>
				<Button
					variant="ghost"
					size="sm"
					className="flex items-center gap-1 opacity-75 hover:opacity-100"
					asChild
				>
					<Link href="/lists">
						<Pencil className="h-3 w-3" /> Edit
					</Link>
				</Button>
			</div>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={isLoading}
						className="w-full justify-between"
					>
						<span
							className={cn('text-base font-normal', {
								'text-muted-foreground': !values.length,
							})}
						>
							{values.length
								? values
										.map(
											(value) =>
												lists.find((list) => list.id === value)?.fields.title,
										)
										.join(', ')
								: 'Add to list...'}
						</span>
						<ChevronsUpDown className="opacity-50" size={16} />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0">
					<Command>
						<CommandInput placeholder="Search lists..." />
						<CommandList>
							<CommandEmpty>No lists found.</CommandEmpty>
							<CommandGroup>
								{lists.map((list) => (
									<div key={list.id} className="relative flex items-center">
										<CommandItem
											value={list.id}
											onSelect={() => handleSelect(list.id)}
										>
											<Check
												className={cn('ml-auto mr-1 w-3', {
													'opacity-100': values.includes(list.id),
													'opacity-0': !values.includes(list.id),
												})}
											/>
											{list.fields.title}
										</CommandItem>
										<Link
											className="text-muted-foreground absolute right-3 ml-2 text-sm"
											href={`/lists/${list.fields.slug}/edit`}
										>
											<ExternalLinkIcon className="h-3 w-3" />
										</Link>
									</div>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	)
}
