'use client'

import * as React from 'react'
import { CompactInstructor } from '@/lib/users'
import { cn } from '@/utils/cn'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	Gravatar,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@coursebuilder/ui'

export default function InstructorSelector({
	instructorLoader,
	selectedInstructorId: initialSelectedInstructorId = null,
	onInstructorSelect,
	className,
}: {
	instructorLoader: Promise<CompactInstructor[]>
	selectedInstructorId: string | null
	onInstructorSelect?: (instructor: CompactInstructor) => void
	className?: string
}) {
	const availableInstructors = React.use(instructorLoader)
	const [open, setOpen] = React.useState(false)
	const [selectedInstructor, setSelectedInstructor] =
		React.useState<CompactInstructor | null>(
			initialSelectedInstructorId
				? availableInstructors.find(
						(instructor) => instructor.id === initialSelectedInstructorId,
					) || null
				: null,
		)
	const [inputValue, setInputValue] = React.useState('')

	const handleInstructorSelect = (instructor: CompactInstructor) => {
		setSelectedInstructor(instructor)
		onInstructorSelect?.(instructor)
		setOpen(false)
	}

	const filteredInstructors = availableInstructors.filter((instructor) =>
		instructor.name?.toLowerCase().includes(inputValue.toLowerCase()),
	)

	return (
		<div className={cn('mt-1 w-full max-w-md space-y-2', className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
					>
						{selectedInstructor
							? selectedInstructor.name
							: 'Select instructor...'}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0">
					<Command>
						<CommandInput
							placeholder="Search instructors..."
							value={inputValue}
							onValueChange={setInputValue}
						/>
						<CommandEmpty>No instructor found.</CommandEmpty>
						<CommandGroup className="max-h-64 overflow-auto">
							{filteredInstructors.map((instructor) => (
								<CommandItem
									key={instructor.id}
									onSelect={() => handleInstructorSelect(instructor)}
									className="flex items-center justify-between"
								>
									<div className="flex items-center gap-2">
										<Gravatar
											email={instructor.email}
											default="mp"
											className="h-6 w-6 rounded-full"
										/>
										<span>{instructor.name}</span>
										<span className="text-muted-foreground ml-2 text-sm">
											{instructor.email}
										</span>
									</div>
									<Check
										className={cn(
											'h-4 w-4',
											selectedInstructor?.id === instructor.id
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
