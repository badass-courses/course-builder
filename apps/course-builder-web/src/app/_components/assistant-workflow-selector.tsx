import * as React from 'react'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui'

export function AssistantWorkflowSelector({
	onValueChange,
	initialValue = 'summarize',
	availableWorkflows = [{ value: 'summarize', label: 'Summarize' }],
}: {
	onValueChange: (value?: string) => void
	initialValue?: string
	availableWorkflows?: { value: string; label: string }[]
}) {
	const [open, setOpen] = React.useState(false)
	const [value, setValue] = React.useState(initialValue)

	return (
		<Select
			open={open}
			onOpenChange={setOpen}
			value={value}
			onValueChange={(value) => {
				onValueChange(value)
				setValue(value)
			}}
		>
			<SelectTrigger>
				<SelectValue placeholder="Choose Prompt" />
			</SelectTrigger>
			<SelectContent className="">
				{availableWorkflows.map((workflow) => (
					<SelectItem key={workflow.value} value={workflow.value}>
						{workflow.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
