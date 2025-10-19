'use client'

import * as React from 'react'
import { Check, ChevronDown, Plus, X } from 'lucide-react'

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
} from '../index'
import { cn } from '../utils/cn'

/**
 * Workshop option for selection
 */
export type WorkshopOption = {
	id: string
	label: string
	slug?: string
}

/**
 * Props for WorkshopSelector component
 */
export type WorkshopSelectorProps = {
	/**
	 * Available workshops to select from
	 */
	workshops: WorkshopOption[]
	/**
	 * Currently selected workshop IDs
	 */
	selectedWorkshopIds: string[]
	/**
	 * Called when selection changes
	 */
	onChange: (workshopIds: string[]) => void
	/**
	 * Placeholder text
	 */
	placeholder?: string
	/**
	 * Disabled state
	 */
	disabled?: boolean
}

/**
 * Multi-select workshop selector with search
 *
 * @example
 * ```tsx
 * <WorkshopSelector
 *   workshops={allWorkshops}
 *   selectedWorkshopIds={form.watch('workshops').map(w => w.id)}
 *   onChange={(ids) => {
 *     form.setValue('workshops', ids.map(id => ({ id })))
 *   }}
 * />
 * ```
 */
export function WorkshopSelector({
	workshops,
	selectedWorkshopIds,
	onChange,
	placeholder = 'Select workshops...',
	disabled = false,
}: WorkshopSelectorProps) {
	const [open, setOpen] = React.useState(false)

	const selectedWorkshops = workshops.filter((w) =>
		selectedWorkshopIds.includes(w.id),
	)

	const toggleWorkshop = (workshopId: string) => {
		if (selectedWorkshopIds.includes(workshopId)) {
			onChange(selectedWorkshopIds.filter((id) => id !== workshopId))
		} else {
			onChange([...selectedWorkshopIds, workshopId])
		}
	}

	const removeWorkshop = (workshopId: string, e: React.MouseEvent) => {
		e.stopPropagation()
		onChange(selectedWorkshopIds.filter((id) => id !== workshopId))
	}

	return (
		<div className="space-y-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={disabled}
						className="w-full justify-between"
					>
						{selectedWorkshops.length > 0 ? (
							<span className="truncate">
								{selectedWorkshops.length} workshop
								{selectedWorkshops.length > 1 ? 's' : ''} selected
							</span>
						) : (
							<span className="text-muted-foreground">{placeholder}</span>
						)}
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[400px] p-0" align="start">
					<Command>
						<CommandInput placeholder="Search workshops..." />
						<CommandList>
							<CommandEmpty>No workshops found.</CommandEmpty>
							<CommandGroup>
								{workshops.map((workshop) => {
									const isSelected = selectedWorkshopIds.includes(workshop.id)
									return (
										<CommandItem
											key={workshop.id}
											value={workshop.label}
											onSelect={() => toggleWorkshop(workshop.id)}
										>
											<Check
												className={cn(
													'mr-2 h-4 w-4',
													isSelected ? 'opacity-100' : 'opacity-0',
												)}
											/>
											<div className="flex flex-1 flex-col">
												<span>{workshop.label}</span>
												{workshop.slug && (
													<span className="text-muted-foreground text-xs">
														{workshop.slug}
													</span>
												)}
											</div>
										</CommandItem>
									)
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{/* Selected workshops list */}
			{selectedWorkshops.length > 0 && (
				<div className="flex flex-col gap-2">
					{selectedWorkshops.map((workshop) => (
						<div
							key={workshop.id}
							className="border-border bg-muted flex items-center justify-between rounded-md border px-3 py-2"
						>
							<div className="flex flex-1 flex-col">
								<span className="text-sm font-medium">{workshop.label}</span>
								{workshop.slug && (
									<span className="text-muted-foreground text-xs">
										{workshop.slug}
									</span>
								)}
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={(e) => removeWorkshop(workshop.id, e)}
								className="h-7 px-2"
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
