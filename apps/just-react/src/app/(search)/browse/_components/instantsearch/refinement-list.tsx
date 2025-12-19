'use client'

import * as React from 'react'
import { cn } from '@/utils/cn'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useQueryState } from 'nuqs'
import {
	useClearRefinements,
	useRefinementList,
	UseRefinementListProps,
} from 'react-instantsearch'

import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@coursebuilder/ui'

export function RefinementList(
	props: UseRefinementListProps & { label?: string; queryKey?: string },
) {
	const { items, refine } = useRefinementList({
		attribute: props.attribute,
		limit: 100,
		operator: 'or',
		transformItems: props.transformItems,
		escapeFacetValues: props.escapeFacetValues,
	})
	const [queryParam] = useQueryState<string[]>(
		props.queryKey || props.attribute,
		{
			defaultValue: [],
			parse: (value) => value.split(','),
		},
	)

	const [open, setOpen] = React.useState(false)
	const [values, setValues] = React.useState<string[]>(queryParam)

	const { refine: clear } = useClearRefinements({
		includedAttributes: [props.attribute],
	})

	function handleOnSelect(item: { value: string }) {
		const currentValue = item.value
		if (values.includes(currentValue)) {
			setValues(values.filter((v) => v !== currentValue))
			if (values.length === 1) {
				clear()
			} else {
				const currentRefinement = values.filter((v) => v === currentValue)[0]
				refine(currentRefinement as string)
			}
			setOpen(false)
			return
		}

		setValues([...values, currentValue])
		refine(currentValue)
		setOpen(false)
	}

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
					>
						<span
							className={cn('truncate text-base font-normal capitalize', {
								'text-muted-foreground': !queryParam.length,
							})}
						>
							{queryParam.length
								? queryParam
										.map(
											(value) =>
												items.find((item) => item.value === value)?.label,
										)
										.join(', ')
								: `${props.label}...`}
						</span>
						<ChevronsUpDown className="opacity-50" size={16} />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0">
					<Command>
						<CommandInput placeholder={`Search ${props.label}...`} />
						<CommandList>
							<CommandEmpty>No {props.label} found.</CommandEmpty>
							<CommandGroup>
								{items.map((item) => {
									const isSelected = queryParam.includes(item.value)

									return (
										<CommandItem
											className="capitalize"
											key={item.value}
											value={item.value}
											id={item.value}
											onSelect={() => handleOnSelect(item)}
										>
											{item.label}
											<Check
												className={cn(
													'ml-auto',
													// value === item.label ? 'opacity-100' : 'opacity-0',
													{
														'opacity-100': isSelected,
														'opacity-0': !isSelected,
													},
												)}
											/>
										</CommandItem>
									)
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</>
	)
}
